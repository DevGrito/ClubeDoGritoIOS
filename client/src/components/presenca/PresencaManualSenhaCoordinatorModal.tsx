import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Lock, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Vertente = "pec" | "inclusao";

interface SenhaStatus {
  definida: boolean;
  expirada: boolean;
  expiraEm: string | null;
  requerTroca: boolean;
  diasRestantes: number | null;
}

interface Props {
  vertente: Vertente;
  vertenteLabel: string;
}

/** Modal bloqueante: coordenador define ou troca senha de chamada manual (validade 2 meses). */
export default function PresencaManualSenhaCoordinatorModal({ vertente, vertenteLabel }: Props) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [senhaAtual, setSenhaAtual] = useState("");
  const [senhaNova, setSenhaNova] = useState("");
  const [senhaConfirm, setSenhaConfirm] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  const { data: status, isLoading } = useQuery<SenhaStatus>({
    queryKey: ["/api/presenca-manual-senha/status", vertente],
    queryFn: async () => {
      const res = await fetch(`/api/presenca-manual-senha/status?vertente=${vertente}`, {
        credentials: "include",
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Erro ao carregar status");
      return res.json();
    },
    staleTime: 0,
  });

  const bloqueado = !isLoading && status?.requerTroca;

  const handleSalvar = async () => {
    setErro("");
    if (!senhaNova || senhaNova !== senhaConfirm) {
      setErro("Confirmação da nova senha não confere.");
      return;
    }
    if (status?.definida && !senhaAtual) {
      setErro("Informe a senha atual.");
      return;
    }
    setSalvando(true);
    try {
      const res = await fetch("/api/presenca-manual-senha/definir", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vertente,
          senhaAtual: status?.definida ? senhaAtual : undefined,
          senhaNova,
          senhaNovaConfirmacao: senhaConfirm,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErro(data.error || "Erro ao salvar senha.");
        return;
      }
      toast({
        title: status?.definida ? "Senha atualizada" : "Senha definida",
        description: `Válida por 2 meses. Repasse aos monitores e tablets de ${vertenteLabel}.`,
      });
      setSenhaAtual("");
      setSenhaNova("");
      setSenhaConfirm("");
      await queryClient.invalidateQueries({ queryKey: ["/api/presenca-manual-senha/status", vertente] });
    } catch {
      setErro("Erro de conexão.");
    } finally {
      setSalvando(false);
    }
  };

  if (isLoading) return null;
  if (!bloqueado) return null;

  return (
    <Dialog open modal onOpenChange={() => {}}>
      <DialogContent
        className="max-w-md"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-orange-500" />
            Senha da chamada manual — {vertenteLabel}
          </DialogTitle>
          <DialogDescription asChild>
            <div className="space-y-2 text-sm">
              {!status?.definida ? (
                <p>Defina a senha alfanumérica para chamadas manuais desta vertente. Monitores e tablets usarão esta senha.</p>
              ) : (
                <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3 text-amber-900">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <p>
                    A senha expirou ou está prestes a vencer. É obrigatório definir uma nova senha para liberar chamadas manuais.
                  </p>
                </div>
              )}
              <p className="text-xs text-muted-foreground">Mínimo 8 caracteres, letras e números. Validade: 2 meses.</p>
            </div>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {status?.definida && (
            <div>
              <Label>Senha atual</Label>
              <Input
                type="password"
                value={senhaAtual}
                onChange={(e) => setSenhaAtual(e.target.value)}
                autoComplete="current-password"
              />
            </div>
          )}
          <div>
            <Label>Nova senha</Label>
            <Input
              type="password"
              value={senhaNova}
              onChange={(e) => setSenhaNova(e.target.value)}
              autoComplete="new-password"
            />
          </div>
          <div>
            <Label>Confirmar nova senha</Label>
            <Input
              type="password"
              value={senhaConfirm}
              onChange={(e) => setSenhaConfirm(e.target.value)}
              autoComplete="new-password"
            />
          </div>
          {erro && <p className="text-sm text-red-600">{erro}</p>}
        </div>

        <DialogFooter>
          <Button onClick={handleSalvar} disabled={salvando} className="w-full bg-orange-500 hover:bg-orange-600">
            {salvando ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              "Salvar senha"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
