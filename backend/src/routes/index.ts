import { Router } from "express";
import { authRouter } from "./authRoutes.js";
import { athleteRouter } from "./athleteRoutes.js";
import { performanceRouter } from "./performanceRoutes.js";
import { matchRouter } from "./matchRoutes.js";
import { matchIntelligenceRouter } from "./matchIntelligenceRoutes.js";
import { publicTeamContextRouter } from "./publicTeamContextRoutes.js";
import { dashboardRouter } from "./dashboardRoutes.js";
import { aiRouter } from "./aiRoutes.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { tenantContextMiddleware } from "../middlewares/tenantContextMiddleware.js";

export const appRouter = Router();

appRouter.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "backend" });
});

appRouter.use("/auth", authRouter);
appRouter.use("/ai", aiRouter);
appRouter.use("/dashboard", authMiddleware, tenantContextMiddleware, dashboardRouter);
appRouter.use("/athletes", authMiddleware, tenantContextMiddleware, athleteRouter);
appRouter.use("/performance", authMiddleware, tenantContextMiddleware, performanceRouter);
appRouter.use("/matches", authMiddleware, tenantContextMiddleware, matchRouter);
appRouter.use("/match-intelligence", authMiddleware, tenantContextMiddleware, matchIntelligenceRouter);
appRouter.use("/public-team-contexts", authMiddleware, tenantContextMiddleware, publicTeamContextRouter);
