# Настройка системы новостей из Telegram

Эта система автоматически получает посты из вашего Telegram канала и отображает их на сайте.

## Требования

- Python 3.8+
- Node.js (уже установлен для основного сайта)
- Telegram Bot Token
- Публичный Telegram канал

## Установка

### 1. Установите Python зависимости

```bash
pip install -r requirements.txt
```

### 2. Создайте Telegram бота

1. Найдите [@BotFather](https://t.me/BotFather) в Telegram
2. Отправьте команду `/newbot`
3. Следуйте инструкциям для создания бота
4. Сохраните полученный **Bot Token**

### 3. Добавьте бота в ваш канал

1. Откройте ваш Telegram канал
2. Перейдите в настройки канала → Администраторы
3. Нажмите "Добавить администратора"
4. Найдите вашего бота и добавьте его
5. Убедитесь, что бот имеет право "Публиковать сообщения" (можно отключить все остальные права)

### 4. Настройте переменные окружения

Откройте файл `.env` (или создайте из `.env.example`) и добавьте:

```bash
# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_CHANNEL_USERNAME=@your_channel_name
```

Замените:
- `your_bot_token_here` на токен, полученный от BotFather
- `@your_channel_name` на username вашего канала (например, `@ingushcommittee`)

## Запуск

### Запуск бота для получения новостей

```bash
python telegram-news-bot.py
```

Бот запустится и начнет слушать новые посты из вашего канала. Оставьте его работающим в фоне.

### Запуск в фоновом режиме (Linux/macOS)

```bash
nohup python telegram-news-bot.py > logs/telegram-bot.log 2>&1 &
```

### Запуск с помощью systemd (для постоянной работы)

Создайте файл `/etc/systemd/system/telegram-news-bot.service`:

```ini
[Unit]
Description=Telegram News Bot для Ingush Committee
After=network.target

[Service]
Type=simple
User=your_username
WorkingDirectory=/path/to/Ingushcommittee
ExecStart=/usr/bin/python3 /path/to/Ingushcommittee/telegram-news-bot.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Затем:

```bash
sudo systemctl daemon-reload
sudo systemctl enable telegram-news-bot
sudo systemctl start telegram-news-bot
sudo systemctl status telegram-news-bot
```

## Использование

1. **Публикация новостей**: Просто публикуйте посты в вашем Telegram канале. Бот автоматически:
   - Получит новый пост
   - Скачает все медиафайлы (фото и видео)
   - Сохранит пост с форматированием
   - Отобразит на странице `/news`

2. **Просмотр новостей**: Откройте сайт и перейдите в раздел "Новости" в навигации

3. **API доступ**: Получите новости через API:
   ```
   GET /api/news?page=1&limit=10
   ```

## Поддерживаемые типы контента

- ✅ Текст с форматированием (жирный, курсив, ссылки)
- ✅ Фото (все размеры)
- ✅ Видео (MP4 и другие форматы)
- ✅ Несколько медиафайлов в одном посте

## Хранение данных

- Новости хранятся в `data/telegram-posts.json`
- Медиафайлы хранятся в `public/media/photos/` и `public/media/videos/`
- По умолчанию хранится до 50 последних новостей

## Решение проблем

### Бот не получает сообщения

1. Убедитесь, что бот добавлен как администратор канала
2. Проверьте, что токен бота указан правильно в `.env`
3. Проверьте, что username канала указан правильно (с символом @)

### Медиафайлы не загружаются

1. Убедитесь, что директории `public/media/photos/` и `public/media/videos/` существуют
2. Проверьте права доступа к этим директориям
3. Проверьте логи бота на наличие ошибок

### Страница новостей пустая

1. Убедитесь, что файл `data/telegram-posts.json` существует и содержит данные
2. Проверьте, что бот работает и получает сообщения
3. Опубликуйте тестовый пост в канале

## Безопасность

- Не публикуйте файл `.env` в публичных репозиториях
- Регулярно обновляйте зависимости: `pip install --upgrade -r requirements.txt`
- Используйте HTTPS для вашего сайта

## Дополнительно

- Максимальное количество хранимых постов можно изменить в `telegram-news-bot.py` (переменная `MAX_POSTS`)
- Стили страницы новостей находятся в `public/css/pages/news.css`
- Шаблон страницы находится в `views/news.ejs`
