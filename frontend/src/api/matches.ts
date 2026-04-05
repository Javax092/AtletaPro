import { api } from "./client";
import type { MatchPayload, MatchSummary, MatchVideo } from "../types/match";

export const matchesApi = {
  list: async () => {
    const response = await api.get<MatchSummary[]>("/matches");
    return response.data;
  },
  create: async (payload: MatchPayload) => {
    const response = await api.post<MatchSummary>("/matches", payload);
    return response.data;
  },
  uploadVideo: async (matchId: string, file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await api.post<MatchVideo>(`/matches/${matchId}/videos`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return response.data;
  },
  getVideoFile: async (matchId: string, videoId: string) => {
    const response = await api.get<Blob>(`/matches/${matchId}/videos/${videoId}/file`, {
      responseType: "blob",
    });

    return response.data;
  },
  downloadVideoFile: async (matchId: string, videoId: string) => {
    const response = await api.get<Blob>(`/matches/${matchId}/videos/${videoId}/file`, {
      params: { download: "1" },
      responseType: "blob",
    });

    return response.data;
  },
  deleteVideo: async (matchId: string, videoId: string) => {
    await api.delete(`/matches/${matchId}/videos/${videoId}`);
  },
  deleteMatch: async (matchId: string) => {
    await api.delete(`/matches/${matchId}`);
  },
  processVideo: async (matchId: string, videoId: string) => {
    const response = await api.post(`/matches/${matchId}/videos/${videoId}/process`);
    return response.data;
  },
  getHeatmapFile: async (analysisId: string) => {
    const response = await api.get<Blob>(`/matches/scout/analyses/${analysisId}/heatmap`, {
      responseType: "blob",
    });

    return response.data;
  },
};
