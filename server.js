const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.static('public'));
app.use(express.json());

const upload = multer({ storage: multer.memoryStorage() });
const PORT = process.env.PORT || 3000;

// API Key চেক
const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

app.post('/analyze', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No image uploaded.' });

        // ট্রাই ১: gemini-1.5-flash (লেটেস্ট ভার্সন)
        // ট্রাই ২: gemini-pro-vision (পুরানো কিন্তু স্টেবল ভার্সন)
        let model;
        try {
            model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        } catch (e) {
            model = genAI.getGenerativeModel({ model: "gemini-pro-vision" });
        }

        const imagePart = {
            inlineData: {
                data: req.file.buffer.toString("base64"),
                mimeType: req.file.mimetype
            }
        };

        const result = await model.generateContent([
            "Analyze this chart. Predict next candle: UP or DOWN? Give logic.", 
            imagePart
        ]);
        
        const response = await result.response;
        res.json({ result: response.text() });

    } catch (error) {
        console.error("SERVER ERROR:", error);
        // যদি মডেল নট ফাউন্ড (404) আসে, তবে ইউজারকে পরিষ্কার মেসেজ দিবে
        res.status(500).json({ 
            error: "Model error. Please ensure your API Key is from Google AI Studio and supports Gemini 1.5 Flash." 
        });
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server live on ${PORT}`);
});