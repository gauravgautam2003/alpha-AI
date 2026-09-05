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
})


const gemini = new ChatGoogleGenerativeAI({
    model: "gemini-2.5-flash",
    apiKey: process.env.GOOGLE_API_KEY,
})

const openRouter = new ChatOpenRouter({
    model: "deepseek/deepseek-chat",
    temperature: 0,
    maxTokens: 2500,
});


export const getModel = async (agent) => {
    switch (agent) {
        case "chat":
            return groq
        case "search":
            return groq
        case "image":
            return groq
        case "coding":
            return openRouter
        case "imageAnalyzer":
            return gemini    
        default:
            return groq
    }
}
