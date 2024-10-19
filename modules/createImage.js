const { v4: uuidv4 } = require('uuid');
const { runwareApi, runwareApi2 } = require('./configModule');
const { loadUsers, models } = require('./baseModule');
const axios = require('axios');

// Функция для выполнения POST-запроса
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
        // Выполнение POST-запроса
        const response = await axios.post(url, data, { headers });
        
        // Проверка успешного выполнения запроса
        if (response.status === 200 && response.data.code === 0) {
            const imageUrl = response.data.data.url; // Получаем URL изображения
            console.log('Изображение успешно сгенерировано:', imageUrl);
            return imageUrl;
        } else {
            throw new Error('Не удалось сгенерировать изображение: ' + response.data.message);
        }
    } catch (error) {
        console.error('Ошибка при выполнении запроса:', error.message);
    }
}

// Функция для проверки пользователя и получения userKey
async function verifyUser() {
    const verifyUrl = `https://image-generation.perchance.org/api/verifyUser?thread=2&__cacheBust=${Math.random()}`;
    
    try {
        const response = await axios.get(verifyUrl);
        console.log('Ответ от API верификации:', response.data);

        // Проверка на успешный статус и наличие userKey
        if (response.data.status === 'success' && response.data.userKey) {
            return response.data.userKey; // Вернем userKey
        } else if (response.data.status === 'already_verified') {
            // Если пользователь уже верифицирован, возвращаем userKey из ответа
            return response.data.userKey; // userKey тоже будет в ответе
        } else {
            throw new Error('Не удалось получить userKey из ответа');
        }
    } catch (error) {
        console.error('Ошибка при запросе верификации пользователя:', error.message);
        throw error;
    }
}

async function createImage(prompt, userId) {
    const maxRetries = 3;
    let attempt = 0;

    // Получаем userKey
    const userKey = await verifyUser();

    const connectAndGenerateImage = async () => {
        console.log('Отправляем запрос на генерацию изображения...');

        const requestUrl = `https://image-generation.perchance.org/api/generate?prompt=${encodeURIComponent(prompt)}&seed=-1&resolution=1024x1024&guidanceScale=7&negativePrompt=${encodeURIComponent("low quality, deformed, blurry, bad art, drawing, painting, horrible resolutions, low DPI, low PPI, blurry, glitch, error")}&channel=image-generator-professional&subChannel=public&userKey=${userKey}&requestId=0.3375448669220542&__cacheBust=${Math.random()}`;
        
        try {
            const response = await axios.get(requestUrl);
            console.log('Ответ от API:', response.data);

            // Проверка на успешный статус и наличие imageId
            if (response.data.status === 'success' && response.data.imageId) {
                const imageUrl = `https://image-generation.perchance.org/api/downloadTemporaryImage?imageId=${response.data.imageId}`;
                console.log('Изображение успешно сгенерировано. URL:', imageUrl);
                return imageUrl; // Вернем URL изображения
            } else {
                throw new Error('Не удалось получить imageId из ответа');
            }
        } catch (error) {
            console.error('Ошибка при запросе к API:', error.message);
            throw error; // Пробрасываем ошибку для повторной попытки
        }
    };

    while (attempt < maxRetries) {
        try {
            return await connectAndGenerateImage();
        } catch (error) {
            console.error(`Ошибка при попытке ${attempt + 1}:`, error.message);
            generateImageWithBackup(prompt)
        }
    }
}

// Экспортируем функцию
module.exports = {
    createImage
};
