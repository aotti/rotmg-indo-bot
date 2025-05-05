const { Redis } = require("@upstash/redis");
require('dotenv').config()

const client = new Redis({
    url: process.env.UPSTASH_REDIS_URL,
    token: process.env.UPSTASH_REDIS_TOKEN
})

module.exports = client