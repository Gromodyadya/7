const CACHE_NAME = 'notes-pwa-cache-v1'; // Версия кэша
const urlsToCache = [
    '/', // Кэшируем корень сайта (обычно index.html)
    '/index.html',
    '/style.css',
    '/script.js',
    '/manifest.json',
    '/icons/icon-192x192.png',
    '/icons/icon-512x512.png'
    // Добавьте сюда другие статичные ресурсы, если они есть
];

// Событие установки Service Worker: кэширование основных ресурсов
self.addEventListener('install', event => {
    console.log('Service Worker: Installing...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Service Worker: Caching app shell');
                return cache.addAll(urlsToCache);
            })
            .then(() => {
                console.log('Service Worker: App shell cached successfully');
                return self.skipWaiting(); // Активировать SW немедленно
            })
            .catch(error => {
                console.error('Service Worker: Failed to cache app shell:', error);
            })
    );
});

// Событие активации Service Worker: очистка старых кэшей
self.addEventListener('activate', event => {
    console.log('Service Worker: Activating...');
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Service Worker: Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            console.log('Service Worker: Activated successfully');
            return self.clients.claim(); // Взять под контроль открытые страницы немедленно
        })
    );
});

// Событие Fetch: перехват запросов и отдача из кэша (стратегия Cache First)
self.addEventListener('fetch', event => {
    console.log('Service Worker: Fetching', event.request.url);
    // Мы не кэшируем запросы API или другие динамические запросы в этом простом примере
    // Только статичные ассеты, определенные в urlsToCache

    // Используем стратегию Cache falling back to Network
    event.respondWith(
        caches.match(event.request) // Пытаемся найти ответ в кэше
            .then(response => {
                if (response) {
                    console.log('Service Worker: Found in cache', event.request.url);
                    return response; // Если нашли в кэше, возвращаем его
                }
                console.log('Service Worker: Not found in cache, fetching from network', event.request.url);
                // Если не нашли в кэше, делаем запрос к сети
                return fetch(event.request)
                    .then(networkResponse => {
                        // Важно: Не кэшируем ответы на POST запросы или другие не-GET запросы
                        // А также не кэшируем непрозрачные ответы (cross-origin без CORS)
                        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic' || event.request.method !== 'GET') {
                            return networkResponse;
                        }

                        // Клонируем ответ, так как тело ответа можно прочитать только один раз
                        const responseToCache = networkResponse.clone();

                        caches.open(CACHE_NAME)
                            .then(cache => {
                                console.log('Service Worker: Caching new resource', event.request.url);
                                cache.put(event.request, responseToCache); // Кэшируем новый ресурс
                            });

                        return networkResponse; // Возвращаем оригинальный ответ браузеру
                    })
                    .catch(error => {
                        console.error('Service Worker: Fetch failed; returning offline page if available or error', error);
                        // Здесь можно вернуть кастомную оффлайн-страницу, если она закэширована
                        // return caches.match('/offline.html');
                        // В данном случае, если ресурс не в кэше и сети нет, будет ошибка сети
                    });
            })
    );
});