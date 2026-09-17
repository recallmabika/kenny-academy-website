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
  function toggleMobileNav(force) {
    var navToggle = document.getElementById('navToggle');
    var mobileDrawer = document.getElementById('mobileDrawer');
    if (!mobileDrawer) return;

    var willOpen = (typeof force === 'boolean') ? force : mobileDrawer.classList.contains('hidden');
    if (willOpen) {
      mobileDrawer.classList.remove('hidden');
    } else {
      mobileDrawer.classList.add('hidden');
    }
    if (navToggle) {
      navToggle.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
    }
  }

  function closeMobileNav() {
    toggleMobileNav(false);
  }

  function initMobileNav() {
    var navToggle = document.getElementById('navToggle');
    if (navToggle && !navToggle._bound) {
      navToggle._bound = true;
      navToggle.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        toggleMobileNav();
      });
    }

    // Close mobile drawer when clicking outside the header
    if (!document._mobileNavOutsideBound) {
      document._mobileNavOutsideBound = true;
      document.addEventListener('click', function (e) {
        var header = document.querySelector('header');
        if (header && !header.contains(e.target)) {
          closeMobileNav();
        }
      });
    }
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

    // 5. Contact Form submission (Seamless AJAX with spinner animation)
    var contactForm = document.getElementById('inquiryForm');
    if (contactForm && !contactForm._bound) {
      contactForm._bound = true;
      contactForm.addEventListener('submit', function (ev) {
        ev.preventDefault();
        var submitBtn = contactForm.querySelector('.submit-btn');
        var spinner = submitBtn ? submitBtn.querySelector('.spinner') : null;
        var label = submitBtn ? submitBtn.querySelector('.btn-label') : null;
        var formAlert = document.getElementById('contactFormAlert');

        if (submitBtn) {
          submitBtn.disabled = true;
          if (spinner) spinner.classList.remove('hidden');
          if (label) label.textContent = 'Sending…';
        }
        if (formAlert) {
          formAlert.classList.add('hidden');
        }

        var alertTimeout = null;
        var formData = new FormData(contactForm);
        fetch(contactForm.action, {
          method: 'POST',
          body: formData,
          headers: { 'X-Requested-With': 'XMLHttpRequest' }
        }).then(function (res) {
          return res.text();
        }).then(function () {
          contactForm.reset();
          if (formAlert) {
            formAlert.classList.remove('hidden', 'opacity-0');
            formAlert.classList.add('opacity-100');
            formAlert.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

            if (alertTimeout) clearTimeout(alertTimeout);
            alertTimeout = setTimeout(function () {
              formAlert.classList.remove('opacity-100');
              formAlert.classList.add('opacity-0');
              setTimeout(function () {
                formAlert.classList.add('hidden');
              }, 300);
            }, 5000);
          }
        }).catch(function (err) {
          console.error('Contact submission error:', err);
          if (formAlert) {
            formAlert.textContent = '⚠ Could not submit inquiry. Please try again or reach us by phone.';
            formAlert.classList.remove('hidden', 'opacity-0', 'border-emerald-500', 'bg-emerald-500/10', 'text-emerald-700', 'dark:text-emerald-400');
            formAlert.classList.add('opacity-100', 'border-brand-red', 'bg-brand-red/10', 'text-brand-red');
            if (alertTimeout) clearTimeout(alertTimeout);
            alertTimeout = setTimeout(function () {
              formAlert.classList.remove('opacity-100');
              formAlert.classList.add('opacity-0');
              setTimeout(function () {
                formAlert.classList.add('hidden');
              }, 300);
            }, 5000);
          }
        }).finally(function () {
          if (submitBtn) {
            submitBtn.disabled = false;
            if (spinner) spinner.classList.add('hidden');
            if (label) label.textContent = 'Send inquiry';
          }
        });
      });
    }

    // 6. Footer Newsletter Subscribe (Auto-dismiss and AJAX handling)
    var subFeedback = document.getElementById('subscribeFeedback');
    if (subFeedback && subFeedback.querySelector('p')) {
      setTimeout(function () {
        subFeedback.classList.add('opacity-0');
        setTimeout(function () {
          subFeedback.innerHTML = '';
          subFeedback.classList.remove('opacity-0');
          // Clean up URL parameter (?sub=...) seamlessly without reload
          if (window.location.search.includes('sub=')) {
            var cleanUrl = window.location.pathname + window.location.search.replace(/[?&]sub=[^&]+/, '').replace(/^&/, '?');
            if (cleanUrl.endsWith('?')) cleanUrl = cleanUrl.slice(0, -1);
            window.history.replaceState({}, '', cleanUrl || window.location.pathname);
          }
        }, 300);
      }, 5000);
    }

    var subscribeForm = document.getElementById('footerSubscribeForm');
    if (subscribeForm && !subscribeForm._bound) {
      subscribeForm._bound = true;
      subscribeForm.addEventListener('submit', function (ev) {
        ev.preventDefault();
        var subInput = subscribeForm.querySelector('#subEmail');
        var subBtn = subscribeForm.querySelector('button[type="submit"]');
        var email = subInput ? subInput.value.trim() : '';
        if (!email) return;

        var origBtnText = subBtn ? subBtn.textContent : 'Subscribe';
        if (subBtn) {
          subBtn.textContent = '...';
          subBtn.disabled = true;
        }

        var formData = new FormData(subscribeForm);
        fetch(subscribeForm.action, {
          method: 'POST',
          body: formData,
          headers: { 'X-Requested-With': 'XMLHttpRequest' }
        }).then(function (res) {
          var redirectUrl = res.url || '';
          var message = 'Subscribed — check your inbox.';
          var colorClass = 'text-brand-red';

          if (redirectUrl.includes('sub=exists')) {
            message = 'That email is already subscribed.';
            colorClass = 'text-white/70';
          } else if (redirectUrl.includes('sub=invalid')) {
            message = 'Please enter a valid email.';
            colorClass = 'text-brand-red';
          }

          if (subFeedback) {
            subFeedback.innerHTML = '<p class="mt-2 text-[11.5px] ' + colorClass + '">' + message + '</p>';
            subFeedback.classList.remove('opacity-0');
            setTimeout(function () {
              subFeedback.classList.add('opacity-0');
              setTimeout(function () {
                subFeedback.innerHTML = '';
                subFeedback.classList.remove('opacity-0');
              }, 300);
            }, 5000);
          }
          subscribeForm.reset();
        }).catch(function (err) {
          console.error('Subscription error:', err);
          subscribeForm.submit();
        }).finally(function () {
          if (subBtn) {
            subBtn.textContent = origBtnText;
            subBtn.disabled = false;
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
          link.classList.remove('text-ink-70', 'dark:text-white/70', 'hover:text-white');
          var fill = link.querySelector('.fill');
          if (fill) fill.classList.add('hidden');
        } else {
          link.classList.remove('text-white', 'font-bold', 'bg-brand-red');
          link.classList.add('text-ink-70', 'dark:text-white/70');
          var fill = link.querySelector('.fill');
          if (fill) fill.classList.remove('hidden');
        }
      }
      // Mobile drawer links
      if (link.closest('#mobileDrawer')) {
        if (isCurrent) {
          link.className = 'nav-drawer-link block py-3 px-4 border-l-4 text-[15px] font-mono tracking-wide transition-colors font-bold text-white bg-brand-red border-ink dark:border-white shadow-sm';
        } else {
          link.className = 'nav-drawer-link block py-3 px-4 border-l-4 text-[15px] font-mono tracking-wide transition-colors text-ink dark:text-white border-transparent hover:bg-black/5 dark:hover:bg-white/10 hover:text-brand-red';
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

