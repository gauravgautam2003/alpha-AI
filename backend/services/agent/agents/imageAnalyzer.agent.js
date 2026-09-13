import { getModel } from "../config/llmModels.js";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { deductCredits } from "../utils/deductCredits.js";
import { checkAgentLimit } from "../config/agentLimit.js";

export const imageAnalyzerAgent = async (state) => {
    try {
        await checkAgentLimit(state.userId, "imageAnalyzer");

        const llm = await getModel("imageAnalyzer", state.plan);
        if (!state.file?.buffer || !state.file.mimetype?.startsWith("image/")) {
            return {
                ...state,
                aiResponse: "⚠️ Please upload a valid image file (PNG, JPG, WEBP) for visual analysis."
            };
        }

        const imageBuffer = Buffer.isBuffer(state.file.buffer)
            ? state.file.buffer
            : Buffer.from(state.file.buffer);
        const base64Image = imageBuffer.toString("base64");

        const messages = [
            new SystemMessage(
                `You are Alpha AI's Principal Computer Vision & Multimodal Intelligence Specialist.

Your capabilities:
1. High-Precision OCR: Extract all printed or handwritten text with 100% precision, preserving formatting, tables, and numerical data.
2. Technical & UI Analysis: Inspect UI designs, flowcharts, architecture diagrams, error screenshots, and code snippets in images.
3. Data Visualization & Charts: Interpret bar charts, line graphs, scatter plots, and infographics with statistical rigor.
4. Problem Solving: If the image contains a math problem, bug, code error, or test question, provide a step-by-step verified solution.

Formatting Rules:
- Present insights cleanly with Markdown headings, bullet points, and code fences.
- If part of the image is illegible or occluded, state the ambiguity transparently without guessing.`
            ),
            new HumanMessage({
                content: [
                    {
                        type: "text",
                        text: state.prompt || "Please analyze this image thoroughly and provide detailed insights."
                    },
                    {
                        type: "image_url",
                        image_url: {
                            url: `data:${state.file.mimetype};base64,${base64Image}`
                        }
                    }
                ]
            })
        ];

        const response = await llm.invoke(messages);
        const textContent = Array.isArray(response?.content)
            ? response.content.map((part) => (typeof part === "string" ? part : part?.text || "")).join("")
            : String(response?.content ?? "");

        await deductCredits(state.userId, "imageAnalyzer");

        return {
            ...state,
            aiResponse: textContent
        };
    } catch (error) {
        console.error("Image Analyzer Error:", error?.message || error);
        return {
            ...state,
            aiResponse: error?.data?.message || error?.message || "❌ Failed to analyze image. Please try again."
        };
    }
};