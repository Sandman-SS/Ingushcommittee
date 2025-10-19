const fs = require('fs').promises;
const path = require('path');

class VisitorCounter {
    constructor() {
        this.filePath = path.join(__dirname, '..', 'data', 'visitor-stats.json');
        this.stats = {
            totalVisits: 0,
            uniqueVisitors: new Set(),
            dailyStats: {},
            pageViews: {}
        };
        this.loadStats();
    }

    async loadStats() {
        try {
            // Создаем директорию data если её нет
            const dataDir = path.dirname(this.filePath);
            await fs.mkdir(dataDir, { recursive: true });

            // Загружаем статистику
            const data = await fs.readFile(this.filePath, 'utf8');
            const savedStats = JSON.parse(data);
            
            this.stats.totalVisits = savedStats.totalVisits || 0;
            this.stats.uniqueVisitors = new Set(savedStats.uniqueVisitors || []);
            this.stats.pageViews = savedStats.pageViews || {};
            
            // Восстанавливаем dailyStats с правильными Set объектами
            this.stats.dailyStats = {};
            if (savedStats.dailyStats) {
                Object.keys(savedStats.dailyStats).forEach(date => {
                    this.stats.dailyStats[date] = {
                        visits: savedStats.dailyStats[date].visits || 0,
                        uniqueVisitors: new Set(savedStats.dailyStats[date].uniqueVisitors || [])
                    };
                });
            }
        } catch (error) {
            // Файл не существует, используем значения по умолчанию
            this.saveStats();
        }
    }

    async saveStats() {
        try {
            // Конвертируем Set объекты в массивы для сохранения
            const dailyStatsToSave = {};
            Object.keys(this.stats.dailyStats).forEach(date => {
                dailyStatsToSave[date] = {
                    visits: this.stats.dailyStats[date].visits,
                    uniqueVisitors: Array.from(this.stats.dailyStats[date].uniqueVisitors)
                };
            });

            const statsToSave = {
                totalVisits: this.stats.totalVisits,
                uniqueVisitors: Array.from(this.stats.uniqueVisitors),
                dailyStats: dailyStatsToSave,
                pageViews: this.stats.pageViews,
                lastUpdated: new Date().toISOString()
            };
            
            await fs.writeFile(this.filePath, JSON.stringify(statsToSave, null, 2));
        } catch (error) {
            console.error('Ошибка сохранения статистики:', error);
        }
    }

    async recordVisit(req) {
        const today = new Date().toISOString().split('T')[0];
        const visitorId = this.getVisitorId(req);
        const page = req.path;

        // Увеличиваем общий счетчик
        this.stats.totalVisits++;

        // Добавляем уникального посетителя
        this.stats.uniqueVisitors.add(visitorId);

        // Обновляем дневную статистику
        if (!this.stats.dailyStats[today]) {
            this.stats.dailyStats[today] = {
                visits: 0,
                uniqueVisitors: new Set()
            };
        }
        this.stats.dailyStats[today].visits++;
        this.stats.dailyStats[today].uniqueVisitors.add(visitorId);

        // Обновляем просмотры страниц
        if (!this.stats.pageViews[page]) {
            this.stats.pageViews[page] = 0;
        }
        this.stats.pageViews[page]++;

        // Сохраняем каждые 10 визитов
        if (this.stats.totalVisits % 10 === 0) {
            await this.saveStats();
        }
    }

    getVisitorId(req) {
        // Простая идентификация по IP + User-Agent
        const ip = req.ip || req.connection.remoteAddress || 'unknown';
        const userAgent = req.get('user-agent') || 'unknown';
        return `${ip}-${Buffer.from(userAgent).toString('base64').substring(0, 10)}`;
    }

    getStats() {
        const today = new Date().toISOString().split('T')[0];
        const todayStats = this.stats.dailyStats[today];

        return {
            totalVisits: this.stats.totalVisits,
            uniqueVisitors: this.stats.uniqueVisitors.size,
            todayVisits: todayStats ? todayStats.visits : 0,
            todayUniqueVisitors: todayStats ? todayStats.uniqueVisitors.size : 0
        };
    }

    // Очистка старых данных (хранить последние 30 дней)
    async cleanOldStats() {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const cutoffDate = thirtyDaysAgo.toISOString().split('T')[0];

        Object.keys(this.stats.dailyStats).forEach(date => {
            if (date < cutoffDate) {
                delete this.stats.dailyStats[date];
            }
        });

        await this.saveStats();
    }
}

// Создаем единственный экземпляр
const visitorCounter = new VisitorCounter();

// Middleware для подсчета посетителей
const visitorCounterMiddleware = async (req, res, next) => {
    // Считаем только HTML страницы, не статические ресурсы
    if (!req.path.includes('.') && req.method === 'GET') {
        await visitorCounter.recordVisit(req);
    }
    next();
};

// Очистка старых данных раз в день
setInterval(() => {
    visitorCounter.cleanOldStats();
}, 24 * 60 * 60 * 1000);

module.exports = {
    visitorCounter,
    visitorCounterMiddleware
};