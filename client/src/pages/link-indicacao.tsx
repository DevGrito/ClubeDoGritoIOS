import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ArrowLeft, Link as LinkIcon, CheckCircle2, AlertCircle } from "lucide-react";
import Logo from "@/components/logo";
import BottomNavigation from "@/components/bottom-navigation";

export default function LinkIndicacao() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [linkInput, setLinkInput] = useState("");

  // Buscar se já tem indicação registrada
  const { data: indicacaoData, isLoading } = useQuery<{
    hasIndicacao: boolean;
    referrerName?: string;
    referrerCode?: string;
  }>({
    queryKey: ['/api/indicacoes/minha-indicacao'],
  });

  // Mutation para salvar o link de indicação
  const saveMutation = useMutation({
    mutationFn: async (link: string) => {
      return apiRequest('/api/indicacoes/salvar-link', {
        method: 'POST',
        body: JSON.stringify({ link }),
        headers: { 'Content-Type': 'application/json' },
      });
    },
    onSuccess: () => {
      toast({
        title: "Link registrado!",
        description: "Obrigado! Seu link de indicação foi salvo com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/indicacoes/minha-indicacao'] });
      setLinkInput("");
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao salvar",
        description: error.message || "Não foi possível salvar o link. Verifique se está correto.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkInput.trim()) {
      toast({
        title: "Link vazio",
        description: "Por favor, cole o link que você recebeu.",
        variant: "destructive",
      });
      return;
    }
    saveMutation.mutate(linkInput.trim());
  };

  return (
    <div className="min-h-screen bg-white pb-20">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="px-4 py-3 flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/perfil")}
            data-testid="button-back"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <Logo size="md" />
          <div className="w-10" />
        </div>
      </header>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Card Principal */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LinkIcon className="w-5 h-5 text-purple-600" />
              Link de Indicação
            </CardTitle>
            <CardDescription>
              Se você entrou no Clube do Grito através do link de outra pessoa, informe aqui para que ela ganhe pontos!
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <p className="text-sm text-gray-500">Carregando...</p>
            ) : indicacaoData?.hasIndicacao ? (
              // Já tem indicação registrada
              <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-semibold text-green-900 dark:text-green-100">
                      Link já registrado!
                    </p>
                    <p className="text-sm text-green-700 dark:text-green-300">
                      Você foi indicado por: <strong>{indicacaoData.referrerName || "Doador"}</strong>
                    </p>
                    {indicacaoData.referrerCode && (
                      <p className="text-xs text-green-600 dark:text-green-400 font-mono">
                        Código: {indicacaoData.referrerCode}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              // Ainda não tem indicação - mostrar formulário
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="link-input">Cole o link que você recebeu:</Label>
                  <Input
                    id="link-input"
                    type="text"
                    placeholder="https://clubedogrito.institutoogrito.com.br/?ref=..."
                    value={linkInput}
                    onChange={(e) => setLinkInput(e.target.value)}
                    disabled={saveMutation.isPending}
                    data-testid="input-referral-link"
                  />
                  <p className="text-xs text-gray-500">
                    Exemplo: https://clubedogrito.institutoogrito.com.br/?ref=MARIA123
                  </p>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={saveMutation.isPending || !linkInput.trim()}
                  data-testid="button-submit"
                >
                  {saveMutation.isPending ? "Salvando..." : "Salvar Link"}
                </Button>
              </form>
            )}

            {/* Instruções */}
            <div className="bg-purple-50 dark:bg-purple-950 p-4 rounded-lg space-y-2 border border-purple-200 dark:border-purple-800">
              <h4 className="font-semibold text-purple-900 dark:text-purple-100 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Por que informar?
              </h4>
              <ul className="text-sm space-y-1 text-purple-800 dark:text-purple-200 ml-6 list-disc">
                <li>A pessoa que te indicou ganha pontos quando você faz sua primeira doação</li>
                <li>Você só pode informar o link UMA VEZ</li>
                <li>Certifique-se de colar o link correto</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      <BottomNavigation />
    </div>
  );
}
