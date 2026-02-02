const express = require('express');
const cors = require('cors');
const multer = require('multer');
const axios = require('axios'); // লাইব্রেরির বদলে এক্সিওস ব্যবহার করবো
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
        // সরাসরি REST API URL (এটি কখনো ভুল হয় না)
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

        const payload = {
            contents: [{
                parts: [
                    { text: "You are a professional trader. Analyze this chart. Predict next candle: UP or DOWN? Give logic in 2 lines." },
                    {
                        inline_data: {
                            mime_type: req.file.mimetype,
                            data: req.file.buffer.toString('base64')
                        }
                    }
                ]
            }]
        };

        const response = await axios.post(url, payload);

        if (response.data.candidates && response.data.candidates.length > 0) {
            const resultText = response.data.candidates[0].content.parts[0].text;
            res.json({ result: resultText });
        } else {
            res.status(500).json({ error: "AI could not generate result. Try again." });
        }

    } catch (error) {
        // এরর মেসেজ চেক করা
        const errorMsg = error.response ? JSON.stringify(error.response.data) : error.message;
        console.error("API ERROR:", errorMsg);
        res.status(500).json({ error: "API Error: " + errorMsg });
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});