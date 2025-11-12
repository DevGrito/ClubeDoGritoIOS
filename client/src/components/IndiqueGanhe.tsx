import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Copy, Share2, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Indicacao {
  id: number;
  status: string;
  criadaEm: string;
  confirmadaEm: string | null;
  validade: string;
  indicado?: {
    nome: string | null;
    telefone: string | null;
  };
}

export function IndiqueGanhe() {
  const { toast } = useToast();

  // Buscar meu link de indicação
  const { data: linkData, isLoading: isLoadingLink, error: linkError } = useQuery<{ link: string }>({
    queryKey: ['/api/indicacoes/meu-link'],
  });

  // Buscar minhas indicações
  const { data: indicacoes = [] } = useQuery<Indicacao[]>({
    queryKey: ['/api/indicacoes/minhas'],
  });

  // Buscar saldo de pontos
  const { data: saldoData } = useQuery<{ saldo: number }>({
    queryKey: ['/api/indicacao-pontos/saldo'],
  });

  const shareUrl = linkData?.link || '';
  const saldo = saldoData?.saldo || 0;

  // Log de debug
  console.log('🔍 [INDIQUE-GANHE] linkData:', linkData, 'isLoading:', isLoadingLink, 'error:', linkError);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copiado!",
      description: "Link copiado para a área de transferência",
    });
  };

  const shareLink = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Clube do Grito - Instituto O Grito',
          text: 'Junte-se a mim no Clube do Grito e faça parte da transformação social!',
          url: shareUrl,
        });
      } catch (err) {
        console.log('Compartilhamento cancelado');
      }
    } else {
      copyToClipboard(shareUrl);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CONFIRMADA':
        return <Badge className="bg-green-500"><CheckCircle2 className="w-3 h-3 mr-1" /> Confirmada</Badge>;
      case 'PENDENTE':
        return <Badge className="bg-yellow-500"><Clock className="w-3 h-3 mr-1" /> Pendente</Badge>;
      case 'EXPIRADA':
        return <Badge variant="secondary"><XCircle className="w-3 h-3 mr-1" /> Expirada</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  return (
    <div className="space-y-6">
      {/* Card Principal */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Indique e Ganhe</span>
            <Badge className="bg-yellow-500 text-white">
              {saldo} {saldo === 1 ? 'ponto' : 'pontos'}
            </Badge>
          </CardTitle>
          <CardDescription>
            Compartilhe seu link único e ganhe pontos quando seus amigos fizerem a primeira doação!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Link para compartilhar */}
          {isLoadingLink ? (
            <div className="flex items-center justify-center p-4">
              <div className="text-sm text-muted-foreground">Carregando seu link...</div>
            </div>
          ) : linkError ? (
            <div className="bg-red-50 dark:bg-red-950 p-4 rounded-lg">
              <p className="text-sm text-red-800 dark:text-red-200">
                Erro ao carregar link de indicação. Tente atualizar a página.
              </p>
            </div>
          ) : shareUrl ? (
            <div className="space-y-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Link de indicação:</label>
                <div className="flex gap-2">
                  <Input
                    value={shareUrl}
                    readOnly
                    className="text-sm"
                    data-testid="input-share-url"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(shareUrl)}
                    data-testid="button-copy-link"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <Button
                variant="default"
                onClick={shareLink}
                className="w-full bg-red-800 hover:bg-red-900"
                data-testid="button-share"
              >
                <Share2 className="h-4 w-4 mr-2" />
                Compartilhar
              </Button>
            </div>
          ) : (
            <div className="bg-yellow-50 dark:bg-yellow-950 p-4 rounded-lg">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                Seu link de indicação será gerado automaticamente. Recarregue a página.
              </p>
            </div>
          )}

          {/* Instruções */}
          <div className="bg-yellow-50 dark:bg-yellow-950 p-4 rounded-lg space-y-2">
            <h4 className="font-semibold text-yellow-900 dark:text-yellow-100">Como funciona?</h4>
            <ol className="text-sm space-y-1 text-yellow-800 dark:text-yellow-200">
              <li>1. Compartilhe seu link com amigos</li>
              <li>2. Quando se cadastrarem usando seu link</li>
              <li>3. E fizerem a primeira doação (em até 30 dias)</li>
              <li>4. Você ganha 1 ponto de indicação! 🎉</li>
            </ol>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Indicações */}
      {indicacoes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Minhas Indicações ({indicacoes.length})</CardTitle>
            <CardDescription>
              Acompanhe o status das pessoas que você indicou
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {indicacoes.map((indicacao) => (
                <div
                  key={indicacao.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                  data-testid={`indicacao-${indicacao.id}`}
                >
                  <div className="space-y-1">
                    <p className="font-medium">
                      {indicacao.indicado?.nome || 'Nome não informado'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Indicado em {formatDate(indicacao.criadaEm)}
                    </p>
                    {indicacao.status === 'PENDENTE' && (
                      <p className="text-xs text-yellow-600">
                        Válido até {formatDate(indicacao.validade)}
                      </p>
                    )}
                    {indicacao.confirmadaEm && (
                      <p className="text-xs text-green-600">
                        Confirmado em {formatDate(indicacao.confirmadaEm)}
                      </p>
                    )}
                  </div>
                  <div>
                    {getStatusBadge(indicacao.status)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
