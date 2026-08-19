import Redis from "ioredis";

/**
 * @name instance
 * @description create redis instance
 * @type public
 */

const redis = new Redis(process.env.REDIS_URL);

redis.on("connect", () => {
    console.log("redis running");
})

export default redis