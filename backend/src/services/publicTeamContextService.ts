import { Prisma } from "@prisma/client";
import { z } from "zod";
import { env } from "../config/env.js";
import { publicTeamContextRepository } from "../repositories/publicTeamContextRepository.js";
import { HttpError } from "../utils/httpError.js";
import { logger } from "../utils/logger.js";
import { publicTeamDataProviderRegistry } from "./public-data/providers/publicTeamDataProviderRegistry.js";

const recentResultSchema = z.enum(["W", "D", "L"]);

const manualContextSchema = z
  .object({
    matchId: z.string().min(1).optional(),
    externalClubName: z.string().trim().min(2).max(120),
    competition: z.string().trim().min(2).max(120).optional(),
    leaguePosition: z.coerce.number().int().positive().max(100).optional(),
    recentResults: z.array(recentResultSchema).max(10).optional(),
    goalDifference: z.coerce.number().int().min(-200).max(200).optional(),
    venueContext: z.enum(["HOME", "AWAY", "NEUTRAL"]).optional(),
    collectedAt: z.coerce.date(),
    externalTeamId: z.string().trim().min(1).max(120).optional(),
    summary: z.string().trim().max(500).optional(),
    payload: z.record(z.string(), z.unknown()).optional(),
  })
  .strict();

const syncContextSchema = z
  .object({
    matchId: z.string().min(1).optional(),
    externalClubName: z.string().trim().min(2).max(120).optional(),
    competition: z.string().trim().min(2).max(120).optional(),
    externalTeamId: z.string().trim().min(1).max(120).optional(),
    venueContext: z.enum(["HOME", "AWAY", "NEUTRAL"]).optional(),
    providerKey: z.string().trim().min(1).max(80).optional(),
  })
  .strict();

const listQuerySchema = z
  .object({
    matchId: z.string().min(1).optional(),
  })
  .strict();

const buildSummary = (data: {
  externalClubName: string;
  competition?: string;
  leaguePosition?: number;
  recentResults?: string[];
  goalDifference?: number;
  venueContext?: string;
}) => {
  const parts = [data.externalClubName];

  if (data.competition) {
    parts.push(`na ${data.competition}`);
  }

  if (typeof data.leaguePosition === "number") {
    parts.push(`em ${data.leaguePosition}o lugar`);
  }

  if (typeof data.goalDifference === "number") {
    parts.push(`com saldo ${data.goalDifference >= 0 ? "+" : ""}${data.goalDifference}`);
  }

  if (data.recentResults?.length) {
    parts.push(`ultimos resultados ${data.recentResults.join("-")}`);
  }

  if (data.venueContext) {
    const venueLabel =
      data.venueContext === "HOME" ? "mando em casa" : data.venueContext === "AWAY" ? "mando fora" : "campo neutro";
    parts.push(venueLabel);
  }

  return parts.join(", ");
};

const toJsonValue = (value: unknown) => JSON.parse(JSON.stringify(value ?? null)) as Prisma.InputJsonValue;

export const publicTeamContextService = {
  async createManualContext(clubId: string, input: unknown) {
    const data = manualContextSchema.parse(input);

    if (data.matchId) {
      const match = await publicTeamContextRepository.findMatchById(clubId, data.matchId);
      if (!match) {
        throw new HttpError(404, "Match not found");
      }
    }

    return publicTeamContextRepository.create({
      clubId,
      matchId: data.matchId,
      externalClubName: data.externalClubName,
      competition: data.competition,
      leaguePosition: data.leaguePosition,
      recentResults: data.recentResults,
      goalDifference: data.goalDifference,
      venueContext: data.venueContext,
      collectedAt: data.collectedAt,
      providerKey: "manual",
      externalTeamId: data.externalTeamId,
      summary:
        data.summary ||
        buildSummary({
          externalClubName: data.externalClubName,
          competition: data.competition,
          leaguePosition: data.leaguePosition,
          recentResults: data.recentResults,
          goalDifference: data.goalDifference,
          venueContext: data.venueContext,
        }),
      payloadJson: (data.payload
        ? { source: "manual", data: data.payload }
        : { source: "manual" }) as Prisma.InputJsonValue,
    });
  },

  async syncFromProvider(clubId: string, input: unknown, requestId?: string) {
    const data = syncContextSchema.parse(input);

    if (data.matchId) {
      const match = await publicTeamContextRepository.findMatchById(clubId, data.matchId);
      if (!match) {
        throw new HttpError(404, "Match not found");
      }
    }

    const provider = publicTeamDataProviderRegistry.get(data.providerKey);
    const requestPayload = {
      matchId: data.matchId,
      externalClubName: data.externalClubName,
      competition: data.competition,
      externalTeamId: data.externalTeamId,
      venueContext: data.venueContext,
    };

    logger.info("public_data.sync.request", {
      requestId,
      clubId,
      providerKey: provider.key,
      matchId: data.matchId,
      externalClubName: data.externalClubName,
      externalTeamId: data.externalTeamId,
    });

    try {
      const record = await provider.fetchTeamContext({
        clubId,
        matchId: data.matchId,
        externalClubName: data.externalClubName,
        competition: data.competition,
        externalTeamId: data.externalTeamId,
        venueContext: data.venueContext,
      });

      const context = await publicTeamContextRepository.create({
        clubId,
        matchId: data.matchId,
        externalClubName: record.externalClubName,
        competition: record.competition,
        leaguePosition: record.leaguePosition,
        recentResults: record.recentResults,
        goalDifference: record.goalDifference,
        venueContext: record.venueContext,
        collectedAt: new Date(record.collectedAt),
        providerKey: provider.key,
        externalTeamId: record.externalTeamId,
        summary:
          record.summary ||
          buildSummary({
            externalClubName: record.externalClubName,
            competition: record.competition,
            leaguePosition: record.leaguePosition,
            recentResults: record.recentResults,
            goalDifference: record.goalDifference,
            venueContext: record.venueContext,
          }),
        payloadJson: {
          source: provider.key,
          data: (record.payload ?? null) as Prisma.InputJsonValue | null,
        } as Prisma.InputJsonValue,
      });

      const syncRun = await publicTeamContextRepository.createSyncRun({
        clubId,
        matchId: data.matchId,
        providerKey: provider.key,
        integrationType: "TEAM_CONTEXT",
        status: "SUCCESS",
        externalClubName: context.externalClubName,
        externalTeamId: context.externalTeamId ?? undefined,
        requestPayload: toJsonValue(requestPayload),
        responsePayload: toJsonValue(record),
      });

      logger.info("public_data.sync.success", {
        requestId,
        clubId,
        providerKey: provider.key,
        matchId: data.matchId,
        syncRunId: syncRun.id,
        contextId: context.id,
      });

      return {
        ok: true,
        syncRun,
        context,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown public data sync error";

      const syncRun = await publicTeamContextRepository.createSyncRun({
        clubId,
        matchId: data.matchId,
        providerKey: provider.key,
        integrationType: "TEAM_CONTEXT",
        status: "FAILED",
        externalClubName: data.externalClubName,
        externalTeamId: data.externalTeamId,
        errorMessage: message,
        requestPayload: toJsonValue(requestPayload),
      });

      logger.error("public_data.sync.failed", {
        requestId,
        clubId,
        providerKey: provider.key,
        matchId: data.matchId,
        syncRunId: syncRun.id,
        message,
      });

      return {
        ok: false,
        syncRun,
        context: null,
        error: {
          message,
        },
      };
    }
  },

  listContexts(clubId: string, query: unknown) {
    const filters = listQuerySchema.parse(query);
    return publicTeamContextRepository.listByClub(clubId, filters.matchId);
  },

  async latestContext(clubId: string, query: unknown) {
    const filters = listQuerySchema.parse(query);
    const context = await publicTeamContextRepository.findLatestByClub(clubId, filters.matchId);

    if (!context) {
      throw new HttpError(404, "Public team context not found");
    }

    return context;
  },

  listSyncRuns(clubId: string, query: unknown) {
    const filters = listQuerySchema.parse(query);
    return publicTeamContextRepository.listSyncRuns(clubId, filters.matchId);
  },

  listProviders() {
    return {
      providers: publicTeamDataProviderRegistry.list(),
      defaultProvider: env.PUBLIC_DATA_PROVIDER_MODE,
    };
  },
};
