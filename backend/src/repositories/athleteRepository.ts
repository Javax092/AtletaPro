import { prisma } from "../config/prisma.js";

type AthleteWriteInput = {
  fullName?: string;
  position?: string;
  birthDate?: Date | null;
  externalId?: string | null;
};

type AthleteQueryOptions = {
  includeInactive?: boolean;
};

export const athleteRepository = {
  create: (clubId: string, data: Required<Pick<AthleteWriteInput, "fullName" | "position">> & AthleteWriteInput) =>
    prisma.athlete.create({ data: { clubId, ...data } }),
  list: (clubId: string, options: AthleteQueryOptions = {}) =>
    prisma.athlete.findMany({
      where: {
        clubId,
        ...(options.includeInactive ? {} : { isActive: true }),
      },
      orderBy: [{ fullName: "asc" }, { createdAt: "desc" }],
    }),
  findById: (clubId: string, athleteId: string, options: AthleteQueryOptions = {}) =>
    prisma.athlete.findFirst({
      where: {
        id: athleteId,
        clubId,
        ...(options.includeInactive ? {} : { isActive: true }),
      },
    }),
  async update(clubId: string, athleteId: string, data: AthleteWriteInput) {
    const result = await prisma.athlete.updateMany({
      where: { id: athleteId, clubId, isActive: true },
      data,
    });

    if (result.count === 0) {
      return null;
    }

    return athleteRepository.findById(clubId, athleteId);
  },
  async deactivate(clubId: string, athleteId: string) {
    const result = await prisma.athlete.updateMany({
      where: { id: athleteId, clubId, isActive: true },
      data: { isActive: false },
    });

    if (result.count === 0) {
      return null;
    }

    return athleteRepository.findById(clubId, athleteId, { includeInactive: true });
  },
};
