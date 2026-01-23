import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Check, Link as LinkIcon, AlertCircle, UserPlus, Gift, Calendar, CheckCircle2 } from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import BottomNavigation from "@/components/bottom-navigation";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface IndicacaoInfo {
  indicouNome: string | null;
  indicouTelefone: string | null;
  refCodeUsado: string | null;
  status: string | null;
  criadaEm: string | null;
  confirmadaEm: string | null;
}

const formSchema = z.object({
  link: z.string()
    .min(1, "Por favor, cole o link de afiliado")
    .refine((val) => {
      // Aceita tanto link completo quanto apenas o slug
      return val.includes('ref=') || /^[a-z0-9-]+$/.test(val.toLowerCase());
    }, "Link inválido. Use o formato: https://clubedogrito.../plans?ref=nome ou apenas o código")
});

type FormData = z.infer<typeof formSchema>;

export default function LinkAfiliadoCadastro() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Buscar quem me indicou
  const { data: indicacaoInfo, isLoading: isLoadingIndicacao } = useQuery<IndicacaoInfo>({
    queryKey: ['/api/indicacoes/quem-me-indicou'],
  });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      link: ""
    }
  });

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      return await apiRequest("/api/indicacoes/salvar-link-afiliado", {
        method: "POST",
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      toast({
        title: "Salvo!",
        description: "Link de afiliado registrado com sucesso"
      });
      
      // Invalidar cache de dados do usuário
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      
      setTimeout(() => setLocation("/perfil"), 2000);
    },
    onError: (error: any) => {
      // Tratamento específico de erros
      const message = error.message || "Erro ao salvar link";
      
      let description = message;
      if (message.includes("não encontrado")) {
        description = "O código de indicação não foi encontrado. Verifique se está correto.";
      } else if (message.includes("próprio")) {
        description = "Você não pode usar seu próprio link de indicação!";
      } else if (message.includes("já tem")) {
        description = "Você já informou um link de afiliado anteriormente. Ele foi atualizado.";
      }

      toast({
        title: "Atenção",
        description,
        variant: message.includes("já tem") ? "default" : "destructive"
      });
    }
  });

  const onSubmit = (data: FormData) => {
    mutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-white pb-20">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="px-4 py-4 flex items-center">
          <button 
            onClick={() => setLocation("/perfil")} 
            className="mr-4"
            data-testid="button-voltar"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <h1 className="text-lg font-semibold">Link de Afiliado que Usei</h1>
        </div>
      </header>

      {/* Content */}
      <div className="px-4 py-6 space-y-6">
        {/* Seção: Quem me indicou */}
        {isLoadingIndicacao ? (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-center">
                <div className="text-sm text-muted-foreground">Carregando...</div>
              </div>
            </CardContent>
          </Card>
        ) : indicacaoInfo?.indicouNome ? (
          <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-white dark:from-purple-950 dark:to-gray-900">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-purple-900 dark:text-purple-100">
                <Gift className="h-5 w-5" />
                Você foi indicado por
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="h-14 w-14 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold text-xl shrink-0">
                  {indicacaoInfo.indicouNome?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-lg text-purple-900 dark:text-purple-100 truncate">
                    {indicacaoInfo.indicouNome}
                  </h3>
                  {indicacaoInfo.indicouTelefone && (
                    <p className="text-sm text-purple-700 dark:text-purple-300">
                      📱 {indicacaoInfo.indicouTelefone}
                    </p>
                  )}
                  {indicacaoInfo.status === 'CONFIRMADA' ? (
                    <Badge className="bg-green-500 mt-2">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Indicação Confirmada
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="mt-2">Pendente</Badge>
                  )}
                </div>
              </div>

              {indicacaoInfo.refCodeUsado && (
                <div className="pt-3 border-t border-purple-200 dark:border-purple-800 space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-purple-700 dark:text-purple-300">Código usado:</span>
                    <code className="bg-white dark:bg-gray-800 px-2 py-1 rounded font-mono text-xs">
                      {indicacaoInfo.refCodeUsado}
                    </code>
                  </div>
                  {indicacaoInfo.criadaEm && (
                    <div className="flex items-center justify-between">
                      <span className="text-purple-700 dark:text-purple-300 flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Indicado em:
                      </span>
                      <span className="font-medium">{formatDate(indicacaoInfo.criadaEm)}</span>
                    </div>
                  )}
                  {indicacaoInfo.confirmadaEm && (
                    <div className="flex items-center justify-between">
                      <span className="text-purple-700 dark:text-purple-300 flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Confirmado em:
                      </span>
                      <span className="font-medium text-green-600">{formatDate(indicacaoInfo.confirmadaEm)}</span>
                    </div>
                  )}
                </div>
              )}

              <div className="bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900 dark:to-pink-900 p-3 rounded-lg">
                <p className="text-xs text-center text-purple-900 dark:text-purple-100">
                  🎉 <strong>{indicacaoInfo.indicouNome}</strong> ganhou pontos por te indicar!
                </p>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {/* Card do formulário */}
        <Card>
          <CardHeader>
            <CardTitle>Informar Link de Afiliado</CardTitle>
            <CardDescription>
              Se alguém te indicou para o Clube do Grito, cole aqui o link completo que você recebeu.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="link"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cole o link completo:</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="https://clubedogrito.institutoogrito.com.br/plans?ref=..."
                          disabled={mutation.isPending || mutation.isSuccess}
                          data-testid="input-link-afiliado"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="bg-yellow-50 p-4 rounded-lg">
                  <div className="flex items-start gap-2">
                    <LinkIcon className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-yellow-900">Por que informar?</p>
                      <p className="text-xs text-yellow-800">
                        Ao informar o link, você ajuda a pessoa que te indicou a ganhar pontos de indicação!
                      </p>
                    </div>
                  </div>
                </div>

                {mutation.isError && (
                  <div className="bg-red-50 p-4 rounded-lg">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-red-900">Erro ao salvar</p>
                        <p className="text-xs text-red-800">
                          {(mutation.error as any)?.message || "Tente novamente ou entre em contato com o suporte."}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={mutation.isPending || mutation.isSuccess}
                  className="w-full bg-red-800 hover:bg-red-900"
                  data-testid="button-salvar-link"
                >
                  {mutation.isSuccess ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Salvo!
                    </>
                  ) : mutation.isPending ? (
                    <>Salvando...</>
                  ) : (
                    <>Salvar Link</>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>

      <BottomNavigation />
    </div>
  );
}
