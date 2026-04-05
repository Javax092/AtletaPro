type LogLevel = "debug" | "info" | "warn" | "error";

type LogContext = Record<string, unknown>;

const writeLog = (level: LogLevel, event: string, context: LogContext = {}) => {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    service: "backend",
    event,
    ...context,
  };

  const line = JSON.stringify(entry);

  if (level === "error") {
    console.error(line);
    return;
  }

  console.log(line);
};

export const logger = {
  debug: (event: string, context?: LogContext) => writeLog("debug", event, context),
  info: (event: string, context?: LogContext) => writeLog("info", event, context),
  warn: (event: string, context?: LogContext) => writeLog("warn", event, context),
  error: (event: string, context?: LogContext) => writeLog("error", event, context),
};

export const maskEmail = (email: string) => {
  const [localPart, domain] = email.split("@");

  if (!localPart || !domain) {
    return "***";
  }

  return `${localPart.slice(0, 2)}***@${domain}`;
};
