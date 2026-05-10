import { squadAthletes } from "./athletesData";
import type { SquadAlert } from "../types/alert";

const athleteById = new Map(squadAthletes.map((athlete) => [athlete.id, athlete]));

const alert = (
  id: string,
  athleteId: string,
  title: string,
  severity: SquadAlert["severity"],
  category: SquadAlert["category"],
  reason: string,
  recommendation: string,
  createdAt: string,
  priority: number,
): SquadAlert => ({
  id,
  athleteId,
  athleteName: athleteById.get(athleteId)?.name ?? "Atleta",
  title,
  severity,
  category,
  reason,
  recommendation,
  createdAt,
  priority,
});

export const squadAlerts: SquadAlert[] = [
  alert("al-01", "ath-02", "Pico de carga no corredor direito", "Alto", "Carga", "A carga de aceleração do lateral subiu 14% contra a média das últimas duas semanas.", "Reduzir exposição a blocos máximos hoje e revisar progressão pré-jogo.", "2026-04-05T08:20:00Z", 95),
  alert("al-02", "ath-06", "Queda de recuperação no volante", "Alto", "Recuperação", "Fadiga subjetiva e sono abaixo do alvo elevaram o risco funcional do setor central.", "Controlar minutos e simplificar o volume de alta intensidade.", "2026-04-05T07:50:00Z", 92),
  alert("al-03", "ath-04", "Retorno com limite competitivo", "Moderado", "Disponibilidade", "O retorno é positivo, mas o atleta ainda não sustenta sequência completa de minutos.", "Planejar entrada progressiva e evitar extensão além de 60 minutos.", "2026-04-05T07:10:00Z", 74),
  alert("al-04", "ath-10", "Risco agudo elevado no extremo", "Crítico", "Risco agudo", "O volume recente de sprints e a piora na recuperação colocaram o atleta na zona vermelha.", "Preservar para uso específico ou reduzir carga do dia imediatamente.", "2026-04-05T08:40:00Z", 99),
  alert("al-05", "ath-16", "Atleta indisponível para o próximo jogo", "Crítico", "Disponibilidade", "O lateral segue fora da disponibilidade competitiva e sem tolerância de jogo.", "Manter fora da convocação e priorizar etapa funcional.", "2026-04-05T06:55:00Z", 97),
  alert("al-06", "ath-18", "Janela curta para retorno", "Moderado", "Match readiness", "O atleta tolera entrada controlada, mas ainda não suporta impacto total da partida.", "Usar apenas em cenário de rotação e por poucos minutos.", "2026-04-05T07:30:00Z", 72),
  alert("al-07", "ath-21", "Fadiga acumulada no lado esquerdo", "Alto", "Recuperação", "A recuperação do extremo caiu em três medições consecutivas.", "Controlar estímulo e considerar banco para o próximo compromisso.", "2026-04-05T08:05:00Z", 90),
  alert("al-08", "ath-10", "Sono insuficiente antes do microciclo decisivo", "Moderado", "Recuperação", "O atacante apresentou duas noites consecutivas abaixo de 6h30.", "Ajustar agenda de recuperação e monitorar resposta hoje.", "2026-04-05T06:40:00Z", 70),
  alert("al-09", "ath-02", "Assimetria de prontidão no corredor", "Moderado", "Match readiness", "Há diferença grande entre carga interna e prontidão de jogo no setor direito.", "Evitar sobreposição de estímulos máximos e reavaliar antes da partida.", "2026-04-05T05:55:00Z", 68),
];
