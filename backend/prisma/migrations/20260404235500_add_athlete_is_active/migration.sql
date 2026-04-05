ALTER TABLE "Athlete"
ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;

CREATE INDEX "Athlete_clubId_isActive_idx" ON "Athlete"("clubId", "isActive");
