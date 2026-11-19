const ROOT=new URL('./',self.location.href);
const PREFIX='lexitrek-research:'+ROOT.href+':';
const CACHE=PREFIX+'2.1.0-quest-rehearsal.1';
const INDEX=new URL('index.html',ROOT).href;
const FILES=['index.html','styles.css','quest-styles.css','quest-engine.mjs','quest-ui.mjs','app.js','research-core.mjs','release-build.mjs','app-icon.svg','manifest.webmanifest','data/research-pack.json','docs/RESEARCH_GUIDE.txt'].map(p=>new URL(p,ROOT).href);
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(names=>Promise.all(names.filter(n=>(n.startsWith(PREFIX)&&n!==CACHE)||n.startsWith('lexitrek-pilot:'+ROOT.href+':')).map(n=>caches.delete(n)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
  const req=event.request,u=new URL(req.url);if(req.method!=='GET'||u.origin!==ROOT.origin||!u.pathname.startsWith(ROOT.pathname))return;
  if(req.mode==='navigate'&&(u.pathname===ROOT.pathname||u.href.split('?')[0]===INDEX))event.respondWith(caches.match(INDEX).then(c=>c||fetch(req)));
  else if(FILES.includes(u.href))event.respondWith(caches.match(req).then(c=>c||fetch(req)));
});
