import { HttpError } from "../../../utils/httpError.js";
import type { ExternalTeamContextRecord, ExternalTeamContextSyncInput, ExternalTeamDataProvider } from "./externalTeamDataProvider.js";

export class NoopExternalTeamDataProvider implements ExternalTeamDataProvider {
  key = "noop";

  async fetchTeamContext(_input: ExternalTeamContextSyncInput): Promise<ExternalTeamContextRecord> {
    throw new HttpError(
      501,
      "External public team data provider is not configured yet. Persist contexts manually for now.",
    );
  }
}
