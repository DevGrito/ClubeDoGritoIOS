/**
 * GestaoKpiCard — componente compartilhado de card de KPI
 * Usado por: TabPEC, TabInclusao (/dashboard/gestao/vista)
 *            e carrosséis de PEC e Inclusão (/administrador)
 *
 * variant="dark"  → fundo escuro (padrão das tabs)
 * variant="light" → fundo branco com barra de progresso (carrosséis do admin)
 */

import { kpiColor, kpiColorInverse } from "@/lib/kpiColors";

function getPct(v: number, m: number, _inv = false): number {
  if (!m) return 0;
  return Math.round(Math.min(v / m * 100, 999));
}

function getColor(v: number, m: number, inv = false): string {
  if (!m) return '#64748b';
  const rawPct = Math.round((v / m) * 100);
  return inv ? kpiColorInverse(rawPct) : kpiColor(rawPct);
}

interface GestaoKpiCardProps {
  label: string;
  valor: number;
  meta?: number | null;
  inverse?: boolean;
  format?: 'number' | 'percent';
  note?: string;
  metaAnual?: number;
  variant?: 'dark' | 'light';
  className?: string;
}

export function GestaoKpiCard({
  label,
  valor,
  meta,
  inverse = false,
  format = 'number',
  note,
  metaAnual,
  variant = 'dark',
  className = '',
}: GestaoKpiCardProps) {
  const hasMeta  = meta != null && meta > 0;
  const pct      = hasMeta ? getPct(valor, meta!, inverse) : null;
  const color    = hasMeta ? getColor(valor, meta!, inverse) : '#64748b';
  const dVal     = format === 'percent' ? `${valor}%` : valor.toLocaleString('pt-BR');
  const dMeta    = hasMeta
    ? (format === 'percent' ? `${meta}%` : meta!.toLocaleString('pt-BR'))
    : null;
  const metaPrefix = inverse ? "<= " : "";

  if (variant === 'light') {
    return (
      <div
        style={{
          width: '152px', flexShrink: 0,
          background: 'white', borderRadius: '12px',
          border: '1px solid #e5e7eb', padding: '12px',
          display: 'flex', flexDirection: 'column',
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)', userSelect: 'none',
        } as React.CSSProperties}
        className={className}
      >
        <p style={{ fontSize: '10px', color: '#111827', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, lineHeight: 1.2, marginBottom: '4px' }}>
          {label}
        </p>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '4px' }}>
          <span style={{ fontSize: '22px', fontWeight: 900, color: '#111827', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
            {dVal}
          </span>
          {dMeta && (
            <span style={{ fontSize: '12px', color: '#6b7280' }}>
              / {metaPrefix}{dMeta}
            </span>
          )}
        </div>
        {pct != null ? (
          <>
            <div style={{ width: '100%', background: '#f3f4f6', borderRadius: '9999px', height: '6px', marginBottom: '4px' }}>
              <div style={{ height: '6px', borderRadius: '9999px', width: `${Math.min(pct, 100)}%`, backgroundColor: color }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              {note
                ? <span style={{ fontSize: '9px', color: '#6b7280' }}>{note}</span>
                : metaAnual
                  ? <span style={{ fontSize: '9px', color: '#6b7280' }}>
                      Meta anual: {format === 'percent' ? `${metaAnual}%` : metaAnual.toLocaleString('pt-BR')}
                    </span>
                  : <span />
              }
              <span style={{ fontSize: '12px', fontWeight: 700, color }}>{pct}%</span>
            </div>
          </>
        ) : (
          <div style={{ flex: 1 }} />
        )}
      </div>
    );
  }

  return (
    <div className={`bg-slate-900/60 rounded-lg border border-slate-700/40 p-3 flex flex-col h-full ${className}`}>
      <p className="text-[11px] text-slate-400 uppercase tracking-widest leading-tight">{label}</p>
      <div className="flex-1 flex items-center gap-2 py-1">
        <span className="text-4xl font-bold text-white tabular-nums leading-none">{dVal}</span>
        {dMeta && (
          <span className="text-[13px] text-slate-500 leading-none">
            / {metaPrefix}{dMeta}
          </span>
        )}
      </div>
      <div className="flex items-end justify-between">
        {note && (
          <div className="flex flex-col">
            {note.split(' · ').map((line, i) => (
              <span key={i} className="text-[10px] text-slate-500 leading-tight">{line}</span>
            ))}
          </div>
        )}
        {hasMeta && pct != null && (
          <span className="text-[14px] font-bold tabular-nums leading-none ml-auto" style={{ color }}>{pct}%</span>
        )}
      </div>
    </div>
  );
}
