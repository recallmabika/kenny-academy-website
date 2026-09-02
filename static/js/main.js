(function(){
  // mobile nav toggle
  var navToggle = document.getElementById('navToggle');
  var siteNav = document.getElementById('siteNav');
  if(navToggle){
    navToggle.addEventListener('click', function(){
      var open = siteNav.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    siteNav.querySelectorAll('a').forEach(function(a){
      a.addEventListener('click', function(){
        siteNav.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // reveal-on-scroll
  var revealEls = document.querySelectorAll('.reveal');
  if('IntersectionObserver' in window){
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, {threshold:.12});
    revealEls.forEach(function(el){ io.observe(el); });
  } else {
    revealEls.forEach(function(el){ el.classList.add('in'); });
  }

  // home hero slideshow — crossfade through slides
  var slides = document.querySelectorAll('.hero-slides .slide');
  if(slides.length > 1){
    var current = 0;
    setInterval(function(){
      slides[current].classList.remove('active');
      current = (current + 1) % slides.length;
      slides[current].classList.add('active');
    }, 5500);
  }

  // scroll-to-top button
  var scrollTopBtn = document.getElementById('scrollTop');
  if(scrollTopBtn){
    window.addEventListener('scroll', function(){
      if(window.scrollY > 480){ scrollTopBtn.classList.add('show'); }
      else{ scrollTopBtn.classList.remove('show'); }
    }, {passive:true});
    scrollTopBtn.addEventListener('click', function(){
      window.scrollTo({top:0, behavior:'smooth'});
    });
  }

  // inner-page hero image — 3D entrance on scroll into view
  var tilts = document.querySelectorAll('.page-hero .ph-image');
  if(tilts.length && 'IntersectionObserver' in window){
    var tiltIO = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if(e.isIntersecting){ e.target.classList.add('in'); tiltIO.unobserve(e.target); }
      });
    }, {threshold:.15});
    tilts.forEach(function(el){ tiltIO.observe(el); });
  } else {
    tilts.forEach(function(el){ el.classList.add('in'); });
  }

  // FLIP-animated random shuffle for gallery grids
  function flipShuffle(container, selector){
    var items = Array.from(container.querySelectorAll(selector));
    if(items.length < 2) return;
    var firstRects = new Map();
    items.forEach(function(el){ firstRects.set(el, el.getBoundingClientRect()); });

    for(var i = items.length - 1; i > 0; i--){
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = items[i]; items[i] = items[j]; items[j] = tmp;
    }
    items.forEach(function(el){ container.appendChild(el); });

    items.forEach(function(el){
      var first = firstRects.get(el);
      var last = el.getBoundingClientRect();
      var dx = first.left - last.left;
      var dy = first.top - last.top;
      if(dx || dy){
        el.style.transition = 'none';
        el.style.transform = 'translate(' + dx + 'px,' + dy + 'px)';
        el.style.zIndex = '2';
        requestAnimationFrame(function(){
          el.style.transition = 'transform 1s cubic-bezier(.16,1,.3,1)';
          el.style.transform = '';
        });
        el.addEventListener('transitionend', function handler(ev){
          if(ev.propertyName !== 'transform') return;
          el.style.zIndex = '';
          el.style.transition = '';
          el.removeEventListener('transitionend', handler);
        });
      }
    });
  }

  var homeGrid = document.querySelector('.g-grid');
  var fullGrid = document.querySelector('.g-columns');
  if(homeGrid || fullGrid){
    setInterval(function(){
      if(homeGrid) flipShuffle(homeGrid, '.g-item');
      if(fullGrid) flipShuffle(fullGrid, '.g-item:not([style*="display: none"])');
    }, 4200);
  }

  // duplicate ticker content once for seamless loop
  document.querySelectorAll('.ticker .track').forEach(function(track){
    track.innerHTML += track.innerHTML;
  });

  // tally count-up, triggered once visible
  var tallies = document.querySelectorAll('.tally .n[data-count]');
  if(tallies.length && 'IntersectionObserver' in window){
    var tIO = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if(!e.isIntersecting) return;
        tIO.unobserve(e.target);
        var el = e.target;
        var target = parseInt(el.getAttribute('data-count'), 10) || 0;
        var dur = 900, start = null;
        function step(ts){
          if(!start) start = ts;
          var p = Math.min(1, (ts - start) / dur);
          var val = Math.round(target * (1 - Math.pow(1 - p, 3)));
          el.childNodes[0].nodeValue = val;
          if(p < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
      });
    }, {threshold:.5});
    tallies.forEach(function(el){ tIO.observe(el); });
  }

  // wave headline: split into per-word spans automatically
  document.querySelectorAll('.wave').forEach(function(w){
    if(w.dataset.split) return;
    var words = w.textContent.trim().split(/\s+/);
    w.innerHTML = words.map(function(word){ return '<span>' + word + '&nbsp;</span>'; }).join('');
    w.dataset.split = 'true';
  });

  // gallery filter (gallery page)
  var filterBtns = document.querySelectorAll('.g-filter button');
  if(filterBtns.length){
    filterBtns.forEach(function(btn){
      btn.addEventListener('click', function(){
        filterBtns.forEach(function(b){ b.classList.remove('active'); });
        btn.classList.add('active');
        var cat = btn.getAttribute('data-filter');
        document.querySelectorAll('.g-columns .g-item').forEach(function(item){
          var show = (cat === 'all') || (item.getAttribute('data-cat') === cat);
          item.style.display = show ? '' : 'none';
        });
      });
    });
  }

  // contact form — client-side confirm (wired to Flask /contact POST as progressive enhancement)
  var form = document.getElementById('inquiryForm');
  if(form){
    form.addEventListener('submit', function(){
      var btn = form.querySelector('.submit-btn');
      if(btn){ btn.textContent = 'Sending…'; btn.disabled = true; }
    });
  }

  // dark / light mode toggle (persisted, and pre-set in <head> to avoid flashing)
  var themeToggle = document.getElementById('themeToggle');
  var iconSun = document.getElementById('iconSun');
  var iconMoon = document.getElementById('iconMoon');
  function syncThemeIcon(){
    var isDark = document.documentElement.classList.contains('dark');
    if(iconSun) iconSun.classList.toggle('hidden', isDark);
    if(iconMoon) iconMoon.classList.toggle('hidden', !isDark);
  }
  syncThemeIcon();
  if(themeToggle){
    themeToggle.addEventListener('click', function(){
      var root = document.documentElement;
      var nowDark = root.classList.toggle('dark');
      localStorage.setItem('theme', nowDark ? 'dark' : 'light');
      syncThemeIcon();
    });
  }

  // top-of-page scroll progress line
  var progressBar = document.getElementById('scrollProgress');
  if(progressBar){
    var ticking = false;
    function updateProgress(){
      var scrollTop = window.scrollY || document.documentElement.scrollTop;
      var docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      var pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      progressBar.style.width = Math.min(100, Math.max(0, pct)) + '%';
      ticking = false;
    }
    window.addEventListener('scroll', function(){
      if(!ticking){
        window.requestAnimationFrame(updateProgress);
        ticking = true;
      }
    }, {passive:true});
    window.addEventListener('resize', updateProgress);
    updateProgress();
  }
})();
