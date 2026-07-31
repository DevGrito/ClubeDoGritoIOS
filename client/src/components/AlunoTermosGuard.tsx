import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuthSession } from "@/hooks/useAuthSession";
import TermosAceiteDialog from "@/components/TermosAceiteDialog";

const VERSAO_ATUAL = "2026-04-01";
const CACHE_KEY = "aluno_termos_aceito_versao";

// Garante que só uma instância do componente exibe o popup por vez
const SESSION_POPUP_KEY = "aluno_termos_popup_ativo";

function normalizeCpf(cpf: string): string {
  return cpf.replace(/\D/g, "");
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
  const [erroAceite, setErroAceite] = useState<string | null>(null);
  const [, setLocation] = useLocation();
  const { data: authSession, isFetched } = useAuthSession();

  useEffect(() => {
    if (!isFetched) return;
    const cpf =
      authSession?.actorType === "aluno_portal" && authSession.cpf
        ? authSession.cpf
        : sessionStorage.getItem("aluno_cpf");
    if (!cpf) {
      setStatus("aceito");
      return;
    }

    // Chave de cache inclui o CPF para não conflitar entre alunos no mesmo dispositivo
    const cacheKey = `${CACHE_KEY}_${cpf.replace(/\D/g, "")}`;
    const cache = sessionStorage.getItem(cacheKey);
    if (cache === VERSAO_ATUAL) {
      setStatus("aceito");
      return;
    }

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
    setErroAceite(null);
    const cpf =
      authSession?.actorType === "aluno_portal" && authSession.cpf
        ? authSession.cpf
        : sessionStorage.getItem("aluno_cpf");
    if (cpf) {
      const ok = await registrarAceiteAluno(cpf);
      const cacheKey = `${CACHE_KEY}_${cpf.replace(/\D/g, "")}`;
      if (ok) {
        sessionStorage.setItem(cacheKey, VERSAO_ATUAL);
      } else {
        setErroAceite("Não foi possível registrar o aceite. Verifique sua conexão e tente novamente.");
        setAceitando(false);
        return;
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
      <TermosAceiteDialog
        recusou={recusou}
        aceitando={aceitando}
        erroAceite={erroAceite}
        onAceitar={handleAceitar}
        onRecusar={() => setRecusou(true)}
        onVoltar={() => setRecusou(false)}
        onLerTermos={() => setLocation("/termos-servicos?from=help")}
      />
    </>
  );
}
