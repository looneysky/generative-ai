const express = require('express');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const axios = require('axios');
const { priceMonth, priceMonths, priceYear, channelTelegram, chatTelegram } = require('./configModule');
const { loadUsers, saveUsers } = require('./baseModule'); // Импортируйте функции загрузки и сохранения пользователей
const { createImage } = require('./createImage');
const bot = require('./botModule'); // Импортируйте ваш бот (например, Telegram bot)
const path = require('path');

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json()); // Use this to parse JSON

const secret = process.env.SECRET; // Секретное слово для хэша

// Вспомогательная функция для вычисления SHA-1 хэша
function calculateHash(params, secret) {
    const str = `${params.notification_type}&${params.operation_id}&${params.amount}&${params.currency}&${params.datetime}&${params.sender}&${params.codepro}&${secret}&${params.label}`;
    return crypto.createHash('sha1').update(str, 'utf8').digest('hex');
}

// Функция для проверки подписки пользователя
async function isUserSubscribed(userId, channelUsername) {
    try {
        const chatMember = await bot.getChatMember(channelUsername, userId);

        // Проверяем статус
        return chatMember.status === 'member' || chatMember.status === 'administrator';
    } catch (error) {
        console.error('Ошибка проверки подписки:', error);
        return false; // Возвращаем false в случае ошибки
    }
}

// API для проверки подписки
app.post('/api/check-subscription', async (req, res) => {
    const { userId, channelUsername } = req.body;

    if (!userId || !channelUsername) {
        return res.status(400).send('userId и channelUsername обязательны');
    }

    const subscribed = await isUserSubscribed(userId, channelUsername);
    res.json({ subscribed });
});

// Вебхук для приема уведомлений
app.post('/webhook', (req, res) => {
    const {
        notification_type,
        operation_id,
        amount,
        currency,
        datetime,
        sender,
        codepro,
        label, // label будет использоваться как userId
        sha1_hash,
        test_notification // флаг тестового уведомления
    } = req.body;

    console.log(req.body);

    // Проверяем тестовое уведомление
    if (test_notification === 'true') {
        console.log('Test notification received');
        return res.status(200).send('Test notification received');
    }

    // Проверяем наличие label
    if (!label) {
        return res.status(400).send('Label (userId) is missing');
    }

    // Проверяем хэш
    const calculatedHash = calculateHash(req.body, secret);
    if (calculatedHash !== sha1_hash) {
        return res.status(400).send('Invalid hash');
    }

    // Проверяем валюту (должна быть рубли - 643)
    if (currency !== '643') {
        return res.status(400).send('Invalid currency');
    }

    // Логика обновления пользователя в зависимости от суммы
    const userId = label; // Используем label как идентификатор пользователя

    const users = loadUsers();

    if (!users[userId]) {
        users[userId] = {
            attempts: 0,
            premium: {
                isPremium: false,
                expire: null
            },
            model: "Premium V1" // По умолчанию Free V1
        };
    }

    const now = new Date();
    let expireDate = new Date(now);

    // Если у пользователя уже есть активный премиум, продлеваем срок от текущей даты окончания
    if (users[userId].premium.isPremium && users[userId].premium.expire) {
        const currentExpireDate = new Date(users[userId].premium.expire);
        if (currentExpireDate > now) {
            expireDate = new Date(currentExpireDate); // Начинаем с текущей даты окончания
        }
    }

    // Увеличиваем срок действия премиума в зависимости от суммы
    if (amount === priceMonth) {
        expireDate.setMonth(expireDate.getMonth() + 1); // 1 месяц
    } else if (amount === priceMonths) {
        expireDate.setMonth(expireDate.getMonth() + 6); // 6 месяцев
    } else if (amount === priceYear) {
        expireDate.setFullYear(expireDate.getFullYear() + 1); // 1 год
    } else {
        return res.status(400).send('Invalid amount');
    }

    // Обновляем информацию о пользователе
    users[userId].premium.isPremium = true;
    users[userId].premium.expire = expireDate;

    // Передаем объект users в saveUsers
    saveUsers(users);

    // Форматируем дату в формате DD.MM.YY
    const formattedExpireDate = expireDate.toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit'
    });

    // Отправляем сообщение с форматированной датой
    bot.sendMessage(userId, `🎉 Ваш PREMIUM успешно активирован и действует до: ${formattedExpireDate}`);

    console.log(`User ${userId} has purchased premium. Expiration date: ${expireDate}`);

    // Возвращаем успешный ответ
    res.status(200).send('OK');
});

// Add this route in your Express server code
app.post('/api/generate-image', async (req, res) => {
    const { prompt } = req.body;

    if (!prompt) {
        return res.status(400).send('Prompt is required');
    }

    try {
        const userId = '101'; // Replace with the actual user ID, if necessary
        const imageUrl = await createImage(prompt, userId); // Call your existing createImage function

        res.status(200).json({ imageUrl });
    } catch (error) {
        console.error('Error generating image:', error);
        res.status(500).send('Error generating image');
    }
});


// API для получения списка пользователей
app.get('/api/getUsers', (req, res) => {
    try {
        const users = loadUsers(); // Загружаем пользователей
        res.status(200).json(users); // Возвращаем пользователей в формате JSON
    } catch (error) {
        console.error('Ошибка при получении пользователей:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, '/../public')));

// Маршрут для получения пользователей (по страницам)
app.get('/api/users', async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;  // Количество пользователей на страницу
    const startIndex = (page - 1) * limit;

    try {
        const response = await axios.get('http://test-project-generative-ai-v2.3gpeil.easypanel.host/api/getUsers');
        const users = response.data;

        // Получаем пользователей для текущей страницы
        const paginatedUsers = Object.entries(users).slice(startIndex, startIndex + limit).map(([userId, userData]) => ({
            userId,
            ...userData
        }));

        res.json(paginatedUsers);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).send('Error fetching users.');
    }
});

// Добавление нового маршрута для получения имени, фамилии и имени пользователя по ID
app.get('/api/user/name/:userId', async (req, res) => {
    const userId = req.params.userId;

    try {
        // Запрос к Telegram API для получения информации о пользователе
        const response = await axios.get(`https://api.telegram.org/bot7854713233:AAF9RQw1LFTOAC_Y5jfz4gax9AnwzSgT6ZE/getChat?chat_id=${userId}`);
        const userData = response.data.result;

        // Возвращаем имя, фамилию и имя пользователя
        res.json({
            firstName: userData.first_name || '',
            lastName: userData.last_name || '',
            username: userData.username || ''
        });
    } catch (error) {
        console.error('Error fetching user name:', error);
        res.status(500).send('Error fetching user name.');
    }
});

// Получение аватара пользователя через Telegram API
app.get('/api/user/avatar/:userId', async (req, res) => {
    const userId = req.params.userId;

    try {
        const avatarUrl = await getTelegramAvatar(userId);
        res.json({ avatarUrl });
    } catch (error) {
        console.error('Error fetching avatar:', error);
        res.status(500).send('Error fetching avatar.');
    }
});

// Функция для получения URL аватара через Telegram API
async function getTelegramAvatar(userId) {
    try {
        const response = await axios.get(`https://api.telegram.org/bot7854713233:AAF9RQw1LFTOAC_Y5jfz4gax9AnwzSgT6ZE/getUserProfilePhotos?user_id=${userId}`);
        const photos = response.data.result.photos;

        if (photos && photos.length > 0) {
            const photo = photos[0][0].file_id;
            const fileResponse = await axios.get(`https://api.telegram.org/bot7854713233:AAF9RQw1LFTOAC_Y5jfz4gax9AnwzSgT6ZE/getFile?file_id=${photo}`);
            const filePath = fileResponse.data.result.file_path;
            return `https://api.telegram.org/file/bot7854713233:AAF9RQw1LFTOAC_Y5jfz4gax9AnwzSgT6ZE/${filePath}`;
        }

        return null;
    } catch (error) {
        console.error('Error fetching avatar:', error);
        return null;
    }
}

// Маршрут для главной страницы (index.html)
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, '/../public', 'admin.html'));
});

// Define a route that serves the index.html file automatically
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '/../public', 'index.html'));
});

// Запускаем сервер
app.listen(3000, () => {
    console.log('Webhook server is running on port 3000');
});

// Экспортируем модуль, если необходимо
module.exports = app; // Или другие необходимые сущности
