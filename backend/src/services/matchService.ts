import fs from "node:fs/promises";
import { z } from "zod";
import { prisma } from "../config/prisma.js";
import { matchRepository } from "../repositories/matchRepository.js";
import { aiService } from "./aiService.js";
import { HttpError } from "../utils/httpError.js";
import { logger } from "../utils/logger.js";

const createMatchSchema = z.object({
  title: z.string().min(2),
  opponent: z.string().min(2),
  matchDate: z.string().datetime(),
  competition: z.string().trim().optional(),
});

export const matchService = {
  createMatch(clubId: string, input: unknown) {
    const data = createMatchSchema.parse(input);
    return matchRepository.createMatch(clubId, {
      title: data.title,
      opponent: data.opponent,
      matchDate: new Date(data.matchDate),
      competition: data.competition || undefined,
    });
  },

  listMatches(clubId: string) {
    return matchRepository.listMatches(clubId);
  },

  async getVideoFile(clubId: string, matchId: string, videoId: string) {
    const video = await matchRepository.findVideoById(clubId, matchId, videoId);
    if (!video) throw new HttpError(404, "Match video not found");

    return video;
  },

  async getHeatmapFile(clubId: string, analysisId: string) {
    const analysis = await matchRepository.findScoutAnalysisById(clubId, analysisId);
    if (!analysis || !analysis.heatmapPath) {
      throw new HttpError(404, "Heatmap not found");
    }

    return analysis;
  },

  async uploadVideo(clubId: string, matchId: string, file: Express.Multer.File | undefined, requestId?: string) {
    if (!file) throw new HttpError(400, "Video file is required");
    const match = await matchRepository.findMatchById(clubId, matchId);
    if (!match) throw new HttpError(404, "Match not found");

    logger.info("match.video_upload.received", {
      requestId,
      clubId,
      matchId,
      fileName: file.originalname,
      mimeType: file.mimetype,
      sizeBytes: file.size,
    });

    return matchRepository.createVideo({
      clubId,
      matchId,
      filename: file.filename,
      originalName: file.originalname,
      mimeType: file.mimetype,
      sizeBytes: file.size,
      // Local storage for MVP. This remains provider-agnostic for a future S3 swap.
      storagePath: file.path,
    });
  },

  async processVideo(clubId: string, matchId: string, matchVideoId: string, requestId?: string) {
    const match = await matchRepository.findMatchById(clubId, matchId);
    if (!match) throw new HttpError(404, "Match not found");

    const video = await prisma.matchVideo.findFirst({
      where: { id: matchVideoId, clubId, matchId },
    });

    if (!video) throw new HttpError(404, "Match video not found");

    const fileBuffer = await fs.readFile(video.storagePath);
    await matchRepository.markVideoProcessing(video.id);
    logger.info("match.video_process.started", {
      requestId,
      clubId,
      matchId,
      videoId: video.id,
      fileName: video.originalName,
      sizeBytes: video.sizeBytes,
    });

    try {
      const response = await aiService.processVideo({
        fileBuffer,
        mimeType: video.mimeType,
        originalName: video.originalName,
        clubId,
        matchId,
        requestId,
      });

      await matchRepository.markVideoProcessed(video.id);

      return matchRepository.createScoutAnalysis({
        clubId,
        matchId,
        matchVideoId: video.id,
        analysisType: "HEATMAP",
        status: response.status,
        summary: response.summary,
        heatmapPath: response.heatmapPath,
        payloadJson: response,
      });
    } catch (error) {
      await matchRepository.markVideoFailed(video.id);
      logger.error("match.video_process.failed", {
        requestId,
        clubId,
        matchId,
        videoId: video.id,
        message: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  },

  listScoutAnalyses(clubId: string) {
    return matchRepository.listScoutAnalyses(clubId);
  },

  async deleteVideo(clubId: string, matchId: string, videoId: string) {
    const video = await matchRepository.findVideoById(clubId, matchId, videoId);
    if (!video) throw new HttpError(404, "Match video not found");

    await matchRepository.deleteVideo(video.id);
    await fs.unlink(video.storagePath).catch(() => undefined);

    return { success: true };
  },

  async deleteMatch(clubId: string, matchId: string) {
    const match = await prisma.match.findFirst({
      where: { id: matchId, clubId },
      include: {
        videos: true,
      },
    });

    if (!match) throw new HttpError(404, "Match not found");

    await matchRepository.deleteMatch(clubId, matchId);
    await Promise.all(match.videos.map((video) => fs.unlink(video.storagePath).catch(() => undefined)));

    return { success: true };
  },
};
