import { athleteRepository } from "../repositories/athleteRepository.js";
import { performanceRepository } from "../repositories/performanceRepository.js";
import { HttpError } from "../utils/httpError.js";

const average = (values: number[]) => (values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0);
const round = (value: number) => Math.round(value * 10) / 10;

export const athleteAiProfileService = {
  async getProfile(clubId: string, athleteId: string) {
    const athlete = await athleteRepository.findById(clubId, athleteId);
    if (!athlete) {
      throw new HttpError(404, "Athlete not found for this club");
    }

    const [metrics, risks] = await Promise.all([
      performanceRepository.listRecentMetricsByAthlete(clubId, athleteId, 8),
      performanceRepository.listRiskAnalyses(clubId, athleteId),
    ]);

    const recentMetrics = [...metrics].sort((left, right) => new Date(left.recordedAt).getTime() - new Date(right.recordedAt).getTime());
    const latestMetric = recentMetrics[recentMetrics.length - 1] ?? null;
    const previousMetric = recentMetrics[recentMetrics.length - 2] ?? null;
    const latestRisk = risks[0] ?? null;

    const avgDistance = average(recentMetrics.map((item) => item.distanceMeters ?? 0).filter((value) => value > 0));
    const avgWorkload = average(recentMetrics.map((item) => item.workload ?? 0).filter((value) => value > 0));
    const avgFatigue = average(recentMetrics.map((item) => item.fatigueLevel ?? 0).filter((value) => value > 0));
    const avgSprintCount = average(recentMetrics.map((item) => item.sprintCount ?? 0).filter((value) => value > 0));
    const workloadDelta =
      latestMetric && previousMetric && latestMetric.workload != null && previousMetric.workload != null
        ? latestMetric.workload - previousMetric.workload
        : 0;

    const technicalSummary =
      athlete.position.includes("Atac")
        ? "Perfil mais vertical, com tendência a ações de aceleração e ruptura."
        : athlete.position.includes("Meio")
          ? "Perfil de articulação, sustentando volume e conexão entre setores."
          : athlete.position.includes("Zague")
            ? "Perfil de sustentação defensiva, com foco em consistência e leitura posicional."
            : "Perfil equilibrado, com leitura construída a partir das métricas recentes.";

    const physicalCondition =
      avgFatigue >= 6.5 || (latestRisk?.riskLevel === "HIGH")
        ? "Condição física em atenção, com sinais de desgaste acima do ideal para alta exigência."
        : avgFatigue >= 5
          ? "Condição física controlada, mas pedindo monitoramento próximo na próxima sessão."
          : "Condição física estável, sem sinais fortes de limitação no curto prazo.";

    const performanceTrend =
      workloadDelta >= 40
        ? "Tendência recente de alta carga; vale observar resposta de recuperação."
        : workloadDelta <= -40
          ? "Tendência recente de desaceleração de carga, sugerindo alívio ou retomada gradual."
          : "Tendência recente estável, com manutenção do padrão de trabalho.";

    return {
      athlete,
      generatedAt: new Date().toISOString(),
      technicalProfile: {
        summary: technicalSummary,
        indicators: {
          averageSprintCount: round(avgSprintCount),
          averageDistanceMeters: round(avgDistance),
        },
      },
      physicalCondition: {
        summary: physicalCondition,
        indicators: {
          averageWorkload: round(avgWorkload),
          averageFatigue: round(avgFatigue),
          latestRiskLevel: latestRisk?.riskLevel ?? "UNKNOWN",
          latestRiskScore: latestRisk ? round(latestRisk.riskScore) : null,
        },
      },
      performanceTrend: {
        summary: performanceTrend,
        indicators: {
          workloadDelta: round(workloadDelta),
          latestSessionAt: latestMetric?.recordedAt ?? null,
        },
      },
      explainability: {
        title: "Perfil inteligente do atleta",
        summary: "A leitura foi gerada com base em posição, métricas recentes, evolução de carga e último risco conhecido.",
        factors: [
          `Posição considerada: ${athlete.position}.`,
          latestRisk ? `Último risco registrado: ${latestRisk.riskLevel} (${round(latestRisk.riskScore)}).` : "Sem risco recente registrado.",
          recentMetrics.length > 0 ? `${recentMetrics.length} sessões recentes usadas na análise.` : "Sem sessões recentes suficientes; perfil com baixa profundidade.",
        ],
      },
      alertsSnapshot: risks.slice(0, 3),
    };
  },
};
