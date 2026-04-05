import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { calculateInjuryRisk } from "../src/utils/injuryRisk.js";

const prisma = new PrismaClient();

async function main() {
  const clubSlug = "demo-club";
  const adminEmail = "admin@democlub.com";
  const passwordHash = await bcrypt.hash("password123", 10);

  const club = await prisma.club.upsert({
    where: { slug: clubSlug },
    update: {},
    create: {
      name: "Demo Club",
      slug: clubSlug,
    },
  });

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      clubId: club.id,
      name: "Demo Admin",
      passwordHash,
      role: "ADMIN",
    },
    create: {
      clubId: club.id,
      name: "Demo Admin",
      email: adminEmail,
      passwordHash,
      role: "ADMIN",
    },
  });

  await prisma.injuryRiskAnalysis.deleteMany({ where: { clubId: club.id } });
  await prisma.performanceMetric.deleteMany({ where: { clubId: club.id } });
  await prisma.athlete.deleteMany({ where: { clubId: club.id } });

  const athletesInput = [
    { fullName: "Lucas Almeida", position: "Zagueiro", birthDate: new Date("1998-03-14"), externalId: "DC-001" },
    { fullName: "Rafael Costa", position: "Lateral", birthDate: new Date("2001-08-21"), externalId: "DC-002" },
    { fullName: "Mateus Santos", position: "Volante", birthDate: new Date("1999-11-02"), externalId: "DC-003" },
    { fullName: "Joao Ribeiro", position: "Meia", birthDate: new Date("2000-05-11"), externalId: "DC-004" },
    { fullName: "Pedro Nogueira", position: "Atacante", birthDate: new Date("1997-12-07"), externalId: "DC-005" },
    { fullName: "Thiago Martins", position: "Ponta", birthDate: new Date("2002-01-19"), externalId: "DC-006" },
  ];

  const athletes = [];

  for (const athlete of athletesInput) {
    athletes.push(
      await prisma.athlete.create({
        data: {
          clubId: club.id,
          fullName: athlete.fullName,
          position: athlete.position,
          birthDate: athlete.birthDate,
          externalId: athlete.externalId,
        },
      }),
    );
  }

  const sessions = [
    { athleteIndex: 0, recordedAt: "2026-03-31T09:00:00.000Z", distanceMeters: 8100, sprintCount: 12, accelCount: 18, decelCount: 17, workload: 312, avgHeartRateBpm: 142, maxHeartRateBpm: 171, sessionMinutes: 64, perceivedEffort: 5.6, fatigueLevel: 3.2, sleepHours: 8.1, sorenessLevel: 2.8 },
    { athleteIndex: 1, recordedAt: "2026-03-31T09:20:00.000Z", distanceMeters: 8920, sprintCount: 16, accelCount: 22, decelCount: 20, workload: 368, avgHeartRateBpm: 149, maxHeartRateBpm: 175, sessionMinutes: 71, perceivedEffort: 6.1, fatigueLevel: 4.1, sleepHours: 7.5, sorenessLevel: 3.6 },
    { athleteIndex: 2, recordedAt: "2026-04-01T09:05:00.000Z", distanceMeters: 9440, sprintCount: 17, accelCount: 24, decelCount: 21, workload: 404, avgHeartRateBpm: 153, maxHeartRateBpm: 177, sessionMinutes: 78, perceivedEffort: 6.8, fatigueLevel: 5.3, sleepHours: 7.2, sorenessLevel: 4.8 },
    { athleteIndex: 3, recordedAt: "2026-04-01T09:15:00.000Z", distanceMeters: 9860, sprintCount: 18, accelCount: 26, decelCount: 23, workload: 422, avgHeartRateBpm: 156, maxHeartRateBpm: 179, sessionMinutes: 81, perceivedEffort: 7.1, fatigueLevel: 5.9, sleepHours: 6.8, sorenessLevel: 5.2 },
    { athleteIndex: 4, recordedAt: "2026-04-02T09:10:00.000Z", distanceMeters: 10220, sprintCount: 22, accelCount: 29, decelCount: 28, workload: 471, avgHeartRateBpm: 161, maxHeartRateBpm: 183, sessionMinutes: 88, perceivedEffort: 8.1, fatigueLevel: 6.8, sleepHours: 6.3, sorenessLevel: 6.4 },
    { athleteIndex: 5, recordedAt: "2026-04-02T09:25:00.000Z", distanceMeters: 10740, sprintCount: 24, accelCount: 32, decelCount: 29, workload: 492, avgHeartRateBpm: 164, maxHeartRateBpm: 185, sessionMinutes: 91, perceivedEffort: 8.4, fatigueLevel: 7.2, sleepHours: 6.1, sorenessLevel: 6.7 },
    { athleteIndex: 0, recordedAt: "2026-04-03T09:00:00.000Z", distanceMeters: 8540, sprintCount: 14, accelCount: 19, decelCount: 18, workload: 328, avgHeartRateBpm: 145, maxHeartRateBpm: 172, sessionMinutes: 67, perceivedEffort: 5.9, fatigueLevel: 3.8, sleepHours: 8.2, sorenessLevel: 3.1 },
    { athleteIndex: 2, recordedAt: "2026-04-03T09:18:00.000Z", distanceMeters: 9630, sprintCount: 18, accelCount: 25, decelCount: 22, workload: 418, avgHeartRateBpm: 154, maxHeartRateBpm: 178, sessionMinutes: 79, perceivedEffort: 6.9, fatigueLevel: 5.5, sleepHours: 7.0, sorenessLevel: 4.9 },
    { athleteIndex: 3, recordedAt: "2026-04-04T09:12:00.000Z", distanceMeters: 9980, sprintCount: 19, accelCount: 27, decelCount: 24, workload: 436, avgHeartRateBpm: 157, maxHeartRateBpm: 180, sessionMinutes: 84, perceivedEffort: 7.3, fatigueLevel: 6.1, sleepHours: 6.7, sorenessLevel: 5.7 },
    { athleteIndex: 4, recordedAt: "2026-04-04T09:30:00.000Z", distanceMeters: 10480, sprintCount: 23, accelCount: 30, decelCount: 27, workload: 484, avgHeartRateBpm: 163, maxHeartRateBpm: 184, sessionMinutes: 89, perceivedEffort: 8.2, fatigueLevel: 7.0, sleepHours: 6.2, sorenessLevel: 6.8 },
    { athleteIndex: 5, recordedAt: "2026-04-05T09:00:00.000Z", distanceMeters: 10960, sprintCount: 25, accelCount: 34, decelCount: 31, workload: 506, avgHeartRateBpm: 166, maxHeartRateBpm: 187, sessionMinutes: 94, perceivedEffort: 8.6, fatigueLevel: 7.5, sleepHours: 5.9, sorenessLevel: 7.1 },
    { athleteIndex: 1, recordedAt: "2026-04-05T09:16:00.000Z", distanceMeters: 9150, sprintCount: 17, accelCount: 23, decelCount: 21, workload: 382, avgHeartRateBpm: 150, maxHeartRateBpm: 174, sessionMinutes: 73, perceivedEffort: 6.2, fatigueLevel: 4.4, sleepHours: 7.4, sorenessLevel: 3.9 },
  ] as const;

  for (const session of sessions) {
    const athlete = athletes[session.athleteIndex];
    const metric = await prisma.performanceMetric.create({
      data: {
        clubId: club.id,
        athleteId: athlete.id,
        recordedAt: new Date(session.recordedAt),
        distanceMeters: session.distanceMeters,
        sprintCount: session.sprintCount,
        accelCount: session.accelCount,
        decelCount: session.decelCount,
        workload: session.workload,
        avgHeartRateBpm: session.avgHeartRateBpm,
        maxHeartRateBpm: session.maxHeartRateBpm,
        sessionMinutes: session.sessionMinutes,
        perceivedEffort: session.perceivedEffort,
        fatigueLevel: session.fatigueLevel,
        sleepHours: session.sleepHours,
        sorenessLevel: session.sorenessLevel,
        source: "seed",
      },
    });

    const risk = calculateInjuryRisk({
      workload: session.workload,
      fatigueLevel: session.fatigueLevel,
      sorenessLevel: session.sorenessLevel,
      sleepHours: session.sleepHours,
      accelCount: session.accelCount,
      decelCount: session.decelCount,
      avgHeartRateBpm: session.avgHeartRateBpm,
      sessionMinutes: session.sessionMinutes,
      perceivedEffort: session.perceivedEffort,
    });

    await prisma.injuryRiskAnalysis.create({
      data: {
        clubId: club.id,
        athleteId: athlete.id,
        performanceMetricId: metric.id,
        riskScore: risk.riskScore,
        riskLevel: risk.riskLevel,
        summary: risk.summary,
        explanation: risk.explanation,
        payloadJson: {
          source: "seed",
          recordedAt: session.recordedAt,
        },
        createdAt: new Date(session.recordedAt),
      },
    });
  }

  console.log("Seed completed with demo club, athletes, metrics and risks");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
