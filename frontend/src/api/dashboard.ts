import { api } from "./client";
import type { DashboardResponse } from "../types/dashboard";

export const dashboardApi = {
  get: async () => {
    const response = await api.get<DashboardResponse>("/performance/dashboard");
    return response.data;
  },
};

