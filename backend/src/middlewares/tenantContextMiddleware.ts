import { NextFunction, Request, Response } from "express";
import { HttpError } from "../utils/httpError.js";

export const tenantContextMiddleware = (req: Request, _res: Response, next: NextFunction) => {
  if (!req.auth) {
    return next(new HttpError(401, "Authentication context not found"));
  }

  req.context = {
    userId: req.auth.userId,
    clubId: req.auth.clubId,
    role: req.auth.role,
  };

  return next();
};

