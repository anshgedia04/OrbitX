/**
 * Sarvam AI client — powers OrbitX AI model.
 * Model: sarvam-m (24B multilingual, hybrid-reasoning, built on Mistral-Small)
 * Auth:  api-subscription-key header (from Sarvam SDK source)
 * Docs:  https://docs.sarvam.ai
 */

const SARVAM_API_URL = "https://api.sarvam.ai/v1/chat/completions";
const SARVAM_MODEL = "sarvam-m";

export interface SarvamMessage {
    role: "system" | "user" | "assistant";
    content: string;
}

export interface SarvamChatOptions {
    messages: SarvamMessage[];
    temperature?: number;               // 0–2 (0.2 factual / 0.5 reasoning / 0.8+ creative)
    top_p?: number;                     // 0–1, default 1.0
    max_tokens?: number;                // default 2048
    reasoning_effort?: "low" | "medium" | "high";  // enables thinking mode
    wiki_grounding?: boolean;           // RAG from Wikipedia for factual accuracy
}

export function getSarvamApiKey(): string {
    const key = process.env.SARVAM_API_KEY;
    if (!key) throw new Error("SARVAM_API_KEY is not configured in environment");
    return key;
}

export async function sarvamChat(options: SarvamChatOptions): Promise<string> {
    const apiKey = getSarvamApiKey();

    // Build a minimal, clean request body
    const body: Record<string, any> = {
        model: SARVAM_MODEL,
        messages: options.messages,
        temperature: options.temperature ?? 0.5,
        top_p: options.top_p ?? 1.0,
        max_tokens: options.max_tokens ?? 2048,
    };

    // Optional params — only sent if explicitly provided to avoid 422 errors
    if (options.reasoning_effort) body.reasoning_effort = options.reasoning_effort;
    if (options.wiki_grounding) body.wiki_grounding = true;

    console.log("[OrbitX/Sarvam] →", {
        messages: options.messages.length,
        temperature: body.temperature,
        reasoning_effort: body.reasoning_effort,
        wiki_grounding: body.wiki_grounding,
    });

    const res = await fetch(SARVAM_API_URL, {
        method: "POST",
        headers: {
            // Sarvam SDK uses api-subscription-key as the primary header
            "api-subscription-key": apiKey,
            "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
    });

    // Parse error body for usable message
    if (!res.ok) {
        let errBody: any = {};
        try { errBody = await res.json(); } catch { }
        const errMsg =
            errBody?.error?.message ??
            errBody?.detail ??
            errBody?.message ??
            `Sarvam API returned HTTP ${res.status}`;
        console.error(`[OrbitX/Sarvam] HTTP ${res.status}:`, errBody);
        throw new Error(errMsg);
    }

    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content;

    if (!content) {
        console.error("[OrbitX/Sarvam] Unexpected response format:", data);
        throw new Error("Sarvam AI returned an empty response");
    }

    console.log("[OrbitX/Sarvam] ✓ response received, length:", content.length);
    return content;
}
