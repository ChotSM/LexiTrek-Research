"use strict";
const ROOT = new URL("./", self.location.href);
const PREFIX = `lexitrek-pilot:${ROOT.href}:`;
const CACHE = PREFIX + "1.0.0";
const INDEX = new URL("index.html", ROOT).href;
const FILES = ["index.html","styles.css","app.js","app-icon.svg","manifest.webmanifest","data/lexitrek-vocabulary.json","data/example-quest.json","docs/APP_START_HERE.txt"].map(p=>new URL(p,ROOT).href);
self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(FILES)).then(()=>self.skipWaiting()));
});
self.addEventListener("activate", event => {
  event.waitUntil(caches.keys().then(names=>Promise.all(names.filter(n=>n.startsWith(PREFIX)&&n!==CACHE).map(n=>caches.delete(n)))).then(()=>self.clients.claim()));
});
self.addEventListener("fetch", event => {
  const req=event.request,url=new URL(req.url);
  if(req.method!=="GET"||url.origin!==ROOT.origin||!url.pathname.startsWith(ROOT.pathname))return;
  if(req.mode==="navigate"&&(url.pathname===ROOT.pathname||url.href.split("?")[0]===INDEX)){
    event.respondWith(fetch(req).then(async res=>{if(res.ok)await (await caches.open(CACHE)).put(INDEX,res.clone()).catch(()=>{});return res;}).catch(()=>caches.match(INDEX)));
  } else if(FILES.includes(url.href)) {
    if(url.pathname.endsWith(".json"))event.respondWith(fetch(req).then(async res=>{if(res.ok)await (await caches.open(CACHE)).put(req,res.clone()).catch(()=>{});return res;}).catch(()=>caches.match(req)));
    else event.respondWith(caches.match(req).then(cached=>cached||fetch(req)));
  }
});
