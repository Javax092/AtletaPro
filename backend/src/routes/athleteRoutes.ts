import { Router } from "express";
import { athleteController } from "../controllers/athleteController.js";

export const athleteRouter = Router();

athleteRouter.get("/", athleteController.list);
athleteRouter.post("/", athleteController.create);
athleteRouter.get("/:athleteId", athleteController.getById);
athleteRouter.put("/:athleteId", athleteController.update);
athleteRouter.delete("/:athleteId", athleteController.remove);
