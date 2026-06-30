import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { UserCheck } from "lucide-react";

// ────────────────────────────────────────────────────────────────
// Normaliza valores snake_case → texto legível em PT-BR
// ────────────────────────────────────────────────────────────────
const LABELS: Record<string, string> = {
  // genero
  masculino: "Masculino",
  feminino: "Feminino",
  nao_binario: "Não-binário",
  outro: "Outro",
  nao_informado: "Não informado",
  prefiro_nao_informar: "Prefiro não informar",
  // cor_raca
  branca: "Branca",
  preta: "Preta",
  parda: "Parda",
  amarela: "Amarela",
  indigena: "Indígena",
  nao_sabe_informar: "Não sabe informar",
  nao_declarado: "Não declarado",
  // estado_civil
  solteiro: "Solteiro(a)",
  casado: "Casado(a)",
  uniao_estavel: "União Estável",
  separado: "Separado(a)",
  divorciado: "Divorciado(a)",
  viuvo: "Viúvo(a)",
  // escolaridade
  nao_alfabetizado: "Não alfabetizado",
  ensino_fundamental_incompleto: "Ensino Fundamental Incompleto",
  ensino_fundamental_completo: "Ensino Fundamental Completo",
  ensino_medio_incompleto: "Ensino Médio Incompleto",
  ensino_medio_completo: "Ensino Médio Completo",
  ensino_superior_incompleto: "Ensino Superior Incompleto",
  ensino_superior_completo: "Ensino Superior Completo",
  pos_graduacao: "Pós-graduação",
  // renda / situação trabalhista
  empregado_clt: "Empregado (CLT)",
  empregado_pj: "Empregado (PJ)",
  autonomo: "Autônomo",
  desempregado: "Desempregado",
  aposentado: "Aposentado",
  estudante: "Estudante",
  do_lar: "Do lar",
  // renda familiar
  "ate_1_salario": "Até 1 salário mínimo",
  "1_a_2_salarios": "1 a 2 salários mínimos",
  "2_a_3_salarios": "2 a 3 salários mínimos",
  "3_a_5_salarios": "3 a 5 salários mínimos",
  "acima_5_salarios": "Acima de 5 salários mínimos",
  sem_renda: "Sem renda",
  // situacao_atendimento
  ativo: "Ativo",
  inativo: "Inativo",
  concluido: "Concluído",
  transferido: "Transferido",
  // grau_parentesco
  mae: "Mãe",
  pai: "Pai",
  avo: "Avô/Avó",
  tio: "Tio(a)",
  irmao: "Irmão/Irmã",
  conjuge: "Cônjuge",
  responsavel_legal: "Responsável Legal",
  // programa
  pec: "PEC",
  inclusao: "Inclusão Produtiva",
  // sim/nao booleans handled separately
};

function normalizeValue(val: any): string {
  if (val === null || val === undefined || val === "") return "Não informado";
  if (typeof val === "boolean") return val ? "Sim" : "Não";
  if (typeof val === "number") return String(val);
  const str = String(val).trim();
  if (!str) return "Não informado";
  if (LABELS[str.toLowerCase()]) return LABELS[str.toLowerCase()];
  // fallback: replace _ with space and capitalize
  return str.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatCPF(cpf: string | null | undefined): string {
  if (!cpf) return "Não informado";
  if (String(cpf).includes("*")) return String(cpf);
  const digits = cpf.replace(/\D/g, "");
  if (digits.length !== 11) return cpf;
  return `${digits.slice(0,3)}.${digits.slice(3,6)}.${digits.slice(6,9)}-${digits.slice(9)}`;
}

function formatDate(d: string | null | undefined): string {
  if (!d) return "Não informado";
  try { return new Date(d + "T12:00:00").toLocaleDateString("pt-BR"); } catch { return d; }
}

function calcAge(dob: string | null | undefined): string | null {
  if (!dob) return null;
  try {
    const birth = new Date(dob + "T12:00:00");
    const diff = Date.now() - birth.getTime();
    const age = Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
    return `${age} anos`;
  } catch { return null; }
}

// ────────────────────────────────────────────────────────────────
// Field row component
// ────────────────────────────────────────────────────────────────
function Field({ label, value, full }: { label: string; value: any; full?: boolean }) {
  const display = normalizeValue(value);
  return (
    <div className={full ? "col-span-2" : ""}>
      <p className="text-xs text-gray-500 mb-0.5">{label}</p>
      <p className="text-sm font-medium text-gray-800 break-words">{display}</p>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
// Section header component
// ────────────────────────────────────────────────────────────────
function Section({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        {icon && <span className="text-purple-600">{icon}</span>}
        <h4 className="text-sm font-semibold text-purple-700">{title}</h4>
        <div className="flex-1 h-px bg-purple-100" />
      </div>
      <div className="grid grid-cols-2 gap-x-6 gap-y-3 pl-1">
        {children}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
// Main Modal Component
// ────────────────────────────────────────────────────────────────
interface PsicoPerfilModalProps {
  open: boolean;
  onClose: () => void;
  atendido: any;
  perfil: any;
  responsavel?: any;
  responsaveis?: any[];
  loading?: boolean;
  turmas?: any[];
  programa?: string;
  mostrarHistorico?: boolean;
  /** false = visão resumida (outros monitores); true = cadastro completo (equipe psico) */
  fullProfile?: boolean;
}

export function PsicoPerfilModal({
  open,
  onClose,
  atendido,
  perfil,
  responsavel,
  responsaveis = [],
  loading,
  turmas,
  programa,
  mostrarHistorico = false,
  fullProfile = true,
}: PsicoPerfilModalProps) {
  const nome = perfil?.nome_completo || perfil?.nome || atendido?.nome || "-";
  const cpf = atendido?.cpf || perfil?.cpf;
  const status = perfil?.situacao_atendimento || atendido?.situacao_atendimento;
  const prog = programa || perfil?.fonte || atendido?.programa;
  const age = calcAge(perfil?.data_nascimento || atendido?.dataNascimento);
  const isRestricted = fullProfile === false || perfil?._restricted === true;
  const listaResponsaveis =
    responsaveis.length > 0
      ? responsaveis
      : responsavel
        ? [responsavel]
        : [];
  const contatosEmergencia = Array.isArray(perfil?.contatos_emergencia)
    ? perfil.contatos_emergencia
    : [];
  const relsFamiliares = Array.isArray(perfil?.relacionamentos_familiares)
    ? perfil.relacionamentos_familiares
    : [];

  const tipoLabels: Record<string, string> = {
    atendimento_individual: "Atendimento Individual",
    visita_domiciliar: "Visita Domiciliar",
    atendimento_coletivo: "Atendimento Coletivo",
    espaco_o_grito: "Espaço O Grito",
    acoes_saude: "Ações para Saúde",
    encaminhamento: "Encaminhamento",
    situacao_risco: "Situação de Risco",
    caravana_comunitaria: "Caravana Comunitária",
    outro: "Outro",
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-purple-600" />
            Detalhes Completos
          </DialogTitle>
        </DialogHeader>

        {loading && (
          <div className="flex items-center justify-center py-8 text-purple-600">
            <div className="animate-spin w-5 h-5 border-2 border-purple-600 border-t-transparent rounded-full mr-2" />
            Carregando dados...
          </div>
        )}

        <div className="space-y-6">
          {isRestricted && perfil && (
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
              Visualização resumida. Dados de contato, endereço e responsáveis estão disponíveis apenas para a equipe psicossocial.
            </p>
          )}

          {/* ── Header: Avatar + nome + CPF + status ── */}
          <div className="flex items-center gap-4 pb-4 border-b border-gray-100">
            <div className="w-14 h-14 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
              <UserCheck className="w-7 h-7 text-purple-500" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-bold text-gray-900 truncate">{nome}</h3>
              <p className="text-sm text-gray-500">CPF: {formatCPF(cpf)}</p>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                {status && (
                  <Badge variant="outline" className={`text-xs ${status === "ativo" ? "border-green-400 text-green-700 bg-green-50" : "border-gray-300 text-gray-600"}`}>
                    Status: {normalizeValue(status)}
                  </Badge>
                )}
                {prog && (
                  <Badge variant="outline" className={`text-xs ${prog === "pec" ? "border-yellow-400 text-yellow-700 bg-yellow-50" : "border-purple-300 text-purple-700 bg-purple-50"}`}>
                    {normalizeValue(prog)}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* ── Identificação ── */}
          <Section title="Identificação">
            <Field label="Nome Completo" value={nome} full />
            <Field label="Data de Nascimento" value={formatDate(perfil?.data_nascimento || atendido?.dataNascimento)} />
            <Field label="Idade" value={age} />
            <Field label="Gênero" value={perfil?.genero || atendido?.genero} />
            <Field label="Cor/Raça" value={perfil?.cor_raca || atendido?.corRaca} />
            <Field label="Estado Civil" value={perfil?.estado_civil} />
            <Field label="Naturalidade" value={perfil?.naturalidade} />
            <Field label="Nacionalidade" value={perfil?.nacionalidade} />
            <Field label="Religião" value={perfil?.religiao} />
            <Field label="Nº Matrícula" value={perfil?.numero_matricula || atendido?.matricula} />
            <Field label="NIS/PIS/PASEP" value={perfil?.nis_pis_pasep} />
            {(perfil?.fonte === "pec" || !perfil?.fonte) && (
              <>
                <Field label="Pode sair sozinho?" value={perfil?.pode_sair_sozinho} />
                <Field label="Família" value={perfil?.familia_nome} />
              </>
            )}
          </Section>

          {/* ── Contato ── */}
          {(fullProfile && !isRestricted) && (
            <Section title="Contato">
              <Field label="Telefone" value={perfil?.telefone || atendido?.telefone} />
              <Field label="WhatsApp" value={perfil?.whatsapp || atendido?.whatsapp} />
              <Field label="E-mail" value={perfil?.email || atendido?.email} full />
              {contatosEmergencia.length > 0 && (
                <div className="col-span-2 space-y-1">
                  <p className="text-xs text-gray-500">Contatos de emergência</p>
                  {contatosEmergencia.map((c: any, i: number) => (
                    <p key={i} className="text-sm font-medium text-gray-800 bg-gray-50 rounded px-2 py-1">
                      {c.nome || "Contato"}: {c.telefone || "—"}
                    </p>
                  ))}
                </div>
              )}
            </Section>
          )}

          {/* ── Endereço ── */}
          {fullProfile && !isRestricted && perfil && (
            <Section title="Endereço">
              <Field label="CEP" value={perfil.cep} />
              <Field label="Número" value={perfil.numero} />
              <Field label="Logradouro" value={perfil.logradouro} full />
              <Field label="Complemento" value={perfil.complemento} />
              <Field label="Bairro" value={perfil.bairro} />
              <Field label="Cidade" value={perfil.cidade} />
              <Field label="Estado" value={perfil.estado} />
              <Field label="Ponto de referência" value={perfil.ponto_referencia} full />
            </Section>
          )}

          {/* ── Socioeconômico ── */}
          {fullProfile && !isRestricted && perfil && (
            <Section title="Socioeconômico">
              <Field label="Escolaridade" value={perfil.escolaridade} />
              <Field label="Situação Trabalhista" value={perfil.situacao_trabalhista || perfil.situacao_profissional} />
              <Field label="Renda Familiar" value={perfil.renda_familiar_mensal || perfil.renda_familiar} />
              <Field label="Qtde. na residência" value={perfil.quantidade_filhos ?? perfil.quantas_pessoas_moram} />
              <Field label="Com quem mora" value={perfil.com_quem_mora} />
              <Field label="Composição familiar" value={perfil.composicao_familiar} />
              <Field label="Situação da moradia" value={perfil.situacao_moradia} />
              <Field label="Tipo de moradia" value={perfil.tipo_moradia} />
              <Field label="Bolsa Família" value={perfil.recebe_bolsa_familia ?? perfil.bolsa_familia} />
              <Field label="BPC" value={perfil.bpc} />
              <Field label="CadÚnico" value={perfil.cadunico} />
              <Field label="Cartão Alimentação" value={perfil.cartao_alimentacao} />
            </Section>
          )}

          {/* ── Educação ── */}
          {fullProfile && !isRestricted && perfil && (
            <Section title="Educação">
              <Field label="Estuda atualmente?" value={perfil.estuda_atualmente ?? perfil.situacao_escolar} />
              <Field label="Série/Ano" value={perfil.serie} />
              <Field label="Nome da Escola" value={perfil.nome_escola || perfil.instituicao_ensino} />
              <Field label="Turno" value={perfil.turno} />
              <Field label="Situação escolar" value={perfil.situacao_escolar} />
            </Section>
          )}

          {/* ── Saúde ── */}
          {fullProfile && !isRestricted && perfil && (
            <Section title="Saúde">
              <Field label="Possui deficiência?" value={perfil.possui_deficiencia} />
              <Field label="Qual deficiência?" value={perfil.qual_deficiencia || perfil.detalhes_deficiencia} />
              <Field label="Possui alergia?" value={perfil.possui_alergia} />
              <Field label="Qual alergia?" value={perfil.qual_alergia || perfil.detalhes_alergia} />
              <Field label="Usa medicamento?" value={perfil.faz_uso_medicamento} />
              <Field label="Qual medicamento?" value={perfil.qual_medicamento || perfil.detalhes_medicamento} />
              <Field label="Problema de saúde?" value={perfil.possui_problema_saude || perfil.possui_particularidade_saude} />
              <Field label="Detalhes saúde" value={perfil.qual_problema_saude || perfil.detalhes_particularidade} />
              <Field label="Tipo sanguíneo" value={perfil.tipo_sanguineo} />
              <Field label="Restrição alimentar" value={perfil.restricao_alimentar} />
            </Section>
          )}

          {/* ── Responsável(is) ── */}
          {fullProfile && !isRestricted && listaResponsaveis.length > 0 && (
            <Section title={listaResponsaveis.length > 1 ? "Responsáveis / Grupo Familiar" : "Responsável / Grupo Familiar"}>
              {listaResponsaveis.map((resp: any, idx: number) => (
                <div key={resp.id ?? idx} className={listaResponsaveis.length > 1 ? "col-span-2 border-b border-purple-50 pb-3 mb-3 last:border-0 last:pb-0 last:mb-0" : "contents"}>
                  {listaResponsaveis.length > 1 && (
                    <p className="text-xs font-semibold text-purple-600 mb-2 col-span-2">
                      {resp.e_principal ? "Responsável principal" : `Responsável ${idx + 1}`}
                    </p>
                  )}
                  <Field label="Nome" value={resp.nome_completo} full />
                  <Field label="CPF" value={formatCPF(resp.cpf)} />
                  <Field label="RG" value={resp.rg} />
                  <Field label="Grau de Parentesco" value={resp.grau_parentesco} />
                  <Field label="Profissão" value={resp.profissao} />
                  <Field label="Telefone" value={resp.telefone} />
                  <Field label="WhatsApp" value={resp.whatsapp} />
                  <Field label="E-mail" value={resp.email} />
                  <Field label="Mora com o aluno?" value={resp.mora_com_aluno} />
                  <Field label="Contato de emergência?" value={resp.e_contato_emergencia} />
                  {resp.logradouro && (
                    <Field
                      label="Endereço"
                      value={[resp.logradouro, resp.numero, resp.bairro, resp.cidade, resp.estado].filter(Boolean).join(", ")}
                      full
                    />
                  )}
                </div>
              ))}
            </Section>
          )}

          {/* ── Vínculos familiares (Inclusão) ── */}
          {fullProfile && !isRestricted && relsFamiliares.length > 0 && (
            <Section title="Vínculos familiares cadastrados">
              <div className="col-span-2 space-y-2">
                {relsFamiliares.map((rel: any, i: number) => (
                  <div key={i} className="text-sm bg-gray-50 rounded px-2 py-2">
                    <span className="font-medium">{rel.nome || "—"}</span>
                    {(rel.parentesco || rel.grau_parentesco) && (
                      <span className="text-gray-500"> — {rel.parentesco || rel.grau_parentesco}</span>
                    )}
                    {rel.telefone && <span className="block text-gray-600 text-xs mt-0.5">Tel: {rel.telefone}</span>}
                  </div>
                ))}
              </div>
            </Section>
          )}

          {fullProfile && !isRestricted && perfil?.observacoes_gerais && (
            <Section title="Observações gerais">
              <Field label="Observações" value={perfil.observacoes_gerais} full />
            </Section>
          )}

          {/* ── Turmas ── */}
          {turmas && turmas.length > 0 && (
            <Section title="Turmas">
              <div className="col-span-2 flex flex-wrap gap-2">
                {turmas.map((t: any, i: number) => (
                  <Badge key={i} variant="outline" className={`text-xs ${prog === "pec" ? "border-yellow-400 text-yellow-700 bg-yellow-50" : "border-green-400 text-green-700 bg-green-50"}`}>
                    {t.nome}
                  </Badge>
                ))}
              </div>
            </Section>
          )}

          {/* ── Histórico de Atendimentos ── */}
          {mostrarHistorico && atendido?.atendimentos && (
            <Section title={`Histórico de Atendimentos (${atendido.totalAtendimentos || atendido.atendimentos?.length || 0})`}>
              <div className="col-span-2 space-y-2 max-h-52 overflow-y-auto">
                {atendido.atendimentos.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-3">Nenhum atendimento registrado</p>
                ) : atendido.atendimentos.map((at: any) => (
                  <div key={at.id} className="flex items-center justify-between p-2 bg-purple-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{at.titulo}</p>
                      <p className="text-xs text-purple-600">{tipoLabels[at.tipo] || at.tipo}</p>
                    </div>
                    <span className="text-xs text-gray-400 whitespace-nowrap">
                      {at.data ? new Date(at.data + "T12:00:00").toLocaleDateString("pt-BR") : "-"}
                    </span>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {!loading && !perfil && (
            <p className="text-xs text-gray-400 text-center italic">
              {cpf ? "Pessoa não encontrada no cadastro completo do sistema." : "CPF não disponível para busca de dados adicionais."}
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
