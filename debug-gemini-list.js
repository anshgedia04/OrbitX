const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');

const apiKey = "AIzaSyDrferlfHtBC2_DRrbGa-pX3m3D0hxoECQ";
const genAI = new GoogleGenerativeAI(apiKey);

async function run() {
    const log = [];
    try {
        // Note: The SDK doesn't have a direct 'listModels' on genAI instance usually, 
        // it's often on a ModelService or similar? 
        // Wait, the error message says "Call ListModels". 
        // In the Node SDK, it might be different. 
        // Let's try to verify if we can list models via the SDK or if we need to blindly try 'gemini-1.5-flash'.

        // Actually, looking at docs, there isn't a simple listModels on the main class in some versions.
        // But let's try 'gemini-1.5-flash' which is the most common new one.

        log.push("Testing gemini-1.5-flash...");
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent("Hello");
        const response = await result.response;
        log.push(`Success 1.5-flash: ${response.text()}`);

    } catch (e) {
        log.push(`Error list/flash: ${e.message}`);
    }

    fs.writeFileSync('gemini-models.log', log.join('\n'));
}

run();
