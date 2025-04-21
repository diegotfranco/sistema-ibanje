import type { Request, Response } from "express";
import * as service from "services/usuarios.js";
import { createUser } from "services/usuarios.js";
import asyncHandler from "utils/asyncHandler.js";
import { validPassword } from "utils/auth.js";

export const login = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    // Check if email and password are present in the request body
    if (req.body?.email == null || req.body?.password == null) {
      res.status(400).json({ msg: "bad request" });
      return;
    }

    const email: string = req.body.email;
    const password: string = req.body.password;

    try {
      const user = await service.findUserByEmail(email);

      if (validPassword(password, user.hash)) {
        req.session.user = await createUser(user);

        // res.locals.name = req.session.user?.name;
        // res.locals.permissions = req.session.user?.permissions;

        res.status(200).json({ msg: "ok" });
      } else res.status(401).json({ msg: "not authenticated" });
    } catch (error) {
      res.status(401).json({ msg: "not authenticated" });
    }
  },
);

export const logout = (req: Request, res: Response): void => {
  req.session.destroy((err) => {
    if (err != null) res.status(500).json({ msg: "internal server error" });
    else res.status(200).json({ msg: "ok" });
  });
  res.clearCookie("sid");
};
