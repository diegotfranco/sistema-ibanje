import type { Request, Response } from 'express';
import { sql } from '@/db/postgres';

export const healthCheck = async (req: Request, res: Response) => {
  try {
    await sql`SELECT 1`;
    res.sendStatus(200);
  } catch (error) {
    console.error('DB health check failed:', error);
    res.status(500).send('Database connection error');
  }
};
