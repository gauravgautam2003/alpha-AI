import express from "express";
import { agent } from "../controllers/agent.controller.js";
import upload from "../utils/multer.js";
import multer from "../config/multer.js";

const agentRouter = express.Router();


agentRouter.post("/chat",multer.single("file") ,upload.single("file"), agent);

export default agentRouter;