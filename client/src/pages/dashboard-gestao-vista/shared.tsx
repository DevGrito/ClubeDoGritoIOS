import { useEffect, useState } from "react";

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

export const ANOS = ['2025', '2026'];

export type GVIndicadores = {
  frequencia?: { valor: number; meta: number };
  evasao?: { valor: number; meta: number };
  criterioSucesso?: { valor: number; meta: number };
  nps?: { valor: number; meta: number };
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
  if (inverse) {
    if (pct <= 80) return '#22c55e';
    if (pct <= 100) return '#eab308';
    return '#ef4444';
  }
  if (pct >= 100) return '#22c55e';
  if (pct >= 80) return '#eab308';
  return '#ef4444';
}

export function getBgColor(valor: number, meta: number, inverse = false): string {
  const color = getColor(valor, meta, inverse);
  return `${color}20`;
}

export const MESES_PT = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

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
  const mesRef = proratedMes ?? (new Date().getMonth() + 1);
  const metaEfetiva = prorated && mesRef < 12 ? Math.round((mesRef / 12) * meta) : meta;
  const pct = getPct(valor, metaEfetiva);
  const color = getColor(valor, metaEfetiva, inverse);

  const displayValor = format === 'percent' ? `${valor}%` : `${valor.toLocaleString('pt-BR')}${unit}`;
  const displayMeta  = format === 'percent' ? `${metaEfetiva}%`  : `${metaEfetiva.toLocaleString('pt-BR')}${unit}`;
  const MESES_SHORT = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
  const proratedNote = prorated && mesRef < 12 ? `Até ${MESES_SHORT[mesRef - 1]}: ${metaEfetiva.toLocaleString('pt-BR')} · Anual: ${meta.toLocaleString('pt-BR')}` : null;

  const labelCls = size === 'lg' ? 'text-[11px]' : size === 'sm' ? 'text-[7px]' : 'text-[8px]';
  const pctCls   = size === 'lg' ? 'text-[14px]' : size === 'sm' ? 'text-[9px]' : 'text-[11px]';
  const valorCls = size === 'lg' ? 'text-4xl'    : size === 'sm' ? 'text-lg'    : 'text-2xl';
  const metaCls  = size === 'lg' ? 'text-[12px]' : size === 'sm' ? 'text-[8px]' : 'text-[9px]';

  return (
    <div className="flex flex-col justify-between h-full">
      <div className="flex items-start justify-between gap-1">
        <p className={`${labelCls} text-slate-400 uppercase tracking-wide leading-tight`} style={{ wordBreak: 'break-word' }}>{label}</p>
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
  const valorCls = size === 'lg' ? 'text-4xl'    : size === 'sm' ? 'text-lg'    : 'text-2xl';
  return (
    <div className="flex flex-col justify-between h-full">
      <div className="flex items-start justify-between gap-1">
        <p className={`${labelCls} text-slate-400 uppercase tracking-wide leading-tight`} style={{ wordBreak: 'break-word' }}>{label}</p>
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

  const labelSize  = size === 'lg' ? '10px' : '8px';
  const pctSize    = size === 'lg' ? '13px' : '11px';
  const valFontSz  = size === 'lg' ? 24 : 18;
  const metaFontSz = size === 'lg' ? 10 : 8;

  return (
    <div className="bg-slate-900/60 rounded-lg border border-slate-700/40 p-2 flex flex-col h-full">
      <div className="flex items-start justify-between gap-1">
        <p className="text-slate-400 uppercase tracking-wide leading-tight" style={{ fontSize: labelSize, wordBreak: 'break-word' }}>{label}</p>
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
  const pctCls   = size === 'lg' ? 'text-[13px]' : 'text-[11px]';
  const valCls   = size === 'lg' ? 'text-4xl' : 'text-2xl';
  const metaCls  = size === 'lg' ? 'text-[11px]' : 'text-[9px]';

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
  const color = getColor(valor, meta);
  const pct = getPct(valor, meta);
  const [animWidth, setAnimWidth] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setAnimWidth(Math.min(pct, 100)), 100);
    return () => clearTimeout(t);
  }, [pct]);

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-slate-400 text-[10px] uppercase tracking-wider">NPS</span>
        <div className="flex items-center gap-2">
          <span className="text-white text-lg font-bold tabular-nums leading-none">{valor}</span>
          <span className="text-slate-600 text-[10px]">/ {meta}</span>
          <span className="text-[10px] font-bold" style={{ color }}>{pct}%</span>
        </div>
      </div>
      <div className="h-[3px] bg-slate-700/60 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-1000"
          style={{ width: `${animWidth}%`, backgroundColor: color }}
        />
      </div>
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
