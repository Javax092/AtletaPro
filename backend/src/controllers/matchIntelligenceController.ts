import { NextFunction, Request, Response } from "express";
import { matchIntelligenceService } from "../services/matchIntelligenceService.js";
import { matchPredictionService } from "../services/matchPredictionService.js";

const getParam = (value: string | string[] | undefined, name: string) => {
  if (!value || Array.isArray(value)) {
    throw new Error(`${name} is required`);
  }

  return value;
};

export const matchIntelligenceController = {
  async listClubPredictions(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await matchPredictionService.listClubPredictions(req.context!.clubId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  async predictionDetail(req: Request, res: Response, next: NextFunction) {
    try {
      const predictionId = getParam(req.params.predictionId, "predictionId");
      const result = await matchPredictionService.getPredictionById(req.context!.clubId, predictionId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  async listSnapshots(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await matchIntelligenceService.listSnapshots(req.context!.clubId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  async latestSnapshot(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await matchIntelligenceService.getLatestSnapshot(req.context!.clubId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  async listMatches(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await matchIntelligenceService.listMatches(req.context!.clubId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  async listReports(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await matchIntelligenceService.listReports(req.context!.clubId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  async latestByMatch(req: Request, res: Response, next: NextFunction) {
    try {
      const matchId = getParam(req.params.matchId, "matchId");
      const result = await matchIntelligenceService.getLatestReport(req.context!.clubId, matchId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  async analyze(req: Request, res: Response, next: NextFunction) {
    try {
      const matchId = getParam(req.params.matchId, "matchId");
      const result = await matchIntelligenceService.analyzeMatch(req.context!.clubId, matchId, req.body);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  },

  async createPrediction(req: Request, res: Response, next: NextFunction) {
    try {
      const matchId = getParam(req.params.matchId, "matchId");
      const result = await matchPredictionService.createPrediction(req.context!.clubId, matchId, req.body);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  },

  async listPredictions(req: Request, res: Response, next: NextFunction) {
    try {
      const matchId = getParam(req.params.matchId, "matchId");
      const result = await matchPredictionService.listPredictions(req.context!.clubId, matchId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  async latestPrediction(req: Request, res: Response, next: NextFunction) {
    try {
      const matchId = getParam(req.params.matchId, "matchId");
      const result = await matchPredictionService.latestPrediction(req.context!.clubId, matchId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  async registerMatchResult(req: Request, res: Response, next: NextFunction) {
    try {
      const matchId = getParam(req.params.matchId, "matchId");
      const result = await matchPredictionService.registerMatchResult(req.context!.clubId, matchId, req.body);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  async comparePredictions(req: Request, res: Response, next: NextFunction) {
    try {
      const matchId = getParam(req.params.matchId, "matchId");
      const result = await matchPredictionService.comparePredictionsWithResult(req.context!.clubId, matchId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  async createSnapshot(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await matchIntelligenceService.createSnapshot(req.context!.clubId, req.body);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  },
};
