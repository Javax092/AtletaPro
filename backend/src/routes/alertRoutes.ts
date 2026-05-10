import { Router } from "express";
import { alertController } from "../controllers/alertController.js";

export const alertRouter = Router();

alertRouter.get("/", alertController.list);
