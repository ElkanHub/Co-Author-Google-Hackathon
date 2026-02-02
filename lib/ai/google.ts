import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.warn("Missing GEMINI_API_KEY environment variable.");
}

const genAI = new GoogleGenerativeAI(apiKey || "");

// We use the experimental flash model for speed and cost efficiency
// We can switch this to 'gemini-pro' or 'gemini-1.5-pro' if needed
export const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash", // Changed to match cache manager assumption, or we can keep experimental
  generationConfig: {
    temperature: 0.7,
    topK: 40,
    topP: 0.95,
    maxOutputTokens: 8192,
  }
});

import { CacheManager } from "./cache-manager";
export const cacheManager = new CacheManager();

