document.addEventListener('DOMContentLoaded', function() {
    async function loadVisitorStats() {
        try {
            const response = await fetch('/api/visitor-stats');
            const stats = await response.json();
            
            const counterElement = document.getElementById('visitor-counter');
            if (!counterElement) return;
            
            counterElement.innerHTML = `
                <div class="visitor-stats">
                    <div class="stat-item">
                        <i class="fas fa-users" aria-hidden="true"></i>
                        <span class="stat-label">Всего посещений:</span>
                        <span class="stat-value">${stats.totalVisits.toLocaleString('ru-RU')}</span>
                    </div>
                    <div class="stat-item">
                        <i class="fas fa-user" aria-hidden="true"></i>
                        <span class="stat-label">Уникальных посетителей:</span>
                        <span class="stat-value">${stats.uniqueVisitors.toLocaleString('ru-RU')}</span>
                    </div>
                    <div class="stat-item">
                        <i class="fas fa-calendar-day" aria-hidden="true"></i>
                        <span class="stat-label">Сегодня:</span>
                        <span class="stat-value">${stats.todayVisits.toLocaleString('ru-RU')}</span>
                    </div>
                </div>
            `;
        } catch (error) {
            console.error('Ошибка загрузки статистики:', error);
        }
    }
    
    // Загружаем статистику при загрузке страницы
    loadVisitorStats();
    
    // Обновляем каждые 30 секунд
    setInterval(loadVisitorStats, 30000);
});