import { Router } from "express";
import * as controller from "controllers/usuarios.js";

const router = Router();

router.post("/login", controller.login);
router.get("/logout", controller.logout);

export default router;
