import { useEffect, useState } from "react";
import { kpiColor, kpiColorInverse } from "@/lib/kpiColors";

/** Ocultar cards Favela 3D sem apagar — mude para `false` para reexibir (Tab Geral + Tab Favela 3D). */
export const FAVELA3D_OCULTAR = {
  visitasDomiciliares: true,
  atendIndividuais: true,
  igf: true,
  grupoMulheres: true,
} as const;

/** Valor fixo de exibição — Tab Geral e Tab Favela 3D (não altera API). */
export const FAMILIAS_FAVELA3D_EXIBICAO = 171;

export type ColetivoMesFavela3D = { registros: number; pessoas: number };

/** Atendimentos coletivos por mês — exibição manual até integração completa. */
export const COLETIVOS_FAVELA3D_EXIBICAO: Record<'gerando_lideranca' | 'assembleia', Record<number, ColetivoMesFavela3D>> = {
  gerando_lideranca: {
    5: { registros: 1, pessoas: 7 },
    6: { registros: 1, pessoas: 4 },
  },
  assembleia: {
    6: { registros: 1, pessoas: 3 },
  },
};

export function coletivosFavela3DNoPeriodo(
  categoria: keyof typeof COLETIVOS_FAVELA3D_EXIBICAO,
  periodo: PeriodoFiltro,
): ColetivoMesFavela3D {
  const porMes = COLETIVOS_FAVELA3D_EXIBICAO[categoria];
  const meses = periodo === 'todos'
    ? Object.keys(porMes).map(Number)
    : periodoMesesLista(periodo);
  return meses.reduce(
    (acc, mes) => {
      const d = porMes[mes];
      if (!d) return acc;
      return { registros: acc.registros + d.registros, pessoas: acc.pessoas + d.pessoas };
    },
    { registros: 0, pessoas: 0 },
  );
}

export const MESES = [
  { value: 'todos', label: 'Todos os Meses' },
  { value: '1', label: 'Janeiro' },
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
  { value: '12', label: 'Dezembro' },
];

/** 'todos' = ano inteiro; number[] = um ou mais meses (1–12) */
export type PeriodoFiltro = 'todos' | number[];

export function isPeriodoTodos(periodo: PeriodoFiltro): boolean {
  return periodo === 'todos';
}

export function isPeriodoMulti(periodo: PeriodoFiltro): boolean {
  return periodo !== 'todos' && periodo.length > 1;
}

export function periodoMesUnico(periodo: PeriodoFiltro): number | null {
  if (periodo === 'todos' || periodo.length !== 1) return null;
  return periodo[0];
}

/** Meses do período (contíguos quando multi — min..max) */
export function periodoMesesLista(periodo: PeriodoFiltro): number[] {
  if (periodo === 'todos') return [];
  if (periodo.length === 1) return [...periodo];
  const min = Math.min(...periodo);
  const max = Math.max(...periodo);
  return Array.from({ length: max - min + 1 }, (_, i) => min + i);
}

export function periodoUltimoMes(periodo: PeriodoFiltro): number {
  if (periodo === 'todos') return 0;
  return Math.max(...periodo);
}

type DoadorHistRow = { mes?: number; ativos?: number; trialing?: number; total_ativos?: number; evadidos?: number };

/** Mês corrente do ano selecionado (1–12). */
export function isMesVigente(ano: string | number, mes: number): boolean {
  const now = new Date();
  return Number(ano) === now.getFullYear() && mes === now.getMonth() + 1;
}

function ativosFromSnapshot(row: DoadorHistRow): number {
  return Number(row.total_ativos ?? 0) || (Number(row.ativos ?? 0) + Number(row.trialing ?? 0));
}

function ativosAoVivo(stripeActive: number, stripeTrialing: number, stripePastDue: number, externos: number): number {
  return stripeActive + stripeTrialing + stripePastDue + externos;
}

/**
 * Ativos (estoque):
 * - mês vigente / "todos os meses" → Stripe ao vivo;
 * - mês passado → snapshot do fim daquele mês.
 */
export function doadoresAtivosNoPeriodo(
  ano: string,
  periodo: PeriodoFiltro,
  histByMes: Record<number, DoadorHistRow>,
  stripeActive: number,
  stripeTrialing: number,
  stripePastDue: number,
  externos: number,
): number {
  const mesUnico = periodoMesUnico(periodo);
  const mesesPeriodo = periodoMesesLista(periodo);

  if (isPeriodoTodos(periodo) || (mesUnico && isMesVigente(ano, mesUnico))) {
    return ativosAoVivo(stripeActive, stripeTrialing, stripePastDue, externos);
  }
  if (isPeriodoMulti(periodo) && mesesPeriodo.length > 0) {
    const lastMes = periodoUltimoMes(periodo);
    if (isMesVigente(ano, lastMes)) {
      return ativosAoVivo(stripeActive, stripeTrialing, stripePastDue, externos);
    }
    const lastAvail = [...mesesPeriodo].reverse().find((m) => histByMes[m]);
    if (lastAvail) return ativosFromSnapshot(histByMes[lastAvail]) + externos;
    return ativosAoVivo(stripeActive, stripeTrialing, stripePastDue, externos);
  }
  if (mesUnico && histByMes[mesUnico]) {
    return ativosFromSnapshot(histByMes[mesUnico]) + externos;
  }
  return ativosAoVivo(stripeActive, stripeTrialing, stripePastDue, externos);
}

function evadidosDeMes(
  mes: number,
  ano: string,
  histByMes: Record<number, DoadorHistRow>,
  evadidosMesVigenteAoVivo: number | null,
): number {
  if (isMesVigente(ano, mes) && evadidosMesVigenteAoVivo != null) {
    return evadidosMesVigenteAoVivo;
  }
  return Number(histByMes[mes]?.evadidos ?? 0);
}

/**
 * Evadidos (fluxo — cancelamentos no mês):
 * - mês vigente → Stripe ao vivo (parcial do mês);
 * - mês passado → snapshot;
 * - "todos os meses" → soma jan…mês atual.
 */
export function doadoresEvadidosNoPeriodo(
  ano: string,
  periodo: PeriodoFiltro,
  histByMes: Record<number, DoadorHistRow>,
  evadidosMesVigenteAoVivo: number | null = null,
): number {
  const mesUnico = periodoMesUnico(periodo);
  const mesesPeriodo = periodoMesesLista(periodo);

  if (isPeriodoMulti(periodo) && mesesPeriodo.length > 0) {
    return mesesPeriodo.reduce(
      (acc, m) => acc + evadidosDeMes(m, ano, histByMes, evadidosMesVigenteAoVivo),
      0,
    );
  }
  if (mesUnico) {
    return evadidosDeMes(mesUnico, ano, histByMes, evadidosMesVigenteAoVivo);
  }
  if (isPeriodoTodos(periodo)) {
    const mesAtual = new Date().getMonth() + 1;
    const mesLimite = Number(ano) === new Date().getFullYear() ? mesAtual : 12;
    let soma = 0;
    for (let m = 1; m <= mesLimite; m++) {
      soma += evadidosDeMes(m, ano, histByMes, evadidosMesVigenteAoVivo);
    }
    return soma;
  }
  return 0;
}

/** Busca evadidos ao vivo no Stripe quando o período inclui o mês corrente. */
export function precisaEvadidosMesVigente(ano: string, periodo: PeriodoFiltro): boolean {
  const mesAtual = new Date().getMonth() + 1;
  if (Number(ano) !== new Date().getFullYear()) return false;
  if (isPeriodoTodos(periodo)) return true;
  if (periodoMesUnico(periodo) === mesAtual) return true;
  return isPeriodoMulti(periodo) && periodoMesesLista(periodo).includes(mesAtual);
}

export function buildQp(ano: string, periodo: PeriodoFiltro): string {
  if (periodo === 'todos') return `?ano=${ano}`;
  if (periodo.length === 1) return `?ano=${ano}&mes=${periodo[0]}`;
  const min = Math.min(...periodo);
  const max = Math.max(...periodo);
  return `?ano=${ano}&mesInicio=${min}&mesFim=${max}`;
}

export function appendPeriodoParams(params: URLSearchParams, periodo: PeriodoFiltro): void {
  if (periodo === 'todos') return;
  if (periodo.length === 1) {
    params.set('mes', String(periodo[0]));
    return;
  }
  params.set('mesInicio', String(Math.min(...periodo)));
  params.set('mesFim', String(Math.max(...periodo)));
}

/** Meses com meta prevista (fev–dez; janeiro sem meta). Divisor anual = 11. */
export const MESES_COM_META = new Set([2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);

/** #EspaçoOGrito: fev–nov (jan e dez sem meta). Divisor anual = 10. */
export const MESES_COM_META_ESPACO_GRITO = new Set([2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);

/** Meses com meta elegíveis até o mês corrente (fev–dez; janeiro = 0). */
export function mesesComMetaAteAgora(): number {
  const mesAtual = new Date().getMonth() + 1;
  return [...MESES_COM_META].filter((m) => m <= mesAtual).length;
}

/** Quantidade de meses elegíveis para prorratear meta (÷11). 0 = só janeiro sem meta no período. */
export function periodoQtdMesesMeta(periodo: PeriodoFiltro): number {
  if (periodo === 'todos') return mesesComMetaAteAgora();
  return periodoMesesLista(periodo).filter((m) => MESES_COM_META.has(m)).length;
}

/** Meta do período: "todos" = acumulado até o mês atual (÷11); mês(s) = proporcional ao período. */
export function metaFnPeriodo(periodo: PeriodoFiltro, anual: number): number {
  const qtd = periodoQtdMesesMeta(periodo);
  if (qtd <= 0) return 0;
  return Math.round(anual * qtd / 11);
}

/** Período sem meta prevista (ex.: só janeiro). */
export function isPeriodoSemMeta(periodo: PeriodoFiltro): boolean {
  return periodoQtdMesesMeta(periodo) === 0;
}

/** Zera meta quando o período não tem meta (janeiro) → UI exibe "—". */
export function metaNoPeriodo(periodo: PeriodoFiltro, meta: number | null | undefined): number {
  if (isPeriodoSemMeta(periodo)) return 0;
  if (meta == null || meta <= 0) return 0;
  return meta;
}

/** Meta de #EspaçoOGrito: 1 por mês elegível no período (meta anual = 10). */
export function metaEspacoGritoPeriodo(periodo: PeriodoFiltro): number {
  if (periodo === 'todos') {
    const mesLimite = new Date().getMonth() + 1;
    return [...MESES_COM_META_ESPACO_GRITO].filter((m) => m <= mesLimite).length;
  }
  return periodoMesesLista(periodo).filter((m) => MESES_COM_META_ESPACO_GRITO.has(m)).length;
}

export function formatMetaValor(meta: number, format: 'number' | 'percent' = 'number'): string {
  if (meta <= 0) return '—';
  const n = Math.round(meta);
  return format === 'percent' ? `${n}%` : n.toLocaleString('pt-BR');
}

const MESES_SHORT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export function periodoLabel(periodo: PeriodoFiltro, ano: string): string {
  if (periodo === 'todos') return String(ano);
  if (periodo.length === 1) return `${MESES_PT[periodo[0] - 1]} de ${ano}`;
  const sorted = [...periodo].sort((a, b) => a - b);
  if (sorted.length <= 3) {
    return `${sorted.map(m => MESES_SHORT[m - 1]).join(', ')} de ${ano}`;
  }
  return `${MESES_SHORT[sorted[0] - 1]}–${MESES_SHORT[sorted[sorted.length - 1] - 1]} de ${ano}`;
}

// Gera automaticamente do 2026 até o ano atual — em 2027 aparece '2027', etc.
// '2025' mantido comentado caso seja necessário reativar
const _anoAtual = new Date().getFullYear();
export const ANOS = Array.from(
  { length: Math.max(1, _anoAtual - 2026 + 1) },
  (_, i) => String(2026 + i)
);

export type GVIndicadores = {
  frequencia?: { valor: number; meta: number };
  evasao?: { valor: number; meta: number };
  criterioSucesso?: { valor: number; meta: number };
  nps?: { valor: number; meta: number };
  npsCombinado?: { valor: number; meta: number };
  alunosFormados?: { valor: number; meta: number };
  alunosEmFormacao?: { valor: number; meta: number };
  criancasAtendidas?: { valor: number; meta: number };
  empreendedores?: { valor: number; meta: number };
  pessoasEmpregadas?: { valor: number; meta: number };
  familiasAtivas?: { valor: number; meta: number };
  visitas?: { valor: number; meta: number };
  atendimentos?: { valor: number; meta: number };
  atendidosInclusao?: { valor: number; meta: number };
};

export type PecMetas = {
  frequencia_meta?: number | null;
  avaliacao_aprendizagem_meta?: number | null;
  evasao_meta?: number | null;
  atendidos_meta?: number | null;
  atendimentos_meta?: number | null;
  hora_aula_meta?: number | null;
  alimentacao_meta?: number | null;
};

export type GestaoVistaData = {
  periodo: { ano: number; tipo: string; mes?: number };
  indicadores: GVIndicadores;
  pecMetas?: PecMetas;
};

export function getPct(valor: number, meta: number): number {
  if (meta <= 0) return 0;
  return Math.round((valor / meta) * 100);
}

export function getColor(valor: number, meta: number, inverse = false): string {
  const pct = getPct(valor, meta);
  return inverse ? kpiColorInverse(pct) : kpiColor(pct);
}

export function getBgColor(valor: number, meta: number, inverse = false): string {
  const color = getColor(valor, meta, inverse);
  return `${color}20`;
}

export const MESES_PT = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

interface KpiItemProps {
  label: string;
  valor: number;
  meta: number;
  unit?: string;
  inverse?: boolean;
  format?: 'number' | 'percent';
  size?: 'sm' | 'md' | 'lg';
  note?: string;
  prorated?: boolean;
  proratedMes?: number;
}

export function KpiItem({ label, valor, meta, unit = '', inverse = false, format = 'number', size = 'md', note, prorated, proratedMes }: KpiItemProps) {
  const mesRef = proratedMes ?? Math.max(0, new Date().getMonth());
  const metaEfetiva = prorated && mesRef > 0 ? Math.round((mesRef / 11) * meta) : (prorated ? 0 : meta);
  const pct = metaEfetiva > 0 ? getPct(valor, metaEfetiva) : 0;
  const color = metaEfetiva > 0 ? getColor(valor, metaEfetiva, inverse) : '#64748b';

  const displayValor = format === 'percent' ? `${valor}%` : `${valor.toLocaleString('pt-BR')}${unit}`;
  const displayMeta = metaEfetiva > 0 ? (format === 'percent' ? `${metaEfetiva}%` : `${metaEfetiva.toLocaleString('pt-BR')}${unit}`) : '—';
  const MESES_SHORT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const proratedNote = prorated && mesRef > 0 && mesRef < 11 ? `Acum. ${MESES_SHORT[mesRef]}: ${metaEfetiva.toLocaleString('pt-BR')} · Anual: ${meta.toLocaleString('pt-BR')}` : null;

  const labelCls = size === 'lg' ? 'text-[11px]' : size === 'sm' ? 'text-[7px]' : 'text-[8px]';
  const pctCls = size === 'lg' ? 'text-[14px]' : size === 'sm' ? 'text-[9px]' : 'text-[11px]';
  const valorCls = size === 'lg' ? 'text-4xl' : size === 'sm' ? 'text-lg' : 'text-2xl';
  const metaCls = size === 'lg' ? 'text-[12px]' : size === 'sm' ? 'text-[8px]' : 'text-[9px]';

  return (
    <div className="flex flex-col justify-between h-full">
      <div className="flex items-start justify-between gap-1">
        <p className={`${labelCls} text-slate-400 uppercase tracking-wide leading-tight`} style={{ hyphens: 'auto', overflowWrap: 'break-word', wordBreak: 'normal' }}>{label}</p>
        <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
          {note && <span className="text-[7px] text-slate-500 leading-tight">{note}</span>}
          <span className={`${pctCls} font-bold tabular-nums leading-tight`} style={{ color }}>{pct}%</span>
        </div>
      </div>
      <div className="flex-1 flex items-center gap-1">
        <span className={`font-bold ${valorCls} tabular-nums leading-none text-white`}>{displayValor}</span>
        <span className={`text-slate-500 ${metaCls} leading-none flex-shrink-0`}>/ {displayMeta}</span>
      </div>
      {proratedNote && size !== 'sm' && <span className="text-[8px] text-slate-500 leading-none truncate block">{proratedNote}</span>}
    </div>
  );
}

interface KpiItemNoMetaProps {
  label: string;
  valor: number;
  unit?: string;
  format?: 'number' | 'percent';
  size?: 'sm' | 'md' | 'lg';
}

export function KpiItemNoMeta({ label, valor, unit = '', format = 'number', size = 'md' }: KpiItemNoMetaProps) {
  const displayValor = format === 'percent' ? `${valor}%` : `${valor.toLocaleString('pt-BR')}${unit}`;
  const labelCls = size === 'lg' ? 'text-[11px]' : size === 'sm' ? 'text-[7px]' : 'text-[8px]';
  const valorCls = size === 'lg' ? 'text-4xl' : size === 'sm' ? 'text-lg' : 'text-2xl';
  return (
    <div className="flex flex-col justify-between h-full">
      <div className="flex items-start justify-between gap-1">
        <p className={`${labelCls} text-slate-400 uppercase tracking-wide leading-tight`} style={{ hyphens: 'auto', overflowWrap: 'break-word', wordBreak: 'normal' }}>{label}</p>
        <span className={`text-[8px] text-slate-500 flex-shrink-0 leading-tight`}>—</span>
      </div>
      <div className="flex-1 flex items-center gap-1">
        <span className={`font-bold ${valorCls} tabular-nums leading-none text-white`}>{displayValor}</span>
      </div>
    </div>
  );
}

export function KpiCard({ children, className = '', style, compact }: { children: React.ReactNode; className?: string; style?: React.CSSProperties; compact?: boolean }) {
  return (
    <div className={`bg-slate-900/60 rounded-lg border border-slate-700/40 flex flex-col ${compact ? 'p-1.5' : 'p-2'} ${className}`} style={style}>
      {children}
    </div>
  );
}

interface SectorCardProps {
  title: string;
  accent: string;
  icon?: string;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  compact?: boolean;
}

export function SectorCard({ title, accent, children, className = '', style, compact }: SectorCardProps) {
  return (
    <div
      className={`bg-slate-800/60 rounded-xl overflow-hidden flex flex-col min-h-0 ${className}`}
      style={{ border: '1px solid rgba(71,85,105,0.35)', ...style }}
    >
      {title && (
        <div className={`border-b border-slate-700/30 flex-shrink-0 ${compact ? 'px-3 py-1' : 'px-4 py-2'}`}>
          <span className="text-[11px] font-semibold tracking-widest uppercase text-white">{title}</span>
        </div>
      )}
      <div className={`flex-1 min-h-0 flex flex-col ${compact ? 'p-1.5' : 'p-2'}`}>
        {children}
      </div>
    </div>
  );
}

export function GaugeCard({ label, valor, meta, inverse = false, size = 'md' }: { label: string; valor: number; meta: number; inverse?: boolean; size?: 'sm' | 'md' | 'lg' }) {
  const pct = Math.min(getPct(valor, meta), 100);
  const color = getColor(valor, meta, inverse);
  const r = 42;
  const circumference = Math.PI * r;
  const [animFilled, setAnimFilled] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setAnimFilled((pct / 100) * circumference), 200);
    return () => clearTimeout(t);
  }, [pct, circumference]);

  const labelSize = size === 'lg' ? '10px' : '8px';
  const pctSize = size === 'lg' ? '13px' : '11px';
  const valFontSz = size === 'lg' ? 24 : 18;
  const metaFontSz = size === 'lg' ? 10 : 8;

  return (
    <div className="bg-slate-900/60 rounded-lg border border-slate-700/40 p-2 flex flex-col h-full">
      <div className="flex items-start justify-between gap-1">
        <p className="text-slate-400 uppercase tracking-wide leading-tight" style={{ fontSize: labelSize, hyphens: 'auto', overflowWrap: 'break-word', wordBreak: 'normal' }}>{label}</p>
        <span className="font-bold tabular-nums flex-shrink-0 leading-tight" style={{ color, fontSize: pctSize }}>{pct}%</span>
      </div>
      <div className="flex-1 min-h-0">
        <svg viewBox="0 0 100 60" className="w-full h-full">
          <path d="M 8 54 A 42 42 0 0 1 92 54" fill="none" stroke="#1e293b" strokeWidth="9" strokeLinecap="round" />
          <path
            d="M 8 54 A 42 42 0 0 1 92 54"
            fill="none"
            stroke={color}
            strokeWidth="9"
            strokeLinecap="round"
            strokeDasharray={`${animFilled} ${circumference}`}
            style={{ transition: 'stroke-dasharray 1s ease' }}
          />
          <text x="50" y="46" textAnchor="middle" fill="white" fontSize={valFontSz} fontWeight="bold" fontFamily="monospace">
            {valor.toLocaleString('pt-BR')}
          </text>
          <text x="50" y="57" textAnchor="middle" fill="#64748b" fontSize={metaFontSz}>
            / {meta.toLocaleString('pt-BR')}
          </text>
        </svg>
      </div>
    </div>
  );
}

export function FrequencyBar({ valor, meta, inverse = false, size = 'md' }: { valor: number; meta: number; inverse?: boolean; size?: 'sm' | 'md' | 'lg' }) {
  const pct = getPct(valor, meta);
  const color = getColor(valor, meta, inverse);
  const [animWidth, setAnimWidth] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setAnimWidth(Math.min(valor, 100)), 200);
    return () => clearTimeout(t);
  }, [valor]);

  const labelCls = size === 'lg' ? 'text-[10px]' : 'text-[8px]';
  const pctCls = size === 'lg' ? 'text-[13px]' : 'text-[11px]';
  const valCls = size === 'lg' ? 'text-4xl' : 'text-2xl';
  const metaCls = size === 'lg' ? 'text-[11px]' : 'text-[9px]';

  return (
    <div className="bg-slate-900/60 rounded-lg border border-slate-700/40 p-2 flex flex-col h-full">
      <div className="flex items-start justify-between gap-1">
        <p className={`${labelCls} text-slate-400 uppercase tracking-wide leading-tight`}>Frequência</p>
        <span className={`${pctCls} font-bold tabular-nums flex-shrink-0`} style={{ color }}>{pct}%</span>
      </div>
      <div className="flex-1 flex flex-col justify-center gap-1.5">
        <div className="flex items-baseline gap-1">
          <span className={`${valCls} font-bold text-white tabular-nums`}>{valor}%</span>
          <span className={`${metaCls} text-slate-500`}>meta {meta}%</span>
        </div>
        <div className="h-2.5 bg-slate-700/60 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-1000"
            style={{ width: `${animWidth}%`, backgroundColor: color }}
          />
        </div>
        <div className="flex justify-between text-[8px] text-slate-500">
          <span>0%</span><span>50%</span><span>100%</span>
        </div>
      </div>
    </div>
  );
}

export function NpsBar({ valor, meta }: { valor: number; meta: number }) {
  const hasMeta = meta > 0;
  const color = hasMeta ? getColor(valor, meta) : '#64748b';
  const pct = hasMeta ? getPct(valor, meta) : 0;
  const [animWidth, setAnimWidth] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setAnimWidth(hasMeta ? Math.min(pct, 100) : 0), 100);
    return () => clearTimeout(t);
  }, [pct, hasMeta]);

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-slate-400 text-[10px] uppercase tracking-wider">NPS</span>
        <div className="flex items-center gap-2">
          <span className="text-white text-lg font-bold tabular-nums leading-none">{valor}</span>
          <span className="text-slate-600 text-[10px]">/ {hasMeta ? meta : '—'}</span>
          {hasMeta && <span className="text-[10px] font-bold" style={{ color }}>{pct}%</span>}
        </div>
      </div>
      {hasMeta && (
        <div className="h-[3px] bg-slate-700/60 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-1000"
            style={{ width: `${animWidth}%`, backgroundColor: color }}
          />
        </div>
      )}
    </div>
  );
}

interface SectorBarProps {
  name: string;
  pct: number;
  accent: string;
}

export function SectorBar({ name, pct, accent }: SectorBarProps) {
  const color = getColor(pct, 100);
  const [animWidth, setAnimWidth] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setAnimWidth(Math.min(pct, 100)), 150);
    return () => clearTimeout(t);
  }, [pct]);

  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <div className="w-2 h-2 rounded-sm flex-shrink-0" style={{ backgroundColor: accent }} />
        <span className="text-slate-200 text-xs font-medium flex-1 truncate">{name}</span>
        <span className="text-xl font-bold tabular-nums leading-none" style={{ color }}>{pct}%</span>
      </div>
      <div className="h-[5px] bg-slate-700/60 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-1000"
          style={{ width: `${animWidth}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-[9px] text-slate-500 mt-0.5 block">alcance da meta</span>
    </div>
  );
}
