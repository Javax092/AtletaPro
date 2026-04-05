import fs from "node:fs";
import path from "node:path";
import multer from "multer";
import { env } from "../config/env.js";

const uploadDir = path.resolve(process.cwd(), env.UPLOAD_DIR);
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const sanitized = file.originalname.replace(/\s+/g, "-").toLowerCase();
    cb(null, `${Date.now()}-${sanitized}`);
  },
});

export const upload = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("video/")) {
      cb(null, true);
      return;
    }

    cb(new Error("Only video uploads are allowed"));
  },
  limits: {
    fileSize: 1024 * 1024 * 500,
  },
});
