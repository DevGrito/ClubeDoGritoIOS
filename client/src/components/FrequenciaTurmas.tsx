import { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Users, CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { DateRange } from "react-day-picker";

interface TurmaFreq {
  turmaId: number;
  turmaNome: string;
  totalRegistros: number;
  presentes: number;
  frequencia: number;
  totalAlunos?: number;
}

interface FreqData {
  turmas: TurmaFreq[];
  geral: {
    totalRegistros: number;
    presentes: number;
    frequencia: number;
  };
}

function FreqBar({ pct }: { pct: number }) {
  const color =
    pct >= 75 ? "bg-green-500" : pct >= 50 ? "bg-yellow-400" : "bg-red-500";
  return (
    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all ${color}`}
        style={{ width: `${Math.min(pct, 100)}%` }}
      />
    </div>
  );
}

function freqColor(pct: number) {
  return pct >= 75 ? "text-green-600" : pct >= 50 ? "text-yellow-600" : "text-red-500";
}

function getCurrentWeek(): DateRange {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const from = new Date(now);
  from.setDate(now.getDate() + diffToMonday);
  from.setHours(0, 0, 0, 0);
  const to = new Date(from);
  to.setDate(from.getDate() + 6);
  to.setHours(23, 59, 59, 999);
  return { from, to };
}

function shiftDays(d: Date, days: number): Date {
  const nd = new Date(d);
  nd.setDate(d.getDate() + days);
  return nd;
}

function fmtDate(d: Date) {
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

function toISO(d: Date) {
  return d.toISOString().split("T")[0];
}

function rangeLabel(range: DateRange): string {
  if (!range.from || !range.to) return "Selecionar período";
  const spanDays = Math.round((range.to.getTime() - range.from.getTime()) / 86400000);
  if (spanDays === 6) {
    const curWeek = getCurrentWeek();
    if (toISO(range.from) === toISO(curWeek.from!)) return "Esta semana";
    const lastWeek = { from: shiftDays(curWeek.from!, -7), to: shiftDays(curWeek.to!, -7) };
    if (toISO(range.from) === toISO(lastWeek.from)) return "Semana passada";
  }
  return `${fmtDate(range.from)} – ${fmtDate(range.to)}`;
}

interface Props {
  vertente: "pec" | "inclusao";
  coordenadorId?: string | number | null;
  enabled?: boolean;
}

export default function FrequenciaTurmas({ vertente, coordenadorId, enabled = true }: Props) {
  const [filterMode, setFilterMode] = useState<"all" | "period">("period");
  const [dateRange, setDateRange] = useState<DateRange>(getCurrentWeek);
  const [calOpen, setCalOpen] = useState(false);
  const clickPhase = useRef(0); // 0=ainda não clicou, 1=primeiro clique feito

  const today = new Date();
  today.setHours(23, 59, 59, 999);
  const isAtFuture = dateRange.to && dateRange.to >= today;

  function prevPeriod() {
    if (!dateRange.from || !dateRange.to) return;
    const span = Math.round((dateRange.to.getTime() - dateRange.from.getTime()) / 86400000) + 1;
    setDateRange({ from: shiftDays(dateRange.from, -span), to: shiftDays(dateRange.to, -span) });
  }

  function nextPeriod() {
    if (!dateRange.from || !dateRange.to) return;
    const span = Math.round((dateRange.to.getTime() - dateRange.from.getTime()) / 86400000) + 1;
    setDateRange({ from: shiftDays(dateRange.from, span), to: shiftDays(dateRange.to, span) });
  }

  const buildEndpoint = () => {
    const base = vertente === "pec"
      ? `/api/pec/frequencia-turmas`
      : `/api/inclusao/frequencia-turmas`;
    const params = new URLSearchParams();
    if (coordenadorId) params.set("coordenadorId", String(coordenadorId));
    if (filterMode === "period" && dateRange.from && dateRange.to) {
      params.set("dataInicio", toISO(dateRange.from));
      params.set("dataFim", toISO(dateRange.to));
    }
    const qs = params.toString();
    return qs ? `${base}?${qs}` : base;
  };

  const endpoint = buildEndpoint();

  const { data, isLoading } = useQuery<FreqData>({
    queryKey: [endpoint],
    queryFn: async () => {
      const res = await fetch(endpoint, { credentials: "include" });
      if (!res.ok) return { turmas: [], geral: { totalRegistros: 0, presentes: 0, frequencia: 0 } };
      return res.json();
    },
    enabled,
    staleTime: 60_000,
  });

  const isEmpty = !data || data.turmas.length === 0;

  return (
    <Card className="mb-4 border-l-4 border-l-blue-500">
      <CardHeader className="pb-2 pt-4">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Toggle Período / Geral */}
          <div className="flex rounded-md overflow-hidden border border-gray-200 text-xs">
            <button
              className={`px-2 py-1 transition-colors ${filterMode === "period" ? "bg-blue-500 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}
              onClick={() => { setFilterMode("period"); setDateRange(getCurrentWeek()); }}
            >
              Semanal
            </button>
            <button
              className={`px-2 py-1 transition-colors ${filterMode === "all" ? "bg-blue-500 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}
              onClick={() => setFilterMode("all")}
            >
              Geral
            </button>
          </div>

          {/* Navegação de período */}
          {filterMode === "period" && (
            <div className="flex items-center gap-1">
              <Button size="sm" variant="outline" className="h-7 w-7 p-0" onClick={prevPeriod}>
                <ChevronLeft className="w-3 h-3" />
              </Button>

              {/* Label clicável abre calendário */}
              <Popover
                open={calOpen}
                onOpenChange={(open) => {
                  if (open) {
                    clickPhase.current = 0; // reseta fase ao abrir
                    setCalOpen(true);
                  } else {
                    // só permite fechar se o usuário já completou os 2 cliques
                    if (clickPhase.current < 2) return;
                    setCalOpen(false);
                    clickPhase.current = 0;
                  }
                }}
              >
                <PopoverTrigger asChild>
                  <button className="flex items-center gap-1 text-xs text-gray-600 font-medium px-2 py-1 rounded-md hover:bg-gray-50 border border-gray-200 transition-colors min-w-[130px] justify-center">
                    <CalendarDays className="w-3 h-3 text-blue-400 shrink-0" />
                    {rangeLabel(dateRange)}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="range"
                    selected={dateRange}
                    onSelect={(range) => {
                      if (!range) return;
                      setDateRange(range);
                      clickPhase.current += 1;
                      // só fecha no segundo clique com range completo
                      if (clickPhase.current >= 2 && range.from && range.to) {
                        setCalOpen(false);
                        clickPhase.current = 0;
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              <Button
                size="sm"
                variant="outline"
                className="h-7 w-7 p-0"
                onClick={nextPeriod}
                disabled={!!isAtFuture}
              >
                <ChevronRight className="w-3 h-3" />
              </Button>
            </div>
          )}

          {/* Badge geral — canto direito */}
          {!isLoading && data && data.turmas.length > 0 && (
            <Badge
              className={`ml-auto text-white ${
                data.geral.frequencia >= 75
                  ? "bg-green-500"
                  : data.geral.frequencia >= 50
                  ? "bg-yellow-500"
                  : "bg-red-500"
              }`}
            >
              Geral: {data.geral.frequencia.toFixed(1)}%
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="pb-4">
        {isLoading ? (
          <p className="text-center text-gray-400 text-sm py-4">Calculando frequência das turmas...</p>
        ) : isEmpty ? (
          <p className="text-center text-gray-400 text-sm py-4">
            {filterMode === "period" ? "Sem registros no período selecionado." : "Nenhuma turma com registros."}
          </p>
        ) : (
          <>
            <div className="space-y-3">
              {data!.turmas.map((t) => (
                <div key={t.turmaId}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700 truncate max-w-[60%]">
                      {t.turmaNome}
                    </span>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {t.presentes}/{t.totalRegistros}
                      </span>
                      <span className={`text-sm font-bold ${freqColor(t.frequencia)}`}>
                        {t.frequencia.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <FreqBar pct={t.frequencia} />
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-3">
              {data!.geral.presentes} presenças confirmadas de {data!.geral.totalRegistros} registros totais
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
