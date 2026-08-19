import mongoose from "mongoose";


const conversationSchema = mongoose.Schema({
    title: {
        type: String,
        default: "New Chat"
    },
    userId: {
        type: String
    }
},
    {
        timestamps: true
    }
)

const Conversation = new mongoose.model("Conversation", conversationSchema);
export default Conversation