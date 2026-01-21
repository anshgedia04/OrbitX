import { GoogleGenerativeAI } from "@google/generative-ai";

export const GEMINI_CONFIG = {
  model: "gemini-2.5-flash", // Updated to latest available model
  generationConfig: {
    temperature: 0.9,
    maxOutputTokens: 8192, // Increased for complete responses
    topP: 0.95,
    topK: 40,
  },
  safetySettings: [
    {
      category: "HARM_CATEGORY_HARASSMENT",
      threshold: "BLOCK_MEDIUM_AND_ABOVE",
    },
    {
      category: "HARM_CATEGORY_HATE_SPEECH",
      threshold: "BLOCK_MEDIUM_AND_ABOVE",
    },
  ],
};

export function getGeminiClient() {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  
  if (!apiKey) {
    throw new Error("GOOGLE_AI_API_KEY is not configured");
  }
  
  return new GoogleGenerativeAI(apiKey);
}

export function isQuotaError(error: any): boolean {
  const message = error.message?.toLowerCase() || "";
  return (
    message.includes("quota") ||
    message.includes("resource_exhausted") ||
    message.includes("rate limit") ||
    error.status === 429
  );
}
