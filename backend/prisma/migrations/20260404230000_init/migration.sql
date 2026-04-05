-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'STAFF', 'COACH', 'ANALYST');

-- CreateEnum
CREATE TYPE "MatchStatus" AS ENUM ('SCHEDULED', 'COMPLETED', 'ANALYZED');

-- CreateTable
CREATE TABLE "Club" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Club_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'STAFF',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Athlete" (
    "id" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "birthDate" TIMESTAMP(3),
    "position" TEXT NOT NULL,
    "externalId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Athlete_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PerformanceMetric" (
    "id" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "athleteId" TEXT NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL,
    "distanceMeters" DOUBLE PRECISION,
    "sprintCount" INTEGER,
    "accelCount" INTEGER,
    "decelCount" INTEGER,
    "workload" DOUBLE PRECISION,
    "fatigueLevel" DOUBLE PRECISION,
    "sleepHours" DOUBLE PRECISION,
    "sorenessLevel" DOUBLE PRECISION,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PerformanceMetric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InjuryRiskAnalysis" (
    "id" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "athleteId" TEXT NOT NULL,
    "performanceMetricId" TEXT,
    "riskScore" DOUBLE PRECISION NOT NULL,
    "riskLevel" TEXT NOT NULL,
    "explanation" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InjuryRiskAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Match" (
    "id" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "opponent" TEXT NOT NULL,
    "matchDate" TIMESTAMP(3) NOT NULL,
    "competition" TEXT,
    "status" "MatchStatus" NOT NULL DEFAULT 'SCHEDULED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Match_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MatchVideo" (
    "id" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "storagePath" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),

    CONSTRAINT "MatchVideo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScoutAnalysis" (
    "id" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "matchVideoId" TEXT,
    "analysisType" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "heatmapPath" TEXT,
    "payloadJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScoutAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Club_slug_key" ON "Club"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Athlete_clubId_idx" ON "Athlete"("clubId");

-- CreateIndex
CREATE INDEX "PerformanceMetric_clubId_athleteId_idx" ON "PerformanceMetric"("clubId", "athleteId");

-- CreateIndex
CREATE INDEX "InjuryRiskAnalysis_clubId_athleteId_idx" ON "InjuryRiskAnalysis"("clubId", "athleteId");

-- CreateIndex
CREATE INDEX "Match_clubId_idx" ON "Match"("clubId");

-- CreateIndex
CREATE INDEX "MatchVideo_clubId_matchId_idx" ON "MatchVideo"("clubId", "matchId");

-- CreateIndex
CREATE INDEX "ScoutAnalysis_clubId_matchId_idx" ON "ScoutAnalysis"("clubId", "matchId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Athlete" ADD CONSTRAINT "Athlete_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PerformanceMetric" ADD CONSTRAINT "PerformanceMetric_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PerformanceMetric" ADD CONSTRAINT "PerformanceMetric_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "Athlete"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InjuryRiskAnalysis" ADD CONSTRAINT "InjuryRiskAnalysis_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InjuryRiskAnalysis" ADD CONSTRAINT "InjuryRiskAnalysis_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "Athlete"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InjuryRiskAnalysis" ADD CONSTRAINT "InjuryRiskAnalysis_performanceMetricId_fkey" FOREIGN KEY ("performanceMetricId") REFERENCES "PerformanceMetric"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchVideo" ADD CONSTRAINT "MatchVideo_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchVideo" ADD CONSTRAINT "MatchVideo_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScoutAnalysis" ADD CONSTRAINT "ScoutAnalysis_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScoutAnalysis" ADD CONSTRAINT "ScoutAnalysis_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScoutAnalysis" ADD CONSTRAINT "ScoutAnalysis_matchVideoId_fkey" FOREIGN KEY ("matchVideoId") REFERENCES "MatchVideo"("id") ON DELETE SET NULL ON UPDATE CASCADE;
