import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import {
  getPct, getColor, SectorCard, NpsBar, MESES_PT, buildQp,
  type PeriodoFiltro, isPeriodoTodos, periodoMesUnico, metaFnPeriodo, metaNoPeriodo, isPeriodoSemMeta,
} from "./shared";
import { fetchGestaoVistaDashboard } from "./fetchGestaoVista";
import { GestaoKpiCard } from "@/components/GestaoKpiCard";

interface Props { ano: string; periodo: PeriodoFiltro; }

const MESES_LABELS = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];


/* ── Gauge (velocímetro) Inclusão (meta opcional) ────────────────────── */
function IGaugeCard({ label, valor, meta, inverse = false, note, smallLabel = false }: {
  label: string; valor: number; meta?: number; inverse?: boolean; note?: string; smallLabel?: boolean;
}) {
  const hasMeta = meta != null && meta > 0;
  const showMetaDash = meta === 0;
  const pct     = hasMeta ? Math.min(getPct(valor, meta!), 100) : 0;
  const color   = hasMeta ? getColor(valor, meta!, inverse) : '#64748b';
  const r = 40;
  const circumference = Math.PI * r;
  const [animFilled, setAnimFilled] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setAnimFilled(hasMeta ? (pct / 100) * circumference : 0), 200);
    return () => clearTimeout(t);
  }, [pct, circumference, hasMeta]);

  return (
    <div className="bg-slate-900/60 rounded-lg border border-slate-700/40 p-3 flex flex-col h-full">
      <p className={`${smallLabel ? 'text-[9px]' : 'text-[11px]'} text-slate-400 uppercase tracking-widest leading-tight`}>{label}</p>
      <div className="flex-1 min-h-0 flex items-center justify-center">
        <svg viewBox="0 0 100 52" className="w-full" style={{ maxHeight: '86px' }}>
          <path d="M 10 48 A 40 40 0 0 1 90 48" fill="none" stroke="#1e293b" strokeWidth="5" strokeLinecap="round" />
          {hasMeta && (
            <path
              d="M 10 48 A 40 40 0 0 1 90 48"
              fill="none" stroke={color} strokeWidth="5" strokeLinecap="round"
              strokeDasharray={`${animFilled} ${circumference}`}
              style={{ transition: 'stroke-dasharray 1s ease' }}
            />
          )}
          <text x="50" y="35" textAnchor="middle" fill="white" fontSize="20" fontWeight="bold" fontFamily="monospace">
            {valor.toLocaleString('pt-BR')}
          </text>
          {hasMeta && (
            <text x="50" y="47" textAnchor="middle" fill="#64748b" fontSize="10" fontFamily="monospace">
              / {meta!.toLocaleString('pt-BR')}
            </text>
          )}
          {showMetaDash && (
            <text x="50" y="47" textAnchor="middle" fill="#64748b" fontSize="10" fontFamily="monospace">
              / —
            </text>
          )}
        </svg>
      </div>
      <div className="flex items-end justify-between">
        <div className="flex flex-col">
          {note && note.split(' · ').map((line, i) => (
            <span key={i} className="text-[10px] text-slate-500 leading-tight">{line}</span>
          ))}
        </div>
        {hasMeta && (
          <span className="text-[14px] font-bold tabular-nums leading-none" style={{ color }}>{pct}%</span>
        )}
      </div>
    </div>
  );
}

/* ── Barra de Frequência Inclusão (meta obrigatória) ─────────────────── */
function IFreqBar({ valor, meta }: { valor: number; meta: number }) {
  const hasMeta = meta > 0;
  const pct   = hasMeta ? getPct(valor, meta) : 0;
  const color = hasMeta ? getColor(valor, meta) : '#64748b';
  const [animWidth, setAnimWidth] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setAnimWidth(Math.min(valor, 100)), 200);
    return () => clearTimeout(t);
  }, [valor]);

  return (
    <div className="bg-slate-900/60 rounded-lg border border-slate-700/40 p-3 flex flex-col h-full">
      <p className="text-[11px] text-slate-400 uppercase tracking-widest leading-tight">Frequência</p>
      <div className="flex-1 flex flex-col justify-center gap-2">
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-bold text-white tabular-nums leading-none">{valor}%</span>
          <span className="text-[13px] text-slate-500">{hasMeta ? `meta ${meta}%` : 'meta —'}</span>
        </div>
        <div className="h-2.5 bg-slate-700/60 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-1000"
            style={{ width: `${animWidth}%`, backgroundColor: color }} />
        </div>
        <div className="flex justify-between text-[9px] text-slate-500">
          <span>0%</span><span>50%</span><span>100%</span>
        </div>
      </div>
      <div className="flex justify-end">
        <span className="text-[14px] font-bold tabular-nums leading-none" style={{ color }}>{hasMeta ? `${pct}%` : '—'}</span>
      </div>
    </div>
  );
}

/* ── Tab principal ───────────────────────────────────────────────────── */
export default function TabInclusao({ ano, periodo }: Props) {
  const qp = buildQp(ano, periodo);

  const { data: gv } = useQuery<any>({
    queryKey: ['/api/gestao-vista', ano, periodo],
    queryFn: () => fetchGestaoVistaDashboard(`/api/gestao-vista${qp}`).then(r => r.json()),
    refetchInterval: 60000,
  });


  const { data: evolucao } = useQuery<any>({
    queryKey: ['/api/dashboard/inclusao/evolucao-mensal', ano],
    queryFn: () => fetch(`/api/dashboard/inclusao/evolucao-mensal?ano=${ano}`).then(r => r.json()),
    refetchInterval: 60000,
  });

  /* ── Metas do coordenador (mesma fonte do formulário) ─────────────── */
  const { data: metasData } = useQuery<{ metas: Record<string, number> }>({
    queryKey: ['/api/metas-indicadores', ano, 'inclusao'],
    queryFn: () => fetch(`/api/metas-indicadores?ano=${ano}&vertente=inclusao`).then(r => r.json()),
    refetchInterval: 300000,
  });

  const metasDB = metasData?.metas || {};

  // Apenas os indicadores com meta no formulário do coordenador:
  const metaFrequencia     = metaNoPeriodo(periodo, metasDB.frequencia);
  const metaEvasao         = metaNoPeriodo(periodo, metasDB.evasao);
  const metaAlunosFormados = metasDB.alunosFormados != null ? metasDB.alunosFormados : undefined;
  const META_ANUAL_EMPREGADAS   = metasDB.pessoasEmpregadas ?? 1000;
  const META_ANUAL_EMPREENDENDO = metasDB.empreendedores ?? 500;

  // ÷11: "Todos" = meses decorridos desde fev; mês específico = 1 (cada mês vale 1/11)
  const mesAtual  = new Date().getMonth() + 1;
  const mesUnico  = periodoMesUnico(periodo);
  const metaFn = (anual: number) => metaFnPeriodo(periodo, anual);

  const mesLabel = mesUnico
    ? (MESES_PT[mesUnico - 1] ?? '')
    : isPeriodoTodos(periodo)
      ? ''
      : '';

  // Metas prorateadas (trimestre = /4, mês = *mesNum/11, anual = inteira)
  const metaFormadosAnual        = metaAlunosFormados || 2000;
  const semMeta = isPeriodoSemMeta(periodo);
  const metaEmpregadasProrated   = metaFn(META_ANUAL_EMPREGADAS);
  const metaEmpreendendoProrated = metaFn(META_ANUAL_EMPREENDENDO);
  const metaFormadosProrated     = metaFn(metaFormadosAnual);
  const metaAvaliacao            = metaNoPeriodo(periodo, 90);

  /* Avaliação: primário via /api/gestao-vista (público); demográfico só com sessão */
  const { data: demogData } = useQuery<any>({
    queryKey: ['/api/coordenador/dashboard-demografico-inclusao', ano, periodo],
    queryFn: async () => {
      const r = await fetch(`/api/coordenador/dashboard-demografico-inclusao${qp}`, { credentials: 'include' });
      if (!r.ok) return null;
      return r.json();
    },
    refetchInterval: 60000,
  });

  const avaliacaoAprendizagem =
    gv?.indicadores?.criterioSucesso?.valor ??
    (typeof demogData?.avaliacaoAprendizagem === 'number' ? demogData.avaliacaoAprendizagem : undefined) ??
    0;

  const ind          = gv?.indicadores || {};
  const metaNps      = metaNoPeriodo(periodo, ind?.nps?.meta ?? 70);
  const incD         = gv?.inclusaoData || {};
  const horasAula    = Number((incD?.horasAula || 0).toFixed(0));
  const atendimentos = incD?.atendimentos || 0;
  const alimentacao  = incD?.alimentacao ?? 0;
  const lineData     = evolucao?.dados || MESES_LABELS.map(m => ({ mes: m, presencas: 0, faltas: 0 }));

  return (
    <div className="flex flex-col md:grid md:grid-cols-12 gap-3 md:h-full md:min-h-0">

      {/* ── Esquerda: cards ── */}
      <div className="md:col-span-7 flex flex-col md:min-h-0">
        <SectorCard title="" accent="#3b82f6" className="md:flex-1">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {/* Linha 1 */}
            <IGaugeCard label="Pessoas Empregadas"   valor={ind?.pessoasEmpregadas?.valor || 0} meta={metaEmpregadasProrated} note={!semMeta && metaEmpregadasProrated > 0 ? `Meta anual: ${META_ANUAL_EMPREGADAS.toLocaleString('pt-BR')}` : undefined} />
            <IGaugeCard label="Pessoas Empreendendo" valor={ind?.empreendedores?.valor    || 0} meta={metaEmpreendendoProrated} note={!semMeta && metaEmpreendendoProrated > 0 ? `Meta anual: ${META_ANUAL_EMPREENDENDO.toLocaleString('pt-BR')}` : undefined} smallLabel />
            <GestaoKpiCard   label="Pessoas Formadas"     valor={ind?.alunosFormados?.valor    || 0} meta={metaFormadosProrated} note={!semMeta && metaFormadosProrated > 0 ? `Meta anual: ${metaFormadosAnual.toLocaleString('pt-BR')}` : undefined} />
            <GestaoKpiCard   label="Pessoas em Formação" valor={ind?.alunosEmFormacao?.valor  || 0} />

            {/* Linha 2 */}
            <div className="col-span-2 h-full">
              {metaFrequencia > 0
                ? <IFreqBar valor={gv?.inclusaoData?.frequencia ?? ind?.frequencia?.valor ?? 0} meta={metaFrequencia} />
                : <GestaoKpiCard label="Frequência" valor={gv?.inclusaoData?.frequencia ?? ind?.frequencia?.valor ?? 0} meta={0} format="percent" />
              }
            </div>
            <GestaoKpiCard label="Evasão"     valor={incD?.evasao ?? ind?.evasao?.valor ?? 0} meta={metaEvasao || 0} inverse format="percent" />
            <GestaoKpiCard label="Horas Aula" valor={horasAula} />

            {/* Linha 3 */}
            <GestaoKpiCard label="Atendimentos" valor={atendimentos} />
            <GestaoKpiCard label="Alimentação" valor={alimentacao} />
            <GestaoKpiCard label="Avaliação de Aprendizagem" valor={avaliacaoAprendizagem} meta={metaAvaliacao} format="percent" />
            <div className="bg-slate-900/60 rounded-lg border border-slate-700/40 p-3 flex flex-col justify-center">
              <NpsBar valor={ind?.nps?.valor || 0} meta={metaNps} />
            </div>
          </div>
        </SectorCard>
      </div>

      {/* ── Direita: gráfico ── */}
      <div className="md:col-span-5 flex flex-col min-h-[240px] md:min-h-0">
        <div className="bg-slate-800/70 rounded-xl border border-slate-700/50 p-4 flex-1 flex flex-col min-h-0">
          <p className="text-white font-bold text-sm mb-0.5">Presenças Mensais — Inclusão</p>
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
