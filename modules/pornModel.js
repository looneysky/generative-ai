const WebSocket = require('ws');

// Функция для генерации случайного session_hash
function generateRandomSessionHash() {
    const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
    let hash = "";
    for (let i = 0; i < 16; i++) {
        hash += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return hash;
}

// Функция для генерации фото через WebSocket
function generatePhoto(prompt) {
    return new Promise((resolve, reject) => {
        const ws = new WebSocket('wss://app.yimeta.ai/nsfw-ai-art-generator/queue/join');

        let waitingForHashResponse = false;
        let sessionHash = generateRandomSessionHash();

        ws.on('open', () => {
            console.log('WebSocket соединение установлено.');
        });

        ws.on('message', (message) => {
            const data = JSON.parse(message);
            console.log('Получено сообщение:', data);

            // Если процесс завершен, ищем данные в поле "data"
            if (data.msg === 'process_completed') {
                if (data.output && data.output.data && data.output.data.length > 0) {
                    const imageUrl = data.output.data[0][0].name;  // Проверка первого элемента в data
                    if (imageUrl) {
                        console.log(`Ссылка из поля "name": ${imageUrl}`);
                        resolve(imageUrl); // Возвращаем ссылку на фото
                    } else {
                        reject('Нет ссылки в данных');
                    }
                } else {
                    reject('Нет данных в поле "data" или оно пустое');
                }
            }

            // Ожидаем получение "send_hash"
            if (data.msg === 'send_hash' && !waitingForHashResponse) {
                console.log('Получен send_hash от сервера.');

                console.log('Сгенерирован session_hash:', sessionHash);

                // Отправляем сгенерированный session_hash
                ws.send(JSON.stringify({
                    fn_index: 20,
                    session_hash: sessionHash,
                }));
                console.log('Отправлен send_hash:', { fn_index: 20, session_hash: sessionHash });

                waitingForHashResponse = true;
            }

            // Когда сервер готов принять данные, отправляем запрос
            if (data.msg === 'send_data' && waitingForHashResponse) {
                console.log('Сервер готов принять данные.');

                const requestData = {
                    fn_index: 20,
                    session_hash: sessionHash, // Генерация нового session_hash для запроса
                    data: [
                        'Realistic',
                        prompt,
                        '(worst quality, low quality:1.4), (greyscale, monochrome:1.1), cropped, lowres , username, blurry, trademark, watermark, title, multiple view, Reference sheet, curvy, plump, fat, strabismus, clothing cutout, side slit,worst hand, (ugly face:1.2), extra leg, extra arm, bad foot, text, name',
                        7,
                        ''
                    ]
                };

                ws.send(JSON.stringify(requestData));
                console.log('Отправлен запрос на генерацию:', requestData);
            }
        });

        ws.on('close', (code, reason) => {
            console.error(`WebSocket соединение закрыто. Код: ${code}, Причина: ${reason || 'не указана'}`);
        });

        ws.on('error', (error) => {
            console.error('WebSocket ошибка:', error.message);
            reject(error.message); // Отправляем ошибку в случае проблемы
        });
    });
}

// Экспортируем функцию
module.exports = {
    generatePhoto
};
