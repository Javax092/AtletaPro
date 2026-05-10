import cors, { type CorsOptions } from "cors";
import express from "express";
import { appRouter } from "./routes/index.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import { notFound } from "./middlewares/notFound.js";
import { requestContextMiddleware } from "./middlewares/requestContextMiddleware.js";
import { env } from "./config/env.js";
import { logger } from "./utils/logger.js";

export const app = express();

const allowedOrigins = env.CORS_ORIGINS.split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const corsOptions: CorsOptions = {
  credentials: true,
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    logger.warn("cors.origin.rejected", { origin });
    callback(new Error("Origin not allowed by CORS"));
  },
};

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "backend" });
});

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
app.use(requestContextMiddleware);
app.use(express.json({ limit: "10mb" }));
app.use("/api", appRouter);
app.use(notFound);
app.use(errorHandler);
