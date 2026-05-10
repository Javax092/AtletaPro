import type { Athlete } from "../types/athlete";
import type { DashboardMetricPoint, DashboardTrendPoint } from "../types/dashboard";
import type {
  CsvPreviewResult,
  CsvPreviewRow,
  MetricsImportError,
  MetricsImportReport,
  PerformanceFormValues,
  PerformanceRecord,
  PerformanceRecordInput,
  RiskAnalysis,
} from "../types/performance";

export const PERFORMANCE_STORAGE_KEY = "sports_ai_performance_records";

export const EMPTY_PERFORMANCE_FORM_VALUES: PerformanceFormValues = {
  athleteId: "",
  recordedAt: "",
  distanceMeters: "",
  sprintCount: "",
  accelCount: "",
  decelCount: "",
  workload: "",
  avgHeartRateBpm: "",
  maxHeartRateBpm: "",
  sessionMinutes: "",
  perceivedEffort: "",
  fatigueLevel: "",
  sleepHours: "",
  sorenessLevel: "",
};

const NUMERIC_FIELDS = [
  "distanceMeters",
  "sprintCount",
  "accelCount",
  "decelCount",
  "workload",
  "avgHeartRateBpm",
  "maxHeartRateBpm",
  "sessionMinutes",
  "perceivedEffort",
  "fatigueLevel",
  "sleepHours",
  "sorenessLevel",
] as const;

type NumericField = (typeof NUMERIC_FIELDS)[number];

const NUMERIC_FIELD_LABELS: Record<NumericField, string> = {
  distanceMeters: "Distância em metros",
  sprintCount: "Sprints",
  accelCount: "Acelerações",
  decelCount: "Desacelerações",
  workload: "Carga de treino",
  avgHeartRateBpm: "Frequência cardíaca média",
  maxHeartRateBpm: "Frequência cardíaca máxima",
  sessionMinutes: "Minutos da sessão",
  perceivedEffort: "Esforço percebido",
  fatigueLevel: "Nível de fadiga",
  sleepHours: "Horas de sono",
  sorenessLevel: "Nível de dor muscular",
};

const ISO_DATE_TIME_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(?:\.\d{1,3})?)?(Z|[+-]\d{2}:\d{2})$/;

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const buildRecordId = () =>
  typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `perf_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

export const isIsoDateTime = (value: string) => ISO_DATE_TIME_PATTERN.test(value) && !Number.isNaN(new Date(value).getTime());

const parseNumericField = (label: string, value: string) => {
  const trimmed = value.trim();

  if (trimmed.length === 0) {
    return { value: null as number | null };
  }

  const normalized = trimmed.replace(",", ".");
  const parsed = Number(normalized);

  if (!Number.isFinite(parsed)) {
    return { error: `${label} deve ser numérico.` };
  }

  return { value: parsed };
};

export const createPerformanceRecord = (
  input: PerformanceRecordInput,
  source: PerformanceRecord["source"],
): PerformanceRecord => {
  const now = new Date().toISOString();

  return {
    id: buildRecordId(),
    athleteId: input.athleteId,
    recordedAt: new Date(input.recordedAt).toISOString(),
    distanceMeters: input.distanceMeters ?? null,
    sprintCount: input.sprintCount ?? null,
    accelCount: input.accelCount ?? null,
    decelCount: input.decelCount ?? null,
    workload: input.workload ?? null,
    avgHeartRateBpm: input.avgHeartRateBpm ?? null,
    maxHeartRateBpm: input.maxHeartRateBpm ?? null,
    sessionMinutes: input.sessionMinutes ?? null,
    perceivedEffort: input.perceivedEffort ?? null,
    fatigueLevel: input.fatigueLevel ?? null,
    sleepHours: input.sleepHours ?? null,
    sorenessLevel: input.sorenessLevel ?? null,
    source,
    createdAt: now,
    updatedAt: now,
  };
};

export const parseManualPerformanceForm = (values: PerformanceFormValues) => {
  const fieldErrors: Partial<Record<keyof PerformanceFormValues, string>> = {};

  if (!values.athleteId.trim()) {
    fieldErrors.athleteId = "Selecione o atleta.";
  }

  if (!values.recordedAt.trim()) {
    fieldErrors.recordedAt = "Informe a data e hora da coleta.";
  } else {
    const parsedDate = new Date(values.recordedAt);

    if (Number.isNaN(parsedDate.getTime())) {
      fieldErrors.recordedAt = "Use uma data/hora válida.";
    }
  }

  const parsedValues = {} as Record<NumericField, number | null>;

  for (const field of NUMERIC_FIELDS) {
    const parsed = parseNumericField(NUMERIC_FIELD_LABELS[field], values[field]);

    if (parsed.error) {
      fieldErrors[field] = parsed.error;
      continue;
    }

    parsedValues[field] = parsed.value ?? null;
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  return {
    payload: {
      athleteId: values.athleteId,
      recordedAt: new Date(values.recordedAt).toISOString(),
      ...parsedValues,
    } satisfies PerformanceRecordInput,
    fieldErrors,
  };
};

const parseCsvLine = (line: string) => {
  const cells: string[] = [];
  let current = "";
  let insideQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];

    if (char === '"') {
      if (insideQuotes && line[index + 1] === '"') {
        current += '"';
        index += 1;
      } else {
        insideQuotes = !insideQuotes;
      }
      continue;
    }

    if (char === "," && !insideQuotes) {
      cells.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  cells.push(current.trim());

  return cells;
};

const buildCsvRow = (
  rowNumber: number,
  headers: string[],
  cells: string[],
  athleteMap: Map<string, Athlete>,
): CsvPreviewRow => {
  const values = headers.reduce<Record<string, string>>((accumulator, header, index) => {
    accumulator[header] = cells[index]?.trim() ?? "";
    return accumulator;
  }, {});

  const errors: string[] = [];
  const athleteId = values.athleteId ?? "";

  if (!athleteId) {
    errors.push("athleteId é obrigatório.");
  } else if (!athleteMap.has(athleteId)) {
    errors.push("athleteId não corresponde a um atleta ativo.");
  }

  if (!values.recordedAt) {
    errors.push("recordedAt é obrigatório.");
  } else if (!isIsoDateTime(values.recordedAt)) {
    errors.push("recordedAt deve estar em ISO 8601.");
  }

  const parsedNumericValues = {} as Record<NumericField, number | null>;

  for (const field of NUMERIC_FIELDS) {
    const parsed = parseNumericField(NUMERIC_FIELD_LABELS[field], values[field] ?? "");

    if (parsed.error) {
      errors.push(parsed.error);
      continue;
    }

    parsedNumericValues[field] = parsed.value ?? null;
  }

  if (errors.length > 0) {
    return {
      row: rowNumber,
      athleteId,
      athleteName: athleteMap.get(athleteId)?.fullName,
      values,
      record: null,
      errors,
    };
  }

  return {
    row: rowNumber,
    athleteId,
    athleteName: athleteMap.get(athleteId)?.fullName,
    values,
    record: {
      athleteId,
      recordedAt: values.recordedAt,
      ...parsedNumericValues,
    },
    errors: [],
  };
};

export const parsePerformanceCsv = (csvText: string, athletes: Athlete[]): CsvPreviewResult => {
  const lines = csvText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length === 0) {
    return {
      expectedHeaders: [],
      totalRead: 0,
      validRows: [],
      invalidRows: [
        {
          row: 0,
          athleteId: "",
          values: {},
          record: null,
          errors: ["O arquivo CSV está vazio."],
        },
      ],
    };
  }

  const headers = parseCsvLine(lines[0]);
  const athleteMap = new Map(athletes.map((athlete) => [athlete.id, athlete]));
  const requiredHeaders = [
    "athleteId",
    "recordedAt",
    "distanceMeters",
    "sprintCount",
    "accelCount",
    "decelCount",
    "workload",
    "avgHeartRateBpm",
    "maxHeartRateBpm",
    "sessionMinutes",
    "perceivedEffort",
    "fatigueLevel",
    "sleepHours",
    "sorenessLevel",
  ];
  const missingHeaders = requiredHeaders.filter((header) => !headers.includes(header));

  if (missingHeaders.length > 0) {
    return {
      expectedHeaders: requiredHeaders,
      totalRead: Math.max(lines.length - 1, 0),
      validRows: [],
      invalidRows: [
        {
          row: 1,
          athleteId: "",
          values: {},
          record: null,
          errors: [`Cabeçalhos obrigatórios ausentes: ${missingHeaders.join(", ")}`],
        },
      ],
    };
  }

  const validRows: CsvPreviewRow[] = [];
  const invalidRows: CsvPreviewRow[] = [];

  lines.slice(1).forEach((line, index) => {
    const row = buildCsvRow(index + 2, headers, parseCsvLine(line), athleteMap);

    if (row.errors.length > 0 || !row.record) {
      invalidRows.push(row);
      return;
    }

    validRows.push(row);
  });

  return {
    expectedHeaders: requiredHeaders,
    totalRead: lines.length - 1,
    validRows,
    invalidRows,
  };
};

export const buildImportReportFromPreview = (preview: CsvPreviewResult): MetricsImportReport => ({
  expectedHeaders: preview.expectedHeaders,
  totalRead: preview.totalRead,
  totalImported: preview.validRows.length,
  totalWithError: preview.invalidRows.length,
  errors: preview.invalidRows.flatMap<MetricsImportError>((row) =>
    row.errors.map((message) => ({
      row: row.row,
      athleteId: row.athleteId || undefined,
      message,
    })),
  ),
});

export const readStoredPerformanceRecords = () => {
  const raw = localStorage.getItem(PERFORMANCE_STORAGE_KEY);

  if (!raw) {
    return [] as PerformanceRecord[];
  }

  try {
    const parsed = JSON.parse(raw) as PerformanceRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const writeStoredPerformanceRecords = (records: PerformanceRecord[]) => {
  localStorage.setItem(PERFORMANCE_STORAGE_KEY, JSON.stringify(records));
};

export const appendStoredPerformanceRecords = (records: PerformanceRecord[]) => {
  const current = readStoredPerformanceRecords();
  writeStoredPerformanceRecords(dedupePerformanceRecords([...current, ...records]));
};

export const convertLegacyMetricToRecord = (metric: DashboardMetricPoint): PerformanceRecord => ({
  id: metric.id,
  athleteId: metric.athleteId,
  recordedAt: metric.recordedAt,
  distanceMeters: metric.distanceMeters ?? null,
  sprintCount: null,
  accelCount: null,
  decelCount: null,
  workload: metric.workload ?? null,
  avgHeartRateBpm: metric.avgHeartRateBpm ?? null,
  maxHeartRateBpm: null,
  sessionMinutes: metric.sessionMinutes ?? null,
  perceivedEffort: metric.perceivedEffort ?? null,
  fatigueLevel: metric.fatigueLevel ?? null,
  sleepHours: null,
  sorenessLevel: null,
  source: "seed",
  createdAt: metric.recordedAt,
  updatedAt: metric.recordedAt,
});

const recordFingerprint = (record: PerformanceRecord) =>
  [
    record.id,
    record.athleteId,
    record.recordedAt,
    record.distanceMeters,
    record.sprintCount,
    record.accelCount,
    record.decelCount,
    record.workload,
    record.avgHeartRateBpm,
    record.maxHeartRateBpm,
    record.sessionMinutes,
    record.perceivedEffort,
    record.fatigueLevel,
    record.sleepHours,
    record.sorenessLevel,
  ].join("|");

export const dedupePerformanceRecords = (records: PerformanceRecord[]) => {
  const unique = new Map<string, PerformanceRecord>();

  records.forEach((record) => {
    unique.set(recordFingerprint(record), record);
  });

  return Array.from(unique.values()).sort(
    (left, right) => new Date(right.recordedAt).getTime() - new Date(left.recordedAt).getTime(),
  );
};

export const buildTrendData = (records: PerformanceRecord[]): DashboardTrendPoint[] => {
  const grouped = new Map<
    string,
    {
      date: string;
      workloadTotal: number;
      fatigueTotal: number;
      workloadCount: number;
      fatigueCount: number;
      metricsCount: number;
    }
  >();

  records.forEach((record) => {
    const key = record.recordedAt.slice(0, 10);
    const current = grouped.get(key) ?? {
      date: record.recordedAt,
      workloadTotal: 0,
      fatigueTotal: 0,
      workloadCount: 0,
      fatigueCount: 0,
      metricsCount: 0,
    };

    current.metricsCount += 1;

    if (typeof record.workload === "number") {
      current.workloadTotal += record.workload;
      current.workloadCount += 1;
    }

    if (typeof record.fatigueLevel === "number") {
      current.fatigueTotal += record.fatigueLevel;
      current.fatigueCount += 1;
    }

    grouped.set(key, current);
  });

  return Array.from(grouped.values())
    .sort((left, right) => left.date.localeCompare(right.date))
    .slice(-7)
    .map((item) => ({
      date: item.date,
      label: new Date(item.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
      avgWorkload: Number((item.workloadTotal / Math.max(item.workloadCount, 1)).toFixed(1)),
      avgFatigue: Number((item.fatigueTotal / Math.max(item.fatigueCount, 1)).toFixed(1)),
      metricsCount: item.metricsCount,
    }));
};

const buildRiskSummary = (drivers: string[]) => {
  if (drivers.length === 0) {
    return "Sessão com sinais estáveis, sem gatilhos relevantes de risco.";
  }

  if (drivers.length === 1) {
    return `Atenção principal para ${drivers[0]}.`;
  }

  return `Risco puxado por ${drivers.slice(0, 2).join(" e ")}.`;
};

export const buildRiskAnalyses = (records: PerformanceRecord[], athletes: Athlete[]): RiskAnalysis[] => {
  const athleteMap = new Map(athletes.map((athlete) => [athlete.id, athlete]));

  return records
    .map((record) => {
      const athlete = athleteMap.get(record.athleteId);
      const workloadFactor = record.workload ? clamp((record.workload / 600) * 20, 0, 20) : 0;
      const fatigueFactor = record.fatigueLevel ? clamp((record.fatigueLevel / 10) * 22, 0, 22) : 0;
      const sorenessFactor = record.sorenessLevel ? clamp((record.sorenessLevel / 10) * 18, 0, 18) : 0;
      const effortFactor = record.perceivedEffort ? clamp((record.perceivedEffort / 10) * 16, 0, 16) : 0;
      const sleepFactor =
        typeof record.sleepHours === "number" ? clamp((Math.max(0, 8 - record.sleepHours) / 4) * 14, 0, 14) : 0;
      const heartRateRatio =
        typeof record.avgHeartRateBpm === "number" && typeof record.maxHeartRateBpm === "number" && record.maxHeartRateBpm > 0
          ? record.avgHeartRateBpm / record.maxHeartRateBpm
          : 0;
      const heartRateFactor = clamp(Math.max(0, heartRateRatio - 0.78) * 40, 0, 10);
      const durationFactor =
        typeof record.sessionMinutes === "number" ? clamp(Math.max(0, record.sessionMinutes - 70) / 4, 0, 8) : 0;
      const distanceFactor =
        typeof record.distanceMeters === "number" ? clamp(Math.max(0, record.distanceMeters - 8500) / 700, 0, 8) : 0;
      const riskScore = Math.round(
        clamp(
          workloadFactor +
            fatigueFactor +
            sorenessFactor +
            effortFactor +
            sleepFactor +
            heartRateFactor +
            durationFactor +
            distanceFactor,
          0,
          100,
        ),
      );
      const riskLevel = riskScore >= 70 ? "HIGH" : riskScore >= 45 ? "MEDIUM" : "LOW";
      const drivers = [
        fatigueFactor >= 12 ? "fadiga elevada" : "",
        sorenessFactor >= 10 ? "dor muscular acima do padrão" : "",
        sleepFactor >= 7 ? "sono insuficiente" : "",
        workloadFactor >= 12 ? "carga acumulada alta" : "",
        heartRateFactor >= 6 ? "frequência cardíaca sustentada" : "",
      ].filter((item) => item.length > 0);

      return {
        id: `risk_${record.id}`,
        athleteId: record.athleteId,
        riskScore,
        riskLevel,
        summary: buildRiskSummary(drivers),
        explanation:
          `Carga ${record.workload ?? "-"}, fadiga ${record.fatigueLevel ?? "-"}, sono ${record.sleepHours ?? "-"} h, dor muscular ${record.sorenessLevel ?? "-"}.`,
        createdAt: record.recordedAt,
        athlete: {
          id: athlete?.id ?? record.athleteId,
          fullName: athlete?.fullName ?? record.athleteId,
          position: athlete?.position,
        },
        performanceMetric: {
          recordedAt: record.recordedAt,
          workload: record.workload,
          avgHeartRateBpm: record.avgHeartRateBpm,
          sessionMinutes: record.sessionMinutes,
          perceivedEffort: record.perceivedEffort,
          fatigueLevel: record.fatigueLevel,
        },
      } satisfies RiskAnalysis;
    })
    .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());
};

export const buildDashboardMetrics = (records: PerformanceRecord[], athletes: Athlete[]): DashboardMetricPoint[] => {
  const athleteMap = new Map(athletes.map((athlete) => [athlete.id, athlete]));

  return records.map((record) => {
    const athlete = athleteMap.get(record.athleteId);

    return {
      id: record.id,
      athleteId: record.athleteId,
      recordedAt: record.recordedAt,
      workload: record.workload,
      fatigueLevel: record.fatigueLevel,
      sessionMinutes: record.sessionMinutes,
      avgHeartRateBpm: record.avgHeartRateBpm,
      distanceMeters: record.distanceMeters,
      perceivedEffort: record.perceivedEffort,
      athlete: {
        id: athlete?.id ?? record.athleteId,
        fullName: athlete?.fullName ?? record.athleteId,
        position: athlete?.position,
      },
    };
  });
};
