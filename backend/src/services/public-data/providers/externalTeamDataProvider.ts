export type ExternalTeamRecentResult = "W" | "D" | "L";

export type ExternalTeamContextRecord = {
  externalClubName: string;
  competition?: string;
  leaguePosition?: number;
  recentResults?: ExternalTeamRecentResult[];
  goalDifference?: number;
  venueContext?: "HOME" | "AWAY" | "NEUTRAL";
  collectedAt: string;
  externalTeamId?: string;
  summary?: string;
  payload?: Record<string, unknown>;
};

export type ExternalTeamContextSyncInput = {
  clubId: string;
  matchId?: string;
  externalClubName?: string;
  competition?: string;
  externalTeamId?: string;
  venueContext?: "HOME" | "AWAY" | "NEUTRAL";
};

export interface ExternalTeamDataProvider {
  key: string;
  fetchTeamContext(input: ExternalTeamContextSyncInput): Promise<ExternalTeamContextRecord>;
}
