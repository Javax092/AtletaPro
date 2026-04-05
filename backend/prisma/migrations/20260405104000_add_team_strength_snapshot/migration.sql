CREATE TABLE "TeamStrengthSnapshot" (
    "id" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "matchId" TEXT,
    "referenceDate" TIMESTAMP(3) NOT NULL,
    "overallScore" DOUBLE PRECISION NOT NULL,
    "squadAvailability" DOUBLE PRECISION NOT NULL,
    "aggregatedRisk" DOUBLE PRECISION NOT NULL,
    "aggregatedFatigue" DOUBLE PRECISION NOT NULL,
    "summary" TEXT NOT NULL,
    "observations" TEXT,
    "payloadJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeamStrengthSnapshot_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "TeamStrengthSnapshot_clubId_referenceDate_createdAt_idx"
ON "TeamStrengthSnapshot"("clubId", "referenceDate", "createdAt");

CREATE INDEX "TeamStrengthSnapshot_clubId_matchId_idx"
ON "TeamStrengthSnapshot"("clubId", "matchId");

ALTER TABLE "TeamStrengthSnapshot"
ADD CONSTRAINT "TeamStrengthSnapshot_clubId_fkey"
FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TeamStrengthSnapshot"
ADD CONSTRAINT "TeamStrengthSnapshot_matchId_fkey"
FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE SET NULL ON UPDATE CASCADE;
