import { api } from "./client";
import type { ScoutAnalysis } from "../types/scout";

export const scoutApi = {
  list: async () => {
    const response = await api.get<ScoutAnalysis[]>("/matches/scout/analyses");
    return response.data;
  },
};

