/* Present mode: every .slide becomes one full screen.
   P or the Present button starts it, arrows / space / page keys move,
   Esc or Exit ends it. ?present in the URL opens straight into it. */
/* Hero line types itself once, like the old MyPortfolio site. */
(function () {
  var el = document.querySelector('[data-type]');
  if (!el) return;
  var full = el.textContent;
  if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  el.textContent = '';
  var i = 0;
  (function tick() {
    el.textContent = full.slice(0, ++i);
    if (i < full.length) setTimeout(tick, full[i - 1] === ' ' ? 70 : 42);
  })();
})();

(function () {
  var root = document.documentElement;
  var slides = [].slice.call(document.querySelectorAll('.slide'));
  if (!slides.length) return;

  var hud = document.createElement('div');
  hud.className = 'hud';
  hud.setAttribute('aria-live', 'polite');
  hud.innerHTML =
    '<span class="keys">arrow keys to move.</span>' +
    '<button type="button" class="prev" aria-label="Previous slide">&#8593;</button>' +
    '<span class="count">1 / ' + slides.length + '</span>' +
    '<button type="button" class="nxt" aria-label="Next slide">&#8595;</button>' +
    '<button type="button" class="exit">exit.</button>';
  document.body.appendChild(hud);
  var countEl = hud.querySelector('.count');

  var current = 0;
  function pad(n) { return n < 10 ? '0' + n : '' + n; }
  function setCount() { countEl.textContent = pad(current + 1) + ' / ' + pad(slides.length); }

  function go(i) {
    current = Math.max(0, Math.min(slides.length - 1, i));
    slides[current].scrollIntoView({ block: 'start' });
    setCount();
  }

  function start(wantFull) {
    if (root.classList.contains('presenting')) return;
    // remember where the reader was, so the deck opens on that slide
    var y = window.innerHeight * 0.4, best = 0;
    slides.forEach(function (s, i) { if (s.getBoundingClientRect().top <= y) best = i; });
    root.classList.add('presenting');
    if (wantFull && root.requestFullscreen) { root.requestFullscreen().catch(function () {}); }
    requestAnimationFrame(function () { go(best); });
  }

  function stop() {
    if (!root.classList.contains('presenting')) return;
    root.classList.remove('presenting');
    if (document.fullscreenElement && document.exitFullscreen) { document.exitFullscreen().catch(function () {}); }
    requestAnimationFrame(function () { slides[current].scrollIntoView({ block: 'start' }); });
    if (/[?&]present\b/.test(location.search)) { history.replaceState(null, '', location.pathname + location.hash); }
  }

  document.addEventListener('fullscreenchange', function () {
    if (!document.fullscreenElement && root.classList.contains('presenting') && !/[?&]present\b/.test(location.search)) stop();
  });

  // keep the counter honest when someone scrolls or swipes
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting && e.intersectionRatio > 0.55) { current = slides.indexOf(e.target); setCount(); }
      });
    }, { threshold: [0.55] });
    slides.forEach(function (s) { io.observe(s); });
  }

  [].slice.call(document.querySelectorAll('[data-present]')).forEach(function (b) {
    b.addEventListener('click', function (e) { e.preventDefault(); start(true); });
  });
  hud.querySelector('.prev').addEventListener('click', function () { go(current - 1); });
  hud.querySelector('.nxt').addEventListener('click', function () { go(current + 1); });
  hud.querySelector('.exit').addEventListener('click', stop);

  document.addEventListener('keydown', function (e) {
    var t = e.target;
    if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    var on = root.classList.contains('presenting');
    if (!on) {
      if (e.key === 'p' || e.key === 'P') { e.preventDefault(); start(true); }
      return;
    }
    switch (e.key) {
      case 'ArrowDown': case 'ArrowRight': case 'PageDown': case ' ': case 'Enter':
        if (e.key === 'Enter' && t && t.tagName === 'A') return;
        e.preventDefault(); go(current + 1); break;
      case 'ArrowUp': case 'ArrowLeft': case 'PageUp':
        e.preventDefault(); go(current - 1); break;
      case 'Home': e.preventDefault(); go(0); break;
      case 'End': e.preventDefault(); go(slides.length - 1); break;
      case 'Escape': stop(); break;
      case 'f': case 'F':
        if (!document.fullscreenElement && root.requestFullscreen) root.requestFullscreen().catch(function () {});
        break;
      case 'p': case 'P': stop(); break;
    }
  });

  setCount();
  if (/[?&]present\b/.test(location.search)) { start(false); }
})();
