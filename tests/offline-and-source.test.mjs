import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
const root=path.resolve(new URL('..',import.meta.url).pathname);
test('offline worker uses only packaged original resources at a project subpath',async()=>{
  const handlers={},stores=new Map(),base='https://example.test/LexiTrek-Research/';
  function cache(name){if(!stores.has(name))stores.set(name,new Map());const m=stores.get(name);return {addAll:async files=>{for(const u of files){const rel=new URL(u).pathname.replace('/LexiTrek-Research/','');m.set(u,new Response(await fs.readFile(path.join(root,rel))));}},put:async(req,res)=>m.set(typeof req==='string'?req:req.url,res),match:async req=>m.get(typeof req==='string'?req:req.url)?.clone()};}
  const caches={open:async n=>cache(n),keys:async()=>[...stores.keys()],delete:async n=>stores.delete(n),match:async req=>{for(const name of stores.keys()){const r=await cache(name).match(req);if(r)return r;}}};
  const scope={self:{location:{href:base+'service-worker.js'},addEventListener:(n,fn)=>handlers[n]=fn,skipWaiting:async()=>{},clients:{claim:async()=>{}}},URL,Promise,caches,fetch:async()=>{throw Error('offline');}};
  vm.runInNewContext(await fs.readFile(path.join(root,'service-worker.js'),'utf8'),scope);
  let promise;handlers.install({waitUntil:p=>promise=p});await promise;
  const current=[...stores.keys()][0];assert.equal(stores.get(current).size,12);
  stores.set('lexitrek-pilot:'+base+':1.0.0',new Map());stores.set('other-project-cache',new Map());
  handlers.activate({waitUntil:p=>promise=p});await promise;
  assert.ok(!stores.has('lexitrek-pilot:'+base+':1.0.0'));assert.ok(stores.has('other-project-cache'));
  async function fetchOffline(url,mode='cors'){let response;handlers.fetch({request:{url,method:'GET',mode},respondWith:p=>response=p});return response?await response:null;}
  assert.match(await (await fetchOffline(base,'navigate')).text(),/Welcome Island/);
  const data=await (await fetchOffline(base+'data/research-pack.json')).json();assert.equal(data.words.length,32);assert.equal(data.status,'draft');
  assert.ok(await fetchOffline(base+'research-core.mjs'));
  assert.equal(await fetchOffline('https://example.test/unrelated/','navigate'),null);
});
test('client has no DELIMa connection, old reservoir dependency or remote assets',async()=>{
  for(const f of ['index.html','app.js','research-core.mjs','quest-engine.mjs','quest-ui.mjs','quest-styles.css','styles.css','service-worker.js']){
    const text=await fs.readFile(path.join(root,f),'utf8');assert.ok(!/https?:\/\//.test(text),f+' has no remote runtime URL');assert.ok(!text.includes('lexitrek-vocabulary.json'),f+' excludes old source data');assert.ok(!/delima/i.test(text),f+' excludes portal integration');
  }
  const html=await fs.readFile(path.join(root,'index.html'),'utf8');for(const m of html.matchAll(/(?:href|src)="\.\/([^"#]+)"/g))assert.ok((await fs.stat(path.join(root,m[1]))).isFile());
  assert.match(html,/Content-Security-Policy/);
});
