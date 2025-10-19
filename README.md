# Комитет Ингушской Независимости - Официальный сайт

## 📋 Требования

- Node.js 14.0 или выше
- npm или yarn
- Telegram Bot Token

## 🛠 Установка

1. Клонируйте репозиторий:
```bash
git clone https://github.com/your-username/ingush-committee.git
cd ingush-committee
```

2. Установите зависимости:
```bash
npm install
```

3. Скопируйте файл переменных окружения:
```bash
cp .env.example .env
```

4. Настройте переменные окружения в файле `.env`:
```env
# Обязательные
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
TELEGRAM_CHANNEL_ID=@your_channel_id

# Опциональные
PORT=3000
NODE_ENV=development
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
EMAIL_TO=contact@ingush-committee.org
GA_TRACKING_ID=UA-XXXXXXXXX-X
```

## 🚀 Запуск

### Режим разработки:
```bash
npm start
```

### Продакшн режим:
```bash
NODE_ENV=production npm start
```

Сайт будет доступен по адресу: http://localhost:3000

## 📁 Структура проекта

```
ingush-committee/
├── views/               # EJS шаблоны
│   ├── partials/       # Переиспользуемые компоненты
│   ├── activities/     # Страницы деятельности
│   └── ...
├── public/             # Статические файлы
│   ├── IMG/           # Изображения сайта
│   ├── js/            # JavaScript файлы
│   └── styles.css     # Стили
├── locales/           # Файлы локализации
├── utils/             # Утилиты
├── logs/              # Логи (создается автоматически)
└── server.js          # Основной файл сервера
```

## 🌐 Страницы

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
- `/map` - Интерактивная карта
- `/contact` - Контакты

## 🔒 Безопасность

- Helmet для настройки HTTP заголовков
- XSS защита для пользовательского контента
- Content Security Policy
- Валидация и санитизация форм
- Защита от CSRF (рекомендуется добавить)

## 📊 Мониторинг

Логи сохраняются в папке `logs/`:
- `application-YYYY-MM-DD.log` - все логи
- `error-YYYY-MM-DD.log` - только ошибки

## 🌍 Мультиязычность

Для смены языка используйте параметр `?lang=`:
- `/?lang=ru` - Русский
- `/?lang=inh` - Ингушский
- `/?lang=en` - Английский

## 📧 Email конфигурация

Для Gmail:
1. Включите двухфакторную аутентификацию
2. Создайте пароль приложения
3. Используйте его в `EMAIL_PASS`

## 🤝 Вклад в проект

1. Форкните репозиторий
2. Создайте ветку для функции (`git checkout -b feature/AmazingFeature`)
3. Закоммитьте изменения (`git commit -m 'Add some AmazingFeature'`)
4. Запушьте в ветку (`git push origin feature/AmazingFeature`)
5. Откройте Pull Request

## 📝 Лицензия

Этот проект лицензирован под лицензией ISC.

## 👥 Контакты

- Telegram: [@ingcommitte](https://t.me/ingcommitte)
- YouTube: [@ingcommittee](https://www.youtube.com/@ingcommittee)
- Email: contact@ingush-committee.org

## Домен
- Домен покупался на сайте (https://www.namecheap.com/shoppingcart/)
