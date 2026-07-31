import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import TermosAceiteDialog from "@/components/TermosAceiteDialog";
import {
  TERMOS_VERSAO_ATUAL,
  TERMOS_CACHE_KEY,
  getTermosActor,
  registrarAceiteTermos,
  markTermosAcceptedInSession,
  verificarTermosAceitos,
} from "@/lib/termosAcceptance";

interface TermosGuardProps {
  children: React.ReactNode;
}

export default function TermosGuard({ children }: TermosGuardProps) {
  const [status, setStatus] = useState<"loading" | "aceito" | "pendente">("loading");
  const [recusou, setRecusou] = useState(false);
  const [aceitando, setAceitando] = useState(false);
  const [erroAceite, setErroAceite] = useState<string | null>(null);
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (localStorage.getItem("dev_auth") === "true" || localStorage.getItem("userPapel") === "dev") {
      setStatus("aceito");
      return;
    }

    // Conselho/conselheiro usa AreaConsentGate (council) — evita dois modais de termos.
    const papel = (localStorage.getItem("userPapel") || "").toLowerCase();
    if (papel === "conselho" || papel === "conselheiro") {
      setStatus("aceito");
      return;
    }

    const info = getTermosActor();
    if (!info) {
      setStatus("aceito");
      return;
    }

    if (sessionStorage.getItem(TERMOS_CACHE_KEY) === TERMOS_VERSAO_ATUAL) {
      setStatus("aceito");
      return;
    }

    verificarTermosAceitos(info.userId, info.tipo).then((aceitou) => {
      if (aceitou) {
        markTermosAcceptedInSession();
        setStatus("aceito");
      } else {
        setStatus("pendente");
      }
    });
  }, []);

  const handleAceitar = async () => {
    setAceitando(true);
    setErroAceite(null);
    const info = getTermosActor();
    if (info) {
      const ok = await registrarAceiteTermos(info.userId, info.tipo);
      if (!ok) {
        setErroAceite("Não foi possível registrar o aceite. Verifique sua conexão e tente novamente.");
        setAceitando(false);
        return;
      }
      markTermosAcceptedInSession();
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
