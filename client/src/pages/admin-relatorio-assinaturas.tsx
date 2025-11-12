import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CheckCircle2, XCircle, CreditCard, Calendar, User, Mail, Phone, DollarSign, FileText, Download } from "lucide-react";

interface DonorReport {
  id: number;
  userId: number | null;
  nome: string | null;
  email: string | null;
  telefone: string | null;
  plano: string;
  valor: string;
  stripeSubscriptionId: string | null;
  stripePaymentIntentId: string | null;
  status: string;
  ativo: boolean;
  dataDoacaoInicial: string;
  createdAt: string;
  hasRecurring: boolean;
}

interface ReportSummary {
  totalDoadores: number;
  comSubscription: number;
  semSubscription: number;
  doadores: DonorReport[];
}

export default function AdminRelatorioAssinaturas() {
  const [showOnlyRecurring, setShowOnlyRecurring] = useState(false);

  const { data: report, isLoading } = useQuery<ReportSummary>({
    queryKey: ['/api/admin/donors/subscription-report']
  });

  const exportToCSV = () => {
    if (!report) return;

    const headers = ['ID', 'Nome', 'Email', 'Telefone', 'Plano', 'Valor Mensal', 'Tipo', 'Subscription ID', 'Status', 'Data Cadastro'];
    const rows = report.doadores.map(d => [
      d.id,
      d.nome || 'N/A',
      d.email || 'N/A',
      d.telefone || 'N/A',
      d.plano.toUpperCase(),
      `R$ ${parseFloat(d.valor).toFixed(2)}`,
      d.hasRecurring ? 'RECORRENTE' : 'PAGAMENTO ÚNICO',
      d.stripeSubscriptionId || 'N/A',
      d.status,
      new Date(d.createdAt).toLocaleDateString('pt-BR')
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `relatorio-assinaturas-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const filteredDonors = report?.doadores.filter(d => 
    showOnlyRecurring ? d.hasRecurring : true
  ) || [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Carregando relatório...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-8">
        <div className="max-w-7xl mx-auto">
          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="text-red-600">Erro ao carregar relatório</CardTitle>
            </CardHeader>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Relatório de Assinaturas</h1>
            <p className="text-gray-600 mt-2">Visualize todos os doadores e status de pagamento recorrente</p>
          </div>
          <Button onClick={exportToCSV} variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Exportar CSV
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Total de Doadores</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{report.totalDoadores}</div>
              <p className="text-xs text-gray-500 mt-1">Doadores ativos e pagos</p>
            </CardContent>
          </Card>

          <Card className="border-green-200 bg-green-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-green-700">Com Assinatura Recorrente</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{report.comSubscription}</div>
              <p className="text-xs text-green-600 mt-1">Cobrança automática ativa</p>
            </CardContent>
          </Card>

          <Card className="border-orange-200 bg-orange-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-orange-700">Pagamento Único</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">{report.semSubscription}</div>
              <p className="text-xs text-orange-600 mt-1">Sem cobrança recorrente</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Lista Completa de Doadores</CardTitle>
                <CardDescription>Detalhes de cada doador e status de assinatura</CardDescription>
              </div>
              <Button
                variant={showOnlyRecurring ? "default" : "outline"}
                onClick={() => setShowOnlyRecurring(!showOnlyRecurring)}
                size="sm"
              >
                {showOnlyRecurring ? "Mostrar Todos" : "Apenas Recorrentes"}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredDonors.map((donor, index) => (
                <div key={donor.id}>
                  {index > 0 && <Separator className="my-4" />}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center h-10 w-10 rounded-full bg-purple-100">
                          <User className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {donor.nome || 'Nome não informado'}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant={donor.hasRecurring ? "default" : "secondary"}>
                              {donor.plano.toUpperCase()}
                            </Badge>
                            {donor.hasRecurring ? (
                              <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Recorrente
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-orange-600 border-orange-300">
                                <XCircle className="h-3 w-3 mr-1" />
                                Pagamento Único
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        {donor.email && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <Mail className="h-4 w-4" />
                            <span>{donor.email}</span>
                          </div>
                        )}
                        {donor.telefone && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <Phone className="h-4 w-4" />
                            <span>{donor.telefone}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-gray-600">
                          <DollarSign className="h-4 w-4" />
                          <span className="font-semibold">R$ {parseFloat(donor.valor).toFixed(2)}/mês</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <Calendar className="h-4 w-4" />
                          <span>Desde {new Date(donor.createdAt).toLocaleDateString('pt-BR')}</span>
                        </div>
                      </div>

                      {donor.stripeSubscriptionId && (
                        <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 p-2 rounded">
                          <CreditCard className="h-3 w-3" />
                          <span className="font-mono">{donor.stripeSubscriptionId}</span>
                        </div>
                      )}

                      {!donor.hasRecurring && donor.stripePaymentIntentId && (
                        <div className="flex items-center gap-2 text-xs text-orange-600 bg-orange-50 p-2 rounded">
                          <FileText className="h-3 w-3" />
                          <span className="font-mono">{donor.stripePaymentIntentId}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filteredDonors.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                Nenhum doador encontrado com os filtros aplicados.
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-900">ℹ️ Como Funciona a Cobrança Recorrente</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-blue-800 space-y-2">
            <p><strong>✅ Com Assinatura Recorrente:</strong> O Stripe cobra automaticamente todo mês usando o cartão salvo do doador.</p>
            <p><strong>⚠️ Pagamento Único:</strong> Foi pago apenas uma vez. Para ativar cobrança recorrente, use a ferramenta de migração em /admin/migrate-donors</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
