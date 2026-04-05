import { api } from "./client";
import type { Athlete, AthletePayload, AthleteUpdatePayload } from "../types/athlete";

export const athleteApi = {
  list: async () => {
    const response = await api.get<Athlete[]>("/athletes");
    return response.data;
  },
  getById: async (athleteId: string) => {
    const response = await api.get<Athlete>(`/athletes/${athleteId}`);
    return response.data;
  },
  create: async (payload: AthletePayload) => {
    const response = await api.post<Athlete>("/athletes", payload);
    return response.data;
  },
  update: async (athleteId: string, payload: AthleteUpdatePayload) => {
    const response = await api.put<Athlete>(`/athletes/${athleteId}`, payload);
    return response.data;
  },
  deactivate: async (athleteId: string) => {
    await api.delete(`/athletes/${athleteId}`);
  },
};
