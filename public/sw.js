const VERSION='2af4e814b884d8ff', PREFIX='teatime-', CACHE=PREFIX+VERSION;
const CORE=['/offline.html','/offline-app.js','/offline-menu.json','/images/teatime-logo2.png','/icons/app-192.png','/icons/app-512.png'];
const PUBLIC=new Set(['/','/menu/','/contact/','/our-place/','/app/','/rewards/terms/']);
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE))));
self.addEventListener('activate',event=>event.waitUntil((async()=>{for(const key of await caches.keys())if(key.startsWith(PREFIX)&&key!==CACHE)await caches.delete(key);await self.clients.claim();})()));
self.addEventListener('message',event=>{if(event.data?.type==='SKIP_WAITING')self.skipWaiting();});
async function store(request,response,limit=200){if(!response.ok||response.type==='opaque')return;const cache=await caches.open(CACHE);await cache.put(request,response.clone());const keys=await cache.keys();const optional=keys.filter(k=>!CORE.includes(new URL(k.url).pathname));for(const key of optional.slice(0,Math.max(0,optional.length-limit)))await cache.delete(key);}
self.addEventListener('fetch',event=>{
 const req=event.request,url=new URL(req.url);if(req.method!=='GET'||url.origin!==self.location.origin)return;
 if(req.headers.get('RSC')||url.search||url.pathname.startsWith('/rewards/')&&!url.pathname.startsWith('/rewards/terms/'))return;
 const path=url.pathname.endsWith('/')?url.pathname:url.pathname+'/';
 if(req.mode==='navigate'&&PUBLIC.has(path)){event.respondWith((async()=>{try{const response=await fetch(req,{signal:AbortSignal.timeout(6500)});if(response.ok){event.waitUntil(store(req,response));return response;}throw new Error('Unavailable');}catch{return await caches.match(req)||await caches.match('/offline.html')||Response.error();}})());return;}
 if(CORE.includes(url.pathname)||url.pathname.startsWith('/_next/static/')||url.pathname.startsWith('/images/')){event.respondWith((async()=>{const hit=await caches.match(req);if(hit)return hit;const response=await fetch(req);event.waitUntil(store(req,response));return response;})());}
});
