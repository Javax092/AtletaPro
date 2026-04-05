import { NextFunction, Request, Response } from "express";
import { scoutAIService } from "../services/scoutAIService.js";

export const scoutAIController = {
  async assist(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await scoutAIService.generateInsights(req.context!.clubId, req.body);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },
};
