export type AlertSeverity = "Crítico" | "Alto" | "Moderado";
export type AlertCategory = "Carga" | "Recuperação" | "Disponibilidade" | "Risco agudo" | "Match readiness";

export interface SquadAlert {
  id: string;
  athleteId: string;
  athleteName: string;
  title: string;
  severity: AlertSeverity;
  category: AlertCategory;
  reason: string;
  recommendation: string;
  createdAt: string;
  priority: number;
}
