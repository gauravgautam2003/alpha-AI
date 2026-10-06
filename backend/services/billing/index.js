import "dotenv/config";
import express from "express";
import connectDB from "./config/db.js";
import router from "./routes/billing.route.js";
import dns from "dns";
import { normalizeServiceUrl } from "../../shared/serviceUrl.js";

dns.setServers(["8.8.4.4", "8.8.8.8"]);
process.env.AUTH_SERVICE = normalizeServiceUrl(process.env.AUTH_SERVICE, "AUTH_SERVICE");

const PORT = process.env.PORT || 5004

const app = express();
app.use(express.json());
app.use("/", router)

app.get("/", (req, res) => {
    return res.status(200).json({
        message: "welcome to billing service"
    })
})

await connectDB();

app.listen(PORT, function () {
    console.log(`billing server is running on port: ${PORT}`);
})
