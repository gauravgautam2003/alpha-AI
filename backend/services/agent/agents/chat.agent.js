import { AIMessage, HumanMessage, SystemMessage } from "@langchain/core/messages";
import { getModel } from "../config/llmModels.js";
import { getMemory } from "../config/memory.js";

export const chatAgent = async (state) => {
    const llm = await getModel("chat");

    const history = await getMemory(state.conversationId);

    const systemPrompt = `You are Alpha AI, an Intelligence AI assistant.
                        Rules:
                            - For simple questions, greetings, and short queries, respond naturally in plain text.
                            - For technical, educational, coding or detailed topics, use clean Markdown.
                        Formatting:
                            - Use # titles and ## for sections.
                            - Leave a blank line after headings.
                            - Use bullet points fro list.
                            - Use numbered lists fro steps.
                            - Use fenced code blocks with language tags for code,
                            - Keep paragraphs short and readable.
                            - Never write headings and content on same line
                            - Never generate large walls of text
                        `;


    const messages = [
        new SystemMessage(systemPrompt)
    ]

    history.forEach(msg => {
        if(msg.role == "user") {
            messages.push(new HumanMessage({content: msg.content}));
        }
        if(msg.role == "assistant") {
            messages.push(new AIMessage({content: msg.content}));
        }
    });

    messages.push(new HumanMessage(state.prompt));

    const response = await llm.invoke(messages)

    return {
        ...state,
        aiResponse: response.content
    }
}