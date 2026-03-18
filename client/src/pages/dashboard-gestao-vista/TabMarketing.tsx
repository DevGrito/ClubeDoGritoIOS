import { useQuery } from "@tanstack/react-query";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import { getPct, getColor, SectorCard, MESES_PT } from "./shared";

interface Props { ano: string; mes: string; }

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
  const pct   = getPct(valor, meta);
  const color = getColor(valor, meta, inverse);
  const dVal  = format === 'percent' ? `${valor}%` : valor.toLocaleString('pt-BR');
  const dMeta = format === 'percent' ? `${meta}%`  : meta.toLocaleString('pt-BR');

  return (
    <div className="bg-slate-900/60 rounded-lg border border-slate-700/40 p-3 flex flex-col h-full">
      <p className="text-[11px] text-slate-400 uppercase tracking-widest leading-tight">{label}</p>
      <div className="flex-1 flex items-center gap-2 py-1">
        <span className="text-4xl font-bold text-white tabular-nums leading-none">{dVal}</span>
        <span className="text-[13px] text-slate-500 leading-none">/ {dMeta}</span>
      </div>
      <div className="flex justify-between items-end">
        {note ? <span className="text-[9px] text-slate-500 leading-tight">{note}</span> : <span />}
        <span className="text-[14px] font-bold tabular-nums leading-none" style={{ color }}>{pct}%</span>
      </div>
    </div>
  );
}

function MSection({ title }: { title: string }) {
  return (
    <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold pt-1">{title}</p>
  );
}

export default function TabMarketing({ ano, mes }: Props) {
  const is2026 = ano === '2026';

  const { data: indMkt } = useQuery<any>({
    queryKey: ['/api/indicadores-marketing', ano],
    queryFn: () => fetch(`/api/indicadores-marketing?ano=${ano}`).then(r => r.json()),
    refetchInterval: 60000,
  });

  const { data: doadores } = useQuery<any>({
    queryKey: ['/api/doadores/stats'],
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

  const mkt     = indMkt?.data;
  const segRows: any[] = segMensal?.data || [];
  const igFollowers = igMetrics?.data?.followers_total  || 0;
  const igMedia     = igMetrics?.data?.media_count      || 0;
  const igReach     = igMetrics?.data?.reach            || 0;
  const igViews     = igMetrics?.data?.profile_views    || 0;
  const igEngaged   = igMetrics?.data?.accounts_engaged || 0;
  const igClicks    = igMetrics?.data?.website_clicks   || 0;

  const doadoresAtivos   = (doadores?.porStatus?.active || 0) + (doadores?.porStatus?.trialing || 0);
  const doadoresEvadidos = doadores?.porStatus?.canceled || 0;

  const segByMes: Record<string, any> = {};
  for (const r of segRows) segByMes[String(r.mes)] = r;
  const mesData = segByMes[mes];

  const acumulado   = (key: string) => segRows.reduce((acc, r) => acc + (r[key] || 0), 0);

  // Meta proporcional ao mês vigente (igual aos outros indicadores)
  const mesNum = mes !== 'todos' ? Number(mes) : new Date().getMonth() + 1;

  const segGanhos     = is2026 ? (mes === 'todos' ? acumulado('seguidores_ganhos')  : (mesData?.seguidores_ganhos  ?? 0)) : (mkt?.seguidores_ganhos      || 0);
  const metaGanhos    = is2026 ? Math.round(META_GANHOS_ANUAL * mesNum / 12)  : (mkt?.seguidores_ganhos_meta  || 1);
  const segPerdidos   = is2026 ? (mes === 'todos' ? acumulado('seguidores_perdidos') : (mesData?.seguidores_perdidos ?? 0)) : (mkt?.seguidores_perdidos     || 0);
  const metaPerdidos  = is2026 ? Math.round(META_PERDIDOS_ANUAL * mesNum / 12) : (mkt?.seguidores_perdidos_meta || 1);
  const totalSeguidores = mes === 'todos'
    ? (igFollowers || (segRows.length > 0 ? segRows[segRows.length - 1].total_seguidores : SEGUIDORES_BASE))
    : (mesData?.total_seguidores ?? igFollowers ?? SEGUIDORES_BASE);
  const metaDoadores = Math.round(META_DOADORES_ANUAL * mesNum / 12);
  const metaEvadidos = Math.round(META_EVADIDOS_ANUAL * mesNum / 12);
  const noteDoadoresAtivos = mesNum < 12
    ? `Meta até ${MESES_PT[mesNum - 1]}: ${metaDoadores.toLocaleString('pt-BR')} (Anual: ${META_DOADORES_ANUAL.toLocaleString('pt-BR')})`
    : undefined;
  const noteDoadoresEvadidos = mesNum < 12
    ? `Meta até ${MESES_PT[mesNum - 1]}: ${metaEvadidos.toLocaleString('pt-BR')} (Anual: ${META_EVADIDOS_ANUAL.toLocaleString('pt-BR')})`
    : undefined;
  const noteSegGanhos = is2026 && mesNum < 12
    ? `Meta até ${MESES_PT[mesNum - 1]}: ${metaGanhos.toLocaleString('pt-BR')} (Anual: ${META_GANHOS_ANUAL.toLocaleString('pt-BR')})`
    : undefined;
  const noteSegPerdidos = is2026 && mesNum < 12
    ? `Meta até ${MESES_PT[mesNum - 1]}: ${metaPerdidos.toLocaleString('pt-BR')} (Anual: ${META_PERDIDOS_ANUAL.toLocaleString('pt-BR')})`
    : undefined;

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
                <MKpiCard label="Total de Seguidores" valor={totalSeguidores} meta={META_SEGUIDORES_ANUAL} />
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
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
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
