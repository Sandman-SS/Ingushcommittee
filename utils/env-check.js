const fs = require('fs');
const path = require('path');

// Функция для проверки наличия и валидности переменных окружения
function checkEnvironmentVariables() {
    // Telegram-переменные больше не обязательны
    const requiredVars = [];

    const warnings = [];
    const errors = [];

    // Проверяем наличие .env файла
    const envPath = path.join(__dirname, '..', '.env');
    if (!fs.existsSync(envPath)) {
        console.error('\n⚠️  ВНИМАНИЕ: Файл .env не найден!');
        console.log('📝 Создайте файл .env на основе .env.example:');
        console.log('   cp .env.example .env');
        console.log('   Затем заполните необходимые значения.\n');
        warnings.push('.env файл не найден');
    }

    // Нет обязательных переменных на данный момент

    // Проверяем опциональные переменные для полной функциональности
    const optionalVars = {
        'EMAIL_HOST': 'для отправки email через контактную форму',
        'EMAIL_USER': 'для отправки email через контактную форму',
        'EMAIL_PASS': 'для отправки email через контактную форму',
        'EMAIL_TO': 'для получения сообщений с контактной формы'
    };

    Object.entries(optionalVars).forEach(([varName, purpose]) => {
        if (!process.env[varName]) {
            warnings.push(`${varName} не установлена (${purpose})`);
            console.warn(`ℹ️  Информация: ${varName} не установлена - ${purpose}`);
        }
    });

    // Проверяем NODE_ENV
    if (!process.env.NODE_ENV) {
        process.env.NODE_ENV = 'development';
        console.log('ℹ️  NODE_ENV установлен в "development" по умолчанию');
    }

    return { errors, warnings };
}

// Функция для создания .env файла из .env.example если его нет
function createEnvFileIfNotExists() {
    const envPath = path.join(__dirname, '..', '.env');
    const envExamplePath = path.join(__dirname, '..', '.env.example');

    if (!fs.existsSync(envPath) && fs.existsSync(envExamplePath)) {
        console.log('\n📝 Создаем .env файл из .env.example...');
        try {
            fs.copyFileSync(envExamplePath, envPath);
            console.log('✅ .env файл создан! Пожалуйста, заполните его своими значениями.\n');
            return true;
        } catch (error) {
            console.error('❌ Ошибка при создании .env файла:', error.message);
            return false;
        }
    }
    return false;
}

module.exports = {
    checkEnvironmentVariables,
    createEnvFileIfNotExists
};