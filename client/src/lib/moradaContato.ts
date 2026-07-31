export type MoradaContatoParticipante = {
  nome?: string;
  cpf?: string;
  telefone?: string | null;
  endereco?: string | null;
  logradouro?: string | null;
  numero?: string | null;
  complemento?: string | null;
  bairro?: string | null;
  bairro_outro?: string | null;
  cidade?: string | null;
  estado?: string | null;
  cep?: string | null;
  origem?: string;
  __nome?: string;
  __vertente?: string;
};

export function normalizeMoradaNome(nome: string | null | undefined): string {
  return String(nome || "").trim().toLowerCase();
}

export function normalizeMoradaCpf(cpf: string | null | undefined): string {
  return String(cpf || "").replace(/\D/g, "");
}

/** Monta endereço completo a partir de campos separados do cadastro. */
export function formatMoradaEnderecoCompleto(p: MoradaContatoParticipante): string | null {
  const rua = String(p.logradouro || p.endereco || "").trim();
  const linha1 = [rua, p.numero].filter(Boolean).join(", ");
  const bairro = String(p.bairro || p.bairro_outro || "").trim();
  const cidadeUf = [p.cidade, p.estado].filter(Boolean).join(" / ");
  const partes = [linha1, p.complemento, bairro, cidadeUf]
    .map((v) => String(v || "").trim())
    .filter(Boolean) as string[];
  return partes.length ? partes.join(" — ") : null;
}

/** @deprecated use formatMoradaEnderecoCompleto */
export function formatMoradaEnderecoFromFields(p: MoradaContatoParticipante): string | null {
  return formatMoradaEnderecoCompleto(p);
}

function pickMelhorEndereco(...candidatos: (string | null | undefined)[]): string | null {
  const validos = candidatos.map((c) => String(c || "").trim()).filter(Boolean);
  if (!validos.length) return null;
  return validos.sort((a, b) => b.length - a.length)[0];
}

function pickContato(p: MoradaContatoParticipante | undefined | null) {
  if (!p) return null;
  const telefone = p.telefone?.trim() || null;
  const endereco = formatMoradaEnderecoCompleto(p);
  if (!telefone && !endereco) return null;
  return { telefone, endereco };
}

export function resolveMoradaContato(
  item: Record<string, unknown>,
  participantes: MoradaContatoParticipante[] = []
): { telefone: string | null; endereco: string | null } {
  const nome = normalizeMoradaNome(
    (item.participanteNome as string) || (item.participante_nome as string)
  );
  const cpf = normalizeMoradaCpf(
    (item.participanteCpf as string) || (item.participante_cpf as string)
  );
  const origem = String(
    (item.participanteOrigem as string) || (item.participante_origem as string) || ""
  ).toLowerCase();

  const byCpf = (p: MoradaContatoParticipante) =>
    cpf.length >= 10 && normalizeMoradaCpf(p.cpf) === cpf;
  const byNome = (p: MoradaContatoParticipante) => {
    const pNome = normalizeMoradaNome(p.nome || p.__nome);
    return nome && pNome === nome;
  };
  const origemOf = (p: MoradaContatoParticipante) =>
    String(p.origem || p.__vertente || "").toLowerCase();

  const tryMatch = (filter?: (p: MoradaContatoParticipante) => boolean) => {
    const pool = filter ? participantes.filter(filter) : participantes;
    for (const p of pool) {
      if (byCpf(p)) {
        const hit = pickContato(p);
        if (hit) return hit;
      }
    }
    for (const p of pool) {
      if (byNome(p)) {
        const hit = pickContato(p);
        if (hit) return hit;
      }
    }
    return null;
  };

  let participanteHit: { telefone: string | null; endereco: string | null } | null = null;
  if (origem === "comunidade") {
    participanteHit = tryMatch((p) => origemOf(p) === "comunidade");
  } else if (origem === "inclusao") {
    participanteHit = tryMatch((p) => origemOf(p) === "inclusao");
  } else if (origem === "pec") {
    participanteHit = tryMatch((p) => origemOf(p) === "pec");
  }
  participanteHit = participanteHit || tryMatch();

  const apiTelefone =
    (item.participante_telefone as string) || (item.participanteTelefone as string) || null;
  const apiEndereco =
    (item.participante_endereco as string) || (item.participanteEndereco as string) || null;

  return {
    telefone: apiTelefone || participanteHit?.telefone || null,
    endereco: pickMelhorEndereco(participanteHit?.endereco, apiEndereco),
  };
}
