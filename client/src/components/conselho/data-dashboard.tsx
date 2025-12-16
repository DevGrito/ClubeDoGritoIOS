import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  DollarSign, 
  Target, 
  FileText,
  Download,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Eye
} from "lucide-react";

// Interface para dados do Omie ERP
interface OmieData {
  timestamp: string;
  status: string;
  projetos: {
    projeto_cadastro_result?: Array<{
      codigo_projeto?: string;
      nome_projeto?: string;
      descricao?: string;
      status?: string;
    }>;
  };
  categorias: {
    categoria_cadastro_result?: Array<{
      codigo_categoria?: string;
      nome_categoria?: string;
      tipo_categoria?: string;
    }>;
  };
  contasPagar: {
    conta_pagar_result?: Array<{
      codigo_lancamento_omie?: string;
      numero_documento?: string;
      valor_documento?: number;
      data_vencimento?: string;
      status_titulo?: string;
    }>;
  };
  contasReceber: {
    conta_receber_result?: Array<{
      codigo_lancamento_omie?: string;
      numero_documento?: string;
      valor_documento?: number;
      data_vencimento?: string;
      status_titulo?: string;
    }>;
  };
  lancamentosContaCorrente: any;
  resumoFinanceiro: any;
  statusChamadas: {
    projetos: string;
    categorias: string;
    contasPagar: string;
    contasReceber: string;
    lancamentosContaCorrente: string;
    resumoFinanceiro: string;
  };
}

export default function DataDashboard() {
  const [omieData, setOmieData] = useState<OmieData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<string>("");
  const [selectedProject, setSelectedProject] = useState<any | null>(null);
  const { toast } = useToast();

  const loadData = async () => {
    setIsLoading(true);
    try {
      
      let omieResponse;
      
      try {
        // Tentar primeiro com apiRequest (funciona para usuários autenticados)
        const response = await apiRequest("GET", "/api/conselho");
        omieResponse = response;
      } catch (authError) {
        // Se falhar, tentar com fetch direto (funciona para dev access)
        const response = await fetch("/api/conselho");
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        omieResponse = await response.json();
      }
      
      
      // Sempre definir os dados, mesmo que parciais
      setOmieData(omieResponse);
      setLastUpdate(new Date().toLocaleString('pt-BR'));
      
      // Verificar se há APIs que falharam e mostrar aviso sutil
      const statusChamadas = omieResponse?.statusChamadas || {};
      const apisComErro = Object.entries(statusChamadas)
        .filter(([_, status]) => status === 'error')
        .map(([api, _]) => api);
      
      if (apisComErro.length > 0) {
      }
    } catch (error) {
      // Só mostrar erro se for um erro de rede real
      toast({
        title: "Erro de Conexão",
        description: "Não foi possível conectar ao servidor. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);


  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  if (!omieData) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Nenhum dado disponível no momento</p>
        <button 
          onClick={loadData}
          className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Tentar Novamente
        </button>
      </div>
    );
  }

  // Função para calcular métricas dos dados do Omie
  const calcularMetricas = () => {
    // Estrutura correta baseada na resposta real da API Omie
    const projetos = omieData?.projetos?.cadastro || [];
    const categorias = omieData?.categorias?.categoria_cadastro || [];
    const contasPagar = omieData?.contasPagar?.conta_pagar_cadastro || [];
    const contasReceber = omieData?.contasReceber?.conta_receber_cadastro || [];

    // Se há projeto selecionado, filtrar dados por projeto
    // IMPORTANTE: Apenas contas a pagar têm ligação com projetos no Omie
    const contasPagarFiltradas = selectedProject 
      ? contasPagar.filter(conta => String(conta.codigo_projeto) === String(selectedProject.codigo))
      : contasPagar;
    
    // Contas a receber NÃO têm campo codigo_projeto na API do Omie
    const contasReceberFiltradas = selectedProject 
      ? [] // Sempre vazio para projeto específico
      : contasReceber;

    const totalContasPagar = contasPagarFiltradas.reduce((sum, conta) => sum + (conta.valor_documento || 0), 0);
    const totalContasReceber = contasReceberFiltradas.reduce((sum, conta) => sum + (conta.valor_documento || 0), 0);
    const saldoLiquido = totalContasReceber - totalContasPagar;

    return {
      totalProjetos: projetos.length,
      totalCategorias: categorias.length,
      totalContasPagar,
      totalContasReceber,
      saldoLiquido,
      projetos,
      categorias,
      contasPagar: contasPagarFiltradas,
      contasReceber: contasReceberFiltradas
    };
  };

  const metricas = calcularMetricas();

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-black">
            {selectedProject 
              ? `📊 Dashboard Projeto: ${selectedProject.nome || selectedProject.codigo || 'Projeto'}`
              : '📊 Dashboard Omie ERP'
            }
          </h2>
          <p className="text-sm text-gray-600">Última atualização: {lastUpdate}</p>
          <div className="flex gap-2 mt-2">
            <Badge className="bg-green-100 text-green-800">
              ✅ Projetos: {omieData?.statusChamadas?.projetos === 'fulfilled' ? 'OK' : 'Erro'}
            </Badge>
            <Badge className="bg-blue-100 text-blue-800">
              ✅ Categorias: {omieData?.statusChamadas?.categorias === 'fulfilled' ? 'OK' : 'Erro'}
            </Badge>
            <Badge className="bg-purple-100 text-purple-800">
              ✅ Financeiro: {omieData?.statusChamadas?.contasPagar === 'fulfilled' ? 'OK' : 'Erro'}
            </Badge>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            disabled={isLoading}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center">
              <Target className="w-5 h-5 mr-2 text-blue-600" />
              Projetos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{metricas.totalProjetos}</div>
              <div className="text-sm text-gray-600">projetos ativos</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center">
              <FileText className="w-5 h-5 mr-2 text-green-600" />
              Categorias
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{metricas.totalCategorias}</div>
              <div className="text-sm text-gray-600">categorias</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center">
              <TrendingDown className="w-5 h-5 mr-2 text-red-600" />
              Contas Pagar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{formatCurrency(metricas.totalContasPagar)}</div>
              <div className="text-sm text-gray-600">{metricas.contasPagar.length} títulos</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-green-600" />
              Contas Receber
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{formatCurrency(metricas.totalContasReceber)}</div>
              <div className="text-sm text-gray-600">{metricas.contasReceber.length} títulos</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Saldo Líquido */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <DollarSign className="w-5 h-5 mr-2" />
            Saldo Líquido
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            <div className={`text-4xl font-bold ${metricas.saldoLiquido >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(metricas.saldoLiquido)}
            </div>
            <div className="text-sm text-gray-600 mt-2">
              {metricas.saldoLiquido >= 0 ? '📈 Resultado positivo' : '📉 Resultado negativo'}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Projeto Selecionado ou Lista de Projetos */}
      {selectedProject ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center">
                <Target className="w-5 h-5 mr-2" />
                📋 Detalhes do Projeto: {selectedProject.nome || selectedProject.descricao || 'Projeto sem nome'}
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedProject(null)}
              >
                ← Voltar à Lista
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Informações do Projeto */}
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm font-medium text-gray-700">Nome</div>
                    <div className="text-lg font-semibold">{selectedProject.nome || 'N/A'}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-700">Código</div>
                    <div className="text-lg font-mono">{selectedProject.codigo || 'N/A'}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-700">Status</div>
                    <Badge className={selectedProject.inativo === 'N' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                      {selectedProject.inativo === 'N' ? '✅ Ativo' : '❌ Inativo'}
                    </Badge>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-700">Descrição</div>
                    <div className="text-sm">{selectedProject.descricao || 'Sem descrição'}</div>
                  </div>
                </div>
              </div>

              {/* Métricas Financeiras do Projeto */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-red-50 rounded-lg text-center">
                  <div className="text-lg font-bold text-red-600">{formatCurrency(metricas.totalContasPagar)}</div>
                  <div className="text-sm text-gray-600">Contas a Pagar</div>
                  <div className="text-xs text-gray-500">{metricas.contasPagar.length} títulos</div>
                </div>
                <div className="p-4 bg-green-50 rounded-lg text-center">
                  <div className="text-lg font-bold text-green-600">{formatCurrency(metricas.totalContasReceber)}</div>
                  <div className="text-sm text-gray-600">Contas a Receber</div>
                  <div className="text-xs text-gray-500">{metricas.contasReceber.length} títulos</div>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg text-center">
                  <div className={`text-lg font-bold ${metricas.saldoLiquido >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(metricas.saldoLiquido)}
                  </div>
                  <div className="text-sm text-gray-600">Saldo Líquido</div>
                  <div className="text-xs text-gray-500">{metricas.saldoLiquido >= 0 ? 'Positivo' : 'Negativo'}</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        metricas.projetos.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Target className="w-5 h-5 mr-2" />
                🎯 Selecionar Projeto ({metricas.projetos.length} disponíveis)
              </CardTitle>
              <p className="text-sm text-gray-600 mt-2">Clique em um projeto para ver seus dados financeiros detalhados</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {metricas.projetos.map((projeto, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedProject(projeto)}
                    className="flex items-center justify-between p-3 bg-gray-50 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer border border-gray-200 hover:border-blue-300"
                  >
                    <div className="text-left">
                      <div className="font-medium text-gray-900">{projeto.nome || projeto.descricao || 'Projeto sem nome'}</div>
                      <div className="text-sm text-gray-600">Código: {projeto.codigo || 'N/A'}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge 
                        className={projeto.inativo === 'N' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
                      >
                        {projeto.inativo === 'N' ? 'Ativo' : 'Inativo'}
                      </Badge>
                      <Eye className="w-4 h-4 text-gray-400" />
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )
      )}

      {/* Contas Pendentes - apenas quando não há projeto selecionado */}
      {!selectedProject && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {metricas.contasPagar.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center text-red-600">
                  <TrendingDown className="w-5 h-5 mr-2" />
                  Contas a Pagar (Visão Geral)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {metricas.contasPagar.slice(0, 5).map((conta, index) => (
                    <div key={index} className="flex justify-between items-center p-2 bg-red-50 rounded">
                      <div>
                        <div className="text-sm font-medium">{conta.numero_documento || 'N/A'}</div>
                        <div className="text-xs text-gray-600">{conta.data_vencimento || 'N/A'}</div>
                        <div className="text-xs text-gray-500">Projeto: {conta.codigo_projeto || 'N/A'}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-red-600">
                          {formatCurrency(conta.valor_documento || 0)}
                        </div>
                        <div className="text-xs text-gray-600">{conta.status_titulo || 'N/A'}</div>
                      </div>
                    </div>
                  ))}
                  {metricas.contasPagar.length > 5 && (
                    <div className="text-xs text-gray-500 text-center pt-2">
                      + {metricas.contasPagar.length - 5} contas adicionais
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {metricas.contasReceber.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center text-green-600">
                  <TrendingUp className="w-5 h-5 mr-2" />
                  Contas a Receber (Visão Geral)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {metricas.contasReceber.slice(0, 5).map((conta, index) => (
                    <div key={index} className="flex justify-between items-center p-2 bg-green-50 rounded">
                      <div>
                        <div className="text-sm font-medium">{conta.numero_documento || 'N/A'}</div>
                        <div className="text-xs text-gray-600">{conta.data_vencimento || 'N/A'}</div>
                        <div className="text-xs text-gray-500">Projeto: {conta.codigo_projeto || 'N/A'}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-green-600">
                          {formatCurrency(conta.valor_documento || 0)}
                        </div>
                        <div className="text-xs text-gray-600">{conta.status_titulo || 'N/A'}</div>
                      </div>
                    </div>
                  ))}
                  {metricas.contasReceber.length > 5 && (
                    <div className="text-xs text-gray-500 text-center pt-2">
                      + {metricas.contasReceber.length - 5} contas adicionais
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Dados Financeiros Detalhados do Projeto Selecionado */}
      {selectedProject && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Contas a Pagar do Projeto */}
          {metricas.contasPagar.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center text-red-600">
                  <TrendingDown className="w-5 h-5 mr-2" />
                  Contas a Pagar - {selectedProject.nome || selectedProject.codigo}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {metricas.contasPagar.map((conta, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-red-50 rounded border">
                      <div>
                        <div className="text-sm font-medium">{conta.numero_documento || 'N/A'}</div>
                        <div className="text-xs text-gray-600">{conta.data_vencimento || 'N/A'}</div>
                        <div className="text-xs text-gray-500">Projeto: {conta.codigo_projeto || 'N/A'}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-red-600">
                          {formatCurrency(conta.valor_documento || 0)}
                        </div>
                        <div className="text-xs text-gray-600">{conta.status_titulo || 'N/A'}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center text-red-600">
                  <TrendingDown className="w-5 h-5 mr-2" />
                  Contas a Pagar - {selectedProject.nome || selectedProject.codigo}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  📄 Nenhuma conta a pagar encontrada para este projeto
                </div>
              </CardContent>
            </Card>
          )}

          {/* Contas a Receber do Projeto */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center text-orange-600">
                <TrendingUp className="w-5 h-5 mr-2" />
                Contas a Receber - {selectedProject.nome || selectedProject.codigo}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <div className="text-orange-600 text-4xl mb-4">⚠️</div>
                <div className="text-gray-700 font-medium mb-2">Limitação da API Omie</div>
                <div className="text-sm text-gray-600">
                  As contas a receber não possuem ligação com projetos específicos no sistema Omie.
                  <br />
                  Apenas as <strong>contas a pagar</strong> podem ser filtradas por projeto.
                </div>
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <div className="text-xs text-blue-700">
                    💡 <strong>Dica:</strong> Para ver todas as contas a receber, volte à visão geral clicando no botão "← Voltar à Lista" acima.
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabela Detalhada dos Projetos - apenas quando não há projeto selecionado */}
      {!selectedProject && metricas.projetos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <Target className="w-5 h-5 mr-2 text-blue-600" />
              Tabela Detalhada dos Projetos ({metricas.projetos.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Código</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Nome/Descrição</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Data Criação</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {metricas.projetos.slice(0, 15).map((projeto, index) => (
                    <tr key={index} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-mono text-blue-600 bg-blue-50 px-2 py-1 rounded text-xs">
                          #{projeto.codigo || 'N/A'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="max-w-xs">
                          <div className="font-medium text-gray-900 truncate">
                            {projeto.nome || projeto.descricao || 'Nome não informado'}
                          </div>
                          {projeto.observacoes && (
                            <div className="text-xs text-gray-500 mt-1 truncate">
                              {projeto.observacoes}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge 
                          className={projeto.inativo === 'N' 
                            ? 'bg-green-100 text-green-800 border-green-200' 
                            : 'bg-red-100 text-red-800 border-red-200'}
                        >
                          {projeto.inativo === 'N' ? '✅ Ativo' : '❌ Inativo'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        <div className="text-xs">
                          {projeto.info?.data_inc || 'N/A'}
                          {projeto.info?.hora_inc && (
                            <div className="text-gray-400">{projeto.info.hora_inc}</div>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedProject(projeto)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Ver Finanças
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {metricas.projetos.length > 15 && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg text-center">
                  <span className="text-sm text-blue-700">
                    📋 Mostrando 15 de {metricas.projetos.length} projetos. 
                    Há mais {metricas.projetos.length - 15} projetos não exibidos.
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Status das APIs */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <CheckCircle className="w-5 h-5 mr-2" />
            Status das Integrações Omie
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Object.entries(omieData?.statusChamadas || {}).map(([api, status]) => (
              <div key={api} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium capitalize">{api.replace(/([A-Z])/g, ' $1').trim()}</span>
                <Badge className={status === 'fulfilled' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                  {status === 'fulfilled' ? '✅ OK' : '❌ Erro'}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}