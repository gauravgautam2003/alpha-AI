import "dotenv/config";
import express from "express";
import connectDB from "./config/db.js";
import router from "./routes/auth.route.js";
import dns from "dns";

dns.setServers(["8.8.4.4", "8.8.8.8"]);

const PORT = process.env.PORT || 5001

const app = express();
app.use(express.json());
app.use("/", router)


app.get("/", (req, res) => {
    return res.status(200).json({
        message: "welcome to authentication service"
    })
})

app.listen(PORT, async function () {
    await connectDB();
    console.log(`auth server is running on port: ${PORT}`);
})
