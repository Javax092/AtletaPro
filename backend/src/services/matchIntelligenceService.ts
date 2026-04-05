import { z } from "zod";
import { matchIntelligenceRepository } from "../repositories/matchIntelligenceRepository.js";
import { HttpError } from "../utils/httpError.js";
import { buildSquadSnapshot, clamp, round } from "./matchIntelligenceCore.js";

const analyzeSchema = z
  .object({
    opponentStrengthOverride: z.coerce.number().min(0).max(100).optional(),
  })
  .strict()
  .optional();

const snapshotSchema = z
  .object({
    referenceDate: z.coerce.date().optional(),
    matchId: z.string().min(1).optional(),
    observations: z.string().trim().max(1000).optional(),
  })
  .strict()
  .optional();

const probabilityRound = (value: number) => Math.round(value * 1000) / 1000;

const normalizeProbabilities = (win: number, draw: number, loss: number) => {
  const total = win + draw + loss;
  return {
    winProbability: probabilityRound(win / total),
    drawProbability: probabilityRound(draw / total),
    lossProbability: probabilityRound(loss / total),
  };
};

const toPct = (value: number) => `${Math.round(value * 100)}%`;

export const matchIntelligenceService = {
  listMatches(clubId: string) {
    return matchIntelligenceRepository.listMatches(clubId);
  },

  listReports(clubId: string) {
    return matchIntelligenceRepository.listReports(clubId);
  },

  listSnapshots(clubId: string) {
    return matchIntelligenceRepository.listSnapshots(clubId);
  },

  async getLatestReport(clubId: string, matchId: string) {
    const report = await matchIntelligenceRepository.findLatestReportByMatch(clubId, matchId);
    if (!report) {
      throw new HttpError(404, "Match intelligence report not found");
    }

    return report;
  },

  async getLatestSnapshot(clubId: string) {
    const snapshot = await matchIntelligenceRepository.findLatestSnapshot(clubId);
    if (!snapshot) {
      throw new HttpError(404, "Team strength snapshot not found");
    }

    return snapshot;
  },

  async analyzeMatch(clubId: string, matchId: string, input: unknown) {
    const payload = analyzeSchema.parse(input);
    const match = await matchIntelligenceRepository.findMatchById(clubId, matchId);

    if (!match) {
      throw new HttpError(404, "Match not found");
    }

    const referenceDate = new Date();
    const {
      activeAthletes,
      athletesWithMetrics,
      coverageRatio,
      avgRiskScore,
      highRiskCount,
      avgFatigue,
      avgSleep,
      avgWorkload,
      availabilityScore,
      readinessScore,
      loadScore,
      squadDepthScore,
      teamStrengthScore,
    } = await buildSquadSnapshot(clubId, referenceDate);

    const opponentStrengthScore = round(payload?.opponentStrengthOverride ?? 55);
    const strengthDelta = teamStrengthScore - opponentStrengthScore;

    let strongerSide = "BALANCED";
    if (strengthDelta >= 5) strongerSide = "OUR_TEAM";
    if (strengthDelta <= -5) strongerSide = "OPPONENT";

    const rawWin = clamp(36 + strengthDelta * 1.15, 12, 76) / 100;
    const rawDraw = clamp(26 - Math.abs(strengthDelta) * 0.22, 14, 30) / 100;
    const rawLoss = Math.max(0.08, 1 - rawWin - rawDraw);
    const probabilities = normalizeProbabilities(rawWin, rawDraw, rawLoss);

    const factors = [
      {
        key: "availability",
        label: "Disponibilidade do elenco",
        impact: availabilityScore >= 65 ? "positive" : availabilityScore <= 45 ? "negative" : "neutral",
        value: round(availabilityScore),
        detail: `${highRiskCount} atleta(s) em risco alto entre ${activeAthletes.length} ativo(s).`,
      },
      {
        key: "readiness",
        label: "Recencia de dados e prontidao",
        impact: readinessScore >= 65 ? "positive" : readinessScore <= 45 ? "negative" : "neutral",
        value: round(readinessScore),
        detail: `${athletesWithMetrics}/${activeAthletes.length} atletas com metricas recentes (${toPct(coverageRatio)} de cobertura).`,
      },
      {
        key: "load",
        label: "Carga recente",
        impact: loadScore >= 65 ? "positive" : loadScore <= 45 ? "negative" : "neutral",
        value: round(loadScore),
        detail: `Carga media ${round(avgWorkload)} com fadiga media ${round(avgFatigue)}.`,
      },
      {
        key: "depth",
        label: "Profundidade do elenco",
        impact: squadDepthScore >= 65 ? "positive" : squadDepthScore <= 45 ? "negative" : "neutral",
        value: round(squadDepthScore),
        detail: `${activeAthletes.length} atletas ativos no clube para a leitura atual.`,
      },
    ];

    const summary =
      strongerSide === "OUR_TEAM"
        ? `O clube chega mais forte que o baseline do adversario, com vantagem puxada por disponibilidade e leitura recente do elenco.`
        : strongerSide === "OPPONENT"
          ? `O adversario baseline aparece mais forte no momento, principalmente porque a condicao atual do elenco ainda nao sustenta vantagem clara.`
          : `O confronto aparece equilibrado no momento, sem vantagem estatistica clara entre clube e baseline do adversario.`;

    const explanation =
      `Forca do time calculada a partir de ${activeAthletes.length} atletas ativos, ${athletesWithMetrics} com metricas nos ultimos 14 dias e media de risco ${round(avgRiskScore)}. ` +
      `A comparacao usa forca do adversario em ${round(opponentStrengthScore)} pontos nesta fase MVP.`;

    return matchIntelligenceRepository.createReport({
      clubId,
      matchId,
      status: "COMPLETED",
      source: "internal-v1",
      opponentStrengthInput: payload?.opponentStrengthOverride,
      teamStrengthScore,
      opponentStrengthScore,
      availabilityScore: round(availabilityScore),
      readinessScore: round(readinessScore),
      loadScore: round(loadScore),
      squadDepthScore: round(squadDepthScore),
      winProbability: probabilities.winProbability,
      drawProbability: probabilities.drawProbability,
      lossProbability: probabilities.lossProbability,
      strongerSide,
      summary,
      explanation,
      payloadJson: {
        activeAthletes: activeAthletes.length,
        athletesWithRecentMetrics: athletesWithMetrics,
        avgRiskScore: round(avgRiskScore),
        highRiskCount,
        avgFatigue: round(avgFatigue),
        avgSleep: round(avgSleep),
        avgWorkload: round(avgWorkload),
        factors,
      },
      });
  },

  async createSnapshot(clubId: string, input: unknown) {
    const payload = snapshotSchema.parse(input);
    const referenceDate = payload?.referenceDate ?? new Date();

    if (payload?.matchId) {
      const match = await matchIntelligenceRepository.findMatchById(clubId, payload.matchId);
      if (!match) {
        throw new HttpError(404, "Match not found");
      }
    }

    const {
      activeAthletes,
      athletesWithMetrics,
      coverageRatio,
      avgRiskScore,
      highRiskCount,
      avgFatigue,
      avgSleep,
      avgWorkload,
      availabilityScore,
      readinessScore,
      loadScore,
      squadDepthScore,
      teamStrengthScore,
    } = await buildSquadSnapshot(clubId, referenceDate);

    const summary =
      `Snapshot gerado com ${activeAthletes.length} atletas ativos, ${athletesWithMetrics} com metricas recentes e score geral ${round(teamStrengthScore)}.`;

    const observationPrefix = payload?.matchId
      ? "Snapshot associado a uma partida para leitura pre-jogo."
      : "Snapshot gerado no nivel do clube, sem vinculo obrigatorio a partida.";

    const observationSuffix = payload?.observations ? ` ${payload.observations}` : "";

    return matchIntelligenceRepository.createSnapshot({
      clubId,
      matchId: payload?.matchId,
      referenceDate,
      overallScore: round(teamStrengthScore),
      squadAvailability: round(availabilityScore),
      aggregatedRisk: round(avgRiskScore),
      aggregatedFatigue: round(avgFatigue),
      summary,
      observations: `${observationPrefix}${observationSuffix}`.trim(),
      payloadJson: {
        activeAthletes: activeAthletes.length,
        athletesWithRecentMetrics: athletesWithMetrics,
        coverageRatio: round(coverageRatio * 100),
        avgRiskScore: round(avgRiskScore),
        highRiskCount,
        avgFatigue: round(avgFatigue),
        avgSleep: round(avgSleep),
        avgWorkload: round(avgWorkload),
        readinessScore: round(readinessScore),
        loadScore: round(loadScore),
        squadDepthScore: round(squadDepthScore),
      },
    });
  },
};
