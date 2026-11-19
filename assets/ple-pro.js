/*!
 * PLE Pro: site kit, library, copy and paste, multi-select, versions, comments, page import,
 * page checker, display conditions, live post lists, guides and client mode.
 * Extends PLEEditor; loaded only in the WordPress builder.
 */
(function (global) {
	'use strict';
	var C = global.PLECore, E = global.PLEEditor, cfg = global.PLE_BUILDER;
	if (!C || !E || !cfg || !cfg.pro) return;
	var P = E.prototype, h = C.h, esc = C.esc, W = C.W, pro = cfg.pro;
	var kit = pro.kit || {};
	C.KIT_COLORS = (kit.colors || []).map(function (c) { return c.val; });
	if (kit.bp) C.BP = { t: +kit.bp.t || 1024, m: +kit.bp.m || 767 };

	var api = function (path, method, body) {
		return fetch(pro.rest + path, { method: method || 'GET', credentials: 'same-origin', headers: { 'Content-Type': 'application/json', 'X-WP-Nonce': cfg.nonce }, body: body ? JSON.stringify(body) : undefined })
			.then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok) throw new Error((j && j.message) || 'Please try again.'); return j; }); });
	};
	var when = function (ts) { var d = new Date(ts * 1000); return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) + ', ' + d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }); };
	var COMP = {};

	/* ------------------------------------------------------------ widgets */
	var types = (pro.types || [{ name: 'post', label: 'Posts' }]).map(function (t) { return [t.name, t.label]; });
	C.def('posts', {
		label: 'Posts and lists', group: 'site', icon: 'list',
		props: { type: 'post', count: 6, cols: '3', order: 'date', filters: true, search: false, excerpt: true, btn: 'Read more', cat: '' },
		fields: [
			{ k: 'type', l: 'What to list', t: 'select', o: types },
			{ k: 'count', l: 'How many', t: 'num', u: '' },
			{ k: 'cols', l: 'Columns', t: 'select', o: [['1', '1'], ['2', '2'], ['3', '3'], ['4', '4']] },
			{ k: 'order', l: 'Order', t: 'select', o: [['date', 'Newest first'], ['title', 'A to Z'], ['menu', 'Custom order']] },
			{ k: 'cat', l: 'Only this category (posts, optional)', t: 'text' },
			{ k: 'filters', l: 'Category filter buttons', t: 'toggle' },
			{ k: 'search', l: 'Search box', t: 'toggle' },
			{ k: 'excerpt', l: 'Show a short summary', t: 'toggle' },
			{ k: 'btn', l: 'Link text', t: 'text' }
		],
		styleFields: C.STYLE_BOX,
		render: function (n, ctx) {
			var p = n.props;
			if (ctx && ctx.editing) {
				var cols = +p.cols || 3, cards = '';
				for (var i = 0; i < Math.min(+p.count || 3, cols * 2); i++) cards += '<div style="background:#fff;border-radius:14px;box-shadow:0 8px 24px rgba(15,23,42,.08);overflow:hidden"><div style="aspect-ratio:16/10;background:linear-gradient(135deg,#e2e8f0,#f8fafc)"></div><div style="padding:14px"><div style="height:12px;width:70%;background:#cbd5e1;border-radius:6px;margin-bottom:10px"></div><div style="height:9px;background:#e2e8f0;border-radius:6px;margin-bottom:6px"></div><div style="height:9px;width:60%;background:#e2e8f0;border-radius:6px"></div></div></div>';
				var label = (types.filter(function (t) { return t[0] === p.type; })[0] || [0, p.type])[1];
				return '<div class="pl-posts"><p style="font:600 13px system-ui;color:#64748b;margin:0 0 10px">Live list: latest ' + esc(label) + ' (filled in on the live site)' + (p.filters ? ' with filters' : '') + (p.search ? ' and search' : '') + '</p><div style="display:grid;grid-template-columns:repeat(' + cols + ',minmax(0,1fr));gap:18px">' + cards + '</div></div>';
			}
			var a = ' type="' + esc(p.type || 'post') + '" count="' + (+p.count || 6) + '" cols="' + (+p.cols || 3) + '" order="' + esc(p.order || 'date') + '"';
			if (p.cat) a += ' cat="' + esc(p.cat) + '"';
			if (p.filters) a += ' filters="1"';
			if (p.search) a += ' search="1"';
			a += ' excerpt="' + (p.excerpt ? 1 : 0) + '" btn="' + esc(p.btn || 'Read more').replace(/[\[\]"]/g, '') + '"';
			return '[ple_posts' + a + ']';
		}
	});
	C.def('component', {
		label: 'Global component', group: 'library', icon: 'home',
		props: { tid: 0, title: '' },
		fields: [],
		render: function (n, ctx) {
			var id = +n.props.tid;
			if (ctx && ctx.editing) {
				var c = COMP[id];
				return '<div class="pl-comp" style="position:relative">' + (c ? '<style>' + c.css + '</style>' + C.inert(c.html) : '<p style="padding:20px;text-align:center;color:#64748b;font:14px system-ui">' + esc(n.props.title || 'Global component') + '</p>') + '<span style="position:absolute;top:6px;right:6px;background:#7c3aed;color:#fff;font:600 11px system-ui;padding:3px 8px;border-radius:999px;pointer-events:none">Global: ' + esc(n.props.title || '') + '</span></div>';
			}
			return id ? '[ple_component id="' + id + '"]' : '';
		}
	});
	var renderPiece = function (node) {
		var r = C.render({ id: 'pg', type: 'page', props: { native: true }, style: {}, children: [C.clone(node)] });
		return { html: r.html, css: r.css || '' };
	};

	/* ------------------------------------------------------------ helpers */
	P.insertNode = function (n) {
		var t = this.tree, role = C.NATIVE[n.type] ? (this.role(n) === 'section' ? 'section' : n.type) : n.type;
		var kind = role === 'section' ? 'section' : n.type === 'row' ? 'row' : n.type === 'column' ? 'column' : n.type;
		var spot = this.parentFor(kind);
		if (spot && !C.accepts(spot.parent, n.type)) {
			if (n.type === 'column' || n.type === 'row') { var hold = n.type === 'column' ? C.row([n]) : n; if (C.accepts(spot.parent, hold.type)) n = hold; else if (C.accepts(spot.parent, 'section')) n = C.section([hold]); else spot = null; }
			else spot = null;
		}
		if (!spot) {
			if (t.props && t.props.native) spot = this.nativeSpot(true);
			else { if (n.type !== 'section') n = C.section([n.type === 'row' ? n : C.row([n.type === 'column' ? n : C.col([n])])]); spot = { parent: t, index: t.children.length }; }
		}
		if (!C.accepts(spot.parent, n.type)) return this.toast('That cannot go here. Select another spot first.', 'warn');
		spot.parent.children.splice(spot.index, 0, n);
		this.after(n.id);
	};
	P.selNode = function () { var hit = this.sel && C.find(this.tree, this.sel); return hit ? hit.node : null; };
	var CLIP = 'PLE1:', SCLIP = 'PLESTYLE:';
	P.copyNodes = function (ids, e) {
		var self = this, nodes = ids.map(function (id) { var x = C.find(self.tree, id); return x && C.clone(x.node); }).filter(Boolean);
		if (!nodes.length) return;
		var txt = CLIP + JSON.stringify({ v: 1, nodes: nodes, from: location.host });
		this._clip = txt;
		if (e && e.clipboardData) { e.clipboardData.setData('text/plain', txt); e.preventDefault(); }
		else if (navigator.clipboard) navigator.clipboard.writeText(txt).catch(function () { });
		this.toast(nodes.length > 1 ? nodes.length + ' items copied. Paste here or on another PLE site.' : 'Copied. Paste here or on another PLE site.');
	};
	P.pasteText = function (txt) {
		var self = this;
		if (!txt) return false;
		if (txt.indexOf(SCLIP) === 0) { this.pasteStyle(txt); return true; }
		if (txt.indexOf(CLIP) === 0) {
			var data; try { data = JSON.parse(txt.slice(CLIP.length)); } catch (x) { return false; }
			var last = null;
			(data.nodes || []).forEach(function (n) { C.reId(n); last = n; self._quiet = true; self.insertNode(n); self.sel = n.id; });
			this._quiet = false;
			if (last) this.toast((data.nodes.length > 1 ? data.nodes.length + ' items' : 'Item') + ' pasted.', 'ok');
			return true;
		}
		if (/<[a-z][\s\S]*>/i.test(txt)) { this.importMarkup(txt, ''); return true; }
		return false;
	};
	P.pasteFromClipboard = function () {
		var self = this;
		if (navigator.clipboard && navigator.clipboard.readText) {
			navigator.clipboard.readText().then(function (t) { if (!self.pasteText(t) && self._clip) self.pasteText(self._clip); }).catch(function () { if (self._clip) self.pasteText(self._clip); else self.toast('Press Ctrl+V (or long-press and Paste) to paste.', 'warn'); });
		} else if (this._clip) this.pasteText(this._clip);
	};
	P.copyStyle = function () {
		var n = this.selNode(); if (!n) return;
		var txt = SCLIP + JSON.stringify({ style: n.style || {}, fx: (n.props && n.props.fx) || null });
		this._sclip = txt;
		if (navigator.clipboard) navigator.clipboard.writeText(txt).catch(function () { });
		this.toast('Style copied. Select another item and use Paste style.');
	};
	P.pasteStyle = function (txt) {
		var self = this;
		var apply = function (t) {
			var d; try { d = JSON.parse(t.slice(SCLIP.length)); } catch (x) { return; }
			var ids = self.multi && self.multi.length ? self.multi : (self.sel ? [self.sel] : []);
			ids.forEach(function (id) { var x = C.find(self.tree, id); if (!x || x.node.type === 'txt' || x.node.type === 'cmt' || x.node.type === 'block') return; x.node.style = C.clone(d.style || {}); if (d.fx) x.node.props.fx = C.clone(d.fx); });
			self.change(); self.renderPanel(); self.toast('Style pasted.', 'ok');
		};
		if (txt) return apply(txt);
		if (this._sclip) return apply(this._sclip);
		if (navigator.clipboard && navigator.clipboard.readText) navigator.clipboard.readText().then(function (t) { if (t && t.indexOf(SCLIP) === 0) apply(t); else self.toast('Copy a style first.', 'warn'); }).catch(function () { self.toast('Copy a style first.', 'warn'); });
	};

	/* ------------------------------------------------------------ import */
	P.importMarkup = function (html, base) {
		var doc = new DOMParser().parseFromString(html, 'text/html');
		doc.querySelectorAll('script,noscript,base,meta,title,link:not([rel~="stylesheet"]),iframe[src*="googletagmanager"],#wpadminbar,.ple-ui').forEach(function (e) { e.remove(); });
		var abs = function (u) { try { return base ? new URL(u, base).href : u; } catch (x) { return u; } };
		if (base) {
			doc.querySelectorAll('[src],[href],[poster],[action]').forEach(function (e) {
				['src', 'href', 'poster', 'action'].forEach(function (a) { var v = e.getAttribute(a); if (v && !/^(#|data:|mailto:|tel:|javascript:)/i.test(v)) e.setAttribute(a, abs(v)); });
			});
			doc.querySelectorAll('[srcset]').forEach(function (e) { e.setAttribute('srcset', e.getAttribute('srcset').split(',').map(function (s) { var p = s.trim().split(/\s+/); p[0] = abs(p[0]); return p.join(' '); }).join(', ')); });
			doc.querySelectorAll('[data-src]').forEach(function (e) { if (!e.getAttribute('src') || /^data:/.test(e.getAttribute('src'))) e.setAttribute('src', abs(e.getAttribute('data-src'))); });
			doc.querySelectorAll('[style*="url("]').forEach(function (e) { e.setAttribute('style', e.getAttribute('style').replace(/url\((['"]?)([^'")]+)\1\)/g, function (m, q, u) { return /^data:/.test(u) ? m : 'url(' + q + abs(u) + q + ')'; })); });
		}
		doc.querySelectorAll('*').forEach(function (e) { [].slice.call(e.attributes).forEach(function (a) { if (/^on/i.test(a.name)) e.removeAttribute(a.name); }); });
		var styles = [].slice.call(doc.head ? doc.head.querySelectorAll('style,link[rel~="stylesheet"]') : []).map(function (e) {
			if (e.tagName === 'STYLE' && base) e.textContent = e.textContent.replace(/url\((['"]?)([^'")]+)\1\)/g, function (m, q, u) { return /^data:/.test(u) ? m : 'url(' + q + abs(u) + q + ')'; });
			return e.outerHTML;
		}).join('');
		var body = doc.body ? doc.body.innerHTML : html;
		var nodes = C.parseHTML('<div class="ple-import">' + styles + body + '</div>');
		var wrap = nodes.filter(function (n) { return n.type === 'el'; })[0];
		if (!wrap) return this.toast('There was nothing to import.', 'warn');
		wrap.props.label = 'Imported' + (base ? ': ' + base.replace(/^https?:\/\//, '').slice(0, 40) : ' code');
		this.insertNode(wrap);
		this.toast('Imported as layers. Open Layers to edit each part.', 'ok');
	};
	P.importUrl = function (url, btn) {
		var self = this;
		if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
		if (btn) { btn.disabled = true; btn.textContent = 'Importing\u2026'; }
		api('import', 'POST', { url: url }).then(function (j) { self.importMarkup(j.html, j.url); })
			.catch(function (e) { self.toast(e.message, 'err'); })
			.then(function () { if (btn) { btn.disabled = false; btn.textContent = 'Import'; } });
	};

	/* ------------------------------------------------------------ library */
	P.loadLib = function (force) {
		var self = this;
		if (this._lib && !force) return Promise.resolve(this._lib);
		if (this._libP && !force) return this._libP;
		this._libP = api('templates').then(function (l) {
			self._lib = l;
			l.forEach(function (t) { if (t.tree) COMP[t.id] = renderPiece(t.tree); });
			self._libP = null;
			return l;
		}).catch(function () { self._libP = null; self._lib = []; return []; });
		return this._libP;
	};
	P.saveToLib = function () {
		var self = this, n = this.selNode(); if (!n) return;
		var name = prompt('Name for this saved item (for example "Footer" or "Call to action"):', this.label(n).replace(/^.*?:\s*/, '').slice(0, 40));
		if (!name) return;
		var global = confirm('Make it a global component?\n\nOK = global: one copy shared across pages. Edit it once and every page updates.\nCancel = a normal saved section you can reuse and change per page.');
		var piece = renderPiece(n);
		api('templates', 'POST', { title: name, tree: C.clone(n), global: global ? 1 : 0, html: piece.html, css: piece.css }).then(function (t) {
			COMP[t.id] = piece;
			self.loadLib(true).then(function () { if (self.tab === 'add') self.renderPanel(); });
			if (global) {
				var hit = C.find(self.tree, n.id), c = C.node('component'); c.props.tid = t.id; c.props.title = t.title;
				if (hit && C.accepts(hit.parent, 'component')) { hit.parent.children.splice(hit.index, 1, c); self.sel = c.id; self.commit(); self.renderAll(); }
			}
			self.toast(global ? 'Saved as a global component. Find it under Add > My library.' : 'Saved. Find it under Add > My library.', 'ok');
		}).catch(function (e) { self.toast(e.message, 'err'); });
	};
	P.useLib = function (t) {
		if (t.global) { var c = C.node('component'); c.props.tid = t.id; c.props.title = t.title; this.insertNode(c); }
		else if (t.tree) this.insertNode(C.reId(C.clone(t.tree)));
	};
	P.editComponent = function (n) {
		var self = this, t = (this._lib || []).filter(function (x) { return +x.id === +n.props.tid; })[0];
		if (!t) return this.toast('Open Add > My library first so the component can load.', 'warn');
		if (!confirm('Unlink this copy from the global component so you can change it on this page only?')) return;
		var hit = C.find(this.tree, n.id), copy = C.reId(C.clone(t.tree));
		if (hit && C.accepts(hit.parent, copy.type)) { hit.parent.children.splice(hit.index, 1, copy); this.sel = copy.id; this.commit(); this.renderAll(); this.toast('Unlinked. Changes now affect this page only.'); }
	};

	/* ------------------------------------------------------------ checks */
	var lum = function (rgb) { var a = rgb.map(function (v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }); return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2]; };
	var parseRGB = function (s) { var m = String(s).match(/rgba?\(([^)]+)\)/); if (!m) return null; var p = m[1].split(/[,\s/]+/).filter(Boolean).map(parseFloat); return { c: p.slice(0, 3), a: p.length > 3 ? p[3] : 1 }; };
	P.checkPage = function () {
		var d = this.doc, win = this.win, out = [], pass = 0;
		if (!d) return { out: [], pass: 0 };
		var add = function (lvl, msg, el) { out.push({ lvl: lvl, msg: msg, el: el }); };
		var ok = function () { pass++; };
		var vis = function (e) { var r = e.getBoundingClientRect(); var cs = win.getComputedStyle(e); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none'; };
		var h1 = [].slice.call(d.querySelectorAll('h1')).filter(vis);
		if (!h1.length) add('err', 'The page has no main heading (H1). Search engines and screen readers use it to understand the page.'); else if (h1.length > 1) add('warn', 'The page has ' + h1.length + ' main headings (H1). Use one, and H2 for sections.', h1[1]); else ok();
		var last = 0, skipped = false;
		[].slice.call(d.querySelectorAll('h1,h2,h3,h4,h5,h6')).filter(vis).forEach(function (e) { var l = +e.tagName[1]; if (last && l > last + 1 && !skipped) { skipped = true; add('warn', 'A heading jumps from H' + last + ' to H' + l + '. Keep heading levels in order.', e); } last = l; });
		if (!skipped) ok();
		var noAlt = [].slice.call(d.querySelectorAll('img')).filter(function (i) { return !i.hasAttribute('alt') && vis(i); });
		if (noAlt.length) add('err', noAlt.length + ' picture' + (noAlt.length > 1 ? 's have' : ' has') + ' no description (alt text).', noAlt[0]); else ok();
		var big = [].slice.call(d.querySelectorAll('img')).filter(function (i) { return i.naturalWidth > 1600 && i.clientWidth && i.naturalWidth > i.clientWidth * 2.5; });
		if (big.length) add('warn', big.length + ' picture' + (big.length > 1 ? 's are' : ' is') + ' much larger than shown, which slows the page. Use a smaller size.', big[0]); else ok();
		var emptyLinks = [].slice.call(d.querySelectorAll('a,button')).filter(function (a) { return vis(a) && !(a.textContent.trim() || a.getAttribute('aria-label') || a.getAttribute('title') || a.querySelector('img[alt]:not([alt=""]),svg title')); });
		if (emptyLinks.length) add('err', emptyLinks.length + ' link' + (emptyLinks.length > 1 ? 's or buttons have' : ' or button has') + ' no text a screen reader can read.', emptyLinks[0]); else ok();
		var vague = [].slice.call(d.querySelectorAll('a')).filter(function (a) { return vis(a) && /^(click here|here|read more|more|learn more|link)$/i.test(a.textContent.trim()); });
		if (vague.length) add('info', vague.length + ' link' + (vague.length > 1 ? 's say' : ' says') + ' only "' + vague[0].textContent.trim() + '". Say where the link goes.', vague[0]); else ok();
		var dead = [].slice.call(d.querySelectorAll('a[href="#"],a[href=""]')).filter(vis);
		if (dead.length) add('warn', dead.length + ' link' + (dead.length > 1 ? 's go' : ' goes') + ' nowhere (#).', dead[0]); else ok();
		var unl = [].slice.call(d.querySelectorAll('input:not([type=hidden]):not([type=submit]):not([type=button]),select,textarea')).filter(function (i) { return vis(i) && !(i.labels && i.labels.length) && !i.getAttribute('aria-label') && !i.getAttribute('placeholder'); });
		if (unl.length) add('warn', unl.length + ' form field' + (unl.length > 1 ? 's have' : ' has') + ' no label.', unl[0]); else ok();
		/* colour contrast */
		var low = [], seen = 0;
		var bgOf = function (e) { while (e && e.nodeType === 1) { var cs = win.getComputedStyle(e); if (cs.backgroundImage && cs.backgroundImage !== 'none') return null; var c = parseRGB(cs.backgroundColor); if (c && c.a > 0.85) return c.c; e = e.parentElement; } return [255, 255, 255]; };
		[].slice.call(d.querySelectorAll('h1,h2,h3,h4,h5,h6,p,li,a,button,span,label,td,th,small,strong,blockquote')).some(function (e) {
			if (seen > 600) return true;
			var direct = [].slice.call(e.childNodes).some(function (c) { return c.nodeType === 3 && c.data.trim().length > 1; });
			if (!direct || !vis(e)) return false; seen++;
			var cs = win.getComputedStyle(e), fg = parseRGB(cs.color), bg = bgOf(e);
			if (!fg || !bg || fg.a < 0.5 || parseFloat(cs.opacity) < 0.5) return false;
			var L1 = lum(fg.c), L2 = lum(bg), ratio = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
			var size = parseFloat(cs.fontSize), bold = +cs.fontWeight >= 700, large = size >= 24 || (bold && size >= 18.66);
			if (ratio < (large ? 3 : 4.5)) low.push({ e: e, r: ratio });
			return false;
		});
		if (low.length) add('warn', low.length + ' piece' + (low.length > 1 ? 's' : '') + ' of text may be hard to read (low colour contrast, ' + low[0].r.toFixed(1) + ':1).', low[0].e); else ok();
		var title = d.title && d.title.trim();
		if (!title) add('err', 'The page has no title for search results.'); else if (title.length > 65) add('info', 'The page title is long (' + title.length + ' characters). Aim for under 60.'); else ok();
		var desc = d.querySelector('meta[name="description"]');
		if (!desc || !desc.content.trim()) add('info', 'No search description (meta description). An SEO plugin can add one.'); else ok();
		if (!d.documentElement.getAttribute('lang')) add('warn', 'The page language is not set.'); else ok();
		var words = (d.body.innerText || '').split(/\s+/).filter(Boolean).length;
		if (words < 250) add('info', 'Only about ' + words + ' words on the page. Longer, useful text helps search ranking.'); else ok();
		return { out: out, pass: pass };
	};

	/* ------------------------------------------------------------ guides */
	P.applyGuides = function () {
		var d = this.doc; if (!d || !d.head) return;
		var s = d.getElementById('pe-guides');
		if (!s) { s = d.createElement('style'); s.id = 'pe-guides'; d.head.appendChild(s); }
		s.textContent = (this.guides ? '.ple-section,section,header,footer{outline:1px dashed rgba(124,58,237,.45)!important;outline-offset:-1px}.ple-row,[data-ple] > [data-ple]{outline:1px dashed rgba(13,148,136,.35)}.ple-column{outline:1px dashed rgba(245,158,11,.5)!important;outline-offset:-1px}' : '') +
			'.pe-multi{outline:2px solid #db2777!important;outline-offset:-2px}' +
			'#pe-size{position:absolute;z-index:99999;background:#0f172a;color:#fff;font:600 11px system-ui,sans-serif;padding:2px 7px;border-radius:5px;pointer-events:none;white-space:nowrap}#pe-size[hidden]{display:none}' +
			'.pe-pad{position:absolute;z-index:99997;pointer-events:none;background:rgba(16,185,129,.18)}.pe-mar{position:absolute;z-index:99997;pointer-events:none;background:rgba(245,158,11,.18)}';
		this.markMulti();
	};
	P.markMulti = function () {
		var d = this.doc, self = this; if (!d) return;
		d.querySelectorAll('.pe-multi').forEach(function (e) { e.classList.remove('pe-multi'); });
		(this.multi || []).forEach(function (id) { var e = d.querySelector('[data-ple="' + id + '"]'); if (e) e.classList.add('pe-multi'); });
		if (this.el) this.el.classList.toggle('pe-has-multi', !!(self.multi && self.multi.length > 1));
	};
	P.drawBox = function () {
		var d = this.doc; if (!d) return;
		d.querySelectorAll('.pe-pad,.pe-mar').forEach(function (x) { x.remove(); });
		var sz = d.getElementById('pe-size');
		if (!sz) { sz = d.createElement('div'); sz.id = 'pe-size'; d.body.appendChild(sz); }
		var e = this.sel && d.querySelector('[data-ple="' + this.sel + '"]');
		if (!e || e.tagName === 'PLE-T' || e.tagName === 'PLE-B') { sz.hidden = true; return; }
		var r = e.getBoundingClientRect(), sx = this.win.scrollX, sy = this.win.scrollY, cs = this.win.getComputedStyle(e);
		sz.textContent = Math.round(r.width) + ' \u00d7 ' + Math.round(r.height);
		sz.hidden = false; sz.style.left = (r.left + sx + r.width - sz.offsetWidth) + 'px'; sz.style.top = (r.bottom + sy + 3) + 'px';
		if (!this.guides) return;
		var box = function (cls, x, y, w, hh) { if (w < 1 || hh < 1) return; var b = d.createElement('div'); b.className = cls; b.style.cssText = 'left:' + x + 'px;top:' + y + 'px;width:' + w + 'px;height:' + hh + 'px'; d.body.appendChild(b); };
		var pt = parseFloat(cs.paddingTop), pb = parseFloat(cs.paddingBottom), pl = parseFloat(cs.paddingLeft), pr = parseFloat(cs.paddingRight);
		var mt = parseFloat(cs.marginTop), mb = parseFloat(cs.marginBottom);
		box('pe-pad', r.left + sx, r.top + sy, r.width, pt); box('pe-pad', r.left + sx, r.bottom + sy - pb, r.width, pb);
		box('pe-pad', r.left + sx, r.top + sy + pt, pl, r.height - pt - pb); box('pe-pad', r.right + sx - pr, r.top + sy + pt, pr, r.height - pt - pb);
		box('pe-mar', r.left + sx, r.top + sy - mt, r.width, mt); box('pe-mar', r.left + sx, r.bottom + sy, r.width, mb);
	};

	/* ------------------------------------------------------------ multi-select */
	P.toggleMulti = function (id) {
		this.multi = this.multi || [];
		if (!this.multi.length && this.sel && this.sel !== id) this.multi.push(this.sel);
		var i = this.multi.indexOf(id);
		if (i > -1) this.multi.splice(i, 1); else this.multi.push(id);
		this.sel = id;
		this.markSel(); this.markMulti();
		if (this.tab === 'layers') this.renderPanel();
		if (this.multi.length > 1) this.toast(this.multi.length + ' selected. Delete, duplicate, copy or paste a style to all of them.');
	};
	P.clearMulti = function () { this.multi = []; this.markMulti(); };
	P.bulk = function (what) {
		var self = this, ids = (this.multi || []).slice();
		if (!ids.length) return;
		if (what === 'copy') return this.copyNodes(ids);
		if (what === 'style') return this.pasteStyle();
		var hits = ids.map(function (id) { return C.find(self.tree, id); }).filter(Boolean);
		/* Skip items inside another selected item. */
		hits = hits.filter(function (x) { var c = x; while (c && c.parent) { if (ids.indexOf(c.parent.id) > -1) return false; c = C.find(self.tree, c.parent.id); } return true; });
		if (what === 'delete') {
			hits.forEach(function (x) { var y = C.find(self.tree, x.node.id); if (y && y.parent) y.parent.children.splice(y.index, 1); });
			this.sel = null; this.multi = []; this.commit(); this.renderAll(); this.toast(hits.length + ' items deleted. Press Undo to bring them back.');
		} else if (what === 'dup') {
			hits.forEach(function (x) { var y = C.find(self.tree, x.node.id); if (y && y.parent) y.parent.children.splice(y.index + 1, 0, C.reId(C.clone(y.node))); });
			this.multi = []; this.commit(); this.renderAll(); this.toast(hits.length + ' items duplicated.');
		} else if (what === 'hide') {
			hits.forEach(function (x) { x.node.props.hideM = true; });
			this.change('style'); this.renderPanel(); this.toast('Hidden on phones.');
		}
	};

	/* ------------------------------------------------------------ wraps */
	var wrap = function (name, fn) { var orig = P[name]; P[name] = function () { return fn.call(this, orig, arguments); }; };

	wrap('build', function (orig, args) {
		var r = orig.apply(this, args), self = this;
		this.multi = [];
		this.guides = false;
		try { this.guides = localStorage.getItem('ple-guides') === '1'; } catch (x) { }
		var tabs = this.side.querySelector('.pe-tabs');
		if (tabs) tabs.appendChild(h('button', { type: 'button', role: 'tab', class: 'pe-tab', 'data-t': 'site', onclick: function () { self.showTab('site'); } }, 'Site'));
		var dock = this.el.querySelector('.pe-dock');
		if (dock) { var code = dock.querySelector('[data-t=code]'); dock.insertBefore(h('button', { type: 'button', 'data-t': 'site', onclick: function () { self.showTab('site', true); } }, C.icon('globe', 20) + '<span>Site</span>'), code); }
		if (pro.client) this.el.classList.add('pe-client');
		var onClip = function (kind) {
			return function (e) {
				var t = e.target, typing = t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));
				if (typing || !document.body.contains(self.el) || pro.client) return;
				if (kind === 'copy' && (self.sel || (self.multi && self.multi.length))) self.copyNodes(self.multi && self.multi.length > 1 ? self.multi : [self.sel], e);
				else if (kind === 'paste') { var txt = e.clipboardData && e.clipboardData.getData('text/plain'); var html = e.clipboardData && e.clipboardData.getData('text/html'); if (self.pasteText(txt || '') || (html && self.pasteText(html))) e.preventDefault(); }
			};
		};
		this._onCopy = onClip('copy'); this._onPaste = onClip('paste');
		document.addEventListener('copy', this._onCopy); document.addEventListener('paste', this._onPaste);
		this.loadLib();
		return r;
	});
	wrap('bindFrame', function (orig, args) {
		var r = orig.apply(this, args), self = this;
		this.doc.addEventListener('copy', this._onCopy); this.doc.addEventListener('paste', this._onPaste);
		this.win.addEventListener('click', function (e) {
			if (!(e.shiftKey || e.ctrlKey || e.metaKey) || pro.client) return;
			var n = e.target.closest && e.target.closest('[data-ple]'); if (!n) return;
			e.preventDefault(); e.stopPropagation(); self.toggleMulti(n.dataset.ple);
		}, true);
		this.win.addEventListener('scroll', function () { self.drawBox(); });
		this.applyGuides();
		return r;
	});
	wrap('markSel', function (orig, args) { var r = orig.apply(this, args); this.applyGuides(); this.drawBox(); return r; });
	wrap('select', function (orig, args) { if (this.multi && this.multi.length && args[0] && this.multi.indexOf(args[0]) < 0) this.multi = []; return orig.apply(this, args); });
	wrap('placeToolbar', function (orig, args) {
		var r = orig.apply(this, args);
		if (this.tb && pro.client) { [].slice.call(this.tb.querySelectorAll('button')).forEach(function (b) { if (!/parent/i.test(b.title)) b.remove(); }); }
		this.drawBox();
		return r;
	});
	wrap('showTab', function (orig, args) { if (pro.client && (args[0] === 'add')) args[0] = 'layers'; return orig.apply(this, args); });
	wrap('renderPanel', function (orig, args) {
		if (this.tab === 'site') { var p = this.panel; p.innerHTML = ''; this.panelSite(p); return; }
		var r = orig.apply(this, args);
		if (this.tab === 'layers') this.layersExtras(this.panel);
		return r;
	});
	['remove', 'duplicate', 'move', 'moveInto', 'add', 'insertAt'].forEach(function (k) {
		wrap(k, function (orig, args) { if (pro.client) return this.toast('In client mode you can change text, pictures and links. Ask your web designer for layout changes.', 'warn'); return orig.apply(this, args); });
	});
	wrap('after', function (orig, args) { if (this._quiet) { this.commit(); this.sel = args[0]; this.renderAll(); return; } return orig.apply(this, args); });
	wrap('onKey', function (orig, args) {
		var e = args[0], t = e.target, typing = t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)), mod = e.ctrlKey || e.metaKey, k = (e.key || '').toLowerCase();
		if (!typing && !pro.client) {
			if (this.multi && this.multi.length > 1 && (e.key === 'Delete' || e.key === 'Backspace')) { e.preventDefault(); return this.bulk('delete'); }
			if (this.multi && this.multi.length > 1 && mod && k === 'd') { e.preventDefault(); return this.bulk('dup'); }
			if (mod && e.altKey && k === 'c') { e.preventDefault(); return this.copyStyle(); }
			if (mod && e.altKey && k === 'v') { e.preventDefault(); return this.pasteStyle(); }
			if (e.altKey && (e.key === 'ArrowUp' || e.key === 'ArrowDown') && this.sel) { e.preventDefault(); return this.move(this.sel, e.key === 'ArrowUp' ? -1 : 1); }
			if (!mod && !e.altKey && e.key === 'ArrowUp' && this.sel) { var u = C.find(this.tree, this.sel); if (u && u.parent && u.parent.type !== 'page') { e.preventDefault(); return this.select(u.parent.id); } }
			if (!mod && !e.altKey && e.key === 'ArrowDown' && this.sel) { var dn = this.selNode(); var kid = dn && (dn.children || []).filter(function (c) { return c.type !== 'cmt' && !(c.type === 'txt' && !String(c.props.text).trim()); })[0]; if (kid) { e.preventDefault(); return this.select(kid.id); } }
			if (!mod && (e.key === 'ArrowLeft' || e.key === 'ArrowRight') && this.sel) { var s = C.find(this.tree, this.sel); if (s && s.parent) { var sib = s.parent.children[s.index + (e.key === 'ArrowLeft' ? -1 : 1)]; if (sib) { e.preventDefault(); return this.select(sib.id); } } }
			if (mod && k === 'k') { e.preventDefault(); this.showTab('add'); var q = this.panel.querySelector('.pe-search'); if (q) q.focus(); return; }
			if (e.key === 'Escape' && this.multi && this.multi.length) this.clearMulti();
		}
		if (pro.client && !typing && (e.key === 'Delete' || e.key === 'Backspace' || (mod && k === 'd'))) { e.preventDefault(); return; }
		return orig.apply(this, args);
	});
	wrap('panelAdd', function (orig, args) {
		var r = orig.apply(this, args), p = args[0], self = this;
		if (this._addQ) return r;
		var search = p.querySelector('.pe-search');
		var box = h('div', { class: 'pe-lib' });
		box.appendChild(h('h4', { class: 'pe-h' }, 'My library'));
		var lib = this._lib;
		if (!lib) { box.appendChild(h('p', { class: 'pe-hint' }, 'Loading\u2026')); this.loadLib().then(function () { if (self.tab === 'add') self.renderPanel(); }); }
		else if (!lib.length) box.appendChild(h('p', { class: 'pe-hint' }, 'Save any section or widget to reuse it on other pages: select it, open <b>Edit</b>, then <b>Save to library</b>.'));
		else {
			var g = h('div', { class: 'pe-tpls' });
			lib.forEach(function (t) {
				var tile = h('button', { type: 'button', class: 'pe-tile pe-tpl' + (t.global ? ' pe-glob' : ''), title: t.global ? 'Global: edit once, updates everywhere' : 'Saved section', onclick: function () { self.useLib(t); } }, C.icon(t.global ? 'globe' : 'rows', 22) + '<span>' + esc(t.title) + '</span>');
				var del = h('i', { class: 'pe-tdel', title: 'Remove from library', role: 'button', onclick: function (e) { e.stopPropagation(); if (!confirm('Remove "' + t.title + '" from the library?' + (t.global ? ' Pages that use it will show nothing in its place.' : ''))) return; api('templates/' + t.id, 'DELETE').then(function () { self.loadLib(true).then(function () { self.renderPanel(); }); }); } }, '&times;');
				tile.appendChild(del);
				g.appendChild(tile);
			});
			box.appendChild(g);
		}
		box.appendChild(h('button', { type: 'button', class: 'pe-wide', onclick: function () { self.showTab('site'); setTimeout(function () { var i = self.panel.querySelector('.pe-imp input'); if (i) i.focus(); }, 50); } }, 'Import any web page as layers'));
		if (search && search.nextSibling) p.insertBefore(box, search.nextSibling); else p.appendChild(box);
		return r;
	});
	wrap('panelEdit', function (orig, args) {
		if (pro.client) this.etab = 'content';
		var r = orig.apply(this, args), p = args[0], self = this, n = this.selNode();
		if (!n || pro.client) return r;
		var body = p.querySelector('.pe-fields');
		if (n.type === 'component') {
			body.appendChild(h('p', { class: 'pe-hint' }, 'This is a <b>global component</b>. It is the same on every page that uses it. To change it everywhere, edit the page where you made it and save it to the library again with the same name, or unlink it to change it here only.'));
			body.appendChild(h('button', { type: 'button', class: 'pe-wide', onclick: function () { self.editComponent(n); } }, 'Unlink and edit here'));
		}
		if (this.etab === 'adv' && n.type !== 'txt' && n.type !== 'cmt' && n.type !== 'block' && body) {
			var fx = n.props.fx = n.props.fx || {};
			var grp = h('details', { class: 'pe-grp', open: fx.ifu || fx.ifrole || fx.iffrom || fx.ifto || fx.ifparam ? true : null });
			grp.appendChild(h('summary', null, 'Display conditions'));
			var set = function (k, v) { if (v === '' || v === null) delete fx[k]; else fx[k] = v; if (!Object.keys(fx).length) delete n.props.fx; self.change(); };
			grp.appendChild(this.field({ k: 'ifu', l: 'Show to', t: 'select', o: [['', 'Everyone'], ['in', 'Only logged-in visitors'], ['out', 'Only visitors who are not logged in']] }, fx.ifu || '', function (v) { set('ifu', v); }));
			grp.appendChild(this.field({ k: 'ifrole', l: 'Only these user roles (for example subscriber, ple_student)', t: 'text' }, fx.ifrole || '', function (v) { set('ifrole', v.replace(/[^\w, -]/g, '')); }));
			var dt = function (k, l) {
				var w = h('div', { class: 'pe-f pe-f-text' }); var id = 'pd' + C.uid();
				w.appendChild(h('label', { for: id }, l));
				w.appendChild(h('input', { id: id, type: 'datetime-local', value: fx[k] || '', onchange: function () { set(k, this.value); } }));
				grp.appendChild(w);
			};
			dt('iffrom', 'Show from (date and time)'); dt('ifto', 'Show until (date and time)');
			grp.appendChild(this.field({ k: 'ifparam', l: 'Only when the link has (for example ref=facebook)', t: 'text' }, fx.ifparam || '', function (v) { set('ifparam', v.replace(/[^\w=.-]/g, '')); }));
			grp.appendChild(h('p', { class: 'pe-hint' }, 'Device visibility is above. Conditions apply on the live site; the editor always shows everything.'));
			body.appendChild(grp);
		}
		/* copy, library, presets and notes */
		var tools = h('details', { class: 'pe-grp pe-tools', open: true });
		tools.appendChild(h('summary', null, 'Copy, reuse and notes'));
		var bar = h('div', { class: 'pe-tbtns' });
		var b = function (txt, title, fn) { bar.appendChild(h('button', { type: 'button', title: title, onclick: fn }, txt)); };
		b('Copy', 'Copy (Ctrl+C). Paste on this or another PLE site.', function () { self.copyNodes([n.id]); });
		b('Paste after', 'Paste what you copied after this item (Ctrl+V)', function () { self.pasteFromClipboard(); });
		if (n.type !== 'txt' && n.type !== 'cmt' && n.type !== 'block') { b('Copy style', 'Copy the look of this item (Ctrl+Alt+C)', function () { self.copyStyle(); }); b('Paste style', 'Give this item the copied look (Ctrl+Alt+V)', function () { self.pasteStyle(); }); }
		if (n.type !== 'txt' && n.type !== 'cmt' && n.type !== 'block' && n.type !== 'component') b('Save to library', 'Reuse it on other pages, or make it a global component', function () { self.saveToLib(); });
		tools.appendChild(bar);
		var presets = (kit.presets || []);
		if (n.type !== 'txt' && n.type !== 'cmt' && n.type !== 'block') {
			var pr = h('div', { class: 'pe-f' }); pr.appendChild(h('label', null, 'Style presets'));
			var sel = h('select', { onchange: function () { var x = presets[+this.value]; if (!x) return; n.style = Object.assign(n.style || {}, C.clone(x.style || {})); self.change(); self.renderPanel(); self.toast('Preset "' + x.name + '" applied.'); } });
			sel.appendChild(h('option', { value: '' }, presets.length ? 'Apply a preset\u2026' : 'No presets yet'));
			presets.forEach(function (x, i) { sel.appendChild(h('option', { value: i }, esc(x.name))); });
			pr.appendChild(sel);
			if (pro.canTheme) pr.appendChild(h('button', { type: 'button', class: 'pe-link', onclick: function () { self.savePreset(n); } }, '+ Save this look as a preset'));
			tools.appendChild(pr);
		}
		this.commentsFor(tools, n);
		var foot = p.querySelector('.pe-efoot');
		if (foot) p.insertBefore(tools, foot); else p.appendChild(tools);
		return r;
	});

	P.savePreset = function (n) {
		var self = this, name = prompt('Name this style preset (for example "Primary button" or "Card"):');
		if (!name) return;
		var style = C.clone(n.style || {});
		kit.presets = (kit.presets || []).filter(function (x) { return x.name !== name; }).concat([{ name: name, style: style }]);
		api('kit', 'POST', { presets: kit.presets }).then(function (k) { kit = k; self.toast('Preset saved. Use it on any item, on any page.', 'ok'); self.renderPanel(); }).catch(function (e) { self.toast(e.message, 'err'); });
	};

	/* ------------------------------------------------------------ comments */
	P.loadComments = function (force) {
		var self = this;
		if (this._cm && !force) return Promise.resolve(this._cm);
		return api('page/' + cfg.id + '/comments').then(function (c) { self._cm = c; return c; }).catch(function () { self._cm = []; return []; });
	};
	P.commentsFor = function (box, n) {
		var self = this, wrapEl = h('div', { class: 'pe-cms' });
		box.appendChild(wrapEl);
		var draw = function (list) {
			wrapEl.innerHTML = '';
			var mine = list.filter(function (c) { return c.node === n.id && !c.done; });
			wrapEl.appendChild(h('label', null, 'Notes for the team' + (mine.length ? ' (' + mine.length + ')' : '')));
			mine.forEach(function (c) {
				var it = h('div', { class: 'pe-cm' }, '<b>' + esc(c.by) + '</b> <small>' + when(c.at) + '</small><p>' + esc(c.text) + '</p>');
				it.appendChild(h('button', { type: 'button', onclick: function () { api('page/' + cfg.id + '/comments', 'POST', { resolve: c.id }).then(function (l) { self._cm = l; draw(l); }); } }, 'Resolve'));
				wrapEl.appendChild(it);
			});
			var ta = h('textarea', { rows: 2, placeholder: 'Leave a note on this item\u2026' });
			wrapEl.appendChild(ta);
			wrapEl.appendChild(h('button', { type: 'button', class: 'pe-link', onclick: function () { if (!ta.value.trim()) return; api('page/' + cfg.id + '/comments', 'POST', { node: n.id, text: ta.value }).then(function (l) { self._cm = l; draw(l); self.toast('Note added.', 'ok'); }).catch(function (e) { self.toast(e.message, 'err'); }); } }, '+ Add note'));
		};
		this.loadComments().then(draw);
	};

	/* ------------------------------------------------------------ layers extras */
	P.layersExtras = function (p) {
		var self = this;
		p.querySelectorAll('.pe-node[data-id]').forEach(function (row) {
			row.addEventListener('click', function (e) {
				if (!(e.shiftKey || e.ctrlKey || e.metaKey) || pro.client) return;
				e.stopImmediatePropagation(); e.preventDefault(); self.toggleMulti(row.dataset.id);
			}, true);
		});
		if (this.multi && this.multi.length > 1) {
			var bar = h('div', { class: 'pe-bulk' }, '<b>' + this.multi.length + ' selected</b>');
			[['Delete', 'delete'], ['Duplicate', 'dup'], ['Copy', 'copy'], ['Paste style', 'style'], ['Hide on phone', 'hide'], ['Clear', 'clear']].forEach(function (x) { bar.appendChild(h('button', { type: 'button', onclick: function () { if (x[1] === 'clear') { self.clearMulti(); self.renderPanel(); } else self.bulk(x[1]); } }, x[0])); });
			p.insertBefore(bar, p.firstChild);
		} else if (!pro.client) {
			var hint = p.querySelector('.pe-hint'); if (hint) hint.insertAdjacentHTML('beforeend', ' Shift-click to select several.');
		}
		if (this._cm && this._cm.length) {
			var open = {}; this._cm.forEach(function (c) { if (!c.done) open[c.node] = (open[c.node] || 0) + 1; });
			p.querySelectorAll('.pe-node[data-id]').forEach(function (row) { if (open[row.dataset.id]) row.querySelector('.pe-nl').insertAdjacentHTML('afterend', '<span class="pe-cmb" title="Notes">' + open[row.dataset.id] + '</span>'); });
		} else if (!this._cm) this.loadComments().then(function () { if (self.tab === 'layers') self.renderPanel(); });
	};

	/* ------------------------------------------------------------ Site panel */
	var FONTS = ['Inter', 'Poppins', 'Montserrat', 'Roboto', 'Open Sans', 'Lato', 'Nunito', 'Raleway', 'DM Sans', 'Plus Jakarta Sans', 'Manrope', 'Outfit', 'Sora', 'Space Grotesk', 'Work Sans', 'Rubik', 'Playfair Display', 'Merriweather', 'Lora', 'DM Serif Display', 'Libre Baskerville', 'Bebas Neue', 'Oswald', 'Archivo', 'Figtree', 'Urbanist', 'Lexend'];
	P.panelSite = function (p) {
		var self = this;
		var sec = function (title, open) { var d = h('details', { class: 'pe-grp', open: open ? true : null }); d.appendChild(h('summary', null, title)); p.appendChild(d); var b = h('div', { class: 'pe-sbody' }); d.appendChild(b); return b; };

		/* page check */
		var ck = sec('Check this page (SEO and accessibility)', true);
		ck.appendChild(h('button', { type: 'button', class: 'pe-wide', onclick: function () {
			var res = self.checkPage(); out.innerHTML = '';
			var errs = res.out.filter(function (x) { return x.lvl !== 'info'; }).length;
			out.appendChild(h('div', { class: 'pe-score ' + (errs ? (errs > 3 ? 'bad' : 'mid') : 'good') }, '<b>' + res.pass + '</b> checks passed' + (res.out.length ? ', <b>' + res.out.length + '</b> to look at' : '. Well done.')));
			res.out.forEach(function (x) {
				var it = h('button', { type: 'button', class: 'pe-issue ' + x.lvl }, '<i>' + ({ err: 'Fix', warn: 'Improve', info: 'Tip' })[x.lvl] + '</i>' + esc(x.msg));
				if (x.el) it.onclick = function () { var t = x.el.closest && x.el.closest('[data-ple]'); x.el.scrollIntoView({ behavior: 'smooth', block: 'center' }); if (t) { self.sel = t.dataset.ple; self.markSel(); self.placeToolbar(); } };
				out.appendChild(it);
			});
		} }, 'Check now'));
		var out = h('div', { class: 'pe-checks' }); ck.appendChild(out);

		/* versions */
		var vs = sec('Named versions');
		var vin = h('input', { type: 'text', placeholder: 'Name, for example "Before new hero"' });
		var vrow = h('div', { class: 'pe-inrow' }); vrow.appendChild(vin);
		vrow.appendChild(h('button', { type: 'button', onclick: function () {
			var name = vin.value.trim() || 'Version ' + new Date().toLocaleString();
			api('page/' + cfg.id + '/versions', 'POST', { name: name, tree: self.tree }).then(function (l) { vin.value = ''; drawV(l); self.toast('Version saved.', 'ok'); }).catch(function (e) { self.toast(e.message, 'err'); });
		} }, 'Save'));
		vs.appendChild(vrow);
		var vlist = h('div', { class: 'pe-vlist' }, '<p class="pe-hint">Loading\u2026</p>'); vs.appendChild(vlist);
		var drawV = function (l) {
			vlist.innerHTML = '';
			if (!l.length) { vlist.appendChild(h('p', { class: 'pe-hint' }, 'Save a version before big changes, so you can go back to it any time.')); return; }
			l.forEach(function (v) {
				var it = h('div', { class: 'pe-ver' }, '<span><b>' + esc(v.name) + '</b><small>' + when(v.at) + ' \u00b7 ' + esc(v.by) + '</small></span>');
				it.appendChild(h('button', { type: 'button', onclick: function () {
					if (!v.tree || !v.tree.children) return;
					if (!!(v.tree.props && v.tree.props.native) !== !!(self.tree.props && self.tree.props.native)) return self.toast('This version was made in a different editing mode.', 'warn');
					if (!confirm('Restore "' + v.name + '"? You can undo this, and nothing goes live until you save.')) return;
					self.tree = C.clone(v.tree); self.sel = null; self.multi = []; self.commit(); self.renderAll(); self.toast('Restored. Save to make it live.', 'ok');
				} }, 'Restore'));
				vlist.appendChild(it);
			});
		};
		api('page/' + cfg.id + '/versions').then(drawV).catch(function () { drawV([]); });

		/* notes */
		var cs = sec('Team notes on this page');
		var clist = h('div', null, '<p class="pe-hint">Loading\u2026</p>'); cs.appendChild(clist);
		this.loadComments(true).then(function (l) {
			clist.innerHTML = '';
			var open = l.filter(function (c) { return !c.done; });
			if (!open.length) { clist.appendChild(h('p', { class: 'pe-hint' }, 'No open notes. Select any item and add a note in Edit.')); return; }
			open.forEach(function (c) {
				var it = h('button', { type: 'button', class: 'pe-cm pe-cmgo' }, '<b>' + esc(c.by) + '</b> <small>' + when(c.at) + '</small><p>' + esc(c.text) + '</p>');
				it.onclick = function () { if (C.find(self.tree, c.node)) { self.select(c.node); self.etab = 'content'; self.showTab('edit'); var e = self.doc.querySelector('[data-ple="' + c.node + '"]'); if (e) e.scrollIntoView({ behavior: 'smooth', block: 'center' }); } else self.toast('That item is no longer on the page.', 'warn'); };
				clist.appendChild(it);
			});
		});

		if (!pro.client) {
			/* import */
			var im = sec('Import a page', false);
			im.classList.add('pe-imp');
			im.appendChild(h('p', { class: 'pe-hint' }, 'Bring in any public web page, or paste HTML. It arrives as real sections and elements you can edit in Layers.'));
			var uin = h('input', { type: 'url', placeholder: 'https://example.com/page' });
			var irow = h('div', { class: 'pe-inrow' }); irow.appendChild(uin);
			var ib = h('button', { type: 'button', onclick: function () { if (uin.value.trim()) self.importUrl(uin.value.trim(), ib); } }, 'Import');
			irow.appendChild(ib); im.appendChild(irow);
			var hta = h('textarea', { rows: 4, class: 'pe-mono', placeholder: '<section>\u2026paste HTML here\u2026</section>' });
			im.appendChild(hta);
			im.appendChild(h('button', { type: 'button', class: 'pe-link', onclick: function () { if (hta.value.trim()) { self.importMarkup(hta.value, ''); hta.value = ''; } } }, 'Add this HTML as layers'));
			im.parentNode.open = false;
		}

		/* guides */
		var gs = sec('Guides');
		gs.appendChild(this.field({ k: 'g', l: 'Show outlines, spacing and sizes', t: 'toggle' }, this.guides, function (v) { self.guides = !!v; try { localStorage.setItem('ple-guides', v ? '1' : '0'); } catch (x) { } self.applyGuides(); self.drawBox(); }));
		gs.appendChild(h('p', { class: 'pe-hint' }, 'Green shows padding, amber shows margin. The size of the selected item shows under it.'));

		/* site kit */
		if (pro.canTheme && !pro.client) {
			var ks = sec('Site colours, fonts and effects');
			ks.appendChild(h('p', { class: 'pe-hint' }, 'These apply to every page. Colours appear first in every colour picker and as CSS variables like <code>var(--pl-primary)</code>.'));
			var cl = h('div', { class: 'pe-kitc' }); ks.appendChild(cl);
			var colors = C.clone(kit.colors || []);
			var drawC = function () {
				cl.innerHTML = '';
				colors.forEach(function (c, i) {
					var r = h('div', { class: 'pe-kitrow' });
					r.appendChild(h('input', { type: 'color', value: c.val, oninput: function () { c.val = this.value; } }));
					r.appendChild(h('input', { type: 'text', value: c.name, oninput: function () { c.name = this.value; } }));
					r.appendChild(h('button', { type: 'button', class: 'pe-x', title: 'Remove', onclick: function () { colors.splice(i, 1); drawC(); } }, '&times;'));
					cl.appendChild(r);
				});
				if (colors.length < 12) cl.appendChild(h('button', { type: 'button', class: 'pe-link', onclick: function () { colors.push({ name: 'Colour ' + (colors.length + 1), val: '#64748b' }); drawC(); } }, '+ Add colour'));
			};
			drawC();
			var dl = h('datalist', { id: 'pe-fonts' }, FONTS.map(function (f) { return '<option value="' + f + '">'; }).join(''));
			ks.appendChild(dl);
			var fonts = C.clone(kit.fonts || { heading: '', body: '' });
			[['heading', 'Heading font (Google Fonts name)'], ['body', 'Body font (Google Fonts name)']].forEach(function (f) {
				var w = h('div', { class: 'pe-f pe-f-text' }); var id = 'pk' + C.uid();
				w.appendChild(h('label', { for: id }, f[1]));
				w.appendChild(h('input', { id: id, type: 'text', list: 'pe-fonts', value: fonts[f[0]] || '', placeholder: 'Theme default', oninput: function () { fonts[f[0]] = this.value; } }));
				ks.appendChild(w);
			});
			var fx = C.clone(kit.effects || {}), bp = C.clone(kit.bp || { t: 1024, m: 767 }), webp = kit.webp === undefined ? 1 : kit.webp;
			ks.appendChild(this.field({ k: 'cursor', l: 'Custom cursor', t: 'select', o: [['', 'Normal'], ['dot', 'Dot'], ['ring', 'Ring']] }, fx.cursor || '', function (v) { fx.cursor = v; }));
			ks.appendChild(this.field({ k: 'fade', l: 'Fade pages in', t: 'toggle' }, !!fx.fade, function (v) { fx.fade = v ? '1' : ''; }));
			ks.appendChild(this.field({ k: 'smooth', l: 'Smooth scrolling to #links', t: 'toggle' }, !!fx.smooth, function (v) { fx.smooth = v ? '1' : ''; }));
			ks.appendChild(this.field({ k: 'bt', l: 'Tablet breakpoint', t: 'num', u: 'px' }, bp.t, function (v) { bp.t = +v || 1024; }));
			ks.appendChild(this.field({ k: 'bm', l: 'Phone breakpoint', t: 'num', u: 'px' }, bp.m, function (v) { bp.m = +v || 767; }));
			ks.appendChild(this.field({ k: 'webp', l: 'Turn uploaded JPG and PNG pictures into fast WebP', t: 'toggle' }, !!webp, function (v) { webp = v ? 1 : 0; }));
			var sb = h('button', { type: 'button', class: 'pe-wide', onclick: function () {
				sb.disabled = true; sb.textContent = 'Saving\u2026';
				api('kit', 'POST', { colors: colors, fonts: fonts, effects: fx, bp: bp, webp: webp }).then(function (k) {
					kit = k; C.KIT_COLORS = k.colors.map(function (c) { return c.val; }); C.BP = { t: +k.bp.t, m: +k.bp.m };
					self.toast('Site design saved. Save the page to apply new breakpoints to it.', 'ok');
					self.loadTemplateFresh();
				}).catch(function (e) { self.toast(e.message, 'err'); }).then(function () { sb.disabled = false; sb.textContent = 'Save site design'; });
			} }, 'Save site design');
			ks.appendChild(sb);
			if ((kit.presets || []).length) {
				var ps = sec('Style presets');
				kit.presets.forEach(function (x, i) {
					var it = h('div', { class: 'pe-ver' }, '<span><b>' + esc(x.name) + '</b></span>');
					it.appendChild(h('button', { type: 'button', onclick: function () { if (!confirm('Delete the preset "' + x.name + '"? Items already styled keep their look.')) return; kit.presets.splice(i, 1); api('kit', 'POST', { presets: kit.presets }).then(function (k) { kit = k; self.renderPanel(); }); } }, 'Delete'));
					ps.appendChild(it);
				});
			}
		}

		/* shortcuts */
		var ks2 = sec('Keyboard shortcuts');
		ks2.appendChild(h('div', { class: 'pe-keys' }, [['Ctrl+S', 'Save'], ['Ctrl+Z / Ctrl+Y', 'Undo / redo'], ['Ctrl+C / Ctrl+V', 'Copy / paste items (works between sites)'], ['Ctrl+Alt+C / V', 'Copy / paste style'], ['Ctrl+D', 'Duplicate'], ['Delete', 'Delete'], ['Shift+click', 'Select several'], ['Alt+\u2191 / \u2193', 'Move up / down'], ['\u2191 \u2193 \u2190 \u2192', 'Select parent, child, previous, next'], ['Ctrl+K', 'Find a widget'], ['Esc', 'Clear selection']].map(function (k) { return '<div><kbd>' + k[0] + '</kbd><span>' + k[1] + '</span></div>'; }).join('')));
	};
	P.loadTemplateFresh = function () {
		var self = this;
		if (!this.o.pageTemplate) return this.renderCanvas();
		fetch(cfg.canvas, { credentials: 'same-origin', cache: 'no-store' }).then(function (r) { return r.text(); }).then(function (t) { if (t.indexOf('<!--PLE-ROOT-->') > -1) { self.o.pageTemplate = t; if (self.loadTemplate) self.loadTemplate(); else self.renderCanvas(); } }).catch(function () { });
	};

	/* ------------------------------------------------------------ styles */
	var css = [
		'.pe-tpls .pe-tile{position:relative}.pe-glob{border-color:#c4b5fd!important;background:#f5f3ff!important}',
		'.pe-tdel{position:absolute;top:4px;right:6px;font-style:normal;font-size:16px;line-height:1;color:#94a3b8;padding:2px 4px;border-radius:4px}.pe-tdel:hover{background:#fee2e2;color:#dc2626}',
		'.pe-tbtns{display:grid;grid-template-columns:1fr 1fr;gap:6px;padding:0 12px 10px}.pe-tbtns button{border:1px solid var(--line);background:#fff;border-radius:8px;padding:8px 6px;font-weight:600;font-size:13px}.pe-tbtns button:hover{border-color:var(--pri);color:var(--pri)}',
		'.pe-tools .pe-f{padding:0 12px}.pe-link{border:0;background:none;color:var(--pri);font-weight:600;padding:6px 0;margin:2px 0 6px}',
		'.pe-cms{padding:4px 12px 12px;display:grid;gap:6px}.pe-cms label{font-weight:600;font-size:13px}.pe-cms textarea,.pe-sbody textarea,.pe-sbody input[type=text],.pe-sbody input[type=url]{width:100%;border:1px solid var(--line);border-radius:8px;padding:8px 10px;background:#fff}',
		'.pe-cm{display:block;width:100%;text-align:left;border:1px solid #fde68a;background:#fffbeb;border-radius:8px;padding:8px 10px}.pe-cm p{margin:4px 0 0}.pe-cm small{color:var(--mut)}.pe-cm button{border:0;background:none;color:var(--pri);font-weight:600;padding:4px 0 0}.pe-cmgo{margin-bottom:6px}',
		'.pe-cmb{display:inline-grid;place-items:center;min-width:18px;height:18px;border-radius:9px;background:#f59e0b;color:#fff;font-size:11px;font-weight:700;margin-left:4px}',
		'.pe-node.multi{background:#fdf2f8!important;box-shadow:inset 3px 0 0 #db2777}',
		'.pe-bulk{position:sticky;top:0;z-index:2;display:flex;flex-wrap:wrap;gap:6px;align-items:center;background:#fdf2f8;border:1px solid #fbcfe8;border-radius:10px;padding:8px;margin-bottom:10px}.pe-bulk b{margin-right:auto;font-size:13px}.pe-bulk button{border:1px solid #f9a8d4;background:#fff;border-radius:7px;padding:5px 9px;font-size:12px;font-weight:600}',
		'.pe-sbody{padding:0 12px 12px}.pe-sbody .pe-f{padding:0}',
		'.pe-inrow{display:flex;gap:6px;margin-bottom:8px}.pe-inrow input{flex:1;min-width:0}.pe-inrow button{border:0;background:var(--pri);color:#fff;border-radius:8px;padding:0 14px;font-weight:600}.pe-inrow button:disabled{opacity:.6}',
		'.pe-ver{display:flex;align-items:center;gap:8px;border-bottom:1px solid var(--line);padding:8px 0}.pe-ver span{flex:1;min-width:0}.pe-ver small{display:block;color:var(--mut);font-size:12px}.pe-ver button{border:1px solid var(--line);background:#fff;border-radius:7px;padding:5px 10px;font-weight:600;font-size:12px}',
		'.pe-score{border-radius:10px;padding:10px 12px;margin-bottom:8px}.pe-score.good{background:#f0fdf4;color:#166534}.pe-score.mid{background:#fffbeb;color:#92400e}.pe-score.bad{background:#fef2f2;color:#991b1b}',
		'.pe-issue{display:block;width:100%;text-align:left;border:1px solid var(--line);background:#fff;border-radius:8px;padding:8px 10px;margin-bottom:6px;font-size:13px}.pe-issue i{font-style:normal;font-weight:700;font-size:11px;text-transform:uppercase;letter-spacing:.05em;margin-right:6px;padding:2px 6px;border-radius:4px}',
		'.pe-issue.err i{background:#fee2e2;color:#b91c1c}.pe-issue.warn i{background:#fef3c7;color:#92400e}.pe-issue.info i{background:#e0f2fe;color:#075985}.pe-issue:hover{border-color:var(--pri)}',
		'.pe-kitrow{display:flex;gap:6px;align-items:center;margin-bottom:6px}.pe-kitrow input[type=color]{width:38px;height:34px;padding:0;border:1px solid var(--line);border-radius:8px;background:#fff}.pe-kitrow input[type=text]{flex:1}',
		'.pe-keys{display:grid;gap:6px;font-size:13px}.pe-keys div{display:flex;justify-content:space-between;gap:10px}.pe-keys kbd{font:600 12px ui-monospace,monospace;background:var(--soft);border:1px solid var(--line);border-radius:5px;padding:1px 6px;white-space:nowrap}.pe-keys span{color:var(--mut);text-align:right}',
		'.pe-client .pe-tab[data-t=add],.pe-client .pe-dock [data-t=add],.pe-client .pe-dock [data-t=code],.pe-client .pe-codeb,.pe-client .pe-na,.pe-client .pe-efoot,.pe-client .pe-etabs,.pe-client .pe-codetoggle{display:none!important}',
		'.pe-client .pe-logo:after{content:"Client mode";margin-left:8px;font-size:11px;font-weight:600;background:#7c3aed;color:#fff;padding:2px 8px;border-radius:999px}'
	].join('\n');
	var st = document.createElement('style'); st.id = 'ple-pro-css'; st.textContent = css; document.head.appendChild(st);
})(window);
