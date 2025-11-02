import { createClient } from 'redis';

const { REDIS_HOST, REDIS_PASSWORD } = process.env;

if (!REDIS_HOST || !REDIS_PASSWORD) {
  throw new Error('Redis environment variables not set');
}

export const redisClient = createClient({
  socket: {
    host: REDIS_HOST,
    port: 6379
  },
  password: REDIS_PASSWORD
});

redisClient.connect().catch((error) => {
  console.error('Error connecting to Redis:', error);
});

const addPrefix = (key: string): string => `ibanje:${key}`;

export const setRedisKey = async (key: string, value: string): Promise<void> => {
  await redisClient.set(addPrefix(key), value);
};

export const getRedisKey = async (key: string): Promise<string | null> => {
  return await redisClient.get(addPrefix(key));
};
