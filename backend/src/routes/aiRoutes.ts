import { Router } from "express";
import { aiController } from "../controllers/aiController.js";

export const aiRouter = Router();

aiRouter.get("/health", aiController.health);

