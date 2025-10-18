const { TelegramClient } = require('telegram');
const { StringSession } = require('telegram/sessions');
const input = require('input');
const xss = require('xss');
const fs = require('fs');
const path = require('path');
const { savePosts } = require('./data-storage');
const { log } = require('./logger');
require('dotenv').config();

/**
 * Сохранение медиафайла локально
 * @param {string} tempPath - путь к временному файлу
 * @param {string} mediaType - тип медиа ('photo' или 'video')
 * @param {string} mimeType - MIME тип
 * @returns {Promise<string|null>}
 */
async function saveMediaToLocal(tempPath, mediaType, mimeType) {
    const { initMediaDirectories, generateFileName, getExtensionFromMimeType, PHOTOS_DIR, VIDEOS_DIR } = require('./media-downloader');

    initMediaDirectories();

    const extension = getExtensionFromMimeType(mimeType);
    const filename = generateFileName(mediaType, extension);

    const targetDir = mediaType === 'photo' ? PHOTOS_DIR : VIDEOS_DIR;
    const targetPath = path.join(targetDir, filename);

    // Копируем файл
    fs.copyFileSync(tempPath, targetPath);

    return `/media/${mediaType === 'photo' ? 'photos' : 'videos'}/${filename}`;
}

/**
 * Экспорт истории сообщений из Telegram канала
 * Использует MTProto API (не Bot API) для доступа к истории
 */
async function exportTelegramHistory() {
    console.log('📥 Экспорт истории постов из Telegram канала\n');

    // Проверяем наличие необходимых переменных окружения
    const apiId = parseInt(process.env.TELEGRAM_API_ID);
    const apiHash = process.env.TELEGRAM_API_HASH;
    const channelUsername = process.env.TELEGRAM_CHANNEL_USERNAME || 'ingcommitte';
    const stringSession = process.env.TELEGRAM_SESSION || '';

    if (!apiId || !apiHash) {
        console.error('❌ Ошибка: TELEGRAM_API_ID и TELEGRAM_API_HASH не установлены');
        console.log('\n📝 Инструкция по получению API credentials:');
        console.log('1. Перейдите на https://my.telegram.org');
        console.log('2. Войдите с вашим номером телефона');
        console.log('3. Перейдите в "API development tools"');
        console.log('4. Создайте новое приложение');
        console.log('5. Скопируйте api_id и api_hash в .env файл\n');
        console.log('Добавьте в .env:');
        console.log('TELEGRAM_API_ID=ваш_api_id');
        console.log('TELEGRAM_API_HASH=ваш_api_hash');
        console.log('TELEGRAM_CHANNEL_USERNAME=ingcommitte\n');
        process.exit(1);
    }

    const session = new StringSession(stringSession);
    const client = new TelegramClient(session, apiId, apiHash, {
        connectionRetries: 5,
    });

    try {
        console.log('🔐 Подключение к Telegram...');
        await client.start({
            phoneNumber: async () => await input.text('Введите ваш номер телефона: '),
            password: async () => await input.text('Введите пароль 2FA (если включен): '),
            phoneCode: async () => await input.text('Введите код из Telegram: '),
            onError: (err) => console.error('❌ Ошибка:', err),
        });

        console.log('✅ Успешно подключено!');
        console.log('🔑 Session string для .env (сохраните для будущих запусков):');
        console.log(client.session.save());
        console.log('\n📥 Загрузка постов из канала...\n');

        // Получаем информацию о канале
        const channel = await client.getEntity(channelUsername);
        console.log(`✅ Найден канал: ${channel.title}`);

        // Загружаем историю сообщений
        const messages = [];
        const limit = parseInt(process.env.EXPORT_LIMIT) || 100; // Сколько постов загрузить

        console.log(`📊 Загрузка последних ${limit} сообщений...\n`);

        const result = await client.getMessages(channel, {
            limit: limit,
        });

        let processedCount = 0;

        for (const message of result) {
            if (!message.message && !message.media) {
                continue; // Пропускаем пустые сообщения
            }

            let text = message.message || '';
            let mediaUrl = null;
            let mediaType = null;

            // Обработка форматирования текста
            if (message.entities && message.entities.length > 0) {
                // Сортируем entities по offset в обратном порядке
                const entities = [...message.entities].sort((a, b) => b.offset - a.offset);

                entities.forEach(entity => {
                    const start = entity.offset;
                    const length = entity.length;

                    if (start + length <= text.length) {
                        const entityText = text.substring(start, start + length);
                        let replacement = entityText;

                        if (entity.className === 'MessageEntityBold') {
                            replacement = `<b>${entityText}</b>`;
                        } else if (entity.className === 'MessageEntityItalic') {
                            replacement = `<i>${entityText}</i>`;
                        } else if (entity.className === 'MessageEntityTextUrl') {
                            replacement = `<a href="${entity.url}" target="_blank" rel="noopener noreferrer">${entityText}</a>`;
                        } else if (entity.className === 'MessageEntityUrl') {
                            let url = entityText;
                            if (!url.startsWith('http://') && !url.startsWith('https://')) {
                                url = 'http://' + url;
                            }
                            replacement = `<a href="${url}" target="_blank" rel="noopener noreferrer">${entityText}</a>`;
                        }

                        text = text.substring(0, start) + replacement + text.substring(start + length);
                    }
                });
            }

            // Обработка медиа
            if (message.media) {
                if (message.media.className === 'MessageMediaPhoto') {
                    mediaType = 'photo';
                    try {
                        // Скачиваем фото
                        const buffer = await client.downloadMedia(message.media);
                        if (buffer) {
                            // Сохраняем во временный файл и загружаем через media-downloader
                            const tempPath = path.join(__dirname, '..', 'temp', `photo_${message.id}.jpg`);
                            const tempDir = path.dirname(tempPath);
                            if (!fs.existsSync(tempDir)) {
                                fs.mkdirSync(tempDir, { recursive: true });
                            }
                            fs.writeFileSync(tempPath, buffer);

                            // Сохраняем локально
                            mediaUrl = await saveMediaToLocal(tempPath, 'photo', 'image/jpeg');

                            // Удаляем временный файл
                            fs.unlinkSync(tempPath);

                            console.log(`   📷 Скачано фото для поста ${message.id}`);
                        }
                    } catch (photoError) {
                        console.log(`   ⚠️  Не удалось скачать фото: ${photoError.message}`);
                        mediaUrl = null;
                    }
                } else if (message.media.className === 'MessageMediaDocument') {
                    if (message.media.document && message.media.document.mimeType.startsWith('video/')) {
                        mediaType = 'video';
                        try {
                            // Скачиваем видео
                            const buffer = await client.downloadMedia(message.media);
                            if (buffer) {
                                const mimeType = message.media.document.mimeType;
                                const ext = mimeType.split('/')[1] || 'mp4';
                                const tempPath = path.join(__dirname, '..', 'temp', `video_${message.id}.${ext}`);
                                const tempDir = path.dirname(tempPath);
                                if (!fs.existsSync(tempDir)) {
                                    fs.mkdirSync(tempDir, { recursive: true });
                                }
                                fs.writeFileSync(tempPath, buffer);

                                // Сохраняем локально
                                mediaUrl = await saveMediaToLocal(tempPath, 'video', mimeType);

                                // Удаляем временный файл
                                fs.unlinkSync(tempPath);

                                console.log(`   🎥 Скачано видео для поста ${message.id}`);
                            }
                        } catch (videoError) {
                            console.log(`   ⚠️  Не удалось скачать видео: ${videoError.message}`);
                            mediaUrl = null;
                        }
                    }
                }
            }

            // Преобразуем переносы строк
            text = text.replace(/\n/g, '<br>');

            // Очистка от XSS
            const cleanText = xss(text, {
                whiteList: {
                    a: ['href', 'title', 'target', 'rel'],
                    b: [],
                    i: [],
                    br: [],
                    strong: [],
                    em: [],
                    p: [],
                    span: []
                }
            });

            messages.push({
                text: cleanText,
                date: new Date(message.date * 1000).toISOString(),
                mediaUrl: mediaUrl,
                mediaType: mediaType,
                messageId: message.id
            });

            processedCount++;
            if (processedCount % 10 === 0) {
                console.log(`   Обработано: ${processedCount}/${result.length}`);
            }
        }

        console.log(`\n✅ Загружено ${messages.length} сообщений`);

        if (messages.length > 0) {
            // Сохраняем в файл
            savePosts(messages);
            console.log('💾 Сообщения сохранены в data/telegram-posts.json');

            log.info('Telegram history exported', {
                count: messages.length,
                channel: channelUsername
            });
        } else {
            console.log('⚠️  Не найдено сообщений для экспорта');
        }

    } catch (error) {
        console.error('❌ Ошибка при экспорте:', error.message);
        log.error('Failed to export Telegram history', {
            error: error.message,
            stack: error.stack
        });
    } finally {
        await client.disconnect();
        console.log('\n👋 Отключено от Telegram');
    }
}

// Запускаем если скрипт вызван напрямую
if (require.main === module) {
    exportTelegramHistory().then(() => {
        process.exit(0);
    }).catch(err => {
        console.error('❌ Критическая ошибка:', err);
        process.exit(1);
    });
}

module.exports = { exportTelegramHistory };
