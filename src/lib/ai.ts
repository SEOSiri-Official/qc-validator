// src/lib/ai.ts

// --- 1. PROVIDER CONFIGURATION ---
const PROVIDERS = {
  'OpenAI': { model: 'gpt-4-turbo', apiUrl: 'https://api.openai.com/v1/chat/completions' },
  'Google AI': { model: 'gemini-1.5-pro-latest', apiUrl: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent' },
  'Anthropic': { model: 'claude-3-opus-20240229', apiUrl: 'https://api.anthropic.com/v1/messages' },
};
export type ProviderName = keyof typeof PROVIDERS;

// --- 2. CORE AI HELPER FUNCTION ---
export async function getAiCompletion(
    prompt: string, 
    provider: ProviderName, 
    apiKey: string
): Promise<string> {
    
    const providerConfig = PROVIDERS[provider];
    let requestBody: any;
    let headers: any = { "Content-Type": "application/json" };
    let apiUrl = providerConfig.apiUrl;

    if (provider === 'OpenAI') {
        headers['Authorization'] = `Bearer ${apiKey}`;
        requestBody = { model: providerConfig.model, messages: [{ role: "user", content: prompt }] };
    } else if (provider === 'Google AI') {
        apiUrl = `${providerConfig.apiUrl}?key=${apiKey}`;
        requestBody = { contents: [{ parts: [{ text: prompt }] }] };
    } else if (provider === 'Anthropic') {
        headers['x-api-key'] = apiKey;
        headers['anthropic-version'] = '2023-06-01';
        requestBody = { model: providerConfig.model, max_tokens: 4096, messages: [{ role: "user", content: prompt }] };
    }

    try {
        const response = await fetch(apiUrl, { method: "POST", headers, body: JSON.stringify(requestBody) });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error?.message || `API Error`);

        if (provider === 'OpenAI') return data.choices[0].message.content;
        if (provider === 'Google AI') return data.candidates[0].content.parts[0].text;
        if (provider === 'Anthropic') return data.content[0].text;

        throw new Error("Unsupported provider in response parsing.");
    } catch (error) {
        console.error(`AI request failed for ${provider}:`, error);
        throw error;
    }
}

// --- 3. (KEPT & UPDATED) translateText FUNCTION ---
export const translateText = async (
    text: string, 
    targetLang: 'en' | 'ar', 
    provider: ProviderName, // Now requires provider
    apiKey: string
): Promise<string> => {
    if (!apiKey || !text) return text;
    
    const prompt = `Translate the following text into ${targetLang === 'en' ? 'English' : 'Arabic'}. Return ONLY the translated text. Text: "${text}"`;
    
    try {
        // Now uses the central helper function
        return await getAiCompletion(prompt, provider, apiKey);
    } catch (error) {
        console.error("Translation Error:", error);
        return `[Translation Error] ${text}`;
    }
};