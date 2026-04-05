export interface ScoutAnalysis {
  id: string;
  analysisType: string;
  status: string;
  summary: string;
  heatmapPath?: string | null;
  matchId?: string;
  match: {
    id?: string;
    title: string;
    opponent: string;
  };
}

export interface ScoutAssistResponse {
  analysisId: string;
  matchId: string;
  summary: string;
  athleteObservations: Array<{
    athleteName: string;
    strengths: string[];
    weaknesses: string[];
  }>;
  teamHighlights: string[];
  explainability: {
    title: string;
    summary: string;
    factors: string[];
  };
}
