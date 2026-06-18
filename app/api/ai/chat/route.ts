import { NextRequest, NextResponse } from "next/server";
import { getGeminiClient, GEMINI_CONFIG, isQuotaError } from "@/lib/gemini-config";
import { sarvamChat } from "@/lib/sarvam-config";
import { openRouterChat, getOpenRouterKey } from "@/lib/openrouter-config";
import { githubModelChat, getGithubModelKey } from "@/lib/github-models-config";
import { groqChat, getGroqKey } from "@/lib/groq-config";
import { nvidiaChat, getNvidiaKey } from "@/lib/nvidia-config";
import { sql } from "@/lib/neon";

/* ---------- RATE LIMITING ---------- */
const RATE_LIMIT_WINDOW_MS = 10_000; // 10 seconds (more reasonable)
const MAX_REQUESTS_PER_WINDOW = 2; // Allow 2 requests per window
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  if (record.count >= MAX_REQUESTS_PER_WINDOW) {
    return true;
  }

  record.count++;
  return false;
}

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of rateLimitMap.entries()) {
    if (now > record.resetTime) {
      rateLimitMap.delete(ip);
    }
  }
}, 60_000); // Clean every minute

async function generateWithRetry(model: any, prompt: string, maxRetries = 2) {
  let lastError;

  // Add formatting instructions to the prompt
  const formattedPrompt = `Please provide a well-formatted, clear, and organized response to the following question. Use markdown formatting where appropriate (bold for emphasis, bullet points for lists, numbered lists for steps, etc.):

${prompt}`;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await model.generateContent(formattedPrompt);
      return result.response.text();
    } catch (error: any) {
      lastError = error;

      // Check if it's a quota/rate limit error
      if (error.message?.includes("quota") || error.message?.includes("RESOURCE_EXHAUSTED")) {
        throw error; // Don't retry quota errors
      }

      // For other errors, wait and retry
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
      }
    }
  }

  throw lastError;
}

import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";
import NoteEmbedding from "@/models/NoteEmbedding";
import Note from "@/models/Note";

// ... existing imports

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate User
    let token = req.headers.get("authorization")?.split(" ")[1];
    if (!token) {
      const cookieStore = await cookies();
      token = cookieStore.get('token')?.value;
    }

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = await verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // 2. Verify Subscription Status
    await connectToDatabase();
    const user = await User.findById(decoded.userId).select('subscriptionStatus');

    if (!user || (user.subscriptionStatus !== 'pro' && user.subscriptionStatus !== 'plus')) {
      return NextResponse.json(
        { error: "This feature is only available for Pro users." },
        { status: 403 }
      );
    }

    // 3. Route request based on selected model

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ||
      req.headers.get("x-real-ip") ||
      "unknown";

    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please wait a moment." },
        { status: 429 }
      );
    }

    // ── Model registry ─────────────────────────────────────────────────
    // Every model is FULLY SELF-CONTAINED: its own systemPrompt, temperature,
    // and provider flags live here. Adding a new OpenRouter model = one new
    // registry entry only — no new handler code, zero conflict risk.
    type ModelEntry = {
      provider: string;
      apiModel: string;
      displayName: string;
      systemPrompt?: string | null;  // null → raw model, no system message
      temperature?: number;
      max_tokens?: number;
      wiki_grounding?: boolean;        // Sarvam-specific
      apiKeyEnv?: string;         // OpenRouter: env var name for model-specific key
      reasoning?: boolean;
    };

    const MODEL_REGISTRY: Record<string, ModelEntry> = {
      // ── Gemini ──────────────────────────────────────────────────────
      "gemini-3.1-pro": {
        provider: "gemini",
        apiModel: "gemini-2.5-flash",
        displayName: "Gemini 3.1 Pro",
        temperature: 0.7,
      },

      // ── OrbitX AI (Sarvam-M) ────────────────────────────────────────
      "orbitx-ai": {
        provider: "sarvam",
        apiModel: "sarvam-30b",
        displayName: "OrbitX AI",
        systemPrompt:
          "You are OrbitX AI, a smart and helpful AI assistant built into the OrbitX Notes app. " +
          "You help users with their notes, ideas, writing, coding, and general questions. " +
          "Be concise, clear, and use markdown formatting where helpful. " +
          "You have deep knowledge of Indian languages and culture and answer in an Indian tone and style." +
          "my model name is OrbitX-large-v3 your ai assistant",
        temperature: 0.2,
        wiki_grounding: false,
      },

      // ── OpenRouter: Nvidia Nemotron ──────────────────────────────────
      "nvidia-nemotron": {
        provider: "openrouter",
        apiModel: "nvidia/nemotron-3-nano-30b-a3b:free",
        displayName: "Nvidia Nemotron",
        systemPrompt: "you are a helpfull AI assistant and can answer in indian tone and style" + "my model name is  nvidia nemotron 3 nano 30b a3b your ai assistant",
        temperature: 0.7,
        max_tokens: 2048,
        apiKeyEnv: "OPENROUTER_API_KEY_NVIDIA",  // ← dedicated key
      },


      "meta-llama": {
        provider: "openrouter",
        apiModel: "meta-llama/llama-3.3-70b-instruct:free",
        displayName: "Meta Llama 3.3",
        systemPrompt: "You are a helpful assistant.",
        temperature: 0.7,
        max_tokens: 2048,
      },
      "claude-3.5-sonnet": {
        provider: "openrouter",
        apiModel: "anthropic/claude-3.5-sonnet",
        displayName: "Claude 3.5 Sonnet",
        systemPrompt: "You are a helpful AI assistant.",
        temperature: 0.7,
        max_tokens: 4096,
        apiKeyEnv: "OPENROUTER_API_KEY",
      },
 // ── OpenRouter: GLM 4.5 Air ───────────────────────────────────────
      "glm-4.5-air": {
        provider: "openrouter",
        apiModel: "z-ai/glm-4.5-air:free",
        displayName: "GLM 4.5 Air",
        systemPrompt: "You are GLM 4.5 Air, an AI assistant with deep expertise in science and history.",
        temperature: 0.7,
        max_tokens: 2048,
        apiKeyEnv: "OPENROUTER_API_KEY_GLM",
      },


      // ── OpenRouter: Kimi K2.6 ─────────────────────────────────────────
      "kimi-k2.6": {
        provider: "openrouter",
        apiModel: "moonshotai/kimi-k2.6:free",
        displayName: "Kimi K2.6",
        systemPrompt: "You are Kimi K2.6, a helpful AI assistant. Answer step-by-step and show your reasoning.",
        temperature: 0.7,
        max_tokens: 4096,
        apiKeyEnv: "OPENROUTER_API_KEY_KIMI",
        reasoning: true,
      },


      // ── GitHub Models: CodeStral ──────────────────────────────────────
      "codestral": {
        provider: "github",
        apiModel: "Codestral-2501",
        displayName: "CodeStral",
        systemPrompt: "You are CodeStral, an expert AI coding assistant. Help users write, debug, explain, and optimize code across all programming languages.",
        temperature: 0.3,
        max_tokens: 2048,
        apiKeyEnv: "GITHUB_CODESTRAL_TOKEN",
      },

      // ── GitHub Models: Mistral Small 3.1 ──────────────────────────────
      "mistral-small": {
        provider: "github",
        apiModel: "mistral-small-2503",
        displayName: "Mistral Small 3.1",
        systemPrompt: "You are Mistral Small 3.1, a helpful AI assistant.",
        temperature: 0.5,
        max_tokens: 4096,
        apiKeyEnv: "GITHUB_MISTRAL_TOKEN",
      },

      // ── GitHub Models: Cohere Command A ────────────────────────────────
      "cohere-command-a": {
        provider: "github",
        apiModel: "cohere-command-a",
        displayName: "Cohere Command A",
        systemPrompt: "You are Cohere Command A, a helpful AI assistant.",
        temperature: 0.7,
        max_tokens: 4096,
        apiKeyEnv: "GITHUB_COHERE_TOKEN",
      },


      // ── GitHub Models: GPT-4.1 ────────────────────────────────────────
      "gpt-4.1": {
        provider: "github",
        apiModel: "gpt-4.1",
        displayName: "GPT-4.1",
        systemPrompt: "i am GPT 4.1 by OPENAI",
        temperature: 0.3,
        max_tokens: 2018,
        apiKeyEnv: "GITHUB_GPT_4_1_TOKEN",
      },


      // ── Nvidia: Qwen-3 Coder ──────────────────────────────────────────
      "qwen3-coder": {
        provider: "nvidia",
        apiModel: "qwen/qwen3-coder-480b-a35b-instruct",
        displayName: "Qwen-3 Coder",
        systemPrompt: "You are Qwen-3 Coder, an expert AI programming assistant.",
        temperature: 0.7,
        max_tokens: 4096,
        apiKeyEnv: "NVIDIA_QWEN",
      },

      // ── Groq: Llama 4 Scout ───────────────────────────────────────────
      "llama-4-scout": {
        provider: "groq",
        apiModel: "meta-llama/llama-4-scout-17b-16e-instruct",
        displayName: "Llama 4 Scout",
        systemPrompt: "You are Llama 4 Scout, a highly capable AI assistant running on Groq.",
        temperature: 1,
        max_tokens: 1024,
        apiKeyEnv: "GROQ_API",
      },
 //api changed //error     
      "gpt-4o": {
        provider: "github",
        apiModel: "gpt-4o",
        displayName: "GPT-4o",
        systemPrompt: "my model name is  GPT-4o developed by OPENAI",
        temperature: 0.3,
        max_tokens: 2018,
        apiKeyEnv: "GITHUB_GPT_4o_TOKEN",
      },


    };

    const { messages, model: requestedModel, contextNoteId, sessionId } = await req.json();
    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const lastUserMessage = messages[messages.length - 1]?.content;
    if (!lastUserMessage || typeof lastUserMessage !== "string") {
      return NextResponse.json({ error: "Invalid message content" }, { status: 400 });
    }

    const modelConfig = requestedModel ? MODEL_REGISTRY[requestedModel] : null;

    if (sessionId) {
      // Save user message
      await sql`
        INSERT INTO ai_chat_messages (session_id, role, content) 
        VALUES (${sessionId}, 'user', ${lastUserMessage})
      `;
      // Update session updated_at
      await sql`
        UPDATE ai_chat_sessions SET updated_at = CURRENT_TIMESTAMP WHERE id = ${sessionId}
      `;
    }

    // ── Context Injection via Vector Search (RAG) ─────────────────────
    let ragContextText = "";
    if (contextNoteId) {
      try {
        const hfKey = process.env.HF_KEY;
        if (hfKey) {
            // Embed the user's query using Hugging Face (all-MiniLM-L6-v2)
            const embRes = await fetch(
              "https://router.huggingface.co/hf-inference/models/sentence-transformers/all-MiniLM-L6-v2/pipeline/feature-extraction",
              {
                headers: {
                  "Authorization": `Bearer ${hfKey}`,
                  "Content-Type": "application/json",
                  "x-wait-for-model": "true"
                },
                method: "POST",
                body: JSON.stringify({ inputs: [lastUserMessage] }),
              }
            );

            if (!embRes.ok) {
              const errText = await embRes.text();
              let isWarmup = false;
              try {
                const parsed = JSON.parse(errText);
                if (parsed.error?.includes("loading")) {
                  isWarmup = true;
                }
              } catch (_) {}

              if (isWarmup) {
                return NextResponse.json(
                  { error: "AI search model is currently loading/warming up. Please try sending your message again in 20 seconds." },
                  { status: 503 }
                );
              }
              throw new Error(`Hugging Face Query Embedding failed: ${errText}`);
            }

            const embData = await embRes.json();
            const vector: number[] = embData[0];

              if (Array.isArray(vector) && vector.length > 0) {
                const mongoose = require("mongoose");
                const pipeline = [
                  {
                    "$vectorSearch": {
                      "index": "vector_index",
                      "path": "embedding",
                      "queryVector": vector,
                      "numCandidates": 150,  // Cast wider net for better recall
                      "limit": 15,           // Get top 15 candidates before filtering
                      "filter": {
                        "noteId": { "$eq": mongoose.Types.ObjectId.createFromHexString(contextNoteId) }
                      }
                    }
                  },
                  {
                    "$project": {
                      "_id": 0,
                      "text": 1,
                      "chunkIndex": 1,
                      "score": { "$meta": "vectorSearchScore" }
                    }
                  }
                ];

                const relevantChunks = await NoteEmbedding.aggregate(pipeline);

                if (relevantChunks && relevantChunks.length > 0) {
                  // Filter by minimum similarity score (0.45 is more lenient for recall)
                  const SCORE_THRESHOLD = 0.45;
                  const filtered = relevantChunks.filter((c: any) => c.score >= SCORE_THRESHOLD);

                  // Use filtered chunks if we have any, otherwise fall back to top 4 (only if somewhat relevant > 0.3)
                  const toUse = filtered.length > 0 
                      ? filtered 
                      : relevantChunks.filter((c: any) => c.score > 0.30).slice(0, 4);

                  // Sort by chunk order (chunkIndex) for natural reading order
                  toUse.sort((a: any, b: any) => a.chunkIndex - b.chunkIndex);

                  // Deduplicate: remove chunks whose text is 80%+ similar to an already-added chunk
                  const deduped: string[] = [];
                  for (const chunk of toUse) {
                    const isDuplicate = deduped.some(existing => {
                      const shorter = Math.min(existing.length, chunk.text.length);
                      const overlap = existing.includes(chunk.text.slice(0, Math.floor(shorter * 0.8)));
                      return overlap;
                    });
                    if (!isDuplicate) deduped.push(chunk.text);
                  }

                  ragContextText = deduped.join("\n\n---\n\n");
                }
              }
            }
      } catch (err) {
        console.error("Vector search error:", err);
      }
    }

    // Attach RAG Context to System Prompt
    const systemInstruction = modelConfig?.systemPrompt || "You are a helpful AI assistant.";
    const finalSystemPrompt = ragContextText
      ? `${systemInstruction}

=== CONTEXT FROM USER'S NOTE ===
${ragContextText}
=== END OF NOTE CONTEXT ===

Instructions for using the context above:
1. Base your answer primarily on the NOTE CONTEXT provided. Synthesize the information logically.
2. If the answer is clearly found in the context, answer directly and naturally. Include specific details from the context.
3. If the question is only partially answered by the context, answer what you can from the context and clearly state what additional information falls outside the note.
4. If the question is completely unrelated to the note context, briefly state "This doesn't appear to be covered in your note." and then answer based on your general knowledge.
5. Format your response beautifully using markdown (e.g., bullet points, bold text) for easy reading.`
      : systemInstruction;

    // ── Route to the correct provider ──────────────────────────────────
    if (!modelConfig) {
      // Model is not integrated yet (e.g. OrbitX AI, future models)
      const modelLabel = requestedModel ?? "selected model";
      return NextResponse.json({
        message: `**${modelLabel}** is not yet integrated. Please switch to **Gemini 3.1 Pro** to chat right now — more models are coming soon! 🚀`,
      });
    }

    // Helper to stream any AsyncGenerator to the client
    const streamResponse = (streamGenerator: AsyncGenerator<{ content: string; thinking?: string }, void, unknown>) => {
      const stream = new ReadableStream({
        async start(controller) {
          const encoder = new TextEncoder();
          let fullAssistantResponse = "";
          try {
            for await (const chunk of streamGenerator) {
              if (chunk.content) fullAssistantResponse += chunk.content;
              // Send the delta formatted as SSE
              controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
            }
            
            // Persist assistant message
            if (sessionId) {
              await sql`
                INSERT INTO ai_chat_messages (session_id, role, content) 
                VALUES (${sessionId}, 'assistant', ${fullAssistantResponse})
              `;
              await sql`
                UPDATE ai_chat_sessions SET updated_at = CURRENT_TIMESTAMP WHERE id = ${sessionId}
              `;
            }
            
          } catch (err: any) {
            console.error("Streaming error:", err);
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: err.message })}\n\n`));
          } finally {
            controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
            controller.close();
          }
        }
      });

      return new Response(stream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive"
        }
      });
    };

    // ── Gemini provider ────────────────────────────────────────────────
    if (modelConfig.provider === "gemini") {
      const genAI = getGeminiClient();
      const model = genAI.getGenerativeModel({
        model: modelConfig.apiModel,
        generationConfig: GEMINI_CONFIG.generationConfig,
      });

      const chat = model.startChat({
        history: messages
          .filter((m: any) => m.id !== "welcome" && m.role !== "system")
          .slice(0, -1) // All except the very last user message
          .map((m: any) => ({
            role: m.role === "user" ? "user" : "model",
            parts: [{ text: m.content }],
          })),
        systemInstruction: finalSystemPrompt ? { parts: [{ text: finalSystemPrompt }], role: "system" } : undefined,
      });

      const streamResult = await chat.sendMessageStream(lastUserMessage);

      // Convert Google's async iterator into our standard AsyncGenerator format
      const streamGenerator = async function* () {
        for await (const chunk of streamResult.stream) {
          const chunkText = chunk.text();
          if (chunkText) {
            yield { content: chunkText, thinking: undefined };
          }
        }
      }();

      return streamResponse(streamGenerator);
    }

    // ── Sarvam AI provider ─────────────────────────────────────────────
    if (modelConfig.provider === "sarvam") {
      const sarvamMessages: { role: "system" | "user" | "assistant"; content: string }[] = [
        ...(finalSystemPrompt
          ? [{ role: "system" as const, content: finalSystemPrompt }]
          : []),
        ...messages
          .filter((m: any) => m.id !== "welcome")
          .map((m: any) => ({
            role: m.role === "user" ? ("user" as const) : ("assistant" as const),
            content: m.content as string,
          })),
      ];
      const streamGenerator = await sarvamChat({
        messages: sarvamMessages,
        temperature: modelConfig.temperature ?? 0.2,
        top_p: 1.0,
        max_tokens: modelConfig.max_tokens ?? 2048,
        wiki_grounding: modelConfig.wiki_grounding ?? false,
      });
      return streamResponse(streamGenerator);
    }

    // ── OpenRouter provider ────────────────────────────────────────────
    if (modelConfig.provider === "openrouter") {
      const openRouterMessages: { role: "system" | "user" | "assistant"; content: string }[] = [
        ...(finalSystemPrompt
          ? [{ role: "system" as const, content: finalSystemPrompt }]
          : []),
        ...messages
          .filter((m: any) => m.id !== "welcome")
          .map((m: any) => ({
            role: m.role === "user" ? ("user" as const) : ("assistant" as const),
            content: m.content as string,
          })),
      ];
      const keyEnv = modelConfig.apiKeyEnv ?? "OPENROUTER_API_KEY_NVIDIA";
      const apiKey = getOpenRouterKey(keyEnv);
      const streamGenerator = await openRouterChat({
        model: modelConfig.apiModel,
        messages: openRouterMessages,
        temperature: modelConfig.temperature ?? 0.7,
        max_tokens: modelConfig.max_tokens ?? 2048,
        apiKey,
        reasoning: modelConfig.reasoning,
      });
      return streamResponse(streamGenerator);
    }

    // ── GitHub Models provider ─────────────────────────────────────────
    if (modelConfig.provider === "github") {
      const githubMessages: { role: "system" | "user" | "assistant"; content: string }[] = [
        ...(finalSystemPrompt
          ? [{ role: "system" as const, content: finalSystemPrompt }]
          : []),
        ...messages
          .filter((m: any) => m.id !== "welcome")
          .map((m: any) => ({
            role: m.role === "user" ? ("user" as const) : ("assistant" as const),
            content: m.content as string,
          })),
      ];
      const apiKey = getGithubModelKey(modelConfig.apiKeyEnv ?? "GITHUB_GROK_TOKEN");
      const streamGenerator = await githubModelChat({
        model: modelConfig.apiModel,
        messages: githubMessages,
        temperature: modelConfig.temperature ?? 0.3,
        max_tokens: modelConfig.max_tokens ?? 2048,
        apiKey,
      });

      return streamResponse(streamGenerator);
    }

    // ── Groq provider ──────────────────────────────────────────────────
    if (modelConfig.provider === "groq") {
      const groqMessages: { role: "system" | "user" | "assistant"; content: string }[] = [
        ...(finalSystemPrompt
          ? [{ role: "system" as const, content: finalSystemPrompt }]
          : []),
        ...messages
          .filter((m: any) => m.id !== "welcome")
          .map((m: any) => ({
            role: m.role === "user" ? ("user" as const) : ("assistant" as const),
            content: m.content as string,
          })),
      ];
      const apiKey = getGroqKey(modelConfig.apiKeyEnv ?? "GROQ_API");
      const streamGenerator = await groqChat({
        model: modelConfig.apiModel,
        messages: groqMessages,
        temperature: modelConfig.temperature ?? 1,
        max_tokens: modelConfig.max_tokens ?? 1024,
        apiKey,
      });

      return streamResponse(streamGenerator);
    }

    // ── Nvidia provider ────────────────────────────────────────────────
    if (modelConfig.provider === "nvidia") {
      const nvidiaMessages: { role: "system" | "user" | "assistant"; content: string }[] = [
        ...(finalSystemPrompt
          ? [{ role: "system" as const, content: finalSystemPrompt }]
          : []),
        ...messages
          .filter((m: any) => m.id !== "welcome")
          .map((m: any) => ({
            role: m.role === "user" ? ("user" as const) : ("assistant" as const),
            content: m.content as string,
          })),
      ];
      const apiKey = getNvidiaKey(modelConfig.apiKeyEnv ?? "NVIDIA_Z_Ai_API_KEY");
      const streamGenerator = await nvidiaChat({
        model: modelConfig.apiModel,
        messages: nvidiaMessages,
        temperature: modelConfig.temperature ?? 1,
        max_tokens: modelConfig.max_tokens ?? 16384,
        apiKey,
      });

      return streamResponse(streamGenerator);
    }

    // ── Fallback ───────────────────────────────────────────────────────
    return NextResponse.json({
      message: `**${modelConfig.displayName}** support is coming soon. Stay tuned! 🛸`,
    });

  } catch (error: any) {
    const errorMsg: string = error?.message ?? "Unknown error";
    console.error("[AI Chat] Error:", errorMsg, error);

    // Quota / rate limit
    if (isQuotaError(error) || errorMsg.includes("quota") || errorMsg.includes("429")) {
      return NextResponse.json(
        { error: "AI quota exhausted. Please try again in a few minutes." },
        { status: 429 }
      );
    }

    // API key / auth issues
    if (errorMsg.includes("API key") || errorMsg.includes("api-subscription-key") ||
      errorMsg.includes("403") || errorMsg.includes("invalid_api_key")) {
      return NextResponse.json(
        { error: "API authentication failed. Please check the API key configuration." },
        { status: 500 }
      );
    }

    // Surface the real error message so it's visible in the UI for debugging
    return NextResponse.json(
      { error: `AI Error: ${errorMsg}` },
      { status: 500 }
    );
  }
}
