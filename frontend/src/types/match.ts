export type MatchStatus = "SCHEDULED" | "COMPLETED" | "ANALYZED";
export type MatchVideoStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";

export interface MatchVideo {
  id: string;
  clubId: string;
  matchId: string;
  filename: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  storagePath: string;
  status: MatchVideoStatus;
  uploadedAt: string;
  processedAt: string | null;
}

export interface MatchSummary {
  id: string;
  clubId: string;
  title: string;
  opponent: string;
  matchDate: string;
  competition: string | null;
  status: MatchStatus;
  createdAt: string;
  updatedAt: string;
  videos: MatchVideo[];
  scoutReports: Array<{
    id: string;
    matchVideoId: string | null;
    analysisType: string;
    status: string;
    summary: string;
    heatmapPath: string | null;
    createdAt: string;
  }>;
}

export interface MatchPayload {
  title: string;
  opponent: string;
  matchDate: string;
  competition?: string | null;
}
