import axios from "axios";
import { z } from "zod";
import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";

const healthResponseSchema = z.object({
  status: z.string(),
  service: z.string(),
  environment: z.string().optional(),
});

const videoProcessResponseSchema = z.object({
  club_id: z.string(),
  match_id: z.string(),
  status: z.enum(["COMPLETED"]),
  summary: z.string(),
  heatmapPath: z.string(),
  sampledFrames: z.number(),
  totalFrames: z.number(),
  durationSeconds: z.number(),
  sampleIntervalSeconds: z.number(),
  dominantRegions: z.array(
    z.object({
      region: z.string(),
      score: z.number(),
    }),
  ),
});

const aiMetricSchema = z.object({
  recordedAt: z.string(),
  distanceMeters: z.number().nullable().optional(),
  sprintCount: z.number().nullable().optional(),
  accelCount: z.number().nullable().optional(),
  decelCount: z.number().nullable().optional(),
  workload: z.number().nullable().optional(),
  avgHeartRateBpm: z.number().nullable().optional(),
  maxHeartRateBpm: z.number().nullable().optional(),
  sessionMinutes: z.number().nullable().optional(),
  perceivedEffort: z.number().nullable().optional(),
  fatigueLevel: z.number().nullable().optional(),
  sleepHours: z.number().nullable().optional(),
  sorenessLevel: z.number().nullable().optional(),
});

const injuryRiskResponseSchema = z.object({
  riskScore: z.number(),
  riskLevel: z.enum(["LOW", "MEDIUM", "HIGH"]),
  summary: z.string(),
  explanation: z.string(),
  factors: z
    .array(
      z.object({
        code: z.string(),
        label: z.string(),
        impact: z.number(),
        detail: z.string(),
      }),
    )
    .default([]),
});

const aiHttpClient = axios.create({
  baseURL: env.AI_SERVICE_URL,
  timeout: env.AI_SERVICE_TIMEOUT_MS,
});

const describeAxiosError = (error: unknown) => {
  if (!axios.isAxiosError(error)) {
    return {
      statusCode: 502,
      message: "Unexpected error while contacting AI service",
      detail: "Unknown client error",
    };
  }

  if (error.code === "ECONNABORTED") {
    return {
      statusCode: 504,
      message: "AI service request timed out",
      detail: `Timeout after ${env.AI_SERVICE_TIMEOUT_MS}ms`,
    };
  }

  if (!error.response) {
    return {
      statusCode: 502,
      message: "Unable to connect to AI service",
      detail: error.message,
    };
  }

  return {
    statusCode: 502,
    message: "AI service returned an unexpected response",
    detail: typeof error.response.data === "string" ? error.response.data : JSON.stringify(error.response.data),
  };
};

export const aiService = {
  async healthCheck() {
    const startedAt = Date.now();

    try {
      const response = await aiHttpClient.get("/health");
      const parsed = healthResponseSchema.safeParse(response.data);

      if (!parsed.success) {
        return {
          ok: false,
          statusCode: 502,
          message: "AI service returned an invalid health payload",
          aiServiceUrl: env.AI_SERVICE_URL,
          responseTimeMs: Date.now() - startedAt,
          detail: parsed.error.flatten(),
        };
      }

      return {
        ok: true,
        statusCode: 200,
        message: "AI service reachable",
        aiServiceUrl: env.AI_SERVICE_URL,
        responseTimeMs: Date.now() - startedAt,
        data: parsed.data,
      };
    } catch (error) {
      const parsedError = describeAxiosError(error);

      return {
        ok: false,
        statusCode: parsedError.statusCode,
        message: parsedError.message,
        aiServiceUrl: env.AI_SERVICE_URL,
        responseTimeMs: Date.now() - startedAt,
        detail: parsedError.detail,
      };
    }
  },

  async processVideo(params: {
    fileBuffer: Buffer;
    mimeType: string;
    originalName: string;
    clubId: string;
    matchId: string;
    requestId?: string;
  }) {
    logger.info("ai.video_process.request", {
      requestId: params.requestId,
      clubId: params.clubId,
      matchId: params.matchId,
      fileName: params.originalName,
      mimeType: params.mimeType,
      payloadBytes: params.fileBuffer.length,
      aiServiceUrl: env.AI_SERVICE_URL,
    });

    const response = await aiHttpClient.post("/api/video/process", params.fileBuffer, {
      headers: {
        "Content-Type": params.mimeType,
        "x-file-name": params.originalName,
        "x-club-id": params.clubId,
        "x-match-id": params.matchId,
        ...(params.requestId ? { "x-request-id": params.requestId } : {}),
      },
      maxBodyLength: Infinity,
    });

    const result = videoProcessResponseSchema.parse(response.data);

    logger.info("ai.video_process.response", {
      requestId: params.requestId,
      clubId: params.clubId,
      matchId: params.matchId,
      status: result.status,
      sampledFrames: result.sampledFrames,
      durationSeconds: result.durationSeconds,
    });

    return result;
  },

  async analyzeInjuryRisk(params: {
    clubId: string;
    athleteId: string;
    metricId: string;
    currentMetric: z.input<typeof aiMetricSchema>;
    recentMetrics: z.input<typeof aiMetricSchema>[];
    requestId?: string;
  }) {
    const payload = {
      clubId: params.clubId,
      athleteId: params.athleteId,
      metricId: params.metricId,
      currentMetric: aiMetricSchema.parse(params.currentMetric),
      recentMetrics: z.array(aiMetricSchema).parse(params.recentMetrics),
    };

    logger.info("ai.injury_risk.request", {
      requestId: params.requestId,
      clubId: params.clubId,
      athleteId: params.athleteId,
      metricId: params.metricId,
      recentMetricsCount: payload.recentMetrics.length,
      aiServiceUrl: env.AI_SERVICE_URL,
    });

    const response = await aiHttpClient.post("/api/injury-risk/analyze", payload);
    const result = injuryRiskResponseSchema.parse(response.data);

    logger.info("ai.injury_risk.response", {
      requestId: params.requestId,
      clubId: params.clubId,
      athleteId: params.athleteId,
      metricId: params.metricId,
      riskLevel: result.riskLevel,
      riskScore: result.riskScore,
    });

    return result;
  },
};
