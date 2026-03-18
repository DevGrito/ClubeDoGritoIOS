import { useState } from "react";
import { formatCPF } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Users,
  FileText,
  Download,
  Plus,
  Search,
  User,
  Edit,
  Eye,
  GraduationCap,
  Upload,
  Trash2,
  UserX,
  Phone,
  MapPin,
} from "lucide-react";
import { ComprehensiveStudentForm } from "@/components/comprehensive-student-form";
import { ParticipanteDetalhesModal, type DetalhesSection } from "@/components/ParticipanteDetalhesModal";

interface ParticipantesInclusaoSectionProps {
  showImportExport?: boolean;
  readOnly?: boolean;
  filtroTurmaIds?: number[];
  hideSensitive?: boolean;
}

const maskCpfSection = (cpf: string | null | undefined): string => {
  const clean = String(cpf || '').replace(/\D/g, '');
  if (clean.length !== 11) return '***.***.***-**';
  return `***.***.*${clean[7]}${clean[8]}-${clean[9]}${clean[10]}`;
};

export default function ParticipantesInclusaoSection({ showImportExport = true, readOnly = false, filtroTurmaIds, hideSensitive = false }: ParticipantesInclusaoSectionProps) {
  const { toast } = useToast();

  const [searchParticipante, setSearchParticipante] = useState<string>("");
  const [statusFilterParticipantes, setStatusFilterParticipantes] = useState<string>("ativos");

  const [selectedParticipante, setSelectedParticipante] = useState<any>(null);
  const [fullParticipanteData, setFullParticipanteData] = useState<any>(null);
  const [loadingParticipanteDetails, setLoadingParticipanteDetails] = useState(false);

  const [showNovoParticipanteModal, setShowNovoParticipanteModal] = useState(false);
  const [showEditParticipanteModal, setShowEditParticipanteModal] = useState(false);
  const [showDetalhesParticipanteModal, setShowDetalhesParticipanteModal] = useState(false);
  const [showInativarParticipanteModal, setShowInativarParticipanteModal] = useState(false);

  const [participanteDocumentos, setParticipanteDocumentos] = useState<any[]>([]);
  const [uploadingDocumento, setUploadingDocumento] = useState(false);

  const [showDocumentoPreviewModal, setShowDocumentoPreviewModal] = useState(false);
  const [documentoPreviewUrl, setDocumentoPreviewUrl] = useState<string>("");
  const [documentoPreviewNome, setDocumentoPreviewNome] = useState<string>("");

  const { data: participantesData = [], isLoading: isLoadingParticipantes } = useQuery({
    queryKey: ['/api/participantes-inclusao'],
    queryFn: async () => {
      const response = await fetch('/api/participantes-inclusao', { credentials: "include" });
      if (!response.ok) throw new Error('Falha ao carregar participantes');
      return response.json();
    },
  });

  const handleExportTemplate = () => {
    const headers = [
      'Nome Completo',
      'CPF',
      'Email',
      'Telefone',
      'Endereço',
      'Curso/Programa',
      'Escolaridade',
      'Experiência Anterior'
    ];

    const exampleRow = [
      'Maria da Silva',
      '12345678901',
      'maria.silva@email.com',
      '11999999999',
      'Rua das Flores, 123 - São Paulo/SP',
      'Auxiliar Administrativo',
      'Ensino Médio Completo',
      'Trabalhou 2 anos como atendente'
    ];

    const csvContent = [headers, exampleRow]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'template_participantes_inclusao_produtiva.csv';
    link.click();

    toast({
      title: "Template baixado!",
      description: "Use este arquivo como modelo para importar participantes."
    });
  };

  const handleImportExcel = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n');
      const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());

      const expectedHeaders = ['Nome Completo', 'CPF', 'Email', 'Telefone', 'Endereço', 'Curso/Programa', 'Escolaridade'];
      const isValidTemplate = expectedHeaders.every(header =>
        headers.some(h => h.toLowerCase().includes(header.toLowerCase()))
      );

      if (!isValidTemplate) {
        toast({
          title: "Arquivo inválido",
          description: "Por favor, use o template correto baixado pelo sistema.",
          variant: "destructive"
        });
        return;
      }

      const participants = [];
      for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim()) {
          const values = lines[i].split(',').map(v => v.replace(/"/g, '').trim());
          if (values.length >= 7) {
            participants.push({
              nome: values[0],
              cpf: values[1],
              email: values[2],
              telefone: values[3],
              endereco: values[4],
              curso: values[5],
              escolaridade: values[6],
              experiencia: values[7] || ''
            });
          }
        }
      }

      if (participants.length > 0) {
        toast({
          title: `${participants.length} participantes prontos para importar`,
          description: "Confirme a importação para adicionar ao sistema."
        });
        console.log('Participantes para importar:', participants);
      }
    };

    reader.readAsText(file);
    event.target.value = '';
  };

  const handleExportParticipantes = async () => {
    try {
      toast({
        title: "Exportando participantes",
        description: "Aguarde, estamos preparando seu arquivo Excel..."
      });

      const response = await fetch('/api/inclusao-produtiva/export-participantes');

      if (!response.ok) {
        throw new Error('Erro ao exportar participantes');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `participantes_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Sucesso!",
        description: "Participantes exportados com sucesso."
      });
    } catch (error: any) {
      console.error('Erro ao exportar participantes:', error);
      toast({
        title: "Erro",
        description: "Não foi possível exportar os participantes. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4">
        <div>
          <CardTitle>Gestão de Participantes</CardTitle>
        </div>
        <div className="flex gap-2">
          {showImportExport && (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={handleExportTemplate}
                data-testid="button-export-template"
              >
                <Download className="w-4 h-4 mr-2" />
                Baixar Template
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => document.getElementById('file-import-participantes')?.click()}
                data-testid="button-import-excel"
              >
                <Upload className="w-4 h-4 mr-2" />
                Importar Excel
              </Button>
            </>
          )}
          {!readOnly && (
            <Button
              size="sm"
              className="bg-blue-500 hover:bg-blue-600"
              data-testid="button-add-participante"
              onClick={() => setShowNovoParticipanteModal(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Participante
            </Button>
          )}

          <ComprehensiveStudentForm
            open={showNovoParticipanteModal}
            onClose={() => setShowNovoParticipanteModal(false)}
            mode="inclusao"
          />

          <ParticipanteDetalhesModal
            open={showDetalhesParticipanteModal}
            onOpenChange={(open) => {
              setShowDetalhesParticipanteModal(open);
              if (!open) setFullParticipanteData(null);
            }}
            title="Detalhes Completos do Participante"
            loading={loadingParticipanteDetails}
            color="blue"
            foto={fullParticipanteData?.foto_perfil || selectedParticipante?.foto_perfil}
            nome={fullParticipanteData?.nome || selectedParticipante?.nome}
            cpf={maskCpfSection(fullParticipanteData?.cpf || selectedParticipante?.cpf)}
            status={fullParticipanteData?.status || selectedParticipante?.status}
            sections={(fullParticipanteData || selectedParticipante) ? ([
              {
                title: "Identificação",
                icon: User,
                fields: [
                  { label: "Nome", value: fullParticipanteData?.nome || selectedParticipante?.nome },
                  { label: "Gênero", value: fullParticipanteData?.genero || selectedParticipante?.genero },
                  { label: "Idade", value: (() => { const idade = fullParticipanteData?.idade || selectedParticipante?.idade; return (idade && idade > 0 && idade < 150) ? `${idade} anos` : undefined; })() },
                  { label: "Data de Ingresso", value: (fullParticipanteData?.dataIngresso || selectedParticipante?.dataIngresso) ? new Date(fullParticipanteData?.dataIngresso || selectedParticipante?.dataIngresso).toLocaleDateString('pt-BR') : undefined },
                  { label: "Nº Matrícula", value: fullParticipanteData?.codigoMatricula || selectedParticipante?.codigoMatricula },
                ],
              },
              {
                title: "Contato",
                icon: Phone,
                fields: [
                  { label: "Telefone", value: fullParticipanteData?.telefone || selectedParticipante?.telefone },
                  { label: "Email", value: fullParticipanteData?.email || selectedParticipante?.email },
                ],
              },
              {
                title: "Endereço",
                icon: MapPin,
                fields: [
                  { label: "CEP", value: fullParticipanteData?.cep || selectedParticipante?.cep },
                  { label: "Logradouro", value: fullParticipanteData?.logradouro || selectedParticipante?.logradouro, fullWidth: true },
                  { label: "Número", value: fullParticipanteData?.numero || selectedParticipante?.numero },
                  { label: "Complemento", value: fullParticipanteData?.complemento || selectedParticipante?.complemento },
                  { label: "Bairro", value: fullParticipanteData?.bairro || selectedParticipante?.bairro },
                  { label: "Cidade", value: fullParticipanteData?.cidade || selectedParticipante?.cidade },
                  { label: "Estado", value: fullParticipanteData?.estado || selectedParticipante?.estado },
                ],
              },
              {
                title: "Dados Pessoais Adicionais",
                icon: User,
                fields: [
                  { label: "Data de Nascimento", value: (fullParticipanteData?.dataNascimento || selectedParticipante?.dataNascimento) ? new Date(fullParticipanteData?.dataNascimento || selectedParticipante?.dataNascimento).toLocaleDateString('pt-BR') : undefined },
                  { label: "Nacionalidade", value: fullParticipanteData?.nacionalidade || selectedParticipante?.nacionalidade },
                  { label: "Forma de Acesso", value: fullParticipanteData?.formaAcesso || selectedParticipante?.formaAcesso },
                  { label: "Data de Entrada", value: (fullParticipanteData?.dataEntrada || selectedParticipante?.dataEntrada) ? new Date(fullParticipanteData?.dataEntrada || selectedParticipante?.dataEntrada).toLocaleDateString('pt-BR') : undefined },
                ],
              },
              {
                title: "Escolaridade e Profissional",
                icon: GraduationCap,
                cols: 2,
                fields: [
                  { label: "Escolaridade", value: fullParticipanteData?.escolaridade || selectedParticipante?.escolaridade },
                  { label: "Experiência Profissional", value: fullParticipanteData?.experienciaProfissional || selectedParticipante?.experienciaProfissional },
                  { label: "Objetivos Profissionais", value: fullParticipanteData?.objetivosProfissionais || selectedParticipante?.objetivosProfissionais, fullWidth: true },
                ],
              },
            ] as DetalhesSection[]) : []}
            extraSections={(fullParticipanteData || selectedParticipante) && (
              <>
                <div>
                  <h4 className="font-semibold text-blue-600 mb-3 flex items-center gap-2">
                    <Users className="w-4 h-4" /> Turmas Vinculadas
                  </h4>
                  <div className="flex flex-wrap gap-2 bg-gray-50 p-4 rounded-lg">
                    {(fullParticipanteData?.turmas || selectedParticipante?.turmas) && (fullParticipanteData?.turmas || selectedParticipante?.turmas).length > 0 ? (
                      (fullParticipanteData?.turmas || selectedParticipante?.turmas).map((turma: any, idx: number) => (
                        <span key={idx} className="bg-blue-100 text-blue-700 border border-blue-300 text-xs px-2 py-1 rounded-full">{turma.nome}</span>
                      ))
                    ) : (
                      <span className="text-gray-500 text-sm">Sem turma vinculada</span>
                    )}
                  </div>
                </div>

                {(fullParticipanteData?.observacoes || selectedParticipante?.observacoes) && (
                  <div>
                    <h4 className="font-semibold text-blue-600 mb-3">Observações</h4>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm">{fullParticipanteData?.observacoes || selectedParticipante?.observacoes}</p>
                    </div>
                  </div>
                )}

                <div>
                  <h4 className="font-semibold text-blue-600 mb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4" /> Arquivos e Documentos
                  </h4>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        id="doc-upload-inclusao-section"
                        accept=".pdf,.jpg,.jpeg,.png,.webp"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file || !selectedParticipante?.id) return;
                          setUploadingDocumento(true);
                          const formData = new FormData();
                          formData.append('documento', file);
                          formData.append('tipoDocumento', 'Documento');
                          try {
                            const res = await fetch(`/api/documentos/participante-inclusao/${selectedParticipante.id}`, { method: 'POST', body: formData });
                            const data = await res.json();
                            if (data.success) {
                              toast({ title: "Documento enviado com sucesso!" });
                              const docsRes = await fetch(`/api/documentos/participante-inclusao/${selectedParticipante.id}`);
                              const docsData = await docsRes.json();
                              setParticipanteDocumentos(docsData || []);
                            } else {
                              toast({ title: "Erro ao enviar documento", variant: "destructive" });
                            }
                          } catch {
                            toast({ title: "Erro ao enviar documento", variant: "destructive" });
                          } finally {
                            setUploadingDocumento(false);
                            e.target.value = '';
                          }
                        }}
                      />
                      <Button type="button" variant="outline" size="sm" disabled={uploadingDocumento} onClick={() => document.getElementById('doc-upload-inclusao-section')?.click()}>
                        <Upload className="w-4 h-4 mr-2" />
                        {uploadingDocumento ? 'Enviando...' : 'Enviar Documento'}
                      </Button>
                      <span className="text-xs text-gray-500">PDF, JPG, PNG (max 10MB)</span>
                    </div>
                    {participanteDocumentos.length === 0 ? (
                      <p className="text-sm text-gray-500">Nenhum documento cadastrado.</p>
                    ) : (
                      <div className="space-y-2">
                        {participanteDocumentos.map((doc: any) => (
                          <div key={doc.id} className="flex items-center justify-between bg-white p-2 rounded border">
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4 text-blue-500" />
                              <div>
                                <p className="text-sm font-medium">{doc.nomeArquivo || doc.nome_arquivo}</p>
                                <p className="text-xs text-gray-500">{doc.tipoDocumento || doc.tipo_documento || 'Documento'} • {(doc.createdAt || doc.created_at) ? new Date(doc.createdAt || doc.created_at).toLocaleDateString('pt-BR') : ''}</p>
                              </div>
                            </div>
                            <div className="flex gap-1">
                              <Button size="sm" variant="ghost" onClick={() => { setDocumentoPreviewUrl(doc.urlArquivo || doc.url_arquivo); setDocumentoPreviewNome(doc.nomeArquivo || doc.nome_arquivo || 'Documento'); setShowDocumentoPreviewModal(true); }}>
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-700" onClick={async () => {
                                if (!confirm('Excluir este documento?')) return;
                                try {
                                  await fetch(`/api/documentos/${doc.id}`, { method: 'DELETE' });
                                  toast({ title: "Documento excluído" });
                                  setParticipanteDocumentos(prev => prev.filter((d: any) => d.id !== doc.id));
                                } catch {
                                  toast({ title: "Erro ao excluir documento", variant: "destructive" });
                                }
                              }}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
            onEdit={() => {
              setShowDetalhesParticipanteModal(false);
              setShowEditParticipanteModal(true);
            }}
          />

                    <Dialog open={showInativarParticipanteModal} onOpenChange={setShowInativarParticipanteModal}>
            <DialogContent>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  {selectedParticipante?.status === 'inativo' ? (
                    <User className="w-8 h-8 text-green-500" />
                  ) : (
                    <UserX className="w-8 h-8 text-orange-500" />
                  )}
                  <DialogTitle>
                    {selectedParticipante?.status === 'inativo' ? 'Reativar Participante' : 'Inativar Participante'}
                  </DialogTitle>
                </div>
              </DialogHeader>
              <p className="text-gray-600">
                {selectedParticipante?.status === 'inativo'
                  ? `Tem certeza que deseja reativar o participante "${selectedParticipante?.nome}"?`
                  : `Tem certeza que deseja inativar o participante "${selectedParticipante?.nome}"? O participante não será excluído, apenas marcado como inativo.`
                }
              </p>
              <div className="flex gap-2 pt-4">
                <Button variant="outline" onClick={() => setShowInativarParticipanteModal(false)}>
                  Cancelar
                </Button>
                <Button
                  className={selectedParticipante?.status === 'inativo' ? "bg-green-500 hover:bg-green-600" : "bg-orange-500 hover:bg-orange-600"}
                  onClick={async () => {
                    if (selectedParticipante?.id) {
                      try {
                        const newStatus = selectedParticipante.status === 'inativo' ? 'ativo' : 'inativo';
                        await apiRequest(`/api/participantes-inclusao/${selectedParticipante.id}`, {
                          method: 'PATCH',
                          body: JSON.stringify({ status: newStatus })
                        });
                        await queryClient.refetchQueries({ queryKey: ['/api/participantes-inclusao'] });
                        if (newStatus === 'inativo') {
                          setStatusFilterParticipantes('todos');
                        }
                        toast({
                          title: selectedParticipante.status === 'inativo' ? "Participante reativado" : "Participante inativado",
                          description: selectedParticipante.status === 'inativo'
                            ? `${selectedParticipante.nome} foi reativado com sucesso.`
                            : `${selectedParticipante.nome} foi inativado com sucesso.`
                        });
                        setShowInativarParticipanteModal(false);
                        setSelectedParticipante(null);
                      } catch (error) {
                        toast({
                          title: "Erro",
                          description: "Não foi possível alterar o status do participante.",
                          variant: "destructive"
                        });
                      }
                    }
                  }}
                >
                  {selectedParticipante?.status === 'inativo' ? 'Reativar' : 'Inativar'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <ComprehensiveStudentForm
            open={showEditParticipanteModal}
            onClose={() => {
              setShowEditParticipanteModal(false);
              setSelectedParticipante(null);
            }}
            mode="inclusao"
            editId={selectedParticipante?.id}
          />

          <Dialog open={showDocumentoPreviewModal} onOpenChange={setShowDocumentoPreviewModal}>
            <DialogContent className="max-w-4xl max-h-[90vh]">
              <DialogHeader>
                <DialogTitle>{documentoPreviewNome || 'Documento'}</DialogTitle>
              </DialogHeader>
              <div className="flex-1 overflow-auto" style={{ height: '70vh' }}>
                {documentoPreviewUrl && (documentoPreviewUrl.toLowerCase().endsWith('.pdf') ? (
                  <iframe
                    src={documentoPreviewUrl}
                    className="w-full h-full border-0"
                    title="Preview do documento"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <img
                      src={documentoPreviewUrl}
                      alt={documentoPreviewNome}
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                ))}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <input
            id="file-import-participantes"
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={handleImportExcel}
            style={{ display: 'none' }}
          />

          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar participantes por nome ou CPF..."
                className="pl-10"
                value={searchParticipante}
                onChange={(e) => setSearchParticipante(e.target.value)}
              />
            </div>
            <Select value={statusFilterParticipantes} onValueChange={setStatusFilterParticipantes}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="ativos">Ativos</SelectItem>
                <SelectItem value="inativos">Inativos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                {!readOnly && !hideSensitive && <TableHead>Foto</TableHead>}
                <TableHead>Nome</TableHead>
                {!readOnly && <TableHead>CPF</TableHead>}
                <TableHead>Telefone</TableHead>
                {readOnly && <TableHead>Nascimento</TableHead>}
                {!readOnly && <TableHead>Turmas</TableHead>}
                {!readOnly && !hideSensitive && <TableHead>Escolaridade</TableHead>}
                {!readOnly && <TableHead>Ações</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingParticipantes ? (
                <TableRow>
                  <TableCell colSpan={readOnly ? 3 : 7} className="text-center text-gray-500 py-8">
                    Carregando participantes...
                  </TableCell>
                </TableRow>
              ) : participantesData.filter((p: any) => {
                  const matchesSearch = (p.nome || '').toLowerCase().includes(searchParticipante.toLowerCase()) || (p.cpf || '').includes(searchParticipante);
                  let matchesStatus = true;
                  if (statusFilterParticipantes === 'ativos') matchesStatus = p.status !== 'inativo';
                  if (statusFilterParticipantes === 'inativos') matchesStatus = p.status === 'inativo';
                  const matchesTurma = !filtroTurmaIds || filtroTurmaIds.length === 0 || (p.turmas && p.turmas.some((t: any) => filtroTurmaIds.includes(t.id)));
                  return matchesSearch && matchesStatus && matchesTurma;
                }).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={readOnly ? 3 : 7} className="text-center text-gray-500 py-8">
                    {searchParticipante ? "Nenhum participante encontrado." : readOnly ? "Nenhum participante nas suas turmas." : "Nenhum participante cadastrado. Clique em \"Adicionar Participante\" para começar."}
                  </TableCell>
                </TableRow>
              ) : (
                participantesData
                  .filter((p: any) => {
                    const matchesSearch = (p.nome || '').toLowerCase().includes(searchParticipante.toLowerCase()) || (p.cpf || '').includes(searchParticipante);
                    let matchesStatus = true;
                    if (statusFilterParticipantes === 'ativos') matchesStatus = p.status !== 'inativo';
                    if (statusFilterParticipantes === 'inativos') matchesStatus = p.status === 'inativo';
                    const matchesTurma = !filtroTurmaIds || filtroTurmaIds.length === 0 || (p.turmas && p.turmas.some((t: any) => filtroTurmaIds.includes(t.id)));
                    return matchesSearch && matchesStatus && matchesTurma;
                  })
                  .map((participante: any) => (
                  <TableRow key={participante.id}>
                    {!readOnly && !hideSensitive && (
                      <TableCell>
                        {participante.foto_perfil && participante.foto_perfil.trim() ? (
                          <img
                            src={participante.foto_perfil}
                            alt={participante.nome}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <User className="w-5 h-5 text-blue-500" />
                          </div>
                        )}
                      </TableCell>
                    )}
                    <TableCell className="font-medium">
                      <span className="flex items-center gap-2">
                        {participante.nome}
                        {participante.status === 'inativo' && (
                          <span className="text-xs bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded">Inativo</span>
                        )}
                      </span>
                    </TableCell>
                    {!readOnly && <TableCell>{hideSensitive ? maskCpfSection(participante.cpf) : formatCPF(participante.cpf)}</TableCell>}
                    <TableCell>{participante.telefone}</TableCell>
                    {readOnly && (
                      <TableCell>
                        {participante.dataNascimento || participante.data_nascimento
                          ? new Date((participante.dataNascimento || participante.data_nascimento) + 'T12:00:00').toLocaleDateString('pt-BR')
                          : '-'}
                      </TableCell>
                    )}
                    {!readOnly && (
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {participante.turmas && participante.turmas.filter((t: any) => t.status !== 'concluido').length > 0 ? (
                            participante.turmas
                              .filter((t: any) => t.status !== 'concluido')
                              .map((turma: any, idx: number) => (
                              <Badge key={idx} className="bg-white border border-blue-500 text-blue-700 text-xs hover:bg-blue-50">
                                {turma.nome}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-sm text-gray-400">Sem turma</span>
                          )}
                        </div>
                      </TableCell>
                    )}
                    {!readOnly && !hideSensitive && <TableCell>{participante.escolaridade}</TableCell>}
                    {!readOnly && (
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={async () => {
                            setSelectedParticipante(participante);
                            setLoadingParticipanteDetails(true);
                            setShowDetalhesParticipanteModal(true);
                            try {
                              const res = await fetch(`/api/participantes-inclusao/${participante.id}`);
                              const data = await res.json();
                              setFullParticipanteData(data);
                              try {
                                const docsRes = await fetch(`/api/documentos/participante-inclusao/${participante.id}`);
                                const docsData = await docsRes.json();
                                setParticipanteDocumentos(docsData || []);
                              } catch (e) {
                                setParticipanteDocumentos([]);
                              }
                            } catch (err) {
                              console.error('Erro ao buscar dados do participante:', err);
                            } finally {
                              setLoadingParticipanteDetails(false);
                            }
                          }}
                          data-testid={`button-view-participant-${participante.id}`}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setSelectedParticipante(participante);
                            setShowEditParticipanteModal(true);
                          }}
                          data-testid={`button-edit-participant-${participante.id}`}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className={participante.status === 'inativo' ? "text-green-500 hover:text-green-700" : "text-orange-500 hover:text-orange-700"}
                          onClick={() => {
                            setSelectedParticipante(participante);
                            setShowInativarParticipanteModal(true);
                          }}
                          title={participante.status === 'inativo' ? "Reativar participante" : "Inativar participante"}
                          data-testid={`button-toggle-status-participant-${participante.id}`}
                        >
                          {participante.status === 'inativo' ? (
                            <User className="w-4 h-4" />
                          ) : (
                            <UserX className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
