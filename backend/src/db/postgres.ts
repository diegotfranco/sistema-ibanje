import postgres from 'postgres';
import 'dotenv/config';

if (!process.env.DB_HOST || !process.env.DB_USER || !process.env.DB_PASS || !process.env.DB_NAME) {
  throw new Error('Database enviroment variables not set');
}

export const sql = postgres({
  host: process.env.DB_HOST,
  port: 5432,
  username: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  idle_timeout: 20,
  max_lifetime: 60 * 30
});
