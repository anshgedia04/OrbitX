import { NextRequest, NextResponse } from "next/server";
import { getGeminiClient, GEMINI_CONFIG, isQuotaError } from "@/lib/gemini-config";
import { sarvamChat } from "@/lib/sarvam-config";
import { openRouterChat, getOpenRouterKey } from "@/lib/openrouter-config";

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

    if (!user || user.subscriptionStatus !== 'pro') {
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
        apiModel: "sarvam-m",
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

      // ── OpenRouter: Arcee AI ──────────────────────────────────────
      "arcee-ai": {
        provider: "openrouter",
        apiModel: "arcee-ai/trinity-large-preview:free",
        displayName: "Arcee AI",
        systemPrompt: "my model name is Arcee-AI-trinity-large-preview your ai assistant",
        temperature: 0.7,
        max_tokens: 2048,
        apiKeyEnv: "OPENROUTER_API_KEY_ARCEE",   // ← dedicated key
      },
      // "meta-llama": {
      //   provider:     "openrouter",
      //   apiModel:     "meta-llama/llama-3.3-70b-instruct:free",
      //   displayName:  "Meta Llama 3.3",
      //   systemPrompt: "You are a helpful assistant.",
      //   temperature:  0.7,
      //   max_tokens:   2048,
      // },

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

      // ── OpenRouter: Step 3.5 Flash ────────────────────────────────────
      "step-3.5-flash": {
        provider: "openrouter",
        apiModel: "stepfun/step-3.5-flash:free",
        displayName: "Step 3.5 Flash",
        systemPrompt: "You are Step 3.5 Flash, an AI assistant specializing in technology and finance topics.",
        temperature: 0.7,
        max_tokens: 2048,
        apiKeyEnv: "OPENROUTER_API_KEY_STEPFUN",
      },
    };

    const { messages, model: requestedModel } = await req.json();
    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const lastUserMessage = messages[messages.length - 1]?.content;
    if (!lastUserMessage || typeof lastUserMessage !== "string") {
      return NextResponse.json({ error: "Invalid message content" }, { status: 400 });
    }

    const modelConfig = requestedModel ? MODEL_REGISTRY[requestedModel] : null;

    // ── Route to the correct provider ──────────────────────────────────
    if (!modelConfig) {
      // Model is not integrated yet (e.g. OrbitX AI, future models)
      const modelLabel = requestedModel ?? "selected model";
      return NextResponse.json({
        message: `**${modelLabel}** is not yet integrated. Please switch to **Gemini 3.1 Pro** to chat right now — more models are coming soon! 🚀`,
      });
    }

    // ── Gemini provider ────────────────────────────────────────────────
    if (modelConfig.provider === "gemini") {
      const genAI = getGeminiClient();
      const model = genAI.getGenerativeModel({
        model: modelConfig.apiModel,
        generationConfig: GEMINI_CONFIG.generationConfig,
      });
      const response = await generateWithRetry(model, lastUserMessage);
      return NextResponse.json({ message: response });
    }

    // ── Sarvam AI provider ─────────────────────────────────────────────
    // Config (systemPrompt, temperature, wiki_grounding) comes from MODEL_REGISTRY.
    if (modelConfig.provider === "sarvam") {
      const sarvamMessages: { role: "system" | "user" | "assistant"; content: string }[] = [
        ...(modelConfig.systemPrompt
          ? [{ role: "system" as const, content: modelConfig.systemPrompt }]
          : []),
        ...messages
          .filter((m: any) => m.id !== "welcome")
          .map((m: any) => ({
            role: m.role === "user" ? ("user" as const) : ("assistant" as const),
            content: m.content as string,
          })),
      ];
      const response = await sarvamChat({
        messages: sarvamMessages,
        temperature: modelConfig.temperature ?? 0.2,
        top_p: 1.0,
        max_tokens: modelConfig.max_tokens ?? 2048,
        wiki_grounding: modelConfig.wiki_grounding ?? false,
      });
      return NextResponse.json({ message: response });
    }

    // ── OpenRouter provider ────────────────────────────────────────────
    // Generic handler — each model's config (systemPrompt, temperature, etc.)
    // is read from MODEL_REGISTRY so no model can ever affect another.
    if (modelConfig.provider === "openrouter") {
      const openRouterMessages: { role: "system" | "user" | "assistant"; content: string }[] = [
        ...(modelConfig.systemPrompt
          ? [{ role: "system" as const, content: modelConfig.systemPrompt }]
          : []),
        ...messages
          .filter((m: any) => m.id !== "welcome")
          .map((m: any) => ({
            role: m.role === "user" ? ("user" as const) : ("assistant" as const),
            content: m.content as string,
          })),
      ];
      // Each model has its own dedicated API key stored in its registry entry
      const keyEnv = modelConfig.apiKeyEnv ?? "OPENROUTER_API_KEY_NVIDIA";
      const apiKey = getOpenRouterKey(keyEnv);

      const response = await openRouterChat({
        model: modelConfig.apiModel,
        messages: openRouterMessages,
        temperature: modelConfig.temperature ?? 0.7,
        max_tokens: modelConfig.max_tokens ?? 2048,
        apiKey,
      });
      return NextResponse.json({ message: response });
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
