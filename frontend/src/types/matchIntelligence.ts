export type StrongerSide = "OUR_TEAM" | "OPPONENT" | "BALANCED";
export type MatchPredictionFavoriteTeam = string;

export interface MatchIntelligenceFactor {
  key: string;
  label: string;
  impact: "positive" | "negative" | "neutral";
  value: number;
  detail: string;
}

export interface MatchIntelligencePayload {
  activeAthletes: number;
  athletesWithRecentMetrics: number;
  avgRiskScore: number;
  highRiskCount: number;
  avgFatigue: number;
  avgSleep: number;
  avgWorkload: number;
  factors: MatchIntelligenceFactor[];
}

export interface MatchIntelligenceReport {
  id: string;
  clubId: string;
  matchId: string;
  status: string;
  source: string;
  opponentStrengthInput: number | null;
  teamStrengthScore: number;
  opponentStrengthScore: number;
  availabilityScore: number;
  readinessScore: number;
  loadScore: number;
  squadDepthScore: number;
  winProbability: number;
  drawProbability: number;
  lossProbability: number;
  strongerSide: StrongerSide;
  summary: string;
  explanation: string;
  payloadJson: MatchIntelligencePayload | null;
  createdAt: string;
  updatedAt: string;
  match: {
    id: string;
    title: string;
    opponent: string;
    matchDate: string;
    competition: string | null;
    status: string;
  };
}

export interface MatchIntelligenceMatchItem {
  id: string;
  title: string;
  opponent: string;
  matchDate: string;
  competition: string | null;
  status: string;
  intelligenceReports: MatchIntelligenceReport[];
}

export interface MatchPredictionFactor {
  key: string;
  label: string;
  impact: "positive" | "negative" | "neutral";
  value: number;
  detail: string;
}

export interface MatchPredictionPayload {
  referenceDate: string;
  venueContext: "HOME" | "AWAY" | "NEUTRAL";
  teamStrengthScore: number;
  squadAvailability: number;
  aggregatedRisk: number;
  aggregatedFatigue: number;
  readinessScore: number;
  loadScore: number;
  squadDepthScore: number;
  opponentStrengthScore: number;
  publicContextId: string | null;
  snapshotId: string | null;
  publicFormScore: number;
  publicTableScore: number;
  publicGoalDiffScore: number;
}

export interface MatchPrediction {
  id: string;
  clubId: string;
  matchId: string;
  status: string;
  source: string;
  homeWinProbability: number;
  drawProbability: number;
  awayWinProbability: number;
  favoriteTeam: MatchPredictionFavoriteTeam;
  confidenceScore: number;
  homeTeamStrength: number;
  awayTeamStrength: number;
  actualResult: string | null;
  resultRecordedAt: string | null;
  explanation: string;
  keyFactorsJson: MatchPredictionFactor[] | null;
  payloadJson: MatchPredictionPayload | null;
  createdAt: string;
  updatedAt: string;
  match: {
    id: string;
    title: string;
    opponent: string;
    matchDate: string;
    competition: string | null;
    status: string;
  };
}
