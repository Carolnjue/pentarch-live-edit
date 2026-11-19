/*!
 * PLE Design Lab content: section designs grouped by topic. Each design is a real builder tree,
 * so the Lab can show it live, play how it is built, guide a learner through it, and check practice work.
 */
(function (g) {
	'use strict';
	var C = g.PLECore;
	var BASE = ((document.currentScript && document.currentScript.src) || '').replace(/ple-academy-content\.js.*$/, 'pics/');
	var pic = function (n) { return BASE + String(n).toLowerCase().replace(/[^a-z]+/g, '-') + '.svg'; };
	var N = function (type, props, style, fx) { var n = C.node(type, props || {}, style || {}); if (fx) n.props.fx = fx; return n; };
	var S = function (rows, style, props) { return C.section(rows, style || {}, props || {}); };
	var R = function (cols, style, props) { return C.row(cols, style || {}, props || {}); };
	var K = function (kids, style, w) { return C.col(kids, style || {}, w); };
	var H = function (text, tag, style, fx) { return N('heading', { text: text, tag: tag || 'h2' }, style, fx); };
	var T = function (html, style, fx) { return N('text', { html: html }, style, fx); };
	var B = function (text, href, style, fx, props) { return N('button', Object.assign({ text: text, href: href || '#' }, props || {}), style, fx); };
	/* Simple wordmark logos for practice (fictional organisations). */
	var logo = function (name, c) { return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="220" height="60" viewBox="0 0 220 60"><circle cx="26" cy="30" r="16" fill="' + c + '"/><text x="50" y="38" font-family="Arial,Helvetica,sans-serif" font-size="22" font-weight="700" fill="#1e293b">' + name + '</text></svg>'); };
	var LOGOS = function () { return [['Ujuzi Hub', '#2563eb'], ['Savanna Bank', '#16a34a'], ['Kesho NGO', '#ea580c'], ['Mji Media', '#db2777'], ['Pwani Co.', '#0891b2']].map(function (x) { return { src: logo(x[0], x[1]), alt: x[0], href: '' }; }); };
	var INK = '#0f172a', BRAND = '#1d4ed8', GOLD = '#f59e0b', SOFT = '#f8fafc';
	var kicker = function (t, c) { return H(t, 'p', { size: 13, weight: '800', color: c || BRAND, mb: 8 }); };
	var title = function (t, extra) { return H(t, 'h2', Object.assign({ size: 38, weight: '800', align: 'center', m: { size: 28 } }, extra || {})); };

	var TOPICS = [
		{
			id: 'hero', name: 'Hero banners', icon: 'image', color: '#1d4ed8',
			blurb: 'The first screen visitors see. It must say who you are and what to do next, in five seconds.',
			tips: ['One clear headline that names the benefit, not just your name.', 'One main button. A second, quieter button is fine, never three.', 'Text must stay readable: use an overlay on photos and check it on a phone.'],
			designs: [
				{ id: 'hero-photo', name: 'Centred photo hero', demo: 1, note: 'Full-width photo, dark overlay, centred text and an animated entrance.', build: function () {
					return [S([R([K([
						kicker('PENTARCH TRAINING INSTITUTE', GOLD), H('Practical skills for real careers', 'h1', { size: 56, weight: '800', color: '#ffffff', align: 'center', m: { size: 34 } }, { 'in': 'fade-up' }),
						T('<p>Short professional courses taught by people who do the work every day.</p>', { size: 20, color: '#e2e8f0', align: 'center', m: { size: 17 } }, { 'in': 'fade-up', delay: 150 }),
						B('View courses', '#courses', { align: 'center', bg: GOLD, color: '#111827', radius: 999, mt: 16 }, { 'in': 'zoom-in', delay: 300, hover: 'lift' })
					])])], { bgImg: pic('team'), overlay: 'rgba(0,0,0,.6)', minH: 80, valign: 'center', pt: 120, pb: 120, m: { pt: 72, pb: 72 } })];
				} },
				{ id: 'hero-split', name: 'Split hero: words and picture', demo: 1, note: 'Text on the left, picture on the right, two buttons. Stacks neatly on phones.', build: function () {
					return [S([R([
						K([kicker('NEW INTAKE: JANUARY'), H('Design websites people trust', 'h1', { size: 50, weight: '800', color: INK, m: { size: 32 } }, { 'in': 'fade-right' }),
							T('<p>Learn on your phone, build real projects and graduate with a portfolio.</p>', { size: 19, color: '#475569' }, { 'in': 'fade-right', delay: 120 }),
							B('Apply now', '#apply', { bg: BRAND, radius: 10, mt: 10 }, { hover: 'lift' }), B('See the course', '#course', { mt: 10 }, null, { look: 'outline' })], { valign: 'center' }),
						K([N('image', { src: pic('office'), alt: 'Students working together' }, { radius: 24, shadow: '0 20px 50px rgba(0,0,0,.25)' }, { 'in': 'fade-left', delay: 200 })])
					], { gap: 48, valign: 'center' })], { bg: SOFT, pt: 96, pb: 96, m: { pt: 56, pb: 56 } })];
				} },
				{ id: 'hero-gradient', name: 'Gradient hero with glowing title', demo: 1, note: 'A rich colour gradient, gradient text and a moving background.', build: function () {
					return [S([R([K([
						H('Build the future, one page at a time', 'h1', { size: 58, weight: '800', align: 'center', gradText: '1', g1: '#fde68a', g2: '#f472b6', m: { size: 36 } }, { 'in': 'blur-in' }),
						T('<p>Web design, data and digital skills for the next generation of African creators.</p>', { size: 20, color: '#e0e7ff', align: 'center' }, { 'in': 'fade-up', delay: 200 }),
						B('Start free', '#start', { align: 'center', bg: '#ffffff', color: '#1e1b4b', radius: 999, mt: 14 }, { hover: 'glow' })
					])])], { grad1: '#1e1b4b', grad2: '#1d4ed8', gangle: 135, pt: 130, pb: 130, minH: 70, valign: 'center', m: { pt: 80, pb: 80 } }, { width: 'narrow' })];
				} },
				{ id: 'hero-carousel', name: 'Hero carousel', note: 'Three slides that change on their own, each with its own picture and button.', build: function () {
					var hs = N('heroslider', { effect: 'zoom', auto: 6000, h: 80 });
					hs.props.items = [
						{ kick: 'Pentarch Training Institute', title: 'Practical skills for real careers', text: 'Short courses taught by practitioners.', btn: 'View courses', href: '#courses', btn2: 'Talk to us', href2: '#contact', src: pic('team') },
						{ kick: 'New intake', title: 'Learn web design on your phone', text: 'No laptop needed. Real projects from day one.', btn: 'Register now', href: '#register', btn2: '', href2: '', src: pic('office') },
						{ kick: 'For organisations', title: 'Training designed around your team', text: 'Tailored programmes at your offices or online.', btn: 'Request a proposal', href: '#contact', btn2: '', href2: '', src: pic('shop front') }];
					return [S([R([K([hs])])], { pt: 0, pb: 0, px: 0 }, { width: 'full' })];
				} },
				{ id: 'hero-typing', name: 'Typing headline with particles', note: 'A dark hero where the headline types itself and dots float behind.', build: function () {
					var s = S([R([K([
						N('typing', { before: 'We train', words: 'web designers\ndata analysts\nanimators\nstorytellers', tag: 'h1' }, { size: 52, color: '#ffffff', align: 'center', m: { size: 32 } }),
						T('<p>Hands-on courses in Nairobi and online.</p>', { size: 19, color: '#cbd5e1', align: 'center' }),
						B('Find your course', '#courses', { align: 'center', bg: '#22d3ee', color: INK, radius: 999, mt: 12 }, { hover: 'grow' })
					])])], { bg: INK, pt: 120, pb: 120, minH: 70, valign: 'center' });
					s.props.particles = '#60a5fa';
					return [s];
				} },
				{ id: 'hero-stats', name: 'Hero with a numbers strip', note: 'A photo hero with three animated counters under the headline.', build: function () {
					var c = function (num, suffix, label) { return K([N('counter', { num: num, suffix: suffix, label: label }, { color: '#ffffff', align: 'center' })]); };
					return [S([
						R([K([H('Trusted training since 2019', 'h1', { size: 54, weight: '800', color: '#ffffff', m: { size: 34 } }, { 'in': 'fade-up' }), T('<p>Over a thousand graduates now work in media, tech and research.</p>', { size: 19, color: '#e2e8f0' }), B('Join them', '#apply', { bg: GOLD, color: '#111827', radius: 8, mt: 8 })])]),
						R([c(1500, '+', 'Graduates'), c(12, '', 'Courses'), c(98, '%', 'Would recommend')], { gap: 24, mt: 40 })
					], { bgImg: pic('salon'), overlay: 'rgba(0,0,0,.6)', pt: 110, pb: 80 })];
				} }
			]
		},
		{
			id: 'header', name: 'Headers and menus', icon: 'menu', color: '#0f766e',
			blurb: 'The menu helps people find their way. Keep it short, clear and always within reach.',
			tips: ['Five to seven links at most. Group the rest in a dropdown.', 'Put one call-to-action button on the right.', 'Make it stick to the top so it is always available.'],
			designs: [
				{ id: 'nav-classic', name: 'Clean white menu', demo: 1, note: 'Logo left, links in the middle, a button on the right. Sticks when you scroll.', build: function () {
					return [S([R([K([N('navbar', { brand: 'Kilele Academy', links: 'Home|#\nCourses|#courses\nAbout|#about\nContact|#contact', cta: 'Apply now', ctaHref: '#apply' }, { shadow: '0 2px 8px rgba(0,0,0,.08)' }, { sticky: 'top' })])])], { pt: 0, pb: 0, px: 0 }, { tag: 'header', width: 'full' })];
				} },
				{ id: 'nav-dark', name: 'Dark menu with a bright button', demo: 1, note: 'A confident dark header that makes the button glow.', build: function () {
					return [S([R([K([N('navbar', { brand: 'Kilele Academy', links: 'Home|#\nCourses|#courses\nStories|#stories\nContact|#contact', cta: 'WhatsApp us', ctaHref: 'https://wa.me/254700000000' }, { bg: INK, color: '#ffffff', ac: GOLD }, { sticky: 'top', hide: '1' })])])], { pt: 0, pb: 0, px: 0 }, { tag: 'header', width: 'full' })];
				} },
				{ id: 'nav-topbar', name: 'Info bar above the menu', note: 'A thin strip with phone and email, then the main menu.', build: function () {
					return [S([
						R([K([T('<p>Call +254 700 000 000 &middot; hello@kilele.ac.ke</p>', { size: 14, color: '#ffffff' })]), K([T('<p>Mon to Fri, 8am to 5pm</p>', { size: 14, color: '#ffffff', align: 'right', m: { align: 'left' } })])], { bg: BRAND, pt: 8, pb: 8, px: 20, gap: 8 }),
						R([K([N('navbar', { brand: 'Kilele Academy', cta: 'Apply now' })])])
					], { pt: 0, pb: 0, px: 0 }, { tag: 'header', width: 'full' })];
				} },
				{ id: 'nav-mega', name: 'Mega menu header', note: 'Big dropdown panels for sites with many pages, like courses by category.', build: function () {
					return [S([R([K([N('megamenu')])])], { pt: 0, pb: 0, px: 0 }, { tag: 'header', width: 'full' })];
				} }
			]
		},
		{
			id: 'about', name: 'About sections', icon: 'users', color: '#0d9488',
			blurb: 'Tell your story so visitors trust the people behind the business.',
			tips: ['Show real people or real work, not only words.', 'Lead with what you believe and who you help, then the facts.', 'Finish with a clear next step.'],
			designs: [
				{ id: 'ab-split', name: 'Picture and story', demo: 1, note: 'A rounded photo beside your story, with a checklist and a button.', build: function () {
					return [S([R([
						K([N('image', { src: pic('team'), alt: 'Our trainers with students' }, { radius: 24, shadow: '0 20px 50px rgba(0,0,0,.25)' }, { 'in': 'fade-right' })]),
						K([kicker('ABOUT US'), H('Trainers who do the work every day', 'h2', { size: 38, weight: '800', m: { size: 28 } }), T('<p>We started in 2019 with one classroom and a belief: practical skills change lives faster than theory.</p>', { color: '#475569' }), N('list', { items: 'Working professionals as trainers\nSmall classes and mentoring\nCertificates employers recognise' }), B('Meet the team', '#team', { mt: 10, radius: 10 })], { valign: 'center' })
					], { gap: 56, valign: 'center' })], { bg: SOFT }, { anchor: 'about' })];
				} },
				{ id: 'ab-values', name: 'Mission and values', note: 'A short mission statement, then three value boxes with pictures.', build: function () {
					var v = function (src, t, x) { return K([N('imagebox', { src: pic(src), title: t, text: x }, {}, { hover: 'lift' })]); };
					return [S([R([K([kicker('OUR MISSION'), title('Skills for every young African with a phone'), T('<p>We make professional training practical, affordable and mobile.</p>', { align: 'center', color: '#475569', mb: 24 })])]), R([v('office', 'Practical', 'Every lesson ends with something you made.'), v('team', 'Together', 'Learn in a class, never alone.'), v('shop front', 'For work', 'Skills that clients pay for.')], { gap: 24 })])];
				} },
				{ id: 'ab-quote', name: 'Founder\u2019s note', note: 'A personal note from the founder with a star rating for proof.', build: function () {
					return [S([R([K([N('image', { src: pic('salon'), alt: 'Our founder' }, { radius: 999, maxw: 80, ratio: '1/1', align: 'center' })], { valign: 'center' }, 1), K([H('\u201cWe built the school we wished we had.\u201d', 'p', { size: 28, weight: '700', lh: 1.35 }), T('<p>Caroline Njue, founder</p>', { color: '#475569' }), N('rating')], { valign: 'center' }, 2)], { gap: 40 })], { bg: '#f0fdfa' }, { width: 'narrow' })];
				} }
			]
		},
		{
			id: 'team', name: 'Team and trust', icon: 'award', color: '#4f46e5',
			blurb: 'Faces and logos make a business feel real and safe to choose.',
			tips: ['Use the same photo shape and size for every person.', 'Name, role and one line each. Put details in a pop-up.', 'Show partner logos in a calm grey strip.'],
			designs: [
				{ id: 'tm-cards', name: 'Team cards', demo: 1, note: 'Three team members with photos; tap a card for their full bio.', build: function () {
					var m = function (src, n, r) { return K([N('team', { src: pic(src), name: n, role: r }, {}, { hover: 'lift' })]); };
					return [S([R([K([title('Meet your trainers', { mb: 24 })])]), R([m('team', 'Caroline Njue', 'Lead trainer, design'), m('office', 'Brian Otieno', 'Data analysis'), m('salon', 'Faith Wanjiru', 'Media and animation')], { gap: 24 })], {}, { anchor: 'team' })];
				} },
				{ id: 'tm-logos', name: 'Moving logo strip', note: 'Partner logos that glide across the screen.', build: function () {
					return [S([R([K([T('<p>Trusted by organisations across East Africa</p>', { align: 'center', color: '#64748b', size: 14 }), (function () { var l = N('logos', { speed: 25 }); l.props.items = LOGOS(); return l; })()])])], { bg: SOFT, pt: 32, pb: 32 })];
				} },
				{ id: 'tm-marquee', name: 'Scrolling words banner', note: 'A bold band of words that scrolls forever, great between sections.', build: function () {
					return [S([R([K([N('marquee', { text: 'Web design \u2022 Data analysis \u2022 AI animation \u2022 Public relations \u2022 Research', speed: 20 }, { color: '#ffffff', size: 28 })])])], { bg: '#4f46e5', pt: 18, pb: 18, px: 0 }, { width: 'full' })];
				} }
			]
		},
		{
			id: 'services', name: 'Service cards', icon: 'card', color: '#7c3aed',
			blurb: 'Show what you offer in a grid people can scan in seconds.',
			tips: ['Three or four cards in a row on desktop, one per row on phones.', 'Every card: an icon or picture, a short title and one line of text.', 'Same height and style for every card. Add a hover effect so it feels alive.'],
			designs: [
				{ id: 'svc-icons', name: 'Icon cards with hover lift', demo: 1, note: 'Three soft cards with icons that rise when you point at them.', build: function () {
					var card = function (ic, t, x, d) { return K([N('iconbox', { icon: ic, title: t, text: x }, { bg: '#ffffff', radius: 18, pt: 28, pb: 28, px: 24, shadow: '0 10px 30px rgba(0,0,0,.15)', ic: BRAND }, { 'in': 'fade-up', delay: d, hover: 'lift' })]); };
					return [S([
						R([K([kicker('WHAT WE TEACH'), title('Courses that lead to work'), T('<p>Every course ends with a real project for your portfolio.</p>', { align: 'center', color: '#475569', mb: 24 })])]),
						R([card('code', 'Web design', 'Build fast, beautiful websites for real clients.', 0), card('chart', 'Data analysis', 'Turn numbers into decisions with Excel and Power BI.', 120), card('video', 'AI animation', 'Create explainer videos and stories in days.', 240)], { gap: 24 })
					], { bg: SOFT })];
				} },
				{ id: 'svc-pictures', name: 'Picture cards', demo: 1, note: 'Cards with photos, a title, a line of text and a link.', build: function () {
					var card = function (src, t, x) { return K([N('card', { src: pic(src), title: t, text: x, btn: 'Learn more', href: '#' }, { radius: 18 }, { hover: 'lift' })]); };
					return [S([
						R([K([title('Our services', { mb: 24 })])]),
						R([card('office', 'Corporate training', 'Programmes designed for your team.'), card('team', 'Short courses', 'Five-day practical courses every month.'), card('shop front', 'Digital services', 'Websites and media for businesses.')], { gap: 24 })
					])];
				} },
				{ id: 'svc-flip', name: 'Flip boxes', note: 'Cards that turn over to reveal more detail and a button.', build: function () {
					var f = function (ic, t, bt, c) { return K([N('flipbox', { icon: ic, ftitle: t, ftext: 'Tap or point to learn more', btitle: bt, btext: 'Practical sessions, real tools and a certificate at the end.', btn: 'Enrol', href: '#apply' }, { ff: c, fb: INK })]); };
					return [S([R([K([title('Choose your path', { mb: 24 })])]), R([f('code', 'Build', 'Web design', '#1d4ed8'), f('chart', 'Analyse', 'Data skills', '#0f766e'), f('video', 'Create', 'Animation', '#be123c')], { gap: 20 })])];
				} },
				{ id: 'svc-list', name: 'Two-column feature list', note: 'Icons on the left of each line: great for many small services.', build: function () {
					var ib = function (ic, t, x) { return N('iconbox', { icon: ic, title: t, text: x }, { layout: 'row', mb: 20, ic: '#16a34a' }); };
					return [S([R([K([title('Everything you need', { mb: 28 })])]), R([K([ib('check', 'Small classes', 'No more than 20 students.'), ib('users', 'Mentors', 'Working professionals guide you.')]), K([ib('award', 'Certificate', 'Recognised by employers.'), ib('phone', 'Learn on mobile', 'All lessons work on a phone.')])], { gap: 40 })], {}, { width: 'narrow' })];
				} },
				{ id: 'svc-dark', name: 'Dark cards with glowing icons', note: 'A dark section where light cards and bright icons stand out.', build: function () {
					var c = function (ic, t, x) { return K([N('iconbox', { icon: ic, title: t, text: x }, { bg: '#1e293b', color: '#e2e8f0', radius: 16, pt: 28, pb: 28, px: 24, ic: '#22d3ee', border: '1px solid #e5e7eb' }, { hover: 'glow' })]); };
					return [S([R([K([title('Why students choose us', { color: '#ffffff', mb: 28 })])]), R([c('bolt', 'Fast start', 'Begin within a week.'), c('shield', 'Trusted', 'Registered and accredited.'), c('heart', 'Supportive', 'Help whenever you need it.')], { gap: 24 })], { bg: INK })];
				} }
			]
		},
		{
			id: 'journey', name: 'Journeys and steps', icon: 'arrow', color: '#ea580c',
			blurb: 'Show people exactly what happens next. Clear steps remove fear and bring more sign-ups.',
			tips: ['Three to five steps. Each one starts with a verb: Apply, Learn, Graduate.', 'Number the steps or connect them with a line so the order is obvious.', 'End with the outcome people want.'],
			designs: [
				{ id: 'jr-steps', name: 'Journey steps', demo: 1, note: 'Four connected steps with icons.', build: function () {
					return [S([R([K([kicker('HOW IT WORKS'), title('From sign-up to certificate', { mb: 30 }), N('journey', {}, {}, { 'in': 'fade-up' })])])])];
				} },
				{ id: 'jr-timeline', name: 'Timeline', demo: 1, note: 'Milestones along a line: great for history or a programme schedule.', build: function () {
					return [S([R([K([title('Our story', { mb: 30 }), N('timeline')])])], { bg: SOFT }, { width: 'narrow' })];
				} },
				{ id: 'jr-numbers', name: 'Big numbered steps', note: 'Large gradient numbers above each step.', build: function () {
					var st = function (n, t, x) { return K([H(n, 'p', { size: 56, weight: '800', gradText: '1', g1: '#f97316', g2: '#db2777', mb: 4 }), H(t, 'h3', { size: 22, mb: 6 }), T('<p>' + x + '</p>', { color: '#475569' })]); };
					return [S([R([K([title('Three simple steps', { mb: 30 })])]), R([st('01', 'Apply', 'Fill in a two-minute form.'), st('02', 'Learn', 'Join classes on your phone or in person.'), st('03', 'Graduate', 'Get your certificate and portfolio.')], { gap: 32 })])];
				} },
				{ id: 'jr-tabs', name: 'Step-by-step tabs', note: 'Tabs that show one step at a time.', build: function () {
					var t = N('tabs'); t.props.items = [{ title: '1. Apply', html: '<p>Fill in the short online form.</p>' }, { title: '2. Interview', html: '<p>A friendly ten-minute call.</p>' }, { title: '3. Start', html: '<p>Join your class and meet your mentor.</p>' }];
					return [S([R([K([title('Your first week', { mb: 24 }), t])])], {}, { width: 'narrow' })];
				} }
			]
		},
		{
			id: 'testimonials', name: 'Testimonials', icon: 'users', color: '#db2777',
			blurb: 'Real words from real people are the strongest proof you can show.',
			tips: ['Use full names, roles and photos when you can.', 'Short quotes work best: one or two sentences.', 'Put testimonials near buttons, where people decide.'],
			designs: [
				{ id: 'ts-slider', name: 'Testimonial slider', demo: 1, note: 'Quotes that slide by themselves, two at a time on desktop.', build: function () {
					return [S([R([K([kicker('STUDENT STORIES'), title('What our graduates say', { mb: 24 }), N('testimonials')])])], { bg: SOFT })];
				} },
				{ id: 'ts-cards', name: 'Three quote cards', note: 'Each quote in its own white card with a name underneath.', build: function () {
					var q = function (x, n) { return K([T('<p>\u201c' + x + '\u201d</p>', { size: 18 }), H(n, 'p', { size: 14, weight: '800', color: BRAND, mt: 8 })], { bg: '#ffffff', radius: 16, pt: 24, pb: 24, px: 24, shadow: '0 10px 30px rgba(0,0,0,.15)' }); };
					return [S([R([K([title('Loved by students', { mb: 24 })])]), R([q('I built my first client website in week three.', 'Achieng, Kisumu'), q('Clear lessons that work on my phone.', 'Brian, Nakuru'), q('The mentors really care.', 'Faith, Nairobi')], { gap: 24 })], { bg: '#eef2ff' })];
				} },
				{ id: 'ts-big', name: 'One big quote', note: 'A single powerful quote centred on a dark background.', build: function () {
					return [S([R([K([H('\u201cThis course changed my career. Six months later I run my own studio.\u201d', 'p', { size: 30, weight: '600', color: '#ffffff', align: 'center', lh: 1.4, m: { size: 22 } }, { 'in': 'fade', text: 'words' }), H('Wanjiru Kamau, founder of Kamau Creative', 'p', { size: 15, color: GOLD, align: 'center', mt: 16 })])])], { bg: '#111827', pt: 100, pb: 100 }, { width: 'narrow' })];
				} },
				{ id: 'ts-video', name: 'Video story with rating', note: 'A student video that opens in a pop-up, with a star rating and a short quote.', build: function () {
					return [S([R([K([N('videobox', { src: pic('team'), label: 'Watch Achieng\u2019s story' }, { radius: 20 }, { hover: 'lift' })], { valign: 'center' }), K([N('rating', { label: 'Rated 4.9 by 300 students' }), H('\u201cI found my first client in week three.\u201d', 'p', { size: 26, weight: '700', lh: 1.35, mt: 10 }), T('<p>Achieng Otieno, web designer, Kisumu</p>', { color: '#64748b' })], { valign: 'center' })], { gap: 48, valign: 'center' })], { bg: '#fdf2f8' })];
				} }
			]
		},
		{
			id: 'stats', name: 'Numbers and stats', icon: 'chart', color: '#0891b2',
			blurb: 'Numbers build trust fast. Make them big, few and easy to understand.',
			tips: ['Three or four numbers is enough.', 'Count up when they appear: movement draws the eye.', 'Use a contrasting band so the numbers stand out.'],
			designs: [
				{ id: 'st-band', name: 'Dark stats band', demo: 1, note: 'Four counting numbers on a dark band.', build: function () {
					return [S([R([K([N('stats', {}, { color: '#ffffff' })])])], { bg: INK, color: '#ffffff', pt: 56, pb: 56 })];
				} },
				{ id: 'st-counters', name: 'Counters with icons', note: 'Icon, number and label in four columns.', build: function () {
					var c = function (ic, num, suf, l) { return K([N('icon', { icon: ic }, { align: 'center' }), N('counter', { num: num, suffix: suf, label: l }, { align: 'center' })]); };
					return [S([R([c('users', 1500, '+', 'Graduates'), c('book', 12, '', 'Courses'), c('award', 40, '+', 'Partners'), c('heart', 98, '%', 'Satisfaction')], { gap: 24 })], { bg: '#ecfeff' })];
				} },
				{ id: 'st-progress', name: 'Skill bars', note: 'Progress bars that fill as you scroll.', build: function () {
					var pg = N('progress'); pg.props.items = [{ label: 'Web design', val: 92 }, { label: 'Content writing', val: 80 }, { label: 'Social media', val: 75 }];
					return [S([R([K([title('What graduates can do', { align: 'left', mb: 16 }), T('<p>Skills measured at the end of the course.</p>', { color: '#475569' })], { valign: 'center' }), K([pg])], { gap: 40 })])];
				} },
				{ id: 'st-chart', name: 'Growth chart', note: 'A bar chart that shows growth year by year, beside a short explanation.', build: function () {
					return [S([R([K([kicker('OUR GROWTH'), H('More graduates every year', 'h2', { size: 36, weight: '800' }), T('<p>Since 2023 our graduate numbers have nearly quadrupled.</p>', { color: '#475569' })], { valign: 'center' }), K([N('chart', { unit: ' graduates' })], { bg: '#ffffff', radius: 18, pt: 24, pb: 24, px: 24, shadow: '0 10px 30px rgba(0,0,0,.15)' })], { gap: 40 })], { bg: '#ecfeff' })];
				} }
			]
		},
		{
			id: 'pricing', name: 'Pricing', icon: 'cart', color: '#16a34a',
			blurb: 'Clear prices make decisions easy. Highlight the plan you want most people to choose.',
			tips: ['Three plans is the sweet spot. Highlight the middle one.', 'List what each plan includes in short lines.', 'Every plan gets its own button.'],
			designs: [
				{ id: 'pr-three', name: 'Three plans, middle highlighted', demo: 1, note: 'Classic pricing tables with a "Most popular" badge.', build: function () {
					return [S([R([K([title('Simple, fair prices', { mb: 24 })])]), R([K([N('pricing', { title: 'Starter', price: 'KSh 15,000' })]), K([N('pricing', { hot: '1', badge: 'Most popular' })]), K([N('pricing', { title: 'Organisations', price: 'Custom', period: 'quote' })])], { gap: 24 })], { bg: SOFT })];
				} },
				{ id: 'pr-list', name: 'Price list', note: 'A menu-style list of items and prices.', build: function () {
					return [S([R([K([title('Course fees', { mb: 20 }), N('pricelist')])])], {}, { width: 'narrow' })];
				} },
				{ id: 'pr-two', name: 'Two plans on colour', note: 'Two plans side by side on a gradient background.', build: function () {
					return [S([R([K([title('Pick your pace', { color: '#ffffff', mb: 24 })])]), R([K([N('pricing', { title: 'Weekend', price: 'KSh 18,000' })]), K([N('pricing', { title: 'Full-time', price: 'KSh 25,000', hot: '1', badge: 'Best value' })])], { gap: 24 })], { grad1: '#065f46', grad2: '#0f766e', gangle: 160 }, { width: 'narrow' })];
				} }
			]
		},
		{
			id: 'cta', name: 'Calls to action', icon: 'bolt', color: '#e11d48',
			blurb: 'A call to action tells people exactly what to do now. Make it impossible to miss.',
			tips: ['One message and one button.', 'Use a colour that contrasts with the rest of the page.', 'Make the button say what happens: "Chat on WhatsApp", not "Click here".'],
			designs: [
				{ id: 'cta-box', name: 'Gradient call-to-action box', demo: 1, note: 'A rounded gradient box with a strong button.', build: function () {
					return [S([R([K([N('ctabox', { title: 'Ready to start?', text: 'Talk to our admissions team today.', btn: 'Chat on WhatsApp' }, { c1: '#be123c', c2: '#7c3aed' }, { 'in': 'zoom-in' })])])])];
				} },
				{ id: 'cta-band', name: 'Bright WhatsApp band', demo: 1, note: 'A full-width green band with a pulsing button.', build: function () {
					return [S([R([K([H('Questions? We reply in minutes.', 'h2', { size: 34, color: '#ffffff', align: 'center', m: { size: 26 } }), B('Chat on WhatsApp', 'https://wa.me/254700000000', { align: 'center', bg: '#ffffff', color: '#15803d', radius: 999, mt: 10 }, { loop: 'pulse' }, { newtab: '1' })])])], { bg: '#16a34a', pt: 56, pb: 56 }, { width: 'narrow' })];
				} },
				{ id: 'cta-photo', name: 'Photo call to action', note: 'A photo background with a dark overlay and centred message.', build: function () {
					return [S([R([K([H('Your new career starts this month', 'h2', { size: 40, color: '#ffffff', align: 'center', m: { size: 28 } }), B('Reserve your place', '#apply', { align: 'center', bg: GOLD, color: '#111827', radius: 8, mt: 12 })])])], { bgImg: pic('office'), overlay: 'rgba(0,0,0,.6)', pt: 110, pb: 110 })];
				} },
				{ id: 'cta-countdown', name: 'Countdown to the deadline', note: 'A countdown timer that creates urgency before a deadline.', build: function () {
					return [S([R([K([H('Applications close soon', 'h2', { size: 34, align: 'center', color: '#ffffff' }), N('countdown'), B('Apply before it ends', '#apply', { align: 'center', bg: '#f43f5e', radius: 999, mt: 16 })])])], { bg: '#1e1b4b' }, { width: 'narrow' })];
				} }
			]
		},
		{
			id: 'gallery', name: 'Galleries', icon: 'image', color: '#9333ea',
			blurb: 'Pictures prove your work is real. Show them big, sharp and in order.',
			tips: ['Use pictures of the same shape for a tidy grid.', 'Let people tap to see a picture full screen.', 'Six to nine pictures is plenty; link to more.'],
			designs: [
				{ id: 'gl-grid', name: 'Even grid with lightbox', demo: 1, note: 'Square pictures that open full screen.', build: function () {
					var gl = N('gallery'); gl.props.items = ['team', 'office', 'salon', 'shop front', 'fresh food', 'farm produce'].map(function (p, i) { return { src: pic(p), cap: ['Graduation', 'Class time', 'Salon project', 'Client shop', 'Food brand', 'Farm brand'][i] }; });
					return [S([R([K([title('Inside our classes', { mb: 24 }), gl])])])];
				} },
				{ id: 'gl-masonry', name: 'Masonry wall', note: 'Pictures of different heights fitted together like bricks.', build: function () {
					var gl = N('gallery', { layout: 'masonry', cols: 3 }); gl.props.items = ['office', 'team', 'fresh food', 'salon', 'farm produce', 'shop front'].map(function (p) { return { src: pic(p), cap: '' }; });
					return [S([R([K([gl])])], { bg: '#faf5ff' })];
				} },
				{ id: 'gl-carousel', name: 'Project carousel', note: 'Cards that slide sideways, three at a time.', build: function () {
					var cr = N('carousel'); cr.props.items = [['team', 'Kilele website'], ['salon', 'Glamour salon'], ['fresh food', 'Mama Njeri\u2019s Kitchen'], ['shop front', 'Duka Bora']].map(function (x) { return { src: pic(x[0]), title: x[1], text: 'Built by our students.', href: '#' }; });
					return [S([R([K([title('Student projects', { mb: 24 }), cr])])])];
				} },
				{ id: 'gl-compare', name: 'Before and after', note: 'Drag the handle to compare a website before and after the makeover.', build: function () {
					return [S([R([K([title('Before and after the course', { mb: 20 }), N('compare', { before: pic('shop front'), after: pic('fresh food'), bl: 'Before', al: 'After' }, {}, { 'in': 'zoom-in' })])])], {}, { width: 'narrow' })];
				} }
			]
		},
		{
			id: 'faq', name: 'FAQs', icon: 'book', color: '#ca8a04',
			blurb: 'Answer the questions people are afraid to ask. Every good answer removes a reason to leave.',
			tips: ['Write questions the way customers ask them.', 'Keep answers to two or three sentences.', 'Open one answer at a time to keep the page tidy.'],
			designs: [
				{ id: 'fq-simple', name: 'Simple FAQ', demo: 1, note: 'A narrow column of questions that open and close.', build: function () {
					return [S([R([K([title('Frequently asked questions', { mb: 20 }), N('accordion')])])], {}, { width: 'narrow' })];
				} },
				{ id: 'fq-split', name: 'Heading beside the questions', note: 'Heading and contact button on the left, questions on the right.', build: function () {
					return [S([R([K([H('Questions?', 'h2', { size: 40, weight: '800' }), T('<p>Can\u2019t find your answer? Talk to us.</p>', { color: '#475569' }), B('Contact us', '#contact', { mt: 8 })], {}, 1), K([N('accordion')], {}, 2)], { gap: 48 })], { bg: '#fefce8' })];
				} },
				{ id: 'fq-tabs', name: 'FAQs sorted into tabs', note: 'Questions grouped by topic in tabs, so people find answers faster.', build: function () {
					var t = N('tabs'); t.props.items = [{ title: 'Courses', html: '<p><b>Do I need a laptop?</b> No, you can learn on your phone.</p><p><b>How long is a course?</b> Five days to six weeks.</p>' }, { title: 'Fees', html: '<p><b>Can I pay in instalments?</b> Yes, in two or three parts by M-Pesa.</p>' }, { title: 'Certificates', html: '<p><b>Do I get a certificate?</b> Yes, when you finish every lesson.</p>' }];
					return [S([R([K([title('Questions people ask', { mb: 20 }), t])])], { bg: SOFT }, { width: 'narrow' })];
				} }
			]
		},
		{
			id: 'contact', name: 'Contact sections', icon: 'mail', color: '#2563eb',
			blurb: 'Make it effortless to reach you: phone, WhatsApp, a form and a map.',
			tips: ['Show the phone number as text people can tap.', 'Keep forms short: name, phone and a message.', 'Tell people how fast you reply.'],
			designs: [
				{ id: 'ct-form', name: 'Contact details and form card', demo: 1, note: 'Details on the left, a form in a white card on the right.', build: function () {
					return [S([R([
						K([H('Send us a message', 'h2', { size: 36 }), T('<p>We reply within one working day.</p>', { color: '#475569' }), N('iconbox', { icon: 'phone', title: 'Call or WhatsApp', text: '+254 700 000 000' }, { layout: 'row' }), N('iconbox', { icon: 'pin', title: 'Visit', text: 'Moi Avenue, Nairobi' }, { layout: 'row' })]),
						K([N('form')], { bg: '#ffffff', radius: 18, pt: 24, pb: 24, px: 24, shadow: '0 10px 30px rgba(0,0,0,.15)' })
					], { gap: 40 })], { bg: '#f1f5f9' }, { anchor: 'contact' })];
				} },
				{ id: 'ct-map', name: 'Contact with map', note: 'Icon boxes beside a map of your location.', build: function () {
					return [S([R([K([H('Find us', 'h2', { size: 34 }), N('iconbox', { icon: 'phone', title: 'Phone', text: '+254 700 000 000' }, { layout: 'row', mb: 12 }), N('iconbox', { icon: 'mail', title: 'Email', text: 'hello@kilele.ac.ke' }, { layout: 'row', mb: 12 }), N('iconbox', { icon: 'pin', title: 'Visit', text: 'Moi Avenue, Nairobi' }, { layout: 'row' })]), K([N('map', {}, { radius: 16 })])], { gap: 40 })])];
				} },
				{ id: 'ct-dark', name: 'Dark contact band', note: 'A dark section with a form and a WhatsApp button.', build: function () {
					return [S([R([K([H('Let\u2019s talk', 'h2', { size: 40, color: '#ffffff' }), T('<p>Prefer WhatsApp? Tap below.</p>', { color: '#cbd5e1' }), B('WhatsApp us', 'https://wa.me/254700000000', { bg: '#22c55e', radius: 999 }, null, { newtab: '1' })]), K([N('form')], { bg: '#ffffff', radius: 16, pt: 20, pb: 20, px: 20 })], { gap: 40, valign: 'center' })], { bg: INK })];
				} },
				{ id: 'ct-pay', name: 'Enrol and pay', note: 'Next intake dates beside an M-Pesa payment box: everything needed to join today.', build: function () {
					return [S([R([K([H('Join the next intake', 'h2', { size: 36, weight: '800' }), N('intakes')]), K([N('mpesa')], { valign: 'center' })], { gap: 40 })], { bg: '#f0fdf4' }, { anchor: 'apply' })];
				} }
			]
		},
		{
			id: 'footer', name: 'Footers', icon: 'rows', color: '#334155',
			blurb: 'The footer catches people who scrolled to the end. Give them links, contacts and a last nudge.',
			tips: ['Group links into short columns with headings.', 'Repeat your phone, email and social links.', 'Add the copyright line and keep it calm and dark.'],
			designs: [
				{ id: 'ft-columns', name: 'Three-column dark footer', demo: 1, note: 'Brand, links and social in three columns, copyright below.', build: function () {
					return [S([
						R([K([H('Kilele Academy', 'h3', { color: '#ffffff' }), T('<p>Practical skills for real careers.</p>', { color: '#94a3b8' })]), K([H('Links', 'h4', { color: '#ffffff' }), T('<p><a href="#courses">Courses</a><br><a href="#about">About</a><br><a href="#contact">Contact</a></p>', { color: '#cbd5e1' })]), K([H('Follow us', 'h4', { color: '#ffffff' }), N('social')])]),
						R([K([N('divider', {}, { lc: '#334155', lw: 1 }), T('<p>&copy; 2026 Kilele Academy. All rights reserved.</p>', { color: '#94a3b8', size: 14, align: 'center' })])])
					], { bg: INK, pt: 56, pb: 24 }, { tag: 'footer' })];
				} },
				{ id: 'ft-centre', name: 'Centred minimal footer', note: 'Logo text, a row of links and copyright, all centred.', build: function () {
					return [S([R([K([H('Kilele Academy', 'h3', { align: 'center' }), T('<p><a href="#">Courses</a> &middot; <a href="#">About</a> &middot; <a href="#">Contact</a></p>', { align: 'center', color: '#475569' }), T('<p>&copy; 2026 Kilele Academy</p>', { align: 'center', size: 13, color: '#94a3b8' })])])], { bg: SOFT, pt: 40, pb: 32 }, { tag: 'footer', width: 'narrow' })];
				} },
				{ id: 'ft-cta', name: 'Footer with a final call to action', note: 'A big closing message and button above the footer links.', build: function () {
					return [S([
						R([K([H('Ready when you are.', 'h2', { size: 44, color: '#ffffff', m: { size: 30 } }), B('Apply today', '#apply', { bg: GOLD, color: '#111827', radius: 999 })], {}, 2), K([T('<p>hello@kilele.ac.ke<br>+254 700 000 000</p>', { color: '#cbd5e1', align: 'right', m: { align: 'left' } })], { valign: 'flex-end' }, 1)], { gap: 32 }),
						R([K([N('divider', {}, { lc: '#1e293b', lw: 1, mt: 32 }), T('<p>&copy; 2026 Kilele Academy</p>', { size: 13, color: '#64748b' })])])
					], { grad1: '#0f172a', grad2: '#1e3a8a', gangle: 180, pt: 72, pb: 24 }, { tag: 'footer' })];
				} }
			]
		}
	];

	g.PLE_LAB = { topics: TOPICS, pic: pic };
})(window);
