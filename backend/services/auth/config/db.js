import mongoose from "mongoose";


/**
 * @name connectDB
 * @description write code for connect with mongodb database
 * @service public
 */

async function connectDB() {
    try {
        if (!process.env.MONGODB_URI) {
            console.log("Please add your database string!");
        }

        await mongoose.connect(process.env.MONGODB_URI);
        console.log("database connected successfully:✅");

    } catch (error) {
        console.log("invalid database string:❌", error);
    }
}

export default connectDB