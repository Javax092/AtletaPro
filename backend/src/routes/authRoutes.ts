import { Router } from "express";
import { authController } from "../controllers/authController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { tenantContextMiddleware } from "../middlewares/tenantContextMiddleware.js";

export const authRouter = Router();

authRouter.post("/register", authController.register);
authRouter.post("/login", authController.login);
authRouter.get("/me", authMiddleware, tenantContextMiddleware, authController.me);
