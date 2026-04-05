import { Router } from "express";
import { dashboardController } from "../controllers/dashboardController.js";

export const dashboardRouter = Router();

dashboardRouter.get("/", dashboardController.get);

