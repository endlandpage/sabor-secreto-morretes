(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  function mountCarousel(root, initialIndex, onChange) {
    const track = root.querySelector('[data-track]');
    const slides = Array.from(track.children);
    const previous = root.querySelector('[data-prev]');
    const next = root.querySelector('[data-next]');
    let active = -1;
    let destination = null;
    let nativeScroll = false;

    function update(index, announce) {
      if (index === active) return;
      slides[active]?.setAttribute('inert', '');
      slides[index].removeAttribute('inert');
      active = index;
      onChange(index, slides[index], announce);
    }

    function select(index, { announce = true, animate = true } = {}) {
      const target = (index + slides.length) % slides.length;
      const smooth = animate && !reduceMotion.matches && Math.abs(target - active) === 1;
      nativeScroll = false;
      destination = smooth ? target : null;
      track.scrollTo({ left: slides[target].offsetLeft, behavior: smooth ? 'smooth' : 'instant' });
      if (target === active) onChange(target, slides[target], false);
      else update(target, announce);
    }

    function shift(delta, options) {
      select(active + delta, options);
    }

    function align() {
      track.scrollTo({ left: slides[active].offsetLeft, behavior: 'instant' });
    }

    track.addEventListener('scroll', () => {
      if (nativeScroll) {
        const index = Math.min(slides.length - 1, Math.max(0, Math.round(track.scrollLeft / track.clientWidth)));
        update(index, true);
      } else if (destination === null && Math.abs(track.scrollLeft - slides[active].offsetLeft) > 2) {
        align();
      }
    }, { passive: true });

    function beginNativeScroll() {
      nativeScroll = true;
      destination = null;
    }

    track.addEventListener('pointerdown', (event) => {
      if (event.pointerType !== 'mouse') beginNativeScroll();
    }, { passive: true });
    track.addEventListener('pointerup', () => { nativeScroll = false; }, { passive: true });
    track.addEventListener('wheel', (event) => {
      if (event.deltaX || event.shiftKey) beginNativeScroll();
    }, { passive: true });
    track.addEventListener('scrollend', () => {
      nativeScroll = false;
      destination = null;
    });

    track.addEventListener('keydown', (event) => {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      event.preventDefault();
      shift(event.key === 'ArrowLeft' ? -1 : 1);
    });

    previous.addEventListener('click', () => shift(-1));
    next.addEventListener('click', () => shift(1));
    root.querySelector('[data-controls]').hidden = false;
    root.classList.add('is-ready');
    for (const slide of slides) slide.setAttribute('inert', '');
    select(initialIndex, { animate: false, announce: false });
    new ResizeObserver(() => { if (!nativeScroll && destination === null) align(); }).observe(track);

    return { select, shift };
  }

  function mountReviews(root) {
    const count = root.querySelector('[data-count]');
    const announcement = root.querySelector('[data-announcement]');
    const toggle = root.querySelector('[data-toggle]');
    const total = root.querySelector('[data-track]').children.length;
    let playing = !reduceMotion.matches;
    let inView = false;

    const carousel = mountCarousel(root, 0, (index, slide, announce) => {
      count.textContent = `${index + 1} / ${total}`;
      if (announce) announcement.textContent = `Avaliação ${index + 1}, ${slide.querySelector('strong').textContent}`;
    });

    function setPlaying(value) {
      playing = value;
      toggle.textContent = playing ? 'Pausar' : 'Reproduzir';
      toggle.setAttribute('aria-label', playing ? 'Pausar rotação das avaliações' : 'Reproduzir rotação das avaliações');
    }

    setPlaying(playing);
    toggle.addEventListener('click', () => setPlaying(!playing));
    reduceMotion.addEventListener('change', () => {
      if (reduceMotion.matches) setPlaying(false);
    });
    new IntersectionObserver(([entry]) => { inView = entry.intersectionRatio >= .45; }, { threshold: .45 })
      .observe(root.querySelector('.reviews-carousel'));

    window.setInterval(() => {
      if (playing && inView && !document.hidden && !root.matches(':hover, :focus-within')) {
        carousel.shift(1, { announce: false });
      }
    }, 6500);
  }

  function mountMenu(root) {
    const dayButtons = Array.from(root.querySelectorAll('[data-go-day]'));
    const title = root.querySelector('[data-menu-title]');
    const action = root.querySelector('[data-order]');
    const label = action.querySelector('[data-order-label]');
    const weeklyDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const formatter = new Intl.DateTimeFormat('en-US', { weekday: 'short', timeZone: 'America/Sao_Paulo' });
    let today = weeklyDays.indexOf(formatter.format(new Date()));

    function markToday() {
      for (const [index, button] of dayButtons.entries()) {
        if (index === today) button.setAttribute('aria-current', 'date');
        else button.removeAttribute('aria-current');
      }
    }

    const carousel = mountCarousel(root, today, (index, slide) => {
      for (const [dayIndex, button] of dayButtons.entries()) {
        button.setAttribute('aria-pressed', String(index === dayIndex));
      }
      for (const disclosure of root.querySelectorAll('[inert] details[open]')) disclosure.open = false;
      const day = slide.dataset.day;
      const available = slide.hasAttribute('data-available');
      title.textContent = index === today ? `Hoje, ${day.toLowerCase()}` : day;
      label.textContent = available ? 'Pedir pelo WhatsApp' : 'Consultar pelo WhatsApp';
      const prefix = available ? 'Gostaria de pedir a marmita' : 'Gostaria de consultar o cardápio de marmitas';
      const message = `Olá! ${prefix} de ${day.toLowerCase()}. Podem confirmar as opções e a entrega ou retirada?`;
      action.href = `https://wa.me/5541998681217?text=${encodeURIComponent(message)}`;
    });

    markToday();
    for (const [index, button] of dayButtons.entries()) {
      button.addEventListener('click', () => carousel.select(index));
    }

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) return;
      const current = weeklyDays.indexOf(formatter.format(new Date()));
      if (current === today) return;
      today = current;
      markToday();
      carousel.select(today, { animate: false });
    });
  }

  const reviews = document.querySelector('[data-carousel="reviews"]');
  const menu = document.querySelector('[data-carousel="menu"]');
  if (reviews) mountReviews(reviews);
  if (menu) mountMenu(menu);
})();
