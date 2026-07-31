import { useQuery } from "@tanstack/react-query";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import {
  getPct, getColor, SectorCard, MESES_PT, type PeriodoFiltro,
  isPeriodoTodos, isPeriodoMulti, periodoMesUnico, periodoMesesLista,
  periodoUltimoMes, metaFnPeriodo, formatMetaValor, metaNoPeriodo,
  doadoresAtivosNoPeriodo, doadoresEvadidosNoPeriodo, precisaEvadidosMesVigente,
} from "./shared";

interface Props { ano: string; periodo: PeriodoFiltro; }

const META_SEGUIDORES_ANUAL  = 15000;
const SEGUIDORES_BASE        = 11538;
const META_GANHOS_ANUAL      = META_SEGUIDORES_ANUAL - SEGUIDORES_BASE;
const META_PERDIDOS_ANUAL    = 1500;
const META_DOADORES_ANUAL    = 2000;
const META_EVADIDOS_ANUAL    = Math.round(META_DOADORES_ANUAL * 0.10); // 200

const MESES_LABELS = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

function MKpiCard({ label, valor, meta, inverse = false, format = 'number' as 'number' | 'percent', note }: {
  label: string; valor: number; meta: number; inverse?: boolean; format?: 'number' | 'percent'; note?: string;
}) {
  const hasMeta = meta > 0;
  const pct     = hasMeta ? getPct(valor, meta) : 0;
  const color   = hasMeta ? getColor(valor, meta, inverse) : '#64748b';
  const dVal    = format === 'percent' ? `${valor}%` : valor.toLocaleString('pt-BR');
  const dMeta   = formatMetaValor(meta, format);

  return (
    <div className="bg-slate-900/60 rounded-lg border border-slate-700/40 p-3 flex flex-col h-full">
      <p className="text-[11px] text-slate-400 uppercase tracking-widest leading-tight">{label}</p>
      <div className="flex-1 flex flex-col justify-center py-1 min-w-0">
        <span className="text-2xl sm:text-3xl font-bold text-white tabular-nums leading-none truncate">{dVal}</span>
        <span className="text-[11px] text-slate-500 leading-none mt-0.5">/ {dMeta}</span>
      </div>
      <div className="flex justify-between items-end">
        {note ? <span className="text-[9px] text-slate-500 leading-tight">{note}</span> : <span />}
        {hasMeta && (
          <span className="text-[14px] font-bold tabular-nums leading-none" style={{ color }}>{pct}%</span>
        )}
      </div>
    </div>
  );
}

function MSection({ title }: { title: string }) {
  return (
    <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold pt-1">{title}</p>
  );
}

export default function TabMarketing({ ano, periodo }: Props) {
  const is2026 = parseInt(ano) >= 2026;

  const { data: indMkt } = useQuery<any>({
    queryKey: ['/api/indicadores-marketing', ano],
    queryFn: () => fetch(`/api/indicadores-marketing?ano=${ano}`).then(r => r.json()),
    refetchInterval: 60000,
  });

  const { data: doadores } = useQuery<any>({
    queryKey: ['/api/doadores/stats', ano],
    queryFn: async () => { const r = await fetch(`/api/doadores/stats?ano=${ano}`, { credentials: 'include' }); if (!r.ok) return null; return r.json(); },
    refetchInterval: 60000,
  });

  const mesAtualCal = new Date().getMonth() + 1;
  const buscaEvadidosVigente = precisaEvadidosMesVigente(ano, periodo);
  const { data: doadoresMesVigente } = useQuery<any>({
    queryKey: ['/api/doadores/stats', ano, 'mes', mesAtualCal],
    queryFn: async () => {
      const r = await fetch(`/api/doadores/stats?ano=${ano}&mes=${mesAtualCal - 1}`, { credentials: 'include' });
      if (!r.ok) return null;
      return r.json();
    },
    enabled: buscaEvadidosVigente,
    refetchInterval: 60000,
  });

  const { data: segMensal } = useQuery<any>({
    queryKey: ['/api/marketing-seguidores-mensal', ano],
    queryFn: () => fetch(`/api/marketing-seguidores-mensal?ano=${ano}`).then(r => r.json()),
    refetchInterval: 60000,
  });

  const { data: igMetrics } = useQuery<any>({
    queryKey: ['/api/instagram/metrics/current'],
    queryFn: () => fetch('/api/instagram/metrics/current').then(r => r.json()),
    refetchInterval: 300000,
  });

  // Query histórico de doadores ativos/evadidos por mês
  const { data: doadoresHistorico } = useQuery<any>({
    queryKey: ['/api/doadores/historico-mensal', ano],
    queryFn: () => fetch(`/api/doadores/historico-mensal?ano=${ano}`, { credentials: 'include' }).then(r => r.json()),
    refetchInterval: 300000,
  });
  const { data: doadoresExternosMkt } = useQuery<any>({
    queryKey: ['/api/doadores-externos'],
    queryFn: () => fetch('/api/doadores-externos').then(r => r.json()),
    staleTime: 0,
    refetchOnMount: 'always',
  });

  const mkt     = indMkt?.data;
  const segRows: any[] = segMensal?.data || [];
  const igFollowers = igMetrics?.data?.followers_total  || 0;
  const igMedia     = igMetrics?.data?.media_count      || 0;
  const igReach     = igMetrics?.data?.reach            || 0;
  const igViews     = igMetrics?.data?.profile_views    || 0;
  const igEngaged   = igMetrics?.data?.accounts_engaged || 0;
  const igClicks    = igMetrics?.data?.website_clicks   || 0;

  const segByMes: Record<string, any> = {};
  for (const r of segRows) segByMes[String(r.mes)] = r;
  const mesUnico = periodoMesUnico(periodo);
  const mesData = mesUnico ? segByMes[String(mesUnico)] : undefined;
  const mesesPeriodo = periodoMesesLista(periodo);
  const multi = isPeriodoMulti(periodo);

  const acumulado   = (key: string) => segRows.reduce((acc, r) => acc + (r[key] || 0), 0);
  const metaFn = (anual: number) => metaFnPeriodo(periodo, anual);
  const acumuladoPeriodo = (key: string) =>
    segRows.filter((r: any) => mesesPeriodo.includes(Number(r.mes))).reduce((acc: number, r: any) => acc + (r[key] || 0), 0);

  // Histórico de doadores — calculado DEPOIS de trimMeses para evitar TDZ
  const histRows: any[] = doadoresHistorico?.data || [];
  const histByMes: Record<number, any> = {};
  for (const r of histRows) histByMes[Number(r.mes)] = r;

  const extMkt = doadoresExternosMkt?.totalDoadores || 0;
  const evadidosVigenteAoVivo = buscaEvadidosVigente
    ? (doadoresMesVigente?.porStatus?.canceled ?? null)
    : null;
  const doadoresAtivos = doadoresAtivosNoPeriodo(
    ano, periodo, histByMes,
    doadores?.porStatus?.active || 0,
    doadores?.porStatus?.trialing || 0,
    doadores?.porStatus?.past_due || 0,
    extMkt,
  );
  const doadoresEvadidos = doadoresEvadidosNoPeriodo(ano, periodo, histByMes, evadidosVigenteAoVivo);

  const segGanhos   = is2026
    ? (multi ? acumuladoPeriodo('seguidores_ganhos')  : isPeriodoTodos(periodo) ? acumulado('seguidores_ganhos')  : (mesData?.seguidores_ganhos  ?? 0))
    : (mkt?.seguidores_ganhos  || 0);
  const metaGanhos  = is2026 ? metaFn(META_GANHOS_ANUAL)   : (mkt?.seguidores_ganhos_meta  || 1);
  const segPerdidos = is2026
    ? (multi ? acumuladoPeriodo('seguidores_perdidos') : isPeriodoTodos(periodo) ? acumulado('seguidores_perdidos') : (mesData?.seguidores_perdidos ?? 0))
    : (mkt?.seguidores_perdidos || 0);
  const metaPerdidos = is2026 ? metaFn(META_PERDIDOS_ANUAL) : (mkt?.seguidores_perdidos_meta || 1);
  const ultimoMesPeriodo = multi ? periodoUltimoMes(periodo) : 0;
  const totalSeguidores = multi
    ? (segRows.find((r: any) => Number(r.mes) === ultimoMesPeriodo)?.total_seguidores
       ?? segRows.filter((r: any) => mesesPeriodo.includes(Number(r.mes))).slice(-1)[0]?.total_seguidores
       ?? igFollowers
       ?? SEGUIDORES_BASE)
    : isPeriodoTodos(periodo)
    ? (igFollowers || (segRows.length > 0 ? segRows[segRows.length - 1].total_seguidores : SEGUIDORES_BASE))
    : (mesData?.total_seguidores ?? igFollowers ?? SEGUIDORES_BASE);
  const metaDoadores = metaFn(META_DOADORES_ANUAL);
  const metaEvadidos = metaFn(META_EVADIDOS_ANUAL);
  const hasHistorico = histRows.length > 0;
  const noteDoadoresAtivos   = `Meta anual: ${META_DOADORES_ANUAL.toLocaleString('pt-BR')}`;
  const noteDoadoresEvadidos = `Meta anual: < ${META_EVADIDOS_ANUAL.toLocaleString('pt-BR')}`;
  const noteSegGanhos   = is2026 ? `Meta anual: ${META_GANHOS_ANUAL.toLocaleString('pt-BR')}` : undefined;
  const noteSegPerdidos = is2026 ? `Meta anual: ${META_PERDIDOS_ANUAL.toLocaleString('pt-BR')}` : undefined;

  const mesAtual = new Date().getMonth() + 1;
  const anoAtual = new Date().getFullYear();
  const isFuturo = (i: number) => Number(ano) === anoAtual && (i + 1) > mesAtual;

  const chartData = MESES_LABELS.map((m, i) => {
    const row = segRows.find((r: any) => Number(r.mes) === i + 1);
    return {
      mes: m,
      ganhos:   row?.seguidores_ganhos   || 0,
      perdidos: row?.seguidores_perdidos || 0,
    };
  });

  return (
    <div className="flex flex-col md:grid md:grid-cols-12 gap-3 md:h-full">

      <div className="md:col-span-7">
        <SectorCard title="" accent="#ec4899" className="h-auto md:h-full">
          <div className="flex flex-col h-full gap-2">

            <div className="flex flex-col gap-1" style={{ flex: 1 }}>
              <MSection title="Doadores" />
              <div className="grid grid-cols-2 gap-2" style={{ flex: 1 }}>
                <MKpiCard label="Doadores Ativos"   valor={doadoresAtivos}   meta={metaDoadores} note={noteDoadoresAtivos} />
                <MKpiCard label="Doadores Evadidos" valor={doadoresEvadidos} meta={metaEvadidos} inverse note={noteDoadoresEvadidos} />
              </div>
            </div>

            <div className="flex flex-col gap-1" style={{ flex: 1 }}>
              <MSection title="Seguidores" />
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2" style={{ flex: 1 }}>
                <MKpiCard label="Total de Seguidores" valor={totalSeguidores} meta={metaNoPeriodo(periodo, META_SEGUIDORES_ANUAL)} />
                <MKpiCard label="Seguidores Ganhos"   valor={segGanhos}   meta={metaGanhos}   note={noteSegGanhos} />
                <MKpiCard label="Seguidores Perdidos" valor={segPerdidos} meta={metaPerdidos} inverse note={noteSegPerdidos} />
              </div>
            </div>

            {/* INSTAGRAM CARDS — comentado a pedido (17/03/2026), descomentar se necessário
            <div className="flex flex-col gap-1" style={{ flex: 2 }}>
              <MSection title="Instagram" />
              <div className="grid grid-cols-3 gap-2" style={{ flex: 1 }}>
                <MKpiCard label="Posts"          valor={igMedia}   meta={500} />
                <MKpiCard label="Alcance"        valor={igReach}   meta={5000} />
                <MKpiCard label="Visitas Perfil" valor={igViews}   meta={2000} />
                <MKpiCard label="Engajamento"    valor={igEngaged} meta={1000} />
                <MKpiCard label="Cliques Site"   valor={igClicks}  meta={200} />
              </div>
            </div>
            */}

          </div>
        </SectorCard>
      </div>

      <div className="md:col-span-5 flex flex-col min-h-[240px] md:min-h-0">
        <div className="bg-slate-800/70 rounded-xl border border-slate-700/50 p-4 flex flex-col flex-1">
          <p className="text-white font-bold text-sm mb-0.5">Evolução de Seguidores</p>
          <p className="text-slate-400 text-xs mb-3">Seguidores ganhos e perdidos por mês</p>
          <div style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="mes" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickCount={5} />
                <Line type="monotone" dataKey="ganhos"   stroke="#10b981" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: '#10b981' }} name="Ganhos" />
                <Line type="monotone" dataKey="perdidos" stroke="#ef4444" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: '#ef4444' }} name="Perdidos" />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} iconSize={8} iconType="circle" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', fontSize: 11 }}
                  labelStyle={{ color: '#fff' }}
                  itemStyle={{ color: '#fff' }}
                  formatter={(v: number) => v.toLocaleString('pt-BR')}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

    </div>
  );
}
