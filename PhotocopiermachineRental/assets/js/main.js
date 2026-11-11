/* ==========================================================================
   Copixa — main.js  (vanilla, no dependencies)
   Modules are initialised by data-attributes, so any page can opt in.
   ========================================================================== */
(function () {
  'use strict';
  var root = document.documentElement;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var store = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  };
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  root.classList.remove('no-js');

  /* ---------- Smooth scrolling (Lenis) ---------- */
  var lenis = null;
  if (window.Lenis && !reduced) {
    lenis = new window.Lenis({
      lerp: 0.085, smoothWheel: true, wheelMultiplier: 1,
      prevent: function (node) { return !!(node && node.closest && node.closest('[data-lenis-prevent], .side-sheet, .drawer, .success-modal')); }
    });
    var lenisRaf = function (t) { lenis.raf(t); requestAnimationFrame(lenisRaf); };
    requestAnimationFrame(lenisRaf);
    window.copixaLenis = lenis;
  }
  function scrollToY(y) { if (lenis) lenis.scrollTo(y, { duration: 1.2 }); else window.scrollTo({ top: y, behavior: reduced ? 'auto' : 'smooth' }); }
  function lockScroll(on) { document.body.style.overflow = on ? 'hidden' : ''; if (lenis) { if (on) lenis.stop(); else lenis.start(); } }
  window.copixaScrollTo = scrollToY;
  /* same-page anchor links glide smoothly and clear the sticky header */
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href^="#"]');
    if (!a || a.hasAttribute('data-tab') || a.hasAttribute('data-goto-tab') || a.getAttribute('href').length < 2) return;
    var t = document.getElementById(a.getAttribute('href').slice(1)); if (!t) return;
    e.preventDefault(); scrollToY(t.getBoundingClientRect().top + window.scrollY - 90);
    if (a.classList.contains('skip-link') || t.tabIndex > -1 || t.hasAttribute('tabindex')) t.focus({ preventScroll: true });
    if (!a.classList.contains('skip-link')) history.replaceState(null, '', a.getAttribute('href'));
  });

  /* ---------- Theme ---------- */
  function setTheme(mode) {
    root.classList.toggle('dark', mode === 'dark');
    store.set('copixa-theme', mode);
    $$('[data-theme-toggle]').forEach(function (b) { b.setAttribute('aria-pressed', mode === 'dark'); });
    document.dispatchEvent(new CustomEvent('themechange', { detail: mode }));
  }
  $$('[data-theme-toggle]').forEach(function (btn) {
    btn.setAttribute('aria-pressed', root.classList.contains('dark'));
    btn.addEventListener('click', function () { setTheme(root.classList.contains('dark') ? 'light' : 'dark'); });
  });

  /* ---------- Direction (RTL) ---------- */
  $$('[data-dir-toggle]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var next = root.getAttribute('dir') === 'rtl' ? 'ltr' : 'rtl';
      root.setAttribute('dir', next);
      root.setAttribute('lang', next === 'rtl' ? 'ar' : 'en');
      store.set('copixa-dir', next);
      document.dispatchEvent(new CustomEvent('dirchange', { detail: next }));
    });
  });

  /* ---------- Header + scroll progress + back to top ---------- */
  var header = $('#site-header');
  var progress = $('#scroll-progress');
  var toTop = $('#to-top');
  var ticking = false;
  function onScroll() {
    var y = window.scrollY;
    if (header) header.classList.toggle('is-scrolled', y > 12);
    if (progress) {
      var h = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.transform = 'scaleX(' + (h > 0 ? y / h : 0) + ')';
    }
    if (toTop) toTop.classList.toggle('!opacity-100', y > 700), toTop.classList.toggle('!pointer-events-auto', y > 700);
    parallax(); sheets(); hscroll(); scrollTilt(); timeline();
    ticking = false;
  }
  window.addEventListener('scroll', function () { if (!ticking) { requestAnimationFrame(onScroll); ticking = true; } }, { passive: true });
  window.addEventListener('resize', function () { setupHscroll(); requestAnimationFrame(onScroll); });
  window.addEventListener('load', function () { setupHscroll(); onScroll(); });
  if (toTop) toTop.addEventListener('click', function () { scrollToY(0); });

  /* ---------- Mobile drawer ---------- */
  var drawer = $('#mobile-drawer'), drawerReturn = null;
  /* keep keyboard focus inside an open dialog / drawer */
  function trapFocus(e, box) {
    if (e.key !== 'Tab' || !box) return;
    var f = $$('a[href],button:not([disabled]),input:not([disabled]):not([type=hidden]),select,textarea,[tabindex]:not([tabindex="-1"])', box).filter(function (el) { return el.offsetParent !== null || el === document.activeElement; });
    if (!f.length) return;
    var first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }
  document.addEventListener('keydown', function (e) {
    var openSheetEl = $('.side-sheet.is-open'), modal = $('.success-modal.is-open');
    if (modal) trapFocus(e, $('div', modal)); else if (openSheetEl) trapFocus(e, openSheetEl); else if (drawer && drawer.classList.contains('is-open')) trapFocus(e, drawer);
  });
  var backdrop = $('#drawer-backdrop');
  function drawerToggle(open) {
    if (!drawer) return;
    drawer.classList.toggle('is-open', open);
    backdrop && backdrop.classList.toggle('is-open', open);
    if (drawer.classList.contains('is-open') === open && drawer.inert === !open) return;
    drawer.setAttribute('aria-hidden', !open); drawer.inert = !open;
    $$('[data-drawer-open]').forEach(function (b) { b.setAttribute('aria-expanded', open); });
    lockScroll(open);
    if (open) { drawerReturn = document.activeElement; var f = $('[data-drawer-close]', drawer); setTimeout(function () { f && f.focus(); }, 60); }
    else if (drawerReturn && drawerReturn.focus) drawerReturn.focus();
  }
  $$('[data-drawer-open]').forEach(function (b) { b.addEventListener('click', function () { drawerToggle(true); }); });
  $$('[data-drawer-close]').forEach(function (b) { b.addEventListener('click', function () { drawerToggle(false); }); });
  backdrop && backdrop.addEventListener('click', function () { drawerToggle(false); });
  window.addEventListener('resize', function () { if (window.innerWidth >= 1280) drawerToggle(false); });

  /* drawer sub-menus */
  $$('[data-subnav]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var item = btn.closest('.acc-item');
      item.classList.toggle('is-open');
      btn.setAttribute('aria-expanded', item.classList.contains('is-open'));
    });
  });

  /* ---------- Accordion (FAQ) ---------- */
  $$('[data-accordion]').forEach(function (group) {
    $$('.acc-trigger', group).forEach(function (t) {
      t.addEventListener('click', function () {
        var item = t.closest('.acc-item');
        var open = !item.classList.contains('is-open');
        if (group.dataset.accordion === 'single') $$('.acc-item', group).forEach(function (i) { i.classList.remove('is-open'); $('.acc-trigger', i).setAttribute('aria-expanded', 'false'); });
        item.classList.toggle('is-open', open);
        t.setAttribute('aria-expanded', open);
      });
    });
  });

  /* ---------- Split headline ---------- */
  $$('[data-split]').forEach(function (el) {
    var words = el.innerHTML.trim().split(/(<[^>]+>|\s+)/).filter(Boolean);
    var i = 0, out = '', grad = false;
    words.forEach(function (w) {
      if (/^<\/?(span|em|strong|br)/.test(w)) {
        if (/text-gradient/.test(w)) { grad = true; out += w.replace('text-gradient', ''); return; }
        if (/^<\/span/.test(w)) grad = false;
        out += w; return;
      }
      if (/^\s+$/.test(w)) { out += ' '; return; }
      out += '<span class="split-word"><span class="' + (grad ? 'text-gradient' : '') + '" style="--d:' + (i++ * 70) + 'ms">' + w + '</span></span>';
    });
    el.innerHTML = out;
    if (!el.hasAttribute('dir')) el.setAttribute('dir', 'auto'); /* keep word order correct for Latin text in RTL */
    el.classList.add('is-split');
    if (!el.hasAttribute('data-reveal')) el.setAttribute('data-reveal-split', '');
  });

  /* ---------- Reveal on scroll ---------- */
  $$('[data-stagger]').forEach(function (p) {
    var step = parseInt(p.dataset.stagger, 10) || 110;
    $$('[data-reveal]', p).forEach(function (c, i) { if (!c.dataset.delay) c.style.setProperty('--d', (i * step) + 'ms'); });
  });
  $$('[data-reveal][data-delay]').forEach(function (el) { el.style.setProperty('--d', el.dataset.delay + 'ms'); });
  var revealEls = $$('[data-reveal], .is-split');
  if ('IntersectionObserver' in window && !reduced) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('is-visible'); io.unobserve(e.target); }
      });
    }, { threshold: 0.14, rootMargin: '0px 0px -40px 0px' });
    /* a clip-path reveal starts fully clipped, which the browser counts as "not visible",
       so those are triggered by their (unclipped) parent box instead */
    var cio2 = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { (e.target.__clipKids || []).forEach(function (k) { k.classList.add('is-visible'); }); cio2.unobserve(e.target); } });
    }, { threshold: 0.1 });
    revealEls.forEach(function (el) {
      if (/^clip/.test(el.getAttribute('data-reveal') || '') || el.parentElement.hasAttribute('data-slider-track')) { var par = el.parentElement; (par.__clipKids = par.__clipKids || []).push(el); cio2.observe(par); }
      else io.observe(el);
    });
  } else revealEls.forEach(function (el) { el.classList.add('is-visible'); });

  /* ---------- Counters ---------- */
  function fmt(n, dec) { return n.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec }); }
  var counters = $$('[data-count]');
  if ('IntersectionObserver' in window) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var el = e.target, end = parseFloat(el.dataset.count), dec = (el.dataset.count.split('.')[1] || '').length;
        var dur = 1800, t0 = null;
        function step(t) { if (!t0) t0 = t; var p = Math.min((t - t0) / dur, 1); p = 1 - Math.pow(1 - p, 4); el.textContent = fmt(end * p, dec); if (p < 1) requestAnimationFrame(step); }
        reduced ? el.textContent = fmt(end, dec) : requestAnimationFrame(step);
        cio.unobserve(el);
      });
    }, { threshold: 0.5 });
    counters.forEach(function (c) { cio.observe(c); });
  }

  /* ---------- Parallax (only elements currently on screen are computed) ---------- */
  var plx = $$('[data-parallax]'), plxActive = new Set();
  if ('IntersectionObserver' in window) {
    var pio = new IntersectionObserver(function (en) { en.forEach(function (e) { if (e.isIntersecting) plxActive.add(e.target); else plxActive.delete(e.target); }); }, { rootMargin: '150px 0px' });
    plx.forEach(function (el) { pio.observe(el.parentElement); el.parentElement.__plx = el; });
  }
  function parallax() {
    if (reduced || !plxActive.size) return;
    var vh = window.innerHeight;
    plxActive.forEach(function (box) {
      var el = box.__plx, r = box.getBoundingClientRect();
      var offset = (r.top + r.height / 2 - vh / 2) * (parseFloat(el.dataset.parallax) || 0.15);
      el.style.transform = 'translate3d(0,' + offset.toFixed(1) + 'px,0)';
    });
  }

  /* ---------- Stacking sheets ---------- */
  var sheetCards = $$('.sheet-stack .sheet-card');
  sheetCards.forEach(function (c, i) { c.style.setProperty('--i', i); });
  function sheets() {
    if (reduced || !sheetCards.length || window.innerWidth < 768) { sheetCards.forEach(function (c) { c.style.transform = ''; c.style.filter = ''; }); return; }
    sheetCards.forEach(function (card, i) {
      var next = sheetCards[i + 1];
      if (!next) return;
      var nr = next.getBoundingClientRect(), cr = card.getBoundingClientRect();
      var overlap = Math.min(Math.max((cr.bottom - nr.top) / cr.height, 0), 1);
      card.style.transform = 'scale(' + (1 - overlap * 0.06).toFixed(4) + ') rotate(' + (overlap * -1.2 * (root.dir === 'rtl' ? -1 : 1)).toFixed(3) + 'deg)';
      card.style.filter = 'brightness(' + (1 - overlap * 0.12).toFixed(3) + ')';
    });
  }

  /* ---------- Horizontal pinned scroll ----------
     The section is pinned (sticky) while vertical scrolling moves the track
     right-to-left; once the last card is in view the page continues down.
     Sizes are measured on load/resize only — per frame we just set a transform. */
  var hs = $$('[data-hscroll]').map(function (sec) { return { sec: sec, track: $('.hscroll-track', sec), bar: $('.hscroll-bar', sec), dist: 0, top: 0 }; });
  function setupHscroll() {
    hs.forEach(function (h) {
      if (!h.track) return;
      if (reduced) { var pin = $('.hscroll-pin', h.sec), vp = $('.hscroll-viewport', h.sec); if (pin) pin.style.position = 'relative'; if (vp) vp.style.overflowX = 'auto'; h.sec.style.height = ''; return; }
      h.track.style.transform = 'none';
      h.dist = Math.max(h.track.scrollWidth - document.documentElement.clientWidth, 0);
      h.sec.style.height = (window.innerHeight + h.dist) + 'px';
      h.top = h.sec.getBoundingClientRect().top + window.scrollY;
    });
    hscroll();
  }
  function hscroll() {
    if (reduced) return;
    var y = window.scrollY;
    hs.forEach(function (h) {
      if (!h.track || !h.dist) return;
      var p = Math.min(Math.max((y - h.top) / h.dist, 0), 1);
      h.track.style.transform = 'translate3d(' + (-p * h.dist * (root.dir === 'rtl' ? -1 : 1)).toFixed(1) + 'px,0,0)';
      if (h.bar) h.bar.style.transform = 'scaleX(' + p.toFixed(4) + ')';
    });
  }
  document.addEventListener('dirchange', function () { setupHscroll(); });

  /* ---------- Scroll-driven 3D tilt (mockups) ---------- */
  var st = $$('[data-scroll-tilt]');
  function scrollTilt() {
    if (reduced) return;
    st.forEach(function (el) {
      var r = el.getBoundingClientRect(), vh = window.innerHeight;
      var p = Math.min(Math.max((vh - r.top) / (vh * 0.9), 0), 1);
      el.style.transform = 'perspective(1600px) rotateX(' + ((1 - p) * 22).toFixed(2) + 'deg) scale(' + (0.9 + p * 0.1).toFixed(3) + ')';
    });
  }

  /* ---------- Timeline line fill ---------- */
  var tls = $$('[data-timeline]');
  function timeline() {
    tls.forEach(function (t) {
      var r = t.getBoundingClientRect(), vh = window.innerHeight;
      var p = Math.min(Math.max((vh * 0.6 - r.top) / r.height, 0), 1);
      var f = $('.timeline-fill', t); if (f) f.style.transform = 'scaleY(' + p.toFixed(3) + ')';
    });
  }

  /* ---------- Pointer tilt ---------- */
  if (!reduced && window.matchMedia('(hover: hover)').matches) {
    $$('[data-tilt]').forEach(function (el) {
      el.addEventListener('mousemove', function (e) {
        var r = el.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        el.style.setProperty('--ry', (x * 10).toFixed(2) + 'deg');
        el.style.setProperty('--rx', (-y * 10).toFixed(2) + 'deg');
      });
      el.addEventListener('mouseleave', function () { el.style.setProperty('--rx', '0deg'); el.style.setProperty('--ry', '0deg'); });
    });
  }

  /* ---------- Animated explainer (auto-cycling steps) ---------- */
  $$('[data-explainer]').forEach(function (box) {
    var steps = $$('.step', box), stages = $$('.stage', box), idx = 0, timer;
    var ms = parseInt(box.dataset.explainer, 10) || 4500;
    box.style.setProperty('--step-ms', ms + 'ms');
    function go(i) {
      idx = i;
      steps.forEach(function (s, k) { s.classList.toggle('is-active', k === i); s.setAttribute('aria-selected', k === i); var b = $('.step-bar', s); if (b) { b.style.animation = 'none'; b.offsetHeight; b.style.animation = ''; } });
      stages.forEach(function (s, k) {
        s.classList.toggle('is-active', k === i);
        if (k === i) $$('[class*="grow-bar"],[class*="draw-line"],.track-fill', s).forEach(function (a) { a.style.animation = 'none'; a.getBoundingClientRect(); a.style.animation = ''; });
      });
      clearTimeout(timer);
      timer = setTimeout(function () { go((idx + 1) % steps.length); }, ms);
    }
    steps.forEach(function (s, k) { s.addEventListener('click', function () { go(k); }); });
    var started = false;
    new IntersectionObserver(function (en) { en.forEach(function (e) { if (e.isIntersecting && !started) { started = true; go(0); } }); }, { threshold: 0.3 }).observe(box);
  });

  /* ---------- Generic tabs ---------- */
  $$('[data-tabs]').forEach(function (wrap) {
    var tabs = $$('[data-tab]', wrap);
    function activate(id, push) {
      tabs.forEach(function (t) { var on = t.dataset.tab === id; t.classList.toggle('is-active', on); t.setAttribute('aria-selected', on); });
      $$('[data-panel]', wrap).forEach(function (p) { p.hidden = p.dataset.panel !== id; });
      if (push && wrap.hasAttribute('data-tabs-hash')) history.replaceState(null, '', '#' + id);
      document.dispatchEvent(new CustomEvent('tabchange', { detail: id }));
      var at = tabs.filter(function (t) { return t.dataset.tab === id; })[0];
      if (at && push) { var bar = at.parentElement; if (bar && bar.scrollWidth > bar.clientWidth) bar.scrollTo({ left: at.offsetLeft - (bar.clientWidth - at.offsetWidth) / 2, behavior: reduced ? 'auto' : 'smooth' }); }
    }
    tabs.forEach(function (t) { t.addEventListener('click', function (e) { e.preventDefault(); activate(t.dataset.tab, true); }); });
    $$('[data-goto-tab]').forEach(function (l) { l.addEventListener('click', function (e) { e.preventDefault(); activate(l.dataset.gotoTab, true); scrollToY(wrap.getBoundingClientRect().top + window.scrollY - 90); }); });
    if (wrap.hasAttribute('data-tabs-hash')) window.addEventListener('hashchange', function () { var h = location.hash.slice(1); if (tabs.some(function (t) { return t.dataset.tab === h; })) activate(h, false); });
    var initial = wrap.hasAttribute('data-tabs-hash') && location.hash ? location.hash.slice(1) : null;
    activate(initial && tabs.some(function (t) { return t.dataset.tab === initial; }) ? initial : tabs[0].dataset.tab, false);
  });

  /* ---------- Billing toggle (monthly / yearly) ---------- */
  $$('[data-billing]').forEach(function (wrap) {
    var btns = $$('[data-billing-btn]', wrap), knob = $('[data-billing-knob]', wrap);
    function set(mode) {
      btns.forEach(function (b) { var on = b.dataset.billingBtn === mode; b.classList.toggle('text-white', on); b.classList.toggle('text-ink-500', !on); b.setAttribute('aria-pressed', on); });
      if (knob) knob.style.transform = mode === 'yearly' ? 'translateX(calc(100% * var(--dir)))' : '';
      $$('[data-price-monthly]').forEach(function (p) {
        var v = mode === 'yearly' ? p.dataset.priceYearly : p.dataset.priceMonthly;
        p.animate ? p.animate([{ opacity: 0, transform: 'translateY(-8px)' }, { opacity: 1, transform: 'none' }], { duration: 350 }) : 0;
        p.textContent = v;
      });
      $$('[data-billing-note]').forEach(function (n) { n.textContent = mode === 'yearly' ? n.dataset.yearly : n.dataset.monthly; });
    }
    btns.forEach(function (b) { b.addEventListener('click', function () { set(b.dataset.billingBtn); }); });
    set('monthly');
  });

  /* ---------- Pagination helper (shared with dashboard.js) ----------
     render(items) shows one page of the given items and builds the nav. */
  window.copixaPaginator = function (scope, per, onPage) {
    var nav = $('[data-pagination]', scope), info = $('[data-page-info]', scope), wrap = $('[data-pagination-wrap]', scope), page = 1, list = [];
    function btn(label, p, opts) {
      var b = document.createElement('button'); b.type = 'button';
      b.className = 'icon-btn !h-10 !w-10 text-sm font-bold' + (opts.active ? ' !border-brand-600 !bg-brand-600 !text-white' : '') + (opts.disabled ? ' pointer-events-none opacity-40' : '');
      b.innerHTML = label; b.setAttribute('aria-label', opts.aria || ('Page ' + p)); if (opts.active) b.setAttribute('aria-current', 'page');
      if (opts.disabled) b.disabled = true;
      b.addEventListener('click', function () { go(p, true); });
      return b;
    }
    function go(p, user) {
      var pages = Math.max(Math.ceil(list.length / per), 1); page = Math.min(Math.max(p, 1), pages);
      list.forEach(function (it, i) { it.hidden = Math.floor(i / per) !== page - 1; });
      if (info) info.textContent = list.length ? ('Showing ' + ((page - 1) * per + 1) + '–' + Math.min(page * per, list.length) + ' of ' + list.length) : '';
      if (nav) {
        nav.innerHTML = '';
        var rtl = root.dir === 'rtl', prevI = '<svg class="h-4 w-4' + (rtl ? ' rotate-180' : '') + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m15 6-6 6 6 6"/></svg>', nextI = prevI.replace('m15 6-6 6 6 6', 'm9 6 6 6-6 6');
        nav.appendChild(btn(prevI, page - 1, { disabled: page === 1, aria: 'Previous page' }));
        for (var i = 1; i <= pages; i++) nav.appendChild(btn(String(i), i, { active: i === page }));
        nav.appendChild(btn(nextI, page + 1, { disabled: page === pages, aria: 'Next page' }));
        nav.hidden = pages < 2 && !wrap; if (wrap) wrap.hidden = !list.length;
      }
      if (user) { list.slice((page - 1) * per, page * per).forEach(function (it) { it.classList.add('is-visible'); }); var top = scope.getBoundingClientRect().top + window.scrollY - 100; if (top < window.scrollY) scrollToY(top); }
      onPage && onPage(page);
    }
    return { render: function (items, keep) { list = items; go(keep ? page : 1); } };
  };

  /* ---------- Filterable grids (+ search, sort, pagination, ?q= / ?cat= deep links) ---------- */
  var params = new URLSearchParams(location.search);
  $$('[data-filter-scope]').forEach(function (scope) {
    var chips = $$('[data-filter]', scope), items = $$('[data-cat]', scope), search = $('[data-filter-search]', scope), empty = $('[data-filter-empty]', scope), count = $('[data-filter-count]', scope), sort = $('[data-filter-sort]', scope), grid = $('[data-filter-grid]', scope);
    var clear = $('[data-filter-clear]', scope), tagBar = $('[data-tag-bar]', scope);
    var per = parseInt(scope.dataset.paginate, 10), pager = per ? window.copixaPaginator(scope, per) : null;
    var current = 'all', tag = params.get('tag') || '';
    if (search && params.get('q')) search.value = params.get('q');
    if (params.get('cat') && chips.some(function (c) { return c.dataset.filter === params.get('cat'); })) current = params.get('cat');
    var norm = function (t) { return (t || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''); };
    function apply(keep) {
      var q = search ? norm(search.value.trim()) : '', matched = [];
      items.forEach(function (it) {
        var hay = norm((it.dataset.search || '') + ' ' + it.textContent);
        var ok = (current === 'all' || it.dataset.cat.split(' ').indexOf(current) > -1) && (!q || q.split(/\s+/).every(function (w) { return hay.indexOf(w) > -1; })) && (!tag || (it.dataset.tags || '').split(' ').indexOf(tag) > -1);
        it.hidden = !ok; if (ok) { matched.push(it); it.classList.add('is-visible'); }
      });
      if (grid && sort) matched = $$('[data-cat]', grid).filter(function (i) { return matched.indexOf(i) > -1; });
      if (empty) empty.hidden = matched.length !== 0;
      if (count) count.textContent = matched.length;
      if (clear) clear.hidden = !(search && search.value);
      if (tagBar) { tagBar.hidden = !tag; var tl = $('[data-tag-label]', tagBar); if (tl) tl.textContent = '#' + tag.replace(/-/g, ' '); }
      if (pager) pager.render(matched, keep);
      if (window.copixaRefreshCart) window.copixaRefreshCart();
    }
    clear && clear.addEventListener('click', function () { search.value = ''; apply(); search.focus(); });
    $$('[data-filter-reset]', scope).forEach(function (b) { b.addEventListener('click', function () {
      if (search) search.value = ''; tag = ''; current = 'all';
      chips.forEach(function (x) { var on = x.dataset.filter === 'all'; x.classList.toggle('is-active', on); x.setAttribute('aria-pressed', on); });
      if (history.replaceState) history.replaceState(null, '', location.pathname); apply();
    }); });
    chips.forEach(function (c) {
      c.classList.toggle('is-active', c.dataset.filter === current); c.setAttribute('aria-pressed', c.dataset.filter === current);
      c.addEventListener('click', function () { current = c.dataset.filter; chips.forEach(function (x) { x.classList.toggle('is-active', x === c); x.setAttribute('aria-pressed', x === c); }); apply(); });
    });
    search && search.addEventListener('input', function () { apply(); });
    sort && grid && sort.addEventListener('change', function () {
      var key = sort.value;
      items.slice().sort(function (a, b) {
        if (key === 'price-asc') return +a.dataset.price - +b.dataset.price;
        if (key === 'price-desc') return +b.dataset.price - +a.dataset.price;
        if (key === 'speed') return +b.dataset.speed - +a.dataset.speed;
        return +a.dataset.order - +b.dataset.order;
      }).forEach(function (i) { grid.appendChild(i); });
      apply();
    });
    apply();
  });

  /* ---------- Grid / list view toggle ---------- */
  $$('[data-view-scope]').forEach(function (scope) {
    var grid = $('[data-view-grid]', scope);
    $$('[data-view]', scope).forEach(function (b) {
      b.addEventListener('click', function () {
        var list = b.dataset.view === 'list';
        grid.classList.toggle('is-list', list);
        $$('[data-view]', scope).forEach(function (x) { x.classList.toggle('is-active', x === b); x.setAttribute('aria-pressed', x === b); });
      });
    });
  });

  /* ---------- Side / bottom sheets ---------- */
  var sheetBackdrop = $('#sheet-backdrop');
  var lastFocus = null;
  function openSheet(id) {
    var s = document.getElementById(id); if (!s) return;
    lastFocus = document.activeElement;
    $$('.side-sheet.is-open').forEach(function (o) { if (o !== s) { o.classList.remove('is-open'); o.setAttribute('aria-hidden', 'true'); o.inert = true; } });
    s.classList.add('is-open'); s.setAttribute('aria-hidden', 'false'); s.inert = false;
    sheetBackdrop && sheetBackdrop.classList.add('is-open');
    lockScroll(true);
    setTimeout(function () { var f = $('[data-sheet-close]', s); f && f.focus(); }, 60);
  }
  function closeSheets() {
    if (!$('.side-sheet.is-open')) return;
    $$('.side-sheet.is-open').forEach(function (s) { s.classList.remove('is-open'); s.setAttribute('aria-hidden', 'true'); s.inert = true; });
    sheetBackdrop && sheetBackdrop.classList.remove('is-open');
    lockScroll(false);
    lastFocus && lastFocus.focus && lastFocus.focus();
  }
  window.copixaSheet = { open: openSheet, close: closeSheets };
  document.addEventListener('click', function (e) {
    var o = e.target.closest('[data-sheet-open]');
    if (o) { e.preventDefault(); document.dispatchEvent(new CustomEvent('sheetopen', { detail: { id: o.dataset.sheetOpen, trigger: o } })); openSheet(o.dataset.sheetOpen); }
    if (e.target.closest('[data-sheet-close]')) { e.preventDefault(); closeSheets(); }
  });
  sheetBackdrop && sheetBackdrop.addEventListener('click', closeSheets);
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    var dd = $('.has-dropdown.is-open, .cselect.is-open');
    if (dd) return; /* dropdown handlers close themselves first */
    if ($('.success-modal.is-open')) return;
    closeSheets(); if (drawer && drawer.classList.contains('is-open')) drawerToggle(false);
  });
  $$('.side-sheet').forEach(function (s) { s.inert = !s.classList.contains('is-open'); });

  /* Quick-view: copy data-* from trigger into the sheet */
  var MACHINES = {}; try { MACHINES = JSON.parse(($('#machine-data') || {}).textContent || '{}'); } catch (e) {}
  window.copixaMachines = MACHINES;
  document.addEventListener('sheetopen', function (e) {
    var t = e.detail.trigger, slug = t.dataset.qvSlug; if (!slug || !MACHINES[slug]) return;
    var d = MACHINES[slug], s = document.getElementById(e.detail.id);
    var set = function (k, v) { $$('[data-qv-' + k + ']', s).forEach(function (el) { el.textContent = v; }); };
    set('name', d.name); set('type', d.type); set('ppm', d.ppm); set('paper', d.paper); set('price', '$' + d.price); set('desc', d.desc);
    var im = $('[data-qv-img]', s); im.src = d.img; im.alt = d.name + ', ' + d.type;
    $('[data-qv-href]', s).href = 'product.html?m=' + slug; $('[data-qv-cart]', s).dataset.addCart = slug;
  });

  /* ---------- Toast ---------- */
  window.copixaToast = function (msg, type) {
    var wrap = $('#toast-wrap');
    if (!wrap) { wrap = document.createElement('div'); wrap.id = 'toast-wrap'; wrap.className = 'pointer-events-none fixed bottom-20 end-5 start-5 sm:start-auto z-[140] flex flex-col items-end gap-2'; wrap.setAttribute('aria-live', 'polite'); document.body.appendChild(wrap); }
    var t = document.createElement('div');
    t.className = 'toast flex max-w-sm items-center gap-3 rounded-2xl border border-ink-900 bg-ink-900 px-4 py-3 text-sm font-semibold text-white shadow-lift dark:border-white/10 dark:bg-white dark:text-ink-900';
    var ic = type === 'error' ? '<path d="M12 8v4M12 16h.01"/><circle cx="12" cy="12" r="10"/>' : '<path d="M20 6 9 17l-5-5"/>';
    t.innerHTML = '<span class="grid h-7 w-7 shrink-0 place-items-center rounded-full ' + (type === 'error' ? 'bg-rose-600' : 'bg-emerald-600') + ' text-white"><svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ic + '</svg></span><span></span>';
    t.lastChild.textContent = msg;
    wrap.appendChild(t);
    requestAnimationFrame(function () { t.classList.add('is-show'); });
    setTimeout(function () { t.classList.remove('is-show'); setTimeout(function () { t.remove(); }, 400); }, 3400);
  };

  /* ---------- Success popup (works in light + dark) ---------- */
  var successModal = null, successReturn = null;
  window.copixaSuccess = function (title, msg) {
    if (!successModal) {
      successModal = document.createElement('div'); successModal.className = 'success-modal'; successModal.setAttribute('role', 'dialog'); successModal.setAttribute('aria-modal', 'true'); successModal.setAttribute('aria-labelledby', 'success-title');
      successModal.innerHTML = '<div class="w-full max-w-md rounded-[2rem] border border-ink-200 bg-white p-8 text-center shadow-lift dark:border-white/10 dark:bg-ink-900">' +
        '<span class="mx-auto grid h-20 w-20 place-items-center rounded-full bg-emerald-500/15 ring-8 ring-emerald-500/10"><svg viewBox="0 0 24 24" class="h-10 w-10 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path class="check-draw" d="M5 12.5l4.2 4.2L19 7"/></svg></span>' +
        '<h2 id="success-title" class="mt-6 font-display text-2xl font-bold text-ink-900 dark:text-white"></h2><p class="mt-2 text-ink-600 dark:text-ink-300" data-success-msg></p>' +
        '<button type="button" class="btn btn-primary mt-8 w-full" data-success-close>Done</button></div>';
      document.body.appendChild(successModal);
      successModal.addEventListener('click', function (e) { if (e.target === successModal || e.target.closest('[data-success-close]')) closeSuccess(); });
    }
    $('#success-title', successModal).textContent = title || 'Thank you!';
    $('[data-success-msg]', successModal).textContent = msg || '';
    successReturn = document.activeElement;
    successModal.classList.remove('is-open'); successModal.offsetWidth; successModal.classList.add('is-open');
    lockScroll(true);
    setTimeout(function () { $('[data-success-close]', successModal).focus(); }, 50);
  };
  function closeSuccess() { if (!successModal || !successModal.classList.contains('is-open')) return; successModal.classList.remove('is-open'); lockScroll(false); successReturn && successReturn.focus && successReturn.focus(); }
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeSuccess(); });

  /* ---------- Demo forms ---------- */
  $$('form[data-demo-form]').forEach(function (f) {
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!window.copixaValidate(f)) return;
      var btn = $('[type=submit]', f), label = btn ? btn.innerHTML : '';
      if (btn) { btn.disabled = true; btn.innerHTML = '<svg class="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="3" opacity=".25"/><path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg> Sending…'; }
      setTimeout(function () {
        if (btn) { btn.disabled = false; btn.innerHTML = label; }
        if (f.dataset.redirect) { window.copixaToast(f.dataset.demoForm); setTimeout(function () { location.href = f.dataset.redirect; }, 700); return; }
        var inSheet = f.closest('.side-sheet');
        f.reset(); $$('select', f).forEach(function (x) { x.dispatchEvent(new Event('change')); });
        $$('[aria-invalid]', f).forEach(function (x) { x.removeAttribute('aria-invalid'); });
        if (inSheet) closeSheets();
        setTimeout(function () { window.copixaSuccess(f.dataset.successTitle || 'Thank you!', f.dataset.demoForm || "We'll be in touch shortly."); }, inSheet ? 300 : 0);
      }, 800);
    });
  });

  /* ---------- Contact form prefill from links (?machine= / ?plan= / ?topic=) ---------- */
  (function () {
    var msg = $('#c-msg'); if (!msg) return;
    var m = params.get('machine'), pl = params.get('plan'), t = params.get('topic');
    if (m) msg.value = 'Hi Copixa, I would like a quote to rent the ' + m + '. ';
    if (pl) msg.value = 'Hi Copixa, I am interested in the ' + pl + ' plan. ';
    if (t) msg.value = 'Topic: ' + t + '. ';
    var svc = $('#c-service'); if (svc && pl) svc.value = 'Copier & MFP Rental';
    if (m || pl || t) { var form = msg.closest('form'); setTimeout(function () { scrollToY(form.getBoundingClientRect().top + window.scrollY - 110); }, 400); }
  })();

  /* ---------- Share buttons + comment reply ---------- */
  $$('[data-share]').forEach(function (b) {
    b.addEventListener('click', function () {
      var u = encodeURIComponent(location.href), t = encodeURIComponent(document.title);
      var url = { linkedin: 'https://www.linkedin.com/sharing/share-offsite/?url=' + u, x: 'https://x.com/intent/post?url=' + u + '&text=' + t, facebook: 'https://www.facebook.com/sharer/sharer.php?u=' + u }[b.dataset.share];
      window.open(url, '_blank', 'noopener,noreferrer,width=640,height=560');
    });
  });
  $$('[data-reply-to]').forEach(function (b) {
    b.addEventListener('click', function () {
      var ta = $('#cm-msg'); if (!ta) return;
      ta.value = '@' + b.dataset.replyTo + ' '; scrollToY(ta.closest('form').getBoundingClientRect().top + window.scrollY - 110);
      setTimeout(function () { ta.focus(); ta.setSelectionRange(ta.value.length, ta.value.length); }, 600);
    });
  });

  /* ---------- Dropdowns: tap/click + keyboard (hover still works on desktop) ---------- */
  $$('.has-dropdown > button').forEach(function (b) {
    b.setAttribute('aria-expanded', 'false');
    b.addEventListener('click', function (e) {
      e.stopPropagation();
      var li = b.parentElement, open = !li.classList.contains('is-open');
      $$('.has-dropdown.is-open').forEach(function (x) { x.classList.remove('is-open'); $('button', x).setAttribute('aria-expanded', 'false'); });
      li.classList.toggle('is-open', open); b.setAttribute('aria-expanded', open);
    });
  });
  function closeDropdowns() { $$('.has-dropdown.is-open').forEach(function (x) { x.classList.remove('is-open'); $('button', x).setAttribute('aria-expanded', 'false'); }); }
  document.addEventListener('click', function (e) { if (!e.target.closest('.has-dropdown')) closeDropdowns(); });
  $$('.has-dropdown').forEach(function (li) {
    var b = $('button', li);
    li.addEventListener('keydown', function (e) {
      var links = $$('.dropdown a', li), i = links.indexOf(document.activeElement);
      if (e.key === 'Escape' && li.classList.contains('is-open')) { e.stopPropagation(); closeDropdowns(); b.focus(); }
      if (e.key === 'ArrowDown') { e.preventDefault(); if (!li.classList.contains('is-open')) b.click(); (links[i + 1] || links[0]).focus(); }
      if (e.key === 'ArrowUp' && i > -1) { e.preventDefault(); (links[i - 1] || links[links.length - 1]).focus(); }
    });
    li.addEventListener('focusout', function (e) { if (!li.contains(e.relatedTarget)) { li.classList.remove('is-open'); b.setAttribute('aria-expanded', 'false'); } });
  });

  /* ---------- Password visibility ---------- */
  $$('[data-pw-toggle]').forEach(function (b) {
    b.addEventListener('click', function () {
      var i = document.getElementById(b.dataset.pwToggle); var show = i.type === 'password';
      i.type = show ? 'text' : 'password'; b.setAttribute('aria-pressed', show);
      b.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
    });
  });

  /* Password strength */
  $$('[data-pw-meter]').forEach(function (m) {
    var input = document.getElementById(m.dataset.pwMeter), bars = $$('span', m), label = $('[data-pw-label]');
    input.addEventListener('input', function () {
      var v = input.value, s = 0;
      if (v.length >= 8) s++; if (/[A-Z]/.test(v) && /[a-z]/.test(v)) s++; if (/\d/.test(v)) s++; if (/[^A-Za-z0-9]/.test(v)) s++;
      var colors = ['bg-rose-500', 'bg-amber-500', 'bg-yellowx', 'bg-emerald-500'];
      bars.forEach(function (b, i) { b.className = 'h-1.5 flex-1 rounded-full ' + (i < s ? colors[s - 1] : 'bg-ink-200 dark:bg-white/10'); });
      if (label) label.textContent = ['Too short', 'Weak', 'Fair', 'Good', 'Strong'][s];
    });
  });

  /* ---------- Countdown ---------- */
  $$('[data-countdown]').forEach(function (el) {
    var target = new Date(el.dataset.countdown).getTime();
    function tick() {
      var d = Math.max(target - Date.now(), 0);
      var map = { days: Math.floor(d / 864e5), hours: Math.floor(d / 36e5) % 24, minutes: Math.floor(d / 6e4) % 60, seconds: Math.floor(d / 1e3) % 60 };
      Object.keys(map).forEach(function (k) { var n = $('[data-cd="' + k + '"]', el); if (n) n.textContent = String(map[k]).padStart(2, '0'); });
    }
    tick(); setInterval(tick, 1000);
  });

  /* ---------- Range inputs fill + cost calculator ---------- */
  function fillRange(r) { r.style.setProperty('--p', ((r.value - r.min) / (r.max - r.min) * 100) + '%'); }
  $$('input[type=range].range').forEach(function (r) { fillRange(r); r.addEventListener('input', function () { fillRange(r); }); });
  $$('[data-calc]').forEach(function (c) {
    var inputs = $$('input', c);
    function calc() {
      var v = {}; inputs.forEach(function (i) { v[i.name] = i.type === 'checkbox' ? i.checked : +i.value; });
      $$('[data-out]', c).forEach(function (o) { var k = o.dataset.out; if (v[k] !== undefined) o.textContent = fmt(v[k], 0); });
      var mono = v.pages * (1 - v.color / 100), col = v.pages * (v.color / 100);
      var rent = v.machines * 89, clicks = mono * 0.009 + col * 0.055, service = v.service ? 0 : v.machines * 35;
      var total = rent + clicks + service, buy = v.machines * 7400 / 36 + v.machines * 65 + mono * 0.018 + col * 0.11;
      $('[data-calc-total]', c).textContent = '$' + fmt(total, 0);
      $('[data-calc-save]', c).textContent = '$' + fmt(Math.max(buy - total, 0) * 12, 0);
      var pct = Math.min(Math.max((buy - total) / buy * 100, 0), 99);
      $('[data-calc-pct]', c).textContent = fmt(pct, 0) + '%';
      var bar = $('[data-calc-bar]', c); if (bar) bar.style.width = (100 - pct) + '%';
    }
    inputs.forEach(function (i) { i.addEventListener('input', calc); });
    calc();
  });

  /* ---------- Slider (scroll-snap) ---------- */
  $$('[data-slider]').forEach(function (s) {
    var track = $('[data-slider-track]', s);
    function by(dir) { var card = track.firstElementChild; var w = card ? card.getBoundingClientRect().width + 24 : 320; track.scrollBy({ left: w * dir * (root.dir === 'rtl' ? -1 : 1), behavior: 'smooth' }); }
    var prev = $('[data-slider-prev]', s), next = $('[data-slider-next]', s);
    prev && prev.addEventListener('click', function () { by(-1); });
    next && next.addEventListener('click', function () { by(1); });
  });

  /* ---------- Reading progress (blog details) ---------- */
  var article = $('[data-reading]'), rbar = $('[data-reading-bar]');
  if (article && rbar) window.addEventListener('scroll', function () {
    var r = article.getBoundingClientRect(), p = Math.min(Math.max(-r.top / (r.height - window.innerHeight), 0), 1);
    rbar.style.transform = 'scaleX(' + p + ')';
  }, { passive: true });

  /* ---------- Copy link ---------- */
  $$('[data-copy]').forEach(function (b) { b.addEventListener('click', function () { try { navigator.clipboard.writeText(b.dataset.copy || location.href); } catch (e) {} window.copixaToast('Link copied to clipboard'); }); });

  /* ---------- Year ---------- */
  $$('[data-year]').forEach(function (y) { y.textContent = new Date().getFullYear(); });

  /* =====================================================================
     FORMS — inline validation, typing rules, date/time rules
     ===================================================================== */
  var HOURS = { 1: [7, 20], 2: [7, 20], 3: [7, 20], 4: [7, 20], 5: [7, 20], 6: [8, 16] }; /* Mon–Fri 7–20, Sat 8–16, Sun closed */
  var isPhone = function (el) { return el.type === 'tel' || el.hasAttribute('data-phone'); };
  var isName = function (el) { return el.hasAttribute('data-name') || /^(name|given-name|family-name|cc-name)$/.test(el.getAttribute('autocomplete') || ''); };
  var NAME_RE = /[^\p{L}\p{M}\s'’.-]/gu;
  function cleanPhone(v) { var plus = /^\s*\+/.test(v); v = v.replace(/\D/g, '').slice(0, 15); return (plus ? '+' : '') + v; }
  function onlyDigits(v, max) { return v.replace(/\D/g, '').slice(0, max || 99); }
  function fmtCard(v) { return onlyDigits(v, 19).replace(/(\d{4})(?=\d)/g, '$1 '); }
  function fmtExpiry(v) { v = onlyDigits(v, 4); return v.length > 2 ? v.slice(0, 2) + '/' + v.slice(2) : v; }
  function luhn(n) { var s = 0, alt = false; for (var i = n.length - 1; i >= 0; i--) { var d = +n[i]; if (alt) { d *= 2; if (d > 9) d -= 9; } s += d; alt = !alt; } return n.length >= 13 && s % 10 === 0; }
  function todayISO() { var d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 10); }
  function sanitize(el) {
    var v = el.value, nv = v;
    if (isPhone(el)) nv = cleanPhone(v);
    else if (isName(el)) nv = v.replace(NAME_RE, '');
    else if (el.hasAttribute('data-digits')) nv = onlyDigits(v, +el.getAttribute('maxlength') || 99);
    else if (el.hasAttribute('data-card')) nv = fmtCard(v);
    else if (el.hasAttribute('data-expiry')) nv = fmtExpiry(v);
    if (nv !== v) { var pos = el.selectionStart - (v.length - nv.length); el.value = nv; try { el.setSelectionRange(pos, pos); } catch (e) {} }
  }
  function fieldMsg(el) {
    var v = (el.value || '').trim(), label = el.dataset.label || ((el.labels && el.labels[0]) ? el.labels[0].textContent.replace('*', '').trim() : 'This field');
    if (el.type === 'checkbox') return el.required && !el.checked ? (el.dataset.msg || 'Please tick this box to continue.') : '';
    if (el.required && !v) return label + ' is required.';
    if (!v) return '';
    if (el.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) return 'Enter a valid email address, e.g. name@company.com.';
    if (isPhone(el)) { var dg = v.replace(/\D/g, ''); if (dg.length < 9) return 'Enter a phone number with at least 9 digits.'; if (dg.length > 15) return 'Phone numbers can have at most 15 digits.'; }
    if (isName(el) && (/\d/.test(v) || v.replace(/[\s'’.-]/g, '').length < 2)) return 'Use letters only (at least 2).';
    if (el.hasAttribute('data-zip') && !/^\d{5}$/.test(v)) return 'Enter a 5-digit ZIP code.';
    if (el.hasAttribute('data-card') && !luhn(v.replace(/\s/g, ''))) return 'Enter a valid card number.';
    if (el.hasAttribute('data-expiry')) { var m = v.match(/^(\d{2})\/(\d{2})$/); if (!m || +m[1] < 1 || +m[1] > 12) return 'Use MM/YY.'; var now = new Date(), y = 2000 + +m[2]; if (y < now.getFullYear() || (y === now.getFullYear() && +m[1] < now.getMonth() + 1)) return 'This card has expired.'; }
    if (el.hasAttribute('data-cvc') && !/^\d{3,4}$/.test(v)) return 'Enter the 3 or 4-digit security code.';
    if (el.minLength > 0 && v.length < el.minLength) return label + ' needs at least ' + el.minLength + ' characters.';
    if (el.dataset.min && +v < +el.dataset.min) return 'Enter ' + el.dataset.min + ' or more.';
    if (el.dataset.max && +v > +el.dataset.max) return 'Enter ' + el.dataset.max + ' or less.';
    if (el.type === 'number') { if (el.min !== '' && +v < +el.min) return 'Enter ' + el.min + ' or more.'; if (el.max !== '' && +v > +el.max) return 'Enter ' + el.max + ' or less.'; }
    if (el.type === 'date') {
      if (v < todayISO()) return 'Choose today or a future date.';
      if (el.hasAttribute('data-open-days') && new Date(v + 'T12:00').getDay() === 0) return 'We are closed on Sundays. Please pick Monday to Saturday.';
    }
    if (el.type === 'time' && el.hasAttribute('data-open-hours')) {
      var dEl = el.form && el.form.querySelector('[data-open-days]'), day = dEl && dEl.value ? new Date(dEl.value + 'T12:00').getDay() : 1, h = HOURS[day] || HOURS[1];
      var hm = v.split(':'), mins = +hm[0] * 60 + +hm[1];
      if (mins < h[0] * 60 || mins > h[1] * 60 - 30) return 'Choose a time between ' + h[0] + ':00 and ' + (h[1] - 1) + ':30 (' + (day === 6 ? 'Saturday' : 'Mon–Fri') + ' opening hours).';
      if (dEl && dEl.value === todayISO()) { var n = new Date(); if (mins < n.getHours() * 60 + n.getMinutes()) return 'That time has already passed today.'; }
    }
    if (el.dataset.match) { var o = document.getElementById(el.dataset.match); if (o && o.value !== el.value) return 'Passwords do not match.'; }
    if (el.type === 'password' && el.minLength > 0 && v.length < el.minLength) return 'Use at least ' + el.minLength + ' characters.';
    return '';
  }
  var fieldSeq = 0;
  function showErr(el, msg) {
    if (!el.id) el.id = 'field-' + (++fieldSeq); /* stable id, so one message per field (never repeated) */
    var wrap = el.closest('[data-field]') || el.parentElement, id = el.id + '-err', box = document.getElementById(id);
    if (el.type === 'checkbox') wrap = el.closest('label').parentElement;
    if (msg) {
      if (!box) { box = document.createElement('p'); box.id = id; box.className = 'field-error'; box.setAttribute('aria-live', 'polite'); (el.type === 'checkbox' ? el.closest('label') : (el.closest('.cselect') || el.closest('.relative') || el)).insertAdjacentElement('afterend', box); }
      box.innerHTML = '<svg viewBox="0 0 24 24" class="mt-0.5 h-4 w-4 shrink-0" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg><span></span>';
      box.lastChild.textContent = msg; el.setAttribute('aria-invalid', 'true');
      var d = (el.getAttribute('aria-describedby') || '').split(' ').filter(Boolean); if (d.indexOf(id) < 0) d.push(id); el.setAttribute('aria-describedby', d.join(' '));
    } else { if (box) box.remove(); el.removeAttribute('aria-invalid'); }
  }
  window.copixaValidate = function (form) {
    var first = null;
    $$('input,select,textarea', form).forEach(function (el) {
      if (el.disabled || el.type === 'hidden' || el.closest('[hidden]')) return;
      var m = fieldMsg(el); showErr(el, m); if (m && !first) first = el;
    });
    if (first) { var tgt = first.closest('.cselect') ? $('.cselect-btn', first.closest('.cselect')) : first; tgt.focus({ preventScroll: true }); var y = tgt.getBoundingClientRect().top + window.scrollY - 140; if (Math.abs(y - window.scrollY) > 60 && !first.closest('.side-sheet')) scrollToY(y); return false; }
    return true;
  };
  $$('form').forEach(function (f) { if (f.hasAttribute('data-demo-form') || f.hasAttribute('data-validate')) f.setAttribute('novalidate', ''); });
  document.addEventListener('input', function (e) { var el = e.target; if (!el.matches || !el.matches('input,textarea')) return; sanitize(el); if (el.getAttribute('aria-invalid')) showErr(el, fieldMsg(el)); });
  document.addEventListener('change', function (e) { var el = e.target; if (el.matches && el.matches('input,select,textarea') && el.getAttribute('aria-invalid')) showErr(el, fieldMsg(el)); });
  document.addEventListener('focusout', function (e) { var el = e.target; if (el.matches && el.matches('input,textarea') && el.value) showErr(el, fieldMsg(el)); });
  document.addEventListener('keydown', function (e) { /* block letters in phone/digit fields as they are typed */
    var el = e.target; if (!el.matches || !el.matches('input') || e.ctrlKey || e.metaKey || e.altKey || e.key.length !== 1) return;
    if (isPhone(el) && !/[\d+]/.test(e.key)) e.preventDefault();
    else if ((el.hasAttribute('data-digits') || el.hasAttribute('data-card') || el.hasAttribute('data-expiry') || el.hasAttribute('data-cvc')) && !/\d/.test(e.key)) e.preventDefault();
    else if (isName(el) && /[\d@#$%^&*()_=+[\]{}<>\\/|;:"!?~`]/.test(e.key)) e.preventDefault();
  });
  $$('input[type=tel],[data-digits],[data-card],[data-expiry],[data-cvc]').forEach(function (el) { el.setAttribute('inputmode', 'numeric'); if (el.type === 'tel') el.setAttribute('inputmode', 'tel'); });
  $$('input[type=date]').forEach(function (el) { el.min = todayISO(); });
  $$('input').forEach(function (el) { if (el.value) sanitize(el); });

  /* =====================================================================
     CUSTOM SELECT — designed listbox with keyboard support (native <select> kept in sync)
     ===================================================================== */
  var uid = 0;
  function enhanceSelect(sel) {
    if (sel.dataset.enhanced || sel.multiple) return; sel.dataset.enhanced = '1'; uid++;
    var wrap = document.createElement('div'); wrap.className = 'cselect';
    var btn = document.createElement('button'); btn.type = 'button';
    btn.className = sel.className.replace('input', 'input cselect-btn'); btn.setAttribute('aria-haspopup', 'listbox'); btn.setAttribute('aria-expanded', 'false');
    var lab = sel.id && $('label[for="' + sel.id + '"]'); var lbId = 'cs-l-' + uid, list = document.createElement('ul');
    if (lab) { lab.id = lab.id || 'cs-lab-' + uid; btn.setAttribute('aria-labelledby', lab.id + ' cs-v-' + uid); lab.setAttribute('for', ''); lab.removeAttribute('for'); lab.addEventListener('click', function () { btn.focus(); }); }
    else btn.setAttribute('aria-label', sel.getAttribute('aria-label') || (sel.closest('label') ? sel.closest('label').textContent.trim() : 'Choose an option'));
    btn.innerHTML = '<span class="truncate" id="cs-v-' + uid + '"></span><svg class="cselect-chev h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>';
    list.className = 'cselect-list'; list.id = lbId; list.setAttribute('role', 'listbox'); list.tabIndex = -1; btn.setAttribute('aria-controls', lbId);
    if (lab) list.setAttribute('aria-labelledby', lab.id);
    sel.parentNode.insertBefore(wrap, sel); wrap.appendChild(sel); wrap.appendChild(btn); wrap.appendChild(list);
    sel.classList.add('sr-only'); sel.tabIndex = -1; sel.setAttribute('aria-hidden', 'true');
    var opts = [], fi = -1;
    function build() {
      list.innerHTML = ''; opts = [];
      $$('option', sel).forEach(function (o, i) {
        var li = document.createElement('li'); li.className = 'cselect-opt'; li.setAttribute('role', 'option'); li.id = lbId + '-' + i;
        li.innerHTML = '<span></span><svg class="cselect-tick h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>';
        li.firstChild.textContent = o.textContent;
        li.addEventListener('mousedown', function (e) { e.preventDefault(); });
        li.addEventListener('click', function () { choose(i); close(); btn.focus(); });
        li.addEventListener('mousemove', function () { focusOpt(i); });
        list.appendChild(li); opts.push(li);
      });
      sync();
    }
    function sync() { var i = sel.selectedIndex; $('#cs-v-' + uid.toString(), wrap); btn.firstChild.textContent = sel.options[i] ? sel.options[i].textContent : ''; opts.forEach(function (o, k) { o.setAttribute('aria-selected', k === i); }); }
    function focusOpt(i) { fi = Math.max(0, Math.min(i, opts.length - 1)); opts.forEach(function (o, k) { o.classList.toggle('is-focus', k === fi); }); btn.setAttribute('aria-activedescendant', opts[fi] ? opts[fi].id : ''); var o = opts[fi]; if (o) { var t = o.offsetTop, b = t + o.offsetHeight; if (t < list.scrollTop) list.scrollTop = t; else if (b > list.scrollTop + list.clientHeight) list.scrollTop = b - list.clientHeight; } }
    function choose(i) { if (sel.selectedIndex !== i) { sel.selectedIndex = i; sel.dispatchEvent(new Event('change', { bubbles: true })); } sync(); }
    /* the list is positioned against the viewport while open, so a card with overflow:hidden can never cut it off */
    function place() {
      var r = btn.getBoundingClientRect(), h = Math.min(list.scrollHeight, 288), up = window.innerHeight - r.bottom < h + 16 && r.top > h + 16;
      list.style.position = 'fixed'; list.style.left = r.left + 'px'; list.style.width = r.width + 'px'; list.style.right = 'auto'; list.style.bottom = 'auto';
      list.style.top = (up ? r.top - h - 6 : r.bottom + 6) + 'px'; list.style.zIndex = 200;
    }
    function open() { $$('.cselect.is-open').forEach(function (c) { if (c !== wrap) c.__close(); }); wrap.classList.add('is-open'); place(); btn.setAttribute('aria-expanded', 'true'); focusOpt(sel.selectedIndex); window.addEventListener('scroll', follow, { passive: true }); window.addEventListener('resize', close, { once: true }); }
    function follow() { if (!wrap.classList.contains('is-open')) return window.removeEventListener('scroll', follow); var r = btn.getBoundingClientRect(); if (r.bottom < 0 || r.top > window.innerHeight) close(); else place(); }
    function close() { if (!wrap.classList.contains('is-open')) return; wrap.classList.remove('is-open'); btn.setAttribute('aria-expanded', 'false'); btn.removeAttribute('aria-activedescendant'); }
    wrap.__close = close;
    btn.addEventListener('click', function () { wrap.classList.contains('is-open') ? close() : open(); });
    btn.addEventListener('keydown', function (e) {
      var isOpen = wrap.classList.contains('is-open');
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); if (!isOpen) open(); else focusOpt(fi + (e.key === 'ArrowDown' ? 1 : -1)); }
      else if (e.key === 'Home' && isOpen) { e.preventDefault(); focusOpt(0); }
      else if (e.key === 'End' && isOpen) { e.preventDefault(); focusOpt(opts.length - 1); }
      else if ((e.key === 'Enter' || e.key === ' ') && isOpen) { e.preventDefault(); choose(fi); close(); }
      else if (e.key === 'Escape' && isOpen) { e.preventDefault(); e.stopPropagation(); close(); }
      else if (e.key === 'Tab' && isOpen) { close(); }
      else if (e.key.length === 1 && /\S/.test(e.key)) { var k = e.key.toLowerCase(), start = isOpen ? fi + 1 : sel.selectedIndex + 1; for (var j = 0; j < opts.length; j++) { var idx = (start + j) % opts.length; if (opts[idx].textContent.trim().toLowerCase().indexOf(k) === 0) { if (isOpen) focusOpt(idx); else choose(idx); break; } } }
    });
    btn.addEventListener('blur', function () { setTimeout(function () { if (!wrap.contains(document.activeElement)) close(); }, 120); });
    sel.addEventListener('change', sync);
    new MutationObserver(build).observe(sel, { childList: true });
    build();
  }
  window.copixaEnhanceSelect = enhanceSelect;
  $$('select.input').forEach(enhanceSelect);
  document.addEventListener('click', function (e) { if (!e.target.closest('.cselect')) $$('.cselect.is-open').forEach(function (c) { c.__close(); }); });

  /* =====================================================================
     TABLES → labelled cards on phones (labels come from the header row)
     ===================================================================== */
  function labelTable(t) {
    var heads = $$('thead th', t).map(function (th) { return th.textContent.trim(); });
    $$('tbody tr', t).forEach(function (tr) { $$('td,th', tr).forEach(function (td, i) { if (!td.hasAttribute('data-label')) td.setAttribute('data-label', heads[i] || ''); }); });
  }
  window.copixaLabelTables = function () { $$('table.table-cards').forEach(labelTable); };
  window.copixaLabelTables();
  $$('table.table-cards tbody').forEach(function (tb) { new MutationObserver(function () { labelTable(tb.closest('table')); }).observe(tb, { childList: true }); });

  /* =====================================================================
     SCROLLSPY — in-page navs highlight the section in view
     ===================================================================== */
  $$('[data-scrollspy]').forEach(function (nav) {
    var links = $$('a[href^="#"]', nav), targets = links.map(function (a) { return document.getElementById(a.getAttribute('href').slice(1)); }).filter(Boolean);
    if (!targets.length || !('IntersectionObserver' in window)) return;
    var vis = {};
    var spy = new IntersectionObserver(function (en) {
      en.forEach(function (e) { vis[e.target.id] = e.isIntersecting; });
      var cur = targets.filter(function (t) { return vis[t.id]; })[0];
      if (cur) links.forEach(function (a) { var on = a.getAttribute('href') === '#' + cur.id; a.classList.toggle('is-active', on); if (on) a.setAttribute('aria-current', 'location'); else a.removeAttribute('aria-current'); });
    }, { rootMargin: '-110px 0px -55% 0px' });
    targets.forEach(function (t) { spy.observe(t); });
  });

  /* =====================================================================
     RENTAL CART + SAVED MACHINES (persist in localStorage)
     ===================================================================== */
  var CART_KEY = 'copixa-cart', WISH_KEY = 'copixa-wish';
  function readJSON(k, d) { try { return JSON.parse(store.get(k)) || d; } catch (e) { return d; } }
  var cart = readJSON(CART_KEY, {}), wish = readJSON(WISH_KEY, []);
  Object.keys(cart).forEach(function (k) { if (!MACHINES[k] || !(cart[k] > 0)) delete cart[k]; });
  wish = wish.filter(function (k) { return MACHINES[k]; });
  var money = function (n) { return '$' + n.toLocaleString('en-US'); };
  function cartCount() { return Object.keys(cart).reduce(function (a, k) { return a + cart[k]; }, 0); }
  function cartTotal() { return Object.keys(cart).reduce(function (a, k) { return a + cart[k] * MACHINES[k].price; }, 0); }
  window.copixaCart = { get: function () { return cart; }, total: cartTotal, clear: function () { cart = {}; save(); }, money: money };
  function save() { store.set(CART_KEY, JSON.stringify(cart)); store.set(WISH_KEY, JSON.stringify(wish)); render(); }
  function esc(t) { var d = document.createElement('div'); d.textContent = t; return d.innerHTML; }
  function lineHTML(k, mode) {
    var m = MACHINES[k], q = cart[k] || 1;
    var ctrl = mode === 'cart'
      ? '<div class="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-ink-100 pt-3 dark:border-white/10"><div class="qty" role="group" aria-label="Quantity for ' + esc(m.name) + '"><button type="button" data-qty="-1" data-k="' + k + '" aria-label="Decrease quantity"><svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M5 12h14"/></svg></button><output aria-live="polite">' + q + '</output><button type="button" data-qty="1" data-k="' + k + '" aria-label="Increase quantity"><svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg></button></div><button type="button" class="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-bold text-rose-700 hover:bg-rose-50 dark:text-rose-300 dark:hover:bg-rose-500/10" data-remove-cart="' + k + '">Remove</button></div>'
      : '<div class="mt-4 flex flex-wrap items-center gap-2 border-t border-ink-100 pt-3 dark:border-white/10"><button type="button" class="btn btn-primary btn-sm" data-move-cart="' + k + '">Move to cart</button><button type="button" class="btn btn-ghost btn-sm" data-wish-remove="' + k + '">Remove</button></div>';
    /* stacked layout: photo + name/type/price on top, controls on their own full-width row,
       so nothing is squeezed or pushed past the card edge on narrow phones */
    return '<li class="rounded-2xl border border-ink-200/70 p-4 dark:border-white/10"><div class="flex gap-3 sm:gap-4"><a href="product.html?m=' + k + '" class="product-media block h-16 w-16 shrink-0 overflow-hidden rounded-xl sm:h-20 sm:w-24" tabindex="-1" aria-hidden="true"><img src="' + m.thumb + '" alt="" class="h-full w-full object-cover"></a><div class="min-w-0 flex-1"><a href="product.html?m=' + k + '" class="block font-bold leading-snug text-ink-900 hover:text-brand-700 dark:text-white">' + esc(m.name) + '</a><p class="mt-0.5 text-xs leading-snug text-ink-600 dark:text-ink-300">' + esc(m.type) + '</p><p class="mt-1.5 font-display font-extrabold text-ink-900 dark:text-white">' + money(m.price * (mode === 'cart' ? q : 1)) + '<span class="text-xs font-semibold text-ink-600 dark:text-ink-300">/mo</span></p></div></div>' + ctrl + '</li>';
  }
  function render() {
    var n = cartCount();
    $$('[data-cart-count]').forEach(function (b) { b.textContent = n > 99 ? '99+' : n; b.hidden = !n; });
    $$('[data-wish-count]').forEach(function (b) { b.textContent = wish.length; b.hidden = !wish.length; });
    $$('[data-cart-lines]').forEach(function (b) { b.textContent = n; });
    $$('[data-wish-lines]').forEach(function (b) { b.textContent = wish.length; });
    var cl = $('[data-cart-list]'); if (cl) cl.innerHTML = Object.keys(cart).map(function (k) { return lineHTML(k, 'cart'); }).join('');
    var wl = $('[data-wish-list]'); if (wl) wl.innerHTML = wish.map(function (k) { return lineHTML(k, 'wish'); }).join('');
    $$('[data-cart-empty]').forEach(function (e) { e.hidden = n > 0; }); $$('[data-cart-footer]').forEach(function (e) { e.hidden = !n; });
    $$('[data-wish-empty]').forEach(function (e) { e.hidden = wish.length > 0; });
    $$('[data-cart-subtotal]').forEach(function (e) { e.textContent = money(cartTotal()); });
    $$('[data-wish]').forEach(function (b) { var on = wish.indexOf(b.dataset.wish) > -1, nm = MACHINES[b.dataset.wish] ? MACHINES[b.dataset.wish].name : ''; b.setAttribute('aria-pressed', on); b.setAttribute('aria-label', (on ? 'Remove ' : 'Save ') + nm + (on ? ' from saved machines' : '')); });
    $$('[data-add-cart]').forEach(function (b) { var k = b.dataset.addCart; if (!k) return; b.classList.toggle('in-cart', !!cart[k]); });
    document.dispatchEvent(new CustomEvent('cartchange'));
  }
  window.copixaRefreshCart = render;
  function addToCart(k, q) { if (!MACHINES[k]) return; cart[k] = Math.min((cart[k] || 0) + (q || 1), 20); save(); window.copixaToast(MACHINES[k].name + ' added to your rental cart'); }
  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-add-cart],[data-wish],[data-qty],[data-remove-cart],[data-move-cart],[data-wish-remove]'); if (!t) return;
    e.preventDefault(); e.stopPropagation();
    if (t.dataset.addCart !== undefined) { var qEl = t.dataset.qtyFrom && document.getElementById(t.dataset.qtyFrom); addToCart(t.dataset.addCart, qEl ? +qEl.value || 1 : 1); if (t.hasAttribute('data-open-cart') || t.closest('#quick-view')) openSheet('cart-sheet'); }
    else if (t.dataset.wish) { var k = t.dataset.wish, i = wish.indexOf(k); if (i > -1) { wish.splice(i, 1); window.copixaToast(MACHINES[k].name + ' removed from saved machines'); } else { wish.push(k); window.copixaToast(MACHINES[k].name + ' saved'); } save(); }
    else if (t.dataset.qty) { var kk = t.dataset.k; cart[kk] = Math.max(1, Math.min((cart[kk] || 1) + +t.dataset.qty, 20)); save(); var o = $('[data-k="' + kk + '"]', $('[data-cart-list]')); o && o.parentElement.querySelector('button[data-qty="' + t.dataset.qty + '"]').focus(); }
    else if (t.dataset.removeCart) { var nm = MACHINES[t.dataset.removeCart].name; delete cart[t.dataset.removeCart]; save(); window.copixaToast(nm + ' removed from your cart'); var f = $('#cart-sheet [data-sheet-close]'); f && f.focus(); }
    else if (t.dataset.moveCart) { var mk = t.dataset.moveCart; wish = wish.filter(function (x) { return x !== mk; }); cart[mk] = (cart[mk] || 0) + 1; save(); window.copixaToast(MACHINES[mk].name + ' moved to your cart'); }
    else if (t.dataset.wishRemove) { var wk = t.dataset.wishRemove; wish = wish.filter(function (x) { return x !== wk; }); save(); var f2 = $('#wishlist-sheet [data-sheet-close]'); f2 && f2.focus(); }
  }, true);
  window.addEventListener('storage', function (e) { if (e.key === CART_KEY || e.key === WISH_KEY) { cart = readJSON(CART_KEY, {}); wish = readJSON(WISH_KEY, []); render(); } });
  render();

  /* ---------- Product details page (product.html?m=slug) ---------- */
  (function () {
    var page = $('[data-product-page]'); if (!page) return;
    var slug = params.get('m'); if (!MACHINES[slug]) slug = page.dataset.default;
    var d = MACHINES[slug];
    var set = function (sel, v) { $$(sel, page).forEach(function (e) { e.textContent = v; }); };
    set('[data-p-name]', d.name); set('[data-p-type]', d.type); set('[data-p-price]', money(d.price)); set('[data-p-desc]', d.desc); set('[data-p-ppm]', d.ppm); set('[data-p-paper]', d.paper);
    var hero = $('#page-title'); if (hero) hero.textContent = d.name; set('[data-hero-crumb]', d.name); set('[data-hero-sub]', d.type + ' from ' + money(d.price) + ' a month, with service and toner included.');
    var im = $('[data-p-img]', page); im.src = d.img; im.alt = d.name + ', ' + d.type;
    var tag = $('[data-p-tag]', page); if (tag) { tag.textContent = d.tag; tag.hidden = !d.tag; }
    $('[data-p-feats]', page).innerHTML = d.feat.map(function (f) { return '<li class="flex items-center gap-3"><span class="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"><svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span>' + esc(f) + '</li>'; }).join('');
    $('[data-p-specs]', page).innerHTML = d.specs.map(function (r) { return '<div class="grid gap-1 border-b border-ink-200/70 py-4 last:border-0 sm:grid-cols-[200px_1fr] dark:border-white/10"><dt class="font-semibold text-ink-600 dark:text-ink-300">' + esc(r[0]) + '</dt><dd class="font-bold text-ink-900 dark:text-white">' + esc(r[1]) + '</dd></div>'; }).join('');
    $$('[data-add-cart]', page).forEach(function (b) { b.dataset.addCart = slug; });
    $$('[data-wish]', page).forEach(function (b) { b.dataset.wish = slug; });
    var q = $('[data-p-quote]', page); if (q) q.href = 'contact.html?machine=' + encodeURIComponent(d.name);
    document.title = d.name + ' — ' + d.type + ' Rental | Copixa';
    $$('[data-rel-machine]').forEach(function (c) { if (c.dataset.relMachine === slug) c.remove(); });
    $$('[data-rel-machine]').forEach(function (c, i) { if (i > 3) c.remove(); });
    var qty = $('#p-qty'); $$('[data-pqty]', page).forEach(function (b) { b.addEventListener('click', function () { qty.value = Math.max(1, Math.min(20, (+qty.value || 1) + +b.dataset.pqty)); }); });
    render();
  })();

  /* ---------- Generic ARIA tabs (product page) ---------- */
  $$('[role=tablist][data-aria-tabs]').forEach(function (list) {
    var tabs = $$('[role=tab]', list);
    function sel(t, focus) { tabs.forEach(function (x) { var on = x === t; x.setAttribute('aria-selected', on); x.tabIndex = on ? 0 : -1; document.getElementById(x.getAttribute('aria-controls')).hidden = !on; }); if (focus) t.focus(); }
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { sel(t); });
      t.addEventListener('keydown', function (e) { var d = { ArrowRight: 1, ArrowLeft: -1 }[e.key]; if (root.dir === 'rtl' && d) d = -d; if (d) { e.preventDefault(); sel(tabs[(i + d + tabs.length) % tabs.length], true); } if (e.key === 'Home') { e.preventDefault(); sel(tabs[0], true); } if (e.key === 'End') { e.preventDefault(); sel(tabs[tabs.length - 1], true); } });
    });
    sel(tabs[0]);
  });

  $$('[data-goto-review]').forEach(function (l) { l.addEventListener('click', function (e) { e.preventDefault(); var t = $('#tab-reviews-btn'); if (!t) return; t.click(); scrollToY(t.getBoundingClientRect().top + window.scrollY - 120); setTimeout(function () { t.focus({ preventScroll: true }); }, 500); }); });

  /* ---------- Checkout (checkout.html) ---------- */
  (function () {
    var co = $('[data-checkout]'); if (!co) return;
    var steps = $$('[data-step]', co), marks = $$('[data-step-mark]'), cur = 0;
    function summary() {
      var keys = Object.keys(cart), list = $('[data-co-lines]');
      list.innerHTML = keys.map(function (k) { var m = MACHINES[k]; return '<li class="flex items-center gap-3"><span class="product-media relative block h-14 w-16 shrink-0 overflow-hidden rounded-xl"><img src="' + m.thumb + '" alt="" class="h-full w-full object-cover"></span><span class="min-w-0 flex-1"><span class="block truncate text-sm font-bold text-ink-900 dark:text-white">' + esc(m.name) + '</span><span class="text-xs text-ink-600 dark:text-ink-300">Qty ' + cart[k] + ' · ' + money(m.price) + '/mo each</span></span><span class="text-sm font-extrabold text-ink-900 dark:text-white">' + money(m.price * cart[k]) + '</span></li>'; }).join('');
      $$('[data-co-sub]').forEach(function (e) { e.textContent = money(cartTotal()); });
      var tax = Math.round(cartTotal() * 0.0863 * 100) / 100;
      $$('[data-co-tax]').forEach(function (e) { e.textContent = '$' + tax.toFixed(2); });
      $$('[data-co-total]').forEach(function (e) { e.textContent = '$' + (cartTotal() + tax).toFixed(2); });
      var empty = !keys.length; $('[data-co-empty]').hidden = !empty; co.hidden = empty; $('[data-co-summary]').hidden = empty;
    }
    function go(i) {
      cur = i; steps.forEach(function (s, k) { s.hidden = k !== i; });
      marks.forEach(function (m, k) { m.classList.toggle('is-current', k === i); m.classList.toggle('is-done', k < i); if (k === i) m.setAttribute('aria-current', 'step'); else m.removeAttribute('aria-current'); });
      var h = $('h2', steps[i]); if (h) { h.tabIndex = -1; h.focus({ preventScroll: true }); }
      var top = co.getBoundingClientRect().top + window.scrollY - 120; if (top < window.scrollY) scrollToY(top);
    }
    $$('[data-next]', co).forEach(function (b) { b.addEventListener('click', function () { if (window.copixaValidate(steps[cur])) go(cur + 1); }); });
    $$('[data-prev]', co).forEach(function (b) { b.addEventListener('click', function () { go(cur - 1); }); });
    $$('input[name=pay]', co).forEach(function (r) { r.addEventListener('change', function () { var card = $('input[name=pay]:checked', co).value === 'card'; $('[data-card-fields]', co).hidden = !card; }); });
    co.addEventListener('submit', function (e) {
      e.preventDefault(); if (!window.copixaValidate(steps[cur])) return;
      var btn = $('[type=submit]', co); btn.disabled = true;
      setTimeout(function () {
        btn.disabled = false;
        var no = 'CPX-' + Math.floor(100000 + Math.random() * 900000), total = $('[data-co-total]').textContent;
        cart = {}; save(); co.reset(); $$('select', co).forEach(function (x) { x.dispatchEvent(new Event('change')); }); go(0); summary();
        window.copixaSuccess('Order placed', 'Order ' + no + ' is confirmed (' + total + ' per month). We have emailed your contract and will call to confirm the delivery slot. Your cart is now empty.');
      }, 900);
    });
    document.addEventListener('cartchange', summary);
    summary(); go(0);
  })();

  /* ---------- Register: join a plan (plans never go into the cart) ---------- */
  (function () {
    var box = $('[data-plan-box]'); if (!box) return;
    var plans = JSON.parse(box.dataset.planBox), p = params.get('plan'), sel = $('#r-plan');
    function show(name) { var d = plans[name]; if (!d) { box.hidden = true; return; } box.hidden = false; set(d, name); }
    function set(d, name) { $('[data-plan-name]', box).textContent = name; $('[data-plan-price]', box).textContent = '$' + d.m; $('[data-plan-desc]', box).textContent = d.desc; }
    if (sel) { if (p && plans[p]) { sel.value = p; sel.dispatchEvent(new Event('change')); } sel.addEventListener('change', function () { show(sel.value); }); show(sel.value); }
  })();

  setupHscroll();
  if ('ResizeObserver' in window) { var roT; new ResizeObserver(function () { clearTimeout(roT); roT = setTimeout(setupHscroll, 120); }).observe(document.body); }
  onScroll();
})();
