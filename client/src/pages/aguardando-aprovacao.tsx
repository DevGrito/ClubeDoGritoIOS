import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Clock, CheckCircle, XCircle, RefreshCw, User } from "lucide-react";
import { useLocation } from "wouter";
import Logo from "@/components/logo";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import Loading from "@/components/loading";

interface ConselhoStatus {
  status: "pendente" | "aprovado" | "recusado";
  approvedBy?: string;
  approvedAt?: string;
}

export default function AguardandoAprovacao() {
  const [, setLocation] = useLocation();
  const [userPhone, setUserPhone] = useState<string>("");
  const [userName, setUserName] = useState<string>("");
  const [showNameModal, setShowNameModal] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [isSubmittingName, setIsSubmittingName] = useState(false);
  const [requestSubmitted, setRequestSubmitted] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const phone = localStorage.getItem("userPhone");
    const userData = JSON.parse(localStorage.getItem("userData") || "{}");
    let name = localStorage.getItem("userName");
    
    console.log("Phone from localStorage:", phone);
    console.log("Name from localStorage:", name);
    console.log("User data:", userData);
    
    if (!phone) {
      setLocation("/entrar");
      return;
    }
    
    // Check if user already has approved status - redirect to council
    if (userData.conselhoStatus === "aprovado") {
      console.log("User already approved, redirecting to council");
      setLocation("/conselho");
      return;
    }
    
    // Check if user was rejected
    if (userData.conselhoStatus === "recusado") {
      console.log("User was rejected, redirecting to profile");
      setLocation("/perfil");
      return;
    }
    
    setUserPhone(phone);
    
    // For test users, clear old names and force name collection
    if (phone === "+5599999999999") {
      // Clear any existing name for test users to force modal
      if (name === "Usuário Teste") {
        console.log("Clearing test user name to force modal");
        localStorage.removeItem("userName");
        localStorage.removeItem("councilRequestSubmitted");
        name = "";
      }
      // Also clear any existing request submission flag for test users
      localStorage.removeItem("councilRequestSubmitted");
    }
    
    setUserName(name || "");
    
    // Check if user has a name stored
    console.log("Checking name condition:", !name || name.trim() === "");
    console.log("Current name value:", name);
    console.log("Name length:", name ? name.length : 0);
    
    const submitted = localStorage.getItem("councilRequestSubmitted");
    console.log("Request already submitted:", submitted);
    
    if (!name || name.trim() === "") {
      console.log("Setting showNameModal to true");
      setShowNameModal(true);
      setRequestSubmitted(false); // Reset request submitted when showing modal
    } else {
      // Name exists, check if request was already submitted
      if (submitted === "true") {
        setRequestSubmitted(true);
      } else {
        // Submit council request automatically since name exists
        submitCouncilRequest(name, phone);
      }
    }
  }, [setLocation]);

  // Function to submit council request
  const submitCouncilRequest = async (name: string, phone: string) => {
    try {
      console.log("Submitting council request for:", name, phone);
      await apiRequest("POST", "/api/submit-council-request", {
        nome: name,
        telefone: phone
      });
      localStorage.setItem("councilRequestSubmitted", "true");
      setRequestSubmitted(true);
      toast({
        title: "Solicitação enviada",
        description: "Sua solicitação foi enviada para aprovação do Léo.",
      });
    } catch (error) {
      console.error("Error submitting council request:", error);
      toast({
        title: "Erro",
        description: "Erro ao enviar solicitação. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  // Function to handle name submission
  const handleNameSubmit = async () => {
    if (!nameInput.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Por favor, digite seu nome para continuar.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmittingName(true);
    
    try {
      // Update user name in database
      await apiRequest("PUT", "/api/update-user-name", {
        telefone: userPhone,
        nome: nameInput.trim()
      });
      
      // Update localStorage
      localStorage.setItem("userName", nameInput.trim());
      setUserName(nameInput.trim());
      
      // Submit council request
      await submitCouncilRequest(nameInput.trim(), userPhone);
      
      setShowNameModal(false);
      
      toast({
        title: "Nome atualizado",
        description: `Olá, ${nameInput.trim()}! Sua solicitação foi enviada para aprovação.`,
      });
      
    } catch (error) {
      console.error("Error updating name:", error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar nome. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingName(false);
    }
  };

  const { data: statusData, isLoading, refetch } = useQuery<ConselhoStatus>({
    queryKey: ["/api/conselho-status", userPhone],
    enabled: !!userPhone && requestSubmitted && !showNameModal,
    refetchInterval: 1000, // Poll every 1 second for faster response
    retry: true,
    queryFn: async () => {
      console.log("Fetching status for phone:", userPhone);
      const response = await fetch(`/api/conselho-status?telefone=${encodeURIComponent(userPhone)}`);
      if (!response.ok) {
        throw new Error('Failed to fetch status');
      }
      const data = await response.json();
      console.log("Status response:", data);
      return data;
    }
  });

  // Redirect based on status
  useEffect(() => {
    console.log("Status changed:", statusData?.status);
    if (statusData?.status === "aprovado") {
      console.log("Redirecting to /conselho");
      // Update user role and status in localStorage
      localStorage.setItem("userPapel", "conselho");
      
      // Update userData with approved status
      const userData = JSON.parse(localStorage.getItem("userData") || "{}");
      userData.conselhoStatus = "aprovado";
      userData.conselhoApprovedBy = statusData.approvedBy;
      userData.conselhoApprovedAt = statusData.approvedAt;
      localStorage.setItem("userData", JSON.stringify(userData));
      
      // Trigger custom event to update components
      window.dispatchEvent(new CustomEvent("localStorageChanged"));
      // Navigate to conselho page
      setLocation("/conselho");
    } else if (statusData?.status === "recusado") {
      console.log("User was rejected, redirecting to profile");
      // Update userData with rejected status
      const userData = JSON.parse(localStorage.getItem("userData") || "{}");
      userData.conselhoStatus = "recusado";
      localStorage.setItem("userData", JSON.stringify(userData));
      
      setLocation("/perfil");
    }
  }, [statusData, setLocation]);



  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pendente":
        return <Clock className="w-16 h-16 text-yellow-500 animate-pulse" />;
      case "aprovado":
        return <CheckCircle className="w-16 h-16 text-green-500" />;
      case "recusado":
        return <XCircle className="w-16 h-16 text-red-500" />;
      default:
        return <Clock className="w-16 h-16 text-gray-400" />;
    }
  };

  const getStatusMessage = (status: string) => {
    switch (status) {
      case "pendente":
        return {
          title: "Aguardando Aprovação",
          description: "Seu acesso ao Conselho está sendo validado. Aguarde a aprovação do administrador.",
          badge: "Pendente",
          badgeColor: "bg-yellow-100 text-yellow-800",
        };
      case "aprovado":
        return {
          title: "Acesso Aprovado!",
          description: "Seu acesso ao Conselho foi aprovado. Redirecionando...",
          badge: "Aprovado",
          badgeColor: "bg-green-100 text-green-800",
        };
      case "recusado":
        return {
          title: "Acesso Negado",
          description: "Seu acesso ao Conselho não foi autorizado. Entre em contato com o administrador para mais informações.",
          badge: "Recusado",
          badgeColor: "bg-red-100 text-red-800",
        };
      default:
        return {
          title: "Verificando Status",
          description: "Verificando seu status de acesso...",
          badge: "Verificando",
          badgeColor: "bg-gray-100 text-gray-800",
        };
    }
  };

  if (isLoading) {
    return <Loading />;
  }

  const status = statusData?.status || "pendente";
  const statusInfo = getStatusMessage(status);

  console.log("Component render - showNameModal:", showNameModal);
  console.log("Component render - userName:", userName);
  console.log("Component render - requestSubmitted:", requestSubmitted);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center p-4">
      {/* Name Collection Modal */}
      {showNameModal && (
        <Dialog open={showNameModal} onOpenChange={() => {}}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-center">
                Bem-vindo ao Conselho!
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-center text-gray-600">
                Enquanto você aguarda a aprovação, nos diga seu nome para personalizar sua experiência no Conselho.
              </p>
              
              <div className="space-y-2">
                <Label htmlFor="name">Nome completo</Label>
                <Input
                  id="name"
                  placeholder="Digite seu nome completo"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleNameSubmit();
                    }
                  }}
                />
              </div>
              
              <Button 
                onClick={handleNameSubmit}
                disabled={isSubmittingName || !nameInput.trim()}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                {isSubmittingName ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <User className="w-4 h-4 mr-2" />
                )}
                {isSubmittingName ? "Enviando..." : "Confirmar Nome"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      <div className="w-full max-w-md space-y-6">
        {/* Logo */}
        <div className="text-center">
          <Logo size="lg" className="mx-auto" />
        </div>

        {/* Status Card */}
        <Card className="w-full shadow-xl border-0">
          <CardHeader className="text-center pb-4">
            <div className="flex justify-center mb-4">
              {getStatusIcon(status)}
            </div>
            <CardTitle className="text-2xl font-bold text-gray-800 mb-2">
              {statusInfo.title}
            </CardTitle>
            <Badge className={`${statusInfo.badgeColor} text-sm px-3 py-1`}>
              {statusInfo.badge}
            </Badge>
          </CardHeader>
          
          <CardContent className="text-center space-y-6">
            <p className="text-gray-600 leading-relaxed">
              {userName ? `Olá, ${userName}!` : "Olá!"} {statusInfo.description}
            </p>

            {status === "pendente" && (
              <div className="flex flex-col items-center space-y-4">
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Verificando status automaticamente...</span>
                </div>
              </div>
            )}

            {status === "aprovado" && statusData?.approvedBy && (
              <div className="text-sm text-gray-500">
                Aprovado por: {statusData.approvedBy}
              </div>
            )}

            {status === "recusado" && (
              <div className="space-y-4">
                <Button 
                  onClick={() => setLocation("/entrar")} 
                  variant="outline" 
                  className="w-full"
                >
                  Voltar ao Login
                </Button>
                
                <div className="text-sm text-gray-500">
                  Entre em contato com o administrador para mais informações sobre o acesso negado.
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Additional Info */}
        <div className="text-center">
          <p className="text-sm text-gray-500">
            Clube do Grito - Sistema de Acesso ao Conselho
          </p>
        </div>
      </div>
    </div>
  );
}