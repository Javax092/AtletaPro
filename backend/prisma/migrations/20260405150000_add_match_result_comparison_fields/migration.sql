ALTER TABLE "Match"
ADD COLUMN "teamGoals" INTEGER,
ADD COLUMN "opponentGoals" INTEGER,
ADD COLUMN "actualResult" TEXT,
ADD COLUMN "resultRecordedAt" TIMESTAMP(3);

ALTER TABLE "MatchPrediction"
ADD COLUMN "predictedOutcome" TEXT NOT NULL DEFAULT 'DRAW';
