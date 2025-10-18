const fs = require('fs');
const path = require('path');
const { log } = require('./logger');

// Путь к директории и файлу для хранения данных
const DATA_DIR = path.join(__dirname, '..', 'data');
const POSTS_FILE = path.join(DATA_DIR, 'telegram-posts.json');

// Максимальное количество постов для хранения
const MAX_POSTS = 50;

/**
 * Инициализация хранилища - создание директории и файла если их нет
 */
function initStorage() {
    try {
        // Создаем директорию data если её нет
        if (!fs.existsSync(DATA_DIR)) {
            fs.mkdirSync(DATA_DIR, { recursive: true });
            log.info('Data directory created', { path: DATA_DIR });
        }

        // Создаем пустой файл с постами если его нет
        if (!fs.existsSync(POSTS_FILE)) {
            fs.writeFileSync(POSTS_FILE, JSON.stringify([], null, 2), 'utf8');
            log.info('Posts file created', { path: POSTS_FILE });
        }
    } catch (error) {
        log.error('Failed to initialize storage', {
            error: error.message,
            stack: error.stack
        });
        throw error;
    }
}

/**
 * Загрузка всех постов из файла
 * @returns {Array} Массив постов
 */
function loadPosts() {
    try {
        initStorage(); // Убеждаемся что хранилище инициализировано

        const data = fs.readFileSync(POSTS_FILE, 'utf8');
        const posts = JSON.parse(data);

        // Восстанавливаем объекты Date из строк
        posts.forEach(post => {
            if (post.date) {
                post.date = new Date(post.date);
            }
        });

        log.info('Posts loaded from storage', { count: posts.length });
        return posts;
    } catch (error) {
        log.error('Failed to load posts', {
            error: error.message,
            stack: error.stack
        });
        // Возвращаем пустой массив в случае ошибки
        return [];
    }
}

/**
 * Сохранение постов в файл
 * @param {Array} posts - Массив постов для сохранения
 */
function savePosts(posts) {
    try {
        initStorage(); // Убеждаемся что хранилище инициализировано

        // Ограничиваем количество постов перед сохранением
        const postsToSave = posts.slice(0, MAX_POSTS);

        // Сохраняем в файл с отступами для читаемости
        fs.writeFileSync(
            POSTS_FILE,
            JSON.stringify(postsToSave, null, 2),
            'utf8'
        );

        log.info('Posts saved to storage', { count: postsToSave.length });
    } catch (error) {
        log.error('Failed to save posts', {
            error: error.message,
            stack: error.stack,
            postsCount: posts.length
        });
        throw error;
    }
}

/**
 * Добавление нового поста в хранилище
 * @param {Object} post - Объект поста для добавления
 */
function addPost(post) {
    try {
        // Загружаем существующие посты
        const posts = loadPosts();

        // Добавляем новый пост в начало массива
        posts.unshift(post);

        // Ограничиваем количество постов
        const trimmedPosts = posts.slice(0, MAX_POSTS);

        // Сохраняем обновленный список
        savePosts(trimmedPosts);

        log.info('Post added to storage', {
            totalPosts: trimmedPosts.length,
            hasMedia: !!post.mediaUrl
        });

        return trimmedPosts;
    } catch (error) {
        log.error('Failed to add post', {
            error: error.message,
            stack: error.stack
        });
        throw error;
    }
}

/**
 * Получение статистики хранилища
 * @returns {Object} Объект со статистикой
 */
function getStorageStats() {
    try {
        const posts = loadPosts();
        const stats = fs.statSync(POSTS_FILE);

        return {
            totalPosts: posts.length,
            fileSize: stats.size,
            lastModified: stats.mtime,
            filePath: POSTS_FILE
        };
    } catch (error) {
        log.error('Failed to get storage stats', {
            error: error.message
        });
        return {
            totalPosts: 0,
            fileSize: 0,
            lastModified: null,
            filePath: POSTS_FILE
        };
    }
}

module.exports = {
    initStorage,
    loadPosts,
    savePosts,
    addPost,
    getStorageStats,
    MAX_POSTS
};
