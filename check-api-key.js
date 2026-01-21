const https = require('https');
require("dotenv").config();

const apiKey = process.env.GOOGLE_AI_API_KEY;

if (!apiKey) {
  console.error("❌ GOOGLE_AI_API_KEY not found in .env");
  process.exit(1);
}

console.log("API Key:", apiKey.substring(0, 15) + "...");
console.log("\nChecking API key validity...\n");

// Try to list models using REST API
const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

https.get(url, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    if (res.statusCode === 200) {
      const response = JSON.parse(data);
      console.log("✅ API Key is VALID!\n");
      console.log("Available models:");
      
      if (response.models) {
        response.models.forEach(model => {
          if (model.name.includes('gemini')) {
            console.log(`  - ${model.name.replace('models/', '')}`);
          }
        });
      }
    } else {
      console.error("❌ API Key Error!");
      console.error("Status:", res.statusCode);
      console.error("Response:", data);
      
      if (res.statusCode === 400) {
        console.log("\n⚠️  Your API key appears to be invalid or disabled.");
        console.log("Get a new key at: https://aistudio.google.com/app/apikey");
      }
    }
  });

}).on('error', (err) => {
  console.error("❌ Network Error:", err.message);
});
