import { getModel } from "../config/llmModels.js"
import { HumanMessage, SystemMessage } from "@langchain/core/messages"
import { deductCredits } from "../utils/deductCredits.js"
import { checkAgentLimit } from "../config/agentLimit.js"

export const imageAnalyzerAgent = async (state) => {
    try {
        await checkAgentLimit(state.userId, "image")

        const llm = await getModel("imageAnalyzer")
        if (!state.file?.buffer || !state.file.mimetype?.startsWith("image/")) {
            return {
                ...state,
                aiResponse: "Please upload a valid image before asking for image analysis."
            }
        }

        const imageBuffer = Buffer.isBuffer(state.file.buffer)
            ? state.file.buffer
            : Buffer.from(state.file.buffer)
        const base64Image = imageBuffer.toString("base64")

        const messages = [
            new SystemMessage(
                `You are Alpha AI's visual analysis specialist.

                Analyze only the uploaded image and answer the user's question directly.
                Rules:
                    - Describe visible content accurately and distinguish observation from inference.
                    - Extract readable text faithfully; preserve important labels, numbers, and layout.
                    - Explain charts, tables, diagrams, objects, and relationships when relevant.
                    - Mention uncertainty when the image is blurry, cropped, ambiguous, or unreadable.
                    - Never invent details that are not visible in the image.
                    - Do not identify a person, location, or sensitive attribute unless the image and request support a careful, non-speculative answer.
                    - Prioritize the user's requested aspect instead of describing every visible object.
                    - Use concise Markdown with headings or bullets when it improves clarity.
                    `
            ),
            new HumanMessage({
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