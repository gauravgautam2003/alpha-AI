import { ChatGroq } from "@langchain/groq";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatOpenRouter } from "@langchain/openrouter";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config({
    quiet: true,
    path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../.env")
});

// Fast Groq instance (Free tier & Routing / Classification)
const groqFast = new ChatGroq({
    model: "openai/gpt-oss-20b",
    apiKey: process.env.GROQ_API_KEY,
    temperature: 0.2,
    maxTokens: 3500,
});

// Powerful Groq instance (Starter & Pro tiers - general reasoning, documents)
const groqVersatile = new ChatGroq({
    model: "openai/gpt-oss-120b",
    apiKey: process.env.GROQ_API_KEY,
    temperature: 0.3,
    maxTokens: 4096,
});

// Google Gemini 2.5 Flash (Multimodal vision, PDF RAG, high-speed structured generation)
const geminiFlash = new ChatGoogleGenerativeAI({
    model: "gemini-2.5-flash",
    apiKey: process.env.GOOGLE_API_KEY,
    temperature: 0.2,
    maxOutputTokens: 4096,
});

// OpenRouter DeepSeek V3 (State of the art coding model for Starter & Pro tiers)
const deepseekCoder = new ChatOpenRouter({
    model: "deepseek/deepseek-chat",
    apiKey: process.env.OPENROUTER_API_KEY,
    temperature: 0.15,
    maxTokens: 6000,
});

/**
 * Returns the best-suited LLM instance based on agent type and user subscription tier.
 * @param {string} agent - Agent identifier (e.g., chat, coding, resume, pdfRag, etc.)
 * @param {string} plan - User subscription tier: "free", "starter", or "pro"
 */
export const getModel = async (agent, plan = "free") => {
    const userPlan = String(plan || "free").toLowerCase();

    // Classification & Routing always uses ultra-fast Groq
    if (agent === "router" || agent === "intent") {
        return groqFast;
    }

    // Vision & Multimodal analysis uses Gemini 2.0 Flash
    if (agent === "imageAnalyzer" || agent === "pdfRag") {
        return geminiFlash;
    }

    // Tier-based logic
    if (userPlan === "pro") {
        switch (agent) {
            case "coding":
                return deepseekCoder;
            case "resume":
            case "resumeBuilder":
                return geminiFlash;
            case "chat":
            case "pdf":
            case "ppt":
            case "search":
            default:
                return groqVersatile;
        }
    } else if (userPlan === "starter") {
        switch (agent) {
            case "coding":
                return deepseekCoder;
            case "resume":
            case "resumeBuilder":
            case "pdf":
            case "ppt":
            case "chat":
            case "search":
                return groqVersatile;
            default:
                return groqVersatile;
        }
    } else {
        // Free tier: optimized for speed & low marginal cost
        switch (agent) {
            case "coding":
                return groqVersatile;
            case "resume":
            case "resumeBuilder":
            case "pdf":
            case "ppt":
            case "chat":
            case "search":
            default:
                return groqFast;
        }
    }
};
