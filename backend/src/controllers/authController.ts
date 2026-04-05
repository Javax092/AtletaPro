import { Request, Response, NextFunction } from "express";
import { authService } from "../services/authService.js";

export const authController = {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.register(req.body, req.requestId);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  },
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.login(req.body, req.requestId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },
  async me(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.me(req.context!.userId, req.context!.clubId, req.requestId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },
};
