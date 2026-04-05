import cors from "cors";
import express from "express";
import { appRouter } from "./routes/index.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import { notFound } from "./middlewares/notFound.js";
import { requestContextMiddleware } from "./middlewares/requestContextMiddleware.js";

export const app = express();

app.use(cors());
app.use(requestContextMiddleware);
app.use(express.json({ limit: "10mb" }));
app.use("/api", appRouter);
app.use(notFound);
app.use(errorHandler);
