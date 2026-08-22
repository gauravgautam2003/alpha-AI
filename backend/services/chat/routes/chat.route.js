import express from "express"
import { createConversation, getConversations, getMessage, saveMessage, updateConversation } from "../controllers/chat.controller.js"

const chatRouter = express.Router()

/**
 * @namw create conversation
 * @description create conversation using input section through the user
 * @type public
 */

chatRouter.post("/create-conversation", createConversation);

/**
 * @namw get conversation
 * @description get conversation send by the user for ai read
 * @type public
 */


chatRouter.get("/get-conversations", getConversations);

/**
 * @namw update conversation
 * @description update conversation using input section through the user if user want to change in the chats
 * @type public
 */


chatRouter.post("/update-conversation", updateConversation);

/**
 * @namw save message
 * @description save message in the history and database
 * @type public
 */


chatRouter.post("/save-message", saveMessage);

/**
 * @namw get message
 * @description get message using conversationId from agents 
 * @type public
 */


chatRouter.get("/get-messages/:conversationId", getMessage);

export default chatRouter;
