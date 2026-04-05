import { athleteRepository } from "../repositories/athleteRepository.js";
import { performanceRepository } from "../repositories/performanceRepository.js";

const round = (value: number) => Math.round(value * 10) / 10;

export const alertService = {
  async listAlerts(clubId: string, athleteId?: string) {
    const athletes = athleteId ? [await athleteRepository.findById(clubId, athleteId)].filter(Boolean) : await athleteRepository.list(clubId);
    const alerts = [];

    for (const athlete of athletes) {
      const metrics = await performanceRepository.listRecentMetricsByAthlete(clubId, athlete!.id, 4);
      const risks = await performanceRepository.listRiskAnalyses(clubId, athlete!.id);
      const latestMetric = metrics[0];
      const previousMetric = metrics[1];
      const latestRisk = risks[0];

      if (latestRisk?.riskLevel === "HIGH") {
        alerts.push({
          code: "injury-risk-high",
          severity: "HIGH",
          athleteId: athlete!.id,
          athleteName: athlete!.fullName,
          title: "Risco elevado de lesão",
          summary: latestRisk.summary,
          explanation: latestRisk.explanation,
          explainability: {
            why: "O último cálculo de risco registrou nível HIGH.",
            factors: [`Risk score: ${round(latestRisk.riskScore)}`, "Histórico mais recente priorizado na regra."],
          },
          createdAt: latestRisk.createdAt,
        });
      }

      if (latestMetric?.fatigueLevel != null && latestMetric.fatigueLevel >= 7) {
        alerts.push({
          code: "overload-risk",
          severity: "MEDIUM",
          athleteId: athlete!.id,
          athleteName: athlete!.fullName,
          title: "Sinal de sobrecarga",
          summary: "Fadiga recente acima do ideal para manutenção da carga atual.",
          explanation: "A combinação de fadiga elevada e carga recente sugere redução, rotação ou sessão regenerativa.",
          explainability: {
            why: "Fadiga recente acima do limiar operacional.",
            factors: [
              `Fadiga: ${round(latestMetric.fatigueLevel)}`,
              `Carga: ${round(latestMetric.workload ?? 0)}`,
            ],
          },
          createdAt: latestMetric.recordedAt,
        });
      }

      if (
        latestMetric?.workload != null &&
        previousMetric?.workload != null &&
        previousMetric.workload > 0 &&
        (latestMetric.workload - previousMetric.workload) / previousMetric.workload >= 0.22
      ) {
        alerts.push({
          code: "workload-spike",
          severity: "MEDIUM",
          athleteId: athlete!.id,
          athleteName: athlete!.fullName,
          title: "Pico de carga identificado",
          summary: "A carga subiu de forma abrupta entre as duas sessões mais recentes.",
          explanation: "Variações bruscas de carga aumentam a necessidade de monitorar recuperação e disponibilidade.",
          explainability: {
            why: "A regra compara as duas últimas cargas registradas.",
            factors: [
              `Carga anterior: ${round(previousMetric.workload)}`,
              `Carga atual: ${round(latestMetric.workload)}`,
            ],
          },
          createdAt: latestMetric.recordedAt,
        });
      }

      if (
        latestRisk?.riskLevel === "MEDIUM" &&
        latestMetric?.fatigueLevel != null &&
        latestMetric.fatigueLevel >= 6 &&
        latestMetric.sleepHours != null &&
        latestMetric.sleepHours <= 6
      ) {
        alerts.push({
          code: "unsafe-return",
          severity: "HIGH",
          athleteId: athlete!.id,
          athleteName: athlete!.fullName,
          title: "Retorno pós-lesão pede cautela",
          summary: "O atleta apresenta combinação de risco moderado, fadiga e sono abaixo do ideal.",
          explanation: "O retorno competitivo pode ser inseguro sem melhora de recuperação e nova revisão de prontidão.",
          explainability: {
            why: "A combinação de risco moderado com sinais de recuperação ruim aumenta a preocupação.",
            factors: [
              `Risco: ${round(latestRisk.riskScore)}`,
              `Fadiga: ${round(latestMetric.fatigueLevel)}`,
              `Sono: ${round(latestMetric.sleepHours)}`,
            ],
          },
          createdAt: latestMetric.recordedAt,
        });
      }
    }

    return alerts.sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());
  },
};
