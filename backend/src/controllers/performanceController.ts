import fs from "node:fs/promises";
import { NextFunction, Request, Response } from "express";
import { performanceService } from "../services/performanceService.js";
import { HttpError } from "../utils/httpError.js";

export const performanceController = {
  async createMetric(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await performanceService.createMetric(req.context!.clubId, req.body, "manual", req.requestId);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  },
  async importCsv(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) throw new HttpError(400, "CSV file is required");
      const content = await fs.readFile(req.file.path, "utf8");
      const result = await performanceService.importCsv(req.context!.clubId, content, req.requestId);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    } finally {
      if (req.file?.path) {
        await fs.unlink(req.file.path).catch(() => undefined);
      }
    }
  },
  async dashboard(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await performanceService.dashboard(req.context!.clubId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },
  async listRisks(req: Request, res: Response, next: NextFunction) {
    try {
      const athleteId = typeof req.query.athleteId === "string" ? req.query.athleteId : undefined;
      const result = await performanceService.listRisks(req.context!.clubId, athleteId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },
};
