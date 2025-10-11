import { createClient } from "redis";
import "dotenv/config";

const {
  DB_HOST,
  DB_USER,
  DB_PASS,
} = process.env;

const password = encodeURIComponent(DB_PASS || "");

export const redisClient = createClient({
  socket: {
    host: DB_HOST,
    port: 6379,
  },
  username: DB_USER,
  password: password,
});

redisClient.connect().catch((error) => {
  console.error("Error connecting to Redis:", error);
});

const addPrefix = (key: string): string => `ibanje:${key}`;

export const setRedisKey = async (
  key: string,
  value: string,
): Promise<void> => {
  await redisClient.set(addPrefix(key), value);
};

export const getRedisKey = async (key: string): Promise<string | null> => {
  return await redisClient.get(addPrefix(key));
};
