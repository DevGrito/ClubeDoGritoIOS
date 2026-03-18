import { useQuery } from "@tanstack/react-query";
import { getPct, getColor, SectorCard, MESES_PT } from "./shared";

interface Props { ano: string; mes: string; }

/* ── Card com meta + nota prorata ────────────────────────────────── */
function NKpiCard({ label, valor, meta, note, inverse = false }: {
  label: string; valor: number; meta: number; note?: string; inverse?: boolean;
}) {
  const pct   = getPct(valor, meta);
  const color = getColor(valor, meta, inverse);

  return (
    <div className="bg-slate-900/60 rounded-lg border border-slate-700/40 p-3 flex flex-col h-full">
      <p className="text-[11px] text-slate-400 uppercase tracking-widest leading-tight">{label}</p>
      <div className="flex-1 flex items-center gap-2 py-1">
        <span className="text-4xl font-bold text-white tabular-nums leading-none">{valor.toLocaleString('pt-BR')}</span>
        <span className="text-[13px] text-slate-500 leading-none">/ {meta.toLocaleString('pt-BR')}</span>
      </div>
      <div className="flex items-end justify-between">
        <div className="flex flex-col">
          {note && note.split(' · ').map((line, i) => (
            <span key={i} className="text-[10px] text-slate-500 leading-tight">{line}</span>
          ))}
        </div>
        <span className="text-[14px] font-bold tabular-nums leading-none" style={{ color }}>{pct}%</span>
      </div>
    </div>
  );
}

/* ── Card sem meta ───────────────────────────────────────────────── */
function NKpiCardNoMeta({ label, valor }: { label: string; valor: number }) {
  return (
    <div className="bg-slate-900/60 rounded-lg border border-slate-700/40 p-3 flex flex-col h-full">
      <p className="text-[11px] text-slate-400 uppercase tracking-widest leading-tight">{label}</p>
      <div className="flex-1 flex items-center py-1">
        <span className="text-4xl font-bold text-white tabular-nums leading-none">{valor.toLocaleString('pt-BR')}</span>
      </div>
    </div>
  );
}

/* ── Tab principal ───────────────────────────────────────────────── */
export default function TabNegocios({ ano, mes }: Props) {
  const negMes = ano === '2026' && mes !== 'todos' ? `&mes=${mes}` : '';

  const { data: negocios } = useQuery<any>({
    queryKey: ['/api/negocios-sociais', ano, mes],
    queryFn: () => fetch(`/api/negocios-sociais?ano=${ano}${negMes}`).then(r => r.json()),
    refetchInterval: 60000,
  });

  const outlet  = negocios?.data?.outlet  || {};
  const griffte = negocios?.data?.griffte || {};

  const itensRecebidos   = outlet.doacoesRecebidas      || 0;
  const itensVendidos    = outlet.pecasVendidas          || 0;
  const cacambasDoBem    = outlet.cacambasDoBem          || 0;
  const clientesAtend    = griffte.clientesAtendidos     || 0;
  const pedidosEntregues = griffte.pedidosEntregues      || 0;
  const pecasProduzidas  = griffte.pecasConfeccionadas   || 0;

  const mesNumRaw = mes === 'todos' ? NaN : parseInt(mes);
  const mesNum    = isNaN(mesNumRaw) || mesNumRaw <= 0 ? new Date().getMonth() + 1 : mesNumRaw;
  const mesLabel  = MESES_PT[mesNum - 1];

  const META_ITENS_RECEBIDOS = 20000;
  const META_CACAMBAS        = 20;

  const metaItensRecebidos = Math.round(META_ITENS_RECEBIDOS * mesNum / 12);
  const metaCacambas       = Math.round(META_CACAMBAS        * mesNum / 12);

  return (
    <div className="flex flex-col md:grid md:grid-cols-12 gap-3 md:h-full md:min-h-0">

      {/* ── Esquerda: IOG Outlet ── */}
      <div className="md:col-span-6 flex flex-col md:min-h-0">
        <SectorCard title="IOG Outlet" accent="#eab308" className="flex-1">
          <div className="grid grid-cols-2 gap-2">
            <NKpiCard
              label="Itens Recebidos"
              valor={itensRecebidos}
              meta={metaItensRecebidos}
              note={`Meta até ${mesLabel}: ${metaItensRecebidos.toLocaleString('pt-BR')} (Anual: ${META_ITENS_RECEBIDOS.toLocaleString('pt-BR')})`}
            />
            <NKpiCardNoMeta label="Itens Vendidos" valor={itensVendidos} />
            <div className="col-span-2">
              <NKpiCard
                label="Caçambas do Bem"
                valor={cacambasDoBem}
                meta={metaCacambas}
                note={`Meta até ${mesLabel}: ${metaCacambas.toLocaleString('pt-BR')} (Anual: ${META_CACAMBAS.toLocaleString('pt-BR')})`}
              />
            </div>
          </div>
        </SectorCard>
      </div>

      {/* ── Direita: IOG Confecção ── */}
      <div className="md:col-span-6 flex flex-col md:min-h-0">
        <SectorCard title="IOG Confecção" accent="#f97316" className="flex-1">
          <div className="grid grid-cols-2 gap-2">
            <NKpiCardNoMeta label="Clientes Atendidos"  valor={clientesAtend}    />
            <NKpiCardNoMeta label="Pedidos Entregues"   valor={pedidosEntregues} />
            <div className="col-span-2">
              <NKpiCardNoMeta label="Peças Produzidas" valor={pecasProduzidas} />
            </div>
          </div>
        </SectorCard>
      </div>

    </div>
  );
}
