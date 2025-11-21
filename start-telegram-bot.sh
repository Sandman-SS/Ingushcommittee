#!/bin/bash
# Скрипт для запуска Telegram бота новостей

echo "🚀 Запуск Telegram бота новостей..."

# Проверка наличия Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 не установлен. Установите Python 3.8 или новее:"
    echo "   sudo apt install python3 python3-venv python3-full"
    exit 1
fi

# Проверка и создание виртуального окружения
if [ ! -d "venv" ]; then
    echo "⚠️  Виртуальное окружение не найдено. Создание..."
    if ! ./setup-venv.sh; then
        echo "❌ Ошибка при создании виртуального окружения"
        exit 1
    fi
fi

# Проверка наличия файла .env
if [ ! -f .env ]; then
    echo "⚠️  Файл .env не найден. Создаем из .env.example..."
    if [ -f .env.example ]; then
        cp .env.example .env
        echo "✅ Файл .env создан. Пожалуйста, настройте TELEGRAM_BOT_TOKEN и TELEGRAM_CHANNEL_USERNAME"
        echo "   Затем запустите скрипт снова."
        exit 1
    else
        echo "❌ Файл .env.example не найден."
        exit 1
    fi
fi

# Проверка переменных окружения
source .env
if [ -z "$TELEGRAM_BOT_TOKEN" ] || [ "$TELEGRAM_BOT_TOKEN" = "your_bot_token_here" ]; then
    echo "❌ TELEGRAM_BOT_TOKEN не настроен в файле .env"
    echo "   Откройте .env и укажите токен вашего бота."
    exit 1
fi

# Проверка наличия requirements.txt
if [ ! -f requirements.txt ]; then
    echo "❌ Файл requirements.txt не найден."
    exit 1
fi

# Активация виртуального окружения
echo "🔌 Активация виртуального окружения..."
source venv/bin/activate

# Проверка и установка зависимостей
echo "📦 Проверка зависимостей..."
if ! venv/bin/python -c "import telegram" &> /dev/null; then
    echo "📥 Установка зависимостей..."
    venv/bin/pip install -q -r requirements.txt
fi

# Создание необходимых директорий
mkdir -p data
mkdir -p public/media/photos
mkdir -p public/media/videos
mkdir -p logs

echo "✅ Все проверки пройдены"
echo "🤖 Запуск бота..."
echo "   Нажмите Ctrl+C для остановки"
echo ""

# Запуск бота через виртуальное окружение
venv/bin/python telegram-news-bot.py
