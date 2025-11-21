#!/usr/bin/env python3
"""
Telegram News Bot для автоматического получения новостей из канала
Бот автоматически получает посты из публичного Telegram канала
и сохраняет их в JSON формате для отображения на сайте
"""

import os
import sys
import json
import logging
import requests
from pathlib import Path
from datetime import datetime
from typing import Optional, List, Dict, Any
from dotenv import load_dotenv
from telegram import Update
from telegram.ext import (
    Application,
    ContextTypes,
    MessageHandler,
    filters
)

# Загрузка переменных окружения
load_dotenv()

# Настройка логирования
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)

# Конфигурация
BOT_TOKEN = os.getenv('TELEGRAM_BOT_TOKEN')
CHANNEL_USERNAME = os.getenv('TELEGRAM_CHANNEL_USERNAME')  # Например: @your_channel
MAX_POSTS = 50

# Пути к файлам
BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / 'data'
POSTS_FILE = DATA_DIR / 'telegram-posts.json'
MEDIA_DIR = BASE_DIR / 'public' / 'media'
PHOTOS_DIR = MEDIA_DIR / 'photos'
VIDEOS_DIR = MEDIA_DIR / 'videos'


def init_directories():
    """Создание необходимых директорий"""
    for directory in [DATA_DIR, MEDIA_DIR, PHOTOS_DIR, VIDEOS_DIR]:
        directory.mkdir(parents=True, exist_ok=True)
        logger.info(f'Directory ensured: {directory}')


def load_posts() -> List[Dict[str, Any]]:
    """Загрузка постов из JSON файла"""
    try:
        if POSTS_FILE.exists():
            with open(POSTS_FILE, 'r', encoding='utf-8') as f:
                posts = json.load(f)
                logger.info(f'Loaded {len(posts)} posts from storage')
                return posts
        return []
    except Exception as e:
        logger.error(f'Failed to load posts: {e}')
        return []


def save_posts(posts: List[Dict[str, Any]]):
    """Сохранение постов в JSON файл"""
    try:
        # Ограничиваем количество постов
        posts_to_save = posts[:MAX_POSTS]

        with open(POSTS_FILE, 'w', encoding='utf-8') as f:
            json.dump(posts_to_save, f, ensure_ascii=False, indent=2)

        logger.info(f'Saved {len(posts_to_save)} posts to storage')
    except Exception as e:
        logger.error(f'Failed to save posts: {e}')
        raise


def download_file(file_url: str, save_path: Path) -> bool:
    """Скачивание файла по URL"""
    try:
        response = requests.get(file_url, timeout=60)
        response.raise_for_status()

        with open(save_path, 'wb') as f:
            f.write(response.content)

        logger.info(f'Downloaded file: {save_path.name}')
        return True
    except Exception as e:
        logger.error(f'Failed to download file {file_url}: {e}')
        return False


def generate_filename(prefix: str, extension: str) -> str:
    """Генерация уникального имени файла"""
    timestamp = int(datetime.now().timestamp() * 1000)
    return f"{prefix}_{timestamp}.{extension}"


async def download_photo(file_id: str, context: ContextTypes.DEFAULT_TYPE) -> Optional[str]:
    """Скачивание фото из Telegram"""
    try:
        file = await context.bot.get_file(file_id)
        filename = generate_filename('photo', 'jpg')
        save_path = PHOTOS_DIR / filename

        await file.download_to_drive(save_path)

        relative_path = f'/media/photos/{filename}'
        logger.info(f'Photo downloaded: {relative_path}')
        return relative_path
    except Exception as e:
        logger.error(f'Failed to download photo: {e}')
        return None


async def download_video(file_id: str, context: ContextTypes.DEFAULT_TYPE) -> Optional[str]:
    """Скачивание видео из Telegram"""
    try:
        file = await context.bot.get_file(file_id)
        filename = generate_filename('video', 'mp4')
        save_path = VIDEOS_DIR / filename

        await file.download_to_drive(save_path)

        relative_path = f'/media/videos/{filename}'
        logger.info(f'Video downloaded: {relative_path}')
        return relative_path
    except Exception as e:
        logger.error(f'Failed to download video: {e}')
        return None


def format_text_entities(text: str, entities) -> str:
    """Форматирование текста с учетом entities (жирный, курсив, ссылки и т.д.)"""
    if not entities:
        return text

    # Сортируем entities по offset в обратном порядке, чтобы не сбивать позиции
    sorted_entities = sorted(entities, key=lambda e: e.offset, reverse=True)

    formatted_text = text
    for entity in sorted_entities:
        start = entity.offset
        end = start + entity.length
        entity_text = text[start:end]

        # Применяем форматирование в зависимости от типа
        if entity.type == 'bold':
            replacement = f'<strong>{entity_text}</strong>'
        elif entity.type == 'italic':
            replacement = f'<em>{entity_text}</em>'
        elif entity.type == 'code':
            replacement = f'<code>{entity_text}</code>'
        elif entity.type == 'pre':
            replacement = f'<pre>{entity_text}</pre>'
        elif entity.type == 'text_link':
            replacement = f'<a href="{entity.url}" target="_blank">{entity_text}</a>'
        elif entity.type == 'url':
            replacement = f'<a href="{entity_text}" target="_blank">{entity_text}</a>'
        else:
            continue

        formatted_text = formatted_text[:start] + replacement + formatted_text[end:]

    return formatted_text


async def handle_channel_post(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Обработчик постов из канала"""
    try:
        post = update.channel_post

        # Проверяем, что пост из нужного канала (если указан)
        if CHANNEL_USERNAME:
            channel_username = post.chat.username
            if channel_username and f'@{channel_username}' != CHANNEL_USERNAME:
                logger.info(f'Ignoring post from different channel: @{channel_username}')
                return

        logger.info(f'Processing new channel post: {post.message_id}')

        # Извлекаем текст с форматированием
        text = ''
        if post.text:
            text = format_text_entities(post.text, post.entities)
        elif post.caption:
            text = format_text_entities(post.caption, post.caption_entities)

        # Обрабатываем медиафайлы
        media_urls = []
        media_types = []

        # Обработка фото
        if post.photo:
            # Берем фото наибольшего размера
            largest_photo = max(post.photo, key=lambda p: p.file_size or 0)
            photo_url = await download_photo(largest_photo.file_id, context)
            if photo_url:
                media_urls.append(photo_url)
                media_types.append('photo')

        # Обработка видео
        if post.video:
            video_url = await download_video(post.video.file_id, context)
            if video_url:
                media_urls.append(video_url)
                media_types.append('video')

        # Пропускаем пост если нет ни текста, ни медиа
        if not text and not media_urls:
            logger.info('Post has no text or media, skipping')
            return

        # Создаем объект поста
        news_post = {
            'id': post.message_id,
            'text': text,
            'date': post.date.isoformat(),
            'media': media_urls,
            'mediaTypes': media_types,
            'channelUsername': post.chat.username or '',
            'channelTitle': post.chat.title or ''
        }

        # Загружаем существующие посты
        posts = load_posts()

        # Проверяем, не добавлен ли уже этот пост
        if any(p.get('id') == post.message_id for p in posts):
            logger.info(f'Post {post.message_id} already exists, skipping')
            return

        # Добавляем новый пост в начало списка
        posts.insert(0, news_post)

        # Сохраняем обновленный список
        save_posts(posts)

        logger.info(f'Successfully saved post {post.message_id}. Total posts: {len(posts)}')

    except Exception as e:
        logger.error(f'Error handling channel post: {e}', exc_info=True)


async def error_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Обработчик ошибок"""
    logger.error(f'Update {update} caused error: {context.error}', exc_info=context.error)


def main():
    """Запуск бота"""
    # Проверка переменных окружения
    if not BOT_TOKEN:
        logger.error('TELEGRAM_BOT_TOKEN not set in environment variables')
        sys.exit(1)

    logger.info('Starting Telegram News Bot...')
    logger.info(f'Channel: {CHANNEL_USERNAME or "ANY"}')

    # Инициализация директорий
    init_directories()

    # Создание приложения
    application = Application.builder().token(BOT_TOKEN).build()

    # Добавляем обработчик постов из канала
    # В версии 21.x используется MessageHandler с фильтром UpdateType.CHANNEL_POST
    application.add_handler(
        MessageHandler(filters.UpdateType.CHANNEL_POST, handle_channel_post)
    )

    # Добавляем обработчик ошибок
    application.add_error_handler(error_handler)

    # Запуск бота
    logger.info('Bot is running. Press Ctrl+C to stop.')
    application.run_polling(allowed_updates=Update.ALL_TYPES)


if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        logger.info('Bot stopped by user')
    except Exception as e:
        logger.error(f'Fatal error: {e}', exc_info=True)
        sys.exit(1)
