import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { motion } from 'framer-motion';
import { ArrowLeft, Target, CheckCircle, Clock, Gift, Star, Camera, RefreshCw, X, Share2, Link, Copy, Trophy, Users } from 'lucide-react';
import BottomNavigation from "@/components/bottom-navigation";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Logo from "@/components/logo";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { ImageUploader } from "@/components/ImageUploader";
import { FormularioEvidencia } from "@/components/FormularioEvidencia";
import type { EvidenceType } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import useActivityTracker from "@/hooks/useActivityTracker";
import { UserAvatar } from "@/components/UserAvatar";
import { useProfileImage } from "@/hooks/useProfileImage";
import { Capacitor } from '@capacitor/core';
import { Share } from '@capacitor/share';
import { Clipboard } from '@capacitor/clipboard';

interface MissaoSemanal {
  id: number;
  titulo: string;
  descricao: string;
  recompensaGritos: number;
  tipoMissao: string;
  evidenceType?: EvidenceType; // 🎯 Tipo de evidência exigida
  imagemUrl?: string;
  planoMinimo?: string;
  semanaInicio: string;
  semanaFim: string;
  ativo: boolean;
  concluida?: boolean;
  concluidaEm?: string;
  habilitarLinkCompartilhamento?: boolean;
  valorPagamento?: string; // 💳 Campo para missões de pagamento
  quantidadeAmigos?: number; // 🔗 Quantidade de amigos para missões de indicação
}

export default function MissoesSemanais() {
  const [, setLocation] = useLocation();
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [selectedMissionId, setSelectedMissionId] = useState<number | null>(null);
  const [photoUrl, setPhotoUrl] = useState('');
  
  // 🎯 NOVO SISTEMA DE EVIDÊNCIAS
  const [showEvidenciaModal, setShowEvidenciaModal] = useState(false);
  const [selectedMission, setSelectedMission] = useState<MissaoSemanal | null>(null);
  
  // 🔗 SISTEMA DE REFERRALS
  const [isGeneratingLink, setIsGeneratingLink] = useState<number | null>(null);
  const [isSharing, setIsSharing] = useState<number | null>(null);
  
  // 💳 SISTEMA DE PAGAMENTO DE MISSÕES
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPaymentMission, setSelectedPaymentMission] = useState<MissaoSemanal | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  
  const { toast } = useToast();

  // Ref e estado para carrossel de missões com drag
  const missoesCarouselRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!missoesCarouselRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - missoesCarouselRef.current.offsetLeft);
    setScrollLeft(missoesCarouselRef.current.scrollLeft);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !missoesCarouselRef.current) return;
    e.preventDefault();
    const x = e.pageX - missoesCarouselRef.current.offsetLeft;
    const walk = (x - startX) * 1.5;
    missoesCarouselRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  // Obter userId do localStorage diretamente
  const userId = localStorage.getItem("userId");
  console.log('🔍 [MISSÕES] userId do localStorage:', userId);
  
  // Sistema de rastreamento de atividade
  const userIdFromStorage = parseInt(userId || '0', 10);
  console.log('🔍 [MISSÕES] userIdFromStorage:', userIdFromStorage);
  const activityTracker = useActivityTracker({
    userId: userIdFromStorage,
    enableViewTracking: true,
    enableDurationTracking: true,
    minDurationMs: 3000, // Mínimo 3 segundos para considerar visualização de missão
  });

  // Rastreamento inicial da página de missões
  useEffect(() => {
    if (userIdFromStorage > 0) {
      activityTracker.trackClick('page', 'missoes-semanais', 'Página de Missões Semanais', 'navegacao', ['missoes', 'semanais', 'home']);
    }
  }, [activityTracker, userIdFromStorage]);

  // Buscar dados do usuário
  const { data: userData, isLoading: userLoading } = useQuery({
    queryKey: ["user", userId],
    queryFn: async () => {
      if (!userId) {
        return {
          nome: localStorage.getItem("userName") || "Usuário",
          gritos_atuais: 0,
          gritos_proximo_nivel: 300,
          nivel_atual: "Aliado do Grito",
          proximo_nivel: "Eco do Bem",
          plano: "eco",
          gritosTotal: 0,
          currentPlan: "eco"
        };
      }

      const [userResponse, planResponse, gritosResponse] = await Promise.all([
        fetch(`/api/users/${userId}`),
        fetch(`/api/users/${userId}/current-plan`),
        fetch(`/api/users/${userId}/gritos`)
      ]);

      const user = await userResponse.json();
      const planData = await planResponse.json();
      const gritosData = await gritosResponse.json();

      return {
        ...user,
        gritos_atuais: gritosData.gritosTotal || 0,
        gritos_proximo_nivel: 300,
        nivel_atual: gritosData.nivelAtual || "Aliado do Grito",
        proximo_nivel: "Eco do Bem",
        plano: planData.currentPlan || "eco",
        gritosTotal: gritosData.gritosTotal || 0,
        currentPlan: planData.currentPlan || "eco"
      };
    },
    enabled: !!userId,
  });

  // Buscar missões semanais - usando userId corretamente
  const { data: missoes = [], isLoading: missoesLoading, error: missoesError, refetch: refetchMissoes } = useQuery<MissaoSemanal[]>({
    queryKey: [`/api/missoes-semanais/${userId}`, userId],
    enabled: !!userId,
    retry: 2,
    refetchOnWindowFocus: false,
  });
  
  console.log('🔍 [MISSÕES] Query enabled:', !!userId);
  console.log('🔍 [MISSÕES] isLoading:', missoesLoading);
  console.log('🔍 [MISSÕES] error:', missoesError);
  console.log('🔍 [MISSÕES] missoes:', missoes);

  const isLoading = userLoading || missoesLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500 mx-auto"></div>
          <p className="mt-2 text-gray-600">Carregando missões...</p>
        </div>
      </div>
    );
  }

  // 🎯 NOVA FUNÇÃO: Detectar tipo de missão e abrir fluxo correto
  const handleConcluirMissao = async (missaoId: number) => {
    if (!userId) return;
    
    // Encontrar a missão selecionada
    const missao = missoes.find((m: MissaoSemanal) => m.id === missaoId);
    if (!missao) return;
    
    // Rastrear início de conclusão de missão
    activityTracker.trackClick(
      'missao',
      missao.id.toString(),
      missao.titulo,
      missao.tipoMissao,
      ['missoes', 'semanais', 'iniciar-conclusao']
    );
    
    // 💳 NOVO: Verificar se é missão de pagamento
    if (missao.tipoMissao === 'pagamento') {
      // Fluxo específico para missões de pagamento
      handleCompletarMissaoPagamento(missao);
    } else {
      // Fluxo normal para evidências
      setSelectedMission(missao);
      setShowEvidenciaModal(true);
    }
  };

  // 💳 NOVA FUNÇÃO: Completar missão de pagamento
  const handleCompletarMissaoPagamento = (missao: MissaoSemanal) => {
    setSelectedPaymentMission(missao);
    setShowPaymentModal(true);
  };

  // 💳 FUNÇÃO: Processar pagamento da missão
  const handleProcessarPagamento = async () => {
    if (!userId || !selectedPaymentMission) return;
    
    setIsProcessingPayment(true);
    
    try {
      // Iniciar pagamento usando cartão salvo do usuário
      const result = await apiRequest(`/api/missoes-semanais/${selectedPaymentMission.id}/iniciar-pagamento`, {
        method: "POST",
        body: JSON.stringify({ 
          userId,
          useDefaultPaymentMethod: true // Usar cartão já cadastrado
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (result.success) {
        toast({
          title: "✅ Pagamento realizado com sucesso!",
          description: `Missão completada! Você ganhou ${selectedPaymentMission.recompensaGritos} gritos.`,
        });
        
        setShowPaymentModal(false);
        setSelectedPaymentMission(null);
        refetchMissoes();
      } else {
        throw new Error(result.message || 'Erro no pagamento');
      }
    } catch (error: any) {
      toast({
        title: "❌ Erro no pagamento",
        description: error.message || "Não foi possível processar o pagamento. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // 🎯 FUNÇÃO PARA ENVIAR EVIDÊNCIA
  const handleSubmitEvidencia = async (evidenciaData: any) => {
    if (!userId || !selectedMission) return;
    
    try {
      const result = await apiRequest(`/api/missoes-semanais/${selectedMission.id}/enviar-evidencia`, {
        method: "POST",
        body: JSON.stringify({ 
          userId,
          evidenciaData,
          evidenceType: selectedMission.evidenceType || 'comentario'
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (result.success) {
        // Rastrear conclusão de missão
        activityTracker.trackComplete(
          'missao',
          selectedMission.id.toString(),
          selectedMission.titulo,
          selectedMission.tipoMissao,
          ['missoes', 'semanais', 'evidencia-concluida']
        );
        
        setShowEvidenciaModal(false);
        setSelectedMission(null);
        // Atualizar lista de missões
        refetchMissoes();
      }
    } catch (error) {
      console.error("Erro ao enviar evidência:", error);
      throw error;
    }
  };

  const handleSubmitPhoto = async () => {
    if (!userId || !selectedMissionId || !photoUrl) return;
    
    try {
      const result = await apiRequest(`/api/missoes-semanais/${selectedMissionId}/concluir-com-foto`, {
        method: "POST",
        body: JSON.stringify({ 
          userId, 
          fotoComprovante: photoUrl 
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (result.success) {
        // Fechar modal e limpar estado
        setShowPhotoModal(false);
        setSelectedMissionId(null);
        setPhotoUrl('');
        // Atualizar lista de missões
        window.location.reload();
      }
    } catch (error) {
      console.error("Erro ao enviar foto da missão:", error);
      alert("Erro ao enviar foto. Tente novamente.");
    }
  };

  // 🔗 FUNÇÃO SIMPLIFICADA - GERAR E COPIAR LINK DIRETO
  const handleGenerateReferralLink = async (missaoId: number) => {
    if (!userId) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado para gerar links de convite.",
        variant: "destructive",
      });
      return;
    }

    // Encontrar a missão para rastreamento
    const missao = missoes.find((m: MissaoSemanal) => m.id === missaoId);
    if (missao) {
      activityTracker.trackShare(
        'missao',
        missao.id.toString(),
        missao.titulo,
        missao.tipoMissao,
        ['missoes', 'semanais', 'compartilhamento']
      );
    }

    setIsGeneratingLink(missaoId);
    
    try {
      const result = await apiRequest(`/api/gerar-referral/${userId}/${missaoId}`, {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
   if (result.linkConvite) {
  const link = result.linkConvite as string;

  try {
    if (Capacitor.isNativePlatform()) {
      await Share.share({
        title: 'Clube do Grito',
        text: 'Entra pelo meu convite 👇',
        url: link,
        dialogTitle: 'Compartilhar convite',
      });

      toast({
        title: "Compartilhar aberto!",
        description: "Escolha por onde enviar o convite.",
      });
      return;
    }

    // Web
    if (navigator.share) {
      await navigator.share({
        title: 'Clube do Grito',
        text: 'Entra pelo meu convite 👇',
        url: link,
      });
      return;
    }

    await navigator.clipboard.writeText(link);
    toast({
      title: "Link copiado!",
      description: "Agora é só colar e mandar para seus amigos!",
    });

  } catch (e: any) {
    const msg = String(e?.message || e);
    if (msg.toLowerCase().includes('cancel')) return;

    try {
      await Clipboard.write({ string: link });
      toast({
        title: "Link copiado!",
        description: "Copiamos o link. Agora é só colar e mandar!",
      });
    } catch {
      toast({
        title: "Erro",
        description: "Não foi possível compartilhar agora.",
        variant: "destructive",
      });
    }
  }
}
    } finally {
      setIsGeneratingLink(null);
    }
  };

  // Função para formatar nome do plano
  const getPlanDisplayName = (plano: string) => {
    const planoMap: Record<string, string> = {
      'eco': 'Eco',
      'voz': 'Voz',
      'grito': 'Grito',
      'platinum': 'Platinum',
      'diamante': 'Diamante'
    };
    return planoMap[plano.toLowerCase()] || 'Eco';
  };

  return (
    <div className="min-h-screen bg-white pb-20 font-inter">
      {/* Header */}
      <header className="bg-white">
        <div className="px-4 py-3 flex items-center">
          {/* Elemento da Esquerda: Botão Voltar */}
          <div className="w-16 flex justify-start">
            <button 
              className="flex items-center justify-center p-2"
              onClick={() => setLocation("/beneficios")}
              aria-label="Voltar"
            >
              <ArrowLeft className="w-6 h-6 text-gray-700" />
            </button>
          </div>
          
          {/* Elemento Central: Logo */}
          <div className="flex-1 flex justify-center">
            <Logo size="md" />
          </div>
          
          {/* Elemento da Direita: Perfil do Usuário */}
          <div className="w-16 flex justify-end">
            <div className="flex flex-col items-center relative">
              {/* Foto de Perfil Circular */}
              <UserAvatar 
                size="md" 
                className="border-2 border-gray-200 mb-1"
                onClick={() => setLocation("/dados-cadastrais")}
              />
              
              {/* Badge do Plano */}
              <div className="bg-gray-100 text-gray-700 text-xs font-medium px-2 py-1 rounded-full flex items-center space-x-1">
                <span>{userData?.plano ? getPlanDisplayName(userData.plano) : "Eco"}</span>
                <span className="text-orange-500">◆</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <div className="max-w-md mx-auto px-5 pb-6">
        
        {/* Título da seção */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Missões da Semana</h1>
          <p className="text-gray-600">Complete as missões e ganhe Gritos extras!</p>
        </div>


        {/* Barra de Progresso de Gritos */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-6"
        >
          <div className="bg-white p-4 rounded-2xl shadow-lg border border-gray-100">
            <div className="text-center mb-3">
              <h3 className="text-lg font-semibold text-gray-800">
                {(() => {
                  const gritosAtuais = userData?.gritosTotal || 0;
                  // Níveis baseados na nova estrutura
                  const niveis = [
                    { nome: "Aliado do Grito", gritos: 2500 },
                    { nome: "Eco do Bem", gritos: 10000 },
                    { nome: "Voz da Mudança", gritos: 30000 },
                    { nome: "Grito Poderoso", gritos: 75000 },
                    { nome: "Líder Transformador", gritos: 150000 }
                  ];
                  
                  const proximoNivel = niveis.find(nivel => gritosAtuais < nivel.gritos);
                  
                  if (!proximoNivel) {
                    return `Parabéns! Você atingiu o nível máximo com ${gritosAtuais} Gritos`;
                  }
                  
                  const gritosRestantes = proximoNivel.gritos - gritosAtuais;
                  return `Faltam ${gritosRestantes} gritos para o próximo nível`;
                })()}
              </h3>
            </div>
            
            <div className="relative w-full bg-black rounded-full h-8 overflow-hidden">
              <div 
                className="absolute left-0 top-0 h-full bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full transition-all duration-500 ease-out"
                style={{ 
                  width: `${(() => {
                    const gritosAtuais = userData?.gritosTotal || 0;
                    const niveis = [
                      { gritos: 2500 },
                      { gritos: 10000 },
                      { gritos: 30000 },
                      { gritos: 75000 },
                      { gritos: 150000 }
                    ];
                    
                    const proximoNivel = niveis.find(nivel => gritosAtuais < nivel.gritos);
                    if (!proximoNivel) return 100;
                    
                    const nivelAnterior = niveis[niveis.indexOf(proximoNivel) - 1] || { gritos: 0 };
                    const progressoNivel = gritosAtuais - nivelAnterior.gritos;
                    const totalNivel = proximoNivel.gritos - nivelAnterior.gritos;
                    
                    return Math.min((progressoNivel / totalNivel) * 100, 100);
                  })()}%` 
                }}
              />
              
              {/* Texto dos gritos atuais */}
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white font-bold text-sm">
                {userData?.gritosTotal || 0}
              </div>
              
              {/* Texto da meta */}
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white font-bold text-sm">
                {(() => {
                  const gritosAtuais = userData?.gritosTotal || 0;
                  const niveis = [{ gritos: 2500 }, { gritos: 10000 }, { gritos: 30000 }, { gritos: 75000 }, { gritos: 150000 }];
                  const proximoNivel = niveis.find(nivel => gritosAtuais < nivel.gritos);
                  return proximoNivel ? proximoNivel.gritos : gritosAtuais;
                })()}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Carrossel Horizontal de Missões */}
        <div 
          ref={missoesCarouselRef}
          className={`overflow-x-auto scrollbar-hide md:scrollbar-default -mx-5 px-5 md:mx-0 md:px-0 ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          style={{ userSelect: isDragging ? 'none' : 'auto' }}
        >
          {missoesError ? (
            <div className="text-center py-12">
              <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Target className="w-8 h-8 text-red-500" />
                </div>
                <h3 className="text-lg font-semibold text-red-700 mb-2">
                  Erro ao carregar missões
                </h3>
                <p className="text-red-600 mb-4">
                  Não foi possível carregar suas missões semanais. Verifique sua conexão e tente novamente.
                </p>
                <Button
                  onClick={() => refetchMissoes()}
                  className="bg-red-500 hover:bg-red-600 text-white"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Tentar novamente
                </Button>
              </div>
            </div>
          ) : Array.isArray(missoes) && missoes.length > 0 ? (
            <div className="flex space-x-4 pb-4" style={{ width: 'fit-content' }}>
              {missoes.map((missao: MissaoSemanal) => {
              const getPlanColor = (plano: string) => {
                const colors = {
                  'eco': 'bg-yellow-400',
                  'voz': 'bg-blue-500', 
                  'grito': 'bg-orange-500',
                  'platinum': 'bg-purple-500',
                  'diamante': 'bg-pink-500'
                };
                return colors[plano as keyof typeof colors] || colors.eco;
              };

              const getPlanLabel = (plano: string) => {
                const labels = {
                  'eco': 'ECO',
                  'voz': 'VOZ',
                  'grito': 'GRITO',
                  'platinum': 'PLATINUM',
                  'diamante': 'DIAMANTE'
                };
                return labels[plano as keyof typeof labels] || 'ECO';
              };

              return (
                <div
                  key={missao.id}
                  className={`flex-shrink-0 w-64 h-64 relative isolate ${getPlanColor(missao.planoMinimo || 'eco')} rounded-2xl shadow-lg overflow-hidden cursor-pointer hover:shadow-xl transition-shadow duration-300`}
                >
                  {/* Status de Conclusão ou Badge de Gritos */}
                  {missao.concluida ? (
                    <div className="absolute top-2 right-2 z-10">
                      <div className="bg-green-500 rounded-full p-1.5 shadow-lg">
                        <CheckCircle className="w-4 h-4 text-white" />
                      </div>
                    </div>
                  ) : (
                    <div className="absolute top-2 right-2 z-10">
                      <div className="flex items-center bg-yellow-100 rounded-full px-2 py-1 shadow-sm">
                        <Star className="w-3 h-3 text-yellow-600 mr-1" />
                        <span className="text-xs font-bold text-yellow-800">
                          {missao.recompensaGritos}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Conteúdo do Card - Centralizado */}
                  <div className="h-full flex flex-col items-center justify-center p-4">
                    {/* Ícone de Missão */}
                    <div className="mb-3">
                      <Target className="w-10 h-10 text-white/80" />
                    </div>
                    
                    {/* Área de texto com fundo branco */}
                    <div className="bg-white rounded-xl p-3 w-full">
                      <h3 className="font-bold text-gray-900 text-center text-sm leading-tight mb-1">
                        {missao.titulo}
                      </h3>
                      
                      <p className="text-xs text-gray-600 text-center leading-relaxed line-clamp-2">
                        {missao.descricao}
                      </p>
                      
                      {/* Data limite dentro da área branca */}
                      {!missao.concluida && (
                        <div className="flex items-center justify-center text-[10px] text-gray-500 mt-2">
                          <Clock className="w-2.5 h-2.5 mr-1" />
                          <span>
                            Até {new Date(missao.semanaFim).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    {/* Botões abaixo da área branca */}
                    <div className="mt-2 flex flex-col items-center gap-1.5 w-full">
                      {/* Botão de Referral */}
                      {missao.habilitarLinkCompartilhamento && (
                        <Button
                          onClick={() => handleGenerateReferralLink(missao.id)}
                          disabled={isGeneratingLink === missao.id || isSharing === missao.id}
                          className="bg-blue-500 hover:bg-blue-600 text-white font-bold px-3 py-1.5 rounded-lg text-[10px] shadow-md flex items-center gap-1 w-full"
                          size="sm"
                        >
                          {isGeneratingLink === missao.id ? (
                            <>
                              <div className="animate-spin rounded-full h-2.5 w-2.5 border-b-2 border-white"></div>
                              <span>Gerando...</span>
                            </>
                          ) : isSharing === missao.id ? (
                            <>
                              <Share2 className="w-2.5 h-2.5" />
                              <span>Compartilhando...</span>
                            </>
                          ) : (
                            <>
                              <Share2 className="w-2.5 h-2.5" />
                              <span>Compartilhar</span>
                            </>
                          )}
                        </Button>
                      )}
                      
                      {/* Botão Principal */}
                      {(() => {
                        // Tipos de missão que são automáticas (sem botão Concluir)
                        const tipo = missao.tipoMissao || '';
                        const isCheckinMission = ['checkin_semanal', 'checkin_diario', 'check_in_consecutivo'].includes(tipo) ||
                          tipo.includes('checkin') || tipo.includes('check_in');
                        const isReferralMission = tipo === 'referral' || 
                          tipo.startsWith('indicacao') || 
                          tipo.startsWith('bonus_indicacao') ||
                          tipo.includes('convid') ||
                          missao.habilitarLinkCompartilhamento === true;
                        const isAutomatic = isCheckinMission || isReferralMission || 
                          missao.evidenceType === 'link' || missao.evidenceType === 'automatico';
                        
                        if (missao.concluida) {
                          return (
                            <div className="flex items-center text-black text-xs font-bold">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              <span>Concluída!</span>
                            </div>
                          );
                        } else if (missao.evidenceType === 'link') {
                          return (
                            <Button
                              onClick={() => handleConcluirMissao(missao.id)}
                              className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-3 py-1.5 rounded-lg text-[10px] shadow-md w-full"
                              size="sm"
                              data-testid={`button-compartilhar-${missao.id}`}
                            >
                              <Users className="w-3 h-3 mr-1" />
                              Convidar Amigo
                            </Button>
                          );
                        } else if (isAutomatic) {
                          return (
                            <div className="flex items-center text-white/70 text-[10px] font-medium">
                              <Clock className="w-3 h-3 mr-1" />
                              <span>Automática</span>
                            </div>
                          );
                        } else {
                          return (
                            <Button
                              onClick={() => handleConcluirMissao(missao.id)}
                              className="bg-green-600 hover:bg-green-700 text-white font-bold px-3 py-1.5 rounded-lg text-[10px] shadow-md w-full"
                              size="sm"
                              data-testid={`button-concluir-${missao.id}`}
                            >
                              Concluir
                            </Button>
                          );
                        }
                      })()}
                    </div>
                  </div>
                </div>
              );
            })}
            </div>
          ) : !isLoading ? (
            <div className="text-center py-12">
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Target className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  Nenhuma missão disponível
                </h3>
                <p className="text-gray-500 mb-4">
                  Novas missões serão liberadas em breve!
                </p>
                <Button
                  onClick={() => refetchMissoes()}
                  variant="outline"
                  className="border-gray-300 text-gray-700 hover:bg-gray-100"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Atualizar
                </Button>
              </div>
            </div>
          ) : null}
        </div>

        {/* Seção de Selos - Jornada do Seu Grito */}
        <div className="mt-8">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-6">
            Jornada do Seu Grito
          </h2>
          
          {/* Carrossel horizontal de níveis - igual ao benefícios */}
          <div className="overflow-x-auto scrollbar-hide">
            <div className="flex" style={{ width: 'fit-content' }}>
              {[
                {
                  id: 1,
                  nome: "Aliado do Grito",
                  gritos: 0,
                  imagem: "attached_assets/image_1756491369207.png"
                },
                {
                  id: 2,
                  nome: "Eco do Bem", 
                  gritos: 300,
                  imagem: "attached_assets/image_1756491440300.png"
                },
                {
                  id: 3,
                  nome: "Voz Ativa",
                  gritos: 600, 
                  imagem: "attached_assets/image_1756491479690.png"
                },
                {
                  id: 4,
                  nome: "Transformador",
                  gritos: 1000,
                  imagem: "attached_assets/image_1756491507581.png"
                },
                {
                  id: 5,
                  nome: "Guerreiro do Grito",
                  gritos: 1500,
                  imagem: "attached_assets/image_1756491533634.png"
                }
              ].map((nivel, index) => {
                const gritosUsuario = userData?.gritosTotal || 0;
                const isAtingido = gritosUsuario >= nivel.gritos;
                const isBloqueado = !isAtingido;
                
                return (
                  <motion.div 
                    key={nivel.id}
                    className="flex-shrink-0 w-64 h-80 relative -mr-12"
                    whileHover={{ scale: 1.02 }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    {/* Imagem completa como fundo do card - igual aos benefícios */}
                    <div 
                      className={`w-full h-full bg-cover bg-center bg-no-repeat ${
                        isBloqueado ? 'filter grayscale opacity-60' : ''
                      }`}
                      style={{ 
                        backgroundImage: `url(${nivel.imagem})`,
                        backgroundSize: 'contain'
                      }}
                    />
                  </motion.div>
                );
              })}
            </div>
          </div>
          
          {/* Progress indicator */}
          <div className="flex justify-center mt-4 space-x-2">
            {[1, 2, 3, 4, 5].map((dot, index) => {
              const gritosUsuario = userData?.gritosTotal || 0;
              const isActive = index === 0 && gritosUsuario < 300 || 
                             index === 1 && gritosUsuario >= 300 && gritosUsuario < 600 ||
                             index === 2 && gritosUsuario >= 600 && gritosUsuario < 1000 ||
                             index === 3 && gritosUsuario >= 1000 && gritosUsuario < 1500 ||
                             index === 4 && gritosUsuario >= 1500;
              
              return (
                <div
                  key={dot}
                  className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                    isActive ? 'bg-yellow-500' : 'bg-gray-300'
                  }`}
                />
              );
            })}
          </div>
        </div>

        {/* Card informativo sobre missões */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mt-6">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Target className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h4 className="font-semibold text-blue-900 mb-1">Como funciona?</h4>
              <p className="text-sm text-blue-700">
                Complete as missões da semana para ganhar Gritos extras e acelerar sua jornada no Clube do Grito!
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Upload de Foto */}
      {showPhotoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            className="bg-white rounded-xl max-w-md w-full p-6"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Enviar Foto da Missão
              </h3>
              <button
                onClick={() => setShowPhotoModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              Envie uma foto comprovando a conclusão da sua missão para ganhar os Gritos!
            </p>

            <div className="mb-4">
              <ImageUploader
                label="Foto da Missão"
                value={photoUrl}
                onChange={setPhotoUrl}
                size="até 5MB"
                required
              />
            </div>

            {/* Seleção da Missão */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Selecione a missão:
              </label>
              <select
                value={selectedMissionId || ''}
                onChange={(e) => setSelectedMissionId(Number(e.target.value))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              >
                <option value="">Escolha uma missão...</option>
                {Array.isArray(missoes) && missoes
                  .filter((missao: MissaoSemanal) => !missao.concluida)
                  .map((missao: MissaoSemanal) => (
                    <option key={missao.id} value={missao.id}>
                      {missao.titulo} (+{missao.recompensaGritos} Gritos)
                    </option>
                  ))
                }
              </select>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => setShowPhotoModal(false)}
                variant="outline"
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSubmitPhoto}
                disabled={!photoUrl || !selectedMissionId}
                className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-black"
              >
                Enviar Foto
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      {/* 🎯 MODAL DO FORMULÁRIO DE EVIDÊNCIA */}
      {showEvidenciaModal && selectedMission && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-2xl w-full max-w-md mx-4 max-h-[90vh] overflow-hidden shadow-2xl"
          >
            {/* Header do Modal */}
            <div className="bg-gradient-to-r from-yellow-400 to-orange-500 p-4 text-black">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-lg">{selectedMission.titulo}</h3>
                  <p className="text-sm opacity-90">Envie sua evidência</p>
                </div>
                <button
                  onClick={() => {
                    setShowEvidenciaModal(false);
                    setSelectedMission(null);
                  }}
                  className="p-1 hover:bg-black/10 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Conteúdo do Modal */}
            <div className="p-4 overflow-y-auto max-h-[70vh]">
              <FormularioEvidencia
                evidenceType={selectedMission.evidenceType as EvidenceType || 'comentario'}
                missaoTitulo={selectedMission.titulo}
                missaoDescricao={selectedMission.descricao}
                missaoId={selectedMission.id}
                userId={userId || undefined}
                configuracoes={{
                  referralsNecessarios: selectedMission.quantidadeAmigos || 1, // Usa valor da missão ou 1 como padrão
                }}
                onSubmit={handleSubmitEvidencia}
                isLoading={false}
              />
            </div>
          </motion.div>
        </div>
      )}

      {/* 💳 MODAL DE PAGAMENTO PARA MISSÕES */}
      {showPaymentModal && selectedPaymentMission && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-2xl w-full max-w-md mx-4 max-h-[90vh] overflow-hidden shadow-2xl"
          >
            {/* Header do Modal */}
            <div className="bg-gradient-to-r from-green-400 to-emerald-500 p-4 text-white">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold">💳 Completar Missão</h3>
                <button
                  onClick={() => {
                    setShowPaymentModal(false);
                    setSelectedPaymentMission(null);
                  }}
                  className="text-white hover:text-gray-200 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <p className="text-sm text-white/90 mt-1">
                {selectedPaymentMission.titulo}
              </p>
            </div>

            {/* Conteúdo do Modal */}
            <div className="p-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Gift className="w-8 h-8 text-green-600" />
                </div>
                
                <h4 className="text-xl font-bold text-gray-900 mb-2">
                  {selectedPaymentMission.titulo}
                </h4>
                
                <p className="text-gray-600 mb-4">
                  {selectedPaymentMission.descricao}
                </p>

                <div className="bg-green-50 p-4 rounded-xl mb-4">
                  <div className="text-2xl font-bold text-green-700 mb-1">
                    R$ {(selectedPaymentMission as any).valorPagamento || '10,00'}
                  </div>
                  <div className="text-sm text-green-600">
                    Será debitado do seu cartão cadastrado
                  </div>
                </div>

                <div className="bg-yellow-50 p-4 rounded-xl mb-6">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Trophy className="w-5 h-5 text-yellow-600" />
                    <span className="font-semibold text-yellow-800">
                      Recompensa: {selectedPaymentMission.recompensaGritos} Gritos
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowPaymentModal(false);
                    setSelectedPaymentMission(null);
                  }}
                  className="flex-1"
                  disabled={isProcessingPayment}
                >
                  Cancelar
                </Button>
                
                <Button
                  onClick={handleProcessarPagamento}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                  disabled={isProcessingPayment}
                >
                  {isProcessingPayment ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    'Confirmar Pagamento'
                  )}
                </Button>
              </div>

              <p className="text-xs text-gray-500 text-center mt-4">
                🔒 Pagamento seguro processado via Stripe
              </p>
            </div>
          </motion.div>
        </div>
      )}

      {/* Navigation */}
      <BottomNavigation />
    </div>
  );
}