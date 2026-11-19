/*!
 * PLE Editor: visual page builder UI (desktop sidebars, phone bottom sheets).
 * Requires ple-core.js. Used by the WordPress builder and by PLE Studio.
 */
(function (global) {
	'use strict';
	var C = global.PLECore, h = C.h, esc = C.esc, W = C.W;

	var TYPE_ICON = { page: 'home', section: 'square', row: 'rows', column: 'columns' };
	var label = function (n) {
		if (n.props && n.props.label) return n.props.label;
		var w = W[n.type], base = w ? w.label : n.type;
		var p = n.props || {}, txt = p.text || p.title || p.brand || p.q || (p.html ? p.html.replace(/<[^>]+>/g, ' ') : '') || p.alt || '';
		txt = String(txt).replace(/\s+/g, ' ').trim();
		return txt && !C.isContainer(n.type) ? base + ': ' + (txt.length > 26 ? txt.slice(0, 26) + '\u2026' : txt) : base;
	};
	var ROLES = { section: ['Section', 'square'], row: ['Row', 'rows'], column: ['Column', 'columns'], box: ['Box', 'square'], heading: ['Heading', 'heading'], text: ['Text', 'type'], button: ['Button', 'arrow'], link: ['Link', 'arrow'], image: ['Image', 'image'], icon: ['Icon', 'star'], list: ['List', 'list'], item: ['List item', 'minus'], css: ['Styles (CSS)', 'code'], script: ['Script', 'code'], media: ['Video / embed', 'video'], form: ['Form', 'mail'], field: ['Form field', 'type'], table: ['Table', 'rows'], block: ['Live Block', 'home'], code: ['Code', 'code'], comment: ['Note', 'code'] };
	var TEXT_LEAF = /^(h[1-6]|p|li|a|button|span|label|figcaption|dt|dd|td|th|blockquote|strong|em|small|b|i|cite|summary|legend|caption|q|time|div|address|pre|code)$/i;
	var leafRole = function (n) {
		var t = n.props.tag, cls = (n.props.attrs && n.props.attrs['class']) || '';
		if (/^h[1-6]$/.test(t)) return 'heading';
		if (t === 'img' || t === 'picture') return 'image';
		if (t === 'svg') return 'icon';
		if (t === 'style') return 'css';
		if (t === 'script' || t === 'noscript' || t === 'template') return 'script';
		if (/^(iframe|video|audio|canvas|object)$/.test(t)) return 'media';
		if (/^(input|select|textarea)$/.test(t)) return 'field';
		if (t === 'table') return 'table';
		if (t === 'button' || (t === 'a' && /btn|button|cta/i.test(cls))) return 'button';
		if (t === 'a') return 'link';
		if (t === 'li') return 'item';
		return 'text';
	};
	var DEVICES = [['d', 'Desktop', '100%'], ['t', 'Tablet', '768px'], ['m', 'Phone', '390px']];
	var SWATCHES = ['#0f172a', '#ffffff', '#f8fafc', '#2563eb', '#1d4ed8', '#0ea5e9', '#16a34a', '#f59e0b', '#dc2626', '#7c3aed', '#db2777', '#475569'];

	function Editor(opts) {
		if (opts && opts.runtime) C.RUNTIME = opts.runtime;
		this.o = Object.assign({ title: 'Untitled page', brand: 'PLE', save: null, exitUrl: '', exitLabel: 'Exit', pickImage: null, upload: null, storeKey: '', extraButtons: [], onChange: null, sideNote: '' }, opts);
		this.tree = this.o.tree && this.o.tree.children ? C.clone(this.o.tree) : C.starterPage();
		this.sel = null; this.device = 'd'; this.tab = 'add'; this.etab = 'content';
		this.past = []; this.future = []; this.dirty = false; this.collapsed = {};
		this.build();
		this.commit(true);
		this.renderAll();
	}
	var P = Editor.prototype;

	/* ------------------------------------------------------------ shell */
	P.build = function () {
		var self = this, o = this.o;
		var btn = function (cls, title, iconName, on, text) {
			return h('button', { type: 'button', class: 'pe-b ' + cls, title: title, 'aria-label': title, onclick: on }, C.icon(iconName, 18) + (text ? '<span>' + text + '</span>' : ''));
		};
		this.el = h('div', { class: 'pe', 'data-device': 'd' });
		var top = h('header', { class: 'pe-top' });
		if (o.exitUrl || o.onExit) top.appendChild(h('a', { class: 'pe-b pe-exit', href: o.exitUrl || '#', title: o.exitLabel, onclick: function (e) { if (o.onExit) { e.preventDefault(); o.onExit(); } else if (self.dirty && !confirm('You have unsaved changes. Leave anyway?')) e.preventDefault(); } }, '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg><span>' + esc(o.exitLabel) + '</span>'));
		top.appendChild(h('span', { class: 'pe-logo' }, '<b>' + esc(o.brand) + '</b>'));
		this.titleIn = h('input', { class: 'pe-title', value: o.title, 'aria-label': 'Page title', oninput: function () { self.o.title = this.value; self.touch(); } });
		top.appendChild(this.titleIn);
		var dev = h('div', { class: 'pe-devs', role: 'group', 'aria-label': 'Preview size' });
		DEVICES.forEach(function (d) {
			dev.appendChild(h('button', { type: 'button', class: 'pe-dev' + (d[0] === 'd' ? ' on' : ''), 'data-d': d[0], title: d[1] + ' view', onclick: function () { self.setDevice(d[0]); } }, ({ d: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="4" width="20" height="13" rx="2"/><path d="M8 21h8M12 17v4"/></svg>', t: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="2" width="14" height="20" rx="2"/><path d="M11 18h2"/></svg>', m: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 18h2"/></svg>' })[d[0]]));
		});
		top.appendChild(dev);
		var acts = h('div', { class: 'pe-acts' });
		this.undoB = btn('pe-undo', 'Undo (Ctrl+Z)', 'arrow', function () { self.undo(); });
		this.redoB = btn('pe-redo', 'Redo (Ctrl+Y)', 'arrow', function () { self.redo(); });
		acts.appendChild(this.undoB); acts.appendChild(this.redoB);
		acts.appendChild(btn('pe-codeb', 'Show the code', 'code', function () { self.toggleCode(); }, 'Code'));
		acts.appendChild(btn('pe-prev', 'Preview in a new tab', 'globe', function () { self.preview(); }, 'Preview'));
		(o.extraButtons || []).forEach(function (b) { acts.appendChild(btn(b.cls || '', b.title, b.icon || 'star', function () { b.on(self); }, b.text)); });
		if (o.save) { this.saveB = h('button', { type: 'button', class: 'pe-save', onclick: function () { self.save(); } }, 'Save'); acts.appendChild(this.saveB); }
		top.appendChild(acts);
		this.el.appendChild(top);

		var main = h('div', { class: 'pe-main' });
		this.side = h('aside', { class: 'pe-side', 'aria-label': 'Editor panel' });
		var tabs = h('div', { class: 'pe-tabs', role: 'tablist' });
		[['add', 'Add'], ['layers', 'Layers'], ['edit', 'Edit'], ['page', 'Page']].forEach(function (t) {
			tabs.appendChild(h('button', { type: 'button', role: 'tab', class: 'pe-tab', 'data-t': t[0], onclick: function () { self.showTab(t[0]); } }, t[1]));
		});
		this.side.appendChild(h('div', { class: 'pe-grab', onclick: function () { self.closeSheet(); } }, '<i></i>'));
		this.side.appendChild(tabs);
		this.panel = h('div', { class: 'pe-panel' });
		this.side.appendChild(this.panel);
		main.appendChild(this.side);

		this.stage = h('div', { class: 'pe-stage' });
		this.frameWrap = h('div', { class: 'pe-fw' });
		this.frame = h('iframe', { class: 'pe-frame', title: 'Page canvas' });
		this.frameWrap.appendChild(this.frame);
		this.stage.appendChild(this.frameWrap);
		main.appendChild(this.stage);

		this.codeP = h('aside', { class: 'pe-codep', hidden: true, 'aria-label': 'Code' });
		main.appendChild(this.codeP);
		this.el.appendChild(main);

		var dock = h('nav', { class: 'pe-dock', 'aria-label': 'Editor tools' });
		[['add', 'Add', 'star'], ['layers', 'Layers', 'rows'], ['edit', 'Edit', 'bolt'], ['page', 'Page', 'home'], ['code', 'Code', 'code']].forEach(function (d) {
			dock.appendChild(h('button', { type: 'button', 'data-t': d[0], onclick: function () { if (d[0] === 'code') self.toggleCode(); else self.showTab(d[0], true); } }, C.icon(d[2], 20) + '<span>' + d[1] + '</span>'));
		});
		this.el.appendChild(dock);
		this.toastEl = h('div', { class: 'pe-toast', role: 'status', 'aria-live': 'polite' });
		this.el.appendChild(this.toastEl);
		this.scrim = h('div', { class: 'pe-scrim', onclick: function () { self.closeSheet(); } });
		this.el.appendChild(this.scrim);

		this.o.mount.innerHTML = '';
		this.o.mount.appendChild(this.el);
		this.initFrame();
		this.keys();
		this.showTab('add');
		window.addEventListener('beforeunload', function (e) { if (self.dirty && self.o.save && document.body.contains(self.el)) { e.preventDefault(); e.returnValue = ''; } });
	};
	P.isPhone = function () { return window.matchMedia('(max-width: 900px)').matches; };
	P.toast = function (msg, kind) {
		var t = this.toastEl; t.textContent = msg; t.className = 'pe-toast on ' + (kind || '');
		clearTimeout(this._tt); this._tt = setTimeout(function () { t.className = 'pe-toast'; }, 2600);
	};
	P.showTab = function (t, fromDock) {
		this.tab = t;
		this.side.querySelectorAll('.pe-tab').forEach(function (b) { b.classList.toggle('on', b.dataset.t === t); });
		this.renderPanel();
		if (fromDock) this.openSheet();
		else if (this.el.classList.contains('sheet')) this.openSheet();
	};
	P.openSheet = function () { this.el.classList.add('sheet'); this.el.querySelectorAll('.pe-dock button').forEach(function (b) { b.classList.toggle('on', b.dataset.t === this.tab); }, this); };
	P.closeSheet = function () { this.el.classList.remove('sheet'); this.el.querySelectorAll('.pe-dock button').forEach(function (b) { b.classList.remove('on'); }); };
	P.setDevice = function (d) {
		this.device = d; this.el.dataset.device = d;
		this.el.querySelectorAll('.pe-dev').forEach(function (b) { b.classList.toggle('on', b.dataset.d === d); });
		var w = { d: '100%', t: '768px', m: '390px' }[d];
		this.frameWrap.style.width = w;
		if (this.tab === 'edit') this.renderPanel();
		var self = this; setTimeout(function () { self.placeToolbar(); }, 320);
	};

	/* ------------------------------------------------------------ canvas */
	P.initFrame = function () {
		var self = this;
		this.frames = [this.frame];
		if (this.o.pageTemplate) {
			var f2 = h('iframe', { class: 'pe-frame pe-back', title: 'Page canvas' });
			this.frameWrap.appendChild(f2); this.frames.push(f2); this.active = 0;
			this.frameWrap.classList.add('pe-tpl');
			this.renderCanvas();
			return;
		}
		var rt = this.o.runtime || {};
		var doc = '<!DOCTYPE html><html data-ple-editing><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' + (rt.css ? '<link rel="stylesheet" href="' + esc(rt.css) + '">' : '') + '<style id="pe-page"></style><style>' + EDIT_CSS + '</style></head><body><div id="pe-root"></div><div id="pe-tb" hidden></div><div id="pe-drop" hidden></div>' + (rt.js ? '<script src="' + esc(rt.js) + '"><\/script>' : '') + '</body></html>';
		this.frame.addEventListener('load', function () {
			self.doc = self.frame.contentDocument;
			self.win = self.frame.contentWindow;
			self.root = self.doc.getElementById('pe-root');
			self.styleEl = self.doc.getElementById('pe-page');
			self.tb = self.doc.getElementById('pe-tb');
			self.dropEl = self.doc.getElementById('pe-drop');
			self.bindFrame();
			self.renderCanvas();
		});
		this.frame.srcdoc = doc;
	};
	P.bindFrame = function () {
		var self = this, d = this.doc;
		d.addEventListener('submit', function (e) { e.preventDefault(); }, true);
		d.addEventListener('click', function (e) {
			if (e.target.closest('#pe-tb')) return;
			if (self.o.pageTemplate && !e.target.closest('[contenteditable=true]')) { e.preventDefault(); e.stopPropagation(); }
			var a = e.target.closest('a,label,input[type=checkbox]');
			if (a && !e.target.closest('[contenteditable=true]') && !a.classList.contains('ple-nav-h') && a.tagName !== 'INPUT') e.preventDefault();
			var drop = e.target.closest('[data-drop]');
			if (drop) { self.select(drop.dataset.drop); self.showTab('add', self.isPhone()); return; }
			var n = e.target.closest('[data-ple]');
			if (!n) { self.select(null); return; }
			var id = n.dataset.ple;
			if (self.sel === id && self.isPhone()) { self.startInline(id); return; }
			self.select(id);
			if (self.isPhone()) self.showTab('edit');
		}, true);
		d.addEventListener('dblclick', function (e) {
			var n = e.target.closest('[data-ple]'); if (n) self.startInline(n.dataset.ple);
		});
		d.addEventListener('keydown', function (e) { self.onKey(e, true); });
		this.win.addEventListener('scroll', function () { self.placeToolbar(); });
		this.win.addEventListener('resize', function () { self.placeToolbar(); });
		/* Drag widgets from the Add panel onto the canvas (desktop). */
		d.addEventListener('dragover', function (e) {
			if (!self.dragType) return; e.preventDefault();
			var t = self.dropTarget(e); self.showDrop(t);
		});
		d.addEventListener('dragleave', function (e) { if (!e.relatedTarget) self.dropEl.hidden = true; });
		d.addEventListener('drop', function (e) {
			if (!self.dragType) return; e.preventDefault(); self.dropEl.hidden = true;
			var t = self.dropTarget(e); if (t) self.insertAt(self.dragType, t);
			self.dragType = null;
		});
	};
	P.dropTarget = function (e) {
		var el = e.target.closest ? e.target.closest('[data-ple]') : null;
		var kind = this.dragType;
		if (!el) return { parent: 'root', index: this.tree.children.length, el: null };
		var hit = C.find(this.tree, el.dataset.ple); if (!hit) return null;
		var isTpl = kind.indexOf('tpl:') === 0, childType = isTpl ? 'section' : kind;
		var r = el.getBoundingClientRect(), after = (e.clientY - r.top) > r.height / 2;
		/* climb until we find a node whose parent accepts the dragged thing, or that accepts it itself */
		var cur = hit;
		while (cur) {
			if (C.accepts(cur.node, childType) && (!cur.node.children.length || cur.node.type === 'column')) return { parent: cur.node.id, index: cur.node.children.length, el: this.doc.querySelector('[data-ple="' + cur.node.id + '"]'), inside: true };
			if (cur.parent && C.accepts(cur.parent, childType)) return { parent: cur.parent.id, index: cur.index + (after ? 1 : 0), el: this.doc.querySelector('[data-ple="' + cur.node.id + '"]'), after: after };
			cur = cur.parent ? C.find(this.tree, cur.parent.id) : null;
		}
		return { parent: 'root', index: this.tree.children.length, el: null };
	};
	P.showDrop = function (t) {
		var de = this.dropEl;
		if (!t || !t.el) { de.hidden = true; return; }
		var r = t.el.getBoundingClientRect(), sy = this.win.scrollY;
		de.hidden = false;
		if (t.inside) { de.className = 'in'; de.style.cssText = 'top:' + (r.top + sy) + 'px;left:' + r.left + 'px;width:' + r.width + 'px;height:' + r.height + 'px'; }
		else { de.className = 'line'; de.style.cssText = 'top:' + ((t.after ? r.bottom : r.top) + sy - 2) + 'px;left:' + r.left + 'px;width:' + r.width + 'px;height:4px'; }
	};
	P.templateDoc = function (r) {
		var tpl = this.o.pageTemplate;
		tpl = tpl.replace(/<html\b/i, '<html data-ple-editing');
		var out = tpl.indexOf('<!--PLE-ROOT-->') > -1 ? tpl.replace('<!--PLE-ROOT-->', function () { return r.html; }) : tpl;
		var head = '<style id="pe-page">' + r.css + '</style><style>' + EDIT_CSS + NOANIM + '</style>';
		out = /<\/head>/i.test(out) ? out.replace(/<\/head>/i, function () { return head + '</head>'; }) : head + out;
		var tail = '<div id="pe-tb" hidden></div><div id="pe-drop" hidden></div>';
		var i = out.toLowerCase().lastIndexOf('</body>');
		return i > -1 ? out.slice(0, i) + tail + out.slice(i) : out + tail;
	};
	P.loadTemplate = function () {
		var self = this;
		clearTimeout(this._lt);
		this._lt = setTimeout(function () {
			var r = C.render(self.tree, { editing: true });
			var back = self.frames[1 - self.active], front = self.frames[self.active];
			var sy = 0; try { sy = self.win ? self.win.scrollY : 0; } catch (e) { }
			back.onload = function () {
				back.onload = null;
				self.active = 1 - self.active; self.frame = back;
				self.doc = back.contentDocument; self.win = back.contentWindow;
				self.root = self.doc.body; self.styleEl = self.doc.getElementById('pe-page');
				self.tb = self.doc.getElementById('pe-tb'); self.dropEl = self.doc.getElementById('pe-drop');
				self.bindFrame();
				try { self.win.scrollTo(0, sy); } catch (e) { }
				back.classList.remove('pe-back'); front.classList.add('pe-back');
				self.computeRoles(); self.markSel();
				if (self.tab === 'layers' || self.tab === 'edit') self.renderPanel();
				setTimeout(function () { try { if (Math.abs(self.win.scrollY - sy) > 2) self.win.scrollTo(0, sy); } catch (e) { } self.placeToolbar(); }, 350);
			};
			back.srcdoc = self.templateDoc(r);
		}, this._tplLoaded ? 150 : 0);
		this._tplLoaded = true;
	};
	/* Name each part of hand-written HTML the way a page builder would. */
	P.computeRoles = function () {
		var self = this, R = {}, doc = this.doc;
		var elOf = function (id) { return doc ? doc.querySelector('[data-ple="' + id + '"]') : null; };
		C.walk(this.tree, function (n, parent) {
			if (n.type === 'block') { R[n.id] = 'block'; return; }
			if (n.type === 'txt') { R[n.id] = /^\s*\[[a-z]/i.test(n.props.text) ? 'code' : 'text'; return; }
			if (n.type === 'cmt') { R[n.id] = 'comment'; return; }
			if (n.type !== 'el') return;
			if (C.isLeafEl(n)) { R[n.id] = leafRole(n); return; }
			var t = n.props.tag, role = 'box';
			if (/^(ul|ol)$/.test(t)) role = 'list';
			else if (t === 'form') role = 'form';
			else if (t === 'li') role = 'item';
			else if (/^(section|header|footer|main|nav|article|aside)$/.test(t)) role = 'section';
			if (role === 'box') {
				var e = elOf(n.id), kids = n.children.filter(function (c) { return c.type === 'el' && !/^(style|script)$/.test(c.props.tag); }).length;
				if (e && kids >= 2) {
					var cs = doc.defaultView.getComputedStyle(e), d = cs.display;
					if (/grid/.test(d) || (/flex/.test(d) && !/column/.test(cs.flexDirection))) role = 'row';
				}
				if (role === 'box' && parent && R[parent.id] === 'row') role = 'column';
			}
			R[n.id] = role;
		});
		this.roles = R;
	};
	P.role = function (n) {
		if (!n) return '';
		if (!C.NATIVE[n.type]) return n.type;
		var r = this.roles && this.roles[n.id];
		if (r) return r;
		if (n.type === 'block') return 'block';
		if (n.type === 'txt') return 'text';
		if (n.type === 'cmt') return 'comment';
		return C.isLeafEl(n) ? leafRole(n) : (/^(section|header|footer|main|nav)$/.test(n.props.tag) ? 'section' : 'box');
	};
	P.roleName = function (n) { if (!C.NATIVE[n.type]) return (W[n.type] || {}).label || n.type; return (ROLES[this.role(n)] || ['Item'])[0]; };
	P.roleIcon = function (n) { if (!C.NATIVE[n.type]) return TYPE_ICON[n.type] || (W[n.type] || {}).icon || 'star'; return (ROLES[this.role(n)] || ['', 'square'])[1]; };
	P.label = function (n) {
		if (!C.NATIVE[n.type]) return label(n);
		if (n.props && n.props.label) return n.props.label;
		var base = this.roleName(n);
		if (n.type === 'block') return base + ': ' + (n.props.title || '');
		var snip = '';
		if (n.type === 'txt') snip = n.props.text;
		else if (n.type === 'el') {
			var at = n.props.attrs || {};
			if (n.props.leaf && !/^(style|script|svg)$/.test(n.props.tag)) snip = String(n.props.html || '').replace(/<[^>]+>/g, ' ');
			if (n.props.tag === 'img') snip = at.alt || '';
			if (!snip && !n.props.leaf && /^(section|row|box)$/.test(this.role(n))) {
				var hd = null; C.walk(n, function (k) { if (!hd && k.type === 'el' && /^h[1-6]$/.test(k.props.tag)) { hd = k; return false; } });
				if (hd) snip = String(hd.props.html || '').replace(/<[^>]+>/g, ' ');
			}
			if (!snip && at['class']) snip = '.' + String(at['class']).trim().split(/\s+/).slice(0, 2).join('.');
			if (/^h[1-6]$/.test(n.props.tag)) base += ' ' + n.props.tag.toUpperCase();
		}
		snip = String(snip).replace(/\s+/g, ' ').trim();
		return snip ? base + ': ' + (snip.length > 30 ? snip.slice(0, 30) + '\u2026' : snip) : base;
	};
	P.renderCanvas = function () {
		if (this.o.pageTemplate) return this.loadTemplate();
		if (!this.root) return;
		var r = C.render(this.tree, { editing: true });
		this.styleEl.textContent = r.css;
		this.root.innerHTML = r.html;
		var win = this.win, root = this.root;
		if (win && win.PLERun) { try { win.PLERun.init(root); } catch (e) { } } else if (win) setTimeout(function () { if (win.PLERun) win.PLERun.init(root); }, 400);
		if (!this.tree.children.length) this.root.innerHTML = '<div class="pe-blank"><b>Your page is empty</b><span>Open <em>Add</em> and choose a ready-made section, or start with an empty one.</span></div>';
		this.markSel();
	};
	P.markSel = function () {
		if (!this.doc) return;
		this.doc.querySelectorAll('.pe-sel').forEach(function (e) { e.classList.remove('pe-sel'); });
		if (this.sel) { var e = this.doc.querySelector('[data-ple="' + this.sel + '"]'); if (e) e.classList.add('pe-sel'); }
		this.placeToolbar();
	};
	P.placeToolbar = function () {
		if (!this.tb) return;
		var e = this.sel && this.doc.querySelector('[data-ple="' + this.sel + '"]');
		if (!e) { this.tb.hidden = true; return; }
		var hit = C.find(this.tree, this.sel); if (!hit) { this.tb.hidden = true; return; }
		var self = this, r = e.getBoundingClientRect(), sy = this.win.scrollY;
		this.tb.innerHTML = '';
		var mk = function (t, ic, fn) { var b = self.doc.createElement('button'); b.type = 'button'; b.title = t; b.setAttribute('aria-label', t); b.innerHTML = ic; b.onclick = function (ev) { ev.preventDefault(); ev.stopPropagation(); fn(); }; self.tb.appendChild(b); };
		var name = this.doc.createElement('span'); name.textContent = this.roleName(hit.node); this.tb.appendChild(name);
		if (hit.parent && hit.parent.type !== 'page') mk('Select parent', '&#8613;', function () { self.select(hit.parent.id); });
		mk('Move up', '&#8593;', function () { self.move(self.sel, -1); });
		mk('Move down', '&#8595;', function () { self.move(self.sel, 1); });
		mk('Duplicate', '&#10697;', function () { self.duplicate(self.sel); });
		mk('Delete', '&#10005;', function () { self.remove(self.sel); });
		this.tb.hidden = false;
		var top = r.top + sy - 30; if (top < sy) top = r.top + sy + 2;
		this.tb.style.top = Math.max(0, top) + 'px';
		this.tb.style.left = Math.max(0, Math.min(r.left, this.doc.documentElement.clientWidth - this.tb.offsetWidth - 4)) + 'px';
	};
	P.startInline = function (id) {
		var hit = C.find(this.tree, id); if (!hit) return;
		var self = this, n = hit.node, host, kind;
		if (C.NATIVE[n.type]) {
			if (!(n.type === 'txt' || (n.type === 'el' && n.props.leaf && TEXT_LEAF.test(n.props.tag)))) return;
			host = this.doc.querySelector('[data-ple="' + id + '"]'); if (!host) return;
			kind = n.type === 'txt' ? 'raw-text' : 'raw-html';
		} else {
			var w = W[n.type]; if (!w || !w.inline) return;
			host = this.doc.querySelector('[data-ple="' + id + '"] [data-inline]'); if (!host) return;
			kind = host.dataset.inline;
		}
		host.contentEditable = 'true'; host.focus();
		try { var rg = this.doc.createRange(); rg.selectNodeContents(host); rg.collapse(false); var s = this.win.getSelection(); s.removeAllRanges(); s.addRange(rg); } catch (e) { }
		this.tb.hidden = true;
		var sync = function () {
			if (kind === 'raw-html') n.props.html = host.innerHTML;
			else if (kind === 'raw-text') n.props.text = host.textContent;
			else if (kind === 'html') n.props.html = C.inert(host.innerHTML);
			else n.props.text = host.innerText.replace(/\n{2,}/g, '\n').trim();
		};
		host.addEventListener('input', sync);
		host.addEventListener('keydown', function (e) { if (e.key === 'Enter' && kind === 'text' && n.type !== 'heading') { e.preventDefault(); host.blur(); } if (e.key === 'Escape') host.blur(); });
		host.addEventListener('blur', function once() {
			host.removeEventListener('blur', once); sync(); host.removeAttribute('contenteditable');
			self.commit(); if (!self.o.pageTemplate) self.renderCanvas(); else self.placeToolbar(); if (self.tab === 'edit' || self.tab === 'layers') self.renderPanel();
		});
		this.toast('Typing on the page. Tap outside when done.');
	};

	/* ------------------------------------------------------------ actions */
	P.select = function (id) {
		this.sel = id;
		if (id) { var c = C.find(this.tree, id); while (c && c.parent) { this.collapsed[c.parent.id] = false; c = C.find(this.tree, c.parent.id); } }
		this.markSel();
		if (id && !this.isPhone() && (this.tab === 'add' || this.tab === 'page')) this.showTab('edit');
		else if (this.tab === 'edit' || this.tab === 'layers') this.renderPanel();
		if (!this.codeP.hidden) this.renderCode();
	};
	P.commit = function (initial) {
		var snap = JSON.stringify({ t: this.tree, title: this.o.title });
		if (this.past.length && this.past[this.past.length - 1] === snap) return;
		this.past.push(snap); if (this.past.length > 80) this.past.shift();
		this.future = [];
		if (!initial) this.touch();
		this.updUndo();
	};
	P.touch = function () {
		this.dirty = true;
		if (this.saveB) { this.saveB.classList.add('dirty'); this.saveB.textContent = 'Save'; }
		if (this.o.storeKey) { try { localStorage.setItem(this.o.storeKey, JSON.stringify({ tree: this.tree, title: this.o.title, at: Date.now() })); } catch (e) { } }
		if (this.o.onChange) this.o.onChange(this);
	};
	P.updUndo = function () { this.undoB.disabled = this.past.length < 2; this.redoB.disabled = !this.future.length; };
	P.restore = function (snap) { var s = JSON.parse(snap); this.tree = s.t; this.o.title = s.title; this.titleIn.value = s.title; if (this.sel && !C.find(this.tree, this.sel)) this.sel = null; this.renderAll(); this.touch(); this.updUndo(); };
	P.undo = function () { if (this.past.length < 2) return; this.future.push(this.past.pop()); this.restore(this.past[this.past.length - 1]); };
	P.redo = function () { if (!this.future.length) return; var s = this.future.pop(); this.past.push(s); this.restore(s); };
	P.change = function (kind, n) {
		var self = this;
		if (kind === 'style' && this.o.pageTemplate && this.styleEl) {
			var r = C.render(this.tree, { editing: true }); this.styleEl.textContent = r.css;
			/* Newly styled elements need their data-pid hook, so reload quietly. */
			if (n && this.doc && !this.doc.querySelector('[data-pid="' + n.id + '"]')) this.renderCanvas();
			setTimeout(function () { self.placeToolbar(); }, 30);
		} else if (kind === 'leaf' && n && this.doc && this.doc.querySelector('[data-ple="' + n.id + '"]')) {
			var e = this.doc.querySelector('[data-ple="' + n.id + '"]');
			if (n.type === 'txt') e.textContent = n.props.text; else e.innerHTML = n.props.html || '';
			this.placeToolbar();
		} else {
			cancelAnimationFrame(this._raf); this._raf = requestAnimationFrame(function () { self.renderCanvas(); });
		}
		clearTimeout(this._ct); this._ct = setTimeout(function () { self.commit(); if (self.tab === 'layers') self.renderPanel(); }, 400);
		this.touch();
	};
	P.renderAll = function () { this.renderCanvas(); this.renderPanel(); if (!this.codeP.hidden) this.renderCode(); };
	P.nativeSpot = function (sectionLike) {
		var t = this.tree, hit = this.sel ? C.find(t, this.sel) : null;
		var firstBlock = t.children.filter(function (c) { return c.type === 'block'; })[0];
		if (!hit) { var host = firstBlock || t; var inner = host.children.length === 1 && host.children[0].type === 'el' && C.isContainer(host.children[0]) ? host.children[0] : host; return { parent: inner, index: inner.children.length }; }
		if (sectionLike) {
			/* After the section that holds the selection. */
			var cur = hit, self = this;
			while (cur && cur.parent && !(self.role(cur.node) === 'section' || cur.parent.type === 'block' || cur.parent.type === 'page')) cur = C.find(t, cur.parent.id);
			if (cur.node.type === 'block') { var b = cur.node; var inn = b.children.length === 1 && b.children[0].type === 'el' && C.isContainer(b.children[0]) ? b.children[0] : b; return { parent: inn, index: inn.children.length }; }
			return { parent: cur.parent, index: cur.index + 1 };
		}
		if (C.isContainer(hit.node) && hit.node.type !== 'page') {
			/* Go down through single wrappers (section > container > content) to where content lives. */
			var target = hit.node, self2 = this;
			var real = function (n) { return (n.children || []).filter(function (c) { return !(c.type === 'cmt' || (c.type === 'el' && /^(style|script)$/.test(c.props.tag))); }); };
			while (true) {
				var kids = real(target);
				if (kids.length === 1 && C.isContainer(kids[0]) && kids[0].type === 'el') target = kids[0]; else break;
			}
			if (this.role(target) === 'row') { var rh = C.find(t, target.id); return { parent: rh.parent, index: rh.index + 1 }; }
			return { parent: target, index: target.children.length };
		}
		return { parent: hit.parent, index: hit.index + 1 };
	};
	P.parentFor = function (type) {
		/* Where should a new thing of `type` go, given the current selection? */
		var t = this.tree, hit = this.sel ? C.find(t, this.sel) : null;
		if (t.props && t.props.native && type !== 'column' && !(hit && !C.NATIVE[hit.node.type] && type !== 'section')) return this.nativeSpot(type === 'section' || type === 'row');
		if (type === 'section') {
			var cur = hit; while (cur && cur.node.type !== 'section') cur = cur.parent && cur.parent.type !== 'page' ? C.find(t, cur.parent.id) : null;
			return { parent: t, index: cur ? cur.index + 1 : t.children.length };
		}
		if (type === 'row') {
			var c = hit; while (c && c.node.type !== 'section') c = c.parent && c.parent.type !== 'page' ? C.find(t, c.parent.id) : null;
			if (!c) return null;
			var rowHit = hit; while (rowHit && rowHit.node.type !== 'row') rowHit = rowHit.parent && rowHit.parent.type !== 'page' ? C.find(t, rowHit.parent.id) : null;
			return { parent: c.node, index: rowHit ? rowHit.index + 1 : c.node.children.length };
		}
		if (type === 'column') {
			var r = hit; while (r && r.node.type !== 'row') r = r.parent && r.parent.type !== 'page' ? C.find(t, r.parent.id) : null;
			return r ? { parent: r.node, index: r.node.children.length } : null;
		}
		/* widget */
		if (hit) {
			if (hit.node.type === 'column') return { parent: hit.node, index: hit.node.children.length };
			if (!C.isContainer(hit.node)) return { parent: hit.parent, index: hit.index + 1 };
			var first = hit.node; while (first && first.type !== 'column') first = first.children[0];
			if (first) return { parent: first, index: first.children.length };
		}
		return null;
	};
	P.add = function (type) {
		var t = this.tree, n, spot;
		if (type.indexOf('tpl:') === 0) { n = C.T[type.slice(4)](); spot = this.parentFor('section'); }
		else if (type.indexOf('row:') === 0) {
			var k = +type.slice(4), cols = []; for (var i = 0; i < k; i++) cols.push(C.col([]));
			n = C.row(cols); spot = this.parentFor('row');
			if (t.props && t.props.native && spot && !C.accepts(spot.parent, 'row')) n = C.section([n]);
			if (!spot) { n = C.section([n]); spot = { parent: t, index: t.children.length }; }
		}
		else if (type === 'column') { n = C.col([]); spot = this.parentFor('column'); if (!spot) return this.toast('Select a row first, then add a column.', 'warn'); if (spot.parent.children.length >= 6) return this.toast('A row can hold up to 6 columns.', 'warn'); }
		else {
			n = C.node(type); spot = this.parentFor(type);
			if (!spot) { var s = C.section([C.row([C.col([n])])]); t.children.push(s); this.after(n.id); return; }
		}
		spot.parent.children.splice(spot.index, 0, n);
		this.after(n.id);
	};
	P.insertAt = function (type, target) {
		var parent = target.parent === 'root' ? this.tree : C.find(this.tree, target.parent).node, n;
		if (type.indexOf('tpl:') === 0) n = C.T[type.slice(4)]();
		else n = C.node(type);
		if (!C.accepts(parent, n.type)) { if (parent === this.tree) n = C.section([C.row([C.col([n])])]); else return; }
		parent.children.splice(target.index, 0, n);
		this.after(n.id);
	};
	P.after = function (id) {
		this.commit(); this.sel = id; this.renderCanvas();
		var e = this.doc && this.doc.querySelector('[data-ple="' + id + '"]');
		if (e) e.scrollIntoView({ behavior: 'smooth', block: 'center' });
		var self = this; setTimeout(function () { self.placeToolbar(); }, 400);
		if (this.isPhone()) this.closeSheet();
		this.showTab(this.isPhone() ? this.tab : 'edit');
		this.toast('Added. Edit it on the right, or double-click text to type.');
	};
	P.move = function (id, dir) {
		var hit = C.find(this.tree, id); if (!hit || !hit.parent) return;
		var arr = hit.parent.children, j = hit.index + dir;
		if (j < 0 || j >= arr.length) return;
		arr.splice(hit.index, 1); arr.splice(j, 0, hit.node);
		this.commit(); this.renderCanvas(); this.renderPanel();
	};
	P.duplicate = function (id) {
		var hit = C.find(this.tree, id); if (!hit || !hit.parent) return;
		var c = C.reId(C.clone(hit.node)); hit.parent.children.splice(hit.index + 1, 0, c);
		this.sel = c.id; this.commit(); this.renderAll();
	};
	P.remove = function (id) {
		var hit = C.find(this.tree, id); if (!hit || !hit.parent) return;
		hit.parent.children.splice(hit.index, 1);
		var next = hit.parent.children[Math.min(hit.index, hit.parent.children.length - 1)];
		this.sel = next ? next.id : (hit.parent.type !== 'page' ? hit.parent.id : null);
		this.commit(); this.renderAll(); this.toast('Deleted. Press Undo to bring it back.');
	};
	P.moveInto = function (dragId, targetId, before) {
		if (dragId === targetId) return;
		var d = C.find(this.tree, dragId), t = C.find(this.tree, targetId); if (!d || !t) return;
		var inside = false; C.walk(d.node, function (n) { if (n.id === targetId) inside = true; }); if (inside) return;
		var parent, index;
		if (!before && C.accepts(t.node, d.node.type)) { parent = t.node; index = t.node.children.length; }
		else if (t.parent && C.accepts(t.parent, d.node.type)) { parent = t.parent; index = t.index; }
		else return this.toast('That cannot go there.', 'warn');
		d.parent.children.splice(d.index, 1);
		if (parent === d.parent && d.index < index) index--;
		parent.children.splice(index, 0, d.node);
		this.commit(); this.renderAll();
	};

	/* ------------------------------------------------------------ panels */
	P.renderPanel = function () {
		var p = this.panel; p.innerHTML = '';
		({ add: this.panelAdd, layers: this.panelLayers, edit: this.panelEdit, page: this.panelPage })[this.tab].call(this, p);
	};
	P.panelAdd = function (p) {
		var self = this;
		var tile = function (key, name, ic, cls) {
			var t = h('button', { type: 'button', class: 'pe-tile ' + (cls || ''), draggable: 'true', onclick: function () { self.add(key); } }, C.icon(ic, 22) + '<span>' + esc(name) + '</span>');
			t.addEventListener('dragstart', function (e) { self.dragType = key; e.dataTransfer.setData('text/plain', key); e.dataTransfer.effectAllowed = 'copy'; });
			t.addEventListener('dragend', function () { self.dragType = null; if (self.dropEl) self.dropEl.hidden = true; });
			return t;
		};
		if (this.o.sideNote) p.appendChild(h('div', { class: 'pe-note' }, this.o.sideNote));
		p.appendChild(h('p', { class: 'pe-hint' }, this.isPhone() ? 'Tap an item to add it after what you have selected.' : 'Click to add after the selected item, or drag onto the page.'));
		var q = (this._addQ || '').toLowerCase();
		var search = h('input', { type: 'search', class: 'pe-search', placeholder: 'Search ' + Object.keys(W).filter(function (k) { return !W[k].container; }).length + ' widgets and sections\u2026', value: this._addQ || '', 'aria-label': 'Search widgets' });
		search.addEventListener('input', function () { self._addQ = search.value; var pos = search.selectionStart; self.renderPanel(); var ns = self.panel.querySelector('.pe-search'); if (ns) { ns.focus(); ns.setSelectionRange(pos, pos); } });
		p.appendChild(search);
		var groups = C.WGROUPS || [['basic', 'Widgets']];
		groups.forEach(function (gr) {
			var keys = Object.keys(W).filter(function (k) { return !W[k].container && (W[k].group || 'basic') === gr[0] && (!q || W[k].label.toLowerCase().indexOf(q) > -1); });
			if (!keys.length) return;
			p.appendChild(h('h4', { class: 'pe-h' }, esc(gr[1])));
			var g = h('div', { class: 'pe-grid' });
			keys.forEach(function (k) { g.appendChild(tile(k, W[k].label, W[k].icon)); });
			p.appendChild(g);
		});
		if (q) {
			var tp = C.TEMPLATES.filter(function (t) { return t[1].toLowerCase().indexOf(q) > -1; });
			if (tp.length) { p.appendChild(h('h4', { class: 'pe-h' }, 'Ready-made sections')); var l2 = h('div', { class: 'pe-tpls' }); tp.forEach(function (t) { l2.appendChild(tile('tpl:' + t[0], t[1], 'rows', 'pe-tpl')); }); p.appendChild(l2); }
			return;
		}
		p.appendChild(h('h4', { class: 'pe-h' }, 'Structure'));
		var s = h('div', { class: 'pe-grid' });
		s.appendChild(tile('row:1', 'Row, 1 column', 'square'));
		s.appendChild(tile('row:2', 'Row, 2 columns', 'columns'));
		s.appendChild(tile('row:3', 'Row, 3 columns', 'columns'));
		s.appendChild(tile('row:4', 'Row, 4 columns', 'columns'));
		s.appendChild(tile('column', 'Add a column', 'columns'));
		p.appendChild(s);
		p.appendChild(h('h4', { class: 'pe-h' }, 'Ready-made sections'));
		var l = h('div', { class: 'pe-tpls' });
		C.TEMPLATES.forEach(function (t) { l.appendChild(tile('tpl:' + t[0], t[1], 'rows', 'pe-tpl')); });
		p.appendChild(l);
	};
	P.panelLayers = function (p) {
		var self = this;
		p.appendChild(h('p', { class: 'pe-hint' }, 'This is the structure of your page: sections hold rows, rows hold columns, and columns hold widgets.' + (this.isPhone() ? '' : ' Drag to rearrange.')));
		if (!this.tree.children.length) { p.appendChild(h('p', { class: 'pe-empty-l' }, 'Nothing here yet. Add a section first.')); return; }
		var ul = h('ul', { class: 'pe-tree', role: 'tree' });
		var dragId = null;
		var showCode = !!this.showCode, hiddenCode = 0;
		var item = function (n, depth) {
			if (n.type === 'cmt') return null;
			var r0 = self.role(n);
			if (!showCode && (r0 === 'css' || r0 === 'script')) { hiddenCode++; return null; }
			var kids = (n.children || []).filter(function (k) { return k.type !== 'cmt'; });
			if (self.collapsed[n.id] === undefined && C.NATIVE[n.type]) self.collapsed[n.id] = depth >= 2 && !(n.type === 'el' && /^div$/.test(n.props.tag) && depth < 2);
			var open = !self.collapsed[n.id];
			var li = h('li', { role: 'treeitem', 'aria-expanded': kids.length ? String(open) : null });
			var rowEl = h('div', { 'data-id': n.id, class: 'pe-node t-' + n.type + (self.sel === n.id ? ' on' : '') + (self.multi && self.multi.indexOf(n.id) > -1 ? ' multi' : ''), style: 'padding-left:' + (8 + depth * 14) + 'px', draggable: self.isPhone() ? null : 'true' });
			rowEl.appendChild(h('button', { type: 'button', class: 'pe-tw' + (kids.length ? '' : ' none'), 'aria-label': open ? 'Collapse' : 'Expand', onclick: function (e) { e.stopPropagation(); self.collapsed[n.id] = open; self.renderPanel(); } }, kids.length ? (open ? '&#9662;' : '&#9656;') : ''));
			rowEl.appendChild(h('span', { class: 'pe-ni' }, C.icon(self.roleIcon(n), 15)));
			rowEl.appendChild(h('span', { class: 'pe-nl', text: self.label(n) }));
			var rl = self.role(n); if (rl === 'css' || rl === 'script') rowEl.classList.add('pe-muted');
			if (C.NATIVE[n.type]) rowEl.classList.add('r-' + rl);
			var a = h('span', { class: 'pe-na' });
			[['&#8593;', 'Move up', function () { self.move(n.id, -1); }], ['&#8595;', 'Move down', function () { self.move(n.id, 1); }], ['&#10697;', 'Duplicate', function () { self.duplicate(n.id); }], ['&#10005;', 'Delete', function () { self.remove(n.id); }]].forEach(function (b) {
				a.appendChild(h('button', { type: 'button', title: b[1], 'aria-label': b[1], onclick: function (e) { e.stopPropagation(); b[2](); } }, b[0]));
			});
			rowEl.appendChild(a);
			rowEl.addEventListener('click', function () {
				self.sel = n.id; self.markSel();
				var e = self.doc.querySelector('[data-ple="' + n.id + '"]'); if (e) e.scrollIntoView({ behavior: 'smooth', block: 'center' });
				self.renderPanel();
			});
			rowEl.addEventListener('dblclick', function () { self.sel = n.id; self.showTab('edit'); });
			rowEl.addEventListener('dragstart', function (e) { dragId = n.id; e.dataTransfer.setData('text/plain', n.id); rowEl.classList.add('drag'); });
			rowEl.addEventListener('dragend', function () { rowEl.classList.remove('drag'); });
			rowEl.addEventListener('dragover', function (e) { if (!dragId) return; e.preventDefault(); var r = rowEl.getBoundingClientRect(), y = e.clientY - r.top; rowEl.classList.toggle('dt', y < r.height * .3); rowEl.classList.toggle('di', y >= r.height * .3); });
			rowEl.addEventListener('dragleave', function () { rowEl.classList.remove('dt', 'di'); });
			rowEl.addEventListener('drop', function (e) { e.preventDefault(); var before = rowEl.classList.contains('dt'); rowEl.classList.remove('dt', 'di'); if (dragId) self.moveInto(dragId, n.id, before); dragId = null; });
			li.appendChild(rowEl);
			if (kids.length && open) { var sub = h('ul', { role: 'group' }); kids.forEach(function (k) { var c = item(k, depth + 1); if (c) sub.appendChild(c); }); li.appendChild(sub); }
			return li;
		};
		this.tree.children.forEach(function (n) { var c = item(n, 0); if (c) ul.appendChild(c); });
		if (hiddenCode || showCode) p.appendChild(h('button', { type: 'button', class: 'pe-codetoggle', onclick: function () { self.showCode = !showCode; self.renderPanel(); } }, showCode ? 'Hide styles and scripts' : 'Show styles and scripts (' + hiddenCode + ')'));
		p.appendChild(ul);
		var sel = this.sel && this.el.querySelector('.pe-node.on'); if (sel) setTimeout(function () { sel.scrollIntoView({ block: 'nearest' }); }, 0);
	};
	P.panelPage = function (p) {
		var self = this, pp = this.tree.props;
		p.appendChild(h('h4', { class: 'pe-h' }, 'Whole-page settings'));
		if (pp.native) { p.appendChild(h('p', { class: 'pe-hint' }, 'This page uses your site\u2019s own design, so fonts and colours come from your site styles. To change one part, select it and use <b>Style</b>.')); return; }
		(this.o.pageFields || []).forEach(function (pf) { p.appendChild(self.field(pf, pf.get(), function (v) { pf.set(v); self.touch(); })); });
		var f = function (k, l, t, o) { p.appendChild(self.field({ k: k, l: l, t: t, o: o }, pp[k], function (v) { pp[k] = v; self.change(); })); };
		f('font', 'Main font', 'select', [['system-ui,-apple-system,"Segoe UI",Roboto,sans-serif', 'System (fast)'], ['Georgia,"Times New Roman",serif', 'Classic serif'], ['"Trebuchet MS",Verdana,sans-serif', 'Friendly'], ['Arial,Helvetica,sans-serif', 'Arial'], ['"Courier New",monospace', 'Typewriter']]);
		f('accent', 'Link and accent colour', 'color');
		f('text', 'Text colour', 'color');
		f('bg', 'Page background', 'color');
		p.appendChild(this.field({ k: 'customCss', l: 'Extra CSS (advanced)', t: 'code' }, pp.customCss || '', function (v) { pp.customCss = v; self.change(); }));
		p.appendChild(h('p', { class: 'pe-hint' }, 'Tip: every item has an ID like <code>#ple-abc1234</code>. Select it and look in <b>Code</b> to find it.'));
	};
	P.panelEdit = function (p) {
		var self = this;
		var hit = this.sel ? C.find(this.tree, this.sel) : null;
		if (!hit) { p.appendChild(h('div', { class: 'pe-empty-l' }, '<b>Nothing selected</b><br>Tap any part of the page to edit it.')); return; }
		var n = hit.node, w = W[n.type] || {}, nat = !!C.NATIVE[n.type];
		if (nat) w = { styleFields: (n.type === 'el' && !/^(style|script|noscript|template)$/.test(n.props.tag)) ? this.nativeStyleFields(n) : [] };
		/* breadcrumb */
		var crumbs = [], c = hit;
		while (c) { crumbs.unshift(c.node); c = c.parent && c.parent.type !== 'page' ? C.find(this.tree, c.parent.id) : null; }
		var bc = h('div', { class: 'pe-bc' });
		crumbs.forEach(function (cn, i) { bc.appendChild(h('button', { type: 'button', class: i === crumbs.length - 1 ? 'on' : '', onclick: function () { self.select(cn.id); self.showTab('edit'); } }, esc(self.roleName(cn)))); if (i < crumbs.length - 1) bc.appendChild(h('i', null, '\u203a')); });
		p.appendChild(bc);
		var tabs = h('div', { class: 'pe-etabs' });
		var simple = nat && n.type !== 'el';
		if (simple) this.etab = 'content';
		[['content', 'Content'], ['style', 'Style'], ['motion', 'Motion'], ['adv', 'Advanced']].forEach(function (t) {
			if (simple && t[0] !== 'content') return;
			if (t[0] === 'motion' && nat && (n.props.tag === 'style' || n.props.tag === 'script')) return;
			tabs.appendChild(h('button', { type: 'button', class: self.etab === t[0] ? 'on' : '', onclick: function () { self.etab = t[0]; self.renderPanel(); } }, t[1]));
		});
		p.appendChild(tabs);
		var body = h('div', { class: 'pe-fields' });
		if (this.etab === 'motion') {
			this.motionPanel(body, n);
		} else if (this.etab === 'content' && nat) {
			this.nativeContent(body, n);
		} else if (this.etab === 'content') {
			(w.fields || []).forEach(function (f) { body.appendChild(self.field(f, n.props[f.k], function (v) { n.props[f.k] = v; self.change(); })); });
			if (n.type === 'row') body.appendChild(h('button', { type: 'button', class: 'pe-wide', onclick: function () { self.sel = n.id; self.add('column'); } }, '+ Add a column to this row'));
			if (n.type === 'section') body.appendChild(h('button', { type: 'button', class: 'pe-wide', onclick: function () { self.add('row:1'); } }, '+ Add a row to this section'));
			if (n.type === 'column') body.appendChild(h('button', { type: 'button', class: 'pe-wide', onclick: function () { self.showTab('add', self.isPhone()); } }, '+ Add a widget here'));
			if (w.inline) body.appendChild(h('p', { class: 'pe-hint' }, this.isPhone() ? 'Tip: tap the selected text on the page again to type directly.' : 'Tip: double-click the text on the page to type directly.'));
			if (!body.children.length) body.appendChild(h('p', { class: 'pe-hint' }, 'This item has no content settings. See Style.'));
		} else if (this.etab === 'style') {
			var dev = { d: 'Desktop', t: 'Tablet', m: 'Phone' }[this.device];
			body.appendChild(h('div', { class: 'pe-devnote d-' + this.device }, this.device === 'd' ? 'Editing styles for <b>all screens</b>. Switch to tablet or phone view at the top to set sizes for smaller screens.' : 'Editing <b>' + dev + '</b> styles. Fields marked <span class="pe-r">' + dev + '</span> only change smaller screens.'));
			var effects = [
				{ k: 'grad1', l: 'Gradient background: colour 1', t: 'color' }, { k: 'grad2', l: 'Gradient background: colour 2', t: 'color' },
				{ k: 'gangle', l: 'Gradient angle', t: 'num', u: 'deg' },
				{ k: 'glass', l: 'Frosted glass', t: 'toggle' },
				{ k: 'gradText', l: 'Gradient text', t: 'toggle' }, { k: 'g1', l: 'Gradient text: colour 1', t: 'color' }, { k: 'g2', l: 'Gradient text: colour 2', t: 'color' },
				{ k: 'op', l: 'Opacity (0 to 1)', t: 'num', u: '' }
			];
			var layout = [
				{ k: 'flex', l: 'Arrange children', t: 'select', o: [['', 'Default'], ['flex', 'Flex (in a line)'], ['grid', 'Grid']], r: 1 },
				{ k: 'fdir', l: 'Direction', t: 'select', o: [['', 'Row'], ['column', 'Column'], ['row-reverse', 'Row, reversed'], ['column-reverse', 'Column, reversed']], r: 1 },
				{ k: 'gcols', l: 'Grid columns', t: 'num', u: '', r: 1 },
				{ k: 'fwrap', l: 'Wrap', t: 'select', o: [['', 'No wrap'], ['wrap', 'Wrap']], r: 1 },
				{ k: 'jc', l: 'Spread', t: 'select', o: [['', 'Start'], ['center', 'Centre'], ['flex-end', 'End'], ['space-between', 'Space between'], ['space-around', 'Space around']], r: 1 },
				{ k: 'ai', l: 'Align', t: 'select', o: [['', 'Stretch'], ['flex-start', 'Top / start'], ['center', 'Centre'], ['flex-end', 'Bottom / end']], r: 1 },
				{ k: 'fgap', l: 'Gap', t: 'num', u: 'px', r: 1 },
				{ k: 'w', l: 'Width', t: 'num', u: 'px', r: 1 }, { k: 'mw', l: 'Maximum width', t: 'num', u: 'px', r: 1 },
				{ k: 'pos', l: 'Position', t: 'select', o: [['', 'Normal'], ['relative', 'Relative (nudge)'], ['absolute', 'Free placement (absolute)']], r: 1 },
				{ k: 'top', l: 'Top', t: 'num', u: 'px', r: 1 }, { k: 'left', l: 'Left', t: 'num', u: 'px', r: 1 }, { k: 'right', l: 'Right', t: 'num', u: 'px', r: 1 }, { k: 'bottom', l: 'Bottom', t: 'num', u: 'px', r: 1 },
				{ k: 'z', l: 'Layer order (z-index)', t: 'num', u: '' }
			];
			var group = function (title, list) { var dt = h('details', { class: 'pe-grp' }); dt.appendChild(h('summary', null, title)); list.forEach(function (f) { addStyleField(f, dt); }); body.appendChild(dt); };
			var addStyleField = function (f, target) {
				var resp = f.r && self.device !== 'd', key = self.device;
				var val = resp ? ((n.style[key] || {})[f.k]) : n.style[f.k];
				var fe = self.field(f, val, function (v) {
					if (resp) { n.style[key] = n.style[key] || {}; if (v === '' || v === null) delete n.style[key][f.k]; else n.style[key][f.k] = v; }
					else { if (v === '' || v === null) delete n.style[f.k]; else n.style[f.k] = v; }
					self.change('style', n);
				}, resp ? n.style[f.k] : null);
				if (resp) fe.querySelector('label').insertAdjacentHTML('beforeend', ' <span class="pe-r">' + dev + '</span>');
				if (self.device !== 'd' && !f.r) fe.classList.add('pe-dim');
				(target && target.nodeType ? target : body).appendChild(fe);
			};
			(w.styleFields || []).forEach(function (f) { addStyleField(f); });
			if ((w.styleFields || []).length || nat) {
				var isCont = nat ? !n.props.leaf : C.isContainer(n.type);
				group('Effects', effects);
				if (isCont || nat) group('Layout and position', layout);
				if (isCont) {
					var bgd = h('details', { class: 'pe-grp' }); bgd.appendChild(h('summary', null, 'Backgrounds and dividers')); body.appendChild(bgd);
					var bx = [{ k: 'bgVideo', l: 'Background video (YouTube link or .mp4)', t: 'url' }, { k: 'particles', l: 'Particle background colour', t: 'color' },
						{ k: 'divTop', l: 'Shape divider at the top', t: 'select', o: [['', 'None']].concat(Object.keys(C.DIVIDERS).map(function (k) { return [k, k.charAt(0).toUpperCase() + k.slice(1)]; })) },
						{ k: 'divBot', l: 'Shape divider at the bottom', t: 'select', o: [['', 'None']].concat(Object.keys(C.DIVIDERS).map(function (k) { return [k, k.charAt(0).toUpperCase() + k.slice(1)]; })) },
						{ k: 'divColor', l: 'Divider colour', t: 'color' }, { k: 'divH', l: 'Divider height', t: 'num', u: 'px' }];
					bx.forEach(function (f) { bgd.appendChild(self.field(f, n.props[f.k], function (v) { if (v === '' || v === null) delete n.props[f.k]; else n.props[f.k] = v; self.change(); })); });
				}
			}
			if (!(w.styleFields || []).length) body.appendChild(h('p', { class: 'pe-hint' }, 'This item has no visual style. Edit its code in Content.'));
		} else if (nat) {
			this.nativeAdvanced(body, n);
		} else {
			body.appendChild(this.field({ k: 'label', l: 'Name in Layers', t: 'text' }, n.props.label || '', function (v) { n.props.label = v; self.change(); }));
			body.appendChild(this.field({ k: 'anchor', l: 'Anchor ID (for links like #contact)', t: 'text' }, n.props.anchor || '', function (v) { n.props.anchor = v.replace(/[^\w-]/g, ''); self.change(); }));
			body.appendChild(this.field({ k: 'cls', l: 'CSS class', t: 'text' }, n.props.cls || '', function (v) { n.props.cls = v.replace(/[^\w -]/g, ''); self.change(); }));
			[['hideD', 'Hide on desktop'], ['hideT', 'Hide on tablet'], ['hideM', 'Hide on phone']].forEach(function (x) {
				body.appendChild(self.field({ k: x[0], l: x[1], t: 'toggle' }, n.props[x[0]], function (v) { n.props[x[0]] = v; self.change(); }));
			});
			body.appendChild(h('p', { class: 'pe-hint' }, 'This item\u2019s CSS selector is <code>#ple-' + esc(n.id) + '</code>.'));
		}
		p.appendChild(body);
		var foot = h('div', { class: 'pe-efoot' });
		if (n.type === 'block') { p.appendChild(foot); return; }
		[['&#8593; Up', function () { self.move(n.id, -1); }], ['&#8595; Down', function () { self.move(n.id, 1); }], ['&#10697; Copy', function () { self.duplicate(n.id); }], ['&#10005; Delete', function () { self.remove(n.id); }]].forEach(function (b) { foot.appendChild(h('button', { type: 'button', onclick: b[1] }, b[0])); });
		p.appendChild(foot);
	};

	/* ------------------------------------------------------------ motion */
	P.motionPanel = function (body, n) {
		var self = this, fx = n.props.fx = n.props.fx || {};
		var set = function (k) { return function (v) { if (v === '' || v === null) delete fx[k]; else fx[k] = v; if (!Object.keys(fx).length) delete n.props.fx; self.change(); }; };
		var add = function (f, k) { body.appendChild(self.field(f, fx[k], set(k))); };
		body.appendChild(h('div', { class: 'pe-devnote' }, 'Effects play on the live page. In the editor they are paused so you can work; press <b>Play</b> to see the entrance.'));
		body.appendChild(h('h4', { class: 'pe-h' }, 'Entrance animation'));
		add({ k: 'in', l: 'Animation', t: 'select', o: [['', 'None'], ['fade', 'Fade in'], ['fade-up', 'Fade up'], ['fade-down', 'Fade down'], ['fade-left', 'Slide from left'], ['fade-right', 'Slide from right'], ['zoom-in', 'Zoom in'], ['zoom-out', 'Zoom out'], ['flip-up', 'Flip up'], ['flip-left', 'Flip from side'], ['rotate-in', 'Rotate in'], ['blur-in', 'Blur in'], ['slide-up', 'Rise up'], ['bounce', 'Bounce in'], ['mask', 'Wipe reveal']] }, 'in');
		add({ k: 'dur', l: 'Duration (ms)', t: 'num', u: '' }, 'dur');
		add({ k: 'delay', l: 'Delay (ms)', t: 'num', u: '' }, 'delay');
		add({ k: 'text', l: 'Reveal text', t: 'select', o: [['', 'All at once'], ['words', 'Word by word'], ['letters', 'Letter by letter']] }, 'text');
		add({ k: 'once', l: 'Play', t: 'select', o: [['', 'Once, the first time it appears'], ['0', 'Every time it scrolls into view']] }, 'once');
		body.appendChild(h('button', { type: 'button', class: 'pe-wide', onclick: function () { self.playFx(n.id); } }, '\u25B6 Play entrance'));
		body.appendChild(h('h4', { class: 'pe-h' }, 'Hover effect'));
		add({ k: 'hover', l: 'On mouse over', t: 'select', o: [['', 'None'], ['lift', 'Lift with shadow'], ['grow', 'Grow'], ['shrink', 'Shrink'], ['glow', 'Glow'], ['rotate', 'Tilt slightly'], ['tilt', '3D tilt (follows mouse)'], ['magnetic', 'Magnetic (follows mouse)'], ['shine', 'Shine sweep'], ['brighten', 'Brighten'], ['grey', 'Colour on hover'], ['underline', 'Underline grow']] }, 'hover');
		body.appendChild(h('h4', { class: 'pe-h' }, 'Continuous animation'));
		add({ k: 'loop', l: 'Loop', t: 'select', o: [['', 'None'], ['float', 'Float'], ['pulse', 'Pulse'], ['bounce', 'Bob'], ['heartbeat', 'Heartbeat'], ['sway', 'Sway'], ['spin', 'Spin'], ['kenburns', 'Slow zoom (Ken Burns)'], ['gradient', 'Moving gradient background']] }, 'loop');
		body.appendChild(h('h4', { class: 'pe-h' }, 'Scroll effect'));
		add({ k: 'scroll', l: 'While scrolling', t: 'select', o: [['', 'None'], ['parallax', 'Parallax (vertical)'], ['parallax-x', 'Parallax (sideways)'], ['fade', 'Fade in and out'], ['scale', 'Grow in the middle'], ['zoom-in', 'Zoom as it rises'], ['rotate', 'Rotate'], ['skew', 'Skew'], ['blur', 'Blur at the edges']] }, 'scroll');
		add({ k: 'speed', l: 'Strength (1 to 10)', t: 'num', u: '' }, 'speed');
		body.appendChild(h('h4', { class: 'pe-h' }, 'Sticky'));
		add({ k: 'sticky', l: 'Stick when scrolling', t: 'select', o: [['', 'No'], ['top', 'Stick to the top'], ['bottom', 'Stick to the bottom']] }, 'sticky');
		add({ k: 'offset', l: 'Gap from the top', t: 'num', u: 'px' }, 'offset');
		add({ k: 'hide', l: 'Hide when scrolling down, show when scrolling up', t: 'toggle' }, 'hide');
		add({ k: 'sd', l: 'Sticky on', t: 'select', o: [['', 'All screens'], ['d', 'Desktop only'], ['dt', 'Desktop and tablet'], ['tm', 'Tablet and phone'], ['m', 'Phone only']] }, 'sd');
		body.appendChild(h('h4', { class: 'pe-h' }, 'Where effects run'));
		add({ k: 'devices', l: 'Animations on', t: 'select', o: [['', 'All screens'], ['d', 'Desktop only'], ['dt', 'Desktop and tablet'], ['m', 'Phone only']] }, 'devices');
	};
	P.playFx = function (id) {
		var e = this.doc && this.doc.querySelector('[data-ple="' + id + '"]'); if (!e) return;
		var hit = C.find(this.tree, id); var fx = hit && hit.node.props.fx || {};
		if (!fx['in'] && !fx.text) return this.toast('Choose an entrance animation first.', 'warn');
		var win = this.win;
		e.setAttribute('data-fx-in', fx['in'] || 'text');
		e.style.setProperty('--fx-dur', (fx.dur || 700) + 'ms'); e.style.setProperty('--fx-delay', '0ms');
		if (fx.text && win.PLERun && !e._fxText) { e.setAttribute('data-fx-text', fx.text); win.PLERun.textfx(e.parentNode); }
		this.doc.documentElement.classList.add('ple-fx');
		e.classList.add('pe-play'); e.classList.remove('fx-on'); void e.offsetWidth;
		setTimeout(function () { e.classList.add('fx-on'); }, 60);
		setTimeout(function () { e.classList.remove('pe-play'); }, (+fx.dur || 700) + 1500);
	};

	/* ------------------------------------------------------------ native HTML panels */
	P.nativeStyleFields = function (n) {
		var list = C.STYLE_TEXT.concat(C.STYLE_BOX);
		if (!n.props.leaf) list = [{ k: 'bgImg', l: 'Background image', t: 'image' }, { k: 'overlay', l: 'Image overlay', t: 'select', o: [['', 'None'], ['rgba(0,0,0,.35)', 'Dark light'], ['rgba(0,0,0,.6)', 'Dark strong'], ['rgba(255,255,255,.7)', 'Light']] }].concat(list);
		return list;
	};
	P.nativeContent = function (body, n) {
		var self = this, pr = n.props, at = pr.attrs = pr.attrs || {}, role = this.role(n), tag = pr.tag;
		var add = function (f, v, set) { body.appendChild(self.field(f, v, set)); };
		if (n.type === 'block') {
			body.appendChild(h('div', { class: 'pe-note' }, '<b>' + esc(pr.title || 'Live Block') + '</b><br>This page\u2019s content lives in this Live Block. Everything inside it is broken into sections, rows, columns and widgets in <b>Layers</b>. Saving here also updates the block, so Live Edit stays in step.'));
			body.appendChild(h('button', { type: 'button', class: 'pe-wide', onclick: function () { self.showTab('layers', self.isPhone()); } }, 'Open Layers'));
			return;
		}
		if (n.type === 'txt') { add({ k: 'text', l: 'Text', t: 'textarea' }, pr.text, function (v) { pr.text = v; self.change('leaf', n); }); return; }
		if (n.type === 'cmt') { add({ k: 'text', l: 'Note (not shown on the page)', t: 'textarea' }, pr.text, function (v) { pr.text = v; }); return; }
		if (/^h[1-6]$/.test(tag)) add({ k: 'tag', l: 'Heading level', t: 'select', o: [['h1', 'H1 (page title)'], ['h2', 'H2'], ['h3', 'H3'], ['h4', 'H4'], ['h5', 'H5'], ['h6', 'H6']] }, tag, function (v) { pr.tag = v; self.change(); });
		if (pr.leaf && TEXT_LEAF.test(tag)) {
			add({ k: 'html', l: role === 'button' || role === 'link' ? 'Label' : 'Text', t: 'html' }, pr.html, function (v) { pr.html = v; self.change('leaf', n); });
			body.appendChild(h('p', { class: 'pe-hint' }, this.isPhone() ? 'Tip: tap the selected text on the page again to type directly.' : 'Tip: double-click the text on the page to type directly.'));
		}
		if (tag === 'a') {
			add({ k: 'href', l: 'Link', t: 'url' }, at.href || '', function (v) { at.href = v; self.change(); });
			add({ k: 'target', l: 'Open in new tab', t: 'toggle' }, at.target === '_blank' ? '1' : '', function (v) { if (v) { at.target = '_blank'; at.rel = 'noopener'; } else { delete at.target; } self.change(); });
		}
		if (tag === 'img') {
			add({ k: 'src', l: 'Picture', t: 'image' }, at.src || '', function (v) { at.src = v; delete at.srcset; delete at.sizes; self.change(); });
			add({ k: 'alt', l: 'Alt text (for screen readers and Google)', t: 'text' }, at.alt || '', function (v) { at.alt = v; self.change(); });
		}
		if (pr.leaf && !TEXT_LEAF.test(tag) && tag !== 'img') {
			add({ k: 'html', l: role === 'css' ? 'CSS' : role === 'script' ? 'Script' : 'Code inside <' + tag + '>', t: 'code' }, pr.html, function (v) { pr.html = v; self.change(); });
			if (role === 'script') body.appendChild(h('p', { class: 'pe-hint' }, 'Scripts run on the page. Change them carefully.'));
		}
		if (!pr.leaf) {
			body.appendChild(h('p', { class: 'pe-hint' }, 'This ' + this.roleName(n).toLowerCase() + ' holds other items. Select something inside it in Layers or on the page, or add new items here.'));
			body.appendChild(h('button', { type: 'button', class: 'pe-wide', onclick: function () { self.showTab('add', self.isPhone()); } }, '+ Add inside this ' + this.roleName(n).toLowerCase()));
			if ((at.style || '').indexOf('background') > -1) body.appendChild(h('p', { class: 'pe-hint' }, 'It has a background set in its own code; change it in Style or Advanced.'));
		}
	};
	P.nativeAdvanced = function (body, n) {
		var self = this, pr = n.props, at = pr.attrs = pr.attrs || {};
		var add = function (f, v, set) { body.appendChild(self.field(f, v, set)); };
		add({ k: 'label', l: 'Name in Layers', t: 'text' }, pr.label || '', function (v) { pr.label = v; if (self.tab === 'layers') self.renderPanel(); });
		add({ k: 'tag', l: 'HTML tag', t: 'text' }, pr.tag, function (v) { v = v.toLowerCase().replace(/[^a-z0-9-]/g, ''); if (v) { pr.tag = v; self.change(); } });
		add({ k: 'id', l: 'Anchor ID (for links like #contact)', t: 'text' }, at.id || '', function (v) { v = v.replace(/[^\w-]/g, ''); if (v) at.id = v; else delete at.id; self.change(); });
		add({ k: 'class', l: 'CSS classes', t: 'text' }, at['class'] || '', function (v) { if (v.trim()) at['class'] = v; else delete at['class']; self.change(); });
		add({ k: 'style', l: 'Inline style', t: 'textarea' }, at.style || '', function (v) { if (v.trim()) at.style = v; else delete at.style; self.change(); });
		var other = Object.keys(at).filter(function (k) { return !/^(id|class|style)$/.test(k); }).map(function (k) { return k + '="' + at[k] + '"'; }).join('\n');
		add({ k: 'attrs', l: 'Other attributes (one per line, name="value")', t: 'textarea' }, other, function (v) {
			Object.keys(at).forEach(function (k) { if (!/^(id|class|style)$/.test(k)) delete at[k]; });
			v.split('\n').forEach(function (line) { var m = line.match(/^\s*([^\s="'<>\/]+)\s*(?:=\s*"?([^"]*)"?)?\s*$/); if (m) at[m[1]] = m[2] === undefined ? '' : m[2]; });
			self.change();
		});
		[['hideD', 'Hide on desktop'], ['hideT', 'Hide on tablet'], ['hideM', 'Hide on phone']].forEach(function (x) {
			add({ k: x[0], l: x[1], t: 'toggle' }, pr[x[0]], function (v) { pr[x[0]] = v; self.change('style', n); });
		});
	};

	/* ------------------------------------------------------------ fields */
	P.field = function (f, val, set, inherit) {
		var self = this, wrap = h('div', { class: 'pe-f pe-f-' + f.t }), id = 'pf' + C.uid();
		wrap.appendChild(h('label', { for: id }, esc(f.l)));
		var v = val === undefined || val === null ? '' : val;
		var ph = inherit !== null && inherit !== undefined && inherit !== '' ? String(inherit) : '';
		switch (f.t) {
			case 'text': case 'url':
				wrap.appendChild(h('input', { id: id, type: f.t === 'url' ? 'url' : 'text', value: v, placeholder: f.t === 'url' ? 'https:// or #section' : ph, oninput: function () { set(this.value); } }));
				break;
			case 'textarea':
				wrap.appendChild(h('textarea', { id: id, rows: 3, oninput: function () { set(this.value); } }, esc(v)));
				break;
			case 'html':
				var ta = h('textarea', { id: id, rows: 6, class: 'pe-mono', oninput: function () { set(this.value); } }, esc(v));
				var wrapSel = function (a, b) { var s = ta.selectionStart, e = ta.selectionEnd, t = ta.value; ta.value = t.slice(0, s) + a + t.slice(s, e) + b + t.slice(e); ta.focus(); ta.selectionStart = s + a.length; ta.selectionEnd = e + a.length; set(ta.value); };
				var bar = h('div', { class: 'pe-rt' });
				[['<b>B</b>', '<strong>', '</strong>'], ['<i>I</i>', '<em>', '</em>'], ['P', '<p>', '</p>'], ['Link', '<a href="#">', '</a>'], ['List', '<ul>\n  <li>', '</li>\n</ul>'], ['Line break', '<br>', '']].forEach(function (b) { bar.appendChild(h('button', { type: 'button', onclick: function () { wrapSel(b[1], b[2]); } }, b[0])); });
				wrap.appendChild(bar); wrap.appendChild(ta);
				wrap.appendChild(h('small', null, 'This is real HTML: <code>&lt;p&gt;</code> is a paragraph, <code>&lt;strong&gt;</code> is bold.'));
				break;
			case 'code':
				var ca = h('textarea', { id: id, rows: 8, class: 'pe-mono', spellcheck: 'false', autocapitalize: 'off', autocorrect: 'off', oninput: function () { set(this.value); } }, esc(v));
				wrap.appendChild(ca); wrap.appendChild(Editor.keybar(ca, function () { set(ca.value); }));
				break;
			case 'select':
				var s = h('select', { id: id, onchange: function () { set(this.value); } });
				if (ph) s.appendChild(h('option', { value: '' }, 'Same as desktop'));
				(f.o || []).forEach(function (o) { s.appendChild(h('option', { value: o[0], selected: String(o[0]) === String(v) ? true : null }, esc(o[1]))); });
				wrap.appendChild(s);
				break;
			case 'color':
				var row = h('div', { class: 'pe-color' });
				var pick = h('input', { type: 'color', value: /^#[0-9a-f]{6}$/i.test(v) ? v : '#ffffff', 'aria-label': f.l, oninput: function () { tx.value = this.value; set(this.value); } });
				var tx = h('input', { id: id, type: 'text', value: v, placeholder: ph || 'none', oninput: function () { if (/^#[0-9a-f]{6}$/i.test(this.value)) pick.value = this.value; set(this.value); } });
				var clr = h('button', { type: 'button', class: 'pe-x', title: 'Clear', onclick: function () { tx.value = ''; set(''); } }, '&times;');
				row.appendChild(pick); row.appendChild(tx); row.appendChild(clr); wrap.appendChild(row);
				var sw = h('div', { class: 'pe-sw' });
				(C.KIT_COLORS || []).concat(SWATCHES, [this.tree.props.accent]).filter(function (c, i, a) { return c && a.indexOf(c) === i; }).slice(0, 18).forEach(function (c) { sw.appendChild(h('button', { type: 'button', style: 'background:' + c, title: c, 'aria-label': c, onclick: function () { tx.value = c; pick.value = c; set(c); } })); });
				wrap.appendChild(sw);
				break;
			case 'num':
				var nr = h('div', { class: 'pe-num' });
				var ni = h('input', { id: id, type: 'number', inputmode: 'decimal', value: v, placeholder: ph, step: f.u === '' ? '0.1' : '1', oninput: function () { set(this.value === '' ? '' : +this.value); } });
				var step = function (d) { var cur = ni.value === '' ? (+ph || 0) : +ni.value; ni.value = Math.max(0, Math.round((cur + d) * 10) / 10); set(+ni.value); };
				nr.appendChild(h('button', { type: 'button', 'aria-label': 'Less', onclick: function () { step(f.u === '' ? -0.1 : (f.u === 'vh' || f.u === '%' ? -5 : -4)); } }, '&minus;'));
				nr.appendChild(ni);
				nr.appendChild(h('button', { type: 'button', 'aria-label': 'More', onclick: function () { step(f.u === '' ? 0.1 : (f.u === 'vh' || f.u === '%' ? 5 : 4)); } }, '+'));
				if (f.u) nr.appendChild(h('span', null, f.u));
				nr.appendChild(h('button', { type: 'button', class: 'pe-x', title: 'Reset', onclick: function () { ni.value = ''; set(''); } }, '&times;'));
				wrap.appendChild(nr);
				break;
			case 'items':
				var list = Array.isArray(v) ? v : [];
				var box2 = h('div', { class: 'pe-items' });
				var redraw = function () {
					box2.innerHTML = '';
					list.forEach(function (it, i) {
						var open = self._openItem === f.k + i;
						var head = h('div', { class: 'pe-it-h' + (open ? ' on' : '') });
						head.appendChild(h('button', { type: 'button', class: 'pe-it-t', onclick: function () { self._openItem = open ? null : f.k + i; redraw(); } }, '<b>' + (i + 1) + '.</b> ' + esc(String(it[f.title] || 'Item ' + (i + 1)).replace(/<[^>]+>/g, '').slice(0, 40))));
						[['&#8593;', 'Move up', function () { if (i > 0) { list.splice(i - 1, 0, list.splice(i, 1)[0]); set(list); redraw(); } }], ['&#8595;', 'Move down', function () { if (i < list.length - 1) { list.splice(i + 1, 0, list.splice(i, 1)[0]); set(list); redraw(); } }], ['&#10697;', 'Copy', function () { list.splice(i + 1, 0, JSON.parse(JSON.stringify(it))); set(list); redraw(); }], ['&#10005;', 'Remove', function () { list.splice(i, 1); set(list); redraw(); }]].forEach(function (b) { head.appendChild(h('button', { type: 'button', title: b[1], 'aria-label': b[1], onclick: b[2] }, b[0])); });
						box2.appendChild(head);
						if (open) {
							var bodyI = h('div', { class: 'pe-it-b' });
							(f.sub || []).forEach(function (sf) { bodyI.appendChild(self.field(sf, it[sf.k], function (val) { it[sf.k] = val; set(list); if (sf.k === f.title) head.querySelector('.pe-it-t').innerHTML = '<b>' + (i + 1) + '.</b> ' + esc(String(val || '').slice(0, 40)); })); });
							box2.appendChild(bodyI);
						}
					});
					box2.appendChild(h('button', { type: 'button', class: 'pe-wide', onclick: function () { var blank = {}; (f.sub || []).forEach(function (sf) { blank[sf.k] = list.length ? '' : ''; }); if (list.length) blank = JSON.parse(JSON.stringify(list[list.length - 1])); list.push(blank); self._openItem = f.k + (list.length - 1); set(list); redraw(); } }, '+ Add item'));
				};
				redraw();
				wrap.appendChild(box2);
				break;
			case 'toggle':
				var tg = h('label', { class: 'pe-tg' });
				tg.appendChild(h('input', { id: id, type: 'checkbox', checked: v ? true : null, onchange: function () { set(this.checked ? '1' : ''); } }));
				tg.appendChild(h('i')); wrap.appendChild(tg);
				break;
			case 'icon':
				var ig = h('div', { class: 'pe-icons' });
				Object.keys(C.ICONS).forEach(function (k) { ig.appendChild(h('button', { type: 'button', class: k === v ? 'on' : '', title: k, 'aria-label': k, onclick: function () { ig.querySelectorAll('.on').forEach(function (x) { x.classList.remove('on'); }); this.classList.add('on'); set(k); } }, C.icon(k, 20))); });
				wrap.appendChild(ig);
				break;
			case 'image':
				var box = h('div', { class: 'pe-imgf' });
				var th = h('div', { class: 'pe-th', style: v ? 'background-image:url("' + String(v).replace(/"/g, '%22') + '")' : '' }, v ? '' : 'No picture');
				var ui = h('input', { id: id, type: 'url', value: /^data:/.test(v) ? '' : v, placeholder: 'Or paste a picture link', oninput: function () { set(this.value); th.style.backgroundImage = 'url("' + this.value + '")'; th.textContent = ''; } });
				var apply = function (url) { ui.value = url; set(url); th.style.backgroundImage = 'url("' + url + '")'; th.textContent = ''; };
				box.appendChild(th);
				var bs = h('div', { class: 'pe-ib2' });
				if (this.o.pickImage) bs.appendChild(h('button', { type: 'button', onclick: function () { self.o.pickImage(apply); } }, 'Media Library'));
				if (this.o.upload) {
					var fi = h('input', { type: 'file', accept: 'image/*', hidden: true, onchange: function () {
						var file = this.files[0]; if (!file) return; self.toast('Uploading\u2026');
						self.o.upload(file).then(function (url) { apply(url); self.toast('Picture uploaded', 'ok'); }).catch(function (e) { self.toast(e && e.message ? e.message : 'Upload failed', 'err'); });
					} });
					bs.appendChild(fi); bs.appendChild(h('button', { type: 'button', onclick: function () { fi.click(); } }, 'Upload'));
				}
				bs.appendChild(h('button', { type: 'button', onclick: function () { apply(''); ui.value = ''; th.style.backgroundImage = ''; th.textContent = 'No picture'; } }, 'Remove'));
				box.appendChild(bs); box.appendChild(ui);
				wrap.appendChild(box);
				break;
		}
		return wrap;
	};
	/* A row of coding symbols that are hard to find on phone keyboards. */
	Editor.keybar = function (ta, onInput) {
		var bar = h('div', { class: 'pe-keys', role: 'toolbar', 'aria-label': 'Code symbols' });
		['<', '>', '/', '=', '"', '{', '}', ':', ';', '#', '.', '(', ')', '-', 'Tab'].forEach(function (k) {
			var b = h('button', { type: 'button', tabindex: '-1' }, esc(k));
			b.addEventListener('mousedown', function (e) { e.preventDefault(); });
			b.addEventListener('click', function () {
				var ins = k === 'Tab' ? '  ' : k, s = ta.selectionStart, e = ta.selectionEnd;
				ta.value = ta.value.slice(0, s) + ins + ta.value.slice(e); ta.selectionStart = ta.selectionEnd = s + ins.length; ta.focus();
				if (onInput) onInput(); ta.dispatchEvent(new Event('input'));
			});
			bar.appendChild(b);
		});
		ta.addEventListener('keydown', function (e) {
			if (e.key === 'Tab') { e.preventDefault(); var s = ta.selectionStart; ta.value = ta.value.slice(0, s) + '  ' + ta.value.slice(ta.selectionEnd); ta.selectionStart = ta.selectionEnd = s + 2; ta.dispatchEvent(new Event('input')); }
		});
		return bar;
	};

	/* ------------------------------------------------------------ code view */
	P.toggleCode = function () {
		this.codeP.hidden = !this.codeP.hidden;
		this.el.classList.toggle('with-code', !this.codeP.hidden);
		if (!this.codeP.hidden) { this.renderCode(); if (this.isPhone()) this.closeSheet(); }
	};
	P.renderCode = function () {
		var self = this, r = C.render(this.tree), p = this.codeP;
		var which = this.codeTab || 'sel';
		p.innerHTML = '';
		var head = h('div', { class: 'pe-ch' });
		[['sel', 'Selected'], ['html', 'HTML'], ['css', 'CSS']].forEach(function (t) { head.appendChild(h('button', { type: 'button', class: which === t[0] ? 'on' : '', onclick: function () { self.codeTab = t[0]; self.renderCode(); } }, t[1])); });
		head.appendChild(h('button', { type: 'button', class: 'pe-cx', 'aria-label': 'Close code', onclick: function () { self.toggleCode(); } }, '&times;'));
		p.appendChild(head);
		var code = '';
		if (which === 'html') code = C.pretty(r.html);
		else if (which === 'css') code = r.css.replace(/}/g, '}\n').replace(/\n\s*\n/g, '\n');
		else {
			if (!this.sel) code = '<!-- Select something on the page to see its code -->';
			else {
				var tmp = document.createElement('div'); tmp.innerHTML = C.render(this.tree, { editing: true }).html;
				var el = tmp.querySelector('[data-ple="' + this.sel + '"]');
				if (el) { el = el.cloneNode(true); [el].concat([].slice.call(el.querySelectorAll('[data-ple]'))).forEach(function (x) { x.removeAttribute('data-ple'); }); }
				code = el ? C.pretty(el.outerHTML.replace(/<\/?ple-[tb][^>]*>/g, '')) : '';
				var selNode = C.find(self.tree, self.sel), id = selNode ? C.selOf(selNode.node) : '#ple-' + self.sel, out = [];
				var grab = function (block) { var m, re = /([^{}]+)\{([^{}]*)\}/g, res = []; while ((m = re.exec(block))) if (m[1].indexOf(id) > -1) res.push(m[1].trim() + ' {\n  ' + m[2].split(';').filter(Boolean).join(';\n  ') + ';\n}'); return res; };
				var flat = r.css.replace(/@media([^{]+)\{((?:[^{}]*\{[^{}]*\})*)\}/g, function (all, q, inner) { var g = grab(inner); if (g.length) out.push('/* On screens' + q.replace(/\(max-width:(\d+)px\)/, ' up to $1px wide').replace(/\(min-width:(\d+)px\)/, ' from $1px wide') + ' */\n' + g.join('\n')); return ''; });
				out = grab(flat).concat(out);
				if (out.length) code += '\n\n/* Its styles */\n' + out.join('\n\n');
			}
		}
		p.appendChild(h('p', { class: 'pe-hint' }, which === 'sel' ? 'This is the real code the builder writes for the selected item. Change it with the panel and watch the code change.' : 'This is the code a browser reads to draw your page.'));
		p.appendChild(h('pre', { class: 'pe-pre' }, Editor.highlight(code)));
		var acts = h('div', { class: 'pe-ca' });
		acts.appendChild(h('button', { type: 'button', onclick: function () { navigator.clipboard && navigator.clipboard.writeText(code).then(function () { self.toast('Copied', 'ok'); }); } }, 'Copy'));
		acts.appendChild(h('button', { type: 'button', onclick: function () { self.download(); } }, 'Download .html'));
		(this.o.codeButtons || []).forEach(function (b) { acts.appendChild(h('button', { type: 'button', onclick: function () { b.on(self); } }, b.text)); });
		p.appendChild(acts);
	};
	Editor.highlight = function (code) {
		return esc(code)
			.replace(/(&lt;!--[\s\S]*?--&gt;|\/\*[\s\S]*?\*\/)/g, '<i class="c">$1</i>')
			.replace(/(&lt;\/?)([a-z0-9-]+)/gi, '$1<b class="t">$2</b>')
			.replace(/\s([a-z-]+)=(&quot;)/gi, ' <b class="a">$1</b>=$2')
			.replace(/([a-z-]+)(:)(?=[^;{}\n]*[;}])/gi, '<b class="p">$1</b>$2');
	};
	P.download = function () {
		var html = C.fullDoc(this.tree, this.o.title);
		var a = document.createElement('a');
		a.href = URL.createObjectURL(new Blob([html], { type: 'text/html' }));
		a.download = (this.o.title || 'page').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '.html';
		document.body.appendChild(a); a.click(); a.remove();
	};
	P.preview = function () {
		if (this.o.preview) return this.o.preview(this);
		var url = URL.createObjectURL(new Blob([C.fullDoc(this.tree, this.o.title)], { type: 'text/html' }));
		window.open(url, '_blank');
	};
	P.data = function () {
		var r = C.render(this.tree), d = { tree: this.tree, html: r.html, css: r.css, title: this.o.title };
		if (this.tree.props && this.tree.props.native) d.native = C.serializeNative(this.tree);
		return d;
	};
	P.save = function () {
		var self = this; if (!this.o.save) return;
		this.saveB.disabled = true; this.saveB.textContent = 'Saving\u2026';
		Promise.resolve(this.o.save(this.data())).then(function (msg) {
			self.dirty = false; self.saveB.classList.remove('dirty'); self.saveB.textContent = 'Saved';
			if (self.o.storeKey) try { localStorage.removeItem(self.o.storeKey); } catch (e) { }
			self.toast(typeof msg === 'string' ? msg : 'Saved', 'ok');
		}).catch(function (e) { self.saveB.textContent = 'Save'; self.toast((e && e.message) || 'Could not save. Check your connection and try again.', 'err'); })
			.then(function () { self.saveB.disabled = false; });
	};

	/* ------------------------------------------------------------ keys */
	P.keys = function () { var self = this; var fn = function (e) { if (!document.body.contains(self.el)) { document.removeEventListener('keydown', fn); return; } self.onKey(e); }; document.addEventListener('keydown', fn); };
	P.onKey = function (e) {
		var t = e.target, typing = t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));
		var mod = e.ctrlKey || e.metaKey;
		if (mod && e.key.toLowerCase() === 's') { e.preventDefault(); this.save(); return; }
		if (typing) return;
		if (mod && e.key.toLowerCase() === 'z' && !e.shiftKey) { e.preventDefault(); this.undo(); }
		else if (mod && (e.key.toLowerCase() === 'y' || (e.key.toLowerCase() === 'z' && e.shiftKey))) { e.preventDefault(); this.redo(); }
		else if (mod && e.key.toLowerCase() === 'd' && this.sel) { e.preventDefault(); this.duplicate(this.sel); }
		else if ((e.key === 'Delete' || e.key === 'Backspace') && this.sel) { e.preventDefault(); this.remove(this.sel); }
		else if (e.key === 'Escape') { this.select(null); this.closeSheet(); }
	};

	/* Styles used only inside the editing canvas. */
	var NOANIM = '[data-ple-editing] [data-fx-in]:not(.pe-play),[data-ple-editing] [data-fx-in]:not(.pe-play) .fx-ch{opacity:1!important;transform:none!important;filter:none!important;clip-path:none!important}' + '*,*:before,*:after{transition:none!important;animation-duration:.001s!important;animation-delay:0s!important;animation-iteration-count:1!important;scroll-behavior:auto!important}ple-t{display:inline}html{scroll-behavior:auto!important}';
	var EDIT_CSS = [
		'html,body{margin:0;min-height:100%}body{padding-bottom:120px}',
		'[data-ple]{cursor:pointer}',
		'[data-ple]:hover{outline:1px dashed rgba(37,99,235,.6);outline-offset:-1px}',
		'.ple-section[data-ple]:hover{outline:2px dashed rgba(124,58,237,.55);outline-offset:-2px}',
		'.pe-sel,.pe-sel:hover{outline:2px solid #2563eb!important;outline-offset:-2px}',
		'.ple-section.pe-sel{outline-color:#7c3aed!important}.ple-row.pe-sel{outline-color:#0d9488!important}.ple-column.pe-sel{outline-color:#f59e0b!important}',
		'[contenteditable=true]{outline:2px solid #f59e0b!important;cursor:text;background:rgba(245,158,11,.06)}',
		'.ple-empty{border:2px dashed #cbd5e1;border-radius:10px;padding:22px 12px;text-align:center;color:#64748b;font:500 14px system-ui,sans-serif;background:rgba(248,250,252,.7);cursor:pointer}',
		'.ple-empty:hover{border-color:#2563eb;color:#2563eb}',
		'.pe-blank{margin:40px auto;max-width:420px;text-align:center;font:15px/1.5 system-ui,sans-serif;color:#475569;border:2px dashed #cbd5e1;border-radius:16px;padding:40px 24px}.pe-blank b{display:block;font-size:18px;color:#0f172a;margin-bottom:6px}',
		'#pe-tb{position:absolute;z-index:99999;display:flex;align-items:center;gap:2px;background:#2563eb;color:#fff;border-radius:7px;padding:2px 3px;font:600 12px system-ui,sans-serif;box-shadow:0 4px 14px rgba(0,0,0,.25);white-space:nowrap}',
		'#pe-tb span{padding:0 6px}#pe-tb button{all:unset;cursor:pointer;width:26px;height:24px;display:grid;place-items:center;border-radius:5px;font-size:14px}#pe-tb button:hover{background:rgba(255,255,255,.2)}',
		'@media(pointer:coarse){#pe-tb button{width:34px;height:32px;font-size:17px}}',
		'#pe-drop{position:absolute;z-index:99998;pointer-events:none}#pe-drop.line{background:#2563eb;border-radius:4px;box-shadow:0 0 0 2px #fff}#pe-drop.in{background:rgba(37,99,235,.12);outline:2px dashed #2563eb}',
		'#pe-tb[hidden],#pe-drop[hidden]{display:none}',
		'[data-ple-editing] [data-fx-in]:not(.pe-play){opacity:1!important;transform:none!important;filter:none!important;clip-path:none!important}',
		'[data-ple-editing] [data-fx-in]:not(.pe-play) .fx-ch{opacity:1!important;transform:none!important}'
	].join('\n');

	global.PLEEditor = Editor;
})(window);
