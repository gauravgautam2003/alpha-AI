import fs from "fs"
import { getModel } from "../config/llmModels.js"
import { HumanMessage, SystemMessage } from "@langchain/core/messages"

export const imageAnalyzerAgent = async (state) => {
    try {
        const llm = await getModel("imageAnalyzer")
        const imageBuffer = await fs.readFile(state.file.path)
        const base64Image = imageBuffer.toString("base64")

        const messages = [
            SystemMessage(
                `You are Alpha AI image Analyzer Agent.
                
                Rules:
                    - Analyze only the uploaded image.
                    - Answer the user's question accurately.
                    - If text exist in the image, extract it.
                    - If charts or tables exists, explain them,
                    - If something is unclear, say so.
                    - Use Markdorn when helpfull.
                    - Do not hallucinate
                    `
            ),
            HumanMessage({
                content: [
                    {
                        type: "text",
                        text: state.prompt || "analyze the image"
                    },
                    {
                        type: "image_url",
                        "image_url": {
                            url: `data:${state.file.mimeType};base64,${base64Image}`
                        }
                    }
                ]
            })
        ]

        const response = await llm.invoke(messages)
        return {
            ...state,
            aiResponse: response.content
        }

    } catch (error) {
        console.log(error.message || error)
        return {
            ...state,
            aiResponse: "Failed to analyze file"
        }
    } finally {
        fs.unlink(state.file.path)
    }
}