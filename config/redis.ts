import Redis from 'ioredis';

const redisUrl = "redis://localhost:6379";
if (!redisUrl) {
  throw new Error('REDIS_URL is not defined in .env file::::::');
}

const redis = new Redis(redisUrl);

redis.on('connect', () => console.log('Redis connected::::::'));
redis.on('error', (err) => console.error('Redis error::::::', err));


export default redis;
