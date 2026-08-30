import express from "express";
import { agent } from "../controllers/agent.controller.js";
import upload from "../utils/multer.js";

const agentRouter = express.Router();


agentRouter.post("/chat", upload.single("file"), agent);

export default agentRouter;