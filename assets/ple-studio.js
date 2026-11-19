/*!
 * PLE Studio: mobile-first web design learning platform.
 * Views: welcome/auth, home, learn, lesson, projects, project editor (builder or code), classes, class, me.
 */
(function () {
	'use strict';
	var S = window.PLE_STUDIO, C = window.PLECore, E = window.PLEEditor, LS = window.PLE_LESSONS;
	var h = C.h, esc = C.esc, icon = C.icon;
	var app = document.getElementById('st-app');
	var state = { me: S.me, progress: S.progress || {}, projects: null, classes: null };
	var LESSONS = LS.lessons, MODS = LS.modules;
	var byId = {}; LESSONS.forEach(function (l, i) { l.n = i; byId[l.id] = l; });
	var store = {
		get: function (k, d) { try { var v = localStorage.getItem('ple:' + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
		set: function (k, v) { try { localStorage.setItem('ple:' + k, JSON.stringify(v)); } catch (e) { } },
		del: function (k) { try { localStorage.removeItem('ple:' + k); } catch (e) { } }
	};

	/* ------------------------------------------------------------ API */
	function api(path, opt) {
		opt = opt || {};
		var init = { method: opt.method || 'GET', credentials: 'same-origin', headers: {} };
		if (S.nonce) init.headers['X-WP-Nonce'] = S.nonce;
		if (opt.form) init.body = opt.form;
		else if (opt.body) { init.headers['Content-Type'] = 'application/json'; init.body = JSON.stringify(opt.body); }
		return fetch(S.rest + path, init).then(function (r) {
			return r.text().then(function (t) {
				var j = null; try { j = t ? JSON.parse(t) : null; } catch (e) { }
				if (r.status === 403 && j && j.code === 'rest_cookie_invalid_nonce') { location.reload(); throw new Error('Refreshing your session\u2026'); }
				if (!r.ok) throw new Error(j && j.message ? j.message.replace(/<[^>]+>/g, '') : (navigator.onLine ? 'Something went wrong (' + r.status + '). Please try again.' : 'You are offline. Connect to the internet and try again.'));
				return j;
			});
		}, function () { throw new Error('You are offline. Your work is kept on this phone; try again when connected.'); });
	}
	var toastT;
	function toast(msg, kind) {
		var t = document.querySelector('.st-toast') || document.body.appendChild(h('div', { class: 'st-toast', role: 'status', 'aria-live': 'polite' }));
		t.textContent = msg; t.className = 'st-toast on ' + (kind || '');
		clearTimeout(toastT); toastT = setTimeout(function () { t.className = 'st-toast'; }, 3200);
	}
	function modal(title, body, actions) {
		var m = h('div', { class: 'st-modal', role: 'dialog', 'aria-modal': 'true', 'aria-label': title });
		var close = function () { m.remove(); document.removeEventListener('keydown', esc_); };
		var esc_ = function (e) { if (e.key === 'Escape') close(); };
		document.addEventListener('keydown', esc_);
		var box = h('div', { class: 'st-mbox' });
		box.appendChild(h('div', { class: 'st-mhead' }, [h('h3', { text: title }), h('button', { type: 'button', class: 'st-x', 'aria-label': 'Close', onclick: close }, '&times;')]));
		var b = h('div', { class: 'st-mbody' }); if (typeof body === 'string') b.innerHTML = body; else b.appendChild(body);
		box.appendChild(b);
		if (actions && actions.length) { var a = h('div', { class: 'st-mact' }); actions.forEach(function (x) { a.appendChild(h('button', { type: 'button', class: 'st-btn ' + (x.cls || ''), onclick: function () { x.on(close); } }, x.text)); }); box.appendChild(a); }
		m.appendChild(box);
		m.addEventListener('click', function (e) { if (e.target === m) close(); });
		document.body.appendChild(m);
		var f = box.querySelector('input,textarea,select'); if (f) setTimeout(function () { f.focus(); }, 50);
		return { el: m, close: close, body: b };
	}
	function ago(ts) {
		if (!ts) return 'never'; var s = Date.now() / 1000 - ts;
		if (s < 60) return 'just now'; if (s < 3600) return Math.floor(s / 60) + ' min ago'; if (s < 86400) return Math.floor(s / 3600) + ' h ago';
		if (s < 86400 * 30) return Math.floor(s / 86400) + ' days ago'; return new Date(ts * 1000).toLocaleDateString('en-GB');
	}
	function done(id) { return !!(state.progress[id] && state.progress[id].done); }
	function stats() {
		var d = LESSONS.filter(function (l) { return done(l.id); }).length;
		return { done: d, total: LESSONS.length, pct: Math.round(100 * d / LESSONS.length), next: LESSONS.filter(function (l) { return !done(l.id); })[0] };
	}
	function ring(pct, size) {
		var r = 42, c = 2 * Math.PI * r;
		return '<svg class="st-ring" viewBox="0 0 100 100" width="' + (size || 96) + '" height="' + (size || 96) + '" role="img" aria-label="' + pct + '% complete"><circle cx="50" cy="50" r="' + r + '" fill="none" stroke="rgba(148,163,184,.25)" stroke-width="10"/><circle cx="50" cy="50" r="' + r + '" fill="none" stroke="var(--brand)" stroke-width="10" stroke-linecap="round" stroke-dasharray="' + c + '" stroke-dashoffset="' + (c - c * pct / 100) + '" transform="rotate(-90 50 50)"/><text x="50" y="57" text-anchor="middle" font-size="22" font-weight="800" fill="currentColor">' + pct + '%</text></svg>';
	}
	function saveProgress(id, data) {
		var p = state.progress[id] = Object.assign(state.progress[id] || {}, data.done ? { done: 1, at: Date.now() / 1000 } : {});
		if (data.score !== undefined) p.score = data.score;
		return api('progress', { method: 'POST', body: Object.assign({ lesson: id }, data) }).then(function (r) {
			var had = state.me && state.me.cert;
			state.progress = r.progress; state.me = r.user;
			if (!had && r.user.cert) setTimeout(function () { modal('Congratulations, ' + r.user.name.split(' ')[0] + '!', '<div class="st-cele">' + icon('award', 56) + '<p>You have completed every lesson and earned your <b>Practical Web Design</b> certificate.</p></div>', [{ text: 'View certificate', cls: 'pri', on: function (c) { c(); window.open(r.user.cert, '_blank'); } }]); }, 600);
			return r;
		});
	}

	/* ------------------------------------------------------------ shell */
	var NAV = [['home', 'Home', 'home'], ['learn', 'Learn', 'book'], ['lab', 'Design Lab', 'star'], ['projects', 'Projects', 'code'], ['classes', 'Classes', 'users'], ['me', 'Me', 'award']];
	function shell(active, content) {
		app.innerHTML = '';
		var wrap = h('div', { class: 'st' });
		var side = h('nav', { class: 'st-nav', 'aria-label': 'Main' });
		side.appendChild(h('a', { class: 'st-brand', href: '#/' }, S.logo ? '<img src="' + esc(S.logo) + '" alt="' + esc(S.name) + '">' : '<span class="st-mark">' + icon('code', 18) + '</span><b>' + esc(S.name) + '</b>'));
		NAV.forEach(function (n) { side.appendChild(h('a', { href: '#/' + (n[0] === 'home' ? '' : n[0]), class: 'st-nl' + (active === n[0] ? ' on' : ''), 'aria-current': active === n[0] ? 'page' : null }, icon(n[2], 20) + '<span>' + n[1] + '</span>')); });
		if (S.wpAdmin) side.appendChild(h('a', { href: S.wpAdmin, class: 'st-nl st-wp' }, icon('globe', 20) + '<span>WordPress</span>'));
		wrap.appendChild(side);
		var main = h('main', { class: 'st-main', id: 'main' });
		main.appendChild(content);
		wrap.appendChild(main);
		app.appendChild(wrap);
		window.scrollTo(0, 0);
		if (!navigator.onLine) main.insertBefore(h('div', { class: 'st-off' }, 'You are offline. Lessons still work; saving will continue when you reconnect.'), main.firstChild);
	}
	function page(title, sub, actions) {
		var p = h('div', { class: 'st-page' });
		var hd = h('header', { class: 'st-ph' });
		var t = h('div'); t.appendChild(h('h1', { text: title })); if (sub) t.appendChild(h('p', null, sub));
		hd.appendChild(t);
		if (actions) hd.appendChild(actions);
		p.appendChild(hd);
		return p;
	}

	/* ------------------------------------------------------------ auth */
	function viewWelcome(mode) {
		app.innerHTML = '';
		var w = h('div', { class: 'st-welcome' });
		var hero = h('section', { class: 'st-wh' });
		hero.innerHTML = '<div class="st-wh-in"><div class="st-brand lg">' + (S.logo ? '<img src="' + esc(S.logo) + '" alt="">' : '<span class="st-mark">' + icon('code', 20) + '</span>') + '<b>' + esc(S.name) + '</b></div>' +
			'<h1>Learn web design by <span>building real websites</span>, right on your phone.</h1>' +
			'<p>No laptop needed. Short practical lessons, a professional page builder, and real projects you can show clients.</p>' +
			'<ul class="st-feats"><li>' + icon('code', 18) + 'Write real HTML and CSS with instant preview</li><li>' + icon('rows', 18) + 'Drag-and-drop builder with Layers, like Pagelayer</li><li>' + icon('users', 18) + 'Join your class, submit work, get feedback</li><li>' + icon('award', 18) + 'Earn a certificate from ' + esc(S.org) + '</li></ul>' +
			'<div class="st-demo" aria-hidden="true"><div class="st-demo-ph"><i></i><div class="st-demo-c"><b></b><s></s><s></s><em></em></div></div><div class="st-demo-code"><span>&lt;h1&gt;</span>Mama Njeri\'s Kitchen<span>&lt;/h1&gt;</span><br><span>&lt;a</span> href="tel:..."<span>&gt;</span>Call<span>&lt;/a&gt;</span></div></div></div>';
		w.appendChild(hero);
		var card = h('section', { class: 'st-auth' });
		var tabs = h('div', { class: 'st-seg', role: 'tablist' });
		var form = h('div');
		var draw = function (m) {
			mode = m;
			tabs.innerHTML = '';
			if (S.register) tabs.appendChild(h('button', { type: 'button', role: 'tab', class: m === 'up' ? 'on' : '', 'aria-selected': String(m === 'up'), onclick: function () { draw('up'); } }, 'Create account'));
			tabs.appendChild(h('button', { type: 'button', role: 'tab', class: m === 'in' ? 'on' : '', 'aria-selected': String(m === 'in'), onclick: function () { draw('in'); } }, 'Sign in'));
			form.innerHTML = '';
			var f = h('form', { class: 'st-form', novalidate: true });
			var field = function (name, label, type, extra) { var id = 'f-' + name; var d = h('div', { class: 'st-field' }); d.appendChild(h('label', { for: id, text: label })); d.appendChild(h('input', Object.assign({ id: id, name: name, type: type || 'text' }, extra || {}))); f.appendChild(d); return d; };
			if (m === 'up') {
				field('name', 'Full name', 'text', { autocomplete: 'name', required: true });
				field('email', 'Email', 'email', { autocomplete: 'email', inputmode: 'email', required: true });
				field('phone', 'Phone (optional)', 'tel', { autocomplete: 'tel', placeholder: '07\u2026' });
				field('password', 'Create a password', 'password', { autocomplete: 'new-password', minlength: 8, required: true }).appendChild(h('small', null, 'At least 8 characters.'));
				if (S.teacherSignup) {
					var det = h('details', { class: 'st-det' }); det.appendChild(h('summary', null, 'I am a trainer'));
					var tf = h('div', { class: 'st-field' }); tf.appendChild(h('label', { for: 'f-tc', text: 'Teacher code from your institution' })); tf.appendChild(h('input', { id: 'f-tc', name: 'teacher_code', autocomplete: 'off' }));
					det.appendChild(tf); f.appendChild(det);
				}
			} else {
				field('login', 'Email', 'text', { autocomplete: 'username', inputmode: 'email', required: true });
				field('password', 'Password', 'password', { autocomplete: 'current-password', required: true });
				f.appendChild(h('a', { class: 'st-forgot', href: S.lostPass }, 'Forgot your password?'));
			}
			var err = h('p', { class: 'st-err', role: 'alert' });
			f.appendChild(err);
			var btn = h('button', { type: 'submit', class: 'st-btn pri big' }, m === 'up' ? 'Create my free account' : 'Sign in');
			f.appendChild(btn);
			f.addEventListener('submit', function (e) {
				e.preventDefault(); err.textContent = '';
				var data = {}; new FormData(f).forEach(function (v, k) { data[k] = v; });
				if (m === 'up' && String(data.password || '').length < 8) { err.textContent = 'Use a password of at least 8 characters.'; return; }
				btn.disabled = true; btn.textContent = 'Please wait\u2026';
				api(m === 'up' ? 'register' : 'login', { method: 'POST', body: data }).then(function () { location.hash = '#/'; location.reload(); })
					.catch(function (x) { err.textContent = x.message; btn.disabled = false; btn.textContent = m === 'up' ? 'Create my free account' : 'Sign in'; });
			});
			form.appendChild(f);
		};
		card.appendChild(h('h2', null, 'Start learning free'));
		card.appendChild(tabs); card.appendChild(form);
		if (S.support) card.appendChild(h('p', { class: 'st-help' }, 'Need help? ' + esc(S.support)));
		w.appendChild(card);
		app.appendChild(w);
		draw(mode || (S.register ? 'up' : 'in'));
	}

	/* ------------------------------------------------------------ home */
	function viewHome() {
		var st = stats(), me = state.me, first = me.name.split(' ')[0];
		var p = page('Habari, ' + first + '!', me.teacher ? 'Teach, track progress and review student work.' : 'Ready to build something today?');
		var hero = h('div', { class: 'st-cont' });
		hero.innerHTML = '<div class="st-cont-r">' + ring(st.pct, 104) + '</div><div class="st-cont-t"><small>' + st.done + ' of ' + st.total + ' lessons complete</small>' +
			(st.next ? '<h2>Next: ' + esc(st.next.title) + '</h2><p>' + esc(MODS.filter(function (m) { return m.id === st.next.module; })[0].title) + ' &middot; about ' + st.next.mins + ' min</p>' : '<h2>Course complete!</h2><p>You earned your certificate. Keep building projects.</p>') + '</div>';
		var go = h('a', { class: 'st-btn pri', href: st.next ? '#/lesson/' + st.next.id : (me.cert || '#/projects'), target: !st.next && me.cert ? '_blank' : null }, st.next ? (st.done ? 'Continue' : 'Start the course') + ' ' + icon('arrow', 16) : 'View certificate');
		hero.querySelector('.st-cont-t').appendChild(go);
		p.appendChild(hero);

		var quick = h('div', { class: 'st-quick' });
		[['Open the builder', 'Design a page with drag and drop', 'rows', function () { newProject('builder', 'starter'); }],
		['Design Lab', 'Watch, build and practise real designs', 'star', function () { location.hash = '#/lab'; }],
		['Write code', 'HTML, CSS and JavaScript playground', 'code', function () { newProject('code'); }],
		[me.teacher ? 'Your classes' : 'Join a class', me.teacher ? 'Create a class and track students' : 'Enter the code from your trainer', 'users', function () { location.hash = '#/classes'; }]].forEach(function (q) {
			quick.appendChild(h('button', { type: 'button', class: 'st-qc', onclick: q[3] }, '<span>' + icon(q[2], 22) + '</span><b>' + q[0] + '</b><small>' + q[1] + '</small>'));
		});
		p.appendChild(quick);

		p.appendChild(h('h2', { class: 'st-h2' }, 'Your course'));
		p.appendChild(modulesList(true));

		var rec = h('div'); p.appendChild(h('h2', { class: 'st-h2' }, 'Recent projects')); p.appendChild(rec);
		loadProjects().then(function (list) {
			if (!list.length) { rec.appendChild(h('div', { class: 'st-empty' }, 'No projects yet. Your lesson work and your own websites will appear here.')); return; }
			rec.appendChild(projectGrid(list.slice(0, 4)));
		}).catch(function () { rec.appendChild(h('div', { class: 'st-empty' }, 'Projects will load when you are online.')); });
		shell('home', p);
	}
	function modulesList(compact) {
		var wrap = h('div', { class: 'st-mods' });
		MODS.forEach(function (m, mi) {
			var ls = LESSONS.filter(function (l) { return l.module === m.id; });
			var d = ls.filter(function (l) { return done(l.id); }).length;
			var card = h('section', { class: 'st-mod', style: '--mc:' + m.color });
			card.appendChild(h('div', { class: 'st-mod-h' }, '<span class="st-mod-n">' + (mi + 1) + '</span><div><h3>' + esc(m.title) + '</h3><p>' + esc(m.blurb) + '</p></div><span class="st-mod-c">' + d + '/' + ls.length + '</span>'));
			card.appendChild(h('div', { class: 'st-bar' }, '<i style="width:' + Math.round(100 * d / ls.length) + '%"></i>'));
			if (!compact) {
				var ul = h('ol', { class: 'st-ls' });
				ls.forEach(function (l) {
					ul.appendChild(h('li', null, h('a', { href: '#/lesson/' + l.id, class: done(l.id) ? 'done' : '' }, '<span class="st-tick">' + (done(l.id) ? icon('check', 14) : '') + '</span><span class="st-lt">' + esc(l.title) + '</span><small>' + ({ read: 'Read', code: 'Code', builder: 'Builder', quiz: 'Quiz', publish: 'Publish' })[l.kind] + ' &middot; ' + l.mins + ' min</small>')));
				});
				card.appendChild(ul);
			} else {
				card.addEventListener('click', function () { location.hash = '#/learn'; }); card.style.cursor = 'pointer';
			}
			wrap.appendChild(card);
		});
		return wrap;
	}
	function viewLearn() {
		var st = stats();
		var p = page('Practical Web Design', st.done + ' of ' + st.total + ' lessons complete. Work through them in order, or jump to any lesson.');
		p.appendChild(modulesList(false));
		shell('learn', p);
	}

	/* ------------------------------------------------------------ lesson */
	function viewLesson(id) {
		var l = byId[id]; if (!l) return go404();
		var mod = MODS.filter(function (m) { return m.id === l.module; })[0];
		var next = LESSONS[l.n + 1], prev = LESSONS[l.n - 1];
		var p = h('div', { class: 'st-lesson k-' + l.kind });
		var top = h('header', { class: 'st-lh', style: '--mc:' + mod.color });
		top.innerHTML = '<a class="st-back" href="#/learn" aria-label="Back to lessons">' + icon('arrow', 18) + '</a><div><small>' + esc(mod.title) + ' &middot; Lesson ' + (l.n + 1) + ' of ' + LESSONS.length + '</small><h1>' + esc(l.title) + '</h1></div>' + (done(l.id) ? '<span class="st-donebadge">' + icon('check', 14) + ' Done</span>' : '');
		p.appendChild(top);
		var body = h('div', { class: 'st-lb' });
		var learn = h('article', { class: 'st-learn' });
		learn.innerHTML = l.body;
		body.appendChild(learn);
		p.appendChild(body);
		var foot = h('nav', { class: 'st-lnav' });
		foot.appendChild(prev ? h('a', { class: 'st-btn ghost', href: '#/lesson/' + prev.id }, '&larr; Previous') : h('span'));
		foot.appendChild(next ? h('a', { class: 'st-btn ghost', href: '#/lesson/' + next.id }, 'Next &rarr;') : h('span'));

		if (l.kind === 'read' || l.kind === 'quiz') { learn.appendChild(quizBlock(l, next)); learn.appendChild(foot); shell('learn', p); return; }
		if (l.kind === 'publish') {
			var box = h('div', { class: 'st-task' }, '<h3>' + icon('bolt', 18) + ' Your task</h3><p>' + l.task + '</p>');
			var cl = h('ul', { class: 'st-checks' }); box.appendChild(cl);
			var b = h('button', { type: 'button', class: 'st-btn pri' }, 'Check my work');
			var run = function () {
				b.disabled = true;
				loadProjects(true).then(function (list) {
					var ctx = { published: list.filter(function (x) { return x.pub; }).length };
					var ok = renderChecks(cl, l, ctx);
					if (ok && !done(l.id)) saveProgress(l.id, { done: 1 }).then(function () { celebrate(l, next); });
					else if (!ok) toast('Not yet. Publish a project first.', 'warn');
				}).catch(function (e) { toast(e.message, 'err'); }).then(function () { b.disabled = false; });
			};
			b.onclick = run;
			box.appendChild(h('div', { class: 'st-row' }, [b, h('a', { class: 'st-btn', href: '#/projects' }, 'Go to My projects')]));
			learn.appendChild(box); learn.appendChild(foot);
			shell('learn', p); renderChecks(cl, l, null);
			return;
		}
		var task = h('div', { class: 'st-task' }, '<h3>' + icon('bolt', 18) + ' Your task</h3><p>' + l.task + '</p>');
		var checks = h('ul', { class: 'st-checks', 'aria-live': 'polite' });
		task.appendChild(checks);
		if (l.hint) { var hd = h('details', { class: 'st-hint' }); hd.appendChild(h('summary', null, 'Need a hint?')); hd.appendChild(h('p', null, l.hint)); task.appendChild(hd); }
		learn.appendChild(task);
		learn.appendChild(foot);
		if (l.kind === 'code') codeLesson(l, p, body, checks, next);
		else builderLesson(l, p, task, checks, next);
		shell('learn', p);
	}
	function renderChecks(ul, l, ctx) {
		ul.innerHTML = ''; var all = true;
		l.checks.forEach(function (c) {
			var ok = false;
			if (ctx) { try { ok = !!c.f(ctx); } catch (e) { ok = false; } }
			all = all && ok;
			ul.appendChild(h('li', { class: ok ? 'ok' : '' }, '<span>' + (ok ? icon('check', 14) : '') + '</span>' + esc(c.t)));
		});
		return all;
	}
	function celebrate(l, next) {
		var st = stats();
		var m = modal('Lesson complete!', '<div class="st-cele"><div class="st-confetti" aria-hidden="true">' + new Array(18).join('<i></i>') + '</div>' + ring(st.pct, 120) + '<p><b>' + esc(l.title) + '</b> is done. ' + st.done + ' of ' + st.total + ' lessons complete.</p></div>',
			next ? [{ text: 'Next lesson', cls: 'pri', on: function (c) { c(); location.hash = '#/lesson/' + next.id; } }, { text: 'Stay here', on: function (c) { c(); } }] : [{ text: 'Back to course', cls: 'pri', on: function (c) { c(); location.hash = '#/learn'; } }]);
		return m;
	}
	function quizBlock(l, next) {
		var box = h('div', { class: 'st-quiz' });
		if (!l.quiz) return box;
		box.appendChild(h('h3', null, icon('star', 18) + (l.kind === 'quiz' ? ' Checkpoint' : ' Quick check')));
		var answers = {};
		l.quiz.forEach(function (q, qi) {
			var fs = h('fieldset', { class: 'st-q' });
			fs.appendChild(h('legend', null, (qi + 1) + '. ' + esc(q.q)));
			q.o.forEach(function (o, oi) {
				var id = 'q' + qi + '-' + oi;
				var lab = h('label', { for: id }, '<input type="radio" name="q' + qi + '" id="' + id + '" value="' + oi + '"><span>' + esc(o) + '</span>');
				lab.querySelector('input').onchange = function () { answers[qi] = oi; fs.querySelectorAll('label').forEach(function (x) { x.classList.remove('right', 'wrong'); }); };
				fs.appendChild(lab);
			});
			box.appendChild(fs);
		});
		var res = h('p', { class: 'st-qres', role: 'status' });
		var btn = h('button', { type: 'button', class: 'st-btn pri' }, done(l.id) ? 'Check again' : 'Check my answers');
		btn.onclick = function () {
			var right = 0;
			l.quiz.forEach(function (q, qi) {
				var fs = box.querySelectorAll('.st-q')[qi];
				fs.querySelectorAll('label').forEach(function (x, oi) { x.classList.remove('right', 'wrong'); if (answers[qi] === oi) x.classList.add(oi === q.a ? 'right' : 'wrong'); });
				if (answers[qi] === q.a) right++;
			});
			var need = l.pass || l.quiz.length - 1 || 1, pass = right >= need;
			res.className = 'st-qres ' + (pass ? 'ok' : 'no');
			res.textContent = right + ' of ' + l.quiz.length + ' correct. ' + (pass ? 'Well done!' : 'You need ' + need + '. Read again and try once more.');
			if (pass) { btn.disabled = true; saveProgress(l.id, { done: 1, score: Math.round(100 * right / l.quiz.length) }).then(function () { celebrate(l, next); btn.disabled = false; }).catch(function (e) { toast(e.message, 'err'); btn.disabled = false; }); }
		};
		box.appendChild(res); box.appendChild(btn);
		return box;
	}

	/* A same-origin, script-free frame for previews and checks. */
	function frameDoc(html, css, extraHead) {
		var full = /<html[\s>]/i.test(html);
		if (full) return html.replace(/<\/head>/i, '<style>' + css + '</style>' + (extraHead || '') + '</head>');
		return '<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>' + css + '</style>' + (extraHead || '') + '</head><body>' + html + '</body></html>';
	}

	function codeLesson(l, p, body, checksUl, next) {
		var key = 'lesson:' + l.id;
		var saved = store.get(key) || (state.progress[l.id] && state.progress[l.id].work) || null;
		var work = { html: saved && saved.html != null ? saved.html : l.starter.html, css: saved && saved.css != null ? saved.css : l.starter.css };
		var lab = codeLab({
			work: work, tabs: ['html', 'css'], scripts: false,
			onChange: function (w) { store.set(key, w); queueCheck(); },
			tools: [
				{ text: 'Reset', on: function () { if (confirm('Start this exercise again from the beginning?')) { lab.set({ html: l.starter.html, css: l.starter.css }); store.del(key); } } }
			].concat(l.assets ? [{ text: 'Pictures', on: function () { picsModal(); } }] : [])
		});
		body.appendChild(lab.el);
		p.classList.add('has-lab');
		var completeB = h('button', { type: 'button', class: 'st-btn pri st-complete', disabled: true }, done(l.id) ? 'Completed ' + icon('check', 16) : 'Complete lesson');
		checksUl.parentNode.insertBefore(completeB, checksUl.nextSibling);
		var check = h('iframe', { class: 'st-checkframe', 'aria-hidden': 'true', tabindex: '-1', sandbox: 'allow-same-origin', title: 'checker' });
		check.style.width = l.phoneCheck ? '360px' : (l.wide ? '1000px' : '800px');
		document.body.appendChild(check);
		var ok = false, t;
		function queueCheck() { clearTimeout(t); t = setTimeout(runCheck, 350); }
		function runCheck() {
			var w = lab.get();
			check.onload = function () {
				var d = check.contentDocument;
				ok = renderChecks(checksUl, l, { doc: d, win: check.contentWindow, html: w.html, css: w.css });
				completeB.disabled = !ok && !done(l.id);
				completeB.classList.toggle('ready', ok && !done(l.id));
			};
			check.srcdoc = frameDoc(w.html, w.css);
		}
		completeB.onclick = function () {
			if (!ok) { toast('Not yet. Look at the ticks in your task list.', 'warn'); return; }
			completeB.disabled = true;
			saveProgress(l.id, { done: 1, work: lab.get() }).then(function () { completeB.innerHTML = 'Completed ' + icon('check', 16); celebrate(l, next); })
				.catch(function (e) { toast(e.message, 'err'); completeB.disabled = false; });
		};
		var cleanup = function () { check.remove(); window.removeEventListener('hashchange', cleanup); };
		window.addEventListener('hashchange', cleanup);
		setTimeout(runCheck, 50);
	}

	function picsModal() {
		var base = S.base.replace(/\/$/, '');
		var list = h('div', { class: 'st-pics' });
		LS.pics.forEach(function (pi) {
			var url = picUrl(pi[0]);
			var b = h('button', { type: 'button', class: 'st-pic' }, '<img src="' + esc(url) + '" alt=""><span>' + esc(pi[0]) + '</span><small>Tap to copy</small>');
			b.onclick = function () {
				var done_ = function () { toast('Picture address copied. Paste it inside src="\u2026"', 'ok'); };
				if (navigator.clipboard) navigator.clipboard.writeText(url).then(done_, function () { prompt('Copy this address:', url); });
				else prompt('Copy this address:', url);
			};
			list.appendChild(b);
		});
		modal('Pictures you can use', list);
		return base;
	}
	function picUrl(name) {
		var src = document.querySelector('script[src*="ple-studio.js"]').src;
		return src.replace(/ple-studio\.js.*$/, 'pics/' + name.toLowerCase().replace(/[^a-z]+/g, '-') + '.svg');
	}

	/* ------------------------------------------------------------ code lab */
	function codeLab(o) {
		var w = { html: o.work.html || '', css: o.work.css || '', js: o.work.js || '' };
		var el = h('div', { class: 'st-lab' });
		var bar = h('div', { class: 'st-labbar', role: 'tablist' });
		var panes = {}, active = 'html', phone = window.matchMedia('(max-width: 900px)').matches;
		var tabs = o.tabs.concat(phone ? ['preview'] : []);
		var labels = { html: 'HTML', css: 'CSS', js: 'JavaScript', preview: 'Preview' };
		tabs.forEach(function (t) { bar.appendChild(h('button', { type: 'button', role: 'tab', 'data-t': t, class: t === active ? 'on' : '', onclick: function () { show(t); } }, labels[t])); });
		var tools = h('div', { class: 'st-labtools' });
		(o.tools || []).forEach(function (t) { tools.appendChild(h('button', { type: 'button', onclick: t.on }, t.text)); });
		bar.appendChild(tools);
		el.appendChild(bar);
		var edWrap = h('div', { class: 'st-labed' });
		o.tabs.forEach(function (t) {
			var pane = h('div', { class: 'st-pane', 'data-t': t, hidden: t !== active ? true : null });
			var gutter = h('pre', { class: 'st-gut', 'aria-hidden': 'true' });
			var ta = h('textarea', { class: 'st-code', spellcheck: 'false', autocapitalize: 'off', autocomplete: 'off', autocorrect: 'off', 'aria-label': labels[t] + ' code', wrap: 'off' });
			ta.value = w[t];
			var lines = function () { var n = ta.value.split('\n').length; var s = ''; for (var i = 1; i <= n; i++) s += i + '\n'; gutter.textContent = s; };
			ta.addEventListener('input', function () { w[t] = ta.value; lines(); changed(); });
			ta.addEventListener('scroll', function () { gutter.scrollTop = ta.scrollTop; });
			ta.addEventListener('keydown', function (e) {
				/* Auto-close tags and brackets to save typing on phones. */
				if (e.key === 'Enter') {
					var s = ta.selectionStart, before = ta.value.slice(0, s), line = before.split('\n').pop(), ind = (line.match(/^\s*/) || [''])[0];
					var extra = /[{>]\s*$/.test(line) && !/<\/[^>]+>\s*$/.test(line) && !/\/>\s*$/.test(line) ? '  ' : '';
					e.preventDefault(); var ins = '\n' + ind + extra;
					ta.value = before + ins + ta.value.slice(ta.selectionEnd); ta.selectionStart = ta.selectionEnd = s + ins.length; ta.dispatchEvent(new Event('input'));
				}
				if (e.key === '>' && t === 'html') {
					var s2 = ta.selectionStart, b2 = ta.value.slice(0, s2), m = b2.match(/<([a-zA-Z][\w-]*)[^<>]*$/);
					if (m && !/^(img|br|hr|input|meta|link|source|area|col|wbr)$/i.test(m[1]) && !/\/$/.test(b2)) {
						e.preventDefault(); var close = '></' + m[1] + '>';
						ta.value = b2 + close + ta.value.slice(ta.selectionEnd); ta.selectionStart = ta.selectionEnd = s2 + 1; ta.dispatchEvent(new Event('input'));
					}
				}
				if (e.key === '{' && t !== 'html') { var s3 = ta.selectionStart; e.preventDefault(); ta.value = ta.value.slice(0, s3) + '{}' + ta.value.slice(ta.selectionEnd); ta.selectionStart = ta.selectionEnd = s3 + 1; ta.dispatchEvent(new Event('input')); }
			});
			lines();
			var box = h('div', { class: 'st-codebox' }); box.appendChild(gutter); box.appendChild(ta);
			pane.appendChild(box);
			pane.appendChild(E.keybar(ta));
			panes[t] = { pane: pane, ta: ta, lines: lines };
			edWrap.appendChild(pane);
		});
		el.appendChild(edWrap);
		var prevWrap = h('div', { class: 'st-prev', hidden: phone ? true : null });
		var prevBar = h('div', { class: 'st-prevbar' }, '<span>Live preview</span>');
		var sizes = h('div', { class: 'st-sizes' });
		[['100%', 'Full'], ['390px', 'Phone']].forEach(function (s) { sizes.appendChild(h('button', { type: 'button', onclick: function () { frame.style.maxWidth = s[0]; sizes.querySelectorAll('button').forEach(function (b) { b.classList.toggle('on', b.textContent === s[1]); }); } }, s[1])); });
		sizes.firstChild.classList.add('on');
		prevBar.appendChild(sizes);
		if (o.scripts) prevBar.appendChild(h('button', { type: 'button', class: 'st-run', onclick: function () { render(true); } }, '&#9654; Run'));
		prevWrap.appendChild(prevBar);
		var frame = h('iframe', { class: 'st-frame', title: 'Preview', sandbox: o.scripts ? 'allow-scripts allow-modals allow-forms' : 'allow-same-origin' });
		prevWrap.appendChild(frame);
		el.appendChild(prevWrap);
		var rt;
		function render() {
			var js = o.scripts && w.js ? '<script>' + w.js.replace(/<\/script/gi, '<\\/script') + '<\/script>' : '';
			var doc = frameDoc(w.html, w.css);
			frame.srcdoc = js ? doc.replace(/<\/body>/i, js + '</body>') : doc;
		}
		function changed() { clearTimeout(rt); rt = setTimeout(render, 400); if (o.onChange) o.onChange(w); }
		function show(t) {
			active = t;
			bar.querySelectorAll('[role=tab]').forEach(function (b) { b.classList.toggle('on', b.dataset.t === t); });
			Object.keys(panes).forEach(function (k) { panes[k].pane.hidden = k !== t; });
			if (phone) { prevWrap.hidden = t !== 'preview'; edWrap.hidden = t === 'preview'; if (t === 'preview') render(); }
		}
		render();
		return {
			el: el, get: function () { return { html: w.html, css: w.css, js: w.js }; },
			set: function (n) { Object.keys(n).forEach(function (k) { if (panes[k]) { w[k] = n[k]; panes[k].ta.value = n[k]; panes[k].lines(); } }); render(); if (o.onChange) o.onChange(w); },
			render: render
		};
	}

	/* ------------------------------------------------------------ builder lesson */
	function builderLesson(l, p, task, checksUl, next) {
		var openB = h('button', { type: 'button', class: 'st-btn pri big' }, icon('rows', 18) + ' Open the builder');
		var completeB = h('button', { type: 'button', class: 'st-btn st-complete', disabled: !done(l.id) ? null : true }, done(l.id) ? 'Completed ' + icon('check', 16) : 'Check and complete');
		task.insertBefore(h('div', { class: 'st-row' }, [openB, completeB]), checksUl.nextSibling);
		var proj = null, startMap = {}, startOrder = '';
		var ctxFor = function (tree) { return { tree: tree, start: startMap, startOrder: startOrder, nodes: null }; };
		var evaluate = function (tree) { return renderChecks(checksUl, l, ctxFor(tree)); };
		function prepare() {
			return loadProjects().then(function (list) {
				var mine = list.filter(function (x) { return x.lesson === l.id && x.mode === 'builder'; })[0];
				if (mine) return api('projects/' + mine.id);
				var tree = l.start === 'starter' ? C.starterPage() : C.emptyPage();
				return api('projects', { method: 'POST', body: { title: l.title, mode: 'builder', lesson: l.id, tree: tree } }).then(function (pr) { state.projects = null; return pr; });
			}).then(function (pr) {
				proj = pr;
				var st = store.get('start:' + l.id);
				if (!st) { st = pr.tree; store.set('start:' + l.id, st); }
				C.walk(st, function (n) { startMap[n.id] = n; });
				startOrder = (st.children || []).map(function (n) { return n.id; }).join();
				evaluate(pr.tree);
				return pr;
			});
		}
		var ready = prepare().catch(function (e) { toast(e.message, 'err'); });
		openB.onclick = function () {
			ready.then(function () {
				if (!proj) return;
				openEditor(proj, {
					lesson: l,
					onTree: function (tree) { return evaluate(tree); },
					onExit: function (tree) { evaluate(tree); }
				});
			});
		};
		completeB.onclick = function () {
			ready.then(function () {
				if (!proj) return;
				api('projects/' + proj.id).then(function (pr) {
					proj = pr;
					if (!evaluate(pr.tree)) { toast('Not yet. Open the builder and finish the unticked items.', 'warn'); return; }
					completeB.disabled = true;
					return saveProgress(l.id, { done: 1 }).then(function () { completeB.innerHTML = 'Completed ' + icon('check', 16); celebrate(l, next); });
				}).catch(function (e) { toast(e.message, 'err'); });
			});
		};
	}

	/* ------------------------------------------------------------ projects */
	function loadProjects(force) {
		if (state.projects && !force) return Promise.resolve(state.projects);
		return api('projects').then(function (l) { state.projects = l; store.set('projects', l); return l; })
			.catch(function (e) { var c = store.get('projects'); if (c) return c; throw e; });
	}
	function projectGrid(list) {
		var g = h('div', { class: 'st-grid' });
		list.forEach(function (pr) {
			var c = h('article', { class: 'st-pc' });
			var lesson = pr.lesson && byId[pr.lesson];
			c.innerHTML = '<a class="st-pc-main" href="#/project/' + pr.id + '"><span class="st-pc-ic m-' + pr.mode + '">' + icon(pr.mode === 'code' ? 'code' : 'rows', 22) + '</span><b>' + esc(pr.title) + '</b><small>' + (pr.mode === 'code' ? 'Code' : 'Builder') + (lesson ? ' &middot; Lesson' : '') + ' &middot; ' + ago(pr.updated) + '</small></a>' + (pr.pub ? '<a class="st-pub" href="' + esc(pr.pub) + '" target="_blank" rel="noopener">' + icon('globe', 14) + ' Live</a>' : '');
			g.appendChild(c);
		});
		return g;
	}
	function viewProjects() {
		var acts = h('div', { class: 'st-row' }, [h('button', { type: 'button', class: 'st-btn pri', onclick: function () { newProjectModal(); } }, '+ New project')]);
		var p = page('My projects', 'Websites you build. Publish any project to get a link you can share.', acts);
		var box = h('div', null, '<div class="st-skel"></div>'); p.appendChild(box);
		shell('projects', p);
		loadProjects(true).then(function (list) {
			box.innerHTML = '';
			if (!list.length) { box.appendChild(h('div', { class: 'st-empty big' }, '<b>No projects yet</b><p>Start with the builder for a full website, or use code to practise HTML and CSS.</p>')); return; }
			box.appendChild(projectGrid(list));
		}).catch(function (e) { box.innerHTML = '<div class="st-empty">' + esc(e.message) + '</div>'; });
	}
	function newProjectModal() {
		var f = h('div', { class: 'st-choose' });
		var title = h('input', { type: 'text', value: '', placeholder: 'e.g. Mama Njeri\'s Kitchen', 'aria-label': 'Project name' });
		f.appendChild(h('label', { class: 'st-field' }, [h('span', { text: 'Project name' }), title]));
		var opts = [['builder:starter', 'rows', 'Builder: business website', 'A complete sample website to customise'], ['builder:blank', 'square', 'Builder: blank page', 'Start from nothing'], ['code', 'code', 'Code: HTML, CSS, JavaScript', 'Write everything by hand with live preview']];
		var m;
		opts.forEach(function (o) {
			f.appendChild(h('button', { type: 'button', class: 'st-opt', onclick: function () { m.close(); var k = o[0].split(':'); newProject(k[0], k[1], title.value); } }, '<span>' + icon(o[1], 22) + '</span><b>' + o[2] + '</b><small>' + o[3] + '</small>'));
		});
		m = modal('New project', f);
	}
	function newProject(mode, start, title) {
		var body = { title: title || (mode === 'code' ? 'My code project' : 'My website'), mode: mode };
		if (mode === 'builder') body.tree = start === 'blank' ? C.emptyPage() : C.starterPage();
		else { body.html = '<header>\n  <h1>Hello, world!</h1>\n</header>\n<main>\n  <p>Start building here.</p>\n  <button id="btn">Click me</button>\n</main>\n'; body.css = 'body {\n  font-family: system-ui, sans-serif;\n  margin: 0;\n  padding: 24px;\n}\n\nh1 {\n  color: #2563eb;\n}\n'; body.js = "document.getElementById('btn').addEventListener('click', function () {\n  alert('It works!');\n});\n"; }
		toast('Creating\u2026');
		api('projects', { method: 'POST', body: body }).then(function (pr) { state.projects = null; location.hash = '#/project/' + pr.id; }).catch(function (e) { toast(e.message, 'err'); });
	}
	function viewProject(id) {
		app.innerHTML = '<div class="st-boot"><div class="st-spin"></div></div>';
		api('projects/' + id).then(function (pr) {
			if (pr.mode === 'code') openCode(pr); else openEditor(pr, {});
		}).catch(function (e) { toast(e.message, 'err'); location.hash = '#/projects'; });
	}
	function shareModal(pr, after) {
		var b = h('div', { class: 'st-share' });
		var draw = function () {
			b.innerHTML = '';
			if (pr.pub) {
				b.appendChild(h('p', null, 'Your project is <b>live</b>. Anyone with this link can see it:'));
				var inp = h('input', { type: 'text', readonly: true, value: pr.pub, onclick: function () { this.select(); } });
				b.appendChild(inp);
				var row = h('div', { class: 'st-row' });
				row.appendChild(h('a', { class: 'st-btn pri', href: pr.pub, target: '_blank', rel: 'noopener' }, 'Open'));
				row.appendChild(h('a', { class: 'st-btn wa', href: 'https://wa.me/?text=' + encodeURIComponent('Look at the website I built: ' + pr.pub), target: '_blank', rel: 'noopener' }, 'Share on WhatsApp'));
				row.appendChild(h('button', { type: 'button', class: 'st-btn', onclick: function () { navigator.clipboard && navigator.clipboard.writeText(pr.pub).then(function () { toast('Link copied', 'ok'); }); } }, 'Copy link'));
				row.appendChild(h('button', { type: 'button', class: 'st-btn ghost', onclick: function () { set(0); } }, 'Unpublish'));
				b.appendChild(row);
			} else {
				b.appendChild(h('p', null, 'Publishing creates a public link for this project. You can unpublish at any time.'));
				b.appendChild(h('button', { type: 'button', class: 'st-btn pri big', onclick: function () { set(1); } }, icon('globe', 18) + ' Publish now'));
			}
		};
		var set = function (on) { api('projects/' + pr.id + '/publish', { method: 'POST', body: { on: on } }).then(function (r) { pr.pub = r.pub; state.projects = null; draw(); if (after) after(pr); toast(on ? 'Published!' : 'Unpublished', 'ok'); }).catch(function (e) { toast(e.message, 'err'); }); };
		draw();
		modal('Publish and share', b);
	}
	function submitModal(pr) {
		var b = h('div', null, '<p>Loading your classes\u2026</p>');
		modal('Submit to a class', b);
		loadClasses().then(function (list) {
			var studentOf = list.filter(function (c) { return !c.mine; });
			b.innerHTML = '';
			if (!studentOf.length) { b.innerHTML = '<p>You are not in a class yet. Ask your trainer for a class code, then go to <a href="#/classes">Classes</a>.</p>'; return; }
			var sel = h('select', { 'aria-label': 'Assignment' });
			studentOf.forEach(function (c) {
				var g = h('optgroup', { label: c.name });
				g.appendChild(h('option', { value: c.id + '|general' }, 'General work for ' + c.name));
				c.assign.forEach(function (a) { g.appendChild(h('option', { value: c.id + '|' + a.id }, a.title + (a.due ? ' (due ' + a.due + ')' : ''))); });
				sel.appendChild(g);
			});
			b.appendChild(h('label', { class: 'st-field' }, [h('span', { text: 'Which assignment is this for?' }), sel]));
			b.appendChild(h('p', { class: 'st-muted' }, 'Submitting publishes the project so your teacher can open it on any device.'));
			b.appendChild(h('button', { type: 'button', class: 'st-btn pri big', onclick: function () {
				var v = sel.value.split('|');
				api('submit', { method: 'POST', body: { class: +v[0], assign: v[1], project: pr.id } }).then(function () { toast('Submitted to your teacher', 'ok'); document.querySelector('.st-modal').remove(); }).catch(function (e) { toast(e.message, 'err'); });
			} }, 'Submit'));
		}).catch(function (e) { b.innerHTML = '<p>' + esc(e.message) + '</p>'; });
	}

	function openEditor(pr, o) {
		app.innerHTML = '';
		var mount = h('div'); app.appendChild(mount);
		var lesson = o.lesson;
		var lastOk = false;
		var taskBtn = lesson ? [{ text: 'Task', title: 'Your task and checklist', icon: 'bolt', cls: 'st-taskb', on: function (ed) { taskModal(ed); } }] : [];
		var exitTo = o.exitTo || (lesson ? '#/lesson/' + lesson.id : '#/projects');
		var ed = new E({
			mount: mount,
			tree: pr.tree && pr.tree.children ? pr.tree : C.emptyPage(),
			title: pr.title,
			brand: 'PLE',
			exitLabel: o.exitLabel || (lesson ? 'Lesson' : 'Projects'),
			onExit: function () {
				var leave = function () { if (o.onExit) o.onExit(ed.tree); location.hash = exitTo; if (location.hash === exitTo) route(); };
				if (ed.dirty && !o.noSave) { ed.save(); setTimeout(leave, 700); } else leave();
			},
			storeKey: o.noSave ? '' : 'ple:draft:' + pr.id,
			sideNote: o.sideNote || lesson ? o.sideNote || '<b>Lesson task:</b> ' + lesson.task + '<br><button type="button" class="st-inline-b" onclick="document.querySelector(\'.st-taskb\').click()">See checklist</button>' : '',
			runtime: S.runtime,
			upload: function (file) {
				var fd = new FormData(); fd.append('file', file);
				return api('upload', { method: 'POST', form: fd }).then(function (r) { return r.url; });
			},
			onChange: function (e) { if (o.onTree) { var ok = o.onTree(e.tree); if (ok && !lastOk) e.toast('All task items are ticked. Open Task to complete the lesson.', 'ok'); lastOk = ok; } },
			extraButtons: (o.buttons || []).concat(taskBtn, o.noShare ? [] : [
				{ text: 'Share', title: 'Publish and share', icon: 'globe', on: function (e) { e.save(); shareModal(pr); } },
				{ text: 'Submit', title: 'Submit to a class', icon: 'users', on: function (e) { e.save(); submitModal(pr); } }
			]),
			codeButtons: [{ text: 'Copy to a code project', on: function (e) {
				var d = e.data();
				api('projects', { method: 'POST', body: { title: d.title + ' (code)', mode: 'code', html: C.pretty(d.html), css: d.css.replace(/}/g, '}\n'), js: '' } }).then(function (np) { state.projects = null; toast('Code project created', 'ok'); location.hash = '#/project/' + np.id; }).catch(function (x) { toast(x.message, 'err'); });
			} }],
			save: o.noSave ? null : function (d) {
				return api('projects', { method: 'POST', body: { id: pr.id, title: d.title, mode: 'builder', tree: d.tree, html: d.html, css: d.css } }).then(function () { state.projects = null; pr.title = d.title; if (o.onTree) o.onTree(d.tree); return 'Saved'; });
			}
		});
		/* Restore a local draft if the last save did not reach the server. */
		if (!o.noSave) try { var dr = JSON.parse(localStorage.getItem('ple:draft:' + pr.id) || 'null'); if (dr && dr.tree && dr.at > pr.updated * 1000 + 2000) { ed.tree = dr.tree; ed.commit(); ed.renderAll(); ed.toast('Restored your unsaved changes from this phone.'); } } catch (e) { }
		if (o.onTree) lastOk = o.onTree(ed.tree);
		if (o.onReady) o.onReady(ed);
		function taskModal(e) {
			var ul = h('ul', { class: 'st-checks' });
			var ok = renderChecks(ul, lesson, { tree: e.tree, start: o.lesson ? (function () { var m = {}; var st = store.get('start:' + lesson.id); if (st) C.walk(st, function (n) { m[n.id] = n; }); return m; })() : {}, startOrder: ((store.get('start:' + lesson.id) || {}).children || []).map(function (n) { return n.id; }).join() });
			var b = h('div', null, '<p>' + lesson.task + '</p>'); b.appendChild(ul);
			if (lesson.hint) b.appendChild(h('p', { class: 'st-muted' }, '<b>Hint:</b> ' + lesson.hint));
			modal(lesson.title, b, ok ? [{ text: done(lesson.id) ? 'Back to lesson' : 'Save and complete lesson', cls: 'pri', on: function (c) {
				c(); e.save();
				var finish = function () { location.hash = '#/lesson/' + lesson.id; };
				if (done(lesson.id)) return finish();
				setTimeout(function () { saveProgress(lesson.id, { done: 1 }).then(function () { finish(); setTimeout(function () { celebrate(lesson, LESSONS[lesson.n + 1]); }, 300); }).catch(function (x) { toast(x.message, 'err'); }); }, 600);
			} }] : [{ text: 'Keep building', cls: 'pri', on: function (c) { c(); } }]);
		}
	}

	function openCode(pr) {
		app.innerHTML = '';
		var wrap = h('div', { class: 'st-codeapp' });
		var top = h('header', { class: 'st-ctop' });
		var dirty = false, saving = false;
		var back = h('a', { class: 'st-cb', href: '#/projects', 'aria-label': 'Back to projects' }, icon('arrow', 18));
		back.querySelector('svg').style.transform = 'scaleX(-1)';
		back.onclick = function (e) { if (dirty) { e.preventDefault(); save().then(function () { location.hash = '#/projects'; }); } };
		var title = h('input', { class: 'st-ctitle', value: pr.title, 'aria-label': 'Project name', oninput: function () { dirty = true; mark(); } });
		var saveB = h('button', { type: 'button', class: 'st-btn pri sm' }, 'Saved');
		var mark = function () { saveB.textContent = dirty ? 'Save' : 'Saved'; saveB.classList.toggle('dirty', dirty); };
		var save = function () {
			if (saving) return Promise.resolve(); saving = true; saveB.textContent = 'Saving\u2026';
			var w = lab.get();
			return api('projects', { method: 'POST', body: { id: pr.id, title: title.value, mode: 'code', html: w.html, css: w.css, js: w.js } }).then(function () { dirty = false; state.projects = null; store.del('code:' + pr.id); toast('Saved', 'ok'); })
				.catch(function (e) { toast(e.message, 'err'); }).then(function () { saving = false; mark(); });
		};
		saveB.onclick = save;
		top.appendChild(back); top.appendChild(title);
		var acts = h('div', { class: 'st-cacts' });
		acts.appendChild(h('button', { type: 'button', class: 'st-btn sm', onclick: function () { save().then(function () { shareModal(pr); }); } }, icon('globe', 16) + '<span>Share</span>'));
		acts.appendChild(h('button', { type: 'button', class: 'st-btn sm', onclick: function () { save().then(function () { submitModal(pr); }); } }, icon('users', 16) + '<span>Submit</span>'));
		acts.appendChild(saveB);
		top.appendChild(acts);
		wrap.appendChild(top);
		var local = store.get('code:' + pr.id);
		var work = local && local.at > pr.updated * 1000 + 2000 ? local : { html: pr.html, css: pr.css, js: pr.js };
		var lab = codeLab({
			work: work, tabs: ['html', 'css', 'js'], scripts: true,
			onChange: function (w) { dirty = true; mark(); store.set('code:' + pr.id, { html: w.html, css: w.css, js: w.js, at: Date.now() }); },
			tools: [{ text: 'Pictures', on: picsModal }, { text: 'Download', on: function () {
				var w = lab.get(), a = document.createElement('a');
				var doc = frameDoc(w.html, w.css).replace(/<\/body>/i, (w.js ? '<script>\n' + w.js + '\n<\/script>\n' : '') + '</body>').replace('<head>', '<head><title>' + esc(title.value) + '</title>');
				a.href = URL.createObjectURL(new Blob([doc], { type: 'text/html' })); a.download = (title.value || 'page').toLowerCase().replace(/[^a-z0-9]+/g, '-') + '.html'; document.body.appendChild(a); a.click(); a.remove();
			} }]
		});
		wrap.appendChild(lab.el);
		app.appendChild(wrap);
		document.onkeydown = function (e) { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's' && document.querySelector('.st-codeapp')) { e.preventDefault(); save(); } };
		window.onbeforeunload = function (e) { if (dirty && document.querySelector('.st-codeapp')) { e.preventDefault(); e.returnValue = ''; } };
	}

	/* ------------------------------------------------------------ classes */
	function loadClasses() { return api('classes').then(function (l) { state.classes = l; return l; }); }
	function viewClasses() {
		var me = state.me;
		var acts = h('div', { class: 'st-row' });
		acts.appendChild(h('button', { type: 'button', class: 'st-btn' + (me.teacher ? '' : ' pri'), onclick: joinModal }, 'Join with a code'));
		if (me.teacher) acts.appendChild(h('button', { type: 'button', class: 'st-btn pri', onclick: createModal }, '+ New class'));
		var p = page('Classes', me.teacher ? 'Create classes, give assignments, follow progress and review work.' : 'Join your trainer\'s class to get assignments and feedback.', acts);
		var box = h('div', null, '<div class="st-skel"></div>'); p.appendChild(box);
		shell('classes', p);
		loadClasses().then(function (list) {
			box.innerHTML = '';
			if (!list.length) { box.appendChild(h('div', { class: 'st-empty big' }, me.teacher ? '<b>No classes yet</b><p>Create a class, then share its code with your students on WhatsApp.</p>' : '<b>You are not in a class</b><p>Ask your trainer for the six-letter class code.</p>')); return; }
			var g = h('div', { class: 'st-grid' });
			list.forEach(function (c) {
				g.appendChild(h('a', { class: 'st-cc', href: '#/class/' + c.id }, '<span class="st-pc-ic">' + icon('users', 22) + '</span><b>' + esc(c.name) + '</b><small>' + (c.mine ? 'You teach &middot; ' + c.students + ' students' : 'Teacher: ' + esc(c.teacher)) + ' &middot; ' + c.assign.length + ' assignments</small>' + (c.code ? '<code>' + esc(c.code) + '</code>' : '')));
			});
			box.appendChild(g);
		}).catch(function (e) { box.innerHTML = '<div class="st-empty">' + esc(e.message) + '</div>'; });
	}
	function joinModal() {
		var inp = h('input', { type: 'text', maxlength: 6, placeholder: 'ABC123', class: 'st-codein', autocapitalize: 'characters', 'aria-label': 'Class code' });
		var b = h('div'); b.appendChild(h('p', null, 'Type the class code from your trainer.')); b.appendChild(inp);
		modal('Join a class', b, [{ text: 'Join', cls: 'pri', on: function (c) { api('classes/join', { method: 'POST', body: { code: inp.value } }).then(function (cl) { c(); toast('You joined ' + cl.name, 'ok'); location.hash = '#/class/' + cl.id; }).catch(function (e) { toast(e.message, 'err'); }); } }]);
	}
	function createModal() {
		var inp = h('input', { type: 'text', placeholder: 'e.g. Web Design, January 2027', 'aria-label': 'Class name' });
		var b = h('div'); b.appendChild(h('label', { class: 'st-field' }, [h('span', { text: 'Class name' }), inp]));
		modal('New class', b, [{ text: 'Create class', cls: 'pri', on: function (c) { api('classes', { method: 'POST', body: { name: inp.value } }).then(function (cl) { c(); location.hash = '#/class/' + cl.id; }).catch(function (e) { toast(e.message, 'err'); }); } }]);
	}
	function viewClass(id, tab) {
		var p = page('Class', '');
		var box = h('div', null, '<div class="st-skel"></div>'); p.appendChild(box);
		shell('classes', p);
		api('classes/' + id).then(function (c) {
			p.querySelector('h1').textContent = c.name;
			p.querySelector('.st-ph p') ? p.querySelector('.st-ph p').innerHTML = (c.mine ? c.students + ' students' : 'Teacher: ' + esc(c.teacher)) : null;
			box.innerHTML = '';
			if (c.mine) teacherClass(c, box, tab || 'students'); else studentClass(c, box);
		}).catch(function (e) { box.innerHTML = '<div class="st-empty">' + esc(e.message) + '</div>'; });
	}
	function statusPill(s) { return '<span class="st-pill s-' + esc(s || 'none') + '">' + ({ submitted: 'Waiting for review', approved: 'Approved', redo: 'Needs changes' }[s] || 'Not submitted') + '</span>'; }
	function studentClass(c, box) {
		var list = h('div', { class: 'st-assigns' });
		var all = [{ id: 'general', title: 'General work', brief: 'Anything you want feedback on.' }].concat(c.assign);
		all.forEach(function (a) {
			var sub = c.subs.filter(function (s) { return s.assign === a.id; })[0];
			var card = h('article', { class: 'st-as' });
			card.innerHTML = '<div class="st-as-h"><b>' + esc(a.title) + '</b>' + (a.due ? '<small>Due ' + esc(new Date(a.due).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })) + '</small>' : '') + '</div>' + (a.brief ? '<p>' + esc(a.brief) + '</p>' : '') + (a.lesson && byId[a.lesson] ? '<a href="#/lesson/' + a.lesson + '" class="st-link">Related lesson: ' + esc(byId[a.lesson].title) + '</a>' : '') +
				'<div class="st-as-s">' + statusPill(sub && sub.status) + (sub ? ' <a href="#/project/' + sub.project + '">' + esc(sub.title) + '</a>' : '') + '</div>' +
				(sub && (sub.feedback || sub.grade) ? '<div class="st-fb"><b>Feedback' + (sub.grade ? ' &middot; ' + esc(sub.grade) : '') + '</b><p>' + esc(sub.feedback) + '</p></div>' : '');
			var btn = h('button', { type: 'button', class: 'st-btn sm' + (sub ? '' : ' pri') }, sub ? 'Submit a new version' : 'Submit a project');
			btn.onclick = function () { pickProject(function (pr) { api('submit', { method: 'POST', body: { class: c.id, assign: a.id, project: pr.id } }).then(function () { toast('Submitted', 'ok'); viewClass(c.id); }).catch(function (e) { toast(e.message, 'err'); }); }); };
			card.appendChild(btn);
			list.appendChild(card);
		});
		box.appendChild(list);
		box.appendChild(h('button', { type: 'button', class: 'st-btn ghost sm', onclick: function () { if (confirm('Leave this class?')) api('classes/' + c.id + '/leave', { method: 'POST' }).then(function () { location.hash = '#/classes'; }); } }, 'Leave class'));
	}
	function pickProject(cb) {
		var b = h('div', null, '<p>Loading\u2026</p>'); var m = modal('Choose a project', b);
		loadProjects(true).then(function (list) {
			b.innerHTML = '';
			if (!list.length) { b.innerHTML = '<p>You have no projects yet. Create one in <a href="#/projects">Projects</a>.</p>'; return; }
			list.forEach(function (pr) { b.appendChild(h('button', { type: 'button', class: 'st-opt', onclick: function () { m.close(); cb(pr); } }, '<span>' + icon(pr.mode === 'code' ? 'code' : 'rows', 20) + '</span><b>' + esc(pr.title) + '</b><small>' + ago(pr.updated) + '</small>')); });
		});
	}
	function teacherClass(c, box, tab) {
		var share = h('div', { class: 'st-joincode' });
		share.innerHTML = '<div><small>Class code</small><code>' + esc(c.code) + '</code></div>';
		var msg = 'Join my class "' + c.name + '" on ' + S.name + ': open ' + S.base + ' , create a free account, then tap Classes > Join with a code and enter ' + c.code;
		share.appendChild(h('div', { class: 'st-row' }, [h('a', { class: 'st-btn wa sm', href: 'https://wa.me/?text=' + encodeURIComponent(msg), target: '_blank', rel: 'noopener' }, 'Share on WhatsApp'), h('button', { type: 'button', class: 'st-btn sm', onclick: function () { navigator.clipboard && navigator.clipboard.writeText(msg).then(function () { toast('Invitation copied', 'ok'); }); } }, 'Copy invitation')]));
		box.appendChild(share);
		var waiting = c.subs.filter(function (s) { return s.status === 'submitted'; }).length;
		var tabs = h('div', { class: 'st-seg' });
		var body = h('div');
		[['students', 'Students (' + c.members.length + ')'], ['work', 'Work to review' + (waiting ? ' (' + waiting + ')' : '')], ['assign', 'Assignments (' + c.assign.length + ')']].forEach(function (t) {
			tabs.appendChild(h('button', { type: 'button', class: tab === t[0] ? 'on' : '', onclick: function () { tab = t[0]; draw(); tabs.querySelectorAll('button').forEach(function (b, i) { b.classList.toggle('on', ['students', 'work', 'assign'][i] === tab); }); } }, t[1]));
		});
		box.appendChild(tabs); box.appendChild(body);
		function draw() {
			body.innerHTML = '';
			if (tab === 'students') {
				if (!c.members.length) { body.appendChild(h('div', { class: 'st-empty' }, 'No students yet. Share the class code above.')); return; }
				var t = h('div', { class: 'st-table' });
				c.members.sort(function (a, b) { return b.pct - a.pct; }).forEach(function (m) {
					t.appendChild(h('div', { class: 'st-tr' }, '<div class="st-who"><b>' + esc(m.name) + '</b><small>' + esc(m.email) + '</small></div><div class="st-prog"><div class="st-bar"><i style="width:' + m.pct + '%"></i></div><small>' + m.done + '/' + LESSONS.length + ' lessons &middot; active ' + ago(m.last) + (m.cert ? ' &middot; <b>Certified</b>' : '') + '</small></div>'));
					var rm = h('button', { type: 'button', class: 'st-x', title: 'Remove from class', 'aria-label': 'Remove ' + m.name, onclick: function () { if (confirm('Remove ' + m.name + ' from this class?')) api('classes/' + c.id + '/remove', { method: 'POST', body: { student: m.id } }).then(function () { viewClass(c.id, 'students'); }); } }, '&times;');
					t.lastChild.appendChild(rm);
				});
				body.appendChild(t);
			} else if (tab === 'work') {
				if (!c.subs.length) { body.appendChild(h('div', { class: 'st-empty' }, 'Nothing submitted yet.')); return; }
				c.subs.sort(function (a, b) { return (a.status === 'submitted' ? 0 : 1) - (b.status === 'submitted' ? 0 : 1) || b.at - a.at; }).forEach(function (s) {
					var a = c.assign.filter(function (x) { return x.id === s.assign; })[0];
					var card = h('article', { class: 'st-as' });
					card.innerHTML = '<div class="st-as-h"><b>' + esc(s.student) + '</b><small>' + ago(s.at) + '</small></div><p><b>' + esc(s.title) + '</b> &middot; ' + esc(a ? a.title : 'General work') + '</p><div class="st-as-s">' + statusPill(s.status) + (s.grade ? ' <b>' + esc(s.grade) + '</b>' : '') + '</div>';
					var row = h('div', { class: 'st-row' });
					if (s.pub) row.appendChild(h('button', { type: 'button', class: 'st-btn sm pri', onclick: function () { reviewModal(c, s); } }, 'Open and review'));
					card.appendChild(row);
					body.appendChild(card);
				});
			} else {
				var f = h('form', { class: 'st-form st-newas' });
				var ti = h('input', { type: 'text', name: 'title', placeholder: 'Assignment title, e.g. Build a salon website', required: true, 'aria-label': 'Assignment title' });
				var br = h('textarea', { name: 'brief', rows: 3, placeholder: 'Instructions for students', 'aria-label': 'Instructions' });
				var du = h('input', { type: 'date', name: 'due', 'aria-label': 'Due date' });
				var ls = h('select', { name: 'lesson', 'aria-label': 'Related lesson' }); ls.appendChild(h('option', { value: '' }, 'No related lesson'));
				LESSONS.forEach(function (l) { ls.appendChild(h('option', { value: l.id }, (l.n + 1) + '. ' + l.title)); });
				f.appendChild(h('h3', null, 'New assignment')); f.appendChild(ti); f.appendChild(br);
				f.appendChild(h('div', { class: 'st-row' }, [h('label', { class: 'st-field' }, [h('span', { text: 'Due date' }), du]), h('label', { class: 'st-field' }, [h('span', { text: 'Related lesson' }), ls])]));
				f.appendChild(h('button', { type: 'submit', class: 'st-btn pri' }, 'Add assignment'));
				f.onsubmit = function (e) { e.preventDefault(); api('classes/' + c.id + '/assign', { method: 'POST', body: { title: ti.value, brief: br.value, due: du.value, lesson: ls.value } }).then(function (r) { c.assign = r.assign; toast('Assignment added. Students will see it in the class.', 'ok'); draw(); }).catch(function (x) { toast(x.message, 'err'); }); };
				body.appendChild(f);
				c.assign.slice().reverse().forEach(function (a) {
					var n = c.subs.filter(function (s) { return s.assign === a.id; }).length;
					var card = h('article', { class: 'st-as' }, '<div class="st-as-h"><b>' + esc(a.title) + '</b>' + (a.due ? '<small>Due ' + esc(a.due) + '</small>' : '') + '</div><p>' + esc(a.brief || '') + '</p><small>' + n + ' submitted</small>');
					card.appendChild(h('button', { type: 'button', class: 'st-btn ghost sm', onclick: function () { if (confirm('Delete this assignment?')) api('classes/' + c.id + '/assign', { method: 'POST', body: { delete: a.id } }).then(function (r) { c.assign = r.assign; draw(); }); } }, 'Delete'));
					body.appendChild(card);
				});
			}
		}
		draw();
		box.appendChild(h('button', { type: 'button', class: 'st-btn ghost sm', style: 'margin-top:24px', onclick: function () { if (confirm('Archive this class? Students will no longer see it.')) api('classes/' + c.id + '/remove', { method: 'POST', body: { archive: 1 } }).then(function () { location.hash = '#/classes'; }); } }, 'Archive class'));
	}
	function reviewModal(c, s) {
		var b = h('div', { class: 'st-review' });
		var fr = h('iframe', { src: s.pub, title: 'Student work', class: 'st-rframe', sandbox: 'allow-scripts allow-popups allow-forms' });
		b.appendChild(h('div', { class: 'st-row' }, [h('a', { class: 'st-btn sm', href: s.pub, target: '_blank', rel: 'noopener' }, 'Open full screen'), h('a', { class: 'st-btn sm', href: '#/project/' + s.project, onclick: function () { document.querySelector('.st-modal').remove(); } }, 'Open in the editor')]));
		b.appendChild(fr);
		var fb = h('textarea', { rows: 3, placeholder: 'Feedback for ' + s.student, 'aria-label': 'Feedback' }); fb.value = s.feedback || '';
		var gr = h('input', { type: 'text', placeholder: 'Mark (optional), e.g. 8/10 or B+', 'aria-label': 'Mark' }); gr.value = s.grade || '';
		b.appendChild(fb); b.appendChild(gr);
		var send = function (status) { return function (close) { api('review/' + s.id, { method: 'POST', body: { status: status, feedback: fb.value, grade: gr.value } }).then(function () { close(); toast('Feedback sent', 'ok'); viewClass(c.id, 'work'); }).catch(function (e) { toast(e.message, 'err'); }); }; };
		modal(s.student + ': ' + s.title, b, [{ text: 'Approve', cls: 'pri', on: send('approved') }, { text: 'Needs changes', on: send('redo') }]).el.classList.add('wide');
	}

	/* ------------------------------------------------------------ me */
	var installEvt = null;
	window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); installEvt = e; });
	function viewMe() {
		var me = state.me, st = stats();
		var p = page('My account', '');
		var card = h('div', { class: 'st-me' });
		card.innerHTML = '<img src="' + esc(me.avatar) + '" alt="" width="64" height="64"><div><b>' + esc(me.name) + '</b><small>' + esc(me.email) + (me.teacher ? ' &middot; Teacher' : ' &middot; Student') + '</small></div>';
		card.appendChild(h('button', { type: 'button', class: 'st-btn sm', onclick: function () {
			var inp = h('input', { type: 'text', value: me.name, 'aria-label': 'Your name' });
			modal('Your name', inp, [{ text: 'Save', cls: 'pri', on: function (c) { api('profile', { method: 'POST', body: { name: inp.value } }).then(function (r) { state.me = r.user; c(); viewMe(); }); } }]);
		} }, 'Edit name'));
		p.appendChild(card);
		var cert = h('div', { class: 'st-certbox' });
		cert.innerHTML = '<div>' + ring(st.pct, 90) + '</div><div><h3>Practical Web Design certificate</h3><p>' + (me.cert ? 'Earned! Share it with employers and clients.' : 'Complete all ' + st.total + ' lessons to earn it. ' + (st.total - st.done) + ' to go.') + '</p></div>';
		if (me.cert) cert.appendChild(h('a', { class: 'st-btn pri', href: me.cert, target: '_blank' }, 'View certificate'));
		p.appendChild(cert);
		var list = h('div', { class: 'st-menu' });
		if (installEvt) list.appendChild(h('button', { type: 'button', onclick: function () { installEvt.prompt(); } }, icon('bolt', 18) + '<span>Install the app on this phone</span>'));
		else list.appendChild(h('div', { class: 'st-tip' }, icon('bolt', 18) + '<span><b>Tip:</b> in your browser menu choose <b>Add to Home screen</b> to open Studio like an app.</span>'));
		if (S.wpAdmin) list.appendChild(h('a', { href: S.wpAdmin }, icon('globe', 18) + '<span>WordPress dashboard</span>'));
		if (S.support) list.appendChild(h('div', { class: 'st-tip' }, icon('phone', 18) + '<span>Help: ' + esc(S.support) + '</span>'));
		list.appendChild(h('button', { type: 'button', onclick: function () { api('logout', { method: 'POST' }).then(function () { location.hash = ''; location.reload(); }); } }, icon('arrow', 18) + '<span>Sign out</span>'));
		p.appendChild(list);
		shell('me', p);
	}
	function go404() { var p = page('Not found', 'That page does not exist.'); p.appendChild(h('a', { class: 'st-btn pri', href: '#/' }, 'Go home')); shell('', p); }

	/* ------------------------------------------------------------ router */
	function route() {
		document.querySelectorAll('.st-modal').forEach(function (m) { m.remove(); });
		document.onkeydown = null; window.onbeforeunload = null;
		document.querySelectorAll('.st-checkframe').forEach(function (f) { f.remove(); });
		if (!state.me) return viewWelcome();
		var parts = (location.hash.replace(/^#\/?/, '') || '').split('/');
		switch (parts[0]) {
			case '': return viewHome();
			case 'learn': return viewLearn();
			case 'lesson': return viewLesson(parts[1]);
			case 'projects': return viewProjects();
			case 'project': return viewProject(parts[1]);
			case 'classes': return viewClasses();
			case 'class': return viewClass(parts[1]);
			case 'me': return viewMe();
			default: if (window.PLEAcademy && window.PLEAcademy.route(parts)) return; return go404();
		}
	}
	window.PLEStudio = { S: S, api: api, toast: toast, modal: modal, shell: shell, page: page, openEditor: openEditor, loadProjects: loadProjects, state: state, store: store, picUrl: picUrl, saveProgress: saveProgress, done: done, route: route, go404: go404, projectGrid: projectGrid };
	window.addEventListener('hashchange', route);
	window.addEventListener('online', function () { toast('Back online', 'ok'); });
	window.addEventListener('offline', function () { toast('You are offline. Work is kept on this phone.', 'warn'); });
	route();
})();
