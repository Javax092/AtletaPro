import { Router } from "express";
import { scoutAIController } from "../controllers/scoutAIController.js";

export const scoutRouter = Router();

scoutRouter.post("/assist", scoutAIController.assist);
