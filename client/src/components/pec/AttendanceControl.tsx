import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { 
  Users, CheckCircle, XCircle, Clock, AlertCircle, Save, 
  RefreshCw, Calendar, Timer
} from 'lucide-react';

interface AttendanceControlProps {
  sessionId: number;
  instanceId: number;
  sessionDate: string;
  controlMode: 'manual' | 'intelbras';
  intelbrasGroupId?: string;
}

interface Student {
  id: number;
  name: string;
  cpf?: string;
  enrollment_date: string;
  active: boolean;
}

interface AttendanceRecord {
  id?: number;
  session_id: number;
  student_id: number;
  status: 'presente' | 'ausente' | 'falta_justificada' | 'atraso';
  entry_time?: string;
  exit_time?: string;
  total_hours?: number;
  observations?: string;
}

export function AttendanceControl({ 
  sessionId, 
  instanceId, 
  sessionDate, 
  controlMode, 
  intelbrasGroupId 
}: AttendanceControlProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [attendanceData, setAttendanceData] = useState<Record<number, AttendanceRecord>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  // Fetch enrolled students for the instance
  const { data: students = [], isLoading: loadingStudents } = useQuery({
    queryKey: ['/api/enrollments', instanceId],
    queryFn: () => apiRequest(`/api/enrollments?instance_id=${instanceId}&active=true`)
  }) as { data: Student[], isLoading: boolean };

  // Fetch existing attendance records
  const { data: existingAttendance = [], isLoading: loadingAttendance } = useQuery({
    queryKey: ['/api/pec/attendance', sessionId],
    queryFn: () => apiRequest(`/api/pec/attendance?session_id=${sessionId}`)
  }) as { data: AttendanceRecord[], isLoading: boolean };

  // Initialize attendance data when students and existing records are loaded
  useEffect(() => {
    if (students.length > 0) {
      const initialData: Record<number, AttendanceRecord> = {};
      
      students.forEach(student => {
        const existingRecord = existingAttendance.find(record => record.student_id === student.id);
        
        initialData[student.id] = existingRecord || {
          session_id: sessionId,
          student_id: student.id,
          status: 'ausente',
          observations: ''
        };
      });
      
      setAttendanceData(initialData);
    }
  }, [students, existingAttendance, sessionId]);

  // Save attendance mutation
  const saveAttendanceMutation = useMutation({
    mutationFn: async (attendanceRecords: AttendanceRecord[]) => {
      return apiRequest('/api/pec/attendance', {
        method: 'POST',
        body: JSON.stringify({
          session_id: sessionId,
          records: attendanceRecords
        })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/pec/attendance'] });
      toast({ title: "Frequência salva com sucesso!" });
      setLastSync(new Date());
    },
    onError: (error: Error) => {
      toast({ 
        title: "Erro ao salvar frequência", 
        description: error.message, 
        variant: "destructive" 
      });
    }
  });

  // Sync with Intelbras API (when control mode is intelbras)
  const syncIntelbrasData = async () => {
    if (!intelbrasGroupId || controlMode !== 'intelbras') return;
    
    setIsLoading(true);
    try {
      // TODO: Implement Intelbras API integration
      // This would fetch entry/exit logs from Intelbras API
      // and automatically calculate attendance and hours
      
      const intelbrasData = await apiRequest(`/api/pec/intelbras/attendance`, {
        method: 'POST',
        body: JSON.stringify({
          group_id: intelbrasGroupId,
          date: sessionDate,
          student_ids: students.map(s => s.id)
        })
      });

      // Update attendance data with Intelbras results
      const updatedData = { ...attendanceData };
      intelbrasData.forEach((record: any) => {
        updatedData[record.student_id] = {
          ...updatedData[record.student_id],
          status: record.entry_time ? 'presente' : 'ausente',
          entry_time: record.entry_time,
          exit_time: record.exit_time,
          total_hours: record.total_hours
        };
      });
      
      setAttendanceData(updatedData);
      toast({ title: "Dados sincronizados com Intelbras!" });
      setLastSync(new Date());
      
    } catch (error) {
      toast({ 
        title: "Erro ao sincronizar com Intelbras", 
        description: "Verifique se o ID do grupo está correto", 
        variant: "destructive" 
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Update attendance status for a student
  const updateAttendanceStatus = (studentId: number, status: AttendanceRecord['status']) => {
    setAttendanceData(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status,
        // Reset times when manually changing status
        ...(controlMode === 'manual' && status === 'ausente' && {
          entry_time: undefined,
          exit_time: undefined,
          total_hours: undefined
        })
      }
    }));
  };

  // Update observations for a student
  const updateObservations = (studentId: number, observations: string) => {
    setAttendanceData(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        observations
      }
    }));
  };

  // Save all attendance records
  const handleSaveAttendance = () => {
    // Enviar todos os registros para garantir sincronização completa
    const records = Object.values(attendanceData);
    saveAttendanceMutation.mutate(records);
  };

  // Calculate statistics
  const stats = {
    total: students.length,
    present: Object.values(attendanceData).filter(record => 
      ['presente', 'atraso'].includes(record.status)
    ).length,
    absent: Object.values(attendanceData).filter(record => 
      record.status === 'ausente'
    ).length,
    justified: Object.values(attendanceData).filter(record => 
      record.status === 'falta_justificada'
    ).length
  };

  const getStatusBadge = (status: AttendanceRecord['status']) => {
    const config = {
      presente: { variant: 'default' as const, color: 'bg-green-500', label: 'Presente' },
      ausente: { variant: 'destructive' as const, color: 'bg-red-500', label: 'Ausente' },
      falta_justificada: { variant: 'secondary' as const, color: 'bg-yellow-500', label: 'Falta Justificada' },
      atraso: { variant: 'outline' as const, color: 'bg-orange-500', label: 'Atraso' }
    };
    
    const statusConfig = config[status];
    return (
      <Badge variant={statusConfig.variant} className={`${statusConfig.color} text-white`}>
        {statusConfig.label}
      </Badge>
    );
  };

  if (loadingStudents || loadingAttendance) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Carregando lista de alunos...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with controls and stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              <span>Controle de Frequência</span>
              <Badge variant="outline">
                {format(new Date(sessionDate), 'dd/MM/yyyy', { locale: pt })}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              {controlMode === 'intelbras' && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={syncIntelbrasData}
                  disabled={isLoading}
                  data-testid="btn-sync-intelbras"
                >
                  {isLoading ? (
                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  Sincronizar Intelbras
                </Button>
              )}
              <Button 
                onClick={handleSaveAttendance}
                disabled={saveAttendanceMutation.isPending}
                data-testid="btn-save-attendance"
              >
                {saveAttendanceMutation.isPending ? (
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Salvar Frequência
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
              <div className="text-sm text-gray-600">Total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.present}</div>
              <div className="text-sm text-gray-600">Presentes</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{stats.absent}</div>
              <div className="text-sm text-gray-600">Ausentes</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{stats.justified}</div>
              <div className="text-sm text-gray-600">Just.</div>
            </div>
          </div>

          {/* Control mode info */}
          <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
            <div className="flex items-center gap-2">
              <span className="font-medium">Modo de Controle:</span>
              <Badge variant={controlMode === 'intelbras' ? 'default' : 'secondary'}>
                {controlMode === 'intelbras' ? 'Intelbras Automático' : 'Manual'}
              </Badge>
              {intelbrasGroupId && (
                <Badge variant="outline">ID: {intelbrasGroupId}</Badge>
              )}
            </div>
            {lastSync && (
              <div className="text-sm text-gray-600">
                Último sync: {format(lastSync, 'HH:mm:ss')}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Student attendance table */}
      <Card>
        <CardHeader>
          <CardTitle>
            {controlMode === 'manual' ? 'Planilha de Frequência Manual' : 'Controle Automatizado - Intelbras'} 
            ({students.length} alunos)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {students.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Nenhum aluno inscrito nesta turma</p>
            </div>
          ) : controlMode === 'manual' ? (
            // MODO MANUAL: Planilha com checkboxes
            <div className="space-y-3">
              <div className="grid grid-cols-12 gap-4 p-3 bg-gray-100 rounded-lg font-medium text-sm">
                <div className="col-span-5">Nome</div>
                <div className="col-span-2 text-center">Presente</div>
                <div className="col-span-2 text-center">Status</div>
                <div className="col-span-3">Observações</div>
              </div>
              {students.map((student) => {
                const attendance = attendanceData[student.id] || {
                  session_id: sessionId,
                  student_id: student.id,
                  status: 'ausente' as const,
                  observations: ''
                };
                const isPresent = ['presente', 'atraso'].includes(attendance.status);

                return (
                  <div 
                    key={student.id} 
                    className="grid grid-cols-12 gap-4 p-3 border rounded-lg hover:bg-gray-50 items-center"
                    data-testid={`student-attendance-${student.id}`}
                  >
                    <div className="col-span-5">
                      <h4 className="font-medium text-gray-900">{student.name}</h4>
                      {student.cpf && (
                        <p className="text-xs text-gray-600">CPF: {student.cpf}</p>
                      )}
                    </div>
                    
                    <div className="col-span-2 text-center">
                      <Checkbox
                        checked={isPresent}
                        onCheckedChange={(checked) => 
                          updateAttendanceStatus(student.id, checked ? 'presente' : 'ausente')
                        }
                        data-testid={`checkbox-attendance-${student.id}`}
                      />
                    </div>
                    
                    <div className="col-span-2 text-center">
                      {getStatusBadge(attendance.status)}
                    </div>
                    
                    <div className="col-span-3">
                      <Input
                        placeholder="Observações..."
                        value={attendance.observations || ''}
                        onChange={(e) => updateObservations(student.id, e.target.value)}
                        data-testid={`input-observations-${student.id}`}
                        className="text-sm"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            // MODO INTELBRAS: Tabela completa com entrada, saída, horas
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border p-3 text-left font-medium">Nome</th>
                    <th className="border p-3 text-center font-medium">Entrada</th>
                    <th className="border p-3 text-center font-medium">Saída</th>
                    <th className="border p-3 text-center font-medium">Horas</th>
                    <th className="border p-3 text-center font-medium">Presente</th>
                    <th className="border p-3 text-left font-medium">Observações</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => {
                    const attendance = attendanceData[student.id] || {
                      session_id: sessionId,
                      student_id: student.id,
                      status: 'ausente' as const,
                      observations: ''
                    };
                    const isPresent = ['presente', 'atraso'].includes(attendance.status);

                    return (
                      <tr 
                        key={student.id}
                        className={`hover:bg-gray-50 ${isPresent ? 'bg-green-50' : ''}`}
                        data-testid={`student-attendance-${student.id}`}
                      >
                        <td className="border p-3">
                          <div>
                            <h4 className="font-medium text-gray-900">{student.name}</h4>
                            {student.cpf && (
                              <p className="text-xs text-gray-600">CPF: {student.cpf}</p>
                            )}
                          </div>
                        </td>
                        
                        <td className="border p-3 text-center">
                          <div className="font-mono text-sm">
                            {attendance.entry_time || '—'}
                          </div>
                        </td>
                        
                        <td className="border p-3 text-center">
                          <div className="font-mono text-sm">
                            {attendance.exit_time || '—'}
                          </div>
                        </td>
                        
                        <td className="border p-3 text-center">
                          <div className="font-mono text-sm font-medium">
                            {attendance.total_hours ? `${attendance.total_hours}h` : '—'}
                          </div>
                        </td>
                        
                        <td className="border p-3 text-center">
                          <div className="flex justify-center">
                            {isPresent ? (
                              <CheckCircle className="h-5 w-5 text-green-500" />
                            ) : (
                              <XCircle className="h-5 w-5 text-red-500" />
                            )}
                          </div>
                        </td>
                        
                        <td className="border p-3">
                          <Input
                            placeholder="Observações..."
                            value={attendance.observations || ''}
                            onChange={(e) => updateObservations(student.id, e.target.value)}
                            data-testid={`input-observations-${student.id}`}
                            className="text-sm"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}