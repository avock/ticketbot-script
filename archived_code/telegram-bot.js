const TelegramBot = require('node-telegram-bot-api');

// Replace 'YOUR_TELEGRAM_BOT_TOKEN' with your actual bot token
const bot = new TelegramBot('6128760880:AAGgpqk7-CQ1m4EOwZXbkGHb4R_EGrfmS1k', { polling: true });

bot.sendMessage(-948762337, 'Hello, you WILL get taytay tickets!');
