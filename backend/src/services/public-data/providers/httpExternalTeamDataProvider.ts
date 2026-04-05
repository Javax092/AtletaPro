import axios from "axios";
import { z } from "zod";
import { env } from "../../../config/env.js";
import { HttpError } from "../../../utils/httpError.js";
import type { ExternalTeamContextRecord, ExternalTeamContextSyncInput, ExternalTeamDataProvider } from "./externalTeamDataProvider.js";

const responseSchema = z.object({
  externalClubName: z.string(),
  competition: z.string().optional(),
  leaguePosition: z.number().int().optional(),
  recentResults: z.array(z.enum(["W", "D", "L"])).optional(),
  goalDifference: z.number().int().optional(),
  venueContext: z.enum(["HOME", "AWAY", "NEUTRAL"]).optional(),
  collectedAt: z.string(),
  externalTeamId: z.string().optional(),
  summary: z.string().optional(),
  payload: z.record(z.string(), z.unknown()).optional(),
});

export class HttpExternalTeamDataProvider implements ExternalTeamDataProvider {
  key = "http";

  async fetchTeamContext(input: ExternalTeamContextSyncInput): Promise<ExternalTeamContextRecord> {
    if (!env.PUBLIC_DATA_PROVIDER_URL) {
      throw new HttpError(503, "PUBLIC_DATA_PROVIDER_URL is not configured");
    }

    const response = await axios.post(
      env.PUBLIC_DATA_PROVIDER_URL,
      {
        clubId: input.clubId,
        matchId: input.matchId,
        externalClubName: input.externalClubName,
        competition: input.competition,
        externalTeamId: input.externalTeamId,
        venueContext: input.venueContext,
      },
      {
        timeout: env.PUBLIC_DATA_PROVIDER_TIMEOUT_MS,
        headers: {
          "Content-Type": "application/json",
          ...(env.PUBLIC_DATA_PROVIDER_TOKEN ? { Authorization: `Bearer ${env.PUBLIC_DATA_PROVIDER_TOKEN}` } : {}),
        },
      },
    );

    return responseSchema.parse(response.data);
  }
}
