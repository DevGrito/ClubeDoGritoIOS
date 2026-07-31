import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import { SlidersHorizontal } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export function HintIcon({ text }: { text: string }) {
  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className="inline-flex items-center justify-center w-4 h-4 rounded-full border border-gray-400 text-gray-400 text-[10px] font-bold leading-none hover:border-gray-600 hover:text-gray-600 focus:outline-none flex-shrink-0"
            onClick={e => e.preventDefault()}
          >
            ?
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs text-xs">
          {text}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// ─── METAS TRIMESTRAIS ───────────────────────────────────────────────────────
// Atualizar a cada trimestre conforme combinado
const META_TRIMESTRAL_FORMADOS = 250;  // Meta até março/2026
const META_TRIMESTRAL_RENDA    = 100;  // Meta até março/2026
// ────────────────────────────────────────────────────────────────────────────

export interface Indicador {
  valor: number;
  meta?: number;
  tipo: 'percent' | 'count' | 'score';
  color: 'green' | 'yellow' | 'red' | 'gray' | 'blue';
  progress: number;
}

interface GestaoVistaData {
  periodo: {
    ano: number;
    tipo?: string;
  };
  indicadores: {
    frequencia: Indicador;
    evasao: Indicador;
    criterioSucesso: Indicador;
    nps: Indicador;
    alunosFormados: Indicador;
    alunosEmFormacao: Indicador;
    criancasAtendidas: Indicador;
    empreendedores: Indicador;
    pessoasEmpregadas: Indicador;
    familiasAtivas: Indicador;
    visitas: Indicador;
    atendimentos: Indicador;
  };
}

// Hook para buscar dados da Gestão à Vista 

// Função para mapear cor do backend para classe CSS do Tailwind
function getBarColorClass(color: 'green' | 'yellow' | 'red' | 'gray' | 'blue'): string {
  switch (color) {
    case 'blue':
      return 'bg-blue-500'; // Azul = superou a meta
    case 'green':
      return 'bg-green-500';
    case 'yellow':
      return 'bg-yellow-500';
    case 'red':
      return 'bg-red-500';
    case 'gray':
    default:
      return 'bg-gray-300';
  }
}

// Função para formatar valor
function formatValue(valor: number, tipo: 'percent' | 'count' | 'score'): string {
  if (tipo === 'percent') {
    return new Intl.NumberFormat('pt-BR', {
      style: 'decimal',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    }).format(valor) + '%';
  }
  return new Intl.NumberFormat('pt-BR').format(valor);
}

export const MONTH_NAMES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

// Componente de linha de indicador - v2.0
export interface IndicadorLineProps {
  label: string;
  indicador: Indicador;
  delay?: number;
  prefersReducedMotion?: boolean;
  semestral?: boolean;
  inverse?: boolean;
  mesReferencia?: number;
  filtroMes?: number | null;
  isMesFuturo?: boolean;
  metaTrimestralQ1?: number;
  prorateSemestre?: boolean;
  metaTrimestral?: number;
  semProrateio?: boolean;
  hint?: string;
}

// mesAte: quando definido, pede ao backend dados cumulativos até aquele mês (modo "Todos")
function useGestaoVista(ano: number, mes: number | null, mesAte?: number) {
  return useQuery<GestaoVistaData>({
    queryKey: ['gestao-vista', ano, mes, mesAte],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set('ano', String(ano));
      if (mes !== null) {
        params.set('mes', String(mes));
      } else if (mesAte !== undefined) {
        // modo "Todos" com corte no último mês concluído
        params.set('mesAte', String(mesAte));
      }
      const res = await fetch(`/api/gestao-vista?${params.toString()}`);
      if (!res.ok) throw new Error('Erro ao buscar gestão à vista');
      return (await res.json()) as GestaoVistaData;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function IndicadorLine({ label, indicador, delay = 0, prefersReducedMotion = false, semestral = false, inverse = false, mesReferencia, filtroMes, isMesFuturo = false, prorateSemestre = false, metaTrimestral, semProrateio = false, metaTrimestralQ1, hint }: IndicadorLineProps) {
  // Para mês futuro: força valor zero para exibição
  const valorExibido = isMesFuturo ? 0 : indicador.valor;
  const { valor, meta, tipo, color, progress } = indicador;

  // ── NOVA LÓGICA (quando filtroMes está definido) ──────────────────────────
  const useNovaLogica = filtroMes !== undefined;
  const isJaneiro    = filtroMes === 1;
  const isModoMes    = filtroMes !== null && filtroMes !== undefined && filtroMes !== 1;
  const isModoTodos  = filtroMes === null;

  // ── Meta mensal: meta_anual ÷ 11 (um único mês) ──
  const calcMetaMensal = (_mesFiltro: number): number | undefined => {
    if (!meta || meta <= 0) return undefined;
    if (tipo === 'percent' || tipo === 'score') return meta; // taxa/nota: meta é constante
    return Math.round(meta / 11);
  };

  const metaMensal = isModoMes && filtroMes ? calcMetaMensal(filtroMes) : undefined;

  // ── Meta esperada acumulada até mesReferencia (cor no modo "Todos") ──
  const calcMetaEsperada = (mesRef: number): number | undefined => {
    if (!meta || meta <= 0) return undefined;
    if (tipo === 'percent' || tipo === 'score') return meta;
    const mesesDecorridos = Math.max(0, mesRef - 1);
    if (mesesDecorridos === 0) return undefined;
    return Math.round((meta / 11) * mesesDecorridos);
  };

  const metaEsperadaAgora = mesReferencia ? calcMetaEsperada(mesReferencia) : undefined;

  if (useNovaLogica) {
    const isSemMeta = !meta || meta <= 0;

    // ── Meta customizada trimestral Q1 (geração de renda e alunos formados 2026) ──
    // metaTrimestralQ1 = meta fixa até março (ex: 100 ou 250)
    // Todos → metaCustom = metaTrimestralQ1
    // Fev/Mar (mes ≤ 3) → metaCustom = round(metaTrimestralQ1 / 3)
    // Abr-Dez (mes > 3) → metaCustom = round((meta_anual - metaTrimestralQ1) / 9)
    let metaCustom: number | undefined = undefined;
    if (metaTrimestralQ1 && metaTrimestralQ1 > 0 && meta && meta > 0 && !isMesFuturo && !isJaneiro) {
      if (isModoTodos) {
        metaCustom = metaTrimestralQ1;
      } else if (filtroMes && filtroMes <= 3) {
        metaCustom = Math.round(metaTrimestralQ1 / 3);
      } else if (filtroMes && filtroMes > 3) {
        metaCustom = Math.round((meta - metaTrimestralQ1) / 9);
      }
    }

    // Percentual e progresso da barra
    let percentualDaMeta: number;
    let progressoNaMeta: number;

    // Mês futuro ou janeiro → tudo zerado
    if (isMesFuturo || isJaneiro || isSemMeta) {
      percentualDaMeta = 0;
      progressoNaMeta  = 0;
    } else if (metaCustom && metaCustom > 0) {
      // Trimestral Q1: barra e texto vs meta anual (todos) ou metaCustom (mensal)
      const barBase = isModoTodos && meta && meta > 0 ? meta : metaCustom;
      percentualDaMeta = (valorExibido / barBase) * 100;
      progressoNaMeta  = Math.min(percentualDaMeta, 100);
    } else if (isModoMes && metaMensal && !semProrateio) {
      // mensal com prorateio: usa meta proporcional ao mês
      percentualDaMeta = (valorExibido / metaMensal) * 100;
      progressoNaMeta  = Math.min(percentualDaMeta, 100);
    } else {
      // Todos OU semProrateio: barra mostra progresso em relação à meta anual
      percentualDaMeta = meta! > 0 ? (valorExibido / meta!) * 100 : 0;
      progressoNaMeta  = Math.min(percentualDaMeta, 100);
    }
    const excedeMeta = !semProrateio && !metaCustom && isModoMes && percentualDaMeta > 100;

    // Badge %: para contagem, mostra % vs "meta até o momento" (não vs meta anual)
    // Percentuais (frequência, evasão) ficam iguais ao percentualDaMeta
    const percentualBadge = (() => {
      if (tipo === 'percent' || tipo === 'score') return percentualDaMeta;
      if (isMesFuturo || isJaneiro || isSemMeta) return 0;
      if (metaCustom && metaCustom > 0) {
        // Trimestral Q1: badge vs metaCustom (meta do período vigente)
        return (valorExibido / metaCustom) * 100;
      }
      if (isModoMes && metaMensal && !semProrateio) {
        // Mês: percentualDaMeta já é valorExibido/metaMensal
        return percentualDaMeta;
      }
      if (isModoTodos && !semProrateio && metaEsperadaAgora && metaEsperadaAgora > 0) {
        // Todos: badge vs meta esperada acumulada até o mês atual
        return (valorExibido / metaEsperadaAgora) * 100;
      }
      return percentualDaMeta;
    })();

    // Cor inteligente
    // Para métricas inversas (ex: evasão): quanto MENOR o valor em relação à meta, melhor
    //   0–79% da meta → verde | 80–99% → amarelo | ≥100% → vermelho
    // Para métricas normais: quanto MAIOR, melhor
    //   ≥100% → verde | ≥80% → amarelo | <80% → vermelho
    const colorPct = (pct: number): Indicador['color'] =>
      inverse
        ? (pct < 80 ? 'green' : pct < 100 ? 'yellow' : 'red')
        : (pct >= 100 ? 'green' : pct >= 80 ? 'yellow' : 'red');

    let effectiveColor: Indicador['color'];
    if (isMesFuturo || isJaneiro || isSemMeta) {
      effectiveColor = 'gray';
    } else if (metaCustom && metaCustom > 0) {
      const pctCustom = (valorExibido / metaCustom) * 100;
      effectiveColor = colorPct(pctCustom);
    } else if (isModoMes && metaMensal && !semProrateio) {
      effectiveColor = colorPct(percentualDaMeta);
    } else if (isModoTodos && !semProrateio && metaEsperadaAgora && metaEsperadaAgora > 0) {
      const pctPrevisto = (valorExibido / metaEsperadaAgora) * 100;
      effectiveColor = colorPct(pctPrevisto);
    } else if (meta && meta > 0) {
      effectiveColor = colorPct(percentualDaMeta);
    } else {
      effectiveColor = 'gray';
    }

    const getSolidColorNova = () => {
      switch (effectiveColor) {
        case 'blue':   return '#3b82f6';
        case 'green':  return '#22c55e';
        case 'yellow': return '#eab308';
        case 'red':    return '#ef4444';
        default:       return '#9ca3af';
      }
    };

    // Rótulo de meta exibido — simples: só "Meta: X" (com % para percentuais)
    const fmtMeta = (v: number) =>
      tipo === 'percent'
        ? `${new Intl.NumberFormat('pt-BR').format(v)}%`
        : new Intl.NumberFormat('pt-BR').format(v);

    const labelMetaDireita = () => {
      if (isJaneiro || isSemMeta) return null;
      const metaPrefix = inverse ? "<= " : "";
      const labelMeta = isModoMes ? "Meta Mensal:" : "Meta Anual:";
      // Trimestral Q1: todos → meta anual; mensal → meta proporcional
      if (metaCustom && metaCustom > 0) {
        if (isModoTodos && meta && meta > 0) return <span className="text-xs text-gray-600">Meta Anual: {metaPrefix}{fmtMeta(meta)}</span>;
        if (isModoMes) return <span className="text-xs text-gray-600">Meta Mensal: {metaPrefix}{fmtMeta(metaCustom)}</span>;
      }
      // semProrateio: sempre mostra meta anual
      if (semProrateio && meta && meta > 0) {
        return <span className="text-xs text-gray-600">Meta Anual: {metaPrefix}{fmtMeta(meta)}</span>;
      }
      if (isModoMes && metaMensal) return (
        <span className="text-xs text-gray-600">Meta Mensal: {metaPrefix}{fmtMeta(metaMensal)}</span>
      );
      if (isModoTodos && meta && meta > 0) return (
        <span className="text-xs text-gray-600">Meta Anual: {metaPrefix}{fmtMeta(meta)}</span>
      );
      if (meta && meta > 0) return (
        <span className="text-xs text-gray-600">{labelMeta} {metaPrefix}{fmtMeta(meta)}</span>
      );
      return null;
    };

    const leftLabel = () => {
      const fmt = new Intl.NumberFormat('pt-BR');
      const suffix = tipo === 'percent' ? '%' : '';
      // Percentual/score nunca usa o formato valor/meta — mantém "Realizado: X"
      if (isModoTodos && tipo !== 'percent' && tipo !== 'score') {
        if (semProrateio) {
          // Crianças atendidas: só o número realizado, sem fração
          return <span className="text-xs text-gray-600">{fmt.format(valorExibido)}{suffix}</span>;
        }
        if (metaCustom && metaCustom > 0) {
          // Trimestral Q1 (todos): Realizado / Previsto (meta_trimestral)
          return (
            <span className="text-xs text-gray-600">
              Realizado: {fmt.format(valorExibido)}{suffix} / Previsto: {fmt.format(metaCustom)}{suffix}
            </span>
          );
        }
        // Normal: Realizado / Previsto (meta_esperada_agora)
        const metaParaExibir = metaEsperadaAgora && metaEsperadaAgora > 0 ? metaEsperadaAgora : undefined;
        if (metaParaExibir) {
          return (
            <span className="text-xs text-gray-600">
              Realizado: {fmt.format(valorExibido)}{suffix} / Previsto: {fmt.format(metaParaExibir)}{suffix}
            </span>
          );
        }
      }
      return (
        <span className="text-xs text-gray-600">
          Realizado: {fmt.format(valorExibido)}{suffix}
        </span>
      );
    };

    // ── Sem meta: exibe valor em destaque com badge "Acumulado" ──
    if (isSemMeta) {
      const fmt = new Intl.NumberFormat('pt-BR');
      const suffix = tipo === 'percent' ? '%' : '';
      return (
        <div className="mb-4" role="region" aria-label={`${label}: ${valorExibido}`}>
          <div className="mb-1 flex items-center gap-1">
            <span className="text-sm font-semibold text-gray-700">{label}</span>
            {hint && <HintIcon text={hint} />}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-2xl font-bold text-gray-800">
              {isMesFuturo ? '—' : `${fmt.format(valorExibido)}${suffix}`}
            </span>
            <span className="text-xs font-medium text-gray-500 bg-gray-100 border border-gray-200 rounded-full px-2 py-0.5">
              Acumulado
            </span>
          </div>
        </div>
      );
    }

    return (
      <div className="mb-4" role="region" aria-label={`${label}: ${valorExibido}`}>
        <div className="mb-1 flex items-center gap-1">
          <span className="text-sm font-semibold text-gray-700">{label}</span>
          {hint && <HintIcon text={hint} />}
        </div>
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-2">
            {leftLabel()}

          </div>
          {labelMetaDireita()}
        </div>
        <div className="relative">
          <div className="w-full h-8 bg-gray-200 rounded-full overflow-hidden shadow-inner">
            <motion.div
              className="h-full rounded-full shadow-md"
              initial={{ width: 0 }}
              animate={{ width: excedeMeta ? '100%' : `${progressoNaMeta}%` }}
              transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.8, delay: delay * 0.05, ease: [0.4, 0.0, 0.2, 1] }}
              style={{
                background: excedeMeta ? '#22c55e' : getSolidColorNova()
              }}
            />
          </div>
          {progressoNaMeta > 0 && (
            progressoNaMeta >= 22 ? (
              <div
                className="absolute top-0 bottom-0 pointer-events-none flex items-center justify-center"
                style={{ width: `${Math.min(progressoNaMeta, 100)}%` }}
              >
                <span
                  className="text-xs font-bold text-white whitespace-nowrap"
                  style={{ textShadow: '0 0 4px rgba(0,0,0,0.55)' }}
                >
                  {percentualBadge.toFixed(1)}%
                </span>
              </div>
            ) : (
              <div
                className="absolute top-0 bottom-0 pointer-events-none flex items-center"
                style={{ left: `${Math.min(progressoNaMeta, 100)}%`, paddingLeft: 6 }}
              >
                <span
                  className="text-xs font-bold whitespace-nowrap"
                  style={{ color: getSolidColorNova() }}
                >
                  {percentualBadge.toFixed(1)}%
                </span>
              </div>
            )
          )}
        </div>
        {semestral && (
          <div className="mt-2 px-2 py-1 bg-gray-100 border-l-4 border-gray-400 rounded">
            <p className="text-xs text-gray-600"><span className="font-semibold">Dado semestral:</span> coletado somente duas vezes ao ano</p>
          </div>
        )}
      </div>
    );
  }

  // ── LÓGICA LEGADA (2025 e anteriores) ────────────────────────────────────
  const isSemMeta = tipo === 'count' && !meta && !metaTrimestral;

  // Meta proporcional: mensal ou semestral dependendo do indicador
  const isSemestre1 = mesReferencia ? mesReferencia <= 6 : false;
  const isSemestre2 = mesReferencia ? mesReferencia > 6 : false;

  const useProratedMetaBase =
    tipo === 'count' && meta && meta > 0 && mesReferencia &&
    (prorateSemestre ? (isSemestre1 || isSemestre2) : (mesReferencia >= 1 && mesReferencia < 12));
  const useProratedMeta = metaTrimestral ? true : useProratedMetaBase;

  let metaProporcional: number | undefined = meta;
  let nomePeriodo: string | null = null;

  if (metaTrimestral && metaTrimestral > 0) {
    metaProporcional = metaTrimestral;
    nomePeriodo = 'trimestral';
  } else if (useProratedMetaBase && mesReferencia) {
    if (prorateSemestre) {
      metaProporcional = Math.round(meta! / 2);
      nomePeriodo = isSemestre1 ? '1º Semestre' : '2º Semestre';
    } else {
      metaProporcional = Math.round((meta! / 12) * mesReferencia);
      nomePeriodo = 'até ' + MONTH_NAMES[mesReferencia - 1];
    }
  }

  const metaParaCalculo = useProratedMeta ? metaProporcional : meta;
  const percentualDaMeta = metaParaCalculo && metaParaCalculo > 0 ? (valor / metaParaCalculo) * 100 : progress;
  const excedeMeta = percentualDaMeta > 100;
  const progressoNaMeta = excedeMeta ? 100 : percentualDaMeta;

  const effectiveColor: Indicador['color'] = metaTrimestral
    ? (percentualDaMeta >= 100 ? 'blue' : percentualDaMeta >= 80 ? 'yellow' : 'red')
    : color;

  const getSolidColor = () => {
    switch (effectiveColor) {
      case 'blue':   return '#3b82f6';
      case 'green':  return '#22c55e';
      case 'yellow': return '#eab308';
      case 'red':    return '#ef4444';
      default:       return '#9ca3af';
    }
  };

  const getValorComMeta = () => {
    if (meta && meta > 0) {
      if (tipo === 'count') {
        return `${new Intl.NumberFormat('pt-BR').format(valor)} / ${new Intl.NumberFormat('pt-BR').format(meta)}`;
      } else if (tipo === 'percent') {
        return `${formatValue(valor, tipo)} / ${formatValue(meta, tipo)}`;
      }
    }
    return formatValue(valor, tipo);
  };
  
  return (
    <div className="mb-4" role="region" aria-label={`${label}: ${formatValue(valor, tipo)}`}>
      <div className="mb-1">
        <span className="text-sm font-semibold text-gray-700">{label}</span>
      </div>
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-600">
            Realizado: {new Intl.NumberFormat('pt-BR').format(valor)}{tipo === 'percent' ? '%' : ''}
          </span>

        </div>
        {useProratedMeta && metaProporcional && (
          <div className="text-right">
            <span className="text-xs font-semibold text-gray-700">
              Meta {nomePeriodo}: {new Intl.NumberFormat('pt-BR').format(metaProporcional)}
            </span>
            {meta && (
              <span className="text-xs text-gray-400 ml-1">(Anual: {new Intl.NumberFormat('pt-BR').format(meta)})</span>
            )}
          </div>
        )}
        {!useProratedMeta && meta && meta > 0 && (
          <span className="text-xs text-gray-600">
            Meta: {new Intl.NumberFormat('pt-BR').format(meta)}{tipo === 'percent' ? '%' : ''}
          </span>
        )}
        {isSemMeta && <span className="text-xs text-gray-400">(sem meta)</span>}
      </div>
      <div className="relative w-full h-8">
        {/* barra com overflow-hidden isolado — nunca corta o texto */}
        <div className="absolute inset-0 bg-gray-200 rounded-full overflow-hidden shadow-inner">
          <motion.div
            className="h-full rounded-full shadow-md"
            initial={{ width: 0 }}
            animate={{ width: `${excedeMeta ? 100 : progressoNaMeta}%` }}
            transition={
              prefersReducedMotion
                ? { duration: 0 }
                : {
                    duration: 0.8,
                    delay: delay * 0.05,
                    ease: [0.4, 0.0, 0.2, 1]
                  }
            }
            style={{
              background: excedeMeta
                ? `linear-gradient(to right, #22c55e 0%, #22c55e ${(100 / percentualDaMeta) * 100}%, #3b82f6 ${(100 / percentualDaMeta) * 100}%, #3b82f6 100%)`
                : getSolidColor()
            }}
          />
        </div>
        {/* texto fora do overflow-hidden: nunca é cortado */}
        {progressoNaMeta > 0 && (
          progressoNaMeta >= 22 ? (
            <div
              className="absolute top-0 bottom-0 pointer-events-none flex items-center justify-center"
              style={{ width: `${Math.min(progressoNaMeta, 100)}%` }}
            >
              <span
                className="text-xs font-bold text-white whitespace-nowrap"
                style={{ textShadow: '0 0 4px rgba(0,0,0,0.55)' }}
              >
                {percentualDaMeta.toFixed(1)}%
              </span>
            </div>
          ) : (
            <div
              className="absolute top-0 bottom-0 pointer-events-none flex items-center"
              style={{ left: `${Math.min(progressoNaMeta, 100)}%`, paddingLeft: 6 }}
            >
              <span className="text-xs font-bold whitespace-nowrap" style={{ color: getSolidColor() }}>
                {percentualDaMeta.toFixed(1)}%
              </span>
            </div>
          )
        )}
      </div>
      {semestral && (
        <div className="mt-2 px-2 py-1 bg-gray-100 border-l-4 border-gray-400 rounded">
          <p className="text-xs text-gray-600">
            <span className="font-semibold">Dado semestral:</span> coletado somente duas vezes ao ano
          </p>
        </div>
      )}
    </div>
  );
}

// Props do componente
interface ImpactGestaoVistaProps {
  titulo?: string; // Título customizado (padrão: "Gestão à Vista 2025")
  subtitulo?: string; // Subtítulo customizado (padrão: "Metas Anuais")
  mostrarFiltros?: boolean; // Mostrar botão de filtros (padrão: true)
  mostrarAlunosEmFormacao?: boolean; // Mostrar indicador "Alunos em formação" (apenas para Léo)
}

// Componente principal
export default function ImpactGestaoVista({ 
  titulo,
  subtitulo = "Metas Anuais",
  mostrarFiltros = true,
  mostrarAlunosEmFormacao = false
}: ImpactGestaoVistaProps = {}) {
  const [ano, setAno] = useState(2026); // Padrão 2026 para dados em tempo real
  const [mes, setMes] = useState<number | null>(null);
  const [hasShownError, setHasShownError] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const { toast } = useToast();
  
  const tituloFinal = titulo || `Gestão à Vista ${ano}`;

  // Se mudar para 2026 e o mês selecionado for janeiro (sem meta definida), volta para "Todos"
  useEffect(() => {
    if (ano >= 2026 && mes === 1) setMes(null);
  }, [ano, mes]);

  // Acumulado: mesma regra do dashboard (?ano=), inclui mês corrente.
  // Antes mesAte=mês anterior zerava fluxo do mês atual (ex.: evasão Inclusão só em julho).
  const mesReferenciaAtual = new Date().getMonth() + 1;
  const { data, isLoading, error } = useGestaoVista(ano, mes, undefined);

  const { data: metasInclusao } = useQuery<{ metas: Record<string, number> }>({
    queryKey: ['/api/metas-indicadores', ano, 'inclusao'],
    queryFn: () => fetch(`/api/metas-indicadores?ano=${ano}&vertente=inclusao`).then(r => r.json()),
    staleTime: 60000,
  });

  // true quando o filtro aponta para um mês que ainda não chegou
  const isMesFuturo = ano >= 2026 && mes !== null && mes > mesReferenciaAtual;

  // mesReferencia para calcMetaEsperada: acumulado usa mês corrente
  const mesReferencia = ano >= 2026
    ? (mes !== null ? (mes as number) : mesReferenciaAtual)
    : undefined;

  // Detectar preferência de movimento reduzido
  const prefersReducedMotion = typeof window !== 'undefined' 
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;
  
  // Mostrar erro via toast (apenas uma vez usando useEffect)
  useEffect(() => {
    if (error && !hasShownError) {
      toast({
        title: 'Erro ao carregar dados',
        description: 'Não foi possível carregar os dados de gestão à vista. Tente novamente.',
        variant: 'destructive'
      });
      setHasShownError(true);
    }
    // Reset error flag quando query for bem-sucedida
    if (!error && hasShownError) {
      setHasShownError(false);
    }
  }, [error, hasShownError, toast]);
  
  // Meses — Janeiro oculto em 2026 (sem meta definida)
  // Em 2026, só exibe meses até o mês atual (não mostra meses futuros)
  const allMonths = [
    { value: 'null', label: 'Acumulado' },
    ...(ano < 2026 ? [{ value: '1', label: 'Janeiro' }] : []),
    { value: '2', label: 'Fevereiro' },
    { value: '3', label: 'Março' },
    { value: '4', label: 'Abril' },
    { value: '5', label: 'Maio' },
    { value: '6', label: 'Junho' },
    { value: '7', label: 'Julho' },
    { value: '8', label: 'Agosto' },
    { value: '9', label: 'Setembro' },
    { value: '10', label: 'Outubro' },
    { value: '11', label: 'Novembro' },
    { value: '12', label: 'Dezembro' }
  ];
  const months = allMonths;
  
  return (
    <Card className="w-full max-w-2xl mx-auto mb-6">
      <CardHeader>
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-bold">{tituloFinal}</CardTitle>
              <p className="text-sm text-gray-500 mt-1">{subtitulo}</p>
            </div>
            
            {/* Botão de Filtro Minimalista (só aparece se mostrarFiltros=true) */}
            {mostrarFiltros && (
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                aria-label="Abrir filtros"
                data-testid="toggle-filters"
              >
                <SlidersHorizontal className="w-5 h-5 text-gray-600" />
              </button>
            )}
          </div>
          
          {/* Filtros Colapsáveis */}
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col gap-2"
            >
              {/* Filtro de Ano */}
              <Select
                value={ano.toString()}
                onValueChange={(value) => setAno(parseInt(value))}
              >
                <SelectTrigger className="w-full" data-testid="select-ano">
                  <SelectValue placeholder="Ano" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2026">2026</SelectItem>
                  <SelectItem value="2025">2025</SelectItem>
                </SelectContent>
              </Select>
              {/* Filtro de Mês */}
              <Select
                value={mes === null ? 'null' : mes.toString()}
                onValueChange={(value) => setMes(value === 'null' ? null : parseInt(value))}
              >
                <SelectTrigger className="w-full" data-testid="select-mes">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {months.map((month) => (
                    <SelectItem key={month.value} value={month.value}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </motion.div>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          // Skeleton loading
          <div className="space-y-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i}>
                <div className="flex justify-between mb-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <Skeleton className="h-2 w-full rounded-full" />
              </div>
            ))}
          </div>
        ) : error ? (
          // Estado de erro
          <div className="text-center py-8 text-red-500">
            <p className="font-semibold">Erro ao carregar dados</p>
            <p className="text-sm text-gray-500 mt-2">Tente novamente mais tarde.</p>
          </div>
        ) : data ? (
          // Dados carregados
          <div className="space-y-1">
            <IndicadorLine
              label="Crianças atendidas"
              indicador={data.indicadores.criancasAtendidas}
              delay={0}
              prefersReducedMotion={prefersReducedMotion}
              mesReferencia={mesReferencia}
              filtroMes={ano >= 2026 ? mes : undefined}
              isMesFuturo={ano >= 2026 ? isMesFuturo : false}
              semProrateio={ano >= 2026}
            />
            <IndicadorLine
              label="Alunos formados"
              indicador={data.indicadores.alunosFormados}
              delay={1}
              prefersReducedMotion={prefersReducedMotion}
              mesReferencia={mesReferencia}
              filtroMes={ano >= 2026 ? mes : undefined}
              isMesFuturo={ano >= 2026 ? isMesFuturo : false}
            />
            {mostrarAlunosEmFormacao && (
              <IndicadorLine
                label="Alunos em formação"
                indicador={data.indicadores.alunosEmFormacao}
                delay={2}
                prefersReducedMotion={prefersReducedMotion}
                mesReferencia={mesReferencia}
                filtroMes={ano >= 2026 ? mes : undefined}
              />
            )}
            <IndicadorLine
              label="Frequência geral"
              indicador={data.indicadores.frequencia}
              delay={3}
              prefersReducedMotion={prefersReducedMotion}
              mesReferencia={mesReferencia}
              filtroMes={ano >= 2026 ? mes : undefined}
              isMesFuturo={ano >= 2026 ? isMesFuturo : false}
            />
            {ano < 2026 && (
              <IndicadorLine
                label="Avaliação de aprendizagem"
                indicador={data.indicadores.criterioSucesso}
                delay={4}
                prefersReducedMotion={prefersReducedMotion}
                semestral={true}
              />
            )}
            {ano < 2026 && (
              <IndicadorLine
                label="NPS"
                indicador={data.indicadores.nps}
                delay={5}
                prefersReducedMotion={prefersReducedMotion}
                semestral={true}
              />
            )}
            <IndicadorLine
              label="Evasão"
              indicador={data.indicadores.evasao}
              delay={6}
              prefersReducedMotion={prefersReducedMotion}
              inverse
              mesReferencia={mesReferencia}
              filtroMes={ano >= 2026 ? mes : undefined}
              isMesFuturo={ano >= 2026 ? isMesFuturo : false}
            />
            {(() => {
              const empregados = data.indicadores.pessoasEmpregadas?.valor || 0;
              const empreendedores = data.indicadores.empreendedores?.valor || 0;
              const totalRenda = empregados + empreendedores;
              const metaAnual =
                (metasInclusao?.metas?.pessoasEmpregadas ?? 1000) +
                (metasInclusao?.metas?.empreendedores ?? 500);
              // Para 2026: usa nova lógica /11; para outros anos: usa trimestral
              const pct = ano < 2026 && META_TRIMESTRAL_RENDA > 0 ? (totalRenda / META_TRIMESTRAL_RENDA) * 100 : (metaAnual > 0 ? (totalRenda / metaAnual) * 100 : 0);
              const colorRenda: Indicador['color'] = pct >= 100 ? 'green' : pct >= 80 ? 'yellow' : 'red';
              const geracaoRendaIndicador: Indicador = {
                valor: totalRenda,
                meta: metaAnual,
                tipo: 'count',
                color: colorRenda,
                progress: Math.min(pct, 100),
              };
              return (
                <IndicadorLine
                  label="Geração de renda"
                  indicador={geracaoRendaIndicador}
                  delay={7}
                  prefersReducedMotion={prefersReducedMotion}
                  mesReferencia={mesReferencia}
                  filtroMes={ano >= 2026 ? mes : undefined}
                  isMesFuturo={ano >= 2026 ? isMesFuturo : false}
                />
              );
            })()}
            {ano < 2026 && (
              <IndicadorLine
                label="Famílias Acompanhadas F3D"
                indicador={data.indicadores.familiasAtivas}
                delay={8}
                prefersReducedMotion={prefersReducedMotion}
              />
            )}
            <IndicadorLine
              label="Visitas em domicílio"
              indicador={data.indicadores.visitas}
              delay={9}
              prefersReducedMotion={prefersReducedMotion}
              mesReferencia={mesReferencia}
              filtroMes={ano >= 2026 ? mes : undefined}
              isMesFuturo={ano >= 2026 ? isMesFuturo : false}
            />
            <IndicadorLine
              label="Atendimentos Psicossociais"
              indicador={data.indicadores.atendimentos}
              delay={10}
              prefersReducedMotion={prefersReducedMotion}
              mesReferencia={mesReferencia}
              filtroMes={ano >= 2026 ? mes : undefined}
              isMesFuturo={ano >= 2026 ? isMesFuturo : false}
            />
          </div>
        ) : (
          // Empty state
          <div className="text-center py-8 text-gray-500">
            <p>Sem dados disponíveis para o período selecionado.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
