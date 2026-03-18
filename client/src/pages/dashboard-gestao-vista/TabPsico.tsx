import { useQuery } from "@tanstack/react-query";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import { getPct, getColor, SectorCard, MESES_PT } from "./shared";

interface Props { ano: string; mes: string; }

const MESES_LABELS = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

/* ── Card com meta ───────────────────────────────────────────────────── */
function SsKpiCard({ label, valor, meta, format = 'number' as 'number' | 'percent', note }: {
  label: string; valor: number; meta: number; format?: 'number' | 'percent'; note?: string;
}) {
  const pct   = getPct(valor, meta);
  const color = getColor(valor, meta, false);
  const dVal  = format === 'percent' ? `${valor}%` : valor.toLocaleString('pt-BR');
  const dMeta = format === 'percent' ? `${meta}%`  : meta.toLocaleString('pt-BR');

  return (
    <div className="bg-slate-900/60 rounded-lg border border-slate-700/40 p-3 flex flex-col h-full">
      <p className="text-[11px] text-slate-400 uppercase tracking-widest leading-tight">{label}</p>
      <div className="flex-1 flex items-center gap-2 py-1">
        <span className="text-4xl font-bold text-white tabular-nums leading-none">{dVal}</span>
        <span className="text-[13px] text-slate-500 leading-none">/ {dMeta}</span>
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

/* ── Card simples (sem meta) ─────────────────────────────────────────── */
function SimpleKpiCard({ label, valor, sub }: { label: string; valor: number; sub?: string }) {
  return (
    <div className="bg-slate-900/60 rounded-lg border border-slate-700/40 p-3 flex flex-col h-full">
      <p className="text-[11px] text-slate-400 uppercase tracking-widest leading-tight">{label}</p>
      <div className="flex-1 flex items-center py-1">
        <span className="text-4xl font-bold text-white tabular-nums leading-none">{valor.toLocaleString('pt-BR')}</span>
      </div>
      {sub && <p className="text-[10px] text-slate-500 leading-tight">{sub}</p>}
    </div>
  );
}

/* ── Tab principal ───────────────────────────────────────────────────── */
export default function TabPsico({ ano, mes }: Props) {
  const qp = mes === 'todos' ? `?ano=${ano}` : `?ano=${ano}&mes=${mes}`;

  const { data: gv } = useQuery<any>({
    queryKey: ['/api/gestao-vista', ano, mes],
    queryFn: () => fetch(`/api/gestao-vista${qp}`).then(r => r.json()),
    refetchInterval: 60000,
  });

  const { data: evolucao } = useQuery<any>({
    queryKey: ['/api/gestao-vista/evolucao-mensal', ano],
    queryFn: () => fetch(`/api/gestao-vista/evolucao-mensal?ano=${ano}`).then(r => r.json()),
    refetchInterval: 60000,
  });

  const { data: metodoGrito } = useQuery<any>({
    queryKey: ['/api/psico/indicadores/metodo-grito', ano],
    queryFn: () => fetch('/api/psico/indicadores/metodo-grito').then(r => r.json()),
    refetchInterval: 60000,
  });

  const { data: metasDB } = useQuery<{ metas: Record<string, number> }>({
    queryKey: ['/api/metas-indicadores', ano, 'psico'],
    queryFn: () => fetch(`/api/metas-indicadores?ano=${ano}&vertente=psico`).then(r => r.json()),
    staleTime: 60000,
  });
  const metasAdm = metasDB?.metas ?? {};

  const ind = gv?.indicadores || {};
  const mg  = metodoGrito?.data || {};

  const mesNumRaw = mes === 'todos' ? NaN : parseInt(mes);
  const mesNum    = isNaN(mesNumRaw) || mesNumRaw <= 0 ? new Date().getMonth() + 1 : mesNumRaw;
  const mesLabel  = MESES_PT[mesNum - 1];

  const anualAcolhimento = metasAdm.atendimentos ?? ind?.atendimentos?.meta ?? 250;
  const anualVisitas     = metasAdm.visitas      ?? ind?.visitas?.meta      ?? 250;
  const anualEspaco      = mg?.espacosColetivos?.meta || 10;

  const metaAcolhimento = Math.round(anualAcolhimento * mesNum / 12);
  const metaVisitas     = Math.round(anualVisitas * mesNum / 12);
  const metaEspaco      = Math.round(anualEspaco * Math.max(0, mesNum - 1) / 11);

  const lineData = (evolucao?.dados || MESES_LABELS.map(m => ({ mes: m, visitas: 0, atendimentos: 0 }))).map(
    (d: any) => ({ ...d, total: (d.visitas || 0) + (d.atendimentos || 0) })
  );

  return (
    <div className="flex flex-col md:grid md:grid-cols-12 gap-3 md:h-full md:min-h-0">

      {/* ── Esquerda: 5 KPI cards ── */}
      <div className="md:col-span-7 flex flex-col md:min-h-0">
        <SectorCard title="" accent="#f97316" className="md:flex-1">
          <div className="grid grid-cols-2 gap-2">
            <SsKpiCard
              label="Acolhimento Psicossociais"
              valor={ind?.atendimentos?.valor || 0}
              meta={metaAcolhimento}
              note={`Meta até ${mesLabel}: ${metaAcolhimento.toLocaleString('pt-BR')} (Anual: ${anualAcolhimento.toLocaleString('pt-BR')})`}
            />
            <SsKpiCard
              label="Visitas Domiciliares"
              valor={ind?.visitas?.valor || 0}
              meta={metaVisitas}
              note={`Meta até ${mesLabel}: ${metaVisitas.toLocaleString('pt-BR')} (Anual: ${anualVisitas.toLocaleString('pt-BR')})`}
            />
            <SimpleKpiCard
              label="Acolhimentos Coletivos"
              valor={ind?.atendimentosColetivos?.valor || 0}
            />
            <SsKpiCard
              label="#EspaçoOgrito"
              valor={mg?.espacosColetivos?.total || 0}
              meta={metaEspaco}
              note={`Meta até ${mesLabel}: ${metaEspaco.toLocaleString('pt-BR')} (Anual: ${anualEspaco.toLocaleString('pt-BR')})`}
            />
          </div>
        </SectorCard>
      </div>

      {/* ── Direita: gráfico ── */}
      <div className="md:col-span-5 flex flex-col min-h-[240px] md:min-h-0">
        <div className="bg-slate-800/70 rounded-xl border border-slate-700/50 p-4 flex-1 flex flex-col min-h-0">
          <p className="text-white font-bold text-sm mb-0.5">Evolução Mensal — Psicossocial</p>
          <p className="text-slate-400 text-xs mb-3">Atendimentos, visitas domiciliares e total por mês</p>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="mes" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickCount={5} />
                <Line type="monotone" dataKey="atendimentos" stroke="#facc15" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: '#facc15', stroke: '#facc15' }} name="Atendimentos" />
                <Line type="monotone" dataKey="visitas"      stroke="#f97316" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: '#f97316', stroke: '#f97316' }} name="Visitas Domiciliares" />
                <Line type="monotone" dataKey="total"        stroke="#ffffff" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: '#ffffff', stroke: '#ffffff' }} name="Total" strokeDasharray="4 2" />
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
