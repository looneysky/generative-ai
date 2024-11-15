const axios = require('axios');
const { apiUrl } = require('./configModule');  // Импортируем apiUrl из configModule

// Функция для отправки запроса и получения ссылки на изображение
async function generateImage(prompt) {
    // Используем уже импортированный apiUrl
    const url = `${apiUrl}/generate`;

    // Данные для запроса
    const data = {
        model: "model1",        // Имя модели (должно соответствовать модели в Flask)
        prompt: prompt,
        size: "2_2"             // Размер изображения (например, "1_1", "2_2")
    };

    try {
        // Отправка POST-запроса на Flask API
        const response = await axios.post(url, data);

        // Проверка успешности запроса
        if (response.status === 200) {
            // Извлечение URL изображения из ответа
            const imageUrl = response.data.image_url;
            console.log(`Image generated successfully! You can view it at: ${imageUrl}`);
            return imageUrl;  // Возвращаем ссылку на изображение
        } else {
            console.error(`Failed to generate image. Status code: ${response.status}`);
            console.error(`Error: ${response.data}`);
            return null;
        }
    } catch (error) {
        console.error("Error occurred during the request:", error.message);
        return null;
    }
}

// Экспортируем функцию
module.exports = { generateImage };
