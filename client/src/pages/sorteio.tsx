import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Logo from "@/components/logo";
import BottomNavigation from "@/components/bottom-navigation";
import {
  Trophy, Dice1, Clock
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

// Componente do Sistema de Sorteio
function SorteioSection() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showHistorico, setShowHistorico] = useState(false);

  // Buscar dados do usuário atual
  const userId = parseInt(localStorage.getItem("userId") || "0");

  // Query para sorteio ativo
  const { data: sorteioAtivo, isLoading: loadingSorteio } = useQuery({
    queryKey: ['sorteio-ativo'],
    queryFn: () => apiRequest('/api/sorteio/ativo'),
    retry: false,
  });

  // Query para status de participação do usuário
  const { data: statusParticipacao, isLoading: loadingStatus } = useQuery({
    queryKey: ['sorteio-status', sorteioAtivo?.id, userId],
    queryFn: () => apiRequest(`/api/sorteio/${sorteioAtivo.id}/usuario/${userId}`),
    enabled: !!sorteioAtivo?.id && !!userId && sorteioAtivo.id !== undefined,
    retry: false,
  });

  // Query para histórico de resultados
  const { data: historicoResultados, isLoading: loadingHistorico } = useQuery({
    queryKey: ['sorteio-resultados'],
    queryFn: () => apiRequest('/api/sorteio/resultados'),
    enabled: showHistorico,
    retry: false,
  });

  // Mutation para confirmar participação
  const participarMutation = useMutation({
    mutationFn: (data: { userId: number }) => {
      if (!sorteioAtivo?.id) {
        throw new Error("Nenhum sorteio ativo disponível");
      }
      return apiRequest(`/api/sorteio/${sorteioAtivo.id}/participar`, {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' }
      });
    },
    onSuccess: () => {
      toast({
        title: "Participação confirmada!",
        description: "Você está participando do sorteio atual.",
      });
      queryClient.invalidateQueries({ queryKey: ['sorteio-status'] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao participar",
        description: error.message || "Ocorreu um erro ao confirmar sua participação.",
        variant: "destructive",
      });
    },
  });

  const handleParticipar = () => {
    if (!userId) {
      toast({
        title: "Erro",
        description: "Usuário não identificado.",
        variant: "destructive",
      });
      return;
    }
    
    participarMutation.mutate({ userId });
  };

  const getPlanoColor = (plano: string) => {
    switch(plano) {
      case 'eco': return 'bg-green-50 text-green-700 border-green-200';
      case 'voz': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'grito': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'premium': return 'bg-gold-50 text-gold-700 border-gold-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  if (loadingSorteio) {
    return (
      <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 border-orange-200">
        <CardContent className="p-4 md:p-6">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!sorteioAtivo) {
    return (
      <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 border-orange-200">
        <CardContent className="p-4 md:p-6 text-center">
          <Dice1 className="w-12 h-12 mx-auto mb-4 text-orange-500" />
          <h2 className="text-lg font-bold text-gray-900 mb-2">
            Sorteio Clube do Grito
          </h2>
          <p className="text-gray-600 text-sm">
            Aguardando próximo sorteio mensal.
          </p>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowHistorico(!showHistorico)}
            className="mt-4"
          >
            Ver histórico de sorteios
          </Button>
          
          {showHistorico && (
            <div className="mt-4 p-3 bg-white rounded-lg border text-left">
              <h3 className="font-semibold text-sm mb-2">Histórico de Sorteios</h3>
              {loadingHistorico ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500 mx-auto"></div>
                </div>
              ) : historicoResultados && historicoResultados.length > 0 ? (
                <div className="space-y-2">
                  {historicoResultados.map((resultado: any) => (
                    <div key={resultado.id} className="text-xs p-2 bg-gray-50 rounded">
                      <div className="font-medium">{resultado.sorteio?.nome || "Sorteio"}</div>
                      <div className="text-gray-600">
                        {new Date(resultado.dataSorteio).toLocaleDateString('pt-BR')}
                      </div>
                      <div className="text-gray-600">{resultado.sorteio?.premio}</div>
                      <div className="text-green-600">Vencedor: {resultado.vencedor?.nome?.split(' ')[0] || "Não informado"}</div>
                      <div className="text-xs text-blue-600 mt-1">
                        <button className="underline hover:no-underline">
                          Saiba como o sorteio foi feito
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-xs">Nenhum sorteio realizado ainda.</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div style={{ backgroundColor: '#f5f5f5' }} className="rounded-lg p-4 md:p-6 border border-gray-400">
      <div className="space-y-4">
        {/* Título */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Trophy className="w-5 h-5 text-gray-700" />
            <h3 className="text-lg md:text-xl font-bold text-gray-900">Sorteio Clube do Grito</h3>
          </div>
          <p className="text-sm text-gray-600">{sorteioAtivo.nome}</p>
        </div>
        
        {/* Status de Elegibilidade */}
        <div className="mb-4">
          {statusParticipacao?.elegivel ? (
            <div className="bg-green-100 border border-green-300 rounded-lg p-3">
              <p className="text-green-800 font-bold text-sm md:text-base">
                ✅ Você está elegível para participar
              </p>
              <p className="text-green-700 text-xs md:text-sm mt-1">
                Sua assinatura está ativa e você tem {statusParticipacao.numeroChances} {statusParticipacao.numeroChances === 1 ? 'chance' : 'chances'} de ganhar
              </p>
            </div>
          ) : (
            <div className="bg-red-100 border border-red-300 rounded-lg p-3">
              <p className="text-red-800 font-bold text-sm md:text-base">
                ❌ Você não está elegível para participar
              </p>
              <p className="text-red-700 text-xs md:text-sm mt-1">
                {statusParticipacao?.motivoInelegibilidade || "Mantenha sua assinatura ativa para participar dos sorteios"}
              </p>
            </div>
          )}
        </div>
        
        {/* Informações do Sorteio */}
        <div className="grid grid-cols-1 gap-3 md:gap-4">
          {/* Prêmio */}
          <div className="bg-white rounded-lg p-3 border border-gray-400">
            <h5 className="font-bold text-gray-900 text-sm md:text-base mb-2">
              🎁 Prêmio
            </h5>
            <p className="text-gray-800 text-xs md:text-sm font-bold">
              {sorteioAtivo.premio}
            </p>
            {sorteioAtivo.valorPremio && (
              <p className="text-gray-600 text-xs md:text-sm mt-1">
                Valor: R$ {parseFloat(sorteioAtivo.valorPremio).toFixed(2).replace('.', ',')}
              </p>
            )}
          </div>

          {/* Data do Sorteio */}
          <div className="bg-white rounded-lg p-3 border border-gray-400">
            <h5 className="font-bold text-gray-900 text-sm md:text-base mb-2">
              📅 Data do Sorteio
            </h5>
            <p className="text-gray-700 text-xs md:text-sm">
              {sorteioAtivo.dataSorteio ? (() => {
                try {
                  const data = new Date(sorteioAtivo.dataSorteio);
                  return data.toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    timeZone: 'America/Sao_Paulo'
                  });
                } catch (error) {
                  console.error('Erro ao formatar data:', error, sorteioAtivo.dataSorteio);
                  return `${sorteioAtivo.dataSorteio}`;
                }
              })() : 'Data não informada'}
            </p>
          </div>
        </div>

        {/* Explicações sobre transparência e chances */}
        <div className="grid grid-cols-1 gap-3 md:gap-4">
          {/* Sistema Transparente */}
          <div className="bg-white rounded-lg p-3 border border-gray-400">
            <h5 className="font-bold text-gray-900 text-sm md:text-base mb-2">
              🔍 Sistema Transparente
            </h5>
            <p className="text-gray-700 text-xs md:text-sm leading-relaxed">
              O sorteio é realizado inteiramente pelo sistema de forma automática e transparente, 
              sem possibilidade de manipulação. Todos os resultados ficam registrados permanentemente.
            </p>
          </div>

          {/* Chances por Plano */}
          <div className="bg-white rounded-lg p-3 border border-gray-400">
            <h5 className="font-bold text-gray-900 text-sm md:text-base mb-2">
              💡 Planos Maiores = Mais Chances
            </h5>
            <div className="text-xs md:text-sm text-gray-700 space-y-1">
              <p>• <strong>Eco:</strong> 1 chance de ganhar</p>
              <p>• <strong>Voz:</strong> 2 chances de ganhar</p>
              <p>• <strong>O Grito:</strong> 3 chances de ganhar</p>
              <p>• <strong>Platinum:</strong> 5 chances de ganhar</p>
            </div>
          </div>
        </div>

        {/* Botão Histórico */}
        <div className="flex gap-2 pt-1 md:pt-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowHistorico(!showHistorico)}
            className="flex-1 border-gray-400 text-gray-700 hover:bg-gray-100 text-xs md:text-sm py-1 md:py-2"
          >
            <Clock className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
            {showHistorico ? 'Ocultar' : 'Ver'} Histórico
          </Button>
        </div>
      </div>

        {/* Modal de Histórico */}
        {showHistorico && (
          <div style={{ backgroundColor: '#f5f5f5' }} className="rounded-lg p-3 md:p-4 border border-gray-400 mt-3 md:mt-4">
            <h4 className="text-xs sm:text-sm md:text-base font-semibold text-gray-900 mb-2 md:mb-3">Resultados Anteriores</h4>
            {loadingHistorico ? (
              <div className="space-y-2">
                <div className="h-3 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-3 bg-gray-200 rounded animate-pulse w-3/4"></div>
              </div>
            ) : historicoResultados && historicoResultados.length > 0 ? (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {historicoResultados.map((resultado: any, index: number) => (
                  <div key={index} className="flex justify-between items-center p-2 bg-white rounded border border-gray-300">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{resultado.users?.nome || 'Vencedor'}</p>
                      <p className="text-xs text-gray-600">{resultado.premio}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">
                        {new Date(resultado.dataSorteio).toLocaleDateString('pt-BR')}
                      </p>
                      <span className={`px-1 py-0.5 text-xs rounded ${getPlanoColor(resultado.planoVencedor)}`}>
                        {resultado.planoVencedor?.toUpperCase()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-600">Nenhum resultado anterior encontrado.</p>
            )}
          </div>
        )}
    </div>
  );
}

export default function Sorteio() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 pb-20">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Logo size="md" />
            <div>
              <h1 className="text-lg font-bold text-black">Sorteio</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Sorteio Content */}
      <main className="max-w-md mx-auto px-4 py-6">
        <div className="space-y-4 md:space-y-6">
          <div className="text-center mb-4 md:mb-6">
            <Trophy className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-3 md:mb-4 text-green-600" />
            <h2 className="text-base sm:text-lg md:text-xl font-bold text-green-800 mb-2">Sorteio Clube do Grito</h2>
            <p className="text-xs sm:text-sm md:text-base text-green-600">Participe e concorra a prêmios incríveis</p>
          </div>
          <Card className="bg-white shadow-sm">
            <CardContent className="p-3 md:p-4">
              <SorteioSection />
            </CardContent>
          </Card>
        </div>
      </main>

      <BottomNavigation />
    </div>
  );
}