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
})();
