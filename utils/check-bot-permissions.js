const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();

async function checkBotPermissions() {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const channelId = process.env.TELEGRAM_CHANNEL_ID;

    if (!botToken || !channelId) {
        console.error('❌ Ошибка: TELEGRAM_BOT_TOKEN или TELEGRAM_CHANNEL_ID не установлены');
        process.exit(1);
    }

    console.log('🔍 Проверка настроек бота...\n');
    console.log(`📋 Channel ID: ${channelId}`);

    const bot = new TelegramBot(botToken, { polling: false });

    try {
        // Получаем информацию о боте
        const botInfo = await bot.getMe();
        console.log(`\n✅ Бот подключен: @${botInfo.username}`);
        console.log(`   Имя: ${botInfo.first_name}`);
        console.log(`   ID: ${botInfo.id}`);

        // Пытаемся получить информацию о канале
        try {
            const chat = await bot.getChat(channelId);
            console.log(`\n✅ Канал найден: ${chat.title || chat.username || channelId}`);
            console.log(`   Тип: ${chat.type}`);

            if (chat.description) {
                console.log(`   Описание: ${chat.description.substring(0, 100)}...`);
            }

            // Проверяем права бота
            try {
                const member = await bot.getChatMember(channelId, botInfo.id);
                console.log(`\n📊 Статус бота в канале: ${member.status}`);

                if (member.status === 'administrator') {
                    console.log('✅ Бот является администратором канала');

                    if (member.can_post_messages) {
                        console.log('✅ Может публиковать сообщения');
                    }
                    if (member.can_edit_messages) {
                        console.log('✅ Может редактировать сообщения');
                    }
                    if (member.can_delete_messages) {
                        console.log('✅ Может удалять сообщения');
                    }
                } else if (member.status === 'member') {
                    console.log('⚠️  Бот является обычным участником (не администратором)');
                    console.log('   Бот может получать новые сообщения, но не может читать историю');
                } else {
                    console.log(`⚠️  Статус бота: ${member.status}`);
                }
            } catch (memberError) {
                console.log('\n❌ Не удалось получить права бота:', memberError.message);
                console.log('   Возможно, бот не добавлен в канал как администратор');
            }

        } catch (chatError) {
            console.log('\n❌ Не удалось получить информацию о канале:', chatError.message);
            console.log('   Проверьте правильность TELEGRAM_CHANNEL_ID');
            console.log('   Убедитесь, что бот добавлен в канал');
        }

        console.log('\n📝 Рекомендации:');
        console.log('1. Добавьте бота в канал как администратора');
        console.log('2. Опубликуйте новый пост в канале для проверки');
        console.log('3. Убедитесь, что сервер запущен (npm start)');
        console.log('4. Новые посты будут автоматически сохраняться\n');

        console.log('ℹ️  Важно: Telegram Bot API не позволяет загружать историю канала.');
        console.log('   Боты получают только новые сообщения, опубликованные после запуска.\n');

    } catch (error) {
        console.error('\n❌ Ошибка:', error.message);
    } finally {
        await bot.close();
    }
}

checkBotPermissions();
