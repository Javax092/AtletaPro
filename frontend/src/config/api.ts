const trimTrailingSlash = (value: string) => value.replace(/\/+$/, "");

const resolveApiUrl = () => {
  const configuredApiUrl = import.meta.env.VITE_API_URL?.trim();

  if (configuredApiUrl) {
    return trimTrailingSlash(configuredApiUrl);
  }

  if (import.meta.env.DEV) {
    return "http://localhost:4000/api";
  }

  if (typeof window !== "undefined") {
    return `${trimTrailingSlash(window.location.origin)}/api`;
  }

  return "/api";
};

export const API_URL = resolveApiUrl();

if (!import.meta.env.VITE_API_URL && typeof window !== "undefined") {
  console.warn(
    "VITE_API_URL is not configured. Falling back to the current origin. Set VITE_API_URL in production when the backend runs on a separate domain.",
  );
}
