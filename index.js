const fetch = require('node-fetch');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto'); // Для генерации случайного имени файла
const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');
const translatte = require('translatte');
const sharp = require('sharp');
const webhook = require('./modules/webhookModule'); // Импортируем ваш модуль
const { saveUsers, loadUsers, models } = require('./modules/baseModule');
const { secret, token, runwareApi, runwareApi2, priceMonth, priceMonths, priceYear, channelTelegram, chatTelegram } = require('./modules/configModule');
const { generateImageV2 } = require('./modules/newModelV2');
const { generatePhoto } = require('./modules/pornModel');
const { generateImage } = require('./modules/newModel');
const { createImageV2 } = require('./modules/createImage');
const bot = require('./modules/botModule');
const { getTimeUntilReset } = require('./modules/timeModule');
const { containsForbiddenWords } = require('./modules/forbiddenWords');
const translations = require('./modules/languagesPack');

// Функция для получения сообщения на нужном языке
function getTranslation(user, key, params = {}) {
    let language;
    if (user != null) {
        language = user.language || 'en';
    }
    language = 'en';
    let message = translations[language][key] || translations['en'][key];

    // Замена параметров, таких как {text}, {time}, {channel} и т.д.
    Object.keys(params).forEach(param => {
        message = message.replace(`{${param}}`, params[param]);
    });

    return message;
}

let prompts = {}; // Объект для хранения запросов по индексам

async function addBlurAndPremiumText(imageUrl) {
    try {
        // Генерация случайного имени файла
        const randomFileName = `${uuidv4()}.jpg`;
        const outputPath = path.join(__dirname, 'uploads', randomFileName);

        // Загрузка изображения с URL
        const response = await fetch(imageUrl);
        const buffer = await response.buffer();

        // Создание изображения с текстом "PREMIUM"
        const textImageBuffer = await sharp({
            create: {
                width: 700, // Увеличиваем ширину для более крупного текста
                height: 150, // Увеличиваем высоту для соответствия увеличенному тексту
                channels: 4,
                background: { r: 0, g: 0, b: 0, alpha: 0 }
            }
        })
            .png()
            .composite([{
                input: Buffer.from(`
                    <svg width="700" height="150">
                        <text x="50%" y="50%" font-size="100" fill="#FFD700" text-anchor="middle" alignment-baseline="middle" font-family="Arial" font-weight="bold">PREMIUM</text>
                    </svg>
                `),
                gravity: 'center'
            }])
            .toBuffer();

        // Добавление размытия к исходному изображению и наложение текста
        await sharp(buffer)
            .blur(20) // Применение размытия
            .composite([{
                input: textImageBuffer,
                gravity: 'center' // Размещение текста по центру
            }])
            .toFile(outputPath); // Сохранение результата в файл

        console.log('Изображение успешно сохранено с блюром и текстом PREMIUM:', outputPath);
        return outputPath; // Возвращаем путь к файлу
    } catch (error) {
        console.error('Ошибка при обработке изображения:', error);
    }
}

async function isUserSubscribed(chatId, channelUsername) {
    try {
        const member = await bot.getChatMember(channelUsername, chatId);
        return member.status === 'member' || member.status === 'administrator';
    } catch (error) {
        console.error('Ошибка при проверке подписки:', error);
        return false;
    }
}

async function generateImageWithBackup(prompt) {
    const url = 'https://aiimagegenerator.io/api/model/predict-peach';

    const data = {
        prompt: prompt,
        negativePrompt: "",
        key: "Cinematic",
        width: 1024,
        height: 1024,
        quantity: 1,
        size: "1024x1024"
    };

    const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/plain, */*',
        'Origin': 'https://aiimagegenerator.io',
        'Referer': 'https://aiimagegenerator.io/',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36 Edg/129.0.0.0'
    };

    try {
        const response = await axios.post(url, data, { headers });

        if (response.status === 200 && response.data.code === 0) {
            const imageUrl = response.data.data.url;
            console.log('Изображение успешно сгенерировано:', imageUrl);
            return imageUrl;
        } else {
            throw new Error('Не удалось сгенерировать изображение: ' + response.data.message);
        }
    } catch (error) {
        console.error('Ошибка при выполнении запроса:', error.message);
        throw error; // Пробрасываем ошибку для обработки в createImage
    }
}

// Main function to create an image based on user model
async function createImage(prompt, userId) {
    try {
        const users = await loadUsers();
        const user = users[userId];

        // Check if the user exists
        if (!user) {
            throw new Error('User not found');
        }

        // Choose the image generation method based on the user's model
        switch (user.model) {
            case "Free V1":
                return await createImageV2(prompt);

            case "Premium V1":
                /*return await generateImage(prompt);*/
                return await generateImage(prompt);

            // Assuming this is part of your createImage function
            case "Premium V2":
                return await generateImageV2(prompt);

            case "Turbo18Plus":
                return await generatePhoto(prompt);

            default:
                throw new Error('Unsupported model');
        }
    } catch (error) {
        console.error('Error during image generation:', error.message);
        // You can handle the error further as needed
        throw error; // Rethrow the error for upstream handling if necessary
    }
}

// Обработка команды /start
bot.onText(/\/start/, (msg) => {
    const userId = msg.from.id;
    const users = loadUsers();

    if (!users[userId]) {
        // Если не существует, создаем нового пользователя
        users[userId] = {
            attemps: 0,
            premium: {
                isPremium: false,
                expire: null
            },
            model: "Premium V1", // По умолчанию Free V1
            language: "en"
        };

        // Сохраняем обновленный список пользователей
        saveUsers(users);
        console.log('New user');
    }

    // Предполагается, что язык пользователя загружается из объекта `users`
    const user = users[userId] || { language: 'en' };

    // Проверяем, что сообщение пришло из группы или супергруппы
    if (msg.chat.type == 'group' || msg.chat.type == 'supergroup') {
        return;
    } else {
        bot.sendMessage(msg.chat.id, getTranslation(user, 'startMessage'), {
            reply_markup: {
                inline_keyboard: [
                    [{ text: getTranslation(user, 'changeLanguageButton'), callback_data: 'change_language' }]
                ]
            }
        });
    }
});


// Обработка всех остальных сообщений для генерации изображения
bot.on('message', async (msg) => {
    if (msg.text && !msg.text.startsWith('/')) {
        const chatId = msg.chat.id;
        const userId = msg.from.id;
        const users = loadUsers();

        // Проверяем, что сообщение пришло из группы или супергруппы
        if (msg.chat.type == 'group' || msg.chat.type == 'supergroup') {
            return;
        }

        if (!users[userId]) {
            // Если не существует, создаем нового пользователя
            users[userId] = {
                attemps: 0,
                premium: {
                    isPremium: false,
                    expire: null
                },
                model: "Premium V1", // По умолчанию Free V1
                language: "en"
            };

            // Сохраняем обновленный список пользователей
            saveUsers(users);
            console.log('New user');
        }

        let translatedText;
        await translatte(msg.text, { to: 'en' }).then(res => {
            translatedText = res.text;
            console.log('Переведено: ', translatedText);

        }).catch(err => {
            console.error(err);
        });

        const user = users[userId] || { language: 'en' };

        if (users[userId].premium.isPremium === false) {
            // Проверяем количество попыток
            if (users[userId].attemps >= 3) {
                const message = getTranslation(users[userId], 'attemptLimitMessage', { time: getTimeUntilReset() });
                bot.sendMessage(userId, message, {
                    reply_markup: {
                        inline_keyboard: [
                            [
                                { text: getTranslation(users[userId], 'changeModelButton'), callback_data: 'change_model' },
                                { text: getTranslation(users[userId], 'buyPremium'), callback_data: 'buy_premium' }
                            ]
                        ]
                    }
                });
                return;
            } else {
                if (containsForbiddenWords(translatedText) === true) {
                    const message = getTranslation(users[userId], 'adultContentMessage');
                    bot.sendMessage(userId, message, {
                        reply_markup: {
                            inline_keyboard: [
                                [
                                    { text: getTranslation(users[userId], 'changeModelButton'), callback_data: 'change_model' },
                                    { text: getTranslation(users[userId], 'buyPremium'), callback_data: 'buy_premium' }
                                ]
                            ]
                        }
                    })
                    return;
                }
                // Увеличиваем количество попыток
                users[userId].attemps += 1;
                saveUsers(users);
            }
        }

        /*const groupId = '-1002200640088'; // ID группы, которую нужно проверить

        try {
            const chatMember = await bot.getChatMember(groupId, userId)

            // Если пользователь не состоит в группе
            if (chatMember.status === 'left' || chatMember.status === 'kicked' || chatMember.status === 'restricted') {
                bot.sendMessage(chatId, 'Пожалуйста, вступите в группу, чтобы продолжить: https://t.me/+-FXl0TbqBPZiN2Yy');
            }
        } catch (error) {
            console.error('Ошибка при проверке участника группы:', error);
            bot.sendMessage(chatId, 'Похоже, вы еще не являетесь участником группы. Пожалуйста, вступите: https://t.me/+-FXl0TbqBPZiN2Yy');
        }*/

        console.log(`Получен запрос на генерацию изображения: ${msg.text}`);

        if (channelTelegram != null) {
            const subscribed = await isUserSubscribed(chatId, channelTelegram);
            if (!subscribed) {
                await bot.sendMessage(chatId, `❌ Вы должны подписаться на наш канал ${channelTelegram}, чтобы использовать этого бота.`);
                return;
            }
        }

        // Уведомление о начале генерации
        const processingMsg = await bot.sendMessage(chatId, getTranslation(user, 'generatingMessage', { text: msg.text }));

        try {
            console.log('Запускаем функцию createImage...');

            const promptIndex = uuidv4(); // Генерируем уникальный идентификатор для запроса
            prompts[promptIndex] = translatedText; // Сохраняем запрос в объект prompts

            const imageUrl = await createImage(translatedText, userId);
            console.log('Изображение успешно получено:', imageUrl);

            // Генерация уникального имени файла
            // Генерация случайного имени файла
            const randomFileName = crypto.randomBytes(16).toString('hex') + '.jpg';
            const filePath = path.join(__dirname, randomFileName);

            // Скачиваем изображение
            const response = await axios({
                url: imageUrl,
                responseType: 'stream', // Записываем файл как поток
            });

            // Записываем изображение на диск
            const writer = fs.createWriteStream(filePath);
            response.data.pipe(writer);

            // Ждем завершения записи файла
            await new Promise((resolve, reject) => {
                writer.on('finish', resolve);
                writer.on('error', reject);
            });

            // Отправляем локальный файл в чат
            await bot.sendPhoto(chatId, filePath, {
                caption: getTranslation(user, 'regenerateMessage', { text: msg.text, chat: chatTelegram }),
                reply_markup: {
                    inline_keyboard: [[
                        {
                            text: getTranslation(users[userId], 'regenerateButton'),
                            callback_data: `regenerate:${promptIndex}`,
                        },
                        { text: getTranslation(users[userId], 'changeModelButton'), callback_data: 'change_model' },
                    ],
                    [
                        {
                            text: getTranslation(users[userId], 'downloadButton'),
                            url: imageUrl,
                        }
                    ]],
                },
            });

            // Удаляем файл после отправки
            fs.unlinkSync(filePath);
            console.log(`Файл ${randomFileName} успешно удален после отправки`);
        } catch (error) {
            if (error.response && error.response.body && error.response.body.error_code === 429) {
                // Получаем значение retry-after
                const retryAfter = error.response.body.parameters.retry_after;
                console.error(`Превышен лимит запросов. Повторите попытку через ${retryAfter} секунд.`);
                setTimeout(async () => {
                    await bot.sendMessage(chatId, getTranslation(user, 'errorMessage'));
                }, retryAfter * 1000); // Ждем указанное время
            } else {
                console.error('Ошибка при генерации изображения:', error);
                await bot.sendMessage(chatId, getTranslation(user, 'errorMessage'), {
                    reply_markup: {
                        inline_keyboard: [[
                            { text: getTranslation(users[userId], 'changeModelButton'), callback_data: 'change_model' },
                        ]]
                    }
                });
            }
        }

        // Удаление сообщения о процессе
        console.log('Удаляем сообщения...');
        bot.deleteMessage(chatId, processingMsg.message_id);
        bot.deleteMessage(chatId, msg.message_id);
    }
});

// Обработчик смены модели и других запросов
bot.on('callback_query', async (query) => {
    const chatId = query.message.chat.id;
    const userId = query.from.id;
    const users = loadUsers();
    const user = users[userId];


    // Логика для смены модели
    if (query.data === 'change_model') {
        // Показать кнопки выбора модели
        await bot.sendMessage(userId, getTranslation(user, 'changeModelMessage'), {
            reply_markup: {
                inline_keyboard: [
                    [{ text: 'FastFlux V1', callback_data: 'set_free_v1' }],
                    [{ text: 'Premium V1', callback_data: 'set_premium_v1' }],
                    [{ text: 'Premium V2', callback_data: 'set_premium_v2' }]
                    [{ text: 'Turbo18Plus', callback_data: 'set_turbo_18' }]
                ]
            }
        });
    } else if (query.data === 'change_language') {
        // Отправляем сообщение с выбором языка
        bot.sendMessage(query.message.chat.id, getTranslation(user, 'chooseLanguage'), {
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: '🇺🇸 English', callback_data: 'language_en' },
                        { text: '🇷🇺 Русский', callback_data: 'language_ru' }
                    ]
                ]
            }
        });
    } else if (query.data === 'language_en' || query.data === 'language_ru') {
        if (!users[userId]) {
            // Initialize the user object if it doesn't exist
            users[userId] = {
                attempts: 0,
                premium: {
                    isPremium: false,
                    expire: null
                },
                model: "Free V1", // Default model
                language: "en"
            };
        }
        // Установка нового языка
        user.language = query.data === 'language_en' ? 'en' : 'ru';
        users[userId] = user;
        saveUsers(users);

        bot.sendMessage(query.message.chat.id, getTranslation(user, 'languageChanged'));
    } else if (query.data === 'set_premium_v1') {
        if (!users[userId]) {
            // Initialize the user object if it doesn't exist
            users[userId] = {
                attempts: 0,
                premium: {
                    isPremium: false,
                    expire: null
                },
                model: "Free V1", // Default model
                language: "en"
            };
        }
        users[userId].model = "Premium V1";
        saveUsers(users);
        await bot.sendMessage(userId, getTranslation(user, 'modelChangedMessage', { model: "Premium V1" }));
    } else if (query.data === 'set_free_v1') {
        if (!users[userId]) {
            // Initialize the user object if it doesn't exist
            users[userId] = {
                attempts: 0,
                premium: {
                    isPremium: false,
                    expire: null
                },
                model: "Free V1", // Default model
                language: "en"
            };
        }
        users[userId].model = "Free V1";
        saveUsers(users);
        await bot.sendMessage(userId, getTranslation(user, 'modelChangedMessage', { model: "FastFlux V1" }));
    } else if (query.data === 'set_premium_v2') {
        if (!users[userId]) {
            // Initialize the user object if it doesn't exist
            users[userId] = {
                attempts: 0,
                premium: {
                    isPremium: false,
                    expire: null
                },
                model: "Free V1", // Default model
                language: "en"
            };
        }
        users[userId].model = "Premium V2";
        saveUsers(users);
        await bot.sendMessage(userId, getTranslation(user, 'modelChangedMessage', { model: "Premium V2" }));
    } else if (query.data === 'set_turbo_18') {
        if (!users[userId]) {
            // Initialize the user object if it doesn't exist
            users[userId] = {
                attempts: 0,
                premium: {
                    isPremium: false,
                    expire: null
                },
                model: "Turbo18Plus", // Default model
                language: "en"
            };
        }
        users[userId].model = "Turbo18Plus";
        saveUsers(users);
        await bot.sendMessage(userId, getTranslation(user, 'modelChangedMessage', { model: "Premium V2" }));
    } else if (query.data === 'buy_premium') {
        const options = {
            reply_markup: JSON.stringify({
                inline_keyboard: [
                    [{ text: getTranslation(user, 'onemonthSubs', { price: priceMonth }), callback_data: 'premium_1_month' }],
                    [{ text: getTranslation(user, 'monthsSubs', { price: priceMonths }), callback_data: 'premium_6_months' }],
                    [{ text: getTranslation(user, 'yearSubs', { price: priceYear }), callback_data: 'premium_1_year' }]
                ]
            })
        };

        await bot.sendMessage(userId, getTranslation(user, 'selectSubscriptionPeriodMessage'), options);
    }

    // Далее обработка выбора
    else if (query.data === 'premium_1_month') {
        await bot.sendMessage(userId, getTranslation(user, 'paymentInfo', { price: priceMonth }));
    } else if (query.data === 'premium_6_months') {
        await bot.sendMessage(userId, getTranslation(user, 'paymentInfo', { price: priceMonths }));
    } else if (query.data === 'premium_1_year') {
        await bot.sendMessage(userId, getTranslation(user, 'paymentInfo', { price: priceYear }));
    } else {
        // Другие callback-запросы, например регенерация изображений
        const promptIndex = query.data.split(':')[1];
        if (!prompts[promptIndex]) {
            await bot.sendMessage(chatId, getTranslation(user, 'errorMessage'));
            return;
        }

        const prompt = prompts[promptIndex];
        console.log(`Получен запрос на регенерацию изображения по промту: ${prompt}`);

        // Уведомление о начале генерации
        const processingMsg = await bot.sendMessage(chatId, getTranslation(user, 'regenerateSession', { prompt: prompt }));

        try {
            // Проверяем, если у пользователя уже выбрана модель
            const selectedModel = users[userId].model; // По умолчанию 'Free V1', если модель не выбрана

            if (selectedModel != 'Free V1') {
                if (users[userId].premium.isPremium === false) {
                    // Проверяем количество попыток
                    if (users[userId].attemps >= 3) {
                        const message = getTranslation(users[userId], 'attemptLimitMessage', { time: getTimeUntilReset() });
                        bot.sendMessage(userId, message, {
                            reply_markup: {
                                inline_keyboard: [
                                    [
                                        { text: getTranslation(users[userId], 'changeModelButton'), callback_data: 'change_model' },
                                        { text: getTranslation(users[userId], 'buyPremium'), callback_data: 'buy_premium' }
                                    ]
                                ]
                            }
                        });
                        return;
                    } else {
                        // Увеличиваем количество попыток
                        users[userId].attemps += 1;
                        saveUsers(users);
                    }
                }
            }
            const imageUrl = await createImage(prompt, userId);
            console.log('Изображение успешно получено:', imageUrl);

            // Генерация случайного имени файла
            const randomFileName = crypto.randomBytes(16).toString('hex') + '.jpg';
            const filePath = path.join(__dirname, randomFileName);

            // Скачиваем изображение
            const response = await axios({
                url: imageUrl,
                responseType: 'stream', // Записываем файл как поток
            });

            // Записываем изображение на диск
            const writer = fs.createWriteStream(filePath);
            response.data.pipe(writer);

            // Ждем завершения записи файла
            await new Promise((resolve, reject) => {
                writer.on('finish', resolve);
                writer.on('error', reject);
            });

            // Отправляем локальный файл в чат
            await bot.sendPhoto(chatId, filePath, {
                caption: getTranslation(user, 'regenerateMessage', { text: prompt, chat: chatTelegram }),
                reply_markup: {
                    inline_keyboard: [[
                        {
                            text: getTranslation(users[userId], 'regenerateButton'),
                            callback_data: `regenerate:${promptIndex}`,
                        },
                        { text: getTranslation(users[userId], 'changeModelButton'), callback_data: 'change_model' },
                    ],
                    [
                        {
                            text: getTranslation(users[userId], 'downloadButton'),
                            url: imageUrl,
                        }
                    ]],
                },
            });

            // Удаляем файл после отправки
            fs.unlinkSync(filePath);
            console.log(`Файл ${randomFileName} успешно удален после отправки`);

        } catch (error) {
            console.error('Ошибка при регенерации изображения:', error);
            await bot.sendMessage(chatId, getTranslation(user, 'errorMessage'));
        }

        // Удаление сообщения о процессе
        console.log('Удаляем сообщения...');
        bot.deleteMessage(chatId, processingMsg.message_id);
    }
});