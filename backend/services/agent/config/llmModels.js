import { ChatGroq } from "@langchain/groq";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
// import { ChatOpenAI } from "@langchain/openai";

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

const MAX_RATE_LIMIT_RETRIES = 1;
const DEFAULT_RETRY_DELAY_MS = 8000;
const MAX_RETRY_DELAY_MS = 15000;

function isProviderRateLimit(error) {
    return error?.status === 429 ||
        error?.response?.status === 429 ||
        error?.code === "rate_limit_exceeded" ||
        /rate limit|rate_limit_exceeded|tokens per minute/i.test(
            error?.message || ""
        );
}

function getRetryDelay(error) {
    const retryAfter =
        error?.response?.headers?.["retry-after"] ||
        error?.headers?.["retry-after"];

    if (retryAfter && Number.isFinite(Number(retryAfter))) {
        return Math.min(
            Math.ceil(Number(retryAfter) * 1000),
            MAX_RETRY_DELAY_MS
        );
    }

    const match = String(error?.message || "")
        .match(/try again in\s+([\d.]+)s/i);

    return match ? Math.min( Math.ceil(Number(match[1]) * 1000) + 500, MAX_RETRY_DELAY_MS ) : DEFAULT_RETRY_DELAY_MS;
}

function withRateLimitRetry(model) {
    const invoke = model.invoke.bind(model);

    model.invoke = async (...args) => {
        for (let attempt = 0; attempt <= MAX_RATE_LIMIT_RETRIES; attempt += 1) {
            try {
                return await invoke(...args);
            } catch (error) {
                if (!isProviderRateLimit(error)) {
                    throw error;
                }

                if (attempt === MAX_RATE_LIMIT_RETRIES) {
                    const friendlyError = new Error(
                        "The AI provider is temporarily busy. Please try again in a few seconds."
                    );
                    friendlyError.code = "AI_PROVIDER_RATE_LIMIT";
                    throw friendlyError;
                }

                await new Promise((resolve) => {
                    setTimeout(resolve, getRetryDelay(error));
                });
            }
        }
    };

    return model;
}

// ============================================
// FREE PLAN
// GROQ 20B
// ============================================

const groqFast = withRateLimitRetry(new ChatGroq({
    model: "openai/gpt-oss-20b",
    apiKey: process.env.GROQ_API_KEY,
    temperature: 0.2,
    maxTokens: 3500,
}));

// ============================================
// FREE / GENERAL
// GROQ 120B
// ============================================

const groqVersatile = withRateLimitRetry(new ChatGroq({
    model: "openai/gpt-oss-120b",
    apiKey: process.env.GROQ_API_KEY,
    temperature: 0.3,
    maxTokens: 30096,
}));

// ============================================
// FREE
// GEMINI
// ============================================

const geminiFlash = withRateLimitRetry(new ChatGoogleGenerativeAI({
    model: "gemini-3.8-flash",
    apiKey: process.env.GOOGLE_API_KEY,
    temperature: 0.2,
    maxOutputTokens: 4096,
}));

// ==================================================
// PAID MODELS
// ==================================================
// Razorpay production enable hone ke baad uncomment.
//
// STARTER ₹299
// GPT-5.6 Luna
//
// PRO ₹499
// GPT-5.6 Terra
//
// ==================================================

// import { ChatOpenAI } from "@langchain/openai";

// const starterModel = new ChatOpenAI({
//     model: "gpt-5.6-luna",
//     apiKey: process.env.OPENAI_API_KEY,
//     temperature: 0.2,
//     maxTokens: 6000,
// });

// const proModel = new ChatOpenAI({
//     model: "gpt-5.6-terra",
//     apiKey: process.env.OPENAI_API_KEY,
//     temperature: 0.2,
//     maxTokens: 8000,
// });

// ============================================
// MODEL ROUTER
// ============================================

export const getModel = (
    agent,
    plan = "free"
) => {
    const userPlan = String(plan || "free").toLowerCase();

    // ============================================
    // ROUTER / INTENT
    // ============================================

    if (agent === "router" || agent === "intent") {
        return groqFast;
    }

    // ============================================
    // CODING
    // ============================================

    if (agent === "coding") {
        return groqVersatile;
    }

    // ============================================
    // IMAGE / PDF
    // ============================================

    if (agent === "imageAnalyzer" || agent === "pdfRag") {
        return geminiFlash;
    }

    // ============================================
    // PRO ₹499
    // ============================================

    if (userPlan === "pro") {

        // Production mein:
        // return proModel;

        switch (agent) {
            case "coding":
                return groqVersatile;

            case "resume":
            case "resumeBuilder":
            case "pdf":
                return geminiFlash;

            case "chat":
            case "ppt":
            case "search":
            default:
                return groqVersatile;
        }
    }

    // ============================================
    // STARTER ₹299
    // ============================================

    if (userPlan === "starter") {

        // Production mein:
        // return starterModel;

        switch (agent) {
            case "coding":
                return groqVersatile;

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
            return groqVersatile;

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
