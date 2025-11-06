import { pgTable, text, serial, integer, boolean, timestamp, decimal, date, json, jsonb, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// ================ NOVA ESTRUTURA UNIFICADA PARA SUPABASE ================

// Tabela principal de usuários unificada
export const usuariosSistema = pgTable("usuarios_sistema", {
  id: serial("id").primaryKey(),
  uuid: uuid("uuid").defaultRandom().unique(),
  
  // Dados pessoais básicos
  nome: text("nome").notNull(),
  sobrenome: text("sobrenome"),
  cpf: text("cpf").unique(),
  telefone: text("telefone").unique(),
  email: text("email").unique(),
  dataNascimento: date("data_nascimento"),
  
  // Identificação e acesso
  tipoUsuario: text("tipo_usuario").notNull(), // 'super_admin', 'admin', 'professor', 'aluno', 'doador', 'responsavel', 'desenvolvedor'
  status: text("status").default("ativo"), // 'ativo', 'inativo', 'suspenso'
  verificado: boolean("verificado").default(false),
  
  // Dados específicos por tipo (JSONB para flexibilidade)
  dadosEspecificos: jsonb("dados_especificos").default({}),
  
  // Auditoria
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  createdBy: text("created_by"),
  
  // Campos de migração (temporários)
  migratedFrom: text("migrated_from"), // 'users', 'developers', 'aluno', 'pais', 'maes', 'responsaveis'
  originalId: text("original_id"),
});

// Relacionamento usuário-turma (substituindo lógica dispersa)
export const usuarioTurmaRel = pgTable("usuario_turma_rel", {
  id: serial("id").primaryKey(),
  usuarioId: integer("usuario_id").notNull().references(() => usuariosSistema.id),
  turmaId: integer("turma_id").notNull(),
  tipoRelacao: text("tipo_relacao").notNull(), // 'professor', 'aluno', 'professor_lider'
  dataInicio: date("data_inicio").defaultNow(),
  dataFim: date("data_fim"),
  ativo: boolean("ativo").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relacionamento familiar (pais/responsáveis com alunos)
export const usuarioFamiliaRel = pgTable("usuario_familia_rel", {
  id: serial("id").primaryKey(),
  responsavelId: integer("responsavel_id").notNull().references(() => usuariosSistema.id),
  alunoId: integer("aluno_id").notNull().references(() => usuariosSistema.id),
  tipoRelacao: text("tipo_relacao").notNull(), // 'pai', 'mae', 'responsavel'
  contatoEmergencia: boolean("contato_emergencia").default(false),
  moraJunto: boolean("mora_junto").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Tabela de sessões e acessos (para controle unificado)
export const usuarioSessoes = pgTable("usuario_sessoes", {
  id: serial("id").primaryKey(),
  usuarioId: integer("usuario_id").notNull().references(() => usuariosSistema.id),
  token: text("token").unique().notNull(),
  tipoAcesso: text("tipo_acesso").notNull(), // 'web', 'mobile', 'api', 'dev'
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  ultimoAcesso: timestamp("ultimo_acesso").defaultNow(),
  expiresAt: timestamp("expires_at"),
  ativo: boolean("ativo").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// ================ RELATIONS ================

export const usuariosSistemaRelations = relations(usuariosSistema, ({ many }) => ({
  turmas: many(usuarioTurmaRel),
  familiares: many(usuarioFamiliaRel, { relationName: "responsavel" }),
  responsaveis: many(usuarioFamiliaRel, { relationName: "aluno" }),
  sessoes: many(usuarioSessoes),
}));

export const usuarioTurmaRelRelations = relations(usuarioTurmaRel, ({ one }) => ({
  usuario: one(usuariosSistema, {
    fields: [usuarioTurmaRel.usuarioId],
    references: [usuariosSistema.id],
  }),
}));

export const usuarioFamiliaRelRelations = relations(usuarioFamiliaRel, ({ one }) => ({
  responsavel: one(usuariosSistema, {
    fields: [usuarioFamiliaRel.responsavelId],
    references: [usuariosSistema.id],
    relationName: "responsavel",
  }),
  aluno: one(usuariosSistema, {
    fields: [usuarioFamiliaRel.alunoId],
    references: [usuariosSistema.id],
    relationName: "aluno",
  }),
}));

export const usuarioSessoesRelations = relations(usuarioSessoes, ({ one }) => ({
  usuario: one(usuariosSistema, {
    fields: [usuarioSessoes.usuarioId],
    references: [usuariosSistema.id],
  }),
}));

// ================ TIPOS E SCHEMAS ================

export type UsuarioSistema = typeof usuariosSistema.$inferSelect;
export type InsertUsuarioSistema = typeof usuariosSistema.$inferInsert;

export type UsuarioTurmaRel = typeof usuarioTurmaRel.$inferSelect;
export type InsertUsuarioTurmaRel = typeof usuarioTurmaRel.$inferInsert;

export type UsuarioFamiliaRel = typeof usuarioFamiliaRel.$inferSelect;
export type InsertUsuarioFamiliaRel = typeof usuarioFamiliaRel.$inferInsert;

export type UsuarioSessao = typeof usuarioSessoes.$inferSelect;
export type InsertUsuarioSessao = typeof usuarioSessoes.$inferInsert;

// Schemas de validação
export const insertUsuarioSistemaSchema = createInsertSchema(usuariosSistema, {
  nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  telefone: z.string().min(10, "Telefone deve ter pelo menos 10 dígitos"),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  tipoUsuario: z.enum(["super_admin", "admin", "professor", "aluno", "doador", "responsavel", "desenvolvedor"]),
  status: z.enum(["ativo", "inativo", "suspenso"]).default("ativo"),
});

export const insertUsuarioTurmaRelSchema = createInsertSchema(usuarioTurmaRel, {
  tipoRelacao: z.enum(["professor", "aluno", "professor_lider"]),
});

export const insertUsuarioFamiliaRelSchema = createInsertSchema(usuarioFamiliaRel, {
  tipoRelacao: z.enum(["pai", "mae", "responsavel"]),
});

// ================ MANTER TABELAS EXISTENTES (transição) ================

// Exportar tabelas existentes para compatibilidade durante migração
export {
  users,
  developers,
  aluno,
  pais,
  maes,
  responsaveis,
  turma,
  alunoTurma,
  chamada,
  chamadaAluno,
  calendarioEvento,
  planoAula,
  aulaRegistrada,
  acompanhamento,
  relatorioGerado,
  councilRequests,
  sistemaTelas,
  sistemaAlteracoes,
  sistemaErros,
  sistemaComentarios,
  sistemaDeployLog,
  sistemaAtividade
} from "./schema";

// ================ FUNÇÕES UTILITÁRIAS ================

export function getTelasAcessoPorTipo(tipoUsuario: string): string[] {
  switch (tipoUsuario) {
    case 'super_admin':
      return ['Dashboard Leo Martins', 'Gestão à Vista', 'Todas as Funcionalidades', 'Acesso Total'];
    case 'desenvolvedor':
      return ['Painel do Desenvolvedor', 'Todas as Telas do Sistema', 'APIs', 'Logs', 'Acesso Universal'];
    case 'professor':
      return ['Dashboard Professor', 'Gestão de Alunos (Turma Específica)', 'Planos de Aula', 'Calendário'];
    case 'professor_lider':
      return ['Dashboard Professor', 'Gestão de Alunos', 'Todas as Turmas', 'Calendário', 'Relatórios'];
    case 'aluno':
      return ['Dashboard Aluno', 'Minhas Atividades', 'Frequência', 'Notas'];
    case 'responsavel':
      return ['Dashboard Responsável', 'Acompanhamento do Aluno', 'Comunicação Escolar'];
    case 'doador':
    default:
      return ['Dashboard Doador', 'Perfil', 'Planos de Assinatura'];
  }
}

export function formatarUsuarioParaAPI(usuario: UsuarioSistema) {
  return {
    id: usuario.id,
    uuid: usuario.uuid,
    nome: usuario.nome,
    sobrenome: usuario.sobrenome,
    telefone: usuario.telefone,
    email: usuario.email,
    tipo: usuario.tipoUsuario,
    ativo: usuario.status === 'ativo',
    verificado: usuario.verificado,
    telasAcesso: getTelasAcessoPorTipo(usuario.tipoUsuario),
    dadosEspecificos: usuario.dadosEspecificos,
    ultimoAcesso: usuario.updatedAt,
    origem: usuario.migratedFrom || 'sistema_unificado'
  };
}