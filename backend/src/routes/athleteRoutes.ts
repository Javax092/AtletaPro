import { Router } from "express";
import { athleteController } from "../controllers/athleteController.js";
import { csvUpload } from "../middlewares/uploadMiddleware.js";

export const athleteRouter = Router();

athleteRouter.post("/intelligence/preview", athleteController.previewIntelligence);
athleteRouter.post("/import/csv/preview", csvUpload.single("file"), athleteController.previewCsvImport);
athleteRouter.post("/import/csv/commit", athleteController.commitCsvImport);
athleteRouter.get("/", athleteController.list);
athleteRouter.post("/", athleteController.create);
athleteRouter.get("/:athleteId/ai-profile", athleteController.getAiProfile);
athleteRouter.get("/:athleteId", athleteController.getById);
athleteRouter.put("/:athleteId", athleteController.update);
athleteRouter.delete("/:athleteId", athleteController.remove);
