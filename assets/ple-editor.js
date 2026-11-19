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
	var DEVICES = [['d', 'Desktop', '100%'], ['t', 'Tablet', '768px'], ['m', 'Phone', '390px']];
	var SWATCHES = ['#0f172a', '#ffffff', '#f8fafc', '#2563eb', '#1d4ed8', '#0ea5e9', '#16a34a', '#f59e0b', '#dc2626', '#7c3aed', '#db2777', '#475569'];

	function Editor(opts) {
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
		var doc = '<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style id="pe-page"></style><style>' + EDIT_CSS + '</style></head><body><div id="pe-root"></div><div id="pe-tb" hidden></div><div id="pe-drop" hidden></div></body></html>';
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
		d.addEventListener('click', function (e) {
			if (e.target.closest('#pe-tb')) return;
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
			if (C.accepts(cur.node.type, childType) && (!cur.node.children.length || cur.node.type === 'column')) return { parent: cur.node.id, index: cur.node.children.length, el: this.doc.querySelector('[data-ple="' + cur.node.id + '"]'), inside: true };
			if (cur.parent && C.accepts(cur.parent.type, childType)) return { parent: cur.parent.id, index: cur.index + (after ? 1 : 0), el: this.doc.querySelector('[data-ple="' + cur.node.id + '"]'), after: after };
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
	P.renderCanvas = function () {
		if (!this.root) return;
		var r = C.render(this.tree, { editing: true });
		this.styleEl.textContent = r.css;
		this.root.innerHTML = r.html;
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
		var name = this.doc.createElement('span'); name.textContent = (W[hit.node.type] || {}).label || hit.node.type; this.tb.appendChild(name);
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
		var w = W[hit.node.type]; if (!w || !w.inline) return;
		var host = this.doc.querySelector('[data-ple="' + id + '"] [data-inline]'); if (!host) return;
		var self = this, n = hit.node, kind = host.dataset.inline;
		host.contentEditable = 'true'; host.focus();
		try { var rg = this.doc.createRange(); rg.selectNodeContents(host); rg.collapse(false); var s = this.win.getSelection(); s.removeAllRanges(); s.addRange(rg); } catch (e) { }
		this.tb.hidden = true;
		var sync = function () {
			if (kind === 'html') n.props.html = C.inert(host.innerHTML);
			else n.props.text = host.innerText.replace(/\n{2,}/g, '\n').trim();
		};
		host.addEventListener('input', sync);
		host.addEventListener('keydown', function (e) { if (e.key === 'Enter' && kind === 'text' && n.type !== 'heading') { e.preventDefault(); host.blur(); } if (e.key === 'Escape') host.blur(); });
		host.addEventListener('blur', function once() {
			host.removeEventListener('blur', once); sync(); host.contentEditable = 'false';
			self.commit(); self.renderCanvas(); if (self.tab === 'edit') self.renderPanel();
		});
		this.toast('Typing on the page. Tap outside when done.');
	};

	/* ------------------------------------------------------------ actions */
	P.select = function (id) {
		this.sel = id;
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
	P.change = function () {
		var self = this;
		cancelAnimationFrame(this._raf); this._raf = requestAnimationFrame(function () { self.renderCanvas(); });
		clearTimeout(this._ct); this._ct = setTimeout(function () { self.commit(); if (self.tab === 'layers') self.renderPanel(); }, 400);
		this.touch();
	};
	P.renderAll = function () { this.renderCanvas(); this.renderPanel(); if (!this.codeP.hidden) this.renderCode(); };
	P.parentFor = function (type) {
		/* Where should a new thing of `type` go, given the current selection? */
		var t = this.tree, hit = this.sel ? C.find(t, this.sel) : null;
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
			if (!C.isContainer(hit.node.type)) return { parent: hit.parent, index: hit.index + 1 };
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
		if (!C.accepts(parent.type, n.type)) { if (parent === this.tree) n = C.section([C.row([C.col([n])])]); else return; }
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
		if (!before && C.accepts(t.node.type, d.node.type)) { parent = t.node; index = t.node.children.length; }
		else if (t.parent && C.accepts(t.parent.type, d.node.type)) { parent = t.parent; index = t.index; }
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
		p.appendChild(h('h4', { class: 'pe-h' }, 'Widgets'));
		var g = h('div', { class: 'pe-grid' });
		Object.keys(W).forEach(function (k) { if (!W[k].container) g.appendChild(tile(k, W[k].label, W[k].icon)); });
		p.appendChild(g);
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
		var item = function (n, depth) {
			var kids = n.children || [], open = !self.collapsed[n.id];
			var li = h('li', { role: 'treeitem', 'aria-expanded': kids.length ? String(open) : null });
			var rowEl = h('div', { class: 'pe-node t-' + n.type + (self.sel === n.id ? ' on' : ''), style: 'padding-left:' + (8 + depth * 14) + 'px', draggable: self.isPhone() ? null : 'true' });
			rowEl.appendChild(h('button', { type: 'button', class: 'pe-tw' + (kids.length ? '' : ' none'), 'aria-label': open ? 'Collapse' : 'Expand', onclick: function (e) { e.stopPropagation(); self.collapsed[n.id] = open; self.renderPanel(); } }, kids.length ? (open ? '&#9662;' : '&#9656;') : ''));
			rowEl.appendChild(h('span', { class: 'pe-ni' }, C.icon(TYPE_ICON[n.type] || (W[n.type] || {}).icon || 'star', 15)));
			rowEl.appendChild(h('span', { class: 'pe-nl', text: label(n) }));
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
			if (kids.length && open) { var sub = h('ul', { role: 'group' }); kids.forEach(function (k) { sub.appendChild(item(k, depth + 1)); }); li.appendChild(sub); }
			return li;
		};
		this.tree.children.forEach(function (n) { ul.appendChild(item(n, 0)); });
		p.appendChild(ul);
		var sel = this.sel && this.el.querySelector('.pe-node.on'); if (sel) setTimeout(function () { sel.scrollIntoView({ block: 'nearest' }); }, 0);
	};
	P.panelPage = function (p) {
		var self = this, pp = this.tree.props;
		p.appendChild(h('h4', { class: 'pe-h' }, 'Whole-page settings'));
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
		var n = hit.node, w = W[n.type] || {};
		/* breadcrumb */
		var crumbs = [], c = hit;
		while (c) { crumbs.unshift(c.node); c = c.parent && c.parent.type !== 'page' ? C.find(this.tree, c.parent.id) : null; }
		var bc = h('div', { class: 'pe-bc' });
		crumbs.forEach(function (cn, i) { bc.appendChild(h('button', { type: 'button', class: i === crumbs.length - 1 ? 'on' : '', onclick: function () { self.select(cn.id); self.showTab('edit'); } }, esc((W[cn.type] || {}).label || cn.type))); if (i < crumbs.length - 1) bc.appendChild(h('i', null, '\u203a')); });
		p.appendChild(bc);
		var tabs = h('div', { class: 'pe-etabs' });
		[['content', 'Content'], ['style', 'Style'], ['adv', 'Advanced']].forEach(function (t) {
			tabs.appendChild(h('button', { type: 'button', class: self.etab === t[0] ? 'on' : '', onclick: function () { self.etab = t[0]; self.renderPanel(); } }, t[1]));
		});
		p.appendChild(tabs);
		var body = h('div', { class: 'pe-fields' });
		if (this.etab === 'content') {
			(w.fields || []).forEach(function (f) { body.appendChild(self.field(f, n.props[f.k], function (v) { n.props[f.k] = v; self.change(); })); });
			if (n.type === 'row') body.appendChild(h('button', { type: 'button', class: 'pe-wide', onclick: function () { self.sel = n.id; self.add('column'); } }, '+ Add a column to this row'));
			if (n.type === 'section') body.appendChild(h('button', { type: 'button', class: 'pe-wide', onclick: function () { self.add('row:1'); } }, '+ Add a row to this section'));
			if (n.type === 'column') body.appendChild(h('button', { type: 'button', class: 'pe-wide', onclick: function () { self.showTab('add', self.isPhone()); } }, '+ Add a widget here'));
			if (w.inline) body.appendChild(h('p', { class: 'pe-hint' }, this.isPhone() ? 'Tip: tap the selected text on the page again to type directly.' : 'Tip: double-click the text on the page to type directly.'));
			if (!body.children.length) body.appendChild(h('p', { class: 'pe-hint' }, 'This item has no content settings. See Style.'));
		} else if (this.etab === 'style') {
			var dev = { d: 'Desktop', t: 'Tablet', m: 'Phone' }[this.device];
			body.appendChild(h('div', { class: 'pe-devnote d-' + this.device }, this.device === 'd' ? 'Editing styles for <b>all screens</b>. Switch to tablet or phone view at the top to set sizes for smaller screens.' : 'Editing <b>' + dev + '</b> styles. Fields marked <span class="pe-r">' + dev + '</span> only change smaller screens.'));
			(w.styleFields || []).forEach(function (f) {
				var resp = f.r && self.device !== 'd', key = self.device;
				var val = resp ? ((n.style[key] || {})[f.k]) : n.style[f.k];
				var fe = self.field(f, val, function (v) {
					if (resp) { n.style[key] = n.style[key] || {}; if (v === '' || v === null) delete n.style[key][f.k]; else n.style[key][f.k] = v; }
					else { if (v === '' || v === null) delete n.style[f.k]; else n.style[f.k] = v; }
					self.change();
				}, resp ? n.style[f.k] : null);
				if (resp) fe.querySelector('label').insertAdjacentHTML('beforeend', ' <span class="pe-r">' + dev + '</span>');
				if (self.device !== 'd' && !f.r) fe.classList.add('pe-dim');
				body.appendChild(fe);
			});
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
		[['&#8593; Up', function () { self.move(n.id, -1); }], ['&#8595; Down', function () { self.move(n.id, 1); }], ['&#10697; Copy', function () { self.duplicate(n.id); }], ['&#10005; Delete', function () { self.remove(n.id); }]].forEach(function (b) { foot.appendChild(h('button', { type: 'button', onclick: b[1] }, b[0])); });
		p.appendChild(foot);
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
				SWATCHES.concat([this.tree.props.accent]).forEach(function (c) { sw.appendChild(h('button', { type: 'button', style: 'background:' + c, title: c, 'aria-label': c, onclick: function () { tx.value = c; pick.value = c; set(c); } })); });
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
				var tmp = document.createElement('div'); tmp.innerHTML = r.html;
				var el = tmp.querySelector('#ple-' + this.sel);
				code = el ? C.pretty(el.outerHTML) : '';
				var id = '#ple-' + self.sel, out = [];
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
	P.data = function () { var r = C.render(this.tree); return { tree: this.tree, html: r.html, css: r.css, title: this.o.title }; };
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
		'#pe-tb[hidden],#pe-drop[hidden]{display:none}'
	].join('\n');

	global.PLEEditor = Editor;
})(window);
