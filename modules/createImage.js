const { v4: uuidv4 } = require('uuid');
const { runwareApi, runwareApi2 } = require('./configModule');
const { loadUsers, models } = require('./baseModule');
const axios = require('axios');

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

    try {
        const userKey = await verifyUser();

        const connectAndGenerateImage = async () => {
            console.log('Отправляем запрос на генерацию изображения...');
            const requestUrl = `https://image-generation.perchance.org/api/generate?prompt=${encodeURIComponent(prompt)}&seed=-1&resolution=1024x1024&guidanceScale=7&negativePrompt=${encodeURIComponent("low quality, deformed, blurry, bad art, drawing, painting, horrible resolutions, low DPI, low PPI, blurry, glitch, error")}&channel=image-generator-professional&subChannel=public&userKey=${userKey}&requestId=0.3375448669220542&__cacheBust=${Math.random()}`;
            
            const response = await axios.get(requestUrl);
            console.log('Ответ от API:', response.data);

            if (response.data.status === 'success' && response.data.imageId) {
                const imageUrl = `https://image-generation.perchance.org/api/downloadTemporaryImage?imageId=${response.data.imageId}`;
                console.log('Изображение успешно сгенерировано. URL:', imageUrl);
                return imageUrl;
            } else {
                throw new Error('Не удалось получить imageId из ответа');
            }
        };

        while (attempt < maxRetries) {
            try {
                return await connectAndGenerateImage();
            } catch (error) {
                console.error(`Ошибка при попытке ${attempt + 1}:`, error.message);
                attempt++;
                if (attempt >= maxRetries) {
                    console.error('Применяем резервный метод генерации изображения...');
                    return await generateImageWithBackup(prompt); // Используем резервный метод
                }
            }
        }
    } catch (error) {
        console.error('Ошибка при верификации пользователя или генерации изображения:', error.message);
        // Пытаемся использовать резервный метод сразу, если возникла ошибка
        return await generateImageWithBackup(prompt);
    }
}


// Экспортируем функцию
module.exports = {
    createImageV2
};