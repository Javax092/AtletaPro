import { api } from "./client";
import type {
  LineupSuggestionResponse,
  MatchIntelligenceMatchItem,
  MatchIntelligenceReport,
  MatchPrediction,
} from "../types/matchIntelligence";

export const matchIntelligenceApi = {
  listMatches: async () => {
    const response = await api.get<MatchIntelligenceMatchItem[]>("/match-intelligence/matches");
    return response.data;
  },
  listReports: async () => {
    const response = await api.get<MatchIntelligenceReport[]>("/match-intelligence/reports");
    return response.data;
  },
  analyzeMatch: async (matchId: string, payload?: { opponentStrengthOverride?: number }) => {
    const response = await api.post<MatchIntelligenceReport>(`/match-intelligence/matches/${matchId}/analyze`, payload ?? {});
    return response.data;
  },
  predictMatch: async (
    matchId: string,
    payload?: { referenceDate?: string; opponentStrengthOverride?: number; venueContext?: "HOME" | "AWAY" | "NEUTRAL" },
  ) => {
    const response = await api.post<MatchPrediction>(`/match-intelligence/matches/${matchId}/predict`, payload ?? {});
    return response.data;
  },
  listPredictions: async (matchId: string) => {
    const response = await api.get<MatchPrediction[]>(`/match-intelligence/matches/${matchId}/predictions`);
    return response.data;
  },
  suggestLineup: async (payload?: {
    matchId?: string;
    formation?: string;
    lineupSize?: number;
    opponentContext?: string;
    opponentStrengthOverride?: number;
  }) => {
    const response = await api.post<LineupSuggestionResponse>("/match/intelligence", payload ?? {});
    return response.data;
  },
};
