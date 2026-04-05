export const METRICS_CSV_HEADERS = [
  "athleteId",
  "recordedAt",
  "distanceMeters",
  "sprintCount",
  "accelCount",
  "decelCount",
  "workload",
  "avgHeartRateBpm",
  "maxHeartRateBpm",
  "sessionMinutes",
  "perceivedEffort",
  "fatigueLevel",
  "sleepHours",
  "sorenessLevel",
] as const;

export interface RiskAnalysis {
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
    fatigueLevel?: number | null;
  } | null;
}

export interface MetricsImportError {
  row: number;
  athleteId?: string;
  message: string;
}

export interface MetricsImportReport {
  expectedHeaders: string[];
  totalRead: number;
  totalImported: number;
  totalWithError: number;
  errors: MetricsImportError[];
}
