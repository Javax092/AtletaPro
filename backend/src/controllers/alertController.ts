import { NextFunction, Request, Response } from "express";
import { alertService } from "../services/alertService.js";

export const alertController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const athleteId = typeof req.query.athleteId === "string" ? req.query.athleteId : undefined;
      const result = await alertService.listAlerts(req.context!.clubId, athleteId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },
};
