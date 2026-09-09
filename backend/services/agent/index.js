import express from "express";
import connectDB from "./config/db.js";
import dns from "dns";
import agentRouter from "./routes/agent.route.js";
import dotenv from "dotenv";
dotenv.config({ quiet: true });

dns.setServers(["8.8.4.4", "8.8.8.8"])
const app = express();

const port = process.env.PORT || 5003

app.use(express.json());
app.use("/", agentRouter);
app.use((err, req, res, next) => {
    console.error(err)
    if(err.status) {
        return res.status(err.status).json(err.data)
    }

    return res.status(500).json({message: `Agent errro ${err}`})
})
app.get("/", (req, res) => {
    return res.json({message: "welcome to agent"});
})

app.listen(port, () => {
    connectDB();
    console.log(`agent server is running on port: ${port}`);
})