document.addEventListener('DOMContentLoaded', function() {
    // Создаем кнопку поиска в навигации
    const nav = document.querySelector('nav ul');
    if (nav) {
        const searchLi = document.createElement('li');
        searchLi.className = 'search-nav-item';
        searchLi.innerHTML = `
            <button class="search-toggle-btn" aria-label="Открыть поиск">
                <i class="fas fa-search"></i>
            </button>
        `;
        nav.appendChild(searchLi);
        
        // Создаем компактную форму поиска
        const searchForm = document.createElement('div');
        searchForm.className = 'nav-search-form';
        searchForm.innerHTML = `
            <div class="nav-search-container">
                <input type="text" 
                       class="nav-search-input" 
                       placeholder="Поиск по сайту..." 
                       aria-label="Поиск по сайту">
                <button class="nav-search-close" aria-label="Закрыть поиск">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="nav-search-results"></div>
        `;
        nav.parentElement.appendChild(searchForm);
        
        const searchToggle = searchLi.querySelector('.search-toggle-btn');
        const searchInput = searchForm.querySelector('.nav-search-input');
        const searchClose = searchForm.querySelector('.nav-search-close');
        const searchResults = searchForm.querySelector('.nav-search-results');
        
        // Функция поиска
        async function performSearch(query) {
            if (!query.trim()) {
                searchResults.innerHTML = '';
                return;
            }
            
            try {
                const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
                const results = await response.json();
                
                if (results.length === 0) {
                    searchResults.innerHTML = '<div class="search-no-results">Ничего не найдено</div>';
                } else {
                    searchResults.innerHTML = results.map(result => `
                        <a href="${result.url}" class="nav-search-result">
                            <div class="search-result-title">${result.title}</div>
                            ${result.snippet ? `<div class="search-result-snippet">${result.snippet}</div>` : ''}
                        </a>
                    `).join('');
                }
            } catch (error) {
                console.error('Ошибка поиска:', error);
                searchResults.innerHTML = '<div class="search-error">Ошибка поиска</div>';
            }
        }
        
        // Debounce для поиска
        let searchTimeout;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                performSearch(e.target.value);
            }, 300);
        });
        
        // Открытие/закрытие поиска
        searchToggle.addEventListener('click', () => {
            searchForm.classList.add('active');
            searchInput.focus();
        });
        
        searchClose.addEventListener('click', () => {
            searchForm.classList.remove('active');
            searchInput.value = '';
            searchResults.innerHTML = '';
        });
        
        // Закрытие по Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && searchForm.classList.contains('active')) {
                searchForm.classList.remove('active');
                searchInput.value = '';
                searchResults.innerHTML = '';
            }
        });
        
        // Закрытие при клике вне формы
        document.addEventListener('click', (e) => {
            if (!searchForm.contains(e.target) && !searchToggle.contains(e.target)) {
                searchForm.classList.remove('active');
            }
        });
    }
});