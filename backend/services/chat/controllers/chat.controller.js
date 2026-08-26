import Conversation from "../models/conversation.model.js";
import Message from "../models/message.model.js";

export const createConversation = async (req, res) => {
    try {
        // this header create in the gateway/utils/proxyWithHeader.js send userId with proxy()
        const userId = req.headers["x-user-id"];
        if (!userId) {
            return res.status(401).json({ message: "unauthorized" });
        }
        const conversation = await Conversation.create({
            userId: userId
        })

        return res.status(200).json(conversation);

    } catch (error) {
        return res.status(500).json({
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
        }).sort({ updatedAt: -1 })

        return res.status(200).json(conversations);

    } catch (error) {
        return res.status(500).json({
            message: `get conversation error ${error}`
        });
    }
}

export const updateConversation = async (req, res) => {
    try {
        const { id, title } = req.body;
        const userId = req.headers["x-user-id"];

        const conversation = await Conversation.findOneAndUpdate(
            { _id: id, userId },
            { title },
            { returnDocument: "after", runValidators: true }
        );

        if (!conversation) {
            return res.status(404).json({ message: "conversation not found" });
        }

        return res.status(200).json(conversation);

    } catch (error) {
        return res.status(500).json({
            message: `update conversation error ${error}`
        });

    }
}

export const saveMessage = async (req, res) => {
    try {
        const { conversationId, content, role, images, artifacts, title } = req.body;

        const message = await Message.create({
            conversationId,
            content,
            role,
            images,
            artifacts,
            title
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
        const userId = req.headers["x-user-id"];
        const conversation = await Conversation.findOne({
            _id: req.params.conversationId,
            userId
        });

        if (!conversation) {
            return res.status(404).json({ message: "conversation not found" });
        }

        const messages = await Message.find({
            conversationId: conversation._id
        }).sort({ createdAt: 1 });

        return res.status(200).json(messages);

    } catch (error) {
        return res.status(500).json({
            message: `get message error ${error}`
        })
    }
}
