import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Save, Target, Percent, TrendingUp, Users, BookOpen, Home, Activity } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

type Vertente = 'pec' | 'inclusao' | 'psico';

interface IndicadorConfig {
  key: string;
  label: string;
  unidade?: '%' | 'número';
  icon: React.ReactNode;
  descricao?: string;
}

const INDICADORES: Record<Vertente, IndicadorConfig[]> = {
  pec: [
    { key: 'criancasAtendidas', label: 'Crianças Atendidas', unidade: 'número', icon: <Users className="w-4 h-4" /> },
    { key: 'frequencia',        label: 'Frequência',         unidade: '%',      icon: <Percent className="w-4 h-4" />, descricao: 'Meta de presença média (%)' },
    { key: 'evasao',            label: 'Evasão',             unidade: '%',      icon: <TrendingUp className="w-4 h-4" />, descricao: 'Limite máximo de evasão (%)' },
  ],
  inclusao: [
    { key: 'frequencia',    label: 'Frequência',      unidade: '%',      icon: <Percent className="w-4 h-4" />, descricao: 'Meta de presença média (%)' },
    { key: 'evasao',        label: 'Evasão',          unidade: '%',      icon: <TrendingUp className="w-4 h-4" />, descricao: 'Limite máximo de evasão (%)' },
    { key: 'geracaoRenda',  label: 'Geração de Renda', unidade: 'número', icon: <Activity className="w-4 h-4" />, descricao: 'Número de pessoas com geração de renda' },
    { key: 'alunosFormados', label: 'Alunos Formados', unidade: 'número', icon: <BookOpen className="w-4 h-4" />, descricao: 'Meta de alunos formados no ano' },
  ],
  psico: [
    { key: 'atendimentos', label: 'Atendimentos', unidade: 'número', icon: <Activity className="w-4 h-4" /> },
    { key: 'visitas',      label: 'Visitas',      unidade: 'número', icon: <Home className="w-4 h-4" /> },
  ],
};

const VERTENTE_COLOR: Record<Vertente, string> = {
  pec:     'bg-amber-50 border-amber-200',
  inclusao: 'bg-yellow-50 border-yellow-200',
  psico:   'bg-blue-50 border-blue-200',
};

const VERTENTE_ACCENT: Record<Vertente, string> = {
  pec:     'text-amber-700',
  inclusao: 'text-yellow-700',
  psico:   'text-blue-700',
};

const VERTENTE_BTN: Record<Vertente, string> = {
  pec:     'bg-amber-500 hover:bg-amber-600',
  inclusao: 'bg-yellow-500 hover:bg-yellow-600',
  psico:   'bg-blue-500 hover:bg-blue-600',
};

interface Props {
  vertente: Vertente;
  invalidateKeys?: string[][];
}

export default function MetasIndicadoresForm({ vertente, invalidateKeys = [] }: Props) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [ano, setAno] = useState(new Date().getFullYear());
  const [valores, setValores] = useState<Record<string, string>>({});

  const { data, isLoading } = useQuery<{ metas: Record<string, number> }>({
    queryKey: ['/api/metas-indicadores', ano, vertente],
    queryFn: () => apiRequest(`/api/metas-indicadores?ano=${ano}&vertente=${vertente}`),
  });

  useEffect(() => {
    if (data?.metas) {
      const init: Record<string, string> = {};
      for (const [k, v] of Object.entries(data.metas)) {
        init[k] = String(v);
      }
      setValores(init);
    }
  }, [data]);

  const mutation = useMutation({
    mutationFn: (payload: { ano: number; vertente: string; metas: Record<string, number> }) =>
      apiRequest('/api/metas-indicadores', { method: 'POST', body: JSON.stringify(payload) }),
    onSuccess: () => {
      toast({ title: 'Metas salvas!', description: 'As metas foram atualizadas com sucesso.' });
      queryClient.invalidateQueries({ queryKey: ['/api/metas-indicadores'] });
      queryClient.invalidateQueries({ queryKey: ['gestao-vista'] });
      queryClient.invalidateQueries({ queryKey: ['/api/gestao-vista'] });
      for (const key of invalidateKeys) {
        queryClient.invalidateQueries({ queryKey: key });
      }
    },
    onError: (e: any) => {
      toast({ title: 'Erro ao salvar', description: e.message, variant: 'destructive' });
    },
  });

  const handleSave = () => {
    const metas: Record<string, number> = {};
    for (const ind of INDICADORES[vertente]) {
      const v = parseFloat(valores[ind.key] || '0');
      if (!isNaN(v) && v >= 0) metas[ind.key] = v;
    }
    mutation.mutate({ ano, vertente, metas });
  };

  const anos = [2024, 2025, 2026, 2027];

  return (
    <div className="space-y-6">
      {/* Seletor de ano */}
      <div className="flex items-center gap-3">
        <Label className="text-sm font-medium text-gray-700">Ano de referência:</Label>
        <Select value={String(ano)} onValueChange={(v) => setAno(parseInt(v))}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {anos.map(a => (
              <SelectItem key={a} value={String(a)}>{a}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Lista de indicadores */}
      {isLoading ? (
        <div className="space-y-3">
          {INDICADORES[vertente].map(ind => (
            <div key={ind.key} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {INDICADORES[vertente].map(ind => (
            <div
              key={ind.key}
              className={`border rounded-xl p-4 ${VERTENTE_COLOR[vertente]}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className={`flex items-center gap-2 font-semibold mb-1 ${VERTENTE_ACCENT[vertente]}`}>
                    {ind.icon}
                    {ind.label}
                    {ind.unidade === '%' && (
                      <span className="text-xs font-normal text-gray-500 ml-1">em %</span>
                    )}
                  </div>
                  {ind.descricao && (
                    <p className="text-xs text-gray-500">{ind.descricao}</p>
                  )}
                </div>
                <div className="flex flex-col gap-1 min-w-[140px]">
                  <Label className="text-xs text-gray-600 font-medium">Meta {ind.unidade === '%' ? '(%)' : ''}</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      min={0}
                      step={ind.unidade === '%' ? 1 : 10}
                      value={valores[ind.key] ?? ''}
                      onChange={(e) => setValores(prev => ({ ...prev, [ind.key]: e.target.value }))}
                      className="bg-white pr-8 font-semibold"
                      placeholder="0"
                    />
                    {ind.unidade === '%' && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Botão salvar */}
      <div className="flex justify-end pt-2">
        <Button
          onClick={handleSave}
          disabled={mutation.isPending || isLoading}
          className={`${VERTENTE_BTN[vertente]} text-white flex items-center gap-2 px-6`}
        >
          <Save className="w-4 h-4" />
          {mutation.isPending ? 'Salvando...' : 'Salvar Metas'}
        </Button>
      </div>

      {/* Nota informativa */}
      <p className="text-xs text-gray-400 text-center">
        Ao salvar, as metas são atualizadas automaticamente no dashboard, na Gestão à Vista e na tela de impacto dos doadores.
      </p>
    </div>
  );
}
