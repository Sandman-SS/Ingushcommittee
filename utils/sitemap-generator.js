const fs = require('fs');
const path = require('path');

// Функция для генерации sitemap.xml
function generateSitemap(baseUrl = 'https://ingush-committee.org') {
    const urls = [
        { loc: '/', priority: '1.0', changefreq: 'weekly' },
        { loc: '/about', priority: '0.9', changefreq: 'monthly' },
        { loc: '/about/mission', priority: '0.8', changefreq: 'monthly' },
        { loc: '/about/history', priority: '0.8', changefreq: 'monthly' },
        { loc: '/about/goals', priority: '0.8', changefreq: 'monthly' },
        { loc: '/activities', priority: '0.9', changefreq: 'weekly' },
        { loc: '/activities/projects', priority: '0.8', changefreq: 'weekly' },
        { loc: '/activities/culture', priority: '0.8', changefreq: 'weekly' },
        { loc: '/activities/education', priority: '0.8', changefreq: 'weekly' },
        { loc: '/activities/rights', priority: '0.8', changefreq: 'weekly' },
        { loc: '/activities/international', priority: '0.8', changefreq: 'weekly' },
        { loc: '/map', priority: '0.7', changefreq: 'monthly' },
        { loc: '/contact', priority: '0.8', changefreq: 'monthly' }
    ];

    const today = new Date().toISOString().split('T')[0];

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    urls.forEach(url => {
        xml += '  <url>\n';
        xml += `    <loc>${baseUrl}${url.loc}</loc>\n`;
        xml += `    <lastmod>${today}</lastmod>\n`;
        xml += `    <changefreq>${url.changefreq}</changefreq>\n`;
        xml += `    <priority>${url.priority}</priority>\n`;
        xml += '  </url>\n';
    });

    xml += '</urlset>';

    return xml;
}

// Функция для сохранения sitemap в файл
function saveSitemap(publicPath) {
    const sitemap = generateSitemap();
    const sitemapPath = path.join(publicPath, 'sitemap.xml');
    
    fs.writeFileSync(sitemapPath, sitemap, 'utf8');
    console.log('✅ Sitemap.xml сгенерирован успешно');
    
    return sitemapPath;
}

module.exports = {
    generateSitemap,
    saveSitemap
};