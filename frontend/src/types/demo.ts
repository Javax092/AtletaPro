export interface DemoCardItem {
  label: string;
  value: string | number;
  helper: string;
  tone: string;
}

export interface DemoDashboardResponse {
  cards: DemoCardItem[];
  weeklyLoadSeries: Array<{ date: string; avgWorkload: number; avgFatigue: number }>;
  riskSeries: Array<{ athleteId: string; athleteName: string; riskProbability: number; riskLevel: string }>;
  topRisks: Array<Record<string, unknown>>;
  topForm: Array<Record<string, unknown>>;
  positionDistribution: Array<{ position: string; count: number }>;
  alertSeverityDistribution: Array<{ severity: string; count: number }>;
  recoveryTrend: Array<{ date: string; avgWorkload: number; avgFatigue: number }>;
  recentAlerts: Array<Record<string, unknown>>;
  overloadAthletes: Array<Record<string, unknown>>;
  mostReadyAthletes: Array<Record<string, unknown>>;
  unavailableAthletes: Array<Record<string, unknown>>;
  watchlistAthletes: Array<Record<string, unknown>>;
}

export interface DemoOverviewResponse {
  clubName: string;
  generatedAt: string;
  squad: {
    monitoredAthletes: number;
    available: number;
    monitoring: number;
    returning: number;
    unavailable: number;
  };
  commercialStory: string[];
  headlineMetrics: {
    highRiskAthletes: number;
    criticalAlerts: number;
    availabilityRate: number;
  };
}

export interface DemoAthleteDetailResponse {
  athlete: Record<string, unknown>;
  latestRisk: Record<string, unknown> | null;
  profile: Record<string, unknown> | null;
  recentLoads: Array<Record<string, unknown>>;
  recentAlerts: Array<Record<string, unknown>>;
}

export interface DemoMatchIntelligenceResponse {
  match: Record<string, unknown>;
  recommendation: {
    match_id: string;
    lineup_json: Array<Record<string, unknown>>;
    bench_json: Array<Record<string, unknown>>;
    unavailable_json: Array<Record<string, unknown>>;
    watchlist_json: Array<Record<string, unknown>>;
    summary: string;
    generated_at: string;
  };
}
