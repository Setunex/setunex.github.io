const STATIC_CACHE = 'studybuddy-static-v6';
const RUNTIME_CACHE = 'studybuddy-runtime-v2';
const OFFLINE_URL = './offline.html';

const FILES = [
	'./',
	'./index.html',
	'./quiz.html',
	'./styles.css',
	'./app.js',
	'./generator.js',
	'./manifest.json',
	OFFLINE_URL,
	'./icon.svg',
	// Bright Steps (flattened from ex-cards/ subfolder)
	'./bright-steps.html',
	'./bright-steps.css',
	'./bright-steps.js',
	'./bright-steps-generator.js',
	'./cards-quiz.html',
	'./abc-adventure-fullscreen.html',
	'./english-quiz-advanced.html',
	'./noun-verb-quiz.html',
	'./subject-quiz.html',
	'./review.html',
	'./sample_data.json'
];

self.addEventListener('install', e => {
	e.waitUntil(
		caches.open(STATIC_CACHE).then(cache =>
			// cache.add on each URL individually so one 404 does not abort install
			Promise.all(FILES.map(u => cache.add(u).catch(err => console.warn('SW precache skip', u, err))))
		)
	);
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
		event.respondWith(
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
