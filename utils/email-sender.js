const nodemailer = require('nodemailer');

// Создание транспортера для отправки email
function createTransporter() {
    // Проверяем наличие необходимых переменных окружения
    if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.warn('⚠️  Email конфигурация не полная. Проверьте EMAIL_HOST, EMAIL_USER и EMAIL_PASS в файле .env');
        return null;
    }

    const transporter = nodemailer.createTransporter({
        host: process.env.EMAIL_HOST,
        port: parseInt(process.env.EMAIL_PORT) || 587,
        secure: process.env.EMAIL_SECURE === 'true', // true для порта 465, false для других портов
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    return transporter;
}

// Функция для отправки email
async function sendContactEmail(formData) {
    const transporter = createTransporter();
    
    if (!transporter) {
        throw new Error('Email сервис не настроен. Проверьте конфигурацию.');
    }

    const { name, email, phone, subject, message } = formData;
    
    // Получатель email из переменных окружения или дефолтный
    const toEmail = process.env.EMAIL_TO || 'contact@ingush-committee.org';

    // HTML шаблон письма
    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background-color: #006400; color: white; padding: 20px; text-align: center; }
                .content { background-color: #f4f4f4; padding: 20px; margin-top: 20px; }
                .field { margin-bottom: 15px; }
                .label { font-weight: bold; color: #006400; }
                .message { background-color: white; padding: 15px; border-left: 4px solid #006400; margin-top: 20px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h2>Новое сообщение с сайта</h2>
                </div>
                <div class="content">
                    <div class="field">
                        <span class="label">Имя:</span> ${name}
                    </div>
                    <div class="field">
                        <span class="label">Email:</span> <a href="mailto:${email}">${email}</a>
                    </div>
                    ${phone ? `<div class="field"><span class="label">Телефон:</span> ${phone}</div>` : ''}
                    <div class="field">
                        <span class="label">Тема:</span> ${subject}
                    </div>
                    <div class="message">
                        <span class="label">Сообщение:</span><br>
                        ${message.replace(/\n/g, '<br>')}
                    </div>
                </div>
            </div>
        </body>
        </html>
    `;

    // Текстовая версия письма
    const textContent = `
Новое сообщение с сайта Комитета Ингушской Независимости

Имя: ${name}
Email: ${email}
${phone ? `Телефон: ${phone}` : ''}
Тема: ${subject}

Сообщение:
${message}
    `;

    const mailOptions = {
        from: `"${name}" <${process.env.EMAIL_USER}>`,
        replyTo: email,
        to: toEmail,
        subject: `Сайт КИН: ${subject}`,
        text: textContent,
        html: htmlContent
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('✅ Email отправлен:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('❌ Ошибка отправки email:', error.message);
        throw error;
    }
}

// Функция для отправки автоответа отправителю
async function sendAutoReply(email, name) {
    const transporter = createTransporter();
    
    if (!transporter) {
        return; // Не критично, если автоответ не отправится
    }

    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background-color: #006400; color: white; padding: 20px; text-align: center; }
                .content { padding: 20px; }
                .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h2>Спасибо за ваше сообщение!</h2>
                </div>
                <div class="content">
                    <p>Уважаемый(ая) ${name},</p>
                    <p>Мы получили ваше сообщение и свяжемся с вами в ближайшее время.</p>
                    <p>Если ваш вопрос требует срочного решения, вы можете связаться с нами через наши социальные сети:</p>
                    <ul>
                        <li>Telegram: <a href="https://t.me/ingcommitte">@ingcommitte</a></li>
                        <li>YouTube: <a href="https://www.youtube.com/@ingcommittee">@ingcommittee</a></li>
                    </ul>
                    <p>С уважением,<br>Комитет Ингушской Независимости</p>
                </div>
                <div class="footer">
                    <p>Это автоматическое сообщение. Пожалуйста, не отвечайте на него.</p>
                </div>
            </div>
        </body>
        </html>
    `;

    const mailOptions = {
        from: `"Комитет Ингушской Независимости" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Мы получили ваше сообщение',
        html: htmlContent
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('✅ Автоответ отправлен');
    } catch (error) {
        console.error('⚠️  Ошибка отправки автоответа:', error.message);
        // Не прерываем основной процесс
    }
}

module.exports = {
    sendContactEmail,
    sendAutoReply
};