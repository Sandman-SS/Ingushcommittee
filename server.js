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
        
        // Special handling for new CSS structure
        if (filePath.includes('/css/')) {
            res.setHeader('Content-Type', 'text/css');
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
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://unpkg.com"],
            styleSrc: ["'self'", "https://unpkg.com", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https://t.me", "https://*.telegram.org", "https://*.t.me", "https://i.ytimg.com", "https://*.tile.openstreetmap.org", "https://mt0.google.com", "https://mt1.google.com", "https://mt2.google.com", "https://mt3.google.com"],
            mediaSrc: ["'self'", "https://t.me", "https://*.telegram.org", "https://*.t.me"],
            frameSrc: ["'self'", "https://www.youtube.com", "https://www.youtube-nocookie.com"],
            fontSrc: ["'self'"],
            connectSrc: ["'self'", "https://api.telegram.org", "https://*.tile.openstreetmap.org", "https://mt0.google.com", "https://mt1.google.com", "https://mt2.google.com", "https://mt3.google.com"]
        },
    })
);

// --- TELEGRAM SCRAPER ---
const cron = require('node-cron');
const { scrapeChannel } = require('./utils/telegram-scraper');

// Первичная загрузка новостей при старте (через 5 секунд после запуска)
setTimeout(async () => {
    log.info('Running initial Telegram channel scrape...');
    const count = await scrapeChannel();
    if (count > 0) {
        log.info(`Initial scrape: loaded ${count} posts`);
    }
}, 5000);

// Проверка новых постов каждые 5 минут
cron.schedule('*/5 * * * *', async () => {
    const count = await scrapeChannel();
    if (count > 0) {
        log.info(`Cron scrape: ${count} new posts`);
    }
});


// --- МАРШРУТЫ САЙТА ---

// Импорт генератора sitemap
const { generateSitemap } = require('./utils/sitemap-generator');

// Импорт модуля для работы с новостями
const { loadPosts } = require('./utils/data-storage');

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
    const posts = loadPosts().slice(0, 3);
    res.render('index', { req, posts });
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

// 301 редиректы для удалённых страниц
app.get('/activities/projects', (req, res) => res.redirect(301, '/activities'));

app.get('/activities/achievements', (req, res) => {
    res.render('achievements');
});

app.get('/activities/culture', (req, res) => {
    res.render('activities/culture');
});

app.get('/activities/education', (req, res) => res.redirect(301, '/activities'));

app.get('/activities/rights', (req, res) => {
    res.render('activities/rights'); // Изменено
});

app.get('/activities/international', (req, res) => {
    res.render('activities/international'); // Изменено
});


// Раздел "Народ"
app.get('/people', (req, res) => {
    res.render('people');
});

// Раздел "Галерея" — данные фотоальбома
const galleryPhotos = [
    // === Башенные комплексы ===
    { src: '/img/cultural/vovnushki.jpg',       title: 'Вовнушки',              category: 'towers', description: 'Боевые башни в Джейрахском ущелье' },
    { src: '/img/cultural/erzi.jpg',            title: 'Эрзи',                  category: 'towers', description: 'Крупнейший башенный комплекс Ингушетии' },
    { src: '/img/cultural/targim.jpg',          title: 'Таргим',                category: 'towers', description: 'Древнее поселение в ущелье Ассы' },
    { src: '/img/cultural/egikal.jpg',          title: 'Эгикал',                category: 'towers', description: 'Крупнейший башенный город Кавказа' },
    { src: '/img/cultural/khost.jpg',           title: 'Хост',                  category: 'towers', description: 'Башенный комплекс в горной Ингушетии' },
    { src: '/img/cultural/tower-of-concord.jpg',title: 'Башня Согласия',        category: 'towers', description: 'Современный символ Магаса' },
    { src: '/img/cultural/cori.jpg',            title: 'Цори',                  category: 'towers', description: 'Башенный комплекс в верховьях реки Гулойхи' },
    { src: '/img/cultural/salgi.jpg',           title: 'Салги',                 category: 'towers', description: 'Средневековое башенное поселение' },
    { src: '/img/cultural/khamkhi.jpg',         title: 'Хамхи',                category: 'towers', description: 'Древний аул в горной Ингушетии' },
    { src: '/img/cultural/falhan.jpg',          title: 'Фалхан',               category: 'towers', description: 'Башенное поселение в Джейрахском районе' },
    { src: '/img/cultural/barhane.jpg',         title: 'Бархане',              category: 'towers', description: 'Горное поселение с боевыми башнями' },
    { src: '/img/cultural/khart.jpg',           title: 'Харт',                 category: 'towers', description: 'Башенный комплекс' },
    { src: '/img/cultural/shoan.jpg',           title: 'Шоан',                 category: 'towers', description: 'Горное башенное поселение' },
    { src: '/img/cultural/bisht.jpg',           title: 'Бишт',                 category: 'towers', description: 'Башенный комплекс' },
    { src: '/img/cultural/curov.jpg',           title: 'Цуров',                category: 'towers', description: 'Средневековые башни' },
    { src: '/img/cultural/mechal.jpg',          title: 'Мецхал',               category: 'towers', description: 'Древний башенный аул' },
    { src: '/img/cultural/niy.jpg',             title: 'Ний',                  category: 'towers', description: 'Башенное поселение' },
    { src: '/img/cultural/hadzi.jpg',           title: 'Хьайрах',              category: 'towers', description: 'Горное поселение' },
    { src: '/img/cultural/gagi.jpg',            title: 'Гаги',                 category: 'towers', description: 'Башенный комплекс' },
    { src: '/img/cultural/gu.jpg',              title: 'Гу',                   category: 'towers', description: 'Горное поселение' },

    // === Природа и пейзажи ===
    { src: '/img/settlements/dzheyrakh.jpg',    title: 'Джейрахское ущелье',    category: 'nature', description: 'Живописное ущелье в горной Ингушетии' },
    { src: '/img/settlements/armhi.jpg',        title: 'Армхи',                category: 'nature', description: 'Горный курорт в ущелье реки Армхи' },
    { src: '/img/religious/djeirah.JPG',        title: 'Горы Джейраха',        category: 'nature', description: 'Горные пейзажи Джейрахского района' },
    { src: '/img/settlements/galashki.jpg',     title: 'Галашки',              category: 'nature', description: 'Село в предгорьях Ингушетии' },
    { src: '/img/settlements/alkun.jpg',        title: 'Алкун',                category: 'nature', description: 'Горное село в Джейрахском районе' },
    { src: '/img/settlements/guli.jpg',         title: 'Гули',                 category: 'nature', description: 'Горный аул' },
    { src: '/img/settlements/ezmi.jpg',         title: 'Эзми',                 category: 'nature', description: 'Горное поселение' },
    { src: '/img/settlements/berd.jpg',         title: 'Берд',                 category: 'nature', description: 'Горное поселение' },

    // === Мечети и святыни ===
    { src: '/img/religious/thaba-erdy.jpg',     title: 'Тхаба-Ерды',           category: 'religious', description: 'Древнейший христианский храм на Кавказе, VIII–IX вв.' },
    { src: '/img/religious/nazran-mosque.jpg',   title: 'Мечеть в Назрани',     category: 'religious', description: 'Центральная мечеть города Назрань' },
    { src: '/img/religious/magas-mosque.jpg',    title: 'Мечеть в Магасе',      category: 'religious', description: 'Мечеть столицы Ингушетии' },
    { src: '/img/religious/djuma.jpg',          title: 'Джума-мечеть',         category: 'religious', description: 'Пятничная мечеть' },
    { src: '/img/religious/mosek.jpg',          title: 'Мечеть',               category: 'religious', description: 'Мечеть в Ингушетии' },
    { src: '/img/religious/nazranov.jpg',       title: 'Мечеть Назрани',       category: 'religious', description: 'Историческая мечеть' },
    { src: '/img/religious/batl.jpg',           title: 'Батлибори',            category: 'religious', description: 'Святилище' },
    { src: '/img/religious/acha.jpg',           title: 'Святилище',            category: 'religious', description: 'Древнее святилище' },
    { src: '/img/religious/malgo.jpg',          title: 'Святилище Малго',      category: 'religious', description: 'Культовое сооружение' },
    { src: '/img/religious/redan.jpg',          title: 'Редант',               category: 'religious', description: 'Историческое место' },

    // === Памятники и музеи ===
    { src: '/img/cultural/memor.jpg',           title: 'Мемориал жертвам репрессий', category: 'cities', description: 'Памятник жертвам депортации 1944 года' },
    { src: '/img/cultural/muz.JPG',             title: 'Краеведческий музей',   category: 'cities', description: 'Музей в Ингушетии' },
    { src: '/img/cultural/pam.jpg',             title: 'Памятник',             category: 'cities', description: 'Монумент' },

    // === Города и сёла ===
    { src: '/img/settlements/magas.jpg',        title: 'Магас',                category: 'cities', description: 'Столица Республики Ингушетия' },
    { src: '/img/settlements/nazran.jpg',       title: 'Назрань',              category: 'cities', description: 'Крупнейший город Ингушетии' },
    { src: '/img/settlements/karabulak.jpg',    title: 'Карабулак',            category: 'cities', description: 'Город в Ингушетии' },
    { src: '/img/settlements/malgobek.jpg',     title: 'Малгобек',             category: 'cities', description: 'Город воинской славы' },
    { src: '/img/settlements/sunzha.jpg',       title: 'Сунжа',                category: 'cities', description: 'Город на реке Сунжа' },
    { src: '/img/settlements/angusht.jpg',      title: 'Ангушт',               category: 'cities', description: 'Историческое поселение ингушей' },
    { src: '/img/settlements/vladikavkaz.jpg',  title: 'Владикавказ',          category: 'cities', description: 'Исторический город ингушей' },
    { src: '/img/settlements/ekazhevo.jpg',     title: 'Экажево',              category: 'cities', description: 'Село в Назрановском районе' },
    { src: '/img/settlements/ali-yurt.jpg',     title: 'Али-Юрт',             category: 'cities', description: 'Село в Ингушетии' },
    { src: '/img/settlements/plievo.jpg',       title: 'Плиево',               category: 'cities', description: 'Село в Назрановском районе' },
    { src: '/img/settlements/surkhakhi.jpg',    title: 'Сурхахи',              category: 'cities', description: 'Село в Назрановском районе' },
    { src: '/img/settlements/achaluki.jpg',     title: 'Ачалуки',              category: 'cities', description: 'Бальнеологический курорт' },
    { src: '/img/settlements/nesterovskaya.jpg',title: 'Нестеровская',         category: 'cities', description: 'Станица в Сунженском районе' },
    { src: '/img/settlements/sagopshi.jpg',     title: 'Сагопши',              category: 'cities', description: 'Село в Малгобекском районе' },
    { src: '/img/settlements/mujichi.jpg',      title: 'Мужичи',               category: 'cities', description: 'Село в Сунженском районе' },
    { src: '/img/settlements/Barsuki.jpg',      title: 'Барсуки',              category: 'cities', description: 'Населённый пункт в Ингушетии' },
    { src: '/img/settlements/inarki.jpg',       title: 'Инарки',               category: 'cities', description: 'Село в Малгобекском районе' },
    { src: '/img/settlements/psedah.jpg',       title: 'Пседах',               category: 'cities', description: 'Село в Малгобекском районе' },
];

app.get('/gallery', (req, res) => {
    res.render('gallery', { photos: galleryPhotos });
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

// Раздел "Новости"
app.get('/news', (req, res) => {
    try {
        const posts = loadPosts();
        res.render('news', { posts });
    } catch (error) {
        log.error('Error loading news page', { error: error.message });
        res.status(500).render('500');
    }
});

// API для получения новостей (для пагинации и AJAX)
app.get('/api/news', (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const posts = loadPosts();

        // Пагинация
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedPosts = posts.slice(startIndex, endIndex);

        res.json({
            success: true,
            page,
            limit,
            total: posts.length,
            totalPages: Math.ceil(posts.length / limit),
            posts: paginatedPosts
        });
    } catch (error) {
        log.error('Error fetching news via API', { error: error.message });
        res.status(500).json({
            success: false,
            message: 'Ошибка при загрузке новостей'
        });
    }
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
