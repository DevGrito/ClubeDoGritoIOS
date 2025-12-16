import { useState } from "react";
import { Target, CheckCircle, Clock, Star, Share2, Users, RefreshCw } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { EvidenceType } from "@shared/schema";

interface MissaoSemanal {
  id: number;
  titulo: string;
  descricao: string;
  recompensaGritos: number;
  tipoMissao: string;
  evidenceType?: EvidenceType;
  imagemUrl?: string;
  planoMinimo?: string;
  semanaInicio: string;
  semanaFim: string;
  ativo: boolean;
  concluida?: boolean;
  concluidaEm?: string;
  habilitarLinkCompartilhamento?: boolean;
  valorPagamento?: string;
}

interface MissoesCarouselProps {
  userId: string | null;
  onConcluirMissao?: (missaoId: number) => void;
}

export function MissoesCarousel({ userId, onConcluirMissao }: MissoesCarouselProps) {
  const { toast } = useToast();
  const [isGeneratingLink, setIsGeneratingLink] = useState<number | null>(null);

  // Buscar missões semanais
  const { data: missoes = [], isLoading: missoesLoading, error: missoesError, refetch: refetchMissoes } = useQuery<MissaoSemanal[]>({
    queryKey: [`/api/missoes-semanais/${userId}`, userId],
    enabled: !!userId,
    retry: 2,
    refetchOnWindowFocus: false,
  });

  const handleGenerateReferralLink = async (missaoId: number) => {
    if (!userId) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado para gerar links de convite.",
        variant: "destructive",
      });
      return;
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
        await navigator.clipboard.writeText(result.linkConvite);
        
        toast({
          title: "Link copiado!",
          description: "O link foi copiado para a área de transferência. Compartilhe com seus amigos!",
        });
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível gerar o link. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingLink(null);
    }
  };

  const handleConcluirMissao = (missaoId: number) => {
    if (onConcluirMissao) {
      onConcluirMissao(missaoId);
    }
  };

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

  if (missoesLoading) {
    return (
      <div className="text-center py-6">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-yellow-500 mx-auto"></div>
        <p className="mt-2 text-sm text-gray-600">Carregando missões...</p>
      </div>
    );
  }

  if (missoesError) {
    return (
      <div className="text-center py-6">
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-sm text-red-600 mb-2">Erro ao carregar missões</p>
          <Button
            onClick={() => refetchMissoes()}
            className="bg-red-500 hover:bg-red-600 text-white text-xs"
            size="sm"
          >
            <RefreshCw className="w-3 h-3 mr-1" />
            Tentar novamente
          </Button>
        </div>
      </div>
    );
  }

  if (!Array.isArray(missoes) || missoes.length === 0) {
    return (
      <div className="text-center py-6">
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
          <Target className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-600">Nenhuma missão disponível no momento</p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto scrollbar-hide -mx-4 px-4">
      <div className="flex space-x-4 pb-4" style={{ width: 'fit-content' }}>
        {missoes.map((missao: MissaoSemanal) => (
          <div
            key={missao.id}
            className={`flex-shrink-0 w-64 h-64 relative isolate ${getPlanColor(missao.planoMinimo || 'eco')} rounded-2xl shadow-lg overflow-hidden cursor-pointer hover:shadow-xl transition-shadow duration-300 ${
              missao.concluida ? 'opacity-75' : ''
            }`}
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
                    disabled={isGeneratingLink === missao.id}
                    className="bg-blue-500 hover:bg-blue-600 text-white font-bold px-3 py-1.5 rounded-lg text-[10px] shadow-md flex items-center gap-1 w-full"
                    size="sm"
                    data-testid={`button-compartilhar-${missao.id}`}
                  >
                    {isGeneratingLink === missao.id ? (
                      <>
                        <div className="animate-spin rounded-full h-2.5 w-2.5 border-b-2 border-white"></div>
                        <span>Gerando...</span>
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
                {missao.concluida ? (
                  <div className="flex items-center text-green-400 text-xs font-bold">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    <span>Concluída!</span>
                  </div>
                ) : missao.evidenceType === 'link' || missao.evidenceType === 'automatico' ? (
                  <div className="flex items-center text-white/70 text-[10px] font-medium">
                    <Users className="w-3 h-3 mr-1" />
                    <span>Automática</span>
                  </div>
                ) : (
                  <Button
                    onClick={() => handleConcluirMissao(missao.id)}
                    className="bg-green-600 hover:bg-green-700 text-white font-bold px-3 py-1.5 rounded-lg text-[10px] shadow-md w-full"
                    size="sm"
                    data-testid={`button-concluir-${missao.id}`}
                  >
                    Concluir
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
