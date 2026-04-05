import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { HttpError } from "../utils/httpError.js";
import { logger } from "../utils/logger.js";

export const errorHandler = (error: Error, req: Request, res: Response, _next: NextFunction) => {
  if (error instanceof ZodError) {
    logger.warn("request.invalid_payload", {
      requestId: req.requestId,
      method: req.method,
      path: req.originalUrl,
      issues: error.issues.map((issue) => ({
        path: issue.path.join(".") || "body",
        message: issue.message,
      })),
    });

    return res.status(400).json({
      message: "Invalid request payload",
      issues: error.issues.map((issue) => ({
        path: issue.path.join(".") || "body",
        message: issue.message,
      })),
    });
  }

  if (error instanceof HttpError) {
    logger.warn("request.http_error", {
      requestId: req.requestId,
      method: req.method,
      path: req.originalUrl,
      statusCode: error.statusCode,
      message: error.message,
    });

    return res.status(error.statusCode).json({ message: error.message });
  }

  logger.error("request.unhandled_error", {
    requestId: req.requestId,
    method: req.method,
    path: req.originalUrl,
    message: error.message,
    stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
  });

  return res.status(500).json({
    message: "Internal server error",
    detail: process.env.NODE_ENV === "development" ? error.message : undefined,
  });
};
