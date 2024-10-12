const TelegramBot = require('node-telegram-bot-api');
const { token } = require('./configModule');

const bot = new TelegramBot(token, { polling: true });

// Экспортируем экземпляр бота
module.exports = bot;