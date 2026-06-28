const CACHE = 'chickenday-v1.0.3'; // [DIUBAH] dinaikkan agar perangkat ter-install dapat update (cache saldo awal, reminder backup, validasi nominal)
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './xlsx.full.min.js',
  './icon-192.png',
  './icon-512.png'
];

// Install: cache semua aset inti
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

// Activate: bersihkan cache versi lama
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch: cache-first untuk aset lokal, network-first (dengan cache fallback) untuk eksternal
// (mis. Google Fonts, ikon Flaticon CDN — lihat spec §13: dipasang via CDN, jadi
//  perlu sempat online sekali agar ikon ikut tersimpan dan tetap tampil saat offline)
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (url.origin === location.origin) {
    e.respondWith(
      caches.match(e.request).then(hit => hit || fetch(e.request).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy));
        return res;
      }).catch(() => caches.match('./index.html')))
    );
  } else {
    // Aset eksternal (font, ikon Flaticon): coba network dulu, simpan ke cache bila sukses,
    // fallback ke cache bila offline/gagal
    e.respondWith(
      fetch(e.request).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy));
        return res;
      }).catch(() => caches.match(e.request))
    );
  }
});
