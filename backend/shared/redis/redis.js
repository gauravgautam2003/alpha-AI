import Redis from "ioredis";

const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
    maxRetriesPerRequest: 1,
    retryStrategy: (attempt) => Math.min(attempt * 1000, 5000),
});

redis.on("connect", () => {
    console.log("redis running");
});

redis.on("error", (error) => {
    console.error(`redis unavailable: ${error.message}`);
});

export default redis