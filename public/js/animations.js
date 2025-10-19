// Файл: /public/js/animations.js

document.addEventListener('DOMContentLoaded', function() {
  const fadeElements = document.querySelectorAll('.fade-in');
  setTimeout(function() {
    fadeElements.forEach(element => {
      element.classList.add('active');
    });
  }, 100);
});