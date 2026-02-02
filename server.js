const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

const app = express();

// ১. মিডলওয়্যার সেটআপ
app.use(cors());
app.use(express.static('public'));
app.use(express.json());

// ২. ফাইল আপলোড সেটিংস (মেমোরি স্টোরেজ)
const upload = multer({ storage: multer.memoryStorage() });

// ৩. পোর্ট সেটআপ (Render-এর জন্য খুবই জরুরি)
const PORT = process.env.PORT || 3000;

// ৪. Gemini API কনফিগারেশন
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ৫. মূল রুট (Main Route)
app.post('/analyze', upload.single('image'), async (req, res) => {
    try {
        // ইমেজ চেক
        if (!req.file) {
            return res.status(400).json({ error: 'No image uploaded. Please select a chart screenshot.' });
        }

        if (!process.env.GEMINI_API_KEY) {
            return res.status(500).json({ error: 'API Key is missing in server settings.' });
        }

        // মডেল কল করা (Gemini 1.5 Flash ব্যবহার করা হয়েছে যা ফাস্ট এবং ফ্রী)
        const model = genAI.getGenerativeModel({ 
            model: "gemini-1.5-flash" 
        });

        // ইমেজ ডেটা ফরম্যাট করা
        const imagePart = {
            inlineData: {
                data: req.file.buffer.toString("base64"),
                mimeType: req.file.mimetype
            }
        };

        // এআইকে কমান্ড দেওয়া (Prompt)
        const prompt = "You are a professional Binary Options trader. Analyze this 1-minute OTC chart. Focus on candlesticks, support/resistance, and momentum. Tell me if the next candle will be GREEN (UP) or RED (DOWN). Give a confidence percentage and a 1-line reason.";

        const result = await model.generateContent([prompt, imagePart]);
        const response = await result.response;
        const text = response.text();

        // রেজাল্ট পাঠানো
        res.json({ result: text });

    } catch (error) {
        console.error("Analysis Error:", error);
        res.status(500).json({ 
            error: "AI analysis failed. Please try again or check if API key is valid." 
        });
    }
});

// ৬. সার্ভার চালু করা
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running live on port ${PORT}`);
});