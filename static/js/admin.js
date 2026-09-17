/**
 * Dedicated admin panel UI controller
 */
(function () {
  'use strict';

  // Admin Theme Sync
  var themeToggle = document.getElementById('themeToggle');
  var iconSun = document.getElementById('iconSun');
  var iconMoon = document.getElementById('iconMoon');

  function syncThemeIcons() {
    var isDark = document.documentElement.classList.contains('dark');
    if (iconSun) iconSun.classList.toggle('hidden', isDark);
    if (iconMoon) iconMoon.classList.toggle('hidden', !isDark);
  }

  syncThemeIcons();

  if (themeToggle) {
    themeToggle.addEventListener('click', function () {
      var isDark = document.documentElement.classList.toggle('dark');
      try {
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
      } catch (e) {}
      syncThemeIcons();
    });
  }

  // Admin Mobile Drawer
  var adminToggle = document.getElementById('adminMobileToggle');
  var adminDrawer = document.getElementById('adminMobileDrawer');
  var adminClose = document.getElementById('adminCloseDrawer');

  if (adminToggle && adminDrawer) {
    adminToggle.addEventListener('click', function () {
      adminDrawer.classList.remove('hidden');
    });
    if (adminClose) {
      adminClose.addEventListener('click', function () {
        adminDrawer.classList.add('hidden');
      });
    }
    adminDrawer.addEventListener('click', function (e) {
      if (e.target === adminDrawer) {
        adminDrawer.classList.add('hidden');
      }
    });
  }

  // Gallery Image Upload Live Preview & Drag-and-Drop Handler
  var photoInput = document.getElementById('photoInput');
  var dropZone = document.getElementById('dropZone');
  var dropPrompt = document.getElementById('dropPrompt');
  var dropPreview = document.getElementById('dropPreview');
  var previewImg = document.getElementById('previewImg');
  var previewName = document.getElementById('previewName');

  if (photoInput && dropZone) {
    // Visual drag states
    ['dragenter', 'dragover'].forEach(function (eventName) {
      dropZone.addEventListener(eventName, function (e) {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.add('border-brand-red', 'bg-brand-red/5');
      });
    });

    ['dragleave', 'drop'].forEach(function (eventName) {
      dropZone.addEventListener(eventName, function (e) {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.remove('border-brand-red', 'bg-brand-red/5');
      });
    });

    // File selected via browsing or drop
    photoInput.addEventListener('change', function () {
      if (this.files && this.files[0]) {
        var file = this.files[0];
        if (!file.type.startsWith('image/')) {
          alert('Please select an image file (PNG, JPG, WebP, GIF).');
          this.value = '';
          return;
        }

        var reader = new FileReader();
        reader.onload = function (e) {
          if (previewImg) previewImg.src = e.target.result;
          if (previewName) previewName.textContent = file.name + ' (' + (file.size / 1024).toFixed(1) + ' KB)';
          if (dropPrompt) dropPrompt.classList.add('hidden');
          if (dropPreview) dropPreview.classList.remove('hidden');
        };
        reader.readAsDataURL(file);
      }
    });
  }
})();
