export interface Athlete {
  id: string;
  clubId: string;
  fullName: string;
  position: string;
  birthDate: string | null;
  externalId: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AthleteFormValues {
  fullName: string;
  position: string;
  birthDate: string;
  externalId: string;
}

export interface AthletePayload {
  fullName: string;
  position: string;
  birthDate?: string | null;
  externalId?: string | null;
}

export interface AthleteUpdatePayload {
  fullName?: string;
  position?: string;
  birthDate?: string | null;
  externalId?: string | null;
}

export interface AthleteDuplicateCandidate {
  athleteId: string;
  score: number;
  confidence: "HIGH" | "MEDIUM" | "LOW";
  reasons: string[];
  athlete: Athlete;
}

export interface AthleteExplainability {
  title: string;
  summary: string;
  factors: string[];
}

export interface AthleteIntelligencePreview {
  normalized: {
    fullName: string | null;
    position: string | null;
    birthDate: string | null;
    explainability: AthleteExplainability;
  };
  duplicates: {
    hasStrongDuplicate: boolean;
    matches: AthleteDuplicateCandidate[];
    explainability: AthleteExplainability;
  };
}

export interface AthleteAiProfile {
  athlete: Athlete;
  generatedAt: string;
  technicalProfile: {
    summary: string;
    indicators: {
      averageSprintCount: number;
      averageDistanceMeters: number;
    };
  };
  physicalCondition: {
    summary: string;
    indicators: {
      averageWorkload: number;
      averageFatigue: number;
      latestRiskLevel: string;
      latestRiskScore: number | null;
    };
  };
  performanceTrend: {
    summary: string;
    indicators: {
      workloadDelta: number;
      latestSessionAt: string | null;
    };
  };
  explainability: AthleteExplainability;
  alertsSnapshot: Array<{
    id: string;
    riskLevel: string;
    riskScore: number;
    summary: string;
    explanation: string;
    createdAt: string;
  }>;
}

export interface AthleteCsvPreviewRow {
  tempId: string;
  rowNumber: number;
  raw: Record<string, string>;
  normalizedAthlete: {
    fullName: string;
    position: string;
    birthDate: string | null;
    externalId: string | null;
  };
  metricDraft: {
    recordedAt: string;
    workload?: number;
    distanceMeters?: number;
    sprintCount?: number;
    fatigueLevel?: number;
    sleepHours?: number;
  } | null;
  validation: {
    isValid: boolean;
    issues: string[];
  };
  duplicateMatches: AthleteDuplicateCandidate[];
  explainability: AthleteExplainability;
}

export interface AthleteCsvPreviewResponse {
  summary: {
    totalRows: number;
    previewRows: number;
    detectedColumns: number;
    rowsWithIssues: number;
  };
  detectedColumns: Array<{
    source: string;
    normalized: string;
    mappedField: string | null;
    confidence: number;
  }>;
  rows: AthleteCsvPreviewRow[];
  explainability: AthleteExplainability;
}

export interface AthleteCsvCommitPayloadRow {
  fullName: string;
  position: string;
  birthDate?: string | null;
  externalId?: string | null;
  metric?: {
    recordedAt: string;
    workload?: number;
    distanceMeters?: number;
    sprintCount?: number;
    fatigueLevel?: number;
    sleepHours?: number;
  };
}

export interface AthleteCsvCommitResponse {
  totalReceived: number;
  totalCreated: number;
  totalWithError: number;
  created: Athlete[];
  errors: Array<{
    row: number;
    message: string;
  }>;
}

export type AthleteAvailabilityStatus =
  | "Disponível"
  | "Gerenciar carga"
  | "Em retorno"
  | "Indisponível";

export type AthleteRiskLabel = "Baixo risco" | "Risco moderado" | "Alto risco";

export type AthleteTrendDirection = "up" | "down" | "stable";

export interface AthleteTrendSample {
  label: string;
  load: number;
  risk: number;
  recovery: number;
  intensity: number;
}

export interface SquadAthlete {
  id: string;
  name: string;
  number: number;
  age: number;
  position: "GK" | "RB" | "CB" | "LB" | "DM" | "CM" | "AM" | "RW" | "LW" | "ST";
  status: AthleteAvailabilityStatus;
  physicalScore: number;
  technicalScore: number;
  riskScore: number;
  readinessScore: number;
  availabilityScore: number;
  workload: number;
  fatigue: number;
  sleepHours: number;
  minutesRestriction: number | null;
  trend: AthleteTrendDirection;
  trendValue: number;
  summary: string;
  tags: string[];
  dominantFoot: "Direito" | "Esquerdo";
  profileNote: string;
  recommendation: string;
  latestAlertIds: string[];
  history: AthleteTrendSample[];
}

export interface AthleteProfileSection {
  title: string;
  body: string;
}

export interface AthleteProfile {
  athlete: SquadAthlete;
  automaticSummary: string;
  observations: string[];
  recommendation: string;
  recentHistory: Array<{
    date: string;
    sessionType: string;
    workload: number;
    fatigue: number;
    recovery: number;
    note: string;
  }>;
}
