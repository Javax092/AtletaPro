export interface DashboardMetricPoint {
  id: string;
  athleteId: string;
  recordedAt: string;
  workload?: number | null;
  fatigueLevel?: number | null;
  sessionMinutes?: number | null;
  avgHeartRateBpm?: number | null;
  distanceMeters?: number | null;
  perceivedEffort?: number | null;
  athlete: {
    id: string;
    fullName: string;
    position?: string;
  };
}

export interface RiskPoint {
  id: string;
  athleteId: string;
  riskScore: number;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  summary: string;
  explanation: string;
  createdAt: string;
  athlete: {
    id: string;
    fullName: string;
    position?: string;
  };
  performanceMetric?: {
    recordedAt: string;
    workload?: number | null;
    avgHeartRateBpm?: number | null;
    sessionMinutes?: number | null;
    perceivedEffort?: number | null;
  } | null;
}

export interface DashboardTrendPoint {
  date: string;
  label: string;
  avgWorkload: number;
  avgFatigue: number;
  metricsCount: number;
}

export interface DashboardResponse {
  metrics: DashboardMetricPoint[];
  risks: RiskPoint[];
}

export type DashboardStatusTone = "success" | "warning" | "danger" | "info" | "neutral";

export interface TrendPoint {
  label: string;
  value: number;
  secondaryValue?: number;
}

export interface DashboardMetricCard {
  id: string;
  label: string;
  value: string;
  delta: number;
  trendLabel: string;
  helper: string;
  icon: string;
  tone: DashboardStatusTone;
}

export interface DashboardInsight {
  id: string;
  title: string;
  description: string;
  tone: DashboardStatusTone;
}

export interface ReadinessSummary {
  fitCount: number;
  preserveCount: number;
  returnCount: number;
  recommendation: string;
}

export interface DashboardSummary {
  clubName: string;
  generatedAt: string;
  teamStatus: string;
  periodLabel: string;
  metrics: DashboardMetricCard[];
  loadTrend: TrendPoint[];
  squadRiskTrend: TrendPoint[];
  positionDistribution: Array<{ label: string; value: number }>;
  topRiskAthletes: Array<{ athleteId: string; name: string; riskScore: number }>;
  topReadinessAthletes: Array<{ athleteId: string; name: string; readinessScore: number }>;
  alertSeverity: Array<{ label: string; value: number }>;
  recentInsights: DashboardInsight[];
  strategicSummary: string[];
  watchlist: string[];
  unavailable: string[];
  mostReady: string[];
  readiness: ReadinessSummary;
}
