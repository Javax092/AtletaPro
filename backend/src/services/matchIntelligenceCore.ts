import { HttpError } from "../utils/httpError.js";
import { matchIntelligenceRepository } from "../repositories/matchIntelligenceRepository.js";

export const clamp = (value: number, min = 0, max = 100) => Math.min(max, Math.max(min, value));
export const round = (value: number) => Math.round(value * 10) / 10;

const uniqueByAthlete = <T extends { athleteId: string }>(items: T[]) => {
  const map = new Map<string, T>();

  for (const item of items) {
    if (!map.has(item.athleteId)) {
      map.set(item.athleteId, item);
    }
  }

  return [...map.values()];
};

export const buildSquadSnapshot = async (clubId: string, referenceDate: Date) => {
  const activeAthletes = await matchIntelligenceRepository.listActiveAthletes(clubId);
  if (activeAthletes.length === 0) {
    throw new HttpError(409, "At least one active athlete is required to generate a team strength snapshot");
  }

  const athleteIds = activeAthletes.map((athlete) => athlete.id);
  const fromDate = new Date(referenceDate);
  fromDate.setDate(fromDate.getDate() - 14);

  const [recentMetricsRaw, latestRisksRaw] = await Promise.all([
    matchIntelligenceRepository.listRecentMetrics(clubId, fromDate, referenceDate),
    matchIntelligenceRepository.listLatestRisks(clubId, athleteIds, referenceDate),
  ]);

  const recentMetrics = uniqueByAthlete(recentMetricsRaw.filter((metric) => athleteIds.includes(metric.athleteId)));
  const latestRisks = uniqueByAthlete(latestRisksRaw.filter((risk) => athleteIds.includes(risk.athleteId)));

  const athletesWithMetrics = recentMetrics.length;
  const coverageRatio = athletesWithMetrics / activeAthletes.length;
  const avgRiskScore = latestRisks.length
    ? latestRisks.reduce((sum, item) => sum + item.riskScore, 0) / latestRisks.length
    : 35;
  const highRiskCount = latestRisks.filter((item) => item.riskLevel === "HIGH").length;
  const highRiskRatio = highRiskCount / activeAthletes.length;

  const avgFatigue = recentMetrics.length
    ? recentMetrics.reduce((sum, item) => sum + (item.fatigueLevel ?? 4), 0) / recentMetrics.length
    : 4;
  const avgSleep = recentMetrics.length
    ? recentMetrics.reduce((sum, item) => sum + (item.sleepHours ?? 7), 0) / recentMetrics.length
    : 7;
  const avgWorkload = recentMetrics.length
    ? recentMetrics.reduce((sum, item) => sum + (item.workload ?? 320), 0) / recentMetrics.length
    : 320;

  const availabilityScore = clamp(100 - avgRiskScore * 0.55 - highRiskRatio * 28);
  const readinessScore = clamp(coverageRatio * 65 + avgSleep * 4.5 - avgFatigue * 5.5 + 22);
  const loadScore = clamp(avgWorkload / 5.5 - avgFatigue * 3.5 + 24);
  const squadDepthScore = clamp((activeAthletes.length / 18) * 100);
  const teamStrengthScore = round(
    availabilityScore * 0.35 + readinessScore * 0.25 + loadScore * 0.2 + squadDepthScore * 0.2,
  );

  return {
    activeAthletes,
    recentMetrics,
    latestRisks,
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
  };
};
