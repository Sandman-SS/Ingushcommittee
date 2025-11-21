#!/bin/bash
# Скрипт для настройки виртуального окружения Python

echo "🐍 Настройка виртуального окружения Python..."

# Проверка наличия Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 не установлен. Установите его:"
    echo "   sudo apt install python3 python3-venv python3-full"
    exit 1
fi

# Проверка наличия python3-venv
if ! python3 -m venv --help &> /dev/null; then
    echo "⚠️  Модуль venv не установлен. Установка..."
    echo "   Выполните: sudo apt install python3-venv python3-full"
    exit 1
fi

# Создание виртуального окружения
if [ ! -d "venv" ]; then
    echo "📦 Создание виртуального окружения..."
    python3 -m venv venv
    echo "✅ Виртуальное окружение создано"
else
    echo "✅ Виртуальное окружение уже существует"
fi

# Активация и установка зависимостей
echo "📥 Установка зависимостей..."
source venv/bin/activate

# Обновление pip
pip install --upgrade pip

# Установка зависимостей
pip install -r requirements.txt

echo ""
echo "✅ Настройка завершена!"
echo ""
echo "Для активации виртуального окружения используйте:"
echo "   source venv/bin/activate"
echo ""
echo "Для запуска бота используйте:"
echo "   npm run news-bot:start"
echo "   или"
echo "   ./start-telegram-bot.sh"
