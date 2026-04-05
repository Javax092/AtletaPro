import { z } from "zod";
import { matchIntelligenceRepository } from "../repositories/matchIntelligenceRepository.js";
import { buildSquadSnapshot, clamp, round } from "./matchIntelligenceCore.js";
import { HttpError } from "../utils/httpError.js";

const requestSchema = z
  .object({
    matchId: z.string().min(1).optional(),
    formation: z.string().trim().default("4-3-3"),
    lineupSize: z.coerce.number().min(5).max(15).default(11),
    opponentContext: z.string().trim().max(1000).optional(),
    opponentStrengthOverride: z.coerce.number().min(0).max(100).optional(),
  })
  .strict()
  .optional();

const positionPriority: Record<string, number> = {
  Goleiro: 100,
  Zagueiro: 92,
  Lateral: 88,
  Volante: 86,
  "Meio-campo": 84,
  "Meia ofensivo": 82,
  Ponta: 80,
  Atacante: 85,
};

export const lineupIntelligenceService = {
  async suggestLineup(clubId: string, input: unknown) {
    const payload = requestSchema.parse(input);
    const { activeAthletes, recentMetrics, latestRisks, teamStrengthScore } = await buildSquadSnapshot(clubId, new Date());

    if (activeAthletes.length === 0) {
      throw new HttpError(409, "No active athletes available for lineup intelligence");
    }

    const riskByAthlete = new Map(latestRisks.map((item) => [item.athleteId, item]));
    const metricByAthlete = new Map(recentMetrics.map((item) => [item.athleteId, item]));

    const ranked = activeAthletes
      .map((athlete) => {
        const latestMetric = metricByAthlete.get(athlete.id);
        const latestRisk = riskByAthlete.get(athlete.id);
        const readiness = clamp(
          70 +
            (latestMetric?.sleepHours ?? 7) * 3 -
            (latestMetric?.fatigueLevel ?? 4) * 6 -
            (latestRisk?.riskScore ?? 28) * 0.28 +
            (positionPriority[athlete.position] ?? 72) * 0.12,
        );

        return {
          athleteId: athlete.id,
          fullName: athlete.fullName,
          position: athlete.position,
          readinessScore: round(readiness),
          riskLevel: latestRisk?.riskLevel ?? "LOW",
          fatigueLevel: round(latestMetric?.fatigueLevel ?? 4),
          workload: round(latestMetric?.workload ?? 0),
          explanation: [
            `Prontidão calculada em ${round(readiness)}.`,
            latestRisk ? `Último risco: ${latestRisk.riskLevel}.` : "Sem risco recente relevante.",
            latestMetric ? `Fadiga recente: ${round(latestMetric.fatigueLevel ?? 4)}.` : "Sem métrica recente; atleta avaliado com baseline neutro.",
          ],
        };
      })
      .sort((left, right) => right.readinessScore - left.readinessScore);

    const lineupSize = Math.min(payload?.lineupSize ?? 11, ranked.length);
    const lineup = ranked.slice(0, lineupSize);
    const alternatives = ranked.slice(lineupSize, lineupSize + 5);
    const opponentStrength = payload?.opponentStrengthOverride ?? 55;
    const summary =
      opponentStrength >= teamStrengthScore
        ? "A escalação prioriza confiabilidade física e controle de risco para enfrentar um adversário forte."
        : "A escalação prioriza os atletas com melhor prontidão recente para maximizar agressividade competitiva.";

    return {
      formation: payload?.formation ?? "4-3-3",
      matchId: payload?.matchId ?? null,
      lineup,
      alternatives,
      summary,
      explanation:
        "A IA combina prontidão física, fadiga, risco mais recente e peso posicional para ordenar o elenco disponível.",
      explainability: {
        title: "Escalação inteligente",
        summary: "Cada atleta recebeu uma nota de prontidão a partir de risco, fadiga, sono e prioridade posicional.",
        factors: [
          `Força atual do elenco: ${round(teamStrengthScore)}.`,
          `Força do adversário considerada: ${round(opponentStrength)}.`,
          payload?.opponentContext ? `Contexto adicional do adversário: ${payload.opponentContext}` : "Sem contexto textual adicional do adversário.",
        ],
      },
    };
  },
};
