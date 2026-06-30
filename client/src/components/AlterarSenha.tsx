import { useState } from "react";
import { clearLocalStoragePreservingLgpd } from "@/lib/auth-session";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Lock, Eye, EyeOff } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface AlterarSenhaProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export default function AlterarSenha({ open, onOpenChange, onSuccess }: AlterarSenhaProps) {
  const { toast } = useToast();
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [loading, setLoading] = useState(false);
  
  // Estados para mostrar/ocultar senhas
  const [mostrarSenhaAtual, setMostrarSenhaAtual] = useState(false);
  const [mostrarNovaSenha, setMostrarNovaSenha] = useState(false);
  const [mostrarConfirmarSenha, setMostrarConfirmarSenha] = useState(false);

  const handleAlterarSenha = async () => {
    if (!senhaAtual || !novaSenha || !confirmarSenha) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos",
        variant: "destructive",
      });
      return;
    }

    if (novaSenha !== confirmarSenha) {
      toast({
        title: "Senhas não conferem",
        description: "A nova senha e a confirmação devem ser iguais",
        variant: "destructive",
      });
      return;
    }

    if (novaSenha.length < 8) {
      toast({
        title: "Senha fraca",
        description: "A senha deve ter no mínimo 8 caracteres",
        variant: "destructive",
      });
      return;
    }

    if (!/[A-Z]/.test(novaSenha)) {
      toast({
        title: "Senha fraca",
        description: "A senha deve conter pelo menos uma letra maiúscula",
        variant: "destructive",
      });
      return;
    }

    if (!/[0-9]/.test(novaSenha)) {
      toast({
        title: "Senha fraca",
        description: "A senha deve conter pelo menos um número",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      await apiRequest("/api/coordenador/alterar-senha", {
        method: "POST",
        body: JSON.stringify({
          senhaAtual,
          novaSenha,
        }),
      });

      toast({
        title: "Senha alterada!",
        description: "Sua senha foi alterada. Faça login novamente com a nova senha.",
      });

      // Limpar campos e fechar modal
      setSenhaAtual("");
      setNovaSenha("");
      setConfirmarSenha("");
      onOpenChange(false);
      
      // Forçar reautenticação: fazer logout
      setTimeout(() => {
        clearLocalStoragePreservingLgpd();
        sessionStorage.clear();
        window.location.href = "/login/coordenador";
      }, 1500);
      
      // Callback de sucesso (se fornecido)
      onSuccess?.();
    } catch (error: any) {
      toast({
        title: "Erro ao alterar senha",
        description: error.message || "Verifique se a senha atual está correta",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    // Limpar campos ao fechar
    if (!isOpen) {
      setSenhaAtual("");
      setNovaSenha("");
      setConfirmarSenha("");
      setMostrarSenhaAtual(false);
      setMostrarNovaSenha(false);
      setMostrarConfirmarSenha(false);
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5" />
            Alterar Senha
          </DialogTitle>
          <DialogDescription>
            Digite sua senha atual e escolha uma nova senha
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="senha-atual">Senha Atual</Label>
            <div className="relative">
              <Input
                id="senha-atual"
                type={mostrarSenhaAtual ? "text" : "password"}
                value={senhaAtual}
                onChange={(e) => setSenhaAtual(e.target.value)}
                placeholder="Digite sua senha atual"
                disabled={loading}
                data-testid="input-senha-atual"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setMostrarSenhaAtual(!mostrarSenhaAtual)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                disabled={loading}
              >
                {mostrarSenhaAtual ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="nova-senha">Nova Senha</Label>
            <div className="relative">
              <Input
                id="nova-senha"
                type={mostrarNovaSenha ? "text" : "password"}
                value={novaSenha}
                onChange={(e) => setNovaSenha(e.target.value)}
                placeholder="Mín. 8 caracteres, 1 maiúscula, 1 número"
                disabled={loading}
                data-testid="input-nova-senha"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setMostrarNovaSenha(!mostrarNovaSenha)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                disabled={loading}
              >
                {mostrarNovaSenha ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmar-senha">Confirmar Nova Senha</Label>
            <div className="relative">
              <Input
                id="confirmar-senha"
                type={mostrarConfirmarSenha ? "text" : "password"}
                value={confirmarSenha}
                onChange={(e) => setConfirmarSenha(e.target.value)}
                placeholder="Digite a nova senha novamente"
                disabled={loading}
                data-testid="input-confirmar-senha"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setMostrarConfirmarSenha(!mostrarConfirmarSenha)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                disabled={loading}
              >
                {mostrarConfirmarSenha ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
            data-testid="button-cancelar-senha"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleAlterarSenha}
            disabled={loading}
            data-testid="button-salvar-senha"
          >
            {loading ? "Salvando..." : "Salvar Nova Senha"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
