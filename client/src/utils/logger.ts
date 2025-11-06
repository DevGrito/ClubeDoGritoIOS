type Level = "debug" | "info" | "warn" | "error" | "silent";

const levelOrder: Record<Exclude<Level,"silent">, number> = {
  debug: 10, info: 20, warn: 30, error: 40
};

const envLevel = (import.meta.env.VITE_LOG_LEVEL as Level) || "info";
const enabledLevel = envLevel === "silent" ? Infinity : levelOrder[envLevel];

const enabledTags = new Set(
  (import.meta.env.VITE_DEBUG_TAGS || "")
    .split(",")
    .map(s => s.trim())
    .filter(Boolean)
);

function ok(level: keyof typeof levelOrder) {
  return levelOrder[level] >= enabledLevel;
}
function tagOk(tag?: string) {
  if (!tag) return true;
  if (enabledTags.size === 0) return true; // sem filtro → mostra todas as tags permitidas pelo nível
  return enabledTags.has(tag);
}

export const logger = {
  debug: (msg: string, data?: unknown, tag?: string) => {
    if (ok("debug") && tagOk(tag)) console.debug(msg, data ?? "");
  },
  info: (msg: string, data?: unknown, tag?: string) => {
    if (ok("info") && tagOk(tag)) console.info(msg, data ?? "");
  },
  warn: (msg: string, data?: unknown, tag?: string) => {
    if (ok("warn") && tagOk(tag)) console.warn(msg, data ?? "");
  },
  error: (msg: string, data?: unknown, tag?: string) => {
    if (ok("error") && tagOk(tag)) console.error(msg, data ?? "");
  },
};
