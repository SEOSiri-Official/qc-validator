// src/lib/ai.ts

// This file will hold all AI-related utility functions.

export const translateText = async (text: string, targetLang: 'en' | 'ar', apiKey: string): Promise<string> => {
    if (!apiKey) return `[Missing API Key] ${text}`;

    try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: "gpt-3.5-turbo",
                messages: [{
                    role: "system", 
                    content: `You are a translator. Translate the following text into ${targetLang === 'en' ? 'English' : 'Arabic'}. Only return the translated text.` 
                }, {
                    role: "user", content: text
                }]
            })
        });
        if (!response.ok) {
            throw new Error(`OpenAI API error: ${response.statusText}`);
        }
        const data = await response.json();
        return data.choices[0].message.content;
    } catch (error) {
        console.error("Translation Error:", error);
        return `[Translation Error] ${text}`;
    }
};