import { PDFParse } from "pdf-parse";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { vectorStore } from "../config/vectorDB.js";
import { getModel } from "../config/llmModels.js";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { deductCredits } from "../utils/deductCredits.js";
import { checkAgentLimit } from "../config/agentLimit.js";

const extractPdfText = async (pdfBuffer) => {
    try {
        if (PDFParse) {
            const parser = new PDFParse({ data: pdfBuffer });
            const result = await parser.getText();
            return result?.text || "";
        }
        return "";
    } catch (err) {
        console.error("PDF Parse error:", err);
        return "";
    }
};

export const pdfRagAgent = async (state) => {
    try {
        await checkAgentLimit(state.userId, "pdfRag");
        if (!state.file?.buffer || state.file.mimetype !== "application/pdf") {
            return {
                ...state,
                aiResponse: "⚠️ Please upload a valid PDF document to ask questions about its content."
            };
        }

        const pdfBuffer = Buffer.isBuffer(state.file.buffer)
            ? state.file.buffer
            : Buffer.from(state.file.buffer);

        const text = await extractPdfText(pdfBuffer);

        if (!text?.trim()) {
            return {
                ...state,
                aiResponse: "⚠️ Could not extract readable text from this PDF. It may be password-protected or contain only scanned images without selectable text."
            };
        }

        const splitter = new RecursiveCharacterTextSplitter({
            chunkSize: 1000,
            chunkOverlap: 150
        });

        const docs = await splitter.createDocuments([text]);
        const collectionName = `pdf-${state.userId ? String(state.userId).slice(-8) : "session"}-${Date.now()}`;
        const store = await vectorStore(docs, collectionName);

        const relevantDocs = await store.similaritySearch(state.prompt || "Summarize the key takeaways of this PDF", 6);
        const context = relevantDocs.map((data) => data.pageContent).join("\n\n---\n\n");

        const llm = await getModel("pdfRag", state.plan);

        const messages = [
            new SystemMessage(`
You are Alpha AI's Principal Document Intelligence & Research Specialist.

Your task is to answer user queries grounded strictly in the provided PDF document context.

Core Principles:
1. Absolute Grounding: Rely strictly on the provided PDF context. Do not speculate or invent facts.
2. Handling Missing Info: If the requested information is absent from the context, state: "I couldn't find information regarding this in the uploaded PDF."
3. Structure & Clarity: Present clear, well-structured answers using Markdown bullet points, headings, and tables where applicable.
4. Precision: Preserve technical names, numerical figures, dates, and quantitative data verbatim.
`),
            new HumanMessage(`
PDF Context:
${context}

User Question:
${state.prompt || "Summarize this document"}
`)
        ];

        const response = await llm.invoke(messages);
        const textContent = Array.isArray(response?.content)
            ? response.content.map((part) => (typeof part === "string" ? part : part?.text || "")).join("")
            : String(response?.content ?? "");

        await deductCredits(state.userId, "pdfRag");

        return {
            ...state,
            aiResponse: textContent
        };
    } catch (error) {
        console.error("PDF RAG Error:", error?.message || error);
        return {
            ...state,
            aiResponse: error?.data?.message || error?.message || "❌ Failed to analyze PDF. Please try again."
        };
    }
};