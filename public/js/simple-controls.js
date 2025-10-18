document.addEventListener('DOMContentLoaded', function() {
    // Создаем простые элементы управления
    createSimpleControls();
    initLanguage();
    initSearch();
});

function createSimpleControls() {
    const nav = document.querySelector('nav ul');
    if (!nav) return;

    // Создаем контейнер для элементов управления
    const controlsContainer = document.createElement('li');
    controlsContainer.className = 'nav-controls-container';
    controlsContainer.innerHTML = `
        <div class="nav-controls">
            <!-- Переключатель языков -->
            <div class="language-switcher">
                <button class="lang-toggle" aria-label="Выбрать язык">
                    <span class="lang-flag">${getCurrentLanguageFlag()}</span>
                    <span class="current-lang">${getCurrentLanguageName()}</span>
                    <i class="fas fa-chevron-down"></i>
                </button>
                <div class="lang-dropdown" role="menu">
                    <a href="?lang=ru" class="lang-option ${document.documentElement.lang === 'ru' ? 'active' : ''}" role="menuitem">
                        <span class="lang-flag">🇷🇺</span>
                        <span>Русский</span>
                    </a>
                    <a href="?lang=en" class="lang-option ${document.documentElement.lang === 'en' ? 'active' : ''}" role="menuitem">
                        <span class="lang-flag">🇬🇧</span>
                        <span>English</span>
                    </a>
                    <a href="?lang=inh" class="lang-option ${document.documentElement.lang === 'inh' ? 'active' : ''}" role="menuitem">
                        <span class="lang-flag">⚪</span>
                        <span>ГӀалгӀай</span>
                    </a>
                </div>
            </div>

            <!-- Кнопка поиска -->
            <button class="enhanced-btn search-toggle-btn" aria-label="Открыть поиск">
                <i class="fas fa-search"></i>
            </button>
        </div>
    `;
    
    nav.appendChild(controlsContainer);
    
    // Создаем форму поиска
    createSearchForm();
}

function getCurrentLanguageFlag() {
    const lang = document.documentElement.lang || 'ru';
    const flags = { 'ru': '🇷🇺', 'en': '🇬🇧', 'inh': '⚪' };
    return flags[lang] || '🇷🇺';
}

function getCurrentLanguageName() {
    const lang = document.documentElement.lang || 'ru';
    const names = { 'ru': 'РУС', 'en': 'ENG', 'inh': 'ИНГ' };
    return names[lang] || 'РУС';
}

function createSearchForm() {
    const navContainer = document.querySelector('nav');
    if (!navContainer) return;
    
    const searchForm = document.createElement('div');
    searchForm.className = 'nav-search-form';
    searchForm.innerHTML = `
        <div class="nav-search-container">
            <input type="text" class="nav-search-input" placeholder="Поиск по сайту..." aria-label="Поиск по сайту">
            <button class="nav-search-close enhanced-btn" aria-label="Закрыть поиск">
                <i class="fas fa-times"></i>
            </button>
        </div>
        <div class="nav-search-results"></div>
    `;
    
    navContainer.appendChild(searchForm);
}

function initLanguage() {
    const langOptions = document.querySelectorAll('.lang-option');
    
    langOptions.forEach(option => {
        option.addEventListener('click', function(e) {
            e.preventDefault();
            const lang = new URL(this.href).searchParams.get('lang');
            document.cookie = `lang=${lang};path=/;max-age=31536000`;
            window.location.href = this.href;
        });
    });
}

function initSearch() {
    const searchToggle = document.querySelector('.search-toggle-btn');
    const searchForm = document.querySelector('.nav-search-form');
    const searchClose = document.querySelector('.nav-search-close');
    const searchInput = document.querySelector('.nav-search-input');
    const searchResults = document.querySelector('.nav-search-results');
    
    if (!searchToggle || !searchForm) return;
    
    // Открытие поиска
    searchToggle.addEventListener('click', function(e) {
        e.preventDefault();
        searchForm.classList.add('active');
        setTimeout(() => searchInput.focus(), 100);
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