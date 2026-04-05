CREATE TABLE "MatchIntelligenceReport" (
    "id" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'internal-v1',
    "opponentStrengthInput" DOUBLE PRECISION,
    "teamStrengthScore" DOUBLE PRECISION NOT NULL,
    "opponentStrengthScore" DOUBLE PRECISION NOT NULL,
    "availabilityScore" DOUBLE PRECISION NOT NULL,
    "readinessScore" DOUBLE PRECISION NOT NULL,
    "loadScore" DOUBLE PRECISION NOT NULL,
    "squadDepthScore" DOUBLE PRECISION NOT NULL,
    "winProbability" DOUBLE PRECISION NOT NULL,
    "drawProbability" DOUBLE PRECISION NOT NULL,
    "lossProbability" DOUBLE PRECISION NOT NULL,
    "strongerSide" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "explanation" TEXT NOT NULL,
    "payloadJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MatchIntelligenceReport_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "MatchIntelligenceReport_clubId_matchId_createdAt_idx"
ON "MatchIntelligenceReport"("clubId", "matchId", "createdAt");

ALTER TABLE "MatchIntelligenceReport"
ADD CONSTRAINT "MatchIntelligenceReport_clubId_fkey"
FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "MatchIntelligenceReport"
ADD CONSTRAINT "MatchIntelligenceReport_matchId_fkey"
FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;
