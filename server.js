const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fetch = require('node-fetch'); // লাইব্রেরি ছাড়া সরাসরি কলের জন্য
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.static('public'));
app.use(express.json());

const upload = multer({ storage: multer.memoryStorage() });
const PORT = process.env.PORT || 3000;

app.post('/analyze', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No image uploaded.' });

        const apiKey = process.env.GEMINI_API_KEY;
        // আমরা সরাসরি v1beta এন্ডপয়েন্টে রিকোয়েস্ট পাঠাচ্ছি
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

        const requestBody = {
            contents: [{
                parts: [
                    { text: "Analyze this trading chart. Predict the next 1m candle color (GREEN/RED) and give a brief reason." },
                    {
                        inline_data: {
                            mime_type: req.file.mimetype,
                            data: req.file.buffer.toString('base64')
                        }
                    }
                ]
            }]
        };

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });

        const data = await response.json();

        if (data.error) {
            throw new Error(data.error.message);
        }

        const prediction = data.candidates[0].content.parts[0].text;
        res.json({ result: prediction });

    } catch (error) {
        console.error("Detailed Error:", error.message);
        res.status(500).json({ error: "AI Error: " + error.message });
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
});