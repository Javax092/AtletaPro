import { NextFunction, Request, Response } from "express";
import { publicTeamContextService } from "../services/publicTeamContextService.js";

export const publicTeamContextController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await publicTeamContextService.listContexts(req.context!.clubId, req.query);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  async latest(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await publicTeamContextService.latestContext(req.context!.clubId, req.query);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  async createManual(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await publicTeamContextService.createManualContext(req.context!.clubId, req.body);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  },

  async sync(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await publicTeamContextService.syncFromProvider(req.context!.clubId, req.body, req.requestId);
      res.status(result.ok ? 201 : 200).json(result);
    } catch (error) {
      next(error);
    }
  },

  async syncRuns(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await publicTeamContextService.listSyncRuns(req.context!.clubId, req.query);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  async providers(_req: Request, res: Response, next: NextFunction) {
    try {
      const result = publicTeamContextService.listProviders();
      res.json(result);
    } catch (error) {
      next(error);
    }
  },
};
