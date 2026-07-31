import { useQuery } from "@tanstack/react-query";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell,
} from "recharts";
import {
  KpiItem, KpiItemNoMeta, KpiCard, SectorCard, getColor, NpsBar, buildQp,
  type PeriodoFiltro, isPeriodoTodos, isPeriodoMulti, periodoMesUnico, periodoMesesLista,
  periodoUltimoMes, metaFnPeriodo, metaNoPeriodo, isPeriodoSemMeta,
  doadoresAtivosNoPeriodo, doadoresEvadidosNoPeriodo, precisaEvadidosMesVigente,
  FAVELA3D_OCULTAR, FAMILIAS_FAVELA3D_EXIBICAO, coletivosFavela3DNoPeriodo,
} from "./shared";
import { fetchGestaoVistaDashboard } from "./fetchGestaoVista";

interface Props { ano: string; periodo: PeriodoFiltro; isMobile?: boolean; }

export default function TabGeral({ ano, periodo, isMobile = false }: Props) {
  const qp = buildQp(ano, periodo);
  const { data: gv } = useQuery<any>({
    queryKey: ['/api/gestao-vista', ano, periodo],
    queryFn: () => fetchGestaoVistaDashboard(`/api/gestao-vista${qp}`).then(r => r.json()),
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
  const { data: doadoresHistorico } = useQuery<any>({
    queryKey: ['/api/doadores/historico-mensal', ano],
    queryFn: () => fetch(`/api/doadores/historico-mensal?ano=${ano}`, { credentials: 'include' }).then(r => r.json()),
    refetchInterval: 60000,
  });
  const { data: doadoresExternosGeral } = useQuery<any>({
    queryKey: ['/api/doadores-externos'],
    queryFn: () => fetch('/api/doadores-externos').then(r => r.json()),
    staleTime: 0,
    refetchOnMount: 'always',
  });
  const { data: segMensal } = useQuery<any>({
    queryKey: ['/api/marketing-seguidores-mensal', ano],
    queryFn: () => fetch(`/api/marketing-seguidores-mensal?ano=${ano}`).then(r => r.json()),
    refetchInterval: 60000,
  });
  const { data: negocios } = useQuery<any>({
    queryKey: ['/api/negocios-sociais', ano, periodo],
    queryFn: () => fetch(`/api/negocios-sociais${qp}`).then(r => r.json()),
    refetchInterval: 60000,
  });
  const { data: igData } = useQuery<any>({
    queryKey: ['/api/instagram/metrics/current'],
    queryFn: () => fetch('/api/instagram/metrics/current').then(r => r.json()),
    refetchInterval: 300000,
    retry: false,
  });
  const { data: favela } = useQuery<any>({
    queryKey: ['/api/gestao-vista/favela3d', ano, periodo],
    queryFn: () => fetchGestaoVistaDashboard(`/api/gestao-vista/favela3d${qp}`).then(r => r.json()),
    refetchInterval: 60000,
  });
  const { data: psicoKpisGeral } = useQuery<any>({
    queryKey: ['/api/psico/dashboard-kpis', ano, periodo],
    queryFn: () => fetch(`/api/psico/dashboard-kpis${qp}`).then(r => r.json()),
    refetchInterval: 60000,
  });
  const pecKpisUrl = `/api/pec/dashboard-kpis${qp}`;
  const { data: pecKpis } = useQuery<any>({
    queryKey: [pecKpisUrl],
    queryFn: async () => { const r = await fetch(pecKpisUrl, { credentials: 'include' }); if (!r.ok) return null; return r.json(); },
    refetchInterval: 60000,
  });
  const { data: metasDBPec } = useQuery<{ metas: Record<string, number> }>({
    queryKey: ['/api/metas-indicadores', ano, 'pec'],
    queryFn: () => fetch(`/api/metas-indicadores?ano=${ano}&vertente=pec`).then(r => r.json()),
    staleTime: 60000,
  });

  const ind = gv?.indicadores || {};
  const pecMetas = gv?.pecMetas || {};
  const metasAdmPec = metasDBPec?.metas ?? {};
  const segRows = segMensal?.data || [];

  const META_DOADORES_ANUAL = 2000;
  const META_EVADIDOS_ANUAL = Math.round(META_DOADORES_ANUAL * 0.10);

  const mesesPeriodo = periodoMesesLista(periodo);
  const multi = isPeriodoMulti(periodo);
  const mesUnico = periodoMesUnico(periodo);

  const histRows: any[] = doadoresHistorico?.data || [];
  const histByMes: Record<number, any> = {};
  for (const r of histRows) histByMes[Number(r.mes)] = r;

  const extCount = doadoresExternosGeral?.totalDoadores || 0;
  const evadidosVigenteAoVivo = buscaEvadidosVigente
    ? (doadoresMesVigente?.porStatus?.canceled ?? null)
    : null;
  const doadoresAtivos = doadoresAtivosNoPeriodo(
    ano, periodo, histByMes,
    doadores?.porStatus?.active || 0,
    doadores?.porStatus?.trialing || 0,
    doadores?.porStatus?.past_due || 0,
    extCount,
  );
  const doadoresEvadidos = doadoresEvadidosNoPeriodo(ano, periodo, histByMes, evadidosVigenteAoVivo);

  const META_SEGUIDORES  = 15000;
  const segByMes: Record<string, any> = {};
  for (const r of segRows) segByMes[String(r.mes)] = r;
  const mesDataSeg  = mesUnico ? segByMes[String(mesUnico)] : undefined;
  const lastSegRow  = segRows[segRows.length - 1];

  const ig = igData?.data || null;
  const igFollowersLive = ig?.followers_total || 0;

  const segSnapRow = multi ? segByMes[String(periodoUltimoMes(periodo))] : null;
  const totalSeguidores = segSnapRow
    ? (segSnapRow.total_seguidores ?? lastSegRow?.total_seguidores ?? 11538)
    : isPeriodoTodos(periodo)
      ? (igFollowersLive || lastSegRow?.total_seguidores || 11538)
      : (mesDataSeg?.total_seguidores ?? lastSegRow?.total_seguidores ?? 11538);

  const outletRecebidos = negocios?.data?.outlet?.doacoesRecebidas    || 0;
  const outletVendidos  = negocios?.data?.outlet?.pecasVendidas       || 0;
  const confClientes    = negocios?.data?.griffte?.clientesAtendidos   || 0;
  const confPecas       = negocios?.data?.griffte?.pecasConfeccionadas || 0;
  const confEntregues   = negocios?.data?.griffte?.pedidosEntregues    || 0;
  const cacambasDoBem   = negocios?.data?.outlet?.cacambasDoBem        || 0;

  const pecValor      = gv?.pecData?.totalAlunos ?? ind?.criancasAtendidas?.valor ?? 0;
  const pecMeta       = ind?.criancasAtendidas?.meta  || 1;
  const pecEvasaoPct  = gv?.pecData?.evasao ?? 0;
  const incD = gv?.inclusaoData || {};
  const metaFn = (anual: number) => metaFnPeriodo(periodo, anual);
  const m = (meta: number) => metaNoPeriodo(periodo, meta);
  const pecNpsValor   = Math.round(pecKpis?.nps ?? gv?.pecData?.nps ?? 0);
  const pecNpsMeta    = m(metasAdmPec.nps ?? 90);
  const semMeta = isPeriodoSemMeta(periodo);
  const inclusaoFormados = ind?.alunosFormados?.valor ?? 0;
  const inclusaoMeta     = ind?.alunosFormados?.meta  || 2000;
  const psicoValor    = (psicoKpisGeral?.atendimentos ?? ind?.atendimentos?.valor ?? 0) + (psicoKpisGeral?.demandasEspontaneas ?? 0);
  const psicoMeta     = ind?.atendimentos?.meta  || 200;
  const psicoVisitas  = psicoKpisGeral?.visitas   ?? ind?.visitas?.valor ?? 0;
  const psicoVisitasMeta = ind?.visitas?.meta || 250;

  const inclusaoMetaProrated = metaFn(inclusaoMeta);
  const psicoMetaProrated    = metaFn(psicoMeta);

  const favFamilias       = FAMILIAS_FAVELA3D_EXIBICAO;
  const favAtend          = favela?.registros          ?? 0;
  const favVisitas        = favela?.visitas            ?? 0;
  const favGerandoLider   = coletivosFavela3DNoPeriodo('gerando_lideranca', periodo).registros;
  const favAssembleia     = coletivosFavela3DNoPeriodo('assembleia', periodo).registros;
  const favGrupoMulheres  = favela?.grupo_mulheres     ?? 0;

  const pecMetaEffective = metaNoPeriodo(periodo, pecMeta);
  const programasData = [
    { name: 'PEC',        metrica: 'Crianças Atendidas', atual: pecValor,         meta: pecMetaEffective,      cor: getColor(pecValor,         pecMetaEffective) },
    { name: 'Inclusão',   metrica: 'Formados',           atual: inclusaoFormados, meta: inclusaoMetaProrated,  cor: getColor(inclusaoFormados, inclusaoMetaProrated) },
    { name: 'Psicossocial', metrica: 'Acolhimento',      atual: psicoValor,       meta: psicoMetaProrated,     cor: getColor(psicoValor,       psicoMetaProrated) },
  ];

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

  /* ─────────────────────────────────────────────────────────────────── */
  /* MOBILE LAYOUT                                                        */
  /* ─────────────────────────────────────────────────────────────────── */
  if (isMobile) {
    return (
      <div className="flex flex-col gap-3 pb-2">

        {/* Psicossocial */}
        <SectorCard compact title="Psicossocial" accent="#8b5cf6">
          <div className="grid grid-cols-2 gap-1.5">
            <KpiCard compact><KpiItem size="md" label="Visitas Domiciliares" valor={psicoVisitas} meta={metaFn(psicoVisitasMeta)} /></KpiCard>
            <KpiCard compact><KpiItem size="md" label="Acolhimento Individual" valor={psicoValor} meta={metaFn(psicoMeta)} /></KpiCard>
          </div>
        </SectorCard>

        {/* PEC */}
        <SectorCard compact title="Programa de Esporte e Cultura" accent="#10b981">
          <div className="grid grid-cols-3 gap-1.5">
            <KpiCard compact>
              {pecMetas?.alimentacao_meta != null
                ? <KpiItem size="sm" label="Alimentação" valor={gv?.pecData?.alimentacao || 0} meta={metaFn(pecMetas.alimentacao_meta)} />
                : <KpiItemNoMeta size="sm" label="Alimentação" valor={gv?.pecData?.alimentacao || 0} />}
            </KpiCard>
            <KpiCard compact><KpiItem size="sm" label="Frequência" valor={gv?.pecData?.frequenciaMedia ?? ind?.frequencia?.valor ?? 0} meta={m(pecMetas?.frequencia_meta ?? ind?.frequencia?.meta ?? 1)} format="percent" /></KpiCard>
            <KpiCard compact><KpiItem size="sm" label="Evasão" valor={pecEvasaoPct} meta={m(10)} inverse format="percent" note={!semMeta ? "Meta: <= 10%" : undefined} /></KpiCard>
            <KpiCard compact>
              {pecMetas?.hora_aula_meta != null
                ? <KpiItem size="sm" label="Horas Aula" valor={gv?.pecData?.horasAula ?? 0} meta={metaFn(pecMetas.hora_aula_meta)} />
                : <KpiItemNoMeta size="sm" label="Horas Aula" valor={gv?.pecData?.horasAula ?? 0} />}
            </KpiCard>
            <KpiCard compact>
              {pecMetas?.atendimentos_meta != null
                ? <KpiItem size="sm" label="Atendimentos" valor={gv?.pecData?.atendimentos || 0} meta={metaFn(pecMetas.atendimentos_meta)} />
                : <KpiItemNoMeta size="sm" label="Atendimentos" valor={gv?.pecData?.atendimentos || 0} />}
            </KpiCard>
            <KpiCard compact><KpiItem size="sm" label="NPS" valor={pecNpsValor} meta={pecNpsMeta} format="number" /></KpiCard>
            <KpiCard compact style={{ gridColumn: 'span 3' }}><KpiItem size="sm" label="Crianças Atendidas" valor={pecValor} meta={pecMetaEffective} /></KpiCard>
          </div>
        </SectorCard>

        {/* Marketing */}
        <SectorCard compact title="Marketing e Tecnologia" accent="#ec4899">
          <div className="grid grid-cols-3 gap-1.5">
            <KpiCard compact><KpiItem size="sm" label="Doadores Ativos" valor={doadoresAtivos} meta={metaFn(META_DOADORES_ANUAL)} /></KpiCard>
            <KpiCard compact><KpiItem size="sm" label="Doadores Evadidos" valor={doadoresEvadidos} meta={metaFn(META_EVADIDOS_ANUAL)} inverse /></KpiCard>
            <KpiCard compact><KpiItem size="sm" label="Total Seguidores" valor={totalSeguidores} meta={m(META_SEGUIDORES)} /></KpiCard>
          </div>
        </SectorCard>

        {/* Gráfico Resultados por Programa */}
        <div className="bg-slate-800/60 rounded-xl p-3" style={{ border: '1px solid rgba(71,85,105,0.35)' }}>
          <p className="text-[11px] text-white font-semibold uppercase tracking-widest mb-2">Resultados por Programa</p>
          <div style={{ height: 180 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={programasData} barCategoryGap="20%" barGap={4} margin={{ top: 16, right: 8, left: 0, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" tickLine={false} fontSize={10} />
                <YAxis stroke="#64748b" fontSize={10} tickCount={4} />
                <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} content={<TooltipPrograma />} />
                <Bar dataKey="atual" name="atual" radius={[4, 4, 0, 0]} barSize={20}
                  label={{ position: 'top', fill: '#cbd5e1', fontSize: 9, formatter: (v: number) => v > 0 ? v.toLocaleString('pt-BR') : '' }}
                >
                  {programasData.map((entry, i) => <Cell key={i} fill={entry.cor} />)}
                </Bar>
                <Bar dataKey="meta" name="meta" radius={[4, 4, 0, 0]} barSize={20} fill="#3b82f6"
                  label={{ position: 'top', fill: '#93c5fd', fontSize: 9, formatter: (v: number) => v > 0 ? v.toLocaleString('pt-BR') : '' }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center justify-center gap-4 pt-1">
            <div className="flex items-center gap-1">
              <div className="flex gap-0.5">
                <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: '#ef4444' }} />
                <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: '#eab308' }} />
                <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: '#22c55e' }} />
              </div>
              <span className="text-[9px] text-slate-300">Resultado</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: '#3b82f6' }} />
              <span className="text-[9px] text-slate-300">Meta</span>
            </div>
          </div>
        </div>

        {/* Inclusão Produtiva */}
        <SectorCard compact title="Inclusão Produtiva" accent="#3b82f6">
          <div className="grid grid-cols-3 gap-1.5">
            <KpiCard compact><KpiItem size="sm" label="Geração de Renda" valor={(ind?.pessoasEmpregadas?.valor ?? 0) + (ind?.empreendedores?.valor ?? 0)} meta={metaFn((ind?.pessoasEmpregadas?.meta ?? 1000) + (ind?.empreendedores?.meta ?? 500))} /></KpiCard>
            <KpiCard compact><KpiItemNoMeta size="sm" label="Em Formação" valor={incD?.alunosAtivos ?? ind?.alunosEmFormacao?.valor ?? 0} /></KpiCard>
            <KpiCard compact><KpiItem size="sm" label="Formadas" valor={ind?.alunosFormados?.valor ?? 0} meta={inclusaoMetaProrated} /></KpiCard>
            <KpiCard compact><KpiItemNoMeta size="sm" label="Atendimentos" valor={incD?.atendimentos ?? 0} /></KpiCard>
            <KpiCard compact><KpiItem size="sm" label="Frequência" valor={gv?.inclusaoData?.frequencia ?? ind?.frequencia?.valor ?? 0} meta={m(ind?.frequencia?.meta || 85)} format="percent" /></KpiCard>
            <KpiCard compact><KpiItem size="sm" label="Evasão" valor={incD?.evasao ?? 0} meta={m(ind?.evasao?.meta || 10)} inverse format="percent" /></KpiCard>
            <KpiCard compact><KpiItemNoMeta size="sm" label="Horas Aula" valor={incD?.horasAula ?? 0} /></KpiCard>
            <KpiCard compact><KpiItem size="sm" label="NPS" valor={ind?.nps?.valor ?? 0} meta={m(ind?.nps?.meta ?? 70)} format="number" /></KpiCard>
            <KpiCard compact><KpiItemNoMeta size="sm" label="Alimentação" valor={incD?.alimentacao ?? 0} /></KpiCard>
          </div>
        </SectorCard>

        {/* Favela 3D */}
        <SectorCard compact title="Favela 3D" accent="#f59e0b">
          <div className="flex flex-col gap-1.5">
            <p className="text-[9px] text-slate-400 uppercase tracking-widest font-semibold border-b border-slate-700/30 pb-0.5">Panorama Favela 3D</p>
            <KpiCard compact><KpiItemNoMeta size="sm" label="Famílias" valor={favFamilias} /></KpiCard>
            {!FAVELA3D_OCULTAR.atendIndividuais && (
              <KpiCard compact><KpiItemNoMeta size="sm" label="Atendimentos" valor={favAtend} /></KpiCard>
            )}
            {!FAVELA3D_OCULTAR.visitasDomiciliares && (
              <KpiCard compact><KpiItemNoMeta size="sm" label="Visitas" valor={favVisitas} /></KpiCard>
            )}
            <p className="text-[9px] text-slate-400 uppercase tracking-widest font-semibold border-b border-slate-700/30 pb-0.5 pt-0.5">Atendimentos Coletivos</p>
            <div className="grid grid-cols-2 gap-1.5">
              <KpiCard compact><KpiItemNoMeta size="sm" label="Gerando Liderança" valor={favGerandoLider} /></KpiCard>
              <KpiCard compact><KpiItemNoMeta size="sm" label="Assembleia" valor={favAssembleia} /></KpiCard>
              {!FAVELA3D_OCULTAR.grupoMulheres && (
                <KpiCard compact style={{ gridColumn: 'span 2' }}><KpiItemNoMeta size="sm" label="Grupo de Mulheres" valor={favGrupoMulheres} /></KpiCard>
              )}
            </div>
          </div>
        </SectorCard>

        {/* Negócios Sociais */}
        <SectorCard compact title="Negócios Sociais" accent="#f97316">
          <div className="grid grid-cols-2 gap-1.5">
            <KpiCard compact><KpiItem size="sm" label="Itens Recebidos" valor={outletRecebidos} meta={metaFn(20000)} /></KpiCard>
            <KpiCard compact><KpiItemNoMeta size="sm" label="Itens Vendidos" valor={outletVendidos} /></KpiCard>
            <KpiCard compact style={{ gridColumn: 'span 2' }}><KpiItem size="sm" label="Caçambas do Bem" valor={cacambasDoBem} meta={metaFn(20)} /></KpiCard>
            <KpiCard compact><KpiItemNoMeta size="sm" label="Clientes" valor={confClientes} /></KpiCard>
            <KpiCard compact><KpiItemNoMeta size="sm" label="Entregues" valor={confEntregues} /></KpiCard>
            <KpiCard compact style={{ gridColumn: 'span 2' }}><KpiItemNoMeta size="sm" label="Peças Produzidas" valor={confPecas} /></KpiCard>
          </div>
        </SectorCard>

      </div>
    );
  }

  /* ─────────────────────────────────────────────────────────────────── */
  /* DESKTOP LAYOUT (12-col grid, unchanged)                              */
  /* ─────────────────────────────────────────────────────────────────── */
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
          <KpiCard compact><KpiItem size="sm" label="Visitas Domiciliares" valor={psicoVisitas} meta={metaFn(psicoVisitasMeta)} /></KpiCard>
          <KpiCard compact><KpiItem size="sm" label="Acolhimento Individual" valor={psicoValor} meta={metaFn(psicoMeta)} /></KpiCard>
        </div>
      </SectorCard>

      {/* ── PEC: row 1, cols 3-5 ── */}
      <SectorCard compact title="Programa de Esporte e Cultura" accent="#10b981" style={{ gridColumn: '3 / span 3', gridRow: '1' }}>
        <div className="flex-1 grid grid-cols-3 gap-1" style={{ gridTemplateRows: 'repeat(3, minmax(0,1fr))' }}>
          <KpiCard compact>{pecMetas?.alimentacao_meta != null ? <KpiItem size="sm" label="Alimentação" valor={gv?.pecData?.alimentacao || 0} meta={metaFn(pecMetas.alimentacao_meta)} /> : <KpiItemNoMeta size="sm" label="Alimentação" valor={gv?.pecData?.alimentacao || 0} />}</KpiCard>
          <KpiCard compact><KpiItem size="sm" label="Frequência"   valor={gv?.pecData?.frequenciaMedia ?? ind?.frequencia?.valor ?? 0} meta={m(pecMetas?.frequencia_meta ?? ind?.frequencia?.meta ?? 1)} format="percent" /></KpiCard>
          <KpiCard compact><KpiItem size="sm" label="Evasão"       valor={pecEvasaoPct} meta={m(10)} inverse format="percent" note={!semMeta ? "Meta: <= 10%" : undefined} /></KpiCard>
          <KpiCard compact>{pecMetas?.hora_aula_meta != null ? <KpiItem size="sm" label="Horas Aula" valor={gv?.pecData?.horasAula ?? 0} meta={metaFn(pecMetas.hora_aula_meta)} /> : <KpiItemNoMeta size="sm" label="Horas Aula" valor={gv?.pecData?.horasAula ?? 0} />}</KpiCard>
          <KpiCard compact>{pecMetas?.atendimentos_meta != null ? <KpiItem size="sm" label="Atendimentos" valor={gv?.pecData?.atendimentos || 0} meta={metaFn(pecMetas.atendimentos_meta)} /> : <KpiItemNoMeta size="sm" label="Atendimentos" valor={gv?.pecData?.atendimentos || 0} />}</KpiCard>
          <KpiCard compact><KpiItem size="sm" label="NPS" valor={pecNpsValor} meta={pecNpsMeta} format="number" /></KpiCard>
          <KpiCard compact style={{ gridColumn: 'span 3' }}><KpiItem size="sm" label="Crianças Atendidas" valor={pecValor} meta={pecMetaEffective} /></KpiCard>
        </div>
      </SectorCard>

      {/* ── Marketing: row 1, cols 6-8 ── */}
      <SectorCard compact title="Marketing e Tecnologia" accent="#ec4899" style={{ gridColumn: '6 / span 3', gridRow: '1' }}>
        <div className="flex-1 flex flex-col gap-1 min-h-0">
          <div className="flex-1 min-h-0"><KpiCard compact className="h-full"><KpiItem size="sm" label="Doadores Ativos" valor={doadoresAtivos} meta={metaFn(META_DOADORES_ANUAL)} /></KpiCard></div>
          <div className="flex-1 min-h-0"><KpiCard compact className="h-full"><KpiItem size="sm" label="Doadores Evadidos" valor={doadoresEvadidos} meta={metaFn(META_EVADIDOS_ANUAL)} inverse /></KpiCard></div>
          <div className="flex-1 min-h-0"><KpiCard compact className="h-full"><KpiItem size="sm" label="Total Seguidores"  valor={totalSeguidores}  meta={m(META_SEGUIDORES)} /></KpiCard></div>
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
              <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} content={<TooltipPrograma />} />
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

      {/* ── Inclusão Produtiva: row 2, cols 1-3 ── */}
      <SectorCard compact title="Inclusão Produtiva" accent="#3b82f6" style={{ gridColumn: '1 / span 3', gridRow: '2' }}>
        <div className="flex-1 grid grid-cols-3 gap-1" style={{ gridTemplateRows: 'repeat(3, minmax(0, 1fr))' }}>
          <KpiCard compact><KpiItem size="sm" label="Geração de Renda"   valor={(ind?.pessoasEmpregadas?.valor ?? 0) + (ind?.empreendedores?.valor ?? 0)} meta={metaFn((ind?.pessoasEmpregadas?.meta ?? 1000) + (ind?.empreendedores?.meta ?? 500))} /></KpiCard>
          <KpiCard compact><KpiItemNoMeta size="sm" label="Pessoas em Formação" valor={incD?.alunosAtivos ?? ind?.alunosEmFormacao?.valor ?? 0} /></KpiCard>
          <KpiCard compact><KpiItem size="sm" label="Pessoas Formadas"    valor={ind?.alunosFormados?.valor ?? 0} meta={inclusaoMetaProrated} /></KpiCard>
          <KpiCard compact><KpiItemNoMeta size="sm" label="Atendimentos" valor={incD?.atendimentos ?? 0} /></KpiCard>
          <KpiCard compact><KpiItem size="sm" label="Frequência"          valor={gv?.inclusaoData?.frequencia ?? ind?.frequencia?.valor ?? 0} meta={m(ind?.frequencia?.meta || 85)} format="percent" /></KpiCard>
          <KpiCard compact><KpiItem size="sm" label="Evasão"              valor={incD?.evasao ?? 0} meta={m(ind?.evasao?.meta || 10)} inverse format="percent" note={!semMeta ? "Meta: <= 10%" : undefined} /></KpiCard>
          <KpiCard compact><KpiItemNoMeta size="sm" label="Horas Aula" valor={incD?.horasAula ?? 0} /></KpiCard>
          <KpiCard compact><KpiItem size="sm" label="NPS" valor={ind?.nps?.valor ?? 0} meta={m(ind?.nps?.meta ?? 70)} format="number" /></KpiCard>
          <KpiCard compact><KpiItemNoMeta size="sm" label="Alimentação" valor={incD?.alimentacao ?? 0} /></KpiCard>
        </div>
      </SectorCard>

      {/* ── Favela 3D: row 2, cols 4-5 ── */}
      <SectorCard compact title="Favela 3D" accent="#f59e0b" style={{ gridColumn: '4 / span 2', gridRow: '2' }}>
        <div className="flex-1 flex flex-col gap-1 min-h-0">
          <p className="text-[9px] text-slate-400 uppercase tracking-widest font-semibold border-b border-slate-700/30 pb-0.5 flex-shrink-0">Panorama Favela 3D</p>
          <KpiCard compact className="flex-1 min-h-0"><KpiItemNoMeta size="sm" label="Famílias" valor={favFamilias} /></KpiCard>
          {!FAVELA3D_OCULTAR.atendIndividuais && (
            <KpiCard compact className="flex-1 min-h-0"><KpiItemNoMeta size="sm" label="Atendimentos" valor={favAtend} /></KpiCard>
          )}
          {!FAVELA3D_OCULTAR.visitasDomiciliares && (
            <KpiCard compact className="flex-1 min-h-0"><KpiItemNoMeta size="sm" label="Visitas" valor={favVisitas} /></KpiCard>
          )}
          <p className="text-[9px] text-slate-400 uppercase tracking-widest font-semibold border-b border-slate-700/30 pb-0.5 flex-shrink-0">Atendimentos Coletivos</p>
          <div className="flex-1 grid grid-cols-2 gap-1 min-h-0">
            <KpiCard compact className="h-full min-h-0"><KpiItemNoMeta size="sm" label="Gerando Liderança" valor={favGerandoLider} /></KpiCard>
            <KpiCard compact className="h-full min-h-0"><KpiItemNoMeta size="sm" label="Assembleia" valor={favAssembleia} /></KpiCard>
            {!FAVELA3D_OCULTAR.grupoMulheres && (
              <KpiCard compact className="col-span-2 h-full min-h-0"><KpiItemNoMeta size="sm" label="Grupo de Mulheres" valor={favGrupoMulheres} /></KpiCard>
            )}
          </div>
        </div>
      </SectorCard>

      {/* ── Negócios Sociais: row 2, cols 6-8 ── */}
      <SectorCard compact title="Negócios Sociais" accent="#f97316" style={{ gridColumn: '6 / span 3', gridRow: '2' }}>
        <div
          className="flex-1 grid grid-cols-2 gap-x-1 gap-y-1"
          style={{ gridTemplateRows: 'auto minmax(0,1fr) minmax(0,1fr) auto minmax(0,1fr) minmax(0,1fr)' }}
        >
          <p className="col-span-2 text-[9px] text-slate-400 uppercase tracking-widest font-semibold border-b border-slate-700/30 pb-0.5">Outlet</p>
          <KpiCard compact><KpiItem size="sm" label="Itens Recebidos" valor={outletRecebidos} meta={metaFn(20000)} /></KpiCard>
          <KpiCard compact><KpiItemNoMeta size="sm" label="Itens Vendidos"  valor={outletVendidos} /></KpiCard>
          <KpiCard compact style={{ gridColumn: 'span 2' }}><KpiItem size="sm" label="Caçambas do Bem" valor={cacambasDoBem} meta={metaFn(20)} /></KpiCard>
          <p className="col-span-2 text-[9px] text-slate-400 uppercase tracking-widest font-semibold border-b border-slate-700/30 pb-0.5">Confecção</p>
          <KpiCard compact><KpiItemNoMeta size="sm" label="Clientes"          valor={confClientes} /></KpiCard>
          <KpiCard compact><KpiItemNoMeta size="sm" label="Pedidos Entregues" valor={confEntregues} /></KpiCard>
          <KpiCard compact style={{ gridColumn: 'span 2' }}><KpiItemNoMeta size="sm" label="Peças Produzidas"  valor={confPecas} /></KpiCard>
        </div>
      </SectorCard>
    </div>
  );
}
