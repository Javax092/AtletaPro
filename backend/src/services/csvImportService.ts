import { parse } from "csv-parse/sync";
import { z } from "zod";
import { athleteRepository } from "../repositories/athleteRepository.js";
import { performanceService } from "./performanceService.js";
import { athleteNormalizationService } from "./athleteNormalizationService.js";
import { duplicateDetectionService } from "./duplicateDetectionService.js";

const CANONICAL_FIELDS = [
  "fullName",
  "position",
  "birthDate",
  "age",
  "externalId",
  "recordedAt",
  "workload",
  "distanceMeters",
  "sprintCount",
  "fatigueLevel",
  "sleepHours",
] as const;

const FIELD_ALIASES: Record<(typeof CANONICAL_FIELDS)[number], string[]> = {
  fullName: ["fullName", "name", "nome", "player", "player_name", "athlete", "athlete_name"],
  position: ["position", "posicao", "posição", "role", "player_role"],
  birthDate: ["birthDate", "date_of_birth", "dob", "data_nascimento", "nascimento"],
  age: ["age", "idade"],
  externalId: ["externalId", "external_id", "id_externo", "provider_id"],
  recordedAt: ["recordedAt", "session_date", "training_date", "data", "date"],
  workload: ["workload", "load", "carga", "training_load"],
  distanceMeters: ["distanceMeters", "distance", "distancia", "meters", "distancia_metros"],
  sprintCount: ["sprintCount", "sprints", "sprintes"],
  fatigueLevel: ["fatigueLevel", "fadiga", "fatigue"],
  sleepHours: ["sleepHours", "sleep", "sono", "sleep_hours"],
};

const commitRowSchema = z.object({
  fullName: z.string().trim().min(2),
  position: z.string().trim().min(2),
  birthDate: z.string().trim().optional().nullable(),
  externalId: z.string().trim().optional().nullable(),
  metric: z
    .object({
      recordedAt: z.string().trim(),
      workload: z.number().optional(),
      distanceMeters: z.number().optional(),
      sprintCount: z.number().optional(),
      fatigueLevel: z.number().optional(),
      sleepHours: z.number().optional(),
    })
    .optional(),
});

const normalizeHeader = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toLowerCase();

const inferBirthDateFromAge = (ageValue?: string) => {
  if (!ageValue) return null;
  const age = Number(ageValue);
  if (!Number.isFinite(age) || age <= 0) return null;
  const date = new Date();
  date.setFullYear(date.getFullYear() - age);
  return date.toISOString().slice(0, 10);
};

const parseNumber = (value: string | undefined) => {
  if (!value) return undefined;
  const parsed = Number(value.toString().replace(",", "."));
  return Number.isFinite(parsed) ? parsed : undefined;
};

export const csvImportService = {
  detectColumns(headers: string[]) {
    return headers.map((header) => {
      const normalizedHeader = normalizeHeader(header);
      const mappedField =
        CANONICAL_FIELDS.find((field) => FIELD_ALIASES[field].some((alias) => normalizeHeader(alias) === normalizedHeader)) ?? null;

      return {
        source: header,
        normalized: normalizedHeader,
        mappedField,
        confidence: mappedField ? 0.92 : 0.2,
      };
    });
  },

  async previewAthletesCsv(clubId: string, content: string) {
    const records = parse(content, {
      bom: true,
      columns: true,
      skip_empty_lines: true,
      trim: true,
    }) as Record<string, string>[];

    const headers = records.length > 0 ? Object.keys(records[0]) : [];
    const detectedColumns = this.detectColumns(headers);
    const mappedFieldBySource = new Map(
      detectedColumns.filter((item) => item.mappedField).map((item) => [item.source, item.mappedField as string]),
    );

    const previewRows = await Promise.all(
      records.slice(0, 50).map(async (row, index) => {
        const canonical = Object.fromEntries(
          Object.entries(row).map(([key, value]) => [mappedFieldBySource.get(key) ?? key, value]),
        ) as Record<string, string>;

        const normalization = athleteNormalizationService.normalizeAthlete({
          fullName: canonical.fullName,
          position: canonical.position,
          birthDate: canonical.birthDate ?? inferBirthDateFromAge(canonical.age),
        });

        const duplicateMatches = await duplicateDetectionService.detect(clubId, {
          fullName: normalization.fullName ?? canonical.fullName,
          birthDate: normalization.birthDate ?? canonical.birthDate ?? inferBirthDateFromAge(canonical.age),
        });

        const issues = [
          !canonical.fullName ? "Coluna de nome não identificada ou vazia." : null,
          !canonical.position ? "Coluna de posição não identificada ou vazia." : null,
        ].filter(Boolean);

        return {
          tempId: `preview-${index + 1}`,
          rowNumber: index + 2,
          raw: row,
          normalizedAthlete: {
            fullName: normalization.fullName ?? canonical.fullName ?? "",
            position: normalization.position ?? canonical.position ?? "",
            birthDate: normalization.birthDate ?? canonical.birthDate ?? inferBirthDateFromAge(canonical.age),
            externalId: canonical.externalId ?? null,
          },
          metricDraft: canonical.recordedAt
            ? {
                recordedAt: canonical.recordedAt,
                workload: parseNumber(canonical.workload),
                distanceMeters: parseNumber(canonical.distanceMeters),
                sprintCount: parseNumber(canonical.sprintCount),
                fatigueLevel: parseNumber(canonical.fatigueLevel),
                sleepHours: parseNumber(canonical.sleepHours),
              }
            : null,
          validation: {
            isValid: issues.length === 0,
            issues,
          },
          duplicateMatches: duplicateMatches.matches,
          explainability: normalization.explainability,
        };
      }),
    );

    return {
      summary: {
        totalRows: records.length,
        previewRows: previewRows.length,
        detectedColumns: detectedColumns.filter((item) => item.mappedField).length,
        rowsWithIssues: previewRows.filter((item) => !item.validation.isValid).length,
      },
      detectedColumns,
      rows: previewRows,
      explainability: {
        title: "Importação inteligente de CSV",
        summary: "O serviço inferiu colunas por aliases conhecidos, normalizou valores e verificou duplicidade antes da gravação.",
        factors: [
          "Mapeamento automático de cabeçalhos heterogêneos.",
          "Preview editável antes do commit definitivo.",
          "Detecção de possível duplicidade ainda na prévia.",
        ],
      },
    };
  },

  async commitAthletesImport(clubId: string, input: unknown, requestId?: string) {
    const payload = z.object({ rows: z.array(commitRowSchema).min(1) }).parse(input);
    const created = [];
    const errors = [];

    for (let index = 0; index < payload.rows.length; index += 1) {
      const row = payload.rows[index];

      try {
        const athlete = await athleteRepository.create(clubId, {
          fullName: athleteNormalizationService.normalizeName(row.fullName).normalized,
          position: athleteNormalizationService.normalizePosition(row.position).normalized,
          birthDate: row.birthDate ? new Date(row.birthDate) : null,
          externalId: row.externalId ?? null,
        });

        if (row.metric) {
          await performanceService.createMetric(
            clubId,
            {
              athleteId: athlete.id,
              ...row.metric,
            },
            "csv-smart-import",
            requestId,
          );
        }

        created.push(athlete);
      } catch (error) {
        errors.push({
          row: index + 1,
          message: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return {
      totalReceived: payload.rows.length,
      totalCreated: created.length,
      totalWithError: errors.length,
      created,
      errors,
    };
  },
};
