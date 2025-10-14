import type { Request, Response } from 'express';
import { Errors } from '@/utils/errorFactory';

export const notFound = (req: Request, _res: Response): void => {
  throw Errors.notFound(`Rota não encontrada: ${req.method} - ${req.url}`);
};
