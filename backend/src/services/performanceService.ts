import { z } from "zod";
import { performanceRepository } from "../repositories/performanceRepository.js";
import { athleteRepository } from "../repositories/athleteRepository.js";
import { METRICS_CSV_HEADERS, parseMetricsCsv } from "../utils/csv.js";
import { calculateInjuryRisk } from "../utils/injuryRisk.js";
import { HttpError } from "../utils/httpError.js";
import { aiService } from "./aiService.js";
import { logger } from "../utils/logger.js";

const optionalNumber = z.preprocess((value) => {
  if (value === null || value === undefined) return undefined;
  if (typeof value === "string" && value.trim() === "") return undefined;
  return value;
}, z.coerce.number().finite().optional());

const metricSchema = z.object({
  athleteId: z.string().min(1),
  recordedAt: z.coerce.date(),
  distanceMeters: optionalNumber,
  sprintCount: optionalNumber.pipe(z.number().int().optional()),
  accelCount: optionalNumber.pipe(z.number().int().optional()),
  decelCount: optionalNumber.pipe(z.number().int().optional()),
  workload: optionalNumber,
  avgHeartRateBpm: optionalNumber,
  maxHeartRateBpm: optionalNumber,
  sessionMinutes: optionalNumber,
  perceivedEffort: optionalNumber,
  fatigueLevel: optionalNumber,
  sleepHours: optionalNumber,
  sorenessLevel: optionalNumber,
});

export type MetricsImportError = {
  row: number;
  athleteId?: string;
  message: string;
};

const toAiMetricPayload = (metric: {
  recordedAt: Date;
  distanceMeters?: number | null;
  sprintCount?: number | null;
  accelCount?: number | null;
  decelCount?: number | null;
  workload?: number | null;
  avgHeartRateBpm?: number | null;
  maxHeartRateBpm?: number | null;
  sessionMinutes?: number | null;
  perceivedEffort?: number | null;
  fatigueLevel?: number | null;
  sleepHours?: number | null;
  sorenessLevel?: number | null;
}) => ({
  recordedAt: metric.recordedAt.toISOString(),
  distanceMeters: metric.distanceMeters ?? null,
  sprintCount: metric.sprintCount ?? null,
  accelCount: metric.accelCount ?? null,
  decelCount: metric.decelCount ?? null,
  workload: metric.workload ?? null,
  avgHeartRateBpm: metric.avgHeartRateBpm ?? null,
  maxHeartRateBpm: metric.maxHeartRateBpm ?? null,
  sessionMinutes: metric.sessionMinutes ?? null,
  perceivedEffort: metric.perceivedEffort ?? null,
  fatigueLevel: metric.fatigueLevel ?? null,
  sleepHours: metric.sleepHours ?? null,
  sorenessLevel: metric.sorenessLevel ?? null,
});

const formatZodError = (error: z.ZodError) =>
  error.issues
    .map((issue) => `${issue.path.join(".") || "linha"}: ${issue.message}`)
    .join("; ");

const validateCsvHeaders = (headers: string[]) => {
  const missing = METRICS_CSV_HEADERS.filter((header) => !headers.includes(header));
  const unexpected = headers.filter((header) => !METRICS_CSV_HEADERS.includes(header as (typeof METRICS_CSV_HEADERS)[number]));

  if (missing.length === 0 && unexpected.length === 0) {
    return;
  }

  const parts = [];

  if (missing.length > 0) {
    parts.push(`missing headers: ${missing.join(", ")}`);
  }

  if (unexpected.length > 0) {
    parts.push(`unexpected headers: ${unexpected.join(", ")}`);
  }

  throw new HttpError(400, `Invalid CSV headers, expected: ${METRICS_CSV_HEADERS.join(", ")}. ${parts.join(". ")}`);
};

export const performanceService = {
  async createMetric(clubId: string, input: unknown, source = "manual", requestId?: string) {
    const data = metricSchema.parse(input);
    const athlete = await athleteRepository.findById(clubId, data.athleteId);
    if (!athlete) throw new HttpError(404, "Athlete not found");

    if (source === "csv") {
      const existingMetric = await performanceRepository.findMetricByAthleteAndRecordedAt(
        clubId,
        data.athleteId,
        data.recordedAt,
      );

      if (existingMetric) {
        throw new HttpError(409, "Metric already exists for this athlete and recordedAt");
      }
    }

    const metric = await performanceRepository.createMetric({
      clubId,
      athleteId: data.athleteId,
      recordedAt: data.recordedAt,
      distanceMeters: data.distanceMeters,
      sprintCount: data.sprintCount,
      accelCount: data.accelCount,
      decelCount: data.decelCount,
      workload: data.workload,
      avgHeartRateBpm: data.avgHeartRateBpm,
      maxHeartRateBpm: data.maxHeartRateBpm,
      sessionMinutes: data.sessionMinutes,
      perceivedEffort: data.perceivedEffort,
      fatigueLevel: data.fatigueLevel,
      sleepHours: data.sleepHours,
      sorenessLevel: data.sorenessLevel,
      source,
    });

    const recentMetrics = await performanceRepository.listRecentMetricsByAthlete(clubId, data.athleteId, 6, metric.id);

    const fallbackRisk = calculateInjuryRisk(metric);
    const aiRisk = await aiService
      .analyzeInjuryRisk({
        clubId,
        athleteId: data.athleteId,
        metricId: metric.id,
        currentMetric: toAiMetricPayload(metric),
        recentMetrics: recentMetrics.map(toAiMetricPayload),
        requestId,
      })
      .then((result) => ({ ...result, source: "ai-service" as const }))
      .catch((error) => {
        logger.warn("ai.injury_risk.fallback", {
          requestId,
          clubId,
          athleteId: data.athleteId,
          metricId: metric.id,
          message: error instanceof Error ? error.message : String(error),
        });

        return {
          ...fallbackRisk,
          summary: fallbackRisk.summary,
          explanation: `${fallbackRisk.explanation} Analise gerada pelo fallback local porque o ai-service nao respondeu.`,
          factors: [],
          source: "fallback" as const,
        };
      });

    const riskAnalysis = await performanceRepository.createRiskAnalysis({
      clubId,
      athleteId: data.athleteId,
      performanceMetricId: metric.id,
      riskScore: aiRisk.riskScore,
      riskLevel: aiRisk.riskLevel,
      summary: aiRisk.summary,
      explanation: aiRisk.explanation,
      payloadJson: {
        source: aiRisk.source,
        factors: aiRisk.factors,
      },
    });

    return { metric, riskAnalysis };
  },

  async importCsv(clubId: string, csvContent: string, requestId?: string) {
    const { headers, rows } = parseMetricsCsv(csvContent);
    validateCsvHeaders(headers);

    const imported = [];
    const errors: MetricsImportError[] = [];

    for (const row of rows) {
      try {
        const item = await this.createMetric(clubId, row, "csv", requestId);
        imported.push(item);
      } catch (error) {
        if (error instanceof z.ZodError) {
          errors.push({
            row: row.rowNumber,
            athleteId: row.athleteId || undefined,
            message: formatZodError(error),
          });
          continue;
        }

        if (error instanceof HttpError) {
          errors.push({
            row: row.rowNumber,
            athleteId: row.athleteId || undefined,
            message: error.message,
          });
          continue;
        }

        throw error;
      }
    }

    return {
      expectedHeaders: [...METRICS_CSV_HEADERS],
      totalRead: rows.length,
      totalImported: imported.length,
      totalWithError: errors.length,
      errors,
    };
  },

  async dashboard(clubId: string) {
    const [metrics, risks] = await Promise.all([
      performanceRepository.dashboard(clubId),
      performanceRepository.latestRisks(clubId),
    ]);

    return { metrics, risks };
  },

  async listRisks(clubId: string, athleteId?: string) {
    return performanceRepository.listRiskAnalyses(clubId, athleteId);
  },
};
