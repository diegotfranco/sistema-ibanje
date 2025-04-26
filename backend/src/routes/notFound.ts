import type { Request, Response } from "express";

export const notFound = (req: Request, res: Response): void => {
  console.log(req.ip, req.url, req.method, req.body);
  res.status(404).json({ msg: "not found" });
};
