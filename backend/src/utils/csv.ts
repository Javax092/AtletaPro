import { parse } from "csv-parse/sync";

export const METRICS_CSV_HEADERS = [
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
] as const;

export type MetricsCsvHeader = (typeof METRICS_CSV_HEADERS)[number];

export type ParsedMetricsCsvRow = Record<MetricsCsvHeader, string> & {
  rowNumber: number;
};

const normalizeHeader = (value: string) => value.trim();

export const parseMetricsCsv = (content: string) => {
  const records = parse(content, {
    bom: true,
    columns: false,
    skip_empty_lines: true,
    trim: true,
  }) as string[][];

  if (records.length === 0) {
    return {
      headers: [] as string[],
      rows: [] as ParsedMetricsCsvRow[],
    };
  }

  const [rawHeaders, ...rawRows] = records;
  const headers = rawHeaders.map(normalizeHeader);

  const rows = rawRows.map((values, index) => {
    const record = Object.fromEntries(
      METRICS_CSV_HEADERS.map((header, headerIndex) => [header, (values[headerIndex] ?? "").trim()]),
    ) as Record<MetricsCsvHeader, string>;

    return {
      ...record,
      rowNumber: index + 2,
    };
  });

  return { headers, rows };
};
