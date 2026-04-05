CREATE TABLE "MatchPrediction" (
    "id" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'heuristic-v1',
    "homeWinProbability" DOUBLE PRECISION NOT NULL,
    "drawProbability" DOUBLE PRECISION NOT NULL,
    "awayWinProbability" DOUBLE PRECISION NOT NULL,
    "favoriteTeam" TEXT NOT NULL,
    "confidenceScore" DOUBLE PRECISION NOT NULL,
    "homeTeamStrength" DOUBLE PRECISION NOT NULL,
    "awayTeamStrength" DOUBLE PRECISION NOT NULL,
    "explanation" TEXT NOT NULL,
    "keyFactorsJson" JSONB,
    "payloadJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MatchPrediction_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "MatchPrediction_clubId_matchId_createdAt_idx"
ON "MatchPrediction"("clubId", "matchId", "createdAt");

ALTER TABLE "MatchPrediction"
ADD CONSTRAINT "MatchPrediction_clubId_fkey"
FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "MatchPrediction"
ADD CONSTRAINT "MatchPrediction_matchId_fkey"
FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;
