import React, { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import * as XLSX from 'xlsx';
import PptxGenJS from "pptxgenjs";

import logoClube from "@assets/LOGO_CLUBE-05_1752081350082.png";
import { 
  Users, Clock, FileText, Eye, Calendar as CalendarIcon, Download, Edit, Settings, LogOut, 
  Plus, Check, X, AlertCircle, BookOpen, Target, Bell, Filter, BarChart, UserPlus, User, Save, Search, ChevronLeft, ChevronRight, ArrowLeft, Trophy, Star, Zap, Home, Activity, School, Camera, Upload, FileDown
} from "lucide-react";

import { z } from "zod";
import { ProjectForm, ActivityForm, InstanceForm, EnrollmentForm, SessionForm } from '@/components/pec/forms';
import { PhotoGallery } from '@/components/pec/photo-gallery';

// Router component to handle different PEC routes
export default function PecRouter() {
  const params = useParams();
  const [location] = useLocation();

  console.log('🔄 [PEC ROUTER] Location:', location, 'Params:', params);

  // Route to specific components based on URL
  if (location === '/pec') {
    console.log('📊 [PEC ROUTER] Renderizando PecDashboard');
    return <PecDashboard />;
  }
  if (location.startsWith('/pec/projetos/')) {
    console.log('📂 [PEC ROUTER] Renderizando ProjectDetail:', params.projectId);
    return <ProjectDetail projectId={params.projectId} />;
  }
  if (location.startsWith('/pec/atividades/')) {
    console.log('📚 [PEC ROUTER] Renderizando ActivityDetail:', params.activityId);
    return <ActivityDetail activityId={params.activityId} />;
  }
  if (location.startsWith('/pec/turmas/')) {
    console.log('🎓 [PEC ROUTER] Renderizando InstanceDetail:', params.instanceId);
    return <InstanceDetail instanceId={params.instanceId} />;
  }

  console.log('📊 [PEC ROUTER] Renderizando PecDashboard (fallback)');
  return <PecDashboard />;
}

// Schemas for forms
const projectSchema = z.object({
  name: z.string().min(1, "Nome do projeto é obrigatório"),
  description: z.string().min(1, "Descrição é obrigatória"),
  start_date: z.date({ required_error: "Data de início é obrigatória" }),
  end_date: z.date({ required_error: "Data de fim é obrigatória" }),
  category: z.string().min(1, "Categoria é obrigatória"),
  who_can_participate: z.string().min(1, "Campo obrigatório"),
  coordinator_id: z.number().min(1)
});

const activitySchema = z.object({
  project_id: z.number().min(1, "Projeto é obrigatório"),
  name: z.string().min(1, "Nome da atividade é obrigatório"),
  description: z.string().min(1, "Descrição é obrigatória"),
  day_period: z.enum(['matutino', 'vespertino', 'noturno'], {
    required_error: "Período do dia é obrigatório"
  }),
  requires_attendance: z.boolean().default(true)
});

const instanceSchema = z.object({
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
  day_period: z.enum(['matutino', 'vespertino', 'noturno'], {
    required_error: "Período do dia é obrigatório"
  }),
  total_hours: z.number().optional(),
  observations: z.string().optional()
});

const educadorSchema = z.object({
  cpf: z.string().min(11, "CPF é obrigatório (11 dígitos)").max(11),
  nome_completo: z.string().min(1, "Nome completo é obrigatório"),
  data_nascimento: z.date({ required_error: "Data de nascimento é obrigatória" }),
  telefone: z.string().min(10, "Telefone é obrigatório"),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  endereco: z.string().min(1, "Endereço é obrigatório"),
  formacao: z.string().min(1, "Formação é obrigatória"),
  experiencia: z.string().optional(),
  foto_perfil: z.string().optional(),
  observacoes: z.string().optional()
});

// Main Dashboard Component
function PecDashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Filters state
  const [filters, setFilters] = useState({
    year: new Date().getFullYear(),
    project: 'all',
    activity: 'all',
    status: 'todas'
  });
  
  // Form states
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [showActivityForm, setShowActivityForm] = useState(false);
  const [showInstanceForm, setShowInstanceForm] = useState(false);
  const [showEnrollmentForm, setShowEnrollmentForm] = useState(false);
  const [showSessionForm, setShowSessionForm] = useState(false);
  const [showEducadorForm, setShowEducadorForm] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [editingActivity, setEditingActivity] = useState<any>(null);
  
  // View modal states
  const [showProjectViewModal, setShowProjectViewModal] = useState(false);
  const [showActivityViewModal, setShowActivityViewModal] = useState(false);
  const [viewingProject, setViewingProject] = useState<any>(null);
  const [viewingActivity, setViewingActivity] = useState<any>(null);
  
  // Queries for dashboard data with filters applied
  const { data: projects = [], isLoading: loadingProjects } = useQuery({
    queryKey: ['/api/projects', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.year) params.append('year', filters.year.toString());
      if (filters.project && filters.project !== 'all') params.append('projectId', filters.project);
      if (filters.status && filters.status !== 'todas') params.append('status', filters.status);
      
      const url = `/api/projects${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch projects');
      return response.json();
    }
  }) as { data: any[], isLoading: boolean };

  const { data: activities = [], isLoading: loadingActivities } = useQuery({
    queryKey: ['/api/pec/activities', filters], 
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.year) params.append('year', filters.year.toString());
      if (filters.project && filters.project !== 'all') params.append('projectId', filters.project);
      if (filters.activity && filters.activity !== 'all') params.append('activityId', filters.activity);
      
      const url = `/api/pec/activities${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch activities');
      return response.json();
    }
  }) as { data: any[], isLoading: boolean };

  const { data: instances = [], isLoading: loadingInstances } = useQuery({
    queryKey: ['/api/pec/instances', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.year) params.append('year', filters.year.toString());
      if (filters.project && filters.project !== 'all') params.append('projectId', filters.project);
      if (filters.activity && filters.activity !== 'all') params.append('activityId', filters.activity);
      if (filters.status && filters.status !== 'todas') {
        // Mapear vocabulário de status da UI para backend
        const statusMap: { [key: string]: string } = {
          'ativa': 'execucao',
          'planejamento': 'planejamento', 
          'encerrada': 'encerrada'
        };
        params.append('status', statusMap[filters.status] || filters.status);
      }
      
      const url = `/api/pec/instances${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch instances');
      return response.json();
    }
  }) as { data: any[], isLoading: boolean };

  const { data: reports = [], isLoading: loadingReports } = useQuery({
    queryKey: ['/api/pec/reports', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.year) params.append('year', filters.year.toString());
      if (filters.project && filters.project !== 'all') params.append('projectId', filters.project);
      if (filters.activity && filters.activity !== 'all') params.append('activityId', filters.activity);
      if (filters.status && filters.status !== 'todas') params.append('status', filters.status);
      
      const url = `/api/pec/reports${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch reports');
      return response.json();
    }
  }) as { data: any[], isLoading: boolean };

  // Stats calculations
  const stats = {
    totalProjects: projects.length || 0,
    totalActivities: activities.length || 0,
    activeInstances: instances.filter((i: any) => i.situation === 'execucao').length || 0,
    pendingReports: reports.filter((r: any) => r.status === 'pendente').length || 0
  };

  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    setLocation('/entrar');
  };

  // Report and export handlers - Agora gera slides PowerPoint

  // Função para gerar relatório Excel do dashboard geral
  const handleGenerateExcelDashboard = () => {
    try {
      // Criar workbook
      const wb = XLSX.utils.book_new();
      
      // Planilha 1: Resumo Executivo
      const resumoData = [
        ['RELATÓRIO EXECUTIVO PEC - CLUBE DO GRITO'],
        ['Data de Geração:', format(new Date(), 'dd/MM/yyyy HH:mm', { locale: pt })],
        [''],
        ['INDICADORES GERAIS'],
        ['Total de Projetos:', projects.length],
        ['Total de Atividades:', activities.length],
        ['Total de Turmas:', instances.length],
        ['Total de Educadores:', 0], // TODO: Implementar query para educadores
        [''],
        ['STATUS DAS TURMAS'],
      ];
      
      // Adicionar dados de situação das turmas
      const situacaoContador = instances.reduce((acc: any, instance: any) => {
        acc[instance.situation || 'indefinido'] = (acc[instance.situation || 'indefinido'] || 0) + 1;
        return acc;
      }, {});
      
      Object.entries(situacaoContador).forEach(([situacao, count]) => {
        resumoData.push([`${situacao}:`, String(count)]);
      });
      
      const ws1 = XLSX.utils.aoa_to_sheet(resumoData);
      XLSX.utils.book_append_sheet(wb, ws1, 'Resumo Executivo');
      
      // Planilha 2: Detalhes dos Projetos
      const projetosHeaders = ['ID', 'Nome', 'Categoria', 'Data Início', 'Data Fim', 'Coordenador', 'Descrição'];
      const projetosData = projects.map((project: any) => [
        project.id,
        project.name,
        project.category || 'SCFV',
        project.start_date,
        project.end_date,
        project.coordinator_name || 'N/A',
        project.description
      ]);
      
      const ws2 = XLSX.utils.aoa_to_sheet([projetosHeaders, ...projetosData]);
      XLSX.utils.book_append_sheet(wb, ws2, 'Projetos');
      
      // Planilha 3: Turmas Detalhadas
      const turmasHeaders = ['ID Turma', 'Nome Atividade', 'Projeto', 'Situação', 'Local', 'Data Criação'];
      const turmasData = instances.map((instance: any) => {
        const activity = activities.find(a => a.id === instance.activity_id);
        const project = projects.find(p => p.id === activity?.project_id);
        
        return [
          instance.id,
          activity?.name || 'N/A',
          project?.name || 'N/A',
          instance.situation || 'N/A',
          instance.location || 'N/A',
          instance.created_at ? format(new Date(instance.created_at), 'dd/MM/yyyy', { locale: pt }) : 'N/A'
        ];
      });
      
      const ws3 = XLSX.utils.aoa_to_sheet([turmasHeaders, ...turmasData]);
      XLSX.utils.book_append_sheet(wb, ws3, 'Turmas');
      
      // Salvar arquivo
      const fileName = `relatorio-pec-completo-${format(new Date(), 'yyyy-MM-dd-HHmm', { locale: pt })}.xlsx`;
      XLSX.writeFile(wb, fileName);
      
      toast({
        title: "Relatório Excel gerado! 📊",
        description: `Arquivo "${fileName}" foi baixado automaticamente.`
      });
      
    } catch (error) {
      console.error('Erro ao gerar relatório Excel:', error);
      toast({
        title: "Erro ao gerar relatório Excel",
        description: "Tente novamente mais tarde.",
        variant: "destructive"
      });
    }
  };

  const handleExportTurmasCSV = () => {
    try {
      // Criar CSV com dados completos de turmas (mais útil que só projetos)
      const csvHeaders = [
        'ID Turma', 'Nome Atividade', 'Projeto', 'Situação', 
        'Data Criação', 'Categoria Projeto', 'Descrição Atividade'
      ];
      
      // Combinar dados de turmas, atividades e projetos
      const csvData = instances.map((instance: any) => {
        const activity = activities.find(a => a.id === instance.activity_id);
        const project = projects.find(p => p.id === activity?.project_id);
        
        return [
          instance.id,
          activity?.name || 'N/A',
          project?.name || 'N/A',
          instance.situation === 'execucao' ? 'Em Execução' : (instance.situation || 'N/A'),
          instance.created_at ? new Date(instance.created_at).toLocaleDateString('pt-BR') : '',
          project?.category || 'SCFV',
          activity?.description || ''
        ];
      });
      
      // Criar conteúdo CSV
      const csvContent = [
        csvHeaders.join(','),
        ...csvData.map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
      ].join('\n');
      
      // Download do arquivo
      const csvBlob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(csvBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `turmas-pec-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "CSV exportado",
        description: `${instances.length} turmas exportadas com sucesso.`
      });
    } catch (error) {
      console.error('Erro ao exportar CSV:', error);
      toast({
        title: "Erro", 
        description: "Falha ao exportar CSV. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  const handleGenerateSlides = async () => {
    try {
      // Criar nova apresentação
      const pres = new PptxGenJS();
      
      // Configurações globais
      pres.layout = 'LAYOUT_WIDE';
      pres.author = 'Clube do Grito - Instituto O Grito';
      pres.subject = 'Relatório PEC';
      pres.title = 'Relatório do Programa de Educação, Cultura e Esporte';

      // Slide 1: Título
      const slide1 = pres.addSlide();
      slide1.background = { color: '1e3a8a' }; // Azul escuro
      
      slide1.addText('CLUBE DO GRITO', {
        x: 1, y: 1.5, w: 11, h: 1,
        fontSize: 44, bold: true, color: 'ffffff',
        align: 'center', fontFace: 'Arial'
      });
      
      slide1.addText('Programa de Educação, Cultura e Esporte', {
        x: 1, y: 2.8, w: 11, h: 0.8,
        fontSize: 28, color: 'e5e7eb',
        align: 'center', fontFace: 'Arial'
      });
      
      slide1.addText(`Relatório Gerencial - ${new Date().toLocaleDateString('pt-BR')}`, {
        x: 1, y: 4, w: 11, h: 0.6,
        fontSize: 18, color: 'cbd5e1',
        align: 'center', fontFace: 'Arial'
      });

      slide1.addText('Instituto O Grito', {
        x: 1, y: 5.5, w: 11, h: 0.6,
        fontSize: 16, color: 'cbd5e1', italic: true,
        align: 'center', fontFace: 'Arial'
      });

      // Slide 2: Visão Geral
      const slide2 = pres.addSlide();
      slide2.background = { color: 'ffffff' };
      
      slide2.addText('VISÃO GERAL - PEC', {
        x: 0.5, y: 0.5, w: 12, h: 0.8,
        fontSize: 32, bold: true, color: '1e3a8a',
        align: 'center', fontFace: 'Arial'
      });

      // Estatísticas em caixas
      const statsData = [
        { title: 'Projetos Ativos', value: projects.length, color: '3b82f6' },
        { title: 'Atividades', value: activities.length, color: '10b981' },
        { title: 'Turmas', value: instances.length, color: 'f59e0b' },
        { title: 'Relatórios', value: stats.pendingReports, color: '8b5cf6' }
      ];

      statsData.forEach((stat, index) => {
        const x = 1 + (index * 2.8);
        slide2.addShape(pres.ShapeType.rect, {
          x: x, y: 2, w: 2.5, h: 1.5,
          fill: { color: stat.color },
          line: { color: stat.color, width: 2 }
        });
        
        slide2.addText(stat.value.toString(), {
          x: x, y: 2.2, w: 2.5, h: 0.6,
          fontSize: 36, bold: true, color: 'ffffff',
          align: 'center', fontFace: 'Arial'
        });
        
        slide2.addText(stat.title, {
          x: x, y: 2.8, w: 2.5, h: 0.5,
          fontSize: 14, color: 'ffffff',
          align: 'center', fontFace: 'Arial'
        });
      });

      // Slide 3: Projetos
      const slide3 = pres.addSlide();
      slide3.background = { color: 'ffffff' };
      
      slide3.addText('PROJETOS ATIVOS', {
        x: 0.5, y: 0.5, w: 12, h: 0.8,
        fontSize: 32, bold: true, color: '1e3a8a',
        align: 'center', fontFace: 'Arial'
      });

      if (projects.length > 0) {
        const projectTableData = [
          ['Projeto', 'Categoria', 'Status', 'Atividades']
        ];
        
        projects.slice(0, 8).forEach((project: any) => {
          const projectActivities = activities.filter(a => a.project_id === project.id).length;
          projectTableData.push([
            project.name,
            project.category || 'SCFV',
            'Ativo',
            projectActivities.toString()
          ]);
        });

        slide3.addText(projectTableData.map(row => row.join(' | ')).join('\n'), {
          x: 0.5, y: 1.5, w: 12, h: 4,
          fontSize: 14,
          fontFace: 'Arial',
          color: '374151'
        });
      } else {
        slide3.addText('Nenhum projeto cadastrado no momento', {
          x: 1, y: 3, w: 11, h: 1,
          fontSize: 18, color: '6b7280', italic: true,
          align: 'center', fontFace: 'Arial'
        });
      }

      // Slide 4: Turmas
      const slide4 = pres.addSlide();
      slide4.background = { color: 'ffffff' };
      
      slide4.addText('TURMAS E ATIVIDADES', {
        x: 0.5, y: 0.5, w: 12, h: 0.8,
        fontSize: 32, bold: true, color: '1e3a8a',
        align: 'center', fontFace: 'Arial'
      });

      if (instances.length > 0) {
        const instanceTableData = [
          ['Turma', 'Atividade', 'Projeto', 'Situação']
        ];
        
        instances.slice(0, 8).forEach((instance: any) => {
          const activity = activities.find(a => a.id === instance.activity_id);
          const project = projects.find(p => p.id === activity?.project_id);
          
          instanceTableData.push([
            `Turma ${instance.id}`,
            activity?.name || 'N/A',
            project?.name || 'N/A',
            instance.situation === 'execucao' ? 'Em Execução' : (instance.situation || 'N/A')
          ]);
        });

        slide4.addText(instanceTableData.map(row => row.join(' | ')).join('\n'), {
          x: 0.5, y: 1.5, w: 12, h: 4,
          fontSize: 14,
          fontFace: 'Arial',
          color: '374151'
        });
      } else {
        slide4.addText('Nenhuma turma cadastrada no momento', {
          x: 1, y: 3, w: 11, h: 1,
          fontSize: 18, color: '6b7280', italic: true,
          align: 'center', fontFace: 'Arial'
        });
      }

      // Slide 5: Conclusões
      const slide5 = pres.addSlide();
      slide5.background = { color: 'ffffff' };
      
      slide5.addText('PRÓXIMOS PASSOS', {
        x: 0.5, y: 0.5, w: 12, h: 0.8,
        fontSize: 32, bold: true, color: '1e3a8a',
        align: 'center', fontFace: 'Arial'
      });

      const nextSteps = [
        '• Monitorar frequência dos participantes',
        '• Implementar novos projetos conforme demanda',
        '• Capacitar educadores para novas metodologias',
        '• Ampliar parcerias com outras instituições',
        '• Documentar cases de sucesso'
      ];

      slide5.addText(nextSteps.join('\n'), {
        x: 1, y: 2, w: 11, h: 3,
        fontSize: 18, color: '374151',
        fontFace: 'Arial',
        lineSpacing: 28
      });

      slide5.addText('Gerado automaticamente pelo Sistema Clube do Grito', {
        x: 1, y: 5.5, w: 11, h: 0.5,
        fontSize: 12, color: '9ca3af', italic: true,
        align: 'center', fontFace: 'Arial'
      });

      // Salvar apresentação
      const fileName = `relatorio-pec-slides-${new Date().toISOString().split('T')[0]}.pptx`;
      await pres.writeFile({ fileName: fileName });

      toast({
        title: "Slides gerados com sucesso! 🎉",
        description: `Apresentação PowerPoint "${fileName}" foi baixada automaticamente.`
      });

    } catch (error) {
      console.error('Erro ao gerar slides:', error);
      toast({
        title: "Erro",
        description: "Falha ao gerar slides. Tente novamente.",
        variant: "destructive"
      });
    }
  };


  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <img src={logoClube} alt="Clube do Grito" className="w-10 h-10" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Coordenador do PEC</h1>
              <p className="text-sm text-gray-600">Programa de Educação, Cultura e Esporte</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm">
              <Bell className="h-4 w-4" />
            </Button>
            <Button variant="ghost" onClick={handleLogout} size="sm">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="p-6 space-y-6">
        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label>Ano</Label>
                <Select value={filters.year.toString()} onValueChange={(value) => setFilters(prev => ({ ...prev, year: parseInt(value) }))}>
                  <SelectTrigger data-testid="filter-year">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2024">2024</SelectItem>
                    <SelectItem value="2025">2025</SelectItem>
                    <SelectItem value="2026">2026</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Projeto</Label>
                <Select value={filters.project} onValueChange={(value) => setFilters(prev => ({ ...prev, project: value }))}>
                  <SelectTrigger data-testid="filter-project">
                    <SelectValue placeholder="Todos os projetos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os projetos</SelectItem>
                    {projects.map((project: any) => (
                      <SelectItem key={project.id} value={project.id.toString()}>{project.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Atividade</Label>
                <Select value={filters.activity} onValueChange={(value) => setFilters(prev => ({ ...prev, activity: value }))}>
                  <SelectTrigger data-testid="filter-activity">
                    <SelectValue placeholder="Todas as atividades" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as atividades</SelectItem>
                    {activities.map((activity: any) => (
                      <SelectItem key={activity.id} value={activity.id.toString()}>{activity.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger data-testid="filter-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todas</SelectItem>
                    <SelectItem value="ativa">Ativas</SelectItem>
                    <SelectItem value="execucao">Em Execução</SelectItem>
                    <SelectItem value="planejamento">Planejamento</SelectItem>
                    <SelectItem value="encerrada">Encerradas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="border-l-4 border-l-blue-500" data-testid="card-projects">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Projetos</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalProjects}</p>
                </div>
                <BookOpen className="h-8 w-8 text-blue-500" />
              </div>
              <div className="mt-2 text-xs text-gray-500">
                #{activities.length} Atividades
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500" data-testid="card-instances">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Turmas Ativas</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.activeInstances}</p>
                </div>
                <Users className="h-8 w-8 text-green-500" />
              </div>
              <div className="mt-2 text-xs text-gray-500">
                {instances.length} total de turmas
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-500" data-testid="card-reports">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Relatórios Pendentes</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.pendingReports}</p>
                </div>
                <FileText className="h-8 w-8 text-orange-500" />
              </div>
              <div className="mt-2">
                <Button size="sm" variant="outline" className="text-xs" onClick={handleGenerateSlides} data-testid="btn-export-turmas-csv">
                  <Download className="h-3 w-3 mr-1" />
                  Criar Relatório Slide
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Ações Rápidas</p>
                  <div className="space-y-2 mt-2">
                    <Button size="sm" className="w-full justify-start text-xs" onClick={() => setShowProjectForm(true)} data-testid="btn-new-project">
                      <Plus className="h-3 w-3 mr-1" />
                      Novo Projeto
                    </Button>
                    <Button size="sm" variant="outline" className="w-full justify-start text-xs" onClick={() => setShowActivityForm(true)} data-testid="btn-new-activity">
                      <Activity className="h-3 w-3 mr-1" />
                      Nova Atividade
                    </Button>
                    <Button size="sm" variant="outline" className="w-full justify-start text-xs" onClick={() => setShowInstanceForm(true)} data-testid="btn-new-instance">
                      <School className="h-3 w-3 mr-1" />
                      Nova Turma
                    </Button>
                    <Button size="sm" variant="outline" className="w-full justify-start text-xs" onClick={() => setShowEducadorForm(true)} data-testid="btn-new-educador">
                      <UserPlus className="h-3 w-3 mr-1" />
                      Novo Educador
                    </Button>
                    <Button size="sm" variant="outline" className="w-full justify-start text-xs" onClick={handleGenerateExcelDashboard} data-testid="btn-quick-report">
                      <FileDown className="h-3 w-3 mr-1" />
                      Criar Relatório Excel
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Projects List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Projetos
              </span>
              <Button onClick={() => {
                console.log('➕ [PROJETO] Criar novo projeto');
                setShowProjectForm(true);
              }} data-testid="btn-create-project">
                <Plus className="h-4 w-4 mr-2" />
                Novo Projeto
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingProjects ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse p-4 border rounded">
                    <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : projects.length === 0 ? (
              <div className="text-center py-8">
                <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Nenhum projeto encontrado</p>
                <Button className="mt-4" data-testid="btn-first-project">
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeiro Projeto
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {projects.map((project: any) => (
                  <div key={project.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow" data-testid={`project-${project.id}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{project.name}</h3>
                        <p className="text-gray-600 text-sm mt-1">{project.description}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                          <span>Categoria: {project.category || 'SCFV'}</span>
                          <span>Período: {project.start_date} - {project.end_date}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline" onClick={(e) => {
                          e.stopPropagation();
                          console.log('👁️ [PROJETO] Visualizar projeto:', project.id, project.name);
                          setViewingProject(project);
                          setShowProjectViewModal(true);
                        }} data-testid={`btn-view-project-${project.id}`}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={(e) => {
                          e.stopPropagation();
                          console.log('✏️ [PROJETO] Editar projeto:', project.id, project.name);
                          setEditingItem(project);
                          setShowProjectForm(true);
                        }} data-testid={`btn-edit-project-${project.id}`}>
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Activities List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Atividades
              </span>
              <Button onClick={() => {
                console.log('➕ [ATIVIDADE] Criar nova atividade');
                setEditingActivity(null);
                setShowActivityForm(true);
              }} data-testid="btn-create-activity">
                <Plus className="h-4 w-4 mr-2" />
                Nova Atividade
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingActivities ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse p-4 border rounded">
                    <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : activities.length === 0 ? (
              <div className="text-center py-8">
                <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Nenhuma atividade encontrada</p>
                <Button className="mt-4" onClick={() => setShowActivityForm(true)} data-testid="btn-first-activity">
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeira Atividade
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {activities.map((activity: any) => (
                  <div key={activity.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow" data-testid={`activity-${activity.id}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{activity.name}</h3>
                        <p className="text-gray-600 text-sm mt-1">{activity.description}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                          <span>Período: {activity.day_period}</span>
                          <span>Presença: {activity.requires_attendance ? 'Obrigatória' : 'Opcional'}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline" onClick={(e) => {
                          e.stopPropagation();
                          console.log('👁️ [ATIVIDADE] Visualizar atividade:', activity.id, activity.name);
                          setViewingActivity(activity);
                          setShowActivityViewModal(true);
                        }} data-testid={`btn-view-activity-${activity.id}`}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={(e) => {
                          e.stopPropagation();
                          console.log('✏️ [ATIVIDADE] Editar atividade:', activity.id, activity.name);
                          const mappedActivity = {
                            ...activity,
                            period: activity.day_period,
                            control_presence: activity.requires_attendance
                          };
                          setEditingActivity(mappedActivity);
                          setShowActivityForm(true);
                        }} data-testid={`btn-edit-activity-${activity.id}`}>
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Instances (Turmas) List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <School className="h-5 w-5" />
                Turmas
              </span>
              <Button onClick={() => setShowInstanceForm(true)} data-testid="btn-create-instance">
                <Plus className="h-4 w-4 mr-2" />
                Nova Turma
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingInstances ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse p-4 border rounded">
                    <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : instances.length === 0 ? (
              <div className="text-center py-8">
                <School className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Nenhuma turma encontrada</p>
                <Button className="mt-4" onClick={() => setShowInstanceForm(true)} data-testid="btn-first-instance">
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeira Turma
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {instances.map((instance: any) => (
                  <div key={instance.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow" data-testid={`instance-${instance.id}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-lg">{instance.title}</h3>
                          {instance.code && <Badge variant="outline">{instance.code}</Badge>}
                          <Badge className={instance.situation === 'execucao' ? 'bg-green-100 text-green-800' : instance.situation === 'planejamento' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}>
                            {instance.situation === 'execucao' ? 'Em Execução' : instance.situation === 'planejamento' ? 'Planejamento' : 'Encerrada'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                          <span>Idade: {instance.min_age} - {instance.max_age} anos</span>
                          <span>Período: {instance.day_period}</span>
                          <span>Local: {instance.location}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={(e) => {
                            e.stopPropagation();
                            console.log('👁️ [TURMA] Visualizar turma:', instance.id, instance.title);
                            setLocation(`/pec/turmas/${instance.id}`);
                          }} 
                          data-testid={`btn-view-instance-${instance.id}`}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={(e) => {
                            e.stopPropagation();
                            console.log('✏️ [TURMA] Editar turma:', instance.id, instance.title);
                            setEditingItem(instance);
                            setShowInstanceForm(true);
                          }} 
                          data-testid={`btn-edit-instance-${instance.id}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Access to Enrollments */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Matrículas
              </span>
              <Button onClick={() => setShowEnrollmentForm(true)} data-testid="btn-create-enrollment">
                <Plus className="h-4 w-4 mr-2" />
                Nova Matrícula
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <UserPlus className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Acesse as turmas para gerenciar matrículas</p>
              <p className="text-gray-500 text-sm mt-2">
                As matrículas são organizadas por turma. Clique em uma turma acima para ver suas matrículas.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Quick Access to Sessions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                Sessões & Aulas
              </span>
              <Button onClick={() => setShowSessionForm(true)} data-testid="btn-create-session">
                <Plus className="h-4 w-4 mr-2" />
                Nova Sessão
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Acesse as turmas para gerenciar sessões e aulas</p>
              <p className="text-gray-500 text-sm mt-2">
                As sessões são organizadas por turma. Clique em uma turma acima para registrar sessões.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Form Dialogs */}
      <ProjectForm 
        key={editingItem?.id || 'new'}
        open={showProjectForm} 
        onClose={() => {
          setShowProjectForm(false);
          setEditingItem(null);
        }} 
        project={editingItem}
      />
      
      <ActivityForm 
        key={editingActivity?.id || 'new'}
        open={showActivityForm} 
        onClose={() => {
          setShowActivityForm(false);
          setEditingActivity(null);
        }} 
        activity={editingActivity}
      />
      
      <InstanceForm 
        open={showInstanceForm} 
        onClose={() => {
          setShowInstanceForm(false);
          setEditingItem(null);
        }} 
        instance={editingItem}
      />
      
      <EnrollmentForm 
        open={showEnrollmentForm} 
        onClose={() => {
          setShowEnrollmentForm(false);
          setEditingItem(null);
        }} 
        enrollment={editingItem}
      />
      
      <SessionForm 
        open={showSessionForm} 
        onClose={() => {
          setShowSessionForm(false);
          setEditingItem(null);
        }} 
        session={editingItem}
      />
      
      {/* Educador Form */}
      <EducadorForm 
        open={showEducadorForm} 
        onClose={() => {
          setShowEducadorForm(false);
          setEditingItem(null);
        }} 
        educador={editingItem}
      />
      
      {/* Project View Modal */}
      <ProjectViewModal 
        open={showProjectViewModal} 
        onClose={() => {
          setShowProjectViewModal(false);
          setViewingProject(null);
        }} 
        project={viewingProject}
      />
      
      {/* Activity View Modal */}
      <ActivityViewModal 
        open={showActivityViewModal} 
        onClose={() => {
          setShowActivityViewModal(false);
          setViewingActivity(null);
        }} 
        activity={viewingActivity}
      />
    </div>
  );
}

// Educador Form Component
function EducadorForm({ open, onClose, educador }: { open: boolean; onClose: () => void; educador?: any }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const form = useForm({
    resolver: zodResolver(educadorSchema),
    defaultValues: {
      cpf: educador?.cpf || "",
      nome_completo: educador?.nome_completo || "",
      data_nascimento: educador?.data_nascimento ? new Date(educador.data_nascimento) : new Date(),
      telefone: educador?.telefone || "",
      email: educador?.email || "",
      endereco: educador?.endereco || "",
      formacao: educador?.formacao || "",
      experiencia: educador?.experiencia || "",
      foto_perfil: educador?.foto_perfil || "",
      observacoes: educador?.observacoes || ""
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const educadorData = {
        ...data,
        data_nascimento: format(data.data_nascimento, 'yyyy-MM-dd')
      };
      
      const educadorResponse = await apiRequest('/api/educadores', {
        method: 'POST',
        body: JSON.stringify(educadorData)
      });
      
      // Vincular automaticamente ao programa PEC
      await apiRequest(`/api/educadores/${educadorResponse.id}/programa`, {
        method: 'POST',
        body: JSON.stringify({
          programa: 'pec',
          cargo: 'Educador'
        })
      });
      
      return educadorResponse;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/educadores'] });
      queryClient.invalidateQueries({ queryKey: ['/api/educadores/pec'] });
      toast({
        title: "Sucesso!",
        description: "Educador cadastrado e vinculado ao programa PEC com sucesso."
      });
      onClose();
      form.reset();
    },
    onError: (error: any) => {
      console.error('Error creating educador:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao cadastrar educador",
        variant: "destructive"
      });
    }
  });

  const onSubmit = (data: any) => {
    createMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Cadastrar Novo Educador</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* CPF */}
              <FormField
                control={form.control}
                name="cpf"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CPF *</FormLabel>
                    <FormControl>
                      <Input placeholder="12345678901" {...field} data-testid="input-cpf" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Nome Completo */}
              <FormField
                control={form.control}
                name="nome_completo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome Completo *</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome completo do educador" {...field} data-testid="input-nome" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Data de Nascimento */}
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
                            className={`w-full pl-3 text-left font-normal ${!field.value && "text-muted-foreground"}`}
                            data-testid="input-data-nascimento"
                          >
                            {field.value ? format(field.value, "dd/MM/yyyy", { locale: pt }) : "Selecionar data"}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Telefone */}
              <FormField
                control={form.control}
                name="telefone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone *</FormLabel>
                    <FormControl>
                      <Input placeholder="(11) 99999-9999" {...field} data-testid="input-telefone" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Email */}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="email@exemplo.com" {...field} data-testid="input-email" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Formação */}
              <FormField
                control={form.control}
                name="formacao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Formação *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Pedagogia, Educação Física..." {...field} data-testid="input-formacao" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            {/* Endereço */}
            <FormField
              control={form.control}
              name="endereco"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Endereço *</FormLabel>
                  <FormControl>
                    <Input placeholder="Rua, número, bairro, cidade - UF" {...field} data-testid="input-endereco" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Experiência */}
            <FormField
              control={form.control}
              name="experiencia"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Experiência Profissional</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Descreva a experiência profissional relevante..." {...field} data-testid="input-experiencia" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Observações */}
            <FormField
              control={form.control}
              name="observacoes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Observações adicionais..." {...field} data-testid="input-observacoes" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose} data-testid="btn-cancel">
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={createMutation.isPending}
                data-testid="btn-submit"
              >
                {createMutation.isPending ? "Cadastrando..." : "Cadastrar Educador"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// Project Detail Component
function ProjectDetail({ projectId }: { projectId?: string }) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('details');
  const [showEditForm, setShowEditForm] = useState(false);
  const [showActivityForm, setShowActivityForm] = useState(false);
  const [editingActivity, setEditingActivity] = useState<any>(null);
  
  const { data: project, isLoading } = useQuery({
    queryKey: ['/api/projects', projectId],
    queryFn: () => apiRequest(`/api/projects/${projectId}`),
    enabled: !!projectId
  });

  const { data: activities = [] } = useQuery({
    queryKey: ['/api/pec/activities', { project_id: projectId }],
    queryFn: () => apiRequest(`/api/pec/activities?project_id=${projectId}`),
    enabled: !!projectId
  }) as { data: any[] };

  // Funções de exportação para este componente
  // Agora gera slides PowerPoint específicos do projeto
  const handleGenerateSlides = async () => {
    try {
      // Criar nova apresentação específica para o projeto
      const pres = new PptxGenJS();
      
      // Configurações globais
      pres.layout = 'LAYOUT_WIDE';
      pres.author = 'Clube do Grito - Instituto O Grito';
      pres.subject = `Relatório do Projeto: ${project?.name}`;
      pres.title = `Relatório do Projeto ${project?.name}`;

      // Slide 1: Título do Projeto
      const slide1 = pres.addSlide();
      slide1.background = { color: '1e3a8a' };
      
      slide1.addText(project?.name || 'Projeto PEC', {
        x: 1, y: 1.5, w: 11, h: 1,
        fontSize: 40, bold: true, color: 'ffffff',
        align: 'center', fontFace: 'Arial'
      });
      
      slide1.addText('Relatório do Projeto', {
        x: 1, y: 2.8, w: 11, h: 0.8,
        fontSize: 24, color: 'e5e7eb',
        align: 'center', fontFace: 'Arial'
      });

      // Slide 2: Informações do Projeto
      const slide2 = pres.addSlide();
      slide2.background = { color: 'ffffff' };
      
      slide2.addText('INFORMAÇÕES DO PROJETO', {
        x: 0.5, y: 0.5, w: 12, h: 0.8,
        fontSize: 28, bold: true, color: '1e3a8a',
        align: 'center', fontFace: 'Arial'
      });

      const projectInfo = [
        `Descrição: ${project?.description || 'Não informado'}`,
        `Categoria: ${project?.category || 'SCFV'}`,
        `Total de Atividades: ${activities.length}`
      ];

      slide2.addText(projectInfo.join('\n\n'), {
        x: 1, y: 1.5, w: 11, h: 4,
        fontSize: 16, color: '374151',
        fontFace: 'Arial'
      });

      // Salvar apresentação
      const fileName = `relatorio-projeto-${project?.name?.replace(/[^a-zA-Z0-9]/g, '-') || 'projeto'}-${new Date().toISOString().split('T')[0]}.pptx`;
      await pres.writeFile({ fileName: fileName });

      toast({
        title: "Slides do projeto gerados! 🎉",
        description: `Apresentação "${fileName}" foi baixada automaticamente.`
      });

    } catch (error) {
      console.error('Erro ao gerar slides do projeto:', error);
      toast({
        title: "Erro",
        description: "Falha ao gerar slides do projeto. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  const handleExportAtividadesCSV = () => {
    try {
      const csvHeaders = ['ID', 'Nome', 'Descrição', 'Tipo'];
      const csvData = activities.map((activity: any) => [
        activity.id,
        activity.name,
        activity.description || '',
        activity.type || 'Padrão'
      ]);
      
      const csvContent = [
        csvHeaders.join(','),
        ...csvData.map(row => row.map(field => `"${field}"`).join(','))
      ].join('\n');
      
      const csvBlob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(csvBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `atividades-${project?.name || 'projeto'}-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "CSV exportado",
        description: `${activities.length} atividades exportadas com sucesso.`
      });
    } catch (error) {
      toast({
        title: "Erro", 
        description: "Falha ao exportar CSV. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  // Função para gerar relatório Excel específica do projeto
  const handleGenerateExcelProject = () => {
    try {
      // Criar workbook
      const wb = XLSX.utils.book_new();
      
      // Planilha 1: Resumo do Projeto
      const resumoData = [
        [`RELATÓRIO DO PROJETO: ${project?.name || 'N/A'}`],
        ['Data de Geração:', format(new Date(), 'dd/MM/yyyy HH:mm', { locale: pt })],
        [''],
        ['INFORMAÇÕES DO PROJETO'],
        ['Nome:', project?.name || 'N/A'],
        ['Categoria:', project?.category || 'SCFV'],
        ['Descrição:', project?.description || 'N/A'],
        ['Total de Atividades:', activities.length],
        [''],
      ];
      
      const ws1 = XLSX.utils.aoa_to_sheet(resumoData);
      XLSX.utils.book_append_sheet(wb, ws1, 'Resumo do Projeto');
      
      // Planilha 2: Atividades do Projeto
      if (activities.length > 0) {
        const atividadesHeaders = ['ID', 'Nome', 'Descrição', 'Período'];
        const atividadesData = activities.map((activity: any) => [
          activity.id,
          activity.name,
          activity.description || 'N/A',
          activity.day_period || 'N/A'
        ]);
        
        const ws2 = XLSX.utils.aoa_to_sheet([atividadesHeaders, ...atividadesData]);
        XLSX.utils.book_append_sheet(wb, ws2, 'Atividades');
      }
      
      // Salvar arquivo
      const fileName = `relatorio-projeto-${project?.name?.replace(/\s/g, '-')}-${format(new Date(), 'yyyy-MM-dd-HHmm', { locale: pt })}.xlsx`;
      XLSX.writeFile(wb, fileName);
      
      toast({
        title: "Relatório Excel gerado! 📊",
        description: `Arquivo "${fileName}" foi baixado automaticamente.`
      });
      
    } catch (error) {
      console.error('Erro ao gerar relatório Excel:', error);
      toast({
        title: "Erro ao gerar relatório Excel",
        description: "Tente novamente mais tarde.",
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return <div className="p-6">Carregando...</div>;
  }

  if (!project) {
    return <div className="p-6">Projeto não encontrado</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" onClick={() => setLocation('/pec')} data-testid="btn-back">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
              <p className="text-sm text-gray-600">Detalhe do Projeto</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button size="sm" onClick={() => setShowEditForm(true)} data-testid="btn-edit-project">
              <Edit className="h-4 w-4 mr-2" />
              Editar Projeto
            </Button>
            <Button size="sm" onClick={() => setShowActivityForm(true)} data-testid="btn-new-activity">
              <Plus className="h-4 w-4 mr-2" />
              Nova Atividade
            </Button>
            <Button size="sm" variant="outline" onClick={handleGenerateSlides} data-testid="btn-export-csv">
              <Download className="h-4 w-4 mr-2" />
              Criar Relatório Slide
            </Button>
            <Button size="sm" variant="outline" onClick={handleGenerateExcelProject} data-testid="btn-create-report">
              <FileText className="h-4 w-4 mr-2" />
              Criar Relatório Excel
            </Button>
          </div>
        </div>
      </header>

      <div className="p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details" data-testid="tab-details">Detalhes</TabsTrigger>
            <TabsTrigger value="activities" data-testid="tab-activities">Atividades</TabsTrigger>
            <TabsTrigger value="reports" data-testid="tab-reports">Relatórios</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Informações do Projeto</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label className="font-semibold">Nome do Projeto</Label>
                    <p className="text-gray-700">{project.name}</p>
                  </div>
                  <div>
                    <Label className="font-semibold">Categoria</Label>
                    <p className="text-gray-700">{project.category || 'SCFV'}</p>
                  </div>
                  <div>
                    <Label className="font-semibold">Período de Execução</Label>
                    <p className="text-gray-700">{project.start_date} até {project.end_date}</p>
                  </div>
                  <div>
                    <Label className="font-semibold">Quem pode participar</Label>
                    <p className="text-gray-700">{project.who_can_participate}</p>
                  </div>
                  <div className="md:col-span-2">
                    <Label className="font-semibold">Descrição</Label>
                    <p className="text-gray-700">{project.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activities" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Atividades do Projeto</span>
                  <Button onClick={() => setShowActivityForm(true)} data-testid="btn-add-activity">
                    <Plus className="h-4 w-4 mr-2" />
                    Nova Atividade
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {activities.length === 0 ? (
                  <div className="text-center py-8">
                    <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Nenhuma atividade cadastrada</p>
                    <Button className="mt-4" onClick={() => setShowActivityForm(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Criar Primeira Atividade
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {activities.map((activity: any) => (
                      <div key={activity.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow" data-testid={`activity-${activity.id}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold">{activity.name}</h3>
                            <p className="text-gray-600 text-sm">{activity.description}</p>
                            <div className="flex items-center gap-4 mt-2">
                              <Badge>{activity.day_period}</Badge>
                              <span className="text-xs text-gray-500">
                                {activity.requires_attendance ? 'Com controle de presença' : 'Sem controle de presença'}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button size="sm" variant="outline" onClick={() => {
                              // No contexto de ProjectDetail, remover ação de visualização
                              // pois já estamos na página de detalhes
                            }} data-testid={`btn-view-activity-${activity.id}`} disabled>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => {
                              const mappedActivity = {
                                ...activity,
                                period: activity.day_period,
                                control_presence: activity.requires_attendance
                              };
                              setEditingActivity(mappedActivity);
                              setShowActivityForm(true);
                            }} data-testid={`btn-edit-activity-${activity.id}`}>
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Relatórios do Projeto</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Nenhum relatório disponível</p>
                  <Button className="mt-4" onClick={handleGenerateSlides} data-testid="btn-generate-report">
                    <FileText className="h-4 w-4 mr-2" />
                    Gerar Relatório
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Edit Project Form */}
      <ProjectForm 
        open={showEditForm} 
        onClose={() => setShowEditForm(false)} 
        project={project}
      />
      
      {/* Activity Form */}
      <ActivityForm 
        open={showActivityForm} 
        onClose={() => {
          setShowActivityForm(false);
          setEditingActivity(null);
        }} 
        activity={editingActivity}
        projectId={project?.id}
      />
    </div>
  );
}

// Activity Detail Component  
function ActivityDetail({ activityId }: { activityId?: string }) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [showInstanceForm, setShowInstanceForm] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  
  const { data: activity, isLoading } = useQuery({
    queryKey: ['/api/pec/activities', activityId],
    queryFn: () => apiRequest(`/api/pec/activities/${activityId}`),
    enabled: !!activityId
  });

  const { data: instances = [] } = useQuery({
    queryKey: ['/api/instances', { activity_id: activityId }],
    queryFn: () => apiRequest(`/api/instances?activity_id=${activityId}`),
    enabled: !!activityId
  }) as { data: any[] };

  if (isLoading) {
    return <div className="p-6">Carregando...</div>;
  }

  if (!activity) {
    return <div className="p-6">Atividade não encontrada</div>;
  }

  const getSituationBadge = (situation: string) => {
    const colors = {
      'execucao': 'bg-green-100 text-green-800',
      'planejamento': 'bg-yellow-100 text-yellow-800',
      'encerrada': 'bg-gray-100 text-gray-800'
    };
    return colors[situation as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" onClick={() => setLocation('/pec')} data-testid="btn-back">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{activity.name}</h1>
              <p className="text-sm text-gray-600">Atividade (macro)</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button size="sm" onClick={() => setShowInstanceForm(true)} data-testid="btn-create-instance">
              <Plus className="h-4 w-4 mr-2" />
              Criar Turma
            </Button>
          </div>
        </div>
      </header>

      <div className="p-6 space-y-6">
        {/* Activity Info */}
        <Card>
          <CardHeader>
            <CardTitle>Informações da Atividade</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <Label className="font-semibold">Nome</Label>
              <p className="text-gray-700">{activity.name}</p>
            </div>
            <div>
              <Label className="font-semibold">Período do Dia</Label>
              <Badge className="mt-1">{activity.day_period}</Badge>
            </div>
            <div>
              <Label className="font-semibold">Controle de Presença</Label>
              <p className="text-gray-700">{activity.requires_attendance ? 'Sim' : 'Não'}</p>
            </div>
            <div className="md:col-span-3">
              <Label className="font-semibold">Descrição</Label>
              <p className="text-gray-700">{activity.description}</p>
            </div>
          </CardContent>
        </Card>

        {/* Instances (Turmas) */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Lista de Turmas</span>
              <Button onClick={() => setShowInstanceForm(true)} data-testid="btn-new-instance">
                <Plus className="h-4 w-4 mr-2" />
                Criar Turma
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {instances.length === 0 ? (
              <div className="text-center py-8">
                <School className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Nenhuma turma cadastrada</p>
                <Button className="mt-4" onClick={() => setShowInstanceForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeira Turma
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {instances.map((instance: any) => (
                  <div key={instance.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow" data-testid={`instance-${instance.id}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold">{instance.title}</h3>
                          {instance.code && <Badge variant="outline">{instance.code}</Badge>}
                          <Badge className={getSituationBadge(instance.situation)}>
                            {instance.situation}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-gray-600">
                          <div>
                            <span className="font-medium">Idade:</span> {instance.min_age}-{instance.max_age} anos
                          </div>
                          <div>
                            <span className="font-medium">Período:</span> {instance.start_date} - {instance.end_date}
                          </div>
                          <div>
                            <span className="font-medium">Local:</span> {instance.location}
                          </div>
                          <div>
                            <span className="font-medium">Periodicidade:</span> {instance.day_period}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={(e) => {
                            e.stopPropagation();
                            console.log('👁️ [TURMA] Visualizar turma:', instance.id, instance.title);
                            setLocation(`/pec/turmas/${instance.id}`);
                          }} 
                          data-testid={`btn-view-instance-${instance.id}`}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={(e) => {
                            e.stopPropagation();
                            console.log('✏️ [TURMA] Editar turma:', instance.id, instance.title);
                            setEditingItem(instance);
                            setShowInstanceForm(true);
                          }} 
                          data-testid={`btn-edit-instance-${instance.id}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Instance Form */}
      <InstanceForm 
        open={showInstanceForm} 
        onClose={() => {
          setShowInstanceForm(false);
          setEditingItem(null);
        }} 
        instance={editingItem}
      />
    </div>
  );
}

// Instance Detail Component (Turma) - with all tabs
function InstanceDetail({ instanceId }: { instanceId?: string }) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('details');
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  
  const { data: instance, isLoading } = useQuery({
    queryKey: ['/api/instances', instanceId],
    queryFn: () => apiRequest(`/api/instances/${instanceId}`),
    enabled: !!instanceId
  });

  const { data: enrollments = [] } = useQuery({
    queryKey: ['/api/enrollments', { instance_id: instanceId }],
    queryFn: () => apiRequest(`/api/enrollments?instance_id=${instanceId}`),
    enabled: !!instanceId
  });

  const { data: sessions = [] } = useQuery({
    queryKey: ['/api/sessions', { instance_id: instanceId }],
    queryFn: () => apiRequest(`/api/sessions?instance_id=${instanceId}`),
    enabled: !!instanceId
  });

  // Função para gerar relatório PowerPoint da turma
  const handleGenerateSlides = async () => {
    try {
      // Criar nova apresentação específica para a turma
      const pres = new PptxGenJS();
      
      // Configurações globais
      pres.layout = 'LAYOUT_WIDE';
      pres.author = 'Clube do Grito - Instituto O Grito';
      pres.subject = `Relatório da Turma: ${instance?.title}`;
      pres.title = `Relatório da Turma ${instance?.title}`;

      // Slide 1: Título da Turma
      const slide1 = pres.addSlide();
      slide1.background = { color: '1e3a8a' };
      
      slide1.addText(instance?.title || 'Turma PEC', {
        x: 1, y: 1.5, w: 11, h: 1,
        fontSize: 40, bold: true, color: 'ffffff',
        align: 'center', fontFace: 'Arial'
      });
      
      slide1.addText('Relatório Mensal da Turma', {
        x: 1, y: 2.8, w: 11, h: 0.8,
        fontSize: 24, color: 'e5e7eb',
        align: 'center', fontFace: 'Arial'
      });

      slide1.addText(`${format(selectedMonth, 'MMMM yyyy', { locale: pt })}`, {
        x: 1, y: 3.8, w: 11, h: 0.6,
        fontSize: 18, color: 'cbd5e1',
        align: 'center', fontFace: 'Arial'
      });

      // Slide 2: Informações da Turma
      const slide2 = pres.addSlide();
      slide2.background = { color: 'ffffff' };
      
      slide2.addText('INFORMAÇÕES DA TURMA', {
        x: 0.5, y: 0.5, w: 12, h: 0.8,
        fontSize: 28, bold: true, color: '1e3a8a',
        align: 'center', fontFace: 'Arial'
      });

      const turmaInfo = [
        `• Título: ${instance?.title || 'N/A'}`,
        `• Local: ${instance?.location || 'N/A'}`,
        `• Período: ${instance?.start_date || 'N/A'} até ${instance?.end_date || 'N/A'}`,
        `• Total de Sessões: ${sessions.length}`,
        `• Status: ${instance?.situation || 'N/A'}`
      ];

      slide2.addText(turmaInfo.join('\n'), {
        x: 1, y: 2, w: 11, h: 3,
        fontSize: 18, color: '374151',
        fontFace: 'Arial',
        lineSpacing: 28
      });

      // Salvar apresentação
      const fileName = `relatorio-turma-${instance?.title?.replace(/[^a-zA-Z0-9]/g, '-') || 'turma'}-${format(selectedMonth, 'yyyy-MM', { locale: pt })}.pptx`;
      await pres.writeFile({ fileName: fileName });

      toast({
        title: "Relatório PowerPoint gerado! 🎉",
        description: `Apresentação "${fileName}" foi baixada automaticamente.`
      });

    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      toast({
        title: "Erro ao gerar relatório",
        description: "Tente novamente mais tarde.",
        variant: "destructive"
      });
    }
  };

  const { data: photos = [] } = useQuery({
    queryKey: ['/api/photos', { instance_id: instanceId }],
    queryFn: () => apiRequest(`/api/photos?instance_id=${instanceId}`),
    enabled: !!instanceId
  });

  if (isLoading) {
    return <div className="p-6">Carregando...</div>;
  }

  if (!instance) {
    return <div className="p-6">Turma não encontrada</div>;
  }

  const getSituationColor = (situation: string) => {
    const colors = {
      'execucao': 'text-green-600 bg-green-50',
      'planejamento': 'text-yellow-600 bg-yellow-50',
      'encerrada': 'text-gray-600 bg-gray-50'
    };
    return colors[situation as keyof typeof colors] || 'text-gray-600 bg-gray-50';
  };

  const activeEnrollments = enrollments.filter((e: any) => e.active);
  const totalVacancies = 25; // Default capacity
  const occupiedVacancies = activeEnrollments.length;
  const vacancyPercentage = (occupiedVacancies / totalVacancies) * 100;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Status */}
      <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" onClick={() => setLocation('/pec')} data-testid="btn-back">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{instance.title}</h1>
              <div className="flex items-center gap-4 mt-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Status:</span>
                  <Badge className={getSituationColor(instance.situation)}>
                    {instance.situation === 'execucao' ? 'Ativa' : instance.situation}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Situação:</span>
                  <span className="text-sm text-gray-600">{instance.situation === 'execucao' ? 'Execução' : 'Planejamento'}</span>
                </div>
                <Button size="sm" variant="outline" data-testid="btn-print">
                  <FileDown className="h-4 w-4 mr-2" />
                  Imprimir
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="details" data-testid="tab-details">Detalhes</TabsTrigger>
            <TabsTrigger value="enrollments" data-testid="tab-enrollments">Inscritos</TabsTrigger>
            <TabsTrigger value="sessions" data-testid="tab-sessions">Sessões & Diário</TabsTrigger>
            <TabsTrigger value="gallery" data-testid="tab-gallery">Galeria</TabsTrigger>
            <TabsTrigger value="report" data-testid="tab-report">Relatório Mensal</TabsTrigger>
          </TabsList>

          {/* Details Tab */}
          <TabsContent value="details" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Detalhes da Turma</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label className="font-semibold">Título da Turma</Label>
                    <p className="text-gray-700">{instance.title}</p>
                  </div>
                  <div>
                    <Label className="font-semibold">Código</Label>
                    <p className="text-gray-700">{instance.code || 'Não definido'}</p>
                  </div>
                  <div>
                    <Label className="font-semibold">Faixa Etária</Label>
                    <p className="text-gray-700">{instance.min_age} - {instance.max_age} anos</p>
                  </div>
                  <div>
                    <Label className="font-semibold">Categoria SCFV</Label>
                    <p className="text-gray-700">Serviço de Convivência</p>
                  </div>
                  <div>
                    <Label className="font-semibold">Período de Ocorrência</Label>
                    <p className="text-gray-700">{instance.start_date} até {instance.end_date}</p>
                  </div>
                  <div>
                    <Label className="font-semibold">Período do Dia</Label>
                    <Badge>{instance.day_period}</Badge>
                  </div>
                  <div>
                    <Label className="font-semibold">Local</Label>
                    <p className="text-gray-700">{instance.location}</p>
                  </div>
                  <div>
                    <Label className="font-semibold">Controle de Presença</Label>
                    <p className="text-gray-700">Sim</p>
                  </div>
                  <div>
                    <Label className="font-semibold">Quem pode participar</Label>
                    <p className="text-gray-700">Crianças e adolescentes de {instance.min_age} a {instance.max_age} anos</p>
                  </div>
                  <div>
                    <Label className="font-semibold">Carga Horária Total</Label>
                    <p className="text-gray-700">{instance.total_hours || 'Não definido'}</p>
                  </div>
                  <div className="md:col-span-2">
                    <Label className="font-semibold">Descrição</Label>
                    <p className="text-gray-700">{instance.observations || 'Sem observações'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Enrollments Tab */}
          <TabsContent value="enrollments" className="space-y-6">
            {/* Vacancy Donut */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="md:col-span-1">
                <CardHeader>
                  <CardTitle className="text-center">Ocupação de Vagas</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="relative w-32 h-32 mx-auto mb-4">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        stroke="#e5e7eb"
                        strokeWidth="8"
                        fill="none"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        stroke="#3b82f6"
                        strokeWidth="8"
                        fill="none"
                        strokeDasharray={`${vacancyPercentage * 2.51}, 251.2`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-2xl font-bold">{occupiedVacancies}</div>
                        <div className="text-xs text-gray-500">/{totalVacancies}</div>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">
                    {vacancyPercentage.toFixed(1)}% ocupado
                  </p>
                </CardContent>
              </Card>
              
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Lista de Inscritos ({activeEnrollments.length})</span>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" data-testid="btn-import-csv">
                        <Upload className="h-4 w-4 mr-2" />
                        Importar CSV
                      </Button>
                      <Button size="sm" data-testid="btn-new-enrollment">
                        <UserPlus className="h-4 w-4 mr-2" />
                        Nova Inscrição
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {activeEnrollments.length === 0 ? (
                    <div className="text-center py-8">
                      <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">Nenhum inscrito ainda</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {activeEnrollments.map((enrollment: any, index: number) => (
                        <div key={enrollment.id || index} className="flex items-center justify-between p-3 border rounded" data-testid={`enrollment-${index}`}>
                          <div className="flex items-center space-x-4">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="bg-blue-100 text-blue-600">
                                {enrollment.full_name?.substring(0, 2).toUpperCase() || 'IN'}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <p className="font-medium">{enrollment.full_name || `Inscrito ${index + 1}`}</p>
                              <div className="flex items-center gap-4 text-sm text-gray-600">
                                <span>Gênero: {enrollment.gender || 'Não informado'}</span>
                                <span>Idade: {enrollment.age || 'N/A'} anos</span>
                                <span>Inscrição: {enrollment.enrollment_date || 'N/A'}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={enrollment.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                              {enrollment.active ? 'Ativo' : 'Inativo'}
                            </Badge>
                            <Button size="sm" variant="ghost">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Sessions Tab */}
          <TabsContent value="sessions" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Calendar */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Calendário de Sessões</span>
                    <Button size="sm" data-testid="btn-create-session">
                      <Plus className="h-4 w-4 mr-2" />
                      Criar Sessão
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Calendar
                    mode="single"
                    selected={selectedMonth}
                    onSelect={(date) => date && setSelectedMonth(date)}
                    locale={pt}
                    className="rounded-md border"
                  />
                </CardContent>
              </Card>

              {/* Session Details */}
              <Card>
                <CardHeader>
                  <CardTitle>Detalhes da Sessão Selecionada</CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedMonth ? (
                    <div className="space-y-4">
                      <div className="text-center py-4">
                        <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-600">Sessão do dia {format(selectedMonth, 'dd/MM/yyyy', { locale: pt })}</p>
                        <Button className="mt-4" size="sm" data-testid="btn-launch-attendance">
                          <Check className="h-4 w-4 mr-2" />
                          Lançar Presença
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">Selecione uma data no calendário</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sessions Table */}
            <Card>
              <CardHeader>
                <CardTitle>Diário de Sessões</CardTitle>
              </CardHeader>
              <CardContent>
                {sessions.length === 0 ? (
                  <div className="text-center py-8">
                    <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Nenhuma sessão registrada</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-300">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="border border-gray-300 p-2 text-left">Data</th>
                          <th className="border border-gray-300 p-2 text-left">Carga Horária</th>
                          <th className="border border-gray-300 p-2 text-left">Conteúdo/Atividade</th>
                          <th className="border border-gray-300 p-2 text-left">Educador(es)</th>
                          <th className="border border-gray-300 p-2 text-left">Local</th>
                          <th className="border border-gray-300 p-2 text-left">Status</th>
                          <th className="border border-gray-300 p-2 text-left">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sessions.map((session: any, index: number) => (
                          <tr key={session.id || index} data-testid={`session-${index}`}>
                            <td className="border border-gray-300 p-2">{session.date}</td>
                            <td className="border border-gray-300 p-2">{session.hours}h</td>
                            <td className="border border-gray-300 p-2">{session.content}</td>
                            <td className="border border-gray-300 p-2">{session.educators}</td>
                            <td className="border border-gray-300 p-2">{session.location}</td>
                            <td className="border border-gray-300 p-2">
                              <Badge className={session.status === 'realizado' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                                {session.status}
                              </Badge>
                            </td>
                            <td className="border border-gray-300 p-2">
                              <Button size="sm" variant="ghost">
                                <Edit className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Gallery Tab */}
          <TabsContent value="gallery" className="space-y-6">
            <PhotoGallery instanceId={parseInt(instanceId || '0')} />
          </TabsContent>

          {/* Monthly Report Tab */}
          <TabsContent value="report" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Relatório Mensal</span>
                  <div className="flex items-center gap-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" data-testid="btn-select-month">
                          <CalendarIcon className="h-4 w-4 mr-2" />
                          Selecionar Mês
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={selectedMonth}
                          onSelect={(date) => date && setSelectedMonth(date)}
                          locale={pt}
                        />
                      </PopoverContent>
                    </Popover>
                    <Button data-testid="btn-generate-pdf">
                      <FileDown className="h-4 w-4 mr-2" />
                      Exportar PDF
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Report Preview */}
                  <div className="border-2 border-dashed border-gray-300 p-8 text-center">
                    <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">
                      Preview do Relatório - {format(selectedMonth, 'MMMM yyyy', { locale: pt })}
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Relatório mensal da turma {instance.title}
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="bg-gray-50 p-4 rounded">
                        <p className="font-semibold">Total de Sessões</p>
                        <p className="text-2xl font-bold text-blue-600">{sessions.length}</p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded">
                        <p className="font-semibold">Frequência Média</p>
                        <p className="text-2xl font-bold text-green-600">85%</p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded">
                        <p className="font-semibold">Inscritos Ativos</p>
                        <p className="text-2xl font-bold text-purple-600">{activeEnrollments.length}</p>
                      </div>
                    </div>
                    <Button className="mt-4" size="lg" onClick={handleGenerateSlides} data-testid="btn-export-report">
                      <Download className="h-4 w-4 mr-2" />
                      Criar Relatório PowerPoint
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// Project View Modal Component
function ProjectViewModal({ open, onClose, project }: { open: boolean; onClose: () => void; project?: any }) {
  if (!project) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Detalhes do Projeto
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold text-gray-700">Nome do Projeto</label>
              <p className="text-gray-900 bg-gray-50 p-2 rounded border">{project.name}</p>
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700">Categoria</label>
              <p className="text-gray-900 bg-gray-50 p-2 rounded border">{project.category || 'SCFV'}</p>
            </div>
          </div>
          
          <div>
            <label className="text-sm font-semibold text-gray-700">Descrição</label>
            <p className="text-gray-900 bg-gray-50 p-3 rounded border min-h-[60px]">{project.description}</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold text-gray-700">Data de Início</label>
              <p className="text-gray-900 bg-gray-50 p-2 rounded border">
                {project.period_start ? format(new Date(project.period_start), 'dd/MM/yyyy', { locale: pt }) : 'Não definida'}
              </p>
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700">Data de Fim</label>
              <p className="text-gray-900 bg-gray-50 p-2 rounded border">
                {project.period_end ? format(new Date(project.period_end), 'dd/MM/yyyy', { locale: pt }) : 'Não definida'}
              </p>
            </div>
          </div>
          
          <div>
            <label className="text-sm font-semibold text-gray-700">Quem Pode Participar</label>
            <p className="text-gray-900 bg-gray-50 p-3 rounded border min-h-[60px]">{project.who_can_participate || 'Não especificado'}</p>
          </div>
          
          {/* Project Stats */}
          <div className="border-t pt-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Estatísticas do Projeto</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-3 rounded border">
                <p className="text-xs text-blue-600 font-semibold">ID DO PROJETO</p>
                <p className="text-lg font-bold text-blue-800">#{project.id}</p>
              </div>
              <div className="bg-green-50 p-3 rounded border">
                <p className="text-xs text-green-600 font-semibold">STATUS</p>
                <p className="text-lg font-bold text-green-800">Ativo</p>
              </div>
              <div className="bg-purple-50 p-3 rounded border">
                <p className="text-xs text-purple-600 font-semibold">COORDENADOR</p>
                <p className="text-lg font-bold text-purple-800">PEC</p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Activity View Modal Component
function ActivityViewModal({ open, onClose, activity }: { open: boolean; onClose: () => void; activity?: any }) {
  if (!activity) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Detalhes da Atividade
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold text-gray-700">Nome da Atividade</label>
              <p className="text-gray-900 bg-gray-50 p-2 rounded border">{activity.name}</p>
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700">Período do Dia</label>
              <p className="text-gray-900 bg-gray-50 p-2 rounded border capitalize">{activity.day_period}</p>
            </div>
          </div>
          
          <div>
            <label className="text-sm font-semibold text-gray-700">Descrição</label>
            <p className="text-gray-900 bg-gray-50 p-3 rounded border min-h-[60px]">{activity.description}</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold text-gray-700">Controle de Presença</label>
              <p className="text-gray-900 bg-gray-50 p-2 rounded border">
                {activity.requires_attendance ? 'Obrigatório' : 'Opcional'}
              </p>
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700">Projeto Vinculado</label>
              <p className="text-gray-900 bg-gray-50 p-2 rounded border">#{activity.project_id}</p>
            </div>
          </div>
          
          {/* Activity Stats */}
          <div className="border-t pt-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Estatísticas da Atividade</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-3 rounded border">
                <p className="text-xs text-blue-600 font-semibold">ID DA ATIVIDADE</p>
                <p className="text-lg font-bold text-blue-800">#{activity.id}</p>
              </div>
              <div className="bg-green-50 p-3 rounded border">
                <p className="text-xs text-green-600 font-semibold">STATUS</p>
                <p className="text-lg font-bold text-green-800">Ativa</p>
              </div>
              <div className="bg-purple-50 p-3 rounded border">
                <p className="text-xs text-purple-600 font-semibold">TIPO</p>
                <p className="text-lg font-bold text-purple-800">PEC</p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

