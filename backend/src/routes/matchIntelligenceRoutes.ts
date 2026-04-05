import { Router } from "express";
import { matchIntelligenceController } from "../controllers/matchIntelligenceController.js";

export const matchIntelligenceRouter = Router();

matchIntelligenceRouter.get("/predictions", matchIntelligenceController.listClubPredictions);
matchIntelligenceRouter.get("/predictions/:predictionId", matchIntelligenceController.predictionDetail);
matchIntelligenceRouter.get("/snapshots", matchIntelligenceController.listSnapshots);
matchIntelligenceRouter.get("/snapshots/latest", matchIntelligenceController.latestSnapshot);
matchIntelligenceRouter.post("/snapshots", matchIntelligenceController.createSnapshot);
matchIntelligenceRouter.get("/matches", matchIntelligenceController.listMatches);
matchIntelligenceRouter.get("/reports", matchIntelligenceController.listReports);
matchIntelligenceRouter.get("/matches/:matchId/latest", matchIntelligenceController.latestByMatch);
matchIntelligenceRouter.post("/matches/:matchId/analyze", matchIntelligenceController.analyze);
matchIntelligenceRouter.get("/matches/:matchId/predictions", matchIntelligenceController.listPredictions);
matchIntelligenceRouter.get("/matches/:matchId/predictions/latest", matchIntelligenceController.latestPrediction);
matchIntelligenceRouter.post("/matches/:matchId/predict", matchIntelligenceController.createPrediction);
matchIntelligenceRouter.post("/matches/:matchId/result", matchIntelligenceController.registerMatchResult);
matchIntelligenceRouter.get("/matches/:matchId/comparison", matchIntelligenceController.comparePredictions);
