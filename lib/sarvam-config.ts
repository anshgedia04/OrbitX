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

export async function sarvamChat(
    options: SarvamChatOptions
): Promise<AsyncGenerator<{ content: string; thinking?: string }, void, unknown>> {
    const apiKey = getSarvamApiKey();

    const body: Record<string, any> = {
        model: SARVAM_MODEL,
        messages: options.messages,
        temperature: options.temperature ?? 0.5,
        top_p: options.top_p ?? 1.0,
        max_tokens: options.max_tokens ?? 2048,
        stream: true,
    };

    if (options.reasoning_effort) body.reasoning_effort = options.reasoning_effort;
    if (options.wiki_grounding) body.wiki_grounding = true;

    console.log("[OrbitX/Sarvam] →", {
        messages: options.messages.length,
        temperature: body.temperature,
        stream: true,
    });

    const res = await fetch(SARVAM_API_URL, {
        method: "POST",
        headers: {
            "api-subscription-key": apiKey,
            "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
    });

    if (!res.ok) {
        let errBody: any = {};
        try { errBody = await res.json(); } catch { }
        throw new Error(errBody?.error?.message ?? errBody?.detail ?? errBody?.message ?? `HTTP ${res.status}`);
    }

    if (!res.body) throw new Error("No response body");

    return (async function* () {
        const reader = res.body!.getReader();
        const decoder = new TextDecoder("utf-8");
        let done = false;
        let buffer = "";

        while (!done) {
            const { value, done: readerDone } = await reader.read();
            done = readerDone;
            if (value) {
                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split("\n");
                buffer = lines.pop() || "";

                for (const line of lines) {
                    const trimmedLine = line.trim();
                    if (!trimmedLine) continue;

                    if (trimmedLine === "data: [DONE]") return; // End of stream
                    if (trimmedLine.startsWith("data: ")) {
                        try {
                            const data = JSON.parse(trimmedLine.slice(6));
                            const delta = data.choices[0]?.delta;
                            if (delta) {
                                yield {
                                    content: delta.content || "",
                                    thinking: undefined // Sarvam doesn't expose raw thinking tags yet
                                };
                            }
                        } catch (e) {
                            console.warn("Failed to parse SSE chunk:", trimmedLine);
                        }
                    }
                }
            }
        }
    })();
}
