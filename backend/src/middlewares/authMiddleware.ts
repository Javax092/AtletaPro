import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { UserRole } from "@prisma/client";
import { env } from "../config/env.js";
import { HttpError } from "../utils/httpError.js";
import { logger } from "../utils/logger.js";

type JwtPayload = {
  sub: string;
  clubId: string;
  role: UserRole;
};

export const authMiddleware = (req: Request, _res: Response, next: NextFunction) => {
  const authorization = req.headers.authorization;

  if (!authorization?.startsWith("Bearer ")) {
    logger.warn("auth.token.missing", {
      requestId: req.requestId,
      method: req.method,
      path: req.originalUrl,
    });
    return next(new HttpError(401, "Missing authorization token"));
  }

  const token = authorization.replace("Bearer ", "");

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    req.auth = { userId: payload.sub, clubId: payload.clubId, role: payload.role };
    return next();
  } catch {
    logger.warn("auth.token.invalid", {
      requestId: req.requestId,
      method: req.method,
      path: req.originalUrl,
    });
    return next(new HttpError(401, "Invalid token"));
  }
};
