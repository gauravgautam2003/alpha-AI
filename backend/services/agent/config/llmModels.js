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

// ============================================
// FREE PLAN
// GROQ 20B
// ============================================

const groqFast = new ChatGroq({
    model: "openai/gpt-oss-20b",
    apiKey: process.env.GROQ_API_KEY,
    temperature: 0.2,
    maxTokens: 3500,
});

// ============================================
// FREE / GENERAL
// GROQ 120B
// ============================================

const groqVersatile = new ChatGroq({
    model: "openai/gpt-oss-120b",
    apiKey: process.env.GROQ_API_KEY,
    temperature: 0.3,
    maxTokens: 4096,
});

// ============================================
// FREE
// GEMINI
// ============================================

const geminiFlash = new ChatGoogleGenerativeAI({
    model: "gemini-3.8-flash",
    apiKey: process.env.GOOGLE_API_KEY,
    temperature: 0.2,
    maxOutputTokens: 4096,
});

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
    const userPlan =
        String(plan || "free").toLowerCase();

    // ============================================
    // ROUTER / INTENT
    // ============================================

    if (
        agent === "router" ||
        agent === "intent"
    ) {
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

    if (
        agent === "imageAnalyzer" ||
        agent === "pdfRag"
    ) {
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