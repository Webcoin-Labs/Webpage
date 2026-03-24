import "server-only";

type LogLevel = "info" | "warn" | "error";

type LogContext = {
  scope: string;
  message: string;
  data?: Record<string, unknown>;
  error?: unknown;
};

const REDACT_KEYS = ["password", "secret", "token", "authorization", "cookie", "accessKey", "apiKey"];

function scrub(value: unknown): unknown {
  if (value === null || value === undefined) return value;
  if (Array.isArray(value)) return value.map((item) => scrub(item));
  if (typeof value !== "object") return value;

  const output: Record<string, unknown> = {};
  for (const [key, raw] of Object.entries(value as Record<string, unknown>)) {
    const lower = key.toLowerCase();
    if (REDACT_KEYS.some((needle) => lower.includes(needle.toLowerCase()))) {
      output[key] = "[REDACTED]";
    } else {
      output[key] = scrub(raw);
    }
  }
  return output;
}

function formatError(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }
  return { message: String(error) };
}

function write(level: LogLevel, context: LogContext) {
  const payload = {
    ts: new Date().toISOString(),
    level,
    scope: context.scope,
    message: context.message,
    data: context.data ? scrub(context.data) : undefined,
    error: context.error ? formatError(context.error) : undefined,
  };
  const line = JSON.stringify(payload);
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.info(line);

  const sinkUrl = process.env.OBSERVABILITY_SINK_URL;
  if (sinkUrl) {
    const token = process.env.OBSERVABILITY_SINK_TOKEN;
    void fetch(sinkUrl, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
      body: line,
      cache: "no-store",
    }).catch(() => undefined);
  }
}

export const logger = {
  info(context: LogContext) {
    write("info", context);
  },
  warn(context: LogContext) {
    write("warn", context);
  },
  error(context: LogContext) {
    write("error", context);
  },
};
