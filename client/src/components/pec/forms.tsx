import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { CalendarIcon, Upload, ChevronsUpDown, Check, GraduationCap, Palette } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { CORES_DISPONIVEIS, ICONES_DISPONIVEIS } from '@/components/VincularProfessoresTurma';

import { AttendanceControl } from './AttendanceControl';
import { ImageUploader } from '@/components/ImageUploader';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { useToast } from '@/hooks/use-toast';

// Schemas
const projectSchema = z.object({
  name: z.string().min(1, "Nome do projeto é obrigatório"),
  description: z.string().optional(),
  period_start: z.date().optional(),
  period_end: z.date().optional(),
  category: z.string().optional(),
  who_can_participate: z.string().optional()
}).refine((data) => {
  // Se tem data de fim, ela deve ser posterior à data de início
  if (data.period_end && data.period_start) {
    return data.period_end >= data.period_start;
  }
  return true;
}, {
  message: "Data de fim deve ser posterior à data de início",
  path: ["period_end"]
});

const activitySchema = z.object({
  project_id: z.number().min(1, "Projeto é obrigatório"),
  name: z.string().min(1, "Nome da oficina é obrigatório"),
  description: z.string().min(1, "Descrição é obrigatória"),
  control_presence: z.boolean().default(true),
  status: z.enum(['ativa', 'inativa']).default('ativa')
});


const instanceSchema = z.object({
  project_id: z.number().min(1, "Projeto é obrigatório"),
  activity_id: z.number().min(1, "Atividade é obrigatória"),
  title: z.string().min(1, "Título da turma é obrigatório"),
  code: z.string().optional(),
  min_age: z.number().min(0, "Idade mínima deve ser maior que 0"),
  max_age: z.number().min(1, "Idade máxima deve ser maior que 0"),
  start_date: z.date({ required_error: "Data de início é obrigatória" }),
  end_date: z.date({ required_error: "Data de fim é obrigatória" }),
  location: z.string().min(1, "Local é obrigatório"),
  situation: z.enum(['execucao', 'planejamento', 'encerrada'], {
    required_error: "Situação é obrigatória"
  }),
  period: z.enum(['matutino', 'vespertino', 'noturno'], {
    required_error: "Período do dia é obrigatório"
  }),
  start_time: z.string().min(1, "Horário de início é obrigatório"),
  end_time: z.string().min(1, "Horário de fim é obrigatório"),
  total_hours: z.number().optional(),
  observations: z.string().optional(),
  control_mode: z.enum(['manual', 'intelbras']).default('manual'),
  intelbras_group_id: z.string().optional(),
  professor_id: z.number().optional(),
  selected_students: z.array(z.string()).optional().default([]),

  diasSemana: z.array(z.string()).optional().default([]),
}).refine(data => {
  return data.start_time < data.end_time;
}, {
  message: "Horário de início deve ser anterior ao horário de fim",
  path: ["end_time"]
});


// Schema completo para matrícula com todas as 11 seções
const enrollmentSchema = z.object({
  // SEÇÃO 1: Identificação - Dados Principais (Obrigatórios)
  cpf: z.string().min(11, "CPF é obrigatório"),
  nome_completo: z.string().min(1, "Nome completo é obrigatório"),
  foto_perfil: z.string().optional(),
  data_nascimento: z.date({ required_error: "Data de nascimento é obrigatória" }),
  genero: z.enum(['masculino', 'feminino', 'outro'], {
    required_error: "Gênero é obrigatório"
  }),
  numero_matricula: z.string().optional(), // Gerado automaticamente
  familia_nome: z.string().min(1, "Nome da família é obrigatório"),
  situacao_atendimento: z.string().min(1, "Situação do atendimento é obrigatória"),
  estado_civil: z.string().optional(),
  religiao: z.string().optional(),
  naturalidade: z.string().min(1, "Naturalidade é obrigatória"),
  nacionalidade: z.string().default("Brasileira"),
  pode_sair_sozinho: z.enum(['sim', 'nao'], {
    required_error: "Definir se pode sair sozinho é obrigatório"
  }),

  // SEÇÃO 2: Dados Complementares
  tamanho_calca: z.string().optional(),
  tamanho_camiseta: z.string().optional(),
  tamanho_calcado: z.string().optional(),
  cor_raca: z.string().optional(),
  frequenta_projeto_social: z.enum(['sim', 'nao']).optional(),
  acesso_internet: z.enum(['sim', 'nao']).optional(),

  // SEÇÃO 3: Endereço
  cep: z.string().min(8, "CEP é obrigatório"),
  logradouro: z.string().min(1, "Logradouro é obrigatório"),
  numero: z.string().min(1, "Número é obrigatório"),
  bairro: z.string().min(1, "Bairro é obrigatório"),
  cidade: z.string().min(1, "Cidade é obrigatória"),
  estado: z.string().min(2, "Estado é obrigatório"),
  complemento: z.string().optional(),
  ponto_referencia: z.string().optional(),
  mora_desde: z.string().optional(),

  // SEÇÃO 4: Contatos
  email: z.string().email("Email inválido").optional(),
  telefone: z.string().min(10, "Telefone é obrigatório"),
  whatsapp: z.string().optional(),
  contato_emergencia_nome: z.string().min(1, "Nome do contato de emergência é obrigatório"),
  contato_emergencia_telefone: z.string().min(10, "Telefone do contato de emergência é obrigatório"),
  contato_emergencia_whatsapp: z.string().optional(),

  // SEÇÃO 5: Documentos
  rg: z.string().min(1, "RG é obrigatório"),
  orgao_emissor: z.string().min(1, "Órgão emissor é obrigatório"),
  ctps_numero: z.string().optional(),
  ctps_serie: z.string().optional(),
  titulo_eleitor: z.string().optional(),
  nis_pis_pasep: z.string().optional(),
  documentos_possui: z.array(z.string()).optional(),
  upload_identidade_frente: z.string().optional(),
  upload_identidade_verso: z.string().optional(),

  // SEÇÃO 6: Benefícios Sociais
  cadunico: z.enum(['sim', 'nao']).optional(),
  bolsa_familia: z.enum(['sim', 'nao']).optional(),
  bpc: z.enum(['sim', 'nao']).optional(),
  cartao_alimentacao: z.enum(['sim', 'nao']).optional(),
  outros_beneficios: z.string().optional(),

  // SEÇÃO 7: Saúde
  possui_deficiencia: z.enum(['sim', 'nao']).optional(),
  possui_alergia: z.enum(['sim', 'nao']).optional(),
  faz_uso_medicamento: z.enum(['sim', 'nao']).optional(),
  observacoes_saude: z.string().optional(),
  upload_laudo_medico: z.string().optional(),

  // SEÇÃO 8: Educação
  escolaridade: z.string().optional(),
  estuda_atualmente: z.enum(['sim', 'nao']).optional(),
  observacoes_educacao: z.string().optional(),

  // SEÇÃO 9: Situação Familiar
  quantidade_filhos: z.number().min(0).optional(),
  com_quem_mora: z.string().optional(),
  composicao_familiar: z.string().optional(),
  renda_familiar_mensal: z.number().min(0).optional(),
  situacao_moradia: z.string().optional(),
  tipo_moradia: z.string().optional(),

  // SEÇÃO 10: Dados dos Pais e Responsável
  // Dados da Mãe
  mae_nome_completo: z.string().min(1, "Nome da mãe é obrigatório"),
  mae_cpf: z.string().min(11, "CPF da mãe é obrigatório"),
  mae_profissao: z.string().optional(),
  mae_telefone: z.string().optional(),
  mae_mora_com_aluno: z.enum(['sim', 'nao']).optional(),
  mae_e_responsavel: z.enum(['sim', 'nao']).optional(),

  // Dados do Pai
  pai_nome_completo: z.string().optional(),
  pai_cpf: z.string().optional(),
  pai_profissao: z.string().optional(),
  pai_telefone: z.string().optional(),
  pai_mora_com_aluno: z.enum(['sim', 'nao']).optional(),
  pai_e_responsavel: z.enum(['sim', 'nao']).optional(),

  // Responsável Legal (se não for pai ou mãe)
  responsavel_nome_completo: z.string().optional(),
  responsavel_cpf: z.string().optional(),
  responsavel_grau_parentesco: z.string().optional(),
  responsavel_profissao: z.string().optional(),
  responsavel_telefone: z.string().optional(),
  responsavel_email: z.string().email("Email inválido").optional(),
  responsavel_mora_com_aluno: z.enum(['sim', 'nao']).optional(),
  responsavel_e_contato_emergencia: z.enum(['sim', 'nao']).optional(),

  // SEÇÃO 11: Observações
  observacoes_gerais: z.string().optional(),

  // Campos do sistema
  instance_id: z.number().min(1, "Turma é obrigatória"),
  professorId: z.number().optional(),
  active: z.boolean().default(true)
});

const sessionSchema = z.object({
  instance_id: z.number().min(1, "Turma é obrigatória"),
  session_date: z.date({ required_error: "Data da sessão é obrigatória" }),
  hours: z.number().min(0.1, "Horas devem ser maior que 0.0"),
  title: z.string().min(1, "Título da sessão é obrigatório"),
  description: z.string().min(1, "Descrição da sessão é obrigatória"),
  educators: z.string().min(1, "Educadores responsáveis são obrigatórios"),
  location: z.string().min(1, "Local é obrigatório"),
  observations: z.string().optional(),
  materials_used: z.string().optional(),
  status: z.enum(['planejado', 'realizado', 'cancelado']).default('realizado')
}).refine((data) => {
  // Validação customizada será adicionada no componente para verificar se a data está no intervalo da turma
  return true;
}, {
  message: "Data da sessão deve estar dentro do período de ocorrência da turma"
});

// Project Form Component
export function ProjectForm({ 
  open, 
  onClose, 
  project = null 
}: { 
  open: boolean; 
  onClose: () => void; 
  project?: any | null; 
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const form = useForm({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: '',
      description: '',
      period_start: undefined,
      period_end: undefined,
      category: 'SCFV',
      who_can_participate: ''
    }
  });

  // Força o reset do formulário quando project muda
  useEffect(() => {
    if (open) {
      const values = project ? {
        name: project.name || '',
        description: project.description || '',
        period_start: project.period_start ? new Date(project.period_start) : undefined,
        period_end: project.period_end ? new Date(project.period_end) : undefined,
        category: project.category || 'SCFV',
        who_can_participate: project.who_can_participate || ''
      } : {
        name: '',
        description: '',
        period_start: undefined,
        period_end: undefined,
        category: 'SCFV',
        who_can_participate: ''
      };
      
      form.reset(values);
    }
  }, [open, project, form]);

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/projects', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      toast({ title: "Projeto criado com sucesso!" });
      onClose();
      form.reset();
    },
    onError: (error) => {
      console.error('Erro ao criar projeto:', error);
      toast({ title: "Erro ao criar projeto", variant: "destructive" });
    }
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => apiRequest(`/api/projects/${project?.id}`, { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      queryClient.invalidateQueries({ queryKey: ['/api/projects', project?.id] });
      toast({ title: "Projeto atualizado com sucesso!" });
      onClose();
    },
    onError: (error) => {
      console.error('Erro ao atualizar projeto:', error);
      toast({ title: "Erro ao atualizar projeto", variant: "destructive" });
    }
  });

  const onSubmit = (data: any) => {
    const formattedData = {
      name: data.name,
      description: data.description,
      category: data.category,
      who_can_participate: data.who_can_participate,
      period_start: data.period_start ? format(data.period_start, 'yyyy-MM-dd') : null,
      period_end: data.period_end ? format(data.period_end, 'yyyy-MM-dd') : null
    };
    
    if (project) {
      updateMutation.mutate(formattedData);
    } else {
      createMutation.mutate(formattedData);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{project ? 'Editar Projeto' : 'Novo Projeto'}</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Projeto *</FormLabel>
                    <FormControl>
                      <Input placeholder="Digite o nome do projeto" {...field} data-testid="input-project-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-project-category">
                          <SelectValue placeholder="Selecione a categoria" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="SCFV">SCFV - Serviço de Convivência</SelectItem>
                        <SelectItem value="Esporte">Esporte</SelectItem>
                        <SelectItem value="Cultura">Cultura</SelectItem>
                        <SelectItem value="Arte">Arte</SelectItem>
                        <SelectItem value="Educação">Educação</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição *</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Descreva os objetivos e características do projeto" 
                      className="min-h-[100px]"
                      {...field} 
                      data-testid="textarea-project-description"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="period_start"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data de Início</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button 
                            variant="outline" 
                            className="pl-3 text-left font-normal"
                            data-testid="btn-project-start-date"
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
                          onSelect={field.onChange}
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
                name="period_end"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data de Fim</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button 
                            variant="outline" 
                            className="pl-3 text-left font-normal"
                            data-testid="btn-project-end-date"
                          >
                            {field.value ? (
                              format(field.value, "dd/MM/yyyy", { locale: pt })
                            ) : (
                              <span>Selecionar data (opcional)</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          locale={pt}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="who_can_participate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quem pode participar *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Ex: Crianças e adolescentes de 6 a 17 anos" 
                      {...field} 
                      data-testid="input-project-participants"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={onClose} data-testid="btn-cancel-project">
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={createMutation.isPending || updateMutation.isPending}
                data-testid="btn-save-project"
              >
                {project ? 'Atualizar' : 'Criar'} Projeto
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// Activity Form Component
export function ActivityForm({ 
  open, 
  onClose, 
  activity = null,
  projectId = null 
}: { 
  open: boolean; 
  onClose: () => void; 
  activity?: any | null;
  projectId?: number | null;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Buscar lista de projetos
  const { data: projects = [] } = useQuery({
    queryKey: ['/api/projects'],
    queryFn: () => apiRequest('/api/projects')
  });
  
  const form = useForm({
    resolver: zodResolver(activitySchema),
    defaultValues: {
      project_id: 0,
      name: '',
      description: '',
      control_presence: true,
      status: 'ativa'
    }
  });

  // Força o reset do formulário quando activity muda
  useEffect(() => {
    if (open) {
      const values = activity ? {
        project_id: activity.project_id || projectId || 0,
        name: activity.name || '',
        description: activity.description || '',
        control_presence: activity.control_presence ?? activity.requires_attendance ?? true,
        status: activity.status || 'ativa'
      } : {
        project_id: projectId || 0,
        name: '',
        description: '',
        control_presence: true,
        status: 'ativa'
      };
      
      form.reset(values);
    }
  }, [open, activity, projectId, form]);

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/pec/activities', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/pec/activities'] });
      toast({ title: "Oficina criada com sucesso!" });
      onClose();
      form.reset();
    },
    onError: () => {
      toast({ title: "Erro ao criar oficina", variant: "destructive" });
    }
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => apiRequest(`/api/pec/activities/${activity?.id}`, { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/pec/activities'] });
      toast({ title: "Oficina atualizada com sucesso!" });
      onClose();
    },
    onError: () => {
      toast({ title: "Erro ao atualizar oficina", variant: "destructive" });
    }
  });

  const onSubmit = (data: any) => {
    const formattedData = {
      project_id: data.project_id,
      name: data.name,
      description: data.description,
      control_presence: data.control_presence,
      status: data.status
    };

    if (activity) {
      updateMutation.mutate(formattedData);
    } else {
      createMutation.mutate(formattedData);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{activity ? 'Editar Oficina' : 'Nova Oficina'}</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="project_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Projeto *</FormLabel>
                  <Select 
                    onValueChange={(value) => field.onChange(parseInt(value))} 
                    value={field.value?.toString() || ""}
                  >
                    <FormControl>
                      <SelectTrigger data-testid="select-activity-project">
                        <SelectValue placeholder="Selecione o projeto" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {projects.map((project: any) => (
                        <SelectItem key={project.id} value={project.id.toString()}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da Oficina *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Aula de Teatro" {...field} data-testid="input-activity-name" />
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
                  <FormLabel>Descrição *</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Descreva a atividade e seus objetivos" 
                      className="min-h-[80px]"
                      {...field} 
                      data-testid="textarea-activity-description"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />



            <FormField
              control={form.control}
              name="control_presence"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      data-testid="checkbox-activity-attendance"
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Controle de Presença</FormLabel>
                    <p className="text-sm text-muted-foreground">
                      Marque se esta atividade requer controle de presença
                    </p>
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-activity-status">
                        <SelectValue placeholder="Selecione o status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="ativa">Ativo</SelectItem>
                      <SelectItem value="inativa">Inativo</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={onClose} data-testid="btn-cancel-activity">
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={createMutation.isPending || updateMutation.isPending}
                data-testid="btn-save-activity"
              >
                {activity ? 'Atualizar' : 'Criar'} Oficina
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// Instance Form Component
export function InstanceForm({ 
  open, 
  onClose, 
  instance = null,
  activityId = null,
  monitorUserId = null
}: { 
  open: boolean; 
  onClose: () => void; 
  instance?: any | null;
  activityId?: number | null;
  monitorUserId?: number | null;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Buscar lista de projetos
  const { data: projects = [] } = useQuery({
    queryKey: ['/api/projects'],
    queryFn: () => apiRequest('/api/projects')
  });

  // Buscar lista de atividades PEC
  const { data: allActivities = [] } = useQuery({
    queryKey: ['/api/pec/activities'],
    queryFn: () => apiRequest('/api/pec/activities')
  });

  // Buscar lista de educadores do programa PEC
  const { data: professors = [] } = useQuery({
    queryKey: ['/api/educadores/pec'],
    queryFn: () => apiRequest('/api/educadores/pec')
  });

  // Buscar lista de alunos
  const { data: students = [] } = useQuery({
    queryKey: ['/api/students/all'], 
    queryFn: () => apiRequest('/api/students/all')
  });
  
  const form = useForm({
    resolver: zodResolver(instanceSchema),
    defaultValues: instance ? {
      project_id: instance.project_id || 0,
      activity_id: instance.activity_id || activityId || 0,
      title: instance.title || '',
      code: instance.code || '',
      min_age: instance.min_age || 6,
      max_age: instance.max_age || 17,
      start_date: instance.start_date ? new Date(instance.start_date) : new Date(),
      end_date: instance.end_date ? new Date(instance.end_date) : new Date(),
      location: instance.location || '',
      situation: instance.situation || 'planejamento',
      period: instance.period || 'matutino',
      start_time: instance.start_time || '',
      end_time: instance.end_time || '',
      total_hours: instance.total_hours || 0,
      observations: instance.observations || '',
      control_mode: instance.control_mode || 'manual',
      intelbras_group_id: instance.intelbras_group_id || '',
      professor_id: instance.professor_id || 0,
      selected_students: instance.selected_students || [],

      // ✅ NOVO
      diasSemana: instance.diasSemana || instance.days_of_week || [],
    } : {
      project_id: 0,
      activity_id: activityId || 0,
      title: '',
      code: '',
      min_age: 6,
      max_age: 17,
      start_date: new Date(),
      end_date: new Date(),
      location: '',
      situation: 'planejamento',
      period: 'matutino',
      start_time: '',
      end_time: '',
      total_hours: 0,
      observations: '',
      control_mode: 'manual',
      intelbras_group_id: '',
      professor_id: 0,
      selected_students: [],

      // ✅ NOVO
      diasSemana: [],
    }
  });

  // Observar mudanças no projeto selecionado
  const selectedProjectId = form.watch('project_id');
  
  // Filtrar atividades pelo projeto selecionado
  const activities = allActivities.filter((activity: any) => 
    selectedProjectId ? activity.project_id === selectedProjectId : true
  );

  // Professor selection for linking
  const [professorSelections, setProfessorSelections] = useState<Array<{ id: number; cor: string; icone: string }>>([]);

  const { data: professoresDisponiveis = [] } = useQuery({
    queryKey: ['/api/coordenador/professores', 'pec'],
    queryFn: async () => {
      const response = await fetch('/api/coordenador/professores?programa=pec');
      if (!response.ok) return [];
      return response.json();
    },
    enabled: open,
  });

  const { data: vinculadosExistentes = [] } = useQuery({
    queryKey: ['/api/coordenador/professor-turmas', instance?.id, 'pec'],
    queryFn: async () => {
      const response = await fetch(`/api/coordenador/professor-turmas/${instance?.id}?tipo=pec`);
      if (!response.ok) return [];
      return response.json();
    },
    enabled: open && !!instance?.id,
  });

  useEffect(() => {
    if (vinculadosExistentes.length > 0) {
      setProfessorSelections(vinculadosExistentes.map((v: any) => ({
        id: v.professor_id,
        cor: v.cor || '#3B82F6',
        icone: v.icone || 'book'
      })));
    } else if (!instance?.id) {
      setProfessorSelections([]);
    }
  }, [vinculadosExistentes, instance?.id]);

  // Reset form with correct field mapping when dialog opens or instance changes
  useEffect(() => {
    if (!open) return;
    const activity = allActivities.find((a: any) => a.id === (instance?.activity_id || 0));
    const projectId = activity?.project_id || instance?.project_id || 0;
    form.reset(instance ? {
      project_id: projectId,
      activity_id: instance.activity_id || 0,
      title: instance.title || instance.nome || instance.name || '',
      code: instance.code || instance.codigo || '',
      min_age: instance.min_age ?? instance.age_min ?? 6,
      max_age: instance.max_age ?? instance.age_max ?? 17,
      start_date: instance.start_date ? new Date(instance.start_date)
        : instance.occurrence_start ? new Date(instance.occurrence_start)
        : instance.dataInicio ? new Date(instance.dataInicio) : new Date(),
      end_date: instance.end_date ? new Date(instance.end_date)
        : instance.occurrence_end ? new Date(instance.occurrence_end)
        : instance.dataFim ? new Date(instance.dataFim) : new Date(),
      location: instance.location || instance.local || '',
      situation: instance.situation || instance.status || 'planejamento',
      period: instance.period || instance.period_label || 'matutino',
      start_time: (instance.start_time || instance.horarioInicio) ? String(instance.start_time || instance.horarioInicio).slice(0, 5) : '',
      end_time: (instance.end_time || instance.horarioFim) ? String(instance.end_time || instance.horarioFim).slice(0, 5) : '',
      total_hours: instance.total_hours || instance.expected_total_hours || 0,
      observations: instance.observations || instance.notes || '',
      control_mode: instance.control_mode || 'manual',
      intelbras_group_id: instance.intelbras_group_id || '',
      professor_id: instance.professor_id || 0,
      selected_students: [],
      diasSemana: instance.diasSemana || instance.dias_semana || [],
    } : {
      project_id: 0,
      activity_id: activityId || 0,
      title: '',
      code: '',
      min_age: 6,
      max_age: 17,
      start_date: new Date(),
      end_date: new Date(),
      location: '',
      situation: 'planejamento',
      period: 'matutino',
      start_time: '',
      end_time: '',
      total_hours: 0,
      observations: '',
      control_mode: 'manual',
      intelbras_group_id: '',
      professor_id: 0,
      selected_students: [],
      diasSemana: [],
    });
  }, [open, instance?.id]);

  const linkProfessorsToTurma = async (turmaId: number) => {
    if (professorSelections.length > 0) {
      try {
        await apiRequest(`/api/coordenador/professor-turmas/${turmaId}`, {
          method: 'PUT',
          body: JSON.stringify({
            professores: professorSelections.map(s => ({ id: s.id, cor: s.cor, icone: s.icone })),
            turmaTipo: 'pec'
          })
        });
      } catch (err) {
        console.error("Erro ao vincular professores:", err);
      }
    }
  };

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/pec/instances', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: async (response: any) => {
      let turmaId: number | null = null;
      try {
        const result = typeof response === 'object' && response.id ? response : (response?.json ? await response.json() : null);
        turmaId = result?.id || result?.turmaId || null;
      } catch {}
      if (turmaId && professorSelections.length > 0) {
        await linkProfessorsToTurma(turmaId);
      }
      queryClient.invalidateQueries({ queryKey: ['/api/pec/instances'] });
      queryClient.invalidateQueries({ queryKey: ['/api/coordenador/professor-turmas'] });
      toast({ title: "Turma criada com sucesso!" });
      onClose();
      form.reset();
      setProfessorSelections([]);
    },
    onError: () => {
      toast({ title: "Erro ao criar turma", variant: "destructive" });
    }
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => apiRequest(`/api/pec/instances/${instance?.id}`, { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: async () => {
      if (instance?.id) {
        await linkProfessorsToTurma(instance.id);
      }
      queryClient.invalidateQueries({ queryKey: ['/api/pec/instances'] });
      queryClient.invalidateQueries({ queryKey: ['/api/coordenador/professor-turmas'] });
      toast({ title: "Turma atualizada com sucesso!" });
      onClose();
    },
    onError: () => {
      toast({ title: "Erro ao atualizar turma", variant: "destructive" });
    }
  });

  const DIAS = [
  { key: "seg", label: "Segunda" },
  { key: "ter", label: "Terça" },
  { key: "qua", label: "Quarta" },
  { key: "qui", label: "Quinta" },
  { key: "sex", label: "Sexta" },
  { key: "sab", label: "Sábado" },
  { key: "dom", label: "Domingo" },
];

  const onSubmit = (data: any) => {
    if (!data.diasSemana || data.diasSemana.length === 0) {
      toast({ title: "Selecione os dias da semana", description: "É obrigatório selecionar pelo menos um dia da semana para a turma.", variant: "destructive" });
      return;
    }
    const DAY_MAP: Record<string, number> = { 'Segunda': 1, 'Terça': 2, 'Quarta': 3, 'Quinta': 4, 'Sexta': 5, 'Sábado': 6, 'Domingo': 0 };
    let calculatedHours: number | undefined = undefined;
    if (data.start_date && data.end_date && data.start_time && data.end_time && data.diasSemana.length > 0) {
      const jsDays = data.diasSemana.map((d: string) => DAY_MAP[d]).filter((d: number | undefined) => d !== undefined);
      const [sh, sm] = data.start_time.split(':').map(Number);
      const [eh, em] = data.end_time.split(':').map(Number);
      const hoursPerSession = Math.max(0, (eh * 60 + em - sh * 60 - sm) / 60);
      const current = new Date(data.start_date);
      const end = new Date(data.end_date);
      current.setHours(0, 0, 0, 0);
      end.setHours(0, 0, 0, 0);
      let classDays = 0;
      while (current <= end) {
        if (jsDays.includes(current.getDay())) classDays++;
        current.setDate(current.getDate() + 1);
      }
      calculatedHours = Math.round(classDays * hoursPerSession * 100) / 100;
    }
    const formattedData = {
      ...data,
      ...(calculatedHours !== undefined ? { total_hours: calculatedHours } : instance ? {} : { total_hours: 0 }),
      occurrence_start: format(data.start_date, 'yyyy-MM-dd'),
      occurrence_end: format(data.end_date, 'yyyy-MM-dd'),
      start_date: format(data.start_date, 'yyyy-MM-dd'),
      end_date: format(data.end_date, 'yyyy-MM-dd'),
      monitorUserId: monitorUserId || null
    };
    
    if (instance) {
      updateMutation.mutate(formattedData);
    } else {
      createMutation.mutate(formattedData);
    }
  };


  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{instance ? 'Editar Turma' : 'Nova Turma'}</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="project_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Projeto *</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(parseInt(value))} 
                      value={field.value?.toString() || ""}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-instance-project">
                          <SelectValue placeholder="Selecione o projeto" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {projects.map((project: any) => (
                          <SelectItem key={project.id} value={project.id.toString()}>
                            {project.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="activity_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Oficina *</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(parseInt(value))} 
                      value={field.value?.toString() || ""}
                      disabled={activities.length === 0}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-instance-activity">
                          <SelectValue placeholder={activities.length === 0 ? "Nenhuma oficina disponível" : "Selecione a oficina"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {activities.length === 0 ? (
                          <SelectItem value="none" disabled>Nenhuma oficina para este projeto</SelectItem>
                        ) : activities.map((activity: any) => (
                          <SelectItem key={activity.id} value={activity.id.toString()}>
                            {activity.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {activities.length === 0 && selectedProjectId > 0 && (
                      <p className="text-xs text-amber-600">Este projeto não possui oficinas cadastradas. Cadastre uma oficina primeiro.</p>
                    )}
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
                  <FormLabel>Título da Turma *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Teatro Infantil - Turma A" {...field} data-testid="input-instance-title" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="min_age"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Idade Mínima *</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0" 
                        {...field} 
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                        data-testid="input-instance-min-age"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="max_age"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Idade Máxima *</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0" 
                        {...field} 
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                        data-testid="input-instance-max-age"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="start_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data de Início *</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button 
                            variant="outline" 
                            className="pl-3 text-left font-normal"
                            data-testid="btn-instance-start-date"
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
                name="end_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data de Fim *</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button 
                            variant="outline" 
                            className="pl-3 text-left font-normal"
                            data-testid="btn-instance-end-date"
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
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <FormField
                control={form.control}
                name="situation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Situação *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-instance-situation">
                          <SelectValue placeholder="Selecione a situação" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="planejamento">Planejamento</SelectItem>
                        <SelectItem value="execucao">Execução</SelectItem>
                        <SelectItem value="encerrada">Encerrada</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="period"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Período do Dia *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-instance-period">
                          <SelectValue placeholder="Selecione o período" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="matutino">Matutino</SelectItem>
                        <SelectItem value="vespertino">Vespertino</SelectItem>
                        <SelectItem value="noturno">Noturno</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="start_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Horário de Início *</FormLabel>
                    <FormControl>
                      <Input 
                        type="time" 
                        placeholder="08:00" 
                        {...field} 
                        data-testid="input-instance-start-time"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="end_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Horário de Fim *</FormLabel>
                    <FormControl>
                      <Input 
                        type="time" 
                        placeholder="10:00" 
                        {...field} 
                        data-testid="input-instance-end-time"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Local *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Quadra poliesportiva" {...field} data-testid="input-instance-location" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

            </div>

            <FormField
              control={form.control}
              name="diasSemana"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dias da Semana</FormLabel>
                  <div className="flex flex-wrap gap-2">
                    {DIAS.map((dia) => {
                      const isSelected = (field.value || []).includes(dia.label);
                      return (
                        <button
                          key={dia.key}
                          type="button"
                          onClick={() => {
                            const current = field.value || [];
                            if (isSelected) {
                              field.onChange(current.filter((d: string) => d !== dia.label));
                            } else {
                              field.onChange([...current, dia.label]);
                            }
                          }}
                          className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                            isSelected
                              ? 'bg-purple-600 text-white border-purple-600'
                              : 'bg-white text-gray-700 border-gray-300 hover:border-purple-400'
                          }`}
                        >
                          {dia.label}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Selecione os dias em que a turma acontece</p>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Professor Selection */}
            <div className="border-t pt-4">
              <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-blue-500" />
                Professores Vinculados
              </h3>
              {professoresDisponiveis.filter((p: any) => p.ativo).length === 0 ? (
                <p className="text-sm text-gray-500">Nenhum professor cadastrado.</p>
              ) : (
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
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

            <FormField
              control={form.control}
              name="observations"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Observações adicionais sobre a turma" 
                      className="min-h-[80px]"
                      {...field} 
                      data-testid="textarea-instance-observations"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4 border-t pt-4">
              <h3 className="text-lg font-medium">Controle de Presença</h3>
              
              <FormField
                control={form.control}
                name="control_mode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Modo de Controle *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-control-mode">
                          <SelectValue placeholder="Selecione o modo de controle" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="manual">Manual - Educador marca presença</SelectItem>
                        <SelectItem value="intelbras">Intelbras - Controle automático via portaria</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {form.watch('control_mode') === 'intelbras' && (
                <FormField
                  control={form.control}
                  name="intelbras_group_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ID do Grupo Intelbras *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Ex: TURMA_M1_2025" 
                          {...field} 
                          data-testid="input-intelbras-group-id"
                        />
                      </FormControl>
                      <FormMessage />
                      <p className="text-sm text-gray-600">
                        ID da turma no sistema Intelbras para buscar registros de entrada/saída.
                      </p>
                    </FormItem>
                  )}
                />
              )}
            </div>

            {(() => {
              // removed student selection section - use dedicated "Gerenciar Alunos" button instead
              return null;
            })()}



            {(() => {
              const DAY_LABEL_TO_JS: Record<string, number> = { 'Segunda': 1, 'Terça': 2, 'Quarta': 3, 'Quinta': 4, 'Sexta': 5, 'Sábado': 6, 'Domingo': 0 };
              const watchDias = form.watch('diasSemana') || [];
              const watchStartDate = form.watch('start_date');
              const watchEndDate = form.watch('end_date');
              const watchStartTime = form.watch('start_time');
              const watchEndTime = form.watch('end_time');

              const jsDays = watchDias.map((d: string) => DAY_LABEL_TO_JS[d]).filter((d: number | undefined) => d !== undefined);
              let classDaysCount = 0;
              let hoursPerSession = 0;

              if (watchStartTime && watchEndTime) {
                const [sh, sm] = watchStartTime.split(':').map(Number);
                const [eh, em] = watchEndTime.split(':').map(Number);
                hoursPerSession = Math.max(0, (eh * 60 + em - sh * 60 - sm) / 60);
              }

              if (watchStartDate && watchEndDate && jsDays.length > 0) {
                const current = new Date(watchStartDate);
                const end = new Date(watchEndDate);
                current.setHours(0, 0, 0, 0);
                end.setHours(0, 0, 0, 0);
                while (current <= end) {
                  if (jsDays.includes(current.getDay())) classDaysCount++;
                  current.setDate(current.getDate() + 1);
                }
              }

              const totalHours = Math.round(classDaysCount * hoursPerSession * 100) / 100;

              if (jsDays.length > 0 && watchStartDate && watchEndDate && hoursPerSession > 0) {
                return (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-blue-800 mb-2">📊 Carga Horária Total Calculada</h4>
                    <div className="text-sm text-blue-700 space-y-1">
                      <p>{classDaysCount} dias de aula × {hoursPerSession.toFixed(1)}h por sessão = <strong>{totalHours}h total</strong></p>
                      <p className="text-xs text-blue-500">Dias: {watchDias.join(', ')} | Período: {format(watchStartDate, 'dd/MM/yyyy')} a {format(watchEndDate, 'dd/MM/yyyy')}</p>
                    </div>
                  </div>
                );
              }
              return null;
            })()}

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={onClose} data-testid="btn-cancel-instance">
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={createMutation.isPending || updateMutation.isPending}
                data-testid="btn-save-instance"
                onClick={() => {
                  const errors = form.formState.errors;
                  if (Object.keys(errors).length > 0) {
                    console.log('Erros de validação:', errors);
                  }
                }}
              >
                {instance ? 'Atualizar' : 'Criar'} Turma
              </Button>
            </div>
            {Object.keys(form.formState.errors).length > 0 && (
              <div className="text-red-500 text-sm mt-2">
                Por favor, preencha todos os campos obrigatórios marcados com *
              </div>
            )}
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// Enrollment Form Component
// Função para preenchimento automático via CEP
const handleCepChange = async (cep: string, form: any) => {
  const cleanCep = cep.replace(/\D/g, '');
  
  // Atualiza o estado com o CEP formatado
  form.setValue('cep', cleanCep.replace(/(\d{5})(\d{3})/, '$1-$2'));

  // Se CEP tem 8 dígitos, busca automaticamente
  if (cleanCep.length === 8) {
    try {
      const viaCepResponse = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const viaCepData = await viaCepResponse.json();

      if (!viaCepData.erro) {
        form.setValue('logradouro', viaCepData.logradouro || '');
        form.setValue('bairro', viaCepData.bairro || '');
        form.setValue('cidade', viaCepData.localidade || '');
        form.setValue('estado', viaCepData.uf || '');
      }
    } catch (error) {
      console.log('Erro ao buscar CEP:', error);
    }
  }
};

export function EnrollmentForm({ 
  open, 
  onClose, 
  enrollment = null,
  instanceId = null 
}: { 
  open: boolean; 
  onClose: () => void; 
  enrollment?: any | null;
  instanceId?: number | null;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const form = useForm({
    resolver: zodResolver(enrollmentSchema),
    defaultValues: enrollment ? {
      // Sistema
      instance_id: enrollment.instance_id || instanceId || 0,
      professorId: enrollment.professorId || undefined,
      active: enrollment.active ?? true,
      
      // Seção 1: Identificação
      cpf: enrollment.cpf || '',
      nome_completo: enrollment.nome_completo || '',
      foto_perfil: enrollment.foto_perfil || '',
      data_nascimento: enrollment.data_nascimento ? new Date(enrollment.data_nascimento) : new Date(),
      genero: enrollment.genero || 'masculino',
      numero_matricula: enrollment.numero_matricula || '',
      familia_nome: enrollment.familia_nome || '',
      situacao_atendimento: enrollment.situacao_atendimento || 'ativo',
      estado_civil: enrollment.estado_civil || '',
      religiao: enrollment.religiao || '',
      naturalidade: enrollment.naturalidade || '',
      nacionalidade: enrollment.nacionalidade || 'Brasileira',
      pode_sair_sozinho: enrollment.pode_sair_sozinho || 'nao',
      
      // Seção 2: Dados Complementares
      tamanho_calca: enrollment.tamanho_calca || '',
      tamanho_camiseta: enrollment.tamanho_camiseta || '',
      tamanho_calcado: enrollment.tamanho_calcado || '',
      cor_raca: enrollment.cor_raca || '',
      frequenta_projeto_social: enrollment.frequenta_projeto_social || 'nao',
      acesso_internet: enrollment.acesso_internet || 'nao',
      
      // Seção 3: Endereço
      cep: enrollment.cep || '',
      logradouro: enrollment.logradouro || '',
      numero: enrollment.numero || '',
      bairro: enrollment.bairro || '',
      cidade: enrollment.cidade || '',
      estado: enrollment.estado || '',
      complemento: enrollment.complemento || '',
      ponto_referencia: enrollment.ponto_referencia || '',
      mora_desde: enrollment.mora_desde || '',
      
      // Seção 4: Contatos
      email: enrollment.email || '',
      telefone: enrollment.telefone || '',
      whatsapp: enrollment.whatsapp || '',
      contato_emergencia_nome: enrollment.contato_emergencia_nome || '',
      contato_emergencia_telefone: enrollment.contato_emergencia_telefone || '',
      contato_emergencia_whatsapp: enrollment.contato_emergencia_whatsapp || '',
      
      // Seção 5: Documentos
      rg: enrollment.rg || '',
      orgao_emissor: enrollment.orgao_emissor || '',
      ctps_numero: enrollment.ctps_numero || '',
      ctps_serie: enrollment.ctps_serie || '',
      titulo_eleitor: enrollment.titulo_eleitor || '',
      nis_pis_pasep: enrollment.nis_pis_pasep || '',
      documentos_possui: enrollment.documentos_possui || [],
      upload_identidade_frente: enrollment.upload_identidade_frente || '',
      upload_identidade_verso: enrollment.upload_identidade_verso || '',
      
      // Demais seções com valores padrão...
      observacoes_gerais: enrollment.observacoes_gerais || ''
    } : {
      // Valores padrão para novo aluno
      instance_id: instanceId || 0,
      professorId: undefined,
      active: true,
      
      // Seção 1
      cpf: '',
      nome_completo: '',
      foto_perfil: '',
      data_nascimento: new Date(),
      genero: 'masculino',
      numero_matricula: '',
      familia_nome: '',
      situacao_atendimento: 'ativo',
      estado_civil: '',
      religiao: '',
      naturalidade: '',
      nacionalidade: 'Brasileira',
      pode_sair_sozinho: 'nao',
      
      // Seção 2
      tamanho_calca: '',
      tamanho_camiseta: '',
      tamanho_calcado: '',
      cor_raca: '',
      frequenta_projeto_social: 'nao',
      acesso_internet: 'nao',
      
      // Seção 3
      cep: '',
      logradouro: '',
      numero: '',
      bairro: '',
      cidade: '',
      estado: '',
      complemento: '',
      ponto_referencia: '',
      mora_desde: '',
      
      // Seção 4
      email: '',
      telefone: '',
      whatsapp: '',
      contato_emergencia_nome: '',
      contato_emergencia_telefone: '',
      contato_emergencia_whatsapp: '',
      
      // Seção 5
      rg: '',
      orgao_emissor: '',
      ctps_numero: '',
      ctps_serie: '',
      titulo_eleitor: '',
      nis_pis_pasep: '',
      documentos_possui: [],
      upload_identidade_frente: '',
      upload_identidade_verso: '',
      
      // Demais campos
      observacoes_gerais: ''
    }
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/pec/enrollments', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/pec/enrollments'] });
      toast({ title: "Inscrição criada com sucesso!" });
      onClose();
      form.reset();
    },
    onError: () => {
      toast({ title: "Erro ao criar inscrição", variant: "destructive" });
    }
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => apiRequest(`/api/pec/enrollments/${enrollment?.id}`, { method: 'PUT', body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/pec/enrollments'] });
      toast({ title: "Inscrição atualizada com sucesso!" });
      onClose();
    },
    onError: () => {
      toast({ title: "Erro ao atualizar inscrição", variant: "destructive" });
    }
  });

  const onSubmit = (data: any) => {
    const formattedData = {
      ...data,
      data_nascimento: format(data.data_nascimento, 'yyyy-MM-dd')
    };
    
    if (enrollment) {
      updateMutation.mutate(formattedData);
    } else {
      createMutation.mutate(formattedData);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{enrollment ? 'Editar Inscrição' : 'Nova Inscrição'}</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Dados Pessoais */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Dados Pessoais</h3>
              
              <FormField
                control={form.control}
                name="nome_completo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome Completo *</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome completo do participante" {...field} data-testid="input-enrollment-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="foto_perfil"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <ImageUploader
                        label="Foto do Perfil"
                        value={field.value}
                        onChange={field.onChange}
                        size="máx. 20 MB"
                        required={false}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="cpf"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CPF *</FormLabel>
                      <FormControl>
                        <Input placeholder="000.000.000-00" {...field} data-testid="input-enrollment-cpf" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="rg"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>RG *</FormLabel>
                      <FormControl>
                        <Input placeholder="00.000.000-0" {...field} data-testid="input-enrollment-rg" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="data_nascimento"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Data de Nascimento *</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button 
                              variant="outline" 
                              className="pl-3 text-left font-normal"
                              data-testid="btn-enrollment-birth-date"
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
              </div>

              <FormField
                control={form.control}
                name="genero"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gênero *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-enrollment-gender">
                          <SelectValue placeholder="Selecione o gênero" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="masculino">Masculino</SelectItem>
                        <SelectItem value="feminino">Feminino</SelectItem>
                        <SelectItem value="outro">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Endereço */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Endereço</h3>
              
              <FormField
                control={form.control}
                name="logradouro"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Endereço *</FormLabel>
                    <FormControl>
                      <Input placeholder="Rua, número, complemento" {...field} data-testid="input-enrollment-address" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <FormField
                  control={form.control}
                  name="bairro"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bairro *</FormLabel>
                      <FormControl>
                        <Input placeholder="Bairro" {...field} data-testid="input-enrollment-neighborhood" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="cidade"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cidade *</FormLabel>
                      <FormControl>
                        <Input placeholder="Cidade" {...field} data-testid="input-enrollment-city" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="estado"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estado *</FormLabel>
                      <FormControl>
                        <Input placeholder="UF" {...field} data-testid="input-enrollment-state" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="cep"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CEP *</FormLabel>
                      <FormControl>
                        <Input placeholder="00000-000" {...field} data-testid="input-enrollment-zip" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Contato */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Contato</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="telefone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefone *</FormLabel>
                      <FormControl>
                        <Input placeholder="(00) 00000-0000" {...field} data-testid="input-enrollment-phone" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="email@exemplo.com" {...field} data-testid="input-enrollment-email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Documentos */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Documentos</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="upload_identidade_frente"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <ImageUploader
                          label="Identidade (Frente)"
                          value={field.value}
                          onChange={field.onChange}
                          size="máx. 10 MB"
                          required={false}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="upload_identidade_verso"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <ImageUploader
                          label="Identidade (Verso)"
                          value={field.value}
                          onChange={field.onChange}
                          size="máx. 10 MB"
                          required={false}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Responsável */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Dados do Responsável</h3>
              
              <FormField
                control={form.control}
                name="contato_emergencia_nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Responsável *</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome completo do responsável" {...field} data-testid="input-enrollment-responsible-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="contato_emergencia_telefone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefone do Responsável *</FormLabel>
                      <FormControl>
                        <Input placeholder="(00) 00000-0000" {...field} data-testid="input-enrollment-responsible-phone" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="contato_emergencia_whatsapp"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email do Responsável</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="email@exemplo.com" {...field} data-testid="input-enrollment-responsible-email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Informações Adicionais */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Informações Adicionais</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="escolaridade"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome da Escola</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome da escola" {...field} data-testid="input-enrollment-school-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="observacoes_educacao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Série/Ano</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: 5º ano" {...field} data-testid="input-enrollment-school-grade" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="observacoes_saude"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Condições Médicas</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Descreva condições médicas relevantes" 
                        className="min-h-[60px]"
                        {...field} 
                        data-testid="textarea-enrollment-medical"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="upload_laudo_medico"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <ImageUploader
                        label="Laudo Médico (opcional)"
                        value={field.value}
                        onChange={field.onChange}
                        size="máx. 10 MB"
                        required={false}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="faz_uso_medicamento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Medicações em Uso</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Liste medicações utilizadas regularmente" 
                        className="min-h-[60px]"
                        {...field} 
                        data-testid="textarea-enrollment-medications"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="contato_emergencia_nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contato de Emergência</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome e telefone para emergências" {...field} data-testid="input-enrollment-emergency" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="observacoes_gerais"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observações</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Observações adicionais" 
                        className="min-h-[60px]"
                        {...field} 
                        data-testid="textarea-enrollment-observations"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={onClose} data-testid="btn-cancel-enrollment">
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={createMutation.isPending || updateMutation.isPending}
                data-testid="btn-save-enrollment"
              >
                {enrollment ? 'Atualizar' : 'Criar'} Inscrição
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// Session Form Component
export function SessionForm({ 
  open, 
  onClose, 
  session = null,
  instanceId = null 
}: { 
  open: boolean; 
  onClose: () => void; 
  session?: any | null;
  instanceId?: number | null;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch instance data to get control mode and intelbras_group_id
  const { data: instance } = useQuery({
    queryKey: ['/api/pec/instances', instanceId],
    queryFn: () => apiRequest(`/api/pec/instances/${instanceId}`),
    enabled: !!instanceId
  }) as { data: any };
  
  const form = useForm({
    resolver: zodResolver(sessionSchema),
    defaultValues: session ? {
      instance_id: session.instance_id || instanceId || 0,
      session_date: session.session_date ? new Date(session.session_date) : new Date(),
      start_time: session.start_time || '',
      end_time: session.end_time || '',
      content_summary: session.content_summary || '',
      educators: session.educators || '',
      location: session.location || '',
      observations: session.observations || '',
      materials_used: session.materials_used || '',
      attendance_count: session.attendance_count || 0
    } : {
      instance_id: instanceId || 0,
      session_date: new Date(),
      start_time: '',
      end_time: '',
      content_summary: '',
      educators: '',
      location: '',
      observations: '',
      materials_used: '',
      attendance_count: 0
    }
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/pec/sessions', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/pec/sessions'] });
      toast({ title: "Sessão criada com sucesso!" });
      onClose();
      form.reset();
    },
    onError: () => {
      toast({ title: "Erro ao criar sessão", variant: "destructive" });
    }
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => apiRequest(`/api/pec/sessions/${session?.id}`, { method: 'PUT', body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/pec/sessions'] });
      toast({ title: "Sessão atualizada com sucesso!" });
      onClose();
    },
    onError: () => {
      toast({ title: "Erro ao atualizar sessão", variant: "destructive" });
    }
  });

  const onSubmit = (data: any) => {
    const formattedData = {
      ...data,
      session_date: format(data.session_date, 'yyyy-MM-dd')
    };
    
    if (session) {
      updateMutation.mutate(formattedData);
    } else {
      createMutation.mutate(formattedData);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{session ? 'Editar Sessão' : 'Nova Sessão'}</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="session-info" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="session-info">Dados da Sessão</TabsTrigger>
            <TabsTrigger value="attendance" disabled={!session}>Controle de Presença</TabsTrigger>
          </TabsList>
          
          <TabsContent value="session-info">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="session_date"
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
                name="start_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Horário de Início *</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} data-testid="input-session-start-time" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="end_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Horário de Fim *</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} data-testid="input-session-end-time" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="content_summary"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Resumo do Conteúdo/Atividade *</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Descreva o que foi trabalhado na sessão" 
                      className="min-h-[100px]"
                      {...field} 
                      data-testid="textarea-session-content"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="educators"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Educador(es) Responsável(eis) *</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome dos educadores" {...field} data-testid="input-session-educators" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Local *</FormLabel>
                    <FormControl>
                      <Input placeholder="Local onde ocorreu a sessão" {...field} data-testid="input-session-location" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="materials_used"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Materiais Utilizados</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Liste os materiais utilizados" 
                        className="min-h-[60px]"
                        {...field} 
                        data-testid="textarea-session-materials"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="attendance_count"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número de Presentes</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0"
                        placeholder="0"
                        {...field} 
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        data-testid="input-session-attendance"
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
                      placeholder="Observações sobre a sessão" 
                      className="min-h-[60px]"
                      {...field} 
                      data-testid="textarea-session-observations"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
                )}
            />

                <div className="flex justify-end gap-3">
                  <Button type="button" variant="outline" onClick={onClose} data-testid="btn-cancel-session">
                    Cancelar
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createMutation.isPending || updateMutation.isPending}
                    data-testid="btn-save-session"
                  >
                    {session ? 'Atualizar' : 'Criar'} Sessão
                  </Button>
                </div>
              </form>
            </Form>
          </TabsContent>
          
          <TabsContent value="attendance">
            {session && instanceId && (
              <AttendanceControl
                sessionId={session.id}
                instanceId={instanceId}
                sessionDate={session.session_date || new Date().toISOString().split('T')[0]}
                controlMode={instance?.control_mode || 'manual'}
                intelbrasGroupId={instance?.intelbras_group_id}
              />
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}