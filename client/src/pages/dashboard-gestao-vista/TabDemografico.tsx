import { useQuery } from "@tanstack/react-query";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

interface Props { ano: string; mes: string; }

const GENERO_COLORS = ['#facc15', '#eab308', '#ca8a04', '#a16207'];
const RACA_COLORS   = ['#fde047', '#facc15', '#eab308', '#ca8a04', '#a16207'];
const IDADE_COLORS  = ['#fef08a', '#fde047', '#facc15', '#eab308', '#ca8a04'];

function DemoCard({
  title,
  data,
  colors,
}: {
  title: string;
  data: Array<{ name: string; value: number; percentage: number }>;
  colors: string[];
}) {
  return (
    <div className="bg-slate-800/60 rounded-xl border border-slate-700/40 overflow-hidden flex flex-col h-full">
      <div className="px-3 py-2 border-b border-slate-700/40">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-white">{title}</p>
      </div>
      <div className="p-3 flex flex-col flex-1">
        <div className="flex items-center gap-3 flex-1">
          <div className="w-[110px] h-[110px] flex-shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={26}
                  outerRadius={50}
                  paddingAngle={2}
                  dataKey="value"
                  stroke="#0f172a"
                  strokeWidth={1}
                >
                  {data.map((_, i) => (
                    <Cell key={i} fill={colors[i % colors.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', fontSize: 11 }}
                  labelStyle={{ color: '#fff' }}
                  itemStyle={{ color: '#fff' }}
                  formatter={(v: number, _: any, props: any) => [`${v} (${props.payload.percentage}%)`, props.payload.name]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-col gap-2 flex-1 min-w-0">
            {data.map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: colors[i % colors.length] }} />
                <span className="text-white text-xs flex-1 truncate">{item.name}</span>
                <span className="text-white text-xs font-bold tabular-nums">{item.value.toLocaleString('pt-BR')}</span>
                <span className="text-white text-[10px] tabular-nums w-8 text-right opacity-70">{item.percentage}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TabDemografico({ ano }: Props) {
  const { data: demograficos, isLoading: loadingDemo } = useQuery<any>({
    queryKey: ['/api/dados-demograficos', ano],
    queryFn: () => fetch(`/api/dados-demograficos?ano=${ano}`).then(r => r.json()),
    refetchInterval: 60000,
  });

  const { data: gv, isLoading: loadingGv } = useQuery<any>({
    queryKey: ['/api/gestao-vista', ano, 'todos'],
    queryFn: () => fetch(`/api/gestao-vista?ano=${ano}`).then(r => r.json()),
    refetchInterval: 60000,
  });

  const ind = gv?.indicadores || {};
  const programas = [
    { nome: 'Programa de Esporte e Cultura', valor: ind?.criancasAtendidas?.valor  || 0, cor: '#10b981' },
    { nome: 'Inclusão Produtiva',            valor: ind?.atendidosInclusao?.valor  || 0, cor: '#3b82f6' },
    { nome: 'Psicossocial',                  valor: ind?.atendidosPsico?.valor     || 0, cor: '#f59e0b' },
  ];
  const total = programas.reduce((acc, p) => acc + p.valor, 0);

  const genero  = demograficos?.genero  || [];
  const racaCor = demograficos?.racaCor || [];
  const idade   = demograficos?.idade   || [];

  if (loadingGv || loadingDemo) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-4 border-slate-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 h-full">

      {/* ── Total + breakdown por programa ── */}
      <div className="bg-slate-800/60 rounded-xl border border-slate-700/40 px-6 py-4 flex-shrink-0">
        <div className="flex items-center gap-8">
          {/* Total */}
          <div className="text-center border-r border-slate-700/50 pr-8">
            <p className="text-6xl font-bold text-white tabular-nums leading-none">
              {total.toLocaleString('pt-BR')}
            </p>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-2">
              Total de pessoas impactadas em {ano}
            </p>
          </div>
          {/* Programas */}
          <div className="flex flex-1 gap-4">
            {programas.map((p) => (
              <div key={p.nome} className="flex-1 rounded-xl border border-slate-700/40 px-4 py-3 bg-slate-900/80">
                <p className="text-2xl font-bold text-white tabular-nums leading-none">
                  {p.valor.toLocaleString('pt-BR')}
                </p>
                <p className="text-[11px] mt-1.5 font-medium text-white">{p.nome}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Separador ── */}
      <div className="flex items-center gap-2 px-1 flex-shrink-0">
        <span className="text-sm font-bold uppercase tracking-wider text-white">Dados Demográficos</span>
        <div className="flex-1 h-px" style={{ backgroundColor: '#06b6d430' }} />
      </div>

      {/* ── Dados demográficos (PEC + Inclusão) ── */}
      <div className="grid grid-cols-3 gap-3 flex-1 min-h-0">
        <DemoCard title="Gênero"       data={genero}  colors={GENERO_COLORS} />
        <DemoCard title="Raça / Cor"   data={racaCor} colors={RACA_COLORS}   />
        <DemoCard title="Faixa Etária" data={idade}   colors={IDADE_COLORS}  />
      </div>

    </div>
  );
}
