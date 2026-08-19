import Conversation from "../models/conversation.model.js";
import Message from "../models/message.model.js";

export const createConversation = async (req, res) => {
    try {
        // this header create in the gateway/utils/proxyWithHeader.js send userId with proxy()
        const userId = req.headers["x-user-id"];
        const conversation = await Conversation.create({
            userId: userId
        })

        return res.status(200).json(conversation);

    } catch (error) {
        return res.status(200).json({
            message: `create conversation error ${error}`
        });

    }
}

export const getConversations = async (req, res) => {
    try {
        // this header get in the gateway/utils/proxyWithHeader.js send userId with proxy()
        const userId = req.headers["x-user-id"];
        const conversations = await Conversation.find({
            userId: userId
        }).sort({ updateAt: -1 })

        return res.status(200).json(conversations);

    } catch (error) {
        return res.status(200).json({
            message: `get conversation error ${error}`
        });
    }
}

export const updateConversation = async (req, res) => {
    try {
        const {id, title} = req.body;

        const conversation = await Conversation.findByIdAndUpdate(id, {
            title
        });

        return res.status(200).json(conversation);

    } catch (error) {
        return res.status(200).json({
            message:`update conversation error ${error}`
        });
        
    }
}

export const saveMessage = async (req, res) => {
    try {
        const { conversationId, content, role } = req.body;

        const message = await Message.create({
            conversationId,
            content,
            role
        })

        return res.status(200).json(message);

    } catch (error) {
        return res.status(500).json({
            message: `save message error ${error}`
        })
    }
}

export const getMessage = async (req, res) => {
    try {

        const messages = await Message.find({
            conversationId: req.params.conversationId
        }).sort({createdAt: 1});

        return res.status(200).json(messages);
        
    } catch (error) {
        return res.status(500).json({
            message: `get message error ${error}`
        })
    }
}