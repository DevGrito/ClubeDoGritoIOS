import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest, authFetch } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Package, Save, Shield, Loader2 } from "lucide-react";
import { LgpdLegalHeaderButtons, LgpdMeusDadosSettingsPanel } from "@/components/LgpdLegalMenuSection";
import { PushNotificationSettings } from "@/components/PushNotificationSettings";
import AreaConsentGate, { useAreaConsentReady } from "@/components/AreaConsentGate";
import { useLocation } from "wouter";
import { useAuthSession } from "@/hooks/useAuthSession";
import { logoutAndClearSession } from "@/lib/auth-session";

const MESES = [
  { v: 1, l: "Janeiro" }, { v: 2, l: "Fevereiro" }, { v: 3, l: "Março" },
  { v: 4, l: "Abril" }, { v: 5, l: "Maio" }, { v: 6, l: "Junho" },
  { v: 7, l: "Julho" }, { v: 8, l: "Agosto" }, { v: 9, l: "Setembro" },
  { v: 10, l: "Outubro" }, { v: 11, l: "Novembro" }, { v: 12, l: "Dezembro" },
];

const emptyForm = () => ({
  outletDoacoesRecebidas: "",
  cacambasDoBem: "",
  outletPecasVendidas: "",
  outletClientesAtendidos: "",
  outletLivesRealizadas: "",
  outletValorVendas: "",
  griffteClientesAtendidos: "",
  grifftePedidosEntregues: "",
  grifftePecasConfeccionadas: "",
  griffteValorVendas: "",
});

function FieldRow({ label, field, form, setForm, readOnly }: { label: string; field: string; form: any; setForm: any; readOnly?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <label className="text-sm text-slate-300 flex-1 min-w-0">{label}</label>
      <Input
        type="number"
        min="0"
        value={form[field]}
        onChange={e => !readOnly && setForm((f: any) => ({ ...f, [field]: e.target.value }))}
        className={`w-28 text-right border-slate-600 text-white ${readOnly ? "bg-slate-700 opacity-70 cursor-not-allowed" : "bg-slate-800"}`}
        placeholder="0"
        readOnly={readOnly}
      />
    </div>
  );
}

export default function CoordenadorAlmoxarifadoPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { ready: consentReady, checking: consentChecking, markReady: setConsentReady } =
    useAreaConsentReady("employees");
  const { data: session, isLoading, isFetched } = useAuthSession();

  const anoAtual = new Date().getFullYear();
  const mesAtual = new Date().getMonth() + 1;
  const [ano, setAno] = useState(anoAtual);
  const [mes, setMes] = useState<number | "">(mesAtual);
  const [form, setForm] = useState(emptyForm());
  const isAnual = mes === "";

  const { data: existing, isFetching } = useQuery<any>({
    queryKey: ["/api/negocios-sociais/entrada", ano, mes],
    queryFn: async () => {
      const p = new URLSearchParams({ ano: String(ano) });
      if (mes) p.append("mes", String(mes));
      const r = await authFetch(`/api/negocios-sociais/entrada?${p}`);
      if (!r.ok) throw new Error("Falha ao carregar dados");
      return r.json();
    },
    enabled: !!session?.id,
  });

  useEffect(() => {
    if (existing) {
      setForm({
        outletDoacoesRecebidas:     String(existing.outlet_doacoes_recebidas       ?? ""),
        cacambasDoBem:              String(existing.cacambas_do_bem                ?? ""),
        outletPecasVendidas:        String(existing.outlet_pecas_vendidas          ?? ""),
        outletClientesAtendidos:    String(existing.outlet_clientes_atendidos      ?? ""),
        outletLivesRealizadas:      String(existing.outlet_lives_realizadas        ?? ""),
        outletValorVendas:          String(existing.outlet_valor_vendas            ?? ""),
        griffteClientesAtendidos:   String(existing.griffte_clientes_atendidos     ?? ""),
        grifftePedidosEntregues:    String(existing.griffte_pedidos_entregues      ?? ""),
        grifftePecasConfeccionadas: String(existing.griffte_pecas_confeccionadas   ?? ""),
        griffteValorVendas:         String(existing.griffte_valor_vendas           ?? ""),
      });
    } else if (existing === null) {
      setForm(emptyForm());
    }
  }, [existing]);

  const save = useMutation({
    mutationFn: () => apiRequest("/api/negocios-sociais/entrada", {
      method: "POST",
      body: JSON.stringify({ ano, mes: mes || null, ...form }),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/negocios-sociais/entrada"] });
      queryClient.invalidateQueries({ queryKey: ["/api/negocios-sociais"] });
      toast({ title: "Dados salvos!", description: "Os indicadores do Gestão à Vista foram atualizados." });
    },
    onError: (e: any) => toast({ title: "Erro ao salvar", description: e.message, variant: "destructive" }),
  });

  const handleLogout = async () => {
    await logoutAndClearSession();
    window.location.href = "/login/coordenador";
  };

  if (consentChecking) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
      </div>
    );
  }
  if (!consentReady) {
    return (
      <AreaConsentGate area="employees" onAccept={() => setConsentReady()} onNavigate={setLocation} />
    );
  }

  if (!isFetched || isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
      </div>
    );
  }

  if (!session?.id) return null;

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="bg-slate-900 border-b border-slate-700 px-4 py-4 md:px-6 border-l-4 border-l-amber-500">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center">
              <Package className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Almoxarifado</h1>
              <p className="text-slate-400 text-sm">Atualização dos indicadores — Gestão à Vista</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <LgpdLegalHeaderButtons tone="dark" />
            <Button variant="outline" size="sm" className="border-slate-600 text-slate-900 bg-white hover:bg-slate-100"
              onClick={handleLogout}>
              Sair
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 md:px-6 max-w-2xl space-y-6">
        <PushNotificationSettings variant="panel" />
        <LgpdMeusDadosSettingsPanel dark />
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-slate-400 mb-3 uppercase tracking-widest">Período de referência</p>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-xs text-slate-400 mb-1 block">Mês</label>
                <select
                  value={mes}
                  onChange={e => setMes(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full bg-slate-700 text-white text-sm border border-slate-600 rounded-md px-3 py-2 focus:outline-none focus:border-amber-400">
                  <option value="">Anual (sem mês)</option>
                  {MESES.map(m => <option key={m.v} value={m.v}>{m.l}</option>)}
                </select>
              </div>
              <div className="w-28">
                <label className="text-xs text-slate-400 mb-1 block">Ano</label>
                <select value={ano} onChange={e => setAno(Number(e.target.value))}
                  className="w-full bg-slate-700 text-white text-sm border border-slate-600 rounded-md px-3 py-2 focus:outline-none focus:border-amber-400">
                  <option value={2026}>2026</option>
                </select>
              </div>
            </div>
            {isFetching && <p className="text-xs text-amber-400 mt-2">Carregando dados salvos...</p>}
            {existing && !isFetching && (
              <p className="text-xs text-green-400 mt-2">✓ Dados existentes carregados para edição</p>
            )}
            {existing === null && !isFetching && (
              <p className="text-xs text-slate-500 mt-2">Nenhum dado salvo para este período — preencha abaixo para criar</p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-l-4 border-l-amber-400 border-slate-700">
          <CardHeader className="pb-2 pt-4">
            <CardTitle className="flex items-center gap-2 text-base text-white">
              <Package className="w-5 h-5 text-amber-400" />
              IOG Outlet — Almoxarifado
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <FieldRow label="Itens Recebidos (doações)" field="outletDoacoesRecebidas" form={form} setForm={setForm} readOnly={isAnual} />
            <FieldRow label="Caçambas do Bem"           field="cacambasDoBem"          form={form} setForm={setForm} readOnly={isAnual} />
          </CardContent>
        </Card>

        <div className="pb-8">
          {isAnual ? (
            <div className="w-full bg-slate-700 border border-slate-600 rounded-lg p-4 text-center">
              <p className="text-amber-400 text-sm font-semibold">Total anual calculado automaticamente</p>
              <p className="text-slate-400 text-xs mt-1">
                Os valores acima são a soma de todos os meses salvos em {ano}. Para alterar, edite cada mês individualmente.
              </p>
            </div>
          ) : (
            <>
              <Button
                className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold text-base py-3 h-auto"
                onClick={() => save.mutate()}
                disabled={save.isPending}
              >
                <Save className="w-5 h-5 mr-2" />
                {save.isPending ? "Salvando..." : "Salvar e atualizar Gestão à Vista"}
              </Button>
              <p className="text-center text-xs text-slate-500 mt-2">
                Os indicadores serão atualizados imediatamente no painel público e o total anual será recalculado.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
