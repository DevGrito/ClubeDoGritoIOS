import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { format } from 'date-fns';
import { CalendarIcon, Plus, X, Upload } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';

// Schema para o formulário completo de cadastro de aluno
const studentRegistrationSchema = z.object({
  // SEÇÃO 1: Identificação
  nome_completo: z.string().min(1, "Nome é obrigatório"),
  data_nascimento: z.date({ required_error: "Data de nascimento é obrigatória" }),
  genero: z.enum(['feminino', 'masculino', 'nao_binario', 'nao_informado'], {
    required_error: "Gênero é obrigatório"
  }),
  foto_perfil: z.string().optional(),
  numero_matricula: z.string().optional(),
  estado_civil: z.string().optional(),
  religiao: z.string().optional(),
  naturalidade: z.string().optional(),
  nacionalidade: z.string().default("Brasil"),
  pode_sair_sozinho: z.enum(['sim', 'nao']).optional(),
  tamanho_calca: z.string().optional(),
  tamanho_camiseta: z.string().optional(),
  tamanho_calcado: z.string().optional(),
  cor_raca: z.enum(['branca', 'preta', 'parda', 'amarela', 'indigena', 'nao_sabe_informar']).optional(),
  frequenta_projeto_social: z.enum(['sim', 'nao']).optional(),
  projeto_social_qual: z.string().optional(),
  acesso_internet: z.enum(['sim', 'nao']).optional(),
  internet_qual: z.string().optional(),
  
  // SEÇÃO 2: Documentos
  cpf: z.string().min(11, "CPF é obrigatório"),
  rg: z.string().optional(),
  orgao_emissor: z.string().optional(),
  ctps_numero: z.string().optional(),
  ctps_serie: z.string().optional(),
  titulo_eleitor: z.string().optional(),
  nis_pis_pasep: z.string().optional(),
  documentos_possui: z.array(z.string()).optional(),
  
  // SEÇÃO 3: Contato
  email: z.string().email("Email inválido").optional().or(z.literal('')),
  telefone: z.string().min(10, "Telefone é obrigatório"),
  telefone_whatsapp: z.boolean().default(false),
  telefones_adicionais: z.array(z.object({
    numero: z.string(),
    whatsapp: z.boolean()
  })).optional(),
  contatos_emergencia: z.array(z.object({
    nome: z.string(),
    telefone: z.string(),
    whatsapp: z.boolean()
  })).optional(),
  
  // SEÇÃO 4: Benefícios Sociais
  cadunico: z.enum(['sim', 'nao']).optional(),
  bolsa_familia: z.enum(['sim', 'nao']).optional(),
  bpc: z.enum(['sim', 'nao']).optional(),
  cartao_alimentacao: z.enum(['sim', 'nao']).optional(),
  outros_beneficios: z.enum(['sim', 'nao']).optional(),
  
  // SEÇÃO 5: Informações Adicionais
  data_entrada: z.date({ required_error: "Data de entrada é obrigatória" }),
  forma_acesso: z.string().min(1, "Forma de acesso é obrigatória"),
  demandas: z.array(z.string()).optional(),
  observacoes_gerais: z.string().optional(),
  
  // SEÇÃO 6: Escolar
  serie: z.string().optional(),
  situacao_escolar: z.enum(['cursando', 'interrompido', 'concluido']).optional(),
  turno_escolar: z.array(z.enum(['matutino', 'vespertino', 'noturno'])).optional(),
  instituicao_ensino: z.string().optional(),
  e_alfabetizado: z.enum(['sabe_ler_escrever', 'nao_sabe_ler_nem_escrever', 'nao_sabe_ler_nem_escrever_mas_assina']).optional(),
  bairro_escola: z.string().optional(),
  
  // SEÇÃO 7: Profissional
  procura_trabalho: z.enum(['sim', 'nao']).optional(),
  trabalhos_atuais: z.array(z.object({
    situacao: z.string(),
    entrada: z.string(),
    saida: z.string().optional(),
    profissao: z.string(),
    empresa: z.string(),
    remuneracao: z.string().optional(),
    telefone: z.string().optional()
  })).optional(),
  experiencias_profissionais: z.array(z.object({
    situacao: z.string(),
    entrada: z.string(),
    saida: z.string(),
    profissao: z.string(),
    empresa: z.string(),
    remuneracao: z.string().optional()
  })).optional(),
  
  // SEÇÃO 8: Saúde
  possui_particularidade_saude: z.enum(['sim', 'nao', 'nao_informado']).optional(),
  detalhes_particularidade: z.string().optional(),
  possui_alergia: z.enum(['sim', 'nao', 'nao_informado']).optional(),
  detalhes_alergia: z.string().optional(),
  faz_uso_medicamento: z.enum(['sim', 'nao']).optional(),
  detalhes_medicamento: z.string().optional(),
  possui_deficiencia: z.enum(['sim', 'nao_possui', 'nao_informado']).optional(),
  detalhes_deficiencia: z.string().optional(),
  contatos_saude: z.object({
    nome: z.string(),
    telefone: z.string()
  }).optional(),
  faz_uso_quimicos: z.enum(['sim', 'nao_possui', 'nao_informado']).optional(),
  familiar_usa_quimicos: z.enum(['sim', 'nao_possui', 'nao_informado']).optional(),
  tipo_sanguineo: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).optional(),
  restricao_alimentar: z.enum(['sim', 'nao']).optional(),
  detalhes_restricao_alimentar: z.string().optional(),
  possui_convenio_medico: z.enum(['sim', 'nao']).optional(),
  detalhes_convenio_medico: z.string().optional(),
  historico_medico: z.enum(['sim', 'nao']).optional(),
  ja_teve_ou_costuma_ter: z.array(z.enum(['desmaios', 'convulsoes', 'dores_cabeca', 'perda_consciencia', 'enjoos'])).optional(),
  detalhes_historico_medico: z.string().optional(),
  
  // SEÇÃO 9: Relações
  relacionamentos_familiares: z.array(z.object({
    nome: z.string(),
    parentesco: z.string(),
    relacao: z.string()
  })).optional(),
  outros_relacionamentos: z.array(z.object({
    nome: z.string(),
    parentesco: z.string(),
    relacao: z.string()
  })).optional(),
  
  // SEÇÃO 10: Grupos (apenas visualização, não edição)
  
  // Campos do sistema
  professorId: z.number().optional(),
});

type StudentRegistrationData = z.infer<typeof studentRegistrationSchema>;

interface ComprehensiveStudentFormProps {
  open: boolean;
  onClose: () => void;
}

export function ComprehensiveStudentForm({ open, onClose }: ComprehensiveStudentFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentSection, setCurrentSection] = useState(1);
  const [additionalPhones, setAdditionalPhones] = useState<Array<{ numero: string; whatsapp: boolean }>>([]);
  const [emergencyContacts, setEmergencyContacts] = useState<Array<{ nome: string; telefone: string; whatsapp: boolean }>>([]);
  
  const form = useForm<StudentRegistrationData>({
    resolver: zodResolver(studentRegistrationSchema),
    defaultValues: {
      genero: 'feminino',
      nacionalidade: 'Brasil',
      telefone_whatsapp: false,
      cadunico: 'nao',
      bolsa_familia: 'nao',
      bpc: 'nao',
      cartao_alimentacao: 'nao',
      outros_beneficios: 'nao',
      forma_acesso: 'Busca ativa',
      telefones_adicionais: [],
      contatos_emergencia: [],
      demandas: [],
      documentos_possui: []
    }
  });

  const createStudentMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('/api/professor/students', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/students/all'] });
      queryClient.invalidateQueries({ queryKey: ['/api/professor/students'] });
      toast({
        title: "Aluno cadastrado com sucesso!",
        description: "O cadastro foi realizado."
      });
      onClose();
      form.reset();
      setCurrentSection(1);
      setAdditionalPhones([]);
      setEmergencyContacts([]);
    },
    onError: (error: any) => {
      console.error('Erro ao cadastrar aluno:', error);
      toast({
        title: "Erro ao cadastrar aluno",
        description: error.message || "Ocorreu um erro ao cadastrar o aluno.",
        variant: "destructive"
      });
    }
  });

  const onSubmit = (data: StudentRegistrationData) => {
    // Preparar dados para envio
    const formattedData = {
      cpf: data.cpf,
      nome_completo: data.nome_completo,
      foto_perfil: data.foto_perfil,
      data_nascimento: format(data.data_nascimento, 'yyyy-MM-dd'),
      genero: data.genero,
      numero_matricula: data.numero_matricula,
      estado_civil: data.estado_civil,
      religiao: data.religiao,
      naturalidade: data.naturalidade,
      nacionalidade: data.nacionalidade,
      pode_sair_sozinho: data.pode_sair_sozinho,
      tamanho_calca: data.tamanho_calca,
      tamanho_camiseta: data.tamanho_camiseta,
      tamanho_calcado: data.tamanho_calcado,
      cor_raca: data.cor_raca,
      frequenta_projeto_social: data.frequenta_projeto_social,
      acesso_internet: data.acesso_internet,
      
      // Documentos
      rg: data.rg,
      orgao_emissor: data.orgao_emissor,
      ctps_numero: data.ctps_numero,
      ctps_serie: data.ctps_serie,
      titulo_eleitor: data.titulo_eleitor,
      nis_pis_pasep: data.nis_pis_pasep,
      documentos_possui: data.documentos_possui,
      
      // Contato
      email: data.email,
      telefone: data.telefone,
      whatsapp: data.telefone_whatsapp ? data.telefone : undefined,
      contatos_emergencia: data.contatos_emergencia || [],
      
      // Benefícios
      cadunico: data.cadunico,
      bolsa_familia: data.bolsa_familia,
      bpc: data.bpc,
      cartao_alimentacao: data.cartao_alimentacao,
      outros_beneficios: data.outros_beneficios,
      
      // Informações adicionais
      data_entrada: format(data.data_entrada, 'yyyy-MM-dd'),
      forma_acesso: data.forma_acesso,
      demandas: data.demandas || [],
      observacoes_gerais: data.observacoes_gerais,
      
      // SEÇÃO 6: Escolar
      serie: data.serie,
      situacao_escolar: data.situacao_escolar,
      turno_escolar: data.turno_escolar,
      instituicao_ensino: data.instituicao_ensino,
      e_alfabetizado: data.e_alfabetizado,
      bairro_escola: data.bairro_escola,
      
      // SEÇÃO 7: Profissional
      trabalhos_atuais: data.trabalhos_atuais,
      experiencias_profissionais: data.experiencias_profissionais,
      
      // SEÇÃO 8: Saúde
      possui_particularidade_saude: data.possui_particularidade_saude,
      detalhes_particularidade: data.detalhes_particularidade,
      possui_alergia: data.possui_alergia,
      detalhes_alergia: data.detalhes_alergia,
      faz_uso_medicamento: data.faz_uso_medicamento,
      detalhes_medicamento: data.detalhes_medicamento,
      possui_deficiencia: data.possui_deficiencia,
      detalhes_deficiencia: data.detalhes_deficiencia,
      contatos_saude: data.contatos_saude,
      faz_uso_quimicos: data.faz_uso_quimicos,
      familiar_usa_quimicos: data.familiar_usa_quimicos,
      tipo_sanguineo: data.tipo_sanguineo,
      restricao_alimentar: data.restricao_alimentar,
      detalhes_restricao_alimentar: data.detalhes_restricao_alimentar,
      possui_convenio_medico: data.possui_convenio_medico,
      detalhes_convenio_medico: data.detalhes_convenio_medico,
      historico_medico: data.historico_medico,
      ja_teve_ou_costuma_ter: data.ja_teve_ou_costuma_ter,
      detalhes_historico_medico: data.detalhes_historico_medico,
      
      // Sistema
      professorId: data.professorId || parseInt(localStorage.getItem('userId') || '0')
    };

    createStudentMutation.mutate(formattedData);
  };

  const addPhone = () => {
    const currentPhones = form.getValues('telefones_adicionais') || [];
    form.setValue('telefones_adicionais', [...currentPhones, { numero: '', whatsapp: false }]);
  };

  const removePhone = (index: number) => {
    const currentPhones = form.getValues('telefones_adicionais') || [];
    form.setValue('telefones_adicionais', currentPhones.filter((_, i) => i !== index));
  };

  const addEmergencyContact = () => {
    const currentContacts = form.getValues('contatos_emergencia') || [];
    form.setValue('contatos_emergencia', [...currentContacts, { nome: '', telefone: '', whatsapp: false }]);
  };

  const removeEmergencyContact = (index: number) => {
    const currentContacts = form.getValues('contatos_emergencia') || [];
    form.setValue('contatos_emergencia', currentContacts.filter((_, i) => i !== index));
  };

  const nextSection = () => {
    setCurrentSection(prev => Math.min(prev + 1, 10));
  };

  const prevSection = () => {
    setCurrentSection(prev => Math.max(prev - 1, 1));
  };

  const demandasOptions = [
    'Acesso a benefícios eventuais',
    'Acolhimento Institucional',
    'Atendimento Médico',
    'Atendimento Odontológico',
    'Atividades de contra turno',
    'Capacitação Profissional',
    'Grupos de Convivência',
    'Serviços Socioassistenciais'
  ];

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Cadastro Completo de Aluno</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Progress indicator */}
            <div className="flex items-center justify-between mb-6 overflow-x-auto">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((section) => (
                <div key={section} className="flex items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${
                      currentSection === section
                        ? 'bg-orange-500 text-white'
                        : currentSection > section
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {section}
                  </div>
                  {section < 10 && (
                    <div className={`w-6 h-1 ${currentSection > section ? 'bg-green-500' : 'bg-gray-200'}`} />
                  )}
                </div>
              ))}
            </div>

            <div className="text-sm text-gray-600 mb-4">
              {currentSection === 1 && "Seção 1: Identificação"}
              {currentSection === 2 && "Seção 2: Documentos"}
              {currentSection === 3 && "Seção 3: Contato"}
              {currentSection === 4 && "Seção 4: Benefícios Sociais"}
              {currentSection === 5 && "Seção 5: Informações Adicionais"}
              {currentSection === 6 && "Seção 6: Escolar"}
              {currentSection === 7 && "Seção 7: Profissional"}
              {currentSection === 8 && "Seção 8: Saúde"}
              {currentSection === 9 && "Seção 9: Relações"}
              {currentSection === 10 && "Seção 10: Grupos"}
            </div>

            {/* SEÇÃO 1: Identificação */}
            {currentSection === 1 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Identificação</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="nome_completo"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>Nome *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Nome completo" data-testid="input-nome" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="data_nascimento"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data de Nascimento *</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className="w-full justify-start text-left font-normal"
                                data-testid="button-data-nascimento"
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {field.value ? format(field.value, 'dd/MM/yyyy') : 'Selecione'}
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              initialFocus
                              captionLayout="dropdown-buttons"
                              fromYear={1900}
                              toYear={new Date().getFullYear()}
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="genero"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Gênero *</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            value={field.value}
                            className="flex flex-wrap gap-4"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="feminino" id="feminino" data-testid="radio-feminino" />
                              <Label htmlFor="feminino">Feminino</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="masculino" id="masculino" data-testid="radio-masculino" />
                              <Label htmlFor="masculino">Masculino</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="nao_binario" id="nao_binario" data-testid="radio-nao-binario" />
                              <Label htmlFor="nao_binario">Não binário</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="nao_informado" id="nao_informado" data-testid="radio-nao-informado" />
                              <Label htmlFor="nao_informado">Não informado</Label>
                            </div>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="numero_matricula"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nº de Matrícula</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="3903" data-testid="input-matricula" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="estado_civil"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estado Civil</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-estado-civil">
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="solteiro">Solteiro(a)</SelectItem>
                            <SelectItem value="casado">Casado(a)</SelectItem>
                            <SelectItem value="divorciado">Divorciado(a)</SelectItem>
                            <SelectItem value="viuvo">Viúvo(a)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="religiao"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Religião</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-religiao">
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="catolica">Católica</SelectItem>
                            <SelectItem value="evangelica">Evangélica</SelectItem>
                            <SelectItem value="espirita">Espírita</SelectItem>
                            <SelectItem value="umbanda">Umbanda</SelectItem>
                            <SelectItem value="candomble">Candomblé</SelectItem>
                            <SelectItem value="sem_religiao">Sem religião</SelectItem>
                            <SelectItem value="outra">Outra</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="naturalidade"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Naturalidade</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Cidade de nascimento" data-testid="input-naturalidade" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="nacionalidade"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nacionalidade</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-nacionalidade">
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Brasil">Brasil</SelectItem>
                            <SelectItem value="Argentina">Argentina</SelectItem>
                            <SelectItem value="Bolivia">Bolívia</SelectItem>
                            <SelectItem value="Chile">Chile</SelectItem>
                            <SelectItem value="Colombia">Colômbia</SelectItem>
                            <SelectItem value="Paraguay">Paraguai</SelectItem>
                            <SelectItem value="Peru">Peru</SelectItem>
                            <SelectItem value="Uruguay">Uruguai</SelectItem>
                            <SelectItem value="Venezuela">Venezuela</SelectItem>
                            <SelectItem value="Outro">Outro</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="pode_sair_sozinho"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Pode sair sozinho da instituição?</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            value={field.value}
                            className="flex gap-4"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="nao" id="nao-sair" data-testid="radio-nao-sair" />
                              <Label htmlFor="nao-sair">Não</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="sim" id="sim-sair" data-testid="radio-sim-sair" />
                              <Label htmlFor="sim-sair">Sim</Label>
                            </div>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="border-t pt-4 mt-4">
                  <h4 className="font-semibold mb-4">DADOS COMPLEMENTARES DO(A) MATRICULADO(A) - TAMANHO</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="tamanho_calca"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Calça</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Ex: 42" data-testid="input-calca" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="tamanho_camiseta"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Camiseta</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Ex: M" data-testid="input-camiseta" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="tamanho_calcado"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Calçado</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Ex: 38" data-testid="input-calcado" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="cor_raca"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>COR/RAÇA</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          value={field.value}
                          className="flex flex-wrap gap-4"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="branca" id="branca" data-testid="radio-branca" />
                            <Label htmlFor="branca">Branca</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="preta" id="preta" data-testid="radio-preta" />
                            <Label htmlFor="preta">Preta</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="parda" id="parda" data-testid="radio-parda" />
                            <Label htmlFor="parda">Parda</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="amarela" id="amarela" data-testid="radio-amarela" />
                            <Label htmlFor="amarela">Amarela</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="indigena" id="indigena" data-testid="radio-indigena" />
                            <Label htmlFor="indigena">Indígena</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="nao_sabe_informar" id="nao_sabe_informar" data-testid="radio-nao-sabe-informar" />
                            <Label htmlFor="nao_sabe_informar">Não sabe informar</Label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="frequenta_projeto_social"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>FREQUENTA ALGUM PROJETO SOCIAL?</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          value={field.value}
                          className="flex gap-4"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="sim" id="projeto-sim" data-testid="radio-projeto-sim" />
                            <Label htmlFor="projeto-sim">Sim</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="nao" id="projeto-nao" data-testid="radio-projeto-nao" />
                            <Label htmlFor="projeto-nao">Não</Label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {form.watch('frequenta_projeto_social') === 'sim' && (
                  <FormField
                    control={form.control}
                    name="projeto_social_qual"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>SE SIM, QUAL?</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Nome do projeto social" data-testid="input-projeto-qual" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="acesso_internet"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>POSSUI ACESSO A INTERNET?</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          value={field.value}
                          className="flex gap-4"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="sim" id="internet-sim" data-testid="radio-internet-sim" />
                            <Label htmlFor="internet-sim">Sim</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="nao" id="internet-nao" data-testid="radio-internet-nao" />
                            <Label htmlFor="internet-nao">Não</Label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {form.watch('acesso_internet') === 'sim' && (
                  <FormField
                    control={form.control}
                    name="internet_qual"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>SE SIM, QUAL?</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Tipo de acesso à internet" data-testid="input-internet-qual" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>
            )}

            {/* SEÇÃO 2: Documentos */}
            {currentSection === 2 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Documentos</h3>
                
                <FormField
                  control={form.control}
                  name="cpf"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CPF *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="000.000.000-00" data-testid="input-cpf" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="rg"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>RG</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="00.000.000-0" data-testid="input-rg" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="orgao_emissor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Órgão emissor</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="SSP/SP" data-testid="input-orgao-emissor" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="ctps_numero"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Carteira de Trabalho e Previdência Social</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Número" data-testid="input-ctps-numero" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="ctps_serie"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Série da Carteira de Trabalho e Previdência Social</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Série" data-testid="input-ctps-serie" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="titulo_eleitor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Título de eleitor</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Número" data-testid="input-titulo-eleitor" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="nis_pis_pasep"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>NIS/PIS/PASEP</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Número" data-testid="input-nis-pis-pasep" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="documentos_possui"
                  render={() => (
                    <FormItem>
                      <FormLabel>Documentos que possui</FormLabel>
                      <div className="space-y-2">
                        {['Certidão de Nascimento', 'Certidão de Casamento', 'Certificado de Reservista', 'Carteira de Trabalho'].map((doc) => (
                          <FormField
                            key={doc}
                            control={form.control}
                            name="documentos_possui"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(doc)}
                                    onCheckedChange={(checked) => {
                                      const value = field.value || [];
                                      if (checked) {
                                        field.onChange([...value, doc]);
                                      } else {
                                        field.onChange(value.filter((v) => v !== doc));
                                      }
                                    }}
                                    data-testid={`checkbox-${doc.toLowerCase().replace(/\s/g, '-')}`}
                                  />
                                </FormControl>
                                <FormLabel className="font-normal">{doc}</FormLabel>
                              </FormItem>
                            )}
                          />
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* SEÇÃO 3: Contato */}
            {currentSection === 3 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Contato</h3>
                
                <h4 className="font-semibold text-sm">Pessoal (contato direto ao atendido)</h4>
                
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>E-mail</FormLabel>
                      <FormControl>
                        <Input {...field} type="email" placeholder="email@exemplo.com" data-testid="input-email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-2">
                  <FormField
                    control={form.control}
                    name="telefone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telefone *</FormLabel>
                        <div className="flex gap-2">
                          <FormControl>
                            <Input {...field} placeholder="(00) 00000-0000" className="flex-1" data-testid="input-telefone" />
                          </FormControl>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="telefone_whatsapp"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="checkbox-telefone-whatsapp"
                          />
                        </FormControl>
                        <FormLabel className="font-normal">WhatsApp</FormLabel>
                      </FormItem>
                    )}
                  />

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addPhone}
                    className="mt-2"
                    data-testid="button-adicionar-telefone"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar telefone
                  </Button>
                </div>

                {form.watch('telefones_adicionais')?.map((phone, index) => (
                  <div key={index} className="flex gap-2 items-start border-l-2 border-gray-300 pl-4">
                    <div className="flex-1 space-y-2">
                      <Input
                        placeholder="Telefone adicional"
                        value={phone.numero}
                        onChange={(e) => {
                          const phones = form.getValues('telefones_adicionais') || [];
                          phones[index].numero = e.target.value;
                          form.setValue('telefones_adicionais', [...phones]);
                        }}
                        data-testid={`input-telefone-adicional-${index}`}
                      />
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={phone.whatsapp}
                          onCheckedChange={(checked) => {
                            const phones = form.getValues('telefones_adicionais') || [];
                            phones[index].whatsapp = !!checked;
                            form.setValue('telefones_adicionais', [...phones]);
                          }}
                          data-testid={`checkbox-whatsapp-adicional-${index}`}
                        />
                        <Label>WhatsApp</Label>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removePhone(index)}
                      data-testid={`button-remover-telefone-${index}`}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}

                <div className="border-t pt-4 mt-4">
                  <h4 className="font-semibold text-sm mb-4">Pessoas para contato</h4>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addEmergencyContact}
                    className="mb-4"
                    data-testid="button-adicionar-pessoa"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar pessoa
                  </Button>

                  {form.watch('contatos_emergencia')?.map((contact, index) => (
                    <Card key={index} className="mb-4">
                      <CardContent className="pt-4">
                        <div className="space-y-2">
                          <div className="flex justify-between items-start">
                            <Label>Nome</Label>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeEmergencyContact(index)}
                              data-testid={`button-remover-contato-${index}`}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                          <Input
                            placeholder="Nome completo"
                            value={contact.nome}
                            onChange={(e) => {
                              const contacts = form.getValues('contatos_emergencia') || [];
                              contacts[index].nome = e.target.value;
                              form.setValue('contatos_emergencia', [...contacts]);
                            }}
                            data-testid={`input-contato-nome-${index}`}
                          />
                          <Label>Telefone</Label>
                          <Input
                            placeholder="(00) 00000-0000"
                            value={contact.telefone}
                            onChange={(e) => {
                              const contacts = form.getValues('contatos_emergencia') || [];
                              contacts[index].telefone = e.target.value;
                              form.setValue('contatos_emergencia', [...contacts]);
                            }}
                            data-testid={`input-contato-telefone-${index}`}
                          />
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              checked={contact.whatsapp}
                              onCheckedChange={(checked) => {
                                const contacts = form.getValues('contatos_emergencia') || [];
                                contacts[index].whatsapp = !!checked;
                                form.setValue('contatos_emergencia', [...contacts]);
                              }}
                              data-testid={`checkbox-contato-whatsapp-${index}`}
                            />
                            <Label>WhatsApp</Label>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* SEÇÃO 4: Benefícios Sociais */}
            {currentSection === 4 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Benefícios Sociais</h3>
                
                <FormField
                  control={form.control}
                  name="cadunico"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Família está cadastrada no CADÚNICO?</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          value={field.value}
                          className="flex gap-4"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="sim" id="cadunico-sim" data-testid="radio-cadunico-sim" />
                            <Label htmlFor="cadunico-sim">Sim</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="nao" id="cadunico-nao" data-testid="radio-cadunico-nao" />
                            <Label htmlFor="cadunico-nao">Não</Label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="border-t pt-4 mt-4">
                  <h4 className="font-semibold text-sm mb-4">Família recebe quais benefícios sociais?</h4>

                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="bolsa_familia"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bolsa Família</FormLabel>
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              value={field.value}
                              className="flex gap-4"
                            >
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="sim" id="bolsa-sim" data-testid="radio-bolsa-sim" />
                                <Label htmlFor="bolsa-sim">Sim</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="nao" id="bolsa-nao" data-testid="radio-bolsa-nao" />
                                <Label htmlFor="bolsa-nao">Não</Label>
                              </div>
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="bpc"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>BPC</FormLabel>
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              value={field.value}
                              className="flex gap-4"
                            >
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="sim" id="bpc-sim" data-testid="radio-bpc-sim" />
                                <Label htmlFor="bpc-sim">Sim</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="nao" id="bpc-nao" data-testid="radio-bpc-nao" />
                                <Label htmlFor="bpc-nao">Não</Label>
                              </div>
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="cartao_alimentacao"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cartão Alimentação</FormLabel>
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              value={field.value}
                              className="flex gap-4"
                            >
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="sim" id="cartao-sim" data-testid="radio-cartao-sim" />
                                <Label htmlFor="cartao-sim">Sim</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="nao" id="cartao-nao" data-testid="radio-cartao-nao" />
                                <Label htmlFor="cartao-nao">Não</Label>
                              </div>
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="outros_beneficios"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Outros</FormLabel>
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              value={field.value}
                              className="flex gap-4"
                            >
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="sim" id="outros-sim" data-testid="radio-outros-sim" />
                                <Label htmlFor="outros-sim">Sim</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="nao" id="outros-nao" data-testid="radio-outros-nao" />
                                <Label htmlFor="outros-nao">Não</Label>
                              </div>
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* SEÇÃO 5: Informações Adicionais */}
            {currentSection === 5 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Informações Adicionais</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="data_entrada"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data de entrada *</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className="w-full justify-start text-left font-normal"
                                data-testid="button-data-entrada"
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {field.value ? format(field.value, 'dd/MM/yyyy') : 'Selecione'}
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="forma_acesso"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Forma de Acesso *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-forma-acesso">
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Busca ativa">Busca ativa</SelectItem>
                            <SelectItem value="Demanda espontânea">Demanda espontânea</SelectItem>
                            <SelectItem value="Encaminhamento da rede">Encaminhamento da rede</SelectItem>
                            <SelectItem value="Outros">Outros</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="demandas"
                  render={() => (
                    <FormItem>
                      <FormLabel>Demandas</FormLabel>
                      <div className="grid grid-cols-2 gap-4">
                        {demandasOptions.map((demanda) => (
                          <FormField
                            key={demanda}
                            control={form.control}
                            name="demandas"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(demanda)}
                                    onCheckedChange={(checked) => {
                                      const value = field.value || [];
                                      if (checked) {
                                        field.onChange([...value, demanda]);
                                      } else {
                                        field.onChange(value.filter((v) => v !== demanda));
                                      }
                                    }}
                                    data-testid={`checkbox-${demanda.toLowerCase().replace(/\s/g, '-')}`}
                                  />
                                </FormControl>
                                <FormLabel className="font-normal text-sm">{demanda}</FormLabel>
                              </FormItem>
                            )}
                          />
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="observacoes_gerais"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Observações</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Observações gerais sobre o aluno"
                          className="min-h-[120px]"
                          data-testid="textarea-observacoes"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* SEÇÃO 6: Escolar */}
            {currentSection === 6 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Escolaridade</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="serie"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Série</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-serie">
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="1º ano">1º ano</SelectItem>
                            <SelectItem value="2º ano">2º ano</SelectItem>
                            <SelectItem value="3º ano">3º ano</SelectItem>
                            <SelectItem value="4º ano">4º ano</SelectItem>
                            <SelectItem value="5º ano">5º ano</SelectItem>
                            <SelectItem value="6º ano">6º ano</SelectItem>
                            <SelectItem value="7º ano">7º ano</SelectItem>
                            <SelectItem value="8º ano">8º ano</SelectItem>
                            <SelectItem value="9º ano">9º ano</SelectItem>
                            <SelectItem value="1º EM">1º EM</SelectItem>
                            <SelectItem value="2º EM">2º EM</SelectItem>
                            <SelectItem value="3º EM">3º EM</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="situacao_escolar"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Situação Escolar</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            value={field.value}
                            className="flex gap-4"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="cursando" id="cursando" />
                              <Label htmlFor="cursando">Cursando</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="interrompido" id="interrompido" />
                              <Label htmlFor="interrompido">Interrompido</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="concluido" id="concluido" />
                              <Label htmlFor="concluido">Concluído</Label>
                            </div>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="turno_escolar"
                  render={() => (
                    <FormItem>
                      <FormLabel>Turno</FormLabel>
                      <div className="flex gap-4">
                        {['matutino', 'vespertino', 'noturno'].map((turno) => (
                          <FormField
                            key={turno}
                            control={form.control}
                            name="turno_escolar"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(turno as any)}
                                    onCheckedChange={(checked) => {
                                      const value = field.value || [];
                                      if (checked) {
                                        field.onChange([...value, turno]);
                                      } else {
                                        field.onChange(value.filter((v) => v !== turno));
                                      }
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="font-normal capitalize">{turno}</FormLabel>
                              </FormItem>
                            )}
                          />
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="instituicao_ensino"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Instituição de ensino</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Nome da escola" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="e_alfabetizado"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>É ALFABETIZADO?</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          value={field.value}
                          className="space-y-2"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="sabe_ler_escrever" id="sabe" />
                            <Label htmlFor="sabe">Sabe ler e escrever</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="nao_sabe_ler_nem_escrever" id="nao-sabe" />
                            <Label htmlFor="nao-sabe">Não sabe ler nem escrever</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="nao_sabe_ler_nem_escrever_mas_assina" id="assina" />
                            <Label htmlFor="assina">Não sabe ler nem escrever mas sabe assinar o próprio nome</Label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="bairro_escola"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bairro</FormLabel>
                      <p className="text-xs text-gray-500">Bairro onde se localiza a escola</p>
                      <FormControl>
                        <Input {...field} placeholder="Bairro da escola" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* SEÇÃO 7: Profissional */}
            {currentSection === 7 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Dados profissionais</h3>
                <p className="text-sm text-gray-600">
                  Para encerrar um trabalho sem data de saída clique em EDITAR e informe uma data de saída igual ou anterior a hoje.
                  Caso o trabalho já possua data de saída ele se encerrará automaticamente na data prevista.
                  Indivíduos sem trabalho atual que estejam à procura de trabalho têm a situação "Desempregado"; caso contrário têm a situação "Não trabalha".
                </p>

                <FormField
                  control={form.control}
                  name="procura_trabalho"
                  render={({ field }) => (
                    <FormItem>
                      <Label>À procura de trabalho:</Label>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          value={field.value}
                          className="flex gap-4"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="sim" id="procura-sim" />
                            <Label htmlFor="procura-sim">Não</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="nao" id="procura-nao" />
                            <Label htmlFor="procura-nao">Sim</Label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-2">
                  <h4 className="font-semibold">Trabalhos atuais</h4>
                  <p className="text-xs text-gray-600">
                    Nesta tabela são apresentados os trabalhos sem data de saída ou com data de saída futura.
                  </p>
                  <div className="border rounded-lg p-4">
                    <p className="text-sm text-gray-500 text-center py-4">
                      Nenhum histórico profissional registrado
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <h4 className="font-semibold">Experiências passadas</h4>
                    <Button type="button" variant="outline" size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar
                    </Button>
                  </div>
                  <p className="text-xs text-gray-600">
                    Nesta tabela são apresentados os trabalhos com data de saída igual ou anterior a hoje.
                  </p>
                  <div className="border rounded-lg p-4">
                    <p className="text-sm text-gray-500 text-center py-4">
                      Nenhum histórico profissional registrado
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* SEÇÃO 8: Saúde */}
            {currentSection === 8 && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold">Dados de saúde</h3>
                
                {/* Particularidades */}
                <div className="space-y-4">
                  <h4 className="font-semibold">Particularidades</h4>
                  <FormField
                    control={form.control}
                    name="possui_particularidade_saude"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Possui algum problema particular de saúde?</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            value={field.value}
                            className="flex gap-4"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="sim" id="part-sim" />
                              <Label htmlFor="part-sim">Sim</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="nao" id="part-nao" />
                              <Label htmlFor="part-nao">Não possui</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="nao_informado" id="part-nao-info" />
                              <Label htmlFor="part-nao-info">Não informado</Label>
                            </div>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Alergias */}
                <div className="space-y-4">
                  <h4 className="font-semibold">Alergias</h4>
                  <FormField
                    control={form.control}
                    name="possui_alergia"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Possui algum tipo de alergia?</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            value={field.value}
                            className="flex gap-4"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="sim" id="alergia-sim" />
                              <Label htmlFor="alergia-sim">Sim</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="nao" id="alergia-nao" />
                              <Label htmlFor="alergia-nao">Não possui</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="nao_informado" id="alergia-nao-info" />
                              <Label htmlFor="alergia-nao-info">Não informado</Label>
                            </div>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Medicações */}
                <div className="space-y-4">
                  <h4 className="font-semibold">Medicações</h4>
                  <FormField
                    control={form.control}
                    name="faz_uso_medicamento"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Faz uso de alguma medicação?</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            value={field.value}
                            className="flex gap-4"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="nao" id="med-nao" />
                              <Label htmlFor="med-nao">Não</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="sim" id="med-sim" />
                              <Label htmlFor="med-sim">Sim</Label>
                            </div>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Deficiências */}
                <div className="space-y-4">
                  <h4 className="font-semibold">Deficiências</h4>
                  <FormField
                    control={form.control}
                    name="possui_deficiencia"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Possui algum tipo de deficiência?</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            value={field.value}
                            className="flex gap-4"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="sim" id="def-sim" />
                              <Label htmlFor="def-sim">Sim</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="nao_possui" id="def-nao" />
                              <Label htmlFor="def-nao">Não possui</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="nao_informado" id="def-nao-info" />
                              <Label htmlFor="def-nao-info">Não informado</Label>
                            </div>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Químicos */}
                <div className="space-y-4">
                  <h4 className="font-semibold">Químicos</h4>
                  <FormField
                    control={form.control}
                    name="faz_uso_quimicos"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Faz ou fez uso de substâncias psicoativas?</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            value={field.value}
                            className="flex gap-4"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="sim" id="quim-sim" />
                              <Label htmlFor="quim-sim">Sim</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="nao_possui" id="quim-nao" />
                              <Label htmlFor="quim-nao">Não possui</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="nao_informado" id="quim-nao-info" />
                              <Label htmlFor="quim-nao-info">Não informado</Label>
                            </div>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="familiar_usa_quimicos"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Algum morador da casa faz uso de substâncias psicoativas?</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            value={field.value}
                            className="flex gap-4"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="sim" id="fam-quim-sim" />
                              <Label htmlFor="fam-quim-sim">Sim</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="nao_possui" id="fam-quim-nao" />
                              <Label htmlFor="fam-quim-nao">Não possui</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="nao_informado" id="fam-quim-nao-info" />
                              <Label htmlFor="fam-quim-nao-info">Não informado</Label>
                            </div>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="tipo_sanguineo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>TIPO SANGUÍNEO:</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="A+">A+</SelectItem>
                            <SelectItem value="A-">A-</SelectItem>
                            <SelectItem value="B+">B+</SelectItem>
                            <SelectItem value="B-">B-</SelectItem>
                            <SelectItem value="AB+">AB+</SelectItem>
                            <SelectItem value="AB-">AB-</SelectItem>
                            <SelectItem value="O+">O+</SelectItem>
                            <SelectItem value="O-">O-</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="restricao_alimentar"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ALGUMA RESTRIÇÃO ALIMENTAR?</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            value={field.value}
                            className="flex gap-4"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="sim" id="rest-sim" />
                              <Label htmlFor="rest-sim">Sim</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="nao" id="rest-nao" />
                              <Label htmlFor="rest-nao">Não</Label>
                            </div>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="possui_convenio_medico"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>POSSUI CONVÊNIO MÉDICO?</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            value={field.value}
                            className="flex gap-4"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="sim" id="conv-sim" />
                              <Label htmlFor="conv-sim">Sim</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="nao" id="conv-nao" />
                              <Label htmlFor="conv-nao">Não</Label>
                            </div>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="historico_medico"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>HISTÓRICO MÉDICO:</FormLabel>
                        <p className="text-xs text-gray-500">
                          Informe doenças cardiovasculares, pulmonares, ortopédicas e musculares, além de cirurgias e condições como diabetes, obesidade e hipertensão
                        </p>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            value={field.value}
                            className="flex gap-4"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="sim" id="hist-sim" />
                              <Label htmlFor="hist-sim">Sim</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="nao" id="hist-nao" />
                              <Label htmlFor="hist-nao">Não</Label>
                            </div>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="ja_teve_ou_costuma_ter"
                    render={() => (
                      <FormItem>
                        <FormLabel>JÁ TEVE OU COSTUMA TER:</FormLabel>
                        <div className="space-y-2">
                          {['desmaios', 'convulsoes', 'dores_cabeca', 'perda_consciencia', 'enjoos'].map((item) => (
                            <FormField
                              key={item}
                              control={form.control}
                              name="ja_teve_ou_costuma_ter"
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(item as any)}
                                      onCheckedChange={(checked) => {
                                        const value = field.value || [];
                                        if (checked) {
                                          field.onChange([...value, item]);
                                        } else {
                                          field.onChange(value.filter((v) => v !== item));
                                        }
                                      }}
                                    />
                                  </FormControl>
                                  <FormLabel className="font-normal capitalize">
                                    {item.replace('_', ' ')}
                                  </FormLabel>
                                </FormItem>
                              )}
                            />
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            )}

            {/* SEÇÃO 9: Relações */}
            {currentSection === 9 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Relacionamentos familiares</h3>
                
                <div className="border rounded-lg">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">NOME</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">PARENTESCO</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">RELAÇÃO</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td colSpan={3} className="px-4 py-6 text-center text-sm text-gray-500">
                          Nenhuma pessoa cadastrada
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <h3 className="text-lg font-semibold mt-6">Outros relacionamentos</h3>
                
                <div className="border rounded-lg">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">NOME</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">PARENTESCO</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">RELAÇÃO</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td colSpan={3} className="px-4 py-6 text-center text-sm text-gray-500">
                          Nenhuma pessoa cadastrada
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <Button type="button" variant="outline" className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Incluir nova relação
                </Button>
              </div>
            )}

            {/* SEÇÃO 10: Grupos */}
            {currentSection === 10 && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold">Grupos do Atendido</h3>
                <p className="text-sm text-gray-600">
                  Turmas compatíveis com o perfil do atendido baseado em gênero e idade
                </p>
                
                <div className="border rounded-lg">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">INSCRIÇÃO</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">GRUPOS</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">PERÍODO</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">VAGAS RESTANTES</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td colSpan={4} className="px-4 py-6 text-center text-sm text-gray-500">
                          Nenhum grupo disponível no momento
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="mt-6">
                  <h4 className="font-semibold text-gray-700 mb-2">Turmas não compatíveis com o perfil do beneficiário</h4>
                  <div className="border rounded-lg">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">INSCRIÇÃO</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">GRUPOS</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">PERÍODO</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">VAGAS RESTANTES</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td colSpan={4} className="px-4 py-6 text-center text-sm text-gray-500">
                            Nenhum grupo disponível
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation buttons */}
            <div className="flex justify-between pt-4 border-t">
              <div>
                {currentSection > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={prevSection}
                    data-testid="button-anterior"
                  >
                    Anterior
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  data-testid="button-cancelar"
                >
                  Cancelar
                </Button>
                {currentSection < 10 ? (
                  <Button
                    type="button"
                    onClick={nextSection}
                    data-testid="button-proximo"
                  >
                    Próximo
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={createStudentMutation.isPending}
                    data-testid="button-salvar"
                  >
                    {createStudentMutation.isPending ? 'Salvando...' : 'Salvar'}
                  </Button>
                )}
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
