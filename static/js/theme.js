/**
 * Dedicated script loaded in <head> to apply saved theme before first paint,
 * completely avoiding flash of unstyled theme (FOUT).
 */
(function () {
  'use strict';
  try {
    var saved = localStorage.getItem('theme');
    var dark = saved ? saved === 'dark' : (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (dark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  } catch (e) {
    // Fallback gracefully if localStorage is restricted
  }
})();
