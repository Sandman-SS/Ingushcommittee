document.addEventListener('DOMContentLoaded', function() {
    // Создаем элементы управления в навигации
    createNavigationControls();

    // Инициализируем все компоненты
    initLanguageSwitcher();
    initSearchToggle();
    initAnimations();
});

function createNavigationControls() {
    const nav = document.querySelector('nav ul');
    if (!nav) return;

    // Создаем контейнер для элементов управления
    const controlsContainer = document.createElement('li');
    controlsContainer.className = 'nav-controls-container';
    controlsContainer.innerHTML = `
        <div class="nav-controls">
            <!-- Переключатель языков -->
            <div class="language-switcher">
                <button class="lang-toggle enhanced-btn" aria-label="Выбрать язык">
                    <span class="lang-flag animated-icon">
                        ${getCurrentLanguageFlag()}
                    </span>
                    <span class="current-lang">${getCurrentLanguageName()}</span>
                    <i class="fas fa-chevron-down animated-icon"></i>
                </button>
                <div class="lang-dropdown enhanced-dropdown" role="menu">
                    <a href="?lang=ru" class="lang-option enhanced-option ${document.documentElement.lang === 'ru' ? 'active' : ''}" role="menuitem">
                        <span class="lang-flag">🇷🇺</span>
                        <span>Русский</span>
                    </a>
                    <a href="?lang=en" class="lang-option enhanced-option ${document.documentElement.lang === 'en' ? 'active' : ''}" role="menuitem">
                        <span class="lang-flag">🇬🇧</span>
                        <span>English</span>
                    </a>
                    <a href="?lang=inh" class="lang-option enhanced-option ${document.documentElement.lang === 'inh' ? 'active' : ''}" role="menuitem">
                        <span class="lang-flag">⚪</span>
                        <span>ГӀалгӀай</span>
                    </a>
                </div>
            </div>

            <!-- Кнопка поиска -->
            <button class="search-toggle-btn enhanced-btn" aria-label="Открыть поиск">
                <i class="fas fa-search animated-icon"></i>
            </button>
        </div>
    `;
    
    nav.appendChild(controlsContainer);
    
    // Создаем форму поиска
    createSearchForm();
}

function getCurrentLanguageFlag() {
    const lang = document.documentElement.lang || 'ru';
    const flags = {
        'ru': '🇷🇺',
        'en': '🇬🇧',
        'inh': '⚪'
    };
    return flags[lang] || '🇷🇺';
}

function getCurrentLanguageName() {
    const lang = document.documentElement.lang || 'ru';
    const names = {
        'ru': 'РУС',
        'en': 'ENG',
        'inh': 'ИНГ'
    };
    return names[lang] || 'РУС';
}

function createSearchForm() {
    const navContainer = document.querySelector('nav');
    if (!navContainer) return;
    
    const searchForm = document.createElement('div');
    searchForm.className = 'nav-search-form enhanced-search';
    searchForm.innerHTML = `
        <div class="nav-search-container">
            <input type="text" 
                   class="nav-search-input" 
                   placeholder="Поиск по сайту..." 
                   aria-label="Поиск по сайту">
            <button class="nav-search-close enhanced-btn" aria-label="Закрыть поиск">
                <i class="fas fa-times animated-icon"></i>
            </button>
        </div>
        <div class="nav-search-results"></div>
    `;
    
    navContainer.appendChild(searchForm);
}

function initLanguageSwitcher() {
    const langOptions = document.querySelectorAll('.lang-option');
    
    langOptions.forEach(option => {
        option.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Анимация клика
            this.style.transform = 'scale(0.95) translateX(5px)';
            setTimeout(() => {
                this.style.transform = '';
            }, 150);
            
            const lang = new URL(this.href).searchParams.get('lang');
            
            // Сохраняем выбор в cookie
            document.cookie = `lang=${lang};path=/;max-age=31536000`;
            
            // Плавный переход
            document.body.style.opacity = '0.8';
            setTimeout(() => {
                window.location.href = this.href;
            }, 200);
        });
    });
}

function initSearchToggle() {
    const searchToggle = document.querySelector('.search-toggle-btn');
    const searchForm = document.querySelector('.nav-search-form');
    const searchClose = document.querySelector('.nav-search-close');
    const searchInput = document.querySelector('.nav-search-input');
    const searchResults = document.querySelector('.nav-search-results');
    
    if (!searchToggle || !searchForm) return;
    
    // Открытие поиска
    searchToggle.addEventListener('click', function(e) {
        e.preventDefault();
        
        // Анимация кнопки
        this.style.transform = 'scale(1.1)';
        setTimeout(() => {
            this.style.transform = '';
        }, 200);
        
        searchForm.classList.add('active');
        setTimeout(() => {
            searchInput.focus();
        }, 300);
    });
    
    // Закрытие поиска
    if (searchClose) {
        searchClose.addEventListener('click', function() {
            searchForm.classList.remove('active');
            searchInput.value = '';
            searchResults.innerHTML = '';
        });
    }
    
    // Поиск
    let searchTimeout;
    if (searchInput) {
        searchInput.addEventListener('input', function(e) {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                performSearch(e.target.value);
            }, 300);
        });
    }
    
    // Закрытие по Escape
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && searchForm.classList.contains('active')) {
            searchForm.classList.remove('active');
            searchInput.value = '';
            searchResults.innerHTML = '';
        }
    });
    
    // Закрытие при клике вне формы
    document.addEventListener('click', function(e) {
        if (!searchForm.contains(e.target) && !searchToggle.contains(e.target)) {
            searchForm.classList.remove('active');
        }
    });
}

async function performSearch(query) {
    const searchResults = document.querySelector('.nav-search-results');
    if (!searchResults) return;
    
    if (!query.trim()) {
        searchResults.innerHTML = '';
        return;
    }
    
    try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const results = await response.json();
        
        if (results.length === 0) {
            searchResults.innerHTML = '<div class="search-no-results enhanced-message">Ничего не найдено</div>';
        } else {
            searchResults.innerHTML = results.map(result => `
                <a href="${result.url}" class="nav-search-result enhanced-result">
                    <div class="search-result-title">${result.title}</div>
                    ${result.snippet ? `<div class="search-result-snippet">${result.snippet}</div>` : ''}
                </a>
            `).join('');
        }
    } catch (error) {
        console.error('Ошибка поиска:', error);
        searchResults.innerHTML = '<div class="search-error enhanced-message">Ошибка поиска</div>';
    }
}

function initAnimations() {
    // Анимация иконок при наведении
    document.addEventListener('mouseover', function(e) {
        if (e.target.classList.contains('animated-icon')) {
            e.target.style.transform = 'scale(1.2) rotate(5deg)';
        }
    });
    
    document.addEventListener('mouseout', function(e) {
        if (e.target.classList.contains('animated-icon')) {
            e.target.style.transform = '';
        }
    });
    
    // Анимация кнопок
    document.querySelectorAll('.enhanced-btn').forEach(btn => {
        btn.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-2px)';
        });
        
        btn.addEventListener('mouseleave', function() {
            this.style.transform = '';
        });
        
        btn.addEventListener('mousedown', function() {
            this.style.transform = 'scale(0.95)';
        });
        
        btn.addEventListener('mouseup', function() {
            this.style.transform = 'translateY(-2px)';
        });
    });
}