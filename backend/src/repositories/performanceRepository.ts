import { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma.js";

export const performanceRepository = {
  createMetric: (data: {
    clubId: string;
    athleteId: string;
    recordedAt: Date;
    distanceMeters?: number;
    sprintCount?: number;
    accelCount?: number;
    decelCount?: number;
    workload?: number;
    avgHeartRateBpm?: number;
    maxHeartRateBpm?: number;
    sessionMinutes?: number;
    perceivedEffort?: number;
    fatigueLevel?: number;
    sleepHours?: number;
    sorenessLevel?: number;
    source?: string;
  }) => prisma.performanceMetric.create({ data }),

  findMetricByAthleteAndRecordedAt: (clubId: string, athleteId: string, recordedAt: Date) =>
    prisma.performanceMetric.findFirst({
      where: {
        clubId,
        athleteId,
        recordedAt,
      },
    }),

  listRecentMetricsByAthlete: (clubId: string, athleteId: string, limit = 6, excludeMetricId?: string) =>
    prisma.performanceMetric.findMany({
      where: {
        clubId,
        athleteId,
        ...(excludeMetricId
          ? {
              id: {
                not: excludeMetricId,
              },
            }
          : {}),
      },
      orderBy: { recordedAt: "desc" },
      take: limit,
    }),

  listMetricsByAthlete: (clubId: string, athleteId: string, limit = 20) =>
    prisma.performanceMetric.findMany({
      where: {
        clubId,
        athleteId,
      },
      orderBy: { recordedAt: "desc" },
      take: limit,
    }),

  createRiskAnalysis: (data: {
    clubId: string;
    athleteId: string;
    performanceMetricId?: string;
    riskScore: number;
    riskLevel: string;
    summary: string;
    explanation: string;
    payloadJson?: Prisma.InputJsonValue;
  }) => prisma.injuryRiskAnalysis.create({ data }),

  dashboard: (clubId: string) =>
    prisma.performanceMetric.findMany({
      where: { clubId },
      orderBy: { recordedAt: "asc" },
      include: { athlete: true },
      take: 50,
    }),

  latestRisks: (clubId: string) =>
    prisma.injuryRiskAnalysis.findMany({
      where: { clubId },
      orderBy: { createdAt: "desc" },
      include: { athlete: true, performanceMetric: true },
      take: 10,
    }),

  listRiskAnalyses: (clubId: string, athleteId?: string) =>
    prisma.injuryRiskAnalysis.findMany({
      where: {
        clubId,
        ...(athleteId ? { athleteId } : {}),
      },
      orderBy: { createdAt: "desc" },
      include: { athlete: true, performanceMetric: true },
      take: 50,
    }),
};
