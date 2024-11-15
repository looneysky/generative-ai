const { nowpayments_api, webhook_url } = require('./configModule');
const fs = require('fs');
const os = require('os');
const path = require('path');
const axios = require('axios');
const crypto = require('crypto');
const QRCode = require('qrcode');

const NOWPAYMENTS_API_KEY = nowpayments_api;

async function createPayment(amount, userid) {
    try {
        const randomId = crypto.randomBytes(16).toString('hex');

        const paymentData = {
            price_amount: amount,
            price_currency: "usdttrc20",
            pay_currency: "usdttrc20",
            ipn_callback_url: webhook_url, // Set your actual callback URL
            order_id: randomId,
            order_description: `${userid}`
        };

        const response = await axios.post('https://api.nowpayments.io/v1/payment', paymentData, {
            headers: {
                'x-api-key': NOWPAYMENTS_API_KEY,
                'Content-Type': 'application/json'
            }
        });

        const { pay_amount, pay_address } = response.data;

        return {
            amountToPay: pay_amount,
            usdtAddress: pay_address
        };

    } catch (error) {
        console.error('Error creating payment:', error.response ? error.response.data : error.message);
        throw error;
    }
}

async function generateQr(address, amount = null) {
    try {
        // Prepare the data string with TRON protocol
        let data = `TRON:${address}`;
        
        if (amount) {
            data += `?amount=${amount}`;  // Add the amount if provided
        }

        const tempDir = os.tmpdir(); // System's temporary directory
        const filePath = path.join(tempDir, `qr_${Date.now()}.png`);

        // Generate and save QR code as a 400x400 image file
        await QRCode.toFile(filePath, data, {
            width: 400 // Set width to 400 pixels
        });

        return filePath; // Return the path to the temporary QR code file
    } catch (error) {
        console.error('Error generating QR code:', error.message);
        throw error;
    }
}

// Export the functions
module.exports = {
    createPayment,
    generateQr
};