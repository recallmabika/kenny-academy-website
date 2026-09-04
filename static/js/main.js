/**
 * Kenny Academy — Single Page Application (SPA) Engine & UI Controller
 */
(function () {
  'use strict';

  // Active timers / intervals to clean up across SPA transitions
  var activeIntervals = [];
  function clearSpaTimers() {
    while (activeIntervals.length > 0) {
      clearInterval(activeIntervals.pop());
    }
  }

  // -------------------------------------------------------------
  // Theme Management (Class Strategy on <html>)
  // -------------------------------------------------------------
  function syncThemeIcons() {
    var isDark = document.documentElement.classList.contains('dark');
    var iconSun = document.getElementById('iconSun');
    var iconMoon = document.getElementById('iconMoon');
    if (iconSun) iconSun.classList.toggle('hidden', isDark);
    if (iconMoon) iconMoon.classList.toggle('hidden', !isDark);
  }

  function initTheme() {
    var themeToggle = document.getElementById('themeToggle');
    if (themeToggle && !themeToggle._bound) {
      themeToggle._bound = true;
      themeToggle.addEventListener('click', function () {
        var isDark = document.documentElement.classList.toggle('dark');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
        syncThemeIcons();
      });
    }
    syncThemeIcons();
  }

  // -------------------------------------------------------------
  // Mobile Navigation Drawer Toggle
  // -------------------------------------------------------------
  function initMobileNav() {
    var navToggle = document.getElementById('navToggle');
    var mobileDrawer = document.getElementById('mobileDrawer');
    if (navToggle && mobileDrawer && !navToggle._bound) {
      navToggle._bound = true;
      navToggle.addEventListener('click', function () {
        var isHidden = mobileDrawer.classList.toggle('hidden');
        navToggle.setAttribute('aria-expanded', !isHidden);
      });
    }
  }

  function closeMobileNav() {
    var navToggle = document.getElementById('navToggle');
    var mobileDrawer = document.getElementById('mobileDrawer');
    if (mobileDrawer) mobileDrawer.classList.add('hidden');
    if (navToggle) navToggle.setAttribute('aria-expanded', 'false');
  }

  // -------------------------------------------------------------
  // Top Reading / Scroll Progress & Scroll To Top
  // -------------------------------------------------------------
  var scrollInitialized = false;
  function initScrollHelpers() {
    var progressBar = document.getElementById('scrollProgress');
    var scrollTopBtn = document.getElementById('scrollTop');

    if (!scrollInitialized) {
      scrollInitialized = true;
      var ticking = false;

      function onScroll() {
        var scrollY = window.scrollY || document.documentElement.scrollTop;
        var docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        var pct = docHeight > 0 ? (scrollY / docHeight) * 100 : 0;

        if (progressBar) {
          progressBar.style.width = Math.min(100, Math.max(0, pct)) + '%';
        }
        if (scrollTopBtn) {
          if (scrollY > 380) {
            scrollTopBtn.classList.remove('opacity-0', 'translate-y-4', 'pointer-events-none');
            scrollTopBtn.classList.add('opacity-100', 'translate-y-0');
          } else {
            scrollTopBtn.classList.add('opacity-0', 'translate-y-4', 'pointer-events-none');
            scrollTopBtn.classList.remove('opacity-100', 'translate-y-0');
          }
        }
        ticking = false;
      }

      window.addEventListener('scroll', function () {
        if (!ticking) {
          window.requestAnimationFrame(onScroll);
          ticking = true;
        }
      }, { passive: true });

      window.addEventListener('resize', onScroll);

      if (scrollTopBtn) {
        scrollTopBtn.addEventListener('click', function () {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        });
      }
    }
  }

  // -------------------------------------------------------------
  // Page Components Lifecycle (Executed on each SPA navigation)
  // -------------------------------------------------------------
  function initComponents() {
    clearSpaTimers();

    // 1. Home Hero Slideshow
    var slides = document.querySelectorAll('.hero-slides .slide');
    if (slides.length > 1) {
      var current = 0;
      var slideInterval = setInterval(function () {
        slides[current].classList.remove('opacity-100');
        slides[current].classList.add('opacity-0');
        current = (current + 1) % slides.length;
        slides[current].classList.remove('opacity-0');
        slides[current].classList.add('opacity-100');
      }, 5500);
      activeIntervals.push(slideInterval);
    }

    // 2. Scoreboard Tally Counters
    var tallies = document.querySelectorAll('.tally .n[data-count]');
    if (tallies.length && 'IntersectionObserver' in window) {
      var tIO = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (!e.isIntersecting) return;
          tIO.unobserve(e.target);
          var el = e.target;
          var target = parseInt(el.getAttribute('data-count'), 10) || 0;
          var dur = 900, start = null;
          function step(ts) {
            if (!start) start = ts;
            var p = Math.min(1, (ts - start) / dur);
            var val = Math.round(target * (1 - Math.pow(1 - p, 3)));
            el.textContent = val;
            if (p < 1) requestAnimationFrame(step);
          }
          requestAnimationFrame(step);
        });
      }, { threshold: 0.3 });
      tallies.forEach(function (el) { tIO.observe(el); });
    }

    // 3. Wave Headline word-splitting
    document.querySelectorAll('.wave').forEach(function (w) {
      if (w.dataset.split) return;
      var words = w.textContent.trim().split(/\s+/);
      w.innerHTML = words.map(function (word) {
        return '<span class="inline-block transition-transform duration-300 hover:-translate-y-1 hover:text-brand-red">' + word + '&nbsp;</span>';
      }).join('');
      w.dataset.split = 'true';
    });

    // 4. Gallery Category Filter
    var filterBtns = document.querySelectorAll('.g-filter .filter-btn');
    if (filterBtns.length) {
      filterBtns.forEach(function (btn) {
        btn.addEventListener('click', function () {
          filterBtns.forEach(function (b) {
            b.classList.remove('active', 'bg-ink', 'dark:bg-white', 'text-white', 'dark:text-ink', 'font-bold');
            b.classList.add('bg-white', 'dark:bg-[#1c1613]', 'text-ink-70', 'dark:text-white/70');
          });
          btn.classList.add('active', 'bg-ink', 'dark:bg-white', 'text-white', 'dark:text-ink', 'font-bold');
          btn.classList.remove('bg-white', 'dark:bg-[#1c1613]', 'text-ink-70', 'dark:text-white/70');

          var cat = btn.getAttribute('data-filter');
          document.querySelectorAll('.g-columns .g-item').forEach(function (item) {
            var show = (cat === 'all') || (item.getAttribute('data-cat') === cat);
            item.style.display = show ? '' : 'none';
          });
        });
      });
    }

    // 5. Contact Form submission (AJAX with fallback)
    var contactForm = document.getElementById('inquiryForm');
    if (contactForm) {
      contactForm.addEventListener('submit', function (ev) {
        ev.preventDefault();
        var submitBtn = contactForm.querySelector('.submit-btn');
        var originalText = submitBtn ? submitBtn.textContent : 'Send inquiry';
        if (submitBtn) {
          submitBtn.textContent = 'Sending…';
          submitBtn.disabled = true;
        }

        var formData = new FormData(contactForm);
        fetch(contactForm.action, {
          method: 'POST',
          body: formData,
          headers: { 'X-Requested-With': 'XMLHttpRequest' }
        }).then(function (res) {
          return res.text();
        }).then(function (html) {
          var parser = new DOMParser();
          var doc = parser.parseFromString(html, 'text/html');
          var newContent = doc.getElementById('spa-content');
          if (newContent) {
            var container = document.getElementById('spa-content');
            if (container) {
              container.innerHTML = newContent.innerHTML;
              initComponents();
              var alertBox = document.getElementById('contactAjaxAlert');
              if (alertBox) {
                alertBox.classList.remove('hidden');
                alertBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }
            }
          } else {
            contactForm.reset();
            var alertBox = document.getElementById('contactAjaxAlert');
            if (alertBox) alertBox.classList.remove('hidden');
          }
        }).catch(function (err) {
          console.error('Contact submission error:', err);
          contactForm.submit(); // fallback to standard submit if fetch fails
        }).finally(function () {
          if (submitBtn) {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
          }
        });
      });
    }
  }

  // -------------------------------------------------------------
  // SPA Router (Client-side Navigation)
  // -------------------------------------------------------------
  function updateActiveNav(path) {
    var normPath = path.replace(/\/$/, '') || '/';
    document.querySelectorAll('[data-nav-key]').forEach(function (link) {
      var href = link.getAttribute('href').replace(/\/$/, '') || '/';
      var isCurrent = (href === normPath);

      // Desktop Link classes
      if (link.classList.contains('nav-link')) {
        if (isCurrent) {
          link.classList.add('text-white', 'font-bold', 'bg-brand-red');
          link.classList.remove('text-ink-70', 'dark:text-white/70');
          var fill = link.querySelector('.fill');
          if (fill) fill.classList.add('hidden');
        } else {
          link.classList.remove('text-white', 'font-bold', 'bg-brand-red');
          link.classList.add('text-ink-70', 'dark:text-white/70');
          var fill = link.querySelector('.fill');
          if (fill) fill.classList.remove('hidden');
        }
      }
    });
  }

  function navigateTo(url, pushState) {
    if (pushState === undefined) pushState = true;
    var container = document.getElementById('spa-content');
    if (!container) {
      window.location.href = url;
      return;
    }

    // Visual transition: fade out
    container.classList.add('opacity-0');

    fetch(url)
      .then(function (res) {
        if (!res.ok) throw new Error('Network error: ' + res.status);
        return res.text();
      })
      .then(function (html) {
        var parser = new DOMParser();
        var doc = parser.parseFromString(html, 'text/html');

        var newContent = doc.getElementById('spa-content');
        if (!newContent) {
          window.location.href = url;
          return;
        }

        // Update document title
        if (doc.title) {
          document.title = doc.title;
        }

        // Swap DOM content
        container.innerHTML = newContent.innerHTML;

        // Update active nav indicators
        var urlObj = new URL(url, window.location.origin);
        updateActiveNav(urlObj.pathname);

        // Update browser URL
        if (pushState) {
          window.history.pushState({ path: url }, '', url);
        }

        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'instant' });

        // Fade in
        setTimeout(function () {
          container.classList.remove('opacity-0');
        }, 50);

        // Re-initialize page dynamic features
        initComponents();
        closeMobileNav();
      })
      .catch(function (err) {
        console.warn('SPA navigation failed, falling back to full load:', err);
        window.location.href = url;
      });
  }

  // Intercept public links for SPA routing
  document.addEventListener('click', function (e) {
    var link = e.target.closest('a');
    if (!link) return;

    var href = link.getAttribute('href');
    if (!href) return;

    // Skip special protocols or hashes
    if (href.startsWith('#') || href.startsWith('tel:') || href.startsWith('mailto:') || href.startsWith('javascript:')) {
      return;
    }

    // Skip target="_blank"
    if (link.target === '_blank') return;

    // Skip admin links or downloads
    if (href.startsWith('/admin') || href.startsWith('/static')) {
      return;
    }

    // Ensure link is on the same origin
    var linkUrl = new URL(href, window.location.origin);
    if (linkUrl.origin !== window.location.origin) {
      return;
    }

    e.preventDefault();
    navigateTo(linkUrl.pathname + linkUrl.search, true);
  });

  // Handle browser back and forward buttons
  window.addEventListener('popstate', function () {
    navigateTo(window.location.pathname + window.location.search, false);
  });

  // -------------------------------------------------------------
  // Bootstrap Application
  // -------------------------------------------------------------
  initTheme();
  initMobileNav();
  initScrollHelpers();
  initComponents();
  updateActiveNav(window.location.pathname);

})();

