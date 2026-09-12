import { getAuth } from "firebase-admin/auth";
import { app } from "../config/firebase.js";
import User from "../models/user.model.js";
import redis from "../../../shared/redis/redis.js";
import { createHash, randomInt, randomUUID, scryptSync, timingSafeEqual } from "node:crypto";
import nodemailer from "nodemailer";

const OTP_TTL_SECONDS = 10 * 60;

const hashValue = (value) => createHash("sha256").update(value).digest("hex");

const hashPassword = (password) => {
    const salt = randomUUID();
    return `${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
};

const isPasswordValid = (password, storedHash) => {
    const [salt, hash] = storedHash.split(":");
    if (!salt || !hash) return false;
    const calculated = scryptSync(password, salt, 64);
    return timingSafeEqual(calculated, Buffer.from(hash, "hex"));
};

const escapeHtml = (value) => String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");

const sendOtpEmail = async (email, otp) => {
    if (!process.env.SMTP_URL && (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASSWORD)) {
        const error = new Error("SMTP is not configured");
        error.code = "SMTP_NOT_CONFIGURED";
        throw error;
    }

    const transporter = nodemailer.createTransport(process.env.SMTP_URL || {
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: process.env.SMTP_SECURE === "true",
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASSWORD
        }
    });

    const safeEmail = escapeHtml(email);
    const safeOtp = escapeHtml(otp);
    const html = `
        <!doctype html>
        <html lang="en">
            <head>
                <meta charset="UTF-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                <title>Alpha AI verification code</title>
            </head>
            <body style="margin:0;background:#f4f7fb;color:#172033;font-family:Arial,Helvetica,sans-serif;">
                <div style="display:none;max-height:0;overflow:hidden;opacity:0;">
                    Your Alpha AI verification code expires in 10 minutes.
                </div>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f7fb;padding:36px 16px;">
                    <tr>
                        <td align="center">
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border:1px solid #e4eaf2;border-radius:20px;overflow:hidden;box-shadow:0 12px 32px rgba(23,32,51,.08);">
                                <tr>
                                    <td style="background:#0f172a;padding:28px 32px;">
                                        <div style="color:#67e8f9;font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">ALPHA AI</div>
                                        <div style="color:#ffffff;font-size:24px;font-weight:700;margin-top:10px;">Verify your email</div>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding:34px 32px 30px;">
                                        <p style="margin:0;color:#526078;font-size:15px;line-height:24px;">Use the verification code below to continue to your Alpha AI workspace.</p>
                                        <div style="margin:28px 0;padding:22px 16px;background:#ecfeff;border:1px solid #a5f3fc;border-radius:14px;text-align:center;">
                                            <div style="color:#0e7490;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">Your one-time code</div>
                                            <div style="color:#0f172a;font-size:38px;font-weight:700;letter-spacing:10px;line-height:48px;margin-left:10px;">${safeOtp}</div>
                                        </div>
                                        <p style="margin:0;color:#526078;font-size:14px;line-height:22px;">This code expires in <strong style="color:#172033;">10 minutes</strong>.</p>
                                        <p style="margin:20px 0 0;color:#7a879b;font-size:12px;line-height:20px;">You requested this code for <span style="color:#526078;">${safeEmail}</span>. If you did not make this request, you can safely ignore this email.</p>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="border-top:1px solid #edf1f6;padding:20px 32px;color:#8a96a8;font-size:11px;line-height:18px;">This is an automated message from Alpha AI. Please do not reply to this email.</td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </body>
        </html>`;

    await transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: email,
        subject: "Your Alpha AI verification code",
        text: `Your Alpha AI verification code is ${otp}. It expires in 10 minutes.`,
        html
    });
};

const createSession = async (user, res) => {
    const sessionId = randomUUID();
    const session = {
        userId: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        plan: user.plan,
        credits: user.credits,
        totalCredits: user.totalCredits,
        planExpiresAt: user.planExpiresAt
    };

    await redis.set(`user-session:${user._id}`, sessionId, "EX", 7 * 24 * 60 * 60);
    await redis.set(`session:${sessionId}`, JSON.stringify(session), "EX", 7 * 24 * 60 * 60);
    
    res.cookie("session", sessionId, {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        path: "/",
        maxAge: 7 * 24 * 60 * 60 * 1000
    });
};

export const requestOtp = async (req, res) => {
    try {
        const { name, email, password, mode = "signup" } = req.body;

        const normalizedEmail = email?.trim().toLowerCase();

        if (!normalizedEmail || !/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
            return res.status(400).json({
                message: "Please enter a valid email"
            });
        }
        if (!password || password.length < 8) {
            return res.status(400).json({
                message: "Password must be at least 8 characters"
            });
        }

        const existingUser = await User.findOne({ email: normalizedEmail }).select("+passwordHash");
        if (mode === "signup" && existingUser) {
            return res.status(409).json({
                message: "Email is already registered"
            });
        }

        if (mode === "login" && (!existingUser || !existingUser.passwordHash || !isPasswordValid(password, existingUser.passwordHash))) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        if (mode === "signup" && !name?.trim()) {
            return res.status(400).json({
                message: "Name is required"
            });
        }

        const otp = String(randomInt(100000, 1000000));

        const pendingOtp = JSON.stringify({
            otpHash: hashValue(otp),
            name: name?.trim(),
            passwordHash: mode === "signup" ? hashPassword(password) : null,
            mode
        });

        await sendOtpEmail(normalizedEmail, otp);
        await redis.set(`auth-otp:${normalizedEmail}`, pendingOtp, "EX", OTP_TTL_SECONDS);

        return res.status(200).json({
            message: "OTP sent to your email",
            email: normalizedEmail
        });
    } catch (error) {

        console.error("request OTP error:", error.code, error.responseCode, error.message);

        if (error.code === "SMTP_NOT_CONFIGURED") {
            return res.status(503).json({
                message: "Email service is not configured. Add SMTP settings to auth/.env"
            });
        }
        return res.status(502).json({
            message: "Could not send OTP email. Check SMTP settings.",
            detail: error.responseCode ? `SMTP ${error.responseCode}` : error.code || "request failed"
        });
    }
};

export const verifyOtp = async (req, res) => {
    try {
        const { email, otp } = req.body;
        const normalizedEmail = email?.trim().toLowerCase();
        const pending = await redis.get(`auth-otp:${normalizedEmail}`);

        if (!pending || hashValue(String(otp)) !== JSON.parse(pending).otpHash) {
            return res.status(400).json({ message: "Invalid or expired OTP" });
        }

        const details = JSON.parse(pending);
        let user = await User.findOne({ email: normalizedEmail });
        if (details.mode === "signup") {
            user = await User.create({
                name: details.name,
                email: normalizedEmail,
                passwordHash: details.passwordHash
            });
        }

        await redis.del(`auth-otp:${normalizedEmail}`);
        await createSession(user, res);
        return res.status(200).json({ user, _id: user._id, avatar: user.avatar });
    } catch (error) {
        return res.status(500).json({ message: "OTP verification failed" });
    }
};


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

        await createSession(user, res);

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
        if (sessionId) {
            const sessionKey = `session:${sessionId}`;
            const legacySessionKey = `session: ${sessionId}`;
            const session = await redis.get(sessionKey) || await redis.get(legacySessionKey);

            if (session) {
                const { userId } = JSON.parse(session);
                if (userId) {
                    await redis.del(`user-session:${userId}`);
                }
            }

            await redis.del(sessionKey, legacySessionKey);
        }

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

        const sessionId = await redis.get(`user-session:${user?._id}`)
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
        const { userId, agent } = req.body

        const COST = {
            chat: 1,
            search: 5,
            coding: 10,
            pdf: 10,
            ppt: 10,
            image: 10
        };

        const user = await User.findById(userId)

        if (!user) {
            return res.status(400).json({
                message: "User Not Found"
            })
        }

        const requiredCredits = COST[agent] || 1

        if (user.credits < requiredCredits) {
            return res.status(400).json({
                message: "Not enough credits"
            })
        }

        user.credits -= requiredCredits
        await user.save()

        const sessionId = await redis.get(`user-session:${user?._id}`)
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