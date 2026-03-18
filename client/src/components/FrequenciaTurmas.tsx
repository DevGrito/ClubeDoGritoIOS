import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Users } from "lucide-react";

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
  return pct >= 75
    ? "text-green-600"
    : pct >= 50
    ? "text-yellow-600"
    : "text-red-500";
}

interface Props {
  vertente: "pec" | "inclusao";
  coordenadorId?: string | number | null;
  enabled?: boolean;
}

export default function FrequenciaTurmas({ vertente, coordenadorId, enabled = true }: Props) {
  const endpoint =
    vertente === "pec"
      ? `/api/pec/frequencia-turmas${coordenadorId ? `?coordenadorId=${coordenadorId}` : ""}`
      : `/api/inclusao/frequencia-turmas${coordenadorId ? `?coordenadorId=${coordenadorId}` : ""}`;

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

  if (isLoading)
    return (
      <Card className="mb-4">
        <CardContent className="pt-4 text-center text-gray-400 text-sm py-6">
          Calculando frequência das turmas...
        </CardContent>
      </Card>
    );

  if (!data || data.turmas.length === 0) return null;

  const { turmas, geral } = data;

  return (
    <Card className="mb-4 border-l-4 border-l-blue-500">
      <CardHeader className="pb-2 pt-4">
        <CardTitle className="flex items-center gap-2 text-base">
          <TrendingUp className="w-4 h-4 text-blue-500" />
          Frequência das Turmas
          <Badge
            className={`ml-auto text-white ${
              geral.frequencia >= 75
                ? "bg-green-500"
                : geral.frequencia >= 50
                ? "bg-yellow-500"
                : "bg-red-500"
            }`}
          >
            Geral: {geral.frequencia.toFixed(1)}%
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-4">
        <div className="space-y-3">
          {turmas.map((t) => (
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
          {geral.presentes} presenças confirmadas de {geral.totalRegistros} registros totais
        </p>
      </CardContent>
    </Card>
  );
}
