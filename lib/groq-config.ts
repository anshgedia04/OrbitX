/**
 * Groq AI client — OpenAI-compatible endpoint.
 * Endpoint: https://api.groq.com/openai/v1/chat/completions
 * Auth:     Authorization: Bearer <apiKey>
 */

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

export interface GroqMessage {
    role: "system" | "user" | "assistant";
    content: string;
}

export interface GroqChatOptions {
    model: string;
    messages: GroqMessage[];
    temperature?: number;
    max_tokens?: number;
    apiKey: string;
}

export function getGroqKey(envName: string): string {
    const key = process.env[envName];
    if (!key) throw new Error(`${envName} is not configured in environment`);
    return key;
}

export async function groqChat(
    options: GroqChatOptions
): Promise<AsyncGenerator<{ content: string; thinking?: string }, void, unknown>> {
    const { apiKey, model, messages, temperature = 1, max_tokens = 1024 } = options;

    console.log("[Groq] →", { model, messages: messages.length, temperature, stream: true });

    const body: any = { 
        model, 
        messages, 
        temperature, 
        max_completion_tokens: max_tokens, // Groq setup uses max_completion_tokens
        stream: true 
    };

    const res = await fetch(GROQ_API_URL, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
    });

    if (!res.ok) {
        let errBody: any = {};
        try { errBody = await res.json(); } catch { }
        const errMsg = errBody?.error?.message ?? errBody?.message ?? `HTTP ${res.status}`;
        throw new Error(errMsg);
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
