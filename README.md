# Комитет Ингушской Независимости - Официальный сайт

Официальный сайт Комитета Ингушской Независимости с автоматической интеграцией новостей из Telegram канала.

## 📋 Требования

- **Node.js** 14.0 или выше
- **npm** или yarn
- **Python** 3.8+ (для Telegram бота новостей)
- **python3-venv** (для виртуального окружения)
- Telegram Bot Token (опционально, для новостей)

## 🛠 Установка на новой машине

### Шаг 1: Установите системные зависимости

#### Ubuntu/Debian:
```bash
sudo apt update
sudo apt install nodejs npm python3 python3-venv python3-full git
```

#### macOS (с Homebrew):
```bash
brew install node python3
```

### Шаг 2: Клонируйте репозиторий

```bash
git clone https://github.com/your-username/ingush-committee.git
cd ingush-committee
```

### Шаг 3: Установите Node.js зависимости

```bash
npm install
```

### Шаг 4: Настройте переменные окружения

```bash
# Скопируйте файл с примерами
cp .env.example .env

# Откройте .env в редакторе
nano .env
```

Минимальная конфигурация `.env`:
```env
# Сервер
PORT=3000
NODE_ENV=development

# Email (опционально, для формы обратной связи)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
EMAIL_TO=contact@example.com

# Google Analytics (опционально)
GA_TRACKING_ID=UA-XXXXXXXXX-X

# Telegram Bot для новостей (опционально)
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_CHANNEL_USERNAME=@your_channel_name

# Безопасность
SESSION_SECRET=your_random_secret_key
```

### Шаг 5: Настройте Telegram бота (опционально)

Если хотите использовать систему автоматических новостей из Telegram:

#### 5.1. Создайте Telegram бота

1. Откройте [@BotFather](https://t.me/BotFather) в Telegram
2. Отправьте команду `/newbot`
3. Следуйте инструкциям
4. Сохраните полученный **Bot Token**

#### 5.2. Добавьте бота в ваш канал

1. Откройте ваш Telegram канал
2. Перейдите в настройки → Администраторы
3. Добавьте бота как администратора
4. Дайте право "Публиковать сообщения"

#### 5.3. Настройте Python окружение

```bash
# Установите зависимости и создайте виртуальное окружение
./setup-venv.sh
```

Этот скрипт автоматически:
- Создаст изолированное Python окружение в `venv/`
- Установит все необходимые зависимости
- Не затронет системный Python

#### 5.4. Обновите .env

Добавьте в `.env`:
```env
TELEGRAM_BOT_TOKEN=ваш_токен_от_BotFather
TELEGRAM_CHANNEL_USERNAME=@ваш_публичный_канал
```

## 🚀 Запуск проекта

### Запуск веб-сервера

```bash
# Режим разработки
npm start

# Режим продакшн
NODE_ENV=production npm start
```

Сайт будет доступен по адресу: **http://localhost:3000**

### Запуск Telegram бота новостей (опционально)

Откройте **второй терминал** и запустите:

```bash
# Рекомендуемый способ (автоматические проверки)
./start-telegram-bot.sh

# Или через npm
npm run news-bot:start

# Или напрямую
venv/bin/python telegram-news-bot.py
```

**Важно:** Не используйте `python` или `python3` напрямую - используйте виртуальное окружение!

### Запуск в фоновом режиме (Linux/macOS)

```bash
# Запуск бота в фоне
nohup venv/bin/python telegram-news-bot.py > logs/telegram-bot.log 2>&1 &

# Запуск веб-сервера в фоне
nohup npm start > logs/server.log 2>&1 &

# Просмотр логов
tail -f logs/telegram-bot.log
tail -f logs/server.log
```

## 📁 Структура проекта

```
ingush-committee/
├── views/                      # EJS шаблоны
│   ├── partials/              # Переиспользуемые компоненты
│   ├── activities/            # Страницы деятельности
│   ├── layouts/               # Базовые макеты
│   ├── news.ejs               # Страница новостей
│   └── ...
├── public/                    # Статические файлы
│   ├── img/                   # Изображения сайта
│   ├── js/                    # JavaScript файлы
│   │   └── components/        # JS компоненты
│   ├── css/                   # Стили
│   │   ├── pages/             # Стили страниц
│   │   └── components/        # Стили компонентов
│   └── media/                 # Медиафайлы из Telegram
│       ├── photos/            # Фотографии новостей
│       └── videos/            # Видео новостей
├── locales/                   # Файлы локализации (i18n)
│   ├── ru.json               # Русский
│   ├── inh.json              # Ингушский
│   └── en.json               # Английский
├── utils/                     # Утилиты
│   ├── logger.js             # Система логирования
│   ├── data-storage.js       # Хранилище новостей
│   ├── media-downloader.js   # Загрузчик медиа
│   ├── visitor-counter.js    # Счетчик посетителей
│   └── env-check.js          # Проверка переменных окружения
├── data/                      # Данные (создается автоматически)
│   └── telegram-posts.json   # Хранилище новостей
├── logs/                      # Логи (создается автоматически)
├── venv/                      # Python виртуальное окружение
├── telegram-news-bot.py       # Python бот для новостей
├── setup-venv.sh             # Скрипт настройки Python
├── start-telegram-bot.sh     # Скрипт запуска бота
├── requirements.txt          # Python зависимости
├── server.js                 # Основной файл сервера
├── package.json              # Node.js зависимости
└── .env                      # Переменные окружения (создать!)
```

## 🌐 Страницы сайта

- `/` - Главная страница
- `/about` - О комитете
  - `/about/mission` - Наша миссия
  - `/about/history` - История
  - `/about/goals` - Наши цели
- `/activities` - Деятельность
  - `/activities/projects` - Проекты
  - `/activities/culture` - Культура
  - `/activities/education` - Образование
  - `/activities/rights` - Защита прав
  - `/activities/international` - Международное сотрудничество
- `/news` - **Новости** (из Telegram канала)
- `/map` - Интерактивная карта
- `/contact` - Контакты и форма обратной связи
- `/thank-you` - Страница благодарности

## 📰 Система новостей

Сайт автоматически получает новости из вашего Telegram канала:

- ✅ Автоматическое получение постов в реальном времени
- ✅ Поддержка текста с форматированием (жирный, курсив, ссылки)
- ✅ Поддержка фото и видео
- ✅ Сохранение при перезагрузке сервера
- ✅ Пагинация (кнопка "Загрузить еще")
- ✅ API доступ (`/api/news`)

### Публикация новостей

Просто опубликуйте пост в вашем Telegram канале - он автоматически появится на сайте!

### Подробная документация

- [QUICKSTART_NEWS.md](QUICKSTART_NEWS.md) - Быстрый старт системы новостей
- [NEWS_SETUP.md](NEWS_SETUP.md) - Подробная настройка Telegram бота

## 🔧 Полезные команды

### Node.js команды

```bash
npm start                    # Запуск веб-сервера
npm test                     # Запуск тестов
```

### Python/Telegram бот команды

```bash
./setup-venv.sh              # Настройка Python окружения (один раз)
./start-telegram-bot.sh      # Запуск бота с проверками
npm run news-bot:start       # Запуск через npm
venv/bin/python telegram-news-bot.py  # Прямой запуск
```

### Управление процессами

```bash
# Найти процесс
ps aux | grep node
ps aux | grep telegram-news-bot

# Остановить процесс
pkill -f "node server.js"
pkill -f "telegram-news-bot.py"
```

## 🔒 Безопасность

Проект использует следующие меры безопасности:

- **Helmet** - настройка HTTP заголовков безопасности
- **XSS защита** - очистка пользовательского контента от вредоносного HTML
- **Content Security Policy** - контроль загружаемых ресурсов
- **Валидация форм** - проверка данных на сервере
- **Изолированное окружение** - Python venv для зависимостей
- **Логирование** - запись всех действий и ошибок

### Рекомендации:

1. Не публикуйте `.env` файл
2. Используйте сильные пароли
3. Регулярно обновляйте зависимости:
   ```bash
   npm update
   venv/bin/pip install --upgrade -r requirements.txt
   ```
4. Используйте HTTPS в продакшене

## 📊 Мониторинг и логи

Логи автоматически сохраняются в папке `logs/`:

```
logs/
├── application-YYYY-MM-DD.log    # Все логи приложения
├── error-YYYY-MM-DD.log          # Только ошибки
├── server.log                    # Логи веб-сервера (если запущен в фоне)
└── telegram-bot.log              # Логи Telegram бота (если запущен в фоне)
```

Просмотр логов в реальном времени:
```bash
tail -f logs/application-2025-11-21.log
tail -f logs/telegram-bot.log
```

## 🌍 Мультиязычность

Сайт поддерживает 3 языка:
- 🇷🇺 Русский (по умолчанию)
- 🏴 Ингушский
- 🇬🇧 Английский

Смена языка через параметр URL:
```
http://localhost:3000/?lang=ru    # Русский
http://localhost:3000/?lang=inh   # Ингушский
http://localhost:3000/?lang=en    # Английский
```

Язык сохраняется в cookie и применяется ко всем страницам.

## 📧 Настройка Email (для формы обратной связи)

### Для Gmail:

1. Включите двухфакторную аутентификацию
2. Перейдите в [Пароли приложений](https://myaccount.google.com/apppasswords)
3. Создайте новый пароль приложения
4. Используйте его в `EMAIL_PASS` в `.env`

### Для других почтовых сервисов:

Обновите настройки SMTP в `.env`:
```env
EMAIL_HOST=smtp.yandex.ru
EMAIL_PORT=465
EMAIL_SECURE=true
EMAIL_USER=your_email@yandex.ru
EMAIL_PASS=your_password
```

## 🐛 Решение проблем

### Веб-сервер не запускается

```bash
# Проверьте что порт 3000 свободен
lsof -i :3000

# Или используйте другой порт
PORT=8080 npm start
```

### Telegram бот не получает сообщения

1. Убедитесь что бот добавлен как администратор канала
2. Проверьте токен бота в `.env`
3. Проверьте username канала (должен начинаться с @)
4. Посмотрите логи: `tail -f logs/telegram-bot.log`

### Ошибка "externally-managed-environment" при установке Python пакетов

**НЕ используйте** `pip install` напрямую! Используйте:
```bash
./setup-venv.sh              # Создаст виртуальное окружение
./start-telegram-bot.sh      # Автоматически использует venv
```

### Новости не отображаются

1. Проверьте что файл `data/telegram-posts.json` существует
2. Убедитесь что бот запущен: `ps aux | grep telegram-news-bot`
3. Опубликуйте тестовый пост в канале
4. Проверьте логи бота на ошибки

## 🚀 Деплой в продакшен

### Systemd сервисы (Linux)

#### Веб-сервер (`/etc/systemd/system/ingush-website.service`):
```ini
[Unit]
Description=Ingush Committee Website
After=network.target

[Service]
Type=simple
User=your_username
WorkingDirectory=/path/to/ingush-committee
ExecStart=/usr/bin/node /path/to/ingush-committee/server.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

#### Telegram бот (`/etc/systemd/system/telegram-news-bot.service`):
```ini
[Unit]
Description=Telegram News Bot
After=network.target

[Service]
Type=simple
User=your_username
WorkingDirectory=/path/to/ingush-committee
ExecStart=/path/to/ingush-committee/venv/bin/python /path/to/ingush-committee/telegram-news-bot.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Активация сервисов:
```bash
sudo systemctl daemon-reload
sudo systemctl enable ingush-website
sudo systemctl enable telegram-news-bot
sudo systemctl start ingush-website
sudo systemctl start telegram-news-bot

# Проверка статуса
sudo systemctl status ingush-website
sudo systemctl status telegram-news-bot
```

### Nginx конфигурация

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Кэширование статических файлов
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2)$ {
        proxy_pass http://localhost:3000;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

## 🤝 Вклад в проект

1. Форкните репозиторий
2. Создайте ветку для функции (`git checkout -b feature/AmazingFeature`)
3. Закоммитьте изменения (`git commit -m 'Add some AmazingFeature'`)
4. Запушьте в ветку (`git push origin feature/AmazingFeature`)
5. Откройте Pull Request

## 📝 Лицензия

Этот проект лицензирован под лицензией ISC.

## 👥 Контакты

- **Telegram**: [@ingcommitte](https://t.me/ingcommitte)
- **YouTube**: [@ingcommittee](https://www.youtube.com/@ingcommittee)
- **Email**: contact@ingush-committee.org
- **Домен**: [namecheap.com](https://www.namecheap.com/)

## 📚 Дополнительная документация

- [NEWS_SETUP.md](NEWS_SETUP.md) - Подробная настройка системы новостей
- [QUICKSTART_NEWS.md](QUICKSTART_NEWS.md) - Быстрый старт системы новостей

---

**Сделано с ❤️ для Комитета Ингушской Независимости**
