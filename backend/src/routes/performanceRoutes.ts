import { Router } from "express";
import { performanceController } from "../controllers/performanceController.js";
import { upload } from "../middlewares/uploadMiddleware.js";

export const performanceRouter = Router();

performanceRouter.get("/dashboard", performanceController.dashboard);
performanceRouter.get("/risks", performanceController.listRisks);
performanceRouter.post("/metrics", performanceController.createMetric);
performanceRouter.post("/metrics/import-csv", upload.single("file"), performanceController.importCsv);
