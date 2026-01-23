import { 
  usuariosSistema, usuarioTurmaRel, usuarioFamiliaRel, usuarioSessoes,
  turma, chamada, chamadaAluno, calendarioEvento, planoAula, aulaRegistrada,
  acompanhamento, relatorioGerado, sistemaTelas, sistemaAlteracoes, sistemaErros,
  sistemaComentarios, sistemaDeployLog, sistemaAtividade,
  type UsuarioSistema, type InsertUsuarioSistema,
  type UsuarioTurmaRel, type InsertUsuarioTurmaRel,
  type UsuarioFamiliaRel, type InsertUsuarioFamiliaRel,
  getTelasAcessoPorTipo, formatarUsuarioParaAPI
} from "@shared/schema-unified";
import { db } from "./db";
import { eq, and, sql, desc, asc, or, ilike, inArray } from "drizzle-orm";

// ================ INTERFACE UNIFICADA ================

export interface IStorageUnified {
  // ===== USUÁRIOS UNIFICADOS =====
  getUsuario(id: number): Promise<UsuarioSistema | undefined>;
  getUsuarioByCpf(cpf: string): Promise<UsuarioSistema | undefined>;
  getUsuarioByTelefone(telefone: string): Promise<UsuarioSistema | undefined>;
  getUsuarioByEmail(email: string): Promise<UsuarioSistema | undefined>;
  getAllUsuarios(): Promise<UsuarioSistema[]>;
  getUsuariosByTipo(tipo: string | string[]): Promise<UsuarioSistema[]>;
  createUsuario(data: InsertUsuarioSistema): Promise<UsuarioSistema>;
  updateUsuario(id: number, data: Partial<UsuarioSistema>): Promise<UsuarioSistema>;
  deleteUsuario(id: number): Promise<void>;
  searchUsuarios(query: string): Promise<UsuarioSistema[]>;
  
  // ===== RELACIONAMENTOS =====
  getUsuarioTurmas(usuarioId: number): Promise<UsuarioTurmaRel[]>;
  getTurmaUsuarios(turmaId: number, tipoRelacao?: string): Promise<UsuarioSistema[]>;
  addUsuarioTurma(data: InsertUsuarioTurmaRel): Promise<UsuarioTurmaRel>;
  removeUsuarioTurma(usuarioId: number, turmaId: number): Promise<void>;
  
  getUsuarioFamilia(usuarioId: number): Promise<UsuarioFamiliaRel[]>;
  getResponsaveis(alunoId: number): Promise<UsuarioSistema[]>;
  getAlunos(responsavelId: number): Promise<UsuarioSistema[]>;
  addRelacaoFamiliar(data: InsertUsuarioFamiliaRel): Promise<UsuarioFamiliaRel>;
  removeRelacaoFamiliar(responsavelId: number, alunoId: number): Promise<void>;
  
  // ===== MIGRAÇÃO E COMPATIBILIDADE =====
  migrateFromOldTables(): Promise<void>;
  getUsuariosByOriginalTable(tableName: string): Promise<UsuarioSistema[]>;
  
  // ===== FUNCIONALIDADES ESPECÍFICAS =====
  getProfessores(): Promise<UsuarioSistema[]>;
  getDevelopers(): Promise<UsuarioSistema[]>;
  getDoadores(): Promise<UsuarioSistema[]>;
  getAllAlunos(): Promise<UsuarioSistema[]>;
  getAllResponsaveis(): Promise<UsuarioSistema[]>;
  
  // ===== DASHBOARDS =====
  getProfessorDashboardData(professorId: number): Promise<any>;
  getAlunoDashboardData(alunoId: number): Promise<any>;
  getDevDashboardData(): Promise<any>;
}

// ================ IMPLEMENTAÇÃO UNIFICADA ================

export class UnifiedDatabaseStorage implements IStorageUnified {
  
  // ===== USUÁRIOS UNIFICADOS =====
  
  async getUsuario(id: number): Promise<UsuarioSistema | undefined> {
    const [usuario] = await db.select().from(usuariosSistema).where(eq(usuariosSistema.id, id));
    return usuario || undefined;
  }

  async getUsuarioByCpf(cpf: string): Promise<UsuarioSistema | undefined> {
    const [usuario] = await db.select().from(usuariosSistema).where(eq(usuariosSistema.cpf, cpf));
    return usuario || undefined;
  }

  async getUsuarioByTelefone(telefone: string): Promise<UsuarioSistema | undefined> {
    const [usuario] = await db.select().from(usuariosSistema).where(eq(usuariosSistema.telefone, telefone));
    return usuario || undefined;
  }

  async getUsuarioByEmail(email: string): Promise<UsuarioSistema | undefined> {
    const [usuario] = await db.select().from(usuariosSistema).where(eq(usuariosSistema.email, email));
    return usuario || undefined;
  }

  async getAllUsuarios(): Promise<UsuarioSistema[]> {
    return db.select().from(usuariosSistema)
      .where(eq(usuariosSistema.status, 'ativo'))
      .orderBy(asc(usuariosSistema.tipoUsuario), asc(usuariosSistema.nome));
  }

  async getUsuariosByTipo(tipo: string | string[]): Promise<UsuarioSistema[]> {
    const tipos = Array.isArray(tipo) ? tipo : [tipo];
    return db.select().from(usuariosSistema)
      .where(and(
        inArray(usuariosSistema.tipoUsuario, tipos),
        eq(usuariosSistema.status, 'ativo')
      ))
      .orderBy(asc(usuariosSistema.nome));
  }

  async createUsuario(data: InsertUsuarioSistema): Promise<UsuarioSistema> {
    const [usuario] = await db.insert(usuariosSistema).values({
      ...data,
      updatedAt: new Date()
    }).returning();
    return usuario;
  }

  async updateUsuario(id: number, data: Partial<UsuarioSistema>): Promise<UsuarioSistema> {
    const [usuario] = await db.update(usuariosSistema)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(eq(usuariosSistema.id, id))
      .returning();
    return usuario;
  }

  async deleteUsuario(id: number): Promise<void> {
    // Soft delete - marcar como inativo
    await this.updateUsuario(id, { status: 'inativo' });
  }

  async searchUsuarios(query: string): Promise<UsuarioSistema[]> {
    return db.select().from(usuariosSistema)
      .where(and(
        or(
          ilike(usuariosSistema.nome, `%${query}%`),
          ilike(usuariosSistema.sobrenome, `%${query}%`),
          ilike(usuariosSistema.telefone, `%${query}%`),
          ilike(usuariosSistema.email, `%${query}%`),
          ilike(usuariosSistema.cpf, `%${query}%`)
        ),
        eq(usuariosSistema.status, 'ativo')
      ))
      .orderBy(asc(usuariosSistema.nome));
  }

  // ===== RELACIONAMENTOS =====
  
  async getUsuarioTurmas(usuarioId: number): Promise<UsuarioTurmaRel[]> {
    return db.select().from(usuarioTurmaRel)
      .where(and(
        eq(usuarioTurmaRel.usuarioId, usuarioId),
        eq(usuarioTurmaRel.ativo, true)
      ))
      .orderBy(desc(usuarioTurmaRel.dataInicio));
  }

  async getTurmaUsuarios(turmaId: number, tipoRelacao?: string): Promise<UsuarioSistema[]> {
    const query = db.select({
      id: usuariosSistema.id,
      uuid: usuariosSistema.uuid,
      nome: usuariosSistema.nome,
      sobrenome: usuariosSistema.sobrenome,
      cpf: usuariosSistema.cpf,
      telefone: usuariosSistema.telefone,
      email: usuariosSistema.email,
      dataNascimento: usuariosSistema.dataNascimento,
      tipoUsuario: usuariosSistema.tipoUsuario,
      status: usuariosSistema.status,
      verificado: usuariosSistema.verificado,
      dadosEspecificos: usuariosSistema.dadosEspecificos,
      createdAt: usuariosSistema.createdAt,
      updatedAt: usuariosSistema.updatedAt,
      createdBy: usuariosSistema.createdBy,
      migratedFrom: usuariosSistema.migratedFrom,
      originalId: usuariosSistema.originalId
    })
    .from(usuariosSistema)
    .innerJoin(usuarioTurmaRel, eq(usuariosSistema.id, usuarioTurmaRel.usuarioId))
    .where(and(
      eq(usuarioTurmaRel.turmaId, turmaId),
      eq(usuarioTurmaRel.ativo, true),
      tipoRelacao ? eq(usuarioTurmaRel.tipoRelacao, tipoRelacao) : sql`true`
    ))
    .orderBy(asc(usuariosSistema.nome));

    return query;
  }

  async addUsuarioTurma(data: InsertUsuarioTurmaRel): Promise<UsuarioTurmaRel> {
    const [relacao] = await db.insert(usuarioTurmaRel).values(data).returning();
    return relacao;
  }

  async removeUsuarioTurma(usuarioId: number, turmaId: number): Promise<void> {
    await db.update(usuarioTurmaRel)
      .set({ ativo: false })
      .where(and(
        eq(usuarioTurmaRel.usuarioId, usuarioId),
        eq(usuarioTurmaRel.turmaId, turmaId)
      ));
  }

  async getUsuarioFamilia(usuarioId: number): Promise<UsuarioFamiliaRel[]> {
    return db.select().from(usuarioFamiliaRel)
      .where(or(
        eq(usuarioFamiliaRel.responsavelId, usuarioId),
        eq(usuarioFamiliaRel.alunoId, usuarioId)
      ))
      .orderBy(desc(usuarioFamiliaRel.createdAt));
  }

  async getResponsaveis(alunoId: number): Promise<UsuarioSistema[]> {
    return db.select({
      id: usuariosSistema.id,
      uuid: usuariosSistema.uuid,
      nome: usuariosSistema.nome,
      sobrenome: usuariosSistema.sobrenome,
      cpf: usuariosSistema.cpf,
      telefone: usuariosSistema.telefone,
      email: usuariosSistema.email,
      dataNascimento: usuariosSistema.dataNascimento,
      tipoUsuario: usuariosSistema.tipoUsuario,
      status: usuariosSistema.status,
      verificado: usuariosSistema.verificado,
      dadosEspecificos: usuariosSistema.dadosEspecificos,
      createdAt: usuariosSistema.createdAt,
      updatedAt: usuariosSistema.updatedAt,
      createdBy: usuariosSistema.createdBy,
      migratedFrom: usuariosSistema.migratedFrom,
      originalId: usuariosSistema.originalId
    })
    .from(usuariosSistema)
    .innerJoin(usuarioFamiliaRel, eq(usuariosSistema.id, usuarioFamiliaRel.responsavelId))
    .where(eq(usuarioFamiliaRel.alunoId, alunoId))
    .orderBy(asc(usuariosSistema.nome));
  }

  async getAlunos(responsavelId: number): Promise<UsuarioSistema[]> {
    return db.select({
      id: usuariosSistema.id,
      uuid: usuariosSistema.uuid,
      nome: usuariosSistema.nome,
      sobrenome: usuariosSistema.sobrenome,
      cpf: usuariosSistema.cpf,
      telefone: usuariosSistema.telefone,
      email: usuariosSistema.email,
      dataNascimento: usuariosSistema.dataNascimento,
      tipoUsuario: usuariosSistema.tipoUsuario,
      status: usuariosSistema.status,
      verificado: usuariosSistema.verificado,
      dadosEspecificos: usuariosSistema.dadosEspecificos,
      createdAt: usuariosSistema.createdAt,
      updatedAt: usuariosSistema.updatedAt,
      createdBy: usuariosSistema.createdBy,
      migratedFrom: usuariosSistema.migratedFrom,
      originalId: usuariosSistema.originalId
    })
    .from(usuariosSistema)
    .innerJoin(usuarioFamiliaRel, eq(usuariosSistema.id, usuarioFamiliaRel.alunoId))
    .where(eq(usuarioFamiliaRel.responsavelId, responsavelId))
    .orderBy(asc(usuariosSistema.nome));
  }

  async addRelacaoFamiliar(data: InsertUsuarioFamiliaRel): Promise<UsuarioFamiliaRel> {
    const [relacao] = await db.insert(usuarioFamiliaRel).values(data).returning();
    return relacao;
  }

  async removeRelacaoFamiliar(responsavelId: number, alunoId: number): Promise<void> {
    await db.delete(usuarioFamiliaRel)
      .where(and(
        eq(usuarioFamiliaRel.responsavelId, responsavelId),
        eq(usuarioFamiliaRel.alunoId, alunoId)
      ));
  }

  // ===== FUNCIONALIDADES ESPECÍFICAS =====
  
  async getProfessores(): Promise<UsuarioSistema[]> {
    return this.getUsuariosByTipo('professor');
  }

  async getDevelopers(): Promise<UsuarioSistema[]> {
    return this.getUsuariosByTipo('desenvolvedor');
  }

  async getDoadores(): Promise<UsuarioSistema[]> {
    return this.getUsuariosByTipo('doador');
  }

  // Helper methods for getting all users of specific types (no parameters)
  async getAllAlunos(): Promise<UsuarioSistema[]> {
    return this.getUsuariosByTipo('aluno');
  }

  async getAllResponsaveis(): Promise<UsuarioSistema[]> {
    return this.getUsuariosByTipo('responsavel');
  }

  // ===== MIGRAÇÃO =====
  
  async migrateFromOldTables(): Promise<void> {
    // Esta função executa a migração via SQL script
    // Em produção, seria executada separadamente
    console.log("Migração deve ser executada via script SQL separado");
  }

  async getUsuariosByOriginalTable(tableName: string): Promise<UsuarioSistema[]> {
    return db.select().from(usuariosSistema)
      .where(eq(usuariosSistema.migratedFrom, tableName))
      .orderBy(asc(usuariosSistema.nome));
  }

  // ===== DASHBOARDS =====
  
  async getProfessorDashboardData(professorId: number): Promise<any> {
    const professor = await this.getUsuario(professorId);
    if (!professor || professor.tipoUsuario !== 'professor') {
      throw new Error('Professor não encontrado');
    }

    const turmas = await this.getUsuarioTurmas(professorId);
    const totalAlunos = await Promise.all(
      turmas.map(t => this.getTurmaUsuarios(t.turmaId, 'aluno'))
    ).then(arrays => arrays.flat().length);

    return {
      professor,
      totalTurmas: turmas.length,
      totalAlunos,
      turmas: turmas.map(t => t.turmaId)
    };
  }

  async getAlunoDashboardData(alunoId: number): Promise<any> {
    const aluno = await this.getUsuario(alunoId);
    if (!aluno || aluno.tipoUsuario !== 'aluno') {
      throw new Error('Aluno não encontrado');
    }

    const turmas = await this.getUsuarioTurmas(alunoId);
    const responsaveis = await this.getResponsaveis(alunoId);

    return {
      aluno,
      turmas: turmas.length,
      responsaveis: responsaveis.length,
      dadosEscolares: aluno.dadosEspecificos
    };
  }

  async getDevDashboardData(): Promise<any> {
    const stats = await db.select({
      tipoUsuario: usuariosSistema.tipoUsuario,
      count: sql<number>`count(*)`
    })
    .from(usuariosSistema)
    .where(eq(usuariosSistema.status, 'ativo'))
    .groupBy(usuariosSistema.tipoUsuario);

    const totalUsuarios = await db.select({ count: sql<number>`count(*)` })
      .from(usuariosSistema)
      .where(eq(usuariosSistema.status, 'ativo'));

    return {
      totalUsuarios: totalUsuarios[0]?.count || 0,
      estatisticasPorTipo: stats,
      ultimaAtualizacao: new Date().toISOString()
    };
  }
}

// ================ EXPORTAR STORAGE UNIFICADO ================

export const unifiedStorage = new UnifiedDatabaseStorage();