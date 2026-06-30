import React, { useState, useEffect, useRef } from "react";
import { clearLocalStoragePreservingLgpd } from "@/lib/auth-session";
import { formatCPF } from "@/lib/utils";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, keepPreviousData } from "@tanstack/react-query";
import { apiRequest, authFetch, queryClient } from "@/lib/queryClient";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { openPrivacyPreferences } from "@/lib/consentManager";
import { PushNotificationSettings } from "@/components/PushNotificationSettings";
import AreaConsentGate, { useAreaConsentReady } from "@/components/AreaConsentGate";
import { LgpdLegalHeaderButtons, LgpdMeusDadosSettingsPanel } from "@/components/LgpdLegalMenuSection";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import PsicoMonthlyReport from "@/components/psico/PsicoMonthlyReport";
import CoordenadorDashboard, { DarkMetricCard } from "@/components/CoordenadorDashboard";
import DashboardPeriodoFiltro from "@/components/dashboard/DashboardPeriodoFiltro";
import { appendPeriodoParams, buildPeriodoQueryString, type PeriodoFiltro } from "@/lib/dashboardPeriodoFiltro";
import { RelatoriosPanel } from "@/components/RelatoriosPanel";
import { 
  Users,
  User,
  BookOpen, 
  Calendar, 
  FileText, 
  Settings, 
  LogOut,
  Heart,
  Clock,
  Target,
  Activity,
  UserCheck,
  Shield,
  HeartHandshake,
  Plus,
  Search,
  Eye,
  Edit,
  Trash2,
  Filter,
  Download,
  AlertTriangle,
  Upload,
  RefreshCw,
  Lock,
  ExternalLink,
  ClipboardList,
  ChevronDown,
  ChevronRight,
  Pencil,
  BarChart2,
  Home,
  Layers,
  Loader2
} from "lucide-react";
import AlterarSenha from "@/components/AlterarSenha";
import DemandaEspontaneaSection from "@/components/DemandaEspontaneaSection";
import AtendidosComunidadeSection from "@/components/AtendidosComunidadeSection";
import Favela3DSection from "@/components/Favela3DSection";
import { PsicoPerfilModal } from "@/components/PsicoPerfilModal";
import { fetchAtendidoPerfil } from "@/lib/psicoPerfilApi";
import EventosGritoSection from "@/components/EventosGritoSection";
import { getDiasAulaParaTurma, getBrazilDateString } from "@/lib/class-days";
import {
  buildIntervencaoObservacoes,
  canEditIntervencaoPsico,
  findChamadaParaIntervencao,
  formatIntervencaoParticipantesResumo,
  getIntervencaoParticipantesResumo,
  intervencaoDataIso,
  parseIntervencaoObservacoes,
  participantesFromChamadaPresencas,
} from "@/lib/psicoIntervencaoObs";

const LOWER_WORDS_PT = new Set(['de','da','do','dos','das','e','em','por','para','com','a','o','as','os','ao','aos']);
const normalizeName = (name: string) =>
  name.toLowerCase().split(' ').map((w, i) =>
    i === 0 || !LOWER_WORDS_PT.has(w) ? w.charAt(0).toUpperCase() + w.slice(1) : w
  ).join(' ');

const MORADA_STATUS_OPTIONS = [
  { value: "em_visita_tecnica", label: "Em visita técnica" },
  { value: "ordem_servico_emitida", label: "Ordem de serviço emitida" },
  { value: "sem_visita", label: "Sem visita" },
  { value: "em_reformar", label: "Em reforma" },
  { value: "em_pausa", label: "Em pausa" },
  { value: "finalizado", label: "Finalizado" },
] as const;

const MORADA_COMODOS_OPTIONS = [
  "Sala",
  "Quarto",
  "Cozinha",
  "Copa",
  "Banheiro",
  "Garagem",
  "Telhado",
  "Laje",
  "Fachada",
  "Muro",
  "Portão",
  "Outros",
] as const;

function AlunosVinculoSection({ alunos, loading }: { alunos: any[]; loading: boolean }) {
  const [busca, setBusca] = useState('');
  const [filtro, setFiltro] = useState<'todos' | 'pec' | 'inclusao'>('todos');
  const [perfilAluno, setPerfilAluno] = useState<any>(null);
  const [perfilDados, setPerfilDados] = useState<any>(null);
  const [perfilResponsavel, setPerfilResponsavel] = useState<any>(null);
  const [perfilResponsaveis, setPerfilResponsaveis] = useState<any[]>([]);
  const [loadingPerfil, setLoadingPerfil] = useState(false);

  const abrirPerfil = async (a: any) => {
    setPerfilAluno(a);
    setPerfilDados(null);
    setPerfilResponsavel(null);
    setPerfilResponsaveis([]);
    setLoadingPerfil(true);
    try {
      const data = await fetchAtendidoPerfil(a);
      if (data.perfil) setPerfilDados(data.perfil);
      if (data.responsavel) setPerfilResponsavel(data.responsavel);
      if (Array.isArray(data.responsaveis)) setPerfilResponsaveis(data.responsaveis);
    } catch { /* silencioso */ }
    setLoadingPerfil(false);
  };

  const filtered = alunos
    .filter((a) => {
      if (filtro === 'pec' && a.programa !== 'pec') return false;
      if (filtro === 'inclusao' && a.programa !== 'inclusao') return false;
      if (!busca.trim()) return true;
      const t = busca.toLowerCase();
      return (a.nome || '').toLowerCase().includes(t) || (a.cpf || '').includes(busca);
    })
    .sort((a, b) => (a.nome || '').localeCompare(b.nome || '', 'pt-BR'));

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between flex-wrap gap-2">
            <span className="flex items-center gap-2"><Users className="w-5 h-5 text-green-500" /> Alunos com Vínculo em Turma</span>
            <div className="flex items-center gap-1">
              {(['todos', 'pec', 'inclusao'] as const).map((f) => (
                <Button key={f} size="sm" variant={filtro === f ? 'default' : 'outline'}
                  className={`text-xs px-3 ${f === 'pec' && filtro === f ? 'bg-yellow-500 hover:bg-yellow-600 border-yellow-500' : f === 'inclusao' && filtro === f ? 'bg-green-600 hover:bg-green-700 border-green-600' : ''}`}
                  onClick={() => setFiltro(f)}>
                  {f === 'todos' ? 'Todos' : f === 'pec' ? 'PEC' : 'Inclusão Produtiva'}
                </Button>
              ))}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input placeholder="Buscar aluno por nome ou CPF..." value={busca} onChange={(e) => setBusca(e.target.value)} className="pl-10" />
          </div>
          {loading ? (
            <div className="text-center py-10 text-gray-500">Carregando alunos...</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>CPF</TableHead>
                      <TableHead>Telefone</TableHead>
                      <TableHead>Turmas</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                          {busca ? 'Nenhum aluno encontrado para a busca.' : 'Nenhum aluno com vínculo em turma encontrado.'}
                        </TableCell>
                      </TableRow>
                    ) : filtered.map((a: any) => (
                      <TableRow key={a.id}>
                        <TableCell className="font-medium">{a.nome || '-'}</TableCell>
                        <TableCell className="text-sm font-mono text-gray-700">{formatCPF(a.cpf)}</TableCell>
                        <TableCell className="text-sm text-gray-600">{a.telefone || '-'}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {(a.turmas || []).map((t: any, ti: number) => (
                              <Badge key={ti} variant="outline" className={`text-xs ${a.programa === 'pec' ? 'border-yellow-400 text-yellow-700 bg-yellow-50' : 'border-green-400 text-green-700 bg-green-50'}`}>
                                {t.nome}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button size="sm" variant="ghost" title="Ver dados completos" onClick={() => abrirPerfil(a)}>
                            <Eye className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <p className="text-xs text-gray-400 mt-2 text-right">Total: {filtered.length} aluno{filtered.length !== 1 ? 's' : ''}</p>
            </>
          )}
        </CardContent>
      </Card>

      <PsicoPerfilModal
        open={!!perfilAluno}
        onClose={() => { setPerfilAluno(null); setPerfilDados(null); setPerfilResponsavel(null); setPerfilResponsaveis([]); }}
        atendido={perfilAluno}
        perfil={perfilDados}
        responsavel={perfilResponsavel}
        responsaveis={perfilResponsaveis}
        loading={loadingPerfil}
        turmas={perfilAluno?.turmas}
        programa={perfilAluno?.programa}
        mostrarHistorico={false}
        fullProfile
      />
    </>
  );
}

export default function CoordenadorPsicoPage() {
  const fetch = authFetch;
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { ready: consentReady, checking: consentChecking, markReady: setConsentReady } =
    useAreaConsentReady("employees");
  const [activeTab, setActiveTab] = useState('dashboard');
  const [activeSection, setActiveSection] = useState('dashboard');
  const [favela3dSubTab, setFavela3dSubTab] = useState<'atendidos' | 'registros'>('atendidos');
  const [mapeamentoSubTab, setMapeamentoSubTab] = useState<'mapeamento' | 'moradas-gerais'>('mapeamento');
  const [showMoradaReformaForm, setShowMoradaReformaForm] = useState(false);
  const [moradaPartBusca, setMoradaPartBusca] = useState("");
  const [moradaPartOpen, setMoradaPartOpen] = useState(false);
  const [moradaPartFiltroVertente, setMoradaPartFiltroVertente] = useState<"todos" | "pec" | "inclusao" | "comunidade">("todos");
  const [moradaComodos, setMoradaComodos] = useState<string[]>([]);
  const [moradaEditId, setMoradaEditId] = useState<number | null>(null);
  const [moradaMonitorId, setMoradaMonitorId] = useState<number | null>(null);
  const [moradaDeleteId, setMoradaDeleteId] = useState<number | null>(null);
  const [moradaForm, setMoradaForm] = useState({
    participanteNome: "",
    participanteCpf: "",
    participanteOrigem: "",
    semana: "1",
    data: new Date().toISOString().split("T")[0],
    status: "em_visita_tecnica",
    outrosComodo: "",
    observacoes: "",
  });
  const [mapData, setMapData] = useState(new Date().toISOString().slice(0, 10));
  const [mapCasas, setMapCasas] = useState("");
  const [mapObs, setMapObs] = useState("");
  const [mapEditId, setMapEditId] = useState<number | null>(null);
  const [mapEditMonitorId, setMapEditMonitorId] = useState<number | null>(null);
  const [mapDeleteId, setMapDeleteId] = useState<number | null>(null);
  const changeSection = (section: string) => {
    setActiveSection(section);
    requestAnimationFrame(() => {
      setTimeout(() => {
        const el = document.getElementById('coordenador-psico-content-area');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 300);
    });
  };
  const [showImportModal, setShowImportModal] = useState(false);
  const [showFamiliaModal, setShowFamiliaModal] = useState(false);
  const [showEditFamiliaModal, setShowEditFamiliaModal] = useState(false);
  const [showViewFamiliaModal, setShowViewFamiliaModal] = useState(false);
  const [showCasoModal, setShowCasoModal] = useState(false);
  const [showAtendimentoModal, setShowAtendimentoModal] = useState(false);
  const [showGrupoModal, setShowGrupoModal] = useState(false);
  const [showViolacaoModal, setShowViolacaoModal] = useState(false);
  const [showMedidaModal, setShowMedidaModal] = useState(false);
  const [showServicoModal, setShowServicoModal] = useState(false);
  const [showEncaminhamentoModal, setShowEncaminhamentoModal] = useState(false);
  const [showHistoricoModal, setShowHistoricoModal] = useState(false);
  const [showDeleteFamiliaDialog, setShowDeleteFamiliaDialog] = useState(false);
  const [showDeleteCasoDialog, setShowDeleteCasoDialog] = useState(false);
  const [intervencaoFiltroAno, setIntervencaoFiltroAno] = useState(new Date().getFullYear());
  const [intervencaoFiltroMes, setIntervencaoFiltroMes] = useState(0);
  const [showNovaIntervencao, setShowNovaIntervencao] = useState(false);
  const [intervencaoExpandida, setIntervencaoExpandida] = useState<string | null>(null);
  const [expandedIVPart, setExpandedIVPart] = useState<Set<string>>(new Set());
  const [intervencaoSubTab, setIntervencaoSubTab] = useState<"lista" | "registrar">("lista");
  const [editIntervencaoId, setEditIntervencaoId] = useState<number | null>(null);
  const [intervencaoForm, setIntervencaoForm] = useState({ titulo: '', tipo: 'outro', vertente: 'psicossocial', data: new Date().toISOString().split('T')[0], horario_inicio: '', horario_fim: '', participantes_presentes: 0, descricao: '', observacoes: '' });
  const [intervAtivTurmaId, setIntervAtivTurmaId] = useState("");
  const [intervAtivParticipantes, setIntervAtivParticipantes] = useState<{ id: string; nome: string; selecionado: boolean }[]>([]);
  const [intervAtivChamada, setIntervAtivChamada] = useState<{ loaded: boolean; exists: boolean; presencas: Array<{ alunoCpf: string; nome: string; presente: boolean; justificativa?: string }> }>({ loaded: false, exists: false, presencas: [] });
  const intervAtivPrevTurmaRef = useRef<string>("");
  const [confirmDeleteAtendido, setConfirmDeleteAtendido] = useState<{ open: boolean; id: number | null; nome: string }>({ open: false, id: null, nome: '' });
  const [confirmDeleteRegistro, setConfirmDeleteRegistro] = useState<{ open: boolean; id: number | null }>({ open: false, id: null });
  const [showViewCasoModal, setShowViewCasoModal] = useState(false);
  const [showEditCasoModal, setShowEditCasoModal] = useState(false);
  const [showAlterarSenhaModal, setShowAlterarSenhaModal] = useState(false);
  const [selectedParticipante, setSelectedParticipante] = useState<any>(null);
  const [selectedFamilia, setSelectedFamilia] = useState<any>(null);
  const [selectedCaso, setSelectedCaso] = useState<any>(null);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [buscaAtendido, setBuscaAtendido] = useState('');
  const [atendidoSelecionadoNome, setAtendidoSelecionadoNome] = useState('');
  const [buscaAtendidoFamilia, setBuscaAtendidoFamilia] = useState('');
  const [filtroPrograma, setFiltroPrograma] = useState<'todos' | 'pec' | 'inclusao'>('todos');
  const [buscaParticipante, setBuscaParticipante] = useState('');

  const [freqPrograma, setFreqPrograma] = useState<'pec' | 'inclusao'>('pec');
  const [freqTurmaId, setFreqTurmaId] = useState('');
  const [freqBusca, setFreqBusca] = useState('');
  const [freqExpandida, setFreqExpandida] = useState<string | null>(null);
  const [showCadastroAtendido, setShowCadastroAtendido] = useState(false);
  const [cadastroAtendidoForm, setCadastroAtendidoForm] = useState({
    nome: '', cpf: '', data_nascimento: '', sexo: '', raca: '', telefone: '', email: '',
    cep: '', endereco: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '',
    numero_pessoas: '', criancas: '', adolescentes: '', adultos: '', idosos: '',
    tem_cad_unico: '', tem_bolsa_familia: '', tem_bpc: '',
    demandas: '', observacoes: '',
  });

  const [confSubTab, setConfSubTab] = useState<"realizados" | "novo">("realizados");
  const [confSearchTerm, setConfSearchTerm] = useState("");
  const [confExpandedParticipante, setConfExpandedParticipante] = useState<string | null>(null);
  const [confExpandedRegistro, setConfExpandedRegistro] = useState<number | null>(null);
  const [psicoRegistroForm, setPsicoRegistroForm] = useState({ titulo: "", tipo: "atendimento_individual", conteudo: "", participanteNome: "", participanteCpf: "", participanteOrigem: "", participanteDataNascimento: "", data: new Date().toISOString().split("T")[0] });
  const [registroPartBusca, setRegistroPartBusca] = useState("");
  const [registroPartOpen, setRegistroPartOpen] = useState(false);
  const [registroPartFiltroVertente, setRegistroPartFiltroVertente] = useState<"todos" | "pec" | "inclusao" | "comunidade">("todos");
  const [editRegistroId, setEditRegistroId] = useState<number | null>(null);
  const [editRegistroForm, setEditRegistroForm] = useState({ titulo: "", tipo: "", conteudo: "", participanteNome: "", data: "" });
  const [editRegistroPartBusca, setEditRegistroPartBusca] = useState("");
  const [editRegistroPartOpen, setEditRegistroPartOpen] = useState(false);

  // Estados para registros gerais (coordenador)
  const [geraisSubTab, setGeraisSubTab] = useState<"realizados" | "novo">("realizados");
  const [geraisSearchTerm, setGeraisSearchTerm] = useState("");
  const [geraisForm, setGeraisForm] = useState({ tipoGeral: "atendimento_coletivo", categoria: "espaco_o_grito", conteudo: "", participanteNome: "", participanteCpf: "", data: new Date().toISOString().split("T")[0] });
  const [editGeraisId, setEditGeraisId] = useState<number | null>(null);
  const [editGeraisForm, setEditGeraisForm] = useState({ tipoGeral: "atendimento_coletivo", categoria: "", conteudo: "", participanteNome: "", data: "" });
  const [geraisColaboradoresIds, setGeraisColaboradoresIds] = useState<number[]>([]);
  const [geraisColabBusca, setGeraisColabBusca] = useState("");
  const [editGeraisColaboradoresIds, setEditGeraisColaboradoresIds] = useState<number[]>([]);
  const [editGeraisColabBusca, setEditGeraisColabBusca] = useState("");
  const [viewGeraisGeralRecord, setViewGeraisGeralRecord] = useState<any | null>(null);
  const [geraisPartBusca, setGeraisPartBusca] = useState("");
  const [geraisPartFiltroVertente, setGeraisPartFiltroVertente] = useState<"todos" | "pec" | "inclusao" | "comunidade">("todos");
  const [geraisParticipantes, setGeraisParticipantes] = useState<{nome: string; cpf?: string; origem?: string}[]>([]);
  const [editGeraisParticipantes, setEditGeraisParticipantes] = useState<{nome: string; cpf?: string; origem?: string}[]>([]);
  const [editGeraisPartBusca, setEditGeraisPartBusca] = useState("");
  const [editGeraisPartFiltro, setEditGeraisPartFiltro] = useState<"todos"|"pec"|"inclusao"|"comunidade">("todos");

  // Estados para formulários
  const [familiaForm, setFamiliaForm] = useState({
    nomeResponsavel: '',
    numeroMembros: 1,
    telefone: '',
    endereco: '',
    status: 'ativo' as 'ativo' | 'inativo' | 'em_acompanhamento' | 'encerrado',
    observacoes: '',
    atendidosSelecionados: [] as number[]
  });

  const [casoForm, setCasoForm] = useState({
    familiaId: null as number | null,
    titulo: '',
    tipo: '', // Ex: "Violência Doméstica", "Dependência Química", etc
    prioridade: 'media' as 'baixa' | 'media' | 'alta' | 'urgente',
    status: 'aberto' as 'aberto' | 'em_atendimento' | 'em_acompanhamento' | 'finalizado',
    descricao: '',
    responsavelNome: ''
  });

  const [atendimentoForm, setAtendimentoForm] = useState({
    familiaId: null as number | null,
    casoId: null as number | null,
    vinculoId: null as number | null,
    programaOrigem: null as 'inclusao' | 'pec' | null,
    tipo: 'individual' as 'individual' | 'familiar' | 'grupo' | 'visita_domiciliar',
    dataAtendimento: new Date().toISOString().split('T')[0],
    duracaoMinutos: 60,
    profissionalResponsavel: '',
    resumo: '',
    observacoes: ''
  });

  const [planoForm, setPlanoForm] = useState({
    familiaId: null as number | null,
    casoId: null as number | null,
    tipoAcompanhamento: '', // Ex: "Visita Domiciliar", "Atendimento Técnico"
    frequencia: '', // Ex: "Semanal", "Quinzenal", "Mensal"
    estrategias: '',
    observacoes: ''
  });

  const [grupoForm, setGrupoForm] = useState({
    nome: '',
    tipo: 'terapeutico' as 'terapeutico' | 'apoio' | 'educativo' | 'oficina',
    facilitador: '',
    diaSemana: '',
    horario: '',
    local: '',
    maxParticipantes: 15,
    status: 'ativo' as 'ativo' | 'inativo' | 'em_formacao',
    descricao: '',
    objetivo: ''
  });

  const [violacaoForm, setViolacaoForm] = useState({
    vitimaNome: '',
    vitimaIdade: '',
    tipoViolacao: '',
    dataRegistro: new Date().toISOString().split('T')[0],
    status: 'em_investigacao' as 'em_investigacao' | 'em_acompanhamento' | 'encaminhado' | 'resolvido',
    prioridade: 'alta' as 'baixa' | 'media' | 'alta' | 'urgente',
    descricao: '',
    medidasTomadas: '',
    orgaosAcionados: ''
  });

  const [medidaForm, setMedidaForm] = useState({
    codigo: '',
    tipo: '',
    beneficiario: '',
    descricao: '',
    dataInicio: new Date().toISOString().split('T')[0],
    prazo: '',
    status: 'ativa' as 'ativa' | 'em_andamento' | 'concluida' | 'cancelada',
    responsavel: '',
    observacoes: ''
  });

  const [servicoForm, setServicoForm] = useState({
    nome: '',
    tipo: '',
    categoria: '',
    endereco: '',
    telefone: '',
    email: '',
    horarioFuncionamento: '',
    responsavel: '',
    descricao: '',
    observacoes: ''
  });

  const [encaminhamentoForm, setEncaminhamentoForm] = useState({
    familiaPessoa: '',
    servicoDestino: '',
    tipo: '',
    dataEncaminhamento: new Date().toISOString().split('T')[0],
    motivo: '',
    status: 'pendente' as 'pendente' | 'em_andamento' | 'concluido' | 'cancelado',
    prioridade: 'media' as 'baixa' | 'media' | 'alta',
    profissionalResponsavel: '',
    observacoes: ''
  });

  const [perfilForm, setPerfilForm] = useState({
    nome: '',
    email: '',
    telefone: ''
  });
  
  // Coordenador sempre exibe "Coordenador" (não pega do localStorage)
  // Pegar ID do coordenador do sessionStorage (login de coordenador)
  const rawCoordData =
    sessionStorage.getItem("coordenador_data") ||
    localStorage.getItem("coordenador_data");

  let coordenadorId: number | null = null;

  try {
    if (rawCoordData) coordenadorId = Number(JSON.parse(rawCoordData)?.id || null);
  } catch {
    coordenadorId = null;
  }

  // ✅ fallback: outras chaves comuns no seu projeto
  const fallbackId =
    Number(localStorage.getItem("coordenadorId") || 0) ||
    Number(localStorage.getItem("userId") || 0);

  // ✅ id final
  const finalId = coordenadorId || fallbackId || null;

  // ✅ userId que habilita as queries
  const userId = finalId ? String(finalId) : null;
  const userName = "Coordenador";
  const userPapel = localStorage.getItem("userPapel");
  const canDelete = userPapel !== "tecnica_psico";

  // Estados de filtro do dashboard
  const [dashFiltroAno, setDashFiltroAno] = useState(new Date().getFullYear());
  const [dashFiltroPeriodo, setDashFiltroPeriodo] = useState<PeriodoFiltro>("todos");
  const [coordDashView, setCoordDashView] = useState<"psico" | "favela">("psico");
  const [categoriaModalCoord, setCategoriaModalCoord] = useState<string | null>(null);

  // Query para buscar dados do dashboard do coordenador
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['/api/coordenador/dashboard', userId, 'psico'],
    queryFn: async () => {
      const response = await fetch(`/api/coordenador/dashboard/${userId}?area=psico`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error('Falha ao carregar dados do painel');
      return response.json();
    },
    enabled: !!userId,
  });

  // Query para buscar dados demográficos do dashboard psico
  const { data: psicoDemogData, isLoading: isPsicoDemogLoading } = useQuery({
    queryKey: ['/api/coordenador/dashboard-demografico-psico', dashFiltroAno, dashFiltroPeriodo],
    queryFn: async () => {
      const response = await fetch(
        `/api/coordenador/dashboard-demografico-psico${buildPeriodoQueryString(dashFiltroAno, dashFiltroPeriodo)}`,
        {
        credentials: "include",
      });
      if (!response.ok) throw new Error('Falha ao carregar dashboard psico');
      return response.json();
    },
    enabled: !!userId,
    placeholderData: keepPreviousData,
  });

  // Query para buscar dados do perfil do coordenador
  const { data: userData } = useQuery({
    queryKey: ['/api/coordenadores', coordenadorId],
    queryFn: async () => {
      const response = await fetch(`/api/coordenadores/${coordenadorId}`);
      if (!response.ok) throw new Error('Falha ao carregar dados do coordenador');
      return response.json();
    },
    enabled: !!coordenadorId,
    
  });

  // Atualizar form quando userData carregar
  useEffect(() => {
    if (userData) {
      setPerfilForm({
        nome: userData.nome || '',
        email: userData.email || '',
        telefone: userData.telefone || ''
      });
    }
  }, [userData]);

  // Mutations para criar entidades psicossociais
  const createFamiliaMutation = useMutation({
    mutationFn: async (data: typeof familiaForm) => {
      // Criar família
      const familia = await apiRequest('/api/psico/familias', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nomeResponsavel: data.nomeResponsavel,
          numeroMembros: data.numeroMembros,
          telefone: data.telefone,
          endereco: data.endereco,
          status: data.status,
          observacoes: data.observacoes
        })
      });

      // Se houver atendidos selecionados, vincular à família
      if (data.atendidosSelecionados.length > 0) {
        // Separar IDs por programa
        const inclusaoIds: number[] = [];
        const pecIds: number[] = [];
        
        data.atendidosSelecionados.forEach(vinculoId => {
          const participante = participantesData?.find((p: any) => p.vinculo_id === vinculoId);
          if (participante) {
            if (participante.programa_origem === 'inclusao') {
              inclusaoIds.push(vinculoId);
            } else if (participante.programa_origem === 'pec') {
              pecIds.push(vinculoId);
            }
          }
        });

        await apiRequest('/api/psico/vincular-atendidos-familia', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
         body: JSON.stringify({
        familiaId: familia?.data?.id, // <-- backend retorna { success, data }
        inclusaoIds,
        pecIds
          })
       });
      }

      return familia;
    },
    onSuccess: () => {
      toast({
        title: "Família cadastrada",
        description: "A família foi cadastrada com sucesso."
      });
      queryClient.invalidateQueries({ queryKey: ['/api/psico/familias'] });
      queryClient.invalidateQueries({ queryKey: ['/api/psico/participantes'] });
      setShowFamiliaModal(false);
      setBuscaAtendidoFamilia('');
      setFamiliaForm({
        nomeResponsavel: '',
        numeroMembros: 1,
        telefone: '',
        endereco: '',
        status: 'ativo',
        observacoes: '',
        atendidosSelecionados: []
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao cadastrar família",
        description: error.message || "Não foi possível cadastrar a família. Tente novamente.",
        variant: "destructive"
      });
    }
  });

  const updateFamiliaMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: typeof familiaForm }) => {
      return await apiRequest(`/api/psico/familias/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      toast({
        title: "Família atualizada",
        description: "A família foi atualizada com sucesso."
      });
      queryClient.invalidateQueries({ queryKey: ['/api/psico/familias'] });
      setShowEditFamiliaModal(false);
      setSelectedFamilia(null);
      setFamiliaForm({
        nomeResponsavel: '',
        numeroMembros: 1,
        telefone: '',
        endereco: '',
        status: 'ativo',
        observacoes: '',
        atendidosSelecionados: []
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar família",
        description: error.message || "Não foi possível atualizar a família. Tente novamente.",
        variant: "destructive"
      });
    }
  });

  const createCasoMutation = useMutation({
    mutationFn: async (data: typeof casoForm) => {
      return await apiRequest('/api/psico/casos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      toast({
        title: "Caso criado",
        description: "O caso foi criado com sucesso."
      });
      queryClient.invalidateQueries({ queryKey: ['/api/psico/casos'] });
      setShowCasoModal(false);
      setCasoForm({
        familiaId: null,
        titulo: '',
        tipo: '',
        prioridade: 'media',
        status: 'aberto',
        descricao: ''
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar caso",
        description: error.message || "Não foi possível criar o caso. Tente novamente.",
        variant: "destructive"
      });
    }
  });

  const createAtendimentoMutation = useMutation({
    mutationFn: async (data: typeof atendimentoForm) => {
      return await apiRequest('/api/psico/atendimentos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      toast({
        title: "Atendimento registrado",
        description: "O atendimento foi registrado com sucesso."
      });
      queryClient.invalidateQueries({ queryKey: ['/api/psico/atendimentos'] });
      setBuscaAtendido('');
      setAtendidoSelecionadoNome('');
      setAtendimentoForm({
        familiaId: null,
        casoId: null,
        vinculoId: null,
        programaOrigem: null,
        tipo: 'individual',
        dataAtendimento: new Date().toISOString().split('T')[0],
        duracaoMinutos: 60,
        profissionalResponsavel: '',
        resumo: '',
        observacoes: ''
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao registrar atendimento",
        description: error.message || "Não foi possível registrar o atendimento. Tente novamente.",
        variant: "destructive"
      });
    }
  });

  const createPlanoMutation = useMutation({
    mutationFn: async (data: typeof planoForm) => {
      return await apiRequest('/api/psico/planos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      toast({
        title: "Plano criado",
        description: "O plano de acompanhamento foi criado com sucesso."
      });
      queryClient.invalidateQueries({ queryKey: ['/api/psico/planos'] });
      setPlanoForm({
        familiaId: null,
        casoId: null,
        tipoAcompanhamento: '',
        frequencia: '',
        estrategias: '',
        observacoes: ''
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar plano",
        description: error.message || "Não foi possível criar o plano. Tente novamente.",
        variant: "destructive"
      });
    }
  });

  const deleteFamiliaMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest(`/api/psico/familias/${id}`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/psico/familias'] });
      toast({
        title: "Família excluída!",
        description: "A família foi excluída com sucesso."
      });
      setShowDeleteFamiliaDialog(false);
      setSelectedFamilia(null);
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao excluir família",
        description: error.message || "Não foi possível excluir a família.",
        variant: "destructive"
      });
    }
  });

  const deleteCasoMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest(`/api/psico/casos/${id}`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/psico/casos'] });
      toast({
        title: "Caso excluído!",
        description: "O caso foi arquivado com sucesso."
      });
      setShowDeleteCasoDialog(false);
      setSelectedCaso(null);
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao excluir caso",
        description: error.message || "Não foi possível excluir o caso.",
        variant: "destructive"
      });
    }
  });

  const { data: participantesData = [], isLoading: isLoadingParticipantes } = useQuery({
    queryKey: ['/api/psico/participantes', userId, filtroPrograma],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filtroPrograma && filtroPrograma !== 'todos') params.set('filtro', filtroPrograma);
      const response = await fetch(`/api/psico/participantes?${params.toString()}`, {
        credentials: "include",
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err?.error || 'Falha ao carregar participantes');
      }

      const data = await response.json();
      const lista = data?.participantes || data?.data || [];
      if (!Array.isArray(lista)) return [];
      for (const p of lista) {
        if (p.nome) p.nome = p.nome.replace(/^\s+|\s+$/g, '');
      }
      lista.sort((a: any, b: any) => (a.nome || '').localeCompare(b.nome || '', 'pt-BR'));
      return lista;
    },
    enabled: !!userId,
  });

  const participantesFiltrados = buscaParticipante
    ? participantesData.filter((p: any) => p.nome?.toLowerCase().includes(buscaParticipante.toLowerCase()))
    : participantesData;

  // Query para buscar histórico de atendimentos de um participante
  const { data: historicoData, isLoading: isLoadingHistorico } = useQuery({
    queryKey: ['/api/psico/atendimentos/participante', selectedParticipante?.vinculo_id, selectedParticipante?.programa_origem],
    enabled: !!selectedParticipante?.vinculo_id && !!selectedParticipante?.programa_origem && showHistoricoModal,
    queryFn: async () => {
      const url = `/api/psico/atendimentos/participante?vinculoId=${selectedParticipante.vinculo_id}&programaOrigem=${selectedParticipante.programa_origem}`;
      const response = await fetch(url, {
        headers: {
        }
      });
      if (!response.ok) throw new Error('Erro ao buscar histórico');
      return response.json();
    }
  });

  // Mutation para sincronizar participantes existentes
const syncParticipantesMutation = useMutation({
  mutationFn: async () => {
    const resp = await fetch('/api/psico/sync-participantes', {
      method: "POST",
      credentials: "include",
    });

    const json = await resp.json().catch(() => ({}));
    if (!resp.ok) throw new Error(json?.error || "Erro ao sincronizar");
    return json;
  },
  onSuccess: (data: any) => {
    const total = data?.vinculosCriados?.total ?? 0;
    const inc = data?.vinculosCriados?.inclusao ?? 0;
    const pec = data?.vinculosCriados?.pec ?? 0;

    toast({
      title: "Sincronização concluída!",
      description: `${total} vínculos criados (${inc} Inclusão + ${pec} PEC)`,
    });

    queryClient.invalidateQueries({ queryKey: ['/api/psico/participantes'] });
  },
  onError: (error: any) => {
    toast({
      title: "Erro na sincronização",
      description: error.message || "Não foi possível sincronizar. Tente novamente.",
      variant: "destructive",
    });
  },
});

  const updatePerfilMutation = useMutation({
    mutationFn: async (data: typeof perfilForm) => {
      return await apiRequest(`/api/coordenadores/${coordenadorId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      toast({
        title: "Perfil atualizado",
        description: "Suas informações foram salvas com sucesso."
      });
      queryClient.invalidateQueries({ queryKey: ['/api/coordenadores', coordenadorId] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar perfil",
        description: error.message || "Não foi possível atualizar o perfil. Tente novamente.",
        variant: "destructive"
      });
    }
  });

  const handleSavePerfil = () => {
    updatePerfilMutation.mutate(perfilForm);
  };

  // Query para buscar famílias
  const { data: familias = [], isLoading: isLoadingFamilias } = useQuery<any[]>({
    queryKey: ['/api/psico/familias'],
    queryFn: async () => {
      const response = await fetch('/api/psico/familias', {
      });
      if (!response.ok) throw new Error('Erro ao buscar famílias');
      return response.json();
    },
    enabled: !!userId,
    select: (res: any) => res?.data || [], // <-- backend retorna { success, data }
  })
  // Query para buscar casos
  const { data: casos = [], isLoading: isLoadingCasos } = useQuery({
    queryKey: ['/api/psico/casos'],
    queryFn: async () => {
      const response = await fetch('/api/psico/casos', {
      });
      if (!response.ok) throw new Error('Erro ao buscar casos');
      return response.json();
    },
    enabled: !!userId,
    select: (res: any) => res?.data || [], // <-- backend retorna { success, data }
  });

  // Query para buscar atendimentos
const { data: atendimentos = [], isLoading: isLoadingAtendimentos } = useQuery({
  queryKey: ['/api/psico/atendimentos'],
  queryFn: async () => {
    const response = await fetch('/api/psico/atendimentos', {
    });
    if (!response.ok) throw new Error('Erro ao buscar atendimentos');
    const result = await response.json();
    console.log('🔍 [ATENDIMENTOS DEBUG] Dados recebidos:', result);
    console.log('🔍 [ATENDIMENTOS DEBUG] Array (data):', result?.data);
    console.log('🔍 [ATENDIMENTOS DEBUG] Quantidade:', result?.data?.length);
    return result;
  },
  enabled: !!userId,
  select: (res: any) => {
    const atends = res?.data || []; // <-- backend retorna { success, data }
    console.log('🔍 [ATENDIMENTOS DEBUG] Após select:', atends);
    console.log('🔍 [ATENDIMENTOS DEBUG] Após select - quantidade:', atends.length);
    return atends;
  },
});
  // Query para buscar planos
const { data: planos = [], isLoading: isLoadingPlanos } = useQuery({
  queryKey: ['/api/psico/planos'],
  queryFn: async () => {
    const response = await fetch('/api/psico/planos', {
    });
    if (!response.ok) throw new Error('Erro ao buscar planos');
    return response.json();
  },
  enabled: !!userId,
  select: (res: any) => res?.data || [], // <-- backend retorna { success, data }
});
  const { data: atendidosRegistrados = [], isLoading: loadingAtendidosReg } = useQuery({
    queryKey: ['/api/psico/coordenador/atendidos-registrados'],
    queryFn: async () => {
      const res = await fetch(`/api/psico/coordenador/atendidos-registrados`, { credentials: 'include' });
      if (!res.ok) return [];
      const json = await res.json();
      return json.atendidos || [];
    },
    enabled: !!userId && activeSection === 'participantes',
  });

  const { data: atendidosComunidade = [], isLoading: loadingComunidade } = useQuery({
    queryKey: ['/api/psico/atendidos-comunidade'],
    queryFn: async () => {
      const res = await fetch('/api/psico/atendidos-comunidade', {});
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!userId && activeSection === 'participantes',
  });

  const { data: alunosTurmasData = { alunos: [] }, isLoading: loadingAlunosTurmas } = useQuery({
    queryKey: ['/api/psico/alunos-turmas'],
    queryFn: async () => {
      const res = await fetch('/api/psico/alunos-turmas', { credentials: 'include' });
      if (!res.ok) return { alunos: [] };
      return res.json();
    },
    enabled: !!userId && activeSection === 'alunos',
  });
  const alunosLista: any[] = (alunosTurmasData as any)?.alunos || [];

  const { data: psicoDashStats } = useQuery({
    queryKey: ['/api/psico/dashboard-stats'],
    queryFn: async () => {
      const res = await fetch(`/api/psico/dashboard-stats`, {});
      if (!res.ok) return {};
      return res.json();
    },
    enabled: activeSection === 'participantes',
  });

  // KPIs canônicos — fonte única de verdade para todos os dashboards psico
  const { data: psicoKpis } = useQuery({
    queryKey: ['/api/psico/dashboard-kpis', dashFiltroAno, dashFiltroPeriodo],
    queryFn: async () => {
      const url = `/api/psico/dashboard-kpis${buildPeriodoQueryString(dashFiltroAno, dashFiltroPeriodo)}`;
      const res = await fetch(url, { credentials: 'include' });
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!userId,
    placeholderData: keepPreviousData,
  });

  const { data: mapeamentosData, refetch: refetchMapeamentos } = useQuery({
    queryKey: ['/api/mapeamentos/coordenador', dashFiltroAno, dashFiltroPeriodo],
    queryFn: async () => {
      const url = `/api/mapeamentos/coordenador${buildPeriodoQueryString(dashFiltroAno, dashFiltroPeriodo)}`;
      const res = await fetch(url, { credentials: 'include' });
      if (!res.ok) return { data: [], total: 0, porMonitor: {} };
      return res.json().catch(() => ({ data: [], total: 0, porMonitor: {} }));
    },
    enabled: !!userId && activeSection === 'mapeamento',
  });

  const { data: mapeamentosStats } = useQuery({
    queryKey: ['/api/mapeamentos/stats', dashFiltroAno, dashFiltroPeriodo],
    queryFn: async () => {
      const url = `/api/mapeamentos/stats${buildPeriodoQueryString(dashFiltroAno, dashFiltroPeriodo)}`;
      const res = await fetch(url, { credentials: 'include' });
      if (!res.ok) return { total: 0 };
      return res.json().catch(() => ({ total: 0 }));
    },
    enabled: !!userId,
  });

  const criarMapeamentoCoordMutation = useMutation({
    mutationFn: async (payload: { monitorId: number; data: string; casasMapeadas: number; observacao?: string }) => {
      const res = await fetch("/api/mapeamentos", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Erro ao salvar mapeamento");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Mapeamento registrado!", description: "Casas mapeadas salvas com sucesso." });
      setMapCasas("");
      setMapObs("");
      setMapData(new Date().toISOString().slice(0, 10));
      setMapEditId(null);
      setMapEditMonitorId(null);
      refetchMapeamentos();
    },
    onError: () => toast({ title: "Erro", description: "Não foi possível salvar o mapeamento.", variant: "destructive" }),
  });
  const atualizarMapeamentoCoordMutation = useMutation({
    mutationFn: async (payload: { id: number; monitorId: number; data: string; casasMapeadas: number; observacao?: string }) => {
      const res = await fetch("/api/mapeamentos/" + payload.id, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Erro ao atualizar mapeamento");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Mapeamento atualizado!", description: "Registro atualizado com sucesso." });
      setMapCasas("");
      setMapObs("");
      setMapData(new Date().toISOString().slice(0, 10));
      setMapEditId(null);
      setMapEditMonitorId(null);
      refetchMapeamentos();
    },
    onError: () => toast({ title: "Erro", description: "Não foi possível atualizar o mapeamento.", variant: "destructive" }),
  });
  const excluirMapeamentoCoordMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch("/api/mapeamentos/" + id, {
        method: "DELETE",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error("Erro ao excluir mapeamento");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Mapeamento excluído", description: "Registro removido com sucesso." });
      refetchMapeamentos();
    },
    onError: () => toast({ title: "Erro", description: "Não foi possível excluir o mapeamento.", variant: "destructive" }),
  });

  const { data: moradasReformasData, refetch: refetchMoradasReformas } = useQuery({
    queryKey: ['/api/moradas-gerais/reformas', 'coordenador'],
    queryFn: async () => {
      const res = await fetch('/api/moradas-gerais/reformas', { credentials: 'include' });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || 'Erro ao carregar moradas gerais');
      }
      return res.json();
    },
    enabled: !!userId,
  });

  const criarMoradaReformaMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch('/api/moradas-gerais/reformas', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Erro ao salvar reforma');
      return res.json();
    },
    onSuccess: () => {
      setMoradaForm({
        participanteNome: "",
        participanteCpf: "",
        participanteOrigem: "",
        semana: "1",
        data: new Date().toISOString().split("T")[0],
        status: "em_visita_tecnica",
        outrosComodo: "",
        observacoes: "",
      });
      setMoradaComodos([]);
      setMoradaPartBusca("");
      setMoradaEditId(null);
      setMoradaMonitorId(null);
      setShowMoradaReformaForm(false);
      queryClient.invalidateQueries({ queryKey: ['/api/moradas-gerais/reformas', 'coordenador'] });
      refetchMoradasReformas();
      toast({ title: "Reforma cadastrada", description: "Cadastro de reforma criado com sucesso." });
    },
    onError: () => toast({ title: "Erro", description: "Não foi possível salvar a reforma.", variant: "destructive" }),
  });
  const atualizarMoradaReformaMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch(`/api/moradas-gerais/reformas/${payload.id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Erro ao atualizar reforma');
      return res.json();
    },
    onSuccess: () => {
      setMoradaForm({
        participanteNome: "",
        participanteCpf: "",
        participanteOrigem: "",
        semana: "1",
        data: new Date().toISOString().split("T")[0],
        status: "em_visita_tecnica",
        outrosComodo: "",
        observacoes: "",
      });
      setMoradaComodos([]);
      setMoradaPartBusca("");
      setMoradaEditId(null);
      setMoradaMonitorId(null);
      setShowMoradaReformaForm(false);
      queryClient.invalidateQueries({ queryKey: ['/api/moradas-gerais/reformas', 'coordenador'] });
      refetchMoradasReformas();
      toast({ title: "Reforma atualizada", description: "Cadastro de reforma atualizado com sucesso." });
    },
    onError: () => toast({ title: "Erro", description: "Não foi possível atualizar a reforma.", variant: "destructive" }),
  });
  const excluirMoradaReformaMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/moradas-gerais/reformas/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Erro ao excluir reforma');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/moradas-gerais/reformas', 'coordenador'] });
      refetchMoradasReformas();
      toast({ title: "Reforma excluída", description: "Cadastro removido com sucesso." });
    },
    onError: () => toast({ title: "Erro", description: "Não foi possível excluir a reforma.", variant: "destructive" }),
  });
  const moradasReformasList = ((moradasReformasData as any)?.data ?? []) as any[];
  const moradaMonitoresOpcoes = (() => {
    const porMonitor = (mapeamentosData as any)?.porMonitor ?? {};
    if (Object.keys(porMonitor).length > 0) {
      return Object.entries(porMonitor).map(([id, info]: [string, any]) => ({
        id: Number(id),
        nome: info.nome as string,
      }));
    }
    const map = new Map<number, string>();
    for (const r of moradasReformasList) {
      const id = Number(r.monitor_id ?? r.monitorId);
      if (id && !map.has(id)) {
        map.set(id, r.monitor_nome || `Monitor #${id}`);
      }
    }
    return Array.from(map.entries()).map(([id, nome]) => ({ id, nome }));
  })();
  const moradasResumo = {
    total: moradasReformasList.length,
    emAndamento: moradasReformasList.filter((r: any) => ["em_reformar", "em_pausa", "ordem_servico_emitida"].includes(r.status)).length,
    finalizadas: moradasReformasList.filter((r: any) => r.status === "finalizado").length,
    emVisita: moradasReformasList.filter((r: any) => r.status === "em_visita_tecnica").length,
  };
  const getMoradaStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      em_visita_tecnica: "Em visita técnica",
      ordem_servico_emitida: "Ordem de serviço emitida",
      sem_visita: "Sem visita",
      em_reformar: "Em reforma",
      em_pausa: "Em pausa",
      finalizado: "Finalizado",
    };
    return labels[status] || status;
  };
  const moradasDashboardPorStatus = [
    { key: "em_reformar", label: "Em reforma", color: "#f97316" },
    { key: "em_pausa", label: "Em pausa", color: "#f59e0b" },
    { key: "ordem_servico_emitida", label: "Ordem de serviço emitida", color: "#3b82f6" },
    { key: "em_visita_tecnica", label: "Em visita técnica", color: "#06b6d4" },
    { key: "sem_visita", label: "Sem visita", color: "#64748b" },
    { key: "finalizado", label: "Finalizado", color: "#22c55e" },
  ].map((item) => ({
    label: item.label,
    color: item.color,
    value: moradasReformasList.filter((r: any) => r.status === item.key).length,
  }));
  const iniciarEdicaoMorada = (item: any) => {
    const listaComodos = Array.isArray(item.comodos) ? item.comodos : [];
    const outroComodo = (listaComodos.find((c: string) => String(c).startsWith("Outros:")) || "").replace(/^Outros:\s*/, "");
    const comodosBase = listaComodos.map((c: string) => String(c).startsWith("Outros:") ? "Outros" : c);
    setMoradaForm({
      participanteNome: item.participanteNome || item.participante_nome || "",
      participanteCpf: item.participanteCpf || item.participante_cpf || "",
      participanteOrigem: item.participanteOrigem || item.participante_origem || "",
      semana: String(item.semana || "1"),
      data: String(item.data || "").split("T")[0],
      status: item.status || "em_visita_tecnica",
      outrosComodo: outroComodo,
      observacoes: item.observacoes || "",
    });
    setMoradaComodos(comodosBase);
    setMoradaPartBusca(item.participanteNome || item.participante_nome || "");
    setMoradaEditId(Number(item.id));
    setMoradaMonitorId(Number(item.monitor_id ?? item.monitorId) || null);
    setShowMoradaReformaForm(true);
  };

  const { data: favela3dStatsCoord } = useQuery({
    queryKey: ['/api/gestao-vista/favela3d', dashFiltroAno, dashFiltroPeriodo],
    queryFn: async () => {
      const params = new URLSearchParams({ ano: String(dashFiltroAno) });
      appendPeriodoParams(params, dashFiltroPeriodo);
      const res = await fetch(`/api/gestao-vista/favela3d?${params}`, { credentials: 'include' });
      if (!res.ok) return {};
      return res.json().catch(() => ({}));
    },
    enabled: !!userId,
  });

  const { data: catDetalhesCoord, isLoading: loadingCatDetalhesCoord } = useQuery({
    queryKey: ['/api/favela3d/categoria', categoriaModalCoord, 'detalhes'],
    queryFn: async () => {
      const res = await fetch(`/api/favela3d/categoria/${categoriaModalCoord}/detalhes`, { credentials: 'include' });
      if (!res.ok) return null;
      return res.json().catch(() => null);
    },
    enabled: !!categoriaModalCoord,
  });

  const { data: gruposKpiCoord } = useQuery({
    queryKey: ['/api/favela3d/grupos-kpi'],
    queryFn: async () => {
      const res = await fetch('/api/favela3d/grupos-kpi', { credentials: 'include' });
      if (!res.ok) return { mulheres_pessoas: 0 };
      return res.json().catch(() => ({ mulheres_pessoas: 0 }));
    },
    enabled: !!userId,
  });

  // Mescla KPIs canônicos sobre os dados demográficos do endpoint existente
  // Prioridade: psicoKpis (sem auth, sempre disponível) > psicoDemogData (complementa)
  const dashMergedPsico = (psicoKpis || psicoDemogData) ? {
    ...(psicoDemogData ?? {}),
    totalAlunos:                   psicoKpis?.atendidos             ?? psicoDemogData?.totalAlunos             ?? 0,
    alunosAtivos:                  psicoKpis?.atendidos             ?? psicoDemogData?.alunosAtivos            ?? 0,
    alunosInativos:                0,
    evasao:                        0,
    nps:                           0,
    porPrograma:                   psicoDemogData?.porPrograma      ?? [],
    porGenero:                     [],
    porFaixaEtaria:                [],
    porRacaCor:                    [],
    // atendimentos = RC individual + demandas espontâneas — sempre via psicoKpis (fonte única de verdade)
    horasAula:                     (psicoKpis?.atendimentos ?? 0) + (psicoKpis?.demandasEspontaneas ?? 0),
    atendimentos:                  (psicoKpis?.atendimentos ?? 0) + (psicoKpis?.demandasEspontaneas ?? 0),
    // breakdown por origem do atendido (PEC / Inclusão / Demanda Espontânea)
    // Usa a mesma fonte canônica do card de atendimentos para manter paridade com a tela de monitor.
    atendimentosPEC:               psicoKpis?.atendimentosPEC               ?? psicoDemogData?.atendimentosPEC               ?? 0,
    atendimentosInclusao:          psicoKpis?.atendimentosInclusao          ?? psicoDemogData?.atendimentosInclusao          ?? 0,
    atendimentosDemandaEspontanea: psicoKpis?.atendimentosDemandaEspontanea ?? psicoDemogData?.atendimentosDemandaEspontanea ?? 0,
    visitasDomiciliares:   psicoKpis?.visitas               ?? psicoDemogData?.visitasDomiciliares   ?? 0,
    visitasPEC:            psicoDemogData?.visitasPEC            ?? 0,
    visitasInclusao:       psicoDemogData?.visitasInclusao       ?? 0,
    visitasDemandaEspontanea: psicoDemogData?.visitasDemandaEspontanea ?? 0,
    atendimentosColetivos: psicoKpis?.atendimentosColetivos ?? psicoDemogData?.atendimentosColetivos ?? 0,
    intervencoes:          psicoKpis?.intervencoes          ?? 0,
    espacoOGrito:          psicoKpis?.espacoOGrito          ?? psicoDemogData?.espacoOGrito          ?? 0,
    workshop:              psicoKpis?.workshop              ?? 0,
    demandasEspontaneas:   psicoKpis?.demandasEspontaneas   ?? psicoDemogData?.demandasEspontaneas   ?? 0,
    psicoFamilias:         psicoKpis?.familias              ?? psicoDemogData?.psicoFamilias          ?? 0,
    psicoCasos:            psicoKpis?.casosAtivos           ?? psicoDemogData?.psicoCasos            ?? 0,
    frequenciaMedia:       psicoKpis?.resolutividade        ?? psicoDemogData?.frequenciaMedia        ?? 0,
    alunosFormados:        psicoKpis?.casosEncerrados       ?? psicoDemogData?.alunosFormados         ?? 0,
    visitasFavela3d:       psicoKpis?.visitasFavela3d       ?? psicoDemogData?.visitasFavela3d       ?? 0,
    atendimentosFavela3d:  psicoKpis?.atendimentosFavela3d  ?? psicoDemogData?.atendimentosFavela3d  ?? 0,
    mulheres_pessoas:      (gruposKpiCoord as any)?.mulheres_pessoas  ?? 0,
    mulheres_encontros:    (gruposKpiCoord as any)?.mulheres_encontros ?? 0,
  } : null;

  const { data: freqChamadasData = { chamadas: [] }, isLoading: loadingFreqChamadas } = useQuery({
    queryKey: ['/api/psico/chamadas', freqPrograma, freqTurmaId],
    queryFn: async () => {
      let url = `/api/psico/chamadas?programa=${freqPrograma}`;
      if (freqTurmaId) url += `&turmaId=${freqTurmaId}`;
      const res = await fetch(url, {});
      if (!res.ok) return { chamadas: [] };
      return res.json().catch(() => ({ chamadas: [] }));
    },
    enabled: !!userId && activeSection === 'frequencias',
  });
  const freqHistorico = freqChamadasData?.chamadas || [];

  const { data: freqTurmas = [] } = useQuery({
    queryKey: ['/api/psico/freq-turmas', freqPrograma, userId],
    queryFn: async () => {
      if (freqPrograma === 'pec') {
        const res = await fetch('/api/pec/instances', { credentials: 'include' });
        const json = await res.json().catch(() => []);
        if (!res.ok) return [];
        const arr = Array.isArray(json) ? json : [];
        return arr.map((t: any) => ({ id: t.id, nome: t.name || t.title || `Turma ${t.id}` }));
      } else {
        const res = await fetch('/api/turmas-inclusao', { credentials: 'include' });
        const json = await res.json().catch(() => []);
        if (!res.ok) return [];
        const arr = Array.isArray(json) ? json : [];
        return arr.map((t: any) => ({ id: t.id, nome: t.nome || t.title || `Turma ${t.id}` }));
      }
    },
    enabled: !!userId && activeSection === 'frequencias',
  });

  const { data: todosAtendidosParaAtendimento = [] } = useQuery({
    queryKey: ['/api/psico/todos-atendidos-para-atendimento'],
    queryFn: async () => {
      const res = await fetch('/api/psico/todos-atendidos-para-atendimento', {});
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!userId && (activeSection === 'atendimentos' || activeSection === 'confidencial' || activeSection === 'registros-gerais' || activeSection === 'mapeamento' || showAtendimentoModal),
  });

  const cadastroAtendidoMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('/api/psico/atendidos-comunidade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, coordenador_id: userId ? parseInt(userId) : null }),
      });
    },
    onSuccess: () => {
      toast({ title: "Atendido cadastrado com sucesso!" });
      setShowCadastroAtendido(false);
      setCadastroAtendidoForm({ nome: '', cpf: '', data_nascimento: '', sexo: '', raca: '', telefone: '', email: '', cep: '', endereco: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '', numero_pessoas: '', criancas: '', adolescentes: '', adultos: '', idosos: '', tem_cad_unico: '', tem_bolsa_familia: '', tem_bpc: '', demandas: '', observacoes: '' });
      queryClient.invalidateQueries({ queryKey: ['/api/psico/atendidos-comunidade'] });
      queryClient.invalidateQueries({ queryKey: ['/api/psico/todos-atendidos-para-atendimento'] });
    },
    onError: (error: any) => {
      toast({ title: "Erro ao cadastrar atendido", description: error.message, variant: "destructive" });
    }
  });

  const deleteAtendidoComunidadeMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/psico/atendidos-comunidade/${id}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      toast({ title: "Atendido removido com sucesso!" });
      queryClient.invalidateQueries({ queryKey: ['/api/psico/atendidos-comunidade'] });
      queryClient.invalidateQueries({ queryKey: ['/api/psico/todos-atendidos-para-atendimento'] });
    },
  });

  const { data: coordRegistrosConf = [], isLoading: loadingRegistrosConf } = useQuery({
    queryKey: ['/api/psico/coordenador/registros-confidenciais'],
    queryFn: async () => {
      const res = await fetch('/api/psico/coordenador/registros-confidenciais', { credentials: 'include' });
      const json = await res.json().catch(() => []);
      if (!res.ok) throw new Error(json?.error || "Falha ao buscar registros");
      return Array.isArray(json) ? json : [];
    },
    enabled: !!userId && activeSection === 'confidencial',
  });

  const createRegistroConfMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('/api/psico/coordenador/registros-confidenciais', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/psico/coordenador/registros-confidenciais'] });
      toast({ title: "Registro salvo!" });
      setConfSubTab("realizados");
      setPsicoRegistroForm({ titulo: "", tipo: "atendimento_individual", conteudo: "", participanteNome: "", participanteCpf: "", participanteOrigem: "", participanteDataNascimento: "", data: new Date().toISOString().split("T")[0] });
    },
    onError: (error: any) => toast({ title: "Erro ao salvar registro", description: error.message || "Tente novamente.", variant: "destructive" }),
  });

  const deleteRegistroConfMutation = useMutation({
    mutationFn: async (registroId: number) => {
      return apiRequest(`/api/psico/coordenador/registros-confidenciais/${registroId}`, { method: 'DELETE' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/psico/coordenador/registros-confidenciais'] });
      toast({ title: "Registro excluído!" });
    },
    onError: (error: any) => toast({ title: "Erro ao excluir registro", description: error.message || "Tente novamente.", variant: "destructive" }),
  });

  const updateRegistroConfMutation = useMutation({
    mutationFn: async ({ id, ...body }: { id: number; titulo: string; tipo: string; conteudo: string; participanteNome: string; data: string }) => {
      return apiRequest(`/api/psico/coordenador/registros-confidenciais/${id}`, {
        method: 'PUT',
        body: JSON.stringify(body),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/psico/coordenador/registros-confidenciais'] });
      toast({ title: "Registro atualizado!" });
      setEditRegistroId(null);
    },
    onError: (error: any) => toast({ title: "Erro ao atualizar registro", description: error.message || "Tente novamente.", variant: "destructive" }),
  });

  // Query e mutations para registros gerais (coordenador)
  const { data: coordRegistrosGerais = [], isLoading: loadingRegistrosGerais } = useQuery({
    queryKey: ['/api/psico/coordenador/registros-gerais'],
    queryFn: async () => {
      const res = await fetch('/api/psico/coordenador/registros-gerais', { credentials: 'include' });
      const json = await res.json().catch(() => []);
      if (!res.ok) throw new Error(json?.error || "Falha ao buscar registros gerais");
      return Array.isArray(json) ? json : [];
    },
    enabled: !!userId && activeSection === 'registros-gerais',
  });

  const { data: colaboradoresDataPsico } = useQuery<any>({
    queryKey: ["/api/colaboradores", "includeInactive"],
    queryFn: async () => {
      const res = await fetch(`/api/colaboradores?pageSize=200&includeInactive=1`, { credentials: "include" });
      return res.json();
    },
  });
  const colaboradoresCatalogoPsico: any[] = (colaboradoresDataPsico?.items || []).sort((a: any, b: any) => a.nome.localeCompare(b.nome));
  const todosColaboradoresPsico: any[] = colaboradoresCatalogoPsico.filter((c: any) => c.ativo !== false);
  const nomeColaboradorPsicoPorId = (id: number) => colaboradoresCatalogoPsico.find((c: any) => c.id === id)?.nome;

  // Query para acompanhamentos pedagógicos dos professores
  const { data: todosAcompanhamentos = [] } = useQuery({
    queryKey: ['/api/professor/acompanhamentos/all'],
    queryFn: async () => {
      const res = await fetch('/api/professor/acompanhamentos/all');
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!userId && activeSection === 'acompanhamentos',
  });

  // Query para registros de intervenções psicossociais
  const { data: todasIntervencoes = [], refetch: refetchIntervencoes } = useQuery({
    queryKey: ['/api/psico/intervencoes', intervencaoFiltroAno, intervencaoFiltroMes],
    queryFn: async () => {
      const params = new URLSearchParams({ ano: String(intervencaoFiltroAno) });
      if (intervencaoFiltroMes > 0) params.set('mes', String(intervencaoFiltroMes));
      const res = await fetch(`/api/psico/intervencoes?${params}`, { credentials: 'include' });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!userId && activeSection === 'intervencoes',
  });

  const { data: intervChamadasListaData = { chamadas: [] } } = useQuery({
    queryKey: ['/api/psico/chamadas-interv-lista', intervencaoFiltroAno],
    queryFn: async () => {
      const res = await fetch('/api/psico/chamadas', { credentials: 'include' });
      const json = await res.json().catch(() => ({ chamadas: [] }));
      if (!res.ok) return { chamadas: [] };
      return { chamadas: json.chamadas ?? [] };
    },
    enabled: !!userId && activeSection === 'intervencoes',
  });
  const intervChamadasLista = (() => {
    const todas = (intervChamadasListaData as { chamadas?: unknown[] }).chamadas ?? [];
    const ano = intervencaoFiltroAno;
    return todas.filter((c: any) => {
      const d = intervencaoDataIso(c.data);
      return d && parseInt(d.slice(0, 4), 10) === ano;
    });
  })();

  const { data: intervAtivTurmas = [] } = useQuery({
    queryKey: ['/api/psico/interv-turmas', intervencaoForm.vertente, userId],
    queryFn: async () => {
      if (intervencaoForm.vertente === "pec") {
        const res = await fetch('/api/pec/instances', { credentials: 'include' });
        const json = await res.json().catch(() => []);
        if (!res.ok) return [];
        const arr = Array.isArray(json) ? json : [];
        return arr.map((t: any) => ({ ...t, id: t.id, nome: t.name || t.title || t.nome || `Turma ${t.id}` }));
      }
      if (intervencaoForm.vertente === "inclusao") {
        const res = await fetch('/api/turmas-inclusao', { credentials: 'include' });
        const json = await res.json().catch(() => []);
        if (!res.ok) return [];
        const arr = Array.isArray(json) ? json : (json?.data ?? []);
        return arr.map((t: any) => ({ ...t, id: t.id, nome: t.nome || t.title || `Turma ${t.id}` }));
      }
      return [];
    },
    enabled: !!userId && activeSection === 'intervencoes' && intervencaoSubTab === 'registrar' && (intervencaoForm.vertente === 'pec' || intervencaoForm.vertente === 'inclusao'),
  });

  const { data: intervAtivChamadasData = { chamadas: [] } } = useQuery({
    queryKey: ['/api/psico/chamadas-interv', intervencaoForm.vertente, intervAtivTurmaId],
    queryFn: async () => {
      if (!intervAtivTurmaId) return { chamadas: [] };
      const url = `/api/psico/chamadas?programa=${intervencaoForm.vertente}&turmaId=${intervAtivTurmaId}`;
      const res = await fetch(url, { credentials: 'include' });
      const json = await res.json().catch(() => ({ chamadas: [] }));
      if (!res.ok) return { chamadas: [] };
      return json;
    },
    enabled: !!userId && activeSection === 'intervencoes' && intervencaoSubTab === 'registrar' && !!intervAtivTurmaId && (intervencaoForm.vertente === 'pec' || intervencaoForm.vertente === 'inclusao'),
  });

  const intervAtivDiasAulaReal: { date: string; label: string; dayOfWeek: string }[] = (() => {
    if (!intervAtivTurmaId) return [];
    const turmaSel = (intervAtivTurmas as any[]).find((t: any) => String(t.id) === String(intervAtivTurmaId));
    if (!turmaSel) return [];
    const hoje = getBrazilDateString();
    return getDiasAulaParaTurma(turmaSel).filter(d => d.date <= hoje).sort((a, b) => a.date.localeCompare(b.date));
  })();

  const intervAtivDatasComChamada = new Set<string>(
    (((intervAtivChamadasData as any)?.chamadas) || [])
      .filter((c: any) => String(c.turmaId) === String(intervAtivTurmaId))
      .map((c: any) => (c.data || '').split('T')[0])
  );

  useEffect(() => {
    if (!intervAtivTurmaId) return;
    if (intervAtivDiasAulaReal.length === 0) return;
    const turmaChanged = intervAtivPrevTurmaRef.current !== intervAtivTurmaId;
    if (!turmaChanged) return;
    const diasComChamada = intervAtivDiasAulaReal.filter(d => intervAtivDatasComChamada.has(d.date));
    const melhorData = diasComChamada[diasComChamada.length - 1] || intervAtivDiasAulaReal[intervAtivDiasAulaReal.length - 1];
    const dataAlvo = melhorData?.date || '';
    if (dataAlvo) {
      intervAtivPrevTurmaRef.current = intervAtivTurmaId;
      setIntervencaoForm((f) => ({ ...f, data: dataAlvo }));
    }
  }, [intervAtivTurmaId, intervAtivDiasAulaReal.length, intervAtivDatasComChamada.size]);

  useEffect(() => {
    if (!(intervencaoForm.vertente === "pec" || intervencaoForm.vertente === "inclusao")) {
      setIntervAtivTurmaId("");
      setIntervAtivParticipantes([]);
      setIntervAtivChamada({ loaded: false, exists: false, presencas: [] });
      return;
    }
    setIntervAtivTurmaId("");
    setIntervAtivParticipantes([]);
    setIntervAtivChamada({ loaded: false, exists: false, presencas: [] });
    setIntervencaoForm((f) => ({ ...f, data: new Date().toISOString().split("T")[0] }));
  }, [intervencaoForm.vertente]);

  useEffect(() => {
    setIntervAtivChamada({ loaded: false, exists: false, presencas: [] });
    if (!intervAtivTurmaId || !intervencaoForm.data) return;
    const chamadas: any[] = ((intervAtivChamadasData as any)?.chamadas || []);
    const chamadaDoDia = chamadas.find((c: any) =>
      String(c.turmaId) === String(intervAtivTurmaId) &&
      (c.data || '').split('T')[0] === intervencaoForm.data
    );
    if (chamadaDoDia && chamadaDoDia.presencas) {
      const presencasList = Array.isArray(chamadaDoDia.presencas) ? chamadaDoDia.presencas : [];
      const presencasNormalizadas = presencasList.map((p: any) => ({
        alunoCpf: p.alunoCpf || "",
        nome: (p.nome || "Sem nome").replace(/^\s+|\s+$/g, ''),
        presente: p.presente !== false,
        justificativa: p.justificativa || '',
      }));
      setIntervAtivChamada({
        loaded: true,
        exists: true,
        presencas: presencasNormalizadas,
      });
      setIntervAtivParticipantes(participantesFromChamadaPresencas(presencasNormalizadas));
    } else {
      setIntervAtivParticipantes([]);
      setIntervAtivChamada({ loaded: true, exists: false, presencas: [] });
    }
  }, [intervAtivTurmaId, intervencaoForm.data, (intervAtivChamadasData as any)?.chamadas?.length]);

  const carregarParticipantesIntervTurma = async (turmaId: string) => {
    if (!turmaId || !(intervencaoForm.vertente === "pec" || intervencaoForm.vertente === "inclusao")) {
      setIntervAtivParticipantes([]);
      return;
    }
    try {
      const url = intervencaoForm.vertente === "inclusao"
        ? `/api/monitor/${userId}/alunos?programType=inclusao&turmaId=${turmaId}`
        : `/api/monitor/${userId}/alunos?programType=pec&grupoId=${turmaId}`;
      const res = await fetch(url, { credentials: "include" });
      const json = await res.json().catch(() => []);
      const lista = Array.isArray(json) ? json : (json?.participantes || json?.data || []);
      setIntervAtivParticipantes(
        lista.map((a: any) => ({
          id: String(a.cpf || a.id || a.participante_id || ""),
          nome: (a.nome || a.nome_completo || a.nomeCompleto || "Sem nome").replace(/^\s+|\s+$/g, ''),
          selecionado: true,
        })).filter((p: any) => p.id && p.id !== "undefined")
      );
    } catch {
      setIntervAtivParticipantes([]);
    }
  };

  const resetIntervencaoForm = () => {
    setEditIntervencaoId(null);
    setIntervencaoForm({
      titulo: '', tipo: 'outro', vertente: 'psicossocial',
      data: new Date().toISOString().split('T')[0],
      horario_inicio: '', horario_fim: '', participantes_presentes: 0,
      descricao: '', observacoes: '',
    });
    setIntervAtivTurmaId("");
    setIntervAtivParticipantes([]);
    setIntervAtivChamada({ loaded: false, exists: false, presencas: [] });
  };

  const startEditIntervencao = async (iv: any) => {
    const obs = iv.observacoes || iv.observacao || "";
    const { participantesNomes, observacoesLimpa } = parseIntervencaoObservacoes(obs);
    const grupoId = iv.grupo != null && iv.grupo !== "" ? String(iv.grupo) : "";
    const vertente = iv.vertente || "psicossocial";
    setEditIntervencaoId(Number(iv.id));
    setIntervencaoForm({
      titulo: iv.titulo || "",
      tipo: iv.tipo || "outro",
      vertente,
      data: intervencaoDataIso(iv.data) || new Date().toISOString().split("T")[0],
      horario_inicio: iv.horarioInicio || iv.horario_inicio || "",
      horario_fim: iv.horarioFim || iv.horario_fim || "",
      participantes_presentes: iv.participantes_presentes ?? iv.participantesPresentes ?? 0,
      descricao: iv.descricao || "",
      observacoes: observacoesLimpa,
    });
    setIntervAtivTurmaId(grupoId);
    setIntervAtivChamada({ loaded: false, exists: false, presencas: [] });
    setIntervencaoSubTab("registrar");
    setIntervencaoExpandida(null);
    if (grupoId && (vertente === "pec" || vertente === "inclusao")) {
      await carregarParticipantesIntervTurma(grupoId);
      if (participantesNomes.length > 0) {
        const nomesLower = new Set(participantesNomes.map((n) => n.toLowerCase()));
        setIntervAtivParticipantes((prev) =>
          prev.map((p) => ({ ...p, selecionado: nomesLower.has(p.nome.toLowerCase()) }))
        );
      }
    } else {
      setIntervAtivParticipantes([]);
    }
  };

  const buildIntervencaoPayload = () => {
    const participantesSelecionados = intervAtivParticipantes.filter((p) => p.selecionado);
    const turmaObj = (intervAtivTurmas as any[]).find((t: any) => String(t.id) === String(intervAtivTurmaId));
    const turmaNomeStr = turmaObj?.nome || (intervAtivTurmaId ? `Turma ${intervAtivTurmaId}` : undefined);
    const totalEsperados =
      intervAtivChamada.exists && intervAtivChamada.presencas.length > 0
        ? intervAtivChamada.presencas.length
        : intervAtivParticipantes.length;
    return {
      ...intervencaoForm,
      observacoes: buildIntervencaoObservacoes(
        intervencaoForm.observacoes || "",
        turmaNomeStr,
        participantesSelecionados.map((p) => p.nome),
        totalEsperados
      ),
      participantes_presentes: participantesSelecionados.length || intervencaoForm.participantes_presentes || 0,
      participantes_esperados: totalEsperados,
      grupo: intervAtivTurmaId || undefined,
    };
  };

  const createIntervencaoMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('/api/psico/intervencoes', { method: 'POST', body: JSON.stringify(data) });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/psico/intervencoes'] });
      toast({ title: 'Intervenção registrada!' });
      setShowNovaIntervencao(false);
      resetIntervencaoForm();
      setIntervencaoSubTab("lista");
    },
    onError: (error: any) => toast({ title: 'Erro ao registrar intervenção', description: error.message || 'Tente novamente.', variant: 'destructive' }),
  });

  const updateIntervencaoMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: number; [key: string]: unknown }) => {
      return apiRequest(`/api/psico/intervencoes/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/psico/intervencoes'] });
      toast({ title: 'Intervenção atualizada!' });
      resetIntervencaoForm();
      setIntervencaoSubTab("lista");
    },
    onError: (error: any) => toast({ title: 'Erro ao atualizar intervenção', description: error.message || 'Tente novamente.', variant: 'destructive' }),
  });

  const createGeraisMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('/api/psico/coordenador/registros-gerais', { method: 'POST', body: JSON.stringify(data) });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/psico/coordenador/registros-gerais'] });
      toast({ title: "Registro salvo!" });
      setGeraisSubTab("realizados");
      setGeraisForm({ tipoGeral: "atendimento_coletivo", categoria: "espaco_o_grito", conteudo: "", participanteNome: "", participanteCpf: "", data: new Date().toISOString().split("T")[0] });
      setGeraisColaboradoresIds([]);
      setGeraisColabBusca("");
      setGeraisParticipantes([]);
      setGeraisPartBusca("");
    },
    onError: (error: any) => toast({ title: "Erro ao salvar registro", description: error.message || "Tente novamente.", variant: "destructive" }),
  });

  const deleteGeraisMutation = useMutation({
    mutationFn: async (registroId: number) => {
      return apiRequest(`/api/psico/coordenador/registros-gerais/${registroId}`, { method: 'DELETE' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/psico/coordenador/registros-gerais'] });
      toast({ title: "Registro excluído!" });
    },
    onError: (error: any) => toast({ title: "Erro ao excluir registro", description: error.message || "Tente novamente.", variant: "destructive" }),
  });

  const updateGeraisMutation = useMutation({
    mutationFn: async ({ id, ...body }: { id: number; tipo: string; conteudo: string; participanteNome: string; data: string; colaboradoresIds?: number[] | null }) => {
      return apiRequest(`/api/psico/coordenador/registros-gerais/${id}`, { method: 'PUT', body: JSON.stringify(body) });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/psico/coordenador/registros-gerais'] });
      toast({ title: "Registro atualizado!" });
      setEditGeraisId(null);
      setEditGeraisColaboradoresIds([]);
      setEditGeraisColabBusca("");
    },
    onError: (error: any) => toast({ title: "Erro ao atualizar registro", description: error.message || "Tente novamente.", variant: "destructive" }),
  });

  // Handlers para salvar dados
  const handleSaveFamilia = () => {
    if (!familiaForm.nomeResponsavel.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha o nome do responsável da família.",
        variant: "destructive"
      });
      return;
    }
    createFamiliaMutation.mutate(familiaForm);
  };

  const handleUpdateFamilia = () => {
    if (!familiaForm.nomeResponsavel.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha o nome do responsável da família.",
        variant: "destructive"
      });
      return;
    }
    if (selectedFamilia?.id) {
      updateFamiliaMutation.mutate({ id: selectedFamilia.id, data: familiaForm });
    }
  };

  const handleSaveCaso = () => {
    if (!casoForm.titulo.trim() || !casoForm.tipo.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha título e tipo do caso.",
        variant: "destructive"
      });
      return;
    }
    createCasoMutation.mutate(casoForm);
  };

  const handleSaveAtendimento = () => {
    if (!atendimentoForm.dataAtendimento) {
      toast({
        title: "Campos obrigatórios",
        description: "Selecione a data do atendimento.",
        variant: "destructive"
      });
      return;
    }

    if (!atendimentoForm.vinculoId && !atendimentoForm.familiaId) {
      toast({
        title: "Campos obrigatórios",
        description: "Selecione o atendido ou a família.",
        variant: "destructive"
      });
      return;
    }

    // Preparar dados para envio
    const dataToSend: any = {
      tipo: atendimentoForm.tipo,
      dataAtendimento: atendimentoForm.dataAtendimento,
      duracaoMinutos: atendimentoForm.duracaoMinutos,
      profissionalResponsavel: atendimentoForm.profissionalResponsavel,
      resumo: atendimentoForm.resumo,
      observacoes: atendimentoForm.observacoes,
      familiaId: atendimentoForm.familiaId,
      casoId: atendimentoForm.casoId,
    };

    // Adicionar campos de vínculo se houver atendido selecionado
    if (atendimentoForm.vinculoId && atendimentoForm.programaOrigem) {
      if (atendimentoForm.programaOrigem === 'inclusao') {
        dataToSend.psicoInclusaoVinculoId = atendimentoForm.vinculoId;
      } else if (atendimentoForm.programaOrigem === 'pec') {
        dataToSend.psicoPecVinculoId = atendimentoForm.vinculoId;
      }
    }

    createAtendimentoMutation.mutate(dataToSend);
  };

  const handleSavePlano = () => {
    if (!planoForm.estrategias?.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Descreva as estratégias do plano.",
        variant: "destructive"
      });
      return;
    }
    createPlanoMutation.mutate(planoForm);
  };

  const handleLogout = () => {
    clearLocalStoragePreservingLgpd();
    sessionStorage.clear();
    window.location.href = "/login/coordenador";
  };

  const handleExportReport = () => {
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    const url = `/export/google-slides?mes=${currentMonth}`;
    window.location.href = url;
    toast({
      title: "Exportando relatório",
      description: "O download será iniciado em breve..."
    });
  };

  const handleImportFile = async () => {
    if (!importFile) {
      toast({
        title: "Arquivo não selecionado",
        description: "Por favor, selecione um arquivo Excel (.xlsx, .xls) ou PDF (.pdf) para importar.",
        variant: "destructive"
      });
      return;
    }

    setIsImporting(true);
    
    try {
      const formData = new FormData();
      formData.append('file', importFile);
      
      const response = await fetch('/api/psico/import', {
        method: 'POST',
        headers: {
        },
        body: formData
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast({
          title: "Importação concluída!",
          description: `${result.imported} registros importados com sucesso.`
        });
        setShowImportModal(false);
        setImportFile(null);
        queryClient.invalidateQueries({ queryKey: ['/api/psico/familias'] });
        queryClient.invalidateQueries({ queryKey: ['/api/psico/atendimentos'] });
      } else {
        throw new Error(result.error || 'Erro na importação');
      }
    } catch (error: any) {
      console.error('Erro ao importar:', error);
      toast({
        title: "Erro na importação",
        description: error.message || "Não foi possível importar o arquivo.",
        variant: "destructive"
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleExportCSV = (data: any[], filename: string) => {
    if (!data || data.length === 0) {
      toast({
        title: "Sem dados para exportar",
        description: "Não há dados disponíveis para exportação.",
        variant: "destructive"
      });
      return;
    }

    // Converter dados para CSV
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => {
        const value = row[header];
        // Escapar vírgulas e aspas
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(','))
    ].join('\n');

    // Criar e baixar arquivo
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Exportação concluída!",
      description: `Arquivo ${filename} baixado com sucesso.`
    });
  };

  if (consentChecking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500" />
      </div>
    );
  }
  if (!consentReady) {
    return (
      <AreaConsentGate area="employees" onAccept={() => setConsentReady()} onNavigate={setLocation} />
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-slate-400">Carregando coordenação psicossocial...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900" data-testid="coordenador-psico-page">
      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-700 px-4 py-4 md:px-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
              <Heart className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-white" data-testid="text-welcome">
                Coordenação Psicossocial
              </h1>
              <p className="text-slate-400" data-testid="text-username">
                Olá {userData?.nome || 'Coordenador'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
<Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowImportModal(true)}
              data-testid="button-import"
              className="border-purple-500 text-purple-500 hover:bg-purple-50"
            >
              <Upload className="w-4 h-4 mr-2" />
              Importar
            </Button>
            <Button 
              variant="default" 
              size="sm" 
              onClick={handleExportReport}
              data-testid="button-export"
              className="bg-purple-500 hover:bg-purple-600"
            >
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => window.open('https://canaldetransparencia.institutoogrito.com.br', '_blank')}
              data-testid="button-transparencia"
              className="bg-yellow-400 text-black hover:bg-yellow-500 border-yellow-400"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Canal de Transparência
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-blue-500 text-white hover:bg-blue-600 border-blue-500"
                  data-testid="button-plano-acao"
                >
                  <ClipboardList className="w-4 h-4 mr-2" />
                  Plano de Ação
                  <ChevronDown className="w-4 h-4 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                  onClick={() => window.open("https://monday.com/lang/pt", "_blank")}
                  className="cursor-pointer"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Monday
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => window.open("https://slack.com/intl/pt-br/", "_blank")}
                  className="cursor-pointer"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Slack
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <LgpdLegalHeaderButtons tone="dark" />
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleLogout}
              data-testid="button-logout"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6 md:px-6 md:py-8">
        {/* Toggle Psico / Favela 3D + Filtros */}
        <div className="flex items-center gap-2 flex-wrap mb-4">
          <div className="flex rounded-lg overflow-hidden border border-slate-600">
            <button
              onClick={() => setCoordDashView("psico")}
              className={`px-3 py-1.5 text-xs font-semibold transition-colors ${coordDashView === "psico" ? "bg-purple-600 text-white" : "bg-slate-800 text-slate-400 hover:bg-slate-700"}`}
            >Psico Social</button>
            {canDelete && <button
              onClick={() => setCoordDashView("favela")}
              className={`px-3 py-1.5 text-xs font-semibold transition-colors ${coordDashView === "favela" ? "bg-orange-500 text-white" : "bg-slate-800 text-slate-400 hover:bg-slate-700"}`}
            >Favela 3D</button>}
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <DashboardPeriodoFiltro
              ano={dashFiltroAno}
              periodo={dashFiltroPeriodo}
              onChange={(ano, periodo) => { setDashFiltroAno(ano); setDashFiltroPeriodo(periodo); }}
              minAno={2025}
              variant="dark"
            />
          </div>
        </div>

        {coordDashView === "psico" && (
        <CoordenadorDashboard
          data={dashMergedPsico}
          isLoading={isPsicoDemogLoading && !psicoKpis}
          tipo="psico"
          filtroAno={dashFiltroAno}
          filtroPeriodo={dashFiltroPeriodo}
          ocultarFiltroPeriodo
          onFilterChange={(ano, periodo) => { setDashFiltroAno(ano); setDashFiltroPeriodo(periodo); }}
          titleOverride="Psicossocial"
          casasMapeadas={(mapeamentosStats as any)?.total ?? 0}
          moradasGeraisStats={{ total: moradasReformasList.length, porStatus: moradasDashboardPorStatus }}
        />
        )}

        {coordDashView === "favela" && (
        <div className="rounded-2xl border border-slate-700 bg-slate-900 shadow-xl p-3 sm:p-5 mb-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-1.5 h-10 rounded-full bg-gradient-to-b from-orange-500 to-amber-400" />
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white">Visão Geral</h2>
              <p className="text-sm text-slate-400 font-medium">Favela 3D</p>
            </div>
          </div>
          <div className="space-y-3">
            {/* Linha 1 — KPIs estáticos */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
              <DarkMetricCard icon={Home}     label="Famílias Cadastradas" value={(favela3dStatsCoord as any)?.familias ?? 0}  accentColor="#f97316" />
              <DarkMetricCard icon={Home}     label="Visitas"               value={(favela3dStatsCoord as any)?.visitas ?? 0}   accentColor="#06b6d4" />
              <DarkMetricCard icon={Activity} label="Atendimentos"          value={(favela3dStatsCoord as any)?.atendimentos_individuais ?? 0} accentColor="#8b5cf6" />
            </div>
            {/* Linha 2 — Cards clicáveis por categoria */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
              {[
                { key: "gerando_lideranca", label: "Gerando Liderança", count: (favela3dStatsCoord as any)?.gerando_lideranca ?? 0, color: "#fbbf24" },
                { key: "assembleia",        label: "Assembleia",        count: (favela3dStatsCoord as any)?.assembleia         ?? 0, color: "#fb923c" },
                { key: "grupo_mulheres",    label: "Grupo de Mulheres", count: (favela3dStatsCoord as any)?.grupo_mulheres     ?? 0, color: "#f472b6" },
              ].map(cat => (
                <button
                  key={cat.key}
                  onClick={() => setCategoriaModalCoord(cat.key)}
                  className="relative rounded-xl border border-slate-700 border-l-4 bg-gradient-to-br from-slate-800 to-slate-900 shadow-lg p-3 sm:p-4 text-left transition-all duration-200 hover:shadow-xl hover:scale-[1.01] cursor-pointer"
                  style={{borderLeftColor: cat.color}}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{backgroundColor: `${cat.color}22`, border: `1px solid ${cat.color}44`}}>
                      <Users className="w-4 h-4" style={{color: cat.color}} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] sm:text-[11px] text-slate-400 font-medium uppercase leading-tight tracking-wide">{cat.label}</p>
                    </div>
                    <span className="text-[10px] text-slate-500 whitespace-nowrap">Ver →</span>
                  </div>
                  <p className="text-2xl sm:text-3xl font-bold text-white tracking-tight">{cat.count}</p>
                  <p className="text-[10px] text-slate-500 mt-1">registros</p>
                </button>
              ))}
            </div>
          </div>
        </div>
        )}

        {/* Modal de detalhes demográficos da categoria — coordenador psico */}
        <Dialog open={!!categoriaModalCoord} onOpenChange={open => !open && setCategoriaModalCoord(null)}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {categoriaModalCoord === "gerando_lideranca" && "Gerando Liderança"}
                {categoriaModalCoord === "assembleia" && "Assembleia"}
                {categoriaModalCoord === "grupo_mulheres" && "Grupo de Mulheres"}
                {" — Detalhes"}
              </DialogTitle>
              <DialogDescription>Registros coletivos e dados demográficos dos participantes</DialogDescription>
            </DialogHeader>
            {loadingCatDetalhesCoord ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
              </div>
            ) : catDetalhesCoord ? (
              <div className="space-y-5">
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-orange-700">{catDetalhesCoord.totalRegistros}</div>
                    <div className="text-xs text-orange-500">Registros</div>
                  </div>
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-purple-700">{catDetalhesCoord.totalPessoas}</div>
                    <div className="text-xs text-purple-500">Pessoas (total)</div>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-blue-700">{catDetalhesCoord.idadeMedia ?? "—"}</div>
                    <div className="text-xs text-blue-500">Idade média</div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-xs font-bold text-gray-500 uppercase mb-2">Gênero</div>
                    {Object.entries(catDetalhesCoord.porGenero || {}).length === 0 ? (
                      <div className="text-xs text-gray-400">Sem dados</div>
                    ) : Object.entries(catDetalhesCoord.porGenero || {}).map(([g, n]) => (
                      <div key={g} className="flex justify-between text-sm py-0.5">
                        <span className="text-gray-600 capitalize">{g}</span>
                        <span className="font-semibold text-gray-800">{n as number}</span>
                      </div>
                    ))}
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-xs font-bold text-gray-500 uppercase mb-2">Índice GF</div>
                    {Object.entries(catDetalhesCoord.porIgf || {}).length === 0 ? (
                      <div className="text-xs text-gray-400">Sem dados</div>
                    ) : Object.entries(catDetalhesCoord.porIgf || {}).map(([igf, n]) => (
                      <div key={igf} className="flex justify-between text-sm py-0.5">
                        <span className="font-mono text-gray-600">{igf}</span>
                        <span className="font-semibold text-gray-800">{n as number}</span>
                      </div>
                    ))}
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-xs font-bold text-gray-500 uppercase mb-2">Raça/Cor</div>
                    {Object.entries(catDetalhesCoord.porRaca || {}).length === 0 ? (
                      <div className="text-xs text-gray-400">Sem dados</div>
                    ) : Object.entries(catDetalhesCoord.porRaca || {}).map(([r, n]) => (
                      <div key={r} className="flex justify-between text-sm py-0.5">
                        <span className="text-gray-600 capitalize">{r}</span>
                        <span className="font-semibold text-gray-800">{n as number}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-bold text-gray-700 mb-2">Registros ({catDetalhesCoord.totalRegistros})</div>
                  <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                    {(catDetalhesCoord.registros || []).map((reg: any) => (
                      <div key={reg.id} className="border border-gray-200 rounded-lg p-3 bg-white">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-semibold text-gray-800">{reg.titulo || "Sem título"}</span>
                          <span className="text-xs text-gray-400">{reg.data ? new Date(reg.data + 'T12:00:00').toLocaleDateString('pt-BR') : ''}</span>
                        </div>
                        <div className="text-xs text-gray-600 mb-2 line-clamp-2">{reg.conteudo}</div>
                        {(reg.participantes || []).length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {(reg.participantes || []).map((p: any) => (
                              <span key={p.id} className="bg-purple-100 text-purple-700 text-xs px-2 py-0.5 rounded-full">{p.nome}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                    {(catDetalhesCoord.registros || []).length === 0 && (
                      <div className="text-sm text-gray-400 text-center py-4">Nenhum registro nesta categoria ainda</div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-500 text-center py-8">Erro ao carregar dados</div>
            )}
          </DialogContent>
        </Dialog>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">

          {/* Gestão de Famílias */}
          <Card data-testid="card-familias">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="w-5 h-5 text-blue-500" />
                Gestão de Famílias
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-gray-600 text-sm">
                Gerencie famílias atendidas, acompanhe casos e coordene intervenções.
              </p>
              <div className="space-y-2">
                <Button 
                  
                  variant="outline" className={activeSection === 'familias' ? "bg-yellow-400 text-black border-yellow-400 hover:bg-yellow-500 w-full" : "w-full"}
                  data-testid="button-familias"
                  onClick={() => changeSection('familias')}
                >
                  <Users className="w-4 h-4 mr-2" />
                  Famílias
                </Button>
                <Button 
                  
                  variant="outline" className={activeSection === 'casos' ? "bg-yellow-400 text-black border-yellow-400 hover:bg-yellow-500 w-full" : "w-full"}
                  data-testid="button-casos"
                  onClick={() => changeSection('casos')}
                >
                  <UserCheck className="w-4 h-4 mr-2" />
                  Casos Ativos
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Atendidos */}
          <Card data-testid="card-participantes">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <UserCheck className="w-5 h-5 text-indigo-500" />
                Atendidos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-gray-600 text-sm">
                Pessoas com registros psicossociais cadastrados.
              </p>
              <div className="space-y-2">
                <Button 
                  
                  variant="outline" className={activeSection === 'participantes' ? "bg-yellow-400 text-black border-yellow-400 hover:bg-yellow-500 w-full" : "w-full"}
                  data-testid="button-participantes"
                  onClick={() => changeSection('participantes')}
                >
                  <UserCheck className="w-4 h-4 mr-2" />
                  Ver Atendidos
                </Button>
                <Button
                  
                  variant="outline" className={activeSection === 'demanda' ? "bg-yellow-400 text-black border-yellow-400 hover:bg-yellow-500 w-full" : "w-full"}
                  onClick={() => changeSection('demanda')}
                >
                  <HeartHandshake className="w-4 h-4 mr-2" />
                  Atendidos Comunidade
                </Button>
                <Button
                  
                  variant="outline" className={activeSection === 'alunos' ? "bg-yellow-400 text-black border-yellow-400 hover:bg-yellow-500 w-full" : "w-full"}
                  onClick={() => changeSection('alunos')}
                >
                  <Users className="w-4 h-4 mr-2" />
                  Ver Alunos
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Frequências e Acompanhamentos */}
          <Card data-testid="card-frequencias">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calendar className="w-5 h-5 text-blue-500" />
                Frequências e Turmas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-gray-600 text-sm">
                Acompanhe as frequências das turmas de Inclusão Produtiva e PEC, e os acompanhamentos pedagógicos.
              </p>
              <div className="space-y-2">
                <Button 
                  
                  variant="outline" className={activeSection === 'frequencias' ? "bg-yellow-400 text-black border-yellow-400 hover:bg-yellow-500 w-full" : "w-full"}
                  onClick={() => changeSection('frequencias')}
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Ver Frequências
                </Button>
                <Button 
                  
                  variant="outline" className={activeSection === 'acompanhamentos' ? "bg-yellow-400 text-black border-yellow-400 hover:bg-yellow-500 w-full" : "w-full"}
                  data-testid="button-acompanhamentos-freq"
                  onClick={() => changeSection('acompanhamentos')}
                >
                  <BookOpen className="w-4 h-4 mr-2" />
                  Acompanhamentos
                </Button>
                <Button 
                  
                  variant="outline" className={activeSection === 'intervencoes' ? "bg-yellow-400 text-black border-yellow-400 hover:bg-yellow-500 w-full" : "w-full"}
                  onClick={() => changeSection('intervencoes')}
                >
                  <Activity className="w-4 h-4 mr-2" />
                  Registros de Intervenções
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Registros Psicossociais */}
          <Card data-testid="card-servicos">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <HeartHandshake className="w-5 h-5 text-green-500" />
                Registros Psicossociais
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-gray-600 text-sm">
                Gerencie registros confidenciais, gerais e documentação psicossocial.
              </p>
              <div className="space-y-2">
                <Button 
                  
                  variant="outline" className={activeSection === 'confidencial' ? "bg-yellow-400 text-black border-yellow-400 hover:bg-yellow-500 w-full" : "w-full"}
                  data-testid="button-confidencial"
                  onClick={() => changeSection('confidencial')}
                >
                  <Lock className="w-4 h-4 mr-2" />
                  Registros Confidenciais
                </Button>
                <Button 
                  
                  variant="outline" className={activeSection === 'registros-gerais' ? "bg-yellow-400 text-black border-yellow-400 hover:bg-yellow-500 w-full" : "w-full"}
                  data-testid="button-registros-gerais"
                  onClick={() => changeSection('registros-gerais')}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Registros Gerais
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Proteção Social */}
          <Card data-testid="card-protecao">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Shield className="w-5 h-5 text-red-500" />
                Proteção Social
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-gray-600 text-sm">
                Gerencie situações de risco, violações de direitos e medidas protetivas.
              </p>
              <div className="space-y-2">
                <Button 
                  
                  variant="outline" className={activeSection === 'violacoes' ? "bg-yellow-400 text-black border-yellow-400 hover:bg-yellow-500 w-full" : "w-full"}
                  data-testid="button-violacoes"
                  onClick={() => changeSection('violacoes')}
                >
                  <Shield className="w-4 h-4 mr-2" />
                  Violações de Direitos
                </Button>
                <Button 
                  
                  variant="outline" className={activeSection === 'medidas' ? "bg-yellow-400 text-black border-yellow-400 hover:bg-yellow-500 w-full" : "w-full"}
                  data-testid="button-medidas"
                  onClick={() => changeSection('medidas')}
                >
                  <Target className="w-4 h-4 mr-2" />
                  Medidas Protetivas
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Rede de Serviços */}
          <Card data-testid="card-rede">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calendar className="w-5 h-5 text-orange-500" />
                Rede de Serviços
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-gray-600 text-sm">
                Articule com rede de serviços e organize encaminhamentos.
              </p>
              <div className="space-y-2">
                <Button 
                  
                  variant="outline" className={activeSection === 'rede' ? "bg-yellow-400 text-black border-yellow-400 hover:bg-yellow-500 w-full" : "w-full"}
                  data-testid="button-rede"
                  onClick={() => changeSection('rede')}
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Rede de Serviços
                </Button>
                <Button 
                  
                  variant="outline" className={activeSection === 'encaminhamentos' ? "bg-yellow-400 text-black border-yellow-400 hover:bg-yellow-500 w-full" : "w-full"}
                  data-testid="button-encaminhamentos"
                  onClick={() => changeSection('encaminhamentos')}
                >
                  <BookOpen className="w-4 h-4 mr-2" />
                  Encaminhamentos
                </Button>
                <Button 
                  
                  variant="outline" className={activeSection === 'grupos' ? "bg-yellow-400 text-black border-yellow-400 hover:bg-yellow-500 w-full" : "w-full"}
                  data-testid="button-grupos"
                  onClick={() => changeSection('grupos')}
                >
                  <Activity className="w-4 h-4 mr-2" />
                  Grupos Terapêuticos
                </Button>
              </div>
            </CardContent>
          </Card>


          {/* Relatórios Gerenciais */}
          <Card data-testid="card-relatorios">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="w-5 h-5 text-indigo-500" />
                Relatórios Gerenciais
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-gray-600 text-sm">
                Gere relatórios técnicos, estatísticas e análises de impacto social.
              </p>
              <div className="space-y-2">
                <Button 
                  
                  variant="outline" className={activeSection === 'relatorios' ? "bg-yellow-400 text-black border-yellow-400 hover:bg-yellow-500 w-full" : "w-full"}
                  data-testid="button-relatorios"
                  onClick={() => changeSection('relatorios')}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Relatórios
                </Button>
                <Button 
                  
                  variant="outline" className={activeSection === 'configuracoes' ? "bg-yellow-400 text-black border-yellow-400 hover:bg-yellow-500 w-full" : "w-full"}
                  data-testid="button-perfil"
                  onClick={() => changeSection('configuracoes')}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Meu Perfil
                </Button>
                <Button variant="outline" className="w-full" onClick={() => openPrivacyPreferences()}>
                  <Shield className="w-4 h-4 mr-2" />
                  Privacidade e cookies
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Eventos */}
          <Card data-testid="card-eventos-grito">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calendar className="w-5 h-5 text-red-500" />
                Eventos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-gray-600 text-sm">
                Crie e gerencie eventos do Instituto O Grito.
              </p>
              <div className="space-y-2">
                <Button
                  
                  variant="outline" className={activeSection === 'eventos-grito' ? "bg-yellow-400 text-black border-yellow-400 hover:bg-yellow-500 w-full" : "w-full"}
                  onClick={() => changeSection('eventos-grito')}
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Eventos
                </Button>

              </div>
            </CardContent>
          </Card>

          {/* Favela 3D */}
          {canDelete && <Card className={"border-2 transition-all " + (activeSection === "favela3d" ? "border-purple-500 bg-purple-50" : "border-gray-200")}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Home className="w-5 h-5 text-purple-500" />
                Favela 3D
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-gray-600 text-sm">Mapeamento e acompanhamento de famílias do projeto Favela 3D.</p>
              <div className="space-y-2">
                <Button
                  
                  variant="outline" className={activeSection === "favela3d" && favela3dSubTab === "atendidos" ? "bg-yellow-400 text-black border-yellow-400 hover:bg-yellow-500 w-full" : "w-full"}
                  onClick={() => { setFavela3dSubTab("atendidos"); changeSection("favela3d"); }}
                >
                  <Home className="w-4 h-4 mr-2" />
                  Atendidos Favela 3D
                </Button>
                <Button
                  
                  variant="outline" className={activeSection === "favela3d" && favela3dSubTab === "registros" ? "bg-yellow-400 text-black border-yellow-400 hover:bg-yellow-500 w-full" : "w-full"}
                  onClick={() => { setFavela3dSubTab("registros"); changeSection("favela3d"); }}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Registros Favela 3D
                </Button>
              </div>
            </CardContent>
          </Card>}

          {/* Mapeamento e moradas gerais */}
          {canDelete && <Card className={"border-2 transition-all " + (activeSection === "mapeamento" ? "border-teal-500 bg-teal-50" : "border-gray-200")}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Layers className="w-5 h-5 text-teal-500" />
                Mapeamento e moradas gerais
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-gray-600 text-sm">Controle de casas mapeadas no território.</p>
              <div className="space-y-2">
                <Button
                  
                  variant="outline" className={activeSection === "mapeamento" && mapeamentoSubTab === "mapeamento" ? "bg-yellow-400 text-black border-yellow-400 hover:bg-yellow-500 w-full" : "w-full"}
                  onClick={() => { setMapeamentoSubTab("mapeamento"); changeSection("mapeamento"); }}
                >
                  <Layers className="w-4 h-4 mr-2" />
                  Mapeamento
                </Button>
                <Button
                  
                  variant="outline" className={activeSection === "mapeamento" && mapeamentoSubTab === "moradas-gerais" ? "bg-yellow-400 text-black border-yellow-400 hover:bg-yellow-500 w-full" : "w-full"}
                  onClick={() => { setMapeamentoSubTab("moradas-gerais"); changeSection("mapeamento"); }}
                >
                  <Layers className="w-4 h-4 mr-2" />
                  Moradas gerais
                </Button>
              </div>
            </CardContent>
          </Card>}

        </div>

        {/* Footer de Navegação */}
        <div className="mt-8 text-center">
          <p className="text-gray-500 text-sm">
            Coordenação Psicossocial • Sistema RBAC Isolado
          </p>
        </div>


        {/* Área de Conteúdo Dinâmica */}
        <div className="mt-8" id="coordenador-psico-content-area">

          {activeSection === 'familias' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Gestão de Famílias</span>
                    <Button 
                      data-testid="button-add-family" 
                      className="flex items-center gap-2"
                      onClick={() => setShowFamiliaModal(true)}
                    >
                      <Plus className="h-4 w-4" />
                      Cadastrar Família
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-6">Cadastro e acompanhamento das famílias atendidas pelo programa.</p>
                  
                  <Tabs defaultValue="lista" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="lista">Lista de Famílias</TabsTrigger>
                      <TabsTrigger value="estatisticas">Estatísticas</TabsTrigger>
                      <TabsTrigger value="acompanhamento">Acompanhamento</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="lista" className="space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="relative flex-1">
                          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input 
                            placeholder="Buscar família..." 
                            className="pl-10" 
                            data-testid="input-search-family"
                          />
                        </div>
                        <Select>
                          <SelectTrigger className="w-48">
                            <SelectValue placeholder="Status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ativo">Ativo</SelectItem>
                            <SelectItem value="em-acompanhamento">Em Acompanhamento</SelectItem>
                            <SelectItem value="inativo">Inativo</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button variant="outline" data-testid="button-filter">
                          <Filter className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <Card>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Família</TableHead>
                              <TableHead>Responsável</TableHead>
                              <TableHead>Membros</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Último Atendimento</TableHead>
                              <TableHead>Ações</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {isLoadingFamilias ? (
                              <TableRow>
                                <TableCell colSpan={6} className="text-center py-8">
                                  <div className="flex items-center justify-center gap-2">
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-500"></div>
                                    <span className="text-gray-500">Carregando famílias...</span>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ) : familias.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                                  Nenhuma família cadastrada
                                </TableCell>
                              </TableRow>
                            ) : (
                              familias.map((familia: any) => (
                                <TableRow key={familia.id}>
                                  <TableCell>
                                    <div>
                                      <div className="font-medium">Família {familia.nomeResponsavel}</div>
                                      <div className="text-sm text-gray-500">ID: #{familia.id}</div>
                                    </div>
                                  </TableCell>
                                  <TableCell>{familia.nomeResponsavel}</TableCell>
                                  <TableCell>{familia.numeroMembros} membros</TableCell>
                                  <TableCell>
                                    <Badge variant="outline" className={
                                      familia.status === 'em_acompanhamento' ? 'bg-green-50 text-green-700' :
                                      familia.status === 'ativo' ? 'bg-blue-50 text-blue-700' :
                                      familia.status === 'inativo' ? 'bg-gray-50 text-gray-700' :
                                      'bg-red-50 text-red-700'
                                    }>
                                      {familia.status === 'em_acompanhamento' ? 'Em Acompanhamento' :
                                       familia.status === 'ativo' ? 'Ativo' :
                                       familia.status === 'inativo' ? 'Inativo' :
                                       'Encerrado'}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>{familia.ultimoAtendimento || 'N/A'}</TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-2">
                                      <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        data-testid="button-view-family"
                                        onClick={() => {
                                          setSelectedFamilia(familia);
                                          setShowViewFamiliaModal(true);
                                        }}
                                      >
                                        <Eye className="h-4 w-4" />
                                      </Button>
                                      <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        data-testid="button-edit-family"
                                        onClick={() => {
                                          setSelectedFamilia(familia);
                                          setFamiliaForm({
                                            nomeResponsavel: familia.nomeResponsavel,
                                            numeroMembros: familia.numeroMembros,
                                            telefone: familia.telefone || '',
                                            endereco: familia.endereco || '',
                                            status: familia.status,
                                            observacoes: familia.observacoes || '',
                                            atendidosSelecionados: []
                                          });
                                          setShowEditFamiliaModal(true);
                                        }}
                                      >
                                        <Edit className="h-4 w-4" />
                                      </Button>
                                      <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        className="text-red-600 hover:text-red-700"
                                        style={{ display: canDelete ? undefined : "none" }}
                                        data-testid={`button-delete-family-${familia.id}`}
                                        onClick={() => {
                                          setSelectedFamilia(familia);
                                          setShowDeleteFamiliaDialog(true);
                                        }}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))
                            )}
                          </TableBody>
                        </Table>
                      </Card>
                    </TabsContent>
                    
                    <TabsContent value="estatisticas" className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card>
                          <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium text-gray-600">Total de Famílias</p>
                                <p className="text-2xl font-bold">87</p>
                              </div>
                              <Users className="h-8 w-8 text-blue-600" />
                            </div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium text-gray-600">Em Acompanhamento</p>
                                <p className="text-2xl font-bold">34</p>
                              </div>
                              <HeartHandshake className="h-8 w-8 text-green-600" />
                            </div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium text-gray-600">Casos Críticos</p>
                                <p className="text-2xl font-bold">12</p>
                              </div>
                              <Activity className="h-8 w-8 text-red-600" />
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="acompanhamento" className="space-y-4">
                      <Card>
                        <CardHeader>
                          <CardTitle>Plano de Acompanhamento</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="familia-select">Selecionar Família</Label>
                              <Select>
                                <SelectTrigger>
                                  <SelectValue placeholder="Escolha uma família" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="familia1">Família Silva</SelectItem>
                                  <SelectItem value="familia2">Família Santos</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="tipo-acompanhamento">Tipo de Acompanhamento</Label>
                              <Select>
                                <SelectTrigger>
                                  <SelectValue placeholder="Tipo" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="domiciliar">Visita Domiciliar</SelectItem>
                                  <SelectItem value="tecnico">Atendimento Técnico</SelectItem>
                                  <SelectItem value="grupo">Grupo Familiar</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="observacoes">Observações do Acompanhamento</Label>
                            <Textarea 
                              id="observacoes"
                              placeholder="Descreva o plano de acompanhamento..."
                              rows={4}
                            />
                          </div>
                          <Button 
                            data-testid="button-save-plan"
                            onClick={handleSavePlano}
                            disabled={createPlanoMutation.isPending}
                          >
                            {createPlanoMutation.isPending ? "Salvando..." : "Salvar Plano de Acompanhamento"}
                          </Button>
                        </CardContent>
                      </Card>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>
          )}

          {activeSection === 'casos' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Casos Ativos</span>
                    <Button 
                      data-testid="button-new-case" 
                      className="flex items-center gap-2"
                      onClick={() => setShowCasoModal(true)}
                    >
                      <Plus className="h-4 w-4" />
                      Novo Caso
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-6">Gestão e acompanhamento dos casos psicossociais em andamento.</p>
                  
                  <Tabs defaultValue="ativos" className="w-full">
                    <TabsList className="grid w-full grid-cols-4">
                      <TabsTrigger value="ativos">Casos Ativos</TabsTrigger>
                      <TabsTrigger value="criticos">Críticos</TabsTrigger>
                      <TabsTrigger value="acompanhamento">Em Acompanhamento</TabsTrigger>
                      <TabsTrigger value="finalizados">Finalizados</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="ativos" className="space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="relative flex-1">
                          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input 
                            placeholder="Buscar caso..." 
                            className="pl-10" 
                            data-testid="input-search-case"
                          />
                        </div>
                        <Select>
                          <SelectTrigger className="w-48">
                            <SelectValue placeholder="Prioridade" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="alta">Alta</SelectItem>
                            <SelectItem value="media">Média</SelectItem>
                            <SelectItem value="baixa">Baixa</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button variant="outline" data-testid="button-export-cases">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <Card>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium text-gray-600">Total Ativos</p>
                                <p className="text-2xl font-bold text-blue-600">{casos.filter(c => c.status === 'aberto').length}</p>
                              </div>
                              <Activity className="h-8 w-8 text-blue-600" />
                            </div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium text-gray-600">Críticos</p>
                                <p className="text-2xl font-bold text-red-600">{casos.filter(c => c.prioridade === 'alta').length}</p>
                              </div>
                              <AlertTriangle className="h-8 w-8 text-red-600" />
                            </div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium text-gray-600">Novos (Semana)</p>
                                <p className="text-2xl font-bold text-green-600">
                                  {casos.filter(c => {
                                    const casoDate = new Date(c.dataAbertura);
                                    const weekAgo = new Date();
                                    weekAgo.setDate(weekAgo.getDate() - 7);
                                    return casoDate >= weekAgo;
                                  }).length}
                                </p>
                              </div>
                              <Plus className="h-8 w-8 text-green-600" />
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                      
                      <Card>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Caso</TableHead>
                              <TableHead>Família/Pessoa</TableHead>
                              <TableHead>Tipo</TableHead>
                              <TableHead>Prioridade</TableHead>
                              <TableHead>Responsável</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Ações</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {casos.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                                  Nenhum caso cadastrado
                                </TableCell>
                              </TableRow>
                            ) : (
                              casos.map((caso: any) => {
                                const familia = familias.find((f: any) => f.id === caso.familiaId);
                                return (
                                  <TableRow key={caso.id}>
                                    <TableCell>
                                      <div>
                                        <div className="font-medium">#C{String(caso.id).padStart(3, '0')}</div>
                                        <div className="text-sm text-gray-500">
                                          Aberto {new Date(caso.dataAbertura).toLocaleDateString('pt-BR')}
                                        </div>
                                      </div>
                                    </TableCell>
                                    <TableCell>{familia ? familia.nomeResponsavel : 'Não especificado'}</TableCell>
                                    <TableCell>{caso.tipo}</TableCell>
                                    <TableCell>
                                      <Badge className={
                                        caso.prioridade === 'alta' ? 'bg-red-100 text-red-800' :
                                        caso.prioridade === 'media' ? 'bg-orange-100 text-orange-800' :
                                        'bg-yellow-100 text-yellow-800'
                                      }>
                                        {caso.prioridade === 'alta' ? 'Alta' : caso.prioridade === 'media' ? 'Média' : 'Baixa'}
                                      </Badge>
                                    </TableCell>
                                    <TableCell>{caso.responsavelNome || '-'}</TableCell>
                                    <TableCell>
                                      <Badge className={
                                        caso.status === 'aberto' ? 'bg-blue-100 text-blue-800' :
                                        caso.status === 'em_atendimento' ? 'bg-purple-100 text-purple-800' :
                                        'bg-green-100 text-green-800'
                                      }>
                                        {caso.status === 'aberto' ? 'Em Atendimento' : 
                                         caso.status === 'em_atendimento' ? 'Acompanhamento' : 
                                         'Fechado'}
                                      </Badge>
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex items-center gap-2">
                                        <Button 
                                          variant="ghost" 
                                          size="sm" 
                                          data-testid="button-view-case"
                                          onClick={() => {
                                            setSelectedCaso(caso);
                                            setShowViewCasoModal(true);
                                          }}
                                        >
                                          <Eye className="h-4 w-4" />
                                        </Button>
                                        <Button 
                                          variant="ghost" 
                                          size="sm" 
                                          data-testid="button-edit-case"
                                          onClick={() => {
                                            setSelectedCaso(caso);
                                            setCasoForm({
                                              familiaId: caso.familiaId || null,
                                              titulo: caso.titulo,
                                              tipo: caso.tipo,
                                              prioridade: caso.prioridade,
                                              status: caso.status,
                                              responsavelNome: caso.responsavelNome || '',
                                              descricao: caso.descricao || ''
                                            });
                                            setShowEditCasoModal(true);
                                          }}
                                        >
                                          <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button 
                                          variant="ghost" 
                                          size="sm" 
                                          className="text-red-600 hover:text-red-700"
                                          style={{ display: canDelete ? undefined : "none" }}
                                          data-testid={`button-delete-case-${caso.id}`}
                                          onClick={() => {
                                            setSelectedCaso(caso);
                                            setShowDeleteCasoDialog(true);
                                          }}
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                );
                              })
                            )}
                          </TableBody>
                        </Table>
                      </Card>
                    </TabsContent>
                    
                    <TabsContent value="criticos" className="space-y-4">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-red-600">Casos Críticos - Atenção Imediata</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                              <div className="flex-1">
                                <p className="font-medium text-red-800">#C001 - Família Silva</p>
                                <p className="text-sm text-red-700">Violência doméstica com risco iminente. Última intervenção: 25/09/2025</p>
                                <div className="flex items-center gap-2 mt-2">
                                  <Button size="sm" className="bg-red-600 hover:bg-red-700">
                                    Intervenção Urgente
                                  </Button>
                                  <Button variant="outline" size="sm">
                                    Ver Detalhes
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                              <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
                              <div className="flex-1">
                                <p className="font-medium text-orange-800">#C003 - Maria Oliveira</p>
                                <p className="text-sm text-orange-700">Criança em situação de vulnerabilidade. Acompanhamento semanal necessário.</p>
                                <div className="flex items-center gap-2 mt-2">
                                  <Button size="sm" className="bg-orange-600 hover:bg-orange-700">
                                    Agendar Visita
                                  </Button>
                                  <Button variant="outline" size="sm">
                                    Ver Detalhes
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>
                    
                    <TabsContent value="acompanhamento" className="space-y-4">
                      <Card>
                        <CardHeader>
                          <CardTitle>Plano de Acompanhamento de Casos</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Selecionar Caso</Label>
                              <Select>
                                <SelectTrigger>
                                  <SelectValue placeholder="Escolha um caso" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="caso1">#C001 - Família Silva</SelectItem>
                                  <SelectItem value="caso2">#C002 - João Santos</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label>Frequência de Acompanhamento</Label>
                              <Select>
                                <SelectTrigger>
                                  <SelectValue placeholder="Frequência" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="semanal">Semanal</SelectItem>
                                  <SelectItem value="quinzenal">Quinzenal</SelectItem>
                                  <SelectItem value="mensal">Mensal</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Estratégias de Intervenção</Label>
                            <Textarea 
                              placeholder="Descreva as estratégias e objetivos do acompanhamento..."
                              rows={4}
                            />
                          </div>
                          <Button 
                            data-testid="button-save-monitoring"
                            onClick={handleSavePlano}
                            disabled={createPlanoMutation.isPending}
                          >
                            {createPlanoMutation.isPending ? "Salvando..." : "Salvar Plano de Acompanhamento"}
                          </Button>
                        </CardContent>
                      </Card>
                    </TabsContent>
                    
                    <TabsContent value="finalizados" className="space-y-4">
                      <Card>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Caso</TableHead>
                              <TableHead>Família/Pessoa</TableHead>
                              <TableHead>Data Abertura</TableHead>
                              <TableHead>Data Encerramento</TableHead>
                              <TableHead>Resultado</TableHead>
                              <TableHead>Ações</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            <TableRow>
                              <TableCell>#C100</TableCell>
                              <TableCell>Família Costa</TableCell>
                              <TableCell>15/08/2025</TableCell>
                              <TableCell>22/09/2025</TableCell>
                              <TableCell>
                                <Badge className="bg-green-100 text-green-800">Resolvido</Badge>
                              </TableCell>
                              <TableCell>
                                <Button variant="ghost" size="sm" data-testid="button-view-closed-case">
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </Card>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>
          )}

          {activeSection === 'participantes' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Atendidos</span>

                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
                    <div className="bg-purple-50 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-purple-700">{(psicoDashStats as any)?.data?.atendimentoIndividual || 0}</div>
                      <div className="text-xs text-purple-600">Atend. Individuais</div>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-blue-700">{(psicoDashStats as any)?.data?.visitaDomiciliar || 0}</div>
                      <div className="text-xs text-blue-600">Visitas Domiciliares</div>
                    </div>
                    <div className="bg-yellow-50 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-yellow-700">{(psicoDashStats as any)?.data?.espacoOGrito || 0}</div>
                      <div className="text-xs text-yellow-600">Espaço O Grito</div>
                    </div>
                    <div className="bg-red-50 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-red-700">{(psicoDashStats as any)?.data?.acoesSaude || 0}</div>
                      <div className="text-xs text-red-600">Ações p/ Saúde</div>
                    </div>
                    <div className="bg-orange-50 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-orange-700">{(psicoDashStats as any)?.data?.demandasEspontaneas || 0}</div>
                      <div className="text-xs text-orange-600">Dem. Espontâneas</div>
                    </div>
                  </div>

                  <div className="mt-2">
                    <div className="mb-4">
                      <div className="relative">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input placeholder="Buscar atendido por nome ou CPF..." value={buscaParticipante} onChange={(e) => setBuscaParticipante(e.target.value)} className="pl-10" />
                      </div>
                    </div>
                    {loadingAtendidosReg ? (
                      <div className="text-center py-6 text-gray-500">Carregando atendidos...</div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Nome</TableHead>
                            <TableHead>CPF</TableHead>
                            <TableHead>Registros</TableHead>
                            <TableHead>Ações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {(() => {
                            const filtered = (atendidosRegistrados as any[]).filter((a: any) => {
                              if (!buscaParticipante.trim()) return true;
                              const termo = buscaParticipante.toLowerCase();
                              return (a.nome || "").toLowerCase().includes(termo) || (a.cpf || "").includes(buscaParticipante);
                            }).sort((a: any, b: any) => (a.nome || "").localeCompare(b.nome || "", 'pt-BR'));
                            if (filtered.length === 0) return (
                              <TableRow>
                                <TableCell colSpan={4} className="text-center text-gray-500 py-8">
                                  Nenhum atendido encontrado. Cadastre registros na seção "Serviços Psicossociais".
                                </TableCell>
                              </TableRow>
                            );
                            return filtered.map((a: any) => (
                              <TableRow key={a.id} className="cursor-pointer hover:bg-purple-50" onClick={() => { setSelectedParticipante(a); setShowHistoricoModal(true); }}>
                                <TableCell className="font-medium">{a.nome ? normalizeName(a.nome) : "-"}</TableCell>
                                <TableCell className="text-sm text-gray-500">{formatCPF(a.cpf)}</TableCell>
                                <TableCell>
                                  <Badge className="bg-purple-100 text-purple-800">{a.totalAtendimentos} registro(s)</Badge>
                                </TableCell>
                                <TableCell>
                                  <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); setSelectedParticipante(a); setShowHistoricoModal(true); }}>
                                    <Eye className="w-4 h-4 mr-1" /> Ver
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ));
                          })()}
                        </TableBody>
                      </Table>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeSection === 'frequencias' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-blue-500" />
                    Frequências das Turmas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 flex-wrap mb-4">
                    <span className="text-sm font-medium text-gray-700">Programa:</span>
                    <Button size="sm" variant={freqPrograma === "pec" ? "default" : "outline"} onClick={() => { setFreqPrograma("pec"); setFreqTurmaId(""); setFreqExpandida(null); }} className={freqPrograma === "pec" ? "bg-yellow-500 hover:bg-yellow-600" : ""}>
                      PEC
                    </Button>
                    <Button size="sm" variant={freqPrograma === "inclusao" ? "default" : "outline"} onClick={() => { setFreqPrograma("inclusao"); setFreqTurmaId(""); setFreqExpandida(null); }} className={freqPrograma === "inclusao" ? "bg-green-600 hover:bg-green-700" : ""}>
                      Inclusão Produtiva
                    </Button>
                  </div>

                  {!freqTurmaId ? (
                    <div>
                      <h3 className="font-semibold text-gray-800 mb-3">Turmas - {freqPrograma === "pec" ? "PEC" : "Inclusão Produtiva"}</h3>
                      <input type="text" placeholder="Buscar turma..." value={freqBusca} onChange={(e) => setFreqBusca(e.target.value)} className="w-full px-3 py-2 mb-3 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
                      {(freqTurmas as any[]).length > 0 ? (
                        <div className="space-y-1">
                          {[...(freqTurmas as any[])].filter((t: any) => !freqBusca || (t.nome || t.title || `Turma ${t.id}`).toLowerCase().includes(freqBusca.toLowerCase())).sort((a: any, b: any) => {
                            const aMax = freqHistorico.filter((c: any) => String(c.turmaId) === String(a.id)).reduce((m: string, c: any) => c.data > m ? c.data : m, "");
                            const bMax = freqHistorico.filter((c: any) => String(c.turmaId) === String(b.id)).reduce((m: string, c: any) => c.data > m ? c.data : m, "");
                            if (!aMax && !bMax) return (b.id || 0) - (a.id || 0);
                            if (!aMax) return 1;
                            if (!bMax) return -1;
                            return bMax.localeCompare(aMax);
                          }).map((t: any) => {
                            const turmasChamadas = freqHistorico.filter((c: any) => String(c.turmaId) === String(t.id));
                            const totalChamadas = turmasChamadas.length;
                            const freqMedia = totalChamadas > 0 ? Math.round(turmasChamadas.reduce((acc: number, c: any) => acc + (c.presentes || 0), 0) / turmasChamadas.reduce((acc: number, c: any) => acc + (c.total || 1), 0) * 100) : 0;
                            return (
                              <div key={t.id} className="flex items-center justify-between px-4 py-3 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => { setFreqTurmaId(String(t.id)); setFreqExpandida(null); }}>
                                <div>
                                  <span className="font-medium text-gray-800 text-sm">{t.nome || t.title || `Turma ${t.id}`}</span>
                                  <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                                    <span>{totalChamadas} chamadas</span>
                                    <span>Freq: <span className={`font-medium ${freqMedia >= 70 ? "text-green-600" : freqMedia >= 50 ? "text-yellow-600" : "text-red-600"}`}>{freqMedia}%</span></span>
                                  </div>
                                </div>
                                <ChevronDown className="w-4 h-4 text-gray-400 -rotate-90" />
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-center py-6 text-gray-400 border rounded-lg">
                          Nenhuma turma encontrada para {freqPrograma === "pec" ? "PEC" : "Inclusão Produtiva"}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Button size="sm" variant="ghost" onClick={() => { setFreqTurmaId(""); setFreqExpandida(null); }} className="text-gray-600 hover:text-gray-800 px-2">
                          ← Voltar
                        </Button>
                        <h3 className="font-semibold text-gray-800">
                          {(freqTurmas as any[]).find((t: any) => String(t.id) === freqTurmaId)?.nome || (freqTurmas as any[]).find((t: any) => String(t.id) === freqTurmaId)?.title || "Turma"}
                        </h3>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                        <div className={`${freqPrograma === "pec" ? "bg-yellow-50" : "bg-green-50"} rounded-lg p-3 text-center`}>
                          <div className={`text-2xl font-bold ${freqPrograma === "pec" ? "text-yellow-700" : "text-green-700"}`}>{freqHistorico.length}</div>
                          <div className={`text-xs ${freqPrograma === "pec" ? "text-yellow-600" : "text-green-600"}`}>Chamadas</div>
                        </div>
                        <div className="bg-purple-50 rounded-lg p-3 text-center">
                          <div className="text-2xl font-bold text-purple-700">
                            {freqHistorico.length > 0 ? Math.round(freqHistorico.reduce((acc: number, c: any) => acc + (c.presentes || 0), 0) / freqHistorico.reduce((acc: number, c: any) => acc + (c.total || 1), 0) * 100) : 0}%
                          </div>
                          <div className="text-xs text-purple-600">Frequência Média</div>
                        </div>
                      </div>

                      {loadingFreqChamadas ? (
                        <div className="text-center py-4 text-gray-500">Carregando...</div>
                      ) : freqHistorico.length > 0 ? (
                        <div className="space-y-2">
                          {freqHistorico.map((c: any, i: number) => (
                            <div key={c.id || i} className="border rounded-lg overflow-hidden">
                              <div className="flex items-center justify-between px-4 py-3 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => setFreqExpandida(freqExpandida === c.id ? null : c.id)}>
                                <span className="text-sm font-medium">{c.data}</span>
                                <div className="flex items-center gap-3">
                                  <span className="text-sm">
                                    <span className="text-green-600 font-medium">{c.presentes || 0}</span>
                                    <span className="text-gray-400"> / </span>
                                    <span className="text-gray-600">{c.total || 0}</span>
                                  </span>
                                  <span className="text-xs text-gray-400">{freqExpandida === c.id ? "▲" : "▼"}</span>
                                </div>
                              </div>
                              {freqExpandida === c.id && c.presencas && (
                                <div className="border-t">
                                  {[...c.presencas].sort((a: any, b: any) => (a.nome || '').localeCompare(b.nome || '', 'pt-BR')).map((p: any, pi: number) => (
                                    <div key={p.alunoCpf || pi} className={`flex items-center justify-between px-4 py-2 border-b last:border-b-0 text-sm ${p.presente ? "bg-green-50" : "bg-red-50"}`}>
                                      <span>{(p.nome || 'Sem nome').trim()}</span>
                                      <Badge variant="outline" className={p.presente ? "border-green-500 text-green-600" : "border-red-500 text-red-600"}>
                                        {p.presente ? "Presente" : p.justificativa ? `Falta - ${p.justificativa}` : "Falta"}
                                      </Badge>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-6 text-gray-400 border rounded-lg">Nenhuma chamada registrada para esta turma</div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {activeSection === 'confidencial' && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lock className="w-5 h-5 text-purple-500" />
                    Registros Confidenciais
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-sm text-purple-800">
                    <strong>Registros Confidenciais:</strong> Registre atendimentos individuais, visitas domiciliares, encaminhamentos e outras intervenções psicossociais de forma segura e organizada.
                  </div>

                  <div className="flex gap-2 mb-2">
                    <Button size="sm" variant={confSubTab === "realizados" ? "default" : "outline"} onClick={() => setConfSubTab("realizados")} className={confSubTab === "realizados" ? "bg-purple-600 hover:bg-purple-700" : ""}>
                      Registros Realizados
                    </Button>
                    <Button size="sm" variant={confSubTab === "novo" ? "default" : "outline"} onClick={() => setConfSubTab("novo")} className={confSubTab === "novo" ? "bg-purple-600 hover:bg-purple-700" : ""}>
                      <Plus className="w-4 h-4 mr-1" /> Novo Registro
                    </Button>
                  </div>

                  {confSubTab === "novo" && (
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 space-y-3">
                      <h4 className="font-semibold text-purple-800">Novo Registro Confidencial</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="text-sm font-medium mb-1 block">Tipo de Atendimento</label>
                          <Select value={psicoRegistroForm.tipo} onValueChange={(v) => setPsicoRegistroForm({...psicoRegistroForm, tipo: v})}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="atendimento_individual">Atendimento Individual</SelectItem>
                              <SelectItem value="visita_domiciliar">Visita Domiciliar</SelectItem>
                              <SelectItem value="situacao_risco">Situação de Risco</SelectItem>
                              <SelectItem value="encaminhamento">Encaminhamento</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-1 block">Data</label>
                          <Input type="date" value={psicoRegistroForm.data} onChange={(e) => setPsicoRegistroForm({...psicoRegistroForm, data: e.target.value})} />
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-1 block">Título</label>
                          <Input value={psicoRegistroForm.titulo} onChange={(e) => setPsicoRegistroForm({...psicoRegistroForm, titulo: e.target.value})} placeholder="Ex: Atendimento - Maria Silva" />
                        </div>
                        <div className="relative">
                          <label className="text-sm font-medium mb-1 block">Participante</label>
                          <Input
                            value={registroPartOpen ? registroPartBusca : psicoRegistroForm.participanteNome}
                            onChange={(e) => {
                              setRegistroPartBusca(e.target.value);
                              setRegistroPartOpen(true);
                              setPsicoRegistroForm({...psicoRegistroForm, participanteNome: e.target.value, participanteCpf: "", participanteOrigem: "", participanteDataNascimento: ""});
                            }}
                            onFocus={() => { setRegistroPartOpen(true); setRegistroPartBusca(psicoRegistroForm.participanteNome || ""); }}
                            onBlur={() => setTimeout(() => setRegistroPartOpen(false), 200)}
                            placeholder="Buscar por nome (PEC/Inclusão/Comunidade) ou digitar novo"
                          />
                          {registroPartOpen && (() => {
                            const todosParticipantes = (todosAtendidosParaAtendimento as any[] || []);
                            const filtrados = todosParticipantes.filter((p: any) => {
                              if (registroPartFiltroVertente !== "todos" && p.origem !== registroPartFiltroVertente) return false;
                              if (!registroPartBusca.trim()) return true;
                              return (p.label || p.nome || "").toLowerCase().includes(registroPartBusca.toLowerCase()) ||
                                (p.cpf || "").includes(registroPartBusca);
                            });
                            return (
                              <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-56 overflow-y-auto">
                                <div className="flex items-center gap-1 p-2 border-b border-gray-100 bg-gray-50 sticky top-0">
                                  {(["todos", "pec", "inclusao", "comunidade"] as const).map((f) => (
                                    <button key={f} type="button"
                                      className={`text-xs px-2 py-0.5 rounded border transition-colors ${registroPartFiltroVertente === f ? "bg-purple-600 text-white border-purple-600" : "bg-white text-gray-600 border-gray-300 hover:bg-gray-100"}`}
                                      onMouseDown={(e) => { e.preventDefault(); setRegistroPartFiltroVertente(f); }}>
                                      {f === "todos" ? "Todos" : f === "pec" ? "PEC" : f === "inclusao" ? "Inclusão" : "Comunidade"}
                                    </button>
                                  ))}
                                </div>
                                {filtrados.length === 0 && registroPartBusca.trim().length >= 2 ? (
                                  <div className="p-3">
                                    <p className="text-xs text-gray-500 mb-1">Nenhum participante encontrado.</p>
                                    <p className="text-xs text-purple-600 font-medium">O nome digitado será usado como novo participante.</p>
                                  </div>
                                ) : filtrados.length === 0 ? (
                                  <div className="p-3 text-xs text-gray-400 text-center">Nenhum resultado.</div>
                                ) : filtrados.slice(0, 20).map((p: any, i: number) => (
                                  <button
                                    key={p.id || i}
                                    type="button"
                                    className="w-full text-left px-3 py-2 text-sm hover:bg-purple-50 flex items-center gap-2 border-b border-gray-50 last:border-0"
                                    onClick={() => {
                                      const nome = p.nome || p.label || "";
                                      const cpf = p.cpf || "";
                                      const dataNasc = p.data_nascimento || "";
                                      setPsicoRegistroForm({...psicoRegistroForm, participanteNome: nome, participanteCpf: cpf, participanteOrigem: p.origem || "", participanteDataNascimento: dataNasc});
                                      setRegistroPartBusca(nome);
                                      setRegistroPartOpen(false);
                                    }}
                                  >
                                    <span className="font-medium text-gray-900">{p.nome || p.label}</span>
                                    {p.cpf && <span className="text-xs text-gray-400">{formatCPF(p.cpf)}</span>}
                                    <span className="text-xs text-gray-400 ml-auto">{p.origem === 'inclusao' ? 'Inclusão' : p.origem === 'pec' ? 'PEC' : 'Comunidade'}</span>
                                  </button>
                                ))}
                                {filtrados.length > 20 && <div className="px-3 py-1 text-xs text-gray-400 text-center">Mostrando 20 de {filtrados.length}</div>}
                              </div>
                            );
                          })()}
                          {psicoRegistroForm.participanteNome && !registroPartOpen && (
                            <button type="button" className="absolute right-2 top-8 text-gray-400 hover:text-red-500 text-xs" onClick={() => { setPsicoRegistroForm({...psicoRegistroForm, participanteNome: "", participanteCpf: "", participanteOrigem: "", participanteDataNascimento: ""}); setRegistroPartBusca(""); }}>✕</button>
                          )}
                          {psicoRegistroForm.participanteNome && !psicoRegistroForm.participanteCpf && !registroPartOpen && (
                            <p className="text-xs text-amber-600 mt-1">⚠ Selecione da lista para vincular o CPF automaticamente.</p>
                          )}
                          {psicoRegistroForm.participanteNome && psicoRegistroForm.participanteCpf && !registroPartOpen && (
                            <p className="text-xs text-green-600 mt-1">✓ CPF vinculado: {psicoRegistroForm.participanteCpf}</p>
                          )}
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-1 block">Descrição / Conteúdo</label>
                        <textarea
                          className="w-full border rounded-lg p-2 text-sm min-h-[120px]"
                          value={psicoRegistroForm.conteudo}
                          onChange={(e) => setPsicoRegistroForm({...psicoRegistroForm, conteudo: e.target.value})}
                          placeholder="Descreva em detalhes o atendimento, observações, encaminhamentos realizados..."
                        />
                      </div>
                      <div className="flex gap-2 justify-end">
                        <Button variant="outline" size="sm" onClick={() => setConfSubTab("realizados")}>Cancelar</Button>
                        <Button
                          size="sm"
                          className="bg-purple-600 hover:bg-purple-700"
                          disabled={!psicoRegistroForm.titulo || !psicoRegistroForm.conteudo || !psicoRegistroForm.participanteNome || createRegistroConfMutation.isPending}
                          onClick={() => createRegistroConfMutation.mutate(psicoRegistroForm)}
                        >
                          {createRegistroConfMutation.isPending ? "Salvando..." : "Salvar Registro"}
                        </Button>
                      </div>
                    </div>
                  )}

                  {confSubTab === "realizados" && (
                    <div className="space-y-3">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          value={confSearchTerm}
                          onChange={(e) => setConfSearchTerm(e.target.value)}
                          placeholder="Pesquisar por nome do participante..."
                          className="pl-9"
                        />
                      </div>

                      {loadingRegistrosConf ? (
                        <div className="text-center py-6 text-gray-500">Carregando registros...</div>
                      ) : (() => {
                        const allRegistros = (coordRegistrosConf as any[]);
                        const tipoLabel: Record<string, string> = { atendimento_individual: "Atendimento Individual", visita_domiciliar: "Visita Domiciliar", atendimento_coletivo: "Atendimento Coletivo", espaco_o_grito: "Espaço O Grito", acoes_saude: "Ações para Saúde", encaminhamento: "Encaminhamento", situacao_risco: "Situação de Risco", relato_espontaneo: "Relato Espontâneo", observacao_comportamental: "Observação Comportamental", contato_familiar: "Contato Familiar", outro: "Outro" };
                        const grouped: Record<string, any[]> = {};
                        const semParticipante: any[] = [];
                        allRegistros.forEach((r: any) => {
                          const nome = (r.participanteNome || "").trim();
                          if (!nome) { semParticipante.push(r); return; }
                          if (!grouped[nome]) grouped[nome] = [];
                          grouped[nome].push(r);
                        });
                        const participantNames = Object.keys(grouped).sort((a, b) => a.localeCompare(b, "pt-BR"));
                        const filteredNames = confSearchTerm.trim()
                          ? participantNames.filter(n => n.toLowerCase().includes(confSearchTerm.toLowerCase()))
                          : participantNames;
                        const totalRegistros = allRegistros.length;
                        if (totalRegistros === 0) return (
                          <div className="text-center py-8 text-gray-400 border rounded-lg">Nenhum registro confidencial</div>
                        );
                        if (confSearchTerm && filteredNames.length === 0 && semParticipante.length === 0) return (
                          <div className="text-center py-8 text-gray-400 border rounded-lg">Nenhum participante encontrado para essa pesquisa</div>
                        );

                        const renderRegistro = (r: any) => {
                          if (editRegistroId === r.id) {
                            return (
                              <div key={r.id} className="bg-purple-50 border border-purple-200 rounded-lg p-4 space-y-3">
                                <h4 className="font-semibold text-purple-800">Editar Registro Confidencial</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  <div>
                                    <label className="text-sm font-medium mb-1 block">Título</label>
                                    <Input value={editRegistroForm.titulo} onChange={(e) => setEditRegistroForm({...editRegistroForm, titulo: e.target.value})} />
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium mb-1 block">Tipo</label>
                                    <Select value={editRegistroForm.tipo} onValueChange={(v) => setEditRegistroForm({...editRegistroForm, tipo: v})}>
                                      <SelectTrigger><SelectValue /></SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="atendimento_individual">Atendimento Individual</SelectItem>
                                        <SelectItem value="visita_domiciliar">Visita Domiciliar</SelectItem>
                                        <SelectItem value="situacao_risco">Situação de Risco</SelectItem>
                                        <SelectItem value="encaminhamento">Encaminhamento</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium mb-1 block">Data</label>
                                    <Input type="date" value={editRegistroForm.data} onChange={(e) => setEditRegistroForm({...editRegistroForm, data: e.target.value})} />
                                  </div>
                                  <div className="relative">
                                    <label className="text-sm font-medium mb-1 block">Participante (opcional)</label>
                                    <Input
                                      value={editRegistroPartOpen ? editRegistroPartBusca : editRegistroForm.participanteNome}
                                      onChange={(e) => {
                                        setEditRegistroPartBusca(e.target.value);
                                        setEditRegistroPartOpen(true);
                                        setEditRegistroForm({...editRegistroForm, participanteNome: e.target.value});
                                      }}
                                      onFocus={() => { setEditRegistroPartOpen(true); setEditRegistroPartBusca(editRegistroForm.participanteNome || ""); }}
                                      onBlur={() => setTimeout(() => setEditRegistroPartOpen(false), 200)}
                                      placeholder="Buscar ou digitar nome do atendido"
                                    />
                                    {editRegistroPartOpen && (() => {
                                      const todos = (todosAtendidosParaAtendimento as any[] || []);
                                      const filtrados = editRegistroPartBusca.trim()
                                        ? todos.filter((p: any) => (p.label || p.nome || "").toLowerCase().includes(editRegistroPartBusca.toLowerCase()))
                                        : todos;
                                      if (filtrados.length === 0) return null;
                                      return (
                                        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                          {filtrados.slice(0, 20).map((p: any, i: number) => (
                                            <button key={p.id || i} type="button" className="w-full text-left px-3 py-2 text-sm hover:bg-purple-50 flex items-center gap-2 border-b border-gray-50 last:border-0"
                                              onClick={() => { setEditRegistroForm({...editRegistroForm, participanteNome: p.nome || p.label}); setEditRegistroPartBusca(p.nome || p.label); setEditRegistroPartOpen(false); }}>
                                              <span className="font-medium text-gray-900">{p.nome || p.label}</span>
                                              <span className="text-xs text-gray-400 ml-auto">{p.origem === 'inclusao' ? 'Inclusão' : p.origem === 'pec' ? 'PEC' : 'Comunidade'}</span>
                                            </button>
                                          ))}
                                        </div>
                                      );
                                    })()}
                                  </div>
                                </div>
                                <div>
                                  <label className="text-sm font-medium mb-1 block">Conteúdo</label>
                                  <textarea className="w-full border rounded-lg p-2 text-sm min-h-[120px]" value={editRegistroForm.conteudo} onChange={(e) => setEditRegistroForm({...editRegistroForm, conteudo: e.target.value})} />
                                </div>
                                <div className="flex gap-2 justify-end">
                                  <Button variant="outline" size="sm" onClick={() => setEditRegistroId(null)}>Cancelar</Button>
                                  <Button size="sm" className="bg-purple-600 hover:bg-purple-700"
                                    disabled={!editRegistroForm.titulo || !editRegistroForm.conteudo || updateRegistroConfMutation.isPending}
                                    onClick={() => updateRegistroConfMutation.mutate({ id: r.id, ...editRegistroForm })}>
                                    {updateRegistroConfMutation.isPending ? "Salvando..." : "Salvar Alterações"}
                                  </Button>
                                </div>
                              </div>
                            );
                          }
                          const isRegExpanded = confExpandedRegistro === r.id;
                          return (
                            <div key={r.id} className="border rounded-lg ml-4 overflow-hidden">
                              <button
                                type="button"
                                className="w-full flex items-center justify-between px-3 py-2 bg-white hover:bg-purple-50/50 transition-colors text-left"
                                onClick={() => setConfExpandedRegistro(isRegExpanded ? null : r.id)}
                              >
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  <ChevronRight className={`w-3 h-3 text-purple-400 transition-transform flex-shrink-0 ${isRegExpanded ? "rotate-90" : ""}`} />
                                  <span className="font-medium text-sm truncate">{r.titulo}</span>
                                  <Badge variant="outline" className="text-xs border-purple-300 text-purple-600 flex-shrink-0">{tipoLabel[r.tipo] || r.tipo}</Badge>
                                  <span className="text-xs text-gray-400 flex-shrink-0">{r.data ? new Date(r.data + "T12:00:00").toLocaleDateString("pt-BR") : "-"}</span>
                                </div>
                                <div className="flex gap-1 ml-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                                  <Button variant="ghost" size="sm" className="text-purple-500 hover:text-purple-700 hover:bg-purple-50 h-7 w-7 p-0"
                                    onClick={() => {
                                      setEditRegistroId(r.id);
                                      setEditRegistroForm({ titulo: r.titulo || "", tipo: r.tipo || "", conteudo: r.conteudo || "", participanteNome: r.participanteNome || "", data: r.data || "" });
                                      setEditRegistroPartBusca(r.participanteNome || "");
                                    }}>
                                    <Pencil className="w-3.5 h-3.5" />
                                  </Button>
                                  {canDelete && <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700 hover:bg-red-50 h-7 w-7 p-0"
                                    onClick={() => setConfirmDeleteRegistro({ open: true, id: r.id })}>
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </Button>}
                                </div>
                              </button>
                              {isRegExpanded && (
                                <div className="border-t bg-gray-50 px-4 py-3 space-y-2">
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                                    <div><span className="text-gray-500 font-medium">Tipo:</span> <span>{tipoLabel[r.tipo] || r.tipo}</span></div>
                                    <div><span className="text-gray-500 font-medium">Data:</span> <span>{r.data ? new Date(r.data + "T12:00:00").toLocaleDateString("pt-BR") : "-"}</span></div>
                                    {r.participanteNome && <div><span className="text-gray-500 font-medium">Participante:</span> <span className="text-purple-600">{r.participanteNome}</span></div>}
                                  </div>
                                  <div>
                                    <span className="text-gray-500 font-medium text-sm">Conteúdo:</span>
                                    <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap bg-white rounded p-2 border">{r.conteudo}</p>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        };

                        return (
                          <div className="space-y-2">
                            {confSearchTerm && <p className="text-xs text-gray-500">{filteredNames.length} participante(s) encontrado(s)</p>}
                            {filteredNames.map((nome) => {
                              const registros = grouped[nome];
                              const isExpanded = confExpandedParticipante === nome;
                              return (
                                <div key={nome} className="border rounded-lg overflow-hidden">
                                  <button
                                    type="button"
                                    className="w-full flex items-center justify-between px-4 py-3 bg-white hover:bg-purple-50 transition-colors"
                                    onClick={() => setConfExpandedParticipante(isExpanded ? null : nome)}
                                  >
                                    <div className="flex items-center gap-2">
                                      <ChevronDown className={`w-4 h-4 text-purple-500 transition-transform ${isExpanded ? "rotate-0" : "-rotate-90"}`} />
                                      <span className="font-medium text-gray-900">{nome}</span>
                                    </div>
                                    <Badge variant="outline" className="text-xs border-purple-300 text-purple-600">{registros.length} registro(s)</Badge>
                                  </button>
                                  {isExpanded && (
                                    <div className="border-t bg-gray-50 p-3 space-y-2">
                                      {registros.map((r: any) => renderRegistro(r))}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                            {semParticipante.length > 0 && !confSearchTerm && (
                              <div className="border rounded-lg overflow-hidden">
                                <button
                                  type="button"
                                  className="w-full flex items-center justify-between px-4 py-3 bg-white hover:bg-gray-50 transition-colors"
                                  onClick={() => setConfExpandedParticipante(confExpandedParticipante === "__sem_participante__" ? null : "__sem_participante__")}
                                >
                                  <div className="flex items-center gap-2">
                                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${confExpandedParticipante === "__sem_participante__" ? "rotate-0" : "-rotate-90"}`} />
                                    <span className="font-medium text-gray-500 italic">Sem participante vinculado</span>
                                  </div>
                                  <Badge variant="outline" className="text-xs">{semParticipante.length} registro(s)</Badge>
                                </button>
                                {confExpandedParticipante === "__sem_participante__" && (
                                  <div className="border-t bg-gray-50 p-3 space-y-2">
                                    {semParticipante.map((r: any) => renderRegistro(r))}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {activeSection === 'registros-gerais' && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-500" />
                    Registros Gerais
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
                    <strong>Registros Gerais:</strong> Registros não-confidenciais criados por monitores e coordenadores psicossociais. Todos os registros de ambas as funções são exibidos aqui.
                  </div>

                  <div className="flex gap-2 mb-2">
                    <Button size="sm" variant={geraisSubTab === "realizados" ? "default" : "outline"} onClick={() => setGeraisSubTab("realizados")} className={geraisSubTab === "realizados" ? "bg-blue-600 hover:bg-blue-700" : ""}>
                      Registros Realizados
                    </Button>
                    <Button size="sm" variant={geraisSubTab === "novo" ? "default" : "outline"} onClick={() => setGeraisSubTab("novo")} className={geraisSubTab === "novo" ? "bg-blue-600 hover:bg-blue-700" : ""}>
                      <Plus className="w-4 h-4 mr-1" /> Novo Registro
                    </Button>
                  </div>

                  {geraisSubTab === "novo" && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                      <h4 className="font-semibold text-blue-800">Novo Registro Geral</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="text-sm font-medium mb-1 block">Tipo</label>
                          <Select value={geraisForm.tipoGeral} onValueChange={(v) => { setGeraisForm({...geraisForm, tipoGeral: v, categoria: "", participanteNome: "", participanteCpf: ""}); setGeraisColaboradoresIds([]); setGeraisColabBusca(""); setGeraisPartBusca(""); setGeraisParticipantes([]); }}>
                            <SelectTrigger><SelectValue placeholder="Selecione o tipo..." /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="atendimento_coletivo">Atendimento Coletivo</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        {geraisForm.tipoGeral && (
                        <div>
                          <label className="text-sm font-medium mb-1 block">Categoria</label>
                          <Select value={geraisForm.categoria} onValueChange={(v) => { setGeraisForm({...geraisForm, categoria: v, participanteNome: "", participanteCpf: ""}); setGeraisColaboradoresIds([]); setGeraisColabBusca(""); setGeraisPartBusca(""); setGeraisParticipantes([]); }}>
                            <SelectTrigger><SelectValue placeholder="Selecione a categoria..." /></SelectTrigger>
                            <SelectContent>
                              {geraisForm.tipoGeral === "atendimento_coletivo" && <>
                                <SelectItem value="espaco_o_grito">Espaço O Grito</SelectItem>
                                <SelectItem value="caravana_comunitaria">Caravana Comunitária</SelectItem>
                                <SelectItem value="workshop">Workshop</SelectItem>
                              </>}
                            </SelectContent>
                          </Select>
                        </div>
                        )}
                        <div>
                          <label className="text-sm font-medium mb-1 block">Data</label>
                          <Input type="date" value={geraisForm.data} onChange={(e) => setGeraisForm({...geraisForm, data: e.target.value})} />
                        </div>
                        {(geraisForm.categoria === "caravana_comunitaria" || geraisForm.categoria === "workshop") && (
                        <div className="md:col-span-2">
                          <label className="text-sm font-medium mb-1 block">Participantes <span className="text-gray-400 text-xs">({geraisParticipantes.length} selecionado(s))</span></label>
                          <div className="flex items-center gap-1 mb-2">
                            {(["todos", "pec", "inclusao", "comunidade"] as const).map((f) => (
                              <button key={f} type="button"
                                className={`text-xs px-2 py-0.5 rounded border transition-colors ${geraisPartFiltroVertente === f ? "bg-purple-600 text-white border-purple-600" : "bg-white text-gray-600 border-gray-300 hover:bg-gray-100"}`}
                                onClick={() => setGeraisPartFiltroVertente(f)}>
                                {f === "todos" ? "Todos" : f === "pec" ? "PEC" : f === "inclusao" ? "Inclusão" : "Comunidade"}
                              </button>
                            ))}
                          </div>
                          <Input className="mb-2" placeholder="Filtrar participantes..." value={geraisPartBusca} onChange={(e) => setGeraisPartBusca(e.target.value)} />
                          <div className="border rounded-lg max-h-52 overflow-y-auto bg-white">
                            {(() => {
                              const todos = (todosAtendidosParaAtendimento as any[] || []);
                              const filtrados = todos.filter((p: any) => {
                                if (geraisPartFiltroVertente !== "todos") {
                                  const orig = (p.origem || "").toLowerCase();
                                  if (geraisPartFiltroVertente === "pec" && orig !== "pec") return false;
                                  if (geraisPartFiltroVertente === "inclusao" && orig !== "inclusao") return false;
                                  if (geraisPartFiltroVertente === "comunidade" && orig !== "comunidade") return false;
                                }
                                if (!geraisPartBusca.trim()) return true;
                                return (p.nome || p.label || "").toLowerCase().includes(geraisPartBusca.toLowerCase()) || (p.cpf || "").includes(geraisPartBusca);
                              });
                              if (filtrados.length === 0) return <div className="px-3 py-4 text-sm text-gray-400 text-center">Nenhum participante encontrado</div>;
                              return filtrados.slice(0, 50).map((p: any, i: number) => {
                                const nome = p.nome || p.label || "";
                                const checked = geraisParticipantes.some(x => x.nome === nome);
                                return (
                                  <label key={p.id || i} className="flex items-center gap-2 px-3 py-2 hover:bg-purple-50 cursor-pointer border-b last:border-0">
                                    <input type="checkbox" checked={checked} onChange={() => setGeraisParticipantes(prev => checked ? prev.filter(x => x.nome !== nome) : [...prev, { nome, cpf: p.cpf || "", origem: p.origem || "" }])} className="w-4 h-4 accent-purple-600" />
                                    <span className="text-sm text-gray-800 flex-1">{nome}</span>
                                    {p.cpf && <span className="text-xs text-gray-400">{p.cpf}</span>}
                                    <span className="text-xs text-gray-400">{p.origem === 'inclusao' ? 'Inclusão' : p.origem === 'pec' ? 'PEC' : 'Comunidade'}</span>
                                  </label>
                                );
                              });
                            })()}
                          </div>
                          {geraisParticipantes.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {geraisParticipantes.map((p, i) => (
                                <span key={i} className="inline-flex items-center gap-1 bg-purple-100 text-purple-800 text-xs px-2 py-0.5 rounded-full">
                                  {p.nome}
                                  <button type="button" onClick={() => setGeraisParticipantes(prev => prev.filter((_, idx) => idx !== i))} className="hover:text-red-600 ml-0.5">✕</button>
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        )}
                        {geraisForm.categoria === "espaco_o_grito" && (
                          <div className="md:col-span-2">
                            <label className="text-sm font-medium mb-1 block">Colaboradores presentes <span className="text-gray-400 text-xs">({geraisColaboradoresIds.length} selecionado(s))</span></label>
                            <Input className="mb-2" placeholder="Filtrar colaboradores..." value={geraisColabBusca} onChange={(e) => setGeraisColabBusca(e.target.value)} />
                            <div className="border rounded-lg max-h-52 overflow-y-auto bg-white">
                              {todosColaboradoresPsico.filter((c: any) => !geraisColabBusca || c.nome.toLowerCase().includes(geraisColabBusca.toLowerCase())).map((c: any) => {
                                const checked = geraisColaboradoresIds.includes(c.id);
                                return (
                                  <label key={c.id} className="flex items-center gap-2 px-3 py-2 hover:bg-blue-50 cursor-pointer border-b last:border-0">
                                    <input type="checkbox" checked={checked} onChange={() => setGeraisColaboradoresIds(prev => checked ? prev.filter(id => id !== c.id) : [...prev, c.id])} className="w-4 h-4 accent-blue-600" />
                                    <span className="text-sm text-gray-800">{c.nome}</span>
                                    {c.vinculo && <span className="ml-auto text-xs text-gray-400">{c.vinculo}</span>}
                                  </label>
                                );
                              })}
                              {todosColaboradoresPsico.length === 0 && <div className="px-3 py-4 text-sm text-gray-400 text-center">Carregando colaboradores...</div>}
                            </div>
                            {geraisColaboradoresIds.length > 0 && <p className="text-xs text-blue-600 mt-1">{geraisColaboradoresIds.length} colaborador(es) selecionado(s)</p>}
                          </div>
                        )}
                        <div className="md:col-span-2">
                          <label className="text-sm font-medium mb-1 block">Conteúdo</label>
                          <Textarea value={geraisForm.conteudo} onChange={(e) => setGeraisForm({...geraisForm, conteudo: e.target.value})} placeholder="Descreva o registro..." rows={4} />
                        </div>
                      </div>
                      <Button onClick={() => {
                        const isMultiPart = geraisForm.categoria === "caravana_comunitaria" || geraisForm.categoria === "workshop";
                        createGeraisMutation.mutate({
                          tipo: geraisForm.tipoGeral,
                          categoria: geraisForm.categoria,
                          conteudo: geraisForm.conteudo,
                          data: geraisForm.data,
                          participanteNome: isMultiPart ? (geraisParticipantes.length > 0 ? JSON.stringify(geraisParticipantes.map(p => p.nome)) : null) : geraisForm.participanteNome,
                          participanteCpf: isMultiPart ? null : geraisForm.participanteCpf,
                          colaboradoresIds: geraisForm.categoria === "espaco_o_grito" ? geraisColaboradoresIds : null,
                        });
                      }} disabled={createGeraisMutation.isPending || !geraisForm.tipoGeral || !geraisForm.categoria || !geraisForm.conteudo.trim() || (geraisForm.categoria === "espaco_o_grito" && geraisColaboradoresIds.length === 0)} className="bg-blue-600 hover:bg-blue-700">
                        {createGeraisMutation.isPending ? "Salvando..." : "Salvar Registro"}
                      </Button>
                    </div>
                  )}

                  {geraisSubTab === "realizados" && (
                    <div className="space-y-3">
                      <Input placeholder="Buscar registros..." value={geraisSearchTerm} onChange={(e) => setGeraisSearchTerm(e.target.value)} className="mb-2" />
                      {loadingRegistrosGerais ? (
                        <div className="text-center py-4 text-gray-500">Carregando...</div>
                      ) : (coordRegistrosGerais as any[]).filter((r: any) => !geraisSearchTerm || r.conteudo?.toLowerCase().includes(geraisSearchTerm.toLowerCase()) || r.participanteNome?.toLowerCase().includes(geraisSearchTerm.toLowerCase())).length === 0 ? (
                        <div className="text-center py-8 text-gray-400">Nenhum registro encontrado.</div>
                      ) : (
                        (coordRegistrosGerais as any[]).filter((r: any) => !geraisSearchTerm || r.conteudo?.toLowerCase().includes(geraisSearchTerm.toLowerCase()) || r.participanteNome?.toLowerCase().includes(geraisSearchTerm.toLowerCase())).map((r: any) => (
                          <div key={r.id} className="border rounded-lg p-3 bg-white space-y-2">
                            {editGeraisId === r.id ? (
                              <div className="space-y-2">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                  <div>
                                    <label className="text-xs font-medium mb-1 block">Tipo</label>
                                    <Select value={editGeraisForm.tipoGeral} onValueChange={(v) => { setEditGeraisForm({...editGeraisForm, tipoGeral: v, categoria: ""}); setEditGeraisColaboradoresIds([]); setEditGeraisColabBusca(""); setEditGeraisParticipantes([]); setEditGeraisPartBusca(""); }}>
                                      <SelectTrigger><SelectValue /></SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="atendimento_coletivo">Atendimento Coletivo</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div>
                                    <label className="text-xs font-medium mb-1 block">Categoria</label>
                                    <Select value={editGeraisForm.categoria} onValueChange={(v) => { setEditGeraisForm({...editGeraisForm, categoria: v}); setEditGeraisColaboradoresIds([]); setEditGeraisColabBusca(""); setEditGeraisParticipantes([]); setEditGeraisPartBusca(""); }}>
                                      <SelectTrigger><SelectValue /></SelectTrigger>
                                      <SelectContent>
                                        {editGeraisForm.tipoGeral === "atendimento_coletivo" && <>
                                          <SelectItem value="espaco_o_grito">Espaço O Grito</SelectItem>
                                          <SelectItem value="caravana_comunitaria">Caravana Comunitária</SelectItem>
                                          <SelectItem value="workshop">Workshop</SelectItem>
                                        </>}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <Input type="date" value={editGeraisForm.data} onChange={(e) => setEditGeraisForm({...editGeraisForm, data: e.target.value})} />
                                </div>
                                {(editGeraisForm.categoria === "caravana_comunitaria" || editGeraisForm.categoria === "workshop") && (
                                  <div>
                                    <label className="text-xs font-medium mb-1 block">Participantes <span className="text-gray-400">({editGeraisParticipantes.length} selecionado(s))</span></label>
                                    <div className="flex items-center gap-1 mb-1">
                                      {(["todos", "pec", "inclusao", "comunidade"] as const).map((f) => (
                                        <button key={f} type="button"
                                          className={`text-xs px-2 py-0.5 rounded border transition-colors ${editGeraisPartFiltro === f ? "bg-purple-600 text-white border-purple-600" : "bg-white text-gray-600 border-gray-300 hover:bg-gray-100"}`}
                                          onClick={() => setEditGeraisPartFiltro(f)}>
                                          {f === "todos" ? "Todos" : f === "pec" ? "PEC" : f === "inclusao" ? "Inclusão" : "Comunidade"}
                                        </button>
                                      ))}
                                    </div>
                                    <Input className="mb-1" placeholder="Filtrar participantes..." value={editGeraisPartBusca} onChange={(e) => setEditGeraisPartBusca(e.target.value)} />
                                    <div className="border rounded-lg max-h-40 overflow-y-auto bg-white">
                                      {(() => {
                                        const todos = (todosAtendidosParaAtendimento as any[] || []);
                                        const filtrados = todos.filter((p: any) => {
                                          if (editGeraisPartFiltro !== "todos") { const orig = (p.origem || "").toLowerCase(); if (editGeraisPartFiltro === "pec" && orig !== "pec") return false; if (editGeraisPartFiltro === "inclusao" && orig !== "inclusao") return false; if (editGeraisPartFiltro === "comunidade" && orig !== "comunidade") return false; }
                                          if (!editGeraisPartBusca.trim()) return true;
                                          return (p.nome || p.label || "").toLowerCase().includes(editGeraisPartBusca.toLowerCase()) || (p.cpf || "").includes(editGeraisPartBusca);
                                        });
                                        if (filtrados.length === 0) return <div className="px-3 py-3 text-xs text-gray-400 text-center">Nenhum participante</div>;
                                        return filtrados.slice(0, 50).map((p: any, i: number) => {
                                          const nome = p.nome || p.label || "";
                                          const checked = editGeraisParticipantes.some(x => x.nome === nome);
                                          return (
                                            <label key={p.id || i} className="flex items-center gap-2 px-2 py-1.5 hover:bg-purple-50 cursor-pointer border-b last:border-0">
                                              <input type="checkbox" checked={checked} onChange={() => setEditGeraisParticipantes(prev => checked ? prev.filter(x => x.nome !== nome) : [...prev, { nome, cpf: p.cpf || "", origem: p.origem || "" }])} className="w-3.5 h-3.5 accent-purple-600" />
                                              <span className="text-xs text-gray-800 flex-1">{nome}</span>
                                              <span className="text-xs text-gray-400">{p.origem === 'inclusao' ? 'Inclusão' : p.origem === 'pec' ? 'PEC' : 'Comunidade'}</span>
                                            </label>
                                          );
                                        });
                                      })()}
                                    </div>
                                    {editGeraisParticipantes.length > 0 && (
                                      <div className="mt-1 flex flex-wrap gap-1">
                                        {editGeraisParticipantes.map((p, i) => (
                                          <span key={i} className="inline-flex items-center gap-1 bg-purple-100 text-purple-800 text-xs px-2 py-0.5 rounded-full">
                                            {p.nome}<button type="button" onClick={() => setEditGeraisParticipantes(prev => prev.filter((_, idx) => idx !== i))} className="hover:text-red-600 ml-0.5">✕</button>
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                )}
                                {editGeraisForm.categoria === "espaco_o_grito" && (
                                  <div>
                                    <label className="text-xs font-medium mb-1 block">Colaboradores presentes <span className="text-gray-400">({editGeraisColaboradoresIds.length} selecionado(s))</span></label>
                                    <Input className="mb-1" placeholder="Filtrar..." value={editGeraisColabBusca} onChange={(e) => setEditGeraisColabBusca(e.target.value)} />
                                    <div className="border rounded-lg max-h-40 overflow-y-auto bg-white">
                                      {todosColaboradoresPsico.filter((c: any) => !editGeraisColabBusca || c.nome.toLowerCase().includes(editGeraisColabBusca.toLowerCase())).map((c: any) => {
                                        const checked = editGeraisColaboradoresIds.includes(c.id);
                                        return (
                                          <label key={c.id} className="flex items-center gap-2 px-2 py-1.5 hover:bg-blue-50 cursor-pointer border-b last:border-0">
                                            <input type="checkbox" checked={checked} onChange={() => setEditGeraisColaboradoresIds(prev => checked ? prev.filter(id => id !== c.id) : [...prev, c.id])} className="w-3.5 h-3.5 accent-blue-600" />
                                            <span className="text-xs text-gray-800">{c.nome}</span>
                                          </label>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}
                                <Textarea value={editGeraisForm.conteudo} onChange={(e) => setEditGeraisForm({...editGeraisForm, conteudo: e.target.value})} rows={3} />
                                <div className="flex gap-2">
                                  <Button size="sm" onClick={() => {
                                    const isMP = editGeraisForm.categoria === "caravana_comunitaria" || editGeraisForm.categoria === "workshop";
                                    updateGeraisMutation.mutate({ id: r.id, tipo: editGeraisForm.tipoGeral, categoria: editGeraisForm.categoria, conteudo: editGeraisForm.conteudo, data: editGeraisForm.data, participanteNome: isMP ? (editGeraisParticipantes.length > 0 ? JSON.stringify(editGeraisParticipantes.map(p => p.nome)) : null) : editGeraisForm.participanteNome, colaboradoresIds: editGeraisForm.categoria === "espaco_o_grito" ? editGeraisColaboradoresIds : null });
                                  }} disabled={updateGeraisMutation.isPending}>Salvar</Button>
                                  <Button size="sm" variant="outline" onClick={() => { setEditGeraisId(null); setEditGeraisColaboradoresIds([]); setEditGeraisColabBusca(""); setEditGeraisParticipantes([]); setEditGeraisPartBusca(""); }}>Cancelar</Button>
                                </div>
                              </div>
                            ) : (() => {
                                const tipoLabels: Record<string, string> = { atendimento_individual: "Atendimento Individual", atendimento_coletivo: "Atendimento Coletivo", espaco_o_grito: "Espaço O Grito", caravana_comunitaria: "Caravana Comunitária", workshop: "Workshop", acoes_saude: "Ações para Saúde", encaminhamento: "Encaminhamento", situacao_risco: "Situação de Risco", outro: "Outro" };
                                const categoriaDisplay = r.categoria ? tipoLabels[r.categoria] || r.categoria : null;
                                const tipoDisplay = tipoLabels[r.tipo] || r.tipo;
                                let colaboradoresIdsList2: number[] = [];
                                let colaboradoresDisplay2 = "";
                                if (r.colaboradoresIds) {
                                  try {
                                    colaboradoresIdsList2 = JSON.parse(r.colaboradoresIds);
                                    const nomes = colaboradoresIdsList2.map((id: number) => nomeColaboradorPsicoPorId(id)).filter(Boolean);
                                    colaboradoresDisplay2 = nomes.join(", ");
                                  } catch {}
                                }
                                return (
                              <>
                                <div className="flex justify-between items-start">
                                  <div>
                                    <Badge variant="outline" className="text-xs mb-1 text-gray-500 border-gray-300 mr-1">{tipoDisplay}</Badge>
                                    {categoriaDisplay && <Badge variant="outline" className="text-xs mb-1 text-blue-700 border-blue-300">{categoriaDisplay}</Badge>}
                                    {r.participanteNome && (() => {
                                      const cat = r.categoria || r.tipo;
                                      const isMP = cat === "caravana_comunitaria" || cat === "workshop";
                                      if (isMP) {
                                        try {
                                          const partic = JSON.parse(r.participanteNome) as string[];
                                          if (Array.isArray(partic) && partic.length > 0) {
                                            return (
                                              <details className="text-xs mt-0.5">
                                                <summary className="cursor-pointer text-purple-700 font-medium select-none list-none flex items-center gap-1"><span className="inline-block w-3 h-3 mr-0.5">▶</span>Participantes ({partic.length})</summary>
                                                <ul className="mt-1 pl-4 space-y-0.5 text-gray-700">{partic.map((n, i) => <li key={i} className="list-disc">{n}</li>)}</ul>
                                              </details>
                                            );
                                          }
                                        } catch {}
                                      }
                                      return <p className="text-sm font-medium text-gray-700">{r.participanteNome}</p>;
                                    })()}
                                    {colaboradoresDisplay2 && (
                                      <details className="text-xs">
                                        <summary className="cursor-pointer text-green-700 font-medium select-none list-none flex items-center gap-1">
                                          <span className="inline-block w-3 h-3 mr-0.5">▶</span>
                                          Colaboradores ({colaboradoresIdsList2.length})
                                        </summary>
                                        <ul className="mt-1 pl-4 space-y-0.5 text-gray-700">
                                          {[...colaboradoresIdsList2].map((id: number) => ({ id, nome: nomeColaboradorPsicoPorId(id) })).filter(x => x.nome).sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')).map(({ id, nome }) => (
                                            <li key={id} className="list-disc">{nome}</li>
                                          ))}
                                        </ul>
                                      </details>
                                    )}
                                    <p className="text-xs text-gray-500">{r.data ? new Date(r.data + "T12:00:00").toLocaleDateString("pt-BR") : r.data} · Criado por: {r.criadoPorRole === 'coordenador' ? 'Coordenador' : 'Monitor'}</p>
                                  </div>
                                  <div className="flex gap-1">
                                    <Button size="sm" variant="ghost" className="text-gray-400 hover:text-blue-600 h-7 w-7 p-0" onClick={() => setViewGeraisGeralRecord({ ...r, colaboradoresIdsList2 })}>
                                      <Eye className="w-3 h-3" />
                                    </Button>
                                    {String(r.criadoPorUserId) === String(userId) && (
                                      <>
                                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => {
  setEditGeraisId(r.id);
  const editCat = r.categoria || r.tipo;
  setEditGeraisForm({ tipoGeral: r.tipo === "atendimento_coletivo" ? r.tipo : "atendimento_coletivo", categoria: editCat, conteudo: r.conteudo, participanteNome: r.participanteNome || "", data: r.data });
  setEditGeraisColaboradoresIds(colaboradoresIdsList2);
  setEditGeraisColabBusca("");
  setEditGeraisPartBusca("");
  setEditGeraisPartFiltro("todos");
  const isMP = editCat === "caravana_comunitaria" || editCat === "workshop";
  if (isMP && r.participanteNome) {
    try { const arr = JSON.parse(r.participanteNome); setEditGeraisParticipantes(Array.isArray(arr) ? arr.map((n: string) => ({ nome: n })) : []); } catch { setEditGeraisParticipantes([]); }
  } else { setEditGeraisParticipantes([]); }
}}>
                                          <Pencil className="w-3 h-3" />
                                        </Button>
                                        {canDelete && <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => deleteGeraisMutation.mutate(r.id)} disabled={deleteGeraisMutation.isPending}>
                                          <Trash2 className="w-3 h-3 text-red-500" />
                                        </Button>}
                                      </>
                                    )}
                                  </div>
                                </div>
                                <p className="text-sm text-gray-700 whitespace-pre-wrap">{r.conteudo}</p>
                              </>
                                );
                              })()}
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* DIALOG VISUALIZAÇÃO REGISTRO GERAL */}
          <Dialog open={!!viewGeraisGeralRecord} onOpenChange={(open) => { if (!open) setViewGeraisGeralRecord(null); }}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>
                  {viewGeraisGeralRecord && (() => {
                    const tipoLabels: Record<string, string> = { atendimento_individual: "Atendimento Individual", atendimento_coletivo: "Atendimento Coletivo", espaco_o_grito: "Espaço O Grito", acoes_saude: "Ações para Saúde", encaminhamento: "Encaminhamento", situacao_risco: "Situação de Risco", outro: "Outro" };
                    return tipoLabels[viewGeraisGeralRecord.tipo] || viewGeraisGeralRecord.tipo;
                  })()}
                </DialogTitle>
                <DialogDescription asChild>
                  <div className="space-y-1.5 mt-1">
                    {viewGeraisGeralRecord?.categoria && (() => {
                      const catLabels: Record<string, string> = { espaco_o_grito: "Espaço O Grito", caravana_comunitaria: "Caravana Comunitária", workshop: "Workshop" };
                      const label = catLabels[viewGeraisGeralRecord.categoria] || viewGeraisGeralRecord.categoria;
                      return <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">{label}</span>;
                    })()}
                    <p className="text-xs text-muted-foreground">
                      {viewGeraisGeralRecord?.data ? new Date(viewGeraisGeralRecord.data + "T12:00:00").toLocaleDateString("pt-BR") : ""}
                      {viewGeraisGeralRecord?.criadoPorRole && ` · Criado por: ${viewGeraisGeralRecord.criadoPorRole === 'coordenador' ? 'Coordenador' : 'Monitor'}`}
                    </p>
                  </div>
                </DialogDescription>
              </DialogHeader>
              {viewGeraisGeralRecord && (
                <div className="space-y-3">
                  {viewGeraisGeralRecord.participanteNome && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 mb-1">Participante</p>
                      <p className="text-sm text-gray-800">{viewGeraisGeralRecord.participanteNome}</p>
                    </div>
                  )}
                  {viewGeraisGeralRecord.colaboradoresIdsList2?.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-green-700 mb-1">Colaboradores presentes ({viewGeraisGeralRecord.colaboradoresIdsList2.length})</p>
                      <ul className="space-y-0.5 pl-3">
                        {[...viewGeraisGeralRecord.colaboradoresIdsList2].map((id: number) => ({ id, nome: nomeColaboradorPsicoPorId(id) })).filter((x: any) => x.nome).sort((a: any, b: any) => a.nome.localeCompare(b.nome, 'pt-BR')).map(({ id, nome }: any) => (
                          <li key={id} className="text-sm text-gray-700 list-disc">{nome}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <div>
                    <p className="text-xs font-semibold text-gray-500 mb-1">Descrição</p>
                    <p className="text-sm text-gray-800 whitespace-pre-wrap bg-gray-50 rounded-lg p-3">{viewGeraisGeralRecord.conteudo}</p>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>

          {activeSection === 'atendimentos' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Atendimentos Psicossociais</span>
                    <Button 
                      data-testid="button-new-appointment" 
                      className="flex items-center gap-2"
                      onClick={() => setShowAtendimentoModal(true)}
                    >
                      <Plus className="h-4 w-4" />
                      Novo Atendimento
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-6">Coordenação dos atendimentos psicossociais individuais e familiares.</p>
                  
                  <Tabs defaultValue="agenda" className="w-full">
                    <TabsList className="grid w-full grid-cols-4">
                      <TabsTrigger value="agenda">Agenda</TabsTrigger>
                      <TabsTrigger value="historico">Histórico</TabsTrigger>
                      <TabsTrigger value="individuais">Individuais</TabsTrigger>
                      <TabsTrigger value="familiares">Familiares</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="agenda" className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <Card>
                          <CardContent className="p-4">
                            <div className="text-center">
                              <p className="text-2xl font-bold text-blue-600">
                                {atendimentos.filter((a: any) => {
                                  const hoje = new Date().toISOString().split('T')[0];
                                  return a.dataAtendimento === hoje;
                                }).length}
                              </p>
                              <p className="text-sm text-gray-600">Hoje</p>
                            </div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="p-4">
                            <div className="text-center">
                              <p className="text-2xl font-bold text-green-600">
                                {atendimentos.filter((a: any) => {
                                  const hoje = new Date();
                                  const dataAtend = new Date(a.dataAtendimento);
                                  const diffDias = Math.ceil((dataAtend.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
                                  return diffDias >= 0 && diffDias <= 7;
                                }).length}
                              </p>
                              <p className="text-sm text-gray-600">Esta Semana</p>
                            </div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="p-4">
                            <div className="text-center">
                              <p className="text-2xl font-bold text-orange-600">
                                {atendimentos.filter((a: any) => a.status === 'reagendado').length}
                              </p>
                              <p className="text-sm text-gray-600">Reagendados</p>
                            </div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="p-4">
                            <div className="text-center">
                              <p className="text-2xl font-bold text-red-600">
                                {atendimentos.filter((a: any) => a.status === 'faltou').length}
                              </p>
                              <p className="text-sm text-gray-600">Ausências</p>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                      
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Próximos Atendimentos</CardTitle>
                        </CardHeader>
                        <CardContent>
                          {atendimentos.filter((a: any) => new Date(a.dataAtendimento) >= new Date()).length > 0 ? (
                            <div className="space-y-3">
                              {atendimentos
                                .filter((a: any) => new Date(a.dataAtendimento) >= new Date())
                                .sort((a: any, b: any) => new Date(a.dataAtendimento).getTime() - new Date(b.dataAtendimento).getTime())
                                .slice(0, 5)
                                .map((atend: any) => (
                                  <div key={atend.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                                    <div className="flex items-center gap-3">
                                      <div className="flex flex-col items-center">
                                        <span className="text-sm font-medium">
                                          {new Date(atend.dataAtendimento).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                        <span className="text-xs text-gray-500">
                                          {new Date(atend.dataAtendimento).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                                        </span>
                                      </div>
                                      <div>
                                        <p className="font-medium">
                                          {atend.nomeParticipante || atend.nomeFamilia || 'Sem identificação'} - {atend.tipo}
                                        </p>
                                        <p className="text-sm text-gray-600">{atend.resumo || 'Atendimento psicossocial'}</p>
                                      </div>
                                    </div>
                                    <Badge className="bg-blue-100 text-blue-800">
                                      {atend.status || 'Agendado'}
                                    </Badge>
                                  </div>
                                ))}
                            </div>
                          ) : (
                            <div className="text-center py-8 text-gray-500">
                              <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                              <p>Nenhum atendimento agendado</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </TabsContent>
                    
                    <TabsContent value="historico" className="space-y-4">
                      <Card>
                        {(() => {
                          console.log('🔍 [RENDER DEBUG] atendimentos:', atendimentos);
                          console.log('🔍 [RENDER DEBUG] atendimentos.length:', atendimentos?.length);
                          console.log('🔍 [RENDER DEBUG] Condição:', atendimentos && atendimentos.length > 0);
                          return null;
                        })()}
                        {atendimentos && atendimentos.length > 0 ? (
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Data</TableHead>
                                <TableHead>Atendido/Família</TableHead>
                                <TableHead>Tipo</TableHead>
                                <TableHead>Profissional</TableHead>
                                <TableHead>Duração</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Ações</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {atendimentos
                                .sort((a: any, b: any) => new Date(b.dataAtendimento).getTime() - new Date(a.dataAtendimento).getTime())
                                .map((atend: any) => (
                                  <TableRow key={atend.id}>
                                    <TableCell>
                                      {new Date(atend.dataAtendimento).toLocaleDateString('pt-BR')}
                                    </TableCell>
                                    <TableCell>
                                      {atend.nomeParticipante || atend.nomeFamilia || 'Não identificado'}
                                    </TableCell>
                                    <TableCell className="capitalize">{atend.tipo}</TableCell>
                                    <TableCell>{atend.profissionalResponsavel || '-'}</TableCell>
                                    <TableCell>{atend.duracaoMinutos ? `${atend.duracaoMinutos} min` : '-'}</TableCell>
                                    <TableCell>
                                      <Badge className={
                                        atend.status === 'realizado' ? 'bg-green-100 text-green-800' :
                                        atend.status === 'reagendado' ? 'bg-orange-100 text-orange-800' :
                                        atend.status === 'faltou' ? 'bg-red-100 text-red-800' :
                                        'bg-blue-100 text-blue-800'
                                      }>
                                        {atend.status || 'Agendado'}
                                      </Badge>
                                    </TableCell>
                                    <TableCell>
                                      <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        data-testid="button-view-appointment"
                                        title="Ver detalhes"
                                      >
                                        <Eye className="h-4 w-4" />
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                ))}
                            </TableBody>
                          </Table>
                        ) : (
                          <CardContent className="py-12">
                            <div className="text-center text-gray-500">
                              <FileText className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                              <p className="font-medium">Nenhum atendimento registrado</p>
                              <p className="text-sm mt-1">Clique em "Novo Atendimento" para começar</p>
                            </div>
                          </CardContent>
                        )}
                      </Card>
                    </TabsContent>
                    
                    <TabsContent value="individuais" className="space-y-4">
                      <Card>
                        <CardHeader>
                          <CardTitle>Atendimentos Individuais</CardTitle>
                        </CardHeader>
                        <CardContent>
                          {atendimentos.filter((a: any) => a.tipo === 'individual').length > 0 ? (
                            <div className="space-y-3">
                              {atendimentos
                                .filter((a: any) => a.tipo === 'individual')
                                .sort((a: any, b: any) => new Date(b.dataAtendimento).getTime() - new Date(a.dataAtendimento).getTime())
                                .map((atend: any) => (
                                  <div key={atend.id} className="border rounded-lg p-4">
                                    <div className="flex justify-between items-start mb-2">
                                      <div>
                                        <h4 className="font-medium">{atend.nomeParticipante || 'Não identificado'}</h4>
                                        <p className="text-sm text-gray-600">
                                          {new Date(atend.dataAtendimento).toLocaleDateString('pt-BR')} - {atend.profissionalResponsavel || 'Sem profissional'}
                                        </p>
                                      </div>
                                      <Badge className={
                                        atend.status === 'realizado' ? 'bg-green-100 text-green-800' :
                                        atend.status === 'reagendado' ? 'bg-orange-100 text-orange-800' :
                                        atend.status === 'faltou' ? 'bg-red-100 text-red-800' :
                                        'bg-blue-100 text-blue-800'
                                      }>
                                        {atend.status || 'Agendado'}
                                      </Badge>
                                    </div>
                                    {atend.resumo && (
                                      <p className="text-sm text-gray-700 mt-2">{atend.resumo}</p>
                                    )}
                                  </div>
                                ))}
                            </div>
                          ) : (
                            <div className="text-center py-8 text-gray-500">
                              <User className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                              <p className="font-medium">Nenhum atendimento individual registrado</p>
                              <p className="text-sm mt-1">Clique em "Novo Atendimento" para criar</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </TabsContent>
                    
                    <TabsContent value="familiares" className="space-y-4">
                      <Card>
                        <CardHeader>
                          <CardTitle>Atendimentos Familiares</CardTitle>
                        </CardHeader>
                        <CardContent>
                          {atendimentos.filter((a: any) => a.tipo === 'familiar').length > 0 ? (
                            <div className="space-y-3">
                              {atendimentos
                                .filter((a: any) => a.tipo === 'familiar')
                                .sort((a: any, b: any) => new Date(b.dataAtendimento).getTime() - new Date(a.dataAtendimento).getTime())
                                .map((atend: any) => (
                                  <div key={atend.id} className="border rounded-lg p-4">
                                    <div className="flex justify-between items-start mb-2">
                                      <div>
                                        <h4 className="font-medium">{atend.nomeFamilia || 'Não identificado'}</h4>
                                        <p className="text-sm text-gray-600">
                                          {new Date(atend.dataAtendimento).toLocaleDateString('pt-BR')} - {atend.profissionalResponsavel || 'Sem profissional'}
                                        </p>
                                      </div>
                                      <Badge className={
                                        atend.status === 'realizado' ? 'bg-green-100 text-green-800' :
                                        atend.status === 'reagendado' ? 'bg-orange-100 text-orange-800' :
                                        atend.status === 'faltou' ? 'bg-red-100 text-red-800' :
                                        'bg-blue-100 text-blue-800'
                                      }>
                                        {atend.status || 'Agendado'}
                                      </Badge>
                                    </div>
                                    {atend.resumo && (
                                      <p className="text-sm text-gray-700 mt-2">{atend.resumo}</p>
                                    )}
                                  </div>
                                ))}
                            </div>
                          ) : (
                            <div className="text-center py-8 text-gray-500">
                              <Users className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                              <p className="font-medium">Nenhum atendimento familiar registrado</p>
                              <p className="text-sm mt-1">Clique em "Novo Atendimento" para criar</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>
          )}

          {activeSection === 'grupos' && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Grupos Terapêuticos</CardTitle>
                <Button 
                  className="bg-purple-500 hover:bg-purple-600"
                  onClick={() => setShowGrupoModal(true)}
                  data-testid="button-novo-grupo"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Grupo
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input placeholder="Buscar grupos..." className="pl-10" />
                    </div>
                    <Select>
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos</SelectItem>
                        <SelectItem value="ativo">Ativo</SelectItem>
                        <SelectItem value="inativo">Inativo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="grid gap-4">
                    {[
                      {
                        nome: 'Grupo Terapêutico de Mulheres',
                        tipo: 'Terapêutico',
                        participantes: 8,
                        facilitador: 'Ana Paula Costa',
                        horario: 'Quartas 14h-16h',
                        status: 'Ativo'
                      },
                      {
                        nome: 'Grupo de Apoio a Famílias',
                        tipo: 'Apoio',
                        participantes: 12,
                        facilitador: 'Carlos Silva',
                        horario: 'Sextas 16h-17h30',
                        status: 'Ativo'
                      },
                      {
                        nome: 'Grupo de Adolescentes',
                        tipo: 'Terapêutico',
                        participantes: 6,
                        facilitador: 'Marina Santos',
                        horario: 'Terças 15h-16h30',
                        status: 'Planejado'
                      }
                    ].map((grupo, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-semibold flex items-center gap-2">
                            <Heart className="w-4 h-4 text-purple-500" />
                            {grupo.nome}
                          </h3>
                          <Badge variant={grupo.status === 'Ativo' ? 'default' : 'secondary'}>
                            {grupo.status}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                          <div>
                            <span className="text-gray-500">Tipo:</span>
                            <p className="font-medium">{grupo.tipo}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Participantes:</span>
                            <p className="font-medium">{grupo.participantes}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Facilitador:</span>
                            <p className="font-medium">{grupo.facilitador}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Horário:</span>
                            <p className="font-medium">{grupo.horario}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            <Users className="w-4 h-4 mr-1" />
                            Ver Participantes
                          </Button>
                          <Button size="sm" variant="outline">
                            <Calendar className="w-4 h-4 mr-1" />
                            Sessões
                          </Button>
                          <Button size="sm" variant="outline">
                            <Edit className="w-4 h-4 mr-1" />
                            Editar
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeSection === 'violacoes' && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Violações de Direitos</CardTitle>
                <Button 
                  className="bg-red-500 hover:bg-red-600"
                  onClick={() => setShowViolacaoModal(true)}
                  data-testid="button-registrar-violacao"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Registrar Violação
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input placeholder="Buscar casos..." className="pl-10" />
                    </div>
                    <Select>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Tipo de violação" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos</SelectItem>
                        <SelectItem value="negligencia">Negligência</SelectItem>
                        <SelectItem value="violencia">Violência</SelectItem>
                        <SelectItem value="abandono">Abandono</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Vítima</TableHead>
                        <TableHead>Tipo de Violação</TableHead>
                        <TableHead>Data do Registro</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Prioridade</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell>
                          <div>
                            <div className="font-medium">Menor A.S.</div>
                            <div className="text-sm text-gray-500">Idade: 8 anos</div>
                          </div>
                        </TableCell>
                        <TableCell>Negligência</TableCell>
                        <TableCell>15/09/2025</TableCell>
                        <TableCell>
                          <Badge className="bg-yellow-100 text-yellow-800">Em Investigação</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-red-100 text-red-800">Alta</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="outline">
                              <Edit className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>
                          <div>
                            <div className="font-medium">Maria C.</div>
                            <div className="text-sm text-gray-500">Idade: 34 anos</div>
                          </div>
                        </TableCell>
                        <TableCell>Violência Doméstica</TableCell>
                        <TableCell>20/09/2025</TableCell>
                        <TableCell>
                          <Badge className="bg-blue-100 text-blue-800">Em Acompanhamento</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-orange-100 text-orange-800">Média</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="outline">
                              <Edit className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}

          {activeSection === 'medidas' && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Medidas Protetivas</CardTitle>
                <Button 
                  className="bg-orange-500 hover:bg-orange-600"
                  onClick={() => setShowMedidaModal(true)}
                  data-testid="button-nova-medida"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Medida
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input placeholder="Buscar medidas..." className="pl-10" />
                    </div>
                    <Select>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos</SelectItem>
                        <SelectItem value="ativa">Ativa</SelectItem>
                        <SelectItem value="cumprida">Cumprida</SelectItem>
                        <SelectItem value="violada">Violada</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="grid gap-4">
                    {[
                      {
                        id: 'MP001',
                        beneficiaria: 'Maria C.',
                        tipo: 'Medida Protetiva de Urgência',
                        descricao: 'Afastamento do agressor do lar',
                        dataInicio: '20/09/2025',
                        prazo: '6 meses',
                        status: 'Ativa'
                      },
                      {
                        id: 'MP002',
                        beneficiaria: 'Ana P.',
                        tipo: 'Proteção à Integridade Física',
                        descricao: 'Acompanhamento médico e psicológico',
                        dataInicio: '15/09/2025',
                        prazo: '3 meses',
                        status: 'Ativa'
                      }
                    ].map((medida, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-semibold flex items-center gap-2">
                            <Shield className="w-4 h-4 text-orange-500" />
                            {medida.id} - {medida.beneficiaria}
                          </h3>
                          <Badge variant={medida.status === 'Ativa' ? 'default' : 'secondary'}>
                            {medida.status}
                          </Badge>
                        </div>
                        <div className="space-y-2 text-sm mb-3">
                          <p><strong>Tipo:</strong> {medida.tipo}</p>
                          <p><strong>Descrição:</strong> {medida.descricao}</p>
                          <p><strong>Início:</strong> {medida.dataInicio}</p>
                          <p><strong>Prazo:</strong> {medida.prazo}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            <Eye className="w-4 h-4 mr-1" />
                            Detalhes
                          </Button>
                          <Button size="sm" variant="outline">
                            <FileText className="w-4 h-4 mr-1" />
                            Relatório
                          </Button>
                          <Button size="sm" variant="outline">
                            <Edit className="w-4 h-4 mr-1" />
                            Editar
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeSection === 'rede' && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Rede de Serviços</CardTitle>
                <Button 
                  className="bg-blue-500 hover:bg-blue-600"
                  onClick={() => setShowServicoModal(true)}
                  data-testid="button-novo-servico"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Serviço
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[
                      {
                        nome: 'CAPS - Centro de Atenção Psicossocial',
                        tipo: 'Saúde Mental',
                        contato: '(31) 3333-4444',
                        endereco: 'Rua das Flores, 123',
                        disponibilidade: 'Segunda a Sexta 8h-17h'
                      },
                      {
                        nome: 'CREAS - Centro de Referência Especializado',
                        tipo: 'Assistência Social',
                        contato: '(31) 3555-6666',
                        endereco: 'Av. Principal, 456',
                        disponibilidade: 'Segunda a Sexta 7h-16h'
                      },
                      {
                        nome: 'Conselho Tutelar',
                        tipo: 'Proteção Infantil',
                        contato: '(31) 3777-8888',
                        endereco: 'Rua da Proteção, 789',
                        disponibilidade: '24h - Plantão'
                      },
                      {
                        nome: 'Defensoria Pública',
                        tipo: 'Jurídico',
                        contato: '(31) 3999-0000',
                        endereco: 'Praça da Justiça, 101',
                        disponibilidade: 'Segunda a Sexta 8h-18h'
                      }
                    ].map((servico, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-semibold text-sm">{servico.nome}</h3>
                          <Badge variant="outline">{servico.tipo}</Badge>
                        </div>
                        <div className="space-y-2 text-sm">
                          <p><strong>Contato:</strong> {servico.contato}</p>
                          <p><strong>Endereço:</strong> {servico.endereco}</p>
                          <p><strong>Funcionamento:</strong> {servico.disponibilidade}</p>
                        </div>
                        <div className="flex gap-2 mt-3">
                          <Button size="sm" variant="outline">
                            <Eye className="w-4 h-4 mr-1" />
                            Detalhes
                          </Button>
                          <Button size="sm" variant="outline">
                            <Edit className="w-4 h-4 mr-1" />
                            Editar
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeSection === 'encaminhamentos' && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Encaminhamentos</CardTitle>
                <Button 
                  className="bg-green-500 hover:bg-green-600"
                  onClick={() => setShowEncaminhamentoModal(true)}
                  data-testid="button-novo-encaminhamento"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Encaminhamento
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input placeholder="Buscar encaminhamentos..." className="pl-10" />
                    </div>
                    <Select>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos</SelectItem>
                        <SelectItem value="pendente">Pendente</SelectItem>
                        <SelectItem value="em-andamento">Em Andamento</SelectItem>
                        <SelectItem value="concluido">Concluído</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Família/Pessoa</TableHead>
                        <TableHead>Serviço</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell>
                          <div>
                            <div className="font-medium">Maria Silva</div>
                            <div className="text-sm text-gray-500">Família Silva</div>
                          </div>
                        </TableCell>
                        <TableCell>CAPS - Atendimento Psicológico</TableCell>
                        <TableCell>20/09/2025</TableCell>
                        <TableCell>
                          <Badge className="bg-blue-100 text-blue-800">Em Andamento</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="outline">
                              <Edit className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>
                          <div>
                            <div className="font-medium">João Santos</div>
                            <div className="text-sm text-gray-500">Caso individual</div>
                          </div>
                        </TableCell>
                        <TableCell>CREAS - Acompanhamento Social</TableCell>
                        <TableCell>18/09/2025</TableCell>
                        <TableCell>
                          <Badge className="bg-yellow-100 text-yellow-800">Pendente</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="outline">
                              <Edit className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}

          {activeSection === 'demanda' && (
            <Card>
              <CardContent className="p-4">
                <AtendidosComunidadeSection
                  userId={String(userId || "")}
                  userRole="coordenador_psico"
                />
              </CardContent>
            </Card>
          )}

          {activeSection === 'alunos' && (
            <AlunosVinculoSection alunos={alunosLista} loading={loadingAlunosTurmas} />
          )}

  

          {activeSection === 'relatorios' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-500" />
                  Relatórios Gerenciais
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RelatoriosPanel vertente="psico" />
              </CardContent>
            </Card>
          )}

          {activeSection === 'acompanhamentos' && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-blue-500" />
                    Acompanhamentos Pedagógicos
                  </CardTitle>
                  <p className="text-sm text-gray-500">Observações registradas pelos professores sobre os alunos.</p>
                </CardHeader>
                <CardContent>
                  {todosAcompanhamentos.length === 0 ? (
                    <p className="text-gray-500 text-center py-10">Nenhum acompanhamento registrado ainda.</p>
                  ) : (
                    <div className="space-y-3">
                      {todosAcompanhamentos.map((ac: any) => {
                        const dateStr = ac.data;
                        return (
                          <div key={ac.id} className="border rounded-lg p-4">
                            <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
                              <span className="font-medium text-sm">{ac.titulo || 'Acompanhamento'}</span>
                              <div className="flex gap-2">
                                {ac.tipoObservacao && (
                                  <Badge variant="outline" className="text-xs capitalize">{ac.tipoObservacao}</Badge>
                                )}
                                {dateStr && (
                                  <Badge variant="secondary" className="text-xs">
                                    {new Date(dateStr + (dateStr.includes('T') ? '' : 'T12:00:00')).toLocaleDateString('pt-BR')}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            {ac.alunoCpf && (
                              <p className="text-xs text-blue-600 mb-1">Aluno CPF: {ac.alunoCpf}</p>
                            )}
                            <p className="text-sm text-gray-700 whitespace-pre-wrap">{ac.observacoes}</p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {activeSection === 'intervencoes' && (
            <Card>
              <CardContent className="p-4">
              <div className="space-y-4">
              <div className="flex gap-2 border-b pb-2">
                <button
                  onClick={() => setIntervencaoSubTab("lista")}
                  className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${intervencaoSubTab === "lista" ? "bg-purple-100 text-purple-700 border-b-2 border-purple-600" : "text-gray-500 hover:text-gray-700"}`}
                >
                  Atividades Realizadas
                </button>
                <button
                  onClick={() => setIntervencaoSubTab("registrar")}
                  className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${intervencaoSubTab === "registrar" ? "bg-purple-100 text-purple-700 border-b-2 border-purple-600" : "text-gray-500 hover:text-gray-700"}`}
                >
                  Registrar Nova
                </button>
              </div>

              {intervencaoSubTab === "registrar" && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 space-y-3">
                  <h4 className="font-semibold text-purple-800">
                    {editIntervencaoId ? "Editar Atividade" : "Registrar Atividade"}
                  </h4>
                  <div className="mb-3">
                    <label className="text-sm font-medium mb-1 block">Programa</label>
                    <div className="flex gap-2 flex-wrap">
                      <Button
                        size="sm"
                        variant={intervencaoForm.vertente === "pec" ? "default" : "outline"}
                        onClick={() => setIntervencaoForm({ ...intervencaoForm, vertente: "pec" })}
                        className={intervencaoForm.vertente === "pec" ? "bg-yellow-500 hover:bg-yellow-600" : ""}
                      >
                        PEC
                      </Button>
                      <Button
                        size="sm"
                        variant={intervencaoForm.vertente === "inclusao" ? "default" : "outline"}
                        onClick={() => setIntervencaoForm({ ...intervencaoForm, vertente: "inclusao" })}
                        className={intervencaoForm.vertente === "inclusao" ? "bg-green-600 hover:bg-green-700" : ""}
                      >
                        Inclusão Produtiva
                      </Button>
                      <Button
                        size="sm"
                        variant={intervencaoForm.vertente === "psicossocial" ? "default" : "outline"}
                        onClick={() => setIntervencaoForm({ ...intervencaoForm, vertente: "psicossocial" })}
                        className={intervencaoForm.vertente === "psicossocial" ? "bg-purple-600 hover:bg-purple-700" : ""}
                      >
                        Psicossocial
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium mb-1 block">Título</label>
                      <Input value={intervencaoForm.titulo} onChange={(e) => setIntervencaoForm({ ...intervencaoForm, titulo: e.target.value })} placeholder="Ex: Roda de conversa sobre ansiedade" />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Tipo</label>
                      <Select value={intervencaoForm.tipo} onValueChange={(v) => setIntervencaoForm({ ...intervencaoForm, tipo: v })}>
                        <SelectTrigger><SelectValue placeholder="Selecione o tipo" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="roda_de_conversa">Roda de Conversa</SelectItem>
                          <SelectItem value="atendimento_grupo">Atendimento em Grupo</SelectItem>
                          <SelectItem value="acao_socioemocional">Ação ou intervenção socioemocional</SelectItem>
                          <SelectItem value="oficina">Oficina</SelectItem>
                          <SelectItem value="palestra">Palestra</SelectItem>
                          <SelectItem value="reuniao">Reunião</SelectItem>
                          <SelectItem value="visita_domiciliar">Visita Domiciliar</SelectItem>
                          <SelectItem value="encaminhamento">Encaminhamento</SelectItem>
                          <SelectItem value="outro">Outro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {(intervencaoForm.vertente === "pec" || intervencaoForm.vertente === "inclusao") && (
                      <div>
                        <label className="text-sm font-medium mb-1 block">Turma ({intervencaoForm.vertente === "pec" ? "PEC" : "Inclusão"})</label>
                        <Select
                          value={intervAtivTurmaId}
                          onValueChange={async (v) => {
                            setIntervAtivTurmaId(v);
                            setIntervencaoForm({ ...intervencaoForm, data: "" });
                            setIntervAtivChamada({ loaded: false, exists: false, presencas: [] });
                            await carregarParticipantesIntervTurma(v);
                          }}
                        >
                          <SelectTrigger><SelectValue placeholder="Selecione a turma" /></SelectTrigger>
                          <SelectContent>
                            {(intervAtivTurmas as any[]).map((t: any) => (
                              <SelectItem key={String(t.id)} value={String(t.id)}>
                                {t.nome || `Turma ${t.id}`}
                              </SelectItem>
                            ))}
                            {(intervAtivTurmas as any[]).length === 0 && (
                              <SelectItem value="__none" disabled>Nenhuma turma disponível</SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    <div>
                      <label className="text-sm font-medium mb-1 block">Data da Aula</label>
                      {(intervencaoForm.vertente === "pec" || intervencaoForm.vertente === "inclusao") ? (
                        <Select
                          value={intervencaoForm.data}
                          onValueChange={(v) => setIntervencaoForm({ ...intervencaoForm, data: v })}
                          disabled={!intervAtivTurmaId}
                        >
                          <SelectTrigger><SelectValue placeholder="Selecione a data" /></SelectTrigger>
                          <SelectContent>
                            {intervAtivDiasAulaReal.map((d) => (
                              <SelectItem key={d.date} value={d.date}>
                                {d.label} ({d.dayOfWeek})
                              </SelectItem>
                            ))}
                            {intervAtivDiasAulaReal.length === 0 && (
                              <SelectItem value="__none" disabled>Nenhuma data disponível</SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input type="date" value={intervencaoForm.data} onChange={(e) => setIntervencaoForm({ ...intervencaoForm, data: e.target.value })} />
                      )}
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Participantes</label>
                      <Input type="number" min={0} value={intervencaoForm.participantes_presentes} onChange={(e) => setIntervencaoForm({ ...intervencaoForm, participantes_presentes: Number(e.target.value) || 0 })} />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Horário Início</label>
                      <Input type="time" value={intervencaoForm.horario_inicio || ""} onChange={(e) => setIntervencaoForm({ ...intervencaoForm, horario_inicio: e.target.value })} />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Horário Fim</label>
                      <Input type="time" value={intervencaoForm.horario_fim || ""} onChange={(e) => setIntervencaoForm({ ...intervencaoForm, horario_fim: e.target.value })} />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Descrição</label>
                    <textarea
                      className="w-full border rounded-lg p-2 text-sm min-h-[80px]"
                      value={intervencaoForm.descricao}
                      onChange={(e) => setIntervencaoForm({ ...intervencaoForm, descricao: e.target.value })}
                      placeholder="Descreva a atividade realizada, objetivos, metodologia..."
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Observação</label>
                    <textarea
                      className="w-full border rounded-lg p-2 text-sm min-h-[60px]"
                      value={intervencaoForm.observacoes}
                      onChange={(e) => setIntervencaoForm({ ...intervencaoForm, observacoes: e.target.value })}
                      placeholder="Observações adicionais sobre a atividade..."
                    />
                  </div>
                  {intervAtivParticipantes.length > 0 && (
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-sm font-medium">Participantes ({intervAtivParticipantes.filter(p => p.selecionado).length}/{intervAtivParticipantes.length})</label>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => setIntervAtivParticipantes(intervAtivParticipantes.map(p => ({ ...p, selecionado: true })))}>
                            Todos
                          </Button>
                          <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => setIntervAtivParticipantes(intervAtivParticipantes.map(p => ({ ...p, selecionado: false })))}>
                            Nenhum
                          </Button>
                        </div>
                      </div>
                      <div className="max-h-40 overflow-y-auto border rounded-lg bg-white">
                        {intervAtivParticipantes.map((p, idx) => (
                          <label key={p.id || idx} className="flex items-center gap-2 px-3 py-1.5 border-b last:border-b-0 hover:bg-gray-50 cursor-pointer text-sm">
                            <input
                              type="checkbox"
                              checked={p.selecionado}
                              onChange={() => {
                                const updated = [...intervAtivParticipantes];
                                updated[idx] = { ...updated[idx], selecionado: !updated[idx].selecionado };
                                setIntervAtivParticipantes(updated);
                              }}
                              className="rounded"
                            />
                            {p.nome}
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                  {intervAtivTurmaId && intervencaoForm.data && intervAtivChamada.loaded && (
                    <div className="border border-purple-200 rounded-lg p-3 bg-white">
                      <h5 className="font-semibold text-purple-800 mb-2 flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        Chamada do Dia
                      </h5>
                      {intervAtivChamada.exists ? (
                        <div>
                          <p className="text-xs text-green-700 mb-2">Chamada encontrada! Os participantes presentes foram adicionados automaticamente.</p>
                          <div className="flex gap-3 mb-2 text-sm">
                            <span className="text-green-600 font-medium">{intervAtivChamada.presencas.filter(p => p.presente).length} presentes</span>
                            <span className="text-red-600 font-medium">{intervAtivChamada.presencas.filter(p => !p.presente).length} ausentes</span>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-3">
                          <p className="text-sm text-amber-700">Nenhuma chamada registrada para esta data.</p>
                        </div>
                      )}
                    </div>
                  )}
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" onClick={() => { resetIntervencaoForm(); setIntervencaoSubTab("lista"); }}>Cancelar</Button>
                    <Button
                      disabled={
                        (createIntervencaoMutation.isPending || updateIntervencaoMutation.isPending)
                        || !intervencaoForm.titulo || !intervencaoForm.data
                      }
                      onClick={() => {
                        const payload = buildIntervencaoPayload();
                        if (editIntervencaoId) {
                          updateIntervencaoMutation.mutate({ id: editIntervencaoId, ...payload });
                        } else {
                          createIntervencaoMutation.mutate(payload);
                        }
                      }}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      {createIntervencaoMutation.isPending || updateIntervencaoMutation.isPending
                        ? 'Salvando...'
                        : editIntervencaoId ? 'Salvar alterações' : 'Salvar Intervenção'}
                    </Button>
                  </div>
                </div>
              )}

              {intervencaoSubTab === "lista" && (
                <div className="space-y-3">
                  <div className="flex gap-3 flex-wrap">
                    <div>
                      <label className="text-xs font-medium text-gray-500 block mb-1">Ano</label>
                      <Select value={String(intervencaoFiltroAno)} onValueChange={(v) => setIntervencaoFiltroAno(Number(v))}>
                        <SelectTrigger className="w-[90px]"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {[2024, 2025, 2026, 2027].map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 block mb-1">Mês</label>
                      <Select value={String(intervencaoFiltroMes)} onValueChange={(v) => setIntervencaoFiltroMes(Number(v))}>
                        <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">Todos</SelectItem>
                          {['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'].map((m, i) => (
                            <SelectItem key={i+1} value={String(i+1)}>{m}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  {todasIntervencoes.length === 0 ? (
                    <div className="text-center py-8 text-gray-400 border rounded-lg">
                      Nenhuma atividade registrada ainda
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {(todasIntervencoes as any[]).map((iv: any) => {
                        const tipoLabel: Record<string, string> = { roda_de_conversa: "Roda de Conversa", atendimento_grupo: "Atendimento em Grupo", oficina: "Ação ou intervenção socioemocional", acao_socioemocional: "Ação ou intervenção socioemocional", palestra: "Palestra", visita_domiciliar: "Visita Domiciliar", encaminhamento: "Encaminhamento", outro: "Outro", reforco: "Reforço", recreativa: "Recreativa" };
                        const isExpanded = intervencaoExpandida === String(iv.id);
                        const obs = iv.observacoes || iv.observacao || "";
                        const {
                          turmaNome: displayTurma,
                          participantesNomes: displayParticipantes,
                          participantesEsperados: esperadosObs,
                          observacoesLimpa: obsClean,
                        } = parseIntervencaoObservacoes(obs);
                        const chamadaRef = findChamadaParaIntervencao(
                          intervChamadasLista,
                          iv,
                          displayTurma
                        );
                        const { presentes, esperados } = getIntervencaoParticipantesResumo(
                          iv,
                          displayParticipantes,
                          esperadosObs,
                          chamadaRef
                        );
                        const vertLabel = iv.vertente === "pec" ? "PEC" : iv.vertente === "inclusao" ? "Inclusão Produtiva" : iv.vertente === "psicossocial" ? "Psicossocial" : iv.vertente === "todos" ? "Todas" : iv.vertente || "";
                        return (
                          <div key={iv.id} className="border rounded-lg p-3 hover:bg-gray-50 cursor-pointer" onClick={() => setIntervencaoExpandida(isExpanded ? null : String(iv.id))}>
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <h4 className="font-medium text-sm">{iv.titulo}</h4>
                                <div className="flex flex-wrap gap-2 mt-1 text-xs text-gray-500">
                                  <Badge variant="outline" className="text-xs">{tipoLabel[iv.tipo] || iv.tipo}</Badge>
                                  <span>{iv.data ? new Date(iv.data).toLocaleDateString("pt-BR", { timeZone: "UTC" }) : "-"}</span>
                                  {iv.horarioInicio && <span>{iv.horarioInicio} - {iv.horarioFim}</span>}
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                <Badge variant="outline" className="border-green-500 text-green-600 text-xs">registrada</Badge>
                                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                              </div>
                            </div>
                            {isExpanded && (
                              <div className="mt-3 pt-3 border-t space-y-2 text-sm text-gray-900" onClick={(e) => e.stopPropagation()}>
                                {displayTurma && (
                                  <div className="flex gap-2"><span className="font-medium text-gray-500 min-w-[100px]">Turma:</span><span>{displayTurma}</span></div>
                                )}
                                {vertLabel && (
                                  <div className="flex gap-2"><span className="font-medium text-gray-500 min-w-[100px]">Vertente:</span><span>{vertLabel}</span></div>
                                )}
                                {iv.monitor_nome && (
                                  <div className="flex gap-2"><span className="font-medium text-gray-500 min-w-[100px]">Monitor:</span><span className="text-purple-600">{iv.monitor_nome}</span></div>
                                )}
                                {iv.descricao && (
                                  <div><span className="font-medium text-gray-500 block">Descrição:</span><p className="text-gray-900 whitespace-pre-wrap mt-1">{iv.descricao}</p></div>
                                )}
                                <div className="flex gap-2">
                                  <span className="font-medium text-gray-500 min-w-[100px]">Participantes:</span>
                                  <span>{formatIntervencaoParticipantesResumo(presentes, esperados)}</span>
                                </div>
                                {obsClean && (
                                  <div><span className="font-medium text-gray-500 block">Observações:</span><p className="text-gray-700 italic mt-1">{obsClean}</p></div>
                                )}
                                {canEditIntervencaoPsico(iv, userId) && (
                                  <div className="pt-2">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-8 text-xs border-purple-300 text-purple-700 hover:bg-purple-50"
                                      onClick={() => startEditIntervencao(iv)}
                                    >
                                      <Pencil className="w-3 h-3 mr-1" /> Editar
                                    </Button>
                                  </div>
                                )}
                                {displayParticipantes.length > 0 && (() => {
                                  const MAX_VISIBLE = 3;
                                  const isOpen = expandedIVPart.has(String(iv.id));
                                  const visibleList = isOpen ? displayParticipantes : displayParticipantes.slice(0, MAX_VISIBLE);
                                  const hasMore = displayParticipantes.length > MAX_VISIBLE;
                                  return (
                                    <div>
                                      <button type="button" onClick={() => setExpandedIVPart(prev => { const next = new Set(prev); if (next.has(String(iv.id))) next.delete(String(iv.id)); else next.add(String(iv.id)); return next; })} className="font-medium text-gray-500 flex items-center gap-1 hover:text-gray-700">
                                        Alunos presentes ({displayParticipantes.length})
                                        {hasMore && <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isOpen ? "rotate-180" : ""}`} />}
                                      </button>
                                      <div className="mt-1 space-y-0.5">
                                        {visibleList.map((nome: string, i: number) => (
                                          <div key={i} className="text-xs text-gray-900 pl-2 border-l-2 border-gray-200">{nome}</div>
                                        ))}
                                        {hasMore && !isOpen && (
                                          <button type="button" onClick={() => setExpandedIVPart(prev => { const next = new Set(prev); next.add(String(iv.id)); return next; })} className="text-xs text-purple-600 hover:text-purple-700 pl-2">
                                            +{displayParticipantes.length - MAX_VISIBLE} mais...
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })()}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
              </div>
              </CardContent>
            </Card>
          )}

          {activeSection === 'eventos-grito' && (
            <Card>
              <CardContent className="p-4">
                <EventosGritoSection defaultTab="eventos" showStats={false} />
              </CardContent>
            </Card>
          )}


          {activeSection === 'configuracoes' && (
            <Card>
              <CardHeader>
                <CardTitle>Meu Perfil e Configurações</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <PushNotificationSettings variant="panel" />
                  <LgpdMeusDadosSettingsPanel />
                  <div className="border rounded-lg p-4">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Informações Pessoais
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="nome">Nome Completo</Label>
                        <Input 
                          id="nome" 
                          value={perfilForm.nome} 
                          onChange={(e) => setPerfilForm({...perfilForm, nome: e.target.value})}
                          data-testid="input-nome-perfil"
                        />
                      </div>
                      <div>
                        <Label htmlFor="email">Email</Label>
                        <Input 
                          id="email" 
                          value={perfilForm.email} 
                          onChange={(e) => setPerfilForm({...perfilForm, email: e.target.value})}
                          data-testid="input-email-perfil"
                        />
                      </div>
                      <div>
                        <Label htmlFor="telefone">Telefone</Label>
                        <Input 
                          id="telefone" 
                          value={perfilForm.telefone} 
                          onChange={(e) => setPerfilForm({...perfilForm, telefone: e.target.value})}
                          data-testid="input-telefone-perfil"
                        />
                      </div>
                    </div>
                    <Button 
                      className="mt-4 bg-blue-500 hover:bg-blue-600"
                      onClick={handleSavePerfil}
                      disabled={updatePerfilMutation.isPending}
                      data-testid="button-salvar-perfil"
                    >
                      {updatePerfilMutation.isPending ? 'Salvando...' : 'Salvar Alterações'}
                    </Button>
                  </div>
                  
                  <div className="border rounded-lg p-4">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <Lock className="w-4 h-4" />
                      Segurança
                    </h3>
                    <div className="space-y-4">
                      <p className="text-sm text-gray-600">
                        Altere sua senha de acesso periodicamente para manter sua conta segura.
                      </p>
                      <Button
                        onClick={() => setShowAlterarSenhaModal(true)}
                        variant="outline"
                        data-testid="button-alterar-senha"
                      >
                        <Lock className="w-4 h-4 mr-2" />
                        Alterar Senha
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeSection === 'favela3d' && canDelete && (
            <Card>
              <CardContent className="pt-6">
                <Favela3DSection
                  userId={String(coordenadorId || "")}
                  userRole="coordenador_psico"
                  initialTab={favela3dSubTab}
                />
              </CardContent>
            </Card>
          )}

          {activeSection === 'mapeamento' && canDelete && (
            <Card>
              <CardContent className="pt-6">
                {mapeamentoSubTab === 'mapeamento' ? (
                  <div className="space-y-6">
                    <div className="flex items-center gap-2">
                      <Layers className="w-5 h-5 text-teal-600" />
                      <h2 className="text-lg font-semibold text-gray-800">Mapeamento e moradas gerais</h2>
                    </div>

                    {/* Total Geral */}
                    <div className="bg-teal-50 border border-teal-200 rounded-lg p-5 text-center">
                      <p className="text-sm text-teal-700 font-medium">Total Geral de Casas Mapeadas</p>
                      <p className="text-5xl font-bold text-teal-700 mt-1">{(mapeamentosData as any)?.total ?? 0}</p>
                    </div>

                    {/* Formulário de registro */}
                    <div className="border rounded-lg p-5 space-y-4">
                      <p className="font-semibold text-gray-700">{mapEditId ? "Editar Mapeamento" : "Registrar Novo Mapeamento"}</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <Label>Data do mapeamento</Label>
                          <Input type="date" value={mapData} onChange={e => setMapData(e.target.value)} />
                        </div>
                        <div className="space-y-1">
                          <Label>Casas mapeadas</Label>
                          <Input type="number" min={1} placeholder="0" value={mapCasas} onChange={e => setMapCasas(e.target.value)} />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label>Observação (opcional)</Label>
                        <Textarea rows={3} placeholder="Rua, beco, área mapeada..." value={mapObs} onChange={e => setMapObs(e.target.value)} />
                      </div>
                      <Button
                        className="w-full sm:w-auto"
                        disabled={!mapCasas || !mapData || criarMapeamentoCoordMutation.isPending || atualizarMapeamentoCoordMutation.isPending}
                        onClick={() => {
                          if (!mapCasas || !mapData) return;
                          const payload = {
                            monitorId: Number(mapEditMonitorId || userId),
                            data: mapData,
                            casasMapeadas: Number(mapCasas),
                            observacao: mapObs || undefined,
                          };
                          if (mapEditId) {
                            atualizarMapeamentoCoordMutation.mutate({ ...payload, id: mapEditId });
                          } else {
                            if (!userId) return;
                            criarMapeamentoCoordMutation.mutate(payload);
                          }
                        }}
                      >
                        {(criarMapeamentoCoordMutation.isPending || atualizarMapeamentoCoordMutation.isPending)
                          ? <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          : <Plus className="w-4 h-4 mr-2" />}
                        {mapEditId ? "Salvar alterações" : "Registrar Mapeamento"}
                      </Button>
                      {mapEditId && (
                        <Button
                          variant="outline"
                          onClick={() => {
                            setMapEditId(null);
                            setMapEditMonitorId(null);
                            setMapCasas("");
                            setMapObs("");
                            setMapData(new Date().toISOString().slice(0, 10));
                          }}
                        >
                          Cancelar edição
                        </Button>
                      )}
                    </div>

                    {/* Lista agrupada por monitor */}
                    <div>
                      <p className="font-semibold text-gray-700 mb-3">Mapeamentos por Responsável</p>
                      {Object.keys((mapeamentosData as any)?.porMonitor ?? {}).length === 0 ? (
                        <p className="text-gray-400 text-sm text-center py-6">Nenhum mapeamento registrado ainda.</p>
                      ) : (
                        <div className="space-y-4">
                          {Object.entries((mapeamentosData as any)?.porMonitor ?? {}).map(([monId, info]: [string, any]) => (
                            <div key={monId} className="border rounded-lg p-4">
                              <div className="flex items-center justify-between mb-3">
                                <p className="font-semibold text-gray-800">{info.nome}</p>
                                <span className="bg-teal-100 text-teal-700 text-sm font-bold px-3 py-1 rounded-full">{info.total} casas</span>
                              </div>
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Data</TableHead>
                                    <TableHead>Casas</TableHead>
                                    <TableHead>Observação</TableHead>
                                    <TableHead className="text-right">Ações</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {info.registros.map((r: any) => (
                                    <TableRow key={r.id}>
                                      <TableCell>{new Date((r.data?.split('T')[0] ?? '') + 'T12:00:00').toLocaleDateString('pt-BR')}</TableCell>
                                      <TableCell className="font-semibold">{r.casas_mapeadas}</TableCell>
                                      <TableCell className="text-gray-500">{r.observacao || '—'}</TableCell>
                                      <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-1">
                                          <Button
                                            size="icon"
                                            variant="ghost"
                                            className="h-7 w-7"
                                            onClick={() => {
                                              setMapEditId(Number(r.id));
                                              setMapEditMonitorId(Number(r.monitor_id));
                                              setMapData(String(r.data || "").split("T")[0]);
                                              setMapCasas(String(r.casas_mapeadas ?? ""));
                                              setMapObs(r.observacao || "");
                                            }}
                                          >
                                            <Pencil className="w-4 h-4" />
                                          </Button>
                                          <Button
                                            size="icon"
                                            variant="ghost"
                                            className="h-7 w-7 text-red-600 hover:text-red-700"
                                            onClick={() => setMapDeleteId(Number(r.id))}
                                            disabled={excluirMapeamentoCoordMutation.isPending || !canDelete}
                                            style={{ display: canDelete ? undefined : "none" }}
                                          >
                                            <Trash2 className="w-4 h-4" />
                                          </Button>
                                        </div>
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                              <AlertDialog open={mapDeleteId !== null} onOpenChange={(open) => { if (!open) setMapDeleteId(null); }}>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Apagar mapeamento</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Deseja realmente apagar este registro de mapeamento?
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel disabled={excluirMapeamentoCoordMutation.isPending}>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction
                                      className="bg-red-600 hover:bg-red-700"
                                      disabled={excluirMapeamentoCoordMutation.isPending}
                                      onClick={() => {
                                        if (!mapDeleteId) return;
                                        excluirMapeamentoCoordMutation.mutate(mapDeleteId);
                                        setMapDeleteId(null);
                                      }}
                                    >
                                      {excluirMapeamentoCoordMutation.isPending ? "Apagando..." : "Apagar"}
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="flex items-center gap-2">
                      <Layers className="w-5 h-5 text-teal-600" />
                      <h2 className="text-lg font-semibold text-gray-800">Moradas gerais</h2>
                    </div>
                    <div className="border rounded-lg p-4 space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-center">
                          <p className="text-2xl font-bold text-purple-700">{moradasResumo.total}</p>
                          <p className="text-xs text-purple-700">Reformas Cadastradas</p>
                        </div>
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                          <p className="text-2xl font-bold text-blue-700">{moradasResumo.emVisita}</p>
                          <p className="text-xs text-blue-700">Em Visita Técnica</p>
                        </div>
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-center">
                          <p className="text-2xl font-bold text-amber-700">{moradasResumo.emAndamento}</p>
                          <p className="text-xs text-amber-700">Em Andamento</p>
                        </div>
                        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-center">
                          <p className="text-2xl font-bold text-emerald-700">{moradasResumo.finalizadas}</p>
                          <p className="text-xs text-emerald-700">Finalizadas</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <p className="text-sm text-gray-600">Cadastre e acompanhe as reformas das moradas gerais.</p>
                        <Button
                          onClick={() => setShowMoradaReformaForm(prev => !prev)}
                          className="bg-purple-600 hover:bg-purple-700"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Cadastrar reforma
                        </Button>
                      </div>

                      {showMoradaReformaForm && (
                        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 space-y-3">
                          <h4 className="font-semibold text-purple-800">{moradaEditId ? "Editar cadastro de reforma" : "Novo cadastro de reforma"}</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <label className="text-sm font-medium mb-1 block">Monitor responsável</label>
                              <Select
                                value={moradaMonitorId ? String(moradaMonitorId) : ""}
                                onValueChange={(v) => setMoradaMonitorId(Number(v))}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione o monitor" />
                                </SelectTrigger>
                                <SelectContent>
                                  {moradaMonitoresOpcoes.map((m) => (
                                    <SelectItem key={m.id} value={String(m.id)}>{m.nome}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="relative">
                              <label className="text-sm font-medium mb-1 block">Participante</label>
                              <Input
                                value={moradaPartOpen ? moradaPartBusca : moradaForm.participanteNome}
                                onChange={(e) => {
                                  setMoradaPartBusca(e.target.value);
                                  setMoradaPartOpen(true);
                                  setMoradaForm({
                                    ...moradaForm,
                                    participanteNome: e.target.value,
                                    participanteCpf: "",
                                    participanteOrigem: "",
                                  });
                                }}
                                onFocus={() => { setMoradaPartOpen(true); setMoradaPartBusca(moradaForm.participanteNome || ""); }}
                                onBlur={() => setTimeout(() => setMoradaPartOpen(false), 200)}
                                placeholder="Buscar por nome (PEC/Inclusão/Comunidade)"
                              />
                              {moradaPartOpen && (() => {
                                const todosParticipantes = (todosAtendidosParaAtendimento as any[] || []);
                                const filtrados = todosParticipantes.filter((p: any) => {
                                  if (moradaPartFiltroVertente !== "todos" && p.origem !== moradaPartFiltroVertente) return false;
                                  if (!moradaPartBusca.trim()) return true;
                                  return (p.label || p.nome || "").toLowerCase().includes(moradaPartBusca.toLowerCase()) ||
                                    (p.cpf || "").includes(moradaPartBusca);
                                });
                                return (
                                  <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-56 overflow-y-auto">
                                    <div className="flex items-center gap-1 p-2 border-b border-gray-100 bg-gray-50 sticky top-0">
                                      {(["todos", "pec", "inclusao", "comunidade"] as const).map((f) => (
                                        <button key={f} type="button"
                                          className={`text-xs px-2 py-0.5 rounded border transition-colors ${moradaPartFiltroVertente === f ? "bg-purple-600 text-white border-purple-600" : "bg-white text-gray-600 border-gray-300 hover:bg-gray-100"}`}
                                          onMouseDown={(e) => { e.preventDefault(); setMoradaPartFiltroVertente(f); }}>
                                          {f === "todos" ? "Todos" : f === "pec" ? "PEC" : f === "inclusao" ? "Inclusão" : "Comunidade"}
                                        </button>
                                      ))}
                                    </div>
                                    {filtrados.length === 0 ? (
                                      <div className="p-3 text-xs text-gray-400 text-center">Nenhum resultado.</div>
                                    ) : filtrados.slice(0, 20).map((p: any, i: number) => (
                                      <button
                                        key={p.id || i}
                                        type="button"
                                        className="w-full text-left px-3 py-2 text-sm hover:bg-purple-50 flex items-center gap-2 border-b border-gray-50 last:border-0"
                                        onClick={() => {
                                          const nome = p.nome || p.label || "";
                                          const cpf = p.cpf || "";
                                          setMoradaForm({
                                            ...moradaForm,
                                            participanteNome: nome,
                                            participanteCpf: cpf,
                                            participanteOrigem: p.origem || "",
                                          });
                                          setMoradaPartBusca(nome);
                                          setMoradaPartOpen(false);
                                        }}
                                      >
                                        <span className="font-medium text-gray-900">{p.nome || p.label}</span>
                                        {p.cpf && <span className="text-xs text-gray-400">{formatCPF(p.cpf)}</span>}
                                        <span className="text-xs text-gray-400 ml-auto">{p.origem === 'inclusao' ? 'Inclusão' : p.origem === 'pec' ? 'PEC' : 'Comunidade'}</span>
                                      </button>
                                    ))}
                                  </div>
                                );
                              })()}
                            </div>

                            <div>
                              <label className="text-sm font-medium mb-1 block">Semana</label>
                              <Select value={moradaForm.semana} onValueChange={(v) => setMoradaForm({ ...moradaForm, semana: v })}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="1">1° Semana</SelectItem>
                                  <SelectItem value="2">2° Semana</SelectItem>
                                  <SelectItem value="3">3° Semana</SelectItem>
                                  <SelectItem value="4">4° Semana</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div>
                              <label className="text-sm font-medium mb-1 block">Data</label>
                              <Input type="date" value={moradaForm.data} onChange={(e) => setMoradaForm({ ...moradaForm, data: e.target.value })} />
                            </div>

                            <div>
                              <label className="text-sm font-medium mb-1 block">Status</label>
                              <Select value={moradaForm.status} onValueChange={(v) => setMoradaForm({ ...moradaForm, status: v })}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  {MORADA_STATUS_OPTIONS.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          <div>
                            <label className="text-sm font-medium mb-2 block">Cômodo (múltipla seleção)</label>
                            <div className="border rounded-lg bg-white max-h-40 overflow-y-auto">
                              {MORADA_COMODOS_OPTIONS.map((item) => (
                                <label key={item} className="flex items-center gap-2 px-3 py-2 border-b border-gray-100 last:border-0 text-sm">
                                  <input
                                    type="checkbox"
                                    checked={moradaComodos.includes(item)}
                                    onChange={() => {
                                      setMoradaComodos(prev => prev.includes(item) ? prev.filter(c => c !== item) : [...prev, item]);
                                    }}
                                  />
                                  <span>{item}</span>
                                </label>
                              ))}
                            </div>
                            {moradaComodos.includes("Outros") && (
                              <Input
                                className="mt-2"
                                placeholder="Informe outro cômodo"
                                value={moradaForm.outrosComodo}
                                onChange={(e) => setMoradaForm({ ...moradaForm, outrosComodo: e.target.value })}
                              />
                            )}
                          </div>

                          <div>
                            <label className="text-sm font-medium mb-1 block">Observações</label>
                            <Textarea
                              rows={3}
                              placeholder="Descreva detalhes da reforma..."
                              value={moradaForm.observacoes}
                              onChange={(e) => setMoradaForm({ ...moradaForm, observacoes: e.target.value })}
                            />
                          </div>

                          <div className="flex gap-2 justify-end">
                            <Button variant="outline" onClick={() => {
                              setShowMoradaReformaForm(false);
                              setMoradaEditId(null);
                              setMoradaMonitorId(null);
                            }}>Cancelar</Button>
                            <Button
                              className="bg-purple-600 hover:bg-purple-700"
                              disabled={
                                !userId ||
                                !moradaMonitorId ||
                                !moradaForm.participanteNome ||
                                !moradaForm.data ||
                                moradaComodos.length === 0 ||
                                criarMoradaReformaMutation.isPending ||
                                atualizarMoradaReformaMutation.isPending
                              }
                              onClick={() => {
                                if (!moradaMonitorId) {
                                  toast({ title: "Monitor obrigatório", description: "Selecione o monitor responsável pela reforma.", variant: "destructive" });
                                  return;
                                }
                                const comodosSelecionados = moradaComodos.includes("Outros") && moradaForm.outrosComodo.trim()
                                  ? [...moradaComodos.filter(c => c !== "Outros"), `Outros: ${moradaForm.outrosComodo.trim()}`]
                                  : moradaComodos;
                                const payload = {
                                  monitorId: moradaMonitorId,
                                  participanteNome: moradaForm.participanteNome,
                                  participanteCpf: moradaForm.participanteCpf || undefined,
                                  participanteOrigem: moradaForm.participanteOrigem || undefined,
                                  semana: Number(moradaForm.semana),
                                  data: moradaForm.data,
                                  status: moradaForm.status,
                                  comodos: comodosSelecionados,
                                  observacoes: moradaForm.observacoes || undefined,
                                };
                                if (moradaEditId) {
                                  atualizarMoradaReformaMutation.mutate({ ...payload, id: moradaEditId });
                                } else {
                                  criarMoradaReformaMutation.mutate(payload);
                                }
                              }}
                            >
                              {(criarMoradaReformaMutation.isPending || atualizarMoradaReformaMutation.isPending)
                                ? "Salvando..."
                                : moradaEditId ? "Salvar alterações" : "Salvar cadastro"}
                            </Button>
                          </div>
                        </div>
                      )}

                      <div className="space-y-2">
                        <p className="text-sm font-semibold text-gray-700">Reformas cadastradas</p>
                        {moradasReformasList.length === 0 ? (
                          <p className="text-sm text-gray-400 border rounded-lg p-4 text-center">Nenhuma reforma cadastrada ainda.</p>
                        ) : (
                          <div className="space-y-2">
                            {moradasReformasList.map((item: any) => (
                              <div key={item.id} className="border rounded-lg p-3 bg-white">
                                <div className="flex items-center justify-between gap-2 flex-wrap">
                                  <p className="font-medium text-sm text-gray-800">{item.participanteNome || item.participante_nome}</p>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">{item.semana}° Semana</span>
                                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => iniciarEdicaoMorada(item)}>
                                      <Pencil className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="h-7 w-7 text-red-600 hover:text-red-700"
                                      disabled={excluirMoradaReformaMutation.isPending}
                                      onClick={() => {
                                        setMoradaDeleteId(Number(item.id));
                                      }}
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                  {item.monitor_nome ? `${item.monitor_nome} • ` : ""}
                                  {new Date(item.data + "T12:00:00").toLocaleDateString("pt-BR")} • {getMoradaStatusLabel(item.status)}
                                </p>
                                <p className="text-xs text-gray-600 mt-1">Cômodos: {(item.comodos || []).join(", ")}</p>
                                {item.observacoes && <p className="text-xs text-gray-700 mt-1">{item.observacoes}</p>}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <AlertDialog open={moradaDeleteId !== null} onOpenChange={(open) => { if (!open) setMoradaDeleteId(null); }}>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Apagar registro de morada</AlertDialogTitle>
                            <AlertDialogDescription>
                              Deseja realmente apagar este registro? Esta ação não pode ser desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel disabled={excluirMoradaReformaMutation.isPending}>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-red-600 hover:bg-red-700"
                              disabled={excluirMoradaReformaMutation.isPending}
                              onClick={() => {
                                if (!moradaDeleteId) return;
                                excluirMoradaReformaMutation.mutate(moradaDeleteId);
                                setMoradaDeleteId(null);
                              }}
                            >
                              {excluirMoradaReformaMutation.isPending ? "Apagando..." : "Apagar"}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Modal de Importação */}
      <Dialog open={showImportModal} onOpenChange={setShowImportModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Importar Dados Psicossociais</DialogTitle>
            <DialogDescription>
              Faça upload de um arquivo Excel (.xlsx, .xls) ou PDF (.pdf) com dados de famílias e atendimentos.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-purple-400 transition-colors">
              <input
                type="file"
                id="file-upload"
                accept=".xlsx,.xls,.pdf"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setImportFile(file);
                  }
                }}
                data-testid="input-file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <div className="flex flex-col items-center">
                  <Upload className="h-12 w-12 text-gray-400 mb-3" />
                  {importFile ? (
                    <div>
                      <p className="text-sm font-medium text-gray-900">{importFile.name}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {(importFile.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm text-gray-600 mb-1">
                        Clique para selecionar ou arraste o arquivo
                      </p>
                      <p className="text-xs text-gray-500">
                        Formatos aceitos: .xlsx, .xls, .pdf
                      </p>
                    </>
                  )}
                </div>
              </label>
            </div>

            {importFile && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <FileText className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-purple-900">Arquivo selecionado</p>
                    <p className="text-xs text-purple-700 mt-1">
                      Os dados serão importados para as tabelas de famílias e atendimentos.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="sm:justify-between">
            <Button
              variant="outline"
              onClick={() => {
                setShowImportModal(false);
                setImportFile(null);
              }}
              data-testid="button-cancel-import"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleImportFile}
              disabled={!importFile || isImporting}
              className="bg-purple-500 hover:bg-purple-600"
              data-testid="button-confirm-import"
            >
              {isImporting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Importando...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Importar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Cadastro de Família */}
      <Dialog open={showFamiliaModal} onOpenChange={(open) => {
        setShowFamiliaModal(open);
        if (!open) setBuscaAtendidoFamilia('');
      }}>
        <DialogContent className="sm:max-w-3xl max-h-[85vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>Cadastrar Nova Família</DialogTitle>
            <DialogDescription>
              Preencha os dados da família para cadastro no programa psicossocial.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 overflow-y-auto flex-1 px-4">
            <div className="space-y-2">
              <Label htmlFor="nome-responsavel">Nome do Responsável *</Label>
              <Input
                id="nome-responsavel"
                placeholder="Nome completo do responsável"
                value={familiaForm.nomeResponsavel}
                onChange={(e) => setFamiliaForm({ ...familiaForm, nomeResponsavel: e.target.value })}
                data-testid="input-nome-responsavel"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="numero-membros">Número de Membros</Label>
                <Input
                  id="numero-membros"
                  type="number"
                  min="1"
                  value={familiaForm.numeroMembros}
                  onChange={(e) => setFamiliaForm({ ...familiaForm, numeroMembros: parseInt(e.target.value) || 1 })}
                  data-testid="input-numero-membros"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone</Label>
                <Input
                  id="telefone"
                  placeholder="(00) 00000-0000"
                  value={familiaForm.telefone}
                  onChange={(e) => setFamiliaForm({ ...familiaForm, telefone: e.target.value })}
                  data-testid="input-telefone"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="endereco">Endereço</Label>
              <Input
                id="endereco"
                placeholder="Rua, número, bairro"
                value={familiaForm.endereco}
                onChange={(e) => setFamiliaForm({ ...familiaForm, endereco: e.target.value })}
                data-testid="input-endereco"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select 
                value={familiaForm.status} 
                onValueChange={(value: any) => setFamiliaForm({ ...familiaForm, status: value })}
              >
                <SelectTrigger id="status" data-testid="select-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="inativo">Inativo</SelectItem>
                  <SelectItem value="em_acompanhamento">Em Acompanhamento</SelectItem>
                  <SelectItem value="encerrado">Encerrado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Atendidos desta Família</Label>
              <Input
                placeholder="🔍 Buscar atendido por nome..."
                value={buscaAtendidoFamilia}
                onChange={(e) => setBuscaAtendidoFamilia(e.target.value)}
                className="mb-2"
                data-testid="input-busca-atendido-familia"
              />
              <div className="border rounded-md p-3 max-h-48 overflow-y-auto space-y-2">
                {participantesData && participantesData.length > 0 ? (
                  participantesData
                    .filter((p: any) => 
                      !buscaAtendidoFamilia || 
                      p.nome.toLowerCase().includes(buscaAtendidoFamilia.toLowerCase())
                    )
                    .map((participante: any) => (
                    <label 
                      key={participante.vinculo_id} 
                      className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded"
                    >
                      <input
                        type="checkbox"
                        checked={familiaForm.atendidosSelecionados.includes(participante.vinculo_id)}
                        onChange={(e) => {
                          const vinculoId = participante.vinculo_id;
                          if (e.target.checked) {
                            setFamiliaForm({
                              ...familiaForm,
                              atendidosSelecionados: [...familiaForm.atendidosSelecionados, vinculoId]
                            });
                          } else {
                            setFamiliaForm({
                              ...familiaForm,
                              atendidosSelecionados: familiaForm.atendidosSelecionados.filter(id => id !== vinculoId)
                            });
                          }
                        }}
                        className="rounded"
                        data-testid={`checkbox-atendido-${participante.vinculo_id}`}
                      />
                      <span className="flex-1">
                        {participante.nome}
                        <Badge className={`ml-2 ${participante.programa_origem === 'pec' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                          {participante.programa_origem === 'pec' ? 'PEC' : 'Inclusão'}
                        </Badge>
                      </span>
                    </label>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 text-center py-2">Nenhum atendido disponível</p>
                )}
                {participantesData && participantesData.length > 0 && 
                 participantesData.filter((p: any) => 
                   !buscaAtendidoFamilia || 
                   p.nome.toLowerCase().includes(buscaAtendidoFamilia.toLowerCase())
                 ).length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-2">Nenhum atendido encontrado com esse nome</p>
                )}
              </div>
              <p className="text-xs text-gray-500">
                {familiaForm.atendidosSelecionados.length} atendido(s) selecionado(s)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                placeholder="Informações adicionais sobre a família..."
                rows={3}
                value={familiaForm.observacoes}
                onChange={(e) => setFamiliaForm({ ...familiaForm, observacoes: e.target.value })}
                data-testid="textarea-observacoes"
              />
            </div>
          </div>

          <DialogFooter className="sm:justify-between flex-shrink-0 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowFamiliaModal(false);
                setBuscaAtendidoFamilia('');
                setFamiliaForm({
                  nomeResponsavel: '',
                  numeroMembros: 1,
                  telefone: '',
                  endereco: '',
                  status: 'ativo',
                  observacoes: '',
                  atendidosSelecionados: []
                });
              }}
              data-testid="button-cancel-familia"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSaveFamilia}
              disabled={createFamiliaMutation.isPending}
              className="bg-purple-500 hover:bg-purple-600"
              data-testid="button-save-familia"
            >
              {createFamiliaMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Salvando...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Cadastrar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Edição de Família */}
      <Dialog open={showEditFamiliaModal} onOpenChange={setShowEditFamiliaModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar Família</DialogTitle>
            <DialogDescription>
              Atualize os dados da família selecionada.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-nome-responsavel">Nome do Responsável *</Label>
              <Input
                id="edit-nome-responsavel"
                placeholder="Nome completo do responsável"
                value={familiaForm.nomeResponsavel}
                onChange={(e) => setFamiliaForm({ ...familiaForm, nomeResponsavel: e.target.value })}
                data-testid="input-edit-nome-responsavel"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-numero-membros">Número de Membros</Label>
                <Input
                  id="edit-numero-membros"
                  type="number"
                  min="1"
                  value={familiaForm.numeroMembros}
                  onChange={(e) => setFamiliaForm({ ...familiaForm, numeroMembros: parseInt(e.target.value) || 1 })}
                  data-testid="input-edit-numero-membros"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-telefone">Telefone</Label>
                <Input
                  id="edit-telefone"
                  placeholder="(00) 00000-0000"
                  value={familiaForm.telefone}
                  onChange={(e) => setFamiliaForm({ ...familiaForm, telefone: e.target.value })}
                  data-testid="input-edit-telefone"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-endereco">Endereço</Label>
              <Input
                id="edit-endereco"
                placeholder="Rua, número, bairro"
                value={familiaForm.endereco}
                onChange={(e) => setFamiliaForm({ ...familiaForm, endereco: e.target.value })}
                data-testid="input-edit-endereco"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-status">Status</Label>
              <Select 
                value={familiaForm.status} 
                onValueChange={(value: any) => setFamiliaForm({ ...familiaForm, status: value })}
              >
                <SelectTrigger id="edit-status" data-testid="select-edit-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="inativo">Inativo</SelectItem>
                  <SelectItem value="em_acompanhamento">Em Acompanhamento</SelectItem>
                  <SelectItem value="encerrado">Encerrado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-observacoes">Observações</Label>
              <Textarea
                id="edit-observacoes"
                placeholder="Informações adicionais sobre a família..."
                rows={3}
                value={familiaForm.observacoes}
                onChange={(e) => setFamiliaForm({ ...familiaForm, observacoes: e.target.value })}
                data-testid="textarea-edit-observacoes"
              />
            </div>
          </div>

          <DialogFooter className="sm:justify-between">
            <Button
              variant="outline"
              onClick={() => {
                setShowEditFamiliaModal(false);
                setSelectedFamilia(null);
                setFamiliaForm({
                  nomeResponsavel: '',
                  numeroMembros: 1,
                  telefone: '',
                  endereco: '',
                  status: 'ativo',
                  observacoes: ''
                });
              }}
              data-testid="button-cancel-edit-familia"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleUpdateFamilia}
              disabled={updateFamiliaMutation.isPending}
              className="bg-purple-500 hover:bg-purple-600"
              data-testid="button-update-familia"
            >
              {updateFamiliaMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Salvando...
                </>
              ) : (
                <>
                  <Edit className="w-4 h-4 mr-2" />
                  Atualizar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Visualização de Família */}
      <Dialog open={showViewFamiliaModal} onOpenChange={setShowViewFamiliaModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Detalhes da Família</DialogTitle>
            <DialogDescription>
              Informações completas da família selecionada.
            </DialogDescription>
          </DialogHeader>
          
          {selectedFamilia && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-gray-500">ID</Label>
                  <p className="font-medium">#{selectedFamilia.id}</p>
                </div>
                <div>
                  <Label className="text-sm text-gray-500">Status</Label>
                  <p className="font-medium">
                    {selectedFamilia.status === 'em_acompanhamento' ? 'Em Acompanhamento' :
                     selectedFamilia.status === 'ativo' ? 'Ativo' :
                     selectedFamilia.status === 'inativo' ? 'Inativo' :
                     'Encerrado'}
                  </p>
                </div>
              </div>

              <div>
                <Label className="text-sm text-gray-500">Responsável</Label>
                <p className="font-medium">{selectedFamilia.nomeResponsavel}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-gray-500">Número de Membros</Label>
                  <p className="font-medium">{selectedFamilia.numeroMembros}</p>
                </div>
                <div>
                  <Label className="text-sm text-gray-500">Telefone</Label>
                  <p className="font-medium">{selectedFamilia.telefone || 'N/A'}</p>
                </div>
              </div>

              <div>
                <Label className="text-sm text-gray-500">Endereço</Label>
                <p className="font-medium">{selectedFamilia.endereco || 'N/A'}</p>
              </div>

              {selectedFamilia.observacoes && (
                <div>
                  <Label className="text-sm text-gray-500">Observações</Label>
                  <p className="text-sm">{selectedFamilia.observacoes}</p>
                </div>
              )}

              <div>
                <Label className="text-sm text-gray-500">Último Atendimento</Label>
                <p className="font-medium">{selectedFamilia.ultimoAtendimento || 'Nenhum atendimento registrado'}</p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowViewFamiliaModal(false);
                setSelectedFamilia(null);
              }}
              data-testid="button-close-view-familia"
            >
              Fechar
            </Button>
            <Button
              onClick={() => {
                setShowViewFamiliaModal(false);
                setFamiliaForm({
                  nomeResponsavel: selectedFamilia.nomeResponsavel,
                  numeroMembros: selectedFamilia.numeroMembros,
                  telefone: selectedFamilia.telefone || '',
                  endereco: selectedFamilia.endereco || '',
                  status: selectedFamilia.status,
                  observacoes: selectedFamilia.observacoes || ''
                });
                setShowEditFamiliaModal(true);
              }}
              className="bg-purple-500 hover:bg-purple-600"
              data-testid="button-edit-from-view"
            >
              <Edit className="w-4 h-4 mr-2" />
              Editar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Novo Caso */}
      <Dialog open={showCasoModal} onOpenChange={setShowCasoModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Registrar Novo Caso</DialogTitle>
            <DialogDescription>
              Preencha os dados do novo caso psicossocial.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="caso-titulo">Título do Caso *</Label>
              <Input
                id="caso-titulo"
                placeholder="Ex: Acompanhamento familiar - Violência doméstica"
                value={casoForm.titulo}
                onChange={(e) => setCasoForm({ ...casoForm, titulo: e.target.value })}
                data-testid="input-caso-titulo"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="caso-familia">Família</Label>
              <Select 
                value={casoForm.familiaId?.toString() || ''} 
                onValueChange={(value) => setCasoForm({ ...casoForm, familiaId: value ? parseInt(value) : null })}
              >
                <SelectTrigger id="caso-familia" data-testid="select-caso-familia">
                  <SelectValue placeholder="Selecione a família" />
                </SelectTrigger>
                <SelectContent>
                  {familias.map((familia: any) => (
                    <SelectItem key={familia.id} value={familia.id.toString()}>
                      Família {familia.nomeResponsavel}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="caso-tipo">Tipo de Caso *</Label>
                <Select 
                  value={casoForm.tipo} 
                  onValueChange={(value) => setCasoForm({ ...casoForm, tipo: value })}
                >
                  <SelectTrigger id="caso-tipo" data-testid="select-caso-tipo">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Violência Doméstica">Violência Doméstica</SelectItem>
                    <SelectItem value="Dependência Química">Dependência Química</SelectItem>
                    <SelectItem value="Vulnerabilidade Social">Vulnerabilidade Social</SelectItem>
                    <SelectItem value="Conflito Familiar">Conflito Familiar</SelectItem>
                    <SelectItem value="Saúde Mental">Saúde Mental</SelectItem>
                    <SelectItem value="Negligência">Negligência</SelectItem>
                    <SelectItem value="Abandono">Abandono</SelectItem>
                    <SelectItem value="Outros">Outros</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="caso-prioridade">Prioridade</Label>
                <Select 
                  value={casoForm.prioridade} 
                  onValueChange={(value: any) => setCasoForm({ ...casoForm, prioridade: value })}
                >
                  <SelectTrigger id="caso-prioridade" data-testid="select-caso-prioridade">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="baixa">Baixa</SelectItem>
                    <SelectItem value="media">Média</SelectItem>
                    <SelectItem value="alta">Alta</SelectItem>
                    <SelectItem value="urgente">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="caso-descricao">Descrição</Label>
              <Textarea
                id="caso-descricao"
                placeholder="Descreva os detalhes do caso..."
                rows={4}
                value={casoForm.descricao}
                onChange={(e) => setCasoForm({ ...casoForm, descricao: e.target.value })}
                data-testid="textarea-caso-descricao"
              />
            </div>
          </div>

          <DialogFooter className="sm:justify-between">
            <Button
              variant="outline"
              onClick={() => {
                setShowCasoModal(false);
                setCasoForm({
                  familiaId: null,
                  titulo: '',
                  tipo: '',
                  prioridade: 'media',
                  status: 'aberto',
                  descricao: ''
                });
              }}
              data-testid="button-cancel-caso"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSaveCaso}
              disabled={createCasoMutation.isPending}
              className="bg-purple-500 hover:bg-purple-600"
              data-testid="button-save-caso"
            >
              {createCasoMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Salvando...
                </>
              ) : (
                'Registrar Caso'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal - Novo Atendimento */}
      <Dialog open={showAtendimentoModal} onOpenChange={setShowAtendimentoModal}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Registrar Novo Atendimento</DialogTitle>
            <DialogDescription>
              Preencha os dados do atendimento psicossocial.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="atend-atendido">Atendido</Label>
              <div className="relative">
                <Input
                  id="atend-atendido"
                  placeholder="🔍 Buscar atendido por nome..."
                  value={atendidoSelecionadoNome || buscaAtendido}
                  onChange={(e) => {
                    setAtendidoSelecionadoNome('');
                    setBuscaAtendido(e.target.value);
                    if (!e.target.value) {
                      setAtendimentoForm({ ...atendimentoForm, vinculoId: null, programaOrigem: null, familiaId: null });
                    }
                  }}
                  data-testid="input-busca-atendido"
                />
                {buscaAtendido && !atendidoSelecionadoNome && (
                  <div className="absolute z-50 w-full bg-white border border-gray-200 rounded-md shadow-lg mt-1 max-h-48 overflow-y-auto">
                    {(todosAtendidosParaAtendimento as any[])
                      .filter((p: any) => (p.nome || '').toLowerCase().includes(buscaAtendido.toLowerCase()))
                      .slice(0, 30)
                      .map((pessoa: any) => (
                        <div
                          key={`${pessoa.origem}_${pessoa.id}`}
                          className="px-3 py-2 cursor-pointer hover:bg-purple-50 text-sm border-b last:border-b-0"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            setAtendidoSelecionadoNome(pessoa.label || pessoa.nome);
                            setBuscaAtendido('');
                            setAtendimentoForm({ ...atendimentoForm, vinculoId: pessoa.id, programaOrigem: pessoa.origem, familiaId: null });
                          }}
                        >
                          {pessoa.label || pessoa.nome}
                        </div>
                      ))}
                    {(todosAtendidosParaAtendimento as any[]).filter((p: any) =>
                      (p.nome || '').toLowerCase().includes(buscaAtendido.toLowerCase())
                    ).length === 0 && (
                      <div className="px-3 py-2 text-sm text-gray-500 text-center">Nenhum atendido encontrado</div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="atend-familia">Família (opcional)</Label>
              <Select 
                value={atendimentoForm.familiaId?.toString() || ''} 
                onValueChange={(value) => setAtendimentoForm({ ...atendimentoForm, familiaId: value ? parseInt(value) : null })}
              >
                <SelectTrigger id="atend-familia" data-testid="select-atendimento-familia">
                  <SelectValue placeholder="Selecione a família" />
                </SelectTrigger>
                <SelectContent>
                  {familias.map((familia: any) => (
                    <SelectItem key={familia.id} value={familia.id.toString()}>
                      Família {familia.nomeResponsavel}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="atend-caso">Caso Relacionado</Label>
              <Select 
                value={atendimentoForm.casoId?.toString() || ''} 
                onValueChange={(value) => setAtendimentoForm({ ...atendimentoForm, casoId: value ? parseInt(value) : null })}
              >
                <SelectTrigger id="atend-caso" data-testid="select-atendimento-caso">
                  <SelectValue placeholder="Selecione o caso (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  {casos.map((caso: any) => (
                    <SelectItem key={caso.id} value={caso.id.toString()}>
                      {caso.titulo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="atend-tipo">Tipo de Atendimento *</Label>
                <Select 
                  value={atendimentoForm.tipo} 
                  onValueChange={(value: any) => setAtendimentoForm({ ...atendimentoForm, tipo: value })}
                >
                  <SelectTrigger id="atend-tipo" data-testid="select-atendimento-tipo">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="individual">Individual</SelectItem>
                    <SelectItem value="familiar">Familiar</SelectItem>
                    <SelectItem value="grupo">Grupo</SelectItem>
                    <SelectItem value="visita_domiciliar">Visita Domiciliar</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="atend-data">Data *</Label>
                <Input
                  id="atend-data"
                  type="date"
                  value={atendimentoForm.dataAtendimento}
                  onChange={(e) => setAtendimentoForm({ ...atendimentoForm, dataAtendimento: e.target.value })}
                  data-testid="input-atendimento-data"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="atend-duracao">Duração (minutos) *</Label>
                <Input
                  id="atend-duracao"
                  type="number"
                  min="15"
                  step="15"
                  value={atendimentoForm.duracaoMinutos}
                  onChange={(e) => setAtendimentoForm({ ...atendimentoForm, duracaoMinutos: parseInt(e.target.value) || 60 })}
                  data-testid="input-atendimento-duracao"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="atend-profissional">Profissional Responsável</Label>
                <Input
                  id="atend-profissional"
                  placeholder="Ex: Psicólogo, Assistente Social"
                  value={atendimentoForm.profissionalResponsavel}
                  onChange={(e) => setAtendimentoForm({ ...atendimentoForm, profissionalResponsavel: e.target.value })}
                  data-testid="input-atendimento-profissional"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="atend-resumo">Resumo do Atendimento</Label>
              <Textarea
                id="atend-resumo"
                placeholder="Resumo do que foi trabalhado no atendimento..."
                rows={3}
                value={atendimentoForm.resumo}
                onChange={(e) => setAtendimentoForm({ ...atendimentoForm, resumo: e.target.value })}
                data-testid="textarea-atendimento-resumo"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="atend-observacoes">Observações</Label>
              <Textarea
                id="atend-observacoes"
                placeholder="Observações adicionais..."
                rows={2}
                value={atendimentoForm.observacoes}
                onChange={(e) => setAtendimentoForm({ ...atendimentoForm, observacoes: e.target.value })}
                data-testid="textarea-atendimento-observacoes"
              />
            </div>
          </div>

          <DialogFooter className="sm:justify-between">
            <Button
              variant="outline"
              onClick={() => {
                setShowAtendimentoModal(false);
                setBuscaAtendido('');
                setAtendidoSelecionadoNome('');
                setAtendimentoForm({
                  familiaId: null,
                  casoId: null,
                  vinculoId: null,
                  programaOrigem: null,
                  tipo: 'individual',
                  dataAtendimento: new Date().toISOString().split('T')[0],
                  duracaoMinutos: 60,
                  profissionalResponsavel: '',
                  resumo: '',
                  observacoes: ''
                });
              }}
              data-testid="button-cancel-atendimento"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSaveAtendimento}
              disabled={createAtendimentoMutation.isPending}
              className="bg-blue-500 hover:bg-blue-600"
              data-testid="button-save-atendimento"
            >
              {createAtendimentoMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Salvando...
                </>
              ) : (
                'Registrar Atendimento'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal - Histórico de Atendimentos do Participante */}
      <Dialog open={showHistoricoModal} onOpenChange={setShowHistoricoModal}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Histórico de Atendimentos</DialogTitle>
            <DialogDescription>
              {selectedParticipante && (
                <div className="mt-2">
                  <p className="font-medium">{normalizeName(selectedParticipante.nome || "")}</p>
                  {selectedParticipante.programa_origem && (
                    <Badge className={selectedParticipante.programa_origem === 'pec' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}>
                      {selectedParticipante.programa_origem === 'pec' ? 'PEC' : 'Inclusão Produtiva'}
                    </Badge>
                  )}
                </div>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {(() => {
              // Prioridade 1: atendimentos já incluídos no objeto (vêm de registros_confidenciais)
              const registros: any[] = selectedParticipante?.atendimentos || [];
              if (registros.length > 0) {
                const tipoLabel: Record<string, string> = {
                  atendimento_individual: 'Atendimento Individual',
                  atendimento_familiar: 'Atendimento Familiar',
                  atendimento_grupo: 'Atendimento em Grupo',
                  visita_domiciliar: 'Visita Domiciliar',
                  acolhimento: 'Acolhimento',
                  encaminhamento: 'Encaminhamento',
                };
                return (
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600">Total de registros: <strong>{registros.length}</strong></p>
                    {registros.map((r: any) => (
                      <div key={r.id} className="border rounded-lg p-4 space-y-1">
                        <div className="flex justify-between items-start">
                          <h4 className="font-medium">{r.titulo || tipoLabel[r.tipo] || r.tipo}</h4>
                          <Badge variant="outline">{tipoLabel[r.tipo] || r.tipo}</Badge>
                        </div>
                        {r.data && <p className="text-sm text-gray-500">{new Date(r.data).toLocaleDateString('pt-BR')}</p>}
                        {r.vertente && r.vertente !== 'todos' && <p className="text-xs text-gray-400">Vertente: {r.vertente}</p>}
                      </div>
                    ))}
                  </div>
                );
              }
              // Prioridade 2: histórico por vinculo_id (participantes de PEC/Inclusão)
              if (isLoadingHistorico) return (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                  <p className="text-gray-500 mt-4">Carregando histórico...</p>
                </div>
              );
              if (historicoData?.atendimentos?.length > 0) return (
                <div className="space-y-3">
                  <p className="text-sm text-gray-600">Total de atendimentos: <strong>{historicoData.atendimentos.length}</strong></p>
                  {historicoData.atendimentos.map((atendimento: any) => (
                    <div key={atendimento.id} className="border rounded-lg p-4 space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">
                            {atendimento.tipo === 'individual' && 'Atendimento Individual'}
                            {atendimento.tipo === 'familiar' && 'Atendimento Familiar'}
                            {atendimento.tipo === 'grupo' && 'Atendimento em Grupo'}
                            {atendimento.tipo === 'visita_domiciliar' && 'Visita Domiciliar'}
                          </h4>
                          <p className="text-sm text-gray-500">
                            {new Date(atendimento.dataAtendimento).toLocaleDateString('pt-BR')} • {atendimento.duracaoMinutos} min
                          </p>
                        </div>
                        <Badge variant="outline">{atendimento.tipo}</Badge>
                      </div>
                      {atendimento.resumo && <p className="text-sm"><strong>Resumo:</strong> {atendimento.resumo}</p>}
                    </div>
                  ))}
                </div>
              );
              return (
                <div className="text-center py-8">
                  <p className="text-gray-500">Nenhum registro encontrado.</p>
                </div>
              );
            })()}
          </div>

          <DialogFooter>
            <Button onClick={() => setShowHistoricoModal(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal - Novo Grupo Terapêutico */}
      <Dialog open={showGrupoModal} onOpenChange={setShowGrupoModal}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Criar Novo Grupo Terapêutico</DialogTitle>
            <DialogDescription>
              Preencha os dados do grupo terapêutico.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="grupo-nome">Nome do Grupo *</Label>
              <Input
                id="grupo-nome"
                placeholder="Ex: Grupo Terapêutico de Mulheres"
                value={grupoForm.nome}
                onChange={(e) => setGrupoForm({ ...grupoForm, nome: e.target.value })}
                data-testid="input-grupo-nome"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="grupo-tipo">Tipo de Grupo *</Label>
                <Select 
                  value={grupoForm.tipo} 
                  onValueChange={(value: any) => setGrupoForm({ ...grupoForm, tipo: value })}
                >
                  <SelectTrigger id="grupo-tipo" data-testid="select-grupo-tipo">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="terapeutico">Terapêutico</SelectItem>
                    <SelectItem value="apoio">Apoio</SelectItem>
                    <SelectItem value="educativo">Educativo</SelectItem>
                    <SelectItem value="oficina">Oficina</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="grupo-status">Status</Label>
                <Select 
                  value={grupoForm.status} 
                  onValueChange={(value: any) => setGrupoForm({ ...grupoForm, status: value })}
                >
                  <SelectTrigger id="grupo-status" data-testid="select-grupo-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ativo">Ativo</SelectItem>
                    <SelectItem value="inativo">Inativo</SelectItem>
                    <SelectItem value="em_formacao">Em Formação</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="grupo-facilitador">Facilitador/Profissional Responsável</Label>
              <Input
                id="grupo-facilitador"
                placeholder="Ex: Ana Paula Costa - Psicóloga"
                value={grupoForm.facilitador}
                onChange={(e) => setGrupoForm({ ...grupoForm, facilitador: e.target.value })}
                data-testid="input-grupo-facilitador"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="grupo-dia">Dia da Semana</Label>
                <Select 
                  value={grupoForm.diaSemana} 
                  onValueChange={(value) => setGrupoForm({ ...grupoForm, diaSemana: value })}
                >
                  <SelectTrigger id="grupo-dia" data-testid="select-grupo-dia">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Segunda-feira">Segunda-feira</SelectItem>
                    <SelectItem value="Terça-feira">Terça-feira</SelectItem>
                    <SelectItem value="Quarta-feira">Quarta-feira</SelectItem>
                    <SelectItem value="Quinta-feira">Quinta-feira</SelectItem>
                    <SelectItem value="Sexta-feira">Sexta-feira</SelectItem>
                    <SelectItem value="Sábado">Sábado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="grupo-horario">Horário</Label>
                <Input
                  id="grupo-horario"
                  type="time"
                  value={grupoForm.horario}
                  onChange={(e) => setGrupoForm({ ...grupoForm, horario: e.target.value })}
                  data-testid="input-grupo-horario"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="grupo-max">Máx. Participantes</Label>
                <Input
                  id="grupo-max"
                  type="number"
                  min="5"
                  max="30"
                  value={grupoForm.maxParticipantes}
                  onChange={(e) => setGrupoForm({ ...grupoForm, maxParticipantes: parseInt(e.target.value) || 15 })}
                  data-testid="input-grupo-max"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="grupo-local">Local</Label>
              <Input
                id="grupo-local"
                placeholder="Ex: Sala 2 - Instituto O Grito"
                value={grupoForm.local}
                onChange={(e) => setGrupoForm({ ...grupoForm, local: e.target.value })}
                data-testid="input-grupo-local"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="grupo-objetivo">Objetivo do Grupo</Label>
              <Textarea
                id="grupo-objetivo"
                placeholder="Descreva o objetivo e propósito do grupo..."
                rows={2}
                value={grupoForm.objetivo}
                onChange={(e) => setGrupoForm({ ...grupoForm, objetivo: e.target.value })}
                data-testid="textarea-grupo-objetivo"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="grupo-descricao">Descrição/Metodologia</Label>
              <Textarea
                id="grupo-descricao"
                placeholder="Metodologia utilizada, abordagem terapêutica, etc..."
                rows={3}
                value={grupoForm.descricao}
                onChange={(e) => setGrupoForm({ ...grupoForm, descricao: e.target.value })}
                data-testid="textarea-grupo-descricao"
              />
            </div>
          </div>

          <DialogFooter className="sm:justify-between">
            <Button
              variant="outline"
              onClick={() => {
                setShowGrupoModal(false);
                setGrupoForm({
                  nome: '',
                  tipo: 'terapeutico',
                  facilitador: '',
                  diaSemana: '',
                  horario: '',
                  local: '',
                  maxParticipantes: 15,
                  status: 'ativo',
                  descricao: '',
                  objetivo: ''
                });
              }}
              data-testid="button-cancel-grupo"
            >
              Cancelar
            </Button>
            <Button
              onClick={() => {
                toast({
                  title: "Em desenvolvimento",
                  description: "Funcionalidade de criar grupo em desenvolvimento.",
                });
                setShowGrupoModal(false);
              }}
              className="bg-purple-500 hover:bg-purple-600"
              data-testid="button-save-grupo"
            >
              Criar Grupo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal - Registrar Violação de Direitos */}
      <Dialog open={showViolacaoModal} onOpenChange={setShowViolacaoModal}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Registrar Violação de Direitos</DialogTitle>
            <DialogDescription>
              Registre casos de violações de direitos para acompanhamento e medidas protetivas.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="violacao-vitima">Nome da Vítima *</Label>
                <Input
                  id="violacao-vitima"
                  placeholder="Nome completo ou iniciais"
                  value={violacaoForm.vitimaNome}
                  onChange={(e) => setViolacaoForm({ ...violacaoForm, vitimaNome: e.target.value })}
                  data-testid="input-violacao-vitima"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="violacao-idade">Idade da Vítima</Label>
                <Input
                  id="violacao-idade"
                  placeholder="Ex: 8 anos, 34 anos"
                  value={violacaoForm.vitimaIdade}
                  onChange={(e) => setViolacaoForm({ ...violacaoForm, vitimaIdade: e.target.value })}
                  data-testid="input-violacao-idade"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="violacao-tipo">Tipo de Violação *</Label>
              <Select 
                value={violacaoForm.tipoViolacao} 
                onValueChange={(value) => setViolacaoForm({ ...violacaoForm, tipoViolacao: value })}
              >
                <SelectTrigger id="violacao-tipo" data-testid="select-violacao-tipo">
                  <SelectValue placeholder="Selecione o tipo de violação" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Negligência">Negligência</SelectItem>
                  <SelectItem value="Violência Doméstica">Violência Doméstica</SelectItem>
                  <SelectItem value="Violência Física">Violência Física</SelectItem>
                  <SelectItem value="Violência Psicológica">Violência Psicológica</SelectItem>
                  <SelectItem value="Violência Sexual">Violência Sexual</SelectItem>
                  <SelectItem value="Exploração Infantil">Exploração Infantil</SelectItem>
                  <SelectItem value="Abandono">Abandono</SelectItem>
                  <SelectItem value="Discriminação">Discriminação</SelectItem>
                  <SelectItem value="Outras">Outras</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="violacao-data">Data do Registro *</Label>
                <Input
                  id="violacao-data"
                  type="date"
                  value={violacaoForm.dataRegistro}
                  onChange={(e) => setViolacaoForm({ ...violacaoForm, dataRegistro: e.target.value })}
                  data-testid="input-violacao-data"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="violacao-prioridade">Prioridade *</Label>
                <Select 
                  value={violacaoForm.prioridade} 
                  onValueChange={(value: any) => setViolacaoForm({ ...violacaoForm, prioridade: value })}
                >
                  <SelectTrigger id="violacao-prioridade" data-testid="select-violacao-prioridade">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="baixa">Baixa</SelectItem>
                    <SelectItem value="media">Média</SelectItem>
                    <SelectItem value="alta">Alta</SelectItem>
                    <SelectItem value="urgente">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="violacao-status">Status</Label>
                <Select 
                  value={violacaoForm.status} 
                  onValueChange={(value: any) => setViolacaoForm({ ...violacaoForm, status: value })}
                >
                  <SelectTrigger id="violacao-status" data-testid="select-violacao-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="em_investigacao">Em Investigação</SelectItem>
                    <SelectItem value="em_acompanhamento">Em Acompanhamento</SelectItem>
                    <SelectItem value="encaminhado">Encaminhado</SelectItem>
                    <SelectItem value="resolvido">Resolvido</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="violacao-descricao">Descrição do Caso *</Label>
              <Textarea
                id="violacao-descricao"
                placeholder="Descreva detalhadamente o caso de violação..."
                rows={4}
                value={violacaoForm.descricao}
                onChange={(e) => setViolacaoForm({ ...violacaoForm, descricao: e.target.value })}
                data-testid="textarea-violacao-descricao"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="violacao-medidas">Medidas Tomadas</Label>
              <Textarea
                id="violacao-medidas"
                placeholder="Descreva as medidas protetivas ou ações já tomadas..."
                rows={3}
                value={violacaoForm.medidasTomadas}
                onChange={(e) => setViolacaoForm({ ...violacaoForm, medidasTomadas: e.target.value })}
                data-testid="textarea-violacao-medidas"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="violacao-orgaos">Órgãos Acionados</Label>
              <Input
                id="violacao-orgaos"
                placeholder="Ex: Conselho Tutelar, CRAS, Polícia Civil"
                value={violacaoForm.orgaosAcionados}
                onChange={(e) => setViolacaoForm({ ...violacaoForm, orgaosAcionados: e.target.value })}
                data-testid="input-violacao-orgaos"
              />
            </div>
          </div>

          <DialogFooter className="sm:justify-between">
            <Button
              variant="outline"
              onClick={() => {
                setShowViolacaoModal(false);
                setViolacaoForm({
                  vitimaNome: '',
                  vitimaIdade: '',
                  tipoViolacao: '',
                  dataRegistro: new Date().toISOString().split('T')[0],
                  status: 'em_investigacao',
                  prioridade: 'alta',
                  descricao: '',
                  medidasTomadas: '',
                  orgaosAcionados: ''
                });
              }}
              data-testid="button-cancel-violacao"
            >
              Cancelar
            </Button>
            <Button
              onClick={() => {
                toast({
                  title: "Em desenvolvimento",
                  description: "Funcionalidade de registrar violação em desenvolvimento.",
                });
                setShowViolacaoModal(false);
              }}
              className="bg-red-500 hover:bg-red-600"
              data-testid="button-save-violacao"
            >
              Registrar Violação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal - Nova Medida Protetiva */}
      <Dialog open={showMedidaModal} onOpenChange={setShowMedidaModal}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Registrar Medida Protetiva</DialogTitle>
            <DialogDescription>
              Registre medidas protetivas aplicadas para proteção e acompanhamento.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="medida-codigo">Código/Identificação</Label>
                <Input
                  id="medida-codigo"
                  placeholder="Ex: MP001, MP-2025-001"
                  value={medidaForm.codigo}
                  onChange={(e) => setMedidaForm({ ...medidaForm, codigo: e.target.value })}
                  data-testid="input-medida-codigo"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="medida-tipo">Tipo de Medida Protetiva *</Label>
                <Select 
                  value={medidaForm.tipo} 
                  onValueChange={(value) => setMedidaForm({ ...medidaForm, tipo: value })}
                >
                  <SelectTrigger id="medida-tipo" data-testid="select-medida-tipo">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Medida Protetiva de Urgência">Medida Protetiva de Urgência</SelectItem>
                    <SelectItem value="Acolhimento Institucional">Acolhimento Institucional</SelectItem>
                    <SelectItem value="Afastamento do Agressor">Afastamento do Agressor</SelectItem>
                    <SelectItem value="Encaminhamento CREAS">Encaminhamento CREAS</SelectItem>
                    <SelectItem value="Encaminhamento CRAS">Encaminhamento CRAS</SelectItem>
                    <SelectItem value="Acompanhamento Psicológico">Acompanhamento Psicológico</SelectItem>
                    <SelectItem value="Acompanhamento Social">Acompanhamento Social</SelectItem>
                    <SelectItem value="Outras">Outras</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="medida-beneficiario">Beneficiário/Pessoa Protegida *</Label>
              <Input
                id="medida-beneficiario"
                placeholder="Nome do beneficiário ou identificação"
                value={medidaForm.beneficiario}
                onChange={(e) => setMedidaForm({ ...medidaForm, beneficiario: e.target.value })}
                data-testid="input-medida-beneficiario"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="medida-descricao">Descrição da Medida *</Label>
              <Textarea
                id="medida-descricao"
                placeholder="Descreva detalhadamente a medida protetiva aplicada..."
                rows={3}
                value={medidaForm.descricao}
                onChange={(e) => setMedidaForm({ ...medidaForm, descricao: e.target.value })}
                data-testid="textarea-medida-descricao"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="medida-data">Data de Início *</Label>
                <Input
                  id="medida-data"
                  type="date"
                  value={medidaForm.dataInicio}
                  onChange={(e) => setMedidaForm({ ...medidaForm, dataInicio: e.target.value })}
                  data-testid="input-medida-data"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="medida-prazo">Prazo/Duração</Label>
                <Input
                  id="medida-prazo"
                  placeholder="Ex: 6 meses, 1 ano"
                  value={medidaForm.prazo}
                  onChange={(e) => setMedidaForm({ ...medidaForm, prazo: e.target.value })}
                  data-testid="input-medida-prazo"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="medida-status">Status</Label>
                <Select 
                  value={medidaForm.status} 
                  onValueChange={(value: any) => setMedidaForm({ ...medidaForm, status: value })}
                >
                  <SelectTrigger id="medida-status" data-testid="select-medida-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ativa">Ativa</SelectItem>
                    <SelectItem value="em_andamento">Em Andamento</SelectItem>
                    <SelectItem value="concluida">Concluída</SelectItem>
                    <SelectItem value="cancelada">Cancelada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="medida-responsavel">Profissional/Órgão Responsável</Label>
              <Input
                id="medida-responsavel"
                placeholder="Ex: Assistente Social Maria Silva - CREAS"
                value={medidaForm.responsavel}
                onChange={(e) => setMedidaForm({ ...medidaForm, responsavel: e.target.value })}
                data-testid="input-medida-responsavel"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="medida-observacoes">Observações</Label>
              <Textarea
                id="medida-observacoes"
                placeholder="Informações adicionais, acompanhamento, etc..."
                rows={3}
                value={medidaForm.observacoes}
                onChange={(e) => setMedidaForm({ ...medidaForm, observacoes: e.target.value })}
                data-testid="textarea-medida-observacoes"
              />
            </div>
          </div>

          <DialogFooter className="sm:justify-between">
            <Button
              variant="outline"
              onClick={() => {
                setShowMedidaModal(false);
                setMedidaForm({
                  codigo: '',
                  tipo: '',
                  beneficiario: '',
                  descricao: '',
                  dataInicio: new Date().toISOString().split('T')[0],
                  prazo: '',
                  status: 'ativa',
                  responsavel: '',
                  observacoes: ''
                });
              }}
              data-testid="button-cancel-medida"
            >
              Cancelar
            </Button>
            <Button
              onClick={() => {
                toast({
                  title: "Em desenvolvimento",
                  description: "Funcionalidade de registrar medida protetiva em desenvolvimento.",
                });
                setShowMedidaModal(false);
              }}
              className="bg-orange-500 hover:bg-orange-600"
              data-testid="button-save-medida"
            >
              Registrar Medida
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal - Novo Serviço na Rede */}
      <Dialog open={showServicoModal} onOpenChange={setShowServicoModal}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Cadastrar Serviço na Rede</DialogTitle>
            <DialogDescription>
              Adicione um novo serviço ou instituição parceira à rede de atendimento.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="servico-nome">Nome do Serviço/Instituição *</Label>
              <Input
                id="servico-nome"
                placeholder="Ex: CRAS Centro, CAPS Centro de Atenção Psicossocial"
                value={servicoForm.nome}
                onChange={(e) => setServicoForm({ ...servicoForm, nome: e.target.value })}
                data-testid="input-servico-nome"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="servico-tipo">Tipo de Serviço *</Label>
                <Select 
                  value={servicoForm.tipo} 
                  onValueChange={(value) => setServicoForm({ ...servicoForm, tipo: value })}
                >
                  <SelectTrigger id="servico-tipo" data-testid="select-servico-tipo">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CRAS">CRAS - Centro de Referência de Assistência Social</SelectItem>
                    <SelectItem value="CREAS">CREAS - Centro de Referência Especializado</SelectItem>
                    <SelectItem value="CAPS">CAPS - Centro de Atenção Psicossocial</SelectItem>
                    <SelectItem value="Conselho Tutelar">Conselho Tutelar</SelectItem>
                    <SelectItem value="Saúde Mental">Saúde Mental</SelectItem>
                    <SelectItem value="Educação">Educação</SelectItem>
                    <SelectItem value="Proteção Infantil">Proteção Infantil</SelectItem>
                    <SelectItem value="Outros">Outros</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="servico-categoria">Categoria</Label>
                <Select 
                  value={servicoForm.categoria} 
                  onValueChange={(value) => setServicoForm({ ...servicoForm, categoria: value })}
                >
                  <SelectTrigger id="servico-categoria" data-testid="select-servico-categoria">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Saúde Mental">Saúde Mental</SelectItem>
                    <SelectItem value="Assistência Social">Assistência Social</SelectItem>
                    <SelectItem value="Proteção Infantil">Proteção Infantil</SelectItem>
                    <SelectItem value="Conselho Tutelar">Conselho Tutelar</SelectItem>
                    <SelectItem value="Outros">Outros</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="servico-endereco">Endereço</Label>
              <Input
                id="servico-endereco"
                placeholder="Rua, número, bairro, cidade"
                value={servicoForm.endereco}
                onChange={(e) => setServicoForm({ ...servicoForm, endereco: e.target.value })}
                data-testid="input-servico-endereco"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="servico-telefone">Telefone</Label>
                <Input
                  id="servico-telefone"
                  placeholder="(31) 3333-3333"
                  value={servicoForm.telefone}
                  onChange={(e) => setServicoForm({ ...servicoForm, telefone: e.target.value })}
                  data-testid="input-servico-telefone"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="servico-email">Email</Label>
                <Input
                  id="servico-email"
                  type="email"
                  placeholder="contato@servico.gov.br"
                  value={servicoForm.email}
                  onChange={(e) => setServicoForm({ ...servicoForm, email: e.target.value })}
                  data-testid="input-servico-email"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="servico-horario">Horário de Funcionamento</Label>
              <Input
                id="servico-horario"
                placeholder="Ex: Segunda a Sexta, 8h às 17h"
                value={servicoForm.horarioFuncionamento}
                onChange={(e) => setServicoForm({ ...servicoForm, horarioFuncionamento: e.target.value })}
                data-testid="input-servico-horario"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="servico-responsavel">Responsável/Contato Principal</Label>
              <Input
                id="servico-responsavel"
                placeholder="Nome do responsável ou contato"
                value={servicoForm.responsavel}
                onChange={(e) => setServicoForm({ ...servicoForm, responsavel: e.target.value })}
                data-testid="input-servico-responsavel"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="servico-descricao">Descrição dos Serviços Oferecidos</Label>
              <Textarea
                id="servico-descricao"
                placeholder="Descreva os principais serviços oferecidos..."
                rows={3}
                value={servicoForm.descricao}
                onChange={(e) => setServicoForm({ ...servicoForm, descricao: e.target.value })}
                data-testid="textarea-servico-descricao"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="servico-observacoes">Observações</Label>
              <Textarea
                id="servico-observacoes"
                placeholder="Informações adicionais, documentos necessários, etc..."
                rows={2}
                value={servicoForm.observacoes}
                onChange={(e) => setServicoForm({ ...servicoForm, observacoes: e.target.value })}
                data-testid="textarea-servico-observacoes"
              />
            </div>
          </div>

          <DialogFooter className="sm:justify-between">
            <Button
              variant="outline"
              onClick={() => {
                setShowServicoModal(false);
                setServicoForm({
                  nome: '',
                  tipo: '',
                  categoria: '',
                  endereco: '',
                  telefone: '',
                  email: '',
                  horarioFuncionamento: '',
                  responsavel: '',
                  descricao: '',
                  observacoes: ''
                });
              }}
              data-testid="button-cancel-servico"
            >
              Cancelar
            </Button>
            <Button
              onClick={() => {
                toast({
                  title: "Em desenvolvimento",
                  description: "Funcionalidade de cadastrar serviço em desenvolvimento.",
                });
                setShowServicoModal(false);
              }}
              className="bg-blue-500 hover:bg-blue-600"
              data-testid="button-save-servico"
            >
              Cadastrar Serviço
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal - Novo Encaminhamento */}
      <Dialog open={showEncaminhamentoModal} onOpenChange={setShowEncaminhamentoModal}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Registrar Encaminhamento</DialogTitle>
            <DialogDescription>
              Registre um encaminhamento para serviço da rede de atendimento.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="encaminhamento-pessoa">Família/Pessoa Encaminhada *</Label>
              <Input
                id="encaminhamento-pessoa"
                placeholder="Nome da família ou pessoa"
                value={encaminhamentoForm.familiaPessoa}
                onChange={(e) => setEncaminhamentoForm({ ...encaminhamentoForm, familiaPessoa: e.target.value })}
                data-testid="input-encaminhamento-pessoa"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="encaminhamento-servico">Serviço de Destino *</Label>
                <Select 
                  value={encaminhamentoForm.servicoDestino} 
                  onValueChange={(value) => setEncaminhamentoForm({ ...encaminhamentoForm, servicoDestino: value })}
                >
                  <SelectTrigger id="encaminhamento-servico" data-testid="select-encaminhamento-servico">
                    <SelectValue placeholder="Selecione o serviço" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CAPS">CAPS - Atendimento Psicológico</SelectItem>
                    <SelectItem value="CREAS">CREAS - Acompanhamento Social</SelectItem>
                    <SelectItem value="CRAS">CRAS - Centro de Referência</SelectItem>
                    <SelectItem value="Conselho Tutelar">Conselho Tutelar</SelectItem>
                    <SelectItem value="Saúde">Unidade de Saúde</SelectItem>
                    <SelectItem value="Educação">Educação</SelectItem>
                    <SelectItem value="Outros">Outros</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="encaminhamento-tipo">Tipo de Encaminhamento</Label>
                <Select 
                  value={encaminhamentoForm.tipo} 
                  onValueChange={(value) => setEncaminhamentoForm({ ...encaminhamentoForm, tipo: value })}
                >
                  <SelectTrigger id="encaminhamento-tipo" data-testid="select-encaminhamento-tipo">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Atendimento Psicológico">Atendimento Psicológico</SelectItem>
                    <SelectItem value="Acompanhamento Social">Acompanhamento Social</SelectItem>
                    <SelectItem value="Atendimento Médico">Atendimento Médico</SelectItem>
                    <SelectItem value="Proteção">Proteção</SelectItem>
                    <SelectItem value="Caso Individual">Caso Individual</SelectItem>
                    <SelectItem value="Caso Familiar">Caso Familiar</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="encaminhamento-motivo">Motivo do Encaminhamento *</Label>
              <Textarea
                id="encaminhamento-motivo"
                placeholder="Descreva o motivo e necessidade do encaminhamento..."
                rows={3}
                value={encaminhamentoForm.motivo}
                onChange={(e) => setEncaminhamentoForm({ ...encaminhamentoForm, motivo: e.target.value })}
                data-testid="textarea-encaminhamento-motivo"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="encaminhamento-data">Data do Encaminhamento *</Label>
                <Input
                  id="encaminhamento-data"
                  type="date"
                  value={encaminhamentoForm.dataEncaminhamento}
                  onChange={(e) => setEncaminhamentoForm({ ...encaminhamentoForm, dataEncaminhamento: e.target.value })}
                  data-testid="input-encaminhamento-data"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="encaminhamento-prioridade">Prioridade</Label>
                <Select 
                  value={encaminhamentoForm.prioridade} 
                  onValueChange={(value: any) => setEncaminhamentoForm({ ...encaminhamentoForm, prioridade: value })}
                >
                  <SelectTrigger id="encaminhamento-prioridade" data-testid="select-encaminhamento-prioridade">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="baixa">Baixa</SelectItem>
                    <SelectItem value="media">Média</SelectItem>
                    <SelectItem value="alta">Alta</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="encaminhamento-status">Status</Label>
                <Select 
                  value={encaminhamentoForm.status} 
                  onValueChange={(value: any) => setEncaminhamentoForm({ ...encaminhamentoForm, status: value })}
                >
                  <SelectTrigger id="encaminhamento-status" data-testid="select-encaminhamento-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="em_andamento">Em Andamento</SelectItem>
                    <SelectItem value="concluido">Concluído</SelectItem>
                    <SelectItem value="cancelado">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="encaminhamento-responsavel">Profissional Responsável</Label>
              <Input
                id="encaminhamento-responsavel"
                placeholder="Nome do profissional que realizou o encaminhamento"
                value={encaminhamentoForm.profissionalResponsavel}
                onChange={(e) => setEncaminhamentoForm({ ...encaminhamentoForm, profissionalResponsavel: e.target.value })}
                data-testid="input-encaminhamento-responsavel"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="encaminhamento-observacoes">Observações</Label>
              <Textarea
                id="encaminhamento-observacoes"
                placeholder="Informações complementares, documentos necessários, etc..."
                rows={2}
                value={encaminhamentoForm.observacoes}
                onChange={(e) => setEncaminhamentoForm({ ...encaminhamentoForm, observacoes: e.target.value })}
                data-testid="textarea-encaminhamento-observacoes"
              />
            </div>
          </div>

          <DialogFooter className="sm:justify-between">
            <Button
              variant="outline"
              onClick={() => {
                setShowEncaminhamentoModal(false);
                setEncaminhamentoForm({
                  familiaPessoa: '',
                  servicoDestino: '',
                  tipo: '',
                  dataEncaminhamento: new Date().toISOString().split('T')[0],
                  motivo: '',
                  status: 'pendente',
                  prioridade: 'media',
                  profissionalResponsavel: '',
                  observacoes: ''
                });
              }}
              data-testid="button-cancel-encaminhamento"
            >
              Cancelar
            </Button>
            <Button
              onClick={() => {
                toast({
                  title: "Em desenvolvimento",
                  description: "Funcionalidade de registrar encaminhamento em desenvolvimento.",
                });
                setShowEncaminhamentoModal(false);
              }}
              className="bg-green-500 hover:bg-green-600"
              data-testid="button-save-encaminhamento"
            >
              Registrar Encaminhamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmação - Excluir Família */}
      <AlertDialog open={showDeleteFamiliaDialog} onOpenChange={setShowDeleteFamiliaDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a família {selectedFamilia?.nomeResponsavel}? Esta ação não pode ser desfeita.
              {selectedFamilia && " A família não pode ter casos ativos."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => selectedFamilia && deleteFamiliaMutation.mutate(selectedFamilia.id)}
              disabled={deleteFamiliaMutation.isPending}
            >
              {deleteFamiliaMutation.isPending ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de confirmação - Remover Atendido Comunidade */}
      <AlertDialog open={confirmDeleteAtendido.open} onOpenChange={(open) => setConfirmDeleteAtendido(prev => ({ ...prev, open }))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover atendido</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover <strong>{confirmDeleteAtendido.nome}</strong> dos atendidos? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => { if (confirmDeleteAtendido.id) deleteAtendidoComunidadeMutation.mutate(confirmDeleteAtendido.id); setConfirmDeleteAtendido({ open: false, id: null, nome: '' }); }}
              disabled={deleteAtendidoComunidadeMutation.isPending}
            >
              {deleteAtendidoComunidadeMutation.isPending ? "Removendo..." : "Remover"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de confirmação - Excluir Registro Confidencial */}
      <AlertDialog open={confirmDeleteRegistro.open} onOpenChange={(open) => setConfirmDeleteRegistro(prev => ({ ...prev, open }))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir registro</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este registro confidencial? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => { if (confirmDeleteRegistro.id) deleteRegistroConfMutation.mutate(confirmDeleteRegistro.id); setConfirmDeleteRegistro({ open: false, id: null }); }}
              disabled={deleteRegistroConfMutation.isPending}
            >
              {deleteRegistroConfMutation.isPending ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de confirmação - Excluir Caso */}
      <AlertDialog open={showDeleteCasoDialog} onOpenChange={setShowDeleteCasoDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o caso {selectedCaso?.titulo}? O caso será marcado como fechado/arquivado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => selectedCaso && deleteCasoMutation.mutate(selectedCaso.id)}
              disabled={deleteCasoMutation.isPending}
            >
              {deleteCasoMutation.isPending ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlterarSenha 
        open={showAlterarSenhaModal} 
        onOpenChange={setShowAlterarSenhaModal}
      />


            <Dialog open={showCadastroAtendido} onOpenChange={setShowCadastroAtendido}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-600" />
              Cadastrar Pessoa — Atendidos Comunidade
            </DialogTitle>
          </DialogHeader>
          {(() => {
            const f = cadastroAtendidoForm;
            const set = (k: string, v: string) => setCadastroAtendidoForm(prev => ({ ...prev, [k]: v }));
            const GENEROS = ["Masculino", "Feminino", "Não-binário", "Prefiro não informar"];
            const RACAS = ["Branca", "Preta", "Parda", "Amarela", "Indígena", "Não informado"];
            const SIM_NAO = ["Sim", "Não", "Não informado"];
            return (
              <div className="space-y-6 pt-2">
                {/* Identificação */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-800 border-b pb-1">Identificação</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1"><Label className="text-sm font-medium text-gray-700">Nome completo *</Label><Input value={f.nome} onChange={e => set("nome", e.target.value)} placeholder="Nome completo" /></div>
                    <div className="space-y-1"><Label className="text-sm font-medium text-gray-700">CPF</Label><Input value={f.cpf} onChange={e => set("cpf", e.target.value)} placeholder="000.000.000-00" /></div>
                    <div className="space-y-1"><Label className="text-sm font-medium text-gray-700">Data de Nascimento</Label><Input type="date" value={f.data_nascimento} onChange={e => set("data_nascimento", e.target.value)} /></div>
                    <div className="space-y-1"><Label className="text-sm font-medium text-gray-700">Gênero</Label>
                      <Select value={f.sexo} onValueChange={v => set("sexo", v)}>
                        <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                        <SelectContent>{GENEROS.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1"><Label className="text-sm font-medium text-gray-700">Raça/Cor</Label>
                      <Select value={f.raca} onValueChange={v => set("raca", v)}>
                        <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                        <SelectContent>{RACAS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1"><Label className="text-sm font-medium text-gray-700">Telefone</Label><Input value={f.telefone} onChange={e => set("telefone", e.target.value)} placeholder="(00) 00000-0000" /></div>
                    <div className="space-y-1"><Label className="text-sm font-medium text-gray-700">E-mail</Label><Input value={f.email} onChange={e => set("email", e.target.value)} placeholder="email@exemplo.com" /></div>
                  </div>
                </div>
                {/* Endereço */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-800 border-b pb-1">Endereço</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1"><Label className="text-sm font-medium text-gray-700">CEP</Label><Input value={f.cep} onChange={e => set("cep", e.target.value)} placeholder="00000-000" /></div>
                    <div className="space-y-1"><Label className="text-sm font-medium text-gray-700">Logradouro</Label><Input value={f.endereco} onChange={e => set("endereco", e.target.value)} placeholder="Rua, Avenida..." /></div>
                    <div className="space-y-1"><Label className="text-sm font-medium text-gray-700">Número</Label><Input value={f.numero} onChange={e => set("numero", e.target.value)} placeholder="Nº" /></div>
                    <div className="space-y-1"><Label className="text-sm font-medium text-gray-700">Complemento</Label><Input value={f.complemento} onChange={e => set("complemento", e.target.value)} placeholder="Apto, Bloco..." /></div>
                    <div className="space-y-1"><Label className="text-sm font-medium text-gray-700">Bairro</Label><Input value={f.bairro} onChange={e => set("bairro", e.target.value)} placeholder="Bairro" /></div>
                    <div className="space-y-1"><Label className="text-sm font-medium text-gray-700">Cidade</Label><Input value={f.cidade} onChange={e => set("cidade", e.target.value)} placeholder="Cidade" /></div>
                    <div className="space-y-1"><Label className="text-sm font-medium text-gray-700">Estado</Label><Input value={f.estado} onChange={e => set("estado", e.target.value)} placeholder="UF" maxLength={2} /></div>
                  </div>
                </div>
                {/* Composição Familiar */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-800 border-b pb-1">Composição Familiar</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="space-y-1"><Label className="text-sm font-medium text-gray-700">Total de pessoas</Label><Input type="number" min={0} value={f.numero_pessoas} onChange={e => set("numero_pessoas", e.target.value)} placeholder="0" /></div>
                    <div className="space-y-1"><Label className="text-sm font-medium text-gray-700">Crianças</Label><Input type="number" min={0} value={f.criancas} onChange={e => set("criancas", e.target.value)} placeholder="0" /></div>
                    <div className="space-y-1"><Label className="text-sm font-medium text-gray-700">Adolescentes</Label><Input type="number" min={0} value={f.adolescentes} onChange={e => set("adolescentes", e.target.value)} placeholder="0" /></div>
                    <div className="space-y-1"><Label className="text-sm font-medium text-gray-700">Adultos</Label><Input type="number" min={0} value={f.adultos} onChange={e => set("adultos", e.target.value)} placeholder="0" /></div>
                    <div className="space-y-1"><Label className="text-sm font-medium text-gray-700">Idosos</Label><Input type="number" min={0} value={f.idosos} onChange={e => set("idosos", e.target.value)} placeholder="0" /></div>
                  </div>
                </div>
                {/* Benefícios Sociais */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-800 border-b pb-1">Benefícios Sociais</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1"><Label className="text-sm font-medium text-gray-700">CadÚnico</Label>
                      <Select value={f.tem_cad_unico} onValueChange={v => set("tem_cad_unico", v)}>
                        <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                        <SelectContent>{SIM_NAO.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1"><Label className="text-sm font-medium text-gray-700">Bolsa Família</Label>
                      <Select value={f.tem_bolsa_familia} onValueChange={v => set("tem_bolsa_familia", v)}>
                        <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                        <SelectContent>{SIM_NAO.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1"><Label className="text-sm font-medium text-gray-700">BPC</Label>
                      <Select value={f.tem_bpc} onValueChange={v => set("tem_bpc", v)}>
                        <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                        <SelectContent>{SIM_NAO.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                {/* Demandas e Observações */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-800 border-b pb-1">Demandas e Observações</h3>
                  <div className="space-y-1"><Label className="text-sm font-medium text-gray-700">Demandas</Label><Textarea value={f.demandas} onChange={e => set("demandas", e.target.value)} placeholder="Principais demandas identificadas..." rows={3} /></div>
                  <div className="space-y-1"><Label className="text-sm font-medium text-gray-700">Observações</Label><Textarea value={f.observacoes} onChange={e => set("observacoes", e.target.value)} placeholder="Observações gerais..." rows={3} /></div>
                </div>
              </div>
            );
          })()}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setShowCadastroAtendido(false)}>Cancelar</Button>
            <Button onClick={() => { if (!cadastroAtendidoForm.nome.trim()) { toast({ title: "Nome é obrigatório", variant: "destructive" }); return; } cadastroAtendidoMutation.mutate(cadastroAtendidoForm); }} disabled={cadastroAtendidoMutation.isPending} className="bg-purple-600 hover:bg-purple-700 text-white">
              {cadastroAtendidoMutation.isPending ? "Salvando..." : "Cadastrar Pessoa"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}