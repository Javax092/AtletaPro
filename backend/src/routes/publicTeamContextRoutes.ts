import { Router } from "express";
import { publicTeamContextController } from "../controllers/publicTeamContextController.js";

export const publicTeamContextRouter = Router();

publicTeamContextRouter.get("/providers", publicTeamContextController.providers);
publicTeamContextRouter.get("/sync-runs", publicTeamContextController.syncRuns);
publicTeamContextRouter.get("/", publicTeamContextController.list);
publicTeamContextRouter.get("/latest", publicTeamContextController.latest);
publicTeamContextRouter.post("/", publicTeamContextController.createManual);
publicTeamContextRouter.post("/sync", publicTeamContextController.sync);
