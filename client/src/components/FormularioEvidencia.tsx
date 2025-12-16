import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, MapPin, Video, Link2, MessageSquare, HelpCircle, Camera, Clock, Copy, Users, ExternalLink, CheckCircle, Share2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";
import type { EvidenceType, EvidenciaComentario, EvidenciaPrint, EvidenciaLink, EvidenciaCheckin, EvidenciaVideo, EvidenciaQuiz } from "@shared/schema";

interface FormularioEvidenciaProps {
  evidenceType: EvidenceType;
  missaoTitulo: string;
  missaoDescricao: string;
  missaoId?: number;
  userId?: string;
  configuracoes?: {
    dominiosPermitidos?: string[];
    distanciaMaxima?: number;
    duracaoMaximaVideo?: number;
    perguntasQuiz?: Array<{pergunta: string, opcoes: string[], resposta_correta: number}>;
    percentualAcertoMinimo?: number;
    referralsNecessarios?: number;
  };
  onSubmit: (evidenciaData: any) => Promise<void>;
  isLoading?: boolean;
}

export function FormularioEvidencia({
  evidenceType,
  missaoTitulo,
  missaoDescricao,
  missaoId,
  userId,
  configuracoes = {},
  onSubmit,
  isLoading = false
}: FormularioEvidenciaProps) {
  const { toast } = useToast();
  const [evidenciaData, setEvidenciaData] = useState<any>({});
  const [isValid, setIsValid] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // 🔗 SISTEMA DE REFERRAL AUTOMÁTICO
  const [referralData, setReferralData] = useState<{
    linkGerado?: string;
    cliques: number;
    cadastrosCompletos: number;
    referralsNecessarios: number;
    isLoading: boolean;
    error?: string;
    missaoCompletada?: boolean;
  }>({
    cliques: 0,
    cadastrosCompletos: 0,
    referralsNecessarios: configuracoes.referralsNecessarios || 3,
    isLoading: false,
    missaoCompletada: false
  });

  // 📊 React Query para buscar progresso do referral com correct endpoint
  const { data: progressData } = useQuery({
    queryKey: ['referral-progress', userId, missaoId],
    queryFn: async () => {
      if (!userId || !missaoId || evidenceType !== 'link') return null;
      return await apiRequest(`/api/referrals/progress/${userId}/${missaoId}`);
    },
    enabled: !!(userId && missaoId && evidenceType === 'link' && referralData.linkGerado),
    refetchInterval: referralData.missaoCompletada ? false : 5000, // Poll de 5s até completar
    refetchIntervalInBackground: false,
    gcTime: 1000 * 60 * 5, // 5 minutos
    staleTime: 1000 * 10 // 10 segundos
  });

  // Funções de validação por tipo
  const validateComentario = (data: Partial<EvidenciaComentario>): boolean => {
    return !!(data.comentario && data.comentario.length >= 20 && data.comentario.length <= 600);
  };

  const validatePrint = (data: Partial<EvidenciaPrint>): boolean => {
    return !!(data.imagens && data.imagens.length > 0 && data.imagens.length <= 3);
  };

  const validateLink = (data: Partial<EvidenciaLink>): boolean => {
    // Para sistema de referral automático
    if (evidenceType === 'link' && referralData.linkGerado) {
      // Validar se tem link gerado e se atingiu o número necessário de referrals
      return referralData.cadastrosCompletos >= referralData.referralsNecessarios;
    }
    
    // Validação original para outros casos
    if (!data.url) return false;
    
    try {
      const url = new URL(data.url);
      if (!['http:', 'https:'].includes(url.protocol)) return false;
      
      // Verificar domínios permitidos se especificado
      if (configuracoes.dominiosPermitidos && configuracoes.dominiosPermitidos.length > 0) {
        const dominio = url.hostname.toLowerCase();
        return configuracoes.dominiosPermitidos.some(d => 
          dominio === d.toLowerCase() || dominio.endsWith('.' + d.toLowerCase())
        );
      }
      
      return true;
    } catch {
      return false;
    }
  };

  const validateCheckin = (data: Partial<EvidenciaCheckin>): boolean => {
    return !!(data.latitude && data.longitude);
  };

  const validateVideo = (data: Partial<EvidenciaVideo>): boolean => {
    if (!data.videoUrl) return false;
    
    // Validar duração se especificada
    if (configuracoes.duracaoMaximaVideo && data.duracao) {
      return data.duracao <= configuracoes.duracaoMaximaVideo;
    }
    
    return true;
  };

  const validateQuiz = (data: Partial<EvidenciaQuiz>): boolean => {
    if (!data.respostas || !configuracoes.perguntasQuiz) return false;
    
    return data.respostas.length === configuracoes.perguntasQuiz.length && 
           data.pontuacao !== undefined &&
           data.pontuacao >= (configuracoes.percentualAcertoMinimo || 70);
  };

  // Validação geral
  // 🔐 SEGURANÇA: Validação para missões de pagamento  
  const validatePagamento = (data: any): boolean => {
    // Missões de pagamento são validadas automaticamente via webhook
    return true;
  };

  // 🔄 AUTOMÁTICO: Validação para missões automáticas
  const validateAutomatico = (data: any): boolean => {
    // Missões automáticas não precisam de validação manual
    return true;
  };

  const validateEvidence = (type: EvidenceType, data: any): boolean => {
    switch (type) {
      case 'comentario': return validateComentario(data);
      case 'print': return validatePrint(data);
      case 'link': return validateLink(data);
      case 'checkin': return validateCheckin(data);
      case 'video': return validateVideo(data);
      case 'quiz': return validateQuiz(data);
      case 'pagamento': return validatePagamento(data);
      case 'automatico': return validateAutomatico(data);
      default: return false;
    }
  };

  // Atualizar evidência e validar
  const updateEvidencia = (newData: any) => {
    setEvidenciaData(newData);
    setIsValid(validateEvidence(evidenceType, newData));
  };

  // Handlers específicos por tipo
  const handleFileUpload = async (files: FileList) => {
    const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
    if (imageFiles.length === 0) {
      toast({
        title: "Erro",
        description: "Por favor, selecione apenas imagens",
        variant: "destructive",
      });
      return;
    }

    if (imageFiles.length > 3) {
      toast({
        title: "Limite excedido",
        description: "Máximo de 3 imagens permitidas",
        variant: "destructive",
      });
      return;
    }

    // Converter para base64 para demonstração (em produção, fazer upload real)
    const imagePromises = imageFiles.map(file => {
      return new Promise<string>((resolve, reject) => {
        if (file.size > 5 * 1024 * 1024) { // 5MB
          reject(new Error(`Imagem muito grande: ${file.name}`));
          return;
        }

        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    });

    try {
      const imagens = await Promise.all(imagePromises);
      updateEvidencia({
        ...evidenciaData,
        imagens,
        observacao: evidenciaData.observacao || ''
      });
    } catch (error: any) {
      toast({
        title: "Erro no upload",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleGeolocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Geolocalização não suportada",
        description: "Seu navegador não suporta geolocalização",
        variant: "destructive",
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        updateEvidencia({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          precisao: position.coords.accuracy,
          enderecoDetectado: "Localização obtida com sucesso"
        });
        
        toast({
          title: "Localização obtida",
          description: `Precisão: ${Math.round(position.coords.accuracy)}m`,
        });
      },
      (error) => {
        toast({
          title: "Erro de localização",
          description: "Não foi possível obter sua localização",
          variant: "destructive",
        });
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleQuizAnswer = (questionIndex: number, answerIndex: number) => {
    if (!configuracoes.perguntasQuiz) return;

    const novasRespostas = [...(evidenciaData.respostas || [])];
    novasRespostas[questionIndex] = answerIndex;

    // Calcular pontuação
    let questoesCorretas = 0;
    configuracoes.perguntasQuiz.forEach((pergunta, index) => {
      if (novasRespostas[index] === pergunta.resposta_correta) {
        questoesCorretas++;
      }
    });

    const pontuacao = Math.round((questoesCorretas / configuracoes.perguntasQuiz.length) * 100);

    updateEvidencia({
      respostas: novasRespostas,
      pontuacao,
      questoesCorretas,
      totalQuestoes: configuracoes.perguntasQuiz.length
    });
  };

  // 🔗 FUNÇÕES DO SISTEMA DE REFERRAL
  const gerarLinkReferral = async () => {
    if (!userId || !missaoId) {
      toast({
        title: "Erro",
        description: "Dados do usuário ou missão não encontrados",
        variant: "destructive",
      });
      return;
    }

    setReferralData(prev => ({ ...prev, isLoading: true, error: undefined }));
    
    try {
      const result = await apiRequest(`/api/gerar-referral/${userId}/${missaoId}`, {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (result.linkConvite) {
        setReferralData(prev => ({
          ...prev,
          linkGerado: result.linkConvite,
          isLoading: false
        }));
        
        // Atualizar evidência com o link gerado
        updateEvidencia({
          url: result.linkConvite,
          isReferralAutomatico: true
        });
      }
    } catch (error) {
      console.error("Erro ao gerar link de referral:", error);
      setReferralData(prev => ({
        ...prev,
        isLoading: false,
        error: "Não foi possível gerar o link. Tente novamente."
      }));
    }
  };

  // 🔄 Processar dados de progresso quando recebidos do React Query
  useEffect(() => {
    if (progressData && evidenceType === 'link') {
      const novosCadastros = progressData.cadastrosCompletos || 0;
      const metaAtingida = novosCadastros >= referralData.referralsNecessarios;
      
      setReferralData(prev => ({
        ...prev,
        cliques: progressData.cliques || 0,
        cadastrosCompletos: novosCadastros,
        missaoCompletada: metaAtingida
      }));
      
      // ⚠️ REMOVIDO: Auto-submit do frontend para evitar dupla conclusão
      // Backend já faz auto-completar quando meta é atingida
      if (metaAtingida && !referralData.missaoCompletada) {
        toast({
          title: "🎉 Meta Atingida!",
          description: `Parabéns! ${novosCadastros} amigos se cadastraram. A missão será completada automaticamente pelo sistema.`,
        });
      }
    }
  }, [progressData, evidenceType, referralData.referralsNecessarios, referralData.missaoCompletada, toast]);

  const copiarLinkReferral = async () => {
    if (!referralData.linkGerado) return;
    
    try {
      await navigator.clipboard.writeText(referralData.linkGerado);
      toast({
        title: "Link copiado!",
        description: "O link foi copiado para sua área de transferência",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível copiar o link",
        variant: "destructive",
      });
    }
  };

  // Effect para gerar link automaticamente quando é missão do tipo 'link'
  useEffect(() => {
    if (evidenceType === 'link' && userId && missaoId && !referralData.linkGerado && !referralData.isLoading) {
      gerarLinkReferral();
    }
  }, [evidenceType, userId, missaoId]);

  // ⚠️ REMOVIDO: setInterval manual - agora usa react-query com refetchInterval

  const handleSubmit = async () => {
    if (!isValid) {
      toast({
        title: "Evidência inválida",
        description: "Por favor, complete todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    try {
      await onSubmit(evidenciaData);
    } catch (error) {
      toast({
        title: "Erro ao enviar",
        description: "Tente novamente em alguns instantes",
        variant: "destructive",
      });
    }
  };

  // Renderização dos formulários específicos
  const renderFormulario = () => {
    switch (evidenceType) {
      case 'comentario':
        return (
          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-blue-600">
              <MessageSquare className="w-5 h-5" />
              <span className="font-medium">Conte como você cumpriu esta missão</span>
            </div>
            
            <div>
              <Label htmlFor="comentario">Seu comentário *</Label>
              <Textarea
                id="comentario"
                placeholder="Conte rapidamente como você cumpriu a missão... (mínimo 20 caracteres)"
                value={evidenciaData.comentario || ''}
                onChange={(e) => updateEvidencia({ comentario: e.target.value })}
                className="mt-2 min-h-[120px]"
                maxLength={600}
                data-testid="input-comentario"
              />
              <p className="text-xs text-gray-500 mt-1" data-testid="comentario-counter">
                {evidenciaData.comentario?.length || 0}/600 caracteres (mínimo 20)
              </p>
            </div>
          </div>
        );

      case 'print':
        return (
          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-green-600">
              <Camera className="w-5 h-5" />
              <span className="font-medium">Envie fotos que comprovem a missão</span>
            </div>
            
            <div>
              <Label>Imagens (1-3 fotos) *</Label>
              <div
                className="mt-2 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-gray-400 transition-colors"
                onClick={() => fileInputRef.current?.click()}
                data-testid="upload-area"
              >
                <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p className="text-gray-600">Clique para selecionar imagens</p>
                <p className="text-xs text-gray-500 mt-1">PNG ou JPG, máximo 5MB cada</p>
              </div>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                data-testid="file-input"
              />
              
              {evidenciaData.imagens && evidenciaData.imagens.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mt-4">
                  {evidenciaData.imagens.map((img: string, index: number) => (
                    <div key={index} className="aspect-square rounded-lg overflow-hidden">
                      <img src={img} alt={`Evidência ${index + 1}`} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div>
              <Label htmlFor="observacao">Observação (opcional)</Label>
              <Input
                id="observacao"
                placeholder="Adicione uma observação..."
                value={evidenciaData.observacao || ''}
                onChange={(e) => updateEvidencia({ ...evidenciaData, observacao: e.target.value })}
                maxLength={140}
                className="mt-2"
                data-testid="input-observacao"
              />
              <p className="text-xs text-gray-500 mt-1">
                {evidenciaData.observacao?.length || 0}/140 caracteres
              </p>
            </div>
          </div>
        );

      case 'link':
        return (
          <div className="space-y-6">
            {/* Header - Status da Missão */}
            <div className="text-center">
              {referralData.missaoCompletada ? (
                <div className="flex items-center justify-center space-x-2 text-green-600 mb-4" data-testid="missao-completada-status">
                  <CheckCircle className="w-6 h-6" />
                  <span className="font-semibold text-lg">Missão Completada!</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-2 text-purple-600 mb-4" data-testid="missao-pendente-status">
                  <Share2 className="w-6 h-6" />
                  <span className="font-semibold text-lg">Convide amigos para completar esta missão</span>
                </div>
              )}
            </div>
            
            {/* Loading do Link */}
            {referralData.isLoading && (
              <div className="text-center py-8" data-testid="link-loading">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-4"></div>
                <p className="text-gray-600">Gerando seu link de convite...</p>
              </div>
            )}
            
            {/* Error */}
            {referralData.error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4" data-testid="referral-error">
                <p className="text-red-700 text-sm">{referralData.error}</p>
                <Button 
                  onClick={gerarLinkReferral}
                  size="sm"
                  className="mt-2 bg-red-600 hover:bg-red-700"
                  data-testid="button-retry-referral"
                >
                  Tentar novamente
                </Button>
              </div>
            )}
            
            {/* Link gerado com sucesso */}
            {referralData.linkGerado && !referralData.isLoading && (
              <>
                {/* Missão completada - Estado Final */}
                {referralData.missaoCompletada ? (
                  <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6 text-center">
                    <div className="text-6xl mb-4">🎉</div>
                    <h3 className="text-xl font-bold text-green-800 mb-2">Meta Atingida!</h3>
                    <p className="text-green-700 mb-4">
                      {referralData.cadastrosCompletos} amigos se cadastraram através do seu link!
                    </p>
                    <div className="bg-green-100 rounded-lg p-3">
                      <p className="text-sm text-green-800 font-medium">
                        ✅ Missão concluída automaticamente
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Caixa do Link - Estado Ativo */}
                    <div className="bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-purple-200 rounded-xl p-5">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                          <span className="font-semibold text-purple-800 text-lg">🔗 Seu Link de Convite</span>
                        </div>
                        <Button
                          onClick={copiarLinkReferral}
                          size="sm"
                          className="bg-purple-600 hover:bg-purple-700 text-white"
                          data-testid="button-copy-link"
                        >
                          <Copy className="w-4 h-4 mr-1" />
                          Copiar Link
                        </Button>
                      </div>
                      
                      <div className="bg-white rounded-lg p-4 border-2 border-purple-100 shadow-sm" data-testid="referral-link-display">
                        <div className="flex items-center space-x-2">
                          <code className="text-sm text-purple-700 flex-1 break-all font-mono" data-testid="referral-url">
                            {referralData.linkGerado}
                          </code>
                          <ExternalLink className="w-4 h-4 text-purple-500 flex-shrink-0" />
                        </div>
                      </div>
                      
                      <div className="mt-3 text-center">
                        <p className="text-sm text-purple-700">
                          📱 Compartilhe este link para que amigos se cadastrem
                        </p>
                      </div>
                    </div>
                    
                    {/* Progresso em Tempo Real */}
                    <div className="bg-white border-2 border-gray-200 rounded-xl p-5 shadow-sm">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <Users className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-800">📊 Progresso em Tempo Real</h3>
                            <p className="text-sm text-gray-600">Atualizado a cada 5 segundos</p>
                          </div>
                        </div>
                        {referralData.cadastrosCompletos >= referralData.referralsNecessarios && (
                          <CheckCircle className="w-6 h-6 text-green-600" />
                        )}
                      </div>
                      
                      {/* Meta e Progresso */}
                      <div className="mb-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium text-gray-700">Meta da Missão:</span>
                          <span className="text-lg font-bold text-gray-800">
                            {referralData.cadastrosCompletos} / {referralData.referralsNecessarios}
                          </span>
                        </div>
                        
                        {/* Barra de progresso animada */}
                        <div className="w-full bg-gray-200 rounded-full h-4 mb-3 overflow-hidden">
                          <div 
                            className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 h-4 rounded-full transition-all duration-500 ease-out relative"
                            style={{ 
                              width: `${Math.min((referralData.cadastrosCompletos / referralData.referralsNecessarios) * 100, 100)}%` 
                            }}
                          >
                            <div className="absolute inset-0 bg-white bg-opacity-30 animate-pulse"></div>
                          </div>
                        </div>
                        
                        <div className="text-center">
                          {referralData.cadastrosCompletos >= referralData.referralsNecessarios ? (
                            <p className="text-green-600 font-semibold flex items-center justify-center space-x-1">
                              <span>🎯</span>
                              <span>Meta atingida! Finalizando missão...</span>
                            </p>
                          ) : (
                            <p className="text-blue-600 font-medium">
                              Faltam {referralData.referralsNecessarios - referralData.cadastrosCompletos} cadastro(s) para completar
                            </p>
                          )}
                        </div>
                      </div>
                      
                      {/* Estatísticas detalhadas */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-blue-50 rounded-lg p-4 text-center border border-blue-200">
                          <div className="text-2xl font-bold text-blue-600 mb-1">{referralData.cliques}</div>
                          <div className="text-sm text-blue-700 font-medium">👆 Cliques</div>
                        </div>
                        <div className="bg-green-50 rounded-lg p-4 text-center border border-green-200">
                          <div className="text-2xl font-bold text-green-600 mb-1">{referralData.cadastrosCompletos}</div>
                          <div className="text-sm text-green-700 font-medium">✅ Cadastros</div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Dicas para compartilhamento */}
                    <div className="bg-gradient-to-br from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-4">
                      <h4 className="font-semibold text-yellow-800 mb-3 flex items-center space-x-2">
                        <span>💡</span>
                        <span>Dicas para Acelerar seus Convites:</span>
                      </h4>
                      <div className="grid grid-cols-1 gap-2">
                        <div className="flex items-center space-x-3 text-sm text-yellow-700">
                          <span className="w-6 h-6 bg-yellow-200 rounded-full flex items-center justify-center text-xs font-bold">1</span>
                          <span>Compartilhe nas suas redes sociais (Instagram, Twitter, etc.)</span>
                        </div>
                        <div className="flex items-center space-x-3 text-sm text-yellow-700">
                          <span className="w-6 h-6 bg-yellow-200 rounded-full flex items-center justify-center text-xs font-bold">2</span>
                          <span>Envie diretamente para amigos via WhatsApp</span>
                        </div>
                        <div className="flex items-center space-x-3 text-sm text-yellow-700">
                          <span className="w-6 h-6 bg-yellow-200 rounded-full flex items-center justify-center text-xs font-bold">3</span>
                          <span>Explique os benefícios do Clube do Grito</span>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        );

      case 'checkin':
        return (
          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-red-600">
              <MapPin className="w-5 h-5" />
              <span className="font-medium">Faça check-in no local</span>
            </div>
            
            {!evidenciaData.latitude ? (
              <div className="text-center py-8">
                <MapPin className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600 mb-4">Clique no botão para obter sua localização atual</p>
                <Button onClick={handleGeolocation} className="bg-red-500 hover:bg-red-600">
                  <MapPin className="w-4 h-4 mr-2" />
                  Fazer Check-in
                </Button>
                {configuracoes.distanciaMaxima && (
                  <p className="text-xs text-gray-500 mt-2">
                    Raio máximo permitido: {configuracoes.distanciaMaxima}m
                  </p>
                )}
              </div>
            ) : (
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center space-x-2 text-green-600 mb-2">
                  <MapPin className="w-5 h-5" />
                  <span className="font-medium">Check-in realizado com sucesso!</span>
                </div>
                <p className="text-sm text-gray-600">
                  Localização: {evidenciaData.latitude.toFixed(6)}, {evidenciaData.longitude.toFixed(6)}
                </p>
                {evidenciaData.precisao && (
                  <p className="text-sm text-gray-600">
                    Precisão: {Math.round(evidenciaData.precisao)}m
                  </p>
                )}
              </div>
            )}
          </div>
        );

      case 'video':
        return (
          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-indigo-600">
              <Video className="w-5 h-5" />
              <span className="font-medium">Envie um vídeo de evidência</span>
            </div>
            
            <div>
              <Label htmlFor="videoUrl">URL do vídeo *</Label>
              <Input
                id="videoUrl"
                placeholder="https://youtube.com/... ou upload do arquivo"
                value={evidenciaData.videoUrl || ''}
                onChange={(e) => updateEvidencia({ ...evidenciaData, videoUrl: e.target.value })}
                className="mt-2"
              />
              
              {configuracoes.duracaoMaximaVideo && (
                <p className="text-xs text-gray-500 mt-1 flex items-center">
                  <Clock className="w-3 h-3 mr-1" />
                  Duração máxima: {configuracoes.duracaoMaximaVideo}s
                </p>
              )}
            </div>
          </div>
        );

      case 'quiz':
        return (
          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-orange-600">
              <HelpCircle className="w-5 h-5" />
              <span className="font-medium">Responda ao quiz</span>
            </div>
            
            {configuracoes.perguntasQuiz?.map((pergunta, questionIndex) => (
              <Card key={questionIndex}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">
                    {questionIndex + 1}. {pergunta.pergunta}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {pergunta.opcoes.map((opcao, answerIndex) => (
                    <label
                      key={answerIndex}
                      className="flex items-center space-x-2 cursor-pointer p-2 rounded hover:bg-gray-50"
                    >
                      <input
                        type="radio"
                        name={`question-${questionIndex}`}
                        value={answerIndex}
                        checked={evidenciaData.respostas?.[questionIndex] === answerIndex}
                        onChange={() => handleQuizAnswer(questionIndex, answerIndex)}
                        className="text-orange-600"
                      />
                      <span>{opcao}</span>
                    </label>
                  ))}
                </CardContent>
              </Card>
            ))}
            
            {evidenciaData.pontuacao !== undefined && (
              <div className={`p-4 rounded-lg ${
                evidenciaData.pontuacao >= (configuracoes.percentualAcertoMinimo || 70)
                  ? 'bg-green-50 text-green-800'
                  : 'bg-red-50 text-red-800'
              }`}>
                <p className="font-medium">
                  Pontuação: {evidenciaData.pontuacao}% 
                  ({evidenciaData.questoesCorretas}/{evidenciaData.totalQuestoes} corretas)
                </p>
                <p className="text-sm">
                  {evidenciaData.pontuacao >= (configuracoes.percentualAcertoMinimo || 70)
                    ? '✅ Parabéns! Você atingiu a pontuação mínima.'
                    : `❌ Pontuação mínima necessária: ${configuracoes.percentualAcertoMinimo || 70}%`
                  }
                </p>
              </div>
            )}
          </div>
        );

      case 'pagamento':
        return (
          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-green-600">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">Missão de Pagamento</span>
            </div>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="font-medium text-green-800">Conclusão Automática via Pagamento</span>
              </div>
              <p className="text-green-700 text-sm">
                Esta missão será completada automaticamente após a confirmação do pagamento no sistema.
                Não é necessário enviar evidências manualmente.
              </p>
            </div>
          </div>
        );

      case 'automatico':
        return (
          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-blue-600">
              <Clock className="w-5 h-5" />
              <span className="font-medium">Missão Automática</span>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Clock className="w-5 h-5 text-blue-600" />
                <span className="font-medium text-blue-800">Verificação Automática do Sistema</span>
              </div>
              <p className="text-blue-700 text-sm">
                Esta missão é verificada automaticamente pelo sistema.
                Não é necessário enviar evidências manualmente.
              </p>
            </div>
          </div>
        );

      default:
        return <div>Tipo de evidência não suportado</div>;
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <span>{missaoTitulo}</span>
        </CardTitle>
        <CardDescription>
          {missaoDescricao}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {renderFormulario()}
        
        {/* Checkbox de conteúdo original */}
        <div className="flex items-start space-x-2 pt-4 border-t">
          <input
            type="checkbox"
            id="conteudo-original"
            checked={evidenciaData.conteudoOriginal || false}
            onChange={(e) => updateEvidencia({ ...evidenciaData, conteudoOriginal: e.target.checked })}
            className="mt-1 rounded border-gray-300 text-yellow-600 focus:ring-yellow-500"
          />
          <label htmlFor="conteudo-original" className="text-sm text-gray-700 leading-5">
            Declaro que o conteúdo enviado é original e de minha autoria, e autorizo seu uso para fins de verificação da missão.
          </label>
        </div>
        
        {/* Botão de envio - escondido para tipo 'link' quando missão está em andamento */}
        {evidenceType !== 'link' || referralData.missaoCompletada ? (
          <Button
            onClick={handleSubmit}
            disabled={!isValid || !evidenciaData.conteudoOriginal || isLoading || (evidenceType === 'link' && referralData.missaoCompletada)}
            className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-medium"
            data-testid="button-submit-evidencia"
          >
            {isLoading ? 'Enviando...' : 
             evidenceType === 'link' && referralData.missaoCompletada ? 'Missão Completada Automaticamente' :
             'Enviar Evidência'}
          </Button>
        ) : (
          <div className="text-center py-4">
            <p className="text-gray-600 font-medium">🔄 Aguardando amigos se cadastrarem...</p>
            <p className="text-sm text-gray-500 mt-1">A missão será completada automaticamente quando a meta for atingida</p>
          </div>
        )}
        
        {!isValid && evidenciaData.conteudoOriginal && (
          <p className="text-sm text-red-600 text-center">
            Complete todos os campos obrigatórios para enviar
          </p>
        )}
      </CardContent>
    </Card>
  );
}