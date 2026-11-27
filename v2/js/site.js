/* Motion rebuilt from the Framer project with the same values: three-column splash, hero and tagline entrances,
   scroll transforms (scroll-linked, mapped the way Framer's runtime does), cursor variants, project image cursor, process track,
   photo zoom, footer curtain, case-study nav and cover parallax, Lenis smooth scroll (Framer Smooth Scroll, intensity 11).
   Added on top of Framer: page transitions with the splash columns, and a slow drift on the hero name.
   Also the local clock and present mode (P or the Present button, arrows move, Esc exits, ?present opens it). */
(function () {
  var d = document, root = d.documentElement, W = window;
  var mq = function (q) { return !!(W.matchMedia && W.matchMedia(q).matches); };
  var reduce = mq('(prefers-reduced-motion: reduce)');
  var motion = root.classList.contains('motion') && !reduce;
  var fine = mq('(hover: hover) and (pointer: fine)');
  var presentURL = /[?&]present\b/.test(location.search);
  var now = function () { return (W.performance && performance.now()) || Date.now(); };
  var t0 = now();
  var $ = function (s, c) { return [].slice.call((c || d).querySelectorAll(s)); };
  var raf2 = function (f) { requestAnimationFrame(function () { requestAnimationFrame(f); }); };
  var bp = function () { var w = W.innerWidth; return w >= 1600 ? 'XL' : w >= 1200 ? 'L' : w >= 810 ? 'M' : 'S'; };

  // ---------------------------------------------------------------- springs -> CSS linear()
  function springCurve(k, c, m) {
    var x = 0, v = 0, dt = 1 / 1000, trace = [], end = 1;
    for (var i = 0; i < 4000; i++) {
      var a = (-k * (x - 1) - c * v) / m; v += a * dt; x += v * dt; trace.push(x);
      if (Math.abs(x - 1) > 0.002 || Math.abs(v) > 0.02) end = i + 1;
    }
    var n = 56, pts = ['0'];
    for (var j = 1; j < n; j++) pts.push(+trace[Math.max(0, Math.round(j / n * end) - 1)].toFixed(4));
    pts.push('1');
    return { e: 'linear(' + pts.join(', ') + ')', t: (end / 1000).toFixed(3) + 's' };
  }
  var SPRINGS = { reveal: [300, 60, 0.1], hero: [350, 50, 4], photo: [400, 60, 1], variant: [500, 60, 1], appear: [350, 60, 6], email: [400, 50, 1] };
  if (W.CSS && CSS.supports && CSS.supports('transition-timing-function', 'linear(0, 1)')) {
    Object.keys(SPRINGS).forEach(function (n) {
      var c = springCurve.apply(null, SPRINGS[n]);
      root.style.setProperty('--sp-' + n + '-e', c.e);
      root.style.setProperty('--sp-' + n + '-t', c.t);
    });
  }
  function Spring(k, c, m) { this.k = k; this.c = c; this.m = m; this.x = 0; this.v = 0; this.to = 0; }
  Spring.prototype.snap = function (x) { this.x = this.to = x; this.v = 0; };
  Spring.prototype.step = function (dt) {
    var n = Math.max(1, Math.ceil(dt / 0.002)), h = dt / n;
    for (var i = 0; i < n; i++) { var a = (-this.k * (this.x - this.to) - this.c * this.v) / this.m; this.v += a * h; this.x += this.v * h; }
    if (Math.abs(this.x - this.to) < 0.05 && Math.abs(this.v) < 0.05) { this.x = this.to; this.v = 0; return false; }
    return true;
  };
  var tasks = [], rafId = 0, last = 0;
  function tick(t) {
    var dt = Math.min(0.05, Math.max(0.001, (t - last) / 1000)); last = t;
    tasks = tasks.filter(function (f) { return f(dt); });
    rafId = tasks.length ? requestAnimationFrame(tick) : 0;
  }
  function run(f) { if (tasks.indexOf(f) < 0) tasks.push(f); if (!rafId) { last = now(); rafId = requestAnimationFrame(tick); } }

  // ---------------------------------------------------------------- smooth scroll
  var lenis = null;
  function lenisOn() { if (!reduce && !lenis && W.Lenis) lenis = new W.Lenis({ duration: 1.1, autoRaf: true, anchors: true }); }
  function lenisOff() { if (lenis) { lenis.destroy(); lenis = null; } }
  if (!presentURL) lenisOn();

  // ---------------------------------------------------------------- splash: after 1s the columns fold up (CSS: 1s each, 0.2s apart)
  // arriving from another page of the site (page transition), the curtain opens at once and without the name
  var splash = d.getElementById('splash');
  var fromNav = root.classList.contains('pt-in');
  try { sessionStorage.removeItem('pt'); } catch (e) {}
  var withSplash = !!splash && motion && !presentURL;
  var lead = withSplash ? (fromNav ? -1.45 : 0) : -1.6;
  if (splash && !withSplash) splash.parentNode.removeChild(splash);
  if (withSplash) {
    setTimeout(function () { splash.classList.add('go'); }, Math.max(0, (fromNav ? 120 : 1000) - (now() - t0)));
    setTimeout(function () { if (splash.parentNode) splash.parentNode.removeChild(splash); }, fromNav ? 1300 : 2600);
  }

  // ---------------------------------------------------------------- page transitions: the same white columns close over the page, then it changes
  if (motion) {
    var leaving = false;
    d.addEventListener('click', function (e) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      var a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
      if (!a || (a.target && a.target !== '_self') || a.hasAttribute('download')) return;
      if (root.classList.contains('presenting') || leaving) return;
      var url; try { url = new URL(a.getAttribute('href'), location.href); } catch (err) { return; }
      if (url.origin !== location.origin || !/(\.html|\/)$/.test(url.pathname)) return;
      if (url.pathname === location.pathname) return;               // same page, anchors scroll as usual
      e.preventDefault(); leaving = true;
      var c = d.createElement('div'); c.className = 'pt'; c.setAttribute('aria-hidden', 'true');
      c.innerHTML = '<i></i><i></i><i></i>'; d.body.appendChild(c);
      void c.offsetWidth; c.classList.add('on');
      try { sessionStorage.setItem('pt', '1'); } catch (err) {}
      setTimeout(function () { location.href = url.href; }, 780);
    });
    W.addEventListener('pageshow', function (e) {
      if (!e.persisted) return;                                       // back/forward cache: lift the curtain again
      leaving = false;
      $('.pt').forEach(function (c) { c.parentNode.removeChild(c); });
    });
  }

  // ---------------------------------------------------------------- hero depth: the name drifts down at 30% of the scroll while Work slides over it
  var heroW = d.querySelector('.hero-w');
  if (heroW && motion) {
    var heroDrift = function () {
      var y = W.scrollY;
      if (y > W.innerHeight * 1.5) return;
      heroW.style.transform = y > 0 ? 'translate3d(0,' + (y * 0.3).toFixed(1) + 'px,0)' : '';
    };
    W.addEventListener('scroll', heroDrift, { passive: true }); heroDrift();
  }

  // hero name sizes come from CSS (Framer's runtime auto-fit, measured as a share of the title width)

  // ---------------------------------------------------------------- navbar: visitor's time zone and local time, like the Framer Time component
  var tz = d.querySelector('[data-tz]'), clk = d.querySelector('[data-clock]');
  if (W.Intl) {
    try { if (tz) tz.textContent = Intl.DateTimeFormat().resolvedOptions().timeZone || tz.textContent; } catch (e) {}
    if (clk) {
      var fmt = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
      var tock = function () { clk.textContent = fmt.format(new Date()); };
      tock(); setInterval(tock, 10000);
    }
  }

  // ---------------------------------------------------------------- appear effects
  var pending = [];
  function show(el) { if (!el.classList.contains('in')) el.classList.add('in'); }
  function hide(el) { el.classList.remove('in'); }
  function showIn(scope) { if (scope.hasAttribute('data-m')) show(scope); $('[data-m], .ph', scope).forEach(show); }

  if (motion) {
    root.classList.add('m-prep');
    var timed = function (el, kind, sec) {
      el.setAttribute('data-m', kind);
      el.style.transitionDelay = Math.max(0, sec + lead - (now() - t0) / 1000).toFixed(3) + 's';
      pending.push(el);
    };
    $('.hero-t .n1').forEach(function (el) { timed(el, 'h70', 1.8); });
    $('.hero-t .n2').forEach(function (el) { timed(el, 'h70', 1.9); });
    $('.phead h1').forEach(function (el) { timed(el, 'h70', 2.0); });
    $('[data-cover]').forEach(function (el) { timed(el, 'h200', 1.8); });

    var small = bp() === 'S';
    // Framer Scroll Transforms ("Layer in View"): scroll-linked, not triggered. Framer's runtime maps progress with
    // offset ["start end", "end end"]: 0 when the layer's top meets the bottom of the screen, 1 when its bottom does.
    // Values are clamped, then smoothed by the effect's spring when it has one (the footer has none, so it tracks the scroll exactly).
    var SCRUB = [
      ['.about-lab h2, .about-r > p, .about-r > .btn', 'r3'],
      ['.plist .prow-in', 'r6'],
      ['.mlist .mrow, .mlist .mimg', 'r6'],
      ['.exp .top p, .exp .bottom > .btn, .svc-t, .svc-p, .clock .rcol p', 'r3'],
      ['.xpc p, .xpd', small ? 'r20' : 'r3'],
      ['[data-row]', 'r3'],
      ['.slide .s-p, .slide .note, .card, .nums > div, .steps li, .quotes blockquote, .ins li, .callout, .next .row2', 'r3'],
      ['.ph', 'ph'],
      ['.foot', 'foot']
    ];
    if (small) SCRUB.push(['.lsec .lab h2', 'r3'], ['.pi-n, .pi-h, .pi-p', 'r20']);
    // from-states (to-state is always identity); spring = the effect's transition
    var FROM = {
      r3: { o: 0, y: 40, sk: 3, sp: [300, 60, 0.1] }, r6: { o: 0, y: 40, sk: 6, sp: [300, 60, 0.1] },
      r20: { o: 0, y: 20, sk: 3, sp: [300, 60, 0.1] }, ph: { s: 1.25, sp: [400, 60, 1] }, foot: { o: 0, y: -280 }
    };
    // Framer Appear effects ("Layer in View", play once): the case-study titles
    var ONCE = [['.slide .s-label', 't20'], ['.slide .s-h, .next .big-link', 't40']];

    var scrubs = [];
    SCRUB.forEach(function (r) {
      $(r[0]).forEach(function (el) {
        if (el.hasAttribute('data-s') || el.hasAttribute('data-m')) return;
        el.setAttribute('data-s', r[1]);
        var f = FROM[r[1]];
        scrubs.push({ el: el, tg: r[1] === 'ph' ? el.querySelector('img') : el, f: f, sp: f.sp ? new Spring(f.sp[0], f.sp[1], f.sp[2]) : null, top: 0, h: 1, out: '' });
      });
    });
    var docTop = function (el) { var t = 0; while (el) { t += el.offsetTop; el = el.offsetParent; } return t; };
    var measureScrubs = function () { scrubs.forEach(function (o) { o.top = docTop(o.el); o.h = Math.max(1, o.el.offsetHeight); }); };
    var paint = function (o, p) {
      var f = o.f, q = 1 - p, css;
      if (f.s) css = 'scale(' + (1 + (f.s - 1) * q).toFixed(4) + ')';
      else css = 'translate3d(0,' + (f.y * q).toFixed(2) + 'px,0)' + (f.sk ? ' skewY(' + (f.sk * q).toFixed(3) + 'deg)' : '');
      var op = f.o === 0 ? p.toFixed(3) : '';
      var key = css + op;
      if (key === o.out) return;
      o.out = key;
      if (o.tg) { o.tg.style.transform = (p >= 0.9995 && !f.s) ? 'none' : css; if (op) o.tg.style.opacity = op; }
    };
    var progress = function (o, y, vh) { return Math.min(1, Math.max(0, (y + vh - o.top + 1.5) / o.h)); };   // 1.5px slack: the page end rounds
    var scrubStep = function (dt) {
      var y = W.scrollY, vh = W.innerHeight, moving = false;
      for (var i = 0; i < scrubs.length; i++) {
        var o = scrubs[i], p = progress(o, y, vh);
        if (o.sp) { o.sp.to = p; if (o.sp.x !== p || o.sp.v) { if (o.sp.step(dt)) moving = true; } paint(o, o.sp.x); }
        else paint(o, p);
      }
      return moving;
    };
    // finer settle threshold than the cursor springs: these run on 0..1
    scrubs.forEach(function (o) { if (o.sp) o.sp.step = function (dt) {
      var n = Math.max(1, Math.ceil(dt / 0.001)), h = dt / n;
      for (var i = 0; i < n; i++) { var a = (-this.k * (this.x - this.to) - this.c * this.v) / this.m; this.v += a * h; this.x += this.v * h; }
      if (Math.abs(this.x - this.to) < 0.0005 && Math.abs(this.v) < 0.005) { this.x = this.to; this.v = 0; return false; }
      return true;
    }; });
    var settle = function () { var y = W.scrollY, vh = W.innerHeight; scrubs.forEach(function (o) { var p = progress(o, y, vh); if (o.sp) o.sp.snap(p); paint(o, p); }); };
    measureScrubs(); settle();
    var kick = function () { run(scrubStep); };
    W.addEventListener('scroll', kick, { passive: true });
    var remeasure = function () { measureScrubs(); kick(); };
    W.addEventListener('resize', remeasure);
    W.addEventListener('load', remeasure);
    if (d.fonts && d.fonts.ready) d.fonts.ready.then(remeasure);
    if (W.ResizeObserver) new ResizeObserver(function () { remeasure(); }).observe(d.body);

    var onces = [];
    ONCE.forEach(function (r) { $(r[0]).forEach(function (el) { if (!el.hasAttribute('data-m') && !el.hasAttribute('data-s')) { el.setAttribute('data-m', r[1]); onces.push(el); } }); });

    void root.offsetWidth;
    root.classList.remove('m-prep');
    raf2(function () { pending.forEach(show); });

    if ('IntersectionObserver' in W) {
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (e.isIntersecting || e.boundingClientRect.top < 0) { show(e.target); io.unobserve(e.target); } });
      }, { threshold: 0 });
      onces.forEach(function (el) { io.observe(el); });
    } else {
      onces.forEach(show);
    }

    // hero tagline: Framer text effect, one line at a time from 2s, 0.05s apart
    $('.hero-tag .tag').forEach(function (tag) {
      var original = tag.innerHTML, done = false;
      var split = function () {
        if (done) return; done = true;
        var words = tag.textContent.trim().split(/\s+/), spans = [];
        tag.textContent = '';
        words.forEach(function (w, i) { var s = d.createElement('span'); s.textContent = w; tag.appendChild(s); if (i < words.length - 1) tag.appendChild(d.createTextNode(' ')); spans.push(s); });
        var lines = [], top = null;
        spans.forEach(function (s) { if (top === null || Math.abs(s.offsetTop - top) > 2) { lines.push([]); top = s.offsetTop; } lines[lines.length - 1].push(s.textContent); });
        tag.textContent = '';
        var els = lines.map(function (l, i) {
          var s = d.createElement('span'); s.className = 'tl'; s.textContent = l.join(' ');
          s.setAttribute('data-m', 'h20');
          s.style.transitionDelay = Math.max(0, 2 + i * 0.05 + lead - (now() - t0) / 1000).toFixed(3) + 's';
          tag.appendChild(s); return s;
        });
        tag.classList.add('lined');
        void tag.offsetWidth;
        raf2(function () { els.forEach(show); });
        setTimeout(function () { tag.innerHTML = original; }, Math.max(0, (2 + lines.length * 0.05 + lead) * 1000 - (now() - t0)) + 1600);
      };
      if (d.fonts && d.fonts.ready) d.fonts.ready.then(split); else split();
      setTimeout(split, 1500);
    });
  }

  // ---------------------------------------------------------------- cursors
  if (fine && motion) {
    root.classList.add('cur-on');
    var cur = d.createElement('div'); cur.className = 'cursor'; cur.setAttribute('aria-hidden', 'true');
    cur.innerHTML = '<span class="cd"><b>Email</b></span>';
    d.body.appendChild(cur);
    var cx = new Spring(400, 30, 0.1), cy = new Spring(400, 30, 0.1);        // Cursor (Default), follow spring
    var list = d.querySelector('.plist'), pv = null, pimg = null, px, py;
    if (list) {
      pv = d.createElement('div'); pv.className = 'preview'; pv.setAttribute('aria-hidden', 'true');
      pv.innerHTML = '<div class="pi"><img alt=""></div>'; pimg = pv.querySelector('img'); d.body.appendChild(pv);
      px = new Spring(500, 40, 1); py = new Spring(500, 40, 1);               // Cursor (Project), follow spring
      $('.plist .prow').forEach(function (r) { var i = new Image(); i.src = r.getAttribute('data-img'); });
    }
    var seen = false, mode = '', curLi = null;
    var dy = { '': -2, link: 2, mail: -2, img: -2 };                         // placement bottom + Framer offsets (-10, -18, -96)
    var follow = function (dt) {
      var a = cx.step(dt), b = cy.step(dt);
      cur.style.transform = 'translate3d(' + cx.x + 'px,' + (cy.x + dy[mode]) + 'px,0)';
      var c = false;
      if (pv) { c = px.step(dt) | py.step(dt); pv.style.transform = 'translate3d(' + (px.x - 400) + 'px,' + (py.x - 270) + 'px,0)'; }
      return a || b || c;
    };
    var setMode = function (m, row) {
      if (pv) {
        if (m === 'img') {
          var src = row.getAttribute('data-img');
          if (pimg.getAttribute('src') !== src) pimg.src = src;
          if (!pv.classList.contains('on')) { px.snap(cx.to); py.snap(cy.to); }
          pv.classList.add('on');
          var li = row.parentNode;
          if (curLi !== li) { if (curLi) curLi.classList.remove('on'); li.classList.add('on'); curLi = li; }
          list.classList.add('hov');
        } else {
          pv.classList.remove('on'); list.classList.remove('hov');
          if (curLi) { curLi.classList.remove('on'); curLi = null; }
        }
      }
      if (m === mode) return;
      cur.classList.remove('link', 'mail', 'img'); if (m) cur.classList.add(m); mode = m;
    };
    d.addEventListener('mousemove', function (e) {
      cx.to = e.clientX; cy.to = e.clientY;
      if (pv) { px.to = e.clientX; py.to = e.clientY; }
      if (!seen) { seen = true; cx.snap(e.clientX); cy.snap(e.clientY); cur.classList.add('on'); }
      run(follow);
    }, { passive: true });
    d.addEventListener('mouseover', function (e) {
      var t = e.target && e.target.closest ? e.target : (e.target && e.target.parentElement);
      if (!t || !t.closest) return;
      var row = t.closest('.plist .prow');
      setMode(row ? 'img' : t.closest('.foot-t') ? 'mail' : t.closest('a, button, [role="button"]') ? 'link' : '', row);
    });
    d.addEventListener('mouseout', function (e) { if (!e.relatedTarget) { cur.classList.remove('on'); seen = false; setMode(''); } });
  }

  // ---------------------------------------------------------------- process: scroll target transform, x 0 -> end, spring 400/50/0.1
  var proc = d.querySelector('.process'), track = proc && proc.querySelector('.track'), pin = proc && proc.querySelector('.proc-pin');
  if (proc && track && !reduce) {
    var END = { XL: -2000, L: -2050, M: -1420 };
    var tx = new Spring(400, 50, 0.1), geo = null;
    var trackStep = function (dt) { var on = tx.step(dt); track.style.transform = 'translate3d(' + tx.x.toFixed(2) + 'px,0,0)'; return on; };
    var measure = function () {
      var top = proc.getBoundingClientRect().top + W.scrollY;
      var pinTop = pin.getBoundingClientRect().top + W.scrollY;
      var off = track.getBoundingClientRect().bottom - pin.getBoundingClientRect().top;   // track bottom inside the pinned wrapper
      geo = { s0: top + off - W.innerHeight, s1: top + proc.offsetHeight - W.innerHeight };
      if (pinTop < top) geo.s0 = top + off - W.innerHeight;
    };
    var aim = function () {
      var b = bp(); if (b === 'S') return;
      if (!geo) measure();
      var p = Math.min(1, Math.max(0, (W.scrollY - geo.s0) / Math.max(1, geo.s1 - geo.s0)));
      tx.to = p * END[b]; run(trackStep);
    };
    var size = function () { geo = null; if (bp() === 'S') { track.style.transform = ''; tx.snap(0); return; } measure(); aim(); };
    W.addEventListener('scroll', aim, { passive: true });
    W.addEventListener('resize', size);
    W.addEventListener('load', size);
    size();
  }

  // ---------------------------------------------------------------- case studies: nav hides on scroll down (y -108, fade), cover parallax speed 85
  var nav = d.querySelector('.pnav'), lastY = W.scrollY;
  var cover = d.querySelector('[data-cover] img');
  var onScroll = function () {
    var y = W.scrollY;
    if (nav && !root.classList.contains('presenting')) {
      if (y > lastY + 2 && y > 40) nav.classList.add('away');
      else if (y < lastY - 2 || y <= 40) nav.classList.remove('away');
    }
    lastY = y;
    if (cover && motion && bp() !== 'S' && !root.classList.contains('presenting')) cover.style.transform = 'translate3d(0,' + (y * 0.15).toFixed(1) + 'px,0)';
  };
  if (nav || cover) { W.addEventListener('scroll', onScroll, { passive: true }); onScroll(); }

  // ---------------------------------------------------------------- present mode
  var slides = $('.slide');
  if (!slides.length) return;
  var hud = d.createElement('div');
  hud.className = 'hud'; hud.setAttribute('aria-live', 'polite');
  hud.innerHTML = '<button type="button" class="prev" aria-label="Previous slide">Prev</button>' +
    '<span class="count"></span><button type="button" class="nxt" aria-label="Next slide">Next</button>' +
    '<button type="button" class="exit">Exit</button>';
  d.body.appendChild(hud);
  var countEl = hud.querySelector('.count'), current = 0;
  var pad = function (n) { return n < 10 ? '0' + n : '' + n; };
  var setCount = function () {
    countEl.textContent = pad(current + 1) + ' / ' + pad(slides.length);
    if (root.classList.contains('presenting')) showIn(slides[current]);
  };
  var go = function (i) { current = Math.max(0, Math.min(slides.length - 1, i)); slides[current].scrollIntoView({ block: 'start' }); setCount(); };
  var start = function (full) {
    if (root.classList.contains('presenting')) return;
    var mid = W.innerHeight * 0.4, best = 0;
    slides.forEach(function (s, i) { if (s.getBoundingClientRect().top <= mid) best = i; });
    lenisOff();
    root.classList.add('presenting');
    if (cover) cover.style.transform = '';
    if (full && root.requestFullscreen) root.requestFullscreen().catch(function () {});
    requestAnimationFrame(function () { go(best); });
  };
  var stop = function () {
    if (!root.classList.contains('presenting')) return;
    root.classList.remove('presenting');
    if (d.fullscreenElement && d.exitFullscreen) d.exitFullscreen().catch(function () {});
    requestAnimationFrame(function () { slides[current].scrollIntoView({ block: 'start' }); lenisOn(); onScroll(); });
    if (presentURL) history.replaceState(null, '', location.pathname + location.hash);
  };
  d.addEventListener('fullscreenchange', function () {
    if (!d.fullscreenElement && root.classList.contains('presenting') && !presentURL) stop();
  });
  if ('IntersectionObserver' in W) {
    var sio = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting && e.intersectionRatio > 0.55) { current = slides.indexOf(e.target); setCount(); } });
    }, { threshold: [0.55] });
    slides.forEach(function (s) { sio.observe(s); });
  }
  $('[data-present]').forEach(function (b) { b.addEventListener('click', function (e) { e.preventDefault(); start(true); }); });
  hud.querySelector('.prev').addEventListener('click', function () { go(current - 1); });
  hud.querySelector('.nxt').addEventListener('click', function () { go(current + 1); });
  hud.querySelector('.exit').addEventListener('click', stop);
  d.addEventListener('keydown', function (e) {
    var t = e.target;
    if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    var on = root.classList.contains('presenting');
    if (!on) { if (e.key === 'p' || e.key === 'P') { e.preventDefault(); start(true); } return; }
    switch (e.key) {
      case 'ArrowDown': case 'ArrowRight': case 'PageDown': case ' ':
        e.preventDefault(); go(current + 1); break;
      case 'ArrowUp': case 'ArrowLeft': case 'PageUp':
        e.preventDefault(); go(current - 1); break;
      case 'Home': e.preventDefault(); go(0); break;
      case 'End': e.preventDefault(); go(slides.length - 1); break;
      case 'Escape': case 'p': case 'P': stop(); break;
      case 'f': case 'F': if (!d.fullscreenElement && root.requestFullscreen) root.requestFullscreen().catch(function () {}); break;
    }
  });
  setCount();
  if (presentURL) start(false);
})();
