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

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.post('/analyze', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No image uploaded.' });

        // v1 apiVersion ব্যবহার করে মডেল কল করা
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }, { apiVersion: 'v1' });

        const imagePart = {
            inlineData: {
                data: req.file.buffer.toString("base64"),
                mimeType: req.file.mimetype
            }
        };

        const result = await model.generateContent([
            "Analyze this chart. What is the next 1m candle? UP or DOWN?", 
            imagePart
        ]);
        
        const response = await result.response;
        res.json({ result: response.text() });
    } catch (error) {
        console.error("Gemini Error Details:", error);
        res.status(500).json({ error: "AI Error: " + error.message });
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server live on ${PORT}`);
});