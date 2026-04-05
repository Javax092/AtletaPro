import { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma.js";

export const matchRepository = {
  createMatch: (clubId: string, data: { title: string; opponent: string; matchDate: Date; competition?: string }) =>
    prisma.match.create({
      data: { clubId, ...data },
      include: { videos: true, scoutReports: true },
    }),

  findMatchById: (clubId: string, matchId: string) =>
    prisma.match.findFirst({ where: { id: matchId, clubId } }),

  findVideoById: (clubId: string, matchId: string, videoId: string) =>
    prisma.matchVideo.findFirst({
      where: {
        id: videoId,
        clubId,
        matchId,
      },
    }),

  listMatches: (clubId: string) =>
    prisma.match.findMany({
      where: { clubId },
      orderBy: { matchDate: "desc" },
      include: {
        videos: {
          orderBy: { uploadedAt: "desc" },
        },
        scoutReports: {
          orderBy: { createdAt: "desc" },
        },
      },
    }),

  findScoutAnalysisById: (clubId: string, analysisId: string) =>
    prisma.scoutAnalysis.findFirst({
      where: {
        id: analysisId,
        clubId,
      },
    }),

  createVideo: (data: {
    clubId: string;
    matchId: string;
    filename: string;
    originalName: string;
    mimeType: string;
    sizeBytes: number;
    storagePath: string;
  }) =>
    prisma.matchVideo.create({
      data,
    }),

  deleteVideo: (videoId: string) =>
    prisma.matchVideo.deleteMany({
      where: { id: videoId },
    }),

  deleteMatch: (clubId: string, matchId: string) =>
    prisma.match.deleteMany({
      where: {
        id: matchId,
        clubId,
      },
    }),

  markVideoProcessed: (videoId: string) =>
    prisma.matchVideo.update({
      where: { id: videoId },
      data: {
        processedAt: new Date(),
        status: "COMPLETED",
      } satisfies Prisma.MatchVideoUpdateInput,
    }),

  markVideoProcessing: (videoId: string) =>
    prisma.matchVideo.update({
      where: { id: videoId },
      data: {
        status: "PROCESSING",
      } satisfies Prisma.MatchVideoUpdateInput,
    }),

  markVideoFailed: (videoId: string) =>
    prisma.matchVideo.update({
      where: { id: videoId },
      data: {
        status: "FAILED",
      } satisfies Prisma.MatchVideoUpdateInput,
    }),

  createScoutAnalysis: (data: {
    clubId: string;
    matchId: string;
    matchVideoId?: string;
    analysisType: string;
    status: string;
    summary: string;
    heatmapPath?: string;
    payloadJson?: Prisma.InputJsonValue;
  }) => prisma.scoutAnalysis.create({ data }),

  listScoutAnalyses: (clubId: string) =>
    prisma.scoutAnalysis.findMany({
      where: { clubId },
      orderBy: { createdAt: "desc" },
      include: { match: true, matchVideo: true },
    }),
};
