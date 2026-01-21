import { NextRequest, NextResponse } from "next/server";
import { getGeminiClient, GEMINI_CONFIG, isQuotaError } from "@/lib/gemini-config";

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

    // 3. Continue with AI generation
    const genAI = getGeminiClient();

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ||
      req.headers.get("x-real-ip") ||
      "unknown";

    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please wait a moment." },
        { status: 429 }
      );
    }

    const { messages } = await req.json();
    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const lastUserMessage = messages[messages.length - 1]?.content;
    if (!lastUserMessage || typeof lastUserMessage !== 'string') {
      return NextResponse.json({ error: "Invalid message content" }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({
      model: GEMINI_CONFIG.model,
      generationConfig: GEMINI_CONFIG.generationConfig,
    });

    const response = await generateWithRetry(model, lastUserMessage);

    return NextResponse.json({ message: response });

  } catch (error: any) {
    console.error("Gemini API Error:", {
      message: error.message,
      status: error.status,
      details: error.details || error.toString()
    });

    // Handle specific error types
    if (isQuotaError(error)) {
      return NextResponse.json(
        { error: "AI quota exhausted. Please try again in a few minutes." },
        { status: 429 }
      );
    }

    if (error.message?.includes("API key")) {
      return NextResponse.json(
        { error: "API configuration error. Please contact support." },
        { status: 500 }
      );
    }

    // Generic error
    return NextResponse.json(
      { error: "Failed to generate response. Please try again." },
      { status: 500 }
    );
  }
}
