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
