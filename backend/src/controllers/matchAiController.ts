import { NextFunction, Request, Response } from "express";
import { lineupIntelligenceService } from "../services/lineupIntelligenceService.js";

export const matchAiController = {
  async suggestIntelligence(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await lineupIntelligenceService.suggestLineup(req.context!.clubId, req.body);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },
};
