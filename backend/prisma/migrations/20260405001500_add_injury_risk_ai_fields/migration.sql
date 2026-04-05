-- AlterTable
ALTER TABLE "PerformanceMetric"
ADD COLUMN "avgHeartRateBpm" DOUBLE PRECISION,
ADD COLUMN "maxHeartRateBpm" DOUBLE PRECISION,
ADD COLUMN "sessionMinutes" DOUBLE PRECISION,
ADD COLUMN "perceivedEffort" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "InjuryRiskAnalysis"
ADD COLUMN "summary" TEXT NOT NULL DEFAULT '',
ADD COLUMN "payloadJson" JSONB;

-- Backfill
UPDATE "InjuryRiskAnalysis"
SET "summary" = "explanation"
WHERE "summary" = '';
