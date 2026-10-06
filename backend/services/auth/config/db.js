import mongoose from "mongoose";


/**
 * @name connectDB
 * @description write code for connect with mongodb database
 * @service public
 */

async function connectDB() {
    if (!process.env.MONGODB_URI) {
        throw new Error("MONGODB_URI environment variable is required");
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log("database connected successfully:✅");
}

export default connectDB