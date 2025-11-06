import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Logo from "@/components/logo";
import { 
  Menu,
  Home,
  FolderKanban,
  FileText,
  Package,
  LogOut,
  Building2,
  Users,
  MapPin,
  Heart,
  Download,
  ExternalLink,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { motion, AnimatePresence } from "framer-motion";

interface ImpactMetrics {
  vidasImpactadas: number;
  projetosApoiados: number;
  comunidadesAtendidas: number;
  voluntariosEngajados: number;
}

interface Projeto {
  id: number;
  nome: string;
  status: "Em andamento" | "Concluído";
  investimento: number;
}

interface ProgramaProgresso {
  nome: string;
  porcentagem: number;
  cor: string;
}

interface Historia {
  id: number;
  titulo: string;
  subtitulo: string;
  imagem: string;
}

interface PatrocinadorData {
  nomeEmpresa: string;
  logoUrl: string;
  impacto: ImpactMetrics;
  projetos: Projeto[];
  programas: ProgramaProgresso[];
}

const AnimatedCounter = ({ targetValue, delay = 0 }: { targetValue: number; delay?: number }) => {
  const [count, setCount] = useState(0);

  useState(() => {
    const timeout = setTimeout(() => {
      const duration = 1500;
      const steps = 60;
      const increment = targetValue / steps;
      let currentStep = 0;

      const timer = setInterval(() => {
        currentStep++;
        if (currentStep >= steps) {
          setCount(targetValue);
          clearInterval(timer);
        } else {
          setCount(Math.floor(increment * currentStep));
        }
      }, duration / steps);

      return () => clearInterval(timer);
    }, delay);

    return () => clearTimeout(timeout);
  });

  return <span>{count.toLocaleString('pt-BR')}</span>;
};

export default function PatrocinadorWelcome() {
  const [, setLocation] = useLocation();
  const [activeStory, setActiveStory] = useState(0);

  const userData = JSON.parse(localStorage.getItem("user") || "{}");

  const { data: historias = [] } = useQuery<Historia[]>({
    queryKey: ["/api/historias-inspiradoras"],
    select: (data: any[]) => data.map(h => ({
      id: h.id,
      titulo: h.titulo,
      subtitulo: h.subtitulo || "Conheça",
      imagem: h.imagem || ""
    }))
  });

  const { data: impactData } = useQuery<any>({
    queryKey: ['/api/gestao-vista/meta-realizado', { scope: 'annual', period: '2025' }],
  });

  const patrocinadorData: PatrocinadorData = {
    nomeEmpresa: userData.nome || "Empresa Patrocinadora",
    logoUrl: "/placeholder-logo.png",
    impacto: {
      vidasImpactadas: 1250,
      projetosApoiados: 4,
      comunidadesAtendidas: 3,
      voluntariosEngajados: 78
    },
    projetos: [
      {
        id: 1,
        nome: "Programa de Cultura e Esporte",
        status: "Em andamento",
        investimento: 25000
      },
      {
        id: 2,
        nome: "Inclusão Produtiva",
        status: "Concluído",
        investimento: 15000
      },
      {
        id: 3,
        nome: "Favela 3D",
        status: "Em andamento",
        investimento: 30000
      }
    ],
    programas: [
      { nome: "PROGRAMA DE CULTURA E ESPORTE", porcentagem: 90, cor: "#FFD700" },
      { nome: "INCLUSÃO PRODUTIVA", porcentagem: 70, cor: "#EF4444" },
      { nome: "FAVELA 3D", porcentagem: 65, cor: "#8B5CF6" },
      { nome: "MÉTODO GRITO", porcentagem: 45, cor: "#F97316" }
    ]
  };

  const handleLogout = () => {
    localStorage.clear();
    setLocation("/entrar");
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const nextStory = () => {
    setActiveStory((prev) => (prev + 1) % historias.length);
  };

  const prevStory = () => {
    setActiveStory((prev) => (prev - 1 + historias.length) % historias.length);
  };

  const MenuItems = ({ onItemClick }: { onItemClick?: () => void }) => (
    <nav className="space-y-1">
      <Button
        variant="ghost"
        className="w-full justify-start text-gray-700 hover:bg-gray-100"
        onClick={() => {
          onItemClick?.();
        }}
        data-testid="menu-inicio"
      >
        <Home className="w-5 h-5 mr-3" />
        Início
      </Button>
      <Button
        variant="ghost"
        className="w-full justify-start text-gray-700 hover:bg-gray-100"
        onClick={() => {
          onItemClick?.();
        }}
        data-testid="menu-projetos"
      >
        <FolderKanban className="w-5 h-5 mr-3" />
        Meus Projetos
      </Button>
      <Button
        variant="ghost"
        className="w-full justify-start text-gray-700 hover:bg-gray-100"
        onClick={() => {
          onItemClick?.();
        }}
        data-testid="menu-relatorios"
      >
        <FileText className="w-5 h-5 mr-3" />
        Relatórios
      </Button>
      <Button
        variant="ghost"
        className="w-full justify-start text-gray-700 hover:bg-gray-100"
        onClick={() => {
          onItemClick?.();
        }}
        data-testid="menu-recursos"
      >
        <Package className="w-5 h-5 mr-3" />
        Recursos
      </Button>
      <Button
        variant="ghost"
        className="w-full justify-start text-red-600 hover:bg-red-50"
        onClick={() => {
          handleLogout();
          onItemClick?.();
        }}
        data-testid="menu-sair"
      >
        <LogOut className="w-5 h-5 mr-3" />
        Sair
      </Button>
    </nav>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          {/* Menu Lateral Mobile */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden" data-testid="button-menu">
                <Menu className="w-6 h-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64">
              <div className="py-4">
                <MenuItems onItemClick={() => {}} />
              </div>
            </SheetContent>
          </Sheet>

          {/* Logo */}
          <div className="flex items-center space-x-3">
            <Logo size="md" />
          </div>

          {/* Perfil da Empresa */}
          <div className="flex items-center space-x-3 bg-gray-50 rounded-full px-4 py-2">
            <Building2 className="w-5 h-5 text-gray-600" />
            <span className="text-sm font-medium text-gray-900 hidden sm:inline">
              {patrocinadorData.nomeEmpresa}
            </span>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Menu Lateral Desktop */}
        <aside className="hidden md:block w-64 bg-white border-r border-gray-200 min-h-[calc(100vh-73px)] sticky top-[73px]">
          <div className="p-4">
            <MenuItems />
          </div>
        </aside>

        {/* Conteúdo Principal */}
        <main className="flex-1 max-w-6xl mx-auto px-4 py-8">
          {/* Banner de Impacto */}
          <div className="mb-8 relative h-48 rounded-3xl overflow-hidden bg-gradient-to-r from-purple-600 to-blue-600">
            <div className="absolute inset-0 flex items-center justify-center text-white text-center p-6">
              <div>
                <h1 className="text-3xl font-bold mb-2">
                  Olá {patrocinadorData.nomeEmpresa}!
                </h1>
                <p className="text-lg">Seu apoio transforma realidades!</p>
                <p className="text-sm mt-2 opacity-90">
                  Abaixo você encontra um resumo do impacto gerado pela sua parceria e os projetos que estamos construindo juntos.
                </p>
              </div>
            </div>
          </div>

          {/* Seu Impacto em Números */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900">
                Seu Impacto em Números
              </h2>
              <Button variant="outline" className="flex items-center space-x-2" data-testid="button-exportar">
                <Download className="w-4 h-4" />
                <span>Exportar para Planilhas</span>
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card data-testid="card-vidas">
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center text-center">
                    <Users className="w-12 h-12 text-blue-600 mb-3" />
                    <p className="text-sm text-gray-600 mb-1">Vidas Impactadas</p>
                    <p className="text-3xl font-bold text-blue-600">
                      <AnimatedCounter targetValue={patrocinadorData.impacto.vidasImpactadas} />
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card data-testid="card-projetos">
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center text-center">
                    <FolderKanban className="w-12 h-12 text-green-600 mb-3" />
                    <p className="text-sm text-gray-600 mb-1">Projetos Apoiados</p>
                    <p className="text-3xl font-bold text-green-600">
                      <AnimatedCounter targetValue={patrocinadorData.impacto.projetosApoiados} />
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card data-testid="card-comunidades">
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center text-center">
                    <MapPin className="w-12 h-12 text-purple-600 mb-3" />
                    <p className="text-sm text-gray-600 mb-1">Comunidades Atendidas</p>
                    <p className="text-3xl font-bold text-purple-600">
                      <AnimatedCounter targetValue={patrocinadorData.impacto.comunidadesAtendidas} />
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card data-testid="card-voluntarios">
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center text-center">
                    <Heart className="w-12 h-12 text-red-600 mb-3" />
                    <p className="text-sm text-gray-600 mb-1">Voluntários Engajados</p>
                    <p className="text-3xl font-bold text-red-600">
                      <AnimatedCounter targetValue={patrocinadorData.impacto.voluntariosEngajados} />
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Projetos que Você Apoia */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Projetos que Você Apoia
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {patrocinadorData.projetos.map((projeto) => (
                <Card key={projeto.id} className="hover:shadow-lg transition-shadow" data-testid={`card-projeto-${projeto.id}`}>
                  <CardContent className="pt-6">
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {projeto.nome}
                      </h3>
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                        projeto.status === "Em andamento" 
                          ? "bg-blue-100 text-blue-800"
                          : "bg-green-100 text-green-800"
                      }`}>
                        {projeto.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">Seu Investimento:</p>
                    <p className="text-2xl font-bold text-gray-900 mb-4">
                      {formatCurrency(projeto.investimento)}
                    </p>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      data-testid={`button-ver-detalhes-${projeto.id}`}
                    >
                      {projeto.status === "Concluído" ? "Ver Relatório Final" : "Ver Detalhes"}
                      <ExternalLink className="w-4 h-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Acompanhe o Progresso */}
          <div className="mb-8">
            <Card>
              <CardContent className="pt-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">
                  Com seu apoio, o impacto é imenso!
                </h2>
                <p className="text-gray-600 text-center mb-6">
                  Acompanhe o progresso dos programas que você apoia
                </p>

                <div className="space-y-6">
                  {patrocinadorData.programas.map((programa, index) => (
                    <div key={index}>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-700">
                          {programa.nome}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                        <motion.div
                          className="h-full rounded-full"
                          style={{ backgroundColor: programa.cor }}
                          initial={{ width: 0 }}
                          animate={{ width: `${programa.porcentagem}%` }}
                          transition={{ duration: 1, delay: index * 0.1 }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recursos e Contato */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Recursos e Contato
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardContent className="pt-6">
                  <FileText className="w-10 h-10 text-blue-600 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Relatórios de Impacto
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Faça o download dos relatórios mensais e anuais para acompanhar a prestação de contas.
                  </p>
                  <div className="space-y-2">
                    <Button variant="link" className="p-0 h-auto text-blue-600" data-testid="link-relatorio-q3">
                      <Download className="w-4 h-4 mr-2" />
                      Relatório de Impacto - Q3 2025
                    </Button>
                    <br />
                    <Button variant="link" className="p-0 h-auto text-blue-600" data-testid="link-relatorio-anual">
                      <Download className="w-4 h-4 mr-2" />
                      Relatório Anual - 2024
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <Package className="w-10 h-10 text-purple-600 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Kit de Mídia
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Acesse nosso kit com logos, fotos e materiais para divulgação da nossa parceria.
                  </p>
                  <Button variant="default" className="w-full" data-testid="button-kit-midia">
                    <Download className="w-4 h-4 mr-2" />
                    Baixar Kit de Mídia
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Histórias que Inspiram */}
          {historias.length > 0 && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Histórias que Inspiram
              </h2>

              <div className="relative">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeStory}
                    initial={{ opacity: 0, x: 100 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card className="overflow-hidden">
                      <div className="relative h-64 bg-gradient-to-br from-gray-800 to-gray-600">
                        {historias[activeStory]?.imagem && (
                          <img
                            src={historias[activeStory].imagem}
                            alt={historias[activeStory].titulo}
                            className="w-full h-full object-cover"
                          />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                          <p className="text-sm mb-2">{historias[activeStory]?.subtitulo}</p>
                          <h3 className="text-2xl font-bold">{historias[activeStory]?.titulo}</h3>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                </AnimatePresence>

                {/* Controles de Navegação */}
                {historias.length > 1 && (
                  <>
                    <button
                      onClick={prevStory}
                      className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 flex items-center justify-center shadow-lg hover:bg-white transition-colors"
                      data-testid="button-prev-historia"
                    >
                      <ChevronLeft className="w-6 h-6 text-gray-800" />
                    </button>
                    <button
                      onClick={nextStory}
                      className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 flex items-center justify-center shadow-lg hover:bg-white transition-colors"
                      data-testid="button-next-historia"
                    >
                      <ChevronRight className="w-6 h-6 text-gray-800" />
                    </button>

                    {/* Indicadores */}
                    <div className="flex justify-center mt-4 space-x-2">
                      {historias.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setActiveStory(index)}
                          className={`w-2 h-2 rounded-full transition-all ${
                            index === activeStory
                              ? "bg-purple-600 w-8"
                              : "bg-gray-300 hover:bg-gray-400"
                          }`}
                          data-testid={`indicator-historia-${index}`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
