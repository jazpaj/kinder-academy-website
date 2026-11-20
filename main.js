(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const smooth = reduceMotion ? 'auto' : 'smooth';

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

  /* Beige hero background ends just under the intro copy */
  const center = document.querySelector('.center');
  const intro = document.querySelector('.center__intro');
  const sizeBg = () => {
    const h = intro.getBoundingClientRect().bottom - center.getBoundingClientRect().top;
    center.style.setProperty('--bg-h', `${Math.round(h)}px`);
  };
  sizeBg();
  if ('ResizeObserver' in window) new ResizeObserver(sizeBg).observe(intro);
  window.addEventListener('resize', sizeBg);

  /* Read more toggles */
  document.querySelectorAll('[data-toggle]').forEach((btn) => {
    const target = document.getElementById(btn.dataset.toggle);
    btn.addEventListener('click', () => {
      const open = target.hidden;
      target.hidden = !open;
      btn.setAttribute('aria-expanded', String(open));
      btn.textContent = open ? 'Read Less' : 'Read More…';
    });
  });

  /* Photo slider */
  const track = document.querySelector('.slider__track');
  if (track) {
    const slides = [...track.children];
    const dots = document.querySelector('.slider__dots');
    slides.forEach(() => dots.appendChild(document.createElement('span')));
    const current = () => Math.round(track.scrollLeft / track.clientWidth);
    const paint = () => [...dots.children].forEach((d, i) => d.classList.toggle('on', i === current()));
    const go = (i) => {
      const n = (i + slides.length) % slides.length;
      track.scrollTo({ left: n * track.clientWidth, behavior: smooth });
    };
    document.querySelector('.slider__arrow--prev').addEventListener('click', () => go(current() - 1));
    document.querySelector('.slider__arrow--next').addEventListener('click', () => go(current() + 1));
    track.addEventListener('scroll', () => requestAnimationFrame(paint), { passive: true });
    track.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') { e.preventDefault(); go(current() + 1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); go(current() - 1); }
    });
    paint();
  }

  /* Program links pre-fill the tuition form */
  const programSelect = document.getElementById('programSelect');
  document.querySelectorAll('[data-program]').forEach((a) => {
    a.addEventListener('click', () => { programSelect.value = a.dataset.program; });
  });

  /* Reviews: one at a time */
  const quotes = [...document.querySelectorAll('.quote')];
  let qi = 0;
  const showQuote = (n) => {
    quotes[qi].hidden = true;
    qi = (n + quotes.length) % quotes.length;
    quotes[qi].hidden = false;
  };
  document.querySelectorAll('.quotes__arrow').forEach((b) => {
    b.addEventListener('click', () => showQuote(qi + Number(b.dataset.dir)));
  });

  /* Tabs (WAI-ARIA tabs pattern): age programs + center offerings */
  document.querySelectorAll('[role="tablist"]').forEach((list) => {
    const tabs = [...list.querySelectorAll('[role="tab"]')];
    const selectTab = (tab, focus) => {
      tabs.forEach((t) => {
        const on = t === tab;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
        document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
      });
      if (focus) tab.focus();
    };
    tabs.forEach((tab, i) => {
      tab.addEventListener('click', () => selectTab(tab));
      tab.addEventListener('keydown', (e) => {
        let n = null;
        if (e.key === 'ArrowRight') n = (i + 1) % tabs.length;
        if (e.key === 'ArrowLeft') n = (i - 1 + tabs.length) % tabs.length;
        if (e.key === 'Home') n = 0;
        if (e.key === 'End') n = tabs.length - 1;
        if (n !== null) { e.preventDefault(); selectTab(tabs[n], true); }
      });
    });
  });

  /* Tour scheduler: pick a weekday + time slot (request only, confirmed by staff) */
  const calGrid = document.querySelector('.cal__grid');
  if (calGrid) {
    const title = document.querySelector('.cal__title');
    const dayLabel = document.querySelector('.slots__day');
    const slotGrid = document.querySelector('.slots__grid');
    const picked = document.querySelector('.tour__picked');
    const dateInput = document.getElementById('tourDate');
    const timeInput = document.getElementById('tourTime');
    const prevBtn = document.querySelector('.cal__nav[data-month="-1"]');
    const nextBtn = document.querySelector('.cal__nav[data-month="1"]');
    const TIMES = ['9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM', '3:00 PM', '3:30 PM', '4:00 PM'];
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const first = new Date(today); first.setDate(first.getDate() + 1);
    while (first.getDay() === 0 || first.getDay() === 6) first.setDate(first.getDate() + 1);
    const limit = new Date(today); limit.setDate(limit.getDate() + 60);
    let view = new Date(first.getFullYear(), first.getMonth(), 1);
    let sel = new Date(first);
    let time = '';
    const fmtLong = (d) => d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    const sameDay = (a, b) => a && b && a.toDateString() === b.toDateString();
    const ok = (d) => d >= first && d <= limit && d.getDay() !== 0 && d.getDay() !== 6;

    const updatePicked = () => {
      dateInput.value = sel ? fmtLong(sel) : '';
      timeInput.value = time;
      picked.textContent = sel && time ? `Requested: ${fmtLong(sel)} at ${time}` : sel ? `${fmtLong(sel)}: now choose a time.` : 'Pick a date and time above.';
    };
    const renderSlots = () => {
      slotGrid.innerHTML = '';
      dayLabel.textContent = sel ? fmtLong(sel) : 'Choose a date';
      if (!sel) { slotGrid.innerHTML = '<p class="slots__empty">Select a weekday to see tour times.</p>'; return; }
      TIMES.forEach((t) => {
        const b = document.createElement('button');
        b.type = 'button'; b.className = 'slot'; b.textContent = t;
        b.setAttribute('aria-pressed', String(t === time));
        b.addEventListener('click', () => { time = t; renderSlots(); updatePicked(); });
        slotGrid.appendChild(b);
      });
    };
    const renderCal = () => {
      title.textContent = view.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      calGrid.innerHTML = '';
      ['S', 'M', 'T', 'W', 'T', 'F', 'S'].forEach((d) => {
        const s = document.createElement('span'); s.className = 'cal__dow'; s.textContent = d; s.setAttribute('aria-hidden', 'true');
        calGrid.appendChild(s);
      });
      const startPad = view.getDay();
      for (let i = 0; i < startPad; i++) calGrid.appendChild(document.createElement('span'));
      const days = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();
      for (let d = 1; d <= days; d++) {
        const date = new Date(view.getFullYear(), view.getMonth(), d);
        const b = document.createElement('button');
        b.type = 'button'; b.className = 'cal__day'; b.textContent = d;
        b.setAttribute('aria-label', fmtLong(date));
        b.disabled = !ok(date);
        b.setAttribute('aria-pressed', String(sameDay(date, sel)));
        b.addEventListener('click', () => { sel = date; time = ''; renderCal(); renderSlots(); updatePicked(); });
        calGrid.appendChild(b);
      }
      prevBtn.disabled = view <= new Date(first.getFullYear(), first.getMonth(), 1);
      nextBtn.disabled = new Date(view.getFullYear(), view.getMonth() + 1, 1) > limit;
    };
    prevBtn.addEventListener('click', () => { view = new Date(view.getFullYear(), view.getMonth() - 1, 1); renderCal(); });
    nextBtn.addEventListener('click', () => { view = new Date(view.getFullYear(), view.getMonth() + 1, 1); renderCal(); });
    renderCal(); renderSlots(); updatePicked();
  }

  /* Forms: validate, then open a pre-filled email to the center.
     (Swap this for a form service / CRM endpoint when one is set up.) */
  const TO = 'kinderacademylaveen@outlook.com';
  document.querySelectorAll('form[data-subject]').forEach((form) => {
    const note = form.querySelector('.form__note');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const bads = [];
      form.querySelectorAll('input:not([type=hidden]), select, textarea').forEach((el) => {
        const bad = !el.checkValidity();
        el.classList.toggle('is-invalid', bad);
        el.setAttribute('aria-invalid', String(bad));
        if (bad) bads.push(el);
      });
      const names = bads.map((el) => el.closest('label').firstChild.textContent.trim());
      const tourTime = form.querySelector('#tourTime');
      if (tourTime && !tourTime.value) names.unshift('Tour date & time');
      if (names.length) {
        note.className = 'form__note err';
        note.textContent = `Please complete: ${names.join(', ')}.`;
        if (bads[0]) bads[0].focus();
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

  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();
})();
