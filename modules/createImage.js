const { v4: uuidv4 } = require('uuid'); // Убедитесь, что uuid установлен и импортирован
const { runwareApi, runwareApi2 } = require('./configModule'); // Импортируйте функцию загрузки пользователей
const { loadUsers, models } = require('./baseModule');
const axios = require('axios');

async function createImage(prompt, userId) {
    const maxRetries = 3;
    let attempt = 0;

    const connectAndGenerateImage = async () => {
        console.log('Отправляем запрос на генерацию изображения...');
        
        const requestUrl = `https://image-generation.perchance.org/api/generate?prompt=${encodeURIComponent(prompt)}&seed=-1&resolution=1024x1024&guidanceScale=7&negativePrompt=${encodeURIComponent("low quality, deformed, blurry, bad art, drawing, painting, horrible resolutions, low DPI, low PPI, blurry, glitch, error")}&channel=image-generator-professional&subChannel=public&userKey=21c0410d6c167b688d7058b2a2d4bdd67d99a3121da47ceb0be4af8c547d59dc&requestId=0.3375448669220542&__cacheBust=${Math.random()}`;
        
        try {
            const response = await axios.get(requestUrl);
            console.log('Ответ от API:', response.data);

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
