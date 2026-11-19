/*!
 * PLE Core: the Pentarch Live Edit page engine.
 * One editor shared by the WordPress builder and PLE Studio.
 * Page tree: Page > Section > Row > Column > Widget.
 */
(function (global) {
	'use strict';

	/* ---------------------------------------------------------------- utils */
	var uid = function () { return Math.random().toString(36).slice(2, 9); };
	var clone = function (o) { return JSON.parse(JSON.stringify(o)); };
	var esc = function (s) {
		return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
			return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
		});
	};
	var h = function (tag, attrs, html) {
		var el = document.createElement(tag);
		if (attrs) {
			Object.keys(attrs).forEach(function (k) {
				var v = attrs[k];
				if (v === null || v === undefined || v === false) return;
				if (k === 'class') el.className = v;
				else if (k === 'text') el.textContent = v;
				else if (k.slice(0, 2) === 'on') el.addEventListener(k.slice(2), v);
				else el.setAttribute(k, v === true ? '' : v);
			});
		}
		if (html !== undefined) {
			if (typeof html === 'string') el.innerHTML = html;
			else if (Array.isArray(html)) html.forEach(function (c) { if (c) el.appendChild(c); });
			else if (html) el.appendChild(html);
		}
		return el;
	};
	/* Strip scripts and inline handlers so custom code cannot run inside the editor canvas. */
	var inert = function (code) {
		try {
			var d = new DOMParser().parseFromString('<div>' + code + '</div>', 'text/html');
			d.querySelectorAll('script,iframe[srcdoc],object,embed').forEach(function (n) { n.remove(); });
			d.querySelectorAll('*').forEach(function (n) {
				[].slice.call(n.attributes).forEach(function (a) {
					if (/^on/i.test(a.name) || /^\s*javascript:/i.test(a.value)) n.removeAttribute(a.name);
				});
			});
			return d.body.firstChild.innerHTML;
		} catch (e) { return ''; }
	};
	var safeUrl = function (u) {
		u = String(u || '').trim();
		if (/^\s*(javascript|vbscript|data:text)/i.test(u)) return '#';
		return u;
	};

	/* ---------------------------------------------------------------- icons */
	var ICONS = {
		star: 'M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z',
		check: 'M20 6L9 17l-5-5',
		heart: 'M20.8 4.6a5.5 5.5 0 00-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 00-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 000-7.8z',
		phone: 'M22 16.9v3a2 2 0 01-2.2 2 19.8 19.8 0 01-8.6-3.1 19.5 19.5 0 01-6-6A19.8 19.8 0 012.1 4.2 2 2 0 014.1 2h3a2 2 0 012 1.7c.1 1 .4 1.9.7 2.8a2 2 0 01-.5 2.1L8 9.9a16 16 0 006 6l1.3-1.3a2 2 0 012.1-.4c.9.3 1.8.6 2.8.7a2 2 0 011.7 2z',
		mail: 'M4 4h16a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2zm18 2l-10 7L2 6',
		pin: 'M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0zm-9 3a3 3 0 100-6 3 3 0 000 6z',
		bolt: 'M13 2L3 14h9l-1 8 10-12h-9z',
		shield: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
		users: 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zm14 10v-2a4 4 0 00-3-3.9M16 3.1a4 4 0 010 7.8',
		chart: 'M18 20V10M12 20V4M6 20v-6',
		globe: 'M12 22a10 10 0 100-20 10 10 0 000 20zM2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z',
		code: 'M16 18l6-6-6-6M8 6l-6 6 6 6',
		camera: 'M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2zM12 17a4 4 0 100-8 4 4 0 000 8z',
		leaf: 'M11 20A7 7 0 019.8 6.1C15.5 5 17 4.5 19 2c1 2 2 4.2 2 8 0 5.5-4.8 10-10 10zM2 21c0-3 1.9-5.4 5.1-6',
		clock: 'M12 22a10 10 0 100-20 10 10 0 000 20zm0-16v6l4 2',
		cart: 'M9 22a1 1 0 100-2 1 1 0 000 2zm11 0a1 1 0 100-2 1 1 0 000 2zM1 1h4l2.7 13.4a2 2 0 002 1.6h9.7a2 2 0 002-1.6L23 6H6',
		book: 'M4 19.5A2.5 2.5 0 016.5 17H20V2H6.5A2.5 2.5 0 004 4.5v15zm0 0A2.5 2.5 0 006.5 22H20v-5',
		arrow: 'M5 12h14M12 5l7 7-7 7',
		home: 'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2zM9 22V12h6v10',
		award: 'M12 15a7 7 0 100-14 7 7 0 000 14zm-3.5-1L7 23l5-3 5 3-1.5-9',
		heading: 'M6 4v16M18 4v16M6 12h12',
		type: 'M4 7V4h16v3M9 20h6M12 4v16',
		image: 'M3 3h18v18H3zM8.5 10a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM21 15l-5-5L5 21',
		minus: 'M5 12h14',
		video: 'M23 7l-7 5 7 5V7zM14 5H3a2 2 0 00-2 2v10a2 2 0 002 2h11a2 2 0 002-2V7a2 2 0 00-2-2z',
		menu: 'M3 12h18M3 6h18M3 18h18',
		columns: 'M12 3v18M3 3h18v18H3z',
		rows: 'M3 3h18v18H3zM3 12h18',
		square: 'M3 3h18v18H3z',
		spacer: 'M12 3v18M8 7l4-4 4 4M8 17l4 4 4-4',
		card: 'M3 4h18v16H3zM3 11h18',
		list: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01'
	};
	var icon = function (name, size) {
		var d = ICONS[name] || ICONS.star;
		return '<svg viewBox="0 0 24 24" width="' + (size || 24) + '" height="' + (size || 24) + '" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="' + d + '"/></svg>';
	};

	/* Placeholder image, so new widgets never show a broken picture. */
	var placeholder = function (label, a, b) {
		var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + (a || '#1e3a8a') + '"/><stop offset="1" stop-color="' + (b || '#0ea5e9') + '"/></linearGradient></defs><rect width="800" height="500" fill="url(#g)"/><g fill="#fff" fill-opacity=".9" font-family="Arial" text-anchor="middle"><text x="400" y="262" font-size="34">' + (label === undefined ? 'Your image' : label) + '</text></g></svg>';
		return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
	};

	/* ------------------------------------------------------------- schema */
	/* Field kinds: text, textarea, html, select, color, num, image, icon, url, toggle, range */
	var STYLE_BOX = [
		{ k: 'bg', l: 'Background colour', t: 'color' },
		{ k: 'color', l: 'Text colour', t: 'color' },
		{ k: 'pt', l: 'Padding top', t: 'num', u: 'px', r: 1 },
		{ k: 'pb', l: 'Padding bottom', t: 'num', u: 'px', r: 1 },
		{ k: 'px', l: 'Padding left & right', t: 'num', u: 'px', r: 1 },
		{ k: 'mt', l: 'Space above', t: 'num', u: 'px', r: 1 },
		{ k: 'mb', l: 'Space below', t: 'num', u: 'px', r: 1 },
		{ k: 'radius', l: 'Rounded corners', t: 'num', u: 'px' },
		{ k: 'border', l: 'Border', t: 'select', o: [['', 'None'], ['1px solid #e5e7eb', 'Thin grey'], ['2px solid currentColor', 'Solid'], ['2px dashed #94a3b8', 'Dashed']] },
		{ k: 'shadow', l: 'Shadow', t: 'select', o: [['', 'None'], ['0 2px 8px rgba(0,0,0,.08)', 'Soft'], ['0 10px 30px rgba(0,0,0,.15)', 'Medium'], ['0 20px 50px rgba(0,0,0,.25)', 'Strong']] },
		{ k: 'align', l: 'Text alignment', t: 'select', o: [['', 'Default'], ['left', 'Left'], ['center', 'Centre'], ['right', 'Right']], r: 1 }
	];
	var STYLE_TEXT = [
		{ k: 'size', l: 'Font size', t: 'num', u: 'px', r: 1 },
		{ k: 'weight', l: 'Font weight', t: 'select', o: [['', 'Default'], ['300', 'Light'], ['400', 'Normal'], ['600', 'Semi-bold'], ['800', 'Bold']] },
		{ k: 'font', l: 'Font', t: 'select', o: [['', 'Page font'], ['Georgia,serif', 'Serif'], ['"Trebuchet MS",sans-serif', 'Rounded'], ['"Courier New",monospace', 'Monospace'], ['Impact,sans-serif', 'Display']] },
		{ k: 'lh', l: 'Line height', t: 'num', u: '' }
	];

	var W = {}; /* widget registry */
	var def = function (type, o) { o.type = type; W[type] = o; };

	def('section', {
		label: 'Section', group: 'layout', icon: 'square', container: true, accepts: ['row'],
		props: { tag: 'section', width: 'boxed', anchor: '' },
		fields: [
			{ k: 'width', l: 'Content width', t: 'select', o: [['boxed', 'Boxed (1140px)'], ['narrow', 'Narrow (760px)'], ['full', 'Full width']] },
			{ k: 'tag', l: 'HTML tag', t: 'select', o: [['section', '<section>'], ['header', '<header>'], ['footer', '<footer>'], ['main', '<main>'], ['div', '<div>']] }
		],
		style: { pt: 64, pb: 64, px: 20 },
		styleFields: [{ k: 'bgImg', l: 'Background image', t: 'image' }, { k: 'overlay', l: 'Image overlay', t: 'select', o: [['', 'None'], ['rgba(0,0,0,.35)', 'Dark light'], ['rgba(0,0,0,.6)', 'Dark strong'], ['rgba(255,255,255,.7)', 'Light']] }, { k: 'minH', l: 'Minimum height', t: 'num', u: 'vh', r: 1 }, { k: 'valign', l: 'Content position', t: 'select', o: [['', 'Top'], ['center', 'Middle'], ['flex-end', 'Bottom']] }].concat(STYLE_BOX)
	});
	def('row', {
		label: 'Row', group: 'layout', icon: 'rows', container: true, accepts: ['column'],
		props: { stack: 'mobile' },
		fields: [
			{ k: 'stack', l: 'Stack columns on', t: 'select', o: [['mobile', 'Phones'], ['tablet', 'Tablets and phones'], ['never', 'Never']] }
		],
		style: { gap: 24 },
		styleFields: [{ k: 'gap', l: 'Gap between columns', t: 'num', u: 'px', r: 1 }, { k: 'valign', l: 'Vertical alignment', t: 'select', o: [['', 'Stretch'], ['start', 'Top'], ['center', 'Middle'], ['end', 'Bottom']] }].concat(STYLE_BOX)
	});
	def('column', {
		label: 'Column', group: 'layout', icon: 'columns', container: true, accepts: 'widget',
		props: { w: 1 },
		fields: [{ k: 'w', l: 'Relative width', t: 'select', o: [['1', '1 part'], ['2', '2 parts'], ['3', '3 parts']] }],
		style: {},
		styleFields: [{ k: 'valign', l: 'Content position', t: 'select', o: [['', 'Top'], ['center', 'Middle'], ['flex-end', 'Bottom']] }].concat(STYLE_BOX)
	});

	def('heading', {
		label: 'Heading', group: 'basic', icon: 'heading', inline: 'text',
		props: { text: 'Your heading here', tag: 'h2' },
		fields: [{ k: 'text', l: 'Text', t: 'textarea' }, { k: 'tag', l: 'Level', t: 'select', o: [['h1', 'H1 (page title)'], ['h2', 'H2'], ['h3', 'H3'], ['h4', 'H4'], ['p', 'Paragraph']] }],
		styleFields: STYLE_TEXT.concat(STYLE_BOX),
		render: function (n) { var t = /^(h[1-6]|p)$/.test(n.props.tag) ? n.props.tag : 'h2'; return '<' + t + ' class="ple-h" data-inline="text">' + esc(n.props.text).replace(/\n/g, '<br>') + '</' + t + '>'; }
	});
	def('text', {
		label: 'Text', group: 'basic', icon: 'type', inline: 'html',
		props: { html: '<p>Write something people will want to read. Keep sentences short and clear.</p>' },
		fields: [{ k: 'html', l: 'Text', t: 'html' }],
		styleFields: STYLE_TEXT.concat(STYLE_BOX),
		render: function (n) { return '<div class="ple-txt" data-inline="html">' + inert(n.props.html) + '</div>'; }
	});
	def('button', {
		label: 'Button', group: 'basic', icon: 'arrow', inline: 'text',
		props: { text: 'Get started', href: '#', look: 'solid', newtab: '' },
		fields: [{ k: 'text', l: 'Label', t: 'text' }, { k: 'href', l: 'Link', t: 'url' }, { k: 'look', l: 'Style', t: 'select', o: [['solid', 'Solid'], ['outline', 'Outline'], ['link', 'Text link']] }, { k: 'newtab', l: 'Open in new tab', t: 'toggle' }],
		style: { bg: '#2563eb', color: '#ffffff', radius: 8 },
		styleFields: [{ k: 'align', l: 'Position', t: 'select', o: [['', 'Left'], ['center', 'Centre'], ['right', 'Right']], r: 1 }, { k: 'bg', l: 'Button colour', t: 'color' }, { k: 'color', l: 'Text colour', t: 'color' }, { k: 'radius', l: 'Rounded corners', t: 'num', u: 'px' }, { k: 'size', l: 'Font size', t: 'num', u: 'px', r: 1 }, { k: 'full', l: 'Full width', t: 'toggle', r: 1 }, { k: 'mt', l: 'Space above', t: 'num', u: 'px', r: 1 }, { k: 'mb', l: 'Space below', t: 'num', u: 'px', r: 1 }],
		render: function (n) {
			return '<a class="ple-btn ple-btn-' + esc(n.props.look) + '" href="' + esc(safeUrl(n.props.href)) + '"' + (n.props.newtab ? ' target="_blank" rel="noopener"' : '') + '><span data-inline="text">' + esc(n.props.text) + '</span></a>';
		}
	});
	def('image', {
		label: 'Image', group: 'basic', icon: 'image',
		props: { src: '', alt: 'Describe this picture', href: '', caption: '' },
		fields: [{ k: 'src', l: 'Picture', t: 'image' }, { k: 'alt', l: 'Alt text (for screen readers and Google)', t: 'text' }, { k: 'caption', l: 'Caption', t: 'text' }, { k: 'href', l: 'Link (optional)', t: 'url' }],
		styleFields: [{ k: 'maxw', l: 'Maximum width', t: 'num', u: '%', r: 1 }, { k: 'ratio', l: 'Shape', t: 'select', o: [['', 'Original'], ['1/1', 'Square'], ['4/3', '4:3'], ['16/9', 'Wide 16:9'], ['3/4', 'Portrait']] }, { k: 'align', l: 'Position', t: 'select', o: [['', 'Left'], ['center', 'Centre'], ['right', 'Right']], r: 1 }, { k: 'radius', l: 'Rounded corners', t: 'num', u: 'px' }, { k: 'shadow', l: 'Shadow', t: 'select', o: STYLE_BOX[9].o }, { k: 'mt', l: 'Space above', t: 'num', u: 'px', r: 1 }, { k: 'mb', l: 'Space below', t: 'num', u: 'px', r: 1 }],
		render: function (n) {
			var img = '<img src="' + esc(safeUrl(n.props.src) || placeholder()) + '" alt="' + esc(n.props.alt) + '" loading="lazy">';
			if (n.props.href) img = '<a href="' + esc(safeUrl(n.props.href)) + '">' + img + '</a>';
			return '<figure class="ple-img">' + img + (n.props.caption ? '<figcaption>' + esc(n.props.caption) + '</figcaption>' : '') + '</figure>';
		}
	});
	def('iconbox', {
		label: 'Icon box', group: 'basic', icon: 'star',
		props: { icon: 'star', title: 'Feature title', text: 'A short line explaining why this matters to your visitor.' },
		fields: [{ k: 'icon', l: 'Icon', t: 'icon' }, { k: 'title', l: 'Title', t: 'text' }, { k: 'text', l: 'Text', t: 'textarea' }],
		style: { ic: '#2563eb' },
		styleFields: [{ k: 'ic', l: 'Icon colour', t: 'color' }, { k: 'layout', l: 'Layout', t: 'select', o: [['', 'Icon on top'], ['row', 'Icon on the left']] }].concat(STYLE_BOX),
		render: function (n) {
			return '<div class="ple-ib"><span class="ple-ib-i">' + icon(n.props.icon, 28) + '</span><div><h3>' + esc(n.props.title) + '</h3><p>' + esc(n.props.text) + '</p></div></div>';
		}
	});
	def('card', {
		label: 'Card', group: 'basic', icon: 'card',
		props: { src: '', title: 'Card title', text: 'Short description of this item.', btn: 'Learn more', href: '#' },
		fields: [{ k: 'src', l: 'Picture', t: 'image' }, { k: 'title', l: 'Title', t: 'text' }, { k: 'text', l: 'Text', t: 'textarea' }, { k: 'btn', l: 'Button label (leave empty to hide)', t: 'text' }, { k: 'href', l: 'Button link', t: 'url' }],
		style: { bg: '#ffffff', radius: 14, shadow: '0 10px 30px rgba(0,0,0,.15)' },
		styleFields: STYLE_BOX,
		render: function (n) {
			return '<article class="ple-card"><img src="' + esc(safeUrl(n.props.src) || placeholder(n.props.title)) + '" alt="' + esc(n.props.title) + '" loading="lazy"><div class="ple-card-b"><h3>' + esc(n.props.title) + '</h3><p>' + esc(n.props.text) + '</p>' + (n.props.btn ? '<a class="ple-card-a" href="' + esc(safeUrl(n.props.href)) + '">' + esc(n.props.btn) + ' &rarr;</a>' : '') + '</div></article>';
		}
	});
	def('list', {
		label: 'List', group: 'basic', icon: 'list',
		props: { items: 'First point\nSecond point\nThird point', icon: 'check' },
		fields: [{ k: 'items', l: 'Items (one per line)', t: 'textarea' }, { k: 'icon', l: 'Bullet icon', t: 'icon' }],
		style: { ic: '#16a34a' },
		styleFields: [{ k: 'ic', l: 'Icon colour', t: 'color' }].concat(STYLE_TEXT, STYLE_BOX),
		render: function (n) {
			return '<ul class="ple-list">' + String(n.props.items || '').split('\n').filter(Boolean).map(function (i) { return '<li>' + icon(n.props.icon, 18) + '<span>' + esc(i) + '</span></li>'; }).join('') + '</ul>';
		}
	});
	def('navbar', {
		label: 'Menu bar', group: 'basic', icon: 'menu',
		props: { brand: 'My Brand', logo: '', links: 'Home|#\nAbout|#about\nServices|#services\nContact|#contact', cta: 'Call us', ctaHref: '#contact' },
		fields: [{ k: 'brand', l: 'Brand name', t: 'text' }, { k: 'logo', l: 'Logo (optional)', t: 'image' }, { k: 'links', l: 'Links (Label|link, one per line)', t: 'textarea' }, { k: 'cta', l: 'Button label', t: 'text' }, { k: 'ctaHref', l: 'Button link', t: 'url' }],
		style: { bg: '#ffffff', color: '#0f172a', ac: '#2563eb' },
		styleFields: [{ k: 'bg', l: 'Background colour', t: 'color' }, { k: 'color', l: 'Text colour', t: 'color' }, { k: 'ac', l: 'Button colour', t: 'color' }, { k: 'sticky', l: 'Stick to top when scrolling', t: 'toggle' }, { k: 'shadow', l: 'Shadow', t: 'select', o: STYLE_BOX[9].o }],
		render: function (n) {
			var id = 'nv' + n.id;
			var links = String(n.props.links || '').split('\n').filter(Boolean).map(function (l) { var p = l.split('|'); return '<a href="' + esc(safeUrl(p[1] || '#')) + '">' + esc(p[0]) + '</a>'; }).join('');
			return '<nav class="ple-nav"><a class="ple-nav-b" href="#">' + (n.props.logo ? '<img src="' + esc(safeUrl(n.props.logo)) + '" alt="' + esc(n.props.brand) + '">' : '') + '<span>' + esc(n.props.brand) + '</span></a><input type="checkbox" id="' + id + '" class="ple-nav-t" aria-label="Open menu"><label for="' + id + '" class="ple-nav-h" aria-hidden="true"><i></i><i></i><i></i></label><div class="ple-nav-l">' + links + (n.props.cta ? '<a class="ple-nav-c" href="' + esc(safeUrl(n.props.ctaHref)) + '">' + esc(n.props.cta) + '</a>' : '') + '</div></nav>';
		}
	});
	def('divider', {
		label: 'Divider', group: 'basic', icon: 'minus',
		props: {}, fields: [],
		style: { lc: '#e2e8f0', lw: 2, mt: 16, mb: 16 },
		styleFields: [{ k: 'lc', l: 'Line colour', t: 'color' }, { k: 'lw', l: 'Thickness', t: 'num', u: 'px' }, { k: 'maxw', l: 'Width', t: 'num', u: '%', r: 1 }, { k: 'mt', l: 'Space above', t: 'num', u: 'px', r: 1 }, { k: 'mb', l: 'Space below', t: 'num', u: 'px', r: 1 }],
		render: function () { return '<hr class="ple-hr">'; }
	});
	def('spacer', {
		label: 'Spacer', group: 'basic', icon: 'spacer',
		props: {}, fields: [], style: { hgt: 40 },
		styleFields: [{ k: 'hgt', l: 'Height', t: 'num', u: 'px', r: 1 }],
		render: function () { return '<div class="ple-sp"></div>'; }
	});
	def('video', {
		label: 'Video', group: 'media', icon: 'video',
		props: { url: 'https://www.youtube.com/watch?v=ysz5S6PUM-U' },
		fields: [{ k: 'url', l: 'YouTube or Vimeo link', t: 'url' }],
		styleFields: [{ k: 'radius', l: 'Rounded corners', t: 'num', u: 'px' }, { k: 'mt', l: 'Space above', t: 'num', u: 'px', r: 1 }, { k: 'mb', l: 'Space below', t: 'num', u: 'px', r: 1 }],
		render: function (n) {
			var u = String(n.props.url || ''), m, src = '';
			if ((m = u.match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([\w-]{11})/))) src = 'https://www.youtube-nocookie.com/embed/' + m[1];
			else if ((m = u.match(/vimeo\.com\/(\d+)/))) src = 'https://player.vimeo.com/video/' + m[1];
			return '<div class="ple-video">' + (src ? '<iframe src="' + esc(src) + '" title="Video" loading="lazy" allowfullscreen allow="autoplay; encrypted-media; picture-in-picture"></iframe>' : '<p>Paste a YouTube or Vimeo link.</p>') + '</div>';
		}
	});
	def('map', {
		label: 'Map', group: 'media', icon: 'pin',
		props: { q: 'Kenyatta International Convention Centre, Nairobi' },
		fields: [{ k: 'q', l: 'Address or place', t: 'text' }],
		style: { hgt: 320 },
		styleFields: [{ k: 'hgt', l: 'Height', t: 'num', u: 'px', r: 1 }, { k: 'radius', l: 'Rounded corners', t: 'num', u: 'px' }],
		render: function (n) { return '<div class="ple-map"><iframe title="Map" loading="lazy" src="https://maps.google.com/maps?q=' + encodeURIComponent(n.props.q || 'Nairobi') + '&amp;output=embed"></iframe></div>'; }
	});
	def('html', {
		label: 'Custom code', group: 'media', icon: 'code',
		props: { code: '<p>Write your own <strong>HTML</strong> here.</p>' },
		fields: [{ k: 'code', l: 'HTML code', t: 'code' }],
		styleFields: STYLE_BOX,
		render: function (n, ctx) { return '<div class="ple-code">' + (ctx && ctx.editing ? inert(n.props.code) : String(n.props.code || '')) + '</div>'; }
	});

	var NATIVE = { el: 1, txt: 1, cmt: 1, block: 1 };
	var VOID = /^(area|base|br|col|embed|hr|img|input|link|meta|source|track|wbr)$/i;
	var isLeafEl = function (n) { return n && n.type === 'el' && (n.props.leaf || VOID.test(n.props.tag)); };
	var isContainer = function (t) {
		if (t && typeof t === 'object') { if (t.type === 'block' || t.type === 'page') return true; if (t.type === 'el') return !isLeafEl(t); return !!(W[t.type] && W[t.type].container); }
		return !!(W[t] && W[t].container) || t === 'block';
	};
	/* parent may be a type string or a node; native HTML containers accept anything. */
	var accepts = function (parent, childType) {
		if (parent && typeof parent === 'object') {
			if (parent.type === 'block' || (parent.type === 'page' && parent.props && parent.props.native)) return childType !== 'row' && childType !== 'column';
			if (parent.type === 'el') return !isLeafEl(parent) && childType !== 'row' && childType !== 'column' && childType !== 'block';
			parent = parent.type;
		}
		var parentType = parent;
		var a = W[parentType] ? W[parentType].accepts : null;
		if (parentType === 'page') return childType === 'section';
		if (a === 'widget') return !isContainer(childType);
		return Array.isArray(a) && a.indexOf(childType) > -1;
	};

	/* ------------------------------------------------------------- model */
	var node = function (type, props, style, children) {
		var d = W[type] || {};
		return {
			id: uid(), type: type,
			props: Object.assign(clone(d.props || {}), props || {}),
			style: Object.assign(clone(d.style || {}), style || {}),
			children: children || []
		};
	};
	var col = function (kids, style, w) { return node('column', { w: w || 1 }, style || {}, kids || []); };
	var row = function (cols, style, props) { return node('row', props || {}, style || {}, cols); };
	var section = function (rows, style, props) { return node('section', props || {}, style || {}, rows); };
	var emptyPage = function () {
		return { id: 'root', type: 'page', props: { font: 'system-ui,-apple-system,"Segoe UI",Roboto,sans-serif', accent: '#2563eb', text: '#0f172a', bg: '#ffffff' }, style: {}, children: [] };
	};
	var walk = function (n, fn, parent, depth) {
		if (fn(n, parent, depth || 0) === false) return false;
		var kids = n.children || [];
		for (var i = 0; i < kids.length; i++) if (walk(kids[i], fn, n, (depth || 0) + 1) === false) return false;
	};
	var find = function (tree, id) {
		var hit = null;
		walk(tree, function (n, p) { if (n.id === id) { hit = { node: n, parent: p, index: p ? p.children.indexOf(n) : -1 }; return false; } });
		return hit;
	};
	var reId = function (n) { n.id = uid(); (n.children || []).forEach(reId); return n; };

	/* ------------------------------------------------------------- templates */
	var T = {};
	T.hero = function () {
		return section([row([col([
			node('heading', { text: 'Build something people love', tag: 'h1' }, { size: 52, weight: '800', color: '#ffffff', align: 'center', m: { size: 34 } }),
			node('text', { html: '<p>Say in one sentence what you do and who you help. This is the first thing visitors read.</p>' }, { size: 20, color: '#e2e8f0', align: 'center', m: { size: 17 } }),
			node('button', { text: 'Get started', href: '#contact' }, { align: 'center', bg: '#f59e0b', color: '#111827', radius: 999, mt: 16 })
		])])], { bg: '#0f172a', bgImg: placeholder('', '#0f172a', '#1d4ed8'), overlay: 'rgba(0,0,0,.35)', pt: 120, pb: 120, minH: 70, valign: 'center', m: { pt: 72, pb: 72 } });
	};
	T.nav = function () { return section([row([col([node('navbar')])])], { pt: 0, pb: 0, px: 0 }, { tag: 'header', width: 'full' }); };
	T.features = function () {
		var f = [['bolt', 'Fast', 'Pages load quickly, even on slow mobile data.'], ['shield', 'Trusted', 'Clear information that builds confidence.'], ['users', 'Friendly', 'Easy for every visitor to use on any phone.']];
		return section([
			row([col([node('heading', { text: 'Why choose us', tag: 'h2' }, { align: 'center', size: 36, m: { size: 28 } }), node('text', { html: '<p>Three reasons customers keep coming back.</p>' }, { align: 'center', color: '#475569', mb: 24 })])]),
			row(f.map(function (x) { return col([node('iconbox', { icon: x[0], title: x[1], text: x[2] }, { bg: '#f8fafc', radius: 14, pt: 24, pb: 24, px: 24 })]); }))
		], { bg: '#ffffff' });
	};
	T.about = function () {
		return section([row([
			col([node('image', { alt: 'Our team at work' }, { radius: 16, shadow: '0 10px 30px rgba(0,0,0,.15)' })]),
			col([
				node('heading', { text: 'About us', tag: 'h2' }, { size: 36, m: { size: 28 } }),
				node('text', { html: '<p>Tell your story here: when you started, what you believe in and the people you serve.</p><p>Visitors trust businesses that feel human.</p>' }, { color: '#475569' }),
				node('list', { items: 'Over 5 years of experience\nLocal team you can visit\nFair, clear prices' }),
				node('button', { text: 'Talk to us', href: '#contact' }, { mt: 12 })
			], { valign: 'center' })
		], { valign: 'center', gap: 48 })], { bg: '#f8fafc' }, { anchor: 'about' });
	};
	T.cards = function () {
		return section([
			row([col([node('heading', { text: 'Our services', tag: 'h2' }, { align: 'center', size: 36, m: { size: 28 } })])]),
			row([1, 2, 3].map(function (i) { return col([node('card', { title: 'Service ' + i, src: placeholder('Service ' + i, ['#7c3aed', '#0f766e', '#be123c'][i - 1], '#f59e0b') })]); }))
		], { bg: '#ffffff' }, { anchor: 'services' });
	};
	T.cta = function () {
		return section([row([col([
			node('heading', { text: 'Ready to begin?', tag: 'h2' }, { color: '#ffffff', size: 36, align: 'center', m: { size: 28 } }),
			node('text', { html: '<p>Call or WhatsApp us today and we will reply within the hour.</p>' }, { color: '#dbeafe', align: 'center' }),
			node('button', { text: 'WhatsApp us', href: 'https://wa.me/254700000000', newtab: '1' }, { align: 'center', bg: '#22c55e', color: '#ffffff', radius: 999 })
		])])], { bg: '#1d4ed8' }, { width: 'narrow' });
	};
	T.contact = function () {
		return section([row([
			col([node('heading', { text: 'Contact us', tag: 'h2' }, { size: 34 }), node('iconbox', { icon: 'phone', title: 'Phone', text: '+254 700 000 000' }, { layout: 'row', mb: 12 }), node('iconbox', { icon: 'mail', title: 'Email', text: 'hello@example.co.ke' }, { layout: 'row', mb: 12 }), node('iconbox', { icon: 'pin', title: 'Visit', text: 'Moi Avenue, Nairobi' }, { layout: 'row' })]),
			col([node('map', {}, { radius: 14 })])
		], { gap: 40 })], { bg: '#ffffff' }, { anchor: 'contact' });
	};
	T.footer = function () {
		return section([row([
			col([node('heading', { text: 'My Brand', tag: 'h3' }, { color: '#ffffff' }), node('text', { html: '<p>Short line about your business.</p>' }, { color: '#94a3b8' })]),
			col([node('heading', { text: 'Links', tag: 'h4' }, { color: '#ffffff' }), node('text', { html: '<p><a href="#about">About</a><br><a href="#services">Services</a><br><a href="#contact">Contact</a></p>' }, { color: '#cbd5e1' })]),
			col([node('heading', { text: 'Follow us', tag: 'h4' }, { color: '#ffffff' }), node('text', { html: '<p>Facebook &middot; Instagram &middot; TikTok</p>' }, { color: '#cbd5e1' })])
		]), row([col([node('divider', {}, { lc: '#334155', lw: 1 }), node('text', { html: '<p>&copy; ' + new Date().getFullYear() + ' My Brand. All rights reserved.</p>' }, { color: '#94a3b8', size: 14, align: 'center' })])])], { bg: '#0f172a', pt: 48, pb: 24 }, { tag: 'footer' });
	};
	T.blank1 = function () { return section([row([col([])])]); };
	T.blank2 = function () { return section([row([col([]), col([])])]); };
	T.blank3 = function () { return section([row([col([]), col([]), col([])])]); };
	var TEMPLATES = [
		['nav', 'Menu bar'], ['hero', 'Hero banner'], ['features', 'Three features'], ['about', 'About, picture + text'],
		['cards', 'Service cards'], ['cta', 'Call to action'], ['contact', 'Contact + map'], ['footer', 'Footer'],
		['blank1', 'Empty, 1 column'], ['blank2', 'Empty, 2 columns'], ['blank3', 'Empty, 3 columns']
	];
	var starterPage = function () {
		var p = emptyPage();
		p.children = [T.nav(), T.hero(), T.features(), T.about(), T.cards(), T.cta(), T.contact(), T.footer()];
		return p;
	};

	/* ------------------------------------------------------------- render */
	var px = function (v, u) { return (v === '' || v === null || v === undefined) ? null : (isNaN(v) ? v : v + (u === undefined ? 'px' : u)); };
	var styleDecl = function (n, s) {
		var t = n.type, d = [], inner = [], extra = [];
		var add = function (arr, k, v) { if (v !== null && v !== undefined && v !== '') arr.push(k + ':' + v); };
		if (s.bgImg !== undefined && s.bgImg) {
			add(d, 'background-image', (s.overlay ? 'linear-gradient(' + s.overlay + ',' + s.overlay + '),' : '') + 'url("' + String(safeUrl(s.bgImg)).replace(/"/g, '%22') + '")');
			add(d, 'background-size', 'cover'); add(d, 'background-position', 'center');
		}
		if (t !== 'button' && t !== 'navbar') add(d, 'background-color', s.bg);
		if (s.grad1 && s.grad2 && !s.bgImg) add(d, 'background-image', 'linear-gradient(' + (s.gangle || 135) + 'deg,' + s.grad1 + ',' + s.grad2 + ')');
		if (s.glass) { d.push('background-color:rgba(255,255,255,.14)'); d.push('-webkit-backdrop-filter:blur(14px) saturate(1.3)'); d.push('backdrop-filter:blur(14px) saturate(1.3)'); d.push('border:1px solid rgba(255,255,255,.25)'); }
		if (s.gradText && s.g1 && s.g2) { d.push('background-image:linear-gradient(90deg,' + s.g1 + ',' + s.g2 + ')'); d.push('-webkit-background-clip:text'); d.push('background-clip:text'); d.push('color:transparent'); d.push('-webkit-text-fill-color:transparent'); }
		add(d, 'opacity', s.op); add(d, 'z-index', s.z);
		if (s.pos) { add(d, 'position', s.pos); add(d, 'top', px(s.top)); add(d, 'left', px(s.left)); add(d, 'right', px(s.right)); add(d, 'bottom', px(s.bottom)); }
		add(d, 'width', px(s.w)); add(d, 'max-width', px(s.mw)); if (s.mw) add(d, 'margin-left', 'auto'), add(d, 'margin-right', 'auto');
		if (s.flex) { add(d, 'display', s.flex); add(d, 'flex-direction', s.fdir); add(d, 'flex-wrap', s.fwrap); add(d, 'justify-content', s.jc); add(d, 'align-items', s.ai); add(d, 'gap', px(s.fgap)); if (s.flex === 'grid') add(d, 'grid-template-columns', s.gcols ? 'repeat(' + s.gcols + ',minmax(0,1fr))' : null); }
		if (t !== 'button' && t !== 'navbar') add(d, 'color', s.color);
		add(d, 'padding-top', px(s.pt)); add(d, 'padding-bottom', px(s.pb));
		if (s.px !== undefined && s.px !== '') { add(d, 'padding-left', px(s.px)); add(d, 'padding-right', px(s.px)); }
		add(d, 'margin-top', px(s.mt)); add(d, 'margin-bottom', px(s.mb));
		if (t !== 'button' && t !== 'image') add(d, 'border-radius', px(s.radius));
		add(d, 'border', s.border);
		if (t !== 'image' && t !== 'navbar') add(d, 'box-shadow', s.shadow);
		add(d, 'text-align', s.align);
		add(d, 'font-size', px(s.size)); add(d, 'font-weight', s.weight); add(d, 'font-family', s.font); add(d, 'line-height', s.lh);
		if (s.minH !== undefined && s.minH !== '' && s.minH !== null) add(d, 'min-height', px(s.minH, 'vh'));
		if (t === 'section' || t === 'column') { if (s.valign) { add(d, 'display', 'flex'); add(d, 'flex-direction', 'column'); add(d, 'justify-content', s.valign); } }
		if (t === 'row') { add(d, 'gap', px(s.gap)); add(d, 'align-items', s.valign); }
		if (t === 'spacer' || t === 'map') { if (t === 'spacer') add(d, 'height', px(s.hgt)); else extra.push(['iframe', 'height:' + px(s.hgt)]); }
		if (t === 'button') {
			if (s.bg) inner.push('--b:' + s.bg); if (s.color) inner.push('--c:' + s.color);
			if (s.radius !== undefined && s.radius !== '') inner.push('border-radius:' + px(s.radius));
			if (s.size) inner.push('font-size:' + px(s.size));
			if (s.full) inner.push('display:block;text-align:center');
			if (s.align) d.push('text-align:' + s.align);
		}
		if (t === 'image') {
			if (s.maxw) extra.push(['img', 'width:' + px(s.maxw, '%')]);
			if (s.ratio) extra.push(['img', 'aspect-ratio:' + s.ratio + ';object-fit:cover']);
			if (s.radius !== undefined && s.radius !== '') extra.push(['img', 'border-radius:' + px(s.radius)]);
			if (s.shadow) extra.push(['img', 'box-shadow:' + s.shadow]);
			if (s.align === 'center') extra.push(['img', 'margin-left:auto;margin-right:auto']);
			if (s.align === 'right') extra.push(['img', 'margin-left:auto;margin-right:0']);
		}
		if (t === 'iconbox' || t === 'list') { if (s.ic) d.push('--ic:' + s.ic); }
		if (t === 'iconbox' && s.layout === 'row') extra.push(['.ple-ib', 'flex-direction:row;text-align:left']);
		if (t === 'divider') { if (s.lc) extra.push(['hr', 'border-top-color:' + s.lc]); if (s.lw) extra.push(['hr', 'border-top-width:' + px(s.lw)]); if (s.maxw) extra.push(['hr', 'width:' + px(s.maxw, '%')]); }
		if (t === 'navbar') {
			if (s.bg) d.push('--nb:' + s.bg); if (s.color) d.push('--nc:' + s.color); if (s.ac) d.push('--na:' + s.ac);
			if (s.shadow) d.push('box-shadow:' + s.shadow);
			if (s.sticky) d.push('position:sticky;top:0;z-index:50');
		}
		if (t === 'video' && s.radius) extra.push(['.ple-video', 'border-radius:' + px(s.radius)]);
		if (t === 'map' && s.radius) extra.push(['.ple-map', 'border-radius:' + px(s.radius)]);
		if (s.hide) d.push('display:none');
		return { d: d, inner: inner, extra: extra };
	};
	var BASE_CSS = [
		'.ple-page{font-family:var(--pf);color:var(--pt);background:var(--pb);line-height:1.6;-webkit-font-smoothing:antialiased}',
		'.ple-page *,.ple-page *:before,.ple-page *:after{box-sizing:border-box}',
		'.ple-page img{max-width:100%;height:auto;display:block}',
		'.ple-page h1,.ple-page h2,.ple-page h3,.ple-page h4{line-height:1.2;margin:0 0 .5em;font-weight:700}',
		'.ple-page p{margin:0 0 1em}.ple-page a{color:var(--pa)}',
		'.ple-section{position:relative}',
		'.ple-wrap{width:100%;max-width:1140px;margin:0 auto}.ple-wrap-narrow{max-width:760px}.ple-wrap-full{max-width:none}',
		'.ple-row{display:grid;grid-template-columns:repeat(var(--cols),minmax(0,1fr))}.ple-row+.ple-row{margin-top:24px}',
		'.ple-column{min-width:0}',
		'.ple-widget{position:relative}.ple-widget>:last-child{margin-bottom:0}',
		'.ple-page .ple-h{font-size:inherit;font-weight:inherit;line-height:inherit;font-family:inherit;color:inherit;letter-spacing:inherit;text-transform:none;margin:0}',
		'.ple-w-heading{line-height:1.2;font-weight:700;margin-bottom:.4em;letter-spacing:-.01em}',
		'.ple-hx-h1{font-size:46px;font-weight:800}.ple-hx-h2{font-size:34px}.ple-hx-h3{font-size:24px}.ple-hx-h4{font-size:19px}.ple-hx-p{font-size:18px;font-weight:600}',
		'@media(max-width:767px){.ple-hx-h1{font-size:32px}.ple-hx-h2{font-size:26px}.ple-hx-h3{font-size:21px}}',
		'.ple-page .ple-txt>:last-child{margin-bottom:0}.ple-w-text{margin-bottom:1em}',
		'.ple-btn{display:inline-block;padding:.85em 1.6em;font-weight:600;text-decoration:none;border-radius:8px;background:var(--b,#2563eb);color:var(--c,#fff)!important;border:2px solid var(--b,#2563eb);transition:transform .15s,filter .15s}',
		'.ple-btn:hover{transform:translateY(-2px);filter:brightness(1.08)}',
		'.ple-btn-outline{background:transparent;color:var(--b,#2563eb)!important}.ple-btn-link{background:none;border-color:transparent;padding-left:0;padding-right:0;color:var(--b,#2563eb)!important}',
		'.ple-img{margin:0}.ple-img figcaption{font-size:.85em;opacity:.7;margin-top:.5em}',
		'.ple-ib{display:flex;flex-direction:column;gap:12px}.ple-ib-i{display:inline-grid;place-items:center;width:52px;height:52px;border-radius:14px;color:var(--ic,#2563eb);background:color-mix(in srgb,var(--ic,#2563eb) 14%,transparent);flex:none}',
		'.ple-ib h3{font-size:1.15em;margin:0 0 .25em}.ple-ib p{margin:0;opacity:.8}',
		'.ple-card{overflow:hidden;border-radius:inherit;height:100%;display:flex;flex-direction:column}.ple-card img{aspect-ratio:16/10;object-fit:cover;width:100%}.ple-card-b{padding:20px}.ple-card-b h3{font-size:1.2em}.ple-card-a{font-weight:600;text-decoration:none}',
		'.ple-list{list-style:none;margin:0;padding:0}.ple-list li{display:flex;gap:10px;align-items:flex-start;margin:0 0 .5em}.ple-list svg{color:var(--ic,#16a34a);flex:none;margin-top:.25em}',
		'.ple-hr{border:0;border-top:2px solid #e2e8f0;margin:0 auto;width:100%}',
		'.ple-video{position:relative;aspect-ratio:16/9;overflow:hidden;background:#000}.ple-video iframe{position:absolute;inset:0;width:100%;height:100%;border:0}',
		'.ple-map{overflow:hidden}.ple-map iframe{display:block;width:100%;height:320px;border:0}',
		'.ple-nav{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:14px 24px;background:var(--nb,#fff);color:var(--nc,#0f172a);position:relative}',
		'.ple-nav-b{display:flex;align-items:center;gap:10px;font-weight:800;font-size:1.2em;text-decoration:none;color:inherit!important}.ple-nav-b img{height:36px;width:auto}',
		'.ple-nav-l{display:flex;align-items:center;gap:22px}.ple-nav-l a{color:inherit!important;text-decoration:none;font-weight:500}.ple-nav-l a:hover{color:var(--na,#2563eb)!important}',
		'.ple-nav-c{background:var(--na,#2563eb);color:#fff!important;padding:.55em 1.2em;border-radius:999px}.ple-nav-l a.ple-nav-c:hover{color:#fff!important;filter:brightness(1.1)}',
		'.ple-nav-t{display:none}.ple-nav-h{display:none;cursor:pointer;width:40px;height:40px;flex-direction:column;justify-content:center;gap:5px;align-items:center}.ple-nav-h i{display:block;width:24px;height:2px;background:currentColor;border-radius:2px}',
		'@media(max-width:767px){.ple-nav-h{display:flex}.ple-nav-l{display:none;position:absolute;left:0;right:0;top:100%;flex-direction:column;align-items:stretch;gap:0;background:var(--nb,#fff);box-shadow:0 12px 24px rgba(0,0,0,.12);padding:8px 24px 20px;z-index:60}.ple-nav-l a{padding:12px 0;border-bottom:1px solid rgba(127,127,127,.15)}.ple-nav-l a.ple-nav-c{text-align:center;margin-top:12px;border:0}.ple-nav-t:checked~.ple-nav-l{display:flex}}',
		'@media(max-width:1024px){.ple-stack-tablet{grid-template-columns:1fr!important}}',
		'@media(max-width:767px){.ple-stack-mobile,.ple-stack-tablet{grid-template-columns:1fr!important}}'
	].join('\n');

	/* Motion settings become data-fx-* attributes that ple-runtime.js reads. */
	var FX_KEYS = ['in', 'dur', 'delay', 'once', 'text', 'stagger', 'hover', 'loop', 'scroll', 'speed', 'devices', 'sticky', 'offset', 'hide', 'sd'];
	var fxAttrs = function (n) {
		var fx = (n.props && n.props.fx) || {}, out = '';
		FX_KEYS.forEach(function (k) { var v = fx[k]; if (v !== undefined && v !== null && v !== '') out += ' data-fx-' + k + '="' + escAttr(v) + '"'; });
		return out;
	};
	var DIVIDERS = {
		wave: 'M0 40 C 240 100 480 -20 720 40 S 1200 100 1440 40 V 0 H 0 Z',
		curve: 'M0 0 H1440 V20 Q720 120 0 20 Z',
		tilt: 'M0 0 H1440 V0 L0 80 Z',
		triangle: 'M0 0 H1440 L720 80 Z',
		zigzag: 'M0 0 H1440 V30 L1380 60 L1320 30 L1260 60 L1200 30 L1140 60 L1080 30 L1020 60 L960 30 L900 60 L840 30 L780 60 L720 30 L660 60 L600 30 L540 60 L480 30 L420 60 L360 30 L300 60 L240 30 L180 60 L120 30 L60 60 L0 30 Z',
		clouds: 'M0 0 H1440 V40 C1380 70 1320 30 1260 50 C1200 80 1140 30 1080 50 C1020 80 960 30 900 50 C840 80 780 30 720 50 C660 80 600 30 540 50 C480 80 420 30 360 50 C300 80 240 30 180 50 C120 80 60 30 0 50 Z'
	};
	var hasExtras = function (n) { var p = n.props || {}; return !!(p.divTop || p.divBot || p.bgVideo || p.particles); };
	var extrasHtml = function (n, editing) {
		var p = n.props || {}, h = '';
		if (p.bgVideo) {
			var u = String(p.bgVideo), m, inner;
			if ((m = u.match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([\w-]{11})/))) inner = '<iframe src="https://www.youtube-nocookie.com/embed/' + m[1] + '?autoplay=1&amp;mute=1&amp;loop=1&amp;playlist=' + m[1] + '&amp;controls=0&amp;showinfo=0&amp;modestbranding=1" allow="autoplay" tabindex="-1" title="Background video"></iframe>';
			else inner = '<video src="' + escAttr(safeUrl(u)) + '" autoplay muted loop playsinline></video>';
			h += '<div class="pl-bgvideo" data-ple-auto aria-hidden="true">' + (editing ? '' : inner) + '</div>';
		}
		if (p.particles) h += '<canvas data-particles="' + escAttr(p.particles) + '" data-ple-auto aria-hidden="true"></canvas>';
		var dv = function (shape, where) { var d = DIVIDERS[shape]; return d ? '<div class="pl-divider pl-divider-' + where + '" data-ple-auto aria-hidden="true" style="--dh:' + (+p.divH || 70) + 'px"><svg viewBox="0 0 1440 100" preserveAspectRatio="none"><path d="' + d + '" fill="' + escAttr(p.divColor || '#ffffff') + '"/></svg></div>' : ''; };
		if (p.divTop) h += dv(p.divTop, 'top');
		if (p.divBot) h += dv(p.divBot, 'bottom');
		return h;
	};
	var selOf = function (n) { return n.type === 'el' ? '[data-pid="' + n.id + '"]' : '#ple-' + n.id; };
	var escText = function (t) { return String(t == null ? '' : t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\u00a0/g, '&nbsp;'); };
	var escAttr = function (t) { return String(t == null ? '' : t).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;'); };

	/* ---------------------------------------------------------- HTML import */
	var INLINE = /^(a|abbr|b|bdi|bdo|br|cite|code|data|del|dfn|em|i|img|ins|kbd|label|mark|q|s|samp|small|span|strong|sub|sup|time|u|var|wbr|font)$/i;
	var ALWAYS_LEAF = /^(svg|style|script|noscript|template|iframe|video|audio|canvas|select|textarea|math|object|picture|button|table)$/i;
	var TEXTY = /^(h[1-6]|p|li|a|button|span|label|figcaption|dt|dd|td|th|blockquote|strong|em|small|b|i|cite|summary|legend|caption|q|time)$/i;
	var parseEl = function (el) {
		var tag = el.tagName.toLowerCase();
		if (el.hasAttribute('data-ple-tree')) { try { return JSON.parse(el.getAttribute('data-ple-tree')); } catch (e) { } }
		if (tag === 'style' && /\bple-gen\b/.test(el.className || '')) return null;
		if (el.hasAttribute('data-ple-auto')) return null;
		var attrs = {}, id = el.getAttribute('data-pid') || uid(), style = {};
		var fx = {}, xtra = null;
		[].slice.call(el.attributes).forEach(function (at) {
			if (at.name.indexOf('data-fx-') === 0 && FX_KEYS.indexOf(at.name.slice(8)) > -1) { fx[at.name.slice(8)] = at.value; return; }
			if (at.name === 'data-ple-x') { try { xtra = JSON.parse(at.value); } catch (e) { } return; }
			if (at.name !== 'data-pid' && at.name !== 'data-ple-style' && at.name !== 'data-ple' && at.name !== 'data-ple-bg') attrs[at.name] = at.value;
		});
		if (el.hasAttribute('data-ple-style')) { try { style = JSON.parse(el.getAttribute('data-ple-style')) || {}; } catch (e) { } }
		var kids = [].slice.call(el.childNodes).filter(function (k) { return !(k.nodeType === 1 && k.hasAttribute('data-ple-auto')); });
		var hasBlockChild = kids.some(function (k) { return k.nodeType === 1 && !INLINE.test(k.tagName); });
		var hasContent = kids.some(function (k) { return (k.nodeType === 3 && k.data.trim()) || k.nodeType === 1; });
		var leaf = ALWAYS_LEAF.test(tag) || VOID.test(tag) || (hasContent && !hasBlockChild && (TEXTY.test(tag) || kids.some(function (k) { return k.nodeType === 3 && k.data.trim(); })));
		var n = { id: id, type: 'el', props: { tag: tag, attrs: attrs }, style: style, children: [] };
		if (Object.keys(fx).length) n.props.fx = fx;
		if (xtra) Object.keys(xtra).forEach(function (k) { if (xtra[k]) n.props[k] = xtra[k]; });
		if (leaf) { n.props.leaf = 1; n.props.html = (tag === 'template') ? el.innerHTML : el.innerHTML; }
		else n.children = parseNodes(el);
		return n;
	};
	var parseNodes = function (parent) {
		var out = [];
		[].slice.call(parent.childNodes).forEach(function (k) {
			if (k.nodeType === 3) { if (k.data.trim()) out.push({ id: uid(), type: 'txt', props: { text: k.data.replace(/^\s+|\s+$/g, function (w) { return /\n/.test(w) ? '' : ' '; }) }, style: {}, children: [] }); }
			else if (k.nodeType === 8) out.push({ id: uid(), type: 'cmt', props: { text: k.data }, style: {}, children: [] });
			else if (k.nodeType === 1) { var n = parseEl(k); if (n) out.push(n); }
		});
		return out;
	};
	var parseHTML = function (html) {
		var t = document.createElement('template');
		t.innerHTML = html;
		return parseNodes(t.content);
	};
	/* Turn page content (with [ple] Live Block shortcodes) into one editable tree. */
	var parseNative = function (src) {
		var root = { id: 'root', type: 'page', props: { native: 1 }, style: {}, children: [] };
		var content = String(src.content || ''), re = /\[ple\s[^\]]*\]/g, last = 0, m;
		var pushHtml = function (h) { if (h && h.trim()) root.children = root.children.concat(parseHTML(h)); };
		while ((m = re.exec(content))) {
			pushHtml(content.slice(last, m.index));
			var b = (src.blocks || {})[m[0]];
			if (b) root.children.push({ id: 'b' + b.id, type: 'block', props: { blockId: b.id, title: b.title, shortcode: m[0] }, style: {}, children: parseHTML(b.content) });
			else root.children.push({ id: uid(), type: 'txt', props: { text: m[0] }, style: {}, children: [] });
			last = m.index + m[0].length;
		}
		pushHtml(content.slice(last));
		return root;
	};
	/* Back to page content plus the HTML of each Live Block. */
	var serializeNative = function (root) {
		var content = '', blocks = {};
		var chunk = function (kids) { var r = render({ type: 'page', props: { native: 1 }, children: kids }); return r.html + (r.css ? '\n<style class="ple-gen">\n' + r.css + '\n</style>' : ''); };
		var loose = [];
		var flush = function () { if (loose.length) { content += chunk(loose); loose = []; } };
		(root.children || []).forEach(function (n) {
			if (n.type === 'block') { flush(); content += n.props.shortcode; blocks[n.props.blockId] = chunk(n.children); }
			else loose.push(n);
		});
		flush();
		return { content: content, blocks: blocks };
	};

	var render = function (tree, ctx) {
		ctx = ctx || {};
		var css = [], d = [], t = [], m = [];
		var pp = tree.props || {};
		css.push('.ple-page{--pf:' + (pp.font || 'system-ui,sans-serif') + ';--pa:' + (pp.accent || '#2563eb') + ';--pt:' + (pp.text || '#0f172a') + ';--pb:' + (pp.bg || '#fff') + '}');
		var rule = function (arr, n, s) {
			var r = styleDecl(n, s), sel = selOf(n);
			if (r.d.length) arr.push(sel + '{' + r.d.join(';') + '}');
			if (r.inner.length) arr.push(sel + ' .ple-btn{' + r.inner.join(';') + '}');
			r.extra.forEach(function (e) { arr.push(sel + ' ' + e[0] + '{' + e[1] + '}'); });
		};
		var attrs = function (n) { return ' id="ple-' + n.id + '"' + fxAttrs(n) + (hasExtras(n) ? ' data-ple-bg' : '') + (ctx.editing ? ' data-ple="' + n.id + '"' : ''); };
		var native = !!pp.native, hasWidgets = false;
		var html = function (n, parent) {
			var s = n.style || {};
			if (NATIVE[n.type]) return nativeHtml(n);
			hasWidgets = true;
			/* A builder subtree inside hand-written HTML keeps its structure in data-ple-tree. */
			if (native && parent && (NATIVE[parent.type] || parent.type === 'page')) {
				return '<div class="ple-page ple-embed" data-ple-tree="' + esc(JSON.stringify(n)) + '">' + html(n, n) + '</div>';
			}
			rule(d, n, s);
			if (s.t && Object.keys(s.t).length) rule(t, n, Object.assign({ __t: 1 }, s.t));
			if (s.m && Object.keys(s.m).length) rule(m, n, Object.assign({ __m: 1 }, s.m));
			var kids = (n.children || []).map(function (c) { return html(c, n); }).join('');
			var cls = (n.props && n.props.cls ? ' ' + esc(n.props.cls) : '');
			var anchor = n.props && n.props.anchor ? ' data-anchor="' + esc(n.props.anchor) + '"' : '';
			switch (n.type) {
				case 'section':
					var tag = /^(section|header|footer|main|div)$/.test(n.props.tag) ? n.props.tag : 'section';
					var id = n.props.anchor ? ' id="' + esc(n.props.anchor) + '"' : '';
					return '<' + tag + ' class="ple-section' + cls + '"' + attrs(n) + '>' + (id ? '<span' + id + ' style="position:absolute;top:-70px"></span>' : '') + extrasHtml(n, ctx.editing) + '<div class="ple-wrap ple-wrap-' + esc(n.props.width || 'boxed') + '">' + (kids || (ctx.editing ? '<div class="ple-empty">Empty section</div>' : '')) + '</div></' + tag + '>';
				case 'row':
					var cols = (n.children || []).map(function (c) { return (+c.props.w || 1) + 'fr'; }).join(' ') || '1fr';
					return '<div class="ple-row ple-stack-' + esc(n.props.stack || 'mobile') + cls + '"' + attrs(n) + ' style="grid-template-columns:' + cols + '">' + kids + '</div>';
				case 'column':
					return '<div class="ple-column' + cls + '"' + attrs(n) + '>' + extrasHtml(n, ctx.editing) + (kids || (ctx.editing ? '<div class="ple-empty" data-drop="' + n.id + '">+ Add a widget</div>' : '')) + '</div>';
				default:
					var w = W[n.type];
					var hx = n.type === 'heading' ? ' ple-hx-' + (/^(h[1-6]|p)$/.test(n.props.tag) ? n.props.tag : 'h2') : '';
					return '<div class="ple-widget ple-w-' + n.type + hx + cls + '"' + attrs(n) + anchor + '>' + (w && w.render ? w.render(n, ctx) : '') + '</div>';
			}
		};
		var nativeHtml = function (n) {
			var s = n.style || {};
			var styled = n.type === 'el' && ((Object.keys(s).filter(function (k) { return k !== 't' && k !== 'm'; }).length) || (s.t && Object.keys(s.t).length) || (s.m && Object.keys(s.m).length) || n.props.hideD || n.props.hideT || n.props.hideM);
			if (styled) {
				rule(d, n, s);
				if (s.t && Object.keys(s.t).length) rule(t, n, s.t);
				if (s.m && Object.keys(s.m).length) rule(m, n, s.m);
			}
			var kids = function () { return (n.children || []).map(function (c) { return html(c, n); }).join(''); };
			switch (n.type) {
				case 'txt': return ctx.editing ? '<ple-t data-ple="' + n.id + '">' + escText(n.props.text) + '</ple-t>' : escText(n.props.text);
				case 'cmt': return '<!--' + String(n.props.text || '').replace(/--/g, '- -') + '-->';
				case 'block': return ctx.editing ? '<ple-b data-ple="' + n.id + '" style="display:contents">' + kids() + '</ple-b>' : kids();
			}
			var p = n.props, tag = String(p.tag || 'div').toLowerCase().replace(/[^a-z0-9-]/g, '') || 'div';
			var a = '', at = p.attrs || {};
			Object.keys(at).forEach(function (k) {
				if (!/^[^\s"'>\/=]+$/.test(k) || k === 'data-ple' || k === 'data-pid' || k === 'data-ple-style') return;
				a += ' ' + k + (at[k] === '' && /^(hidden|async|defer|disabled|checked|selected|required|readonly|multiple|autoplay|muted|loop|controls|playsinline|allowfullscreen|open|novalidate)$/i.test(k) ? '' : '="' + escAttr(at[k]) + '"');
			});
			if (styled) a += ' data-pid="' + n.id + '" data-ple-style="' + escAttr(JSON.stringify(s)) + '"';
			a += fxAttrs(n);
			var ex = !p.leaf && hasExtras(n);
			if (ex) a += ' data-ple-bg data-ple-x="' + escAttr(JSON.stringify({ divTop: p.divTop, divBot: p.divBot, divColor: p.divColor, divH: p.divH, bgVideo: p.bgVideo, particles: p.particles })) + '"';
			if (ctx.editing) a += ' data-ple="' + n.id + '"';
			if (VOID.test(tag)) return '<' + tag + a + '>';
			var inner = p.leaf ? (ctx.editing && tag === 'script' ? p.html : (p.html || '')) : (ex ? extrasHtml(n, ctx.editing) : '') + kids();
			return '<' + tag + a + '>' + inner + '</' + tag + '>';
		};
		var body = (tree.children || []).map(function (c) { return html(c, tree); }).join('');
		var out = css.concat(d);
		if (t.length) out.push('@media(max-width:1024px){' + t.join('') + '}');
		if (m.length) out.push('@media(max-width:767px){' + m.join('') + '}');
		/* responsive hide flags */
		var hide = [];
		walk(tree, function (n) {
			var a = n.props || {};
			if (n.type === 'page' || n.type === 'txt' || n.type === 'cmt' || n.type === 'block') return;
			if (a.hideD) hide.push('@media(min-width:1025px){' + selOf(n) + '{display:none!important}}');
			if (a.hideT) hide.push('@media(min-width:768px) and (max-width:1024px){' + selOf(n) + '{display:none!important}}');
			if (a.hideM) hide.push('@media(max-width:767px){' + selOf(n) + '{display:none!important}}');
		});
		if (native) {
			var nc = (hasWidgets ? BASE_CSS + '\n' + css.join('\n') + '\n' : '') + d.join('\n') + (t.length ? '\n@media(max-width:1024px){' + t.join('') + '}' : '') + (m.length ? '\n@media(max-width:767px){' + m.join('') + '}' : '') + (hide.length ? '\n' + hide.join('\n') : '');
			return { html: body, css: nc.trim(), widgets: hasWidgets };
		}
		return { html: '<div class="ple-page">' + body + '</div>', css: BASE_CSS + '\n' + out.join('\n') + '\n' + hide.join('\n') + (pp.customCss ? '\n' + pp.customCss : '') };
	};
	var fullDoc = function (tree, title) {
		var r = render(tree);
		var rt = global.PLECore && global.PLECore.RUNTIME;
		return '<!DOCTYPE html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n<title>' + esc(title || 'My page') + '</title>\n' + (rt ? '<link rel="stylesheet" href="' + esc(rt.css) + '">\n' : '') + '<style>\nbody{margin:0}\n' + r.css + '\n</style>\n</head>\n<body>\n' + pretty(r.html) + '\n' + (rt ? '<script src="' + esc(rt.js) + '"></script>\n' : '') + '</body>\n</html>';
	};
	/* Light HTML formatter so students can read the generated code. */
	var pretty = function (html) {
		var out = [], ind = 0, tokens = html.replace(/>\s*</g, '><').split(/(?=<)|(?<=>)/);
		var inline = /^<\/?(a|span|strong|em|b|i|br|img|svg|path|input|label|small|code)\b/i;
		var line = '';
		var flush = function () { if (line.trim()) out.push('  '.repeat(Math.max(ind, 0)) + line.trim()); line = ''; };
		tokens.forEach(function (tk) {
			if (!tk) return;
			if (tk[0] !== '<' || inline.test(tk)) { line += tk; return; }
			if (/^<\//.test(tk)) { flush(); ind--; out.push('  '.repeat(Math.max(ind, 0)) + tk); return; }
			flush(); out.push('  '.repeat(Math.max(ind, 0)) + tk);
			if (!/\/>$/.test(tk) && !/^<(meta|link|hr|img|br|input|!)/i.test(tk)) ind++;
		});
		flush();
		return out.join('\n');
	};

	global.PLECore = {
		W: W, ICONS: ICONS, icon: icon, esc: esc, h: h, uid: uid, clone: clone, inert: inert, safeUrl: safeUrl, placeholder: placeholder,
		node: node, col: col, row: row, section: section, emptyPage: emptyPage, starterPage: starterPage,
		walk: walk, find: find, reId: reId, accepts: accepts, isContainer: isContainer, isLeafEl: isLeafEl, NATIVE: NATIVE, VOID: VOID,
		parseHTML: parseHTML, parseNative: parseNative, serializeNative: serializeNative, selOf: selOf, def: def, DIVIDERS: DIVIDERS, FX_KEYS: FX_KEYS,
		T: T, TEMPLATES: TEMPLATES, STYLE_BOX: STYLE_BOX, STYLE_TEXT: STYLE_TEXT,
		render: render, fullDoc: fullDoc, pretty: pretty, BASE_CSS: BASE_CSS
	};
})(window);
