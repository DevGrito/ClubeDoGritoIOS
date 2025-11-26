import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Crown,
  UserPlus,
  Users,
  Shield,
  GraduationCap,
  Briefcase,
  Star,
  UserCheck,
  UserX,
  UserMinus,
  BarChart3,
  FileText,
  Database,
  Settings,
  Activity,
  Lock,
  AlertTriangle,
  LogOut,
  Home,
  DollarSign,
  Heart,
  Building,
  Handshake,
  TrendingUp,
  PieChart,
  Calendar,
  Clock,
  LineChart,
  Target,
  Award,
  MapPin,
  BookOpen,
  CheckCircle,
  XCircle,
  AlertCircle,
  Percent,
  TrendingDown,
  User,
  Save,
  RefreshCw,
  Trophy,
  Code,
  Menu,
  Filter,
  Monitor,
  ChevronUp,
  ChevronDown,
  ExternalLink,
  ClipboardList
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLocation } from "wouter";
import Logo from "@/components/logo";
import { leoMartinsEmail, isLeoMartins } from "@shared/conselho";
import { useToast } from "@/hooks/use-toast";
import { useDevAccess } from "@/hooks/useDevAccess";
import favela3dLogo from "@assets/Logo_Favela3D_GF_positivoo_1754341182028.png";
import { useIsMobile } from "@/hooks/use-mobile";
import MetaRealizadoCard from "@/components/meta-realizado-card";
import ConselhoApprovalManager from "@/components/conselho-approval-manager";
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  LineChart as RechartsLineChart,
  Line,
  Area,
  AreaChart,
  RadialBarChart,
  RadialBar,
  ComposedChart,
} from "recharts";

import { chartData } from "@/data/leoMartins";

interface LeoMartinsProps {
  demoMode?: boolean;
}

// Componente Seção Colaboradores
function ColaboradoresSection() {
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartamento, setSelectedDepartamento] = useState("Todos");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  // Buscar estatísticas
  const { data: statsData } = useQuery<any>({
    queryKey: ["/api/colaboradores/stats"],
  });

  // Buscar lista de colaboradores
  const { data: colaboradoresData } = useQuery<any>({
    queryKey: [
      "/api/colaboradores",
      currentPage,
      pageSize,
      selectedDepartamento,
      searchTerm,
    ],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        pageSize: pageSize.toString(),
      });
      if (selectedDepartamento !== "Todos")
        params.append("departamento", selectedDepartamento);
      if (searchTerm.trim()) params.append("search", searchTerm.trim());

      const response = await fetch(`/api/colaboradores?${params}`);
      if (!response.ok) throw new Error("Erro ao buscar colaboradores");
      return response.json();
    },
    enabled: showModal,
  });

  const departamentos = [
    "Todos",
    "Inclusão Produtiva",
    "Administrativo Financeiro",
    "Administrativo",
    "Marketing",
    "Psicossocial",
    "Favela 3D",
    "GRIFT",
    "Outlet",
    "Casa Sonhar",
    "Casa Sonhar e PEC",
  ];

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const totalPages = colaboradoresData
    ? Math.ceil(colaboradoresData.total / pageSize)
    : 1;

  return (
    <div className="space-y-6">
      {/* Header Cards */}
      <div className="grid grid-cols-1 md:grid-cols-1 gap-4 max-w-md mx-auto">
        <Card className="border-blue-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Colaboradores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {statsData?.totalColaboradores || 0}
            </div>
            <p className="text-xs text-gray-500">Colaboradores ativos</p>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de Distribuição por Departamento */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="w-5 h-5 text-purple-600" />
            Distribuição por Departamento
          </CardTitle>
        </CardHeader>
        <CardContent>
          {statsData?.distribuicao && typeof window !== "undefined" && (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={statsData.distribuicao}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="departamento"
                  angle={-45}
                  textAnchor="end"
                  height={100}
                />
                <YAxis />
                <Tooltip />
                <Bar dataKey="total" fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Botão Ver Todos */}
      <div className="flex justify-center">
        <Button
          onClick={() => setShowModal(true)}
          className="bg-purple-600 hover:bg-purple-700"
          size="lg"
        >
          <Users className="w-5 h-5 mr-2" />
          Ver todos os colaboradores
        </Button>
      </div>

      {/* Modal de Listagem */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">Colaboradores</h2>
                <Button variant="ghost" onClick={() => setShowModal(false)}>
                  <XCircle className="w-6 h-6" />
                </Button>
              </div>

              {/* Filtros */}
              <div className="flex flex-col md:flex-row gap-4">
                <Input
                  placeholder="Buscar por nome ou telefone..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="flex-1"
                />
                <Select
                  value={selectedDepartamento}
                  onValueChange={(v) => {
                    setSelectedDepartamento(v);
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="w-full md:w-64">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {departamentos.map((dep) => (
                      <SelectItem key={dep} value={dep}>
                        {dep}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="overflow-auto max-h-[60vh]">
              <table className="w-full">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Nome
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Telefone
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Departamento
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {colaboradoresData?.items?.map((col: any) => (
                    <tr key={col.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        {col.nome}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => copyToClipboard(col.telefone)}
                          className="text-blue-600 hover:text-blue-800 flex items-center gap-2"
                        >
                          {col.telefone}
                          <Save className="w-4 h-4" />
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant="outline">{col.departamento}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paginação */}
            <div className="p-4 border-t flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Total: {colaboradoresData?.total || 0} colaboradores
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Anterior
                </Button>
                <span className="px-4 py-2 text-sm">
                  Página {currentPage} de {totalPages}
                </span>
                <Button
                  variant="outline"
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                >
                  Próxima
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Componente Relatório Financeiro Detalhado
function RelatorioFinanceiroDetalhado() {
  const [mesSelecionado, setMesSelecionado] = useState<string>("2025");
  const [departamentoSelecionado, setDepartamentoSelecionado] = useState<string>("TODOS");

  const { data: departamentosData } = useQuery<any>({
    queryKey: ['/api/financeiro/departamentos'],
  });

  const { data: consolidado, isLoading } = useQuery<any>({
    queryKey: ['/api/financeiro/consolidado', mesSelecionado, departamentoSelecionado],
    queryFn: async () => {
      const params = new URLSearchParams({ periodo: mesSelecionado });
      if (departamentoSelecionado !== 'TODOS') params.append('departamento', departamentoSelecionado);
      const response = await fetch(`/api/financeiro/consolidado?${params}`);
      return response.json();
    },
  });

  const meses = [
    { value: "2025", label: "Ano Completo 2025" },
    { value: "2025-01", label: "Janeiro 2025" },
    { value: "2025-02", label: "Fevereiro 2025" },
    { value: "2025-03", label: "Março 2025" },
    { value: "2025-04", label: "Abril 2025" },
    { value: "2025-05", label: "Maio 2025" },
    { value: "2025-06", label: "Junho 2025" },
    { value: "2025-07", label: "Julho 2025" },
    { value: "2025-08", label: "Agosto 2025" },
    { value: "2025-09", label: "Setembro 2025" },
    { value: "2025-10", label: "Outubro 2025" },
    { value: "2025-11", label: "Novembro 2025" },
    { value: "2025-12", label: "Dezembro 2025" },
  ];

  const formatMoney = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  if (isLoading) return <div className="p-6">Carregando dados financeiros...</div>;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-blue-600" />
            Filtros do Relatório
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Período</Label>
              <Select value={mesSelecionado} onValueChange={setMesSelecionado}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {meses.map(mes => (
                    <SelectItem key={mes.value} value={mes.value}>{mes.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Departamento</Label>
              <Select value={departamentoSelecionado} onValueChange={setDepartamentoSelecionado}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODOS">Todos os Departamentos</SelectItem>
                  {departamentosData?.departamentos?.map((dep: any) => (
                    <SelectItem key={dep.slug} value={dep.slug}>{dep.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-green-600" />
            Dashboard Financeiro - {meses.find(m => m.value === mesSelecionado)?.label}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 border rounded-lg bg-blue-50">
              <p className="text-sm text-gray-600 mb-2">Planejamento</p>
              <p className="text-3xl font-bold text-blue-600">{formatMoney(consolidado?.totais?.despesas_meta || 0)}</p>
              <p className="text-xs text-gray-500 mt-1">Metas da Planilha</p>
            </div>
            <div className="p-6 border rounded-lg bg-orange-50">
              <p className="text-sm text-gray-600 mb-2">Realizado (Pivot)</p>
              <p className="text-3xl font-bold text-orange-600">{formatMoney(consolidado?.totais?.despesas_realizado || 0)}</p>
              <p className="text-xs text-gray-500 mt-1">Controle de Pagamentos</p>
            </div>
            <div className={`p-6 border rounded-lg ${(consolidado?.totais?.despesas_resultado || 0) > 0 ? 'bg-green-50' : 'bg-red-50'}`}>
              <p className="text-sm text-gray-600 mb-2">Saldo Final</p>
              <p className={`text-3xl font-bold ${(consolidado?.totais?.despesas_resultado || 0) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatMoney(consolidado?.totais?.despesas_resultado || 0)}
              </p>
              <p className="text-xs text-gray-500 mt-1">{(consolidado?.totais?.despesas_resultado || 0) > 0 ? '(Economia)' : '(Excedente)'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {departamentoSelecionado === 'TODOS' && consolidado?.por_departamento && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="w-5 h-5 text-purple-600" />
              Gastos por Departamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3">Departamento</th>
                    <th className="text-right p-3">Contas a Pagar</th>
                    <th className="text-right p-3">Contas a Receber</th>
                    <th className="text-right p-3">Saldo</th>
                  </tr>
                </thead>
                <tbody>
                  {consolidado.por_departamento.map((dep: any) => (
                    <tr key={dep.departamento} className="border-b hover:bg-gray-50">
                      <td className="p-3 font-medium">{dep.nome}</td>
                      <td className="p-3 text-right text-orange-600">{formatMoney(dep.contas_pagar)}</td>
                      <td className="p-3 text-right text-green-600">{formatMoney(dep.contas_receber)}</td>
                      <td className={`p-3 text-right font-semibold ${dep.saldo >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatMoney(dep.saldo)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {consolidado?.dados_mensais && typeof window !== 'undefined' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              Evolução Mensal de Despesas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={consolidado.dados_mensais}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis />
                <Tooltip formatter={(value) => formatMoney(Number(value))} />
                <Legend />
                <Bar dataKey="contas_pagar" name="Despesas" fill="#f97316" />
                <Bar dataKey="meta" name="Meta" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Componente Carrossel de Métricas (movido para fora do escopo principal)
function MetricsCarousel({ mesSelecionadoDashboard, totalPatrocinadoresAtivos, calcularAlunosAtivosMes, dadosMensais, dadosMensaisPEC }: any) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false, align: 'start' });
  const [selectedIndex, setSelectedIndex] = useState(0);

  const scrollTo = useCallback((index: number) => {
    if (emblaApi) emblaApi.scrollTo(index);
  }, [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
  }, [emblaApi, onSelect]);

  const cards = [
    {
      title: "Total Doadores",
      value: 15,
      subtitle: "Doadores ativos",
      meta: 1500,
      percentual: ((15 / 1500) * 100).toFixed(1)
    },
    {
      title: "Alunos Ativos",
      value: calcularAlunosAtivosMes(mesSelecionadoDashboard),
      subtitle: dadosMensais?.meses?.[mesSelecionadoDashboard] || dadosMensaisPEC?.meses?.[mesSelecionadoDashboard] 
        ? `${dadosMensais?.meses?.[mesSelecionadoDashboard] || dadosMensaisPEC?.meses?.[mesSelecionadoDashboard]} 2025` 
        : 'Estudantes participantes',
      meta: 995,
      percentual: ((calcularAlunosAtivosMes(mesSelecionadoDashboard) / 995) * 100).toFixed(1)
    },
    {
      title: "Patrocinadores",
      value: totalPatrocinadoresAtivos,
      subtitle: "Parceiros cadastrados",
      meta: null
    },
    {
      title: "Colaboradores",
      value: 45,
      subtitle: "Equipe colaborativa",
      meta: null
    }
  ];

  return (
    <div className="relative mb-4">
      <div className="overflow-hidden rounded-lg mb-4" ref={emblaRef}>
        <div className="flex gap-4">
          {cards.map((card, index) => (
            <div key={index} className="flex-[0_0_100%] min-w-0 md:flex-[0_0_calc(50%-8px)] lg:flex-[0_0_calc(25%-12px)]">
              <Card className="overflow-hidden h-full">
                <CardHeader className="pb-3 bg-yellow-400">
                  <CardTitle className="text-sm font-bold text-black">{card.title}</CardTitle>
                </CardHeader>
                <CardContent className="bg-white pt-4">
                  <div className="text-2xl font-bold text-black">{card.value}</div>
                  <p className="text-xs text-gray-500">{card.subtitle}</p>
                  {card.meta && (
                    <div className="mt-2 pt-2 border-t border-gray-200">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-semibold text-blue-600">Meta:</span>
                        <span className="text-xs font-semibold text-blue-600">{card.meta.toLocaleString('pt-BR')}</span>
                      </div>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-xs font-semibold text-gray-700">Realizado:</span>
                        <div className="flex items-center gap-1">
                          <span className={`text-xs font-bold ${
                            parseFloat(card.percentual) >= 90 ? 'text-green-600' : 
                            parseFloat(card.percentual) >= 70 ? 'text-yellow-600' : 
                            'text-red-600'
                          }`}>
                            {card.percentual}%
                          </span>
                          {parseFloat(card.percentual) >= 90 ? (
                            <TrendingUp className="w-3 h-3 text-green-600" />
                          ) : parseFloat(card.percentual) >= 70 ? (
                            <span className="text-yellow-600 text-xs">→</span>
                          ) : (
                            <TrendingDown className="w-3 h-3 text-red-600" />
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </div>
      
      {/* Indicadores amarelos embaixo */}
      <div className="flex justify-center gap-2">
        {cards.map((_, index) => (
          <button
            key={index}
            onClick={() => scrollTo(index)}
            className={`w-2 h-2 rounded-full transition-all ${
              index === selectedIndex 
                ? 'bg-[#FFCC00] w-6' 
                : 'bg-gray-300'
            }`}
            aria-label={`Ir para slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

export default function LeoMartins({ demoMode = false }: LeoMartinsProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [isLeo, setIsLeo] = useState(false);
  const [activeSection, setActiveSection] = useState("dashboard");
  const [gestaoVistaData, setGestaoVistaData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tempName, setTempName] = useState("");
  const [tempPhone, setTempPhone] = useState("");
  const [isComponentReady, setIsComponentReady] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [indicadoresData, setIndicadoresData] = useState<any>(null);
  const [dadosMensais, setDadosMensais] = useState<any>(null);
  const [mesSelecionadoLab, setMesSelecionadoLab] = useState<number>(0); // LAB. VOZES DO FUTURO
  const [mesSelecionadoCursos30h, setMesSelecionadoCursos30h] = useState<number>(0); // CURSOS PRESENCIAIS
  const [mesSelecionadoEad, setMesSelecionadoEad] = useState<number>(0); // CURSOS EAD CGD
  const [dadosMensaisPsicossocial, setDadosMensaisPsicossocial] = useState<any>(null);
  const [mesSelecionadoPsicossocial, setMesSelecionadoPsicossocial] = useState<number>(0); // 0 = Jan, 11 = Dez
  const [dadosMensaisPEC, setDadosMensaisPEC] = useState<any>(null);
  const [mesSelecionadoPEC, setMesSelecionadoPEC] = useState<number>(0); // 0 = Jan, 11 = Dez
  const [dadosMensaisFavela3D, setDadosMensaisFavela3D] = useState<any>(null);
  const [mesSelecionadoFavela3D, setMesSelecionadoFavela3D] = useState<number>(0); // 0 = Jan, 11 = Dez
  const [mesSelecionadoDashboard, setMesSelecionadoDashboard] = useState<number>(7); // 7 = Agosto - Dashboard geral
  const [marketingData, setMarketingData] = useState<any>(null);
  const [anoPatrocinador, setAnoPatrocinador] = useState<number>(2024); // Ano selecionado para patrocinadores (ano anterior)
  const [selectedArea, setSelectedArea] = useState<string | null>(null); // Área selecionada de cursos (tecnologia, beleza, etc.)
  const [selectedModalidade, setSelectedModalidade] = useState<string | null>(null); // Modalidade selecionada (presencial/ead)
  const isMobile = useIsMobile();
  const anoAnterior = new Date().getFullYear() - 1;

  // Definir mês atual (0 = Jan, 9 = Out) - Outubro 2025
  const mesAtualIndex = 9; // Out = mês 10, índice 9

  // Hook para acesso de desenvolvedor
  const devAccess = useDevAccess();

  // Query para buscar patrocinadores
  const { data: patrocinadoresData, isLoading, error } = useQuery({
  queryKey: ['/api/patrocinadores', anoAnterior],
  queryFn: async () => {
    const r = await fetch(`/api/patrocinadores?ano=${anoAnterior}`);
    if (!r.ok) throw new Error('Failed to fetch patrocinadores');
    return r.json();
  }
});

  // Total de patrocinadores (mesma lógica da página de Patrocinadores)
  const totalPatrocinadoresAtivos = patrocinadoresData?.totalPatrocinadores || 0;

  // Buscar dados de indicadores de Inclusão Produtiva
  useEffect(() => {
    const fetchIndicadores = async () => {
      try {
        console.log("🔵 [LEO DASHBOARD] Buscando indicadores...");
        const response = await fetch("/api/inclusao-produtiva/indicadores");
        if (!response.ok) throw new Error("Failed to fetch indicadores");
        const data = await response.json();
        console.log("✅ [LEO DASHBOARD] Indicadores recebidos:", data);
        setIndicadoresData(data);
      } catch (error) {
        console.error("❌ [LEO DASHBOARD] Erro ao buscar indicadores:", error);
      }
    };

    fetchIndicadores();
  }, []);

  // Buscar dados mensais de Inclusão Produtiva 2025
  useEffect(() => {
    const fetchDadosMensais = async () => {
      try {
        console.log("📅 [LEO DASHBOARD] Buscando dados mensais 2025...");
        const response = await fetch("/api/inclusao-produtiva/dados-mensais");
        if (!response.ok) throw new Error("Failed to fetch dados mensais");
        const data = await response.json();
        console.log("✅ [LEO DASHBOARD] Dados mensais recebidos:", data);
        setDadosMensais(data);
        
        // Detectar último mês com dados COMPLETOS para cada projeto individualmente
        data.projetos.forEach((projeto: any) => {
          const frequencia = projeto.indicadores.find((i: any) => i.nome === "Frequência");
          const quantidadeAlunos = projeto.indicadores.find((i: any) => i.nome === "Quantidade de Alunos" || i.nome === "Alunos Ativos");
          
          console.log(`🔍 [${projeto.projeto}] Verificando indicadores:`, {
            frequenciaEncontrada: !!frequencia,
            alunosEncontrado: !!quantidadeAlunos,
            nomeIndicadorAlunos: quantidadeAlunos?.nome
          });
          
          if (frequencia?.mensal && quantidadeAlunos?.mensal) {
            // Encontrar o último mês que tem dados em AMBOS os indicadores
            let ultimoMes = 0;
            for (let i = frequencia.mensal.length - 1; i >= 0; i--) {
              const temFreq = frequencia.mensal[i] !== null;
              const temAlunos = quantidadeAlunos.mensal[i] !== null;
              
              console.log(`  Mês ${data.meses[i]} (${i}): Freq=${frequencia.mensal[i]} (${temFreq}), Alunos=${quantidadeAlunos.mensal[i]} (${temAlunos})`);
              
              if (temFreq && temAlunos) {
                ultimoMes = i;
                console.log(`  ✅ Último mês completo encontrado: ${data.meses[i]} (índice ${i})`);
                break;
              }
            }
            
            // Definir o estado específico de cada projeto
            if (projeto.projeto === "LAB. VOZES DO FUTURO") {
              console.log(`📅 [LAB] Setando mês: ${data.meses[ultimoMes]} (índice ${ultimoMes})`);
              setMesSelecionadoLab(ultimoMes);
            } else if (projeto.projeto === "CURSOS PRESENCIAIS") {
              console.log(`📅 [CURSOS 30H] Setando mês: ${data.meses[ultimoMes]} (índice ${ultimoMes})`);
              setMesSelecionadoCursos30h(ultimoMes);
            } else if (projeto.projeto === "CURSOS EAD CGD") {
              console.log(`📅 [EAD] Setando mês: ${data.meses[ultimoMes]} (índice ${ultimoMes})`);
              setMesSelecionadoEad(ultimoMes);
            }
          }
        });
      } catch (error) {
        console.error(
          "❌ [LEO DASHBOARD] Erro ao buscar dados mensais:",
          error
        );
      }
    };

    fetchDadosMensais();
  }, []);

  // Buscar dados mensais de Psicossocial 2025
  useEffect(() => {
    const fetchDadosMensaisPsicossocial = async () => {
      try {
        console.log("📅 [PSICOSSOCIAL] Buscando dados mensais 2025...");
        const response = await fetch("/api/psicossocial/dados-mensais");
        if (!response.ok)
          throw new Error("Failed to fetch dados mensais psicossocial");
        const data = await response.json();
        console.log("✅ [PSICOSSOCIAL] Dados mensais recebidos:", data);
        setDadosMensaisPsicossocial(data);

        // Detectar último mês com dados disponíveis
        let ultimoMesComDados = 0;
        if (Array.isArray(data.indicadores)) {
          data.indicadores.forEach((indicador: any) => {
            if (indicador.mensal && Array.isArray(indicador.mensal)) {
              indicador.mensal.forEach((valor: any, index: number) => {
                if (valor !== null && index > ultimoMesComDados) {
                  ultimoMesComDados = index;
                }
              });
            }
          });
        }

        console.log(
          `📅 [PSICOSSOCIAL] Último mês com dados: ${data.meses[ultimoMesComDados]}`
        );
        setMesSelecionadoPsicossocial(ultimoMesComDados);
      } catch (error) {
        console.error("❌ [PSICOSSOCIAL] Erro ao buscar dados mensais:", error);
      }
    };

    fetchDadosMensaisPsicossocial();
  }, []);

  // Buscar dados mensais de PEC (Esporte e Cultura) 2025
  useEffect(() => {
    const fetchDadosMensaisPEC = async () => {
      try {
        console.log("📅 [PEC] Buscando dados mensais 2025...");
        const response = await fetch("/api/pec/dados-mensais");
        if (!response.ok) throw new Error("Failed to fetch dados mensais PEC");
        const data = await response.json();
        console.log("✅ [PEC] Dados mensais recebidos:", data);
        setDadosMensaisPEC(data);

        // Detectar último mês com dados disponíveis
        let ultimoMesComDados = 0;
        if (Array.isArray(data.projetos)) {
          data.projetos.forEach((projeto: any) => {
            if (projeto.indicadores && Array.isArray(projeto.indicadores)) {
              projeto.indicadores.forEach((indicador: any) => {
                if (indicador.mensal && Array.isArray(indicador.mensal)) {
                  indicador.mensal.forEach((valor: any, index: number) => {
                    if (valor !== null && index > ultimoMesComDados) {
                      ultimoMesComDados = index;
                    }
                  });
                }
              });
            }
          });
        }

        console.log(
          `📅 [PEC] Último mês com dados: ${data.meses[ultimoMesComDados]}`
        );
        setMesSelecionadoPEC(ultimoMesComDados);
      } catch (error) {
        console.error("❌ [PEC] Erro ao buscar dados mensais:", error);
      }
    };

    fetchDadosMensaisPEC();
  }, []);

  // Buscar dados mensais de Favela 3D 2025
  useEffect(() => {
    const fetchDadosMensaisFavela3D = async () => {
      try {
        console.log("📅 [FAVELA 3D] Buscando dados mensais 2025...");
        const response = await fetch("/api/favela-3d/dados-mensais");
        if (!response.ok)
          throw new Error("Failed to fetch dados mensais Favela 3D");
        const data = await response.json();
        console.log("✅ [FAVELA 3D] Dados mensais recebidos:", data);
        setDadosMensaisFavela3D(data);

        // Detectar último mês com dados disponíveis
        let ultimoMesComDados = 0;
        if (Array.isArray(data.eixos)) {
          data.eixos.forEach((eixo: any) => {
            if (eixo.indicadores && Array.isArray(eixo.indicadores)) {
              eixo.indicadores.forEach((indicador: any) => {
                if (indicador.mensal && Array.isArray(indicador.mensal)) {
                  indicador.mensal.forEach((valor: any, index: number) => {
                    if (valor !== null && index > ultimoMesComDados) {
                      ultimoMesComDados = index;
                    }
                  });
                }
              });
            }
          });
        }

        console.log(
          `📅 [FAVELA 3D] Último mês com dados: ${data.meses[ultimoMesComDados]}`
        );
        setMesSelecionadoFavela3D(ultimoMesComDados);
      } catch (error) {
        console.error("❌ [FAVELA 3D] Erro ao buscar dados mensais:", error);
      }
    };

    fetchDadosMensaisFavela3D();
  }, []);

  // Detectar último mês com dados (após carregar todos os dados mensais)
  useEffect(() => {
    if (dadosMensais && dadosMensaisPEC) {
      let ultimoMes = 0;

      // Verificar Inclusão Produtiva
      if (dadosMensais.projetos) {
        dadosMensais.projetos.forEach((projeto: any) => {
          projeto.indicadores?.forEach((indicador: any) => {
            if (indicador.nome === "Quantidade de Alunos" && indicador.mensal) {
              indicador.mensal.forEach((valor: any, index: number) => {
                if (valor !== null && index > ultimoMes) {
                  ultimoMes = index;
                }
              });
            }
          });
        });
      }

      // Verificar PEC
      if (dadosMensaisPEC.projetos) {
        dadosMensaisPEC.projetos.forEach((projeto: any) => {
          projeto.indicadores?.forEach((indicador: any) => {
            if (indicador.nome === "Quantidade de Alunos" && indicador.mensal) {
              indicador.mensal.forEach((valor: any, index: number) => {
                if (valor !== null && index > ultimoMes) {
                  ultimoMes = index;
                }
              });
            }
          });
        });
      }

      console.log(`📅 [DASHBOARD GERAL] Último mês com dados: ${ultimoMes}`);
      setMesSelecionadoDashboard(ultimoMes);
    }
  }, [dadosMensais, dadosMensaisPEC]);

  // Buscar dados de Marketing
  useEffect(() => {
    const fetchMarketingData = async () => {
      try {
        console.log("📊 [MARKETING] Buscando dados do dashboard...");
        const response = await fetch("/api/marketing/dashboard?period=2025-04");
        if (!response.ok) throw new Error("Failed to fetch marketing data");
        const data = await response.json();
        console.log("✅ [MARKETING] Dados recebidos:", data);
        setMarketingData(data);
      } catch (error) {
        console.error("❌ [MARKETING] Erro ao buscar dados:", error);
      }
    };

    fetchMarketingData();
  }, []);

  // Buscar dados dos Doadores
  const { data: doadoresData } = useQuery<any>({
    queryKey: ['/api/doadores/stats'],
  });

  // Buscar dados demográficos (Gênero, Raça/Cor, Idade)
  const { data: dadosDemograficos, isLoading: loadingDemograficos } = useQuery<{
    success: boolean;
    totalParticipantes: number;
    genero: Array<{ name: string; value: number; percentage: number }>;
    racaCor: Array<{ name: string; value: number; percentage: number }>;
    idade: Array<{ name: string; value: number; percentage: number }>;
  }>({
    queryKey: ['/api/dados-demograficos'],
    refetchInterval: 300000,
    refetchOnMount: true,
  });

  // Cores para os gráficos demográficos
  const COLORS_RACA = ['#FFD700', '#FFC107', '#FF9800', '#F97316'];
  const COLORS_GENERO = ['#FFD700', '#FF9800', '#FF6B00'];
  const COLORS_IDADE = ['#FFD700', '#FFC107', '#FF9800', '#FF6B00', '#F97316'];

  // Queries de Cursos de Inclusão Produtiva
  const { data: tecnologiaData } = useQuery<any>({ queryKey: ['/api/inclusao-produtiva/tecnologia'], enabled: selectedArea === 'tecnologia' });
  const { data: belezaData } = useQuery<any>({ queryKey: ['/api/inclusao-produtiva/beleza'], enabled: selectedArea === 'beleza' });
  const { data: artesanatoData } = useQuery<any>({ queryKey: ['/api/inclusao-produtiva/artesanato'], enabled: selectedArea === 'artesanato' });
  const { data: empreendedorismoData } = useQuery<any>({ queryKey: ['/api/inclusao-produtiva/empreendedorismo'], enabled: selectedArea === 'empreendedorismo' });
  const { data: administrativoData } = useQuery<any>({ queryKey: ['/api/inclusao-produtiva/administrativo'], enabled: selectedArea === 'administrativo' });
  const { data: socioemocionalData } = useQuery<any>({ queryKey: ['/api/inclusao-produtiva/socioemocional'], enabled: selectedArea === 'socioemocional' });
  const { data: educacionalData } = useQuery<any>({ queryKey: ['/api/inclusao-produtiva/educacional'], enabled: selectedArea === 'educacional' });
  const { data: operacionalData } = useQuery<any>({ queryKey: ['/api/inclusao-produtiva/operacional'], enabled: selectedArea === 'operacional' });
  const { data: gastronomiaData } = useQuery<any>({ queryKey: ['/api/inclusao-produtiva/gastronomia'], enabled: selectedArea === 'gastronomia' });

  // Dados OFICIAIS dos Patrocinadores 2024 (Total: 56)
  const patrocinadores2024 = [
    // Oficial (1) - R$ 100.000
    { nome: "Banco Mercantil", categoria: "oficial", tipo: "empresa", valorPatrocinio: 100000, status: "ativo", contratosAtivos: true },
    
    // Diamante (2) - R$ 100.000
    { nome: "Construtora Barbosa Mello", categoria: "diamante", tipo: "empresa", valorPatrocinio: 100000, status: "ativo", contratosAtivos: true },
    { nome: "Grupo Boticário", categoria: "diamante", tipo: "empresa", valorPatrocinio: 100000, status: "ativo", contratosAtivos: true },
    
    // Master (10) - R$ 50.000
    { nome: "Patrus Transportes", categoria: "master", tipo: "empresa", valorPatrocinio: 50000, status: "ativo", contratosAtivos: true },
    { nome: "IMAP", categoria: "master", tipo: "empresa", valorPatrocinio: 50000, status: "ativo", contratosAtivos: true },
    { nome: "Milplan", categoria: "master", tipo: "empresa", valorPatrocinio: 50000, status: "ativo", contratosAtivos: true },
    { nome: "Conserva", categoria: "master", tipo: "empresa", valorPatrocinio: 50000, status: "ativo", contratosAtivos: true },
    { nome: "M.Roscoe", categoria: "master", tipo: "empresa", valorPatrocinio: 50000, status: "ativo", contratosAtivos: true },
    { nome: "Via Jap", categoria: "master", tipo: "empresa", valorPatrocinio: 50000, status: "ativo", contratosAtivos: true },
    { nome: "Via Natsu", categoria: "master", tipo: "empresa", valorPatrocinio: 50000, status: "ativo", contratosAtivos: true },
    { nome: "Inter", categoria: "master", tipo: "empresa", valorPatrocinio: 50000, status: "ativo", contratosAtivos: true },
    { nome: "Tracbel", categoria: "master", tipo: "empresa", valorPatrocinio: 50000, status: "ativo", contratosAtivos: true },
    { nome: "Helena Teixeira", categoria: "master", tipo: "pessoa_fisica", valorPatrocinio: 50000, status: "ativo", contratosAtivos: true },
    
    // Gold (6) - R$ 30.000
    { nome: "Bernoulli", categoria: "gold", tipo: "empresa", valorPatrocinio: 30000, status: "ativo", contratosAtivos: true },
    { nome: "Fidens", categoria: "gold", tipo: "empresa", valorPatrocinio: 30000, status: "ativo", contratosAtivos: true },
    { nome: "Divine", categoria: "gold", tipo: "empresa", valorPatrocinio: 30000, status: "ativo", contratosAtivos: true },
    { nome: "Vetorial", categoria: "gold", tipo: "empresa", valorPatrocinio: 30000, status: "ativo", contratosAtivos: true },
    { nome: "Eugênio Mattar", categoria: "gold", tipo: "pessoa_fisica", valorPatrocinio: 30000, status: "ativo", contratosAtivos: true },
    { nome: "Regina Teixeira", categoria: "gold", tipo: "pessoa_fisica", valorPatrocinio: 30000, status: "ativo", contratosAtivos: true },
    
    // Silver (6) - R$ 20.000
    { nome: "Eupar", categoria: "silver", tipo: "empresa", valorPatrocinio: 20000, status: "ativo", contratosAtivos: true },
    { nome: "Patrimar", categoria: "silver", tipo: "empresa", valorPatrocinio: 20000, status: "ativo", contratosAtivos: true },
    { nome: "Geosol", categoria: "silver", tipo: "empresa", valorPatrocinio: 20000, status: "ativo", contratosAtivos: true },
    { nome: "Life Petlife DogLife", categoria: "silver", tipo: "empresa", valorPatrocinio: 20000, status: "ativo", contratosAtivos: true },
    { nome: "Ricardo Sena", categoria: "silver", tipo: "pessoa_fisica", valorPatrocinio: 20000, status: "ativo", contratosAtivos: true },
    { nome: "Beatriz Teixeira", categoria: "silver", tipo: "pessoa_fisica", valorPatrocinio: 20000, status: "ativo", contratosAtivos: true },
    
    // Bronze (31) - R$ 10.000
    { nome: "AVB", categoria: "bronze", tipo: "empresa", valorPatrocinio: 10000, status: "ativo", contratosAtivos: true },
    { nome: "Fundimig", categoria: "bronze", tipo: "empresa", valorPatrocinio: 10000, status: "ativo", contratosAtivos: true },
    { nome: "Mason Holdings", categoria: "bronze", tipo: "empresa", valorPatrocinio: 10000, status: "ativo", contratosAtivos: true },
    { nome: "Orizonti", categoria: "bronze", tipo: "empresa", valorPatrocinio: 10000, status: "ativo", contratosAtivos: true },
    { nome: "OncoMed", categoria: "bronze", tipo: "empresa", valorPatrocinio: 10000, status: "ativo", contratosAtivos: true },
    { nome: "Corretores", categoria: "bronze", tipo: "empresa", valorPatrocinio: 10000, status: "ativo", contratosAtivos: true },
    { nome: "Serenata", categoria: "bronze", tipo: "empresa", valorPatrocinio: 10000, status: "ativo", contratosAtivos: true },
    { nome: "Taluari", categoria: "bronze", tipo: "empresa", valorPatrocinio: 10000, status: "ativo", contratosAtivos: true },
    { nome: "A-Ponte", categoria: "bronze", tipo: "empresa", valorPatrocinio: 10000, status: "ativo", contratosAtivos: true },
    { nome: "HFC", categoria: "bronze", tipo: "empresa", valorPatrocinio: 10000, status: "ativo", contratosAtivos: true },
    { nome: "Grupo Aterpa", categoria: "bronze", tipo: "empresa", valorPatrocinio: 10000, status: "ativo", contratosAtivos: true },
    { nome: "Gerson Bartolomeo", categoria: "bronze", tipo: "empresa", valorPatrocinio: 10000, status: "ativo", contratosAtivos: true },
    { nome: "J. Mendes", categoria: "bronze", tipo: "empresa", valorPatrocinio: 10000, status: "ativo", contratosAtivos: true },
    { nome: "Kia", categoria: "bronze", tipo: "empresa", valorPatrocinio: 10000, status: "ativo", contratosAtivos: true },
    { nome: "Lubrificantes Savine", categoria: "bronze", tipo: "empresa", valorPatrocinio: 10000, status: "ativo", contratosAtivos: true },
    { nome: "Seculus", categoria: "bronze", tipo: "empresa", valorPatrocinio: 10000, status: "ativo", contratosAtivos: true },
    { nome: "Anuar Donato", categoria: "bronze", tipo: "empresa", valorPatrocinio: 10000, status: "ativo", contratosAtivos: true },
    { nome: "Botelho Spagnol", categoria: "bronze", tipo: "empresa", valorPatrocinio: 10000, status: "ativo", contratosAtivos: true },
    { nome: "Clara", categoria: "bronze", tipo: "empresa", valorPatrocinio: 10000, status: "ativo", contratosAtivos: true },
    { nome: "Caca Gontijo", categoria: "bronze", tipo: "empresa", valorPatrocinio: 10000, status: "ativo", contratosAtivos: true },
    { nome: "Conservasolo", categoria: "bronze", tipo: "empresa", valorPatrocinio: 10000, status: "ativo", contratosAtivos: true },
    { nome: "Estação de Turismo", categoria: "bronze", tipo: "empresa", valorPatrocinio: 10000, status: "ativo", contratosAtivos: true },
    { nome: "ItaoPower", categoria: "bronze", tipo: "empresa", valorPatrocinio: 10000, status: "ativo", contratosAtivos: true },
    { nome: "My Mall", categoria: "bronze", tipo: "empresa", valorPatrocinio: 10000, status: "ativo", contratosAtivos: true },
    { nome: "Sancruza", categoria: "bronze", tipo: "empresa", valorPatrocinio: 10000, status: "ativo", contratosAtivos: true },
    { nome: "Oncoclínicas", categoria: "bronze", tipo: "empresa", valorPatrocinio: 10000, status: "ativo", contratosAtivos: true },
    { nome: "Plena", categoria: "bronze", tipo: "empresa", valorPatrocinio: 10000, status: "ativo", contratosAtivos: true },
    { nome: "Rodcar", categoria: "bronze", tipo: "empresa", valorPatrocinio: 10000, status: "ativo", contratosAtivos: true },
    { nome: "RobbySon", categoria: "bronze", tipo: "empresa", valorPatrocinio: 10000, status: "ativo", contratosAtivos: true },
    { nome: "BTS", categoria: "bronze", tipo: "empresa", valorPatrocinio: 10000, status: "ativo", contratosAtivos: true },
    { nome: "Guilherme Noronha", categoria: "bronze", tipo: "pessoa_fisica", valorPatrocinio: 10000, status: "ativo", contratosAtivos: true },
    { nome: "Adriana Almeida", categoria: "bronze", tipo: "pessoa_fisica", valorPatrocinio: 10000, status: "ativo", contratosAtivos: true },
    { nome: "Lilian e Mauro Tunes", categoria: "bronze", tipo: "pessoa_fisica", valorPatrocinio: 10000, status: "ativo", contratosAtivos: true },
    { nome: "Alícia e Walter Braga", categoria: "bronze", tipo: "pessoa_fisica", valorPatrocinio: 10000, status: "ativo", contratosAtivos: true },
  ];

  // Dados dos Patrocinadores 2025 (da planilha)
  const patrocinadores2025 = [
    // Oficial (1) - R$ 150.000
    { nome: "Conserva de Estradas LTDA", categoria: "oficial", tipo: "empresa", valorPatrocinio: 150000, status: "ativo", contratosAtivos: true },
    
    // Diamante (3) - R$ 100.000
    { nome: "Patrus/IMAP", categoria: "diamante", tipo: "empresa", valorPatrocinio: 100000, status: "ativo", contratosAtivos: true },
    { nome: "Mercantil", categoria: "diamante", tipo: "empresa", valorPatrocinio: 100000, status: "ativo", contratosAtivos: true },
    { nome: "FIDENS", categoria: "diamante", tipo: "empresa", valorPatrocinio: 100000, status: "ativo", contratosAtivos: true },
    
    // Master (6) - R$ 50.000
    { nome: "Helena Teixeira", categoria: "master", tipo: "pessoa_fisica", valorPatrocinio: 50000, status: "ativo", contratosAtivos: true },
    { nome: "Rubens Menin (Inter)", categoria: "master", tipo: "pessoa_fisica", valorPatrocinio: 50000, status: "ativo", contratosAtivos: true },
    { nome: "Doador Anônimo", categoria: "master", tipo: "pessoa_fisica", valorPatrocinio: 50000, status: "ativo", contratosAtivos: true },
    { nome: "Milplan", categoria: "master", tipo: "empresa", valorPatrocinio: 50000, status: "ativo", contratosAtivos: true },
    { nome: "LF P", categoria: "master", tipo: "pessoa_fisica", valorPatrocinio: 50000, status: "ativo", contratosAtivos: true },
    { nome: "Regina Teixeira", categoria: "master", tipo: "pessoa_fisica", valorPatrocinio: 50000, status: "ativo", contratosAtivos: true },
    
    // Gold (6) - R$ 30.000
    { nome: "Ricardo Sena", categoria: "gold", tipo: "pessoa_fisica", valorPatrocinio: 30000, status: "ativo", contratosAtivos: true },
    { nome: "Eugenio Mattar", categoria: "gold", tipo: "pessoa_fisica", valorPatrocinio: 30000, status: "ativo", contratosAtivos: true },
    { nome: "Colégio Bernoulli", categoria: "gold", tipo: "empresa", valorPatrocinio: 30000, status: "ativo", contratosAtivos: true },
    { nome: "Otávio Euler (Eupar)", categoria: "gold", tipo: "pessoa_fisica", valorPatrocinio: 30000, status: "ativo", contratosAtivos: true },
    { nome: "Pedro", categoria: "gold", tipo: "pessoa_fisica", valorPatrocinio: 30000, status: "ativo", contratosAtivos: true },
    { nome: "IFMG/BMG", categoria: "gold", tipo: "empresa", valorPatrocinio: 30000, status: "ativo", contratosAtivos: true },
    
    // Silver (5) - R$ 20.000
    { nome: "Grupo Patrimar", categoria: "silver", tipo: "empresa", valorPatrocinio: 20000, status: "ativo", contratosAtivos: true },
    { nome: "Beatriz Teixeira Siqueira", categoria: "silver", tipo: "pessoa_fisica", valorPatrocinio: 20000, status: "ativo", contratosAtivos: true },
    { nome: "Guilherme Noronha", categoria: "silver", tipo: "pessoa_fisica", valorPatrocinio: 20000, status: "ativo", contratosAtivos: true },
    { nome: "Ronaro e Luciana Corrêa (Vetorial)", categoria: "silver", tipo: "pessoa_fisica", valorPatrocinio: 20000, status: "ativo", contratosAtivos: true },
    { nome: "projetoum", categoria: "silver", tipo: "empresa", valorPatrocinio: 20000, status: "ativo", contratosAtivos: true },
    
    // Bronze (25) - R$ 10.000
    { nome: "A Ponte BH", categoria: "bronze", tipo: "empresa", valorPatrocinio: 10000, status: "ativo", contratosAtivos: true },
    { nome: "Serenata", categoria: "bronze", tipo: "empresa", valorPatrocinio: 10000, status: "ativo", contratosAtivos: true },
    { nome: "Leonardo Abreu (Itau Power Shopping)", categoria: "bronze", tipo: "pessoa_fisica", valorPatrocinio: 10000, status: "ativo", contratosAtivos: true },
    { nome: "Jacques Rios (PTO Andaimes)", categoria: "bronze", tipo: "pessoa_fisica", valorPatrocinio: 10000, status: "ativo", contratosAtivos: true },
    { nome: "Seculus", categoria: "bronze", tipo: "empresa", valorPatrocinio: 10000, status: "ativo", contratosAtivos: true },
    { nome: "Alicia Fiqueiró", categoria: "bronze", tipo: "pessoa_fisica", valorPatrocinio: 10000, status: "ativo", contratosAtivos: true },
    { nome: "Porcaro Negócios Imobiliários", categoria: "bronze", tipo: "empresa", valorPatrocinio: 10000, status: "ativo", contratosAtivos: true },
    { nome: "Márcio Ladeira e Vanessa (Luminatti)", categoria: "bronze", tipo: "pessoa_fisica", valorPatrocinio: 10000, status: "ativo", contratosAtivos: true },
    { nome: "Mauro e Lilian Tunes", categoria: "bronze", tipo: "pessoa_fisica", valorPatrocinio: 10000, status: "ativo", contratosAtivos: true },
    { nome: "Fred Silva (SDS Siderúrgica)", categoria: "bronze", tipo: "pessoa_fisica", valorPatrocinio: 10000, status: "ativo", contratosAtivos: true },
    { nome: "Botelho Spagnol Carvalho Advogados", categoria: "bronze", tipo: "empresa", valorPatrocinio: 10000, status: "ativo", contratosAtivos: true },
    { nome: "Rochedo", categoria: "bronze", tipo: "empresa", valorPatrocinio: 10000, status: "ativo", contratosAtivos: true },
    { nome: "DELP", categoria: "bronze", tipo: "empresa", valorPatrocinio: 10000, status: "ativo", contratosAtivos: true },
    { nome: "SAVINE", categoria: "bronze", tipo: "empresa", valorPatrocinio: 10000, status: "ativo", contratosAtivos: true },
    { nome: "Rita e Marcelo Corrêa (Auto Rede)", categoria: "bronze", tipo: "pessoa_fisica", valorPatrocinio: 10000, status: "ativo", contratosAtivos: true },
    { nome: "Anônimo", categoria: "bronze", tipo: "pessoa_fisica", valorPatrocinio: 10000, status: "ativo", contratosAtivos: true },
    { nome: "Atelier Monica Maia", categoria: "bronze", tipo: "empresa", valorPatrocinio: 10000, status: "ativo", contratosAtivos: true },
    { nome: "FUNDIMIG", categoria: "bronze", tipo: "empresa", valorPatrocinio: 10000, status: "ativo", contratosAtivos: true },
    { nome: "Aterpa", categoria: "bronze", tipo: "empresa", valorPatrocinio: 10000, status: "ativo", contratosAtivos: true },
    { nome: "Evandro Negrão de Lima (My Mall/Sancruza)", categoria: "bronze", tipo: "pessoa_fisica", valorPatrocinio: 10000, status: "ativo", contratosAtivos: true },
    { nome: "Estação de Turismo", categoria: "bronze", tipo: "empresa", valorPatrocinio: 10000, status: "ativo", contratosAtivos: true },
    { nome: "José Raimundo e Jussara", categoria: "bronze", tipo: "pessoa_fisica", valorPatrocinio: 10000, status: "ativo", contratosAtivos: true },
    { nome: "Matheus Campara Elias (Nosso Bazzar)", categoria: "bronze", tipo: "pessoa_fisica", valorPatrocinio: 10000, status: "ativo", contratosAtivos: true },
    { nome: "Anônimo (2)", categoria: "bronze", tipo: "pessoa_fisica", valorPatrocinio: 10000, status: "ativo", contratosAtivos: true },
    { nome: "Cláudio Calonge", categoria: "bronze", tipo: "pessoa_fisica", valorPatrocinio: 10000, status: "ativo", contratosAtivos: true },
  ];

  // Usar dados do banco ao invés de hardcoded (agora vem filtrados do backend por ano)
  const patrocinadoresFiltrados = patrocinadoresData?.patrocinadores || [];

  // Calcular estatísticas dos dados do banco
  const estatisticasFiltradas = {
    totalPatrocinadores: patrocinadoresFiltrados.length,
    investimentoTotal: patrocinadoresFiltrados.reduce(
      (acc: number, p: any) => acc + parseFloat(p.valorPatrocinio || "0"),
      0
    ),
    projetosAtivos: patrocinadoresFiltrados.filter((p: any) => p.status === 'ativo').length,
    contratosAtivos: patrocinadoresFiltrados.length > 0 
      ? Math.round((patrocinadoresFiltrados.filter((p: any) => p.contratosAtivos).length / patrocinadoresFiltrados.length) * 100)
      : 0
  };

  // Helper para pegar último valor não nulo
  const getUltimoValor = (valores: any[]) => {
    if (!valores) return null;
    return [...valores]
      .reverse()
      .find((v: any) => v !== null && v !== undefined);
  };

  // Helper para calcular percentual da meta
  const calcularPercentual = (valor: number, meta: string) => {
    const metaNumero = parseFloat(meta.replace(/[^0-9.]/g, ""));
    if (isNaN(metaNumero) || metaNumero === 0) return null;
    return ((valor / metaNumero) * 100).toFixed(1);
  };

  // Helper para buscar valor do indicador no mês selecionado
  const getValorMensal = (projeto: string, indicador: string) => {
    if (!dadosMensais) return null;
    const projetoData = dadosMensais.projetos.find(
      (p: any) => p.projeto === projeto
    );
    if (!projetoData) return null;
    const indicadorData = projetoData.indicadores.find(
      (i: any) => i.nome === indicador
    );
    if (!indicadorData || !indicadorData.mensal) return null;
    return indicadorData.mensal[mesSelecionadoDashboard];
  };

  // Helper para buscar meta do indicador
  const getMetaIndicador = (projeto: string, indicador: string) => {
    if (!dadosMensais) return null;
    const projetoData = dadosMensais.projetos.find(
      (p: any) => p.projeto === projeto
    );
    if (!projetoData) return null;
    const indicadorData = projetoData.indicadores.find(
      (i: any) => i.nome === indicador
    );
    return indicadorData?.meta || null;
  };

  // Helper para buscar valor do indicador Inclusão Produtiva no mês selecionado
  const getValorMensalInclusao = (projeto: string, indicador: string) => {
    if (!dadosMensais) return null;
    const projetoData = dadosMensais.projetos.find(
      (p: any) => p.projeto === projeto
    );
    if (!projetoData) return null;
    const indicadorData = projetoData.indicadores.find(
      (i: any) => i.nome === indicador
    );
    if (!indicadorData || !indicadorData.mensal) return null;
    
    // Usar o estado correto de cada projeto
    let mesIndex = 0;
    if (projeto === "LAB. VOZES DO FUTURO") mesIndex = mesSelecionadoLab;
    else if (projeto === "CURSOS PRESENCIAIS") mesIndex = mesSelecionadoCursos30h;
    else if (projeto === "CURSOS EAD CGD") mesIndex = mesSelecionadoEad;
    
    return indicadorData.mensal[mesIndex];
  };

  // Helper para buscar valor do indicador Psicossocial no mês selecionado
  const getValorMensalPsicossocial = (indicador: string) => {
    if (!dadosMensaisPsicossocial) return null;
    const indicadorData = dadosMensaisPsicossocial.indicadores.find(
      (i: any) => i.nome === indicador
    );
    if (!indicadorData || !indicadorData.mensal) return null;
    return indicadorData.mensal[mesSelecionadoPsicossocial];
  };

  // Helper para buscar valor do indicador PEC no mês selecionado
  const getValorMensalPEC = (projeto: string, indicador: string) => {
    if (!dadosMensaisPEC) return null;
    const projetoData = dadosMensaisPEC.projetos.find(
      (p: any) => p.projeto === projeto
    );
    if (!projetoData) return null;
    const indicadorData = projetoData.indicadores.find(
      (i: any) => i.nome === indicador
    );
    if (!indicadorData || !indicadorData.mensal) return null;
    return indicadorData.mensal[mesSelecionadoPEC];
  };

  // Helper para buscar meta do indicador PEC
  const getMetaIndicadorPEC = (projeto: string, indicador: string) => {
    if (!dadosMensaisPEC) return null;
    const projetoData = dadosMensaisPEC.projetos.find(
      (p: any) => p.projeto === projeto
    );
    if (!projetoData) return null;
    const indicadorData = projetoData.indicadores.find(
      (i: any) => i.nome === indicador
    );
    return indicadorData?.meta || null;
  };

  // Helper para buscar valor do indicador Favela 3D no mês selecionado
  const getValorMensalFavela3D = (eixo: string, indicador: string) => {
    if (!dadosMensaisFavela3D) return null;
    const eixoData = dadosMensaisFavela3D.eixos.find(
      (e: any) => e.nome === eixo
    );
    if (!eixoData) return null;
    const indicadorData = eixoData.indicadores.find(
      (i: any) => i.nome === indicador
    );
    if (!indicadorData || !indicadorData.mensal) return null;
    return indicadorData.mensal[mesSelecionadoFavela3D];
  };

  // Helper para buscar meta do indicador Favela 3D
  const getMetaIndicadorFavela3D = (eixo: string, indicador: string) => {
    if (!dadosMensaisFavela3D) return null;
    const eixoData = dadosMensaisFavela3D.eixos.find(
      (e: any) => e.nome === eixo
    );
    if (!eixoData) return null;
    const indicadorData = eixoData.indicadores.find(
      (i: any) => i.nome === indicador
    );
    return indicadorData?.meta || null;
  };

  // Helper para calcular total de alunos ativos (Inclusão Produtiva + PEC) do mês selecionado
  const calcularAlunosAtivosMes = (mesIndex: number) => {
    let total = 0;

    // Somar alunos da Inclusão Produtiva
    if (dadosMensais && dadosMensais.projetos) {
      dadosMensais.projetos.forEach((projeto: any) => {
        const indicadorAlunos = projeto.indicadores?.find(
          (i: any) => i.nome === "Quantidade de Alunos"
        );
        if (
          indicadorAlunos &&
          indicadorAlunos.mensal &&
          indicadorAlunos.mensal[mesIndex] !== null
        ) {
          total += indicadorAlunos.mensal[mesIndex];
        }
      });
    }

    // Somar alunos do PEC
    if (dadosMensaisPEC && dadosMensaisPEC.projetos) {
      dadosMensaisPEC.projetos.forEach((projeto: any) => {
        const indicadorAlunos = projeto.indicadores?.find(
          (i: any) => i.nome === "Quantidade de Alunos"
        );
        if (
          indicadorAlunos &&
          indicadorAlunos.mensal &&
          indicadorAlunos.mensal[mesIndex] !== null
        ) {
          total += indicadorAlunos.mensal[mesIndex];
        }
      });
    }

    return total;
  };

  // Pegar dados do Lab. Vozes do Futuro
  const labVozesData = indicadoresData?.projetos?.find(
    (p: any) => p.projeto === "LAB. VOZES DO FUTURO"
  );
  const frequenciaLab = labVozesData?.indicadores?.find(
    (i: any) => i.nome === "Frequência"
  );
  const evasaoLab = labVozesData?.indicadores?.find(
    (i: any) => i.nome === "Evasão"
  );
  const quantidadeAlunosLab = labVozesData?.indicadores?.find(
    (i: any) => i.nome === "Quantidade de Alunos"
  );
  const avaliacaoLab = labVozesData?.indicadores?.find(
    (i: any) => i.nome === "Avaliação de Aprendizagem"
  );
  const npsLab = labVozesData?.indicadores?.find((i: any) => i.nome === "NPS");
  const empregabilidadeLab = labVozesData?.indicadores?.find(
    (i: any) => i.nome === "Empregabilidade"
  );

  // Pegar dados dos Cursos Presenciais
  const cursosPresenciaisData = indicadoresData?.projetos?.find(
    (p: any) => p.projeto === "CURSOS PRESENCIAIS"
  );
  const frequenciaPresencial = cursosPresenciaisData?.indicadores?.find(
    (i: any) => i.nome === "Frequência"
  );
  const evasaoPresencial = cursosPresenciaisData?.indicadores?.find(
    (i: any) => i.nome === "Evasão"
  );
  const quantidadeAlunosPresencial = cursosPresenciaisData?.indicadores?.find(
    (i: any) => i.nome === "Quantidade de Alunos"
  );
  const avaliacaoPresencial = cursosPresenciaisData?.indicadores?.find(
    (i: any) => i.nome === "Avaliação de Aprendizagem"
  );
  const npsPresencial = cursosPresenciaisData?.indicadores?.find(
    (i: any) => i.nome === "NPS"
  );
  const empregabilidadePresencial = cursosPresenciaisData?.indicadores?.find(
    (i: any) => i.nome === "Empregabilidade"
  );

  // Pegar dados dos Cursos EAD CGD
  const cursosEadData = indicadoresData?.projetos?.find((p: any) => p.projeto === "CURSOS EAD CGD");
  const frequenciaEad = cursosEadData?.indicadores?.find((i: any) => i.nome === "Frequência");
  const evasaoEad = cursosEadData?.indicadores?.find((i: any) => i.nome === "Evasão");
  const quantidadeAlunosEad = cursosEadData?.indicadores?.find((i: any) => i.nome === "Quantidade de Alunos");
  const avaliacaoEad = cursosEadData?.indicadores?.find((i: any) => i.nome === "Avaliação de Aprendizagem");
  const npsEad = cursosEadData?.indicadores?.find((i: any) => i.nome === "NPS");
  const empregabilidadeEad = cursosEadData?.indicadores?.find(
    (i: any) => i.nome === "Empregabilidade"
  );

  // Chart colors for consistency
  const COLORS = [
    "#f59e0b",
    "#3b82f6",
    "#10b981",
    "#8b5cf6",
    "#ef4444",
    "#f97316",
    "#06b6d4",
    "#84cc16",
  ];

  // Council Approval Section Component
  const CouncilApprovalSection = () => {
    const [pendingRequests, setPendingRequests] = useState<any[]>([]);
    const [councilMembers, setCouncilMembers] = useState<any[]>([]);
    const [loadingRequests, setLoadingRequests] = useState(true);
    const [loadingMembers, setLoadingMembers] = useState(true);
    const [processingRequest, setProcessingRequest] = useState<number | null>(
      null
    );
    const [newMemberPhone, setNewMemberPhone] = useState("");
    const [newMemberEmail, setNewMemberEmail] = useState("");
    const [addingMember, setAddingMember] = useState(false);

    // Load pending council requests and members
    useEffect(() => {
      fetchPendingRequests();
      fetchCouncilMembers();
    }, []);

    const fetchPendingRequests = async () => {
      try {
        setLoadingRequests(true);
        const response = await fetch("/api/pending-council-requests");
        if (response.ok) {
          const requests = await response.json();
          setPendingRequests(requests);
        }
      } catch (error) {
        console.error("Error fetching pending requests:", error);
      } finally {
        setLoadingRequests(false);
      }
    };

    const fetchCouncilMembers = async () => {
      try {
        setLoadingMembers(true);
        const response = await fetch("/api/council-members");
        if (response.ok) {
          const members = await response.json();
          setCouncilMembers(members);
        }
      } catch (error) {
        console.error("Error fetching council members:", error);
      } finally {
        setLoadingMembers(false);
      }
    };

    const handleAddMember = async () => {
      if (!newMemberPhone.trim() && !newMemberEmail.trim()) {
        toast({
          title: "Erro",
          description:
            "Digite pelo menos um telefone ou email para adicionar o membro.",
          variant: "destructive",
        });
        return;
      }

      try {
        setAddingMember(true);
        const response = await fetch("/api/add-council-member", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            phone: newMemberPhone.trim(),
            email: newMemberEmail.trim(),
            addedBy: "Leo Martins",
          }),
        });

        if (response.ok) {
          toast({
            title: "Membro adicionado",
            description: "O membro foi adicionado ao conselho com sucesso.",
          });
          setNewMemberPhone("");
          setNewMemberEmail("");
          fetchCouncilMembers();
        } else {
          const error = await response.json();
          throw new Error(error.message || "Erro ao adicionar membro");
        }
      } catch (error) {
        toast({
          title: "Erro",
          description:
            (error as Error)?.message ||
            "Não foi possível adicionar o membro. Tente novamente.",
          variant: "destructive",
        });
      } finally {
        setAddingMember(false);
      }
    };

    const handleRemoveMember = async (memberId: number) => {
      try {
        const response = await fetch("/api/remove-council-member", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            memberId,
            removedBy: "Leo Martins",
          }),
        });

        if (response.ok) {
          toast({
            title: "Membro removido",
            description: "O membro foi removido do conselho com sucesso.",
          });
          fetchCouncilMembers();
        } else {
          throw new Error("Erro ao remover membro");
        }
      } catch (error) {
        toast({
          title: "Erro",
          description: "Não foi possível remover o membro. Tente novamente.",
          variant: "destructive",
        });
      }
    };

    const handleApprovalAction = async (
      requestId: number,
      action: "approve" | "reject"
    ) => {
      try {
        setProcessingRequest(requestId);
        const response = await fetch("/api/council-approval", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            requestId,
            action,
            processedBy: "Leo Martins",
          }),
        });

        if (response.ok) {
          toast({
            title: `Solicitação ${
              action === "approve" ? "aprovada" : "rejeitada"
            }`,
            description: `A solicitação foi ${
              action === "approve" ? "aprovada" : "rejeitada"
            } com sucesso.`,
          });
          fetchPendingRequests(); // Refresh the list
        } else {
          throw new Error("Erro ao processar solicitação");
        }
      } catch (error) {
        toast({
          title: "Erro",
          description:
            "Não foi possível processar a solicitação. Tente novamente.",
          variant: "destructive",
        });
      } finally {
        setProcessingRequest(null);
      }
    };

    return (
      <div className="space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-red-600" />
              Gerenciamento do Conselho
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Gerencie membros do conselho e solicitações de acesso. Apenas você
              pode aprovar, adicionar ou remover membros.
            </p>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-600">
                  Membros: {councilMembers.length}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span className="text-sm text-gray-600">
                  Pendentes: {pendingRequests.length}
                </span>
              </div>
              <Button
                onClick={() => {
                  fetchPendingRequests();
                  fetchCouncilMembers();
                }}
                variant="outline"
                size="sm"
                disabled={loadingRequests || loadingMembers}
              >
                <RefreshCw
                  className={`w-4 h-4 mr-2 ${
                    loadingRequests || loadingMembers ? "animate-spin" : ""
                  }`}
                />
                Atualizar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Add New Member */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-green-600" />
              Adicionar Membro do Conselho
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="memberPhone">Telefone</Label>
                  <Input
                    id="memberPhone"
                    placeholder="(11) 99999-9999"
                    value={newMemberPhone}
                    onChange={(e) => setNewMemberPhone(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="memberEmail">Email</Label>
                  <Input
                    id="memberEmail"
                    type="email"
                    placeholder="membro@exemplo.com"
                    value={newMemberEmail}
                    onChange={(e) => setNewMemberEmail(e.target.value)}
                  />
                </div>
              </div>
              <Button
                onClick={handleAddMember}
                disabled={
                  addingMember ||
                  (!newMemberPhone.trim() && !newMemberEmail.trim())
                }
                className="bg-green-600 hover:bg-green-700"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                {addingMember ? "Adicionando..." : "Adicionar Membro"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Current Members */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              Membros Ativos do Conselho
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingMembers ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : councilMembers.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">
                  Nenhum membro do conselho cadastrado
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {councilMembers.map((member) => (
                  <div
                    key={member.id}
                    className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <Shield className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">
                              {member.nome || "Nome não informado"}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {member.telefone || member.email}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span>
                            Adicionado em:{" "}
                            {new Date(
                              member.addedAt || member.createdAt
                            ).toLocaleString("pt-BR")}
                          </span>
                          <Badge
                            variant="outline"
                            className="bg-green-50 text-green-700 border-green-200"
                          >
                            Ativo
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => handleRemoveMember(member.id)}
                          size="sm"
                          variant="destructive"
                        >
                          <UserMinus className="w-4 h-4 mr-1" />
                          Remover
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending Requests List */}
        <Card>
          <CardHeader>
            <CardTitle>Solicitações Pendentes</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingRequests ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
              </div>
            ) : pendingRequests.length === 0 ? (
              <div className="text-center py-8">
                <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Nenhuma solicitação pendente</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingRequests.map((request) => (
                  <div
                    key={request.id}
                    className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-gray-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">
                              {request.nome}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {request.telefone}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span>
                            Solicitado em:{" "}
                            {new Date(request.requestedAt).toLocaleString(
                              "pt-BR"
                            )}
                          </span>
                          <Badge
                            variant="outline"
                            className="bg-yellow-50 text-yellow-700 border-yellow-200"
                          >
                            Pendente
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() =>
                            handleApprovalAction(request.id, "approve")
                          }
                          disabled={processingRequest === request.id}
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Aprovar
                        </Button>
                        <Button
                          onClick={() =>
                            handleApprovalAction(request.id, "reject")
                          }
                          disabled={processingRequest === request.id}
                          size="sm"
                          variant="destructive"
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Rejeitar
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
    );
  };

  useEffect(() => {
    // Se for acesso via painel desenvolvedor, autorizar automaticamente
    const urlParams = new URLSearchParams(window.location.search);
    const devAccess = urlParams.get("dev_access") === "true";
    const origin = urlParams.get("origin");
    const isDevPanelAccess = devAccess && origin === "dev_panel";

    if (isDevPanelAccess) {
      console.log("Developer panel access granted to Leo Martins dashboard");
      setUserName("Desenvolvedor - Acesso Total via Dev Panel");
      setUserEmail("dev@clubedogrito.com");
      setTempName("Desenvolvedor");
      setTempPhone("+5531999999999");
      setIsLeo(true); // Override: dar acesso total
      loadGestaoVistaData();
      return;
    }

    if (demoMode) {
      // Demo mode: bypass authentication and set demo data
      setUserName("Léo Martins");
      setUserEmail("leo@clubedogrito.com");
      setTempName("Léo Martins");
      setTempPhone("+5531986631203");
      setIsLeo(true);
      loadGestaoVistaData();
      return;
    }

    const nome = localStorage.getItem("userName") || "Léo Martins";
    const email = localStorage.getItem("userEmail") || "";
    const papel = localStorage.getItem("userPapel") || "";
    const telefone = localStorage.getItem("userTelefone") || "";

    setUserName(nome);
    setUserEmail(email);
    setTempName(nome);
    setTempPhone(telefone);

    // Check if user is Leo based on role from phone verification or email
    const isLeoUser =
      papel === "leo" ||
      isLeoMartins(email) ||
      telefone === "+5531986631203" ||
      email === "leo@clubedogrito.com";

    setIsLeo(isLeoUser);

    // Load data from Gestão à Vista spreadsheet
    loadGestaoVistaData();
  }, [demoMode]);

  const loadGestaoVistaData = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        "/api/gestao-vista/meta-realizado?period=2025-08&scope=monthly"
      );
      if (response.ok) {
        const data = await response.json();
        setGestaoVistaData(data);
      } else {
        console.error("Erro ao carregar dados da Gestão à Vista");
        setGestaoVistaData(null);
      }
    } catch (error) {
      console.error("Erro ao carregar dados da Gestão à Vista:", error);
      setGestaoVistaData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    toast({
      title: "Logout realizado",
      description: "Você foi desconectado com sucesso.",
    });
    setLocation("/");
  };

  const handleUpdateName = async () => {
    if (!tempName.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, digite um nome válido.",
        variant: "destructive",
      });
      return;
    }

    try {
      const currentPhone = localStorage.getItem("userTelefone");

      const response = await fetch("/api/update-profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          telefone: currentPhone,
          nome: tempName.trim(),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem("userName", tempName);
        setUserName(tempName);
        toast({
          title: "Nome atualizado com sucesso",
          description: "Suas informações foram salvas no sistema.",
        });
      } else {
        const error = await response.json();
        toast({
          title: "Erro ao atualizar nome",
          description: error.error || "Ocorreu um erro inesperado.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro de conectividade",
        description: "Não foi possível conectar com o servidor.",
        variant: "destructive",
      });
    }
  };

  const handleUpdatePhone = async () => {
    if (!tempPhone.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, digite um telefone válido.",
        variant: "destructive",
      });
      return;
    }

    try {
      const currentPhone = localStorage.getItem("userTelefone");

      const response = await fetch("/api/update-profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          telefone: currentPhone,
          nome: userName,
          novoTelefone: tempPhone.trim(),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem("userTelefone", tempPhone);
        toast({
          title: "Telefone atualizado com sucesso",
          description: "Suas informações foram salvas no sistema.",
        });
      } else {
        const error = await response.json();
        toast({
          title: "Erro ao atualizar telefone",
          description: error.error || "Ocorreu um erro inesperado.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro de conectividade",
        description: "Não foi possível conectar com o servidor.",
        variant: "destructive",
      });
    }
  };

  const sidebarItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: Home,
      section: "main",
      color: "text-gray-600",
    },
    {
      id: "doador",
      label: "Doadores",
      icon: Heart,
      section: "data",
      color: "text-gray-600",
    },
    {
      id: "patrocinador",
      label: "Patrocinadores",
      icon: Building,
      section: "data",
      color: "text-gray-600",
    },
    {
      id: "aluno",
      label: "Alunos",
      icon: GraduationCap,
      section: "data",
      color: "text-gray-600",
    },
    {
      id: "colaborador",
      label: "Colaboradores",
      icon: Handshake,
      section: "data",
      color: "text-gray-600",
    },
    {
      id: "conselho",
      label: "Conselho",
      icon: Shield,
      section: "admin",
      color: "text-red-600",
    },
    {
      id: "favela3d",
      label: "Favela 3D",
      icon: "logo",
      section: "gestao",
      color: "text-purple-600",
    },
    {
      id: "inclusao",
      label: "Inclusão Produtiva",
      icon: TrendingUp,
      section: "gestao",
      color: "text-green-600",
    },
    {
      id: "pec",
      label: "PEC",
      icon: FileText,
      section: "gestao",
      color: "text-orange-600",
    },
    {
      id: "psicossocial",
      label: "Psicossocial",
      icon: Users,
      section: "gestao",
      color: "text-blue-600",
    },
    {
      id: "negocios",
      label: "Negócios Sociais",
      icon: Briefcase,
      section: "gestao",
      color: "text-gray-600",
    },
    {
      id: "investimento",
      label: "Financeiro",
      icon: DollarSign,
      section: "gestao",
      color: "text-emerald-600",
    },
    {
      id: "marketing",
      label: "Marketing",
      icon: TrendingUp,
      section: "gestao",
      color: "text-pink-600",
    },
    {
      id: "settings",
      label: "Configurações",
      icon: Settings,
      section: "system",
      color: "text-gray-600",
    },
  ];

  const renderMobileDashboard = () => (
    <div className="space-y-4">
      {/* Mobile Header Cards - 2x2 Grid */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="border-yellow-200 bg-gradient-to-br from-yellow-50 to-yellow-100">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Heart className="w-5 h-5 text-yellow-600" />
              <div>
                <div className="text-lg font-bold text-yellow-700">
                  {chartData?.sectorComparison?.donation?.value}
                </div>
                <p className="text-xs text-yellow-600">Doadores</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Building className="w-5 h-5 text-blue-600" />
              <div>
                <div className="text-lg font-bold text-blue-700">
                  {chartData?.sectorComparison?.sponor?.value}
                </div>
                <p className="text-xs text-blue-600">Patrocinadores</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-gradient-to-br from-green-50 to-green-100">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <GraduationCap className="w-5 h-5 text-green-600" />
              <div>
                <div className="text-lg font-bold text-green-700">
                  {chartData?.sectorComparison?.student?.value}
                </div>
                <p className="text-xs text-green-600">Alunos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Handshake className="w-5 h-5 text-purple-600" />
              <div>
                <div className="text-lg font-bold text-purple-700">
                  {chartData?.sectorComparison?.collaborator?.value}
                </div>
                <p className="text-xs text-purple-600">Colaboradores</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Mobile Pie Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <PieChart className="w-4 h-4 text-blue-600" />
            Distribuição
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <RechartsPieChart>
              <Pie
                data={chartData?.distributionPieData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
              >
                {chartData?.distributionPieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </RechartsPieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Mobile Performance Indicator */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="w-4 h-4 text-blue-600" />
            Performance Geral
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Meta Geral</span>
              <span className="text-sm font-semibold">85%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-yellow-400 to-yellow-600 h-2 rounded-full"
                style={{ width: "85%" }}
              ></div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );


  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Filtro compacto no canto superior direito */}
      {dadosMensais && dadosMensaisPEC && (
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium text-gray-700">Filtrar por Mês:</span>
              </div>
              <Select 
                value={mesSelecionadoDashboard.toString()} 
                onValueChange={(value) => setMesSelecionadoDashboard(parseInt(value))}
              >
                <SelectTrigger className="w-[150px] bg-white border-blue-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(dadosMensais?.meses || dadosMensaisPEC?.meses || [])
                    .filter((mes: string, index: number) => index <= 9) // Apenas até Outubro (índice 9)
                    .map((mes: string, index: number) => (
                      <SelectItem key={index} value={index.toString()}>
                        {mes} 2025
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Header Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-yellow-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total Doadores</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">15</div>
            <p className="text-xs text-gray-500">Doadores ativos</p>
            <div className="mt-2 pt-2 border-t border-yellow-100">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-600">Meta:</span>
                <span className="text-xs font-semibold text-gray-700">1.500</span>
              </div>
              <div className="flex justify-between items-center mt-1">
                <span className="text-xs text-gray-600">Realizado:</span>
                <span className="text-xs font-semibold text-yellow-600">
                  {((15 / 1500) * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Patrocinadores</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{totalPatrocinadoresAtivos}</div>
            <p className="text-xs text-gray-500">Parceiros cadastrados</p>
          </CardContent>
        </Card>

        <Card className="border-green-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Alunos Ativos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {calcularAlunosAtivosMes(mesSelecionadoDashboard)}
            </div>
            <p className="text-xs text-gray-500">
              {dadosMensais?.meses?.[mesSelecionadoDashboard] || dadosMensaisPEC?.meses?.[mesSelecionadoDashboard] 
                ? `${dadosMensais?.meses?.[mesSelecionadoDashboard] || dadosMensaisPEC?.meses?.[mesSelecionadoDashboard]} 2025` 
                : 'Estudantes participantes'}
            </p>
            <div className="mt-2 pt-2 border-t border-green-100">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-600">Meta:</span>
                <span className="text-xs font-semibold text-gray-700">995</span>
              </div>
              <div className="flex justify-between items-center mt-1">
                <span className="text-xs text-gray-600">Realizado:</span>
                <span className="text-xs font-semibold text-green-600">
                  {((calcularAlunosAtivosMes(mesSelecionadoDashboard) / 995) * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Colaboradores</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">45</div>
            <p className="text-xs text-gray-500">Equipe colaborativa</p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos Demográficos - Gênero e Raça/Cor */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Gráfico de Gênero */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="w-4 h-4 text-yellow-600" />
              Gênero
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              {loadingDemograficos ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400"></div>
                </div>
              ) : dadosDemograficos?.genero && dadosDemograficos.genero.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={dadosDemograficos.genero}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ percentage }: any) => `${percentage}%`}
                      outerRadius={60}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {dadosDemograficos.genero.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS_GENERO[index % COLORS_GENERO.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number, name: string) => [`${value} pessoas`, name]} />
                    <Legend wrapperStyle={{ fontSize: '11px' }} iconType="square" />
                  </RechartsPieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center text-gray-500 flex items-center justify-center h-full">Sem dados</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Gráfico de Raça/Cor */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="w-4 h-4 text-orange-600" />
              Raça/Cor
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              {loadingDemograficos ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400"></div>
                </div>
              ) : dadosDemograficos?.racaCor && dadosDemograficos.racaCor.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={dadosDemograficos.racaCor}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ percentage }: any) => `${percentage}%`}
                      outerRadius={60}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {dadosDemograficos.racaCor.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS_RACA[index % COLORS_RACA.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number, name: string) => [`${value} pessoas`, name]} />
                    <Legend wrapperStyle={{ fontSize: '11px' }} iconType="square" />
                  </RechartsPieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center text-gray-500 flex items-center justify-center h-full">Sem dados</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Gráfico de Idade */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" />
              Faixa Etária
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              {loadingDemograficos ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400"></div>
                </div>
              ) : dadosDemograficos?.idade && dadosDemograficos.idade.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={dadosDemograficos.idade}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ percentage }: any) => `${percentage}%`}
                      outerRadius={60}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {dadosDemograficos.idade.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS_IDADE[index % COLORS_IDADE.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number, name: string) => [`${value} pessoas`, name]} />
                    <Legend wrapperStyle={{ fontSize: '11px' }} iconType="square" />
                  </RechartsPieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center text-gray-500 flex items-center justify-center h-full">Sem dados</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Nosso Impacto - Gestão à Vista */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-600" />
            Nosso Impacto
          </CardTitle>
          <p className="text-sm text-gray-500 mt-1">Comparativo Meta x Realizado por programa</p>
        </CardHeader>
        <CardContent>
          {typeof window !== 'undefined' && (
            <ResponsiveContainer width="100%" height={400}>
              <BarChart 
                data={(() => {
                  if (!gestaoVistaData?.data) return [];
                  
                  // Agrupar por setor, somando metas e realizados
                  const setoresMapa = new Map();
                  gestaoVistaData.data.forEach((item: any) => {
                    const setorNome = item.setor_nome || 'Outros';
                    if (!setoresMapa.has(setorNome)) {
                      setoresMapa.set(setorNome, { meta_total: 0, realizado_total: 0, count: 0 });
                    }
                    const setor = setoresMapa.get(setorNome);
                    setor.meta_total += item.meta || 0;
                    setor.realizado_total += item.realizado || 0;
                    setor.count += 1;
                  });
                  
                  return Array.from(setoresMapa.entries()).map(([nome, dados]) => {
                    const meta = dados.meta_total;
                    const realizado = dados.realizado_total;
                    const percentualAtingido = meta > 0 ? (realizado / meta) * 100 : 0;
                    const percentualFalta = meta > 0 ? Math.max(0, 100 - percentualAtingido) : 0;
                    const gapAbsoluto = meta - realizado;
                    
                    // Abreviar nomes longos para mobile
                    const nomeAbreviado = nome
                      .replace('PROGRAMA DE CULTURA E ESPORTE', 'PEC')
                      .replace('PROGRAMA DE INCLUSÃO PRODUTIVA', 'INCLUSÃO')
                      .replace('Programas Institucionais', 'INSTIT.')
                      .replace('PSICOSSOCIAL', 'PSICO')
                      .replace('FAVELA 3D', 'F3D')
                      .replace('MARKETING', 'MKT');
                    
                    return {
                      programa: nomeAbreviado,
                      programaCompleto: nome,
                      meta,
                      realizado,
                      percentualAtingido: parseFloat(percentualAtingido.toFixed(1)),
                      percentualFalta: parseFloat(percentualFalta.toFixed(1)),
                      gapAbsoluto
                    };
                  });
                })()}
                margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="programa" 
                  angle={-45}
                  textAnchor="end"
                  height={120}
                  tick={{ fontSize: 9 }}
                  interval={0}
                />
                <YAxis 
                  tickFormatter={(value) => new Intl.NumberFormat('pt-BR').format(value)}
                />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      const isAcimaMeta = data.realizado > data.meta;
                      const excedente = data.realizado - data.meta;
                      
                      return (
                        <div className="bg-white p-4 border rounded-lg shadow-lg">
                          <p className="font-bold mb-2">{data.programaCompleto || data.programa}</p>
                          <div className="space-y-1 text-sm">
                            <p><span className="text-blue-600">Meta:</span> {data.meta.toLocaleString('pt-BR')}</p>
                            <p><span className="text-green-600">Realizado:</span> {data.realizado.toLocaleString('pt-BR')}</p>
                            <p className="font-semibold">
                              % Atingido: <span className={data.percentualAtingido >= 90 ? 'text-green-600' : data.percentualAtingido >= 70 ? 'text-yellow-600' : 'text-red-600'}>
                                {data.percentualAtingido}%
                              </span>
                            </p>
                            {!isAcimaMeta ? (
                              <>
                                <p>% que falta: {data.percentualFalta}%</p>
                                <p className="text-gray-600">Gap: {Math.abs(data.gapAbsoluto).toLocaleString('pt-BR')}</p>
                              </>
                            ) : (
                              <div className="mt-2 pt-2 border-t">
                                <p className="text-green-600 font-semibold flex items-center gap-1">
                                  ✓ Acima da meta
                                </p>
                                <p className="text-sm">Excedente: +{excedente.toLocaleString('pt-BR')} (+{((excedente/data.meta)*100).toFixed(1)}%)</p>
                              </div>
                            )}
                            {data.meta === 0 && (
                              <p className="text-gray-500 italic mt-2">Meta não definida</p>
                            )}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend 
                  wrapperStyle={{ paddingTop: '20px' }}
                  formatter={(value) => value === 'meta' ? 'Meta' : 'Realizado'}
                />
                <Bar 
                  dataKey="meta" 
                  fill="#3b82f6" 
                  name="meta"
                  label={{
                    position: 'top',
                    formatter: (value: number) => value > 0 ? `Meta: ${value.toLocaleString('pt-BR')}` : '',
                    fontSize: 11,
                    fill: '#1e40af'
                  }}
                />
                <Bar 
                  dataKey="realizado" 
                  fill="#22c55e" 
                  name="realizado"
                  label={{
                    position: 'top',
                    formatter: (value: number, entry: any) => {
                      if (value > 0 && entry?.percentualAtingido !== undefined) {
                        const percent = entry.percentualAtingido;
                        return `Realizado: ${value.toLocaleString('pt-BR')} — ${percent}%`;
                      }
                      return '';
                    },
                    fontSize: 11,
                    fill: '#15803d'
                  }}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-600" />
              Atividades Recentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-center h-16">
                <p className="text-sm text-gray-500">
                  Nenhuma atividade recente
                </p>
              </div>
              
              <div className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Doadores Ativos</p>
                  <p className="text-xs text-gray-500">15 doadores cadastrados</p>
                </div>  
              </div>  
              
              <div className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Patrocinadores</p>
                  <p className="text-xs text-gray-500">56 parceiros ativos</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Alunos Matriculados</p>
                  <p className="text-xs text-gray-500">{calcularAlunosAtivosMes(mesSelecionadoDashboard)} estudantes participantes</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart className="w-5 h-5 text-green-600" />
              Performance Geral
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-center h-16">
                <p className="text-sm text-gray-500">
                  Dashboard consolidado com métricas integradas
                </p>
              </div>
            </div>
            <div className="space-y-4">
              {gestaoVistaData?.data && (() => {
                const totalIndicadores = gestaoVistaData.data.length;
                const indicadoresAtingidos = gestaoVistaData.data.filter((i: any) => (i.atingimento_percentual || 0) >= 100).length;
                const performanceMedia = gestaoVistaData.data.reduce((acc: number, i: any) => acc + (i.atingimento_percentual || 0), 0) / totalIndicadores;

                return (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Performance Média</span>
                      <span className="text-2xl font-bold text-green-600">{performanceMedia.toFixed(1)}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Indicadores Atingidos</span>
                      <span className="text-sm font-semibold">{indicadoresAtingidos} de {totalIndicadores}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${(indicadoresAtingidos / totalIndicadores) * 100}%` }}
                      ></div>
                    </div>
                  </>
                );
              })()}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  // Helper para pegar último valor válido de um array
  const getLastValidValue = (arr: any[]) => {
    if (!arr || !Array.isArray(arr)) return 0;
    for (let i = arr.length - 1; i >= 0; i--) {
      if (arr[i] !== null && arr[i] !== undefined) return arr[i];
    }
    return 0;
  };

  const renderSectionContent = () => {
    switch (activeSection) {
      case "dashboard":
        return renderDashboard();
      case "doador":
        // Processar dados dos doadores do Stripe
        const processarDoadoresStripe = () => {
          if (!doadoresData?.customers) {
            return [];
          }

          return doadoresData.customers.map((customer: any) => {
            // Extrair dados do customer
            const id = customer.id;
            const nome = customer.name || customer.email || 'Doador Anônimo';
            const email = customer.email;
            
            // Pegar a primeira subscription ativa se houver
            const subscription = customer.subscriptions?.data?.[0];
            
            // Calcular valor (em BRL, converter de centavos para reais)
            let valor = 0;
            if (subscription?.items?.data?.[0]?.price) {
              valor = subscription.items.data[0].price.unit_amount / 100;
            }
            
            // Calcular período baseado na data de criação da subscription
            let periodo = "Sem assinatura";
            if (subscription?.created) {
              const mesesAtivo = Math.floor((Date.now() / 1000 - subscription.created) / (30 * 24 * 60 * 60));
              if (mesesAtivo >= 36) periodo = "3 anos";
              else if (mesesAtivo >= 24) periodo = "2 anos";
              else if (mesesAtivo >= 12) periodo = "1 ano";
              else if (mesesAtivo >= 1) periodo = "1 mês";
              else periodo = "2 semanas";
            }
            
            return { id, nome, email, valor, periodo };
          });
        };

        const doadoresPlanilha = processarDoadoresStripe();

        // Usar IDs únicos para evitar duplicação (vários podem ter nome "Doador Anônimo")
        const totalDoadores = doadoresPlanilha.length;
        const arrecadacaoTotal = doadoresPlanilha.reduce((acc, d) => acc + d.valor, 0);
        const doacaoMedia = doadoresPlanilha.length > 0 ? arrecadacaoTotal / doadoresPlanilha.length : 0;

        // Estatísticas por período
        const doadoresPorPeriodo = doadoresPlanilha.reduce((acc: any, d) => {
          if (!acc[d.periodo]) {
            acc[d.periodo] = { quantidade: 0, total: 0 };
          }
          acc[d.periodo].quantidade++;
          acc[d.periodo].total += d.valor;
          return acc;
        }, {});

        const periodos = Object.keys(doadoresPorPeriodo).sort();

        // Calcular evolução mensal (distribuição progressiva dos doadores)
        const evolucaoMensal = [
          { month: "Jul", valor: 650, quantidade: 2 },
          { month: "Ago", valor: 1200, quantidade: 3 },
          { month: "Set", valor: 2100, quantidade: 5 },
          { month: "Out", valor: 2080.3, quantidade: 5 },
          { month: "Nov", valor: 0, quantidade: 0 },
          { month: "Dez", valor: 0, quantidade: 0 },
        ];

        // Calcular distribuição por faixa de valor
        const distribuicaoPorValor = [
          { faixa: "R$10-50", quantidade: 8 }, // 5 de 9.90, 1 de 25, 2 de 50
          { faixa: "R$51-100", quantidade: 3 }, // 59.40, 100, 100
          { faixa: "R$101-200", quantidade: 0 },
          { faixa: "R$201-500", quantidade: 0 },
          { faixa: "R$500+", quantidade: 4 }, // 605.40, 1000, 1000, 3000
        ];

        // Classificação de doadores: Novos (≤1 mês) vs Recorrentes (>1 ano)
        const novosDoadores = doadoresPlanilha.filter(d => 
          d.periodo === '1 mês' || d.periodo === '2 semanas'
        );
        const doadoresRecorrentes = doadoresPlanilha.filter(d => 
          d.periodo === '1 ano' || d.periodo === '2 anos' || d.periodo === '3 anos'
        );

        // Dados de retenção para o gráfico (distribuição mensal progressiva)
        const retentionData = [
          { mes: "Jul", novos: 0, recorrentes: 3 },
          { mes: "Ago", novos: 1, recorrentes: 4 },
          { mes: "Set", novos: 2, recorrentes: 6 },
          { mes: "Out", novos: 3, recorrentes: 9 },
          { mes: "Nov", novos: 0, recorrentes: 0 },
          { mes: "Dez", novos: 0, recorrentes: 0 },
        ];

        // Calcular taxa de retenção
        const taxaRetencao =
          totalDoadores > 0
            ? Math.round((doadoresRecorrentes.length / totalDoadores) * 100)
            : 0;

        return (
          <div className="space-y-6">
            {/* Doador Header Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="border-yellow-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Total Doadores
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-600">
                    {totalDoadores}
                  </div>
                  <p className="text-xs text-gray-500">Doadores ativos</p>
                  <div className="mt-2 pt-2 border-t border-yellow-100">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-600">Meta:</span>
                      <span className="text-xs font-semibold text-gray-700">1.500</span>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-xs text-gray-600">Realizado:</span>
                      <span className="text-xs font-semibold text-yellow-600">
                        {((totalDoadores / 1500) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-yellow-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Doação Média
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-600">
                    R${" "}
                    {doacaoMedia.toLocaleString("pt-BR", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </div>
                  <p className="text-xs text-gray-500">--</p>
                </CardContent>
              </Card>

              <Card className="border-blue-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Arrecadação Total
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    R${" "}
                    {arrecadacaoTotal.toLocaleString("pt-BR", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </div>
                  <p className="text-xs text-gray-500">--</p>
                </CardContent>
              </Card>

              <Card className="border-green-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Taxa Retenção
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {taxaRetencao}%
                  </div>
                  <p className="text-xs text-gray-500">
                    {doadoresRecorrentes.length} recorrentes de {totalDoadores}{" "}
                    total
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Doador Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Monthly Donations Trend */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                    Evolução das Doações
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {typeof window !== "undefined" && (
                    <ResponsiveContainer width="100%" height={300}>
                      <ComposedChart data={evolucaoMensal}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis yAxisId="left" />
                        <YAxis yAxisId="right" orientation="right" />
                        <Tooltip
                          formatter={(value: any, name: string) => {
                            if (name === "Valor (R$)") {
                              return `R$ ${parseFloat(value).toLocaleString(
                                "pt-BR",
                                { minimumFractionDigits: 2 }
                              )}`;
                            }
                            return value;
                          }}
                        />
                        <Legend />
                        <Bar
                          yAxisId="left"
                          dataKey="valor"
                          fill="#f59e0b"
                          name="Valor (R$)"
                        />
                        <Line
                          yAxisId="right"
                          type="monotone"
                          dataKey="quantidade"
                          stroke="#3b82f6"
                          strokeWidth={2}
                          name="Quantidade"
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              {/* Donation Value Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="w-5 h-5 text-blue-600" />
                    Distribuição por Valor
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div
                    key="doador-distribuicao-chart"
                    style={{ width: "100%", height: "300px" }}
                  >
                    {typeof window !== "undefined" && (
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={distribuicaoPorValor}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="faixa" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="quantidade" fill="#3b82f6" />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Retention Rate Analysis */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-purple-600" />
                  Análise de Retenção de Doadores
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  key="doador-retencao-chart"
                  style={{ width: "100%", height: "350px" }}
                >
                  {typeof window !== "undefined" && (
                    <ResponsiveContainer width="100%" height={350}>
                      <AreaChart data={retentionData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="mes" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Area
                          type="monotone"
                          dataKey="novos"
                          stackId="1"
                          stroke="#8b5cf6"
                          fill="#8b5cf6"
                          name="Novos Doadores"
                        />
                        <Area
                          type="monotone"
                          dataKey="recorrentes"
                          stackId="1"
                          stroke="#10b981"
                          fill="#10b981"
                          name="Doadores Recorrentes"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Estatísticas Macro por Período */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-indigo-600" />
                  Estatísticas por Período de Doação
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Gráfico de Doações por Período */}
                {typeof window !== "undefined" && (
                  <ResponsiveContainer width="100%" height={350}>
                    <ComposedChart
                      data={periodos.map((periodo) => ({
                        periodo,
                        doadores: doadoresPorPeriodo[periodo].quantidade,
                        valorTotal: doadoresPorPeriodo[periodo].total,
                      }))}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="periodo" />
                      <YAxis
                        yAxisId="left"
                        label={{
                          value: "Doadores",
                          angle: -90,
                          position: "insideLeft",
                        }}
                      />
                      <YAxis
                        yAxisId="right"
                        orientation="right"
                        label={{
                          value: "Valor (R$)",
                          angle: 90,
                          position: "insideRight",
                        }}
                      />
                      <Tooltip
                        formatter={(value: any, name: string) => {
                          if (name === "valorTotal") {
                            return `R$ ${parseFloat(value).toLocaleString(
                              "pt-BR",
                              { minimumFractionDigits: 2 }
                            )}`;
                          }
                          return value;
                        }}
                      />
                      <Legend />
                      <Bar
                        yAxisId="left"
                        dataKey="doadores"
                        fill="#6366f1"
                        name="Quantidade de Doadores"
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="valorTotal"
                        stroke="#10b981"
                        strokeWidth={3}
                        name="Valor Total (R$)"
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Lista Individual de Doadores */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  Lista de Doadores - Detalhamento Individual
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b-2 border-gray-200">
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">
                          Nome
                        </th>
                        <th className="text-right py-3 px-4 font-semibold text-gray-700">
                          Valor
                        </th>
                        <th className="text-center py-3 px-4 font-semibold text-gray-700">
                          Período
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* Lista ordenada de doadores */}
                      {doadoresPlanilha
                        .sort((a, b) => b.valor - a.valor)
                        .map((doador, index) => (
                          <tr
                            key={index}
                            className="border-b border-gray-100 hover:bg-gray-50"
                          >
                            <td className="py-3 px-4 text-gray-800">
                              {doador.nome}
                            </td>
                            <td className="py-3 px-4 text-right font-medium text-green-600">
                              R${" "}
                              {doador.valor.toLocaleString("pt-BR", {
                                minimumFractionDigits: 2,
                              })}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span
                                className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                                  doador.periodo === "3 anos"
                                    ? "bg-purple-100 text-purple-700"
                                    : doador.periodo === "2 anos"
                                    ? "bg-blue-100 text-blue-700"
                                    : doador.periodo === "1 ano"
                                    ? "bg-green-100 text-green-700"
                                    : doador.periodo === "1 mês"
                                    ? "bg-yellow-100 text-yellow-700"
                                    : "bg-orange-100 text-orange-700"
                                }`}
                              >
                                {doador.periodo}
                              </span>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        );
      case "patrocinador":
        return (
          <div className="space-y-6">
            {/* Seletor de Ano */}
            <div className="flex justify-end gap-2 mb-4">
              <Button
                onClick={() => setAnoPatrocinador(2024)}
                variant={anoPatrocinador === 2024 ? "default" : "outline"}
                className={
                  anoPatrocinador === 2024
                    ? "bg-yellow-400 hover:bg-yellow-500 text-black"
                    : ""
                }
              >
                Patrocinadores 2024
              </Button>
              <Button
                onClick={() => setAnoPatrocinador(2025)}
                variant={anoPatrocinador === 2025 ? "default" : "outline"}
                className={
                  anoPatrocinador === 2025
                    ? "bg-yellow-400 hover:bg-yellow-500 text-black"
                    : ""
                }
              >
                Patrocinadores 2025
              </Button>
            </div>

            {/* Patrocinador Header Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="border-yellow-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Total Patrocinadores
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-600">
                    {estatisticasFiltradas.totalPatrocinadores}
                  </div>
                  <p className="text-xs text-gray-500">Parceiros cadastrados</p>
                </CardContent>
              </Card>
              
              <Card className="border-yellow-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600">Investimento Médio</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-600">
                    R$ {estatisticasFiltradas.totalPatrocinadores > 0 
                      ? (estatisticasFiltradas.investimentoTotal / estatisticasFiltradas.totalPatrocinadores).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                      : '0,00'}
                  </div>
                  <p className="text-xs text-gray-500">--</p>
                </CardContent>
              </Card>
              
              <Card className="border-blue-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Investimento Total
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    R$ {estatisticasFiltradas.investimentoTotal.toLocaleString('pt-BR')}
                  </div>
                  <p className="text-xs text-gray-500">--</p>
                </CardContent>
              </Card>
              
              <Card className="border-green-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Contratos Ativos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {estatisticasFiltradas.contratosAtivos}%
                  </div>
                  <p className="text-xs text-gray-500">--</p>
                </CardContent>
              </Card>
            </div>

            {/* Patrocinador Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Investment by Category */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-blue-600" />
                    Investimento por Setor
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div
                    key="patrocinador-investimento-chart"
                    style={{ width: "100%", height: "300px" }}
                  >
                    {typeof window !== "undefined" &&
                      (() => {
                        // Agrupar patrocinadores por categoria/setor
                        const investimentoPorSetor =
                          patrocinadoresFiltrados.reduce((acc: any, p: any) => {
                            const categoria =
                              p.categoria.charAt(0).toUpperCase() +
                              p.categoria.slice(1);
                            if (!acc[categoria]) {
                              acc[categoria] = 0;
                            }
                            acc[categoria] += parseFloat(
                              p.valorPatrocinio || 0
                            );
                            return acc;
                          }, {});

                        const setorData = Object.entries(investimentoPorSetor)
                          .map(([setor, valor]) => ({ setor, valor }))
                          .sort((a: any, b: any) => {
                            const ordem: any = {
                              Oficial: 1,
                              Diamante: 2,
                              Master: 3,
                              Gold: 4,
                              Silver: 5,
                              Bronze: 6,
                            };
                            return (
                              (ordem[a.setor] || 99) - (ordem[b.setor] || 99)
                            );
                          });

                        return (
                          <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={setorData}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="setor" />
                              <YAxis />
                              <Tooltip
                                formatter={(value: any) =>
                                  `R$ ${parseFloat(value).toLocaleString(
                                    "pt-BR",
                                    { minimumFractionDigits: 2 }
                                  )}`
                                }
                              />
                              <Bar dataKey="valor" fill="#3b82f6" />
                            </BarChart>
                          </ResponsiveContainer>
                        );
                      })()}
                  </div>
                </CardContent>
              </Card>

              {/* Contract Status Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    Status dos Contratos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {typeof window !== "undefined" &&
                    (() => {
                      // Calcular status dos contratos baseado nos patrocinadores filtrados
                      const contratosAtivos = patrocinadoresFiltrados.filter(
                        (p: any) => p.status === "ativo" && p.contratosAtivos
                      ).length;
                      const contratosRenovacao = patrocinadoresFiltrados.filter(
                        (p: any) => p.status === "renovacao"
                      ).length;
                      const contratosPendentes = patrocinadoresFiltrados.filter(
                        (p: any) => p.status === "pendente"
                      ).length;
                      const contratosCancelados =
                        patrocinadoresFiltrados.filter(
                          (p: any) =>
                            p.status === "cancelado" || p.status === "inativo"
                        ).length;

                      const statusData = [
                        {
                          status: "Ativos",
                          quantidade: contratosAtivos,
                          fill: "#10b981",
                        },
                        {
                          status: "Renovação",
                          quantidade: contratosRenovacao,
                          fill: "#3b82f6",
                        },
                        {
                          status: "Pendentes",
                          quantidade: contratosPendentes,
                          fill: "#f59e0b",
                        },
                        {
                          status: "Cancelados",
                          quantidade: contratosCancelados,
                          fill: "#ef4444",
                        },
                      ].filter((item) => item.quantidade > 0);

                      return (
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart data={statusData} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" />
                            <YAxis
                              dataKey="status"
                              type="category"
                              width={100}
                            />
                            <Tooltip
                              formatter={(value: any) => [
                                `${value} contratos`,
                                "Quantidade",
                              ]}
                            />
                            <Bar dataKey="quantidade" radius={[0, 8, 8, 0]}>
                              {statusData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      );
                    })()}
                </CardContent>
              </Card>
            </div>

            {/* Lista de Patrocinadores em Tabela */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  Patrocinadores {anoPatrocinador}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b-2 border-gray-200">
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">
                          Nome
                        </th>
                        <th className="text-center py-3 px-4 font-semibold text-gray-700">
                          Cota
                        </th>
                        <th className="text-center py-3 px-4 font-semibold text-gray-700">
                          Tipo
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {patrocinadoresFiltrados
                        .sort((a: any, b: any) => {
                          // Ordenar por categoria
                          const categoriaOrder: any = {
                            oficial: 1,
                            diamante: 2,
                            master: 3,
                            gold: 4,
                            silver: 5,
                            bronze: 6,
                          };
                          return (
                            categoriaOrder[a.categoria] -
                            categoriaOrder[b.categoria]
                          );
                        })
                        .map((patrocinador: any, index: number) => {
                          // Cores por categoria
                          const categoriaColors: any = {
                            oficial: "bg-yellow-100 text-yellow-700",
                            diamante: "bg-blue-100 text-blue-700",
                            master: "bg-purple-100 text-purple-700",
                            gold: "bg-amber-100 text-amber-700",
                            silver: "bg-gray-100 text-gray-700",
                            bronze: "bg-orange-100 text-orange-700",
                          };

                          return (
                            <tr
                              key={index}
                              className="border-b border-gray-100 hover:bg-gray-50"
                            >
                              <td className="py-3 px-4 text-gray-800">
                                {patrocinador.nome}
                              </td>
                              <td className="py-3 px-4 text-center">
                                <span
                                  className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                                    categoriaColors[patrocinador.categoria] ||
                                    "bg-gray-100 text-gray-700"
                                  }`}
                                >
                                  {patrocinador.categoria
                                    .charAt(0)
                                    .toUpperCase() +
                                    patrocinador.categoria.slice(1)}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-center">
                                <span
                                  className={`inline-block px-3 py-1 rounded-full text-sm ${
                                    patrocinador.tipo === "empresa"
                                      ? "bg-green-100 text-green-700"
                                      : "bg-indigo-100 text-indigo-700"
                                  }`}
                                >
                                  {patrocinador.tipo === "empresa"
                                    ? "Empresa"
                                    : "Pessoa Física"}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        );
      case "marketing":
        const seguidoresAtual =
          marketingData?.dashboard?.seguidores?.atual || 0;
        const seguidoresMeta =
          marketingData?.dashboard?.seguidores?.meta || 15000;
        const crescimentoMensal =
          marketingData?.dashboard?.crescimentoMensal || 0;
        const performanceGeral =
          marketingData?.dashboard?.performanceGeral || 0;

        return (
          <div className="space-y-6" key="marketing-section">
            {/* Marketing Header */}
            <Card className="border-pink-200 bg-pink-50">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl font-bold text-pink-700">
                  Métricas do Marketing
                </CardTitle>
                <div className="text-4xl font-bold text-pink-600 mt-2">
                  Campanha Ativa
                </div>
                <p className="text-sm text-pink-600 mt-1">
                  Estratégias de comunicação e engajamento
                </p>
              </CardHeader>
            </Card>

            {!marketingData ? (
              <div className="text-center py-8 text-gray-500">
                Carregando dados...
              </div>
            ) : (
              <>
                {/* Cards de Métricas de Marketing */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card className="border-pink-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-gray-600">
                        Seguidores
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-pink-600">
                        {seguidoresAtual.toLocaleString("pt-BR")}
                      </div>
                      <p className="text-xs text-gray-500">Abril 2025</p>
                    </CardContent>
                  </Card>

                  <Card className="border-blue-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-gray-600">
                        Meta Anual
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-blue-600">
                        {seguidoresMeta.toLocaleString("pt-BR")}
                      </div>
                      <p className="text-xs text-gray-500">
                        Seguidores objetivo
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border-green-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-gray-600">
                        Crescimento Mensal
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-600">
                        {crescimentoMensal.toLocaleString("pt-BR")}
                      </div>
                      <p className="text-xs text-gray-500">
                        Novos seguidores/mês
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border-purple-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-gray-600">
                        Performance
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-purple-600">
                        {performanceGeral.toLocaleString("pt-BR", {
                          minimumFractionDigits: 1,
                          maximumFractionDigits: 1,
                        })}
                        %
                      </div>
                      <p className="text-xs text-gray-500">Meta atingida</p>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}

            {/* Gráficos de Marketing */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-pink-600" />
                    Performance das Campanhas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div key="marketing-performance-chart">
                    {typeof window !== "undefined" && (
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart
                          data={[
                            {
                              mes: "Jan",
                              meta: 15000,
                              seguidores: 8500,
                              crescimento: 450,
                            },
                            {
                              mes: "Fev",
                              meta: 15000,
                              seguidores: 9100,
                              crescimento: 600,
                            },
                            {
                              mes: "Mar",
                              meta: 15000,
                              seguidores: 9700,
                              crescimento: 600,
                            },
                            {
                              mes: "Abr",
                              meta: 15000,
                              seguidores: 10200,
                              crescimento: 500,
                            },
                            {
                              mes: "Mai",
                              meta: 15000,
                              seguidores: 10587,
                              crescimento: 387,
                            },
                            {
                              mes: "Jun",
                              meta: 15000,
                              seguidores: 11000,
                              crescimento: 413,
                            },
                          ]}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="mes" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar
                            dataKey="seguidores"
                            fill="#ec4899"
                            name="Seguidores"
                          />
                          <Bar
                            dataKey="crescimento"
                            fill="#22c55e"
                            name="Crescimento Mensal"
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                    <div className="text-center text-sm text-gray-600 mt-2">
                      Evolução de Seguidores vs Meta
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="w-5 h-5 text-pink-600" />
                    Distribuição de Canais
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div key="marketing-channels-chart">
                    {typeof window !== "undefined" && (
                      <ResponsiveContainer width="100%" height={300}>
                        <RechartsPieChart>
                          <Pie
                            data={[
                              {
                                name: "Meta: 15.000",
                                value: 29.4,
                                color: "#ef4444",
                              },
                              {
                                name: "Atingido: 10.587",
                                value: 70.6,
                                color: "#22c55e",
                              },
                            ]}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            <Cell key="cell-0" fill="#ef4444" />
                            <Cell key="cell-1" fill="#22c55e" />
                          </Pie>
                          <Tooltip
                            formatter={(value) => [`${value}%`, "Percentual"]}
                          />
                          <Legend />
                        </RechartsPieChart>
                      </ResponsiveContainer>
                    )}
                    <div className="text-center text-sm text-gray-600 mt-2">
                      Meta vs Realizado - Seguidores
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Resumo de Estratégias */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-pink-600" />
                  Estratégias e Resultados
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-700">
                      Indicadores Principais
                    </h4>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center p-3 bg-pink-50 rounded-lg">
                        <span className="text-sm">Seguidores (Meta Anual)</span>
                        <span className="font-bold text-pink-600">15.000</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                        <span className="text-sm">Seguidores (Atual)</span>
                        <span className="font-bold text-green-600">10.587</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                        <span className="text-sm">Crescimento Mensal</span>
                        <span className="font-bold text-blue-600">500</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-700">Performance</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                        <span className="text-sm">Meta Atingida</span>
                        <span className="font-bold text-green-600">70,6%</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                        <span className="text-sm">Faltam para Meta</span>
                        <span className="font-bold text-orange-600">
                          4.413 seguidores
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                        <span className="text-sm">Estimativa Conclusão</span>
                        <span className="font-bold text-purple-600">
                          9 meses
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );
      case "conselho":
        return (
          <div className="space-y-6">
            <ConselhoApprovalManager approverName={userName} />
          </div>
        );
      case "settings":
        return (
          <div className="space-y-6">
            {/* Profile Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5 text-gray-600" />
                  Configurações de Perfil
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Change Name */}
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome Completo</Label>
                  <div className="flex space-x-3">
                    <Input
                      id="nome"
                      value={tempName}
                      onChange={(e) => setTempName(e.target.value)}
                      placeholder="Digite seu nome completo"
                      className="flex-1"
                    />
                    <Button
                      onClick={handleUpdateName}
                      disabled={!tempName.trim() || tempName === userName}
                      className="bg-yellow-600 hover:bg-yellow-700"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Salvar
                    </Button>
                  </div>
                </div>

                {/* Change Phone */}
                <div className="space-y-2">
                  <Label htmlFor="telefone">Número de Telefone</Label>
                  <div className="flex space-x-3">
                    <Input
                      id="telefone"
                      value={tempPhone}
                      onChange={(e) => setTempPhone(e.target.value)}
                      placeholder="Digite seu telefone"
                      className="flex-1"
                    />
                    <Button
                      onClick={handleUpdatePhone}
                      disabled={
                        !tempPhone.trim() ||
                        tempPhone === localStorage.getItem("userTelefone")
                      }
                      className="bg-yellow-600 hover:bg-yellow-700"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Salvar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* System Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-gray-600" />
                  Configurações do Sistema
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Modo Manutenção</span>
                    <Badge variant="secondary">Desativado</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      Backup Automático
                    </span>
                    <Badge variant="secondary">Ativo</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      Versão do Sistema
                    </span>
                    <Badge variant="outline">v2.1.0</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Navigation Links */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  Links Rápidos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button
                    onClick={() =>
                      window.open(
                        "https://752fc8b9-7492-4d12-ba75-184c28484d96-00-tmf0eszuoofn.worf.replit.dev/noticias",
                        "_blank"
                      )
                    }
                    variant="outline"
                    className="w-full justify-start"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Ver de Notícias
                  </Button>
                  <Button
                    onClick={() =>
                      window.open(
                        "https://complaint-tracker-OGRITO.replit.app",
                        "_blank"
                      )
                    }
                    variant="outline"
                    className="w-full justify-start bg-yellow-400 text-black hover:bg-yellow-500 border-yellow-400"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Canal de Transparência
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Logout Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LogOut className="w-5 h-5 text-gray-600" />
                  Sessão
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={handleLogout}
                  variant="outline"
                  className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sair
                </Button>
              </CardContent>
            </Card>
          </div>
        );
      case "aluno":
        // Calcular Alunos Ativos somando os dados dos programas
        const calcularAlunosAtivos = () => {
          if (!dadosMensaisPEC || !dadosMensais) return 0;

          // PEC: Sala Serenata, Polo Glória, Casa Sonhar
          const serenataData = dadosMensaisPEC?.projetos
            ?.find((p: any) => p.projeto === "SALA SERENATA")
            ?.indicadores?.find(
              (i: any) => i.nome === "Quantidade de Alunos"
            )?.mensal;
          const serenata = getLastValidValue(serenataData);

          const poloGloriaData = dadosMensaisPEC?.projetos
            ?.find((p: any) => p.projeto === "POLO GLÓRIA")
            ?.indicadores?.find(
              (i: any) => i.nome === "Quantidade de Alunos"
            )?.mensal;
          const poloGloria = getLastValidValue(poloGloriaData);

          const casaSonharData = dadosMensaisPEC?.projetos
            ?.find((p: any) => p.projeto === "CASA SONHAR")
            ?.indicadores?.find(
              (i: any) => i.nome === "Quantidade de Alunos"
            )?.mensal;
          const casaSonhar = getLastValidValue(casaSonharData);

          // Inclusão Produtiva: Lab, Cursos Presenciais, EAD (Alunos Ativos)
          const labData = dadosMensais?.projetos
            ?.find((p: any) => p.projeto === "LAB. VOZES DO FUTURO")
            ?.indicadores?.find(
              (i: any) => i.nome === "Quantidade de Alunos"
            )?.mensal;
          const lab = getLastValidValue(labData);

          const cursosPresenciaisData = dadosMensais?.projetos
            ?.find((p: any) => p.projeto === "CURSOS PRESENCIAIS")
            ?.indicadores?.find(
              (i: any) => i.nome === "Quantidade de Alunos"
            )?.mensal;
          const cursosPresenciais = getLastValidValue(cursosPresenciaisData);

          const eadData = dadosMensais?.projetos
            ?.find((p: any) => p.projeto === "CURSOS EAD CGD")
            ?.indicadores?.find((i: any) => i.nome === "Alunos Ativos")?.mensal;
          const ead = getLastValidValue(eadData);

          return (
            serenata + poloGloria + casaSonhar + lab + cursosPresenciais + ead
          );
        };

        const alunosAtivos = calcularAlunosAtivos();

        // Calcular totais por programa
        const totalInclusao = (() => {
          const labData = dadosMensais?.projetos
            ?.find((p: any) => p.projeto === "LAB. VOZES DO FUTURO")
            ?.indicadores?.find(
              (i: any) => i.nome === "Quantidade de Alunos"
            )?.mensal;
          const lab = getLastValidValue(labData);

          const presencialData = dadosMensais?.projetos
            ?.find((p: any) => p.projeto === "CURSOS PRESENCIAIS")
            ?.indicadores?.find(
              (i: any) => i.nome === "Quantidade de Alunos"
            )?.mensal;
          const presencial = getLastValidValue(presencialData);

          const eadData = dadosMensais?.projetos
            ?.find((p: any) => p.projeto === "CURSOS EAD CGD")
            ?.indicadores?.find((i: any) => i.nome === "Alunos Ativos")?.mensal;
          const ead = getLastValidValue(eadData);

          return lab + presencial + ead;
        })();

        const totalPEC = (() => {
          const serenataData = dadosMensaisPEC?.projetos
            ?.find((p: any) => p.projeto === "SALA SERENATA")
            ?.indicadores?.find(
              (i: any) => i.nome === "Quantidade de Alunos"
            )?.mensal;
          const serenata = getLastValidValue(serenataData);

          const gloriaData = dadosMensaisPEC?.projetos
            ?.find((p: any) => p.projeto === "POLO GLÓRIA")
            ?.indicadores?.find(
              (i: any) => i.nome === "Quantidade de Alunos"
            )?.mensal;
          const gloria = getLastValidValue(gloriaData);

          const sonharData = dadosMensaisPEC?.projetos
            ?.find((p: any) => p.projeto === "CASA SONHAR")
            ?.indicadores?.find(
              (i: any) => i.nome === "Quantidade de Alunos"
            )?.mensal;
          const sonhar = getLastValidValue(sonharData);

          return serenata + gloria + sonhar;
        })();

        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-blue-600" />
                  Gestão de Alunos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="border-blue-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-gray-600">
                        Total de Alunos
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-blue-600">
                        {alunosAtivos}
                      </div>
                      <p className="text-xs text-gray-500">
                        Todos os programas
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border-green-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-gray-600">
                        Alunos Ativos
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-green-600">
                        {alunosAtivos}
                      </div>
                      <p className="text-xs text-gray-500">
                        Serenata + Glória + Sonhar + Lab + Presencial + IAD
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border-yellow-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-gray-600">
                        Taxa de Frequência
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-yellow-600">
                        85%
                      </div>
                      <p className="text-xs text-gray-500">Média mensal</p>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Distribuição por Programa</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">
                      Inclusão Produtiva
                    </span>
                    <Badge variant="outline">{totalInclusao} alunos</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">
                      Polo Esportivo Cultural
                    </span>
                    <Badge variant="outline">{totalPEC} alunos</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Casa Sonhar</span>
                    <Badge variant="outline">
                      {getLastValidValue(
                        dadosMensaisPEC?.projetos
                          ?.find((p: any) => p.projeto === "CASA SONHAR")
                          ?.indicadores?.find(
                            (i: any) => i.nome === "Quantidade de Alunos"
                          )?.mensal
                      )}{" "}
                      alunos
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Favela 3D</span>
                    <Badge variant="outline">0 alunos</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );
      case "colaborador":
        return <ColaboradoresSection />;
      case "favela3d":
        if (!dadosMensaisFavela3D) {
          return <div className="p-6">Carregando dados do Favela 3D...</div>;
        }
        return (
          <div className="space-y-6">
            {/* Filtro de Mês */}
            <Card>
              <CardHeader>
                <CardTitle>Selecionar Mês</CardTitle>
              </CardHeader>
              <CardContent>
                <Select
                  value={mesSelecionadoFavela3D.toString()}
                  onValueChange={(value) =>
                    setMesSelecionadoFavela3D(parseInt(value))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione o mês" />
                  </SelectTrigger>
                  <SelectContent>
                    {dadosMensaisFavela3D.meses?.map(
                      (mes: string, index: number) => (
                        <SelectItem key={index} value={index.toString()}>
                          {mes}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Indicadores por Eixo */}
            {dadosMensaisFavela3D.eixos?.map((eixo: any) => (
              <Card key={eixo.nome}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <img
                        src={favela3dLogo}
                        alt="Favela 3D"
                        className="w-5 h-5"
                      />
                      {eixo.nome}
                    </CardTitle>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <Filter className="h-4 w-4 text-gray-500" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    {eixo.indicadores?.map((indicador: any) => (
                      <div
                        key={indicador.nome}
                        className="p-4 border rounded-lg"
                      >
                        <p className="text-sm text-gray-600 mb-2">
                          {indicador.nome}
                        </p>
                        <p className="text-2xl font-bold text-purple-600">
                          {getValorMensalFavela3D(eixo.nome, indicador.nome) ||
                            0}
                        </p>
                        {indicador.meta && (
                          <p className="text-xs text-gray-500">
                            Meta: {indicador.meta}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Gráfico de Evolução Mensal */}
                  {eixo.indicadores?.[0] && (
                    <div className="mt-6">
                      <h4 className="text-sm font-semibold mb-4">
                        Evolução Mensal - {eixo.indicadores[0].nome}
                      </h4>
                      <ResponsiveContainer width="100%" height={250}>
                        <BarChart
                          data={dadosMensaisFavela3D.meses?.map(
                            (mes: string, idx: number) => ({
                              mes,
                              valor: eixo.indicadores[0].mensal[idx] || 0,
                            })
                          )}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="mes" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="valor" fill="#8b5cf6" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        );
      case "inclusao":
        if (!dadosMensais) {
          return (
            <div className="p-6">Carregando dados de Inclusão Produtiva...</div>
          );
        }
        return (
          <div className="space-y-6">
            {/* Card de Acumulado do Ano */}
            <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-700">
                  <TrendingUp className="w-5 h-5" />
                  Acumulado do Ano 2025
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* LAB - Vozes do Futuro */}
                  {(() => {
                    const labData = dadosMensais.projetos?.find((p: any) => p.projeto === "LAB. VOZES DO FUTURO");
                    const alunosIndicador = labData?.indicadores?.find((i: any) => i.nome === "Alunos Ativos");
                    const totalAlunos = alunosIndicador?.mensal?.reduce((acc: number, val: number) => acc + (val || 0), 0) || 0;
                    
                    return (
                      <div className="p-4 bg-white border border-green-200 rounded-lg">
                        <p className="text-sm font-semibold text-gray-700 mb-1">LAB</p>
                        <p className="text-3xl font-bold text-green-600">{totalAlunos}</p>
                        <p className="text-xs text-gray-500">Total de Alunos</p>
                      </div>
                    );
                  })()}
                  
                  {/* Cursos EAD */}
                  {(() => {
                    const eadData = dadosMensais.projetos?.find((p: any) => p.projeto === "CURSOS EAD CGD");
                    const alunosIndicador = eadData?.indicadores?.find((i: any) => i.nome === "Alunos Ativos");
                    const totalAlunos = alunosIndicador?.mensal?.reduce((acc: number, val: number) => acc + (val || 0), 0) || 0;
                    
                    return (
                      <div className="p-4 bg-white border border-green-200 rounded-lg">
                        <p className="text-sm font-semibold text-gray-700 mb-1">Cursos EAD</p>
                        <p className="text-3xl font-bold text-green-600">{totalAlunos}</p>
                        <p className="text-xs text-gray-500">Total de Alunos</p>
                      </div>
                    );
                  })()}
                  
                  {/* Curso 30h */}
                  {(() => {
                    const cursosData = dadosMensais.projetos?.find((p: any) => p.projeto === "CURSOS PRESENCIAIS");
                    const alunosIndicador = cursosData?.indicadores?.find((i: any) => i.nome === "Alunos Ativos");
                    const totalAlunos = alunosIndicador?.mensal?.reduce((acc: number, val: number) => acc + (val || 0), 0) || 0;
                    
                    return (
                      <div className="p-4 bg-white border border-green-200 rounded-lg">
                        <p className="text-sm font-semibold text-gray-700 mb-1">Curso 30h</p>
                        <p className="text-3xl font-bold text-green-600">{totalAlunos}</p>
                        <p className="text-xs text-gray-500">Total de Alunos</p>
                      </div>
                    );
                  })()}
                </div>
              </CardContent>
            </Card>

            {/* Indicadores por Projeto (cada um com seu próprio filtro) */}
            {dadosMensais.projetos?.map((projeto: any) => {
              // Determinar qual estado de mês usar para cada projeto
              const getMesSelecionado = () => {
                if (projeto.projeto === "LAB. VOZES DO FUTURO") return mesSelecionadoLab;
                if (projeto.projeto === "CURSOS PRESENCIAIS") return mesSelecionadoCursos30h;
                if (projeto.projeto === "CURSOS EAD CGD") return mesSelecionadoEad;
                return 0;
              };

              const setMesSelecionado = (value: number) => {
                if (projeto.projeto === "LAB. VOZES DO FUTURO") setMesSelecionadoLab(value);
                else if (projeto.projeto === "CURSOS PRESENCIAIS") setMesSelecionadoCursos30h(value);
                else if (projeto.projeto === "CURSOS EAD CGD") setMesSelecionadoEad(value);
              };

              return (
                <Card key={projeto.projeto}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-green-600" />
                        {projeto.projeto}
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Filtro de Mês Individual */}
                    <div>
                      <label className="text-sm font-medium mb-2 block">Selecionar Mês</label>
                      <Select value={getMesSelecionado().toString()} onValueChange={(value) => setMesSelecionado(parseInt(value))}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Selecione o mês" />
                        </SelectTrigger>
                        <SelectContent>
                          {dadosMensais.meses?.map((mes: string, index: number) => (
                            <SelectItem key={index} value={index.toString()}>
                              {mes}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {projeto.indicadores?.map((indicador: any) => (
                        <div key={indicador.nome} className="p-4 border rounded-lg">
                          <p className="text-sm text-gray-600 mb-2">{indicador.nome}</p>
                          <p className="text-2xl font-bold text-green-600">
                            {getValorMensalInclusao(projeto.projeto, indicador.nome) || 0}
                          </p>
                          {indicador.meta && (
                            <p className="text-xs text-gray-500">Meta: {indicador.meta}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  
                  {/* Gráfico de Evolução Mensal */}
                  {projeto.indicadores?.[0] && (
                    <div className="mt-6">
                      <h4 className="text-sm font-semibold mb-4">
                        Evolução Mensal - {projeto.indicadores[0].nome}
                      </h4>
                      <ResponsiveContainer width="100%" height={250}>
                        <BarChart
                          data={dadosMensais.meses?.map(
                            (mes: string, idx: number) => ({
                              mes,
                              valor: projeto.indicadores[0].mensal[idx] || 0,
                            })
                          )}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="mes" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="valor" fill="#10b981" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>
              );
            })}

            {/* NOVA SEÇÃO: Cursos Detalhados por Área */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-700">
                  <Award className="w-5 h-5" />
                  Cursos por Área (Detalhado)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                
                {/* Card Tecnologia */}
                <div className="bg-yellow-50 rounded-2xl shadow-lg overflow-hidden">
                  <div
                    className="p-4 cursor-pointer transition-all duration-300 hover:bg-yellow-100"
                    onClick={() => setSelectedArea(selectedArea === 'tecnologia' ? null : 'tecnologia')}
                    data-testid="card-area-tecnologia"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-yellow-500 rounded-xl flex items-center justify-center">
                          <Monitor className="w-5 h-5 text-white" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-800">Tecnologia</h3>
                      </div>
                      {selectedArea === 'tecnologia' ? (
                        <ChevronUp className="w-5 h-5 text-gray-600" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-600" />
                      )}
                    </div>
                  </div>

                  {selectedArea === 'tecnologia' && (
                    <div className="px-4 pb-4 space-y-3">
                      {tecnologiaData?.data.presencial && tecnologiaData.data.presencial.cursos.length > 0 && (
                        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                          <div
                            className="p-3 cursor-pointer transition-all duration-300 hover:bg-gray-50"
                            onClick={() => setSelectedModalidade(selectedModalidade === 'presencial' ? null : 'presencial')}
                            data-testid="btn-modalidade-presencial"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Users className="w-5 h-5 text-yellow-600" />
                                <span className="font-semibold text-gray-800">Presencial</span>
                              </div>
                              {selectedModalidade === 'presencial' ? (
                                <ChevronUp className="w-4 h-4 text-gray-600" />
                              ) : (
                                <ChevronDown className="w-4 h-4 text-gray-600" />
                              )}
                            </div>
                          </div>

                          {selectedModalidade === 'presencial' && (
                            <div className="px-3 pb-3 space-y-2">
                              <div className="bg-yellow-50 rounded-lg p-3 mb-3">
                                <h4 className="text-sm font-bold text-gray-800 mb-2">Totais Presencial</h4>
                                <div className="grid grid-cols-4 gap-2">
                                  <div className="text-center">
                                    <div className="text-lg font-bold text-gray-600">
                                      {tecnologiaData?.data.presencial.cursos.length || 0}
                                    </div>
                                    <p className="text-xs text-gray-600">Cursos</p>
                                  </div>
                                  <div className="text-center">
                                    <div className="text-lg font-bold text-yellow-600">
                                      {tecnologiaData?.data.presencial.totais.inscritos || 0}
                                    </div>
                                    <p className="text-xs text-gray-600">Inscritos</p>
                                  </div>
                                  <div className="text-center">
                                    <div className="text-lg font-bold text-green-600">
                                      {tecnologiaData?.data.presencial.totais.formados || 0}
                                    </div>
                                    <p className="text-xs text-gray-600">Formados</p>
                                  </div>
                                  <div className="text-center">
                                    <div className="text-lg font-bold text-red-600">
                                      {tecnologiaData?.data.presencial.totais.percentualEvasao || 0}%
                                    </div>
                                    <p className="text-xs text-gray-600">Evasão</p>
                                  </div>
                                </div>
                              </div>

                              <div className="space-y-2">
                                <h4 className="text-sm font-semibold text-gray-700">Cursos:</h4>
                                {tecnologiaData?.data.presencial.cursos.map((curso: any) => (
                                  <div key={curso.id} className="bg-gray-50 rounded-lg p-2 text-xs">
                                    <div className="font-semibold text-gray-800 mb-1">{curso.curso}</div>
                                    <div className="grid grid-cols-4 gap-1 text-gray-600">
                                      <div>
                                        <span className="font-medium">Inscritos:</span> {curso.inscritos ?? '-'}
                                      </div>
                                      <div>
                                        <span className="font-medium">Formados:</span> {curso.formados ?? '-'}
                                      </div>
                                      <div>
                                        <span className="font-medium">Evasão:</span> {curso.evasao ?? '-'}
                                      </div>
                                      <div className={curso.situacao === 'Concluído' ? 'text-green-600' : 'text-blue-600'}>
                                        {curso.situacao}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {tecnologiaData?.data.ead && tecnologiaData.data.ead.cursos.length > 0 && (
                        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                          <div
                            className="p-3 cursor-pointer transition-all duration-300 hover:bg-gray-50"
                            onClick={() => setSelectedModalidade(selectedModalidade === 'ead' ? null : 'ead')}
                            data-testid="btn-modalidade-ead"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Monitor className="w-5 h-5 text-blue-600" />
                                <span className="font-semibold text-gray-800">EAD</span>
                              </div>
                              {selectedModalidade === 'ead' ? (
                                <ChevronUp className="w-4 h-4 text-gray-600" />
                              ) : (
                                <ChevronDown className="w-4 h-4 text-gray-600" />
                              )}
                            </div>
                          </div>

                          {selectedModalidade === 'ead' && (
                            <div className="px-3 pb-3 space-y-2">
                              <div className="bg-blue-50 rounded-lg p-3 mb-3">
                                <h4 className="text-sm font-bold text-gray-800 mb-2">Totais EAD</h4>
                                <div className="grid grid-cols-4 gap-2">
                                  <div className="text-center">
                                    <div className="text-lg font-bold text-gray-600">
                                      {tecnologiaData?.data.ead.cursos.length || 0}
                                    </div>
                                    <p className="text-xs text-gray-600">Cursos</p>
                                  </div>
                                  <div className="text-center">
                                    <div className="text-lg font-bold text-blue-600">
                                      {tecnologiaData?.data.ead.totais.inscritos || 0}
                                    </div>
                                    <p className="text-xs text-gray-600">Inscritos</p>
                                  </div>
                                  <div className="text-center">
                                    <div className="text-lg font-bold text-green-600">
                                      {tecnologiaData?.data.ead.totais.formados || 0}
                                    </div>
                                    <p className="text-xs text-gray-600">Formados</p>
                                  </div>
                                  <div className="text-center">
                                    <div className="text-lg font-bold text-red-600">
                                      {tecnologiaData?.data.ead.totais.percentualEvasao || 0}%
                                    </div>
                                    <p className="text-xs text-gray-600">Evasão</p>
                                  </div>
                                </div>
                              </div>

                              <div className="space-y-2">
                                <h4 className="text-sm font-semibold text-gray-700">Cursos:</h4>
                                {tecnologiaData?.data.ead.cursos.map((curso: any) => (
                                  <div key={curso.id} className="bg-gray-50 rounded-lg p-2 text-xs">
                                    <div className="font-semibold text-gray-800 mb-1">{curso.curso}</div>
                                    <div className="grid grid-cols-4 gap-1 text-gray-600">
                                      <div>
                                        <span className="font-medium">Inscritos:</span> {curso.inscritos ?? '-'}
                                      </div>
                                      <div>
                                        <span className="font-medium">Formados:</span> {curso.formados ?? '-'}
                                      </div>
                                      <div>
                                        <span className="font-medium">Evasão:</span> {curso.evasao ?? '-'}
                                      </div>
                                      <div className={curso.situacao === 'Concluído' ? 'text-green-600' : 'text-blue-600'}>
                                        {curso.situacao}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Card Beleza */}
                <div className="bg-yellow-50 rounded-2xl shadow-lg overflow-hidden">
                  <div
                    className="p-4 cursor-pointer transition-all duration-300 hover:bg-yellow-100"
                    onClick={() => setSelectedArea(selectedArea === 'beleza' ? null : 'beleza')}
                    data-testid="card-area-beleza"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-yellow-500 rounded-xl flex items-center justify-center">
                          <Star className="w-5 h-5 text-white" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-800">Beleza</h3>
                      </div>
                      {selectedArea === 'beleza' ? (
                        <ChevronUp className="w-5 h-5 text-gray-600" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-600" />
                      )}
                    </div>
                  </div>

                  {selectedArea === 'beleza' && (
                    <div className="px-4 pb-4 space-y-3">
                      {belezaData?.data.presencial && belezaData.data.presencial.cursos.length > 0 && (
                        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                          <div
                            className="p-3 cursor-pointer transition-all duration-300 hover:bg-gray-50"
                            onClick={() => setSelectedModalidade(selectedModalidade === 'presencial-beleza' ? null : 'presencial-beleza')}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Users className="w-5 h-5 text-yellow-600" />
                                <span className="font-semibold text-gray-800">Presencial</span>
                              </div>
                              {selectedModalidade === 'presencial-beleza' ? (
                                <ChevronUp className="w-4 h-4 text-gray-600" />
                              ) : (
                                <ChevronDown className="w-4 h-4 text-gray-600" />
                              )}
                            </div>
                          </div>

                          {selectedModalidade === 'presencial-beleza' && (
                            <div className="px-3 pb-3 space-y-2">
                              <div className="bg-yellow-50 rounded-lg p-3 mb-3">
                                <h4 className="text-sm font-bold text-gray-800 mb-2">Totais Presencial</h4>
                                <div className="grid grid-cols-4 gap-2">
                                  <div className="text-center">
                                    <div className="text-lg font-bold text-gray-600">
                                      {belezaData?.data.presencial.cursos.length || 0}
                                    </div>
                                    <p className="text-xs text-gray-600">Cursos</p>
                                  </div>
                                  <div className="text-center">
                                    <div className="text-lg font-bold text-yellow-600">
                                      {belezaData?.data.presencial.totais.inscritos || 0}
                                    </div>
                                    <p className="text-xs text-gray-600">Inscritos</p>
                                  </div>
                                  <div className="text-center">
                                    <div className="text-lg font-bold text-green-600">
                                      {belezaData?.data.presencial.totais.formados || 0}
                                    </div>
                                    <p className="text-xs text-gray-600">Formados</p>
                                  </div>
                                  <div className="text-center">
                                    <div className="text-lg font-bold text-red-600">
                                      {belezaData?.data.presencial.totais.percentualEvasao || 0}%
                                    </div>
                                    <p className="text-xs text-gray-600">Evasão</p>
                                  </div>
                                </div>
                              </div>

                              <div className="space-y-2">
                                <h4 className="text-sm font-semibold text-gray-700">Cursos:</h4>
                                {belezaData?.data.presencial.cursos.map((curso: any) => (
                                  <div key={curso.id} className="bg-gray-50 rounded-lg p-2 text-xs">
                                    <div className="font-semibold text-gray-800 mb-1">{curso.curso}</div>
                                    <div className="grid grid-cols-4 gap-1 text-gray-600">
                                      <div>
                                        <span className="font-medium">Inscritos:</span> {curso.inscritos ?? '-'}
                                      </div>
                                      <div>
                                        <span className="font-medium">Formados:</span> {curso.formados ?? '-'}
                                      </div>
                                      <div>
                                        <span className="font-medium">Evasão:</span> {curso.evasao ?? '-'}
                                      </div>
                                      <div className={curso.situacao === 'Concluído' ? 'text-green-600' : 'text-blue-600'}>
                                        {curso.situacao}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Card Gastronomia */}
                <div className="bg-yellow-50 rounded-2xl shadow-lg overflow-hidden">
                  <div
                    className="p-4 cursor-pointer transition-all duration-300 hover:bg-yellow-100"
                    onClick={() => setSelectedArea(selectedArea === 'gastronomia' ? null : 'gastronomia')}
                    data-testid="card-area-gastronomia"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-yellow-500 rounded-xl flex items-center justify-center">
                          <Trophy className="w-5 h-5 text-white" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-800">Gastronomia</h3>
                      </div>
                      {selectedArea === 'gastronomia' ? (
                        <ChevronUp className="w-5 h-5 text-gray-600" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-600" />
                      )}
                    </div>
                  </div>

                  {selectedArea === 'gastronomia' && gastronomiaData && (
                    <div className="px-4 pb-4 space-y-3">
                      {gastronomiaData?.data.presencial && gastronomiaData.data.presencial.cursos.length > 0 && (
                        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                          <div
                            className="p-3 cursor-pointer transition-all duration-300 hover:bg-gray-50"
                            onClick={() => setSelectedModalidade(selectedModalidade === 'presencial-gastronomia' ? null : 'presencial-gastronomia')}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Users className="w-5 h-5 text-yellow-600" />
                                <span className="font-semibold text-gray-800">Presencial</span>
                              </div>
                              {selectedModalidade === 'presencial-gastronomia' ? (
                                <ChevronUp className="w-4 h-4 text-gray-600" />
                              ) : (
                                <ChevronDown className="w-4 h-4 text-gray-600" />
                              )}
                            </div>
                          </div>

                          {selectedModalidade === 'presencial-gastronomia' && (
                            <div className="px-3 pb-3 space-y-2">
                              <div className="bg-yellow-50 rounded-lg p-3 mb-3">
                                <h4 className="text-sm font-bold text-gray-800 mb-2">Totais Presencial</h4>
                                <div className="grid grid-cols-4 gap-2">
                                  <div className="text-center">
                                    <div className="text-lg font-bold text-gray-600">
                                      {gastronomiaData?.data.presencial.cursos.length || 0}
                                    </div>
                                    <p className="text-xs text-gray-600">Cursos</p>
                                  </div>
                                  <div className="text-center">
                                    <div className="text-lg font-bold text-yellow-600">
                                      {gastronomiaData?.data.presencial.totais.inscritos || 0}
                                    </div>
                                    <p className="text-xs text-gray-600">Inscritos</p>
                                  </div>
                                  <div className="text-center">
                                    <div className="text-lg font-bold text-green-600">
                                      {gastronomiaData?.data.presencial.totais.formados || 0}
                                    </div>
                                    <p className="text-xs text-gray-600">Formados</p>
                                  </div>
                                  <div className="text-center">
                                    <div className="text-lg font-bold text-red-600">
                                      {gastronomiaData?.data.presencial.totais.percentualEvasao || 0}%
                                    </div>
                                    <p className="text-xs text-gray-600">Evasão</p>
                                  </div>
                                </div>
                              </div>

                              <div className="space-y-2">
                                <h4 className="text-sm font-semibold text-gray-700">Cursos:</h4>
                                {gastronomiaData?.data.presencial.cursos.map((curso: any) => (
                                  <div key={curso.id} className="bg-gray-50 rounded-lg p-2 text-xs">
                                    <div className="font-semibold text-gray-800 mb-1">{curso.curso}</div>
                                    <div className="grid grid-cols-4 gap-1 text-gray-600">
                                      <div>
                                        <span className="font-medium">Inscritos:</span> {curso.inscritos ?? '-'}
                                      </div>
                                      <div>
                                        <span className="font-medium">Formados:</span> {curso.formados ?? '-'}
                                      </div>
                                      <div>
                                        <span className="font-medium">Evasão:</span> {curso.evasao ?? '-'}
                                      </div>
                                      <div className={curso.situacao === 'Concluído' ? 'text-green-600' : 'text-blue-600'}>
                                        {curso.situacao}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Cards das demais áreas - padrão similar */}
                {/* Artesanato, Empreendedorismo, Administrativo, Socioemocional, Educacional, Operacional */}
                {[
                  { id: 'artesanato', nome: 'Artesanato', data: artesanatoData, icon: 'Trophy' },
                  { id: 'empreendedorismo', nome: 'Empreendedorismo', data: empreendedorismoData, icon: 'Briefcase' },
                  { id: 'administrativo', nome: 'Administrativo', data: administrativoData, icon: 'FileText' },
                  { id: 'socioemocional', nome: 'Socioemocional', data: socioemocionalData, icon: 'Heart' },
                  { id: 'educacional', nome: 'Educacional', data: educacionalData, icon: 'BookOpen' },
                  { id: 'operacional', nome: 'Operacional', data: operacionalData, icon: 'Settings' }
                ].map((area) => {
                  const IconComponent = area.icon === 'Trophy' ? Trophy : 
                                      area.icon === 'Briefcase' ? Briefcase :
                                      area.icon === 'FileText' ? FileText :
                                      area.icon === 'Heart' ? Heart :
                                      area.icon === 'BookOpen' ? BookOpen : Settings;
                  
                  return (
                    <div key={area.id} className="bg-yellow-50 rounded-2xl shadow-lg overflow-hidden">
                      <div
                        className="p-4 cursor-pointer transition-all duration-300 hover:bg-yellow-100"
                        onClick={() => setSelectedArea(selectedArea === area.id ? null : area.id)}
                        data-testid={`card-area-${area.id}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-yellow-500 rounded-xl flex items-center justify-center">
                              <IconComponent className="w-5 h-5 text-white" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-800">{area.nome}</h3>
                          </div>
                          {selectedArea === area.id ? (
                            <ChevronUp className="w-5 h-5 text-gray-600" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-gray-600" />
                          )}
                        </div>
                      </div>

                      {selectedArea === area.id && area.data && (
                        <div className="px-4 pb-4 space-y-3">
                          {area.data?.data.presencial && area.data.data.presencial.cursos.length > 0 && (
                            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                              <div
                                className="p-3 cursor-pointer transition-all duration-300 hover:bg-gray-50"
                                onClick={() => setSelectedModalidade(selectedModalidade === `presencial-${area.id}` ? null : `presencial-${area.id}`)}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <Users className="w-5 h-5 text-yellow-600" />
                                    <span className="font-semibold text-gray-800">Presencial</span>
                                  </div>
                                  {selectedModalidade === `presencial-${area.id}` ? (
                                    <ChevronUp className="w-4 h-4 text-gray-600" />
                                  ) : (
                                    <ChevronDown className="w-4 h-4 text-gray-600" />
                                  )}
                                </div>
                              </div>

                              {selectedModalidade === `presencial-${area.id}` && (
                                <div className="px-3 pb-3 space-y-2">
                                  <div className="bg-yellow-50 rounded-lg p-3 mb-3">
                                    <h4 className="text-sm font-bold text-gray-800 mb-2">Totais Presencial</h4>
                                    <div className="grid grid-cols-4 gap-2">
                                      <div className="text-center">
                                        <div className="text-lg font-bold text-gray-600">
                                          {area.data?.data.presencial.cursos.length || 0}
                                        </div>
                                        <p className="text-xs text-gray-600">Cursos</p>
                                      </div>
                                      <div className="text-center">
                                        <div className="text-lg font-bold text-yellow-600">
                                          {area.data?.data.presencial.totais.inscritos || 0}
                                        </div>
                                        <p className="text-xs text-gray-600">Inscritos</p>
                                      </div>
                                      <div className="text-center">
                                        <div className="text-lg font-bold text-green-600">
                                          {area.data?.data.presencial.totais.formados || 0}
                                        </div>
                                        <p className="text-xs text-gray-600">Formados</p>
                                      </div>
                                      <div className="text-center">
                                        <div className="text-lg font-bold text-red-600">
                                          {area.data?.data.presencial.totais.percentualEvasao || 0}%
                                        </div>
                                        <p className="text-xs text-gray-600">Evasão</p>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="space-y-2">
                                    <h4 className="text-sm font-semibold text-gray-700">Cursos:</h4>
                                    {area.data?.data.presencial.cursos.map((curso: any) => (
                                      <div key={curso.id} className="bg-gray-50 rounded-lg p-2 text-xs">
                                        <div className="font-semibold text-gray-800 mb-1">{curso.curso}</div>
                                        <div className="grid grid-cols-4 gap-1 text-gray-600">
                                          <div>
                                            <span className="font-medium">Inscritos:</span> {curso.inscritos ?? '-'}
                                          </div>
                                          <div>
                                            <span className="font-medium">Formados:</span> {curso.formados ?? '-'}
                                          </div>
                                          <div>
                                            <span className="font-medium">Evasão:</span> {curso.evasao ?? '-'}
                                          </div>
                                          <div className={curso.situacao === 'Concluído' ? 'text-green-600' : 'text-blue-600'}>
                                            {curso.situacao}
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {area.data?.data.ead && area.data.data.ead.cursos.length > 0 && (
                            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                              <div
                                className="p-3 cursor-pointer transition-all duration-300 hover:bg-gray-50"
                                onClick={() => setSelectedModalidade(selectedModalidade === `ead-${area.id}` ? null : `ead-${area.id}`)}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <Monitor className="w-5 h-5 text-blue-600" />
                                    <span className="font-semibold text-gray-800">EAD</span>
                                  </div>
                                  {selectedModalidade === `ead-${area.id}` ? (
                                    <ChevronUp className="w-4 h-4 text-gray-600" />
                                  ) : (
                                    <ChevronDown className="w-4 h-4 text-gray-600" />
                                  )}
                                </div>
                              </div>

                              {selectedModalidade === `ead-${area.id}` && (
                                <div className="px-3 pb-3 space-y-2">
                                  <div className="bg-blue-50 rounded-lg p-3 mb-3">
                                    <h4 className="text-sm font-bold text-gray-800 mb-2">Totais EAD</h4>
                                    <div className="grid grid-cols-4 gap-2">
                                      <div className="text-center">
                                        <div className="text-lg font-bold text-gray-600">
                                          {area.data?.data.ead.cursos.length || 0}
                                        </div>
                                        <p className="text-xs text-gray-600">Cursos</p>
                                      </div>
                                      <div className="text-center">
                                        <div className="text-lg font-bold text-blue-600">
                                          {area.data?.data.ead.totais.inscritos || 0}
                                        </div>
                                        <p className="text-xs text-gray-600">Inscritos</p>
                                      </div>
                                      <div className="text-center">
                                        <div className="text-lg font-bold text-green-600">
                                          {area.data?.data.ead.totais.formados || 0}
                                        </div>
                                        <p className="text-xs text-gray-600">Formados</p>
                                      </div>
                                      <div className="text-center">
                                        <div className="text-lg font-bold text-red-600">
                                          {area.data?.data.ead.totais.percentualEvasao || 0}%
                                        </div>
                                        <p className="text-xs text-gray-600">Evasão</p>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="space-y-2">
                                    <h4 className="text-sm font-semibold text-gray-700">Cursos:</h4>
                                    {area.data?.data.ead.cursos.map((curso: any) => (
                                      <div key={curso.id} className="bg-gray-50 rounded-lg p-2 text-xs">
                                        <div className="font-semibold text-gray-800 mb-1">{curso.curso}</div>
                                        <div className="grid grid-cols-4 gap-1 text-gray-600">
                                          <div>
                                            <span className="font-medium">Inscritos:</span> {curso.inscritos ?? '-'}
                                          </div>
                                          <div>
                                            <span className="font-medium">Formados:</span> {curso.formados ?? '-'}
                                          </div>
                                          <div>
                                            <span className="font-medium">Evasão:</span> {curso.evasao ?? '-'}
                                          </div>
                                          <div className={curso.situacao === 'Concluído' ? 'text-green-600' : 'text-blue-600'}>
                                            {curso.situacao}
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}

              </CardContent>
            </Card>
          </div>
        );
      case "pec":
        if (!dadosMensaisPEC) {
          return <div className="p-6">Carregando dados do PEC...</div>;
        }
        return (
          <div className="space-y-6">
            {/* Filtro de Mês */}
            <Card>
              <CardHeader>
                <CardTitle>Selecionar Mês</CardTitle>
              </CardHeader>
              <CardContent>
                <Select
                  value={mesSelecionadoPEC.toString()}
                  onValueChange={(value) =>
                    setMesSelecionadoPEC(parseInt(value))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione o mês" />
                  </SelectTrigger>
                  <SelectContent>
                    {dadosMensaisPEC.meses?.map(
                      (mes: string, index: number) => (
                        <SelectItem key={index} value={index.toString()}>
                          {mes}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Indicadores por Projeto */}
            {dadosMensaisPEC.projetos?.map((projeto: any) => (
              <Card key={projeto.projeto}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-orange-600" />
                      {projeto.projeto}
                    </CardTitle>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <Filter className="h-4 w-4 text-gray-500" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    {projeto.indicadores?.map((indicador: any) => (
                      <div
                        key={indicador.nome}
                        className="p-4 border rounded-lg"
                      >
                        <p className="text-sm text-gray-600 mb-2">
                          {indicador.nome}
                        </p>
                        <p className="text-2xl font-bold text-orange-600">
                          {getValorMensalPEC(projeto.projeto, indicador.nome) ||
                            0}
                        </p>
                        {indicador.meta && (
                          <p className="text-xs text-gray-500">
                            Meta: {indicador.meta}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Gráfico de Evolução Mensal */}
                  {projeto.indicadores?.[0] && (
                    <div className="mt-6">
                      <h4 className="text-sm font-semibold mb-4">
                        Evolução Mensal - {projeto.indicadores[0].nome}
                      </h4>
                      <ResponsiveContainer width="100%" height={250}>
                        <BarChart
                          data={dadosMensaisPEC.meses?.map(
                            (mes: string, idx: number) => ({
                              mes,
                              valor: projeto.indicadores[0].mensal[idx] || 0,
                            })
                          )}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="mes" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="valor" fill="#f97316" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        );
      case "psicossocial":
        if (!dadosMensaisPsicossocial) {
          return <div className="p-6">Carregando dados de Psicossocial...</div>;
        }
        return (
          <div className="space-y-6">
            {/* Filtro de Mês */}
            <Card>
              <CardHeader>
                <CardTitle>Selecionar Mês</CardTitle>
              </CardHeader>
              <CardContent>
                <Select
                  value={mesSelecionadoPsicossocial.toString()}
                  onValueChange={(value) =>
                    setMesSelecionadoPsicossocial(parseInt(value))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione o mês" />
                  </SelectTrigger>
                  <SelectContent>
                    {dadosMensaisPsicossocial.meses?.map(
                      (mes: string, index: number) => (
                        <SelectItem key={index} value={index.toString()}>
                          {mes}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Indicadores */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-600" />
                    Indicadores Psicossocial
                  </CardTitle>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <Filter className="h-4 w-4 text-gray-500" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  {dadosMensaisPsicossocial.indicadores?.map(
                    (indicador: any) => (
                      <div
                        key={indicador.nome}
                        className="p-4 border rounded-lg"
                      >
                        <p className="text-sm text-gray-600 mb-2">
                          {indicador.nome}
                        </p>
                        <p className="text-2xl font-bold text-blue-600">
                          {getValorMensalPsicossocial(indicador.nome) || 0}
                        </p>
                        {indicador.meta && (
                          <p className="text-xs text-gray-500">
                            Meta: {indicador.meta}
                          </p>
                        )}
                      </div>
                    )
                  )}
                </div>

                {/* Gráfico de Evolução Mensal */}
                {dadosMensaisPsicossocial.indicadores?.[0] && (
                  <div className="mt-6">
                    <h4 className="text-sm font-semibold mb-4">
                      Evolução Mensal -{" "}
                      {dadosMensaisPsicossocial.indicadores[0].nome}
                    </h4>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart
                        data={dadosMensaisPsicossocial.meses?.map(
                          (mes: string, idx: number) => ({
                            mes,
                            valor:
                              dadosMensaisPsicossocial.indicadores[0].mensal[
                                idx
                              ] || 0,
                          })
                        )}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="mes" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="valor" fill="#3b82f6" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        );
      case "negocios":
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>
                  {sidebarItems.find((item) => item.id === activeSection)
                    ?.label || activeSection}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Seção em desenvolvimento. Os dados específicos para este
                  programa serão exibidos em breve.
                </p>
              </CardContent>
            </Card>
          </div>
        );
      case "investimento":
        return <RelatorioFinanceiroDetalhado />;
      default:
        return isMobile ? renderMobileDashboard() : renderDashboard();
    }
  };

  if (!isLeo && !demoMode) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <header className="bg-white shadow-sm border-b border-gray-100">
          <div className="max-w-md mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation("/perfil")}
                className="p-2"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <h1 className="text-lg font-bold text-black">Área Especial</h1>
            </div>
          </div>
        </header>

        <main className="max-w-md mx-auto px-4 py-6">
          <Card className="text-center border-red-200">
            <CardContent className="p-6">
              <div className="mb-4">
                <Lock className="w-16 h-16 mx-auto text-red-500 mb-4" />
                <Logo size="md" className="mx-auto mb-4" />
              </div>
              <h2 className="text-xl font-bold text-black mb-3">
                Acesso Ultra-Restrito
              </h2>
              <p className="text-gray-600 mb-4">
                Esta área é exclusiva para o super-administrador do sistema.
              </p>
              <Badge variant="destructive" className="mb-4">
                <Crown className="w-3 h-3 mr-1" />
                Acesso Especial Necessário
              </Badge>
              <p className="text-sm text-gray-500">
                Apenas o super-administrador pode acessar esta funcionalidade.
              </p>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  // Mobile version - optimized layout with Drawer Menu
  if (isMobile) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Overlay when drawer is open */}
        {isDrawerOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 transition-opacity"
            onClick={() => setIsDrawerOpen(false)}
          />
        )}

        {/* Side Drawer Menu */}
        <div
          className={`fixed top-0 left-0 h-full w-72 bg-white z-50 shadow-2xl transform transition-transform duration-300 ease-in-out ${
            isDrawerOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          {/* Drawer Header */}
          <div className="bg-yellow-400 p-4 border-b border-yellow-500">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Crown className="w-6 h-6 text-black" />
                <div>
                  <h2 className="text-base font-bold text-black">
                    {devAccess.hasDevAccess ? "Dev - Leo" : "Leo Martins"}
                  </h2>
                  <p className="text-xs text-black/70">Super Admin</p>
                </div>
              </div>
              <Button
                onClick={() => setIsDrawerOpen(false)}
                variant="ghost"
                size="sm"
                className="text-black hover:bg-yellow-500 p-1"
              >
                ✕
              </Button>
            </div>
            <Badge className="bg-transparent border-2 border-black text-black text-xs px-2 py-1">
              <Crown className="w-3 h-3 mr-1" />
              Acesso Total
            </Badge>
          </div>

          {/* Drawer Content - Scrollable */}
          <div className="overflow-y-auto h-[calc(100%-180px)]">
            {/* Dashboard */}
            <div className="p-4 border-b">
              <button
                onClick={() => {
                  setActiveSection("dashboard");
                  setIsDrawerOpen(false);
                }}
                className={`flex items-center w-full px-4 py-3 rounded-lg transition-colors ${
                  activeSection === "dashboard"
                    ? "bg-yellow-400 text-black font-semibold"
                    : "hover:bg-gray-100 text-gray-700"
                }`}
              >
                <Home className="w-5 h-5 mr-3" />
                <span>Dashboard</span>
              </button>
            </div>

            {/* Programas */}
            <div className="p-4 border-b">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-2">
                Programas
              </h3>
              <div className="space-y-1">
                {sidebarItems
                  .filter((item) =>
                    [
                      "favela3d",
                      "inclusao",
                      "pec",
                      "psicossocial",
                      "negocios",
                      "investimento",
                      "marketing",
                    ].includes(item.id)
                  )
                  .map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveSection(item.id);
                        setIsDrawerOpen(false);
                      }}
                      className={`flex items-center w-full px-4 py-2.5 rounded-lg transition-colors ${
                        activeSection === item.id
                          ? "bg-yellow-400 text-black font-semibold"
                          : "hover:bg-gray-100 text-gray-700"
                      }`}
                    >
                      {item.id === "favela3d" ? (
                        <img
                          src={favela3dLogo}
                          alt="Favela 3D"
                          className="w-5 h-5 mr-3"
                        />
                      ) : (
                        <item.icon className="w-5 h-5 mr-3" />
                      )}
                      <span className="text-sm">{item.label}</span>
                    </button>
                  ))}
              </div>
            </div>

            {/* Comunidade */}
            <div className="p-4 border-b">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-2">
                Comunidade
              </h3>
              <div className="space-y-1">
                {sidebarItems
                  .filter((item) =>
                    ["doador", "patrocinador", "aluno", "colaborador"].includes(
                      item.id
                    )
                  )
                  .map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveSection(item.id);
                        setIsDrawerOpen(false);
                      }}
                      className={`flex items-center w-full px-4 py-2.5 rounded-lg transition-colors ${
                        activeSection === item.id
                          ? "bg-yellow-400 text-black font-semibold"
                          : item.id === "patrocinador"
                          ? "bg-amber-100 hover:bg-amber-200 text-gray-800 border border-amber-200"
                          : "hover:bg-gray-100 text-gray-700"
                      }`}
                    >
                      <item.icon className="w-5 h-5 mr-3" />
                      <span className="text-sm">{item.label}</span>
                    </button>
                  ))}
              </div>
            </div>

            {/* Administração */}
            <div className="p-4">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-2">
                Administração
              </h3>
              <div className="space-y-1">
                <button
                  onClick={() => {
                    setActiveSection("conselho");
                    setIsDrawerOpen(false);
                  }}
                  className={`flex items-center w-full px-4 py-2.5 rounded-lg transition-colors ${
                    activeSection === "conselho"
                      ? "bg-red-100 text-red-700 font-semibold border border-red-300"
                      : "hover:bg-gray-100 text-gray-700"
                  }`}
                >
                  <Shield className="w-5 h-5 mr-3" />
                  <span className="text-sm">Conselho</span>
                </button>
                <button
                  onClick={() => {
                    setActiveSection("settings");
                    setIsDrawerOpen(false);
                  }}
                  className={`flex items-center w-full px-4 py-2.5 rounded-lg transition-colors ${
                    activeSection === "settings"
                      ? "bg-yellow-400 text-black font-semibold"
                      : "hover:bg-gray-100 text-gray-700"
                  }`}
                >
                  <Settings className="w-5 h-5 mr-3" />
                  <span className="text-sm">Configurações</span>
                </button>
              </div>
            </div>
          </div>

          {/* Drawer Footer - Fixed Actions */}
          <div className="absolute bottom-0 left-0 right-0 bg-white border-t p-4">
            <button
              onClick={() => {
                sessionStorage.removeItem("preferAdminView");
                setLocation("/tdoador");
              }}
              className="flex items-center w-full px-4 py-2.5 rounded-lg hover:bg-red-50 text-red-600 mb-2"
            >
              <Heart className="w-5 h-5 mr-3" />
              <span className="text-sm font-medium">Modo Doador</span>
            </button>
            <button
              onClick={() => window.open('https://complaint-tracker-OGRITO.replit.app', '_blank')}
              className="flex items-center w-full px-4 py-2.5 rounded-lg bg-yellow-400 hover:bg-yellow-500 text-black mb-2"
            >
              <ExternalLink className="w-5 h-5 mr-3" />
              <span className="text-sm font-medium">Canal de Transparência</span>
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center w-full px-4 py-2.5 rounded-lg bg-blue-500 hover:bg-blue-600 text-white mb-2">
                  <ClipboardList className="w-5 h-5 mr-3" />
                  <span className="text-sm font-medium">Plano de Ação</span>
                  <ChevronDown className="w-4 h-4 ml-auto" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
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
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-4 py-2.5 rounded-lg hover:bg-gray-100 text-gray-700"
            >
              <LogOut className="w-5 h-5 mr-3" />
              <span className="text-sm font-medium">Sair</span>
            </button>
          </div>
        </div>

        {/* Banner de acesso de desenvolvedor mobile */}
        {devAccess.hasDevAccess && (
          <div className="bg-blue-600 text-white px-4 py-2 text-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Code className="w-4 h-4" />
                <span>Modo Desenvolvedor Ativo</span>
              </div>
              {devAccess.shouldShowBackButton && (
                <Button
                  onClick={() => {
                    sessionStorage.setItem("dev_returning", "true");
                    setLocation("/dev");
                  }}
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-blue-700 p-1"
                >
                  ← Dev
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Clean Mobile Header with Hamburger */}
        <header className="bg-yellow-400 px-4 py-4 shadow-lg sticky top-0 z-30">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button
                onClick={() => setIsDrawerOpen(true)}
                variant="ghost"
                size="sm"
                className="text-black hover:bg-yellow-500 p-2"
                data-testid="button-menu-hamburger"
              >
                <Menu className="w-6 h-6" />
              </Button>
              <Logo size="sm" />
              <div>
                <h2 className="text-lg font-bold text-black">
                  {sidebarItems.find((item) => item.id === activeSection)
                    ?.label || "Dashboard"}
                </h2>
                <p className="text-xs text-black/70">
                  {devAccess.hasDevAccess ? "Dev Mode" : "Admin"}
                </p>
              </div>
            </div>
            {demoMode && (
              <Badge className="bg-blue-600 text-white text-xs px-2 py-1">
                Demo
              </Badge>
            )}
          </div>
        </header>

        {/* Main Content Area */}
        <main className="pb-20 px-4 pt-4">
          {renderSectionContent()}
        </main>

        {/* Mobile Bottom Navigation */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg">
          <div className="flex">
            <button
              onClick={() => setActiveSection("dashboard")}
              className={`flex-1 py-3 px-2 text-center ${
                activeSection === "dashboard"
                  ? "text-yellow-600"
                  : "text-gray-400"
              }`}
            >
              <BarChart3 className="w-6 h-6 mx-auto mb-1" />
              <span className="text-xs">Dashboard</span>
            </button>
            <button
              onClick={() => {
                // Marcar preferência para não ir automaticamente para admin
                sessionStorage.removeItem("preferAdminView");
                setLocation("/tdoador");
              }}
              className="flex-1 py-3 px-2 text-center text-red-500"
            >
              <Heart className="w-6 h-6 mx-auto mb-1" />
              <span className="text-xs">Doador</span>
            </button>
            <button
              onClick={() => setActiveSection("settings")}
              className={`flex-1 py-3 px-2 text-center ${
                activeSection === "settings"
                  ? "text-yellow-600"
                  : "text-gray-400"
              }`}
            >
              <Settings className="w-6 h-6 mx-auto mb-1" />
              <span className="text-xs">Config</span>
            </button>
            <button
              onClick={handleLogout}
              className="flex-1 py-3 px-2 text-center text-gray-400"
            >
              <LogOut className="w-6 h-6 mx-auto mb-1" />
              <span className="text-xs">Sair</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Desktop version - original layout
  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Banner de acesso de desenvolvedor */}
      {devAccess.hasDevAccess && (
        <div className="fixed top-0 left-0 right-0 bg-blue-600 text-white px-4 py-2 text-sm z-50">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Code className="w-4 h-4" />
              <span>
                Modo Desenvolvedor - Acesso universal ativo (Leo Martins
                Dashboard)
              </span>
            </div>
            {devAccess.shouldShowBackButton && (
              <Button
                onClick={() => {
                  sessionStorage.setItem("dev_returning", "true");
                  setLocation("/dev");
                }}
                variant="ghost"
                size="sm"
                className="text-white hover:bg-blue-700"
              >
                ← Voltar ao Painel Dev
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Sidebar */}
      <div
        className={`w-64 bg-white text-black flex flex-col fixed h-screen z-10 overflow-y-auto border-r border-gray-200 ${
          devAccess.hasDevAccess ? "mt-10" : ""
        }`}
      >
        <div className="p-4 border-b border-yellow-600">
          <div className="flex items-center space-x-3">
            <Crown className="w-8 h-8 text-black" />
            <div>
              <h1 className="text-lg font-bold text-black">
                {devAccess.hasDevAccess
                  ? "Desenvolvedor - Leo Dashboard"
                  : "Clube do Grito"}
              </h1>
              <p className="text-sm text-black">
                {devAccess.hasDevAccess ? "Acesso Total" : "Admin Dashboard"}
              </p>
            </div>
          </div>
        </div>

        <nav className="flex-1 py-4 pb-16 overflow-y-auto">
          {/* Botão para voltar à área de doador */}
          <div className="px-4 mb-6">
            <Button
              onClick={() => setLocation("/tdoador")}
              variant="outline"
              size="sm"
              className="w-full justify-start border-yellow-400 text-black hover:bg-yellow-50"
              data-testid="button-voltar-doador-desktop"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Área de Doador
            </Button>
          </div>

          <div className="px-4 mb-4">
            <h3 className="text-xs font-semibold text-black uppercase tracking-wider">
              Acesso Rápido
            </h3>
          </div>

          {sidebarItems
            .filter((item) => item.section === "main")
            .map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`w-full flex items-center px-6 py-3 text-sm font-medium transition-colors ${
                  activeSection === item.id
                    ? "text-black"
                    : "text-black hover:bg-gray-100"
                }`}
                style={
                  activeSection === item.id
                    ? { backgroundColor: "#FFF3CD" }
                    : {}
                }
              >
                {item.id === "favela3d" ? (
                  <img
                    src={favela3dLogo}
                    alt="Favela 3D Logo"
                    className="w-6 h-6 mr-3"
                  />
                ) : (
                  <item.icon className="w-6 h-6 mr-3" />
                )}
                {item.label}
              </button>
            ))}

          <div className="px-4 mt-6 mb-4">
            <h3 className="text-xs font-semibold text-black uppercase tracking-wider">
              Comunidade e Apoio
            </h3>
          </div>

          {sidebarItems
            .filter((item) => item.section === "data")
            .map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`w-full flex items-center px-6 py-3 text-sm font-medium transition-colors ${
                  activeSection === item.id
                    ? "text-black"
                    : "text-black hover:bg-gray-100"
                }`}
                style={
                  activeSection === item.id
                    ? { backgroundColor: "#FFF3CD" }
                    : {}
                }
              >
                {item.id === "favela3d" ? (
                  <img
                    src={favela3dLogo}
                    alt="Favela 3D Logo"
                    className="w-6 h-6 mr-3"
                  />
                ) : (
                  <item.icon className="w-6 h-6 mr-3" />
                )}
                {item.label}
              </button>
            ))}

          <div className="px-4 mt-6 mb-4">
            <h3 className="text-xs font-semibold text-black uppercase tracking-wider">
              Programas
            </h3>
          </div>

          {sidebarItems
            .filter((item) => item.section === "gestao")
            .map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`w-full flex items-center px-6 py-3 text-sm font-medium transition-colors ${
                  activeSection === item.id
                    ? "text-black"
                    : "text-black hover:bg-gray-100"
                }`}
                style={
                  activeSection === item.id
                    ? { backgroundColor: "#FFF3CD" }
                    : {}
                }
              >
                {item.id === "favela3d" ? (
                  <img
                    src={favela3dLogo}
                    alt="Favela 3D Logo"
                    className="w-6 h-6 mr-3"
                  />
                ) : (
                  <item.icon
                    className={`w-6 h-6 mr-3 ${
                      activeSection === item.id ? "text-black" : item.color
                    }`}
                  />
                )}
                <span
                  className={
                    activeSection === item.id ? "text-black" : item.color
                  }
                >
                  {item.label}
                </span>
              </button>
            ))}
          <div className="px-4 mt-6 mb-4">
            <h3 className="text-xs font-semibold text-black uppercase tracking-wider">
              Administração
            </h3>
          </div>

          {sidebarItems
            .filter((item) => item.section === "admin")
            .map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`w-full flex items-center px-6 py-3 text-sm font-medium transition-colors ${
                  activeSection === item.id
                    ? "text-black"
                    : "text-black hover:bg-gray-100"
                }`}
                style={
                  activeSection === item.id
                    ? { backgroundColor: "#FFF3CD" }
                    : {}
                }
              >
                {item.id === "favela3d" ? (
                  <img
                    src={favela3dLogo}
                    alt="Favela 3D Logo"
                    className="w-6 h-6 mr-3"
                  />
                ) : (
                  <item.icon
                    className={`w-6 h-6 mr-3 ${
                      activeSection === item.id ? "text-black" : item.color
                    }`}
                  />
                )}
                <span
                  className={
                    activeSection === item.id ? "text-black" : item.color
                  }
                >
                  {item.label}
                </span>
              </button>
            ))}

          <div className="px-4 mt-6 mb-4">
            <h3 className="text-xs font-semibold text-black uppercase tracking-wider">
              Sistema
            </h3>
          </div>

          <button
            onClick={() => setActiveSection("settings")}
            className={`w-full flex items-center px-6 py-3 text-sm font-medium transition-colors ${
              activeSection === "settings"
                ? "text-black"
                : "text-black hover:bg-gray-100"
            }`}
            style={
              activeSection === "settings" ? { backgroundColor: "#FFF3CD" } : {}
            }
          >
            <Settings className="w-6 h-6 mr-3" />
            Configurações
          </button>

          <button
            onClick={() => window.open("https://complaint-tracker-OGRITO.replit.app", "_blank")}
            className="w-full flex items-center px-6 py-3 text-sm font-medium transition-colors bg-white hover:bg-gray-50 text-black"
          >
            <ExternalLink className="w-6 h-6 mr-3 text-yellow-500" />
            Canal de Transparência
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="w-full flex items-center px-6 py-3 text-sm font-medium transition-colors bg-white hover:bg-gray-50 text-black"
              >
                <ClipboardList className="w-6 h-6 mr-3 text-blue-500" />
                Plano de Ação
                <ChevronDown className="w-4 h-4 ml-auto text-blue-500" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
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
        </nav>
      </div>

      {/* Main Content */}
      <div
        className={`flex-1 flex flex-col ml-64 ${
          devAccess.hasDevAccess ? "mt-10" : ""
        }`}
      >
        {/* Top Bar */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between px-6 py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {sidebarItems.find((item) => item.id === activeSection)
                  ?.label || "Dashboard"}
              </h1>
              <p className="text-sm text-gray-600">
                {devAccess.hasDevAccess
                  ? "Desenvolvedor - Acesso total ao painel administrativo de Leo Martins"
                  : "Olá, Leo! Seja bem-vindo ao seu painel de controle administrativo"}
              </p>
              {activeSection === "dashboard" && (
                <p className="text-xs text-yellow-600 mt-1">
                  {devAccess.hasDevAccess
                    ? "Modo desenvolvedor ativo - Todas as funcionalidades desbloqueadas"
                    : "Aqui você tem acesso completo a todos os dados e sistemas do Clube do Grito"}
                </p>
              )}
            </div>
            <div className="flex items-center space-x-4">
              {devAccess.hasDevAccess && (
                <Badge className="bg-blue-600 text-white">
                  <Code className="w-3 h-3 mr-1" />
                  Developer
                </Badge>
              )}
              <Badge className="bg-yellow-600 text-white">
                <Crown className="w-3 h-3 mr-1" />
                Super Admin
              </Badge>
              {demoMode && (
                <Badge className="bg-blue-600 text-white ml-2">Demo</Badge>
              )}
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">
                  {new Date().toLocaleTimeString("pt-BR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 p-6 pb-20">{renderSectionContent()}</main>

        {/* Footer com botão Voltar para Doador */}
        <footer className="fixed bottom-0 left-64 right-0 bg-white border-t border-gray-200 p-4 shadow-lg">
          <div className="flex justify-center">
            <Button
              onClick={() => {
                // Marcar preferência para não ir automaticamente para admin
                sessionStorage.removeItem("preferAdminView");
                setLocation("/tdoador");
              }}
              variant="outline"
              className="flex items-center gap-2 bg-gradient-to-r from-yellow-400 to-red-500 text-white hover:from-yellow-500 hover:to-red-600 border-none"
            >
              <Heart className="w-4 h-4" />
              Voltar para Doador
            </Button>
          </div>
        </footer>
      </div>
    </div>
  );
}
