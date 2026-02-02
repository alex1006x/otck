const express = require('express');
const cors = require('cors'); // ১. আগে ইমপোর্ট করুন
const multer = require('multer');
const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

const app = express(); // ২. আগে app তৈরি করুন
app.use(cors());       // ৩. এখন cors ব্যবহার করুন

const upload = multer({ storage: multer.memoryStorage() });

// বাকি কোড নিচে আগের মতোই থাকবে...
// Gemini API Setup
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.use(express.static('public'));
app.use(express.json());

app.post('/analyze', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).send('No image uploaded.');

        // Advanced Trading Prompt for better accuracy
        const model = genAI.getGenerativeModel({ 
            model: "gemini-1.5-flash",
            systemInstruction: "You are an expert binary options price action trader. Analyze the 1-minute OTC chart image. Focus on support/resistance, candlestick patterns (like pin bar, engulfing, doji), and current momentum. Provide a clear 'UP' or 'DOWN' signal, a confidence percentage (e.g., 85%), and a 2-line logical explanation."
        });

        const imagePart = {
            inlineData: {
                data: req.file.buffer.toString("base64"),
                mimeType: req.file.mimetype
            }
        };

        const result = await model.generateContent([
            "Analyze this chart. What is the color of the next 1-minute candle?", 
            imagePart
        ]);
        
        const response = await result.response;
        res.json({ result: response.text() });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Analysis failed. Check API Key or Image." });
    }
});

// Render compatibility: Uses dynamic port or 3000
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));