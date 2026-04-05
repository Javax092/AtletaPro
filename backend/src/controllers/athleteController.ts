import { NextFunction, Request, Response } from "express";
import { athleteService } from "../services/athleteService.js";
import { HttpError } from "../utils/httpError.js";

const getParam = (value: string | string[] | undefined, name: string) => {
  if (typeof value !== "string" || !value) {
    throw new HttpError(400, `Invalid route parameter: ${name}`);
  }

  return value;
};

export const athleteController = {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await athleteService.create(req.context!.clubId, req.body);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  },
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await athleteService.list(req.context!.clubId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },
  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const athleteId = getParam(req.params.athleteId, "athleteId");
      const result = await athleteService.getById(req.context!.clubId, athleteId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const athleteId = getParam(req.params.athleteId, "athleteId");
      const result = await athleteService.update(req.context!.clubId, athleteId, req.body);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },
  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      const athleteId = getParam(req.params.athleteId, "athleteId");
      await athleteService.remove(req.context!.clubId, athleteId);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  },
};
