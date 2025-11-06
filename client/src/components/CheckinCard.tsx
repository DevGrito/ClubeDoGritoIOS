import { useState } from 'react';
import { useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { MissoesCarousel } from "@/components/MissoesCarousel";
import { useLocation } from "wouter";

interface CheckinCardProps {
  userId: number | null;
  onCheckinComplete?: () => void;
  onClose?: () => void; // Para fechar modal se usado em overlay
  showMissoes?: boolean; // Controla se deve mostrar o carrossel de missões
}

export function CheckinCard({ userId, onCheckinComplete, showMissoes = false }: CheckinCardProps) {
  const [, setLocation] = useLocation();
  const [showCheckinModal, setShowCheckinModal] = useState(false);
  const [checkinResult, setCheckinResult] = useState<{gritosGanhos: number, isDay7: boolean} | null>(null);

  // Query para verificar se pode fazer check-in - SEM CACHE
  const { data: checkinData, refetch, isLoading } = useQuery({
    queryKey: ["checkin-status", userId], // Key fixo - cache controlado pelo backend
    queryFn: async () => {
      if (!userId) return { canCheckin: false, diasConsecutivos: 0, diaAtual: 1 };
      try {
        // Adicionar timestamp para evitar cache HTTP
        const timestamp = Date.now();
        const response = await apiRequest(`/api/users/${userId}/can-checkin?t=${timestamp}`, {
          method: "GET",
        });
        console.log('🔍 [CHECKIN QUERY] Resposta do backend:', response);
        return response;
      } catch (error) {
        console.error('❌ [CHECKIN QUERY] Erro:', error);
        return { canCheckin: false, diasConsecutivos: 0, diaAtual: 1 };
      }
    },
    enabled: !!userId,
    staleTime: 0, // Dados sempre stale
    gcTime: 0, // Não manter em cache
    refetchInterval: 2000, // Polling a cada 2 segundos
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    refetchIntervalInBackground: true
  });

  // NUNCA assumir false durante loading - usar dados reais do backend
  const podeCheckin = checkinData?.canCheckin ?? true;

  const handleCheckin = async () => {
    if (!userId || isLoading) return;
    
    try {
      // Executar o check-in
      const result = await apiRequest(`/api/users/${userId}/checkin`, {
        method: "POST",
      });
      
      if (result.success) {
        console.log('✅ [CHECKIN] Sucesso! Invalidando queries específicas...');
        console.log('📊 [CHECKIN] Resultado:', result);
        
        // INVALIDAR QUERIES ESPECÍFICAS - síncrono e imediato
        await queryClient.invalidateQueries({ queryKey: ["checkin-status", userId] });
        await queryClient.invalidateQueries({ queryKey: ["/api/user", userId] });
        await queryClient.invalidateQueries({ queryKey: ["/api/users", userId] });
        await queryClient.invalidateQueries({ queryKey: [`/api/user/${userId}`] }); // Formato alternativo
        
        // Forçar refetch imediato da query local
        await refetch();
        
        console.log('🔄 [CHECKIN] Queries invalidadas! Aguardando atualização...');
        
        // Pequeno delay para garantir que as queries foram refetchadas
        setTimeout(() => {
          console.log('✅ [CHECKIN] Atualização concluída');
        }, 500);
        
        // Salvar resultado do checkin para usar na mensagem
        setCheckinResult({
          gritosGanhos: result.gritosGanhos,
          isDay7: result.isDay7
        });
        
        // Mostrar modal de parabéns
        setShowCheckinModal(true);
        
        // Fechar automaticamente após 4 segundos
        setTimeout(() => {
          setShowCheckinModal(false);
        }, 4000);

        // Chamar callback se fornecido
        onCheckinComplete?.();
      }
    } catch (error) {
      console.error("Erro ao fazer check-in:", error);
      alert("Erro ao fazer check-in. Tente novamente.");
    }
  };

  return (
    <>
      {/* Card de progresso do check-in - Design unificado */}
      <div className="bg-gradient-to-br from-orange-400 to-yellow-400 rounded-2xl p-4 text-white mb-6">
        <h2 className="text-lg font-bold mb-1 text-white">Progresso do check-in diário</h2>
        <p className="text-xs mb-3 opacity-90">
          Você ganhará pontos extras na sétima vez que fizer check-in a cada semana.
        </p>
        
        {/* 7 círculos para os dias - Baseado na data de cadastro do usuário */}
        <div className="flex justify-between items-center mb-4 px-1">
          {[1, 2, 3, 4, 5, 6, 7].map((dia) => {
            // Usar valores do backend diretamente - SEM fallbacks que causam estado incorreto
            const diasConsecutivos = checkinData?.diasConsecutivos ?? 0;
            const diaAtualNoCiclo = checkinData?.diaAtual ?? 1;
            const canCheckin = checkinData?.canCheckin ?? true;
            
            // Se canCheckin = false, o dia atual JÁ FOI completado
            // Se canCheckin = true, o dia atual ainda NÃO foi completado
            const diasCompletados = canCheckin ? diaAtualNoCiclo - 1 : diaAtualNoCiclo;
            const isCompleted = dia <= diasCompletados;
            const isToday = dia === diaAtualNoCiclo;
            const isDay7 = dia === 7;
            
            // Mostrar o dia baseado no progresso personalizado
            const labelDia = (() => {
              if (isToday) return 'Hoje';
              if (dia <= diaAtualNoCiclo) return `Dia ${dia}`;
              return `Dia ${dia}`;
            })();

            return (
              <div key={dia} className="flex flex-col items-center min-w-0 flex-1">
                <div className={`w-10 h-10 rounded-2xl flex flex-col items-center justify-center text-xs font-bold mb-1 ${
                  isCompleted 
                    ? 'bg-white/90 text-orange-500' 
                    : 'bg-white/30 text-white'
                }`}>
                  <span className="text-xs">{isDay7 ? '+20' : '+10'}</span>
                </div>
                <span className={`text-xs font-medium truncate ${
                  isToday ? 'text-yellow-200 font-bold' : 'text-white'
                }`}>
                  {isToday ? 'Hoje' : `Dia ${dia}`}
                </span>
              </div>
            );
          })}
        </div>

        {/* Botão de check-in */}
        <button 
          className="w-full bg-white text-orange-500 font-bold py-3 rounded-full text-base"
          onClick={handleCheckin}
          disabled={!podeCheckin}
        >
          {podeCheckin ? "Fazer Check-in" : "Check-in realizado hoje"}
        </button>
      </div>

      {/* Seção de Missões - Só aparece se showMissoes for true */}
      {showMissoes && (
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Complete suas missões!</h2>
          <MissoesCarousel 
            userId={userId?.toString() || null} 
            onConcluirMissao={(missaoId) => {
              // Navegar para a página de missões semanais ao clicar em concluir
              setLocation('/missoes-semanais');
            }}
          />
        </div>
      )}

      {/* Modal de check-in animado - Exatamente igual à imagem */}
      {showCheckinModal && checkinResult && (
        <div className="fixed inset-0 bg-white flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-sm mx-auto text-center px-6 py-12">
            {/* Logo do Clube do Grito */}
            <div className="mb-6">
              <div className="flex items-center justify-center mb-2">
                <span className="text-2xl font-bold text-red-500">Clube</span>
                <span className="text-2xl font-bold text-yellow-500 ml-1"> do</span>
                <span className="text-2xl font-bold text-red-500 ml-1"> Grito</span>
                <span className="text-2xl ml-2">📢</span>
              </div>
            </div>
            
            {/* Emoji de fogo */}
            <div className="text-5xl mb-4">🔥</div>
            
            {/* Título principal */}
            <h2 className="text-2xl font-bold text-black mb-2">Mandou bem!</h2>
            
            {/* Mensagem do check-in */}
            <p className="text-base text-gray-700 mb-8">
              Check-in feito e<br />
              +{checkinResult.gritosGanhos} Gritos na conta.
            </p>
            
            {/* Ilustração das pessoas fazendo high-five - Imagem profissional */}
            <div className="mb-8 flex justify-center">
              <img 
                src="/attached_assets/HIFH FIVE_Prancheta 1 1_1757421141870.png" 
                alt="Pessoas comemorando high-five"
                className="w-48 h-48 object-contain"
                onLoad={() => console.log('High-five image loaded successfully!')}
                onError={(e) => console.log('Error loading high-five image:', e)}
              />
            </div>
            
            {/* Mensagem final */}
            <p className="text-lg text-gray-700 font-medium">
              Cada passo seu faz barulho!
            </p>
          </div>
        </div>
      )}
    </>
  );
}