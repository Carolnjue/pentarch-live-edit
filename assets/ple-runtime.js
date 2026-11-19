/*!
 * PLE Runtime: animations, sticky, scroll effects and interactive widgets on the live site.
 * No dependencies. Respects "reduce motion" settings.
 */
(function (w, d) {
	'use strict';
	var RM = w.matchMedia && w.matchMedia('(prefers-reduced-motion: reduce)').matches;
	var $$ = function (s, r) { return [].slice.call((r || d).querySelectorAll(s)); };
	var num = function (v, def) { v = parseFloat(v); return isNaN(v) ? def : v; };
	var dev = function () { var x = w.innerWidth; return x <= 767 ? 'm' : x <= 1024 ? 't' : 'd'; };
	var onDev = function (el, attr) { var v = el.getAttribute(attr); return !v || v.indexOf(dev()) > -1; };
	var io = function (cb, opts) { return 'IntersectionObserver' in w ? new IntersectionObserver(cb, opts || { threshold: 0.15, rootMargin: '0px 0px -8% 0px' }) : null; };
	var R = {};
	var EDIT = d.documentElement.hasAttribute('data-ple-editing');

	/* ----------------------------------------------------------- entrance */
	R.entrance = function (root) {
		var els = $$('[data-fx-in]', root).filter(function (e) { return !e._fxIn; });
		if (!els.length) return;
		var obs = io(function (list) {
			list.forEach(function (en) {
				var e = en.target;
				if (en.isIntersecting) { e.classList.add('fx-on'); if (e.getAttribute('data-fx-once') !== '0') obs.unobserve(e); }
				else if (e.getAttribute('data-fx-once') === '0') e.classList.remove('fx-on');
			});
		});
		els.forEach(function (e) {
			e._fxIn = 1;
			var dur = num(e.getAttribute('data-fx-dur'), 700), del = num(e.getAttribute('data-fx-delay'), 0);
			e.style.setProperty('--fx-dur', dur + 'ms'); e.style.setProperty('--fx-delay', del + 'ms');
			if (EDIT || RM || !obs || !onDev(e, 'data-fx-devices')) { e.classList.add('fx-on'); return; }
			obs.observe(e);
		});
	};
	/* Split text into words or letters for staggered reveals. */
	R.textfx = function (root) {
		$$('[data-fx-text]', root).forEach(function (e) {
			if (e._fxText) return; e._fxText = 1;
			var mode = e.getAttribute('data-fx-text'), step = num(e.getAttribute('data-fx-stagger'), mode === 'letters' ? 30 : 80), i = 0;
			var walk = function (node) {
				[].slice.call(node.childNodes).forEach(function (c) {
					if (c.nodeType === 3) {
						var parts = mode === 'letters' ? c.data.split('') : c.data.split(/(\s+)/), frag = d.createDocumentFragment();
						parts.forEach(function (p) {
							if (!p) return;
							if (/^\s+$/.test(p)) { frag.appendChild(d.createTextNode(p)); return; }
							var s = d.createElement('span'); s.className = 'fx-ch'; s.textContent = p; s.style.setProperty('--i', i++); s.style.transitionDelay = 'calc(var(--fx-delay,0ms) + ' + (i * step) + 'ms)';
							frag.appendChild(s);
						});
						c.parentNode.replaceChild(frag, c);
					} else if (c.nodeType === 1) walk(c);
				});
			};
			walk(e);
			if (!e.hasAttribute('data-fx-in')) { e.setAttribute('data-fx-in', 'text'); }
		});
	};

	/* ----------------------------------------------------------- scroll effects */
	var scrollEls = [];
	R.scrollfx = function (root) {
		if (EDIT) return;
		$$('[data-fx-scroll]', root).forEach(function (e) { if (!e._fxS) { e._fxS = 1; scrollEls.push(e); } });
		$$('[data-fx-progress]', root).forEach(function (e) { if (!e._fxS) { e._fxS = 1; scrollEls.push(e); } });
		tick();
	};
	var ticking = false;
	var tick = function () {
		if (ticking) return; ticking = true;
		w.requestAnimationFrame(function () {
			ticking = false;
			var vh = w.innerHeight, doc = d.documentElement, max = Math.max(1, doc.scrollHeight - vh), sp = w.scrollY / max;
			scrollEls.forEach(function (e) {
				if (e.hasAttribute('data-fx-progress')) { e.style.transform = 'scaleX(' + sp + ')'; return; }
				if (RM || !onDev(e, 'data-fx-devices')) { e.style.transform = ''; e.style.opacity = ''; return; }
				var r = e.getBoundingClientRect();
				if (r.bottom < -200 || r.top > vh + 200) return;
				var p = (vh - r.top) / (vh + r.height); /* 0 entering, 1 leaving */
				p = Math.max(0, Math.min(1, p));
				var k = num(e.getAttribute('data-fx-speed'), 5), t = e.getAttribute('data-fx-scroll'), c = p - 0.5;
				switch (t) {
					case 'parallax': e.style.transform = 'translate3d(0,' + (-c * k * 30) + 'px,0)'; break;
					case 'parallax-x': e.style.transform = 'translate3d(' + (-c * k * 40) + 'px,0,0)'; break;
					case 'fade': e.style.opacity = Math.max(0, Math.min(1, 1 - Math.abs(c) * 2 * (k / 5))); break;
					case 'scale': e.style.transform = 'scale(' + (1 + (0.5 - Math.abs(c)) * k * 0.04) + ')'; break;
					case 'zoom-in': e.style.transform = 'scale(' + (0.8 + p * 0.25 * (k / 5)) + ')'; break;
					case 'rotate': e.style.transform = 'rotate(' + (c * k * 8) + 'deg)'; break;
					case 'blur': e.style.filter = 'blur(' + (Math.abs(c) * k * 2) + 'px)'; break;
					case 'skew': e.style.transform = 'skewY(' + (c * k * 2) + 'deg)'; break;
				}
			});
			stickyTick();
		});
	};

	/* ----------------------------------------------------------- sticky */
	var stickies = [], lastY = 0;
	R.sticky = function (root) {
		if (EDIT) return;
		$$('[data-fx-sticky]', root).forEach(function (e) {
			if (e._fxSt) return; e._fxSt = 1;
			var ph = d.createElement('div'); ph.className = 'fx-ph'; ph.style.display = 'none';
			e.parentNode.insertBefore(ph, e);
			stickies.push({ el: e, ph: ph, mode: e.getAttribute('data-fx-sticky'), off: num(e.getAttribute('data-fx-offset'), 0), hide: e.getAttribute('data-fx-hide') === '1' });
		});
		stickyTick();
	};
	var adminBar = function () { var b = d.getElementById('wpadminbar'); return b && w.getComputedStyle(b).position === 'fixed' ? b.offsetHeight : 0; };
	var stickyTick = function () {
		var y = w.scrollY, down = y > lastY + 2, up = y < lastY - 2;
		stickies.forEach(function (s) {
			var e = s.el, active = onDev(e, 'data-fx-sd');
			if (!active) { if (e.classList.contains('fx-stuck')) unstick(s); return; }
			if (s.mode === 'bottom') { e.classList.add('fx-stuck-b'); return; }
			var ref = s.ph.style.display === 'none' ? e : s.ph;
			var top = ref.getBoundingClientRect().top, off = s.off + adminBar();
			if (top <= off && !e.classList.contains('fx-stuck')) {
				var r = e.getBoundingClientRect();
				s.ph.style.display = 'block'; s.ph.style.height = r.height + 'px';
				e.style.width = r.width + 'px'; e.style.left = r.left + 'px'; e.style.top = off + 'px';
				e.classList.add('fx-stuck');
			} else if (top > off && e.classList.contains('fx-stuck')) unstick(s);
			if (s.hide && e.classList.contains('fx-stuck')) {
				if (down && y > 200) e.classList.add('fx-away');
				else if (up) e.classList.remove('fx-away');
			}
		});
		if (Math.abs(y - lastY) > 2) lastY = y;
	};
	var unstick = function (s) { var e = s.el; e.classList.remove('fx-stuck', 'fx-away'); e.style.width = e.style.left = e.style.top = ''; s.ph.style.display = 'none'; };
	w.addEventListener('scroll', tick, { passive: true });
	w.addEventListener('resize', function () { stickies.forEach(unstick); tick(); });

	/* ----------------------------------------------------------- hover tilt and magnetic */
	R.pointer = function (root) {
		if (RM || (w.matchMedia && w.matchMedia('(pointer: coarse)').matches)) return;
		$$('[data-fx-hover="tilt"]', root).forEach(function (e) {
			if (e._fxT) return; e._fxT = 1;
			e.addEventListener('mousemove', function (ev) { var r = e.getBoundingClientRect(), x = (ev.clientX - r.left) / r.width - 0.5, y = (ev.clientY - r.top) / r.height - 0.5; e.style.transform = 'perspective(800px) rotateY(' + (x * 12) + 'deg) rotateX(' + (-y * 12) + 'deg) scale(1.02)'; });
			e.addEventListener('mouseleave', function () { e.style.transform = ''; });
		});
		$$('[data-fx-hover="magnetic"]', root).forEach(function (e) {
			if (e._fxM) return; e._fxM = 1;
			e.addEventListener('mousemove', function (ev) { var r = e.getBoundingClientRect(); e.style.transform = 'translate(' + ((ev.clientX - r.left - r.width / 2) * 0.25) + 'px,' + ((ev.clientY - r.top - r.height / 2) * 0.35) + 'px)'; });
			e.addEventListener('mouseleave', function () { e.style.transform = ''; });
		});
	};
	/* Custom cursor for the whole page (set on <body data-fx-cursor>). */
	R.cursor = function () {
		if (EDIT) return;
		var mode = d.body && d.body.getAttribute('data-fx-cursor');
		if (!mode || RM || d.querySelector('.fx-cursor') || (w.matchMedia && w.matchMedia('(pointer: coarse)').matches)) return;
		var c = d.createElement('div'); c.className = 'fx-cursor fx-cursor-' + mode; d.body.appendChild(c);
		var x = 0, y = 0, cx = 0, cy = 0;
		d.addEventListener('mousemove', function (e) { x = e.clientX; y = e.clientY; });
		d.addEventListener('mouseover', function (e) { c.classList.toggle('big', !!e.target.closest('a,button,[data-fx-hover]')); });
		(function loop() { cx += (x - cx) * 0.2; cy += (y - cy) * 0.2; c.style.transform = 'translate(' + cx + 'px,' + cy + 'px)'; w.requestAnimationFrame(loop); })();
	};

	/* ----------------------------------------------------------- counters, progress, typing */
	R.counters = function (root) {
		var els = $$('[data-count]', root).filter(function (e) { return !e._fxC; });
		var run = function (e) {
			var to = num(e.getAttribute('data-count'), 0), dec = (String(e.getAttribute('data-count')).split('.')[1] || '').length, dur = num(e.getAttribute('data-count-dur'), 1800), t0 = null;
			var fmt = function (v) { return v.toFixed(dec).replace(/\B(?=(\d{3})+(?!\d))/g, ','); };
			if (RM) { e.textContent = fmt(to); return; }
			var step = function (ts) { if (!t0) t0 = ts; var p = Math.min(1, (ts - t0) / dur); e.textContent = fmt(to * (1 - Math.pow(1 - p, 3))); if (p < 1) w.requestAnimationFrame(step); };
			w.requestAnimationFrame(step);
		};
		var obs = io(function (list) { list.forEach(function (en) { if (en.isIntersecting) { obs.unobserve(en.target); run(en.target); } }); });
		els.forEach(function (e) { e._fxC = 1; if (obs) obs.observe(e); else run(e); });
		$$('[data-bar]', root).forEach(function (e) {
			if (e._fxB) return; e._fxB = 1;
			var o = io(function (l) { l.forEach(function (en) { if (en.isIntersecting) { o.unobserve(e); e.style.width = e.getAttribute('data-bar') + '%'; } }); });
			if (o && !RM) o.observe(e); else e.style.width = e.getAttribute('data-bar') + '%';
		});
	};
	R.typing = function (root) {
		$$('[data-type-words]', root).forEach(function (e) {
			if (e._fxTy) return; e._fxTy = 1;
			var words = e.getAttribute('data-type-words').split('|').filter(Boolean), i = 0, j = 0, del = false;
			if (!words.length) return;
			if (RM) { e.textContent = words[0]; return; }
			(function loop() {
				var wd = words[i % words.length];
				e.textContent = wd.slice(0, j);
				if (!del && j < wd.length) { j++; setTimeout(loop, 70); }
				else if (!del) { del = true; setTimeout(loop, 1600); }
				else if (j > 0) { j--; setTimeout(loop, 35); }
				else { del = false; i++; setTimeout(loop, 300); }
			})();
		});
	};
	R.countdown = function (root) {
		$$('[data-countdown]', root).forEach(function (e) {
			if (e._fxCd) return; e._fxCd = 1;
			var end = new Date(e.getAttribute('data-countdown')).getTime();
			var parts = { d: e.querySelector('[data-cd=d]'), h: e.querySelector('[data-cd=h]'), m: e.querySelector('[data-cd=m]'), s: e.querySelector('[data-cd=s]') };
			var pad = function (n) { return (n < 10 ? '0' : '') + n; };
			(function upd() {
				var left = Math.max(0, end - Date.now()), s = Math.floor(left / 1000);
				if (parts.d) parts.d.textContent = Math.floor(s / 86400);
				if (parts.h) parts.h.textContent = pad(Math.floor(s % 86400 / 3600));
				if (parts.m) parts.m.textContent = pad(Math.floor(s % 3600 / 60));
				if (parts.s) parts.s.textContent = pad(s % 60);
				if (left <= 0) { e.classList.add('cd-done'); return; }
				setTimeout(upd, 1000);
			})();
		});
	};

	/* ----------------------------------------------------------- slider (hero, content, testimonials) */
	R.sliders = function (root) {
		$$('[data-slider]', root).forEach(function (s) {
			if (s._fxSl) return; s._fxSl = 1;
			var track = s.querySelector('.pl-slides'), slides = track ? [].slice.call(track.children) : [];
			if (slides.length < 2) { slides.forEach(function (x) { x.classList.add('on'); }); return; }
			var fx = s.getAttribute('data-effect') || 'slide', auto = num(s.getAttribute('data-auto'), 5000), i = 0, timer, per = num(s.getAttribute('data-per'), 1);
			if (dev() === 'm') per = 1; else if (dev() === 't') per = Math.min(per, 2);
			s.classList.add('pl-fx-' + fx);
			if (fx === 'slide') s.style.setProperty('--per', per);
			var dots = s.querySelector('.pl-dots');
			if (dots) { dots.innerHTML = ''; slides.forEach(function (_, k) { if (fx === 'slide' && k > slides.length - per) return; var b = d.createElement('button'); b.type = 'button'; b.setAttribute('aria-label', 'Slide ' + (k + 1)); b.onclick = function () { go(k); restart(); }; dots.appendChild(b); }); }
			var go = function (k) {
				var n = fx === 'slide' ? Math.max(1, slides.length - per + 1) : slides.length;
				i = (k + n) % n;
				if (fx === 'slide') track.style.transform = 'translateX(' + (-i * 100 / per) + '%)';
				slides.forEach(function (x, kk) { x.classList.toggle('on', kk === i); x.classList.toggle('prev', kk === (i - 1 + slides.length) % slides.length); x.setAttribute('aria-hidden', kk === i ? 'false' : 'true'); });
				if (dots) [].forEach.call(dots.children, function (b, kk) { b.classList.toggle('on', kk === i); });
			};
			var restart = function () { clearInterval(timer); if (auto > 0 && !RM) timer = setInterval(function () { go(i + 1); }, auto); };
			var p = s.querySelector('.pl-prev'), n2 = s.querySelector('.pl-next');
			if (p) p.onclick = function () { go(i - 1); restart(); };
			if (n2) n2.onclick = function () { go(i + 1); restart(); };
			var x0 = null;
			s.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
			s.addEventListener('touchend', function (e) { if (x0 === null) return; var dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 40) { go(i + (dx < 0 ? 1 : -1)); restart(); } x0 = null; });
			s.addEventListener('mouseenter', function () { clearInterval(timer); });
			s.addEventListener('mouseleave', restart);
			go(0); restart();
		});
	};

	/* ----------------------------------------------------------- tabs, toggles, popups, lightbox */
	R.tabs = function (root) {
		$$('[data-tabs]', root).forEach(function (t) {
			if (t._fxTb) return; t._fxTb = 1;
			var btns = $$('[role=tab]', t), panes = $$('[role=tabpanel]', t);
			var show = function (k) { btns.forEach(function (b, i) { b.setAttribute('aria-selected', i === k ? 'true' : 'false'); b.tabIndex = i === k ? 0 : -1; }); panes.forEach(function (p, i) { p.hidden = i !== k; }); };
			btns.forEach(function (b, i) {
				b.addEventListener('click', function () { show(i); });
				b.addEventListener('keydown', function (e) { if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { var k = (i + (e.key === 'ArrowRight' ? 1 : -1) + btns.length) % btns.length; show(k); btns[k].focus(); } });
			});
			show(0);
		});
		$$('details[data-acc-group]', root).forEach(function (dt) {
			if (dt._fxAc) return; dt._fxAc = 1;
			dt.addEventListener('toggle', function () { if (!dt.open) return; var g = dt.getAttribute('data-acc-group'); $$('details[data-acc-group="' + g + '"]').forEach(function (o) { if (o !== dt) o.open = false; }); });
		});
	};
	var openModal = function (html, cls) {
		var m = d.createElement('div'); m.className = 'pl-modal ' + (cls || ''); m.setAttribute('role', 'dialog'); m.setAttribute('aria-modal', 'true');
		m.innerHTML = '<div class="pl-modal-box"><button type="button" class="pl-x" aria-label="Close">&times;</button>' + html + '</div>';
		var close = function () { m.classList.remove('on'); setTimeout(function () { m.remove(); }, 250); d.removeEventListener('keydown', k); };
		var k = function (e) { if (e.key === 'Escape') close(); };
		m.addEventListener('click', function (e) { if (e.target === m || e.target.closest('.pl-x')) close(); });
		d.addEventListener('keydown', k); d.body.appendChild(m);
		setTimeout(function () { m.classList.add('on'); var f = m.querySelector('.pl-x'); if (f) f.focus(); }, 10);
		return m;
	};
	R.lightbox = function (root) {
		$$('[data-lightbox]', root).forEach(function (g) {
			if (g._fxLb) return; g._fxLb = 1;
			var items = $$('a[data-full]', g);
			items.forEach(function (a, i) {
				a.addEventListener('click', function (e) {
					e.preventDefault();
					var k = i, m = openModal('<figure class="pl-lb"><img alt=""><figcaption></figcaption></figure><button type="button" class="pl-lb-p" aria-label="Previous">&#8249;</button><button type="button" class="pl-lb-n" aria-label="Next">&#8250;</button>', 'pl-lbm');
					var set = function () { var it = items[(k + items.length) % items.length]; m.querySelector('img').src = it.getAttribute('data-full'); m.querySelector('img').alt = it.getAttribute('data-cap') || ''; m.querySelector('figcaption').textContent = it.getAttribute('data-cap') || ''; };
					m.querySelector('.pl-lb-p').onclick = function () { k--; set(); };
					m.querySelector('.pl-lb-n').onclick = function () { k++; set(); };
					set();
				});
			});
		});
		$$('[data-video-lightbox]', root).forEach(function (a) {
			if (a._fxVl) return; a._fxVl = 1;
			a.addEventListener('click', function (e) { e.preventDefault(); openModal('<div class="pl-vlb"><iframe src="' + a.getAttribute('data-video-lightbox') + '?autoplay=1" allow="autoplay; encrypted-media; fullscreen" allowfullscreen title="Video"></iframe></div>', 'pl-lbm'); });
		});
		$$('[data-modal-src]', root).forEach(function (a) {
			if (a._fxMd) return; a._fxMd = 1;
			a.addEventListener('click', function (e) { var src = d.getElementById(a.getAttribute('data-modal-src')); if (!src) return; e.preventDefault(); openModal(src.innerHTML, 'pl-mdl'); });
		});
	};
	R.popups = function (root) {
		if (EDIT) return;
		$$('[data-popup]', root).forEach(function (p) {
			if (p._fxPp) return; p._fxPp = 1;
			var id = p.id, trig = p.getAttribute('data-popup'), delay = num(p.getAttribute('data-popup-delay'), 5), key = 'plpop-' + id;
			var show = function () {
				if (p.getAttribute('data-popup-once') === '1') { try { if (sessionStorage.getItem(key)) return; sessionStorage.setItem(key, '1'); } catch (e) { } }
				openModal(p.innerHTML, 'pl-popup');
			};
			if (trig === 'load') setTimeout(show, delay * 1000);
			if (trig === 'exit') d.addEventListener('mouseout', function ex(e) { if (!e.relatedTarget && e.clientY < 10) { d.removeEventListener('mouseout', ex); show(); } });
			if (trig === 'scroll') w.addEventListener('scroll', function sc() { if (w.scrollY / Math.max(1, d.documentElement.scrollHeight - w.innerHeight) > delay / 100) { w.removeEventListener('scroll', sc); show(); } }, { passive: true });
			d.addEventListener('click', function (e) { var a = e.target.closest('a[href="#' + id + '"]'); if (a) { e.preventDefault(); openModal(p.innerHTML, 'pl-popup'); } });
		});
	};
	R.compare = function (root) {
		$$('[data-compare]', root).forEach(function (c) {
			if (c._fxCp) return; c._fxCp = 1;
			var r = c.querySelector('input[type=range]');
			var set = function () { c.style.setProperty('--pos', r.value + '%'); };
			r.addEventListener('input', set); set();
		});
	};
	R.hotspots = function (root) {
		$$('.pl-hs-dot', root).forEach(function (b) {
			if (b._fxHs) return; b._fxHs = 1;
			b.addEventListener('click', function () { var o = b.parentNode.classList.contains('open'); $$('.pl-hs.open', b.closest('.pl-hotspots')).forEach(function (x) { x.classList.remove('open'); }); if (!o) b.parentNode.classList.add('open'); });
		});
	};
	R.toc = function (root) {
		$$('[data-toc]', root).forEach(function (t) {
			if (t._fxToc) return; t._fxToc = 1;
			var scope = d.querySelector(t.getAttribute('data-toc') || 'main') || d.body, n = 0;
			var list = $$('h2,h3', scope).filter(function (h) { return !t.contains(h) && h.textContent.trim(); });
			t.querySelector('ol').innerHTML = list.map(function (h) { if (!h.id) h.id = 'toc-' + (++n); return '<li class="toc-' + h.tagName.toLowerCase() + '"><a href="#' + h.id + '">' + h.textContent.replace(/</g, '&lt;') + '</a></li>'; }).join('');
		});
	};
	R.backtotop = function (root) {
		$$('[data-totop]', root).forEach(function (b) {
			if (b._fxTt) return; b._fxTt = 1;
			b.addEventListener('click', function (e) { e.preventDefault(); w.scrollTo({ top: 0, behavior: RM ? 'auto' : 'smooth' }); });
			w.addEventListener('scroll', function () { b.classList.toggle('on', w.scrollY > 500); }, { passive: true });
		});
	};
	R.share = function (root) {
		$$('[data-share]', root).forEach(function (a) {
			if (a._fxSh) return; a._fxSh = 1;
			var u = encodeURIComponent(location.href), t = encodeURIComponent(d.title), map = { whatsapp: 'https://wa.me/?text=' + t + '%20' + u, facebook: 'https://www.facebook.com/sharer/sharer.php?u=' + u, x: 'https://twitter.com/intent/tweet?url=' + u + '&text=' + t, linkedin: 'https://www.linkedin.com/sharing/share-offsite/?url=' + u, email: 'mailto:?subject=' + t + '&body=' + u };
			a.href = map[a.getAttribute('data-share')] || '#';
			if (a.getAttribute('data-share') === 'copy') a.addEventListener('click', function (e) { e.preventDefault(); if (navigator.clipboard) navigator.clipboard.writeText(location.href); a.classList.add('done'); });
		});
	};
	R.lottie = function (root) {
		var els = $$('[data-lottie]', root).filter(function (e) { return !e._fxLo; });
		if (!els.length) return;
		var go = function () { els.forEach(function (e) { e._fxLo = 1; w.lottie.loadAnimation({ container: e, renderer: 'svg', loop: e.getAttribute('data-loop') !== '0', autoplay: !RM, path: e.getAttribute('data-lottie') }); }); };
		if (w.lottie) return go();
		var s = d.createElement('script'); s.src = 'https://cdnjs.cloudflare.com/ajax/libs/lottie-web/5.12.2/lottie.min.js'; s.onload = go; d.head.appendChild(s);
	};
	R.particles = function (root) {
		$$('canvas[data-particles]', root).forEach(function (cv) {
			if (cv._fxPa || RM) return; cv._fxPa = 1;
			var ctx = cv.getContext('2d'), col = cv.getAttribute('data-particles') || '#ffffff', pts = [], W, H;
			var size = function () { W = cv.width = cv.offsetWidth; H = cv.height = cv.offsetHeight; };
			size(); w.addEventListener('resize', size);
			for (var i = 0; i < 60; i++) pts.push({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - 0.5) * 0.4, vy: (Math.random() - 0.5) * 0.4 });
			(function draw() {
				ctx.clearRect(0, 0, W, H); ctx.fillStyle = col; ctx.strokeStyle = col;
				pts.forEach(function (p, a) {
					p.x += p.vx; p.y += p.vy; if (p.x < 0 || p.x > W) p.vx *= -1; if (p.y < 0 || p.y > H) p.vy *= -1;
					ctx.globalAlpha = 0.7; ctx.beginPath(); ctx.arc(p.x, p.y, 1.8, 0, 6.3); ctx.fill();
					for (var b = a + 1; b < pts.length; b++) { var q = pts[b], dd = Math.hypot(p.x - q.x, p.y - q.y); if (dd < 110) { ctx.globalAlpha = (1 - dd / 110) * 0.35; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke(); } }
				});
				w.requestAnimationFrame(draw);
			})();
		});
	};
	/* Horizontal scroll section: vertical scrolling moves the row sideways while it is pinned. */
	var hsecs = [];
	R.hscroll = function (root) {
		if (EDIT) return;
		$$('[data-fx-hscroll]', root).forEach(function (s) {
			if (s._fxHz) return; s._fxHz = 1; hsecs.push(s);
		});
		var upd = function () {
			hsecs.forEach(function (s) {
				var track = s.querySelector('.pl-hs-track'); if (!track) return;
				if (dev() === 'm' || RM) { s.style.height = ''; track.style.transform = ''; s.classList.add('pl-hs-off'); return; }
				s.classList.remove('pl-hs-off');
				var extra = track.scrollWidth - w.innerWidth; s.style.height = (w.innerHeight + Math.max(0, extra)) + 'px';
				var r = s.getBoundingClientRect(), p = Math.min(1, Math.max(0, -r.top / Math.max(1, extra)));
				track.style.transform = 'translateX(' + (-p * extra) + 'px)';
			});
		};
		w.addEventListener('scroll', function () { w.requestAnimationFrame(upd); }, { passive: true });
		w.addEventListener('resize', upd); upd();
	};

	/* Forms: save the entry in WordPress, email it, and optionally open WhatsApp. */
	R.forms = function (root) {
		$$('form[data-ple-form]', root).forEach(function (f) {
			if (f._fxF) return; f._fxF = 1;
			f.addEventListener('submit', function (e) {
				e.preventDefault();
				if (EDIT) return;
				var msg = f.querySelector('.pl-msg'), btn = f.querySelector('button[type=submit]'), labels = [];
				try { labels = JSON.parse(f.getAttribute('data-labels') || '[]'); } catch (x) { }
				var data = {}, wa = [];
				labels.forEach(function (l, i) { var el = f.elements['f' + i]; if (!el) return; var v = el.type === 'checkbox' ? (el.checked ? 'Yes' : 'No') : el.value; data[l] = v; wa.push(l + ': ' + v); });
				btn.disabled = true; if (msg) { msg.className = 'pl-msg'; msg.textContent = 'Sending\u2026'; }
				var api = (w.PLE_REST || '/wp-json/ple/v2/') + 'form';
				fetch(api, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ form: f.getAttribute('data-name'), fid: f.getAttribute('data-ple-form'), page: location.href, fields: data, hp: f.elements.website ? f.elements.website.value : '' }) })
					.then(function (r) { return r.json().then(function (j) { if (!r.ok) throw new Error(j && j.message || 'Could not send'); return j; }); })
					.then(function () {
						if (msg) { msg.className = 'pl-msg ok'; msg.textContent = f.getAttribute('data-ok') || 'Thank you.'; }
						var num = f.getAttribute('data-wa'); if (num) w.open('https://wa.me/' + num + '?text=' + encodeURIComponent((f.getAttribute('data-name') || 'Form') + '\n' + wa.join('\n')), '_blank');
						f.reset();
					})
					.catch(function (x) { if (msg) { msg.className = 'pl-msg err'; msg.textContent = x.message + '. Please try again or contact us directly.'; } })
					.then(function () { btn.disabled = false; });
			});
		});
	};
	R.init = function (root) {
		root = root || d;
		['textfx', 'entrance', 'scrollfx', 'sticky', 'pointer', 'counters', 'typing', 'countdown', 'sliders', 'tabs', 'lightbox', 'popups', 'compare', 'hotspots', 'toc', 'backtotop', 'share', 'lottie', 'particles', 'hscroll', 'forms'].forEach(function (k) { try { R[k](root); } catch (e) { if (w.console) console.warn('PLE ' + k, e); } });
		try { R.cursor(); } catch (e) { }
	};
	w.PLERun = R;
	d.documentElement.classList.add('ple-fx');
	if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', function () { R.init(); }); else R.init();
})(window, document);
