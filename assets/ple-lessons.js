/*!
 * PLE Studio curriculum: Practical Web Design.
 * kinds: read (with quiz), code (HTML/CSS editor with live checks), builder (visual builder with checks), quiz.
 * Each check receives ctx: { doc, win, html, css, tree, project, find(type), nodes() }.
 */
(function (g) {
	'use strict';
	var px = function (v) { return parseFloat(v) || 0; };
	var cs = function (ctx, el, p) { return el ? ctx.win.getComputedStyle(el).getPropertyValue(p) : ''; };
	var q = function (ctx, s) { return ctx.doc.querySelector(s); };
	var qa = function (ctx, s) { return ctx.doc.querySelectorAll(s); };
	var nodes = function (ctx, type) { var out = []; (function w(n) { if (!n) return; if (!type || n.type === type) out.push(n); (n.children || []).forEach(w); })(ctx.tree); return out; };
	var notBlack = function (c) { return c && c.replace(/\s/g, '') !== 'rgb(0,0,0)' && c !== ''; };
	var notWhite = function (c) { c = (c || '').replace(/\s/g, ''); return c && c !== 'rgba(0,0,0,0)' && c !== 'rgb(255,255,255)' && c !== 'transparent'; };

	var MODULES = [
		{ id: 'm1', title: 'Start here', blurb: 'How websites work, in plain language.', color: '#0ea5e9' },
		{ id: 'm2', title: 'HTML: the content', blurb: 'Headings, paragraphs, links, pictures and page structure.', color: '#f97316' },
		{ id: 'm3', title: 'CSS: the design', blurb: 'Colours, spacing, layout and phone-friendly pages.', color: '#8b5cf6' },
		{ id: 'm4', title: 'Visual page building', blurb: 'Sections, rows, columns, widgets and Layers.', color: '#16a34a' },
		{ id: 'm5', title: 'Real projects', blurb: 'Build, publish and share a website for a real business.', color: '#e11d48' }
	];

	var L = [
		/* ------------------------------------------------------------ M1 */
		{
			id: 'web-basics', module: 'm1', title: 'How a website works', mins: 6, kind: 'read',
			body: [
				'<p>Every website is a set of <b>files</b> kept on a computer that is always switched on and connected to the internet. That computer is called a <b>server</b>, and renting space on one is called <b>hosting</b>.</p>',
				'<p>When someone types an address such as <code>pentarchtraininginstitute.co.ke</code>, their <b>browser</b> (Chrome, Safari, Opera Mini) asks the server for the files and draws the page on the screen.</p>',
				'<div class="st-trio"><div><b>HTML</b><span>The content and structure: headings, text, pictures, links.</span></div><div><b>CSS</b><span>The design: colours, fonts, spacing and layout.</span></div><div><b>JavaScript</b><span>The behaviour: menus that open, forms that check, sliders.</span></div></div>',
				'<p>Think of a house: HTML is the walls and rooms, CSS is the paint and furniture, and JavaScript is the electricity that makes things move.</p>',
				'<p>The address itself is a <b>domain name</b>. In Kenya, <code>.co.ke</code> addresses are sold by registrars licensed by KeNIC. You pay for a domain and for hosting, usually once a year.</p>',
				'<p>In this course you will write real HTML and CSS, then use a visual builder to make complete pages quickly. Everything works on a phone.</p>'
			].join(''),
			quiz: [
				{ q: 'Which part of a website controls colours and fonts?', o: ['HTML', 'CSS', 'The domain name'], a: 1 },
				{ q: 'What is hosting?', o: ['Renting space on a server that keeps your site online', 'Buying a new laptop', 'A type of web browser'], a: 0 },
				{ q: 'Which of these is a browser?', o: ['WordPress', 'Chrome', 'KeNIC'], a: 1 }
			]
		},
		/* ------------------------------------------------------------ M2 */
		{
			id: 'html-first', module: 'm2', title: 'Your first web page', mins: 8, kind: 'code',
			body: [
				'<p>HTML uses <b>tags</b> to label each piece of content. A tag opens with <code>&lt;name&gt;</code> and closes with <code>&lt;/name&gt;</code>. Whatever sits between them is the content.</p>',
				'<pre>&lt;h1&gt;Mama Njeri\'s Kitchen&lt;/h1&gt;\n&lt;p&gt;Fresh chapati and stew in Embu town.&lt;/p&gt;</pre>',
				'<p><code>h1</code> is the main heading. There is one per page. Smaller headings are <code>h2</code> to <code>h6</code>. <code>p</code> is a paragraph.</p>'
			].join(''),
			task: 'Change the heading to <b>your own name</b>, and write a paragraph of at least ten words about yourself. Then add an <code>h2</code> heading that says <b>My skills</b>.',
			starter: { html: '<h1>Your name here</h1>\n<p>Write about yourself here.</p>\n', css: 'body {\n  font-family: Arial, sans-serif;\n  padding: 20px;\n}\n' },
			checks: [
				{ t: 'There is one h1 heading with your name in it', f: function (c) { var h = qa(c, 'h1'); return h.length === 1 && h[0].textContent.trim().length > 2 && !/your name/i.test(h[0].textContent); } },
				{ t: 'Your paragraph has at least ten words', f: function (c) { var p = q(c, 'p'); return p && p.textContent.trim().split(/\s+/).length >= 10 && !/write about yourself/i.test(p.textContent); } },
				{ t: 'There is an h2 heading that says "My skills"', f: function (c) { return [].some.call(qa(c, 'h2'), function (h) { return /my\s+skills/i.test(h.textContent); }); } }
			],
			hint: 'Add a new line under your paragraph: <code>&lt;h2&gt;My skills&lt;/h2&gt;</code>'
		},
		{
			id: 'html-links-images', module: 'm2', title: 'Links and pictures', mins: 8, kind: 'code',
			body: [
				'<p>A <b>link</b> uses the <code>a</code> tag. The <code>href</code> <i>attribute</i> says where it goes:</p>',
				'<pre>&lt;a href="https://wa.me/254700000000"&gt;Chat on WhatsApp&lt;/a&gt;</pre>',
				'<p>A <b>picture</b> uses <code>img</code>. It has no closing tag. <code>src</code> is the picture\'s address, and <code>alt</code> describes it for blind visitors and for Google.</p>',
				'<pre>&lt;img src="photo.jpg" alt="Our shop on Moi Avenue"&gt;</pre>',
				'<p>Special links: <code>tel:0700000000</code> phones a number, <code>mailto:you@mail.com</code> opens email, and <code>#contact</code> jumps to the part of the page with <code>id="contact"</code>.</p>'
			].join(''),
			task: 'Add a link to <b>any website</b>, a <b>WhatsApp or phone link</b> (starting with <code>https://wa.me/</code> or <code>tel:</code>), and a picture with a helpful <code>alt</code> description.',
			starter: { html: '<h1>Contact me</h1>\n<p>Find me online:</p>\n\n<!-- Add your links and picture below -->\n\n', css: 'body { font-family: Arial, sans-serif; padding: 20px; }\nimg { max-width: 100%; border-radius: 12px; }\n' },
			assets: true,
			checks: [
				{ t: 'A link to a website (href starts with https://)', f: function (c) { return [].some.call(qa(c, 'a[href]'), function (a) { return /^https?:\/\//i.test(a.getAttribute('href')) && !/wa\.me/.test(a.getAttribute('href')) && a.textContent.trim(); }); } },
				{ t: 'A WhatsApp (https://wa.me/...) or phone (tel:...) link', f: function (c) { return [].some.call(qa(c, 'a[href]'), function (a) { return /^(tel:|https:\/\/wa\.me\/)/i.test(a.getAttribute('href')); }); } },
				{ t: 'A picture with an alt description of at least two words', f: function (c) { return [].some.call(qa(c, 'img'), function (i) { return i.getAttribute('src') && (i.getAttribute('alt') || '').trim().split(/\s+/).length >= 2; }); } }
			],
			hint: 'Tap <b>Pictures</b> above the editor to copy a ready picture address. Example: <code>&lt;a href="tel:0700000000"&gt;Call me&lt;/a&gt;</code>'
		},
		{
			id: 'html-lists', module: 'm2', title: 'Lists', mins: 6, kind: 'code',
			body: [
				'<p>Lists keep information tidy. Use <code>ul</code> for bullet points and <code>ol</code> for numbered steps. Each item is an <code>li</code>.</p>',
				'<pre>&lt;ul&gt;\n  &lt;li&gt;Haircut: KSh 300&lt;/li&gt;\n  &lt;li&gt;Braiding: KSh 1,500&lt;/li&gt;\n&lt;/ul&gt;</pre>',
				'<p>Menus, price lists and features are almost always lists underneath.</p>'
			].join(''),
			task: 'Make a <b>price list</b> with at least three items using <code>ul</code>, and a <b>numbered list</b> of at least three steps that explain how to order.',
			starter: { html: '<h1>Our services</h1>\n\n<h2>Prices</h2>\n\n<h2>How to order</h2>\n\n', css: 'body { font-family: Arial, sans-serif; padding: 20px; }\nli { margin-bottom: 6px; }\n' },
			checks: [
				{ t: 'A bullet list (ul) with at least three items', f: function (c) { return [].some.call(qa(c, 'ul'), function (u) { return u.querySelectorAll('li').length >= 3; }); } },
				{ t: 'A numbered list (ol) with at least three steps', f: function (c) { return [].some.call(qa(c, 'ol'), function (u) { return u.querySelectorAll('li').length >= 3; }); } },
				{ t: 'No empty list items', f: function (c) { var li = qa(c, 'li'); return li.length && ![].some.call(li, function (l) { return !l.textContent.trim(); }); } }
			],
			hint: 'Numbered lists look the same as bullet lists, but start with <code>&lt;ol&gt;</code> and end with <code>&lt;/ol&gt;</code>.'
		},
		{
			id: 'html-structure', module: 'm2', title: 'Page structure', mins: 8, kind: 'code',
			body: [
				'<p>Real pages are split into clear areas. These <b>semantic</b> tags tell browsers, search engines and screen readers what each area is for:</p>',
				'<div class="st-trio"><div><b>&lt;header&gt;</b><span>Logo and menu at the top</span></div><div><b>&lt;nav&gt;</b><span>The main links</span></div><div><b>&lt;main&gt;</b><span>The main content</span></div><div><b>&lt;section&gt;</b><span>A themed part of the page</span></div><div><b>&lt;footer&gt;</b><span>Contacts and copyright</span></div></div>',
				'<p>Google ranks well-structured pages higher, and they are easier for everyone to use.</p>'
			].join(''),
			task: 'Organise this page: put the brand and links inside a <code>header</code> containing a <code>nav</code>, wrap the content in <code>main</code> with at least two <code>section</code>s, and finish with a <code>footer</code>.',
			starter: { html: '<h1>Kilimo Fresh</h1>\n<a href="#about">About</a>\n<a href="#contact">Contact</a>\n\n<h2>About us</h2>\n<p>We deliver fresh vegetables from Kirinyaga farms.</p>\n\n<h2 id="contact">Contact</h2>\n<p>Call 0700 000 000</p>\n\n<p>&copy; 2026 Kilimo Fresh</p>\n', css: 'body { font-family: Arial, sans-serif; margin: 0; }\nheader, footer { background: #14532d; color: white; padding: 16px; }\nheader a { color: white; margin-right: 12px; }\nmain section { padding: 16px; }\n' },
			checks: [
				{ t: 'A header containing a nav with links', f: function (c) { return !!q(c, 'header nav a'); } },
				{ t: 'A main area with at least two sections', f: function (c) { return qa(c, 'main section').length >= 2; } },
				{ t: 'A footer at the end', f: function (c) { return !!q(c, 'footer'); } }
			],
			hint: '<code>&lt;header&gt;&lt;h1&gt;Kilimo Fresh&lt;/h1&gt;&lt;nav&gt; ...links... &lt;/nav&gt;&lt;/header&gt;</code>'
		},
		{
			id: 'html-check', module: 'm2', title: 'HTML checkpoint', mins: 4, kind: 'quiz',
			body: '<p>Five quick questions on what you have learned. You need four right to pass.</p>',
			quiz: [
				{ q: 'Which tag makes the main page heading?', o: ['<head>', '<h1>', '<p>'], a: 1 },
				{ q: 'Which attribute gives a link its destination?', o: ['src', 'alt', 'href'], a: 2 },
				{ q: 'Why does an image need alt text?', o: ['It makes the image load faster', 'It describes the image for screen readers and search engines', 'It adds a border'], a: 1 },
				{ q: 'Which tag is a numbered list?', o: ['<ol>', '<ul>', '<li>'], a: 0 },
				{ q: 'Where do the copyright and contacts usually go?', o: ['<header>', '<nav>', '<footer>'], a: 2 }
			],
			pass: 4
		},
		/* ------------------------------------------------------------ M3 */
		{
			id: 'css-colours', module: 'm3', title: 'Colours and fonts', mins: 8, kind: 'code',
			body: [
				'<p>CSS uses <b>rules</b>. A rule picks some elements (the <i>selector</i>) and sets <i>properties</i>:</p>',
				'<pre>h1 {\n  color: #1d4ed8;\n  font-size: 40px;\n}</pre>',
				'<p>Colours can be names (<code>red</code>) or hex codes (<code>#1d4ed8</code>). Fonts are set with <code>font-family</code>. To style one element, give it a class: <code>&lt;p class="note"&gt;</code>, then use <code>.note { ... }</code> in CSS.</p>'
			].join(''),
			task: 'In the <b>CSS</b> tab: give the page a <b>background colour</b> that is not white, make the <code>h1</code> a <b>colour</b> other than black, and make the paragraph with class <code>note</code> <b>bold</b>.',
			starter: { html: '<h1>Nairobi Tech Club</h1>\n<p>We meet every Saturday to learn coding together.</p>\n<p class="note">Entry is free for students.</p>\n', css: 'body {\n  font-family: Arial, sans-serif;\n  padding: 24px;\n}\n\n/* Write your rules below */\n\n' },
			checks: [
				{ t: 'The page background is not white', f: function (c) { return notWhite(cs(c, c.doc.body, 'background-color')) || notWhite(cs(c, c.doc.documentElement, 'background-color')); } },
				{ t: 'The h1 is a colour other than black', f: function (c) { return notBlack(cs(c, q(c, 'h1'), 'color')); } },
				{ t: 'The .note paragraph is bold', f: function (c) { return px(cs(c, q(c, '.note'), 'font-weight')) >= 600; } }
			],
			hint: '<code>body { background: #fef3c7; }</code> and <code>.note { font-weight: bold; }</code>'
		},
		{
			id: 'css-box', module: 'm3', title: 'Spacing and cards', mins: 8, kind: 'code',
			body: [
				'<p>Every element is a <b>box</b>. <code>padding</code> is space inside the box, <code>border</code> is its edge, and <code>margin</code> is space outside it.</p>',
				'<pre>.card {\n  padding: 20px;\n  border-radius: 12px;\n  margin-bottom: 16px;\n  box-shadow: 0 4px 12px rgba(0,0,0,.1);\n}</pre>',
				'<p>Good spacing is the easiest way to make a page look professional.</p>'
			].join(''),
			task: 'Style the <code>.card</code> boxes: at least <b>16px padding</b>, <b>rounded corners</b>, a <b>background colour</b>, and some <b>space between</b> the cards.',
			starter: { html: '<div class="card">\n  <h2>Web design</h2>\n  <p>Modern websites for small businesses.</p>\n</div>\n<div class="card">\n  <h2>Logo design</h2>\n  <p>Simple, memorable logos.</p>\n</div>\n', css: 'body { font-family: Arial, sans-serif; padding: 20px; background: #f1f5f9; }\n\n.card {\n\n}\n' },
			checks: [
				{ t: 'Cards have at least 16px padding', f: function (c) { return px(cs(c, q(c, '.card'), 'padding-left')) >= 16 && px(cs(c, q(c, '.card'), 'padding-top')) >= 16; } },
				{ t: 'Cards have rounded corners', f: function (c) { return px(cs(c, q(c, '.card'), 'border-top-left-radius')) > 0; } },
				{ t: 'Cards have a background colour', f: function (c) { return notWhite(cs(c, q(c, '.card'), 'background-color')) || cs(c, q(c, '.card'), 'background-color').replace(/\s/g, '') === 'rgb(255,255,255)'; } },
				{ t: 'There is space between the cards', f: function (c) { var a = qa(c, '.card'); if (a.length < 2) return false; return a[1].getBoundingClientRect().top - a[0].getBoundingClientRect().bottom >= 8; } }
			],
			hint: 'Inside <code>.card { }</code> add <code>background: white; padding: 20px; border-radius: 12px; margin-bottom: 16px;</code>'
		},
		{
			id: 'css-flex', module: 'm3', title: 'Side-by-side layout with Flexbox', mins: 10, kind: 'code',
			body: [
				'<p>To place boxes side by side, make their parent a <b>flex container</b>:</p>',
				'<pre>.row {\n  display: flex;\n  gap: 16px;\n}\n.box {\n  flex: 1;\n}</pre>',
				'<p><code>gap</code> adds space between the boxes. <code>flex: 1</code> makes them share the width equally. <code>justify-content</code> and <code>align-items</code> line things up.</p>'
			].join(''),
			task: 'Make the three <code>.box</code> items sit <b>side by side</b> inside <code>.row</code>, with a <b>gap</b> between them and <b>equal widths</b>.',
			starter: { html: '<div class="row">\n  <div class="box">Fast delivery</div>\n  <div class="box">Fair prices</div>\n  <div class="box">Local team</div>\n</div>\n', css: 'body { font-family: Arial, sans-serif; padding: 20px; }\n.box { background: #ede9fe; padding: 20px; border-radius: 10px; text-align: center; }\n\n.row {\n\n}\n' },
			wide: true,
			checks: [
				{ t: '.row uses display: flex', f: function (c) { return cs(c, q(c, '.row'), 'display') === 'flex'; } },
				{ t: 'There is a gap between the boxes', f: function (c) { var b = qa(c, '.box'); return b.length >= 2 && b[1].getBoundingClientRect().left - b[0].getBoundingClientRect().right >= 8; } },
				{ t: 'The boxes have equal widths', f: function (c) { var b = qa(c, '.box'); if (b.length < 3) return false; var w = [].map.call(b, function (x) { return x.getBoundingClientRect().width; }); return Math.max.apply(0, w) - Math.min.apply(0, w) < 3 && b[0].getBoundingClientRect().top === b[2].getBoundingClientRect().top; } }
			],
			hint: '<code>.row { display: flex; gap: 16px; }</code> and add <code>flex: 1;</code> to <code>.box</code>.'
		},
		{
			id: 'css-responsive', module: 'm3', title: 'Phone-friendly pages', mins: 10, kind: 'code',
			body: [
				'<p>Most Kenyan visitors use a phone. A <b>media query</b> lets you change the design on small screens:</p>',
				'<pre>@media (max-width: 600px) {\n  .row {\n    flex-direction: column;\n  }\n}</pre>',
				'<p>The rules inside only apply when the screen is 600px wide or less. Always check your page in <b>phone view</b>.</p>',
				'<p>Also keep this in the page head (Studio adds it for you): <code>&lt;meta name="viewport" content="width=device-width, initial-scale=1"&gt;</code></p>'
			].join(''),
			task: 'Add a media query so that on screens <b>600px or narrower</b>, the boxes <b>stack on top of each other</b> and the heading becomes <b>smaller</b> (under 30px).',
			starter: { html: '<h1>Our promise</h1>\n<div class="row">\n  <div class="box">Fast delivery</div>\n  <div class="box">Fair prices</div>\n  <div class="box">Local team</div>\n</div>\n', css: 'body { font-family: Arial, sans-serif; padding: 20px; }\nh1 { font-size: 44px; }\n.row { display: flex; gap: 16px; }\n.box { flex: 1; background: #dcfce7; padding: 20px; border-radius: 10px; }\n\n/* Phone styles */\n\n' },
			phoneCheck: true,
			checks: [
				{ t: 'Your CSS has a media query for max-width', f: function (c) { return /@media[^{]*max-width/i.test(c.css); } },
				{ t: 'On a phone, the boxes stack in a column', f: function (c) { var b = qa(c, '.box'); return b.length >= 2 && b[1].getBoundingClientRect().top >= b[0].getBoundingClientRect().bottom - 1; } },
				{ t: 'On a phone, the heading is smaller than 30px', f: function (c) { return px(cs(c, q(c, 'h1'), 'font-size')) < 30; } }
			],
			hint: 'Inside the media query: <code>.row { flex-direction: column; }</code> and <code>h1 { font-size: 28px; }</code>'
		},
		{
			id: 'css-check', module: 'm3', title: 'CSS checkpoint', mins: 4, kind: 'quiz',
			body: '<p>Five questions on design with CSS. You need four right to pass.</p>',
			quiz: [
				{ q: 'Which property adds space inside a box?', o: ['margin', 'padding', 'gap'], a: 1 },
				{ q: 'How do you select an element with class="price"?', o: ['#price', 'price', '.price'], a: 2 },
				{ q: 'Which rule puts children side by side?', o: ['display: flex', 'display: none', 'position: fixed'], a: 0 },
				{ q: 'What does @media (max-width: 600px) do?', o: ['Applies rules only on screens 600px wide or less', 'Makes the page 600px wide', 'Hides the page on phones'], a: 0 },
				{ q: 'Which property makes text bold?', o: ['font-style', 'text-decoration', 'font-weight'], a: 2 }
			],
			pass: 4
		},
		/* ------------------------------------------------------------ M4 */
		{
			id: 'pb-structure', module: 'm4', title: 'Sections, rows and columns', mins: 10, kind: 'builder',
			body: [
				'<p>Professional builders such as PLE, Pagelayer and Elementor all use the same structure, which is the same HTML and CSS you have just learned:</p>',
				'<div class="st-trio"><div><b>Section</b><span>A full-width band of the page, like &lt;section&gt;</span></div><div><b>Row</b><span>A line of columns (a flex or grid container)</span></div><div><b>Column</b><span>One box inside a row</span></div><div><b>Widget</b><span>The content: heading, text, button, picture</span></div></div>',
				'<p>Open <b>Layers</b> to see the structure of your page at any time.</p>'
			].join(''),
			task: 'Build a <b>"Why choose us"</b> section: a heading, then a <b>row with three columns</b>, each containing an <b>Icon box</b> with your own title. Try <b>Add &rsaquo; Row, 3 columns</b>.',
			start: 'blank',
			checks: [
				{ t: 'A heading that is not the default text', f: function (c) { return nodes(c, 'heading').some(function (n) { return n.props.text && !/your heading here/i.test(n.props.text); }); } },
				{ t: 'A row with at least three columns', f: function (c) { return nodes(c, 'row').some(function (r) { return r.children.length >= 3; }); } },
				{ t: 'Three icon boxes with your own titles', f: function (c) { return nodes(c, 'iconbox').filter(function (n) { return n.props.title && !/feature title/i.test(n.props.title); }).length >= 3; } }
			],
			hint: 'Select a column, then tap <b>Add &rsaquo; Icon box</b>. Change its title in <b>Edit &rsaquo; Content</b>.'
		},
		{
			id: 'pb-hero', module: 'm4', title: 'A strong hero banner', mins: 10, kind: 'builder',
			body: [
				'<p>The <b>hero</b> is the first thing visitors see. In about three seconds it must say <b>what you do</b>, <b>who it is for</b>, and <b>what to do next</b>.</p>',
				'<p>A good hero has one big <code>h1</code> heading, one short sentence, one clear button, and a strong background (a picture with a dark overlay, or a bold colour) so the text is easy to read.</p>'
			].join(''),
			task: 'Build a hero for a business of your choice: an <b>H1 heading</b>, a short <b>text</b>, a <b>button</b> with a real link (WhatsApp, phone or #contact), and a <b>background colour or picture</b> on the section.',
			start: 'blank',
			checks: [
				{ t: 'A heading set to H1 with your own words', f: function (c) { return nodes(c, 'heading').some(function (n) { return n.props.tag === 'h1' && !/your heading here/i.test(n.props.text || ''); }); } },
				{ t: 'A button whose link is not just "#"', f: function (c) { return nodes(c, 'button').some(function (n) { return n.props.href && n.props.href !== '#'; }); } },
				{ t: 'A section with a background colour or picture', f: function (c) { return nodes(c, 'section').some(function (n) { return n.style.bgImg || (n.style.bg && !/^#fff(fff)?$/i.test(n.style.bg)); }); } }
			],
			hint: 'Select the section (tap its edge or use Layers), open <b>Edit &rsaquo; Style</b> and set a background colour or image.'
		},
		{
			id: 'pb-mobile', module: 'm4', title: 'Make it perfect on phones', mins: 8, kind: 'builder',
			body: [
				'<p>Switch to <b>phone view</b> using the phone icon at the top. When you edit a style in phone view, fields marked <span class="pe-r">Phone</span> only change small screens. Behind the scenes, PLE writes a <code>@media</code> query for you.</p>',
				'<p>Big desktop headings are often too large on phones. Shrink them, and hide anything that is not needed on a small screen.</p>'
			].join(''),
			task: 'Using this ready-made page: in <b>phone view</b>, make the main heading <b>smaller</b>, and use <b>Edit &rsaquo; Advanced</b> to <b>hide one item on phones</b>.',
			start: 'starter',
			checks: [
				{ t: 'A heading has a new size on phones', f: function (c) { return nodes(c, 'heading').some(function (n) { var s = c.start[n.id], a = (n.style.m || {}).size, b = s && (s.style.m || {}).size; return a !== undefined && a !== '' && String(a) !== String(b); }); } },
				{ t: 'Something is hidden on phones', f: function (c) { return nodes(c).some(function (n) { return n.props && n.props.hideM; }); } }
			],
			hint: 'Tap the phone icon at the top first. Then select the heading and open <b>Edit &rsaquo; Style &rsaquo; Font size</b>.'
		},
		{
			id: 'pb-layers', module: 'm4', title: 'Working with Layers and code', mins: 6, kind: 'builder',
			body: [
				'<p><b>Layers</b> shows every section, row, column and widget as a tree, just like the HTML. Use it to select things that are hard to tap, move items up and down, copy and delete.</p>',
				'<p>Tap <b>Code</b> to see the real HTML and CSS PLE writes. Select an item to see just its code. Professionals read this to fix problems.</p>'
			].join(''),
			task: 'In <b>Layers</b>, give a section a <b>custom name</b> (Edit &rsaquo; Advanced &rsaquo; Name in Layers), <b>move</b> a section to a new position, and set an <b>anchor ID</b> on a section so a menu link can jump to it.',
			start: 'starter',
			checks: [
				{ t: 'A section has a custom name', f: function (c) { return nodes(c, 'section').some(function (n) { return n.props.label; }); } },
				{ t: 'The sections are in a new order', f: function (c) { var s = nodes(c, 'section'); return s.length > 2 && c.startOrder && s.map(function (n) { return n.id; }).join() !== c.startOrder; } },
				{ t: 'A section has a new anchor ID', f: function (c) { return nodes(c, 'section').some(function (n) { var s = c.start[n.id]; return n.props.anchor && (!s || s.props.anchor !== n.props.anchor); }); } }
			],
			hint: 'Use the &uarr; and &darr; buttons in Layers to move a section.'
		},
		{
			id: 'pb-motion', module: 'm4', title: 'Movement that helps, not distracts', mins: 8, kind: 'builder',
			body: [
				'<p>Good movement guides the eye. An <b>entrance animation</b> draws attention to content as it scrolls into view. A <b>hover effect</b> tells visitors something is clickable. A <b>sticky menu</b> keeps navigation in reach on long pages.</p>',
				'<p>Use movement with care: one gentle style across the page, short durations, and never on long paragraphs. PLE turns animations off automatically for people who ask their phone to reduce motion.</p>',
				'<p>Open <b>Edit &rsaquo; Motion</b> on any item. Press <b>Play entrance</b> to preview it; the live page plays it when visitors scroll.</p>'
			].join(''),
			task: 'On this page: give <b>two items</b> an entrance animation, give a <b>button or card</b> a hover effect, and make the <b>menu bar stick</b> to the top when scrolling.',
			start: 'starter',
			checks: [
				{ t: 'At least two items have an entrance animation', f: function (c) { return nodes(c).filter(function (n) { return n.props && n.props.fx && n.props.fx['in']; }).length >= 2; } },
				{ t: 'A button or card has a hover effect', f: function (c) { return nodes(c).some(function (n) { return /^(button|card|iconbox|imagebox|flipbox|pricing)$/.test(n.type) && n.props.fx && n.props.fx.hover; }); } },
				{ t: 'The menu bar sticks to the top', f: function (c) { return nodes(c, 'navbar').some(function (n) { return n.props.fx && n.props.fx.sticky === 'top'; }); } }
			],
			hint: 'Select an item, open <b>Edit &rsaquo; Motion</b> and choose an <b>Animation</b>. For the menu, select the menu bar and set <b>Stick when scrolling</b> to <b>Stick to the top</b>.'
		},
		/* ------------------------------------------------------------ M5 */
		{
			id: 'proj-landing', module: 'm5', title: 'Project: a business landing page', mins: 40, kind: 'builder',
			body: [
				'<p>Time to build a complete website for a real local business: a salon, a shop, a church, a school, or a <i>boda boda</i> SACCO. Ask the owner for their details, or invent a realistic one.</p>',
				'<p>A landing page that brings in customers usually has: a <b>menu bar</b>, a <b>hero</b>, <b>services or products</b>, <b>about / trust</b> (reviews, years in business), and <b>contact</b> with a map and WhatsApp.</p>',
				'<p>Use the ready-made sections to go fast, then make every word and picture fit the business.</p>'
			].join(''),
			task: 'Build the page with at least <b>five sections</b>, including a <b>menu bar</b>, a <b>map</b>, a <b>WhatsApp or phone button</b>, and <b>no leftover sample text</b>.',
			start: 'blank',
			checks: [
				{ t: 'At least five sections', f: function (c) { return nodes(c, 'section').length >= 5; } },
				{ t: 'A menu bar with the business name', f: function (c) { return nodes(c, 'navbar').some(function (n) { return n.props.brand && !/my brand/i.test(n.props.brand); }); } },
				{ t: 'A map with the business location', f: function (c) { return nodes(c, 'map').some(function (n) { return n.props.q && !/kenyatta international/i.test(n.props.q); }); } },
				{ t: 'A WhatsApp or phone button', f: function (c) { return nodes(c, 'button').some(function (n) { return /^(tel:|https:\/\/wa\.me\/(?!254700000000))/i.test(n.props.href || ''); }) || nodes(c, 'navbar').some(function (n) { return /^(tel:|https:\/\/wa\.me\/)/i.test(n.props.ctaHref || ''); }); } },
				{ t: 'No sample text left', f: function (c) { return !/(your heading here|write something people|feature title|service \d|my brand|say in one sentence|short description of this item)/i.test(JSON.stringify(c.tree)); } }
			],
			hint: 'Add ready-made sections with <b>Add &rsaquo; Ready-made sections</b>, then change every word. Search the page for sample text in <b>Layers</b>.'
		},
		{
			id: 'proj-publish', module: 'm5', title: 'Publish and share', mins: 5, kind: 'publish',
			body: [
				'<p>A website only helps when people can see it. Publishing gives your project a public link you can share on WhatsApp, Instagram or a CV.</p>',
				'<p>Before sharing, check: does it look right on a phone? Do all buttons work? Are names and phone numbers correct? Is every picture clear?</p>',
				'<p>For a real client, the next step is a domain such as <code>mamanjeri.co.ke</code> and hosting. The page you built can then be moved to WordPress with the PLE plugin.</p>'
			].join(''),
			task: 'Open <b>My projects</b>, choose your landing page, and tap <b>Publish</b>. Then open the public link on your phone to test it.',
			checks: [
				{ t: 'At least one of your projects is published', f: function (c) { return c.published > 0; } }
			]
		},
		{
			id: 'wp-basics', module: 'm5', title: 'From Studio to WordPress', mins: 8, kind: 'read',
			body: [
				'<p><b>WordPress</b> runs over 40% of all websites. It gives clients a dashboard to manage pages, pictures, blogs and shops without code.</p>',
				'<div class="st-trio"><div><b>Theme</b><span>The overall look: header, footer, fonts</span></div><div><b>Plugin</b><span>Adds features, for example a shop, forms or SEO</span></div><div><b>Page builder</b><span>Design pages visually. <b>PLE</b> is one.</span></div></div>',
				'<p>The PLE plugin gives WordPress the same builder you have been using: <b>Edit with PLE</b> on any page, with the same widgets, Layers and phone view. That means your skills transfer straight to paid client work.</p>',
				'<p>A typical job: buy the domain, install WordPress from the hosting panel (Softaculous), install PLE, build the pages, connect a business email, and show the owner how to edit text and pictures.</p>'
			].join(''),
			quiz: [
				{ q: 'What does a WordPress plugin do?', o: ['Adds features to a site', 'Registers a domain', 'Speeds up your phone'], a: 0 },
				{ q: 'Where do you build a page visually in WordPress with PLE?', o: ['Edit with PLE', 'Settings > General', 'Tools > Export'], a: 0 },
				{ q: 'Which comes first when building a site for a client?', o: ['Write a blog post', 'Get a domain and hosting', 'Print business cards'], a: 1 }
			]
		},
		{
			id: 'final-check', module: 'm5', title: 'Final checkpoint', mins: 6, kind: 'quiz',
			body: '<p>Six questions covering the whole course. You need five right to finish and earn your certificate.</p>',
			quiz: [
				{ q: 'A client wants their phone number to call when tapped. Which link?', o: ['href="phone:0700..."', 'href="tel:0700..."', 'href="call://0700..."'], a: 1 },
				{ q: 'In a page builder, what holds columns?', o: ['A widget', 'A row', 'A button'], a: 1 },
				{ q: 'Text looks too big on phones only. What do you change?', o: ['The desktop font size', 'The phone font size (a media query)', 'The domain name'], a: 1 },
				{ q: 'Which makes a hero easy to read over a busy photo?', o: ['A dark overlay on the picture', 'More text', 'Smaller buttons'], a: 0 },
				{ q: 'Why add alt text to pictures?', o: ['Accessibility and search engines', 'To change the colour', 'To make a link'], a: 0 },
				{ q: 'What should a landing page always make easy?', o: ['Contacting or buying from the business', 'Reading long history', 'Playing music'], a: 0 }
			],
			pass: 5
		}
	];

	/* Ready pictures students can use in lessons and projects (no network needed). */
	var C = g.PLECore;
	var PICS = [['Shop front'], ['Team'], ['Fresh food'], ['Salon'], ['Farm produce'], ['Office']];

	g.PLE_LESSONS = { modules: MODULES, lessons: L, pics: PICS };
})(window);
