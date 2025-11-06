import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { cpfSchema } from "@shared/schema";

import logoClube from "@assets/LOGO_CLUBE-05_1752081350082.png";
import { 
  Users, Clock, FileText, Eye, Calendar, Download, Edit, Settings, LogOut, 
  Plus, Check, X, AlertCircle, Upload, BookOpen, Target, Bell, Filter, BarChart, UserPlus, User, Save, MapPin, Camera, MoreHorizontal, Search, Trash2, ChevronLeft, ChevronRight, FileDown, ArrowLeft
} from "lucide-react";

const competenciesList = [
  "Criatividade", "Coordenação motora", "Expressão artística", "Imaginação", 
  "Percepção visual", "Conhecimento técnico", "Trabalho em equipe", "Comunicação"
];

// Componente Plano de Aulas
const PlanoAulasModule = ({ professorId, isLeader }: { professorId: number; isLeader: boolean }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [planoForm, setPlanoForm] = useState({
    turmaId: '',
    data: '',
    titulo: '',
    objetivos: '',
    conteudo: '',
    metodologia: '',
    recursos: '',
    avaliacao: '',
    competencias: [] as string[],
    duracaoMinutos: 60
  });

  const [filtros, setFiltros] = useState({
    turmaId: 'all'
  });

  const [editingPlanId, setEditingPlanId] = useState<number | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState<number | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState<any>({});

  // Query para buscar turmas do professor
  const { data: turmas = [], isLoading: loadingTurmas } = useQuery<any[]>({
    queryKey: ['/api/professor/classes', professorId],
    queryFn: async () => {
      const response = await fetch(`/api/professor/classes/${professorId}`);
      if (!response.ok) throw new Error('Failed to fetch classes');
      return response.json();
    },
    enabled: !!professorId
  });

  // Query para buscar planos de aula com filtros
  const { data: planosAula = [], isLoading: loadingPlanos } = useQuery({
    queryKey: ['/api/professor/lesson-plans', professorId, filtros.turmaId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filtros.turmaId && filtros.turmaId !== 'all') params.append('turmaId', filtros.turmaId);

      
      console.log('Fetching lesson plans with filters:', { 
        turmaId: filtros.turmaId,
        params: params.toString(),
        url: `/api/professor/lesson-plans/${professorId}?${params.toString()}` 
      });
      
      const response = await fetch(`/api/professor/lesson-plans/${professorId}?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch lesson plans');
      const data = await response.json();
      console.log('Received lesson plans:', data);
      return data;
    },
    enabled: !!professorId
  });

  // Mutation para criar plano de aula
  const createPlanoMutation = useMutation({
    mutationFn: (planoData: any) => 
      apiRequest('/api/professor/lesson-plans', {
        method: 'POST',
        body: JSON.stringify({
          ...planoData,
          professorId: parseInt(professorId.toString()),
          turmaId: parseInt(planoData.turmaId)
        })
      }),
    onSuccess: () => {
      toast({
        title: "Plano de aula criado!",
        description: "O plano foi salvo com sucesso."
      });
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['/api/professor/lesson-plans', professorId] });
    },
    onError: (error) => {
      toast({
        title: "Erro ao criar plano",
        description: "Verifique os dados e tente novamente.",
        variant: "destructive"
      });
    }
  });

  // Mutation para atualizar plano de aula
  const updatePlanoMutation = useMutation({
    mutationFn: ({ id, planoData }: { id: number, planoData: any }) => 
      apiRequest(`/api/professor/lesson-plans/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          ...planoData,
          turmaId: parseInt(planoData.turmaId)
        })
      }),
    onSuccess: () => {
      toast({
        title: "Plano atualizado!",
        description: "As alterações foram salvas com sucesso."
      });
      setShowEditModal(false);
      setEditingPlanId(null);
      setEditFormData({});
      queryClient.invalidateQueries({ queryKey: ['/api/professor/lesson-plans', professorId] });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar plano",
        description: "Verifique os dados e tente novamente.",
        variant: "destructive"
      });
    }
  });

  // Mutation para deletar plano de aula
  const deletePlanoMutation = useMutation({
    mutationFn: (planId: number) => 
      apiRequest(`/api/professor/lesson-plans/${planId}`, {
        method: 'DELETE'
      }),
    onSuccess: () => {
      toast({
        title: "Plano excluído!",
        description: "O plano foi removido com sucesso."
      });
      setShowDeleteDialog(null);
      queryClient.invalidateQueries({ queryKey: ['/api/professor/lesson-plans', professorId] });
    },
    onError: (error) => {
      toast({
        title: "Erro ao excluir plano",
        description: "Tente novamente mais tarde.",
        variant: "destructive"
      });
    }
  });

  const resetForm = () => {
    setPlanoForm({
      turmaId: '',
      data: '',
      titulo: '',
      objetivos: '',
      conteudo: '',
      metodologia: '',
      recursos: '',
      avaliacao: '',
      competencias: [],
      duracaoMinutos: 60
    });
    setEditingPlanId(null);
  };

  const handleSubmitPlano = () => {
    if (!planoForm.turmaId || !planoForm.data || !planoForm.titulo || !planoForm.objetivos || !planoForm.conteudo || !planoForm.metodologia) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios marcados com *.",
        variant: "destructive"
      });
      return;
    }

    createPlanoMutation.mutate(planoForm);
  };

  const handleUpdatePlano = () => {
    if (!editFormData.turmaId || !editFormData.data || !editFormData.titulo || !editFormData.objetivos || !editFormData.conteudo || !editFormData.metodologia) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios marcados com *.",
        variant: "destructive"
      });
      return;
    }

    if (editingPlanId !== null) {
      updatePlanoMutation.mutate({ id: editingPlanId, planoData: editFormData });
    }
  };

  const handleCompetenciaToggle = (competencia: string) => {
    setPlanoForm((prev: any) => ({
      ...prev,
      competencias: prev.competencias.includes(competencia)
        ? prev.competencias.filter((c: string) => c !== competencia)
        : [...prev.competencias, competencia]
    }));
  };

  const handleEditCompetenciaToggle = (competencia: string) => {
    setEditFormData((prev: any) => ({
      ...prev,
      competencias: prev.competencias?.includes(competencia)
        ? prev.competencias.filter((c: string) => c !== competencia)
        : [...(prev.competencias || []), competencia]
    }));
  };

  const handleEditPlan = (plan: any) => {
    console.log('Opening edit modal for plan:', plan);
    const formData = {
      turmaId: plan.turmaId?.toString() || '',
      data: plan.data || '',
      titulo: plan.titulo || '',
      objetivos: plan.objetivos || '',
      conteudo: plan.conteudo || '',
      metodologia: plan.metodologia || '',
      recursos: plan.recursos || '',
      avaliacao: plan.avaliacao || '',
      competencias: Array.isArray(plan.competencias) ? plan.competencias : [],
      duracaoMinutos: plan.duracaoMinutos || 60
    };
    setEditFormData(formData);
    setEditingPlanId(plan.id);
    setShowEditModal(true);
  };

  const clearFiltros = () => {
    setFiltros({
      turmaId: 'all'
    });
  };

  return (
    <div className="space-y-6">
      {/* Formulário de Plano de Aula */}
      <Card>
        <CardHeader className="pb-3 md:pb-6">
          <CardTitle className="flex items-center justify-between text-base md:text-lg">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 md:w-6 md:h-6" />
              {isLeader ? "Criar Plano de Aula" : "Visualizar Planos de Aula"}
            </div>
            {!isLeader && (
              <Badge variant="secondary" className="text-xs">
                📚 Somente Visualização
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 md:px-6">
          {!isLeader ? (
            <div className="text-center py-8 space-y-3">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                <BookOpen className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900">Acesso Restrito</h3>
              <p className="text-gray-600 max-w-md mx-auto">
                Apenas líderes podem criar novos planos de aula. Você pode visualizar os planos existentes na seção abaixo.
              </p>
              <Badge variant="outline" className="mx-auto">
                👤 Professor: Somente visualização
              </Badge>
            </div>
          ) : (
          <div className="space-y-4 md:space-y-6">
            {/* Seleção de Turma e Data */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="turma-select">Turma *</Label>
                <Select 
                  value={planoForm.turmaId} 
                  onValueChange={(value) => setPlanoForm({...planoForm, turmaId: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma turma" />
                  </SelectTrigger>
                  <SelectContent>
                    {loadingTurmas ? (
                      <SelectItem value="loading" disabled>Carregando...</SelectItem>
                    ) : !Array.isArray(turmas) || turmas.length === 0 ? (
                      <SelectItem value="empty" disabled>Nenhuma turma encontrada</SelectItem>
                    ) : (
                      turmas.map((turma: any) => (
                        <SelectItem key={turma.id} value={turma.id.toString()}>
                          {turma.nome}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="data-plano">Data da Aula *</Label>
                <Input
                  id="data-plano"
                  type="date"
                  value={planoForm.data}
                  onChange={(e) => setPlanoForm({...planoForm, data: e.target.value})}
                />
              </div>
            </div>

            {/* Título e Duração */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="titulo-plano">Título da Aula *</Label>
                <Input
                  id="titulo-plano"
                  value={planoForm.titulo}
                  onChange={(e) => setPlanoForm({...planoForm, titulo: e.target.value})}
                  placeholder="Ex: Introdução à Geometria"
                />
              </div>
              
              <div>
                <Label htmlFor="duracao-plano">Duração (minutos)</Label>
                <Input
                  id="duracao-plano"
                  type="number"
                  value={planoForm.duracaoMinutos}
                  onChange={(e) => setPlanoForm({...planoForm, duracaoMinutos: parseInt(e.target.value) || 60})}
                  placeholder="Ex: 90"
                />
              </div>
            </div>

            {/* Objetivos */}
            <div>
              <Label htmlFor="objetivos-plano">Objetivos da Aula *</Label>
              <Textarea
                id="objetivos-plano"
                value={planoForm.objetivos}
                onChange={(e) => setPlanoForm({...planoForm, objetivos: e.target.value})}
                placeholder="Descreva os objetivos específicos desta aula..."
                rows={3}
              />
            </div>

            {/* Conteúdo */}
            <div>
              <Label htmlFor="conteudo-plano">Conteúdo Programático *</Label>
              <Textarea
                id="conteudo-plano"
                value={planoForm.conteudo}
                onChange={(e) => setPlanoForm({...planoForm, conteudo: e.target.value})}
                placeholder="Descreva o conteúdo que será abordado na aula..."
                rows={4}
              />
            </div>

            {/* Metodologia */}
            <div>
              <Label htmlFor="metodologia-plano">Metodologia *</Label>
              <Textarea
                id="metodologia-plano"
                value={planoForm.metodologia}
                onChange={(e) => setPlanoForm({...planoForm, metodologia: e.target.value})}
                placeholder="Descreva a metodologia e estratégias pedagógicas..."
                rows={3}
              />
            </div>

            {/* Recursos e Avaliação */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="recursos-plano">Recursos Necessários</Label>
                <Textarea
                  id="recursos-plano"
                  value={planoForm.recursos}
                  onChange={(e) => setPlanoForm({...planoForm, recursos: e.target.value})}
                  placeholder="Liste os materiais e recursos necessários..."
                  rows={3}
                />
              </div>
              
              <div>
                <Label htmlFor="avaliacao-plano">Avaliação</Label>
                <Textarea
                  id="avaliacao-plano"
                  value={planoForm.avaliacao}
                  onChange={(e) => setPlanoForm({...planoForm, avaliacao: e.target.value})}
                  placeholder="Como será avaliado o aprendizado..."
                  rows={3}
                />
              </div>
            </div>

            {/* Competências */}
            <div>
              <Label>Competências Desenvolvidas</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                {competenciesList.map(competencia => (
                  <div key={competencia} className="flex items-center space-x-2">
                    <Checkbox
                      id={`plano-${competencia}`}
                      checked={planoForm.competencias.includes(competencia)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          handleCompetenciaToggle(competencia);
                        } else {
                          handleCompetenciaToggle(competencia);
                        }
                      }}
                    />
                    <Label htmlFor={`plano-${competencia}`} className="text-sm">{competencia}</Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Botões de Ação */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button 
                onClick={handleSubmitPlano} 
                className="bg-yellow-500 hover:bg-yellow-600 w-full sm:w-auto text-sm md:text-base"
                disabled={createPlanoMutation.isPending || updatePlanoMutation.isPending}
                size="lg"
              >
                <Save className="w-4 h-4 mr-2" />
                {createPlanoMutation.isPending || updatePlanoMutation.isPending ? 'Salvando...' : (editingPlanId ? 'Atualizar Plano' : 'Salvar Plano')}
              </Button>
              
              {editingPlanId && (
                <Button 
                  onClick={resetForm} 
                  variant="outline"
                  className="w-full sm:w-auto text-sm md:text-base"
                  size="lg"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancelar Edição
                </Button>
              )}
            </div>
          </div>
          )}
        </CardContent>
      </Card>

      {/* Filtros e Lista de Planos */}
      <Card>
        <CardHeader className="pb-3 md:pb-6">
          <CardTitle className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <span className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              <span className="text-base md:text-lg">Planos de Aula ({planosAula.length})</span>
            </span>
            <Button variant="outline" size="sm" onClick={clearFiltros} className="self-start sm:self-auto">
              <X className="w-4 h-4 mr-1" />
              Limpar Filtros
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 md:px-6">
          {/* Filtros */}
          <div className="grid grid-cols-1 gap-3 md:gap-4 mb-4 md:mb-6 p-3 md:p-4 border rounded-lg bg-gray-50">
            <div>
              <Label htmlFor="filtro-turma">Filtrar por Turma</Label>
              <Select 
                value={filtros.turmaId} 
                onValueChange={(value) => setFiltros({...filtros, turmaId: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas as turmas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as turmas</SelectItem>
                  {turmas.map((turma: any) => (
                    <SelectItem key={turma.id} value={turma.id.toString()}>
                      {turma.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Lista de Planos */}
          {loadingPlanos ? (
            <div className="text-center py-6 md:py-8">
              <div className="text-gray-500 text-sm md:text-base">Carregando planos de aula...</div>
            </div>
          ) : planosAula.length === 0 ? (
            <div className="text-center py-6 md:py-8">
              <BookOpen className="w-12 h-12 md:w-16 md:h-16 mx-auto text-gray-400 mb-3 md:mb-4" />
              <h3 className="text-base md:text-lg font-medium text-gray-900 mb-2">Nenhum plano de aula encontrado</h3>
              <p className="text-gray-600 text-sm md:text-base px-4">Crie seu primeiro plano de aula usando o formulário acima.</p>
            </div>
          ) : (
            <div className="space-y-3 md:space-y-4">
              {planosAula.map((plano: any) => (
                <div key={plano.id} className="p-3 md:p-4 border rounded-lg hover:shadow-md transition-shadow">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-base md:text-lg text-gray-900 mb-2">{plano.titulo}</h3>
                      <div className="flex flex-wrap items-center gap-2 md:gap-4 text-xs md:text-sm text-gray-600">
                        <span className="flex items-center gap-1">Data: {new Date(plano.data).toLocaleDateString('pt-BR')}</span>
                        <span className="flex items-center gap-1">Turma: {plano.turmaNome}</span>
                        <span className="flex items-center gap-1">Duração: {plano.duracaoMinutos} min</span>
                        <Badge variant={plano.status === 'aprovado' ? 'default' : 'secondary'} className="text-xs">
                          {plano.status}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex gap-2 md:ml-4 flex-wrap">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedPlan(plano)}
                        className="flex-1 md:flex-none text-xs md:text-sm"
                      >
                        <Eye className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                        Ver
                      </Button>
                      {isLeader ? (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditPlan(plano)}
                            className="flex-1 md:flex-none text-xs md:text-sm"
                          >
                            <Edit className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                            Editar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowDeleteDialog(plano.id)}
                            className="flex-1 md:flex-none text-red-600 hover:text-red-700 text-xs md:text-sm"
                          >
                            <Trash2 className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                            Excluir
                          </Button>
                        </>
                      ) : (
                        <Badge variant="secondary" className="flex-1 md:flex-none text-xs text-center py-2">
                          📚 Somente Visualização
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">{plano.objetivos}</p>
                  
                  {plano.competencias && plano.competencias.length > 0 && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-medium text-gray-500">Competências:</span>
                      {plano.competencias.slice(0, 3).map((comp: string, idx: number) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {comp}
                        </Badge>
                      ))}
                      {plano.competencias.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{plano.competencias.length - 3} mais
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Visualização */}
      {selectedPlan && (
        <Dialog open={!!selectedPlan} onOpenChange={() => setSelectedPlan(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto mx-4 md:mx-0">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base md:text-lg">
                <BookOpen className="w-5 h-5" />
                <span className="line-clamp-2">{selectedPlan.titulo}</span>
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 md:space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 p-3 md:p-4 bg-gray-50 rounded-lg text-sm">
                <div>
                  <span className="text-sm font-medium text-gray-500">Data:</span>
                  <p className="text-sm">{new Date(selectedPlan.data).toLocaleDateString('pt-BR')}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Turma:</span>
                  <p className="text-sm">{selectedPlan.turmaNome}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Duração:</span>
                  <p className="text-sm">{selectedPlan.duracaoMinutos} minutos</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Status:</span>
                  <Badge variant={selectedPlan.status === 'aprovado' ? 'default' : 'secondary'}>
                    {selectedPlan.status}
                  </Badge>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Objetivos:</h4>
                <p className="text-sm text-gray-600 whitespace-pre-wrap">{selectedPlan.objetivos}</p>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Conteúdo:</h4>
                <p className="text-sm text-gray-600 whitespace-pre-wrap">{selectedPlan.conteudo}</p>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Metodologia:</h4>
                <p className="text-sm text-gray-600 whitespace-pre-wrap">{selectedPlan.metodologia}</p>
              </div>

              {selectedPlan.recursos && (
                <div>
                  <h4 className="font-semibold mb-2">Recursos:</h4>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">{selectedPlan.recursos}</p>
                </div>
              )}

              {selectedPlan.avaliacao && (
                <div>
                  <h4 className="font-semibold mb-2">Avaliação:</h4>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">{selectedPlan.avaliacao}</p>
                </div>
              )}

              {selectedPlan.competencias && selectedPlan.competencias.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Competências Desenvolvidas:</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedPlan.competencias.map((comp: string, idx: number) => (
                      <Badge key={idx} variant="secondary">
                        {comp}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Modal de Edição */}
      {showEditModal && (
        <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto mx-4 md:mx-0">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Editar Plano de Aula
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 md:space-y-6 mt-4">
              {/* Seleção de Turma e Data */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-turma-select">Turma *</Label>
                  <Select 
                    value={editFormData.turmaId} 
                    onValueChange={(value) => setEditFormData({...editFormData, turmaId: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma turma" />
                    </SelectTrigger>
                    <SelectContent>
                      {turmas.map((turma: any) => (
                        <SelectItem key={turma.id} value={turma.id.toString()}>
                          {turma.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="edit-data">Data da Aula *</Label>
                  <Input
                    id="edit-data"
                    type="date"
                    value={editFormData.data}
                    onChange={(e) => setEditFormData({...editFormData, data: e.target.value})}
                  />
                </div>
              </div>

              {/* Título */}
              <div>
                <Label htmlFor="edit-titulo">Título da Aula *</Label>
                <Input
                  id="edit-titulo"
                  value={editFormData.titulo}
                  onChange={(e) => setEditFormData({...editFormData, titulo: e.target.value})}
                  placeholder="Ex: Introdução à Matemática Básica"
                />
              </div>

              {/* Objetivos */}
              <div>
                <Label htmlFor="edit-objetivos">Objetivos da Aula *</Label>
                <Textarea
                  id="edit-objetivos"
                  value={editFormData.objetivos}
                  onChange={(e) => setEditFormData({...editFormData, objetivos: e.target.value})}
                  placeholder="Descreva os objetivos de aprendizagem desta aula..."
                  rows={3}
                />
              </div>

              {/* Conteúdo */}
              <div>
                <Label htmlFor="edit-conteudo">Conteúdo a ser Ministrado *</Label>
                <Textarea
                  id="edit-conteudo"
                  value={editFormData.conteudo}
                  onChange={(e) => setEditFormData({...editFormData, conteudo: e.target.value})}
                  placeholder="Detalhe o conteúdo que será abordado na aula..."
                  rows={4}
                />
              </div>

              {/* Metodologia */}
              <div>
                <Label htmlFor="edit-metodologia">Metodologia *</Label>
                <Textarea
                  id="edit-metodologia"
                  value={editFormData.metodologia}
                  onChange={(e) => setEditFormData({...editFormData, metodologia: e.target.value})}
                  placeholder="Descreva como o conteúdo será apresentado aos alunos..."
                  rows={3}
                />
              </div>

              {/* Recursos e Avaliação */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-recursos">Recursos Necessários</Label>
                  <Textarea
                    id="edit-recursos"
                    value={editFormData.recursos}
                    onChange={(e) => setEditFormData({...editFormData, recursos: e.target.value})}
                    placeholder="Ex: Quadro, projetor, material impresso..."
                    rows={3}
                  />
                </div>
                
                <div>
                  <Label htmlFor="edit-avaliacao">Método de Avaliação</Label>
                  <Textarea
                    id="edit-avaliacao"
                    value={editFormData.avaliacao}
                    onChange={(e) => setEditFormData({...editFormData, avaliacao: e.target.value})}
                    placeholder="Como será avaliado o aprendizado..."
                    rows={3}
                  />
                </div>
              </div>

              {/* Duração */}
              <div>
                <Label htmlFor="edit-duracao">Duração (minutos)</Label>
                <Input
                  id="edit-duracao"
                  type="number"
                  min="15"
                  max="300"
                  value={editFormData.duracaoMinutos}
                  onChange={(e) => setEditFormData({...editFormData, duracaoMinutos: parseInt(e.target.value) || 60})}
                />
              </div>

              {/* Competências */}
              <div>
                <Label>Competências a serem Desenvolvidas</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                  {competenciesList.map((competencia) => (
                    <div key={competencia} className="flex items-center space-x-2">
                      <Checkbox
                        id={`edit-comp-${competencia}`}
                        checked={editFormData.competencias?.includes(competencia) || false}
                        onCheckedChange={() => handleEditCompetenciaToggle(competencia)}
                      />
                      <Label htmlFor={`edit-comp-${competencia}`} className="text-sm">
                        {competencia}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => setShowEditModal(false)}
                className="w-full sm:w-auto"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleUpdatePlano}
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700"
                disabled={updatePlanoMutation.isPending}
              >
                {updatePlanoMutation.isPending ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Dialog de Confirmação de Exclusão */}
      {showDeleteDialog && (
        <AlertDialog open={!!showDeleteDialog} onOpenChange={() => setShowDeleteDialog(null)}>
          <AlertDialogContent className="mx-4 md:mx-0">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-base md:text-lg">Confirmar Exclusão</AlertDialogTitle>
              <AlertDialogDescription className="text-sm md:text-base">
                Tem certeza que deseja excluir este plano de aula? Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-col sm:flex-row gap-3">
              <AlertDialogCancel className="w-full sm:w-auto">Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deletePlanoMutation.mutate(showDeleteDialog)}
                className="w-full sm:w-auto bg-red-600 hover:bg-red-700"
                disabled={deletePlanoMutation.isPending}
              >
                {deletePlanoMutation.isPending ? 'Excluindo...' : 'Excluir'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
};

// Componente RelatoriosModule
const RelatoriosModule = ({ professorId }: { professorId: number }) => {
  const { toast } = useToast();
  const [reportType, setReportType] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedStudent, setSelectedStudent] = useState("");
  const [studentSearch, setStudentSearch] = useState("");
  const [reportData, setReportData] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Fetch turmas do professor
  const { data: classes = [] } = useQuery<any[]>({
    queryKey: ['/api/professor/classes', professorId],
    queryFn: () => apiRequest(`/api/professor/classes/${professorId}`),
  });

  // Fetch alunos do professor para autocomplete
  const { data: students = [] } = useQuery<any[]>({
    queryKey: ['/api/professor/students', professorId],
    queryFn: () => apiRequest(`/api/professor/students/${professorId}`),
  });

  // Filtrar alunos baseado na busca
  const filteredStudents = students.filter((student: any) => {
    if (!studentSearch) return false;
    return student.nome_completo?.toLowerCase().includes(studentSearch.toLowerCase()) ||
           student.cpf?.includes(studentSearch);
  });

  const handleGenerateReport = async () => {
    if (!reportType || !selectedClass || !selectedDate) {
      toast({
        title: "Campos obrigatórios",
        description: "Selecione o tipo de relatório, turma e data.",
        variant: "destructive"
      });
      return;
    }

    if (reportType === "individual" && !selectedStudent) {
      toast({
        title: "Aluno obrigatório",
        description: "Para relatório individual, selecione um aluno.",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    try {
      let endpoint = "";
      let params = new URLSearchParams({
        classId: selectedClass,
        date: selectedDate,
        type: reportType
      });

      if (selectedStudent) {
        params.append('studentCpf', selectedStudent);
      }

      switch (reportType) {
        case "presenca":
          endpoint = `/api/professor/reports/attendance/${professorId}`;
          break;
        case "plano-aula":
          endpoint = `/api/professor/reports/lesson-plans/${professorId}`;
          break;
        case "acompanhamento":
          endpoint = `/api/professor/reports/observations/${professorId}`;
          break;
        case "individual":
          endpoint = `/api/professor/reports/student/${selectedStudent}`;
          break;
        case "geral":
          endpoint = `/api/professor/reports/general/${professorId}`;
          break;
        default:
          throw new Error("Tipo de relatório inválido");
      }

      const response = await fetch(`${endpoint}?${params}`);
      if (!response.ok) throw new Error("Erro ao gerar relatório");
      
      const data = await response.json();
      
      // Adicionar informações extras ao relatório
      const enhancedData = {
        ...data,
        reportInfo: {
          type: reportType,
          classId: selectedClass,
          className: classes.find(c => c.id.toString() === selectedClass)?.nome || "Turma não encontrada",
          date: selectedDate,
          generatedAt: new Date().toLocaleString('pt-BR'),
          hasData: getDataCount(data, reportType) > 0
        }
      };
      
      setReportData(enhancedData);

      toast({
        title: "Relatório gerado com sucesso!",
        description: enhancedData.reportInfo.hasData 
          ? `Relatório contém ${getDataCount(data, reportType)} registro(s).`
          : "Relatório gerado sem dados para os filtros selecionados."
      });
    } catch (error: any) {
      toast({
        title: "Erro ao gerar relatório",
        description: error.message || "Erro interno do sistema",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Função auxiliar para contar dados no relatório
  const getDataCount = (data: any, type: string) => {
    switch (type) {
      case "presenca":
        return data.attendance?.length || 0;
      case "plano-aula":
        return data.lessonPlans?.length || 0;
      case "acompanhamento":
        return data.observations?.length || 0;
      case "individual":
        return (data.observations?.length || 0) + (data.student ? 1 : 0);
      case "geral":
        return data.summary ? 1 : 0;
      default:
        return 0;
    }
  };

  // Função para gerar HTML do relatório
  const generateReportHTML = (data: any, type: string, classes: any[]) => {
    const reportInfo = data.reportInfo;
    const logoBase64 = logoClube; // Usar logo importado
    
    const headerHTML = `
      <div style="text-align: center; margin-bottom: 30px; border-bottom: 3px solid #f59e0b; padding-bottom: 20px;">
        <img src="${logoBase64}" alt="Clube do Grito" style="height: 60px; margin-bottom: 15px;">
        <h1 style="color: #f59e0b; margin: 0; font-size: 24px; font-weight: bold;">CLUBE DO GRITO</h1>
        <h2 style="color: #666; margin: 5px 0 0 0; font-size: 18px;">Relatório ${getReportTypeName(type)}</h2>
        <div style="margin-top: 15px; font-size: 14px; color: #666;">
          <p style="margin: 5px 0;"><strong>Turma:</strong> ${reportInfo.className}</p>
          <p style="margin: 5px 0;"><strong>Data:</strong> ${new Date(reportInfo.date).toLocaleDateString('pt-BR')}</p>
          <p style="margin: 5px 0;"><strong>Gerado em:</strong> ${reportInfo.generatedAt}</p>
        </div>
      </div>
    `;

    let contentHTML = '';
    
    if (!reportInfo.hasData) {
      contentHTML = `
        <div style="text-align: center; padding: 40px; background-color: #f8f9fa; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #6c757d; margin-bottom: 15px;">Nenhum dado encontrado</h3>
          <p style="color: #6c757d;">Não há registros para os filtros selecionados neste período.</p>
          <p style="color: #6c757d; font-size: 14px;">Turma: ${reportInfo.className} | Data: ${new Date(reportInfo.date).toLocaleDateString('pt-BR')}</p>
        </div>
      `;
    } else {
      contentHTML = generateContentByType(data, type);
    }

    return `
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Relatório ${getReportTypeName(type)} - Clube do Grito</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
            th { background-color: #f8f9fa; font-weight: bold; }
            .no-data { text-align: center; color: #666; font-style: italic; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>
          ${headerHTML}
          ${contentHTML}
        </body>
      </html>
    `;
  };

  const getReportTypeName = (type: string) => {
    const types: Record<string, string> = {
      'presenca': 'de Presença',
      'plano-aula': 'de Planos de Aula',
      'acompanhamento': 'de Acompanhamento',
      'individual': 'Individual do Aluno',
      'geral': 'Geral'
    };
    return types[type] || 'Desconhecido';
  };

  const generateContentByType = (data: any, type: string) => {
    switch (type) {
      case 'presenca':
        return generateAttendanceContent(data.attendance || []);
      case 'plano-aula':
        return generateLessonPlansContent(data.lessonPlans || []);
      case 'acompanhamento':
        return generateObservationsContent(data.observations || []);
      case 'individual':
        return generateIndividualContent(data);
      case 'geral':
        return generateGeneralContent(data.summary || {});
      default:
        return '<p>Tipo de relatório não reconhecido.</p>';
    }
  };

  const generateAttendanceContent = (attendance: any[]) => {
    if (!attendance.length) return '<p class="no-data">Nenhum registro de presença encontrado.</p>';
    
    return `
      <h3>Lista de Presença</h3>
      <table>
        <thead>
          <tr>
            <th>Aluno</th>
            <th>Status</th>
            <th>Observações</th>
          </tr>
        </thead>
        <tbody>
          ${attendance.map((item: any) => `
            <tr>
              <td>${item.student_name}</td>
              <td>${item.status}</td>
              <td>${item.observacoes || 'Sem observações'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  };

  const generateLessonPlansContent = (lessonPlans: any[]) => {
    if (!lessonPlans.length) return '<p class="no-data">Nenhum plano de aula encontrado.</p>';
    
    return `
      <h3>Planos de Aula</h3>
      ${lessonPlans.map((plan: any) => `
        <div style="margin-bottom: 30px; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
          <h4>${plan.title}</h4>
          <p><strong>Data:</strong> ${new Date(plan.date).toLocaleDateString('pt-BR')}</p>
          <p><strong>Descrição:</strong> ${plan.description || 'Sem descrição'}</p>
          <p><strong>Competências:</strong> ${plan.competencies || 'Não especificadas'}</p>
          <p><strong>Materiais:</strong> ${plan.materials || 'Não especificados'}</p>
          <p><strong>Status:</strong> ${plan.status || 'Não informado'}</p>
        </div>
      `).join('')}
    `;
  };

  const generateObservationsContent = (observations: any[]) => {
    if (!observations.length) return '<p class="no-data">Nenhuma observação encontrada.</p>';
    
    return `
      <h3>Observações Pedagógicas</h3>
      <table>
        <thead>
          <tr>
            <th>Aluno</th>
            <th>Título</th>
            <th>Observação</th>
            <th>Data</th>
            <th>Tipo</th>
          </tr>
        </thead>
        <tbody>
          ${observations.map((obs: any) => `
            <tr>
              <td>${obs.student_name}</td>
              <td>${obs.titulo}</td>
              <td>${obs.observacao}</td>
              <td>${new Date(obs.data).toLocaleDateString('pt-BR')}</td>
              <td>${obs.tipoObservacao || 'Geral'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  };

  const generateIndividualContent = (data: any) => {
    const student = data.student;
    const observations = data.observations || [];
    
    return `
      <h3>Relatório Individual</h3>
      <div style="margin-bottom: 30px; padding: 20px; background-color: #f8f9fa; border-radius: 8px;">
        <h4>Dados do Aluno</h4>
        <p><strong>Nome:</strong> ${student?.nomeCompleto || 'Nome não informado'}</p>
        <p><strong>CPF:</strong> ${student?.cpf || 'CPF não informado'}</p>
        <p><strong>Data de Nascimento:</strong> ${student?.dataNascimento ? new Date(student.dataNascimento).toLocaleDateString('pt-BR') : 'Não informada'}</p>
      </div>
      
      <h4>Observações</h4>
      ${observations.length ? `
        <table>
          <thead>
            <tr>
              <th>Data</th>
              <th>Título</th>
              <th>Observação</th>
              <th>Tipo</th>
            </tr>
          </thead>
          <tbody>
            ${observations.map((obs: any) => `
              <tr>
                <td>${new Date(obs.data).toLocaleDateString('pt-BR')}</td>
                <td>${obs.titulo}</td>
                <td>${obs.observacao}</td>
                <td>${obs.tipoObservacao || 'Geral'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      ` : '<p class="no-data">Nenhuma observação registrada para este aluno.</p>'}
    `;
  };

  const generateGeneralContent = (summary: any) => {
    return `
      <h3>Relatório Geral</h3>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0;">
        <div style="padding: 20px; background-color: #f8f9fa; border-radius: 8px; text-align: center;">
          <h4>Total de Alunos</h4>
          <p style="font-size: 24px; font-weight: bold; color: #f59e0b;">${summary.totalStudents || 0}</p>
        </div>
        <div style="padding: 20px; background-color: #f8f9fa; border-radius: 8px; text-align: center;">
          <h4>Total de Turmas</h4>
          <p style="font-size: 24px; font-weight: bold; color: #f59e0b;">${summary.totalClasses || 0}</p>
        </div>
        <div style="padding: 20px; background-color: #f8f9fa; border-radius: 8px; text-align: center;">
          <h4>Observações</h4>
          <p style="font-size: 24px; font-weight: bold; color: #f59e0b;">${summary.totalObservations || 0}</p>
        </div>
        <div style="padding: 20px; background-color: #f8f9fa; border-radius: 8px; text-align: center;">
          <h4>Taxa de Presença</h4>
          <p style="font-size: 24px; font-weight: bold; color: #f59e0b;">${summary.attendanceRate || 0}%</p>
        </div>
      </div>
    `;
  };

  const handleExportPDF = async () => {
    if (!reportData) {
      toast({
        title: "Nenhum relatório para exportar",
        description: "Gere um relatório primeiro antes de exportar.",
        variant: "destructive"
      });
      return;
    }

    setIsExporting(true);
    try {
      // Criar conteúdo HTML do relatório
      const reportContent = generateReportHTML(reportData, reportType, classes);
      
      // Criar um blob com o conteúdo HTML
      const blob = new Blob([reportContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      
      // Criar e disparar o download
      const link = document.createElement('a');
      link.href = url;
      link.download = `relatorio-${getReportTypeName(reportType).toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.html`;
      document.body.appendChild(link);
      link.click();
      // Safe removal with mobile compatibility
      if (link.parentNode) {
        link.parentNode.removeChild(link);
      }
      URL.revokeObjectURL(url);

      // Mostrar o window.print para PDF
      const printWindow = window.open();
      if (printWindow) {
        printWindow.document.write(reportContent);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
          printWindow.print();
        }, 500);
      }

      toast({
        title: "PDF gerado com sucesso!",
        description: "O relatório foi aberto em uma nova janela. Use Ctrl+P ou ⌘+P para salvar como PDF."
      });
    } catch (error: any) {
      toast({
        title: "Erro ao exportar PDF",
        description: error.message || "Erro interno do sistema",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Download className="w-6 h-6" />
            Gerar Relatórios
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {/* Tipo de Relatório */}
            <div>
              <Label htmlFor="report-type">Tipo de Relatório *</Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="presenca">Presença por turma</SelectItem>
                  <SelectItem value="plano-aula">Plano de Aula</SelectItem>
                  <SelectItem value="acompanhamento">Acompanhamento Pedagógico</SelectItem>
                  <SelectItem value="individual">Individual por aluno</SelectItem>
                  <SelectItem value="geral">Relatório geral</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Turma */}
            <div>
              <Label htmlFor="class-select">Turma *</Label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a turma" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((classe) => (
                    <SelectItem key={classe.id} value={classe.id.toString()}>
                      {classe.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Data */}
            <div>
              <Label htmlFor="date-select">Data *</Label>
              <Input
                id="date-select"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>

            {/* Busca de Aluno (quando necessário) */}
            {reportType === "individual" && (
              <div className="md:col-span-2 lg:col-span-3">
                <Label htmlFor="student-search">Buscar Aluno (Nome ou CPF) *</Label>
                <div className="relative">
                  <Input
                    id="student-search"
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    placeholder="Digite o nome ou CPF do aluno..."
                  />
                  <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
                {studentSearch && filteredStudents.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {filteredStudents.map((student) => (
                      <button
                        key={student.cpf}
                        className="w-full px-4 py-2 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                        onClick={() => {
                          setSelectedStudent(student.cpf);
                          setStudentSearch(student.nome_completo);
                        }}
                      >
                        <div className="font-medium">{student.nome_completo}</div>
                        <div className="text-sm text-gray-500">CPF: {student.cpf}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <Button 
              onClick={handleGenerateReport}
              disabled={isGenerating || !reportType || !selectedClass || !selectedDate}
              className="bg-yellow-500 hover:bg-yellow-600"
            >
              {isGenerating ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Gerando...
                </div>
              ) : (
                <>
                  <FileText className="w-4 h-4 mr-2" />
                  Gerar Relatório
                </>
              )}
            </Button>

            {reportData && (
              <Button 
                onClick={handleExportPDF}
                disabled={isExporting}
                variant="outline"
              >
                {isExporting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin" />
                    Exportando...
                  </div>
                ) : (
                  <>
                    <FileDown className="w-4 h-4 mr-2" />
                    Exportar PDF
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Exibição dos Dados do Relatório */}
      {reportData && (
        <Card>
          <CardHeader>
            <CardTitle>Dados do Relatório</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {reportType === "presenca" && reportData.attendance && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Lista de Presença</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-200">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="border border-gray-200 p-3 text-left">Aluno</th>
                          <th className="border border-gray-200 p-3 text-left">Status</th>
                          <th className="border border-gray-200 p-3 text-left">Observações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reportData.attendance.map((item, index) => (
                          <tr key={index}>
                            <td className="border border-gray-200 p-3">{item.student_name}</td>
                            <td className="border border-gray-200 p-3">
                              <span className={`px-2 py-1 rounded text-sm ${
                                item.status === 'presente' ? 'bg-green-100 text-green-800' :
                                item.status === 'falta' ? 'bg-red-100 text-red-800' :
                                'bg-yellow-100 text-yellow-800'
                              }`}>
                                {item.status}
                              </span>
                            </td>
                            <td className="border border-gray-200 p-3">{item.observacoes || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {reportType === "individual" && reportData.student && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Dados do Aluno</h3>
                    <div className="bg-gray-50 p-4 rounded-lg grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <strong>Nome:</strong> {reportData.student.nome_completo}
                      </div>
                      <div>
                        <strong>CPF:</strong> {reportData.student.cpf}
                      </div>
                      <div>
                        <strong>Data de Nascimento:</strong> {
                          reportData.student.data_nascimento ? 
                            new Date(reportData.student.data_nascimento).toLocaleDateString('pt-BR') : 
                            'N/A'
                        }
                      </div>
                    </div>
                  </div>

                  {reportData.observations && reportData.observations.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-3">Observações Pedagógicas</h3>
                      <div className="space-y-3">
                        {reportData.observations.map((obs, index) => (
                          <div key={index} className="border border-gray-200 p-4 rounded-lg">
                            <div className="text-sm text-gray-500 mb-2">
                              {new Date(obs.data).toLocaleDateString('pt-BR')}
                            </div>
                            <div>{obs.observacao}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {!reportData.attendance && !reportData.student && (
                <div className="text-center py-8 text-gray-500">
                  Nenhum dado encontrado para os filtros selecionados.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// Componente Acompanhamento
const AcompanhamentoModule = ({ professorId }: { professorId: number }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [acompanhamentoForm, setAcompanhamentoForm] = useState({
    alunoCpf: '',
    titulo: '',
    descricao: '',
    data: new Date().toISOString().split('T')[0],
    tipoObservacao: 'academico',
    progressoAcademico: '',
    areaDesenvolvimento: '',
    metas: '',
    recomendacoes: ''
  });

  const [studentSearchTerm, setStudentSearchTerm] = useState('');
  const [listSearchTerm, setListSearchTerm] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState<number | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);

  // Query para buscar alunos do professor
  const { data: students = [], isLoading: loadingStudents } = useQuery<any[]>({
    queryKey: ['/api/professor/students', professorId],
    queryFn: async () => {
      const response = await fetch(`/api/professor/students/${professorId}`);
      if (!response.ok) throw new Error('Failed to fetch students');
      return response.json();
    },
    enabled: !!professorId
  });

  // Query para buscar acompanhamentos do professor
  const { data: acompanhamentos = [], isLoading: loadingAcompanhamentos } = useQuery<any[]>({
    queryKey: ['/api/professor/acompanhamentos', professorId],
    queryFn: async () => {
      const response = await fetch(`/api/professor/acompanhamentos/${professorId}`);
      if (!response.ok) throw new Error('Failed to fetch acompanhamentos');
      return response.json();
    },
    enabled: !!professorId
  });

  // Mutation para criar acompanhamento
  const createAcompanhamentoMutation = useMutation({
    mutationFn: (data: any) => 
      apiRequest('/api/professor/acompanhamentos', {
        method: 'POST',
        body: JSON.stringify({
          ...data,
          professorId: professorId
        })
      }),
    onSuccess: () => {
      toast({
        title: "Acompanhamento registrado!",
        description: "O registro foi salvo com sucesso."
      });
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['/api/professor/acompanhamentos', professorId] });
    },
    onError: (error) => {
      toast({
        title: "Erro ao registrar acompanhamento",
        description: "Verifique os dados e tente novamente.",
        variant: "destructive"
      });
    }
  });

  // Mutation para atualizar acompanhamento
  const updateAcompanhamentoMutation = useMutation({
    mutationFn: ({ id, data }: { id: number, data: any }) => 
      apiRequest(`/api/professor/acompanhamentos/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      }),
    onSuccess: () => {
      toast({
        title: "Acompanhamento atualizado!",
        description: "As alterações foram salvas."
      });
      setShowEditModal(false);
      setEditingItem(null);
      queryClient.invalidateQueries({ queryKey: ['/api/professor/acompanhamentos', professorId] });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar acompanhamento",
        description: "Tente novamente mais tarde.",
        variant: "destructive"
      });
    }
  });

  // Mutation para deletar acompanhamento
  const deleteAcompanhamentoMutation = useMutation({
    mutationFn: (id: number) => 
      apiRequest(`/api/professor/acompanhamentos/${id}`, {
        method: 'DELETE'
      }),
    onSuccess: () => {
      toast({
        title: "Acompanhamento excluído!",
        description: "O registro foi removido com sucesso."
      });
      setShowDeleteDialog(null);
      queryClient.invalidateQueries({ queryKey: ['/api/professor/acompanhamentos', professorId] });
    },
    onError: (error) => {
      toast({
        title: "Erro ao excluir acompanhamento",
        description: "Tente novamente mais tarde.",
        variant: "destructive"
      });
    }
  });



  const handleSubmit = () => {
    if (!acompanhamentoForm.alunoCpf || !acompanhamentoForm.titulo || !acompanhamentoForm.descricao) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    createAcompanhamentoMutation.mutate(acompanhamentoForm);
  };

  const handleEdit = (item: any) => {
    setEditingItem({
      ...item,
      data: item.data ? new Date(item.data).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      observacao: item.observacao || item.descricao || '',
      descricao: item.observacao || item.descricao || ''
    });
    setShowEditModal(true);
  };

  const handleUpdate = () => {
    if (!editingItem.titulo || !editingItem.observacao) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    // Preparar dados limpos para o backend
    const updateData = {
      titulo: editingItem.titulo,
      observacao: editingItem.observacao || editingItem.descricao,
      data: editingItem.data,
      tipoObservacao: editingItem.tipoObservacao || 'academico',
      progressoAcademico: editingItem.progressoAcademico || '',
      areaDesenvolvimento: editingItem.areaDesenvolvimento || '',
      metas: editingItem.metas || '',
      recomendacoes: editingItem.recomendacoes || ''
    };

    updateAcompanhamentoMutation.mutate({ 
      id: editingItem.id, 
      data: updateData 
    });
  };

  // Filtrar alunos baseado na busca para seleção
  const filteredStudentsForSelection = students.filter(student => {
    const searchLower = studentSearchTerm.toLowerCase();
    return (
      (student.fullName || student.nome_completo || '').toLowerCase().includes(searchLower) ||
      student.cpf.includes(studentSearchTerm)
    );
  });

  // Filtrar acompanhamentos baseado na busca da lista
  const filteredAcompanhamentos = acompanhamentos.filter(item => {
    const searchLower = listSearchTerm.toLowerCase();
    const student = students.find(s => s.cpf === item.alunoCpf);
    const studentName = student?.nome_completo || student?.fullName || '';
    return studentName.toLowerCase().includes(searchLower) ||
           item.alunoCpf.includes(listSearchTerm) ||
           (item.titulo || '').toLowerCase().includes(searchLower);
  });

  const resetForm = () => {
    setAcompanhamentoForm({
      alunoCpf: '',
      titulo: '',
      descricao: '',
      data: new Date().toISOString().split('T')[0],
      tipoObservacao: 'academico',
      progressoAcademico: '',
      areaDesenvolvimento: '',
      metas: '',
      recomendacoes: ''
    });
    setSelectedStudent(null);
    setStudentSearchTerm('');
  };

  const handleStudentSelect = (student: any) => {
    setSelectedStudent(student);
    setAcompanhamentoForm({...acompanhamentoForm, alunoCpf: student.cpf});
    setStudentSearchTerm(student.nome_completo || student.fullName);
  };

  return (
    <div className="space-y-6">
      {/* Formulário para Novo Acompanhamento */}
      <Card>
        <CardHeader className="pb-3 md:pb-6">
          <CardTitle className="flex items-center gap-2 text-base md:text-lg">
            <Plus className="w-5 h-5 md:w-6 md:h-6" />
            Adicionar Acompanhamento
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 md:px-6">
          <div className="space-y-4 md:space-y-6">
            {/* Seleção de Aluno com busca autocomplete */}
            <div>
              <Label htmlFor="aluno-search">Buscar e Selecionar Aluno *</Label>
              <div className="space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Digite o nome ou CPF do aluno..."
                    value={studentSearchTerm}
                    onChange={(e) => setStudentSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                {/* Lista de resultados da busca */}
                {studentSearchTerm && filteredStudentsForSelection.length > 0 && (
                  <div className="border rounded-md bg-white shadow-sm max-h-48 overflow-y-auto">
                    {filteredStudentsForSelection.slice(0, 5).map((student) => (
                      <div 
                        key={student.cpf}
                        className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                        onClick={() => handleStudentSelect(student)}
                      >
                        <div className="font-medium text-sm">
                          {student.fullName || student.nome_completo}
                        </div>
                        <div className="text-xs text-gray-500">
                          CPF: {student.cpf}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Aluno selecionado */}
                {selectedStudent && (
                  <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-md">
                    <div>
                      <div className="font-medium text-sm text-green-800">
                        {selectedStudent.nome_completo || selectedStudent.fullName}
                      </div>
                      <div className="text-xs text-green-600">
                        CPF: {selectedStudent.cpf}
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => {
                        setSelectedStudent(null);
                        setStudentSearchTerm('');
                        setAcompanhamentoForm({...acompanhamentoForm, alunoCpf: ''});
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}

                {studentSearchTerm && filteredStudentsForSelection.length === 0 && (
                  <div className="p-3 text-center text-gray-500 border rounded-md">
                    Nenhum aluno encontrado
                  </div>
                )}
              </div>
            </div>

            {/* Título e Data */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="titulo">Título *</Label>
                <Input
                  id="titulo"
                  value={acompanhamentoForm.titulo}
                  onChange={(e) => setAcompanhamentoForm({...acompanhamentoForm, titulo: e.target.value})}
                  placeholder="Ex: Avaliação semanal de desempenho"
                />
              </div>
              <div>
                <Label htmlFor="data">Data do Acompanhamento *</Label>
                <Input
                  id="data"
                  type="date"
                  value={acompanhamentoForm.data}
                  onChange={(e) => setAcompanhamentoForm({...acompanhamentoForm, data: e.target.value})}
                />
              </div>
            </div>

            {/* Tipo de Observação e Progresso */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="tipo-observacao">Tipo de Observação</Label>
                <Select 
                  value={acompanhamentoForm.tipoObservacao} 
                  onValueChange={(value) => setAcompanhamentoForm({...acompanhamentoForm, tipoObservacao: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="academico">Acadêmico</SelectItem>
                    <SelectItem value="comportamental">Comportamental</SelectItem>
                    <SelectItem value="social">Social</SelectItem>
                    <SelectItem value="familiar">Familiar</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="progresso-academico">Progresso Acadêmico</Label>
                <Select 
                  value={acompanhamentoForm.progressoAcademico} 
                  onValueChange={(value) => setAcompanhamentoForm({...acompanhamentoForm, progressoAcademico: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o progresso" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="excelente">Excelente</SelectItem>
                    <SelectItem value="bom">Bom</SelectItem>
                    <SelectItem value="regular">Regular</SelectItem>
                    <SelectItem value="necessita_atencao">Necessita Atenção</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Descrição */}
            <div>
              <Label htmlFor="descricao">Descrição *</Label>
              <Textarea
                id="descricao"
                value={acompanhamentoForm.descricao}
                onChange={(e) => setAcompanhamentoForm({...acompanhamentoForm, descricao: e.target.value})}
                placeholder="Descreva as observações sobre o aluno..."
                rows={4}
              />
            </div>

            {/* Área de Desenvolvimento e Metas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="area-desenvolvimento">Área de Desenvolvimento</Label>
                <Input
                  id="area-desenvolvimento"
                  value={acompanhamentoForm.areaDesenvolvimento}
                  onChange={(e) => setAcompanhamentoForm({...acompanhamentoForm, areaDesenvolvimento: e.target.value})}
                  placeholder="Ex: Matemática, Português, Comportamento"
                />
              </div>
              <div>
                <Label htmlFor="metas">Metas</Label>
                <Input
                  id="metas"
                  value={acompanhamentoForm.metas}
                  onChange={(e) => setAcompanhamentoForm({...acompanhamentoForm, metas: e.target.value})}
                  placeholder="Ex: Melhorar concentração em sala"
                />
              </div>
            </div>

            {/* Recomendações */}
            <div>
              <Label htmlFor="recomendacoes">Recomendações</Label>
              <Textarea
                id="recomendacoes"
                value={acompanhamentoForm.recomendacoes}
                onChange={(e) => setAcompanhamentoForm({...acompanhamentoForm, recomendacoes: e.target.value})}
                placeholder="Recomendações para o desenvolvimento do aluno..."
                rows={3}
              />
            </div>

            {/* Botão de Salvar */}
            <Button 
              onClick={handleSubmit} 
              className="w-full bg-yellow-500 hover:bg-yellow-600"
              disabled={createAcompanhamentoMutation.isPending}
            >
              {createAcompanhamentoMutation.isPending ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Salvando...
                </div>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Salvar Acompanhamento
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Acompanhamentos */}
      <Card>
        <CardHeader className="pb-3 md:pb-6">
          <CardTitle className="flex items-center gap-2 text-base md:text-lg">
            <Eye className="w-5 h-5 md:w-6 md:h-6" />
            Acompanhamentos Registrados
          </CardTitle>
          
          {/* Campo de busca para a lista */}
          <div className="mt-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar por nome do aluno, CPF ou título..."
                value={listSearchTerm}
                onChange={(e) => setListSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-4 md:px-6">
          {loadingAcompanhamentos ? (
            <div className="text-center py-6 md:py-8">
              <div className="text-gray-500 text-sm md:text-base">Carregando acompanhamentos...</div>
            </div>
          ) : filteredAcompanhamentos.length === 0 ? (
            <div className="text-center py-6 md:py-8">
              <Eye className="w-12 h-12 md:w-16 md:h-16 mx-auto text-gray-400 mb-3 md:mb-4" />
              <h3 className="text-base md:text-lg font-medium text-gray-900 mb-2">
                {listSearchTerm ? 'Nenhum resultado encontrado' : 'Nenhum acompanhamento encontrado'}
              </h3>
              <p className="text-gray-600 text-sm md:text-base px-4">
                {listSearchTerm ? 'Tente buscar com outros termos.' : 'Registre o primeiro acompanhamento usando o formulário acima.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3 md:space-y-4">
              {filteredAcompanhamentos.map((item: any) => {
                const student = students.find(s => s.cpf === item.alunoCpf);
                return (
                  <div key={item.id} className="p-3 md:p-4 border rounded-lg hover:shadow-md transition-shadow">
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-base md:text-lg text-gray-900 mb-2">{item.titulo}</h3>
                        <div className="flex flex-wrap items-center gap-2 md:gap-4 text-xs md:text-sm text-gray-600 mb-2">
                          <span>Aluno: {student?.fullName || student?.nome_completo || 'Nome não encontrado'}</span>
                          <span>Data: {new Date(item.data).toLocaleDateString('pt-BR')}</span>
                          {item.tipoObservacao && <Badge variant="secondary">{item.tipoObservacao}</Badge>}
                          {item.progressoAcademico && <Badge variant="outline">{item.progressoAcademico}</Badge>}
                        </div>
                        <p className="text-sm text-gray-600 mb-2 line-clamp-2">{item.descricao}</p>
                        {item.areaDesenvolvimento && (
                          <p className="text-xs text-gray-500">Área: {item.areaDesenvolvimento}</p>
                        )}
                      </div>
                      <div className="flex gap-2 md:ml-4 flex-wrap">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(item)}
                          className="flex-1 md:flex-none text-xs md:text-sm"
                        >
                          <Edit className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                          Editar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowDeleteDialog(item.id)}
                          className="flex-1 md:flex-none text-red-600 hover:text-red-700 text-xs md:text-sm"
                        >
                          <Trash2 className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                          Excluir
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Edição */}
      {showEditModal && editingItem && (
        <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto mx-4 md:mx-0">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Edit className="w-5 h-5" />
                Editar Acompanhamento
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 md:space-y-6 mt-4">
              {/* Título e Data */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-titulo">Título *</Label>
                  <Input
                    id="edit-titulo"
                    value={editingItem.titulo || ''}
                    onChange={(e) => setEditingItem({...editingItem, titulo: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-data">Data do Acompanhamento *</Label>
                  <Input
                    id="edit-data"
                    type="date"
                    value={editingItem.data || ''}
                    onChange={(e) => setEditingItem({...editingItem, data: e.target.value})}
                  />
                </div>
              </div>

              {/* Tipo de Observação e Progresso */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-tipo">Tipo de Observação</Label>
                  <Select 
                    value={editingItem.tipoObservacao || 'academico'} 
                    onValueChange={(value) => setEditingItem({...editingItem, tipoObservacao: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="academico">Acadêmico</SelectItem>
                      <SelectItem value="comportamental">Comportamental</SelectItem>
                      <SelectItem value="social">Social</SelectItem>
                      <SelectItem value="familiar">Familiar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit-progresso">Progresso Acadêmico</Label>
                  <Select 
                    value={editingItem.progressoAcademico || ''} 
                    onValueChange={(value) => setEditingItem({...editingItem, progressoAcademico: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o progresso" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="excelente">Excelente</SelectItem>
                      <SelectItem value="bom">Bom</SelectItem>
                      <SelectItem value="regular">Regular</SelectItem>
                      <SelectItem value="necessita_atencao">Necessita Atenção</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Descrição */}
              <div>
                <Label htmlFor="edit-observacao">Descrição *</Label>
                <Textarea
                  id="edit-observacao"
                  value={editingItem.observacao || editingItem.descricao || ''}
                  onChange={(e) => setEditingItem({...editingItem, observacao: e.target.value, descricao: e.target.value})}
                  rows={4}
                />
              </div>

              {/* Área de Desenvolvimento e Metas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-area">Área de Desenvolvimento</Label>
                  <Input
                    id="edit-area"
                    value={editingItem.areaDesenvolvimento || ''}
                    onChange={(e) => setEditingItem({...editingItem, areaDesenvolvimento: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-metas">Metas</Label>
                  <Input
                    id="edit-metas"
                    value={editingItem.metas || ''}
                    onChange={(e) => setEditingItem({...editingItem, metas: e.target.value})}
                  />
                </div>
              </div>

              {/* Recomendações */}
              <div>
                <Label htmlFor="edit-recomendacoes">Recomendações</Label>
                <Textarea
                  id="edit-recomendacoes"
                  value={editingItem.recomendacoes || ''}
                  onChange={(e) => setEditingItem({...editingItem, recomendacoes: e.target.value})}
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => setShowEditModal(false)}
                className="w-full sm:w-auto"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleUpdate}
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700"
                disabled={updateAcompanhamentoMutation.isPending}
              >
                {updateAcompanhamentoMutation.isPending ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Dialog de Confirmação de Exclusão */}
      {showDeleteDialog && (
        <AlertDialog open={!!showDeleteDialog} onOpenChange={() => setShowDeleteDialog(null)}>
          <AlertDialogContent className="mx-4 md:mx-0">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-base md:text-lg">Confirmar Exclusão</AlertDialogTitle>
              <AlertDialogDescription className="text-sm md:text-base">
                Tem certeza que deseja excluir este acompanhamento? Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-col sm:flex-row gap-3">
              <AlertDialogCancel className="w-full sm:w-auto">Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteAcompanhamentoMutation.mutate(showDeleteDialog)}
                className="w-full sm:w-auto bg-red-600 hover:bg-red-700"
                disabled={deleteAcompanhamentoMutation.isPending}
              >
                {deleteAcompanhamentoMutation.isPending ? 'Excluindo...' : 'Excluir'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
};

// Componente Registrar Aula
const RegistrarAulaModule = ({ professorId }: { professorId: number }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [aulaForm, setAulaForm] = useState({
    turmaId: '',
    data: '',
    titulo: '',
    conteudoMinistrado: '',
    competenciasTrabalhas: [] as string[],
    observacoes: '',
    materialUtilizado: '',
    presencaAlunos: '',
    duracaoMinutos: ''
  });

  const [filtros, setFiltros] = useState({
    turmaId: 'all',
    dataInicio: '',
    dataFim: ''
  });

  // Query para buscar turmas do professor
  const { data: turmas = [], isLoading: loadingTurmas, error: errorTurmas } = useQuery<any[]>({
    queryKey: ['/api/professor/classes', professorId],
    queryFn: async () => {
      const response = await fetch(`/api/professor/classes/${professorId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch classes');
      }
      const data = await response.json();
      console.log('Turmas fetched from API:', data);
      return data;
    },
    enabled: !!professorId
  });

  // Debug para entender o problema
  console.log('Debug turmas:', { 
    turmas, 
    loadingTurmas, 
    errorTurmas, 
    professorId, 
    turmasLength: turmas?.length,
    turmasType: typeof turmas,
    isArray: Array.isArray(turmas)
  });

  // Query para buscar aulas registradas com filtros
  const { data: aulasRegistradas = [], isLoading: loadingAulas, error: errorAulas } = useQuery({
    queryKey: ['/api/professor/registered-lessons', professorId, filtros],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filtros.turmaId && filtros.turmaId !== 'all') params.append('turmaId', filtros.turmaId);
      if (filtros.dataInicio) params.append('dataInicio', filtros.dataInicio);
      if (filtros.dataFim) params.append('dataFim', filtros.dataFim);
      
      const response = await fetch(`/api/professor/registered-lessons/${professorId}?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch registered lessons');
      }
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    },
    enabled: !!professorId
  });

  const [editingAulaId, setEditingAulaId] = useState(null);

  // Mutation para criar aula registrada
  const createAulaMutation = useMutation({
    mutationFn: (aulaData) => 
      apiRequest(`/api/professor/registered-lessons`, {
        method: 'POST',
        body: JSON.stringify({
          ...aulaData,
          professorId: parseInt(professorId),
          turmaId: parseInt(aulaData.turmaId),
          competenciasTrabalhas: aulaData.competenciasTrabalhas.join(', ')
        })
      }),
    onSuccess: () => {
      toast({
        title: "Aula registrada com sucesso!",
        description: "A aula foi salva no sistema."
      });
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['/api/professor/registered-lessons', professorId] });
    },
    onError: (error) => {
      console.error('Erro ao registrar aula:', error);
      toast({
        title: "Erro ao registrar aula",
        description: "Verifique os dados e tente novamente.",
        variant: "destructive"
      });
    }
  });

  // Mutation para atualizar aula registrada
  const updateAulaMutation = useMutation({
    mutationFn: ({ id, aulaData }) => 
      apiRequest(`/api/professor/registered-lessons/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          ...aulaData,
          professorId: parseInt(professorId),
          turmaId: parseInt(aulaData.turmaId),
          competenciasTrabalhas: aulaData.competenciasTrabalhas.join(', ')
        })
      }),
    onSuccess: () => {
      toast({
        title: "Aula atualizada com sucesso!",
        description: "As alterações foram salvas."
      });
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['/api/professor/registered-lessons', professorId] });
    },
    onError: (error) => {
      console.error('Erro ao atualizar aula:', error);
      toast({
        title: "Erro ao atualizar aula",
        description: "Verifique os dados e tente novamente.",
        variant: "destructive"
      });
    }
  });

  const resetForm = () => {
    setAulaForm({
      turmaId: '',
      data: '',
      titulo: '',
      conteudoMinistrado: '',
      competenciasTrabalhas: [],
      observacoes: '',
      materialUtilizado: '',
      presencaAlunos: '',
      duracaoMinutos: ''
    });
    setEditingAulaId(null);
  };

  const handleSubmitAula = () => {
    // Validações básicas
    if (!aulaForm.turmaId || !aulaForm.data || !aulaForm.titulo || !aulaForm.conteudoMinistrado) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha turma, data, título e conteúdo ministrado.",
        variant: "destructive"
      });
      return;
    }

    if (editingAulaId) {
      updateAulaMutation.mutate({ id: editingAulaId, aulaData: aulaForm });
    } else {
      createAulaMutation.mutate(aulaForm);
    }
  };

  const handleCompetenciaToggle = (competencia: string) => {
    setAulaForm(prev => ({
      ...prev,
      competenciasTrabalhas: prev.competenciasTrabalhas.includes(competencia)
        ? prev.competenciasTrabalhas.filter(c => c !== competencia)
        : [...prev.competenciasTrabalhas, competencia]
    }));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="w-6 h-6" />
            Registrar Aula Ministrada
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Seleção de Turma e Data */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="turma-select">Turma *</Label>
                <Select 
                  value={aulaForm.turmaId} 
                  onValueChange={(value) => setAulaForm({...aulaForm, turmaId: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma turma" />
                  </SelectTrigger>
                  <SelectContent>
                    {loadingTurmas ? (
                      <SelectItem value="loading" disabled>Carregando...</SelectItem>
                    ) : errorTurmas ? (
                      <SelectItem value="error" disabled>Erro ao carregar turmas</SelectItem>
                    ) : !Array.isArray(turmas) || turmas.length === 0 ? (
                      <SelectItem value="empty" disabled>Nenhuma turma encontrada</SelectItem>
                    ) : (
                      turmas.map((turma: any) => (
                        <SelectItem key={turma.id} value={turma.id.toString()}>
                          {turma.nome}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="data-aula">Data da Aula *</Label>
                <Input
                  id="data-aula"
                  type="date"
                  value={aulaForm.data}
                  onChange={(e) => setAulaForm({...aulaForm, data: e.target.value})}
                />
              </div>
            </div>

            {/* Título e Duração */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="titulo-aula">Título da Aula *</Label>
                <Input
                  id="titulo-aula"
                  value={aulaForm.titulo}
                  onChange={(e) => setAulaForm({...aulaForm, titulo: e.target.value})}
                  placeholder="Ex: Introdução à Pintura em Tela"
                />
              </div>
              
              <div>
                <Label htmlFor="duracao">Duração (minutos)</Label>
                <Input
                  id="duracao"
                  type="number"
                  value={aulaForm.duracaoMinutos}
                  onChange={(e) => setAulaForm({...aulaForm, duracaoMinutos: e.target.value})}
                  placeholder="Ex: 90"
                />
              </div>
            </div>

            {/* Conteúdo Ministrado */}
            <div>
              <Label htmlFor="conteudo">Conteúdo Ministrado *</Label>
              <Textarea
                id="conteudo"
                value={aulaForm.conteudoMinistrado}
                onChange={(e) => setAulaForm({...aulaForm, conteudoMinistrado: e.target.value})}
                placeholder="Descreva detalhadamente o conteúdo que foi ministrado na aula..."
                rows={4}
              />
            </div>

            {/* Competências Trabalhadas */}
            <div>
              <Label>Competências Trabalhadas</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                {competenciesList.map(competencia => (
                  <div key={competencia} className="flex items-center space-x-2">
                    <Checkbox
                      id={`competencia-${competencia}`}
                      checked={aulaForm.competenciasTrabalhas.includes(competencia)}
                      onCheckedChange={() => handleCompetenciaToggle(competencia)}
                    />
                    <Label htmlFor={`competencia-${competencia}`} className="text-sm">{competencia}</Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Campos Adicionais */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="material">Material Utilizado</Label>
                <Input
                  id="material"
                  value={aulaForm.materialUtilizado}
                  onChange={(e) => setAulaForm({...aulaForm, materialUtilizado: e.target.value})}
                  placeholder="Ex: Tintas, pincéis, telas"
                />
              </div>
              
              <div>
                <Label htmlFor="presenca">Presença dos Alunos</Label>
                <Input
                  id="presenca"
                  value={aulaForm.presencaAlunos}
                  onChange={(e) => setAulaForm({...aulaForm, presencaAlunos: e.target.value})}
                  placeholder="Ex: 15 de 18 alunos presentes"
                />
              </div>
            </div>

            {/* Observações */}
            <div>
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                value={aulaForm.observacoes}
                onChange={(e) => setAulaForm({...aulaForm, observacoes: e.target.value})}
                placeholder="Observações adicionais sobre a aula, dificuldades encontradas, destaques..."
                rows={3}
              />
            </div>

            {/* Botões de Ação */}
            <div className="flex gap-2">
              <Button 
                onClick={handleSubmitAula} 
                className="btn-yellow"
                disabled={createAulaMutation.isPending || updateAulaMutation.isPending}
              >
                {createAulaMutation.isPending || updateAulaMutation.isPending 
                  ? (editingAulaId ? 'Atualizando...' : 'Registrando...') 
                  : (editingAulaId ? 'Atualizar Aula' : 'Registrar Aula')
                }
              </Button>
              
              {editingAulaId && (
                <Button 
                  variant="outline"
                  onClick={resetForm}
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancelar Edição
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Aulas Registradas */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Aulas Registradas</CardTitle>
          
          {/* Filtros de Busca */}
          <div className="bg-gray-50 p-4 rounded-lg space-y-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="filtro-turma">Filtrar por Turma</Label>
                <Select 
                  value={filtros.turmaId} 
                  onValueChange={(value) => setFiltros({...filtros, turmaId: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as turmas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as turmas</SelectItem>
                    {turmas.map(turma => (
                      <SelectItem key={turma.id} value={turma.id.toString()}>
                        {turma.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="data-inicio">Data Início</Label>
                <Input
                  id="data-inicio"
                  type="date"
                  value={filtros.dataInicio}
                  onChange={(e) => setFiltros({...filtros, dataInicio: e.target.value})}
                />
              </div>
              
              <div>
                <Label htmlFor="data-fim">Data Fim</Label>
                <Input
                  id="data-fim"
                  type="date"
                  value={filtros.dataFim}
                  onChange={(e) => setFiltros({...filtros, dataFim: e.target.value})}
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setFiltros({ turmaId: 'all', dataInicio: '', dataFim: '' })}
              >
                <X className="w-4 h-4 mr-2" />
                Limpar Filtros
              </Button>
              <Badge variant="secondary" className="px-3 py-1">
                {Array.isArray(aulasRegistradas) ? aulasRegistradas.length : 0} aula{Array.isArray(aulasRegistradas) && aulasRegistradas.length !== 1 ? 's' : ''} encontrada{Array.isArray(aulasRegistradas) && aulasRegistradas.length !== 1 ? 's' : ''}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loadingAulas ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500 mx-auto"></div>
              <p className="text-sm text-gray-500 mt-2">Carregando aulas...</p>
            </div>
          ) : !Array.isArray(aulasRegistradas) || aulasRegistradas.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p className="text-lg font-medium mb-2">Nenhuma aula registrada</p>
              <p className="text-sm">Registre sua primeira aula acima</p>
            </div>
          ) : (
            <div className="space-y-4">
              {Array.isArray(aulasRegistradas) && aulasRegistradas.map(aula => (
                <div key={aula.id} className="p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-medium text-gray-900">{aula.titulo}</h3>
                      <p className="text-sm text-gray-500">
                        {new Date(aula.data).toLocaleDateString('pt-BR')} 
                        {aula.duracaoMinutos && ` • ${aula.duracaoMinutos} min`}
                      </p>
                    </div>
                    <Badge variant="secondary">{turmas.find(t => t.id === aula.turmaId)?.nome || 'Turma'}</Badge>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-3">{aula.conteudoMinistrado}</p>
                  
                  {aula.competenciasTrabalhas && (
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <span className="text-sm font-medium">Competências:</span>
                      {aula.competenciasTrabalhas.split(', ').map((comp, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {comp}
                        </Badge>
                      ))}
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{aula.materialUtilizado && `Material: ${aula.materialUtilizado}`}</span>
                    <span>{aula.presencaAlunos && `Presença: ${aula.presencaAlunos}`}</span>
                  </div>
                  
                  {/* Botões de Ação */}
                  <div className="flex gap-2 mt-3 pt-3 border-t">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        // Carregar dados da aula no formulário para edição
                        setEditingAulaId(aula.id);
                        setAulaForm({
                          turmaId: aula.turmaId.toString(),
                          data: aula.data,
                          titulo: aula.titulo,
                          conteudoMinistrado: aula.conteudoMinistrado,
                          competenciasTrabalhas: aula.competenciasTrabalhas ? aula.competenciasTrabalhas.split(', ') : [],
                          observacoes: aula.observacoes || '',
                          materialUtilizado: aula.materialUtilizado || '',
                          presencaAlunos: aula.presencaAlunos || '',
                          duracaoMinutos: aula.duracaoMinutos?.toString() || ''
                        });
                        // Scroll para o formulário
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Editar
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => {
                        // Visualizar detalhes da aula em modal
                        toast({
                          title: aula.titulo,
                          description: `${aula.conteudoMinistrado.substring(0, 100)}${aula.conteudoMinistrado.length > 100 ? '...' : ''}`
                        });
                      }}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Visualizar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// CPF utility functions
const formatCPF = (value) => {
  // Remove all non-numeric characters
  const numericValue = value.replace(/\D/g, '');
  
  // Apply CPF mask: 000.000.000-00
  if (numericValue.length <= 3) {
    return numericValue;
  } else if (numericValue.length <= 6) {
    return `${numericValue.slice(0, 3)}.${numericValue.slice(3)}`;
  } else if (numericValue.length <= 9) {
    return `${numericValue.slice(0, 3)}.${numericValue.slice(3, 6)}.${numericValue.slice(6)}`;
  } else {
    return `${numericValue.slice(0, 3)}.${numericValue.slice(3, 6)}.${numericValue.slice(6, 9)}-${numericValue.slice(9, 11)}`;
  }
};

const validateCPF = (cpf) => {
  try {
    cpfSchema.parse(cpf.replace(/\D/g, ''));
    return { isValid: true, error: null };
  } catch (error) {
    return { isValid: false, error: error.errors[0]?.message || 'CPF inválido' };
  }
};

const validateStudentForm = (formData) => {
  const errors = {};
  
  // Validate required CPF fields
  if (!formData.cpf) {
    errors.cpf = 'CPF do aluno é obrigatório';
  } else {
    const cpfValidation = validateCPF(formData.cpf);
    if (!cpfValidation.isValid) {
      errors.cpf = cpfValidation.error;
    }
  }
  
  // Validações para os novos campos de pais e responsável
  
  // Validar campos da mãe (só obrigatórios se for responsável legal)
  if (formData.maeResponsavelLegal) {
    if (!formData.nomeMae) {
      errors.nomeMae = 'Nome da mãe é obrigatório quando ela é responsável legal';
    }
    if (!formData.cpfMae) {
      errors.cpfMae = 'CPF da mãe é obrigatório quando ela é responsável legal';
    } else {
      const maeCpfValidation = validateCPF(formData.cpfMae);
      if (!maeCpfValidation.isValid) {
        errors.cpfMae = maeCpfValidation.error;
      }
    }
    if (!formData.profissaoMae) {
      errors.profissaoMae = 'Profissão da mãe é obrigatória quando ela é responsável legal';
    }
    if (!formData.telefoneMae) {
      errors.telefoneMae = 'Telefone da mãe é obrigatório quando ela é responsável legal';
    }
  }
  
  // Validar campos do pai (só obrigatórios se for responsável legal)
  if (formData.paiResponsavelLegal) {
    if (!formData.nomePai) {
      errors.nomePai = 'Nome do pai é obrigatório quando ele é responsável legal';
    }
    if (!formData.cpfPai) {
      errors.cpfPai = 'CPF do pai é obrigatório quando ele é responsável legal';
    } else {
      const paiCpfValidation = validateCPF(formData.cpfPai);
      if (!paiCpfValidation.isValid) {
        errors.cpfPai = paiCpfValidation.error;
      }
    }
    if (!formData.profissaoPai) {
      errors.profissaoPai = 'Profissão do pai é obrigatória quando ele é responsável legal';
    }
    if (!formData.telefonePai) {
      errors.telefonePai = 'Telefone do pai é obrigatório quando ele é responsável legal';
    }
  }
  
  // Validar responsável legal (obrigatório se nem pai nem mãe forem responsáveis legais)
  const temResponsavelLegal = formData.maeResponsavelLegal || formData.paiResponsavelLegal;
  if (!temResponsavelLegal) {
    // Se nem pai nem mãe são responsáveis legais, o responsável é obrigatório
    if (!formData.nomeResponsavel) {
      errors.nomeResponsavel = 'Nome do responsável legal é obrigatório se nem pai nem mãe forem responsáveis';
    }
    if (!formData.cpfResponsavel) {
      errors.cpfResponsavel = 'CPF do responsável legal é obrigatório (chave de identificação no sistema)';
    } else {
      const respCpfValidation = validateCPF(formData.cpfResponsavel);
      if (!respCpfValidation.isValid) {
        errors.cpfResponsavel = respCpfValidation.error;
      }
    }
    if (!formData.grauParentesco) {
      errors.grauParentesco = 'Grau de parentesco é obrigatório para responsável legal';
    }
    if (!formData.telefoneResponsavel) {
      errors.telefoneResponsavel = 'Telefone do responsável legal é obrigatório';
    }
  } else {
    // Se já há responsável legal (pai ou mãe), o responsável é opcional
    // Mas se os campos foram preenchidos, CPF deve ser válido
    if (formData.cpfResponsavel && formData.cpfResponsavel.trim()) {
      const respCpfValidation = validateCPF(formData.cpfResponsavel);
      if (!respCpfValidation.isValid) {
        errors.cpfResponsavel = respCpfValidation.error;
      }
    }
  }
  
  // Check for duplicate CPFs entre todos os CPFs
  const cpfs = [];
  if (formData.cpf) cpfs.push({value: formData.cpf, field: 'cpf', name: 'aluno'});
  if (formData.cpfMae) cpfs.push({value: formData.cpfMae, field: 'cpfMae', name: 'mãe'});
  if (formData.cpfPai) cpfs.push({value: formData.cpfPai, field: 'cpfPai', name: 'pai'});
  if (formData.cpfResponsavel) cpfs.push({value: formData.cpfResponsavel, field: 'cpfResponsavel', name: 'responsável'});
  
  // Remove formatting and check for duplicates
  const cleanCpfs = cpfs.map(item => ({...item, cleanValue: item.value.replace(/\D/g, '')}));
  
  for (let i = 0; i < cleanCpfs.length; i++) {
    for (let j = i + 1; j < cleanCpfs.length; j++) {
      if (cleanCpfs[i].cleanValue === cleanCpfs[j].cleanValue) {
        errors[cleanCpfs[j].field] = `CPF do ${cleanCpfs[j].name} não pode ser igual ao CPF do ${cleanCpfs[i].name}`;
      }
    }
  }
  
  // Validação final para garantir que temos ao menos os campos críticos
  if (!formData.fullName) {
    errors.fullName = 'Nome completo é obrigatório';
  }
  
  if (!formData.birthDate) {
    errors.birthDate = 'Data de nascimento é obrigatória';
  }
  
  // Para compatibilidade com backend, validar motherCpf ou cpfMae
  const motherCpfToValidate = formData.cpfMae || formData.motherCpf;
  if (!motherCpfToValidate) {
    errors.cpfMae = 'CPF da mãe é obrigatório';
  } else {
    const motherCpfValidation = validateCPF(motherCpfToValidate);
    if (!motherCpfValidation.isValid) {
      errors.cpfMae = motherCpfValidation.error;
    }
  }
  
  return errors;
};

// Function to map form data to backend schema format
const mapStudentFormToBackend = (formData) => {
  return {
    // Required fields
    cpf: formData.cpf?.replace(/\D/g, ''), // Remove formatting
    nome_completo: formData.fullName || formData.nome_completo,
    data_nascimento: formData.birthDate || formData.data_nascimento,
    motherCpf: formData.cpfMae?.replace(/\D/g, '') || formData.motherCpf?.replace(/\D/g, ''),
    
    // Optional fields - map to backend schema names
    gender: formData.gender,
    ethnicity: formData.corRaca,
    phone: formData.telefone,
    email: formData.email,
    photoUrl: formData.photoUrl,
    identityFrontUrl: formData.uploadIdentidadeFrente,
    identityBackUrl: formData.uploadIdentidadeVerso,
    
    // Address
    street: formData.logradouro,
    number: formData.numero,
    complement: formData.complemento,
    neighborhood: formData.bairro,
    city: formData.municipio,
    state: formData.estado,
    zipCode: formData.cep?.replace(/\D/g, ''),
    
    // Family data
    motherName: formData.nomeMae || formData.motherName,
    motherPhone: formData.telefoneMae || formData.motherPhone,
    motherOccupation: formData.profissaoMae || formData.motherOccupation,
    motherEducation: formData.motherEducation,
    
    fatherName: formData.nomePai || formData.fatherName,
    fatherCpf: formData.cpfPai?.replace(/\D/g, '') || formData.fatherCpf?.replace(/\D/g, ''),
    fatherPhone: formData.telefonePai || formData.fatherPhone,
    fatherOccupation: formData.profissaoPai || formData.fatherOccupation,
    fatherEducation: formData.fatherEducation,
    
    guardianName: formData.nomeResponsavel || formData.guardianName,
    guardianCpf: formData.cpfResponsavel?.replace(/\D/g, '') || formData.guardianCpf?.replace(/\D/g, ''),
    guardianPhone: formData.telefoneResponsavel || formData.guardianPhone,
    
    // School data
    schoolName: formData.schoolName,
    currentGrade: formData.currentGrade,
    shift: formData.shift,
    hasSpecialNeeds: formData.hasSpecialNeeds || false,
    specialNeedsDescription: formData.specialNeedsDescription,
    
    // Medical data
    hasAllergies: formData.hasAllergies || false,
    allergiesDescription: formData.allergiesDescription,
    hasMedications: formData.hasMedications || false,
    medicationsDescription: formData.medicationsDescription,
    hasHealthConditions: formData.hasHealthConditions || false,
    healthConditionsDescription: formData.healthConditionsDescription,
    medicalDocumentUrl: formData.uploadLaudoMedico,
    
    // Social benefits
    hasBolsaFamilia: formData.recebeBolsaFamilia === "Sim" || formData.hasBolsaFamilia || false,
    hasAuxilioEmergencial: formData.hasAuxilioEmergencial || false,
    hasOtherBenefits: formData.recebeOutrosBeneficios === "Sim" || formData.hasOtherBenefits || false,
    otherBenefitsDescription: formData.otherBenefitsDescription,
    
    // Observations
    observations: formData.observacoes || formData.observations,
  };
};

const progressOptions = [
  { value: "desenvolvimento", label: "Em desenvolvimento" },
  { value: "avancado", label: "Avançado" },
  { value: "dificuldade", label: "Com dificuldade" }
];

export default function Professor() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  // Developer access - check if dev_access is present in URL
  const devAccess = new URLSearchParams(window.location.search).get('dev_access') === 'true';
  
  // Estado para tipo de professor (lider ou professor)
  const [professorType, setProfessorType] = useState<'lider' | 'professor'>('professor');
  const [userProfile, setUserProfile] = useState<any>(null);
  
  // Função para verificar se o usuário é líder
  const isLeader = professorType === 'lider';
  
  // Professor data state
  const [professorData, setProfessorData] = useState(() => {
    const storedData = localStorage.getItem('professorData');
    if (storedData) {
      return JSON.parse(storedData);
    }
    // Default professor data with ID 15 from database
    const defaultData = {"id": 15, "name": "Professor Teste", "phone": "11999999999", "email": "", "photo": "/api/placeholder/150/150"};
    localStorage.setItem('professorData', JSON.stringify(defaultData));
    return defaultData;
  });
  
  const [activeSection, setActiveSection] = useState("dashboard");
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [attendance, setAttendance] = useState({});
  const [newLesson, setNewLesson] = useState({
    description: "",
    competencies: [],
    date: new Date().toISOString().split('T')[0]
  });
  const [newObservation, setNewObservation] = useState({
    studentCpf: "",
    text: "",
    progress: ""
  });
  // reminders now comes from React Query (calendarEvents data filtered by type)
  const [newReminder, setNewReminder] = useState({
    title: "",
    date: "",
    time: ""
  });
  const [showEventModal, setShowEventModal] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [showEventDetailsModal, setShowEventDetailsModal] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedDateEvents, setSelectedDateEvents] = useState([]);
  const [eventToDelete, setEventToDelete] = useState(null);
  const [newEvent, setNewEvent] = useState({
    title: "",
    date: "",
    time: "",
    type: "evento",
    description: ""
  });
  const [reportFilter, setReportFilter] = useState("month");
  const [calendarView, setCalendarView] = useState("month");
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // State para histórico de chamadas
  const [selectedClassForHistory, setSelectedClassForHistory] = useState("");
  const [selectedDateForHistory, setSelectedDateForHistory] = useState("");
  const [showAllDates, setShowAllDates] = useState(true);
  
  // Query para obter dados do professor atual e tipo
  const { data: currentUser } = useQuery({
    queryKey: ['current-user', professorData.id],
    queryFn: () => apiRequest(`/api/users/${professorData.id}`),
    enabled: !!professorData.id,
  });

  // Effect para processar dados do usuário atual
  useEffect(() => {
    if (currentUser && currentUser.professorTipo) {
      setProfessorType(currentUser.professorTipo);
      setUserProfile(currentUser);
    }
  }, [currentUser]);

  // Query para buscar professores disponíveis (apenas para líderes)
  const { data: professoresDisponiveis = [], isLoading: loadingProfessores } = useQuery({
    queryKey: ['/api/professor/list'],
    queryFn: () => apiRequest('/api/professor/list'),
    enabled: isLeader,
    retry: false,
  });

  // Effect para detectar tipo de professor do localStorage
  useEffect(() => {
    // Primeiro, tentar pegar do localStorage onde foi salvo durante o login
    const storedProfessorType = localStorage.getItem('professorTipo');
    if (storedProfessorType) {
      setProfessorType(storedProfessorType as 'lider' | 'professor');
    } else {
      // Fallback: verificar pelo telefone armazenado durante o login
      const userPhone = localStorage.getItem('userPhone') || localStorage.getItem('userTelefone');
      if (userPhone) {
        const normalizedPhone = userPhone.replace(/\D/g, '').replace(/^55/, '');
        if (normalizedPhone === '31987654321') {
          setProfessorType('lider');
        } else if (normalizedPhone === '31987654322') {
          setProfessorType('professor');
        }
      }
    }
  }, []);

  // React Query hooks for data fetching
  const { data: students = [], isLoading: studentsLoading } = useQuery({
    queryKey: ['students', professorData.id],
    queryFn: () => apiRequest(`/api/professor/students/${professorData.id}`),
    enabled: !!professorData.id,
  });

  const { data: classes = [], isLoading: classesLoading } = useQuery({
    queryKey: ['classes', professorData.id],
    queryFn: () => apiRequest(`/api/professor/classes/${professorData.id}`),
    enabled: !!professorData.id,
  });

  const { data: lessons = [], isLoading: lessonsLoading } = useQuery({
    queryKey: ['lessons', professorData.id],
    queryFn: () => apiRequest(`/api/professor/lessons/${professorData.id}`),
    enabled: !!professorData.id,
  });

  const { data: calendarEvents = [], isLoading: eventsLoading } = useQuery({
    queryKey: ['/api/professor/events', professorData.id],
    queryFn: () => apiRequest(`/api/professor/events/${professorData.id}`),
    enabled: !!professorData.id,
  });

  const { data: observations = [], isLoading: observationsLoading } = useQuery({
    queryKey: ['observations', professorData.id],
    queryFn: () => apiRequest(`/api/professor/observations/${professorData.id}`),
    enabled: !!professorData.id,
  });



  // Mutations
  const createStudentMutation = useMutation({
    mutationFn: (studentData) => apiRequest('/api/professor/students', {
      method: 'POST',
      body: JSON.stringify({ ...studentData, professorId: professorData.id }),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['students', professorData.id]);
      toast({
        title: "Aluno registrado com sucesso!",
        description: "O cadastro foi salvo no sistema.",
      });
      setActiveSection("dashboard");
    },
    onError: (error) => {
      toast({
        title: "Erro ao cadastrar aluno",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Mutação para registrar chamada
  const recordAttendanceMutation = useMutation({
    mutationFn: (attendanceRecord) => apiRequest('/api/professor/attendance', {
      method: 'POST',
      body: JSON.stringify(attendanceRecord),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance-history'] });
      toast({
        title: "Chamada registrada com sucesso!",
        description: "A presença dos alunos foi salva no sistema.",
      });
      setSelectedClassForAttendance("");
      setAttendanceData({});
    },
    onError: (error) => {
      toast({
        title: "Erro ao registrar chamada",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const createClassMutation = useMutation({
    mutationFn: async (classData) => {
      // Clean data - remove empty strings for date fields
      const cleanedData = {
        ...classData,
        professorId: professorData.id,
        startDate: classData.startDate || null,
        endDate: classData.endDate || null,
      };
      
      // Primeiro cria a turma
      const createdClass = await apiRequest('/api/professor/classes', {
        method: 'POST',
        body: JSON.stringify(cleanedData),
      });
      
      // Se há alunos selecionados, matricula cada um
      if (selectedStudentsForClass.length > 0) {
        const enrollmentPromises = selectedStudentsForClass.map(studentCpf =>
          apiRequest(`/api/professor/classes/${createdClass.id}/enroll/${studentCpf}`, {
            method: 'POST',
          })
        );
        
        await Promise.all(enrollmentPromises);
      }
      
      return createdClass;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['classes', professorData.id]);
      const studentsCount = selectedStudentsForClass.length;
      toast({
        title: "Turma criada com sucesso!",
        description: studentsCount > 0 
          ? `A turma foi criada e ${studentsCount} aluno(s) foram matriculados.`
          : "A turma foi adicionada ao sistema.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao criar turma",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const createLessonMutation = useMutation({
    mutationFn: (lessonData) => apiRequest('/api/professor/lessons', {
      method: 'POST',
      body: JSON.stringify({ ...lessonData, professorId: professorData.id }),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['lessons', professorData.id]);
      toast({
        title: "Aula registrada com sucesso!",
        description: "A aula foi salva no sistema.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao registrar aula",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const createEventMutation = useMutation({
    mutationFn: (eventData) => apiRequest('/api/professor/events', {
      method: 'POST',
      body: JSON.stringify({ ...eventData, professorId: professorData.id }),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['/api/professor/events', professorData.id]);
      toast({
        title: "Evento criado com sucesso!",
        description: "O evento foi adicionado ao calendário.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao criar evento",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const deleteEventMutation = useMutation({
    mutationFn: (eventId) => apiRequest(`/api/professor/events/${eventId}`, {
      method: 'DELETE',
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['/api/professor/events', professorData.id]);
      toast({
        title: "Evento excluído!",
        description: "O evento foi removido do calendário.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao excluir evento",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const createObservationMutation = useMutation({
    mutationFn: (observationData) => apiRequest('/api/professor/observations', {
      method: 'POST',
      body: JSON.stringify({ ...observationData, professorId: professorData.id }),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['observations', professorData.id]);
      toast({
        title: "Observação salva com sucesso!",
        description: "A observação foi registrada no sistema.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao salvar observação",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const enrollStudentMutation = useMutation({
    mutationFn: (enrollmentData) => apiRequest('/api/professor/enroll', {
      method: 'POST',
      body: JSON.stringify(enrollmentData),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['classes', professorData.id]);
      toast({
        title: "Aluno matriculado com sucesso!",
        description: "O aluno foi adicionado à turma.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao matricular aluno",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Mutations para responsáveis legais
  const createGuardianMutation = useMutation({
    mutationFn: (guardianData) => apiRequest('/api/professor/guardians', {
      method: 'POST',
      body: JSON.stringify(guardianData),
    }),
    onSuccess: () => {
      toast({
        title: "Responsável registrado com sucesso!",
        description: "O responsável foi adicionado ao sistema.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao registrar responsável",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const unenrollStudentMutation = useMutation({
    mutationFn: ({ studentCpf, classId }) => apiRequest(`/api/professor/classes/${classId}/unenroll/${studentCpf}`, {
      method: "DELETE",
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['classes', professorData.id]);
      toast({
        title: "Aluno removido!",
        description: "Aluno foi removido da turma com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Erro ao remover aluno da turma.",
        variant: "destructive",
      });
    },
  });
  
  // Estados para Gerenciar Alunos
  const [managementMode, setManagementMode] = useState<'register' | 'search' | 'edit' | 'view'>('register');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedStudentForView, setSelectedStudentForView] = useState<any>(null);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [studentFormData, setStudentFormData] = useState({
    // 1. Identificação
    fullName: "",
    cpf: "",
    birthDate: "",
    gender: "",
    photoUrl: "",
    registrationNumber: "",
    familyAtendido: "",
    situacaoAtendimento: "",
    estadoCivil: "",
    religiao: "",
    naturalidade: "",
    nacionalidade: "Brasileira",
    podeSairSozinho: "",
    
    // 2. Dados complementares
    tamanhoCalca: "",
    tamanhoCamiseta: "",
    tamanhoCalcado: "",
    corRaca: "",
    frequentaProjetoSocial: "",
    qualProjetoSocial: "",
    possuiAcessoInternet: "",
    qualAcessoInternet: "",
    
    // 3. Documentos
    rg: "",
    orgaoEmissor: "",
    carteiraTrabalho: "",
    serie: "",
    tituloEleitor: "",
    nisPisPasep: "",
    documentosPosse: [],
    uploadRg: "",
    uploadLaudoMedico: "",
    
    // 4. Contato
    email: "",
    telefone: "",
    whatsapp: "",
    pessoaContato: "",
    telefoneContato: "",
    whatsappContato: "",
    
    // 5. Benefícios Sociais
    familiaNoCADUnico: "",
    recebeBolsaFamilia: "",
    recebeBPC: "",
    recebeCartaoAlimentacao: "",
    recebeOutrosBeneficios: "",
    
    // 6. Endereço
    cep: "",
    estado: "",
    municipio: "",
    bairro: "",
    logradouro: "",
    numero: "",
    complemento: "",
    pontoReferencia: "",
    moraDesdeAno: "",
    
    // 7. Informações do domicílio
    resideAreaRisco: "",
    numeroComodos: "",
    tipoMoradia: "",
    materialParedes: "",
    materialPiso: "",
    materialTelhado: "",
    abastecimentoAgua: "",
    formaIluminacao: "",
    destinoEsgoto: "",
    destinoLixo: "",
    informacoesDespesas: "",
    
    // 8. Dados institucionais
    dataEntrada: "",
    formaAcesso: "",
    demandasAtendidas: [],
    
    // 9. Observações finais
    observacoes: "",
    
    // 10. Dados dos Pais e Responsável
    // Dados da Mãe
    nomeMae: "",
    cpfMae: "",
    profissaoMae: "",
    telefoneMae: "",
    maeMoraComAluno: "",
    maeResponsavelLegal: false,
    
    // Dados do Pai
    nomePai: "",
    cpfPai: "",
    profissaoPai: "",
    telefonePai: "",
    paiMoraComAluno: "",
    paiResponsavelLegal: false,
    
    // Responsável Legal
    nomeResponsavel: "",
    cpfResponsavel: "",
    grauParentesco: "",
    profissaoResponsavel: "",
    telefoneResponsavel: "",
    emailResponsavel: "",
    responsavelMoraComAluno: "",
    responsavelContatoEmergencia: "",
    
    // Campos mantidos para compatibilidade
    motherName: "",
    motherCpf: "",
    fatherName: "",
    fatherCpf: "",
    phone: ""
  });
  
  const [studentFormErrors, setStudentFormErrors] = useState({});
  const [studentFormStep, setStudentFormStep] = useState(1);
  
  // Estados para responsáveis legais
  const [guardians, setGuardians] = useState([]);
  const [currentGuardian, setCurrentGuardian] = useState({
    cpf: "",
    fullName: "",
    relationship: "",
    birthDate: "",
    profession: "",
    phone: "",
    whatsapp: "",
    email: "",
    isPrincipalResponsible: false,
    isEmergencyContact: false,
    observations: "",
    sameAddressAsStudent: true,
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
    zipCode: "",
    country: "Brasil",
    googlePlaceId: "",
    latitude: "",
    longitude: ""
  });
  const [showGuardianForm, setShowGuardianForm] = useState(false);
  const [editingGuardianIndex, setEditingGuardianIndex] = useState(-1);
  
  // Estados para Google Maps
  const [googleMapsLoaded, setGoogleMapsLoaded] = useState(false);
  const [addressSuggestions, setAddressSuggestions] = useState([]);

  // Estados para criar turma
  const [classFormData, setClassFormData] = useState({
    name: "",
    description: "",
    maxStudents: 30,
    startDate: "",
    endDate: "",
    schedule: "",
    room: "",
    professorId: professorData?.id || null
  });
  const [selectedStudentsForClass, setSelectedStudentsForClass] = useState([]);
  const [studentSearchTerm, setStudentSearchTerm] = useState("");
  const [showStudentSearch, setShowStudentSearch] = useState(false);
  const [selectedClassForManagement, setSelectedClassForManagement] = useState(null);
  const [showClassManagement, setShowClassManagement] = useState(false);
  const [managementSearchTerm, setManagementSearchTerm] = useState("");
  const [selectedStudentsToAdd, setSelectedStudentsToAdd] = useState([]);
  
  // Estados para chamada
  const [selectedClassForAttendance, setSelectedClassForAttendance] = useState("");
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [classStudents, setClassStudents] = useState([]);
  const [attendanceData, setAttendanceData] = useState({});
  
  const [chamadaTab, setChamadaTab] = useState("fazer"); // "fazer" ou "historico"
  
  const [showAddressMap, setShowAddressMap] = useState(false);

  // Query para buscar alunos de uma turma específica
  const { data: enrolledStudents = [], isLoading: enrolledStudentsLoading } = useQuery({
    queryKey: ['enrolled-students', selectedClassForAttendance],
    queryFn: async () => {
      if (!selectedClassForAttendance) return [];
      return apiRequest(`/api/professor/classes/${selectedClassForAttendance}/students`);
    },
    enabled: !!selectedClassForAttendance,
  });

  // Query simplificada para histórico
  const { data: attendanceHistory = [], isLoading: historyLoading } = useQuery({
    queryKey: ['attendance-history', selectedClassForHistory],
    queryFn: async () => {
      if (!selectedClassForHistory) return [];
      return apiRequest(`/api/professor/classes/${selectedClassForHistory}/attendance`);
    },
    enabled: !!selectedClassForHistory,
  });
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [mapCenter, setMapCenter] = useState({ lat: -23.5505, lng: -46.6333 }); // São Paulo default

  // Função para buscar CEP automaticamente
  const handleCepChange = async (cep) => {
    const cleanCep = cep.replace(/\D/g, '');
    
    // Atualiza o estado com o CEP formatado
    setStudentFormData({
      ...studentFormData,
      cep: cleanCep.replace(/(\d{5})(\d{3})/, '$1-$2')
    });

    // Se CEP tem 8 dígitos, busca automaticamente
    if (cleanCep.length === 8) {
      try {
        // Primeiro tenta ViaCEP (gratuito e confiável)
        const viaCepResponse = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
        const viaCepData = await viaCepResponse.json();

        if (!viaCepData.erro) {
          setStudentFormData(prevData => ({
            ...prevData,
            logradouro: viaCepData.logradouro || prevData.logradouro,
            bairro: viaCepData.bairro || prevData.bairro,
            municipio: viaCepData.localidade || prevData.municipio,
            estado: viaCepData.uf || prevData.estado,
          }));

          toast({
            title: "CEP encontrado!",
            description: "Endereço preenchido automaticamente.",
          });
          return;
        }
      } catch (error) {
        console.log('ViaCEP falhou, tentando alternativa...');
      }

      // Se ViaCEP falhar, mostra aviso
      toast({
        title: "CEP não encontrado",
        description: "Verifique o CEP ou preencha manualmente os campos de endereço.",
        variant: "destructive",
      });
    }
  };

  // Função para buscar alunos existentes
  const searchStudents = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      const response = await apiRequest(`/api/professor/students/search?q=${encodeURIComponent(query)}`);
      setSearchResults(response || []);
    } catch (error) {
      console.error('Erro ao buscar alunos:', error);
      setSearchResults([]);
    }
  };

  // Função para visualizar dados de um aluno específico
  const viewStudentData = (student: any) => {
    console.log('=== INÍCIO viewStudentData ===');
    console.log('Student data:', student);
    
    setSelectedStudentForView(student);
    setShowViewModal(true);
    
    console.log('=== FIM viewStudentData ===');
  };

  // Função para carregar dados de um aluno específico para edição
  const loadStudentData = (student: any) => {
    setSelectedStudent(student);
    setStudentFormData({
      // Mapear todos os campos do aluno para o formulário
      fullName: student.nome_completo || '',
      cpf: student.cpf || '',
      birthDate: student.data_nascimento || '',
      gender: student.genero || '',
      photoUrl: student.foto_perfil || '',
      registrationNumber: student.numero_matricula || '',
      familyAtendido: student.familia_nome || '',
      situacaoAtendimento: student.situacao_atendimento || '',
      estadoCivil: student.estado_civil || '',
      religiao: student.religiao || '',
      naturalidade: student.naturalidade || '',
      nacionalidade: student.nacionalidade || 'Brasileira',
      podeSairSozinho: student.pode_sair_sozinho || '',
      
      // Dados complementares
      tamanhoCalca: student.tamanho_calca || '',
      tamanhoCamiseta: student.tamanho_camiseta || '',
      tamanhoCalcado: student.tamanho_calcado || '',
      corRaca: student.cor_raca || '',
      frequentaProjetoSocial: student.frequenta_projeto_social || '',
      qualProjetoSocial: student.qual_projeto_social || '',
      possuiAcessoInternet: student.possui_acesso_internet || '',
      qualAcessoInternet: student.qual_acesso_internet || '',
      
      // Documentos
      rg: student.rg || '',
      orgaoEmissor: student.orgao_emissor || '',
      carteiraTrabalho: student.carteira_trabalho || '',
      serie: student.serie || '',
      tituloEleitor: student.titulo_eleitor || '',
      nisPisPasep: student.nis_pis_pasep || '',
      documentosPosse: student.documentos_posse || [],
      uploadRg: student.upload_rg || '',
      uploadLaudoMedico: student.upload_laudo_medico || '',
      
      // Contato
      email: student.email || '',
      telefone: student.telefone || '',
      whatsapp: student.whatsapp || '',
      pessoaContato: student.pessoa_contato || '',
      telefoneContato: student.telefone_contato || '',
      whatsappContato: student.whatsapp_contato || '',
      
      // Benefícios Sociais
      familiaNoCADUnico: student.familia_no_cadunico || '',
      recebeBolsaFamilia: student.recebe_bolsa_familia || '',
      recebeBPC: student.recebe_bpc || '',
      recebeCartaoAlimentacao: student.recebe_cartao_alimentacao || '',
      recebeOutrosBeneficios: student.recebe_outros_beneficios || '',
      
      // Endereço
      cep: student.cep || '',
      estado: student.estado || '',
      municipio: student.municipio || '',
      bairro: student.bairro || '',
      logradouro: student.logradouro || '',
      numero: student.numero || '',
      complemento: student.complemento || '',
      pontoReferencia: student.ponto_referencia || '',
      moraDesdeAno: student.mora_desde_ano || '',
      
      // Domicílio
      resideAreaRisco: student.reside_area_risco || '',
      numeroComodos: student.numero_comodos || '',
      tipoMoradia: student.tipo_moradia || '',
      materialParedes: student.material_paredes || '',
      materialPiso: student.material_piso || '',
      materialTelhado: student.material_telhado || '',
      abastecimentoAgua: student.abastecimento_agua || '',
      formaIluminacao: student.forma_iluminacao || '',
      destinoLixo: student.destino_lixo || '',
      esgotamentoSanitario: student.esgotamento_sanitario || '',
      
      // Família
      situacaoFamiliar: student.situacao_familiar || '',
      quantasPessoasNaFamilia: student.quantas_pessoas_na_familia || '',
      possuiFilhos: student.possui_filhos || '',
      quantosFilhos: student.quantos_filhos || '',
      idadeFilhos: student.idade_filhos || '',
      filhoComDeficiencia: student.filho_com_deficiencia || '',
      tipoDeficienciaFilho: student.tipo_deficiencia_filho || '',
      
      // Educação
      escolaridade: student.escolaridade || '',
      qualSerie: student.qual_serie || '',
      nomeEscola: student.nome_escola || '',
      tipoEscola: student.tipo_escola || '',
      turno: student.turno || '',
      dificuldadeAprender: student.dificuldade_aprender || '',
      qualDificuldade: student.qual_dificuldade || '',
      abandonouEscola: student.abandonou_escola || '',
      motivoAbandonou: student.motivo_abandonou || '',
      pretendeContinuar: student.pretende_continuar || '',
      
      // Trabalho
      trabalha: student.trabalha || '',
      ondeTrabalha: student.onde_trabalha || '',
      cargoTrabalho: student.cargo_trabalho || '',
      quantoGanha: student.quanto_ganha || '',
      qualRendaFamiliar: student.qual_renda_familiar || '',
      
      // Saúde
      possuiDeficiencia: student.possui_deficiencia || '',
      qualDeficiencia: student.qual_deficiencia || '',
      possuiAlergia: student.possui_alergia || '',
      qualAlergia: student.qual_alergia || '',
      fazUsoDeMedicamento: student.faz_uso_de_medicamento || '',
      qualMedicamento: student.qual_medicamento || '',
      observacoesSaude: student.observacoes_saude || '',
      
      // Observações
      observacoesGerais: student.observacoes_gerais || '',
      
      // Dados dos pais (serão carregados separadamente)
      nomePai: '',
      cpfPai: '',
      profissaoPai: '',
      telefonePai: '',
      escolaridadePai: '',
      
      nomeMae: '',
      cpfMae: '',
      profissaoMae: '',
      telefoneMae: '',
      escolaridadeMae: '',
      
      nomeResponsavel: '',
      cpfResponsavel: '',
      profissaoResponsavel: '',
      telefoneResponsavel: '',
      escolaridadeResponsavel: '',
      parentescoResponsavel: '',
      
      paiEResponsavel: '',
      maeEResponsavel: '',
    });
    
    setManagementMode('edit');
    setIsEditing(true);
    setStudentFormStep(1);
  };

  // Função para salvar alterações do aluno
  const saveStudentChanges = async () => {
    try {
      const mappedData = mapStudentFormToBackend(studentFormData);
      
      await apiRequest(`/api/professor/students/${selectedStudent.cpf}`, {
        method: 'PUT',
        body: JSON.stringify(mappedData)
      });
      
      toast({
        title: "Aluno atualizado!",
        description: "As alterações foram salvas com sucesso.",
      });
      
      // Invalidar queries relacionadas
      queryClient.invalidateQueries(['/api/professor/students']);
      
      // Voltar para o modo de busca
      setManagementMode('search');
      setIsEditing(false);
      setSelectedStudent(null);
      
    } catch (error) {
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar as alterações. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  // lessonPlans now comes from React Query (lessons data)
  const [newLessonPlan, setNewLessonPlan] = useState({
    title: "",
    date: "",
    objectives: "",
    content: "",
    materials: "",
    methodology: "",
    evaluation: "",
    competencies: []
  });
  const [selectedLessonPlan, setSelectedLessonPlan] = useState(null);
  
  const [reminders, setReminders] = useState([]);

  // Carrega dados do professor baseado no telefone logado
  useEffect(() => {
    const phoneNumber = localStorage.getItem("userPhone");
    if (phoneNumber) {
      // Professor data is already loaded from localStorage
      // Additional professor data would be fetched here if needed
    }
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    toast({
      title: "Logout realizado",
      description: "Você foi desconectado com sucesso.",
    });
    setTimeout(() => {
      setLocation("/");
    }, 1000);
  };

  const saveAttendanceMutation = useMutation({
    mutationFn: (attendanceData: any) => 
      apiRequest('/api/professor/attendance', {
        method: 'POST',
        body: JSON.stringify(attendanceData)
      }),
    onSuccess: () => {
      toast({
        title: "Presença salva",
        description: "Registro de presença foi salvo com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/professor/attendance'] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao salvar presença",
        description: error.message || "Tente novamente",
        variant: "destructive"
      });
    }
  });





  const handleSaveAttendance = () => {
    if (!selectedClassForAttendance || !attendanceDate) {
      toast({
        title: "Dados incompletos",
        description: "Selecione a turma e a data",
        variant: "destructive"
      });
      return;
    }

    const attendanceData = {
      professorId: professorData.id,
      classId: parseInt(selectedClassForAttendance),
      date: attendanceDate,
      attendance: Object.entries(attendanceRecords).map(([studentCpf, status]) => ({
        studentCpf,
        status
      }))
    };

    saveAttendanceMutation.mutate(attendanceData);
  };

  // Funções auxiliares para responsáveis legais
  const formatCPFGuardian = (cpf) => {
    const cleaned = cpf.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{0,3})(\d{0,3})(\d{0,3})(\d{0,2})$/);
    if (match) {
      return !match[2] ? match[1] : '' + match[1] + (match[2] ? '.' + match[2] : '') + (match[3] ? '.' + match[3] : '') + (match[4] ? '-' + match[4] : '');
    }
    return cpf;
  };

  const validateCPFGuardian = (cpf) => {
    const cleaned = cpf.replace(/\D/g, '');
    if (cleaned.length !== 11) return { isValid: false, error: 'CPF deve ter 11 dígitos' };
    if (/^(\d)\1+$/.test(cleaned)) return { isValid: false, error: 'CPF inválido' };
    
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cleaned.charAt(i)) * (10 - i);
    }
    let remainder = 11 - (sum % 11);
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cleaned.charAt(9))) return { isValid: false, error: 'CPF inválido' };
    
    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cleaned.charAt(i)) * (11 - i);
    }
    remainder = 11 - (sum % 11);
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cleaned.charAt(10))) return { isValid: false, error: 'CPF inválido' };
    
    return { isValid: true };
  };

  const handleGuardianChange = (field, value) => {
    if (field === 'cpf') {
      value = formatCPFGuardian(value);
    }
    
    setCurrentGuardian(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addGuardian = () => {
    // Validar dados do responsável
    const errors = {};
    
    if (!currentGuardian.fullName.trim()) {
      errors.fullName = 'Nome completo é obrigatório';
    }
    
    if (!currentGuardian.relationship) {
      errors.relationship = 'Tipo de vínculo é obrigatório';
    }
    
    if (!currentGuardian.cpf) {
      errors.cpf = 'CPF é obrigatório';
    } else {
      const cpfValidation = validateCPFGuardian(currentGuardian.cpf);
      if (!cpfValidation.isValid) {
        errors.cpf = cpfValidation.error;
      }
    }
    
    // Verificar se CPF já existe
    const existingGuardian = guardians.find(g => g.cpf.replace(/\D/g, '') === currentGuardian.cpf.replace(/\D/g, ''));
    if (existingGuardian && editingGuardianIndex === -1) {
      errors.cpf = 'CPF já cadastrado para outro responsável';
    }
    
    // Verificar se CPF é igual ao do aluno
    if (studentFormData.cpf && currentGuardian.cpf.replace(/\D/g, '') === studentFormData.cpf.replace(/\D/g, '')) {
      errors.cpf = 'CPF do responsável não pode ser igual ao CPF do aluno';
    }
    
    if (Object.keys(errors).length > 0) {
      setStudentFormErrors(errors);
      return;
    }
    
    // Adicionar ou editar responsável
    const guardianData = { 
      ...currentGuardian,
      studentCpf: studentFormData.cpf,
      isPrincipalResponsible: currentGuardian.relationship === 'pai' || currentGuardian.relationship === 'mae' || currentGuardian.isPrincipalResponsible
    };
    
    if (editingGuardianIndex >= 0) {
      const updatedGuardians = [...guardians];
      updatedGuardians[editingGuardianIndex] = guardianData;
      setGuardians(updatedGuardians);
    } else {
      setGuardians(prev => [...prev, guardianData]);
    }
    
    // Resetar formulário
    resetGuardianForm();
  };

  const removeGuardian = (index) => {
    setGuardians(prev => prev.filter((_, i) => i !== index));
  };

  const editGuardian = (index) => {
    setCurrentGuardian(guardians[index]);
    setEditingGuardianIndex(index);
    setShowGuardianForm(true);
  };

  const resetGuardianForm = () => {
    setCurrentGuardian({
      cpf: "",
      fullName: "",
      relationship: "",
      birthDate: "",
      profession: "",
      phone: "",
      whatsapp: "",
      email: "",
      isPrincipalResponsible: false,
      isEmergencyContact: false,
      observations: "",
      sameAddressAsStudent: true,
      street: "",
      number: "",
      complement: "",
      neighborhood: "",
      city: "",
      state: "",
      zipCode: "",
      country: "Brasil",
      googlePlaceId: "",
      latitude: "",
      longitude: ""
    });
    setEditingGuardianIndex(-1);
    setShowGuardianForm(false);
    setStudentFormErrors({});
  };

  // Funções para Google Maps (simuladas por agora)
  const handleAddressSearch = async (query) => {
    // Simulação de busca de endereços
    if (query.length > 3) {
      const mockSuggestions = [
        {
          description: `${query}, São Paulo, SP, Brasil`,
          place_id: 'mock_place_1',
          structured_formatting: {
            main_text: query,
            secondary_text: 'São Paulo, SP, Brasil'
          }
        }
      ];
      setAddressSuggestions(mockSuggestions);
    } else {
      setAddressSuggestions([]);
    }
  };

  const selectAddress = (address) => {
    setSelectedAddress(address);
    setAddressSuggestions([]);
    
    // Preencher campos de endereço automaticamente
    const addressData = {
      street: address.structured_formatting.main_text,
      neighborhood: 'Centro', // Mock
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01000-000', // Mock
      googlePlaceId: address.place_id,
      latitude: -23.5505, // Mock
      longitude: -46.6333 // Mock
    };
    
    if (showGuardianForm && !currentGuardian.sameAddressAsStudent) {
      setCurrentGuardian(prev => ({ ...prev, ...addressData }));
    } else {
      setStudentFormData(prev => ({ ...prev, ...addressData }));
    }
  };

  const handleSaveLesson = () => {
    if (!newLesson.description) {
      toast({
        title: "Erro",
        description: "Descrição da aula é obrigatória.",
        variant: "destructive",
      });
      return;
    }

    const lessonData = {
      title: newLesson.description,
      description: newLesson.description,
      date: newLesson.date,
      competencies: newLesson.competencies,
      classId: null, // Could be set if we had a class selected
      startTime: '08:00',
      endTime: '09:00',
      materials: '',
      status: 'completed'
    };

    createLessonMutation.mutate(lessonData);
    setNewLesson({
      description: "",
      competencies: [],
      date: new Date().toISOString().split('T')[0]
    });
  };

  const handleAddObservation = () => {
    if (!newObservation.studentCpf || !newObservation.text) {
      toast({
        title: "Erro",
        description: "Aluno e observação são obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    const observationData = {
      studentCpf: newObservation.studentCpf,
      observation: newObservation.text,
      progress: newObservation.progress,
      date: new Date().toISOString().split('T')[0],
      competencies: []
    };

    createObservationMutation.mutate(observationData);
    setNewObservation({
      studentCpf: "",
      text: "",
      progress: ""
    });
  };

  const handleAddReminder = () => {
    if (!newReminder.title || !newReminder.date) {
      toast({
        title: "Erro",
        description: "Título e data são obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    const eventData = {
      title: newReminder.title,
      type: 'lembrete',
      date: newReminder.date,
      startTime: newReminder.time || '08:00',
      endTime: newReminder.time || '09:00',
      description: '',
      location: '',
      isReminder: true,
      reminderMinutes: 30
    };

    createEventMutation.mutate(eventData);
    setNewReminder({
      title: "",
      date: "",
      time: ""
    });
    setShowReminderModal(false);
  };

  const handleDeleteEvent = () => {
    if (eventToDelete) {
      deleteEventMutation.mutate(eventToDelete.id);
      setShowDeleteConfirmModal(false);
      setEventToDelete(null);
    }
  };

  const handleGenerateReport = () => {
    toast({
      title: "Relatório gerado",
      description: "Relatório foi gerado com sucesso.",
    });
  };

  const handleSaveProfile = async () => {
    try {
      // Salvar no banco de dados
      const response = await apiRequest(`/api/professor/profile/${professorData.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: professorData.name,
          email: professorData.email
        })
      });

      // Atualizar localStorage também
      localStorage.setItem('professorData', JSON.stringify(professorData));
      
      toast({
        title: "Perfil atualizado",
        description: "Suas informações foram salvas com sucesso no banco de dados.",
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível salvar as alterações. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleAddEvent = () => {
    if (!newEvent.title || !newEvent.date) {
      toast({
        title: "Erro",
        description: "Título e data são obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    const eventData = {
      title: newEvent.title,
      type: newEvent.type || 'evento',
      date: newEvent.date,
      startTime: newEvent.time || '08:00',
      endTime: newEvent.time || '09:00',
      description: newEvent.description || '',
      location: '',
      isReminder: false,
      reminderMinutes: 0
    };

    createEventMutation.mutate(eventData);
    setNewEvent({
      title: "",
      date: "",
      time: "",
      type: "evento",
      description: ""
    });
    setShowEventModal(false);
  };

  const handleSaveLessonPlan = () => {
    if (!newLessonPlan.title || !newLessonPlan.date) {
      toast({
        title: "Erro",
        description: "Título e data são obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    const lessonData = {
      title: newLessonPlan.title,
      description: `${newLessonPlan.objectives}\n${newLessonPlan.content}`,
      date: newLessonPlan.date,
      competencies: newLessonPlan.competencies,
      materials: newLessonPlan.materials,
      classId: null,
      startTime: '08:00',
      endTime: '09:00',
      status: 'planned'
    };

    createLessonMutation.mutate(lessonData);
    setNewLessonPlan({
      title: "",
      date: "",
      objectives: "",
      content: "",
      materials: "",
      methodology: "",
      evaluation: "",
      competencies: []
    });
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    const current = new Date(startDate);
    
    for (let i = 0; i < 42; i++) { // 6 weeks * 7 days
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    return days;
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('pt-BR');
  };

  const getEventsForDate = (date) => {
    const dateString = date.toISOString().split('T')[0];
    return calendarEvents.filter(event => event.data === dateString);
  };

  // Funções apenas para LÍDERES
  const leaderOnlyItems = [
    { id: "criar-turma", label: "Criar Nova Turma", icon: Users },
    { id: "relatorios", label: "Gerar Relatórios", icon: Download }
  ];

  // Funções disponíveis para TODOS os professores
  const allProfessorsItems = [
    { id: "dashboard", label: "Dashboard", icon: BarChart },
    { id: "registrar-aluno", label: "Alunos", icon: UserPlus },
    { id: "chamada", label: "Fazer Chamada", icon: Clock },
    { id: "aula", label: "Registrar Aula", icon: FileText },
    { id: "calendario-eventos", label: "Calendário e Eventos", icon: Calendar },
    { id: "plano-aulas", label: "Plano de Aulas", icon: BookOpen },
    { id: "acompanhamento", label: "Acompanhamento", icon: Eye },
    { id: "configuracoes", label: "Configurações", icon: Settings }
  ];

  // Menu dinâmico baseado no tipo de professor
  const menuItems = isLeader 
    ? [...allProfessorsItems, ...leaderOnlyItems]
    : allProfessorsItems;

  const mobileMenuItems = [
    { id: "dashboard", label: "Início", icon: BarChart },
    { id: "registrar-aluno", label: "Alunos", icon: UserPlus },
    { id: "chamada", label: "Chamada", icon: Clock },
    { id: "mais", label: "Mais", icon: MoreHorizontal }
  ];

  // Menu "Mais" dinâmico baseado no tipo de professor
  const moreMenuItems = [
    ...(isLeader ? [{ id: "criar-turma", label: "Criar Nova Turma", icon: Users }] : []),
    { id: "aula", label: "Registrar Aula", icon: FileText },
    { id: "calendario-eventos", label: "Calendário e Eventos", icon: Calendar },
    { id: "plano-aulas", label: "Plano de Aulas", icon: BookOpen },
    { id: "acompanhamento", label: "Acompanhamento", icon: Eye },
    ...(isLeader ? [{ id: "relatorios", label: "Gerar Relatórios", icon: Download }] : []),
    { id: "configuracoes", label: "Configurações", icon: Settings }
  ];

  const EmptyState = ({ icon: Icon, title, description, action }) => (
    <div className="text-center py-12">
      <Icon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 mb-4">{description}</p>
      {action}
    </div>
  );

  const renderContent = () => {
    switch (activeSection) {
      case "dashboard":
        return (
          <div className="space-y-6">
            {/* Saudação com tipo de professor - Oculta em mobile */}
            <div className="hidden md:block bg-white rounded-lg p-6 shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    Olá, Prof. {
                      // Só mostra nome se for professor/líder
                      (localStorage.getItem('userPapel') === 'professor' || localStorage.getItem('userPapel') === 'lider') 
                        ? (localStorage.getItem('userName') || currentUser?.nome || professorData.name || 'Professor')
                        : 'Professor'
                    }
                  </h1>
                  <p className="text-gray-600 mt-1">Bem-vindo ao seu painel de controle</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge 
                    variant={isLeader ? "default" : "secondary"}
                    className={`px-3 py-1 text-sm font-medium ${
                      isLeader 
                        ? "bg-blue-100 text-blue-800 border-blue-200" 
                        : "bg-gray-100 text-gray-800 border-gray-200"
                    }`}
                  >
                    {isLeader ? "👑 Líder" : "📚 Professor"}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Cards Dashboard - Mobile Otimizado */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-6">
              {/* Card 1 - Total de Alunos Registrados */}
              <Card className="bg-white border-green-200 shadow-sm">
                <CardHeader className="pb-2 px-4 md:pb-3 md:px-6">
                  <CardTitle className="flex items-center gap-2 md:gap-3 text-base md:text-lg text-gray-800">
                    <div className="p-1.5 md:p-2 bg-green-100 rounded-lg">
                      <Users className="w-4 h-4 md:w-5 md:h-5 text-green-600" />
                    </div>
                    <span className="leading-tight">Total de Alunos</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 md:px-6">
                  <div className="space-y-2 md:space-y-3">
                    <div className="text-2xl md:text-3xl font-bold text-green-600">{students.length}</div>
                    <p className="text-xs md:text-sm text-gray-600">alunos cadastrados</p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      <span>Ativos</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Card 2 - Total de Turmas Criadas */}
              <Card className="bg-white border-blue-200 shadow-sm">
                <CardHeader className="pb-2 px-4 md:pb-3 md:px-6">
                  <CardTitle className="flex items-center gap-2 md:gap-3 text-base md:text-lg text-gray-800">
                    <div className="p-1.5 md:p-2 bg-blue-100 rounded-lg">
                      <Users className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
                    </div>
                    <span className="leading-tight">Total de Turmas</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 md:px-6">
                  <div className="space-y-2">
                    <div className="text-2xl md:text-3xl font-bold text-blue-600">{classes.length}</div>
                    <p className="text-xs md:text-sm text-gray-600">turmas criadas</p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                      <span>Ativas</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Card 3 - Aulas Registradas no Mês */}
              <Card className="bg-white border-orange-200 shadow-sm">
                <CardHeader className="pb-2 px-4 md:pb-3 md:px-6">
                  <CardTitle className="flex items-center gap-2 md:gap-3 text-base md:text-lg text-gray-800">
                    <div className="p-1.5 md:p-2 bg-orange-100 rounded-lg">
                      <BookOpen className="w-4 h-4 md:w-5 md:h-5 text-orange-600" />
                    </div>
                    <span className="leading-tight">Aulas do Mês</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 md:px-6">
                  <div className="space-y-2">
                    <div className="text-2xl md:text-3xl font-bold text-orange-600">{lessons.length}</div>
                    <p className="text-xs md:text-sm text-gray-600">aulas registradas</p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                      <span>Este mês</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Card 4 - Chamadas Feitas */}
              <Card className="bg-white border-purple-200 shadow-sm">
                <CardHeader className="pb-2 px-4 md:pb-3 md:px-6">
                  <CardTitle className="flex items-center gap-2 md:gap-3 text-base md:text-lg text-gray-800">
                    <div className="p-1.5 md:p-2 bg-purple-100 rounded-lg">
                      <Clock className="w-4 h-4 md:w-5 md:h-5 text-purple-600" />
                    </div>
                    <span className="leading-tight">Chamadas Feitas</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 md:px-6">
                  <div className="space-y-2">
                    <div className="text-2xl md:text-3xl font-bold text-purple-600">
                      {Array.isArray(attendanceHistory) ? attendanceHistory.length : 0}
                    </div>
                    <p className="text-xs md:text-sm text-gray-600">chamadas realizadas</p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                      <span>Total</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Card adicional - Últimos Acompanhamentos */}
            <Card className="bg-white border-gray-200 shadow-sm">
              <CardHeader className="pb-2 px-4 md:pb-3 md:px-6">
                <CardTitle className="flex items-center gap-2 md:gap-3 text-base md:text-lg text-gray-800">
                  <div className="p-1.5 md:p-2 bg-gray-100 rounded-lg">
                    <Eye className="w-4 h-4 md:w-5 md:h-5 text-gray-600" />
                  </div>
                  <span className="leading-tight">Acompanhamentos</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 md:px-6">
                <div className="space-y-2">
                  {observations && observations.length > 0 ? (
                    <div>
                      <div className="text-2xl font-bold text-gray-600">{observations.length}</div>
                      <p className="text-sm text-gray-600">acompanhamentos registrados</p>
                      <div className="mt-3 space-y-2">
                        {observations.slice(0, 3).map((obs: any, index: number) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded text-xs">
                            <span className="font-medium">{obs.studentName}</span>
                            <span className="text-gray-500">{new Date(obs.date).toLocaleDateString('pt-BR')}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-sm text-gray-500">Nenhum acompanhamento registrado</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>


          </div>
        );
        
      case "criar-turma":
        if (!isLeader) {
          return (
            <div className="text-center py-16 space-y-4">
              <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mx-auto">
                <Users className="w-12 h-12 text-red-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Acesso Restrito</h3>
              <p className="text-gray-600 max-w-md mx-auto">
                Apenas líderes podem criar novas turmas. Entre em contato com um líder para solicitar a criação de turmas.
              </p>
              <div className="flex flex-col items-center gap-2">
                <Badge variant="outline" className="text-red-600 border-red-200">
                  👤 Professor: Permissão Negada
                </Badge>
                <p className="text-sm text-gray-500">
                  Tipo de acesso necessário: <strong>Líder</strong>
                </p>
              </div>
            </div>
          );
        }
        return (
          <div className="space-y-4 md:space-y-6">
            <Card>
              <CardHeader className="px-4 md:px-6">
                <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                  <Users className="w-5 h-5 md:w-6 md:h-6" />
                  Criar Nova Turma
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 md:px-6">
                <div className="space-y-3 md:space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                    <div>
                      <Label htmlFor="turma-nome" className="text-sm font-medium">Nome da Turma *</Label>
                      <Input
                        id="turma-nome"
                        placeholder="Ex: Turma A - Manhã"
                        value={classFormData.name}
                        onChange={(e) => setClassFormData({...classFormData, name: e.target.value})}
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="turma-turno">Turno</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o turno" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="manha">Manhã</SelectItem>
                          <SelectItem value="tarde">Tarde</SelectItem>
                          <SelectItem value="noite">Noite</SelectItem>
                          <SelectItem value="integral">Integral</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="turma-capacidade" className="text-sm font-medium">Capacidade Máxima</Label>
                      <Input
                        id="turma-capacidade"
                        type="number"
                        placeholder="Ex: 30"
                        value={classFormData.maxStudents}
                        onChange={(e) => setClassFormData({...classFormData, maxStudents: parseInt(e.target.value) || 30})}
                        className="mt-1 h-10 text-sm md:text-base"
                      />
                    </div>
                    <div>
                      <Label htmlFor="turma-ano" className="text-sm font-medium">Ano Letivo</Label>
                      <Input
                        id="turma-ano"
                        type="number"
                        placeholder="2024"
                        value={new Date().getFullYear()}
                        className="mt-1 h-10 text-sm md:text-base"
                      />
                    </div>
                    <div>
                      <Label htmlFor="turma-sala" className="text-sm font-medium">Sala</Label>
                      <Input
                        id="turma-sala"
                        placeholder="Ex: Sala 101"
                        className="mt-1 h-10 text-sm md:text-base"
                      />
                    </div>
                  </div>
                  
                  {/* Seleção de Professor Responsável */}
                  <div>
                    <Label htmlFor="turma-professor" className="text-sm font-medium">
                      Professor Responsável *
                      <Badge variant="outline" className="ml-2 text-xs">
                        {isLeader ? "👑 Designar Professor" : "📚 Apenas Líder"}
                      </Badge>
                    </Label>
                    <Select 
                      value={classFormData.professorId?.toString() || ''}
                      onValueChange={(value) => setClassFormData({...classFormData, professorId: parseInt(value)})}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Selecione o professor responsável" />
                      </SelectTrigger>
                      <SelectContent>
                        {loadingProfessores ? (
                          <SelectItem value="loading" disabled>Carregando professores...</SelectItem>
                        ) : !Array.isArray(professoresDisponiveis) || professoresDisponiveis.length === 0 ? (
                          <SelectItem value="empty" disabled>Nenhum professor encontrado</SelectItem>
                        ) : (
                          professoresDisponiveis.map((professor: any) => (
                            <SelectItem key={professor.id} value={professor.id.toString()}>
                              {professor.nome} ({professor.cpf})
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500 mt-1">
                      O professor designado terá acesso completo a esta turma
                    </p>
                  </div>
                  
                  <div>
                    <Label htmlFor="turma-descricao" className="text-sm font-medium">Descrição</Label>
                    <Textarea
                      id="turma-descricao"
                      placeholder="Descrição da turma, objetivos, observações..."
                      rows={3}
                      value={classFormData.description}
                      onChange={(e) => setClassFormData({...classFormData, description: e.target.value})}
                      className="mt-1 text-sm md:text-base"
                    />
                  </div>
                  
                  {/* Seção de Seleção de Alunos */}
                  <div className="space-y-3">
                    <Label>Alunos da Turma (Opcional)</Label>
                    <p className="text-sm text-gray-600">Selecione os alunos que farão parte desta turma. Você também pode adicionar alunos posteriormente.</p>
                    
                    {/* Campo de busca de alunos */}
                    {students && students.length > 0 && (
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          placeholder="Buscar por nome ou CPF..."
                          value={studentSearchTerm}
                          onChange={(e) => setStudentSearchTerm(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    )}
                    
                    {studentsLoading ? (
                      <div className="flex items-center justify-center py-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-yellow-600"></div>
                      </div>
                    ) : students && students.length > 0 ? (
                      <div className="border rounded-lg p-4 max-h-60 overflow-y-auto">
                        <div className="space-y-2">
                          {(studentSearchTerm ? 
                            students.filter(student => {
                              const searchLower = studentSearchTerm.toLowerCase();
                              return (
                                (student.fullName || student.nome_completo || '').toLowerCase().includes(searchLower) ||
                                student.cpf.includes(studentSearchTerm)
                              );
                            }) : students
                          ).map((student) => (
                            <label
                              key={student.cpf}
                              className="flex items-center space-x-3 p-2 rounded hover:bg-gray-50 cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                className="rounded border-gray-300 text-yellow-600 focus:ring-yellow-500"
                                checked={selectedStudentsForClass.includes(student.cpf)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedStudentsForClass([...selectedStudentsForClass, student.cpf]);
                                  } else {
                                    setSelectedStudentsForClass(selectedStudentsForClass.filter(cpf => cpf !== student.cpf));
                                  }
                                }}
                              />
                              <div className="flex-1">
                                <p className="font-medium text-sm">{student.fullName || student.nome_completo}</p>
                                <p className="text-xs text-gray-500">
                                  CPF: {student.cpf} | {student.currentGrade || 'Não informado'}
                                </p>
                              </div>
                            </label>
                          ))}
                        </div>
                        
                        {selectedStudentsForClass.length > 0 && (
                          <div className="mt-3 pt-3 border-t">
                            <p className="text-sm text-gray-700">
                              <strong>{selectedStudentsForClass.length}</strong> aluno(s) selecionado(s)
                            </p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-gray-500">
                        <Users className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                        <p className="text-sm">Nenhum aluno cadastrado ainda</p>
                        <p className="text-xs mt-1">Registre alunos primeiro para adicioná-los à turma</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-3">
                    <Label>Horários das Aulas</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="horario-inicio">Horário de Início</Label>
                        <Input
                          id="horario-inicio"
                          type="time"
                        />
                      </div>
                      <div>
                        <Label htmlFor="horario-fim">Horário de Término</Label>
                        <Input
                          id="horario-fim"
                          type="time"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-end space-x-3 pt-4">
                    <Button 
                      variant="outline"
                      onClick={() => {
                        setClassFormData({
                          name: "",
                          description: "",
                          maxStudents: 30,
                          startDate: "",
                          endDate: "",
                          schedule: "",
                          room: ""
                        });
                        setSelectedStudentsForClass([]);
                        setActiveSection("dashboard");
                      }}
                    >
                      <X className="w-4 h-4 mr-2" />
                      Cancelar
                    </Button>
                    <Button 
                      className="btn-yellow"
                      onClick={async () => {
                        try {
                          if (!classFormData.name) {
                            toast({
                              title: "Erro",
                              description: "Nome da turma é obrigatório",
                              variant: "destructive",
                            });
                            return;
                          }
                          
                          const newClass = await createClassMutation.mutateAsync({
                            nome: classFormData.name,
                            descricao: classFormData.description,
                            professorId: professorData.id,
                            maxAlunos: classFormData.maxStudents,
                            dataInicio: classFormData.startDate,
                            dataFim: classFormData.endDate,
                            horarios: classFormData.schedule,
                            sala: classFormData.room
                          });

                          // Matricular alunos selecionados na nova turma
                          for (const studentCpf of selectedStudentsForClass) {
                            await enrollStudentMutation.mutateAsync({
                              alunoCpf: studentCpf,
                              turmaId: newClass.id
                            });
                          }
                          
                          // Resetar formulário
                          setClassFormData({
                            name: "",
                            description: "",
                            maxStudents: 30,
                            startDate: "",
                            endDate: "",
                            schedule: "",
                            room: ""
                          });
                          setSelectedStudentsForClass([]);
                          setStudentSearchTerm("");
                          
                          toast({
                            title: "Turma criada com sucesso!",
                            description: `Turma criada com ${selectedStudentsForClass.length} alunos matriculados.`,
                          });
                          
                          setActiveSection("dashboard");
                          
                        } catch (error) {
                          console.error("Erro ao criar turma:", error);
                        }
                      }}
                      disabled={createClassMutation.isPending}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      {createClassMutation.isPending ? "Criando..." : "Criar Turma"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Lista de Turmas Criadas */}
            {classes && classes.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Users className="w-6 h-6" />
                    Turmas Criadas ({classes.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {classes.map((turma) => (
                      <div key={turma.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg text-gray-900">{turma.nome}</h3>
                            <p className="text-sm text-gray-600">{turma.descricao}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                              {turma.students?.length || 0} alunos
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedClassForManagement(turma);
                                setShowClassManagement(true);
                                setManagementSearchTerm("");
                                setSelectedStudentsToAdd([]);
                              }}
                            >
                              <Settings className="w-4 h-4 mr-1" />
                              Gerenciar
                            </Button>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">Capacidade:</span>
                            <p className="font-medium">{turma.maxAlunos} alunos</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Sala:</span>
                            <p className="font-medium">{turma.sala || "Não definida"}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Horários:</span>
                            <p className="font-medium">{turma.horarios || "Não definido"}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Período:</span>
                            <p className="font-medium">
                              {turma.dataInicio ? new Date(turma.dataInicio).toLocaleDateString('pt-BR') : "Não definido"}
                            </p>
                          </div>
                        </div>

                        {/* Lista de alunos da turma */}
                        {turma.students && turma.students.length > 0 && (
                          <div className="mt-4 pt-4 border-t">
                            <h4 className="font-medium text-gray-900 mb-2">Alunos matriculados:</h4>
                            <div className="flex flex-wrap gap-2">
                              {turma.students.slice(0, 5).map((student) => (
                                <span key={student.cpf} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                                  {student.fullName}
                                </span>
                              ))}
                              {turma.students.length > 5 && (
                                <span className="text-xs text-gray-500">
                                  +{turma.students.length - 5} mais
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Modal de Gerenciamento de Turma */}
            {showClassManagement && (
              <Dialog open={showClassManagement} onOpenChange={setShowClassManagement}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Settings className="w-5 h-5" />
                      Gerenciar Turma: {selectedClassForManagement?.nome}
                    </DialogTitle>
                  </DialogHeader>
                  
                  <div className="flex-1 overflow-y-auto space-y-6">
                    {/* Informações da Turma */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="font-semibold mb-2">Informações da Turma</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Capacidade:</span>
                          <p className="font-medium">{selectedClassForManagement?.maxAlunos} alunos</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Matriculados:</span>
                          <p className="font-medium">{selectedClassForManagement?.students?.length || 0} alunos</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Sala:</span>
                          <p className="font-medium">{selectedClassForManagement?.sala || "Não definida"}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Horários:</span>
                          <p className="font-medium">{selectedClassForManagement?.horarios || "Não definido"}</p>
                        </div>
                      </div>
                    </div>

                    {/* Alunos Matriculados */}
                    <div>
                      <h3 className="font-semibold mb-3">Alunos Matriculados ({selectedClassForManagement?.students?.length || 0})</h3>
                      {selectedClassForManagement?.students && selectedClassForManagement.students.length > 0 ? (
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {selectedClassForManagement.students.map((student) => (
                            <div key={student.cpf} className="flex items-center justify-between p-3 border rounded-lg bg-white">
                              <div className="flex items-center gap-3">
                                <Avatar className="w-8 h-8">
                                  <AvatarFallback className="text-xs">
                                    {(student.fullName || student.nome_completo || 'AA').split(' ').map(n => n[0]).join('').substring(0, 2)}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium text-sm">{student.fullName || student.nome_completo}</p>
                                  <p className="text-xs text-gray-500">CPF: {student.cpf}</p>
                                </div>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={async () => {
                                  if (confirm(`Remover ${student.fullName} da turma?`)) {
                                    await unenrollStudentMutation.mutateAsync({
                                      studentCpf: student.cpf,
                                      classId: selectedClassForManagement.id
                                    });
                                    // Atualizar a turma selecionada
                                    setSelectedClassForManagement(prev => ({
                                      ...prev,
                                      students: prev.students.filter(s => s.cpf !== student.cpf)
                                    }));
                                  }
                                }}
                                disabled={unenrollStudentMutation.isPending}
                              >
                                <X className="w-4 h-4" />
                                Remover
                              </Button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-center py-4">Nenhum aluno matriculado nesta turma</p>
                      )}
                    </div>

                    {/* Adicionar Novos Alunos */}
                    <div>
                      <h3 className="font-semibold mb-3">Adicionar Novos Alunos</h3>
                      
                      {/* Campo de busca */}
                      <div className="relative mb-4">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          placeholder="Buscar alunos por nome ou CPF..."
                          value={managementSearchTerm}
                          onChange={(e) => setManagementSearchTerm(e.target.value)}
                          className="pl-10"
                        />
                      </div>

                      {/* Lista de alunos disponíveis */}
                      <div className="max-h-48 overflow-y-auto space-y-2">
                        {students && students.filter(student => {
                          const searchLower = managementSearchTerm.toLowerCase();
                          const matchesSearch = (student.fullName || student.nome_completo || '').toLowerCase().includes(searchLower) ||
                                               student.cpf.replace(/\D/g, '').includes(searchLower.replace(/\D/g, ''));
                          
                          const isNotEnrolled = !selectedClassForManagement?.students?.some(s => s.cpf === student.cpf);
                          
                          return matchesSearch && isNotEnrolled;
                        }).map((student) => (
                          <div key={student.cpf} className="flex items-center justify-between p-3 border rounded-lg bg-white">
                            <div className="flex items-center gap-3">
                              <Avatar className="w-8 h-8">
                                <AvatarFallback className="text-xs">
                                  {(student.fullName || student.nome_completo || 'AA').split(' ').map(n => n[0]).join('').substring(0, 2)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium text-sm">{student.fullName || student.nome_completo}</p>
                                <p className="text-xs text-gray-500">CPF: {student.cpf}</p>
                                <p className="text-xs text-gray-500">
                                  Nascimento: {student.birthDate ? new Date(student.birthDate).toLocaleDateString('pt-BR') : 'Não informado'}
                                </p>
                              </div>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={async () => {
                                await enrollStudentMutation.mutateAsync({
                                  alunoCpf: student.cpf,
                                  turmaId: selectedClassForManagement.id
                                });
                                // Atualizar a turma selecionada
                                setSelectedClassForManagement(prev => ({
                                  ...prev,
                                  students: [...(prev.students || []), student]
                                }));
                              }}
                              disabled={enrollStudentMutation.isPending}
                            >
                              <Plus className="w-4 h-4 mr-1" />
                              Adicionar
                            </Button>
                          </div>
                        ))}
                      </div>

                      {students && students.filter(student => {
                        const searchLower = managementSearchTerm.toLowerCase();
                        const matchesSearch = (student.fullName || student.nome_completo || '').toLowerCase().includes(searchLower) ||
                                             student.cpf.replace(/\D/g, '').includes(searchLower.replace(/\D/g, ''));
                        
                        const isNotEnrolled = !selectedClassForManagement?.students?.some(s => s.cpf === student.cpf);
                        
                        return matchesSearch && isNotEnrolled;
                      }).length === 0 && (
                        <p className="text-gray-500 text-center py-4">
                          {managementSearchTerm ? "Nenhum aluno encontrado com essa busca" : "Todos os alunos já estão matriculados nesta turma"}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-4 border-t">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowClassManagement(false);
                        setSelectedClassForManagement(null);
                        setManagementSearchTerm("");
                      }}
                    >
                      Fechar
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        );

      case "chamada":
        return (
          <div className="space-y-6">
            <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Clock className="w-6 h-6" />
                Sistema de Chamadas
              </CardTitle>
              
              {/* Abas */}
              <div className="flex space-x-1 border-b">
                <button
                  onClick={() => setChamadaTab("fazer")}
                  className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                    chamadaTab === "fazer"
                      ? "bg-yellow-500 text-white border-b-2 border-yellow-500"
                      : "text-gray-600 hover:text-gray-800 hover:bg-gray-100"
                  }`}
                >
                  <Clock className="w-4 h-4 inline mr-2" />
                  Fazer Chamada
                </button>
                <button
                  onClick={() => setChamadaTab("historico")}
                  className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                    chamadaTab === "historico"
                      ? "bg-yellow-500 text-white border-b-2 border-yellow-500"
                      : "text-gray-600 hover:text-gray-800 hover:bg-gray-100"
                  }`}
                >
                  <FileText className="w-4 h-4 inline mr-2" />
                  Histórico
                </button>
              </div>

              {chamadaTab === "fazer" && (
                <div className="flex items-center gap-4 pt-4">
                  <Label htmlFor="attendance-date">Data:</Label>
                  <Input
                    id="attendance-date"
                    type="date"
                    value={attendanceDate}
                    onChange={(e) => setAttendanceDate(e.target.value)}
                    className="w-48"
                  />
                </div>
              )}
            </CardHeader>
            <CardContent>
              {chamadaTab === "fazer" ? (
                classesLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-600"></div>
                  </div>
                ) : classes && classes.length > 0 ? (
                <div className="space-y-4">
                  <div className="mb-4">
                    <Label htmlFor="select-class">Selecionar Turma:</Label>
                    <Select value={selectedClassForAttendance} onValueChange={setSelectedClassForAttendance}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Escolha uma turma para fazer a chamada" />
                      </SelectTrigger>
                      <SelectContent>
                        {classes.map((turma) => (
                          <SelectItem key={turma.id} value={turma.id.toString()}>
                            {turma.nome} ({turma.maxAlunos} alunos max)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Lista de alunos para chamada */}
                  {selectedClassForAttendance && (
                    <div className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-lg">Lista de Presença</h3>
                        <div className="text-sm text-gray-600">
                          Data: {new Date(attendanceDate).toLocaleDateString('pt-BR')}
                        </div>
                      </div>

                      {enrolledStudentsLoading ? (
                        <div className="flex items-center justify-center py-4">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-yellow-600"></div>
                        </div>
                      ) : enrolledStudents && enrolledStudents.length > 0 ? (
                        <div className="space-y-3">
                          {enrolledStudents.map((student) => (
                            <div key={student.cpf} className="flex items-center justify-between p-3 border rounded-lg">
                              <div className="flex-1">
                                <p className="font-medium">{student.nome_completo || student.fullName}</p>
                                <p className="text-sm text-gray-600">CPF: {student.cpf}</p>
                              </div>
                              <div className="flex items-center space-x-2">
                                <label className="flex items-center space-x-2 cursor-pointer">
                                  <input
                                    type="radio"
                                    name={`attendance-${student.cpf}`}
                                    value="presente"
                                    checked={attendanceData[student.cpf] === 'presente'}
                                    onChange={() => setAttendanceData({
                                      ...attendanceData,
                                      [student.cpf]: 'presente'
                                    })}
                                    className="text-green-600"
                                  />
                                  <span className="text-green-600 font-medium">Presente</span>
                                </label>
                                <label className="flex items-center space-x-2 cursor-pointer">
                                  <input
                                    type="radio"
                                    name={`attendance-${student.cpf}`}
                                    value="ausente"
                                    checked={attendanceData[student.cpf] === 'ausente'}
                                    onChange={() => setAttendanceData({
                                      ...attendanceData,
                                      [student.cpf]: 'ausente'
                                    })}
                                    className="text-red-600"
                                  />
                                  <span className="text-red-600 font-medium">Ausente</span>
                                </label>
                              </div>
                            </div>
                          ))}

                          <div className="flex justify-between items-center pt-4 border-t">
                            <div className="text-sm text-gray-600">
                              Total de alunos: {enrolledStudents.length}
                            </div>
                            <Button 
                              className="btn-yellow"
                              onClick={() => {
                                const attendanceRecords = Object.entries(attendanceData).map(([cpf, status]) => ({
                                  studentCpf: cpf,
                                  classId: parseInt(selectedClassForAttendance),
                                  date: attendanceDate,
                                  status,
                                  professorId: professorData.id
                                }));
                                
                                if (attendanceRecords.length === 0) {
                                  toast({
                                    title: "Nenhuma presença marcada",
                                    description: "Marque a presença/ausência dos alunos antes de salvar.",
                                    variant: "destructive",
                                  });
                                  return;
                                }
                                
                                recordAttendanceMutation.mutate({ attendanceRecords });
                              }}
                              disabled={recordAttendanceMutation.isPending}
                            >
                              {recordAttendanceMutation.isPending ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              ) : (
                                <Check className="w-4 h-4 mr-2" />
                              )}
                              Registrar Chamada
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-6 text-gray-500">
                          <Users className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                          <p className="text-sm">Nenhum aluno matriculado nesta turma</p>
                          <p className="text-xs mt-1">Matricule alunos na turma para fazer a chamada</p>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {!selectedClassForAttendance && (
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <p className="text-sm text-blue-700 mb-2">
                        📋 <strong>Turmas disponíveis ({classes.length})</strong>
                      </p>
                      <div className="space-y-2">
                        {classes.map((turma) => (
                          <div key={turma.id} className="flex items-center justify-between bg-white p-3 rounded border">
                            <div>
                              <p className="font-medium">{turma.nome}</p>
                              <p className="text-sm text-gray-600">{turma.descricao}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-gray-500">Máx: {turma.maxAlunos} alunos</p>
                              <Button 
                                size="sm" 
                                className="btn-yellow mt-1"
                                onClick={() => setSelectedClassForAttendance(turma.id.toString())}
                              >
                                <Clock className="w-4 h-4 mr-1" />
                                Fazer Chamada
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <EmptyState
                  icon={Clock}
                  title="Nenhuma turma encontrada"
                  description="Crie uma turma primeiro para poder fazer a chamada."
                  action={
                    <Button 
                      className="btn-yellow mt-4"
                      onClick={() => setActiveSection("criar-turma")}
                    >
                      <Users className="w-4 h-4 mr-2" />
                      Criar Nova Turma
                    </Button>
                  }
                />
              )
              ) : (
                /* Aba Histórico */
                <div className="space-y-4">
                  <div className="mb-4">
                    <Label htmlFor="history-class-select">Selecionar Turma:</Label>
                    <Select value={selectedClassForHistory} onValueChange={setSelectedClassForHistory}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Escolha uma turma para ver o histórico" />
                      </SelectTrigger>
                      <SelectContent>
                        {classes?.map((turma: any) => (
                          <SelectItem key={turma.id} value={turma.id.toString()}>
                            {turma.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedClassForHistory ? (
                    historyLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-600"></div>
                      </div>
                    ) : attendanceHistory && attendanceHistory.length > 0 ? (
                      <div className="space-y-4">
                        <h3 className="font-semibold text-lg">
                          Histórico - {classes?.find((c: any) => c.id.toString() === selectedClassForHistory)?.nome}
                        </h3>
                        
                        {Object.entries(
                          attendanceHistory.reduce((acc: any, record: any) => {
                            const date = record.data;
                            if (!acc[date]) acc[date] = [];
                            acc[date].push(record);
                            return acc;
                          }, {})
                        )
                        .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
                        .map(([date, records]: [string, any]) => (
                          <div key={date} className="border rounded-lg overflow-hidden">
                            <div className="bg-gray-100 px-4 py-3 border-b">
                              <div className="flex items-center justify-between">
                                <h4 className="font-medium">
                                  {new Date(date).toLocaleDateString('pt-BR', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                  })}
                                </h4>
                                <div className="text-sm text-gray-600">
                                  {records.length} aluno{records.length !== 1 ? 's' : ''}
                                </div>
                              </div>
                            </div>
                            
                            <div className="divide-y">
                              {records.map((record: any, index: number) => (
                                <div key={index} className="px-4 py-3 flex items-center justify-between hover:bg-gray-50">
                                  <div className="flex-1">
                                    <p className="font-medium">{record.studentName || 'Nome não encontrado'}</p>
                                    <p className="text-sm text-gray-600">CPF: {record.alunoCpf}</p>
                                  </div>
                                  <div className="flex items-center">
                                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                      record.status === 'presente' 
                                        ? 'bg-green-100 text-green-800' 
                                        : 'bg-red-100 text-red-800'
                                    }`}>
                                      {record.status === 'presente' ? 'Presente' : 'Ausente'}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <FileText className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                        <p className="text-lg font-medium mb-2">Nenhum registro encontrado</p>
                        <p className="text-sm">Não há chamadas registradas para esta turma ainda</p>
                      </div>
                    )
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <FileText className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                      <p className="text-lg font-medium mb-2">Selecione uma turma</p>
                      <p className="text-sm">Escolha uma turma para ver o histórico de chamadas</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
          </div>
        );

      case "aula":
        return (
          <RegistrarAulaModule professorId={professorData.id} />
        );

      case "calendario":
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Calendar className="w-6 h-6" />
                  Calendário
                </CardTitle>
                <div className="flex items-center gap-4">
                  <Button 
                    variant={calendarView === "month" ? "default" : "outline"}
                    onClick={() => setCalendarView("month")}
                    size="sm"
                  >
                    Mês
                  </Button>
                  <Button 
                    variant={calendarView === "week" ? "default" : "outline"}
                    onClick={() => setCalendarView("week")}
                    size="sm"
                  >
                    Semana
                  </Button>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        const prev = new Date(currentDate);
                        prev.setMonth(prev.getMonth() - 1);
                        setCurrentDate(prev);
                      }}
                    >
                      ←
                    </Button>
                    <span className="text-sm font-medium min-w-32 text-center">
                      {currentDate.toLocaleDateString('pt-BR', { 
                        month: 'long', 
                        year: 'numeric' 
                      })}
                    </span>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        const next = new Date(currentDate);
                        next.setMonth(next.getMonth() + 1);
                        setCurrentDate(next);
                      }}
                    >
                      →
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {calendarView === "month" ? (
                  <div className="grid grid-cols-7 gap-1">
                    {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map(day => (
                      <div key={day} className="p-2 text-center font-medium text-sm text-gray-600">
                        {day}
                      </div>
                    ))}
                    {getDaysInMonth(currentDate).map((day, index) => {
                      const events = getEventsForDate(day) || [];
                      const isCurrentMonth = day.getMonth() === currentDate.getMonth();
                      const isToday = day.toDateString() === new Date().toDateString();
                      
                      return (
                        <div
                          key={`day-${index}`}
                          className={`p-2 min-h-16 border rounded text-sm ${
                            isCurrentMonth ? "bg-white" : "bg-gray-50 text-gray-400"
                          } ${isToday ? "border-blue-500 bg-blue-50" : "border-gray-200"}`}
                        >
                          <div className="font-medium">{day.getDate()}</div>
                          {events.map(event => (
                            <div
                              key={`event-${event.id}`}
                              className={`text-xs p-1 rounded mt-1 ${
                                event.type === "aula" ? "bg-blue-100 text-blue-800" :
                                event.type === "avaliacao" ? "bg-red-100 text-red-800" :
                                "bg-green-100 text-green-800"
                              }`}
                            >
                              {event.title || 'Evento'}
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {Array.from({ length: 7 }, (_, i) => {
                      const date = new Date(currentDate);
                      date.setDate(currentDate.getDate() - currentDate.getDay() + i);
                      const events = getEventsForDate(date) || [];
                      
                      return (
                        <div key={`week-${i}`} className="flex items-center gap-4 p-3 border rounded">
                          <div className="w-16 text-center">
                            <div className="font-medium text-sm">
                              {date.toLocaleDateString('pt-BR', { weekday: 'short' })}
                            </div>
                            <div className="text-lg font-bold">{date.getDate()}</div>
                          </div>
                          <div className="flex-1">
                            {events.length > 0 ? (
                              <div className="space-y-1">
                                {events.map(event => (
                                  <div key={`week-event-${event.id}`} className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${
                                      event.type === "aula" ? "bg-blue-500" :
                                      event.type === "avaliacao" ? "bg-red-500" :
                                      "bg-green-500"
                                    }`} />
                                    <span className="text-sm">{event.title || 'Evento'}</span>
                                    {event.time && (
                                      <span className="text-xs text-gray-500">({event.time})</span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-gray-400 text-sm">Sem eventos</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Adicionar Evento</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="event-title">Título do Evento</Label>
                    <Input
                      id="event-title"
                      value={newEvent.title}
                      onChange={(e) => setNewEvent({...newEvent, title: e.target.value})}
                      placeholder="Ex: Aula de Matemática"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="event-date">Data</Label>
                      <Input
                        id="event-date"
                        type="date"
                        value={newEvent.date}
                        onChange={(e) => setNewEvent({...newEvent, date: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="event-time">Horário</Label>
                      <Input
                        id="event-time"
                        type="time"
                        value={newEvent.time}
                        onChange={(e) => setNewEvent({...newEvent, time: e.target.value})}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="event-type">Tipo</Label>
                    <Select value={newEvent.type} onValueChange={(value) => setNewEvent({...newEvent, type: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="aula">Aula</SelectItem>
                        <SelectItem value="avaliacao">Avaliação</SelectItem>
                        <SelectItem value="reuniao">Reunião</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="event-description">Descrição</Label>
                    <Textarea
                      id="event-description"
                      value={newEvent.description}
                      onChange={(e) => setNewEvent({...newEvent, description: e.target.value})}
                      placeholder="Descrição do evento..."
                      rows={3}
                    />
                  </div>
                  <Button onClick={handleAddEvent} className="btn-yellow">
                    Adicionar Evento
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case "plano-aulas":
        return <PlanoAulasModule professorId={professorData.id} isLeader={isLeader} />;

      case "agenda":
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Calendar className="w-6 h-6" />
                  Próximos Compromissos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <EmptyState
                  icon={Calendar}
                  title="Nenhum compromisso agendado"
                  description="Seus compromissos aparecerão aqui quando forem agendados."
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  Adicionar Lembrete
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="reminder-title">Título</Label>
                    <Input
                      id="reminder-title"
                      value={newReminder.title}
                      onChange={(e) => setNewReminder({...newReminder, title: e.target.value})}
                      placeholder="Ex: Reunião de pais"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="reminder-date">Data</Label>
                      <Input
                        id="reminder-date"
                        type="date"
                        value={newReminder.date}
                        onChange={(e) => setNewReminder({...newReminder, date: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="reminder-time">Hora</Label>
                      <Input
                        id="reminder-time"
                        type="time"
                        value={newReminder.time}
                        onChange={(e) => setNewReminder({...newReminder, time: e.target.value})}
                      />
                    </div>
                  </div>
                  <Button onClick={handleAddReminder} className="btn-yellow">
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar lembrete
                  </Button>
                </div>

                {reminders.length > 0 && (
                  <div className="mt-6 pt-6 border-t">
                    <h3 className="font-medium mb-4">Meus Lembretes</h3>
                    <div className="space-y-2">
                      {reminders.map(reminder => (
                        <div key={reminder.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <span className="font-medium">{reminder.title}</span>
                          <span className="text-sm text-gray-500">
                            {reminder.date} {reminder.time}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        );

      case "registrar-aluno":
        return (
          <div className="space-y-6">
            {/* Seção de navegação entre modos */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <UserPlus className="w-6 h-6" />
                  Alunos
                  {!isLeader && (
                    <Badge variant="outline" className="text-blue-600 border-blue-200 ml-2">
                      Visualização limitada
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-3 mb-6">
                  <Button
                    variant={managementMode === 'register' ? 'default' : 'outline'}
                    onClick={() => {
                      setManagementMode('register');
                      setSelectedStudentForView(null);
                      setIsEditing(false);
                      setStudentFormStep(1);
                    }}
                    className="flex-1"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Registrar Novo Aluno
                  </Button>
                  <Button
                    variant={managementMode === 'search' ? 'default' : 'outline'}
                    onClick={() => {
                      setManagementMode('search');
                      setSelectedStudentForView(null);
                      setIsEditing(false);
                      setSearchQuery('');
                      setSearchResults([]);
                    }}
                    className="flex-1"
                  >
                    <Search className="w-4 h-4 mr-2" />
                    Buscar Aluno Existente
                  </Button>
                </div>

                {/* Interface de busca */}
                {managementMode === 'search' && (
                  <div className="space-y-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        placeholder="Digite o nome ou CPF do aluno..."
                        value={searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value);
                          searchStudents(e.target.value);
                        }}
                        className="pl-10"
                      />
                    </div>

                    {/* Resultados da busca */}
                    {searchResults.length > 0 && (
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {searchResults.map((student) => (
                          <div
                            key={student.cpf}
                            className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <h4 className="font-medium">{student.nome_completo}</h4>
                                <p className="text-sm text-gray-600">CPF: {student.cpf}</p>
                                {student.data_nascimento && (
                                  <p className="text-sm text-gray-500">
                                    Nascimento: {new Date(student.data_nascimento).toLocaleDateString('pt-BR')}
                                  </p>
                                )}
                              </div>
                              <div className="flex gap-2">
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => viewStudentData(student)}
                                >
                                  <Eye className="w-4 h-4 mr-1" />
                                  Visualizar
                                </Button>
                                {isLeader ? (
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => loadStudentData(student)}
                                  >
                                    <Edit className="w-4 h-4 mr-1" />
                                    Editar
                                  </Button>
                                ) : (
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    disabled
                                    title="Apenas líderes podem editar alunos"
                                  >
                                    <Edit className="w-4 h-4 mr-1" />
                                    Editar
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {searchQuery.length >= 2 && searchResults.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <Users className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                        <p>Nenhum aluno encontrado</p>
                        <p className="text-sm">Verifique o nome ou CPF digitado</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Interface de edição/visualização */}
                {managementMode === 'edit' && selectedStudent && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div>
                        <h3 className="font-medium text-blue-900">
                          Editando: {selectedStudent.nome_completo}
                        </h3>
                        <p className="text-sm text-blue-700">CPF: {selectedStudent.cpf}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setManagementMode('search');
                            setSelectedStudentForView(null);
                            setIsEditing(false);
                          }}
                        >
                          <ArrowLeft className="w-4 h-4 mr-1" />
                          Voltar
                        </Button>
                        <Button
                          size="sm"
                          onClick={saveStudentChanges}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Save className="w-4 h-4 mr-1" />
                          Salvar Alterações
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Formulário principal */}
            {(managementMode === 'register' || managementMode === 'edit') && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    {managementMode === 'register' ? (
                      <>
                        <UserPlus className="w-6 h-6" />
                        Registrar Novo Aluno
                      </>
                    ) : (
                      <>
                        <Edit className="w-6 h-6" />
                        Editar Dados do Aluno
                      </>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-3 md:px-6">
                <div className="space-y-6 md:space-y-8">
                  {/* Progress indicator - Responsivo */}
                  <div className="mb-4 md:mb-6">
                    {/* Desktop: linha horizontal */}
                    <div className="hidden md:flex justify-center">
                      <div className="flex items-center space-x-2">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((step) => (
                          <div key={step} className="flex items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                              step <= studentFormStep 
                                ? 'bg-yellow-500 text-white' 
                                : 'bg-gray-200 text-gray-600'
                            }`}>
                              {step}
                            </div>
                            {step < 11 && (
                              <div className={`w-8 h-1 ${
                                step < studentFormStep ? 'bg-yellow-500' : 'bg-gray-200'
                              }`} />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Mobile: indicador compacto */}
                    <div className="md:hidden flex items-center justify-center space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                        'bg-yellow-500 text-white'
                      }`}>
                        {studentFormStep}
                      </div>
                      <div className="flex-1 bg-gray-200 h-2 rounded-full max-w-xs">
                        <div 
                          className="bg-yellow-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${(studentFormStep / 11) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-600 font-medium">{studentFormStep}/11</span>
                    </div>
                  </div>
                  
                  {/* Form content based on step */}
                  {studentFormStep === 1 && (
                    <div className="space-y-6">
                      <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2 border-b pb-3">
                        <span className="bg-yellow-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm">1</span>
                        Identificação
                      </h3>
                      
                      {/* CPF e Nome - Campos prioritários */}
                      <div className="bg-yellow-50 p-4 md:p-6 rounded-lg border border-yellow-200">
                        <h4 className="font-semibold text-gray-800 mb-4">Dados Principais (Obrigatórios)</h4>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="cpf">CPF do Aluno *</Label>
                            <Input
                              id="cpf"
                              value={studentFormData.cpf}
                              onChange={(e) => {
                                const formattedCPF = formatCPF(e.target.value);
                                setStudentFormData({...studentFormData, cpf: formattedCPF});
                              }}
                              placeholder="000.000.000-00"
                              className={studentFormErrors.cpf ? 'border-red-500' : ''}
                              maxLength={14}
                            />
                            {studentFormErrors.cpf && (
                              <p className="text-sm text-red-600 mt-1">{studentFormErrors.cpf}</p>
                            )}
                          </div>
                          <div>
                            <Label htmlFor="fullName">Nome Completo *</Label>
                            <Input
                              id="fullName"
                              value={studentFormData.fullName}
                              onChange={(e) => setStudentFormData({...studentFormData, fullName: e.target.value})}
                              placeholder="Nome completo do aluno"
                              className={studentFormErrors.fullName ? 'border-red-500' : ''}
                            />
                            {studentFormErrors.fullName && (
                              <p className="text-sm text-red-600 mt-1">{studentFormErrors.fullName}</p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Upload de Foto */}
                      <div className="bg-gray-50 p-4 rounded-lg border">
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">Foto do perfil</Label>
                        <div className="flex items-center gap-4">
                          <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center">
                            {studentFormData.photoUrl ? (
                              <img 
                                src={studentFormData.photoUrl} 
                                alt="Foto do aluno" 
                                className="w-full h-full object-cover rounded-lg" 
                              />
                            ) : (
                              <User className="w-8 h-8 text-gray-400" />
                            )}
                          </div>
                          <div className="flex-1">
                            <input
                              type="file"
                              id="photo-upload"
                              accept="image/jpeg,image/jpg,image/png"
                              className="hidden"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  try {
                                    if (file.size > 20 * 1024 * 1024) {
                                      toast({
                                        title: "Arquivo muito grande",
                                        description: "O arquivo deve ter no máximo 20MB.",
                                        variant: "destructive"
                                      });
                                      return;
                                    }

                                    const formData = new FormData();
                                    formData.append('file', file);

                                    const response = await fetch('/api/upload', {
                                      method: 'POST',
                                      body: formData,
                                    });

                                    if (!response.ok) {
                                      throw new Error('Erro no upload');
                                    }

                                    const result = await response.json();
                                    setStudentFormData({...studentFormData, photoUrl: result.fileUrl});

                                    toast({
                                      title: "Foto carregada",
                                      description: "A foto foi carregada com sucesso.",
                                    });
                                  } catch (error) {
                                    toast({
                                      title: "Erro no upload",
                                      description: "Não foi possível carregar o arquivo. Tente novamente.",
                                      variant: "destructive"
                                    });
                                  }
                                }
                              }}
                            />
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => document.getElementById('photo-upload')?.click()}
                            >
                              <Upload className="w-4 h-4 mr-2" />
                              Carregar Foto
                            </Button>
                            <p className="text-xs text-gray-500 mt-1">Formatos: .jpg, .jpeg, .png | máx. 20 MB</p>
                          </div>
                        </div>
                      </div>

                      {/* Campos principais da Identificação */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="birthDate">Data de Nascimento *</Label>
                          <Input
                            id="birthDate"
                            type="date"
                            value={studentFormData.birthDate}
                            onChange={(e) => setStudentFormData({...studentFormData, birthDate: e.target.value})}
                            className={studentFormErrors.birthDate ? 'border-red-500' : ''}
                          />
                          {studentFormErrors.birthDate && (
                            <p className="text-sm text-red-600 mt-1">{studentFormErrors.birthDate}</p>
                          )}
                        </div>
                        <div>
                          <Label htmlFor="gender">Gênero</Label>
                          <Select value={studentFormData.gender} onValueChange={(value) => setStudentFormData({...studentFormData, gender: value})}>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o gênero" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="feminino">Feminino</SelectItem>
                              <SelectItem value="masculino">Masculino</SelectItem>
                              <SelectItem value="nao-binario">Não binário</SelectItem>
                              <SelectItem value="nao-informado">Não informado</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="registrationNumber">Número de matrícula</Label>
                          <Input
                            id="registrationNumber"
                            value={studentFormData.registrationNumber || "Gerado automaticamente"}
                            disabled
                            className="bg-gray-100"
                          />
                        </div>
                        <div>
                          <Label htmlFor="familyAtendido">Família do atendido</Label>
                          <Input
                            id="familyAtendido"
                            value={studentFormData.familyAtendido}
                            onChange={(e) => setStudentFormData({...studentFormData, familyAtendido: e.target.value})}
                            placeholder="Nome da família ou responsável"
                          />
                        </div>
                        <div>
                          <Label htmlFor="situacaoAtendimento">Situação do atendimento</Label>
                          <Select value={studentFormData.situacaoAtendimento} onValueChange={(value) => setStudentFormData({...studentFormData, situacaoAtendimento: value})}>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a situação" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ativo">Ativo</SelectItem>
                              <SelectItem value="inativo">Inativo</SelectItem>
                              <SelectItem value="transferido">Transferido</SelectItem>
                              <SelectItem value="suspenso">Suspenso</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="estadoCivil">Estado civil</Label>
                          <Select value={studentFormData.estadoCivil} onValueChange={(value) => setStudentFormData({...studentFormData, estadoCivil: value})}>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="solteiro">Solteiro(a)</SelectItem>
                              <SelectItem value="casado">Casado(a)</SelectItem>
                              <SelectItem value="divorciado">Divorciado(a)</SelectItem>
                              <SelectItem value="viuvo">Viúvo(a)</SelectItem>
                              <SelectItem value="uniao-estavel">União estável</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="religiao">Religião</Label>
                          <Input
                            id="religiao"
                            value={studentFormData.religiao}
                            onChange={(e) => setStudentFormData({...studentFormData, religiao: e.target.value})}
                            placeholder="Ex: Católica, Evangélica, etc."
                          />
                        </div>
                        <div>
                          <Label htmlFor="naturalidade">Naturalidade</Label>
                          <Input
                            id="naturalidade"
                            value={studentFormData.naturalidade}
                            onChange={(e) => setStudentFormData({...studentFormData, naturalidade: e.target.value})}
                            placeholder="Cidade e estado de nascimento"
                          />
                        </div>
                        <div>
                          <Label htmlFor="nacionalidade">Nacionalidade</Label>
                          <Input
                            id="nacionalidade"
                            value={studentFormData.nacionalidade}
                            onChange={(e) => setStudentFormData({...studentFormData, nacionalidade: e.target.value})}
                            placeholder="Ex: Brasileira"
                          />
                        </div>
                        <div>
                          <Label htmlFor="podeSairSozinho">Pode sair sozinho da instituição?</Label>
                          <Select value={studentFormData.podeSairSozinho} onValueChange={(value) => setStudentFormData({...studentFormData, podeSairSozinho: value})}>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="sim">Sim</SelectItem>
                              <SelectItem value="nao">Não</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>


                    </div>
                  )}



                  {/* Seção 2: Dados Complementares */}
                  {studentFormStep === 2 && (
                    <div className="space-y-6">
                      <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2 border-b pb-3">
                        <span className="bg-yellow-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm">2</span>
                        Dados Complementares
                      </h3>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="tamanhoCalca">Tamanho de Calça</Label>
                          <Input
                            id="tamanhoCalca"
                            value={studentFormData.tamanhoCalca}
                            onChange={(e) => setStudentFormData({...studentFormData, tamanhoCalca: e.target.value})}
                            placeholder="Ex: P, M, G, 40, 42"
                          />
                        </div>
                        <div>
                          <Label htmlFor="tamanhoCamiseta">Tamanho de Camiseta</Label>
                          <Input
                            id="tamanhoCamiseta"
                            value={studentFormData.tamanhoCamiseta}
                            onChange={(e) => setStudentFormData({...studentFormData, tamanhoCamiseta: e.target.value})}
                            placeholder="Ex: P, M, G, GG"
                          />
                        </div>
                        <div>
                          <Label htmlFor="tamanhoCalcado">Tamanho de Calçado</Label>
                          <Input
                            id="tamanhoCalcado"
                            value={studentFormData.tamanhoCalcado}
                            onChange={(e) => setStudentFormData({...studentFormData, tamanhoCalcado: e.target.value})}
                            placeholder="Ex: 37, 38, 39"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="corRaca">Cor/Raça</Label>
                          <Select value={studentFormData.corRaca} onValueChange={(value) => setStudentFormData({...studentFormData, corRaca: value})}>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="branca">Branca</SelectItem>
                              <SelectItem value="preta">Preta</SelectItem>
                              <SelectItem value="parda">Parda</SelectItem>
                              <SelectItem value="amarela">Amarela</SelectItem>
                              <SelectItem value="indigena">Indígena</SelectItem>
                              <SelectItem value="nao-sabe">Não sabe informar</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="frequentaProjetoSocial">Frequenta projeto social?</Label>
                          <Select value={studentFormData.frequentaProjetoSocial} onValueChange={(value) => setStudentFormData({...studentFormData, frequentaProjetoSocial: value})}>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="sim">Sim</SelectItem>
                              <SelectItem value="nao">Não</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {studentFormData.frequentaProjetoSocial === "sim" && (
                        <div>
                          <Label htmlFor="qualProjetoSocial">Qual projeto social?</Label>
                          <Input
                            id="qualProjetoSocial"
                            value={studentFormData.qualProjetoSocial}
                            onChange={(e) => setStudentFormData({...studentFormData, qualProjetoSocial: e.target.value})}
                            placeholder="Nome do projeto social"
                          />
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="possuiAcessoInternet">Possui acesso à internet?</Label>
                          <Select value={studentFormData.possuiAcessoInternet} onValueChange={(value) => setStudentFormData({...studentFormData, possuiAcessoInternet: value})}>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="sim">Sim</SelectItem>
                              <SelectItem value="nao">Não</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        {studentFormData.possuiAcessoInternet === "sim" && (
                          <div>
                            <Label htmlFor="qualAcessoInternet">Qual tipo de acesso?</Label>
                            <Input
                              id="qualAcessoInternet"
                              value={studentFormData.qualAcessoInternet}
                              onChange={(e) => setStudentFormData({...studentFormData, qualAcessoInternet: e.target.value})}
                              placeholder="Ex: Wi-Fi doméstico, dados móveis"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Seção 3: Endereço */}
                  {studentFormStep === 3 && (
                    <div className="space-y-6">
                      <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2 border-b pb-3">
                        <span className="bg-yellow-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm">3</span>
                        Endereço
                      </h3>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="cep">CEP *</Label>
                          <Input
                            id="cep"
                            value={studentFormData.cep}
                            onChange={(e) => handleCepChange(e.target.value)}
                            placeholder="00000-000"
                            maxLength={9}
                          />
                          <p className="text-xs text-gray-500 mt-1">Digite o CEP para preenchimento automático</p>
                        </div>
                        <div>
                          <Label htmlFor="logradouro">Logradouro (Rua) *</Label>
                          <Input
                            id="logradouro"
                            value={studentFormData.logradouro}
                            onChange={(e) => setStudentFormData({...studentFormData, logradouro: e.target.value})}
                            placeholder="Nome da rua"
                            className={studentFormErrors.logradouro ? 'border-red-500' : ''}
                          />
                          {studentFormErrors.logradouro && (
                            <p className="text-sm text-red-600 mt-1">{studentFormErrors.logradouro}</p>
                          )}
                        </div>
                        <div>
                          <Label htmlFor="numero">Número *</Label>
                          <Input
                            id="numero"
                            value={studentFormData.numero}
                            onChange={(e) => setStudentFormData({...studentFormData, numero: e.target.value})}
                            placeholder="123"
                            className={studentFormErrors.numero ? 'border-red-500' : ''}
                          />
                          {studentFormErrors.numero && (
                            <p className="text-sm text-red-600 mt-1">{studentFormErrors.numero}</p>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="bairro">Bairro</Label>
                          <Input
                            id="bairro"
                            value={studentFormData.bairro}
                            onChange={(e) => setStudentFormData({...studentFormData, bairro: e.target.value})}
                            placeholder="Nome do bairro"
                          />
                        </div>
                        <div>
                          <Label htmlFor="municipio">Cidade/Município</Label>
                          <Input
                            id="municipio"
                            value={studentFormData.municipio}
                            onChange={(e) => setStudentFormData({...studentFormData, municipio: e.target.value})}
                            placeholder="Nome da cidade"
                          />
                        </div>
                        <div>
                          <Label htmlFor="estado">Estado</Label>
                          <Select value={studentFormData.estado} onValueChange={(value) => setStudentFormData({...studentFormData, estado: value})}>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o estado" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="SP">São Paulo</SelectItem>
                              <SelectItem value="RJ">Rio de Janeiro</SelectItem>
                              <SelectItem value="MG">Minas Gerais</SelectItem>
                              <SelectItem value="RS">Rio Grande do Sul</SelectItem>
                              <SelectItem value="PR">Paraná</SelectItem>
                              <SelectItem value="SC">Santa Catarina</SelectItem>
                              <SelectItem value="BA">Bahia</SelectItem>
                              <SelectItem value="GO">Goiás</SelectItem>
                              <SelectItem value="DF">Distrito Federal</SelectItem>
                              <SelectItem value="PE">Pernambuco</SelectItem>
                              <SelectItem value="CE">Ceará</SelectItem>
                              <SelectItem value="ES">Espírito Santo</SelectItem>
                              <SelectItem value="MT">Mato Grosso</SelectItem>
                              <SelectItem value="MS">Mato Grosso do Sul</SelectItem>
                              <SelectItem value="PA">Pará</SelectItem>
                              <SelectItem value="PB">Paraíba</SelectItem>
                              <SelectItem value="AL">Alagoas</SelectItem>
                              <SelectItem value="RN">Rio Grande do Norte</SelectItem>
                              <SelectItem value="SE">Sergipe</SelectItem>
                              <SelectItem value="PI">Piauí</SelectItem>
                              <SelectItem value="MA">Maranhão</SelectItem>
                              <SelectItem value="TO">Tocantins</SelectItem>
                              <SelectItem value="AM">Amazonas</SelectItem>
                              <SelectItem value="AC">Acre</SelectItem>
                              <SelectItem value="RO">Rondônia</SelectItem>
                              <SelectItem value="RR">Roraima</SelectItem>
                              <SelectItem value="AP">Amapá</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="complemento">Complemento</Label>
                          <Input
                            id="complemento"
                            value={studentFormData.complemento}
                            onChange={(e) => setStudentFormData({...studentFormData, complemento: e.target.value})}
                            placeholder="Apto, casa, bloco..."
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="pontoReferencia">Ponto de referência</Label>
                          <Input
                            id="pontoReferencia"
                            value={studentFormData.pontoReferencia}
                            onChange={(e) => setStudentFormData({...studentFormData, pontoReferencia: e.target.value})}
                            placeholder="Ex: Próximo ao mercado São João"
                          />
                        </div>
                        <div>
                          <Label htmlFor="moraDesdeAno">Mora no endereço desde</Label>
                          <Input
                            id="moraDesdeAno"
                            type="number"
                            value={studentFormData.moraDesdeAno}
                            onChange={(e) => setStudentFormData({...studentFormData, moraDesdeAno: e.target.value})}
                            placeholder="2020"
                            min="1900"
                            max="2025"
                          />
                        </div>
                      </div>


                    </div>
                  )}

                  {/* Seção 4: Contatos */}
                  {studentFormStep === 4 && (
                    <div className="space-y-6">
                      <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2 border-b pb-3">
                        <span className="bg-yellow-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm">4</span>
                        Contatos
                      </h3>

                      <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <Label htmlFor="email">E-mail</Label>
                            <Input
                              id="email"
                              type="email"
                              value={studentFormData.email}
                              onChange={(e) => setStudentFormData({...studentFormData, email: e.target.value})}
                              placeholder="email@exemplo.com"
                            />
                          </div>
                          <div>
                            <Label htmlFor="telefone">Telefone</Label>
                            <Input
                              id="telefone"
                              value={studentFormData.telefone}
                              onChange={(e) => setStudentFormData({...studentFormData, telefone: e.target.value})}
                              placeholder="(11) 99999-9999"
                            />
                          </div>
                          <div>
                            <Label htmlFor="whatsapp">WhatsApp</Label>
                            <Input
                              id="whatsapp"
                              value={studentFormData.whatsapp}
                              onChange={(e) => setStudentFormData({...studentFormData, whatsapp: e.target.value})}
                              placeholder="(11) 99999-9999"
                            />
                          </div>
                        </div>

                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                          <h4 className="font-semibold text-blue-900 mb-3">Pessoa para contato de emergência</h4>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <Label htmlFor="pessoaContato">Nome</Label>
                              <Input
                                id="pessoaContato"
                                value={studentFormData.pessoaContato}
                                onChange={(e) => setStudentFormData({...studentFormData, pessoaContato: e.target.value})}
                                placeholder="Nome da pessoa de contato"
                              />
                            </div>
                            <div>
                              <Label htmlFor="telefoneContato">Telefone</Label>
                              <Input
                                id="telefoneContato"
                                value={studentFormData.telefoneContato}
                                onChange={(e) => setStudentFormData({...studentFormData, telefoneContato: e.target.value})}
                                placeholder="(11) 99999-9999"
                              />
                            </div>
                            <div>
                              <Label htmlFor="whatsappContato">WhatsApp</Label>
                              <Input
                                id="whatsappContato"
                                value={studentFormData.whatsappContato}
                                onChange={(e) => setStudentFormData({...studentFormData, whatsappContato: e.target.value})}
                                placeholder="(11) 99999-9999"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Seção 5: Documentos */}
                  {studentFormStep === 5 && (
                    <div className="space-y-6">
                      <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2 border-b pb-3">
                        <span className="bg-yellow-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm">5</span>
                        Documentos
                      </h3>

                      {/* Documentos principais */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="rg">RG *</Label>
                          <Input
                            id="rg"
                            value={studentFormData.rg}
                            onChange={(e) => setStudentFormData({...studentFormData, rg: e.target.value})}
                            placeholder="00.000.000-0"
                            className={studentFormErrors.rg ? 'border-red-500' : ''}
                          />
                          {studentFormErrors.rg && (
                            <p className="text-sm text-red-600 mt-1">{studentFormErrors.rg}</p>
                          )}
                        </div>
                        <div>
                          <Label htmlFor="orgaoEmissor">Órgão emissor *</Label>
                          <Input
                            id="orgaoEmissor"
                            value={studentFormData.orgaoEmissor}
                            onChange={(e) => setStudentFormData({...studentFormData, orgaoEmissor: e.target.value})}
                            placeholder="Ex: SSP/SP"
                            className={studentFormErrors.orgaoEmissor ? 'border-red-500' : ''}
                          />
                          {studentFormErrors.orgaoEmissor && (
                            <p className="text-sm text-red-600 mt-1">{studentFormErrors.orgaoEmissor}</p>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="carteiraTrabalho">Carteira de trabalho (CTPS)</Label>
                          <Input
                            id="carteiraTrabalho"
                            value={studentFormData.carteiraTrabalho}
                            onChange={(e) => setStudentFormData({...studentFormData, carteiraTrabalho: e.target.value})}
                            placeholder="Número da CTPS"
                          />
                        </div>
                        <div>
                          <Label htmlFor="serie">Série da CTPS</Label>
                          <Input
                            id="serie"
                            value={studentFormData.serie}
                            onChange={(e) => setStudentFormData({...studentFormData, serie: e.target.value})}
                            placeholder="Série da carteira"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="tituloEleitor">Título de eleitor</Label>
                          <Input
                            id="tituloEleitor"
                            value={studentFormData.tituloEleitor}
                            onChange={(e) => setStudentFormData({...studentFormData, tituloEleitor: e.target.value})}
                            placeholder="Número do título"
                          />
                        </div>
                        <div>
                          <Label htmlFor="nisPisPasep">NIS/PIS/PASEP</Label>
                          <Input
                            id="nisPisPasep"
                            value={studentFormData.nisPisPasep}
                            onChange={(e) => setStudentFormData({...studentFormData, nisPisPasep: e.target.value})}
                            placeholder="Número do documento"
                          />
                        </div>
                      </div>

                      {/* Documentos que possui */}
                      <div>
                        <Label className="text-base font-medium">Documentos que possui</Label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                          {[
                            { value: "certidao-nascimento", label: "Certidão de nascimento" },
                            { value: "certidao-casamento", label: "Certidão de casamento" },
                            { value: "certificado-reservista", label: "Certificado de reservista" },
                            { value: "carteira-trabalho", label: "Carteira de trabalho" }
                          ].map(doc => (
                            <div key={doc.value} className="flex items-center space-x-2">
                              <Checkbox
                                id={doc.value}
                                checked={studentFormData.documentosPosse.includes(doc.value)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setStudentFormData({
                                      ...studentFormData,
                                      documentosPosse: [...studentFormData.documentosPosse, doc.value]
                                    });
                                  } else {
                                    setStudentFormData({
                                      ...studentFormData,
                                      documentosPosse: studentFormData.documentosPosse.filter(d => d !== doc.value)
                                    });
                                  }
                                }}
                              />
                              <Label htmlFor={doc.value} className="text-sm">{doc.label}</Label>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Upload de identidade */}
                      <div className="space-y-4">
                        <div>
                          <Label className="text-base font-medium">Upload de Identidade</Label>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-yellow-400 transition-colors">
                              {studentFormData.uploadIdentidadeFrente ? (
                                <div className="space-y-2">
                                  <img 
                                    src={studentFormData.uploadIdentidadeFrente} 
                                    alt="Identidade Frente" 
                                    className="w-full max-w-[200px] h-auto mx-auto rounded border" 
                                  />
                                  <p className="text-sm text-green-600">✓ Documento carregado</p>
                                </div>
                              ) : (
                                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                              )}
                              <p className="text-sm text-gray-600 mb-2">Identidade - Frente</p>
                              <input
                                type="file"
                                id="identity-front-upload"
                                accept="image/jpeg,image/jpg,image/png"
                                className="hidden"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    try {
                                      if (file.size > 20 * 1024 * 1024) {
                                        toast({
                                          title: "Arquivo muito grande",
                                          description: "O arquivo deve ter no máximo 20MB.",
                                          variant: "destructive"
                                        });
                                        return;
                                      }

                                      const formData = new FormData();
                                      formData.append('file', file);

                                      const response = await fetch('/api/upload', {
                                        method: 'POST',
                                        body: formData,
                                      });

                                      if (!response.ok) {
                                        throw new Error('Erro no upload');
                                      }

                                      const result = await response.json();
                                      setStudentFormData({...studentFormData, uploadIdentidadeFrente: result.fileUrl});

                                      toast({
                                        title: "Documento carregado",
                                        description: "Identidade (frente) carregada com sucesso.",
                                      });
                                    } catch (error) {
                                      toast({
                                        title: "Erro no upload",
                                        description: "Não foi possível carregar o arquivo. Tente novamente.",
                                        variant: "destructive"
                                      });
                                    }
                                  }
                                }}
                              />
                              <Button 
                                variant="outline" 
                                size="sm" 
                                type="button"
                                onClick={() => document.getElementById('identity-front-upload')?.click()}
                              >
                                <Camera className="w-4 h-4 mr-2" />
                                Adicionar foto
                              </Button>
                              <p className="text-xs text-gray-500 mt-2">JPG, PNG até 20MB</p>
                            </div>
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-yellow-400 transition-colors">
                              {studentFormData.uploadIdentidadeVerso ? (
                                <div className="space-y-2">
                                  <img 
                                    src={studentFormData.uploadIdentidadeVerso} 
                                    alt="Identidade Verso" 
                                    className="w-full max-w-[200px] h-auto mx-auto rounded border" 
                                  />
                                  <p className="text-sm text-green-600">✓ Documento carregado</p>
                                </div>
                              ) : (
                                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                              )}
                              <p className="text-sm text-gray-600 mb-2">Identidade - Verso</p>
                              <input
                                type="file"
                                id="identity-back-upload"
                                accept="image/jpeg,image/jpg,image/png"
                                className="hidden"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    try {
                                      if (file.size > 20 * 1024 * 1024) {
                                        toast({
                                          title: "Arquivo muito grande",
                                          description: "O arquivo deve ter no máximo 20MB.",
                                          variant: "destructive"
                                        });
                                        return;
                                      }

                                      const formData = new FormData();
                                      formData.append('file', file);

                                      const response = await fetch('/api/upload', {
                                        method: 'POST',
                                        body: formData,
                                      });

                                      if (!response.ok) {
                                        throw new Error('Erro no upload');
                                      }

                                      const result = await response.json();
                                      setStudentFormData({...studentFormData, uploadIdentidadeVerso: result.fileUrl});

                                      toast({
                                        title: "Documento carregado",
                                        description: "Identidade (verso) carregada com sucesso.",
                                      });
                                    } catch (error) {
                                      toast({
                                        title: "Erro no upload",
                                        description: "Não foi possível carregar o arquivo. Tente novamente.",
                                        variant: "destructive"
                                      });
                                    }
                                  }
                                }}
                              />
                              <Button 
                                variant="outline" 
                                size="sm" 
                                type="button"
                                onClick={() => document.getElementById('identity-back-upload')?.click()}
                              >
                                <Camera className="w-4 h-4 mr-2" />
                                Adicionar foto
                              </Button>
                              <p className="text-xs text-gray-500 mt-2">JPG, PNG até 20MB</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Informações importantes */}
                      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <h4 className="font-medium text-blue-900 mb-2">Informações importantes:</h4>
                        <ul className="text-sm text-blue-800 space-y-1">
                          <li>• CPF é obrigatório</li>
                          <li>• Adicione fotos claras da identidade (frente e verso)</li>
                          <li>• Os documentos devem estar legíveis e atualizados</li>
                          <li>• Marque apenas os documentos que o aluno realmente possui</li>
                        </ul>
                      </div>
                    </div>
                  )}

                  {/* Seção 6: Benefícios Sociais */}
                  {studentFormStep === 6 && (
                    <div className="space-y-6">
                      <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2 border-b pb-3">
                        <span className="bg-yellow-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm">6</span>
                        Benefícios Sociais
                      </h3>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <Label htmlFor="familiaNoCADUnico">Família cadastrada no CadÚnico?</Label>
                          <Select value={studentFormData.familiaNoCADUnico} onValueChange={(value) => setStudentFormData({...studentFormData, familiaNoCADUnico: value})}>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="sim">Sim</SelectItem>
                              <SelectItem value="nao">Não</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="recebeBolsaFamilia">Recebe Bolsa Família?</Label>
                          <Select value={studentFormData.recebeBolsaFamilia} onValueChange={(value) => setStudentFormData({...studentFormData, recebeBolsaFamilia: value})}>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="sim">Sim</SelectItem>
                              <SelectItem value="nao">Não</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="recebeBPC">Recebe BPC?</Label>
                          <Select value={studentFormData.recebeBPC} onValueChange={(value) => setStudentFormData({...studentFormData, recebeBPC: value})}>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="sim">Sim</SelectItem>
                              <SelectItem value="nao">Não</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="recebeCartaoAlimentacao">Recebe Cartão Alimentação?</Label>
                          <Select value={studentFormData.recebeCartaoAlimentacao} onValueChange={(value) => setStudentFormData({...studentFormData, recebeCartaoAlimentacao: value})}>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="sim">Sim</SelectItem>
                              <SelectItem value="nao">Não</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="md:col-span-2">
                          <Label htmlFor="recebeOutrosBeneficios">Recebe outros benefícios?</Label>
                          <Input
                            id="recebeOutrosBeneficios"
                            value={studentFormData.recebeOutrosBeneficios}
                            onChange={(e) => setStudentFormData({...studentFormData, recebeOutrosBeneficios: e.target.value})}
                            placeholder="Descreva outros benefícios recebidos"
                          />
                        </div>
                      </div>
                    </div>
                  )}



                  {/* Seção 7: Saúde */}
                  {studentFormStep === 7 && (
                    <div className="space-y-6">
                      <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2 border-b pb-3">
                        <span className="bg-yellow-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm">7</span>
                        Saúde
                      </h3>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="possuiDeficiencia">Possui deficiência?</Label>
                          <Select value={studentFormData.possuiDeficiencia} onValueChange={(value) => setStudentFormData({...studentFormData, possuiDeficiencia: value})}>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="sim">Sim</SelectItem>
                              <SelectItem value="nao">Não</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        {studentFormData.possuiDeficiencia === "sim" && (
                          <div>
                            <Label htmlFor="qualDeficiencia">Qual deficiência?</Label>
                            <Input
                              id="qualDeficiencia"
                              value={studentFormData.qualDeficiencia}
                              onChange={(e) => setStudentFormData({...studentFormData, qualDeficiencia: e.target.value})}
                              placeholder="Descreva a deficiência"
                            />
                          </div>
                        )}
                        <div>
                          <Label htmlFor="possuiAlergia">Possui alergia?</Label>
                          <Select value={studentFormData.possuiAlergia} onValueChange={(value) => setStudentFormData({...studentFormData, possuiAlergia: value})}>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="sim">Sim</SelectItem>
                              <SelectItem value="nao">Não</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        {studentFormData.possuiAlergia === "sim" && (
                          <div>
                            <Label htmlFor="qualAlergia">Qual alergia?</Label>
                            <Input
                              id="qualAlergia"
                              value={studentFormData.qualAlergia}
                              onChange={(e) => setStudentFormData({...studentFormData, qualAlergia: e.target.value})}
                              placeholder="Descreva a alergia"
                            />
                          </div>
                        )}
                        <div>
                          <Label htmlFor="fazUsoDeMedicamento">Faz uso de medicamento?</Label>
                          <Select value={studentFormData.fazUsoDeMedicamento} onValueChange={(value) => setStudentFormData({...studentFormData, fazUsoDeMedicamento: value})}>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="sim">Sim</SelectItem>
                              <SelectItem value="nao">Não</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        {studentFormData.fazUsoDeMedicamento === "sim" && (
                          <div>
                            <Label htmlFor="qualMedicamento">Qual medicamento?</Label>
                            <Input
                              id="qualMedicamento"
                              value={studentFormData.qualMedicamento}
                              onChange={(e) => setStudentFormData({...studentFormData, qualMedicamento: e.target.value})}
                              placeholder="Nome e dosagem do medicamento"
                            />
                          </div>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="observacoesSaude">Observações adicionais sobre saúde</Label>
                        <Textarea
                          id="observacoesSaude"
                          value={studentFormData.observacoesSaude}
                          onChange={(e) => setStudentFormData({...studentFormData, observacoesSaude: e.target.value})}
                          placeholder="Informações importantes sobre a saúde do aluno..."
                          rows={4}
                        />
                      </div>

                      {/* Upload de laudo médico */}
                      <div className="space-y-4">
                        <div>
                          <Label className="text-base font-medium">Upload de Laudo Médico</Label>
                          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-yellow-400 transition-colors mt-2">
                            {studentFormData.uploadLaudoMedico ? (
                              <div className="space-y-2">
                                <FileText className="w-8 h-8 text-green-600 mx-auto" />
                                <p className="text-sm text-green-600">✓ Laudo médico carregado</p>
                                <a 
                                  href={studentFormData.uploadLaudoMedico} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-xs text-blue-600 hover:underline"
                                >
                                  Ver arquivo
                                </a>
                              </div>
                            ) : (
                              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                            )}
                            <p className="text-sm text-gray-600 mb-2">Adicionar laudo médico</p>
                            <input
                              type="file"
                              id="medical-report-upload"
                              accept="image/jpeg,image/jpg,image/png,application/pdf"
                              className="hidden"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  try {
                                    if (file.size > 20 * 1024 * 1024) {
                                      toast({
                                        title: "Arquivo muito grande",
                                        description: "O arquivo deve ter no máximo 20MB.",
                                        variant: "destructive"
                                      });
                                      return;
                                    }

                                    const formData = new FormData();
                                    formData.append('file', file);

                                    const response = await fetch('/api/upload', {
                                      method: 'POST',
                                      body: formData,
                                    });

                                    if (!response.ok) {
                                      throw new Error('Erro no upload');
                                    }

                                    const result = await response.json();
                                    setStudentFormData({...studentFormData, uploadLaudoMedico: result.fileUrl});

                                    toast({
                                      title: "Laudo carregado",
                                      description: "Laudo médico carregado com sucesso.",
                                    });
                                  } catch (error) {
                                    toast({
                                      title: "Erro no upload",
                                      description: "Não foi possível carregar o arquivo. Tente novamente.",
                                      variant: "destructive"
                                    });
                                  }
                                }
                              }}
                            />
                            <Button 
                              variant="outline" 
                              size="sm" 
                              type="button"
                              onClick={() => document.getElementById('medical-report-upload')?.click()}
                            >
                              <FileText className="w-4 h-4 mr-2" />
                              Selecionar arquivo
                            </Button>
                            <p className="text-xs text-gray-500 mt-2">PDF, JPG, PNG até 20MB</p>
                          </div>
                        </div>
                      </div>

                      {/* Informações importantes */}
                      <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                        <h4 className="font-medium text-green-900 mb-2">Informações importantes sobre saúde:</h4>
                        <ul className="text-sm text-green-800 space-y-1">
                          <li>• Forneça informações precisas sobre condições de saúde</li>
                          <li>• Anexe laudos médicos quando necessário</li>
                          <li>• Medicamentos devem incluir nome e dosagem</li>
                          <li>• Essas informações são confidenciais e protegidas</li>
                        </ul>
                      </div>
                    </div>
                  )}

                  {/* Seção 8: Família */}
                  {studentFormStep === 8 && (
                    <div className="space-y-6">
                      <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2 border-b pb-3">
                        <span className="bg-yellow-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm">8</span>
                        Família
                      </h3>

                      <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="filhos">Quantos filhos?</Label>
                            <Input
                              id="filhos"
                              type="number"
                              value={studentFormData.filhos}
                              onChange={(e) => setStudentFormData({...studentFormData, filhos: e.target.value})}
                              placeholder="Número de filhos"
                            />
                          </div>
                          <div>
                            <Label htmlFor="moraCom">Com quem mora?</Label>
                            <Input
                              id="moraCom"
                              value={studentFormData.moraCom}
                              onChange={(e) => setStudentFormData({...studentFormData, moraCom: e.target.value})}
                              placeholder="Ex: Pais, avós, etc."
                            />
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="composicaoFamiliar">Composição familiar</Label>
                          <Textarea
                            id="composicaoFamiliar"
                            value={studentFormData.composicaoFamiliar}
                            onChange={(e) => setStudentFormData({...studentFormData, composicaoFamiliar: e.target.value})}
                            placeholder="Descreva a composição familiar e dinâmica da casa..."
                            rows={4}
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <Label htmlFor="rendaFamiliar">Renda familiar mensal</Label>
                            <Select value={studentFormData.rendaFamiliar} onValueChange={(value) => setStudentFormData({...studentFormData, rendaFamiliar: value})}>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="ate-1">Até 1 salário mínimo</SelectItem>
                                <SelectItem value="1-a-2">1 a 2 salários mínimos</SelectItem>
                                <SelectItem value="2-a-3">2 a 3 salários mínimos</SelectItem>
                                <SelectItem value="3-a-5">3 a 5 salários mínimos</SelectItem>
                                <SelectItem value="mais-5">Mais de 5 salários mínimos</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="situacaoMoradia">Situação da moradia</Label>
                            <Select value={studentFormData.situacaoMoradia} onValueChange={(value) => setStudentFormData({...studentFormData, situacaoMoradia: value})}>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="propria">Própria</SelectItem>
                                <SelectItem value="alugada">Alugada</SelectItem>
                                <SelectItem value="cedida">Cedida</SelectItem>
                                <SelectItem value="financiada">Financiada</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="tipoMoradia">Tipo de moradia</Label>
                            <Select value={studentFormData.tipoMoradia} onValueChange={(value) => setStudentFormData({...studentFormData, tipoMoradia: value})}>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="casa">Casa</SelectItem>
                                <SelectItem value="apartamento">Apartamento</SelectItem>
                                <SelectItem value="cortico">Cortiço</SelectItem>
                                <SelectItem value="barraco">Barraco</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Seção 9: Educação */}
                  {studentFormStep === 9 && (
                    <div className="space-y-6">
                      <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2 border-b pb-3">
                        <span className="bg-yellow-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm">9</span>
                        Educação
                      </h3>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="escolaridade">Escolaridade</Label>
                          <Select value={studentFormData.escolaridade} onValueChange={(value) => setStudentFormData({...studentFormData, escolaridade: value})}>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="fundamental-incompleto">Fundamental incompleto</SelectItem>
                              <SelectItem value="fundamental-completo">Fundamental completo</SelectItem>
                              <SelectItem value="medio-incompleto">Médio incompleto</SelectItem>
                              <SelectItem value="medio-completo">Médio completo</SelectItem>
                              <SelectItem value="superior-incompleto">Superior incompleto</SelectItem>
                              <SelectItem value="superior-completo">Superior completo</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="estudaAtualmente">Estuda atualmente?</Label>
                          <Select value={studentFormData.estudaAtualmente} onValueChange={(value) => setStudentFormData({...studentFormData, estudaAtualmente: value})}>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="sim">Sim</SelectItem>
                              <SelectItem value="nao">Não</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {studentFormData.estudaAtualmente === "sim" && (
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="nomeEscola">Nome da escola</Label>
                              <Input
                                id="nomeEscola"
                                value={studentFormData.nomeEscola}
                                onChange={(e) => setStudentFormData({...studentFormData, nomeEscola: e.target.value})}
                                placeholder="Nome da instituição de ensino"
                              />
                            </div>
                            <div>
                              <Label htmlFor="serieAno">Série/Ano</Label>
                              <Input
                                id="serieAno"
                                value={studentFormData.serieAno}
                                onChange={(e) => setStudentFormData({...studentFormData, serieAno: e.target.value})}
                                placeholder="Ex: 3º ano do ensino médio"
                              />
                            </div>
                          </div>
                          <div>
                            <Label htmlFor="turno">Turno</Label>
                            <Select value={studentFormData.turno} onValueChange={(value) => setStudentFormData({...studentFormData, turno: value})}>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="matutino">Matutino</SelectItem>
                                <SelectItem value="vespertino">Vespertino</SelectItem>
                                <SelectItem value="noturno">Noturno</SelectItem>
                                <SelectItem value="integral">Integral</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      )}

                      <div>
                        <Label htmlFor="observacoesEducacao">Observações sobre educação</Label>
                        <Textarea
                          id="observacoesEducacao"
                          value={studentFormData.observacoesEducacao}
                          onChange={(e) => setStudentFormData({...studentFormData, observacoesEducacao: e.target.value})}
                          placeholder="Informações relevantes sobre a vida escolar..."
                          rows={4}
                        />
                      </div>
                    </div>
                  )}

                  {/* Seção 10: Dados dos Pais e Responsável */}
                  {studentFormStep === 10 && (
                    <div className="space-y-6">
                      <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2 border-b pb-3">
                        <span className="bg-yellow-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm">10</span>
                        Dados dos Pais e Responsável
                      </h3>

                      <div className="space-y-8">
                        {/* Dados da Mãe */}
                        <div className="bg-pink-50 p-6 rounded-lg border border-pink-200">
                          <h4 className="text-lg font-medium text-gray-900 mb-4">
                            Dados da Mãe
                          </h4>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                              <Label htmlFor="nomeMae">Nome completo</Label>
                              <Input
                                id="nomeMae"
                                value={studentFormData.nomeMae}
                                onChange={(e) => setStudentFormData({...studentFormData, nomeMae: e.target.value})}
                                placeholder="Nome completo da mãe"
                              />
                            </div>
                            <div>
                              <Label htmlFor="cpfMae">CPF</Label>
                              <Input
                                id="cpfMae"
                                value={studentFormData.cpfMae}
                                onChange={(e) => setStudentFormData({...studentFormData, cpfMae: formatCPF(e.target.value)})}
                                placeholder="000.000.000-00"
                              />
                            </div>
                            <div>
                              <Label htmlFor="profissaoMae">Profissão</Label>
                              <Input
                                id="profissaoMae"
                                value={studentFormData.profissaoMae}
                                onChange={(e) => setStudentFormData({...studentFormData, profissaoMae: e.target.value})}
                                placeholder="Profissão da mãe"
                              />
                            </div>
                            <div>
                              <Label htmlFor="telefoneMae">Telefone / WhatsApp</Label>
                              <Input
                                id="telefoneMae"
                                value={studentFormData.telefoneMae}
                                onChange={(e) => setStudentFormData({...studentFormData, telefoneMae: e.target.value})}
                                placeholder="(00) 00000-0000"
                              />
                            </div>
                          </div>

                          <div className="mb-4">
                            <Label>Mora com o aluno?</Label>
                            <div className="flex gap-4 mt-2">
                              <label className="flex items-center gap-2">
                                <input
                                  type="radio"
                                  name="maeMoraComAluno"
                                  checked={studentFormData.maeMoraComAluno === 'sim'}
                                  onChange={() => setStudentFormData({...studentFormData, maeMoraComAluno: 'sim'})}
                                />
                                Sim
                              </label>
                              <label className="flex items-center gap-2">
                                <input
                                  type="radio"
                                  name="maeMoraComAluno"
                                  checked={studentFormData.maeMoraComAluno === 'nao'}
                                  onChange={() => setStudentFormData({...studentFormData, maeMoraComAluno: 'nao'})}
                                />
                                Não
                              </label>
                            </div>
                          </div>

                          <div>
                            <label className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={studentFormData.maeResponsavelLegal || false}
                                onChange={(e) => setStudentFormData({...studentFormData, maeResponsavelLegal: e.target.checked})}
                              />
                              <span className="font-medium">A mãe é responsável legal</span>
                            </label>
                          </div>
                        </div>

                        {/* Dados do Pai */}
                        <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                          <h4 className="text-lg font-medium text-gray-900 mb-4">
                            Dados do Pai
                          </h4>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                              <Label htmlFor="nomePai">Nome completo</Label>
                              <Input
                                id="nomePai"
                                value={studentFormData.nomePai}
                                onChange={(e) => setStudentFormData({...studentFormData, nomePai: e.target.value})}
                                placeholder="Nome completo do pai"
                              />
                            </div>
                            <div>
                              <Label htmlFor="cpfPai">CPF</Label>
                              <Input
                                id="cpfPai"
                                value={studentFormData.cpfPai}
                                onChange={(e) => setStudentFormData({...studentFormData, cpfPai: formatCPF(e.target.value)})}
                                placeholder="000.000.000-00"
                              />
                            </div>
                            <div>
                              <Label htmlFor="profissaoPai">Profissão</Label>
                              <Input
                                id="profissaoPai"
                                value={studentFormData.profissaoPai}
                                onChange={(e) => setStudentFormData({...studentFormData, profissaoPai: e.target.value})}
                                placeholder="Profissão do pai"
                              />
                            </div>
                            <div>
                              <Label htmlFor="telefonePai">Telefone / WhatsApp</Label>
                              <Input
                                id="telefonePai"
                                value={studentFormData.telefonePai}
                                onChange={(e) => setStudentFormData({...studentFormData, telefonePai: e.target.value})}
                                placeholder="(00) 00000-0000"
                              />
                            </div>
                          </div>

                          <div className="mb-4">
                            <Label>Mora com o aluno?</Label>
                            <div className="flex gap-4 mt-2">
                              <label className="flex items-center gap-2">
                                <input
                                  type="radio"
                                  name="paiMoraComAluno"
                                  checked={studentFormData.paiMoraComAluno === 'sim'}
                                  onChange={() => setStudentFormData({...studentFormData, paiMoraComAluno: 'sim'})}
                                />
                                Sim
                              </label>
                              <label className="flex items-center gap-2">
                                <input
                                  type="radio"
                                  name="paiMoraComAluno"
                                  checked={studentFormData.paiMoraComAluno === 'nao'}
                                  onChange={() => setStudentFormData({...studentFormData, paiMoraComAluno: 'nao'})}
                                />
                                Não
                              </label>
                            </div>
                          </div>

                          <div>
                            <label className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={studentFormData.paiResponsavelLegal || false}
                                onChange={(e) => setStudentFormData({...studentFormData, paiResponsavelLegal: e.target.checked})}
                              />
                              <span className="font-medium">O pai é responsável legal</span>
                            </label>
                          </div>
                        </div>

                        {/* Responsável Legal */}
                        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                          <h4 className="text-lg font-medium text-gray-900 mb-4">
                            Responsável Legal
                            <span className="text-sm text-red-600 font-normal">(obrigatório se não for pai ou mãe)</span>
                          </h4>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                              <Label htmlFor="nomeResponsavel">Nome completo *</Label>
                              <Input
                                id="nomeResponsavel"
                                value={studentFormData.nomeResponsavel}
                                onChange={(e) => setStudentFormData({...studentFormData, nomeResponsavel: e.target.value})}
                                placeholder="Nome completo do responsável"
                              />
                            </div>
                            <div>
                              <Label htmlFor="cpfResponsavel">CPF * (chave de identificação no sistema)</Label>
                              <Input
                                id="cpfResponsavel"
                                value={studentFormData.cpfResponsavel}
                                onChange={(e) => setStudentFormData({...studentFormData, cpfResponsavel: formatCPF(e.target.value)})}
                                placeholder="000.000.000-00"
                                className="border-red-200"
                              />
                            </div>
                            <div>
                              <Label htmlFor="grauParentesco">Grau de parentesco</Label>
                              <Input
                                id="grauParentesco"
                                value={studentFormData.grauParentesco}
                                onChange={(e) => setStudentFormData({...studentFormData, grauParentesco: e.target.value})}
                                placeholder="Ex: avó, tio, tutor legal"
                              />
                            </div>
                            <div>
                              <Label htmlFor="profissaoResponsavel">Profissão</Label>
                              <Input
                                id="profissaoResponsavel"
                                value={studentFormData.profissaoResponsavel}
                                onChange={(e) => setStudentFormData({...studentFormData, profissaoResponsavel: e.target.value})}
                                placeholder="Profissão do responsável"
                              />
                            </div>
                            <div>
                              <Label htmlFor="telefoneResponsavel">Telefone / WhatsApp</Label>
                              <Input
                                id="telefoneResponsavel"
                                value={studentFormData.telefoneResponsavel}
                                onChange={(e) => setStudentFormData({...studentFormData, telefoneResponsavel: e.target.value})}
                                placeholder="(00) 00000-0000"
                              />
                            </div>
                            <div>
                              <Label htmlFor="emailResponsavel">E-mail (opcional)</Label>
                              <Input
                                id="emailResponsavel"
                                type="email"
                                value={studentFormData.emailResponsavel}
                                onChange={(e) => setStudentFormData({...studentFormData, emailResponsavel: e.target.value})}
                                placeholder="email@exemplo.com"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label>Mora com o aluno?</Label>
                              <div className="flex gap-4 mt-2">
                                <label className="flex items-center gap-2">
                                  <input
                                    type="radio"
                                    name="responsavelMoraComAluno"
                                    checked={studentFormData.responsavelMoraComAluno === 'sim'}
                                    onChange={() => setStudentFormData({...studentFormData, responsavelMoraComAluno: 'sim'})}
                                  />
                                  Sim
                                </label>
                                <label className="flex items-center gap-2">
                                  <input
                                    type="radio"
                                    name="responsavelMoraComAluno"
                                    checked={studentFormData.responsavelMoraComAluno === 'nao'}
                                    onChange={() => setStudentFormData({...studentFormData, responsavelMoraComAluno: 'nao'})}
                                  />
                                  Não
                                </label>
                              </div>
                            </div>
                            <div>
                              <Label>É contato de emergência?</Label>
                              <div className="flex gap-4 mt-2">
                                <label className="flex items-center gap-2">
                                  <input
                                    type="radio"
                                    name="responsavelContatoEmergencia"
                                    checked={studentFormData.responsavelContatoEmergencia === 'sim'}
                                    onChange={() => setStudentFormData({...studentFormData, responsavelContatoEmergencia: 'sim'})}
                                  />
                                  Sim
                                </label>
                                <label className="flex items-center gap-2">
                                  <input
                                    type="radio"
                                    name="responsavelContatoEmergencia"
                                    checked={studentFormData.responsavelContatoEmergencia === 'nao'}
                                    onChange={() => setStudentFormData({...studentFormData, responsavelContatoEmergencia: 'nao'})}
                                  />
                                  Não
                                </label>
                              </div>
                            </div>
                          </div>
                        </div>


                      </div>
                    </div>
                  )}

                  {/* Seção 11: Observações */}
                  {studentFormStep === 11 && (
                    <div className="space-y-6">
                      <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2 border-b pb-3">
                        <span className="bg-yellow-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm">11</span>
                        Observações
                      </h3>

                      <div>
                        <Label htmlFor="observacoes">Campo de texto livre para anotações do professor ou coordenação</Label>
                        <Textarea
                          id="observacoes"
                          value={studentFormData.observacoes}
                          onChange={(e) => setStudentFormData({...studentFormData, observacoes: e.target.value})}
                          placeholder="Escreva aqui observações importantes sobre o aluno..."
                          rows={6}
                        />
                      </div>

                      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <h4 className="font-medium text-blue-900 mb-2">Informações importantes:</h4>
                        <ul className="text-sm text-blue-800 space-y-1">
                          <li>• Este campo é para uso interno da equipe</li>
                          <li>• Registre observações sobre comportamento, aprendizado ou necessidades especiais</li>
                          <li>• As informações aqui registradas ajudam no acompanhamento pedagógico</li>
                        </ul>
                      </div>
                    </div>
                  )}



                  {/* Navigation buttons - Responsivos */}
                  <div className="flex flex-col sm:flex-row sm:justify-between items-stretch sm:items-center gap-4 pt-6 border-t">
                    <Button
                      variant="outline"
                      onClick={() => setActiveSection("dashboard")}
                      className="w-full sm:w-auto"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Cancelar
                    </Button>
                    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                      {studentFormStep > 1 && (
                        <Button 
                          variant="outline"
                          onClick={() => setStudentFormStep(studentFormStep - 1)}
                          className="w-full sm:w-auto min-w-[120px]"
                        >
                          ← Anterior
                        </Button>
                      )}
                      <Button 
                        className="btn-yellow w-full sm:w-auto min-w-[120px]"
                        onClick={async () => {
                          if (studentFormStep < 11) {
                            setStudentFormStep(studentFormStep + 1);
                          } else {
                            // Final submission
                            const validationErrors = validateStudentForm(studentFormData);
                            
                            // Validar responsáveis legais
                            if (guardians.length === 0) {
                              validationErrors.guardians = 'Ao menos um responsável deve ser cadastrado';
                            } else {
                              const principalResponsible = guardians.find(g => 
                                g.isPrincipalResponsible || g.relationship === 'pai' || g.relationship === 'mae'
                              );
                              
                              if (!principalResponsible) {
                                validationErrors.guardians = 'Deve existir pelo menos um responsável principal (pai, mãe ou responsável legal)';
                              }
                            }
                            
                            if (Object.keys(validationErrors).length > 0) {
                              setStudentFormErrors(validationErrors);
                              setStudentFormStep(1); // Go back to first step with errors
                              toast({
                                title: "Erro na validação",
                                description: "Por favor, corrija os campos obrigatórios em vermelho.",
                                variant: "destructive",
                              });
                              return;
                            }
                            
                            try {
                              setStudentFormErrors({});
                              
                              // Primeiro, criar o aluno - mapear dados para formato do backend
                              const mappedStudentData = mapStudentFormToBackend(studentFormData);
                              await createStudentMutation.mutateAsync(mappedStudentData);
                              
                              // Depois, criar os responsáveis
                              for (const guardian of guardians) {
                                await createGuardianMutation.mutateAsync({
                                  ...guardian,
                                  studentCpf: studentFormData.cpf
                                });
                              }
                              
                              // Resetar formulário após sucesso
                              setGuardians([]);
                              setStudentFormStep(1);
                              
                              toast({
                                title: "Aluno e responsáveis registrados com sucesso!",
                                description: `${guardians.length} responsável(eis) cadastrado(s) para o aluno.`,
                              });
                              
                            } catch (error) {
                              toast({
                                title: "Erro ao registrar dados",
                                description: error.message,
                                variant: "destructive",
                              });
                            }
                          }
                        }}
                      >
                        {studentFormStep === 11 ? (
                          <>
                            <Save className="w-4 h-4 mr-2" />
                            Registrar aluno e responsáveis
                          </>
                        ) : (
                          "Próximo"
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            )}
          </div>
        );





      case "configuracoes":
        return (
          <div className="space-y-6">
            {/* Card de Configurações do Perfil */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Configurações
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Seção de Dados do Professor */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Dados do Perfil</h3>
                    
                    {/* Campos editáveis */}
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="config-name">Nome</Label>
                        <Input
                          id="config-name"
                          value={professorData.name}
                          onChange={(e) => setProfessorData({...professorData, name: e.target.value})}
                          placeholder="Seu nome completo"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="config-email">E-mail</Label>
                        <Input
                          id="config-email"
                          type="email"
                          value={professorData.email}
                          onChange={(e) => setProfessorData({...professorData, email: e.target.value})}
                          placeholder="seu.email@exemplo.com"
                          className="mt-1"
                        />
                      </div>
                      
                      {/* Botão Salvar */}
                      <Button onClick={handleSaveProfile} className="btn-yellow w-full md:w-auto">
                        <Save className="w-4 h-4 mr-2" />
                        Salvar alterações
                      </Button>
                    </div>
                  </div>
                  
                  {/* Botão Sair do Sistema */}
                  <div className="pt-6 border-t border-gray-200">
                    <Button 
                      onClick={handleLogout} 
                      variant="destructive" 
                      className="w-full md:w-auto bg-red-600 hover:bg-red-700"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Sair do sistema
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case "calendario-eventos":
        const today = new Date();
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();
        const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        
        const monthNames = [
          "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
          "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
        ];
        
        const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
        
        // Gerar dias do calendário
        const calendarDays = [];
        
        // Adicionar espaços vazios para os dias antes do primeiro dia do mês
        for (let i = 0; i < firstDayOfMonth; i++) {
          calendarDays.push(null);
        }
        
        // Adicionar os dias do mês
        for (let day = 1; day <= daysInMonth; day++) {
          const isToday = day === today.getDate();
          calendarDays.push({ day, isToday });
        }

        return (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Calendário e Eventos</h2>
              <div className="flex gap-2">
                <Button onClick={() => setShowEventModal(true)} className="bg-yellow-500 hover:bg-yellow-600">
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Evento
                </Button>
                <Button onClick={() => setShowReminderModal(true)} variant="outline">
                  <Bell className="w-4 h-4 mr-2" />
                  Lembrete
                </Button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Calendar Grid */}
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">
                    {currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                  </h3>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                {/* Calendar Days Header */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
                    <div key={day} className="text-center text-sm font-medium text-gray-500 p-2">
                      {day}
                    </div>
                  ))}
                </div>
                
                {/* Calendar Days Grid */}
                <div className="grid grid-cols-7 gap-1">
                  {getDaysInMonth(currentDate).map((date, index) => {
                    const isCurrentMonth = date.getMonth() === currentDate.getMonth();
                    const isToday = date.toDateString() === new Date().toDateString();
                    const dayEvents = getEventsForDate(date);
                    
                    return (
                      <div
                        key={index}
                        className={`
                          relative p-2 h-16 border rounded-lg cursor-pointer transition-colors group
                          ${isCurrentMonth ? 'bg-white hover:bg-gray-50' : 'bg-gray-100 text-gray-400'}
                          ${isToday ? 'border-yellow-500 bg-yellow-50' : 'border-gray-200'}
                        `}
                        onClick={() => {
                          if (dayEvents.length > 0) {
                            setSelectedDateEvents(dayEvents);
                            setSelectedDate(date);
                            setShowEventDetailsModal(true);
                          }
                        }}
                      >
                        <div className="text-sm font-medium">
                          {date.getDate()}
                        </div>
                        {dayEvents.length > 0 && (
                          <>
                            <div className="absolute bottom-1 left-1 right-1">
                              <div className="flex gap-1">
                                {dayEvents.slice(0, 2).map((event, idx) => (
                                  <div
                                    key={idx}
                                    className={`w-2 h-2 rounded-full ${
                                      event.tipo === 'lembrete' ? 'bg-purple-400' : 
                                      event.tipo === 'aula' ? 'bg-blue-400' : 'bg-green-400'
                                    }`}
                                  />
                                ))}
                                {dayEvents.length > 2 && (
                                  <span className="text-xs text-gray-500">+{dayEvents.length - 2}</span>
                                )}
                              </div>
                            </div>
                            {/* Tooltip on hover */}
                            <div className="absolute z-10 invisible group-hover:visible bg-black text-white p-2 rounded text-xs shadow-lg bottom-full left-0 mb-1 w-48">
                              {dayEvents.map((event, idx) => (
                                <div key={idx} className="mb-1 last:mb-0">
                                  <div className="font-medium">{event.titulo}</div>
                                  {event.horaInicio && <div>{event.horaInicio}</div>}
                                </div>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </Card>

              {/* Events List */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Próximos Eventos</h3>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {eventsLoading ? (
                    <div className="text-center py-8 text-gray-500">
                      <div className="animate-spin w-6 h-6 border-2 border-yellow-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                      <p>Carregando eventos...</p>
                    </div>
                  ) : calendarEvents.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>Nenhum evento agendado</p>
                      <p className="text-sm mt-2">Clique em "Novo Evento" para começar</p>
                    </div>
                  ) : (
                    calendarEvents
                      .sort((a, b) => new Date(a.data) - new Date(b.data))
                      .map((event) => (
                        <div key={event.id} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                          <div className={`w-3 h-3 rounded-full ${
                            event.tipo === 'lembrete' ? 'bg-purple-400' : 
                            event.tipo === 'aula' ? 'bg-blue-400' : 'bg-green-400'
                          }`} />
                          <div className="flex-1">
                            <div className="font-medium">{event.titulo}</div>
                            <div className="text-sm text-gray-500">
                              {new Date(event.data).toLocaleDateString('pt-BR')}
                              {event.horaInicio && ` às ${event.horaInicio}`}
                            </div>
                            {event.descricao && (
                              <div className="text-sm text-gray-600 mt-1">{event.descricao}</div>
                            )}
                          </div>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => {
                              setEventToDelete(event);
                              setShowDeleteConfirmModal(true);
                            }}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      ))
                  )}
                </div>
              </Card>
            </div>

            {/* Opções para Adicionar */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Adicionar Lembrete */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-yellow-600">
                    <Bell className="w-5 h-5" />
                    Adicionar Lembrete
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="reminder-title" className="text-gray-700">Título *</Label>
                      <Input
                        id="reminder-title"
                        value={newReminder.title}
                        onChange={(e) => setNewReminder({...newReminder, title: e.target.value})}
                        placeholder="Título do lembrete"
                        className="border-yellow-200 focus:border-yellow-400"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="reminder-date" className="text-gray-700">Data *</Label>
                        <Input
                          id="reminder-date"
                          type="date"
                          value={newReminder.date}
                          onChange={(e) => setNewReminder({...newReminder, date: e.target.value})}
                          className="border-yellow-200 focus:border-yellow-400"
                        />
                      </div>
                      <div>
                        <Label htmlFor="reminder-time" className="text-gray-700">Horário</Label>
                        <Input
                          id="reminder-time"
                          type="time"
                          value={newReminder.time}
                          onChange={(e) => setNewReminder({...newReminder, time: e.target.value})}
                          className="border-yellow-200 focus:border-yellow-400"
                        />
                      </div>
                    </div>
                    <Button onClick={handleAddReminder} className="w-full btn-yellow">
                      <Bell className="w-4 h-4 mr-2" />
                      Criar Lembrete
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Adicionar Evento */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-yellow-600">
                    <Calendar className="w-5 h-5" />
                    Adicionar Evento
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="event-title" className="text-gray-700">Título *</Label>
                      <Input
                        id="event-title"
                        value={newEvent.title}
                        onChange={(e) => setNewEvent({...newEvent, title: e.target.value})}
                        placeholder="Nome do evento"
                        className="border-yellow-200 focus:border-yellow-400"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="event-date" className="text-gray-700">Data *</Label>
                        <Input
                          id="event-date"
                          type="date"
                          value={newEvent.date}
                          onChange={(e) => setNewEvent({...newEvent, date: e.target.value})}
                          className="border-yellow-200 focus:border-yellow-400"
                        />
                      </div>
                      <div>
                        <Label htmlFor="event-time" className="text-gray-700">Horário *</Label>
                        <Input
                          id="event-time"
                          type="time"
                          value={newEvent.time}
                          onChange={(e) => setNewEvent({...newEvent, time: e.target.value})}
                          className="border-yellow-200 focus:border-yellow-400"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="event-type" className="text-gray-700">Tipo</Label>
                      <Select value={newEvent.type} onValueChange={(value) => setNewEvent({...newEvent, type: value})}>
                        <SelectTrigger className="border-yellow-200 focus:border-yellow-400">
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="aula">Aula</SelectItem>
                          <SelectItem value="reuniao">Reunião</SelectItem>
                          <SelectItem value="evento">Evento</SelectItem>
                          <SelectItem value="avaliacao">Avaliação</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button onClick={handleAddEvent} className="w-full btn-yellow">
                      <Plus className="w-4 h-4 mr-2" />
                      Criar Evento
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Lista de Lembretes e Eventos */}
            {(reminders.length > 0 || calendarEvents.length > 0) && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Meus Lembretes */}
                {reminders.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-yellow-600">Meus Lembretes</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {reminders.map((reminder) => (
                          <div key={reminder.id} className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium text-sm text-gray-900">{reminder.title}</p>
                                <p className="text-xs text-gray-600 mt-1">
                                  {reminder.date} {reminder.time && `às ${reminder.time}`}
                                </p>
                              </div>
                              <Bell className="w-4 h-4 text-yellow-600" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}


              </div>
            )}

            {/* Modais para Calendário */}
            {/* Modal para Novo Evento */}
            <Dialog open={showEventModal} onOpenChange={setShowEventModal}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Criar Novo Evento</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="event-title">Título *</Label>
                    <Input
                      id="event-title"
                      value={newEvent.title}
                      onChange={(e) => setNewEvent({...newEvent, title: e.target.value})}
                      placeholder="Título do evento"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="event-date">Data *</Label>
                      <Input
                        id="event-date"
                        type="date"
                        value={newEvent.date}
                        onChange={(e) => setNewEvent({...newEvent, date: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="event-time">Horário</Label>
                      <Input
                        id="event-time"
                        type="time"
                        value={newEvent.time}
                        onChange={(e) => setNewEvent({...newEvent, time: e.target.value})}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="event-type">Tipo</Label>
                    <Select value={newEvent.type} onValueChange={(value) => setNewEvent({...newEvent, type: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="evento">Evento</SelectItem>
                        <SelectItem value="aula">Aula</SelectItem>
                        <SelectItem value="reuniao">Reunião</SelectItem>
                        <SelectItem value="outro">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="event-description">Descrição</Label>
                    <Textarea
                      id="event-description"
                      value={newEvent.description}
                      onChange={(e) => setNewEvent({...newEvent, description: e.target.value})}
                      placeholder="Descrição do evento..."
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter className="flex gap-2">
                  <Button variant="outline" onClick={() => setShowEventModal(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleAddEvent} className="bg-yellow-500 hover:bg-yellow-600">
                    <Plus className="w-4 h-4 mr-2" />
                    Criar Evento
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Modal para Novo Lembrete */}
            <Dialog open={showReminderModal} onOpenChange={setShowReminderModal}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Criar Novo Lembrete</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="reminder-title">Título *</Label>
                    <Input
                      id="reminder-title"
                      value={newReminder.title}
                      onChange={(e) => setNewReminder({...newReminder, title: e.target.value})}
                      placeholder="Título do lembrete"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="reminder-date">Data *</Label>
                      <Input
                        id="reminder-date"
                        type="date"
                        value={newReminder.date}
                        onChange={(e) => setNewReminder({...newReminder, date: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="reminder-time">Horário</Label>
                      <Input
                        id="reminder-time"
                        type="time"
                        value={newReminder.time}
                        onChange={(e) => setNewReminder({...newReminder, time: e.target.value})}
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter className="flex gap-2">
                  <Button variant="outline" onClick={() => setShowReminderModal(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleAddReminder} className="bg-purple-500 hover:bg-purple-600">
                    <Bell className="w-4 h-4 mr-2" />
                    Criar Lembrete
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Modal para Detalhes de Eventos do Dia */}
            <Dialog open={showEventDetailsModal} onOpenChange={setShowEventDetailsModal}>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>
                    Eventos de {selectedDate && selectedDate.toLocaleDateString('pt-BR')}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {selectedDateEvents.map((event) => (
                    <div key={event.id} className="flex items-start gap-3 p-3 border rounded-lg">
                      <div className={`w-3 h-3 rounded-full mt-1 ${
                        event.tipo === 'lembrete' ? 'bg-purple-400' : 
                        event.tipo === 'aula' ? 'bg-blue-400' : 'bg-green-400'
                      }`} />
                      <div className="flex-1">
                        <div className="font-medium">{event.titulo}</div>
                        <div className="text-sm text-gray-500">
                          {event.horaInicio && `${event.horaInicio} - ${event.horaFim || 'Fim não definido'}`}
                        </div>
                        {event.descricao && (
                          <div className="text-sm text-gray-600 mt-1">{event.descricao}</div>
                        )}
                        <div className="text-xs text-gray-400 mt-1 capitalize">
                          {event.tipo}
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => {
                          setEventToDelete(event);
                          setShowDeleteConfirmModal(true);
                          setShowEventDetailsModal(false);
                        }}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  ))}
                </div>
                <DialogFooter>
                  <Button onClick={() => setShowEventDetailsModal(false)}>
                    Fechar
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Modal de Confirmação de Exclusão */}
            <AlertDialog open={showDeleteConfirmModal} onOpenChange={setShowDeleteConfirmModal}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                  <AlertDialogDescription>
                    Tem certeza que deseja excluir o evento "{eventToDelete?.titulo}"?
                    Esta ação não pode ser desfeita.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => setShowDeleteConfirmModal(false)}>
                    Cancelar
                  </AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleDeleteEvent}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Excluir
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>


          </div>
        );

      case "acompanhamento":
        return <AcompanhamentoModule professorId={professorData.id} />;

      case "relatorios":
        if (!isLeader) {
          return (
            <div className="text-center py-16 space-y-4">
              <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mx-auto">
                <Download className="w-12 h-12 text-red-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Acesso Restrito</h3>
              <p className="text-gray-600 max-w-md mx-auto">
                Apenas líderes podem gerar relatórios do sistema. Esta funcionalidade requer permissões administrativas especiais.
              </p>
              <div className="flex flex-col items-center gap-2">
                <Badge variant="outline" className="text-red-600 border-red-200">
                  👤 Professor: Permissão Negada
                </Badge>
                <p className="text-sm text-gray-500">
                  Tipo de acesso necessário: <strong>Líder</strong>
                </p>
              </div>
            </div>
          );
        }
        return <RelatoriosModule professorId={professorData.id} />;

      default:
        return null;
    }
  };

  const handleMenuClick = (itemId) => {
    if (itemId === 'mais') {
      setShowMoreMenu(true);
    } else {
      setActiveSection(itemId);
      setShowMoreMenu(false);
    }
  };

  const handleMoreMenuItemClick = (itemId) => {
    setActiveSection(itemId);
    setShowMoreMenu(false);
  };

  const getSectionTitle = (sectionId) => {
    // Procurar primeiro nos menuItems
    let item = menuItems.find(item => item.id === sectionId);
    
    // Se não encontrar, procurar nos moreMenuItems
    if (!item) {
      item = moreMenuItems.find(item => item.id === sectionId);
    }
    
    if (item) {
      switch (sectionId) {
        case "agenda":
          return "Agenda";
        default:
          return item.label;
      }
    }
    return "Dashboard";
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Menu Lateral - Desktop */}
      <div className="hidden md:block w-64 bg-white shadow-lg border-r">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-8">
            <img src={logoClube} alt="Clube do Grito" className="w-10 h-10 object-contain" />
            <div>
              <h2 className="font-bold text-gray-900">{professorData.name}</h2>
              <p className="text-sm text-gray-600">Professor</p>
            </div>
          </div>
          
          <nav className="space-y-4">
            {menuItems.map((item, index) => (
              <div key={item.id}>
                <div
                  className="flex items-center gap-4 px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors duration-200 bg-gray-50"
                  onClick={() => handleMenuClick(item.id)}
                >
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                    activeSection === item.id ? 'bg-yellow-400' : 'bg-yellow-400'
                  }`}>
                    <item.icon className="w-6 h-6 text-black" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 text-base" style={{ fontFamily: 'SF Pro Rounded, -apple-system, BlinkMacSystemFont, system-ui, sans-serif' }}>
                      {item.label}
                    </h3>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                </div>
                {index < menuItems.length - 1 && (
                  <div className="border-b border-gray-100 mx-4"></div>
                )}
              </div>
            ))}
          </nav>
        </div>
      </div>

      {/* Layout Mobile e Desktop */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Header Desktop */}
        <div className="hidden md:block bg-white shadow-sm border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-gray-900">
              {getSectionTitle(activeSection)}
            </h1>
          </div>
        </div>

        {/* Header Mobile - Fixo e Consistente */}
        <div className="md:hidden bg-white shadow-sm border-b fixed top-0 left-0 right-0 z-40">
          <div className="px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img src={logoClube} alt="Clube do Grito" className="w-8 h-8 object-contain" />
                <div>
                  <h2 className="text-base font-semibold text-gray-900 truncate">
                    Prof. {professorData.name}
                  </h2>
                </div>
              </div>
              <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                {getSectionTitle(activeSection)}
              </div>
            </div>
          </div>
        </div>

        {/* Conteúdo Principal - Padronizado Mobile */}
        <div className="flex-1 overflow-auto pt-16 md:pt-0 pb-20 md:pb-0">
          <div className="p-3 md:p-6 max-w-full">
            {renderContent()}
          </div>
        </div>

        {/* Menu Inferior Mobile - FIXO e PADRONIZADO */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-2xl z-50">
          <div className="grid grid-cols-4 h-16">
            {mobileMenuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleMenuClick(item.id)}
                className={`flex flex-col items-center justify-center py-1 transition-all duration-200 ${
                  (activeSection === item.id || (item.id === 'mais' && showMoreMenu))
                    ? 'bg-yellow-50 text-yellow-700 border-t-2 border-yellow-500' 
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <item.icon className={`w-5 h-5 mb-0.5 ${
                  (activeSection === item.id || (item.id === 'mais' && showMoreMenu)) ? 'text-yellow-600' : 'text-gray-500'
                }`} />
                <span className={`text-xs font-medium leading-tight text-center ${
                  (activeSection === item.id || (item.id === 'mais' && showMoreMenu)) ? 'text-yellow-700' : 'text-gray-500'
                }`}>
                  {item.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Modal "Mais" - Mobile */}
        {showMoreMenu && (
          <div className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-60" onClick={() => setShowMoreMenu(false)}>
            <div className="absolute bottom-20 left-4 right-4 bg-white rounded-lg shadow-xl max-h-96 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Mais opções</h3>
                  <button 
                    onClick={() => setShowMoreMenu(false)}
                    className="p-2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {moreMenuItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleMoreMenuItemClick(item.id)}
                      className={`flex flex-col items-center p-4 rounded-lg border transition-all duration-200 ${
                        activeSection === item.id 
                          ? 'bg-yellow-100 text-yellow-700 border-yellow-300' 
                          : 'text-gray-600 border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <item.icon className={`w-6 h-6 mb-2 ${
                        activeSection === item.id ? 'text-yellow-600' : 'text-gray-500'
                      }`} />
                      <span className={`text-sm font-medium text-center ${
                        activeSection === item.id ? 'text-yellow-700' : 'text-gray-700'
                      }`}>
                        {item.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Visualização de Dados do Aluno - FORA do container principal */}
      {showViewModal && selectedStudentForView && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
          style={{ 
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 999999
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowViewModal(false);
            }
          }}
        >
          <div 
            className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="border-b p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  Dados do Aluno
                </h2>
                <button 
                  onClick={() => setShowViewModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Informações Básicas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Informações Pessoais</h3>
                  <div className="space-y-3">
                    <div>
                      <span className="font-medium text-gray-700">Nome Completo:</span>
                      <p className="text-gray-900">{selectedStudentForView.nome_completo || 'Não informado'}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">CPF:</span>
                      <p className="text-gray-900">{selectedStudentForView.cpf || 'Não informado'}</p>
                    </div>
                    {selectedStudentForView.data_nascimento && (
                      <div>
                        <span className="font-medium text-gray-700">Data de Nascimento:</span>
                        <p className="text-gray-900">{new Date(selectedStudentForView.data_nascimento).toLocaleDateString('pt-BR')}</p>
                      </div>
                    )}
                    {selectedStudentForView.genero && (
                      <div>
                        <span className="font-medium text-gray-700">Gênero:</span>
                        <p className="text-gray-900">{selectedStudentForView.genero}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Contato</h3>
                  <div className="space-y-3">
                    {selectedStudentForView.telefone && (
                      <div>
                        <span className="font-medium text-gray-700">Telefone:</span>
                        <p className="text-gray-900">{selectedStudentForView.telefone}</p>
                      </div>
                    )}
                    {selectedStudentForView.email && (
                      <div>
                        <span className="font-medium text-gray-700">Email:</span>
                        <p className="text-gray-900">{selectedStudentForView.email}</p>
                      </div>
                    )}
                    {selectedStudentForView.municipio && (
                      <div>
                        <span className="font-medium text-gray-700">Cidade:</span>
                        <p className="text-gray-900">{selectedStudentForView.municipio}/{selectedStudentForView.estado}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Dados Complementares */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  {selectedStudentForView.escolaridade && (
                    <div>
                      <span className="font-medium text-gray-700">Escolaridade:</span>
                      <p className="text-gray-900">{selectedStudentForView.escolaridade}</p>
                    </div>
                  )}
                  {selectedStudentForView.religiao && (
                    <div>
                      <span className="font-medium text-gray-700">Religião:</span>
                      <p className="text-gray-900">{selectedStudentForView.religiao}</p>
                    </div>
                  )}
                </div>
                <div className="space-y-3">
                  {selectedStudentForView.nacionalidade && (
                    <div>
                      <span className="font-medium text-gray-700">Nacionalidade:</span>
                      <p className="text-gray-900">{selectedStudentForView.nacionalidade}</p>
                    </div>
                  )}
                  {selectedStudentForView.estado_civil && (
                    <div>
                      <span className="font-medium text-gray-700">Estado Civil:</span>
                      <p className="text-gray-900">{selectedStudentForView.estado_civil}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Observações */}
              {selectedStudentForView.observacoes_gerais && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Observações Gerais</h3>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-gray-700">{selectedStudentForView.observacoes_gerais}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t p-6 flex justify-end gap-3">
              <button
                onClick={() => setShowViewModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Fechar
              </button>
              <button
                onClick={() => {
                  setShowViewModal(false);
                  loadStudentData(selectedStudentForView);
                }}
                className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg flex items-center gap-2"
              >
                <Edit className="w-4 h-4" />
                Editar Dados
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


