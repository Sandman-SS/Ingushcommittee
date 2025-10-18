const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');
const fs = require('fs');

// Создаем директорию для логов если её нет
const logDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
}

// Формат для логов
const logFormat = winston.format.combine(
    winston.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json(),
    winston.format.printf(({ timestamp, level, message, ...metadata }) => {
        let msg = `${timestamp} [${level.toUpperCase()}]: ${message}`;
        if (Object.keys(metadata).length > 0) {
            msg += ` ${JSON.stringify(metadata)}`;
        }
        return msg;
    })
);

// Настройка ротации файлов логов
const fileRotateTransport = new DailyRotateFile({
    filename: path.join(logDir, 'application-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxFiles: '14d',
    format: logFormat
});

// Отдельный файл для ошибок
const errorFileRotateTransport = new DailyRotateFile({
    filename: path.join(logDir, 'error-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxFiles: '30d',
    level: 'error',
    format: logFormat
});

// Создание логгера
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: logFormat,
    transports: [
        fileRotateTransport,
        errorFileRotateTransport
    ]
});

// В режиме разработки также выводим в консоль
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple(),
            winston.format.printf(({ timestamp, level, message, ...metadata }) => {
                let msg = `${timestamp} [${level}]: ${message}`;
                if (Object.keys(metadata).length > 0) {
                    msg += ` ${JSON.stringify(metadata)}`;
                }
                return msg;
            })
        )
    }));
}

// Функции-обертки для удобства использования
const log = {
    info: (message, meta = {}) => logger.info(message, meta),
    warn: (message, meta = {}) => logger.warn(message, meta),
    error: (message, meta = {}) => logger.error(message, meta),
    debug: (message, meta = {}) => logger.debug(message, meta),
    
    // Специальные функции для логирования определенных событий
    http: (req, statusCode, responseTime) => {
        logger.info('HTTP Request', {
            method: req.method,
            url: req.originalUrl,
            ip: req.ip || req.connection.remoteAddress,
            userAgent: req.get('user-agent'),
            statusCode,
            responseTime: `${responseTime}ms`
        });
    },
    
    telegramPost: (postId, hasMedia) => {
        logger.info('New Telegram post received', {
            postId,
            hasMedia,
            timestamp: new Date().toISOString()
        });
    },
    
    emailSent: (to, subject) => {
        logger.info('Email sent successfully', {
            to,
            subject,
            timestamp: new Date().toISOString()
        });
    },
    
    emailError: (error, to) => {
        logger.error('Email sending failed', {
            error: error.message,
            to,
            timestamp: new Date().toISOString()
        });
    },
    
    formSubmission: (formType, email) => {
        logger.info('Form submitted', {
            formType,
            email,
            timestamp: new Date().toISOString()
        });
    }
};

// Middleware для логирования HTTP запросов
const httpLogger = (req, res, next) => {
    const startTime = Date.now();
    
    // Логируем после завершения запроса
    res.on('finish', () => {
        const duration = Date.now() - startTime;
        log.http(req, res.statusCode, duration);
    });
    
    next();
};

module.exports = {
    logger,
    log,
    httpLogger
};