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
const { secret, token, runwareApi, runwareApi2 } = require('./modules/configModule');
const bot = require('./modules/botModule');
const { getTimeUntilReset } = require('./modules/timeModule');
const { containsForbiddenWords } = require('./modules/forbiddenWords');

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

async function createImage(prompt, userId) {
    const maxRetries = 3;
    let attempt = 0;

    const connectAndGenerateImage = () => {
        return new Promise((resolve, reject) => {
            console.log('Создаем WebSocket соединение...');
            const ws = new WebSocket('wss://ws-api.runware.ai/v1');
            const users = loadUsers();
            let token;
            let steps;
            let width;
            let height;
            let sampler;
            let lora;
            if (users[userId].model === 'Free V1') {
                token = runwareApi2;
                steps = 10;
                width = 1024;
                height = 1024;
            } else if (users[userId].model === 'Premium V1') {
                token = runwareApi;
                steps = 70;
                width = 832;
                height = 1216;
                sampler = 'DPM++ SDE' // Используем семплер DPM++ SDE
            } else {
                token = runwareApi;
                steps = 50;
                width = 1024;
                height = 1024;
                lora = [
                    {
                        model: 'urn:air:flux1:lora:civitai:721805@843538',
                    },
                    {
                        model: 'urn:air:flux1:lora:civitai:658411@736706'
                    }
                ]
            }

            console.log(token)

            ws.on('open', () => {
                console.log('WebSocket соединение открыто. Отправляем запрос на аутентификацию...');
                const authRequest = [{ taskType: 'authentication', apiKey: token }];
                ws.send(JSON.stringify(authRequest));
            });

            ws.on('message', (data) => {
                console.log(data)
                // Преобразуем Buffer в строку
                const text = data.toString();
                console.log(text)
                const response = JSON.parse(text);

                // Проверяем, если у пользователя уже выбрана модель
                const selectedModel = users[userId].model; // По умолчанию 'Free V1', если модель не выбрана
                console.log(models[selectedModel])
                console.log(steps)

                if (response.data && response.data[0]?.taskType === 'authentication') {
                    console.log('Аутентификация успешна. Отправляем запрос на генерацию изображения...');
                    const imageRequest = [{
                        positivePrompt: prompt, // Ваш хорошо сформулированный запрос
                        model: models[selectedModel], // Основная модель
                        steps: steps, // Увеличенное количество шагов для улучшения деталей
                        width: width, // Ширина изображения
                        height: height, // Высота изображения
                        numberResults: 1, // Количество изображений
                        outputType: ['URL'], // Формат вывода
                        taskType: 'imageInference', // Тип задачи
                        taskUUID: uuidv4(), // Уникальный идентификатор задачи
                        enableHighResFix: true, // Включаем фиксацию высокого разрешения (если нужно)
                        sampler: sampler !== null ? sampler : undefined, // Добавляем семплер, если он не равен null
                        lora: lora !== null ? lora : undefined // Добавляем lora, если он не равен null
                    }];
                    
                    console.log(imageRequest);                    

                    // Отправляем запрос                    
                    ws.send(JSON.stringify(imageRequest));

                } if (response.data && response.data[0]?.taskType === 'imageInference') {
                    console.log('Изображение успешно сгенерировано. Получаем URL...');
                    resolve(response.data[0].imageURL);
                    ws.close();
                } else {
                    console.log('Неожиданное сообщение от WebSocket:', response);
                }
            });



            ws.on('error', (err) => {
                console.error('Произошла ошибка WebSocket:', err);
                reject(err);
            });

            ws.on('close', (code, reason) => {
                console.log(`WebSocket соединение закрыто. Код: ${code}, Причина: ${reason}`);
            });
        });
    };

    while (attempt < maxRetries) {
        try {
            return await connectAndGenerateImage();
        } catch (error) {
            console.error(`Ошибка при попытке ${attempt + 1}:`, error.message);
            attempt += 1;

            if (attempt < maxRetries) {
                console.log(`Переотправка запроса... (${attempt}/${maxRetries})`);
            } else {
                throw new Error('Не удалось сгенерировать изображение после 3 попыток.');
            }
        }
    }
}

// Обработка команды /start
bot.onText(/\/start/, (msg) => {
    // Проверяем, что сообщение пришло из группы или супергруппы
    if (msg.chat.type == 'group' || msg.chat.type == 'supergroup') {
        return;
    } else {
        bot.sendMessage(msg.chat.id, '👋 Привет! Я бот для моментальной генерации картинок.\n\n🖼️ Отправь мне любой текст, и я сгенерирую изображение за считанные секунды!✨');
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
                model: "Premium V1" // По умолчанию Free V1
            };

            // Сохраняем обновленный список пользователей
            saveUsers(users);
            console.log('New user');
        }

        // Проверяем, если у пользователя уже выбрана модель
        const selectedModel = users[userId].model; // По умолчанию 'Free V1', если модель не выбрана

        let translatedText;
        await translatte(msg.text, { to: 'en' }).then(res => {
            translatedText = res.text;
            console.log('Переведено: ', translatedText);

        }).catch(err => {
            console.error(err);
        });

        if (selectedModel != 'Free V1') {
            if (users[userId].premium.isPremium === false) {
                // Проверяем количество попыток
                if (users[userId].attemps >= 5) {
                    bot.sendMessage(userId, 'Ваш лимит попыток исчерпан.\nПопробуйте снова через ' + getTimeUntilReset() + ' или обновите до премиум-версии для неограниченного доступа.', {
                        reply_markup: {
                            inline_keyboard: [
                                [
                                    { text: '🔄 Сменить модель', callback_data: 'change_model' },
                                    { text: '💳 Купить премиум', callback_data: 'buy_premium' }
                                ]
                            ]
                        }
                    });
                    return;
                } else {
                    if (containsForbiddenWords(translatedText) === true) {
                        bot.sendMessage(userId, '😵 Используя данную модель можно генерировать контент 18+ только по подписке.', {
                            reply_markup: {
                                inline_keyboard: [
                                    [
                                        { text: '🔄 Сменить модель', callback_data: 'change_model' },
                                        { text: '💳 Купить премиум', callback_data: 'buy_premium' }
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

        const channelUsername = "@photoai_channel"

        const subscribed = await isUserSubscribed(chatId, channelUsername);
        if (!subscribed) {
            await bot.sendMessage(chatId, `❌ Вы должны подписаться на наш канал ${channelUsername}, чтобы использовать этого бота.`);
            return;
        }

        // Уведомление о начале генерации
        const processingMsg = await bot.sendMessage(chatId, `🛠️ Начинаю генерацию по запросу:\n\n"${msg.text}"\n\nПожалуйста, подождите...`);

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
                caption: `🎉 Вот ваша генерация по запросу:\n\n"${msg.text}"\n\n💬 Наш чат: https://t.me/+-FXl0TbqBPZiN2Yy\n👉 Нажмите кнопку ниже, чтобы регенерировать изображение.`,
                reply_markup: {
                    inline_keyboard: [[
                        {
                            text: '🖌️ Регенерировать изображение',
                            callback_data: `regenerate:${promptIndex}`,
                        },
                        { text: '🔄 Сменить модель', callback_data: 'change_model' },
                    ],
                    [
                        {
                            text: '↙️ Скачать',
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
                    await bot.sendMessage(chatId, '⚠️ Превышен лимит запросов. Попробуйте снова.');
                }, retryAfter * 1000); // Ждем указанное время
            } else {
                console.error('Ошибка при генерации изображения:', error);
                await bot.sendMessage(chatId, '❌ Произошла ошибка при генерации изображения. Пожалуйста, попробуйте позже.');
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

    // Логика для смены модели
    if (query.data === 'change_model') {
        // Показать кнопки выбора модели
        await bot.sendMessage(userId, 'Выберите модель:', {
            reply_markup: {
                inline_keyboard: [
                    [{ text: 'Free V1', callback_data: 'set_free_v1' }],
                    [{ text: 'Premium V1', callback_data: 'set_premium_v1' }],
                    [{ text: 'Premium V2', callback_data: 'set_premium_v2' }]
                ]
            }
        });
    } else if (query.data === 'set_premium_v1') {
        if (!users[userId]) {
            // Initialize the user object if it doesn't exist
            users[userId] = {
                attempts: 0,
                premium: {
                    isPremium: false,
                    expire: null
                },
                model: "Free V1" // Default model
            };
        }
        users[userId].model = "Premium V1";
        saveUsers(users);
        await bot.sendMessage(userId, `✅ Модель изменена на "Premium V1"`);
    } else if (query.data === 'set_free_v1') {
        if (!users[userId]) {
            // Initialize the user object if it doesn't exist
            users[userId] = {
                attempts: 0,
                premium: {
                    isPremium: false,
                    expire: null
                },
                model: "Free V1" // Default model
            };
        }
        users[userId].model = "Free V1";
        saveUsers(users);
        await bot.sendMessage(userId, `✅ Модель изменена на "Free V1"`);
    } else if (query.data === 'set_premium_v2') {
        if (!users[userId]) {
            // Initialize the user object if it doesn't exist
            users[userId] = {
                attempts: 0,
                premium: {
                    isPremium: false,
                    expire: null
                },
                model: "Free V1" // Default model
            };
        }
        users[userId].model = "Premium V2";
        saveUsers(users);
        await bot.sendMessage(userId, `✅ Модель изменена на "Premium V2"`);
    } else if (query.data === 'buy_premium') {
        const options = {
            reply_markup: JSON.stringify({
                inline_keyboard: [
                    [{ text: '1 месяц - 199 рублей', callback_data: 'premium_1_month' }],
                    [{ text: '6 месяцев - 399 рублей', callback_data: 'premium_6_months' }],
                    [{ text: '1 год - 599 рублей', callback_data: 'premium_1_year' }]
                ]
            })
        };

        await bot.sendMessage(userId, 'Выберите период подписки:', options);
    }

    // Далее обработка выбора
    else if (query.data === 'premium_1_month') {
        await bot.sendMessage(userId, 'По вопросам оплаты: @webadmin11\n\nЧтобы купить премиум на 1 месяц, перейдите по следующей ссылке: https://pay.saleslift.store/?amount=199&userId=' + userId);
    } else if (query.data === 'premium_6_months') {
        await bot.sendMessage(userId, 'По вопросам оплаты: @webadmin11\n\nЧтобы купить премиум на 6 месяцев, перейдите по следующей ссылке: https://pay.saleslift.store/?amount=399&userId=' + userId);
    } else if (query.data === 'premium_1_year') {
        await bot.sendMessage(userId, 'По вопросам оплаты: @webadmin11\n\nЧтобы купить премиум на 1 год, перейдите по следующей ссылке: https://pay.saleslift.store/?amount=599&userId=' + userId);
    } else {
        // Другие callback-запросы, например регенерация изображений
        const promptIndex = query.data.split(':')[1];
        if (!prompts[promptIndex]) {
            await bot.sendMessage(chatId, '❌ Произошла ошибка: не удалось найти запрос. Пожалуйста, попробуйте заново.');
            return;
        }

        const prompt = prompts[promptIndex];
        console.log(`Получен запрос на регенерацию изображения по промту: ${prompt}`);

        // Уведомление о начале генерации
        const processingMsg = await bot.sendMessage(chatId, `🔄 Регенерирую изображение по запросу:\n\n"${prompt}"\n\nПожалуйста, подождите...`);

        try {
            // Проверяем, если у пользователя уже выбрана модель
            const selectedModel = users[userId].model; // По умолчанию 'Free V1', если модель не выбрана

            if (selectedModel != 'Free V1') {
                if (users[userId].premium.isPremium === false) {
                    // Проверяем количество попыток
                    if (users[userId].attemps >= 3) {
                        bot.sendMessage(userId, 'Ваш лимит попыток исчерпан. Попробуйте снова через час или обновите до премиум-версии для неограниченного доступа.', {
                            reply_markup: {
                                inline_keyboard: [
                                    [
                                        { text: '🔄 Сменить модель', callback_data: 'change_model' },
                                        { text: '💳 Купить премиум', callback_data: 'buy_premium' }
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
                caption: `🎉 Вот ваша генерация по запросу:\n\n"${prompt}"\n\n💬 Наш чат: https://t.me/+-FXl0TbqBPZiN2Yy\n👉 Нажмите кнопку ниже, чтобы регенерировать изображение.`,
                reply_markup: {
                    inline_keyboard: [[
                        {
                            text: '🖌️ Регенерировать изображение',
                            callback_data: `regenerate:${promptIndex}`,
                        },
                        { text: '🔄 Сменить модель', callback_data: 'change_model' },
                    ],
                    [
                        {
                            text: '↙️ Скачать',
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
            await bot.sendMessage(chatId, '❌ Произошла ошибка при регенерации изображения. Пожалуйста, попробуйте позже.');
        }

        // Удаление сообщения о процессе
        console.log('Удаляем сообщения...');
        bot.deleteMessage(chatId, processingMsg.message_id);
    }
});