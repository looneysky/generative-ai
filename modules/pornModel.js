const axios = require('axios');

// Функция для генерации фото
async function generatePhoto(prompt) {
    try {
        // Шаг 1: Отправка POST запроса для генерации изображения
        const postData = {
            model_id: 24,
            width: 512,
            height: 768,
            prompt: prompt,
            request_data: {
                loras: [],
                resolution: "1",
                image_number: 1,
                negative_prompt: "(worst quality, low quality:1.4), (greyscale, monochrome:1.1), cropped, lowres , username, blurry, trademark, watermark, title, strabismus, clothing cutout, side slit,worst hand, (ugly face:1.2), extra leg, extra arm, bad foot, text, name, badhandv4, easynegative, EasyNegativeV2, negative_hand, ng_deepnegative_v1_75t",
                sampling: {
                    step: 25,
                    method: "DPM++ 2M Karras"
                },
                cfg: {
                    scale: 7,
                    seed: -1
                },
                high_priority: false,
                control_weight: 1
            },
            consume_points: 10,
            img_url: "",
            type: 1,
            divide_ratio: "",
            matrix_mode: "",
            gen_type: "text_to_image"
        };

        const response = await axios.post('https://api.live3d.io/api/v1/generation/generate', postData, {
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (response.data.code !== 200) {
            throw new Error(`Ошибка при генерации: ${response.data.message}`);
        }

        const aiArtId = response.data.data.id;

        console.log(`Идентификатор генерации: ${aiArtId}`);

        // Шаг 2: Проверка состояния генерации
        let attempts = 0;
        let imageUrl = null;

        while (attempts < 10 && !imageUrl) {
            attempts++;

            const checkResponse = await axios.get(`https://api.live3d.io/api/v1/generation/check_generate_state?ai_art_id=${aiArtId}`);

            if (checkResponse.data.code === 200) {
                const data = checkResponse.data.data;

                // Если изображение готово (статус = 1)
                if (data.status === 1 && data.url && data.url.length > 0) {
                    imageUrl = `https://animegenius.live3d.io/${data.url[0]}`;
                    console.log(`Сгенерированное изображение: ${imageUrl}`);
                    break;
                }
            }

            // Задержка между попытками
            if (!imageUrl) {
                console.log(`Попытка ${attempts}: Изображение еще не готово. Повторная попытка...`);
                await new Promise(resolve => setTimeout(resolve, 3000)); // Подождать 3 секунды
            }
        }

        if (!imageUrl) {
            throw new Error('Не удалось получить изображение за 10 попыток');
        }

        // Возвращаем ссылку на изображение
        return imageUrl;

    } catch (error) {
        console.error('Ошибка при генерации фото:', error.message);
        throw error;
    }
}

// Экспортируем функцию
module.exports = { generatePhoto };
