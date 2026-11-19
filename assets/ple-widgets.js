/*!
 * PLE Widgets: the extended widget library (sliders, tabs, FAQ, gallery, pricing, charts, menus and more).
 * Registers into PLECore. Interactive behaviour lives in ple-runtime.js.
 */
(function (g) {
	'use strict';
	var C = g.PLECore, def = C.def, esc = C.esc, icon = C.icon, url = C.safeUrl, ph = C.placeholder, BOX = C.STYLE_BOX, TXT = C.STYLE_TEXT;
	var img = function (src, alt, cls) { return '<img src="' + esc(url(src) || ph(alt || '')) + '" alt="' + esc(alt || '') + '" loading="lazy"' + (cls ? ' class="' + cls + '"' : '') + '>'; };
	var link = function (href, inner, cls, attrs) { return '<a href="' + esc(url(href) || '#') + '"' + (cls ? ' class="' + cls + '"' : '') + (attrs || '') + '>' + inner + '</a>'; };
	var items = function (n) { return Array.isArray(n.props.items) ? n.props.items : []; };
	var lines = function (s) { return String(s || '').split('\n').map(function (x) { return x.trim(); }).filter(Boolean); };
	var uidv = function (n) { return 'w' + n.id; };
	var ICONLIST = Object.keys(C.ICONS);
	var SPACE = [{ k: 'mt', l: 'Space above', t: 'num', u: 'px', r: 1 }, { k: 'mb', l: 'Space below', t: 'num', u: 'px', r: 1 }];
	var CL = function (k, l) { return { k: k, l: l, t: 'color' }; };

	/* ---------------- basic */
	def('icon', {
		label: 'Icon', group: 'basic', icon: 'star',
		props: { icon: 'star', href: '', size: 48 },
		fields: [{ k: 'icon', l: 'Icon', t: 'icon' }, { k: 'size', l: 'Size', t: 'num', u: 'px' }, { k: 'href', l: 'Link (optional)', t: 'url' }],
		style: { ic: '#2563eb', align: 'center' },
		styleFields: [CL('ic', 'Icon colour'), { k: 'align', l: 'Position', t: 'select', o: [['', 'Left'], ['center', 'Centre'], ['right', 'Right']], r: 1 }].concat(SPACE),
		render: function (n) { var i = '<span class="pl-ic" style="color:var(--ic,#2563eb)">' + icon(n.props.icon, +n.props.size || 48) + '</span>'; return n.props.href ? link(n.props.href, i) : i; }
	});
	def('imagebox', {
		label: 'Image box', group: 'basic', icon: 'image',
		props: { src: '', title: 'Image box title', text: 'Describe this item in a sentence or two.', href: '' },
		fields: [{ k: 'src', l: 'Picture', t: 'image' }, { k: 'title', l: 'Title', t: 'text' }, { k: 'text', l: 'Text', t: 'textarea' }, { k: 'href', l: 'Link (optional)', t: 'url' }],
		style: { radius: 16 },
		styleFields: BOX,
		render: function (n) { var p = n.props, inner = '<div style="overflow:hidden;border-radius:inherit">' + img(p.src, p.title) + '</div><h3 style="margin:14px 0 6px">' + esc(p.title) + '</h3><p style="margin:0;opacity:.8">' + esc(p.text) + '</p>'; return p.href ? link(p.href, inner, '', ' style="color:inherit;text-decoration:none;display:block"') : inner; }
	});
	def('alert', {
		label: 'Notice box', group: 'basic', icon: 'shield',
		props: { kind: 'info', title: 'Good to know', text: 'Registration closes on Friday at 5pm.' },
		fields: [{ k: 'kind', l: 'Type', t: 'select', o: [['info', 'Information'], ['ok', 'Success'], ['warn', 'Warning'], ['err', 'Important']] }, { k: 'title', l: 'Title', t: 'text' }, { k: 'text', l: 'Text', t: 'textarea' }],
		styleFields: SPACE,
		render: function (n) { return '<div class="pl-alert ' + esc(n.props.kind) + '" role="note"><div><b>' + esc(n.props.title) + '</b><div>' + esc(n.props.text) + '</div></div></div>'; }
	});
	def('rating', {
		label: 'Star rating', group: 'basic', icon: 'star',
		props: { value: 5, max: 5, label: 'Rated 5 out of 5 by our students' },
		fields: [{ k: 'value', l: 'Rating', t: 'num', u: '' }, { k: 'max', l: 'Out of', t: 'num', u: '' }, { k: 'label', l: 'Label', t: 'text' }],
		styleFields: [{ k: 'align', l: 'Position', t: 'select', o: [['', 'Left'], ['center', 'Centre'], ['right', 'Right']], r: 1 }].concat(SPACE),
		render: function (n) { var v = Math.max(0, Math.min(+n.props.max || 5, +n.props.value || 0)), s = ''; for (var i = 1; i <= (+n.props.max || 5); i++) s += i <= v ? '\u2605' : (i - 0.5 <= v ? '\u2be8' : '\u2606'); return '<div><span class="pl-stars" aria-label="' + v + ' out of ' + (+n.props.max || 5) + '">' + s + '</span>' + (n.props.label ? '<div style="font-size:.9em;opacity:.75">' + esc(n.props.label) + '</div>' : '') + '</div>'; }
	});
	def('social', {
		label: 'Social icons', group: 'basic', icon: 'users',
		props: { items: [{ net: 'Facebook', url: 'https://facebook.com/' }, { net: 'Instagram', url: 'https://instagram.com/' }, { net: 'TikTok', url: 'https://tiktok.com/' }, { net: 'LinkedIn', url: 'https://linkedin.com/' }, { net: 'WhatsApp', url: 'https://wa.me/254700000000' }] },
		fields: [{ k: 'items', l: 'Profiles', t: 'items', sub: [{ k: 'net', l: 'Network', t: 'select', o: [['Facebook', 'Facebook'], ['Instagram', 'Instagram'], ['TikTok', 'TikTok'], ['LinkedIn', 'LinkedIn'], ['X', 'X (Twitter)'], ['YouTube', 'YouTube'], ['WhatsApp', 'WhatsApp'], ['Email', 'Email']] }, { k: 'url', l: 'Link', t: 'url' }], title: 'net' }],
		style: { sb: '#0f172a' },
		styleFields: [CL('sb', 'Icon background'), { k: 'align', l: 'Position', t: 'select', o: [['', 'Left'], ['center', 'Centre'], ['right', 'Right']], r: 1 }].concat(SPACE),
		render: function (n) {
			var G = { Facebook: 'M14 8h3V4h-3a4 4 0 00-4 4v3H7v4h3v7h4v-7h3l1-4h-4V8z', Instagram: 'M7 2h10a5 5 0 015 5v10a5 5 0 01-5 5H7a5 5 0 01-5-5V7a5 5 0 015-5zm5 6a4 4 0 100 8 4 4 0 000-8zm6-1h.01', TikTok: 'M16 3c.4 2.6 2 4 4.5 4.2V11c-1.7 0-3.2-.5-4.5-1.4V16a6 6 0 11-6-6v3.8a2.2 2.2 0 102.2 2.2V3z', LinkedIn: 'M4 4h4v4H4zM4 10h4v10H4zM10 10h4v1.6c.6-1 1.9-1.9 3.6-1.9C20.3 9.7 21 11.6 21 14v6h-4v-5.4c0-1.3-.4-2.2-1.6-2.2s-1.4 1-1.4 2.2V20h-4z', X: 'M4 4l16 16M20 4L4 20', YouTube: 'M22 8s0-3-3-3H5C2 5 2 8 2 8v8s0 3 3 3h14c3 0 3-3 3-3zM10 9l5 3-5 3z', WhatsApp: 'M3 21l1.6-4.6A9 9 0 1112 21a9 9 0 01-4.4-1.1zM8.5 8.5c0 4 3 7 7 7l1-1.6-2-1-1 1c-1.3-.5-2.4-1.6-2.9-2.9l1-1-1-2z', Email: 'M4 4h16a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2zm18 2l-10 7L2 6' };
			return '<div class="pl-social" style="justify-content:inherit">' + items(n).map(function (it) { return '<a href="' + esc(url(it.url)) + '" target="_blank" rel="noopener" aria-label="' + esc(it.net) + '" style="background:var(--sb)"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="' + (G[it.net] || G.Email) + '"/></svg></a>'; }).join('') + '</div>';
		}
	});
	def('search', {
		label: 'Search box', group: 'basic', icon: 'globe',
		props: { placeholder: 'Search courses, news\u2026', button: 'Search' },
		fields: [{ k: 'placeholder', l: 'Placeholder', t: 'text' }, { k: 'button', l: 'Button label', t: 'text' }],
		styleFields: SPACE,
		render: function (n) { return '<form class="pl-form" role="search" action="/" method="get" style="grid-template-columns:1fr auto;display:grid"><input type="search" name="s" placeholder="' + esc(n.props.placeholder) + '" aria-label="Search"><button class="pl-btn" type="submit">' + esc(n.props.button) + '</button></form>'; }
	});

	/* ---------------- media */
	def('gallery', {
		label: 'Gallery', group: 'media', icon: 'image',
		props: { items: [{ src: '', cap: 'Photo 1' }, { src: '', cap: 'Photo 2' }, { src: '', cap: 'Photo 3' }, { src: '', cap: 'Photo 4' }, { src: '', cap: 'Photo 5' }, { src: '', cap: 'Photo 6' }], cols: 3, ratio: '1/1', layout: 'grid', lightbox: '1' },
		fields: [{ k: 'items', l: 'Pictures', t: 'items', sub: [{ k: 'src', l: 'Picture', t: 'image' }, { k: 'cap', l: 'Caption', t: 'text' }], title: 'cap' }, { k: 'layout', l: 'Layout', t: 'select', o: [['grid', 'Even grid'], ['masonry', 'Masonry']] }, { k: 'cols', l: 'Columns', t: 'num', u: '' }, { k: 'ratio', l: 'Shape', t: 'select', o: [['1/1', 'Square'], ['4/3', '4:3'], ['16/9', 'Wide'], ['3/4', 'Portrait']] }, { k: 'lightbox', l: 'Open full screen on click', t: 'toggle' }],
		style: { gg: 10, gr: 12 },
		styleFields: [{ k: 'gg', l: 'Gap', t: 'num', u: 'px' }, { k: 'gr', l: 'Rounded corners', t: 'num', u: 'px' }].concat(SPACE),
		render: function (n) {
			var p = n.props, s = n.style || {};
			return '<div class="pl-gallery' + (p.layout === 'masonry' ? ' pl-masonry' : '') + '"' + (p.lightbox ? ' data-lightbox' : '') + ' style="--gc:' + (+p.cols || 3) + ';--ga:' + esc(p.ratio || '1/1') + ';--gg:' + (s.gg || 10) + 'px;--gr:' + (s.gr === undefined ? 12 : s.gr) + 'px">' +
				items(n).map(function (it, i) { var src = url(it.src) || ph(it.cap || 'Photo ' + (i + 1), ['#1e3a8a', '#7c3aed', '#0f766e', '#be123c'][i % 4], '#f59e0b'); return '<a href="' + esc(src) + '" data-full="' + esc(src) + '" data-cap="' + esc(it.cap || '') + '">' + img(src, it.cap) + '</a>'; }).join('') + '</div>';
		}
	});
	def('compare', {
		label: 'Before & after', group: 'media', icon: 'columns',
		props: { before: '', after: '', bl: 'Before', al: 'After' },
		fields: [{ k: 'before', l: 'Before picture', t: 'image' }, { k: 'after', l: 'After picture', t: 'image' }, { k: 'bl', l: 'Before label', t: 'text' }, { k: 'al', l: 'After label', t: 'text' }],
		styleFields: SPACE,
		render: function (n) { var p = n.props; return '<div class="pl-compare" data-compare>' + img(p.before || ph('Before', '#475569', '#94a3b8'), p.bl) + '<div class="pl-after">' + img(p.after || ph('After', '#1d4ed8', '#22c55e'), p.al) + '</div><span class="pl-lab" style="left:12px">' + esc(p.bl) + '</span><span class="pl-lab" style="right:12px">' + esc(p.al) + '</span><span class="pl-knob" aria-hidden="true">&#8596;</span><input type="range" min="0" max="100" value="50" aria-label="Compare before and after"></div>'; }
	});
	def('videobox', {
		label: 'Video pop-up', group: 'media', icon: 'video',
		props: { src: '', url: 'https://www.youtube.com/watch?v=ysz5S6PUM-U', label: 'Watch the video' },
		fields: [{ k: 'src', l: 'Cover picture', t: 'image' }, { k: 'url', l: 'YouTube or Vimeo link', t: 'url' }, { k: 'label', l: 'Label', t: 'text' }],
		style: { radius: 18 },
		styleFields: [{ k: 'radius', l: 'Rounded corners', t: 'num', u: 'px' }].concat(SPACE),
		render: function (n) {
			var u = String(n.props.url || ''), m, src = '';
			if ((m = u.match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([\w-]{11})/))) src = 'https://www.youtube-nocookie.com/embed/' + m[1];
			else if ((m = u.match(/vimeo\.com\/(\d+)/))) src = 'https://player.vimeo.com/video/' + m[1];
			return '<a href="' + esc(u) + '" data-video-lightbox="' + esc(src) + '" style="position:relative;display:block;border-radius:inherit;overflow:hidden">' + img(n.props.src || ph(n.props.label, '#0f172a', '#1d4ed8'), n.props.label) + '<span style="position:absolute;inset:0;display:grid;place-items:center;background:rgba(2,6,23,.25)"><span style="width:84px;height:84px;border-radius:50%;background:#fff;display:grid;place-items:center;color:#0f172a;box-shadow:0 0 0 12px rgba(255,255,255,.25)" data-fx-loop="pulse"><svg width="30" height="30" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg></span></span></a>';
		}
	});
	def('lottie', {
		label: 'Lottie animation', group: 'media', icon: 'bolt',
		props: { src: 'https://assets2.lottiefiles.com/packages/lf20_touohxv0.json', loop: '1', h: 320 },
		fields: [{ k: 'src', l: 'Lottie JSON link', t: 'url' }, { k: 'loop', l: 'Loop', t: 'toggle' }, { k: 'h', l: 'Height', t: 'num', u: 'px' }],
		styleFields: SPACE,
		render: function (n) { return '<div data-lottie="' + esc(url(n.props.src)) + '" data-loop="' + (n.props.loop ? '1' : '0') + '" style="height:' + (+n.props.h || 320) + 'px" aria-hidden="true"></div>'; }
	});
	def('blob', {
		label: 'Morphing shape', group: 'media', icon: 'leaf',
		props: { src: '', c1: '#2563eb', c2: '#7c3aed' },
		fields: [{ k: 'src', l: 'Picture inside (optional)', t: 'image' }, CL('c1', 'Colour 1'), CL('c2', 'Colour 2')],
		styleFields: SPACE,
		render: function (n) { var p = n.props; return '<div class="pl-blob" style="--bl:' + (p.src ? 'url(&quot;' + esc(url(p.src)) + '&quot;)' : 'linear-gradient(135deg,' + esc(p.c1) + ',' + esc(p.c2) + ')') + '" role="img" aria-label="Decorative shape"></div>'; }
	});
	def('svgdraw', {
		label: 'Line drawing', group: 'media', icon: 'code',
		props: { code: '<svg viewBox="0 0 400 120" fill="none" stroke="#2563eb" stroke-width="4" stroke-linecap="round"><path d="M10 100 C 80 10, 160 10, 200 60 S 320 110, 390 20"/></svg>' },
		fields: [{ k: 'code', l: 'SVG code (lines draw themselves when scrolled into view)', t: 'code' }],
		styleFields: SPACE,
		render: function (n, ctx) { return '<div class="pl-draw" data-fx-in="fade" data-fx-dur="200">' + (ctx && ctx.editing ? C.inert(n.props.code) : String(n.props.code || '')) + '</div>'; }
	});
	def('flipbook', {
		label: 'PDF / flipbook', group: 'media', icon: 'book',
		props: { src: '', h: 620, title: 'Brochure' },
		fields: [{ k: 'src', l: 'PDF or flipbook link', t: 'url' }, { k: 'title', l: 'Title', t: 'text' }, { k: 'h', l: 'Height', t: 'num', u: 'px' }],
		styleFields: SPACE,
		render: function (n) { var s = url(n.props.src); return '<div class="pl-flipbook" style="--fbh:' + (+n.props.h || 620) + 'px">' + (s ? '<iframe src="' + esc(s) + '" title="' + esc(n.props.title) + '" loading="lazy"></iframe>' : '<div style="padding:60px;color:#cbd5e1;text-align:center">Paste a PDF or flipbook link</div>') + '</div>'; }
	});

	/* ---------------- sliders */
	def('heroslider', {
		label: 'Hero carousel', group: 'slider', icon: 'image',
		props: { effect: 'fade', auto: 6000, h: 78, items: [
			{ kick: 'Pentarch Training Institute', title: 'Practical skills for real careers', text: 'Short professional courses taught by people who do the work.', btn: 'View courses', href: '#courses', btn2: 'Talk to us', href2: '#contact', src: '' },
			{ kick: 'New intake', title: 'Learn AI animation in five days', text: 'Create explainer videos and stories for brands and NGOs.', btn: 'Register now', href: '#register', btn2: '', href2: '', src: '' },
			{ kick: 'For organisations', title: 'Training designed around your team', text: 'Tailored programmes delivered at your offices or online.', btn: 'Request a proposal', href: '#contact', btn2: '', href2: '', src: '' }] },
		fields: [{ k: 'items', l: 'Slides', t: 'items', title: 'title', sub: [{ k: 'src', l: 'Background picture', t: 'image' }, { k: 'kick', l: 'Small heading', t: 'text' }, { k: 'title', l: 'Heading', t: 'text' }, { k: 'text', l: 'Text', t: 'textarea' }, { k: 'btn', l: 'Button', t: 'text' }, { k: 'href', l: 'Button link', t: 'url' }, { k: 'btn2', l: 'Second button', t: 'text' }, { k: 'href2', l: 'Second button link', t: 'url' }] },
			{ k: 'effect', l: 'Transition', t: 'select', o: [['fade', 'Fade'], ['zoom', 'Zoom (Ken Burns)'], ['slide', 'Slide'], ['cube', '3D cube'], ['flip', '3D flip']] }, { k: 'auto', l: 'Autoplay every (ms, 0 = off)', t: 'num', u: '' }, { k: 'h', l: 'Height (% of screen)', t: 'num', u: 'vh' }],
		styleFields: [CL('hk', 'Small heading colour')].concat(SPACE),
		render: function (n) {
			var p = n.props, cols = ['#0f172a', '#1e3a8a', '#4c1d95', '#134e4a'];
			return '<div class="pl-slider" data-slider data-effect="' + esc(p.effect) + '" data-auto="' + (+p.auto || 0) + '" style="--hh:' + (+p.h || 78) + 'vh;--hk:' + esc((n.style || {}).hk || '#fbbf24') + '"><div class="pl-slides">' + items(n).map(function (s, i) {
				var bg = url(s.src) || ph('', cols[i % 4], '#2563eb');
				return '<div class="pl-hero-slide" style="background-image:url(&quot;' + esc(bg) + '&quot;)"><div class="pl-hero-in">' + (s.kick ? '<span class="pl-kick">' + esc(s.kick) + '</span>' : '') + '<h2>' + esc(s.title) + '</h2>' + (s.text ? '<p>' + esc(s.text) + '</p>' : '') + '<div style="display:flex;gap:12px;flex-wrap:wrap">' + (s.btn ? link(s.href, esc(s.btn), 'pl-btn') : '') + (s.btn2 ? link(s.href2, esc(s.btn2), 'pl-btn', ' style="background:transparent;border:2px solid #fff"') : '') + '</div></div></div>';
			}).join('') + '</div><button type="button" class="pl-prev" aria-label="Previous slide">&#8249;</button><button type="button" class="pl-next" aria-label="Next slide">&#8250;</button><div class="pl-dots"></div></div>';
		}
	});
	def('carousel', {
		label: 'Content carousel', group: 'slider', icon: 'columns',
		props: { per: 3, auto: 4500, effect: 'slide', items: [{ src: '', title: 'Course one', text: 'Short description.', href: '#' }, { src: '', title: 'Course two', text: 'Short description.', href: '#' }, { src: '', title: 'Course three', text: 'Short description.', href: '#' }, { src: '', title: 'Course four', text: 'Short description.', href: '#' }] },
		fields: [{ k: 'items', l: 'Cards', t: 'items', title: 'title', sub: [{ k: 'src', l: 'Picture', t: 'image' }, { k: 'title', l: 'Title', t: 'text' }, { k: 'text', l: 'Text', t: 'textarea' }, { k: 'href', l: 'Link', t: 'url' }] }, { k: 'per', l: 'Cards visible on desktop', t: 'num', u: '' }, { k: 'effect', l: 'Transition', t: 'select', o: [['slide', 'Slide'], ['fade', 'Fade'], ['cube', '3D cube']] }, { k: 'auto', l: 'Autoplay every (ms, 0 = off)', t: 'num', u: '' }],
		styleFields: SPACE,
		render: function (n) {
			var p = n.props;
			return '<div class="pl-slider pl-dark-dots" data-slider data-effect="' + esc(p.effect) + '" data-per="' + (+p.per || 3) + '" data-auto="' + (+p.auto || 0) + '" style="--gap:10px;padding-bottom:44px"><div class="pl-slides">' + items(n).map(function (c, i) {
				return '<div><article class="ple-card" style="background:#fff;border-radius:16px;box-shadow:0 10px 30px rgba(15,23,42,.1)">' + img(url(c.src) || ph(c.title, ['#7c3aed', '#0f766e', '#be123c', '#1d4ed8'][i % 4], '#f59e0b'), c.title) + '<div class="ple-card-b"><h3>' + esc(c.title) + '</h3><p>' + esc(c.text) + '</p>' + (c.href ? link(c.href, 'Learn more &rarr;', 'ple-card-a') : '') + '</div></article></div>';
			}).join('') + '</div><button type="button" class="pl-prev" aria-label="Previous">&#8249;</button><button type="button" class="pl-next" aria-label="Next">&#8250;</button><div class="pl-dots"></div></div>';
		}
	});
	def('testimonials', {
		label: 'Testimonials', group: 'slider', icon: 'users',
		props: { auto: 6000, per: 2, items: [{ quote: 'The course changed how I work. I now design websites for three local businesses.', name: 'Achieng Otieno', role: 'Web designer, Kisumu', src: '' }, { quote: 'Practical, friendly and well organised. Highly recommended.', name: 'Brian Mwangi', role: 'Communications officer', src: '' }, { quote: 'I could learn on my phone in the evenings.', name: 'Faith Wanjiku', role: 'Student', src: '' }] },
		fields: [{ k: 'items', l: 'Testimonials', t: 'items', title: 'name', sub: [{ k: 'quote', l: 'Quote', t: 'textarea' }, { k: 'name', l: 'Name', t: 'text' }, { k: 'role', l: 'Role or place', t: 'text' }, { k: 'src', l: 'Photo', t: 'image' }] }, { k: 'per', l: 'Visible on desktop', t: 'num', u: '' }, { k: 'auto', l: 'Autoplay every (ms, 0 = off)', t: 'num', u: '' }],
		styleFields: SPACE,
		render: function (n) {
			return '<div class="pl-slider pl-dark-dots" data-slider data-effect="slide" data-per="' + (+n.props.per || 1) + '" data-auto="' + (+n.props.auto || 0) + '" style="--gap:10px;padding:8px 0 46px"><div class="pl-slides">' + items(n).map(function (t) {
				return '<div><figure class="pl-quote" style="margin:0"><div class="pl-stars">\u2605\u2605\u2605\u2605\u2605</div><blockquote>\u201c' + esc(t.quote) + '\u201d</blockquote><footer>' + (t.src ? img(t.src, t.name) : '') + '<div><cite>' + esc(t.name) + '</cite><small>' + esc(t.role) + '</small></div></footer></figure></div>';
			}).join('') + '</div><div class="pl-dots"></div></div>';
		}
	});
	def('logos', {
		label: 'Logo carousel', group: 'slider', icon: 'award',
		props: { speed: 30, items: [{ src: '', alt: 'Partner 1', href: '' }, { src: '', alt: 'Partner 2', href: '' }, { src: '', alt: 'Partner 3', href: '' }, { src: '', alt: 'Partner 4', href: '' }, { src: '', alt: 'Partner 5', href: '' }] },
		fields: [{ k: 'items', l: 'Logos', t: 'items', title: 'alt', sub: [{ k: 'src', l: 'Logo', t: 'image' }, { k: 'alt', l: 'Organisation name', t: 'text' }, { k: 'href', l: 'Link (optional)', t: 'url' }] }, { k: 'speed', l: 'Speed (seconds per loop)', t: 'num', u: 's' }],
		styleFields: [{ k: 'lh', l: 'Logo height', t: 'num', u: 'px' }].concat(SPACE),
		render: function (n) {
			var one = items(n).map(function (l) { var im = img(url(l.src) || ph(l.alt, '#94a3b8', '#cbd5e1'), l.alt); return l.href ? link(l.href, im, '', ' target="_blank" rel="noopener"') : '<span>' + im + '</span>'; }).join('');
			return '<div class="pl-marquee" style="--ms:' + (+n.props.speed || 30) + 's;--lh:' + ((n.style || {}).lh || 46) + 'px"><div class="pl-mq-t">' + one + one.replace(/<img /g, '<img aria-hidden="true" ') + '</div></div>';
		}
	});
	def('marquee', {
		label: 'Scrolling text', group: 'slider', icon: 'arrow',
		props: { text: 'Web design \u2022 Data analysis \u2022 AI animation \u2022 Public relations \u2022 Research', speed: 25, reverse: '' },
		fields: [{ k: 'text', l: 'Text', t: 'textarea' }, { k: 'speed', l: 'Speed (seconds per loop)', t: 'num', u: 's' }, { k: 'reverse', l: 'Scroll the other way', t: 'toggle' }],
		style: { size: 42, weight: '800' },
		styleFields: TXT.concat(BOX),
		render: function (n) { var t = '<span>' + esc(n.props.text) + '</span>'; return '<div class="pl-marquee' + (n.props.reverse ? ' pl-mq-rev' : '') + '" style="--ms:' + (+n.props.speed || 25) + 's"><div class="pl-mq-t" style="white-space:nowrap">' + t + t.replace('<span>', '<span aria-hidden="true">') + '</div></div>'; }
	});

	/* ---------------- interactive */
	def('tabs', {
		label: 'Tabs', group: 'interactive', icon: 'rows',
		props: { look: 'line', items: [{ title: 'Overview', html: '<p>What the course covers and who it is for.</p>' }, { title: 'Schedule', html: '<p>Five days, 9am to 4pm.</p>' }, { title: 'Fees', html: '<p>KSh 25,000 including materials.</p>' }] },
		fields: [{ k: 'items', l: 'Tabs', t: 'items', title: 'title', sub: [{ k: 'title', l: 'Tab title', t: 'text' }, { k: 'html', l: 'Content', t: 'html' }] }, { k: 'look', l: 'Style', t: 'select', o: [['line', 'Underline'], ['pills', 'Pills']] }],
		styleFields: SPACE,
		render: function (n) { var id = uidv(n); return '<div class="pl-tabs' + (n.props.look === 'pills' ? ' pl-pills' : '') + '" data-tabs><div role="tablist">' + items(n).map(function (t, i) { return '<button type="button" role="tab" id="' + id + 't' + i + '" aria-controls="' + id + 'p' + i + '" aria-selected="' + (i ? 'false' : 'true') + '">' + esc(t.title) + '</button>'; }).join('') + '</div>' + items(n).map(function (t, i) { return '<div role="tabpanel" id="' + id + 'p' + i + '" aria-labelledby="' + id + 't' + i + '"' + (i ? ' hidden' : '') + '>' + C.inert(t.html || '') + '</div>'; }).join('') + '</div>'; }
	});
	def('accordion', {
		label: 'Accordion / FAQ', group: 'interactive', icon: 'list',
		props: { faq: '1', one: '1', items: [{ q: 'Do I need a laptop?', a: 'No. You can learn and build on your phone.' }, { q: 'How long is the course?', a: 'Most learners finish in four to six weeks.' }, { q: 'Do I get a certificate?', a: 'Yes, once you complete every lesson.' }] },
		fields: [{ k: 'items', l: 'Questions', t: 'items', title: 'q', sub: [{ k: 'q', l: 'Question / title', t: 'text' }, { k: 'a', l: 'Answer', t: 'textarea' }] }, { k: 'one', l: 'Only one open at a time', t: 'toggle' }, { k: 'faq', l: 'Mark up as FAQ for Google', t: 'toggle' }],
		styleFields: SPACE,
		render: function (n) {
			var id = uidv(n), its = items(n);
			var ld = n.props.faq ? '<script type="application/ld+json">' + JSON.stringify({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: its.map(function (i) { return { '@type': 'Question', name: i.q, acceptedAnswer: { '@type': 'Answer', text: i.a } }; }) }).replace(/</g, '\\u003c') + '</script>' : '';
			return '<div class="pl-acc">' + its.map(function (i, k) { return '<details' + (n.props.one ? ' data-acc-group="' + id + '"' : '') + (k ? '' : ' open') + '><summary>' + esc(i.q) + '</summary><div class="pl-acc-b">' + esc(i.a).replace(/\n/g, '<br>') + '</div></details>'; }).join('') + '</div>' + ld;
		}
	});
	def('flipbox', {
		label: 'Flip box', group: 'interactive', icon: 'columns',
		props: { icon: 'bolt', ftitle: 'Fast results', ftext: 'Hover or tap to learn more', src: '', btitle: 'How it works', btext: 'Two short sentences that explain the benefit.', btn: 'Learn more', href: '#', h: 280 },
		fields: [{ k: 'icon', l: 'Front icon', t: 'icon' }, { k: 'ftitle', l: 'Front title', t: 'text' }, { k: 'ftext', l: 'Front text', t: 'text' }, { k: 'src', l: 'Front background picture (optional)', t: 'image' }, { k: 'btitle', l: 'Back title', t: 'text' }, { k: 'btext', l: 'Back text', t: 'textarea' }, { k: 'btn', l: 'Back button', t: 'text' }, { k: 'href', l: 'Button link', t: 'url' }, { k: 'h', l: 'Height', t: 'num', u: 'px' }],
		style: { ff: '#1d4ed8', fb: '#0f172a' },
		styleFields: [CL('ff', 'Front colour'), CL('fb', 'Back colour')].concat(SPACE),
		render: function (n) { var p = n.props, s = n.style || {}; return '<div class="pl-flip" tabindex="0" style="--fh:' + (+p.h || 280) + 'px;--ff:' + esc(s.ff || '#1d4ed8') + ';--fb:' + esc(s.fb || '#0f172a') + '"><div class="pl-flip-in"><div class="pl-flip-f"' + (p.src ? ' style="background-image:linear-gradient(rgba(0,0,0,.45),rgba(0,0,0,.45)),url(&quot;' + esc(url(p.src)) + '&quot;)"' : '') + '>' + icon(p.icon, 42) + '<h3 style="margin:12px 0 4px;color:#fff">' + esc(p.ftitle) + '</h3><p style="margin:0;opacity:.85">' + esc(p.ftext) + '</p></div><div class="pl-flip-b"><h3 style="margin:0 0 8px;color:#fff">' + esc(p.btitle) + '</h3><p style="opacity:.9">' + esc(p.btext) + '</p>' + (p.btn ? link(p.href, esc(p.btn), 'pl-btn') : '') + '</div></div></div>'; }
	});
	def('popup', {
		label: 'Pop-up', group: 'interactive', icon: 'bolt',
		props: { pid: 'offer', trigger: 'load', delay: 6, once: '1', title: 'Early-bird discount', text: 'Register this week and save 15% on any course.', btn: 'Register now', href: '#register', src: '' },
		fields: [{ k: 'pid', l: 'Pop-up name (link to it with #name)', t: 'text' }, { k: 'trigger', l: 'Show when', t: 'select', o: [['load', 'After a delay'], ['scroll', 'After scrolling (%)'], ['exit', 'Visitor is about to leave'], ['click', 'Only when a #link is clicked']] }, { k: 'delay', l: 'Delay (seconds) or scroll %', t: 'num', u: '' }, { k: 'once', l: 'Show once per visit', t: 'toggle' }, { k: 'src', l: 'Picture (optional)', t: 'image' }, { k: 'title', l: 'Title', t: 'text' }, { k: 'text', l: 'Text', t: 'textarea' }, { k: 'btn', l: 'Button', t: 'text' }, { k: 'href', l: 'Button link', t: 'url' }],
		styleFields: [],
		render: function (n, ctx) {
			var p = n.props, id = String(p.pid || 'popup').replace(/[^\w-]/g, '');
			var inner = (p.src ? img(p.src, p.title, '') : '') + '<h3 style="margin:14px 0 8px;font-size:26px">' + esc(p.title) + '</h3><p>' + esc(p.text) + '</p>' + (p.btn ? link(p.href, esc(p.btn), 'pl-btn') : '');
			if (ctx && ctx.editing) return '<div style="border:2px dashed #a78bfa;border-radius:14px;padding:16px;background:#faf5ff;font:14px system-ui;color:#4c1d95"><b>Pop-up \u201c' + esc(id) + '\u201d</b> (hidden on the live page; shows ' + ({ load: 'after ' + p.delay + 's', scroll: 'after ' + p.delay + '% scroll', exit: 'when leaving', click: 'when #' + id + ' is clicked' })[p.trigger] + ')<div style="background:#fff;border-radius:12px;padding:16px;margin-top:10px;color:#0f172a">' + inner + '</div></div>';
			return '<template id="' + esc(id) + '" data-popup="' + esc(p.trigger) + '" data-popup-delay="' + (+p.delay || 0) + '" data-popup-once="' + (p.once ? 1 : 0) + '">' + inner + '</template>';
		}
	});
	def('countdown', {
		label: 'Countdown', group: 'interactive', icon: 'clock',
		props: { date: new Date(Date.now() + 864e6).toISOString().slice(0, 16), done: 'Registration is now closed.' },
		fields: [{ k: 'date', l: 'Count down to (date and time)', t: 'text' }, { k: 'done', l: 'Message when finished', t: 'text' }],
		style: { cdbg: '#0f172a' },
		styleFields: [CL('cdbg', 'Box colour')].concat(SPACE),
		render: function (n) { return '<div class="pl-cd" data-countdown="' + esc(n.props.date) + '" style="--cdbg:' + esc((n.style || {}).cdbg || '#0f172a') + '" role="timer"><div><b data-cd="d">0</b><small>Days</small></div><div><b data-cd="h">00</b><small>Hours</small></div><div><b data-cd="m">00</b><small>Minutes</small></div><div><b data-cd="s">00</b><small>Seconds</small></div></div>'; }
	});
	def('counter', {
		label: 'Counter', group: 'interactive', icon: 'chart',
		props: { num: 1200, prefix: '', suffix: '+', label: 'Students trained', dur: 1800 },
		fields: [{ k: 'num', l: 'Number', t: 'num', u: '' }, { k: 'prefix', l: 'Before (e.g. KSh)', t: 'text' }, { k: 'suffix', l: 'After (e.g. + or %)', t: 'text' }, { k: 'label', l: 'Label', t: 'text' }, { k: 'dur', l: 'Count time (ms)', t: 'num', u: '' }],
		styleFields: TXT.concat(BOX),
		render: function (n) { var p = n.props; return '<div class="pl-counter"><div class="pl-num">' + esc(p.prefix) + '<span data-count="' + (+p.num || 0) + '" data-count-dur="' + (+p.dur || 1800) + '">0</span>' + esc(p.suffix) + '</div><div class="pl-cl">' + esc(p.label) + '</div></div>'; }
	});
	def('stats', {
		label: 'Stats band', group: 'interactive', icon: 'chart',
		props: { items: [{ num: 12, suf: '', label: 'Courses' }, { num: 1500, suf: '+', label: 'Graduates' }, { num: 98, suf: '%', label: 'Would recommend' }, { num: 40, suf: '+', label: 'Partner organisations' }] },
		fields: [{ k: 'items', l: 'Numbers', t: 'items', title: 'label', sub: [{ k: 'num', l: 'Number', t: 'num', u: '' }, { k: 'suf', l: 'After the number', t: 'text' }, { k: 'label', l: 'Label', t: 'text' }] }],
		styleFields: BOX,
		render: function (n) { return '<div class="pl-stats" style="--sc:' + Math.min(4, items(n).length || 1) + '">' + items(n).map(function (s) { return '<div class="pl-counter"><div class="pl-num"><span data-count="' + (+s.num || 0) + '">0</span>' + esc(s.suf) + '</div><div class="pl-cl">' + esc(s.label) + '</div></div>'; }).join('') + '</div>'; }
	});
	def('progress', {
		label: 'Progress bars', group: 'interactive', icon: 'chart',
		props: { items: [{ label: 'Practical work', val: 80 }, { label: 'Theory', val: 20 }] },
		fields: [{ k: 'items', l: 'Bars', t: 'items', title: 'label', sub: [{ k: 'label', l: 'Label', t: 'text' }, { k: 'val', l: 'Percentage', t: 'num', u: '%' }] }],
		styleFields: SPACE,
		render: function (n) { return items(n).map(function (b) { return '<div class="pl-bar"><div class="pl-bar-h"><span>' + esc(b.label) + '</span><span>' + (+b.val || 0) + '%</span></div><div class="pl-bar-t" role="progressbar" aria-valuenow="' + (+b.val || 0) + '" aria-valuemin="0" aria-valuemax="100"><div class="pl-bar-f" data-bar="' + Math.min(100, +b.val || 0) + '"></div></div></div>'; }).join(''); }
	});
	def('typing', {
		label: 'Typing headline', group: 'interactive', icon: 'type',
		props: { before: 'We train', words: 'web designers\ndata analysts\nanimators\ncommunicators', after: '', tag: 'h2' },
		fields: [{ k: 'before', l: 'Text before', t: 'text' }, { k: 'words', l: 'Changing words (one per line)', t: 'textarea' }, { k: 'after', l: 'Text after', t: 'text' }, { k: 'tag', l: 'Level', t: 'select', o: [['h1', 'H1'], ['h2', 'H2'], ['h3', 'H3'], ['p', 'Paragraph']] }],
		style: { size: 44, weight: '800' },
		styleFields: [CL('ac', 'Changing word colour')].concat(TXT, BOX),
		render: function (n) { var p = n.props, t = /^(h[1-3]|p)$/.test(p.tag) ? p.tag : 'h2', w = lines(p.words); return '<' + t + ' class="ple-h" style="margin:0">' + esc(p.before) + ' <span data-type-words="' + esc(w.join('|')) + '" style="color:' + esc((n.style || {}).ac || 'var(--pa,#2563eb)') + ';border-right:3px solid currentColor;padding-right:2px">' + esc(w[0] || '') + '</span> ' + esc(p.after) + '</' + t + '>'; }
	});
	def('hotspots', {
		label: 'Image hotspots', group: 'interactive', icon: 'pin',
		props: { src: '', items: [{ x: 30, y: 40, title: 'Reception', text: 'Open 8am to 6pm, Monday to Saturday.' }, { x: 65, y: 60, title: 'Computer lab', text: '40 computers and fast Wi-Fi.' }] },
		fields: [{ k: 'src', l: 'Picture', t: 'image' }, { k: 'items', l: 'Hotspots', t: 'items', title: 'title', sub: [{ k: 'x', l: 'Across (%)', t: 'num', u: '%' }, { k: 'y', l: 'Down (%)', t: 'num', u: '%' }, { k: 'title', l: 'Title', t: 'text' }, { k: 'text', l: 'Text', t: 'textarea' }] }],
		styleFields: SPACE,
		render: function (n) { return '<div class="pl-hotspots">' + img(n.props.src || ph('Your picture', '#0f766e', '#38bdf8'), 'Image with hotspots') + items(n).map(function (h, i) { return '<div class="pl-hs" style="left:' + (+h.x || 0) + '%;top:' + (+h.y || 0) + '%"><button type="button" class="pl-hs-dot" aria-label="' + esc(h.title) + '">' + (i + 1) + '</button><div class="pl-hs-tip"><b>' + esc(h.title) + '</b><div>' + esc(h.text) + '</div></div></div>'; }).join('') + '</div>'; }
	});
	def('toc', {
		label: 'Table of contents', group: 'interactive', icon: 'list',
		props: { title: 'On this page' }, fields: [{ k: 'title', l: 'Title', t: 'text' }], styleFields: SPACE,
		render: function (n) { return '<nav class="pl-toc" data-toc="body" aria-label="' + esc(n.props.title) + '"><b>' + esc(n.props.title) + '</b><ol></ol></nav>'; }
	});
	def('share', {
		label: 'Share buttons', group: 'interactive', icon: 'globe',
		props: { nets: 'whatsapp\nfacebook\nlinkedin\nx\nemail\ncopy' },
		fields: [{ k: 'nets', l: 'Networks (whatsapp, facebook, linkedin, x, email, copy)', t: 'textarea' }], styleFields: SPACE,
		render: function (n) { var L = { whatsapp: 'WhatsApp', facebook: 'Facebook', linkedin: 'LinkedIn', x: 'X', email: 'Email', copy: 'Copy link' }; return '<div class="pl-share">' + lines(n.props.nets).map(function (k) { k = k.toLowerCase(); return L[k] ? '<a href="#" data-share="' + k + '" target="_blank" rel="noopener">' + L[k] + '</a>' : ''; }).join('') + '</div>'; }
	});

	/* ---------------- business */
	def('pricing', {
		label: 'Pricing table', group: 'business', icon: 'cart',
		props: { title: 'Standard', price: 'KSh 25,000', period: 'per course', feats: 'Five days of training\nCourse materials\nCertificate\nOne month of support', btn: 'Enrol now', href: '#register', badge: '', hot: '' },
		fields: [{ k: 'title', l: 'Plan name', t: 'text' }, { k: 'price', l: 'Price', t: 'text' }, { k: 'period', l: 'Period', t: 'text' }, { k: 'feats', l: 'Features (one per line)', t: 'textarea' }, { k: 'btn', l: 'Button', t: 'text' }, { k: 'href', l: 'Button link', t: 'url' }, { k: 'badge', l: 'Badge (e.g. Most popular)', t: 'text' }, { k: 'hot', l: 'Highlight this plan', t: 'toggle' }],
		styleFields: SPACE,
		render: function (n) { var p = n.props; return '<div class="pl-price' + (p.hot ? ' hot' : '') + '">' + (p.badge ? '<span class="pl-badge">' + esc(p.badge) + '</span>' : '') + '<h3>' + esc(p.title) + '</h3><div class="pl-amt">' + esc(p.price) + ' <small>' + esc(p.period) + '</small></div><ul>' + lines(p.feats).map(function (f) { return '<li>' + esc(f) + '</li>'; }).join('') + '</ul>' + (p.btn ? link(p.href, esc(p.btn), 'pl-btn', ' style="justify-content:center"') : '') + '</div>'; }
	});
	def('pricelist', {
		label: 'Price list', group: 'business', icon: 'list',
		props: { items: [{ name: 'Haircut', desc: 'Wash, cut and style', price: 'KSh 500' }, { name: 'Braids', desc: 'Medium length', price: 'KSh 2,500' }, { name: 'Manicure', desc: '', price: 'KSh 800' }] },
		fields: [{ k: 'items', l: 'Items', t: 'items', title: 'name', sub: [{ k: 'name', l: 'Name', t: 'text' }, { k: 'desc', l: 'Description', t: 'text' }, { k: 'price', l: 'Price', t: 'text' }] }],
		styleFields: BOX,
		render: function (n) { return '<ul class="pl-plist">' + items(n).map(function (i) { return '<li><div><b>' + esc(i.name) + '</b>' + (i.desc ? '<small>' + esc(i.desc) + '</small>' : '') + '</div><span class="pl-dots-line"></span><b>' + esc(i.price) + '</b></li>'; }).join('') + '</ul>'; }
	});
	def('team', {
		label: 'Team member', group: 'business', icon: 'users',
		props: { src: '', name: 'Full name', role: 'Job title', bio: 'Two or three sentences about experience and what this person does.', email: '', linkedin: '' },
		fields: [{ k: 'src', l: 'Photo', t: 'image' }, { k: 'name', l: 'Name', t: 'text' }, { k: 'role', l: 'Role', t: 'text' }, { k: 'bio', l: 'Biography (opens in a pop-up)', t: 'textarea' }, { k: 'email', l: 'Email', t: 'text' }, { k: 'linkedin', l: 'LinkedIn link', t: 'url' }],
		styleFields: SPACE,
		render: function (n) { var p = n.props, id = 'bio' + n.id; return '<div class="pl-team">' + img(p.src || ph(p.name, '#334155', '#64748b'), p.name) + '<h3>' + esc(p.name) + '</h3><div class="pl-role">' + esc(p.role) + '</div>' + (p.bio ? '<a href="#' + id + '" class="pl-more" data-modal-src="' + id + '">Read profile</a><template id="' + id + '"><div style="display:grid;grid-template-columns:120px 1fr;gap:18px;align-items:start">' + img(p.src || ph(p.name, '#334155', '#64748b'), p.name, '') + '<div><h3 style="margin:0">' + esc(p.name) + '</h3><div class="pl-role" style="color:var(--pa,#2563eb);font-weight:600">' + esc(p.role) + '</div><p>' + esc(p.bio).replace(/\n/g, '<br>') + '</p>' + (p.email ? '<p><a href="mailto:' + esc(p.email) + '">' + esc(p.email) + '</a></p>' : '') + (p.linkedin ? '<p><a href="' + esc(url(p.linkedin)) + '" target="_blank" rel="noopener">LinkedIn</a></p>' : '') + '</div></div></template>' : '') + '</div>'; }
	});
	def('ctabox', {
		label: 'Call-to-action box', group: 'business', icon: 'arrow',
		props: { title: 'Ready to start?', text: 'Talk to our admissions team today.', btn: 'Chat on WhatsApp', href: 'https://wa.me/254700000000' },
		fields: [{ k: 'title', l: 'Title', t: 'text' }, { k: 'text', l: 'Text', t: 'textarea' }, { k: 'btn', l: 'Button', t: 'text' }, { k: 'href', l: 'Button link', t: 'url' }],
		style: { c1: '#1d4ed8', c2: '#7c3aed' },
		styleFields: [CL('c1', 'Colour 1'), CL('c2', 'Colour 2')].concat(SPACE),
		render: function (n) { var p = n.props, s = n.style || {}; return '<div class="pl-cta" style="--c1:' + esc(s.c1 || '#1d4ed8') + ';--c2:' + esc(s.c2 || '#7c3aed') + '"><div><h3>' + esc(p.title) + '</h3><p>' + esc(p.text) + '</p></div>' + link(p.href, esc(p.btn), 'pl-btn', /wa\.me|^https?:/.test(p.href) ? ' target="_blank" rel="noopener"' : '') + '</div>'; }
	});
	def('timeline', {
		label: 'Timeline', group: 'business', icon: 'clock',
		props: { items: [{ date: '2019', title: 'Founded', text: 'Started with one classroom in Nairobi.' }, { date: '2022', title: 'First 500 graduates', text: 'Expanded to online learning.' }, { date: '2026', title: 'PLE Studio launched', text: 'Learning on any phone.' }] },
		fields: [{ k: 'items', l: 'Events', t: 'items', title: 'title', sub: [{ k: 'date', l: 'Date', t: 'text' }, { k: 'title', l: 'Title', t: 'text' }, { k: 'text', l: 'Text', t: 'textarea' }] }],
		styleFields: BOX,
		render: function (n) { return '<div class="pl-tl">' + items(n).map(function (e, i) { return '<div class="pl-tl-i" data-fx-in="fade-left" data-fx-delay="' + (i * 120) + '"><small>' + esc(e.date) + '</small><h4>' + esc(e.title) + '</h4><p style="margin:0;opacity:.8">' + esc(e.text) + '</p></div>'; }).join('') + '</div>'; }
	});
	def('journey', {
		label: 'Journey / steps', group: 'business', icon: 'arrow',
		props: { items: [{ icon: 'mail', title: 'Apply', text: 'Fill in a short form online.' }, { icon: 'phone', title: 'Talk to us', text: 'We call within a day.' }, { icon: 'book', title: 'Learn', text: 'Join classes in person or online.' }, { icon: 'award', title: 'Graduate', text: 'Get your certificate.' }] },
		fields: [{ k: 'items', l: 'Steps', t: 'items', title: 'title', sub: [{ k: 'icon', l: 'Icon', t: 'icon' }, { k: 'title', l: 'Title', t: 'text' }, { k: 'text', l: 'Text', t: 'textarea' }] }],
		styleFields: BOX,
		render: function (n) { return '<div class="pl-journey" style="--jc:' + Math.min(5, items(n).length || 1) + '">' + items(n).map(function (s, i) { return '<div data-fx-in="fade-up" data-fx-delay="' + (i * 150) + '"><div class="pl-jn">' + icon(s.icon, 26) + '</div><div><h4 style="margin:0 0 4px">' + esc(s.title) + '</h4><p style="margin:0;opacity:.8">' + esc(s.text) + '</p></div></div>'; }).join('') + '</div>'; }
	});
	def('intakes', {
		label: 'Intake calendar', group: 'business', icon: 'clock',
		props: { items: [{ date: new Date(Date.now() + 6048e5).toISOString().slice(0, 10), title: 'AI Animation Bootcamp', info: 'Full day \u00b7 10 places left', href: '#register' }, { date: new Date(Date.now() + 2592e6).toISOString().slice(0, 10), title: 'Web Design Foundations', info: 'Evenings \u00b7 4 weeks', href: '#register' }] },
		fields: [{ k: 'items', l: 'Intakes', t: 'items', title: 'title', sub: [{ k: 'date', l: 'Start date (YYYY-MM-DD)', t: 'text' }, { k: 'title', l: 'Course', t: 'text' }, { k: 'info', l: 'Details', t: 'text' }, { k: 'href', l: 'Register link', t: 'url' }] }],
		styleFields: SPACE,
		render: function (n) { var M = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']; return '<div class="pl-intake">' + items(n).map(function (i) { var d = new Date(i.date), ok = !isNaN(d); return '<div><div class="pl-date"><b>' + (ok ? d.getDate() : '?') + '</b>' + (ok ? M[d.getMonth()] + ' ' + d.getFullYear() : '') + '</div><div><b>' + esc(i.title) + '</b><div style="opacity:.75;font-size:.92em">' + esc(i.info) + '</div></div>' + (i.href ? link(i.href, 'Register', 'pl-btn') : '') + '</div>'; }).join('') + '</div>'; }
	});
	def('mpesa', {
		label: 'M-Pesa payment', group: 'business', icon: 'phone',
		props: { kind: 'paybill', biz: '247247', acc: 'YOUR NAME', amount: 'KSh 25,000', label: 'Pay with M-Pesa' },
		fields: [{ k: 'kind', l: 'Type', t: 'select', o: [['paybill', 'Paybill'], ['till', 'Buy Goods (Till)']] }, { k: 'biz', l: 'Paybill or Till number', t: 'text' }, { k: 'acc', l: 'Account number / reference', t: 'text' }, { k: 'amount', l: 'Amount', t: 'text' }, { k: 'label', l: 'Button label', t: 'text' }],
		styleFields: SPACE,
		render: function (n) { var p = n.props, id = 'mp' + n.id, steps = p.kind === 'till' ? ['Open M-Pesa, choose <b>Lipa na M-Pesa</b>', 'Choose <b>Buy Goods and Services</b>', 'Till number: <b>' + esc(p.biz) + '</b>', 'Amount: <b>' + esc(p.amount) + '</b>', 'Enter your PIN and send'] : ['Open M-Pesa, choose <b>Lipa na M-Pesa</b>', 'Choose <b>Pay Bill</b>', 'Business number: <b>' + esc(p.biz) + '</b>', 'Account: <b>' + esc(p.acc) + '</b>', 'Amount: <b>' + esc(p.amount) + '</b>', 'Enter your PIN and send']; return '<a href="#' + id + '" class="pl-mpesa" data-modal-src="' + id + '">' + icon('phone', 22) + '<span>' + esc(p.label) + '<small>' + esc(p.amount) + '</small></span></a><template id="' + id + '"><h3 style="margin-top:0;color:#16a34a">Pay with M-Pesa</h3><ol style="line-height:1.9">' + steps.map(function (s) { return '<li>' + s + '</li>'; }).join('') + '</ol><p style="color:#64748b">You will receive an M-Pesa confirmation SMS. Keep it as your receipt.</p></template>'; }
	});
	def('booking', {
		label: 'Booking calendar', group: 'business', icon: 'clock',
		props: { src: '', h: 680 },
		fields: [{ k: 'src', l: 'Booking page link (Calendly, Google Calendar appointments, etc.)', t: 'url' }, { k: 'h', l: 'Height', t: 'num', u: 'px' }],
		styleFields: SPACE,
		render: function (n) { var s = url(n.props.src); return '<div class="pl-booking">' + (s ? '<iframe src="' + esc(s) + '" style="min-height:' + (+n.props.h || 680) + 'px" title="Book an appointment" loading="lazy"></iframe>' : '<div class="pl-alert info">Paste your booking page link in the settings.</div>') + '</div>'; }
	});

	/* ---------------- infographics and data */
	var PAL = ['#1d4ed8', '#7c3aed', '#0d9488', '#f59e0b', '#e11d48', '#0ea5e9', '#16a34a', '#475569'];
	def('chart', {
		label: 'Chart', group: 'data', icon: 'chart',
		props: { kind: 'bar', items: [{ label: '2023', val: 320, color: '' }, { label: '2024', val: 540, color: '' }, { label: '2025', val: 810, color: '' }, { label: '2026', val: 1200, color: '' }], unit: '' },
		fields: [{ k: 'kind', l: 'Chart type', t: 'select', o: [['bar', 'Bars'], ['hbar', 'Horizontal bars'], ['line', 'Line'], ['pie', 'Pie'], ['donut', 'Donut']] }, { k: 'items', l: 'Data', t: 'items', title: 'label', sub: [{ k: 'label', l: 'Label', t: 'text' }, { k: 'val', l: 'Value', t: 'num', u: '' }, { k: 'color', l: 'Colour (optional)', t: 'color' }] }, { k: 'unit', l: 'Unit (e.g. %)', t: 'text' }],
		styleFields: SPACE,
		render: function (n) {
			var it = items(n), kind = n.props.kind, unit = esc(n.props.unit || ''), max = Math.max.apply(0, it.map(function (i) { return +i.val || 0; }).concat([1]));
			var col = function (i, k) { return i.color || PAL[k % PAL.length]; };
			var svg = '';
			if (kind === 'pie' || kind === 'donut') {
				var tot = it.reduce(function (a, i) { return a + (+i.val || 0); }, 0) || 1, a0 = -Math.PI / 2, paths = '';
				it.forEach(function (i, k) { var a1 = a0 + (+i.val || 0) / tot * Math.PI * 2, x0 = 100 + 90 * Math.cos(a0), y0 = 100 + 90 * Math.sin(a0), x1 = 100 + 90 * Math.cos(a1), y1 = 100 + 90 * Math.sin(a1); paths += '<path d="M100 100L' + x0.toFixed(2) + ' ' + y0.toFixed(2) + 'A90 90 0 ' + (a1 - a0 > Math.PI ? 1 : 0) + ' 1 ' + x1.toFixed(2) + ' ' + y1.toFixed(2) + 'Z" fill="' + esc(col(i, k)) + '"><title>' + esc(i.label) + ': ' + esc(i.val) + unit + '</title></path>'; a0 = a1; });
				svg = '<svg viewBox="0 0 200 200" style="max-width:320px;display:block;margin:0 auto" role="img" aria-label="Pie chart">' + paths + (kind === 'donut' ? '<circle cx="100" cy="100" r="52" fill="#fff"/>' : '') + '</svg><div class="pl-legend">' + it.map(function (i, k) { return '<span><i style="background:' + esc(col(i, k)) + '"></i>' + esc(i.label) + ' (' + esc(i.val) + unit + ')</span>'; }).join('') + '</div>';
			} else if (kind === 'hbar') {
				svg = it.map(function (i, k) { return '<div class="pl-bar"><div class="pl-bar-h"><span>' + esc(i.label) + '</span><span>' + esc(i.val) + unit + '</span></div><div class="pl-bar-t"><div class="pl-bar-f" data-bar="' + (100 * (+i.val || 0) / max).toFixed(1) + '" style="background:' + esc(col(i, k)) + '"></div></div></div>'; }).join('');
			} else {
				var W = 600, H = 260, bw = W / Math.max(1, it.length);
				if (kind === 'line') {
					var pts = it.map(function (i, k) { return [(k + 0.5) * bw, H - (+i.val || 0) / max * (H - 30)]; });
					svg = '<svg viewBox="0 -10 ' + W + ' ' + (H + 40) + '" role="img" aria-label="Line chart"><polyline points="' + pts.map(function (p) { return p[0].toFixed(1) + ',' + p[1].toFixed(1); }).join(' ') + '" fill="none" stroke="' + esc(col(it[0] || {}, 0)) + '" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" class="pl-draw-line"/>' + pts.map(function (p, k) { return '<circle cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="6" fill="#fff" stroke="' + esc(col(it[0] || {}, 0)) + '" stroke-width="3"/><text class="lbl" x="' + p[0].toFixed(1) + '" y="' + (p[1] - 12).toFixed(1) + '" text-anchor="middle">' + esc(it[k].val) + unit + '</text><text class="lbl" x="' + p[0].toFixed(1) + '" y="' + (H + 22) + '" text-anchor="middle">' + esc(it[k].label) + '</text>'; }).join('') + '</svg>';
				} else {
					svg = '<svg viewBox="0 -10 ' + W + ' ' + (H + 40) + '" role="img" aria-label="Bar chart">' + it.map(function (i, k) { var h = (+i.val || 0) / max * (H - 30), x = k * bw + bw * 0.18; return '<rect class="bar" style="animation-delay:' + (k * 0.12) + 's" x="' + x.toFixed(1) + '" y="' + (H - h).toFixed(1) + '" width="' + (bw * 0.64).toFixed(1) + '" height="' + h.toFixed(1) + '" rx="8" fill="' + esc(col(i, k)) + '"><title>' + esc(i.label) + ': ' + esc(i.val) + unit + '</title></rect><text class="lbl" x="' + (k * bw + bw / 2).toFixed(1) + '" y="' + (H - h - 8).toFixed(1) + '" text-anchor="middle">' + esc(i.val) + unit + '</text><text class="lbl" x="' + (k * bw + bw / 2).toFixed(1) + '" y="' + (H + 22) + '" text-anchor="middle">' + esc(i.label) + '</text>'; }).join('') + '</svg>';
				}
			}
			return '<div class="pl-chart">' + svg + '</div>';
		}
	});
	def('pyramid', {
		label: 'Pyramid / funnel', group: 'data', icon: 'chart',
		props: { kind: 'pyramid', items: [{ label: 'Vision', color: '' }, { label: 'Strategy', color: '' }, { label: 'Programmes', color: '' }, { label: 'Activities', color: '' }] },
		fields: [{ k: 'kind', l: 'Shape', t: 'select', o: [['pyramid', 'Pyramid (narrow top)'], ['funnel', 'Funnel (wide top)']] }, { k: 'items', l: 'Levels', t: 'items', title: 'label', sub: [{ k: 'label', l: 'Label', t: 'text' }, { k: 'color', l: 'Colour (optional)', t: 'color' }] }],
		styleFields: SPACE,
		render: function (n) { var it = items(n), N = it.length || 1, fun = n.props.kind === 'funnel'; return '<div class="pl-' + (fun ? 'funnel' : 'pyr') + '">' + it.map(function (i, k) { var w = fun ? 100 - k * (60 / N) : 40 + (k + 1) * (60 / N); return '<div data-fx-in="zoom-in" data-fx-delay="' + (k * 120) + '" style="width:' + w.toFixed(1) + '%;background:' + esc(i.color || PAL[k % PAL.length]) + '">' + esc(i.label) + '</div>'; }).join('') + '</div>'; }
	});
	def('table', {
		label: 'Comparison table', group: 'data', icon: 'rows',
		props: { csv: 'Feature, Basic, Pro\nCertificate, yes, yes\nMentor support, no, yes\nProjects, 2, 6' },
		fields: [{ k: 'csv', l: 'Table (one row per line, cells separated by commas; yes/no become ticks)', t: 'textarea' }],
		styleFields: SPACE,
		render: function (n) { var rows = lines(n.props.csv).map(function (r) { return r.split(',').map(function (c) { return c.trim(); }); }); if (!rows.length) return ''; var cell = function (c) { return /^yes$/i.test(c) ? '<td class="y">\u2713</td>' : /^no$/i.test(c) ? '<td class="n">\u2717</td>' : '<td>' + esc(c) + '</td>'; }; return '<div class="pl-tblwrap"><table class="pl-cmp"><thead><tr>' + rows[0].map(function (h) { return '<th scope="col">' + esc(h) + '</th>'; }).join('') + '</tr></thead><tbody>' + rows.slice(1).map(function (r) { return '<tr>' + r.map(cell).join('') + '</tr>'; }).join('') + '</tbody></table></div>'; }
	});

	/* ---------------- scroll storytelling */
	def('stack', {
		label: 'Stacking cards', group: 'motion', icon: 'rows',
		props: { items: [{ title: 'Learn', text: 'Short lessons you can finish on your phone.', color: '#1d4ed8' }, { title: 'Build', text: 'Make real websites with a professional builder.', color: '#7c3aed' }, { title: 'Earn', text: 'Show your portfolio to clients and employers.', color: '#0f766e' }] },
		fields: [{ k: 'items', l: 'Cards', t: 'items', title: 'title', sub: [{ k: 'title', l: 'Title', t: 'text' }, { k: 'text', l: 'Text', t: 'textarea' }, { k: 'color', l: 'Colour', t: 'color' }] }],
		styleFields: SPACE,
		render: function (n) { return '<div class="pl-stack">' + items(n).map(function (c, k) { return '<div class="pl-sc" style="--k:' + k + ';background:' + esc(c.color || PAL[k % PAL.length]) + '"><h3 style="font-size:clamp(26px,4vw,44px);margin:0 0 10px;color:#fff">' + esc(c.title) + '</h3><p style="font-size:1.15em;max-width:560px">' + esc(c.text) + '</p></div>'; }).join('') + '</div>'; }
	});
	def('hscroll', {
		label: 'Horizontal scroll', group: 'motion', icon: 'arrow',
		props: { title: 'Our programmes', items: [{ src: '', title: 'Creative media', text: 'Photography, video and animation.' }, { src: '', title: 'Digital technology', text: 'Web, apps and data.' }, { src: '', title: 'Communication', text: 'PR, social media and writing.' }, { src: '', title: 'Research', text: 'Surveys, M&E and analysis.' }, { src: '', title: 'Leadership', text: 'Management and soft skills.' }] },
		fields: [{ k: 'title', l: 'Heading', t: 'text' }, { k: 'items', l: 'Cards', t: 'items', title: 'title', sub: [{ k: 'src', l: 'Picture', t: 'image' }, { k: 'title', l: 'Title', t: 'text' }, { k: 'text', l: 'Text', t: 'textarea' }] }],
		styleFields: [],
		render: function (n, ctx) { var cards = items(n).map(function (c, k) { return '<article class="ple-card" style="background:#fff;border-radius:18px;box-shadow:0 10px 30px rgba(15,23,42,.1)">' + img(url(c.src) || ph(c.title, PAL[k % PAL.length], '#f59e0b'), c.title) + '<div class="ple-card-b"><h3>' + esc(c.title) + '</h3><p>' + esc(c.text) + '</p></div></article>'; }).join(''); return '<div class="pl-hsec"' + (ctx && ctx.editing ? '' : ' data-fx-hscroll') + '><div class="pl-hs-sticky" style="flex-direction:column;align-items:stretch;justify-content:center">' + (n.props.title ? '<h2 style="padding:0 6vw;margin:0 0 20px">' + esc(n.props.title) + '</h2>' : '') + '<div class="pl-hs-track"' + (ctx && ctx.editing ? ' style="overflow-x:auto"' : '') + '>' + cards + '</div></div></div>'; }
	});

	/* ---------------- site */
	def('megamenu', {
		label: 'Mega menu', group: 'site', icon: 'menu',
		props: { logo: '', brand: 'My Brand', cta: 'Apply now', ctaHref: '#apply', cols: 3, items: [
			{ label: 'Home', href: '/', panel: '' },
			{ label: 'Courses', href: '#courses', panel: 'Web design | Build modern websites | #web | code\nData analysis | Excel, Power BI and more | #data | chart\nAI animation | Stories and explainers | #animation | camera\nPublic relations | Media and messaging | #pr | users\nResearch and M&E | Surveys and evaluation | #research | book\nLeadership | Management skills | #lead | award' },
			{ label: 'About', href: '#about', panel: '' },
			{ label: 'Contact', href: '#contact', panel: '' }] },
		fields: [{ k: 'logo', l: 'Logo', t: 'image' }, { k: 'brand', l: 'Brand name (if no logo)', t: 'text' }, { k: 'items', l: 'Menu items', t: 'items', title: 'label', sub: [{ k: 'label', l: 'Label', t: 'text' }, { k: 'href', l: 'Link', t: 'url' }, { k: 'panel', l: 'Drop-down links (one per line: Title | description | link | icon)', t: 'textarea' }] }, { k: 'cols', l: 'Drop-down columns', t: 'num', u: '' }, { k: 'cta', l: 'Button', t: 'text' }, { k: 'ctaHref', l: 'Button link', t: 'url' }],
		style: { mb: '#ffffff', mc: '#0f172a' },
		styleFields: [CL('mb', 'Background'), CL('mc', 'Text colour'), { k: 'shadow', l: 'Shadow', t: 'select', o: BOX[9].o }],
		render: function (n) {
			var p = n.props, s = n.style || {}, id = 'mm' + n.id;
			return '<nav class="pl-mega" aria-label="Main" style="--mb:' + esc(s.mb || '#fff') + ';--mc:' + esc(s.mc || '#0f172a') + ';--mc2:' + (+p.cols || 3) + '"><a class="pl-brand" href="/" style="color:inherit;text-decoration:none;font-weight:800;font-size:1.25em">' + (p.logo ? img(p.logo, p.brand) : esc(p.brand)) + '</a><input type="checkbox" id="' + id + '" class="pl-mega-t" hidden><label for="' + id + '" class="pl-mega-h" aria-label="Open menu">&#9776;</label><ul>' +
				items(n).map(function (it) {
					var panel = lines(it.panel).map(function (l) { var x = l.split('|').map(function (s) { return s.trim(); }); return '<a href="' + esc(url(x[2] || '#')) + '"><span>' + icon(x[3] || 'arrow', 20) + '</span><div><b>' + esc(x[0]) + '</b>' + (x[1] ? '<small>' + esc(x[1]) + '</small>' : '') + '</div></a>'; }).join('');
					return '<li><a href="' + esc(url(it.href)) + '"' + (panel ? ' aria-haspopup="true"' : '') + '>' + esc(it.label) + (panel ? ' &#9662;' : '') + '</a>' + (panel ? '<div class="pl-panel">' + panel + '</div>' : '') + '</li>';
				}).join('') + '</ul>' + (p.cta ? '<a class="pl-cta2" href="' + esc(url(p.ctaHref)) + '">' + esc(p.cta) + '</a>' : '') + '</nav>';
		}
	});
	def('breadcrumbs', {
		label: 'Breadcrumbs', group: 'site', icon: 'arrow',
		props: { items: [{ label: 'Home', href: '/' }, { label: 'Courses', href: '/courses/' }, { label: 'Web design', href: '' }] },
		fields: [{ k: 'items', l: 'Path', t: 'items', title: 'label', sub: [{ k: 'label', l: 'Label', t: 'text' }, { k: 'href', l: 'Link (empty for the current page)', t: 'url' }] }],
		styleFields: TXT.concat(SPACE),
		render: function (n) { var it = items(n); var ld = { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: it.map(function (i, k) { return { '@type': 'ListItem', position: k + 1, name: i.label, item: i.href || undefined }; }) }; return '<nav aria-label="Breadcrumb"><ol style="list-style:none;display:flex;flex-wrap:wrap;gap:6px;padding:0;margin:0">' + it.map(function (i, k) { return '<li>' + (i.href ? link(i.href, esc(i.label)) : '<span aria-current="page">' + esc(i.label) + '</span>') + (k < it.length - 1 ? ' <span aria-hidden="true">\u203a</span>' : '') + '</li>'; }).join('') + '</ol></nav><script type="application/ld+json">' + JSON.stringify(ld).replace(/</g, '\\u003c') + '</script>'; }
	});
	def('whatsapp', {
		label: 'WhatsApp button', group: 'site', icon: 'phone',
		props: { phone: '254700000000', msg: 'Hello, I would like to know more about your courses.', label: 'Chat with us', pos: 'right' },
		fields: [{ k: 'phone', l: 'WhatsApp number (with 254)', t: 'text' }, { k: 'msg', l: 'Pre-filled message', t: 'textarea' }, { k: 'label', l: 'Label', t: 'text' }, { k: 'pos', l: 'Position', t: 'select', o: [['right', 'Bottom right'], ['left', 'Bottom left']] }],
		styleFields: [],
		render: function (n, ctx) { var p = n.props, h = 'https://wa.me/' + String(p.phone || '').replace(/\D/g, '') + '?text=' + encodeURIComponent(p.msg || ''); return '<a class="pl-wa ' + (p.pos === 'left' ? 'left' : '') + '" href="' + esc(h) + '" target="_blank" rel="noopener"' + (ctx && ctx.editing ? ' style="position:static;display:inline-flex"' : '') + '>' + icon('phone', 20) + esc(p.label) + '</a>'; }
	});
	def('totop', {
		label: 'Back to top', group: 'site', icon: 'arrow',
		props: {}, fields: [], styleFields: [],
		render: function (n, ctx) { return '<a href="#" class="pl-totop' + (ctx && ctx.editing ? ' on' : '') + '" data-totop aria-label="Back to top"' + (ctx && ctx.editing ? ' style="position:static"' : '') + '><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 19V5M5 12l7-7 7 7"/></svg></a>'; }
	});
	def('scrollbar', {
		label: 'Scroll progress bar', group: 'site', icon: 'minus',
		props: {}, fields: [], style: { pc: '#2563eb' }, styleFields: [CL('pc', 'Colour')],
		render: function (n, ctx) { return '<div class="pl-progress" data-fx-progress style="--pc:' + esc((n.style || {}).pc || '#2563eb') + (ctx && ctx.editing ? ';position:static;transform:none;height:6px;border-radius:9px' : '') + '" aria-hidden="true"></div>'; }
	});
	def('form', {
		label: 'Form', group: 'site', icon: 'mail',
		props: { name: 'Contact form', items: [{ label: 'Full name', type: 'text', req: '1' }, { label: 'Phone', type: 'tel', req: '1' }, { label: 'Email', type: 'email', req: '' }, { label: 'Course of interest', type: 'select:Web design,Data analysis,AI animation,Other', req: '' }, { label: 'Message', type: 'textarea', req: '' }], btn: 'Send', ok: 'Thank you. We will get back to you within one working day.', wa: '' },
		fields: [{ k: 'name', l: 'Form name (shown in your inbox)', t: 'text' }, { k: 'items', l: 'Fields', t: 'items', title: 'label', sub: [{ k: 'label', l: 'Label', t: 'text' }, { k: 'type', l: 'Type', t: 'select', o: [['text', 'Text'], ['email', 'Email'], ['tel', 'Phone'], ['number', 'Number'], ['date', 'Date'], ['textarea', 'Long text'], ['select:Option 1,Option 2', 'Drop-down (edit options in code view)'], ['checkbox', 'Tick box']] }, { k: 'req', l: 'Required', t: 'toggle' }] }, { k: 'btn', l: 'Button label', t: 'text' }, { k: 'ok', l: 'Thank-you message', t: 'textarea' }, { k: 'wa', l: 'Also open WhatsApp to this number (optional)', t: 'text' }],
		styleFields: BOX,
		render: function (n) {
			var p = n.props, f = items(n).map(function (it, k) {
				var nm = 'f' + k, req = it.req ? ' required' : '', lab = esc(it.label) + (it.req ? ' *' : '');
				if (it.type === 'textarea') return '<label>' + lab + '<textarea name="' + nm + '" rows="4"' + req + '></textarea></label>';
				if (/^select:/.test(it.type)) return '<label>' + lab + '<select name="' + nm + '"' + req + '><option value="">Choose\u2026</option>' + it.type.slice(7).split(',').map(function (o) { return '<option>' + esc(o.trim()) + '</option>'; }).join('') + '</select></label>';
				if (it.type === 'checkbox') return '<label style="display:flex;gap:8px;align-items:center;font-weight:500"><input type="checkbox" name="' + nm + '" value="Yes"' + req + '>' + lab + '</label>';
				return '<label>' + lab + '<input type="' + esc(it.type || 'text') + '" name="' + nm + '"' + req + '></label>';
			}).join('');
			return '<form class="pl-form" data-ple-form="' + esc(n.id) + '" data-name="' + esc(p.name) + '" data-ok="' + esc(p.ok) + '" data-wa="' + esc(String(p.wa || '').replace(/\D/g, '')) + '" data-labels="' + esc(JSON.stringify(items(n).map(function (i) { return i.label; }))) + '">' + f + '<input type="text" name="website" tabindex="-1" autocomplete="off" style="position:absolute;left:-9999px" aria-hidden="true"><button class="pl-btn" type="submit">' + esc(p.btn) + '</button><p class="pl-msg" role="status"></p></form>';
		}
	});
	/* Section templates that use the new widgets. */
	var T = C.T, node = C.node, col = C.col, row = C.row, section = C.section;
	T.heroslider = function () { return section([row([col([node('heroslider')])])], { pt: 0, pb: 0, px: 0 }, { width: 'full' }); };
	T.stats = function () { return section([row([col([node('stats')])])], { bg: '#0f172a', color: '#fff', pt: 56, pb: 56 }); };
	T.faq = function () { return section([row([col([node('heading', { text: 'Frequently asked questions', tag: 'h2' }, { align: 'center' }), node('accordion')])])], {}, { width: 'narrow' }); };
	T.pricing = function () { return section([row([col([node('heading', { text: 'Simple, fair prices', tag: 'h2' }, { align: 'center', mb: 24 })])]), row([col([node('pricing', { title: 'Starter', price: 'KSh 15,000' })]), col([node('pricing', { hot: '1', badge: 'Most popular' })]), col([node('pricing', { title: 'Organisations', price: 'Custom', period: 'quote' })])], { gap: 24 })], { bg: '#f8fafc' }); };
	T.testimonials = function () { return section([row([col([node('heading', { text: 'What our students say', tag: 'h2' }, { align: 'center', mb: 20 }), node('testimonials')])])], { bg: '#f8fafc' }); };
	T.journey = function () { return section([row([col([node('heading', { text: 'How it works', tag: 'h2' }, { align: 'center', mb: 30 }), node('journey')])])]); };
	T.logos = function () { return section([row([col([node('text', { html: '<p>Trusted by organisations across East Africa</p>' }, { align: 'center', color: '#64748b' }), node('logos')])])], { pt: 32, pb: 32 }); };
	T.megaheader = function () { return section([row([col([node('megamenu')])])], { pt: 0, pb: 0, px: 0 }, { tag: 'header', width: 'full' }); };
	T.contactform = function () { return section([row([col([node('heading', { text: 'Send us a message', tag: 'h2' }), node('text', { html: '<p>We reply within one working day.</p>' }), node('iconbox', { icon: 'phone', title: 'Call or WhatsApp', text: '+254 700 000 000' }, { layout: 'row' })]), col([node('form')], { bg: '#ffffff', radius: 18, pt: 24, pb: 24, px: 24, shadow: '0 10px 30px rgba(0,0,0,.15)' })], { gap: 40 })], { bg: '#f1f5f9' }, { anchor: 'contact' }); };
	C.TEMPLATES.push(['heroslider', 'Hero carousel'], ['megaheader', 'Header with mega menu'], ['stats', 'Stats band'], ['journey', 'How it works'], ['testimonials', 'Testimonials'], ['pricing', 'Pricing tables'], ['faq', 'FAQ'], ['logos', 'Partner logos'], ['contactform', 'Contact form']);
	C.WGROUPS = [['basic', 'Basic'], ['media', 'Media'], ['slider', 'Sliders and carousels'], ['interactive', 'Interactive'], ['business', 'Business'], ['data', 'Charts and infographics'], ['motion', 'Scroll effects'], ['site', 'Site and forms']];
})(window);
