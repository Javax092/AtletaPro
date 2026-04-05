import { api } from "./client";
import type { MetricsImportReport, RiskAnalysis } from "../types/performance";

export const performanceApi = {
  importCsv: async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await api.post<MetricsImportReport>("/performance/metrics/import-csv", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return response.data;
  },
  listRisks: async (athleteId?: string) => {
    const response = await api.get<RiskAnalysis[]>("/performance/risks", {
      params: athleteId ? { athleteId } : undefined,
    });

    return response.data;
  },
};
