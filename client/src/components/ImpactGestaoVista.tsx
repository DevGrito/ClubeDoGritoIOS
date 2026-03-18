import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import { SlidersHorizontal } from 'lucide-react';

interface Indicador {
  valor: number;
  meta?: number;
  tipo: 'percent' | 'count';
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
function formatValue(valor: number, tipo: 'percent' | 'count'): string {
  if (tipo === 'percent') {
    return new Intl.NumberFormat('pt-BR', {
      style: 'decimal',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    }).format(valor) + '%';
  }
  return new Intl.NumberFormat('pt-BR').format(valor);
}

const MONTH_NAMES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

// Componente de linha de indicador - v2.0
interface IndicadorLineProps {
  label: string;
  indicador: Indicador;
  delay?: number;
  prefersReducedMotion?: boolean;
  semestral?: boolean;
  inverse?: boolean;
  mesReferencia?: number; // mês atual (1-12) para cálculo de meta proporcional
  prorateSemestre?: boolean; // quando true: usa meta semestral (meta/2) em vez de mensal
}

function useGestaoVista(ano: number, mes: number | null) {
  return useQuery<GestaoVistaData>({
    // chave muda quando o mês muda → react-query refaz o fetch
    queryKey: ['gestao-vista', ano, mes],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set('ano', String(ano));
      if (mes !== null) {
        params.set('mes', String(mes)); // se tiver mês, manda pro backend
      }

      const res = await fetch(`/api/gestao-vista?${params.toString()}`);
      if (!res.ok) throw new Error('Erro ao buscar gestão à vista');
      return (await res.json()) as GestaoVistaData;
    },
    staleTime: 5 * 60 * 1000,
  });
}

function IndicadorLine({ label, indicador, delay = 0, prefersReducedMotion = false, semestral = false, inverse = false, mesReferencia, prorateSemestre = false }: IndicadorLineProps) {
  const { valor, meta, tipo, color, progress } = indicador;
  const isSemMeta = tipo === 'count' && !meta;

  // Meta proporcional: mensal ou semestral dependendo do indicador
  const isSemestre1 = mesReferencia ? mesReferencia <= 6 : false;
  const isSemestre2 = mesReferencia ? mesReferencia > 6 : false;

  // Modo semestral: usa meta/2 (para indicadores com meta por semestre)
  const useProratedMeta =
    tipo === 'count' && meta && meta > 0 && mesReferencia &&
    (prorateSemestre ? (isSemestre1 || isSemestre2) : (mesReferencia >= 1 && mesReferencia < 12));

  let metaProporcional: number | undefined = meta;
  let nomePeriodo: string | null = null;
  if (useProratedMeta && mesReferencia) {
    if (prorateSemestre) {
      metaProporcional = Math.round(meta! / 2);
      nomePeriodo = isSemestre1 ? '1º Semestre' : '2º Semestre';
    } else {
      metaProporcional = Math.round((meta! / 12) * mesReferencia);
      nomePeriodo = 'até ' + MONTH_NAMES[mesReferencia - 1];
    }
  }
  const nomeMes = mesReferencia ? MONTH_NAMES[mesReferencia - 1] : null;

  // Calcular percentual em relação à meta (proporcional para count, anual para percent)
  const metaParaCalculo = useProratedMeta ? metaProporcional : meta;
  const percentualDaMeta = metaParaCalculo && metaParaCalculo > 0 ? (valor / metaParaCalculo) * 100 : progress;
  const excedeMeta = percentualDaMeta > 100;

  // Calcular as partes da barra
  const progressoNaMeta = excedeMeta ? 100 : percentualDaMeta;
  const excessoAlemDaMeta = excedeMeta ? Math.min(percentualDaMeta - 100, 100) : 0;
  
  // Cores SÓLIDAS baseadas no status (SEM GRADIENTES)
  const getSolidColor = () => {
    switch (color) {
      case 'blue':
        return '#3b82f6'; // Azul sólido
      case 'green':
        return '#22c55e'; // Verde sólido
      case 'yellow':
        return '#eab308'; // Amarelo sólido
      case 'red':
        return '#ef4444'; // Vermelho sólido
      default:
        return '#9ca3af'; // Cinza sólido
    }
  };
  
  // Formatar valor com meta (para contagem E percentual)
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
          {inverse && (
            <span className="text-xs text-gray-400 italic">↓ Quanto menor, melhor</span>
          )}
        </div>
        {useProratedMeta && metaProporcional && (
          <div className="text-right">
            <span className="text-xs font-semibold text-gray-700">
              Meta {nomePeriodo}: {new Intl.NumberFormat('pt-BR').format(metaProporcional)}
            </span>
            <span className="text-xs text-gray-400 ml-1">(Anual: {new Intl.NumberFormat('pt-BR').format(meta!)})</span>
          </div>
        )}
        {!useProratedMeta && meta && meta > 0 && (
          <span className="text-xs text-gray-600">
            Meta: {new Intl.NumberFormat('pt-BR').format(meta)}{tipo === 'percent' ? '%' : ''}
          </span>
        )}
        {isSemMeta && <span className="text-xs text-gray-400">(sem meta)</span>}
      </div>
      <div className="w-full h-8 bg-gray-200 rounded-full overflow-hidden relative shadow-inner">
        <motion.div
          className="h-full rounded-full shadow-md flex items-center justify-center"
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
        >
          {progressoNaMeta > 10 && (
            <span className="text-xs font-bold text-white">
              {percentualDaMeta.toFixed(1)}%
            </span>
          )}
        </motion.div>
        {progressoNaMeta <= 10 && progressoNaMeta > 0 && (
          <div className="absolute left-2 top-1/2 -translate-y-1/2 text-xs font-bold text-white">
            {percentualDaMeta.toFixed(1)}%
          </div>
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
  
  const { data, isLoading, error } = useGestaoVista(ano, mes);

  const { data: metasInclusao } = useQuery<{ metas: Record<string, number> }>({
    queryKey: ['/api/metas-indicadores', ano, 'inclusao'],
    queryFn: () => fetch(`/api/metas-indicadores?ano=${ano}&vertente=inclusao`).then(r => r.json()),
    staleTime: 60000,
  });

  // Mês de referência para meta proporcional: mês selecionado ou mês atual
  const mesReferencia = mes ?? (new Date().getMonth() + 1);

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
  
  // Meses
  const months = [
    { value: 'null', label: 'Todos' },
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
    { value: '12', label: 'Dezembro' }
  ];
  
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
            />
            <IndicadorLine
              label="Alunos formados"
              indicador={data.indicadores.alunosFormados}
              delay={1}
              prefersReducedMotion={prefersReducedMotion}
              mesReferencia={mesReferencia}
            />
            {mostrarAlunosEmFormacao && (
              <IndicadorLine
                label="Alunos em formação"
                indicador={data.indicadores.alunosEmFormacao}
                delay={2}
                prefersReducedMotion={prefersReducedMotion}
                mesReferencia={mesReferencia}
              />
            )}
            <IndicadorLine
              label="Frequência geral"
              indicador={data.indicadores.frequencia}
              delay={3}
              prefersReducedMotion={prefersReducedMotion}
              mesReferencia={mesReferencia}
            />
            {ano !== 2026 && (
              <IndicadorLine
                label="Avaliação de aprendizagem"
                indicador={data.indicadores.criterioSucesso}
                delay={4}
                prefersReducedMotion={prefersReducedMotion}
                semestral={true}
              />
            )}
            {ano !== 2026 && (
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
            />
            {(() => {
              const empregados = data.indicadores.pessoasEmpregadas?.valor || 0;
              const empreendedores = data.indicadores.empreendedores?.valor || 0;
              const totalRenda = empregados + empreendedores;
              const metaAnual = metasInclusao?.metas?.geracaoRenda ?? 1500;
              const pct = metaAnual > 0 ? (totalRenda / metaAnual) * 100 : 0;
              const color: Indicador['color'] = pct >= 100 ? 'blue' : pct >= 80 ? 'green' : pct >= 50 ? 'yellow' : 'red';
              const geracaoRendaIndicador: Indicador = {
                valor: totalRenda,
                meta: metaAnual,
                tipo: 'count',
                color,
                progress: Math.min(pct, 100),
              };
              return (
                <IndicadorLine
                  label="Geração de renda"
                  indicador={geracaoRendaIndicador}
                  delay={7}
                  prefersReducedMotion={prefersReducedMotion}
                  mesReferencia={mesReferencia}
                />
              );
            })()}
            {ano !== 2026 && (
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
            />
            <IndicadorLine
              label="Atendimentos Psicossociais"
              indicador={data.indicadores.atendimentos}
              delay={10}
              prefersReducedMotion={prefersReducedMotion}
              mesReferencia={mesReferencia}
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
