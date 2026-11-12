(() => {
  const doc = document.documentElement;
  doc.classList.add('js');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Header shadow + mobile sticky CTA */
  const header = document.querySelector('.header');
  const sticky = document.querySelector('.sticky-cta');
  const onScroll = () => {
    const y = window.scrollY;
    header.classList.toggle('is-scrolled', y > 8);
    if (sticky) sticky.classList.toggle('is-visible', y > 600);
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* Mobile menu */
  const menuBtn = document.querySelector('.menu-btn');
  const nav = document.getElementById('nav');
  const setMenu = (open) => {
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    nav.classList.toggle('is-open', open);
  };
  menuBtn.addEventListener('click', () => setMenu(menuBtn.getAttribute('aria-expanded') !== 'true'));
  nav.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && nav.classList.contains('is-open')) { setMenu(false); menuBtn.focus(); }
  });

  /* Read more toggles */
  document.querySelectorAll('[data-toggle]').forEach((btn) => {
    const target = document.getElementById(btn.dataset.toggle);
    btn.addEventListener('click', () => {
      const open = target.hidden;
      target.hidden = !open;
      btn.setAttribute('aria-expanded', String(open));
      btn.textContent = open ? 'Read less' : 'Read more';
    });
  });

  /* Program tabs (WAI-ARIA tabs pattern) */
  const tabs = [...document.querySelectorAll('[role="tab"]')];
  const select = (tab, focus) => {
    tabs.forEach((t) => {
      const on = t === tab;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
    });
    if (focus) tab.focus();
  };
  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => select(tab));
    tab.addEventListener('keydown', (e) => {
      let n = null;
      if (e.key === 'ArrowRight') n = (i + 1) % tabs.length;
      if (e.key === 'ArrowLeft') n = (i - 1 + tabs.length) % tabs.length;
      if (e.key === 'Home') n = 0;
      if (e.key === 'End') n = tabs.length - 1;
      if (n !== null) { e.preventDefault(); select(tabs[n], true); }
    });
  });

  /* Program buttons pre-fill the inquiry form */
  const programSelect = document.getElementById('programSelect');
  document.querySelectorAll('[data-program]').forEach((a) => {
    a.addEventListener('click', () => { programSelect.value = a.dataset.program; });
  });

  /* Forms: validate, then open a pre-filled email to the center.
     (Swap this for a form service / CRM endpoint when one is set up.) */
  const TO = 'kinderacademylaveen@outlook.com';
  document.querySelectorAll('form[data-subject]').forEach((form) => {
    const note = form.querySelector('.form__note');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const bads = [];
      form.querySelectorAll('input, select, textarea').forEach((el) => {
        const bad = !el.checkValidity();
        el.classList.toggle('is-invalid', bad);
        el.setAttribute('aria-invalid', String(bad));
        if (bad) bads.push(el);
      });
      if (bads.length) {
        const names = bads.map((el) => el.closest('label').firstChild.textContent.trim());
        note.className = 'form__note err';
        note.textContent = `Please complete: ${names.join(', ')}.`;
        bads[0].focus();
        return;
      }
      const lines = [...new FormData(form)]
        .filter(([, v]) => String(v).trim())
        .map(([k, v]) => `${k}: ${v}`);
      const body = `Hello Kinder Academy,\n\n${lines.join('\n')}\n\nThank you!`;
      window.location.href = `mailto:${TO}?subject=${encodeURIComponent(form.dataset.subject)}&body=${encodeURIComponent(body)}`;
      note.className = 'form__note ok';
      note.textContent = 'Thanks! Your email app is opening with your details. Just press send, or call us at 623.755.2420.';
    });
    form.addEventListener('input', (e) => {
      if (e.target.classList.contains('is-invalid') && e.target.checkValidity()) {
        e.target.classList.remove('is-invalid');
        e.target.setAttribute('aria-invalid', 'false');
      }
    });
  });

  /* Pause hero video for reduced-motion users */
  const video = document.querySelector('.blob video');
  const vBtn = document.querySelector('.video-toggle');
  const syncBtn = () => {
    const paused = video.paused;
    vBtn.setAttribute('aria-pressed', String(paused));
    vBtn.setAttribute('aria-label', paused ? 'Play video' : 'Pause video');
  };
  if (video && vBtn) {
    if (reduceMotion) { video.removeAttribute('autoplay'); video.pause(); }
    vBtn.addEventListener('click', () => { video.paused ? video.play() : video.pause(); });
    video.addEventListener('play', syncBtn);
    video.addEventListener('pause', syncBtn);
    syncBtn();
  }

  /* Reveal on scroll */
  const items = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const siblings = [...el.parentElement.children].filter((c) => c.classList.contains('reveal'));
        const idx = Math.max(0, siblings.indexOf(el));
        el.style.transitionDelay = reduceMotion ? '0ms' : `${Math.min(idx, 6) * 60}ms`;
        el.classList.add('is-in');
        io.unobserve(el);
      });
    }, { rootMargin: '0px 0px -60px 0px', threshold: 0.08 });
    items.forEach((el) => io.observe(el));
  } else {
    items.forEach((el) => el.classList.add('is-in'));
  }

  /* Reviews carousel arrows */
  const track = document.querySelector('.reviews__track');
  document.querySelectorAll('[data-scroll]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const card = track.querySelector('.review');
      const step = card ? card.getBoundingClientRect().width + 24 : track.clientWidth;
      track.scrollBy({ left: step * Number(btn.dataset.scroll), behavior: reduceMotion ? 'auto' : 'smooth' });
    });
  });

  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();
})();
