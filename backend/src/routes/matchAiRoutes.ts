import { Router } from "express";
import { matchAiController } from "../controllers/matchAiController.js";

export const matchAiRouter = Router();

matchAiRouter.post("/intelligence", matchAiController.suggestIntelligence);
