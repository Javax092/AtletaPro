import { squadAthletes } from "./athletesData";
import type { MatchIntelligenceReport, MatchSelectionItem } from "../types/match";

const toSelectionItem = (athleteId: string, justification: string): MatchSelectionItem => {
  const athlete = squadAthletes.find((item) => item.id === athleteId);

  if (!athlete) {
    throw new Error(`Athlete not found: ${athleteId}`);
  }

  const riskLabel =
    athlete.riskScore >= 60 ? "Alto risco" : athlete.riskScore >= 35 ? "Risco moderado" : "Baixo risco";

  return {
    athleteId: athlete.id,
    athleteName: athlete.name,
    position: athlete.position,
    readinessScore: athlete.readinessScore,
    riskLabel,
    status: athlete.status,
    justification,
  };
};

export const matchIntelligenceReport: MatchIntelligenceReport = {
  matchTitle: "Atlético Aurora x Ferroviário Nacional",
  opponent: "Ferroviário Nacional",
  competition: "Liga Regional • Rodada 12",
  tacticalRecommendation:
    "O cenário ideal é pressionar alto no primeiro tempo, preservar o corredor direito em ações máximas repetidas e usar amplitude forte pelo lado esquerdo.",
  idealLineup: [
    toSelectionItem("ath-01", "Alta estabilidade e segurança para sustentar saída curta."),
    toSelectionItem("ath-14", "Boa condição para manter largura sem penalizar a recuperação."),
    toSelectionItem("ath-03", "Zagueiro mais estável do bloco defensivo na semana."),
    toSelectionItem("ath-24", "Complementa a linha com consistência e baixo risco."),
    toSelectionItem("ath-05", "Lado esquerdo pronto para alta repetição de ações."),
    toSelectionItem("ath-17", "Proteção à frente da linha com prontidão sólida."),
    toSelectionItem("ath-07", "Controle de ritmo e suporte entre fases do jogo."),
    toSelectionItem("ath-09", "Meia criativo em condição forte para acelerar o último terço."),
    toSelectionItem("ath-20", "Profundidade no lado direito com boa prontidão atual."),
    toSelectionItem("ath-11", "Melhor combinação entre explosão e recuperação no setor ofensivo."),
    toSelectionItem("ath-12", "Referência estável para sustentar jogo direto e atacar área."),
  ],
  suggestedBench: [
    toSelectionItem("ath-13", "Cobertura segura para a meta."),
    toSelectionItem("ath-15", "Opção de ajuste defensivo."),
    toSelectionItem("ath-18", "Entrada controlada no meio-campo."),
    toSelectionItem("ath-19", "Criatividade extra para segundo tempo."),
    toSelectionItem("ath-22", "Impacto ofensivo de banco."),
    toSelectionItem("ath-23", "Energia e rotação em bloco intermediário."),
  ],
  unavailablePlayers: [
    toSelectionItem("ath-16", "Sem condição competitiva para esta rodada."),
  ],
  preservePlayers: [
    toSelectionItem("ath-02", "Corredor direito em carga alta e com limitação de minutos."),
    toSelectionItem("ath-06", "Volante com recuperação abaixo do ideal no fechamento do microciclo."),
    toSelectionItem("ath-10", "Extremo em zona crítica de risco agudo."),
    toSelectionItem("ath-21", "Recuperação subótima para sequência de ações máximas."),
  ],
  watchlistPlayers: [
    toSelectionItem("ath-04", "Pode ajudar por janela curta, mas ainda sem tolerância total."),
    toSelectionItem("ath-18", "Retorno funcional favorável, porém ainda em progressão."),
  ],
  tacticalNotes: [
    "O lado esquerdo é o setor mais pronto para sustentar ações de alta intensidade do início ao fim.",
    "Os jogadores de maior carga devem entrar em blocos específicos, não em exposição contínua.",
    "A disponibilidade atual favorece um 4-3-3 com extremos agressivos e meio-campo equilibrado.",
  ],
};
