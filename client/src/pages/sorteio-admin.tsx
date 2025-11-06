import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ArrowLeft, Users, Trophy, Dice6, Clock, Play, CheckCircle, AlertTriangle } from "lucide-react";
import { useLocation } from "wouter";
import Logo from "@/components/logo";

export default function SorteioAdmin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showDetails, setShowDetails] = useState(false);
  const [sorteioPendente, setSorteioPendente] = useState(false);

  // Query para sorteio ativo
  const { data: sorteioAtivo, isLoading: loadingSorteio } = useQuery({
    queryKey: ['sorteio-ativo'],
    queryFn: () => apiRequest('/api/sorteio/ativo'),
    retry: false,
  });

  // Query para participações do sorteio ativo
  const { data: participacoes, isLoading: loadingParticipacoes } = useQuery({
    queryKey: ['sorteio-participacoes', sorteioAtivo?.id],
    queryFn: () => apiRequest(`/api/sorteio/${sorteioAtivo.id}/participacoes`),
    enabled: !!sorteioAtivo?.id,
  });

  // Mutation para realizar o sorteio
  const realizarSorteioMutation = useMutation({
    mutationFn: () => 
      apiRequest(`/api/sorteio/${sorteioAtivo.id}/realizar`, {
        method: 'POST',
        body: JSON.stringify({ metodo: 'automatico' }),
        headers: { 'Content-Type': 'application/json' }
      }),
    onSuccess: (resultado) => {
      setSorteioPendente(false);
      toast({
        title: "Sorteio Realizado com Sucesso!",
        description: `Vencedor: ${resultado.resultado.vencedor}`,
      });
      queryClient.invalidateQueries({ queryKey: ['sorteio-ativo'] });
      queryClient.invalidateQueries({ queryKey: ['sorteio-resultados'] });
    },
    onError: (error: any) => {
      setSorteioPendente(false);
      toast({
        title: "Erro ao realizar sorteio",
        description: error.message || "Ocorreu um erro ao realizar o sorteio.",
        variant: "destructive",
      });
    },
  });

  const handleRealizarSorteio = () => {
    if (!sorteioAtivo) return;
    
    const confirmacao = window.confirm(
      `Confirma a realização do sorteio "${sorteioAtivo.nome}"?\n\nEsta ação não pode ser desfeita!`
    );
    
    if (confirmacao) {
      setSorteioPendente(true);
      realizarSorteioMutation.mutate();
    }
  };

  if (loadingSorteio) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Logo size="lg" className="mx-auto mb-4" />
          <p className="text-gray-600">Carregando administração do sorteio...</p>
        </div>
      </div>
    );
  }

  if (!sorteioAtivo) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm border-b border-gray-100">
          <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                onClick={() => setLocation("/welcome")}
                className="mr-2"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <Logo size="md" />
              <div>
                <h1 className="text-lg font-bold text-black">Administração do Sorteio</h1>
                <p className="text-sm text-gray-600">Clube do Grito</p>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 py-8">
          <Card className="text-center">
            <CardContent className="py-12">
              <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                Nenhum Sorteio Ativo
              </h2>
              <p className="text-gray-600">
                Não há sorteios ativos no momento para administrar.
              </p>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  const totalParticipantes = participacoes?.length || 0;
  const totalChances = participacoes?.reduce((sum: number, p: any) => sum + p.numeroChances, 0) || 0;
  const sorteioJaRealizado = sorteioAtivo.status === 'finalizado';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              onClick={() => setLocation("/welcome")}
              className="mr-2"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <Logo size="md" />
            <div>
              <h1 className="text-lg font-bold text-black">Administração do Sorteio</h1>
              <p className="text-sm text-gray-600">Clube do Grito</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        
        {/* Informações do Sorteio */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Trophy className="w-6 h-6 text-yellow-600" />
              {sorteioAtivo.nome}
              <Badge variant={sorteioJaRealizado ? "secondary" : "default"}>
                {sorteioJaRealizado ? "Finalizado" : "Ativo"}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <Trophy className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                <h3 className="font-semibold text-blue-900">Prêmio</h3>
                <p className="text-sm text-blue-700">{sorteioAtivo.premio}</p>
                {sorteioAtivo.valorPremio && (
                  <p className="text-xs text-blue-600">R$ {parseFloat(sorteioAtivo.valorPremio).toFixed(2).replace('.', ',')}</p>
                )}
              </div>
              
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <Users className="w-8 h-8 mx-auto mb-2 text-green-600" />
                <h3 className="font-semibold text-green-900">Participantes</h3>
                <p className="text-2xl font-bold text-green-700">{totalParticipantes}</p>
              </div>
              
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <Dice6 className="w-8 h-8 mx-auto mb-2 text-purple-600" />
                <h3 className="font-semibold text-purple-900">Total de Chances</h3>
                <p className="text-2xl font-bold text-purple-700">{totalChances}</p>
              </div>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center gap-2 text-gray-600">
                <Clock className="w-4 h-4" />
                <span className="text-sm">
                  Data do sorteio: {new Date(sorteioAtivo.dataSorteio).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Participantes */}
        {loadingParticipacoes ? (
          <Card>
            <CardContent className="p-6">
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
              </div>
            </CardContent>
          </Card>
        ) : participacoes && participacoes.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Participantes Confirmados</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDetails(!showDetails)}
                >
                  {showDetails ? "Ocultar" : "Ver"} Detalhes
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {participacoes.map((participacao: any) => (
                  <div key={participacao.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-700 font-semibold">
                          {participacao.nome?.charAt(0).toUpperCase() || 'U'}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{participacao.nome || `Usuário ${participacao.userId}`}</p>
                        {showDetails && (
                          <p className="text-xs text-gray-500">ID: {participacao.userId}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className="mb-1">
                        Plano {participacao.planoAtual?.toUpperCase()}
                      </Badge>
                      <p className="text-sm font-semibold text-gray-700">
                        {participacao.numeroChances} {participacao.numeroChances === 1 ? 'chance' : 'chances'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="text-center py-8">
              <Users className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum Participante</h3>
              <p className="text-gray-500">Ainda não há participações confirmadas neste sorteio.</p>
            </CardContent>
          </Card>
        )}

        {/* Botão de Realizar Sorteio */}
        {!sorteioJaRealizado && totalParticipantes > 0 && (
          <Card className="border-2 border-yellow-200 bg-gradient-to-r from-yellow-50 to-orange-50">
            <CardContent className="p-6 text-center space-y-4">
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-gray-900">Pronto para Sortear!</h3>
                <p className="text-gray-600">
                  {totalParticipantes} {totalParticipantes === 1 ? 'pessoa confirmada' : 'pessoas confirmadas'} com {totalChances} chances no total
                </p>
              </div>
              
              <Separator className="bg-yellow-200" />
              
              <div className="space-y-3">
                <Button
                  onClick={handleRealizarSorteio}
                  disabled={realizarSorteioMutation.isPending || sorteioPendente}
                  size="lg"
                  className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-bold py-3 px-8"
                >
                  {sorteioPendente ? (
                    <>
                      <Clock className="w-5 h-5 mr-2 animate-spin" />
                      Realizando Sorteio...
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5 mr-2" />
                      Realizar Sorteio Agora
                    </>
                  )}
                </Button>
                
                <p className="text-xs text-gray-500 max-w-md mx-auto">
                  O sorteio será realizado de forma transparente e automática. O resultado ficará registrado permanentemente no sistema.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Sorteio Já Realizado */}
        {sorteioJaRealizado && (
          <Card className="border-2 border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
            <CardContent className="p-6 text-center">
              <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-600" />
              <h3 className="text-xl font-bold text-green-900 mb-2">
                Sorteio Finalizado
              </h3>
              <p className="text-green-700">
                Este sorteio já foi realizado e finalizado. Confira o resultado no histórico.
              </p>
            </CardContent>
          </Card>
        )}
        
      </main>
    </div>
  );
}