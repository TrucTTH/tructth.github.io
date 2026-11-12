(() => {
  'use strict';

  const root = document.documentElement;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const DARK_QUERY = window.matchMedia('(prefers-color-scheme: dark)');

  if (window.lucide) window.lucide.createIcons();

  // ── Header shadow on scroll ──
  const header = document.querySelector('.site-header');
  const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 8);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // ── Mobile menu ──
  const toggle = document.querySelector('.nav-toggle');
  const links = document.getElementById('nav-links');
  if (toggle && links) {
  const setMenu = open => {
    links.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  };
  toggle.addEventListener('click', () => setMenu(!links.classList.contains('open')));
  links.addEventListener('click', e => { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && links.classList.contains('open')) { setMenu(false); toggle.focus(); }
  });
  }

  // ── Theme toggle (light / dark), stored per visitor ──
  const themeBtn = document.querySelector('.theme-toggle');
  const isDark = () => {
    const t = root.getAttribute('data-theme');
    return t ? t === 'dark' : DARK_QUERY.matches;
  };
  const syncThemeLabel = () => themeBtn.setAttribute('aria-pressed', String(isDark()));
  syncThemeLabel();
  themeBtn.addEventListener('click', () => {
    const next = isDark() ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    try { localStorage.setItem('tt-theme', next); } catch (e) { /* storage blocked: theme lasts this visit only */ }
    syncThemeLabel();
  });
  DARK_QUERY.addEventListener('change', syncThemeLabel);

  // ── Counting stats (HTML holds the final value, so no-JS shows real numbers) ──
  const COUNT_MS = 1400;
  if (!reduceMotion && 'IntersectionObserver' in window) {
    const counters = document.querySelectorAll('[data-count]');
    const co = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const target = Number(el.dataset.count);
        const start = performance.now();
        const tick = now => {
          const p = Math.min((now - start) / COUNT_MS, 1);
          el.textContent = String(Math.round(target * (1 - Math.pow(1 - p, 3))));
          if (p < 1) requestAnimationFrame(tick);
        };
        el.textContent = '0';
        requestAnimationFrame(tick);
        co.unobserve(el);
      });
    }, { threshold: 0.6 });
    counters.forEach(el => co.observe(el));
  }

  // ── About diagram: click an area (node or button) to see that work ──
  const picker = document.querySelector('.area-picker');
  const dg = document.querySelector('[data-area-diagram]');
  if (picker) {
    const panel = document.getElementById('area-panel');
    const btns = [...picker.querySelectorAll('.area-btn')];
    let current = btns.find(b => b.getAttribute('aria-pressed') === 'true') || btns[0];
    const markNode = () => {
      if (!dg) return;
      dg.querySelectorAll('.dg-node[data-id]').forEach(n => n.classList.toggle('is-picked', n.dataset.id === current.dataset.area));
    };
    const show = btn => {
      current = btn;
      btns.forEach(b => b.setAttribute('aria-pressed', String(b === btn)));
      // The panel reads the matching service card, so the copy lives in one place.
      const card = document.getElementById(btn.dataset.target);
      if (!card) return;
      panel.querySelector('.area-title').textContent = card.querySelector('h3').textContent;
      panel.querySelector('.area-text').textContent = card.querySelector(':scope > p').textContent;
      panel.querySelector('.area-ticks').replaceChildren(...[...card.querySelectorAll('.ticks li')].map(li => li.cloneNode(true)));
      panel.querySelector('.area-more').setAttribute('href', '#' + btn.dataset.target);
      panel.querySelector('.area-ask').dataset.service = btn.dataset.form;
      markNode();
    };
    picker.addEventListener('click', e => { const b = e.target.closest('.area-btn'); if (b) show(b); });
    if (dg) {
      dg.addEventListener('click', e => {
        const node = e.target.closest('.dg-node[data-id]');
        const b = node && btns.find(x => x.dataset.area === node.dataset.id);
        if (b) show(b);
      });
      // The diagram redraws its nodes on resize; keep the picked one marked.
      new MutationObserver(markNode).observe(dg, { childList: true });
      markNode();
    }
  }

  // ── Contact form (Formspree) ──
  const form = document.getElementById('contactForm');
  if (form) {
  // "Book a consulting call" preselects that option and moves focus to the form.
  const pickService = value => {
    form.elements.service.value = value;
    form.elements.name.focus({ preventScroll: true });
    form.scrollIntoView({ block: 'center' });
  };
  // Links read data-service at click time (the area panel changes it).
  document.addEventListener('click', e => {
    const link = e.target.closest('a[data-service]');
    if (!link) return;
    e.preventDefault();
    pickService(link.dataset.service);
  });
  // A case page links here as ?service=<value>#contact.
  const wanted = new URLSearchParams(location.search).get('service');
  if (wanted && [...form.elements.service.options].some(o => o.value === wanted)) form.elements.service.value = wanted;
  const status = form.querySelector('.form-status');
  const submitBtn = form.querySelector('button[type="submit"]');
  const submitHTML = submitBtn.innerHTML;
  const setStatus = (msg, kind) => {
    status.textContent = msg;
    status.className = 'form-status' + (kind ? ' ' + kind : '');
  };
  form.addEventListener('submit', async e => {
    e.preventDefault();
    setStatus('', '');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending…';
    try {
      const res = await fetch(form.action, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } });
      if (res.ok) {
        form.reset();
        if (window.grecaptcha) window.grecaptcha.reset();
        setStatus('Thanks! Your message is on its way. I usually reply within one business day.', 'ok');
      } else {
        const data = await res.json().catch(() => ({}));
        const detail = data.errors && data.errors.length ? data.errors.map(x => x.message).join(' ') : '';
        setStatus((detail || 'Your message didn’t send.') + ' Please tick the captcha and try again.', 'err');
      }
    } catch (err) {
      setStatus('Couldn’t reach the server. Check your connection and try again.', 'err');
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = submitHTML;
    }
  });
  }
})();
