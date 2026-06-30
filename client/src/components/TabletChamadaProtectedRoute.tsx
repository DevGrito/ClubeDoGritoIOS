import { useEffect } from "react";
import { useLocation } from "wouter";
import { Loader2 } from "lucide-react";
import { useAuthSession } from "@/hooks/useAuthSession";
import { syncTabletChamadaCache } from "@/lib/auth-session";

interface Props {
  children: React.ReactNode;
}

/** Protege rotas do tablet — exige sessão backend com actorType tablet_chamada. */
export function TabletChamadaProtectedRoute({ children }: Props) {
  const [, setLocation] = useLocation();
  const { data: session, isFetched, isLoading } = useAuthSession();

  useEffect(() => {
    if (!isFetched || isLoading) return;
    if (session?.actorType !== "tablet_chamada") {
      setLocation("/tablet/chamada/login");
      return;
    }
    syncTabletChamadaCache(session);
  }, [session, isFetched, isLoading, setLocation]);

  if (!isFetched || isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-yellow-400" />
      </div>
    );
  }

  if (session?.actorType !== "tablet_chamada") {
    return null;
  }

  return <>{children}</>;
}
