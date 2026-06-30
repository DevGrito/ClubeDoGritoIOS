import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { SlidersHorizontal, ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';
import { Indicador, IndicadorLine, HintIcon } from '@/components/ImpactGestaoVista';

// ─── Helper ───────────────────────────────────────────────────────────────────

function mk(valor: number, meta: number | undefined, tipo: 'count' | 'percent'): Indicador {
  return { valor, meta, tipo, color: 'gray', progress: 0 };
}

// ─── Tipo do /api/gestao-vista ────────────────────────────────────────────────

interface GVData {
  indicadores: {
    alunosFormados:     Indicador;
    pessoasEmpregadas:  Indicador;
    empreendedores:     Indicador;
    nps:                Indicador;
    npsCombinado?:      Indicador;
    atendimentos:       Indicador;
    visitas:            Indicador;
    criancasAtendidas:  Indicador;
    evasao:             Indicador;
    frequencia:         Indicador;
    atendidosInclusao?: Indicador;
    atendidosPsico?:    Indicador;
  };
  inclusaoData?: {
    frequencia:  number;
    evasao:      number;
    horasAula:   number;
    alimentacao: number;
    atendimentos: number;
  };
  pecData?: {
    frequenciaMedia: number;
    evasao:          number;
    horasAula:       number;
    alimentacao:     number;
    atendimentos:    number;
  };
}

// ─── Meses ────────────────────────────────────────────────────────────────────

const allMonths = [
  { value: 'null', label: 'Acumulado' },
  { value: '1',  label: 'Janeiro' },
  { value: '2',  label: 'Fevereiro' },
  { value: '3',  label: 'Março' },
  { value: '4',  label: 'Abril' },
  { value: '5',  label: 'Maio' },
  { value: '6',  label: 'Junho' },
  { value: '7',  label: 'Julho' },
  { value: '8',  label: 'Agosto' },
  { value: '9',  label: 'Setembro' },
  { value: '10', label: 'Outubro' },
  { value: '11', label: 'Novembro' },
  { value: '12', label: 'Dezembro' },
];

// ─── Componente ───────────────────────────────────────────────────────────────

export default function GestaoVistaAreas() {
  const mesAtual = new Date().getMonth() + 1;
  // Último mês concluído: em maio → abril; em janeiro → janeiro (mínimo 1)
  const ultimoMesConcluido = mesAtual > 1 ? mesAtual - 1 : 1;

  const [ano, setAno]     = useState(2026);
  const [mes, setMes]     = useState<number | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [openInclusao,    setOpenInclusao]    = useState(true);
  const [openPec,         setOpenPec]         = useState(true);
  const [openOperacional, setOpenOperacional] = useState(true);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mq.matches);
  }, []);

  useEffect(() => {
    if (ano >= 2026 && mes === 1) setMes(null);
  }, [ano, mes]);

  const months = allMonths.filter(m => !(ano >= 2026 && m.value === '1'));

  const params = new URLSearchParams({ ano: String(ano) });
  if (mes !== null) {
    params.set('mes', String(mes));
  } else if (ano >= 2026) {
    // Modo "Todos": busca cumulativo só até o último mês concluído
    params.set('mesAte', String(ultimoMesConcluido));
  }

  const { data: gvData, isLoading } = useQuery<GVData>({
    queryKey: ['gestao-vista', ano, mes, mes === null && ano >= 2026 ? ultimoMesConcluido : undefined],
    queryFn: async () => {
      const r = await fetch(`/api/gestao-vista?${params.toString()}`);
      if (!r.ok) throw new Error('Erro GV');
      return r.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  const gvi  = gvData?.indicadores;
  const inc  = gvData?.inclusaoData;
  const pec  = gvData?.pecData;

  const isMesFuturo   = ano >= 2026 && mes !== null && mes > mesAtual;
  // Em modo "Todos": mesReferencia aponta para o último mês concluído (ex: abril quando estamos em maio)
  const mesReferencia = ano >= 2026 ? (mes !== null ? mes : ultimoMesConcluido) : undefined;

  const lineProps = {
    prefersReducedMotion,
    filtroMes:    ano >= 2026 ? mes : undefined,
    mesReferencia,
    isMesFuturo,
  };

  // ─── Inclusão Produtiva ──
  const incFormados:        Indicador = gvi?.alunosFormados    ?? mk(0, 2000, 'count');
  const incEmpregados:      Indicador = gvi?.pessoasEmpregadas ?? mk(0, 1000, 'count');
  const incEmpreendedores:  Indicador = gvi?.empreendedores    ?? mk(0, 500,  'count');
  const incFrequencia                 = mk(inc?.frequencia ?? 0, 85,  'percent');
  const incEvasao                     = mk(inc?.evasao     ?? 0, 10,  'percent');

  // ─── PEC ──
  const pecCriancas:  Indicador = gvi?.criancasAtendidas ?? mk(0, 500, 'count');
  const pecFrequencia           = mk(pec?.frequenciaMedia ?? 0, 85,  'percent');
  const pecEvasao               = mk(pec?.evasao          ?? 0, 10,  'percent');

  // ─── Operacional ──
  const opHorasAula     = mk((pec?.horasAula ?? 0) + (inc?.horasAula ?? 0), undefined, 'count');
  const opNps:          Indicador = { ...(gvi?.npsCombinado ?? gvi?.nps ?? mk(0, 90, 'count')), tipo: 'score', meta: 90 };
  const opAtendimentos  = mk((gvi?.atendimentos?.valor ?? 0) + (inc?.atendimentos ?? 0) + (pec?.atendimentos ?? 0), undefined, 'count');
  const opRefeicoes     = mk((pec?.alimentacao ?? 0) + (inc?.alimentacao ?? 0), undefined, 'count');
  const opVisitas       = mk(gvi?.visitas?.valor ?? 0, undefined, 'count');

  // ─── Atendidos — responde ao filtro de mês (igual ao Tab Dados Demográficos) ──
  const atdPEC      = gvi?.criancasAtendidas?.valor ?? 0;
  const atdInclusao = gvi?.atendidosInclusao?.valor ?? 0;
  const atdPsico    = gvi?.atendidosPsico?.valor    ?? 0;
  const atdTotal    = atdPEC + atdInclusao + atdPsico;

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <Card className="w-full max-w-2xl mx-auto mt-6">
      <CardHeader>
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-bold">Gestão à Vista {ano}</CardTitle>
            </div>
            <button
              onClick={() => setShowFilters(v => !v)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Abrir filtros"
            >
              <SlidersHorizontal className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col gap-2"
            >
              <Select value={ano.toString()} onValueChange={v => setAno(parseInt(v))}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Ano" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="2026">2026</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={mes === null ? 'null' : mes.toString()}
                onValueChange={v => setMes(v === 'null' ? null : parseInt(v))}
              >
                <SelectTrigger className="w-full"><SelectValue placeholder="Período" /></SelectTrigger>
                <SelectContent>
                  {months.map(m => (
                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </motion.div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pb-6">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="rounded-xl border border-gray-100 p-5 space-y-3">
                <Skeleton className="h-4 w-44" />
                {[1, 2, 3, 4].map(j => (
                  <div key={j} className="space-y-1">
                    <Skeleton className="h-3 w-28" />
                    <Skeleton className="h-8 w-full rounded-full" />
                  </div>
                ))}
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* ── Inclusão Produtiva ───────────────────────────────── */}
            <div className="rounded-xl border border-gray-100 bg-gray-50/50 overflow-hidden">
              <button
                onClick={() => setOpenInclusao(v => !v)}
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-100/60 transition-colors"
              >
                <div className="flex items-center gap-2">
                  
                  <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide">Inclusão Produtiva</h3>
                </div>
                <ChevronDown
                  className="w-4 h-4 text-gray-500 transition-transform duration-200"
                  style={{ transform: openInclusao ? 'rotate(0deg)' : 'rotate(-90deg)' }}
                />
              </button>
              {openInclusao && (
                <div className="px-5 pb-5">
                  <IndicadorLine label="Formados"       indicador={incFormados}       delay={0} {...lineProps} hint="Pessoas formadas pelo Inclusão Produtiva no período." />
                  <IndicadorLine label="Empregados"      indicador={incEmpregados}     delay={1} {...lineProps} hint="Atendidos com vínculo de emprego registrado no período." />
                  <IndicadorLine label="Empreendedores"  indicador={incEmpreendedores} delay={2} {...lineProps} hint="Atendidos que iniciaram um negócio próprio no período." />
                  <IndicadorLine label="Frequência"      indicador={incFrequencia}     delay={3} {...lineProps} hint="Percentual médio de presença nas turmas do Inclusão Produtiva." />
                  <IndicadorLine label="Evasão"          indicador={incEvasao}         delay={4} {...lineProps} inverse hint="Percentual de alunos desligados do Inclusão Produtiva." />
                </div>
              )}
            </div>

            {/* ── Programa de Esporte e Cultura ────────────────────── */}
            <div className="rounded-xl border border-gray-100 bg-gray-50/50 overflow-hidden">
              <button
                onClick={() => setOpenPec(v => !v)}
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-100/60 transition-colors"
              >
                <div className="flex items-center gap-2">
                  
                  <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide">Programa de Esporte e Cultura</h3>
                </div>
                <ChevronDown
                  className="w-4 h-4 text-gray-500 transition-transform duration-200"
                  style={{ transform: openPec ? 'rotate(0deg)' : 'rotate(-90deg)' }}
                />
              </button>
              {openPec && (
                <div className="px-5 pb-5">
                  <IndicadorLine label="Crianças atendidas" indicador={pecCriancas}   delay={0} {...lineProps} semProrateio={ano >= 2026} hint="Total de crianças e adolescentes matriculados e ativos no Programa de Esporte e Cultura" />
                  <IndicadorLine label="Frequência"          indicador={pecFrequencia} delay={1} {...lineProps} hint="Percentual médio de presença nas turmas do Programa de Esporte e Cultura" />
                  <IndicadorLine label="Evasão"              indicador={pecEvasao}     delay={2} {...lineProps} inverse hint="Percentual de alunos desligados do Programa de Esporte e Cultura." />
                </div>
              )}
            </div>

            {/* ── Operacional ──────────────────────────────────────── */}
            <div className="rounded-xl border border-gray-100 bg-gray-50/50 overflow-hidden">
              <button
                onClick={() => setOpenOperacional(v => !v)}
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-100/60 transition-colors"
              >
                <div className="flex items-center gap-2">
                  
                  <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide">Operacional</h3>
                </div>
                <ChevronDown
                  className="w-4 h-4 text-gray-500 transition-transform duration-200"
                  style={{ transform: openOperacional ? 'rotate(0deg)' : 'rotate(-90deg)' }}
                />
              </button>
              {openOperacional && (
                <div className="px-5 pb-5">
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    {[
                      { label: 'Horas aula',   indicador: opHorasAula,    hint: 'Soma de horas-aula realizadas no Programa de Esporte e Cultura e na Inclusão Produtiva' },
                      { label: 'Refeições',    indicador: opRefeicoes,    hint: 'Total de refeições servidas nas atividades do Programa de Esporte e Cultura e Inclusão Produtiva' },
                      { label: 'Atendimentos', indicador: opAtendimentos, hint: 'Total de atendimentos realizados pelo time O Grito.' },
                      { label: 'Visitas',      indicador: opVisitas,      hint: 'Total de visitas realizadas pelo time do O Grito.' },
                    ].map(({ label, indicador, hint }) => (
                      <div key={label} className="rounded-lg border border-gray-100 bg-white px-4 py-3">
                        <div className="flex items-center gap-1 mb-1">
                          <p className="text-sm font-semibold text-gray-700">{label}</p>
                          <HintIcon text={hint} />
                        </div>
                        <p className="text-2xl font-bold text-gray-800">{new Intl.NumberFormat('pt-BR').format(indicador.valor)}</p>
                      </div>
                    ))}

                    {/* ── Atendidos — total de pessoas impactadas ── */}
                    <div className="col-span-2 flex justify-center">
                    <div className="w-1/2 rounded-lg border border-gray-100 bg-white px-4 py-3">
                      <div className="flex items-center gap-1 mb-1">
                        <p className="text-sm font-semibold text-gray-700">Atendidos</p>
                        <HintIcon text="Total de pessoas impactadas pelos programas do Instituto O Grito no período." />
                      </div>
                      <p className="text-2xl font-bold text-gray-800 tabular-nums">{atdTotal.toLocaleString('pt-BR')}</p>
                    </div>
                    </div>
                  </div>
                  <IndicadorLine label="NPS" indicador={opNps} delay={2} {...lineProps} hint="Índice de satisfação dos alunos. Calculado a partir das avaliações de experiência aplicadas ao longo do ano." />
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
