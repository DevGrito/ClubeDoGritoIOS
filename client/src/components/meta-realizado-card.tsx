import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { cn } from "@/lib/utils";

interface MetaRealizadoItem {
  meta: number;
  realizado: number;
  percentual: number;
}

interface MetaRealizadoData {
  [key: string]: MetaRealizadoItem;
}

interface MetaRealizadoCardProps {
  title: string;
  data: MetaRealizadoData;
  className?: string;
}

function formatNumber(value: number): string {
  return value.toLocaleString('pt-BR');
}

function getProgressColor(percentage: number): string {
  return "bg-green-500";
}

function getIndicatorColor(percentage: number): string {
  return "text-green-600 bg-green-50";
}

function formatMetaRealizadoLabel(key: string): string {
  const labels: Record<string, string> = {
    // Favela 3D - Decolagem
    familiasAtivas: "Famílias Ativas",
    visitasMentores: "Visitas Mentores",
    familiasTriangulo: "Famílias Triângulo",
    // Favela 3D - Desenvolvimento Social
    atendimentosGerais: "Atendimentos Gerais",
    gerandoLiderancas: "Gerando Lideranças",
    rodaConversa: "Roda de Conversa",
    grupoMulheres: "Grupo de Mulheres",
    assembleiaComunitaria: "Assembleia Comunitária",
    // Favela 3D - Emprego e Renda
    formandos: "Formandos",
    empregados: "Empregados",
    empreendedoresMapeados: "Empreendedores Mapeados",
    // Favela 3D - Moradia e Urbanismo
    equipamentos: "Equipamentos",
    melhoriaHabitacional: "Melhoria Habitacional",
    // Inclusão Produtiva - Lab. Vozes do Futuro
    frequencia: "Frequência",
    evasao: "Evasão",
    avaliacaoAprendizagem: "Avaliação de Aprendizagem",
    quantidadeAlunos: "Quantidade de Alunos",
    nps: "NPS",
    // Outros programas (mantidos para compatibilidade)
    cadastroFamilias: "Cadastro de Famílias",
    atendimentosMensais: "Atendimentos Mensais",
    frequenciaAtividades: "Frequência de Atividades",
    participacaoWorkshops: "Participação em Workshops",
    totalParticipantes: "Total de Participantes",
    taxaConclusao: "Taxa de Conclusão",
    cursosAtivos: "Cursos Ativos",
    totalAlunos: "Total de Alunos",
    frequenciaGeral: "Frequência Geral",
    modalidadesOfertadas: "Modalidades Ofertadas",
    taxaEvasao: "Taxa de Evasão",
    totalAtendimentos: "Total de Atendimentos",
    taxaResolucao: "Taxa de Resolução",
    casosAtivos: "Casos Ativos",
    tempoMedioAtendimento: "Tempo Médio de Atendimento"
  };
  return labels[key] || key;
}

export default function MetaRealizadoCard({ title, data, className }: MetaRealizadoCardProps) {
  const items = Object.entries(data);
  
  // Prepare data for the bar chart
  const chartData = items.map(([key, item]) => ({
    name: formatMetaRealizadoLabel(key),
    Meta: item.meta,
    Realizado: item.realizado,
    percentual: item.percentual
  }));

  // Calculate average performance
  const avgPercentual = items.reduce((sum, [, item]) => sum + item.percentual, 0) / items.length;

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold text-gray-800">
          {title}
        </CardTitle>
        <p className="text-sm text-gray-500">
          Comparação entre metas e valores realizados
        </p>
      </CardHeader>
      <CardContent>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{
                top: 10,
                right: 20,
                left: 20,
                bottom: 50,
              }}
              barCategoryGap="10%"
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis 
                dataKey="name" 
                angle={-35}
                textAnchor="end"
                height={60}
                fontSize={12}
                interval={0}
                tick={{ fill: '#64748b' }}
              />
              <YAxis 
                fontSize={12}
                tick={{ fill: '#64748b' }}
                axisLine={{ stroke: '#e2e8f0' }}
                tickLine={{ stroke: '#e2e8f0' }}
                width={50}
              />
              <Tooltip 
                formatter={(value: number, name: string) => [
                  formatNumber(value), 
                  name
                ]}
                labelFormatter={(label) => `${label}`}
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  fontSize: '12px',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Legend 
                wrapperStyle={{ fontSize: '13px', fontWeight: '500' }}
                iconType="rect"
                height={25}
              />
              <Bar 
                dataKey="Meta" 
                fill="#3b82f6" 
                name="Meta"
                radius={[3, 3, 0, 0]}
                maxBarSize={50}
              />
              <Bar 
                dataKey="Realizado" 
                fill="#10b981" 
                name="Realizado"
                radius={[3, 3, 0, 0]}
                maxBarSize={50}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        {items.length > 0 && (
          <div className="mt-6 pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">
                Desempenho Geral
              </span>
              <div className="text-right">
                <div className={cn(
                  "px-3 py-1 rounded-full text-sm font-semibold",
                  getIndicatorColor(avgPercentual)
                )}>
                  {avgPercentual.toFixed(1)}%
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}