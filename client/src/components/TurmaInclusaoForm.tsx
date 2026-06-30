import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Calendar, CheckCircle, GraduationCap, Palette, BookOpen } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { CORES_DISPONIVEIS, ICONES_DISPONIVEIS } from "@/components/VincularProfessoresTurma";
import { parseDateLocal } from "@/lib/class-days";

interface TurmaInclusaoFormProps {
  open: boolean;
  onClose: () => void;
  turma?: any;
  monitorUserId?: number;
}

export function TurmaInclusaoForm({ open, onClose, turma, monitorUserId }: TurmaInclusaoFormProps) {
  const { toast } = useToast();
  
  const [programaId, setProgramaId] = useState<string>("");
  const [nome, setNome] = useState("");
  const [codigo, setCodigo] = useState("");
  const [numeroVagas, setNumeroVagas] = useState(20);
  const [dataInicio, setDataInicio] = useState<Date | undefined>(undefined);
  const [dataFim, setDataFim] = useState<Date | undefined>(undefined);
  const [horaInicio, setHoraInicio] = useState("");
  const [horaFim, setHoraFim] = useState("");
  const [local, setLocal] = useState("");
  const [status, setStatus] = useState("emandamento");
  const [descricao, setDescricao] = useState("");
  const [diasSemana, setDiasSemana] = useState<string[]>([]);
  const [openCalendarInicio, setOpenCalendarInicio] = useState(false);
  const [openCalendarFim, setOpenCalendarFim] = useState(false);
  const [dataInicioText, setDataInicioText] = useState("");
  const [dataFimText, setDataFimText] = useState("");
  const [professorSelections, setProfessorSelections] = useState<Array<{ id: number; cor: string; icone: string }>>([]);
  
  const diasDaSemana = [
    { value: "segunda", label: "Segunda" },
    { value: "terca", label: "Terça" },
    { value: "quarta", label: "Quarta" },
    { value: "quinta", label: "Quinta" },
    { value: "sexta", label: "Sexta" },
    { value: "sabado", label: "Sábado" },
    { value: "domingo", label: "Domingo" },
  ];

  const DIA_MAP: Record<string, number> = {
    domingo: 0, segunda: 1, terca: 2, quarta: 3, quinta: 4, sexta: 5, sabado: 6,
  };

  const cargaHoraria = useMemo(() => {
    if (!dataInicio || !dataFim || diasSemana.length === 0 || !horaInicio || !horaFim) return null;
    const [hE, mE] = horaInicio.split(":").map(Number);
    const [hS, mS] = horaFim.split(":").map(Number);
    const duracaoMin = (hS * 60 + mS) - (hE * 60 + mE);
    if (duracaoMin <= 0) return null;
    const diasNums = diasSemana.map(d => DIA_MAP[d.toLowerCase()]).filter(d => d !== undefined);
    let count = 0;
    // Usa local noon para evitar shift de UTC→local que muda o dia da semana
    const toLocalNoon = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12, 0, 0);
    const cur = toLocalNoon(dataInicio);
    const end = toLocalNoon(dataFim);
    while (cur <= end) {
      if (diasNums.includes(cur.getDay())) count++;
      cur.setDate(cur.getDate() + 1);
    }
    const totalHoras = count * (duracaoMin / 60);
    return { count, duracaoMin, totalHoras };
  }, [dataInicio, dataFim, diasSemana, horaInicio, horaFim]);

  const { data: programasData = [], isLoading: programasLoading } = useQuery<any[]>({
    queryKey: ['/api/programas-inclusao'],
    enabled: open
  });

  const { data: professoresDisponiveis = [] } = useQuery({
    queryKey: ['/api/coordenador/professores', 'inclusao_produtiva'],
    queryFn: async () => {
      const response = await fetch('/api/coordenador/professores?programa=inclusao_produtiva');
      if (!response.ok) return [];
      return response.json();
    },
    enabled: open,
  });

  const { data: vinculadosExistentes = [] } = useQuery({
    queryKey: ['/api/coordenador/professor-turmas', turma?.id, 'inclusao'],
    queryFn: async () => {
      const response = await fetch(`/api/coordenador/professor-turmas/${turma?.id}?tipo=inclusao`);
      if (!response.ok) return [];
      return response.json();
    },
    enabled: open && !!turma?.id,
  });

  // Buscar próximo código apenas quando criar nova turma (não para edição)
  const { data: proximoCodigoData, isLoading: codigoLoading } = useQuery<{ codigo: string }>({
    queryKey: ['/api/turmas-inclusao/proximo-codigo'],
    enabled: open && !turma // Só busca se for nova turma
  });
  
  const handleClose = () => {
    resetForm();
    onClose();
  };
  
  useEffect(() => {
    if (turma) {
      setProgramaId(turma.programaId?.toString() || turma.programa_id?.toString() || "");
      setNome(turma.nome || "");
      setCodigo(turma.codigo || "");
      setNumeroVagas(turma.numeroVagas || turma.numero_vagas || 20);
      const diVal = turma.dataInicio || turma.data_inicio;
      const dfVal = turma.dataFim || turma.data_fim;
      const di = parseDateLocal(diVal) ?? undefined;
      const df = parseDateLocal(dfVal) ?? undefined;
      setDataInicio(di);
      setDataFim(df);
      setDataInicioText(di ? format(di, "dd/MM/yyyy", { locale: ptBR }) : "");
      setDataFimText(df ? format(df, "dd/MM/yyyy", { locale: ptBR }) : "");
      if (turma.horario) {
        const [hi, hf] = turma.horario.split(' - ');
        setHoraInicio(hi || "");
        setHoraFim(hf || "");
      }
      setLocal(turma.local || "");
      const normalizeStatus = (s: string) => {
        if (s === 'ativo' || s === 'em_andamento' || s === 'em andamento' || s === 'em-andamento' || s === 'andamento') return 'emandamento';
        return s;
      };
      setStatus(normalizeStatus(turma.status || "emandamento"));
      setDescricao(turma.descricao || "");
      setDiasSemana(turma.dias_semana || turma.diasSemana || []);
    } else {
      resetForm();
    }
  }, [turma, open]);

  useEffect(() => {
    if (vinculadosExistentes.length > 0) {
      setProfessorSelections(vinculadosExistentes.map((v: any) => ({
        id: v.professor_id,
        cor: v.cor || '#3B82F6',
        icone: v.icone || 'book'
      })));
    }
  }, [vinculadosExistentes]);
  
  const resetForm = () => {
    setProgramaId("");
    setNome("");
    setCodigo("");
    setNumeroVagas(20);
    setDataInicio(undefined);
    setDataFim(undefined);
    setDataInicioText("");
    setDataFimText("");
    setHoraInicio("");
    setHoraFim("");
    setLocal("");
    setStatus("ativo");
    setDescricao("");
    setDiasSemana([]);
    setProfessorSelections([]);
  };

  const parseDataTexto = (texto: string): Date | undefined => {
    const limpo = texto.replace(/\D/g, '');
    if (limpo.length === 8) {
      const dia = parseInt(limpo.substring(0, 2));
      const mes = parseInt(limpo.substring(2, 4)) - 1;
      const ano = parseInt(limpo.substring(4, 8));
      const data = new Date(ano, mes, dia, 12, 0, 0);
      if (!isNaN(data.getTime()) && dia >= 1 && dia <= 31 && mes >= 0 && mes <= 11) {
        return data;
      }
    }
    return undefined;
  };

  const handleDataInicioTextChange = (texto: string) => {
    let formatado = texto.replace(/\D/g, '');
    if (formatado.length > 2) formatado = formatado.slice(0,2) + '/' + formatado.slice(2);
    if (formatado.length > 5) formatado = formatado.slice(0,5) + '/' + formatado.slice(5,9);
    setDataInicioText(formatado);
    const data = parseDataTexto(formatado);
    if (data) setDataInicio(data);
  };

  const handleDataFimTextChange = (texto: string) => {
    let formatado = texto.replace(/\D/g, '');
    if (formatado.length > 2) formatado = formatado.slice(0,2) + '/' + formatado.slice(2);
    if (formatado.length > 5) formatado = formatado.slice(0,5) + '/' + formatado.slice(5,9);
    setDataFimText(formatado);
    const data = parseDataTexto(formatado);
    if (data) setDataFim(data);
  };
  
  const linkProfessorsToTurma = async (turmaId: number) => {
    if (professorSelections.length > 0) {
      try {
        await apiRequest(`/api/coordenador/professor-turmas/${turmaId}`, {
          method: 'PUT',
          body: JSON.stringify({
            professores: professorSelections.map(s => ({ id: s.id, cor: s.cor, icone: s.icone })),
            turmaTipo: 'inclusao'
          })
        });
      } catch (err) {
        console.error("Erro ao vincular professores:", err);
      }
    }
  };

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const url = monitorUserId 
        ? `/api/monitor/${monitorUserId}/grupos?vertente=inclusao`
        : '/api/turmas-inclusao';
      const resp = await apiRequest(url, {
        method: 'POST',
        body: JSON.stringify(data)
      });
      return resp;
    },
    onSuccess: async (response: any) => {
      let turmaId: number | null = null;
      try {
        const result = typeof response === 'object' && response.id ? response : (response?.json ? await response.json() : null);
        turmaId = result?.id || result?.turmaId || null;
      } catch {}
      if (turmaId && professorSelections.length > 0) {
        await linkProfessorsToTurma(turmaId);
      }
      toast({ title: "Turma criada!", description: "A nova turma foi criada com sucesso." });
      queryClient.invalidateQueries({ queryKey: ['/api/turmas-inclusao'] });
      queryClient.invalidateQueries({ queryKey: ['/api/monitor/grupos', monitorUserId, 'inclusao'] });
      queryClient.invalidateQueries({ queryKey: ['/api/coordenador/professor-turmas'] });
      resetForm();
      onClose();
    },
    onError: () => {
      toast({ title: "Erro", description: "Não foi possível criar a turma.", variant: "destructive" });
    }
  });
  
  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest(`/api/turmas-inclusao/${turma?.id}`, {
        method: 'PATCH',
        body: JSON.stringify(data)
      });
    },
    onSuccess: async () => {
      if (turma?.id) {
        await linkProfessorsToTurma(turma.id);
      }
      toast({ title: "Turma atualizada!", description: "A turma foi atualizada com sucesso." });
      queryClient.invalidateQueries({ queryKey: ['/api/turmas-inclusao'] });
      queryClient.invalidateQueries({ queryKey: ['/api/professor/turmas'] });
      queryClient.invalidateQueries({ queryKey: ['/api/monitor/grupos'] });
      queryClient.invalidateQueries({ queryKey: ['/api/coordenador/professor-turmas'] });
      onClose();
    },
    onError: () => {
      toast({ title: "Erro", description: "Não foi possível atualizar a turma.", variant: "destructive" });
    }
  });
  
  const handleSubmit = () => {
    if (!programaId) {
      toast({ title: "Erro", description: "Por favor, selecione um programa.", variant: "destructive" });
      return;
    }
    if (!nome) {
      toast({ title: "Erro", description: "Por favor, informe o nome da turma.", variant: "destructive" });
      return;
    }
    if (!dataInicio) {
      toast({ title: "Data de início obrigatória", description: "Por favor, informe a data de início da turma.", variant: "destructive" });
      return;
    }
    if (!dataFim) {
      toast({ title: "Data de término obrigatória", description: "Por favor, informe a data de término da turma.", variant: "destructive" });
      return;
    }
    if (diasSemana.length === 0) {
      toast({ title: "Dias da semana obrigatórios", description: "Por favor, selecione pelo menos um dia da semana.", variant: "destructive" });
      return;
    }
    if (!horaInicio) {
      toast({ title: "Horário de início obrigatório", description: "Por favor, informe o horário de início da turma.", variant: "destructive" });
      return;
    }
    if (!horaFim) {
      toast({ title: "Horário de término obrigatório", description: "Por favor, informe o horário de término da turma.", variant: "destructive" });
      return;
    }
    
    let horarioFormatado = "";
    if (horaInicio && horaFim) {
      horarioFormatado = `${horaInicio} - ${horaFim}`;
    }
    
    const formData = {
      programaId: parseInt(programaId),
      nome,
      codigo,
      numeroVagas,
      dataInicio: dataInicio ? format(dataInicio, "yyyy-MM-dd") : null,
      dataFim: dataFim ? format(dataFim, "yyyy-MM-dd") : null,
      horario: horarioFormatado,
      horarioEntrada: horaInicio || null,
      horarioSaida: horaFim || null,
      diasSemana: diasSemana.length > 0 ? diasSemana : null,
      local,
      status,
      descricao,
      monitorUserId
    };
    
    if (turma) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };
  
  const isPending = createMutation.isPending || updateMutation.isPending;
  
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{turma ? 'Editar Turma' : 'Criar Nova Turma'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Programa *</label>
            <Select value={programaId} onValueChange={setProgramaId} disabled={!!turma || programasLoading}>
              <SelectTrigger>
                <SelectValue placeholder={programasLoading ? "Carregando..." : "Selecione o programa"} />
              </SelectTrigger>
              <SelectContent>
                {programasData.length === 0 ? (
                  <SelectItem value="none" disabled>Nenhum programa disponível</SelectItem>
                ) : programasData.map((prog: any) => (
                  <SelectItem key={prog.id} value={prog.id.toString()}>{prog.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500 mt-1">{turma ? "Programa não pode ser alterado" : "Selecione a qual programa esta turma pertence"}</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Nome da Turma *</label>
            <Input 
              placeholder="Ex: Turma A - Manhã" 
              value={nome}
              onChange={(e) => setNome(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Código da Turma</label>
            <Input 
              value={turma ? (turma.codigo || '') : (codigoLoading ? 'Gerando...' : (proximoCodigoData?.codigo || ''))}
              readOnly
              disabled
              className="bg-gray-100 cursor-not-allowed"
            />
            <p className="text-xs text-gray-500 mt-1">Gerado automaticamente</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Data de Início *</label>
              <Popover open={openCalendarInicio} onOpenChange={setOpenCalendarInicio}>
                <div className="flex gap-1">
                  <Input
                    placeholder="DD/MM/AAAA"
                    value={dataInicioText || (dataInicio ? format(dataInicio, "dd/MM/yyyy", { locale: ptBR }) : "")}
                    onChange={(e) => handleDataInicioTextChange(e.target.value)}
                    className="flex-1"
                    maxLength={10}
                  />
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="icon" type="button">
                      <Calendar className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                </div>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={dataInicio}
                    onSelect={(date) => {
                      setDataInicio(date);
                      setDataInicioText(date ? format(date, "dd/MM/yyyy", { locale: ptBR }) : "");
                      setOpenCalendarInicio(false);
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Hora de Início *</label>
              <Input 
                type="time" 
                value={horaInicio}
                onChange={(e) => setHoraInicio(e.target.value)}
                placeholder="Ex: 14:00"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Data de Término *</label>
              <Popover open={openCalendarFim} onOpenChange={setOpenCalendarFim}>
                <div className="flex gap-1">
                  <Input
                    placeholder="DD/MM/AAAA"
                    value={dataFimText || (dataFim ? format(dataFim, "dd/MM/yyyy", { locale: ptBR }) : "")}
                    onChange={(e) => handleDataFimTextChange(e.target.value)}
                    className="flex-1"
                    maxLength={10}
                  />
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="icon" type="button">
                      <Calendar className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                </div>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={dataFim}
                    onSelect={(date) => {
                      setDataFim(date);
                      setDataFimText(date ? format(date, "dd/MM/yyyy", { locale: ptBR }) : "");
                      setOpenCalendarFim(false);
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Hora de Término *</label>
              <Input 
                type="time" 
                value={horaFim}
                onChange={(e) => setHoraFim(e.target.value)}
                placeholder="Ex: 17:00"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Dias da Semana *</label>
            <div className="flex flex-wrap gap-2">
              {diasDaSemana.map((dia) => (
                <button
                  key={dia.value}
                  type="button"
                  onClick={() => {
                    if (diasSemana.includes(dia.value)) {
                      setDiasSemana(diasSemana.filter(d => d !== dia.value));
                    } else {
                      setDiasSemana([...diasSemana, dia.value]);
                    }
                  }}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    diasSemana.includes(dia.value)
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {dia.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-1">Selecione os dias em que a turma acontece</p>
          </div>

          {cargaHoraria && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2">
              <BookOpen className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-blue-800">Carga Horária Calculada</p>
                <p className="text-sm text-blue-700">
                  {cargaHoraria.count} aula{cargaHoraria.count !== 1 ? "s" : ""} × {cargaHoraria.duracaoMin / 60 % 1 === 0 ? cargaHoraria.duracaoMin / 60 : (cargaHoraria.duracaoMin / 60).toFixed(1)}h por aula = <strong>{cargaHoraria.totalHoras % 1 === 0 ? cargaHoraria.totalHoras : cargaHoraria.totalHoras.toFixed(1)}h no total</strong>
                </p>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">Local</label>
            <Input 
              placeholder="Ex: Sala 101" 
              value={local}
              onChange={(e) => setLocal(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="planejado">Planejado</SelectItem>
                <SelectItem value="emandamento">Em andamento</SelectItem>
                <SelectItem value="concluido">Concluído</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Descrição</label>
            <Textarea 
              placeholder="Descreva a turma e seus detalhes..."
              rows={3}
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
            />
          </div>

          {/* Professor Selection */}
          <div className="border-t pt-4">
            <label className="block text-sm font-medium mb-2 flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-blue-500" />
              Professores Vinculados
            </label>
            {professoresDisponiveis.filter((p: any) => p.ativo).length === 0 ? (
              <p className="text-sm text-gray-500">Nenhum professor cadastrado.</p>
            ) : (
              <div className="space-y-2 max-h-[250px] overflow-y-auto">
                {professoresDisponiveis.filter((p: any) => p.ativo).map((prof: any) => {
                  const selected = professorSelections.some(s => s.id === prof.id);
                  const sel = professorSelections.find(s => s.id === prof.id);
                  return (
                    <div key={prof.id} className={`border rounded-lg transition-colors ${selected ? 'bg-blue-50 border-blue-300' : 'hover:bg-gray-50'}`}>
                      <label className="flex items-center gap-3 p-2.5 cursor-pointer">
                        <Checkbox
                          checked={selected}
                          onCheckedChange={() => {
                            if (selected) {
                              setProfessorSelections(prev => prev.filter(s => s.id !== prof.id));
                            } else {
                              setProfessorSelections(prev => [...prev, { id: prof.id, cor: '#3B82F6', icone: 'book' }]);
                            }
                          }}
                        />
                        <div className="flex-1">
                          <p className="font-medium text-sm">{prof.nome}</p>
                          <p className="text-xs text-gray-500">{prof.email}</p>
                        </div>
                        {selected && <Badge className="bg-blue-100 text-blue-800 text-xs">Vinculado</Badge>}
                      </label>
                      {selected && sel && (
                        <div className="px-2.5 pb-2.5 space-y-2 border-t pt-2 ml-9">
                          <div>
                            <p className="text-xs font-medium text-gray-600 mb-1 flex items-center gap-1">
                              <Palette className="w-3 h-3" /> Cor
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {CORES_DISPONIVEIS.map(c => (
                                <button key={c.value} type="button"
                                  onClick={() => setProfessorSelections(prev => prev.map(s => s.id === prof.id ? { ...s, cor: c.value } : s))}
                                  className={`w-5 h-5 rounded-full transition-all ${c.bg} ${sel.cor === c.value ? 'ring-2 ring-offset-1 ring-gray-800 scale-110' : 'opacity-60 hover:opacity-100'}`}
                                  title={c.label}
                                />
                              ))}
                            </div>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-gray-600 mb-1">Ícone</p>
                            <div className="flex flex-wrap gap-1">
                              {ICONES_DISPONIVEIS.map(ic => {
                                const IconComp = ic.icon;
                                return (
                                  <button key={ic.value} type="button"
                                    onClick={() => setProfessorSelections(prev => prev.map(s => s.id === prof.id ? { ...s, icone: ic.value } : s))}
                                    className={`w-6 h-6 rounded flex items-center justify-center transition-all border ${sel.icone === ic.value ? 'border-blue-500 bg-blue-100 text-blue-700 scale-110' : 'border-gray-200 text-gray-400 hover:bg-gray-100'}`}
                                    title={ic.label}
                                  >
                                    <IconComp className="w-3 h-3" />
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            {professorSelections.length > 0 && (
              <p className="text-xs text-gray-500 mt-1">{professorSelections.length} professor(es) selecionado(s)</p>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <Button 
              className="bg-blue-500 hover:bg-blue-600"
              onClick={handleSubmit}
              disabled={isPending}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              {isPending ? 'Salvando...' : (turma ? 'Salvar Alterações' : 'Criar Turma')}
            </Button>
            <Button variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
