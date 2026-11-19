/*!
 * PLE Design Lab: get-started guide, makeover demo and tutorial, and design lessons
 * (watch it built, build it with guidance, then practise alone) for every kind of section.
 * Runs inside PLE Studio on top of the real editor.
 */
(function (g) {
	'use strict';
	var C = g.PLECore, W = C.W, h = C.h, esc = C.esc, icon = C.icon;
	var X = function () { return g.PLEStudio; };
	var LAB = function () { return g.PLE_LAB; };
	var labState = null;

	/* ================================================================ labels */
	var EXTRA = {
		grad1: ['Gradient background: colour 1', 'color'], grad2: ['Gradient background: colour 2', 'color'], gangle: ['Gradient angle', 'num'],
		glass: ['Frosted glass', 'toggle'], gradText: ['Gradient text', 'toggle'], g1: ['Gradient text: colour 1', 'color'], g2: ['Gradient text: colour 2', 'color'], op: ['Opacity (0 to 1)', 'num'],
		flex: ['Arrange children', 'select'], fdir: ['Direction', 'select'], gcols: ['Grid columns', 'num'], fwrap: ['Wrap', 'select'], jc: ['Spread', 'select'], ai: ['Align', 'select'], fgap: ['Gap', 'num'],
		w: ['Width', 'num'], mw: ['Maximum width', 'num'], pos: ['Position', 'select'], top: ['Top', 'num'], left: ['Left', 'num'], right: ['Right', 'num'], bottom: ['Bottom', 'num'], z: ['Layer order (z-index)', 'num']
	};
	var GROUP = { grad1: 'Effects', grad2: 'Effects', gangle: 'Effects', glass: 'Effects', gradText: 'Effects', g1: 'Effects', g2: 'Effects', op: 'Effects', flex: 'Layout and position', fdir: 'Layout and position', gcols: 'Layout and position', fwrap: 'Layout and position', jc: 'Layout and position', ai: 'Layout and position', fgap: 'Layout and position', w: 'Layout and position', mw: 'Layout and position', pos: 'Layout and position', top: 'Layout and position', left: 'Layout and position', right: 'Layout and position', bottom: 'Layout and position', z: 'Layout and position' };
	var BGX = { bgVideo: ['Background video (YouTube link or .mp4)', 'url'], particles: ['Particle background colour', 'color'], divTop: ['Shape divider at the top', 'select'], divBot: ['Shape divider at the bottom', 'select'], divColor: ['Divider colour', 'color'], divH: ['Divider height', 'num'] };
	var FX = {
		'in': ['Animation', 'select', { fade: 'Fade in', 'fade-up': 'Fade up', 'fade-down': 'Fade down', 'fade-left': 'Slide from left', 'fade-right': 'Slide from right', 'zoom-in': 'Zoom in', 'zoom-out': 'Zoom out', 'flip-up': 'Flip up', 'blur-in': 'Blur in', 'slide-up': 'Rise up', bounce: 'Bounce in', mask: 'Wipe reveal' }],
		dur: ['Duration (ms)', 'num'], delay: ['Delay (ms)', 'num'], text: ['Reveal text', 'select', { words: 'Word by word', letters: 'Letter by letter' }], once: ['Play', 'select', { '0': 'Every time it scrolls into view' }],
		hover: ['On mouse over', 'select', { lift: 'Lift with shadow', grow: 'Grow', shrink: 'Shrink', glow: 'Glow', rotate: 'Tilt slightly', tilt: '3D tilt (follows mouse)', magnetic: 'Magnetic (follows mouse)', shine: 'Shine sweep', brighten: 'Brighten' }],
		loop: ['Loop', 'select', { 'float': 'Float', pulse: 'Pulse', bounce: 'Bob', heartbeat: 'Heartbeat', sway: 'Sway', spin: 'Spin', kenburns: 'Slow zoom (Ken Burns)', gradient: 'Moving gradient background' }],
		scroll: ['While scrolling', 'select', { parallax: 'Parallax (vertical)', fade: 'Fade in and out', scale: 'Grow in the middle' }], speed: ['Strength (1 to 10)', 'num'],
		sticky: ['Stick when scrolling', 'select', { top: 'Stick to the top', bottom: 'Stick to the bottom' }], offset: ['Gap from the top', 'num'], hide: ['Hide when scrolling down, show when scrolling up', 'toggle'], sd: ['Sticky on', 'select'], devices: ['Animations on', 'select']
	};
	var ADV = { label: ['Name in Layers', 'text'], anchor: ['Anchor ID (for links like #contact)', 'text'], cls: ['CSS class', 'text'], hideD: ['Hide on desktop', 'toggle'], hideT: ['Hide on tablet', 'toggle'], hideM: ['Hide on phone', 'toggle'] };
	var TAB = { content: 'Content', style: 'Style', motion: 'Motion', adv: 'Advanced' };
	var typeLabel = function (t) { return (W[t] && W[t].label) || t; };

	/* Where a setting lives in the editor, its label and kind. */
	function fieldInfo(type, k, where) {
		var w = W[type] || {};
		if (where === 'motion') { var f = FX[k] || [k, 'text']; return { where: 'motion', l: f[0], t: f[1], o: f[2] }; }
		if (where === 'adv') { var a = ADV[k] || [k, 'text']; return { where: 'adv', l: a[0], t: a[1] }; }
		if (where === 'bgx') { var b = BGX[k]; return { where: 'style', store: 'props', l: b[0], t: b[1], group: 'Backgrounds and dividers' }; }
		var list = where === 'content' ? (w.fields || []) : (w.styleFields || []);
		for (var i = 0; i < list.length; i++) if (list[i].k === k) return { where: where, l: list[i].l, t: list[i].t, o: list[i].o, r: list[i].r, sub: list[i].sub };
		if (where === 'style' && EXTRA[k]) return { where: 'style', l: EXTRA[k][0], t: EXTRA[k][1], group: GROUP[k], r: GROUP[k] === 'Layout and position' && k !== 'z' };
		return null;
	}
	function display(info, v) {
		if (v === undefined || v === null || v === '') return 'empty';
		if (info.t === 'color') return '<span class="ag-sw" style="background:' + esc(v) + '"></span>' + esc(v);
		if (info.t === 'toggle') return v ? 'On' : 'Off';
		if (info.t === 'items') return v.length + ' items';
		if (info.t === 'image') return 'a picture';
		if (info.t === 'select') {
			if (Array.isArray(info.o)) { for (var i = 0; i < info.o.length; i++) if (String(info.o[i][0]) === String(v)) return '<b>' + esc(info.o[i][1]) + '</b>'; }
			else if (info.o && info.o[v]) return '<b>' + esc(info.o[v]) + '</b>';
		}
		var s = String(v).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
		return '<b>' + esc(s.length > 48 ? s.slice(0, 48) + '\u2026' : s) + '</b>';
	}
	var FREE_T = /^(text|textarea|html|url|image)$/;
	/* Short design reasons, shown while a setting is being changed, so learners know why, not just how. */
	var WHY = {
		bgImg: 'A real photo makes the section feel human and trustworthy.',
		overlay: 'A dark layer over the photo keeps white text easy to read.',
		minH: 'A tall hero fills the first screen, so the message gets full attention.',
		valign: 'Centring the content vertically looks balanced on every screen size.',
		pt: 'Generous space above and below lets the content breathe.', pb: 'Generous space above and below lets the content breathe.',
		px: 'Side padding stops text touching the edges on phones.',
		size: 'Size creates hierarchy: the most important words should be the biggest.',
		weight: 'Bold headlines are scanned first.',
		color: 'Strong contrast between text and background keeps it readable.',
		bg: 'Background colour separates sections and guides the eye down the page.',
		radius: 'Rounded corners feel friendly and modern.',
		shadow: 'A soft shadow lifts the card off the page so it looks clickable.',
		align: 'Centred text suits short, punchy content; long text reads better left-aligned.',
		gap: 'Even gaps between columns make the layout look tidy.',
		grad1: 'A two-colour gradient adds depth without needing a photo.', grad2: 'A two-colour gradient adds depth without needing a photo.',
		gradText: 'Gradient text makes one key line stand out. Use it once per page.',
		ic: 'Icons in your brand colour tie the design together.',
		mb: 'Space below groups related items and separates the rest.', mt: 'Space above separates this item from the one before.',
		w: 'Wider columns get more attention; use them for the main message.',
		'in': 'A gentle entrance draws the eye to new content as people scroll.',
		delay: 'Small delays make items appear one after another, like a story.',
		hover: 'A hover effect tells visitors this is clickable.',
		loop: 'A slow, repeating motion catches attention. Use it on one thing only.',
		sticky: 'A sticky menu keeps navigation in reach on long pages.',
		text: 'Revealing words one by one slows the reader down for an important line.',
		look: 'An outline button is quieter, so the main button stays the clear first choice.',
		width: 'A narrow width keeps lines short and easy to read.',
		particles: 'Moving dots add energy to a plain dark background.',
		shadowcard: ''
	};
	var WHY_C = { text: 'Write for the visitor: say what they get, in plain words.', html: 'Keep it to one or two short sentences.', title: 'Short titles are scanned; long ones are skipped.', brand: 'Your name in the menu tells people where they are.', src: 'Sharp pictures of real people and real work build trust.', href: 'Every button should lead somewhere useful.', tag: 'Use one H1 per page for the main headline and H2 for section titles.', items: 'Edit the list so every item is real and specific.', cta: 'One clear action in the menu brings more enquiries.', links: 'Five links or fewer keeps the menu easy to scan.' };
	var WHY_M = { 'in': WHY['in'], delay: WHY.delay, hover: WHY.hover, loop: WHY.loop, sticky: WHY.sticky, text: 'Revealing words one by one slows the reader down for an important line.', hide: 'Hiding the menu while scrolling down gives more room to read.' };
	function whyFor(op) {
		if (op.t !== 'set') return '';
		if (op.dev) return 'Big desktop sizes are too large for phones, so phones get their own size.';
		if (op.where === 'motion') return WHY_M[op.k] || '';
		if (op.where === 'content') return WHY_C[op.k] || (op.k === 'width' ? WHY.width : op.k === 'look' ? WHY.look : '');
		return op.k === 'text' ? '' : (WHY[op.k] || '');
	}

	/* ================================================================ refs */
	/* A ref finds a node in any tree: by id, by position, or by what a section contains. */
	function sectionOf(tree, s) {
		if (typeof s === 'number') return tree.children[s] || null;
		if (typeof s === 'function') return s(tree) || null;
		if (s && s.id) { var f = C.find(tree, s.id); return f ? f.node : null; }
		return null;
	}
	function resolve(tree, ref) {
		if (!ref) return null;
		if (ref.id) { var f = C.find(tree, ref.id); return f ? f.node : null; }
		if (ref.fn) return ref.fn(tree) || null;
		var n = sectionOf(tree, ref.s); if (!n) return null;
		if (ref.r !== undefined) { n = (n.children || [])[ref.r]; if (!n) return null; }
		if (ref.c !== undefined) { n = (n.children || [])[ref.c]; if (!n) return null; }
		if (ref.w) {
			var k = 0, hit = null;
			C.walk(n, function (x) { if (x !== n && x.type === ref.w.type) { if (k === (ref.w.nth || 0)) { hit = x; return false; } k++; } });
			return hit;
		}
		return n;
	}
	var has = function (type, test) { return function (tree) { return tree.children.filter(function (s) { var ok = false; C.walk(s, function (x) { if (x.type === type && (!test || test(x))) { ok = true; return false; } }); return ok; })[0]; }; };

	/* ================================================================ values */
	function getVal(node, op) {
		if (!node) return undefined;
		if (op.where === 'motion') return (node.props.fx || {})[op.k];
		if (op.where === 'content' || op.where === 'adv' || op.store === 'props') return node.props[op.k];
		if (op.dev && op.dev !== 'd') return (node.style[op.dev] || {})[op.k];
		return node.style[op.k];
	}
	function setVal(node, op, v) {
		if (op.where === 'motion') { var fx = node.props.fx = node.props.fx || {}; if (v === '' || v === null) delete fx[op.k]; else fx[op.k] = v; return; }
		if (op.where === 'content' || op.where === 'adv' || op.store === 'props') { node.props[op.k] = v; return; }
		var st = node.style; if (op.dev && op.dev !== 'd') { st = node.style[op.dev] = node.style[op.dev] || {}; }
		if (v === '' || v === null) delete st[op.k]; else st[op.k] = v;
	}
	var hex = function (c) { c = String(c || '').trim().toLowerCase(); var m = c.match(/^#([0-9a-f]{3})$/); if (m) c = '#' + m[1].split('').map(function (x) { return x + x; }).join(''); return c; };
	var rgb = function (c) { c = hex(c); var m = c.match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/); return m ? [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)] : null; };
	function same(info, got, want, op) {
		if (op.free) {
			if (info.t === 'items') return Array.isArray(got) && got.length >= Math.min(2, (want || []).length);
			return got !== undefined && got !== null && String(got).replace(/<[^>]+>/g, '').trim() !== '' && JSON.stringify(got) !== JSON.stringify(op.from);
		}
		if (want === '' || want === null || want === undefined) return got === '' || got === null || got === undefined;
		if (got === undefined || got === null || got === '') return false;
		if (info.t === 'color') { var a = rgb(got), b = rgb(want); if (a && b) return Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]) <= 45; return hex(got) === hex(want); }
		if (info.t === 'num' || typeof want === 'number') { var x = +got, y = +want; if (isNaN(x)) return false; return Math.abs(x - y) <= Math.max(2, Math.abs(y) * 0.15); }
		if (info.t === 'toggle') return !!got === !!want;
		if (info.t === 'items') return Array.isArray(got) && got.length === want.length;
		return String(got).trim().toLowerCase() === String(want).trim().toLowerCase();
	}

	/* ================================================================ recipes */
	/* Turn a finished design into the exact steps that build it. */
	function diffOps(n, ref) {
		var base = C.node(n.type), ops = [];
		var add = function (where, k, v, dev) {
			var info = fieldInfo(n.type, k, where); if (!info) return;
			var op = { t: 'set', ref: ref, type: n.type, where: info.where, store: info.store, k: k, v: v, dev: dev };
			if (where === 'content' && FREE_T.test(info.t) && k !== 'tag' && v !== '') op.free = 1;
			if (info.t === 'items') op.free = 1;
			op.from = where === 'content' ? base.props[k] : undefined;
			ops.push(op);
		};
		var eq = function (a, b) { return JSON.stringify(a) === JSON.stringify(b); };
		Object.keys(n.props).forEach(function (k) {
			if (k === 'fx' || eq(n.props[k], base.props[k])) return;
			if (BGX[k]) add('bgx', k, n.props[k]);
			else if (ADV[k]) add('adv', k, n.props[k]);
			else add('content', k, n.props[k]);
		});
		Object.keys(n.style).forEach(function (k) { if (k === 't' || k === 'm') return; if (!eq(n.style[k], base.style[k])) add('style', k, n.style[k]); });
		Object.keys(base.style).forEach(function (k) { if (n.style[k] === undefined && k !== 't' && k !== 'm') add('style', k, ''); });
		['t', 'm'].forEach(function (d) { var o = n.style[d] || {}; Object.keys(o).forEach(function (k) { add('style', k, o[k], d); }); });
		var fx = n.props.fx || {};
		Object.keys(fx).forEach(function (k) { add('motion', k, fx[k]); });
		return ops;
	}
	function stepsFor(n, ref, name) {
		var ops = diffOps(n, ref), out = [];
		var main = ops.filter(function (o) { return o.where !== 'motion' && !o.dev; });
		var phone = ops.filter(function (o) { return o.dev; });
		var mot = ops.filter(function (o) { return o.where === 'motion'; });
		var cont = main.filter(function (o) { return o.where === 'content' || o.where === 'adv'; }), sty = main.filter(function (o) { return !(o.where === 'content' || o.where === 'adv'); });
		if (cont.length) out.push({ title: 'Fill in the ' + name, say: 'Select it, then change these in <b>Edit \u203a Content</b>.', ops: cont });
		if (sty.length) out.push({ title: 'Style the ' + name, say: 'In <b>Edit \u203a Style</b>, set:', ops: sty });
		if (phone.length) {
			var dv = phone[0].dev;
			out.push({ title: 'Fix the ' + name + ' for ' + (dv === 'm' ? 'phones' : 'tablets'), say: 'Switch to ' + (dv === 'm' ? 'phone' : 'tablet') + ' view at the top. Changes made there only affect smaller screens.', ops: [{ t: 'device', d: dv }].concat(phone, [{ t: 'device', d: 'd' }]) });
		}
		if (mot.length) out.push({ title: 'Animate the ' + name, say: 'Open <b>Edit \u203a Motion</b> and set:', ops: mot });
		return out;
	}
	function recipe(target, base) {
		base = base || 0;
		var steps = [];
		target.children.forEach(function (S, si) {
			var s = base + si, rows = S.children || [];
			var k0 = rows[0] ? rows[0].children.length : 1;
			steps.push({ title: 'Add a section with ' + k0 + (k0 > 1 ? ' columns' : ' column'), say: 'Tap an empty spot to clear the selection. In <b>Add \u203a Structure</b>, tap <b>Row, ' + k0 + ' column' + (k0 > 1 ? 's' : '') + '</b>. A new section appears at the bottom.', ops: [{ t: 'add', key: 'row:' + k0, into: null, ref: { s: s, r: 0 }, cols: k0, check: 'row' }] });
			stepsFor(S, { s: s }, 'section').forEach(function (x) { steps.push(x); });
			rows.forEach(function (Rw, ri) {
				if (ri > 0) steps.push({ title: 'Add a second row', say: 'Select the section, then in <b>Add \u203a Structure</b> tap <b>Row, ' + Rw.children.length + ' column' + (Rw.children.length > 1 ? 's' : '') + '</b>.', ops: [{ t: 'add', key: 'row:' + Rw.children.length, into: { s: s }, ref: { s: s, r: ri }, cols: Rw.children.length, check: 'row' }] });
				stepsFor(Rw, { s: s, r: ri }, ri ? 'row ' + (ri + 1) : 'row').forEach(function (x) { steps.push(x); });
				Rw.children.forEach(function (Cl, ci) {
					var cname = 'column ' + (ci + 1) + (rows.length > 1 ? ' (row ' + (ri + 1) + ')' : '');
					stepsFor(Cl, { s: s, r: ri, c: ci }, cname).forEach(function (x) { steps.push(x); });
					var count = {};
					Cl.children.forEach(function (Wd) {
						var nth = count[Wd.type] = (count[Wd.type] || 0); count[Wd.type]++;
						var ref = { s: s, r: ri, c: ci, w: { type: Wd.type, nth: nth } }, lab = typeLabel(Wd.type);
						var pp = Wd.props || {}, snip = String(pp.title || pp.text || pp.brand || pp.before || pp.ftitle || pp.name || (pp.html || '').replace(/<[^>]+>/g, ' ') || '').replace(/\s+/g, ' ').trim();
						if (snip.length > 22) snip = snip.slice(0, 22).replace(/\s+\S*$/, '') + '\u2026';
						var nm = lab.toLowerCase() + (snip ? ' \u201c' + snip + '\u201d' : '');
						steps.push({ title: 'Add a ' + lab + ' to ' + cname, say: 'Select ' + cname + ', open <b>Add</b>, search for <b>' + esc(lab) + '</b> and tap it.' + (snip ? ' It will become \u201c' + esc(snip) + '\u201d.' : ''), ops: [{ t: 'add', key: Wd.type, into: { s: s, r: ri, c: ci }, ref: ref, check: 'type', type: Wd.type }] });
						stepsFor(Wd, ref, nm).forEach(function (x) { steps.push(x); });
					});
				});
			});
		});
		return steps;
	}
	function opCaption(op) {
		if (op.caption) return op.caption;
		if (op.t === 'add') return op.key.indexOf('row:') === 0 ? 'Add <b>Row, ' + op.cols + ' column' + (op.cols > 1 ? 's' : '') + '</b>' : op.key.indexOf('tpl:') === 0 ? 'Add the ready-made <b>' + esc(tplName(op.key.slice(4))) + '</b> section' : 'Add a <b>' + esc(typeLabel(op.key)) + '</b>';
		if (op.t === 'device') return op.d === 'd' ? 'Switch back to <b>desktop</b> view' : 'Switch to <b>' + (op.d === 'm' ? 'phone' : 'tablet') + '</b> view';
		if (op.t === 'select') return 'Select <b>' + esc(op.name || 'it') + '</b>';
		if (op.t === 'save') return 'Tap <b>Save</b>';
		if (op.t === 'set') {
			var info = fieldInfo(op.type, op.k, op.where === 'style' && op.store === 'props' ? 'bgx' : op.where) || { l: op.k, t: 'text' };
			var where = TAB[op.where] + (info.group ? ' \u203a ' + info.group : '');
			var val = op.free ? (info.t === 'image' ? 'choose a picture' : info.t === 'color' ? 'any colour you like, e.g. ' + display(info, op.v) : info.t === 'select' ? 'any option, e.g. ' + display(info, op.v) : info.t === 'items' ? 'edit the list (' + (op.v || []).length + ' items)' : 'your own words, e.g. ' + display(info, op.v)) : display(info, op.v);
			return '<span class="ag-where">' + where + '</span> ' + esc(info.l) + ': ' + val;
		}
		return op.say || '';
	}
	var tplName = function (k) { var t = C.TEMPLATES.filter(function (x) { return x[0] === k; })[0]; return t ? t[1] : k; };

	/* ================================================================ checks */
	function opOk(op, ed, guide) {
		var tree = ed.tree;
		if (op.t === 'note') return true;
		if (op.t === 'ack') return guide.acked === guide.i;
		if (op.t === 'device') return ed.device === op.d;
		if (op.t === 'save') return !!guide.saved && !ed.dirty;
		if (op.t === 'select') { var sn = resolve(tree, op.ref); return !!sn && ed.sel === sn.id; }
		if (op.t === 'check') { try { return !!op.fn(tree, ed); } catch (e) { return false; } }
		if (op.t === 'add') {
			var n = resolve(tree, op.ref); if (!n) return false;
			if (op.check === 'row') return n.type === 'row' && n.children.length === op.cols;
			if (op.check === 'type') return n.type === op.type;
			return true;
		}
		if (op.t === 'set') {
			var node = resolve(tree, op.ref); if (!node) return false;
			var info = fieldInfo(node.type, op.k, op.where === 'style' && op.store === 'props' ? 'bgx' : op.where) || { t: 'text' };
			return same(info, getVal(node, op), op.v, op);
		}
		return true;
	}

	/* ================================================================ guide player */
	function Guide(ed, steps, mode, opts) {
		this.ed = ed; this.steps = steps; this.mode = mode; this.o = opts || {};
		this.voice = mode === 'watch' && !!(X() && X().store.get('lab-voice'));
		this.i = this.o.start || 0; this.speed = mode === 'watch' ? (+(X() && X().store.get('lab-speed')) || 1) : 1; this.paused = false; this.snaps = []; this.token = { cancel: false };
		this.saved = false;
		if (g.PLEAcademy) g.PLEAcademy.current = this;
		var self = this, os = ed.save;
		ed.save = function () { var r = os.apply(ed, arguments); self.saved = true; return r; };
		this.build();
		if (mode === 'watch') this.run();
		else if (mode === 'do') this.poll();
		else { this.drawPractice(); if (this.o.brief) { var me = this; this.pollT = setInterval(function () { var sig = JSON.stringify(me.steps[0].ops.map(function (op) { return opOk(op, me.ed, me); })); if (sig !== me._bs) { me._bs = sig; me.drawPractice(me.lastRes); } }, 1500); } }
	}
	var GP = Guide.prototype;
	var plain = function (x) { var d = document.createElement('div'); d.innerHTML = String(x || ''); return (d.textContent || '').replace(/\s+/g, ' ').trim(); };
	GP.untilQuiet = async function (max) { var t0 = Date.now(); while (g.speechSynthesis && g.speechSynthesis.speaking && Date.now() - t0 < max) await this.waitReal(150); };
	GP.speak = function (text) {
		if (!this.voice || !g.speechSynthesis || !text) return;
		try {
			g.speechSynthesis.cancel();
			var u = new SpeechSynthesisUtterance(plain(text));
			u.lang = 'en-GB'; u.rate = Math.min(1.6, 0.95 + (this.speed - 1) * 0.2);
			var vs = g.speechSynthesis.getVoices().filter(function (v) { return /en-GB/i.test(v.lang); });
			if (vs.length) u.voice = vs[0];
			g.speechSynthesis.speak(u);
		} catch (e) { }
	};
	GP.build = function () {
		var self = this;
		this.el = h('div', { class: 'ag ag-' + this.mode, role: 'dialog', 'aria-label': 'Guide' });
		this.cur = h('div', { class: 'ag-cur', 'aria-hidden': 'true' }, '<svg viewBox="0 0 24 24" width="26" height="26"><path d="M4 2l16 9.5-7 1.6 4.2 7.6-3.1 1.7-4.2-7.7L4 19z" fill="#0f172a" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/></svg>');
		this.ring = h('div', { class: 'ag-ring', 'aria-hidden': 'true' });
		this.tip = h('div', { class: 'ag-tip', 'aria-hidden': 'true' });
		document.body.appendChild(this.ring); document.body.appendChild(this.cur); document.body.appendChild(this.tip); document.body.appendChild(this.el);
		this.cur.style.left = (innerWidth / 2) + 'px'; this.cur.style.top = (innerHeight / 2) + 'px';
		this.alive = setInterval(function () { if (!document.body.contains(self.ed.el)) return self.destroy(); self.el.classList.toggle('ag-compact', self.ed.isPhone() && self.ed.el.classList.contains('sheet')); }, 300);
		this.el.addEventListener('click', function (e) { e.stopPropagation(); });
	};
	GP.destroy = function () {
		this.token.cancel = true; this.dead = true;
		clearInterval(this.alive); clearInterval(this.pollT);
		[this.el, this.cur, this.ring, this.tip].forEach(function (x) { if (x && x.parentNode) x.remove(); });
		if (this.keyFn) document.removeEventListener('keydown', this.keyFn, true);
		try { if (this.voice && g.speechSynthesis) g.speechSynthesis.cancel(); } catch (x) { }
		if (this.downFn) document.removeEventListener('pointerdown', this.downFn, true);
	};
	GP.head = function (badge, extra) {
		var self = this, o = this.o, n = this.steps.length;
		var top = h('div', { class: 'ag-top' });
		top.appendChild(h('span', { class: 'ag-badge b-' + this.mode }, badge));
		top.appendChild(h('b', { class: 'ag-title', text: o.title || '' }));
		top.appendChild(h('button', { type: 'button', class: 'ag-ic', title: 'Make smaller', 'aria-label': 'Make smaller', onclick: function () { self.el.classList.toggle('min'); } }, '&#8211;'));
		top.appendChild(h('button', { type: 'button', class: 'ag-ic', title: 'Close the guide', 'aria-label': 'Close the guide', onclick: function () { self.exit(); } }, '&times;'));
		this.el.appendChild(top);
		if (n && this.mode !== 'practice') this.el.appendChild(h('div', { class: 'ag-prog' }, '<i style="width:' + Math.round(100 * Math.min(this.i, n) / n) + '%"></i>'));
		if (extra) this.el.appendChild(extra);
	};
	GP.exit = function () {
		this.destroy();
		if (this.o.onExit) this.o.onExit(this);
	};

	/* ---------- timing */
	GP.waitReal = function (ms) { var sp = this.speed; this.speed = 1; var p = this.wait(ms); this.speed = sp; return p; };
	GP.wait = function (ms) {
		var self = this, tok = this.token, left = ms / this.speed;
		return new Promise(function (res, rej) {
			var tick = function () {
				if (tok.cancel || self.dead) return rej('cancel');
				if (self.paused) return setTimeout(tick, 120);
				if (left <= 0) return res();
				var d = Math.min(60, left); left -= d; setTimeout(tick, d);
			};
			tick();
		});
	};
	GP.point = function (el, noRing) {
		if (!el) return this.wait(150);
		var r = this.rectOf(el); if (!r) return this.wait(150);
		var x = Math.min(innerWidth - 20, Math.max(8, r.left + Math.min(r.width / 2, 120))), y = Math.min(innerHeight - 20, Math.max(8, r.top + Math.min(r.height / 2, 40)));
		this.cur.style.left = x + 'px'; this.cur.style.top = y + 'px'; this.cur.classList.add('on');
		if (this.tip.innerHTML) {
			var tw = this.tip.offsetWidth || 220, th = this.tip.offsetHeight || 30;
			var tx = Math.min(innerWidth - tw - 8, Math.max(8, x + 22)), ty = y + 30 + th > innerHeight - 8 ? y - th - 14 : y + 30;
			this.tip.style.left = tx + 'px'; this.tip.style.top = ty + 'px'; this.tip.classList.add('on');
		}
		if (!noRing) this.showRing(r);
		return this.wait(650);
	};
	GP.rectOf = function (el) {
		var r = el.getBoundingClientRect();
		if (el.ownerDocument !== document) {
			var fr = this.ed.frame.getBoundingClientRect();
			r = { left: r.left + fr.left, top: r.top + fr.top, width: r.width, height: r.height };
			if (r.top < fr.top) { var d = fr.top - r.top; r.top = fr.top; r.height = Math.max(20, r.height - d); }
			r.height = Math.min(r.height, fr.bottom - r.top);
		}
		return r;
	};
	GP.showRing = function (r) {
		var s = this.ring.style; s.left = (r.left - 4) + 'px'; s.top = (r.top - 4) + 'px'; s.width = (r.width + 8) + 'px'; s.height = (Math.max(r.height, 16) + 8) + 'px';
		this.ring.classList.add('on');
	};
	GP.tap = function () { var c = this.cur; c.classList.remove('tap'); void c.offsetWidth; c.classList.add('tap'); return this.wait(260); };

	/* ---------- editor helpers */
	GP.canvasEl = function (node) { return node && this.ed.doc && this.ed.doc.querySelector('[data-ple="' + node.id + '"]'); };
	GP.uiTab = function (t) { return this.ed.isPhone() ? this.ed.el.querySelector('.pe-dock [data-t="' + t + '"]') : this.ed.side.querySelector('.pe-tab[data-t="' + t + '"]'); };
	GP.findField = function (label) {
		var list = this.ed.panel.querySelectorAll('.pe-f');
		for (var i = 0; i < list.length; i++) {
			var lb = list[i].querySelector('label'); if (!lb) continue;
			var txt = (lb.childNodes[0] && lb.childNodes[0].textContent || '').trim();
			if (txt === label) return list[i];
		}
		return null;
	};
	GP.doSelect = async function (node) {
		var ed = this.ed; if (!node) return;
		if (ed.sel === node.id) return;
		var el = this.canvasEl(node);
		if (el) { el.scrollIntoView({ block: 'center', behavior: 'smooth' }); await this.waitReal(450); await this.point(el); await this.tap(); }
		ed.select(node.id);
		await this.wait(250);
	};
	GP.doTab = async function (t) {
		var ed = this.ed;
		if (ed.tab === t && (!ed.isPhone() || ed.el.classList.contains('sheet'))) return;
		var b = this.uiTab(t); if (b) { await this.point(b); await this.tap(); }
		ed.showTab(t, ed.isPhone());
		await this.waitReal(ed.isPhone() ? 340 : 120);
	};
	GP.doDevice = async function (d) {
		var ed = this.ed; if (ed.device === d) return;
		var b = ed.el.querySelector('.pe-dev[data-d="' + d + '"]');
		if (b) { await this.point(b); await this.tap(); }
		ed.setDevice(d); this.devSeen = this.devSeen || {}; this.devSeen[d] = 1;
		await this.wait(500);
	};
	GP.doEtab = async function (et) {
		var ed = this.ed;
		if (ed.etab === et) return;
		var name = TAB[et], btns = ed.panel.querySelectorAll('.pe-etabs button'), b = null;
		for (var i = 0; i < btns.length; i++) if (btns[i].textContent.trim() === name) b = btns[i];
		if (b) { await this.point(b); await this.tap(); b.click(); } else { ed.etab = et; ed.renderPanel(); }
		await this.wait(200);
	};
	GP.type = async function (input, text, set) {
		text = String(text);
		var plain = text.length > 70 || /</.test(text);
		if (plain) { input.value = text; input.dispatchEvent(new Event('input', { bubbles: true })); await this.wait(300); return; }
		for (var i = 1; i <= text.length; i++) {
			input.value = text.slice(0, i);
			if (i % 2 === 0 || i === text.length) { input.dispatchEvent(new Event('input', { bubbles: true })); await this.wait(28); }
		}
		if (set) set();
	};
	GP.doSet = async function (op) {
		var ed = this.ed, node = resolve(ed.tree, op.ref); if (!node) return;
		await this.doSelect(node);
		await this.doTab('edit');
		var wantDev = op.dev || 'd';
		if (ed.device !== wantDev) await this.doDevice(wantDev);
		await this.doEtab(op.where === 'adv' ? 'adv' : op.where);
		var info = fieldInfo(node.type, op.k, op.store === 'props' && op.where === 'style' ? 'bgx' : op.where) || { l: op.k, t: 'text' };
		var f = this.findField(info.l);
		if (f) {
			var dt = f.closest('details'); if (dt && !dt.open) { var sm = dt.querySelector('summary'); await this.point(sm); await this.tap(); dt.open = true; await this.wait(200); }
			f.scrollIntoView({ block: 'center' }); await this.waitReal(60);
			await this.point(f);
			var v = op.v, ctl;
			switch (info.t) {
				case 'select': ctl = f.querySelector('select'); if (ctl) { await this.tap(); ctl.value = String(v); ctl.dispatchEvent(new Event('change', { bubbles: true })); } break;
				case 'toggle': ctl = f.querySelector('input[type=checkbox]'); if (ctl) { await this.tap(); ctl.checked = !!v; ctl.dispatchEvent(new Event('change', { bubbles: true })); } break;
				case 'color': ctl = f.querySelector('.pe-color input[type=text]'); if (ctl) { await this.tap(); await this.type(ctl, v); } break;
				case 'num': ctl = f.querySelector('input[type=number]'); if (ctl) { await this.tap(); ctl.value = v; ctl.dispatchEvent(new Event('input', { bubbles: true })); } break;
				case 'icon': ctl = f.querySelector('.pe-icons button[title="' + v + '"]'); if (ctl) { ctl.scrollIntoView({ block: 'nearest' }); await this.waitReal(40); await this.point(ctl); await this.tap(); ctl.click(); } break;
				case 'image': ctl = f.querySelector('input[type=url]'); if (ctl) { await this.tap(); ctl.value = v; ctl.dispatchEvent(new Event('input', { bubbles: true })); } break;
				case 'text': case 'url': case 'textarea': case 'html': ctl = f.querySelector('textarea,input'); if (ctl) { await this.tap(); await this.type(ctl, v); } break;
				default: ctl = null;
			}
			if (!ctl) { setVal(node, op, C.clone(v)); ed.change(); ed.renderPanel(); }
			f = this.findField(info.l) || f; f.classList.add('ag-flash');
			await this.wait(info.t === 'items' ? 900 : 420);
		} else {
			setVal(node, op, C.clone(op.v)); ed.change(); ed.renderPanel();
			await this.wait(400);
		}
	};
	GP.doAdd = async function (op) {
		var ed = this.ed;
		if (op.into) { var into = resolve(ed.tree, op.into); if (into) await this.doSelect(into); }
		else if (ed.sel) { ed.select(null); await this.wait(200); }
		await this.doTab('add');
		var key = op.key, tile = null;
		var tiles = function () { return ed.panel.querySelectorAll('.pe-tile'); };
		if (key.indexOf('row:') === 0) {
			if (ed._addQ) { ed._addQ = ''; ed.renderPanel(); }
			var lbl = 'Row, ' + op.cols + ' column' + (op.cols > 1 ? 's' : '');
			[].forEach.call(tiles(), function (t) { if (t.textContent.trim() === lbl) tile = t; });
		} else {
			var name = key.indexOf('tpl:') === 0 ? tplName(key.slice(4)) : typeLabel(key);
			var q = ed.panel.querySelector('.pe-search');
			if (q) { await this.point(q); await this.tap(); q.value = ''; for (var i = 1; i <= name.length; i++) { q.value = name.slice(0, i); q.dispatchEvent(new Event('input')); q = ed.panel.querySelector('.pe-search'); await this.wait(45); } await this.wait(250); }
			var isTpl = key.indexOf('tpl:') === 0;
			[].forEach.call(tiles(), function (t) { if (!tile && t.textContent.trim() === name && t.classList.contains('pe-tpl') === isTpl) tile = t; });
		}
		if (tile) { tile.scrollIntoView({ block: 'center' }); await this.waitReal(60); await this.point(tile); await this.tap(); tile.click(); }
		else { ed.add(key); }
		ed._addQ = '';
		await this.wait(700);
	};
	GP.doOp = async function (op) {
		if (op.t === 'set') return this.doSet(op);
		if (op.t === 'add') return this.doAdd(op);
		if (op.t === 'device') return this.doDevice(op.d);
		if (op.t === 'select') { var n = resolve(this.ed.tree, op.ref); await this.doSelect(n); return; }
		if (op.t === 'save') { var sb = this.ed.saveB; if (sb) { await this.point(sb); await this.tap(); this.ed.save(); } return this.wait(600); }
		if (op.t === 'tab') return this.doTab(op.tab);
		if (op.t === 'run') { if (op.show) await this.point(op.show(this.ed)); await this.tap(); op.fn(this.ed); return this.wait(600); }
		if (op.t === 'check' && op.show) return op.show(this);
		return this.wait(op.ms || 900);
	};

	/* ---------- watch mode */
	GP.drawWatch = function () {
		var self = this, st = this.steps[this.i], n = this.steps.length;
		this.el.innerHTML = '';
		this.head('Demo');
		if (!st) return;
		this.el.appendChild(h('button', { type: 'button', class: 'ag-step ag-stepb', title: 'See all steps', onclick: function () { self.paused = true; self.drawWatch(); self.stepList(); } }, 'Step ' + (this.i + 1) + ' of ' + n + ' &#9662;'));
		this.el.appendChild(h('h4', { class: 'ag-h' }, esc(st.title)));
		if (st.say) this.el.appendChild(h('p', { class: 'ag-say' }, st.say));
		var ul = h('ul', { class: 'ag-ops' });
		(st.ops || []).forEach(function (op, k) { if (op.t !== 'note') ul.appendChild(h('li', { class: k < (self.opI || 0) ? 'ok' : (k === (self.opI || 0) ? 'now' : '') }, '<i></i><span>' + opCaption(op) + '</span>')); });
		if (ul.children.length) this.el.appendChild(ul);
		var curOp = (st.ops || [])[self.opI || 0], why = curOp ? whyFor(curOp) : '';
		if (why) this.el.appendChild(h('p', { class: 'ag-why' }, '<b>Why?</b> ' + esc(why)));
		var ctl = h('div', { class: 'ag-ctl' });
		ctl.appendChild(h('button', { type: 'button', title: 'Previous step', 'aria-label': 'Previous step', disabled: this.i === 0 ? true : null, onclick: function () { self.jump(self.i - 1); } }, '&#9664;&#9664;'));
		ctl.appendChild(h('button', { type: 'button', class: 'ag-play', title: (this.paused ? 'Play' : 'Pause') + ' (Space)', 'aria-label': this.paused ? 'Play' : 'Pause', onclick: function () { self.paused = !self.paused; self.drawWatch(); } }, this.paused ? '&#9654; Play' : '&#10074;&#10074; Pause'));
		ctl.appendChild(h('button', { type: 'button', title: 'Next step', 'aria-label': 'Next step', disabled: this.i >= n - 1 ? true : null, onclick: function () { self.jump(self.i + 1, true); } }, '&#9654;&#9654;'));
		if (g.speechSynthesis) ctl.appendChild(h('button', { type: 'button', class: 'ag-spd' + (self.voice ? ' on' : ''), title: self.voice ? 'Narration on' : 'Read the steps aloud', 'aria-pressed': String(self.voice), onclick: function () { self.voice = !self.voice; X().store.set('lab-voice', self.voice ? 1 : 0); if (!self.voice) g.speechSynthesis.cancel(); else self.speak(self.steps[self.i] && self.steps[self.i].title); self.drawWatch(); } }, self.voice ? '&#128266;' : '&#128264;'));
		ctl.appendChild(h('button', { type: 'button', class: 'ag-spd', title: 'Speed', onclick: function () { self.speed = self.speed >= 4 ? 1 : self.speed * 2; X().store.set('lab-speed', self.speed); self.drawWatch(); } }, self.speed + '&times;'));
		this.el.appendChild(ctl);
	};
	GP.jump = function (to, finishCurrent) {
		var self = this;
		if (to < 0 || to >= this.steps.length) return;
		this.token.cancel = true;
		var go = function () {
			if (finishCurrent) {
				/* Apply the remaining steps instantly so the page matches. */
				for (var j = self.i; j < to; j++) self.applyStep(self.steps[j]);
			} else if (self.snaps[to]) { self.ed.tree = JSON.parse(self.snaps[to]); self.ed.sel = null; self.ed.commit(); self.ed.renderAll(); }
			self.i = to; self.token = { cancel: false }; self.paused = true; self.opI = 0;
			self.drawWatch(); self.loop();
		};
		setTimeout(go, 80);
	};
	GP.stepList = function () {
		var self = this, box = h('div', { class: 'ag-list' });
		this.steps.forEach(function (st, i) {
			box.appendChild(h('button', { type: 'button', class: 'ag-li ag-lib' + (i === self.i ? ' on' : '') + (i < self.i ? ' past' : ''), onclick: function () { var m = document.querySelector('.st-modal'); if (m) m.remove(); if (i > self.i) self.jump(i, true); else if (i < self.i) self.jump(i); } }, '<b>' + (i + 1) + '. ' + esc(st.title) + '</b>'));
		});
		X().modal('Jump to a step', box);
	};
	GP.applyStep = function (st) {
		var ed = this.ed;
		this.snaps[this.steps.indexOf(st)] = this.snaps[this.steps.indexOf(st)] || JSON.stringify(ed.tree);
		(st.ops || []).forEach(function (op) {
			if (op.t === 'set') { var n = resolve(ed.tree, op.ref); if (n) setVal(n, op, C.clone(op.v)); }
			else if (op.t === 'add') { if (op.into) { var into = resolve(ed.tree, op.into); ed.sel = into ? into.id : null; } else ed.sel = null; ed.add(op.key); }
			else if (op.t === 'device') ed.setDevice(op.d);
			else if (op.t === 'run') op.fn(ed);
		});
		ed.commit(); ed.renderAll();
	};
	GP.run = function () {
		var self = this;
		this.keyFn = function (e) {
			if (self.dead) return document.removeEventListener('keydown', self.keyFn, true);
			var t = e.target; if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
			if (e.key === ' ' || e.key === 'k') { e.preventDefault(); e.stopPropagation(); self.paused = !self.paused; self.drawWatch(); }
			else if (e.key === 'ArrowRight' && e.shiftKey) { e.preventDefault(); self.jump(self.i + 1, true); }
			else if (e.key === 'ArrowLeft' && e.shiftKey) { e.preventDefault(); self.jump(self.i - 1); }
		};
		document.addEventListener('keydown', this.keyFn, true);
		/* If the learner starts working on the page, pause so the demo does not fight them. */
		this.downFn = function (e) {
			if (self.dead) return document.removeEventListener('pointerdown', self.downFn, true);
			if (!e.isTrusted || self.paused || (e.target.closest && e.target.closest('.ag'))) return;
			self.paused = true; self.drawWatch(); self.ed.toast('Demo paused. Press Play on the card to continue.');
		};
		document.addEventListener('pointerdown', this.downFn, true);
		try { this.ed.doc.addEventListener('pointerdown', this.downFn, true); } catch (x) { }
		this.drawWatch(); this.loop();
	};
	GP.loop = async function () {
		var self = this, tok = this.token;
		try {
			while (this.i < this.steps.length) {
				var st = this.steps[this.i];
				this.snaps[this.i] = JSON.stringify(this.ed.tree);
				this.opI = 0; this.drawWatch();
				this.speak(st.title + '. ' + (st.say || ''));
				await this.wait(this.i === 0 ? 1200 : 700);
				if (this.voice) await this.untilQuiet(9000);
				for (var k = 0; k < (st.ops || []).length; k++) {
					this.opI = k; this.drawWatch();
					this.tip.innerHTML = st.ops[k].t === 'note' ? '' : opCaption(st.ops[k]);
					await this.doOp(st.ops[k]);
					if (whyFor(st.ops[k])) { if (this.voice) this.speak(whyFor(st.ops[k])); await this.wait(this.voice ? 2200 : 700); }
				}
				this.tip.classList.remove('on');
				this.opI = (st.ops || []).length; this.drawWatch();
				await this.wait(800);
				if (tok.cancel) return;
				this.i++;
			}
			this.finish();
		} catch (e) { if (e !== 'cancel') { if (g.console) console.warn('PLE guide', e); self.i++; if (!tok.cancel) self.loop(); } }
	};
	GP.finish = function () {
		var self = this;
		this.ring.classList.remove('on'); this.cur.classList.remove('on'); this.tip.classList.remove('on');
		try { var ed = this.ed; if (ed.isPhone()) ed.closeSheet(); ed.select(null); if (ed.device !== 'd') ed.setDevice('d'); if (ed.win) ed.win.scrollTo({ top: 0, behavior: 'smooth' }); } catch (e) { }
		this.el.innerHTML = ''; this.el.classList.add('ag-fin');
		this.head(this.mode === 'watch' ? 'Demo' : 'Guided');
		this.el.appendChild(h('div', { class: 'ag-done' }, '<span>' + icon('check', 26) + '</span><h4>' + esc(this.mode === 'watch' ? 'That is how it is done.' : 'You built it!') + '</h4><p>' + esc(this.mode === 'watch' ? 'Now try it yourself. Doing it once makes it stick.' : 'Every step is done. Look at it on the phone view too.') + '</p>'));
		var row = h('div', { class: 'ag-ctl col' });
		(this.o.endButtons || []).forEach(function (b) { row.appendChild(h('button', { type: 'button', class: b.cls || '', onclick: function () { b.on(self); } }, b.text)); });
		this.el.appendChild(row);
		if (this.o.onDone) this.o.onDone(this);
	};

	/* ---------- guided (do) mode */
	GP.poll = function () {
		var self = this;
		this.drawDo();
		this.pollT = setInterval(function () { if (!self.showing) self.drawDo(true); }, 600);
	};
	GP.drawDo = function (quiet) {
		var self = this, st = this.steps[this.i], n = this.steps.length;
		if (!st) { clearInterval(this.pollT); if (!this.finished) { this.finished = true; this.finish(); } return; }
		this.devSeen = this.devSeen || {}; this.devSeen[this.ed.device] = 1;
		var oks = [];
		(st.ops || []).forEach(function (op, k) {
			if (op.t === 'device') {
				var last = k === st.ops.length - 1;
				oks[k] = last && k > 0 ? (self.ed.device === op.d && oks.slice(0, k).every(Boolean)) : (!!self.devSeen[op.d] || self.ed.device === op.d);
			} else oks[k] = opOk(op, self.ed, self);
		});
		var all = oks.every(Boolean);
		var sig = this.i + ':' + oks.join();
		if (quiet && sig === this._sig) return;
		this._sig = sig;
		this.el.innerHTML = '';
		this.head('Guided');
		this.el.appendChild(h('p', { class: 'ag-step' }, 'Step ' + (this.i + 1) + ' of ' + n));
		this.el.appendChild(h('h4', { class: 'ag-h' }, esc(st.title)));
		if (st.say) this.el.appendChild(h('p', { class: 'ag-say' }, st.say));
		var ul = h('ul', { class: 'ag-ops' });
		var first = -1;
		(st.ops || []).forEach(function (op, k) { if (op.t === 'note') return; if (!oks[k] && first < 0) first = k; ul.appendChild(h('li', { class: oks[k] ? 'ok' : (k === first ? 'now' : '') }, '<i></i><span>' + opCaption(op) + '</span>')); });
		if (ul.children.length) this.el.appendChild(ul);
		var whyD = first >= 0 ? whyFor(st.ops[first]) : '';
		var tip = first >= 0 ? this.mistake(st.ops[first]) : '';
		if (tip) this.el.appendChild(h('p', { class: 'ag-oops' }, icon('bolt', 14) + ' ' + tip));
		if (whyD) this.el.appendChild(h('p', { class: 'ag-why' }, '<b>Why?</b> ' + esc(whyD)));
		var ctl = h('div', { class: 'ag-ctl' });
		ctl.appendChild(h('button', { type: 'button', title: 'Previous step', disabled: this.i === 0 ? true : null, onclick: function () { self.i--; self._sig = ''; self.devSeen = {}; self.drawDo(); } }, '&#9664;'));
		if ((st.ops || []).some(function (o2) { return o2.t === 'ack'; })) ctl.appendChild(h('button', { type: 'button', class: 'ag-show', onclick: function () { self.acked = self.i; self._sig = ''; self.drawDo(); } }, 'Got it'));
		else ctl.appendChild(h('button', { type: 'button', class: 'ag-show', onclick: function () { self.showMe(st, oks); } }, icon('bolt', 14) + ' Show me'));
		ctl.appendChild(h('button', { type: 'button', title: 'Skip this step', onclick: function () { self.next(); } }, 'Skip'));
		this.el.appendChild(ctl);
		/* Point gently at what to change. */
		this.ring.classList.remove('on');
		var op = first >= 0 ? st.ops[first] : null;
		if (op && op.ref && (op.t === 'set' || op.t === 'select')) {
			var node = resolve(this.ed.tree, op.ref), el = this.canvasEl(node);
			if (el && !this.ed.isPhone()) {
				var r = this.rectOf(el); if (r.height > 4) this.showRing(r);
				var cr0 = this.el.getBoundingClientRect(), hit0 = !(r.left + r.width < cr0.left || r.left > cr0.right || r.top + r.height < cr0.top || r.top > cr0.bottom);
				if (hit0 && r.width < innerWidth * 0.45) this.el.classList.toggle('ag-left');
			}
			/* On phones, move the page so the item is not hidden behind this card. */
			var fk = this.i + ':' + first;
			if (el && this.ed.isPhone() && fk !== this._focusKey && !this.ed.el.classList.contains('sheet')) {
				this._focusKey = fk;
				var self2 = this;
				setTimeout(function () {
					try {
						var fr = self2.ed.frame.getBoundingClientRect(), er = el.getBoundingClientRect();
						/* Put the card at the bottom when the item is near the top, and the other way round. */
						var top = fr.top + er.top + Math.min(er.height, 120) / 2;
						if (top < 0 || top > innerHeight) { self2.ed.win.scrollBy({ top: er.top - 140, behavior: 'auto' }); er = el.getBoundingClientRect(); top = fr.top + er.top + Math.min(er.height, 120) / 2; }
						self2.el.classList.toggle('ag-bottom', top < innerHeight * 0.5);
					} catch (x) { }
				}, 60);
			}
		}
		if (all && !this.advancing) {
			this.advancing = true;
			this.el.classList.add('ag-pass');
			var advI = this.i;
			setTimeout(function () { self.advancing = false; self.el.classList.remove('ag-pass'); if (self.i === advI && !self.dead) self.next(); }, 1100);
		}
	};
	var CAT = function (op) {
		if (op.t === 'add') return 'Structure';
		if (op.where === 'motion') return 'Motion';
		if (op.dev) return 'Phone view';
		if (op.where === 'content') return 'Content';
		if (/^(color|bg|ic|ac|grad1|grad2|g1|g2|gradText|overlay|bgImg|lc|c1|c2|ff|fb|hk|sb|cdbg|particles)$/.test(op.k)) return 'Colour and pictures';
		if (/^(pt|pb|px|mt|mb|gap|fgap|minH|w|mw|valign|align|width)$/.test(op.k)) return 'Spacing and layout';
		if (/^(size|weight|font|lh)$/.test(op.k)) return 'Text style';
		return 'Details';
	};
	/* Spot common slips and explain how to fix them. */
	GP.mistake = function (op) {
		var tree = this.ed.tree;
		if (op.t === 'add' && op.check === 'type' && op.ref && op.ref.c !== undefined) {
			var sec = sectionOf(tree, op.ref.s); if (!sec) return '';
			var col = resolve(tree, { s: op.ref.s, r: op.ref.r, c: op.ref.c });
			var inCol = 0, inSec = 0;
			if (col) C.walk(col, function (x) { if (x.type === op.type) inCol++; });
			C.walk(sec, function (x) { if (x.type === op.type) inSec++; });
			if (inSec > inCol && inCol <= (op.ref.w.nth || 0)) return 'The ' + esc(typeLabel(op.type)) + ' went into another column. Press <b>Undo</b>, select <b>column ' + (op.ref.c + 1) + '</b> first, then add it again. Or drag it in <b>Layers</b>.';
			if (!col) return 'That column is missing. Check the row has enough columns.';
		}
		if (op.t === 'add' && op.check === 'row' && typeof op.ref.s === 'number' && tree.children.length > op.ref.s + 1 && !resolve(tree, op.ref)) return 'There are more sections than expected. Delete the extra one (select it and press the \u2715) so the new section is number ' + (op.ref.s + 1) + '.';
		if (op.t === 'set' && op.dev && this.ed.device === 'd') return 'This setting is only for ' + (op.dev === 'm' ? 'phones' : 'tablets') + '. Switch to the ' + (op.dev === 'm' ? 'phone' : 'tablet') + ' view at the top first.';
		if (op.t === 'set' && !op.dev && this.ed.device !== 'd' && op.where === 'style') { var info = fieldInfo(op.type, op.k, op.store === 'props' ? 'bgx' : 'style'); if (info && info.r) return 'You are in ' + (this.ed.device === 'm' ? 'phone' : 'tablet') + ' view, so this would only change smaller screens. Switch back to desktop view first.'; }
		return '';
	};
	GP.next = function () { this.i++; this._sig = ''; this.devSeen = {}; if (this.o.onStep) this.o.onStep(this.i); this.drawDo(); };
	GP.showMe = async function (st, oks) {
		var self = this;
		this.showing = true; this.speed = 1.4; this.token = { cancel: false };
		this.el.classList.add('ag-busy');
		try { for (var k = 0; k < st.ops.length; k++) if (st.ops[k].t === 'device' || !opOk(st.ops[k], this.ed, this)) { this.tip.innerHTML = opCaption(st.ops[k]); await this.doOp(st.ops[k]); } } catch (e) { }
		this.cur.classList.remove('on'); this.tip.classList.remove('on'); this.tip.innerHTML = '';
		this.el.classList.remove('ag-busy');
		this.showing = false; this._sig = '';
		setTimeout(function () { self.drawDo(); }, 200);
	};

	/* ---------- practice mode */
	GP.score = function () {
		var self = this, total = 0, ok = 0, miss = [];
		var cats = {};
		this.steps.forEach(function (st) { (st.ops || []).forEach(function (op) { if (op.t === 'device' || op.t === 'note' || op.t === 'select') return; total++; var c = cats[CAT(op)] = cats[CAT(op)] || { n: 0, ok: 0 }; c.n++; if (opOk(op, self.ed, self)) { ok++; c.ok++; } else miss.push({ st: st, op: op }); }); });
		return { pct: total ? Math.round(100 * ok / total) : 100, miss: miss, total: total, ok: ok, cats: cats };
	};
	GP.drawPractice = function (res) {
		var self = this, o = this.o; this.lastRes = res;
		this.el.innerHTML = '';
		this.head('Practice');
		this.el.appendChild(h('p', { class: 'ag-say' }, o.brief || 'Build this design on your own. Look at the target, then check your work as often as you like.'));
		if (o.target) {
			var th = h('button', { type: 'button', class: 'ag-target', title: 'See the target bigger', onclick: function () { o.target(true); } });
			th.appendChild(o.target(false));
			this.el.appendChild(th);
		}
		if (o.brief) {
			var bl = h('ul', { class: 'ag-ops' });
			this.steps.forEach(function (st) { st.ops.forEach(function (op) { var ok = opOk(op, self.ed, self); bl.appendChild(h('li', { class: ok ? 'ok' : '' }, '<i></i><span>' + opCaption(op) + '</span>')); }); });
			this.el.appendChild(bl);
		}
		if (res) {
			var good = res.pct >= 80;
			this.el.appendChild(h('div', { class: 'ag-score ' + (good ? 'good' : res.pct >= 50 ? 'mid' : 'low') }, '<b>' + res.pct + '%</b> ' + (good ? (o.brief ? 'This meets the brief. Publish it for your portfolio.' : 'Great match! You can save it to your parts.') : 'Getting there. ' + res.ok + ' of ' + res.total + (o.brief ? ' requirements met.' : ' details match.'))));
			if (!o.brief && res.cats) {
				var cg = h('div', { class: 'ag-cats' });
				Object.keys(res.cats).forEach(function (k) { var c = res.cats[k]; cg.appendChild(h('span', { class: c.ok === c.n ? 'ok' : (c.ok ? 'part' : 'no') }, esc(k) + ' <b>' + c.ok + '/' + c.n + '</b>')); });
				this.el.appendChild(cg);
			}
			if (!good && res.miss.length && !o.brief) {
				this.hints = (this.hints || 0);
				var ul = h('ul', { class: 'ag-ops' });
				res.miss.slice(0, this.hints).forEach(function (m) { ul.appendChild(h('li', { class: 'now' }, '<i></i><span>' + esc(m.st.title) + ': ' + opCaption(m.op) + '</span>')); });
				if (ul.children.length) this.el.appendChild(ul);
				if (this.hints < Math.min(5, res.miss.length)) this.el.appendChild(h('button', { type: 'button', class: 'ag-link', onclick: function () { self.hints++; self.drawPractice(res); } }, this.hints ? 'Another hint' : 'Give me a hint'));
			}
		}
		var ctl = h('div', { class: 'ag-ctl col' });
		ctl.appendChild(h('button', { type: 'button', class: 'pri', onclick: function () { var r = self.score(); self.drawPractice(r); if (r.pct >= 80 && o.onPass) o.onPass(r, self); } }, icon('check', 14) + ' Check my work'));
		if (o.compare) ctl.appendChild(h('button', { type: 'button', onclick: function () { o.compare(self.ed.tree); } }, 'Compare side by side'));
		if (!o.brief) ctl.appendChild(h('button', { type: 'button', onclick: function () { self.allSteps(); } }, 'Show all the steps'));
		(o.extra || []).forEach(function (b) { ctl.appendChild(h('button', { type: 'button', onclick: function () { b.on(self); } }, b.text)); });
		this.el.appendChild(ctl);
	};
	GP.allSteps = function () {
		var box = h('div', { class: 'ag-list' });
		this.steps.forEach(function (st, i) {
			var d = h('div', { class: 'ag-li' }, '<b>' + (i + 1) + '. ' + esc(st.title) + '</b>');
			var ul = h('ul'); (st.ops || []).forEach(function (op) { if (op.t !== 'note') ul.appendChild(h('li', null, opCaption(op))); });
			d.appendChild(ul); box.appendChild(d);
		});
		X().modal('All the steps', box);
	};

	/* ================================================================ Lab data */
	function topics() { return LAB().topics; }
	function topicById(id) { return topics().filter(function (t) { return t.id === id; })[0]; }
	function designById(id) { var out = null; topics().forEach(function (t) { t.designs.forEach(function (d) { if (d.id === id) out = { t: t, d: d }; }); }); return out; }
	function pageOf(sections) { var p = C.emptyPage(); p.children = sections; return p; }
	function progress() { return X().S.lab || (X().S.lab = {}); }
	function mark(id, data) {
		var p = progress(), e = p[id] = p[id] || {};
		Object.keys(data).forEach(function (k) { if (k === 'score') e.score = Math.max(e.score || 0, data.score); else e[k] = 1; });
		return X().api('lab', { method: 'POST', body: Object.assign({ id: id }, data) }).then(function (r) { if (r) X().S.lab = r; }).catch(function () { });
	}
	function stateOf(d) { var e = progress()[d.id] || {}; return e; }

	/* Live preview of a design, scaled into a card. Thumbnails show the finished look without
	   waiting for animations; the big preview plays them and can be scrolled. */
	var STATIC_CSS = '<style>html,body{overflow:hidden}body{pointer-events:none}[data-fx-in],[data-fx-in] .fx-ch{opacity:1!important;transform:none!important;filter:none!important;clip-path:none!important}</style>';
	function preview(tree, w, lazy, live) {
		var wrap = h('div', { class: 'al-pv' + (live ? ' live' : '') });
		var fr = h('iframe', { title: 'Preview', tabindex: live ? null : '-1', loading: 'lazy', scrolling: live ? 'yes' : 'no' });
		wrap.appendChild(fr);
		var vw = w || 1280, vh = live ? Math.round(vw * (vw < 600 ? 1.9 : 0.62)) : 760;
		var load = function () {
			if (fr._done) return; fr._done = 1;
			C.RUNTIME = C.RUNTIME || X().S.runtime;
			var doc = C.fullDoc(tree, 'Preview');
			fr.srcdoc = live ? doc : doc.replace('</head>', STATIC_CSS + '</head>');
		};
		var fit = function () {
			var cw = wrap.clientWidth || 300;
			if (!live && !w && cw < 520) { vw = 860; }
			var sc = Math.min(1, cw / vw);
			fr.style.width = vw + 'px'; fr.style.height = vh + 'px'; fr.style.transform = 'scale(' + sc + ')';
			wrap.style.height = Math.round(vh * sc) + 'px';
			if (!live) fr.onload = function () { var m = function () { try { var dh = Math.ceil(fr.contentDocument.body.getBoundingClientRect().height) || vh; wrap.style.height = Math.round(Math.min(Math.max(dh, 160), vh) * sc) + 'px'; } catch (e) { } }; m(); setTimeout(m, 700); setTimeout(m, 2000); };
		};
		setTimeout(function () { fit(); if (!lazy || !('IntersectionObserver' in g)) load(); else { var io = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { io.disconnect(); load(); } }, { rootMargin: '300px' }); io.observe(wrap); } }, 0);
		return wrap;
	}
	function compareModal(target, mine, title) {
		var box = h('div', { class: 'al-cmp' });
		var col = function (lbl, tr) { var c = h('div', { class: 'al-cmpc' }); c.appendChild(h('b', null, lbl)); var f = h('div', { class: 'al-bigf' }); c.appendChild(f); f.appendChild(preview(tr, 1280, false)); return c; };
		box.appendChild(col('Target', target)); box.appendChild(col('Yours', mine));
		X().modal('Compare: ' + title, box);
	}
	function bigPreview(tree, title) {
		var box = h('div', { class: 'al-big' });
		var seg = h('div', { class: 'st-seg' });
		var holder = h('div', { class: 'al-bigf' });
		var show = function (w) { holder.innerHTML = ''; holder.style.maxWidth = w === 390 ? '390px' : '100%'; holder.appendChild(preview(tree, w, false, true)); seg.querySelectorAll('button').forEach(function (b) { b.classList.toggle('on', +b.dataset.w === w); }); };
		[[1280, 'Desktop'], [390, 'Phone']].forEach(function (x) { seg.appendChild(h('button', { type: 'button', 'data-w': x[0], onclick: function () { show(x[0]); } }, x[1])); });
		box.appendChild(seg); box.appendChild(holder);
		X().modal(title, box);
		show(innerWidth < 700 ? 390 : 1280);
	}

	/* ================================================================ views */
	function chip(text, cls) { return '<span class="al-chip ' + (cls || '') + '">' + text + '</span>'; }
	function viewLab() {
		var x = X(), p = x.page('Design Lab', 'Learn to design sections like a professional: watch how each one is built, build it with a guide, then practise on your own.');
		var all = 0, doneN = 0;
		topics().forEach(function (t) { t.designs.forEach(function (d) { all++; var e = stateOf(d); if (e.done || e.guided) doneN++; }); });
		var start = h('div', { class: 'al-start' });
		var startCards = [
			['start', 'Get started', 'A 10-step guided tour of the builder on a real website. Start here.', 'bolt', progress()['start'] && progress()['start'].guided ? 'Done' : 'Start here'],
			['makeover/watch', 'Makeover: watch', 'See a plain template turned into a unique, modern website step by step.', 'video', progress()['makeover'] && progress()['makeover'].watched ? 'Watched' : '3 min demo'],
			['makeover/do', 'Makeover: do it yourself', 'Follow the same makeover on your own copy, with checks at every step.', 'rows', progress()['makeover'] && progress()['makeover'].guided ? 'Done' : 'Guided']
		];
		startCards.forEach(function (c, i) {
			start.appendChild(h('a', { class: 'al-sc' + (i === 0 ? ' first' : ''), href: '#/' + c[0] }, '<span class="al-sci">' + icon(c[3], 22) + '</span><b>' + c[1] + '</b><small>' + c[2] + '</small>' + chip(c[4], /Done|Watched/.test(c[4]) ? 'ok' : '')));
		});
		var last = x.store.get('lab-last');
		if (last && last.href && Date.now() - last.at < 30 * 864e5) {
			var verb = { watch: 'Watch again', guided: 'Continue building', practise: 'Continue practising', brief: 'Continue the brief' }[last.mode] || 'Continue';
			p.appendChild(h('a', { class: 'al-promo', href: last.href }, '<span class="al-sci">' + icon('arrow', 22) + '</span><div><b>Pick up where you left off</b><small>' + esc(last.name) + '</small></div><span class="st-btn sm pri">' + verb + '</span>'));
		}
		var how = h('ol', { class: 'al-how' });
		[['video', 'Watch', 'See every click in the real editor, with the reasons.'], ['rows', 'Build with a guide', 'Do it yourself; each step ticks when it is right.'], ['bolt', 'Practise alone', 'Rebuild new designs from a target and check your score.'], ['star', 'Save and reuse', 'Keep your best parts and drop them into any website.']].forEach(function (x, i) {
			how.appendChild(h('li', null, '<span class="al-hown">' + (i + 1) + '</span><span class="al-howi">' + icon(x[0], 18) + '</span><b>' + x[1] + '</b><small>' + x[2] + '</small>'));
		});
		p.appendChild(h('h2', { class: 'st-h2' }, 'Start here'));
		p.appendChild(start);
		p.appendChild(h('h2', { class: 'st-h2' }, 'How each design lesson works'));
		p.appendChild(how);
		var hd = h('div', { class: 'al-hrow' }, '<h2 class="st-h2">Design lessons</h2><span class="al-count">' + doneN + ' of ' + all + ' designs built</span>');
		p.appendChild(hd);
		var sq = h('input', { type: 'search', class: 'al-search', placeholder: 'Find a design, e.g. pricing, gradient, form\u2026', 'aria-label': 'Find a design' });
		var sres = h('div', { class: 'al-sres' });
		sq.addEventListener('input', function () {
			var q = sq.value.trim().toLowerCase(); sres.innerHTML = '';
			if (q.length < 2) return;
			var n = 0;
			topics().forEach(function (t) { t.designs.forEach(function (d) {
				if (n > 12 || (t.name + ' ' + d.name + ' ' + d.note).toLowerCase().indexOf(q) < 0) return; n++;
				var e = stateOf(d);
				sres.appendChild(h('a', { class: 'al-sr', href: '#/lab/' + t.id + '/' + d.id + '/' + (d.demo ? 'watch' : 'practise') }, '<span class="al-sri" style="--tc:' + t.color + '">' + icon(t.icon, 16) + '</span><span><b>' + esc(d.name) + '</b><small>' + esc(t.name) + ' &middot; ' + (d.demo ? 'Demo' : 'Practice') + (e.done || e.guided ? ' &middot; built' : '') + '</small></span>'));
			}); });
			if (!n) sres.innerHTML = '<p class="al-sub">No designs match. Try another word.</p>';
		});
		p.appendChild(sq); p.appendChild(sres);
		var grid = h('div', { class: 'al-topics' });
		topics().forEach(function (t) {
			var n = t.designs.length, dn = t.designs.filter(function (d) { var e = stateOf(d); return e.done || e.guided; }).length;
			var a = h('a', { class: 'al-tc', href: '#/lab/' + t.id, style: '--tc:' + t.color });
			a.innerHTML = '<span class="al-tci">' + icon(t.icon, 22) + '</span><b>' + esc(t.name) + '</b><small>' + esc(t.blurb) + '</small><span class="al-tcm"><span>' + n + ' designs &middot; ' + (function (k) { return k + (k === 1 ? ' demo' : ' demos'); })(t.designs.filter(function (d) { return d.demo; }).length) + '</span><i style="--p:' + Math.round(100 * dn / n) + '%"></i></span>';
			grid.appendChild(a);
		});
		p.appendChild(grid);
		p.appendChild(h('div', { class: 'al-hrow' }, '<h2 class="st-h2">Client briefs</h2><span class="al-count">Put it all together: a full website for a real-style client</span>'));
		var bg = h('div', { class: 'al-briefs' });
		BRIEFS.forEach(function (b) {
			var e = progress()['brief-' + b.id] || {};
			bg.appendChild(h('a', { class: 'al-brief', href: '#/brief/' + b.id }, '<small>' + esc(b.who) + '</small><b>' + esc(b.name) + '</b><p>' + esc(b.brief) + '</p>' + (e.done ? chip(icon('check', 12) + ' Done ' + (e.score || '') + '%', 'ok') : chip('Brief', 'pr'))));
		});
		p.appendChild(bg);
		p.appendChild(h('h2', { class: 'st-h2' }, 'My saved parts'));
		var parts = h('div'); p.appendChild(parts);
		x.shell('lab', p);
		loadParts().then(function (l) {
			if (!l.length) { parts.appendChild(h('div', { class: 'st-empty' }, 'When you finish a design you can save it here, then drop it into any of your websites from <b>Add \u203a My parts</b>.')); return; }
			var gr = h('div', { class: 'al-parts' });
			l.forEach(function (pr) { gr.appendChild(partCard(pr)); });
			parts.appendChild(gr);
		}).catch(function () { parts.appendChild(h('div', { class: 'st-empty' }, 'Your parts will load when you are online.')); });
	}
	function partCard(pr) {
		var c = h('article', { class: 'al-part' });
		c.appendChild(h('div', { class: 'al-pvh' }, '<div class="st-skel"></div>'));
		c.appendChild(h('div', { class: 'al-pb' }, '<b>' + esc(pr.title.replace(/^Part: /, '')) + '</b>'));
		var acts = h('div', { class: 'al-pa' });
		acts.appendChild(h('a', { class: 'st-btn sm', href: '#/project/' + pr.id }, 'Edit'));
		acts.appendChild(h('button', { type: 'button', class: 'st-btn sm ghost', onclick: function () { if (!confirm('Remove "' + pr.title + '" from your parts?')) return; X().api('projects/' + pr.id, { method: 'DELETE' }).then(function () { partsCache = null; c.remove(); }); } }, 'Remove'));
		c.querySelector('.al-pb').appendChild(acts);
		X().api('projects/' + pr.id).then(function (full) { var ph = c.querySelector('.al-pvh'); ph.innerHTML = ''; ph.appendChild(preview(full.tree, 0, true)); pr.tree = full.tree; }).catch(function () { });
		return c;
	}
	var partsCache = null;
	function loadParts(force) {
		if (partsCache && !force) return Promise.resolve(partsCache);
		return X().loadProjects(true).then(function (l) { partsCache = l.filter(function (p) { return /^part-/.test(p.lesson || ''); }); return partsCache; });
	}

	function viewTopic(id) {
		var t = topicById(id); if (!t) return X().go404();
		var x = X(), p = x.page(t.name, t.blurb);
		var back = h('a', { class: 'al-back', href: '#/lab' }, '&larr; Design Lab'); p.insertBefore(back, p.firstChild);
		var bn = t.designs.filter(function (d) { var e = stateOf(d); return e.done || e.guided; }).length;
		p.appendChild(h('div', { class: 'al-tprog', style: '--tc:' + t.color }, '<span>' + bn + ' of ' + t.designs.length + ' built</span><i><b style="width:' + Math.round(100 * bn / t.designs.length) + '%"></b></i>'));
		var tips = h('div', { class: 'al-tips', style: '--tc:' + t.color }, '<h3>' + icon('star', 16) + ' What makes a good one</h3><ol>' + t.tips.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ol>');
		var trow = h('div', { class: 'al-tipsrow' }); trow.appendChild(tips);
		if (t.avoid) trow.appendChild(h('div', { class: 'al-tips al-avoid' }, '<h3>' + icon('shield', 16) + ' Avoid these</h3><ul>' + t.avoid.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>'));
		p.appendChild(trow);
		var demos = t.designs.filter(function (d) { return d.demo; }), prac = t.designs.filter(function (d) { return !d.demo; });
		var sec = function (title, sub, list) {
			if (!list.length) return;
			p.appendChild(h('h2', { class: 'st-h2' }, title));
			p.appendChild(h('p', { class: 'al-sub' }, sub));
			var g2 = h('div', { class: 'al-designs' });
			list.forEach(function (d) { g2.appendChild(designCard(t, d)); });
			p.appendChild(g2);
		};
		sec('Watch, then build with a guide', 'Watch the demo to see every click. Then build it yourself with step-by-step checks.', demos);
		sec('Practise on your own', 'No demo for these. Use what you learned, check your work, and ask for hints if you get stuck.', prac);
		if (t.avoid && t.tips) p.appendChild(topicQuiz(t));
		var all = topics(), ti = all.indexOf(t), nt = all[ti + 1], pt = all[ti - 1];
		var nav = h('nav', { class: 'al-tnav' });
		nav.appendChild(pt ? h('a', { class: 'st-btn ghost', href: '#/lab/' + pt.id }, '&larr; ' + esc(pt.name)) : h('a', { class: 'st-btn ghost', href: '#/lab' }, '&larr; Design Lab'));
		nav.appendChild(nt ? h('a', { class: 'st-btn', href: '#/lab/' + nt.id }, esc(nt.name) + ' &rarr;') : h('a', { class: 'st-btn', href: '#/lab' }, 'Client briefs &rarr;'));
		p.appendChild(nav);
		x.shell('lab', p);
	}
	/* A quick check built from the topic's good practice and mistakes. */
	function topicQuiz(t) {
		var e = progress()['quiz-' + t.id] || {};
		var qs = [
			{ q: 'Which of these is good practice for ' + t.name.toLowerCase() + '?', o: [t.tips[0], t.avoid[0], t.avoid[1]], a: 0 },
			{ q: 'Which of these should you avoid?', o: [t.tips[1], t.avoid[2], t.tips[2]], a: 1 }
		];
		var box = h('section', { class: 'al-quiz' });
		box.appendChild(h('h2', { class: 'st-h2' }, 'Quick check' + (e.done ? ' ' + chip(icon('check', 12) + ' Passed', 'ok') : '')));
		var ans = {};
		qs.forEach(function (q, qi) {
			var order = qi % 2 ? [2, 0, 1] : [1, 2, 0];
			var fs = h('fieldset', { class: 'st-q' });
			fs.appendChild(h('legend', null, (qi + 1) + '. ' + esc(q.q)));
			order.forEach(function (oi) {
				var id = 'aq' + t.id + qi + oi;
				var lab = h('label', { for: id }, '<input type="radio" name="aq' + t.id + qi + '" id="' + id + '"><span>' + esc(q.o[oi]) + '</span>');
				lab.querySelector('input').onchange = function () { ans[qi] = oi; fs.querySelectorAll('label').forEach(function (x) { x.classList.remove('right', 'wrong'); }); };
				fs.appendChild(lab);
			});
			box.appendChild(fs);
		});
		var res = h('p', { class: 'st-qres', role: 'status' });
		box.appendChild(res);
		box.appendChild(h('button', { type: 'button', class: 'st-btn pri', onclick: function () {
			var right = 0;
			qs.forEach(function (q, qi) {
				var fs = box.querySelectorAll('.st-q')[qi];
				fs.querySelectorAll('label').forEach(function (lb) { var inp = lb.querySelector('input'); lb.classList.remove('right', 'wrong'); if (inp.checked) lb.classList.add(ans[qi] === q.a ? 'right' : 'wrong'); });
				if (ans[qi] === q.a) right++;
			});
			res.className = 'st-qres ' + (right === qs.length ? 'ok' : 'no');
			res.textContent = right === qs.length ? 'Both right. You know what makes a good one.' : right + ' of ' + qs.length + ' right. Read the two boxes at the top again.';
			if (right === qs.length) mark('quiz-' + t.id, { done: 1, score: 100 });
		} }, 'Check my answers'));
		return box;
	}
	function designCard(t, d) {
		var e = stateOf(d), tree = pageOf(d.build());
		var c = h('article', { class: 'al-dc' });
		var pv = h('button', { type: 'button', class: 'al-dpv', title: 'See it bigger', onclick: function () { bigPreview(pageOf(d.build()), d.name); } });
		pv.appendChild(preview(tree, 0, true));
		c.appendChild(pv);
		var b = h('div', { class: 'al-db' });
		b.appendChild(h('div', { class: 'al-dt' }, '<b>' + esc(d.name) + '</b>' + (d.demo ? chip('Demo') : chip('Practice', 'pr')) + (e.done || e.guided ? chip(icon('check', 12) + ' Built' + (e.score ? ' ' + e.score + '%' : ''), 'ok') : (e.watched ? chip('Watched', 'w') : ''))));
		var gstep = X().store.get('lab-step:lab-' + d.id + '-g') || 0;
		if (gstep && !(e.done || e.guided)) b.querySelector('.al-dt').insertAdjacentHTML('beforeend', chip('In progress', 'w'));
		b.appendChild(h('p', null, esc(d.note)));
		var acts = h('div', { class: 'al-da' });
		if (d.demo) {
			acts.appendChild(h('a', { class: 'st-btn sm', href: '#/lab/' + t.id + '/' + d.id + '/watch' }, icon('video', 14) + ' Watch'));
			acts.appendChild(h('a', { class: 'st-btn sm pri', href: '#/lab/' + t.id + '/' + d.id + '/guided' }, icon('rows', 14) + ' Build with guide'));
		} else {
			acts.appendChild(h('a', { class: 'st-btn sm pri', href: '#/lab/' + t.id + '/' + d.id + '/practise' }, icon('bolt', 14) + ' Practise'));
			if (e.done) acts.appendChild(h('a', { class: 'st-btn sm', href: '#/lab/' + t.id + '/' + d.id + '/watch', title: 'Unlocked because you built it' }, icon('video', 14) + ' Watch how we built it'));
		}
		b.appendChild(acts);
		c.appendChild(b);
		return c;
	}

	/* Practice and guided work is kept as a project so learners can come back to it. */
	function labProject(key, title, tree) {
		var x = X();
		return x.loadProjects().then(function (list) {
			var mine = list.filter(function (pr) { return pr.lesson === key; })[0];
			if (mine) return x.api('projects/' + mine.id);
			return x.api('projects', { method: 'POST', body: { title: title, mode: 'builder', lesson: key, tree: tree } }).then(function (pr) { x.state.projects = null; return pr; });
		});
	}
	function savePart(t, d, tree) {
		var x = X(), sections = (tree.children || []).map(function (s) { return C.reId(C.clone(s)); });
		if (!sections.length) return Promise.resolve();
		return x.api('projects', { method: 'POST', body: { title: 'Part: ' + d.name, mode: 'builder', lesson: 'part-' + t.id, tree: pageOf(sections) } }).then(function () { x.state.projects = null; partsCache = null; x.toast('Saved to My parts. Find it in Add \u203a My parts in any website.', 'ok'); });
	}
	function boot(text) { var a = document.getElementById('st-app'); a.innerHTML = '<div class="st-boot"><div class="st-spin"></div>' + (text ? '<p style="margin-top:14px;color:#64748b">' + esc(text) + '</p>' : '') + '</div>'; }

	function runDesign(tid, did, mode) {
		var hit = designById(did); if (!hit || hit.t.id !== tid) return X().go404();
		var t = hit.t, d = hit.d, x = X(), back = '#/lab/' + t.id;
		x.store.set('lab-last', { href: location.hash, name: d.name, mode: mode, at: Date.now() });
		var target = pageOf(d.build());
		var steps = recipe(target, 0);
		var idx = t.designs.indexOf(d), nextD = t.designs[idx + 1];
		var nextHref = nextD ? '#/lab/' + t.id + '/' + nextD.id + '/' + (nextD.demo ? 'watch' : 'practise') : back;
		var targetFn = function (big) { if (big) return bigPreview(pageOf(d.build()), 'Target: ' + d.name); return preview(pageOf(d.build()), 0); };
		if (mode === 'watch') {
			var pr = { id: 'demo', title: 'Demo: ' + d.name, tree: C.emptyPage(), updated: Date.now() / 1000 + 60 };
			x.openEditor(pr, { noSave: true, noShare: true, exitTo: back, exitLabel: 'Lab', sideNote: '<b>Demo:</b> watch how <b>' + esc(d.name) + '</b> is built. Pause any time.', onReady: function (ed) {
				ed.showTab('add');
				new Guide(ed, steps, 'watch', { title: d.name, onExit: function () { location.hash = back; }, onDone: function () { mark(d.id, { watched: 1 }); }, endButtons: [
					{ text: 'Build it with the guide', cls: 'pri', on: function () { location.hash = '#/lab/' + t.id + '/' + d.id + '/guided'; } },
					{ text: 'Preview it full screen', on: function (gd) { gd.ed.preview(); } },
					{ text: 'See the HTML and CSS it made', on: function (gd) { if (gd.ed.codeP.hidden) gd.ed.toggleCode(); gd.el.classList.add('min'); } },
					{ text: 'Watch again', on: function (gd) { gd.destroy(); x.route(); } },
					{ text: 'Back to ' + t.name, on: function () { location.hash = back; } }] });
			} });
			return;
		}
		boot('Preparing your workspace\u2026');
		var key = 'lab-' + d.id + (mode === 'guided' ? '-g' : '-p');
		labProject(key, (mode === 'guided' ? 'Guided: ' : 'Practice: ') + d.name, C.emptyPage()).then(function (pr) {
			if (!pr.tree || !pr.tree.children) pr.tree = C.emptyPage();
			x.openEditor(pr, { noShare: true, exitTo: back, exitLabel: 'Lab', sideNote: (mode === 'guided' ? '<b>Guided build:</b> follow the card. It ticks each item when you get it right.' : '<b>Practice:</b> rebuild the target design. Tap <b>Check my work</b> any time.'), onReady: function (ed) {
				var saved = x.store.get('lab-step:' + key) || 0;
				if (mode === 'guided' && saved && saved < steps.length && pr.tree.children.length) { /* resume */ } else saved = 0;
				var reset = { text: 'Start again on an empty page', on: function (gd) { if (!confirm('Clear this page and start again?')) return; gd.destroy(); ed.tree = C.emptyPage(); ed.commit(); ed.renderAll(); ed.save(); x.store.set('lab-step:' + key, 0); setTimeout(function () { x.route(); }, 600); } };
				var g2 = new Guide(ed, steps, mode === 'guided' ? 'do' : 'practice', {
					title: d.name, start: saved, target: targetFn, extra: [reset], compare: function (mine) { compareModal(pageOf(d.build()), C.clone(mine), d.name); },
					onStep: function (i) { x.store.set('lab-step:' + key, i); },
					onExit: function () { ed.save(); location.hash = back; },
					onDone: function () { ed.save(); x.store.set('lab-step:' + key, 0); mark(d.id, { guided: 1, score: 100 }); },
					onPass: function (r, gd) { ed.save(); mark(d.id, { done: 1, score: r.pct }); passModal(t, d, ed, nextHref); },
					endButtons: [
						{ text: 'Save to My parts', cls: 'pri', on: function () { ed.save(); savePart(t, d, ed.tree); } },
						{ text: 'See the HTML and CSS you made', on: function (gd) { if (ed.codeP.hidden) ed.toggleCode(); gd.el.classList.add('min'); } },
						{ text: nextD ? 'Next design' : 'Back to ' + t.name, on: function () { location.hash = nextHref; } }, reset]
				});
				if (mode === 'guided' && !pr.tree.children.length) ed.showTab('add');
				g2.reset = reset;
			} });
		}).catch(function (e) { x.toast(e.message, 'err'); location.hash = back; });
	}
	function passModal(t, d, ed, nextHref) {
		var x = X();
		x.modal('Well done!', '<div class="st-cele"><div class="st-confetti" aria-hidden="true">' + new Array(18).join('<i></i>') + '</div>' + icon('award', 48) + '<p>Your <b>' + esc(d.name) + '</b> matches the design. Save it to reuse it in your websites.</p></div>', [
			{ text: 'Save to My parts', cls: 'pri', on: function (c) { c(); savePart(t, d, ed.tree); } },
			{ text: 'Watch how we built it', on: function (c) { c(); location.hash = '#/lab/' + t.id + '/' + d.id + '/watch'; } },
			{ text: 'Next design', on: function (c) { c(); location.hash = nextHref; } }]);
	}

	/* ================================================================ get started */
	function startSteps(tree) {
		var nav = has('navbar')(tree), hero = has('heading', function (n) { return n.props.tag === 'h1'; })(tree);
		var hRef = { fn: function (t) { var s = hero && C.find(t, hero.id); if (!s) return null; var out = null; C.walk(s.node, function (n) { if (n.type === 'heading' && n.props.tag === 'h1') { out = n; return false; } }); return out; } };
		var bRef = { fn: function (t) { var s = hero && C.find(t, hero.id); if (!s) return null; var out = null; C.walk(s.node, function (n) { if (n.type === 'button') { out = n; return false; } }); return out; } };
		var fr = C.starterPage(), fh = has('heading', function (n) { return n.props.tag === 'h1'; })(fr), h0 = null, b0 = null;
		C.walk(fh, function (n) { if (!h0 && n.type === 'heading') h0 = n; if (!b0 && n.type === 'button') b0 = n; });
		var tsRef = { fn: has('testimonials') };
		void nav;
		return [
			{ title: 'Welcome to the builder', say: 'This is a real website you can change. On the left (or in the bottom menu on a phone) are <b>Add</b>, <b>Layers</b>, <b>Edit</b> and <b>Page</b>. The page itself is in the middle. Tap <b>Skip</b> when you are ready.', ops: [{ t: 'ack', caption: 'Look around the screen, then tap <b>Got it</b>' }] },
			{ title: 'Select the big heading', say: 'Tap the big heading in the first picture section. A blue outline shows what is selected.', ops: [{ t: 'select', ref: hRef, name: 'the hero heading' }] },
			{ title: 'Write your own headline', say: 'Open <b>Edit \u203a Content</b> and type your own headline. On a computer you can also double-click the text on the page.', ops: [{ t: 'set', ref: hRef, type: 'heading', where: 'content', k: 'text', v: 'My own headline', free: 1, from: h0 && h0.props.text }] },
			{ title: 'Make it bigger', say: 'Open <b>Edit \u203a Style</b> and set the font size.', ops: [{ t: 'set', ref: hRef, type: 'heading', where: 'style', k: 'size', v: 60 }] },
			{ title: 'Change the button colour', say: 'Select the button under the heading. In <b>Style</b>, pick any new <b>Button colour</b>.', ops: [{ t: 'set', ref: bRef, type: 'button', where: 'style', k: 'bg', v: '#16a34a', free: 1, from: b0 && b0.style.bg }] },
			{ title: 'Add a ready-made section', say: 'Open <b>Add</b>, search for <b>Testimonials</b> and tap it. It appears after the section you selected.', ops: [{ t: 'add', key: 'tpl:testimonials', into: { id: hero && hero.id }, ref: tsRef, check: 'type', type: 'section' }] },
			{ title: 'Move it with Layers', say: 'Open <b>Layers</b>. Each line is a part of the page. Use the arrows on the Testimonials section to move it so it sits right after the hero.', ops: [{ t: 'check', caption: 'Testimonials sit right after the hero', fn: function (t) { var a = t.children.indexOf(has('testimonials')(t)), b = hero ? t.children.map(function (s) { return s.id; }).indexOf(hero.id) : -1; return a > -1 && b > -1 && a === b + 1; }, show: async function (gd) { await gd.doTab('layers'); var ed = gd.ed, s = has('testimonials')(ed.tree), hi = ed.tree.children.map(function (x) { return x.id; }).indexOf(hero.id); while (s && ed.tree.children.indexOf(s) > hi + 1) { var row = ed.panel.querySelector('.pe-node[data-id="' + s.id + '"]'); if (row) { await gd.point(row); await gd.tap(); } ed.move(s.id, -1); await gd.wait(400); } while (s && ed.tree.children.indexOf(s) < hi + 1) { ed.move(s.id, 1); await gd.wait(300); } } }] },
			{ title: 'Add some movement', say: 'Select the hero heading again. In <b>Edit \u203a Motion</b>, choose an entrance <b>Animation</b>. Press <b>Play entrance</b> to see it.', ops: [{ t: 'set', ref: hRef, type: 'heading', where: 'motion', k: 'in', v: 'fade-up', free: 1 }] },
			{ title: 'Check it on a phone', say: 'Most visitors use phones. Tap the phone icon at the top, then make the heading smaller just for phones.', ops: [{ t: 'device', d: 'm' }, { t: 'set', ref: hRef, type: 'heading', where: 'style', k: 'size', v: 36, dev: 'm' }] },
			{ title: 'Save your work', say: 'Switch back to the desktop view and tap <b>Save</b>. Then tap <b>Share</b> when you want a public link.', ops: [{ t: 'device', d: 'd' }, { t: 'save' }] }
		];
	}
	function runStart() {
		var x = X();
		x.store.set('lab-last', { href: '#/start', name: 'Get started tour', mode: 'guided', at: Date.now() });
		boot('Opening your first website\u2026');
		labProject('lab-start', 'My first website', C.starterPage()).then(function (pr) {
			x.openEditor(pr, { exitTo: '#/lab', exitLabel: 'Lab', sideNote: '<b>Get started:</b> follow the guide card. It moves on by itself when you finish each step.', onReady: function (ed) {
				var steps = startSteps(ed.tree), saved = x.store.get('lab-step:start') || 0;
				var gd = new Guide(ed, steps, 'do', { title: 'Get started', start: saved < steps.length ? saved : 0,
					onStep: function (i) { x.store.set('lab-step:start', i); },
					onExit: function () { location.hash = '#/lab'; },
					onDone: function () { x.store.set('lab-step:start', 0); mark('start', { guided: 1 }); },
					endButtons: [{ text: 'Watch the makeover demo', cls: 'pri', on: function () { location.hash = '#/makeover/watch'; } }, { text: 'Back to the Lab', on: function () { location.hash = '#/lab'; } }] });
				void gd;
			} });
		}).catch(function (e) { x.toast(e.message, 'err'); location.hash = '#/lab'; });
	}

	/* ================================================================ makeover */
	function makeoverSteps(tree) {
		var pic = LAB().pic;
		var fresh = C.starterPage();
		var find = function (fn) { var s = fn(tree); return s ? { id: s.id, f: fn } : null; };
		var navS = find(has('navbar')), heroS = find(has('heading', function (n) { return n.props.tag === 'h1'; }));
		var featS = find(function (t) { return t.children.filter(function (s) { var ib = 0, map = 0; C.walk(s, function (n) { if (n.type === 'iconbox') ib++; if (n.type === 'map') map++; }); return ib >= 3 && !map; })[0]; });
		var aboutS = find(has('list')), cardS = find(has('card')), ctaS = find(function (t) { return t.children.filter(function (s) { return s.props.width === 'narrow'; })[0]; }), footS = find(function (t) { return t.children.filter(function (s) { return s.props.tag === 'footer'; })[0]; });
		var nthIn = function (sn, type, nth) { if (!sn) return null; var k = 0, out = null; C.walk(sn, function (n) { if (n.type === type) { if (k === (nth || 0)) { out = n; return false; } k++; } }); return out; };
		var inS = function (sref, type, nth) { return { fn: function (t) { var s = C.find(t, sref.id); return s ? nthIn(s.node, type, nth) : null; }, fresh: function () { return nthIn(sref.f(fresh), type, nth); } }; };
		var sec = function (r) { return { id: r.id, fresh: function () { return r.f(fresh); } }; };
		var set = function (ref, type, where, k, v, extra) { return Object.assign({ t: 'set', ref: ref, type: type, where: where, k: k, v: v }, extra || {}); };
		/* Free-choice steps compare with the original template, so finished steps stay ticked. */
		var orig = function (ref, where, k) { var n = ref.fresh ? ref.fresh() : null; return n ? (where === 'content' ? n.props[k] : n.style[k]) : undefined; };
		var navW = inS(navS, 'navbar'), heroH = inS(heroS, 'heading'), heroT = inS(heroS, 'text'), heroB = inS(heroS, 'button');
		var steps = [
			{ title: 'The plan', say: 'We start from the plain business template. In about 15 steps it becomes a modern training-school website: new brand, photo hero, animation, trust strip, numbers, steps, reviews and a strong finish.', ops: [{ t: 'note', ms: 2600 }] },
			{ title: 'Brand the menu', say: 'Select the menu bar. Give it your name and a dark, confident look.', ops: [
				set(navW, 'navbar', 'content', 'brand', 'Kilele Academy', { free: 1, from: orig(navW, 'content', 'brand') }),
				set(navW, 'navbar', 'content', 'links', 'Home|#\nCourses|#services\nAbout|#about\nContact|#contact', { free: 1, from: orig(navW, 'content', 'links') }),
				set(navW, 'navbar', 'content', 'cta', 'Apply now', { free: 1, from: orig(navW, 'content', 'cta') }),
				set(navW, 'navbar', 'style', 'bg', '#0b1730'), set(navW, 'navbar', 'style', 'color', '#ffffff'), set(navW, 'navbar', 'style', 'ac', '#f59e0b')] },
			{ title: 'Keep the menu in reach', say: 'In <b>Motion</b>, make the menu stick to the top while people scroll.', ops: [set(navW, 'navbar', 'motion', 'sticky', 'top')] },
			{ title: 'A real photo in the hero', say: 'Select the hero section (tap the picture area around the text). In <b>Style</b>, use a real photo with a strong dark overlay so the words stay readable.', ops: [
				set(sec(heroS), 'section', 'style', 'bgImg', pic('team'), { free: 1, from: orig(sec(heroS), 'style', 'bgImg') }), set(sec(heroS), 'section', 'style', 'overlay', 'rgba(0,0,0,.6)'), set(sec(heroS), 'section', 'style', 'minH', 85)] },
			{ title: 'A headline that sells', say: 'Write a benefit-led headline and make it big. Gradient text makes it unique.', ops: [
				set(heroH, 'heading', 'content', 'text', 'Skills that open doors', { free: 1, from: orig(heroH, 'content', 'text') }),
				set(heroH, 'heading', 'style', 'size', 62), set(heroH, 'heading', 'style', 'gradText', '1'), set(heroH, 'heading', 'style', 'g1', '#fde68a'), set(heroH, 'heading', 'style', 'g2', '#fb923c')] },
			{ title: 'Supporting line and button', say: 'Update the sentence under the headline and point the button to the courses.', ops: [
				set(heroT, 'text', 'content', 'html', '<p>Practical courses in web design, data and media, taught by working professionals.</p>', { free: 1, from: orig(heroT, 'content', 'html') }),
				set(heroB, 'button', 'content', 'text', 'Explore courses', { free: 1, from: orig(heroB, 'content', 'text') }), set(heroB, 'button', 'style', 'bg', '#f59e0b')] },
			{ title: 'Bring the hero to life', say: 'Animate the headline word by word and let the button grow on hover.', ops: [set(heroH, 'heading', 'motion', 'in', 'fade-up'), set(heroH, 'heading', 'motion', 'text', 'words'), set(heroB, 'button', 'motion', 'hover', 'grow')] },
			{ title: 'Add a trust strip', say: 'Select the hero, then <b>Add</b> the ready-made <b>Partner logos</b> section. It goes right under the hero.', ops: [{ t: 'add', key: 'tpl:logos', into: sec(heroS), ref: { fn: has('logos') }, check: 'type', type: 'section' }] },
			{ title: 'Softer feature cards', say: 'Select the first feature card. Give it white, a shadow and a hover lift. Do the same for the others if you like.', ops: [
				set(inS(featS, 'iconbox', 0), 'iconbox', 'style', 'bg', '#ffffff'), set(inS(featS, 'iconbox', 0), 'iconbox', 'style', 'shadow', '0 10px 30px rgba(0,0,0,.15)'), set(inS(featS, 'iconbox', 0), 'iconbox', 'motion', 'hover', 'lift'),
				set(sec(featS), 'section', 'style', 'bg', '#f1f5f9')] },
			{ title: 'Use real pictures', say: 'Select the About picture and choose a real photo. Round the corners.', ops: [set(inS(aboutS, 'image'), 'image', 'content', 'src', pic('office'), { free: 1, from: orig(inS(aboutS, 'image'), 'content', 'src') }), set(inS(aboutS, 'image'), 'image', 'style', 'radius', 24)] },
			{ title: 'Service cards that move', say: 'Give the first service card a photo and a hover lift.', ops: [set(inS(cardS, 'card', 0), 'card', 'content', 'src', pic('team'), { free: 1, from: orig(inS(cardS, 'card', 0), 'content', 'src') }), set(inS(cardS, 'card', 0), 'card', 'motion', 'hover', 'lift')] },
			{ title: 'Add proof: numbers', say: 'Select the service cards section, then <b>Add</b> the ready-made <b>Stats band</b>.', ops: [{ t: 'add', key: 'tpl:stats', into: sec(cardS), ref: { fn: has('stats') }, check: 'type', type: 'section' }] },
			{ title: 'Show the journey', say: 'With the stats band selected, <b>Add</b> the ready-made <b>How it works</b> section.', ops: [{ t: 'add', key: 'tpl:journey', into: { fn: has('stats') }, ref: { fn: has('journey') }, check: 'type', type: 'section' }] },
			{ title: 'Let students speak', say: 'Now <b>Add</b> the ready-made <b>Testimonials</b> section.', ops: [{ t: 'add', key: 'tpl:testimonials', into: { fn: has('journey') }, ref: { fn: has('testimonials') }, check: 'type', type: 'section' }] },
			{ title: 'A bold closing call', say: 'Select the blue call-to-action section and give it a rich gradient.', ops: [set(sec(ctaS), 'section', 'style', 'grad1', '#7c2d12'), set(sec(ctaS), 'section', 'style', 'grad2', '#f59e0b'), set(sec(ctaS), 'section', 'style', 'gangle', 120)] },
			{ title: 'Finish the footer', say: 'Put your brand name in the footer.', ops: [set(inS(footS, 'heading'), 'heading', 'content', 'text', 'Kilele Academy', { free: 1, from: orig(inS(footS, 'heading'), 'content', 'text') })] },
			{ title: 'Check the phone view', say: 'Switch to the phone view and make the big headline fit.', ops: [{ t: 'device', d: 'm' }, set(heroH, 'heading', 'style', 'size', 38, { dev: 'm' }), { t: 'device', d: 'd' }] }
		];
		return steps;
	}
	function runMakeover(mode) {
		var x = X();
		x.store.set('lab-last', { href: '#/makeover/' + mode, name: 'Template makeover', mode: mode === 'do' ? 'guided' : 'watch', at: Date.now() });
		if (mode === 'watch') {
			var pr = { id: 'demo', title: 'Makeover demo', tree: C.starterPage(), updated: Date.now() / 1000 + 60 };
			x.openEditor(pr, { noSave: true, noShare: true, exitTo: '#/lab', exitLabel: 'Lab', sideNote: '<b>Makeover demo:</b> from the plain template to a unique website. Pause or speed it up on the card.', onReady: function (ed) {
				var steps = makeoverSteps(ed.tree);
				new Guide(ed, steps, 'watch', { title: 'Template makeover', onExit: function () { location.hash = '#/lab'; }, onDone: function () { mark('makeover', { watched: 1 }); }, endButtons: [
					{ text: 'Now do it yourself', cls: 'pri', on: function () { location.hash = '#/makeover/do'; } },
					{ text: 'Preview the finished website', on: function (gd) { gd.ed.preview(); } },
					{ text: 'Watch again', on: function (gd) { gd.destroy(); x.route(); } },
					{ text: 'Back to the Lab', on: function () { location.hash = '#/lab'; } }] });
			} });
			return;
		}
		boot('Copying the template for you\u2026');
		labProject('lab-makeover', 'My makeover website', C.starterPage()).then(function (pr) {
			x.openEditor(pr, { exitTo: '#/lab', exitLabel: 'Lab', sideNote: '<b>Makeover:</b> follow the guide card to turn this template into a unique website.', onReady: function (ed) {
				var steps = makeoverSteps(ed.tree), saved = x.store.get('lab-step:makeover') || 0;
				new Guide(ed, steps, 'do', { title: 'Template makeover', start: saved < steps.length ? saved : 0,
					onStep: function (i) { x.store.set('lab-step:makeover', i); },
					onExit: function () { ed.save(); location.hash = '#/lab'; },
					onDone: function () { ed.save(); x.store.set('lab-step:makeover', 0); mark('makeover', { guided: 1 }); },
					endButtons: [{ text: 'Publish and share', cls: 'pri', on: function () { var b = document.querySelector('.pe-acts button[title="Publish and share"]'); if (b) b.click(); } }, { text: 'Design Lab', on: function () { location.hash = '#/lab'; } }] });
			}, noShare: false });
		}).catch(function (e) { x.toast(e.message, 'err'); location.hash = '#/lab'; });
	}

	/* ================================================================ client briefs */
	var count = function (tree, test) { var n = 0; C.walk(tree, function (x) { if (test(x)) n++; }); return n; };
	var anyType = function (tree, types) { return count(tree, function (x) { return types.indexOf(x.type) > -1; }); };
	var chk = function (caption, fn) { return { t: 'check', caption: caption, fn: fn }; };
	function commonChecks(name) {
		return [
			chk('A menu bar at the top with <b>' + esc(name) + '</b> as the brand', function (t) { var s0 = t.children[0], ok = false; if (s0) C.walk(s0, function (x) { if ((x.type === 'navbar' && String(x.props.brand || '').toLowerCase().indexOf(name.toLowerCase().split(' ')[0].replace(/[^a-z]/g, '')) > -1) || x.type === 'megamenu') ok = true; }); return ok; }),
			chk('A hero near the top with one H1 headline and a button', function (t) { var ok = false; t.children.slice(0, 3).forEach(function (s0) { var h1 = 0, btn = 0, hs = 0; C.walk(s0, function (x) { if (x.type === 'heading' && x.props.tag === 'h1') h1++; if (x.type === 'typing' && x.props.tag === 'h1') h1++; if (x.type === 'button') btn++; if (x.type === 'heroslider') hs++; }); if ((h1 && btn) || hs) ok = true; }); return ok; }),
			chk('Proof people can trust: testimonials, a star rating or numbers', function (t) { return anyType(t, ['testimonials', 'rating', 'stats', 'counter', 'logos']) > 0; }),
			chk('An easy way to get in touch: a form, WhatsApp or a phone link', function (t) { return anyType(t, ['form', 'whatsapp', 'booking']) > 0 || count(t, function (x) { return /^(https:\/\/wa\.me|tel:)/.test(String(x.props.href || x.props.ctaHref || '')); }) > 0; }),
			chk('A footer at the end of the page', function (t) { var l = t.children[t.children.length - 1]; return !!l && l.props.tag === 'footer'; }),
			chk('At least 3 real pictures', function (t) { return count(t, function (x) { return (x.props && /^(https?:|data:image)/.test(String(x.props.src || '')) && x.type !== 'logos') || (x.style && x.style.bgImg && !/placeholder|^data:image\/svg/.test(String(x.style.bgImg))); }) + count(t, function (x) { return Array.isArray(x.props && x.props.items) && x.props.items.some(function (i) { return i.src; }) ? 1 : 0; }) >= 3; }),
			chk('Movement: at least 3 animated items', function (t) { return count(t, function (x) { return x.props && x.props.fx && (x.props.fx['in'] || x.props.fx.hover || x.props.fx.loop); }) >= 3; }),
			chk('Checked on a phone: at least one phone-only size', function (t) { return count(t, function (x) { return x.style && x.style.m && Object.keys(x.style.m).length; }) > 0; })
		];
	}
	var BRIEFS = [
		{ id: 'kitchen', name: 'Mama Njeri\u2019s Kitchen', who: 'A family restaurant in Kisumu', brief: 'Mama Njeri wants more lunch orders on WhatsApp. She needs her menu with prices, photos of the food and her opening hours.', extra: function () { return [chk('The menu with prices (a price list or pricing tables)', function (t) { return anyType(t, ['pricelist', 'pricing', 'table']) > 0; }), chk('A WhatsApp order button', function (t) { return anyType(t, ['whatsapp']) > 0 || count(t, function (x) { return /wa\.me/.test(String(x.props.href || '')); }) > 0; })]; } },
		{ id: 'salon', name: 'Glow Salon', who: 'A beauty salon in Nairobi', brief: 'Glow Salon wants new clients to see their work, know the prices and book a visit without calling.', extra: function () { return [chk('A gallery of their work', function (t) { return anyType(t, ['gallery', 'carousel']) > 0; }), chk('A booking or contact form', function (t) { return anyType(t, ['form', 'booking']) > 0; })]; } },
		{ id: 'clinic', name: 'Tumaini Clinic', who: 'A family clinic in Nakuru', brief: 'Tumaini Clinic wants patients to see its services, find the clinic, and book an appointment from their phone.', extra: function () { return [chk('A map so patients can find the clinic', function (t) { return anyType(t, ['map']) > 0; }), chk('An appointment or contact form', function (t) { return anyType(t, ['form', 'booking']) > 0; }), chk('Opening hours written on the page', function (t) { var txt = ''; C.walk(t, function (x) { var p = x.props || {}; txt += ' ' + [p.text, p.html, p.title, p.items && JSON.stringify(p.items)].join(' '); }); return /\b(\d{1,2}(:\d{2})?\s?(am|pm)|mon(day)?\s*(to|-|\u2013)\s*(fri|sat)|open\b)/i.test(txt); })]; } },
		{ id: 'academy', name: 'Kilele Academy', who: 'A training school', brief: 'Kilele Academy needs a site that sells its courses: what they teach, how to join, what students say, and a form to apply.', extra: function () { return [chk('At least 3 courses as cards, icon boxes or flip boxes', function (t) { return anyType(t, ['card', 'iconbox', 'imagebox', 'flipbox', 'carousel']) >= 3 || anyType(t, ['carousel']) > 0; }), chk('How to join: steps, a timeline or a journey', function (t) { return anyType(t, ['journey', 'timeline', 'tabs']) > 0; })]; } }
	];
	function briefSteps(b) { return [{ title: b.name, ops: commonChecks(b.name).concat(b.extra()) }]; }
	function runBrief(id) {
		var b = BRIEFS.filter(function (x) { return x.id === id; })[0]; if (!b) return X().go404();
		var x = X();
		x.store.set('lab-last', { href: '#/brief/' + b.id, name: 'Client brief: ' + b.name, mode: 'brief', at: Date.now() });
		boot('Opening the client brief\u2026');
		labProject('brief-' + b.id, b.name, C.emptyPage()).then(function (pr) {
			x.openEditor(pr, { exitTo: '#/lab', exitLabel: 'Lab', sideNote: '<b>Client brief:</b> ' + esc(b.brief) + ' Use your saved parts from <b>My parts</b> below, or build from scratch.', onReady: function (ed) {
				new Guide(ed, briefSteps(b), 'practice', { title: 'Brief: ' + b.name, brief: '<b>' + esc(b.who) + '.</b> ' + esc(b.brief),
					onExit: function () { ed.save(); location.hash = '#/lab'; },
					onPass: function (r) { ed.save(); mark('brief-' + b.id, { done: 1, score: r.pct }); x.modal('Brief complete!', '<div class="st-cele"><div class="st-confetti" aria-hidden="true">' + new Array(18).join('<i></i>') + '</div>' + icon('award', 48) + '<p>Your website for <b>' + esc(b.name) + '</b> meets the brief. Publish it and add it to your portfolio, or submit it to your class.</p></div>', [{ text: 'Publish and share', cls: 'pri', on: function (c) { c(); var sb = document.querySelector('.pe-acts button[title="Publish and share"]'); if (sb) sb.click(); } }, { text: 'Keep improving', on: function (c) { c(); } }]); }
				});
				if (!pr.tree.children.length) ed.showTab('add');
			} });
		}).catch(function (e) { x.toast(e.message, 'err'); location.hash = '#/lab'; });
	}

	/* ================================================================ editor: My parts */
	if (g.PLEEditor) {
		var EP = g.PLEEditor.prototype, origAdd = EP.panelAdd;
		EP.panelAdd = function (p) {
			var r = origAdd.apply(this, arguments), self = this;
			if (this._addQ || !g.PLEStudio || !this.o.storeKey) return r;
			var box = h('div', { class: 'pe-lib' });
			box.appendChild(h('h4', { class: 'pe-h' }, 'My parts'));
			var list = h('div', { class: 'pe-tpls' }); box.appendChild(list);
			var search = p.querySelector('.pe-search');
			if (search && search.nextSibling) p.insertBefore(box, search.nextSibling); else p.appendChild(box);
			loadParts().then(function (l) {
				if (!l.length) { list.outerHTML = '<p class="pe-hint">Designs you finish in the <a href="#/lab">Design Lab</a> can be saved here and added to any page.</p>'; return; }
				l.forEach(function (pt) {
					list.appendChild(h('button', { type: 'button', class: 'pe-tile pe-tpl', onclick: function () {
						X().api('projects/' + pt.id).then(function (full) {
							var secs = ((full.tree || {}).children || []).map(function (s) { return C.reId(C.clone(s)); });
							if (!secs.length) return;
							var hit = self.sel ? C.find(self.tree, self.sel) : null, top = hit;
							while (top && top.parent && top.parent.type !== 'page') top = C.find(self.tree, top.parent.id);
							var at = top ? top.index + 1 : self.tree.children.length;
							Array.prototype.splice.apply(self.tree.children, [at, 0].concat(secs));
							self.after(secs[0].id);
						}).catch(function (e) { self.toast(e.message, 'err'); });
					} }, icon('rows', 22) + '<span>' + esc(pt.title.replace(/^Part: /, '')) + '</span>'));
				});
			}).catch(function () { list.outerHTML = ''; });
			return r;
		};
	}

	/* Any section in any website can be saved as a reusable part. */
	if (g.PLEEditor) {
		var origBind = EP.bindFrame;
		EP.bindFrame = function () {
			var r = origBind.apply(this, arguments), d = this.doc;
			try { d.addEventListener('pointerdown', function (e) { var cg = g.PLEAcademy && g.PLEAcademy.current; if (cg && cg.downFn && cg.ed && cg.ed.doc === d) cg.downFn(e); }, true); } catch (x) { }
			return r;
		};
		var origEdit = EP.panelEdit;
		EP.panelEdit = function (p) {
			var r = origEdit.apply(this, arguments), self = this;
			if (!g.PLEStudio || !this.o.storeKey || !this.sel) return r;
			var hit = C.find(this.tree, this.sel); if (!hit) return r;
			var TOPIC_OF = { heroslider: 'hero', typing: 'hero', navbar: 'header', megamenu: 'header', iconbox: 'services', card: 'services', flipbox: 'services', imagebox: 'about', journey: 'journey', timeline: 'journey', testimonials: 'testimonials', rating: 'testimonials', stats: 'stats', counter: 'stats', progress: 'stats', chart: 'stats', pricing: 'pricing', pricelist: 'pricing', ctabox: 'cta', countdown: 'cta', gallery: 'gallery', carousel: 'gallery', compare: 'gallery', accordion: 'faq', tabs: 'faq', form: 'contact', map: 'contact', booking: 'contact', mpesa: 'contact', team: 'team', logos: 'team', marquee: 'team' };
			var tid = TOPIC_OF[hit.node.type], tp = tid && LAB() && topicById(tid);
			if (tp && !(g.PLEAcademy.current && !g.PLEAcademy.current.dead)) {
				var lk = h('a', { class: 'pe-learn', href: '#/lab/' + tp.id, onclick: function (e) { if (self.dirty && self.o.save) { e.preventDefault(); self.save(); setTimeout(function () { location.hash = '#/lab/' + tp.id; }, 700); } } }, icon('star', 14) + ' <span>Learn to design great <b>' + esc(tp.name.toLowerCase()) + '</b> in the Design Lab</span>');
				var ef = p.querySelector('.pe-efoot'); if (ef) p.insertBefore(lk, ef); else p.appendChild(lk);
			}
			if (hit.node.type !== 'section') return r;
			var foot = p.querySelector('.pe-efoot');
			var b = h('button', { type: 'button', class: 'pe-wide', onclick: function () {
				var name = prompt('Name this part (for example "Hero with photo"):', 'My section'); if (!name) return;
				X().api('projects', { method: 'POST', body: { title: 'Part: ' + name, mode: 'builder', lesson: 'part-own', tree: pageOf([C.reId(C.clone(hit.node))]) } }).then(function () { partsCache = null; X().state.projects = null; self.toast('Saved to My parts.', 'ok'); }).catch(function (e) { self.toast(e.message, 'err'); });
			} }, icon('star', 14) + ' Save this section to My parts');
			if (foot) p.insertBefore(b, foot); else p.appendChild(b);
			return r;
		};
	}

	/* ================================================================ router */
	g.PLEAcademy = {
		route: function (parts) {
			document.querySelectorAll('.ag,.ag-cur,.ag-ring').forEach(function (e) { e.remove(); });
			if (!X() || !LAB()) return false;
			if (parts[0] === 'lab') {
				if (!parts[1]) { viewLab(); return true; }
				if (!parts[2]) { viewTopic(parts[1]); return true; }
				runDesign(parts[1], parts[2], parts[3] || 'watch'); return true;
			}
			if (parts[0] === 'start') { runStart(); return true; }
			if (parts[0] === 'brief') { runBrief(parts[1]); return true; }
			if (parts[0] === 'makeover') { runMakeover(parts[1] === 'do' ? 'do' : 'watch'); return true; }
			return false;
		},
		/* Teachers see what a student has done in the Lab. */
		studentModal: function (m) {
			var items = m.labItems || {}, box = h('div', { class: 'al-stu' });
			var row = function (lbl, e) { return '<li><span>' + esc(lbl) + '</span><b>' + (e.d ? 'Built' + (e.s ? ' ' + e.s + '%' : '') : e.g ? 'Built with guide' : e.w ? 'Watched' : '') + '</b></li>'; };
			var top = [['start', 'Get started tour'], ['makeover', 'Template makeover']].concat(BRIEFS.map(function (b) { return ['brief-' + b.id, 'Brief: ' + b.name]; }));
			var html = '<ul class="al-stul">' + top.filter(function (x) { return items[x[0]]; }).map(function (x) { return row(x[1], items[x[0]]); }).join('') + '</ul>';
			if (LAB()) topics().forEach(function (t) {
				var ds = t.designs.filter(function (d) { return items[d.id]; });
				var qz = items['quiz-' + t.id];
				if (!ds.length && !qz) return;
				html += '<h4>' + esc(t.name) + (qz ? ' <small>quiz passed</small>' : '') + '</h4><ul class="al-stul">' + ds.map(function (d) { return row(d.name, items[d.id]); }).join('') + '</ul>';
			});
			box.innerHTML = html.replace('<ul class="al-stul"></ul>', '') || '<p>Nothing in the Design Lab yet.</p>';
			if (!Object.keys(items).length) box.innerHTML = '<p>Nothing in the Design Lab yet.</p>';
			X().modal(m.name + ': Design Lab', box);
		},
		/* Teachers can attach any Lab item to a class assignment. */
		options: function () {
			if (!LAB()) return [];
			var out = [['lab-start', 'Get started tour', 'Design Lab'], ['lab-makeover', 'Template makeover', 'Design Lab']];
			BRIEFS.forEach(function (b) { out.push(['brief-' + b.id, 'Client brief: ' + b.name, 'Design Lab']); });
			topics().forEach(function (t) { t.designs.forEach(function (d) { out.push(['d-' + d.id, t.name + ': ' + d.name + (d.demo ? '' : ' (practice)'), 'Design Lab designs']); }); });
			return out;
		},
		linkFor: function (v) {
			v = String(v || '');
			if (!LAB()) return null;
			if (v === 'lab-start') return { href: '#/start', label: 'Get started tour' };
			if (v === 'lab-makeover') return { href: '#/makeover/do', label: 'Template makeover' };
			if (v.indexOf('brief-') === 0) { var b = BRIEFS.filter(function (x) { return 'brief-' + x.id === v; })[0]; return b ? { href: '#/brief/' + b.id, label: 'Client brief: ' + b.name } : null; }
			if (v.indexOf('d-') === 0) { var hit = designById(v.slice(2)); return hit ? { href: '#/lab/' + hit.t.id + '/' + hit.d.id + '/' + (hit.d.demo ? 'guided' : 'practise'), label: hit.t.name + ': ' + hit.d.name } : null; }
			return null;
		},
		/* Modern starting points for new projects, assembled from Lab designs. */
		starters: function () { return LAB() ? LAB().starters || [] : []; },
		summary: function () {
			if (!LAB()) return { all: 0, built: 0, watched: 0, started: true, makeover: false };
			var all = 0, built = 0, watched = 0;
			topics().forEach(function (t) { t.designs.forEach(function (d) { all++; var e = stateOf(d); if (e.done || e.guided) built++; if (e.watched) watched++; }); });
			return { all: all, built: built, watched: watched, started: !!(progress().start || {}).guided, makeover: !!(progress().makeover || {}).guided };
		},
		startCard: function () {
			var s2 = this.summary(); if (s2.started || !LAB()) return null;
			var c = h('a', { class: 'al-promo al-new', href: '#/start' });
			c.innerHTML = '<span class="al-sci">' + icon('bolt', 22) + '</span><div><b>New here? Take the 5-minute tour</b><small>A guide walks you through the builder on a real website, one tap at a time.</small></div><span class="st-btn sm pri">Start the tour</span>';
			return c;
		},
		card: function (lessonId) {
			var s2 = this.summary();
			if (!LAB()) return h('span');
			var map = { 'pb-hero': 'hero', 'pb-structure': 'services', 'pb-mobile': 'hero', 'pb-layers': 'about', 'pb-motion': 'services' };
			var tp = lessonId && map[lessonId] && topicById(map[lessonId]);
			if (tp) {
				var c1 = h('a', { class: 'al-promo', href: '#/lab/' + tp.id });
				c1.innerHTML = '<span class="al-sci">' + icon(tp.icon, 22) + '</span><div><b>Practise more: ' + esc(tp.name) + '</b><small>Watch ' + tp.designs.filter(function (d) { return d.demo; }).length + ' demos and try ' + tp.designs.length + ' designs in the Design Lab.</small></div><span class="st-btn sm pri">Open</span>';
				return c1;
			}
			var c = h('a', { class: 'al-promo', href: '#/lab' });
			c.innerHTML = '<span class="al-sci">' + icon('star', 22) + '</span><div><b>Design Lab</b><small>' + (s2.built ? s2.built + ' of ' + s2.all + ' designs built. Keep practising real sections.' : 'Watch real sections being built, build them with a guide, then practise on your own.') + '</small></div><span class="st-btn sm pri">' + (s2.built ? 'Continue' : 'Open') + '</span>';
			return c;
		},
		recipe: recipe, Guide: Guide, opOk: opOk, resolve: resolve, makeoverSteps: makeoverSteps, startSteps: startSteps
	};
})(window);
