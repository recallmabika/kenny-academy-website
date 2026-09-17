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

  // Auto-dismiss alert/error/flash messages after 5 seconds
  var alerts = document.querySelectorAll('.admin-flash, .admin-error');
  alerts.forEach(function (el) {
    setTimeout(function () {
      el.classList.add('opacity-0');
      setTimeout(function () {
        el.classList.add('hidden');
      }, 300);
    }, 5000);
  });

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
          showAdminToast('Please select an image file (PNG, JPG, WebP, GIF).');
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

  // -------------------------------------------------------------
  // Custom Toast Message System (Replaces browser alert())
  // -------------------------------------------------------------
  var toastTimer = null;
  function showAdminToast(message) {
    var toast = document.getElementById('customToast');
    var toastText = document.getElementById('customToastText');
    if (!toast || !toastText) {
      return;
    }
    toastText.textContent = message;
    toast.classList.remove('hidden', 'opacity-0', 'translate-y-4');
    toast.classList.add('opacity-100', 'translate-y-0');

    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toast.classList.remove('opacity-100', 'translate-y-0');
      toast.classList.add('opacity-0', 'translate-y-4');
      setTimeout(function () {
        toast.classList.add('hidden');
      }, 300);
    }, 4500);
  }

  var toastCloseBtn = document.getElementById('customToastClose');
  if (toastCloseBtn) {
    toastCloseBtn.addEventListener('click', function () {
      var toast = document.getElementById('customToast');
      if (toast) {
        toast.classList.add('hidden');
      }
    });
  }

  // Expose toast on window
  window.adminToast = showAdminToast;

  // -------------------------------------------------------------
  // Custom Branded Modal Dialog System (Replaces browser confirm())
  // -------------------------------------------------------------
  var confirmModal = document.getElementById('customConfirmModal');
  var confirmTitle = document.getElementById('confirmModalTitle');
  var confirmText = document.getElementById('confirmModalText');
  var confirmCancel = document.getElementById('confirmModalCancel');
  var confirmOk = document.getElementById('confirmModalOk');
  var pendingAction = null;

  function openConfirmModal(message, onOk, actionLabel) {
    if (!confirmModal) {
      if (onOk) onOk();
      return;
    }
    if (confirmText) confirmText.textContent = message || 'Are you sure you want to proceed?';
    if (confirmOk) confirmOk.textContent = actionLabel || 'Remove';
    pendingAction = onOk;
    confirmModal.classList.remove('hidden');
  }

  function closeConfirmModal() {
    if (confirmModal) confirmModal.classList.add('hidden');
    pendingAction = null;
  }

  if (confirmCancel) {
    confirmCancel.addEventListener('click', closeConfirmModal);
  }

  if (confirmOk) {
    confirmOk.addEventListener('click', function () {
      if (typeof pendingAction === 'function') {
        var action = pendingAction;
        closeConfirmModal();
        action();
      } else {
        closeConfirmModal();
      }
    });
  }

  if (confirmModal) {
    confirmModal.addEventListener('click', function (e) {
      if (e.target === confirmModal) {
        closeConfirmModal();
      }
    });
  }

  // Intercept all submit and click handlers that used inline confirm()
  document.addEventListener('submit', function (e) {
    var form = e.target;
    if (!form || form._confirmed) return;

    var onsubmitAttr = form.getAttribute('onsubmit') || '';
    if (onsubmitAttr.includes('confirm(')) {
      e.preventDefault();
      e.stopPropagation();

      // Extract message from confirm('...') or confirm("...")
      var match = onsubmitAttr.match(/confirm\((['"])(.*?)\1\)/);
      var msg = match ? match[2].replace(/&quot;/g, '"') : 'Are you sure you want to remove this?';

      openConfirmModal(msg, function () {
        form._confirmed = true;
        form.removeAttribute('onsubmit');
        form.submit();
      }, 'Remove');
    }
  }, true);

  document.addEventListener('click', function (e) {
    var btn = e.target.closest('button[onclick*="confirm("], input[type="submit"][onclick*="confirm("]');
    if (!btn || btn._confirmed) return;

    var onclickAttr = btn.getAttribute('onclick') || '';
    if (onclickAttr.includes('confirm(')) {
      e.preventDefault();
      e.stopPropagation();

      var match = onclickAttr.match(/confirm\((['"])(.*?)\1\)/);
      var msg = match ? match[2].replace(/&quot;/g, '"') : 'Are you sure you want to remove this?';

      openConfirmModal(msg, function () {
        btn._confirmed = true;
        btn.removeAttribute('onclick');
        if (btn.getAttribute('formaction')) {
          var form = btn.closest('form');
          if (form) {
            form.action = btn.getAttribute('formaction');
            form.submit();
            return;
          }
        }
        btn.click();
      }, 'Remove');
    }
  }, true);

  // Profile Dropdown & Quick Avatar Upload Handler
  var profileBtn = document.getElementById('profileDropdownBtn');
  var profileMenu = document.getElementById('profileDropdownMenu');
  var quickAvatarInput = document.getElementById('quickAvatarInput');
  var quickAvatarLabel = document.getElementById('quickAvatarLabel');
  var quickAvatarBtn = document.getElementById('quickAvatarBtn');
  var dropdownAvatarImg = document.getElementById('dropdownAvatarImg');
  var topbarAvatarImg = document.getElementById('topbarAvatarImg');

  if (profileBtn && profileMenu) {
    profileBtn.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      profileMenu.classList.toggle('hidden');
    });

    // Close when clicking outside
    document.addEventListener('click', function (e) {
      if (!profileMenu.classList.contains('hidden')) {
        var wrapper = document.getElementById('profileDropdownWrapper');
        if (wrapper && !wrapper.contains(e.target)) {
          profileMenu.classList.add('hidden');
        }
      }
    });
  }

  if (quickAvatarInput) {
    quickAvatarInput.addEventListener('change', function () {
      if (this.files && this.files[0]) {
        var file = this.files[0];
        if (quickAvatarLabel) {
          quickAvatarLabel.textContent = file.name;
        }
        if (quickAvatarBtn) {
          quickAvatarBtn.classList.remove('hidden');
        }
        var reader = new FileReader();
        reader.onload = function (e) {
          if (dropdownAvatarImg) dropdownAvatarImg.src = e.target.result;
          if (topbarAvatarImg) topbarAvatarImg.src = e.target.result;
        };
        reader.readAsDataURL(file);
      }
    });
  }
})();
