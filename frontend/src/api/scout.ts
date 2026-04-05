import { api } from "./client";
import type { ScoutAnalysis, ScoutAssistResponse } from "../types/scout";

export const scoutApi = {
  list: async () => {
    const response = await api.get<ScoutAnalysis[]>("/matches/scout/analyses");
    return response.data;
  },
  assist: async (payload: { analysisId?: string; matchId?: string; events?: string[]; notes?: string[] }) => {
    const response = await api.post<ScoutAssistResponse>("/scout/assist", payload);
    return response.data;
  },
};
