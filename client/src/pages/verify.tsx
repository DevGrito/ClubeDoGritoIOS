import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import Logo from "@/components/logo";
import Loading from "@/components/loading";
import { ArrowLeft, MessageSquare } from "lucide-react";

const verifySchema = z.object({
  codigo: z.string().length(6, "Código deve ter 6 dígitos"),
});

type VerifyForm = z.infer<typeof verifySchema>;

export default function Verify() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [userPhone, setUserPhone] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const form = useForm<VerifyForm>({
    resolver: zodResolver(verifySchema),
    defaultValues: {
      codigo: "",
    },
  });

  useEffect(() => {
    // Try userPhone first, then tempUserPhone as fallback
    const phone = localStorage.getItem("userPhone") || localStorage.getItem("tempUserPhone");
    if (!phone) {
      setLocation("/register");
      return;
    }
    setUserPhone(phone);
    
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, [setLocation]);

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "");
    form.setValue("codigo", value);
    
    if (value.length === 6) {
      // Auto-submit when code is complete
      form.handleSubmit(onSubmit)();
    }
  };

  const onSubmit = async (data: VerifyForm) => {
    setIsSubmitting(true);
    try {
      console.log("🔄 VERIFY.TSX: Iniciando verificação do código:", data.codigo);
      
      // ✅ VERIFICAR SE É FLUXO DE LOGIN OU DONATION FLOW
      const isLoginFlow = localStorage.getItem("isLoginFlow") === "true";
      const endpoint = isLoginFlow ? "/api/verify-login-code" : "/api/verify";
      
      console.log(`🔄 VERIFY.TSX: Usando endpoint ${endpoint} (isLoginFlow: ${isLoginFlow})`);
      
      const response = await apiRequest(endpoint, {
        method: "POST",
        body: JSON.stringify({
          telefone: userPhone.replace(/\D/g, ""),
          codigo: data.codigo,
        }),
        headers: { "Content-Type": "application/json" }
      });
      
      console.log("🔄 VERIFY.TSX: Response status:", response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.log("❌ VERIFY.TSX: Response não OK:", errorData);
        throw new Error(errorData.error || "Erro na verificação");
      }
      
      const result = await response.json();
      console.log("✅ VERIFY.TSX: Verificação bem-sucedida:", result);
      
      // ✅ LIMPAR FLAG DE LOGIN FLOW APÓS USO
      if (isLoginFlow) {
        localStorage.removeItem("isLoginFlow");
        console.log("🔄 VERIFY.TSX: Limpou flag isLoginFlow - era fluxo de login");
      }
      
      // Store verified user data INCLUDING ROLE
      localStorage.setItem("isVerified", "true");
      
      // ✅ ADAPTAR PARA DIFERENTES ESTRUTURAS DE RESPONSE
      let userData;
      if (isLoginFlow) {
        // Para /api/verify-login-code: dados vêm direto no result
        userData = {
          id: result.user?.id || result.userId,
          nome: result.user?.nome || result.nome,
          papel: result.user?.papel || result.papel,
          role: result.user?.papel || result.papel,
          conselhoStatus: result.user?.conselhoStatus || result.conselhoStatus,
          hasActiveSubscription: result.hasActiveSubscription || false
        };
      } else {
        // Para /api/verify: dados vêm em result.user
        userData = {
          id: result.user.id,
          nome: result.user.nome,
          papel: result.user.role,
          role: result.user.role,
          conselhoStatus: result.user.conselhoStatus,
          donationStatus: result.user.donationStatus
        };
      }
      
      console.log("🔄 VERIFY.TSX saving userId:", userData.id.toString());
      localStorage.setItem("userId", userData.id.toString());
      
      // ✅ SALVAR ROLE REAL DO BACKEND ao invés de forçar "doador"
      if (userData.role) {
        console.log("🔄 VERIFY.TSX saving userPapel:", userData.role);
        localStorage.setItem("userPapel", userData.role);
      }
      
      // ✅ SALVAR STATUS DE CONSELHO SE APLICÁVEL
      if (userData.conselhoStatus) {
        localStorage.setItem("conselhoStatus", userData.conselhoStatus);
      }
      
      toast({
        title: "Sucesso!",
        description: "Telefone verificado com sucesso",
      });
      
      console.log("🔄 VERIFY.TSX: Determinando redirecionamento inteligente...");
      
      // ✅ REDIRECIONAMENTO IMEDIATO - Removido setTimeout para compatibilidade iOS/Safari
      console.log("🔄 VERIFY.TSX: Determinando redirecionamento...");
      
      // ✅ DIFERENTES LÓGICAS PARA LOGIN VS DONATION FLOW
      if (isLoginFlow) {
          // 🎯 LÓGICA DE LOGIN: Usuário já existe, redirecionar baseado no papel
          console.log("🔄 VERIFY.TSX: FLUXO DE LOGIN - redirecionamento direto baseado no papel");
          
          const userPapel = userData.role || userData.papel;
          console.log(`🔄 VERIFY.TSX: Papel do usuário: ${userPapel}`);

          queryClient.invalidateQueries();
          
          switch (userPapel) {
            // RBAC Roles - Rotas isoladas
            case "professor":
            case "professor_psico":
              setLocation("/professor");
              break;
            case "professor_pec":
              setLocation("/professor/pec");
              break;
            case "professor_inclusao":
              setLocation("/professor/inclusao");
              break;
            case "monitor":
            case "monitor_pec":
            case "monitor_inclusao":
            case "monitor_psico":
              setLocation("/monitor");
              break;
            case "coordenador_inclusao":
              setLocation("/coordenador/inclusao-produtiva");
              break;
            case "coordenador_pec":
              setLocation("/coordenador/esporte-cultura");
              break;
            case "coordenador_psico":
            case "tecnica_psico":
              setLocation("/coordenador/psicossocial");
              break;
            // Legacy roles
            case "lider":
            case "professor_lider":
              setLocation("/professor");
              break;
            case "aluno":
              setLocation("/aluno");
              break;
            case "conselho":
            case "conselheiro":
              setLocation("/conselho");
              break;
            case "admin":
              setLocation("/admin-geral");
              break;
            case "super_admin":
            case "leo":
              setLocation("/administrador");
              break;
            case "desenvolvedor":
              setLocation("/dev");
              break;
            case "doador":
            case "user":
            default:
              // ✅ VERIFICAR SE TEM ASSINATURA ATIVA
              if (userData.hasActiveSubscription) {
                console.log("🔄 VERIFY.TSX: Doador com assinatura ativa - redirecionando para tdoador");
                setLocation("/tdoador");
              } else {
                console.log("⚠️ VERIFY.TSX: Doador SEM assinatura - redirecionando para plans");
                toast({
                  title: "Complete seu cadastro",
                  description: "Escolha um plano para continuar",
                  variant: "default",
                });
                setLocation("/plans");
              }
          }
          return;
        }
        
        // 🎯 LÓGICA DE DONATION FLOW (usuários novos)
        console.log("🔄 VERIFY.TSX: FLUXO DE DONATION - lógica original");
        
        // 1. Verificar flag EXPLÍCITA de que veio do donation-flow (apenas esta sessão)
        const cameFromDonationFlow = sessionStorage.getItem("smsFromDonation") === "true";
        
        if (cameFromDonationFlow) {
          console.log("🔄 VERIFY.TSX: Veio do donation-flow - redirecionando de volta");
          // Limpar a flag para evitar reutilização
          sessionStorage.removeItem("smsFromDonation");
          setLocation("/donation-flow");
          return;
        }
        
        // 2. PRIMEIRO: Verificar se é DOADOR EXISTENTE (prioritário sobre flags temporárias)
        const donationStatus = userData.donationStatus;
        if (donationStatus && donationStatus.isExistingDonor) {
          console.log(`🔄 VERIFY.TSX: Doador existente detectado! Status: ${donationStatus.status}, hasActive: ${donationStatus.hasActiveSubscription}`);
          
          // Se doador tem subscription ativa, vai direto para dashboard
          if (donationStatus.hasActiveSubscription) {
            console.log("🔄 VERIFY.TSX: Doador com subscription ativa - redirecionando para tdoador");
            setLocation("/tdoador");
            return;
          } else {
            // Doador existente mas sem subscription ativa (ex: cancelled) - pode ir para dashboard mesmo assim
            console.log("🔄 VERIFY.TSX: Doador existente sem subscription ativa - redirecionando para tdoador");
            setLocation("/tdoador");
            return;
          }
        }
        
        // 3. Verificar se é usuário NOVO (tem dados temporários) - APENAS se não for doador existente
        const tempUserPhone = localStorage.getItem("tempUserPhone");
        const phoneVerified = localStorage.getItem("phoneVerified");
        
        if (tempUserPhone || phoneVerified === "true") {
          console.log("🔄 VERIFY.TSX: Usuário NOVO - redirecionando para donation-flow");
          setLocation("/donation-flow");
          return;
        }
        
      // 4. Fallback: welcome page (apenas para casos sem definição clara)
      console.log("🔄 VERIFY.TSX: Fallback - redirecionando para welcome");
      setLocation("/welcome");
      
    } catch (error: any) {
      console.error("❌ VERIFY.TSX: Erro na verificação:", error);
      toast({
        title: "Erro",
        description: error.message || "Código de verificação inválido",
        variant: "destructive",
      });
      form.setValue("codigo", "");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendCode = async () => {
    setIsResending(true);
    try {
      const response = await apiRequest("/api/resend-verification", {
        method: "POST",
        body: JSON.stringify({
          telefone: userPhone.replace(/\D/g, ""),
        }),
        headers: { "Content-Type": "application/json" }
      });
      
      toast({
        title: "Código reenviado",
        description: "Novo código enviado por SMS",
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Erro ao reenviar código",
        variant: "destructive",
      });
    } finally {
      setIsResending(false);
    }
  };

  if (isLoading) return <Loading />;

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/register")}
            className="p-2"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <Logo size="sm" />
          <div className="w-10" />
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-md mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-brand-red rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-black mb-2">Verificação por SMS</h2>
          <p className="text-gray-600">
            Digite o código enviado para{" "}
            <span className="font-semibold">{userPhone}</span>
          </p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <Label htmlFor="codigo" className="text-sm font-medium text-gray-700">
                  Código de verificação
                </Label>
                <Input
                  id="codigo"
                  type="text"
                  placeholder="000000"
                  maxLength={6}
                  value={form.watch("codigo")}
                  onChange={handleCodeChange}
                  className="mt-1 text-center text-2xl font-bold tracking-widest"
                />
                {form.formState.errors.codigo && (
                  <p className="text-sm text-red-600 mt-1">
                    {form.formState.errors.codigo.message}
                  </p>
                )}
              </div>

              <div className="space-y-4">
                <Button 
                  type="submit"
                  disabled={isSubmitting || form.watch("codigo").length !== 6}
                  className="w-full bg-brand-red text-white hover:bg-red-600 disabled:opacity-50"
                >
                  {isSubmitting ? "Verificando..." : "Verificar código"}
                </Button>

                <Button 
                  type="button"
                  variant="outline"
                  onClick={handleResendCode}
                  disabled={isResending}
                  className="w-full"
                >
                  {isResending ? "Reenviando..." : "Reenviar código"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="text-center mt-8">
          <p className="text-sm text-gray-500">
            Não recebeu o código? Verifique sua caixa de spam ou{" "}
            <button 
              onClick={() => setLocation("/register")}
              className="text-brand-red hover:underline"
            >
              altere seu número
            </button>
          </p>
        </div>
      </main>
    </div>
  );
}
