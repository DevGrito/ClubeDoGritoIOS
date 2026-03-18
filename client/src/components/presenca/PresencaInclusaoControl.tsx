import { useState, useEffect, useRef, useMemo } from "react";
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
  Utensils
} from "lucide-react";
import { getDiasAulaParaTurma, getBrazilDateString, type DiaAula } from "@/lib/class-days";

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
  fetchParticipantes: (turmaId: string) => Promise<any[]>;
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
}

const normalizeToYMD = (v: any) => {
  if (!v) return "";
  const s = String(v);
  return s.includes("T") ? s.split("T")[0] : s;
};

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
}: PresencaInclusaoControlProps) {
  const { toast } = useToast();

  const [chamadaTurmaId, setChamadaTurmaId] = useState('');
  const [chamadaData, setChamadaData] = useState('');
  const [diasAulaDisponiveis, setDiasAulaDisponiveis] = useState<DiaAula[]>([]);
  const [presencas, setPresencas] = useState<PresencaItem[]>([]);
  const [showHistoricoChamadas, setShowHistoricoChamadas] = useState(false);
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [existingFotoUrl, setExistingFotoUrl] = useState<string | null>(null);
  const [editingChamadaId, setEditingChamadaId] = useState<number | null>(null);
  const [editingTeveAlimentacao, setEditingTeveAlimentacao] = useState<boolean | null>(null);
  const [historicoFiltroTurma, setHistoricoFiltroTurma] = useState('');
  const [historicoFiltroDataInicio, setHistoricoFiltroDataInicio] = useState('');
  const [historicoFiltroDataFim, setHistoricoFiltroDataFim] = useState('');
  const [historicoExpandido, setHistoricoExpandido] = useState<number | null>(null);
  const [catracaApplied, setCatracaApplied] = useState(false);
  const [modoManual, setModoManual] = useState(false);
  const [catracaConnected, setCatracaConnected] = useState(false);

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

  const hoje = getBrazilDateString();

  const { data: historicoChamadas = [], isLoading: historicoLoading, refetch: refetchHistorico } = useQuery({
    queryKey: historyQueryKey,
    queryFn: fetchHistorico,
    enabled: activeSection === 'presenca',
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

  const prevTurmaIdRef = useRef<string>('');
  useEffect(() => {
    if (chamadaTurmaId && turmasData) {
      const turma = turmasData.find((t: any) => t.id.toString() === chamadaTurmaId);
      if (turma) {
        const todosDias = getDiasAulaParaTurma(turma);
        const datasComChamada = new Set(
          (historicoChamadas || [])
            .filter((c: any) => String(c.grupoId || c.turmaId) === String(chamadaTurmaId))
            .map((c: any) => normalizeToYMD(c.dataAtividade || c.data))
        );

        if (editingChamadaId && chamadaData) {
          const editingDate = chamadaData;
          const dias = todosDias.filter(d => !datasComChamada.has(d.date) || d.date === editingDate);
          if (!dias.some(d => d.date === editingDate)) {
            const diaEditando = { date: editingDate, label: new Date(editingDate + 'T12:00:00').toLocaleDateString('pt-BR'), dayOfWeek: '' };
            setDiasAulaDisponiveis([diaEditando, ...dias]);
          } else {
            setDiasAulaDisponiveis(dias);
          }
        } else {
          let dias = todosDias.filter(d => !datasComChamada.has(d.date));

          const hojeJaExiste = dias.some(d => d.date === hoje);
          const hojeJaTemChamada = datasComChamada.has(hoje);
          if (!hojeJaExiste && !hojeJaTemChamada) {
            const hojeDate = new Date(hoje + 'T12:00:00');
            const diasSemanaLabels = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
            dias = [{
              date: hoje,
              label: hojeDate.toLocaleDateString('pt-BR'),
              dayOfWeek: diasSemanaLabels[hojeDate.getDay()]
            }, ...dias];
          }

          setDiasAulaDisponiveis(dias);
          const turmaChanged = prevTurmaIdRef.current !== chamadaTurmaId;
          if (turmaChanged) {
            prevTurmaIdRef.current = chamadaTurmaId;
            if (dias.some(d => d.date === hoje)) {
              setChamadaData(hoje);
            } else if (dias.length > 0) {
              setChamadaData(dias[0].date);
            } else {
              setChamadaData('');
            }
          } else if (chamadaData && !dias.some(d => d.date === chamadaData)) {
            if (dias.length > 0) {
              setChamadaData(dias[0].date);
            } else {
              setChamadaData('');
            }
          }
        }
      }
    } else {
      setDiasAulaDisponiveis([]);
      setChamadaData('');
      prevTurmaIdRef.current = '';
    }
  }, [chamadaTurmaId, turmasData, historicoChamadas, editingChamadaId]);


  const { data: alunosChamada = [], isLoading: alunosChamadaLoading } = useQuery({
    queryKey: ['presenca-inclusao-participantes', chamadaTurmaId],
    queryFn: () => fetchParticipantes(chamadaTurmaId),
    enabled: !!chamadaTurmaId && activeSection === 'presenca',
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
      if (requireFoto && !fotoFile && !editingChamadaId) {
        throw new Error("É obrigatório enviar a foto comprovante para finalizar a chamada.");
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
      if (fotoFile && chamadaTurmaId && chamadaData) {
        try {
          const formData = new FormData();
          formData.append('foto', fotoFile);
          formData.append('turmaId', chamadaTurmaId);
          formData.append('data', chamadaData);
          await uploadFoto(formData);
        } catch (e) {
          console.error('Erro ao enviar foto comprovante:', e);
        }
        setFotoFile(null);
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
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-500" />
          Controle de Presença
          {catracaConnected ? (
            <Badge variant="outline" className="text-green-600 border-green-300 bg-green-50 text-[10px] px-1.5 py-0 ml-1">
              <Wifi className="w-3 h-3 mr-0.5 inline" />
              Catraca Online
            </Badge>
          ) : (
            <Badge variant="outline" className="text-gray-400 border-gray-200 text-[10px] px-1.5 py-0 ml-1">
              <WifiOff className="w-3 h-3 mr-0.5 inline" />
              Catraca Offline
            </Badge>
          )}
        </CardTitle>
        <Button
          variant="outline"
          onClick={() => {
            setShowHistoricoChamadas(!showHistoricoChamadas);
            if (!showHistoricoChamadas) {
              refetchHistorico();
            }
          }}
        >
          <Clock className="w-4 h-4 mr-2" />
          {showHistoricoChamadas ? 'Nova Chamada' : 'Ver Histórico'}
        </Button>
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
                    {turmasData && turmasData.length > 0 ? (
                      turmasData
                        .filter((t: any) => t.status !== 'inativo')
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
                    existingFotoUrl ? (
                      <div className="flex items-center gap-2">
                        <img src={existingFotoUrl} alt="Foto comprovante" className="w-10 h-10 rounded object-cover border" />
                        <span className="text-xs text-gray-500">Foto comprovante (somente leitura)</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Camera className="w-4 h-4 text-gray-400" />
                        <span className="text-xs text-gray-500">Sem foto comprovante</span>
                      </div>
                    )
                  ) : (
                    <>
                      <label className="flex items-center gap-2 cursor-pointer border rounded-lg px-3 py-2 text-sm hover:bg-gray-50">
                        <Camera className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-600">{fotoFile ? fotoFile.name : 'Foto comprovante'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => setFotoFile(e.target.files?.[0] || null)}
                        />
                      </label>
                      {fotoFile && (
                        <img src={URL.createObjectURL(fotoFile)} alt="Preview" className="w-10 h-10 rounded object-cover border" />
                      )}
                    </>
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
                    setFotoFile(null);
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
              <div className="flex items-center justify-between p-3 rounded-lg border bg-gray-50">
                <div className="flex items-center gap-2">
                  {modoManual ? (
                    <>
                      <Hand className="w-4 h-4 text-orange-500" />
                      <span className="text-sm font-medium text-orange-700">Modo Manual</span>
                      <span className="text-xs text-gray-500">- Marque presença manualmente</span>
                    </>
                  ) : (
                    <>
                      <ScanFace className="w-4 h-4 text-blue-500" />
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
                <Button
                  variant={modoManual ? "default" : "outline"}
                  size="sm"
                  className={modoManual ? "bg-orange-500 hover:bg-orange-600" : ""}
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
            )}

            {chamadaTurmaId && (
              <div className="border rounded-lg p-4">
                {(() => {
                  const selectedTurma = turmasData?.find((t: any) => t.id.toString() === chamadaTurmaId);
                  const turmaEntries = catracaLog?.entradas?.filter((e: any) => selectedTurma ? e.turma === selectedTurma.nome && e.vertente === 'inclusao' : false) || [];
                  const totalCatracaEntries = turmaEntries.length;
                  return (
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold flex items-center gap-2">
                        Lista de Presença - {selectedTurma?.nome || 'Turma'}
                        {editingChamadaId && <Badge className="ml-2 bg-yellow-500">Editando</Badge>}
                        {alunosChamadaLoading && <span className="text-sm text-gray-500 ml-2">Carregando...</span>}
                      </h3>
                      {totalCatracaEntries > 0 && (
                        <div className="flex items-center gap-2">
                          <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-xs px-2 py-0.5">
                            <Zap className="w-3 h-3 mr-1 inline" />
                            {totalCatracaEntries} entrada{totalCatracaEntries !== 1 ? 's' : ''} via catraca
                          </Badge>
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
            <h3 className="font-semibold">Histórico de Chamadas</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <label className="text-sm font-medium">Turma</label>
                <Select value={historicoFiltroTurma} onValueChange={setHistoricoFiltroTurma}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as turmas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todas as turmas</SelectItem>
                    {turmasData.map((turma: any) => (
                      <SelectItem key={turma.id} value={turma.nome}>{turma.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Data Início</label>
                <Input
                  type="date"
                  value={historicoFiltroDataInicio}
                  onChange={(e) => setHistoricoFiltroDataInicio(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Data Fim</label>
                <Input
                  type="date"
                  value={historicoFiltroDataFim}
                  onChange={(e) => setHistoricoFiltroDataFim(e.target.value)}
                />
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

                    if (historicoFiltroTurma && historicoFiltroTurma !== 'todas' && turmaNome !== historicoFiltroTurma) {
                      return false;
                    }
                    if (historicoFiltroDataInicio && dataAtividade) {
                      if (dataAtividade < historicoFiltroDataInicio) return false;
                    }
                    if (historicoFiltroDataFim && dataAtividade) {
                      if (dataAtividade > historicoFiltroDataFim) return false;
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
                          className="p-3 bg-gray-50 cursor-pointer hover:bg-gray-100 flex items-center justify-between"
                          onClick={() => setHistoricoExpandido(historicoExpandido === registro.id ? null : registro.id)}
                        >
                          <div className="flex items-center gap-3">
                            <Calendar className="w-4 h-4 text-gray-500" />
                            <span className="font-medium">
                              {dataAtividade ? new Date(dataAtividade + 'T12:00:00').toLocaleDateString('pt-BR') : 'Sem data'}
                            </span>
                            <span className="text-gray-500">-</span>
                            <span>{registro.turmaNome || registro.turma || registro.grupo}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-sm text-green-600 font-medium">
                              {presentes}/{total} presentes
                            </span>
                            {registro.teveAlimentacao === true && (
                              <Badge className="bg-orange-100 text-orange-700 border-orange-200 text-xs">
                                <Utensils className="w-3 h-3 mr-1" />
                                Alimentação
                              </Badge>
                            )}
                            {(registro.fotoComprovante || registro.foto_comprovante || (registro.presencas || []).some((p: any) => p.fotoComprovante)) && (
                              <a
                                href={`/api/presencas-inclusao/foto-serve/${registro.grupoId || registro.turmaId}/${dataAtividade}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
                                title="Ver foto comprovante"
                              >
                                <Camera className="w-3.5 h-3.5" />
                                Foto
                              </a>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2"
                              onClick={(e) => {
                                e.stopPropagation();

                                const turmaId = registro.grupoId || registro.turmaId; // ✅ só uma vez
                                setChamadaTurmaId(String(turmaId));
                                setChamadaData(dataAtividade || '');
                                setEditingChamadaId(registro.id);
                                setCatracaApplied(false);
                                setEditingTeveAlimentacao(registro.teveAlimentacao ?? null);

                                if (registro.presencas && registro.presencas.length > 0) {
                                  setPresencas(registro.presencas.map((p: any) => ({
                                    participanteId: p.participanteId || p.alunoId || p.id,
                                    nome: p.alunoNome || p.nome || '',
                                    cpf: p.cpf || p.alunoCpf || '',
                                    presente: p.presente === true || p.status === 'presente',
                                    justificativa: p.justificativa || undefined,
                                  })));
                                }

                              const hasFoto = !!(
                                registro.fotoComprovante ||
                                registro.foto_comprovante ||
                                (registro.presencas || []).find((p: any) => p.fotoComprovante)?.fotoComprovante
                              );

                              const fotoUrl = hasFoto ? `/api/presencas-inclusao/foto-serve/${turmaId}/${dataAtividade}` : null;
                              setExistingFotoUrl(fotoUrl);

                              setFotoFile(null);
                              setShowHistoricoChamadas(false);
                            }}
                            >
                              <Pencil className="w-3.5 h-3.5 mr-1" />
                              Editar
                            </Button>
                            {historicoExpandido === registro.id ? (
                              <ChevronUp className="w-4 h-4 text-gray-500" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-gray-500" />
                            )}
                          </div>
                        </div>

                        {historicoExpandido === registro.id && registro.presencas && (
                          <div className="p-3 border-t bg-white">
                            <div className="text-sm font-medium mb-2 text-gray-600">
                              Lista de Presença ({registro.presencas.length} participantes):
                            </div>
                            <div className="grid gap-1.5">
                              {[...registro.presencas]
                                .sort((a: any, b: any) => (a.alunoNome || a.nome || '').localeCompare(b.alunoNome || b.nome || '', 'pt-BR'))
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
            <label className="text-sm font-medium text-gray-700">Descreva brevemente o ocorrido</label>
            <Textarea
              placeholder="Descreva brevemente o ocorrido (opcional)..."
              value={descManual}
              onChange={(e) => setDescManual(e.target.value)}
              className="h-20 resize-none"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">PIN de acesso <span className="text-red-500">*</span></label>
            <input
              type="password"
              maxLength={4}
              inputMode="numeric"
              pattern="[0-9]*"
              value={pinManual}
              onChange={(e) => { setPinManual(e.target.value.replace(/\D/g, '').slice(0, 4)); setPinError(''); }}
              placeholder="••••"
              className={`w-full border rounded-md px-3 py-2 text-sm text-center tracking-[0.5em] font-mono focus:outline-none focus:ring-2 focus:ring-orange-400 ${pinError ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
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
            disabled={!motivoManual || pinManual.length < 4 || savingMotivoManual}
            onClick={async () => {
              setSavingMotivoManual(true);
              setPinError('');
              try {
                const pinRes = await fetch('/api/presenca/validar-pin-manual', {
                  method: 'POST',
                  credentials: 'include',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ pin: pinManual }),
                });
                if (!pinRes.ok) {
                  setPinError('PIN incorreto. Verifique e tente novamente.');
                  setSavingMotivoManual(false);
                  return;
                }
                const motivoFinal = descManual.trim() ? `${motivoManual} — ${descManual.trim()}` : motivoManual;
                await fetch('/api/chamada-manual-log', {
                  method: 'POST',
                  credentials: 'include',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    turmaId: chamadaTurmaId ? parseInt(chamadaTurmaId) : null,
                    data: chamadaData || new Date().toISOString().slice(0, 10),
                    motivo: motivoFinal,
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
    </>
  );
}
