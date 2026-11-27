/* Splash, live clock, project preview that follows the cursor, the pinned process track,
   and present mode for case studies (P or the Present button, arrows move, Esc exits, ?present opens it). */
(function () {
  var d = document, root = d.documentElement;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---- splash: once per visit
  var splash = d.getElementById('splash'), seen = false;
  try { seen = sessionStorage.getItem('md-splash') === '1'; sessionStorage.setItem('md-splash', '1'); } catch (e) {}
  if (splash && (seen || reduce)) { splash.parentNode.removeChild(splash); splash = null; }
  window.addEventListener('load', function () {
    setTimeout(function () { root.classList.add('ready'); }, splash ? 650 : 20);
  });
  setTimeout(function () { root.classList.add('ready'); }, 2600); // never hold the page hostage

  // ---- clock
  var clk = d.querySelector('[data-clock]');
  if (clk && window.Intl) {
    var fmt = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Vancouver', hour: 'numeric', minute: '2-digit' });
    var tick = function () { clk.textContent = fmt.format(new Date()); };
    tick(); setInterval(tick, 15000);
  }

  // ---- project preview follows the cursor
  var rows = d.querySelector('.rows');
  if (rows && window.matchMedia && matchMedia('(hover: hover) and (pointer: fine)').matches) {
    var pv = d.createElement('div'); pv.className = 'preview'; pv.setAttribute('aria-hidden', 'true');
    var pimg = d.createElement('img'); pimg.alt = ''; pv.appendChild(pimg); d.body.appendChild(pv);
    var tx = 0, ty = 0, x = 0, y = 0, raf = 0;
    var loop = function () {
      x += (tx - x) * (reduce ? 1 : 0.16); y += (ty - y) * (reduce ? 1 : 0.16);
      pv.style.transform = 'translate3d(' + (x - pv.offsetWidth / 2) + 'px,' + (y - pv.offsetHeight - 24) + 'px,0)';
      raf = Math.abs(tx - x) + Math.abs(ty - y) > 0.3 ? requestAnimationFrame(loop) : 0;
    };
    rows.addEventListener('mousemove', function (e) { tx = e.clientX; ty = e.clientY; if (!raf) raf = requestAnimationFrame(loop); });
    [].forEach.call(rows.querySelectorAll('.row'), function (r) {
      r.addEventListener('mouseenter', function (e) {
        pimg.src = r.getAttribute('data-img');
        if (!pv.classList.contains('on')) { x = tx = e.clientX; y = ty = e.clientY; loop(); }
        pv.classList.add('on');
      });
    });
    rows.addEventListener('mouseleave', function () { pv.classList.remove('on'); });
    // warm the cache so the first hover isn't blank
    [].forEach.call(rows.querySelectorAll('.row'), function (r) { var i = new Image(); i.src = r.getAttribute('data-img'); });
  }

  // ---- process: vertical scroll drives a horizontal track
  var proc = d.querySelector('.process'), track = proc && proc.querySelector('.track');
  if (proc && track && !reduce) {
    var size = function () {
      if (window.innerWidth < 810) { proc.style.height = ''; track.style.transform = ''; return; }
      var extra = Math.max(0, track.scrollWidth - window.innerWidth);
      proc.style.height = (window.innerHeight + extra) + 'px';
      move();
    };
    var move = function () {
      if (window.innerWidth < 810) return;
      var extra = Math.max(0, track.scrollWidth - window.innerWidth);
      var top = proc.getBoundingClientRect().top;
      var p = Math.min(1, Math.max(0, -top / Math.max(1, proc.offsetHeight - window.innerHeight)));
      track.style.transform = 'translate3d(' + (-p * extra) + 'px,0,0)';
    };
    window.addEventListener('scroll', move, { passive: true });
    window.addEventListener('resize', size);
    window.addEventListener('load', size);
    size();
  }

  // ---- present mode
  var slides = [].slice.call(d.querySelectorAll('.slide'));
  if (!slides.length) return;
  var hud = d.createElement('div');
  hud.className = 'hud'; hud.setAttribute('aria-live', 'polite');
  hud.innerHTML = '<button type="button" class="prev" aria-label="Previous slide">Prev</button>' +
    '<span class="count"></span><button type="button" class="nxt" aria-label="Next slide">Next</button>' +
    '<button type="button" class="exit">Exit</button>';
  d.body.appendChild(hud);
  var countEl = hud.querySelector('.count'), current = 0;
  var pad = function (n) { return n < 10 ? '0' + n : '' + n; };
  var setCount = function () { countEl.textContent = pad(current + 1) + ' / ' + pad(slides.length); };
  var go = function (i) { current = Math.max(0, Math.min(slides.length - 1, i)); slides[current].scrollIntoView({ block: 'start' }); setCount(); };
  var start = function (full) {
    if (root.classList.contains('presenting')) return;
    var mid = window.innerHeight * 0.4, best = 0;
    slides.forEach(function (s, i) { if (s.getBoundingClientRect().top <= mid) best = i; });
    root.classList.add('presenting');
    if (full && root.requestFullscreen) root.requestFullscreen().catch(function () {});
    requestAnimationFrame(function () { go(best); });
  };
  var stop = function () {
    if (!root.classList.contains('presenting')) return;
    root.classList.remove('presenting');
    if (d.fullscreenElement && d.exitFullscreen) d.exitFullscreen().catch(function () {});
    requestAnimationFrame(function () { slides[current].scrollIntoView({ block: 'start' }); });
    if (/[?&]present\b/.test(location.search)) history.replaceState(null, '', location.pathname + location.hash);
  };
  d.addEventListener('fullscreenchange', function () {
    if (!d.fullscreenElement && root.classList.contains('presenting') && !/[?&]present\b/.test(location.search)) stop();
  });
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting && e.intersectionRatio > 0.55) { current = slides.indexOf(e.target); setCount(); } });
    }, { threshold: [0.55] });
    slides.forEach(function (s) { io.observe(s); });
  }
  [].forEach.call(d.querySelectorAll('[data-present]'), function (b) { b.addEventListener('click', function (e) { e.preventDefault(); start(true); }); });
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
  if (/[?&]present\b/.test(location.search)) start(false);
})();
