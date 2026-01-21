const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

// Manually passed key if dotenv doesn't work in this specific test run context
const apiKey = process.env.GOOGLE_AI_API_KEY || "AIzaSyDrferlfHtBC2_DRrbGa-pX3m3D0hxoECQ";

const genAI = new GoogleGenerativeAI(apiKey);

async function run() {
    try {
        console.log("Testing Gemini API...");
        console.log("Key used (last 4):", apiKey.slice(-4));

        // Try gemini-1.5-pro first
        console.log("Attempting model: gemini-1.5-pro");
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
        const result = await model.generateContent("Hello, can you hear me?");
        const response = await result.response;
        console.log("Success! Response:", response.text());
    } catch (error) {
        console.error("Error with gemini-1.5-pro:", error.message);

        try {
            // Fallback to gemini-pro
            console.log("Attempting model: gemini-pro");
            const model = genAI.getGenerativeModel({ model: "gemini-pro" });
            const result = await model.generateContent("Hello, can you hear me?");
            const response = await result.response;
            console.log("Success with gemini-pro! Response:", response.text());
        } catch (e) {
            console.error("Error with gemini-pro:", e.message);
        }
    }
}

run();
