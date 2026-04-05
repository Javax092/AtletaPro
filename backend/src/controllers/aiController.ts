import { NextFunction, Request, Response } from "express";
import { aiService } from "../services/aiService.js";

export const aiController = {
  async health(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await aiService.healthCheck();
      res.status(result.statusCode).json(result);
    } catch (error) {
      next(error);
    }
  },
};

