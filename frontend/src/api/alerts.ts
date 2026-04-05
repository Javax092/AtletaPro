import { api } from "./client";
import type { AlertItem } from "../types/alerts";

export const alertsApi = {
  list: async () => {
    const response = await api.get<AlertItem[]>("/alerts");
    return response.data;
  },
};
