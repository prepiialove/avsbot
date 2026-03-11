const fetch = require('node-fetch');

const apiKey = "AIzaSyDLKBbSQnK3kQX7YOsgYJnUZSKd358zNu4";
const instruction = "Test";
const userMessage = "Hello";

async function test() {
    const MODELS = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'];
    for (const modelId of MODELS) {
        try {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${apiKey}`;
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    systemInstruction: { parts: [{ text: instruction }] },
                    contents: [{ parts: [{ text: userMessage }] }],
                    generationConfig: { temperature: 0.7 }
                })
            });
            console.log(`[AI] ${modelId} status: ${response.status}`);
            const data = await response.json();
            console.log(JSON.stringify(data, null, 2));
        } catch (e) { console.error(`[AI] Exception ${modelId}:`, e.message); }
    }
}
test();
