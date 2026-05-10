import axios from "axios";
import type {
  DemoAthleteDetailResponse,
  DemoDashboardResponse,
  DemoMatchIntelligenceResponse,
  DemoOverviewResponse,
} from "../types/demo";

const DEMO_API_URL = import.meta.env.VITE_DEMO_API_URL ?? "http://localhost:8001";

const demoApiClient = axios.create({
  baseURL: DEMO_API_URL,
});

export const demoApi = {
  setup: async () => {
    const response = await demoApiClient.post("/demo/setup");
    return response.data;
  },
  train: async () => {
    const response = await demoApiClient.post("/demo/train");
    return response.data;
  },
  overview: async () => {
    const response = await demoApiClient.get<DemoOverviewResponse>("/demo/overview");
    return response.data;
  },
  dashboard: async () => {
    const response = await demoApiClient.get<DemoDashboardResponse>("/demo/dashboard");
    return response.data;
  },
  athletes: async () => {
    const response = await demoApiClient.get<Array<Record<string, unknown>>>("/demo/athletes");
    return response.data;
  },
  athleteDetail: async (athleteId: string) => {
    const response = await demoApiClient.get<DemoAthleteDetailResponse>(`/demo/athletes/${athleteId}`);
    return response.data;
  },
  alerts: async () => {
    const response = await demoApiClient.get<Array<Record<string, unknown>>>("/demo/alerts");
    return response.data;
  },
  matchIntelligence: async () => {
    const response = await demoApiClient.get<DemoMatchIntelligenceResponse>("/demo/match-intelligence");
    return response.data;
  },
  readiness: async () => {
    const response = await demoApiClient.get<Array<Record<string, unknown>>>("/demo/readiness");
    return response.data;
  },
  topRisks: async () => {
    const response = await demoApiClient.get<Array<Record<string, unknown>>>("/demo/top-risks");
    return response.data;
  },
};
