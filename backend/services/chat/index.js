import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import dns from "dns";
import chatRouter from "./routes/chat.route.js";

dotenv.config({ quiet: true });

dns.setServers(["8.8.4.4", "8.8.8.8"]);

const PORT = process.env.PORT || 5001

const app = express();
app.use(express.json());
app.use("/", chatRouter)


app.get("/", (req, res) => {
    return res.status(200).json({
        message: "welcome to chat service"
    })
})

/**
 * @name auth server
 * @description create server for listen services on PORT? 8001 : 5001
 * @service public
 */

app.listen(PORT, function () {
    connectDB();
    console.log(`chat server is running on port: ${PORT}`);
})