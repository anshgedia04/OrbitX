const https = require('https');
const fs = require('fs');

const apiKey = "AIzaSyDrferlfHtBC2_DRrbGa-pX3m3D0hxoECQ";
const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

https.get(url, (res) => {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        fs.writeFileSync('gemini-rest.log', `Status: ${res.statusCode}\nBody: ${data}`);
    });

}).on("error", (err) => {
    fs.writeFileSync('gemini-rest.log', `Error: ${err.message}`);
});
