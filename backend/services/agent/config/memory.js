import redis from "../../../shared/redis/redis.js";
import { getMessages } from "../utils/getMessages.js";

export const getMemory = async (conversationId, userId) => {
    const key = `messages:${conversationId}`;
    try {
        const cached = await redis.get(key);
        if (cached) {
            const messages = JSON.parse(cached);
            return Array.isArray(messages) ? messages : [];
        }
    } catch (error) {
        console.error("Redis read failed; using chat history fallback:", error.message);
    }

    const messages = (await getMessages(conversationId, userId)) || [];
    try {
        await redis.set(key, JSON.stringify(messages), "EX", 24 * 60 * 60);
    } catch (error) {
        console.error("Redis cache write failed:", error.message);
    }
    return messages;
}

export const addMessage = async (conversationId, role, content) => {
    const key = `messages:${conversationId}`;
    try {
        const rawMessages = await redis.get(key);

        const parsedMessages = rawMessages ? JSON.parse(rawMessages) : [];
        const messages = Array.isArray(parsedMessages) ? parsedMessages : [];

        messages.push({
            role,
            content
        })

        if (messages.length > 20) {
            messages.shift();
        }

        await redis.set(key, JSON.stringify(messages));
    } catch (error) {
        console.error("Redis message cache failed:", error.message);
    }
}