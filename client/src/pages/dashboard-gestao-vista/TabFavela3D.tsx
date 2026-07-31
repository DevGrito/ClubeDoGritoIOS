import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { KpiCard, KpiItemNoMeta, SectorCard, buildQp, FAVELA3D_OCULTAR, FAMILIAS_FAVELA3D_EXIBICAO, coletivosFavela3DNoPeriodo, type PeriodoFiltro } from "./shared";
import { fetchGestaoVistaDashboard } from "./fetchGestaoVista";

interface Props { ano: string; periodo: PeriodoFiltro; }

const IGF_LABELS: Record<string, string> = {
  igf_alta: 'Alta Vulnerab. (E1/E2)',
  igf_media: 'Média Vulnerab. (P1/P2)',
  igf_baixa: 'Baixa Vulnerab. (D)',
};
const IGF_COLORS: Record<string, string> = {
  igf_alta: '#ef4444',
  igf_media: '#f97316',
  igf_baixa: '#22c55e',
};

function CategoriaCard({ label, registros, pessoas }: { label: string; registros: number; pessoas: number; color: string }) {
  return (
    <div className="bg-slate-900/60 rounded-lg border border-slate-700/40 p-3 flex flex-col gap-2 flex-1 min-h-0">
      <p className="text-[10px] text-slate-400 uppercase tracking-widest leading-tight">{label}</p>
      <div className="grid grid-cols-2 gap-2 flex-1">
        <div className="bg-slate-800/60 rounded-lg p-2 flex flex-col justify-between">
          <span className="text-[10px] text-white uppercase tracking-wide">Registros</span>
          <span className="text-2xl font-bold text-white tabular-nums leading-none">{registros.toLocaleString('pt-BR')}</span>
        </div>
        <div className="bg-slate-800/60 rounded-lg p-2 flex flex-col justify-between">
          <span className="text-[10px] text-white uppercase tracking-wide">Pessoas</span>
          <span className="text-2xl font-bold text-white tabular-nums leading-none">{pessoas.toLocaleString('pt-BR')}</span>
        </div>
      </div>
    </div>
  );
}

export default function TabFavela3D({ ano, periodo }: Props) {
  const params = buildQp(ano, periodo);
  const { data: stats, isLoading } = useQuery<any>({
    queryKey: ['/api/gestao-vista/favela3d', ano, periodo],
    queryFn: () => fetchGestaoVistaDashboard(`/api/gestao-vista/favela3d${params}`).then(r => r.json()),
    refetchInterval: 60000,
  });

  const familias            = FAMILIAS_FAVELA3D_EXIBICAO;
  const visitas             = stats?.visitas               ?? 0;
  const atendimentosIndivid = stats?.atendimentos_individuais ?? 0;

  const gerandoLiderData    = coletivosFavela3DNoPeriodo('gerando_lideranca', periodo);
  const assembleiaData      = coletivosFavela3DNoPeriodo('assembleia', periodo);
  const gerandoLider        = gerandoLiderData.registros;
  const gerandoLiderPessoas = gerandoLiderData.pessoas;
  const assembleia          = assembleiaData.registros;
  const assembleiaPessoas   = assembleiaData.pessoas;
  const grupoMulheres       = stats?.grupo_mulheres          ?? 0;
  const grupoMulheresPessoas = stats?.grupo_mulheres_pessoas  ?? 0;

  const igfData = [
    { key: 'igf_alta',  label: 'E1/E2', total: stats?.igf_alta  ?? 0 },
    { key: 'igf_media', label: 'P1/P2', total: stats?.igf_media ?? 0 },
    { key: 'igf_baixa', label: 'D',     total: stats?.igf_baixa ?? 0 },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin border-emerald-500" />
      </div>
    );
  }

  const coletivosColSpan = FAVELA3D_OCULTAR.igf ? 'md:col-span-8' : 'md:col-span-4';

  const coletivosSector = (
    <div className={`${coletivosColSpan} flex flex-col gap-3 md:min-h-0`}>
      <SectorCard title="Atendimentos Coletivos" accent="#fb923c" className="md:flex-1">
        <div className="flex flex-col gap-2 h-full">
          <CategoriaCard
            label="Gerando Liderança"
            registros={gerandoLider}
            pessoas={gerandoLiderPessoas}
            color="#fbbf24"
          />
          <CategoriaCard
            label="Assembleia"
            registros={assembleia}
            pessoas={assembleiaPessoas}
            color="#fb923c"
          />
          {!FAVELA3D_OCULTAR.grupoMulheres && (
            <CategoriaCard
              label="Grupo de Mulheres"
              registros={grupoMulheres}
              pessoas={grupoMulheresPessoas}
              color="#f472b6"
            />
          )}
        </div>
      </SectorCard>
    </div>
  );

  return (
    <div className="flex flex-col md:grid md:grid-cols-12 gap-3 md:h-full md:min-h-0">

      {/* ── Panorama ── */}
      <div className="md:col-span-4 flex flex-col gap-3 md:min-h-0">
        <SectorCard title="Panorama Favela 3D" accent="#f59e0b" className="md:flex-1">
          <div className="flex flex-col gap-2 h-full">
            <KpiCard className="flex-1 min-h-0">
              <KpiItemNoMeta label="Famílias Favela 3D" valor={familias} size="lg" />
            </KpiCard>
            {!FAVELA3D_OCULTAR.visitasDomiciliares && (
              <KpiCard className="flex-1 min-h-0">
                <KpiItemNoMeta label="Visitas Domiciliares" valor={visitas} size="lg" />
              </KpiCard>
            )}
            {!FAVELA3D_OCULTAR.atendIndividuais && (
              <KpiCard className="flex-1 min-h-0">
                <KpiItemNoMeta label="Atend. Individuais" valor={atendimentosIndivid} size="lg" />
              </KpiCard>
            )}
          </div>
        </SectorCard>
      </div>

      {/* ── IGF ou Atendimentos (meio) ── */}
      {!FAVELA3D_OCULTAR.igf ? (
      <div className="md:col-span-4 flex flex-col gap-3 md:min-h-0">
        <SectorCard title="Índice Gerando Falcões (IGF)" accent="#ef4444" className="md:flex-1">
          <div className="flex flex-col gap-2 h-full">
            {igfData.map(({ key, label, total }) => {
              const pct = familias > 0 ? Math.round((total / familias) * 100) : 0;
              return (
                <div key={key} className="flex-1 flex flex-col justify-center">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-slate-300 uppercase tracking-wide">{IGF_LABELS[key]}</span>
                    <span className="text-[11px] font-bold text-white tabular-nums">{total}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-3 bg-slate-700/60 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-1000"
                        style={{ width: `${pct}%`, backgroundColor: IGF_COLORS[key] }}
                      />
                    </div>
                    <span className="text-[10px] font-bold w-8 text-right tabular-nums" style={{ color: IGF_COLORS[key] }}>{pct}%</span>
                  </div>
                </div>
              );
            })}

            <div className="mt-2 pt-2 border-t border-slate-700/40">
              <div className="flex-1 min-h-[100px]">
                <ResponsiveContainer width="100%" height={90}>
                  <BarChart data={igfData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <XAxis dataKey="label" stroke="#64748b" fontSize={10} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={9} tickCount={4} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', fontSize: 11 }}
                      labelStyle={{ color: '#fff' }}
                      itemStyle={{ color: '#fff' }}
                      formatter={(v: number) => v.toLocaleString('pt-BR')}
                    />
                    <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                      {igfData.map(({ key }) => (
                        <Cell key={key} fill={IGF_COLORS[key]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </SectorCard>
      </div>
      ) : null}

      {coletivosSector}

    </div>
  );
}
