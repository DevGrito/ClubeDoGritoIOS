import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import { useAuthSession } from "@/hooks/useAuthSession";
import { adminReturnPath } from "@/lib/admin-return-path";
import AdminRopaSection from "@/components/admin/AdminRopaSection";

export default function AdminRopa() {
  const [, setLocation] = useLocation();
  const { data: session } = useAuthSession();
  const backTo = adminReturnPath(session?.papel || session?.role);

  return (
    <div className="min-h-screen bg-gray-50" style={{ fontFamily: "SF Pro Rounded, system-ui, sans-serif" }}>
      <div className="bg-white shadow-sm sticky top-0 z-10 border-b">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setLocation(backTo)} aria-label="Voltar ao painel">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <p className="text-xs text-gray-500 uppercase tracking-wider">LGPD — Fase 5</p>
        </div>
      </div>
      <div className="max-w-5xl mx-auto px-4 py-6 pb-16">
        <AdminRopaSection />
      </div>
    </div>
  );
}
