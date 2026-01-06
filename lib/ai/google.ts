import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

if (!apiKey) {
  console.warn("Missing GOOGLE_GENERATIVE_AI_API_KEY environment variable.");
}

const genAI = new GoogleGenerativeAI(apiKey || "");

// We use the experimental flash model for speed and cost efficiency
// We can switch this to 'gemini-pro' or 'gemini-1.5-pro' if needed
export const model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash-exp",
  generationConfig: {
    temperature: 0.7,
    topK: 40,
    topP: 0.95,
    maxOutputTokens: 8192,
  }
});
