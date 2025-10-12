import type { Request, Response, NextFunction } from 'express';

export const isAuthenticated = (req: Request, res: Response, nxt: NextFunction): void => {
  if (req.session?.user == null) {
    res.status(401).json({ msg: 'not authenticated' });
  }
  nxt();
};
