import React, { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { 
  CalendarIcon, 
  Clock, 
  Users, 
  MapPin,
  CheckCircle,
  XCircle,
  UserCheck,
  FileText,
  Calculator,
  Info
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';

// Schema para validação da sessão com validação dinâmica de data
const createSessionSchema = (instanceStartDate?: string, instanceEndDate?: string) => z.object({
  activity_instance_id: z.number().min(1, "Turma é obrigatória"),
  date: z.date({ required_error: "Data da sessão é obrigatória" })
    .refine((date) => {
      if (!instanceStartDate || !instanceEndDate) return true;
      const sessionDate = new Date(date);
      const startDate = new Date(instanceStartDate);
      const endDate = new Date(instanceEndDate);
      return sessionDate >= startDate && sessionDate <= endDate;
    }, {
      message: "Data da sessão deve estar dentro do período de ocorrência da turma"
    }),
  hours: z.number().min(0.1, "Horas devem ser maior que 0.0").max(12, "Duração não pode exceder 12 horas"),
  title: z.string().optional(),
  description: z.string().min(1, "Descrição é obrigatória"),
  observations: z.string().optional(),
  location: z.string().min(1, "Local é obrigatório"),
  educator_names: z.string().min(1, "Nome dos educadores é obrigatório"),
  status: z.enum(['planejado', 'realizado', 'cancelado']).default('realizado')
});

interface SessionFormProps {
  open: boolean;
  onClose: () => void;
  session?: any | null;
  instanceId?: number | null;
}

interface Enrollment {
  id: number;
  full_name: string;
  age: number;
  birthdate: string;
  gender: string;
  active: boolean;
}

// Função para calcular idade na data específica
const calculateAgeAtDate = (birthdate: string, targetDate: Date): number => {
  const birth = new Date(birthdate);
  const target = new Date(targetDate);
  let age = target.getFullYear() - birth.getFullYear();
  const monthDiff = target.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && target.getDate() < birth.getDate())) {
    age--;
  }
  
  return age;
};

interface AttendanceRecord {
  enrollment_id: number;
  present: boolean;
}

export function SessionForm({ 
  open, 
  onClose, 
  session = null,
  instanceId = null 
}: SessionFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [activeTab, setActiveTab] = useState('session');
  const [attendanceStats, setAttendanceStats] = useState({ present: 0, total: 0, percentage: 0 });

  // Buscar dados da turma para validação de data
  const { data: instance, isLoading: loadingInstance } = useQuery({
    queryKey: ['/api/instances', instanceId],
    queryFn: () => apiRequest(`/api/instances/${instanceId}`),
    enabled: !!instanceId
  });

  // Gate rendering até que a instância seja carregada para garantir validação correta (tanto para criação quanto edição)
  if (loadingInstance || !instance) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Carregando...</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-8">
            <div className="animate-pulse text-center">
              <Clock className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Carregando dados da turma...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Agora que a instância foi carregada, criar o formulário com validação correta
  const sessionSchema = createSessionSchema(
    instance?.occurrence_start,
    instance?.occurrence_end
  );

  const form = useForm({
    resolver: zodResolver(sessionSchema),
    defaultValues: session ? {
      activity_instance_id: session.activity_instance_id || instanceId || 0,
      date: session.date ? new Date(session.date) : new Date(),
      hours: session.hours || 3,
      title: session.title || '',
      description: session.description || '',
      observations: session.observations || '',
      location: session.location || instance?.location || '',
      educator_names: session.educator_names || '',
      status: session.status || 'realizado'
    } : {
      activity_instance_id: instanceId || 0,
      date: new Date(),
      hours: 3,
      title: '',
      description: '',
      observations: '',
      location: instance?.location || '',
      educator_names: '',
      status: 'realizado'
    }
  });

  // Buscar inscrições ativas da turma
  const { data: enrollments = [], isLoading: loadingEnrollments } = useQuery({
    queryKey: ['/api/instances', instanceId, 'enrollments'],
    queryFn: () => apiRequest(`/api/instances/${instanceId}/enrollments`),
    enabled: !!(instanceId && open)
  }) as { data: Enrollment[], isLoading: boolean };

  // Buscar presença existente se editando sessão
  const { data: existingAttendance = [] } = useQuery({
    queryKey: ['/api/sessions', session?.id, 'attendance'],
    queryFn: () => apiRequest(`/api/sessions/${session.id}/attendance`),
    enabled: !!(session?.id && open)
  }) as { data: any[] };

  // Inicializar registros de presença
  useEffect(() => {
    if (enrollments.length > 0) {
      if (session && existingAttendance.length > 0) {
        // Editando sessão - usar dados existentes
        const records = enrollments.map(enrollment => {
          const existing = existingAttendance.find(att => att.enrollment_id === enrollment.id);
          return {
            enrollment_id: enrollment.id,
            present: existing ? existing.present : false
          };
        });
        setAttendanceRecords(records);
      } else {
        // Nova sessão - inicializar todos como ausentes
        const records = enrollments.map(enrollment => ({
          enrollment_id: enrollment.id,
          present: false
        }));
        setAttendanceRecords(records);
      }
    }
  }, [enrollments, existingAttendance, session]);

  // Salvar sessão
  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const sessionData = {
        ...data,
        date: format(data.date, 'yyyy-MM-dd')
      };

      let savedSession;
      if (session) {
        savedSession = await apiRequest(`/api/sessions/${session.id}`, {
          method: 'PUT',
          body: sessionData
        });
      } else {
        savedSession = await apiRequest(`/api/instances/${instanceId}/sessions`, {
          method: 'POST',
          body: sessionData
        });
      }

      return savedSession;
    },
    onSuccess: async (savedSession) => {
      // Salvar registros de presença
      for (const attendance of attendanceRecords) {
        await apiRequest(`/api/sessions/${savedSession.id}/attendance`, {
          method: 'POST',
          body: {
            enrollmentId: attendance.enrollment_id,
            present: attendance.present
          }
        });
      }

      queryClient.invalidateQueries({ queryKey: ['/api/sessions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/instances'] });
      toast({ title: session ? "Sessão atualizada com sucesso!" : "Sessão criada com sucesso!" });
      onClose();
      form.reset();
      setAttendanceRecords([]);
      setActiveTab('session');
    },
    onError: (error: any) => {
      toast({ 
        title: "Erro ao salvar sessão", 
        description: error?.message || "Ocorreu um erro inesperado",
        variant: "destructive" 
      });
    }
  });

  // Calcular estatísticas de presença em tempo real
  useEffect(() => {
    const present = attendanceRecords.filter(r => r.present).length;
    const total = attendanceRecords.length;
    const percentage = total > 0 ? Math.round((present / total) * 100) : 0;
    setAttendanceStats({ present, total, percentage });
  }, [attendanceRecords]);

  // Mutação para salvamento incremental de presença
  const attendanceMutation = useMutation({
    mutationFn: async ({ enrollmentId, present, sessionId }: { enrollmentId: number, present: boolean, sessionId?: number }) => {
      if (!sessionId) return; // Só salva se a sessão já foi criada
      
      return await apiRequest(`/api/sessions/${sessionId}/attendance`, {
        method: 'POST',
        body: {
          enrollmentId,
          present
        }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sessions', session?.id, 'attendance'] });
    }
  });

  const handleAttendanceToggle = (enrollmentId: number, present: boolean) => {
    // Atualização otimista do estado local
    setAttendanceRecords(prev => prev.map(record => 
      record.enrollment_id === enrollmentId 
        ? { ...record, present }
        : record
    ));
    
    // Toast de feedback incremental
    const enrollment = enrollments.find(e => e.id === enrollmentId);
    if (enrollment) {
      toast({
        title: present ? "Presença marcada" : "Ausência marcada",
        description: `${enrollment.full_name}: ${present ? 'Presente' : 'Ausente'}`,
        duration: 1500
      });
    }
    
    // Salvamento incremental se a sessão já existe
    if (session?.id) {
      attendanceMutation.mutate({ 
        enrollmentId, 
        present, 
        sessionId: session.id 
      });
    }
  };

  const handleMarkAllPresent = () => {
    setAttendanceRecords(prev => prev.map(record => ({ ...record, present: true })));
  };

  const handleMarkAllAbsent = () => {
    setAttendanceRecords(prev => prev.map(record => ({ ...record, present: false })));
  };

  const onSubmit = (data: any) => {
    saveMutation.mutate(data);
  };

  // Calcular estatísticas de presença
  const presentCount = attendanceRecords.filter(r => r.present).length;
  const totalCount = attendanceRecords.length;
  const attendancePercentage = totalCount > 0 ? (presentCount / totalCount) * 100 : 0;

  // Calcular total de horas automaticamente se não informado
  const watchedDate = form.watch('date');
  useEffect(() => {
    if (watchedDate && !form.getValues('hours')) {
      // Sugerir 3 horas como padrão para sessões
      form.setValue('hours', 3);
    }
  }, [watchedDate, form]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {session ? 'Editar Sessão' : 'Nova Sessão'}
          </DialogTitle>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="session" data-testid="tab-session-info">
              Informações da Sessão
            </TabsTrigger>
            <TabsTrigger value="attendance" data-testid="tab-attendance">
              Presenças ({presentCount}/{totalCount})
            </TabsTrigger>
          </TabsList>

          {/* Tab: Session Information */}
          <TabsContent value="session" className="flex-1 overflow-y-auto">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      Detalhes da Sessão
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="date"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>Data da Sessão *</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button 
                                    variant="outline" 
                                    className="pl-3 text-left font-normal"
                                    data-testid="btn-session-date"
                                  >
                                    {field.value ? (
                                      format(field.value, "dd/MM/yyyy", { locale: pt })
                                    ) : (
                                      <span>Selecionar data</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={field.value}
                                  onSelect={(date) => date && field.onChange(date)}
                                  locale={pt}
                                />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="hours"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Carga Horária (horas) *</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                step="0.5"
                                min="0.1"
                                max="12"
                                placeholder="Ex: 3" 
                                {...field}
                                onChange={(e) => field.onChange(Number(e.target.value))}
                                data-testid="input-session-hours"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Título da Sessão (opcional)</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Ex: Aula de circo e introdução ao tema..." 
                              {...field}
                              data-testid="input-session-title"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Resumo do Conteúdo *</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Descreva as atividades realizadas, temas abordados, etc..."
                              className="min-h-[100px]"
                              {...field} 
                              data-testid="textarea-session-description"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="location"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Local *</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Ex: Casa Sonhar Patrimar" 
                                {...field}
                                data-testid="input-session-location"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="educator_names"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Educador(es) *</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Ex: Maria Silva, João Santos" 
                                {...field}
                                data-testid="input-session-educators"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="observations"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Observações</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Observações sobre a sessão, comportamento dos alunos, materiais utilizados, etc..."
                              className="min-h-[80px]"
                              {...field} 
                              data-testid="textarea-session-observations"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                <div className="flex justify-end gap-3">
                  <Button type="button" variant="outline" onClick={onClose} data-testid="btn-cancel-session">
                    Cancelar
                  </Button>
                  <Button 
                    type="button" 
                    variant="secondary" 
                    onClick={() => setActiveTab('attendance')}
                    data-testid="btn-next-attendance"
                  >
                    Próximo: Presenças
                  </Button>
                </div>
              </form>
            </Form>
          </TabsContent>

          {/* Tab: Attendance */}
          <TabsContent value="attendance" className="flex-1 flex flex-col">
            <div className="space-y-6 flex-1 flex flex-col">
              {/* Attendance Statistics */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Calculator className="h-5 w-5" />
                    Estatísticas de Presença
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{attendanceStats.present}</div>
                      <div className="text-sm text-green-700">Presentes</div>
                    </div>
                    <div className="text-center p-4 bg-red-50 rounded-lg">
                      <div className="text-2xl font-bold text-red-600">{attendanceStats.total - attendanceStats.present}</div>
                      <div className="text-sm text-red-700">Ausentes</div>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{attendanceStats.percentage}%</div>
                      <div className="text-sm text-blue-700">Frequência</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Attendance Controls */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <UserCheck className="h-5 w-5" />
                      Controle de Presença
                    </span>
                    <div className="flex gap-2">
                      <Button 
                        type="button"
                        variant="outline" 
                        size="sm"
                        onClick={handleMarkAllPresent}
                        data-testid="btn-mark-all-present"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Todos Presentes
                      </Button>
                      <Button 
                        type="button"
                        variant="outline" 
                        size="sm"
                        onClick={handleMarkAllAbsent}
                        data-testid="btn-mark-all-absent"
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Todos Ausentes
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto">
                  {loadingEnrollments ? (
                    <div className="text-center py-8">Carregando inscrições...</div>
                  ) : enrollments.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Nenhuma inscrição encontrada para esta turma</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {enrollments
                        .filter(enrollment => enrollment.active)
                        .map((enrollment) => {
                          const attendanceRecord = attendanceRecords.find(
                            record => record.enrollment_id === enrollment.id
                          );
                          const isPresent = attendanceRecord?.present || false;

                          return (
                            <div 
                              key={enrollment.id}
                              className={`flex items-center justify-between p-3 border rounded-lg transition-colors ${
                                isPresent ? 'bg-green-50 border-green-200' : 'bg-gray-50'
                              }`}
                              data-testid={`attendance-${enrollment.id}`}
                            >
                              <div className="flex items-center gap-3">
                                <div className="flex-1">
                                  <p className="font-medium">{enrollment.full_name}</p>
                                  <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <span className="flex items-center gap-1 cursor-help">
                                            <Info className="h-3 w-3" />
                                            {enrollment.age} anos
                                          </span>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <div className="text-xs">
                                            <div>Idade atual: {enrollment.age} anos</div>
                                            <div>Idade na sessão: {calculateAgeAtDate(
                                              enrollment.birthdate, 
                                              form.watch('date') || new Date()
                                            )} anos</div>
                                          </div>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                    <span>•</span>
                                    <span>{enrollment.gender}</span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-3">
                                <Badge variant={isPresent ? "default" : "secondary"}>
                                  {isPresent ? 'Presente' : 'Ausente'}
                                </Badge>
                                <Switch
                                  checked={isPresent}
                                  onCheckedChange={(checked) => 
                                    handleAttendanceToggle(enrollment.id, checked)
                                  }
                                  data-testid={`switch-attendance-${enrollment.id}`}
                                />
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="flex justify-end gap-3">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setActiveTab('session')}
                  data-testid="btn-back-session"
                >
                  Voltar
                </Button>
                <Button 
                  onClick={() => form.handleSubmit(onSubmit)()}
                  disabled={saveMutation.isPending}
                  data-testid="btn-save-session"
                >
                  {saveMutation.isPending ? 'Salvando...' : (session ? 'Atualizar' : 'Criar')} Sessão
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}