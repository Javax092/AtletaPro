import { z } from "zod";
import { athleteRepository } from "../repositories/athleteRepository.js";
import { HttpError } from "../utils/httpError.js";

const normalizeOptionalText = (value: unknown) => {
  if (typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
};

const birthDateSchema = z
  .preprocess((value) => normalizeOptionalText(value), z.union([z.string(), z.null()]).optional())
  .refine((value) => value === undefined || value === null || !Number.isNaN(Date.parse(value)), {
    message: "birthDate must be a valid date",
  });

const athleteCreateSchema = z
  .object({
    fullName: z
      .string({ required_error: "fullName is required" })
      .trim()
      .min(2, "fullName must have at least 2 characters")
      .max(120, "fullName must have at most 120 characters"),
    position: z
      .string({ required_error: "position is required" })
      .trim()
      .min(2, "position must have at least 2 characters")
      .max(80, "position must have at most 80 characters"),
    birthDate: birthDateSchema,
    externalId: z
      .preprocess((value) => normalizeOptionalText(value), z.union([z.string().max(100, "externalId must have at most 100 characters"), z.null()]).optional()),
  })
  .strict();

const athleteUpdateSchema = athleteCreateSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, { message: "Request body must include at least one field to update" });

const parseBirthDate = (value: string | null | undefined) => {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  return new Date(value);
};

const getExistingAthlete = async (clubId: string, athleteId: string) => {
  const athlete = await athleteRepository.findById(clubId, athleteId, { includeInactive: true });

  if (!athlete) {
    throw new HttpError(404, "Athlete not found for this club");
  }

  return athlete;
};

export const athleteService = {
  create(clubId: string, input: unknown) {
    const data = athleteCreateSchema.parse(input);

    return athleteRepository.create(clubId, {
      fullName: data.fullName,
      position: data.position,
      birthDate: parseBirthDate(data.birthDate),
      externalId: data.externalId ?? null,
    });
  },
  list(clubId: string) {
    return athleteRepository.list(clubId);
  },
  async getById(clubId: string, athleteId: string) {
    const athlete = await athleteRepository.findById(clubId, athleteId);

    if (!athlete) {
      throw new HttpError(404, "Athlete not found for this club");
    }

    return athlete;
  },
  async update(clubId: string, athleteId: string, input: unknown) {
    const existing = await getExistingAthlete(clubId, athleteId);

    if (!existing.isActive) {
      throw new HttpError(409, "Inactive athletes cannot be updated");
    }

    const data = athleteUpdateSchema.parse(input);
    const updated = await athleteRepository.update(clubId, athleteId, {
      ...data,
      birthDate: parseBirthDate(data.birthDate),
    });

    if (!updated) {
      throw new HttpError(409, "Athlete could not be updated");
    }

    return updated;
  },
  async remove(clubId: string, athleteId: string) {
    const existing = await getExistingAthlete(clubId, athleteId);

    if (!existing.isActive) {
      throw new HttpError(409, "Athlete is already inactive");
    }

    const deactivated = await athleteRepository.deactivate(clubId, athleteId);

    if (!deactivated) {
      throw new HttpError(409, "Athlete could not be deactivated");
    }

    return deactivated;
  },
};
