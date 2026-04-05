export interface ScoutAnalysis {
  id: string;
  analysisType: string;
  status: string;
  summary: string;
  heatmapPath?: string | null;
  match: {
    title: string;
    opponent: string;
  };
}

