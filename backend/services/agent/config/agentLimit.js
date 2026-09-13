import redis from "../../../shared/redis/redis.js"

const Limits = {
    chat: 20,
    coding: 10,
    pdf: 10,
    ppt: 10,
    image: 10,
    imageGen: 10,
    imageAnalyzer: 10,
    pdfRag: 10,
    search: 15,
    resume: 10,
    resumeBuilder: 10
}

export const checkAgentLimit = async (userId, agent) => {
    const max = Limits[agent] || Limits["chat"]
    const key = `rate:${userId}:${agent}`

    const count = await redis.incr(key)

    if(count == 1) {
        await redis.expire(key, 60)
    }

    const ttl = await redis.ttl(key)

    if(count > max) {
        const minutes = Math.floor(ttl/60)
        const seconds = (ttl % 60)

        const time = minutes > 0 ? `${minutes}m : ${seconds}sec` : `${seconds}sec`
        const error = new Error(`Rate limit exceeded for ${agent}`)
        error.status = 429
        error.data = {
            success: false,
            agent,
            remainingTime: ttl,
            retryAfter: time,
            message: `You have reached the ${agent} limit ${max} requests/minute. Try again in ${time}`
        }

        throw error
    }

    return {
        remainingTime: max - count,
        limit: max
    }
}