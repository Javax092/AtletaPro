import { app } from "./app.js";
import { env } from "./config/env.js";
import { ensureDatabaseCompatibility } from "./config/prisma.js";
import { logger } from "./utils/logger.js";

const bootstrap = async () => {
  logger.info("app.boot.start", {
    port: env.PORT,
    nodeEnv: env.NODE_ENV,
    aiServiceUrl: env.AI_SERVICE_URL,
  });

  await ensureDatabaseCompatibility();

  app.listen(env.PORT, () => {
    logger.info("app.boot.ready", {
      port: env.PORT,
      uploadDir: env.UPLOAD_DIR,
    });
  });
};

bootstrap().catch((error) => {
  logger.error("app.boot.failed", {
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
  });
  process.exit(1);
});
