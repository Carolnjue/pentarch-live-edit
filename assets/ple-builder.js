/* PLE Builder for WordPress pages: connects the editor to the REST API, the Media Library and the real page. */
(function () {
	'use strict';
	var cfg = window.PLE_BUILDER, C = window.PLECore;
	if (!cfg) return;
	var layout = cfg.layout || 'theme';
	var native = !cfg.tree && cfg.source;
	var tree = native ? C.parseNative(cfg.source) : cfg.tree;
	if (!tree || !tree.children) tree = C.emptyPage();
	var mount = document.getElementById('ple-app');
	mount.innerHTML = '<div style="position:fixed;inset:0;display:grid;place-items:center;background:#0b1220;color:#cbd5e1;font:15px system-ui,sans-serif"><div style="text-align:center"><div style="width:42px;height:42px;margin:0 auto 14px;border-radius:50%;border:4px solid rgba(96,165,250,.25);border-top-color:#60a5fa;animation:plesp .8s linear infinite"></div>Opening your page in PLE\u2026</div></div><style>@keyframes plesp{to{transform:rotate(360deg)}}</style>';

	/* Load the real page (theme, header, footer, styles and scripts) to use as the canvas. */
	var getTemplate = fetch(cfg.canvas, { credentials: 'same-origin', cache: 'no-store' })
		.then(function (r) { return r.ok ? r.text() : ''; })
		.then(function (html) { return html.indexOf('<!--PLE-ROOT-->') > -1 ? html : ''; })
		.catch(function () { return ''; });

	getTemplate.then(function (tpl) {
		/* Recover an unsaved draft after a crash or lost connection. */
		var key = 'ple-draft-' + cfg.id;
		try {
			var d = JSON.parse(localStorage.getItem(key) || 'null');
			if (d && d.tree && d.tree.props && !!d.tree.props.native === !!native && confirm('PLE found unsaved changes from ' + new Date(d.at).toLocaleString() + '. Restore them?')) { tree = d.tree; }
			else localStorage.removeItem(key);
		} catch (e) { }
		var frame;
		var ed = new PLEEditor({
			mount: mount,
			tree: tree,
			title: cfg.title,
			brand: 'PLE',
			storeKey: key,
			exitUrl: cfg.exit,
			exitLabel: 'Dashboard',
			pageTemplate: tpl || '',
			runtime: cfg.runtime,
			sideNote: cfg.status !== 'publish' ? 'This page is a <b>' + cfg.status + '</b>. Use <b>Save</b> to keep working, or <b>Publish</b> when it is ready.' : '',
			pageFields: native ? [] : [{ k: 'layout', l: 'Page layout', t: 'select', o: [['theme', 'Use my theme header and footer'], ['canvas', 'Blank canvas (only what I build)']], get: function () { return layout; }, set: function (v) { layout = v; } }],
			pickImage: function (done) {
				if (!window.wp || !wp.media) return alert('The Media Library is not available.');
				if (!frame) frame = wp.media({ title: 'Choose a picture', library: { type: 'image' }, button: { text: 'Use this picture' }, multiple: false });
				frame.off('select').on('select', function () {
					var a = frame.state().get('selection').first().toJSON();
					done((a.sizes && (a.sizes.large || a.sizes.full) || a).url);
				});
				frame.open();
			},
			extraButtons: cfg.status !== 'publish' ? [{ text: 'Publish', title: 'Save and publish', icon: 'globe', cls: 'pe-pub', on: function (e) { save(e.data(), true).then(function () { e.dirty = false; e.toast('Published', 'ok'); setTimeout(function () { location.reload(); }, 700); }).catch(function (x) { e.toast(x.message, 'err'); }); } }] : [],
			preview: function (e) {
				if (e.dirty) { e.save(); setTimeout(function () { window.open(cfg.view, '_blank'); }, 1200); }
				else window.open(cfg.view, '_blank');
			},
			save: function (data) { return save(data, false).then(function () { return 'Saved. Your live page is up to date.'; }); }
		});
		if (native) { ed.showTab('layers'); }
		window.PLE_ED = ed;
	});

	/* Only send Live Blocks that really changed, so untouched blocks keep their exact code. */
	var norm = function (h) {
		var t = document.createElement('template'); t.innerHTML = h || '';
		(function w(n) { [].slice.call(n.childNodes).forEach(function (c) { if (c.nodeType === 3 && !c.data.trim()) c.remove(); else if (c.nodeType === 1) w(c); }); })(t.content);
		return t.innerHTML.replace(/\s+/g, ' ').replace(/> </g, '><').trim();
	};
	var original = {};
	if (cfg.source && cfg.source.blocks) Object.keys(cfg.source.blocks).forEach(function (k) { var b = cfg.source.blocks[k]; original[b.id] = norm(b.content); });
	function save(data, publish) {
		if (data.native) {
			Object.keys(data.native.blocks).forEach(function (id) {
				var n = norm(data.native.blocks[id]);
				if (original[id] !== undefined && original[id] === n) delete data.native.blocks[id];
				else original[id] = n;
			});
		}
		var body = data.native
			? { native: data.native, title: data.title, publish: publish ? 1 : 0 }
			: { tree: data.tree, html: data.html, css: data.css, title: data.title, layout: layout, publish: publish ? 1 : 0 };
		return fetch(cfg.rest, {
			method: 'POST', credentials: 'same-origin',
			headers: { 'Content-Type': 'application/json', 'X-WP-Nonce': cfg.nonce },
			body: JSON.stringify(body)
		}).then(function (r) {
			return r.json().then(function (j) {
				if (!r.ok) throw new Error(j && j.message ? j.message : 'Could not save (' + r.status + ').');
				if (j.view) cfg.view = j.view;
				return j;
			});
		});
	}
})();
