import { NextFunction, Request, Response } from "express";
import { matchService } from "../services/matchService.js";
import { HttpError } from "../utils/httpError.js";

const getParam = (value: string | string[] | undefined, name: string) => {
  if (typeof value !== "string" || !value) {
    throw new HttpError(400, `Invalid route parameter: ${name}`);
  }

  return value;
};

export const matchController = {
  async createMatch(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await matchService.createMatch(req.context!.clubId, req.body);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  },
  async listMatches(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await matchService.listMatches(req.context!.clubId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },
  async uploadVideo(req: Request, res: Response, next: NextFunction) {
    try {
      const matchId = getParam(req.params.matchId, "matchId");
      const result = await matchService.uploadVideo(req.context!.clubId, matchId, req.file, req.requestId);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  },
  async getVideoFile(req: Request, res: Response, next: NextFunction) {
    try {
      const matchId = getParam(req.params.matchId, "matchId");
      const videoId = getParam(req.params.videoId, "videoId");
      const video = await matchService.getVideoFile(req.context!.clubId, matchId, videoId);
      const disposition = req.query.download === "1" ? "attachment" : "inline";

      res.setHeader("Content-Type", video.mimeType);
      res.setHeader("Content-Disposition", `${disposition}; filename="${video.originalName}"`);
      res.sendFile(video.storagePath);
    } catch (error) {
      next(error);
    }
  },
  async getHeatmapFile(req: Request, res: Response, next: NextFunction) {
    try {
      const analysisId = getParam(req.params.analysisId, "analysisId");
      const analysis = await matchService.getHeatmapFile(req.context!.clubId, analysisId);
      res.setHeader("Content-Type", "image/png");
      res.setHeader("Content-Disposition", `inline; filename="heatmap-${analysis.id}.png"`);
      res.sendFile(analysis.heatmapPath!);
    } catch (error) {
      next(error);
    }
  },
  async processVideo(req: Request, res: Response, next: NextFunction) {
    try {
      const matchId = getParam(req.params.matchId, "matchId");
      const videoId = getParam(req.params.videoId, "videoId");
      const result = await matchService.processVideo(req.context!.clubId, matchId, videoId, req.requestId);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  },
  async listScoutAnalyses(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await matchService.listScoutAnalyses(req.context!.clubId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },
  async deleteVideo(req: Request, res: Response, next: NextFunction) {
    try {
      const matchId = getParam(req.params.matchId, "matchId");
      const videoId = getParam(req.params.videoId, "videoId");
      const result = await matchService.deleteVideo(req.context!.clubId, matchId, videoId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },
  async deleteMatch(req: Request, res: Response, next: NextFunction) {
    try {
      const matchId = getParam(req.params.matchId, "matchId");
      const result = await matchService.deleteMatch(req.context!.clubId, matchId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },
};
