document.addEventListener('DOMContentLoaded', function() {
    // Создаем переключатель языков
    const nav = document.querySelector('nav ul');
    if (nav) {
        // Находим элемент поиска чтобы вставить перед ним
        const searchItem = nav.querySelector('.search-nav-item');
        
        const langSwitcher = document.createElement('li');
        langSwitcher.className = 'language-switcher';
        
        const currentLang = document.documentElement.lang || 'ru';
        const languages = {
            'ru': { name: 'Русский', flag: '🇷🇺' },
            'en': { name: 'English', flag: '🇬🇧' },
            'inh': { name: 'ГӀалгӀай', flag: '⚪' }
        };
        
        langSwitcher.innerHTML = `
            <button class="lang-toggle" aria-label="Выбрать язык">
                <span class="lang-flag">${languages[currentLang].flag}</span>
                <span class="current-lang">${languages[currentLang].name}</span>
                <i class="fas fa-chevron-down"></i>
            </button>
            <div class="lang-dropdown" role="menu">
                ${Object.entries(languages).map(([code, lang]) => `
                    <a href="?lang=${code}" 
                       class="lang-option ${code === currentLang ? 'active' : ''}" 
                       role="menuitem"
                       data-lang="${code}">
                        <span class="lang-flag">${lang.flag}</span>
                        <span>${lang.name}</span>
                    </a>
                `).join('')}
            </div>
        `;
        
        // Вставляем перед поиском
        if (searchItem) {
            nav.insertBefore(langSwitcher, searchItem);
        } else {
            nav.appendChild(langSwitcher);
        }
        
        // Обработка клика по языку
        const langOptions = langSwitcher.querySelectorAll('.lang-option');
        langOptions.forEach(option => {
            option.addEventListener('click', function(e) {
                e.preventDefault();
                const lang = this.dataset.lang;
                
                // Сохраняем выбор в cookie
                document.cookie = `lang=${lang};path=/;max-age=31536000`;
                
                // Перезагружаем страницу с новым языком
                const url = new URL(window.location);
                url.searchParams.set('lang', lang);
                window.location.href = url.toString();
            });
        });
    }
});