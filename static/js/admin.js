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
})();
