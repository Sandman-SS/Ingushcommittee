// Файл: /public/js/navigation.js

document.addEventListener('DOMContentLoaded', function() {
  // Добавление активного класса для текущей страницы
  const currentLocation = window.location.pathname;
  const navLinks = document.querySelectorAll('nav a');
  
  navLinks.forEach(link => {
    const linkPath = link.getAttribute('href');
    
    // Проверка, является ли текущий путь совпадающим с ссылкой
    if (linkPath === currentLocation || 
        (linkPath !== '/' && currentLocation.startsWith(linkPath))) {
      link.classList.add('active');
    }
  });
  
  // Исправление для выпадающего меню - добавляем небольшую задержку
  const dropdowns = document.querySelectorAll('nav .dropdown');
  
  dropdowns.forEach(dropdown => {
    // Добавляем задержку при уходе мыши
    dropdown.addEventListener('mouseleave', function() {
      const dropdownContent = this.querySelector('.dropdown-content');
      if (dropdownContent) {
        dropdownContent.style.opacity = '0';
        setTimeout(() => {
          if (!this.matches(':hover')) {
            dropdownContent.style.display = 'none';
          }
        }, 300);
      }
    });
    
    // Сразу показываем при наведении
    dropdown.addEventListener('mouseenter', function() {
      const dropdownContent = this.querySelector('.dropdown-content');
      if (dropdownContent) {
        dropdownContent.style.display = 'block';
        setTimeout(() => {
          dropdownContent.style.opacity = '1';
        }, 10);
      }
    });
  });
});

// Обновление файла navigation.js - добавьте этот код в конец файла

document.addEventListener('DOMContentLoaded', function() {
  // Код для мобильного меню
  const navToggle = document.createElement('button');
  navToggle.className = 'nav-toggle';
  navToggle.innerHTML = '<i class="fas fa-bars"></i>';
  
  const nav = document.querySelector('nav');
  const navUl = nav.querySelector('ul');
  
  nav.insertBefore(navToggle, navUl);
  
  navToggle.addEventListener('click', function() {
    navUl.classList.toggle('show');
    
    // Изменяем иконку при открытии/закрытии меню
    const icon = this.querySelector('i');
    if (navUl.classList.contains('show')) {
      icon.classList.remove('fa-bars');
      icon.classList.add('fa-times');
    } else {
      icon.classList.remove('fa-times');
      icon.classList.add('fa-bars');
    }
  });
  
  // Закрытие меню при клике вне навигации
  document.addEventListener('click', function(event) {
    if (!nav.contains(event.target) && navUl.classList.contains('show')) {
      navUl.classList.remove('show');
      const icon = navToggle.querySelector('i');
      icon.classList.remove('fa-times');
      icon.classList.add('fa-bars');
    }
  });
  
  // Обработка кликов по выпадающим меню на мобильных устройствах
  if (window.innerWidth <= 768) {
    const dropdownLinks = document.querySelectorAll('nav .dropdown > a');
    
    dropdownLinks.forEach(link => {
      link.addEventListener('click', function(e) {
        // Предотвращаем переход по ссылке
        e.preventDefault();
        
        // Закрываем все другие подменю
        const dropdownContents = document.querySelectorAll('nav .dropdown-content');
        dropdownContents.forEach(content => {
          if (content !== this.nextElementSibling) {
            content.style.display = 'none';
          }
        });
        
        // Открываем/закрываем текущее подменю
        const dropdownContent = this.nextElementSibling;
        if (dropdownContent.style.display === 'block') {
          dropdownContent.style.display = 'none';
        } else {
          dropdownContent.style.display = 'block';
        }
      });
    });
  }
});