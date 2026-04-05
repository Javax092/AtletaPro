import { Router } from "express";
import { matchController } from "../controllers/matchController.js";
import { upload } from "../middlewares/uploadMiddleware.js";

export const matchRouter = Router();

matchRouter.get("/scout/analyses", matchController.listScoutAnalyses);
matchRouter.get("/scout/analyses/:analysisId/heatmap", matchController.getHeatmapFile);
matchRouter.get("/", matchController.listMatches);
matchRouter.post("/", matchController.createMatch);
matchRouter.post("/:matchId/videos", upload.single("file"), matchController.uploadVideo);
matchRouter.get("/:matchId/videos/:videoId/file", matchController.getVideoFile);
matchRouter.delete("/:matchId/videos/:videoId", matchController.deleteVideo);
matchRouter.post("/:matchId/videos/:videoId/process", matchController.processVideo);
matchRouter.delete("/:matchId", matchController.deleteMatch);
