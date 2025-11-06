import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Check, X, Loader2, Search, QrCode } from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { isAdminEmail } from "@shared/conselho";

interface IngressoPendente {
  id: number;
  txid: string;
  nome: string;
  telefone: string;
  email: string | null;
  quantidade: number;
  valorTotal: number;
  status: string;
  metodoPagamento: string;
  dataPagamento: string;
}

export default function AdminConciliarPix() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [ingressosPendentes, setIngressosPendentes] = useState<IngressoPendente[]>([]);
  const [filtro, setFiltro] = useState("");
  const [confirmando, setConfirmando] = useState<number | null>(null);

  useEffect(() => {
    const email = localStorage.getItem("userEmail") || "";
    const papel = localStorage.getItem("userPapel") || "";
    
    setIsAdmin(papel === "admin" || isAdminEmail(email));
    
    if (papel === "admin" || isAdminEmail(email)) {
      carregarIngressosPendentes();
    } else {
      setIsLoading(false);
    }
  }, []);

  const carregarIngressosPendentes = async () => {
    try {
      const response = await fetch('/api/ingressos/pix/pendentes');
      
      if (response.ok) {
        const data = await response.json();
        setIngressosPendentes(data);
      } else {
        throw new Error('Erro ao carregar ingressos pendentes');
      }
    } catch (error) {
      console.error('Erro ao carregar ingressos pendentes:', error);
      toast({
        title: "Erro ao carregar dados",
        description: "Não foi possível carregar os ingressos pendentes.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const confirmarPagamento = async (txid: string) => {
    const ingresso = ingressosPendentes.find(i => i.txid === txid);
    if (!ingresso) return;
    
    setConfirmando(ingresso.id);
    
    try {
      const response = await fetch('/api/ingressos/pix/confirmar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ txid }),
      });
      
      if (response.ok) {
        const data = await response.json();
        
        toast({
          title: "Pagamento confirmado!",
          description: `Ingresso #${data.numero} confirmado para ${ingresso.nome}`,
        });
        
        // Remover da lista de pendentes
        setIngressosPendentes(prev => prev.filter(i => i.txid !== txid));
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao confirmar pagamento');
      }
    } catch (error) {
      console.error('Erro ao confirmar pagamento:', error);
      toast({
        title: "Erro ao confirmar",
        description: error instanceof Error ? error.message : "Tente novamente",
        variant: "destructive",
      });
    } finally {
      setConfirmando(null);
    }
  };

  const ingressosFiltrados = ingressosPendentes.filter(i => {
    const termo = filtro.toLowerCase();
    return (
      i.txid.toLowerCase().includes(termo) ||
      i.nome.toLowerCase().includes(termo) ||
      i.telefone.includes(termo) ||
      (i.email && i.email.toLowerCase().includes(termo))
    );
  });

  if (!isAdmin) {
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
              <h1 className="text-lg font-bold text-black">Conciliar PIX</h1>
            </div>
          </div>
        </header>

        <main className="max-w-md mx-auto px-4 py-6">
          <Card className="text-center">
            <CardHeader>
              <CardTitle className="text-red-600">Acesso Negado</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Você não tem permissão para acessar esta área.
              </p>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation("/admin-geral")}
              className="p-2"
              data-testid="button-voltar"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-lg font-bold text-black">Conciliação PIX</h1>
              <p className="text-sm text-gray-500">Confirmar pagamentos manuais</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Estatísticas */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <p className="text-3xl font-bold text-yellow-600">{ingressosPendentes.length}</p>
                <p className="text-sm text-gray-600">Pendentes</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-green-600">
                  R$ {(ingressosPendentes.reduce((sum, i) => sum + i.valorTotal, 0) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-sm text-gray-600">Total a Confirmar</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Barra de busca */}
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="Buscar por TXID, nome, telefone ou email..."
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
              className="pl-10"
              data-testid="input-buscar"
            />
          </div>
        </div>

        {/* Lista de ingressos pendentes */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : ingressosFiltrados.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <QrCode className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600">
                {filtro ? "Nenhum ingresso encontrado com este filtro" : "Nenhum ingresso PIX pendente"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {ingressosFiltrados.map((ingresso) => (
              <Card key={ingresso.id} className="border-yellow-200">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <CardTitle className="text-base">{ingresso.nome}</CardTitle>
                        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
                          Pendente
                        </Badge>
                      </div>
                      <CardDescription>
                        <div className="space-y-1 text-sm">
                          <p className="font-mono font-semibold text-yellow-800">TXID: {ingresso.txid}</p>
                          <p>📱 {ingresso.telefone}</p>
                          {ingresso.email && <p>📧 {ingresso.email}</p>}
                        </div>
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-sm text-gray-600">Quantidade: {ingresso.quantidade} ingresso(s)</p>
                      <p className="text-lg font-bold text-green-600">
                        R$ {(ingresso.valorTotal / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div className="text-right text-xs text-gray-500">
                      {new Date(ingresso.dataPagamento).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                  
                  <Button
                    onClick={() => confirmarPagamento(ingresso.txid)}
                    disabled={confirmando === ingresso.id}
                    className="w-full bg-green-500 hover:bg-green-600"
                    data-testid={`button-confirmar-${ingresso.txid}`}
                  >
                    {confirmando === ingresso.id ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Confirmando...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Confirmar Pagamento
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
