export interface AlertItem {
  code: string;
  severity: "HIGH" | "MEDIUM" | "LOW";
  athleteId: string;
  athleteName: string;
  title: string;
  summary: string;
  explanation: string;
  explainability: {
    why: string;
    factors: string[];
  };
  createdAt: string;
}
