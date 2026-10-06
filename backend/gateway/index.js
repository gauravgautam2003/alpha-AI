import "dotenv/config";
import express from "express";
import proxy from "express-http-proxy";
import protect from "./middleware/auth.middleware.js";
import cors from "cors"
import cookieParser from "cookie-parser";
import { proxyWithHeader } from "./utils/proxyWithHeader.js";
import { getCurrentUser } from "./controllers/user.controller.js";
import morgan from "morgan";
import { normalizeServiceUrl } from "../shared/serviceUrl.js";
const port = process.env.PORT || 8000;

const app = express();
const authService = normalizeServiceUrl(process.env.AUTH_SERVICE, "AUTH_SERVICE");
const chatService = normalizeServiceUrl(process.env.CHAT_SERVICE, "CHAT_SERVICE");
const agentService = normalizeServiceUrl(process.env.AGENT_SERVICE, "AGENT_SERVICE");
const billingService = normalizeServiceUrl(process.env.BILLING_SERVICE, "BILLING_SERVICE");

//prebuild middleware

app.use(morgan("dev"));
app.use(express.json());
app.use(cookieParser());

app.use(cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true
}))

app.use("/api/auth", proxy(authService))
app.use("/api/chat", protect, proxyWithHeader(chatService));
app.use("/api/me", protect, getCurrentUser);
app.use("/api/agent", protect, proxyWithHeader(agentService))
app.use("/api/billing", protect, proxyWithHeader(billingService));


app.get("/", (req, res) => {
    return res.status(200).json({
        message: "hello from gateway"
    })
})

app.listen(port, () => {
    console.log(`gateway is running on port: ${port}`);
})
