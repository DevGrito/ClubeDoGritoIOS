import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { format, parse, isValid } from 'date-fns';
import { CalendarIcon, Plus, X, Upload, FileText, Trash2, ExternalLink } from 'lucide-react';
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

// ========== FUNÇÕES DE MÁSCARA ==========

// Máscara para CPF: XXX.XXX.XXX-XX
export function maskCPF(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

// Máscara para RG: XX.XXX.XXX-X
export function maskRG(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 9);
  if (digits.length <= 2) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}-${digits.slice(8)}`;
}

// Máscara para Telefone: (XX) XXXXX-XXXX
export function maskPhone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 2) return digits.length > 0 ? `(${digits}` : '';
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

// Máscara para Data: DD/MM/AAAA
export function maskDate(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

// Máscara para CEP: XXXXX-XXX
export function maskCEP(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

// Buscar endereço por CEP (API ViaCEP - gratuita)
export async function fetchAddressByCEP(cep: string): Promise<{
  logradouro: string;
  bairro: string;
  cidade: string;
  estado: string;
} | null> {
  const digits = cep.replace(/\D/g, '');
  if (digits.length !== 8) return null;
  
  try {
    const response = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
    const data = await response.json();
    
    if (data.erro) return null;
    
    return {
      logradouro: data.logradouro || '',
      bairro: data.bairro || '',
      cidade: data.localidade || '',
      estado: data.uf || ''
    };
  } catch {
    return null;
  }
}

// ========== FUNÇÕES DE VALIDAÇÃO ==========

// Validar CPF real
export function validateCPF(cpf: string): boolean {
  const digits = cpf.replace(/\D/g, '');
  if (digits.length !== 11) return false;
  
  // CPFs inválidos conhecidos
  if (/^(\d)\1{10}$/.test(digits)) return false;
  
  // Validar primeiro dígito verificador
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(digits[i]) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(digits[9])) return false;
  
  // Validar segundo dígito verificador
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(digits[i]) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(digits[10])) return false;
  
  return true;
}

// Validar RG (formato básico - 8 ou 9 dígitos)
export function validateRG(rg: string): boolean {
  const digits = rg.replace(/\D/g, '');
  return digits.length >= 7 && digits.length <= 9;
}

// Validar data no formato DD/MM/AAAA
export function validateDate(date: string): boolean {
  const match = date.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return false;
  
  const day = parseInt(match[1]);
  const month = parseInt(match[2]);
  const year = parseInt(match[3]);
  
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;
  if (year < 1900 || year > 2100) return false;
  
  // Verificar dias por mês
  const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if ((year % 4 === 0 && year % 100 !== 0) || year % 400 === 0) {
    daysInMonth[1] = 29; // Ano bissexto
  }
  
  return day <= daysInMonth[month - 1];
}

// Helper: normaliza enums string do banco (ex: 'Feminino' → 'feminino')
const normEnum = (v: unknown) => typeof v === 'string' ? v.toLowerCase().trim() : v;

// Schema para o formulário completo de cadastro de aluno
const studentRegistrationSchema = z.object({
  // SEÇÃO 1: Identificação
  nome_completo: z.string().min(1, "Nome é obrigatório"),
  data_nascimento: z.string().min(1, "Data de nascimento é obrigatória").refine(
    (val) => validateDate(val),
    { message: "Data inválida. Use o formato DD/MM/AAAA" }
  ),
  genero: z.preprocess(normEnum, z.enum(['feminino', 'masculino', 'nao_binario', 'nao_informado'], {
    required_error: "Selecione o gênero",
    invalid_type_error: "Selecione o gênero"
  })),
  area: z.enum(["pec", "inclusao"], { required_error: "Área é obrigatória" }),
  foto_perfil: z.string().optional().nullable(),
  numero_matricula: z.string().optional().nullable(),
  id_catraca: z.string().optional().nullable(),
  estado_civil: z.string().optional().nullable(),
  religiao: z.string().optional().nullable(),
  naturalidade: z.string().optional().nullable(),
  nacionalidade: z.string().optional().nullable().default("Brasil"),
  pode_sair_sozinho: z.preprocess(normEnum, z.enum(['sim', 'nao']).optional().nullable()),
  tamanho_calca: z.string().optional().nullable(),
  tamanho_camiseta: z.string().optional().nullable(),
  tamanho_calcado: z.string().optional().nullable(),
  cor_raca: z.preprocess(normEnum, z.enum(['branca', 'preta', 'parda', 'amarela', 'indigena', 'nao_sabe_informar']).optional().nullable()),
  frequenta_projeto_social: z.preprocess(normEnum, z.enum(['sim', 'nao']).optional()),
  projeto_social_qual: z.string().optional(),
  acesso_internet: z.preprocess(normEnum, z.enum(['sim', 'nao']).optional()),
  internet_qual: z.string().optional(),
  
  // SEÇÃO 2: Documentos
 cpf: z.string().min(1, "CPF é obrigatório")
  .refine((val) => onlyDigits(val).length === 11, { message: "CPF deve ter 11 dígitos" })
  .refine((val) => validateCPF(val), { message: "CPF inválido. Digite um CPF real" }),

  rg: z.string().optional().nullable().refine(
    (val) => !val || val.length === 0 || validateRG(val),
    { message: "RG inválido. Digite um RG real" }
  ),
  orgao_emissor: z.string().optional().nullable(),
  ctps_numero: z.string().optional().nullable(),
  ctps_serie: z.string().optional().nullable(),
  titulo_eleitor: z.string().optional().nullable(),
  possui_titulo_eleitor: z.enum(['sim', 'nao']).optional(),
  possui_carteira_trabalho: z.enum(['sim', 'nao']).optional(),
  nis_pis_pasep: z.string().optional().nullable(),
  documentos_possui: z.array(z.string()).optional().nullable(),
  
  // SEÇÃO 3: Contato
  email: z.string().email("Email inválido").optional().nullable().or(z.literal('')),
  telefone: z.string().min(1, "Telefone é obrigatório")
  .refine((val) => onlyDigits(val).length >= 10, { message: "Telefone inválido" }),
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
  
  // SEÇÃO 4: Endereço
  cep: z.string().optional().nullable(),
  logradouro: z.string().optional().nullable(),
  numero: z.string().optional().nullable(),
  complemento: z.string().optional().nullable(),
  bairro: z.string().optional().nullable(),
  cidade: z.string().optional().nullable(),
  estado: z.string().optional().nullable(),
  ponto_referencia: z.string().optional().nullable(),
  mora_desde_ano: z.number().optional().nullable(),
  
  // SEÇÃO 5: Benefícios Sociais
  cadunico: z.enum(['sim', 'nao']).optional(),
  bolsa_familia: z.enum(['sim', 'nao']).optional(),
  bpc: z.enum(['sim', 'nao']).optional(),
  cartao_alimentacao: z.enum(['sim', 'nao']).optional(),
  outros_beneficios: z.enum(['sim', 'nao']).optional(),
  
  // SEÇÃO 6: Informações Adicionais
  data_entrada: z.date().optional().nullable(),
  forma_acesso: z.string().optional().nullable(),
  demandas: z.array(z.string()).optional(),
  observacoes_gerais: z.string().optional(),
  
  // SEÇÃO 7: Escolar
  serie: z.string().optional(),
  situacao_escolar: z.preprocess(normEnum, z.enum(['cursando', 'interrompido', 'concluido']).optional()),
  escola_formou: z.string().optional().nullable(),
  ano_conclusao_em: z.string().optional().nullable(),
  turno_escolar: z.array(z.enum(['matutino', 'vespertino', 'noturno'])).optional(),
  instituicao_ensino: z.string().optional(),
  e_alfabetizado: z.preprocess(normEnum, z.enum(['sabe_ler_escrever', 'nao_sabe_ler_nem_escrever', 'nao_sabe_ler_nem_escrever_mas_assina']).optional()),
  bairro_escola: z.string().optional(),
  
  // SEÇÃO 8: Profissional
  procura_trabalho: z.preprocess(normEnum, z.enum(['sim', 'nao']).optional()),
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
  
  // SEÇÃO 9: Saúde
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
  
  // SEÇÃO 10: Relações
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
  
  // SEÇÃO 11: Grupos (apenas visualização, não edição)
  
  // SEÇÃO 12: Responsável
  responsavel_cpf: z.string().optional().nullable(),
  responsavel_nome_completo: z.string().optional().nullable(),
  responsavel_grau_parentesco: z.string().optional().nullable(),
  responsavel_rg: z.string().optional().nullable(),
  responsavel_orgao_emissor_rg: z.string().optional().nullable(),
  responsavel_data_nascimento: z.string().optional().nullable(),
  responsavel_genero: z.string().optional().nullable(),
  responsavel_estado_civil: z.string().optional().nullable(),
  responsavel_escolaridade: z.string().optional().nullable(),
  responsavel_situacao_trabalhista: z.string().optional().nullable(),
  responsavel_profissao: z.string().optional().nullable(),
  responsavel_renda_familiar: z.string().optional().nullable(),
  responsavel_telefone: z.string().optional().nullable(),
  responsavel_whatsapp: z.string().optional().nullable(),
  responsavel_email: z.string().optional().nullable(),
  responsavel_cep: z.string().optional().nullable(),
  responsavel_logradouro: z.string().optional().nullable(),
  responsavel_numero: z.string().optional().nullable(),
  responsavel_complemento: z.string().optional().nullable(),
  responsavel_bairro: z.string().optional().nullable(),
  responsavel_cidade: z.string().optional().nullable(),
  responsavel_estado: z.string().optional().nullable(),
  responsavel_mora_com_aluno: z.boolean().optional().nullable(),
  responsavel_e_contato_emergencia: z.boolean().optional().nullable(),

  // Campos do sistema
  professorId: z.number().optional(),
});

type StudentRegistrationData = z.infer<typeof studentRegistrationSchema>;

interface ComprehensiveStudentFormProps {
  open: boolean;
  onClose: () => void;
  editCpf?: string;
  editId?: number; // For inclusao mode (uses numeric ID)
  viewMode?: boolean;
  mode?: 'pec' | 'inclusao'; // pec = alunos PEC/Esporte-Cultura, inclusao = Inclusão Produtiva
}

// ===================== RASCUNHOS (localStorage) =====================
type DraftMode = "pec" | "inclusao";

type StudentDraft = {
  id: string;
  name: string;
  mode: DraftMode;
  schemaVersion: number;
  createdAt: string; // ISO
  updatedAt: string; // ISO
  payload: {
    // valores do RHF (form.getValues())
    formValues: any;
    // states fora do RHF
    additionalPhones: Array<{ numero: string; whatsapp: boolean }>;
    emergencyContacts: Array<{ nome: string; telefone: string; whatsapp: boolean }>;
    relacionamentosFamiliares: Array<{ nome: string; parentesco: string; relacao: string }>;
    outrosRelacionamentos: Array<{ nome: string; parentesco: string; relacao: string }>;
    trabalhosAtuais: Array<{ empresa: string; cargo: string; dataEntrada: string; dataSaida: string; remuneracao: string }>;
    experienciasPassadas: Array<{ empresa: string; cargo: string; dataEntrada: string; dataSaida: string; remuneracao: string }>;
    currentSection: number;
    // metadados (não salva arquivo)
    fotoPreview: string | null;
    pendingDocumentosMeta: Array<{ name: string; size: number; type: string }>;
  };
};

const DRAFT_SCHEMA_VERSION = 1;

function getDraftStorageKey(userId: string | null, mode: DraftMode) {
  // separa por usuário e por modo
  const uid = userId && userId !== "0" ? userId : "anon";
  return `og:studentDrafts:${uid}:${mode}`;
}

function safeJsonParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

// RHF tem campo data_entrada: Date | null
// JSON transforma Date em string. Aqui reidratamos.
function hydrateFormValues(values: any) {
  const v = { ...(values || {}) };
  if (v.data_entrada) {
    const d = new Date(v.data_entrada);
    v.data_entrada = isNaN(d.getTime()) ? null : d;
  }
  return v;
}

function dehydrateFormValues(values: any) {
  const v = { ...(values || {}) };
  if (v.data_entrada instanceof Date) {
    v.data_entrada = v.data_entrada.toISOString();
  }
  return v;
}

function listDraftsLS(userId: string | null, mode: DraftMode): StudentDraft[] {
  const key = getDraftStorageKey(userId, mode);
  const arr = safeJsonParse<StudentDraft[]>(localStorage.getItem(key), []);
  // ordena por updated desc
  return arr.sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
}

function saveDraftLS(userId: string | null, mode: DraftMode, draft: StudentDraft) {
  const key = getDraftStorageKey(userId, mode);
  const arr = listDraftsLS(userId, mode);

  const idx = arr.findIndex(d => d.id === draft.id);
  if (idx >= 0) arr[idx] = draft;
  else arr.unshift(draft);

  localStorage.setItem(key, JSON.stringify(arr));
}

  function onlyDigits(v: string) {
    return String(v ?? "").replace(/\D/g, "");
  }

  function normalizePersonName(input: unknown): string {
  const raw = String(input ?? "")
    .trim()
    .replace(/\s+/g, " ");

  if (!raw) return "";

  // partículas comuns em PT-BR que ficam minúsculas (exceto se for a primeira palavra)
  const lowerWords = new Set(["de", "da", "do", "das", "dos", "e", "d"]);

  const words = raw.split(" ").filter(Boolean);

  const norm = words.map((word, idx) => {
    const w = word.toLowerCase();

    // caso "d'...": d'ávila, d'angelo
    if (w.startsWith("d'") && w.length > 2) {
      const rest = w.slice(2);
      return "d'" + rest.charAt(0).toUpperCase() + rest.slice(1);
    }

    // mantém partículas minúsculas (exceto primeira palavra)
    if (idx > 0 && lowerWords.has(w)) return w;

    // hífen: "ana-clara" -> "Ana-Clara"
    return w
      .split("-")
      .map(part => (part ? part.charAt(0).toUpperCase() + part.slice(1) : ""))
      .join("-");
  });

  return norm.join(" ");
}


function deleteDraftLS(userId: string | null, mode: DraftMode, draftId: string) {
  const key = getDraftStorageKey(userId, mode);
  const arr = listDraftsLS(userId, mode).filter(d => d.id !== draftId);
  localStorage.setItem(key, JSON.stringify(arr));
}
// =================== FIM RASCUNHOS (localStorage) ===================

export function ComprehensiveStudentForm({ open, onClose, editCpf, editId, viewMode = false, mode = 'pec' }: ComprehensiveStudentFormProps) {
  const isEditMode = mode === 'inclusao' ? !!editId : !!editCpf;
  const isReadOnly = viewMode;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentSection, setCurrentSection] = useState(1);
  const [additionalPhones, setAdditionalPhones] = useState<Array<{ numero: string; whatsapp: boolean }>>([]);
  const [emergencyContacts, setEmergencyContacts] = useState<Array<{ nome: string; telefone: string; whatsapp: boolean }>>([]);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [uploadingFoto, setUploadingFoto] = useState(false);
  const [documentos, setDocumentos] = useState<any[]>([]);
  const [loadingDocumentos, setLoadingDocumentos] = useState(false);
  const [uploadingDocumento, setUploadingDocumento] = useState(false);
  const [pendingDocumentos, setPendingDocumentos] = useState<File[]>([]);
  const [showAddRelacaoModal, setShowAddRelacaoModal] = useState(false);
  const [novaRelacao, setNovaRelacao] = useState({ nome: '', parentesco: '', relacao: '', tipo: 'familiar' as 'familiar' | 'outro' });
  const [relacionamentosFamiliares, setRelacionamentosFamiliares] = useState<Array<{ nome: string; parentesco: string; relacao: string }>>([]);
  const [outrosRelacionamentos, setOutrosRelacionamentos] = useState<Array<{ nome: string; parentesco: string; relacao: string }>>([]);
  interface ResponsavelItem {
    id?: number;
    cpf: string;
    nome_completo: string;
    grau_parentesco: string;
    rg: string;
    orgao_emissor_rg: string;
    data_nascimento: string;
    genero: string;
    estado_civil: string;
    escolaridade: string;
    situacao_trabalhista: string;
    profissao: string;
    renda_familiar: string;
    telefone: string;
    whatsapp: string;
    email: string;
    cep: string;
    logradouro: string;
    numero: string;
    complemento: string;
    bairro: string;
    cidade: string;
    estado: string;
    mora_com_aluno: boolean;
    e_contato_emergencia: boolean;
    e_principal: boolean;
  }
  const emptyResponsavel = (): ResponsavelItem => ({
    cpf: '', nome_completo: '', grau_parentesco: '', rg: '', orgao_emissor_rg: '',
    data_nascimento: '', genero: '', estado_civil: '', escolaridade: '', situacao_trabalhista: '',
    profissao: '', renda_familiar: '', telefone: '', whatsapp: '', email: '',
    cep: '', logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '',
    mora_com_aluno: false, e_contato_emergencia: false, e_principal: false,
  });
  const [responsaveisData, setResponsaveisData] = useState<ResponsavelItem[]>([]);
  const [editingResponsavelIdx, setEditingResponsavelIdx] = useState<number | null>(null);
  const [showResponsavelForm, setShowResponsavelForm] = useState(false);
  const [currentResponsavelForm, setCurrentResponsavelForm] = useState<ResponsavelItem>(emptyResponsavel());
  const [showAddTrabalhoModal, setShowAddTrabalhoModal] = useState(false);
  const [novoTrabalho, setNovoTrabalho] = useState({ empresa: '', cargo: '', dataEntrada: '', dataSaida: '', remuneracao: '' });
  const [trabalhosAtuais, setTrabalhosAtuais] = useState<Array<{ empresa: string; cargo: string; dataEntrada: string; dataSaida: string; remuneracao: string }>>([]);
  const [experienciasPassadas, setExperienciasPassadas] = useState<Array<{ empresa: string; cargo: string; dataEntrada: string; dataSaida: string; remuneracao: string }>>([]);
  
  const handleFotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const form = useForm<StudentRegistrationData>({
    resolver: zodResolver(studentRegistrationSchema),
    defaultValues: {
      genero: 'feminino',
        area: mode === "inclusao" ? "inclusao" : "pec",
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

  const cepValue = form.watch("cep");
  const [loadingCep, setLoadingCep] = useState(false);

    // ===================== RASCUNHOS (localStorage) =====================
  const userIdLS = typeof window !== "undefined" ? localStorage.getItem("userId") : null;

  const [drafts, setDrafts] = useState<StudentDraft[]>([]);
  const [showDraftsDialog, setShowDraftsDialog] = useState(false);

  const [showSaveDraftDialog, setShowSaveDraftDialog] = useState(false);
  const [draftName, setDraftName] = useState("");
  // =================== FIM RASCUNHOS (localStorage) ===================

  useEffect(() => {
    const run = async () => {
      const cepDigits = String(cepValue ?? "").replace(/\D/g, "");
      if (cepDigits.length !== 8) return;

      setLoadingCep(true);
      try {
        const data = await fetchAddressByCEP(cepDigits);
        if (!data) return;

        form.setValue("estado", data.estado || "", { shouldValidate: true, shouldDirty: true });
        form.setValue("cidade", data.cidade || "", { shouldValidate: true, shouldDirty: true });
        form.setValue("bairro", data.bairro || "", { shouldValidate: true, shouldDirty: true });
        form.setValue("logradouro", data.logradouro || "", { shouldValidate: true, shouldDirty: true });

        // Deixa numero/complemento pro usuário
        // (não limpa automaticamente, porque às vezes a pessoa já digitou)
      } finally {
        setLoadingCep(false);
      }
    };

    run();
  }, [cepValue]);

  useEffect(() => {
    if (open && !isEditMode && !viewMode) {
      setCurrentSection(1);
      form.reset();
      setFotoPreview(null);
      setFotoFile(null);
      setAdditionalPhones([]);
      setEmergencyContacts([]);
      setRelacionamentosFamiliares([]);
      setOutrosRelacionamentos([]);
    }
  }, [open]);

  useEffect(() => {
    const shouldLoadData = mode === 'inclusao' ? (editId && open) : (editCpf && open);
    
    if (shouldLoadData) {
      if (mode === 'inclusao' && editId) {
        console.log('[EDIT FORM INCLUSAO] Carregando dados do participante:', editId);
        fetch(`/api/participantes-inclusao/${editId}`)
          .then(res => res.json())
          .then(data => {
            console.log('[EDIT FORM INCLUSAO] Dados recebidos:', data);
            if (data && !data.error) {
              // Helper: converts boolean DB values to the string enum expected by the form
              const boolToEnum = (val: any, trueVal: string, falseVal: string): string | undefined => {
                if (val === true || val === 'true') return trueVal;
                if (val === false || val === 'false') return falseVal;
                if (typeof val === 'string' && val.length > 0) return val; // already a string enum
                return undefined;
              };

              const formData: any = {
                cpf: data.cpf || '',
                nome_completo: data.nome,
                area: data.area || 'inclusao',
                data_nascimento: data.dataNascimento ? format(new Date(data.dataNascimento + 'T12:00:00'), 'dd/MM/yyyy') : '',
                genero: (data.genero || 'feminino').toLowerCase(),
                numero_matricula: data.codigoMatricula,
                id_catraca: data.idCatraca || data.id_catraca || (data.cpf ? String(data.cpf).replace(/\D/g, '') : ''),
                estado_civil: data.estadoCivil,
                religiao: data.religiao,
                naturalidade: data.naturalidade,
                nacionalidade: data.nacionalidade || 'Brasil',
                pode_sair_sozinho: boolToEnum(data.podeSairSozinho, 'sim', 'nao'),
                tamanho_calca: data.tamanhoCalca,
                tamanho_camiseta: data.tamanhoCamiseta,
                tamanho_calcado: data.tamanhoCalcado,
                cor_raca: data.corRaca ? data.corRaca.toLowerCase() : undefined,
                frequenta_projeto_social: boolToEnum(data.frequentaProjetoSocial, 'sim', 'nao'),
                projeto_social_qual: data.projetoSocialQual || undefined,
                acesso_internet: boolToEnum(data.acessoInternet, 'sim', 'nao'),
                internet_qual: data.internetQual || undefined,
                rg: data.rg,
                orgao_emissor: data.orgaoEmissor,
                ctps_numero: data.ctpsNumero,
                ctps_serie: data.ctpsSerie,
                titulo_eleitor: data.tituloEleitor,
                nis_pis_pasep: data.nisPisPasep,
                documentos_possui: data.documentosPossui || [],
                email: data.email,
                telefone: data.telefone,
                telefone_whatsapp: data.telefoneWhatsapp || false,
                telefones_adicionais: data.telefonesAdicionais || [],
                contatos_emergencia: data.contatosEmergencia || [],
                cep: data.cep,
                logradouro: data.logradouro,
                numero: data.numero,
                complemento: data.complemento,
                bairro: data.bairro,
                cidade: data.cidade,
                estado: data.estado,
                ponto_referencia: data.pontoReferencia,
                mora_desde_ano: data.moraDesdeAno,
                cadunico: boolToEnum(data.cadunico, 'sim', 'nao') || 'nao',
                bolsa_familia: boolToEnum(data.bolsaFamilia, 'sim', 'nao') || 'nao',
                bpc: boolToEnum(data.bpc, 'sim', 'nao') || 'nao',
                cartao_alimentacao: boolToEnum(data.cartaoAlimentacao, 'sim', 'nao') || 'nao',
                outros_beneficios: boolToEnum(data.outrosBeneficios, 'sim', 'nao') || 'nao',
                forma_acesso: data.formaAcesso || 'Busca ativa',
                demandas: data.demandas || [],
                observacoes_gerais: data.observacoesGerais || undefined,
                serie: data.serie || undefined,
                situacao_escolar: data.situacaoEscolar ? data.situacaoEscolar.toLowerCase() : undefined,
                turno_escolar: data.turnoEscolar || [],
                instituicao_ensino: data.instituicaoEnsino || undefined,
                e_alfabetizado: (data.eAlfabetizado === true || data.eAlfabetizado === 'true') ? 'sabe_ler_escrever' : (data.eAlfabetizado === false || data.eAlfabetizado === 'false') ? 'nao_sabe_ler_nem_escrever' : (data.eAlfabetizado ? String(data.eAlfabetizado).toLowerCase() : undefined),
                bairro_escola: data.bairroEscola || undefined,
                procura_trabalho: boolToEnum(data.procuraTrabalho, 'sim', 'nao'),
                trabalhos_atuais: data.trabalhosAtuais || [],
                experiencias_profissionais: data.experienciasProfissionais || [],
                possui_particularidade_saude: boolToEnum(data.possuiParticularidadeSaude, 'sim', 'nao'),
                detalhes_particularidade: data.detalhesParticularidade,
                possui_alergia: boolToEnum(data.possuiAlergia, 'sim', 'nao'),
                detalhes_alergia: data.detalhesAlergia,
                faz_uso_medicamento: boolToEnum(data.fazUsoMedicamento, 'sim', 'nao'),
                detalhes_medicamento: data.detalhesMedicamento,
                possui_deficiencia: boolToEnum(data.possuiDeficiencia, 'sim', 'nao_possui'),
                detalhes_deficiencia: data.detalhesDeficiencia,
                contatos_saude: Array.isArray(data.contatosSaude) ? (data.contatosSaude[0] || undefined) : (data.contatosSaude || undefined),
                faz_uso_quimicos: boolToEnum(data.fazUsoQuimicos, 'sim', 'nao_possui'),
                familiar_usa_quimicos: boolToEnum(data.familiarUsaQuimicos, 'sim', 'nao_possui'),
                tipo_sanguineo: data.tipoSanguineo || undefined,
                restricao_alimentar: boolToEnum(data.restricaoAlimentar, 'sim', 'nao'),
                detalhes_restricao_alimentar: data.detalhesRestricaoAlimentar,
                possui_convenio_medico: boolToEnum(data.possuiConvenioMedico, 'sim', 'nao'),
                detalhes_convenio_medico: data.detalhesConvenioMedico,
                historico_medico: boolToEnum(data.historicoMedico, 'sim', 'nao'),
                ja_teve_ou_costuma_ter: data.jaTeveOuCostumaTer || [],
                detalhes_historico_medico: data.detalhesHistoricoMedico,
                relacionamentos_familiares: data.relacionamentosFamiliares || [],
                outros_relacionamentos: data.outrosRelacionamentos || [],
              };
              // Sanitize: converte null → undefined para todos os campos (Zod .optional() não aceita null)
              Object.keys(formData).forEach(key => {
                if (formData[key] === null) formData[key] = undefined;
              });
              form.reset(formData);
              if (data.fotoUrl) {
                setFotoPreview(data.fotoUrl);
              }
              originalCpfRef.current = onlyDigits(formData.cpf || "");
              setRelacionamentosFamiliares(data.relacionamentosFamiliares || []);
              setOutrosRelacionamentos(data.outrosRelacionamentos || []);
              setTrabalhosAtuais(data.trabalhosAtuais || []);
              setExperienciasPassadas(data.experienciasProfissionais || []);
              setAdditionalPhones(data.telefonesAdicionais || []);
              setEmergencyContacts(data.contatosEmergencia || []);
            }
          })
          .catch(err => console.error('Erro ao carregar participante:', err));
      } else if (mode === 'pec' && editCpf) {
        console.log('[EDIT FORM] Carregando dados do aluno:', editCpf);
        form.reset({});
        setFotoPreview(null);
        setFotoFile(null);
        setDocumentos([]);
        setPendingDocumentos([]);
        setResponsaveisData([]);
        setShowResponsavelForm(false);
        fetch(`/api/students/${editCpf}`)
          .then(res => res.json())
          .then(data => {
            console.log('[EDIT FORM] Dados recebidos:', data);
            console.log('[EDIT FORM] foto_perfil:', data?.foto_perfil);
            if (data && !data.error) {
              const boolToEnumPec = (val: any, trueVal: string, falseVal: string): string | undefined => {
                if (val === true || val === 'true') return trueVal;
                if (val === false || val === 'false') return falseVal;
                if (typeof val === 'string' && val.length > 0) return val;
                return undefined;
              };

              const formData: any = {
                cpf: onlyDigits(data.cpf),
                nome_completo: data.nome_completo,
                area: data.area || 'pec',
                data_nascimento: data.data_nascimento ? format(new Date(data.data_nascimento), 'dd/MM/yyyy') : '',
                genero: (data.genero || 'feminino').toLowerCase(),
                numero_matricula: data.numero_matricula,
                id_catraca: data.id_catraca || (data.cpf ? String(data.cpf).replace(/\D/g, '') : ''),
                estado_civil: data.estado_civil,
                religiao: data.religiao,
                naturalidade: data.naturalidade,
                nacionalidade: data.nacionalidade || 'Brasil',
                pode_sair_sozinho: boolToEnumPec(data.pode_sair_sozinho, 'sim', 'nao'),
                tamanho_calca: data.tamanho_calca,
                tamanho_camiseta: data.tamanho_camiseta,
                tamanho_calcado: data.tamanho_calcado,
                cor_raca: data.cor_raca ? data.cor_raca.toLowerCase() : undefined,
                cep: data.cep,
                logradouro: data.logradouro,
                numero: data.numero,
                complemento: data.complemento,
                bairro: data.bairro,
                cidade: data.cidade,
                estado: data.estado,
                ponto_referencia: data.ponto_referencia,
                mora_desde_ano: data.mora_desde_ano,
                email: data.email,
                telefone: data.telefone,
                cadunico: data.cadunico === 'Sim' ? 'sim' : 'nao',
                bolsa_familia: data.bolsa_familia === 'Sim' ? 'sim' : 'nao',
                bpc: data.bpc === 'Sim' ? 'sim' : 'nao',
                rg: data.rg,
                orgao_emissor: data.orgao_emissor,
              };
              // Sanitize: converte null → undefined para todos os campos (Zod .optional() não aceita null)
              Object.keys(formData).forEach(key => {
                if (formData[key] === null) formData[key] = undefined;
              });
              form.reset(formData);
              if (data.foto_perfil) {
                setFotoPreview(data.foto_perfil);
              }
              originalCpfRef.current = onlyDigits(formData.cpf || "");
              setLoadingDocumentos(true);
              fetch(`/api/documentos/aluno/${editCpf}`)
                .then(docsRes => docsRes.ok ? docsRes.json() : [])
                .then(docsData => setDocumentos(docsData || []))
                .catch(err => console.error('Erro ao carregar documentos:', err))
                .finally(() => setLoadingDocumentos(false));

              fetch(`/api/alunos/${editCpf}/responsaveis`)
                .then(res => res.ok ? res.json() : [])
                .then((resps: any[]) => {
                  if (resps && resps.length > 0) {
                    setResponsaveisData(resps.map((r: any) => ({
                      id: r.id,
                      cpf: r.cpf ? r.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4') : '',
                      nome_completo: r.nome_completo || '',
                      grau_parentesco: r.grau_parentesco || '',
                      rg: r.rg || '',
                      orgao_emissor_rg: r.orgao_emissor_rg || '',
                      data_nascimento: r.data_nascimento ? format(new Date(r.data_nascimento), 'dd/MM/yyyy') : '',
                      genero: r.genero || '',
                      estado_civil: r.estado_civil || '',
                      escolaridade: r.escolaridade || '',
                      situacao_trabalhista: r.situacao_trabalhista || '',
                      profissao: r.profissao || '',
                      renda_familiar: r.renda_familiar || '',
                      telefone: r.telefone || '',
                      whatsapp: r.whatsapp || '',
                      email: r.email || '',
                      cep: r.cep || '',
                      logradouro: r.logradouro || '',
                      numero: r.numero || '',
                      complemento: r.complemento || '',
                      bairro: r.bairro || '',
                      cidade: r.cidade || '',
                      estado: r.estado || '',
                      mora_com_aluno: r.mora_com_aluno || false,
                      e_contato_emergencia: r.e_contato_emergencia || false,
                      e_principal: r.e_principal || false,
                    })));
                  }
                })
                .catch(err => console.error('Erro ao carregar responsáveis:', err));
            }
          })
          .catch(err => console.error('Erro ao carregar aluno:', err));
      }
    } else if (open && !isEditMode) {
      form.reset({
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
      });
      setFotoPreview(null);
      setFotoFile(null);
      setDocumentos([]);
      setPendingDocumentos([]);
      setRelacionamentosFamiliares([]);
      setOutrosRelacionamentos([]);
      setTrabalhosAtuais([]);
      setExperienciasPassadas([]);
      setAdditionalPhones([]);
      setEmergencyContacts([]);
      setResponsaveisData([]);
      setShowResponsavelForm(false);
    }
  }, [editCpf, editId, open, mode, isEditMode]);

  // Buscar próximo número de matrícula para novos cadastros
    useEffect(() => {
      if (open && !isEditMode && mode === "pec") {
        fetch('/api/proxima-matricula')
          .then(res => res.json())
          .then(data => {
            if (data.matricula) {
              form.setValue('numero_matricula', data.matricula);
            }
          })
          .catch(err => console.error('Erro ao buscar próxima matrícula:', err));
      }
    }, [open, isEditMode, form, mode]);

  const saveResponsavel = async (alunoCpf: string) => {
    try {
      const existingRes = await fetch(`/api/alunos/${alunoCpf}/responsaveis`, { credentials: 'include' });
      const existingResps: any[] = existingRes.ok ? await existingRes.json() : [];

      const currentIds = new Set(responsaveisData.filter(r => r.id).map(r => r.id));
      const currentNames = new Set(responsaveisData.filter(r => r.nome_completo).map(r => r.nome_completo.trim().toLowerCase()));
      for (const existing of existingResps) {
        const keepById = existing.id && currentIds.has(existing.id);
        const keepByName = existing.nome_completo && currentNames.has(existing.nome_completo.trim().toLowerCase());
        if (!keepById && !keepByName) {
          await fetch(`/api/alunos/${alunoCpf}/responsaveis/${existing.id}`, {
            method: 'DELETE', credentials: 'include',
          }).catch(() => {});
        }
      }

      for (const resp of responsaveisData) {
        if (!resp.nome_completo) continue;
        let dataNascFormatted: string | undefined;
        if (resp.data_nascimento && /^\d{2}\/\d{2}\/\d{4}$/.test(resp.data_nascimento)) {
          try {
            dataNascFormatted = format(parse(resp.data_nascimento, "dd/MM/yyyy", new Date()), "yyyy-MM-dd");
          } catch { dataNascFormatted = undefined; }
        }
        const payload = {
          cpf: resp.cpf ? resp.cpf.replace(/\D/g, '') : undefined,
          nome_completo: resp.nome_completo,
          grau_parentesco: resp.grau_parentesco || undefined,
          rg: resp.rg || undefined,
          orgao_emissor_rg: resp.orgao_emissor_rg || undefined,
          data_nascimento: dataNascFormatted || undefined,
          genero: resp.genero || undefined,
          estado_civil: resp.estado_civil || undefined,
          escolaridade: resp.escolaridade || undefined,
          situacao_trabalhista: resp.situacao_trabalhista || undefined,
          profissao: resp.profissao || undefined,
          renda_familiar: resp.renda_familiar || undefined,
          telefone: resp.telefone || undefined,
          whatsapp: resp.whatsapp || undefined,
          email: resp.email || undefined,
          cep: resp.cep || undefined,
          logradouro: resp.logradouro || undefined,
          numero: resp.numero || undefined,
          complemento: resp.complemento || undefined,
          bairro: resp.bairro || undefined,
          cidade: resp.cidade || undefined,
          estado: resp.estado || undefined,
          mora_com_aluno: resp.mora_com_aluno || false,
          e_contato_emergencia: resp.e_contato_emergencia || false,
          e_principal: resp.e_principal || false,
        };
        await fetch(`/api/alunos/${alunoCpf}/responsavel`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          credentials: 'include',
        });
      }

      const principal = responsaveisData.find(r => r.e_principal);
      if (principal?.id) {
        await fetch(`/api/alunos/${alunoCpf}/responsaveis/${principal.id}/principal`, {
          method: 'PATCH', credentials: 'include',
        }).catch(() => {});
      }
    } catch (err) {
      console.error('Erro ao salvar responsáveis:', err);
    }
  };

  const createStudentMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('/api/professor/students', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    onSuccess: async (result: any) => {
      const cpf = form.getValues('cpf');
      if (fotoFile) {
        try {
          const formData = new FormData();
          formData.append('foto', fotoFile);
          await fetch(`/api/coordenador/alunos/${cpf}/foto`, {
            method: 'POST',
            body: formData
          });
        } catch (err) {
          console.error('Erro ao fazer upload da foto:', err);
        }
      }
      if (pendingDocumentos.length > 0) {
        for (const file of pendingDocumentos) {
          try {
            const formData = new FormData();
            formData.append('documento', file);
            await fetch(`/api/documentos/aluno/${cpf}`, {
              method: 'POST',
              body: formData,
              credentials: 'include'
            });
          } catch (err) {
            console.error('Erro ao fazer upload do documento:', err);
          }
        }
      }
      await saveResponsavel(cpf);
      queryClient.invalidateQueries({ queryKey: ['/api/students/all'] });
      queryClient.invalidateQueries({ queryKey: ['/api/professor/students'] });
      toast({
        title: "Aluno cadastrado com sucesso!",
        description: pendingDocumentos.length > 0 ? `Cadastro realizado com ${pendingDocumentos.length} documento(s).` : "O cadastro foi realizado."
      });
      onClose();
      form.reset();
      setCurrentSection(1);
      setAdditionalPhones([]);
      setEmergencyContacts([]);
      setFotoPreview(null);
      setFotoFile(null);
      setPendingDocumentos([]);
      setResponsaveisData([]);
      setShowResponsavelForm(false);
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

  const updateStudentMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest(`/api/students/${editCpf}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
    },
    onSuccess: async () => {
      const cpf = editCpf || form.getValues('cpf');
      if (fotoFile) {
        try {
          const formData = new FormData();
          formData.append('foto', fotoFile);
          await fetch(`/api/coordenador/alunos/${cpf}/foto`, {
            method: 'POST',
            body: formData
          });
        } catch (err) {
          console.error('Erro ao fazer upload da foto:', err);
        }
      }
      await saveResponsavel(cpf);
      queryClient.invalidateQueries({ queryKey: ['/api/students/all'] });
      queryClient.invalidateQueries({ queryKey: ['/api/professor/students'] });
      toast({
        title: "Aluno atualizado com sucesso!",
        description: "Os dados foram salvos."
      });
      onClose();
    },
    onError: (error: any) => {
      console.error('Erro ao atualizar aluno:', error);
      toast({
        title: "Erro ao atualizar aluno",
        description: error.message || "Ocorreu um erro ao atualizar o aluno.",
        variant: "destructive"
      });
    }
  });

  // === MUTATIONS PARA INCLUSÃO PRODUTIVA ===
  const createInclusaoMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('/api/participantes-inclusao', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    onSuccess: async (result: any) => {
      if (fotoFile && result?.id) {
        try {
          const formData = new FormData();
          formData.append('foto', fotoFile);
          await fetch(`/api/participantes-inclusao/${result.id}/foto`, {
            method: 'POST',
            body: formData
          });
        } catch (err) {
          console.error('Erro ao fazer upload da foto:', err);
        }
      }
      queryClient.invalidateQueries({ queryKey: ['/api/participantes-inclusao'] });
      toast({
        title: "Participante cadastrado com sucesso!",
        description: "O cadastro foi realizado."
      });
      onClose();
      form.reset();
      setCurrentSection(1);
      setAdditionalPhones([]);
      setEmergencyContacts([]);
      setFotoPreview(null);
      setFotoFile(null);
      setRelacionamentosFamiliares([]);
      setOutrosRelacionamentos([]);
      setTrabalhosAtuais([]);
      setExperienciasPassadas([]);
    },
      onError: async (error: any) => {
        const msg = (error?.message || "").toLowerCase();

        // Se sua apiRequest já joga error.message
        // mas se você usa fetch, pegue status/json
        if (error?.status === 409 || msg.includes("cpf") || error?.code === "CPF_DUPLICADO") {
          toast({
            title: "CPF já cadastrado",
            description: "Já existe um participante com esse CPF. Busque pelo nome/CPF e edite o cadastro.",
            variant: "destructive"
          });
          return;
        }

        toast({
          title: "Erro ao cadastrar participante",
          description: error?.message || "Não foi possível cadastrar o participante.",
          variant: "destructive"
        });
      }
  });

  const updateInclusaoMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest(`/api/participantes-inclusao/${editId}`, {
        method: 'PATCH',
        body: JSON.stringify(data)
      });
    },
    onSuccess: async (result: any) => {
      if (fotoFile) {
        try {
          const formData = new FormData();
          formData.append('foto', fotoFile);
          await fetch(`/api/participantes-inclusao/${editId}/foto`, {
            method: 'POST',
            body: formData
          });
        } catch (err) {
          console.error('Erro ao fazer upload da foto:', err);
        }
      }
      queryClient.invalidateQueries({ queryKey: ['/api/participantes-inclusao'] });
      toast({
        title: "Participante atualizado com sucesso!",
        description: "Os dados foram salvos."
      });
      onClose();
    },
    onError: (error: any) => {
      console.error('Erro ao atualizar participante:', error);
      toast({
        title: "Erro ao atualizar participante",
        description: error.message || "Ocorreu um erro ao atualizar o participante.",
        variant: "destructive"
      });
    }
  });

  // ===================== RASCUNHOS: handlers =====================
  function refreshDrafts() {
    const modeKey = (mode === "inclusao" ? "inclusao" : "pec") as DraftMode;
    setDrafts(listDraftsLS(userIdLS, modeKey));
  }

  function handleOpenSaveDraft() {
    setDraftName("");
    setShowSaveDraftDialog(true);
  }

  function handleConfirmSaveDraft() {
    const name = draftName.trim();
    if (!name) {
      toast({ title: "Digite um nome para o rascunho", variant: "destructive" });
      return;
    }

    const modeKey = (mode === "inclusao" ? "inclusao" : "pec") as DraftMode;
    const nowIso = new Date().toISOString();

    // pega o snapshot do form + estados externos
    const rawFormValues = form.getValues(); // inclui data_entrada como Date
    const formValues = dehydrateFormValues(rawFormValues);

    const draft: StudentDraft = {
      id: crypto?.randomUUID?.() ? crypto.randomUUID() : String(Date.now()),
      name,
      mode: modeKey,
      schemaVersion: DRAFT_SCHEMA_VERSION,
      createdAt: nowIso,
      updatedAt: nowIso,
      payload: {
        formValues,
        additionalPhones,
        emergencyContacts,
        relacionamentosFamiliares,
        outrosRelacionamentos,
        trabalhosAtuais,
        experienciasPassadas,
        currentSection,
        fotoPreview,
        pendingDocumentosMeta: (pendingDocumentos || []).map(f => ({
          name: f.name,
          size: f.size,
          type: f.type,
        })),
      },
    };

    saveDraftLS(userIdLS, modeKey, draft);
    refreshDrafts();
    setShowSaveDraftDialog(false);

    toast({
      title: "Rascunho salvo",
      description: `Salvo como: ${name}`,
    });
  }

  function handleLoadDraft(d: StudentDraft) {
    // segurança: só carrega se for do modo atual
    const modeKey = (mode === "inclusao" ? "inclusao" : "pec") as DraftMode;
    if (d.mode !== modeKey) {
      toast({
        title: "Rascunho incompatível",
        description: "Esse rascunho é de outra área (PEC/Inclusão).",
        variant: "destructive",
      });
      return;
    }

    // reidrata Date
    const hydrated = hydrateFormValues(d.payload.formValues);

    // aplica no RHF e nos states externos
    form.reset(hydrated);

    setAdditionalPhones(d.payload.additionalPhones || []);
    setEmergencyContacts(d.payload.emergencyContacts || []);
    setRelacionamentosFamiliares(d.payload.relacionamentosFamiliares || []);
    setOutrosRelacionamentos(d.payload.outrosRelacionamentos || []);
    setTrabalhosAtuais(d.payload.trabalhosAtuais || []);
    setExperienciasPassadas(d.payload.experienciasPassadas || []);

    setFotoPreview(d.payload.fotoPreview || null);
    setFotoFile(null); // arquivo não vem do rascunho
    setPendingDocumentos([]); // arquivo não vem do rascunho

    setCurrentSection(d.payload.currentSection || 1);

    setShowDraftsDialog(false);

    toast({
      title: "Rascunho carregado",
      description: `Form preenchido com: ${d.name}`,
    });
  }

  function handleDeleteDraft(d: StudentDraft) {
    const modeKey = (mode === "inclusao" ? "inclusao" : "pec") as DraftMode;
    if (!confirm(`Excluir o rascunho "${d.name}"?`)) return;

    deleteDraftLS(userIdLS, modeKey, d.id);
    refreshDrafts();

    toast({ title: "Rascunho excluído" });
  }
  // =================== FIM RASCUNHOS: handlers =====================

  const onSubmit = (data: StudentRegistrationData) => {
   // ✅ Normalizar textos ANTES de montar payloads
  const nomeNormalizado = normalizePersonName(data.nome_completo);
  const naturalidadeNorm = normalizePersonName(data.naturalidade);
  const cidadeNorm = normalizePersonName(data.cidade);
  const bairroNorm = normalizePersonName(data.bairro);
  const logradouroNorm = normalizePersonName(data.logradouro);
  const pontoRefNorm = normalizePersonName(data.ponto_referencia);

  // RHF: contatos_emergencia
  const contatosEmergenciaNorm = (data.contatos_emergencia || []).map((c) => ({
    ...c,
    nome: normalizePersonName(c.nome),
  }));

  // States externos (relações)
  const relacionamentosFamiliaresNorm = (relacionamentosFamiliares || []).map((r) => ({
    ...r,
    nome: normalizePersonName(r.nome),
  }));

  const outrosRelacionamentosNorm = (outrosRelacionamentos || []).map((r) => ({
    ...r,
    nome: normalizePersonName(r.nome),
  }));

  // Preparar dados para envio
  const formattedData = {
    cpf: data.cpf,
    nome_completo: nomeNormalizado,
    area: data.area,
    foto_perfil: data.foto_perfil,
    data_nascimento: data.data_nascimento
      ? format(parse(data.data_nascimento, "dd/MM/yyyy", new Date()), "yyyy-MM-dd")
      : "",
    genero: data.genero,
    numero_matricula: data.numero_matricula,
    id_catraca: data.id_catraca,
    estado_civil: data.estado_civil,
    religiao: data.religiao,
    naturalidade: naturalidadeNorm,
    nacionalidade: data.nacionalidade,
    pode_sair_sozinho: data.pode_sair_sozinho,
    tamanho_calca: data.tamanho_calca,
    tamanho_camiseta: data.tamanho_camiseta,
    tamanho_calcado: data.tamanho_calcado,
    cor_raca: data.cor_raca,
    frequenta_projeto_social: data.frequenta_projeto_social,
    acesso_internet: data.acesso_internet,

    // Endereço
    cep: data.cep,
    logradouro: logradouroNorm,
    numero: data.numero,
    complemento: data.complemento,
    bairro: bairroNorm,
    cidade: cidadeNorm,
    estado: data.estado,
    ponto_referencia: pontoRefNorm,
    mora_desde_ano: data.mora_desde_ano,

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
    contatos_emergencia: contatosEmergenciaNorm,

    // Benefícios
    cadunico: data.cadunico,
    bolsa_familia: data.bolsa_familia,
    bpc: data.bpc,
    cartao_alimentacao: data.cartao_alimentacao,
    outros_beneficios: data.outros_beneficios,

    // Informações adicionais
    data_entrada: data.data_entrada ? format(data.data_entrada, "yyyy-MM-dd") : undefined,
    forma_acesso: data.forma_acesso,
    demandas: data.demandas || [],
    observacoes_gerais: data.observacoes_gerais,

    // Escolar
    serie: data.serie,
    situacao_escolar: data.situacao_escolar,
    turno_escolar: data.turno_escolar,
    instituicao_ensino: data.instituicao_ensino,
    e_alfabetizado: data.e_alfabetizado,
    bairro_escola: data.bairro_escola,

    // Profissional
    procura_trabalho: data.procura_trabalho,
    trabalhos_atuais: trabalhosAtuais,
    experiencias_profissionais: [...trabalhosAtuais, ...experienciasPassadas],

    // Relações
    relacionamentos_familiares: relacionamentosFamiliaresNorm,
    outros_relacionamentos: outrosRelacionamentosNorm,

    // Saúde
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
    professorId: data.professorId || parseInt(localStorage.getItem("userId") || "0"),
  };

    if (mode === 'inclusao') {
      // Converter dados para formato da API de inclusão produtiva
      const inclusaoData = {
        nome: nomeNormalizado,
        cpf: data.cpf || null,
        email: data.email || null,
        telefone: data.telefone,
        genero: data.genero,
        dataNascimento: data.data_nascimento
          ? format(parse(data.data_nascimento, "dd/MM/yyyy", new Date()), "yyyy-MM-dd")
          : null,
        codigoMatricula: data.numero_matricula,
        idCatraca: data.id_catraca || null,

        estadoCivil: data.estado_civil,
        religiao: data.religiao,
        naturalidade: naturalidadeNorm,
        nacionalidade: data.nacionalidade,

        podeSairSozinho: data.pode_sair_sozinho,
        tamanhoCalca: data.tamanho_calca,
        tamanhoCamiseta: data.tamanho_camiseta,
        tamanhoCalcado: data.tamanho_calcado,
        corRaca: data.cor_raca,

        frequentaProjetoSocial: data.frequenta_projeto_social,
        projetoSocialQual: data.projeto_social_qual,
        acessoInternet: data.acesso_internet,
        internetQual: data.internet_qual,

        rg: data.rg,
        orgaoEmissor: data.orgao_emissor,
        ctpsNumero: data.ctps_numero,
        ctpsSerie: data.ctps_serie,
        tituloEleitor: data.titulo_eleitor,
        nisPisPasep: data.nis_pis_pasep,
        documentosPossui: data.documentos_possui,

        telefoneWhatsapp: data.telefone_whatsapp,

        // ✅ normaliza nomes do state também
        telefonesAdicionais: additionalPhones,
        contatosEmergencia: emergencyContacts.map((c) => ({
          ...c,
          nome: normalizePersonName(c.nome),
        })),

        cep: data.cep,
        logradouro: logradouroNorm,
        numero: data.numero,
        complemento: data.complemento,
        bairro: bairroNorm,
        cidade: cidadeNorm,
        estado: data.estado,
        pontoReferencia: pontoRefNorm,
        moraDesdeAno: data.mora_desde_ano,

        cadunico: data.cadunico,
        bolsaFamilia: data.bolsa_familia,
        bpc: data.bpc,
        cartaoAlimentacao: data.cartao_alimentacao,
        outrosBeneficios: data.outros_beneficios,

        dataEntrada: data.data_entrada ? format(data.data_entrada, "yyyy-MM-dd") : null,
        formaAcesso: data.forma_acesso,
        demandas: data.demandas,
        observacoesGerais: data.observacoes_gerais,

        serie: data.serie,
        situacaoEscolar: data.situacao_escolar,
        turnoEscolar: data.turno_escolar,
        instituicaoEnsino: data.instituicao_ensino,
        eAlfabetizado: data.e_alfabetizado,
        bairroEscola: data.bairro_escola,

        procuraTrabalho: data.procura_trabalho,
        trabalhosAtuais: trabalhosAtuais,
        experienciasProfissionais: [...trabalhosAtuais, ...experienciasPassadas],

        possuiParticularidadeSaude: data.possui_particularidade_saude,
        detalhesParticularidade: data.detalhes_particularidade,
        possuiAlergia: data.possui_alergia,
        detalhesAlergia: data.detalhes_alergia,
        fazUsoMedicamento: data.faz_uso_medicamento,
        detalhesMedicamento: data.detalhes_medicamento,
        possuiDeficiencia: data.possui_deficiencia,
        detalhesDeficiencia: data.detalhes_deficiencia,
        contatosSaude: data.contatos_saude,
        fazUsoQuimicos: data.faz_uso_quimicos,
        familiarUsaQuimicos: data.familiar_usa_quimicos,
        tipoSanguineo: data.tipo_sanguineo,
        restricaoAlimentar: data.restricao_alimentar,
        detalhesRestricaoAlimentar: data.detalhes_restricao_alimentar,
        possuiConvenioMedico: data.possui_convenio_medico,
        detalhesConvenioMedico: data.detalhes_convenio_medico,
        historicoMedico: data.historico_medico,
        jaTeveOuCostumaTer: data.ja_teve_ou_costuma_ter,
        detalhesHistoricoMedico: data.detalhes_historico_medico,

        // ✅ normaliza relações
        relacionamentosFamiliares: relacionamentosFamiliaresNorm,
        outrosRelacionamentos: outrosRelacionamentosNorm,
      };
      
      if (isEditMode && editId) {
        updateInclusaoMutation.mutate(inclusaoData);
      } else {
        createInclusaoMutation.mutate(inclusaoData);
      }
    } else {
      // PEC mode - usa API de alunos
      if (isEditMode) {
        updateStudentMutation.mutate(formattedData);
      } else {
        createStudentMutation.mutate(formattedData);
      }
    }
  };

    // ===================== RASCUNHOS: carregar lista ao abrir =====================
  useEffect(() => {
    if (!open) return;
    // só faz sentido listar no modo cadastro novo; se quiser também em edição, remove essa condição
    if (isEditMode) return;

    const modeKey = (mode === "inclusao" ? "inclusao" : "pec") as DraftMode;
    const list = listDraftsLS(userIdLS, modeKey);
    setDrafts(list);
  }, [open, mode, isEditMode]);
  // =================== FIM RASCUNHOS: carregar lista ao abrir ===================

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

  const nextSection = async () => {
    const required = sectionRequiredFields[currentSection] || [];

    const isValidSection = await form.trigger(required as any, {
      shouldFocus: true,
    });

    if (!isValidSection) {
      toast({
        title: "Campos obrigatórios faltando",
        description: "Preencha os campos desta seção para continuar.",
        variant: "destructive",
      });
      return;
    }

    // Bloquear avanço se CPF já está cadastrado (seção 1)
    if (currentSection === 1 && cpfLookup.status === "exists") {
      toast({
        title: "CPF já cadastrado",
        description: `Já existe um cadastro para ${cpfLookup.nome || "este aluno"}. Busque pelo CPF e edite o cadastro existente.`,
        variant: "destructive",
      });
      return;
    }

    setCurrentSection(prev => Math.min(prev + 1, 11));
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
    const sectionRequiredFields: Record<number, Array<keyof StudentRegistrationData>> = {
      1: ["nome_completo", "area", "cpf", "data_nascimento", "genero"],
      2: [],
      3: ["telefone"],
      6: ["data_entrada", "forma_acesso"],
    };
    const [cpfLookup, setCpfLookup] = useState<{
      status: "idle" | "checking" | "exists" | "available" | "invalid" | "error";
      nome?: string;
      id?: number;
    }>({ status: "idle" });

    const originalCpfRef = React.useRef<string | null>(null);

 
    function parseBRDateToDate(br: string): Date | null {
  const s = String(br ?? "").trim();
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(s)) return null;
  const d = parse(s, "dd/MM/yyyy", new Date());
  return isValid(d) ? d : null;
}

    const watchedCpf = form.watch("cpf");
  const watchedArea = form.watch("area");

useEffect(() => {
  const cpfDigits = onlyDigits(watchedCpf || "");
  const area = watchedArea as "pec" | "inclusao" | undefined;

  // Só roda quando tiver área e CPF completo
  if (!area) return;

  // Se estiver editando e CPF é o mesmo do registro, não acusa duplicado
  const originalCpf = originalCpfRef.current;
  if (isEditMode && originalCpf && cpfDigits === originalCpf) {
    setCpfLookup({ status: "idle" });
    return;
  }

  if (cpfDigits.length === 0) {
    setCpfLookup({ status: "idle" });
    return;
  }

  if (cpfDigits.length !== 11) {
    setCpfLookup({ status: "invalid" });
    return;
  }

  const t = setTimeout(async () => {
    setCpfLookup({ status: "checking" });

    try {
      // ✅ Sugestão de endpoints (veja a seção 4 abaixo)
      const res = await fetch(`/api/cpf-lookup?area=${area}&cpf=${cpfDigits}`, {
        credentials: "include",
      });

      if (res.ok) {
        const data = await res.json();
        if (data?.exists) {
          setCpfLookup({
            status: "exists",
            nome: data.nome,
            id: data.id,
          });
        } else {
          setCpfLookup({ status: "available" });
        }
        return;
      }

      // Se API responder 404/204 como "não existe"
      if (res.status === 404 || res.status === 204) {
        setCpfLookup({ status: "available" });
        return;
      }

      setCpfLookup({ status: "error" });
    } catch {
      setCpfLookup({ status: "error" });
    }
  }, 500); // debounce

  return () => clearTimeout(t);
}, [watchedCpf, watchedArea, isEditMode]);
      return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isReadOnly ? '👁 Visualizar Aluno' : isEditMode ? 'Editar Aluno' : 'Cadastro Completo de Aluno'}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form 
            onSubmit={form.handleSubmit(onSubmit)} 
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.target instanceof HTMLInputElement) {
                e.preventDefault();
              }
            }}
            className="space-y-6"
          >
            {/* Progress indicator */}
            <div className="flex items-center justify-between mb-6 overflow-x-auto">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((section) => (
                <div key={section} className="flex items-center">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold ${
                      currentSection === section
                        ? mode === 'inclusao' ? 'bg-green-500 text-white' : 'bg-orange-500 text-white'
                        : currentSection > section
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {section}
                  </div>
                  {section < 11 && (
                    <div className={`w-4 h-1 ${currentSection > section ? 'bg-green-500' : 'bg-gray-200'}`} />
                  )}
                </div>
              ))}
            </div>

            <div className="text-sm text-gray-600 mb-4">
              {currentSection === 1 && "Seção 1: Identificação"}
              {currentSection === 2 && "Seção 2: Documentos"}
              {currentSection === 3 && "Seção 3: Contato"}
              {currentSection === 4 && "Seção 4: Endereço"}
              {currentSection === 5 && "Seção 5: Benefícios Sociais"}
              {currentSection === 6 && "Seção 6: Informações Adicionais"}
              {currentSection === 7 && "Seção 7: Escolar"}
              {currentSection === 8 && "Seção 8: Profissional"}
              {currentSection === 9 && "Seção 9: Saúde"}
              {currentSection === 10 && "Seção 10: Grupos"}
              {currentSection === 11 && "Seção 11: Família e Responsáveis"}
            </div>

            {/* SEÇÃO 1: Identificação */}
            {currentSection === 1 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Identificação</h3>

                {/* Upload de Foto */}
                <div className="flex items-start gap-4 mb-4">
                  <div className="flex flex-col items-center">
                    <div className="w-24 h-24 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden bg-gray-50">
                      {fotoPreview ? (
                        <img 
                          src={fotoPreview} 
                          alt="Preview" 
                          className="w-24 h-24 rounded-full object-cover"
                          style={{ minWidth: '100%', minHeight: '100%' }}
                        />
                      ) : (
                        <Upload className="w-8 h-8 text-gray-400" />
                      )}
                    </div>
                    <label className="mt-2 cursor-pointer">
                      <span className="text-sm text-blue-600 hover:underline">
                        {fotoPreview ? 'Trocar foto' : 'Adicionar foto'}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFotoChange}
                      />
                    </label>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-500">Foto do aluno (opcional)</p>
                    <p className="text-xs text-gray-400">Formatos: JPG, PNG. Máx: 5MB</p>
                  </div>
                </div>
                
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
                            name="area"
                            render={({ field }) => (
                              <FormItem className="col-span-2">
                                <FormLabel>Área do aluno *</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger data-testid="select-area">
                                      <SelectValue placeholder="Selecione a área" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="pec">PEC</SelectItem>
                                    <SelectItem value="inclusao">Inclusão Produtiva</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                        <FormField
  control={form.control}
  name="cpf"
  render={({ field }) => {
    const isDuplicado = cpfLookup.status === "exists";
    const isChecking = cpfLookup.status === "checking";

    return (
      <FormItem className="col-span-2">
        <FormLabel>CPF *</FormLabel>

        <FormControl>
          <div className="space-y-2">
            <Input
              {...field}
              placeholder="000.000.000-00"
              data-testid="input-cpf"
              value={field.value || ""}
              onChange={(e) => {
                const masked = maskCPF(e.target.value);
                field.onChange(masked);
                const digits = masked.replace(/\D/g, '');
                form.setValue('id_catraca', digits);
              }}
              className={[
                isDuplicado ? "border-red-500 focus-visible:ring-red-500" : "",
              ].join(" ")}
            />

            {isChecking && (
              <p className="text-xs text-muted-foreground">Consultando CPF...</p>
            )}

            {isDuplicado && (
              <div className="text-sm text-red-600">
                <div className="font-semibold">CPF já cadastrado</div>
                {cpfLookup.nome && (
                  <div className="text-xs text-red-600">
                    Cadastro em nome de: <span className="font-medium">{cpfLookup.nome}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </FormControl>

        <FormMessage />
      </FormItem>
    );
  }}
/>

                  <FormField
                    control={form.control}
                    name="data_nascimento"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data de Nascimento *</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            value={field.value || ''}
                            placeholder="DD/MM/AAAA"
                            data-testid="input-data-nascimento"
                            onChange={(e) => field.onChange(maskDate(e.target.value))}
                          />
                        </FormControl>
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

                <div className="grid grid-cols-1 gap-4">

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

                {/* Carteira de Trabalho — Sim/Não */}
                <FormField
                  control={form.control}
                  name="possui_carteira_trabalho"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Possui Carteira de Trabalho?</FormLabel>
                      <FormControl>
                        <RadioGroup onValueChange={field.onChange} value={field.value} className="flex gap-4">
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="sim" id="ctps-sim" />
                            <Label htmlFor="ctps-sim">Sim</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="nao" id="ctps-nao" />
                            <Label htmlFor="ctps-nao">Não</Label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {form.watch('possui_carteira_trabalho') === 'sim' && (
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="ctps_numero"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Número da Carteira de Trabalho</FormLabel>
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
                          <FormLabel>Série</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Série" data-testid="input-ctps-serie" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {/* Título de Eleitor — Sim/Não */}
                <FormField
                  control={form.control}
                  name="possui_titulo_eleitor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Possui Título de Eleitor?</FormLabel>
                      <FormControl>
                        <RadioGroup onValueChange={field.onChange} value={field.value} className="flex gap-4">
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="sim" id="titulo-sim" />
                            <Label htmlFor="titulo-sim">Sim</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="nao" id="titulo-nao" />
                            <Label htmlFor="titulo-nao">Não</Label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {form.watch('possui_titulo_eleitor') === 'sim' && (
                  <FormField
                    control={form.control}
                    name="titulo_eleitor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Número do Título de Eleitor</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Número" data-testid="input-titulo-eleitor" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <div className="grid grid-cols-2 gap-4">
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

                {/* Upload de Documentos */}
                <div className="mt-6 pt-4 border-t">
                  <div className="flex items-center gap-2 mb-3">
                    <FileText className="w-4 h-4" />
                    <h4 className="font-semibold">Arquivos de Documentos</h4>
                  </div>
                  
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.webp"
                    className="hidden"
                    id={`doc-upload-aluno-${isEditMode ? editCpf : 'new'}`}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      
                      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
                      if (!allowedTypes.includes(file.type)) {
                        toast({
                          title: "Tipo de arquivo não permitido",
                          description: "Use PDF, JPG, PNG ou WEBP",
                          variant: "destructive"
                        });
                        e.target.value = '';
                        return;
                      }
                      
                      if (file.size > 10 * 1024 * 1024) {
                        toast({
                          title: "Arquivo muito grande",
                          description: "Máximo 10MB",
                          variant: "destructive"
                        });
                        e.target.value = '';
                        return;
                      }
                      
                      if (isEditMode) {
                        setUploadingDocumento(true);
                        try {
                          const formData = new FormData();
                          formData.append('documento', file);
                          
                          const res = await fetch(`/api/documentos/aluno/${editCpf}`, {
                            method: 'POST',
                            body: formData,
                            credentials: 'include'
                          });
                          
                          if (res.ok) {
                            const docsRes = await fetch(`/api/documentos/aluno/${editCpf}`, { credentials: 'include' });
                            if (docsRes.ok) {
                              const docsData = await docsRes.json();
                              setDocumentos(docsData || []);
                            }
                            toast({
                              title: "Documento enviado",
                              description: "Arquivo salvo com sucesso"
                            });
                          } else {
                            const errorData = await res.json().catch(() => ({}));
                            throw new Error(errorData.message || 'Erro no upload');
                          }
                        } catch (err: any) {
                          toast({
                            title: "Erro ao enviar documento",
                            description: err.message || "Tente novamente",
                            variant: "destructive"
                          });
                        } finally {
                          setUploadingDocumento(false);
                        }
                      } else {
                        setPendingDocumentos(prev => [...prev, file]);
                        toast({
                          title: "Documento adicionado",
                          description: "Será enviado ao salvar o cadastro"
                        });
                      }
                      e.target.value = '';
                    }}
                  />
                  
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={uploadingDocumento}
                    onClick={() => document.getElementById(`doc-upload-aluno-${isEditMode ? editCpf : 'new'}`)?.click()}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {uploadingDocumento ? 'Enviando...' : 'Adicionar Documento'}
                  </Button>
                  
                  <p className="text-xs text-muted-foreground mt-1">
                    Formatos aceitos: PDF, JPG, PNG, WEBP (máx. 10MB)
                    {!isEditMode && pendingDocumentos.length > 0 && ' - Serão enviados ao salvar'}
                  </p>
                  
                  {/* Lista de documentos pendentes (modo cadastro novo) */}
                  {!isEditMode && pendingDocumentos.length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm font-medium mb-2">Documentos a enviar ({pendingDocumentos.length}):</p>
                      <div className="space-y-2">
                        {pendingDocumentos.map((file, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4" />
                              <span className="text-sm">{file.name}</span>
                              <span className="text-xs text-muted-foreground">
                                ({(file.size / 1024).toFixed(1)} KB)
                              </span>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setPendingDocumentos(prev => prev.filter((_, i) => i !== index));
                                toast({ title: "Documento removido" });
                              }}
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Lista de documentos salvos (modo edição) */}
                  {isEditMode && (
                    <div className="mt-4">
                      {loadingDocumentos ? (
                        <p className="text-sm text-muted-foreground">Carregando documentos...</p>
                      ) : documentos.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Nenhum documento enviado</p>
                      ) : (
                        <div className="space-y-2">
                          {documentos.map((doc: any) => (
                            <div key={doc.id} className="flex items-center justify-between p-2 bg-muted rounded">
                              <div className="flex items-center gap-2">
                                <FileText className="w-4 h-4" />
                                <span className="text-sm">{doc.nomeArquivo || doc.nome_arquivo}</span>
                                <span className="text-xs text-muted-foreground">
                                  ({((doc.tamanhoBytes || doc.tamanho_bytes || 0) / 1024).toFixed(1)} KB)
                                </span>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={async () => {
                                  if (confirm('Excluir este documento?')) {
                                    try {
                                      const res = await fetch(`/api/documentos/${doc.id}`, { 
                                        method: 'DELETE',
                                        credentials: 'include'
                                      });
                                      if (res.ok) {
                                        setDocumentos(prev => prev.filter((d: any) => d.id !== doc.id));
                                        toast({ title: "Documento excluído" });
                                      } else {
                                        throw new Error('Erro ao excluir');
                                      }
                                    } catch (err) {
                                      toast({ 
                                        title: "Erro ao excluir documento", 
                                        variant: "destructive" 
                                      });
                                    }
                                  }
                                }}
                              >
                                <Trash2 className="w-4 h-4 text-red-500" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
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
                  render={({ field }) => {
                    const [showSuggestions, setShowSuggestions] = React.useState(false);
                    const emailDomains = ['@gmail.com', '@hotmail.com', '@outlook.com', '@yahoo.com', '@icloud.com', '@live.com'];
                    const value = field.value || '';
                    const hasAt = value.includes('@');
                    const atIndex = value.indexOf('@');
                    const beforeAt = hasAt ? value.slice(0, atIndex) : value;
                    const afterAt = hasAt ? value.slice(atIndex) : '';
                    
                    const filteredDomains = emailDomains.filter(d => 
                      !afterAt || d.toLowerCase().startsWith(afterAt.toLowerCase())
                    );
                    
                    return (
                      <FormItem className="relative">
                        <FormLabel>E-mail</FormLabel>
                        <FormControl>
                          <Input 
                            {...field}
                            value={value}
                            placeholder="email@exemplo.com" 
                            data-testid="input-email"
                            onChange={(e) => {
                              const newValue = e.target.value.toLowerCase().replace(/\s/g, '');
                              field.onChange(newValue);
                              setShowSuggestions(newValue.includes('@') && !newValue.includes('.com'));
                            }}
                            onFocus={() => {
                              if (value.includes('@') && !value.includes('.com')) {
                                setShowSuggestions(true);
                              }
                            }}
                            onBlur={() => {
                              setTimeout(() => setShowSuggestions(false), 200);
                            }}
                          />
                        </FormControl>
                        {showSuggestions && filteredDomains.length > 0 && (
                          <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-48 overflow-auto">
                            {filteredDomains.map((domain) => (
                              <div
                                key={domain}
                                className="px-3 py-2 cursor-pointer hover:bg-gray-100"
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  field.onChange(beforeAt + domain);
                                  setShowSuggestions(false);
                                }}
                              >
                                {beforeAt}{domain}
                              </div>
                            ))}
                          </div>
                        )}
                        <FormMessage />
                      </FormItem>
                    );
                  }}
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
                            <Input 
                              {...field} 
                              placeholder="(00) 00000-0000" 
                              className="flex-1" 
                              data-testid="input-telefone"
                              value={field.value || ''}
                              onChange={(e) => field.onChange(maskPhone(e.target.value))}
                            />
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

            {/* SEÇÃO 4: Endereço */}
            {currentSection === 4 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Endereço</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="cep"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CEP</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            value={field.value || ''} 
                            placeholder="00000-000" 
                            data-testid="input-cep"
                            onChange={async (e) => {
                              const masked = maskCEP(e.target.value);
                              field.onChange(masked);
                              
                              // Buscar endereço quando CEP completo (8 dígitos)
                              const digits = masked.replace(/\D/g, '');
                              if (digits.length === 8) {
                                const address = await fetchAddressByCEP(digits);
                                if (address) {
                                  form.setValue('logradouro', address.logradouro);
                                  form.setValue('bairro', address.bairro);
                                  form.setValue('cidade', address.cidade);
                                  form.setValue('estado', address.estado);
                                }
                              }
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="estado"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estado</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ''}>
                          <FormControl>
                            <SelectTrigger data-testid="select-estado">
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="AC">Acre</SelectItem>
                            <SelectItem value="AL">Alagoas</SelectItem>
                            <SelectItem value="AP">Amapá</SelectItem>
                            <SelectItem value="AM">Amazonas</SelectItem>
                            <SelectItem value="BA">Bahia</SelectItem>
                            <SelectItem value="CE">Ceará</SelectItem>
                            <SelectItem value="DF">Distrito Federal</SelectItem>
                            <SelectItem value="ES">Espírito Santo</SelectItem>
                            <SelectItem value="GO">Goiás</SelectItem>
                            <SelectItem value="MA">Maranhão</SelectItem>
                            <SelectItem value="MT">Mato Grosso</SelectItem>
                            <SelectItem value="MS">Mato Grosso do Sul</SelectItem>
                            <SelectItem value="MG">Minas Gerais</SelectItem>
                            <SelectItem value="PA">Pará</SelectItem>
                            <SelectItem value="PB">Paraíba</SelectItem>
                            <SelectItem value="PR">Paraná</SelectItem>
                            <SelectItem value="PE">Pernambuco</SelectItem>
                            <SelectItem value="PI">Piauí</SelectItem>
                            <SelectItem value="RJ">Rio de Janeiro</SelectItem>
                            <SelectItem value="RN">Rio Grande do Norte</SelectItem>
                            <SelectItem value="RS">Rio Grande do Sul</SelectItem>
                            <SelectItem value="RO">Rondônia</SelectItem>
                            <SelectItem value="RR">Roraima</SelectItem>
                            <SelectItem value="SC">Santa Catarina</SelectItem>
                            <SelectItem value="SP">São Paulo</SelectItem>
                            <SelectItem value="SE">Sergipe</SelectItem>
                            <SelectItem value="TO">Tocantins</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="cidade"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cidade</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ''} placeholder="Nome da cidade" data-testid="input-cidade" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="bairro"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bairro</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ''} placeholder="Nome do bairro" data-testid="input-bairro" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="logradouro"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Logradouro (Rua, Avenida, etc.)</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ''} placeholder="Ex: Rua das Flores" data-testid="input-logradouro" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="numero"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Número</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ''} placeholder="Nº" data-testid="input-numero" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="complemento"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Complemento</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ''} placeholder="Apto, Bloco, etc." data-testid="input-complemento" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="ponto_referencia"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ponto de Referência</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ''} placeholder="Ex: Próximo à padaria" data-testid="input-ponto-referencia" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="mora_desde_ano"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mora neste endereço desde (ano)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field} 
                          value={field.value || ''} 
                          onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
                          placeholder="Ex: 2020" 
                          data-testid="input-mora-desde" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* SEÇÃO 5: Benefícios Sociais */}
            {currentSection === 5 && (
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

            {/* SEÇÃO 6: Informações Adicionais */}
            {currentSection === 6 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Informações Adicionais</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="data_entrada"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data de entrada *</FormLabel>
                       <div className="flex gap-2">
                        <FormControl>
                          <Input
                            value={field.value ? format(field.value, "dd/MM/yyyy") : ""}
                            placeholder="dd/mm/aaaa"
                            onChange={(e) => {
                              const raw = e.target.value;
                              // mascara leve (opcional)
                              const digits = raw.replace(/\D/g, "").slice(0, 8);
                              const masked =
                                digits.length <= 2 ? digits :
                                digits.length <= 4 ? `${digits.slice(0,2)}/${digits.slice(2)}` :
                                `${digits.slice(0,2)}/${digits.slice(2,4)}/${digits.slice(4)}`;

                               e.target.value = masked;
                              const parsedDate = parseBRDateToDate(masked);
                              if (parsedDate) field.onChange(parsedDate);
                            }}
                          />
                        </FormControl>

                        <Popover>
                          <PopoverTrigger asChild>
                            <Button type="button" variant="outline" className="shrink-0">
                              <CalendarIcon className="h-4 w-4" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={(d) => d && field.onChange(d)}
                              captionLayout="buttons"  // bem menos bugado que dropdown em modal
                              fromYear={1900}
                              toYear={new Date().getFullYear()}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>

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

            {/* SEÇÃO 7: Escolar */}
            {currentSection === 7 && (
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
                            <SelectItem value="Não escolarizado">Não escolarizado</SelectItem>
                            <SelectItem value="Maternal I">Maternal I</SelectItem>
                            <SelectItem value="Maternal II">Maternal II</SelectItem>
                            <SelectItem value="Pré I">Pré I</SelectItem>
                            <SelectItem value="Pré II">Pré II</SelectItem>
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
                            <SelectItem value="Ensino Médio Completo">Ensino Médio Completo</SelectItem>
                            <SelectItem value="Superior Incompleto">Superior Incompleto</SelectItem>
                            <SelectItem value="Superior Completo">Superior Completo</SelectItem>
                            <SelectItem value="Pós-graduação">Pós-graduação</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {!['Ensino Médio Completo', 'Superior Incompleto', 'Superior Completo', 'Pós-graduação'].includes(form.watch('serie') || '') && (
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
                  )}
                </div>

                {/* Campos extras quando já concluiu o Ensino Médio */}
                {['Ensino Médio Completo', 'Superior Incompleto', 'Superior Completo', 'Pós-graduação'].includes(form.watch('serie') || '') && (
                  <div className="grid grid-cols-2 gap-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
                    <FormField
                      control={form.control}
                      name="escola_formou"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Escola onde concluiu o Ensino Médio</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value || ''} placeholder="Nome da escola" data-testid="input-escola-formou" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="ano_conclusao_em"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Ano de conclusão do Ensino Médio</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value || ''} placeholder="Ex: 2019" data-testid="input-ano-conclusao-em" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

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

            {/* SEÇÃO 8: Profissional */}
            {currentSection === 8 && (
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
                            <Label htmlFor="procura-sim">Sim</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="nao" id="procura-nao" />
                            <Label htmlFor="procura-nao">Não</Label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <h4 className="font-semibold">Trabalhos atuais</h4>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      className="bg-orange-500 hover:bg-orange-600 text-white border-orange-500"
                      onClick={() => {
                        setNovoTrabalho({ empresa: '', cargo: '', dataEntrada: '', dataSaida: '', remuneracao: '' });
                        setShowAddTrabalhoModal(true);
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar
                    </Button>
                  </div>
                  <p className="text-xs text-gray-600">
                    Nesta tabela são apresentados os trabalhos sem data de saída ou com data de saída futura.
                  </p>
                  <div className="border rounded-lg">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">EMPRESA</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">CARGO</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">PERÍODO</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">AÇÃO</th>
                        </tr>
                      </thead>
                      <tbody>
                        {trabalhosAtuais.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="px-4 py-6 text-center text-sm text-gray-500">
                              Nenhum histórico profissional registrado
                            </td>
                          </tr>
                        ) : (
                          trabalhosAtuais.map((trab, idx) => (
                            <tr key={idx} className="border-t">
                              <td className="px-4 py-2 text-sm">{trab.empresa}</td>
                              <td className="px-4 py-2 text-sm">{trab.cargo}</td>
                              <td className="px-4 py-2 text-sm">{trab.dataEntrada} - {trab.dataSaida || 'Atual'}</td>
                              <td className="px-4 py-2">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setTrabalhosAtuais(prev => prev.filter((_, i) => i !== idx))}
                                >
                                  <Trash2 className="w-4 h-4 text-red-500" />
                                </Button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold">Experiências passadas</h4>
                  <p className="text-xs text-gray-600">
                    Nesta tabela são apresentados os trabalhos com data de saída igual ou anterior a hoje.
                  </p>
                  <div className="border rounded-lg">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">EMPRESA</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">CARGO</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">PERÍODO</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">AÇÃO</th>
                        </tr>
                      </thead>
                      <tbody>
                        {experienciasPassadas.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="px-4 py-6 text-center text-sm text-gray-500">
                              Nenhum histórico profissional registrado
                            </td>
                          </tr>
                        ) : (
                          experienciasPassadas.map((exp, idx) => (
                            <tr key={idx} className="border-t">
                              <td className="px-4 py-2 text-sm">{exp.empresa}</td>
                              <td className="px-4 py-2 text-sm">{exp.cargo}</td>
                              <td className="px-4 py-2 text-sm">{exp.dataEntrada} - {exp.dataSaida}</td>
                              <td className="px-4 py-2">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setExperienciasPassadas(prev => prev.filter((_, i) => i !== idx))}
                                >
                                  <Trash2 className="w-4 h-4 text-red-500" />
                                </Button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Modal para adicionar trabalho */}
                <Dialog open={showAddTrabalhoModal} onOpenChange={setShowAddTrabalhoModal}>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Adicionar Experiência Profissional</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Empresa *</Label>
                        <Input 
                          value={novoTrabalho.empresa}
                          onChange={(e) => setNovoTrabalho({...novoTrabalho, empresa: e.target.value})}
                          placeholder="Nome da empresa"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Cargo *</Label>
                        <Input 
                          value={novoTrabalho.cargo}
                          onChange={(e) => setNovoTrabalho({...novoTrabalho, cargo: e.target.value})}
                          placeholder="Cargo ocupado"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Data de Entrada *</Label>
                          <Input 
                            type="date"
                            value={novoTrabalho.dataEntrada}
                            onChange={(e) => setNovoTrabalho({...novoTrabalho, dataEntrada: e.target.value})}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Data de Saída</Label>
                          <Input 
                            type="date"
                            value={novoTrabalho.dataSaida}
                            onChange={(e) => setNovoTrabalho({...novoTrabalho, dataSaida: e.target.value})}
                          />
                          <p className="text-xs text-gray-500">Deixe vazio se trabalho atual</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Remuneração</Label>
                        <Input 
                          value={novoTrabalho.remuneracao}
                          onChange={(e) => setNovoTrabalho({...novoTrabalho, remuneracao: e.target.value})}
                          placeholder="Ex: R$ 1.500,00"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={() => setShowAddTrabalhoModal(false)}>
                        Cancelar
                      </Button>
                      <Button 
                        type="button"
                        onClick={() => {
                          if (!novoTrabalho.empresa || !novoTrabalho.cargo || !novoTrabalho.dataEntrada) {
                            toast({ title: "Preencha empresa, cargo e data de entrada", variant: "destructive" });
                            return;
                          }
                          const hoje = new Date().toISOString().split('T')[0];
                          if (!novoTrabalho.dataSaida || novoTrabalho.dataSaida > hoje) {
                            setTrabalhosAtuais(prev => [...prev, novoTrabalho]);
                          } else {
                            setExperienciasPassadas(prev => [...prev, novoTrabalho]);
                          }
                          setShowAddTrabalhoModal(false);
                          toast({ title: "Experiência adicionada" });
                        }}
                      >
                        Adicionar
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            )}

            {/* SEÇÃO 9: Saúde */}
            {currentSection === 9 && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold">Dados de saúde</h3>
                
                {/* Particularidades */}
                <div className="space-y-4">
                  <h4 className="font-semibold">Particularidades</h4>
                  <FormField control={form.control} name="possui_particularidade_saude" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Possui algum problema particular de saúde?</FormLabel>
                      <FormControl>
                        <RadioGroup onValueChange={field.onChange} value={field.value} className="flex gap-4">
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
                  )} />

                  {form.watch("possui_particularidade_saude") === "sim" && (
                    <FormField control={form.control} name="detalhes_particularidade" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Qual?</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ""} placeholder="Descreva a particularidade" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  )}
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
                  {form.watch("possui_alergia") === "sim" && (
                    <FormField control={form.control} name="detalhes_alergia" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Qual alergia?</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ""} placeholder="Descreva a alergia" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  )}
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
                  {form.watch("faz_uso_medicamento") === "sim" && (
                    <FormField control={form.control} name="detalhes_medicamento" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Qual medicação?</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ""} placeholder="Nome do medicamento e dosagem" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  )}
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
                  {form.watch("possui_deficiencia") === "sim" && (
                    <FormField control={form.control} name="detalhes_deficiencia" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Qual deficiência?</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ""} placeholder="Descreva o tipo de deficiência" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  )}
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
                  {form.watch("restricao_alimentar") === "sim" && (
                    <FormField control={form.control} name="detalhes_restricao_alimentar" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Qual restrição alimentar?</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ""} placeholder="Ex: intolerância a lactose, alergia a glúten..." />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  )}

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

                  {form.watch("possui_convenio_medico") === "sim" && (
                    <FormField
                      control={form.control}
                      name="detalhes_convenio_medico"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Qual convênio?</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              value={field.value || ""}
                              placeholder="Ex: Unimed, Bradesco Saúde, SulAmérica..."
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <div>
                    <p className="text-sm font-medium leading-none">HISTÓRICO MÉDICO:</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Informe doenças cardiovasculares, pulmonares, ortopédicas e musculares, além de cirurgias e condições como diabetes, obesidade e hipertensão
                    </p>
                  </div>

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

            {/* SEÇÃO 11: Família e Responsáveis */}
            {currentSection === 11 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Responsáveis pelo Aluno</h3>
                <p className="text-sm text-gray-600">
                  Cadastre os responsáveis legais pelo aluno (pai, mãe, tutor ou outro). Você pode adicionar vários e marcar qual é o responsável principal.
                </p>

                {responsaveisData.length > 0 && (
                  <div className="space-y-3">
                    {responsaveisData.map((resp, idx) => {
                      const parentescoLabels: Record<string, string> = { pai: 'Pai', mae: 'Mãe', avo: 'Avó/Avô', tio: 'Tio/Tia', irmao: 'Irmão/Irmã', tutor_legal: 'Tutor Legal', outro: 'Outro' };
                      return (
                        <Card key={idx} className={`${resp.e_principal ? 'border-green-500 border-2' : 'border-gray-200'}`}>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-base">{resp.nome_completo || 'Sem nome'}</span>
                                  {resp.grau_parentesco && (
                                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                                      {parentescoLabels[resp.grau_parentesco] || resp.grau_parentesco}
                                    </span>
                                  )}
                                  {resp.e_principal && (
                                    <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full font-semibold">
                                      Responsável Principal
                                    </span>
                                  )}
                                </div>
                                <div className="text-sm text-gray-500 mt-1 space-y-0.5">
                                  <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                                    {resp.cpf && <span>CPF: {resp.cpf}</span>}
                                    {resp.rg && <span>RG: {resp.rg}{resp.orgao_emissor_rg ? ` (${resp.orgao_emissor_rg})` : ''}</span>}
                                    {resp.data_nascimento && <span>Nasc: {resp.data_nascimento}</span>}
                                    {resp.genero && <span>Gênero: {resp.genero.charAt(0).toUpperCase() + resp.genero.slice(1).toLowerCase()}</span>}
                                    {resp.estado_civil && <span>Est. Civil: {resp.estado_civil}</span>}
                                  </div>
                                  <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                                    {resp.telefone && <span>Tel: {resp.telefone}</span>}
                                    {resp.whatsapp && <span>WhatsApp: {resp.whatsapp}</span>}
                                    {resp.email && <span>Email: {resp.email}</span>}
                                  </div>
                                  <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                                    {resp.escolaridade && <span>Escolaridade: {resp.escolaridade}</span>}
                                    {resp.situacao_trabalhista && <span>Trab: {resp.situacao_trabalhista}</span>}
                                    {resp.profissao && <span>Profissão: {resp.profissao}</span>}
                                    {resp.renda_familiar && <span>Renda: {resp.renda_familiar}</span>}
                                  </div>
                                  {(resp.logradouro || resp.bairro || resp.cidade) && (
                                    <div>{[resp.logradouro, resp.numero, resp.complemento, resp.bairro, resp.cidade, resp.estado].filter(Boolean).join(', ')}{resp.cep ? ` - CEP: ${resp.cep}` : ''}</div>
                                  )}
                                  <div className="flex gap-3 mt-1">
                                    {resp.mora_com_aluno && <span className="text-green-700 font-medium">Mora com o aluno</span>}
                                    {resp.e_contato_emergencia && <span className="text-orange-700 font-medium">Contato de emergência</span>}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {!resp.e_principal && (
                                  <Button type="button" variant="outline" size="sm" onClick={() => {
                                    setResponsaveisData(prev => prev.map((r, i) => ({ ...r, e_principal: i === idx })));
                                  }} className="text-green-600 border-green-300 hover:bg-green-50">
                                    Marcar Principal
                                  </Button>
                                )}
                                <Button type="button" variant="outline" size="sm" onClick={() => {
                                  setCurrentResponsavelForm({ ...resp });
                                  setEditingResponsavelIdx(idx);
                                  setShowResponsavelForm(true);
                                }}>
                                  Editar
                                </Button>
                                {!isReadOnly && (
                                  <Button type="button" variant="ghost" size="sm" className="text-red-500 hover:text-red-700" onClick={() => {
                                    setResponsaveisData(prev => prev.filter((_, i) => i !== idx));
                                  }}>
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}

                {responsaveisData.length === 0 && !showResponsavelForm && (
                  <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                    <p className="text-gray-500 mb-3">Nenhum responsável cadastrado</p>
                  </div>
                )}

                {!isReadOnly && !showResponsavelForm && (
                  <Button type="button" variant="outline" onClick={() => {
                    setCurrentResponsavelForm(emptyResponsavel());
                    setEditingResponsavelIdx(null);
                    setShowResponsavelForm(true);
                  }} className="w-full border-dashed">
                    <Plus className="h-4 w-4 mr-2" /> Adicionar Responsável
                  </Button>
                )}

                {showResponsavelForm && (
                  <Card className="border-blue-200 bg-blue-50/30">
                    <CardContent className="p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-blue-800">
                          {editingResponsavelIdx !== null ? 'Editar Responsável' : 'Novo Responsável'}
                        </h4>
                        <Button type="button" variant="ghost" size="sm" onClick={() => { setShowResponsavelForm(false); setEditingResponsavelIdx(null); }}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-2">
                          <Label>Nome Completo *</Label>
                          <Input placeholder="Nome completo do responsável" value={currentResponsavelForm.nome_completo}
                            onChange={e => setCurrentResponsavelForm(prev => ({ ...prev, nome_completo: e.target.value }))} />
                        </div>
                        <div>
                          <Label>Grau de Parentesco *</Label>
                          <Select value={currentResponsavelForm.grau_parentesco}
                            onValueChange={v => setCurrentResponsavelForm(prev => ({ ...prev, grau_parentesco: v }))}>
                            <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pai">Pai</SelectItem>
                              <SelectItem value="mae">Mãe</SelectItem>
                              <SelectItem value="avo">Avó/Avô</SelectItem>
                              <SelectItem value="tio">Tio/Tia</SelectItem>
                              <SelectItem value="irmao">Irmão/Irmã</SelectItem>
                              <SelectItem value="tutor_legal">Tutor Legal</SelectItem>
                              <SelectItem value="outro">Outro</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label>CPF *</Label>
                          <Input placeholder="000.000.000-00" value={currentResponsavelForm.cpf}
                            onChange={e => {
                              const v = e.target.value.replace(/\D/g, '').slice(0, 11);
                              const formatted = v.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
                              setCurrentResponsavelForm(prev => ({ ...prev, cpf: formatted || v }));
                            }} />
                        </div>
                        <div>
                          <Label>RG</Label>
                          <Input placeholder="Número do RG" value={currentResponsavelForm.rg}
                            onChange={e => setCurrentResponsavelForm(prev => ({ ...prev, rg: e.target.value }))} />
                        </div>
                        <div>
                          <Label>Órgão Emissor</Label>
                          <Input placeholder="Ex: SSP/CE" value={currentResponsavelForm.orgao_emissor_rg}
                            onChange={e => setCurrentResponsavelForm(prev => ({ ...prev, orgao_emissor_rg: e.target.value }))} />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label>Data de Nascimento</Label>
                          <Input placeholder="DD/MM/AAAA" value={currentResponsavelForm.data_nascimento}
                            onChange={e => {
                              let v = e.target.value.replace(/\D/g, '').slice(0, 8);
                              if (v.length > 4) v = v.slice(0, 2) + '/' + v.slice(2, 4) + '/' + v.slice(4);
                              else if (v.length > 2) v = v.slice(0, 2) + '/' + v.slice(2);
                              setCurrentResponsavelForm(prev => ({ ...prev, data_nascimento: v }));
                            }} />
                        </div>
                        <div>
                          <Label>Gênero</Label>
                          <Select value={currentResponsavelForm.genero}
                            onValueChange={v => setCurrentResponsavelForm(prev => ({ ...prev, genero: v }))}>
                            <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="feminino">Feminino</SelectItem>
                              <SelectItem value="masculino">Masculino</SelectItem>
                              <SelectItem value="nao_binario">Não Binário</SelectItem>
                              <SelectItem value="nao_informado">Não Informado</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Estado Civil</Label>
                          <Select value={currentResponsavelForm.estado_civil}
                            onValueChange={v => setCurrentResponsavelForm(prev => ({ ...prev, estado_civil: v }))}>
                            <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="solteiro">Solteiro(a)</SelectItem>
                              <SelectItem value="casado">Casado(a)</SelectItem>
                              <SelectItem value="divorciado">Divorciado(a)</SelectItem>
                              <SelectItem value="viuvo">Viúvo(a)</SelectItem>
                              <SelectItem value="uniao_estavel">União Estável</SelectItem>
                              <SelectItem value="separado">Separado(a)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label>Escolaridade</Label>
                          <Select value={currentResponsavelForm.escolaridade}
                            onValueChange={v => setCurrentResponsavelForm(prev => ({ ...prev, escolaridade: v }))}>
                            <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="nao_alfabetizado">Não Alfabetizado</SelectItem>
                              <SelectItem value="fundamental_incompleto">Fundamental Incompleto</SelectItem>
                              <SelectItem value="fundamental_completo">Fundamental Completo</SelectItem>
                              <SelectItem value="medio_incompleto">Médio Incompleto</SelectItem>
                              <SelectItem value="medio_completo">Médio Completo</SelectItem>
                              <SelectItem value="superior_incompleto">Superior Incompleto</SelectItem>
                              <SelectItem value="superior_completo">Superior Completo</SelectItem>
                              <SelectItem value="pos_graduacao">Pós-Graduação</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Situação Trabalhista</Label>
                          <Select value={currentResponsavelForm.situacao_trabalhista}
                            onValueChange={v => setCurrentResponsavelForm(prev => ({ ...prev, situacao_trabalhista: v }))}>
                            <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="empregado_formal">Empregado Formal</SelectItem>
                              <SelectItem value="empregado_informal">Empregado Informal</SelectItem>
                              <SelectItem value="autonomo">Autônomo</SelectItem>
                              <SelectItem value="desempregado">Desempregado</SelectItem>
                              <SelectItem value="aposentado">Aposentado</SelectItem>
                              <SelectItem value="estudante">Estudante</SelectItem>
                              <SelectItem value="do_lar">Do Lar</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Profissão</Label>
                          <Input placeholder="Profissão" value={currentResponsavelForm.profissao}
                            onChange={e => setCurrentResponsavelForm(prev => ({ ...prev, profissao: e.target.value }))} />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>Renda Familiar</Label>
                          <Select value={currentResponsavelForm.renda_familiar}
                            onValueChange={v => setCurrentResponsavelForm(prev => ({ ...prev, renda_familiar: v }))}>
                            <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ate_1_sm">Até 1 Salário Mínimo</SelectItem>
                              <SelectItem value="1_a_2_sm">1 a 2 Salários Mínimos</SelectItem>
                              <SelectItem value="2_a_3_sm">2 a 3 Salários Mínimos</SelectItem>
                              <SelectItem value="3_a_5_sm">3 a 5 Salários Mínimos</SelectItem>
                              <SelectItem value="acima_5_sm">Acima de 5 Salários Mínimos</SelectItem>
                              <SelectItem value="sem_renda">Sem Renda</SelectItem>
                              <SelectItem value="nao_informado">Não Informado</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <h4 className="font-semibold text-gray-700 mt-2">Contato</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label>Telefone</Label>
                          <Input placeholder="(00) 00000-0000" value={currentResponsavelForm.telefone}
                            onChange={e => {
                              const v = e.target.value.replace(/\D/g, '').slice(0, 11);
                              let formatted = v;
                              if (v.length > 6) formatted = `(${v.slice(0,2)}) ${v.slice(2,7)}-${v.slice(7)}`;
                              else if (v.length > 2) formatted = `(${v.slice(0,2)}) ${v.slice(2)}`;
                              setCurrentResponsavelForm(prev => ({ ...prev, telefone: formatted }));
                            }} />
                        </div>
                        <div>
                          <Label>WhatsApp</Label>
                          <Input placeholder="(00) 00000-0000" value={currentResponsavelForm.whatsapp}
                            onChange={e => {
                              const v = e.target.value.replace(/\D/g, '').slice(0, 11);
                              let formatted = v;
                              if (v.length > 6) formatted = `(${v.slice(0,2)}) ${v.slice(2,7)}-${v.slice(7)}`;
                              else if (v.length > 2) formatted = `(${v.slice(0,2)}) ${v.slice(2)}`;
                              setCurrentResponsavelForm(prev => ({ ...prev, whatsapp: formatted }));
                            }} />
                        </div>
                        <div>
                          <Label>E-mail</Label>
                          <Input type="email" placeholder="email@exemplo.com" value={currentResponsavelForm.email}
                            onChange={e => setCurrentResponsavelForm(prev => ({ ...prev, email: e.target.value }))} />
                        </div>
                      </div>

                      <h4 className="font-semibold text-gray-700 mt-2">Endereço</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label>CEP</Label>
                          <Input placeholder="00000-000" value={currentResponsavelForm.cep}
                            onChange={async e => {
                              const v = e.target.value.replace(/\D/g, '').slice(0, 8);
                              const formatted = v.length > 5 ? v.slice(0, 5) + '-' + v.slice(5) : v;
                              setCurrentResponsavelForm(prev => ({ ...prev, cep: formatted }));
                              if (v.length === 8) {
                                const address = await fetchAddressByCEP(v);
                                if (address) {
                                  setCurrentResponsavelForm(prev => ({
                                    ...prev,
                                    logradouro: address.logradouro || prev.logradouro,
                                    bairro: address.bairro || prev.bairro,
                                    cidade: address.cidade || prev.cidade,
                                    estado: address.estado || prev.estado,
                                  }));
                                }
                              }
                            }} />
                        </div>
                        <div className="md:col-span-2">
                          <Label>Logradouro</Label>
                          <Input placeholder="Rua, Avenida, etc." value={currentResponsavelForm.logradouro}
                            onChange={e => setCurrentResponsavelForm(prev => ({ ...prev, logradouro: e.target.value }))} />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                          <Label>Número</Label>
                          <Input placeholder="Nº" value={currentResponsavelForm.numero}
                            onChange={e => setCurrentResponsavelForm(prev => ({ ...prev, numero: e.target.value }))} />
                        </div>
                        <div>
                          <Label>Complemento</Label>
                          <Input placeholder="Apto, bloco, etc." value={currentResponsavelForm.complemento}
                            onChange={e => setCurrentResponsavelForm(prev => ({ ...prev, complemento: e.target.value }))} />
                        </div>
                        <div>
                          <Label>Bairro</Label>
                          <Input placeholder="Bairro" value={currentResponsavelForm.bairro}
                            onChange={e => setCurrentResponsavelForm(prev => ({ ...prev, bairro: e.target.value }))} />
                        </div>
                        <div>
                          <Label>Cidade</Label>
                          <Input placeholder="Cidade" value={currentResponsavelForm.cidade}
                            onChange={e => setCurrentResponsavelForm(prev => ({ ...prev, cidade: e.target.value }))} />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>Estado</Label>
                          <Select value={currentResponsavelForm.estado}
                            onValueChange={v => setCurrentResponsavelForm(prev => ({ ...prev, estado: v }))}>
                            <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                            <SelectContent>
                              {["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"].map(uf => (
                                <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="flex items-center gap-6 mt-2">
                        <label className="flex items-center gap-2 text-sm">
                          <input type="checkbox" checked={currentResponsavelForm.mora_com_aluno}
                            onChange={e => setCurrentResponsavelForm(prev => ({ ...prev, mora_com_aluno: e.target.checked }))}
                            className="h-4 w-4 rounded border-gray-300" />
                          Mora com o aluno
                        </label>
                        <label className="flex items-center gap-2 text-sm">
                          <input type="checkbox" checked={currentResponsavelForm.e_contato_emergencia}
                            onChange={e => setCurrentResponsavelForm(prev => ({ ...prev, e_contato_emergencia: e.target.checked }))}
                            className="h-4 w-4 rounded border-gray-300" />
                          É contato de emergência
                        </label>
                      </div>

                      <div className="flex justify-end gap-2 mt-4 pt-3 border-t">
                        <Button type="button" variant="outline" onClick={() => { setShowResponsavelForm(false); setEditingResponsavelIdx(null); }}>
                          Cancelar
                        </Button>
                        <Button type="button" onClick={() => {
                          if (!currentResponsavelForm.nome_completo) {
                            toast({ title: "Campo obrigatório", description: "Nome é obrigatório.", variant: "destructive" });
                            return;
                          }
                          if (!currentResponsavelForm.grau_parentesco) {
                            toast({ title: "Campo obrigatório", description: "Selecione o grau de parentesco.", variant: "destructive" });
                            return;
                          }
                          if (!currentResponsavelForm.cpf || currentResponsavelForm.cpf.replace(/\D/g, '').length !== 11) {
                            toast({ title: "Campo obrigatório", description: "CPF do responsável é obrigatório (11 dígitos).", variant: "destructive" });
                            return;
                          }
                          if (editingResponsavelIdx !== null) {
                            setResponsaveisData(prev => prev.map((r, i) => i === editingResponsavelIdx ? { ...currentResponsavelForm } : r));
                          } else {
                            const isFirst = responsaveisData.length === 0;
                            setResponsaveisData(prev => [...prev, { ...currentResponsavelForm, e_principal: isFirst ? true : currentResponsavelForm.e_principal }]);
                          }
                          setShowResponsavelForm(false);
                          setEditingResponsavelIdx(null);
                          setCurrentResponsavelForm(emptyResponsavel());
                        }} className="bg-green-600 hover:bg-green-700">
                          {editingResponsavelIdx !== null ? 'Salvar Alterações' : 'Adicionar'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Relacionamentos Familiares - unificado da Seção 10 */}
                <div className="space-y-4">
                <h3 className="text-lg font-semibold">Relacionamentos familiares</h3>
                
                  <div className="border rounded-lg">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">NOME</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">PARENTESCO</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">RELAÇÃO</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">AÇÃO</th>
                      </tr>
                    </thead>
                    <tbody>
                      {relacionamentosFamiliares.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-4 py-6 text-center text-sm text-gray-500">
                            Nenhuma pessoa cadastrada
                          </td>
                        </tr>
                      ) : (
                        relacionamentosFamiliares.map((rel, idx) => (
                          <tr key={idx} className="border-t">
                            <td className="px-4 py-2 text-sm">{rel.nome}</td>
                            <td className="px-4 py-2 text-sm">{rel.parentesco}</td>
                            <td className="px-4 py-2 text-sm">{rel.relacao}</td>
                            <td className="px-4 py-2">
                                <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setRelacionamentosFamiliares(prev => prev.filter((_, i) => i !== idx))}
                              >
                                <Trash2 className="w-4 h-4 text-red-500" />
                                </Button>
                            </td>
                          </tr>
                        ))
                      )}
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
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">AÇÃO</th>
                      </tr>
                    </thead>
                    <tbody>
                      {outrosRelacionamentos.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-4 py-6 text-center text-sm text-gray-500">
                            Nenhuma pessoa cadastrada
                          </td>
                        </tr>
                      ) : (
                        outrosRelacionamentos.map((rel, idx) => (
                          <tr key={idx} className="border-t">
                            <td className="px-4 py-2 text-sm">{rel.nome}</td>
                            <td className="px-4 py-2 text-sm">{rel.parentesco}</td>
                            <td className="px-4 py-2 text-sm">{rel.relacao}</td>
                            <td className="px-4 py-2">
                                <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setOutrosRelacionamentos(prev => prev.filter((_, i) => i !== idx))}
                              >
                                <Trash2 className="w-4 h-4 text-red-500" />
                                </Button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                  </div>

                  <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white border-orange-500"
                  onClick={() => {
                    setNovaRelacao({ nome: '', parentesco: '', relacao: '', tipo: 'familiar' });
                    setShowAddRelacaoModal(true);
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Incluir nova relação
                  </Button>

                  {/* Modal para adicionar relação */}
                  <Dialog open={showAddRelacaoModal} onOpenChange={setShowAddRelacaoModal}>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>Adicionar Relação</DialogTitle>
                    </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                        <Label>Tipo de Relacionamento</Label>
                        <Select 
                          value={novaRelacao.tipo} 
                          onValueChange={(val: 'familiar' | 'outro') => setNovaRelacao({...novaRelacao, tipo: val})}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="familiar">Familiar</SelectItem>
                            <SelectItem value="outro">Outro</SelectItem>
                          </SelectContent>
                        </Select>
                        </div>
                        <div className="space-y-2">
                        <Label>Nome</Label>
                        <Input 
                          value={novaRelacao.nome}
                          onChange={(e) => setNovaRelacao({...novaRelacao, nome: e.target.value})}
                          placeholder="Nome da pessoa"
                        />
                        </div>
                        <div className="space-y-2">
                        <Label>Parentesco</Label>
                        <Select 
                          value={novaRelacao.parentesco} 
                          onValueChange={(val) => setNovaRelacao({...novaRelacao, parentesco: val})}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o parentesco" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Pai">Pai</SelectItem>
                            <SelectItem value="Mãe">Mãe</SelectItem>
                            <SelectItem value="Filho(a)">Filho(a)</SelectItem>
                            <SelectItem value="Irmão(ã)">Irmão(ã)</SelectItem>
                            <SelectItem value="Avô(ó)">Avô(ó)</SelectItem>
                            <SelectItem value="Tio(a)">Tio(a)</SelectItem>
                            <SelectItem value="Primo(a)">Primo(a)</SelectItem>
                            <SelectItem value="Padrasto/Madrasta">Padrasto/Madrasta</SelectItem>
                            <SelectItem value="Cônjuge">Cônjuge</SelectItem>
                            <SelectItem value="Amigo(a)">Amigo(a)</SelectItem>
                            <SelectItem value="Vizinho(a)">Vizinho(a)</SelectItem>
                            <SelectItem value="Professor(a)">Professor(a)</SelectItem>
                            <SelectItem value="Outro">Outro</SelectItem>
                          </SelectContent>
                        </Select>
                        </div>
                        <div className="space-y-2">
                        <Label>Relação</Label>
                        <Input 
                          value={novaRelacao.relacao}
                          onChange={(e) => setNovaRelacao({...novaRelacao, relacao: e.target.value})}
                          placeholder="Descreva a relação (ex: mora junto, visita frequentemente)"
                        />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => setShowAddRelacaoModal(false)}>
                        Cancelar
                        </Button>
                        <Button 
                        type="button"
                        onClick={() => {
                          if (!novaRelacao.nome || !novaRelacao.parentesco) {
                            toast({ title: "Preencha o nome e parentesco", variant: "destructive" });
                            return;
                          }
                          const relData = { nome: novaRelacao.nome, parentesco: novaRelacao.parentesco, relacao: novaRelacao.relacao };
                          if (novaRelacao.tipo === 'familiar') {
                            setRelacionamentosFamiliares(prev => [...prev, relData]);
                          } else {
                            setOutrosRelacionamentos(prev => [...prev, relData]);
                          }
                          setShowAddRelacaoModal(false);
                          toast({ title: "Relação adicionada" });
                        }}
                      >
                        Adicionar
                        </Button>
                      </div>
                  </DialogContent>
                </Dialog>
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
                {/* RASCUNHOS: só no cadastro novo e não read-only */}
                {!isReadOnly && !isEditMode && (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowDraftsDialog(true)}
                    >
                      Rascunhos
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleOpenSaveDraft}
                    >
                      Salvar rascunho
                    </Button>
                  </>
                )}

                <Button type="button" variant="outline" onClick={onClose} data-testid="button-cancelar">
                  {isReadOnly ? 'Fechar' : 'Cancelar'}
                </Button>

                {currentSection < 11 ? (
                  <Button type="button" onClick={nextSection} data-testid="button-proximo">
                    Próximo
                  </Button>
                ) : !isReadOnly ? (
                  <Button
                    type="button"
                    disabled={
                      createStudentMutation.isPending ||
                      updateStudentMutation.isPending ||
                      createInclusaoMutation.isPending ||
                      updateInclusaoMutation.isPending
                    }
                    data-testid="button-salvar"
                    onClick={async () => {
                      const ok = await form.trigger(undefined, { shouldFocus: true });
                      if (!ok) {
                                        toast({
                          title: "Campos obrigatórios faltando",
                          description: "Revise os campos destacados em vermelho.",
                          variant: "destructive",
                        });
                        return;
                      }
                      form.handleSubmit(onSubmit)();
                    }}
                  >
                    {(createStudentMutation.isPending || createInclusaoMutation.isPending) ? 'Salvando...' : 'Salvar'}
                  </Button>
                ) : null}
              </div>
            </div>
            {/* ===================== DIALOG: Salvar rascunho ===================== */}
        <Dialog open={showSaveDraftDialog} onOpenChange={setShowSaveDraftDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Salvar rascunho</DialogTitle>
            </DialogHeader>

            <div className="space-y-3">
              <div className="space-y-2">
                <Label>Digite o nome do rascunho</Label>
                <Input
                  value={draftName}
                  onChange={(e) => setDraftName(e.target.value)}
                  placeholder="Ex: Cadastro João - faltando docs"
                />
                <p className="text-xs text-muted-foreground">
                  Obs: foto e arquivos de documentos não são salvos no rascunho.
                </p>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowSaveDraftDialog(false)}>
                  Cancelar
                </Button>
                <Button type="button" onClick={handleConfirmSaveDraft}>
                  Salvar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

      {/* ===================== DIALOG: Lista de rascunhos ===================== */}
      <Dialog open={showDraftsDialog} onOpenChange={setShowDraftsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Rascunhos salvos</DialogTitle>
          </DialogHeader>

          {drafts.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum rascunho salvo ainda.
            </p>
          ) : (
            <div className="space-y-2">
              {drafts.map((d) => (
                <div key={d.id} className="flex items-center justify-between p-3 rounded border bg-muted/30">
                  <div className="min-w-0">
                    <div className="font-medium truncate">{d.name}</div>
                    <div className="text-xs text-muted-foreground">
                      Atualizado em: {new Date(d.updatedAt).toLocaleString("pt-BR")}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => handleLoadDraft(d)}>
                      Carregar
                    </Button>
                    <Button type="button" variant="ghost" size="sm" onClick={() => handleDeleteDraft(d)}>
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setShowDraftsDialog(false)}>
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
