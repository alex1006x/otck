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
if (!process.env.GEMINI_API_KEY) {
    console.error("ERORR: GEMINI_API_KEY missing!");
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.post('/analyze', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No image uploaded.' });

        // সমাধান: 'gemini-1.5-flash' এর বদলে 'gemini-1.5-pro' ট্রাই করুন যদি প্রথমটি না পায়
        // অথবা সরাসরি 'models/gemini-1.5-flash' স্ট্রিং ব্যবহার করুন
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const imagePart = {
            inlineData: {
                data: req.file.buffer.toString("base64"),
                mimeType: req.file.mimetype
            }
        };

        const result = await model.generateContent([
            "Analyze this binary options chart. Predict the next 1m candle color. Response in 2 lines.",
            imagePart
        ]);
        
        const response = await result.response;
        res.json({ result: response.text() });
    } catch (error) {
        console.error("Detailed Error Log:", error);
        res.status(500).json({ error: "AI Error: " + error.message });
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server started on port ${PORT}`);
});