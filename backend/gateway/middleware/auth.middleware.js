import redis from "../../shared/redis/redis.js";

const protect = async (req, res, next) => {
    try {
        const sessionId = req.cookies?.session;

        if(!sessionId) {
            return res.status(401).json({message: "unauthorized"});
        }
        
        // Accept sessions created before the key format was normalized so a
        // gateway deployment cannot invalidate an active login.
        const session =
            await redis.get(`session:${sessionId}`) ||
            await redis.get(`session: ${sessionId}`);

        if(!session) {
            res.clearCookie("session", { path: "/" });
            return res.status(401).json({message: "session expired or not found"});
        }

        req.user = JSON.parse(session);

        next();

    } catch (error) {
        return res.status(500).json({message: `protect error: ${error}`});
    }
}

export default protect
