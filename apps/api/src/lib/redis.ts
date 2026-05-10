import { createClient, type RedisClientType } from 'redis';
import { env } from '../config/env.js';

let client: RedisClientType | null = null;

export async function getRedis(): Promise<RedisClientType> {
  if (!client) {
    client = createClient({ url: env.REDIS_URL });
    await client.connect();
  }
  return client;
}

export async function closeRedis() {
  if (client) {
    await client.quit();
    client = null;
  }
}
