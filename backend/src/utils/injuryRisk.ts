type RiskInput = {
  workload?: number | null;
  fatigueLevel?: number | null;
  sorenessLevel?: number | null;
  sleepHours?: number | null;
  accelCount?: number | null;
  decelCount?: number | null;
  avgHeartRateBpm?: number | null;
  sessionMinutes?: number | null;
  perceivedEffort?: number | null;
};

export const calculateInjuryRisk = (input: RiskInput) => {
  const workload = input.workload ?? 0;
  const fatigue = input.fatigueLevel ?? 0;
  const soreness = input.sorenessLevel ?? 0;
  const avgHeartRateBpm = input.avgHeartRateBpm ?? 0;
  const sessionMinutes = input.sessionMinutes ?? 0;
  const perceivedEffort = input.perceivedEffort ?? 0;
  const sleepPenalty = Math.max(0, 8 - (input.sleepHours ?? 8)) * 5;
  const movementLoad = ((input.accelCount ?? 0) + (input.decelCount ?? 0)) * 0.12;
  const heartRatePenalty = avgHeartRateBpm >= 170 ? 14 : avgHeartRateBpm >= 160 ? 9 : avgHeartRateBpm >= 150 ? 5 : 0;
  const durationPenalty = sessionMinutes >= 95 ? 12 : sessionMinutes >= 80 ? 7 : sessionMinutes >= 65 ? 3 : 0;
  const effortPenalty = perceivedEffort >= 8 ? 10 : perceivedEffort >= 6.5 ? 5 : perceivedEffort >= 5.5 ? 2 : 0;
  const workloadComponent = Math.min(32, workload / 18);

  const rawScore =
    workloadComponent +
    fatigue * 8 +
    soreness * 7 +
    sleepPenalty +
    movementLoad +
    heartRatePenalty +
    durationPenalty +
    effortPenalty;
  const riskScore = Math.max(0, Math.min(100, Number(rawScore.toFixed(2))));

  let riskLevel = "LOW";
  if (riskScore >= 70) riskLevel = "HIGH";
  else if (riskScore >= 40) riskLevel = "MEDIUM";

  const summaryParts = [
    workload >= 430 ? "carga elevada" : undefined,
    avgHeartRateBpm >= 155 ? "frequencia cardiaca acima do normal" : undefined,
    perceivedEffort >= 6.5 && sessionMinutes >= 75 ? "esforco sustentado por muitos minutos" : undefined,
    fatigue >= 6 ? "fadiga alta" : undefined,
    soreness >= 6 ? "dor muscular elevada" : undefined,
  ].filter(Boolean);

  const summary =
    summaryParts.length > 0
      ? `Risco ${riskLevel.toLowerCase()} puxado por ${summaryParts.slice(0, 3).join(", ")}.`
      : `Risco ${riskLevel.toLowerCase()} com sinais fisicos dentro da faixa esperada.`;

  return {
    riskScore,
    riskLevel,
    summary,
    explanation: `${summary} Carga ${workload}, fadiga ${fatigue}, dor ${soreness}, FC media ${avgHeartRateBpm} e minutos ${sessionMinutes} influenciaram o score.`,
  };
};
