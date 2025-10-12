import type { Request, Response } from 'express';
import { Errors } from '@/utils/errorFactory';

export const notFound = (req: Request, _res: Response): void => {
  console.log(req.ip, req.url, req.method, req.body);
  throw Errors.notFound('Rota não encontrada');
};
