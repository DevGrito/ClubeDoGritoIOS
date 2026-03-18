import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Clock, RefreshCw, User, Mail } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface ConselhoEntry {
  id: number;
  email: string;
  nome: string | null;
  tipo: string | null;
  ativo: boolean;
  createdAt: string;
}

interface ConselhoData {
  pendentes: ConselhoEntry[];
  aprovados: ConselhoEntry[];
  recusados: ConselhoEntry[];
}

interface ConselhoApprovalManagerProps {
  approverName: string;
}

export default function ConselhoApprovalManager({ approverName }: ConselhoApprovalManagerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading, refetch } = useQuery<ConselhoData>({
    queryKey: ["/api/admin/conselho-requests"],
    refetchInterval: 10000,
  });

  const approvalMutation = useMutation({
    mutationFn: async ({ email, action }: { email: string; action: "approve" | "reject" }) => {
      return await apiRequest("/api/admin/conselho-approve", {
        method: "POST",
        body: JSON.stringify({
          email,
          action,
          approvedBy: approverName,
        }),
      });
    },
    onSuccess: (_, variables) => {
      toast({
        title: variables.action === "approve" ? "Conselheiro aprovado!" : "Solicitação recusada!",
        description: variables.action === "approve"
          ? "O e-mail foi adicionado à lista de conselheiros autorizados."
          : "A solicitação foi removida.",
        variant: variables.action === "approve" ? "default" : "destructive",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/conselho-requests"] });
    },
    onError: () => {
      toast({
        title: "Erro ao processar solicitação",
        description: "Ocorreu um erro. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
            <span className="ml-2 text-gray-600">Carregando solicitações...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const pendentes = data?.pendentes || [];
  const aprovados = data?.aprovados || [];
  const recusados = data?.recusados || [];

  return (
    <div className="space-y-4 sm:space-y-6">
      <Card>
        <CardHeader className="pb-3 sm:pb-6">
          <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
              <span className="text-base sm:text-lg">Aprovações do Conselho</span>
            </div>
            <Button
              onClick={() => refetch()}
              variant="outline"
              size="sm"
              disabled={isLoading}
              className="self-start"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-3 gap-3 sm:gap-4">
            <div className="text-center">
              <div className="text-lg sm:text-2xl font-bold text-yellow-600">
                {pendentes.length}
              </div>
              <div className="text-xs sm:text-sm text-gray-500">Pendentes</div>
            </div>
            <div className="text-center">
              <div className="text-lg sm:text-2xl font-bold text-green-600">
                {aprovados.length}
              </div>
              <div className="text-xs sm:text-sm text-gray-500">Aprovados</div>
            </div>
            <div className="text-center">
              <div className="text-lg sm:text-2xl font-bold text-red-600">
                {recusados.length}
              </div>
              <div className="text-xs sm:text-sm text-gray-500">Recusados</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3 sm:pb-6">
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600" />
            <span className="text-base sm:text-lg">Solicitações Pendentes</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="max-h-[60vh] overflow-y-auto">
            {pendentes.length === 0 ? (
              <div className="text-center py-8 sm:py-12">
                <Clock className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 text-sm sm:text-base">Nenhuma solicitação pendente</p>
                <p className="text-xs sm:text-sm text-gray-400 mt-2 max-w-md mx-auto px-4">
                  Quando alguém tentar entrar como conselho com um e-mail não cadastrado, a solicitação aparecerá aqui
                </p>
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {pendentes.map((request) => (
                  <div
                    key={request.id}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 border rounded-lg hover:bg-gray-50 transition-colors space-y-3 sm:space-y-0"
                  >
                    <div className="flex items-center space-x-3 sm:space-x-4">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 text-sm sm:text-base truncate">
                          {request.nome || "Nome não informado"}
                        </h4>
                        <div className="flex items-center gap-1 text-xs sm:text-sm text-gray-500 mt-1">
                          <Mail className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{request.email}</span>
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          Solicitado em: {new Date(request.createdAt).toLocaleString('pt-BR')}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
                      <Badge variant="outline" className="text-yellow-600 border-yellow-300 self-start sm:self-center">
                        <Clock className="w-3 h-3 mr-1" />
                        Pendente
                      </Badge>
                      <div className="flex space-x-2">
                        <Button
                          onClick={() => approvalMutation.mutate({ email: request.email, action: "approve" })}
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 flex-1 sm:flex-none"
                          disabled={approvalMutation.isPending}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          <span className="text-xs sm:text-sm">Aprovar</span>
                        </Button>
                        <Button
                          onClick={() => approvalMutation.mutate({ email: request.email, action: "reject" })}
                          size="sm"
                          variant="destructive"
                          className="flex-1 sm:flex-none"
                          disabled={approvalMutation.isPending}
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          <span className="text-xs sm:text-sm">Recusar</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {aprovados.length > 0 && (
        <Card>
          <CardHeader className="pb-3 sm:pb-6">
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
              <span className="text-base sm:text-lg">Conselheiros Aprovados ({aprovados.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="max-h-[40vh] overflow-y-auto space-y-2">
              {aprovados.map((c) => (
                <div key={c.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{c.nome || c.email}</p>
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <Mail className="w-3 h-3" /> {c.email}
                      </p>
                    </div>
                  </div>
                  <Badge className="bg-green-100 text-green-700 border-green-300">Ativo</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {recusados.length > 0 && (
        <Card>
          <CardHeader className="pb-3 sm:pb-6">
            <CardTitle className="flex items-center gap-2">
              <XCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
              <span className="text-base sm:text-lg">Recusados ({recusados.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="max-h-[40vh] overflow-y-auto space-y-2">
              {recusados.map((c) => (
                <div key={c.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-red-600" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{c.nome || c.email}</p>
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <Mail className="w-3 h-3" /> {c.email}
                      </p>
                    </div>
                  </div>
                  <Badge className="bg-red-100 text-red-700 border-red-300">Recusado</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
