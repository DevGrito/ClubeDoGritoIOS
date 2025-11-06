import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { useReactToPrint } from "react-to-print";
import { format, parseISO } from "date-fns";
import { pt } from "date-fns/locale";

interface PsicoMonthlyReportProps {
  month: string; // YYYY-MM format
  familias: any[];
  atendimentos: any[];
  casos: any[];
}

export default function PsicoMonthlyReport({ month, familias, atendimentos, casos }: PsicoMonthlyReportProps) {
  const reportRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: reportRef,
    documentTitle: `Relatório_Psicossocial_${month}`,
    pageStyle: `
      @page {
        size: A4;
        margin: 20mm;
      }
      @media print {
        body {
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .no-print {
          display: none !important;
        }
        .page-break {
          page-break-after: always;
        }
        .avoid-break {
          page-break-inside: avoid;
        }
      }
    `,
  });

  const monthName = format(parseISO(`${month}-01`), "MMMM", { locale: pt });
  const year = format(parseISO(`${month}-01`), "yyyy", { locale: pt });

  // Filtrar atendimentos do mês
  const atendimentosMes = atendimentos.filter(atend => {
    if (!atend.dataAtendimento) return false;
    const atendDate = new Date(atend.dataAtendimento);
    return format(atendDate, 'yyyy-MM') === month;
  });

  // Agrupar atendimentos por dia
  const atendimentosPorDia: { [key: string]: any[] } = {};
  atendimentosMes.forEach(atend => {
    const dateKey = format(new Date(atend.dataAtendimento), 'yyyy-MM-dd');
    if (!atendimentosPorDia[dateKey]) {
      atendimentosPorDia[dateKey] = [];
    }
    atendimentosPorDia[dateKey].push(atend);
  });

  const hasAtendimentos = atendimentosMes.length > 0;

  return (
    <div className="space-y-6">
      {/* Botão de Exportar */}
      <div className="no-print flex justify-end">
        <Button 
          onClick={handlePrint} 
          disabled={!hasAtendimentos}
          className="bg-purple-500 hover:bg-purple-600"
          title={!hasAtendimentos ? "Adicione atendimentos no mês para exportar o relatório" : ""}
        >
          <Download className="w-4 h-4 mr-2" />
          Exportar PDF
        </Button>
      </div>

      {/* Conteúdo do Relatório */}
      <div ref={reportRef} className="bg-white p-8">
        {/* Cabeçalho */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold uppercase mb-2">
            RELATÓRIO MENSAL - MÊS DE {monthName.toUpperCase()} DE {year}
          </h1>
          <h2 className="text-xl font-semibold text-purple-600">
            INSTITUTO O GRITO
          </h2>
        </div>

        {/* Informações da Atividade */}
        <div className="border border-gray-300 rounded-lg p-6 mb-8 avoid-break">
          <h3 className="text-lg font-bold mb-4">Atividade</h3>
          
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="font-semibold text-sm text-gray-600">PROGRAMA PSICOSSOCIAL - MÉTODO GRITO</p>
              <p className="text-sm mt-2">
                <span className="font-semibold">Projeto:</span> Método Grito 2025
              </p>
              <p className="text-sm mt-1">
                <span className="font-semibold">Categoria:</span> Serviço de Convivência e Fortalecimento de Vínculos (SCFV)
              </p>
              <p className="text-sm mt-1">
                <span className="font-semibold">Carga horária do mês:</span> {atendimentosMes.length * 2}h
              </p>
              <p className="text-sm mt-1">
                <span className="font-semibold">Famílias atendidas:</span> {familias.length}
              </p>
              <p className="text-sm mt-1">
                <span className="font-semibold">Atendidos:</span> {atendimentosMes.length}
              </p>
            </div>
            
            <div>
              <p className="text-sm">
                <span className="font-semibold">Gestores da atividade:</span> Coordenação Psicossocial
              </p>
              <p className="text-sm mt-1">
                <span className="font-semibold">Quem pode participar:</span> Famílias em situação de vulnerabilidade
              </p>
              <p className="text-sm mt-1">
                <span className="font-semibold">Período:</span> Integral
              </p>
              
              <div className="mt-4 p-3 bg-purple-50 border border-purple-200 rounded">
                <p className="font-semibold text-sm mb-2">Descrição</p>
                <p className="text-xs text-gray-700">
                  Programa de acompanhamento psicossocial que oferece suporte integral às famílias, 
                  fortalecendo vínculos e promovendo o desenvolvimento social e emocional através do 
                  Método Grito de intervenção comunitária.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Diário de Atividades */}
        <div className="space-y-6">
          {Object.entries(atendimentosPorDia)
            .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
            .map(([dateKey, atendimentosDia]) => {
              const date = parseISO(dateKey);
              const dayOfMonth = format(date, 'd');
              const dayOfWeek = format(date, 'EEEE', { locale: pt });
              
              return (
                <div key={dateKey} className="border border-gray-300 rounded-lg p-4 avoid-break">
                  {/* Cabeçalho do Dia */}
                  <div className="flex items-start justify-between border-b border-gray-200 pb-3 mb-3">
                    <div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-purple-600">{dayOfMonth}</span>
                        <span className="text-sm text-gray-500 uppercase">
                          {monthName.toUpperCase().substring(0, 3)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 capitalize mt-1">{dayOfWeek}</p>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-sm text-gray-600">
                        <span className="font-semibold">Carga horária:</span> {atendimentosDia.length * 2}h
                      </p>
                      <p className="text-sm">
                        <span className="font-semibold">Atendimentos:</span> {atendimentosDia.length}
                      </p>
                    </div>
                  </div>

                  {/* Atendimentos do Dia */}
                  <div className="space-y-4">
                    {atendimentosDia.map((atend, idx) => {
                      const familia = familias.find(f => f.id === atend.familiaId);
                      
                      return (
                        <div key={idx} className="bg-gray-50 p-3 rounded">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <p className="font-semibold text-sm uppercase text-purple-700">
                                ATIVIDADE: REALIZADO
                              </p>
                              <p className="text-sm mt-1">
                                <span className="font-semibold">Família:</span> {familia?.nomeResponsavel || 'N/A'}
                              </p>
                              <p className="text-sm">
                                <span className="font-semibold">Tipo:</span> {atend.tipo || 'Individual'}
                              </p>
                            </div>
                            
                            <div className="text-right text-xs text-gray-600">
                              <p>
                                <span className="font-semibold">Coordenador(es)</span>
                              </p>
                              <p className="mt-2">
                                <span className="font-semibold">Local</span>
                              </p>
                              <p>Instituto O Grito</p>
                            </div>
                          </div>
                          
                          {atend.descricao && (
                            <div className="mt-2">
                              <p className="text-xs text-gray-700">{atend.descricao}</p>
                            </div>
                          )}
                          
                          {atend.encaminhamentos && (
                            <div className="mt-2">
                              <p className="text-xs font-semibold text-gray-700">
                                Encaminhamentos:
                              </p>
                              <p className="text-xs text-gray-700">{atend.encaminhamentos}</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
        </div>

        {/* Rodapé */}
        <div className="mt-8 pt-4 border-t border-gray-300 text-center text-xs text-gray-500">
          <p>Relatório mensal - mês de {monthName} de {year}</p>
          <p className="mt-1">Instituto O Grito - Programa Psicossocial</p>
        </div>
      </div>
    </div>
  );
}
