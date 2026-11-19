/* PLE Builder for WordPress pages: connects the editor to the REST API and the Media Library. */
(function () {
	'use strict';
	var cfg = window.PLE_BUILDER, C = window.PLECore;
	if (!cfg) return;
	var layout = cfg.layout || 'theme';
	var tree = cfg.tree;
	if (!tree || !tree.children) { tree = C.emptyPage(); }
	/* Recover an unsaved draft after a crash or lost connection. */
	var key = 'ple-draft-' + cfg.id;
	try {
		var d = JSON.parse(localStorage.getItem(key) || 'null');
		if (d && d.tree && confirm('PLE found unsaved changes from ' + new Date(d.at).toLocaleString() + '. Restore them?')) { tree = d.tree; }
		else localStorage.removeItem(key);
	} catch (e) { }

	var frame;
	var ed = new PLEEditor({
		mount: document.getElementById('ple-app'),
		tree: tree,
		title: cfg.title,
		brand: 'PLE',
		storeKey: key,
		exitUrl: cfg.exit,
		exitLabel: 'Dashboard',
		sideNote: cfg.status !== 'publish' ? 'This page is a <b>' + cfg.status + '</b>. Use <b>Save</b> to keep working, or <b>Publish</b> when it is ready.' : '',
		pageFields: [{ k: 'layout', l: 'Page layout', t: 'select', o: [['theme', 'Use my theme header and footer'], ['canvas', 'Blank canvas (only what I build)']], get: function () { return layout; }, set: function (v) { layout = v; } }],
		pickImage: function (done) {
			if (!window.wp || !wp.media) return alert('The Media Library is not available.');
			if (!frame) frame = wp.media({ title: 'Choose a picture', library: { type: 'image' }, button: { text: 'Use this picture' }, multiple: false });
			frame.off('select').on('select', function () {
				var a = frame.state().get('selection').first().toJSON();
				var url = (a.sizes && (a.sizes.large || a.sizes.full) || a).url;
				done(url);
			});
			frame.open();
		},
		extraButtons: cfg.status !== 'publish' ? [{ text: 'Publish', title: 'Save and publish', icon: 'globe', cls: 'pe-pub', on: function (e) { save(e.data(), true).then(function () { e.dirty = false; e.toast('Published', 'ok'); setTimeout(function () { location.reload(); }, 700); }).catch(function (x) { e.toast(x.message, 'err'); }); } }] : [],
		preview: function (e) {
			if (e.dirty) { e.save(); setTimeout(function () { window.open(cfg.view, '_blank'); }, 900); }
			else window.open(cfg.view, '_blank');
		},
		save: function (data) { return save(data, false).then(function () { return 'Saved. Your page is up to date.'; }); }
	});

	function save(data, publish) {
		return fetch(cfg.rest, {
			method: 'POST', credentials: 'same-origin',
			headers: { 'Content-Type': 'application/json', 'X-WP-Nonce': cfg.nonce },
			body: JSON.stringify({ tree: data.tree, html: data.html, css: data.css, title: data.title, layout: layout, publish: publish ? 1 : 0 })
		}).then(function (r) {
			return r.json().then(function (j) {
				if (!r.ok) throw new Error(j && j.message ? j.message : 'Could not save (' + r.status + ').');
				if (j.view) cfg.view = j.view;
				return j;
			});
		});
	}
	window.PLE_ED = ed;
})();
