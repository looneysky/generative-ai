const WebSocket = require('ws'); // Не забудьте импортировать WebSocket, если еще не импортирован
const { v4: uuidv4 } = require('uuid'); // Убедитесь, что uuid установлен и импортирован
const { runwareApi, runwareApi2 } = require('./configModule'); // Импортируйте функцию загрузки пользователей
const { loadUsers, models } = require('./baseModule');

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

            // Определяем параметры в зависимости от модели пользователя
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
                sampler = 'DPM++ SDE'; // Используем семплер DPM++ SDE
            } else {
                token = runwareApi;
                steps = 50;
                width = 1024;
                height = 1024;
            }

            console.log(token);

            ws.on('open', () => {
                console.log('WebSocket соединение открыто. Отправляем запрос на аутентификацию...');
                const authRequest = [{ taskType: 'authentication', apiKey: token }];
                ws.send(JSON.stringify(authRequest));
            });

            ws.on('message', (data) => {
                console.log(data);
                const text = data.toString();
                console.log(text);
                const response = JSON.parse(text);

                const selectedModel = users[userId].model; // По умолчанию 'Free V1'
                console.log(models[selectedModel]);
                console.log(steps);

                if (response.data && response.data[0]?.taskType === 'authentication') {
                    console.log('Аутентификация успешна. Отправляем запрос на генерацию изображения...');
                    const imageRequest = [{
                        positivePrompt: prompt,
                        model: models[selectedModel],
                        steps: steps,
                        width: width,
                        height: height,
                        numberResults: 1,
                        outputType: ['URL'],
                        taskType: 'imageInference',
                        taskUUID: uuidv4(),
                        enableHighResFix: true // Включаем фиксацию высокого разрешения (если нужно)
                    }];

                    // Добавляем семплер только если он не равен null
                    if (sampler) {
                        imageRequest.sampler = sampler;
                    }

                    ws.send(JSON.stringify(imageRequest));

                } else if (response.data && response.data[0]?.taskType === 'imageInference') {
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
    createImage
};