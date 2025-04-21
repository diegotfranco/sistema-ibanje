import { createClient } from "redis";

// Replace with your Redis ACL credentials
export const redisClient = createClient({
  url: "redis://sistema_ibanje:ARS7m#cQMsvSz&pk@89.116.214.28:6379",
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
