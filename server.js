const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const app = express();
app.use(express.static('public'));
const port = process.env.PORT || 3000;

// Импорт dotenv для работы с переменными окружения (.env файл)
require('dotenv').config();

// Проверка переменных окружения
const { checkEnvironmentVariables, createEnvFileIfNotExists } = require('./utils/env-check');
createEnvFileIfNotExists(); // Создаем .env из .env.example если нужно
const envCheck = checkEnvironmentVariables();

// Если есть критические ошибки - останавливаем сервер
if (envCheck.errors.length > 0) {
    console.error('\n❌ Критические ошибки конфигурации:');
    envCheck.errors.forEach(error => console.error(`   - ${error}`));
    console.error('\nСервер не может быть запущен. Исправьте ошибки в файле .env\n');
    process.exit(1);
}

// Выводим предупреждения если есть
if (envCheck.warnings.length > 0) {
    console.log('\n⚠️  Предупреждения:');
    envCheck.warnings.forEach(warning => {
        console.log(`   - ${warning}`);
    });
    console.log('');
}

// Импорт Helmet для настройки HTTP-заголовков безопасности
const helmet = require('helmet');

// Импорт xss для очистки пользовательского контента от вредоносного HTML
const xss = require('xss');

// Импорт compression для сжатия ответов
const compression = require('compression');

// Импорт i18n для мультиязычности
const i18n = require('i18n');

// Импорт системы логирования
const { log, httpLogger } = require('./utils/logger');


// Логируем предупреждения окружения
if (envCheck.warnings.length > 0) {
    envCheck.warnings.forEach(warning => {
        log.warn(`Environment warning: ${warning}`);
    });
}

log.info('Server starting...', {
    nodeEnv: process.env.NODE_ENV,
    port: port
});

// Импорт счетчика посетителей
const { visitorCounterMiddleware, visitorCounter } = require('./utils/visitor-counter');

// --- НАСТРОЙКИ СЕРВЕРА ---

// Установка EJS как шаблонизатора и указание директории views
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware

// Логирование HTTP запросов
app.use(httpLogger);

// Счетчик посетителей
app.use(visitorCounterMiddleware);

// Включаем сжатие для всех ответов
app.use(compression({
    level: 6, // Уровень сжатия (1-9)
    threshold: 1024, // Сжимать файлы больше 1kb
    filter: (req, res) => {
        // Сжимаем все типы контента кроме изображений (они уже сжаты)
        if (req.headers['x-no-compression']) {
            return false;
        }
        return compression.filter(req, res);
    }
}));

// Настройка кэширования для статических файлов
const staticOptions = {
    maxAge: process.env.NODE_ENV === 'production' ? '1d' : 0, // 1 день в продакшене
    etag: true,
    lastModified: true,
    setHeaders: (res, filePath) => {
        // Особые настройки для разных типов файлов
        if (filePath.endsWith('.jpg') || filePath.endsWith('.png') || filePath.endsWith('.ico')) {
            res.setHeader('Cache-Control', 'public, max-age=2592000'); // 30 дней для изображений
        } else if (filePath.endsWith('.css') || filePath.endsWith('.js')) {
            res.setHeader('Cache-Control', 'public, max-age=86400'); // 1 день для CSS/JS
        }
    }
};

// Обслуживание статических файлов из папки 'public' с кэшированием
app.use(express.static(path.join(__dirname, 'public'), staticOptions));

// Парсинг application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }));
// Парсинг application/json
app.use(bodyParser.json());

// --- НАСТРОЙКА i18n ---
i18n.configure({
    locales: ['ru', 'inh', 'en'], // Поддерживаемые языки: русский, ингушский, английский
    defaultLocale: 'ru',
    directory: path.join(__dirname, 'locales'),
    cookie: 'lang',
    queryParameter: 'lang',
    autoReload: true,
    updateFiles: false,
    syncFiles: false,
    objectNotation: true // Позволяет использовать вложенные объекты
});

// Инициализация i18n
app.use(i18n.init);

// Middleware для установки языка из cookie или query параметра
app.use((req, res, next) => {
    // Проверяем query параметр для смены языка
    if (req.query.lang) {
        res.cookie('lang', req.query.lang, { maxAge: 900000, httpOnly: true });
        req.setLocale(req.query.lang);
    }
    
    // Делаем функции i18n доступными в шаблонах
    res.locals.__ = res.__;
    res.locals.__n = res.__n;
    res.locals.locale = req.getLocale();
    res.locals.locales = i18n.getLocales();
    
    next();
});

// --- НАСТРОЙКИ БЕЗОПАСНОСТИ (HELMET) ---
// ВНИМАНИЕ: Content Security Policy (CSP) может блокировать ресурсы,
// если они не указаны явно в директивах. Тщательно протестируйте после включения!
// --- НАСТРОЙКИ БЕЗОПАСНОСТИ (HELMET) ---
// ВНИМАНИЕ: Content Security Policy (CSP) может блокировать ресурсы,
// если они не указаны явно в директивах. Тщательно протестируйте после включения!
app.use(
    helmet.contentSecurityPolicy({
        directives: {
            defaultSrc: ["'self'"], // Разрешает загрузку ресурсов только с вашего домена
            // Добавляем unpkg.com для Leaflet JS и CSS, а также fontawesome.com для иконок Leaflet DivIcon
            scriptSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com", "https://kit.fontawesome.com", "https://unpkg.com"],
            // Добавляем unpkg.com для Leaflet CSS
            styleSrc: ["'self'", "https://cdnjs.cloudflare.com", "https://kit.fontawesome.com", "https://unpkg.com", "'unsafe-inline'"],
            // Изображения: ваш домен, data-URI (для иконок), Telegram, YouTube превью
            // !!! ВАЖНО: Добавляем источники для тайлов карты !!!
            imgSrc: ["'self'", "data:", "https://t.me", "*.telegram.org", "*.t.me", "https://i.ytimg.com", "https://*.tile.openstreetmap.org", "https://mt*.google.com"],
            // Медиа (видео/аудио): ваш домен, Telegram (со всеми поддоменами)
            mediaSrc: ["'self'", "https://t.me", "*.telegram.org", "*.t.me"],
            // Iframe: ваш домен и YouTube (для встраивания видео)
            frameSrc: ["'self'", "https://www.youtube.com", "https://www.youtube-nocookie.com"],
            // Шрифты: ваш домен, Font Awesome CDN и Google Fonts (если используете)
            fontSrc: ["'self'", "https://cdnjs.cloudflare.com", "https://fonts.gstatic.com"],
            // AJAX-запросы: ваш домен, Telegram API и Font Awesome Kit
            // !!! ВАЖНО: Leaflet может использовать connectSrc для тайлов в некоторых режимах,
            // или если вы делаете AJAX-запросы для данных карты.
            connectSrc: ["'self'", "https://api.telegram.org", "https://kit.fontawesome.com", "https://*.tile.openstreetmap.org", "https://mt*.google.com"]
        },
    })
);

// --- ЛОГИКА TELEGRAM УДАЛЕНА ---


// --- МАРШРУТЫ САЙТА ---

// Импорт генератора sitemap
const { generateSitemap } = require('./utils/sitemap-generator');

// Маршрут для sitemap.xml
app.get('/sitemap.xml', (req, res) => {
    const sitemap = generateSitemap();
    res.header('Content-Type', 'application/xml');
    res.send(sitemap);
});


// API для получения статистики посетителей
app.get('/api/visitor-stats', (req, res) => {
    const stats = visitorCounter.getStats();
    res.json(stats);
});

// API для поиска по сайту
app.get('/api/search', (req, res) => {
    const query = req.query.q || '';
    
    if (!query.trim()) {
        return res.json([]);
    }
    
    // Простой поиск по заголовкам страниц
    const pages = [
        { url: '/', title: res.__('nav.home'), content: res.__('home.subtitle') },
        { url: '/about', title: res.__('nav.about'), content: res.__('site.description') },
        { url: '/about/mission', title: res.__('nav.about_mission'), content: '' },
        { url: '/about/history', title: res.__('nav.about_history'), content: '' },
        { url: '/about/goals', title: res.__('nav.about_goals'), content: '' },
        { url: '/activities', title: res.__('nav.activities'), content: '' },
        { url: '/contact', title: res.__('nav.contact'), content: res.__('contact.description') },
        { url: '/map', title: res.__('nav.map'), content: '' }
    ];
    
    const lowerQuery = query.toLowerCase();
    const results = pages.filter(page => 
        page.title.toLowerCase().includes(lowerQuery) || 
        page.content.toLowerCase().includes(lowerQuery)
    ).map(page => ({
        url: page.url,
        title: page.title,
        snippet: page.content ? page.content.substring(0, 150) + '...' : ''
    }));
    
    res.json(results);
});

// Главная страница
app.get('/', (req, res) => {
    res.render('index', { req });
});

// Раздел "О комитете"
app.get('/about', (req, res) => {
    res.render('about');
});

app.get('/about/mission', (req, res) => {
    res.render('mission');
});

app.get('/about/history', (req, res) => {
    res.render('history');
});

app.get('/about/goals', (req, res) => {
    res.render('goals');
});

// Раздел "Деятельность"
app.get('/activities', (req, res) => {
    res.render('activities');
});

app.get('/activities/events', (req, res) => {
    res.render('events');
});

app.get('/activities/projects', (req, res) => {
    res.render('activities/projects');
});

app.get('/activities/achievements', (req, res) => {
    res.render('achievements');
});

app.get('/activities/culture', (req, res) => {
    res.render('activities/culture');
});

app.get('/activities/education', (req, res) => {
    res.render('activities/education');
});

app.get('/activities/rights', (req, res) => {
    res.render('activities/rights'); // Изменено
});

app.get('/activities/international', (req, res) => {
    res.render('activities/international'); // Изменено
});


// Раздел "Галерея"
app.get('/gallery', (req, res) => {
    res.render('gallery');
});

// Раздел "Контакты"
app.get('/contact', (req, res) => {
    res.render('contact');
});

// Маршрут для обработки формы обратной связи (POST)
// Теперь просто сохраняем в лог и показываем сообщение
app.post('/submit-contact', async (req, res) => {
    try {
        // Получаем и очищаем данные формы от XSS
        const formData = {
            name: xss(req.body.name || ''),
            message: xss(req.body.message || '')
        };

        // Базовая валидация на сервере
        if (!formData.name || !formData.message) {
            return res.status(400).json({ 
                success: false, 
                message: 'Пожалуйста, заполните все поля.' 
            });
        }

        // Логируем сообщение
        log.info('Contact form submission', {
            name: formData.name,
            message: formData.message,
            timestamp: new Date().toISOString()
        });

        // Отправка в Telegram отключена. Сообщение только логируется.

        // Если запрос через AJAX, отправляем JSON ответ
        if (req.xhr || (req.headers.accept && req.headers.accept.indexOf('json') > -1)) {
            return res.json({ 
                success: true, 
                message: 'Спасибо за ваше сообщение! Для оперативной связи напишите нам в Telegram.' 
            });
        }

        // Иначе редирект на страницу благодарности
        res.redirect('/thank-you');
        
    } catch (error) {
        console.error('Ошибка при обработке формы:', error);
        log.error('Contact form processing error', { 
            error: error.message
        });
        
        // Если запрос через AJAX
        if (req.xhr || (req.headers.accept && req.headers.accept.indexOf('json') > -1)) {
            return res.status(500).json({ 
                success: false, 
                message: 'Произошла ошибка. Пожалуйста, свяжитесь с нами через Telegram.' 
            });
        }
        
        // Иначе редирект на страницу ошибки
        res.status(500).render('500');
    }
});

// Страница благодарности после отправки формы
app.get('/thank-you', (req, res) => {
    res.render('thank-you');
});

// Раздел "Карта"
app.get('/map', (req, res) => {
    res.render('map');
});

// --- ОБРАБОТКА ОШИБОК ---

// Обработка несуществующих маршрутов (404 Not Found)
app.use((req, res) => {
    res.status(404).render('404'); // Убедитесь, что у вас есть файл 404.ejs
});

// Глобальный обработчик ошибок (для ошибок сервера 500)
// Должен быть последним app.use
app.use((err, req, res, next) => {
    console.error(err.stack); // Логируем ошибку для разработчика
    log.error('Unhandled error', {
        error: err.message,
        stack: err.stack,
        url: req.originalUrl,
        method: req.method
    });
    // Отправляем страницу с ошибкой 500
    res.status(500).render('500');
});

// --- ЗАПУСК СЕРВЕРА ---

app.listen(port, '0.0.0.0', () => {
    console.log(`Сервер запущен на http://localhost:${port}`);
    log.info('Server started successfully', {
        port: port,
        env: process.env.NODE_ENV,
        url: `http://localhost:${port}`
    });
});
