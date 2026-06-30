import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import { getPct, getColor, SectorCard, buildQp, type PeriodoFiltro, isPeriodoMulti, metaFnPeriodo } from "./shared";
import { GestaoKpiCard } from "@/components/GestaoKpiCard";

interface Props { ano: string; periodo: PeriodoFiltro; }

const MESES_LABELS = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];


/* ── Card sem meta definida ──────────────────────────────────────────── */
function PKpiCardNoMeta({ label, valor, format = 'number' as 'number' | 'percent', className = '' }: {
  label: string; valor: number; format?: 'number' | 'percent'; className?: string;
}) {
  const dVal = format === 'percent' ? `${valor}%` : valor.toLocaleString('pt-BR');

  return (
    <div className={`bg-slate-900/60 rounded-lg border border-slate-700/40 p-3 flex flex-col h-full ${className}`}>
      <p className="text-[11px] text-slate-400 uppercase tracking-widest leading-tight">{label}</p>
      <div className="flex-1 flex items-center gap-2 py-1">
        <span className="text-4xl font-bold text-white tabular-nums leading-none">{dVal}</span>
      </div>
      <div className="flex justify-end">
        <span className="text-[14px] text-slate-600 leading-none">—</span>
      </div>
    </div>
  );
}

/* ── Barra de Frequência PEC ─────────────────────────────────────────── */
function PFreqBar({ valor, meta }: { valor: number; meta: number }) {
  const pct   = getPct(valor, meta);
  const color = getColor(valor, meta);
  const [animWidth, setAnimWidth] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setAnimWidth(Math.min(valor, 100)), 200);
    return () => clearTimeout(t);
  }, [valor]);

  return (
    <div className="bg-slate-900/60 rounded-lg border border-slate-700/40 p-3 flex flex-col flex-1 min-w-0">
      <p className="text-[11px] text-slate-400 uppercase tracking-widest leading-tight mb-2">Frequência</p>
      <div className="flex-1 flex items-center">
      <div className="flex items-center gap-3 w-full">
        <div className="flex items-baseline gap-2 flex-shrink-0">
          <span className="text-3xl font-bold text-white tabular-nums leading-none">{valor}%</span>
          <span className="text-[12px] text-slate-500">meta {meta}%</span>
        </div>
        <div className="flex-1 flex flex-col gap-1">
          <div className="h-3 bg-slate-700/60 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-1000"
              style={{ width: `${animWidth}%`, backgroundColor: color }} />
          </div>
          <div className="flex justify-between text-[9px] text-slate-500">
            <span>0%</span><span>50%</span><span>100%</span>
          </div>
        </div>
        <span className="text-[13px] font-bold tabular-nums leading-none flex-shrink-0" style={{ color }}>{pct}%</span>
      </div>
      </div>
    </div>
  );
}

/* ── Card Turmas Ativas PEC ──────────────────────────────────────────── */
interface TurmasData {
  totalAtivas: number;
  porProjeto: Array<{ projeto: string; total: number }>;
}

function PTurmasCard({ data }: { data: TurmasData | undefined }) {
  const total = data?.totalAtivas ?? 0;
  const porProjeto = data?.porProjeto ?? [];

  const nomeCurto = (nome: string) => {
    if (nome.toLowerCase().includes('polo')) return 'Polo Esp. Cultural';
    if (nome.toLowerCase().includes('casa')) return 'Casa Sonhar';
    if (nome.toLowerCase().includes('sala') || nome.toLowerCase().includes('serenata') || nome.toLowerCase().includes('serenada')) return 'Sala Serenata';
    return nome.replace(/ - \d{4}$/, '');
  };

  return (
    <div className="bg-slate-900/60 rounded-lg border border-slate-700/40 p-3 flex flex-col w-[190px] flex-shrink-0">
      <p className="text-[11px] text-slate-400 uppercase tracking-widest leading-tight mb-1">Turmas Ativas</p>
      <div className="flex items-baseline gap-1 mb-2">
        <span className="text-3xl font-bold text-white tabular-nums leading-none">{total}</span>
        <span className="text-[11px] text-slate-500">turmas</span>
      </div>
      <div className="flex flex-col gap-1">
        {porProjeto.map((p) => (
          <div key={p.projeto} className="flex items-center justify-between gap-1">
            <span className="text-[10px] text-slate-400 truncate">{nomeCurto(p.projeto)}</span>
            <span className="text-[12px] font-bold text-emerald-400 tabular-nums flex-shrink-0">{p.total}</span>
          </div>
        ))}
        {porProjeto.length === 0 && (
          <span className="text-[10px] text-slate-600">Sem dados</span>
        )}
      </div>
    </div>
  );
}

/* ── Tab principal ───────────────────────────────────────────────────── */
export default function TabPEC({ ano, periodo }: Props) {
  const qp = buildQp(ano, periodo);

  const { data: gv } = useQuery<any>({
    queryKey: ['/api/gestao-vista', ano, periodo],
    queryFn: () => fetch(`/api/gestao-vista${qp}`).then(r => r.json()),
    refetchInterval: 60000,
  });


  const { data: evolucao } = useQuery<any>({
    queryKey: ['/api/dashboard/pec/evolucao-mensal', ano],
    queryFn: () => fetch(`/api/dashboard/pec/evolucao-mensal?ano=${ano}`).then(r => r.json()),
    refetchInterval: 60000,
  });

  const { data: turmasData } = useQuery<TurmasData>({
    queryKey: ['/api/gestao-vista/turmas-ativas-pec'],
    queryFn: () => fetch('/api/gestao-vista/turmas-ativas-pec').then(r => r.json()),
    refetchInterval: 120000,
  });

  // KPIs canônicos — fonte única de verdade para PEC
  // queryKey com URL completa para o fetcher padrão usar x-user-id header
  const pecKpisUrl = `/api/pec/dashboard-kpis${qp}`;
  const { data: pecKpis } = useQuery<any>({
    queryKey: [pecKpisUrl],
    queryFn: async () => { const r = await fetch(pecKpisUrl, { credentials: 'include' }); if (!r.ok) return null; return r.json(); },
    refetchInterval: 60000,
  });

  const { data: metasDB } = useQuery<{ metas: Record<string, number> }>({
    queryKey: ['/api/metas-indicadores', ano, 'pec'],
    queryFn: () => fetch(`/api/metas-indicadores?ano=${ano}&vertente=pec`).then(r => r.json()),
    staleTime: 60000,
  });
  const metasAdm = metasDB?.metas ?? {};

  const ind          = gv?.indicadores || {};
  const pecMetas     = gv?.pecMetas || {};
  const horasAula    = pecKpis?.horasAula ?? gv?.pecData?.horasAula ?? 0;
  const atendimentos = pecKpis?.atendimentos ?? gv?.pecData?.atendimentos ?? 0;
  const alimentacao  = pecKpis?.alimentacao ?? gv?.pecData?.alimentacao ?? 0;
  const lineData     = evolucao?.dados || MESES_LABELS.map(m => ({ mes: m, presencas: 0, faltas: 0 }));

  const freqMeta     = metasAdm.frequencia    ?? pecMetas?.frequencia_meta          ?? ind?.frequencia?.meta     ?? 85;
  const evasaoMeta   = metasAdm.evasao        ?? ind?.evasao?.meta                  ?? 10;
  const avalMeta     = metasAdm.nps           ?? pecMetas?.avaliacao_aprendizagem_meta ?? ind?.criterioSucesso?.meta ?? 90;
  const atendidosMetaAnual = metasAdm.criancasAtendidas ?? pecMetas?.atendidos_meta ?? ind?.criancasAtendidas?.meta ?? 500;

  const metaFn = (anual: number) => isPeriodoMulti(periodo) ? metaFnPeriodo(periodo, anual) : anual;

  // "Crianças Atendidas" é acumulado — meta constante o ano todo, nunca proratada
  const atendidosMeta = atendidosMetaAnual;
  const horasMeta    = pecMetas?.hora_aula_meta   != null ? metaFn(pecMetas.hora_aula_meta)   : null;
  const atendMeta    = pecMetas?.atendimentos_meta != null ? metaFn(pecMetas.atendimentos_meta) : null;
  const alimMeta     = pecMetas?.alimentacao_meta  != null ? metaFn(pecMetas.alimentacao_meta)  : null;

  type Indicador =
    | { label: string; valor: number; meta: number; inverse?: boolean; format?: 'number' | 'percent'; noMeta?: false }
    | { label: string; valor: number; meta: null; inverse?: boolean; format?: 'number' | 'percent'; noMeta: true };

  const freqValor = pecKpis?.frequenciaMedia ?? gv?.pecData?.frequenciaMedia ?? ind?.frequencia?.valor ?? 0;

  const indicadores: Indicador[] = [
    { label: 'Evasão',                   valor: pecKpis?.evasao               ?? gv?.pecData?.evasao          ?? ind?.evasao?.valor          ?? 0, meta: evasaoMeta,    format: 'percent', inverse: true  },
    { label: 'NPS',                       valor: pecKpis?.nps                  ?? gv?.pecData?.nps             ?? ind?.criterioSucesso?.valor ?? 0, meta: avalMeta,      format: 'number', inverse: false },
    { label: 'Crianças Atendidas',       valor: pecKpis?.atendidos            ?? gv?.pecData?.totalAlunos     ?? ind?.criancasAtendidas?.valor ?? 0, meta: atendidosMeta, format: 'number', inverse: false },
    horasMeta != null
      ? { label: 'Horas Aula',   valor: horasAula,    meta: horasMeta,  format: 'number', inverse: false }
      : { label: 'Horas Aula',   valor: horasAula,    meta: null, noMeta: true, format: 'number' },
    atendMeta != null
      ? { label: 'Atendimentos', valor: atendimentos, meta: atendMeta,  format: 'number', inverse: false }
      : { label: 'Atendimentos', valor: atendimentos, meta: null, noMeta: true, format: 'number' },
    alimMeta != null
      ? { label: 'Alimentação',  valor: alimentacao,  meta: alimMeta,   format: 'number', inverse: false }
      : { label: 'Alimentação',  valor: alimentacao,  meta: null, noMeta: true, format: 'number' },
    ...(ano !== '2026' ? [{ label: 'Famílias Ativas', valor: ind?.familiasAtivas?.valor || 0, meta: ind?.familiasAtivas?.meta || 1, format: 'number' as const, inverse: false } as Indicador] : []),
  ];

  const cols = 3;
  const rows = Math.ceil(indicadores.length / cols);

  return (
    <div className="flex flex-col md:grid md:grid-cols-12 gap-3 md:h-full md:min-h-0">

      {/* ── Esquerda: card único com indicadores ── */}
      <div className="md:col-span-7 flex flex-col md:min-h-0">
        <SectorCard title="" accent="#10b981" className="md:flex-1">
          <div className="flex flex-col gap-2">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {indicadores.map((item, idx) => {
                const remainder = indicadores.length % cols;
                const isLastAlone = remainder === 1 && idx === indicadores.length - 1;
                const spanClass = isLastAlone ? 'col-span-2 md:col-span-3' : '';
                return item.noMeta
                  ? <PKpiCardNoMeta key={item.label} label={item.label} valor={item.valor} format={item.format} className={spanClass} />
                  : <GestaoKpiCard key={item.label} label={item.label} valor={item.valor} meta={item.meta as number} inverse={item.inverse} format={item.format} className={spanClass} />;
              })}
            </div>
            {/* Frequência + Turmas Ativas lado a lado */}
            <div className="flex gap-2 items-stretch">
              <PFreqBar valor={freqValor} meta={freqMeta} />
              <PTurmasCard data={turmasData} />
            </div>
          </div>
        </SectorCard>
      </div>

      {/* ── Direita: gráfico ── */}
      <div className="md:col-span-5 flex flex-col min-h-[240px] md:min-h-0">
        <div className="bg-slate-800/70 rounded-xl border border-slate-700/50 p-4 flex-1 flex flex-col min-h-0">
          <p className="text-white font-bold text-sm mb-0.5">Presenças Mensais — PEC</p>
          <p className="text-slate-400 text-xs mb-3">Presenças e faltas registradas ao longo do ano</p>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="mes" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickCount={5} />
                <Line type="monotone" dataKey="presencas" stroke="#10b981" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: '#10b981', stroke: '#10b981' }} name="Presenças" />
                <Line type="monotone" dataKey="faltas"    stroke="#ef4444" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: '#ef4444', stroke: '#ef4444' }} name="Faltas" />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} iconSize={8} iconType="circle" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', fontSize: 11 }}
                  labelStyle={{ color: '#fff' }} itemStyle={{ color: '#fff' }}
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
