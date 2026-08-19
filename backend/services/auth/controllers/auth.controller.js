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

        if(!user) {
            user = await User.create({
                firebaseUid: decoded.uid,
                name: decoded.name,
                email: decoded.email,
                avatar: decoded.picture
            })
        }

        const sessionId = crypto.randomUUID();

        await redis.set(`session:${sessionId}`, JSON.stringify({
            userId: user._id,
            name: user.name,
            email: user.email,
            avatar: user.avatar

        }), "EX",7*24*60*60)

        res.cookie("session", sessionId, {
            httpOnly: true,
            secure: false,
            sameSite: "lax",
            path: "/",
            maxAge: 7*24*60*60*1000
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
