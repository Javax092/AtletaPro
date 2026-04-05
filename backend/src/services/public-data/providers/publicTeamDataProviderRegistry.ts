import { env } from "../../../config/env.js";
import type { ExternalTeamDataProvider } from "./externalTeamDataProvider.js";
import { HttpExternalTeamDataProvider } from "./httpExternalTeamDataProvider.js";
import { NoopExternalTeamDataProvider } from "./noopExternalTeamDataProvider.js";

const providers = new Map<string, ExternalTeamDataProvider>();

const noopProvider = new NoopExternalTeamDataProvider();
providers.set(noopProvider.key, noopProvider);

const httpProvider = new HttpExternalTeamDataProvider();
providers.set(httpProvider.key, httpProvider);

export const publicTeamDataProviderRegistry = {
  get(providerKey?: string) {
    return providers.get(providerKey ?? env.PUBLIC_DATA_PROVIDER_MODE) ?? noopProvider;
  },

  register(provider: ExternalTeamDataProvider) {
    providers.set(provider.key, provider);
  },

  list() {
    return [...providers.keys()];
  },
};
