/**
 * OpenRouter AI client — supports multiple API keys, one per model.
 * Endpoint: https://openrouter.ai/api/v1/chat/completions
 * Auth:     Authorization: Bearer <apiKey>
 */

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

export interface OpenRouterMessage {
    role: "system" | "user" | "assistant";
    content: string;
}

export interface OpenRouterChatOptions {
    model: string;
    messages: OpenRouterMessage[];
    temperature?: number;
    max_tokens?: number;
    /** Explicit API key — pass the model-specific key from env */
    apiKey: string;
}

/**
 * Read an OpenRouter API key by env variable name.
 * e.g. getOpenRouterKey("OPENROUTER_API_KEY_NVIDIA")
 */
export function getOpenRouterKey(envName: string): string {
    const key = process.env[envName];
    if (!key) throw new Error(`${envName} is not configured in environment`);
    return key;
}

export async function openRouterChat(options: OpenRouterChatOptions): Promise<string> {
    const { apiKey, model, messages, temperature = 0.7, max_tokens = 2048 } = options;

    console.log("[OpenRouter] →", { model, messages: messages.length, temperature });

    const res = await fetch(OPENROUTER_API_URL, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ model, messages, temperature, max_tokens }),
    });

    if (!res.ok) {
        let errBody: any = {};
        try { errBody = await res.json(); } catch { }
        const errMsg =
            errBody?.error?.message ??
            errBody?.message ??
            `OpenRouter API returned HTTP ${res.status}`;
        console.error(`[OpenRouter] HTTP ${res.status}:`, errBody);
        throw new Error(errMsg);
    }

    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content;

    if (!content) {
        console.error("[OpenRouter] Unexpected response format:", data);
        throw new Error("OpenRouter returned an empty response");
    }

    console.log("[OpenRouter] ✓ response, length:", content.length);
    return content;
}
