const C='kayanfit-local-2.3.4';
const CORE=['./','manifest.webmanifest','icons/icon-192.png','icons/apple-touch-icon.png','icons/logo_full.png','img/body_front.png','img/body_back.png'];
// Safari refuses to show a page from the service worker if the stored response was redirected,
// so everything is stored as a fresh, non-redirected copy.
const plain=r=>r.redirected?r.blob().then(b=>new Response(b,{status:r.status,statusText:r.statusText,headers:r.headers})):Promise.resolve(r);
const store=(c,key,r)=>plain(r).then(p=>c.put(key,p));
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>Promise.all(CORE.map(u=>fetch(u,{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error(u+' '+r.status);return store(c,u,r)})))).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==C).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
// end of rest while the app is in the background / the phone is locked (the server sends an empty push)
self.addEventListener('push',e=>{e.waitUntil(self.registration.showNotification('Kayan Fit',{body:'انتهت الراحة ⏱ المجموعة التالية',tag:'kf-rest',renotify:true,icon:'icons/icon-192.png',badge:'icons/icon-192.png'}))});
self.addEventListener('notificationclick',e=>{e.notification.close();e.waitUntil(self.clients.matchAll({type:'window',includeUncontrolled:true}).then(cs=>{for(const c of cs){if('focus' in c)return c.focus()}return self.clients.openWindow('./')}))});
self.addEventListener('fetch',e=>{
  const u=new URL(e.request.url);
  if(e.request.method!=='GET'||u.origin!==location.origin||u.pathname.includes('/api/'))return;
  if(e.request.mode==='navigate'||u.pathname.endsWith('/')||u.pathname.endsWith('index.html')||u.pathname.endsWith('/app.enc')){
    // the encrypted app of the GitHub Pages build behaves like the page: newest first, stored copy offline
    if(u.pathname.endsWith('/app.enc')){e.respondWith(fetch(e.request).then(r=>{if(r.ok){const cp=r.clone();caches.open(C).then(c=>c.put('app.enc',cp))}return r}).catch(()=>caches.match('app.enc').then(hit=>hit||Response.error())));return}
    // the page: network first (always the newest version), the stored copy when offline
    e.respondWith(fetch(e.request).then(r=>{if(r.ok){const cp=r.clone();caches.open(C).then(c=>store(c,'./',cp))}return plain(r)})
      .catch(()=>caches.match('./').then(hit=>hit||Response.error())));return}
  e.respondWith(caches.match(e.request).then(hit=>hit||fetch(e.request).then(r=>{if(r.ok){const cp=r.clone();caches.open(C).then(c=>store(c,e.request,cp))}return r})));
});
