import { NextFunction, Request, Response } from "express";

export const dashboardController = {
  get(req: Request, res: Response, next: NextFunction) {
    try {
      res.json({
        message: "Protected dashboard route ready",
        context: req.context,
      });
    } catch (error) {
      next(error);
    }
  },
};

