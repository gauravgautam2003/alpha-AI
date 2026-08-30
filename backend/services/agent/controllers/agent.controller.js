import axios from "axios";
import { graph } from "../graph/graph.js";
import { addMessage } from "../config/memory.js";

export const agent = async (req, res) => {
    try {
        const { prompt, conversationId, agent } = req.body;
        const userId = req.headers["x-user-id"];


        if (conversationId) {
            await axios.post(`${process.env.CHAT_SERVICE}/save-message`, {
                conversationId,
                role: "user",
                content: prompt
            });
        }

        const result = await graph.invoke({
            prompt,
            conversationId,
            agent,
            userId,
            file: req.file ? {
                originalname: req.file.originalname,
                mimetype: req.file.mimetype,
                buffer: req.file.buffer
            } : undefined
        });

        const response = result.aiResponse;

        await addMessage(conversationId, "user", prompt);
        await addMessage(conversationId, "assistant", response);

        if (conversationId && response) {
            await axios.post(`${process.env.CHAT_SERVICE}/save-message`, {
                conversationId,
                role: "assistant",
                content: typeof response === 'string' ? response : JSON.stringify(response),
                images: result.images,
                artifacts: result?.artifacts
            });
        }

        return res.status(200).json({
            answer: result?.aiResponse,
            images: result?.images,
            artifacts: result?.artifacts
        });

    } catch (error) {
        return res.status(500).json({
            message: `agent error ${error}`
        });
    }
}