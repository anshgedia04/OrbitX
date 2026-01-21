const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

async function testGeminiAPI() {
  console.log("Testing Gemini API...\n");

  const apiKey = process.env.GOOGLE_AI_API_KEY;
  
  if (!apiKey) {
    console.error("❌ GOOGLE_AI_API_KEY not found in environment");
    return;
  }

  console.log("✓ API Key found:", apiKey.substring(0, 10) + "...");

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    console.log("\n🔄 Sending test request...");
    const result = await model.generateContent("Say hello in one sentence");
    const response = result.response.text();

    console.log("\n✅ SUCCESS! Response received:");
    console.log(response);
    console.log("\n✓ Your Gemini API is working correctly!");

  } catch (error) {
    console.error("\n❌ ERROR:", error.message);
    
    if (error.message.includes("quota") || error.message.includes("RESOURCE_EXHAUSTED")) {
      console.log("\n⚠️  Quota exhausted. Wait a few minutes and try again.");
      console.log("Free tier limits: 15 requests per minute, 1500 per day");
    } else if (error.message.includes("API key")) {
      console.log("\n⚠️  API key issue. Check if it's valid and enabled.");
    } else {
      console.log("\n⚠️  Unexpected error:", error);
    }
  }
}

testGeminiAPI();
