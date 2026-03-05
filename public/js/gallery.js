/**
 * Gallery — category filter + lightbox
 * Vanilla JS, no dependencies
 */
(function () {
  'use strict';

  /* =====================
     DOM Cache
     ===================== */
  const grid        = document.getElementById('album-grid');
  const lightbox    = document.getElementById('lightbox');
  const lbImg       = document.getElementById('lightbox-img');
  const lbTitle     = document.getElementById('lightbox-title');
  const lbDesc      = document.getElementById('lightbox-desc');
  const lbCounter   = document.getElementById('lightbox-counter');
  const lbClose     = document.getElementById('lightbox-close');
  const lbPrev      = document.getElementById('lightbox-prev');
  const lbNext      = document.getElementById('lightbox-next');
  const emptyState  = document.getElementById('album-empty');
  const photoCount  = document.getElementById('photo-count');

  if (!grid || !lightbox) return;

  /* =====================
     Category Filtering
     ===================== */
  const filters = document.querySelectorAll('.album-filter');
  let activeCategory = 'all';

  function applyFilter(category) {
    activeCategory = category;
    const items = grid.querySelectorAll('.album-item');
    let visible = 0;

    items.forEach(function (item) {
      var match = category === 'all' || item.dataset.category === category;
      item.classList.toggle('hidden', !match);
      if (match) visible++;
    });

    // Update counter
    if (photoCount) photoCount.textContent = visible;

    // Empty state
    if (emptyState) {
      emptyState.style.display = visible === 0 ? 'block' : 'none';
    }

    // Update active tab
    filters.forEach(function (btn) {
      var isActive = btn.dataset.category === category;
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });

    // Reset visible indices for lightbox
    buildVisibleList();
  }

  filters.forEach(function (btn) {
    btn.addEventListener('click', function () {
      applyFilter(btn.dataset.category);
    });
  });

  /* =====================
     Visible Items List
     ===================== */
  var visibleItems = [];

  function buildVisibleList() {
    visibleItems = [];
    grid.querySelectorAll('.album-item:not(.hidden)').forEach(function (item) {
      visibleItems.push(item);
    });
  }

  buildVisibleList();

  /* =====================
     Lightbox Logic
     ===================== */
  var currentIndex = 0;

  function openLightbox(item) {
    var idx = visibleItems.indexOf(item);
    if (idx === -1) return;
    currentIndex = idx;
    showPhoto(currentIndex);
    lightbox.classList.add('active');
    document.body.classList.add('lightbox-open');
    lbImg.focus();
  }

  function closeLightbox() {
    lightbox.classList.remove('active');
    document.body.classList.remove('lightbox-open');
  }

  function showPhoto(idx) {
    if (idx < 0 || idx >= visibleItems.length) return;
    currentIndex = idx;
    var item = visibleItems[idx];
    var img = item.querySelector('img');
    var titleEl = item.querySelector('.album-item__title');
    var descEl = item.querySelector('.album-item__desc');

    // Loading state
    lbImg.classList.add('loading');
    lbImg.onload = function () { lbImg.classList.remove('loading'); };
    lbImg.src = img.src;
    lbImg.alt = img.alt;

    lbTitle.textContent = titleEl ? titleEl.textContent : '';
    lbDesc.textContent = descEl ? descEl.textContent : '';
    lbCounter.textContent = (idx + 1) + ' / ' + visibleItems.length;

    // Toggle nav visibility
    lbPrev.style.visibility = idx > 0 ? 'visible' : 'hidden';
    lbNext.style.visibility = idx < visibleItems.length - 1 ? 'visible' : 'hidden';
  }

  function nextPhoto() {
    if (currentIndex < visibleItems.length - 1) showPhoto(currentIndex + 1);
  }

  function prevPhoto() {
    if (currentIndex > 0) showPhoto(currentIndex - 1);
  }

  /* =====================
     Event Listeners
     ===================== */

  // Click on photo card
  grid.addEventListener('click', function (e) {
    var item = e.target.closest('.album-item');
    if (item) openLightbox(item);
  });

  // Close
  lbClose.addEventListener('click', closeLightbox);

  // Click on backdrop
  lightbox.addEventListener('click', function (e) {
    if (e.target === lightbox || e.target.id === 'lightbox-content') {
      closeLightbox();
    }
  });

  // Navigation buttons
  lbPrev.addEventListener('click', function (e) {
    e.stopPropagation();
    prevPhoto();
  });

  lbNext.addEventListener('click', function (e) {
    e.stopPropagation();
    nextPhoto();
  });

  // Keyboard
  document.addEventListener('keydown', function (e) {
    if (!lightbox.classList.contains('active')) return;
    switch (e.key) {
      case 'Escape':    closeLightbox(); break;
      case 'ArrowLeft': prevPhoto();     break;
      case 'ArrowRight':nextPhoto();     break;
    }
  });

  /* =====================
     Touch / Swipe Support
     ===================== */
  var touchStartX = 0;
  var touchStartY = 0;
  var swiping = false;

  lightbox.addEventListener('touchstart', function (e) {
    if (e.touches.length === 1) {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      swiping = true;
    }
  }, { passive: true });

  lightbox.addEventListener('touchend', function (e) {
    if (!swiping) return;
    swiping = false;
    var dx = e.changedTouches[0].clientX - touchStartX;
    var dy = e.changedTouches[0].clientY - touchStartY;

    // Only horizontal swipe (ignore vertical scroll)
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      if (dx > 0) prevPhoto();
      else nextPhoto();
    }
  }, { passive: true });

  // Prevent image drag
  lbImg.addEventListener('dragstart', function (e) { e.preventDefault(); });

})();
