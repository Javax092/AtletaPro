type PredictionInput = {
  clubName: string;
  opponentName: string;
  teamStrengthScore: number;
  squadAvailability: number;
  aggregatedRisk: number;
  aggregatedFatigue: number;
  readinessScore?: number;
  loadScore?: number;
  squadDepthScore?: number;
  opponentStrengthScore: number;
  publicFormScore?: number;
  publicTableScore?: number;
  publicGoalDiffScore?: number;
  venueContext: "HOME" | "AWAY" | "NEUTRAL";
  hasPublicData: boolean;
  hasSnapshot: boolean;
  coverageRatio: number;
};

export type PredictionFactor = {
  key: string;
  label: string;
  impact: "positive" | "negative" | "neutral";
  value: number;
  detail: string;
};

type PredictionResult = {
  homeWinProbability: number;
  drawProbability: number;
  awayWinProbability: number;
  favoriteTeam: string;
  confidenceScore: number;
  explanation: string;
  keyFactors: PredictionFactor[];
  homeTeamStrength: number;
  awayTeamStrength: number;
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const round1 = (value: number) => Math.round(value * 10) / 10;

const toPercentTriplet = (homeWin: number, draw: number, awayWin: number) => {
  const roundedHome = round1(homeWin);
  const roundedDraw = round1(draw);
  const roundedAway = round1(100 - roundedHome - roundedDraw);

  return {
    homeWinProbability: roundedHome,
    drawProbability: roundedDraw,
    awayWinProbability: round1(roundedAway),
  };
};

const logistic = (value: number) => 1 / (1 + Math.exp(-value));

export const matchPredictionEngine = {
  calculate(input: PredictionInput): PredictionResult {
    const availabilityAdjustment = (input.squadAvailability - 60) * 0.14;
    const riskAdjustment = (35 - input.aggregatedRisk) * 0.11;
    const fatigueAdjustment = (4 - input.aggregatedFatigue) * 2.4;
    const readinessAdjustment = ((input.readinessScore ?? 50) - 50) * 0.08;
    const formAdjustment = ((input.publicFormScore ?? 50) - 50) * 0.05;
    const tableAdjustment = ((input.publicTableScore ?? 55) - 55) * 0.04;
    const goalDiffAdjustment = ((input.publicGoalDiffScore ?? 50) - 50) * 0.04;
    const homeAdvantage = input.venueContext === "HOME" ? 6 : input.venueContext === "AWAY" ? -6 : 0;

    const ourAdjustedStrength = clamp(
      input.teamStrengthScore + availabilityAdjustment + riskAdjustment + fatigueAdjustment + readinessAdjustment,
      20,
      95,
    );

    const opponentAdjustedStrength = clamp(
      input.opponentStrengthScore + formAdjustment + tableAdjustment + goalDiffAdjustment,
      20,
      95,
    );

    const homeTeamStrength = round1(
      input.venueContext === "HOME" ? ourAdjustedStrength + 3 : input.venueContext === "AWAY" ? opponentAdjustedStrength + 3 : ourAdjustedStrength,
    );
    const awayTeamStrength = round1(
      input.venueContext === "HOME" ? opponentAdjustedStrength : input.venueContext === "AWAY" ? ourAdjustedStrength : opponentAdjustedStrength,
    );

    const delta = (ourAdjustedStrength - opponentAdjustedStrength) + homeAdvantage;
    const drawProbability = clamp(26 - Math.abs(delta) * 0.18, 16, 30);
    const remainingProbability = 100 - drawProbability;
    const homeShare = logistic(delta / 10);
    const rawHomeWin = remainingProbability * homeShare;
    const rawAwayWin = remainingProbability - rawHomeWin;
    const probabilities = toPercentTriplet(rawHomeWin, drawProbability, rawAwayWin);

    const topProbability = Math.max(
      probabilities.homeWinProbability,
      probabilities.drawProbability,
      probabilities.awayWinProbability,
    );
    const secondProbability = [probabilities.homeWinProbability, probabilities.drawProbability, probabilities.awayWinProbability]
      .sort((a, b) => b - a)[1];

    const confidenceScore = round1(
      clamp(
        (topProbability - secondProbability) * 2.2 +
          input.coverageRatio * 15 +
          (input.hasPublicData ? 12 : 0) +
          (input.hasSnapshot ? 8 : 0),
        35,
        92,
      ),
    );

    const favoriteTeam =
      probabilities.drawProbability >= probabilities.homeWinProbability &&
      probabilities.drawProbability >= probabilities.awayWinProbability
        ? "DRAW"
        : probabilities.homeWinProbability > probabilities.awayWinProbability
          ? input.venueContext === "AWAY"
            ? input.opponentName
            : input.clubName
          : input.venueContext === "AWAY"
            ? input.clubName
            : input.opponentName;

    const keyFactors: PredictionFactor[] = [
      {
        key: "team_strength",
        label: "Forca atual do time",
        impact: input.teamStrengthScore >= input.opponentStrengthScore ? "positive" : "negative",
        value: round1(input.teamStrengthScore),
        detail: `Score interno atual do clube contra adversario estimado em ${round1(input.opponentStrengthScore)}.`,
      },
      {
        key: "availability",
        label: "Disponibilidade do elenco",
        impact: input.squadAvailability >= 65 ? "positive" : input.squadAvailability <= 45 ? "negative" : "neutral",
        value: round1(input.squadAvailability),
        detail: `Disponibilidade atual com risco medio ${round1(input.aggregatedRisk)} e fadiga ${round1(input.aggregatedFatigue)}.`,
      },
      {
        key: "recent_form",
        label: "Forma recente",
        impact: (input.publicFormScore ?? input.readinessScore ?? 50) >= 55 ? "positive" : (input.publicFormScore ?? input.readinessScore ?? 50) <= 45 ? "negative" : "neutral",
        value: round1(input.publicFormScore ?? input.readinessScore ?? 50),
        detail: input.hasPublicData
          ? "Forma recente derivada do contexto publico do adversario e da recencia interna."
          : "Sem contexto publico recente; leitura apoiada apenas na base interna.",
      },
      {
        key: "venue",
        label: "Mando de campo",
        impact: input.venueContext === "HOME" ? "positive" : input.venueContext === "AWAY" ? "negative" : "neutral",
        value: input.venueContext === "HOME" ? 1 : input.venueContext === "AWAY" ? -1 : 0,
        detail:
          input.venueContext === "HOME"
            ? "O clube joga em casa nesta estimativa."
            : input.venueContext === "AWAY"
              ? "O clube joga fora nesta estimativa."
              : "Partida tratada como neutra nesta fase.",
      },
    ];

    const explanation =
      `Previsao heuristica explicavel baseada em forca interna do clube, disponibilidade, risco medio, fadiga, mando e contexto publico recente quando disponivel. ` +
      `Nao representa certeza de resultado; apenas uma distribuicao probabilistica com confianca ${confidenceScore}.`;

    return {
      ...probabilities,
      favoriteTeam,
      confidenceScore,
      explanation,
      keyFactors,
      homeTeamStrength,
      awayTeamStrength,
    };
  },
};
