/**
 * Malzie Softs - Continuous Scroll Reveal Animation Engine
 * Automatically animates sections, cards, and editorial features in whenever they scroll into view,
 * and resets them when they leave the viewport so they ALWAYS animate in on every scroll.
 */
(function () {
  'use strict';

  function initScrollAnimationEngine() {
    if (!('IntersectionObserver' in window)) {
      document.querySelectorAll('.scroll-reveal, .scroll-reveal-left, .scroll-reveal-right, .scroll-reveal-scale').forEach(el => {
        el.classList.add('is-revealed');
      });
      return;
    }

    // Default selectors that automatically receive scroll-reveal if not already tagged
    const defaultTargets = [
      // Section headers
      '#innovations-section > div > div:first-child',
      '#catalog-section > div:first-child',
      'section.editorial-lifestyle-section',
      'section.py-12.max-w-7xl > div',
      '#reviews-section .text-center',
      'section.py-24.bg-white .text-center',
      
      // Grid children / Cards
      '#innovations-section .grid > div',
      '#catalog-products-container > div',
      '#products-grid > div',
      'section.py-24.bg-white .grid > div',
      'footer .grid > div'
    ];

    function autoTagTargets() {
      defaultTargets.forEach(selector => {
        const els = document.querySelectorAll(selector);
        els.forEach((el, index) => {
          if (!el.classList.contains('scroll-reveal') &&
              !el.classList.contains('scroll-reveal-left') &&
              !el.classList.contains('scroll-reveal-right') &&
              !el.classList.contains('scroll-reveal-scale')) {
            el.classList.add('scroll-reveal');
            // Add stagger class if in a grid/list
            if (selector.includes('> div')) {
              el.classList.add(`stagger-${(index % 4) + 1}`);
            }
          }
        });
      });
    }

    autoTagTargets();

    const observerOptions = {
      root: null,
      rootMargin: '0px 0px -40px 0px',
      threshold: [0, 0.1]
    };

    const scrollObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const el = entry.target;
        if (entry.isIntersecting) {
          el.classList.add('is-revealed');
        } else {
          // When scrolled out of viewport, remove is-revealed so it ALWAYS animates in again
          const rect = entry.boundingClientRect;
          if (rect.top > window.innerHeight || rect.bottom < 0) {
            el.classList.remove('is-revealed');
          }
        }
      });
    }, observerOptions);

    function observeAll() {
      const items = document.querySelectorAll(
        '.scroll-reveal, .scroll-reveal-left, .scroll-reveal-right, .scroll-reveal-scale'
      );
      items.forEach(el => {
        // If element is already in viewport on initial load, reveal immediately
        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom > 0) {
          el.classList.add('is-revealed');
        }
        scrollObserver.observe(el);
      });
    }

    observeAll();

    // Global refresh hook for dynamic content (e.g. Catalog filtering)
    window.refreshScrollAnimations = function () {
      setTimeout(() => {
        autoTagTargets();
        observeAll();
      }, 50);
    };

    // Re-check when window is resized
    window.addEventListener('resize', () => {
      if (window.refreshScrollAnimations) {
        window.refreshScrollAnimations();
      }
    }, { passive: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initScrollAnimationEngine);
  } else {
    initScrollAnimationEngine();
  }
})();
