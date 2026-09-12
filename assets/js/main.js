/**
 * Kelo3D — Main JavaScript
 * Handles: navigation, counters, scroll reveals, buy buttons (Instagram DM), back-to-top
 */

(() => {
  'use strict';

  /* ── Helpers ──────────────────────────────────────────── */
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
  const addClass    = (el, cls) => el?.classList.add(cls);
  const removeClass = (el, cls) => el?.classList.remove(cls);
  const toggleClass = (el, cls) => el?.classList.toggle(cls);

  const KELO_IG = 'kelo.3d'; // handle sem @

  /* ── 1. NAV — scroll shrink & mobile burger ───────────── */
  const navHeader = $('#nav-header');
  const burger    = $('#nav-burger');
  const navLinks  = $('#nav-links');

  const onScroll = () => {
    const backToTop = $('#back-to-top');
    if (window.scrollY > 40) {
      addClass(navHeader, 'scrolled');
      if (backToTop) backToTop.hidden = false;
    } else {
      removeClass(navHeader, 'scrolled');
      if (backToTop) backToTop.hidden = true;
    }
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  burger?.addEventListener('click', () => {
    const isOpen = navLinks.classList.contains('open');
    toggleClass(navLinks, 'open');
    toggleClass(burger, 'open');
    burger.setAttribute('aria-expanded', String(!isOpen));
  });

  // Close mobile menu when a link is clicked
  $$('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      removeClass(navLinks, 'open');
      removeClass(burger, 'open');
      burger?.setAttribute('aria-expanded', 'false');
    });
  });

  // Close mobile menu on outside click
  document.addEventListener('click', e => {
    if (navLinks?.classList.contains('open') &&
        !navLinks.contains(e.target) &&
        !burger?.contains(e.target)) {
      removeClass(navLinks, 'open');
      removeClass(burger, 'open');
      burger?.setAttribute('aria-expanded', 'false');
    }
  });

  /* ── 2. ANIMATED COUNTERS ─────────────────────────────── */
  const counterEls = $$('[data-target]');

  const easeOut = t => 1 - Math.pow(1 - t, 4);

  const animateCounter = (el, target, duration = 1800) => {
    const start = performance.now();
    const tick = now => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      el.textContent = Math.round(easeOut(progress) * target);
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  const counterObserver = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          animateCounter(el, parseInt(el.dataset.target, 10));
          counterObserver.unobserve(el);
        }
      });
    },
    { threshold: 0.6 }
  );

  counterEls.forEach(el => counterObserver.observe(el));

  /* ── 3. SCROLL REVEAL ─────────────────────────────────── */
  const revealEls = $$([
    '.about-grid',
    '.catalog .section-header',
    '.process-step',
    '.product-card',
    '.cta-content',
    '.footer-grid',
    '.feature-item',
    '.catalog-cta',
  ].join(', '));

  revealEls.forEach(el => addClass(el, 'reveal'));

  const revealObserver = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          addClass(entry.target, 'visible');
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1 }
  );

  revealEls.forEach(el => revealObserver.observe(el));

  /* ── 4. PROCESS STEP — staggered reveal ──────────────── */
  $$('.process-step').forEach((step, i) => {
    step.style.transitionDelay = `${i * 0.12}s`;
  });

  /* ── 5. INSTAGRAM DM HELPER ───────────────────────────── */
  function openInstagramDM(productName) {
    const msg = encodeURIComponent(
      `Olá, Kelo3D! Vi o produto "${productName}" no site e gostaria de comprar. Ainda está disponível? 😊`
    );
    // ig.me/m/{handle} abre o DM diretamente no app ou no instagram.com
    window.open(`https://ig.me/m/${KELO_IG}?text=${msg}`, '_blank', 'noopener,noreferrer');
  }

  /* ── 6. BOTÕES "COMPRAR" — abre DM do Instagram ─────── */
  $$('.buy-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.preventDefault();
      const product = btn.dataset.product || btn.closest('[data-product]')?.dataset.product || 'produto';
      openInstagramDM(product);
    });
  });

  /* ── 7. OVERLAY "Pedir pelo Instagram" ───────────────── */
  $$('.overlay-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const card = btn.closest('.product-card');
      const product = card?.dataset.product
        || card?.querySelector('.product-name')?.textContent
        || 'produto';
      openInstagramDM(product);
    });
  });

  /* ── 8. BACK TO TOP ───────────────────────────────────── */
  $('#back-to-top')?.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  /* ── 9. FOOTER YEAR ───────────────────────────────────── */
  const yearEl = $('#footer-year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ── 10. SMOOTH INTERNAL LINKS ACTIVE STATE ───────────── */
  const sections   = $$('section[id], .hero[id]');
  const navLinkEls = $$('.nav-link');

  const sectionObserver = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          navLinkEls.forEach(link => {
            const href = link.getAttribute('href');
            const isMatch =
              href === `#${id}` ||
              (id === 'catalogo' && href === '#catalogo') ||
              (id === 'processo' && href === '#processo');
            link.style.color = isMatch ? 'var(--clr-text)' : '';
          });
        }
      });
    },
    { threshold: 0.3 }
  );

  sections.forEach(s => sectionObserver.observe(s));

})();
