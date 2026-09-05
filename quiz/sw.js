const STATIC_CACHE = 'dynquiz-static-v2';
const RUNTIME_CACHE = 'dynquiz-runtime-v1';
const OFFLINE_URL = './offline.html';

const FILES = ['./index.html', './styles.css', './app.js', './generator.js', './manifest.json', OFFLINE_URL, './icon.svg'];

self.addEventListener('install', e => {
	e.waitUntil(caches.open(STATIC_CACHE).then(cache => cache.addAll(FILES)));
	self.skipWaiting();
});

self.addEventListener('activate', e => {
	e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== STATIC_CACHE && k !== RUNTIME_CACHE).map(k => caches.delete(k)))));
	self.clients.claim();
});

// Helper to serve navigation to offline fallback if needed
self.addEventListener('fetch', event => {
	const request = event.request;

	// Only handle GET requests
	if (request.method !== 'GET') return;

	const url = new URL(request.url);

	// Network-first for templates.json (content updates)
	if (url.pathname.endsWith('/templates.json') || request.url.endsWith('/templates.json')) {
		e.respondWith(
			fetch(request)
				.then(response => {
					const copy = response.clone();
					caches.open(RUNTIME_CACHE).then(c => c.put(request, copy));
					return response;
				})
				.catch(() => caches.match(request))
		);
		return;
	}

	if (request.mode === 'navigate' || (url.origin === location.origin && url.pathname.startsWith('/api'))) {
		event.respondWith(
			fetch(request)
				.then(response => {
					const copy = response.clone();
					caches.open(RUNTIME_CACHE).then(c => c.put(request, copy));
					return response;
				})
				.catch(() => caches.match(request).then(cached => cached || caches.match(OFFLINE_URL)))
		);
		return;
	}

	event.respondWith(
		caches.match(request).then(
			cached =>
				cached ||
				fetch(request)
					.then(resp => {
						if (request.url.startsWith(self.location.origin)) {
							const copy = resp.clone();
							caches.open(RUNTIME_CACHE).then(c => c.put(request, copy));
						}
						return resp;
					})
					.catch(() => {
						if (request.headers.get('accept') && request.headers.get('accept').includes('text/html')) return caches.match(OFFLINE_URL);
					})
		)
	);
});
