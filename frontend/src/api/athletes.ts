import { api } from "./client";
import type {
  Athlete,
  AthleteAiProfile,
  AthleteCsvCommitPayloadRow,
  AthleteCsvCommitResponse,
  AthleteCsvPreviewResponse,
  AthleteIntelligencePreview,
  AthletePayload,
  AthleteUpdatePayload,
} from "../types/athlete";

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
  previewIntelligence: async (payload: Partial<AthletePayload>) => {
    const response = await api.post<AthleteIntelligencePreview>("/athletes/intelligence/preview", payload);
    return response.data;
  },
  getAiProfile: async (athleteId: string) => {
    const response = await api.get<AthleteAiProfile>(`/athletes/${athleteId}/ai-profile`);
    return response.data;
  },
  previewCsvImport: async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await api.post<AthleteCsvPreviewResponse>("/athletes/import/csv/preview", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },
  commitCsvImport: async (rows: AthleteCsvCommitPayloadRow[]) => {
    const response = await api.post<AthleteCsvCommitResponse>("/athletes/import/csv/commit", { rows });
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
