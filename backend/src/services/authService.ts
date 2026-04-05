import bcrypt from "bcryptjs";
import jwt, { type SignOptions } from "jsonwebtoken";
import { z } from "zod";
import { authRepository } from "../repositories/authRepository.js";
import { env } from "../config/env.js";
import { HttpError } from "../utils/httpError.js";
import { logger, maskEmail } from "../utils/logger.js";

const registerSchema = z.object({
  clubName: z.string().trim().min(2),
  clubSlug: z.string().trim().toLowerCase().min(2).regex(/^[a-z0-9-]+$/),
  adminName: z.string().trim().min(2),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8),
});

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8),
});

const sanitizeUser = <T extends { passwordHash: string; club?: unknown }>(user: T) => {
  const { passwordHash: _passwordHash, club: _club, ...safeUser } = user;
  return safeUser;
};

const createToken = (payload: { userId: string; clubId: string; role: string }) =>
  jwt.sign({ clubId: payload.clubId, role: payload.role }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as SignOptions["expiresIn"],
    subject: payload.userId,
  });

export const authService = {
  async register(input: unknown, requestId?: string) {
    const data = registerSchema.parse(input);
    logger.info("auth.register.attempt", {
      requestId,
      clubSlug: data.clubSlug,
      email: maskEmail(data.email),
    });

    const [existing, existingClub] = await Promise.all([
      authRepository.findUserByEmail(data.email),
      authRepository.findClubBySlug(data.clubSlug),
    ]);
    if (existing) throw new HttpError(409, "Email already in use");
    if (existingClub) throw new HttpError(409, "Club slug already in use");

    const passwordHash = await bcrypt.hash(data.password, 10);
    const result = await authRepository.createClubAndAdmin({
      club: { name: data.clubName, slug: data.clubSlug },
      user: { name: data.adminName, email: data.email, passwordHash },
    });

    const token = createToken({
      userId: result.user.id,
      clubId: result.club.id,
      role: result.user.role,
    });

    logger.info("auth.register.success", {
      requestId,
      clubId: result.club.id,
      userId: result.user.id,
      role: result.user.role,
    });

    return { token, club: result.club, user: sanitizeUser(result.user) };
  },

  async login(input: unknown, requestId?: string) {
    const data = loginSchema.parse(input);
    logger.info("auth.login.attempt", {
      requestId,
      email: maskEmail(data.email),
    });

    const user = await authRepository.findUserByEmail(data.email);

    if (!user) throw new HttpError(401, "Invalid credentials");
    const passwordMatches = await bcrypt.compare(data.password, user.passwordHash);
    if (!passwordMatches) throw new HttpError(401, "Invalid credentials");

    const token = createToken({ userId: user.id, clubId: user.clubId, role: user.role });
    logger.info("auth.login.success", {
      requestId,
      userId: user.id,
      clubId: user.clubId,
      role: user.role,
    });
    return { token, user: sanitizeUser(user), club: user.club };
  },

  async me(userId: string, clubId: string, requestId?: string) {
    const user = await authRepository.findUserByIdAndClub(userId, clubId);
    if (!user) {
      throw new HttpError(404, "User not found");
    }

    logger.debug("auth.me.success", {
      requestId,
      userId,
      clubId,
    });

    return {
      user: sanitizeUser(user),
      club: user.club,
    };
  },
};
