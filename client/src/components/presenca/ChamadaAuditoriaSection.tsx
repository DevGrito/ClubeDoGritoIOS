import { useMemo, useState } from "react";

import { useQuery } from "@tanstack/react-query";

import { Card, CardContent } from "@/components/ui/card";

import { Badge } from "@/components/ui/badge";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

import {

  Loader2,

  ClipboardList,

  ScanFace,

  Hand,

  ChevronDown,

  ChevronUp,

  Calendar,

} from "lucide-react";

import { cn } from "@/lib/utils";



interface AuditoriaResponse {

  concluidasManuais: Array<{

    id: string;

    data: string;

    motivo?: string | null;

    observacao?: string | null;

    vertente: string;

    turma: string;

    total_presentes?: number | null;

    total_alunos?: number | null;

    origem?: string;

    actor?: string | null;

    created_at?: string;

  }>;

  tablet: Array<{

    id: number;

    data_chamada: string;

    modo: string;

    justificativa?: string | null;

    observacao?: string | null;

    vertente: string;

    turma: string;

    total_presentes?: number | null;

    total_alunos?: number | null;

    tablet_username?: string | null;

    created_at?: string;

  }>;

  totais: {

    chamadasManuaisConcluidas: number;

    tabletFacial: number;

    totalGeral: number;

  };

}



type VertenteFiltro = "ambos" | "pec" | "inclusao";



const VERTENTE_OPCOES: { value: VertenteFiltro; label: string }[] = [

  { value: "ambos", label: "Ambos" },

  { value: "inclusao", label: "Inclusão Produtiva" },

  { value: "pec", label: "PEC" },

];



const NOMES_MESES = [

  "Janeiro",

  "Fevereiro",

  "Março",

  "Abril",

  "Maio",

  "Junho",

  "Julho",

  "Agosto",

  "Setembro",

  "Outubro",

  "Novembro",

  "Dezembro",

];



function buildMonthOptions(): { value: string; label: string; monthIndex: number; year: number }[] {

  const now = new Date();

  const opts: { value: string; label: string; monthIndex: number; year: number }[] = [];

  for (let i = 0; i < 24; i++) {

    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);

    const year = d.getFullYear();

    const monthIndex = d.getMonth();

    const value = `${year}-${String(monthIndex + 1).padStart(2, "0")}`;

    opts.push({

      value,

      label: `${NOMES_MESES[monthIndex]} ${year}`,

      monthIndex,

      year,

    });

  }

  return opts;

}



function fmtData(iso: string) {

  try {

    return new Date(iso.includes("T") ? iso : `${iso}T12:00:00`).toLocaleDateString("pt-BR");

  } catch {

    return iso;

  }

}



function labelOrigem(origem?: string) {

  const o = String(origem || "").toLowerCase();

  if (o === "tablet") return "Tablet";

  if (o === "monitor") return "Monitor";

  if (o === "coordenador") return "Coordenador";

  if (o === "professor") return "Professor";

  return origem ? origem.charAt(0).toUpperCase() + origem.slice(1) : "Staff";

}



function MonthCircle({ selected }: { selected: boolean }) {

  return (

    <span

      className={cn(

        "w-3.5 h-3.5 rounded-full border-2 shrink-0 flex items-center justify-center",

        selected ? "border-yellow-500 bg-yellow-400" : "border-gray-300 bg-white"

      )}

    />

  );

}



function VertenteBadge({ vertente }: { vertente: string }) {

  const v = vertente.toLowerCase();

  if (v.includes("pec")) {

    return <Badge className="bg-orange-100 text-orange-800 border-orange-200 text-xs">PEC</Badge>;

  }

  if (v.includes("inclusão") || v.includes("inclusao")) {

    return <Badge className="bg-cyan-100 text-cyan-800 border-cyan-200 text-xs">Inclusão Produtiva</Badge>;

  }

  return (

    <Badge variant="outline" className="text-xs text-gray-600">

      {vertente}

    </Badge>

  );

}



function AuditoriaCard({

  id,

  data,

  turma,

  vertente,

  subtitulo,

  expandido,

  onToggle,

  children,

}: {

  id: string | number;

  data: string;

  turma: string;

  vertente: string;

  subtitulo: React.ReactNode;

  expandido: boolean;

  onToggle: () => void;

  children?: React.ReactNode;

}) {

  return (

    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">

      <div

        className="p-3 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"

        onClick={onToggle}

        role="button"

        tabIndex={0}

        onKeyDown={(e) => e.key === "Enter" && onToggle()}

      >

        <div className="flex items-center justify-between gap-2 mb-1.5">

          <div className="flex items-center gap-2 min-w-0 flex-1">

            <Calendar className="w-4 h-4 text-gray-500 shrink-0" />

            <span className="font-semibold text-sm text-gray-900 shrink-0">{fmtData(data)}</span>

            <span className="text-gray-400 text-sm shrink-0">—</span>

            <span className="text-sm text-gray-800 truncate font-medium">{turma}</span>

          </div>

          <div className="flex items-center gap-2 shrink-0">

            <VertenteBadge vertente={vertente} />

            {expandido ? (

              <ChevronUp className="w-4 h-4 text-gray-500" />

            ) : (

              <ChevronDown className="w-4 h-4 text-gray-500" />

            )}

          </div>

        </div>

        <div className="flex items-center gap-2 flex-wrap pl-6">{subtitulo}</div>

      </div>

      {expandido && children && (

        <div className="p-4 border-t border-gray-100 bg-white text-sm space-y-2">{children}</div>

      )}

    </div>

  );

}



export default function ChamadaAuditoriaSection() {

  const monthOptions = useMemo(() => buildMonthOptions(), []);

  const now = useMemo(() => new Date(), []);

  const [mesesSel, setMesesSel] = useState<string[]>([]);

  const [filtroAtivo, setFiltroAtivo] = useState(false);

  const [filtroOpen, setFiltroOpen] = useState(false);

  const [vertenteFiltro, setVertenteFiltro] = useState<VertenteFiltro>("ambos");

  const [vertenteOpen, setVertenteOpen] = useState(false);

  const [expandido, setExpandido] = useState<string | number | null>(null);



  const queryKey = [

    "/api/admin/chamadas-auditoria",

    filtroAtivo ? mesesSel.join(",") : "all",

    vertenteFiltro,

  ];



  const { data, isLoading, isFetching } = useQuery<AuditoriaResponse>({

    queryKey,

    queryFn: async () => {

      const params = new URLSearchParams();

      if (filtroAtivo && mesesSel.length > 0) {

        params.set("meses", mesesSel.join(","));

      }

      if (vertenteFiltro !== "ambos") {

        params.set("vertente", vertenteFiltro);

      }

      const qs = params.toString() ? `?${params.toString()}` : "";

      const res = await fetch(`/api/admin/chamadas-auditoria${qs}`, {

        credentials: "include",

        cache: "no-store",

      });

      if (!res.ok) throw new Error("Erro ao carregar auditoria");

      return res.json();

    },

    staleTime: 0,

  });



  const anosNoFiltro = useMemo(() => {

    const anos = new Set(monthOptions.map((m) => m.year));

    return Array.from(anos).sort((a, b) => b - a);

  }, [monthOptions]);



  const isMesFuturo = (year: number, monthIndex: number) => {

    if (year > now.getFullYear()) return true;

    if (year === now.getFullYear() && monthIndex > now.getMonth()) return true;

    return false;

  };



  const toggleMes = (value: string) => {

    setFiltroAtivo(true);

    setMesesSel((prev) =>

      prev.includes(value) ? prev.filter((m) => m !== value) : [...prev, value]

    );

  };



  const selecionarTodos = () => {

    setMesesSel([]);

    setFiltroAtivo(false);

    setFiltroOpen(false);

  };



  const labelFiltro =

    !filtroAtivo || mesesSel.length === 0

      ? "Todos os Meses"

      : mesesSel.length === 1

        ? monthOptions.find((m) => m.value === mesesSel[0])?.label || "1 mês"

        : `${mesesSel.length} meses selecionados`;



  const labelVertente =

    VERTENTE_OPCOES.find((v) => v.value === vertenteFiltro)?.label || "Ambos";



  return (

    <div className="space-y-6">

      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">

        <div>

          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">

            <ClipboardList className="w-5 h-5" />

            Auditoria de Chamadas

          </h2>

          <p className="text-sm text-gray-500 mt-1">

            Chamadas manuais concluídas (tablet, monitor e coordenador) e chamadas faciais via tablet.

          </p>

        </div>



        <div className="flex flex-wrap items-center gap-2 justify-end">

          <Popover open={vertenteOpen} onOpenChange={setVertenteOpen}>

            <PopoverTrigger asChild>

              <button

                type="button"

                className="flex items-center justify-between gap-3 min-w-[200px] px-4 py-2.5 rounded-lg border border-gray-200 bg-white text-gray-900 text-sm font-medium shadow-sm hover:bg-gray-50 transition-colors"

              >

                <span>{labelVertente}</span>

                <ChevronDown className="w-4 h-4 text-gray-500 shrink-0" />

              </button>

            </PopoverTrigger>

            <PopoverContent

              align="end"

              className="w-[220px] p-0 bg-white border border-gray-200 shadow-lg rounded-lg overflow-hidden"

            >

              {VERTENTE_OPCOES.map((opt) => (

                <button

                  key={opt.value}

                  type="button"

                  onClick={() => {

                    setVertenteFiltro(opt.value);

                    setVertenteOpen(false);

                  }}

                  className={cn(

                    "w-full flex items-center gap-3 px-4 py-3 text-sm text-left transition-colors border-b border-gray-100 last:border-b-0",

                    vertenteFiltro === opt.value

                      ? "bg-yellow-50 text-yellow-800 font-medium"

                      : "text-gray-800 hover:bg-gray-50"

                  )}

                >

                  <MonthCircle selected={vertenteFiltro === opt.value} />

                  {opt.label}

                </button>

              ))}

            </PopoverContent>

          </Popover>



          <Popover open={filtroOpen} onOpenChange={setFiltroOpen}>

            <PopoverTrigger asChild>

              <button

                type="button"

                className="flex items-center justify-between gap-3 min-w-[220px] px-4 py-2.5 rounded-lg border border-gray-200 bg-white text-gray-900 text-sm font-medium shadow-sm hover:bg-gray-50 transition-colors"

              >

                <span>{labelFiltro}</span>

                <ChevronDown className="w-4 h-4 text-gray-500 shrink-0" />

              </button>

            </PopoverTrigger>

            <PopoverContent

              align="end"

              className="w-[240px] p-0 bg-white border border-gray-200 shadow-lg rounded-lg overflow-hidden"

            >

              <button

                type="button"

                onClick={selecionarTodos}

                className={cn(

                  "w-full flex items-center gap-3 px-4 py-3 text-sm text-left transition-colors border-b border-gray-100",

                  !filtroAtivo || mesesSel.length === 0

                    ? "bg-yellow-50 text-yellow-800 font-medium"

                    : "text-gray-800 hover:bg-gray-50"

                )}

              >

                <MonthCircle selected={!filtroAtivo || mesesSel.length === 0} />

                Todos os Meses

              </button>

              <div className="max-h-[280px] overflow-y-auto py-1">

                {anosNoFiltro.map((ano) => (

                  <div key={ano}>

                    <p className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-400">

                      {ano}

                    </p>

                    {monthOptions

                      .filter((m) => m.year === ano)

                      .map((m) => {

                        const futuro = isMesFuturo(m.year, m.monthIndex);

                        const selected = mesesSel.includes(m.value);

                        return (

                          <button

                            key={m.value}

                            type="button"

                            disabled={futuro}

                            onClick={() => !futuro && toggleMes(m.value)}

                            className={cn(

                              "w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors",

                              futuro

                                ? "text-gray-300 cursor-not-allowed"

                                : selected

                                  ? "bg-yellow-50 text-yellow-900"

                                  : "text-gray-700 hover:bg-gray-50"

                            )}

                          >

                            <MonthCircle selected={selected} />

                            {NOMES_MESES[m.monthIndex]}

                          </button>

                        );

                      })}

                  </div>

                ))}

              </div>

            </PopoverContent>

          </Popover>

        </div>

      </div>



      {isLoading || isFetching ? (

        <div className="flex justify-center py-12">

          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />

        </div>

      ) : data ? (

        <>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">

            <Card>

              <CardContent className="pt-4">

                <p className="text-xs text-gray-500 flex items-center gap-1">

                  <Hand className="w-3 h-3" /> Manuais concluídas

                </p>

                <p className="text-2xl font-bold">{data.totais.chamadasManuaisConcluidas}</p>

              </CardContent>

            </Card>

            <Card>

              <CardContent className="pt-4">

                <p className="text-xs text-gray-500 flex items-center gap-1">

                  <ScanFace className="w-3 h-3" /> Tablet facial

                </p>

                <p className="text-2xl font-bold">{data.totais.tabletFacial}</p>

              </CardContent>

            </Card>

            <Card>

              <CardContent className="pt-4">

                <p className="text-xs text-gray-500">Total de chamadas</p>

                <p className="text-2xl font-bold">{data.totais.totalGeral}</p>

              </CardContent>

            </Card>

          </div>



          <div>

            <h3 className="text-base font-semibold text-gray-900 mb-3">

              Chamadas manuais concluídas

            </h3>

            {data.concluidasManuais.length === 0 ? (

              <div className="text-center py-10 text-gray-500 border border-dashed border-gray-200 rounded-lg bg-gray-50">

                <Calendar className="w-10 h-10 mx-auto mb-2 text-gray-300" />

                <p className="text-sm">Nenhum registro encontrado.</p>

              </div>

            ) : (

              <div className="space-y-3">

                {data.concluidasManuais.map((r) => {

                  const key = `m-${r.id}`;

                  const aberto = expandido === key;

                  return (

                    <AuditoriaCard

                      key={key}

                      id={key}

                      data={r.data}

                      turma={r.turma}

                      vertente={r.vertente}

                      expandido={aberto}

                      onToggle={() => setExpandido(aberto ? null : key)}

                      subtitulo={

                        <>

                          <span className="text-sm text-green-600 font-medium">

                            {r.total_presentes ?? 0}/{r.total_alunos ?? 0} presentes

                          </span>

                          <Badge

                            variant="outline"

                            className="text-xs border-amber-300 text-amber-800 bg-amber-50"

                          >

                            <Hand className="w-3 h-3 mr-1" />

                            Chamada manual concluída

                          </Badge>

                          <Badge variant="secondary" className="text-xs">

                            {labelOrigem(r.origem)}

                          </Badge>

                          {r.actor && (

                            <span className="text-xs text-gray-500">· {r.actor}</span>

                          )}

                        </>

                      }

                    >

                      {r.motivo && (

                        <div>

                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">

                            Justificativa

                          </p>

                          <p className="text-gray-800">{r.motivo}</p>

                        </div>

                      )}

                      {r.observacao && (

                        <div>

                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">

                            Observação

                          </p>

                          <p className="text-gray-700">{r.observacao}</p>

                        </div>

                      )}

                    </AuditoriaCard>

                  );

                })}

              </div>

            )}

          </div>



          <div>

            <h3 className="text-base font-semibold text-gray-900 mb-3">

              Chamadas via tablet (facial)

            </h3>

            {data.tablet.length === 0 ? (

              <div className="text-center py-10 text-gray-500 border border-dashed border-gray-200 rounded-lg bg-gray-50">

                <ScanFace className="w-10 h-10 mx-auto mb-2 text-gray-300" />

                <p className="text-sm">Nenhum registro encontrado.</p>

              </div>

            ) : (

              <div className="space-y-3">

                {data.tablet.map((r) => {

                  const key = `t-${r.id}`;

                  const aberto = expandido === key;

                  return (

                    <AuditoriaCard

                      key={key}

                      id={key}

                      data={r.data_chamada}

                      turma={r.turma}

                      vertente={r.vertente}

                      expandido={aberto}

                      onToggle={() => setExpandido(aberto ? null : key)}

                      subtitulo={

                        <>

                          <span className="text-sm text-green-600 font-medium">

                            {r.total_presentes ?? 0}/{r.total_alunos ?? 0} presentes

                          </span>

                          <Badge variant="default" className="text-xs">

                            <ScanFace className="w-3 h-3 mr-1" /> Facial

                          </Badge>

                          {r.tablet_username && (

                            <span className="text-xs text-gray-500">· {r.tablet_username}</span>

                          )}

                        </>

                      }

                    >

                      {r.justificativa && (

                        <div>

                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">

                            Justificativa

                          </p>

                          <p className="text-gray-800">{r.justificativa}</p>

                        </div>

                      )}

                      {r.observacao && (

                        <div>

                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">

                            Observação

                          </p>

                          <p className="text-gray-700">{r.observacao}</p>

                        </div>

                      )}

                    </AuditoriaCard>

                  );

                })}

              </div>

            )}

          </div>

        </>

      ) : null}

    </div>

  );

}

