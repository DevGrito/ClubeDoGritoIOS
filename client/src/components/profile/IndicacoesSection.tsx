import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Users, 
  UserPlus, 
  Check, 
  Clock, 
  Gift,
  Copy,
  ChevronDown,
  ChevronUp,
  Loader2
} from "lucide-react";

interface Indicacao {
  id: number;
  codigo: string;
  link: string;
  status: string;
  indicado: {
    id: number;
    nome: string;
    telefone: string | null;
  } | null;
  cadastrouEm: string | null;
  doouEm: string | null;
  completadoEm: string | null;
  criadoEm: string;
  gritosRecompensa: number;
}

interface IndicadorInfo {
  id: number;
  nome: string;
  codigoUsado: string;
  dataIndicacao: string | null;
}

export function IndicacoesSection() {
  const { toast } = useToast();
  const [codigoInput, setCodigoInput] = useState("");
  const [aplicando, setAplicando] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [expandido, setExpandido] = useState(false);
  
  const [meuIndicador, setMeuIndicador] = useState<IndicadorInfo | null>(null);
  const [minhasIndicacoes, setMinhasIndicacoes] = useState<Indicacao[]>([]);
  const [stats, setStats] = useState({ total: 0, pendentes: 0, cadastrados: 0, completos: 0 });

  const userId = localStorage.getItem("userId");

  useEffect(() => {
    if (!userId) return;
    
    const carregarDados = async () => {
      setCarregando(true);
      try {
        const [indicadorRes, indicacoesRes] = await Promise.all([
          fetch(`/api/meu-indicador/${userId}`),
          fetch(`/api/minhas-indicacoes-referral/${userId}`)
        ]);

        if (indicadorRes.ok) {
          const indicadorData = await indicadorRes.json();
          if (indicadorData.temIndicador) {
            setMeuIndicador(indicadorData.indicador);
          }
        }

        if (indicacoesRes.ok) {
          const indicacoesData = await indicacoesRes.json();
          setMinhasIndicacoes(indicacoesData.indicacoes || []);
          setStats(indicacoesData.stats || { total: 0, pendentes: 0, cadastrados: 0, completos: 0 });
        }
      } catch (error) {
        console.error("Erro ao carregar dados de indicações:", error);
      } finally {
        setCarregando(false);
      }
    };

    carregarDados();
  }, [userId]);

  const aplicarCodigo = async () => {
    if (!codigoInput.trim()) {
      toast({
        title: "Código vazio",
        description: "Digite o código de indicação que você recebeu",
        variant: "destructive"
      });
      return;
    }

    setAplicando(true);
    try {
      const response = await fetch("/api/aplicar-codigo-referral", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, codigoReferral: codigoInput.trim() })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast({
          title: "Código aplicado!",
          description: data.message,
        });
        setMeuIndicador({
          id: data.indicadorId,
          nome: data.indicadorNome,
          codigoUsado: codigoInput.trim(),
          dataIndicacao: new Date().toISOString()
        });
        setCodigoInput("");
      } else {
        toast({
          title: "Erro ao aplicar código",
          description: data.error || "Não foi possível aplicar o código",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Erro de conexão",
        description: "Não foi possível conectar ao servidor",
        variant: "destructive"
      });
    } finally {
      setAplicando(false);
    }
  };

  const copiarLink = (link: string) => {
    navigator.clipboard.writeText(link);
    toast({
      title: "Link copiado!",
      description: "O link foi copiado para a área de transferência"
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completo':
        return <Badge className="bg-green-100 text-green-800"><Check className="w-3 h-3 mr-1" /> Completo</Badge>;
      case 'cadastrou':
        return <Badge className="bg-blue-100 text-blue-800"><UserPlus className="w-3 h-3 mr-1" /> Cadastrou</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800"><Clock className="w-3 h-3 mr-1" /> Pendente</Badge>;
    }
  };

  if (carregando) {
    return (
      <Card className="mb-4">
        <CardContent className="py-8 flex justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4 mb-6">
      {/* Seção: Fui indicado por */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold text-black flex items-center gap-2">
            <Gift className="w-5 h-5 text-black" />
            Código de Indicação
          </CardTitle>
        </CardHeader>
        <CardContent>
          {meuIndicador ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-800 font-medium">
                Você foi indicado por <span className="font-bold">{meuIndicador.nome}</span>
              </p>
              <p className="text-sm text-green-600 mt-1">
                Código: {meuIndicador.codigoUsado}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                Cole o código ou link de indicação que você recebeu:
              </p>
              <div className="flex gap-2">
                <Input
                  placeholder="Código ou link completo"
                  value={codigoInput}
                  onChange={(e) => setCodigoInput(e.target.value)}
                  className="flex-1"
                  data-testid="input-codigo-indicacao"
                />
                <Button 
                  onClick={aplicarCodigo} 
                  disabled={aplicando}
                  className="bg-yellow-400 hover:bg-yellow-500 text-black"
                  data-testid="button-aplicar-codigo"
                >
                  {aplicando ? <Loader2 className="w-4 h-4 animate-spin" /> : "Aplicar"}
                </Button>
              </div>
              <p className="text-xs text-black">
                Aceita códigos de missões (REF_xxx) e códigos de campanhas
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Seção: Minhas Indicações */}
      <Card>
        <CardHeader className="pb-4">
          <div 
            className="flex items-center justify-between cursor-pointer"
            onClick={() => setExpandido(!expandido)}
          >
            <CardTitle className="text-lg font-semibold text-black flex items-center gap-2">
              <Users className="w-5 h-5 text-black" />
              Minhas Indicações
            </CardTitle>
            <div className="flex items-center gap-2">
              {stats.total > 0 && (
                <Badge className="bg-yellow-100 text-yellow-700">
                  {stats.completos}/{stats.total}
                </Badge>
              )}
              {expandido ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </div>
          </div>
        </CardHeader>
        
        {expandido && (
          <CardContent>
            {minhasIndicacoes.length === 0 ? (
              <div className="text-center py-6">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Você ainda não indicou ninguém</p>
                <p className="text-sm text-gray-400 mt-1">
                  Compartilhe seu link de indicação nas missões para convidar amigos
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Estatísticas */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="bg-gray-50 rounded-lg p-2 text-center">
                    <p className="text-lg font-bold text-gray-800">{stats.pendentes}</p>
                    <p className="text-xs text-gray-500">Pendentes</p>
                  </div>
                  <div className="bg-yellow-50 rounded-lg p-2 text-center">
                    <p className="text-lg font-bold text-yellow-700">{stats.cadastrados}</p>
                    <p className="text-xs text-yellow-600">Cadastrados</p>
                  </div>
                  <div className="bg-yellow-100 rounded-lg p-2 text-center">
                    <p className="text-lg font-bold text-yellow-700">{stats.completos}</p>
                    <p className="text-xs text-yellow-600">Completos</p>
                  </div>
                </div>

                {/* Lista de indicações */}
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {minhasIndicacoes.map((indicacao) => (
                    <div 
                      key={indicacao.id}
                      className="border rounded-lg p-3 flex items-center justify-between"
                    >
                      <div className="flex-1">
                        {indicacao.indicado ? (
                          <p className="font-medium text-gray-900">{indicacao.indicado.nome}</p>
                        ) : (
                          <p className="text-gray-400 italic">Aguardando cadastro...</p>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          {getStatusBadge(indicacao.status)}
                          {indicacao.status === 'completo' && (
                            <span className="text-xs text-green-600">
                              +{indicacao.gritosRecompensa} gritos
                            </span>
                          )}
                        </div>
                      </div>
                      {indicacao.status === 'pendente' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copiarLink(indicacao.link)}
                          className="text-gray-500"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        )}
      </Card>
    </div>
  );
}
