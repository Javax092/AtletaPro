import { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma.js";

export const matchIntelligenceRepository = {
  findClubById: (clubId: string) =>
    prisma.club.findUnique({
      where: { id: clubId },
    }),

  findMatchById: (clubId: string, matchId: string) =>
    prisma.match.findFirst({
      where: { id: matchId, clubId },
    }),

  findMatchWithPredictions: (clubId: string, matchId: string) =>
    prisma.match.findFirst({
      where: { id: matchId, clubId },
      include: {
        predictions: {
          orderBy: [{ createdAt: "desc" }],
        },
      },
    }),

  listMatches: (clubId: string) =>
    prisma.match.findMany({
      where: { clubId },
      orderBy: { matchDate: "desc" },
      include: {
        intelligenceReports: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    }),

  listActiveAthletes: (clubId: string) =>
    prisma.athlete.findMany({
      where: { clubId, isActive: true },
      orderBy: { fullName: "asc" },
    }),

  listRecentMetrics: (clubId: string, fromDate: Date, toDate?: Date) =>
    prisma.performanceMetric.findMany({
      where: {
        clubId,
        recordedAt: {
          gte: fromDate,
          ...(toDate ? { lte: toDate } : {}),
        },
      },
      orderBy: [{ athleteId: "asc" }, { recordedAt: "desc" }],
      include: {
        athlete: true,
      },
    }),

  listLatestRisks: (clubId: string, athleteIds: string[], toDate?: Date) =>
    prisma.injuryRiskAnalysis.findMany({
      where: {
        clubId,
        athleteId: {
          in: athleteIds,
        },
        ...(toDate
          ? {
              createdAt: {
                lte: toDate,
              },
            }
          : {}),
      },
      orderBy: [{ athleteId: "asc" }, { createdAt: "desc" }],
      include: {
        athlete: true,
        performanceMetric: true,
      },
    }),

  createReport: (data: {
    clubId: string;
    matchId: string;
    status: string;
    source: string;
    opponentStrengthInput?: number;
    teamStrengthScore: number;
    opponentStrengthScore: number;
    availabilityScore: number;
    readinessScore: number;
    loadScore: number;
    squadDepthScore: number;
    winProbability: number;
    drawProbability: number;
    lossProbability: number;
    strongerSide: string;
    summary: string;
    explanation: string;
    payloadJson?: Prisma.InputJsonValue;
  }) =>
    prisma.matchIntelligenceReport.create({
      data,
    }),

  listReports: (clubId: string) =>
    prisma.matchIntelligenceReport.findMany({
      where: { clubId },
      orderBy: [{ createdAt: "desc" }],
      include: {
        match: true,
      },
    }),

  findLatestReportByMatch: (clubId: string, matchId: string) =>
    prisma.matchIntelligenceReport.findFirst({
      where: { clubId, matchId },
      orderBy: { createdAt: "desc" },
      include: {
        match: true,
      },
    }),

  createSnapshot: (data: {
    clubId: string;
    matchId?: string;
    referenceDate: Date;
    overallScore: number;
    squadAvailability: number;
    aggregatedRisk: number;
    aggregatedFatigue: number;
    summary: string;
    observations?: string;
    payloadJson?: Prisma.InputJsonValue;
  }) =>
    prisma.teamStrengthSnapshot.create({
      data,
      include: {
        match: true,
      },
    }),

  listSnapshots: (clubId: string) =>
    prisma.teamStrengthSnapshot.findMany({
      where: { clubId },
      orderBy: [{ referenceDate: "desc" }, { createdAt: "desc" }],
      include: {
        match: true,
      },
    }),

  findLatestSnapshot: (clubId: string) =>
    prisma.teamStrengthSnapshot.findFirst({
      where: { clubId },
      orderBy: [{ referenceDate: "desc" }, { createdAt: "desc" }],
      include: {
        match: true,
      },
    }),

  findLatestSnapshotByMatch: (clubId: string, matchId: string) =>
    prisma.teamStrengthSnapshot.findFirst({
      where: { clubId, matchId },
      orderBy: [{ referenceDate: "desc" }, { createdAt: "desc" }],
      include: {
        match: true,
      },
    }),

  findLatestPublicContext: (clubId: string, matchId?: string) =>
    prisma.publicTeamContext.findFirst({
      where: {
        clubId,
        ...(matchId ? { matchId } : {}),
      },
      orderBy: [{ collectedAt: "desc" }, { createdAt: "desc" }],
      include: {
        match: true,
      },
    }),

  createPrediction: (data: {
    clubId: string;
    matchId: string;
    status: string;
    source: string;
    homeWinProbability: number;
    drawProbability: number;
    awayWinProbability: number;
    favoriteTeam: string;
    predictedOutcome: string;
    confidenceScore: number;
    homeTeamStrength: number;
    awayTeamStrength: number;
    actualResult?: string;
    resultRecordedAt?: Date;
    explanation: string;
    keyFactorsJson?: Prisma.InputJsonValue;
    payloadJson?: Prisma.InputJsonValue;
  }) =>
    prisma.matchPrediction.create({
      data,
      include: {
        match: true,
      },
    }),

  listPredictionsByMatch: (clubId: string, matchId: string) =>
    prisma.matchPrediction.findMany({
      where: { clubId, matchId },
      orderBy: [{ createdAt: "desc" }],
      include: {
        match: true,
      },
    }),

  listPredictionsByClub: (clubId: string) =>
    prisma.matchPrediction.findMany({
      where: { clubId },
      orderBy: [{ createdAt: "desc" }],
      include: {
        match: true,
      },
    }),

  findLatestPredictionByMatch: (clubId: string, matchId: string) =>
    prisma.matchPrediction.findFirst({
      where: { clubId, matchId },
      orderBy: [{ createdAt: "desc" }],
      include: {
        match: true,
      },
    }),

  findPredictionById: (clubId: string, predictionId: string) =>
    prisma.matchPrediction.findFirst({
      where: { id: predictionId, clubId },
      include: {
        match: true,
      },
    }),

  updateMatchResult: (clubId: string, matchId: string, data: {
    teamGoals: number;
    opponentGoals: number;
    actualResult: string;
    resultRecordedAt: Date;
    status: "COMPLETED";
  }) =>
    prisma.match.updateMany({
      where: { id: matchId, clubId },
      data,
    }),

  syncPredictionsWithActualResult: (clubId: string, matchId: string, actualResult: string, resultRecordedAt: Date) =>
    prisma.matchPrediction.updateMany({
      where: { clubId, matchId },
      data: {
        actualResult,
        resultRecordedAt,
      },
    }),
};
