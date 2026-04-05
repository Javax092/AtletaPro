import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(4000),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(8),
  JWT_EXPIRES_IN: z.string().default("1d"),
  AI_SERVICE_URL: z.string().url(),
  AI_SERVICE_TIMEOUT_MS: z.coerce.number().int().positive().default(5000),
  PUBLIC_DATA_PROVIDER_MODE: z.enum(["noop", "http"]).default("noop"),
  PUBLIC_DATA_PROVIDER_URL: z.string().url().optional(),
  PUBLIC_DATA_PROVIDER_TIMEOUT_MS: z.coerce.number().int().positive().default(5000),
  PUBLIC_DATA_PROVIDER_TOKEN: z.string().optional(),
  UPLOAD_DIR: z.string().default("uploads"),
});

export const env = envSchema.parse(process.env);
