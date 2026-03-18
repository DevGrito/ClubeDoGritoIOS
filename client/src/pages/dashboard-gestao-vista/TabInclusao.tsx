import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import { getPct, getColor, SectorCard, NpsBar, MESES_PT } from "./shared";

interface Props { ano: string; mes: string; }

const MESES_LABELS = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

/* ── Card padrão Inclusão (meta opcional) ───────────────────────────── */
function IKpiCard({ label, valor, meta, inverse = false, format = 'number' as 'number' | 'percent', note }: {
  label: string; valor: number; meta?: number; inverse?: boolean; format?: 'number' | 'percent'; note?: string;
}) {
  const hasMeta = meta != null && meta > 0;
  const pct     = hasMeta ? getPct(valor, meta!) : null;
  const color   = hasMeta ? getColor(valor, meta!, inverse) : '#64748b';
  const dVal    = format === 'percent' ? `${valor}%` : valor.toLocaleString('pt-BR');
  const dMeta   = hasMeta ? (format === 'percent' ? `${meta}%` : meta!.toLocaleString('pt-BR')) : null;

  return (
    <div className="bg-slate-900/60 rounded-lg border border-slate-700/40 p-3 flex flex-col h-full">
      <p className="text-[11px] text-slate-400 uppercase tracking-widest leading-tight">{label}</p>
      <div className="flex-1 flex items-center gap-2 py-1">
        <span className="text-4xl font-bold text-white tabular-nums leading-none">{dVal}</span>
        {dMeta && <span className="text-[13px] text-slate-500 leading-none">/ {dMeta}</span>}
      </div>
      <div className="flex items-end justify-between">
        <div className="flex flex-col">
          {note && note.split(' · ').map((line, i) => (
            <span key={i} className="text-[10px] text-slate-500 leading-tight">{line}</span>
          ))}
        </div>
        {hasMeta && pct != null && (
          <span className="text-[14px] font-bold tabular-nums leading-none" style={{ color }}>{pct}%</span>
        )}
      </div>
    </div>
  );
}

/* ── Gauge (velocímetro) Inclusão (meta opcional) ────────────────────── */
function IGaugeCard({ label, valor, meta, inverse = false, note }: {
  label: string; valor: number; meta?: number; inverse?: boolean; note?: string;
}) {
  const hasMeta = meta != null && meta > 0;
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
      <p className="text-[11px] text-slate-400 uppercase tracking-widest leading-tight">{label}</p>
      <div className="flex-1 min-h-0 flex items-center justify-center">
        <svg viewBox="0 0 100 58" className="w-full" style={{ maxHeight: '90px' }}>
          <path d="M 10 54 A 40 40 0 0 1 90 54" fill="none" stroke="#1e293b" strokeWidth="9" strokeLinecap="round" />
          {hasMeta && (
            <path
              d="M 10 54 A 40 40 0 0 1 90 54"
              fill="none" stroke={color} strokeWidth="9" strokeLinecap="round"
              strokeDasharray={`${animFilled} ${circumference}`}
              style={{ transition: 'stroke-dasharray 1s ease' }}
            />
          )}
          <text x="50" y="43" textAnchor="middle" fill="white" fontSize="20" fontWeight="bold" fontFamily="monospace">
            {valor.toLocaleString('pt-BR')}
          </text>
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
  const pct   = getPct(valor, meta);
  const color = getColor(valor, meta);
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
          <span className="text-[13px] text-slate-500">meta {meta}%</span>
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
        <span className="text-[14px] font-bold tabular-nums leading-none" style={{ color }}>{pct}%</span>
      </div>
    </div>
  );
}

/* ── Tab principal ───────────────────────────────────────────────────── */
export default function TabInclusao({ ano, mes }: Props) {
  const qp = mes === 'todos' ? `?ano=${ano}` : `?ano=${ano}&mes=${mes}`;

  const { data: gv } = useQuery<any>({
    queryKey: ['/api/gestao-vista', ano, mes],
    queryFn: () => fetch(`/api/gestao-vista${qp}`).then(r => r.json()),
    refetchInterval: 60000,
  });

  const { data: resumo } = useQuery<any>({
    queryKey: ['/api/dashboard/inclusao/resumo', ano, mes],
    queryFn: () => {
      const start = mes !== 'todos' ? `${ano}-${String(mes).padStart(2,'0')}-01` : `${ano}-01-01`;
      const end   = mes !== 'todos' ? `${ano}-${String(mes).padStart(2,'0')}-31` : `${ano}-12-31`;
      return fetch(`/api/dashboard/inclusao/resumo?start=${start}&end=${end}`).then(r => r.json());
    },
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
  const metaFrequencia     = metasDB.frequencia     != null ? metasDB.frequencia     : undefined;
  const metaEvasao         = metasDB.evasao         != null ? metasDB.evasao         : undefined;
  const metaAlunosFormados = metasDB.alunosFormados != null ? metasDB.alunosFormados : undefined;
  // Metas fixas de geração de renda (não configuráveis)
  const META_PESSOAS_EMPREGADAS = 1000;
  const META_EMPREENDENDO       = 500;

  // Meta proporcional ao mês vigente (se "Todos"/'todos'/'0', usa mês atual do calendário)
  const MESES_NOMES = MESES_PT;
  const mesNumRaw = Number(mes);
  const mesNum = (!mes || mes === 'todos' || isNaN(mesNumRaw) || mesNumRaw === 0) ? new Date().getMonth() + 1 : mesNumRaw;
  const mesLabel = MESES_NOMES[mesNum - 1] ?? '';
  const metaEmpregadasPro   = Math.round(META_PESSOAS_EMPREGADAS * mesNum / 12);
  const metaEmpreendendoPro = Math.round(META_EMPREENDENDO * mesNum / 12);
  const metaFormadosPro     = metaAlunosFormados != null ? Math.round(metaAlunosFormados * mesNum / 12) : undefined;

  const ind          = gv?.indicadores || {};
  const horasAula    = Number((resumo?.horasAula || 0).toFixed(0));
  const atendimentos = resumo?.atendimentos || 0;
  const lineData     = evolucao?.dados || MESES_LABELS.map(m => ({ mes: m, presencas: 0, faltas: 0 }));

  return (
    <div className="flex flex-col md:grid md:grid-cols-12 gap-3 md:h-full md:min-h-0">

      {/* ── Esquerda: cards ── */}
      <div className="md:col-span-7 flex flex-col md:min-h-0">
        <SectorCard title="" accent="#3b82f6" className="md:flex-1">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {/* Linha 1 */}
            <IGaugeCard label="Pessoas Empregadas"   valor={ind?.pessoasEmpregadas?.valor || 0} meta={metaEmpregadasPro}   note={`Meta até ${mesLabel}: ${metaEmpregadasPro.toLocaleString('pt-BR')} (Anual: ${META_PESSOAS_EMPREGADAS.toLocaleString('pt-BR')})`} />
            <IGaugeCard label="Pessoas Empreendendo" valor={ind?.empreendedores?.valor    || 0} meta={metaEmpreendendoPro} note={`Meta até ${mesLabel}: ${metaEmpreendendoPro.toLocaleString('pt-BR')} (Anual: ${META_EMPREENDENDO.toLocaleString('pt-BR')})`} />
            <IKpiCard   label="Pessoas Formadas"   valor={ind?.alunosFormados?.valor    || 0} meta={metaFormadosPro} note={metaFormadosPro != null && metaAlunosFormados != null ? `Meta até ${mesLabel}: ${metaFormadosPro.toLocaleString('pt-BR')} (Anual: ${metaAlunosFormados.toLocaleString('pt-BR')})` : undefined} />
            <IKpiCard   label="Pessoas em Formação" valor={ind?.alunosEmFormacao?.valor  || 0} />

            {/* Linha 2 */}
            <div className="col-span-2 h-full">
              {metaFrequencia != null
                ? <IFreqBar valor={gv?.inclusaoData?.frequencia ?? ind?.frequencia?.valor ?? 0} meta={metaFrequencia} />
                : <IKpiCard label="Frequência" valor={gv?.inclusaoData?.frequencia ?? ind?.frequencia?.valor ?? 0} format="percent" />
              }
            </div>
            <IKpiCard label="Evasão"     valor={ind?.evasao?.valor || 0} meta={metaEvasao} inverse format="percent" note={metaEvasao != null ? `Meta: < ${metaEvasao}%` : undefined} />
            <IKpiCard label="Horas Aula" valor={horasAula} />

            {/* Linha 3 */}
            <IKpiCard label="Atendimentos" valor={atendimentos} />
            <div className="col-span-1 md:col-span-3 bg-slate-900/60 rounded-lg border border-slate-700/40 p-3 flex flex-col justify-center">
              <NpsBar valor={ind?.nps?.valor || 0} meta={ind?.nps?.meta || 70} />
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
