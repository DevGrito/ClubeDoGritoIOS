import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Phone, MessageCircle, ArrowLeft } from "lucide-react";
import Logo from "@/components/logo";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const countryCodes = [
  { name: "Brasil", code: "+55", id: "br" },
  { name: "Estados Unidos", code: "+1", id: "us" },
  { name: "Portugal", code: "+351", id: "pt" },
  { name: "Reino Unido", code: "+44", id: "uk" },
  { name: "França", code: "+33", id: "fr" },
  { name: "Alemanha", code: "+49", id: "de" },
  { name: "Argentina", code: "+54", id: "ar" },
  { name: "México", code: "+52", id: "mx" },
  { name: "Canadá", code: "+1", id: "ca" },
  { name: "Japão", code: "+81", id: "jp" },
  { name: "Austrália", code: "+61", id: "au" },
  { name: "Espanha", code: "+34", id: "es" },
  { name: "Itália", code: "+39", id: "it" },
  { name: "Moçambique", code: "+258", id: "mz" },
  { name: "Angola", code: "+244", id: "ao" },
];

export default function Entrar() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [countryCode, setCountryCode] = useState("+55");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [codigo, setCodigo] = useState("");
  const [etapa, setEtapa] = useState<"telefone" | "codigo">("telefone");
  const [modoConselho, setModoConselho] = useState(false);
  const [modoPatrocinador, setModoPatrocinador] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [codigoGerado, setCodigoGerado] = useState<string | null>(null);
  const [telefoneError, setTelefoneError] = useState("");
  const [devUsuario, setDevUsuario] = useState<string | null>(null);
  const [modoCoordenador, setModoCoordenador] = useState(false); // <<< NOVO

  // helper: detecta se é fluxo DEV
  const isDevKeyword = (v: string) => {
    const t = v.toLowerCase();
    return (
      t === "eloiza" ||
      t === "dev" ||
      t === "desenvolvedor" ||
      t === "marketing"
    );
  };
  const isGenericDevUsername = (v: string) => {
    // se contiver qualquer letra (não apenas dígitos, espaços, parênteses, '-', etc), tratamos como dev
    const raw = v.trim();
    const onlyDigits = raw.replace(/\D/g, "");
    // se raw, depois de remover símbolos, ainda tiver letras, ou se o raw não for puramente numérico, consideramos DEV
    // mais simples e robusto:
    return (
      raw !== "" &&
      !/^\d+$/.test(raw.replace(/[^\dA-Za-z]/g, "")) &&
      /[A-Za-z]/.test(raw)
    );
  };

  // Nova função para login por e-mail (conselho)
      const handleEmailLogin = async () => {
      if (!email.trim()) {
        toast({ title: "Erro", description: "Por favor, digite seu e-mail", variant: "destructive" });
        return;
      }

      setIsLoading(true);
      try {
        // escolhe endpoint por modo
        const endpoint = modoCoordenador
          ? "/api/auth/login-coordenador"
          : "/api/auth/login-email"; // mantém o que você já usa para conselho/patrocinador

        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.trim() }),
        });

        if (!response.ok) {
          const error = await response.json().catch(() => ({}));
          throw new Error(error.error || "E-mail não autorizado");
        }

        const data = await response.json();

        // limpa e preserva subscription
        const preserveSubscription = localStorage.getItem("hasActiveSubscription");
        ["userId","userName","userEmail","userTelefone","userPhone","userPapel","userData"].forEach(k=>localStorage.removeItem(k));

        // salva user
        localStorage.setItem("userId", String(data.user?.id ?? 0));
        localStorage.setItem("userName", data.user?.nome ?? "Coordenador");
        localStorage.setItem("userEmail", data.user?.email ?? email.trim());
        localStorage.setItem("userTelefone", data.user?.telefone ?? "");
        localStorage.setItem("userPhone", data.user?.telefone ?? "");
        localStorage.setItem("userPapel", data.role ?? data.user?.papel ?? "user");
        localStorage.setItem("isVerified", "true");
        localStorage.setItem("userData", JSON.stringify(data));

        if (preserveSubscription) localStorage.setItem("hasActiveSubscription", preserveSubscription);

        window.dispatchEvent(new CustomEvent("localStorageChanged"));

        toast({ title: "Login realizado", description: `Bem-vindo, ${data.user?.nome ?? "Coordenador"}!` });

        // redirecionamento:
        if (modoCoordenador) {
          const path = data.redirectPath || "/coordenador"; // fallback
          setLocation(path);
          return;
        }

        // já existente (conselho/patrocinador)
        if (data.user?.papel === "patrocinador" || data.role === "patrocinador") {
          setLocation("/patrocinador");
        } else {
          setLocation("/conselho");
        }
      } catch (error: any) {
        toast({
          title: "Erro no login",
          description: error.message || "E-mail não autorizado ou erro interno",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

  const handleEnviarCodigo = async () => {
    // Se está no modo conselho ou patrocinador e tem e-mail, fazer login por e-mail
    if ((modoConselho || modoPatrocinador || modoCoordenador) && email.trim()) {
      await handleEmailLogin();
      return;
    }

    // Se está no modo conselho/patrocinador mas não digitou e-mail, pedir e-mail
    if ((modoConselho || modoPatrocinador) && !email.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, digite seu e-mail",
        variant: "destructive",
      });
      return;
    }

    // Fluxo normal por telefone
    if (!telefone.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, digite seu telefone",
        variant: "destructive",
      });
      return;
    }

    // Se for um dos atalhos antigos ou um username alfanumérico => fluxo DEV
    if (isDevKeyword(telefone) || isGenericDevUsername(telefone)) {
      // mapeia atalhos antigos para usuários específicos (compat)
      let usuario = telefone.trim();
      const t = telefone.toLowerCase().trim();
      if (t === "eloiza") usuario = "eloiza";
      else if (t === "desenvolvedor") usuario = "devadmin";
      else if (t === "marketing") usuario = "marketing";
      // caso genérico, usa o que o usuário digitou (ex.: DevPedro)
      setDevUsuario(usuario);
      setEtapa("codigo");
      toast({
        title: "Acesso de Desenvolvedor",
        description: `Digite a senha do usuário ${usuario}`,
      });
      return;
    }

    // Validação básica para BR
    if (countryCode === "+55") {
      const cleanPhone = telefone.replace(/\D/g, "");
      if (cleanPhone.length < 11) {
        setTelefoneError("Digite DDD + número com 9 dígitos (ex: 31999887766)");
        return;
      }
    }
    setTelefoneError("");

    // Número completo
    let fullPhone = countryCode + telefone.replace(/\D/g, "");

    // Números de teste
    if (
      telefone === "99999999999" ||
      telefone === "999999999" ||
      telefone === "99999-9999"
    ) {
      fullPhone = "+5599999999999";
    }
    if (telefone === "999990001" || telefone === "99999-0001") {
      fullPhone = "+5531999990001";
    } else if (telefone === "999990002" || telefone === "99999-0002") {
      fullPhone = "+5531999990002";
    } else if (telefone === "999990003" || telefone === "99999-0003") {
      fullPhone = "+5531999990003";
    }

    setIsLoading(true);
    try {
      const data = await apiRequest("/api/send-login-code", {
        method: "POST",
        body: JSON.stringify({ telefone: fullPhone }),
      });

      // ✅ MARCAR QUE É FLUXO DE LOGIN (não donation flow)
      localStorage.setItem("isLoginFlow", "true");
      localStorage.setItem("userPhone", fullPhone);

      setEtapa("codigo");

      if (data.codigo) {
        setCodigoGerado(data.codigo);
        if (fullPhone.includes("99999999999")) {
          toast({
            title: "Número de teste",
            description: `Use o código: ${data.codigo}`,
          });
        }
      } else {
        toast({
          title: "Código enviado",
          description: "Verifique seu telefone para o código de verificação",
        });
      }
    } catch {
      toast({
        title: "Erro",
        description: "Não foi possível enviar o código. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerificarCodigo = async () => {
    if (!codigo.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, digite o código/senha",
        variant: "destructive",
      });
      return;
    }

    // <<< Fluxo DEV
    // <<< Fluxo DEV
    if (devUsuario) {
      setIsLoading(true);
      try {
        const data = await apiRequest("/api/dev/login", {
          method: "POST",
          body: JSON.stringify({ usuario: devUsuario, senha: codigo }),
        });

        if (data.success) {
          localStorage.setItem("dev-authenticated", "true");
          localStorage.setItem("dev-user", data.developer.usuario);
          let redirectUrl = "/dev?dev_access=true&origin=dev_panel";
          if (
            data.developer.usuario === "devadmin" ||
            data.developer.usuario === "marketing"
          ) {
            redirectUrl = "/dev-marketing?dev_access=true&origin=dev_panel";
          }
          setLocation(redirectUrl);
          toast({
            title: "Login realizado",
            description: `Bem-vindo, ${data.developer.nome}!`,
          });
          return;
        }

        // se não veio success:
        toast({
          title: "Erro",
          description: "Credenciais de desenvolvedor inválidas",
          variant: "destructive",
        });
      } catch {
        toast({
          title: "Erro",
          description: "Credenciais de desenvolvedor inválidas",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // <<< Fluxo normal (SMS)
    setIsLoading(true);
    try {
      let fullPhone = countryCode + telefone.replace(/\D/g, "");

      if (
        telefone === "99999999999" ||
        telefone === "999999999" ||
        telefone === "99999-9999"
      ) {
        fullPhone = "+5599999999999";
      }
      if (
        telefone === "987830003" ||
        telefone === "9878-30003" ||
        telefone === "31987830003"
      ) {
        fullPhone = "+5531987830003";
      }
      if (telefone === "999990001" || telefone === "99999-0001") {
        fullPhone = "+5531999990001";
      } else if (telefone === "999990002" || telefone === "99999-0002") {
        fullPhone = "+5531999990002";
      } else if (telefone === "999990003" || telefone === "99999-0003") {
        fullPhone = "+5531999990003";
      }

      console.log(
        "DEBUG Frontend - Enviando telefone:",
        fullPhone,
        "código:",
        codigo
      );

      const isProfessorTestNumber =
        fullPhone === "+5531999990001" ||
        fullPhone === "+5531999990002" ||
        fullPhone === "+5531999990003";
      let userData: any;
      if (isProfessorTestNumber) {
        userData = await apiRequest("/api/professor/verify-login-code", {
          method: "POST",
          body: JSON.stringify({ telefone: fullPhone, codigo }),
        });
      } else {
        const smsResponse = await fetch("/api/verify-login-code", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ telefone: fullPhone, codigo }),
        });

        if (!smsResponse.ok) {
          const error = await smsResponse.json().catch(() => ({}));
          throw new Error(error.error || "Código de verificação inválido");
        }

        userData = await smsResponse.json();
      }

      // CLEAR old localStorage data first to prevent cache issues (preservando hasActiveSubscription)
      const preserveSubscription = localStorage.getItem(
        "hasActiveSubscription"
      );
      localStorage.removeItem("userId");
      localStorage.removeItem("userName");
      localStorage.removeItem("userEmail");
      localStorage.removeItem("userTelefone");
      localStorage.removeItem("userPhone");
      localStorage.removeItem("userPapel");
      localStorage.removeItem("userData");

      // ✅ FIX: Se for Leo Martins, garantir userId correto
      const isLeoPhone = fullPhone.includes("31998783003") || fullPhone.includes("5531998783003");
      if (isLeoPhone && (!userData.user || userData.user.id !== 24)) {
        console.log("🔧 [LEO FIX] Corrigindo userId para Leo Martins");
        userData = {
          ...userData,
          user: {
            id: 24,
            nome: "Leo Martins",
            telefone: "31998783003",
            email: userData.user?.email || "",
            papel: "leo",
            role: "leo"
          }
        };
      }

      const newUserId = userData.user?.id?.toString() || "";
      localStorage.setItem("userId", newUserId);
      
      // ✅ GARANTIR nome correto para Leo Martins
      const userName = isLeoPhone ? "Leo Martins" : (userData.user?.nome || userData.nome);
      localStorage.setItem("userName", userName);
      
      localStorage.setItem("userEmail", userData.user?.email || userData.email || "");
      localStorage.setItem("userTelefone", userData.user?.telefone || userData.telefone);
      localStorage.setItem("userPhone", userData.user?.telefone || userData.telefone);
      localStorage.setItem("userPapel", userData.user?.papel || userData.papel || "user");
      localStorage.setItem("isVerified", "true");
      localStorage.setItem("userData", JSON.stringify(userData));

      // ✅ Salvar status de doador no localStorage
      if (userData.donationStatus?.isDonor || userData.papel === "doador" || userData.user?.papel === "doador") {
        localStorage.setItem("isDonor", "true");
        localStorage.setItem("userType", "doador");
      }

      const hasActiveSubscription =
        preserveSubscription === "true" ||
        userData.hasActiveSubscription ||
        userData.donationStatus?.hasActiveSubscription ||
        false;
      localStorage.setItem(
        "hasActiveSubscription",
        String(hasActiveSubscription)
      );

      toast({
        title: userData.isTestUser
          ? "Login de teste realizado"
          : "Login realizado",
        description: userData.isTestUser
          ? "Usuário de teste redirecionado para aguardar aprovação"
          : "Bem-vindo ao Clube do Grito!",
      });

      // Roteamento
      if (
        userData.papel === "professor" ||
        userData.redirectTo === "/professor"
      ) {
        localStorage.setItem(
          "professorTipo",
          userData.professorTipo || "regular"
        );
        setLocation("/professor");
      } else if (userData.papel === "leo") {
        setLocation("/administrador");
      } else if (userData.papel === "admin") {
        setLocation("/admin-geral");
      } else if (userData.papel === "coordenador_pec") {
        setLocation("/coordenador/esporte-cultura");
      } else if (userData.papel === "coordenador_inclusao") {
        setLocation("/coordenador/inclusao-produtiva");
      } else if (userData.papel === "coordenador_psico") {
        setLocation("/coordenador/psicossocial");
      } else if (userData.papel === "conselho") {
        setLocation("/conselho");
      } else if (userData.conselhoStatus === "aprovado") {
        setLocation("/conselho");
      } else if (userData.conselhoStatus === "recusado") {
        toast({
          title: "Acesso negado",
          description:
            "Seu acesso ao Conselho foi negado. Entre em contato com o administrador.",
          variant: "destructive",
        });
        setLocation("/perfil");
      } else if (userData.papel === "doador") {
        /* console.log(
          `🔄 ENTRAR.TSX: Doador - redirecionando para dashboard (hasActiveSubscription: ${hasActiveSubscription})`
        ); */
        setLocation("/tdoador");
      } else if (
        userData.needsCouncilApproval ||
        userData.conselhoStatus === "pendente"
      ) {
        setLocation("/aguardando-aprovacao");
      } else {
        setLocation("/welcome");
      }
    } catch (e: any) {
      toast({
        title: "Erro",
        description:
          e?.message || "Código inválido ou expirado. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVoltar = () => {
    if (etapa === "codigo") {
      setEtapa("telefone");
      setCodigo("");
      setDevUsuario(null); // <<< reseta fluxo dev ao voltar
    } else {
      setLocation("/plans");
    }
  };

  const isDevFlow =
    devUsuario !== null ||
    isDevKeyword(telefone) ||
    isGenericDevUsername(telefone);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <Logo size="lg" className="mx-auto mb-6" />
          <h1 className="text-2xl font-bold text-black mb-2">Entrar</h1>
          <p className="text-gray-600">
          {etapa === "telefone"
            ? (modoConselho || modoPatrocinador || modoCoordenador)
              ? "Digite seu e-mail para acessar"
              : "Digite seu telefone para receber o código de acesso"
            : isDevFlow
              ? `Digite a senha de desenvolvedor${devUsuario ? ` para ${devUsuario}` : ""}`
              : "Digite o código recebido por SMS"}
          </p>
        </div>

        <Card>
          {etapa === "telefone" && !modoConselho && !modoPatrocinador ? (
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="w-5 h-5" />
                Seu telefone
              </CardTitle>
            </CardHeader>
          ) : (
            etapa === "codigo" && (
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5" />
                  {isDevFlow
                    ? "Senha de Desenvolvedor"
                    : "Código de verificação"}
                </CardTitle>
              </CardHeader>
            )
          )}
          <CardContent className="space-y-4">
            {etapa === "telefone" && (
              <>
                {!modoConselho && !modoPatrocinador && (
                  <div className="space-y-2">
                    <Label htmlFor="country">País</Label>
                    <Select value={countryCode} onValueChange={setCountryCode}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o país" />
                      </SelectTrigger>
                      <SelectContent>
                        {countryCodes.map(({ name, code, id }) => (
                          <SelectItem key={id} value={code}>
                            {code} {name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {!modoConselho && !modoPatrocinador ? (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="telefone">Telefone</Label>
                      <div className="flex gap-2">
                        <div className="flex items-center px-3 py-2 bg-gray-100 border border-gray-300 rounded-l-md">
                          <span className="text-sm font-medium">
                            {countryCode}
                          </span>
                        </div>
                        <Input
                          id="telefone"
                          type="text"
                          placeholder="Ex.: 31999887766"
                          value={telefone}
                          onChange={(e) => {
                            setTelefone(e.target.value);
                            if (telefoneError) setTelefoneError("");
                          }}
                          className="flex-1 rounded-l-none"
                        />
                      </div>
                      {telefoneError && (
                        <p className="text-sm text-red-600 mt-1">
                          {telefoneError}
                        </p>
                      )}
                    </div>

                    <Button
                      onClick={handleEnviarCodigo}
                      disabled={isLoading}
                      className="w-full bg-black text-white hover:bg-gray-800"
                    >
                      {isLoading
                        ? "Enviando..."
                        : "Enviar código de verificação"}
                    </Button>

                    <div className="flex justify-center gap-4">
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => {
                          setModoConselho(true);
                          setModoPatrocinador(false);
                        }}
                        className="text-sm text-gray-600 hover:text-white underline"
                      >
                        Conselho
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => {
                          setModoPatrocinador(true);
                          setModoConselho(false);
                        }}
                        className="text-sm text-gray-600 hover:text-white underline"
                      >
                        Patrocinador
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="email">E-mail</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="seu@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full"
                        autoFocus
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setModoConselho(false);
                          setModoPatrocinador(false);
                          setEmail("");
                        }}
                        className="flex-1"
                        data-testid="voltar-conselho"
                      >
                        Voltar
                      </Button>
                      <Button
                        onClick={handleEnviarCodigo}
                        disabled={isLoading}
                        className="flex-1 bg-black text-white hover:bg-gray-800"
                      >
                        {isLoading ? "Entrando..." : "Entrar"}
                      </Button>
                    </div>
                  </>
                )}
              </>
            )}

            {etapa === "codigo" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="codigo">
                    {isDevFlow ? "Senha" : "Código"}
                  </Label>
                  <Input
                    id="codigo"
                    type={isDevFlow ? "password" : "text"}
                    placeholder={
                      isDevFlow
                        ? "Digite sua senha"
                        : "Digite o código de 6 dígitos"
                    }
                    value={codigo}
                    onChange={(e) => setCodigo(e.target.value)}
                    className={
                      isDevFlow
                        ? "text-left text-base"
                        : "text-center text-lg tracking-widest"
                    }
                    maxLength={isDevFlow ? undefined : 6}
                  />
                  {codigoGerado && !isDevFlow && (
                    <p className="text-xs text-gray-500">
                      Código (teste): {codigoGerado}
                    </p>
                  )}
                </div>

                <Button
                  onClick={handleVerificarCodigo}
                  disabled={isLoading}
                  className="w-full bg-yellow-400 text-black hover:bg-yellow-500"
                >
                  {isLoading
                    ? "Verificando..."
                    : isDevFlow
                    ? "Entrar no Painel"
                    : "Verificar e Entrar"}
                </Button>

                {!isDevFlow && (
                  <Button
                    onClick={() => handleEnviarCodigo()}
                    variant="outline"
                    className="w-full"
                    disabled={isLoading}
                  >
                    Reenviar código
                  </Button>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Botão Voltar - só aparece quando não há botão dentro do Card */}
        {!(etapa === "telefone" && (modoConselho || modoPatrocinador)) && (
          <Button 
            onClick={handleVoltar} 
            variant="ghost" 
            className="w-full"
            data-testid="voltar-principal"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
        )}

        {etapa === "telefone" && (
          <div className="text-center text-sm text-gray-500">
            <p>
              Não tem conta?{" "}
              <button
                onClick={() => setLocation("/")}
                className="text-black font-medium hover:underline"
              >
                Cadastre-se aqui
              </button>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
