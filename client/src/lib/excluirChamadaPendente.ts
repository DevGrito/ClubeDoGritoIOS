export async function excluirChamadaPendente(payload: {
  tipo: "pec" | "inclusao";
  data: string;
  sessionId?: number;
  turmaId?: number;
}): Promise<void> {
  const res = await fetch("/api/chamadas/pendente", {
    method: "DELETE",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Não foi possível excluir a chamada pendente.");
  }
}
