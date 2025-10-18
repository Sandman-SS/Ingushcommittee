// Файл: /public/js/search.js

document.addEventListener('DOMContentLoaded', function() {
    // Создаем элементы поиска
    const searchButton = document.createElement('button');
    searchButton.className = 'search-toggle';
    searchButton.innerHTML = '<i class="fas fa-search"></i>';
    searchButton.setAttribute('aria-label', 'Открыть поиск');
    
    const searchOverlay = document.createElement('div');
    searchOverlay.className = 'search-overlay';
    searchOverlay.innerHTML = `
        <div class="search-container">
            <button class="search-close" aria-label="Закрыть поиск">
                <i class="fas fa-times"></i>
            </button>
            <h2>Поиск по сайту</h2>
            <form class="search-form" id="searchForm">
                <input type="text" id="searchInput" placeholder="Введите поисковый запрос..." autocomplete="off">
                <button type="submit"><i class="fas fa-search"></i> Искать</button>
            </form>
            <div id="searchResults" class="search-results"></div>
        </div>
    `;
    
    // Добавляем элементы на страницу
    const nav = document.querySelector('nav');
    if (nav) {
        nav.appendChild(searchButton);
    }
    document.body.appendChild(searchOverlay);
    
    // Данные для поиска (в реальном приложении это бы загружалось с сервера)
    const searchData = [
        { title: 'Главная', url: '/', content: 'Комитет Ингушской Независимости официальный сайт' },
        { title: 'О комитете', url: '/about', content: 'Информация о комитете ингушской независимости' },
        { title: 'Наша миссия', url: '/about/mission', content: 'Миссия и цели комитета' },
        { title: 'История', url: '/about/history', content: 'История создания и развития комитета' },
        { title: 'Наши цели', url: '/about/goals', content: 'Основные цели и задачи организации' },
        { title: 'Деятельность', url: '/activities', content: 'Направления деятельности комитета' },
        { title: 'Проекты', url: '/activities/projects', content: 'Текущие и завершенные проекты' },
        { title: 'Культура', url: '/activities/culture', content: 'Культурные мероприятия и инициативы' },
        { title: 'Образование', url: '/activities/education', content: 'Образовательные программы' },
        { title: 'Защита прав', url: '/activities/rights', content: 'Правозащитная деятельность' },
        { title: 'Международное сотрудничество', url: '/activities/international', content: 'Международные связи и партнерство' },
        { title: 'Карта', url: '/map', content: 'Интерактивная карта исторических мест Ингушетии' },
        { title: 'Контакты', url: '/contact', content: 'Связаться с нами telegram youtube' }
    ];
    
    // Обработчики событий
    searchButton.addEventListener('click', openSearch);
    searchOverlay.querySelector('.search-close').addEventListener('click', closeSearch);
    searchOverlay.addEventListener('click', function(e) {
        if (e.target === searchOverlay) {
            closeSearch();
        }
    });
    
    // Поиск
    const searchForm = document.getElementById('searchForm');
    const searchInput = document.getElementById('searchInput');
    const searchResults = document.getElementById('searchResults');
    
    searchForm.addEventListener('submit', function(e) {
        e.preventDefault();
        performSearch();
    });
    
    searchInput.addEventListener('input', debounce(performSearch, 300));
    
    function openSearch() {
        searchOverlay.classList.add('active');
        searchInput.focus();
        document.body.style.overflow = 'hidden';
    }
    
    function closeSearch() {
        searchOverlay.classList.remove('active');
        searchInput.value = '';
        searchResults.innerHTML = '';
        document.body.style.overflow = '';
    }
    
    function performSearch() {
        const query = searchInput.value.trim().toLowerCase();
        
        if (query.length < 2) {
            searchResults.innerHTML = '<p class="no-results">Введите минимум 2 символа для поиска</p>';
            return;
        }
        
        const results = searchData.filter(item => {
            return item.title.toLowerCase().includes(query) || 
                   item.content.toLowerCase().includes(query);
        });
        
        if (results.length === 0) {
            searchResults.innerHTML = '<p class="no-results">Ничего не найдено</p>';
            return;
        }
        
        let html = `<p class="results-count">Найдено результатов: ${results.length}</p>`;
        
        results.forEach(result => {
            const highlightedTitle = highlightText(result.title, query);
            const highlightedContent = highlightText(result.content, query);
            
            html += `
                <div class="search-result-item">
                    <h3><a href="${result.url}">${highlightedTitle}</a></h3>
                    <p>${highlightedContent}</p>
                </div>
            `;
        });
        
        searchResults.innerHTML = html;
    }
    
    function highlightText(text, query) {
        const regex = new RegExp(`(${escapeRegex(query)})`, 'gi');
        return text.replace(regex, '<mark>$1</mark>');
    }
    
    function escapeRegex(str) {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
    
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    
    // Горячие клавиши
    document.addEventListener('keydown', function(e) {
        // Ctrl+K или Cmd+K для открытия поиска
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            openSearch();
        }
        // Escape для закрытия
        if (e.key === 'Escape' && searchOverlay.classList.contains('active')) {
            closeSearch();
        }
    });
});