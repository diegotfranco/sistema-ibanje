import type { Request, Response, NextFunction } from 'express';

export const isAuthenticated = (req: Request, res: Response, nxt: NextFunction): void => {
  if (req.session?.user == null) {
    // If not authenticated, send a 401 response and stop execution.
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  // If authenticated, pass control to the next middleware and stop.
  return nxt();
};
