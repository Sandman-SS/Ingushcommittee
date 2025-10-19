const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { log } = require('./logger');

// Директории для хранения медиафайлов
const MEDIA_DIR = path.join(__dirname, '..', 'public', 'media');
const PHOTOS_DIR = path.join(MEDIA_DIR, 'photos');
const VIDEOS_DIR = path.join(MEDIA_DIR, 'videos');

/**
 * Инициализация директорий для медиафайлов
 */
function initMediaDirectories() {
    try {
        [MEDIA_DIR, PHOTOS_DIR, VIDEOS_DIR].forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
                log.info('Media directory created', { path: dir });
            }
        });
    } catch (error) {
        log.error('Failed to create media directories', {
            error: error.message,
            stack: error.stack
        });
        throw error;
    }
}

/**
 * Генерация уникального имени файла
 * @param {string} prefix - префикс (photo/video)
 * @param {string} extension - расширение файла
 * @returns {string}
 */
function generateFileName(prefix, extension) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `${prefix}_${timestamp}_${random}.${extension}`;
}

/**
 * Определение расширения файла по MIME типу
 * @param {string} mimeType - MIME тип
 * @returns {string}
 */
function getExtensionFromMimeType(mimeType) {
    const mimeMap = {
        'image/jpeg': 'jpg',
        'image/jpg': 'jpg',
        'image/png': 'png',
        'image/gif': 'gif',
        'image/webp': 'webp',
        'video/mp4': 'mp4',
        'video/mpeg': 'mpeg',
        'video/quicktime': 'mov',
        'video/x-msvideo': 'avi',
        'video/webm': 'webm'
    };
    return mimeMap[mimeType] || 'bin';
}

/**
 * Скачивание файла по URL
 * @param {string} url - URL файла
 * @param {string} filepath - путь для сохранения
 * @returns {Promise<boolean>}
 */
async function downloadFile(url, filepath) {
    try {
        const response = await axios({
            method: 'GET',
            url: url,
            responseType: 'stream',
            timeout: 60000 // 60 секунд
        });

        const writer = fs.createWriteStream(filepath);

        response.data.pipe(writer);

        return new Promise((resolve, reject) => {
            writer.on('finish', () => resolve(true));
            writer.on('error', reject);
        });
    } catch (error) {
        log.error('Failed to download file', {
            url: url,
            error: error.message
        });
        throw error;
    }
}

/**
 * Скачивание и сохранение фото из Telegram
 * @param {string} fileUrl - URL файла из Telegram
 * @param {string} mimeType - MIME тип файла (опционально)
 * @returns {Promise<string|null>} - путь к сохраненному файлу или null
 */
async function downloadPhoto(fileUrl, mimeType = 'image/jpeg') {
    try {
        initMediaDirectories();

        const extension = getExtensionFromMimeType(mimeType);
        const filename = generateFileName('photo', extension);
        const filepath = path.join(PHOTOS_DIR, filename);

        await downloadFile(fileUrl, filepath);

        const relativePath = `/media/photos/${filename}`;
        log.info('Photo downloaded', { url: fileUrl, path: relativePath });

        return relativePath;
    } catch (error) {
        log.error('Failed to download photo', {
            url: fileUrl,
            error: error.message
        });
        return null;
    }
}

/**
 * Скачивание и сохранение видео из Telegram
 * @param {string} fileUrl - URL файла из Telegram
 * @param {string} mimeType - MIME тип файла (опционально)
 * @returns {Promise<string|null>} - путь к сохраненному файлу или null
 */
async function downloadVideo(fileUrl, mimeType = 'video/mp4') {
    try {
        initMediaDirectories();

        const extension = getExtensionFromMimeType(mimeType);
        const filename = generateFileName('video', extension);
        const filepath = path.join(VIDEOS_DIR, filename);

        await downloadFile(fileUrl, filepath);

        const relativePath = `/media/videos/${filename}`;
        log.info('Video downloaded', { url: fileUrl, path: relativePath });

        return relativePath;
    } catch (error) {
        log.error('Failed to download video', {
            url: fileUrl,
            error: error.message
        });
        return null;
    }
}

/**
 * Скачивание медиафайла (автоматическое определение типа)
 * @param {string} fileUrl - URL файла
 * @param {string} mediaType - тип медиа ('photo' или 'video')
 * @param {string} mimeType - MIME тип (опционально)
 * @returns {Promise<string|null>}
 */
async function downloadMedia(fileUrl, mediaType, mimeType = null) {
    if (!fileUrl) return null;

    if (mediaType === 'photo') {
        return await downloadPhoto(fileUrl, mimeType || 'image/jpeg');
    } else if (mediaType === 'video') {
        return await downloadVideo(fileUrl, mimeType || 'video/mp4');
    }

    return null;
}

/**
 * Получение статистики по медиафайлам
 * @returns {Object}
 */
function getMediaStats() {
    try {
        initMediaDirectories();

        const photosCount = fs.readdirSync(PHOTOS_DIR).length;
        const videosCount = fs.readdirSync(VIDEOS_DIR).length;

        const getDirectorySize = (dir) => {
            let totalSize = 0;
            const files = fs.readdirSync(dir);
            files.forEach(file => {
                const stats = fs.statSync(path.join(dir, file));
                totalSize += stats.size;
            });
            return totalSize;
        };

        const photosSize = getDirectorySize(PHOTOS_DIR);
        const videosSize = getDirectorySize(VIDEOS_DIR);

        return {
            photos: {
                count: photosCount,
                size: photosSize,
                sizeFormatted: formatBytes(photosSize)
            },
            videos: {
                count: videosCount,
                size: videosSize,
                sizeFormatted: formatBytes(videosSize)
            },
            total: {
                count: photosCount + videosCount,
                size: photosSize + videosSize,
                sizeFormatted: formatBytes(photosSize + videosSize)
            }
        };
    } catch (error) {
        log.error('Failed to get media stats', { error: error.message });
        return {
            photos: { count: 0, size: 0, sizeFormatted: '0 B' },
            videos: { count: 0, size: 0, sizeFormatted: '0 B' },
            total: { count: 0, size: 0, sizeFormatted: '0 B' }
        };
    }
}

/**
 * Форматирование размера в читаемый вид
 * @param {number} bytes - размер в байтах
 * @returns {string}
 */
function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

module.exports = {
    initMediaDirectories,
    downloadPhoto,
    downloadVideo,
    downloadMedia,
    getMediaStats,
    MEDIA_DIR,
    PHOTOS_DIR,
    VIDEOS_DIR
};
