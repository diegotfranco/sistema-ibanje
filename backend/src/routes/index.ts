import { Router } from "express";
import usuarios from "routes/usuarios.js";
import { notFound } from "routes/notFound.js";
import { healthCheck } from "./healthCheck.js";

const router = Router();

router.use("/api/v1/usuarios", usuarios);
router.use("/health", healthCheck);
router.use(notFound);

export default router;
