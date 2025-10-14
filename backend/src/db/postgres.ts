import postgres from 'postgres';
import 'dotenv/config';

const { DB_HOST, DB_USER, DB_PASS, DB_NAME } = process.env;

if (!DB_HOST || !DB_USER || !DB_PASS || !DB_NAME) {
  throw new Error('Database enviroment variables not set');
}

export const sql = postgres({
  host: DB_HOST,
  port: 5432,
  username: DB_USER,
  password: DB_PASS,
  database: DB_NAME,
  idle_timeout: 20,
  max_lifetime: 60 * 30
});
