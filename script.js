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

  // ── Contact form (Formspree) ──
  const form = document.getElementById('contactForm');
  // "Book a consulting call" preselects that option and moves focus to the form.
  document.querySelectorAll('[data-service]').forEach(link => link.addEventListener('click', e => {
    e.preventDefault();
    form.elements.service.value = link.dataset.service;
    form.elements.name.focus({ preventScroll: true });
    form.scrollIntoView({ block: 'center' });
  }));
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
})();
