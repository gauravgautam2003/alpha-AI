import "dotenv/config";
import express from "express";
import connectDB from "./config/db.js";
import dns from "dns";

dns.setServers(["8.8.4.4", "8.8.8.8"]);

const PORT = process.env.PORT || 5004

const app = express();
app.use(express.json());


app.get("/", (req, res) => {
    return res.status(200).json({
        message: "welcome to billing service"
    })
})

app.listen(PORT, async function () {
    await connectDB();
    console.log(`billing server is running on port: ${PORT}`);
})
