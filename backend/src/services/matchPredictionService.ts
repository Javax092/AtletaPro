import { z } from "zod";
import { Prisma } from "@prisma/client";
import { matchIntelligenceRepository } from "../repositories/matchIntelligenceRepository.js";
import { HttpError } from "../utils/httpError.js";
import { buildSquadSnapshot, clamp, round } from "./matchIntelligenceCore.js";
import { matchPredictionEngine } from "./matchPredictionEngine.js";

const predictionSchema = z
  .object({
    referenceDate: z.coerce.date().optional(),
    opponentStrengthOverride: z.coerce.number().min(0).max(100).optional(),
    venueContext: z.enum(["HOME", "AWAY", "NEUTRAL"]).optional(),
  })
  .strict()
  .optional();

const matchResultSchema = z
  .object({
    teamGoals: z.coerce.number().int().min(0).max(99),
    opponentGoals: z.coerce.number().int().min(0).max(99),
    resultRecordedAt: z.coerce.date().optional(),
  })
  .strict();

const parseRecentResults = (value: unknown): Array<"W" | "D" | "L"> => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is "W" | "D" | "L" => item === "W" || item === "D" || item === "L");
};

const computeFormScore = (results: Array<"W" | "D" | "L">) => {
  if (results.length === 0) return 50;
  const points = results.reduce((sum, result) => sum + (result === "W" ? 3 : result === "D" ? 1 : 0), 0);
  return round((points / (results.length * 3)) * 100);
};

const computeTableScore = (position?: number | null) => {
  if (!position) return 55;
  return round(clamp(100 - (position - 1) * 4.2, 35, 92));
};

const computeGoalDiffScore = (goalDifference?: number | null) => {
  if (goalDifference === null || goalDifference === undefined) return 50;
  return round(clamp(50 + goalDifference * 2, 20, 85));
};

const resolveVenueContext = (
  inputVenue: "HOME" | "AWAY" | "NEUTRAL" | undefined,
  publicVenue: string | null | undefined,
): "HOME" | "AWAY" | "NEUTRAL" => {
  if (inputVenue) return inputVenue;
  if (publicVenue === "HOME") return "AWAY";
  if (publicVenue === "AWAY") return "HOME";
  return "NEUTRAL";
};

const toJsonValue = (value: unknown) => JSON.parse(JSON.stringify(value ?? null)) as Prisma.InputJsonValue;

const resolvePredictedOutcome = (
  venueContext: "HOME" | "AWAY" | "NEUTRAL",
  homeWinProbability: number,
  drawProbability: number,
  awayWinProbability: number,
) => {
  if (drawProbability >= homeWinProbability && drawProbability >= awayWinProbability) {
    return "DRAW";
  }

  if (venueContext === "AWAY") {
    return awayWinProbability >= homeWinProbability ? "WIN" : "LOSS";
  }

  return homeWinProbability >= awayWinProbability ? "WIN" : "LOSS";
};

const resolveProbabilityAssignedToOutcome = (
  venueContext: "HOME" | "AWAY" | "NEUTRAL",
  outcome: "WIN" | "DRAW" | "LOSS",
  prediction: { homeWinProbability: number; drawProbability: number; awayWinProbability: number },
) => {
  if (outcome === "DRAW") {
    return prediction.drawProbability;
  }

  if (outcome === "WIN") {
    return venueContext === "AWAY" ? prediction.awayWinProbability : prediction.homeWinProbability;
  }

  return venueContext === "AWAY" ? prediction.homeWinProbability : prediction.awayWinProbability;
};

export const matchPredictionService = {
  async createPrediction(clubId: string, matchId: string, input: unknown) {
    const payload = predictionSchema.parse(input);

    const [club, match] = await Promise.all([
      matchIntelligenceRepository.findClubById(clubId),
      matchIntelligenceRepository.findMatchById(clubId, matchId),
    ]);

    if (!club) {
      throw new HttpError(404, "Club not found");
    }

    if (!match) {
      throw new HttpError(404, "Match not found");
    }

    const referenceDate = payload?.referenceDate ?? match.matchDate ?? new Date();
    const [matchSnapshot, clubSnapshot, matchContext, clubContext, latestReport] = await Promise.all([
      matchIntelligenceRepository.findLatestSnapshotByMatch(clubId, matchId),
      matchIntelligenceRepository.findLatestSnapshot(clubId),
      matchIntelligenceRepository.findLatestPublicContext(clubId, matchId),
      matchIntelligenceRepository.findLatestPublicContext(clubId),
      matchIntelligenceRepository.findLatestReportByMatch(clubId, matchId),
    ]);

    const resolvedSnapshot =
      matchSnapshot ??
      clubSnapshot ??
      (await buildSquadSnapshot(clubId, referenceDate).then((snapshot) => ({
        id: null,
        overallScore: snapshot.teamStrengthScore,
        squadAvailability: snapshot.availabilityScore,
        aggregatedRisk: snapshot.avgRiskScore,
        aggregatedFatigue: snapshot.avgFatigue,
        payloadJson: {
          readinessScore: snapshot.readinessScore,
          loadScore: snapshot.loadScore,
          squadDepthScore: snapshot.squadDepthScore,
          coverageRatio: round(snapshot.coverageRatio * 100),
        },
      })));

    if (!resolvedSnapshot) {
      throw new HttpError(409, "Unable to resolve team snapshot for prediction");
    }

    const resolvedContext = matchContext ?? clubContext ?? null;
    const recentResults = parseRecentResults(resolvedContext?.recentResults);
    const publicFormScore = computeFormScore(recentResults);
    const publicTableScore = computeTableScore(resolvedContext?.leaguePosition);
    const publicGoalDiffScore = computeGoalDiffScore(resolvedContext?.goalDifference);

    const publicOpponentStrength = resolvedContext
      ? round(publicTableScore * 0.4 + publicFormScore * 0.35 + publicGoalDiffScore * 0.25)
      : undefined;

    const opponentStrengthScore = round(
      payload?.opponentStrengthOverride ?? publicOpponentStrength ?? latestReport?.opponentStrengthScore ?? 55,
    );

    const venueContext = resolveVenueContext(payload?.venueContext, resolvedContext?.venueContext);
    const snapshotPayload = ((resolvedSnapshot.payloadJson ?? {}) as Record<string, unknown>) || {};
    const coverageRatio = typeof snapshotPayload.coverageRatio === "number" ? snapshotPayload.coverageRatio / 100 : 0.65;
    const readinessScore = typeof snapshotPayload.readinessScore === "number" ? snapshotPayload.readinessScore : 50;
    const loadScore = typeof snapshotPayload.loadScore === "number" ? snapshotPayload.loadScore : 50;
    const squadDepthScore = typeof snapshotPayload.squadDepthScore === "number" ? snapshotPayload.squadDepthScore : 50;

    const prediction = matchPredictionEngine.calculate({
      clubName: club.name,
      opponentName: match.opponent,
      teamStrengthScore: resolvedSnapshot.overallScore,
      squadAvailability: resolvedSnapshot.squadAvailability,
      aggregatedRisk: resolvedSnapshot.aggregatedRisk,
      aggregatedFatigue: resolvedSnapshot.aggregatedFatigue,
      readinessScore,
      loadScore,
      squadDepthScore,
      opponentStrengthScore,
      publicFormScore,
      publicTableScore,
      publicGoalDiffScore,
      venueContext,
      hasPublicData: Boolean(resolvedContext),
      hasSnapshot: Boolean(matchSnapshot || clubSnapshot),
      coverageRatio,
    });

    const predictedOutcome = resolvePredictedOutcome(
      venueContext,
      prediction.homeWinProbability,
      prediction.drawProbability,
      prediction.awayWinProbability,
    );

    return matchIntelligenceRepository.createPrediction({
      clubId,
      matchId,
      status: "COMPLETED",
      source: "heuristic-v1",
      homeWinProbability: prediction.homeWinProbability,
      drawProbability: prediction.drawProbability,
      awayWinProbability: prediction.awayWinProbability,
      favoriteTeam: prediction.favoriteTeam,
      predictedOutcome,
      confidenceScore: prediction.confidenceScore,
      homeTeamStrength: prediction.homeTeamStrength,
      awayTeamStrength: prediction.awayTeamStrength,
      explanation: prediction.explanation,
      keyFactorsJson: toJsonValue(prediction.keyFactors),
      payloadJson: toJsonValue({
        referenceDate,
        venueContext,
        teamStrengthScore: resolvedSnapshot.overallScore,
        squadAvailability: resolvedSnapshot.squadAvailability,
        aggregatedRisk: resolvedSnapshot.aggregatedRisk,
        aggregatedFatigue: resolvedSnapshot.aggregatedFatigue,
        readinessScore,
        loadScore,
        squadDepthScore,
        opponentStrengthScore,
        publicContextId: resolvedContext?.id ?? null,
        snapshotId: "id" in resolvedSnapshot ? resolvedSnapshot.id : null,
        publicFormScore,
        publicTableScore,
        publicGoalDiffScore,
      }),
    });
  },

  listPredictions(clubId: string, matchId: string) {
    return matchIntelligenceRepository.listPredictionsByMatch(clubId, matchId);
  },

  listClubPredictions(clubId: string) {
    return matchIntelligenceRepository.listPredictionsByClub(clubId);
  },

  async latestPrediction(clubId: string, matchId: string) {
    const prediction = await matchIntelligenceRepository.findLatestPredictionByMatch(clubId, matchId);
    if (!prediction) {
      throw new HttpError(404, "Match prediction not found");
    }

    return prediction;
  },

  async getPredictionById(clubId: string, predictionId: string) {
    const prediction = await matchIntelligenceRepository.findPredictionById(clubId, predictionId);
    if (!prediction) {
      throw new HttpError(404, "Prediction not found");
    }

    return prediction;
  },

  async registerMatchResult(clubId: string, matchId: string, input: unknown) {
    const payload = matchResultSchema.parse(input);
    const match = await matchIntelligenceRepository.findMatchById(clubId, matchId);

    if (!match) {
      throw new HttpError(404, "Match not found");
    }

    const actualResult =
      payload.teamGoals > payload.opponentGoals
        ? "WIN"
        : payload.teamGoals < payload.opponentGoals
          ? "LOSS"
          : "DRAW";

    const resultRecordedAt = payload.resultRecordedAt ?? new Date();

    const updated = await matchIntelligenceRepository.updateMatchResult(clubId, matchId, {
      teamGoals: payload.teamGoals,
      opponentGoals: payload.opponentGoals,
      actualResult,
      resultRecordedAt,
      status: "COMPLETED",
    });

    if (updated.count === 0) {
      throw new HttpError(404, "Match not found");
    }

    await matchIntelligenceRepository.syncPredictionsWithActualResult(clubId, matchId, actualResult, resultRecordedAt);

    return matchIntelligenceRepository.findMatchWithPredictions(clubId, matchId);
  },

  async comparePredictionsWithResult(clubId: string, matchId: string) {
    const match = await matchIntelligenceRepository.findMatchWithPredictions(clubId, matchId);

    if (!match) {
      throw new HttpError(404, "Match not found");
    }

    if (!match.actualResult) {
      throw new HttpError(409, "Match result has not been recorded yet");
    }

    const comparisons = match.predictions.map((prediction) => {
      const predictionPayload = ((prediction.payloadJson ?? {}) as Record<string, unknown>) || {};
      const venueContext =
        predictionPayload.venueContext === "AWAY" || predictionPayload.venueContext === "NEUTRAL"
          ? (predictionPayload.venueContext as "AWAY" | "NEUTRAL")
          : "HOME";
      const probabilityAssignedToActual = resolveProbabilityAssignedToOutcome(
        venueContext,
        match.actualResult as "WIN" | "DRAW" | "LOSS",
        prediction,
      );

      return {
        predictionId: prediction.id,
        createdAt: prediction.createdAt,
        predictedOutcome: prediction.predictedOutcome,
        actualResult: match.actualResult,
        isCorrect: prediction.predictedOutcome === match.actualResult,
        confidenceScore: prediction.confidenceScore,
        probabilityAssignedToActual: round(probabilityAssignedToActual),
        favoriteTeam: prediction.favoriteTeam,
        explanation: prediction.explanation,
      };
    });

    const totalPredictions = comparisons.length;
    const totalCorrect = comparisons.filter((item) => item.isCorrect).length;

    return {
      match: {
        id: match.id,
        title: match.title,
        opponent: match.opponent,
        matchDate: match.matchDate,
        teamGoals: match.teamGoals,
        opponentGoals: match.opponentGoals,
        actualResult: match.actualResult,
        resultRecordedAt: match.resultRecordedAt,
      },
      summary: {
        totalPredictions,
        totalCorrect,
        totalIncorrect: totalPredictions - totalCorrect,
        accuracyRate: totalPredictions > 0 ? round((totalCorrect / totalPredictions) * 100) : 0,
      },
      comparisons,
    };
  },
};
