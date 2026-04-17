(() => {
  'use strict';

  // ── Nav scroll ──
  const nav = document.querySelector('.nav');
  const onScroll = () => nav.classList.toggle('scrolled', scrollY > 50);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // ── Mobile menu ──
  const toggle = document.querySelector('.nav-toggle');
  const links = document.querySelector('.nav-mobile');
  toggle.addEventListener('click', () => {
    const open = links.classList.toggle('open');
    toggle.setAttribute('aria-expanded', open);
    toggle.querySelectorAll('span').forEach((s, i) => {
      if (open) {
        s.style.transform = i === 0 ? 'rotate(45deg) translate(5px,5px)' : i === 2 ? 'rotate(-45deg) translate(5px,-5px)' : '';
        if (i === 1) s.style.opacity = '0';
      } else { s.style.transform = ''; s.style.opacity = ''; }
    });
  });
  links.querySelectorAll('a').forEach(a =>
    a.addEventListener('click', () => {
      links.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.querySelectorAll('span').forEach(s => { s.style.transform = ''; s.style.opacity = ''; });
    })
  );

  // ── Scroll reveal with stagger ──
  // Auto-assign stagger classes to grid children
  document.querySelectorAll('.services-grid, .why-grid, .hero-stats, .about-tags, .hero-cta').forEach(grid => {
    grid.querySelectorAll('.reveal').forEach((el, i) => {
      el.classList.add('stagger-' + Math.min(i + 1, 6));
    });
  });
  // Stagger tags individually
  document.querySelectorAll('.about-tags .tag').forEach((tag, i) => {
    tag.classList.add('reveal', 'stagger-' + Math.min(i + 1, 6));
  });

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });
  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

  // ── Counter animation ──
  const counterObs = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target, target = +el.dataset.count, start = performance.now();
      const tick = now => {
        const p = Math.min((now - start) / 1500, 1);
        el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      counterObs.unobserve(el);
    });
  }, { threshold: 0.5 });
  document.querySelectorAll('.stat-number').forEach(el => counterObs.observe(el));

  // ── Smooth scroll ──
  document.querySelectorAll('a[href^="#"]').forEach(a =>
    a.addEventListener('click', e => {
      const t = document.querySelector(a.getAttribute('href'));
      if (t) { e.preventDefault(); t.scrollIntoView({ behavior: 'smooth' }); }
    })
  );

  // ── Clay tilt toward cursor ──
  document.querySelectorAll('[data-tilt]').forEach(card => {
    card.addEventListener('mousemove', e => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      card.style.transition = 'transform 0.25s ease-out';
      card.style.transform = `perspective(500px) rotateY(${x * 12}deg) rotateX(${-y * 12}deg) translateY(-6px) scale(1.01)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transition = 'transform 0.3s ease';
      card.style.transform = '';
    });
  });

  // ── Theme toggle ──
  const themeBtn = document.querySelector('.theme-toggle');
  const themes = ['pink', 'blue', 'dark', 'dark-blue'];
  const icons = { pink: '💎', blue: '🌙', dark: '🔷', 'dark-blue': '🌸' };
  const classes = { pink: '', blue: 'theme-blue', dark: 'theme-dark', 'dark-blue': 'theme-dark-blue' };
  let currentTheme = localStorage.getItem('theme') || 'dark-blue';
  const applyTheme = t => {
    document.body.classList.remove('theme-blue', 'theme-dark', 'theme-dark-blue');
    if (classes[t]) document.body.classList.add(classes[t]);
    themeBtn.textContent = icons[t];
  };
  applyTheme(currentTheme);
  themeBtn.addEventListener('click', () => {
    currentTheme = themes[(themes.indexOf(currentTheme) + 1) % themes.length];
    localStorage.setItem('theme', currentTheme);
    applyTheme(currentTheme);
  });

  // ── Init Lucide icons ──
  lucide.createIcons();

  // ── Testimonial carousel ──
  const cards = document.querySelectorAll('.testimonial-card');
  const dots = document.querySelectorAll('.dot');
  let current = 0;
  const goTo = (i, dir) => {
    if (i === current) return;
    const outClass = dir === 'prev' ? 'slide-in-right' : 'slide-out-left';
    const inClass = dir === 'prev' ? 'slide-out-left' : 'slide-in-right';
    cards[current].classList.add(outClass);
    cards[current].classList.remove('active');
    dots[current].classList.remove('active');
    cards[i].classList.remove('slide-out-left', 'slide-in-right');
    // force reflow
    void cards[i].offsetWidth;
    cards[i].classList.add(inClass);
    void cards[i].offsetWidth;
    cards[i].classList.remove(inClass);
    cards[i].classList.add('active');
    dots[i].classList.add('active');
    setTimeout(() => cards[current === i ? current : current].classList.remove(outClass), 500);
    current = i;
  };
  dots.forEach((dot, i) => dot.addEventListener('click', () => goTo(i, i > current ? 'next' : 'prev')));
  document.querySelector('.carousel-prev').addEventListener('click', () => goTo((current - 1 + cards.length) % cards.length, 'prev'));
  document.querySelector('.carousel-next').addEventListener('click', () => goTo((current + 1) % cards.length, 'next'));
  setInterval(() => goTo((current + 1) % cards.length, 'next'), 5000);

  // ── Contact form ──
  document.getElementById('contactForm').addEventListener('submit', e => {
    e.preventDefault();
    const form = e.target;
    const btn = form.querySelector('button');
    btn.textContent = 'Sending...';
    btn.disabled = true;
    fetch(form.action, {
      method: 'POST',
      body: new FormData(form),
      headers: { 'Accept': 'application/json' }
    }).then(r => {
      if (r.ok) {
        btn.textContent = 'Sent! ✓';
        form.reset();
        setTimeout(() => { btn.innerHTML = 'Send Message <i data-lucide="send" class="icon-inline"></i>'; btn.disabled = false; lucide.createIcons(); }, 3000);
      } else {
        btn.textContent = 'Error, try again';
        btn.disabled = false;
      }
    }).catch(() => {
      btn.textContent = 'Error, try again';
      btn.disabled = false;
    });
  });

  // ── Magnetic buttons ──
  document.querySelectorAll('[data-magnetic]').forEach(btn => {
    btn.addEventListener('mousemove', e => {
      const r = btn.getBoundingClientRect();
      const x = e.clientX - r.left - r.width / 2;
      const y = e.clientY - r.top - r.height / 2;
      btn.style.transform = `translate(${x * 0.3}px, ${y * 0.3}px)`;
    });
    btn.addEventListener('mouseleave', () => { btn.style.transform = ''; });
  });

  // ── Parallax scroll on blobs ──
  const blobs = document.querySelectorAll('.blob');
  if (blobs.length) {
    window.addEventListener('scroll', () => {
      const s = scrollY;
      blobs[0].style.transform = `translateY(${s * 0.08}px)`;
      blobs[1].style.transform = `translateY(${s * -0.05}px)`;
      blobs[2].style.transform = `translateY(${s * 0.06}px)`;
    }, { passive: true });
  }

  // ── Click ripple on clay cards ──
  document.querySelectorAll('.clay').forEach(card => {
    card.addEventListener('click', e => {
      const r = card.getBoundingClientRect();
      const ripple = document.createElement('span');
      ripple.className = 'ripple';
      const size = Math.max(r.width, r.height);
      ripple.style.width = ripple.style.height = size + 'px';
      ripple.style.left = (e.clientX - r.left - size / 2) + 'px';
      ripple.style.top = (e.clientY - r.top - size / 2) + 'px';
      card.appendChild(ripple);
      ripple.addEventListener('animationend', () => ripple.remove());
    });
  });

  // ── Back to top + Floating CTA ──
  const btt = document.querySelector('.back-to-top');
  const fcta = document.querySelector('.floating-cta');
  const contactSection = document.getElementById('contact');
  window.addEventListener('scroll', () => {
    if (btt) btt.classList.toggle('visible', scrollY > 500);
    if (fcta && contactSection) {
      const contactTop = contactSection.getBoundingClientRect().top;
      fcta.classList.toggle('visible', scrollY > 300 && contactTop > window.innerHeight * 0.5);
    }
  }, { passive: true });
  if (btt) btt.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
})();
