import { useState, useEffect } from "react";
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
import { Calendar, CheckCircle } from "lucide-react";

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
  const [status, setStatus] = useState("planejado");
  const [descricao, setDescricao] = useState("");
  
  const { data: programasData = [], isLoading: programasLoading } = useQuery<any[]>({
    queryKey: ['/api/programas-inclusao'],
    enabled: open
  });
  
  const handleClose = () => {
    resetForm();
    onClose();
  };
  
  useEffect(() => {
    if (turma) {
      setProgramaId(turma.programa_id?.toString() || "");
      setNome(turma.nome || "");
      setCodigo(turma.codigo || "");
      setNumeroVagas(turma.numero_vagas || 20);
      setDataInicio(turma.data_inicio ? new Date(turma.data_inicio) : undefined);
      setDataFim(turma.data_fim ? new Date(turma.data_fim) : undefined);
      if (turma.horario) {
        const [hi, hf] = turma.horario.split(' - ');
        setHoraInicio(hi || "");
        setHoraFim(hf || "");
      }
      setLocal(turma.local || "");
      setStatus(turma.status || "planejado");
      setDescricao(turma.descricao || "");
    } else {
      resetForm();
    }
  }, [turma, open]);
  
  const resetForm = () => {
    setProgramaId("");
    setNome("");
    setCodigo("");
    setNumeroVagas(20);
    setDataInicio(undefined);
    setDataFim(undefined);
    setHoraInicio("");
    setHoraFim("");
    setLocal("");
    setStatus("planejado");
    setDescricao("");
  };
  
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      // Se tiver monitorUserId, usa rota de monitor; senão usa rota geral
      const url = monitorUserId 
        ? `/api/monitor/${monitorUserId}/grupos?vertente=inclusao`
        : '/api/turmas-inclusao';
      return apiRequest(url, {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      toast({ title: "Turma criada!", description: "A nova turma foi criada com sucesso." });
      queryClient.invalidateQueries({ queryKey: ['/api/turmas-inclusao'] });
      queryClient.invalidateQueries({ queryKey: ['/api/monitor/grupos', monitorUserId, 'inclusao'] });
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
        method: 'PUT',
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      toast({ title: "Turma atualizada!", description: "A turma foi atualizada com sucesso." });
      queryClient.invalidateQueries({ queryKey: ['/api/turmas-inclusao'] });
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
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Código</label>
              <Input 
                placeholder="Ex: LAB-A-2025" 
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Vagas Disponíveis</label>
              <Input 
                type="number" 
                placeholder="Ex: 20" 
                value={numeroVagas}
                onChange={(e) => setNumeroVagas(parseInt(e.target.value) || 0)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Data de Início</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dataInicio && "text-muted-foreground"
                    )}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {dataInicio ? format(dataInicio, "dd/MM/yyyy", { locale: ptBR }) : "Selecione a data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={dataInicio}
                    onSelect={setDataInicio}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Hora de Início</label>
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
              <label className="block text-sm font-medium mb-1">Data de Término</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dataFim && "text-muted-foreground"
                    )}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {dataFim ? format(dataFim, "dd/MM/yyyy", { locale: ptBR }) : "Selecione a data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={dataFim}
                    onSelect={setDataFim}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Hora de Término</label>
              <Input 
                type="time" 
                value={horaFim}
                onChange={(e) => setHoraFim(e.target.value)}
                placeholder="Ex: 17:00"
              />
            </div>
          </div>

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
                <SelectItem value="ativo">Em andamento</SelectItem>
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
