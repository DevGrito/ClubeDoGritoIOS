import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuthSession } from "@/hooks/useAuthSession";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

const VERSAO_ATUAL = "2026-04-01";
const CACHE_KEY = "aluno_termos_aceito_versao";

// Garante que só uma instância do componente exibe o popup por vez
const SESSION_POPUP_KEY = "aluno_termos_popup_ativo";

function normalizeCpf(cpf: string): string {
  return cpf.replace(/\D/g, '');
}

async function verificarTermosAluno(cpf: string): Promise<boolean> {
  try {
    const cpfLimpo = normalizeCpf(cpf);
    if (!cpfLimpo) return true;
    const res = await fetch(`/api/termos/status?tipo=aluno&cpf=${cpfLimpo}&userId=0`);
    if (!res.ok) return false;
    const data = await res.json();
    return data.aceitou === true;
  } catch {
    return false;
  }
}

async function registrarAceiteAluno(cpf: string): Promise<boolean> {
  try {
    const cpfLimpo = normalizeCpf(cpf);
    if (!cpfLimpo) return false;
    const res = await fetch("/api/aceitar-termos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tipo: "aluno", cpf: cpfLimpo, versao: VERSAO_ATUAL }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

interface Props {
  children: React.ReactNode;
}

export default function AlunoTermosGuard({ children }: Props) {
  const [status, setStatus] = useState<"loading" | "aceito" | "pendente">("loading");
  const [recusou, setRecusou] = useState(false);
  const [aceitando, setAceitando] = useState(false);
  const [, setLocation] = useLocation();
  const { data: authSession, isFetched } = useAuthSession();

  useEffect(() => {
    if (!isFetched) return;
    const cpf =
      authSession?.actorType === "aluno_portal" && authSession.cpf
        ? authSession.cpf
        : sessionStorage.getItem("aluno_cpf");
    if (!cpf) { setStatus("aceito"); return; }

    // Chave de cache inclui o CPF para não conflitar entre alunos no mesmo dispositivo
    const cacheKey = `${CACHE_KEY}_${cpf.replace(/\D/g, '')}`;
    const cache = sessionStorage.getItem(cacheKey);
    if (cache === VERSAO_ATUAL) { setStatus("aceito"); return; }

    if (sessionStorage.getItem(SESSION_POPUP_KEY) === "true") {
      setStatus("aceito");
      return;
    }
    sessionStorage.setItem(SESSION_POPUP_KEY, "true");

    verificarTermosAluno(cpf).then((aceitou) => {
      if (aceitou) {
        sessionStorage.setItem(cacheKey, VERSAO_ATUAL);
        sessionStorage.removeItem(SESSION_POPUP_KEY);
        setStatus("aceito");
      } else {
        setStatus("pendente");
      }
    });
  }, [authSession, isFetched]);

  const handleAceitar = async () => {
    setAceitando(true);
    const cpf =
      authSession?.actorType === "aluno_portal" && authSession.cpf
        ? authSession.cpf
        : sessionStorage.getItem("aluno_cpf");
    if (cpf) {
      const ok = await registrarAceiteAluno(cpf);
      const cacheKey = `${CACHE_KEY}_${cpf.replace(/\D/g, '')}`;
      if (ok) {
        sessionStorage.setItem(cacheKey, VERSAO_ATUAL);
      }
      sessionStorage.removeItem(SESSION_POPUP_KEY);
    }
    setStatus("aceito");
    setAceitando(false);
  };

  if (status === "loading") return <>{children}</>;
  if (status === "aceito") return <>{children}</>;

  return (
    <>
      {children}
      <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center px-5">
        <div
          className="bg-white w-full max-w-sm rounded-2xl shadow-xl flex flex-col"
          style={{ maxHeight: '90vh', paddingBottom: 'env(safe-area-inset-bottom, 16px)' }}
        >
          <div className="overflow-y-auto flex-1 p-6 flex flex-col gap-5">

            {recusou ? (
              <>
                <div className="flex flex-col items-center gap-3 text-center py-2">
                  <AlertTriangle className="w-10 h-10 text-amber-400" />
                  <p className="font-semibold text-gray-800">Acesso bloqueado</p>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    É necessário aceitar os Termos de Uso para continuar usando o aplicativo.
                  </p>
                </div>
                <Button
                  className="w-full h-11 rounded-xl bg-gray-800 hover:bg-gray-700 text-white font-semibold"
                  onClick={() => setRecusou(false)}
                >
                  Voltar e aceitar
                </Button>
              </>
            ) : (
              <>
                <div className="space-y-3">
                  <p className="font-semibold text-gray-800 text-base text-center">
                    Termos de Uso e Política de Privacidade atualizados
                  </p>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    O Instituto O Grito atualizou os Termos de Uso e a Política de Privacidade do aplicativo Clube do Grito.
                  </p>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Essas atualizações são importantes para garantir mais transparência, segurança e melhorias na sua experiência. Recomendamos que você leia atentamente os documentos.
                  </p>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Para continuar utilizando o aplicativo, é necessário concordar com os novos termos.{" "}
                    <button
                      className="text-blue-600 underline font-medium"
                      onClick={() => setLocation("/termos-servicos?from=help")}
                    >
                      Ler Termos de Uso e Política de Privacidade
                    </button>
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  <Button
                    className="w-full h-11 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-black font-bold"
                    onClick={handleAceitar}
                    disabled={aceitando}
                  >
                    {aceitando ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                        Registrando...
                      </span>
                    ) : "Li e Aceito"}
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full h-9 text-gray-400 hover:text-white text-sm"
                    onClick={() => setRecusou(true)}
                  >
                    Recusar
                  </Button>
                </div>
              </>
            )}

          </div>
        </div>
      </div>
    </>
  );
}
