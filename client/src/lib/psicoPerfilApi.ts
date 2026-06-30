/** Monta query string para GET /api/psico/atendido-perfil */
export function buildAtendidoPerfilQuery(atendido: {
  cpf?: string | null;
  id?: string | number | null;
  programa?: string | null;
}): URLSearchParams | null {
  const params = new URLSearchParams();
  const cpfLimpo = String(atendido?.cpf || "").replace(/\D/g, "");
  if (cpfLimpo.length >= 11) params.set("cpf", cpfLimpo);

  const idRaw = atendido?.id;
  if (idRaw != null && idRaw !== "") {
    const idStr = String(idRaw);
    const prefixed = idStr.match(/^inclusao_(\d+)$/i);
    if (prefixed) {
      params.set("id", prefixed[1]);
      if (!params.has("programa")) params.set("programa", "inclusao");
    } else if (/^\d+$/.test(idStr) && atendido.programa === "inclusao") {
      params.set("id", idStr);
      params.set("programa", "inclusao");
    }
  }

  if (atendido?.programa) params.set("programa", String(atendido.programa));

  if (!params.has("cpf") && !params.has("id")) return null;
  return params;
}

export type AtendidoPerfilResponse = {
  success?: boolean;
  perfil?: Record<string, unknown> | null;
  responsavel?: Record<string, unknown> | null;
  responsaveis?: Record<string, unknown>[];
  fullProfile?: boolean;
  error?: string;
};

export async function fetchAtendidoPerfil(atendido: {
  cpf?: string | null;
  id?: string | number | null;
  programa?: string | null;
}): Promise<AtendidoPerfilResponse> {
  const params = buildAtendidoPerfilQuery(atendido);
  if (!params) return { success: false, perfil: null };
  const res = await fetch(`/api/psico/atendido-perfil?${params.toString()}`, {
    credentials: "include",
  });
  return res.json().catch(() => ({ success: false, perfil: null }));
}
