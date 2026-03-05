const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');
const xss = require('xss');
const { log } = require('./logger');

const CHANNEL = 'ingcommitte';
const BASE_URL = `https://t.me/s/${CHANNEL}`;
const DATA_DIR = path.join(__dirname, '..', 'data');
const POSTS_FILE = path.join(DATA_DIR, 'telegram-posts.json');
const MEDIA_DIR = path.join(__dirname, '..', 'public', 'media', 'photos');
const MAX_POSTS = 50;

// XSS whitelist — разрешаем безопасные HTML-теги из Telegram
const xssOptions = {
    whiteList: {
        b: [],
        strong: [],
        i: [],
        em: [],
        u: [],
        s: [],
        a: ['href', 'target', 'rel'],
        br: [],
        code: [],
        pre: [],
        blockquote: [],
    },
    stripIgnoreTag: true,
    stripIgnoreTagBody: ['script', 'style', 'tg-emoji'],
};

function ensureDirs() {
    for (const dir of [DATA_DIR, MEDIA_DIR]) {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    }
}

function loadPosts() {
    ensureDirs();
    try {
        if (fs.existsSync(POSTS_FILE)) {
            return JSON.parse(fs.readFileSync(POSTS_FILE, 'utf8'));
        }
    } catch (err) {
        log.error('Failed to load posts in scraper', { error: err.message });
    }
    return [];
}

function savePosts(posts) {
    ensureDirs();
    const trimmed = posts.slice(0, MAX_POSTS);
    fs.writeFileSync(POSTS_FILE, JSON.stringify(trimmed, null, 2), 'utf8');
    log.info(`Saved ${trimmed.length} posts`);
}

/**
 * Скачивает фото по URL и сохраняет локально.
 * Возвращает локальный путь вида /media/photos/filename.jpg
 */
async function downloadPhoto(url) {
    try {
        if (!url || url.startsWith('/media/')) return url;

        const filename = `tg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.jpg`;
        const savePath = path.join(MEDIA_DIR, filename);

        const response = await axios.get(url, {
            responseType: 'arraybuffer',
            timeout: 30000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            },
        });

        fs.writeFileSync(savePath, response.data);
        return `/media/photos/${filename}`;
    } catch (err) {
        log.error('Failed to download photo', { url, error: err.message });
        return null;
    }
}

/**
 * Очищает HTML-текст поста от Telegram-специфичных элементов,
 * сохраняя безопасное форматирование.
 */
function cleanPostHtml(rawHtml) {
    if (!rawHtml) return '';

    let html = rawHtml;

    // Убираем tg-emoji — оставляем только текстовое содержимое (эмоджи)
    html = html.replace(/<tg-emoji[^>]*>([\s\S]*?)<\/tg-emoji>/gi, (_, inner) => {
        // Извлекаем эмоджи из <b> внутри
        const emojiMatch = inner.match(/<b>(.*?)<\/b>/);
        return emojiMatch ? emojiMatch[1] : '';
    });

    // Убираем <i class="emoji" ...><b>X</b></i> — оставляем только содержимое <b>
    html = html.replace(/<i class="emoji"[^>]*><b>(.*?)<\/b><\/i>/gi, '$1');

    // Убираем onclick из ссылок
    html = html.replace(/\s*onclick="[^"]*"/gi, '');

    // Добавляем rel="noopener noreferrer" к ссылкам если нет
    html = html.replace(/<a\s/gi, '<a rel="noopener noreferrer" ');

    // Санитизация через xss
    html = xss(html, xssOptions);

    // Убираем множественные <br> подряд (более 2)
    html = html.replace(/(<br\s*\/?>){3,}/gi, '<br><br>');

    return html.trim();
}

/**
 * Извлекает URL фотографии из style атрибута элемента.
 */
function extractPhotoUrl($el) {
    const style = $el.attr('style') || '';
    const match = style.match(/background-image:\s*url\('([^']+)'\)/);
    return match ? match[1] : null;
}

/**
 * Парсит HTML страницы Telegram канала и возвращает массив постов.
 */
function parseChannelPage(html) {
    const $ = cheerio.load(html);
    const posts = [];

    $('.tgme_widget_message_wrap').each((_, wrap) => {
        const $msg = $(wrap).find('.tgme_widget_message');
        const dataPost = $msg.attr('data-post');
        if (!dataPost) return;

        const postId = parseInt(dataPost.split('/')[1], 10);
        if (!postId) return;

        // Пропускаем стикеры и другой неподдерживаемый медиаконтент без текста
        const $text = $msg.find('.tgme_widget_message_text');
        const $photoWrap = $msg.find('.tgme_widget_message_photo_wrap');
        const $videoWrap = $msg.find('.tgme_widget_message_video_wrap');

        const hasText = $text.length > 0 && $text.html().trim().length > 0;
        const hasPhoto = $photoWrap.length > 0;
        const hasVideo = $videoWrap.length > 0;

        // Пропускаем посты без текста и без медиа (стикеры, голосовые и т.д.)
        if (!hasText && !hasPhoto && !hasVideo) return;

        // Дата
        const $time = $msg.find('.tgme_widget_message_date time');
        const datetime = $time.attr('datetime') || new Date().toISOString();

        // Текст
        const rawHtml = hasText ? $text.html() : '';
        const text = cleanPostHtml(rawHtml);

        // Фотографии
        const photos = [];
        $photoWrap.each((_, el) => {
            const url = extractPhotoUrl($(el));
            if (url) photos.push(url);
        });

        // Видео (ссылки на Telegram, т.к. скачивать видео нельзя без авторизации)
        const videos = [];
        $videoWrap.each((_, el) => {
            const $video = $(el).find('video source');
            const src = $video.attr('src');
            if (src) videos.push(src);
        });

        // Просмотры
        const $views = $msg.find('.tgme_widget_message_views');
        const views = $views.text().trim();

        posts.push({
            id: postId,
            text,
            date: datetime,
            media: photos,
            mediaTypes: photos.map(() => 'photo'),
            channelUsername: CHANNEL,
            views,
        });
    });

    return posts;
}

/**
 * Скачивает и сохраняет фотографии для постов локально.
 * Заменяет удалённые URL на локальные пути.
 */
async function downloadPostPhotos(posts) {
    for (const post of posts) {
        if (!post.media || post.media.length === 0) continue;

        const localMedia = [];
        for (const url of post.media) {
            if (url.startsWith('/media/')) {
                localMedia.push(url);
            } else {
                const localPath = await downloadPhoto(url);
                localMedia.push(localPath || url);
            }
        }
        post.media = localMedia;
    }
}

/**
 * Загружает посты с одной страницы канала.
 * @param {number|null} before — ID поста для пагинации (загрузить посты старше этого)
 */
async function fetchPage(before) {
    const url = before ? `${BASE_URL}?before=${before}` : BASE_URL;

    const response = await axios.get(url, {
        timeout: 15000,
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept-Language': 'ru-RU,ru;q=0.9',
        },
    });

    return parseChannelPage(response.data);
}

/**
 * Получает ID для пагинации (самый ранний пост на странице).
 */
function getBeforeId(html) {
    const $ = cheerio.load(html);
    const $more = $('.tme_messages_more');
    const before = $more.attr('data-before');
    return before ? parseInt(before, 10) : null;
}

/**
 * Основная функция: загружает новые посты из канала.
 * При первом запуске загружает все доступные посты (до MAX_POSTS).
 * При последующих — только новые.
 */
async function scrapeChannel() {
    try {
        log.info('Starting Telegram channel scrape...');

        const existingPosts = loadPosts();
        const existingIds = new Set(existingPosts.map(p => p.id));
        const isFirstRun = existingPosts.length === 0;

        // Загружаем первую (последнюю) страницу
        const response = await axios.get(BASE_URL, {
            timeout: 15000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept-Language': 'ru-RU,ru;q=0.9',
            },
        });

        let allNewPosts = parseChannelPage(response.data);

        // Если первый запуск — загружаем ещё страницы для наполнения
        if (isFirstRun) {
            let beforeId = getBeforeId(response.data);
            let pages = 1;

            while (beforeId && allNewPosts.length < MAX_POSTS && pages < 5) {
                log.info(`Fetching page ${pages + 1}, before=${beforeId}`);
                try {
                    const pageResponse = await axios.get(`${BASE_URL}?before=${beforeId}`, {
                        timeout: 15000,
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                            'Accept-Language': 'ru-RU,ru;q=0.9',
                        },
                    });
                    const pagePosts = parseChannelPage(pageResponse.data);
                    if (pagePosts.length === 0) break;
                    allNewPosts = allNewPosts.concat(pagePosts);
                    beforeId = getBeforeId(pageResponse.data);
                    pages++;
                } catch (err) {
                    log.error('Failed to fetch additional page', { error: err.message });
                    break;
                }
            }
        }

        // Фильтруем только новые посты (которых ещё нет в хранилище)
        const newPosts = allNewPosts.filter(p => !existingIds.has(p.id));

        if (newPosts.length === 0) {
            log.info('No new posts found');
            return 0;
        }

        log.info(`Found ${newPosts.length} new posts, downloading photos...`);

        // Скачиваем фото для новых постов
        await downloadPostPhotos(newPosts);

        // Объединяем: новые посты + существующие, сортируем по дате (новые первые)
        const merged = [...newPosts, ...existingPosts]
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, MAX_POSTS);

        savePosts(merged);

        log.info(`Scrape complete. Added ${newPosts.length} new posts. Total: ${merged.length}`);
        return newPosts.length;
    } catch (err) {
        log.error('Channel scrape failed', { error: err.message, stack: err.stack });
        return 0;
    }
}

module.exports = { scrapeChannel };
