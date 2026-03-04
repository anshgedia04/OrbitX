/**
 * GitHub Models client — OpenAI-compatible endpoint hosted by Azure.
 * Endpoint: https://models.inference.ai.azure.com/chat/completions
 * Auth:     Authorization: Bearer <github_personal_access_token>
 *
 * Each model must provide its OWN token via `apiKey`.
 * Use getGithubModelKey(envName) to resolve the right token per model.
 */

const GITHUB_MODELS_URL = "https://models.inference.ai.azure.com/chat/completions";

export interface GithubModelMessage {
    role: "system" | "user" | "assistant";
    content: string;
}

export interface GithubModelChatOptions {
    model: string;
    messages: GithubModelMessage[];
    temperature?: number;
    max_tokens?: number;
    /** The GitHub PAT for THIS specific model — never shared across models */
    apiKey: string;
}

/**
 * Resolve a GitHub token from an env var name.
 * e.g. getGithubModelKey("GITHUB_GROK_TOKEN")
 */
export function getGithubModelKey(envName: string): string {
    const key = process.env[envName];
    if (!key) throw new Error(`${envName} is not set in environment`);
    return key;
}

export async function githubModelChat(
    options: GithubModelChatOptions
): Promise<AsyncGenerator<{ content: string; thinking?: string }, void, unknown>> {
    const { apiKey, model, messages, temperature = 0.3, max_tokens = 2048 } = options;

    console.log("[GitHub Models] →", { model, messages: messages.length, temperature, stream: true });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5 * 60 * 1000);

    const res = await fetch(GITHUB_MODELS_URL, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ model, messages, temperature, max_tokens, stream: true }),
        signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
        let errBody: any = {};
        try { errBody = await res.json(); } catch { }
        throw new Error(errBody?.error?.message ?? errBody?.message ?? `HTTP ${res.status}`);
    }

    if (!res.body) throw new Error("No response body");

    // We return an async generator that yields { content, thinking } objects as they arrive
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
                // Keep the last partial line in the buffer
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
