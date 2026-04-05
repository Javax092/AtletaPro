import { api } from "./client";
import type { AuthResponse } from "../types/auth";

export const authApi = {
  login: async (payload: { email: string; password: string }) => {
    const response = await api.post<AuthResponse>("/auth/login", payload);
    return response.data;
  },
  register: async (payload: {
    clubName: string;
    clubSlug: string;
    adminName: string;
    email: string;
    password: string;
  }) => {
    const response = await api.post<AuthResponse>("/auth/register", payload);
    return response.data;
  },
};

