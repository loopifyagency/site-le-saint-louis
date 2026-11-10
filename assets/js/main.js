/* ==========================================================================
   Le Saint Louis · mise en scène
   GSAP + ScrollTrigger + Lenis. Tout est lisible sans JS ; les animations
   n'utilisent que transform / opacity / clip-path pour rester à 60 i/s.
   ========================================================================== */
(function () {
  'use strict';

  var root = document.documentElement;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var hasGsap = !!(window.gsap && window.ScrollTrigger);
  var lenis = null;
  var menuIsOpen = false;

  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

  /* ─────────────── Horaires en direct (heure de Paris) ─────────────── */
  var SCHEDULE = { 0: null, 1: null, 2: [9, 18], 3: [9, 18], 4: [9, 18], 5: [9, 18], 6: [9, 17] };
  var DAYS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];

  function parisNow() {
    try {
      var f = new Intl.DateTimeFormat('en-US', { timeZone: 'Europe/Paris', weekday: 'short', hour: 'numeric', minute: 'numeric', hourCycle: 'h23' });
      var p = {};
      f.formatToParts(new Date()).forEach(function (x) { p[x.type] = x.value; });
      var map = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
      return { day: map[p.weekday], mins: (parseInt(p.hour, 10) % 24) * 60 + parseInt(p.minute, 10) };
    } catch (e) {
      var d = new Date();
      return { day: d.getDay(), mins: d.getHours() * 60 + d.getMinutes() };
    }
  }

  function openStatus() {
    var now = parisNow();
    var today = SCHEDULE[now.day];
    if (today) {
      if (now.mins >= today[0] * 60 && now.mins < today[1] * 60) return { state: 'open', text: 'Ouvert maintenant · jusqu’à ' + today[1] + ' h' };
      if (now.mins < today[0] * 60) return { state: 'closed', text: 'Fermé · ouvre aujourd’hui à ' + today[0] + ' h' };
    }
    for (var i = 1; i <= 7; i++) {
      var d = (now.day + i) % 7;
      if (SCHEDULE[d]) return { state: 'closed', text: 'Fermé · rouvre ' + (i === 1 ? 'demain' : DAYS[d]) + ' à ' + SCHEDULE[d][0] + ' h' };
    }
    return null;
  }

  function initHours() {
    var s = openStatus();
    if (s) {
      $$('.js-open').forEach(function (el) { el.textContent = s.text; });
      $$('.status__dot').forEach(function (el) { el.setAttribute('data-state', s.state); });
    }
    var li = $('#hours li[data-day="' + parisNow().day + '"]');
    if (li) { li.classList.add('is-today'); li.setAttribute('aria-current', 'date'); }
  }

  /* ─────────────── Découpe de textes (accessible : copie lisible + copie animée aria-hidden) ─────────────── */
  function splitChars(el) {
    var text = el.textContent.trim();
    el.textContent = '';
    var sr = document.createElement('span'); sr.className = 'sr-only'; sr.textContent = text;
    var vis = document.createElement('span'); vis.className = 'split'; vis.setAttribute('aria-hidden', 'true');
    var chars = [];
    text.split(' ').forEach(function (word, wi, arr) {
      var w = document.createElement('span'); w.className = 'sw';
      Array.prototype.forEach.call(word, function (c) {
        var m = document.createElement('span'); m.className = 'sc';
        var i = document.createElement('span'); i.className = 'sc__i'; i.textContent = c;
        m.appendChild(i); w.appendChild(m); chars.push(i);
      });
      vis.appendChild(w);
      if (wi < arr.length - 1) vis.appendChild(document.createTextNode(' '));
    });
    el.appendChild(sr); el.appendChild(vis);
    return chars;
  }

  function splitWords(el, mask) {
    var text = el.textContent.trim().replace(/\s+/g, ' ');
    el.textContent = '';
    var sr = document.createElement('span'); sr.className = 'sr-only'; sr.textContent = text;
    var vis = document.createElement('span'); vis.className = 'split'; vis.setAttribute('aria-hidden', 'true');
    var parts = [];
    text.split(' ').forEach(function (w, i, arr) {
      var o = document.createElement('span');
      if (mask) {
        o.className = 'ww';
        var n = document.createElement('span'); n.className = 'wi'; n.textContent = w; o.appendChild(n); parts.push(n);
      } else { o.className = 'mw'; o.textContent = w; parts.push(o); }
      vis.appendChild(o);
      if (i < arr.length - 1) vis.appendChild(document.createTextNode(' '));
    });
    el.appendChild(sr); el.appendChild(vis);
    return parts;
  }

  /* ─────────────── Menu mobile ─────────────── */
  function setMenu(state) {
    var burger = $('#burger'), menu = $('#menu');
    if (!burger || !menu || menuIsOpen === state) return;
    menuIsOpen = state;
    burger.setAttribute('aria-expanded', String(state));
    burger.setAttribute('aria-label', state ? 'Fermer le menu' : 'Ouvrir le menu');
    menu.classList.toggle('is-open', state);
    root.classList.toggle('menu-open', state);
    menu.inert = !state;
    ['main', 'footer', '#fab'].forEach(function (s) { var el = $(s); if (el) el.inert = state; });
    if (lenis) { if (state) lenis.stop(); else lenis.start(); }
    if (state) setTimeout(function () { var a = $('a', menu); if (a && menuIsOpen) a.focus({ preventScroll: true }); }, 450);
  }

  function initMenu() {
    var burger = $('#burger'), menu = $('#menu');
    if (!burger || !menu) return;
    menu.inert = true;
    burger.addEventListener('click', function () { setMenu(!menuIsOpen); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && menuIsOpen) { setMenu(false); burger.focus(); }
    });
    window.matchMedia('(min-width: 900px)').addEventListener('change', function (e) { if (e.matches) setMenu(false); });
  }

  /* ─────────────── Ancres (défilement fluide) ─────────────── */
  function initAnchors() {
    $$('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var href = a.getAttribute('href');
        if (!href || href.length < 2) return;
        var target = $(href);
        if (!target) return;
        e.preventDefault();
        if (menuIsOpen) setMenu(false);
        if (lenis) {
          lenis.scrollTo(href === '#top' ? 0 : target, { duration: 1.7, easing: function (t) { return t === 1 ? 1 : 1 - Math.pow(2, -10 * t); } });
        } else {
          target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
        }
        target.setAttribute('tabindex', '-1');
        target.focus({ preventScroll: true });
      });
    });
  }

  /* ─────────────── Carrousel d'avis (fonctionne sans GSAP) ─────────────── */
  function initCarousel() {
    var car = $('#carousel'); if (!car) return;
    var track = $('#carouselTrack');
    var slides = $$('.slide', track), tabs = $$('.tab', car);
    var index = 0, auto = !reduce;
    var DUR = 8;
    car.style.setProperty('--dur', DUR + 's');
    if (!auto) car.classList.add('no-auto');

    function restartBar() {
      var b = $('.tab.is-active .tab__bar b', car);
      if (!b) return;
      b.style.animation = 'none'; void b.offsetWidth; b.style.animation = '';
    }
    function go(i) {
      index = (i + slides.length) % slides.length;
      track.style.transform = 'translate3d(calc(' + (-index) + ' * (100% + 3rem)),0,0)';
      slides.forEach(function (s, k) { s.classList.toggle('is-active', k === index); s.setAttribute('aria-hidden', k === index ? 'false' : 'true'); });
      tabs.forEach(function (t, k) {
        var on = k === index;
        t.classList.toggle('is-active', on);
        if (on) t.setAttribute('aria-current', 'true'); else t.removeAttribute('aria-current');
      });
      restartBar();
    }
    go(0);

    tabs.forEach(function (t, k) { t.addEventListener('click', function () { go(k); }); });
    $('#prevBtn').addEventListener('click', function () { go(index - 1); });
    $('#nextBtn').addEventListener('click', function () { go(index + 1); });
    car.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { go(index + 1); } else if (e.key === 'ArrowLeft') { go(index - 1); }
    });
    car.addEventListener('animationend', function (e) { if (e.animationName === 'tabfill' && auto) go(index + 1); });

    var holds = { hover: false, focus: false, offscreen: false, hidden: false };
    function applyPause() { car.classList.toggle('is-paused', holds.hover || holds.focus || holds.offscreen || holds.hidden); }
    car.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') { holds.hover = true; applyPause(); } });
    car.addEventListener('pointerleave', function () { holds.hover = false; applyPause(); });
    car.addEventListener('focusin', function (e) { if (e.target.matches(':focus-visible')) { holds.focus = true; applyPause(); } });
    car.addEventListener('focusout', function () { holds.focus = false; applyPause(); });
    document.addEventListener('visibilitychange', function () { holds.hidden = document.hidden; applyPause(); });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) { holds.offscreen = !en[0].isIntersecting; applyPause(); }, { threshold: .25 }).observe(car);
    }

    // glisser / balayer
    var vp = $('.carousel__viewport', car), x0 = null;
    vp.addEventListener('pointerdown', function (e) { x0 = e.clientX; });
    window.addEventListener('pointerup', function (e) {
      if (x0 === null) return;
      var dx = e.clientX - x0; x0 = null;
      if (Math.abs(dx) > 50) go(index + (dx < 0 ? 1 : -1));
    });
  }

  /* ─────────────── Chiffres du téléphone qui roulent (CTA) ─────────────── */
  function initPhone() {
    var a = $('#ctaPhone'); if (!a) return;
    var txt = a.textContent.trim(); a.textContent = '';
    var n = 0;
    Array.prototype.forEach.call(txt, function (c) {
      var d = document.createElement('span'); d.className = 'dg'; d.setAttribute('aria-hidden', 'true');
      if (c === ' ') { d.classList.add('dg--sp'); } else {
        var i = document.createElement('span'); i.className = 'dg__i'; i.style.setProperty('--n', n++);
        i.innerHTML = '<span>' + c + '</span><span>' + c + '</span>';
        d.appendChild(i);
      }
      a.appendChild(d);
    });
  }

  /* ─────────────── Mode sans animation ─────────────── */
  function finishStatic() {
    root.classList.add('is-static');
    root.classList.remove('is-loading');
  }

  /* ═════════════════════ MOUVEMENT ═════════════════════ */
  function initMotion() {
    gsap.registerPlugin(ScrollTrigger);
    ScrollTrigger.config({ ignoreMobileResize: true });
    gsap.defaults({ ease: 'expo.out' });

    var isDesktop = window.matchMedia('(min-width: 900px)').matches;
    var K = isDesktop ? 1 : .5;           // amplitude des effets, réduite sur mobile
    var expoInOut = function (t) { return t === 0 ? 0 : t === 1 ? 1 : t < .5 ? Math.pow(2, 20 * t - 10) / 2 : (2 - Math.pow(2, -20 * t + 10)) / 2; };

    /* Smooth scroll */
    lenis = new Lenis({ duration: 1.15, easing: function (t) { return t === 1 ? 1 : 1 - Math.pow(2, -10 * t); }, smoothWheel: true, wheelMultiplier: .95 });
    window.__lenis = lenis;
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
    lenis.stop();
    window.scrollTo(0, 0);

    /* Découpes */
    var heroChars = $$('.hero [data-chars]').reduce(function (acc, el) { return acc.concat(splitChars(el)); }, []);
    var footChars = $$('[data-chars-f]').reduce(function (acc, el) { return acc.concat(splitChars(el)); }, []);
    var headings = $$('[data-words]').map(function (el) { return { el: el, parts: splitWords(el, true) }; });
    var manifestWords = splitWords($('#manifestText'), false);

    /* ── Intro du hero ── */
    function heroIntro() {
      var tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
      tl.from('.ring', { scale: .8, opacity: 0, svgOrigin: '300 760', duration: 2.4, stagger: .14 }, 0)
        .from(heroChars, { yPercent: 118, duration: 1.4, stagger: .05 }, .05)
        .fromTo('.hero__main .arche', { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.8, ease: 'expo.inOut' }, .1)
        .from('.hero__main .arche img', { scale: 1.35, duration: 2.2 }, .1)
        .fromTo('.hero__sub .arche', { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.6, ease: 'expo.inOut' }, .45)
        .from('.hero__tag, .hero__lead', { y: 34, opacity: 0, duration: 1.1, stagger: .12 }, .5)
        .from('.hero__cta > *', { y: 28, opacity: 0, duration: 1, stagger: .1 }, .75)
        .from('.hero .status', { y: 14, opacity: 0, duration: .9 }, 1)
        .from('.hero .sprig', { scale: .3, opacity: 0, duration: 2, stagger: .2, transformOrigin: '50% 100%' }, .4)
        .from('.hero__cue', { opacity: 0, duration: 1 }, 1.4)
        .from('#header', { yPercent: -110, duration: 1.1 }, .9);
      return tl;
    }
    var heroTl = heroIntro();
    heroTl.pause(0);

    /* ── Préchargeur : on traverse l'arche-miroir ── */
    function runLoader() {
      return new Promise(function (resolve) {
        var loader = $('#loader');
        if (!loader || !root.classList.contains('is-loading')) { heroTl.play(0); lenis.start(); resolve(); return; }

        var W = window.innerWidth, H = window.innerHeight;
        var svg = $('#loaderSvg');
        svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
        ['#loaderMaskRect', '#loaderVeil'].forEach(function (s) { var e = $(s); e.setAttribute('width', W); e.setAttribute('height', H); });
        var mask = $('#loaderMask'); mask.setAttribute('width', W); mask.setAttribute('height', H);

        var aw = Math.min(W * .62, 250), ah = aw * 1.36, r = aw / 2;
        var cx = W / 2, cy = H / 2, left = cx - r, top = cy - ah / 2;
        var d = 'M' + left + ' ' + (top + ah) + 'V' + (top + r) + 'A' + r + ' ' + r + ' 0 0 1 ' + (left + aw) + ' ' + (top + r) + 'V' + (top + ah);
        $('#loaderHole').setAttribute('d', d + 'Z');
        $('#loaderLine').setAttribute('d', d);
        loader.style.background = 'transparent';
        loader.style.setProperty('--aw', aw + 'px');

        // lettres du mot-symbole
        ['.loader__l1', '.loader__l2'].forEach(function (s) {
          var el = $(s, loader), t = el.textContent; el.textContent = '';
          Array.prototype.forEach.call(t, function (c) { var i = document.createElement('i'); i.textContent = c; el.appendChild(i); });
        });
        var letters = $$('.loader__brand i', loader);
        var hole = $('#loaderHole'), line = $('#loaderLine');
        var scaleEnd = (Math.hypot(W, H) * 1.25) / aw;

        gsap.set([hole, line], { svgOrigin: cx + ' ' + cy, scale: .55 });
        gsap.set(line, { strokeDasharray: 1, strokeDashoffset: 1 });
        gsap.set(letters, { yPercent: 115 });

        var tl = gsap.timeline({ onComplete: function () {
          root.classList.remove('is-loading');
          lenis.start();
          ScrollTrigger.refresh();
          resolve();
        } });
        tl.to([hole, line], { scale: 1, duration: 1.5, ease: 'expo.out' }, 0)
          .to(line, { strokeDashoffset: 0, duration: 1.5, ease: 'power2.inOut' }, 0)
          .to(letters, { yPercent: 0, duration: 1.1, stagger: .05, ease: 'expo.out' }, .55)
          .to({}, { duration: .55 })
          .to(letters, { yPercent: -115, duration: .55, stagger: .02, ease: 'power3.in' })
          .addLabel('zoom', '>-.1')
          .to(line, { opacity: 0, duration: .5, ease: 'power1.in' }, 'zoom')
          .to([hole, line], { scale: scaleEnd, duration: 1.7, ease: expoInOut }, 'zoom')
          .add(function () { heroTl.play(0); }, 'zoom+=.65')
          .to(loader, { autoAlpha: 0, duration: .01 });
      });
    }

    var imgReady = new Promise(function (res) {
      var im = $('.hero__main img');
      if (!im || im.complete) return res();
      im.addEventListener('load', res); im.addEventListener('error', res);
    });
    var fontsReady = (document.fonts && document.fonts.ready) ? document.fonts.ready : Promise.resolve();
    Promise.race([Promise.all([fontsReady, imgReady]), new Promise(function (r) { setTimeout(r, 2600); })])
      .then(function () { return runLoader(); })
      .then(function () {
        // Ken Burns lent sur la grande photo du hero
        if (isDesktop) gsap.to('.hero__main .arche img', { scale: 1.09, duration: 16, ease: 'sine.inOut', yoyo: true, repeat: -1 });
      });

    /* ── En-tête : se cache en descendant, revient en remontant ── */
    var header = $('#header'), headerHidden = false;
    function showHeader() { if (!headerHidden) return; headerHidden = false; gsap.to(header, { yPercent: 0, duration: .6, ease: 'power3.out', overwrite: 'auto' }); }
    function hideHeader() { if (headerHidden) return; headerHidden = true; gsap.to(header, { yPercent: -110, duration: .6, ease: 'power3.out', overwrite: 'auto' }); }
    ScrollTrigger.create({
      start: 0, end: 'max',
      onUpdate: function (self) {
        var y = self.scroll();
        header.classList.toggle('is-solid', y > 40);
        if (menuIsOpen) return;
        if (y < 160 || self.direction === -1) showHeader(); else if (self.direction === 1) hideHeader();
      }
    });

    /* Barre de progression de lecture */
    gsap.to('#progress span', { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: .2 } });

    /* ── Hero : parallaxe multicouche + souris ── */
    $$('[data-layer]').forEach(function (el) {
      var v = parseFloat(el.getAttribute('data-layer')) * K;
      gsap.to(el, { yPercent: v, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
    });
        gsap.to('.sprig--rise', { rotation: 3.5, duration: 3.6, ease: 'sine.inOut', yoyo: true, repeat: -1 });
    gsap.to('.sprig--hang', { rotation: 5, duration: 4.2, ease: 'sine.inOut', yoyo: true, repeat: -1 });
    gsap.to('.sprig--cta-l', { rotation: 3, duration: 3.8, ease: 'sine.inOut', yoyo: true, repeat: -1 });
    gsap.to('.sprig--cta-r', { rotation: -3, duration: 4.4, ease: 'sine.inOut', yoyo: true, repeat: -1 });

    if (finePointer) {
      var heroEl = $('.hero');
      var movers = $$('[data-mouse]').map(function (el) {
        return { k: parseFloat(el.getAttribute('data-mouse')), x: gsap.quickTo(el, 'x', { duration: 1.3, ease: 'power3.out' }), y: gsap.quickTo(el, 'y', { duration: 1.3, ease: 'power3.out' }) };
      });
      heroEl.addEventListener('pointermove', function (e) {
        var nx = e.clientX / window.innerWidth - .5, ny = e.clientY / window.innerHeight - .5;
        movers.forEach(function (m) { m.x(nx * m.k * 2); m.y(ny * m.k * 2); });
      });
      var main = $('.hero__main .arche'), glint = $('.glint');
      var gx = gsap.quickTo(glint, 'x', { duration: .5, ease: 'power3.out' }), gy = gsap.quickTo(glint, 'y', { duration: .5, ease: 'power3.out' });
      main.addEventListener('pointermove', function (e) { var r = main.getBoundingClientRect(); gx(e.clientX - r.left); gy(e.clientY - r.top); });
      $('.hero__main').style.pointerEvents = 'auto';
    }

    /* ── Titres : mot par mot, masque qui monte ── */
    headings.forEach(function (h) {
      gsap.from(h.parts, { yPercent: 118, duration: 1.3, stagger: .06, scrollTrigger: { trigger: h.el, start: 'top 86%', once: true } });
    });
    gsap.from(footChars, { yPercent: 112, duration: 1.5, stagger: .04, scrollTrigger: { trigger: '#footGiant', start: 'top 94%', once: true } });

    /* Apparitions douces */
    var softSel = '.gal__head p, .reviews__note, .carousel, .find__info > *:not(h2), .cta__btns, .cta__ways, .facts__close';
    gsap.set(softSel, { y: 40, opacity: 0 });
    ScrollTrigger.batch(softSel, {
      start: 'top 92%', once: true,
      onEnter: function (els) { gsap.to(els, { y: 0, opacity: 1, duration: 1.2, stagger: .1, overwrite: true }); }
    });

    /* ── Marquee : réagit à la vitesse et au sens du défilement ── */
    (function () {
      var sec = $('.marquee'), track = $('#marqueeTrack'), group = $('.marquee__group', track);
      var clone = group.cloneNode(true); clone.setAttribute('aria-hidden', 'true'); track.appendChild(clone);
      var w = group.offsetWidth, x = 0, dir = -1, boost = 0, active = true;
      ScrollTrigger.addEventListener('refresh', function () { w = group.offsetWidth; });
      ScrollTrigger.create({ trigger: sec, start: 'top bottom', end: 'bottom top', onToggle: function (s) { active = s.isActive; } });
      gsap.ticker.add(function (time, delta) {
        if (!active) return;
        var dt = Math.min(delta, 64) / 1000;
        var target = lenis.direction ? -lenis.direction : dir;
        boost += (Math.min(Math.abs(lenis.velocity) / 14, 5) - boost) * Math.min(1, dt * 5);
        dir += (target - dir) * Math.min(1, dt * 4);
        x += dir * (80 + boost * 150) * dt;
        if (x <= -w) x += w; else if (x > 0) x -= w;
        track.style.transform = 'translate3d(' + x.toFixed(2) + 'px,0,0) skewX(' + (-dir * boost * 1.7).toFixed(2) + 'deg)';
      });
    })();

    /* ── Manifeste : phrase révélée au scroll + ciseaux qui coupent ── */
    gsap.fromTo(manifestWords, { opacity: .13 }, {
      opacity: 1, ease: 'none', stagger: .12,
      scrollTrigger: { trigger: '.manifest__text', start: 'top 80%', end: 'bottom 55%', scrub: true }
    });
    (function () {
      var cut = $('.manifest__cut'), line = $('.manifest__line'), sc = $('.manifest__scissors');
      var a = $('.blade--a'), b = $('.blade--b');
      gsap.set(line, { scaleX: 0 });
      ScrollTrigger.create({
        trigger: cut, start: 'top 92%', end: 'top 36%', scrub: .6,
        onUpdate: function (self) {
          var p = self.progress, open = -10 + Math.sin(p * 64) * 18;
          gsap.set(line, { scaleX: p });
          gsap.set(sc, { x: p * (cut.offsetWidth - sc.offsetWidth) });
          gsap.set(a, { rotation: -open, svgOrigin: '32 32' });
          gsap.set(b, { rotation: open, svgOrigin: '32 32' });
        }
      });
    })();

    /* ── Révélations d'images par masque ── */
    $$('[data-clip]').forEach(function (el) {
      var type = el.getAttribute('data-clip');
      var target = el.matches('.arche') ? el : $('.arche', el);
      var from = type === 'circle' ? 'circle(0% at 50% 62%)' : type === 'curtain' ? 'inset(0% 50% 0% 50%)' : 'inset(100% 0% 0% 0%)';
      var to = type === 'circle' ? 'circle(100% at 50% 62%)' : 'inset(0% 0% 0% 0%)';
      gsap.fromTo(target, { clipPath: from }, { clipPath: to, duration: 1.7, ease: 'expo.inOut', scrollTrigger: { trigger: el, start: 'top 86%', once: true }, onComplete: function () { gsap.set(target, { clearProps: 'clipPath' }); } });
    });
    $$('[data-pimg]').forEach(function (img) {
      gsap.fromTo(img, { yPercent: -7, scale: 1.2 }, { yPercent: 7, ease: 'none', scrollTrigger: { trigger: img.closest('.arche'), start: 'top bottom', end: 'bottom top', scrub: true } });
    });
    $$('.gal__item').forEach(function (it) {
      var s = parseFloat(it.getAttribute('data-speed')) * K;
      gsap.fromTo(it, { y: s }, { y: -s, ease: 'none', scrollTrigger: { trigger: it, start: 'top bottom', end: 'bottom top', scrub: true } });
    });

    /* ── Chiffres animés ── */
    $$('.count').forEach(function (el) {
      var to = parseInt(el.getAttribute('data-to'), 10);
      var fact = el.closest('.fact'), rule = $('.fact__rule', fact), txt = $('.fact__t', fact);
      el.style.minWidth = el.offsetWidth + 'px';
      el.textContent = '0';
      gsap.set(rule, { scaleX: 0 }); gsap.set(txt, { opacity: 0, y: 30 });
      ScrollTrigger.create({
        trigger: fact, start: 'top 86%', once: true,
        onEnter: function () {
          var o = { v: 0 };
          gsap.to(o, { v: to, duration: 2.6, ease: 'power3.out', onUpdate: function () { el.textContent = Math.round(o.v); } });
          gsap.to(rule, { scaleX: 1, duration: 1.9, ease: 'expo.inOut' });
          gsap.to(txt, { opacity: 1, y: 0, duration: 1.3, delay: .25 });
        }
      });
    });
    gsap.fromTo('.facts__arch', { yPercent: 8 }, { yPercent: -10, ease: 'none', scrollTrigger: { trigger: '.facts', start: 'top bottom', end: 'bottom top', scrub: true } });

    /* ── CTA : projecteur doré, chiffres, arches ── */
    gsap.from('.cta__arch path', { scale: .86, opacity: 0, svgOrigin: '300 760', duration: 2.2, stagger: .16, scrollTrigger: { trigger: '.cta', start: 'top 70%', once: true } });
    gsap.from('.dg', { y: 70, opacity: 0, duration: 1.3, stagger: .05, scrollTrigger: { trigger: '#ctaPhone', start: 'top 90%', once: true } });
    if (finePointer) {
      var cta = $('.cta'), spot = $('.cta__spot');
      var sx = gsap.quickTo(spot, 'x', { duration: .9, ease: 'power3.out' }), sy = gsap.quickTo(spot, 'y', { duration: .9, ease: 'power3.out' });
      gsap.set(spot, { x: cta.offsetWidth / 2, y: cta.offsetHeight / 2 });
      cta.addEventListener('pointerenter', function (e) { var r = cta.getBoundingClientRect(); gsap.set(spot, { x: e.clientX - r.left, y: e.clientY - r.top }); });
      cta.addEventListener('pointermove', function (e) { var r = cta.getBoundingClientRect(); sx(e.clientX - r.left); sy(e.clientY - r.top); });
    }

    /* ── Bouton d'appel flottant (mobile) ── */
    var fab = $('#fab');
    if (fab) {
      ScrollTrigger.create({ trigger: '#manifeste', start: 'top 75%', onEnter: function () { fab.classList.add('is-visible'); }, onLeaveBack: function () { fab.classList.remove('is-visible'); } });
      ScrollTrigger.create({ trigger: '#rdv', start: 'top 80%', end: 'bottom 40%', onToggle: function (s) { fab.classList.toggle('is-hidden', s.isActive); } });
      ScrollTrigger.create({ trigger: '.foot', start: 'top 85%', onToggle: function (s) { fab.classList.toggle('is-hidden', s.isActive); } });
    }

    /* ── Micro-interactions de souris ── */
    if (finePointer) {
      // boutons magnétiques
      var mags = $$('[data-magnetic]').map(function (el) {
        var label = $('.btn__label', el);
        return {
          el: el,
          x: gsap.quickTo(el, 'x', { duration: .9, ease: 'elastic.out(1, .55)' }), y: gsap.quickTo(el, 'y', { duration: .9, ease: 'elastic.out(1, .55)' }),
          lx: label ? gsap.quickTo(label, 'x', { duration: .7, ease: 'power3.out' }) : function () {}, ly: label ? gsap.quickTo(label, 'y', { duration: .7, ease: 'power3.out' }) : function () {}
        };
      });
      var ev = null, raf = 0;
      window.addEventListener('pointermove', function (e) {
        ev = e;
        if (raf) return;
        raf = requestAnimationFrame(function () {
          raf = 0;
          mags.forEach(function (m) {
            var r = m.el.getBoundingClientRect();
            if (r.bottom < -120 || r.top > window.innerHeight + 120) return;
            var cx = r.left + r.width / 2 - gsap.getProperty(m.el, 'x'), cy = r.top + r.height / 2 - gsap.getProperty(m.el, 'y');
            var dx = ev.clientX - cx, dy = ev.clientY - cy;
            if (Math.hypot(dx, dy) < Math.max(r.width, r.height) / 2 + 70) { m.x(dx * .32); m.y(dy * .42); m.lx(dx * .1); m.ly(dy * .14); }
            else { m.x(0); m.y(0); m.lx(0); m.ly(0); }
          });
        });
      }, { passive: true });

      // inclinaison 3D + reflet qui suit la souris
      $$('[data-tilt]').forEach(function (el) {
        var glare = $('.tilt__glare', el);
        gsap.set(el, { transformPerspective: 900 });
        var rx = gsap.quickTo(el, 'rotationX', { duration: .7, ease: 'power3.out' }), ry = gsap.quickTo(el, 'rotationY', { duration: .7, ease: 'power3.out' });
        var gx = glare ? gsap.quickTo(glare, 'x', { duration: .5, ease: 'power3.out' }) : null, gy = glare ? gsap.quickTo(glare, 'y', { duration: .5, ease: 'power3.out' }) : null;
        el.addEventListener('pointermove', function (e) {
          var r = el.getBoundingClientRect(), px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
          ry((px - .5) * 14); rx(-(py - .5) * 14);
          if (glare) { gx((px - .5) * r.width * .9); gy((py - .5) * r.height * .9); }
        });
        el.addEventListener('pointerleave', function () { rx(0); ry(0); if (glare) { gx(0); gy(0); } });
      });
    }

    /* ── LE SALON : section pinnée, la visite étape par étape ── */
    (function () {
      var story = $('.story'), stage = $('.story__stage', story);
      var steps = $$('.step', story), n = steps.length;
      story.classList.add('is-pinned');
      var media = steps.map(function (s) { return $('.arche', s); });
      var imgs = steps.map(function (s) { return $('img', s); });
      var texts = steps.map(function (s) { return $('.step__text', s); });
      var lis = $$('.story__nav li', story);
      var STEP = 1.6;
      gsap.set(media.slice(1), { clipPath: 'inset(100% 0% 0% 0%)' });
      gsap.set(texts.slice(1), { autoAlpha: 0, y: 50 });
      gsap.set(imgs, { scale: 1.22 });

      var total = (n - 1) * STEP + .8;
      var active = 0;
      var tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: story, start: 'top top', pin: stage, scrub: .8, anticipatePin: 1, invalidateOnRefresh: true,
          end: function () { return '+=' + Math.round(window.innerHeight * (n * .95 + .35)); }
        },
        onUpdate: function () {
          var idx = Math.max(0, Math.min(n - 1, Math.round(tl.time() / STEP)));
          if (idx !== active) { active = idx; lis.forEach(function (li, k) { li.classList.toggle('is-active', k === idx); }); }
        }
      });
      for (var i = 0; i < n - 1; i++) {
        var t = i * STEP + .7;
        tl.to(texts[i], { autoAlpha: 0, y: -50, duration: .45, ease: 'power2.in' }, t)
          .to(media[i + 1], { clipPath: 'inset(0% 0% 0% 0%)', duration: .9, ease: 'power2.inOut' }, t)
          .fromTo(texts[i + 1], { autoAlpha: 0, y: 50 }, { autoAlpha: 1, y: 0, duration: .55, ease: 'power2.out' }, t + .4);
      }
      imgs.forEach(function (im, k) { tl.to(im, { scale: 1.04, duration: 2 }, Math.max(0, (k - 1) * STEP + .7)); });
      tl.fromTo('.story__line i', { scaleX: 0 }, { scaleX: 1, duration: total }, 0);
      tl.fromTo('.story__leaf', { rotation: -12, y: 40 }, { rotation: 16, y: -40, duration: total }, 0);
      tl.to({}, { duration: .01 }, total - .01);
    })();

    /* ── PRESTATIONS : défilement horizontal piloté par le scroll vertical (desktop) ── */
    var mm = gsap.matchMedia();
    mm.add('(min-width: 900px)', function () {
      var track = $('#svcTrack'), pin = $('.svc__pin');
      var dist = function () { return Math.max(0, track.scrollWidth - window.innerWidth); };
      var tween = gsap.to(track, {
        x: function () { return -dist(); }, ease: 'none',
        scrollTrigger: { trigger: '.svc', pin: pin, start: 'top top', end: function () { return '+=' + dist(); }, scrub: 1, invalidateOnRefresh: true, anticipatePin: 1 }
      });
      gsap.to('.svc__bar span', { scaleX: 1, ease: 'none', scrollTrigger: { trigger: '.svc', start: 'top top', end: function () { return '+=' + dist(); }, scrub: true, invalidateOnRefresh: true } });
      $$('.svc__item').forEach(function (item, i) {
        gsap.from(item, { y: 90, rotation: i % 2 ? 3 : -3, opacity: 0, duration: 1.2, scrollTrigger: { trigger: item, containerAnimation: tween, start: 'left 94%', toggleActions: 'play none none reverse' } });
        gsap.fromTo($('.panel__leaf', item), { rotation: -22, x: -16 }, { rotation: 22, x: 16, ease: 'none', scrollTrigger: { trigger: item, containerAnimation: tween, start: 'left right', end: 'right left', scrub: true } });
      });
      gsap.from('.svc__intro > *', { y: 50, opacity: 0, duration: 1.2, stagger: .12, scrollTrigger: { trigger: '.svc', start: 'top 70%', once: true } });

      // Navigation clavier : quand un lien hors champ prend le focus, on fait avancer la page jusqu'à lui
      function onFocusIn(e) {
        pin.scrollLeft = 0;
        var st = tween.scrollTrigger, d = dist();
        if (!st || !d) return;
        var off = e.target.getBoundingClientRect().left - track.getBoundingClientRect().left;
        var want = Math.min(d, Math.max(0, off - parseFloat(getComputedStyle(track).paddingLeft)));
        lenis.scrollTo(st.start + (want / d) * (st.end - st.start), { duration: 1.1 });
      }
      track.addEventListener('focusin', onFocusIn);
      return function () { track.removeEventListener('focusin', onFocusIn); };
    });

    /* Les polices et images changent les hauteurs : on recalcule */
    window.addEventListener('load', function () { ScrollTrigger.refresh(); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
  }

  /* ─────────────── Démarrage ─────────────── */
  initHours();
  initMenu();
  initCarousel();
  initPhone();

  if (!hasGsap || reduce || typeof Lenis === 'undefined') {
    finishStatic();
    initAnchors();
  } else {
    try {
      initMotion();
      initAnchors();
    } catch (err) {
      if (window.console) console.error(err);
      finishStatic();
      initAnchors();
    }
  }
})();
