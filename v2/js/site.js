/* Motion rebuilt from the Framer project, using the same spring stiffness, damping and mass:
   splash, hero entrance, scroll reveals, custom cursor, project image cursor, process track,
   photo zoom, footer curtain, case-study nav and cover parallax, plus Lenis smooth scroll.
   Also the Vancouver clock and present mode (P or the Present button, arrows move, Esc exits, ?present opens it). */
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

  // ---------------------------------------------------------------- springs
  // Solve m*x'' + c*x' + k*(x-1) = 0 from rest and hand CSS the exact curve as linear().
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
  var SPRINGS = { reveal: [300, 60, 0.1], hero: [350, 50, 4], splash: [300, 60, 1], photo: [400, 60, 1], variant: [500, 60, 1], appear: [350, 60, 6] };
  if (W.CSS && CSS.supports && CSS.supports('transition-timing-function', 'linear(0, 1)')) {
    Object.keys(SPRINGS).forEach(function (n) {
      var c = springCurve.apply(null, SPRINGS[n]);
      root.style.setProperty('--sp-' + n + '-e', c.e);
      root.style.setProperty('--sp-' + n + '-t', c.t);
    });
  }

  // Live springs for things that chase a moving target (cursor, process track).
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
  function run(f) {
    if (tasks.indexOf(f) < 0) tasks.push(f);
    if (!rafId) { last = now(); rafId = requestAnimationFrame(tick); }
  }

  // ---------------------------------------------------------------- smooth scroll (Framer Smooth Scroll, intensity 11)
  var lenis = null;
  function lenisOn() { if (!reduce && !lenis && W.Lenis) lenis = new W.Lenis({ duration: 1.1, autoRaf: true, anchors: true }); }
  function lenisOff() { if (lenis) { lenis.destroy(); lenis = null; } }
  if (!presentURL) lenisOn();

  // ---------------------------------------------------------------- splash
  var splash = d.getElementById('splash');
  var withSplash = !!splash && motion && !presentURL;
  var lead = withSplash ? 0 : -1.6;              // the timed entrances wait for the splash, so pull them in without it
  if (splash && !withSplash) splash.parentNode.removeChild(splash);
  if (withSplash) {
    setTimeout(function () { splash.classList.add('lift'); }, Math.max(0, 1000 - (now() - t0)));
    setTimeout(function () { if (splash.parentNode) splash.parentNode.removeChild(splash); }, 2700);
  }

  // ---------------------------------------------------------------- clock
  var clk = d.querySelector('[data-clock]');
  if (clk && W.Intl) {
    var fmt = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Vancouver', hour: 'numeric', minute: '2-digit' });
    var tock = function () { clk.textContent = fmt.format(new Date()); };
    tock(); setInterval(tock, 15000);
  }

  // ---------------------------------------------------------------- buttons: second label for the roll-up hover
  $('.pill').forEach(function (b) {
    if (b.querySelector('.pl')) return;
    var t = b.textContent.trim(), pl = d.createElement('span'), a = d.createElement('span'), c = d.createElement('span');
    pl.className = 'pl'; a.textContent = t; c.textContent = t; c.setAttribute('aria-hidden', 'true');
    pl.appendChild(a); pl.appendChild(c); b.textContent = ''; b.appendChild(pl);
  });

  // ---------------------------------------------------------------- appear effects
  var pending = [];
  function show(el) { if (!el.classList.contains('in')) el.classList.add('in'); }
  function hide(el) { el.classList.remove('in'); }
  function showIn(scope) { if (scope.hasAttribute('data-m')) show(scope); $('[data-m], .ph', scope).forEach(show); }

  if (motion) {
    root.classList.add('m-prep');                // hidden states land instantly, not as a fade-out
    // timed entrances on load (seconds from page load, as in Framer)
    var timed = function (el, kind, sec) {
      el.setAttribute('data-m', kind);
      el.style.transitionDelay = Math.max(0, sec + lead - (now() - t0) / 1000).toFixed(3) + 's';
      pending.push(el);
    };
    $('.name .n1 > span').forEach(function (el) { timed(el, 'h70', 1.8); });
    $('.name .n2 > span').forEach(function (el) { timed(el, 'h70', 1.9); });
    $('.cs-title h1').forEach(function (el) { timed(el, 'h70', 2.0); });
    $('.cs-title .lede').forEach(function (el) { timed(el, 'r3', 2.05); });   // sits low on the title slide, so it comes in on load
    $('.cs-title .meta > div').forEach(function (el, i) { timed(el, 'r3', 2.1 + i * 0.05); });

    // Framer scroll transforms ("Layer in View"): "mid" plays when the element crosses the middle of the screen,
    // "start" as soon as it enters, and both play back in reverse when it drops below that line again
    var MID = [
      ['#about .label, #about .big p, #about .pill', 'r3'],
      ['.paper .label, .paper .big, .xp > div, .paper .pill, .bring .n, .bring h3, .bring p', 'r3'],
      ['.rows > li', 'r6'],
      ['.slide .s-label', 't20'],
      ['.slide .s-h, .next .big-link', 't40'],
      ['.slide .s-p, .slide .note, .card, .nums > div, .steps li, .quotes blockquote, .ins li, .callout, .next .row2', 'r3']
    ];
    var START = [['.foot', 'foot'], ['.cover', 'h200']];
    var mids = [], starts = $('.ph');
    MID.forEach(function (r) { $(r[0]).forEach(function (el) { if (!el.hasAttribute('data-m')) { el.setAttribute('data-m', r[1]); mids.push(el); } }); });
    START.forEach(function (r) { $(r[0]).forEach(function (el) { el.setAttribute('data-m', r[1]); starts.push(el); }); });

    void root.offsetWidth;                       // commit the hidden states before anything turns on
    root.classList.remove('m-prep');
    raf2(function () { pending.forEach(show); });

    if ('IntersectionObserver' in W) {
      var watch = function (els, margin) {
        var io = new IntersectionObserver(function (es) {
          es.forEach(function (e) {
            var line = e.rootBounds ? e.rootBounds.bottom : W.innerHeight;
            if (e.isIntersecting || e.boundingClientRect.top < line) show(e.target);           // in, or already scrolled past
            else if (!root.classList.contains('presenting')) hide(e.target);                   // back below the line
          });
        }, { rootMargin: margin, threshold: 0 });
        els.forEach(function (el) { io.observe(el); });
      };
      watch(mids, '0px 0px -50% 0px');
      watch(starts, '0px');
      // the last few items can never reach the middle of the screen, so the bottom of the page shows them
      W.addEventListener('scroll', function () {
        if (W.innerHeight + W.scrollY >= root.scrollHeight - 4) mids.forEach(function (el) { if (el.getBoundingClientRect().top < W.innerHeight) show(el); });
      }, { passive: true });
    } else {
      mids.concat(starts).forEach(show);
    }

    // hero tagline: one line at a time, 0.05s apart, from 2s
    $('.hero .tag').forEach(function (tag) {
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
      var fonts = d.fonts && d.fonts.ready;
      if (fonts) fonts.then(split); else split();
      setTimeout(split, 1500);
    });
  }

  // ---------------------------------------------------------------- custom cursor + project image cursor
  if (fine && motion) {
    root.classList.add('cur-on');
    var cur = d.createElement('div'); cur.className = 'cursor'; cur.setAttribute('aria-hidden', 'true');
    cur.innerHTML = '<span class="cd"><b>Email</b></span>';
    d.body.appendChild(cur);
    var cx = new Spring(400, 30, 0.1), cy = new Spring(400, 30, 0.1);        // Cursor (Default) follow
    var rows = d.querySelector('.rows'), pv = null, pimg = null, px, py;
    if (rows) {
      pv = d.createElement('div'); pv.className = 'preview'; pv.setAttribute('aria-hidden', 'true');
      pv.innerHTML = '<div class="pi"><img alt=""></div>'; pimg = pv.querySelector('img'); d.body.appendChild(pv);
      px = new Spring(500, 40, 1); py = new Spring(500, 40, 1);               // project cursor follow
      $('.rows .row').forEach(function (r) { var i = new Image(); i.src = r.getAttribute('data-img'); });
    }
    var seen = false, mode = '';
    var follow = function (dt) {
      var a = cx.step(dt), b = cy.step(dt);
      cur.style.transform = 'translate3d(' + cx.x + 'px,' + cy.x + 'px,0)';
      var c = false;
      if (pv) {
        c = px.step(dt) | py.step(dt);
        var w = pv.offsetWidth, h = pv.offsetHeight;
        pv.style.transform = 'translate3d(' + (px.x - w / 2) + 'px,' + (py.x - h * 270 / 281) + 'px,0)';
      }
      return a || b || c;
    };
    var setMode = function (m, row) {
      if (pv) {
        if (m === 'img') {
          var src = row.getAttribute('data-img');
          if (pimg.getAttribute('src') !== src) pimg.src = src;
          if (!pv.classList.contains('on')) { px.snap(cx.to); py.snap(cy.to); }
          pv.classList.add('on');
        } else pv.classList.remove('on');
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
      var t = e.target.closest ? e.target : e.target.parentElement;
      if (!t || !t.closest) return;
      var row = t.closest('.rows .row');
      setMode(row ? 'img' : t.closest('.talk a') ? 'mail' : t.closest('a, button, [role="button"]') ? 'link' : '', row);
    });
    d.addEventListener('mouseout', function (e) { if (!e.relatedTarget) { cur.classList.remove('on'); seen = false; setMode(''); } });
  }

  // ---------------------------------------------------------------- process: vertical scroll drives the track (spring 400/50/0.1)
  var proc = d.querySelector('.process'), track = proc && proc.querySelector('.track');
  if (proc && track && !reduce) {
    var tx = new Spring(400, 50, 0.1);
    var extra = function () { return Math.max(0, track.scrollWidth - W.innerWidth); };
    var trackStep = function (dt) { var on = tx.step(dt); track.style.transform = 'translate3d(' + tx.x + 'px,0,0)'; return on; };
    var aim = function () {
      if (W.innerWidth < 810) return;
      var top = proc.getBoundingClientRect().top;
      var p = Math.min(1, Math.max(0, -top / Math.max(1, proc.offsetHeight - W.innerHeight)));
      tx.to = -p * extra(); run(trackStep);
    };
    var size = function () {
      if (W.innerWidth < 810) { proc.style.height = ''; track.style.transform = ''; tx.snap(0); return; }
      proc.style.height = (W.innerHeight + extra() * 1.25) + 'px';   // Framer: 2000px of travel over 2500px of scroll
      aim();
    };
    W.addEventListener('scroll', aim, { passive: true });
    W.addEventListener('resize', size);
    W.addEventListener('load', size);
    size();
  }

  // ---------------------------------------------------------------- case studies: nav hides going down, cover parallax (speed 85)
  var nav = d.querySelector('.cnav'), lastY = W.scrollY;
  var cover = d.querySelector('.cover img');
  var onScroll = function () {
    var y = W.scrollY;
    if (nav && !root.classList.contains('presenting')) {
      if (y > lastY + 2 && y > 120) nav.classList.add('away');
      else if (y < lastY - 2 || y <= 120) nav.classList.remove('away');
    }
    lastY = y;
    if (cover && motion && !root.classList.contains('presenting')) {
      var r = cover.parentNode.getBoundingClientRect();
      var off = (r.top + r.height / 2 - W.innerHeight / 2) * -0.15;
      var lim = r.height * 0.1;
      cover.style.transform = 'translate3d(0,' + Math.max(-lim, Math.min(lim, off)).toFixed(1) + 'px,0)';
    }
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
    if (root.classList.contains('presenting')) showIn(slides[current]);   // each slide builds in as it arrives
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
