import { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma.js";

export const publicTeamContextRepository = {
  findMatchById: (clubId: string, matchId: string) =>
    prisma.match.findFirst({
      where: { id: matchId, clubId },
    }),

  create: (data: {
    clubId: string;
    matchId?: string;
    externalClubName: string;
    competition?: string;
    leaguePosition?: number;
    recentResults?: Prisma.InputJsonValue;
    goalDifference?: number;
    venueContext?: string;
    collectedAt: Date;
    providerKey: string;
    externalTeamId?: string;
    summary?: string;
    payloadJson?: Prisma.InputJsonValue;
  }) =>
    prisma.publicTeamContext.create({
      data,
      include: {
        match: true,
      },
    }),

  listByClub: (clubId: string, matchId?: string) =>
    prisma.publicTeamContext.findMany({
      where: {
        clubId,
        ...(matchId ? { matchId } : {}),
      },
      orderBy: [{ collectedAt: "desc" }, { createdAt: "desc" }],
      include: {
        match: true,
      },
    }),

  findLatestByClub: (clubId: string, matchId?: string) =>
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

  createSyncRun: (data: {
    clubId: string;
    matchId?: string;
    providerKey: string;
    integrationType: string;
    status: string;
    externalClubName?: string;
    externalTeamId?: string;
    errorMessage?: string;
    requestPayload?: Prisma.InputJsonValue;
    responsePayload?: Prisma.InputJsonValue;
  }) =>
    prisma.publicDataSyncRun.create({
      data,
      include: {
        match: true,
      },
    }),

  listSyncRuns: (clubId: string, matchId?: string) =>
    prisma.publicDataSyncRun.findMany({
      where: {
        clubId,
        ...(matchId ? { matchId } : {}),
      },
      orderBy: [{ createdAt: "desc" }],
      include: {
        match: true,
      },
    }),
};
