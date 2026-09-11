import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    firebaseUid: {
        type: String,
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    passwordHash: {
        type: String,
        select: false
    },
    avatar: {
        type: String
    },
    plan: {
        type: String,
        default: "free"
    },
    credits: {
        type: Number,
        default: 100
    },
    totalCredits: {
        type: Number,
        default: 100
    },
    planExpiresAt: Date
}, {
    timestamps: true
})

const User = mongoose.model("User", userSchema);
export default User;
