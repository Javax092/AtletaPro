CREATE TABLE "PublicTeamContext" (
    "id" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "matchId" TEXT,
    "externalClubName" TEXT NOT NULL,
    "competition" TEXT,
    "leaguePosition" INTEGER,
    "recentResults" JSONB,
    "goalDifference" INTEGER,
    "venueContext" TEXT,
    "collectedAt" TIMESTAMP(3) NOT NULL,
    "providerKey" TEXT NOT NULL DEFAULT 'manual',
    "externalTeamId" TEXT,
    "summary" TEXT,
    "payloadJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PublicTeamContext_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PublicTeamContext_clubId_collectedAt_createdAt_idx"
ON "PublicTeamContext"("clubId", "collectedAt", "createdAt");

CREATE INDEX "PublicTeamContext_clubId_matchId_idx"
ON "PublicTeamContext"("clubId", "matchId");

CREATE INDEX "PublicTeamContext_providerKey_externalTeamId_idx"
ON "PublicTeamContext"("providerKey", "externalTeamId");

ALTER TABLE "PublicTeamContext"
ADD CONSTRAINT "PublicTeamContext_clubId_fkey"
FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PublicTeamContext"
ADD CONSTRAINT "PublicTeamContext_matchId_fkey"
FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE SET NULL ON UPDATE CASCADE;
