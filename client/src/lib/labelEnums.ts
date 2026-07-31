/**
 * Rótulos legíveis para enums/snake_case exibidos na UI (escolaridade, status, etc.).
 */
const ENUM_LABELS: Record<string, string> = {
  // booleanos / genéricos
  sim: "Sim",
  nao: "Não",
  nao_informado: "Não informado",
  nao_possui: "Não possui",
  nao_sabe: "Não sabe",
  nao_se_aplica: "Não se aplica",

  // status
  ativo: "Ativo",
  inativo: "Inativo",
  cursando: "Cursando",
  concluido: "Concluído",
  interrompido: "Interrompido",

  // turno
  matutino: "Matutino",
  vespertino: "Vespertino",
  noturno: "Noturno",

  // gênero / estado civil
  masculino: "Masculino",
  feminino: "Feminino",
  outro: "Outro",
  solteiro: "Solteiro(a)",
  casado: "Casado(a)",
  divorciado: "Divorciado(a)",
  viuvo: "Viúvo(a)",
  separado: "Separado(a)",
  uniao_estavel: "União estável",

  // escolaridade (cadastro unificado)
  nao_escolarizado: "Não escolarizado",
  nao_alfabetizado: "Não alfabetizado",
  fundamental_incompleto: "Fundamental Incompleto",
  fundamental_completo: "Fundamental Completo",
  eja_fundamental: "EJA — Fundamental",
  medio_incompleto: "Médio Incompleto",
  medio_completo: "Médio Completo",
  eja_medio: "EJA — Médio",
  superior_incompleto: "Superior Incompleto",
  superior_completo: "Superior Completo",
  pos_graduacao: "Pós-Graduação",
  sabe_ler_escrever: "Sabe ler e escrever",
  nao_sabe_ler_nem_escrever: "Não sabe ler nem escrever",
  sabe_assinar: "Sabe assinar o nome",

  // variantes psico / legado
  ensino_fundamental_incompleto: "Ensino Fundamental Incompleto",
  ensino_fundamental_completo: "Ensino Fundamental Completo",
  ensino_medio_incompleto: "Ensino Médio Incompleto",
  ensino_medio_completo: "Ensino Médio Completo",
  ensino_superior_incompleto: "Ensino Superior Incompleto",
  ensino_superior_completo: "Ensino Superior Completo",

  // situação trabalhista
  empregado_formal: "Empregado (formal)",
  empregado_informal: "Empregado (informal)",
  autonomo: "Autônomo",
  desempregado: "Desempregado",
  aposentado: "Aposentado",
  do_lar: "Do Lar",
  estudante: "Estudante",
};

/** Converte valor de enum/snake_case em texto amigável para exibição. */
export function formatEnumLabel(
  value: string | null | undefined,
  fallback = "-"
): string {
  if (value === null || value === undefined) return fallback;
  const raw = String(value).trim();
  if (!raw) return fallback;

  const key = raw.toLowerCase();
  if (ENUM_LABELS[key]) return ENUM_LABELS[key];

  // Já parece texto humano (com espaços / maiúsculas)
  if (/[A-ZÀ-Ú\s]/.test(raw) && !raw.includes("_")) return raw;

  return raw
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
