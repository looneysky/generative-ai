const axios = require('axios');
const FormData = require('form-data');

// Generate a unique API key
const generateApiKey = () => {
    let userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 Edg/130.0.0.0';
    var myrandomstr = Math.round((Math.random() * 100000000000)) + "";
    var myhashfunction = function () {
        for (var a = [], b = 0; 64 > b;) {
            a[b] = 0 | 4294967296 * Math.sin(++b % Math.PI);
        }
        return function (c) {
            var d, e, f, g = [d = 1732584193, e = 4023233417, ~d, ~e], h = [], l = unescape(encodeURI(c)) + "\u0080", k = l.length;
            c = --k / 4 + 2 | 15;
            for (h[--c] = 8 * k; ~k;) {
                h[k >> 2] |= l.charCodeAt(k) << 8 * k--;
            }
            for (b = l = 0; b < c; b += 16) {
                for (k = g; 64 > l; k = [f = k[3], d + ((f = k[0] + [d & e | ~d & f, f & d | ~f & e, d ^ e ^ f, e ^ (d | ~f)][k = l >> 4] + a[l] + ~~h[b | [l, 5 * l + 1, 3 * l + 5, 7 * l][k] & 15]) << (k = [7, 12, 17, 22, 5, 9, 14, 20, 4, 11, 16, 23, 6, 10, 15, 21][4 * k + l++ % 4]) | f >>> -k), d, e]) {
                    d = k[1] | 0;
                    e = k[2];
                }
                for (l = 4; l;) {
                    g[--l] += k[l];
                }
            }
            for (c = ""; 32 > l;) {
                c += (g[l >> 3] >> 4 * (1 ^ l++) & 15).toString(16);
            }
            return c.split("").reverse().join("");
        }
    }();
    return 'tryit-' + myrandomstr + '-' + myhashfunction(userAgent + myhashfunction(userAgent + myhashfunction(userAgent + myrandomstr + 'i_am_a_smelly_hacker_yes_i_am'))); 
};

// Function to generate image
const generateImage = async (text, negativePrompt = '') => {
    let userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 Edg/130.0.0.0';
    const apiKey = generateApiKey();
    const url = 'https://api.deepai.org/api/text2img';

    // Create a FormData instance
    const form = new FormData();
    form.append('text', text);
    if (negativePrompt) form.append('negative_prompt', negativePrompt);
    form.append('image_generator_version', 'hd');
    form.append('use_old_model', 'false');  // Ensure it's a string
    form.append('quality', 'true');          // Ensure it's a string

    try {
        const response = await axios.post(url, form, {
            headers: {
                ...form.getHeaders(), // Important: include the form headers
                'api-key': apiKey,
                'Accept': '*/*',
                'Accept-Encoding': 'gzip, deflate, br, zstd',
                'Accept-Language': 'ru,en;q=0.9,en-GB;q=0.8,en-US;q=0.7',
                'User-Agent': userAgent,
            }
        });

        console.log('Response data:', response.data);
        // Return only the share_url
        return response.data.share_url; 
    } catch (error) {
        console.error('Error:', error.response ? error.response.data : error.message);
        throw error; // Rethrow the error for further handling
    }
};

// Export the module
module.exports = { generateImage };
