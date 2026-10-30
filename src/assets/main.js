/* Quality & Services LLC — interacciones del sitio (sin dependencias) */
(function () {
  'use strict';

  var LANG_KEY = 'qs-lang';
  function store(key, value) { try { localStorage.setItem(key, value); } catch (e) { /* almacenamiento no disponible */ } }

  /* ---------- Idioma: recordar preferencia y conservar la sección ---------- */
  document.querySelectorAll('[data-lang-switch]').forEach(function (link) {
    link.addEventListener('click', function () {
      store(LANG_KEY, link.getAttribute('data-lang-switch'));
      if (location.hash && link.closest('.lang')) link.setAttribute('href', link.getAttribute('href').split('#')[0] + location.hash);
    });
  });

  /* ---------- Encabezado ---------- */
  var header = document.querySelector('[data-header]');
  if (header) {
    var onScroll = function () { header.classList.toggle('is-scrolled', window.scrollY > 8); };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ---------- Menú móvil ---------- */
  var toggle = document.querySelector('[data-nav-toggle]');
  var nav = document.querySelector('[data-nav]');
  if (toggle && nav) {
    var label = toggle.querySelector('[data-nav-toggle-label]');
    var mq = window.matchMedia('(max-width: 900px)');
    var setOpen = function (open, focusToggle) {
      toggle.setAttribute('aria-expanded', String(open));
      nav.classList.toggle('is-open', open);
      document.body.classList.toggle('nav-open', open);
      label.textContent = toggle.getAttribute(open ? 'data-label-close' : 'data-label-open');
      if (open) { var first = nav.querySelector('a'); if (first) first.focus(); }
      else if (focusToggle) toggle.focus();
    };
    toggle.addEventListener('click', function () { setOpen(toggle.getAttribute('aria-expanded') !== 'true'); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) setOpen(false, true);
    });
    nav.addEventListener('keydown', function (e) {
      if (e.key !== 'Tab' || !mq.matches || !nav.classList.contains('is-open')) return;
      var items = nav.querySelectorAll('a, button');
      var last = items[items.length - 1];
      if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); toggle.focus(); }
    });
    document.addEventListener('click', function (e) {
      if (nav.classList.contains('is-open') && !nav.contains(e.target) && !toggle.contains(e.target)) setOpen(false);
    });
    var onMq = function () { if (!mq.matches) setOpen(false); };
    if (mq.addEventListener) mq.addEventListener('change', onMq); else mq.addListener(onMq);
  }

  /* ---------- Carrusel de portada ----------
     La imagen visible sale hacia la derecha mientras la siguiente entra desde la izquierda.
     Ambas se mueven con la misma curva y duración, por lo que nunca queda un espacio vacío. */
  var carousel = document.querySelector('[data-carousel]');
  if (carousel) {
    var hero = carousel.closest('.hero');
    var slides = Array.prototype.slice.call(carousel.querySelectorAll('[data-slide]'));
    var dots = Array.prototype.slice.call(hero.querySelectorAll('[data-dot]'));
    var btnPrev = hero.querySelector('[data-prev]');
    var btnNext = hero.querySelector('[data-next]');
    var btnToggle = hero.querySelector('[data-toggle]');
    var interval = parseInt(carousel.getAttribute('data-interval'), 10) || 6000;
    var duration = parseInt(carousel.getAttribute('data-duration'), 10) || 800;
    var easing = 'cubic-bezier(0.65, 0, 0.35, 1)';
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    var current = 0, timer = null, animating = false;
    var userPaused = reduce.matches;      // con movimiento reducido no hay reproducción automática
    var hoverPaused = false, focusPaused = false;

    var ready = function (slide) {
      var im = slide.querySelector('img');
      if (!im) return Promise.resolve();
      im.loading = 'eager';
      if (im.complete && im.naturalWidth) return Promise.resolve();
      return new Promise(function (res) {
        var done = function () { res(); };
        im.addEventListener('load', done, { once: true });
        im.addEventListener('error', done, { once: true });
        setTimeout(done, 4000);
      });
    };
    // Precarga discreta de la siguiente imagen
    var preloadNext = function () { ready(slides[(current + 1) % slides.length]); };

    var setState = function (i) {
      slides.forEach(function (s, k) { s.setAttribute('aria-hidden', k === i ? 'false' : 'true'); });
      dots.forEach(function (d, k) { if (k === i) d.setAttribute('aria-current', 'true'); else d.removeAttribute('aria-current'); });
    };

    var go = function (to, dir) {
      if (animating || to === current) return;
      var from = slides[current], next = slides[to];
      animating = true;
      ready(next).then(function () {
        var instant = reduce.matches;
        var sign = dir === 'back' ? -1 : 1;    // adelante: sale a la derecha, entra por la izquierda
        next.style.transition = 'none';
        next.style.transform = 'translate3d(' + (-100 * sign) + '%,0,0)';
        next.classList.add('is-entering');
        from.classList.add('is-leaving');
        void next.offsetWidth;                 // fija la posición inicial antes de animar
        var tr = instant ? 'none' : 'transform ' + duration + 'ms ' + easing;
        next.style.transition = tr; from.style.transition = tr;
        next.style.transform = 'translate3d(0,0,0)';
        from.style.transform = 'translate3d(' + (100 * sign) + '%,0,0)';
        var finish = function () {
          from.classList.remove('is-active', 'is-leaving');
          next.classList.remove('is-entering');
          next.classList.add('is-active');
          [from, next].forEach(function (s) { s.style.transition = ''; s.style.transform = ''; });
          current = to; setState(to); animating = false;
          preloadNext(); schedule();
        };
        setTimeout(finish, instant ? 0 : duration + 40);
      });
    };
    var nextSlide = function () { go((current + 1) % slides.length, 'fwd'); };
    var prevSlide = function () { go((current - 1 + slides.length) % slides.length, 'back'); };

    var paused = function () { return userPaused || hoverPaused || focusPaused || document.hidden; };
    var schedule = function () {
      clearTimeout(timer);
      if (!paused()) timer = setTimeout(nextSlide, interval);
    };
    var renderToggle = function () {
      hero.classList.toggle('is-paused', userPaused);
      btnToggle.setAttribute('aria-label', btnToggle.getAttribute(userPaused ? 'data-label-play' : 'data-label-pause'));
    };

    btnNext.addEventListener('click', function () { nextSlide(); });
    btnPrev.addEventListener('click', function () { prevSlide(); });
    btnToggle.addEventListener('click', function () { userPaused = !userPaused; renderToggle(); schedule(); });
    dots.forEach(function (d) {
      d.addEventListener('click', function () {
        var i = parseInt(d.getAttribute('data-dot'), 10);
        go(i, i < current ? 'back' : 'fwd');
      });
    });

    // Pausa mientras el cursor o el foco están sobre los controles o los botones de portada
    var interactive = [hero.querySelector('[data-carousel-controls]'), hero.querySelector('.hero__content')];
    interactive.forEach(function (el) {
      if (!el) return;
      el.addEventListener('mouseenter', function () { hoverPaused = true; schedule(); });
      el.addEventListener('mouseleave', function () { hoverPaused = false; schedule(); });
      el.addEventListener('focusin', function () { focusPaused = true; schedule(); });
      el.addEventListener('focusout', function (e) { if (!el.contains(e.relatedTarget)) { focusPaused = false; schedule(); } });
    });
    document.addEventListener('visibilitychange', schedule);
    // Gestos táctiles
    var x0 = null;
    carousel.parentElement.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    carousel.parentElement.addEventListener('touchend', function (e) {
      if (x0 === null) return;
      var dx = e.changedTouches[0].clientX - x0; x0 = null;
      if (Math.abs(dx) > 50) { if (dx > 0) nextSlide(); else prevSlide(); }
    }, { passive: true });
    var onReduce = function () { if (reduce.matches) { userPaused = true; renderToggle(); schedule(); } };
    if (reduce.addEventListener) reduce.addEventListener('change', onReduce); else reduce.addListener(onReduce);

    renderToggle(); setState(0);
    if (document.readyState === 'complete') { preloadNext(); schedule(); }
    else window.addEventListener('load', function () { preloadNext(); schedule(); });
  }

  /* ---------- Formulario de contacto (solo si hay un servicio configurado) ---------- */
  var form = document.querySelector('form[data-form]');
  if (form) {
    var msg = JSON.parse(form.getAttribute('data-messages'));
    var status = form.querySelector('[data-status]');
    var submit = form.querySelector('button[type="submit"]');
    var showError = function (field, text) {
      var err = document.getElementById(field.id + '-err');
      field.setAttribute('aria-invalid', text ? 'true' : 'false');
      if (err) {
        err.textContent = text || ''; err.hidden = !text;
        if (text) field.setAttribute('aria-describedby', err.id); else field.removeAttribute('aria-describedby');
      }
    };
    var checkField = function (f) {
      var text = '';
      if (f.type === 'checkbox') { if (!f.checked) text = msg.consent; }
      else if (!f.value.trim()) text = msg.required;
      else if (f.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.value.trim())) text = msg.email;
      showError(f, text);
      return !text;
    };
    var validate = function () {
      var firstBad = null;
      ['f-name', 'f-email', 'f-message', 'f-consent'].forEach(function (id) {
        var f = document.getElementById(id);
        if (!checkField(f) && !firstBad) firstBad = f;
      });
      return firstBad;
    };
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      status.className = 'form-status'; status.textContent = '';
      var bad = validate();
      if (bad) { status.textContent = msg.summary; status.classList.add('is-error'); bad.focus(); return; }
      if (form.querySelector('.hp').value) return; // trampa anti-spam
      submit.disabled = true; submit.textContent = msg.sending;
      fetch(form.action, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } })
        .then(function (r) {
          if (!r.ok) throw new Error('HTTP ' + r.status);
          form.reset(); status.textContent = msg.success; status.classList.add('is-success');
        })
        .catch(function () { status.textContent = msg.error; status.classList.add('is-error'); })
        .then(function () { submit.disabled = false; submit.textContent = msg.submit; });
    });
    form.querySelectorAll('input, textarea').forEach(function (f) {
      var revalidate = function () { if (f.getAttribute('aria-invalid') === 'true') checkField(f); };
      f.addEventListener(f.type === 'checkbox' ? 'change' : 'input', revalidate);
    });
  }
})();
