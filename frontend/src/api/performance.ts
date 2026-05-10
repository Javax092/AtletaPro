import { api } from "./client";
import type {
  CsvPreviewResult,
  MetricsImportReport,
  PerformanceRecord,
  PerformanceRecordInput,
} from "../types/performance";
import {
  appendStoredPerformanceRecords,
  buildImportReportFromPreview,
  createPerformanceRecord,
  readStoredPerformanceRecords,
} from "../utils/performance";

type PerformanceListResponse =
  | PerformanceRecord[]
  | {
      records?: PerformanceRecord[];
      data?: PerformanceRecord[];
    };

const extractRecords = (payload: PerformanceListResponse) => {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload.records)) {
    return payload.records;
  }

  if (Array.isArray(payload.data)) {
    return payload.data;
  }

  return [] as PerformanceRecord[];
};

export const performanceApi = {
  list: async () => {
    const response = await api.get<PerformanceListResponse>("/performance");
    return extractRecords(response.data);
  },
  listLocal: () => readStoredPerformanceRecords(),
  createManual: async (payload: PerformanceRecordInput) => {
    try {
      const response = await api.post<PerformanceRecord | { record?: PerformanceRecord }>("/performance/manual", payload);
      const record = "record" in response.data ? response.data.record : response.data;

      if (!record) {
        throw new Error("Resposta vazia ao salvar performance manual.");
      }

      return record;
    } catch (error) {
      const record = createPerformanceRecord(payload, "manual");
      appendStoredPerformanceRecords([record]);
      return record;
    }
  },
  importCsv: async (file: File, preview: CsvPreviewResult) => {
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await api.post<MetricsImportReport>("/performance/import-csv", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      return response.data;
    } catch (error) {
      const records = preview.validRows
        .map((row) => row.record)
        .filter((record): record is PerformanceRecordInput => record !== null)
        .map((record) => createPerformanceRecord(record, "csv"));

      appendStoredPerformanceRecords(records);
      return buildImportReportFromPreview(preview);
    }
  },
};
