var cacheName = "Europe-v2";
var cacheassets = [
    "./index.html",
    './assets/css/style.css'
];

self.addEventListener("install", function (event) {
    console.log('Установлен');
    event.waitUntil(
        caches.open(cacheName).then(function (cache) {
            cache.addAll(cacheassets);
        }).then(function () {
            return self.skipWaiting();
        })
    );
});

self.addEventListener("activate", function (event) {
    console.log("Активирован")
    event.waitUntil(
        (async () => {
            const keys = await caches.keys();
            return keys.map(async (cache) => {
                if (cache !== cacheName) {
                    console.log('Service Worker: Удаляет старый кэш: ' + cache);
                    return await caches.delete(cache);
                }
            })
        })()
    )
});

const FETCH_PRIORITY_URLS = ['/app/index.html', '/app/assets/css/style.css'];

async function cachePriorityThenFetch(event) {
    const cacheResponse = await caches.match(event.request)

    if (cacheResponse) {
        return cacheResponse;
    }

    let response;

    try {
        response = await fetch(event.request);
    } catch (error) {
        return;
    }

    const cache = await caches.open(cacheName);
    cache.put(event.request, response.clone());
    return response;
}

async function fetchPriorityThenCache(event) {
    let response;

    try {
        response = await fetch(event.request);
    } catch (error) {
        const cacheResponse = await caches.match(event.request)
        if (cacheResponse) {
            return cacheResponse;
        }
        return new Response('Нет соединения');
    }

    const cache = await caches.open(cacheName);
    cache.put(event.request, response.clone());
    return response;
}


self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    if (FETCH_PRIORITY_URLS.includes(url.pathname)) {
        event.respondWith(fetchPriorityThenCache(event));
        console.log('fetch' + url.pathname);
        return;
    }

    event.respondWith(cachePriorityThenFetch(event));
});