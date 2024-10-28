// imageGenerator.js
const axios = require('axios');

const generateImageV2 = async (prompt, negativePrompt) => {
    const url = 'https://pornworks.ai/api/v2/generate/text2image';

    const payload = {
        checkpoint: "nude_people",
        prompt: prompt,
        negativePrompt: negativePrompt,
        resources: [],
        samplerName: "DPM++ 2M Karras",
        ratio: "1x1",
        hr: false,
        sharpness: 5,
        cfgScale: 5,
        performance: "speed",
        denoisingStrength: 1,
        fast: false,
        inpaintMode: "controlnet"
    };

    try {
        // Make the POST request to generate the image
        const response = await axios.post(url, payload, {
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 Edg/130.0.0.0',
            }
        });

        const { id } = response.data; // Get the request ID for polling
        console.log('Image generation request sent, ID:', id);

        // Poll for the generation status
        const result = await pollForImage(id);
        return result; // Return the final result
    } catch (error) {
        console.error('Error generating image:', error.response ? error.response.data : error.message);
        throw error;
    }
};

const pollForImage = async (id) => {
    const url = `https://pornworks.ai/api/v2/generations/${id}/state`;

    while (true) {
        try {
            const response = await axios.get(url, {
                headers: {
                    'Accept': 'application/json, text/plain, */*',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 Edg/130.0.0.0',
                }
            });

            const { state, results } = response.data;

            if (state === 'done') {
                console.log('Image generation completed:', results);
                return results; // Return the results containing image URLs
            } else {
                console.log('Waiting for image generation to complete...');
                await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds before polling again
            }
        } catch (error) {
            console.error('Error polling for image:', error.response ? error.response.data : error.message);
            throw error;
        }
    }
};

// Export the generateImage function
export default generateImageV2;
