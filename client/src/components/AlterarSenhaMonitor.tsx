import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Lock, Shield } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface AlterarSenhaMonitorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export default function AlterarSenhaMonitor({ open, onOpenChange, onSuccess }: AlterarSenhaMonitorProps) {
  const { toast } = useToast();
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [loading, setLoading] = useState(false);

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
      await apiRequest("/api/monitor/alterar-senha", {
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
        localStorage.clear();
        sessionStorage.clear();
        window.location.href = "/monitor-login";
      }, 1500);
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
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-green-600" />
            Alterar Senha - Monitor
          </DialogTitle>
          <DialogDescription>
            Para sua segurança, altere sua senha de acesso
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="senha-atual-monitor">Senha Atual</Label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <Lock className="w-4 h-4" />
              </div>
              <Input
                id="senha-atual-monitor"
                type="password"
                value={senhaAtual}
                onChange={(e) => setSenhaAtual(e.target.value)}
                placeholder="Digite sua senha atual"
                disabled={loading}
                className="pl-10"
                data-testid="input-senha-atual-monitor"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="nova-senha-monitor">Nova Senha</Label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <Lock className="w-4 h-4" />
              </div>
              <Input
                id="nova-senha-monitor"
                type="password"
                value={novaSenha}
                onChange={(e) => setNovaSenha(e.target.value)}
                placeholder="Mín. 8 caracteres, 1 maiúscula, 1 número"
                disabled={loading}
                className="pl-10"
                data-testid="input-nova-senha-monitor"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmar-senha-monitor">Confirmar Nova Senha</Label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <Lock className="w-4 h-4" />
              </div>
              <Input
                id="confirmar-senha-monitor"
                type="password"
                value={confirmarSenha}
                onChange={(e) => setConfirmarSenha(e.target.value)}
                placeholder="Digite a nova senha novamente"
                disabled={loading}
                className="pl-10"
                data-testid="input-confirmar-senha-monitor"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
            data-testid="button-cancelar-senha-monitor"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleAlterarSenha}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700"
            data-testid="button-salvar-senha-monitor"
          >
            {loading ? "Salvando..." : "Salvar Nova Senha"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
