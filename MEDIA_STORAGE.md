# 📸 Система хранения медиафайлов

Все фотографии и видео из Telegram сохраняются локально на сервере.

## 📁 Структура директорий

```
public/
└── media/
    ├── photos/          # Фотографии из постов
    │   ├── photo_1234567890_abc123.jpg
    │   └── photo_1234567891_def456.png
    └── videos/          # Видео из постов
        ├── video_1234567890_abc123.mp4
        └── video_1234567891_def456.webm
```

## 🔄 Автоматическое сохранение

### Новые посты (через Bot API)
Когда в Telegram канал публикуется новый пост с медиа:
1. Бот получает уведомление о новом посте
2. Скачивает медиафайл с серверов Telegram
3. Сохраняет локально в `public/media/photos/` или `public/media/videos/`
4. Генерирует уникальное имя файла: `{type}_{timestamp}_{random}.{ext}`
5. Сохраняет путь к файлу в базе данных

### Экспорт истории (через Client API)
При экспорте истории командой `npm run export-history`:
1. Скачиваются все медиафайлы из исторических постов
2. Сохраняются в тех же директориях
3. В консоли отображается прогресс: `📷 Скачано фото для поста 123`

## 🎨 Поддерживаемые форматы

### Изображения
- JPEG (.jpg)
- PNG (.png)
- GIF (.gif)
- WebP (.webp)

### Видео
- MP4 (.mp4)
- WebM (.webm)
- MOV (.mov)
- MPEG (.mpeg)
- AVI (.avi)

## 📊 Статистика

Для получения статистики по медиафайлам:

```javascript
const { getMediaStats } = require('./utils/media-downloader');
const stats = getMediaStats();

console.log(stats);
// {
//   photos: { count: 150, size: 45678900, sizeFormatted: '43.56 MB' },
//   videos: { count: 20, size: 123456789, sizeFormatted: '117.74 MB' },
//   total: { count: 170, size: 169135689, sizeFormatted: '161.30 MB' }
// }
```

## 🔒 Безопасность

### .gitignore
Медиафайлы **не коммитятся** в git:
```gitignore
public/media/photos/
public/media/videos/
```

Это защищает репозиторий от:
- Больших размеров
- Конфиденциальных изображений
- Конфликтов при слиянии

### Доступ к файлам
Файлы доступны через веб-сервер:
- `/media/photos/photo_1234567890_abc123.jpg`
- `/media/videos/video_1234567890_abc123.mp4`

Express автоматически обслуживает статические файлы из `public/`.

## 🧹 Очистка старых файлов

Для очистки старых медиафайлов создайте скрипт:

```javascript
const fs = require('fs');
const path = require('path');
const { PHOTOS_DIR, VIDEOS_DIR } = require('./utils/media-downloader');

// Удалить файлы старше 30 дней
const cleanOldMedia = (dir, days = 30) => {
    const now = Date.now();
    const maxAge = days * 24 * 60 * 60 * 1000;

    fs.readdirSync(dir).forEach(file => {
        const filepath = path.join(dir, file);
        const stats = fs.statSync(filepath);

        if (now - stats.mtimeMs > maxAge) {
            fs.unlinkSync(filepath);
            console.log(`Удален: ${file}`);
        }
    });
};

// Использование
cleanOldMedia(PHOTOS_DIR, 30);
cleanOldMedia(VIDEOS_DIR, 30);
```

## 📦 Резервное копирование

### Создание бэкапа
```bash
# Unix/Mac
tar -czf media-backup-$(date +%Y%m%d).tar.gz public/media/

# Windows
7z a media-backup-%date:~-4,4%%date:~-7,2%%date:~-10,2%.7z public/media/
```

### Восстановление
```bash
# Unix/Mac
tar -xzf media-backup-20250101.tar.gz

# Windows
7z x media-backup-20250101.7z
```

## 🚀 Оптимизация

### Сжатие изображений
Для автоматического сжатия можно использовать `sharp`:

```bash
npm install sharp
```

```javascript
const sharp = require('sharp');

async function compressImage(inputPath, outputPath) {
    await sharp(inputPath)
        .resize(1920, 1080, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 85 })
        .toFile(outputPath);
}
```

### CDN
Для продакшена рекомендуется:
- Cloudflare (бесплатный CDN)
- AWS S3 + CloudFront
- DigitalOcean Spaces

## 🐛 Решение проблем

### "Файл не найден" на сайте
1. Проверьте наличие файла: `ls public/media/photos/`
2. Убедитесь, что путь в БД правильный
3. Проверьте права доступа к файлу

### Медиафайлы не скачиваются
1. Проверьте подключение к интернету
2. Убедитесь, что Telegram API доступен
3. Проверьте логи на наличие ошибок

### Большой размер директории
1. Удалите старые файлы (см. раздел "Очистка")
2. Настройте автоматическую очистку
3. Используйте внешнее хранилище (S3, Spaces)

## 📝 Примеры использования

### Отображение изображения в EJS
```ejs
<% if (post.mediaType === 'photo' && post.mediaUrl) { %>
    <img src="<%= post.mediaUrl %>" alt="Post image" class="post-image">
<% } %>
```

### Отображение видео в EJS
```ejs
<% if (post.mediaType === 'video' && post.mediaUrl) { %>
    <video controls class="post-video">
        <source src="<%= post.mediaUrl %>" type="video/mp4">
        Ваш браузер не поддерживает видео.
    </video>
<% } %>
```

## 🔧 Конфигурация

### Изменение директорий
Отредактируйте `utils/media-downloader.js`:

```javascript
const MEDIA_DIR = path.join(__dirname, '..', 'public', 'uploads'); // Изменить
const PHOTOS_DIR = path.join(MEDIA_DIR, 'images'); // Изменить
const VIDEOS_DIR = path.join(MEDIA_DIR, 'clips'); // Изменить
```

### Ограничение размера
Добавьте проверку размера перед скачиванием:

```javascript
async function downloadMedia(fileUrl, mediaType, maxSizeMB = 50) {
    const response = await axios.head(fileUrl);
    const sizeMB = parseInt(response.headers['content-length']) / (1024 * 1024);

    if (sizeMB > maxSizeMB) {
        console.log(`Файл слишком большой: ${sizeMB.toFixed(2)} MB`);
        return null;
    }

    // Продолжить скачивание...
}
```

## 📚 API

См. документацию модуля [utils/media-downloader.js](utils/media-downloader.js):

- `initMediaDirectories()` - создание директорий
- `downloadPhoto(url, mimeType)` - скачивание фото
- `downloadVideo(url, mimeType)` - скачивание видео
- `downloadMedia(url, type, mimeType)` - универсальная функция
- `getMediaStats()` - получение статистики
