import { storage } from "./storage";

export const PSICO_FULL_PROFILE_ROLES = [
  "monitor_psico",
  "coordenador_psico",
  "tecnica_psico",
  "coordenador",
  "admin",
  "dev",
  "leo",
  "dev-admin",
  "dev-marketing",
];

export function getUserRoleFromRequest(user: any): string {
  return String(user?.papel || user?.userPapel || user?.role || user?.tipo || "").toLowerCase();
}

export function hasPsicoFullProfileAccess(role: string): boolean {
  return PSICO_FULL_PROFILE_ROLES.includes(role);
}

function parseInclusaoId(raw: unknown): number | null {
  if (raw == null || raw === "") return null;
  const s = String(raw);
  const prefixed = s.match(/^inclusao_(\d+)$/i);
  if (prefixed) return parseInt(prefixed[1], 10);
  if (/^\d+$/.test(s)) return parseInt(s, 10);
  return null;
}

/** Normaliza registro PEC (Drizzle/snake) para o PsicoPerfilModal */
export function normalizeAlunoToPerfil(aluno: Record<string, any>) {
  const turno = aluno.turno_escolar ?? aluno.turno;
  return {
    fonte: "pec" as const,
    ...aluno,
    nome_completo: aluno.nome_completo,
    situacao_trabalhista: aluno.situacao_profissional ?? aluno.situacao_trabalhista,
    nome_escola: aluno.instituicao_ensino ?? aluno.nome_escola,
    turno: Array.isArray(turno) ? turno.join(", ") : turno,
    qual_deficiencia: aluno.detalhes_deficiencia ?? aluno.qual_deficiencia,
    qual_alergia: aluno.detalhes_alergia ?? aluno.qual_alergia,
    qual_medicamento: aluno.detalhes_medicamento ?? aluno.qual_medicamento,
    qual_problema_saude: aluno.detalhes_particularidade ?? aluno.qual_problema_saude,
    possui_problema_saude: aluno.possui_particularidade_saude ?? aluno.possui_problema_saude,
    recebe_bolsa_familia: aluno.bolsa_familia ?? aluno.recebe_bolsa_familia,
    numero_matricula: aluno.numero_matricula ?? aluno.codigo_matricula,
    contatos_emergencia: aluno.contatos_emergencia,
    relacionamentos_familiares: aluno.relacionamentos_familiares,
    observacoes_gerais: aluno.observacoes_gerais,
  };
}

/** Normaliza participante Inclusão (camelCase) para o PsicoPerfilModal */
export function normalizeInclusaoToPerfil(p: Record<string, any>) {
  const turno = p.turnoEscolar ?? p.turno_escolar ?? p.turno;
  const situacaoEscolar = p.situacaoEscolar ?? p.situacao_escolar;
  return {
    fonte: "inclusao" as const,
    id: p.id,
    cpf: p.cpf,
    nome: p.nome,
    nome_completo: p.nome,
    data_nascimento: p.dataNascimento ?? p.data_nascimento,
    genero: p.genero,
    email: p.email,
    telefone: p.telefone,
    whatsapp: p.telefoneWhatsapp ? p.telefone : p.whatsapp,
    cep: p.cep,
    logradouro: p.logradouro,
    numero: p.numero,
    complemento: p.complemento,
    bairro: p.bairro,
    cidade: p.cidade,
    estado: p.estado,
    ponto_referencia: p.pontoReferencia ?? p.ponto_referencia,
    escolaridade: p.escolaridade,
    estado_civil: p.estadoCivil ?? p.estado_civil,
    cor_raca: p.corRaca ?? p.cor_raca,
    naturalidade: p.naturalidade,
    nacionalidade: p.nacionalidade,
    religiao: p.religiao,
    pode_sair_sozinho: p.podeSairSozinho ?? p.pode_sair_sozinho,
    possui_deficiencia: p.possuiDeficiencia ?? p.possui_deficiencia,
    qual_deficiencia: p.detalhesDeficiencia ?? p.detalhes_deficiencia,
    possui_alergia: p.possuiAlergia ?? p.possui_alergia,
    qual_alergia: p.detalhesAlergia ?? p.detalhes_alergia,
    faz_uso_medicamento: p.fazUsoMedicamento ?? p.faz_uso_medicamento,
    qual_medicamento: p.detalhesMedicamento ?? p.detalhes_medicamento,
    bolsa_familia: p.bolsaFamilia ?? p.bolsa_familia,
    recebe_bolsa_familia: p.bolsaFamilia ?? p.bolsa_familia,
    bpc: p.bpc,
    cadunico: p.cadunico,
    cartao_alimentacao: p.cartaoAlimentacao ?? p.cartao_alimentacao,
    status: p.status,
    situacao_atendimento: p.status,
    serie: p.serie,
    situacao_escolar: situacaoEscolar,
    estuda_atualmente: situacaoEscolar === "cursando" ? "sim" : situacaoEscolar ? "nao" : undefined,
    nome_escola: p.instituicaoEnsino ?? p.instituicao_ensino,
    instituicao_ensino: p.instituicaoEnsino ?? p.instituicao_ensino,
    turno: Array.isArray(turno) ? turno.join(", ") : turno,
    nis_pis_pasep: p.nisPisPasep ?? p.nis_pis_pasep,
    rg: p.rg,
    observacoes_gerais: p.observacoesGerais ?? p.observacoes_gerais ?? p.observacoes,
    relacionamentos_familiares: p.relacionamentosFamiliares ?? p.relacionamentos_familiares,
    outros_relacionamentos: p.outrosRelacionamentos ?? p.outros_relacionamentos,
    contatos_emergencia: p.contatosEmergencia ?? p.contatos_emergencia,
    forma_acesso: p.formaAcesso ?? p.forma_acesso,
    data_entrada: p.dataEntrada ?? p.data_entrada,
    codigo_matricula: p.codigoMatricula ?? p.codigo_matricula,
    experiencia_profissional: p.experienciaProfissional ?? p.experiencia_profissional ?? p.experienciaAnterior,
    objetivos_profissionais: p.objetivosProfissionais,
    procura_trabalho: p.procuraTrabalho ?? p.procura_trabalho,
    demandas: p.demandas,
  };
}

function maskCpfPartial(cpf: string | null | undefined): string | null {
  const clean = String(cpf || "").replace(/\D/g, "");
  if (clean.length !== 11) return null;
  return `***.***.*${clean.slice(7, 9)}-${clean.slice(9)}`;
}

/** Versão resumida para monitores PEC/Inclusão (sem dados sensíveis) */
export function redactPerfilForLimitedMonitor(perfil: Record<string, any> | null) {
  if (!perfil) return null;
  return {
    fonte: perfil.fonte,
    nome_completo: perfil.nome_completo || perfil.nome,
    nome: perfil.nome,
    data_nascimento: perfil.data_nascimento,
    genero: perfil.genero,
    cor_raca: perfil.cor_raca,
    situacao_atendimento: perfil.situacao_atendimento || perfil.status,
    numero_matricula: perfil.numero_matricula,
    cpf: maskCpfPartial(perfil.cpf),
    _restricted: true,
  };
}

function relacionamentoToResponsavel(rel: any) {
  if (!rel || typeof rel !== "object") return null;
  return {
    nome_completo: rel.nome || rel.nome_completo,
    grau_parentesco: rel.parentesco || rel.grau_parentesco || rel.relacao,
    telefone: rel.telefone,
    email: rel.email,
    mora_com_aluno: rel.mora_com_aluno ?? rel.moraComAluno,
  };
}

export interface AtendidoPerfilQuery {
  cpf?: string;
  id?: string;
  programa?: string;
}

export async function fetchAtendidoPerfil(
  query: AtendidoPerfilQuery,
  fullAccess: boolean
): Promise<{
  perfil: Record<string, any> | null;
  responsavel: Record<string, any> | null;
  responsaveis: Record<string, any>[];
}> {
  const cpf = query.cpf ? String(query.cpf).replace(/\D/g, "") : "";
  const programa = (query.programa || "").toLowerCase();
  const inclusaoId = parseInclusaoId(query.id);

  let perfil: Record<string, any> | null = null;
  let responsavel: Record<string, any> | null = null;
  let responsaveis: Record<string, any>[] = [];

  const tryPec = async () => {
    if (!cpf) return;
    const aluno = await storage.getAlunoByCpf(cpf);
    if (!aluno) return;
    perfil = normalizeAlunoToPerfil(aluno as Record<string, any>);
    if (!fullAccess) return;
    const lista = await storage.getResponsaveisByAlunoCpf(cpf);
    responsaveis = lista;
    const principal = lista.find((r) => r.e_principal) || lista[0];
    if (principal) {
      responsavel = principal;
    } else if ((aluno as any).id_responsavel) {
      const legado = await storage.getResponsavelById((aluno as any).id_responsavel);
      if (legado) {
        responsavel = legado;
        responsaveis = [legado];
      }
    }
  };

  const tryInclusao = async () => {
    let participante: Record<string, any> | undefined;
    if (inclusaoId != null && inclusaoId > 0) {
      participante = (await storage.getParticipanteById(inclusaoId)) as Record<string, any> | undefined;
    } else if (cpf) {
      participante = (await storage.getParticipanteByCpf(cpf)) as Record<string, any> | undefined;
    }
    if (!participante) return;
    perfil = normalizeInclusaoToPerfil(participante);
    if (!fullAccess) return;
    const rels = participante.relacionamentosFamiliares ?? participante.relacionamentos_familiares;
    if (Array.isArray(rels) && rels.length > 0) {
      responsaveis = rels.map(relacionamentoToResponsavel).filter(Boolean) as Record<string, any>[];
      responsavel = responsaveis[0] || null;
    }
  };

  if (programa === "inclusao") {
    await tryInclusao();
    if (!perfil && cpf) await tryPec();
  } else if (programa === "pec") {
    await tryPec();
    if (!perfil) await tryInclusao();
  } else {
    await tryPec();
    if (!perfil) await tryInclusao();
  }

  if (!fullAccess && perfil) {
    perfil = redactPerfilForLimitedMonitor(perfil);
    responsavel = null;
    responsaveis = [];
  }

  return { perfil, responsavel, responsaveis };
}
