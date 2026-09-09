import { getModel } from "../config/llmModels.js"
import { HumanMessage, SystemMessage } from "@langchain/core/messages"
import { deductCredits } from "../utils/deductCredits.js"
import { checkAgentLimit } from "../config/agentLimit.js"

export const imageAnalyzerAgent = async (state) => {
    try {
        await checkAgentLimit(state.userId, "image")

        const llm = await getModel("imageAnalyzer")
        const imageBuffer = state.file.buffer
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
                            url: `data:${state.file.mimetype};base64,${base64Image}`
                        }
                    }
                ]
            })
        ]

        const response = await llm.invoke(messages)
        await deductCredits(state.userId, "image")
        return {
            ...state,
            aiResponse: response.content
        }

    } catch (error) {
        console.log(error.message || error)
        return {
            ...state,
            aiResponse: error?.data?.message || "Failed to analyze file"
        }
    }
}