const CACHE_NAME = 'remotepc-v6';
const ASSETS = [
  './',
  './index.html',
  './manifest.json'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS).catch(() => {});
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((k) => {
          if (k !== CACHE_NAME) return caches.delete(k);
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  const url = e.request.url;
  // Bỏ qua tất cả API và dữ liệu link động (luôn lấy trực tiếp từ mạng)
  if (
    url.includes('/api/') || 
    url.includes('active_link.json') || 
    url.includes('api.github.com') || 
    url.includes('raw.githubusercontent.com') || 
    url.includes('trycloudflare.com')
  ) {
    return;
  }

  // Đối với index.html và assets: Ưu tiên mạng trước, lỗi mới lấy từ cache
  e.respondWith(
    fetch(e.request)
      .then((response) => {
        if (response && response.status === 200) {
          const respClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(e.request, respClone));
        }
        return response;
      })
      .catch(() => {
        return caches.match(e.request).then((res) => {
          return res || caches.match('./index.html') || caches.match('./');
        });
      })
  );
});
