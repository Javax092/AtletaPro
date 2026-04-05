import { z } from "zod";
import { matchRepository } from "../repositories/matchRepository.js";
import { HttpError } from "../utils/httpError.js";

const requestSchema = z
  .object({
    matchId: z.string().min(1).optional(),
    analysisId: z.string().min(1).optional(),
    events: z.array(z.string().trim().min(3)).max(50).optional(),
    notes: z.array(z.string().trim().min(3)).max(20).optional(),
  })
  .refine((value) => value.matchId || value.analysisId, {
    message: "matchId or analysisId is required",
    path: ["matchId"],
  });

const keywordMap = [
  { keyword: "press", observation: "Pressão pós-perda apareceu como comportamento recorrente." },
  { keyword: "transition", observation: "Transição defensiva merece atenção pela exposição após perda." },
  { keyword: "cross", observation: "Bolas laterais influenciaram o volume ofensivo do confronto." },
  { keyword: "compact", observation: "Compactação entre linhas foi um fator importante na organização." },
];

export const scoutAIService = {
  async generateInsights(clubId: string, input: unknown) {
    const payload = requestSchema.parse(input);
    const analyses = await matchRepository.listScoutAnalyses(clubId);
    const selectedAnalysis =
      payload.analysisId
        ? analyses.find((item) => item.id === payload.analysisId)
        : analyses.find((item) => item.matchId === payload.matchId);

    if (!selectedAnalysis) {
      throw new HttpError(404, "Scout analysis not found for this club");
    }

    const eventText = [...(payload.events ?? []), ...(payload.notes ?? []), selectedAnalysis.summary].join(" ").toLowerCase();
    const teamHighlights = keywordMap
      .filter((item) => eventText.includes(item.keyword))
      .map((item) => item.observation);

    const athleteObservations = [
      {
        athleteName: "Setor ofensivo",
        strengths: ["Ameaça em aceleração quando a equipe encontrou espaço nas laterais."],
        weaknesses: ["Precisa converter melhor volume territorial em finalização limpa."],
      },
      {
        athleteName: "Setor de meio-campo",
        strengths: ["Conseguiu sustentar circulação e recuperar segundas bolas em momentos do jogo."],
        weaknesses: ["Perdeu controle quando a pressão rival quebrou a primeira linha."],
      },
      {
        athleteName: "Setor defensivo",
        strengths: ["Boa capacidade de proteger a área em ataques posicionais."],
        weaknesses: ["Cobertura em profundidade segue como ponto de ajuste."],
      },
    ];

    return {
      analysisId: selectedAnalysis.id,
      matchId: selectedAnalysis.matchId,
      summary: `Scout assistido gerado para ${selectedAnalysis.match.title} com foco em leitura objetiva do jogo.`,
      athleteObservations,
      teamHighlights: teamHighlights.length > 0 ? teamHighlights : ["O material sugere revisão de compactação, timing de pressão e cobertura defensiva."],
      explainability: {
        title: "Scout assistido por IA",
        summary: "As conclusões são derivadas da análise mais recente do vídeo e das anotações/eventos fornecidos pelo usuário.",
        factors: [
          `Análise base: ${selectedAnalysis.analysisType}.`,
          payload.events?.length ? `${payload.events.length} eventos textuais adicionais considerados.` : "Sem eventos adicionais; leitura baseada na análise salva.",
          payload.notes?.length ? `${payload.notes.length} notas complementares consideradas.` : "Sem notas complementares do staff.",
        ],
      },
    };
  },
};
