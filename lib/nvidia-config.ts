/**
 * NVIDIA API client — OpenAI-compatible endpoint.
 * Endpoint: https://integrate.api.nvidia.com/v1/chat/completions
 * Auth:     Authorization: Bearer <apiKey>
 */

const NVIDIA_API_URL = "https://integrate.api.nvidia.com/v1/chat/completions";

export interface NvidiaMessage {
    role: "system" | "user" | "assistant";
    content: string;
}

export interface NvidiaChatOptions {
    model: string;
    messages: NvidiaMessage[];
    temperature?: number;
    max_tokens?: number;
    apiKey: string;
}

export function getNvidiaKey(envName: string): string {
    const key = process.env[envName];
    if (!key) throw new Error(`${envName} is not configured in environment`);
    return key;
}

export async function nvidiaChat(
    options: NvidiaChatOptions
): Promise<AsyncGenerator<{ content: string; thinking?: string }, void, unknown>> {
    const { apiKey, model, messages, temperature = 1, max_tokens = 16384 } = options;

    console.log("[Nvidia] →", { model, messages: messages.length, temperature, stream: true });

    const body: any = { 
        model, 
        messages, 
        temperature, 
        max_tokens, 
        stream: true 
    };

    const res = await fetch(NVIDIA_API_URL, {
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
                                    thinking: delta.reasoning_content || undefined
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
