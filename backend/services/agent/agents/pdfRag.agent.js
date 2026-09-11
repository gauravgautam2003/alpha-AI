import { PDFParse } from "pdf-parse";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { vectorStore } from "../config/vectorDB.js";
import { getModel } from "../config/llmModels.js";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { deductCredits } from "../utils/deductCredits.js";
import { checkAgentLimit } from "../config/agentLimit.js";

export const pdfRagAgent = async (state) => {
    try {
        await checkAgentLimit(state.userId, "pdf")
        if (!state.file?.buffer || state.file.mimetype !== "application/pdf") {
            return {
                ...state,
                aiResponse: "Please upload a valid PDF before asking questions about it."
            }
        }

        const pdfBuffer = Buffer.isBuffer(state.file.buffer)
            ? state.file.buffer
            : Buffer.from(state.file.buffer)
        const pdf = new PDFParse({ data: pdfBuffer })

        const result = await pdf.getText()
        const text = result.text

        if (!text?.trim()) {
            return {
                ...state,
                aiResponse: "I couldn't extract readable text from this PDF."
            }
        }

        const splitter = new RecursiveCharacterTextSplitter({
            chunkSize: 1000,
            chunkOverlap: 200
        })

        const docs = await splitter.createDocuments([text])
        const collectionName = `pdf-${Date.now()}`
        const store = await vectorStore(docs, collectionName)

        const relevantDocs = await store.similaritySearch(state.prompt || "Summarize this PDF", 5)
        const context = relevantDocs.map(data => data.pageContent).join("\n\n")

        const llm = await getModel("pdfRag")

        const messages = [
            new SystemMessage(`
                You are Alpha AI's document question-answering specialist.

                Answer the user's question only from the retrieved content of the uploaded PDF.
                Rules:
                    - Treat the PDF context as the only source of truth.
                    - Do not use outside knowledge to fill missing details.
                    - If the answer is not supported by the context, say exactly: "I couldn't find this information in the uploaded PDF."
                    - Explain the answer clearly and cite page numbers only when page information is present in the context.
                    - Use concise Markdown and preserve important numbers, names, dates, and qualifications.
                    - Prefer direct answers over a generic summary.
                    - If the context is incomplete or contradictory, say so and identify the limitation.
                    - Never imply that a citation or page reference exists when it is absent.
            `),

            new HumanMessage(`
                Context: ${context}
                Question: ${state.prompt}
            `)
        ]

        const response = await llm.invoke(messages)
        await deductCredits(state.userId, "pdf")
        return {
            ...state,
            aiResponse: response.content
        }
    } catch (error) {
        return {
            ...state,
            aiResponse: error?.data?.message || "Failed to Analyze pdf"
        }
    }
}