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
import { apiRequest } from "@/lib/queryClient";
import Logo from "@/components/logo";
import Loading from "@/components/loading";
import { ArrowLeft, UserPlus } from "lucide-react";

const registerSchema = z.object({
  nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  sobrenome: z.string().min(2, "Sobrenome deve ter pelo menos 2 caracteres"),
  telefone: z.string().min(10, "Telefone deve ter pelo menos 10 dígitos"),
  email: z.string().email("Email inválido").optional(),
  plano: z.string(),
  referralCode: z.string().optional(),
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function Register() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Get plan from URL params
  const urlParams = new URLSearchParams(window.location.search);
  const selectedPlan = urlParams.get("plan") || "eco";

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  // Get referral code from URL params
  const referralCodeParam = urlParams.get("ref") || urlParams.get("refCode") || "";

  const form = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      nome: "",
      sobrenome: "",
      telefone: "",
      email: "",
      plano: selectedPlan,
      referralCode: referralCodeParam,
    },
  });

  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 11) {
      return numbers.replace(/^(\d{2})(\d{5})(\d{4})$/, "($1) $2-$3");
    }
    return value;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    form.setValue("telefone", formatted);
  };

  const onSubmit = async (data: RegisterForm) => {
    setIsSubmitting(true);
    try {
      const response = await apiRequest("/api/register", {
        method: "POST",
        body: JSON.stringify({
          ...data,
          telefone: data.telefone.replace(/\D/g, ""), // Send only numbers
        }),
        headers: { "Content-Type": "application/json" }
      });
      
      const result = await response.json();
      
      // Store user data in localStorage
      localStorage.setItem("userId", result.userId.toString());
      localStorage.setItem("userPhone", data.telefone);
      localStorage.setItem("userName", data.nome);
      localStorage.setItem("userPlan", data.plano);
      
      toast({
        title: "Sucesso!",
        description: "Código de verificação enviado por SMS",
      });
      
      // Define flag de que o SMS veio de registro (não de doação)
      sessionStorage.setItem("smsFromRegister", "true");
      setLocation("/verify");
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Erro ao criar conta. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
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
            onClick={() => setLocation("/")}
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
          <div className="w-16 h-16 bg-brand-yellow rounded-full flex items-center justify-center mx-auto mb-4">
            <UserPlus className="w-8 h-8 text-black" />
          </div>
          <h2 className="text-2xl font-bold text-black mb-2">Complete seu cadastro</h2>
          <p className="text-gray-600">Precisamos de algumas informações para criar sua conta</p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="nome" className="text-sm font-medium text-gray-700">
                    Nome
                  </Label>
                  <Input
                    id="nome"
                    type="text"
                    placeholder="Digite seu nome"
                    {...form.register("nome")}
                    className="mt-1"
                  />
                  {form.formState.errors.nome && (
                    <p className="text-sm text-red-600 mt-1">
                      {form.formState.errors.nome.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="sobrenome" className="text-sm font-medium text-gray-700">
                    Sobrenome
                  </Label>
                  <Input
                    id="sobrenome"
                    type="text"
                    placeholder="Digite seu sobrenome"
                    {...form.register("sobrenome")}
                    className="mt-1"
                  />
                  {form.formState.errors.sobrenome && (
                    <p className="text-sm text-red-600 mt-1">
                      {form.formState.errors.sobrenome.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="telefone" className="text-sm font-medium text-gray-700">
                    Telefone
                  </Label>
                  <Input
                    id="telefone"
                    type="tel"
                    placeholder="(11) 99999-9999"
                    value={form.watch("telefone")}
                    onChange={handlePhoneChange}
                    className="mt-1"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Enviaremos um código de verificação via SMS
                  </p>
                  {form.formState.errors.telefone && (
                    <p className="text-sm text-red-600 mt-1">
                      {form.formState.errors.telefone.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                    Email (opcional)
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    {...form.register("email")}
                    className="mt-1"
                  />
                  {form.formState.errors.email && (
                    <p className="text-sm text-red-600 mt-1">
                      {form.formState.errors.email.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="referralCode" className="text-sm font-medium text-gray-700">
                    Código de Indicação (opcional)
                  </Label>
                  <Input
                    id="referralCode"
                    type="text"
                    placeholder="Ex: GRITO-123456 ou link de amigo"
                    {...form.register("referralCode")}
                    className="mt-1"
                    data-testid="input-referral-code"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Tem um código de quem te indicou? Cole aqui!
                  </p>
                  {form.formState.errors.referralCode && (
                    <p className="text-sm text-red-600 mt-1">
                      {form.formState.errors.referralCode.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <Button 
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-black text-white hover:bg-gray-800 disabled:opacity-50"
                >
                  {isSubmitting ? "Criando conta..." : "Continuar"}
                </Button>

                <Button 
                  type="button"
                  variant="outline"
                  onClick={() => setLocation("/")}
                  className="w-full"
                >
                  Voltar aos planos
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="text-center mt-8">
          <p className="text-xs text-gray-500">
            Ao continuar, você concorda com nossos{" "}
            <a href="#" className="text-brand-yellow hover:underline">
              Termos de Uso
            </a>{" "}
            e{" "}
            <a href="#" className="text-brand-yellow hover:underline">
              Política de Privacidade
            </a>
          </p>
        </div>
      </main>
    </div>
  );
}
