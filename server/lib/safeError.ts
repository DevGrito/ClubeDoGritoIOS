const isProd = process.env.NODE_ENV === "production";

/** Mensagem segura para o client — em produção não expõe detalhes internos. */
export function toClientError(
  err: unknown,
  fallback = "Erro interno do servidor"
): string {
  if (!isProd) {
    if (err instanceof Error) return err.message;
    return String(err);
  }
  return fallback;
}

/** Loga o erro completo no servidor; retorna payload JSON seguro para o client. */
export function safeErrorPayload(
  err: unknown,
  fallback = "Erro interno do servidor"
): { error: string } {
  if (err instanceof Error) {
    console.error("[API]", err.message, isProd ? "" : err.stack);
  } else {
    console.error("[API]", err);
  }
  return { error: toClientError(err, fallback) };
}
