const { v4: uuidv4 } = require('uuid');
const { runwareApi, runwareApi2 } = require('./configModule');
const { loadUsers, models } = require('./baseModule');
const axios = require('axios');
const WebSocket = require('ws');

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

async function verifyUser() {
    const verifyUrl = `https://image-generation.perchance.org/api/verifyUser?thread=2&__cacheBust=${Math.random()}`;
    
    try {
        const response = await axios.get(verifyUrl);
        console.log('Ответ от API верификации:', response.data);

        if (response.data.status === 'success' && response.data.userKey) {
            return response.data.userKey;
        } else if (response.data.status === 'already_verified') {
            return response.data.userKey;
        } else {
            throw new Error('Не удалось получить userKey из ответа');
        }
    } catch (error) {
        console.error('Ошибка при запросе верификации пользователя:', error.message);
        throw error; // Пробрасываем ошибку для обработки в createImage
    }
}

async function createImageV2(prompt, userId) {
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
            if (users[userId].model === 'Free V1') {
                token = runwareApi2;
                steps = 10;
                width = 1024;
                height = 1024;
            } else if (users[userId].model === 'Premium V1') {
                token = runwareApi;
                steps = 50;
                width = 832;
                height = 1216;
                sampler = 'DPM++ SDE' // Используем семплер DPM++ SDE
            } else {
                token = runwareApi;
                steps = 50;
                width = 1024;
                height = 1024;
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
                        enableHighResFix: true // Включаем фиксацию высокого разрешения (если нужно)
                    }];
                    
                    // Добавляем семплер только если он не равен null
                    if (sampler !== null) {
                        imageRequest.sampler = sampler;
                    }
                    
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

// Экспортируем функцию
module.exports = {
    createImageV2
};