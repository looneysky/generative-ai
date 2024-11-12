// config.js
require('dotenv').config();

// Получаем значения переменных окружения
const secret = process.env.SECRET;
const token = process.env.TOKEN;
const runwareApi = process.env.RUNWARE_API;
const runwareApi2 = process.env.RUNWARE_API2;
const priceMonth = process.env.PRICE_MONTH;
const priceMonths = process.env.PRICE_MONTHS;
const priceYear = process.env.PRICE_YEAR;
const channelTelegram = process.env.CHANNEL_USERNAME;
const chatTelegram = process.env.CHAT_LINK;
const apiUrl = process.env.API_URL;

// Экспортируем переменные
module.exports = {
    secret,
    token,
    runwareApi,
    runwareApi2,
    priceMonth,
    priceMonths,
    priceYear,
    channelTelegram,
    chatTelegram,
    apiUrl
};
