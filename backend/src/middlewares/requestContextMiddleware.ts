import { randomUUID } from "node:crypto";
import { NextFunction, Request, Response } from "express";
import { logger } from "../utils/logger.js";

export const requestContextMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const requestIdHeader = req.headers["x-request-id"];
  const requestId = typeof requestIdHeader === "string" && requestIdHeader.trim() ? requestIdHeader : randomUUID();
  const startedAt = Date.now();

  req.requestId = requestId;
  res.setHeader("x-request-id", requestId);

  logger.info("request.started", {
    requestId,
    method: req.method,
    path: req.originalUrl,
  });

  res.on("finish", () => {
    logger.info("request.completed", {
      requestId,
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      durationMs: Date.now() - startedAt,
      clubId: req.context?.clubId,
      userId: req.context?.userId,
    });
  });

  next();
};
