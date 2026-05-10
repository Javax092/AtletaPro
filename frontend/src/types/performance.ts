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

export type PerformanceCsvHeader = (typeof METRICS_CSV_HEADERS)[number];

export interface PerformanceRecord {
  id: string;
  athleteId: string;
  recordedAt: string;
  distanceMeters: number | null;
  sprintCount: number | null;
  accelCount: number | null;
  decelCount: number | null;
  workload: number | null;
  avgHeartRateBpm: number | null;
  maxHeartRateBpm: number | null;
  sessionMinutes: number | null;
  perceivedEffort: number | null;
  fatigueLevel: number | null;
  sleepHours: number | null;
  sorenessLevel: number | null;
  source: "api" | "seed" | "manual" | "csv";
  createdAt: string;
  updatedAt: string;
}

export interface PerformanceRecordInput {
  athleteId: string;
  recordedAt: string;
  distanceMeters?: number | null;
  sprintCount?: number | null;
  accelCount?: number | null;
  decelCount?: number | null;
  workload?: number | null;
  avgHeartRateBpm?: number | null;
  maxHeartRateBpm?: number | null;
  sessionMinutes?: number | null;
  perceivedEffort?: number | null;
  fatigueLevel?: number | null;
  sleepHours?: number | null;
  sorenessLevel?: number | null;
}

export interface PerformanceFormValues {
  athleteId: string;
  recordedAt: string;
  distanceMeters: string;
  sprintCount: string;
  accelCount: string;
  decelCount: string;
  workload: string;
  avgHeartRateBpm: string;
  maxHeartRateBpm: string;
  sessionMinutes: string;
  perceivedEffort: string;
  fatigueLevel: string;
  sleepHours: string;
  sorenessLevel: string;
}

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

export interface CsvPreviewRow {
  row: number;
  athleteId: string;
  athleteName?: string;
  values: Record<string, string>;
  record: PerformanceRecordInput | null;
  errors: string[];
}

export interface CsvPreviewResult {
  expectedHeaders: string[];
  totalRead: number;
  validRows: CsvPreviewRow[];
  invalidRows: CsvPreviewRow[];
}
