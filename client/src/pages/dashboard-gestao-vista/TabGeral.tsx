import { useQuery } from "@tanstack/react-query";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell,
} from "recharts";
import { KpiItem, KpiItemNoMeta, KpiCard, SectorCard, getColor, NpsBar } from "./shared";

interface Props { ano: string; mes: string; }

export default function TabGeral({ ano, mes }: Props) {
  const qp = mes === 'todos' ? `?ano=${ano}` : `?ano=${ano}&mes=${mes}`;
  const negMes = mes !== 'todos' ? `&mes=${mes}` : '';

  const { data: gv } = useQuery<any>({
    queryKey: ['/api/gestao-vista', ano, mes],
    queryFn: () => fetch(`/api/gestao-vista${qp}`).then(r => r.json()),
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
  const { data: negocios } = useQuery<any>({
    queryKey: ['/api/negocios-sociais', ano, mes],
    queryFn: () => fetch(`/api/negocios-sociais?ano=${ano}${negMes}`).then(r => r.json()),
    refetchInterval: 60000,
  });
  const { data: resumoInclusao } = useQuery<any>({
    queryKey: ['/api/dashboard/inclusao/resumo', ano, mes],
    queryFn: () => {
      const start = mes !== 'todos' ? `${ano}-${String(mes).padStart(2,'0')}-01` : `${ano}-01-01`;
      const end   = mes !== 'todos' ? `${ano}-${String(mes).padStart(2,'0')}-31` : `${ano}-12-31`;
      return fetch(`/api/dashboard/inclusao/resumo?start=${start}&end=${end}`).then(r => r.json());
    },
    refetchInterval: 60000,
  });
  const { data: resumoPec } = useQuery<any>({
    queryKey: ['/api/dashboard/pec/resumo', ano, mes],
    queryFn: () => {
      const start = mes !== 'todos' ? `${ano}-${String(mes).padStart(2,'0')}-01` : `${ano}-01-01`;
      const end   = mes !== 'todos' ? `${ano}-${String(mes).padStart(2,'0')}-31` : `${ano}-12-31`;
      return fetch(`/api/dashboard/pec/resumo?start=${start}&end=${end}`).then(r => r.json());
    },
    refetchInterval: 60000,
  });
  const { data: igData } = useQuery<any>({
    queryKey: ['/api/instagram/metrics/current'],
    queryFn: () => fetch('/api/instagram/metrics/current').then(r => r.json()),
    refetchInterval: 300000,
    retry: false,
  });

  const ind = gv?.indicadores || {};
  const pecMetas = gv?.pecMetas || {};
  const segRows = segMensal?.data || [];

  const META_DOADORES_ANUAL = 2000;
  const META_EVADIDOS_ANUAL = Math.round(META_DOADORES_ANUAL * 0.10); // 200

  const doadoresAtivos   = (doadores?.porStatus?.active || 0) + (doadores?.porStatus?.trialing || 0);
  const doadoresEvadidos = doadores?.porStatus?.canceled || 0;
  const META_SEGUIDORES  = 15000;
  const segByMes: Record<string, any> = {};
  for (const r of segRows) segByMes[String(r.mes)] = r;
  const mesDataSeg  = segByMes[mes];
  const lastSegRow  = segRows[segRows.length - 1];
  const totalSeguidores = mes === 'todos'
    ? (lastSegRow?.total_seguidores || 11538)
    : (mesDataSeg?.total_seguidores ?? lastSegRow?.total_seguidores ?? 11538);

  const ig = igData?.data || null;
  const igFollowers = ig?.followers_total  || totalSeguidores;
  const igGained    = ig?.followers_gained || 0;
  const igLost      = ig?.followers_lost   || 0;
  const igReach     = ig?.reach            || 0;
  const igViews     = ig?.profile_views    || 0;
  const igClicks    = ig?.website_clicks   || 0;
  const igEngaged   = ig?.accounts_engaged || 0;
  const igMedia     = ig?.media_count      || 0;
  const igUpdated   = ig?.updated_at
    ? new Date(ig.updated_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
    : null;

  const outletRecebidos = negocios?.data?.outlet?.doacoesRecebidas    || 0;
  const outletVendidos  = negocios?.data?.outlet?.pecasVendidas       || 0;
  const confClientes    = negocios?.data?.griffte?.clientesAtendidos   || 0;
  const confPecas       = negocios?.data?.griffte?.pecasConfeccionadas || 0;
  const confEntregues   = negocios?.data?.griffte?.pedidosEntregues    || 0;
  const confEmProd      = negocios?.data?.griffte?.pedidosEmProducao   || 0;
  const cacambasDoBem   = negocios?.data?.outlet?.cacambasDoBem        || 0;

  const pecValor      = gv?.pecData?.totalAlunos ?? ind?.criancasAtendidas?.valor ?? 0;
  const pecMeta       = ind?.criancasAtendidas?.meta  || 1;
  const pecEvasaoPct  = pecValor > 0 ? Math.round(((gv?.pecData?.evasao ?? 0) / pecValor) * 100) : 0;
  const incD = gv?.inclusaoData || {};
  const mesNumRaw = mes === 'todos' ? NaN : parseInt(mes);
  const mesNum = isNaN(mesNumRaw) || mesNumRaw <= 0 ? new Date().getMonth() + 1 : mesNumRaw;
  const inclusaoFormados = ind?.alunosFormados?.valor ?? 0;
  const inclusaoMeta     = ind?.alunosFormados?.meta  || 2000;
  const psicoValor    = ind?.atendidosPsico?.valor ?? ind?.atendimentos?.valor ?? 0;
  const psicoMeta     = ind?.atendimentos?.meta  || 200;

  const inclusaoMetaProrated = Math.round(inclusaoMeta * mesNum / 12) || 1;
  const psicoMetaProrated    = Math.round(psicoMeta    * mesNum / 12) || 1;

  const programasData = [
    { name: 'PEC',        metrica: 'Crianças Atendidas', atual: pecValor,         meta: pecMeta,               cor: getColor(pecValor,         pecMeta) },
    { name: 'Inclusão',   metrica: 'Formados',           atual: inclusaoFormados, meta: inclusaoMetaProrated,  cor: getColor(inclusaoFormados, inclusaoMetaProrated) },
    { name: 'Psicossocial', metrica: 'Acolhimento',      atual: psicoValor,       meta: psicoMetaProrated,     cor: getColor(psicoValor,       psicoMetaProrated) },
  ];

  const CustomXTick = ({ x, y, payload }: any) => {
    const entry = programasData.find(d => d.name === payload.value);
    const metrica = entry?.metrica ?? '';
    const words = payload.value.split(' ');
    const shouldSplit = words.length >= 3;
    const mid = shouldSplit ? Math.ceil(words.length / 2) : words.length;
    const line1 = words.slice(0, mid).join(' ');
    const line2 = shouldSplit ? words.slice(mid).join(' ') : '';
    return (
      <g transform={`translate(${x},${y})`}>
        <text x={0} y={0} dy={12} textAnchor="middle" fill="#94a3b8" fontSize={10}>{line1}</text>
        {line2 && <text x={0} y={0} dy={24} textAnchor="middle" fill="#94a3b8" fontSize={10}>{line2}</text>}
        <text x={0} y={0} dy={line2 ? 37 : 25} textAnchor="middle" fill="#60a5fa" fontSize={9} fontStyle="italic">{metrica}</text>
      </g>
    );
  };

  const TooltipPrograma = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    const entry = programasData.find(d => d.name === label);
    const metrica = entry?.metrica ?? 'Resultado';
    return (
      <div style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: 8, padding: '8px 12px', fontSize: 11 }}>
        <p style={{ color: '#fff', fontWeight: 600, marginBottom: 4 }}>{label}</p>
        <p style={{ color: '#cbd5e1', marginBottom: 2 }}><span style={{ color: '#94a3b8' }}>Métrica: </span>{metrica}</p>
        {payload.map((p: any) => (
          <p key={p.dataKey} style={{ color: p.dataKey === 'atual' ? entry?.cor ?? '#fff' : '#93c5fd' }}>
            {p.dataKey === 'atual' ? metrica : 'Meta'}: {Number(p.value).toLocaleString('pt-BR')}
          </p>
        ))}
      </div>
    );
  };

  return (
    <div
      className="grid gap-2 h-full min-h-0"
      style={{
        gridTemplateColumns: 'repeat(12, minmax(0, 1fr))',
        gridTemplateRows: 'minmax(0, 1fr) minmax(0, 1.4fr)',
      }}
    >

      {/* ── Psicossocial: row 1, cols 1-2 ── */}
      <SectorCard compact title="Psicossocial" accent="#8b5cf6" style={{ gridColumn: '1 / span 2', gridRow: '1' }}>
        <div className="flex-1 grid grid-cols-1 gap-1" style={{ gridTemplateRows: '1fr 1fr' }}>
          <KpiCard compact><KpiItem size="sm" label="Visitas Psicossociais" valor={ind?.visitas?.valor || 0} meta={ind?.visitas?.meta || 3460} prorated proratedMes={mesNum} /></KpiCard>
          <KpiCard compact><KpiItem size="sm" label="Acolhimento Psicossociais" valor={psicoValor} meta={psicoMeta} prorated proratedMes={mesNum} /></KpiCard>
        </div>
      </SectorCard>

      {/* ── PEC: row 1, cols 3-5 ── */}
      <SectorCard compact title="Programa de Esporte e Cultura" accent="#10b981" style={{ gridColumn: '3 / span 3', gridRow: '1' }}>
        <div className="flex-1 grid grid-cols-3 gap-1" style={{ gridTemplateRows: 'repeat(3, minmax(0,1fr))' }}>
          <KpiCard compact>{pecMetas?.alimentacao_meta != null ? <KpiItem size="sm" label="Alimentação" valor={resumoPec?.alimentacao || 0} meta={pecMetas.alimentacao_meta} prorated proratedMes={mesNum} /> : <KpiItemNoMeta size="sm" label="Alimentação" valor={resumoPec?.alimentacao || 0} />}</KpiCard>
          <KpiCard compact><KpiItem size="sm" label="Frequência"   valor={gv?.pecData?.frequenciaMedia ?? ind?.frequencia?.valor ?? 0} meta={pecMetas?.frequencia_meta ?? ind?.frequencia?.meta ?? 1} format="percent" /></KpiCard>
          <KpiCard compact><KpiItem size="sm" label="Evasão"       valor={pecEvasaoPct} meta={10} inverse format="percent" note="Meta: < 10%" /></KpiCard>
          <KpiCard compact>{pecMetas?.hora_aula_meta != null ? <KpiItem size="sm" label="Horas Aula" valor={gv?.pecData?.horasAula ?? Number((resumoPec?.horasAula || 0).toFixed(0))} meta={pecMetas.hora_aula_meta} prorated proratedMes={mesNum} /> : <KpiItemNoMeta size="sm" label="Horas Aula" valor={gv?.pecData?.horasAula ?? Number((resumoPec?.horasAula || 0).toFixed(0))} />}</KpiCard>
          <KpiCard compact>{pecMetas?.atendimentos_meta != null ? <KpiItem size="sm" label="Atendimentos" valor={resumoPec?.atendimentos || 0} meta={pecMetas.atendimentos_meta} prorated proratedMes={mesNum} /> : <KpiItemNoMeta size="sm" label="Atendimentos" valor={resumoPec?.atendimentos || 0} />}</KpiCard>
          <KpiCard compact><KpiItem size="sm" label="Aval. Aprendizagem" valor={gv?.pecData?.nps ?? ind?.criterioSucesso?.valor ?? 0} meta={pecMetas?.avaliacao_aprendizagem_meta ?? ind?.criterioSucesso?.meta ?? 100} format="percent" /></KpiCard>
          <KpiCard compact style={{ gridColumn: 'span 3' }}><KpiItem size="sm" label="Crianças Atendidas" valor={pecValor} meta={ind?.criancasAtendidas?.meta || 500} /></KpiCard>
        </div>
      </SectorCard>

      {/* ── Marketing: row 1, cols 6-8 ── */}
      <SectorCard compact title="Marketing e Tecnologia" accent="#ec4899" style={{ gridColumn: '6 / span 3', gridRow: '1' }}>
        <div className="flex-1 flex flex-col gap-1 min-h-0">
          <div className="flex-1 min-h-0"><KpiCard compact className="h-full"><KpiItem size="sm" label="Doadores Ativos" valor={doadoresAtivos} meta={META_DOADORES_ANUAL} prorated proratedMes={mesNum} /></KpiCard></div>
          <div className="flex-1 min-h-0"><KpiCard compact className="h-full"><KpiItem size="sm" label="Doadores Evadidos" valor={doadoresEvadidos} meta={META_EVADIDOS_ANUAL} inverse prorated proratedMes={mesNum} /></KpiCard></div>
          <div className="flex-1 min-h-0"><KpiCard compact className="h-full"><KpiItem size="sm" label="Total Seguidores"  valor={totalSeguidores}  meta={META_SEGUIDORES} /></KpiCard></div>
        </div>
      </SectorCard>

      {/* ── Atendidos por Programa: rows 1-2, cols 9-12 ── */}
      <div
        className="flex flex-col gap-2 bg-slate-800/60 rounded-xl p-3 min-h-0"
        style={{ gridColumn: '9 / span 4', gridRow: '1 / span 2', border: '1px solid rgba(71,85,105,0.35)' }}
      >
        <p className="text-[11px] text-white font-semibold uppercase tracking-widest pb-2 border-b border-slate-700/30 flex-shrink-0">
          Resultados por Programa
        </p>
        <div className="flex-1 min-h-0 [&>div>svg]:overflow-visible">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={programasData} barCategoryGap="20%" barGap={4} margin={{ top: 20, right: 8, left: 0, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
              <XAxis dataKey="name" stroke="#94a3b8" tickLine={false} height={60} tick={<CustomXTick />} />
              <YAxis stroke="#64748b" fontSize={10} tickCount={4} />
              <Tooltip
                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                content={<TooltipPrograma />}
              />
              <Bar dataKey="atual" name="atual" radius={[4, 4, 0, 0]} barSize={24}
                label={{ position: 'top', fill: '#cbd5e1', fontSize: 10, formatter: (v: number) => v > 0 ? v.toLocaleString('pt-BR') : '' }}
              >
                {programasData.map((entry, i) => <Cell key={i} fill={entry.cor} />)}
              </Bar>
              <Bar dataKey="meta" name="meta" radius={[4, 4, 0, 0]} barSize={24} fill="#3b82f6"
                label={{ position: 'top', fill: '#93c5fd', fontSize: 10, formatter: (v: number) => v > 0 ? v.toLocaleString('pt-BR') : '' }}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        {/* Legenda manual */}
        <div className="flex-shrink-0 flex flex-col items-center gap-1 pt-2 border-t border-slate-700/30">
          <div className="flex items-center gap-2">
            <div className="flex gap-0.5">
              <span className="inline-block w-3 h-3 rounded-sm" style={{ background: '#ef4444' }} />
              <span className="inline-block w-3 h-3 rounded-sm" style={{ background: '#eab308' }} />
              <span className="inline-block w-3 h-3 rounded-sm" style={{ background: '#22c55e' }} />
            </div>
            <span className="text-[10px] text-slate-300">Resultado — Cor indica alcance da meta</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-3 h-3 rounded-sm" style={{ background: '#3b82f6' }} />
            <span className="text-[10px] text-slate-300">Meta</span>
          </div>
        </div>
      </div>

      {/* ── Inclusão Produtiva: row 2, cols 1-5 ── */}
      <SectorCard compact title="Inclusão Produtiva" accent="#3b82f6" style={{ gridColumn: '1 / span 5', gridRow: '2' }}>
        <div className="flex-1 grid grid-cols-3 gap-1" style={{ gridTemplateRows: 'repeat(3, minmax(0, 1fr))' }}>
          <KpiCard compact><KpiItem size="sm" label="Geração de Renda"   valor={ind?.pessoasEmpregadas?.valor ?? 0} meta={ind?.pessoasEmpregadas?.meta || 1500} prorated proratedMes={mesNum} /></KpiCard>
          <KpiCard compact><KpiItemNoMeta size="sm" label="Pessoas em Formação" valor={incD?.alunosAtivos ?? ind?.alunosEmFormacao?.valor ?? 0} /></KpiCard>
          <KpiCard compact><KpiItem size="sm" label="Pessoas Formadas"    valor={ind?.alunosFormados?.valor ?? 0} meta={ind?.alunosFormados?.meta || 2000} prorated proratedMes={mesNum} /></KpiCard>
          <KpiCard compact><KpiItemNoMeta size="sm" label="Atendimentos" valor={incD?.atendimentos ?? 0} /></KpiCard>
          <KpiCard compact><KpiItem size="sm" label="Frequência"          valor={ind?.frequencia?.valor ?? 0} meta={ind?.frequencia?.meta || 85} format="percent" /></KpiCard>
          <KpiCard compact><KpiItem size="sm" label="Evasão"              valor={ind?.evasao?.valor ?? 0} meta={ind?.evasao?.meta || 10} inverse format="percent" note="Meta: < 10%" /></KpiCard>
          <KpiCard compact><KpiItemNoMeta size="sm" label="Horas Aula" valor={incD?.horasAula ?? 0} /></KpiCard>
          <KpiCard compact>{ind?.nps?.meta != null ? <KpiItem size="sm" label="Aval. Aprendizagem" valor={ind?.nps?.valor ?? 0} meta={ind.nps.meta} format="percent" /> : <KpiItemNoMeta size="sm" label="Aval. Aprendizagem" valor={ind?.nps?.valor ?? 0} />}</KpiCard>
          <KpiCard compact><KpiItemNoMeta size="sm" label="Alimentação" valor={incD?.alimentacao ?? 0} /></KpiCard>
        </div>
      </SectorCard>

      {/* ── Negócios Sociais: row 2, cols 6-8 ── */}
      <SectorCard compact title="Negócios Sociais" accent="#f97316" style={{ gridColumn: '6 / span 3', gridRow: '2' }}>
        <div
          className="flex-1 grid grid-cols-2 gap-x-1 gap-y-1"
          style={{ gridTemplateRows: 'auto minmax(0,1fr) minmax(0,1fr) auto minmax(0,1fr) minmax(0,1fr)' }}
        >
          <p className="col-span-2 text-[9px] text-slate-400 uppercase tracking-widest font-semibold border-b border-slate-700/30 pb-0.5">Outlet</p>
          <KpiCard compact><KpiItem size="sm" label="Itens Recebidos" valor={outletRecebidos} meta={20000} prorated proratedMes={mesNum} /></KpiCard>
          <KpiCard compact><KpiItemNoMeta size="sm" label="Itens Vendidos"  valor={outletVendidos} /></KpiCard>
          <KpiCard compact style={{ gridColumn: 'span 2' }}><KpiItem size="sm" label="Caçambas do Bem" valor={cacambasDoBem} meta={20} prorated proratedMes={mesNum} /></KpiCard>
          <p className="col-span-2 text-[9px] text-slate-400 uppercase tracking-widest font-semibold border-b border-slate-700/30 pb-0.5">Confecção</p>
          <KpiCard compact><KpiItemNoMeta size="sm" label="Clientes"          valor={confClientes} /></KpiCard>
          <KpiCard compact><KpiItemNoMeta size="sm" label="Pedidos Entregues" valor={confEntregues} /></KpiCard>
          <KpiCard compact style={{ gridColumn: 'span 2' }}><KpiItemNoMeta size="sm" label="Peças Produzidas"  valor={confPecas} /></KpiCard>
        </div>
      </SectorCard>

    </div>
  );
}
