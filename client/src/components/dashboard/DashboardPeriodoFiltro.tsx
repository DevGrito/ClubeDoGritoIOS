import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import {
  MESES,
  isPeriodoTodos,
  periodoLabel,
  type PeriodoFiltro,
} from "@/pages/dashboard-gestao-vista/shared";

type Variant = "dark" | "light";

interface Props {
  ano: number;
  periodo: PeriodoFiltro;
  onChange: (ano: number, periodo: PeriodoFiltro) => void;
  anos?: number[];
  minAno?: number;
  variant?: Variant;
  className?: string;
}

export default function DashboardPeriodoFiltro({
  ano,
  periodo,
  onChange,
  anos: anosProp,
  minAno = 2025,
  variant = "dark",
  className = "",
}: Props) {
  const [mesesOpen, setMesesOpen] = useState(false);
  const currentYear = new Date().getFullYear();
  const anos =
    anosProp ??
    (() => {
      const list: number[] = [];
      for (let y = currentYear; y >= minAno; y--) list.push(y);
      return list;
    })();

  const isMesFuturo = (mNum: number) => {
    if (ano < currentYear) return false;
    if (ano > currentYear) return true;
    return mNum > new Date().getMonth() + 1;
  };

  useEffect(() => {
    if (periodo === "todos") return;
    const validos = periodo.filter((m) => !isMesFuturo(m));
    if (validos.length !== periodo.length) {
      onChange(ano, validos.length === 0 ? "todos" : validos.sort((a, b) => a - b));
    }
  }, [ano]);

  const toggleMes = (mNum: number) => {
    if (isMesFuturo(mNum)) return;
    const next: PeriodoFiltro =
      periodo === "todos"
        ? [mNum]
        : (() => {
            const has = periodo.includes(mNum);
            const arr = has ? periodo.filter((m) => m !== mNum) : [...periodo, mNum];
            return arr.length === 0 ? "todos" : arr.sort((a, b) => a - b);
          })();
    onChange(ano, next);
  };

  const selectTodosMeses = () => {
    onChange(ano, "todos");
    setMesesOpen(false);
  };

  const label = isPeriodoTodos(periodo) ? "Todos os meses" : periodoLabel(periodo, String(ano));

  const selectCls =
    variant === "dark"
      ? "text-sm border border-slate-600 rounded-lg px-2 py-1.5 bg-slate-800 text-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
      : "text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-300";

  const triggerCls =
    variant === "dark"
      ? `${selectCls} min-w-[120px] max-w-[180px] flex items-center justify-between gap-1`
      : `${selectCls} min-w-[120px] max-w-[180px] flex items-center justify-between gap-1`;

  const popoverCls =
    variant === "dark"
      ? "w-52 p-2 bg-slate-800 border-slate-700"
      : "w-52 p-2 bg-white border-gray-200";

  const todosBtnCls = (ativo: boolean) =>
    variant === "dark"
      ? `w-full text-left text-xs px-2 py-1.5 rounded mb-1 ${ativo ? "bg-orange-500/20 text-orange-400" : "text-slate-300 hover:bg-slate-700"}`
      : `w-full text-left text-xs px-2 py-1.5 rounded mb-1 ${ativo ? "bg-orange-100 text-orange-700" : "text-gray-600 hover:bg-gray-100"}`;

  const rowCls = (futuro: boolean) =>
    variant === "dark"
      ? `flex items-center gap-2 px-2 py-1 rounded text-xs ${futuro ? "opacity-40 cursor-not-allowed" : "cursor-pointer hover:bg-slate-700"}`
      : `flex items-center gap-2 px-2 py-1 rounded text-xs ${futuro ? "opacity-40 cursor-not-allowed" : "cursor-pointer hover:bg-gray-100"}`;

  const textCls = variant === "dark" ? "text-slate-200" : "text-gray-700";
  const dividerCls = variant === "dark" ? "border-slate-700" : "border-gray-200";

  return (
    <div className={`flex items-center gap-2 flex-wrap ${className}`}>
      <select
        value={ano}
        onChange={(e) => onChange(Number(e.target.value), periodo)}
        className={selectCls}
      >
        {anos.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>

      <Popover open={mesesOpen} onOpenChange={setMesesOpen}>
        <PopoverTrigger asChild>
          <button type="button" className={triggerCls}>
            <span className="truncate text-left">{label}</span>
            <ChevronDown className="w-3.5 h-3.5 flex-shrink-0 opacity-70" />
          </button>
        </PopoverTrigger>
        <PopoverContent className={popoverCls} align="end">
          <button type="button" onClick={selectTodosMeses} className={todosBtnCls(isPeriodoTodos(periodo))}>
            Todos os meses
          </button>
          <div className={`border-t my-1 ${dividerCls}`} />
          {MESES.filter((m) => m.value !== "todos").map((m) => {
            const mNum = parseInt(m.value, 10);
            const futuro = isMesFuturo(mNum);
            const checked = periodo !== "todos" && periodo.includes(mNum);
            return (
              <label key={m.value} className={rowCls(futuro)}>
                <Checkbox
                  checked={checked}
                  disabled={futuro}
                  onCheckedChange={() => toggleMes(mNum)}
                  className={
                    variant === "dark"
                      ? "border-slate-500 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
                      : "border-gray-400 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
                  }
                />
                <span className={textCls}>{m.label}</span>
              </label>
            );
          })}
        </PopoverContent>
      </Popover>
    </div>
  );
}
