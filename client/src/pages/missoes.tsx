import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { ArrowLeft, Star, Play, Clock, Trophy, Camera, CheckCircle, Target, Loader2, CreditCard as CreditCardIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import BottomNavigation from '@/components/bottom-navigation';
import Logo from '@/components/logo';
import CreditCard from '@/components/CreditCard';

interface MissaoCard {
  id: number;
  titulo: string;
  descricao: string;
  categoria: string;
  dificuldade: number; // 1-5 estrelas
  recompensaGritos: number;
  imagemUrl?: string;
  tipo: 'diaria' | 'semanal' | 'especial';
  concluida?: boolean;
  progresso?: number;
  tempoEstimado?: string;
  cor: string;
}

// Mapeamento de cores por categoria
const getCoresPorCategoria = (categoria: string): string => {
  const coresMap: Record<string, string> = {
    'Ecologia': 'from-green-400 to-emerald-600',
    'Arte': 'from-orange-400 to-red-500',
    'Desafio': 'from-amber-400 to-yellow-600',
    'Solidariedade': 'from-blue-400 to-purple-600',
    'Sustentabilidade': 'from-teal-400 to-cyan-600',
    'Bem-estar': 'from-pink-400 to-rose-600',
    'Educação': 'from-indigo-400 to-blue-600',
    'Saúde': 'from-red-400 to-pink-600',
    'Cultura': 'from-purple-400 to-violet-600'
  };
  return coresMap[categoria] || 'from-gray-400 to-gray-600';
};

export default function Missoes() {
  const [, setLocation] = useLocation();
  const [userId, setUserId] = useState<number | null>(null);
  const [filtroAtivo, setFiltroAtivo] = useState<'todas' | 'diaria' | 'semanal' | 'especial'>('todas');

  // Buscar ID do usuário do localStorage
  useEffect(() => {
    const sessionData = localStorage.getItem('session');
    if (sessionData) {
      try {
        const session = JSON.parse(sessionData);
        setUserId(session.userId);
      } catch (error) {
        console.error('Erro ao parsear dados da sessão:', error);
      }
    }
  }, []);

  // Buscar missões reais do backend
  const { data: missoesData, isLoading } = useQuery<any[]>({
    queryKey: ['/api/missoes-semanais', userId],
    queryFn: async () => {
      if (!userId) throw new Error('User ID não disponível');
      const response = await fetch(`/api/missoes-semanais/${userId}`);
      if (!response.ok) throw new Error('Erro ao buscar missões');
      return response.json();
    },
    enabled: !!userId
  });

  // Buscar dados do doador
  const { data: donorData } = useQuery({
    queryKey: [`/api/users/${userId}/donor`],
    enabled: !!userId
  });

  // Mapear dados da API para o formato esperado
  const missoes: MissaoCard[] = (missoesData || []).map((missao: any) => ({
    id: missao.id,
    titulo: missao.titulo,
    descricao: missao.descricao,
    categoria: missao.tipoMissao || 'Geral',
    dificuldade: Math.min(5, Math.max(1, Math.ceil(missao.recompensaGritos / 40))), // Calcular dificuldade baseado na recompensa
    recompensaGritos: missao.recompensaGritos,
    imagemUrl: missao.imagemUrl,
    tipo: missao.tipoMissao?.toLowerCase() === 'diária' ? 'diaria' : 
          missao.tipoMissao?.toLowerCase() === 'especial' ? 'especial' : 'semanal',
    concluida: missao.concluida || false,
    progresso: missao.progresso || 0,
    tempoEstimado: missao.tempoEstimado || '1h',
    cor: getCoresPorCategoria(missao.tipoMissao || 'Geral')
  }));

  // Filtrar missões baseado no filtro ativo
  const missoesFiltradas = missoes.filter(missao => 
    filtroAtivo === 'todas' || missao.tipo === filtroAtivo
  );

  const renderStars = (dificuldade: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-3 h-3 ${
              star <= dificuldade 
                ? 'text-yellow-400 fill-yellow-400' 
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <motion.div
      className="min-h-screen bg-gray-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="w-16">
            <button
              onClick={() => setLocation('/')}
              className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Voltar"
            >
              <ArrowLeft className="w-6 h-6 text-gray-700" />
            </button>
          </div>
          
          <div className="flex-1 flex justify-center">
            <Logo size="md" />
          </div>
          
          <div className="w-16 flex justify-end">
            <button className="flex flex-col items-center p-2 rounded-lg hover:bg-gray-100 transition-colors">
              <Camera className="w-5 h-5 text-gray-600 mb-1" />
              <span className="text-xs font-medium text-gray-600">Foto</span>
            </button>
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <div className="max-w-6xl mx-auto px-4 pb-28">
        
        {/* Cartão do Doador - Exibido quando há dados do doador */}
        {donorData && (
          <motion.div 
            className="mb-6 mt-6"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center">
                  <CreditCardIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Meu Cartão de Doador</h2>
                  <p className="text-sm text-gray-600">
                    Plano {donorData.plano === 'platinum' ? '💎 Platinum' : donorData.plano === 'gold' ? '🥇 Gold' : donorData.plano === 'silver' ? '🥈 Silver' : '🥉 Bronze'} • R$ {parseFloat(donorData.valor).toFixed(2)}/mês
                  </p>
                </div>
              </div>
              
              <div className="transform scale-95 sm:scale-100">
                <CreditCard
                  cardNumber="•••• •••• •••• 4653"
                  holderName="LEO MARTINS"
                  expiryDate="06/29"
                  cvv="•••"
                  className="w-full"
                />
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500 mb-1">Status</p>
                    <p className="font-semibold text-green-600">
                      {donorData.status === 'paid' ? '✓ Ativo' : 'Inativo'}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 mb-1">Última Doação</p>
                    <p className="font-semibold text-gray-900">
                      {new Date(donorData.ultimaDoacao).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
        
        {/* Título da seção */}
        <div className="text-center mb-6 mt-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">🎮 Central de Missões</h1>
          <p className="text-gray-600">Complete missões épicas e ganhe recompensas incríveis!</p>
        </div>

        {/* Filtros */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {[
            { key: 'todas', label: 'Todas', icon: '🎯' },
            { key: 'diaria', label: 'Diárias', icon: '☀️' },
            { key: 'semanal', label: 'Semanais', icon: '📅' },
            { key: 'especial', label: 'Especiais', icon: '✨' }
          ].map((filtro) => (
            <button
              key={filtro.key}
              onClick={() => setFiltroAtivo(filtro.key as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium transition-colors whitespace-nowrap ${
                filtroAtivo === filtro.key
                  ? 'bg-yellow-500 text-black shadow-md'
                  : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              <span>{filtro.icon}</span>
              <span>{filtro.label}</span>
            </button>
          ))}
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <Loader2 className="w-12 h-12 text-yellow-500 animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Carregando missões...</p>
            </div>
          </div>
        )}

        {/* Grid de Missões */}
        {!isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {missoesFiltradas.map((missao) => (
            <motion.div
              key={missao.id}
              className="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {/* Card Background com Gradiente */}
              <div
                className={`relative h-48 bg-gradient-to-br ${missao.cor} overflow-hidden`}
              >
                {/* Imagem de Fundo */}
                {missao.imagemUrl && (
                  <div 
                    className="absolute inset-0 bg-cover bg-center opacity-80"
                    style={{ backgroundImage: `url(${missao.imagemUrl})` }}
                  />
                )}
                
                {/* Overlay Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-black/10"></div>
                
                {/* Status Badge */}
                {missao.concluida ? (
                  <div className="absolute top-3 right-3 z-20">
                    <div className="bg-green-500 text-white text-xs px-3 py-1 rounded-full flex items-center gap-1 shadow-lg">
                      <CheckCircle className="w-3 h-3" />
                      <span className="font-medium">Completo</span>
                    </div>
                  </div>
                ) : (
                  <div className="absolute top-3 right-3 z-20">
                    <div className="bg-white/90 backdrop-blur-sm text-gray-800 text-xs px-3 py-1 rounded-full font-medium shadow-lg">
                      {missao.tempoEstimado}
                    </div>
                  </div>
                )}
                
                {/* Difficulty Stars */}
                <div className="absolute top-3 left-3 z-20">
                  <div className="bg-black/30 backdrop-blur-sm rounded-lg px-2 py-1">
                    {renderStars(missao.dificuldade)}
                  </div>
                </div>

                {/* Progress Bar (se houver progresso) */}
                {missao.progresso && !missao.concluida && (
                  <div className="absolute bottom-0 left-0 right-0 z-20">
                    <div className="bg-black/30 h-1">
                      <div 
                        className="bg-yellow-400 h-full transition-all duration-300"
                        style={{ width: `${missao.progresso}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Play Button */}
                {!missao.concluida && (
                  <div className="absolute inset-0 flex items-center justify-center z-10">
                    <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <Play className="w-8 h-8 text-white ml-1" fill="white" />
                    </div>
                  </div>
                )}
              </div>
              
              {/* Card Content */}
              <div className="bg-white p-4">
                {/* Título e Categoria */}
                <div className="mb-3">
                  <h3 className="font-bold text-gray-900 text-lg mb-1 line-clamp-2 group-hover:text-blue-600 transition-colors">
                    {missao.titulo}
                  </h3>
                  <span className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full font-medium">
                    {missao.categoria}
                  </span>
                </div>
                
                {/* Descrição */}
                <p className="text-gray-600 text-sm mb-4 line-clamp-2 leading-relaxed">
                  {missao.descricao}
                </p>
                
                {/* Footer */}
                <div className="flex items-center justify-between">
                  {/* Recompensa */}
                  <div className="flex items-center gap-1 bg-yellow-100 rounded-full px-3 py-1">
                    <Trophy className="w-4 h-4 text-yellow-600" />
                    <span className="text-sm font-bold text-yellow-800">
                      {missao.recompensaGritos}
                    </span>
                  </div>
                  
                  {/* Tipo da Missão */}
                  <div className={`text-xs px-2 py-1 rounded-full font-medium ${
                    missao.tipo === 'diaria' ? 'bg-blue-100 text-blue-700' :
                    missao.tipo === 'semanal' ? 'bg-green-100 text-green-700' :
                    'bg-purple-100 text-purple-700'
                  }`}>
                    {missao.tipo === 'diaria' ? '🌅 Diária' : 
                     missao.tipo === 'semanal' ? '📅 Semanal' : 
                     '✨ Especial'}
                  </div>
                </div>

                {/* Progress Text */}
                {missao.progresso && !missao.concluida && (
                  <div className="mt-3 text-xs text-gray-500 text-center">
                    Progresso: {missao.progresso}%
                  </div>
                )}
              </div>
            </motion.div>
          ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && missoesFiltradas.length === 0 && (
          <div className="text-center py-16">
            <Target className="w-20 h-20 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              Nenhuma missão encontrada
            </h3>
            <p className="text-gray-500">
              Tente alterar o filtro para ver mais missões disponíveis.
            </p>
          </div>
        )}

        {/* Info Card */}
        {!isLoading && (
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-6 mt-8 text-white">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                <Trophy className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-lg mb-2">🚀 Como Funciona?</h4>
                <ul className="text-sm space-y-1 text-white/90">
                  <li>• Complete missões para ganhar Gritos</li>
                  <li>• Missões diárias renovam todo dia</li>
                  <li>• Missões especiais são limitadas</li>
                  <li>• Quanto mais difícil, maior a recompensa!</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <BottomNavigation />
    </motion.div>
  );
}