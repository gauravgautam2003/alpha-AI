import fs from "fs";
import { PDFParse } from "pdf-parse";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { vectorStore } from "../config/vectorDB.js";
import { getModel } from "../config/llmModels.js";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { deductCredits } from "../utils/deductCredits.js";

export const pdfRagAgent = async (state) => {
    try {
        const pdfBuffer = fs.readFileSync(state.file.path)
        const pdf = new PDFParse({ data: pdfBuffer })

        const result = pdf.getText()
        const text = await result.text

        const splitter = new RecursiveCharacterTextSplitter({
            chunkSize: 1000,
            chunkOverlap: 200
        })

        const docs = await splitter.createDocuments([text])
        const collectionName = `pdf-${Date.now()}`
        const store = await vectorStore(docs, collectionName)

        const relevantDocs = await store.similaritySearch(state.prompt, 5)
        const context = relevantDocs.map(data => data.pageContent)

        const llm = await getModel("pdfRag")

        const messages = [
            new SystemMessage(`
                You are Alpha AI PDF assistant.

                Rules:
                    - Answer ONLY from the uploaded PDF.
                    - Never make up information.
                    - If the answer is not present in the PDF, reply: "I couldn't find this informations from uploaded PDF."
                    - Use Markdown formatting. 
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
            aiResponse: "Failed to Analyze pdf"
        }
    }
    finally {
        fs.unlink(state.file.path)
    }
}