const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

async function listModels() {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  
  if (!apiKey) {
    console.error("❌ GOOGLE_AI_API_KEY not found");
    return;
  }

  console.log("Fetching available models...\n");

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Try different model names
    const modelsToTry = [
      "gemini-pro",
      "gemini-1.5-pro",
      "gemini-1.5-flash",
      "gemini-1.0-pro"
    ];

    for (const modelName of modelsToTry) {
      try {
        console.log(`Testing: ${modelName}...`);
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent("Hi");
        console.log(`✅ ${modelName} - WORKS!\n`);
      } catch (err) {
        console.log(`❌ ${modelName} - ${err.message.split('\n')[0]}\n`);
      }
    }

  } catch (error) {
    console.error("Error:", error.message);
  }
}

listModels();
