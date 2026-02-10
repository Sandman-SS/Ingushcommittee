const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const IMG_DIR = path.join(__dirname, '..', 'public', 'img');
const MAX_SIZE_KB = 300;
const BACKGROUND_QUALITY = 60; // mountains.jpg is blurred, lower quality is fine

async function compressImage(filePath, maxKB, quality) {
    const stats = fs.statSync(filePath);
    const sizeKB = stats.size / 1024;

    if (sizeKB <= maxKB) {
        return { file: filePath, skipped: true, sizeKB: Math.round(sizeKB) };
    }

    const ext = path.extname(filePath).toLowerCase();
    if (!['.jpg', '.jpeg', '.png'].includes(ext)) {
        return { file: filePath, skipped: true, reason: 'unsupported format' };
    }

    const tempPath = filePath + '.tmp';

    try {
        const metadata = await sharp(filePath).metadata();
        let maxWidth = 1920;

        // For background image, we can be more aggressive
        if (path.basename(filePath) === 'mountains.jpg') {
            maxWidth = 1600;
        }

        let pipeline = sharp(filePath);

        if (metadata.width > maxWidth) {
            pipeline = pipeline.resize(maxWidth, null, { withoutEnlargement: true });
        }

        if (ext === '.png') {
            pipeline = pipeline.png({ quality: quality || 80, compressionLevel: 9 });
        } else {
            pipeline = pipeline.jpeg({ quality: quality || 75, mozjpeg: true });
        }

        await pipeline.toFile(tempPath);

        const newStats = fs.statSync(tempPath);
        const newSizeKB = newStats.size / 1024;

        // Replace original
        fs.unlinkSync(filePath);
        fs.renameSync(tempPath, filePath);

        return {
            file: path.relative(IMG_DIR, filePath),
            oldSizeKB: Math.round(sizeKB),
            newSizeKB: Math.round(newSizeKB),
            saved: `${Math.round((1 - newSizeKB / sizeKB) * 100)}%`
        };
    } catch (err) {
        if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
        return { file: filePath, error: err.message };
    }
}

async function walkDir(dir) {
    const files = [];
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            files.push(...await walkDir(fullPath));
        } else if (/\.(jpg|jpeg|png)$/i.test(entry.name)) {
            files.push(fullPath);
        }
    }
    return files;
}

async function main() {
    console.log('Scanning images...');
    const files = await walkDir(IMG_DIR);
    console.log(`Found ${files.length} images\n`);

    let totalOld = 0, totalNew = 0, compressed = 0;

    for (const file of files) {
        const isBackground = path.basename(file) === 'mountains.jpg';
        const quality = isBackground ? BACKGROUND_QUALITY : 75;

        const result = await compressImage(file, MAX_SIZE_KB, quality);

        if (result.skipped) {
            // Skip logging for small files
        } else if (result.error) {
            console.log(`ERROR: ${result.file} - ${result.error}`);
        } else {
            console.log(`${result.file}: ${result.oldSizeKB}KB -> ${result.newSizeKB}KB (${result.saved})`);
            totalOld += result.oldSizeKB;
            totalNew += result.newSizeKB;
            compressed++;
        }
    }

    console.log(`\n=== DONE ===`);
    console.log(`Compressed: ${compressed} files`);
    console.log(`Total saved: ${Math.round(totalOld - totalNew)}KB (${totalOld > 0 ? Math.round((1 - totalNew / totalOld) * 100) : 0}%)`);
}

main().catch(console.error);
