const { Runware } = require('@runware/sdk-js');
const { runwareApi } = require('./configModule');

const client = new Runware({ apiKey: runwareApi });

async function createImageV2(prompt) {
    try {
        const images = await client.requestImages({
            positivePrompt: prompt,
            width: 832,
            height: 1216,
            model: "civitai:133005@782002",
            steps: 30,
            numberResults: 1,
            outputType: "URL",
            outputFormat: "WEBP"
        });

        // Получаем URL сгенерированного изображения
        const generatedImageUrl = images[0].imageURL; // Assuming the first result is the image URL

        return generatedImageUrl;
    } catch (error) {
        console.error('Ошибка при верификации пользователя или генерации изображения:', error.message);
        // Пытаемся использовать резервный метод сразу, если возникла ошибка
        return null;
    }
}


// Экспортируем функцию
module.exports = {
    createImageV2
};