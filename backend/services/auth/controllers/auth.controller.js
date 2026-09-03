import { getAuth } from "firebase-admin/auth";
import { app } from "../config/firebase.js";
import User from "../models/user.model.js";
import redis from "../../../shared/redis/redis.js";


/**
 * @name /auth/login login user
 * @description login user using firebase and file import from /config/firebase.js
 * @type public
 */

export const login = async (req, res) => {
    try {
        const { token } = req.body;
        const decoded = await getAuth(app).verifyIdToken(token);

        let user = await User.findOne({
            firebaseUid: decoded.uid
        })

        if (!user) {
            user = await User.create({
                firebaseUid: decoded.uid,
                name: decoded.name,
                email: decoded.email,
                avatar: decoded.picture
            })
        } else if (decoded.picture && user.avatar !== decoded.picture) {
            user.avatar = decoded.picture;
            user.name = decoded.name || user.name;
            await user.save();
        }

        const sessionId = crypto.randomUUID();
        await redis.set(`user-session:${user?._id}`,{sessionId}, "EX", 7 * 24 * 60 * 60)
        await redis.set(`session:${sessionId}`, JSON.stringify({
            userId: user._id,
            name: user.name,
            email: user.email,
            avatar: user.avatar,
            plan: user.plan,
            credits: user.credits,
            totalCredits: user.totalCredits,
            planExpiresAt: user.planExpiresAt

        }), "EX", 7 * 24 * 60 * 60)

        res.cookie("session", sessionId, {
            httpOnly: true,
            secure: false,
            sameSite: "lax",
            path: "/",
            maxAge: 7 * 24 * 60 * 60 * 1000
        })


        return res.status(200).json({
            user,
            avatar: user.avatar,
            _id: user._id
        })

    } catch (error) {
        return res.status(500).json({
            message: "login error",
        })
    }
}

/**
 * @name /auth/login logout user
 * @description logout user using firebase and file import from /config/firebase.js
 * @type public
 */

export const logout = async (req, res) => {
    try {
        const sessionId = req.cookies?.session;
        await redis.del(`session:${sessionId}`);

        res.clearCookie("session", { path: "/" });

        return res.status(200).json({
            message: "logout succesfully"
        })

    } catch (error) {
        return res.status(500).json({
            message: "logout error",
        })
    }
}

export const updateUserPayment = async (req, res) => {
    try {
        const { plan, credits, userId } = req.body
        const user = await User.findById(userId)

        if (!user) {
            return res.status(404).json({
                message: "User Not Found",
                success: false
            })
        }

        user.plan = plan
        user.credits += credits
        user.totalCredits += credits
        user.planExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        await user.save()

        const sessionId =await redis.get(`user-session:${user?._id}`)
        await redis.set(`session:${sessionId}`, JSON.stringify({
            userId: user._id,
            name: user.name,
            email: user.email,
            avatar: user.avatar,
            plan: user.plan,
            credits: user.credits,
            totalCredits: user.totalCredits,
            planExpiresAt: user.planExpiresAt
        }), "EX", 7 * 24 * 60 * 60);

        return res.status(200).json({
            success: true
        })

    } catch (error) {
        return res.status(500).json({
            message: `Update User Payment Error ${error.message}`,
            success: false
        })
    }
}

export const deductCredits = async (req, res) => {
    try {
        const {userId, agent} = req.body

        const COST = {
            chat: 1,
            search: 5,
            coding: 10,
            pdf: 10,
            ppt: 10,
            image: 10
        };

        const user = await User.findById(userId)

        if(!user) {
            return res.status(400).json({
                message: "User Not Found"
            })
        }

        const requiredCredits = COST[agent] || 1

        if(user.credits < requiredCredits) {
            return res.status(400).json({
                message: "Not enough credits"
            })
        }

        user.credits -= requiredCredits
        await user.save()

        const sessionId =await redis.get(`user-session:${user?._id}`)
        await redis.set(`session:${sessionId}`, JSON.stringify({
            userId: user._id,
            name: user.name,
            email: user.email,
            avatar: user.avatar,
            plan: user.plan,
            credits: user.credits,
            totalCredits: user.totalCredits,
            planExpiresAt: user.planExpiresAt
        }), "EX", 7 * 24 * 60 * 60);

        return res.status(200).json({
            success: true,
            credits: user.credits
        })

    } catch (error) {
            return res.status(500).json({
            message: `deduct credits error ${error.message}`,
            success: false
        })
    }
}