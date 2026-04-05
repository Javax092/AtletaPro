import { Club, User } from "@prisma/client";
import { prisma } from "../config/prisma.js";

export const authRepository = {
  createClubAndAdmin: (data: {
    club: { name: string; slug: string };
    user: { name: string; email: string; passwordHash: string };
  }): Promise<{ club: Club; user: User }> =>
    prisma.$transaction(async (tx) => {
      const club = await tx.club.create({ data: data.club });
      const user = await tx.user.create({
        data: {
          clubId: club.id,
          name: data.user.name,
          email: data.user.email,
          passwordHash: data.user.passwordHash,
          role: "ADMIN",
        },
      });

      return { club, user };
    }),

  findUserByEmail: (email: string) =>
    prisma.user.findUnique({
      where: { email },
      include: { club: true },
    }),

  findClubBySlug: (slug: string) =>
    prisma.club.findUnique({
      where: { slug },
    }),

  findUserByIdAndClub: (userId: string, clubId: string) =>
    prisma.user.findFirst({
      where: { id: userId, clubId },
      include: { club: true },
    }),
};
