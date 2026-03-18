import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, Clock, User, Calendar } from "lucide-react";

function getSemanaAtual() {
  const hoje = new Date();
  const diaSemana = hoje.getDay();
  const seg = new Date(hoje);
  seg.setDate(hoje.getDate() - (diaSemana === 0 ? 6 : diaSemana - 1));
  const dom = new Date(seg);
  dom.setDate(seg.getDate() + 6);
  return {
    inicio: seg.toISOString().slice(0, 10),
    fim: dom.toISOString().slice(0, 10),
  };
}

function formatDate(d: string) {
  if (!d) return '';
  const [y, m, day] = d.split('-');
  return `${day}/${m}/${y}`;
}

export default function AprovacoesSemana() {
  const { toast } = useToast();
  const semana = getSemanaAtual();
  const [semanaInicio, setSemanaInicio] = useState(semana.inicio);
  const [semanaFim, setSemanaFim] = useState(semana.fim);
  const [selecionados, setSelecionados] = useState<number[]>([]);

  const { data, isLoading, refetch } = useQuery<{ pendentes: any[]; semana: any }>({
    queryKey: ['/api/presencas-inclusao/pendentes-aprovacao', semanaInicio, semanaFim],
    queryFn: async () => {
      const res = await fetch(
        `/api/presencas-inclusao/pendentes-aprovacao?semanaInicio=${semanaInicio}&semanaFim=${semanaFim}`,
        { credentials: 'include' }
      );
      if (!res.ok) throw new Error('Erro ao buscar pendentes');
      return res.json();
    },
  });

  const pendentes = data?.pendentes || [];

  const aprovarMutation = useMutation({
    mutationFn: async (ids: number[]) => {
      const res = await fetch('/api/presencas-inclusao/aprovar', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      });
      if (!res.ok) throw new Error('Erro ao aprovar');
      return res.json();
    },
    onSuccess: (_, ids) => {
      toast({ title: `${ids.length} falta${ids.length !== 1 ? 's' : ''} aprovada${ids.length !== 1 ? 's' : ''}!`, description: "Serão contabilizadas nos indicadores." });
      setSelecionados([]);
      queryClient.invalidateQueries({ queryKey: ['/api/presencas-inclusao/pendentes-aprovacao'] });
      refetch();
    },
    onError: () => {
      toast({ title: "Erro ao aprovar", variant: "destructive" });
    },
  });

  function toggleSelecionado(id: number) {
    setSelecionados(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  }

  function toggleTodos() {
    if (selecionados.length === pendentes.length) {
      setSelecionados([]);
    } else {
      setSelecionados(pendentes.map((p: any) => p.id));
    }
  }

  function navegarSemana(dir: number) {
    const inicio = new Date(semanaInicio);
    inicio.setDate(inicio.getDate() + dir * 7);
    const fim = new Date(inicio);
    fim.setDate(inicio.getDate() + 6);
    setSemanaInicio(inicio.toISOString().slice(0, 10));
    setSemanaFim(fim.toISOString().slice(0, 10));
    setSelecionados([]);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-blue-500" />
          Faltas Justificadas — Pendentes de Aprovação
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Navegador de semana */}
        <div className="flex items-center gap-3 flex-wrap">
          <Button variant="outline" size="sm" onClick={() => navegarSemana(-1)}>← Semana anterior</Button>
          <span className="text-sm font-medium text-gray-700">
            <Calendar className="w-4 h-4 inline mr-1 text-gray-400" />
            {formatDate(semanaInicio)} a {formatDate(semanaFim)}
          </span>
          <Button variant="outline" size="sm" onClick={() => navegarSemana(1)}>Próxima semana →</Button>
          <Button variant="outline" size="sm" onClick={() => { setSemanaInicio(semana.inicio); setSemanaFim(semana.fim); setSelecionados([]); }}>
            Semana atual
          </Button>
        </div>

        {/* Ações em lote */}
        {pendentes.length > 0 && (
          <div className="flex items-center gap-3 flex-wrap">
            <Button
              size="sm"
              variant="outline"
              onClick={toggleTodos}
            >
              {selecionados.length === pendentes.length ? 'Desmarcar todos' : 'Selecionar todos'}
            </Button>
            {selecionados.length > 0 && (
              <Button
                size="sm"
                className="bg-green-500 hover:bg-green-600"
                onClick={() => aprovarMutation.mutate(selecionados)}
                disabled={aprovarMutation.isPending}
              >
                <CheckCircle className="w-4 h-4 mr-1" />
                {aprovarMutation.isPending ? 'Aprovando...' : `Aprovar selecionadas (${selecionados.length})`}
              </Button>
            )}
            <Button
              size="sm"
              className="bg-blue-600 hover:bg-blue-700"
              onClick={() => aprovarMutation.mutate(pendentes.map((p: any) => p.id))}
              disabled={aprovarMutation.isPending}
            >
              <CheckCircle className="w-4 h-4 mr-1" />
              {aprovarMutation.isPending ? 'Aprovando...' : 'Aprovar todas da semana'}
            </Button>
          </div>
        )}

        {/* Tabela de pendentes */}
        {isLoading ? (
          <div className="text-sm text-gray-500 py-4 text-center">Carregando...</div>
        ) : pendentes.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <CheckCircle className="w-10 h-10 text-green-400 mx-auto mb-2" />
            <p className="text-sm font-medium">Nenhuma falta justificada pendente esta semana</p>
            <p className="text-xs text-gray-400 mt-1">Tudo em dia! ✅</p>
          </div>
        ) : (
          <div className="space-y-2">
            {pendentes.map((p: any) => (
              <div
                key={p.id}
                className={`border rounded-lg p-3 flex items-start gap-3 transition-colors ${selecionados.includes(p.id) ? 'bg-green-50 border-green-300' : 'bg-white'}`}
              >
                <Checkbox
                  checked={selecionados.includes(p.id)}
                  onCheckedChange={() => toggleSelecionado(p.id)}
                  className="mt-0.5"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm">{p.nome}</span>
                    {p.cpf && <span className="text-xs text-gray-400">CPF: {p.cpf}</span>}
                    {p.turma_nome && (
                      <Badge variant="outline" className="text-xs">{p.turma_nome}</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />{formatDate(p.data)}
                    </span>
                    <Badge className="bg-orange-100 text-orange-700 border-orange-200 text-xs">{p.motivo}</Badge>
                  </div>
                  {p.obs && (
                    <p className="text-xs text-gray-500 mt-1 italic">"{p.obs}"</p>
                  )}
                  <p className="text-xs text-green-600 mt-1 font-medium">✅ Conta como atendimento (aguardando aprovação)</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-green-600 border-green-300 hover:bg-green-50 shrink-0"
                  onClick={() => aprovarMutation.mutate([p.id])}
                  disabled={aprovarMutation.isPending}
                >
                  Aprovar
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
