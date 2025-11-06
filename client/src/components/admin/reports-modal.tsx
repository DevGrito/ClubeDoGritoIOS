import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { FileText, Download, Users, TrendingUp, DollarSign, Activity } from "lucide-react";

interface ReportData {
  totalUsers: number;
  verifiedUsers: number;
  usersByRole: Record<string, number>;
  recentRegistrations: number;
  activeUsers: number;
  revenue: number;
  subscriptions: Record<string, number>;
}

export default function ReportsModal() {
  const [open, setOpen] = useState(false);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const loadReportData = async () => {
    setIsLoading(true);
    try {
      const response = await apiRequest("GET", "/api/admin/reports");
      const data = await response.json();
      setReportData(data);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível carregar os relatórios.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      loadReportData();
    }
  }, [open]);

  const exportReport = async (format: 'pdf' | 'excel') => {
    try {
      const response = await apiRequest("POST", "/api/admin/export-report", { format });
      const blob = await response.blob();
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `relatorio_completo.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
      document.body.appendChild(a);
      a.click();
      // Safe removal with mobile compatibility
      if (a.parentNode) {
        a.parentNode.removeChild(a);
      }
      window.URL.revokeObjectURL(url);

      toast({
        title: "Relatório exportado",
        description: `Relatório exportado em ${format.toUpperCase()} com sucesso.`,
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível exportar o relatório.",
        variant: "destructive",
      });
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Card className="cursor-pointer hover:shadow-md transition-shadow border-l-4 border-l-yellow-400">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-teal-500 hover:bg-teal-600 rounded-lg flex items-center justify-center text-white">
                <FileText className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-black text-sm">
                  Ver Todos os Relatórios
                </h4>
                <p className="text-xs text-gray-600 mt-1">
                  Acessar todos os relatórios do sistema
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <FileText className="w-5 h-5" />
            <span>Relatórios Completos</span>
          </DialogTitle>
        </DialogHeader>
        
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
            <p className="text-sm text-gray-600 mt-2">Carregando relatórios...</p>
          </div>
        ) : reportData ? (
          <div className="space-y-6">
            {/* Export Actions */}
            <div className="flex gap-2">
              <Button
                onClick={() => exportReport('pdf')}
                className="flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Exportar PDF</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => exportReport('excel')}
                className="flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Exportar Excel</span>
              </Button>
            </div>

            {/* Overview Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Users className="w-8 h-8 text-blue-500" />
                    <div>
                      <p className="text-2xl font-bold">{reportData.totalUsers}</p>
                      <p className="text-sm text-gray-600">Total Usuários</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Activity className="w-8 h-8 text-green-500" />
                    <div>
                      <p className="text-2xl font-bold">{reportData.verifiedUsers}</p>
                      <p className="text-sm text-gray-600">Verificados</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="w-8 h-8 text-purple-500" />
                    <div>
                      <p className="text-2xl font-bold">{reportData.recentRegistrations}</p>
                      <p className="text-sm text-gray-600">Novos (30 dias)</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="w-8 h-8 text-yellow-500" />
                    <div>
                      <p className="text-2xl font-bold">{formatCurrency(reportData.revenue)}</p>
                      <p className="text-sm text-gray-600">Receita</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Users by Role */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Usuários por Papel</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(reportData.usersByRole).map(([role, count]) => (
                    <div key={role} className="text-center">
                      <Badge className="mb-2">{role}</Badge>
                      <p className="text-xl font-bold">{count}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Subscriptions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Assinaturas por Plano</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  {Object.entries(reportData.subscriptions).map(([plan, count]) => (
                    <div key={plan} className="text-center">
                      <div className="mb-2">
                        <Badge 
                          className={
                            plan === 'eco' ? 'bg-green-100 text-green-800' :
                            plan === 'voz' ? 'bg-blue-100 text-blue-800' :
                            'bg-purple-100 text-purple-800'
                          }
                        >
                          {plan.toUpperCase()}
                        </Badge>
                      </div>
                      <p className="text-xl font-bold">{count}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Last Update */}
            <div className="text-center text-sm text-gray-500">
              Última atualização: {new Date().toLocaleString('pt-BR')}
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            Erro ao carregar relatórios
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}