CREATE TABLE "PublicDataSyncRun" (
    "id" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "matchId" TEXT,
    "providerKey" TEXT NOT NULL,
    "integrationType" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "externalClubName" TEXT,
    "externalTeamId" TEXT,
    "errorMessage" TEXT,
    "requestPayload" JSONB,
    "responsePayload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PublicDataSyncRun_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PublicDataSyncRun_clubId_createdAt_idx"
ON "PublicDataSyncRun"("clubId", "createdAt");

CREATE INDEX "PublicDataSyncRun_clubId_matchId_idx"
ON "PublicDataSyncRun"("clubId", "matchId");

CREATE INDEX "PublicDataSyncRun_providerKey_status_idx"
ON "PublicDataSyncRun"("providerKey", "status");

ALTER TABLE "PublicDataSyncRun"
ADD CONSTRAINT "PublicDataSyncRun_clubId_fkey"
FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PublicDataSyncRun"
ADD CONSTRAINT "PublicDataSyncRun_matchId_fkey"
FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE SET NULL ON UPDATE CASCADE;
