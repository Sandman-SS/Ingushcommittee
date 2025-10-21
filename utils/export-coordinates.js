#!/usr/bin/env node

/**
 * Скрипт для экспорта координат карты в различных форматах
 * Используется для передачи данных ИИ агенту при рефакторинге
 */

const fs = require('fs');
const path = require('path');

// Импорт данных карты
const mapData = require('../public/js/mapData.js');
const interactiveMapPath = path.join(__dirname, '../public/js/interactive-map.js');

// Чтение файла interactive-map.js и извлечение данных
function extractMapDataFromFile() {
    const content = fs.readFileSync(interactiveMapPath, 'utf8');
    
    // Извлекаем массивы данных с помощью регулярных выражений
    const citiesMatch = content.match(/const cities = \[([\s\S]*?)\];/);
    const villagesMatch = content.match(/const villages = \[([\s\S]*?)\];/);
    const culturalMatch = content.match(/const culturalSites = \[([\s\S]*?)\];/);
    const religiousMatch = content.match(/const religiousSites = \[([\s\S]*?)\];/);
    
    // Парсим данные (упрощенный подход)
    const cities = citiesMatch ? eval(`[${citiesMatch[1]}]`) : [];
    const villages = villagesMatch ? eval(`[${villagesMatch[1]}]`) : [];
    const culturalSites = culturalMatch ? eval(`[${culturalMatch[1]}]`) : [];
    const religiousSites = religiousMatch ? eval(`[${religiousMatch[1]}]`) : [];
    
    return { cities, villages, culturalSites, religiousSites };
}

// Экспорт в JSON формат
function exportToJSON() {
    const interactiveData = extractMapDataFromFile();
    
    const exportData = {
        metadata: {
            exportDate: new Date().toISOString(),
            version: "1.0",
            description: "Данные карты Ингушетии для рефакторинга"
        },
        borders: {
            modernBorders: mapData.modernBorders,
            historicalTerritories: mapData.historicalTerritories
        },
        objects: {
            cities: interactiveData.cities,
            villages: interactiveData.villages,
            culturalSites: interactiveData.culturalSites,
            religiousSites: interactiveData.religiousSites
        },
        statistics: {
            totalCities: interactiveData.cities.length,
            totalVillages: interactiveData.villages.length,
            totalCulturalSites: interactiveData.culturalSites.length,
            totalReligiousSites: interactiveData.religiousSites.length,
            totalObjects: interactiveData.cities.length + 
                         interactiveData.villages.length + 
                         interactiveData.culturalSites.length + 
                         interactiveData.religiousSites.length
        }
    };
    
    return JSON.stringify(exportData, null, 2);
}

// Экспорт в CSV формат
function exportToCSV() {
    const interactiveData = extractMapDataFromFile();
    const allObjects = [
        ...interactiveData.cities.map(obj => ({ ...obj, type: 'city' })),
        ...interactiveData.villages.map(obj => ({ ...obj, type: 'village' })),
        ...interactiveData.culturalSites.map(obj => ({ ...obj, type: 'cultural' })),
        ...interactiveData.religiousSites.map(obj => ({ ...obj, type: 'religious' }))
    ];
    
    const headers = ['name', 'type', 'latitude', 'longitude', 'description', 'history', 'image', 'population'];
    const rows = allObjects.map(obj => [
        `"${obj.name || ''}"`,
        obj.type,
        obj.coords ? obj.coords[0] : '',
        obj.coords ? obj.coords[1] : '',
        `"${(obj.description || '').replace(/"/g, '""')}"`,
        `"${(obj.history || '').replace(/"/g, '""')}"`,
        obj.image || '',
        obj.population || ''
    ]);
    
    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
}

// Экспорт в GeoJSON формат
function exportToGeoJSON() {
    const interactiveData = extractMapDataFromFile();
    const allObjects = [
        ...interactiveData.cities.map(obj => ({ ...obj, type: 'city' })),
        ...interactiveData.villages.map(obj => ({ ...obj, type: 'village' })),
        ...interactiveData.culturalSites.map(obj => ({ ...obj, type: 'cultural' })),
        ...interactiveData.religiousSites.map(obj => ({ ...obj, type: 'religious' }))
    ];
    
    const features = allObjects.map(obj => ({
        type: "Feature",
        properties: {
            name: obj.name,
            type: obj.type,
            description: obj.description,
            history: obj.history,
            image: obj.image,
            population: obj.population
        },
        geometry: {
            type: "Point",
            coordinates: obj.coords ? [obj.coords[1], obj.coords[0]] : [0, 0] // GeoJSON использует [lng, lat]
        }
    }));
    
    const geoJSON = {
        type: "FeatureCollection",
        features: features
    };
    
    return JSON.stringify(geoJSON, null, 2);
}

// Основная функция
function main() {
    const format = process.argv[2] || 'json';
    const outputFile = process.argv[3] || `map-data-export.${format}`;
    
    let data;
    let mimeType;
    
    switch (format.toLowerCase()) {
        case 'json':
            data = exportToJSON();
            mimeType = 'application/json';
            break;
        case 'csv':
            data = exportToCSV();
            mimeType = 'text/csv';
            break;
        case 'geojson':
            data = exportToGeoJSON();
            mimeType = 'application/geo+json';
            break;
        default:
            console.error('Поддерживаемые форматы: json, csv, geojson');
            process.exit(1);
    }
    
    // Создаем папку exports если её нет
    const exportsDir = path.join(__dirname, '../exports');
    if (!fs.existsSync(exportsDir)) {
        fs.mkdirSync(exportsDir, { recursive: true });
    }
    
    const outputPath = path.join(exportsDir, outputFile);
    fs.writeFileSync(outputPath, data, 'utf8');
    
    console.log(`✅ Данные экспортированы в формате ${format.toUpperCase()}`);
    console.log(`📁 Файл: ${outputPath}`);
    console.log(`📊 Размер: ${(data.length / 1024).toFixed(2)} KB`);
    console.log(`🔗 MIME тип: ${mimeType}`);
    
    // Выводим статистику
    const interactiveData = extractMapDataFromFile();
    console.log('\n📈 Статистика:');
    console.log(`   Города: ${interactiveData.cities.length}`);
    console.log(`   Села: ${interactiveData.villages.length}`);
    console.log(`   Культурные объекты: ${interactiveData.culturalSites.length}`);
    console.log(`   Религиозные объекты: ${interactiveData.religiousSites.length}`);
    console.log(`   Всего объектов: ${interactiveData.cities.length + interactiveData.villages.length + interactiveData.culturalSites.length + interactiveData.religiousSites.length}`);
}

// Запуск скрипта
if (require.main === module) {
    main();
}

module.exports = {
    exportToJSON,
    exportToCSV,
    exportToGeoJSON,
    extractMapDataFromFile
};
