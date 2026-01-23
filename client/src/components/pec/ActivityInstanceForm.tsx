import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { 
  CalendarIcon, 
  X, 
  Plus, 
  Users, 
  Settings,
  MapPin,
  Clock
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
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
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

// Schema para validação da turma
const activityInstanceSchema = z.object({
  activity_id: z.number().min(1, "Atividade é obrigatória"),
  title: z.string().min(1, "Título da turma é obrigatório"),
  code: z.string().optional(),
  location: z.string().min(1, "Local é obrigatório"),
  situation: z.enum(['execucao', 'planejamento', 'encerrada'], {
    required_error: "Situação é obrigatória"
  }),
  period_label: z.enum(['matutino', 'vespertino', 'noturno'], {
    required_error: "Período do dia é obrigatório"
  }),
  age_min: z.number().min(0, "Idade mínima deve ser maior ou igual a 0"),
  age_max: z.number().min(1, "Idade máxima deve ser maior que 0"),
  occurrence_start: z.date({ required_error: "Data de início é obrigatória" }),
  occurrence_end: z.date({ required_error: "Data de fim é obrigatória" }),
  expected_total_hours: z.number().optional(),
  notes: z.string().optional(),
  staff_assignments: z.array(z.object({
    user_id: z.number(),
    role: z.enum(['gestor', 'monitor', 'educador'])
  }))
});

interface StaffMember {
  id: number;
  nome: string;
  sobrenome: string;
  role: 'gestor' | 'monitor' | 'educador';
}

interface ActivityInstanceFormProps {
  open: boolean;
  onClose: () => void;
  instance?: any | null;
  activityId?: number | null;
}

export function ActivityInstanceForm({ 
  open, 
  onClose, 
  instance = null,
  activityId = null 
}: ActivityInstanceFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedStaff, setSelectedStaff] = useState<StaffMember[]>(
    instance?.staff_assignments?.map((assignment: any) => ({
      id: assignment.user_id,
      nome: assignment.user_name || '',
      sobrenome: assignment.user_surname || '',
      role: assignment.role
    })) || []
  );

  const form = useForm({
    resolver: zodResolver(activityInstanceSchema),
    defaultValues: instance ? {
      activity_id: instance.activity_id || activityId || 0,
      title: instance.title || '',
      code: instance.code || '',
      location: instance.location || '',
      situation: instance.situation || 'planejamento',
      period_label: instance.period_label || 'matutino',
      age_min: instance.age_min || 6,
      age_max: instance.age_max || 17,
      occurrence_start: instance.occurrence_start ? new Date(instance.occurrence_start) : new Date(),
      occurrence_end: instance.occurrence_end ? new Date(instance.occurrence_end) : new Date(),
      expected_total_hours: instance.expected_total_hours || 0,
      notes: instance.notes || '',
      staff_assignments: []
    } : {
      activity_id: activityId || 0,
      title: '',
      code: '',
      location: '',
      situation: 'planejamento',
      period_label: 'matutino',
      age_min: 6,
      age_max: 17,
      occurrence_start: new Date(),
      occurrence_end: new Date(),
      expected_total_hours: 0,
      notes: '',
      staff_assignments: []
    }
  });

  // Buscar usuários disponíveis para staff
  const { data: availableUsers = [] } = useQuery({
    queryKey: ['/api/users', 'staff'],
    queryFn: () => apiRequest('/api/users?role=staff'),
    enabled: open
  }) as { data: any[] };

  // Criar/Atualizar turma
  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const formattedData = {
        ...data,
        occurrence_start: format(data.occurrence_start, 'yyyy-MM-dd'),
        occurrence_end: format(data.occurrence_end, 'yyyy-MM-dd')
      };

      if (instance) {
        return apiRequest(`/api/instances/${instance.id}`, { 
          method: 'PUT', 
          body: formattedData 
        });
      } else {
        return apiRequest(`/api/activities/${activityId}/instances`, { 
          method: 'POST', 
          body: formattedData 
        });
      }
    },
    onSuccess: async (savedInstance) => {
      // Criar/atualizar atribuições de staff
      if (selectedStaff.length > 0) {
        for (const staffMember of selectedStaff) {
          await apiRequest(`/api/instances/${savedInstance.id}/staff`, {
            method: 'POST',
            body: {
              user_id: staffMember.id,
              role: staffMember.role
            }
          });
        }
      }

      queryClient.invalidateQueries({ queryKey: ['/api/instances'] });
      queryClient.invalidateQueries({ queryKey: ['/api/activities'] });
      toast({ title: instance ? "Turma atualizada com sucesso!" : "Turma criada com sucesso!" });
      onClose();
      form.reset();
      setSelectedStaff([]);
    },
    onError: (error: any) => {
      toast({ 
        title: "Erro ao salvar turma", 
        description: error?.message || "Ocorreu um erro inesperado",
        variant: "destructive" 
      });
    }
  });

  const handleAddStaff = (userId: string, role: 'gestor' | 'monitor' | 'educador') => {
    const user = availableUsers.find(u => u.id === parseInt(userId));
    if (!user) return;

    // Verificar se o usuário já está na equipe
    if (selectedStaff.find(s => s.id === user.id)) {
      toast({ 
        title: "Usuário já está na equipe", 
        variant: "destructive" 
      });
      return;
    }

    setSelectedStaff(prev => [...prev, {
      id: user.id,
      nome: user.nome,
      sobrenome: user.sobrenome,
      role
    }]);
  };

  const handleRemoveStaff = (userId: number) => {
    setSelectedStaff(prev => prev.filter(s => s.id !== userId));
  };

  const handleChangeRole = (userId: number, newRole: 'gestor' | 'monitor' | 'educador') => {
    setSelectedStaff(prev => prev.map(s => 
      s.id === userId ? { ...s, role: newRole } : s
    ));
  };

  const onSubmit = (data: any) => {
    // Validar idades
    if (data.age_max <= data.age_min) {
      toast({ 
        title: "Erro de validação", 
        description: "Idade máxima deve ser maior que a idade mínima",
        variant: "destructive" 
      });
      return;
    }

    // Validar datas
    if (data.occurrence_end <= data.occurrence_start) {
      toast({ 
        title: "Erro de validação", 
        description: "Data de fim deve ser posterior à data de início",
        variant: "destructive" 
      });
      return;
    }

    const formattedData = {
      ...data,
      staff_assignments: selectedStaff.map(staff => ({
        user_id: staff.id,
        role: staff.role
      }))
    };

    saveMutation.mutate(formattedData);
  };

  const getRoleBadgeColor = (role: string) => {
    const colors = {
      gestor: 'bg-purple-100 text-purple-800',
      monitor: 'bg-blue-100 text-blue-800',
      educador: 'bg-green-100 text-green-800'
    };
    return colors[role as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getRoleLabel = (role: string) => {
    const labels = {
      gestor: 'Gestor',
      monitor: 'Monitor',
      educador: 'Educador'
    };
    return labels[role as keyof typeof labels] || role;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            {instance ? 'Editar Turma' : 'Nova Turma'}
          </DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Informações Básicas */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Informações Básicas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Título da Turma *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Ex: Contraturno Manhã M1 2025 | 6–8 anos" 
                            {...field} 
                            data-testid="input-instance-title"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Código (opcional)</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Ex: M1, T2, N1" 
                            {...field} 
                            data-testid="input-instance-code"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

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
                          data-testid="input-instance-location"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                    name="period_label"
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
                    name="expected_total_hours"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Horas Previstas</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="Ex: 120" 
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                            data-testid="input-instance-hours"
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
                    name="age_min"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Idade Mínima *</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="0" 
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                            data-testid="input-instance-age-min"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="age_max"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Idade Máxima *</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="1" 
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                            data-testid="input-instance-age-max"
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
                    name="occurrence_start"
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
                    name="occurrence_end"
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

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Observações</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Observações sobre a turma..."
                          className="min-h-[80px]"
                          {...field} 
                          data-testid="textarea-instance-notes"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Equipe/Staff */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Equipe da Turma
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Add Staff Section */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>Adicionar Gestor</Label>
                    <Select onValueChange={(userId) => handleAddStaff(userId, 'gestor')}>
                      <SelectTrigger data-testid="select-add-gestor">
                        <SelectValue placeholder="Selecionar gestor" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableUsers.map((user) => (
                          <SelectItem key={user.id} value={user.id.toString()}>
                            {user.nome} {user.sobrenome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Adicionar Monitor</Label>
                    <Select onValueChange={(userId) => handleAddStaff(userId, 'monitor')}>
                      <SelectTrigger data-testid="select-add-monitor">
                        <SelectValue placeholder="Selecionar monitor" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableUsers.map((user) => (
                          <SelectItem key={user.id} value={user.id.toString()}>
                            {user.nome} {user.sobrenome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Adicionar Educador</Label>
                    <Select onValueChange={(userId) => handleAddStaff(userId, 'educador')}>
                      <SelectTrigger data-testid="select-add-educador">
                        <SelectValue placeholder="Selecionar educador" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableUsers.map((user) => (
                          <SelectItem key={user.id} value={user.id.toString()}>
                            {user.nome} {user.sobrenome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Selected Staff List */}
                {selectedStaff.length > 0 && (
                  <div className="space-y-3">
                    <Label>Equipe Selecionada ({selectedStaff.length})</Label>
                    <div className="space-y-2">
                      {selectedStaff.map((staff) => (
                        <div 
                          key={staff.id} 
                          className="flex items-center justify-between p-3 border rounded-lg bg-gray-50"
                          data-testid={`staff-member-${staff.id}`}
                        >
                          <div className="flex items-center gap-3">
                            <div>
                              <p className="font-medium">{staff.nome} {staff.sobrenome}</p>
                            </div>
                            <Badge className={getRoleBadgeColor(staff.role)}>
                              {getRoleLabel(staff.role)}
                            </Badge>
                          </div>

                          <div className="flex items-center gap-2">
                            <Select 
                              value={staff.role} 
                              onValueChange={(newRole) => handleChangeRole(staff.id, newRole as any)}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="gestor">Gestor</SelectItem>
                                <SelectItem value="monitor">Monitor</SelectItem>
                                <SelectItem value="educador">Educador</SelectItem>
                              </SelectContent>
                            </Select>
                            
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveStaff(staff.id)}
                              data-testid={`btn-remove-staff-${staff.id}`}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedStaff.length === 0 && (
                  <div className="text-center py-6 text-gray-500">
                    <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Nenhum membro da equipe selecionado</p>
                    <p className="text-sm">Use os campos acima para adicionar gestores, monitores ou educadores</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={onClose} data-testid="btn-cancel-instance">
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={saveMutation.isPending}
                data-testid="btn-save-instance"
              >
                {saveMutation.isPending ? 'Salvando...' : (instance ? 'Atualizar' : 'Criar')} Turma
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}