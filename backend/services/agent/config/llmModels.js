
import { ChatGroq } from "@langchain/groq";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatOpenRouter } from "@langchain/openrouter";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config({
    quiet: true,
    path: path.resolve(
        path.dirname(fileURLToPath(import.meta.url)),
        "../.env"
    ),
});

// ============================================
// GROQ 20B
// Free tier, routing & classification
// ============================================
const groqFast = new ChatGroq({
    model: "openai/gpt-oss-20b",
    apiKey: process.env.GROQ_API_KEY,
    temperature: 0.2,
    maxTokens: 3500,
});

// ============================================
// GROQ 120B
// Starter & Pro general AI
// openai/gpt-oss-120b
// ============================================
const groqVersatile = new ChatGroq({
    model: "openai/gpt-oss-20b",
    apiKey: process.env.GROQ_API_KEY,
    temperature: 0.3,
    maxTokens: 4096,
});

// ============================================
// GEMINI 2.5 FLASH
// Pro multimodal / resume / PDF
// ============================================
const geminiFlash = new ChatGoogleGenerativeAI({
    model: "gemini-3.6-flash",
    apiKey: process.env.GOOGLE_API_KEY,
    temperature: 0.2,
    maxOutputTokens: 4096,
});

// ============================================
// DEEPSEEK
// Starter & Pro coding
// ============================================
const deepseekCoder = new ChatOpenRouter({
    model: "deepseek/deepseek-chat",
    apiKey: process.env.OPENROUTER_API_KEY,
    temperature: 0.15,
    maxTokens: 6000,
});

/**
 * Returns the best LLM based on:
 * - Agent type
 * - User subscription plan
 *
 * Plans:
 * free     → Free
 * starter  → ₹299/month
 * pro      → ₹499/month
 */
export const getModel = (agent, plan = "free") => {
    const userPlan = String(plan || "free").toLowerCase();

    // ============================================
    // ROUTER / INTENT
    // Always use fast model
    // ============================================
    if (agent === "router" || agent === "intent") {
        return groqFast;
    }

    // ============================================
    // CODING
    // Always use DeepSeek for coding
    // ============================================
    if (agent === "coding") {
        return deepseekCoder;
    }

    // ============================================
    // PDF RAG / IMAGE ANALYSIS
    // Gemini handles multimodal tasks
    // ============================================
    if (agent === "imageAnalyzer" || agent === "pdfRag") {
        return geminiFlash;
    }

    // ============================================
    // PRO — ₹499/month
    // ============================================
    if (userPlan === "pro") {
        switch (agent) {
            // Best coding model
            case "coding":
                return deepseekCoder;

            // Premium document/resume generation
            case "resume":
            case "resumeBuilder":
            case "pdf":
                return geminiFlash;

            // Strong general-purpose model
            case "chat":
            case "ppt":
            case "search":
            default:
                return groqVersatile;
        }
    }

    // ============================================
    // STARTER — ₹299/month
    // ============================================
    if (userPlan === "starter") {
        switch (agent) {
            // Better coding model
            case "coding":
                return deepseekCoder;

            // Strong general-purpose AI
            case "chat":
            case "resume":
            case "resumeBuilder":
            case "pdf":
            case "ppt":
            case "search":
                return groqVersatile;

            default:
                return groqFast;
        }
    }

    // ============================================
    // FREE
    // ============================================
    switch (agent) {
        case "coding":
            return deepseekCoder;

        case "chat":
        case "resume":
        case "resumeBuilder":
        case "pdf":
        case "ppt":
        case "search":
        default:
            return groqFast;
    }
};

