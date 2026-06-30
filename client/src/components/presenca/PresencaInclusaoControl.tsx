import { useState, useEffect, useRef, useMemo, lazy, Suspense } from "react";
const ScannerPresencaModal = lazy(() => import("@/components/presenca/ScannerPresencaModal"));
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  Users,
  Calendar,
  Clock,
  User,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  X,
  Camera,
  Pencil,
  Zap,
  ScanFace,
  Hand,
  Wifi,
  WifiOff,
  RefreshCw,
  Utensils,
  Filter,
  Trash2,
  AlertTriangle,
  Loader2
} from "lucide-react";
import { getDiasAulaParaTurma, getBrazilDateString, aplicarExcecoesNoCalendarioDeChamada, pickChamadaDataPreferencial, toYMDString, type DiaAula } from "@/lib/class-days";
import { ChamadaPresencaNavButtons } from "@/components/presenca/ChamadaPresencaNavButtons";
import { chamadaEstaPendente, chamadaOcupaDataLancamento, chamadaTemFotoComprovante } from "@shared/chamada-presenca";
import { excluirChamadaPendente } from "@/lib/excluirChamadaPendente";

interface PresencaItem {
  participanteId: number;
  nome: string;
  cpf?: string;
  presente: boolean;
  justificativa?: string;
  hora?: string;
  viaCatraca?: boolean;
}

interface PresencaInclusaoControlProps {
  turmasData: any[];
  activeSection: string;
  fetchHistorico: () => Promise<any[]>;
  fetchParticipantes: (turmaId: string, date?: string) => Promise<any[]>;
  savePresenca: (payload: {
    turmaId: number;
    data: string;
    teveAlimentacao?: boolean;
    presencas: Array<{
      participanteId: number;
      presente: boolean;
      justificativa: string;
      status: string;
    }>;
  }) => Promise<any>;
  editPresenca: (payload: {
    turmaId: number;
    data: string;
    teveAlimentacao?: boolean | null;
    presencas: Array<{
      participanteId: number;
      presente: boolean;
      justificativa: string;
      status: string;
    }>;
  }) => Promise<any>;
  uploadFoto: (formData: FormData) => Promise<any>;
  historyQueryKey: any[];
  requireFoto?: boolean;
  canSolicitarExclusao?: boolean;
  origemManual?: string;
}

const normalizeToYMD = toYMDString;

export default function PresencaInclusaoControl({
  turmasData,
  activeSection,
  fetchHistorico,
  fetchParticipantes,
  savePresenca,
  editPresenca,
  uploadFoto,
  historyQueryKey,
  requireFoto = true,
  canSolicitarExclusao = false,
  origemManual = "monitor",
}: PresencaInclusaoControlProps) {
  const { toast } = useToast();

  const [chamadaTurmaId, setChamadaTurmaId] = useState('');
  const [chamadaData, setChamadaData] = useState('');
  const [diasAulaDisponiveis, setDiasAulaDisponiveis] = useState<DiaAula[]>([]);
  const [presencas, setPresencas] = useState<PresencaItem[]>([]);
  const [showHistoricoChamadas, setShowHistoricoChamadas] = useState(false);
  const [fotoFiles, setFotoFiles] = useState<File[]>([]);
  const fotoFilesRef = useRef<File[]>([]);
  const [existingFotoUrl, setExistingFotoUrl] = useState<string | null>(null);
  const [editingChamadaId, setEditingChamadaId] = useState<number | null>(null);
  const [editingTeveAlimentacao, setEditingTeveAlimentacao] = useState<boolean | null>(null);
  const [historicoFiltroTurma, setHistoricoFiltroTurma] = useState('');
  const [historicoFiltroDia, setHistoricoFiltroDia] = useState('');
  const [presencaTurmaBusca, setPresencaTurmaBusca] = useState('');
  const [historicoTurmaBusca, setHistoricoTurmaBusca] = useState('');
  const [historicoExpandido, setHistoricoExpandido] = useState<number | null>(null);
  const [historicoTab, setHistoricoTab] = useState<'finalizadas' | 'pendentes'>('finalizadas');
  const [soFaltasMap, setSoFaltasMap] = useState<Record<number, boolean>>({});
  const [catracaApplied, setCatracaApplied] = useState(false);
  const [modoManual, setModoManual] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [catracaConnected, setCatracaConnected] = useState(false);
  const [fotosGaleriaDialog, setFotosGaleriaDialog] = useState<{ turmaId: string; data: string; urls: string[] } | null>(null);
  const [fotosGaleriaLoading, setFotosGaleriaLoading] = useState(false);

  const [showJustificativaModal, setShowJustificativaModal] = useState(false);
  const [modalJustItems, setModalJustItems] = useState<{participanteId: number; nome: string; motivo: string; obs: string; contaComoPresenca?: boolean}[]>([]);
  const pendingJustRef = useRef<Record<number, {motivo: string; obs: string; contaComoPresenca: boolean}>>({});
  const [showAlimentacaoModal, setShowAlimentacaoModal] = useState(false);

  // Modal de justificativa para ativação de Chamada Manual
  const [showModoManualDialog, setShowModoManualDialog] = useState(false);
  const [motivoManual, setMotivoManual] = useState('');
  const [descManual, setDescManual] = useState('');
  const [savingMotivoManual, setSavingMotivoManual] = useState(false);
  const [pinManual, setPinManual] = useState('');
  const [pinError, setPinError] = useState('');

  // Solicitar exclusão de chamada (inclusão)
  const [solicitarExclusaoDialog, setSolicitarExclusaoDialog] = useState<{
    turmaId: string; turmaNome: string; data: string; presentes: number; total: number;
  } | null>(null);
  const [motivoExclusao, setMotivoExclusao] = useState('');

  const solicitarExclusaoMutation = useMutation({
    mutationFn: async (payload: any) => {
      const r = await fetch('/api/chamadas/solicitar-exclusao', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!r.ok) throw new Error('Falha ao enviar solicitação');
      return r.json();
    },
    onSuccess: () => {
      toast({ title: 'Solicitação enviada!', description: 'A solicitação de exclusão foi enviada para o administrador.' });
      setSolicitarExclusaoDialog(null);
      setMotivoExclusao('');
    },
    onError: () => {
      toast({ title: 'Erro', description: 'Não foi possível enviar a solicitação.', variant: 'destructive' });
    },
  });

  const hoje = getBrazilDateString();

  const { data: historicoChamadas = [], isLoading: historicoLoading, refetch: refetchHistorico } = useQuery({
    queryKey: historyQueryKey,
    queryFn: fetchHistorico,
    enabled: activeSection === 'presenca',
  });

  const pendentesChamadaCount = useMemo(
    () => historicoChamadas.filter((c: any) => chamadaEstaPendente(c)).length,
    [historicoChamadas]
  );

  const abrirHistoricoChamadas = (tab: "finalizadas" | "pendentes") => {
    setHistoricoTab(tab);
    setShowHistoricoChamadas(true);
    refetchHistorico();
  };

  const { data: excecoesData = [] } = useQuery<any[]>({
    queryKey: ['/api/turmas-inclusao/excecoes', chamadaTurmaId],
    queryFn: async () => {
      if (!chamadaTurmaId) return [];
      const r = await fetch(`/api/turmas-inclusao/${chamadaTurmaId}/excecoes`, { credentials: 'include' });
      if (!r.ok) return [];
      return r.json();
    },
    enabled: !!chamadaTurmaId && activeSection === 'presenca',
  });

  const { data: catracaLog, refetch: refetchCatracaLog } = useQuery<{ data: string; entradas: any[]; total: number }>({
    queryKey: ['/api/webhook/presenca-log'],
    enabled: activeSection === 'presenca',
  });

  const catracaNomesSet = useMemo(() => {
    const selectedTurma = turmasData?.find((t: any) => t.id.toString() === chamadaTurmaId);
    const entries = catracaLog?.entradas?.filter(
      (e: any) => selectedTurma ? e.turma === selectedTurma.nome && e.vertente === 'inclusao' : false
    ) || [];
    return new Set(entries.map((e: any) => e.nome).filter(Boolean));
  }, [catracaLog, chamadaTurmaId, turmasData]);

  useEffect(() => {
    if (activeSection !== 'presenca') return;
    const es = new EventSource("/api/webhook/presenca-events");
    es.onopen = () => setCatracaConnected(true);
    es.onerror = () => setCatracaConnected(false);
    es.onmessage = (event) => {
      if (event.data === "connected") {
        setCatracaConnected(true);
        return;
      }
      try {
        const data = JSON.parse(event.data);
        if (data.tipo === "presenca" && data.vertente === "inclusao") {
          refetchCatracaLog();
          queryClient.invalidateQueries({ queryKey: ['/api/presencas-inclusao/por-turma-data', chamadaTurmaId, chamadaData] });
          setCatracaApplied(false);
        }
      } catch (_) {}
    };
    return () => {
      es.close();
      setCatracaConnected(false);
    };
  }, [activeSection, chamadaTurmaId, chamadaData]);

  const { data: presencasExistentes } = useQuery<any[]>({
    queryKey: ['/api/presencas-inclusao/por-turma-data', chamadaTurmaId, chamadaData],
    queryFn: async () => {
      const res = await fetch(`/api/presencas-inclusao/por-turma-data?turmaId=${chamadaTurmaId}&data=${chamadaData}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Erro ao buscar presenças');
      return res.json();
    },
    enabled: !!chamadaTurmaId && !!chamadaData && activeSection === 'presenca' && !editingChamadaId,
  });

  const { data: existingPhotosData } = useQuery<{ urls: string[] }>({
    queryKey: ['/api/presencas-inclusao/fotos', chamadaTurmaId, chamadaData],
    queryFn: async () => {
      const res = await fetch(`/api/presencas-inclusao/fotos/${chamadaTurmaId}/${chamadaData}`, { credentials: 'include' });
      if (!res.ok) return { urls: [] };
      return res.json();
    },
    enabled: !!(editingChamadaId && chamadaTurmaId && chamadaData && existingFotoUrl),
    staleTime: 0,
  });
  const existingPhotoUrls: string[] = existingPhotosData?.urls || [];

  const prevTurmaIdRef = useRef<string>('');
  useEffect(() => {
    if (chamadaTurmaId && turmasData) {
      const turma = turmasData.find((t: any) => t.id.toString() === chamadaTurmaId);
      if (turma) {
        const todosDias = aplicarExcecoesNoCalendarioDeChamada(
          getDiasAulaParaTurma(turma),
          excecoesData
        );
        const datasComChamada = new Set(
          (historicoChamadas || [])
            .filter(
              (c: any) =>
                String(c.grupoId || c.turmaId) === String(chamadaTurmaId) &&
                chamadaOcupaDataLancamento(c)
            )
            .map((c: any) => normalizeToYMD(c.dataAtividade || c.data))
        );

        // Datas bloqueadas por exceções (cancelamento ou data_original de remanejamento)
        const datasExcecao = new Set<string>(
          (excecoesData as any[]).map((exc: any) => {
            const d = exc.data_original ?? exc.dataOriginal;
            return d instanceof Date ? d.toISOString().slice(0, 10) : String(d ?? '').slice(0, 10);
          }).filter(Boolean)
        );

        // Novas datas de remanejamentos que precisam ser adicionadas à lista
        const novasDatasRemanejamento: DiaAula[] = (excecoesData as any[])
          .filter((exc: any) => exc.tipo === 'remanejamento')
          .map((exc: any) => {
            const nd = exc.nova_data ?? exc.novaData;
            if (!nd) return null;
            const ymd = nd instanceof Date ? nd.toISOString().slice(0, 10) : String(nd).slice(0, 10);
            return { date: ymd, label: new Date(ymd + 'T12:00:00').toLocaleDateString('pt-BR'), dayOfWeek: 'Remanejado' };
          })
          .filter((d): d is DiaAula => d !== null);

        if (editingChamadaId && chamadaData) {
          const editingDate = chamadaData;
          let dias = todosDias.filter(d => (!datasComChamada.has(d.date) && !datasExcecao.has(d.date)) || d.date === editingDate);
          // Adiciona novas datas de remanejamento que ainda não têm chamada
          for (const nd of novasDatasRemanejamento) {
            if (!dias.some(d => d.date === nd.date) && !datasComChamada.has(nd.date)) {
              dias = [nd, ...dias];
            }
          }
          dias = dias.sort((a, b) => b.date.localeCompare(a.date));
          if (!dias.some(d => d.date === editingDate)) {
            const diaEditando = { date: editingDate, label: new Date(editingDate + 'T12:00:00').toLocaleDateString('pt-BR'), dayOfWeek: '' };
            setDiasAulaDisponiveis([diaEditando, ...dias]);
          } else {
            setDiasAulaDisponiveis(dias);
          }
        } else {
          let diasSemChamada = todosDias.filter(d => !datasComChamada.has(d.date) && !datasExcecao.has(d.date));
          // Adiciona novas datas de remanejamento que ainda não têm chamada
          for (const nd of novasDatasRemanejamento) {
            if (!diasSemChamada.some(d => d.date === nd.date) && !datasComChamada.has(nd.date)) {
              diasSemChamada = [nd, ...diasSemChamada];
            }
          }
          const diasPassadosAbertos = diasSemChamada.filter(d => d.date < hoje);
          const diaHojeAberto = diasSemChamada.find(d => d.date === hoje);
          const proximaAulaAberta = diasSemChamada.find(d => d.date > hoje);
          const dias = [
            ...diasPassadosAbertos,
            ...(diaHojeAberto ? [diaHojeAberto] : proximaAulaAberta ? [proximaAulaAberta] : []),
          ];

          setDiasAulaDisponiveis(dias);
          const turmaChanged = prevTurmaIdRef.current !== chamadaTurmaId;
          const dataPreferencial = pickChamadaDataPreferencial(
            diasSemChamada,
            hoje,
            turma.dataInicio ?? turma.data_inicio
          );
          if (turmaChanged) {
            prevTurmaIdRef.current = chamadaTurmaId;
            setChamadaData(dataPreferencial);
          } else if (chamadaData && !dias.some(d => d.date === chamadaData)) {
            setChamadaData(dataPreferencial);
          }
        }
      }
    } else {
      setDiasAulaDisponiveis([]);
      setChamadaData('');
      prevTurmaIdRef.current = '';
    }
  }, [chamadaTurmaId, turmasData, historicoChamadas, editingChamadaId, excecoesData]);


  const { data: alunosChamada = [], isLoading: alunosChamadaLoading } = useQuery({
    queryKey: ['presenca-inclusao-participantes', chamadaTurmaId, chamadaData],
    queryFn: () => fetchParticipantes(chamadaTurmaId, chamadaData),
    enabled: !!chamadaTurmaId && !!chamadaData && activeSection === 'presenca',
  });

  useEffect(() => {
    if (editingChamadaId) return;
    if (alunosChamada.length > 0) {
      setCatracaApplied(false);
      setPresencas(alunosChamada.map((aluno: any) => ({
        participanteId: aluno.id || aluno.participante_id || aluno.participanteId,
        nome: aluno.nome || aluno.nome_completo || aluno.nomeCompleto,
        cpf: aluno.cpf,
        presente: false
      })));
    }
  }, [alunosChamada, editingChamadaId]);

  // Quando editando: mescla a lista salva com todos os participantes da turma
  // para que alunos ausentes que não foram salvos também apareçam
  const mergedForEditRef = useRef<number | null>(null);
  useEffect(() => {
    if (!editingChamadaId) { mergedForEditRef.current = null; return; }
    if (mergedForEditRef.current === editingChamadaId) return;
    if (!alunosChamada || alunosChamada.length === 0) return;
    if (presencas.length === 0) return;

    const savedIds = new Set(presencas.map((p: PresencaItem) => p.participanteId));
    const missing = alunosChamada
      .filter((aluno: any) => {
        const id = aluno.id || aluno.participante_id || aluno.participanteId;
        return id && !savedIds.has(id);
      })
      .map((aluno: any) => ({
        participanteId: aluno.id || aluno.participante_id || aluno.participanteId,
        nome: aluno.nome || aluno.nome_completo || aluno.nomeCompleto,
        cpf: aluno.cpf,
        presente: false as boolean,
        justificativa: undefined,
      }));

    mergedForEditRef.current = editingChamadaId;
    if (missing.length > 0) {
      setPresencas((prev: PresencaItem[]) => [...prev, ...missing]);
    }
  }, [editingChamadaId, alunosChamada.length, presencas.length]);

  useEffect(() => {
    if (editingChamadaId) return;
    if (!presencasExistentes || presencasExistentes.length === 0) {
      if (!catracaApplied) return;
      return;
    }
    if (presencas.length === 0) return;

    const catracaMap = new Map(presencasExistentes.map(p => [p.participanteId, p]));
    if (catracaMap.size === 0) return;

    const presencaCount = presencasExistentes.length;
    const currentPresentCount = presencas.filter(p => p.presente).length;
    if (catracaApplied && presencaCount === currentPresentCount) return;

    const updated = presencas.map(p => {
      const catracaEntry = catracaMap.get(p.participanteId);
      if (catracaEntry) {
        return {
          ...p,
          presente: catracaEntry.presente ?? true,
          hora: catracaEntry.hora,
          viaCatraca: catracaEntry.viaCatraca,
          justificativa: catracaEntry.justificativa,
        };
      }
      return p;
    });

    setCatracaApplied(true);
    setPresencas(updated);
  }, [presencasExistentes, presencas.length, editingChamadaId]);

  useEffect(() => {
    if (!editingChamadaId) return;
    if (presencas.length === 0) return;
    if (catracaNomesSet.size === 0) return;

    setPresencas((prev) => {
      let changed = false;
      const next = prev.map((p) => {
        if (p.presente === true) return p;
        if (p.viaCatraca === true || catracaNomesSet.has(p.nome)) {
          changed = true;
          return {
            ...p,
            presente: true,
            viaCatraca: true,
            justificativa: undefined,
          };
        }
        return p;
      });
      return changed ? next : prev;
    });
  }, [editingChamadaId, catracaNomesSet, presencas.length]);

  const MOTIVOS_FALTA = [
    { label: 'Atestado médico', contaComoPresenca: true },
    { label: 'Doença', contaComoPresenca: true },
    { label: 'Guarda compartilhada', contaComoPresenca: true },
    { label: 'Escola / Conflito de horário', contaComoPresenca: true },
    { label: 'Trabalho', contaComoPresenca: true },
    { label: 'Transporte', contaComoPresenca: false },
    { label: 'Família', contaComoPresenca: false },
    { label: 'Compromisso pessoal', contaComoPresenca: false },
    { label: 'Chuva/Clima', contaComoPresenca: false },
    { label: 'Outro', contaComoPresenca: false },
    { label: 'Sem justificativa', contaComoPresenca: false },
  ];

  const saveChamadaMutation = useMutation({
    mutationFn: async (params?: { teveAlimentacao?: boolean }) => {
      const teveAlimentacao = params?.teveAlimentacao ?? false;
      if (!chamadaTurmaId || !chamadaData) {
        throw new Error("Selecione uma turma e data");
      }
      if (requireFoto && fotoFiles.length === 0 && !existingFotoUrl) {
        throw new Error("É obrigatório enviar ao menos uma foto comprovante para finalizar a chamada.");
      }
      const presencasPayload = presencas.map(p => {
        const pendingJust = pendingJustRef.current[p.participanteId];
        const justif = pendingJust?.motivo || p.justificativa || (!modoManual && !p.presente ? 'Sem justificativa' : '');
        const justifObs = pendingJust?.obs || '';
        const motivoInfo = MOTIVOS_FALTA.find(m => m.label === justif);
        const contaComoPresenca = !p.presente && (pendingJust?.contaComoPresenca ?? motivoInfo?.contaComoPresenca ?? false);
        return {
          participanteId: p.participanteId,
          presente: p.presente,
          justificativa: justif,
          justificativaMotivo: !p.presente ? justif : null,
          justificativaObs: !p.presente && justifObs ? justifObs : null,
          contaComoPresenca,
          status: !p.presente && justif && justif !== 'Sem justificativa' ? 'falta_justificada' : (p.presente ? 'presente' : 'falta')
        };
      });

      if (editingChamadaId) {
        return editPresenca({
          turmaId: parseInt(chamadaTurmaId),
          data: chamadaData,
          teveAlimentacao: editingTeveAlimentacao,
          presencas: presencasPayload,
        });
      } else {
        return savePresenca({
          turmaId: parseInt(chamadaTurmaId),
          data: chamadaData,
          teveAlimentacao,
          presencas: presencasPayload,
        });
      }
    },
    onSuccess: async () => {
      const filesToUpload = fotoFilesRef.current;
      if (filesToUpload.length > 0 && chamadaTurmaId && chamadaData) {
        try {
          const formData = new FormData();
          for (const f of filesToUpload) formData.append('foto', f);
          formData.append('turmaId', chamadaTurmaId);
          formData.append('data', chamadaData);
          await uploadFoto(formData);
        } catch (e) {
          console.error('Erro ao enviar fotos comprovante:', e);
        }
        fotoFilesRef.current = [];
        setFotoFiles([]);
      }
      queryClient.invalidateQueries({ queryKey: historyQueryKey });
      toast({ title: editingChamadaId ? "Chamada atualizada!" : "Chamada finalizada!", description: "Presenças registradas com sucesso." });
      setChamadaTurmaId('');
      setPresencas([]);
      setExistingFotoUrl(null);
      setEditingChamadaId(null);
      setEditingTeveAlimentacao(null);
      setCatracaApplied(false);
      setModoManual(false);
      pendingJustRef.current = {};
    },
    onError: (error: any) => {
      toast({ title: "Erro ao salvar chamada", description: error.message || "Não foi possível salvar a chamada. Tente novamente.", variant: "destructive" });
    }
  });

  return (
    <>
    <Card>
      <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-2 pb-3">
        <CardTitle className="flex items-center gap-2 flex-wrap text-base">
          <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
          Controle de Presença
          {catracaConnected ? (
            <Badge variant="outline" className="text-green-600 border-green-300 bg-green-50 text-[10px] px-1.5 py-0">
              <Wifi className="w-3 h-3 mr-0.5 inline" />
              Catraca Online
            </Badge>
          ) : (
            <Badge variant="outline" className="text-gray-400 border-gray-200 text-[10px] px-1.5 py-0">
              <WifiOff className="w-3 h-3 mr-0.5 inline" />
              Catraca Offline
            </Badge>
          )}
        </CardTitle>
        <ChamadaPresencaNavButtons
          modoHistorico={showHistoricoChamadas}
          pendentesCount={pendentesChamadaCount}
          onNovaChamada={() => {
            setShowHistoricoChamadas(false);
            setEditingChamadaId(null);
          }}
          onVerHistorico={() => abrirHistoricoChamadas("finalizadas")}
          onVerPendentes={() => abrirHistoricoChamadas("pendentes")}
        />
      </CardHeader>
      <CardContent>
        {!showHistoricoChamadas ? (
          <div className="space-y-4">
            <div className="flex gap-4 items-end flex-wrap">
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-medium mb-2">Turma</label>
                <Select value={chamadaTurmaId} onValueChange={(val) => { setChamadaTurmaId(val); setCatracaApplied(false); setModoManual(false); }}>
                  <SelectTrigger data-testid="select-presenca-turma">
                    <SelectValue placeholder="Selecione a turma" />
                  </SelectTrigger>
                  <SelectContent>
                    <div className="px-2 pb-1 pt-1 sticky top-0 bg-white z-10" onKeyDown={e => e.stopPropagation()}>
                      <input
                        className="w-full rounded border border-gray-200 px-2 py-1 text-sm outline-none focus:border-blue-400"
                        placeholder="Pesquisar turma..."
                        value={presencaTurmaBusca}
                        onChange={e => setPresencaTurmaBusca(e.target.value)}
                        onKeyDown={e => e.stopPropagation()}
                      />
                    </div>
                    {turmasData && turmasData.length > 0 ? (
                      turmasData
                        .filter((t: any) => {
                          const s = (t.status || '').toLowerCase();
                          const ativa = s === 'emandamento' || s === 'em_andamento' || s === 'em andamento' || s === 'em-andamento' || s === 'ativo' || s === 'ativa';
                          if (!ativa) return false;
                          if (presencaTurmaBusca) return (t.nome || '').toLowerCase().includes(presencaTurmaBusca.toLowerCase());
                          return true;
                        })
                        .map((turma: any) => {
                          const temCatraca = turma.temCatraca || catracaLog?.entradas?.some(e => e.turma === turma.nome && e.vertente === 'inclusao');
                          return (
                            <SelectItem key={turma.id} value={turma.id.toString()}>
                              <span className="flex items-center gap-2">
                                {turma.nome}
                                {temCatraca && (
                                  <Badge className="bg-blue-100 text-blue-700 text-[10px] px-1 py-0">
                                    <Zap className="w-2.5 h-2.5 mr-0.5 inline" />
                                    Catraca
                                  </Badge>
                                )}
                              </span>
                            </SelectItem>
                          );
                        })
                    ) : (
                      <SelectItem value="no-turmas" disabled>Nenhuma turma disponível</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-medium mb-2">Data da Aula</label>
                <Select value={chamadaData} onValueChange={(val) => { setChamadaData(val); setCatracaApplied(false); }} disabled={!chamadaTurmaId || !!editingChamadaId}>
                  <SelectTrigger data-testid="select-presenca-data">
                    <SelectValue placeholder={chamadaTurmaId ? "Selecione a data" : "Selecione a turma primeiro"} />
                  </SelectTrigger>
                  <SelectContent>
                    {diasAulaDisponiveis.length > 0 ? (
                      diasAulaDisponiveis.map((dia) => (
                        <SelectItem key={dia.date} value={dia.date}>
                          {dia.date === hoje ? `📍 Hoje - ${dia.label} (${dia.dayOfWeek})` : `${dia.label} (${dia.dayOfWeek})`}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-dias" disabled>
                        {chamadaTurmaId ? "Nenhum dia de aula configurado" : "Selecione uma turma"}
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              {chamadaTurmaId && (
                <div className="flex items-center gap-2 flex-wrap">
                  {editingChamadaId ? (
                    <div className="flex flex-col gap-2 w-full">
                      {existingPhotoUrls.length > 0 && (
                        <div className="flex flex-col gap-1">
                          <span className="text-xs text-gray-500">{existingPhotoUrls.length} foto(s) salva(s):</span>
                          <div className="flex gap-1 flex-wrap">
                            {existingPhotoUrls.map((url, i) => (
                              <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                                <img src={url} alt={`Foto ${i+1}`} className="w-14 h-14 rounded object-cover border hover:opacity-80 transition-opacity" />
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                      {existingFotoUrl && existingPhotoUrls.length === 0 && (
                        <div className="flex items-center gap-1">
                          <img src={existingFotoUrl} alt="Foto" className="w-10 h-10 rounded object-cover border" />
                          <span className="text-xs text-gray-500">Foto atual</span>
                        </div>
                      )}
                      {fotoFiles.length > 0 && (
                        <div className="flex gap-1 flex-wrap">
                          {fotoFiles.map((f, i) => (
                            <div key={i} className="relative">
                              <img src={URL.createObjectURL(f)} alt={`Foto ${i+1}`} className="w-10 h-10 rounded object-cover border" />
                              <button onClick={() => setFotoFiles(prev => { const next = prev.filter((_, idx) => idx !== i); fotoFilesRef.current = next; return next; })} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px]">×</button>
                            </div>
                          ))}
                        </div>
                      )}
                      <label className="flex items-center gap-2 cursor-pointer border rounded-lg px-3 py-2 text-sm hover:bg-gray-50 w-fit">
                        <Camera className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-600">{fotoFiles.length > 0 ? `${fotoFiles.length} nova(s) — adicionar mais` : existingFotoUrl ? 'Adicionar mais fotos' : 'Adicionar fotos comprovante'}</span>
                        <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => { const sel = Array.from(e.target.files || []); setFotoFiles(prev => { const next = [...prev, ...sel]; fotoFilesRef.current = next; return next; }); e.target.value = ''; }} />
                      </label>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2 w-full">
                      {fotoFiles.length > 0 && (
                        <div className="flex gap-1 flex-wrap">
                          {fotoFiles.map((f, i) => (
                            <div key={i} className="relative">
                              <img src={URL.createObjectURL(f)} alt={`Foto ${i+1}`} className="w-10 h-10 rounded object-cover border" />
                              <button onClick={() => setFotoFiles(prev => { const next = prev.filter((_, idx) => idx !== i); fotoFilesRef.current = next; return next; })} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px]">×</button>
                            </div>
                          ))}
                        </div>
                      )}
                      <label className="flex items-center gap-2 cursor-pointer border rounded-lg px-3 py-2 text-sm hover:bg-gray-50 w-fit">
                        <Camera className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-600">{fotoFiles.length > 0 ? `${fotoFiles.length} foto(s) — adicionar mais` : 'Fotos comprovante *'}</span>
                        <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => { const sel = Array.from(e.target.files || []); setFotoFiles(prev => { const next = [...prev, ...sel]; fotoFilesRef.current = next; return next; }); e.target.value = ''; }} />
                      </label>
                    </div>
                  )}
                </div>
              )}
              <Button
                  className="bg-green-500 hover:bg-green-600 w-full"
                  onClick={() => {
                    const ausentes = presencas.filter(p => !p.presente && !p.viaCatraca && !catracaNomesSet.has(p.nome));
                    if (ausentes.length > 0) {
                      const items = ausentes.map(a => ({
                        participanteId: a.participanteId,
                        nome: a.nome,
                        motivo: a.justificativa || 'Sem justificativa',
                        obs: ''
                      }));
                      setModalJustItems(items);
                      setShowJustificativaModal(true);
                    } else {
                      pendingJustRef.current = {};
                      if (editingChamadaId) {
                        saveChamadaMutation.mutate({});
                      } else {
                        setShowAlimentacaoModal(true);
                      }
                    }
                  }}
                  disabled={!chamadaTurmaId || presencas.length === 0 || saveChamadaMutation.isPending}
                  data-testid="button-finalizar-chamada"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  {saveChamadaMutation.isPending ? 'Salvando...' : editingChamadaId ? 'Atualizar Presenças' : 'Finalizar Chamada'}
                </Button>
              {editingChamadaId && (
                <div className="border rounded-lg p-3 space-y-1">
                  <p className="text-xs font-medium text-gray-600 flex items-center gap-1">
                    <Utensils className="w-3.5 h-3.5" />
                    Teve alimentação nessa aula?
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingTeveAlimentacao(true)}
                      className={`flex-1 py-1.5 text-xs rounded-md border font-medium transition-colors ${editingTeveAlimentacao === true ? 'bg-green-100 border-green-500 text-green-700' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                    >
                      ✓ Sim, teve
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingTeveAlimentacao(false)}
                      className={`flex-1 py-1.5 text-xs rounded-md border font-medium transition-colors ${editingTeveAlimentacao === false ? 'bg-red-50 border-red-400 text-red-600' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                    >
                      ✗ Não teve
                    </button>
                  </div>
                  {editingTeveAlimentacao === null && (
                    <p className="text-xs text-amber-600">Não definido (chamada antiga)</p>
                  )}
                </div>
              )}
              {editingChamadaId && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditingChamadaId(null);
                    setEditingTeveAlimentacao(null);
                    setChamadaTurmaId('');
                    setChamadaData('');
                    setPresencas([]);
                    fotoFilesRef.current = [];
                    setFotoFiles([]);
                    setExistingFotoUrl(null);
                    setCatracaApplied(false);
                    setModoManual(false);
                  }}
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancelar Edição
                </Button>
              )}
            </div>

            {chamadaTurmaId && (
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 p-3 rounded-lg border bg-gray-50">
                <div className="flex items-center gap-2 flex-1 flex-wrap">
                  {modoManual ? (
                    <>
                      <Hand className="w-4 h-4 text-orange-500 shrink-0" />
                      <span className="text-sm font-medium text-orange-700">Modo Manual</span>
                      <span className="text-xs text-gray-500">- Marque presença manualmente</span>
                    </>
                  ) : (
                    <>
                      <ScanFace className="w-4 h-4 text-blue-500 shrink-0" />
                      <span className="text-sm font-medium text-blue-700">Chamada Facial / Catraca</span>
                      {presencasExistentes && presencasExistentes.some(p => p.viaCatraca) && (
                        <Badge className="bg-blue-100 text-blue-700 text-[10px] px-1.5">
                          <Zap className="w-2.5 h-2.5 mr-0.5 inline" />
                          {presencasExistentes.filter(p => p.viaCatraca).length} entrada{presencasExistentes.filter(p => p.viaCatraca).length !== 1 ? 's' : ''}
                        </Badge>
                      )}
                    </>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Button
                    size="sm"
                    className="bg-yellow-400 hover:bg-yellow-300 text-black font-semibold"
                    onClick={() => setShowScanner(true)}
                  >
                    <ScanFace className="w-4 h-4 mr-1" />
                    Chamada O Grito
                  </Button>
                  <Button
                    variant={modoManual ? "default" : "outline"}
                    size="sm"
                    className={modoManual ? "bg-orange-500 hover:bg-orange-600 text-white" : "text-black hover:bg-gray-100 hover:text-black"}
                    onClick={() => {
                      if (modoManual) {
                        setModoManual(false);
                      } else {
                        setMotivoManual('');
                        setShowModoManualDialog(true);
                      }
                    }}
                  >
                    {modoManual ? (
                      <>
                        <ScanFace className="w-4 h-4 mr-1" />
                        Voltar p/ Facial
                      </>
                    ) : (
                      <>
                        <Hand className="w-4 h-4 mr-1" />
                        Chamada Manual
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {showScanner && chamadaTurmaId && chamadaData && (
              <Suspense fallback={
                <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center">
                  <div className="bg-slate-900 rounded-2xl border border-slate-700 p-8 flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                    <p className="text-slate-300 text-sm">Iniciando scanner...</p>
                  </div>
                </div>
              }>
                <ScannerPresencaModal
                  turmaId={chamadaTurmaId}
                  tipo="inclusao"
                  data={chamadaData}
                  onClose={() => setShowScanner(false)}
                  onFinalize={() => {
                    setCatracaApplied(false);
                    refetchCatracaLog();
                    queryClient.invalidateQueries({ queryKey: ['/api/presencas-inclusao/por-turma-data', chamadaTurmaId, chamadaData] });
                  }}
                  onPresencaRegistrada={(cpf: string) => {
                    const hora = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                    const cpfNorm = (v: unknown) => String(v ?? '').replace(/\D/g, '');
                    setPresencas((prev) =>
                      prev.map((p) =>
                        cpfNorm(p.cpf) === cpfNorm(cpf)
                          ? { ...p, presente: true, viaCatraca: true, hora }
                          : p
                      )
                    );
                    setCatracaApplied(false);
                    queryClient.invalidateQueries({ queryKey: ['/api/presencas-inclusao/por-turma-data', chamadaTurmaId, chamadaData] });
                  }}
                />
              </Suspense>
            )}

            {chamadaTurmaId && (
              <div className="border rounded-lg p-4">
                {(() => {
                  const selectedTurma = turmasData?.find((t: any) => t.id.toString() === chamadaTurmaId);
                  const turmaEntries = catracaLog?.entradas?.filter((e: any) => selectedTurma ? e.turma === selectedTurma.nome && e.vertente === 'inclusao' : false) || [];
                  const totalCatracaEntries = turmaEntries.length;
                  const countScanner = turmaEntries.filter((e: any) => e.fonte === 'scanner').length;
                  const countCatraca = turmaEntries.filter((e: any) => e.fonte !== 'scanner').length;
                  return (
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold flex items-center gap-2">
                        Lista de Presença - {selectedTurma?.nome || 'Turma'}
                        {editingChamadaId && <Badge className="ml-2 bg-yellow-500">Editando</Badge>}
                        {alunosChamadaLoading && <span className="text-sm text-gray-500 ml-2">Carregando...</span>}
                      </h3>
                      {totalCatracaEntries > 0 && (
                        <div className="flex items-center gap-2">
                          {countScanner > 0 && (
                            <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-xs px-2 py-0.5">
                              <Zap className="w-3 h-3 mr-1 inline" />
                              {countScanner} via scanner
                            </Badge>
                          )}
                          {countCatraca > 0 && (
                            <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-xs px-2 py-0.5">
                              <Zap className="w-3 h-3 mr-1 inline" />
                              {countCatraca} via catraca
                            </Badge>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs"
                            onClick={() => refetchCatracaLog()}
                          >
                            <RefreshCw className="w-3 h-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })()}
                {alunosChamadaLoading ? (
                  <div className="text-center py-4 text-gray-500">Carregando participantes...</div>
                ) : presencas.length === 0 ? (
                  <div className="text-center py-4 text-gray-500">
                    <Users className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <p>Nenhum participante nesta turma.</p>
                    <p className="text-sm">Adicione participantes na seção "Participantes".</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {(() => {
                      const selectedTurma = turmasData?.find((t: any) => t.id.toString() === chamadaTurmaId);
                      const catracaEntriesForTurma = catracaLog?.entradas?.filter(
                        (e: any) => selectedTurma ? e.turma === selectedTurma.nome && e.vertente === 'inclusao' : false
                      ) || [];
                      const catracaByName = new Map<string, string>();
                      for (const entry of catracaEntriesForTurma) {
                        if (entry.nome && entry.hora && !catracaByName.has(entry.nome)) {
                          catracaByName.set(entry.nome, entry.hora);
                        }
                      }
                      return [...presencas]
                        .sort((a, b) => (a.nome || '').localeCompare(b.nome || '', 'pt-BR'))
                        .map((aluno) => {
                          const originalIndex = presencas.findIndex(p => p.participanteId === aluno.participanteId);
                          const catracaHora = aluno.viaCatraca && aluno.hora ? aluno.hora : catracaByName.get(aluno.nome) || null;
                          const hasCatracaEntry = !!(aluno.viaCatraca || catracaByName.has(aluno.nome));
                          return (
                            <div key={aluno.participanteId} className={`flex items-center justify-between p-3 border rounded flex-wrap gap-2 ${hasCatracaEntry ? 'border-blue-200 bg-blue-50/30' : ''} ${!modoManual && !hasCatracaEntry && !aluno.presente ? 'opacity-60' : ''}`}>
                              <div className="flex items-center gap-3">
                                <User className="w-4 h-4 text-gray-400" />
                                <span>{aluno.nome}</span>
                                {catracaHora && (
                                  <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50 text-[10px] px-1.5">
                                    <Zap className="w-2.5 h-2.5 mr-0.5 inline" />
                                    Entrou {catracaHora}
                                  </Badge>
                                )}
                              </div>
                            {modoManual || editingChamadaId ? (
                              <div className="flex items-center gap-4">
                                <label className="flex items-center gap-2 cursor-pointer">
                                  <input
                                    type="radio"
                                    name={`presenca-${aluno.participanteId}`}
                                    checked={aluno.presente === true}
                                    onChange={() => {
                                      const newPresencas = [...presencas];
                                      newPresencas[originalIndex] = { ...aluno, presente: true, justificativa: undefined };
                                      setPresencas(newPresencas);
                                    }}
                                    className="w-4 h-4 text-green-600"
                                  />
                                  <span className="text-sm text-green-600">Presente</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                  <input
                                    type="radio"
                                    name={`presenca-${aluno.participanteId}`}
                                    checked={aluno.presente === false}
                                    onChange={() => {
                                      const newPresencas = [...presencas];
                                      newPresencas[originalIndex] = { ...aluno, presente: false };
                                      setPresencas(newPresencas);
                                    }}
                                    className="w-4 h-4 text-red-600"
                                  />
                                  <span className="text-sm text-red-600">Falta</span>
                                </label>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                {aluno.presente || hasCatracaEntry ? (
                                  <Badge className="bg-green-100 text-green-700 border-green-200">
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    Presente
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="text-gray-400 border-gray-200">
                                    Aguardando catraca
                                  </Badge>
                                )}
                              </div>
                            )}
                            {aluno.presente === false && (modoManual || editingChamadaId) && (
                              <div className="w-full mt-1 space-y-1">
                                <div className="flex flex-wrap gap-1">
                                  {['Doença', 'Atestado médico', 'Escola', 'Trabalho', 'Transporte', 'Família', 'Compromisso pessoal', 'Chuva/Clima', 'Outro', 'Sem justificativa'].map((opcao) => (
                                    <button
                                      key={opcao}
                                      type="button"
                                      onClick={() => {
                                        const newPresencas = [...presencas];
                                        newPresencas[originalIndex] = { ...aluno, justificativa: opcao };
                                        setPresencas(newPresencas);
                                      }}
                                      className={`px-2 py-0.5 text-xs rounded-full border transition-colors ${opcao === 'Sem justificativa' ? (aluno.justificativa === opcao ? 'bg-red-100 border-red-400 text-red-700' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100') : (aluno.justificativa === opcao ? 'bg-blue-100 border-blue-400 text-blue-700' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100')}`}
                                    >
                                      {opcao}
                                    </button>
                                  ))}
                                </div>
                                <Input
                                  placeholder="Ou escreva a justificativa..."
                                  value={aluno.justificativa || ''}
                                  onChange={(e) => {
                                    const newPresencas = [...presencas];
                                    newPresencas[originalIndex] = { ...aluno, justificativa: e.target.value };
                                    setPresencas(newPresencas);
                                  }}
                                  className="h-8 text-sm"
                                />
                              </div>
                            )}
                          </div>
                        );
                      });
                    })()}
                  </div>
                )}
              </div>
            )}

            {!chamadaTurmaId && (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>Selecione uma turma para fazer a chamada</p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Histórico de Chamadas</h3>
            </div>

            {/* Abas Finalizadas / Pendentes */}
            {(() => {
              const totalFinalizadas = (historicoChamadas || []).filter((r: any) =>
                r.fotoComprovante || r.foto_comprovante || (r.presencas || []).some((p: any) => p.fotoComprovante)
              ).length;
              const totalPendentes = (historicoChamadas || []).filter((r: any) =>
                !r.fotoComprovante && !r.foto_comprovante && !(r.presencas || []).some((p: any) => p.fotoComprovante)
              ).length;
              return (
                <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setHistoricoTab('finalizadas')}
                    className={`flex-1 text-xs font-medium py-2 px-3 rounded-md transition-colors flex items-center justify-center gap-1.5 ${historicoTab === 'finalizadas' ? 'bg-white text-green-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    Finalizadas
                    {totalFinalizadas > 0 && <span className="bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full text-[10px]">{totalFinalizadas}</span>}
                  </button>
                  <button
                    onClick={() => setHistoricoTab('pendentes')}
                    className={`flex-1 text-xs font-medium py-2 px-3 rounded-md transition-colors flex items-center justify-center gap-1.5 ${historicoTab === 'pendentes' ? 'bg-white text-amber-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    Pendentes
                    {totalPendentes > 0 && <span className="bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full text-[10px]">{totalPendentes}</span>}
                  </button>
                </div>
              );
            })()}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <label className="text-sm font-medium">Turma</label>
                <Select value={historicoFiltroTurma} onValueChange={(v) => { setHistoricoFiltroTurma(v); setHistoricoTurmaBusca(''); setHistoricoFiltroDia(''); }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as turmas" />
                  </SelectTrigger>
                  <SelectContent>
                    <div className="px-2 pb-1 pt-1 sticky top-0 bg-white z-10" onKeyDown={e => e.stopPropagation()}>
                      <input
                        className="w-full rounded border border-gray-200 px-2 py-1 text-sm outline-none focus:border-blue-400"
                        placeholder="Pesquisar turma..."
                        value={historicoTurmaBusca}
                        onChange={e => setHistoricoTurmaBusca(e.target.value)}
                        onKeyDown={e => e.stopPropagation()}
                      />
                    </div>
                    <SelectItem value="todas">Todas as turmas</SelectItem>
                    {(turmasData || [])
                      .filter((t: any) => !historicoTurmaBusca || (t.nome || '').toLowerCase().includes(historicoTurmaBusca.toLowerCase()))
                      .map((turma: any) => (
                        <SelectItem key={turma.id} value={turma.nome}>{turma.nome}</SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Dia de Aula</label>
                <Select
                  value={historicoFiltroDia}
                  onValueChange={setHistoricoFiltroDia}
                  disabled={!historicoFiltroTurma || historicoFiltroTurma === 'todas'}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={(!historicoFiltroTurma || historicoFiltroTurma === 'todas') ? 'Selecione uma turma primeiro' : 'Todos os dias'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os dias</SelectItem>
                    {Array.from(new Set(
                      (historicoChamadas || [])
                        .filter((r: any) => {
                          const tn = r.turmaNome || r.turma || r.grupo || '';
                          return !historicoFiltroTurma || historicoFiltroTurma === 'todas' || tn === historicoFiltroTurma;
                        })
                        .map((r: any) => normalizeToYMD(r.dataAtividade || r.data))
                        .filter(Boolean)
                    ))
                      .sort()
                      .map((dia: string) => (
                        <SelectItem key={dia} value={dia}>
                          {new Date(dia + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' })}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {historicoLoading ? (
              <div className="text-center py-8 text-gray-500">Carregando histórico...</div>
            ) : historicoChamadas.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>Nenhuma chamada registrada ainda.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {historicoChamadas
                  .filter((registro: any) => {
                    const turmaNome = registro.turmaNome || registro.turma || registro.grupo || '';
                    const dataAtividade = normalizeToYMD(registro.dataAtividade || registro.data);
                    const temFoto = !!(registro.fotoComprovante || registro.foto_comprovante || (registro.presencas || []).some((p: any) => p.fotoComprovante));

                    if (historicoTab === 'finalizadas' && !temFoto) return false;
                    if (historicoTab === 'pendentes' && temFoto) return false;
                    if (historicoFiltroTurma && historicoFiltroTurma !== 'todas' && turmaNome !== historicoFiltroTurma) {
                      return false;
                    }
                    if (historicoFiltroDia && historicoFiltroDia !== 'todos' && dataAtividade !== historicoFiltroDia) {
                      return false;
                    }
                    return true;
                  })
                  .map((registro: any) => {
                    const presentes = registro.totalPresentes ?? 0;
                    const total = registro.totalAlunos ?? presentes;
                    const dataAtividade = normalizeToYMD(registro.dataAtividade || registro.data);
                    return (
                      <div key={registro.id} className="border rounded-lg overflow-hidden">
                        <div
                          className="p-3 bg-gray-50 cursor-pointer hover:bg-gray-100"
                          onClick={() => setHistoricoExpandido(historicoExpandido === registro.id ? null : registro.id)}
                        >
                          {/* Linha 1: data + turma + chevron */}
                          <div className="flex items-center justify-between gap-2 mb-1.5">
                            <div className="flex items-center gap-2 min-w-0">
                              <Calendar className="w-4 h-4 text-gray-500 shrink-0" />
                              <span className="font-medium text-sm shrink-0">
                                {dataAtividade ? new Date(dataAtividade + 'T12:00:00').toLocaleDateString('pt-BR') : 'Sem data'}
                              </span>
                              <span className="text-gray-400 text-sm shrink-0">-</span>
                              <span className="text-sm truncate">{registro.turmaNome || registro.turma || registro.grupo}</span>
                            </div>
                            {historicoExpandido === registro.id ? (
                              <ChevronUp className="w-4 h-4 text-gray-500 shrink-0" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-gray-500 shrink-0" />
                            )}
                          </div>
                          {/* Linha 2: contadores + ações */}
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm text-green-600 font-medium">
                                {presentes}/{total} presentes
                              </span>
                              {registro.teveAlimentacao === true && (
                                <Badge className="bg-orange-100 text-orange-700 border-orange-200 text-xs">
                                  <Utensils className="w-3 h-3 mr-1" />
                                  Alimentação
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              {(registro.fotoComprovante || registro.foto_comprovante || (registro.presencas || []).some((p: any) => p.fotoComprovante)) && (() => {
                                const rawFoto = registro.fotoComprovante || registro.foto_comprovante || (registro.presencas || []).find((p: any) => p.fotoComprovante)?.fotoComprovante || '';
                                let fotoCount = 1;
                                try { const arr = JSON.parse(rawFoto); if (Array.isArray(arr)) fotoCount = arr.length; } catch {}
                                const turmaId = String(registro.grupoId || registro.turmaId);
                                return (
                                  <button
                                    onClick={async (e) => {
                                      e.stopPropagation();
                                      setFotosGaleriaLoading(true);
                                      try {
                                        const r = await fetch(`/api/presencas-inclusao/fotos/${turmaId}/${dataAtividade}`, { credentials: 'include' });
                                        const d = await r.json();
                                        setFotosGaleriaDialog({ turmaId, data: dataAtividade, urls: d.urls || [] });
                                      } catch { setFotosGaleriaDialog({ turmaId, data: dataAtividade, urls: [] }); }
                                      setFotosGaleriaLoading(false);
                                    }}
                                    className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
                                    title="Ver fotos comprovante"
                                  >
                                    <Camera className="w-3.5 h-3.5" />
                                    {fotoCount > 1 ? `${fotoCount} fotos` : 'Foto'}
                                  </button>
                                );
                              })()}
                              {(() => {
                                const temFoto = !!(registro.fotoComprovante || registro.foto_comprovante || (registro.presencas || []).some((p: any) => p.fotoComprovante));
                                const isPendente = !temFoto;
                                return (
                                  <Button
                                    variant={isPendente ? "default" : "ghost"}
                                    size="sm"
                                    className={isPendente ? "h-7 px-2 bg-amber-500 hover:bg-amber-600 text-white text-xs" : "h-7 px-2 text-xs"}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const turmaId = registro.grupoId || registro.turmaId;
                                      setChamadaTurmaId(String(turmaId));
                                      setChamadaData(dataAtividade || '');
                                      setEditingChamadaId(registro.id);
                                      setCatracaApplied(false);
                                      setEditingTeveAlimentacao(registro.teveAlimentacao ?? null);
                                      if (registro.presencas && registro.presencas.length > 0) {
                                        setPresencas(registro.presencas.map((p: any) => {
                                          const nome = p.alunoNome || p.nome || '';
                                          const marcouCatraca = p.viaCatraca === true || catracaNomesSet.has(nome);
                                          return {
                                          participanteId: p.participanteId || p.alunoId || p.id,
                                          nome,
                                          cpf: p.cpf || p.alunoCpf || '',
                                          presente: marcouCatraca || p.presente === true || p.status === 'presente',
                                          justificativa: p.justificativa || undefined,
                                          viaCatraca: marcouCatraca,
                                          };
                                        }));
                                      }
                                      const hasFoto = !!(registro.fotoComprovante || registro.foto_comprovante || (registro.presencas || []).find((p: any) => p.fotoComprovante)?.fotoComprovante);
                                      const fotoUrl = hasFoto ? `/api/presencas-inclusao/foto-serve/${turmaId}/${dataAtividade}` : null;
                                      setExistingFotoUrl(fotoUrl);
                                      fotoFilesRef.current = [];
                                      setFotoFiles([]);
                                      setShowHistoricoChamadas(false);
                                    }}
                                  >
                                    {isPendente ? (
                                      <>
                                        <CheckCircle className="w-3.5 h-3.5 mr-1" />
                                        Finalizar
                                      </>
                                    ) : (
                                      <>
                                        <Pencil className="w-3.5 h-3.5 mr-1" />
                                        Editar
                                      </>
                                    )}
                                  </Button>
                                );
                              })()}
                              {canSolicitarExclusao && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 px-2 text-red-600 hover:text-red-700 hover:bg-red-50 text-xs"
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    const turmaId = String(registro.grupoId || registro.turmaId);
                                    const temFoto = chamadaTemFotoComprovante(registro);
                                    if (!temFoto) {
                                      if (!confirm(`Excluir a chamada pendente de ${dataAtividade ? new Date(dataAtividade + 'T12:00:00').toLocaleDateString('pt-BR') : 'esta data'}?`)) return;
                                      try {
                                        await excluirChamadaPendente({
                                          tipo: "inclusao",
                                          turmaId: Number(turmaId),
                                          data: dataAtividade,
                                        });
                                        toast({ title: "Chamada excluída", description: "O registro pendente foi removido." });
                                        refetchHistorico();
                                        queryClient.invalidateQueries({ queryKey: historyQueryKey });
                                      } catch (err: any) {
                                        toast({
                                          title: "Erro ao excluir",
                                          description: err.message || "Não foi possível excluir.",
                                          variant: "destructive",
                                        });
                                      }
                                      return;
                                    }
                                    setSolicitarExclusaoDialog({
                                      turmaId,
                                      turmaNome: registro.turmaNome || registro.turma || registro.grupo || '',
                                      data: dataAtividade,
                                      presentes: registro.totalPresentes ?? 0,
                                      total: registro.totalAlunos ?? 0,
                                    });
                                    setMotivoExclusao('');
                                  }}
                                >
                                  <Trash2 className="w-3.5 h-3.5 mr-1" />
                                  Excluir
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>

                        {historicoExpandido === registro.id && registro.presencas && (
                          <div className="p-3 border-t bg-white">
                            <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                              <div className="text-sm font-medium text-gray-600">
                                Lista ({registro.presencas.length} participantes):
                              </div>
                              <button
                                onClick={() => setSoFaltasMap(prev => ({ ...prev, [registro.id]: !prev[registro.id] }))}
                                className={`flex items-center gap-1 text-xs px-2 py-1 rounded border transition-colors shrink-0 ${soFaltasMap[registro.id] ? 'bg-red-100 text-red-700 border-red-300 font-semibold' : 'bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200'}`}
                              >
                                <Filter className="w-3 h-3" />
                                {soFaltasMap[registro.id] ? 'Ver todos' : 'Só faltas'}
                              </button>
                            </div>
                            <div className="grid gap-1.5">
                              {[...registro.presencas]
                                .sort((a: any, b: any) => (a.alunoNome || a.nome || '').localeCompare(b.alunoNome || b.nome || '', 'pt-BR'))
                                .filter((p: any) => soFaltasMap[registro.id] ? !p.presente : true)
                                .map((p: any, idx: number) => {
                                const justif = p.justificativa || p.justificativaMotivo;
                                const isFaltaJustificada = !p.presente && justif && justif !== 'Sem justificativa';
                                return (
                                  <div key={idx} className={`flex items-start justify-between py-1.5 px-2 rounded text-sm ${p.presente ? 'bg-green-50' : isFaltaJustificada ? 'bg-yellow-50' : 'bg-red-50'}`}>
                                    <span className="font-medium">{p.alunoNome || p.nome}</span>
                                    <div className="flex flex-col items-end gap-0.5 ml-2 shrink-0">
                                      <span className={`text-xs font-semibold ${p.presente ? 'text-green-700' : isFaltaJustificada ? 'text-yellow-700' : 'text-red-700'}`}>
                                        {p.presente ? 'Presente' : isFaltaJustificada ? 'Falta Justificada' : 'Falta'}
                                      </span>
                                      {!p.presente && justif && (
                                        <span className="text-xs text-gray-500">{justif}</span>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                              {soFaltasMap[registro.id] && registro.presencas.filter((p: any) => !p.presente).length === 0 && (
                                <div className="text-center py-3 text-sm text-gray-500">Nenhuma falta registrada nesta aula.</div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        )}
      </CardContent>

      <Dialog open={showJustificativaModal} onOpenChange={setShowJustificativaModal}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <X className="w-5 h-5 text-red-500" />
              Justificar Faltas ({modalJustItems.length} aluno{modalJustItems.length !== 1 ? 's' : ''})
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-2 py-2">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-500">Selecione o motivo para cada ausência</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const firstMotivo = modalJustItems[0]?.motivo || 'Sem justificativa';
                  setModalJustItems(items => items.map(i => ({ ...i, motivo: firstMotivo })));
                }}
              >
                Aplicar para todos
              </Button>
            </div>

            {modalJustItems.map((item, idx) => (
              <div key={item.participanteId} className="border rounded-lg p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-400" />
                  <span className="font-medium text-sm">{item.nome}</span>
                  <Badge variant="outline" className="text-red-600 border-red-200 text-xs ml-auto">Falta</Badge>
                </div>
                <Select
                  value={item.motivo}
                  onValueChange={(val) => {
                    const info = MOTIVOS_FALTA.find(m => m.label === val);
                    setModalJustItems(items => items.map((i, j) => j === idx ? { ...i, motivo: val, contaComoPresenca: info?.contaComoPresenca ?? false } : i));
                  }}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Selecione o motivo" />
                  </SelectTrigger>
                  <SelectContent>
                    {MOTIVOS_FALTA.map(m => (
                      <SelectItem key={m.label} value={m.label}>{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {item.motivo && (
                  <div className="text-xs mt-1">
                    {MOTIVOS_FALTA.find(m => m.label === item.motivo)?.contaComoPresenca ? (
                      <span className="text-green-600 font-medium">✅ Conta como atendimento (pendente aprovação do coordenador)</span>
                    ) : (
                      <span className="text-gray-400">❌ Não conta para os indicadores</span>
                    )}
                  </div>
                )}
                <Textarea
                  placeholder="Observação (opcional)"
                  value={item.obs}
                  onChange={(e) => setModalJustItems(items => items.map((i, j) => j === idx ? { ...i, obs: e.target.value } : i))}
                  className="h-16 text-sm resize-none"
                />
              </div>
            ))}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowJustificativaModal(false)}>
              Cancelar
            </Button>
            <Button
              className="bg-green-500 hover:bg-green-600"
              onClick={() => {
                const allHaveMotivo = modalJustItems.every(i => i.motivo);
                if (!allHaveMotivo) {
                  toast({ title: "Preencha todos os motivos", variant: "destructive" });
                  return;
                }
                const justMap: Record<number, {motivo: string; obs: string; contaComoPresenca: boolean}> = {};
                for (const item of modalJustItems) {
                  justMap[item.participanteId] = { motivo: item.motivo, obs: item.obs, contaComoPresenca: item.contaComoPresenca ?? false };
                }
                pendingJustRef.current = justMap;
                setShowJustificativaModal(false);
                if (editingChamadaId) {
                  saveChamadaMutation.mutate({});
                } else {
                  setShowAlimentacaoModal(true);
                }
              }}
              disabled={saveChamadaMutation.isPending}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              {saveChamadaMutation.isPending ? 'Salvando...' : 'Salvar e Finalizar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>

    {/* Dialog de justificativa para ativar Chamada Manual */}
    <Dialog open={showModoManualDialog} onOpenChange={setShowModoManualDialog}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Hand className="w-5 h-5 text-orange-500" />
            Chamada Manual
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-sm text-orange-800">
            A chamada manual substitui o registro automático da catraca. O motivo ficará registrado para auditoria do coordenador.
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Motivo <span className="text-red-500">*</span></label>
            <Select value={motivoManual} onValueChange={setMotivoManual}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o motivo..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Catraca desativada">Catraca desativada</SelectItem>
                <SelectItem value="Aluno e/ou turma não cadastrada na catraca">Aluno e/ou turma não cadastrada na catraca</SelectItem>
                <SelectItem value="Falta de luz no instituto">Falta de luz no instituto</SelectItem>
                <SelectItem value="Outro">Outro</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Descreva brevemente o ocorrido <span className="text-red-500">*</span></label>
            <Textarea
              placeholder="Descreva brevemente o ocorrido..."
              value={descManual}
              onChange={(e) => setDescManual(e.target.value)}
              className="h-20 resize-none"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Senha do coordenador <span className="text-red-500">*</span></label>
            <input
              type="password"
              value={pinManual}
              onChange={(e) => { setPinManual(e.target.value); setPinError(''); }}
              placeholder="Senha alfanumérica"
              className={`w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 ${pinError ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
            />
            {pinError && <p className="text-xs text-red-600">{pinError}</p>}
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => { setShowModoManualDialog(false); setPinManual(''); setPinError(''); }} disabled={savingMotivoManual}>
            Cancelar
          </Button>
          <Button
            className="bg-orange-500 hover:bg-orange-600"
            disabled={!motivoManual || !descManual.trim() || !pinManual.trim() || savingMotivoManual}
            onClick={async () => {
              setSavingMotivoManual(true);
              setPinError('');
              try {
                const pinRes = await fetch('/api/presenca/validar-pin-manual', {
                  method: 'POST',
                  credentials: 'include',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ senha: pinManual, vertente: 'inclusao' }),
                });
                if (!pinRes.ok) {
                  setPinError('Senha incorreta ou expirada. Verifique com o coordenador.');
                  setSavingMotivoManual(false);
                  return;
                }
                await fetch('/api/chamada-manual-log', {
                  method: 'POST',
                  credentials: 'include',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    turmaId: chamadaTurmaId ? parseInt(chamadaTurmaId, 10) : null,
                    data: chamadaData || new Date().toISOString().slice(0, 10),
                    motivo: motivoManual,
                    observacao: descManual.trim(),
                    vertente: 'inclusao',
                    origem: origemManual,
                  }),
                });
                setShowModoManualDialog(false);
                setMotivoManual('');
                setDescManual('');
                setPinManual('');
                setPinError('');
                setModoManual(true);
              } catch (e) {
                console.error('Erro ao ativar modo manual:', e);
              } finally {
                setSavingMotivoManual(false);
              }
            }}
          >
            <Hand className="w-4 h-4 mr-2" />
            {savingMotivoManual ? 'Validando...' : 'Confirmar e Abrir Chamada Manual'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* Modal Alimentação */}
    <Dialog open={showAlimentacaoModal} onOpenChange={setShowAlimentacaoModal}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Utensils className="w-5 h-5 text-orange-500" />
            Alimentação na Chamada
          </DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">Houve distribuição de lanche nesta chamada?</p>
        </DialogHeader>
        <div className="flex flex-col gap-3 mt-2">
          <Button
            className="bg-orange-500 hover:bg-orange-600 text-white"
            onClick={() => {
              setShowAlimentacaoModal(false);
              saveChamadaMutation.mutate({ teveAlimentacao: true });
            }}
            disabled={saveChamadaMutation.isPending}
          >
            <Utensils className="w-4 h-4 mr-2" />
            Sim, teve lanche
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setShowAlimentacaoModal(false);
              saveChamadaMutation.mutate({ teveAlimentacao: false });
            }}
            disabled={saveChamadaMutation.isPending}
          >
            Não teve lanche
          </Button>
        </div>
      </DialogContent>
    </Dialog>

    {/* Dialog: Solicitar Exclusão de Chamada (Inclusão) */}
    <Dialog open={!!solicitarExclusaoDialog} onOpenChange={(o) => { if (!o) { setSolicitarExclusaoDialog(null); setMotivoExclusao(''); } }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="w-5 h-5" />
            Solicitar Exclusão de Chamada
          </DialogTitle>
        </DialogHeader>
        {solicitarExclusaoDialog && (
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 space-y-1 text-sm">
              <div><span className="font-medium">Turma:</span> {solicitarExclusaoDialog.turmaNome}</div>
              <div><span className="font-medium">Data:</span> {solicitarExclusaoDialog.data ? new Date(solicitarExclusaoDialog.data + 'T12:00:00').toLocaleDateString('pt-BR') : '-'}</div>
              <div><span className="font-medium">Presenças:</span> {solicitarExclusaoDialog.presentes}/{solicitarExclusaoDialog.total}</div>
            </div>
            <p className="text-sm text-gray-600">
              Esta solicitação será enviada para o administrador, que deverá confirmar a exclusão definitiva da chamada.
            </p>
            <div>
              <label className="text-sm font-medium block mb-1">Motivo <span className="text-red-500">*</span></label>
              <Textarea
                value={motivoExclusao}
                onChange={(e) => setMotivoExclusao(e.target.value)}
                placeholder="Descreva o motivo da exclusão..."
                className={`min-h-[80px] ${!motivoExclusao.trim() ? 'border-red-300' : ''}`}
              />
              {!motivoExclusao.trim() && (
                <p className="text-xs text-red-500 mt-1">O motivo é obrigatório.</p>
              )}
            </div>
          </div>
        )}
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => { setSolicitarExclusaoDialog(null); setMotivoExclusao(''); }}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            disabled={solicitarExclusaoMutation.isPending || !motivoExclusao.trim()}
            onClick={() => {
              if (!solicitarExclusaoDialog) return;
              solicitarExclusaoMutation.mutate({
                tipo: 'inclusao',
                referenciaId: null,
                turmaId: Number(solicitarExclusaoDialog.turmaId),
                dataChamada: solicitarExclusaoDialog.data,
                turmaNome: solicitarExclusaoDialog.turmaNome,
                presentes: solicitarExclusaoDialog.presentes,
                totalParticipantes: solicitarExclusaoDialog.total,
                motivo: motivoExclusao || null,
              });
            }}
          >
            {solicitarExclusaoMutation.isPending ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Trash2 className="w-4 h-4 mr-1" />}
            Enviar Solicitação
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* Galeria de fotos comprovante */}
    <Dialog open={!!fotosGaleriaDialog} onOpenChange={(o) => { if (!o) setFotosGaleriaDialog(null); }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="w-4 h-4" />
            Fotos Comprovante
          </DialogTitle>
        </DialogHeader>
        {fotosGaleriaLoading ? (
          <div className="flex justify-center py-8 text-gray-500">Carregando fotos...</div>
        ) : fotosGaleriaDialog?.urls.length === 0 ? (
          <div className="flex justify-center py-8 text-gray-400">Nenhuma foto encontrada.</div>
        ) : (
          <div className="grid grid-cols-2 gap-3 max-h-[70vh] overflow-y-auto py-2">
            {(fotosGaleriaDialog?.urls || []).map((url, i) => (
              <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="block">
                <img src={url} alt={`Foto ${i + 1}`} className="w-full rounded-lg object-cover border hover:opacity-90 transition-opacity" style={{ maxHeight: 300 }} />
                <span className="text-xs text-gray-400 mt-1 block text-center">Foto {i + 1}</span>
              </a>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
    </>
  );
}
