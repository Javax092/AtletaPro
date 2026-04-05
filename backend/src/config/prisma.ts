import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();

const ensureAthleteIsActiveColumn = async () => {
  await prisma.$executeRawUnsafe(`
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = 'Athlete'
      ) AND NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'Athlete'
          AND column_name = 'isActive'
      ) THEN
        ALTER TABLE "Athlete"
        ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;
      END IF;
    END
    $$;
  `);

  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "Athlete_clubId_isActive_idx"
    ON "Athlete"("clubId", "isActive");
  `);
};

export const ensureDatabaseCompatibility = async () => {
  await prisma.$connect();
  await ensureAthleteIsActiveColumn();
};
