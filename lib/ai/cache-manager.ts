import { GoogleAIFileManager, FileState, GoogleAICacheManager } from "@google/generative-ai/server";
import { GoogleGenerativeAI, CachedContent, GenerateContentResult } from "@google/generative-ai";
import { createHash } from "crypto";
import { writeFile, unlink } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";

// 100,000 characters ~ 25k tokens (approx 4 chars/token)
// We only cache if content is larger than this to justify the latency of upload
// public preview limit is often higher (32k), but 100k chars is a safe bet for "this is huge"
const CACHE_THRESHOLD = 50000; // Lowered to 50k for testing (approx 12k tokens)
const TTL_SECONDS = 3600; // 1 hour

const apiKey = process.env.GEMINI_API_KEY;

export class CacheManager {
    private fileManager: GoogleAIFileManager;
    private cacheManager: GoogleAICacheManager;
    private genAI: GoogleGenerativeAI;

    // Simple in-memory map to track active caches by hash
    // In a real serverless env (Next.js Vercel), this might reset, 
    // but Gemini's "list" API can simulate persistence if needed.
    // For now, we accept that a new lambda = new cache check (via API).
    private activeCaches: Map<string, CachedContent> = new Map();

    constructor() {
        if (!apiKey) throw new Error("GEMINI_API_KEY is missing");
        this.fileManager = new GoogleAIFileManager(apiKey);
        this.cacheManager = new GoogleAICacheManager(apiKey);
        this.genAI = new GoogleGenerativeAI(apiKey);
    }

    /**
     * Compute SHA-256 hash of the content to serve as a cache key.
     */
    private computeHash(content: string): string {
        return createHash('sha256').update(content).digest('hex');
    }

    /**
     * Get or Create a cached session for the given context.
     * Returns null if content is too short or if caching fails (Fallback).
     */
    async getCache(content: string): Promise<string | null> {
        // 1. Threshold Check
        if (content.length < CACHE_THRESHOLD) {
            return null; // Too small, just use standard generation
        }

        const hash = this.computeHash(content);

        // 2. Memory Check (Fastest)
        if (this.activeCaches.has(hash)) {
            const cached = this.activeCaches.get(hash);
            // Verify it hasn't expired locally? 
            if (cached && new Date(cached.expireTime) > new Date()) {
                console.log(`[CacheManager] Reusing active cache: ${cached.name}`);
                return cached.name || null;
            } else {
                this.activeCaches.delete(hash);
            }
        }

        console.log(`[CacheManager] Large context detected (${content.length} chars). Attempting to cache...`);

        let tempFilePath: string | null = null;

        try {
            // 3. Create Temporary File (Gemini File API requires file path)
            tempFilePath = join(tmpdir(), `gemini_cache_${hash}.txt`);
            await writeFile(tempFilePath, content);

            // 4. Upload File
            const uploadResult = await this.fileManager.uploadFile(tempFilePath, {
                mimeType: "text/plain",
                displayName: `Context_Cache_${hash.substring(0, 8)}`,
            });

            console.log(`[CacheManager] File uploaded: ${uploadResult.file.uri}`);

            // 5. Wait for Processing (Text is usually instant, but good practice)
            let file = await this.fileManager.getFile(uploadResult.file.name);
            while (file.state === FileState.PROCESSING) {
                await new Promise((resolve) => setTimeout(resolve, 500));
                file = await this.fileManager.getFile(uploadResult.file.name);
            }

            if (file.state === FileState.FAILED) {
                throw new Error("File processing failed");
            }

            // 6. Create Cache
            // We use the model that supports caching
            const modelName = "models/gemini-1.5-flash-001"; // Or generic 'models/gemini-1.5-flash'

            const cacheResult = await this.cacheManager.create({
                model: modelName,
                displayName: `cache_${hash.substring(0, 8)}`,
                contents: [
                    {
                        role: 'user',
                        parts: [{
                            fileData: {
                                mimeType: file.mimeType,
                                fileUri: file.uri
                            }
                        }]
                    }
                ],
                ttlSeconds: TTL_SECONDS,
            });

            console.log(`[CacheManager] Cache created: ${cacheResult.name}`);

            // Store in memory
            this.activeCaches.set(hash, cacheResult);

            return cacheResult.name;

        } catch (error) {
            console.warn("[CacheManager] Failed to create cache. Falling back to standard.", error);
            // Cleanup temp file on error too if needed, but finally handles it.
            return null;
        } finally {
            // Cleanup temp file
            if (tempFilePath) {
                try { await unlink(tempFilePath); } catch (e) { }
            }
        }
    }

    /**
     * Generate content using the cache if available, or standard method otherwise.
     */
    async generateWithCache(prompt: string, context: string): Promise<GenerateContentResult> {
        // 1. Try to get cache
        const cacheName = await this.getCache(context);

        if (cacheName) {
            console.log(`[CacheManager] Generating with CACHE: ${cacheName}`);
            // Use model with cache by passing it in request or config?
            // According to latest types, we pass it in getGenerativeModel or request.
            // Let's try passing in generateContent ONLY, as getGenerativeModel might not support it in this version?
            // Or try passing `cachedContent` in ModelParams if allowed.
            // Let's try:
            const model = this.genAI.getGenerativeModel({
                model: "models/gemini-1.5-flash-001",
                // cachedContent: cacheName // If this fails, we will fallback to request-time
            });

            // When using cache, we only send the prompt, context is in cache
            return model.generateContent({
                contents: [
                    { role: 'user', parts: [{ text: prompt }] }
                ],
                cachedContent: cacheName
            });
        } else {
            console.log(`[CacheManager] Generating with STANDARD method`);
            // Standard generation
            const model = this.genAI.getGenerativeModel({ model: "models/gemini-1.5-flash" });
            return model.generateContent(`${prompt}\n\nContext:\n${context}`);
        }
    }
}
