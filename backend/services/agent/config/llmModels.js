import { ChatGroq } from "@langchain/groq"
import { ChatGoogleGenerativeAI } from "@langchain/google-genai"
import { ChatOpenRouter } from "@langchain/openrouter";
import dotenv from "dotenv"
import path from "path"
import { fileURLToPath } from "url"

// This module is imported while the graph is being created, before index.js
// executes its dotenv setup. Load variables here so both LLM clients receive
// their API keys during construction.
dotenv.config({
    quiet: true,
    path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../.env")
})

const groq = new ChatGroq({
    model: "openai/gpt-oss-120b",
    apiKey: process.env.GROQ_API_KEY,
    temperature: 0.35,
    maxTokens: 3500,
})


const gemini = new ChatGoogleGenerativeAI({
    model: "gemini-3.6-flash",
    apiKey: process.env.GOOGLE_API_KEY,
    temperature: 0.2,
    maxOutputTokens: 3000,
})

const openRouter = new ChatOpenRouter({
    model: "deepseek/deepseek-chat",
    temperature: 0.15,
    maxTokens: 5000,
});


export const getModel = async (agent) => {
    switch (agent) {
        case "chat":
            return groq
        case "search":
            return groq
        case "image":
            return groq
        case "router":
        case "intent":
            return groq
        case "coding":
            return openRouter
        case "pdf":
        case "ppt":
            return groq
        case "imageAnalyzer":
        case "pdfRag":
            return gemini
        default:
            return groq
    }
}
