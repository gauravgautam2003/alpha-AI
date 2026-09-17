import express from "express";
import { agent, selectWorkspace } from "../controllers/agent.controller.js";
import multer from "../config/multer.js";

const agentRouter = express.Router();


agentRouter.get("/workspace-picker", selectWorkspace);
agentRouter.post("/chat", multer.single("file"), agent);

export default agentRouter;
