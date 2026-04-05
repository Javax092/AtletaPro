export type UserRole = "ADMIN" | "STAFF" | "COACH" | "ANALYST";

export interface Club {
  id: string;
  name: string;
  slug: string;
}

export interface User {
  id: string;
  clubId: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface AuthResponse {
  token: string;
  user: User;
  club: Club;
}

