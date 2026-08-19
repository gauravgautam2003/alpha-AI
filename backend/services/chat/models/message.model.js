import mongoose from "mongoose";

const messageSchema = mongoose.Schema({
    conversationId: {
        type:mongoose.Schema.Types.ObjectId,
        ref: "conversation"
    },
    role: {
        type: String,
        enum: ["user", "assistant"]
    },
    content: {
        type: String,
    }
},{
    timestamps: true
})

const Message = new mongoose.model("Message", messageSchema);
export default Message;