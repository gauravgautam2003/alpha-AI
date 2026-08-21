import { ChatGroq } from "@langchain/groq"
import { ChatGoogleGenerativeAI } from "@langchain/google-genai"
import dotenv from "dotenv"

// This module is imported while the graph is being created, before index.js
// executes its dotenv setup. Load variables here so both LLM clients receive
// their API keys during construction.
dotenv.config({ quiet: true })

const groq = new ChatGroq({
    // Groq retired llama-3.3-70b-versatile for free and developer-tier keys
    // on 2026-08-16. GPT-OSS 120B is Groq's recommended replacement.
    model: "openai/gpt-oss-120b",
    apiKey: process.env.GROQ_API_KEY,
})


const gemini = new ChatGoogleGenerativeAI({
    model: "gemini-2.5-flash",
    apiKey: process.env.GOOGLE_API_KEY,
})

export const getModel = async (agent) => {
    switch (agent) {
        case "chat":
            return groq
        case "search":
            return groq
        case "coding":
            return gemini
        default:
            return groq
    }
}
