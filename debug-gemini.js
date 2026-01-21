const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');

const apiKey = "AIzaSyDrferlfHtBC2_DRrbGa-pX3m3D0hxoECQ";
const genAI = new GoogleGenerativeAI(apiKey);

async function run() {
    const log = [];
    log.push("Starting Debug...");
    log.push(`Key (last 4): ${apiKey.slice(-4)}`);

    try {
        log.push("Testing gemini-1.5-pro...");
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
        const result = await model.generateContent("Hello");
        const response = await result.response;
        log.push(`Success 1.5-pro: ${response.text()}`);
    } catch (e) {
        log.push(`Error 1.5-pro: ${e.message}`);
        // log.push(JSON.stringify(e, null, 2));
    }

    try {
        log.push("Testing gemini-pro...");
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const result = await model.generateContent("Hello");
        const response = await result.response;
        log.push(`Success gemini-pro: ${response.text()}`);
    } catch (e) {
        log.push(`Error gemini-pro: ${e.message}`);
    }

    fs.writeFileSync('gemini-error.log', log.join('\n'));
}

run();
