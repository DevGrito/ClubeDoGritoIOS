import React, { useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, parse } from 'date-fns';
import { pt } from 'date-fns/locale';
import { 
  Calendar, 
  Clock, 
  Users, 
  MapPin, 
  User, 
  Download,
  FileText,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { useReactToPrint } from 'react-to-print';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { apiRequest } from '@/lib/queryClient';

interface MonthlyReportProps {
  instanceId: number;
  month: string; // YYYY-MM format
}

interface ReportData {
  header: {
    project: string;
    activity: string;
    instanceTitle: string;
    category: string;
    periodOfDay: string;
    projectPeriod: {
      start: string;
      end: string;
    };
    managers: string[];
    educators: string[];
    whoCanParticipate: string;
    description: string;
  };
  totals: {
    hoursInMonth: number;
    attendeesInMonth: number;
  };
  diary: Array<{
    date: string;
    weekday: string;
    hours: number;
    description: string;
    observations: string;
    status: string;
    educators: string[];
    participants: number;
    frequency: number;
    location: string;
  }>;
  enrollments: Array<{
    name: string;
    gender: string;
    age: number;
    enrollmentDate: string;
  }>;
  gallery: Array<{
    date: string;
    url: string;
  }>;
}

export function MonthlyReport({ instanceId, month }: MonthlyReportProps) {
  const reportRef = useRef<HTMLDivElement>(null);

  // Fetch report data
  const { data: reportData, isLoading, error } = useQuery({
    queryKey: ['/api/instances', instanceId, 'report', month],
    queryFn: () => apiRequest(`/api/instances/${instanceId}/report?month=${month}`),
    enabled: !!(instanceId && month),
  }) as { data: ReportData | undefined, isLoading: boolean, error: any };

  // Print handler
  const handlePrint = useReactToPrint({
    contentRef: reportRef,
    documentTitle: `Relatório_${reportData?.header?.instanceTitle || 'Turma'}_${month}`,
    pageStyle: `
      @page {
        size: A4;
        margin: 20mm;
      }
      @media print {
        body { 
          font-family: 'Arial', sans-serif;
          line-height: 1.4;
        }
        .no-print { display: none !important; }
        .print-break { page-break-after: always; }
        .print-break-inside { page-break-inside: avoid; }
      }
    `
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className="animate-pulse">
            <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Gerando Relatório</h3>
            <p className="text-gray-600">Aguarde enquanto processamos os dados...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !reportData) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Erro ao Carregar Relatório</h3>
          <p className="text-gray-600">Não foi possível carregar os dados do relatório para este período.</p>
        </CardContent>
      </Card>
    );
  }

  const monthName = format(parse(month, 'yyyy-MM', new Date()), 'MMMM yyyy', { locale: pt });
  const monthNameCapitalized = monthName.charAt(0).toUpperCase() + monthName.slice(1);

  const getWeekdayName = (dateStr: string) => {
    try {
      return format(new Date(dateStr), 'eeee', { locale: pt });
    } catch {
      return 'N/A';
    }
  };

  const getStatusBadge = (status: string) => {
    const statusColors = {
      'REALIZADO': 'bg-green-100 text-green-800',
      'CANCELADO': 'bg-red-100 text-red-800',
      'REMARCADO': 'bg-yellow-100 text-yellow-800',
      'PLANEJADO': 'bg-blue-100 text-blue-800'
    };
    
    return statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800';
  };

  const getPeriodLabel = (period: string) => {
    const labels = {
      'matutino': 'Matutino',
      'vespertino': 'Vespertino', 
      'noturno': 'Noturno'
    };
    return labels[period as keyof typeof labels] || period;
  };

  // Verifica se há ao menos 1 sessão no mês para ativar o botão de exportar PDF
  const hasSessionsInMonth = reportData.diary && reportData.diary.length > 0;

  return (
    <div className="space-y-6">
      {/* Print Button */}
      <div className="no-print flex justify-end">
        <Button 
          onClick={handlePrint} 
          disabled={!hasSessionsInMonth}
          data-testid="btn-export-pdf"
          title={!hasSessionsInMonth ? "Adicione ao menos 1 sessão no mês para exportar o relatório" : ""}
        >
          <Download className="h-4 w-4 mr-2" />
          Exportar PDF
        </Button>
        {!hasSessionsInMonth && (
          <p className="text-sm text-red-600 mt-2">
            * Adicione ao menos 1 sessão no mês para exportar o relatório
          </p>
        )}
      </div>

      {/* Report Content */}
      <div ref={reportRef} className="space-y-8">
        {/* Header */}
        <div className="print-break-inside">
          <Card>
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
              <CardTitle className="text-2xl text-center">
                Relatório Mensal - {monthNameCapitalized}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              {/* Identification */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div>
                    <strong className="text-sm text-gray-600">Projeto:</strong>
                    <p className="font-semibold">{reportData.header.project}</p>
                  </div>
                  <div>
                    <strong className="text-sm text-gray-600">Atividade:</strong>
                    <p className="font-semibold">{reportData.header.activity}</p>
                  </div>
                  <div>
                    <strong className="text-sm text-gray-600">Turma:</strong>
                    <p className="font-semibold">{reportData.header.instanceTitle}</p>
                  </div>
                  <div>
                    <strong className="text-sm text-gray-600">Categoria:</strong>
                    <Badge variant="outline" className="ml-2">{reportData.header.category}</Badge>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <strong className="text-sm text-gray-600">Período do Projeto:</strong>
                    <p>{format(new Date(reportData.header.projectPeriod.start), 'dd/MM/yyyy', { locale: pt })} até {format(new Date(reportData.header.projectPeriod.end), 'dd/MM/yyyy', { locale: pt })}</p>
                  </div>
                  <div>
                    <strong className="text-sm text-gray-600">Período do Dia:</strong>
                    <p>{getPeriodLabel(reportData.header.periodOfDay)}</p>
                  </div>
                  <div>
                    <strong className="text-sm text-gray-600">Gestores:</strong>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {reportData.header.managers.map((manager, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">{manager}</Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <strong className="text-sm text-gray-600">Educadores:</strong>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {reportData.header.educators.map((educator, index) => (
                        <Badge key={index} variant="outline" className="text-xs">{educator}</Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <strong className="text-sm text-gray-600">Controle de Presença:</strong>
                <div className="flex items-center gap-2 mt-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span>Habilitado para esta turma</span>
                </div>
              </div>
              
              {reportData.header.description && (
                <>
                  <Separator />
                  <div>
                    <strong className="text-sm text-gray-600">Descrição:</strong>
                    <p className="mt-1 text-sm leading-relaxed">{reportData.header.description}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Summary Cards */}
        <div className="print-break-inside">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Carga Horária do Mês</p>
                    <p className="text-3xl font-bold text-blue-600">{reportData.totals.hoursInMonth}h</p>
                  </div>
                  <Clock className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Atendidos do Mês</p>
                    <p className="text-3xl font-bold text-green-600">{reportData.totals.attendeesInMonth}</p>
                  </div>
                  <Users className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Daily Diary Table */}
        <div className="print-break-inside">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Diário de Atividades
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Dia</TableHead>
                      <TableHead className="text-center">Horas</TableHead>
                      <TableHead>Resumo da Aula</TableHead>
                      <TableHead>Observações</TableHead>
                      <TableHead className="text-center">Participantes</TableHead>
                      <TableHead className="text-center">Freq. %</TableHead>
                      <TableHead>Local</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Educador(es)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportData.diary.map((entry, index) => (
                      <TableRow key={index} data-testid={`diary-entry-${index}`}>
                        <TableCell className="font-medium">
                          {format(new Date(entry.date), 'dd/MM', { locale: pt })}
                        </TableCell>
                        <TableCell className="text-sm">{getWeekdayName(entry.date)}</TableCell>
                        <TableCell className="text-center font-semibold">{entry.hours}h</TableCell>
                        <TableCell className="max-w-xs">
                          <p className="text-sm truncate" title={entry.description}>
                            {entry.description}
                          </p>
                        </TableCell>
                        <TableCell className="max-w-xs">
                          <p className="text-sm truncate" title={entry.observations}>
                            {entry.observations || 'Sem observação'}
                          </p>
                        </TableCell>
                        <TableCell className="text-center font-semibold">{entry.participants}</TableCell>
                        <TableCell className="text-center">
                          <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                            entry.frequency >= 80 ? 'bg-green-100 text-green-800' : 
                            entry.frequency >= 60 ? 'bg-yellow-100 text-yellow-800' : 
                            'bg-red-100 text-red-800'
                          }`}>
                            {entry.frequency.toFixed(1)}%
                          </span>
                        </TableCell>
                        <TableCell className="text-sm">{entry.location}</TableCell>
                        <TableCell>
                          <Badge className={`text-xs ${getStatusBadge(entry.status)}`}>
                            {entry.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {entry.educators.length > 0 ? entry.educators.join(', ') : 'N/A'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="print-break"></div>

        {/* Enrolled Students List */}
        <div className="print-break-inside">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Lista de Inscritos ({reportData.enrollments.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {reportData.enrollments.map((enrollment, index) => (
                  <div 
                    key={index} 
                    className="flex items-center gap-3 p-3 border rounded-lg"
                    data-testid={`enrollment-${index}`}
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="text-xs">
                        {enrollment.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{enrollment.name}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <span>{enrollment.gender}</span>
                        <span>•</span>
                        <span>{enrollment.age} anos</span>
                      </div>
                      <p className="text-xs text-gray-500">
                        Inscr.: {format(new Date(enrollment.enrollmentDate), 'dd/MM/yy', { locale: pt })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Photo Gallery */}
        {reportData.gallery && reportData.gallery.length > 0 && (
          <div className="print-break-inside">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Galeria de Fotos ({reportData.gallery.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {reportData.gallery.map((photo, index) => (
                    <div key={index} className="space-y-2" data-testid={`gallery-photo-${index}`}>
                      <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                        <img 
                          src={photo.url}
                          alt={`Foto ${index + 1}`}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </div>
                      <p className="text-xs text-center text-gray-600">
                        {format(new Date(photo.date), 'dd/MM', { locale: pt })}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-sm text-gray-500 pt-6">
          <Separator className="mb-4" />
          <p>Relatório gerado automaticamente pelo Sistema PEC - {format(new Date(), 'dd/MM/yyyy HH:mm', { locale: pt })}</p>
        </div>
      </div>
    </div>
  );
}