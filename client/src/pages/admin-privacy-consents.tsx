import { useLocation } from "wouter";
import { ArrowLeft, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthSession } from "@/hooks/useAuthSession";
import { adminReturnPath } from "@/lib/admin-return-path";
import PrivacyConsentsAuditSection from "@/components/dev/PrivacyConsentsAuditSection";
import LgpdCoverageSummary from "@/components/dev/LgpdCoverageSummary";

export default function AdminPrivacyConsents() {
  const [, setLocation] = useLocation();
  const { data: session } = useAuthSession();
  const backTo = adminReturnPath(session?.papel || session?.role);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <Button variant="ghost" size="sm" onClick={() => setLocation(backTo)}>
          <ArrowLeft className="w-4 h-4 mr-1" />
          Voltar
        </Button>
        <div className="flex-1">
          <h1 className="text-lg font-bold flex items-center gap-2">
            <Shield className="w-5 h-5 text-indigo-700" />
            Auditoria de Consentimentos (LGPD)
          </h1>
          <p className="text-xs text-gray-500">
            Trilha de consentimentos com filtros e exportação CSV
          </p>
        </div>
      </header>

      <main className="pb-16 px-4 pt-4 space-y-4 max-w-6xl mx-auto">
        <LgpdCoverageSummary active />
        <PrivacyConsentsAuditSection active />
      </main>
    </div>
  );
}
