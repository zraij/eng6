/* Service Worker — English 6 (PWA)
   يخلي البرنامج قابل للتثبيت كتطبيق. الصفحة تُجلب من الشبكة دائمًا أولاً
   (حتى توصل التحديثات فورًا)، والنسخة المحفوظة تُستخدم فقط عند انقطاع الإنترنت.
   ملفات الحسابات (users.json) وطلبات Google وأي رابط خارجي لا تُخزَّن أبدًا. */
const CACHE = 'eng6-pwa-v1';
const SHELL = ['./', './index.html', './install.html', './manifest.webmanifest',
  './icons/icon-192.png', './icons/icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(
    keys.filter(k => k.startsWith('eng6-pwa-') && k !== CACHE).map(k => caches.delete(k))
  )).then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;           // Google Script, ipify...
  if (!url.pathname.startsWith(new URL('./', self.location).pathname)) return;
  if (url.pathname.endsWith('users.json')) return;            // الحسابات: شبكة فقط
  if (url.pathname.endsWith('admin.html')) return;            // لوحة الإدارة: شبكة فقط

  e.respondWith(
    fetch(req).then(res => {
      if (res.ok && res.type === 'basic') {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy));
      }
      return res;
    }).catch(() => caches.match(req, { ignoreSearch: true })
      .then(r => r || (req.mode === 'navigate' ? caches.match('./index.html') : undefined)))
  );
});
