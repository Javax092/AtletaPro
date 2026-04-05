import { UserRole } from "@prisma/client";

export interface AuthContext {
  userId: string;
  clubId: string;
  role: UserRole;
}

export interface RequestContext {
  userId: string;
  clubId: string;
  role: UserRole;
}

declare global {
  namespace Express {
    interface Request {
      auth?: AuthContext;
      context?: RequestContext;
      requestId?: string;
    }
  }
}

export {};
