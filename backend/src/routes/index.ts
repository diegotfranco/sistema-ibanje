import { Router } from "express";
import usuarios from "routes/usuarios.js";
import { notFound } from "middlewares/notFound.js";

const router = Router();

router.use("/api/v1/usuarios", usuarios);
router.use(notFound);

export default router;
