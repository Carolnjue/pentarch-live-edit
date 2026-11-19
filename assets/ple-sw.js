/* PLE Studio service worker: works offline on weak connections. */
var CACHE = 'ple-studio-__VERSION__';
var ASSETS = '__ASSETS__';
self.addEventListener('install', function (e) {
	e.waitUntil(caches.open(CACHE).then(function (c) {
		return c.addAll(['ple-core.js', 'ple-editor.js', 'ple-widgets.js', 'ple-runtime.js', 'ple-runtime.css', 'ple-lessons.js', 'ple-academy-content.js', 'ple-academy.js', 'ple-studio.js', 'ple-editor.css', 'ple-studio.css', 'ple-academy.css', 'icon.svg'].map(function (f) { return ASSETS + f; })).catch(function () { });
	}).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
	e.waitUntil(caches.keys().then(function (keys) {
		return Promise.all(keys.filter(function (k) { return k.indexOf('ple-studio-') === 0 && k !== CACHE; }).map(function (k) { return caches.delete(k); }));
	}).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
	var req = e.request, url = new URL(req.url);
	if (req.method !== 'GET' || url.origin !== location.origin) return;
	/* The app page and API: network first, cached copy when offline. */
	if (req.mode === 'navigate' || url.pathname.indexOf('/wp-json/ple/v2/studio/') > -1 || url.search.indexOf('rest_route=/ple/v2/studio') > -1) {
		e.respondWith(fetch(req).then(function (res) {
			if (res.ok && req.mode === 'navigate') { var copy = res.clone(); caches.open(CACHE).then(function (c) { c.put(req, copy); }); }
			return res;
		}).catch(function () { return caches.match(req, { ignoreSearch: req.mode === 'navigate' }); }));
		return;
	}
	/* Plugin files: cache first, refresh in the background. */
	if (url.href.indexOf(ASSETS) === 0) {
		e.respondWith(caches.open(CACHE).then(function (c) {
			return c.match(req, { ignoreSearch: true }).then(function (hit) {
				var net = fetch(req).then(function (res) { if (res.ok) c.put(req, res.clone()); return res; }).catch(function () { return hit; });
				return hit || net;
			});
		}));
	}
});
