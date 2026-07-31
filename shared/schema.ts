import { pgTable, text, serial, integer, boolean, timestamp, decimal, date, json, jsonb, unique, pgEnum, varchar, time, numeric, index, uniqueIndex } from "drizzle-orm/pg-core";

// ================ RBAC SYSTEM ENUMS ================

// Enum para os papéis do sistema RBAC
export const roleEnum = pgEnum("role_enum", [
  "aluno",
  "professor", 
  "professor_inclusao",
  "monitor",
  "monitor_pec",
  "monitor_inclusao",
  "oficineiro_pec",
  "coordenador_inclusao",
  "coordenador_pec", 
  "coordenador_psico",
  "admin",
  "colaborador",
  "conselheiro", 
  "doador",
  "responsavel",
  "leo",
  "desenvolvedor"
]);
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations, sql } from "drizzle-orm";

// CPF validation function
function validateCPF(cpf: string): boolean {
  // Remove non-numeric characters
  cpf = cpf.replace(/[^\d]/g, '');
  
  // Check if has 11 digits
  if (cpf.length !== 11) return false;
  
  // Check if all digits are the same
  if (/^(\d)\1+$/.test(cpf)) return false;
  
  // Validate CPF algorithm
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cpf.charAt(i)) * (10 - i);
  }
  let remainder = 11 - (sum % 11);
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cpf.charAt(9))) return false;
  
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cpf.charAt(i)) * (11 - i);
  }
  remainder = 11 - (sum % 11);
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cpf.charAt(10))) return false;
  
  return true;
}

export const cpfSchema = z.string()
  .min(11, "CPF deve ter 11 dígitos")
  .refine(validateCPF, { message: "CPF inválido" });

// ================ MÓDULO 0: INTEGRAÇÃO MONDAY.COM ================

// Types para Monday.com GV (Gestão à Vista)
export const gvIndicators = pgTable("gv_indicators", {
  id: serial("id").primaryKey(),
  indicator: text("indicator").notNull(), // nome do indicador
  value: decimal("value", { precision: 10, scale: 4 }), // valor atual com até 4 casas decimais (pode ser null)
  unit: text("unit"), // unidade (%, R$, etc)
  target: decimal("target", { precision: 10, scale: 4 }), // meta/objetivo com até 4 casas decimais
  workstreamSlug: text("workstream_slug").notNull(), // slug do workstream
  programSlug: text("program_slug").notNull(), // slug do programa
  period: text("period"), // período dos dados
  lastUpdated: timestamp("last_updated").defaultNow(),
});

export const gvWorkstreams = pgTable("gv_workstreams", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name"),
  programSlug: text("program_slug").notNull(),
});

export const gvPrograms = pgTable("gv_programs", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name"),
});

// Types para API
export type GVIndicator = typeof gvIndicators.$inferSelect;
export type GVWorkstream = typeof gvWorkstreams.$inferSelect;
export type GVProgram = typeof gvPrograms.$inferSelect;

export type InsertGVIndicator = typeof gvIndicators.$inferInsert;
export type InsertGVWorkstream = typeof gvWorkstreams.$inferInsert;
export type InsertGVProgram = typeof gvPrograms.$inferInsert;

export const insertGVIndicatorSchema = createInsertSchema(gvIndicators);
export const insertGVWorkstreamSchema = createInsertSchema(gvWorkstreams);
export const insertGVProgramSchema = createInsertSchema(gvPrograms);

// Types para resposta da API (formato do frontend)
export interface GVApiIndicator {
  indicator: string;
  value: number | null;
  unit: string | null;
  target: number | null;
}

export interface GVApiWorkstream {
  slug: string;
  indicators: GVApiIndicator[];
}

export interface GVApiProgram {
  slug: string;
  workstreams: GVApiWorkstream[];
}

export interface GVApiResponse {
  period: string | null;
  programs: GVApiProgram[];
}

// ================ MÓDULO 1: SISTEMA GERAL ================

// Dados de impacto dinâmicos para gestão
export const impactData = pgTable("impact_data", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(), // chave única para cada métrica
  title: text("title").notNull(), // título a ser exibido
  value: integer("value").notNull(), // valor numérico
  description: text("description"), // descrição complementar
  category: text("category"), // categoria (jovens, oficinas, eventos, etc)
  updatedBy: text("updated_by"), // quem atualizou
  updatedAt: timestamp("updated_at").defaultNow(),
  active: boolean("active").default(true),
});

// Tipos para dados de impacto
export type ImpactData = typeof impactData.$inferSelect;
export type InsertImpactData = typeof impactData.$inferInsert;
export const insertImpactDataSchema = createInsertSchema(impactData);

// Tabela de dados demográficos dos programas
export const dadosDemograficos = pgTable("dados_demograficos", {
  id: serial("id").primaryKey(),
  programa: text("programa").notNull(), // 'pec' ou 'inclusao'
  
  // Dados de gênero
  generoFeminino: integer("genero_feminino").default(0),
  generoMasculino: integer("genero_masculino").default(0),
  generoNaoInformado: integer("genero_nao_informado").default(0),
  
  // Dados de cor/raça
  corBranca: integer("cor_branca").default(0),
  corParda: integer("cor_parda").default(0),
  corPreta: integer("cor_preta").default(0),
  corIndigena: integer("cor_indigena").default(0),
  corAmarela: integer("cor_amarela").default(0),
  
  // Dados de idade (faixas etárias específicas para cada programa)
  idade6: integer("idade_6").default(0),
  idade7: integer("idade_7").default(0),
  idade8: integer("idade_8").default(0),
  idade9: integer("idade_9").default(0),
  idade10: integer("idade_10").default(0),
  idade11: integer("idade_11").default(0),
  idade12: integer("idade_12").default(0),
  idade13: integer("idade_13").default(0),
  idade14: integer("idade_14").default(0),
  
  // Faixas para Inclusão Produtiva
  idade13a18: integer("idade_13a18").default(0),
  idade19a30: integer("idade_19a30").default(0),
  idade31a39: integer("idade_31a39").default(0),
  idade40mais: integer("idade_40mais").default(0),
  
  totalParticipantes: integer("total_participantes").default(0),
  
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type DadosDemograficos = typeof dadosDemograficos.$inferSelect;
export type InsertDadosDemograficos = typeof dadosDemograficos.$inferInsert;
export const insertDadosDemograficosSchema = createInsertSchema(dadosDemograficos);

// ================ RBAC TYPE DEFINITIONS ================

// Tipo para papéis do sistema RBAC
export type UserRole = 
  | "aluno"
  | "professor" 
  | "professor_inclusao"
  | "monitor"
  | "monitor_pec"
  | "monitor_inclusao"
  | "oficineiro_pec"
  | "coordenador_inclusao"
  | "coordenador_pec" 
  | "coordenador_psico"
  | "admin"
  | "colaborador"
  | "conselheiro" 
  | "doador"
  | "responsavel"
  | "leo"
  | "desenvolvedor";

// Tipos para coordenadores
export type CoordenadorRole = 
  | "coordenador_inclusao"
  | "coordenador_pec" 
  | "coordenador_psico";

// Função helper para verificar se é coordenador
export function isCoordenador(role: UserRole): role is CoordenadorRole {
  return role.startsWith("coordenador_") as boolean;
}

// Mapeamento de rotas permitidas por papel
export const ROUTE_PERMISSIONS: Record<UserRole, string[]> = {
  aluno: ["/aluno"],
  professor: ["/professor"],
  professor_inclusao: ["/professor", "/inclusao-produtiva"],
  monitor: ["/monitor"],
  monitor_pec: ["/monitor", "/pec"],
  monitor_inclusao: ["/monitor", "/inclusao-produtiva"],
  oficineiro_pec: ["/oficineiro", "/pec"],
  coordenador_inclusao: ["/coordenador", "/coordenador/inclusao-produtiva"],
  coordenador_pec: ["/coordenador", "/coordenador/esporte-cultura"],
  coordenador_psico: ["/coordenador", "/coordenador/psicossocial"],
  admin: ["/admin", "/professor", "/monitor", "/coordenador", "/coordenador/*"],
  colaborador: ["/colaborador"],
  conselheiro: ["/conselho"],
  doador: ["/doador"],
  responsavel: ["/responsavel"],
  leo: ["/leo", "/admin", "/conselho", "/professor", "/monitor", "/coordenador", "/coordenador/*"],
  desenvolvedor: ["/*"] // Acesso total
};

// Users table (professores e demais usuários do sistema)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  cpf: text("cpf").unique(),
  nome: text("nome"),
  sobrenome: text("sobrenome"),
  telefone: text("telefone").unique().notNull(),
  email: text("email"),
  fotoPerfil: text("foto_perfil"), // URL da foto de perfil do usuário
  verificado: boolean("verificado").default(false),
  ativo: boolean("ativo").default(true),
  dataAdmissao: date("data_admissao"),
  dataDesligamento: date("data_desligamento"),
  plano: text("plano"),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  subscriptionStatus: text("subscription_status"), // 'active', 'canceled', 'incomplete', 'past_due'
  motivoCancelamento: text("motivo_cancelamento"), // Motivo do cancelamento da assinatura
  role: text("role"), // Papéis RBAC: professor, monitor, coordenador_inclusao, coordenador_pec, coordenador_psico, admin, etc.
  tipo: text("tipo"), // Campo unificado para tipo de usuário
  fonte: text("fonte"), // Origem do cadastro: 'doacao', 'educacao', 'familia', 'admin', 'referral', 'reativado_indicado'
  professorTipo: text("professor_tipo").default("professor"), // 'lider', 'professor'
  
  // Professor fields
  formacao: text("formacao"),
  especializacao: text("especializacao"),
  experiencia: text("experiencia"),
  disciplinas: text("disciplinas"),
  
  // Council approval status
  conselhoStatus: text("conselho_status"),
  conselhoApprovedBy: text("conselho_approved_by"),
  conselhoApprovedAt: timestamp("conselho_approved_at"),
  
  // Exclusão de estatísticas (não conta em nenhum metric de doadores)
  excluirEstatisticas: boolean("excluir_estatisticas").default(false),
  excluirCancelamentoAte: integer("excluir_cancelamento_ate"),

  // Sistema de Gamificação - Gritos
  gritosTotal: integer("gritos_total").default(0),
  nivelAtual: text("nivel_atual").default("Aliado do Grito"),
  proximoNivel: text("proximo_nivel").default("Eco do Bem"),
  gritosParaProximoNivel: integer("gritos_para_proximo_nivel").default(300),
  
  // Sistema de Check-in Semanal
  diasConsecutivos: integer("dias_consecutivos").default(0), // 0-7
  ultimoCheckin: timestamp("ultimo_checkin", { withTimezone: true, mode: "string" }), // String ISO para evitar conversão automática
  semanaAtual: integer("semana_atual").default(1), // para reset semanal
  
  // Sistema de Controle de Primeira Entrada e Onboarding
  beneficiosOnboardingVisto: boolean("beneficios_onboarding_visto").default(false),
  
  // Sistema de Termos de Lances - Aceite obrigatório para dar lances em benefícios
  termoLancesAceito: boolean("termo_lances_aceito").default(false),
  termoLancesAceitoEm: timestamp("termo_lances_aceito_em"),
  
  // Campos para Stripe Subscription Schedules (REMOVIDO TEMPORARIAMENTE)
  // subscriptionScheduleId: text("subscription_schedule_id"),
  
  // ✅ PROJETOS APOIADOS: Array de projetos que o usuário apoia
  projetosApoiados: text("projetos_apoiados").array().default(sql`'{}'::text[]`), // Array de slugs dos projetos
  
  // 🎯 INFLUENCER: Código especial para acesso de influenciadores (bypass SMS)
  influencerCode: text("influencer_code"), // Código fixo do influencer (ex: "123456")

  // 🎯 SISTEMA DE INDICAÇÃO: Código único para referral
  refCode: text("ref_code").unique(), // Código único de indicação (ex: GRITO-AB12CD)
  refSlug: text("ref_slug").unique(), // Slug personalizado baseado no nome (ex: juliana-correa) para link de indicação
  refCodeCadastro: text("ref_code_cadastro"), // Link ou slug de quem indicou esta pessoa
  
  dataCadastro: timestamp("data_cadastro").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),

  // LGPD — Registro de aceite dos Termos de Uso
  termosUsoAceitoEm: timestamp("termos_uso_aceito_em"),
  termosUsoVersao: text("termos_uso_versao"), // ex: '2025-09-11', '2025-04-01'
});

// Council Access Requests table
export const councilRequests = pgTable("council_requests", {
  id: serial("id").primaryKey(),
  telefone: text("telefone").notNull(),
  nome: text("nome"),
  status: text("status").default("pending"),
  requestedAt: timestamp("requested_at").defaultNow(),
  processedAt: timestamp("processed_at"),
  processedBy: text("processed_by"),
});

// ================ TABELA DE CONSELHEIROS (SEGURANÇA) ================
// Armazena emails autorizados do conselho - verificação feita pelo backend
export const conselheiros = pgTable("conselheiros", {
  id: serial("id").primaryKey(),
  email: text("email").notNull(), // UNIQUE(email, programa) - constraint no banco
  nome: text("nome"),
  tipo: text("tipo").default("conselho"), // 'conselho', 'admin', 'leo'
  ativo: boolean("ativo").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertConselheiroSchema = createInsertSchema(conselheiros).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertConselheiro = z.infer<typeof insertConselheiroSchema>;
export type Conselheiro = typeof conselheiros.$inferSelect;

// Developer Access table
export const developers = pgTable("developers", {
  id: serial("id").primaryKey(),
  usuario: text("usuario").unique().notNull(),
  nome: text("nome").notNull(),
  email: text("email").unique(),
  senha: text("senha").notNull(),
  tipo: text("tipo").default("dev").notNull(), // 'dev' ou 'marketing'
  ativo: boolean("ativo").default(true),
  dataAdmissao: date("data_admissao"),
  dataDesligamento: date("data_desligamento"),
  ultimoAcesso: timestamp("ultimo_acesso"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ================ MÓDULO 1.5: SISTEMA DE DOAÇÕES ================

// Tabela de doadores (dados específicos de doação)
export const doadores = pgTable("doadores", {
  id: serial("id").primaryKey(),

  userId: integer("user_id").references(() => users.id),

  plano: text("plano").notNull(), 
  // 'eco' | 'voz' | 'grito' | 'platinum'

  valor: decimal("valor", { precision: 10, scale: 2 }).notNull(),

  periodicidade: text("periodicidade").default("mensal"),
  // 'mensal' | 'trimestral' | 'semestral' | 'anual'

  stripePaymentIntentId: text("stripe_payment_intent_id"),

  stripeSubscriptionId: text("stripe_subscription_id"),

  stripeCustomerId: text("stripe_customer_id"), 
  // ID do customer no Stripe

  status: text("status").default("pending"),
  // 🔒 VALORES REAIS USADOS NO SISTEMA:
  // 'paid' | 'pending' | 'canceled'

  typeformResponseId: text("typeform_response_id"),

  dataDoacaoInicial: timestamp("data_doacao_inicial").defaultNow(),

  ultimaDoacao: timestamp("ultima_doacao"),

  ativo: boolean("ativo").default(true),

  dataAdmissao: date("data_admissao"),

  dataDesligamento: date("data_desligamento"),
  // preenchido quando assinatura é cancelada

  verificadoEm: timestamp("verificado_em"),
  // ✅ DATA DA ÚLTIMA VERIFICAÇÃO NA STRIPE
  // ESSENCIAL para normalização e auditoria

  createdAt: timestamp("created_at").defaultNow(),

  updatedAt: timestamp("updated_at").defaultNow(),
});

// Histórico de doações/pagamentos
export const historicoDoacao = pgTable("historico_doacao", {
  id: serial("id").primaryKey(),
  doadorId: integer("doador_id").references(() => doadores.id),
  valor: decimal("valor", { precision: 10, scale: 2 }).notNull(),
  plano: text("plano").notNull(),
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  status: text("status").notNull(), // 'succeeded', 'failed', 'cancelled'
  metadata: json("metadata"), // Dados extras do pagamento
  processedAt: timestamp("processed_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Respostas do Typeform (backup dos dados)
export const typeformResponses = pgTable("typeform_responses", {
  id: serial("id").primaryKey(),
  responseId: text("response_id").unique().notNull(), // ID único do Typeform
  plano: text("plano").notNull(),
  valor: decimal("valor", { precision: 10, scale: 2 }),
  dadosResposta: json("dados_resposta").notNull(), // Todas as respostas do formulário
  processado: boolean("processado").default(false),
  userId: integer("user_id").references(() => users.id),
  doadorId: integer("doador_id").references(() => doadores.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const doadoresRelations = relations(doadores, ({ one, many }) => ({
  user: one(users, {
    fields: [doadores.userId],
    references: [users.id],
  }),
  historico: many(historicoDoacao),
}));

export const historicoRelations = relations(historicoDoacao, ({ one }) => ({
  doador: one(doadores, {
    fields: [historicoDoacao.doadorId],
    references: [doadores.id],
  }),
}));

// ================ MÓDULO 1.6: ACOMPANHAMENTO DE ASSINATURAS RECORRENTES ================

// Tabela de assinaturas (rastreamento detalhado do Stripe)
export const donorSubscriptions = pgTable("donor_subscriptions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  stripeCustomerId: text("stripe_customer_id").notNull(),
  stripeSubscriptionId: text("stripe_subscription_id").notNull().unique(),
  status: text("status").notNull(), // active, incomplete, incomplete_expired, past_due, unpaid, canceled, paused
  billingCycleAnchor: integer("billing_cycle_anchor"), // UNIX timestamp
  currentPeriodStart: integer("current_period_start"), // UNIX timestamp
  currentPeriodEnd: integer("current_period_end"), // UNIX timestamp
  cancelAt: integer("cancel_at"), // UNIX timestamp se agendado cancelamento
  canceledAt: integer("canceled_at"), // UNIX timestamp se já cancelado
  defaultPaymentMethod: text("default_payment_method"), // pm_xxx
  planPriceId: text("plan_price_id").notNull(), // price_xxx
  planName: text("plan_name"), // eco, voz, grito, platinum
  collectionMethod: text("collection_method").default("charge_automatically"), // charge_automatically, send_invoice
  nextPaymentAttempt: integer("next_payment_attempt"), // UNIX timestamp
  lastError: text("last_error"), // Último erro da cobrança
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  userSubscriptionIdx: uniqueIndex("user_subscription_idx").on(table.userId, table.stripeSubscriptionId),
  statusIdx: index("subscription_status_idx").on(table.status),
  periodEndIdx: index("subscription_period_end_idx").on(table.currentPeriodEnd),
}));

// Tabela de eventos de cobrança (timeline)
export const billingEvents = pgTable("billing_events", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  subscriptionId: integer("subscription_id").references(() => donorSubscriptions.id),
  stripeSubscriptionId: text("stripe_subscription_id"),
  eventType: text("event_type").notNull(), // checkout.session.completed, invoice.paid, invoice.payment_failed, etc.
  invoiceId: text("invoice_id"),
  paymentIntentId: text("payment_intent_id"),
  amount: decimal("amount", { precision: 10, scale: 2 }),
  currency: text("currency").default("brl"),
  status: text("status"), // paid, failed, open, void
  nextPaymentAttempt: integer("next_payment_attempt"), // UNIX timestamp
  payloadSummary: json("payload_summary"), // Dados resumidos do evento
  errorMessage: text("error_message"),
  processed: boolean("processed").default(false),
  processing: boolean("processing").default(false),
  processingStartedAt: timestamp("processing_started_at"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  userIdx: index("billing_events_user_idx").on(table.userId),
  subscriptionIdx: index("billing_events_subscription_idx").on(table.subscriptionId),
  typeIdx: index("billing_events_type_idx").on(table.eventType),
  createdIdx: index("billing_events_created_idx").on(table.createdAt),
  invoiceIdUnique: uniqueIndex("billing_events_invoice_id_unique").on(table.invoiceId),
}));

// Relations
export const donorSubscriptionsRelations = relations(donorSubscriptions, ({ one, many }) => ({
  user: one(users, {
    fields: [donorSubscriptions.userId],
    references: [users.id],
  }),
  events: many(billingEvents),
}));

export const billingEventsRelations = relations(billingEvents, ({ one }) => ({
  user: one(users, {
    fields: [billingEvents.userId],
    references: [users.id],
  }),
  subscription: one(donorSubscriptions, {
    fields: [billingEvents.subscriptionId],
    references: [donorSubscriptions.id],
  }),
}));

// Tipos Zod para assinaturas
export const insertDonorSubscriptionSchema = createInsertSchema(donorSubscriptions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertBillingEventSchema = createInsertSchema(billingEvents).omit({
  id: true,
  createdAt: true,
});

export type InsertDonorSubscription = z.infer<typeof insertDonorSubscriptionSchema>;
export type DonorSubscription = typeof donorSubscriptions.$inferSelect;
export type InsertBillingEvent = z.infer<typeof insertBillingEventSchema>;
export type BillingEvent = typeof billingEvents.$inferSelect;

// ================ MÓDULO 1.6B: DOADORES EXTERNOS (NÃO-STRIPE) ================

// Tabela de doadores externos que doam mensalmente fora do aplicativo
export const doadoresExternos = pgTable("doadores_externos", {
  id: serial("id").primaryKey(),
  nome: text("nome").notNull(),
  valorMensal: decimal("valor_mensal", { precision: 10, scale: 2 }).notNull(),
  formaPagamento: text("forma_pagamento").default("pix"), // pix, transferencia, boleto, debito_automatico
  observacoes: text("observacoes"), // ex: "DOADOR ANJO"
  dataInicio: timestamp("data_inicio").defaultNow(),
  status: text("status").default("ativo"), // ativo, inativo, pausado
  email: text("email"),
  telefone: text("telefone"),
  ativo: boolean("ativo").default(true),
  dataAdmissao: date("data_admissao"),
  dataDesligamento: date("data_desligamento"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Tipos e schemas para doadores externos
export const insertDoadorExternoSchema = createInsertSchema(doadoresExternos).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertDoadorExterno = z.infer<typeof insertDoadorExternoSchema>;
export type DoadorExterno = typeof doadoresExternos.$inferSelect;

// ================ MÓDULO 1.7: SISTEMA DE INDICAÇÃO ================

// Tabela de indicações (rastreamento de quem indicou quem)
export const indicacoes = pgTable("indicacoes", {
  id: serial("id").primaryKey(),
  indicouId: integer("indicou_id").references(() => users.id), // Quem indicou (pode ser NULL para links de marketing sem beneficiário)
  indicadoId: integer("indicado_id").references(() => users.id).notNull().unique(), // Quem foi indicado (só pode ter 1 indicação)
  refCode: text("ref_code").notNull(), // Código usado na indicação (user ref_code ou marketing_link code)
  status: text("status").notNull().default("PENDENTE"), // PENDENTE | CONFIRMADA | EXPIRADA | INVALIDA
  criadaEm: timestamp("criada_em", { withTimezone: true }).notNull().defaultNow(),
  confirmadaEm: timestamp("confirmada_em", { withTimezone: true }),
  validade: timestamp("validade", { withTimezone: true }).notNull(), // Data limite para validação (30 dias)
}, (table) => ({
  indicouIdx: index("indicacoes_indicou_idx").on(table.indicouId),
  indicadoIdx: uniqueIndex("indicacoes_indicado_idx").on(table.indicadoId), // Garante 1 indicação por indicado
  statusIdx: index("indicacoes_status_idx").on(table.status),
}));

// Tabela de pontos de indicação (ledger separado dos Gritos)
export const indicacaoPontosLedger = pgTable("indicacao_pontos_ledger", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(), // Quem ganhou o ponto
  indicacaoId: integer("indicacao_id").references(() => indicacoes.id, { onDelete: 'cascade' }).notNull(), // Referência à indicação
  pontos: integer("pontos").notNull(), // Quantidade de pontos (geralmente 1)
  motivo: text("motivo").notNull(), // Ex: "indicacao_confirmada"
  criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  userIdx: index("indicacao_pontos_user_idx").on(table.userId),
  uniqueIndicacao: uniqueIndex("indicacao_pontos_unique_idx").on(table.userId, table.indicacaoId), // Idempotência: 1 ponto por indicação
}));

// Tabela de eventos Stripe (idempotência de webhooks)
export const stripeEvents = pgTable("stripe_events", {
  id: text("id").primaryKey(), // Stripe event ID
  type: text("type").notNull(), // Tipo do evento (ex: invoice.payment_succeeded)
  processedAt: timestamp("processed_at", { withTimezone: true }).notNull().defaultNow(),
});

// Relations
export const indicacoesRelations = relations(indicacoes, ({ one, many }) => ({
  indicou: one(users, {
    fields: [indicacoes.indicouId],
    references: [users.id],
    relationName: "indicou",
  }),
  indicado: one(users, {
    fields: [indicacoes.indicadoId],
    references: [users.id],
    relationName: "indicado",
  }),
  pontos: many(indicacaoPontosLedger),
}));

export const indicacaoPontosLedgerRelations = relations(indicacaoPontosLedger, ({ one }) => ({
  user: one(users, {
    fields: [indicacaoPontosLedger.userId],
    references: [users.id],
  }),
  indicacao: one(indicacoes, {
    fields: [indicacaoPontosLedger.indicacaoId],
    references: [indicacoes.id],
  }),
}));

// Schemas de validação
export const insertIndicacaoSchema = createInsertSchema(indicacoes).omit({
  id: true,
  criadaEm: true,
});

export const insertIndicacaoPontosSchema = createInsertSchema(indicacaoPontosLedger).omit({
  id: true,
  criadoEm: true,
});

// Tipos TypeScript
export type Indicacao = typeof indicacoes.$inferSelect;
export type InsertIndicacao = z.infer<typeof insertIndicacaoSchema>;
export type IndicacaoPontos = typeof indicacaoPontosLedger.$inferSelect;
export type InsertIndicacaoPontos = z.infer<typeof insertIndicacaoPontosSchema>;
export type StripeEvent = typeof stripeEvents.$inferSelect;

// ================ MÓDULO 1.8: DEV MARKETING (CAMPANHAS E LINKS) ================

// Tabela de campanhas de marketing
export const marketingCampaigns = pgTable("marketing_campaigns", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  ownerUserId: integer("owner_user_id").references(() => users.id), // Responsável interno (opcional)
  rewardToUserId: integer("reward_to_user_id").references(() => users.id), // Se todos os links creditam para 1 pessoa (opcional)
  startsAt: timestamp("starts_at", { withTimezone: true }),
  endsAt: timestamp("ends_at", { withTimezone: true }),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  nameIdx: index("marketing_campaigns_name_idx").on(table.name),
  isActiveIdx: index("marketing_campaigns_active_idx").on(table.isActive),
}));

// Tabela de links únicos de campanha
export const marketingLinks = pgTable("marketing_links", {
  id: serial("id").primaryKey(),
  campaignId: integer("campaign_id").references(() => marketingCampaigns.id, { onDelete: 'cascade' }),
  code: text("code").notNull().unique(), // Ex: MKT-AB12CD
  medium: text("medium"), // Ex: instagram, qr_print, whatsapp
  source: text("source"), // Ex: @influencerX, evento_Y
  utmSource: text("utm_source"),
  utmMedium: text("utm_medium"),
  utmCampaign: text("utm_campaign"),
  maxConversions: integer("max_conversions"), // Teto de conversões (opcional)
  expiresAt: timestamp("expires_at", { withTimezone: true }), // Expiração do link
  rewardToUserId: integer("reward_to_user_id").references(() => users.id), // Se definido, credita para este usuário
  metadata: jsonb("metadata"), // Informações extras
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  isActive: boolean("is_active").notNull().default(true),
}, (table) => ({
  codeIdx: uniqueIndex("marketing_links_code_idx").on(table.code),
  campaignIdx: index("marketing_links_campaign_idx").on(table.campaignId),
  isActiveIdx: index("marketing_links_active_idx").on(table.isActive),
}));

// Tabela de cliques (tracking opcional)
export const mktClicks = pgTable("mkt_clicks", {
  id: serial("id").primaryKey(),
  linkId: integer("link_id").references(() => marketingLinks.id, { onDelete: 'cascade' }).notNull(),
  timestamp: timestamp("timestamp", { withTimezone: true }).notNull().defaultNow(),
  userAgent: text("user_agent"),
  ipHash: text("ip_hash"), // Hash do IP (sem PII)
  referer: text("referer"),
}, (table) => ({
  linkIdx: index("mkt_clicks_link_idx").on(table.linkId),
  timestampIdx: index("mkt_clicks_timestamp_idx").on(table.timestamp),
}));

// Relations
export const marketingCampaignsRelations = relations(marketingCampaigns, ({ one, many }) => ({
  owner: one(users, {
    fields: [marketingCampaigns.ownerUserId],
    references: [users.id],
    relationName: "campaignOwner",
  }),
  rewardTo: one(users, {
    fields: [marketingCampaigns.rewardToUserId],
    references: [users.id],
    relationName: "campaignRewardTo",
  }),
  links: many(marketingLinks),
}));

export const marketingLinksRelations = relations(marketingLinks, ({ one, many }) => ({
  campaign: one(marketingCampaigns, {
    fields: [marketingLinks.campaignId],
    references: [marketingCampaigns.id],
  }),
  rewardTo: one(users, {
    fields: [marketingLinks.rewardToUserId],
    references: [users.id],
    relationName: "linkRewardTo",
  }),
  clicks: many(mktClicks),
}));

export const mktClicksRelations = relations(mktClicks, ({ one }) => ({
  link: one(marketingLinks, {
    fields: [mktClicks.linkId],
    references: [marketingLinks.id],
  }),
}));

// Schemas de validação
export const insertMarketingCampaignSchema = createInsertSchema(marketingCampaigns).omit({
  id: true,
  createdAt: true,
});

export const insertMarketingLinkSchema = createInsertSchema(marketingLinks).omit({
  id: true,
  createdAt: true,
});

export const insertMktClickSchema = createInsertSchema(mktClicks).omit({
  id: true,
  timestamp: true,
});

// Tipos TypeScript
export type MarketingCampaign = typeof marketingCampaigns.$inferSelect;
export type InsertMarketingCampaign = z.infer<typeof insertMarketingCampaignSchema>;
export type MarketingLink = typeof marketingLinks.$inferSelect;
export type InsertMarketingLink = z.infer<typeof insertMarketingLinkSchema>;
export type MktClick = typeof mktClicks.$inferSelect;
export type InsertMktClick = z.infer<typeof insertMktClickSchema>;

// ================ MÓDULO 2: CADASTRO DE ALUNOS ================

// Tabela de pais
export const pais = pgTable("pais", {
  id: serial("id").primaryKey(),
  cpf: text("cpf").unique().notNull(),
  nome_completo: text("nome_completo").notNull(),
  profissao: text("profissao"),
  telefone: text("telefone"),
  mora_com_aluno: boolean("mora_com_aluno").default(false),
  e_responsavel: boolean("e_responsavel").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Tabela de mães
export const maes = pgTable("maes", {
  id: serial("id").primaryKey(),
  cpf: text("cpf").unique().notNull(),
  nome_completo: text("nome_completo").notNull(),
  profissao: text("profissao"),
  telefone: text("telefone"),
  mora_com_aluno: boolean("mora_com_aluno").default(false),
  e_responsavel: boolean("e_responsavel").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Tabela de responsáveis (quando não é pai nem mãe)
export const responsaveis = pgTable("responsaveis", {
  id: serial("id").primaryKey(),
  cpf: text("cpf").unique(),
  nome_completo: text("nome_completo").notNull(),
  grau_parentesco: text("grau_parentesco"),
  profissao: text("profissao"),
  telefone: text("telefone"),
  email: text("email"),
  mora_com_aluno: boolean("mora_com_aluno").default(false),
  e_contato_emergencia: boolean("e_contato_emergencia").default(false),
  rg: text("rg"),
  orgao_emissor_rg: text("orgao_emissor_rg"),
  data_nascimento: date("data_nascimento"),
  genero: text("genero"),
  estado_civil: text("estado_civil"),
  escolaridade: text("escolaridade"),
  situacao_trabalhista: text("situacao_trabalhista"),
  renda_familiar: text("renda_familiar"),
  cep: text("cep"),
  logradouro: text("logradouro"),
  numero: text("numero"),
  complemento: text("complemento"),
  bairro: text("bairro"),
  cidade: text("cidade"),
  estado: text("estado"),
  whatsapp: text("whatsapp"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Tabela principal de alunos com CPF como chave primária - Estrutura completa conforme front-end
export const aluno = pgTable("aluno", {
  // 🟡 Dados principais
  cpf: text("cpf").primaryKey(),
  nome_completo: text("nome_completo").notNull(),
  foto_perfil: text("foto_perfil"),
  data_nascimento: date("data_nascimento").notNull(),
  genero: text("genero"),
  numero_matricula: text("numero_matricula"),
  id_catraca: text("id_catraca"),
  familia_nome: text("familia_nome"),
  situacao_atendimento: text("situacao_atendimento"),
  estado_civil: text("estado_civil"),
  religiao: text("religiao"),
  naturalidade: text("naturalidade"),
  nacionalidade: text("nacionalidade"),
  pode_sair_sozinho: text("pode_sair_sozinho"),
  area: text("area").default("pec"),

  
  // 🟡 Dados complementares
  tamanho_calca: text("tamanho_calca"),
  tamanho_camiseta: text("tamanho_camiseta"),
  tamanho_calcado: text("tamanho_calcado"),
  cor_raca: text("cor_raca"),
  frequenta_projeto_social: text("frequenta_projeto_social"),
  acesso_internet: text("acesso_internet"),
  
  // 🟡 Endereço
  cep: text("cep"),
  logradouro: text("logradouro"),
  numero: text("numero"),
  bairro: text("bairro"),
  cidade: text("cidade"),
  estado: text("estado"),
  complemento: text("complemento"),
  ponto_referencia: text("ponto_referencia"),
  mora_desde: text("mora_desde"),
  
  // 🟡 Contato
  email: text("email"),
  telefone: text("telefone"),
  whatsapp: text("whatsapp"),
  contatos_emergencia: jsonb("contatos_emergencia"), // Array de {nome: string, telefone: string, whatsapp: boolean}
  
  // 🟡 Documentos
  rg: text("rg"),
  orgao_emissor: text("orgao_emissor"),
  ctps_numero: text("ctps_numero"),
  ctps_serie: text("ctps_serie"),
  titulo_eleitor: text("titulo_eleitor"),
  nis_pis_pasep: text("nis_pis_pasep"),
  documentos_possui: json("documentos_possui"), // array ou JSON
  upload_identidade_frente: text("upload_identidade_frente"),
  upload_identidade_verso: text("upload_identidade_verso"),
  
  // 🟡 Benefícios Sociais
  cadunico: text("cadunico"),
  bolsa_familia: text("bolsa_familia"),
  bpc: text("bpc"),
  cartao_alimentacao: text("cartao_alimentacao"),
  outros_beneficios: text("outros_beneficios"),
  
  // 🟡 Saúde (Seção Saúde Expandida)
  possui_particularidade_saude: text("possui_particularidade_saude"), // sim, nao, nao_informado
  detalhes_particularidade: text("detalhes_particularidade"),
  possui_alergia: text("possui_alergia"), // sim, nao, nao_informado
  detalhes_alergia: text("detalhes_alergia"),
  faz_uso_medicamento: text("faz_uso_medicamento"), // sim, nao
  detalhes_medicamento: text("detalhes_medicamento"),
  possui_deficiencia: text("possui_deficiencia"), // sim, nao_possui, nao_informado
  detalhes_deficiencia: text("detalhes_deficiencia"),
  contatos_saude: json("contatos_saude"), // {nome, telefone} para emergências de saúde
  faz_uso_quimicos: text("faz_uso_quimicos"), // sim, nao_possui, nao_informado
  familiar_usa_quimicos: text("familiar_usa_quimicos"), // sim, nao_possui, nao_informado
  tipo_sanguineo: text("tipo_sanguineo"), // A+, A-, B+, B-, AB+, AB-, O+, O-
  restricao_alimentar: text("restricao_alimentar"), // sim, nao
  detalhes_restricao_alimentar: text("detalhes_restricao_alimentar"),
  possui_convenio_medico: text("possui_convenio_medico"), // sim, nao
  detalhes_convenio_medico: text("detalhes_convenio_medico"),
  historico_medico: text("historico_medico"), // sim, nao
  ja_teve_ou_costuma_ter: json("ja_teve_ou_costuma_ter"), // Array: desmaios, convulsoes, dores_cabeca, perda_consciencia, enjoos
  detalhes_historico_medico: text("detalhes_historico_medico"),
  observacoes_saude: text("observacoes_saude"),
  upload_laudo_medico: text("upload_laudo_medico"),
  
  // 🟡 Família e moradia
  quantidade_filhos: integer("quantidade_filhos"),
  com_quem_mora: text("com_quem_mora"),
  composicao_familiar: text("composicao_familiar"),
  renda_familiar_mensal: decimal("renda_familiar_mensal", { precision: 10, scale: 2 }),
  situacao_moradia: text("situacao_moradia"),
  tipo_moradia: text("tipo_moradia"),
  
  // 🟡 Educação
  escolaridade: text("escolaridade"),
  estuda_atualmente: text("estuda_atualmente"),
  observacoes_educacao: text("observacoes_educacao"),
  
  // 🟡 Escolaridade (Seção Escolar)
  serie: text("serie"),
  situacao_escolar: text("situacao_escolar"), // cursando, interrompido, concluido
  turno_escolar: json("turno_escolar"), // Array de turnos: matutino, vespertino, noturno
  instituicao_ensino: text("instituicao_ensino"),
  e_alfabetizado: text("e_alfabetizado"), // sabe_ler_escrever, nao_sabe_ler_nem_escrever, nao_sabe_ler_nem_escrever_mas_assina
  bairro_escola: text("bairro_escola"),
  
  // 🟡 Dados Profissionais
  situacao_profissional: text("situacao_profissional"), // empregado, desempregado, aposentado, do_lar, estudante, autonomo, outro
  procura_trabalho: text("procura_trabalho"), // sim, nao
  trabalhos_atuais: json("trabalhos_atuais"), // [{situacao, entrada, saida, profissao, empresa, remuneracao, telefone}]
  experiencias_profissionais: json("experiencias_profissionais"), // [{situacao, entrada, saida, profissao, empresa, remuneracao}]
  
  // 🟡 Relações
  relacionamentos_familiares: json("relacionamentos_familiares"), // [{nome, parentesco, relacao}]
  outros_relacionamentos: json("outros_relacionamentos"), // [{nome, parentesco, relacao}]
  
  // 🟡 Relacionamentos com familiares (legado)
  id_pai: integer("id_pai").references(() => pais.id),
  id_mae: integer("id_mae").references(() => maes.id), // Mãe opcional
  id_responsavel: integer("id_responsavel"), // Responsável opcional (pode ser pai, mãe ou outro)
  
  // 🟡 Observações finais
  observacoes_gerais: text("observacoes_gerais"),
  
  // 🟡 Informações administrativas/adicionais
  data_entrada: date("data_entrada"), // Data de entrada na instituição
  data_inativacao: date("data_inativacao"), // Data em que o aluno foi inativado
  forma_acesso: text("forma_acesso"), // Como chegou à instituição (busca ativa, etc)
  demandas: json("demandas"), // Array de demandas selecionadas
  
  // Sistema
  professorId: integer("professor_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ================ MÓDULO 3: TURMAS ================

// Tabela principal de turmas
export const turma = pgTable("turma", {
  id: serial("id").primaryKey(),
  nome: text("nome").notNull(),
  descricao: text("descricao"),
  professorId: integer("professor_id").references(() => users.id).notNull(),
  maxAlunos: integer("max_alunos").default(30),
  dataInicio: date("data_inicio"),
  dataFim: date("data_fim"),
  horarios: json("horarios"), // {"segunda": "08:00-10:00", "quarta": "14:00-16:00"}
  sala: text("sala"),
  status: text("status").default("ativa"), // ativa, concluida, cancelada
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Tabela intermediária aluno-turma (many-to-many)
export const alunoTurma = pgTable("aluno_turma", {
  id: serial("id").primaryKey(),
  alunoCpf: text("aluno_cpf").references(() => aluno.cpf).notNull(),
  turmaId: integer("turma_id").references(() => turma.id).notNull(),
  dataMatricula: timestamp("data_matricula").defaultNow(),
  status: text("status").default("ativo"), // ativo, inativo, transferido, concluido
});

// ================ MÓDULO 4: CHAMADA ================

// Tabela que identifica uma chamada por turma e data
export const chamada = pgTable("chamada", {
  id: serial("id").primaryKey(),
  turmaId: integer("turma_id").references(() => turma.id).notNull(),
  data: date("data").notNull(),
  professorId: integer("professor_id").references(() => users.id).notNull(),
  observacoes: text("observacoes"),
  fotoComprovante: text("foto_comprovante"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Tabela que associa aluno à chamada, marcando presença/falta
export const chamadaAluno = pgTable("chamada_aluno", {
  id: serial("id").primaryKey(),
  chamadaId: integer("chamada_id").references(() => chamada.id).notNull(),
  alunoCpf: text("aluno_cpf").references(() => aluno.cpf).notNull(),
  status: text("status").notNull(), // presente, falta, falta_justificada, atrasado
  observacoes: text("observacoes"),
  justificativa: text("justificativa"),
  horaRegistro: timestamp("hora_registro").defaultNow(),
});

// ================ MÓDULO 5: CALENDÁRIO ================

// Tabela de eventos do calendário (gerais ou por turma)
export const calendarioEvento = pgTable("calendario_evento", {
  id: serial("id").primaryKey(),
  titulo: text("titulo").notNull(),
  descricao: text("descricao"),
  tipo: text("tipo").notNull(), // aula, prova, reuniao, feriado, lembrete
  data: date("data").notNull(),
  horaInicio: text("hora_inicio"),
  horaFim: text("hora_fim"),
  local: text("local"),
  turmaId: integer("turma_id"), // null = evento geral
  professorId: integer("professor_id").references(() => users.id).notNull(),
  temLembrete: boolean("tem_lembrete").default(false),
  minutosLembrete: integer("minutos_lembrete").default(15),
  recorrente: boolean("recorrente").default(false),
  padraoRecorrencia: text("padrao_recorrencia"), // semanal, mensal, etc
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ================ MÓDULO 6: PLANO DE AULA ================

// Tabela de planos de aula por turma e data (único por turma + data)
export const planoAula = pgTable("plano_aula", {
  id: serial("id").primaryKey(),
  turmaId: integer("turma_id").notNull(),
  professorId: integer("professor_id").references(() => users.id).notNull(),
  data: date("data").notNull(),
  titulo: text("titulo").notNull(),
  objetivos: text("objetivos").notNull(),
  conteudo: text("conteudo").notNull(),
  metodologia: text("metodologia").notNull(),
  recursos: text("recursos"),
  avaliacao: text("avaliacao"),
  competencias: text("competencias").array(),
  duracaoMinutos: integer("duracao_minutos"),
  status: text("status").default("rascunho"), // rascunho, aprovado, aplicado
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  turmaDataUnique: uniqueIndex("plano_aula_turma_data_unique").on(table.turmaId, table.data),
}));

// Tabela de aulas registradas (aulas que foram ministradas)
export const aulaRegistrada = pgTable("aula_registrada", {
  id: serial("id").primaryKey(),
  turmaId: integer("turma_id").notNull(),
  professorId: integer("professor_id").references(() => users.id).notNull(),
  planoAulaId: integer("plano_aula_id"),
  data: date("data").notNull(),
  titulo: text("titulo").notNull(),
  conteudoMinistrado: text("conteudo_ministrado").notNull(),
  competenciasTrabalhas: text("competencias_trabalhas"),
  observacoes: text("observacoes"),
  duracaoMinutos: integer("duracao_minutos"),
  statusAula: text("status_aula").default("ministrada"), // ministrada, cancelada, adiada
  fotoComprovante: text("foto_comprovante"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ================ MÓDULO 7: ACOMPANHAMENTO ================

// Tabela de acompanhamento pedagógico dos alunos
export const acompanhamento = pgTable("acompanhamento", {
  id: serial("id").primaryKey(),
  alunoCpf: text("aluno_cpf").references(() => aluno.cpf).notNull(),
  professorId: integer("professor_id").references(() => users.id).notNull(),
  turmaId: integer("turma_id"),
  titulo: text("titulo").notNull(), // Título do acompanhamento
  data: date("data").notNull(),
  tipoObservacao: text("tipo_observacao").notNull(), // comportamental, academico, social, familiar
  observacoes: text("observacao").notNull(),
  progressoAcademico: text("progresso_academico"), // excelente, bom, regular, necessita_atencao
  areaDesenvolvimento: text("area_desenvolvimento"), // matematica, portugues, ciencias, comportamento
  metas: text("metas"),
  recomendacoes: text("recomendacoes"),
  dataProximaAvaliacao: date("data_proxima_avaliacao"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ================ MÓDULO 8: RELATÓRIOS GERENCIAIS ================

// Tabela para registrar relatórios gerados (log e histórico)
export const relatorioGerado = pgTable("relatorio_gerado", {
  id: serial("id").primaryKey(),
  professorId: integer("professor_id").references(() => users.id).notNull(),
  tipoRelatorio: text("tipo_relatorio").notNull(), // frequencia_mensal, faltas_recorrentes, planos_aplicados, progresso_alunos
  parametros: json("parametros"), // filtros aplicados: {"turmaId": 1, "dataInicio": "2025-01-01", "dataFim": "2025-01-31"}
  tituloRelatorio: text("titulo_relatorio").notNull(),
  descricao: text("descricao"),
  formatoRelatorio: text("formato_relatorio").default("pdf"), // pdf, excel, csv
  statusGeracao: text("status_geracao").default("processando"), // processando, concluido, erro
  urlArquivo: text("url_arquivo"), // caminho do arquivo gerado
  dataGeracao: timestamp("data_geracao").defaultNow(),
  dataExpiracaoArquivo: timestamp("data_expiracao_arquivo"), // para limpeza automática
});

// ================ MÓDULO 9: SISTEMA DE SORTEIO ================

// Tabela principal dos sorteios
export const sorteios = pgTable("sorteios", {
  id: serial("id").primaryKey(),
  nome: text("nome").notNull(), // "Sorteio Mensal - Janeiro 2025"
  descricao: text("descricao"),
  premio: text("premio").notNull(), // "Vale-compras R$ 500"
  valorPremio: decimal("valor_premio", { precision: 10, scale: 2 }),
  dataInicio: timestamp("data_inicio"),
  dataFim: timestamp("data_fim"),
  dataSorteio: timestamp("data_sorteio").notNull(),
  status: text("status").default("ativo"), // ativo, finalizado, cancelado
  tipoSorteio: text("tipo_sorteio").default("mensal"), // mensal, trimestral, anual
  regras: text("regras"), // Texto com regras do sorteio
  ativo: boolean("ativo").default(true),
  dataAdmissao: date("data_admissao"),
  dataDesligamento: date("data_desligamento"),
  maxParticipantes: integer("max_participantes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Tabela de participações no sorteio
export const sorteioParticipacoes = pgTable("sorteio_participacoes", {
  id: serial("id").primaryKey(),
  sorteioId: integer("sorteio_id").references(() => sorteios.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  numeroChances: integer("numero_chances").notNull().default(1), // Baseado no plano
  numerosAtribuidos: json("numeros_atribuidos").$type<number[]>(), // Array de números atribuídos
  elegivel: boolean("elegivel").default(true),
  // motivoInelegibilidade: text("motivo_inelegibilidade"), // "Pagamento em atraso" (removido do SQL)
  planoAtual: text("plano_atual"), // Plano no momento da participação
  valorPlano: text("valor_plano"), // Alterado para text conforme banco
  participacaoConfirmada: boolean("participacao_confirmada").default(true),
  dataParticipacao: timestamp("data_participacao").defaultNow(),
});

// Tabela de histórico e resultados dos sorteios
export const sorteioResultados = pgTable("sorteio_resultados", {
  id: serial("id").primaryKey(),
  sorteioId: integer("sorteio_id").references(() => sorteios.id).notNull(),
  vencedorId: integer("vencedor_id").references(() => users.id).notNull(),
  numeroSorteado: integer("numero_sorteado").notNull(),
  valorPremio: decimal("valor_premio", { precision: 10, scale: 2 }),
  planoVencedor: text("plano_vencedor"), // Plano do vencedor
  observacoes: text("observacoes"),
  status: text("status"),
  dataSorteio: timestamp("data_sorteio").defaultNow(),
});

// Tabela para configurações do sistema de sorteio
export const sorteioConfiguracoes = pgTable("sorteio_configuracoes", {
  id: serial("id").primaryKey(),
  chave: text("chave").unique().notNull(), // "chances_plano_eco", "chances_plano_voz", etc
  valor: text("valor").notNull(),
  descricao: text("descricao"),
  tipo: text("tipo").default("string"), // string, number, boolean, json
  ativo: boolean("ativo").default(true),
  dataAdmissao: date("data_admissao"),
  dataDesligamento: date("data_desligamento"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ================ MÓDULO 10: SISTEMA DE DESENVOLVIMENTO ================

// Tabela para registrar todas as telas do sistema
export const sistemaTelas = pgTable("sistema_telas", {
  id: serial("id").primaryKey(),
  nome: text("nome").notNull().unique(), // nome da rota/tela
  titulo: text("titulo").notNull(), // título exibido
  rota: text("rota").notNull(), // caminho da rota (ex: /aluno, /professor)
  status: text("status").default("OK"), // OK, Erro, Em atenção
  descricao: text("descricao"),
  modulo: text("modulo"), // aluno, professor, admin, etc
  tipo: text("tipo").default("pagina"), // pagina, componente, api
  ultimaAtualizacao: timestamp("ultima_atualizacao").defaultNow(),
  atualizadoPor: text("atualizado_por"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Tabela para histórico de alterações nas telas
export const sistemaAlteracoes = pgTable("sistema_alteracoes", {
  id: serial("id").primaryKey(),
  telaId: integer("tela_id").references(() => sistemaTelas.id).notNull(),
  tipoAlteracao: text("tipo_alteracao").notNull(), // componente, lógica, layout, bug_fix, feature
  descricao: text("descricao").notNull(),
  detalhes: text("detalhes"), // descrição técnica completa
  autor: text("autor").notNull(), // quem fez a alteração
  versao: text("versao"), // versão do sistema se aplicável
  dataAlteracao: timestamp("data_alteracao").defaultNow(),
});

// Tabela para registrar erros do sistema
export const sistemaErros = pgTable("sistema_erros", {
  id: serial("id").primaryKey(),
  telaId: integer("tela_id").references(() => sistemaTelas.id),
  codigoErro: text("codigo_erro").notNull(), // 404, 500, etc
  tipoErro: text("tipo_erro").notNull(), // client, server, network
  mensagem: text("mensagem").notNull(),
  stack: text("stack"), // stack trace completo
  userAgent: text("user_agent"),
  url: text("url"),
  parametros: json("parametros"), // query params, body, headers relevantes
  resolvido: boolean("resolvido").default(false),
  resolvidoPor: text("resolvido_por"),
  resolvidoEm: timestamp("resolvido_em"),
  dataErro: timestamp("data_erro").defaultNow(),
});

// Tabela para comentários técnicos nas telas
export const sistemaComentarios = pgTable("sistema_comentarios", {
  id: serial("id").primaryKey(),
  telaId: integer("tela_id").references(() => sistemaTelas.id).notNull(),
  comentario: text("comentario").notNull(),
  tipo: text("tipo").default("observacao"), // observacao, todo, bug, improvement
  prioridade: text("prioridade").default("baixa"), // baixa, media, alta, critica
  autor: text("autor").notNull(),
  resolvido: boolean("resolvido").default(false),
  resolvidoPor: text("resolvido_por"),
  resolvidoEm: timestamp("resolvido_em"),
  dataComentario: timestamp("data_comentario").defaultNow(),
});

// Tabela para logs de deploy e alterações globais
export const sistemaDeployLog = pgTable("sistema_deploy_log", {
  id: serial("id").primaryKey(),
  versao: text("versao").notNull(),
  titulo: text("titulo").notNull(),
  descricao: text("descricao").notNull(),
  tipoMudanca: text("tipo_mudanca").notNull(), // feature, bugfix, improvement, hotfix
  responsavel: text("responsavel").notNull(),
  commit: text("commit"), // hash do commit se aplicável
  ambiente: text("ambiente").default("development"), // development, production
  dataDeploy: timestamp("data_deploy").defaultNow(),
});

// Tabela para sessões de desenvolvimento (rastreamento de atividade)
export const sistemaAtividade = pgTable("sistema_atividade", {
  id: serial("id").primaryKey(),
  desenvolvedor: text("desenvolvedor").notNull(),
  acao: text("acao").notNull(), // login, logout, visualizar_tela, editar_status, etc
  recurso: text("recurso"), // qual tela/recurso foi acessado
  detalhes: json("detalhes"), // dados adicionais da ação
  ip: text("ip"),
  userAgent: text("user_agent"),
  dataAtividade: timestamp("data_atividade").defaultNow(),
});

// ================ SCHEMAS ZOD PARA SORTEIO ================

export const sorteioInsertSchema = createInsertSchema(sorteios);
export const sorteioParticipacaoInsertSchema = createInsertSchema(sorteioParticipacoes);
export const sorteioResultadoInsertSchema = createInsertSchema(sorteioResultados);
export const sorteioConfiguracaoInsertSchema = createInsertSchema(sorteioConfiguracoes);

export type SorteioInsert = z.infer<typeof sorteioInsertSchema>;
export type SorteioParticipacaoInsert = z.infer<typeof sorteioParticipacaoInsertSchema>;
export type SorteioResultadoInsert = z.infer<typeof sorteioResultadoInsertSchema>;
export type SorteioConfiguracaoInsert = z.infer<typeof sorteioConfiguracaoInsertSchema>;

export type Sorteio = typeof sorteios.$inferSelect;
export type SorteioParticipacao = typeof sorteioParticipacoes.$inferSelect;
export type SorteioResultado = typeof sorteioResultados.$inferSelect;
export type SorteioConfiguracao = typeof sorteioConfiguracoes.$inferSelect;

// ================ RELACIONAMENTOS (DRIZZLE RELATIONS) ================

export const usersRelations = relations(users, ({ many }) => ({
  turmas: many(turma),
  planosAula: many(planoAula),
  aulasRegistradas: many(aulaRegistrada),
  eventosCalendario: many(calendarioEvento),
  alunosSupervisionados: many(aluno),
  acompanhamentos: many(acompanhamento),
  relatoriosGerados: many(relatorioGerado),
}));

export const paisRelations = relations(pais, ({ many }) => ({
  filhos: many(aluno, { relationName: "AlunoPai" }),
}));

export const maesRelations = relations(maes, ({ many }) => ({
  filhos: many(aluno, { relationName: "AlunoMae" }),
}));

export const alunoResponsaveis = pgTable("aluno_responsaveis", {
  id: serial("id").primaryKey(),
  aluno_cpf: text("aluno_cpf").notNull().references(() => aluno.cpf),
  responsavel_id: integer("responsavel_id").notNull().references(() => responsaveis.id),
  e_principal: boolean("e_principal").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const responsaveisRelations = relations(responsaveis, ({ many }) => ({
  alunoLinks: many(alunoResponsaveis),
}));

export const alunoResponsaveisRelations = relations(alunoResponsaveis, ({ one }) => ({
  aluno: one(aluno, {
    fields: [alunoResponsaveis.aluno_cpf],
    references: [aluno.cpf],
  }),
  responsavel: one(responsaveis, {
    fields: [alunoResponsaveis.responsavel_id],
    references: [responsaveis.id],
  }),
}));

export const alunoRelations = relations(aluno, ({ one, many }) => ({
  professor: one(users, {
    fields: [aluno.professorId],
    references: [users.id],
  }),
  pai: one(pais, {
    fields: [aluno.id_pai],
    references: [pais.id],
    relationName: "AlunoPai",
  }),
  mae: one(maes, {
    fields: [aluno.id_mae],
    references: [maes.id],
    relationName: "AlunoMae",
  }),
  turmas: many(alunoTurma),
  acompanhamentos: many(acompanhamento),
  chamadasAluno: many(chamadaAluno),
}));

export const turmaRelations = relations(turma, ({ one, many }) => ({
  professor: one(users, {
    fields: [turma.professorId],
    references: [users.id],
  }),
  alunos: many(alunoTurma),
  chamadas: many(chamada),
  planosAula: many(planoAula),
  aulasRegistradas: many(aulaRegistrada),
  eventosCalendario: many(calendarioEvento),
  acompanhamentos: many(acompanhamento),
}));

export const alunoTurmaRelations = relations(alunoTurma, ({ one }) => ({
  aluno: one(aluno, {
    fields: [alunoTurma.alunoCpf],
    references: [aluno.cpf],
  }),
  turma: one(turma, {
    fields: [alunoTurma.turmaId],
    references: [turma.id],
  }),
}));

export const chamadaRelations = relations(chamada, ({ one, many }) => ({
  turma: one(turma, {
    fields: [chamada.turmaId],
    references: [turma.id],
  }),
  professor: one(users, {
    fields: [chamada.professorId],
    references: [users.id],
  }),
  presencas: many(chamadaAluno),
}));

export const chamadaAlunoRelations = relations(chamadaAluno, ({ one }) => ({
  chamada: one(chamada, {
    fields: [chamadaAluno.chamadaId],
    references: [chamada.id],
  }),
  aluno: one(aluno, {
    fields: [chamadaAluno.alunoCpf],
    references: [aluno.cpf],
  }),
}));

// ================ SCHEMAS DE INSERÇÃO ================

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
}).extend({
  cpf: cpfSchema,
});

export const insertCouncilRequestSchema = createInsertSchema(councilRequests).pick({
  telefone: true,
  nome: true,
});

// Função para validar telefone brasileiro
function validateBrazilianPhone(phone: string): boolean {
  // Remove caracteres não numéricos
  const digits = phone.replace(/\D/g, '');
  
  // Aceita formatos brasileiros válidos:
  // - 11 dígitos: DDD + número celular (exemplo: 31981156288)
  // - 10 dígitos: DDD + número fixo (exemplo: 1133334444) 
  // - 13 dígitos: +55 + DDD + número (exemplo: +5531981156288)
  if (digits.length >= 10 && digits.length <= 13) {
    // Se tem 11 dígitos, deve ser celular (3º dígito = 9)
    if (digits.length === 11) {
      const ddd = digits.substring(0, 2);
      const ninthDigit = digits.charAt(2);
      // DDDs válidos brasileiros entre 11-99, celular deve ter 9 como 3º dígito
      return parseInt(ddd) >= 11 && parseInt(ddd) <= 99 && ninthDigit === '9';
    }
    return true;
  }
  
  return false;
}

// Schema específico para registro pós-pagamento (sem CPF obrigatório)
export const postPaymentRegisterSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  sobrenome: z.string().min(1, "Sobrenome é obrigatório"),
  telefone: z.string()
    .min(10, "Telefone deve ter pelo menos 10 dígitos")
    .refine(validateBrazilianPhone, { 
      message: "Formato de telefone inválido. Para celular use: DDD + 9 + 8 dígitos (ex: 31987654321)" 
    }),
  email: z.string().email("Email inválido").optional(),
  plano: z.string().optional(), // Opcional - quando presente indica que é um doador
});

export const insertDeveloperSchema = createInsertSchema(developers).omit({
  id: true,
  ultimoAcesso: true,
  createdAt: true,
});

// Schemas de inserção para as novas tabelas
export const insertPaiSchema = createInsertSchema(pais).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  cpf: cpfSchema,
});

export const insertMaeSchema = createInsertSchema(maes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  cpf: cpfSchema,
});

export const insertResponsavelSchema = createInsertSchema(responsaveis).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  cpf: cpfSchema,
});

export const insertAlunoSchema = createInsertSchema(aluno).omit({
  createdAt: true,
  updatedAt: true,
}).extend({
  cpf: cpfSchema,
});

export const insertTurmaSchema = createInsertSchema(turma).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAlunoTurmaSchema = createInsertSchema(alunoTurma).omit({
  id: true,
  dataMatricula: true,
});

// Schemas de inserção para tabelas de desenvolvimento
export const insertSistemaTelaSchema = createInsertSchema(sistemaTelas).omit({
  id: true,
  createdAt: true,
  ultimaAtualizacao: true,
});

export const insertSistemaAlteracaoSchema = createInsertSchema(sistemaAlteracoes).omit({
  id: true,
  dataAlteracao: true,
});

export const insertSistemaErroSchema = createInsertSchema(sistemaErros).omit({
  id: true,
  dataErro: true,
});

export const insertSistemaComentarioSchema = createInsertSchema(sistemaComentarios).omit({
  id: true,
  dataComentario: true,
});

export const insertSistemaDeployLogSchema = createInsertSchema(sistemaDeployLog).omit({
  id: true,
  dataDeploy: true,
});

export const insertSistemaAtividadeSchema = createInsertSchema(sistemaAtividade).omit({
  id: true,
  dataAtividade: true,
});

export const insertChamadaSchema = createInsertSchema(chamada).omit({
  id: true,
  createdAt: true,
});

export const insertChamadaAlunoSchema = createInsertSchema(chamadaAluno).omit({
  id: true,
  horaRegistro: true,
});

export const insertCalendarioEventoSchema = createInsertSchema(calendarioEvento).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPlanoAulaSchema = createInsertSchema(planoAula).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAulaRegistradaSchema = createInsertSchema(aulaRegistrada).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAcompanhamentoSchema = createInsertSchema(acompanhamento).omit({
  id: true,
  createdAt: true,
});

export const insertRelatorioGeradoSchema = createInsertSchema(relatorioGerado).omit({
  id: true,
  dataGeracao: true,
});

export const verificationSchema = z.object({
  telefone: z.string().min(10, "Telefone deve ter pelo menos 10 dígitos"),
  codigo: z.string().length(6, "Código deve ter 6 dígitos"),
});

// ================ TIPOS INFERIDOS ================

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

// Tabela para armazenar as causas que cada usuário quer apoiar
export const userCausas = pgTable("user_causas", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  causa: text("causa").notNull(), // educacao, cultura, esporte, etc.
  createdAt: timestamp("created_at").defaultNow(),
});

export type UserCausa = typeof userCausas.$inferSelect;
export type InsertUserCausa = typeof userCausas.$inferInsert;
export type CouncilRequest = typeof councilRequests.$inferSelect;
export type InsertCouncilRequest = z.infer<typeof insertCouncilRequestSchema>;

export type Developer = typeof developers.$inferSelect;
export type InsertDeveloper = z.infer<typeof insertDeveloperSchema>;

export type Pai = typeof pais.$inferSelect;
export type InsertPai = z.infer<typeof insertPaiSchema>;

export type Mae = typeof maes.$inferSelect;
export type InsertMae = z.infer<typeof insertMaeSchema>;

export type Responsavel = typeof responsaveis.$inferSelect;
export type InsertResponsavel = z.infer<typeof insertResponsavelSchema>;

export type AlunoResponsavel = typeof alunoResponsaveis.$inferSelect;
export const insertAlunoResponsavelSchema = createInsertSchema(alunoResponsaveis).omit({
  id: true,
  createdAt: true,
});
export type InsertAlunoResponsavel = z.infer<typeof insertAlunoResponsavelSchema>;

export type Aluno = typeof aluno.$inferSelect;
export type InsertAluno = z.infer<typeof insertAlunoSchema>;
export type Turma = typeof turma.$inferSelect;
export type InsertTurma = z.infer<typeof insertTurmaSchema>;
export type AlunoTurma = typeof alunoTurma.$inferSelect;
export type InsertAlunoTurma = z.infer<typeof insertAlunoTurmaSchema>;

export type Chamada = typeof chamada.$inferSelect;
export type InsertChamada = z.infer<typeof insertChamadaSchema>;
export type ChamadaAluno = typeof chamadaAluno.$inferSelect;
export type InsertChamadaAluno = z.infer<typeof insertChamadaAlunoSchema>;

export type CalendarioEvento = typeof calendarioEvento.$inferSelect;
export type InsertCalendarioEvento = z.infer<typeof insertCalendarioEventoSchema>;

export type PlanoAula = typeof planoAula.$inferSelect;
export type AulaRegistrada = typeof aulaRegistrada.$inferSelect;
export type InsertAulaRegistrada = z.infer<typeof insertAulaRegistradaSchema>;
export type InsertPlanoAula = z.infer<typeof insertPlanoAulaSchema>;

export type Acompanhamento = typeof acompanhamento.$inferSelect;
export type InsertAcompanhamento = z.infer<typeof insertAcompanhamentoSchema>;

// Tipos para sistema de desenvolvimento
export type SistemaTela = typeof sistemaTelas.$inferSelect;
export type InsertSistemaTela = z.infer<typeof insertSistemaTelaSchema>;

export type SistemaAlteracao = typeof sistemaAlteracoes.$inferSelect;
export type InsertSistemaAlteracao = z.infer<typeof insertSistemaAlteracaoSchema>;

export type SistemaErro = typeof sistemaErros.$inferSelect;
export type InsertSistemaErro = z.infer<typeof insertSistemaErroSchema>;

export type SistemaComentario = typeof sistemaComentarios.$inferSelect;
export type InsertSistemaComentario = z.infer<typeof insertSistemaComentarioSchema>;

export type SistemaDeployLog = typeof sistemaDeployLog.$inferSelect;
export type InsertSistemaDeployLog = z.infer<typeof insertSistemaDeployLogSchema>;

export type SistemaAtividade = typeof sistemaAtividade.$inferSelect;
export type InsertSistemaAtividade = z.infer<typeof insertSistemaAtividadeSchema>;

export type RelatorioGerado = typeof relatorioGerado.$inferSelect;
export type InsertRelatorioGerado = z.infer<typeof insertRelatorioGeradoSchema>;

// ================ SISTEMA DE GAMIFICAÇÃO - GRITOS ================

// Tabela para histórico de check-ins diários
export const checkins = pgTable("checkins", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  dataCheckin: date("data_checkin").notNull(),
  gritosGanhos: integer("gritos_ganhos").default(10),
  createdAt: timestamp("created_at").defaultNow(),
});

// Tabela para histórico de ganho de gritos (check-ins, missões, bônus)
export const gritosHistorico = pgTable("gritos_historico", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  tipo: text("tipo").notNull(), // 'checkin', 'missao', 'bonus_inicial', 'bonus_nivel'
  gritosGanhos: integer("gritos_ganhos").notNull(),
  descricao: text("descricao"), // Ex: "Check-in diário", "Missão: Convide um amigo"
  dataGanho: timestamp("data_ganho").defaultNow(),
});

// Tabela para definir níveis e metas
export const niveis = pgTable("niveis", {
  id: serial("id").primaryKey(),
  nome: text("nome").notNull(), // "Aliado do Grito", "Eco do Bem", etc.
  gritosMinimos: integer("gritos_minimos").notNull(),
  gritosProximoNivel: integer("gritos_proximo_nivel"),
  proximoNivel: text("proximo_nivel"),
  recompensas: json("recompensas"), // JSON com benefícios do nível
  ativo: boolean("ativo").default(true),
  dataAdmissao: date("data_admissao"),
  dataDesligamento: date("data_desligamento"),
  ordem: integer("ordem").notNull(),
});

// Schemas de inserção para gamificação
export const insertCheckinsSchema = createInsertSchema(checkins).omit({
  id: true,
  createdAt: true,
});

export const insertGritosHistoricoSchema = createInsertSchema(gritosHistorico).omit({
  id: true,
  dataGanho: true,
});

export const insertNiveisSchema = createInsertSchema(niveis).omit({
  id: true,
});

// Tipos para gamificação
export type Checkin = typeof checkins.$inferSelect;
export type InsertCheckin = z.infer<typeof insertCheckinsSchema>;

export type GritosHistorico = typeof gritosHistorico.$inferSelect;
export type InsertGritosHistorico = z.infer<typeof insertGritosHistoricoSchema>;

export type Nivel = typeof niveis.$inferSelect;
export type InsertNivel = z.infer<typeof insertNiveisSchema>;

// ================ SISTEMA DE BENEFÍCIOS DINÂMICOS ================

// Tabela para prêmios gerenciados pelo dev-marketing
export const beneficios = pgTable("beneficios", {
  id: serial("id").primaryKey(),
  titulo: text("titulo").notNull(),
  descricao: text("descricao").notNull(),
  icone: text("icone").notNull(), // ícone do benefício (obrigatório)
  categoria: text("categoria").notNull(), // 'financeiro', 'educacional', 'saude', 'lazer'
  ativo: boolean("ativo").default(true),
  dataAdmissao: date("data_admissao"),
  dataDesligamento: date("data_desligamento"),
  ordem: integer("ordem").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  imagem: text("imagem"), // caminho para arquivo de imagem
  pontosNecessarios: integer("pontos_necessarios"), // pontos necessários como integer
  planosDisponiveis: text("planos_disponiveis").array().default([]), // array de planos: ['eco', 'voz', 'grito', 'platinum']
  valorEstimado: decimal("valor_estimado", { precision: 10, scale: 2 }), // valor estimado do prêmio em R$
  gritosMinimos: integer("gritos_minimos").default(100), // gritos mínimos para participar
  prazoLances: timestamp("prazo_lances"), // data limite para fazer lances
  inicioLeilao: timestamp("inicio_leilao"), // data de início do leilão
  ciclosPagamento: text("ciclos_pagamento").array().default(['mensal']), // array de ciclos: ['mensal', 'trimestral', 'semestral', 'anual']
});

// Tabela para imagens dos benefícios (separada para melhor organização)
export const beneficioImagens = pgTable("beneficio_imagens", {
  id: serial("id").primaryKey(),
  beneficioId: integer("beneficio_id").references(() => beneficios.id).notNull(),
  tipo: text("tipo").notNull().default("card"), // "card" ou "detalhes" para diferentes usos
  nomeArquivo: text("nome_arquivo").notNull(), // nome único gerado pelo multer
  caminhoCompleto: text("caminho_completo").notNull(), // /uploads/filename.ext
  nomeOriginal: text("nome_original"), // nome original do arquivo enviado
  tipoMime: text("tipo_mime"), // image/jpeg, image/png, etc
  tamanhoBytes: integer("tamanho_bytes"), // tamanho em bytes
  largura: integer("largura"), // largura da imagem em pixels
  altura: integer("altura"), // altura da imagem em pixels
  ativo: boolean("ativo").default(true),
  dataAdmissao: date("data_admissao"),
  dataDesligamento: date("data_desligamento"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Schema de inserção para benefícios
export const insertBeneficiosSchema = createInsertSchema(beneficios).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Schema de inserção para imagens de benefícios
export const insertBeneficioImagensSchema = createInsertSchema(beneficioImagens).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Tipos para prêmios
export type Beneficio = typeof beneficios.$inferSelect;
export type InsertBeneficio = z.infer<typeof insertBeneficiosSchema>;

// Tipos para imagens de benefícios
export type BeneficioImagem = typeof beneficioImagens.$inferSelect;
export type InsertBeneficioImagem = z.infer<typeof insertBeneficioImagensSchema>;

// ================ SISTEMA DE LANCES EM PRÊMIOS ================

// Tabela para lances dos usuários em prêmios
export const beneficioLances = pgTable("beneficio_lances", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  beneficioId: integer("beneficio_id").references(() => beneficios.id).notNull(),
  pontosOfertados: integer("pontos_ofertados").notNull(),
  status: text("status").default("ativo"), // 'ativo', 'vencido', 'ganho'
  transacaoId: text("transacao_id"), // ID único para evitar lances duplicados (idempotência)
  dataResultado: timestamp("data_resultado"), // quando foi decidido o resultado
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Schema de inserção para lances
export const insertBeneficioLancesSchema = createInsertSchema(beneficioLances).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Schema de validação para lances (usado na API)
export const validarLanceSchema = z.object({
  beneficioId: z.number().int().positive("ID do benefício deve ser um número positivo"),
  valorLance: z.number().int().positive("Valor do lance deve ser um número positivo"),
  userId: z.number().int().positive("ID do usuário deve ser um número positivo"),
});

// Tipos para lances
export type BeneficioLance = typeof beneficioLances.$inferSelect;
export type InsertBeneficioLance = z.infer<typeof insertBeneficioLancesSchema>;
export type ValidarLance = z.infer<typeof validarLanceSchema>;

// Relations para lances
export const beneficioLancesRelations = relations(beneficioLances, ({ one }) => ({
  usuario: one(users, {
    fields: [beneficioLances.userId],
    references: [users.id],
  }),
  beneficio: one(beneficios, {
    fields: [beneficioLances.beneficioId],
    references: [beneficios.id],
  }),
}));

// ================ GANHADORES DE BENEFÍCIOS ================

// Tabela para registrar os ganhadores dos benefícios com foto
export const beneficioGanhadores = pgTable("beneficio_ganhadores", {
  id: serial("id").primaryKey(),
  beneficioId: integer("beneficio_id").references(() => beneficios.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  fotoUrl: text("foto_url"), // URL da foto do ganhador (upload pelo admin)
  lancesTotais: integer("lances_totais").notNull().default(0), // Total de lances que o ganhador fez
  gritosTotais: integer("gritos_totais").notNull().default(0), // Total de gritos usados no benefício
  depoimento: text("depoimento"), // Depoimento opcional do ganhador
  visivel: boolean("visivel").default(true), // Se deve aparecer na galeria
  dataGanhou: timestamp("data_ganhou").defaultNow(),
  dinamizeEnviado: boolean("dinamize_enviado").default(false), // controle anti-duplicidade Dinamize
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Schema de inserção para ganhadores
export const insertBeneficioGanhadoresSchema = createInsertSchema(beneficioGanhadores).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Tipos para ganhadores
export type BeneficioGanhador = typeof beneficioGanhadores.$inferSelect;
export type InsertBeneficioGanhador = z.infer<typeof insertBeneficioGanhadoresSchema>;

// Relations para ganhadores
export const beneficioGanhadoresRelations = relations(beneficioGanhadores, ({ one }) => ({
  usuario: one(users, {
    fields: [beneficioGanhadores.userId],
    references: [users.id],
  }),
  beneficio: one(beneficios, {
    fields: [beneficioGanhadores.beneficioId],
    references: [beneficios.id],
  }),
}));

// ================ SISTEMA DE MISSÕES DA SEMANA ================

// Tabela para missões semanais (sistema profissional)
export const missoesSemanais = pgTable("missoes_semanais", {
  id: serial("id").primaryKey(),
  titulo: text("titulo").notNull(),
  descricao: text("descricao").notNull(),
  recompensaGritos: integer("recompensa_gritos").default(150),
  tipoMissao: text("tipo_missao").notNull(), // 'convite_amigo', 'check_in_consecutivo', 'compartilhar', 'pagamento', etc
  automatico: boolean("automatico").default(false), // Se a missão é verificada automaticamente pelo sistema
  evidenceType: text("evidence_type").notNull().default("comentario"), // 'comentario', 'print', 'link', 'checkin', 'video', 'quiz', 'pagamento'
  imagemUrl: text("imagem_url"), // URL da imagem da missão
  planoMinimo: text("plano_minimo").default("eco"), // 'eco', 'voz', 'grito', 'platinum', 'diamante'
  nivelMinimo: integer("nivel_minimo").default(1), // Nível mínimo do usuário
  limiteEnvios: integer("limite_envios").default(1), // Quantas vezes pode enviar evidência
  reviewRequired: boolean("review_required").default(false), // Se precisa validação humana
  autoApprove: boolean("auto_approve").default(true), // Se aprova automaticamente
  habilitarLinkCompartilhamento: boolean("habilitar_link_compartilhamento").default(false), // Para missões tipo "convite_amigo"
  criteriosElegibilidade: json("criterios_elegibilidade").$type<Record<string, any>>(), // Critérios específicos
  dominiosPermitidos: json("dominios_permitidos").$type<string[]>(), // Para evidence_type 'link'
  distanciaMaxima: integer("distancia_maxima").default(500), // Para evidence_type 'checkin' (metros)
  duracaoMaximaVideo: integer("duracao_maxima_video").default(60), // Para evidence_type 'video' (segundos)
  perguntasQuiz: json("perguntas_quiz").$type<Array<{pergunta: string, opcoes: string[], resposta_correta: number}>>(), // Para evidence_type 'quiz'
  percentualAcertoMinimo: integer("percentual_acerto_minimo").default(70), // Para evidence_type 'quiz'
  quantidadeAmigos: integer("quantidade_amigos").default(1), // Para evidence_type 'link' - quantidade de amigos necessários (1-10)
  valorPagamento: decimal("valor_pagamento", { precision: 10, scale: 2 }), // Valor para missões de pagamento (R$)
  diasNecessarios: integer("dias_necessarios"), // Para missões de check-in consecutivo - quantos dias são necessários
  semanaInicio: date("semana_inicio").notNull(),
  semanaFim: date("semana_fim").notNull(),
  ativo: boolean("ativo").default(true),
  dataAdmissao: date("data_admissao"),
  dataDesligamento: date("data_desligamento"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Nova tabela para envios de evidências (sistema profissional)
export const missaoEnvios = pgTable("missao_envios", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  missaoId: integer("missao_id").references(() => missoesSemanais.id).notNull(),
  status: text("status").default("pendente_validacao"), // 'pendente_validacao', 'aprovado', 'reprovado', 'expirado'
  evidenceType: text("evidence_type").notNull(), // 'comentario', 'print', 'link', 'checkin', 'video', 'quiz'
  evidenciaData: json("evidencia_data").$type<Record<string, any>>(), // Dados da evidência conforme tipo
  hashAntiFreude: text("hash_anti_fraude"), // Hash para evitar reutilização
  tentativasRealizadas: integer("tentativas_realizadas").default(1),
  motivoReprovacao: text("motivo_reprovacao"), // Se reprovado, motivo
  moderadorId: integer("moderador_id").references(() => users.id), // Quem validou
  podeRefazer: boolean("pode_refazer").default(true), // Se pode tentar novamente
  gritosRecebidos: integer("gritos_recebidos").default(0), // Gritos ganhos se aprovado
  validadoEm: timestamp("validado_em"), // Quando foi validado
  expiradoEm: timestamp("expirado_em"), // Quando expira
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Tabela para tracking de missões completadas pelos usuários (mantida para compatibilidade)
export const missoesConcluidas = pgTable("missoes_concluidas", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  missaoId: integer("missao_id").references(() => missoesSemanais.id).notNull(),
  concluidaEm: timestamp("concluida_em").defaultNow(),
  gritosRecebidos: integer("gritos_recebidos").default(150),
  fotoComprovante: text("foto_comprovante"), // URL base64 da foto (legacy - primeira imagem)
  evidencias: jsonb("evidencias").$type<Array<{
    tipo: 'imagem' | 'video' | 'link' | 'comentario' | 'checkin' | 'quiz';
    url?: string;
    texto?: string;
    metadata?: Record<string, any>;
  }>>(), // Array de evidências estruturadas com URLs do GCS
}, (table) => ({
  // 🔐 UNIQUE CONSTRAINT: Previne dupla conclusão da mesma missão pelo mesmo usuário
  userMissaoUnique: unique("missoes_concluidas_user_missao_unique").on(table.userId, table.missaoId),
}));

// Tabela para transações de pagamento das missões
export const missaoTransacoes = pgTable("missao_transacoes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  missaoId: integer("missao_id").references(() => missoesSemanais.id).notNull(),
  stripePaymentIntentId: text("stripe_payment_intent_id").unique().notNull(),
  stripeCustomerId: text("stripe_customer_id").notNull(),
  valor: decimal("valor", { precision: 10, scale: 2 }).notNull(), // Valor cobrado
  status: text("status").default("pending"), // 'pending', 'succeeded', 'failed', 'cancelled'
  descricao: text("descricao").notNull(), // Descrição da transação
  metadata: json("metadata").$type<Record<string, any>>(), // Dados extras do pagamento
  stripeWebhookProcessed: boolean("stripe_webhook_processed").default(false), // Se webhook foi processado
  gritosAtribuidos: boolean("gritos_atribuidos").default(false), // Se gritos foram dados
  errorMessage: text("error_message"), // Mensagem de erro se falhou
  processedAt: timestamp("processed_at"), // Quando foi processado
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations para missões
export const missoesSemanaisRelations = relations(missoesSemanais, ({ many }) => ({
  conclusoes: many(missoesConcluidas),
  envios: many(missaoEnvios),
  transacoes: many(missaoTransacoes),
}));

export const missoesConcluidasRelations = relations(missoesConcluidas, ({ one }) => ({
  usuario: one(users, {
    fields: [missoesConcluidas.userId],
    references: [users.id],
  }),
  missao: one(missoesSemanais, {
    fields: [missoesConcluidas.missaoId],
    references: [missoesSemanais.id],
  }),
}));

export const missaoEnviosRelations = relations(missaoEnvios, ({ one }) => ({
  usuario: one(users, {
    fields: [missaoEnvios.userId],
    references: [users.id],
  }),
  missao: one(missoesSemanais, {
    fields: [missaoEnvios.missaoId],
    references: [missoesSemanais.id],
  }),
  moderador: one(users, {
    fields: [missaoEnvios.moderadorId],
    references: [users.id],
  }),
}));

export const missaoTransacoesRelations = relations(missaoTransacoes, ({ one }) => ({
  usuario: one(users, {
    fields: [missaoTransacoes.userId],
    references: [users.id],
  }),
  missao: one(missoesSemanais, {
    fields: [missaoTransacoes.missaoId],
    references: [missoesSemanais.id],
  }),
}));

// 🔒 Schemas para missões com validações críticas de segurança
export const insertMissoesSemanaisSchema = createInsertSchema(missoesSemanais)
  .omit({
    id: true,
    createdAt: true,
  })
  .refine(
    (data) => {
      // 🔥 VALIDAÇÃO CRÍTICA: Se tipoMissao = 'pagamento', valorPagamento deve ser > 0
      if (data.tipoMissao === 'pagamento') {
        const valor = data.valorPagamento;
        return valor && parseFloat(valor.toString()) > 0;
      }
      return true;
    },
    {
      message: "Missões de pagamento devem ter valorPagamento maior que 0",
      path: ["valorPagamento"]
    }
  )
  .refine(
    (data) => {
      // 🔥 VALIDAÇÃO: Se tipoMissao = 'pagamento', evidenceType deve ser 'pagamento'
      if (data.tipoMissao === 'pagamento') {
        return data.evidenceType === 'pagamento';
      }
      return true;
    },
    {
      message: "Missões de pagamento devem ter evidenceType = 'pagamento'",
      path: ["evidenceType"]
    }
  )
  .refine(
    (data) => {
      // 🔥 VALIDAÇÃO: Limite máximo de pagamento por segurança
      if (data.tipoMissao === 'pagamento' && data.valorPagamento) {
        const valor = parseFloat(data.valorPagamento.toString());
        return valor <= 500; // R$ 500 máximo por transação
      }
      return true;
    },
    {
      message: "Valor de pagamento não pode exceder R$ 500,00",
      path: ["valorPagamento"]
    }
  );

export const insertMissoesConcluidasSchema = createInsertSchema(missoesConcluidas).omit({
  id: true,
  concluidaEm: true,
});

export const insertMissaoEnviosSchema = createInsertSchema(missaoEnvios).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// 🔒 Schema para transações com validações de segurança
export const insertMissaoTransacoesSchema = createInsertSchema(missaoTransacoes)
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  })
  .refine(
    (data) => {
      // 🔥 VALIDAÇÃO: Valor deve ser positivo
      const valor = parseFloat(data.valor.toString());
      return valor > 0;
    },
    {
      message: "Valor da transação deve ser maior que 0",
      path: ["valor"]
    }
  )
  .refine(
    (data) => {
      // 🔥 VALIDAÇÃO: Valor máximo por transação
      const valor = parseFloat(data.valor.toString());
      return valor <= 500;
    },
    {
      message: "Valor máximo por transação: R$ 500,00",
      path: ["valor"]
    }
  );

// Tipos para missões
export type MissaoSemanal = typeof missoesSemanais.$inferSelect;
export type InsertMissaoSemanal = z.infer<typeof insertMissoesSemanaisSchema>;
export type MissaoConcluida = typeof missoesConcluidas.$inferSelect;
export type InsertMissaoConcluida = z.infer<typeof insertMissoesConcluidasSchema>;
export type MissaoEnvio = typeof missaoEnvios.$inferSelect;
export type InsertMissaoEnvio = z.infer<typeof insertMissaoEnviosSchema>;
export type MissaoTransacao = typeof missaoTransacoes.$inferSelect;
export type InsertMissaoTransacao = z.infer<typeof insertMissaoTransacoesSchema>;

// Tipos de evidência suportados
export type EvidenceType = 'comentario' | 'print' | 'link' | 'checkin' | 'video' | 'quiz' | 'pagamento' | 'automatico';
export type MissaoStatus = 'disponivel' | 'pendente_validacao' | 'aprovado' | 'reprovado' | 'expirado';

// Estruturas de dados por tipo de evidência
export interface EvidenciaComentario {
  comentario: string; // 20-600 caracteres
}

export interface EvidenciaPrint {
  imagens: string[]; // URLs das imagens (1-3)
  observacao?: string; // até 140 caracteres
}

export interface EvidenciaLink {
  url: string; // URL validada
  comentario?: string; // até 140 caracteres
}

export interface EvidenciaCheckin {
  latitude: number;
  longitude: number;
  precisao?: number; // em metros
  enderecoDetectado?: string;
}

export interface EvidenciaVideo {
  videoUrl: string; // URL do vídeo ou upload
  duracao: number; // em segundos
  thumbnail?: string; // URL da thumbnail
}

export interface EvidenciaQuiz {
  respostas: number[]; // índices das respostas selecionadas
  pontuacao: number; // percentual de acerto (0-100)
  questoesCorretas: number;
  totalQuestoes: number;
}

export interface EvidenciaPagamento {
  stripePaymentIntentId: string; // ID do payment intent no Stripe
  valorPago: number; // Valor pago em R$
  transacaoId: string; // ID da transação no banco local
  statusPagamento: 'succeeded' | 'failed' | 'cancelled';
  dataProcessamento: string; // ISO date string
}

// ================ SISTEMA DE HISTÓRIAS QUE INSPIRAM ================

// Tabela para histórias inspiradoras
export const historiasInspiradoras = pgTable("historias_inspiradoras", {
  id: serial("id").primaryKey(),
  titulo: text("titulo").notNull(),
  nome: text("nome").notNull(),
  texto: text("texto"), // Campo para o conteúdo/descrição da história
  imagemBox: text("imagem_box"), // Imagem para o card/box (329x201px)
  imagemStory: text("imagem_story"), // Imagem para o story completo (1080x1920px)
  ativo: boolean("ativo").default(true),
  dataAdmissao: date("data_admissao"),
  dataDesligamento: date("data_desligamento"),
  ordem: integer("ordem").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Tabela para slides das histórias
export const historiasSlides = pgTable("historias_slides", {
  id: serial("id").primaryKey(),
  historiaId: integer("historia_id").references(() => historiasInspiradoras.id).notNull(),
  tipo: text("tipo").notNull(), // 'image' ou 'text'
  titulo: text("titulo"),
  conteudo: text("conteudo"),
  imagem: text("imagem"),
  corFundo: text("cor_fundo"),
  duracao: integer("duracao").default(5), // duração em segundos
  ordem: integer("ordem").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const historiasSlidesRelations = relations(historiasSlides, ({ one }) => ({
  historia: one(historiasInspiradoras, {
    fields: [historiasSlides.historiaId],
    references: [historiasInspiradoras.id],
  }),
}));

// Schemas para histórias
export const insertHistoriasInspiradorasSchema = createInsertSchema(historiasInspiradoras).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertHistoriasSlidesSchema = createInsertSchema(historiasSlides).omit({
  id: true,
  createdAt: true,
});

// Tabela para interações com as histórias (curtidas, comentários, compartilhamentos)
export const historiasInteracoes = pgTable("historias_interacoes", {
  id: serial("id").primaryKey(),
  usuarioId: integer("usuario_id").references(() => users.id).notNull(),
  historiaId: integer("historia_id").references(() => historiasInspiradoras.id).notNull(),
  tipo: text("tipo").notNull(), // 'curtida', 'comentario', 'compartilhamento'
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations para interações
export const historiasInteracoesRelations = relations(historiasInteracoes, ({ one }) => ({
  usuario: one(users, {
    fields: [historiasInteracoes.usuarioId],
    references: [users.id],
  }),
  historia: one(historiasInspiradoras, {
    fields: [historiasInteracoes.historiaId],
    references: [historiasInspiradoras.id],
  }),
}));

// Atualizar relations das histórias para incluir interações
export const historiasInspiradorasRelations = relations(historiasInspiradoras, ({ many }) => ({
  slides: many(historiasSlides),
  interacoes: many(historiasInteracoes),
}));

// Schema para interações
export const insertHistoriasInteracoesSchema = createInsertSchema(historiasInteracoes).omit({
  id: true,
  createdAt: true,
});

// Tipos para histórias
export type HistoriaInspiradora = typeof historiasInspiradoras.$inferSelect;
export type InsertHistoriaInspiradora = z.infer<typeof insertHistoriasInspiradorasSchema>;
export type HistoriaSlide = typeof historiasSlides.$inferSelect;
export type InsertHistoriaSlide = z.infer<typeof insertHistoriasSlidesSchema>;
export type HistoriaInteracao = typeof historiasInteracoes.$inferSelect;
export type InsertHistoriaInteracao = z.infer<typeof insertHistoriasInteracoesSchema>;

// ================ SISTEMA DE LEILÕES DE PONTOS ================

// Tabela para prêmios dos leilões
export const premios = pgTable("premios", {
  id: serial("id").primaryKey(),
  titulo: text("titulo").notNull(),
  descricao: text("descricao"),
  categoria: text("categoria").notNull(), // 'Produtos', 'Experiências', 'Serviços'
  imagemUrl: text("imagem_url"),
  estoque: integer("estoque").default(1),
  ativo: boolean("ativo").default(true),
  dataAdmissao: date("data_admissao"),
  dataDesligamento: date("data_desligamento"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Tabela para leilões ativos/finalizados
export const leiloes = pgTable("leiloes", {
  id: serial("id").primaryKey(),
  premioId: integer("premio_id").notNull().references(() => premios.id),
  inicioEm: timestamp("inicio_em").notNull(),
  fimEm: timestamp("fim_em").notNull(),
  incrementoMinimo: integer("incremento_minimo").default(10), // pontos
  lanceAtual: integer("lance_atual").default(0),
  liderAtual: text("lider_atual"), // user ID do líder atual
  status: text("status").notNull().default('ativo'), // 'ativo', 'finalizado', 'cancelado'
  regrasEspecificas: text("regras_especificas"),
  notificarSeguidores: boolean("notificar_seguidores").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Tabela para lances individuais
export const lances = pgTable("lances", {
  id: serial("id").primaryKey(),
  leilaoId: integer("leilao_id").notNull().references(() => leiloes.id),
  userId: text("user_id").notNull(), // referencia users.id
  valor: integer("valor").notNull(), // valor do lance em pontos
  eraLider: boolean("era_lider").default(false), // se era líder no momento do lance
  devolvido: boolean("devolvido").default(false), // se os pontos foram devolvidos
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations para leilões
export const premiosRelations = relations(premios, ({ many }) => ({
  leiloes: many(leiloes),
}));

export const leiloesRelations = relations(leiloes, ({ one, many }) => ({
  premio: one(premios, {
    fields: [leiloes.premioId],
    references: [premios.id],
  }),
  lances: many(lances),
}));

export const lancesRelations = relations(lances, ({ one }) => ({
  leilao: one(leiloes, {
    fields: [lances.leilaoId],
    references: [leiloes.id],
  }),
}));

// Schemas para leilões
export const insertPremiosSchema = createInsertSchema(premios).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertLeiloesSchema = createInsertSchema(leiloes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertLancesSchema = createInsertSchema(lances).omit({
  id: true,
  createdAt: true,
});

// Tipos para leilões
export type Premio = typeof premios.$inferSelect;
export type InsertPremio = z.infer<typeof insertPremiosSchema>;
export type Leilao = typeof leiloes.$inferSelect;
export type InsertLeilao = z.infer<typeof insertLeiloesSchema>;
export type Lance = typeof lances.$inferSelect;
export type InsertLance = z.infer<typeof insertLancesSchema>;

// ================ SISTEMA DE REFERRALS ================

// Tabela para rastreamento de referrals/indicações
export const referrals = pgTable("referrals", {
  id: serial("id").primaryKey(),
  referrerUserId: integer("referrer_user_id").references(() => users.id).notNull(), // Quem fez a indicação
  referredUserId: integer("referred_user_id").references(() => users.id), // Quem foi indicado (null até se cadastrar)
  linkConvite: text("link_convite").notNull(), // Link de convite gerado
  codigoConvite: text("codigo_convite").notNull().unique(), // Código único para rastreamento
  status: text("status").default("pendente"), // 'pendente', 'cadastrou', 'doou_completou', 'expirado'
  missaoId: integer("missao_id").references(() => missoesSemanais.id), // Qual missão gerou este referral
  gritosRecompensa: integer("gritos_recompensa").default(200), // Gritos a serem dados quando completar
  cadastrouEm: timestamp("cadastrou_em"), // Quando o referido se cadastrou
  doouEm: timestamp("doou_em"), // Quando o referido fez a primeira doação
  completadoEm: timestamp("completado_em"), // Quando a missão foi completada (doação confirmada)
  expiradoEm: timestamp("expirado_em"), // Quando expira (30 dias por padrão)
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations para referrals
export const referralsRelations = relations(referrals, ({ one }) => ({
  referrerUser: one(users, {
    fields: [referrals.referrerUserId],
    references: [users.id],
  }),
  referredUser: one(users, {
    fields: [referrals.referredUserId], 
    references: [users.id],
  }),
  missao: one(missoesSemanais, {
    fields: [referrals.missaoId],
    references: [missoesSemanais.id],
  }),
}));

// Schemas para referrals
export const insertReferralsSchema = createInsertSchema(referrals).omit({
  id: true,
  createdAt: true,
});

// Tipos para referrals
export type Referral = typeof referrals.$inferSelect;
export type InsertReferral = z.infer<typeof insertReferralsSchema>;

// ================ INTERFACES PARA MÉTRICAS DE REFERRALS ================

// Interface para estatísticas gerais de referrals
export interface ReferralStats {
  range: string; // Período analisado
  totalLinks: number; // Total de links gerados
  totalClicks: number; // Total de cliques nos links
  totalRegistrations: number; // Total de cadastros via referrals
  totalDonations: number; // Total de doações de referidos
  clickRate: number; // Taxa de cliques (%)
  conversionRate: number; // Taxa de conversão cadastro (%)
  donationRate: number; // Taxa de conversão doação (%)
  averageReward: number; // Recompensa média em gritos
  topReferrers: Array<{
    userId: number;
    nome: string;
    totalLinks: number;
    totalConversions: number;
    totalRewards: number;
  }>;
  monthlyTrends: Array<{
    month: string;
    links: number;
    clicks: number;
    registrations: number;
    donations: number;
  }>;
  recentActivity: ReferralEvent[];
}

// Interface para links individuais de referral
export interface ReferralLink {
  id: number;
  referrerUserId: number;
  referrerName: string;
  referrerEmail: string | null;
  linkCode: string; // codigoConvite
  linkUrl: string; // linkConvite
  status: 'pendente' | 'completo' | 'expirado';
  clickCount: number; // Calculado baseado em eventos
  registrationCount: number; // Calculado baseado em referredUserId
  donationCount: number; // Calculado baseado em doações dos referidos
  rewardPoints: number; // gritosRecompensa
  createdAt: string;
  completedAt: string | null;
  expiresAt: string | null;
  conversionRate: number; // Calculado (registrations / clicks * 100)
  isActive: boolean; // Status baseado em expiração
  referredUsers: Array<{
    userId: number | null;
    nome: string | null;
    telefone: string | null;
    registeredAt: string | null;
    isDonor: boolean;
  }>;
}

// Interface para eventos de referral
export interface ReferralEvent {
  id: number;
  type: 'link_created' | 'link_clicked' | 'user_registered' | 'donation_made' | 'reward_given';
  referralId: number;
  referrerUserId: number;
  referrerName: string;
  referredUserId: number | null;
  referredName: string | null;
  eventValue: number | null; // Valor da doação, gritos dados, etc
  description: string;
  timestamp: string;
  metadata: Record<string, any> | null; // Dados extras do evento
}

// ================ TIPOS PARA DOADORES (ainda não criados) ================
// Definindo tipos básicos dos doadores que serão implementados
export type Doador = typeof doadores.$inferSelect;
export type InsertDoador = typeof doadores.$inferInsert;
export type HistoricoDoacao = typeof historicoDoacao.$inferSelect;
export type InsertHistoricoDoacao = typeof historicoDoacao.$inferInsert;

// ================ SCHEMAS DE VALIDAÇÃO PARA DOADORES ================

// 🔒 Schema de validação para filtros de query parameters nas rotas de doadores
// ⚠️  IMPORTANTE: Valores alinhados com schema da tabela doadores
export const donorFiltersSchema = z.object({
  busca: z.string().trim().max(100, 'Termo de busca deve ter no máximo 100 caracteres').optional(),
  plano: z.enum(['eco', 'voz', 'grito', 'platinum'], {
    errorMap: () => ({ message: 'Plano deve ser: eco, voz, grito ou platinum' })
  }).optional(),
  status: z.enum(['pending', 'paid', 'failed', 'cancelled'], {
    errorMap: () => ({ message: 'Status deve ser: pending, paid, failed ou cancelled' })
  }).optional(),
  periodo: z.enum(['hoje', 'semana', '30dias', '90dias', 'ano', 'total'], {
    errorMap: () => ({ message: 'Período deve ser: hoje, semana, 30dias, 90dias, ano ou total' })
  }).optional(),
  limite: z.coerce.number().int('Limite deve ser um número inteiro').min(1, 'Limite deve ser pelo menos 1').max(100, 'Limite máximo é 100').default(50),
  offset: z.coerce.number().int('Offset deve ser um número inteiro').min(0, 'Offset não pode ser negativo').default(0),
  ordenacao: z.enum(['recente', 'antigo', 'nome_asc', 'nome_desc', 'valor_asc', 'valor_desc', 'plano', 'status'], {
    errorMap: () => ({ message: 'Ordenação deve ser: recente, antigo, nome_asc, nome_desc, valor_asc, valor_desc, plano ou status' })
  }).default('recente')
});

// Schema para validação de ID do doador
export const donorIdSchema = z.object({
  id: z.coerce.number().int('ID deve ser um número inteiro').positive('ID deve ser positivo')
});

// Tipos derivados dos schemas
export type DonorFilters = z.infer<typeof donorFiltersSchema>;
export type DonorIdParams = z.infer<typeof donorIdSchema>;

// ================ INTERFACES PARA DASHBOARD DE DOADORES ================

// Interface para estatísticas gerais de doadores
export interface DonorStats {
  totalDoadores: number;
  doadoresAtivos: number;
  doadoresInativos: number;
  receitaMensal: number;
  distribuicaoPlanos: {
    eco: number;
    voz: number;
    grito: number;
    platinum: number;
    diamante: number;
  };
  metricasGamificacao: {
    totalCheckIns: number;
    missoesCompletadas: number;
    gritosTotaisDistribuidos: number;
    usuariosAtivos: number;
  };
}

// Interface para dados detalhados de um doador individual
export interface DonorDetails extends User {
  dadosDoacao: {
    plano: string;
    valor: number;
    status: string;
    stripeSubscriptionId: string | null;
    dataInicio: string;
    ultimoPagamento: string | null;
    totalDoacoes: number;
  };
  historicoCompleto: HistoricoDoacao[];
  dadosGamificacao: {
    gritosAtuais: number;
    nivelAtual: number;
    diasConsecutivos: number;
    ultimoCheckin: string | null;
    missoesCompletadas: number;
    beneficiosResgatados: number;
  };
  atividade: {
    ultimaAtividade: string;
    frequenciaCheckin: number;
    engajamentoMissoes: number;
  };
}

// Interface para dados resumidos na lista de doadores
export interface DonorSummary {
  id: number;
  nome: string;
  sobrenome: string | null;
  telefone: string;
  email: string | null;
  plano: string;
  status: string;
  valor: number;
  dataInicio: string;
  gritosTotal: number;
  diasConsecutivos: number;
  ultimoCheckin: string | null;
  ativo: boolean;
}

// Interface para filtros de pesquisa no dashboard
export interface DonorSearchFilters {
  searchTerm?: string;
  planoFilter?: string;
  statusFilter?: string;
  nivelFilter?: number;
  dataInicioFrom?: string;
  dataInicioTo?: string;
  ativoOnly?: boolean;
}

// ================ SISTEMA DE INGRESSOS DIGITAIS ================

// ================ SISTEMA DE COTAS PARA EMPRESAS ================
// Tabela de cotas de empresas para o evento
export const cotasEmpresas = pgTable("cotas_empresas", {
  id: serial("id").primaryKey(),
  nomeEmpresa: text("nome_empresa").notNull().unique(), // Nome da empresa (único)
  email: text("email").notNull(), // E-mail da empresa para validação
  quantidadeTotal: integer("quantidade_total").notNull(), // Total de ingressos da cota
  quantidadeUsada: integer("quantidade_usada").notNull().default(0), // Quantos já foram resgatados
  status: text("status").notNull().default("ativa"), // ativa, inativa, esgotada
  criadoEm: timestamp("criado_em").defaultNow().notNull(),
  atualizadoEm: timestamp("atualizado_em").defaultNow().notNull(),
});

// Tipos para cotas de empresas
export type CotaEmpresa = typeof cotasEmpresas.$inferSelect;
export type InsertCotaEmpresa = typeof cotasEmpresas.$inferInsert;
export const insertCotaEmpresaSchema = createInsertSchema(cotasEmpresas).omit({
  id: true,
  quantidadeUsada: true,
  criadoEm: true,
  atualizadoEm: true,
});

// Tabela de ingressos para eventos
export const ingressos = pgTable("ingressos", {
  id: serial("id").primaryKey(),
  numero: text("numero").notNull().unique(), // 001, 002, 003... (formato sequencial)
  userId: integer("userId").references(() => users.id), // Pode ser null para compras sem cadastro
  nomeComprador: text("nomeComprador"), // Nome de quem comprou (pode ser null para cotas empresariais)
  telefoneComprador: text("telefoneComprador"), // Telefone de quem comprou
  emailComprador: text("emailComprador"), // Email de quem comprou
  
  // NOVO: Vinculação com cota de empresa (null para ingressos avulsos)
  idCotaEmpresa: integer("id_cota_empresa").references(() => cotasEmpresas.id),
  
  // Dados do evento (fixos para "IV ENCONTRO Do Grito")
  eventoNome: text("eventoNome").notNull().default("IV ENCONTRO Do Grito"),
  eventoData: text("eventoData").notNull().default("23 Outubro de 2025"),
  eventoHora: text("eventoHora").notNull().default("19h30"),
  eventoLocal: text("eventoLocal").notNull().default("R. Kennedy, 47 - Jardim Canada, Nova Lima - MG, 34007-644"),
  
  // Dados de pagamento (stripeCheckoutSessionId é null para ingressos resgatados via cota)
  stripeCheckoutSessionId: text("stripeCheckoutSessionId").unique(),
  valorPago: integer("valorPago").notNull(), // Valor em centavos (1990 = R$ 19,90)
  
  // Campos para múltiplos gateways de pagamento (stripe, rede, pix, cota_empresa)
  gateway: text("gateway").default("stripe"),
  installments: integer("installments").default(1),
  gatewayTransactionId: text("gateway_transaction_id"),
  gatewayOrderId: text("gateway_order_id"),
  txid: text("txid").unique(), // Identificador único PIX (opcional, null para outros gateways)
  
  // Dados de reembolso (removido temporariamente - colunas não existem no banco)
  // refunded: boolean("refunded").default(false),
  // refundedAt: timestamp("refunded_at"),
  // refundAmount: integer("refund_amount"), // Valor reembolsado em centavos
  // refundReason: text("refund_reason"), // Motivo do reembolso
  
  // Status e controle
  status: text("status").notNull().default("ativo"), // ativo, usado, cancelado, pending, paid
  dataCompra: timestamp("dataCompra").defaultNow().notNull(),
  dataUso: timestamp("dataUso"), // Quando o ingresso foi usado/validado
  
  // Metadados
  criadoEm: timestamp("criadoEm").defaultNow().notNull(),
});

// Tipos para ingressos
export type Ingresso = typeof ingressos.$inferSelect;
export type InsertIngresso = typeof ingressos.$inferInsert;
export const insertIngressoSchema = createInsertSchema(ingressos).omit({
  id: true,
  numero: true, // Será gerado automaticamente
  criadoEm: true,
  dataCompra: true,
});

// ================ SISTEMA DE INTEGRAÇÃO PAGBANK CONNECT (OAuth2) ================

// Tabela para armazenar tokens OAuth2 do PagBank Connect
// Necessário para processar pagamentos via API do PagBank
export const pagbankOauthTokens = pgTable("pagbank_oauth_tokens", {
  id: serial("id").primaryKey(),
  
  // Tokens OAuth2
  accessToken: text("access_token").notNull(), // Token de acesso para fazer chamadas à API
  refreshToken: text("refresh_token"), // Token para renovar o access_token quando expirar
  tokenType: text("token_type").notNull().default("Bearer"), // Tipo do token (geralmente "Bearer")
  
  // Expiração e validade
  expiresIn: integer("expires_in"), // Tempo de vida do token em segundos (ex: 3600 = 1 hora)
  expiresAt: timestamp("expires_at"), // Data/hora de expiração calculada
  
  // Permissões concedidas
  scope: text("scope"), // Escopos autorizados (ex: "payments.create payments.read")
  
  // Informações da autorização
  authorizationCode: text("authorization_code"), // Código de autorização usado para obter o token
  environment: text("environment").notNull().default("sandbox"), // sandbox ou production
  
  // Status e controle
  status: text("status").notNull().default("active"), // active, expired, revoked
  isActive: boolean("is_active").notNull().default(true), // Se é o token ativo no momento
  
  // Metadados
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  lastUsedAt: timestamp("last_used_at"), // Última vez que o token foi usado
});

// Tipos para PagBank OAuth tokens
export type PagBankOAuthToken = typeof pagbankOauthTokens.$inferSelect;
export type InsertPagBankOAuthToken = typeof pagbankOauthTokens.$inferInsert;
export const insertPagBankOAuthTokenSchema = createInsertSchema(pagbankOauthTokens).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// ================ SISTEMA DE RASTREAMENTO DE ATIVIDADE ================

// Tabela para eventos de atividade do usuário para recomendações personalizadas
export const activityEvents = pgTable("activity_events", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  eventType: text("event_type").notNull(), // 'view', 'click', 'duration', 'complete', 'share', 'like', 'comment'
  entityType: text("entity_type").notNull(), // 'noticia', 'historia', 'beneficio', 'missao', 'leilao'
  entityId: text("entity_id").notNull(), // ID da entidade (pode ser string)
  entityTitle: text("entity_title"), // Título/nome da entidade para facilitar análise
  entityCategory: text("entity_category"), // Categoria da entidade (financeiro, educacional, etc)
  entityTags: text("entity_tags").array().default([]), // Tags da entidade para recomendações
  duration: integer("duration"), // Tempo em segundos (para eventos de duração)
  metadata: json("metadata"), // Dados adicionais do evento (posição, contexto, etc)
  sessionId: text("session_id"), // ID da sessão para análise de jornada
  userAgent: text("user_agent"), // Para análise de dispositivo
  ip: text("ip"), // Para análise geográfica se necessário
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Tabela para interesses inferidos do usuário
export const userInterests = pgTable("user_interests", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  category: text("category").notNull(), // Categoria principal (financeiro, educacional, saude, lazer, etc)
  tag: text("tag").notNull(), // Tag específica (investimento, curso, academia, etc)
  score: decimal("score", { precision: 10, scale: 4 }).notNull().default("0"), // Score de interesse (0-1)
  lastInteraction: timestamp("last_interaction").defaultNow().notNull(),
  interactionCount: integer("interaction_count").default(1).notNull(), // Número de interações
  decayFactor: decimal("decay_factor", { precision: 4, scale: 3 }).default("0.95"), // Fator de decaimento temporal
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  uniqueUserCategoryTag: unique("unique_user_category_tag").on(table.userId, table.category, table.tag),
}));

// Schemas de inserção para atividades
export const insertActivityEventSchema = createInsertSchema(activityEvents).omit({
  id: true,
  createdAt: true,
});

export const insertUserInterestSchema = createInsertSchema(userInterests).omit({
  id: true,
  updatedAt: true,
});

// Tipos para atividades
export type ActivityEvent = typeof activityEvents.$inferSelect;
export type InsertActivityEvent = z.infer<typeof insertActivityEventSchema>;

export type UserInterest = typeof userInterests.$inferSelect;
export type InsertUserInterest = z.infer<typeof insertUserInterestSchema>;

// Enum para tipos de evento
export const ActivityEventType = {
  VIEW: 'view',
  CLICK: 'click', 
  DURATION: 'duration',
  COMPLETE: 'complete',
  SHARE: 'share',
  LIKE: 'like',
  COMMENT: 'comment',
  START: 'start',
  PAUSE: 'pause',
  RESUME: 'resume',
  EXIT: 'exit'
} as const;

export type ActivityEventTypeEnum = typeof ActivityEventType[keyof typeof ActivityEventType];

// Enum para tipos de entidade
export const EntityType = {
  NOTICIA: 'noticia',
  HISTORIA: 'historia', 
  BENEFICIO: 'beneficio',
  MISSAO: 'missao',
  LEILAO: 'leilao',
  PREMIO: 'premio',
  PAGE: 'page'
} as const;

export type EntityTypeEnum = typeof EntityType[keyof typeof EntityType];

// Interface para recomendações
export interface RecommendationItem {
  entityType: EntityTypeEnum;
  entityId: string;
  title: string;
  category?: string;
  tags: string[];
  score: number;
  reason: string; // Por que foi recomendado
  metadata?: Record<string, any>;
}

export interface RecommendationResponse {
  recommendations: RecommendationItem[];
  userProfile: {
    topCategories: Array<{ category: string; score: number }>;
    topTags: Array<{ tag: string; score: number }>;
    totalInteractions: number;
    lastActivity: string | null;
  };
  debug?: {
    algorithm: string;
    totalCandidates: number;
    filters: string[];
    scoringFactors: Record<string, number>;
  };
}

// ================ TABELA DE CÓDIGOS DE VERIFICAÇÃO SMS ================
export const verificationCodes = pgTable("verification_codes", {
  id: serial("id").primaryKey(),
  telefone: text("telefone").notNull(),
  code: text("code").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  used: boolean("used").default(false).notNull()
});

// Schemas para validação
export const insertVerificationCodeSchema = createInsertSchema(verificationCodes).omit({
  id: true,
  createdAt: true
});

export type VerificationCode = typeof verificationCodes.$inferSelect;
export type InsertVerificationCode = z.infer<typeof insertVerificationCodeSchema>;

// ================ MÓDULO PEC: SISTEMA DE PROJETOS EDUCACIONAIS ================

// Enums para o sistema PEC
export const activityStatus = pgEnum("activity_status", ["ativa", "inativa"]);
export const activitySituation = pgEnum("activity_situation", ["execucao", "planejamento", "encerrada"]);
export const periodOfDay = pgEnum("period_of_day", ["matutino", "vespertino", "noturno"]);
export const sessionStatus = pgEnum("session_status", ["realizado", "cancelado", "reagendado"]);
export const controlModeEnum = pgEnum("control_mode", ["manual", "intelbras"]);
export const attendanceStatusEnum = pgEnum("attendance_status", ["presente", "ausente", "falta_justificada", "atraso"]);

// Tabela de projetos (ex.: Casa Sonhar Patrimar 2025)
export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),                    // Casa Sonhar Patrimar 2025
  description: text("description"),
  category: varchar("category", { length: 120 }),                      // SCFV
  who_can_participate: text("who_can_participate"),                     // Qualquer atendido
  period_start: date("period_start"),
  period_end: date("period_end"),
  status: varchar("status", { length: 20 }).default("ativo"),          // ativo, inativo
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow()
});

// Tabela de atividades (ex.: Contraturno, Dança, Circo, etc.)
export const pecActivities = pgTable("pec_activities", {
  id: serial("id").primaryKey(),
  project_id: integer("project_id").references(() => projects.id).notNull(),
  name: varchar("name", { length: 160 }).notNull(),                    // Contraturno, Dança, Circo...
  description: text("description"),
  control_presence: boolean("control_presence").default(true),
  status: activityStatus("status").default("ativa"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow()
});

// Tabela de instâncias de atividades (turmas específicas)
export const activityInstances = pgTable("activity_instances", {
  id: serial("id").primaryKey(),
  activity_id: integer("activity_id").references(() => pecActivities.id).notNull(),
  title: varchar("title", { length: 220 }).notNull(),                  // Contraturno Manhã M1 2025 | 6–8 anos
  code: varchar("code", { length: 40 }),                               // M1, T2, etc (opcional)
  location: varchar("location", { length: 160 }),                      // Casa Sonhar Patrimar
  situation: activitySituation("situation").default("execucao"),
  period_label: periodOfDay("period_label"),                           // Matutino
  start_time: time("start_time"),                                       // Horário de início (ex: 08:00)
  end_time: time("end_time"),                                          // Horário de fim (ex: 10:00)
  age_min: integer("age_min"),
  age_max: integer("age_max"),
  occurrence_start: date("occurrence_start"),
  occurrence_end: date("occurrence_end"),
  expected_total_hours: decimal("expected_total_hours", { precision: 6, scale: 2 }),
  notes: text("notes"),
  control_mode: controlModeEnum("control_mode").default("manual"),
  intelbras_group_id: varchar("intelbras_group_id", {length: 120}),    // ID da turma no Intelbras
  dias_semana: text("dias_semana").array(),                             // Ex: ["Segunda", "Quarta", "Sexta"]
  created_on: date("created_on"),                                      // "Criado em" (12/12/2024)
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow()
});

// Tabela de atribuições de equipe (monitores, coordenadores, educadores)
export const staffAssignments = pgTable("staff_assignments", {
  id: serial("id").primaryKey(),
  activity_instance_id: integer("activity_instance_id").references(() => activityInstances.id).notNull(),
  person_id: integer("person_id").references(() => users.id).notNull(), // Referencia tabela users existente
  role: varchar("role", { length: 60 }).notNull()                       // "Monitor PEC", "Coordenadora PEC", "Educador"
});

// Tabela de inscrições (lista de inscritos na turma)
export const enrollments = pgTable("enrollments", {
  id: serial("id").primaryKey(),
  activity_instance_id: integer("activity_instance_id").references(() => activityInstances.id).notNull(),
  person_id: integer("person_id").references(() => users.id).notNull(), // Referencia tabela users existente
  gender: varchar("gender", { length: 20 }),
  birthdate: date("birthdate"),
  enrollment_date: date("enrollment_date").defaultNow(),
  active: boolean("active").default(true)
});

// Tabela simplificada para vincular alunos (por CPF) a turmas PEC (activityInstances)
export const instanceEnrollments = pgTable("instance_enrollments", {
  id: serial("id").primaryKey(),
  activity_instance_id: integer("activity_instance_id").references(() => activityInstances.id).notNull(),
  // CPF do atendido (mestre). FK legada para aluno.cpf removida — aponta a atendidos_grito via migração.
  student_cpf: text("student_cpf").notNull(),
  enrollment_date: date("enrollment_date").defaultNow(),
  active: boolean("active").default(true),
  evadido: boolean("evadido").default(false),
  motivo_evasao: text("motivo_evasao"),
  data_evasao: timestamp("data_evasao"),
  /** ativo | concluido (formado na turma) | reprovado (turma finalizada sem formação) */
  status: text("status").default("ativo"),
});

// Tabela de sessões (cada encontro do diário)
export const sessions = pgTable("sessions", {
  id: serial("id").primaryKey(),
  activity_instance_id: integer("activity_instance_id").references(() => activityInstances.id).notNull(),
  date: date("date").notNull(),
  hours: decimal("hours", { precision: 4, scale: 2 }).notNull(),        // Carga horária (ex.: 3.00)
  title: varchar("title", { length: 200 }),                            // "Aula de circo..." (opcional)
  description: text("description"),                                     // Descrição do dia
  observations: text("observations"),
  status: sessionStatus("status").default("realizado"),
  location: varchar("location", { length: 160 }),
  educator_names: text("educator_names"),
  attendance: jsonb("attendance"),
  fotoComprovante: text("foto_comprovante"),
  createdAt: timestamp("created_at").defaultNow(),
  teveAlimentacao: boolean("teve_alimentacao"),
});

// Tabela de presença (presença por aluno por sessão) - Sistema avançado
export const attendance = pgTable("attendance", {
  id: serial("id").primaryKey(),
  session_id: integer("session_id").references(() => sessions.id).notNull(),
  student_id: integer("student_id").references(() => enrollments.id).notNull(), // Referencia o aluno (enrollment)
  status: attendanceStatusEnum("status").notNull().default('ausente'),
  entry_time: time("entry_time"), // Horário de entrada (para Intelbras)
  exit_time: time("exit_time"), // Horário de saída (para Intelbras)
  total_hours: numeric("total_hours", { precision: 4, scale: 2 }), // Horas calculadas automaticamente
  observations: text("observations"), // Observações do educador
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow()
}, (table) => ({
  // Constraint único para evitar duplicatas por sessão/aluno
  sessionStudentUnique: unique("attendance_session_student_unique").on(table.session_id, table.student_id)
}));

// Tabela de fotos (galeria da turma e/ou sessão)
export const photos = pgTable("photos", {
  id: serial("id").primaryKey(),
  activity_instance_id: integer("activity_instance_id").references(() => activityInstances.id).notNull(),
  session_id: integer("session_id").references(() => sessions.id),
  filename: varchar("filename", { length: 255 }).notNull(),
  original_filename: varchar("original_filename", { length: 255 }).notNull(),
  file_size: integer("file_size").notNull(),
  mime_type: varchar("mime_type", { length: 100 }).notNull(),
  upload_date: timestamp("upload_date").defaultNow(),
  description: text("description"),
  uploaded_by: integer("uploaded_by").references(() => users.id).notNull(),
});

// Tabela de avaliações físicas (testes físicos dos alunos)
export const physicalAssessments = pgTable("physical_assessments", {
  id: serial("id").primaryKey(),
  student_id: integer("student_id").references(() => users.id).notNull(),
  evaluator_id: integer("evaluator_id").references(() => users.id).notNull(),
  activity_instance_id: integer("activity_instance_id").references(() => activityInstances.id),
  test_type: varchar("test_type", { length: 100 }).notNull(), // Tipo de teste: força, resistência, flexibilidade, etc.
  test_date: date("test_date").notNull(),
  
  // Métricas físicas (todas opcionais, dependem do tipo de teste)
  weight_kg: numeric("weight_kg", { precision: 5, scale: 2 }), // Peso em kg
  height_cm: numeric("height_cm", { precision: 5, scale: 2 }), // Altura em cm
  bmi: numeric("bmi", { precision: 5, scale: 2 }), // IMC calculado
  
  // Testes de força
  push_ups: integer("push_ups"), // Flexões
  sit_ups: integer("sit_ups"), // Abdominais
  pull_ups: integer("pull_ups"), // Barras
  
  // Testes de resistência
  run_distance_meters: integer("run_distance_meters"), // Distância corrida em metros
  run_time_seconds: integer("run_time_seconds"), // Tempo de corrida em segundos
  
  // Testes de flexibilidade
  sit_and_reach_cm: numeric("sit_and_reach_cm", { precision: 5, scale: 2 }), // Sentar e alcançar em cm
  
  // Testes de agilidade
  shuttle_run_seconds: numeric("shuttle_run_seconds", { precision: 5, scale: 2 }), // Teste de agilidade
  
  // Testes de salto
  vertical_jump_cm: numeric("vertical_jump_cm", { precision: 5, scale: 2 }), // Salto vertical
  horizontal_jump_cm: numeric("horizontal_jump_cm", { precision: 5, scale: 2 }), // Salto horizontal
  
  // Observações e notas
  observations: text("observations"),
  overall_score: numeric("overall_score", { precision: 5, scale: 2 }), // Nota geral (0-100)
  level: varchar("level", { length: 50 }), // Nível: iniciante, intermediário, avançado
  
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow()
});

// ================ TIPOS TYPESCRIPT PARA PEC ================

// Tipos para seleção de dados
export type Project = typeof projects.$inferSelect;
export type Activity = typeof pecActivities.$inferSelect;
export type ActivityInstance = typeof activityInstances.$inferSelect;
export type StaffAssignment = typeof staffAssignments.$inferSelect;
export type Enrollment = typeof enrollments.$inferSelect;
export type Session = typeof sessions.$inferSelect;
export type Attendance = typeof attendance.$inferSelect;
export type Photo = typeof photos.$inferSelect;
export type PhysicalAssessment = typeof physicalAssessments.$inferSelect;

// Tipos para inserção de dados
export type InsertProject = typeof projects.$inferInsert;
export type InsertActivity = typeof pecActivities.$inferInsert;
export type InsertActivityInstance = typeof activityInstances.$inferInsert;
export type InsertStaffAssignment = typeof staffAssignments.$inferInsert;
export type InsertEnrollment = typeof enrollments.$inferInsert;
export type InsertSession = typeof sessions.$inferInsert;
export type InsertAttendance = typeof attendance.$inferInsert;
export type InsertPhoto = typeof photos.$inferInsert;
export type InsertPhysicalAssessment = typeof physicalAssessments.$inferInsert;

// Schemas Zod para validação
export const insertProjectSchema = createInsertSchema(projects)
  .omit({ id: true, created_at: true, updated_at: true })
  .extend({
    period_start: z.coerce.date().nullable().optional(),
    period_end: z.coerce.date().nullable().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.period_end != null) {
      if (data.period_start == null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['period_start'],
          message: 'Data de início é obrigatória quando data de término é informada.',
        });
      } else if (data.period_end < data.period_start) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['period_end'],
          message: 'Data de término deve ser igual ou posterior à data de início.',
        });
      }
    }
  });
export const insertActivitySchema = createInsertSchema(pecActivities).omit({ id: true, created_at: true, updated_at: true });
export const insertActivityInstanceSchema = createInsertSchema(activityInstances).omit({ id: true, created_at: true, updated_at: true });
export const insertStaffAssignmentSchema = createInsertSchema(staffAssignments).omit({ id: true });
export const insertEnrollmentSchema = createInsertSchema(enrollments).omit({ id: true });
export const insertSessionSchema = createInsertSchema(sessions).omit({ id: true });
export const insertAttendanceSchema = createInsertSchema(attendance).omit({ id: true });
export const insertPhotoSchema = createInsertSchema(photos).omit({ id: true });
export const insertPhysicalAssessmentSchema = createInsertSchema(physicalAssessments).omit({ id: true, created_at: true, updated_at: true });

// ================ SISTEMA DE EDUCADORES ================

// Tabela de educadores
export const educadores = pgTable("educadores", {
  id: serial("id").primaryKey(),
  cpf: varchar("cpf", { length: 14 }).unique().notNull(),
  nome_completo: varchar("nome_completo", { length: 150 }).notNull(),
  telefone: varchar("telefone", { length: 20 }).notNull(),
  email: varchar("email", { length: 100 }),
  data_nascimento: date("data_nascimento"),
  genero: varchar("genero", { length: 20 }),
  endereco: varchar("endereco", { length: 255 }),
  cidade: varchar("cidade", { length: 100 }),
  estado: varchar("estado", { length: 2 }),
  cep: varchar("cep", { length: 9 }),
  
  // Dados profissionais
  formacao: varchar("formacao", { length: 200 }),
  especialidades: text("especialidades").array(),
  experiencia_anos: integer("experiencia_anos"),
  registro_profissional: varchar("registro_profissional", { length: 50 }),
  
  // Documentos e fotos
  foto_perfil: varchar("foto_perfil", { length: 255 }),
  upload_documentos: text("upload_documentos").array(),
  
  // Disponibilidade
  disponibilidade_horarios: text("disponibilidade_horarios"), // JSON com horários disponíveis
  observacoes: text("observacoes"),
  
  // Status
  status: varchar("status", { length: 20 }).default("ativo"), // ativo, inativo, afastado
  
  // Auditoria
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
  created_by: integer("created_by").references(() => users.id)
});

// Tabela de vínculos educador-programa
export const educadorPrograma = pgTable("educador_programa", {
  id: serial("id").primaryKey(),
  educador_id: integer("educador_id").references(() => educadores.id).notNull(),
  programa: varchar("programa", { length: 50 }).notNull(), // 'pec', 'casa_sonhar', 'polo_esportivo', etc
  cargo: varchar("cargo", { length: 100 }), // 'Educador Social', 'Coordenador', 'Monitor', etc
  data_inicio: date("data_inicio").defaultNow(),
  data_fim: date("data_fim"),
  status: varchar("status", { length: 20 }).default("ativo"), // ativo, inativo, transferido
  observacoes: text("observacoes"),
  created_at: timestamp("created_at").defaultNow()
});

// Tabela de vínculos aluno-programa (para os alunos existentes)
export const alunoPrograma = pgTable("aluno_programa", {
  id: serial("id").primaryKey(),
  aluno_cpf: varchar("aluno_cpf", { length: 14 }).references(() => aluno.cpf).notNull(),
  programa: varchar("programa", { length: 50 }).notNull(), // 'pec', 'casa_sonhar', 'polo_esportivo', etc
  data_inicio: date("data_inicio").defaultNow(),
  data_fim: date("data_fim"),
  status: varchar("status", { length: 20 }).default("ativo"), // ativo, inativo, transferido, concluido
  observacoes: text("observacoes"),
  created_at: timestamp("created_at").defaultNow()
});

// ================ TIPOS TYPESCRIPT PARA EDUCADORES ================

// Tipos para seleção de dados
export type Educador = typeof educadores.$inferSelect;
export type EducadorPrograma = typeof educadorPrograma.$inferSelect;
export type AlunoPrograma = typeof alunoPrograma.$inferSelect;

// Tipos para inserção de dados
export type InsertEducador = typeof educadores.$inferInsert;
export type InsertEducadorPrograma = typeof educadorPrograma.$inferInsert;
export type InsertAlunoPrograma = typeof alunoPrograma.$inferInsert;

// Schemas Zod para validação
export const insertEducadorSchema = createInsertSchema(educadores).omit({ 
  id: true, 
  created_at: true, 
  updated_at: true 
});

export const insertEducadorProgramaSchema = createInsertSchema(educadorPrograma).omit({ 
  id: true, 
  created_at: true 
});

export const insertAlunoProgramaSchema = createInsertSchema(alunoPrograma).omit({ 
  id: true, 
  created_at: true 
});

// ================ MÓDULO GESTÃO À VISTA: META × REALIZADO ================

// Enum para escopos
export const gvScopeEnum = pgEnum('gv_scope', ['monthly', 'quarterly', 'semiannual', 'annual']);

// Enum para tipos de perfil
export const gvProfileTypeEnum = pgEnum('gv_profile_type', ['admin', 'gestor_setor', 'gestor_projeto']);

// 1. Tabela gv_sectors (Programas)
export const gvSectors = pgTable("gv_sectors", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  active: boolean("active").default(true),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// 2. Tabela gv_projects (Projetos)
export const gvProjects = pgTable("gv_projects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  sector_id: integer("sector_id").references(() => gvSectors.id).notNull(),
  active: boolean("active").default(true),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// 3. Tabela gv_mgmt_indicators (Catálogo de Indicadores)
export const gvMgmtIndicators = pgTable("gv_mgmt_indicators", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  unit: text("unit"), // %, R$, unidade, pessoas, etc.
  calculation_method: text("calculation_method"),
  data_source: text("data_source"),
  update_frequency: text("update_frequency"), // diário, semanal, mensal, etc.
  active: boolean("active").default(true),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// 4. Tabela gv_indicator_assignments (Vinculação Indicadores-Projetos)
export const gvIndicatorAssignments = pgTable("gv_indicator_assignments", {
  id: serial("id").primaryKey(),
  indicator_id: integer("indicator_id").references(() => gvMgmtIndicators.id).notNull(),
  project_id: integer("project_id").references(() => gvProjects.id).notNull(),
  is_primary: boolean("is_primary").default(false), // indicador principal do projeto
  weight: decimal("weight", { precision: 5, scale: 2 }).default('1.0'), // peso para cálculo
  active: boolean("active").default(true),
  created_at: timestamp("created_at").defaultNow(),
}, (table) => ({
  unique_indicator_project: unique().on(table.indicator_id, table.project_id),
}));

// 5. Tabela gv_indicator_targets (Metas)
export const gvIndicatorTargets = pgTable("gv_indicator_targets", {
  id: serial("id").primaryKey(),
  assignment_id: integer("assignment_id").references(() => gvIndicatorAssignments.id).notNull(),
  scope: gvScopeEnum("scope").notNull(),
  period: text("period").notNull(), // 2025-09, 2025-Q3, 2025-S1, 2025
  target_value: decimal("target_value", { precision: 15, scale: 4 }).notNull(),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
}, (table) => ({
  unique_assignment_scope_period: unique().on(table.assignment_id, table.scope, table.period),
}));

// 6. Tabela gv_indicator_values (Valores Realizados)
export const gvIndicatorValues = pgTable("gv_indicator_values", {
  id: serial("id").primaryKey(),
  assignment_id: integer("assignment_id").references(() => gvIndicatorAssignments.id).notNull(),
  scope: gvScopeEnum("scope").notNull(),
  period: text("period").notNull(),
  actual_value: decimal("actual_value", { precision: 15, scale: 4 }).notNull(),
  data_source: text("data_source"), // origem do dado
  inserted_by: integer("inserted_by").references(() => users.id),
  inserted_at: timestamp("inserted_at").defaultNow(),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
}, (table) => ({
  unique_assignment_scope_period: unique().on(table.assignment_id, table.scope, table.period),
}));

// 7. Tabela gv_target_allocations (Rateio de Metas)
export const gvTargetAllocations = pgTable("gv_target_allocations", {
  id: serial("id").primaryKey(),
  parent_target_id: integer("parent_target_id").references(() => gvIndicatorTargets.id).notNull(),
  child_assignment_id: integer("child_assignment_id").references(() => gvIndicatorAssignments.id).notNull(),
  allocation_percentage: decimal("allocation_percentage", { precision: 5, scale: 2 }).notNull(),
  allocated_value: decimal("allocated_value", { precision: 15, scale: 4 }).notNull(),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
}, (table) => ({
  unique_parent_child: unique().on(table.parent_target_id, table.child_assignment_id),
}));

// 8. Tabela gv_user_access_control (Controle de Acesso)
export const gvUserAccessControl = pgTable("gv_user_access_control", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").references(() => users.id).notNull(),
  profile_type: gvProfileTypeEnum("profile_type").notNull(),
  sector_id: integer("sector_id").references(() => gvSectors.id), // NULL = acesso a todos
  project_id: integer("project_id").references(() => gvProjects.id), // NULL = acesso a todos do setor
  granted_by: integer("granted_by").references(() => users.id),
  granted_at: timestamp("granted_at").defaultNow(),
  active: boolean("active").default(true),
}, (table) => ({
  unique_user_profile_sector_project: unique().on(table.user_id, table.profile_type, table.sector_id, table.project_id),
}));

// 9. Tabela gv_monthly_data (Dados Mensais Reais do Excel 2025)
export const gvMonthlyData = pgTable("gv_monthly_data", {
  id: serial("id").primaryKey(),
  assignment_id: integer("assignment_id").references(() => gvIndicatorAssignments.id).notNull(),
  year: integer("year").notNull(), // 2025
  month: integer("month").notNull(), // 1-12 (Janeiro=1, Dezembro=12)
  month_name: text("month_name").notNull(), // Janeiro, Fevereiro, etc.
  target_value: text("target_value"), // Meta (pode ser texto como "< 10 ALUNOS")
  actual_value: text("actual_value"), // Realizado (pode ser texto como "Não se aplica")
  recurrence: text("recurrence"), // Mensal, Semestral, Trimestral
  quarterly_avg: decimal("quarterly_avg", { precision: 15, scale: 4 }), // Média trimestral
  semester_avg: decimal("semester_avg", { precision: 15, scale: 4 }), // Média semestral  
  annual_value: decimal("annual_value", { precision: 15, scale: 4 }), // Valor anual
  data_source: text("data_source").default('Excel 2025'),
  imported_at: timestamp("imported_at").defaultNow(),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
}, (table) => ({
  unique_assignment_year_month: unique().on(table.assignment_id, table.year, table.month),
}));

// 10. Tabela gv_excel_metadata (Metadados dos dados do Excel)
export const gvExcelMetadata = pgTable("gv_excel_metadata", {
  id: serial("id").primaryKey(),
  assignment_id: integer("assignment_id").references(() => gvIndicatorAssignments.id).notNull(),
  programa_excel: text("programa_excel").notNull(), // Nome do programa no Excel
  projeto_excel: text("projeto_excel").notNull(), // Nome do projeto no Excel
  indicador_excel: text("indicador_excel").notNull(), // Nome do indicador no Excel
  meta_excel: text("meta_excel"), // Meta original do Excel
  recorrencia_excel: text("recorrencia_excel"), // Recorrência original do Excel
  created_at: timestamp("created_at").defaultNow(),
}, (table) => ({
  unique_assignment: unique().on(table.assignment_id),
}));

// ================ RELATIONS ================

export const gvSectorsRelations = relations(gvSectors, ({ many }) => ({
  projects: many(gvProjects),
}));

export const gvProjectsRelations = relations(gvProjects, ({ one, many }) => ({
  sector: one(gvSectors, {
    fields: [gvProjects.sector_id],
    references: [gvSectors.id],
  }),
  assignments: many(gvIndicatorAssignments),
}));

export const gvMgmtIndicatorsRelations = relations(gvMgmtIndicators, ({ many }) => ({
  assignments: many(gvIndicatorAssignments),
}));

export const gvIndicatorAssignmentsRelations = relations(gvIndicatorAssignments, ({ one, many }) => ({
  indicator: one(gvMgmtIndicators, {
    fields: [gvIndicatorAssignments.indicator_id],
    references: [gvMgmtIndicators.id],
  }),
  project: one(gvProjects, {
    fields: [gvIndicatorAssignments.project_id],
    references: [gvProjects.id],
  }),
  targets: many(gvIndicatorTargets),
  values: many(gvIndicatorValues),
  childAllocations: many(gvTargetAllocations),
}));

export const gvIndicatorTargetsRelations = relations(gvIndicatorTargets, ({ one, many }) => ({
  assignment: one(gvIndicatorAssignments, {
    fields: [gvIndicatorTargets.assignment_id],
    references: [gvIndicatorAssignments.id],
  }),
  allocations: many(gvTargetAllocations),
}));

export const gvIndicatorValuesRelations = relations(gvIndicatorValues, ({ one }) => ({
  assignment: one(gvIndicatorAssignments, {
    fields: [gvIndicatorValues.assignment_id],
    references: [gvIndicatorAssignments.id],
  }),
  user: one(users, {
    fields: [gvIndicatorValues.inserted_by],
    references: [users.id],
  }),
}));

export const gvTargetAllocationsRelations = relations(gvTargetAllocations, ({ one }) => ({
  parentTarget: one(gvIndicatorTargets, {
    fields: [gvTargetAllocations.parent_target_id],
    references: [gvIndicatorTargets.id],
  }),
  childAssignment: one(gvIndicatorAssignments, {
    fields: [gvTargetAllocations.child_assignment_id],
    references: [gvIndicatorAssignments.id],
  }),
}));

export const gvUserAccessControlRelations = relations(gvUserAccessControl, ({ one }) => ({
  user: one(users, {
    fields: [gvUserAccessControl.user_id],
    references: [users.id],
  }),
  sector: one(gvSectors, {
    fields: [gvUserAccessControl.sector_id],
    references: [gvSectors.id],
  }),
  project: one(gvProjects, {
    fields: [gvUserAccessControl.project_id],
    references: [gvProjects.id],
  }),
  grantedBy: one(users, {
    fields: [gvUserAccessControl.granted_by],
    references: [users.id],
  }),
}));

// ================ TIPOS TYPESCRIPT ================

export type GVSector = typeof gvSectors.$inferSelect;
export type GVProject = typeof gvProjects.$inferSelect;
export type GVMgmtIndicator = typeof gvMgmtIndicators.$inferSelect;
export type GVIndicatorAssignment = typeof gvIndicatorAssignments.$inferSelect;
export type GVIndicatorTarget = typeof gvIndicatorTargets.$inferSelect;
export type GVIndicatorValue = typeof gvIndicatorValues.$inferSelect;
export type GVTargetAllocation = typeof gvTargetAllocations.$inferSelect;
export type GVUserAccessControl = typeof gvUserAccessControl.$inferSelect;

export type InsertGVSector = typeof gvSectors.$inferInsert;
export type InsertGVProject = typeof gvProjects.$inferInsert;
export type InsertGVMgmtIndicator = typeof gvMgmtIndicators.$inferInsert;
export type InsertGVIndicatorAssignment = typeof gvIndicatorAssignments.$inferInsert;
export type InsertGVIndicatorTarget = typeof gvIndicatorTargets.$inferInsert;
export type InsertGVIndicatorValue = typeof gvIndicatorValues.$inferInsert;
export type InsertGVTargetAllocation = typeof gvTargetAllocations.$inferInsert;
export type InsertGVUserAccessControl = typeof gvUserAccessControl.$inferInsert;

// ================ SCHEMAS ZOD ================

export const insertGVSectorSchema = createInsertSchema(gvSectors).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const insertGVProjectSchema = createInsertSchema(gvProjects).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const insertGVMgmtIndicatorSchema = createInsertSchema(gvMgmtIndicators).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const insertGVIndicatorAssignmentSchema = createInsertSchema(gvIndicatorAssignments).omit({
  id: true,
  created_at: true,
});

export const insertGVIndicatorTargetSchema = createInsertSchema(gvIndicatorTargets).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const insertGVIndicatorValueSchema = createInsertSchema(gvIndicatorValues).omit({
  id: true,
  inserted_at: true,
  created_at: true,
  updated_at: true,
});

export const insertGVTargetAllocationSchema = createInsertSchema(gvTargetAllocations).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const insertGVUserAccessControlSchema = createInsertSchema(gvUserAccessControl).omit({
  id: true,
  granted_at: true,
});

// ================ INTERFACES PARA API ================

export interface GVDashboardCard {
  id: number;
  indicator_name: string;
  project_name: string;
  sector_name: string;
  target_value: number;
  actual_value: number;
  achievement_percentage: number;
  status: 'green' | 'yellow' | 'red';
  unit: string;
  period: string;
}

export interface GVMetaRealizadoRow {
  sector_name: string;
  project_name: string;
  indicator_name: string;
  target_value: number;
  actual_value: number;
  achievement_percentage: number;
  status: 'green' | 'yellow' | 'red';
  unit: string;
  period: string;
}

export interface GVHistoricalData {
  period: string;
  target_value: number;
  actual_value: number;
  achievement_percentage: number;
}

export interface GVDashboardFilters {
  scope: 'monthly' | 'quarterly' | 'semiannual' | 'annual';
  period: string;
  sector_id?: number;
  project_id?: number;
}

// ================ MÓDULO EVENTOS E WEBHOOKS ================

// Tabela de eventos do sistema
export const gritoEvents = pgTable("grito_events", {
  id: serial("id").primaryKey(),
  eventName: text("event_name").notNull(), // user.signed_up, donation.created, etc
  userId: integer("user_id").notNull(),
  source: text("source").notNull(), // web, mobile, admin, stripe, etc
  payload: json("payload").$type<Record<string, any>>().default({}),
  idempotencyKey: text("idempotency_key").unique(), // para evitar duplicatas
  occurredAt: timestamp("occurred_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Assinaturas de webhooks
export const gritoWebhookSubscriptions = pgTable("grito_webhook_subscriptions", {
  id: serial("id").primaryKey(),
  destinationName: text("destination_name").notNull().unique(), // ex: "CRM-Doadores"
  endpointUrl: text("endpoint_url").notNull(),
  secret: text("secret").notNull(), // para HMAC sha256
  eventFilter: text("event_filter").array().notNull(), // array de eventos para filtrar
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Entregas de webhooks (queue)
export const gritoWebhookDeliveries = pgTable("grito_webhook_deliveries", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").references(() => gritoEvents.id).notNull(),
  subscriptionId: integer("subscription_id").references(() => gritoWebhookSubscriptions.id).notNull(),
  status: text("status").notNull().default("PENDING"), // PENDING, OK, FAIL
  attemptCount: integer("attempt_count").default(0).notNull(),
  nextAttemptAt: timestamp("next_attempt_at").defaultNow().notNull(),
  lastAttemptAt: timestamp("last_attempt_at"),
  response: json("response").$type<Record<string, any>>(), // resposta do webhook
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Automações baseadas em eventos
export const gritoAutomations = pgTable("grito_automations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  matchEvent: text("match_event").notNull(), // evento que dispara a automação
  conditionSql: text("condition_sql"), // SQL opcional para condições adicionais
  action: json("action").$type<{
    type: "email" | "webhook";
    template_id?: string;
    to?: string;
    variables?: Record<string, string>;
    endpoint_ref?: string;
  }>().notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Relations para os eventos
export const gritoEventsRelations = relations(gritoEvents, ({ many }) => ({
  deliveries: many(gritoWebhookDeliveries),
}));

export const gritoWebhookSubscriptionsRelations = relations(gritoWebhookSubscriptions, ({ many }) => ({
  deliveries: many(gritoWebhookDeliveries),
}));

export const gritoWebhookDeliveriesRelations = relations(gritoWebhookDeliveries, ({ one }) => ({
  event: one(gritoEvents, {
    fields: [gritoWebhookDeliveries.eventId],
    references: [gritoEvents.id],
  }),
  subscription: one(gritoWebhookSubscriptions, {
    fields: [gritoWebhookDeliveries.subscriptionId],
    references: [gritoWebhookSubscriptions.id],
  }),
}));

// Types para eventos
export type GritoEvent = typeof gritoEvents.$inferSelect;
export type InsertGritoEvent = typeof gritoEvents.$inferInsert;

export type GritoWebhookSubscription = typeof gritoWebhookSubscriptions.$inferSelect;
export type InsertGritoWebhookSubscription = typeof gritoWebhookSubscriptions.$inferInsert;

export type GritoWebhookDelivery = typeof gritoWebhookDeliveries.$inferSelect;
export type InsertGritoWebhookDelivery = typeof gritoWebhookDeliveries.$inferInsert;

export type GritoAutomation = typeof gritoAutomations.$inferSelect;
export type InsertGritoAutomation = typeof gritoAutomations.$inferInsert;

// ================ MÓDULO 18: INCLUSÃO PRODUTIVA ================

// Enum para status de participantes
export const statusParticipanteEnum = pgEnum("status_participante_enum", [
  "ativo",
  "em_andamento", 
  "concluido",
  "evadido",
  "suspenso",
  "inativo",
]);

// Enum para status de cursos
export const statusCursoEnum = pgEnum("status_curso_enum", [
  "planejado",
  "ativo",
  "concluido",
  "cancelado"
]);

// Enum para tipos de parceiros
export const tipoParceiroenum = pgEnum("tipo_parceiro_enum", [
  "contratante",
  "patrocinador", 
  "fornecedor",
  "instituicao_ensino"
]);

// Participantes dos programas de inclusão produtiva
export const participantesInclusao = pgTable("participantes_inclusao", {
  id: serial("id").primaryKey(),
  nome: text("nome").notNull(),
  cpf: text("cpf").unique(),
  email: text("email"),
  telefone: text("telefone"),
  genero: text("genero").notNull(),
  idade: integer("idade"),
  codigoMatricula: text("codigo_matricula"),
  identificador: text("identificador"),
  idCatraca: text("id_catraca"),
  endereco: text("endereco"),
  dataNascimento: date("data_nascimento"),
  escolaridade: text("escolaridade"),
  experienciaAnterior: text("experiencia_anterior"),
  programaAtual: text("programa_atual"),
  status: statusParticipanteEnum("status").default("ativo"),
  dataIngresso: timestamp("data_ingresso").defaultNow(),
  dataEgresso: timestamp("data_egresso"),
  observacoes: text("observacoes"),
  fotoUrl: text("foto_url"),
  
  // === CAMPOS EXPANDIDOS DO COMPREHENSIVE-STUDENT-FORM ===
  
  // SEÇÃO 1: Identificação adicional
  estadoCivil: text("estado_civil"),
  religiao: text("religiao"),
  naturalidade: text("naturalidade"),
  nacionalidade: text("nacionalidade").default("Brasil"),
  podeSairSozinho: text("pode_sair_sozinho"), // 'sim' ou 'nao'
  tamanhoCalca: text("tamanho_calca"),
  tamanhoCamiseta: text("tamanho_camiseta"),
  tamanhoCalcado: text("tamanho_calcado"),
  corRaca: text("cor_raca"), // 'branca', 'preta', 'parda', 'amarela', 'indigena', 'nao_sabe_informar'
  frequentaProjetoSocial: text("frequenta_projeto_social"), // 'sim' ou 'nao'
  projetoSocialQual: text("projeto_social_qual"),
  acessoInternet: text("acesso_internet"), // 'sim' ou 'nao'
  internetQual: text("internet_qual"),
  
  // SEÇÃO 2: Documentos
  rg: text("rg"),
  orgaoEmissor: text("orgao_emissor"),
  ctpsNumero: text("ctps_numero"),
  ctpsSerie: text("ctps_serie"),
  tituloEleitor: text("titulo_eleitor"),
  nisPisPasep: text("nis_pis_pasep"),
  documentosPossui: jsonb("documentos_possui"), // array de strings
  
  // SEÇÃO 3: Contato expandido
  telefoneWhatsapp: boolean("telefone_whatsapp").default(false),
  telefonesAdicionais: jsonb("telefones_adicionais"), // array de {numero, whatsapp}
  contatosEmergencia: jsonb("contatos_emergencia"), // array de {nome, telefone, whatsapp}
  
  // SEÇÃO 4: Endereço completo
  cep: text("cep"),
  logradouro: text("logradouro"),
  numero: text("numero"),
  complemento: text("complemento"),
  bairro: text("bairro"),
  cidade: text("cidade"),
  estado: text("estado"),
  pontoReferencia: text("ponto_referencia"),
  moraDesdeAno: integer("mora_desde_ano"),
  
  // SEÇÃO 5: Benefícios Sociais
  cadunico: text("cadunico"), // 'sim' ou 'nao'
  bolsaFamilia: text("bolsa_familia"), // 'sim' ou 'nao'
  bpc: text("bpc"), // 'sim' ou 'nao'
  cartaoAlimentacao: text("cartao_alimentacao"), // 'sim' ou 'nao'
  outrosBeneficios: text("outros_beneficios"), // 'sim' ou 'nao'
  
  // SEÇÃO 6: Informações Adicionais
  dataEntrada: timestamp("data_entrada"),
  formaAcesso: text("forma_acesso"),
  demandas: jsonb("demandas"), // array de strings
  observacoesGerais: text("observacoes_gerais"),
  
  // SEÇÃO 7: Escolar
  serie: text("serie"),
  situacaoEscolar: text("situacao_escolar"), // 'cursando', 'interrompido', 'concluido'
  turnoEscolar: jsonb("turno_escolar"), // array: ['matutino', 'vespertino', 'noturno']
  instituicaoEnsino: text("instituicao_ensino"),
  eAlfabetizado: text("e_alfabetizado"), // 'sabe_ler_escrever', etc
  bairroEscola: text("bairro_escola"),
  
  // SEÇÃO 8: Profissional
  situacaoProfissional: text("situacao_profissional"),
  procuraTrabalho: text("procura_trabalho"), // 'sim' ou 'nao'
  trabalhosAtuais: jsonb("trabalhos_atuais"), // array de objetos
  experienciasProfissionais: jsonb("experiencias_profissionais"), // array de objetos
  
  // SEÇÃO 9: Saúde
  possuiParticularidadeSaude: text("possui_particularidade_saude"),
  detalhesParticularidade: text("detalhes_particularidade"),
  possuiAlergia: text("possui_alergia"),
  detalhesAlergia: text("detalhes_alergia"),
  fazUsoMedicamento: text("faz_uso_medicamento"),
  detalhesMedicamento: text("detalhes_medicamento"),
  possuiDeficiencia: text("possui_deficiencia"),
  detalhesDeficiencia: text("detalhes_deficiencia"),
  contatosSaude: jsonb("contatos_saude"), // {nome, telefone}
  fazUsoQuimicos: text("faz_uso_quimicos"),
  familiarUsaQuimicos: text("familiar_usa_quimicos"),
  tipoSanguineo: text("tipo_sanguineo"),
  restricaoAlimentar: text("restricao_alimentar"),
  detalhesRestricaoAlimentar: text("detalhes_restricao_alimentar"),
  possuiConvenioMedico: text("possui_convenio_medico"),
  detalhesConvenioMedico: text("detalhes_convenio_medico"),
  historicoMedico: text("historico_medico"),
  jaTeveOuCostumaTer: jsonb("ja_teve_ou_costuma_ter"), // array
  detalhesHistoricoMedico: text("detalhes_historico_medico"),
  
  // SEÇÃO 10: Relações
  relacionamentosFamiliares: jsonb("relacionamentos_familiares"), // array de {nome, parentesco, relacao}
  outrosRelacionamentos: jsonb("outros_relacionamentos"), // array de {nome, parentesco, relacao}
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Programas de Qualificação (nível 1)
export const programasInclusao = pgTable("programas_inclusao", {
  id: serial("id").primaryKey(),
  nome: text("nome").notNull(),
  categoria: text("categoria").notNull(),
  modalidade: text("modalidade"), // presencial, hibrido, ead
  duracao: text("duracao"), // "3 meses", "6 semanas"
 numeroVagas: integer("numero_vagas"), // ✅ pode ser null
  vagasOcupadas: integer("vagas_ocupadas").default(0),
  taxaOcupacao: integer("taxa_ocupacao").default(0), // %
  status: text("status").default("planejado"), // planejado, emandamento, concluido
  descricao: text("descricao"),
  horario: text("horario"), // LEGACY - será removido após migração
  horarioEntrada: time("horario_entrada"),
  horarioSaida: time("horario_saida"),
  diasAula: text("dias_aula"), // "Segunda e Quarta"
  coordenadorId: integer("coordenador_id").references(() => users.id),
  dataInicio: date("data_inicio"),
  dataFim: date("data_fim"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Turmas (nível 2 - vinculado a programa)
export const turmasInclusao = pgTable("turmas_inclusao", {
  id: serial("id").primaryKey(),
  programaId: integer("programa_id").notNull().references(() => programasInclusao.id, { onDelete: "cascade" }),
  professorId: integer("professor_id").references(() => users.id),
  nome: text("nome").notNull(), // "Turma A", "Turma B", etc
  codigo: text("codigo"), // "LAB-A-2025", identificador único
 numeroVagas: integer("numero_vagas"), // ✅ pode ser null
  vagasOcupadas: integer("vagas_ocupadas").default(0),
  dataInicio: date("data_inicio"),
  dataFim: date("data_fim"),
  horario: text("horario"), // LEGACY - será removido após migração
  horarioEntrada: time("horario_entrada"),
  horarioSaida: time("horario_saida"),
  diasSemana: text("dias_semana").array(), // Ex: ["segunda", "quarta", "sexta"]
  status: text("status").default("planejado"), // planejado, emandamento, concluido
  instrutorNome: text("instrutor_nome"),
  local: text("local"),
  descricao: text("descricao"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

    export const participantesTurmas = pgTable("participantes_turmas", {
      id: serial("id").primaryKey(),
      participanteId: integer("participante_id")
        .references(() => participantesInclusao.id, { onDelete: "cascade" }),
      /** Vínculo canônico pós-unificação (sem exigir espelho em participantes_inclusao). */
      atendidoCpf: text("atendido_cpf"),
      turmaId: integer("turma_id")
        .notNull()
        .references(() => turmasInclusao.id, { onDelete: "cascade" }),
      dataInscricao: timestamp("data_inscricao").defaultNow(),
      dataIngresso: date("data_ingresso"),
      status: text("status").default("ativo"),
      motivoDesligamento: text("motivo_desligamento"),
      dataDesligamento: date("data_desligamento"),
      createdAt: timestamp("created_at").defaultNow(),
    }, (t) => ({
      uniqParticipanteTurma: unique().on(t.participanteId, t.turmaId),
    }));

/** Evasões na Inclusão Produtiva — fonte de verdade para filtro Evadidos. */
export const inclusaoEvasoes = pgTable("inclusao_evasoes", {
  id: serial("id").primaryKey(),
  participanteTurmaId: integer("participante_turma_id").references(() => participantesTurmas.id, { onDelete: "set null" }),
  /** Legado — opcional após unificação (vínculo canônico = atendido_cpf). */
  participanteId: integer("participante_id").references(() => participantesInclusao.id, { onDelete: "cascade" }),
  /** Vínculo canônico pós-unificação. */
  atendidoCpf: text("atendido_cpf"),
  turmaId: integer("turma_id").notNull().references(() => turmasInclusao.id, { onDelete: "cascade" }),
  dataDesligamento: date("data_desligamento").notNull(),
  registradoEm: timestamp("registrado_em").defaultNow().notNull(),
  revertidoEm: timestamp("revertido_em"),
});

/** Evasões no PEC — fonte de verdade para filtro Evadidos. */
export const pecEvasoes = pgTable("pec_evasoes", {
  id: serial("id").primaryKey(),
  enrollmentId: integer("enrollment_id").references(() => instanceEnrollments.id, { onDelete: "set null" }),
  activityInstanceId: integer("activity_instance_id").notNull().references(() => activityInstances.id, { onDelete: "cascade" }),
  studentCpf: text("student_cpf").notNull(),
  dataDesligamento: date("data_desligamento").notNull(),
  registradoEm: timestamp("registrado_em").defaultNow().notNull(),
  revertidoEm: timestamp("revertido_em"),
});

// Presenças (registro de frequência)
export const presencasInclusao = pgTable("presencas_inclusao", {
  id: serial("id").primaryKey(),
  /** Legado — opcional após unificação (vínculo canônico = atendido_cpf). */
  participanteId: integer("participante_id").references(() => participantesInclusao.id, { onDelete: "cascade" }),
  /** Vínculo canônico pós-unificação. */
  atendidoCpf: text("atendido_cpf"),
  turmaId: integer("turma_id").references(() => turmasInclusao.id, { onDelete: "cascade" }),
  data: date("data").notNull(),
  presente: boolean("presente").notNull().default(false),
  observacoes: text("observacoes"),
  justificativa: text("justificativa"),
  justificativaMotivo: text("justificativa_motivo"),
  justificativaObs: text("justificativa_obs"),
  contaComoPresenca: boolean("conta_como_presenca").default(false),
  aprovadoCoordenador: boolean("aprovado_coordenador").default(false),
  aprovadoPor: text("aprovado_por"),
  aprovadoEm: timestamp("aprovado_em"),
  fotoComprovante: text("foto_comprovante"),
  teveAlimentacao: boolean("teve_alimentacao"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Log de ativação do modo manual de chamada (auditoria)
export const chamadaManualLogs = pgTable("chamada_manual_logs", {
  id: serial("id").primaryKey(),
  turmaId: integer("turma_id"),
  data: date("data").notNull(),
  userId: integer("user_id"),
  motivo: text("motivo").notNull(),
  vertente: text("vertente"),
  origem: text("origem"),
  observacao: text("observacao"),
  tabletUserId: integer("tablet_user_id"),
  actorNome: text("actor_nome"),
  createdAt: timestamp("created_at").defaultNow(),
});

export type ChamadaManualLog = typeof chamadaManualLogs.$inferSelect;

export const presencaManualSenhas = pgTable("presenca_manual_senhas", {
  id: serial("id").primaryKey(),
  vertente: text("vertente").notNull().unique(),
  senhaHash: text("senha_hash").notNull(),
  definidaEm: timestamp("definida_em", { withTimezone: true }).notNull().defaultNow(),
  expiraEm: timestamp("expira_em", { withTimezone: true }).notNull(),
  alteradaPor: integer("alterada_por"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const chamadaTabletLogs = pgTable("chamada_tablet_logs", {
  id: serial("id").primaryKey(),
  vertente: text("vertente").notNull(),
  turmaId: integer("turma_id"),
  turmaNome: text("turma_nome"),
  dataChamada: date("data_chamada").notNull(),
  modo: text("modo").notNull(),
  justificativa: text("justificativa"),
  observacao: text("observacao"),
  tabletUserId: integer("tablet_user_id"),
  tabletUsername: text("tablet_username"),
  totalPresentes: integer("total_presentes"),
  totalAlunos: integer("total_alunos"),
  createdAt: timestamp("created_at").defaultNow(),
});

export type ChamadaTabletLog = typeof chamadaTabletLogs.$inferSelect;

// Parceiros e empresas
export const parceirosEmpresa = pgTable("parceiros_empresa", {
  id: serial("id").primaryKey(),
  nome: text("nome").notNull(),
  cnpj: text("cnpj"),
  tipo: tipoParceiroenum("tipo").notNull(),
  area: text("area"), // area de atuação
  contato: text("contato"),
  email: text("email"),
  telefone: text("telefone"),
  endereco: text("endereco"),
  responsavelNome: text("responsavel_nome"),
  responsavelCargo: text("responsavel_cargo"),
  responsavelContato: text("responsavel_contato"),
  vagasAbertas: integer("vagas_abertas").default(0),
  pessoasContratadas: integer("pessoas_contratadas").default(0),
  dataInicioParceria: date("data_inicio_parceria"),
  status: text("status").default("ativo"), // ativo, inativo, suspenso
  observacoes: text("observacoes"),
  coordenadorId: integer("coordenador_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Vagas de emprego
export const vagasEmprego = pgTable("vagas_emprego", {
  id: serial("id").primaryKey(),
  titulo: text("titulo").notNull(),
  descricao: text("descricao"),
  empresa: text("empresa").notNull(),
  parceiroId: integer("parceiro_id").references(() => parceirosEmpresa.id),
  salario: text("salario"),
  beneficios: text("beneficios"),
  cargaHoraria: text("carga_horaria"),
  requisitos: text("requisitos"),
  numeroVagas: integer("numero_vagas").default(1),
  candidatosInscritos: integer("candidatos_inscritos").default(0),
  dataPublicacao: timestamp("data_publicacao").defaultNow(),
  dataExpiracao: date("data_expiracao"),
  status: text("status").default("aberta"), // aberta, fechada, preenchida, cancelada
  local: text("local"),
  tipoContrato: text("tipo_contrato"), // clt, pj, estagio, temporario
  coordenadorId: integer("coordenador_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Candidaturas a vagas
export const candidaturasVagas = pgTable("candidaturas_vagas", {
  id: serial("id").primaryKey(),
  participanteId: integer("participante_id").references(() => participantesInclusao.id),
  vagaId: integer("vaga_id").references(() => vagasEmprego.id),
  dataCandidatura: timestamp("data_candidatura").defaultNow(),
  status: text("status").default("candidato"), // candidato, pre_selecionado, entrevista, contratado, rejeitado
  observacoes: text("observacoes"),
  dataEntrevista: timestamp("data_entrevista"),
  feedbackEmpresa: text("feedback_empresa"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Acompanhamento específico da inclusão produtiva
export const acompanhamentoInclusao = pgTable("acompanhamento_inclusao", {
  id: serial("id").primaryKey(),
  participanteId: integer("participante_id").references(() => participantesInclusao.id),
  coordenadorId: integer("coordenador_id").references(() => users.id),
  dataAcompanhamento: date("data_acompanhamento").notNull(),
  tipo: text("tipo").notNull(), // visita, telefone, reuniao, avaliacao
  progresso: integer("progresso").default(0), // 0-100%
  observacoes: text("observacoes"),
  proximaAcao: text("proxima_acao"),
  dataProximaAcao: date("data_proxima_acao"),
  situacaoEmprego: text("situacao_emprego"), // desempregado, empregado, procurando, estudando
  rendaAtual: decimal("renda_atual", { precision: 10, scale: 2 }),
  dificuldades: text("dificuldades"),
  sucessos: text("sucessos"),
  metasEstabelecidas: text("metas_estabelecidas"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relatórios da inclusão produtiva
export const relatoriosInclusao = pgTable("relatorios_inclusao", {
  id: serial("id").primaryKey(),
  titulo: text("titulo").notNull(),
  tipo: text("tipo").notNull(), // mensal, trimestral, semestral, anual, personalizado
  periodo: text("periodo").notNull(), // "2025-09", "2025-Q3", etc
  coordenadorId: integer("coordenador_id").references(() => users.id),
  dados: json("dados").notNull(), // dados do relatório em JSON
  formato: text("formato").default("pdf"), // pdf, excel, slides
  status: text("status").default("gerado"), // gerado, enviado, arquivado
  arquivoUrl: text("arquivo_url"),
  dataGeracao: timestamp("data_geracao").defaultNow(),
  dataEnvio: timestamp("data_envio"),
  destinatarios: text("destinatarios").array(),
  observacoes: text("observacoes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Configurações dos coordenadores
export const configuracoesInclusao = pgTable("configuracoes_inclusao", {
  id: serial("id").primaryKey(),
  coordenadorId: integer("coordenador_id").references(() => users.id).unique(),
  notificacoesEmail: boolean("notificacoes_email").default(true),
  relatoriosAutomaticos: boolean("relatorios_automaticos").default(true),
  alertasNovoParticipante: boolean("alertas_novo_participante").default(true),
  alertasEvasao: boolean("alertas_evasao").default(true),
  diasAlertaEvasao: integer("dias_alerta_evasao").default(3),
  metaEmpregabilidade: integer("meta_empregabilidade").default(70), // %
  metaConclusao: integer("meta_conclusao").default(80), // %
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Enum para tipo de programa
export const programTypeEnum = pgEnum("program_type", ["pec", "inclusao"]);

// Relação monitor-participante para acompanhamento individualizado
// Suporta alunos de PEC e Inclusão Produtiva
export const monitorParticipantes = pgTable("monitor_participantes", {
  id: serial("id").primaryKey(),
  monitorUserId: integer("monitor_user_id").references(() => users.id).notNull(),
  
  // Tipo de programa (PEC ou Inclusão Produtiva)
  programType: programTypeEnum("program_type").notNull().default("inclusao"),
  
  // FK para Inclusão Produtiva (nullable)
  inclusaoParticipanteId: integer("inclusao_participante_id").references(() => participantesInclusao.id),
  
  // FK para PEC (nullable)
  pecAlunoCpf: text("pec_aluno_cpf").references(() => aluno.cpf),

  // Cadastro unificado (Fase 4) — nullable até backfill / sync
  atendidoCpf: text("atendido_cpf"),
  
  // Campos de acompanhamento
  acompanhamentoStatus: text("acompanhamento_status").default("ativo"),
  observacoesPrivadas: text("observacoes_privadas"),
  ultimaInteracao: timestamp("ultima_interacao"),
  acompanhamentoTags: text("acompanhamento_tags").array(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Atividades criadas por monitores
export const atividadesMonitor = pgTable("atividades_monitor", {
  id: serial("id").primaryKey(),
  monitorUserId: integer("monitor_user_id").references(() => users.id).notNull(),
  titulo: text("titulo").notNull(),
  descricao: text("descricao"),
  tipo: text("tipo").notNull(), // "reforco", "recreativa", "oficina", "outro"
  grupo: text("grupo"), // "Grupo A", "Grupo B", etc
  data: timestamp("data").notNull(),
  horarioInicio: text("horario_inicio").notNull(), // "14:00"
  horarioFim: text("horario_fim").notNull(), // "16:00"
  local: text("local"),
  participantesEsperados: integer("participantes_esperados").default(0),
  participantesPresentes: integer("participantes_presentes").default(0),
  status: text("status").default("planejada"), // "planejada", "em_andamento", "concluida", "cancelada"
  observacoes: text("observacoes"),
  materiaisNecessarios: text("materiais_necessarios").array(),
  vertente: text("vertente").default("pec"), // 'pec' ou 'inclusao'
  contexto: text("contexto"), // 'psicossocial', 'monitor_pec', 'monitor_inclusao'
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Grupos gerenciados por monitores
export const monitorGrupos = pgTable("monitor_grupos", {
  id: serial("id").primaryKey(),
  monitorUserId: integer("monitor_user_id")
    .references(() => users.id)
    .notNull(),
  turmaId: integer("turma_id"),
  nome: text("nome").notNull(),
  nivel: text("nivel"),
  alunos: integer("alunos").default(0),
  frequencia: numeric("frequencia", { precision: 5, scale: 2 }).default("0"),
  atividade: text("atividade"),
  horarioInicio: text("horario_inicio"), // Ex: "14:00"
  horarioFim: text("horario_fim"), // Ex: "16:00"
  diasSemana: text("dias_semana").array(), // Ex: ["segunda", "quarta", "sexta"]
  vertente: text("vertente").default("pec"), // 'pec' ou 'inclusao' - separa grupos por programa
  status: text("status").default("ativo"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type MonitorGrupo = typeof monitorGrupos.$inferSelect;
export type InsertMonitorGrupo = typeof monitorGrupos.$inferInsert;

// Tabela de vinculação alunos <-> grupos do monitor
export const monitorGrupoAlunos = pgTable("monitor_grupo_alunos", {
  id: serial("id").primaryKey(),
  grupoId: integer("grupo_id")
    .references(() => monitorGrupos.id)
    .notNull(),
  participanteId: integer("participante_id"), // ID numérico para Inclusão Produtiva
  participanteCpf: text("participante_cpf"), // CPF para alunos PEC (chave primária na tabela aluno)
  participanteTipo: text("participante_tipo").notNull(), // 'pec' ou 'inclusao'
  createdAt: timestamp("created_at").defaultNow(),
});

export type MonitorGrupoAluno = typeof monitorGrupoAlunos.$inferSelect;
export type InsertMonitorGrupoAluno = typeof monitorGrupoAlunos.$inferInsert;

// Relations para inclusão produtiva
export const participantesInclusaoRelations = relations(participantesInclusao, ({ one, many }) => ({
  candidaturas: many(candidaturasVagas),
  acompanhamentos: many(acompanhamentoInclusao),
  turmas: many(participantesTurmas),
  monitorAssignments: many(monitorParticipantes),
}));

export const monitorParticipantesRelations = relations(monitorParticipantes, ({ one }) => ({
  monitor: one(users, {
    fields: [monitorParticipantes.monitorUserId],
    references: [users.id],
  }),
  participanteInclusao: one(participantesInclusao, {
    fields: [monitorParticipantes.inclusaoParticipanteId],
    references: [participantesInclusao.id],
  }),
  alunoPec: one(aluno, {
    fields: [monitorParticipantes.pecAlunoCpf],
    references: [aluno.cpf],
  }),
}));

export const atividadesMonitorRelations = relations(atividadesMonitor, ({ one }) => ({
  monitor: one(users, {
    fields: [atividadesMonitor.monitorUserId],
    references: [users.id],
  }),
}));

export const programasInclusaoRelations = relations(programasInclusao, ({ one, many }) => ({
  coordenador: one(users, {
    fields: [programasInclusao.coordenadorId],
    references: [users.id],
  }),
  turmas: many(turmasInclusao),
}));

export const turmasInclusaoRelations = relations(turmasInclusao, ({ one, many }) => ({
  programa: one(programasInclusao, {
    fields: [turmasInclusao.programaId],
    references: [programasInclusao.id],
  }),
  participantes: many(participantesTurmas),
}));

export const participantesTurmasRelations = relations(participantesTurmas, ({ one }) => ({
  participante: one(participantesInclusao, {
    fields: [participantesTurmas.participanteId],
    references: [participantesInclusao.id],
  }),
  turma: one(turmasInclusao, {
    fields: [participantesTurmas.turmaId],
    references: [turmasInclusao.id],
  }),
}));

export const parceirosEmpresaRelations = relations(parceirosEmpresa, ({ one, many }) => ({
  coordenador: one(users, {
    fields: [parceirosEmpresa.coordenadorId],
    references: [users.id],
  }),
  vagas: many(vagasEmprego),
}));

export const vagasEmpregoRelations = relations(vagasEmprego, ({ one, many }) => ({
  parceiro: one(parceirosEmpresa, {
    fields: [vagasEmprego.parceiroId],
    references: [parceirosEmpresa.id],
  }),
  coordenador: one(users, {
    fields: [vagasEmprego.coordenadorId],
    references: [users.id],
  }),
  candidaturas: many(candidaturasVagas),
}));

// Types para inclusão produtiva
export type ParticipanteInclusao = typeof participantesInclusao.$inferSelect;
export type InsertParticipanteInclusao = typeof participantesInclusao.$inferInsert;

export type ProgramaInclusao = typeof programasInclusao.$inferSelect;
export type InsertProgramaInclusao = typeof programasInclusao.$inferInsert;

export type TurmaInclusao = typeof turmasInclusao.$inferSelect;
export type InsertTurmaInclusao = typeof turmasInclusao.$inferInsert;

export type ParticipanteTurma = typeof participantesTurmas.$inferSelect;
export type InsertParticipanteTurma = typeof participantesTurmas.$inferInsert;

export type ParceiroEmpresa = typeof parceirosEmpresa.$inferSelect;
export type InsertParceiroEmpresa = typeof parceirosEmpresa.$inferInsert;

export type VagaEmprego = typeof vagasEmprego.$inferSelect;
export type InsertVagaEmprego = typeof vagasEmprego.$inferInsert;

export type AcompanhamentoInclusao = typeof acompanhamentoInclusao.$inferSelect;
export type InsertAcompanhamentoInclusao = typeof acompanhamentoInclusao.$inferInsert;

export type RelatorioInclusao = typeof relatoriosInclusao.$inferSelect;
export type InsertRelatorioInclusao = typeof relatoriosInclusao.$inferInsert;

export type ConfiguracaoInclusao = typeof configuracoesInclusao.$inferSelect;
export type InsertConfiguracaoInclusao = typeof configuracoesInclusao.$inferInsert;

export type PresencaInclusao = typeof presencasInclusao.$inferSelect;
export type InsertPresencaInclusao = typeof presencasInclusao.$inferInsert;

export type MonitorParticipante = typeof monitorParticipantes.$inferSelect;
export type InsertMonitorParticipante = typeof monitorParticipantes.$inferInsert;

export type SelectAtividadeMonitor = typeof atividadesMonitor.$inferSelect;
export type InsertAtividadeMonitor = typeof atividadesMonitor.$inferInsert;

// Schemas para validação
export const insertParticipanteInclusaoSchema = createInsertSchema(participantesInclusao);
export const insertProgramaInclusaoSchema = createInsertSchema(programasInclusao);
export const insertTurmaInclusaoSchema = createInsertSchema(turmasInclusao);
export const insertParceiroEmpresaSchema = createInsertSchema(parceirosEmpresa);
export const insertVagaEmpregoSchema = createInsertSchema(vagasEmprego);
export const insertAcompanhamentoInclusaoSchema = createInsertSchema(acompanhamentoInclusao);
export const insertRelatorioInclusaoSchema = createInsertSchema(relatoriosInclusao);
export const insertConfiguracaoInclusaoSchema = createInsertSchema(configuracoesInclusao);
export const insertPresencaInclusaoSchema = createInsertSchema(presencasInclusao).omit({ id: true, createdAt: true, updatedAt: true });
export const insertMonitorParticipanteSchema = createInsertSchema(monitorParticipantes).omit({ id: true, createdAt: true, updatedAt: true });
export const updateMonitorParticipanteSchema = createInsertSchema(monitorParticipantes).omit({ id: true, monitorUserId: true, inclusaoParticipanteId: true, pecAlunoCpf: true, atendidoCpf: true, createdAt: true, updatedAt: true }).partial();
export const insertAtividadeMonitorSchema = createInsertSchema(atividadesMonitor).omit({ id: true, createdAt: true, updatedAt: true });
export const insertMonitorGrupoSchema = createInsertSchema(monitorGrupos).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertMonitorGrupoSchema = z.infer<typeof insertMonitorGrupoSchema>;

// Registros de Atividades (Activity Reports/Logs) - para atividades já realizadas
export const registrosAtividades = pgTable("registros_atividades", {
  id: serial("id").primaryKey(),
  monitorUserId: integer("monitor_user_id").references(() => users.id).notNull(),
  dataAtividade: date("data_atividade").notNull(),
  grupo: text("grupo").notNull(),
  titulo: text("titulo").notNull(),
  descricao: text("descricao"),
  duracaoMinutos: integer("duracao_minutos"),
  participantes: integer("participantes"),
  resultadosObservacoes: text("resultados_observacoes"),
  vertente: text("vertente").default("pec"), // 'pec' ou 'inclusao'
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type RegistroAtividade = typeof registrosAtividades.$inferSelect;
export type InsertRegistroAtividade = typeof registrosAtividades.$inferInsert;

export const insertRegistroAtividadeSchema = createInsertSchema(registrosAtividades).omit({ id: true, createdAt: true, updatedAt: true });

// ================ MÓDULO 19: PATROCINADORES ================

// Enum para categorias de patrocínio
export const categoriaPatrocinioEnum = pgEnum("categoria_patrocinio_enum", [
  "oficial",
  "diamante",
  "master",
  "gold",
  "silver",
  "bronze"
]);

// Enum para tipo de patrocinador
export const tipoPatrocinadorEnum = pgEnum("tipo_patrocinador_enum", [
  "empresa",
  "pessoa_fisica",
  "anonimo"
]);

// Enum para status do patrocínio
export const statusPatrocinioEnum = pgEnum("status_patrocinio_enum", [
  "ativo",
  "inativo",
  "em_renovacao"
]);

// Tabela de patrocinadores
export const patrocinadores = pgTable("patrocinadores", {
  id: serial("id").primaryKey(),
  nome: text("nome").notNull(),
  ano: integer("ano").notNull(),
  tipo: tipoPatrocinadorEnum("tipo").notNull().default("empresa"),
  categoria: categoriaPatrocinioEnum("categoria").notNull(),
  valorPatrocinio: decimal("valor_patrocinio", { precision: 10, scale: 2 }),
  status: statusPatrocinioEnum("status").notNull().default("ativo"),
  projetosAtivos: boolean("projetos_ativos").default(true),
  contratosAtivos: boolean("contratos_ativos").default(true),
  dataInicio: date("data_inicio"),
  dataFim: date("data_fim"),
  observacoes: text("observacoes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Types
export type Patrocinador = typeof patrocinadores.$inferSelect;
export type InsertPatrocinador = typeof patrocinadores.$inferInsert;

// Schema para validação
export const insertPatrocinadorSchema = createInsertSchema(patrocinadores).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});

// ================ INDICADORES GLOBAIS DE IMPACTO ================

// Tabela para armazenar indicadores globais que aparecem nas telas de doador e patrocinador
export const indicadoresGlobais = pgTable("indicadores_globais", {
  id: serial("id").primaryKey(),
  chave: text("chave").notNull().unique(), // 'horas_aula', 'impacto_direto_indireto', etc.
  valor: integer("valor").notNull(),
  descricao: text("descricao"), // Descrição do indicador
  ano: integer("ano").notNull().default(2025),
  updatedAt: timestamp("updated_at").defaultNow(),
  updatedBy: text("updated_by"), // Quem atualizou
});

export type IndicadorGlobal = typeof indicadoresGlobais.$inferSelect;
export type InsertIndicadorGlobal = typeof indicadoresGlobais.$inferInsert;

export const insertIndicadorGlobalSchema = createInsertSchema(indicadoresGlobais).omit({ 
  id: true, 
  updatedAt: true 
});

// ================ MÓDULO 20: COLABORADORES ================

export const colaboradorVinculoEnum = pgEnum("colaborador_vinculo_enum", ["CLT", "CNPJ"]);

export const colaboradorSetorEnum = pgEnum("colaborador_setor_enum", [
  "Programa Esportivo Cultural",
  "Inclusão Produtiva",
  "ADM/Financeiro",
  "Marketing e Comunicação",
  "Psicossocial",
  "Negócios Sociais",
]);

// Tabela de colaboradores
export const colaboradores = pgTable("colaboradores", {
  id: serial("id").primaryKey(),
  nome: text("nome").notNull(),
  telefone: text("telefone").notNull(),
  email: text("email"),
  cpf: text("cpf"),
  departamento: text("departamento").notNull(), // Departamentos flexíveis
  vinculo: colaboradorVinculoEnum("vinculo"),
  setor: colaboradorSetorEnum("setor"),
  cargo: text("cargo"),
  satisfacao: integer("satisfacao"), // 0-100 scale
  ativo: boolean("ativo").default(true),
  dataAdmissao: date("data_admissao"),
  dataDesligamento: date("data_desligamento"),
  observacoes: text("observacoes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Types
export type Colaborador = typeof colaboradores.$inferSelect;
export type InsertColaborador = typeof colaboradores.$inferInsert;

// Schema para validação
export const insertColaboradorSchema = createInsertSchema(colaboradores).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});

// ================ MÓDULO 21: PSICOSSOCIAL ================

// Enum para status de famílias
export const statusFamiliaEnum = pgEnum("status_familia_enum", [
  "ativo",
  "em_acompanhamento",
  "inativo"
]);

// Enum para prioridade de casos
export const prioridadeCasoEnum = pgEnum("prioridade_caso_enum", [
  "alta",
  "media",
  "baixa"
]);

// Enum para status de casos
export const statusCasoEnum = pgEnum("status_caso_enum", [
  "aberto",
  "em_atendimento",
  "em_acompanhamento",
  "finalizado"
]);

// Enum para tipo de atendimento
export const tipoAtendimentoEnum = pgEnum("tipo_atendimento_enum", [
  "individual",
  "familiar",
  "grupo",
  "visita_domiciliar"
]);

// Tabela de Famílias Psicossociais
export const psicoFamilias = pgTable("psico_familias", {
  id: serial("id").primaryKey(),
  nomeResponsavel: text("nome_responsavel").notNull(),
  numeroMembros: integer("numero_membros").default(1),
  telefone: text("telefone"),
  endereco: text("endereco"),
  status: statusFamiliaEnum("status").notNull().default("ativo"),
  dataUltimoAtendimento: date("data_ultimo_atendimento"),
  observacoes: text("observacoes"),
  coordenadorId: integer("coordenador_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Tabela de Casos Psicossociais
export const psicoCasos = pgTable("psico_casos", {
  id: serial("id").primaryKey(),
  familiaId: integer("familia_id").references(() => psicoFamilias.id),
  titulo: text("titulo").notNull(),
  tipo: text("tipo").notNull(), // Ex: "Violência Doméstica", "Dependência Química"
  prioridade: prioridadeCasoEnum("prioridade").notNull().default("media"),
  status: statusCasoEnum("status").notNull().default("aberto"),
  responsavelNome: text("responsavel_nome"), // Nome do profissional responsável
  descricao: text("descricao"),
  dataAbertura: date("data_abertura").defaultNow(),
  dataEncerramento: date("data_encerramento"),
  resultado: text("resultado"),
  coordenadorId: integer("coordenador_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Tabela de Atendimentos Psicossociais
export const psicoAtendimentos = pgTable("psico_atendimentos", {
  id: serial("id").primaryKey(),
  familiaId: integer("familia_id").references(() => psicoFamilias.id),
  casoId: integer("caso_id").references(() => psicoCasos.id),
  // Vínculos diretos com alunos (um dos dois deve estar preenchido se não houver família)
  psicoInclusaoVinculoId: integer("psico_inclusao_vinculo_id"),
  psicoPecVinculoId: integer("psico_pec_vinculo_id"),
  tipo: tipoAtendimentoEnum("tipo").notNull(),
  dataAtendimento: date("data_atendimento").notNull(),
  duracaoMinutos: integer("duracao_minutos"),
  profissionalResponsavel: text("profissional_responsavel"),
  resumo: text("resumo"),
  observacoes: text("observacoes"),
  coordenadorId: integer("coordenador_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Tabela de Planos de Acompanhamento
export const psicoPlanos = pgTable("psico_planos", {
  id: serial("id").primaryKey(),
  familiaId: integer("familia_id").references(() => psicoFamilias.id),
  casoId: integer("caso_id").references(() => psicoCasos.id),
  tipoAcompanhamento: text("tipo_acompanhamento"), // Ex: "Visita Domiciliar", "Atendimento Técnico"
  frequencia: text("frequencia"), // Ex: "Semanal", "Quinzenal", "Mensal"
  estrategias: text("estrategias"),
  observacoes: text("observacoes"),
  coordenadorId: integer("coordenador_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Types
export type PsicoFamilia = typeof psicoFamilias.$inferSelect;
export type InsertPsicoFamilia = typeof psicoFamilias.$inferInsert;
export type PsicoCaso = typeof psicoCasos.$inferSelect;
export type InsertPsicoCaso = typeof psicoCasos.$inferInsert;
export type PsicoAtendimento = typeof psicoAtendimentos.$inferSelect;
export type InsertPsicoAtendimento = typeof psicoAtendimentos.$inferInsert;
export type PsicoPlano = typeof psicoPlanos.$inferSelect;
export type InsertPsicoPlano = typeof psicoPlanos.$inferInsert;

// Schemas para validação
export const insertPsicoFamiliaSchema = createInsertSchema(psicoFamilias).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});

export const insertPsicoCasoSchema = createInsertSchema(psicoCasos).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});

export const insertPsicoAtendimentoSchema = createInsertSchema(psicoAtendimentos).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});

export const insertPsicoPlanoSchema = createInsertSchema(psicoPlanos).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});

// Schemas para update (parciais)
export const updatePsicoFamiliaSchema = insertPsicoFamiliaSchema
  .pick({
    nomeResponsavel: true,
    numeroMembros: true,
    telefone: true,
    endereco: true,
    status: true,
    observacoes: true
  })
  .partial();

export const updatePsicoCasoSchema = insertPsicoCasoSchema
  .pick({
    familiaId: true,
    titulo: true,
    tipo: true,
    prioridade: true,
    status: true,
    responsavelNome: true,
    descricao: true,
    dataEncerramento: true,
    resultado: true
  })
  .partial();

// Schema para validação de ID
export const psicoIdSchema = z.object({
  id: z.coerce.number().int().positive()
});

// Types para update
export type UpdatePsicoFamilia = z.infer<typeof updatePsicoFamiliaSchema>;
export type UpdatePsicoCaso = z.infer<typeof updatePsicoCasoSchema>;

// ================ TABELAS DE VINCULAÇÃO: COMPARTILHAMENTO DE ALUNOS ================
// Vincular participantes da Inclusão Produtiva com famílias Psicossociais
export const psicoInclusaoVinculo = pgTable("psico_inclusao_vinculo", {
  id: serial("id").primaryKey(),
  participanteInclusaoId: integer("participante_inclusao_id")
    .references(() => participantesInclusao.id, { onDelete: "cascade" })
    .notNull(),
  psicoFamiliaId: integer("psico_familia_id")
    .references(() => psicoFamilias.id, { onDelete: "cascade" })
    .notNull(),
  papel: text("papel").default("membro"), // membro, responsavel, dependente
  observacoes: text("observacoes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Vincular alunos do PEC com famílias Psicossociais  
export const psicoPecVinculo = pgTable("psico_pec_vinculo", {
  id: serial("id").primaryKey(),
  enrollmentId: integer("enrollment_id")
    .references(() => enrollments.id, { onDelete: "cascade" })
    .notNull(),
  psicoFamiliaId: integer("psico_familia_id")
    .references(() => psicoFamilias.id, { onDelete: "cascade" })
    .notNull(),
  papel: text("papel").default("membro"), // membro, responsavel, dependente
  observacoes: text("observacoes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ================ INDICADORES PSICOSSOCIAL PARA DOADORES ================
// Tabela de indicadores de Atenção Social
export const indicadoresPsicoAtencaoSocial = pgTable("indicadores_psico_atencao_social", {
  id: serial("id").primaryKey(),
  visitasDomiciliaresRealizadas: integer("visitas_domiciliares_realizadas").notNull().default(198),
  visitasDomiciliaresMeta: integer("visitas_domiciliares_meta").notNull().default(220),
  atendimentosIndividuaisRealizados: integer("atendimentos_individuais_realizados").notNull().default(171),
  atendimentosIndividuaisMeta: integer("atendimentos_individuais_meta").notNull().default(220),
  updatedAt: timestamp("updated_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Tabela de indicadores do Método O Grito
export const indicadoresPsicoMetodoGrito = pgTable("indicadores_psico_metodo_grito", {
  id: serial("id").primaryKey(),
  atendimentosColetivoRealizados: integer("atendimentos_coletivos_realizados").notNull().default(2117),
  turmasAlcancadasPercentual: integer("turmas_alcancadas_percentual").notNull().default(100),
  espacosColetivos: integer("espacos_coletivos").notNull().default(12),
  espacosColetivosMeta: integer("espacos_coletivos_meta").notNull().default(12),
  caravanasComunitarias: integer("caravanas_comunitarias").notNull().default(1),
  acoesSaudeColaboradores: integer("acoes_saude_colaboradores").notNull().default(2),
  updatedAt: timestamp("updated_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// ================ INCLUSÃO PRODUTIVA - CURSOS DE TECNOLOGIA ================
// Tabela de cursos de tecnologia para indicadores de Inclusão Produtiva
export const cursosTecnologia = pgTable("cursos_tecnologia", {
  id: serial("id").primaryKey(),
  curso: varchar("curso", { length: 255 }).notNull(),
  modalidade: varchar("modalidade", { length: 50 }).notNull(), // "Presencial" ou "EAD"
  inscritos: integer("inscritos"),
  formados: integer("formados"),
  evasao: integer("evasao"),
  situacao: varchar("situacao", { length: 100 }).notNull(), // "Concluído", "Em Andamento"
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ================ INCLUSÃO PRODUTIVA - CURSOS DE BELEZA ================
export const cursosBeleza = pgTable("cursos_beleza", {
  id: serial("id").primaryKey(),
  curso: varchar("curso", { length: 255 }).notNull(),
  modalidade: varchar("modalidade", { length: 50 }).notNull(), // "Presencial" ou "EAD"
  inscritos: integer("inscritos"),
  formados: integer("formados"),
  evasao: integer("evasao"),
  situacao: varchar("situacao", { length: 100 }).notNull(), // "Concluído", "Em Andamento"
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ================ INCLUSÃO PRODUTIVA - CURSOS DE ARTESANATO ================
export const cursosArtesanato = pgTable("cursos_artesanato", {
  id: serial("id").primaryKey(),
  curso: varchar("curso", { length: 255 }).notNull(),
  modalidade: varchar("modalidade", { length: 50 }).notNull(), // "Presencial" ou "EAD"
  inscritos: integer("inscritos"),
  formados: integer("formados"),
  evasao: integer("evasao"),
  situacao: varchar("situacao", { length: 100 }).notNull(), // "Concluído", "Em Andamento"
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ================ INCLUSÃO PRODUTIVA - CURSOS DE EMPREENDEDORISMO ================
export const cursosEmpreendedorismo = pgTable("cursos_empreendedorismo", {
  id: serial("id").primaryKey(),
  curso: varchar("curso", { length: 255 }).notNull(),
  modalidade: varchar("modalidade", { length: 50 }).notNull(), // "Presencial" ou "EAD"
  inscritos: integer("inscritos"),
  formados: integer("formados"),
  evasao: integer("evasao"),
  situacao: varchar("situacao", { length: 100 }).notNull(), // "Concluído", "Em Andamento", "Iniciar"
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ================ INCLUSÃO PRODUTIVA - CURSOS DE ADMINISTRATIVO ================
export const cursosAdministrativo = pgTable("cursos_administrativo", {
  id: serial("id").primaryKey(),
  curso: varchar("curso", { length: 255 }).notNull(),
  modalidade: varchar("modalidade", { length: 50 }).notNull(), // "Presencial" ou "EAD"
  inscritos: integer("inscritos"),
  formados: integer("formados"),
  evasao: integer("evasao"),
  situacao: varchar("situacao", { length: 100 }).notNull(), // "Concluído", "Em Andamento", "Iniciar"
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ================ INCLUSÃO PRODUTIVA - CURSOS DE SOCIOEMOCIONAL ================
export const cursosSocioemocional = pgTable("cursos_socioemocional", {
  id: serial("id").primaryKey(),
  curso: varchar("curso", { length: 255 }).notNull(),
  modalidade: varchar("modalidade", { length: 50 }).notNull(), // "Presencial" ou "EAD"
  inscritos: integer("inscritos"),
  formados: integer("formados"),
  evasao: integer("evasao"),
  situacao: varchar("situacao", { length: 100 }).notNull(), // "Concluído", "Em Andamento", "Iniciar"
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ================ INCLUSÃO PRODUTIVA - CURSOS DE EDUCACIONAL ================
export const cursosEducacional = pgTable("cursos_educacional", {
  id: serial("id").primaryKey(),
  curso: varchar("curso", { length: 255 }).notNull(),
  modalidade: varchar("modalidade", { length: 50 }).notNull(), // "Presencial" ou "EAD"
  inscritos: integer("inscritos"),
  formados: integer("formados"),
  evasao: integer("evasao"),
  situacao: varchar("situacao", { length: 50 }),
});

// ================ INCLUSÃO PRODUTIVA - CURSOS DE OPERACIONAL ================
export const cursosOperacional = pgTable("cursos_operacional", {
  id: serial("id").primaryKey(),
  curso: varchar("curso", { length: 255 }).notNull(),
  modalidade: varchar("modalidade", { length: 50 }).notNull(), // "Presencial" ou "EAD"
  inscritos: integer("inscritos"),
  formados: integer("formados"),
  evasao: integer("evasao"),
  situacao: varchar("situacao", { length: 50 }),
});

// ================ INCLUSÃO PRODUTIVA - CURSOS DE GASTRONOMIA ================
export const cursosGastronomia = pgTable("cursos_gastronomia", {
  id: serial("id").primaryKey(),
  curso: varchar("curso", { length: 255 }).notNull(),
  modalidade: varchar("modalidade", { length: 50 }).notNull(), // "Presencial" ou "EAD"
  inscritos: integer("inscritos"),
  formados: integer("formados"),
  evasao: integer("evasao"),
  situacao: varchar("situacao", { length: 50 }),
});

// ================ SISTEMA DE SECRETS CRIPTOGRAFADOS ================
// Armazena credenciais sensíveis criptografadas (ex: Rede PV/Token)
export const appSecrets = pgTable("app_secrets", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 64 }).notNull().unique(),
  valueEnc: text("value_enc").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Types
export type PsicoInclusaoVinculo = typeof psicoInclusaoVinculo.$inferSelect;
export type InsertPsicoInclusaoVinculo = typeof psicoInclusaoVinculo.$inferInsert;
export type PsicoPecVinculo = typeof psicoPecVinculo.$inferSelect;
export type InsertPsicoPecVinculo = typeof psicoPecVinculo.$inferInsert;
export type IndicadoresPsicoAtencaoSocial = typeof indicadoresPsicoAtencaoSocial.$inferSelect;
export type InsertIndicadoresPsicoAtencaoSocial = typeof indicadoresPsicoAtencaoSocial.$inferInsert;
export type IndicadoresPsicoMetodoGrito = typeof indicadoresPsicoMetodoGrito.$inferSelect;
export type InsertIndicadoresPsicoMetodoGrito = typeof indicadoresPsicoMetodoGrito.$inferInsert;
export type CursoTecnologia = typeof cursosTecnologia.$inferSelect;
export type InsertCursoTecnologia = typeof cursosTecnologia.$inferInsert;
export type CursoBeleza = typeof cursosBeleza.$inferSelect;
export type InsertCursoBeleza = typeof cursosBeleza.$inferInsert;
export type CursoArtesanato = typeof cursosArtesanato.$inferSelect;
export type InsertCursoArtesanato = typeof cursosArtesanato.$inferInsert;
export type CursoEmpreendedorismo = typeof cursosEmpreendedorismo.$inferSelect;
export type InsertCursoEmpreendedorismo = typeof cursosEmpreendedorismo.$inferInsert;
export type CursoAdministrativo = typeof cursosAdministrativo.$inferSelect;
export type InsertCursoAdministrativo = typeof cursosAdministrativo.$inferInsert;
export type CursoSocioemocional = typeof cursosSocioemocional.$inferSelect;
export type InsertCursoSocioemocional = typeof cursosSocioemocional.$inferInsert;
export type CursoEducacional = typeof cursosEducacional.$inferSelect;
export type InsertCursoEducacional = typeof cursosEducacional.$inferInsert;
export type CursoOperacional = typeof cursosOperacional.$inferSelect;
export type InsertCursoOperacional = typeof cursosOperacional.$inferInsert;
export type CursoGastronomia = typeof cursosGastronomia.$inferSelect;
export type InsertCursoGastronomia = typeof cursosGastronomia.$inferInsert;
export type AppSecret = typeof appSecrets.$inferSelect;
export type InsertAppSecret = typeof appSecrets.$inferInsert;

// Schemas para validação
export const insertPsicoInclusaoVinculoSchema = createInsertSchema(psicoInclusaoVinculo).omit({
  id: true,
  createdAt: true,
});

export const insertPsicoPecVinculoSchema = createInsertSchema(psicoPecVinculo).omit({
  id: true,
  createdAt: true,
});

export const insertIndicadoresPsicoAtencaoSocialSchema = createInsertSchema(indicadoresPsicoAtencaoSocial).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertIndicadoresPsicoMetodoGritoSchema = createInsertSchema(indicadoresPsicoMetodoGrito).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCursoTecnologiaSchema = createInsertSchema(cursosTecnologia).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCursoBelezaSchema = createInsertSchema(cursosBeleza).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCursoArtesanatoSchema = createInsertSchema(cursosArtesanato).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCursoEmpreendedorismoSchema = createInsertSchema(cursosEmpreendedorismo).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCursoAdministrativoSchema = createInsertSchema(cursosAdministrativo).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCursoSocioemocionalSchema = createInsertSchema(cursosSocioemocional).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// ================ CONSELHO - DADOS REALIZADOS MENSAIS ================
// Armazena dados financeiros realizados mensais por departamento para a tela do Conselho
export const conselhoDadosRealizados = pgTable("conselho_dados_realizados", {
  id: serial("id").primaryKey(),
  ano: integer("ano").notNull(),
  mes: integer("mes").notNull(), // 1-12
  departamento: text("departamento").notNull(), // Nome do departamento ou "TOTAL" para totais gerais
  contasAReceber: decimal("contas_a_receber", { precision: 12, scale: 2 }).default("0"),
  contasAPagar: decimal("contas_a_pagar", { precision: 12, scale: 2 }).default("0"),
  saldo: decimal("saldo", { precision: 12, scale: 2 }).default("0"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Types
export type ConselhoDadosRealizados = typeof conselhoDadosRealizados.$inferSelect;
export type InsertConselhoDadosRealizados = typeof conselhoDadosRealizados.$inferInsert;

// Schema para validação
export const insertConselhoDadosRealizadosSchema = createInsertSchema(conselhoDadosRealizados).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// ================ CONSELHO - DADOS REALIZADOS ANUAIS ================
// Armazena totais financeiros anuais por departamento (valores diretos, não calculados)
// Estes são os "números grandes" que aparecem nos gráficos do Conselho
export const conselhoDadosRealizadosAnual = pgTable("conselho_dados_realizados_anual", {
  id: serial("id").primaryKey(),
  ano: integer("ano").notNull(),
  departamento: text("departamento").notNull(), // Nome do departamento
  contasAReceber: decimal("contas_a_receber", { precision: 14, scale: 2 }).default("0"),
  contasAPagar: decimal("contas_a_pagar", { precision: 14, scale: 2 }).default("0"),
  saldo: decimal("saldo", { precision: 14, scale: 2 }).default("0"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Types
export type ConselhoDadosRealizadosAnual = typeof conselhoDadosRealizadosAnual.$inferSelect;
export type InsertConselhoDadosRealizadosAnual = typeof conselhoDadosRealizadosAnual.$inferInsert;

// Schema para validação
export const insertConselhoDadosRealizadosAnualSchema = createInsertSchema(conselhoDadosRealizadosAnual).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// ================ CONSELHO - METAS MENSAIS ================
// Armazena metas financeiras mensais por departamento para comparação com realizados
export const conselhoMetasMensais = pgTable("conselho_metas_mensais", {
  id: serial("id").primaryKey(),
  ano: integer("ano").notNull(),
  mes: integer("mes").notNull(), // 1-12
  departamento: text("departamento").notNull(), // Nome do departamento
  metaContasAReceber: decimal("meta_contas_a_receber", { precision: 12, scale: 2 }).default("0"),
  metaContasAPagar: decimal("meta_contas_a_pagar", { precision: 12, scale: 2 }).default("0"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Types
export type ConselhoMetasMensais = typeof conselhoMetasMensais.$inferSelect;
export type InsertConselhoMetasMensais = typeof conselhoMetasMensais.$inferInsert;

// Schema para validação
export const insertConselhoMetasMensaisSchema = createInsertSchema(conselhoMetasMensais).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// ================ COORDENADORES - SISTEMA DE LOGIN ================
// Tabela independente de coordenadores (sem vínculo com users)
// Banco: Digital Ocean (não está no Neon)
export const coordenadores = pgTable("coordenadores", {
  id: serial("id").primaryKey(),
  nome: text("nome").notNull(), // "Coordenador Psico", "Coordenador PEC", "Coordenador Inclusão Produtiva"
  email: text("email").notNull(), // UNIQUE(email, programa) - constraint no banco
  passwordHash: text("password_hash").notNull(), // Hash bcrypt da senha
  telefone: text("telefone"),
  formacao: text("formacao"), // Registro profissional
  setor: text("setor").notNull(), // psicossocial, esporte_cultura, inclusao_produtiva, tecnica_psico, negocios_sociais, almoxarifado
  redirectPath: text("redirect_path").notNull().default("/coordenador"), // rota de redirecionamento
  ativo: boolean("ativo").default(true),
  primeiroAcesso: boolean("primeiro_acesso").default(false),
  dataAdmissao: date("data_admissao"),
  dataDesligamento: date("data_desligamento"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Types
export type Coordenador = typeof coordenadores.$inferSelect;
export type InsertCoordenador = typeof coordenadores.$inferInsert;

// Schema para validação
export const insertCoordenadorSchema = createInsertSchema(coordenadores).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// ================ MONITORES - SISTEMA DE LOGIN ================
// Tabela independente de monitores (sem vínculo com users)
// Banco: Digital Ocean (não está no Neon)
export const monitores = pgTable("monitores", {
  id: serial("id").primaryKey(),
  nome: text("nome").notNull(),
  email: text("email").notNull(), // UNIQUE(email, programa) - constraint no banco
  passwordHash: text("password_hash").notNull(), // Hash bcrypt da senha
  telefone: text("telefone"),
  programa: text("programa").notNull(), // 'pec', 'inclusao_produtiva', 'psicossocial'
  redirectPath: text("redirect_path").notNull().default("/monitor"),
  ativo: boolean("ativo").default(true),
  dataAdmissao: date("data_admissao"),
  dataDesligamento: date("data_desligamento"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  termosUsoVersao: text("termos_uso_versao"),
  termosUsoAceitoEm: timestamp("termos_uso_aceito_em"),
  termosIp: text("termos_ip"),
  termosUserAgent: text("termos_user_agent"),
});

// Types
export type Monitor = typeof monitores.$inferSelect;
export type InsertMonitor = typeof monitores.$inferInsert;

// Schema para validação
export const insertMonitorSchema = createInsertSchema(monitores).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// ================ PROFESSORES - SISTEMA DE LOGIN ================
// Tabela independente de professores (sem vínculo com users)
// Banco: Digital Ocean (não está no Neon)
export const professores = pgTable("professores", {
  id: serial("id").primaryKey(),
  nome: text("nome").notNull(),
  email: text("email").notNull(), // UNIQUE(email, programa) - constraint no banco
  passwordHash: text("password_hash").notNull(),
  telefone: text("telefone"),
  programa: text("programa").notNull(), // 'pec', 'inclusao_produtiva', 'psicossocial'
  redirectPath: text("redirect_path").notNull().default("/professor"),
  ativo: boolean("ativo").default(true),
  dataAdmissao: date("data_admissao"),
  dataDesligamento: date("data_desligamento"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  termosUsoVersao: text("termos_uso_versao"),
  termosUsoAceitoEm: timestamp("termos_uso_aceito_em"),
  termosIp: text("termos_ip"),
  termosUserAgent: text("termos_user_agent"),
});

// Types
export type Professor = typeof professores.$inferSelect;
export type InsertProfessor = typeof professores.$inferInsert;

// Schema para validação
export const insertProfessorSchema = createInsertSchema(professores).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// ================ PROFESSOR-TURMA VINCULAÇÃO ================
export const professorTurmas = pgTable("professor_turmas", {
  id: serial("id").primaryKey(),
  professorId: integer("professor_id").notNull(),
  turmaId: integer("turma_id").notNull(),
  turmaTipo: text("turma_tipo").notNull(), // 'pec' or 'inclusao'
  cor: text("cor"),
  icone: text("icone"),
  criadoEm: timestamp("criado_em").defaultNow(),
});

export type ProfessorTurma = typeof professorTurmas.$inferSelect;
export type InsertProfessorTurma = typeof professorTurmas.$inferInsert;

// ================ MARKETING - SISTEMA DE LOGIN ================
// Tabela independente de usuários de marketing
export const marketingUsers = pgTable("marketing_users", {
  id: serial("id").primaryKey(),
  nome: text("nome").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  telefone: text("telefone"),
  cargo: text("cargo"), // 'gestor', 'analista', 'assistente'
  ativo: boolean("ativo").default(true),
  dataAdmissao: date("data_admissao"),
  dataDesligamento: date("data_desligamento"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Types
export type MarketingUser = typeof marketingUsers.$inferSelect;
export type InsertMarketingUser = typeof marketingUsers.$inferInsert;

// Schema para validação
export const insertMarketingUserSchema = createInsertSchema(marketingUsers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// ================ NEGÓCIOS SOCIAIS - INDICADORES ================
// Armazena dados de impacto dos negócios sociais (Outlet e Griffte)
export const negociosSociaisDados = pgTable("negocios_sociais_dados", {
  id: serial("id").primaryKey(),
  ano: integer("ano").notNull().default(2025),
  mes: integer("mes"), // Null para dados anuais, 1-12 para dados mensais
  // Outlet
  outletDoacoesRecebidas: integer("outlet_doacoes_recebidas").default(0),
  outletVendasPessoasImpactadas: integer("outlet_vendas_pessoas_impactadas").default(0),
  outletPecasVendidas: integer("outlet_pecas_vendidas").default(0),
  // Griffte
  grifftePecasConfeccionadas: integer("griffte_pecas_confeccionadas").default(0),
  griffteClientesAtendidos: integer("griffte_clientes_atendidos").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Types
export type NegociosSociaisDados = typeof negociosSociaisDados.$inferSelect;
export type InsertNegociosSociaisDados = typeof negociosSociaisDados.$inferInsert;

// Schema para validação
export const insertNegociosSociaisDadosSchema = createInsertSchema(negociosSociaisDados).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// ================ PEC - POLO ESPORTIVO CULTURAL ================
// Armazena dados dos 3 programas do PEC (Casa Sonhar, Programa de Esporte e Cultura, Serenata)
export const pecDados = pgTable("pec_dados", {
  id: serial("id").primaryKey(),
  ano: integer("ano").notNull().default(2025),
  mes: integer("mes"), // Null para dados anuais, 1-12 para dados mensais
  // Casa Sonhar
  casaSonharAtendidos: integer("casa_sonhar_atendidos").default(0),
  casaSonharAtendimentos: integer("casa_sonhar_atendimentos").default(0),
  casaSonharFrequencia: numeric("casa_sonhar_frequencia", { precision: 5, scale: 2 }).default("0"), // Ex: 80.60
  casaSonharAlimentacao: integer("casa_sonhar_alimentacao").default(0),
  casaSonharHoraAula: numeric("casa_sonhar_hora_aula", { precision: 10, scale: 2 }).default("0"), // Ex: 2729.75
  // Programa de Esporte e Cultura
  programaEsporteCulturaAtendidos: integer("programa_esporte_cultura_atendidos").default(0),
  programaEsporteCulturaHoraAula: numeric("programa_esporte_cultura_hora_aula", { precision: 10, scale: 2 }).default("0"),
  programaEsporteCulturaAtendimentos: integer("programa_esporte_cultura_atendimentos").default(0),
  programaEsporteCulturaAlimentacao: integer("programa_esporte_cultura_alimentacao").default(0),
  programaEsporteCulturaFrequencia: numeric("programa_esporte_cultura_frequencia", { precision: 5, scale: 2 }).default("0"),
  // Serenata
  serenataAtendidos: integer("serenata_atendidos").default(0),
  serenataAtendimentos: integer("serenata_atendimentos").default(0),
  serenataHoraAula: numeric("serenata_hora_aula", { precision: 10, scale: 2 }).default("0"),
  serenataFrequencia: numeric("serenata_frequencia", { precision: 5, scale: 2 }).default("0"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Types
export type PecDados = typeof pecDados.$inferSelect;
export type InsertPecDados = typeof pecDados.$inferInsert;

// Schema para validação
export const insertPecDadosSchema = createInsertSchema(pecDados).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// ================ INCLUSÃO PRODUTIVA - INDICADORES ================
// Armazena dados dos 3 programas de Inclusão Produtiva (LAB, Presencial, EAD)
export const inclusaoProdutivaDados = pgTable("inclusao_produtiva_dados", {
  id: serial("id").primaryKey(),
  ano: integer("ano").notNull().default(2025),
  mes: integer("mes"), // Null para dados anuais, 1-12 para dados mensais
  // LAB. VOZES DO FUTURO
  labHoraAula: numeric("lab_hora_aula", { precision: 10, scale: 2 }).default("0"),
  labAtendimentos: integer("lab_atendimentos").default(0),
  labLanche: integer("lab_lanche").default(0),
  labFrequencia: numeric("lab_frequencia", { precision: 5, scale: 2 }).default("0"),
  labEmpregados: integer("lab_empregados").default(0),
  labEmpreendedores: integer("lab_empreendedores").default(0),
  labAtendidos: integer("lab_atendidos").default(0),
  labEvasao: integer("lab_evasao").default(0),
  // CURSOS PRESENCIAIS
  presencialHoraAula: numeric("presencial_hora_aula", { precision: 10, scale: 2 }).default("0"),
  presencialAtendimentos: integer("presencial_atendimentos").default(0),
  presencialLanche: integer("presencial_lanche").default(0),
  presencialFrequencia: numeric("presencial_frequencia", { precision: 5, scale: 2 }).default("0"),
  presencialEmpregados: integer("presencial_empregados").default(0),
  presencialEmpreendedores: integer("presencial_empreendedores").default(0),
  presencialAtendidos: integer("presencial_atendidos").default(0),
  presencialEvasao: integer("presencial_evasao").default(0),
  // CURSOS EAD CGD (ONLINE)
  eadHoraAula: numeric("ead_hora_aula", { precision: 10, scale: 2 }).default("0"),
  eadAtendimentos: integer("ead_atendimentos").default(0),
  eadLanche: integer("ead_lanche").default(0),
  eadFrequencia: numeric("ead_frequencia", { precision: 5, scale: 2 }).default("0"),
  eadEmpregados: integer("ead_empregados").default(0),
  eadEmpreendedores: integer("ead_empreendedores").default(0),
  eadAtendidos: integer("ead_atendidos").default(0),
  eadEvasao: integer("ead_evasao").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Types
export type InclusaoProdutivaDados = typeof inclusaoProdutivaDados.$inferSelect;
export type InsertInclusaoProdutivaDados = typeof inclusaoProdutivaDados.$inferInsert;

// Schema para validação
export const insertInclusaoProdutivaDadosSchema = createInsertSchema(inclusaoProdutivaDados).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// ================ PUSH NOTIFICATIONS - DEVICE TOKENS ================
// Armazena tokens de dispositivos para Firebase Cloud Messaging

export const platformEnum = pgEnum("platform_enum", ["web", "android", "ios"]);

export const deviceTokens = pgTable("device_tokens", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
  platform: text("platform").notNull(), // 'web', 'android', 'ios'
  token: text("token").notNull().unique(),
  subscriptionStatus: text("subscription_status").default("active"), // 'active', 'expired', 'revoked'
  lastSeenAt: timestamp("last_seen_at").defaultNow(),
  revokedAt: timestamp("revoked_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Tabela para histórico de notificações enviadas
export const pushNotifications = pgTable("push_notifications", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  data: jsonb("data"), // dados adicionais (url, tipo, etc)
  targetType: text("target_type").notNull(), // 'all', 'topic', 'user', 'users'
  targetValue: text("target_value"), // topic name, user id, etc
  sentBy: integer("sent_by").references(() => users.id),
  sentAt: timestamp("sent_at").defaultNow(),
  successCount: integer("success_count").default(0),
  failureCount: integer("failure_count").default(0),
});

// Types
export type DeviceToken = typeof deviceTokens.$inferSelect;
export type InsertDeviceToken = typeof deviceTokens.$inferInsert;
export type PushNotification = typeof pushNotifications.$inferSelect;
export type InsertPushNotification = typeof pushNotifications.$inferInsert;

// Schema para validação
export const insertDeviceTokenSchema = createInsertSchema(deviceTokens).omit({
  id: true,
  lastSeenAt: true,
  revokedAt: true,
  createdAt: true,
});

export const insertPushNotificationSchema = createInsertSchema(pushNotifications).omit({
  id: true,
  sentAt: true,
  successCount: true,
  failureCount: true,
});

// ================ IN-APP NOTIFICATIONS ================
// Notificações que aparecem DENTRO do app (cards interativos)

export const inAppNotifications = pgTable("in_app_notifications", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  // Botão primário (amarelo)
  primaryButtonText: text("primary_button_text"),
  primaryButtonAction: text("primary_button_action"), // URL ou rota do app (ex: /perfil, /editar-dados)
  // Botão secundário (preto)
  secondaryButtonText: text("secondary_button_text"),
  secondaryButtonAction: text("secondary_button_action"), // 'dismiss' ou rota
  // Configurações
  targetAudience: text("target_audience").default("all"), // 'all', 'donors', 'no_email', 'no_subscription'
  priority: integer("priority").default(1), // 1-10, maior = mais importante
  progressDuration: integer("progress_duration").default(5), // segundos para a barra encher
  // Status
  active: boolean("active").default(true),
  expiresAt: timestamp("expires_at"),
  // Enviar também como push?
  sendAsPush: boolean("send_as_push").default(false),
  pushSentAt: timestamp("push_sent_at"),
  // Tipo de notificação: normal ou com requisito (ex: pedir e-mail)
  notificationType: text("notification_type").default("normal"), // 'normal', 'email_required'
  // Rotas bloqueadas até o requisito ser atendido (JSON array)
  blockedRoutes: text("blocked_routes"), // JSON array ex: ["/beneficios", "/missoes"]
  // Campo de input para coletar (apenas para tipos com requisito)
  requirementField: text("requirement_field"), // 'email', 'telefone', etc
  // Agendamento
  scheduledAt: timestamp("scheduled_at"),
  // Tracking
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Rastrear quais usuários viram/dispensaram cada notificação
export const inAppNotificationDismissals = pgTable("in_app_notification_dismissals", {
  id: serial("id").primaryKey(),
  notificationId: integer("notification_id").references(() => inAppNotifications.id, { onDelete: "cascade" }).notNull(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  action: text("action").notNull(), // 'dismissed', 'clicked_primary', 'clicked_secondary'
  dismissedAt: timestamp("dismissed_at").defaultNow(),
});

// Types
export type InAppNotification = typeof inAppNotifications.$inferSelect;
export type InsertInAppNotification = typeof inAppNotifications.$inferInsert;
export type InAppNotificationDismissal = typeof inAppNotificationDismissals.$inferSelect;
export type InsertInAppNotificationDismissal = typeof inAppNotificationDismissals.$inferInsert;

// Schema para validação
export const insertInAppNotificationSchema = createInsertSchema(inAppNotifications).omit({
  id: true,
  pushSentAt: true,
  createdAt: true,
  updatedAt: true,
});

export const insertInAppNotificationDismissalSchema = createInsertSchema(inAppNotificationDismissals).omit({
  id: true,
  dismissedAt: true,
});

// ================ DOCUMENTOS DE ALUNOS/PARTICIPANTES ================
// Tabela para armazenar múltiplos documentos por aluno (PEC) ou participante (Inclusão Produtiva)
export const documentosParticipante = pgTable("documentos_participante", {
  id: serial("id").primaryKey(),

  nomeArquivo: text("nome_arquivo").notNull(),
  tipoDocumento: text("tipo_documento"),
  urlArquivo: text("url_arquivo").notNull(),
  tamanhoBytes: integer("tamanho_bytes"),
  mimeType: text("mime_type"),

  // PEC
  alunoCpf: text("aluno_cpf"),

  // Inclusão
  participanteInclusaoId: integer("participante_inclusao_id")
    .references(() => participantesInclusao.id, { onDelete: "cascade" }),

  // Cadastro unificado (Fase 4)
  atendidoCpf: text("atendido_cpf"),

  uploadedBy: integer("uploaded_by").references(() => users.id),

  createdAt: timestamp("created_at").defaultNow(),
});

// Types
export type DocumentoParticipante = typeof documentosParticipante.$inferSelect;
export type InsertDocumentoParticipante = typeof documentosParticipante.$inferInsert;

// Schema para validação
export const insertDocumentoParticipanteSchema = createInsertSchema(documentosParticipante).omit({
  id: true,
  createdAt: true,
});

// Tabela para armazenar perfis de monitor separados por vertente
export const monitorPerfis = pgTable("monitor_perfis", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  vertente: text("vertente").notNull(), // 'pec', 'inclusao'
  nome: text("nome").notNull(),
  email: text("email"),
  telefone: text("telefone"),
  areaAtuacao: text("area_atuacao"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Types
export type MonitorPerfil = typeof monitorPerfis.$inferSelect;
export type InsertMonitorPerfil = typeof monitorPerfis.$inferInsert;

// Tabela para login de professores separado por vertente
export const professorLogins = pgTable("professor_logins", {
  id: serial("id").primaryKey(),
  nome: text("nome").notNull(),
  email: text("email").notNull(),
  passwordHash: text("password_hash").notNull(),
  telefone: text("telefone"),
  vertente: text("vertente").notNull(), // 'pec', 'inclusao'
  redirectPath: text("redirect_path").notNull().default("/professor"),
  ativo: boolean("ativo").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Types
export type ProfessorLogin = typeof professorLogins.$inferSelect;
export type InsertProfessorLogin = typeof professorLogins.$inferInsert;

export const registrosConfidenciais = pgTable("registros_confidenciais", {
  id: serial("id").primaryKey(),
  monitorUserId: integer("monitor_user_id").references(() => users.id).notNull(),
  vertente: text("vertente").notNull(),
  tipo: text("tipo").notNull(),
  titulo: text("titulo"),
  conteudo: text("conteudo").notNull(),
  participanteNome: text("participante_nome"),
  participanteId: integer("participante_id"),
  participanteCpf: text("participante_cpf"),
  participanteOrigem: text("participante_origem"),
  participanteDataNascimento: text("participante_data_nascimento"),
  data: date("data").notNull(),
  status: text("status").default("ativo"),
  confidencial: boolean("confidencial").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type RegistroConfidencial = typeof registrosConfidenciais.$inferSelect;
export type InsertRegistroConfidencial = typeof registrosConfidenciais.$inferInsert;

export const psicoRegistrosConfidenciais = pgTable("psico_registros_confidenciais", {
  id: serial("id").primaryKey(),
  criadoPorUserId: integer("criado_por_user_id").notNull(),
  criadoPorRole: text("criado_por_role").default("monitor").notNull(),
  vertente: text("vertente").notNull().default("todos"),
  tipo: text("tipo").notNull(),
  titulo: text("titulo"),
  conteudo: text("conteudo").notNull(),
  participanteNome: text("participante_nome"),
  participanteId: integer("participante_id"),
  participanteCpf: text("participante_cpf"),
  participanteDataNascimento: text("participante_data_nascimento"),
  data: date("data").notNull(),
  status: text("status").default("ativo"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type PsicoRegistroConfidencial = typeof psicoRegistrosConfidenciais.$inferSelect;
export type InsertPsicoRegistroConfidencial = typeof psicoRegistrosConfidenciais.$inferInsert;

export const psicoRegistros = pgTable("psico_registros", {
  id: serial("id").primaryKey(),
  criadoPorUserId: integer("criado_por_user_id").notNull(),
  criadoPorRole: text("criado_por_role").default("monitor").notNull(),
  vertente: text("vertente").notNull().default("todos"),
  tipo: text("tipo").notNull(),
  categoria: text("categoria"),
  conteudo: text("conteudo").notNull(),
  participanteNome: text("participante_nome"),
  participanteCpf: text("participante_cpf"),
  colaboradoresIds: text("colaboradores_ids"),
  data: date("data").notNull(),
  status: text("status").default("ativo"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type PsicoRegistro = typeof psicoRegistros.$inferSelect;
export type InsertPsicoRegistro = typeof psicoRegistros.$inferInsert;

export const psicoAtendidosComunidade = pgTable("psico_atendidos_comunidade", {
  id: serial("id").primaryKey(),
  nome: text("nome").notNull(),
  cpf: text("cpf"),
  dataNascimento: date("data_nascimento"),
  telefone: text("telefone"),
  endereco: text("endereco"),
  observacoes: text("observacoes"),
  coordenadorId: integer("coordenador_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// TABELAS DE GERAÇÃO DE RENDA INCLUSÃO

// Tabela de Geração de Renda
export const inclusaoGeracaoDeRenda = pgTable("inclusao_geracao_de_renda", {
  id: serial("id").primaryKey(),
  tipo: text("tipo").notNull(), // 'empregabilidade' ou 'empreendedorismo'
  status: text("status").default("ativo"), // Ex: "ativo", "pendente", "em análise"
  participanteInclusaoId: integer("participante_inclusao_id").references(() => participantesInclusao.id), // FK para o participante
  cpf: text("cpf").notNull(),
  nome: text("nome").notNull(),
  telefone: text("telefone").notNull(),
  email: text("email").notNull(),
  genero: text("genero").notNull(),
  raca: text("raca"),
  dataNascimento: timestamp("data_nascimento"),
  idade: integer("idade"),
  escolaridade: text("escolaridade"),

  // Campos específicos de Empregabilidade
  empresa: text("empresa"),
  cargo: text("cargo"),
  tipoContrato: text("tipo_contrato"),
  dataContratacao: timestamp("data_contratacao"),
  faixaSalarial: text("faixa_salarial"),

  // Campos específicos de Empreendedorismo
  nomeNegocio: text("nome_negocio"),
  segmento: text("segmento"),
  formalizado: text("formalizado"),
  cnpj: text("cnpj"),
  canalVendas: text("canal_vendas"),
  faturamentoAproximado: text("faturamento_aproximado"),
  dataInicioAtividade: timestamp("data_inicio_atividade"),

  observacoes: text("observacoes"),

  // Padrão GF
  padraoGf: boolean("padrao_gf").default(false),

  // Vínculo com programa de Inclusão Produtiva
  programaId: integer("programa_id"),

  // Auditoria
  criadoEm: timestamp("criado_em").defaultNow(),
  atualizadoEm: timestamp("atualizado_em").defaultNow(),
});

// Tabela de Evidências de Geração de Renda
export const inclusaoGeracaoRendaEvidencias = pgTable("inclusao_geracao_renda_evidencias", {
  id: serial("id").primaryKey(),
  inclusaoGeracaoDeRendaId: integer("inclusao_geracao_de_renda_id")
    .references(() => inclusaoGeracaoDeRenda.id, { onDelete: 'cascade' }),
  nomeArquivo: text("nome_arquivo").notNull(),
  storageUrl: text("storage_url").notNull(), // URL do arquivo no GCS
  mimeType: text("mime_type").notNull(), // Tipo MIME do arquivo (ex: image/jpeg)
  tamanhoBytes: integer("tamanho_bytes").notNull(), // Tamanho do arquivo em bytes
  criadoEm: timestamp("criado_em").defaultNow(),
});

// Definição de esquema de validação (caso você precise no backend/frontend)
export const cadastroGeracaoRendaSchema = z.object({
  tipo: z.enum(["empregabilidade", "empreendedorismo"]),
  cpf: z.string().min(1),
  nome: z.string().min(1),
  telefone: z.string().min(1),
  email: z.string().min(1),
  genero: z.string().min(1),
  escolaridade: z.string().min(1),
  empresa: z.string().optional(),
  cargo: z.string().optional(),
  tipoContrato: z.string().optional(),
  dataContratacao: z.string().optional(),
  faixaSalarial: z.string().optional(),
  nomeNegocio: z.string().optional(),
  segmento: z.string().optional(),
  formalizado: z.string().optional(),
  cnpj: z.string().optional(),
  canalVendas: z.string().optional(),
  faturamentoAproximado: z.string().optional(),
  dataInicioAtividade: z.string().optional(),
  observacoes: z.string().optional(),
  evidencias: z.array(z.string()), // URL dos arquivos (evidências)
});

export type PsicoAtendidoComunidade = typeof psicoAtendidosComunidade.$inferSelect;
export type InsertPsicoAtendidoComunidade = typeof psicoAtendidosComunidade.$inferInsert;


// ============================================================
// NOVA ESTRUTURA: Aulas e Presenças (com suporte à Catraca)
// ============================================================

export const aulas = pgTable("aulas", {
  id: serial("id").primaryKey(),
  modulo: varchar("modulo", { length: 20 }).notNull(), // pec | inclusao | psico
  turmaId: integer("turma_id"),
  nome: varchar("nome", { length: 200 }),
  data: date("data").notNull(),
  startTime: varchar("start_time", { length: 8 }).notNull(), // HH:MM:SS
  endTime: varchar("end_time", { length: 8 }).notNull(),
  status: varchar("status", { length: 20 }).notNull().default("aberta"), // aberta | em_andamento | finalizada
  unidade: varchar("unidade", { length: 100 }),
  criadoPor: integer("criado_por"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const presencasAula = pgTable("presencas_aula", {
  id: serial("id").primaryKey(),
  aulaId: integer("aula_id").notNull().references(() => aulas.id, { onDelete: "cascade" }),
  cpf: varchar("cpf", { length: 11 }).notNull(),
  participanteId: integer("participante_id"),
  checkInAt: timestamp("check_in_at"),
  checkOutAt: timestamp("check_out_at"),
  fonte: varchar("fonte", { length: 20 }).default("manual"), // catraca | manual
  status: varchar("status", { length: 30 }).default("presente"), // presente | ausente | justificativa
  observacoes: text("observacoes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export type Aula = typeof aulas.$inferSelect;
export type InsertAula = typeof aulas.$inferInsert;
export type PresencaAula = typeof presencasAula.$inferSelect;
export type InsertPresencaAula = typeof presencasAula.$inferInsert;

// ============================================================
// DEMANDAS ESPONTÂNEAS — Atendimento psicossocial avulso
// ============================================================
export const demandasEspontaneas = pgTable("demandas_espontaneas", {
  id: serial("id").primaryKey(),
  responsavel: varchar("responsavel", { length: 100 }).notNull(),
  dataAtendimento: date("data_atendimento").notNull(),
  tipoAtendimento: varchar("tipo_atendimento", { length: 100 }).notNull(),
  encaminhamentoOrigem: text("encaminhamento_origem").array().notNull().default(sql`'{}'`),
  encaminhamentoOrigemOutro: varchar("encaminhamento_origem_outro", { length: 255 }),
  nomeAtendido: varchar("nome_atendido", { length: 200 }).notNull(),
  sexo: varchar("sexo", { length: 50 }).notNull(),
  idade: integer("idade").notNull(),
  bairro: varchar("bairro", { length: 100 }).notNull(),
  bairroOutro: varchar("bairro_outro", { length: 100 }),
  cep: varchar("cep", { length: 9 }),
  endereco: text("endereco"),
  demanda: text("demanda").notNull(),
  encaminhamentosRealizados: text("encaminhamentos_realizados").array().notNull().default(sql`'{}'`),
  registroProfissional: text("registro_profissional").notNull(),
  criadoPorUserId: integer("criado_por_user_id"),
  criadoPorRole: varchar("criado_por_role", { length: 50 }),
  createdAt: timestamp("created_at").defaultNow(),
});

export type DemandaEspontanea = typeof demandasEspontaneas.$inferSelect;
export type InsertDemandaEspontanea = typeof demandasEspontaneas.$inferInsert;

// ── Instagram Metrics ─────────────────────────────────────────────────────────
export const instagramMetrics = pgTable("instagram_metrics", {
  id: serial("id").primaryKey(),
  date: timestamp("date").notNull(),
  periodLabel: text("period_label").notNull().default("morning"), // "morning" | "evening"
  followersTotal: integer("followers_total").default(0),
  followersGained: integer("followers_gained").default(0),
  followersLost: integer("followers_lost").default(0),
  mediaCount: integer("media_count").default(0),
  reach: integer("reach").default(0),
  profileViews: integer("profile_views").default(0),
  websiteClicks: integer("website_clicks").default(0),
  accountsEngaged: integer("accounts_engaged").default(0),
  source: text("source").default("instagram_graph_api"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type InstagramMetric = typeof instagramMetrics.$inferSelect;
export type InsertInstagramMetric = typeof instagramMetrics.$inferInsert;

// ── Metas e Indicadores ────────────────────────────────────────────────────────
export const metasIndicadores = pgTable("metas_indicadores", {
  id: serial("id").primaryKey(),
  ano: integer("ano").notNull(),
  vertente: varchar("vertente", { length: 20 }).notNull(), // 'pec' | 'inclusao' | 'psico'
  indicador: varchar("indicador", { length: 50 }).notNull(),
  meta: numeric("meta").notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type MetaIndicador = typeof metasIndicadores.$inferSelect;
export type InsertMetaIndicador = typeof metasIndicadores.$inferInsert;

// ── Eventos Grito ─────────────────────────────────────────────────────────────
export const eventosGrito = pgTable("eventos_grito", {
  id: serial("id").primaryKey(),
  titulo: text("titulo").notNull(),
  descricao: text("descricao"),
  bannerUrl: text("banner_url"),
  dataInicio: timestamp("data_inicio").notNull(),
  dataFim: timestamp("data_fim"),
  horaInicio: text("hora_inicio"),
  horaFim: text("hora_fim"),
  local: text("local"),
  endereco: text("endereco"),
  cidade: text("cidade").default("Belo Horizonte"),
  estado: text("estado").default("MG"),
  capacidade: integer("capacidade"),
  status: text("status").notNull().default("em_breve"), // disponivel | em_breve | encerrado
  gratuito: boolean("gratuito").default(true),
  preco: integer("preco").default(0),
  categoria: text("categoria").default("cultura"), // cultura | esporte | formacao | saude | outro
  criadoPor: integer("criado_por").references(() => users.id),
  criadoEm: timestamp("criado_em").defaultNow().notNull(),
  atualizadoEm: timestamp("atualizado_em").defaultNow().notNull(),
});

export type EventoGrito = typeof eventosGrito.$inferSelect;
export type InsertEventoGrito = typeof eventosGrito.$inferInsert;
export const insertEventoGritoSchema = createInsertSchema(eventosGrito).omit({
  id: true,
  criadoEm: true,
  atualizadoEm: true,
});

// ==============================
// Portal Público de Eventos
// ==============================

export const usuariosPortal = pgTable("usuarios_portal", {
  id: serial("id").primaryKey(),
  nome: text("nome").notNull(),
  email: text("email").notNull(),
  senhaHash: text("senha_hash").notNull(),
  dataNascimento: date("data_nascimento"),
  genero: text("genero"),
  cep: text("cep"),
  logradouro: text("logradouro"),
  numero: text("numero"),
  complemento: text("complemento"),
  bairro: text("bairro"),
  cidade: text("cidade"),
  estado: text("estado"),
  cpf: text("cpf"),
  fotoUrl: text("foto_url"),
  criadoEm: timestamp("criado_em").defaultNow().notNull(),
});

export type UsuarioPortal = typeof usuariosPortal.$inferSelect;
export type InsertUsuarioPortal = typeof usuariosPortal.$inferInsert;

export const ingressosPortal = pgTable("ingressos_portal", {
  id: serial("id").primaryKey(),
  eventoId: integer("evento_id").references(() => eventosGrito.id),
  codigo: text("codigo").notNull(),
  status: text("status").default("disponivel"), // disponivel | reservado | resgatado | usado | cancelado
  // Titular — quem resgatou
  usuarioPortalId: integer("usuario_portal_id").references(() => usuariosPortal.id),
  titularNome: text("titular_nome"),
  titularCpf: text("titular_cpf"),
  titularEmail: text("titular_email"),
  titularTelefone: text("titular_telefone"),
  // Beneficiário — se o ingresso for para terceiro
  paraTerceiro: boolean("para_terceiro").default(false),
  beneficiarioNome: text("beneficiario_nome"),
  beneficiarioCpf: text("beneficiario_cpf"),
  beneficiarioEmail: text("beneficiario_email"),
  beneficiarioTelefone: text("beneficiario_telefone"),
  beneficiarioNascimento: date("beneficiario_nascimento"),
  beneficiarioGenero: text("beneficiario_genero"),
  beneficiarioLogradouro: text("beneficiario_logradouro"),
  beneficiarioNumero: text("beneficiario_numero"),
  beneficiarioBairro: text("beneficiario_bairro"),
  beneficiarioCidade: text("beneficiario_cidade"),
  beneficiarioEstado: text("beneficiario_estado"),
  beneficiarioCep: text("beneficiario_cep"),
  // Reserva / pagamento
  orderRef: text("order_ref"),
  reservedUntil: timestamp("reserved_until"),
  metodoPagamento: text("metodo_pagamento"),
  gateway: text("gateway"),
  paymentId: text("payment_id"),
  valorPago: integer("valor_pago"),
  parcelas: integer("parcelas"),
  // Controle
  resgatadoEm: timestamp("resgatado_em"),
  checkinEm: timestamp("checkin_em"),
  criadoEm: timestamp("criado_em").defaultNow().notNull(),
  // Transferência de ingresso
  transferenciaStatus: text("transferencia_status"), // null | 'pendente' | 'aceita' | 'cancelada'
  transferidoParaEmail: text("transferido_para_email"),
  transferidoParaNome: text("transferido_para_nome"),
  transferidoParaUserId: integer("transferido_para_user_id"),
  transferidoDeUserId: integer("transferido_de_user_id"),
  transferidoEm: timestamp("transferido_em"),
});

export type IngressoPortal = typeof ingressosPortal.$inferSelect;
export type InsertIngressoPortal = typeof ingressosPortal.$inferInsert;
export const insertIngressoPortalSchema = createInsertSchema(ingressosPortal).omit({ id: true, criadoEm: true });

// ========================
// FAVELA 3D
// ========================

export const favela3dParticipantes = pgTable("favela3d_participantes", {
  id: serial("id").primaryKey(),
  monitorUserId: integer("monitor_user_id").references(() => users.id),
  nome: text("nome").notNull(),
  cpf: text("cpf"),
  dataNascimento: date("data_nascimento"),
  genero: text("genero"),
  raca: text("raca"),
  telefone: text("telefone"),
  email: text("email"),
  cep: text("cep"),
  endereco: text("endereco"),
  numero: text("numero"),
  complemento: text("complemento"),
  bairro: text("bairro"),
  cidade: text("cidade"),
  estado: text("estado"),
  // IGF: Índice Gerando Falcões
  igf: text("igf"), // E1, E2, P1, P2, D
  // Benefícios sociais
  temCadUnico: text("tem_cad_unico"),
  temBolsaFamilia: text("tem_bolsa_familia"),
  temBpc: text("tem_bpc"),
  temCarteiraIdoso: text("tem_carteira_idoso"),
  situacaoProfissional: text("situacao_profissional"),
  // Família
  numeroPessoas: integer("numero_pessoas"),
  criancas: integer("criancas"),
  adolescentes: integer("adolescentes"),
  adultos: integer("adultos"),
  idosos: integer("idosos"),
  // Renda
  rendaTipo: text("renda_tipo"),
  // Escolaridade
  escolaridade: text("escolaridade"),
  serie: text("serie"),
  situacaoEscolar: text("situacao_escolar"),
  turnoEscolar: text("turno_escolar"),
  instituicaoEnsino: text("instituicao_ensino"),
  eAlfabetizado: text("e_alfabetizado"),
  bairroEscola: text("bairro_escola"),
  // Foto
  fotoUrl: text("foto_url"),
  // Entrada / Acesso
  dataEntrada: date("data_entrada"),
  formaAcesso: text("forma_acesso"),
  // Observações
  demandas: text("demandas"),
  observacoes: text("observacoes"),
  status: text("status").default("ativo"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type Favela3DParticipante = typeof favela3dParticipantes.$inferSelect;
export type InsertFavela3DParticipante = typeof favela3dParticipantes.$inferInsert;

export const favela3dRelacionamentos = pgTable("favela3d_relacionamentos", {
  id: serial("id").primaryKey(),
  participanteId: integer("participante_id").references(() => favela3dParticipantes.id),
  nome: text("nome").notNull(),
  parentesco: text("parentesco"),
  relacao: text("relacao"),
  renda: text("renda"),
  tipo: text("tipo").default("familiar"),
  createdAt: timestamp("created_at").defaultNow(),
});
export type Favela3DRelacionamento = typeof favela3dRelacionamentos.$inferSelect;
export type InsertFavela3DRelacionamento = typeof favela3dRelacionamentos.$inferInsert;

export const favela3dRegistros = pgTable("favela3d_registros", {
  id: serial("id").primaryKey(),
  monitorUserId: integer("monitor_user_id").references(() => users.id),
  participanteId: integer("participante_id").references(() => favela3dParticipantes.id),
  participanteNome: text("participante_nome"),
  participanteCpf: text("participante_cpf"),
  tipo: text("tipo").notNull(), // visita_domiciliar, atendimento_individual, atendimento_coletivo, encaminhamento
  titulo: text("titulo"),
  conteudo: text("conteudo").notNull(),
  data: date("data").notNull(),
  status: text("status").default("ativo"),
  categoria: text("categoria"), // gerando_lideranca, assembleia, grupo_mulheres, triangulo (para atendimento_coletivo)
  participantesIds: integer("participantes_ids").array(), // IDs para atendimento coletivo
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type Favela3DRegistro = typeof favela3dRegistros.$inferSelect;
export type InsertFavela3DRegistro = typeof favela3dRegistros.$inferInsert;

// ========================
// EVENT PAYMENT ORDERS
// ========================

export const eventPaymentOrders = pgTable("event_payment_orders", {
  id: serial("id").primaryKey(),
  eventoId: integer("evento_id").references(() => eventosGrito.id),
  usuarioPortalId: integer("usuario_portal_id").references(() => usuariosPortal.id),
  orderRef: text("order_ref").notNull().unique(),
  idempotencyKey: text("idempotency_key").unique(),
  metodoPagamento: text("metodo_pagamento").notNull(),
  quantidade: integer("quantidade").notNull().default(1),
  valorTotal: integer("valor_total").notNull(),
  parcelas: integer("parcelas").default(1),
  status: text("status").notNull().default("created"), // created | reserved | pending | processing | paid | fulfilling | fulfilled | expired | error
  cieloPaymentId: text("cielo_payment_id"),
  cieloStatus: integer("cielo_status"),
  titularNome: text("titular_nome").notNull(),
  titularCpf: text("titular_cpf").notNull(),
  titularEmail: text("titular_email").notNull(),
  titularTelefone: text("titular_telefone").notNull(),
  pixQrCodeBase64: text("pix_qr_code_base64"),
  pixQrCodeString: text("pix_qr_code_string"),
  errorMessage: text("error_message"),
  returnCode: text("return_code"),
  reservedUntil: timestamp("reserved_until"),
  fulfilledEm: timestamp("fulfilled_em"),
  criadoEm: timestamp("criado_em").defaultNow().notNull(),
  atualizadoEm: timestamp("atualizado_em").defaultNow().notNull(),
});

export type EventPaymentOrder = typeof eventPaymentOrders.$inferSelect;
export type InsertEventPaymentOrder = typeof eventPaymentOrders.$inferInsert;
export const insertEventPaymentOrderSchema = createInsertSchema(eventPaymentOrders).omit({ id: true, criadoEm: true, atualizadoEm: true });

// ========================
// MAPEAMENTOS DE TERRITÓRIO
// ========================

export const mapeamentosTerritorioTable = pgTable("mapeamentos_territorio", {
  id: serial("id").primaryKey(),
  monitorId: integer("monitor_id").notNull(),
  data: date("data").notNull(),
  casasMapeadas: integer("casas_mapeadas").notNull(),
  observacao: text("observacao"),
  createdAt: timestamp("created_at").defaultNow(),
});

export type MapeamentoTerritorio = typeof mapeamentosTerritorioTable.$inferSelect;
export type InsertMapeamentoTerritorio = typeof mapeamentosTerritorioTable.$inferInsert;
export const insertMapeamentoTerritorioSchema = createInsertSchema(mapeamentosTerritorioTable).omit({ id: true, createdAt: true });

// ========================
// EXCEÇÕES DE AULAS - INCLUSÃO PRODUTIVA
// ========================

export const aulasExcecoesInclusao = pgTable("aulas_excecoes_inclusao", {
  id: serial("id").primaryKey(),
  turmaId: integer("turma_id").notNull().references(() => turmasInclusao.id, { onDelete: "cascade" }),
  dataOriginal: date("data_original").notNull(),
  tipo: varchar("tipo", { length: 50 }).notNull(), // 'cancelamento' | 'remanejamento'
  motivo: text("motivo").notNull(),
  novaData: date("nova_data"),
  createdAt: timestamp("created_at").defaultNow(),
});

export type AulaExcecaoInclusao = typeof aulasExcecoesInclusao.$inferSelect;
export type InsertAulaExcecaoInclusao = typeof aulasExcecoesInclusao.$inferInsert;
export const insertAulaExcecaoInclusaoSchema = createInsertSchema(aulasExcecoesInclusao).omit({ id: true, createdAt: true });

// ========================
// EXCEÇÕES DE AULAS - PEC
// ========================

export const aulasExcecoesPec = pgTable("aulas_excecoes_pec", {
  id: serial("id").primaryKey(),
  activityInstanceId: integer("activity_instance_id").notNull().references(() => activityInstances.id, { onDelete: "cascade" }),
  dataOriginal: date("data_original").notNull(),
  tipo: varchar("tipo", { length: 50 }).notNull(), // 'cancelamento' | 'remanejamento'
  motivo: text("motivo").notNull(),
  novaData: date("nova_data"),
  createdAt: timestamp("created_at").defaultNow(),
});

export type AulaExcecaoPec = typeof aulasExcecoesPec.$inferSelect;
export type InsertAulaExcecaoPec = typeof aulasExcecoesPec.$inferInsert;
export const insertAulaExcecaoPecSchema = createInsertSchema(aulasExcecoesPec).omit({ id: true, createdAt: true });

// ============================================================
// ACOLHIMENTOS AGENDADOS — agenda psico (visível ao aluno sem conteúdo clínico)
// ============================================================
export const psicoAcolhimentoStatusEnum = [
  "agendado",
  "realizado",
  "faltou",
  "cancelado",
  "reagendado",
] as const;
export type PsicoAcolhimentoStatus = (typeof psicoAcolhimentoStatusEnum)[number];

export const psicoAcolhimentos = pgTable("psico_acolhimentos", {
  id: serial("id").primaryKey(),
  alunoCpf: varchar("aluno_cpf", { length: 11 }).notNull(),
  alunoNome: varchar("aluno_nome", { length: 200 }).notNull(),
  data: date("data").notNull(),
  horaInicio: varchar("hora_inicio", { length: 8 }).notNull(),
  horaFim: varchar("hora_fim", { length: 8 }),
  local: text("local"),
  profissionalUserId: integer("profissional_user_id").references(() => users.id),
  profissionalNome: text("profissional_nome"),
  status: varchar("status", { length: 30 }).notNull().default("agendado"),
  observacaoInterna: text("observacao_interna"),
  registroId: integer("registro_id"),
  registroTipo: varchar("registro_tipo", { length: 40 }),
  /** Id compartilhado quando o agendamento veio de uma série recorrente */
  serieId: varchar("serie_id", { length: 64 }),
  criadoPorUserId: integer("criado_por_user_id").notNull(),
  criadoPorRole: varchar("criado_por_role", { length: 50 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type PsicoAcolhimento = typeof psicoAcolhimentos.$inferSelect;
export type InsertPsicoAcolhimento = typeof psicoAcolhimentos.$inferInsert;
export const insertPsicoAcolhimentoSchema = createInsertSchema(psicoAcolhimentos).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// ========================
// UNIFICAÇÃO CADASTRO — CADASTRO MESTRE
// ========================

export const atendidosGrito = pgTable("atendidos_grito", {
  cpf: text("cpf").primaryKey(),
  cpfProvisorio: boolean("cpf_provisorio").notNull().default(false),
  nomeCompleto: text("nome_completo").notNull(),
  dataNascimento: date("data_nascimento"),
  genero: text("genero"),
  escolaridade: text("escolaridade"),
  instituicaoEnsino: text("instituicao_ensino"),
  telefone: text("telefone"),
  email: text("email"),
  whatsapp: text("whatsapp"),
  bolsaFamilia: text("bolsa_familia"),
  fotoPerfil: text("foto_perfil"),
  numeroMatricula: text("numero_matricula").unique(),
  status: text("status").notNull().default("ativo"),
  cep: text("cep"),
  logradouro: text("logradouro"),
  numero: text("numero"),
  complemento: text("complemento"),
  bairro: text("bairro"),
  cidade: text("cidade"),
  estado: text("estado"),
  dadosComplementares: jsonb("dados_complementares"),
  fonteUltimaAtualizacao: text("fonte_ultima_atualizacao"),
  legadoAtualizadoEm: timestamp("legado_atualizado_em"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const atendidosGritoPrograma = pgTable(
  "atendidos_grito_programa",
  {
    id: serial("id").primaryKey(),
    cpf: text("cpf")
      .notNull()
      .references(() => atendidosGrito.cpf, { onDelete: "cascade" }),
    programa: text("programa").notNull(),
    status: text("status").notNull().default("ativo"),
    legadoTipo: text("legado_tipo"),
    legadoId: text("legado_id"),
    dataIngresso: timestamp("data_ingresso"),
    dataEgresso: timestamp("data_egresso"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => ({
    uniqCpfPrograma: unique().on(t.cpf, t.programa),
  })
);

export type AtendidoGrito = typeof atendidosGrito.$inferSelect;
export type InsertAtendidoGrito = typeof atendidosGrito.$inferInsert;
export type AtendidoGritoPrograma = typeof atendidosGritoPrograma.$inferSelect;
export type InsertAtendidoGritoPrograma = typeof atendidosGritoPrograma.$inferInsert;

export const insertAtendidoGritoSchema = createInsertSchema(atendidosGrito).omit({
  createdAt: true,
  updatedAt: true,
});

export const insertAtendidoGritoProgramaSchema = createInsertSchema(atendidosGritoPrograma).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// ========================
// UNIFICAÇÃO CADASTRO — OBSERVAÇÕES CROSS-SETOR
// ========================

export const atendidosGritoObservacoes = pgTable("atendidos_grito_observacoes", {
  id: serial("id").primaryKey(),
  cpf: text("cpf").notNull(),
  autorNome: text("autor_nome").notNull(),
  autorSetor: text("autor_setor").notNull(),
  autorUserId: integer("autor_user_id"),
  texto: text("texto").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type AtendidoGritoObservacao = typeof atendidosGritoObservacoes.$inferSelect;
export type InsertAtendidoGritoObservacao = typeof atendidosGritoObservacoes.$inferInsert;
export const insertAtendidoGritoObservacaoSchema = createInsertSchema(atendidosGritoObservacoes).omit({
  id: true,
  createdAt: true,
});
