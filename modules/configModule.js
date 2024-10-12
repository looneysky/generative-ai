// config.js
require('dotenv').config();

// Получаем значения переменных окружения
const secret = process.env.SECRET;
const token = process.env.TOKEN;
const runwareApi = process.env.RUNWARE_API;
const runwareApi2 = process.env.RUNWARE_API2;

// Экспортируем переменные
module.exports = {
    secret,
    token,
    runwareApi,
    runwareApi2
};
