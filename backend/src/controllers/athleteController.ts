import { NextFunction, Request, Response } from "express";
import fs from "node:fs/promises";
import { athleteService } from "../services/athleteService.js";
import { HttpError } from "../utils/httpError.js";
import { athleteNormalizationService } from "../services/athleteNormalizationService.js";
import { duplicateDetectionService } from "../services/duplicateDetectionService.js";
import { athleteAiProfileService } from "../services/athleteAiProfileService.js";
import { csvImportService } from "../services/csvImportService.js";

const getParam = (value: string | string[] | undefined, name: string) => {
  if (typeof value !== "string" || !value) {
    throw new HttpError(400, `Invalid route parameter: ${name}`);
  }

  return value;
};

export const athleteController = {
  async previewIntelligence(req: Request, res: Response, next: NextFunction) {
    try {
      const normalization = athleteNormalizationService.normalizeAthlete(req.body ?? {});
      const duplicates = await duplicateDetectionService.detect(req.context!.clubId, req.body ?? {});
      res.json({
        normalized: normalization,
        duplicates,
      });
    } catch (error) {
      next(error);
    }
  },
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await athleteService.create(req.context!.clubId, req.body);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  },
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await athleteService.list(req.context!.clubId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },
  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const athleteId = getParam(req.params.athleteId, "athleteId");
      const result = await athleteService.getById(req.context!.clubId, athleteId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },
  async getAiProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const athleteId = getParam(req.params.athleteId, "athleteId");
      const result = await athleteAiProfileService.getProfile(req.context!.clubId, athleteId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },
  async previewCsvImport(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) throw new HttpError(400, "CSV file is required");
      const content = await fs.readFile(req.file.path, "utf8");
      const result = await csvImportService.previewAthletesCsv(req.context!.clubId, content);
      res.json(result);
    } catch (error) {
      next(error);
    } finally {
      if (req.file?.path) {
        await fs.unlink(req.file.path).catch(() => undefined);
      }
    }
  },
  async commitCsvImport(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await csvImportService.commitAthletesImport(req.context!.clubId, req.body, req.requestId);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  },
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const athleteId = getParam(req.params.athleteId, "athleteId");
      const result = await athleteService.update(req.context!.clubId, athleteId, req.body);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },
  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      const athleteId = getParam(req.params.athleteId, "athleteId");
      await athleteService.remove(req.context!.clubId, athleteId);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  },
};
