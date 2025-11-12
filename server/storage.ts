import {
  users, aluno, pais, maes, responsaveis, turma, alunoTurma, chamada, chamadaAluno,
  calendarioEvento, planoAula, aulaRegistrada, acompanhamento, relatorioGerado, developers,
  sistemaTelas, sistemaAlteracoes, sistemaErros, sistemaComentarios, sistemaDeployLog, sistemaAtividade,
  sorteios, sorteioParticipacoes, sorteioResultados, sorteioConfiguracoes,
  doadores, typeformResponses, historicoDoacao, referrals,
  checkins, gritosHistorico, niveis, beneficios, beneficioImagens, beneficioLances, userCausas,
  premios, leiloes, lances, missoesSemanais, missoesConcluidas,
  activityEvents, userInterests, historiasInspiradoras,
  // Sistema de ingressos digitais
  ingressos,
  // Sistema de cotas de empresas
  cotasEmpresas,
  // Sistema de indicação (referral)
  indicacoes, indicacaoPontosLedger, stripeEvents,
  // Sistema de marketing (Dev Marketing)
  marketingCampaigns, marketingLinks, mktClicks,
  // Novas tabelas PEC
  projects, pecActivities, activityInstances, staffAssignments, enrollments, sessions, attendance, photos,
  // Novas tabelas EDUCADORES
  educadores, educadorPrograma, alunoPrograma,
  // Tabelas de Inclusão Produtiva
  programasInclusao, turmasInclusao, participantesTurmas, cursosInclusao, cursosTurmas, participantesInclusao,
  // Tabelas Psicossociais
  psicoFamilias, psicoCasos, psicoAtendimentos, psicoPlanos,
  type User, type InsertUser, type Aluno, type InsertAluno,
  type Pai, type InsertPai, type Mae, type InsertMae, type Responsavel, type InsertResponsavel,
  type Turma, type InsertTurma, type AlunoTurma, type InsertAlunoTurma,
  type Chamada, type InsertChamada, type ChamadaAluno, type InsertChamadaAluno,
  type CalendarioEvento, type InsertCalendarioEvento, type PlanoAula, type InsertPlanoAula,
  type AulaRegistrada, type InsertAulaRegistrada,
  type Acompanhamento, type InsertAcompanhamento, type RelatorioGerado, type InsertRelatorioGerado,
  type Developer, type InsertDeveloper,
  type SistemaTela, type InsertSistemaTela, type SistemaAlteracao, type InsertSistemaAlteracao,
  type SistemaErro, type InsertSistemaErro, type SistemaComentario, type InsertSistemaComentario,
  type SistemaDeployLog, type InsertSistemaDeployLog, type SistemaAtividade, type InsertSistemaAtividade,
  type Sorteio, type SorteioInsert, type SorteioParticipacao, type SorteioParticipacaoInsert,
  type SorteioResultado, type SorteioResultadoInsert, type SorteioConfiguracao, type SorteioConfiguracaoInsert,
  type Checkin, type InsertCheckin, type GritosHistorico, type InsertGritosHistorico, type Nivel, type InsertNivel,
  type Beneficio, type InsertBeneficio, type BeneficioImagem, type InsertBeneficioImagem,
  type BeneficioLance, type InsertBeneficioLance,
  type UserCausa, type InsertUserCausa,
  type Premio, type InsertPremio, type Leilao, type InsertLeilao, type Lance, type InsertLance,
  type ActivityEvent, type InsertActivityEvent, type UserInterest, type InsertUserInterest,
  type RecommendationResponse,
  // Tipos para sistema de ingressos
  type Ingresso, type InsertIngresso,
  // Tipos para sistema de cotas
  type CotaEmpresa, type InsertCotaEmpresa,
  // Tipos para sistema de indicação
  type Indicacao, type InsertIndicacao, type IndicacaoPontos, type InsertIndicacaoPontos,
  // Tipos para sistema de marketing
  type MarketingCampaign, type InsertMarketingCampaign, type MarketingLink, type InsertMarketingLink, type MktClick, type InsertMktClick,
  // Novos tipos PEC
  type Project, type InsertProject, type Activity, type InsertActivity,
  type ActivityInstance, type InsertActivityInstance, type StaffAssignment, type InsertStaffAssignment,
  type Enrollment, type InsertEnrollment, type Session, type InsertSession,
  type Attendance, type InsertAttendance, type Photo, type InsertPhoto,
  // Novos tipos EDUCADORES  
  type Educador, type InsertEducador, type EducadorPrograma, type InsertEducadorPrograma,
  type AlunoPrograma, type InsertAlunoPrograma,
  // Tipos de Inclusão Produtiva
  type ProgramaInclusao, type InsertProgramaInclusao,
  type TurmaInclusao, type InsertTurmaInclusao,
  type ParticipanteTurma, type InsertParticipanteTurma,
  type CursoInclusao, type InsertCursoInclusao,
  type CursoTurma, type InsertCursoTurma,
  type ParticipanteInclusao, type InsertParticipanteInclusao
} from "@shared/schema";
import { db } from "./db";
import { eq, and, sql, desc, asc, or, ilike, like, inArray, gt, lt } from "drizzle-orm";
import { RecommendationEngine } from "./recommendation-engine";
import Stripe from "stripe";

// Função para normalizar telefones (remove +55, espaços, parênteses, etc)
function normalizarTelefone(telefone: string): string {
  // Remove todos os caracteres não numéricos
  let normalizado = telefone.replace(/\D/g, '');
  
  // Remove código do país (+55 ou 55) se presente
  if (normalizado.startsWith('55') && normalizado.length > 11) {
    normalizado = normalizado.substring(2);
  }
  
  return normalizado;
}

// Nova interface de storage seguindo a estrutura de 8 módulos
export interface IStorage {
  // ===== MÓDULO 1: USUÁRIOS GERAIS =====
  getUser(id: number): Promise<User | undefined>;
  getUserByTelefone(telefone: string): Promise<User | undefined>;
  getUserByPhone(telefone: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(insertUser: InsertUser): Promise<User>;
  createOrUpdateUser(insertUser: InsertUser): Promise<User>;
  updateUser(id: number, userData: { nome?: string; telefone?: string; email?: string; professorTipo?: string; plano?: string }): Promise<User>;
  updateUserVerification(id: number, isVerified: boolean): Promise<User>;
  updateConselhoStatus(telefone: string, status: string, approvedBy?: string): Promise<User>;
  updateUserStripeInfo(id: number, stripeCustomerId?: string, stripeSubscriptionId?: string, subscriptionStatus?: string): Promise<User>;

  // ✅ PROJETOS APOIADOS: Métodos para gerenciar projetos apoiados por usuário
  getUserSupportedProjects(userId: number): Promise<string[]>;
  updateUserSupportedProjects(userId: number, projects: string[]): Promise<User>;
  getPendingConselhoRequests(): Promise<User[]>;
  getAllUsers(): Promise<User[]>;
  getAllTelas(): Promise<SistemaTela[]>;
  getTelaHistorico(telaId: number): Promise<any[]>;
  createTelaHistorico(data: any): Promise<any>;
  getDeveloperPanelHistory(): Promise<any[]>;
  createDeveloperPanelHistory(data: any): Promise<any>;

  // ===== PATROCINADORES 2026 =====
  createPatrocinador2026(nome: string, telefone: string): Promise<User>;

  // ===== MÓDULO SORTEIO =====
  // Sorteios
  getSorteioAtivo(): Promise<Sorteio | undefined>;
  getSorteioById(id: number): Promise<Sorteio | undefined>;
  createSorteio(sorteio: SorteioInsert): Promise<Sorteio>;
  updateSorteio(id: number, sorteio: Partial<SorteioInsert>): Promise<Sorteio>;
  getSorteiosHistorico(): Promise<Sorteio[]>;

  // Participações
  getParticipacaoUsuario(sorteioId: number, userId: number): Promise<SorteioParticipacao | undefined>;
  createParticipacao(participacao: SorteioParticipacaoInsert): Promise<SorteioParticipacao>;
  updateParticipacao(id: number, participacao: Partial<SorteioParticipacaoInsert>): Promise<SorteioParticipacao>;
  getParticipacoesDoSorteio(sorteioId: number): Promise<SorteioParticipacao[]>;

  // Resultados
  createResultado(resultado: SorteioResultadoInsert): Promise<SorteioResultado>;
  getResultadosHistorico(): Promise<SorteioResultado[]>;

  // Configurações
  getSorteioConfiguracao(chave: string): Promise<SorteioConfiguracao | undefined>;
  setSorteioConfiguracao(config: SorteioConfiguracaoInsert): Promise<SorteioConfiguracao>;
  getSorteioConfiguracoes(): Promise<SorteioConfiguracao[]>;

  // ===== MÓDULO 2: CADASTRO DE ALUNOS =====
  // Métodos para Pais
  createPai(insertPai: InsertPai): Promise<Pai>;
  getPaiByCpf(cpf: string): Promise<Pai | undefined>;

  // Métodos para Mães
  createMae(insertMae: InsertMae): Promise<Mae>;
  getMaeByCpf(cpf: string): Promise<Mae | undefined>;

  // Métodos para Responsáveis
  createResponsavel(insertResponsavel: InsertResponsavel): Promise<Responsavel>;
  getResponsavelByCpf(cpf: string): Promise<Responsavel | undefined>;

  // Métodos para Alunos
  createAluno(insertAluno: InsertAluno): Promise<Aluno>;
  getAlunosByProfessor(professorId: number): Promise<Aluno[]>;
  getAlunosByTurma(turmaId: number): Promise<Aluno[]>;
  getAluno(cpf: string): Promise<Aluno | undefined>;
  updateAluno(cpf: string, data: Partial<InsertAluno>): Promise<Aluno>;
  deleteAluno(cpf: string): Promise<void>;
  searchAlunos(query: string): Promise<Aluno[]>;

  // ===== MÓDULO 3: TURMAS =====
  createTurma(insertTurma: InsertTurma): Promise<Turma>;
  getTurmasByProfessor(professorId: number): Promise<any[]>;
  getAllTurmas(): Promise<any[]>;
  getTurma(id: number): Promise<Turma | undefined>;
  updateTurma(id: number, data: Partial<InsertTurma>): Promise<Turma>;
  deleteTurma(id: number): Promise<void>;
  getUsersByRole(role: string): Promise<User[]>;

  // Relacionamento aluno-turma (many-to-many)
  matricularAlunoTurma(alunoCpf: string, turmaId: number): Promise<AlunoTurma>;
  desmatricularAlunoTurma(alunoCpf: string, turmaId: number): Promise<void>;
  getMatriculasTurma(turmaId: number): Promise<AlunoTurma[]>;
  getMatriculasAluno(alunoCpf: string): Promise<AlunoTurma[]>;

  // ===== MÓDULO 4: CHAMADA =====
  createChamada(insertChamada: InsertChamada): Promise<Chamada>;
  createChamadaAluno(insertChamadaAluno: InsertChamadaAluno): Promise<ChamadaAluno>;
  getChamadaByTurma(turmaId: number, date?: string): Promise<any[]>;

  // ===== MÓDULO 5: CALENDÁRIO =====
  createEvento(insertEvento: InsertCalendarioEvento): Promise<CalendarioEvento>;
  getEventosByProfessor(professorId: number): Promise<CalendarioEvento[]>;
  getEventosByTurma(turmaId: number): Promise<CalendarioEvento[]>;
  getEvento(id: number): Promise<CalendarioEvento | undefined>;
  updateEvento(id: number, data: Partial<InsertCalendarioEvento>): Promise<CalendarioEvento>;
  deleteEvento(id: number): Promise<void>;

  // ===== MÓDULO 6: PLANO DE AULA =====
  createPlanoAula(insertPlano: InsertPlanoAula): Promise<PlanoAula>;
  getPlanosByProfessor(professorId: number): Promise<PlanoAula[]>;
  getPlanosByTurma(turmaId: number): Promise<PlanoAula[]>;
  getPlanoAula(id: number): Promise<PlanoAula | undefined>;
  updatePlanoAula(id: number, data: Partial<InsertPlanoAula>): Promise<PlanoAula>;
  deletePlanoAula(id: number): Promise<void>;

  // ===== MÓDULO 6b: AULAS REGISTRADAS =====
  createAulaRegistrada(insertAula: InsertAulaRegistrada): Promise<AulaRegistrada>;
  getAulasRegistradasByProfessor(professorId: number): Promise<AulaRegistrada[]>;
  getAllAulasRegistradas(): Promise<AulaRegistrada[]>;
  getAulasRegistradasByTurma(turmaId: number): Promise<AulaRegistrada[]>;
  getAulaRegistrada(id: number): Promise<AulaRegistrada | undefined>;
  updateAulaRegistrada(id: number, data: Partial<InsertAulaRegistrada>): Promise<AulaRegistrada>;
  deleteAulaRegistrada(id: number): Promise<void>;

  // ===== MÓDULO 7: ACOMPANHAMENTO =====
  createAcompanhamento(insertAcompanhamento: InsertAcompanhamento): Promise<Acompanhamento>;
  getAcompanhamentosByProfessor(professorId: number): Promise<Acompanhamento[]>;
  getAcompanhamentosByAluno(alunoCpf: string): Promise<Acompanhamento[]>;
  getAcompanhamento(id: number): Promise<Acompanhamento | undefined>;
  updateAcompanhamento(id: number, data: Partial<InsertAcompanhamento>): Promise<Acompanhamento>;
  deleteAcompanhamento(id: number): Promise<void>;

  // ===== MÓDULO 8: RELATÓRIOS GERENCIAIS =====
  createRelatorio(insertRelatorio: InsertRelatorioGerado): Promise<RelatorioGerado>;
  getRelatoriosByProfessor(professorId: number): Promise<RelatorioGerado[]>;
  getRelatorio(id: number): Promise<RelatorioGerado | undefined>;

  // Dashboard sumário para professor
  getProfessorDashboardSummary(professorId: number): Promise<any>;

  // Atualização de perfil do professor
  updateProfessorProfile(id: number, data: { name?: string; email?: string }): Promise<User>;

  // ===== MÉTODOS DO COORDENADOR PEC =====
  getPecCoordenadorDashboardSummary(coordenadorId: number): Promise<any>;
  getAlunosByPEC(coordenadorId: number): Promise<Aluno[]>;
  getTurmasByPEC(coordenadorId: number): Promise<any[]>;

  // Missing methods for council functionality
  updateCouncilRequestStatus(requestId: number, status: string, processedBy?: string): Promise<any>;

  // ===== MÓDULO 9: DESENVOLVEDORES E CONSOLIDAÇÃO =====
  getDevelopers(): Promise<Developer[]>;
  getAllAlunos(): Promise<Aluno[]>;
  updateCouncilAccessStatus(telefone: string, status: string): Promise<User>;
  getCouncilMembers(): Promise<User[]>;
  createCouncilRequest(data: any): Promise<any>;

  // Missing methods for professor functionality
  getAttendanceByLesson(professorId: number): Promise<any[]>;
  getStudentAttendance(studentId: string): Promise<any[]>;
  getEventsByProfessor(professorId: number): Promise<any[]>;
  createEvent(data: any): Promise<any>;
  updateEvent(id: number, data: any): Promise<any>;
  deleteEvent(id: number): Promise<void>;
  createObservation(data: any): Promise<any>;
  getObservationsByProfessor(professorId: number): Promise<any[]>;
  getObservationsByStudent(studentId: string): Promise<any[]>;
  updateObservation(id: number, data: any): Promise<any>;
  deleteObservation(id: number): Promise<void>;
  generateClassReport(data: any): Promise<any>;
  generateStudentReport(data: any): Promise<any>;
  createGuardian(data: any): Promise<any>;
  getGuardiansByStudent(studentId: string): Promise<any[]>;
  getGuardian(id: number): Promise<any>;
  updateGuardian(id: number, data: any): Promise<any>;
  deleteGuardian(id: number): Promise<void>;
  getStudentsByClass(classId: number): Promise<any[]>;
  getStudentsByProfessor(professorId: number): Promise<any[]>;
  getLessonsByProfessor(professorId: number): Promise<any[]>;

  // ===== MÓDULO DESENVOLVEDOR =====
  getDeveloperByUsuario(usuario: string): Promise<any>;
  updateDeveloperLastAccess(id: number): Promise<void>;

  // ===== MÓDULO DOAÇÃO =====
  getUserActiveDonationPlan(userId: number): Promise<string>;

  // ===== MÓDULO GAMIFICAÇÃO - GRITOS =====
  // Check-ins
  createCheckin(checkin: InsertCheckin): Promise<Checkin>;
  getCheckinToday(userId: number, data: string): Promise<Checkin | undefined>;

  // Sistema de Streak Semanal
  getUserStreak(userId: number): Promise<{ diasConsecutivos: number; ultimoCheckin: string | null }>;

  // 🎯 Missões automáticas
  checkAndCompleteProfileMission(userId: number): Promise<void>;
  autoCompleteReferralMissions(userId: number): Promise<void>;
  updateUserStreak(userId: number, diasConsecutivos: number, ultimoCheckin: string): Promise<void>;

  // ===== MÓDULO INDICAÇÃO (REFERRAL) =====
  generateRefCode(): Promise<string>; // Gera código único GRITO-XXXXXX
  getUserByRefCode(refCode: string): Promise<User | undefined>; // Busca usuário por refCode
  ensureUserHasRefCode(userId: number): Promise<string>; // Garante que user tem refCode
  updateUserRefCodeCadastro(userId: number, refCode: string): Promise<void>; // Atualiza ref_code_cadastro do user
  populateAllUserRefCodes(): Promise<{ total: number; created: number }>; // Popula codes para todos users
  
  // Sistema de link personalizado (slug)
  generateSlugFromName(nome: string, sobrenome?: string): Promise<string>; // Gera slug baseado no nome
  ensureUserHasRefSlug(userId: number): Promise<string>; // Garante que user tem refSlug
  getMeuLinkIndicacao(userId: number): Promise<string>; // Retorna link completo de indicação
  getUserByRefSlug(refSlug: string): Promise<User | undefined>; // Busca usuário por refSlug
  updateUserRefSlugCadastro(userId: number, refSlug: string): Promise<void>; // Atualiza ref_code_cadastro do user com slug
  
  createIndicacao(indicouId: number, indicadoId: number, refCode: string): Promise<Indicacao>; // Cria indicação PENDENTE
  getIndicacaoByIndicado(indicadoId: number): Promise<Indicacao | undefined>; // Busca indicação do indicado
  confirmarIndicacao(indicacaoId: number): Promise<{ indicacao: Indicacao; pontos: IndicacaoPontos }>; // Confirma e credita pontos
  getMinhasIndicacoes(userId: number): Promise<Array<Indicacao & { indicado?: User }>>; // Lista indicações do usuário
  getSaldoPontosIndicacao(userId: number): Promise<number>; // Saldo de pontos de indicação
  getLedgerPontosIndicacao(userId: number): Promise<IndicacaoPontos[]>; // Histórico de pontos
  markStripeEventProcessed(eventId: string, eventType: string): Promise<void>; // Marca evento Stripe como processado
  isStripeEventProcessed(eventId: string): Promise<boolean>; // Verifica se evento já foi processado
  doCheckinWithStreak(userId: number): Promise<{success: boolean; gritosGanhos: number; diaAtual: number}>;
  checkAndResetStreakIfBroken(userId: number): Promise<{streakResetada: boolean; diasConsecutivos: number}>;
  getPersonalizedCheckinStatus(userId: number): Promise<{canCheckin: boolean; diasConsecutivos: number; diaAtual: number; cicloCompleto: boolean; ultimoCheckin: string | null}>;

  // ===== MÓDULO DEV MARKETING =====
  // Campanhas
  createMarketingCampaign(campaign: InsertMarketingCampaign): Promise<MarketingCampaign>;
  getMarketingCampaigns(filters?: { isActive?: boolean }): Promise<MarketingCampaign[]>;
  getMarketingCampaign(id: number): Promise<MarketingCampaign | undefined>;
  updateMarketingCampaign(id: number, campaign: Partial<InsertMarketingCampaign>): Promise<MarketingCampaign>;

  // Links
  createMarketingLink(link: InsertMarketingLink): Promise<MarketingLink>;
  createMarketingLinks(links: InsertMarketingLink[]): Promise<MarketingLink[]>; // Bulk creation
  getMarketingLinks(filters?: { campaignId?: number; isActive?: boolean }): Promise<MarketingLink[]>;
  getMarketingLink(id: number): Promise<MarketingLink | undefined>;
  getMarketingLinkByCode(code: string): Promise<MarketingLink | undefined>;
  updateMarketingLink(id: number, link: Partial<InsertMarketingLink>): Promise<MarketingLink>;
  getMarketingLinkStats(linkId: number): Promise<{ clicks: number; cadastros: number; conversoes: number; taxa: number }>;
  linkUserToActiveCampaign(userId: number): Promise<MarketingLink | null>; // Vincula automaticamente à campanha ativa

  // Tracking
  createMktClick(click: InsertMktClick): Promise<MktClick>;
  getMarketingCampaignStats(campaignId: number): Promise<{ totalLinks: number; totalClicks: number; totalCadastros: number; totalConversoes: number; taxaConversao: number }>;
  
  // Gritos baseados em plano (async para suportar Platinum dinâmico)
  getGritosIniciaisPorPlano(plano: string, userId?: number): Promise<number>;
  
  // Gritos
  addGritosToUser(userId: number, gritos: number): Promise<void>;
  recalculateUserGritos(userId: number): Promise<number>;
  syncAllUsersGritos(): Promise<void>;
  createGritosHistorico(historico: InsertGritosHistorico): Promise<GritosHistorico>;
  getGritosHistory(userId: number): Promise<GritosHistorico[]>;
  getBonusInicialUser(userId: number): Promise<GritosHistorico | undefined>;

  // Níveis
  getNivelByGritos(gritos: number): Promise<Nivel | undefined>;

  // ===== MÓDULO BENEFÍCIOS DINÂMICOS =====
  getAllBeneficios(): Promise<Beneficio[]>;
  getBeneficiosAtivos(): Promise<Beneficio[]>;
  getBeneficiosByPlano(planoMinimo: string): Promise<Beneficio[]>;
  getBeneficio(id: number): Promise<Beneficio | undefined>;
  createBeneficio(beneficio: InsertBeneficio): Promise<Beneficio>;
  updateBeneficio(id: number, beneficio: Partial<InsertBeneficio>): Promise<Beneficio>;
  deleteBeneficio(id: number): Promise<void>;

  // ===== MÓDULO IMAGENS DOS BENEFÍCIOS =====
  createBeneficioImagem(imagem: InsertBeneficioImagem): Promise<BeneficioImagem>;
  getBeneficioImagem(beneficioId: number, tipo?: string): Promise<BeneficioImagem | undefined>;
  getBeneficioImagensByBeneficio(beneficioId: number): Promise<BeneficioImagem[]>;
  updateBeneficioImagem(beneficioId: number, imagem: Partial<InsertBeneficioImagem>): Promise<BeneficioImagem>;
  deleteBeneficioImagem(beneficioId: number, tipo?: string): Promise<void>;

  // ===== SISTEMA DE CAUSAS (GRITO) =====
  saveUserCausa(userId: number, causa: string): Promise<void>;
  clearUserCausas(userId: number): Promise<void>;
  getUserCausas(userId: number): Promise<string[]>;

  // ===== SISTEMA DE DOAÇÕES - CÁLCULO REAL =====
  getUserTotalDonations(userId: number): Promise<number>;

  // ===== MÓDULO LEILÕES DE PONTOS =====
  // Prêmios
  getAllPremios(): Promise<Premio[]>;
  getPremiosAtivos(): Promise<Premio[]>;
  getPremio(id: number): Promise<Premio | undefined>;
  createPremio(premio: InsertPremio): Promise<Premio>;
  updatePremio(id: number, premio: Partial<InsertPremio>): Promise<Premio>;
  deletePremio(id: number): Promise<void>;

  // Leilões
  getAllLeiloes(): Promise<Leilao[]>;
  getLeiloesAtivos(): Promise<Leilao[]>;
  getLeilao(id: number): Promise<Leilao | undefined>;
  createLeilao(leilao: InsertLeilao): Promise<Leilao>;
  updateLeilao(id: number, leilao: Partial<InsertLeilao>): Promise<Leilao>;
  finalizarLeilao(id: number, vencedorId: string): Promise<Leilao>;

  // Lances
  createLance(lance: InsertLance): Promise<Lance>;
  getLancesByLeilao(leilaoId: number): Promise<Lance[]>;
  getLancesByUser(userId: string): Promise<Lance[]>;
  processarLance(leilaoId: number, userId: string, valor: number): Promise<{ sucesso: boolean; mensagem: string; lanceId?: number }>;

  // ===== SISTEMA DE LANCES EM BENEFÍCIOS =====
  createBeneficioLance(lance: InsertBeneficioLance): Promise<BeneficioLance>;
  getBeneficioLancesByUser(userId: number): Promise<BeneficioLance[]>;
  getBeneficioLancesByBeneficio(beneficioId: number): Promise<BeneficioLance[]>;
  checkUserBeneficioParticipation(userId: number, beneficioId: number): Promise<boolean>;
  processarBeneficioLance(userId: number, beneficioId: number, pontosOfertados: number): Promise<{ success: boolean; message: string; lanceId?: number }>;
  aumentarBeneficioLance(userId: number, beneficioId: number, novosPontosOfertados: number): Promise<{ success: boolean; message: string; lanceId?: number }>;

  // ===== PROCESSAMENTO AUTOMÁTICO DE LEILÕES EXPIRADOS =====
  getExpiredBeneficiosUnprocessed(): Promise<Beneficio[]>;
  processExpiredAuctions(): Promise<{
    totalProcessed: number;
    winners: Array<{ beneficioId: number; winnerId: number; pontosOfertados: number }>;
    details: Array<{ beneficioId: number; totalBids: number; winnerUserId: number; pontosDescontados: number }>;
  }>;
  updateBeneficioLancesStatus(lanceIds: number[], status: string, dataResultado?: Date): Promise<void>;
  adjustUserPoints(userId: number, pointsChange: number, reason: string): Promise<void>;

  // ===== DASHBOARD MACRO DE LEILÕES =====
  getAuctionsSummary(): Promise<{
    leiloesAtivos: number;
    leiloesAguardando: number;
    leiloesFinalizados: number;
  }>;
  getAuctionsStats(): Promise<{
    lancesTotais: number;
    usuariosParticipando: number;
    produtoMaisDisputado: { titulo: string; totalLances: number } | null;
    mediaPontosPorLance: number;
    lancesPorLeilao: Array<{ beneficioId: number; titulo: string; totalLances: number }>;
    topUsuarios: Array<{ userId: number; nome: string; totalPontosOfertados: number }>;
  }>;

  // ===== DASHBOARD DE DOADORES =====
  getDonorStats(): Promise<{
    totalAtivos: number;
    distribucaoPlano: { plano: string; count: number }[];
    quantidadeMissoes: number;
    quantidadeCheckinDiario: number;
    engajamentoMedio: {
      gritosMedia: number;
      streakMedia: number;
      checkinsSemana: number;
    };
  }>;
  getDonorsWithFilters(filters: {
    busca?: string;
    plano?: string;
    status?: string;
    periodo?: string;
    limite?: number;
    offset?: number;
    ordenacao?: string;
  }): Promise<{
    doadores: Array<{
      id: number;
      nome: string;
      telefone: string;
      email: string;
      plano: string;
      valor: number;
      status: string;
      dataDoacaoInicial: Date;
      ultimaDoacao: Date;
      gritosTotal: number;
      nivelAtual: number;
      diasConsecutivos: number;
      ultimoCheckin: string;
      temMissoes: boolean;
      ativo: boolean;
    }>;
    total: number;
  }>;
  getDonorDetails(donorId: number): Promise<{
    dadosPessoais: {
      id: number;
      nome: string;
      sobrenome: string;
      telefone: string;
      email: string;
      dataCadastro: Date;
    };
    dadosDoacao: {
      plano: string;
      valor: number;
      status: string;
      stripeCustomerId: string;
      stripeSubscriptionId: string;
      dataDoacaoInicial: Date;
      ultimaDoacao: Date;
      totalDoacoes: number;
      ativo: boolean;
    };
    gamificacao: {
      gritosTotal: number;
      nivelAtual: number;
      proximoNivel: number;
      gritosParaProximoNivel: number;
      diasConsecutivos: number;
      ultimoCheckin: string;
      streakAtual: number;
    };
    atividadeRecente: {
      ultimasMissoes: Array<{
        titulo: string;
        concluidaEm: Date;
        gritosRecebidos: number;
      }>;
      ultimosCheckins: Array<{
        dataCheckin: Date;
        gritosGanhos: number;
      }>;
      historicoGritos: Array<{
        tipo: string;
        gritosGanhos: number;
        descricao: string;
        dataGanho: Date;
      }>;
    };
  } | undefined>;

  // ===== SINCRONIZAÇÃO DE DOADORES COM STRIPE =====
  syncDonorsFromStripe(): Promise<Array<{
    nome: string;
    telefone: string;
    email: string;
    stripeCustomerId: string;
    valor: number;
    totalPagamentos: number;
  }>>;
  getAllDonors(): Promise<Array<{
    id: number;
    nome: string;
    telefone: string;
    email: string;
    plano: string;
    valor: number;
    status: string;
    stripeCustomerId: string;
    ativo: boolean;
    dataDoacaoInicial: Date;
  }>>;

  // ===== SISTEMA DE RASTREAMENTO DE ATIVIDADE =====
  // Métodos para capturar e analisar comportamento do usuário
  logActivity(activityData: InsertActivityEvent): Promise<ActivityEvent>;
  getUserInterests(userId: number): Promise<UserInterest[]>;
  upsertUserInterest(userId: number, category: string, tag: string, scoreIncrement?: number): Promise<UserInterest>;
  getRecommendations(userId: number, entityTypes?: string[], limit?: number): Promise<RecommendationResponse>;
  getUserActivityProfile(userId: number): Promise<{
    totalInteractions: number;
    topCategories: Array<{ category: string; score: number }>;
    topTags: Array<{ tag: string; score: number }>;
    lastActivity: string | null;
    recentEvents: ActivityEvent[];
  }>;
  cleanupOldActivityEvents(daysCutoff?: number): Promise<number>; // Para manutenção

  // ===== SISTEMA PEC: PROJETOS EDUCACIONAIS CULTURAIS =====
  // Projetos
  getAllProjects(): Promise<Project[]>;
  getProject(id: number): Promise<Project | undefined>;
  createProject(data: InsertProject): Promise<Project>;
  updateProject(id: number, data: Partial<InsertProject>): Promise<Project>;
  deleteProject(id: number): Promise<void>;

  // Atividades
  getActivitiesByProject(projectId: number): Promise<Activity[]>;
  getActivity(id: number): Promise<Activity | undefined>;
  createActivity(data: InsertActivity): Promise<Activity>;
  updateActivity(id: number, data: Partial<InsertActivity>): Promise<Activity>;
  deleteActivity(id: number): Promise<void>;

  // Instâncias de atividades (turmas)
  getAllActivityInstances(): Promise<ActivityInstance[]>;
  getActivityInstancesByActivity(activityId: number): Promise<ActivityInstance[]>;
  getActivityInstance(id: number): Promise<ActivityInstance | undefined>;
  createActivityInstance(data: InsertActivityInstance): Promise<ActivityInstance>;
  updateActivityInstance(id: number, data: Partial<InsertActivityInstance>): Promise<ActivityInstance>;
  deleteActivityInstance(id: number): Promise<void>;

  // Atribuições de equipe
  getStaffByActivityInstance(activityInstanceId: number): Promise<StaffAssignment[]>;
  createStaffAssignment(data: InsertStaffAssignment): Promise<StaffAssignment>;
  updateStaffAssignment(id: number, data: Partial<InsertStaffAssignment>): Promise<StaffAssignment>;
  deleteStaffAssignment(id: number): Promise<void>;

  // Inscrições
  getEnrollmentsByActivityInstance(activityInstanceId: number): Promise<Enrollment[]>;
  getEnrollment(id: number): Promise<Enrollment | undefined>;
  createEnrollment(data: InsertEnrollment): Promise<Enrollment>;
  updateEnrollment(id: number, data: Partial<InsertEnrollment>): Promise<Enrollment>;
  deleteEnrollment(id: number): Promise<void>;

  // Sessões
  getSessionsByActivityInstance(activityInstanceId: number): Promise<Session[]>;
  getSession(id: number): Promise<Session | undefined>;
  createSession(data: InsertSession): Promise<Session>;
  updateSession(id: number, data: Partial<InsertSession>): Promise<Session>;
  deleteSession(id: number): Promise<void>;

  // Presenças
  getAttendancesBySession(sessionId: number): Promise<Attendance[]>;
  getAttendancesByEnrollment(enrollmentId: number): Promise<Attendance[]>;
  createAttendance(data: InsertAttendance): Promise<Attendance>;
  updateAttendance(id: number, data: Partial<InsertAttendance>): Promise<Attendance>;
  deleteAttendance(id: number): Promise<void>;

  // Fotos
  getPhotosByActivityInstance(activityInstanceId: number): Promise<Photo[]>;
  getPhotosBySession(sessionId: number): Promise<Photo[]>;
  createPhoto(data: InsertPhoto): Promise<Photo>;
  updatePhoto(id: number, data: Partial<InsertPhoto>): Promise<Photo>;
  deletePhoto(id: number): Promise<void>;

  // Relatórios e cálculos PEC
  getPecReportData(activityInstanceId: number, month?: number, year?: number): Promise<{
    projeto: Project;
    atividade: Activity;
    turma: ActivityInstance;
    cargaHorariaMes: number;
    atendidosMes: number;
    frequenciaMedia: number;
    totalInscritos: number;
    sessoes: Session[];
    inscritos: Array<Enrollment & { pessoa: User }>;
  }>;

  // ===== SISTEMA DE INGRESSOS DIGITAIS =====
  // Métodos para gerenciar ingressos de eventos
  createIngresso(data: InsertIngresso): Promise<Ingresso>;
  getIngressosByUser(userId: number): Promise<Ingresso[]>;
  getIngressosByComprador(nomeComprador: string, telefoneComprador?: string): Promise<Ingresso[]>;
  getIngresso(id: number): Promise<Ingresso | undefined>;
  getIngressoBySessionId(sessionId: string): Promise<Ingresso | undefined>;
  getIngressosByContato(contato: string): Promise<Ingresso[]>;
  getProximoNumeroIngresso(): Promise<string>;
  updateIngressoStatus(id: number, status: string, dataUso?: Date): Promise<Ingresso>;

  // ===== SISTEMA DE COTAS DE EMPRESAS =====
  // Métodos para gerenciar cotas de ingressos para empresas
  createCotaEmpresa(data: InsertCotaEmpresa): Promise<CotaEmpresa>;
  getCotasEmpresas(): Promise<CotaEmpresa[]>;
  getCotaEmpresaByNome(nomeEmpresa: string): Promise<CotaEmpresa | undefined>;
  getCotaEmpresaById(id: number): Promise<CotaEmpresa | undefined>;
  validarEmpresa(nomeEmpresa: string, email?: string): Promise<{ valida: boolean; cota?: CotaEmpresa; mensagem: string }>;
  consultarDisponibilidadeCota(idCota: number): Promise<{ disponivel: number; total: number; usado: number }>;
  usarCota(idCota: number): Promise<void>;
  updateCotaEmpresa(id: number, data: Partial<InsertCotaEmpresa>): Promise<CotaEmpresa>;

  // ===== MÓDULO EDUCADORES =====
  // Educadores
  getAllEducadores(): Promise<Educador[]>;
  getEducadoresByPrograma(programa: string): Promise<Array<Educador & { vinculo: EducadorPrograma }>>;
  getEducadorById(id: number): Promise<Educador | undefined>;
  getEducadorByCpf(cpf: string): Promise<Educador | undefined>;
  createEducador(data: InsertEducador): Promise<Educador>;
  updateEducador(id: number, data: Partial<InsertEducador>): Promise<Educador>;
  deleteEducador(id: number): Promise<void>;

  // Vínculos Educador-Programa
  createEducadorPrograma(data: InsertEducadorPrograma): Promise<EducadorPrograma>;
  getEducadorProgramas(educadorId: number): Promise<EducadorPrograma[]>;
  removeEducadorPrograma(educadorId: number, programa: string): Promise<void>;

  // Vínculos Aluno-Programa
  createAlunoPrograma(data: InsertAlunoPrograma): Promise<AlunoPrograma>;
  getAlunosByPrograma(programa: string): Promise<Array<Aluno & { vinculo: AlunoPrograma }>>;
  getAlunoProgramas(alunoCpf: string): Promise<AlunoPrograma[]>;
  removeAlunoPrograma(alunoCpf: string, programa: string): Promise<void>;

  // ===== MÓDULO INCLUSÃO PRODUTIVA - PROGRAMAS =====
  getAllProgramas(): Promise<any[]>;
  getProgramaById(id: number): Promise<any | undefined>;
  createPrograma(data: any): Promise<any>;
  updatePrograma(id: number, data: any): Promise<any>;
  deletePrograma(id: number): Promise<void>;

  // ===== MÓDULO INCLUSÃO PRODUTIVA - TURMAS =====
  getAllTurmasInclusao(): Promise<TurmaInclusao[]>;
  getTurmaById(id: number): Promise<TurmaInclusao | undefined>;
  getTurmasByPrograma(programaId: number): Promise<TurmaInclusao[]>;
  createTurmaInclusao(data: InsertTurmaInclusao): Promise<TurmaInclusao>;
  updateTurmaInclusao(id: number, data: Partial<InsertTurmaInclusao>): Promise<TurmaInclusao>;
  deleteTurmaInclusao(id: number): Promise<void>;

  // ===== MÓDULO INCLUSÃO PRODUTIVA - CURSOS =====
  getAllCursos(): Promise<any[]>;
  getCursoById(id: number): Promise<any | undefined>;
  getCursosByPrograma(programaId: number): Promise<any[]>;
  getCursosByTurma(turmaId: number): Promise<any[]>;
  createCurso(data: InsertCursoInclusao, turmaIds?: number[]): Promise<CursoInclusao>;
  updateCurso(id: number, data: Partial<InsertCursoInclusao>): Promise<CursoInclusao>;
  deleteCurso(id: number): Promise<void>;

  // Relacionamentos Curso-Turma
  addCursoToTurma(cursoId: number, turmaId: number): Promise<CursoTurma | null>;
  removeCursoFromTurma(cursoId: number, turmaId: number): Promise<void>;
  getTurmasByCurso(cursoId: number): Promise<TurmaInclusao[]>;

  // ===== MÓDULO INCLUSÃO PRODUTIVA - PARTICIPANTES =====
  getAllParticipantes(): Promise<ParticipanteInclusao[]>;
  getParticipanteById(id: number): Promise<ParticipanteInclusao | undefined>;
  getParticipanteByCpf(cpf: string): Promise<ParticipanteInclusao | undefined>;
  createParticipante(data: InsertParticipanteInclusao, turmaIds?: number[]): Promise<ParticipanteInclusao>;
  updateParticipante(id: number, data: Partial<InsertParticipanteInclusao>): Promise<ParticipanteInclusao>;
  deleteParticipante(id: number): Promise<void>;

  // Relacionamentos Participante-Turma
  addParticipanteToTurma(participanteId: number, turmaId: number): Promise<ParticipanteTurma>;
  removeParticipanteFromTurma(participanteId: number, turmaId: number): Promise<void>;
  getTurmasByParticipante(participanteId: number): Promise<TurmaInclusao[]>;
  getParticipantesByTurma(turmaId: number): Promise<ParticipanteInclusao[]>;

  // ===== MÓDULO PSICOSSOCIAL =====
  listPsicoFamilias(): Promise<any[]>;
  listPsicoCasos(): Promise<any[]>;
  listPsicoAtendimentos(): Promise<any[]>;
  listPsicoPlanos(): Promise<any[]>;
  createPsicoFamilia(data: any): Promise<any>;

  // ===== SISTEMA DE MARKETING (CAMPANHAS E LINKS) =====
  getAllMarketingCampaigns(): Promise<MarketingCampaign[]>;
  createMarketingCampaign(campaign: InsertMarketingCampaign): Promise<MarketingCampaign>;
  getAllMarketingLinks(): Promise<MarketingLink[]>;
  createMarketingLink(link: InsertMarketingLink): Promise<MarketingLink>;
  updateMarketingLink(id: number, data: Partial<InsertMarketingLink>): Promise<MarketingLink>;
  marketingLinkCodeExists(code: string): Promise<boolean>;
  getMarketingLinkStats(code: string): Promise<{ cliques: number; conversoes: number; taxa_conversao: number }>;

}

// Nova implementação do DatabaseStorage
export class DatabaseStorage implements IStorage {
  // ===== MÓDULO 1: USUÁRIOS GERAIS =====
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select({
      id: users.id,
      cpf: users.cpf,
      nome: users.nome,
      sobrenome: users.sobrenome,
      telefone: users.telefone,
      email: users.email,
      fotoPerfil: users.fotoPerfil,
      verificado: users.verificado,
      ativo: users.ativo,
      plano: users.plano,
      stripeCustomerId: users.stripeCustomerId,
      stripeSubscriptionId: users.stripeSubscriptionId,
      subscriptionStatus: users.subscriptionStatus,
      role: users.role,
      tipo: users.tipo,
      fonte: users.fonte,
      professorTipo: users.professorTipo,
      formacao: users.formacao,
      especializacao: users.especializacao,
      experiencia: users.experiencia,
      disciplinas: users.disciplinas,
      conselhoStatus: users.conselhoStatus,
      conselhoApprovedBy: users.conselhoApprovedBy,
      conselhoApprovedAt: users.conselhoApprovedAt,
      gritosTotal: users.gritosTotal,
      nivelAtual: users.nivelAtual,
      proximoNivel: users.proximoNivel,
      gritosParaProximoNivel: users.gritosParaProximoNivel,
      diasConsecutivos: users.diasConsecutivos,
      ultimoCheckin: users.ultimoCheckin,
      semanaAtual: users.semanaAtual,
      projetosApoiados: users.projetosApoiados,
      dataCadastro: users.dataCadastro,
      createdAt: users.createdAt
    }).from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByTelefone(telefone: string): Promise<User | undefined> {
    console.log(`🔍 [PHONE SEARCH] Buscando telefone: ${telefone}`);

    if (!telefone || typeof telefone !== 'string') {
      console.log(`❌ [PHONE INVALID] Telefone inválido: ${telefone}`);
      return undefined;
    }

    const phoneClean = telefone.replace(/\D/g, '');
    
    if (phoneClean.length < 8) {
      console.log(`❌ [PHONE TOO SHORT] Telefone muito curto: ${phoneClean} (${phoneClean.length} dígitos)`);
      return undefined;
    }
    
    const possibleFormats = [
      telefone,
      phoneClean,
      `+${phoneClean}`,
      `+55${phoneClean}`,
      phoneClean.startsWith('55') ? phoneClean : `55${phoneClean}`,
      phoneClean.startsWith('55') ? `+${phoneClean}` : `+55${phoneClean}`,
      phoneClean.startsWith('55') ? phoneClean.substring(2) : phoneClean,
      phoneClean.startsWith('5531') ? phoneClean.substring(2) : phoneClean
    ].filter((format, index, self) => format && format.length >= 8 && self.indexOf(format) === index);

    console.log(`🔍 [PHONE SEARCH] Formatos testados: ${possibleFormats.join(', ')}`);

    if (possibleFormats.length === 0) {
      console.log(`❌ [NO VALID FORMATS] Nenhum formato válido gerado`);
      return undefined;
    }

    const [user] = await db.select({
      id: users.id,
      cpf: users.cpf,
      nome: users.nome,
      sobrenome: users.sobrenome,
      telefone: users.telefone,
      email: users.email,
      fotoPerfil: users.fotoPerfil,
      verificado: users.verificado,
      ativo: users.ativo,
      plano: users.plano,
      stripeCustomerId: users.stripeCustomerId,
      stripeSubscriptionId: users.stripeSubscriptionId,
      subscriptionStatus: users.subscriptionStatus,
      role: users.role,
      tipo: users.tipo,
      fonte: users.fonte,
      professorTipo: users.professorTipo,
      formacao: users.formacao,
      especializacao: users.especializacao,
      experiencia: users.experiencia,
      disciplinas: users.disciplinas,
      conselhoStatus: users.conselhoStatus,
      conselhoApprovedBy: users.conselhoApprovedBy,
      conselhoApprovedAt: users.conselhoApprovedAt,
      gritosTotal: users.gritosTotal,
      nivelAtual: users.nivelAtual,
      proximoNivel: users.proximoNivel,
      gritosParaProximoNivel: users.gritosParaProximoNivel,
      diasConsecutivos: users.diasConsecutivos,
      ultimoCheckin: users.ultimoCheckin,
      semanaAtual: users.semanaAtual,
      projetosApoiados: users.projetosApoiados,
      dataCadastro: users.dataCadastro,
      createdAt: users.createdAt
    }).from(users).where(
      inArray(users.telefone, possibleFormats)
    );

    if (user) {
      console.log(`✅ [PHONE FOUND] Usuário encontrado: ${user.nome} (telefone no banco: ${user.telefone})`);
      return user;
    }

    console.log(`❌ [PHONE NOT FOUND] Nenhum usuário encontrado para: ${telefone}`);
    return undefined;
  }

  async getUserByPhone(telefone: string): Promise<User | undefined> {
    const [user] = await db.select({
      id: users.id,
      cpf: users.cpf,
      nome: users.nome,
      sobrenome: users.sobrenome,
      telefone: users.telefone,
      email: users.email,
      fotoPerfil: users.fotoPerfil,
      verificado: users.verificado,
      ativo: users.ativo,
      plano: users.plano,
      stripeCustomerId: users.stripeCustomerId,
      stripeSubscriptionId: users.stripeSubscriptionId,
      subscriptionStatus: users.subscriptionStatus,
      role: users.role,
      tipo: users.tipo,
      fonte: users.fonte,
      professorTipo: users.professorTipo,
      formacao: users.formacao,
      especializacao: users.especializacao,
      experiencia: users.experiencia,
      disciplinas: users.disciplinas,
      conselhoStatus: users.conselhoStatus,
      conselhoApprovedBy: users.conselhoApprovedBy,
      conselhoApprovedAt: users.conselhoApprovedAt,
      gritosTotal: users.gritosTotal,
      nivelAtual: users.nivelAtual,
      proximoNivel: users.proximoNivel,
      gritosParaProximoNivel: users.gritosParaProximoNivel,
      diasConsecutivos: users.diasConsecutivos,
      ultimoCheckin: users.ultimoCheckin,
      semanaAtual: users.semanaAtual,
      projetosApoiados: users.projetosApoiados,
      dataCadastro: users.dataCadastro,
      createdAt: users.createdAt
    }).from(users).where(eq(users.telefone, telefone));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select({
      id: users.id,
      cpf: users.cpf,
      nome: users.nome,
      sobrenome: users.sobrenome,
      telefone: users.telefone,
      email: users.email,
      fotoPerfil: users.fotoPerfil,
      verificado: users.verificado,
      ativo: users.ativo,
      plano: users.plano,
      stripeCustomerId: users.stripeCustomerId,
      stripeSubscriptionId: users.stripeSubscriptionId,
      subscriptionStatus: users.subscriptionStatus,
      role: users.role,
      tipo: users.tipo,
      fonte: users.fonte,
      professorTipo: users.professorTipo,
      formacao: users.formacao,
      especializacao: users.especializacao,
      experiencia: users.experiencia,
      disciplinas: users.disciplinas,
      conselhoStatus: users.conselhoStatus,
      conselhoApprovedBy: users.conselhoApprovedBy,
      conselhoApprovedAt: users.conselhoApprovedAt,
      gritosTotal: users.gritosTotal,
      nivelAtual: users.nivelAtual,
      proximoNivel: users.proximoNivel,
      gritosParaProximoNivel: users.gritosParaProximoNivel,
      diasConsecutivos: users.diasConsecutivos,
      ultimoCheckin: users.ultimoCheckin,
      semanaAtual: users.semanaAtual,
      projetosApoiados: users.projetosApoiados,
      dataCadastro: users.dataCadastro,
      createdAt: users.createdAt
    }).from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();

    // Bônus de 50 gritos será dado apenas no webhook do Stripe após pagamento confirmado
    console.log(`✅ [USER CREATED] Usuário ${user.id} (${user.nome}) criado. Gritos serão dados após confirmação de pagamento.`);

    return user;
  }

  async createOrUpdateUser(insertUser: InsertUser): Promise<User> {
    const existingUser = await this.getUserByTelefone(insertUser.telefone);

    if (existingUser) {
      const [updatedUser] = await db
        .update(users)
        .set({ ...insertUser, id: existingUser.id })
        .where(eq(users.id, existingUser.id))
        .returning();
      return updatedUser;
    } else {
      return this.createUser(insertUser);
    }
  }

  async updateUser(id: number, userData: { nome?: string; telefone?: string; email?: string; professorTipo?: string; fotoPerfil?: string; plano?: string }): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  async updateUserVerification(id: number, isVerified: boolean): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ verificado: isVerified })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async updateConselhoStatus(telefone: string, status: string, approvedBy?: string): Promise<User> {
    const updateData: any = {
      conselhoStatus: status,
      conselhoApprovedAt: new Date()
    };

    if (approvedBy) {
      updateData.conselhoApprovedBy = approvedBy;
    }

    const [user] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.telefone, telefone))
      .returning();
    return user;
  }

  async updateUserStripeInfo(id: number, stripeCustomerId?: string, stripeSubscriptionId?: string, subscriptionStatus?: string): Promise<User> {
    const updateData: any = {};

    if (stripeCustomerId !== undefined) {
      updateData.stripeCustomerId = stripeCustomerId;
    }

    if (stripeSubscriptionId !== undefined) {
      updateData.stripeSubscriptionId = stripeSubscriptionId;
    }

    if (subscriptionStatus !== undefined) {
      updateData.subscriptionStatus = subscriptionStatus;
    }

    const [user] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, id))
      .returning();

    return user;
  }

  // ✅ PROJETOS APOIADOS: Implementação dos métodos para gerenciar projetos apoiados
  async getUserSupportedProjects(userId: number): Promise<string[]> {
    const [user] = await db
      .select({ projetosApoiados: users.projetosApoiados })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    return user?.projetosApoiados || [];
  }

  async updateUserSupportedProjects(userId: number, projects: string[]): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ projetosApoiados: projects })
      .where(eq(users.id, userId))
      .returning();

    return user;
  }

  async getPendingConselhoRequests(): Promise<User[]> {
    return db.select({
      id: users.id,
      cpf: users.cpf,
      nome: users.nome,
      sobrenome: users.sobrenome,
      telefone: users.telefone,
      email: users.email,
      fotoPerfil: users.fotoPerfil,
      verificado: users.verificado,
      ativo: users.ativo,
      plano: users.plano,
      stripeCustomerId: users.stripeCustomerId,
      stripeSubscriptionId: users.stripeSubscriptionId,
      subscriptionStatus: users.subscriptionStatus,
      role: users.role,
      tipo: users.tipo,
      fonte: users.fonte,
      professorTipo: users.professorTipo,
      formacao: users.formacao,
      especializacao: users.especializacao,
      experiencia: users.experiencia,
      disciplinas: users.disciplinas,
      conselhoStatus: users.conselhoStatus,
      conselhoApprovedBy: users.conselhoApprovedBy,
      conselhoApprovedAt: users.conselhoApprovedAt,
      gritosTotal: users.gritosTotal,
      nivelAtual: users.nivelAtual,
      proximoNivel: users.proximoNivel,
      gritosParaProximoNivel: users.gritosParaProximoNivel,
      diasConsecutivos: users.diasConsecutivos,
      ultimoCheckin: users.ultimoCheckin,
      semanaAtual: users.semanaAtual,
      projetosApoiados: users.projetosApoiados,
      dataCadastro: users.dataCadastro,
      createdAt: users.createdAt
    }).from(users).where(eq(users.conselhoStatus, 'pendente'));
  }

  async getAllUsers(): Promise<User[]> {
    return db.select({
      id: users.id,
      cpf: users.cpf,
      nome: users.nome,
      sobrenome: users.sobrenome,
      telefone: users.telefone,
      email: users.email,
      fotoPerfil: users.fotoPerfil,
      verificado: users.verificado,
      ativo: users.ativo,
      plano: users.plano,
      stripeCustomerId: users.stripeCustomerId,
      stripeSubscriptionId: users.stripeSubscriptionId,
      subscriptionStatus: users.subscriptionStatus,
      role: users.role,
      tipo: users.tipo,
      fonte: users.fonte,
      professorTipo: users.professorTipo,
      formacao: users.formacao,
      especializacao: users.especializacao,
      experiencia: users.experiencia,
      disciplinas: users.disciplinas,
      conselhoStatus: users.conselhoStatus,
      conselhoApprovedBy: users.conselhoApprovedBy,
      conselhoApprovedAt: users.conselhoApprovedAt,
      gritosTotal: users.gritosTotal,
      nivelAtual: users.nivelAtual,
      proximoNivel: users.proximoNivel,
      gritosParaProximoNivel: users.gritosParaProximoNivel,
      diasConsecutivos: users.diasConsecutivos,
      ultimoCheckin: users.ultimoCheckin,
      semanaAtual: users.semanaAtual,
      projetosApoiados: users.projetosApoiados,
      dataCadastro: users.dataCadastro,
      createdAt: users.createdAt
    }).from(users).orderBy(desc(users.dataCadastro));
  }

  async getAllTelas(): Promise<SistemaTela[]> {
    try {
      return await db.select().from(sistemaTelas).orderBy(asc(sistemaTelas.id));
    } catch (error) {
      // If table doesn't exist yet, return empty array
      console.log("Sistema telas table not found, returning empty array");
      return [];
    }
  }

  async getTelaHistorico(telaId: number): Promise<any[]> {
    // Mock data for now - would be real database query in production
    return [
      {
        id: 1,
        telaId,
        descricao: "Criação inicial da tela",
        responsavel: "Sistema",
        tipoAlteracao: "criacao",
        dataAlteracao: "2025-01-01T10:00:00Z"
      },
      {
        id: 2,
        telaId,
        descricao: "Atualização de layout e funcionalidades",
        responsavel: "Desenvolvedor",
        tipoAlteracao: "modificacao",
        dataAlteracao: "2025-01-15T14:30:00Z"
      }
    ];
  }

  async createTelaHistorico(data: any): Promise<any> {
    // Mock creation - would be real database insert in production
    return {
      id: Date.now(),
      ...data,
      dataAlteracao: new Date().toISOString()
    };
  }

  async getDeveloperPanelHistory(): Promise<any[]> {
    // Historical changes to the developer panel itself
    return [
      {
        id: 1,
        descricao: "Implementação inicial do painel do desenvolvedor",
        responsavel: "Sistema",
        tipoAlteracao: "feature",
        dataAlteracao: "2025-01-01T12:00:00Z"
      },
      {
        id: 2,
        descricao: "Adicionado monitoramento de telas do sistema",
        responsavel: "Desenvolvedor",
        tipoAlteracao: "feature",
        dataAlteracao: "2025-01-10T16:45:00Z"
      },
      {
        id: 3,
        descricao: "Implementado sistema de comentários técnicos",
        responsavel: "Desenvolvedor",
        tipoAlteracao: "enhancement",
        dataAlteracao: "2025-01-20T09:15:00Z"
      },
      {
        id: 4,
        descricao: "Adicionada visualização de usuários e acessos",
        responsavel: "Desenvolvedor",
        tipoAlteracao: "feature",
        dataAlteracao: new Date().toISOString()
      },
      {
        id: 5,
        descricao: "Implementado histórico de alterações das telas",
        responsavel: "Desenvolvedor",
        tipoAlteracao: "feature",
        dataAlteracao: new Date().toISOString()
      }
    ];
  }

  async createDeveloperPanelHistory(data: any): Promise<any> {
    // Mock creation - would be real database insert in production
    return {
      id: Date.now(),
      ...data,
      dataAlteracao: new Date().toISOString()
    };
  }

  // ===== MÓDULO 2: CADASTRO DE ALUNOS =====

  // Métodos para Pais
  async createPai(insertPai: InsertPai): Promise<Pai> {
    const [pai] = await db
      .insert(pais)
      .values(insertPai)
      .returning();
    return pai;
  }

  async getPaiByCpf(cpf: string): Promise<Pai | undefined> {
    const [pai] = await db.select().from(pais).where(eq(pais.cpf, cpf));
    return pai || undefined;
  }

  // Métodos para Mães
  async createMae(insertMae: InsertMae): Promise<Mae> {
    const [mae] = await db
      .insert(maes)
      .values(insertMae)
      .returning();
    return mae;
  }

  async getMaeByCpf(cpf: string): Promise<Mae | undefined> {
    const [mae] = await db.select().from(maes).where(eq(maes.cpf, cpf));
    return mae || undefined;
  }

  // Métodos para Responsáveis
  async createResponsavel(insertResponsavel: InsertResponsavel): Promise<Responsavel> {
    const [responsavel] = await db
      .insert(responsaveis)
      .values(insertResponsavel)
      .returning();
    return responsavel;
  }

  async getResponsavelByCpf(cpf: string): Promise<Responsavel | undefined> {
    const [responsavel] = await db.select().from(responsaveis).where(eq(responsaveis.cpf, cpf));
    return responsavel || undefined;
  }

  async createAluno(studentData: any): Promise<Aluno> {
    // Criar registro do aluno com todos os dados do formulário completo
    const alunoData = {
      cpf: studentData.cpf,
      nome_completo: studentData.nome_completo,
      foto_perfil: studentData.foto_perfil,
      data_nascimento: studentData.data_nascimento,
      genero: studentData.genero,
      numero_matricula: studentData.numero_matricula,
      estado_civil: studentData.estado_civil,
      religiao: studentData.religiao,
      naturalidade: studentData.naturalidade,
      nacionalidade: studentData.nacionalidade || 'Brasil',
      pode_sair_sozinho: studentData.pode_sair_sozinho,

      // Dados complementares
      tamanho_calca: studentData.tamanho_calca,
      tamanho_camiseta: studentData.tamanho_camiseta,
      tamanho_calcado: studentData.tamanho_calcado,
      cor_raca: studentData.cor_raca,
      frequenta_projeto_social: studentData.frequenta_projeto_social,
      acesso_internet: studentData.acesso_internet,

      // Documentos
      rg: studentData.rg,
      orgao_emissor: studentData.orgao_emissor,
      ctps_numero: studentData.ctps_numero,
      ctps_serie: studentData.ctps_serie,
      titulo_eleitor: studentData.titulo_eleitor,
      nis_pis_pasep: studentData.nis_pis_pasep,
      documentos_possui: studentData.documentos_possui,
      upload_identidade_frente: studentData.upload_identidade_frente,
      upload_identidade_verso: studentData.upload_identidade_verso,

      // Contato
      email: studentData.email,
      telefone: studentData.telefone,
      whatsapp: studentData.whatsapp,
      contatos_emergencia: studentData.contatos_emergencia,

      // Benefícios
      cadunico: studentData.cadunico,
      bolsa_familia: studentData.bolsa_familia,
      bpc: studentData.bpc,
      cartao_alimentacao: studentData.cartao_alimentacao,
      outros_beneficios: studentData.outros_beneficios,

      // Escolar
      serie: studentData.serie,
      situacao_escolar: studentData.situacao_escolar,
      turno_escolar: studentData.turno_escolar,
      instituicao_ensino: studentData.instituicao_ensino,
      e_alfabetizado: studentData.e_alfabetizado,
      bairro_escola: studentData.bairro_escola,

      // Profissional
      trabalhos_atuais: studentData.trabalhos_atuais,
      experiencias_profissionais: studentData.experiencias_profissionais,

      // Saúde
      possui_particularidade_saude: studentData.possui_particularidade_saude,
      detalhes_particularidade: studentData.detalhes_particularidade,
      possui_alergia: studentData.possui_alergia,
      detalhes_alergia: studentData.detalhes_alergia,
      faz_uso_medicamento: studentData.faz_uso_medicamento,
      detalhes_medicamento: studentData.detalhes_medicamento,
      possui_deficiencia: studentData.possui_deficiencia,
      detalhes_deficiencia: studentData.detalhes_deficiencia,
      contatos_saude: studentData.contatos_saude,
      faz_uso_quimicos: studentData.faz_uso_quimicos,
      familiar_usa_quimicos: studentData.familiar_usa_quimicos,
      tipo_sanguineo: studentData.tipo_sanguineo,
      restricao_alimentar: studentData.restricao_alimentar,
      detalhes_restricao_alimentar: studentData.detalhes_restricao_alimentar,
      possui_convenio_medico: studentData.possui_convenio_medico,
      detalhes_convenio_medico: studentData.detalhes_convenio_medico,
      historico_medico: studentData.historico_medico,
      ja_teve_ou_costuma_ter: studentData.ja_teve_ou_costuma_ter,
      detalhes_historico_medico: studentData.detalhes_historico_medico,
      observacoes_saude: studentData.observacoes_saude,
      upload_laudo_medico: studentData.upload_laudo_medico,

      // Informações adicionais
      data_entrada: studentData.data_entrada,
      forma_acesso: studentData.forma_acesso,
      demandas: studentData.demandas,
      observacoes_gerais: studentData.observacoes_gerais,

      // Sistema
      professorId: studentData.professorId
    };

    const [alunoRecord] = await db.insert(aluno).values(alunoData).returning();
    return alunoRecord;
  }

  async getAlunosByProfessor(professorId: number): Promise<Aluno[]> {
    return db.select().from(aluno).where(eq(aluno.professorId, professorId)).orderBy(desc(aluno.createdAt));
  }

  async getAlunosByTurma(turmaId: number): Promise<Aluno[]> {
    return db.select()
      .from(aluno)
      .innerJoin(alunoTurma, eq(aluno.cpf, alunoTurma.alunoCpf))
      .where(and(
        eq(alunoTurma.turmaId, turmaId),
        eq(alunoTurma.status, 'ativo')
      ))
      .then(results => results.map(result => result.aluno));
  }

  async getAluno(cpf: string): Promise<Aluno | undefined> {
    const [alunoRecord] = await db.select().from(aluno).where(eq(aluno.cpf, cpf));
    return alunoRecord || undefined;
  }

  async updateAluno(cpf: string, data: Partial<InsertAluno>): Promise<Aluno> {
    const [alunoRecord] = await db
      .update(aluno)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(aluno.cpf, cpf))
      .returning();
    return alunoRecord;
  }

  async deleteAluno(cpf: string): Promise<void> {
    await db.delete(aluno).where(eq(aluno.cpf, cpf));
  }

  async searchAlunos(query: string): Promise<Aluno[]> {
    try {
      const searchTerm = `%${query}%`;
      return await db
        .select()
        .from(aluno)
        .where(
          or(
            ilike(aluno.nome_completo, searchTerm),
            ilike(aluno.cpf, searchTerm)
          )
        )
        .limit(10);
    } catch (error) {
      console.error('Error in searchAlunos:', error);
      return [];
    }
  }

  // ===== MÓDULO 3: TURMAS =====
  async createTurma(insertTurma: InsertTurma): Promise<Turma> {
    const [turmaRecord] = await db.insert(turma).values(insertTurma).returning();
    return turmaRecord;
  }

  async getTurmasByProfessor(professorId: number): Promise<any[]> {
    const turmas = await db.select().from(turma).where(eq(turma.professorId, professorId)).orderBy(desc(turma.createdAt));

    // Para cada turma, buscar os alunos matriculados
    const turmasWithStudents = await Promise.all(turmas.map(async (t) => {
      try {
        const enrolledStudents = await db
          .select({
            cpf: aluno.cpf,
            fullName: aluno.nome_completo,
            birthDate: aluno.data_nascimento
          })
          .from(alunoTurma)
          .innerJoin(aluno, eq(alunoTurma.alunoCpf, aluno.cpf))
          .where(eq(alunoTurma.turmaId, t.id));

        return {
          ...t,
          students: enrolledStudents
        };
      } catch (error) {
        console.error(`Error fetching students for turma ${t.id}:`, error);
        return {
          ...t,
          students: []
        };
      }
    }));

    return turmasWithStudents;
  }

  async getTurma(id: number): Promise<Turma | undefined> {
    const [turmaRecord] = await db.select().from(turma).where(eq(turma.id, id));
    return turmaRecord || undefined;
  }

  async updateTurma(id: number, data: Partial<InsertTurma>): Promise<Turma> {
    const [turmaRecord] = await db
      .update(turma)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(turma.id, id))
      .returning();
    return turmaRecord;
  }

  async deleteTurma(id: number): Promise<void> {
    await db.delete(turma).where(eq(turma.id, id));
  }

  async getAllTurmas(): Promise<any[]> {
    return db
      .select({
        id: turma.id,
        nome: turma.nome,
        descricao: turma.descricao,
        professorId: turma.professorId,
        maxAlunos: turma.maxAlunos,
        dataInicio: turma.dataInicio,
        dataFim: turma.dataFim,
        horarios: turma.horarios,
        sala: turma.sala,
        status: turma.status,
        createdAt: turma.createdAt,
        updatedAt: turma.updatedAt,
        professorNome: users.nome
      })
      .from(turma)
      .leftJoin(users, eq(turma.professorId, users.id))
      .where(eq(turma.status, 'ativa'))
      .orderBy(desc(turma.createdAt));
  }

  async getUsersByRole(role: string): Promise<User[]> {
    return db
      .select()
      .from(users)
      .where(eq(users.professorTipo, role))
      .orderBy(asc(users.nome));
  }

  // Relacionamento aluno-turma (many-to-many)
  async matricularAlunoTurma(alunoCpf: string, turmaId: number): Promise<AlunoTurma> {
    const [matricula] = await db.insert(alunoTurma).values({
      alunoCpf,
      turmaId,
      status: 'ativo'
    }).returning();
    return matricula;
  }

  // Alias methods for route compatibility
  async createClass(classData: any): Promise<Turma> {
    return this.createTurma(classData);
  }

  async getClassesByProfessor(professorId: number): Promise<any[]> {
    return this.getTurmasByProfessor(professorId);
  }

  async updateClass(id: number, data: any): Promise<Turma> {
    return this.updateTurma(id, data);
  }

  async deleteClass(id: number): Promise<void> {
    return this.deleteTurma(id);
  }

  async enrollStudent(enrollment: { alunoCpf: string; turmaId: number }): Promise<AlunoTurma> {
    return this.matricularAlunoTurma(enrollment.alunoCpf, enrollment.turmaId);
  }

  async unenrollStudent(studentCpf: string, classId: number): Promise<void> {
    return this.desmatricularAlunoTurma(studentCpf, classId);
  }

  async desmatricularAlunoTurma(alunoCpf: string, turmaId: number): Promise<void> {
    await db
      .update(alunoTurma)
      .set({ status: 'inativo' })
      .where(and(
        eq(alunoTurma.alunoCpf, alunoCpf),
        eq(alunoTurma.turmaId, turmaId)
      ));
  }

  async getMatriculasTurma(turmaId: number): Promise<AlunoTurma[]> {
    return db.select().from(alunoTurma).where(and(
      eq(alunoTurma.turmaId, turmaId),
      eq(alunoTurma.status, 'ativo')
    ));
  }

  async getMatriculasAluno(alunoCpf: string): Promise<AlunoTurma[]> {
    return db.select().from(alunoTurma).where(and(
      eq(alunoTurma.alunoCpf, alunoCpf),
      eq(alunoTurma.status, 'ativo')
    ));
  }

  // ===== MÓDULO 4: CHAMADA =====
  async createChamada(insertChamada: InsertChamada): Promise<Chamada> {
    const [chamadaRecord] = await db.insert(chamada).values(insertChamada).returning();
    return chamadaRecord;
  }

  async getChamadasByTurma(turmaId: number): Promise<Chamada[]> {
    return db.select().from(chamada).where(eq(chamada.turmaId, turmaId)).orderBy(desc(chamada.data));
  }

  async getChamadasByProfessor(professorId: number): Promise<Chamada[]> {
    return db.select().from(chamada).where(eq(chamada.professorId, professorId)).orderBy(desc(chamada.data));
  }

  async getChamada(id: number): Promise<Chamada | undefined> {
    const [chamadaRecord] = await db.select().from(chamada).where(eq(chamada.id, id));
    return chamadaRecord || undefined;
  }

  async registrarPresencaAluno(insertChamadaAluno: InsertChamadaAluno): Promise<ChamadaAluno> {
    const [presenca] = await db.insert(chamadaAluno).values(insertChamadaAluno).returning();
    return presenca;
  }

  async getPresencasByChamada(chamadaId: number): Promise<ChamadaAluno[]> {
    return db.select().from(chamadaAluno).where(eq(chamadaAluno.chamadaId, chamadaId));
  }

  async getPresencasByAluno(alunoCpf: string): Promise<ChamadaAluno[]> {
    return db.select().from(chamadaAluno).where(eq(chamadaAluno.alunoCpf, alunoCpf)).orderBy(desc(chamadaAluno.horaRegistro));
  }

  async createChamadaAluno(insertChamadaAluno: InsertChamadaAluno): Promise<ChamadaAluno> {
    const [chamadaAlunoRecord] = await db.insert(chamadaAluno).values(insertChamadaAluno).returning();
    return chamadaAlunoRecord;
  }

  // ===== MÓDULO 5: CALENDÁRIO =====
  async createEvento(insertEvento: InsertCalendarioEvento): Promise<CalendarioEvento> {
    const [evento] = await db.insert(calendarioEvento).values(insertEvento).returning();
    return evento;
  }

  async getEventosByProfessor(professorId: number): Promise<CalendarioEvento[]> {
    return db.select().from(calendarioEvento).where(eq(calendarioEvento.professorId, professorId)).orderBy(desc(calendarioEvento.data));
  }

  async getEventosByTurma(turmaId: number): Promise<CalendarioEvento[]> {
    return db.select().from(calendarioEvento).where(eq(calendarioEvento.turmaId, turmaId)).orderBy(desc(calendarioEvento.data));
  }

  async getEvento(id: number): Promise<CalendarioEvento | undefined> {
    const [evento] = await db.select().from(calendarioEvento).where(eq(calendarioEvento.id, id));
    return evento || undefined;
  }

  async updateEvento(id: number, data: Partial<InsertCalendarioEvento>): Promise<CalendarioEvento> {
    const [evento] = await db
      .update(calendarioEvento)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(calendarioEvento.id, id))
      .returning();
    return evento;
  }

  async deleteEvento(id: number): Promise<void> {
    await db.delete(calendarioEvento).where(eq(calendarioEvento.id, id));
  }

  // ===== MÓDULO 6: PLANO DE AULA =====
  async createPlanoAula(insertPlano: InsertPlanoAula): Promise<PlanoAula> {
    const [plano] = await db.insert(planoAula).values(insertPlano).returning();
    return plano;
  }

  async getPlanosByProfessor(professorId: number): Promise<PlanoAula[]> {
    return db.select().from(planoAula).where(eq(planoAula.professorId, professorId)).orderBy(desc(planoAula.data));
  }

  async getPlanosByTurma(turmaId: number): Promise<PlanoAula[]> {
    return db.select().from(planoAula).where(eq(planoAula.turmaId, turmaId)).orderBy(desc(planoAula.data));
  }

  async getPlanoAula(id: number): Promise<PlanoAula | undefined> {
    const [plano] = await db.select().from(planoAula).where(eq(planoAula.id, id));
    return plano || undefined;
  }

  async updatePlanoAula(id: number, data: Partial<InsertPlanoAula>): Promise<PlanoAula> {
    const [plano] = await db
      .update(planoAula)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(planoAula.id, id))
      .returning();
    return plano;
  }

  async deletePlanoAula(id: number): Promise<void> {
    await db.delete(planoAula).where(eq(planoAula.id, id));
  }

  // ===== MÓDULO 6b: AULAS REGISTRADAS =====
  async createAulaRegistrada(insertAula: InsertAulaRegistrada): Promise<AulaRegistrada> {
    const [aulaCreated] = await db
      .insert(aulaRegistrada)
      .values(insertAula)
      .returning();
    return aulaCreated;
  }

  async getAulasRegistradasByProfessor(professorId: number): Promise<AulaRegistrada[]> {
    return await db
      .select()
      .from(aulaRegistrada)
      .where(eq(aulaRegistrada.professorId, professorId))
      .orderBy(desc(aulaRegistrada.data));
  }

  async getAllAulasRegistradas(): Promise<AulaRegistrada[]> {
    return await db
      .select()
      .from(aulaRegistrada)
      .orderBy(desc(aulaRegistrada.data));
  }

  async getAulasRegistradasByTurma(turmaId: number): Promise<AulaRegistrada[]> {
    return await db
      .select()
      .from(aulaRegistrada)
      .where(eq(aulaRegistrada.turmaId, turmaId))
      .orderBy(desc(aulaRegistrada.data));
  }

  async getAulaRegistrada(id: number): Promise<AulaRegistrada | undefined> {
    const [aula] = await db
      .select()
      .from(aulaRegistrada)
      .where(eq(aulaRegistrada.id, id));
    return aula || undefined;
  }

  async updateAulaRegistrada(id: number, data: Partial<InsertAulaRegistrada>): Promise<AulaRegistrada> {
    const [aulaUpdated] = await db
      .update(aulaRegistrada)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(aulaRegistrada.id, id))
      .returning();
    return aulaUpdated;
  }

  async deleteAulaRegistrada(id: number): Promise<void> {
    await db.delete(aulaRegistrada).where(eq(aulaRegistrada.id, id));
  }

  // ===== MÓDULO 7: ACOMPANHAMENTO =====
  async createAcompanhamento(insertAcompanhamento: InsertAcompanhamento): Promise<Acompanhamento> {
    const [acompanhamentoRecord] = await db.insert(acompanhamento).values(insertAcompanhamento).returning();
    return acompanhamentoRecord;
  }

  async getAcompanhamentosByProfessor(professorId: number): Promise<Acompanhamento[]> {
    return db.select().from(acompanhamento).where(eq(acompanhamento.professorId, professorId)).orderBy(desc(acompanhamento.data));
  }

  async getAcompanhamentosByAluno(alunoCpf: string): Promise<Acompanhamento[]> {
    return db.select().from(acompanhamento).where(eq(acompanhamento.alunoCpf, alunoCpf)).orderBy(desc(acompanhamento.data));
  }

  async getAcompanhamento(id: number): Promise<Acompanhamento | undefined> {
    const [acompanhamentoRecord] = await db.select().from(acompanhamento).where(eq(acompanhamento.id, id));
    return acompanhamentoRecord || undefined;
  }

  async updateAcompanhamento(id: number, data: Partial<InsertAcompanhamento>): Promise<Acompanhamento> {
    const [acompanhamentoRecord] = await db
      .update(acompanhamento)
      .set(data)
      .where(eq(acompanhamento.id, id))
      .returning();
    return acompanhamentoRecord;
  }

  async deleteAcompanhamento(id: number): Promise<void> {
    await db.delete(acompanhamento).where(eq(acompanhamento.id, id));
  }

  // ===== MÓDULO 8: RELATÓRIOS GERENCIAIS =====
  async createRelatorio(insertRelatorio: InsertRelatorioGerado): Promise<RelatorioGerado> {
    const [relatorio] = await db.insert(relatorioGerado).values(insertRelatorio).returning();
    return relatorio;
  }

  async getRelatoriosByProfessor(professorId: number): Promise<RelatorioGerado[]> {
    return db.select().from(relatorioGerado).where(eq(relatorioGerado.professorId, professorId)).orderBy(desc(relatorioGerado.dataGeracao));
  }

  async getRelatorio(id: number): Promise<RelatorioGerado | undefined> {
    const [relatorio] = await db.select().from(relatorioGerado).where(eq(relatorioGerado.id, id));
    return relatorio || undefined;
  }

  // ===== MÉTODOS DE CHAMADA EXTRAS =====

  async getChamadaByTurma(turmaId: number, date?: string): Promise<any[]> {
    try {
      const query = db
        .select({
          id: chamadaAluno.id,
          data: chamada.data,
          status: chamadaAluno.status,
          alunoCpf: chamadaAluno.alunoCpf,
          turmaId: chamada.turmaId,
          professorId: chamada.professorId,
          studentName: aluno.nome_completo
        })
        .from(chamadaAluno)
        .innerJoin(chamada, eq(chamadaAluno.chamadaId, chamada.id))
        .leftJoin(aluno, eq(chamadaAluno.alunoCpf, aluno.cpf))
        .where(eq(chamada.turmaId, turmaId))
        .orderBy(desc(chamada.data));

      return await query;
    } catch (error) {
      console.error('Error in getChamadaByTurma:', error);
      return [];
    }
  }

  // Dashboard sumário para professor (retorna zeros para data limpa)
  async getProfessorDashboardSummary(professorId: number): Promise<any> {
    // Contar alunos cadastrados pelo professor
    const [alunosCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(aluno)
      .where(eq(aluno.professorId, professorId));

    // Contar turmas do professor
    const [turmasCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(turma)
      .where(eq(turma.professorId, professorId));

    // Contar eventos do professor
    const [eventosCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(calendarioEvento)
      .where(eq(calendarioEvento.professorId, professorId));

    // Contar planos de aula
    const [planosCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(planoAula)
      .where(eq(planoAula.professorId, professorId));

    return {
      totalAlunos: alunosCount?.count || 0,
      totalTurmas: turmasCount?.count || 0,
      eventosPendentes: eventosCount?.count || 0,
      planosAula: planosCount?.count || 0,
      percentualPresenca: 0, // Será calculado conforme chamadas forem registradas
      alunosEmAlerta: 0, // Baseado em frequência baixa
    };
  }

  // ===== MÉTODOS DO COORDENADOR PEC =====

  // Dashboard sumário para coordenador PEC
  async getPecCoordenadorDashboardSummary(coordenadorId: number): Promise<any> {
    // FIXME: Campos 'programa' e 'modalidade' não existem - usar tabelas corretas (projects, pecActivities)
    return {
      totalAlunos: 0,
      totalTurmas: 0,
      eventosPendentes: 0,
      atividadesAtivas: 0,
    };
  }

  // Buscar alunos do programa PEC
  async getAlunosByPEC(coordenadorId: number): Promise<Aluno[]> {
    // FIXME: Campo 'programa' não existe - usar tabela alunoPrograma
    return [];
  }

  // Buscar turmas do programa PEC
  async getTurmasByPEC(coordenadorId: number): Promise<any[]> {
    // FIXME: Campo 'modalidade' não existe - usar tabelas corretas (projects, pecActivities)
    return [];
  }

  async updateProfessorProfile(id: number, data: { name?: string; email?: string }): Promise<User> {
    try {
      const updateData: any = {};
      if (data.name) updateData.nome = data.name;
      if (data.email) updateData.email = data.email;

      const [updatedUser] = await db
        .update(users)
        .set(updateData)
        .where(eq(users.id, id))
        .returning();

      if (!updatedUser) {
        throw new Error('User not found');
      }

      return updatedUser;
    } catch (error) {
      console.error('Error updating professor profile:', error);
      throw error;
    }
  }

  // ==== PROFESSOR REPORTS METHODS ====
  async getAttendanceReportByProfessor(professorId: number, classId?: number, date?: string): Promise<any[]> {
    try {
      const conditions = [eq(chamada.professorId, professorId)];

      if (classId) {
        conditions.push(eq(chamada.turmaId, classId));
      }

      if (date) {
        conditions.push(eq(chamada.data, date));
      }

      const result = await db
        .select()
        .from(chamadaAluno)
        .innerJoin(chamada, eq(chamadaAluno.chamadaId, chamada.id))
        .innerJoin(aluno, eq(chamadaAluno.alunoCpf, aluno.cpf))
        .where(and(...conditions));
      return result.map(item => ({
        student_name: item.aluno.nome_completo,
        status: item.chamada_aluno.status,
        observacoes: item.chamada_aluno.observacoes,
        date: item.chamada.data
      }));
    } catch (error) {
      console.error('Error fetching attendance report:', error);
      return [];
    }
  }

  async getLessonPlansReportByProfessor(professorId: number, classId?: number, date?: string): Promise<any[]> {
    try {
      const conditions = [eq(planoAula.professorId, professorId)];

      if (classId) {
        conditions.push(eq(planoAula.turmaId, classId));
      }

      if (date) {
        conditions.push(eq(planoAula.data, date));
      }

      const result = await db
        .select()
        .from(planoAula)
        .where(and(...conditions));
      return result.map(item => ({
        title: item.titulo,
        description: item.conteudo, // Using conteudo as description since descricao doesn't exist
        date: item.data,
        competencies: item.competencias,
        materials: item.recursos, // Using recursos as materials since materiais doesn't exist
        status: item.status
      }));
    } catch (error) {
      console.error('Error fetching lesson plans report:', error);
      return [];
    }
  }

  async getObservationsReportByProfessor(professorId: number, classId?: number, date?: string): Promise<any[]> {
    try {
      const conditions = [eq(acompanhamento.professorId, professorId)];

      if (date) {
        conditions.push(eq(acompanhamento.data, date));
      }

      const result = await db
        .select()
        .from(acompanhamento)
        .innerJoin(aluno, eq(acompanhamento.alunoCpf, aluno.cpf))
        .where(and(...conditions));
      return result.map(item => ({
        titulo: item.acompanhamento.titulo,
        observacao: item.acompanhamento.observacao,
        data: item.acompanhamento.data,
        tipoObservacao: item.acompanhamento.tipoObservacao,
        student_name: item.aluno.nome_completo,
        student_cpf: item.aluno.cpf
      }));
    } catch (error) {
      console.error('Error fetching observations report:', error);
      return [];
    }
  }

  async getStudentReportData(studentCpf: string): Promise<any> {
    try {
      // Get student data
      const [student] = await db
        .select()
        .from(aluno)
        .where(eq(aluno.cpf, studentCpf));

      if (!student) {
        throw new Error('Aluno não encontrado');
      }

      // Get student observations
      const observations = await db
        .select()
        .from(acompanhamento)
        .where(eq(acompanhamento.alunoCpf, studentCpf))
        .orderBy(acompanhamento.data);

      return {
        student,
        observations: observations.map(obs => ({
          data: obs.data,
          observacao: obs.observacao,
          titulo: obs.titulo,
          tipoObservacao: obs.tipoObservacao
        }))
      };
    } catch (error) {
      console.error('Error fetching student report data:', error);
      throw error;
    }
  }

  async getGeneralReportByProfessor(professorId: number, classId?: number, date?: string): Promise<any> {
    try {
      // Get summary data for general report
      const summary = {
        totalStudents: 0,
        totalClasses: 0,
        totalObservations: 0,
        attendanceRate: 0
      };

      // Count students by professor
      const [studentsCount] = await db
        .select({ count: sql<number>`count(*)` })
        .from(aluno)
        .where(eq(aluno.professorId, professorId));

      summary.totalStudents = studentsCount.count;

      // Count classes
      const [classesCount] = await db
        .select({ count: sql<number>`count(*)` })
        .from(turma)
        .where(eq(turma.professorId, professorId));

      summary.totalClasses = classesCount.count;

      // Count observations
      const observationConditions = [eq(acompanhamento.professorId, professorId)];

      if (date) {
        observationConditions.push(eq(acompanhamento.data, date));
      }

      const [observationsCount] = await db
        .select({ count: sql<number>`count(*)` })
        .from(acompanhamento)
        .where(and(...observationConditions));
      summary.totalObservations = observationsCount.count;

      // Calculate attendance rate
      const attendanceConditions = [eq(chamada.professorId, professorId)];

      if (date) {
        attendanceConditions.push(eq(chamada.data, date));
      }

      const [attendanceData] = await db
        .select({
          total: sql<number>`count(*)`,
          present: sql<number>`count(case when ${chamadaAluno.status} = 'presente' then 1 end)`
        })
        .from(chamadaAluno)
        .innerJoin(chamada, eq(chamadaAluno.chamadaId, chamada.id))
        .where(and(...attendanceConditions));
      summary.attendanceRate = attendanceData.total > 0 ?
        Math.round((attendanceData.present / attendanceData.total) * 100) : 0;

      return {
        summary,
        professor: { name: 'Professor' } // Could be enhanced to get actual professor name
      };
    } catch (error) {
      console.error('Error fetching general report:', error);
      return {
        summary: {
          totalStudents: 0,
          totalClasses: 0,
          totalObservations: 0,
          attendanceRate: 0
        },
        professor: { name: 'Professor' }
      };
    }
  }

  // Missing methods implementation - stub implementations for now
  async updateCouncilRequestStatus(requestId: number, status: string, processedBy?: string): Promise<any> {
    // Implementation would update council request table
    return { id: requestId, status, processedBy };
  }

  async updateCouncilAccessStatus(telefone: string, status: string): Promise<User> {
    return this.updateConselhoStatus(telefone, status);
  }

  async getCouncilMembers(): Promise<User[]> {
    return db.select({
      id: users.id,
      cpf: users.cpf,
      nome: users.nome,
      sobrenome: users.sobrenome,
      telefone: users.telefone,
      email: users.email,
      fotoPerfil: users.fotoPerfil,
      verificado: users.verificado,
      ativo: users.ativo,
      plano: users.plano,
      stripeCustomerId: users.stripeCustomerId,
      stripeSubscriptionId: users.stripeSubscriptionId,
      subscriptionStatus: users.subscriptionStatus,
      role: users.role,
      tipo: users.tipo,
      fonte: users.fonte,
      professorTipo: users.professorTipo,
      formacao: users.formacao,
      especializacao: users.especializacao,
      experiencia: users.experiencia,
      disciplinas: users.disciplinas,
      conselhoStatus: users.conselhoStatus,
      conselhoApprovedBy: users.conselhoApprovedBy,
      conselhoApprovedAt: users.conselhoApprovedAt,
      gritosTotal: users.gritosTotal,
      nivelAtual: users.nivelAtual,
      proximoNivel: users.proximoNivel,
      gritosParaProximoNivel: users.gritosParaProximoNivel,
      diasConsecutivos: users.diasConsecutivos,
      ultimoCheckin: users.ultimoCheckin,
      semanaAtual: users.semanaAtual,
      projetosApoiados: users.projetosApoiados,
      dataCadastro: users.dataCadastro,
      createdAt: users.createdAt
    }).from(users).where(eq(users.conselhoStatus, 'aprovado'));
  }

  async createCouncilRequest(data: any): Promise<any> {
    // Implementation would create council request
    return data;
  }

  async getAttendanceByLesson(professorId: number): Promise<any[]> {
    return [];
  }

  async getStudentAttendance(studentId: string): Promise<any[]> {
    return [];
  }

  async getEventsByProfessor(professorId: number): Promise<any[]> {
    return this.getEventosByProfessor(professorId);
  }

  async createEvent(data: any): Promise<any> {
    return this.createEvento(data);
  }

  async updateEvent(id: number, data: any): Promise<any> {
    return this.updateEvento(id, data);
  }

  async deleteEvent(id: number): Promise<void> {
    return this.deleteEvento(id);
  }

  async createObservation(data: any): Promise<any> {
    return this.createAcompanhamento(data);
  }

  async getObservationsByProfessor(professorId: number): Promise<any[]> {
    return this.getAcompanhamentosByProfessor(professorId);
  }

  async getObservationsByStudent(studentId: string): Promise<any[]> {
    return this.getAcompanhamentosByAluno(studentId);
  }

  async updateObservation(id: number, data: any): Promise<any> {
    return this.updateAcompanhamento(id, data);
  }

  async deleteObservation(id: number): Promise<void> {
    return this.deleteAcompanhamento(id);
  }

  async generateClassReport(data: any): Promise<any> {
    return { report: "Generated class report" };
  }

  async generateStudentReport(data: any): Promise<any> {
    return { report: "Generated student report" };
  }

  async createGuardian(data: any): Promise<any> {
    return this.createResponsavel(data);
  }

  async getGuardiansByStudent(studentId: string): Promise<any[]> {
    return [];
  }

  async getGuardian(id: number): Promise<any> {
    return undefined;
  }

  async updateGuardian(id: number, data: any): Promise<any> {
    return data;
  }

  async deleteGuardian(id: number): Promise<void> {
    // Implementation would delete guardian
  }

  async getStudentsByClass(classId: number): Promise<any[]> {
    return this.getAlunosByTurma(classId);
  }

  async getStudentsByProfessor(professorId: number): Promise<any[]> {
    return this.getAlunosByProfessor(professorId);
  }

  async getLessonsByProfessor(professorId: number): Promise<any[]> {
    return this.getTurmasByProfessor(professorId);
  }

  // ===== MÓDULO DESENVOLVEDOR =====
  async getDeveloperByUsuario(usuario: string): Promise<any> {
    try {
      const result = await db.execute(sql`SELECT * FROM developers WHERE usuario = ${usuario}`);
      return result.rows[0] || undefined;
    } catch (error) {
      console.error('Error getting developer by usuario:', error);
      return undefined;
    }
  }

  async updateDeveloperLastAccess(id: number): Promise<void> {
    await db
      .update(developers)
      .set({ ultimoAcesso: new Date() })
      .where(eq(developers.id, id));
  }

  // ===== MÓDULO 9: SISTEMA DE DESENVOLVIMENTO =====
  async getSistemaTelasList(): Promise<SistemaTela[]> {
    return db.select().from(sistemaTelas).orderBy(asc(sistemaTelas.modulo), asc(sistemaTelas.nome));
  }

  async getSistemaAlteracoesByTela(telaId: number): Promise<SistemaAlteracao[]> {
    return db.select().from(sistemaAlteracoes)
      .where(eq(sistemaAlteracoes.telaId, telaId))
      .orderBy(desc(sistemaAlteracoes.dataAlteracao));
  }

  async getSistemaErrosByTela(telaId: number): Promise<SistemaErro[]> {
    return db.select().from(sistemaErros)
      .where(eq(sistemaErros.telaId, telaId))
      .orderBy(desc(sistemaErros.dataErro));
  }

  async getSistemaComentariosByTela(telaId: number): Promise<SistemaComentario[]> {
    return db.select().from(sistemaComentarios)
      .where(eq(sistemaComentarios.telaId, telaId))
      .orderBy(desc(sistemaComentarios.dataComentario));
  }

  async updateSistemaTelaStatus(telaId: number, status: string, autor: string): Promise<SistemaTela> {
    const [tela] = await db
      .update(sistemaTelas)
      .set({
        status,
        atualizadoPor: autor,
        ultimaAtualizacao: new Date()
      })
      .where(eq(sistemaTelas.id, telaId))
      .returning();
    return tela;
  }

  async createSistemaComentario(insertComentario: InsertSistemaComentario): Promise<SistemaComentario> {
    const [comentario] = await db.insert(sistemaComentarios).values(insertComentario).returning();
    return comentario;
  }

  async createSistemaErro(insertErro: InsertSistemaErro): Promise<SistemaErro> {
    const [erro] = await db.insert(sistemaErros).values(insertErro).returning();
    return erro;
  }

  async createSistemaAtividade(insertAtividade: InsertSistemaAtividade): Promise<SistemaAtividade> {
    const [atividade] = await db.insert(sistemaAtividade).values(insertAtividade).returning();
    return atividade;
  }

  async getSistemaDeployLogs(): Promise<SistemaDeployLog[]> {
    return db.select().from(sistemaDeployLog).orderBy(desc(sistemaDeployLog.dataDeploy)).limit(50);
  }

  async createSistemaDeployLog(insertDeploy: InsertSistemaDeployLog): Promise<SistemaDeployLog> {
    const [deploy] = await db.insert(sistemaDeployLog).values(insertDeploy).returning();
    return deploy;
  }

  async getSistemaAtividades(desenvolvedor?: string): Promise<SistemaAtividade[]> {
    if (desenvolvedor) {
      return db.select().from(sistemaAtividade)
        .where(eq(sistemaAtividade.desenvolvedor, desenvolvedor))
        .orderBy(desc(sistemaAtividade.dataAtividade))
        .limit(100);
    }

    return db.select().from(sistemaAtividade)
      .orderBy(desc(sistemaAtividade.dataAtividade))
      .limit(100);
  }

  // ===== MÓDULO 9: DESENVOLVEDORES E CONSOLIDAÇÃO =====
  async getDevelopers(): Promise<Developer[]> {
    return db.select().from(developers).orderBy(asc(developers.nome));
  }

  async getAllAlunos(): Promise<Aluno[]> {
    return db.select().from(aluno).orderBy(asc(aluno.nome_completo));
  }

  // ===== MÉTODOS DE SORTEIO =====

  // Sorteios
  async getSorteioAtivo(): Promise<any> {
    try {
      const result = await db.execute(sql`
        SELECT id, nome, descricao, premio, valor_premio, data_inicio, data_fim, data_sorteio, regras, status, tipo_sorteio, ativo, created_at
        FROM sorteios 
        WHERE ativo = true AND status = 'ativo' 
        ORDER BY created_at DESC 
        LIMIT 1
      `);
      return result.rows[0] || undefined;
    } catch (error) {
      console.error('Error in getSorteioAtivo:', error);
      return undefined;
    }
  }

  async getSorteioById(id: number): Promise<Sorteio | undefined> {
    const [sorteio] = await db
      .select()
      .from(sorteios)
      .where(eq(sorteios.id, id));
    return sorteio || undefined;
  }

  async createSorteio(sorteioData: SorteioInsert): Promise<Sorteio> {
    const [sorteio] = await db
      .insert(sorteios)
      .values(sorteioData)
      .returning();
    return sorteio;
  }

  async updateSorteio(id: number, sorteioData: Partial<SorteioInsert>): Promise<Sorteio> {
    const [sorteio] = await db
      .update(sorteios)
      .set(sorteioData)
      .where(eq(sorteios.id, id))
      .returning();
    return sorteio;
  }

  async getSorteiosHistorico(): Promise<Sorteio[]> {
    return await db
      .select()
      .from(sorteios)
      .orderBy(desc(sorteios.createdAt));
  }

  // Participações
  async getParticipacaoUsuario(sorteioId: number, userId: number): Promise<any> {
    try {
      const result = await db.execute(sql`
        SELECT * FROM sorteio_participacoes 
        WHERE sorteio_id = ${sorteioId} AND user_id = ${userId} 
        LIMIT 1
      `);
      return result.rows[0] || undefined;
    } catch (error) {
      console.error('Error in getParticipacaoUsuario:', error);
      return undefined;
    }
  }

  async createParticipacao(participacaoData: SorteioParticipacaoInsert): Promise<SorteioParticipacao> {
    const [participacao] = await db
      .insert(sorteioParticipacoes)
      .values(participacaoData as any)
      .returning();
    return participacao;
  }

  async updateParticipacao(id: number, participacaoData: Partial<SorteioParticipacaoInsert>): Promise<SorteioParticipacao> {
    const [participacao] = await db
      .update(sorteioParticipacoes)
      .set(participacaoData as any)
      .where(eq(sorteioParticipacoes.id, id))
      .returning();
    return participacao;
  }

  async getParticipacoesDoSorteio(sorteioId: number): Promise<SorteioParticipacao[]> {
    return await db
      .select()
      .from(sorteioParticipacoes)
      .where(eq(sorteioParticipacoes.sorteioId, sorteioId));
  }

  // Resultados
  async createResultado(resultadoData: SorteioResultadoInsert): Promise<SorteioResultado> {
    const [resultado] = await db
      .insert(sorteioResultados)
      .values(resultadoData)
      .returning();
    return resultado;
  }

  async getResultadosHistorico(): Promise<SorteioResultado[]> {
    return await db
      .select()
      .from(sorteioResultados)
      .orderBy(desc(sorteioResultados.dataSorteio));
  }

  // Configurações
  async getSorteioConfiguracao(chave: string): Promise<SorteioConfiguracao | undefined> {
    const [config] = await db
      .select()
      .from(sorteioConfiguracoes)
      .where(and(eq(sorteioConfiguracoes.chave, chave), eq(sorteioConfiguracoes.ativo, true)));
    return config || undefined;
  }

  async setSorteioConfiguracao(configData: SorteioConfiguracaoInsert): Promise<SorteioConfiguracao> {
    // Verificar se já existe uma configuração com essa chave
    const existingConfig = await this.getSorteioConfiguracao(configData.chave);

    if (existingConfig) {
      const [config] = await db
        .update(sorteioConfiguracoes)
        .set({ ...configData, updatedAt: new Date() })
        .where(eq(sorteioConfiguracoes.chave, configData.chave))
        .returning();
      return config;
    } else {
      const [config] = await db
        .insert(sorteioConfiguracoes)
        .values(configData)
        .returning();
      return config;
    }
  }

  async getSorteioConfiguracoes(): Promise<SorteioConfiguracao[]> {
    return await db
      .select()
      .from(sorteioConfiguracoes)
      .where(eq(sorteioConfiguracoes.ativo, true));
  }

  // Métodos adicionais para sorteio transparente

  async getParticipacoesPorSorteio(sorteioId: number): Promise<any[]> {
    return await db
      .select({
        id: sorteioParticipacoes.id,
        userId: sorteioParticipacoes.userId,
        numeroChances: sorteioParticipacoes.numeroChances,
        planoAtual: sorteioParticipacoes.planoAtual,
        nome: users.nome
      })
      .from(sorteioParticipacoes)
      .leftJoin(users, eq(sorteioParticipacoes.userId, users.id))
      .where(and(
        eq(sorteioParticipacoes.sorteioId, sorteioId),
        eq(sorteioParticipacoes.participacaoConfirmada, true)
      ));
  }

  // ===== MÓDULO DOAÇÃO =====
  async getUserActiveDonationPlan(userId: number): Promise<string> {
    try {
      // PRIORIDADE 1: Buscar o plano atual na tabela users (sempre tem prioridade)
      const [user] = await db
        .select({ plano: users.plano })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      // Se o usuário tem um plano definido, usar sempre esse plano
      if (user?.plano) {
        console.log(`✅ [PLAN] Usuário ${userId}: Retornando plano atual "${user.plano}" da tabela users`);
        return user.plano;
      }

      // FALLBACK: Apenas se o usuário não tiver plano na tabela users, buscar na tabela doadores
      const [latestDonation] = await db
        .select({
          plano: doadores.plano
        })
        .from(doadores)
        .where(and(
          eq(doadores.userId, userId),
          eq(doadores.ativo, true)
        ))
        .orderBy(desc(doadores.createdAt))
        .limit(1);

      if (latestDonation) {
        console.log(`⚠️  [PLAN] Usuário ${userId}: Usando fallback da tabela doadores - plano "${latestDonation.plano}"`);
        return latestDonation.plano;
      }

      console.log(`🔴 [PLAN] Usuário ${userId}: Nenhum plano encontrado, usando default 'eco'`);
      return 'eco';
    } catch (error) {
      console.error('Error getting user active donation plan:', error);
      return 'eco'; // Default para eco
    }
  }

  // ===== MÓDULO GAMIFICAÇÃO - GRITOS =====

  // Função para calcular gritos iniciais baseado no plano e valor (para Platinum)
  async getGritosIniciaisPorPlano(plano: string, userId?: number): Promise<number> {
    // Para Platinum, calcular proporcionalmente (valor x 3)
    if (plano.toLowerCase() === 'platinum' && userId) {
      try {
        const platinumDonation = await db.select({
          valor: doadores.valor
        })
          .from(doadores)
          .where(and(
            eq(doadores.userId, userId),
            eq(doadores.plano, 'platinum'),
            eq(doadores.status, 'paid')
          ))
          .orderBy(desc(doadores.createdAt))
          .limit(1);
        
        if (platinumDonation.length > 0) {
          const valorDoacao = parseFloat(platinumDonation[0].valor);
          return Math.round(valorDoacao * 3); // Valor x 3
        }
      } catch (error) {
        console.error('Erro ao buscar valor Platinum:', error);
      }
    }
    
    // Planos fixos
    const gritosPlanos: Record<string, number> = {
      'eco': 30,    // R$ 10 x 3
      'voz': 60,    // R$ 20 x 3
      'grito': 90,  // R$ 30 x 3
      'platinum': 93,  // Mínimo R$ 31 x 3 (fallback se não encontrar doação)
      'platina': 93,
      'diamante': 300  // R$ 100 x 3
    };
    
    return gritosPlanos[plano.toLowerCase()] || 30; // Default para eco
  }

  // Check-ins
  async createCheckin(checkin: InsertCheckin): Promise<Checkin> {
    const [newCheckin] = await db.insert(checkins).values(checkin).returning();
    return newCheckin;
  }

  async getCheckinToday(userId: number, data: string): Promise<Checkin | undefined> {
    const [checkin] = await db
      .select()
      .from(checkins)
      .where(and(
        eq(checkins.userId, userId),
        eq(checkins.dataCheckin, data)
      ))
      .limit(1);
    return checkin || undefined;
  }

  // Sistema de Streak Semanal
  async getUserStreak(userId: number): Promise<{ diasConsecutivos: number; ultimoCheckin: string | null }> {
    const [user] = await db
      .select({
        diasConsecutivos: users.diasConsecutivos,
        ultimoCheckin: users.ultimoCheckin
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    // Converter timestamp para string ISO se necessário
    let ultimoCheckinFormatado: string | null = null;
    if (user?.ultimoCheckin) {
      try {
        const date = new Date(user.ultimoCheckin);
        ultimoCheckinFormatado = date.toISOString();
      } catch (error) {
        console.warn('Erro ao converter ultimoCheckin para ISO:', error);
        ultimoCheckinFormatado = null;
      }
    }

    return {
      diasConsecutivos: user?.diasConsecutivos || 0,
      ultimoCheckin: ultimoCheckinFormatado
    };
  }

  // Função para verificar e zerar streak se necessário
  async checkAndResetStreakIfBroken(userId: number): Promise<{ streakResetada: boolean; diasConsecutivos: number }> {
    const hoje = new Date().toISOString().split('T')[0];
    const ontem = new Date();
    ontem.setDate(ontem.getDate() - 1);
    const ontemStr = ontem.toISOString().split('T')[0];

    const streak = await this.getUserStreak(userId);

    // Se não tem último check-in ou se o último check-in foi antes de ontem
    if (!streak.ultimoCheckin || (streak.ultimoCheckin !== hoje && streak.ultimoCheckin !== ontemStr)) {
      // Zerar a streak se ela estava > 0
      if (streak.diasConsecutivos > 0) {
        await this.updateUserStreak(userId, 0, null);
        return { streakResetada: true, diasConsecutivos: 0 };
      }
    }

    return { streakResetada: false, diasConsecutivos: streak.diasConsecutivos };
  }

  async updateUserStreak(userId: number, diasConsecutivos: number, ultimoCheckin: string | null): Promise<void> {
    // Converter string para Date se necessário
    const ultimoCheckinDate = ultimoCheckin ? new Date(ultimoCheckin) : null;

    await db
      .update(users)
      .set({
        diasConsecutivos,
        ultimoCheckin: ultimoCheckinDate
      })
      .where(eq(users.id, userId));
  }

  async doCheckinWithStreak(userId: number): Promise<{ success: boolean; gritosGanhos: number; diaAtual: number }> {
    const agora = new Date();
    const hoje = agora.toISOString().split('T')[0];

    // ✨ VERIFICAÇÃO DUPLA: 24H + Já fez check-in hoje
    const status = await this.getPersonalizedCheckinStatus(userId);
    if (!status.canCheckin) {
      console.log(`⏰ [CHECK-IN REJEITADO] Usuário ${userId}: Ainda não passaram 24h desde o último check-in`);
      return { success: false, gritosGanhos: 0, diaAtual: status.diaAtual };
    }

    // ✨ VERIFICAR SE JÁ FEZ CHECK-IN HOJE (proteção extra)
    const [checkinHoje] = await db
      .select()
      .from(checkins)
      .where(and(
        eq(checkins.userId, userId),
        eq(checkins.dataCheckin, hoje)
      ))
      .limit(1);

    if (checkinHoje) {
      console.log(`🚫 [CHECK-IN DUPLICADO] Usuário ${userId}: Já fez check-in hoje (${hoje})`);
      return { success: false, gritosGanhos: 0, diaAtual: status.diaAtual };
    }

    // Obter streak atual
    const streak = await this.getUserStreak(userId);

    // ✨ LÓGICA DE STREAK COM RESET POR 24H
    let novoDiaConsecutivo: number;

    if (streak.ultimoCheckin) {
      const ultimoCheckinDate = new Date(streak.ultimoCheckin);

      // Calcular diferença em horas desde o último check-in
      const diferencaHoras = (agora.getTime() - ultimoCheckinDate.getTime()) / (1000 * 60 * 60);

      // Se passou mais de 24h, RESET da streak (volta para dia 1)
      if (diferencaHoras > 24) {
        novoDiaConsecutivo = 1;
        console.log(`🔄 [STREAK RESET] Usuário ${userId} passou ${diferencaHoras.toFixed(1)}h sem check-in. Streak resetada para dia 1`);
      } else {
        // Dentro de 24h - verifica se foi ontem para continuar sequência
        const ultimoCheckinStr = ultimoCheckinDate.toISOString().split('T')[0];
        const ontem = new Date(agora);
        ontem.setDate(ontem.getDate() - 1);
        const ontemStr = ontem.toISOString().split('T')[0];

        if (ultimoCheckinStr === ontemStr) {
          // Continuou a sequência
          novoDiaConsecutivo = (streak.diasConsecutivos || 0) + 1;
        } else {
          // Não foi ontem, mas ainda dentro de 24h - mantém dia atual
          novoDiaConsecutivo = streak.diasConsecutivos || 1;
        }
      }
    } else {
      // Primeiro check-in
      novoDiaConsecutivo = 1;
    }

    // Se chegou ao dia 8, reseta para 1 (começa nova semana)
    if (novoDiaConsecutivo > 7) {
      novoDiaConsecutivo = 1;
    }

    // Calcular gritos ganhos
    const gritosGanhos = novoDiaConsecutivo === 7 ? 20 : 10;

    // ✨ ATUALIZAR COM TIMESTAMP REAL (não apenas data)
    await this.updateUserStreak(userId, novoDiaConsecutivo, agora.toISOString());

    // Criar checkin com data atual
    await this.createCheckin({
      userId,
      dataCheckin: hoje,
      gritosGanhos
    });

    // Adicionar gritos ao total
    await this.addGritosToUser(userId, gritosGanhos);

    // Criar histórico
    await this.createGritosHistorico({
      userId,
      tipo: 'checkin',
      gritosGanhos,
      descricao: `Check-in diário - Dia ${novoDiaConsecutivo}/7${novoDiaConsecutivo === 7 ? ' (Bônus!)' : ''}`
    });

    // 🎯 VERIFICAR E COMPLETAR MISSÃO DE CHECK-IN CONSECUTIVO AUTOMATICAMENTE
    await this.checkAndCompleteConsecutiveCheckinMission(userId, novoDiaConsecutivo);

    return {
      success: true,
      gritosGanhos,
      diaAtual: novoDiaConsecutivo
    };
  }

  // 🎯 FUNÇÃO PARA COMPLETAR AUTOMATICAMENTE MISSÃO DE CHECK-IN CONSECUTIVO
  async checkAndCompleteConsecutiveCheckinMission(userId: number, diasConsecutivos: number): Promise<void> {
    try {
      // Buscar missões ativas de check-in consecutivo que o usuário ainda não completou
      const missoesConsecutivas = await db
        .select({
          id: missoesSemanais.id,
          titulo: missoesSemanais.titulo,
          recompensaGritos: missoesSemanais.recompensaGritos,
          descricao: missoesSemanais.descricao,
          diasNecessarios: missoesSemanais.diasNecessarios
        })
        .from(missoesSemanais)
        .where(and(
          eq(missoesSemanais.tipoMissao, 'check_in_consecutivo'),
          eq(missoesSemanais.ativo, true)
        ));

      if (missoesConsecutivas.length === 0) {
        console.log(`📋 [AUTO-MISSÃO] Nenhuma missão de check-in consecutivo ativa encontrada`);
        return;
      }

      for (const missao of missoesConsecutivas) {
        // Verificar se usuário já completou esta missão
        const [jaCompleta] = await db
          .select()
          .from(missoesConcluidas)
          .where(and(
            eq(missoesConcluidas.userId, userId),
            eq(missoesConcluidas.missaoId, missao.id)
          ))
          .limit(1);

        if (jaCompleta) {
          console.log(`✅ [AUTO-MISSÃO] Usuário ${userId} já completou missão ${missao.id}: ${missao.titulo}`);
          continue;
        }

        // 🎯 USAR CAMPO DEDICADO diasNecessarios (padrão 3 se não especificado)
        const diasNecessarios = missao.diasNecessarios || 3;
        
        console.log(`🔍 [AUTO-MISSÃO] Verificando "${missao.titulo}" - Necessita: ${diasNecessarios} dias | Usuário tem: ${diasConsecutivos} dias`);

        if (diasConsecutivos >= diasNecessarios) {
          // Completar automaticamente a missão
          await db.insert(missoesConcluidas).values({
            userId,
            missaoId: missao.id,
            gritosRecebidos: missao.recompensaGritos || 150
          }).onConflictDoNothing();

          // Adicionar gritos ao usuário
          await this.addGritosToUser(userId, missao.recompensaGritos || 150);

          // Criar histórico
          await this.createGritosHistorico({
            userId,
            tipo: 'missao_automatica',
            gritosGanhos: missao.recompensaGritos || 150,
            descricao: `Missão completada automaticamente: ${missao.titulo} (${diasConsecutivos} dias consecutivos)`
          });

          console.log(`🎯 [AUTO-MISSÃO COMPLETA] Usuário ${userId} completou automaticamente: "${missao.titulo}" - +${missao.recompensaGritos || 150} gritos`);
        } else {
          console.log(`⏳ [AUTO-MISSÃO PENDENTE] Usuário ${userId} precisa de ${diasNecessarios} dias para "${missao.titulo}" (atual: ${diasConsecutivos})`);
        }
      }
    } catch (error) {
      console.error('❌ [AUTO-MISSÃO ERRO]', error);
    }
  }

  // 🎯 FUNÇÃO PARA COMPLETAR AUTOMATICAMENTE MISSÃO DE PERFIL COMPLETO
  async checkAndCompleteProfileMission(userId: number): Promise<void> {
    console.log(`🔍 [AUTO-PERFIL] Iniciando verificação para usuário ${userId}`);
    try {
      // Obter dados completos do usuário
      const [userData] = await db
        .select({
          nome: users.nome,
          telefone: users.telefone,
          email: users.email,
          fotoPerfil: users.fotoPerfil
        })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!userData) {
        console.log(`❌ [AUTO-PERFIL] Usuário ${userId} não encontrado`);
        return;
      }

      // Verificar se perfil está 100% completo
      const perfilCompleto = !!(
        userData.nome?.trim() &&
        userData.telefone?.trim() &&
        userData.email?.trim() &&
        userData.fotoPerfil?.trim()
      );

      if (!perfilCompleto) {
        console.log(`📋 [AUTO-PERFIL] Usuário ${userId}: Perfil incompleto - Nome: ${!!userData.nome}, Tel: ${!!userData.telefone}, Email: ${!!userData.email}, Foto: ${!!userData.fotoPerfil}`);
        return;
      }

      console.log(`✅ [AUTO-PERFIL] Usuário ${userId}: Perfil 100% completo detectado!`);

      // Buscar missões ativas de perfil completo que o usuário ainda não completou
      const missoesPerfilCompleto = await db
        .select({
          id: missoesSemanais.id,
          titulo: missoesSemanais.titulo,
          recompensaGritos: missoesSemanais.recompensaGritos,
          descricao: missoesSemanais.descricao,
          tipoMissao: missoesSemanais.tipoMissao
        })
        .from(missoesSemanais)
        .where(and(
          or(
            eq(missoesSemanais.tipoMissao, 'completar_perfil'),
            eq(missoesSemanais.tipoMissao, 'perfil_completo'),
            ilike(missoesSemanais.titulo, '%perfil%'),
            ilike(missoesSemanais.titulo, '%completo%'),
            ilike(missoesSemanais.descricao, '%perfil%')
          ),
          eq(missoesSemanais.ativo, true)
        ));

      if (missoesPerfilCompleto.length === 0) {
        console.log(`📋 [AUTO-PERFIL] Nenhuma missão de perfil completo ativa encontrada`);
        return;
      }

      for (const missao of missoesPerfilCompleto) {
        // Verificar se usuário já completou esta missão
        const [jaCompleta] = await db
          .select()
          .from(missoesConcluidas)
          .where(and(
            eq(missoesConcluidas.userId, userId),
            eq(missoesConcluidas.missaoId, missao.id)
          ))
          .limit(1);

        if (jaCompleta) {
          console.log(`✅ [AUTO-PERFIL] Usuário ${userId} já completou missão ${missao.id}: ${missao.titulo}`);
          continue;
        }

        // Completar automaticamente a missão
        await db.insert(missoesConcluidas).values({
          userId,
          missaoId: missao.id,
          gritosRecebidos: missao.recompensaGritos || 150
        }).onConflictDoNothing();

        // Adicionar gritos ao usuário
        await this.addGritosToUser(userId, missao.recompensaGritos || 150);

        // Criar histórico
        await this.createGritosHistorico({
          userId,
          tipo: 'missao_automatica',
          gritosGanhos: missao.recompensaGritos || 150,
          descricao: `Missão completada automaticamente: ${missao.titulo} (perfil 100% completo)`
        });

        console.log(`🎯 [AUTO-PERFIL COMPLETA] Usuário ${userId} completou automaticamente: "${missao.titulo}" - +${missao.recompensaGritos || 150} gritos`);
      }
    } catch (error) {
      console.error(`❌ [AUTO-PERFIL ERRO] Usuário ${userId}:`, error);
      throw error; // Re-throw para ver o erro nos logs
    }
  }

  // 🎯 FUNÇÃO PARA COMPLETAR AUTOMATICAMENTE MISSÕES DE CONVITE DE AMIGOS
  async autoCompleteReferralMissions(userId: number): Promise<void> {
    console.log(`🔍 [AUTO-CONVITE] Iniciando verificação para usuário ${userId}`);
    try {
      // Buscar missões ativas de convite de amigos que o usuário ainda não completou
      const missoesConviteAmigo = await db
        .select({
          id: missoesSemanais.id,
          titulo: missoesSemanais.titulo,
          recompensaGritos: missoesSemanais.recompensaGritos,
          descricao: missoesSemanais.descricao,
          tipoMissao: missoesSemanais.tipoMissao,
          quantidadeAmigos: missoesSemanais.quantidadeAmigos
        })
        .from(missoesSemanais)
        .where(and(
          or(
            eq(missoesSemanais.tipoMissao, 'convite_amigo'),
            eq(missoesSemanais.tipoMissao, 'convidar_amigos'),
            eq(missoesSemanais.tipoMissao, 'indicar_amigo'),
            ilike(missoesSemanais.titulo, '%convit%'),
            ilike(missoesSemanais.titulo, '%amig%'),
            ilike(missoesSemanais.titulo, '%indic%'),
            ilike(missoesSemanais.descricao, '%convit%'),
            ilike(missoesSemanais.descricao, '%amig%'),
            ilike(missoesSemanais.descricao, '%indic%')
          ),
          eq(missoesSemanais.ativo, true)
        ));

      if (missoesConviteAmigo.length === 0) {
        console.log(`📋 [AUTO-CONVITE] Nenhuma missão de convite de amigos ativa encontrada`);
        return;
      }

      for (const missao of missoesConviteAmigo) {
        // Verificar se usuário já completou esta missão
        const [jaCompleta] = await db
          .select()
          .from(missoesConcluidas)
          .where(and(
            eq(missoesConcluidas.userId, userId),
            eq(missoesConcluidas.missaoId, missao.id)
          ))
          .limit(1);

        if (jaCompleta) {
          console.log(`✅ [AUTO-CONVITE] Usuário ${userId} já completou missão ${missao.id}: ${missao.titulo}`);
          continue;
        }

        // Contar referrals completos (com doação) do usuário para esta missão específica
        const referralsCompletos = await db
          .select()
          .from(referrals)
          .where(and(
            eq(referrals.referrerUserId, userId),
            eq(referrals.status, 'doou_completou'),
            // Se a missão tem ID específico, filtrar por ela; senão contar todos os referrals completos
            missao.quantidadeAmigos ? sql`1 = 1` : sql`1 = 1`
          ));

        const quantidadeNecessaria = missao.quantidadeAmigos || 1;
        const referralsCompletosCount = referralsCompletos.length;

        console.log(`📊 [AUTO-CONVITE] Usuário ${userId}, Missão ${missao.id}: ${referralsCompletosCount}/${quantidadeNecessaria} amigos indicados com doação`);

        // Verificar se atingiu o threshold necessário
        if (referralsCompletosCount >= quantidadeNecessaria) {
          console.log(`🎯 [AUTO-CONVITE] Threshold atingido! Usuário ${userId} indicou ${referralsCompletosCount} amigos para missão: ${missao.titulo}`);

          // Completar automaticamente a missão
          await db.insert(missoesConcluidas).values({
            userId,
            missaoId: missao.id,
            gritosRecebidos: missao.recompensaGritos || 200
          }).onConflictDoNothing();

          // Adicionar gritos ao usuário
          await this.addGritosToUser(userId, missao.recompensaGritos || 200);

          // Criar histórico
          await this.createGritosHistorico({
            userId,
            tipo: 'missao_automatica',
            gritosGanhos: missao.recompensaGritos || 200,
            descricao: `Missão completada automaticamente: ${missao.titulo} (${referralsCompletosCount} amigos indicados com doação)`
          });

          console.log(`🎯 [AUTO-CONVITE COMPLETA] Usuário ${userId} completou automaticamente: "${missao.titulo}" - +${missao.recompensaGritos || 200} gritos`);
        } else {
          console.log(`⏳ [AUTO-CONVITE PENDENTE] Usuário ${userId} precisa indicar ${quantidadeNecessaria - referralsCompletosCount} amigos a mais para "${missao.titulo}" (atual: ${referralsCompletosCount})`);
        }
      }
    } catch (error) {
      console.error(`❌ [AUTO-CONVITE ERRO] Usuário ${userId}:`, error);
      throw error; // Re-throw para ver o erro nos logs
    }
  }

  // ===== MÓDULO INDICAÇÃO (REFERRAL) =====

  async generateRefCode(): Promise<string> {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      let code = 'GRITO-';
      for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }

      // Verificar se código já existe
      const [existing] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.refCode, code))
        .limit(1);

      if (!existing) {
        return code;
      }

      attempts++;
    }

    throw new Error('Não foi possível gerar código único após 10 tentativas');
  }

  async getUserByRefCode(refCode: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.refCode, refCode))
      .limit(1);
    
    return user;
  }

  async ensureUserHasRefCode(userId: number): Promise<string> {
    const [user] = await db
      .select({ refCode: users.refCode })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (user?.refCode) {
      return user.refCode;
    }

    // Gerar novo código
    const newCode = await this.generateRefCode();

    await db
      .update(users)
      .set({ refCode: newCode })
      .where(eq(users.id, userId));

    console.log(`✅ [REF-CODE] Código gerado para usuário ${userId}: ${newCode}`);
    return newCode;
  }

  async populateAllUserRefCodes(): Promise<{ total: number; created: number }> {
    const usersWithoutCode = await db
      .select({ id: users.id })
      .from(users)
      .where(sql`${users.refCode} IS NULL`);

    let created = 0;
    for (const user of usersWithoutCode) {
      try {
        await this.ensureUserHasRefCode(user.id);
        created++;
      } catch (error) {
        console.error(`❌ [REF-CODE] Erro ao gerar código para usuário ${user.id}:`, error);
      }
    }

    console.log(`✅ [REF-CODE] Populado ${created}/${usersWithoutCode.length} códigos`);
    return { total: usersWithoutCode.length, created };
  }


  async updateUserRefCodeCadastro(userId: number, refCode: string): Promise<void> {
    await db
      .update(users)
      .set({ ref_code_cadastro: refCode })
      .where(eq(users.id, userId));

    console.log(`✅ [UPDATE-REF-CADASTRO] Usuário ${userId} agora tem ref_code_cadastro: ${refCode}`);
  }

  // ===== SISTEMA DE LINK PERSONALIZADO (SLUG) =====
  
  async generateSlugFromName(nome: string, sobrenome?: string): Promise<string> {
    // Normalizar texto: remover acentos, converter para minúsculas, substituir espaços por hífen
    const normalizeText = (text: string) => {
      return text
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove acentos
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '') // Remove caracteres especiais
        .replace(/\s+/g, '-') // Substitui espaços por hífen
        .replace(/-+/g, '-'); // Remove hífens duplicados
    };

    const fullName = sobrenome ? `${nome} ${sobrenome}` : nome;
    let baseSlug = normalizeText(fullName);
    
    // Verificar se slug já existe
    let slug = baseSlug;
    let attempts = 0;
    const maxAttempts = 20;

    while (attempts < maxAttempts) {
      const [existing] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.refSlug, slug))
        .limit(1);

      if (!existing) {
        return slug;
      }

      // Se já existe, adicionar número
      attempts++;
      slug = `${baseSlug}-${attempts}`;
    }

    throw new Error('Não foi possível gerar slug único após 20 tentativas');
  }

  async ensureUserHasRefSlug(userId: number): Promise<string> {
    const [user] = await db
      .select({ refSlug: users.refSlug, nome: users.nome, sobrenome: users.sobrenome })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (user?.refSlug) {
      return user.refSlug;
    }

    if (!user?.nome) {
      throw new Error(`Usuário ${userId} não tem nome cadastrado para gerar slug`);
    }

    // Gerar novo slug baseado no nome
    const newSlug = await this.generateSlugFromName(user.nome, user.sobrenome || undefined);

    await db
      .update(users)
      .set({ refSlug: newSlug })
      .where(eq(users.id, userId));

    console.log(`✅ [REF-SLUG] Slug gerado para usuário ${userId}: ${newSlug}`);
    return newSlug;
  }

  async getMeuLinkIndicacao(userId: number): Promise<string> {
    // Buscar link de marketing da campanha "Indique e Ganhe" (campaign_id = 1)
    const [marketingLink] = await db
      .select({ code: marketingLinks.code })
      .from(marketingLinks)
      .where(
        and(
          eq(marketingLinks.rewardToUserId, userId),
          eq(marketingLinks.campaignId, 1),
          eq(marketingLinks.isActive, true)
        )
      )
      .limit(1);
    
    if (marketingLink) {
      const baseURL = 'https://clubedogrito.institutoogrito.com.br';
      return `${baseURL}/plans?ref=${marketingLink.code}`;
    }
    
    // Fallback: se não tem link de marketing, usar refSlug (para retrocompatibilidade)
    const refSlug = await this.ensureUserHasRefSlug(userId);
    const baseURL = 'https://clubedogrito.institutoogrito.com.br';
    return `${baseURL}/plans?ref=${refSlug}`;
  }

  async getUserByRefSlug(refSlug: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.refSlug, refSlug))
      .limit(1);
    
    return user;
  }

  async updateUserRefSlugCadastro(userId: number, refSlug: string): Promise<void> {
    await db
      .update(users)
      .set({ refCodeCadastro: refSlug })
      .where(eq(users.id, userId));

    console.log(`✅ [UPDATE-REF-SLUG-CADASTRO] Usuário ${userId} agora tem ref_code_cadastro: ${refSlug}`);
  }

  // ===== FIM SISTEMA DE LINK PERSONALIZADO =====

  async createIndicacao(indicouId: number, indicadoId: number, refCode: string): Promise<Indicacao> {
    const validade = new Date();
    validade.setDate(validade.getDate() + 30); // 30 dias de validade

    const [indicacao] = await db
      .insert(indicacoes)
      .values({
        indicouId,
        indicadoId,
        refCode,
        status: 'PENDENTE',
        validade: validade, // Date object
      })
      .returning();

    console.log(`✅ [INDICAÇÃO] Criada indicação PENDENTE: ${indicouId} indicou ${indicadoId} com código ${refCode}`);
    return indicacao;
  }

  async getIndicacaoByIndicado(indicadoId: number): Promise<Indicacao | undefined> {
    const [indicacao] = await db
      .select()
      .from(indicacoes)
      .where(eq(indicacoes.indicadoId, indicadoId))
      .limit(1);

    return indicacao;
  }

  async confirmarIndicacao(indicacaoId: number): Promise<{ indicacao: Indicacao; pontos: IndicacaoPontos }> {
    // Atualizar indicação para CONFIRMADA
    const [indicacao] = await db
      .update(indicacoes)
      .set({ 
        status: 'CONFIRMADA',
        confirmadaEm: new Date() // Date object
      })
      .where(eq(indicacoes.id, indicacaoId))
      .returning();

    if (!indicacao) {
      throw new Error(`Indicação ${indicacaoId} não encontrada`);
    }

    // Creditar 1 ponto para quem indicou (com idempotência)
    const [pontos] = await db
      .insert(indicacaoPontosLedger)
      .values({
        userId: indicacao.indicouId,
        indicacaoId: indicacao.id,
        pontos: 1,
        motivo: 'indicacao_confirmada'
      })
      .onConflictDoNothing() // Idempotência: não duplica se já existir
      .returning();

    console.log(`✅ [INDICAÇÃO] Confirmada indicação ${indicacaoId}: +1 ponto para usuário ${indicacao.indicouId}`);
    
    return { indicacao, pontos };
  }

  async getMinhasIndicacoes(userId: number): Promise<Array<Indicacao & { indicado?: User }>> {
    const result = await db
      .select({
        id: indicacoes.id,
        indicouId: indicacoes.indicouId,
        indicadoId: indicacoes.indicadoId,
        refCode: indicacoes.refCode,
        status: indicacoes.status,
        criadaEm: indicacoes.criadaEm,
        confirmadaEm: indicacoes.confirmadaEm,
        validade: indicacoes.validade,
        indicadoNome: users.nome,
        indicadoSobrenome: users.sobrenome,
        indicadoTelefone: users.telefone,
      })
      .from(indicacoes)
      .leftJoin(users, eq(indicacoes.indicadoId, users.id))
      .where(eq(indicacoes.indicouId, userId))
      .orderBy(desc(indicacoes.criadaEm));

    return result.map(row => ({
      id: row.id,
      indicouId: row.indicouId,
      indicadoId: row.indicadoId,
      refCode: row.refCode,
      status: row.status,
      criadaEm: row.criadaEm,
      confirmadaEm: row.confirmadaEm,
      validade: row.validade,
      indicado: row.indicadoNome ? {
        nome: row.indicadoNome,
        sobrenome: row.indicadoSobrenome,
        telefone: row.indicadoTelefone,
      } as any : undefined
    }));
  }

  async getSaldoPontosIndicacao(userId: number): Promise<number> {
    const [result] = await db
      .select({ total: sql<number>`COALESCE(SUM(${indicacaoPontosLedger.pontos}), 0)` })
      .from(indicacaoPontosLedger)
      .where(eq(indicacaoPontosLedger.userId, userId));

    return result?.total || 0;
  }

  async getLedgerPontosIndicacao(userId: number): Promise<IndicacaoPontos[]> {
    return await db
      .select()
      .from(indicacaoPontosLedger)
      .where(eq(indicacaoPontosLedger.userId, userId))
      .orderBy(desc(indicacaoPontosLedger.criadoEm));
  }

  async markStripeEventProcessed(eventId: string, eventType: string): Promise<void> {
    await db
      .insert(stripeEvents)
      .values({ id: eventId, type: eventType })
      .onConflictDoNothing();
  }

  async isStripeEventProcessed(eventId: string): Promise<boolean> {
    const [event] = await db
      .select()
      .from(stripeEvents)
      .where(eq(stripeEvents.id, eventId))
      .limit(1);

    return !!event;
  }

  // ==================== MÓDULO DEV MARKETING ====================

  async createMarketingCampaign(campaign: InsertMarketingCampaign): Promise<MarketingCampaign> {
    const [newCampaign] = await db
      .insert(marketingCampaigns)
      .values(campaign)
      .returning();
    
    console.log(`✅ [MARKETING] Campanha criada: ${newCampaign.name} (ID: ${newCampaign.id})`);
    return newCampaign;
  }

  async getMarketingCampaigns(filters?: { isActive?: boolean }): Promise<MarketingCampaign[]> {
    let query = db.select().from(marketingCampaigns);
    
    if (filters?.isActive !== undefined) {
      query = query.where(eq(marketingCampaigns.isActive, filters.isActive)) as any;
    }
    
    return await query.orderBy(desc(marketingCampaigns.createdAt));
  }

  async getMarketingCampaign(id: number): Promise<MarketingCampaign | undefined> {
    const [campaign] = await db
      .select()
      .from(marketingCampaigns)
      .where(eq(marketingCampaigns.id, id))
      .limit(1);
    
    return campaign;
  }

  async updateMarketingCampaign(id: number, campaign: Partial<InsertMarketingCampaign>): Promise<MarketingCampaign> {
    const [updated] = await db
      .update(marketingCampaigns)
      .set(campaign)
      .where(eq(marketingCampaigns.id, id))
      .returning();
    
    if (!updated) {
      throw new Error(`Campanha ${id} não encontrada`);
    }
    
    console.log(`✅ [MARKETING] Campanha atualizada: ${updated.name} (ID: ${id})`);
    return updated;
  }

  async createMarketingLink(link: InsertMarketingLink): Promise<MarketingLink> {
    const [newLink] = await db
      .insert(marketingLinks)
      .values(link)
      .returning();
    
    console.log(`✅ [MARKETING] Link criado: ${newLink.code} para campanha ${newLink.campaignId}`);
    return newLink;
  }

  async createMarketingLinks(links: InsertMarketingLink[]): Promise<MarketingLink[]> {
    const newLinks = await db
      .insert(marketingLinks)
      .values(links)
      .returning();
    
    console.log(`✅ [MARKETING] ${newLinks.length} links criados em bulk`);
    return newLinks;
  }

  async getMarketingLinks(filters?: { campaignId?: number; isActive?: boolean }): Promise<MarketingLink[]> {
    let conditions = [];
    
    if (filters?.campaignId !== undefined) {
      conditions.push(eq(marketingLinks.campaignId, filters.campaignId));
    }
    if (filters?.isActive !== undefined) {
      conditions.push(eq(marketingLinks.isActive, filters.isActive));
    }
    
    let query = db.select().from(marketingLinks);
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    
    return await query.orderBy(desc(marketingLinks.createdAt));
  }

  async getMarketingLink(id: number): Promise<MarketingLink | undefined> {
    const [link] = await db
      .select()
      .from(marketingLinks)
      .where(eq(marketingLinks.id, id))
      .limit(1);
    
    return link;
  }

  async getMarketingLinkByCode(code: string): Promise<MarketingLink | undefined> {
    const [link] = await db
      .select()
      .from(marketingLinks)
      .where(eq(marketingLinks.code, code))
      .limit(1);
    
    return link;
  }

  async updateMarketingLink(id: number, link: Partial<InsertMarketingLink>): Promise<MarketingLink> {
    const [updated] = await db
      .update(marketingLinks)
      .set(link)
      .where(eq(marketingLinks.id, id))
      .returning();
    
    if (!updated) {
      throw new Error(`Link ${id} não encontrado`);
    }
    
    console.log(`✅ [MARKETING] Link atualizado: ${updated.code} (ID: ${id})`);
    return updated;
  }

  async getMarketingLinkStats(linkId: number): Promise<{ clicks: number; cadastros: number; conversoes: number; taxa: number }> {
    // Cliques
    const [clicksResult] = await db
      .select({ count: sql<number>`COALESCE(COUNT(*), 0)` })
      .from(mktClicks)
      .where(eq(mktClicks.linkId, linkId));
    
    const clicks = Number(clicksResult?.count) || 0;
    
    // Buscar código do link
    const link = await this.getMarketingLink(linkId);
    if (!link) {
      return { clicks: 0, cadastros: 0, conversoes: 0, taxa: 0 };
    }
    
    // Cadastros (total de indicações criadas com este ref_code)
    const [cadastrosResult] = await db
      .select({ count: sql<number>`COALESCE(COUNT(*), 0)` })
      .from(indicacoes)
      .where(eq(indicacoes.refCode, link.code));
    
    const cadastros = Number(cadastrosResult?.count) || 0;
    
    // Conversões (indicações confirmadas)
    const [conversoesResult] = await db
      .select({ count: sql<number>`COALESCE(COUNT(*), 0)` })
      .from(indicacoes)
      .where(and(
        eq(indicacoes.refCode, link.code),
        eq(indicacoes.status, 'CONFIRMADA')
      ));
    
    const conversoes = Number(conversoesResult?.count) || 0;
    
    // Taxa de conversão
    const taxa = cadastros > 0 ? (conversoes / cadastros) * 100 : 0;
    
    return { clicks, cadastros, conversoes, taxa };
  }

  async createMktClick(click: InsertMktClick): Promise<MktClick> {
    const [newClick] = await db
      .insert(mktClicks)
      .values(click)
      .returning();
    
    return newClick;
  }


  async linkUserToActiveCampaign(userId: number): Promise<MarketingLink | null> {
    // Buscar campanha ativa
    const activeCampaigns = await this.getMarketingCampaigns({ isActive: true });
    
    if (activeCampaigns.length === 0) {
      console.log(`⚠️ [AUTO-LINK] Nenhuma campanha ativa encontrada para vincular usuário ${userId}`);
      return null;
    }
    
    const activeCampaign = activeCampaigns[0];
    
    // Garantir que o usuário tem um ref_slug
    const refSlug = await this.ensureUserHasRefSlug(userId);
    
    // Verificar se já existe um link para este usuário nesta campanha
    const existingLink = await this.getMarketingLinkByCode(refSlug);
    
    if (existingLink) {
      console.log(`ℹ️ [AUTO-LINK] Link já existe para usuário ${userId}: ${refSlug}`);
      return existingLink;
    }
    
    // Criar link de marketing vinculado à campanha ativa
    const newLink = await this.createMarketingLink({
      campaignId: activeCampaign.id,
      code: refSlug,
      medium: 'referral',
      source: 'organic',
      utmCampaign: activeCampaign.name,
      utmMedium: 'referral',
      utmSource: 'donor-link',
      rewardToUserId: userId,
      isActive: true,
    });
    
    console.log(`✅ [AUTO-LINK] Link criado para usuário ${userId} na campanha "${activeCampaign.name}": ${refSlug}`);
    return newLink;
  }
  async getMarketingCampaignStats(campaignId: number): Promise<{ totalLinks: number; totalClicks: number; totalCadastros: number; totalConversoes: number; taxaConversao: number }> {
    // Total de links da campanha
    const [linksResult] = await db
      .select({ count: sql<number>`COALESCE(COUNT(*), 0)` })
      .from(marketingLinks)
      .where(eq(marketingLinks.campaignId, campaignId));
    
    const totalLinks = linksResult?.count || 0;
    
    // Buscar todos os codes da campanha
    const links = await db
      .select({ code: marketingLinks.code })
      .from(marketingLinks)
      .where(eq(marketingLinks.campaignId, campaignId));
    
    const codes = links.map(l => l.code);
    
    if (codes.length === 0) {
      return { totalLinks: 0, totalClicks: 0, totalCadastros: 0, totalConversoes: 0, taxaConversao: 0 };
    }
    
    // Total de cliques
    const [clicksResult] = await db
      .select({ count: sql<number>`COALESCE(COUNT(*), 0)` })
      .from(mktClicks)
      .innerJoin(marketingLinks, eq(mktClicks.linkId, marketingLinks.id))
      .where(eq(marketingLinks.campaignId, campaignId));
    
    const totalClicks = clicksResult?.count || 0;
    
    // Total de cadastros
    const [cadastrosResult] = await db
      .select({ count: sql<number>`COALESCE(COUNT(*), 0)` })
      .from(indicacoes)
      .where(inArray(indicacoes.refCode, codes));
    
    const totalCadastros = cadastrosResult?.count || 0;
    
    // Total de conversões
    const [conversoesResult] = await db
      .select({ count: sql<number>`COALESCE(COUNT(*), 0)` })
      .from(indicacoes)
      .where(and(
        inArray(indicacoes.refCode, codes),
        eq(indicacoes.status, 'CONFIRMADA')
      ));
    
    const totalConversoes = conversoesResult?.count || 0;
    
    // Taxa de conversão
    const taxaConversao = totalCadastros > 0 ? (totalConversoes / totalCadastros) * 100 : 0;
    
    return { totalLinks, totalClicks, totalCadastros, totalConversoes, taxaConversao };
  }

  // ==================== FIM MÓDULO DEV MARKETING ====================

  async getPersonalizedCheckinStatus(userId: number): Promise<{ canCheckin: boolean; diasConsecutivos: number; diaAtual: number; cicloCompleto: boolean; ultimoCheckin: string | null }> {
    const agora = new Date();
    const hoje = agora.toISOString().split('T')[0];

    // ✨ VERIFICAÇÃO PRIMÁRIA: Já fez check-in hoje na tabela checkins?
    const checkinsHoje = await db
      .select()
      .from(checkins)
      .where(and(
        eq(checkins.userId, userId),
        eq(checkins.dataCheckin, hoje)
      ))
      .limit(1);

    console.log(`🔍 [DEBUG CHECKIN] Usuário ${userId}, Hoje: ${hoje}, Query retornou:`, checkinsHoje.length, 'registros', checkinsHoje);

    if (checkinsHoje.length > 0) {
      const checkinHoje = checkinsHoje[0];
      console.log(`🚫 [CHECK-IN STATUS] Usuário ${userId}: Já fez check-in hoje (${hoje}) - Registro:`, checkinHoje);
      // Se já fez check-in hoje, buscar dados atuais do usuário para retornar status correto
      const [userData] = await db
        .select({
          diasConsecutivos: users.diasConsecutivos,
          ultimoCheckin: users.ultimoCheckin
        })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      const diasConsecutivosAtuais = userData?.diasConsecutivos || 0;
      const diaAtualNoCiclo = diasConsecutivosAtuais === 0 ? 1 : Math.min(diasConsecutivosAtuais, 7);
      const ciclosCompletos = Math.floor(diasConsecutivosAtuais / 7);
      const cicloCompleto = ciclosCompletos > 0;

      return {
        canCheckin: false,
        diasConsecutivos: diasConsecutivosAtuais,
        diaAtual: Math.min(diaAtualNoCiclo, 7),
        cicloCompleto,
        ultimoCheckin: userData?.ultimoCheckin ? new Date(userData.ultimoCheckin).toISOString() : null
      };
    }

    // Obter dados do usuário incluindo data de cadastro
    const [userData] = await db
      .select({
        dataCadastro: users.dataCadastro,
        diasConsecutivos: users.diasConsecutivos,
        ultimoCheckin: users.ultimoCheckin
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!userData) {
      return { canCheckin: false, diasConsecutivos: 0, diaAtual: 1, cicloCompleto: false, ultimoCheckin: null };
    }

    // ✨ SISTEMA DE CHECK-IN DIÁRIO - Baseado em dia de calendário, não 24h exatas
    let canCheckin = true;
    let ultimoCheckinFormatado: string | null = null;

    if (userData.ultimoCheckin) {
      // ultimoCheckin agora é string ISO do banco
      const dataUltimoCheckin = userData.ultimoCheckin.split('T')[0]; // "2025-10-20T12:00:00Z" -> "2025-10-20"
      const dataHoje = hoje; // já está no formato YYYY-MM-DD
      
      // Pode fazer check-in se é um dia diferente
      canCheckin = dataHoje !== dataUltimoCheckin;
      
      // Para o retorno e cálculo de horas
      const ultimoCheckinDate = new Date(userData.ultimoCheckin);
      const diferencaHoras = (agora.getTime() - ultimoCheckinDate.getTime()) / (1000 * 60 * 60);
      
      ultimoCheckinFormatado = userData.ultimoCheckin;
      
      console.log(`📅 [CHECK-IN DIÁRIO] Usuário ${userId}: Último check-in ${diferencaHoras.toFixed(1)}h atrás. Hoje: ${dataHoje}, Último: ${dataUltimoCheckin}. Pode fazer check-in: ${canCheckin}`);
    }

    // ✨ VERIFICAR SE A STREAK DEVERIA SER RESETADA (perdeu mais de 1 dia)
    let diasConsecutivosAtuais = userData.diasConsecutivos || 0;

    if (userData.ultimoCheckin && diasConsecutivosAtuais > 0) {
      // Comparar datas diretamente como strings
      const dataHojeUTC = hoje; // YYYY-MM-DD
      const dataUltimoCheckinUTC = userData.ultimoCheckin.split('T')[0]; // YYYY-MM-DD
      
      // Converter datas para timestamps e calcular diferença
      const msPerDay = 24 * 60 * 60 * 1000;
      const timestampHoje = new Date(dataHojeUTC).getTime();
      const timestampUltimo = new Date(dataUltimoCheckinUTC).getTime();
      const diferencaDias = Math.floor((timestampHoje - timestampUltimo) / msPerDay);

      // Se passou mais de 1 dia sem check-in, RESETAR streak
      if (diferencaDias > 1) {
        const ultimoCheckinDate = new Date(userData.ultimoCheckin);
        const diferencaHoras = (agora.getTime() - ultimoCheckinDate.getTime()) / (1000 * 60 * 60);
        console.log(`🔄 [STREAK AUTO-RESET] Usuário ${userId}: ${diferencaDias} dias sem check-in (${diferencaHoras.toFixed(1)}h). Resetando streak de ${diasConsecutivosAtuais} para 0`);

        // Resetar no banco de dados
        await db.update(users)
          .set({ diasConsecutivos: 0 })
          .where(eq(users.id, userId));

        diasConsecutivosAtuais = 0;
      }
    }

    // Se tem check-ins consecutivos, o dia atual é baseado nisso
    // Se não tem, é o primeiro dia
    const diaAtualNoCiclo = diasConsecutivosAtuais === 0 ? 1 : Math.min(diasConsecutivosAtuais, 7);

    // Calcular ciclos baseado nos dias consecutivos atuais (já com reset se necessário)
    const ciclosCompletos = Math.floor(diasConsecutivosAtuais / 7);

    // Se completou pelo menos um ciclo de 7 dias
    const cicloCompleto = ciclosCompletos > 0;

    return {
      canCheckin,
      diasConsecutivos: diasConsecutivosAtuais,
      diaAtual: Math.min(diaAtualNoCiclo, 7), // Máximo 7
      cicloCompleto,
      ultimoCheckin: ultimoCheckinFormatado
    };
  }

  // Gritos
  async addGritosToUser(userId: number, gritos: number): Promise<void> {
    await db
      .update(users)
      .set({
        gritosTotal: sql`COALESCE(gritos_total, 0) + ${gritos}`
      })
      .where(eq(users.id, userId));
  }

  async createGritosHistorico(historico: InsertGritosHistorico): Promise<GritosHistorico> {
    const [newHistorico] = await db.insert(gritosHistorico).values(historico).returning();
    return newHistorico;
  }

  async getGritosHistory(userId: number): Promise<GritosHistorico[]> {
    return await db
      .select()
      .from(gritosHistorico)
      .where(eq(gritosHistorico.userId, userId))
      .orderBy(desc(gritosHistorico.dataGanho));
  }

  async getBonusInicialUser(userId: number): Promise<GritosHistorico | undefined> {
    const [bonus] = await db
      .select()
      .from(gritosHistorico)
      .where(and(
        eq(gritosHistorico.userId, userId),
        eq(gritosHistorico.tipo, 'bonus_inicial')
      ))
      .limit(1);
    return bonus || undefined;
  }

  // Recalcular gritos totais baseado no histórico real
  async recalculateUserGritos(userId: number): Promise<number> {
    try {
      // PRIMEIRO: Ver todos os registros do histórico
      const historico = await db
        .select()
        .from(gritosHistorico)
        .where(eq(gritosHistorico.userId, userId));
      
      console.log(`🔍 [GRITOS SYNC DEBUG] Usuário ${userId} - Histórico completo:`, historico);
      
      // Somar todos os gritos do histórico
      const [result] = await db
        .select({
          total: sql<number>`COALESCE(SUM(${gritosHistorico.gritosGanhos}), 0)`
        })
        .from(gritosHistorico)
        .where(eq(gritosHistorico.userId, userId));

      console.log(`🔍 [GRITOS SYNC DEBUG] Resultado da query SUM:`, result);
      console.log(`🔍 [GRITOS SYNC DEBUG] Tipo de result.total:`, typeof result.total, result.total);

      const gritosCalculados = result.total;

      // Atualizar o campo gritosTotal na tabela users
      await db
        .update(users)
        .set({ gritosTotal: gritosCalculados })
        .where(eq(users.id, userId));

      console.log(`✅ [GRITOS SYNC] Usuário ${userId}: Gritos recalculados para ${gritosCalculados}`);

      return gritosCalculados;
    } catch (error) {
      console.error(`❌ [GRITOS SYNC] Erro ao recalcular gritos do usuário ${userId}:`, error);
      throw error;
    }
  }

  // Sincronizar gritos de todos os usuários
  async syncAllUsersGritos(): Promise<void> {
    try {
      // Buscar todos os usuários que têm histórico de gritos
      const usuariosComGritos = await db
        .selectDistinct({ userId: gritosHistorico.userId })
        .from(gritosHistorico);

      console.log(`🔄 [GRITOS SYNC] Sincronizando gritos de ${usuariosComGritos.length} usuários...`);

      for (const usuario of usuariosComGritos) {
        if (usuario.userId) {
          await this.recalculateUserGritos(usuario.userId);
        }
      }

      console.log(`✅ [GRITOS SYNC] Sincronização concluída para todos os usuários`);
    } catch (error) {
      console.error(`❌ [GRITOS SYNC] Erro na sincronização geral:`, error);
      throw error;
    }
  }

  // Níveis
  async getNivelByGritos(gritos: number): Promise<Nivel | undefined> {
    const [nivel] = await db
      .select()
      .from(niveis)
      .where(sql`${gritos} >= gritos_minimos`)
      .orderBy(desc(niveis.gritosMinimos))
      .limit(1);
    return nivel || undefined;
  }

  // ===== MÓDULO BENEFÍCIOS DINÂMICOS =====
  async getAllBeneficios(): Promise<Beneficio[]> {
    return await db
      .select()
      .from(beneficios)
      .orderBy(asc(beneficios.ordem), asc(beneficios.id));
  }

  async getBeneficiosAtivos(): Promise<Beneficio[]> {
    console.log(`🔍 [BENEFICIOS ATIVOS] Buscando benefícios ativos usando SQL direto`);
    
    // Usar SQL bruto para evitar problemas de compilação TypeScript
    const resultados = await db.execute<Beneficio>(sql`
      SELECT * FROM beneficios
      WHERE ativo = true
        AND (prazo_lances IS NULL OR prazo_lances > NOW())
      ORDER BY ordem ASC, id ASC
    `);
    
    const rows = resultados.rows as Beneficio[];
    console.log(`✅ [BENEFICIOS ATIVOS] Encontrados ${rows.length} benefícios ativos (IDs: ${rows.map((b: Beneficio) => b.id).join(', ')})`);
    return rows;
  }

  async getBeneficiosByPlano(planoMinimo: string): Promise<Beneficio[]> {
    const planosHierarquia = ['eco', 'voz', 'grito', 'platinum'];
    const planoIndex = planosHierarquia.indexOf(planoMinimo);

    if (planoIndex === -1) {
      console.log(`❌ Plano inválido: ${planoMinimo}`);
      return [];
    }

    // CORREÇÃO: Se o usuário tem plano "voz", deve ver benefícios que exigem "eco" ou "voz"
    // Ou seja, do menor plano até o plano do usuário (inclusive)
    const planosPermitidos = planosHierarquia.slice(0, planoIndex + 1);

    return await db
      .select()
      .from(beneficios)
      .where(and(
        eq(beneficios.ativo, true),
        sql`${beneficios.planosDisponiveis} && ARRAY[${planosPermitidos.map(p => `'${p}'`).join(',')}]::text[]`,
        or(
          sql`${beneficios.prazoLances} IS NULL`, // Benefícios sem prazo (não são leilões)
          sql`${beneficios.prazoLances} > NOW()` // Ou prazo ainda não expirou
        )
      ))
      .orderBy(asc(beneficios.ordem), asc(beneficios.id));
  }

  async getBeneficio(id: number): Promise<Beneficio | undefined> {
    const [beneficio] = await db
      .select()
      .from(beneficios)
      .where(eq(beneficios.id, id))
      .limit(1);
    return beneficio || undefined;
  }

  async createBeneficio(beneficio: InsertBeneficio): Promise<Beneficio> {
    // Filtrar campos de timestamp para evitar conflitos
    const { createdAt, updatedAt, ...beneficioSemTimestamps } = beneficio as any;

    const [newBeneficio] = await db
      .insert(beneficios)
      .values({
        ...beneficioSemTimestamps,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    return newBeneficio;
  }

  async updateBeneficio(id: number, beneficio: Partial<InsertBeneficio>): Promise<Beneficio> {
    // Filtrar campos de timestamp para evitar conflitos
    const { createdAt, updatedAt, ...beneficioSemTimestamps } = beneficio as any;

    const [updatedBeneficio] = await db
      .update(beneficios)
      .set({
        ...beneficioSemTimestamps,
        updatedAt: new Date()
      })
      .where(eq(beneficios.id, id))
      .returning();
    return updatedBeneficio;
  }

  async deleteBeneficio(id: number): Promise<void> {
    await db
      .delete(beneficios)
      .where(eq(beneficios.id, id));
  }

  // ===== IMPLEMENTAÇÕES MÓDULO IMAGENS DOS BENEFÍCIOS =====
  async createBeneficioImagem(imagem: InsertBeneficioImagem): Promise<BeneficioImagem> {
    const [inserted] = await db
      .insert(beneficioImagens)
      .values(imagem)
      .returning();
    return inserted;
  }

  async getBeneficioImagem(beneficioId: number, tipo?: string): Promise<BeneficioImagem | undefined> {
    const conditions = [
      eq(beneficioImagens.beneficioId, beneficioId),
      eq(beneficioImagens.ativo, true)
    ];

    // Se tipo especificado, filtrar por ele; senão buscar primeiro card, depois qualquer um
    if (tipo) {
      conditions.push(eq(beneficioImagens.tipo, tipo));
    }

    const [imagem] = await db
      .select()
      .from(beneficioImagens)
      .where(and(...conditions))
      .orderBy(
        tipo
          ? desc(beneficioImagens.createdAt)
          : sql`CASE WHEN tipo = 'card' THEN 1 ELSE 2 END, created_at DESC`
      );
    return imagem || undefined;
  }

  async updateBeneficioImagem(beneficioId: number, imagem: Partial<InsertBeneficioImagem>): Promise<BeneficioImagem> {
    const [updated] = await db
      .update(beneficioImagens)
      .set({
        ...imagem,
        updatedAt: sql`NOW()`
      })
      .where(and(
        eq(beneficioImagens.beneficioId, beneficioId),
        eq(beneficioImagens.ativo, true)
      ))
      .returning();
    return updated;
  }

  async getBeneficioImagensByBeneficio(beneficioId: number): Promise<BeneficioImagem[]> {
    const imagens = await db
      .select()
      .from(beneficioImagens)
      .where(and(
        eq(beneficioImagens.beneficioId, beneficioId),
        eq(beneficioImagens.ativo, true)
      ))
      .orderBy(sql`CASE WHEN tipo = 'card' THEN 1 ELSE 2 END, created_at DESC`);
    return imagens;
  }

  async deleteBeneficioImagem(beneficioId: number, tipo?: string): Promise<void> {
    const conditions = [eq(beneficioImagens.beneficioId, beneficioId)];

    if (tipo) {
      conditions.push(eq(beneficioImagens.tipo, tipo));
    }

    await db
      .update(beneficioImagens)
      .set({ ativo: false })
      .where(and(...conditions));
  }

  // ===== SISTEMA DE LANCES EM BENEFÍCIOS =====
  async createBeneficioLance(lance: InsertBeneficioLance): Promise<BeneficioLance> {
    const [newLance] = await db
      .insert(beneficioLances)
      .values({
        ...lance,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    return newLance;
  }

  async getBeneficioLancesByUser(userId: number): Promise<any[]> {
    // Buscar lances do usuário
    const lances = await db
      .select()
      .from(beneficioLances)
      .where(eq(beneficioLances.userId, userId))
      .orderBy(desc(beneficioLances.createdAt));

    // Para cada lance, buscar os dados do benefício
    const lancesCompletos = [];
    for (const lance of lances) {
      const [beneficio] = await db
        .select()
        .from(beneficios)
        .where(eq(beneficios.id, lance.beneficioId))
        .limit(1);

      lancesCompletos.push({
        id: lance.id,
        beneficioId: lance.beneficioId,
        userId: lance.userId,
        pontosOfertados: lance.pontosOfertados,
        dataLance: lance.createdAt,
        status: lance.status,
        beneficio: beneficio ? {
          id: beneficio.id,
          titulo: beneficio.titulo,
          descricao: beneficio.descricao,
          imagemUrl: beneficio.imagem,
          categoria: beneficio.categoria
        } : null
      });
    }

    return lancesCompletos;
  }

  async getBeneficioLancesByBeneficio(beneficioId: number): Promise<BeneficioLance[]> {
    return await db
      .select()
      .from(beneficioLances)
      .where(eq(beneficioLances.beneficioId, beneficioId))
      .orderBy(desc(beneficioLances.createdAt));
  }

  async getUserLances(userId: number): Promise<any[]> {
    console.log(`📋 [STORAGE] Buscando lances para usuário ${userId}`);

    // Buscar lances do usuário no banco de dados
    const lances = await db
      .select()
      .from(beneficioLances)
      .where(eq(beneficioLances.userId, userId))
      .orderBy(desc(beneficioLances.createdAt));

    console.log(`📋 [STORAGE] Encontrados ${lances.length} lances na tabela beneficio_lances`);

    // Para cada lance, buscar os dados do benefício
    const lancesCompletos = [];
    for (const lance of lances) {
      const [beneficio] = await db
        .select()
        .from(beneficios)
        .where(eq(beneficios.id, lance.beneficioId))
        .limit(1);

      if (beneficio) {
        lancesCompletos.push({
          id: lance.id,
          beneficioId: lance.beneficioId,
          userId: lance.userId,
          pontosOfertados: lance.pontosOfertados,
          dataLance: lance.createdAt?.toISOString() || new Date().toISOString(),
          status: lance.status || 'ativo',
          beneficio: {
            id: beneficio.id,
            titulo: beneficio.titulo,
            descricao: beneficio.descricao,
            imagemCardUrl: `/api/beneficios/${beneficio.id}/imagem?tipo=card`,
            imagemDetalhesUrl: `/api/beneficios/${beneficio.id}/imagem?tipo=detalhes`,
            imagemUrl: `/api/beneficios/${beneficio.id}/imagem`,
            categoria: beneficio.categoria
          }
        });
      }
    }

    console.log(`📋 [STORAGE] Retornando ${lancesCompletos.length} lances completos`);
    return lancesCompletos;
  }

  async checkUserBeneficioParticipation(userId: number, beneficioId: number): Promise<boolean> {
    const [lance] = await db
      .select()
      .from(beneficioLances)
      .where(and(
        eq(beneficioLances.userId, userId),
        eq(beneficioLances.beneficioId, beneficioId)
      ))
      .limit(1);
    return !!lance;
  }

  async processarBeneficioLance(userId: number, beneficioId: number, pontosOfertados: number): Promise<{ success: boolean; message: string; lanceId?: number }> {
    try {
      // Verificar se usuário já participou
      const jaParticipou = await this.checkUserBeneficioParticipation(userId, beneficioId);
      if (jaParticipou) {
        return {
          success: false,
          message: "Você já deu seu lance neste benefício."
        };
      }

      // Verificar se usuário tem pontos suficientes
      const [user] = await db
        .select({ gritosTotal: users.gritosTotal })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!user || (user.gritosTotal || 0) < pontosOfertados) {
        return {
          success: false,
          message: "Você não tem Gritos suficientes para este lance."
        };
      }

      // Criar o lance
      const lance = await this.createBeneficioLance({
        userId,
        beneficioId,
        pontosOfertados,
        status: 'ativo'
      });

      // Deduzir os pontos do usuário
      await db
        .update(users)
        .set({
          gritosTotal: sql`COALESCE(gritos_total, 0) - ${pontosOfertados}`
        })
        .where(eq(users.id, userId));

      // Registrar no histórico de gritos
      await this.createGritosHistorico({
        userId,
        gritosGanhos: -pontosOfertados, // negativo porque foi deduzido
        tipo: 'lance_beneficio',
        descricao: `Lance de ${pontosOfertados} Gritos em benefício`
      });

      return {
        success: true,
        message: "Lance registrado com sucesso!",
        lanceId: lance.id
      };

    } catch (error) {
      console.error('Error processing beneficio lance:', error);
      return {
        success: false,
        message: "Erro interno ao processar lance."
      };
    }
  }

  async aumentarBeneficioLance(userId: number, beneficioId: number, novosPontosOfertados: number): Promise<{ success: boolean; message: string; lanceId?: number }> {
    try {
      // Buscar lance existente do usuário
      const [lanceExistente] = await db
        .select()
        .from(beneficioLances)
        .where(and(
          eq(beneficioLances.userId, userId),
          eq(beneficioLances.beneficioId, beneficioId)
        ))
        .limit(1);

      if (!lanceExistente) {
        return {
          success: false,
          message: "Você não possui lance neste benefício para aumentar."
        };
      }

      const pontosAnteriores = lanceExistente.pontosOfertados;
      const diferenca = novosPontosOfertados - pontosAnteriores;

      if (diferenca <= 0) {
        return {
          success: false,
          message: "O novo lance deve ser maior que o anterior."
        };
      }

      // Verificar se usuário tem pontos suficientes para a diferença
      const [user] = await db
        .select({ gritosTotal: users.gritosTotal })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!user || (user.gritosTotal || 0) < diferenca) {
        return {
          success: false,
          message: `Você precisa de mais ${diferenca} Gritos para aumentar seu lance.`
        };
      }

      // Remover lance anterior
      await db
        .delete(beneficioLances)
        .where(eq(beneficioLances.id, lanceExistente.id));

      // Criar novo lance
      const novoLance = await this.createBeneficioLance({
        userId,
        beneficioId,
        pontosOfertados: novosPontosOfertados,
        status: 'ativo'
      });

      // Deduzir apenas a diferença dos pontos
      await db
        .update(users)
        .set({
          gritosTotal: sql`COALESCE(gritos_total, 0) - ${diferenca}`
        })
        .where(eq(users.id, userId));

      // Registrar no histórico de gritos
      await this.createGritosHistorico({
        userId,
        gritosGanhos: -diferenca, // negativo porque foi deduzido
        tipo: 'aumento_lance',
        descricao: `Aumento de lance: +${diferenca} Gritos (de ${pontosAnteriores} para ${novosPontosOfertados})`
      });

      return {
        success: true,
        message: `Lance aumentado com sucesso! De ${pontosAnteriores} para ${novosPontosOfertados} Gritos.`,
        lanceId: novoLance.id
      };

    } catch (error) {
      console.error('Error increasing beneficio lance:', error);
      return {
        success: false,
        message: "Erro interno ao aumentar lance."
      };
    }
  }

  // ===== PROCESSAMENTO AUTOMÁTICO DE LEILÕES EXPIRADOS =====
  async getExpiredBeneficiosUnprocessed(): Promise<Beneficio[]> {
    try {
      const now = new Date();
      console.log(`🔍 [LEILÕES] Buscando benefícios expirados não processados em ${now.toISOString()}`);

      const expiredBeneficios = await db
        .select()
        .from(beneficios)
        .where(
          and(
            eq(beneficios.ativo, true),
            sql`${beneficios.prazoLances} < ${now}` // prazo expirado
          )
        );

      // Filtrar apenas os que ainda têm lances "ativo" (não processados)
      const unprocessedBeneficios = [];
      for (const beneficio of expiredBeneficios) {
        const [activeBid] = await db
          .select()
          .from(beneficioLances)
          .where(
            and(
              eq(beneficioLances.beneficioId, beneficio.id),
              eq(beneficioLances.status, 'ativo')
            )
          )
          .limit(1);

        if (activeBid) {
          unprocessedBeneficios.push(beneficio);
        }
      }

      console.log(`🔍 [LEILÕES] Encontrados ${unprocessedBeneficios.length} benefícios expirados com lances não processados`);
      return unprocessedBeneficios;
    } catch (error) {
      console.error('❌ [LEILÕES] Erro ao buscar benefícios expirados:', error);
      throw error;
    }
  }

  async processExpiredAuctions(): Promise<{
    totalProcessed: number;
    winners: Array<{ beneficioId: number; winnerId: number; pontosOfertados: number }>;
    details: Array<{ beneficioId: number; totalBids: number; winnerUserId: number; pontosDescontados: number }>;
  }> {
    try {
      console.log(`🚀 [LEILÕES] Iniciando processamento de leilões expirados`);

      const expiredBeneficios = await this.getExpiredBeneficiosUnprocessed();

      if (expiredBeneficios.length === 0) {
        console.log(`✅ [LEILÕES] Nenhum leilão expirado para processar`);
        return { totalProcessed: 0, winners: [], details: [] };
      }

      const winners = [];
      const details = [];
      const dataResultado = new Date();

      // ✅ CRÍTICO: Processar cada benefício em transação separada para idempotência
      for (const beneficio of expiredBeneficios) {
        console.log(`🔄 [LEILÕES] Processando benefício ID ${beneficio.id}: ${beneficio.titulo}`);

        // ✅ CRÍTICO: Processar cada benefício em transação atômica para idempotência
        const result = await db.transaction(async (tx) => {
          // Verificar se já foi processado (double-check dentro da transação)
          const [beneficioAtual] = await tx
            .select()
            .from(beneficios)
            .where(eq(beneficios.id, beneficio.id))
            .for('update'); // Lock para evitar processamento concorrente

          if (!beneficioAtual) {
            console.log(`✅ [LEILÕES] Benefício ${beneficio.id} já foi processado, pulando`);
            return null;
          }

          // Buscar todos os lances ativos para este benefício
          const lances = await tx
            .select()
            .from(beneficioLances)
            .where(
              and(
                eq(beneficioLances.beneficioId, beneficio.id),
                eq(beneficioLances.status, 'ativo')
              )
            )
            .orderBy(desc(beneficioLances.pontosOfertados), asc(beneficioLances.createdAt)); // Maior lance primeiro, empate DETERMINÍSTICO por data

          if (lances.length === 0) {
            console.log(`⚠️ [LEILÕES] Benefício ${beneficio.id} não tem lances ativos`);
            return null;
          }

          const vencedor = lances[0]; // Primeiro da lista (maior lance, primeiro em caso de empate)
          const perdedores = lances.slice(1);

          console.log(`🏆 [LEILÕES] Benefício ${beneficio.id}: Vencedor userId ${vencedor.userId} com ${vencedor.pontosOfertados} pontos`);
          console.log(`😞 [LEILÕES] Benefício ${beneficio.id}: ${perdedores.length} perdedores`);

          // Atualizar status do vencedor (NÃO deduzir pontos, já foram deduzidos no lance)
          await tx
            .update(beneficioLances)
            .set({
              status: 'ganhou',
              dataResultado: dataResultado,
              updatedAt: new Date()
            })
            .where(eq(beneficioLances.id, vencedor.id));

          console.log(`✅ [LEILÕES] Vencedor ${vencedor.userId}: pontos já deduzidos no lance original (${vencedor.pontosOfertados})`);

          // Atualizar status dos perdedores E DEVOLVER seus pontos
          if (perdedores.length > 0) {
            // Atualizar status primeiro
            await tx
              .update(beneficioLances)
              .set({
                status: 'perdeu',
                dataResultado: dataResultado,
                updatedAt: new Date()
              })
              .where(inArray(beneficioLances.id, perdedores.map(l => l.id)));

            // Devolver pontos aos perdedores (pontos foram deduzidos quando fizeram lance)
            for (const perdedor of perdedores) {
              // Atualizar pontos do usuário
              await tx
                .update(users)
                .set({
                  gritosTotal: sql`COALESCE(gritos_total, 0) + ${perdedor.pontosOfertados}`
                })
                .where(eq(users.id, perdedor.userId));

              // Registrar no histórico de gritos
              await tx
                .insert(gritosHistorico)
                .values({
                  userId: perdedor.userId,
                  gritosGanhos: perdedor.pontosOfertados,
                  tipo: 'leilao_devolucao',
                  descricao: `Leilão perdido - Devolução de pontos - Benefício: ${beneficio.titulo}`
                });

              console.log(`💰 [LEILÕES] Devolvidos ${perdedor.pontosOfertados} pontos para usuário ${perdedor.userId} (perdedor)`);
            }
          }

          // ✅ MARCAR BENEFÍCIO COMO PROCESSADO para evitar reprocessamento
          await tx
            .update(beneficios)
            .set({
              updatedAt: sql`NOW() AT TIME ZONE 'UTC'`
            })
            .where(eq(beneficios.id, beneficio.id));

          console.log(`✅ [LEILÕES] Benefício ${beneficio.id} marcado como processado`);

          return {
            vencedor,
            totalBids: lances.length
          };
        });

        // Se processamento foi bem-sucedido, adicionar aos resultados
        if (result) {
          winners.push({
            beneficioId: beneficio.id,
            winnerId: result.vencedor.userId,
            pontosOfertados: result.vencedor.pontosOfertados
          });

          details.push({
            beneficioId: beneficio.id,
            totalBids: result.totalBids,
            winnerUserId: result.vencedor.userId,
            pontosDescontados: result.vencedor.pontosOfertados
          });
        }
      }

      console.log(`✅ [LEILÕES] Processamento concluído: ${expiredBeneficios.length} leilões processados`);

      return {
        totalProcessed: expiredBeneficios.length,
        winners,
        details
      };

    } catch (error) {
      console.error('❌ [LEILÕES] Erro ao processar leilões expirados:', error);
      throw error;
    }
  }

  async updateBeneficioLancesStatus(lanceIds: number[], status: string, dataResultado?: Date): Promise<void> {
    try {
      if (lanceIds.length === 0) return;

      console.log(`📝 [LEILÕES] Atualizando ${lanceIds.length} lances para status: ${status}`);

      await db
        .update(beneficioLances)
        .set({
          status,
          dataResultado: dataResultado || new Date(),
          updatedAt: new Date()
        })
        .where(sql`${beneficioLances.id} IN (${lanceIds.join(',')})`);

      console.log(`✅ [LEILÕES] Status atualizado com sucesso`);
    } catch (error) {
      console.error('❌ [LEILÕES] Erro ao atualizar status dos lances:', error);
      throw error;
    }
  }

  async adjustUserPoints(userId: number, pointsChange: number, reason: string): Promise<void> {
    try {
      console.log(`💰 [PONTOS] Ajustando ${pointsChange} pontos para usuário ${userId}: ${reason}`);

      // Atualizar pontos do usuário
      await db
        .update(users)
        .set({
          gritosTotal: sql`COALESCE(gritos_total, 0) + ${pointsChange}`
        })
        .where(eq(users.id, userId));

      // Registrar no histórico de gritos
      await this.createGritosHistorico({
        userId,
        gritosGanhos: pointsChange,
        tipo: pointsChange > 0 ? 'leilao_devolucao' : 'leilao_desconto',
        descricao: reason
      });

      console.log(`✅ [PONTOS] Pontos ajustados com sucesso`);
    } catch (error) {
      console.error('❌ [PONTOS] Erro ao ajustar pontos do usuário:', error);
      throw error;
    }
  }

  // ===== SISTEMA DE CAUSAS (GRITO) =====
  async saveUserCausa(userId: number, causa: string): Promise<void> {
    await db.insert(userCausas).values({
      userId,
      causa
    });
  }

  async clearUserCausas(userId: number): Promise<void> {
    await db.delete(userCausas).where(eq(userCausas.userId, userId));
  }

  async getUserCausas(userId: number): Promise<string[]> {
    const causas = await db.select().from(userCausas).where(eq(userCausas.userId, userId));
    return causas.map(c => c.causa);
  }

  // ===== SISTEMA DE DOAÇÕES - CÁLCULO INDIVIDUAL POR DOADOR =====
  async getUserTotalDonations(userId: number): Promise<number> {
    try {
      console.log(`🔍 [IMPACTO INDIVIDUAL] Calculando para usuário ${userId}`);

      // DEBUG: Buscar todos os registros do usuário primeiro
      const allUserDonations = await db
        .select()
        .from(doadores)
        .where(eq(doadores.userId, userId));
      
      console.log(`🔍 [DEBUG] Total de registros para userId ${userId}:`, allUserDonations.length);
      allUserDonations.forEach((d: any) => {
        console.log(`  - ID: ${d.id}, Status: ${d.status}, Ativo: ${d.ativo}, Valor: ${d.valor}`);
      });

      // ✅ BUSCAR APENAS DOAÇÕES DESTE USUÁRIO ESPECÍFICO
      // Não somar de outros doadores - cada um vê apenas o SEU valor
      const [userDonations] = await db
        .select({
          totalPago: sql<string>`COALESCE(SUM(${doadores.valor}), 0)`,
          quantidadeDoacao: sql<number>`COUNT(*)`
        })
        .from(doadores)
        .where(
          and(
            eq(doadores.userId, userId),
            eq(doadores.status, 'paid'), // ✅ APENAS pagamentos confirmados
            eq(doadores.ativo, true)
          )
        );

      const valorIndividual = parseFloat(userDonations.totalPago || '0');
      const quantidade = userDonations.quantidadeDoacao || 0;

      console.log(`💰 [DOADOR INDIVIDUAL] Usuário ${userId}: ${quantidade} doações pagas = R$ ${valorIndividual.toFixed(2)}`);

      // ✅ RETORNAR APENAS O VALOR DESTE DOADOR ESPECÍFICO
      return valorIndividual;
    } catch (error) {
      console.error(`❌ Erro ao calcular doações individuais do usuário ${userId}:`, error);
      return 0;
    }
  }

  // ===== MÓDULO LEILÕES DE PONTOS =====

  // Prêmios
  async getAllPremios(): Promise<Premio[]> {
    return await db
      .select()
      .from(premios)
      .orderBy(asc(premios.categoria), asc(premios.titulo));
  }

  async getPremiosAtivos(): Promise<Premio[]> {
    return await db
      .select()
      .from(premios)
      .where(eq(premios.ativo, true))
      .orderBy(asc(premios.categoria), asc(premios.titulo));
  }

  async getPremio(id: number): Promise<Premio | undefined> {
    const [premio] = await db
      .select()
      .from(premios)
      .where(eq(premios.id, id));
    return premio || undefined;
  }

  async createPremio(premio: InsertPremio): Promise<Premio> {
    const [newPremio] = await db
      .insert(premios)
      .values(premio)
      .returning();
    return newPremio;
  }

  async updatePremio(id: number, premio: Partial<InsertPremio>): Promise<Premio> {
    const [updatedPremio] = await db
      .update(premios)
      .set({ ...premio, updatedAt: new Date() })
      .where(eq(premios.id, id))
      .returning();
    return updatedPremio;
  }

  async deletePremio(id: number): Promise<void> {
    await db.delete(premios).where(eq(premios.id, id));
  }

  // Leilões
  async getAllLeiloes(): Promise<Leilao[]> {
    return await db
      .select()
      .from(leiloes)
      .orderBy(desc(leiloes.createdAt));
  }

  async getLeiloesAtivos(): Promise<Leilao[]> {
    return await db
      .select()
      .from(leiloes)
      .where(eq(leiloes.status, 'ativo'))
      .orderBy(asc(leiloes.fimEm));
  }

  async getLeilao(id: number): Promise<Leilao | undefined> {
    const [leilao] = await db
      .select()
      .from(leiloes)
      .where(eq(leiloes.id, id));
    return leilao || undefined;
  }

  async createLeilao(leilao: InsertLeilao): Promise<Leilao> {
    const [newLeilao] = await db
      .insert(leiloes)
      .values(leilao)
      .returning();
    return newLeilao;
  }

  async updateLeilao(id: number, leilao: Partial<InsertLeilao>): Promise<Leilao> {
    const [updatedLeilao] = await db
      .update(leiloes)
      .set({ ...leilao, updatedAt: new Date() })
      .where(eq(leiloes.id, id))
      .returning();
    return updatedLeilao;
  }

  async finalizarLeilao(id: number, vencedorId: string): Promise<Leilao> {
    const [leilaoFinalizado] = await db
      .update(leiloes)
      .set({
        status: 'finalizado',
        liderAtual: vencedorId,
        updatedAt: new Date()
      })
      .where(eq(leiloes.id, id))
      .returning();
    return leilaoFinalizado;
  }

  // Lances
  async createLance(lance: InsertLance): Promise<Lance> {
    const [newLance] = await db
      .insert(lances)
      .values(lance)
      .returning();
    return newLance;
  }

  async getLancesByLeilao(leilaoId: number): Promise<Lance[]> {
    return await db
      .select()
      .from(lances)
      .where(eq(lances.leilaoId, leilaoId))
      .orderBy(desc(lances.createdAt));
  }

  async getLancesByUser(userId: string): Promise<Lance[]> {
    return await db
      .select()
      .from(lances)
      .where(eq(lances.userId, userId))
      .orderBy(desc(lances.createdAt));
  }

  async processarLance(leilaoId: number, userId: string, valor: number): Promise<{ sucesso: boolean; mensagem: string; lanceId?: number }> {
    try {
      // Verificar se o leilão existe e está ativo
      const leilao = await this.getLeilao(leilaoId);
      if (!leilao) {
        return { sucesso: false, mensagem: "Leilão não encontrado" };
      }

      if (leilao.status !== 'ativo') {
        return { sucesso: false, mensagem: "Leilão não está ativo" };
      }

      // Verificar se o leilão ainda não terminou
      const agora = new Date();
      if (agora > leilao.fimEm) {
        return { sucesso: false, mensagem: "Leilão já encerrou" };
      }

      // Verificar se o lance é maior que o mínimo
      const lanceMinimo = (leilao.lanceAtual || 0) + (leilao.incrementoMinimo || 0);
      if (valor < lanceMinimo) {
        return { sucesso: false, mensagem: `Lance mínimo é de ${lanceMinimo} pontos` };
      }

      // Verificar se o usuário tem gritos suficientes
      const usuario = await this.getUser(parseInt(userId));
      if (!usuario || (usuario.gritosTotal || 0) < valor) {
        return { sucesso: false, mensagem: "Gritos insuficientes" };
      }

      // Processar lance em transação
      const resultado = await db.transaction(async (tx) => {
        // Devolver pontos do líder anterior (se houver)
        if (leilao.liderAtual && leilao.liderAtual !== userId) {
          // Marcar lances anteriores como devolvidos
          await tx
            .update(lances)
            .set({ devolvido: true })
            .where(and(
              eq(lances.leilaoId, leilaoId),
              eq(lances.userId, leilao.liderAtual),
              eq(lances.devolvido, false)
            ));

          // Devolver os gritos do líder anterior
          const liderAnterior = await this.getUser(parseInt(leilao.liderAtual));
          if (liderAnterior) {
            await tx
              .update(users)
              .set({ gritosTotal: (liderAnterior.gritosTotal || 0) + (leilao.lanceAtual || 0) })
              .where(eq(users.id, parseInt(leilao.liderAtual)));
          }
        }

        // Debitar gritos do novo usuário
        await tx
          .update(users)
          .set({ gritosTotal: (usuario.gritosTotal || 0) - valor })
          .where(eq(users.id, parseInt(userId)));

        // Criar o lance
        const [novoLance] = await tx
          .insert(lances)
          .values({
            leilaoId,
            userId,
            valor,
            eraLider: true,
            devolvido: false
          })
          .returning();

        // Atualizar o leilão
        await tx
          .update(leiloes)
          .set({
            lanceAtual: valor,
            liderAtual: userId,
            updatedAt: new Date()
          })
          .where(eq(leiloes.id, leilaoId));

        return novoLance;
      });

      return {
        sucesso: true,
        mensagem: "Lance realizado com sucesso!",
        lanceId: resultado.id
      };

    } catch (error) {
      console.error('Erro ao processar lance:', error);
      return { sucesso: false, mensagem: "Erro interno do servidor" };
    }
  }

  // ===== DASHBOARD DE DOADORES =====

  async getDonorStats(): Promise<{
    totalAtivos: number;
    distribucaoPlano: { plano: string; count: number }[];
    quantidadeMissoes: number;
    quantidadeCheckinDiario: number;
    engajamentoMedio: {
      gritosMedia: number;
      streakMedia: number;
      checkinsSemana: number;
    };
  }> {
    try {
      // Total de doadores ativos (apenas com pagamentos confirmados)
      const [totalAtivosResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(doadores)
        .where(eq(doadores.status, 'paid'));

      // Distribuição por plano (apenas doadores com pagamentos confirmados)
      const distribucaoPlano = await db
        .select({
          plano: doadores.plano,
          count: sql<number>`count(*)`
        })
        .from(doadores)
        .where(eq(doadores.status, 'paid'))
        .groupBy(doadores.plano);

      // Quantidade que fizeram missões (apenas doadores confirmados)
      const [quantidadeMissoesResult] = await db
        .select({ count: sql<number>`count(distinct ${doadores.userId})` })
        .from(doadores)
        .innerJoin(users, eq(doadores.userId, users.id))
        .innerJoin(missoesConcluidas, eq(missoesConcluidas.userId, users.id))
        .where(eq(doadores.status, 'paid'));

      // Quantidade que fazem check-in diário (últimos 7 dias)
      const seteDiasAtras = new Date();
      seteDiasAtras.setDate(seteDiasAtras.getDate() - 7);

      const [quantidadeCheckinResult] = await db
        .select({ count: sql<number>`count(distinct ${doadores.userId})` })
        .from(doadores)
        .innerJoin(users, eq(doadores.userId, users.id))
        .innerJoin(checkins, eq(checkins.userId, users.id))
        .where(and(
          eq(doadores.status, 'paid'),
          sql`${checkins.dataCheckin} >= ${seteDiasAtras.toISOString().split('T')[0]}`
        ));

      // Engajamento médio (apenas doadores confirmados)
      const [engajamentoResult] = await db
        .select({
          gritosMedia: sql<number>`avg(${users.gritosTotal})`,
          streakMedia: sql<number>`avg(${users.diasConsecutivos})`,
          checkinsSemana: sql<number>`avg(checkins_count.count)`
        })
        .from(doadores)
        .innerJoin(users, eq(doadores.userId, users.id))
        .leftJoin(
          sql`(
            SELECT 
              user_id, 
              count(*) as count 
            FROM checkins 
            WHERE data_checkin >= ${seteDiasAtras.toISOString().split('T')[0]}
            GROUP BY user_id
          ) as checkins_count`,
          sql`checkins_count.user_id = ${users.id}`
        )
        .where(eq(doadores.status, 'paid'));

      return {
        totalAtivos: totalAtivosResult?.count || 0,
        distribucaoPlano: distribucaoPlano || [],
        quantidadeMissoes: quantidadeMissoesResult?.count || 0,
        quantidadeCheckinDiario: quantidadeCheckinResult?.count || 0,
        engajamentoMedio: {
          gritosMedia: Math.round(engajamentoResult?.gritosMedia || 0),
          streakMedia: Math.round(engajamentoResult?.streakMedia || 0),
          checkinsSemana: Math.round(engajamentoResult?.checkinsSemana || 0),
        }
      };
    } catch (error) {
      console.error('❌ [STORAGE] Erro ao buscar estatísticas de doadores:', error);
      return {
        totalAtivos: 0,
        distribucaoPlano: [],
        quantidadeMissoes: 0,
        quantidadeCheckinDiario: 0,
        engajamentoMedio: {
          gritosMedia: 0,
          streakMedia: 0,
          checkinsSemana: 0,
        }
      };
    }
  }

  async getDonorsWithFilters(filters: {
    busca?: string;
    plano?: string;
    status?: string;
    periodo?: string;
    limite?: number;
    offset?: number;
    ordenacao?: string;
  }): Promise<{
    doadores: Array<{
      id: number;
      nome: string;
      telefone: string;
      email: string;
      plano: string;
      valor: number;
      status: string;
      dataDoacaoInicial: Date;
      ultimaDoacao: Date;
      gritosTotal: number;
      nivelAtual: number;
      diasConsecutivos: number;
      ultimoCheckin: string;
      temMissoes: boolean;
      ativo: boolean;
    }>;
    total: number;
  }> {
    try {
      // Apenas doadores com pagamentos confirmados
      let whereConditions = [eq(doadores.status, 'paid')];

      // Filtro de busca (nome ou ID)
      if (filters.busca) {
        const searchCondition = or(
          ilike(users.nome, `%${filters.busca}%`),
          sql`${doadores.id}::text = ${filters.busca}`
        );
        if (searchCondition) {
          whereConditions.push(searchCondition);
        }
      }

      // Filtro de plano
      if (filters.plano) {
        whereConditions.push(eq(doadores.plano, filters.plano));
      }

      // Filtro de status (já filtrado por 'paid' acima, mas mantém compatibilidade)
      if (filters.status && filters.status !== 'paid') {
        whereConditions.push(eq(doadores.status, filters.status));
      }

      // Filtro de período
      if (filters.periodo) {
        const dataLimite = new Date();
        switch (filters.periodo) {
          case '7d':
            dataLimite.setDate(dataLimite.getDate() - 7);
            break;
          case '30d':
            dataLimite.setDate(dataLimite.getDate() - 30);
            break;
          case '90d':
            dataLimite.setDate(dataLimite.getDate() - 90);
            break;
        }
        whereConditions.push(sql`${doadores.dataDoacaoInicial} >= ${dataLimite}`);
      }

      // Query principal com subquery para verificar missões
      const query = db
        .select({
          id: doadores.id,
          nome: users.nome,
          telefone: users.telefone,
          email: users.email,
          plano: doadores.plano,
          valor: doadores.valor,
          status: doadores.status,
          dataDoacaoInicial: doadores.dataDoacaoInicial,
          ultimaDoacao: doadores.ultimaDoacao,
          gritosTotal: users.gritosTotal,
          nivelAtual: users.nivelAtual,
          diasConsecutivos: users.diasConsecutivos,
          ultimoCheckin: users.ultimoCheckin,
          temMissoes: sql<boolean>`exists(
            select 1 from missoes_concluidas mc 
            where mc.user_id = ${users.id}
          )`,
          ativo: doadores.ativo,
        })
        .from(doadores)
        .innerJoin(users, eq(doadores.userId, users.id))
        .where(and(...whereConditions));

      // Ordenação
      let orderBy;
      switch (filters.ordenacao) {
        case 'nome':
          orderBy = asc(users.nome);
          break;
        case 'plano':
          orderBy = asc(doadores.plano);
          break;
        case 'atividade':
          orderBy = desc(users.gritosTotal);
          break;
        case 'recente':
          orderBy = desc(doadores.dataDoacaoInicial);
          break;
        default:
          orderBy = desc(doadores.dataDoacaoInicial);
      }

      // Total de registros
      const [totalResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(doadores)
        .innerJoin(users, eq(doadores.userId, users.id))
        .where(and(...whereConditions));

      // Dados paginados
      const doadorData = await query
        .orderBy(orderBy)
        .limit(filters.limite || 50)
        .offset(filters.offset || 0);

      return {
        doadores: doadorData.map(d => ({
          ...d,
          nome: d.nome || '',
          telefone: d.telefone || '',
          email: d.email || '',
          valor: typeof d.valor === 'string' ? parseFloat(d.valor) : d.valor,
          status: d.status || 'pending',
          dataDoacaoInicial: d.dataDoacaoInicial || new Date(),
          ultimaDoacao: d.ultimaDoacao || d.dataDoacaoInicial || new Date(),
          gritosTotal: d.gritosTotal || 0,
          nivelAtual: typeof d.nivelAtual === 'string' ? parseInt(d.nivelAtual) : d.nivelAtual || 1,
          diasConsecutivos: d.diasConsecutivos || 0,
          ultimoCheckin: d.ultimoCheckin ? new Date(d.ultimoCheckin).toISOString() : '',
          temMissoes: Boolean(d.temMissoes),
          ativo: Boolean(d.ativo)
        })),
        total: totalResult?.count || 0
      };
    } catch (error) {
      console.error('❌ [STORAGE] Erro ao buscar doadores com filtros:', error);
      return {
        doadores: [],
        total: 0
      };
    }
  }

  async getDonorDetails(donorId: number): Promise<{
    dadosPessoais: {
      id: number;
      nome: string;
      sobrenome: string;
      telefone: string;
      email: string;
      dataCadastro: Date;
    };
    dadosDoacao: {
      plano: string;
      valor: number;
      status: string;
      stripeCustomerId: string;
      stripeSubscriptionId: string;
      dataDoacaoInicial: Date;
      ultimaDoacao: Date;
      totalDoacoes: number;
      ativo: boolean;
    };
    gamificacao: {
      gritosTotal: number;
      nivelAtual: number;
      proximoNivel: number;
      gritosParaProximoNivel: number;
      diasConsecutivos: number;
      ultimoCheckin: string;
      streakAtual: number;
    };
    atividadeRecente: {
      ultimasMissoes: Array<{
        titulo: string;
        concluidaEm: Date;
        gritosRecebidos: number;
      }>;
      ultimosCheckins: Array<{
        dataCheckin: Date;
        gritosGanhos: number;
      }>;
      historicoGritos: Array<{
        tipo: string;
        gritosGanhos: number;
        descricao: string;
        dataGanho: Date;
      }>;
    };
  } | undefined> {
    try {
      // Buscar dados básicos do doador
      const [doadorData] = await db
        .select({
          // Dados pessoais
          userId: doadores.userId,
          nome: users.nome,
          sobrenome: users.sobrenome,
          telefone: users.telefone,
          email: users.email,
          dataCadastro: users.dataCadastro,
          // Dados de doação
          plano: doadores.plano,
          valor: doadores.valor,
          status: doadores.status,
          stripeCustomerId: users.stripeCustomerId,
          stripeSubscriptionId: users.stripeSubscriptionId,
          dataDoacaoInicial: doadores.dataDoacaoInicial,
          ultimaDoacao: doadores.ultimaDoacao,
          ativo: doadores.ativo,
          // Gamificação
          gritosTotal: users.gritosTotal,
          nivelAtual: users.nivelAtual,
          proximoNivel: users.proximoNivel,
          gritosParaProximoNivel: users.gritosParaProximoNivel,
          diasConsecutivos: users.diasConsecutivos,
          ultimoCheckin: users.ultimoCheckin,
        })
        .from(doadores)
        .innerJoin(users, eq(doadores.userId, users.id))
        .where(eq(doadores.id, donorId));

      if (!doadorData) {
        return undefined;
      }

      // Calcular total de doações
      const [totalDoacoesResult] = await db
        .select({ total: sql<number>`sum(${historicoDoacao.valor})` })
        .from(historicoDoacao)
        .where(eq(historicoDoacao.doadorId, donorId));

      // Buscar últimas missões concluídas
      const ultimasMissoes = await db
        .select({
          titulo: missoesSemanais.titulo,
          concluidaEm: missoesConcluidas.concluidaEm,
          gritosRecebidos: missoesConcluidas.gritosRecebidos,
        })
        .from(missoesConcluidas)
        .innerJoin(missoesSemanais, eq(missoesConcluidas.missaoId, missoesSemanais.id))
        .where(eq(missoesConcluidas.userId, parseInt(doadorData.userId?.toString() || '0')))
        .orderBy(desc(missoesConcluidas.concluidaEm))
        .limit(5);

      // Buscar últimos check-ins
      const ultimosCheckins = await db
        .select({
          dataCheckin: checkins.dataCheckin,
          gritosGanhos: checkins.gritosGanhos,
        })
        .from(checkins)
        .where(eq(checkins.userId, parseInt(doadorData.userId?.toString() || '0')))
        .orderBy(desc(checkins.dataCheckin))
        .limit(10);

      // Buscar histórico de gritos
      const historicoGritos = await db
        .select({
          tipo: gritosHistorico.tipo,
          gritosGanhos: gritosHistorico.gritosGanhos,
          descricao: gritosHistorico.descricao,
          dataGanho: gritosHistorico.dataGanho,
        })
        .from(gritosHistorico)
        .where(eq(gritosHistorico.userId, parseInt(doadorData.userId?.toString() || '0')))
        .orderBy(desc(gritosHistorico.dataGanho))
        .limit(15);

      return {
        dadosPessoais: {
          id: donorId,
          nome: doadorData.nome || '',
          sobrenome: doadorData.sobrenome || '',
          telefone: doadorData.telefone || '',
          email: doadorData.email || '',
          dataCadastro: doadorData.dataCadastro || new Date(),
        },
        dadosDoacao: {
          plano: doadorData.plano,
          valor: parseFloat(doadorData.valor.toString()),
          status: doadorData.status || 'pending',
          stripeCustomerId: doadorData.stripeCustomerId || '',
          stripeSubscriptionId: doadorData.stripeSubscriptionId || '',
          dataDoacaoInicial: doadorData.dataDoacaoInicial || new Date(),
          ultimaDoacao: doadorData.ultimaDoacao || doadorData.dataDoacaoInicial || new Date(),
          totalDoacoes: parseFloat(totalDoacoesResult?.total?.toString() || '0'),
          ativo: Boolean(doadorData.ativo),
        },
        gamificacao: {
          gritosTotal: doadorData.gritosTotal || 0,
          nivelAtual: typeof doadorData.nivelAtual === 'string' ? parseInt(doadorData.nivelAtual) : doadorData.nivelAtual || 1,
          proximoNivel: typeof doadorData.proximoNivel === 'string' ? parseInt(doadorData.proximoNivel) : doadorData.proximoNivel || 2,
          gritosParaProximoNivel: doadorData.gritosParaProximoNivel || 0,
          diasConsecutivos: doadorData.diasConsecutivos || 0,
          ultimoCheckin: typeof doadorData.ultimoCheckin === 'object' && doadorData.ultimoCheckin ? doadorData.ultimoCheckin.toISOString() : doadorData.ultimoCheckin || '',
          streakAtual: doadorData.diasConsecutivos || 0,
        },
        atividadeRecente: {
          ultimasMissoes: ultimasMissoes.map(m => ({
            titulo: m.titulo,
            concluidaEm: m.concluidaEm || new Date(),
            gritosRecebidos: m.gritosRecebidos || 0,
          })),
          ultimosCheckins: ultimosCheckins.map(c => ({
            dataCheckin: new Date(c.dataCheckin),
            gritosGanhos: c.gritosGanhos || 0,
          })),
          historicoGritos: historicoGritos.map(h => ({
            tipo: h.tipo,
            gritosGanhos: h.gritosGanhos,
            descricao: h.descricao || '',
            dataGanho: h.dataGanho || new Date(),
          })),
        },
      };
    } catch (error) {
      console.error('❌ [STORAGE] Erro ao buscar detalhes do doador:', error);
      return undefined;
    }
  }

  // ===== SINCRONIZAÇÃO DE DOADORES COM STRIPE =====

  async syncDonorsFromStripe(): Promise<Array<{
    nome: string;
    telefone: string;
    email: string;
    stripeCustomerId: string;
    valor: number;
    totalPagamentos: number;
  }>> {
    try {
      console.log('🔄 [STRIPE SYNC] Iniciando sincronização de doadores da Stripe...');

      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

      // Buscar todas as cobranças com sucesso e não reembolsadas
      const charges = await stripe.charges.list({ limit: 100 });

      const validCharges = charges.data.filter((charge: any) =>
        charge.status === 'succeeded' &&
        !charge.refunded &&
        charge.amount_refunded === 0 &&
        charge.customer !== null
      );

      console.log(`✅ [STRIPE SYNC] ${validCharges.length} cobranças válidas encontradas`);

      // Agrupar por customer ID
      const customerCharges = validCharges.reduce((acc: any, charge: any) => {
        if (!acc[charge.customer]) {
          acc[charge.customer] = [];
        }
        acc[charge.customer].push(charge);
        return acc;
      }, {});

      const donors: Array<{
        nome: string;
        telefone: string;
        email: string;
        stripeCustomerId: string;
        valor: number;
        totalPagamentos: number;
      }> = [];

      // Para cada customer, buscar detalhes e salvar no banco
      for (const [customerId, customerChargesList] of Object.entries(customerCharges)) {
        try {
          const customer = await stripe.customers.retrieve(customerId);
          const chargesList = customerChargesList as any[];

          const totalValor = chargesList.reduce((sum: number, charge: any) => sum + charge.amount, 0) / 100;
          const totalPagamentos = chargesList.length;

          const nome = customer.name || 'Sem nome';
          const telefone = customer.phone || '';
          const email = customer.email || '';

          // Verificar se já existe doador com esse stripeCustomerId
          const [existingDonor] = await db
            .select()
            .from(users)
            .where(eq(users.stripeCustomerId, customerId))
            .limit(1);

          if (existingDonor) {
            // Atualizar doador existente
            await db
              .update(users)
              .set({
                nome: nome,
                telefone: telefone || existingDonor.telefone,
                email: email || existingDonor.email,
                role: 'doador'
              })
              .where(eq(users.id, existingDonor.id));

            console.log(`🔄 [STRIPE SYNC] Doador atualizado: ${nome} (${customerId})`);
          } else {
            // Criar novo doador - telefone é obrigatório, usar placeholder se não tiver
            const [newUser] = await db
              .insert(users)
              .values({
                telefone: telefone || `stripe_${customerId}`,
                nome: nome,
                email: email,
                role: 'doador',
                stripeCustomerId: customerId
              })
              .returning();

            console.log(`✅ [STRIPE SYNC] Novo doador criado: ${nome} (${customerId})`);
          }

          donors.push({
            nome,
            telefone,
            email,
            stripeCustomerId: customerId,
            valor: totalValor,
            totalPagamentos
          });

        } catch (error) {
          console.error(`❌ [STRIPE SYNC] Erro ao processar customer ${customerId}:`, error);
        }
      }

      console.log(`✅ [STRIPE SYNC] Sincronização concluída! ${donors.length} doadores processados`);
      return donors;

    } catch (error) {
      console.error('❌ [STRIPE SYNC] Erro ao sincronizar doadores:', error);
      throw error;
    }
  }

  async getAllDonors(): Promise<Array<{
    id: number;
    nome: string;
    telefone: string;
    email: string;
    plano: string;
    valor: number;
    status: string;
    stripeCustomerId: string;
    ativo: boolean;
    dataDoacaoInicial: Date;
  }>> {
    try {
      console.log('📋 [DONORS] Buscando todos os doadores do banco de dados...');

      const donors = await db
        .select({
          id: users.id,
          nome: users.nome,
          telefone: users.telefone,
          email: users.email,
          plano: users.plano,
          stripeCustomerId: users.stripeCustomerId,
          createdAt: users.createdAt
        })
        .from(users)
        .where(eq(users.role, 'doador'));

      console.log(`✅ [DONORS] ${donors.length} doadores encontrados no banco`);

      return donors.map(donor => ({
        id: donor.id,
        nome: donor.nome || 'Sem nome',
        telefone: donor.telefone || '',
        email: donor.email || '',
        plano: donor.plano || 'eco',
        valor: 9.90, // Valor padrão, pode ser calculado depois
        status: 'paid',
        stripeCustomerId: donor.stripeCustomerId || '',
        ativo: true,
        dataDoacaoInicial: donor.createdAt || new Date()
      }));

    } catch (error) {
      console.error('❌ [DONORS] Erro ao buscar doadores:', error);
      throw error;
    }
  }

  // ===== SISTEMA DE RASTREAMENTO DE ATIVIDADE =====

  async logActivity(activityData: InsertActivityEvent): Promise<ActivityEvent> {
    try {
      console.log('📊 [ACTIVITY] Registrando atividade:', {
        userId: activityData.userId,
        eventType: activityData.eventType,
        entityType: activityData.entityType,
        entityId: activityData.entityId,
        entityTitle: activityData.entityTitle,
        entityCategory: activityData.entityCategory,
        entityTags: activityData.entityTags
      });

      const [activity] = await db.insert(activityEvents).values(activityData).returning();

      // Se o evento tem tags/categoria, atualizar interesses do usuário
      if (activityData.entityCategory || (activityData.entityTags && activityData.entityTags.length > 0)) {
        await this.updateUserInterests(activityData.userId, activityData);
      }

      return activity;
    } catch (error) {
      console.error('❌ [ACTIVITY] Erro ao registrar atividade:', error);
      throw error;
    }
  }

  async getUserInterests(userId: number): Promise<UserInterest[]> {
    try {
      return await db
        .select()
        .from(userInterests)
        .where(eq(userInterests.userId, userId))
        .orderBy(desc(userInterests.score));
    } catch (error) {
      console.error('❌ [ACTIVITY] Erro ao buscar interesses do usuário:', error);
      return [];
    }
  }

  async upsertUserInterest(
    userId: number,
    category: string,
    tag: string,
    scoreIncrement: number = 0.1
  ): Promise<UserInterest> {
    try {
      // Buscar interesse existente
      const [existingInterest] = await db
        .select()
        .from(userInterests)
        .where(
          and(
            eq(userInterests.userId, userId),
            eq(userInterests.category, category),
            eq(userInterests.tag, tag)
          )
        );

      const now = new Date();

      if (existingInterest) {
        // Aplicar decaimento temporal baseado no tempo desde a última interação
        const daysSinceLastInteraction = Math.floor(
          (now.getTime() - existingInterest.lastInteraction.getTime()) / (1000 * 60 * 60 * 24)
        );
        const decayFactor = Math.pow(parseFloat(existingInterest.decayFactor.toString()), daysSinceLastInteraction);
        const decayedScore = parseFloat(existingInterest.score.toString()) * decayFactor;

        // Calcular novo score (máximo 1.0)
        const newScore = Math.min(1.0, decayedScore + scoreIncrement);
        const newInteractionCount = existingInterest.interactionCount + 1;

        const [updatedInterest] = await db
          .update(userInterests)
          .set({
            score: newScore.toString(),
            lastInteraction: now,
            interactionCount: newInteractionCount,
            updatedAt: now,
          })
          .where(eq(userInterests.id, existingInterest.id))
          .returning();

        console.log('📈 [INTEREST] Atualizado:', {
          userId,
          category,
          tag,
          oldScore: existingInterest.score,
          newScore: newScore.toFixed(4),
          interactionCount: newInteractionCount
        });

        return updatedInterest;
      } else {
        // Criar novo interesse
        const [newInterest] = await db
          .insert(userInterests)
          .values({
            userId,
            category,
            tag,
            score: scoreIncrement.toString(),
            lastInteraction: now,
            interactionCount: 1,
          })
          .returning();

        console.log('✨ [INTEREST] Criado:', {
          userId,
          category,
          tag,
          score: scoreIncrement.toFixed(4)
        });

        return newInterest;
      }
    } catch (error) {
      console.error('❌ [ACTIVITY] Erro ao atualizar interesse do usuário:', error);
      throw error;
    }
  }

  private async updateUserInterests(userId: number, activityData: InsertActivityEvent): Promise<void> {
    const scoreWeights = {
      view: 0.05,
      click: 0.1,
      duration: 0.15,
      complete: 0.3,
      share: 0.25,
      like: 0.2,
      comment: 0.25,
      start: 0.1,
      resume: 0.05,
    };

    const scoreIncrement = scoreWeights[activityData.eventType as keyof typeof scoreWeights] || 0.05;

    // Atualizar interesse por categoria
    if (activityData.entityCategory) {
      await this.upsertUserInterest(userId, activityData.entityCategory, 'categoria', scoreIncrement);
    }

    // Atualizar interesse por tags
    if (activityData.entityTags && activityData.entityTags.length > 0) {
      for (const tag of activityData.entityTags) {
        await this.upsertUserInterest(
          userId,
          activityData.entityCategory || 'geral',
          tag,
          scoreIncrement * 0.7 // Tags têm peso menor que categoria
        );
      }
    }
  }

  async getRecommendations(
    userId: number,
    entityTypes?: string[],
    limit: number = 10
  ): Promise<RecommendationResponse> {
    console.log(`🤖 [STORAGE] Gerando recomendações simples para usuário ${userId}`);

    // Sistema super simples que funciona
    return await this.getSimpleRecommendations(userId, entityTypes, limit);
  }

  private async getSimpleRecommendations(
    userId: number,
    entityTypes?: string[],
    limit: number = 10
  ): Promise<RecommendationResponse> {
    console.log(`🎯 [SIMPLE RECOMMENDATIONS] Gerando recomendações simples para usuário ${userId}`);

    const recommendations = [];

    try {
      // 1. Buscar benefícios ativos (simples e direto)
      const beneficiosAtivos = await db
        .select({
          id: beneficios.id,
          titulo: beneficios.titulo,
          categoria: beneficios.categoria,
        })
        .from(beneficios)
        .where(eq(beneficios.ativo, true))
        .limit(3);

      beneficiosAtivos.forEach(beneficio => {
        recommendations.push({
          entityType: 'beneficio' as const,
          entityId: beneficio.id.toString(),
          title: beneficio.titulo,
          category: beneficio.categoria || 'geral',
          tags: [beneficio.categoria || 'geral', 'beneficio'],
          score: 0.7,
          reason: 'Benefício disponível',
          metadata: { source: 'simple_active' },
        });
      });

      // 2. Buscar histórias ativas
      const historiasAtivas = await db
        .select({
          id: historiasInspiradoras.id,
          titulo: historiasInspiradoras.titulo,
          nome: historiasInspiradoras.nome,
        })
        .from(historiasInspiradoras)
        .where(eq(historiasInspiradoras.ativo, true))
        .limit(2);

      historiasAtivas.forEach(historia => {
        recommendations.push({
          entityType: 'historia' as const,
          entityId: historia.id.toString(),
          title: historia.titulo,
          category: 'inspiracao',
          tags: ['historia', 'inspiracao'],
          score: 0.6,
          reason: 'História inspiradora',
          metadata: { source: 'simple_active', autor: historia.nome },
        });
      });

      console.log(`✅ [SIMPLE RECOMMENDATIONS] ${recommendations.length} recomendações geradas com sucesso`);

    } catch (error) {
      console.error('❌ [SIMPLE RECOMMENDATIONS] Erro:', error);

      // Fallback com dados fixos que sempre funcionam
      recommendations.push({
        entityType: 'beneficio' as const,
        entityId: '1',
        title: 'Explore nossos benefícios',
        category: 'geral',
        tags: ['beneficio', 'geral'],
        score: 0.5,
        reason: 'Recomendação padrão',
        metadata: { source: 'hardcoded_fallback' },
      });
    }

    return {
      recommendations: recommendations.slice(0, limit),
      userProfile: {
        topCategories: ['geral', 'inspiracao'],
        topTags: ['beneficio', 'historia'],
        totalInteractions: 0,
        lastActivity: null,
      },
      debug: {
        algorithm: 'simple_v1',
        totalCandidates: recommendations.length,
        filters: entityTypes || ['all'],
        scoringFactors: { method: 'basic_active_content' },
      },
    };
  }

  private async generatePersonalizedRecommendations(
    userId: number,
    interests: UserInterest[],
    entityTypes?: string[],
    limit: number = 10
  ): Promise<any[]> {
    const recommendations = [];

    // Agrupar interesses por categoria
    const categoriesMap = new Map<string, number>();
    const tagsMap = new Map<string, number>();

    for (const interest of interests) {
      categoriesMap.set(interest.category, (categoriesMap.get(interest.category) || 0) + parseFloat(interest.score.toString()));
      tagsMap.set(interest.tag, (tagsMap.get(interest.tag) || 0) + parseFloat(interest.score.toString()));
    }

    // Buscar conteúdo baseado nos interesses do usuário
    const topCategories = Array.from(categoriesMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([category]) => category);

    for (const category of topCategories) {
      // Buscar benefícios da categoria
      if (!entityTypes || entityTypes.includes('beneficio')) {
        const beneficiosCategory = await db
          .select({
            id: beneficios.id,
            titulo: beneficios.titulo,
            categoria: beneficios.categoria,
          })
          .from(beneficios)
          .where(
            and(
              eq(beneficios.ativo, true),
              eq(beneficios.categoria, category)
            )
          )
          .limit(3);

        for (const beneficio of beneficiosCategory) {
          const score = categoriesMap.get(category) || 0;
          recommendations.push({
            entityType: 'beneficio' as const,
            entityId: beneficio.id.toString(),
            title: beneficio.titulo,
            category: beneficio.categoria,
            tags: [beneficio.categoria],
            score,
            reason: `Baseado no seu interesse em ${category}`,
            metadata: { source: 'category_match', category },
          });
        }
      }
    }

    // Shuffle e limitar resultados
    const shuffled = recommendations.sort(() => Math.random() - 0.5);
    return shuffled.slice(0, limit);
  }

  async getUserActivityProfile(userId: number): Promise<{
    totalInteractions: number;
    topCategories: Array<{ category: string; score: number }>;
    topTags: Array<{ tag: string; score: number }>;
    lastActivity: string | null;
    recentEvents: ActivityEvent[];
  }> {
    try {
      // Buscar eventos recentes
      const recentEvents = await db
        .select()
        .from(activityEvents)
        .where(eq(activityEvents.userId, userId))
        .orderBy(desc(activityEvents.createdAt))
        .limit(50);

      // Buscar interesses
      const interests = await this.getUserInterests(userId);

      // Agrupar por categoria e tag
      const categoriesMap = new Map<string, number>();
      const tagsMap = new Map<string, number>();

      for (const interest of interests) {
        categoriesMap.set(interest.category, parseFloat(interest.score.toString()));
        tagsMap.set(interest.tag, parseFloat(interest.score.toString()));
      }

      const topCategories = Array.from(categoriesMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([category, score]) => ({ category, score }));

      const topTags = Array.from(tagsMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([tag, score]) => ({ tag, score }));

      return {
        totalInteractions: recentEvents.length,
        topCategories,
        topTags,
        lastActivity: recentEvents.length > 0 ? recentEvents[0].createdAt.toISOString() : null,
        recentEvents: recentEvents.slice(0, 10),
      };
    } catch (error) {
      console.error('❌ [ACTIVITY] Erro ao buscar perfil de atividade:', error);
      return {
        totalInteractions: 0,
        topCategories: [],
        topTags: [],
        lastActivity: null,
        recentEvents: [],
      };
    }
  }

  async cleanupOldActivityEvents(daysCutoff: number = 90): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysCutoff);

      const result = await db
        .delete(activityEvents)
        .where(sql`${activityEvents.createdAt} < ${cutoffDate}`);

      console.log(`🧹 [ACTIVITY] Removidos eventos antigos: ${result.rowCount} registros`);
      return result.rowCount || 0;
    } catch (error) {
      console.error('❌ [ACTIVITY] Erro ao limpar eventos antigos:', error);
      return 0;
    }
  }

  // ===== IMPLEMENTAÇÕES SISTEMA PEC =====

  // Projetos
  async getAllProjects(): Promise<Project[]> {
    return db.select().from(projects).orderBy(desc(projects.created_at));
  }

  async getProject(id: number): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    return project || undefined;
  }

  async createProject(data: InsertProject): Promise<Project> {
    const [project] = await db.insert(projects).values(data).returning();
    return project;
  }

  async updateProject(id: number, data: Partial<InsertProject>): Promise<Project> {
    const [project] = await db
      .update(projects)
      .set({ ...data, updated_at: new Date() })
      .where(eq(projects.id, id))
      .returning();
    return project;
  }

  async deleteProject(id: number): Promise<void> {
    await db.delete(projects).where(eq(projects.id, id));
  }

  // Atividades
  async getActivitiesByProject(projectId: number): Promise<Activity[]> {
    return db.select().from(pecActivities)
      .where(eq(pecActivities.project_id, projectId))
      .orderBy(desc(pecActivities.created_at));
  }

  async getActivity(id: number): Promise<Activity | undefined> {
    const [activity] = await db.select().from(pecActivities).where(eq(pecActivities.id, id));
    return activity || undefined;
  }

  async createActivity(data: InsertActivity): Promise<Activity> {
    const [activity] = await db.insert(pecActivities).values(data).returning();
    return activity;
  }

  async updateActivity(id: number, data: Partial<InsertActivity>): Promise<Activity> {
    const [activity] = await db
      .update(pecActivities)
      .set({ ...data, updated_at: new Date() })
      .where(eq(pecActivities.id, id))
      .returning();
    return activity;
  }

  async deleteActivity(id: number): Promise<void> {
    await db.delete(pecActivities).where(eq(pecActivities.id, id));
  }

  // Instâncias de atividades (turmas)
  async getAllActivityInstances(): Promise<ActivityInstance[]> {
    return db.select().from(activityInstances)
      .orderBy(desc(activityInstances.created_at));
  }

  async getActivityInstancesByActivity(activityId: number): Promise<ActivityInstance[]> {
    return db.select().from(activityInstances)
      .where(eq(activityInstances.activity_id, activityId))
      .orderBy(desc(activityInstances.created_at));
  }

  async getActivityInstance(id: number): Promise<ActivityInstance | undefined> {
    const [instance] = await db.select().from(activityInstances).where(eq(activityInstances.id, id));
    return instance || undefined;
  }

  async createActivityInstance(data: InsertActivityInstance): Promise<ActivityInstance> {
    const [instance] = await db.insert(activityInstances).values(data).returning();
    return instance;
  }

  async updateActivityInstance(id: number, data: Partial<InsertActivityInstance>): Promise<ActivityInstance> {
    const [instance] = await db
      .update(activityInstances)
      .set({ ...data, updated_at: new Date() })
      .where(eq(activityInstances.id, id))
      .returning();
    return instance;
  }

  async deleteActivityInstance(id: number): Promise<void> {
    await db.delete(activityInstances).where(eq(activityInstances.id, id));
  }

  // Atribuições de equipe
  async getStaffByActivityInstance(activityInstanceId: number): Promise<StaffAssignment[]> {
    return db.select().from(staffAssignments)
      .where(eq(staffAssignments.activity_instance_id, activityInstanceId));
  }

  async createStaffAssignment(data: InsertStaffAssignment): Promise<StaffAssignment> {
    const [assignment] = await db.insert(staffAssignments).values(data).returning();
    return assignment;
  }

  async updateStaffAssignment(id: number, data: Partial<InsertStaffAssignment>): Promise<StaffAssignment> {
    const [assignment] = await db
      .update(staffAssignments)
      .set(data)
      .where(eq(staffAssignments.id, id))
      .returning();
    return assignment;
  }

  async deleteStaffAssignment(id: number): Promise<void> {
    await db.delete(staffAssignments).where(eq(staffAssignments.id, id));
  }

  // Inscrições
  async getEnrollmentsByActivityInstance(activityInstanceId: number): Promise<Enrollment[]> {
    return db.select().from(enrollments)
      .where(eq(enrollments.activity_instance_id, activityInstanceId))
      .orderBy(desc(enrollments.enrollment_date));
  }

  async getEnrollment(id: number): Promise<Enrollment | undefined> {
    const [enrollment] = await db.select().from(enrollments).where(eq(enrollments.id, id));
    return enrollment || undefined;
  }

  async createEnrollment(data: InsertEnrollment): Promise<Enrollment> {
    const [enrollment] = await db.insert(enrollments).values(data).returning();
    return enrollment;
  }

  async updateEnrollment(id: number, data: Partial<InsertEnrollment>): Promise<Enrollment> {
    const [enrollment] = await db
      .update(enrollments)
      .set(data)
      .where(eq(enrollments.id, id))
      .returning();
    return enrollment;
  }

  async deleteEnrollment(id: number): Promise<void> {
    await db.delete(enrollments).where(eq(enrollments.id, id));
  }

  // Sessões
  async getSessionsByActivityInstance(activityInstanceId: number): Promise<Session[]> {
    return db.select().from(sessions)
      .where(eq(sessions.activity_instance_id, activityInstanceId))
      .orderBy(desc(sessions.date));
  }

  async getSession(id: number): Promise<Session | undefined> {
    const [session] = await db.select().from(sessions).where(eq(sessions.id, id));
    return session || undefined;
  }

  async createSession(data: InsertSession): Promise<Session> {
    const [session] = await db.insert(sessions).values(data).returning();
    return session;
  }

  async updateSession(id: number, data: Partial<InsertSession>): Promise<Session> {
    const [session] = await db
      .update(sessions)
      .set(data)
      .where(eq(sessions.id, id))
      .returning();
    return session;
  }

  async deleteSession(id: number): Promise<void> {
    await db.delete(sessions).where(eq(sessions.id, id));
  }

  // Presenças
  async getAttendancesBySession(sessionId: number): Promise<Attendance[]> {
    return db.select().from(attendance).where(eq(attendance.session_id, sessionId));
  }

  async getAttendancesByEnrollment(enrollmentId: number): Promise<Attendance[]> {
    return db.select().from(attendance).where(eq(attendance.enrollment_id, enrollmentId));
  }

  async createAttendance(data: InsertAttendance): Promise<Attendance> {
    const [attendanceRecord] = await db.insert(attendance).values(data).returning();
    return attendanceRecord;
  }

  async updateAttendance(id: number, data: Partial<InsertAttendance>): Promise<Attendance> {
    const [attendanceRecord] = await db
      .update(attendance)
      .set(data)
      .where(eq(attendance.id, id))
      .returning();
    return attendanceRecord;
  }

  async deleteAttendance(id: number): Promise<void> {
    await db.delete(attendance).where(eq(attendance.id, id));
  }

  // Fotos
  async getPhotosByActivityInstance(activityInstanceId: number): Promise<Photo[]> {
    return db.select().from(photos)
      .where(eq(photos.activity_instance_id, activityInstanceId))
      .orderBy(desc(photos.date));
  }

  async getPhotosBySession(sessionId: number): Promise<Photo[]> {
    return db.select().from(photos).where(eq(photos.session_id, sessionId));
  }

  async createPhoto(data: InsertPhoto): Promise<Photo> {
    const [photo] = await db.insert(photos).values(data).returning();
    return photo;
  }

  async updatePhoto(id: number, data: Partial<InsertPhoto>): Promise<Photo> {
    const [photo] = await db
      .update(photos)
      .set(data)
      .where(eq(photos.id, id))
      .returning();
    return photo;
  }

  async deletePhoto(id: number): Promise<void> {
    await db.delete(photos).where(eq(photos.id, id));
  }

  // Relatórios e cálculos PEC
  async getPecReportData(activityInstanceId: number, month?: number, year?: number): Promise<{
    projeto: Project;
    atividade: Activity;
    turma: ActivityInstance;
    cargaHorariaMes: number;
    atendidosMes: number;
    frequenciaMedia: number;
    totalInscritos: number;
    sessoes: Session[];
    inscritos: Array<Enrollment & { pessoa: User }>;
  }> {
    // Buscar dados básicos da turma
    const turma = await this.getActivityInstance(activityInstanceId);
    if (!turma) {
      throw new Error(`Turma com ID ${activityInstanceId} não encontrada`);
    }

    const atividade = await this.getActivity(turma.activity_id);
    if (!atividade) {
      throw new Error(`Atividade com ID ${turma.activity_id} não encontrada`);
    }

    const projeto = await this.getProject(atividade.project_id);
    if (!projeto) {
      throw new Error(`Projeto com ID ${atividade.project_id} não encontrado`);
    }

    // Buscar sessões do período
    let sessoes = await this.getSessionsByActivityInstance(activityInstanceId);

    if (month && year) {
      sessoes = sessoes.filter(session => {
        const sessionDate = new Date(session.date);
        return sessionDate.getMonth() + 1 === month && sessionDate.getFullYear() === year;
      });
    }

    // Calcular carga horária do mês
    const cargaHorariaMes = sessoes.reduce((total, session) => {
      return total + parseFloat(session.hours.toString());
    }, 0);

    // Buscar inscrições
    const inscricoes = await this.getEnrollmentsByActivityInstance(activityInstanceId);
    const totalInscritos = inscricoes.filter(i => i.active).length;

    // Buscar pessoas inscritas
    const inscritosComPessoa = await Promise.all(
      inscricoes.map(async (inscricao) => {
        const pessoa = await this.getUser(inscricao.person_id);
        return { ...inscricao, pessoa: pessoa! };
      })
    );

    // Calcular atendidos do mês (pessoas que tiveram presença)
    const attendancesDoMes = await Promise.all(
      sessoes.map(session => this.getAttendancesBySession(session.id))
    );
    const allAttendances = attendancesDoMes.flat();
    const pessoasAtendidas = new Set(
      allAttendances
        .filter(att => att.present)
        .map(att => att.enrollment_id)
    );
    const atendidosMes = pessoasAtendidas.size;

    // Calcular frequência média
    const totalPresencas = allAttendances.filter(att => att.present).length;
    const totalPossibilidades = sessoes.length * totalInscritos;
    const frequenciaMedia = totalPossibilidades > 0 ? (totalPresencas / totalPossibilidades) * 100 : 0;

    return {
      projeto,
      atividade,
      turma,
      cargaHorariaMes,
      atendidosMes,
      frequenciaMedia,
      totalInscritos,
      sessoes,
      inscritos: inscritosComPessoa,
    };
  }

  // ===== SISTEMA DE INGRESSOS DIGITAIS =====

  async createIngresso(data: InsertIngresso): Promise<Ingresso> {
    // Gerar número sequencial automaticamente
    const proximoNumero = await this.getProximoNumeroIngresso();

    const [ingresso] = await db
      .insert(ingressos)
      .values({
        ...data,
        numero: proximoNumero,
      })
      .returning();

    return ingresso;
  }

  async getIngressosByUser(userId: number): Promise<Ingresso[]> {
    return db
      .select()
      .from(ingressos)
      .where(eq(ingressos.userId, userId))
      .orderBy(desc(ingressos.dataCompra));
  }

  async getIngressosByComprador(nomeComprador: string, telefoneComprador?: string): Promise<Ingresso[]> {
    const conditions = [eq(ingressos.nomeComprador, nomeComprador)];

    if (telefoneComprador) {
      conditions.push(eq(ingressos.telefoneComprador, telefoneComprador));
    }

    return db
      .select()
      .from(ingressos)
      .where(and(...conditions))
      .orderBy(desc(ingressos.dataCompra));
  }

  async getIngressosByCota(idCota: number): Promise<Ingresso[]> {
    return db
      .select()
      .from(ingressos)
      .where(eq(ingressos.idCotaEmpresa, idCota))
      .orderBy(desc(ingressos.dataCompra));
  }

  async getAllIngresso(): Promise<Ingresso | undefined> {
    const allIngressos = await db
      .select({
        id: ingressos.id,
        numeroIngresso: ingressos.numero,
        nomeComprador: ingressos.nomeComprador,
        telefone: ingressos.telefoneComprador,
        email: ingressos.emailComprador,
        valorPago: ingressos.valorPago,
        status: ingressos.status,
        dataCompra: ingressos.dataCompra
      })
      .from(ingressos);

    return allIngressos || undefined;
  }

  async getIngresso(id: number): Promise<Ingresso | undefined> {
    const [ingresso] = await db
      .select()
      .from(ingressos)
      .where(eq(ingressos.id, id));

    return ingresso || undefined;
  }

  async getIngressoByNumero(numero: string): Promise<Ingresso | undefined> {
    const [ingresso] = await db
      .select()
      .from(ingressos)
      .where(eq(ingressos.numero, numero));

    return ingresso || undefined;
  }

  async getIngressoBySessionId(sessionId: string): Promise<Ingresso | undefined> {
    const [ingresso] = await db
      .select()
      .from(ingressos)
      .where(eq(ingressos.stripeCheckoutSessionId, sessionId));

    return ingresso || undefined;
  }

  async getIngressosByContato(contato: string): Promise<Ingresso[]> {
    // Normalizar telefone de entrada
    const telefoneNormalizado = normalizarTelefone(contato);
    
    // Buscar por telefone normalizado OU email
    // Se contato parece ser telefone (só números após normalização), buscar por telefone
    // Caso contrário, buscar por email
    if (telefoneNormalizado.length >= 10 && telefoneNormalizado.length <= 13) {
      // É telefone - buscar normalizando ambos os lados
      return db
        .select()
        .from(ingressos)
        .where(
          sql`REGEXP_REPLACE(COALESCE(${ingressos.telefoneComprador}, ''), '[^0-9]', '', 'g') = ${telefoneNormalizado}`
        )
        .orderBy(desc(ingressos.dataCompra));
    } else {
      // É email - buscar por email exato
      return db
        .select()
        .from(ingressos)
        .where(eq(ingressos.emailComprador, contato))
        .orderBy(desc(ingressos.dataCompra));
    }
  }

  async getProximoNumeroIngresso(): Promise<string> {
    // Buscar último ingresso com número numérico válido
    // Ordenação NUMÉRICA (não texto) usando CAST
    const [ultimoIngresso] = await db
      .select({ numero: ingressos.numero })
      .from(ingressos)
      .where(sql`numero ~ '^[0-9]+$'`) // apenas números
      .orderBy(sql`CAST(${ingressos.numero} AS INTEGER) DESC`)
      .limit(1);

    // Se não existir nenhum número válido, começa do 1
    const numeroAtual = ultimoIngresso ? parseInt(ultimoIngresso.numero, 10) : 0;

    // Garante que é número válido (evita NaN)
    const proximoNumero = Number.isFinite(numeroAtual) ? numeroAtual + 1 : 1;

    // Retorna sempre formatado (ex.: "001", "002", "123")
    return proximoNumero.toString().padStart(3, "0");
  }

  async updateIngressoStatus(id: number, status: string, dataUso?: Date): Promise<Ingresso> {
    const updateData: any = { status };

    if (dataUso) {
      updateData.dataUso = dataUso;
    }

    const [ingresso] = await db
      .update(ingressos)
      .set(updateData)
      .where(eq(ingressos.id, id))
      .returning();

    return ingresso;
  }

  // ===== SISTEMA DE COTAS DE EMPRESAS =====

  async createCotaEmpresa(data: InsertCotaEmpresa): Promise<CotaEmpresa> {
    const [cota] = await db
      .insert(cotasEmpresas)
      .values(data)
      .returning();
    return cota;
  }

  async getCotasEmpresas(): Promise<CotaEmpresa[]> {
    return db
      .select()
      .from(cotasEmpresas)
      .orderBy(asc(cotasEmpresas.nomeEmpresa));
  }

  async getCotaEmpresaByNome(nomeEmpresa: string): Promise<CotaEmpresa | undefined> {
    const [cota] = await db
      .select()
      .from(cotasEmpresas)
      .where(ilike(cotasEmpresas.nomeEmpresa, nomeEmpresa));
    return cota || undefined;
  }

  async getCotaEmpresaById(id: number): Promise<CotaEmpresa | undefined> {
    const [cota] = await db
      .select()
      .from(cotasEmpresas)
      .where(eq(cotasEmpresas.id, id));
    return cota || undefined;
  }

  async validarEmpresa(nomeEmpresa: string, email?: string): Promise<{ valida: boolean; cota?: CotaEmpresa; mensagem: string }> {
    const cota = await this.getCotaEmpresaByNome(nomeEmpresa);

    if (!cota) {
      return {
        valida: false,
        mensagem: "Empresa não encontrada. Verifique o nome e tente novamente."
      };
    }

    // Validar e-mail se fornecido
    if (email && cota.email && cota.email.toLowerCase() !== email.toLowerCase()) {
      return {
        valida: false,
        mensagem: "E-mail incorreto. Verifique os dados e tente novamente."
      };
    }

    if (cota.status !== 'ativa') {
      return {
        valida: false,
        cota,
        mensagem: "A cota desta empresa não está ativa no momento."
      };
    }

    const disponivel = cota.quantidadeTotal - cota.quantidadeUsada;

    // Permitir acesso mesmo com cota esgotada para ver ingressos já gerados
    return {
      valida: true,
      cota,
      mensagem: disponivel <= 0
        ? "Cota esgotada. Você pode visualizar os convites já gerados."
        : `Empresa validada! Disponível: ${disponivel} de ${cota.quantidadeTotal} ingressos.`
    };
  }

  async consultarDisponibilidadeCota(idCota: number): Promise<{ disponivel: number; total: number; usado: number }> {
    const cota = await this.getCotaEmpresaById(idCota);

    if (!cota) {
      return { disponivel: 0, total: 0, usado: 0 };
    }

    return {
      disponivel: cota.quantidadeTotal - cota.quantidadeUsada,
      total: cota.quantidadeTotal,
      usado: cota.quantidadeUsada
    };
  }

  async usarCota(idCota: number): Promise<void> {
    await db
      .update(cotasEmpresas)
      .set({
        quantidadeUsada: sql`${cotasEmpresas.quantidadeUsada} + 1`,
        atualizadoEm: new Date()
      })
      .where(eq(cotasEmpresas.id, idCota));
  }

  async updateCotaEmpresa(id: number, data: Partial<InsertCotaEmpresa>): Promise<CotaEmpresa> {
    const [cota] = await db
      .update(cotasEmpresas)
      .set({ ...data, atualizadoEm: new Date() })
      .where(eq(cotasEmpresas.id, id))
      .returning();
    return cota;
  }

  // ===== MÓDULO EDUCADORES =====

  // Educadores
  async getAllEducadores(): Promise<Educador[]> {
    return db.select().from(educadores).orderBy(asc(educadores.nome_completo));
  }

  async getEducadoresByPrograma(programa: string): Promise<Array<Educador & { vinculo: EducadorPrograma }>> {
    const result = await db
      .select({
        // Dados do educador
        id: educadores.id,
        cpf: educadores.cpf,
        nome_completo: educadores.nome_completo,
        telefone: educadores.telefone,
        email: educadores.email,
        data_nascimento: educadores.data_nascimento,
        genero: educadores.genero,
        endereco: educadores.endereco,
        cidade: educadores.cidade,
        estado: educadores.estado,
        cep: educadores.cep,
        formacao: educadores.formacao,
        especialidades: educadores.especialidades,
        experiencia_anos: educadores.experiencia_anos,
        registro_profissional: educadores.registro_profissional,
        foto_perfil: educadores.foto_perfil,
        upload_documentos: educadores.upload_documentos,
        disponibilidade_horarios: educadores.disponibilidade_horarios,
        observacoes: educadores.observacoes,
        status: educadores.status,
        created_at: educadores.created_at,
        updated_at: educadores.updated_at,
        created_by: educadores.created_by,
        // Dados do vínculo
        vinculo: {
          id: educadorPrograma.id,
          educador_id: educadorPrograma.educador_id,
          programa: educadorPrograma.programa,
          cargo: educadorPrograma.cargo,
          data_inicio: educadorPrograma.data_inicio,
          data_fim: educadorPrograma.data_fim,
          status: educadorPrograma.status,
          observacoes: educadorPrograma.observacoes,
          created_at: educadorPrograma.created_at,
        }
      })
      .from(educadores)
      .innerJoin(educadorPrograma, eq(educadores.id, educadorPrograma.educador_id))
      .where(and(
        eq(educadorPrograma.programa, programa),
        eq(educadorPrograma.status, 'ativo')
      ))
      .orderBy(asc(educadores.nome_completo));

    return result as Array<Educador & { vinculo: EducadorPrograma }>;
  }

  async getEducadorById(id: number): Promise<Educador | undefined> {
    const [educador] = await db.select().from(educadores).where(eq(educadores.id, id));
    return educador || undefined;
  }

  async getEducadorByCpf(cpf: string): Promise<Educador | undefined> {
    const [educador] = await db.select().from(educadores).where(eq(educadores.cpf, cpf));
    return educador || undefined;
  }

  async createEducador(data: InsertEducador): Promise<Educador> {
    const [educador] = await db.insert(educadores).values(data).returning();
    return educador;
  }

  async updateEducador(id: number, data: Partial<InsertEducador>): Promise<Educador> {
    const [educador] = await db
      .update(educadores)
      .set({ ...data, updated_at: new Date() })
      .where(eq(educadores.id, id))
      .returning();
    return educador;
  }

  async deleteEducador(id: number): Promise<void> {
    await db.delete(educadores).where(eq(educadores.id, id));
  }

  // Vínculos Educador-Programa
  async createEducadorPrograma(data: InsertEducadorPrograma): Promise<EducadorPrograma> {
    const [vinculo] = await db.insert(educadorPrograma).values(data).returning();
    return vinculo;
  }

  async getEducadorProgramas(educadorId: number): Promise<EducadorPrograma[]> {
    return db.select().from(educadorPrograma).where(eq(educadorPrograma.educador_id, educadorId));
  }

  async removeEducadorPrograma(educadorId: number, programa: string): Promise<void> {
    await db
      .delete(educadorPrograma)
      .where(and(
        eq(educadorPrograma.educador_id, educadorId),
        eq(educadorPrograma.programa, programa)
      ));
  }

  // Vínculos Aluno-Programa
  async createAlunoPrograma(data: InsertAlunoPrograma): Promise<AlunoPrograma> {
    const [vinculo] = await db.insert(alunoPrograma).values(data).returning();
    return vinculo;
  }

  async getAlunosByPrograma(programa: string): Promise<Array<Aluno & { vinculo: AlunoPrograma }>> {
    // FIXME: Muitos campos não existem na tabela aluno atual - simplificar
    return [] as Array<Aluno & { vinculo: AlunoPrograma }>;
  }

  async getAlunoProgramas(alunoCpf: string): Promise<AlunoPrograma[]> {
    return db.select().from(alunoPrograma).where(eq(alunoPrograma.aluno_cpf, alunoCpf));
  }

  async removeAlunoPrograma(alunoCpf: string, programa: string): Promise<void> {
    await db
      .delete(alunoPrograma)
      .where(and(
        eq(alunoPrograma.aluno_cpf, alunoCpf),
        eq(alunoPrograma.programa, programa)
      ));
  }

  // ===== DASHBOARD MACRO DE LEILÕES =====
  async getAuctionsSummary(): Promise<{
    leiloesAtivos: number;
    leiloesAguardando: number;
    leiloesFinalizados: number;
  }> {
    try {
      const agora = new Date();

      // Contar leilões ativos (dentro do prazo de lances)
      const [leiloesAtivos] = await db
        .select({ count: sql<number>`count(*)` })
        .from(beneficios)
        .where(and(
          eq(beneficios.ativo, true),
          gt(beneficios.prazoLances, agora)
        ));

      // Contar leilões aguardando (ainda não iniciaram)
      const [leiloesAguardando] = await db
        .select({ count: sql<number>`count(*)` })
        .from(beneficios)
        .where(and(
          eq(beneficios.ativo, true),
          gt(beneficios.inicioLeilao, agora)
        ));

      // Contar leilões finalizados (prazo expirado)
      const [leiloesFinalizados] = await db
        .select({ count: sql<number>`count(*)` })
        .from(beneficios)
        .where(and(
          eq(beneficios.ativo, true),
          lt(beneficios.prazoLances, agora)
        ));

      return {
        leiloesAtivos: leiloesAtivos.count || 0,
        leiloesAguardando: leiloesAguardando.count || 0,
        leiloesFinalizados: leiloesFinalizados.count || 0,
      };
    } catch (error) {
      console.error('Erro ao buscar resumo de leilões:', error);
      return {
        leiloesAtivos: 0,
        leiloesAguardando: 0,
        leiloesFinalizados: 0,
      };
    }
  }

  async getAuctionsStats(): Promise<{
    lancesTotais: number;
    usuariosParticipando: number;
    produtoMaisDisputado: { titulo: string; totalLances: number } | null;
    mediaPontosPorLance: number;
    lancesPorLeilao: Array<{ beneficioId: number; titulo: string; totalLances: number }>;
    topUsuarios: Array<{ userId: number; nome: string; totalPontosOfertados: number }>;
  }> {
    try {
      // Total de lances
      const [lancesTotais] = await db
        .select({ count: sql<number>`count(*)` })
        .from(beneficioLances)
        .where(eq(beneficioLances.status, 'ativo'));

      // Usuários únicos participando
      const [usuariosParticipando] = await db
        .select({ count: sql<number>`count(distinct ${beneficioLances.userId})` })
        .from(beneficioLances)
        .where(eq(beneficioLances.status, 'ativo'));

      // Média de pontos por lance
      const [mediaPontos] = await db
        .select({ media: sql<number>`avg(${beneficioLances.pontosOfertados})` })
        .from(beneficioLances)
        .where(eq(beneficioLances.status, 'ativo'));

      // Produto mais disputado
      const produtoMaisDisputadoRaw = await db
        .select({
          beneficioId: beneficioLances.beneficioId,
          titulo: beneficios.titulo,
          totalLances: sql<number>`count(*)`,
        })
        .from(beneficioLances)
        .innerJoin(beneficios, eq(beneficioLances.beneficioId, beneficios.id))
        .where(eq(beneficioLances.status, 'ativo'))
        .groupBy(beneficioLances.beneficioId, beneficios.titulo)
        .orderBy(desc(sql<number>`count(*)`))
        .limit(1);

      const produtoMaisDisputado = produtoMaisDisputadoRaw[0] || null;

      // Lances por leilão
      const lancesPorLeilao = await db
        .select({
          beneficioId: beneficioLances.beneficioId,
          titulo: beneficios.titulo,
          totalLances: sql<number>`count(*)`,
        })
        .from(beneficioLances)
        .innerJoin(beneficios, eq(beneficioLances.beneficioId, beneficios.id))
        .where(eq(beneficioLances.status, 'ativo'))
        .groupBy(beneficioLances.beneficioId, beneficios.titulo)
        .orderBy(desc(sql<number>`count(*)`))
        .limit(10);

      // Top 5 usuários que mais ofertaram pontos
      const topUsuarios = await db
        .select({
          userId: beneficioLances.userId,
          nome: users.nome,
          totalPontosOfertados: sql<number>`sum(${beneficioLances.pontosOfertados})`,
        })
        .from(beneficioLances)
        .innerJoin(users, eq(beneficioLances.userId, users.id))
        .where(eq(beneficioLances.status, 'ativo'))
        .groupBy(beneficioLances.userId, users.nome)
        .orderBy(desc(sql<number>`sum(${beneficioLances.pontosOfertados})`))
        .limit(5);

      return {
        lancesTotais: lancesTotais.count || 0,
        usuariosParticipando: usuariosParticipando.count || 0,
        produtoMaisDisputado: produtoMaisDisputado ? {
          titulo: produtoMaisDisputado.titulo,
          totalLances: produtoMaisDisputado.totalLances,
        } : null,
        mediaPontosPorLance: Math.round(mediaPontos.media || 0),
        lancesPorLeilao: lancesPorLeilao.map(item => ({
          beneficioId: item.beneficioId,
          titulo: item.titulo,
          totalLances: item.totalLances,
        })),
        topUsuarios: topUsuarios.map(user => ({
          userId: user.userId,
          nome: user.nome || 'Usuário',
          totalPontosOfertados: user.totalPontosOfertados,
        })),
      };
    } catch (error) {
      console.error('Erro ao buscar estatísticas de leilões:', error);
      return {
        lancesTotais: 0,
        usuariosParticipando: 0,
        produtoMaisDisputado: null,
        mediaPontosPorLance: 0,
        lancesPorLeilao: [],
        topUsuarios: [],
      };
    }
  }

  // ===== PATROCINADORES 2026 =====
  async createPatrocinador2026(nome: string, telefone: string): Promise<User> {
    try {
      // Verificar se já existe um usuário com esse telefone
      const existingUser = await this.getUserByTelefone(telefone);

      if (existingUser) {
        // Se já existe, atualizar para patrocinador 2026
        const [updatedUser] = await db
          .update(users)
          .set({
            role: 'patrocinador',
            tipo: 'patrocinador_2026',
            fonte: 'ingresso_2026',
            nome: nome,
            ativo: true
          })
          .where(eq(users.id, existingUser.id))
          .returning();

        console.log(`✅ [PATROCINADOR 2026] Usuário existente ${existingUser.id} atualizado para patrocinador 2026`);
        return updatedUser;
      } else {
        // Criar novo usuário como patrocinador 2026
        const novoPatrocinador = {
          nome,
          telefone,
          role: 'patrocinador' as const,
          tipo: 'patrocinador_2026',
          fonte: 'ingresso_2026',
          verificado: false,
          ativo: true,
        };

        const [newUser] = await db.insert(users).values(novoPatrocinador).returning();
        console.log(`✅ [PATROCINADOR 2026] Novo patrocinador ${newUser.id} criado: ${nome} - ${telefone}`);
        return newUser;
      }
    } catch (error) {
      console.error('❌ [PATROCINADOR 2026] Erro ao criar/atualizar patrocinador:', error);
      throw error;
    }
  }

  // ===== MÓDULO INCLUSÃO PRODUTIVA - PROGRAMAS =====
  async getAllProgramas(): Promise<any[]> {
    const programas = await db.select().from(programasInclusao).orderBy(desc(programasInclusao.createdAt));
    return programas;
  }

  async getProgramaById(id: number): Promise<any | undefined> {
    const [programa] = await db.select().from(programasInclusao).where(eq(programasInclusao.id, id));
    return programa;
  }

  async createPrograma(data: any): Promise<any> {
    const [programa] = await db.insert(programasInclusao).values(data).returning();
    console.log(`✅ [PROGRAMAS] Novo programa criado: ${programa.nome}`);
    return programa;
  }

  async updatePrograma(id: number, data: any): Promise<any> {
    const [programa] = await db.update(programasInclusao)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(programasInclusao.id, id))
      .returning();
    console.log(`✅ [PROGRAMAS] Programa ${id} atualizado`);
    return programa;
  }

  async deletePrograma(id: number): Promise<void> {
    await db.delete(programasInclusao).where(eq(programasInclusao.id, id));
    console.log(`✅ [PROGRAMAS] Programa ${id} deletado (turmas e cursos filhos também foram removidos via CASCADE)`);
  }

  // ===== MÓDULO INCLUSÃO PRODUTIVA - TURMAS =====
  async getAllTurmasInclusao(): Promise<TurmaInclusao[]> {
    const turmas = await db.select().from(turmasInclusao).orderBy(desc(turmasInclusao.createdAt));
    return turmas;
  }

  async getTurmasByPrograma(programaId: number): Promise<TurmaInclusao[]> {
    const turmas = await db.select().from(turmasInclusao)
      .where(eq(turmasInclusao.programaId, programaId))
      .orderBy(desc(turmasInclusao.createdAt));
    return turmas;
  }

  async getTurmaById(id: number): Promise<TurmaInclusao | undefined> {
    const [turma] = await db.select().from(turmasInclusao).where(eq(turmasInclusao.id, id));
    return turma;
  }

  async createTurmaInclusao(data: InsertTurmaInclusao): Promise<TurmaInclusao> {
    const [turma] = await db.insert(turmasInclusao).values(data).returning();
    console.log(`✅ [TURMAS] Nova turma criada: ${turma.nome}`);
    return turma;
  }

  async updateTurmaInclusao(id: number, data: Partial<InsertTurmaInclusao>): Promise<TurmaInclusao> {
    const [turma] = await db.update(turmasInclusao)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(turmasInclusao.id, id))
      .returning();
    console.log(`✅ [TURMAS] Turma ${id} atualizada`);
    return turma;
  }

  async deleteTurmaInclusao(id: number): Promise<void> {
    await db.delete(turmasInclusao).where(eq(turmasInclusao.id, id));
    console.log(`✅ [TURMAS] Turma ${id} deletada (cursos filhos também foram removidos via CASCADE)`);
  }

  // ===== MÓDULO INCLUSÃO PRODUTIVA - CURSOS =====
  async getAllCursos(): Promise<any[]> {
    // Buscar cursos com turmas relacionadas via LEFT JOIN para evitar N+1
    const result = await db
      .select({
        curso: cursosInclusao,
        programa: programasInclusao,
        turma: turmasInclusao,
      })
      .from(cursosInclusao)
      .leftJoin(programasInclusao, eq(cursosInclusao.programaId, programasInclusao.id))
      .leftJoin(cursosTurmas, eq(cursosInclusao.id, cursosTurmas.cursoId))
      .leftJoin(turmasInclusao, eq(cursosTurmas.turmaId, turmasInclusao.id))
      .orderBy(desc(cursosInclusao.createdAt));

    // Agrupar turmas por curso
    const cursosMap = new Map<number, any>();

    for (const row of result) {
      const cursoId = row.curso.id;

      if (!cursosMap.has(cursoId)) {
        cursosMap.set(cursoId, {
          ...row.curso,
          programa: row.programa,
          turmas: []
        });
      }

      // Adicionar turma se existir
      if (row.turma) {
        cursosMap.get(cursoId)!.turmas.push(row.turma);
      }
    }

    return Array.from(cursosMap.values());
  }

  async getCursosByPrograma(programaId: number): Promise<any[]> {
    // Buscar cursos diretamente pelo programaId
    const result = await db
      .select({
        curso: cursosInclusao,
        programa: programasInclusao,
        turma: turmasInclusao,
      })
      .from(cursosInclusao)
      .leftJoin(programasInclusao, eq(cursosInclusao.programaId, programasInclusao.id))
      .leftJoin(cursosTurmas, eq(cursosInclusao.id, cursosTurmas.cursoId))
      .leftJoin(turmasInclusao, eq(cursosTurmas.turmaId, turmasInclusao.id))
      .where(eq(cursosInclusao.programaId, programaId))
      .orderBy(desc(cursosInclusao.createdAt));

    // Agrupar turmas por curso
    const cursosMap = new Map<number, any>();

    for (const row of result) {
      const cursoId = row.curso.id;

      if (!cursosMap.has(cursoId)) {
        cursosMap.set(cursoId, {
          ...row.curso,
          programa: row.programa,
          turmas: []
        });
      }

      if (row.turma) {
        cursosMap.get(cursoId)!.turmas.push(row.turma);
      }
    }

    return Array.from(cursosMap.values());
  }

  async getCursosByTurma(turmaId: number): Promise<any[]> {
    // Buscar cursos através da tabela de junção
    const result = await db
      .select({ curso: cursosInclusao })
      .from(cursosTurmas)
      .innerJoin(cursosInclusao, eq(cursosTurmas.cursoId, cursosInclusao.id))
      .where(eq(cursosTurmas.turmaId, turmaId))
      .orderBy(desc(cursosInclusao.createdAt));

    return result.map(r => r.curso);
  }

  async getCursoById(id: number): Promise<any | undefined> {
    const [curso] = await db.select().from(cursosInclusao).where(eq(cursosInclusao.id, id));
    return curso;
  }

  async createCurso(data: InsertCursoInclusao, turmaIds?: number[]): Promise<CursoInclusao> {
    const [curso] = await db.insert(cursosInclusao).values(data).returning();
    console.log(`✅ [CURSOS] Novo curso criado: ${curso.nome} (Programa ${data.programaId})`);

    // Se tiver turmas selecionadas, adicionar os relacionamentos
    if (turmaIds && turmaIds.length > 0) {
      for (const turmaId of turmaIds) {
        await db.insert(cursosTurmas).values({
          cursoId: curso.id,
          turmaId,
          dataVinculo: new Date()
        });
      }
      console.log(`✅ [CURSOS] Curso ${curso.id} vinculado a ${turmaIds.length} turma(s)`);
    }

    return curso;
  }

  async updateCurso(id: number, data: Partial<InsertCursoInclusao>): Promise<CursoInclusao> {
    const [curso] = await db.update(cursosInclusao)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(cursosInclusao.id, id))
      .returning();
    console.log(`✅ [CURSOS] Curso ${id} atualizado`);
    return curso;
  }

  async deleteCurso(id: number): Promise<void> {
    await db.delete(cursosInclusao).where(eq(cursosInclusao.id, id));
    console.log(`✅ [CURSOS] Curso ${id} deletado (relacionamentos com turmas também foram removidos)`);
  }

  // Relacionamentos Curso-Turma
  async addCursoToTurma(cursoId: number, turmaId: number): Promise<CursoTurma | null> {
    const [relacao] = await db.insert(cursosTurmas).values({
      cursoId,
      turmaId,
      dataVinculo: new Date()
    }).onConflictDoNothing({ target: [cursosTurmas.cursoId, cursosTurmas.turmaId] }).returning();

    if (relacao) {
      console.log(`✅ [CURSOS-TURMAS] Curso ${cursoId} vinculado à turma ${turmaId}`);
    }
    return relacao || null;
  }

  async removeCursoFromTurma(cursoId: number, turmaId: number): Promise<void> {
    await db.delete(cursosTurmas)
      .where(and(
        eq(cursosTurmas.cursoId, cursoId),
        eq(cursosTurmas.turmaId, turmaId)
      ));
    console.log(`✅ [CURSOS-TURMAS] Curso ${cursoId} removido da turma ${turmaId}`);
  }

  async getTurmasByCurso(cursoId: number): Promise<TurmaInclusao[]> {
    const result = await db.select({ turma: turmasInclusao })
      .from(cursosTurmas)
      .innerJoin(turmasInclusao, eq(cursosTurmas.turmaId, turmasInclusao.id))
      .where(eq(cursosTurmas.cursoId, cursoId));
    return result.map(r => r.turma);
  }

  // ===== MÓDULO INCLUSÃO PRODUTIVA - PARTICIPANTES =====
  async getAllParticipantes(): Promise<any[]> {
    // Usar LEFT JOIN para buscar turmas de forma eficiente (evitar N+1)
    const result = await db
      .select({
        participante: participantesInclusao,
        turma: turmasInclusao,
      })
      .from(participantesInclusao)
      .leftJoin(participantesTurmas, eq(participantesInclusao.id, participantesTurmas.participanteId))
      .leftJoin(turmasInclusao, eq(participantesTurmas.turmaId, turmasInclusao.id))
      .orderBy(asc(participantesInclusao.nome));

    // Agrupar turmas por participante
    const participantesMap = new Map<number, any>();

    for (const row of result) {
      const participanteId = row.participante.id;

      if (!participantesMap.has(participanteId)) {
        participantesMap.set(participanteId, {
          ...row.participante,
          turmas: []
        });
      }

      // Adicionar turma se existir
      if (row.turma) {
        participantesMap.get(participanteId)!.turmas.push(row.turma);
      }
    }

    return Array.from(participantesMap.values());
  }

  async getParticipanteById(id: number): Promise<any> {
    const result = await db
      .select({
        participante: participantesInclusao,
        turma: turmasInclusao
      })
      .from(participantesInclusao)
      .leftJoin(participantesTurmas, eq(participantesInclusao.id, participantesTurmas.participanteId))
      .leftJoin(turmasInclusao, eq(participantesTurmas.turmaId, turmasInclusao.id))
      .where(eq(participantesInclusao.id, id));

    if (result.length === 0) return undefined;

    // Agrupar turmas
    const participante = {
      ...result[0].participante,
      turmas: result.filter(r => r.turma).map(r => r.turma)
    };

    return participante;
  }

  async getParticipanteByCpf(cpf: string): Promise<ParticipanteInclusao | undefined> {
    const [participante] = await db.select().from(participantesInclusao).where(eq(participantesInclusao.cpf, cpf));
    return participante;
  }

  async createParticipante(data: InsertParticipanteInclusao, turmaIds?: number[]): Promise<ParticipanteInclusao> {
    const [participante] = await db.insert(participantesInclusao).values(data).returning();
    console.log(`✅ [PARTICIPANTES] Novo participante criado: ${participante.nome}`);

    // Se tiver turmas selecionadas, adicionar os relacionamentos
    if (turmaIds && turmaIds.length > 0) {
      for (const turmaId of turmaIds) {
        await db.insert(participantesTurmas).values({
          participanteId: participante.id,
          turmaId,
          dataInscricao: new Date(),
          status: 'ativo'
        });
      }
      console.log(`✅ [PARTICIPANTES] Participante ${participante.id} vinculado a ${turmaIds.length} turma(s)`);
    }

    return participante;
  }

  async updateParticipante(id: number, data: Partial<InsertParticipanteInclusao>): Promise<ParticipanteInclusao> {
    const [participante] = await db.update(participantesInclusao)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(participantesInclusao.id, id))
      .returning();
    console.log(`✅ [PARTICIPANTES] Participante ${id} atualizado`);
    return participante;
  }

  async deleteParticipante(id: number): Promise<void> {
    await db.delete(participantesInclusao).where(eq(participantesInclusao.id, id));
    console.log(`✅ [PARTICIPANTES] Participante ${id} deletado (relacionamentos com turmas também foram removidos)`);
  }

  // Relacionamentos Participante-Turma
  async addParticipanteToTurma(participanteId: number, turmaId: number): Promise<ParticipanteTurma> {
    const [relacao] = await db.insert(participantesTurmas).values({
      participanteId,
      turmaId,
      dataInscricao: new Date(),
      status: 'ativo'
    }).returning();
    console.log(`✅ [PARTICIPANTES-TURMAS] Participante ${participanteId} vinculado à turma ${turmaId}`);
    return relacao;
  }

  async removeParticipanteFromTurma(participanteId: number, turmaId: number): Promise<void> {
    await db.delete(participantesTurmas)
      .where(and(
        eq(participantesTurmas.participanteId, participanteId),
        eq(participantesTurmas.turmaId, turmaId)
      ));
    console.log(`✅ [PARTICIPANTES-TURMAS] Participante ${participanteId} removido da turma ${turmaId}`);
  }

  async getTurmasByParticipante(participanteId: number): Promise<TurmaInclusao[]> {
    const result = await db.select({ turma: turmasInclusao })
      .from(participantesTurmas)
      .innerJoin(turmasInclusao, eq(participantesTurmas.turmaId, turmasInclusao.id))
      .where(eq(participantesTurmas.participanteId, participanteId));
    return result.map(r => r.turma);
  }

  async getParticipantesByTurma(turmaId: number): Promise<ParticipanteInclusao[]> {
    const result = await db.select({ participante: participantesInclusao })
      .from(participantesTurmas)
      .innerJoin(participantesInclusao, eq(participantesTurmas.participanteId, participantesInclusao.id))
      .where(eq(participantesTurmas.turmaId, turmaId));
    return result.map(r => r.participante);
  }

  // ===== MÓDULO PSICOSSOCIAL =====
  async listPsicoFamilias(): Promise<any[]> {
    const familias = await db.select().from(psicoFamilias).orderBy(desc(psicoFamilias.createdAt));
    return familias;
  }

  async listPsicoCasos(): Promise<any[]> {
    const casos = await db.select().from(psicoCasos).orderBy(desc(psicoCasos.createdAt));
    return casos;
  }

  async listPsicoAtendimentos(): Promise<any[]> {
    const atendimentos = await db.select().from(psicoAtendimentos).orderBy(desc(psicoAtendimentos.dataAtendimento));
    return atendimentos;
  }

  async listPsicoPlanos(): Promise<any[]> {
    const planos = await db.select().from(psicoPlanos).orderBy(desc(psicoPlanos.createdAt));
    return planos;
  }

  async createPsicoFamilia(data: any): Promise<any> {
    const [familia] = await db.insert(psicoFamilias).values(data).returning();
    console.log(`✅ [PSICO] Família criada: ${familia.id}`);
    return familia;
  }


  // ===== SISTEMA DE MARKETING (CAMPANHAS E LINKS) =====
  async getAllMarketingCampaigns(): Promise<MarketingCampaign[]> {
    const campaigns = await db
      .select()
      .from(marketingCampaigns)
      .orderBy(desc(marketingCampaigns.createdAt));
    return campaigns.map(c => ({
      ...c,
      name: c.name,
      description: c.description || null,
      createdBy: c.ownerUserId || 0,
      isActive: c.isActive,
      createdAt: c.createdAt.toISOString(),
    })) as any;
  }

  async createMarketingCampaign(campaign: InsertMarketingCampaign): Promise<MarketingCampaign> {
    const [newCampaign] = await db
      .insert(marketingCampaigns)
      .values(campaign)
      .returning();
    return newCampaign;
  }

  async getAllMarketingLinks(): Promise<MarketingLink[]> {
    const links = await db
      .select({
        link: marketingLinks,
        campaign: marketingCampaigns,
      })
      .from(marketingLinks)
      .leftJoin(marketingCampaigns, eq(marketingLinks.campaignId, marketingCampaigns.id))
      .orderBy(desc(marketingLinks.createdAt));
    
    return links.map(({ link, campaign }) => ({
      ...link,
      targetUrl: link.metadata?.targetUrl || "/",
      campaign: campaign ? { name: campaign.name } : null,
    })) as any;
  }

  async createMarketingLink(link: InsertMarketingLink): Promise<MarketingLink> {
    const metadata = {
      targetUrl: (link as any).targetUrl || "/",
    };
    
    const [newLink] = await db
      .insert(marketingLinks)
      .values({
        ...link,
        metadata: metadata as any,
      })
      .returning();
    
    return {
      ...newLink,
      targetUrl: metadata.targetUrl,
    } as any;
  }

  async updateMarketingLink(id: number, data: Partial<InsertMarketingLink>): Promise<MarketingLink> {
    const [updated] = await db
      .update(marketingLinks)
      .set(data)
      .where(eq(marketingLinks.id, id))
      .returning();
    return updated;
  }

  async marketingLinkCodeExists(code: string): Promise<boolean> {
    const [exists] = await db
      .select({ id: marketingLinks.id })
      .from(marketingLinks)
      .where(eq(marketingLinks.code, code))
      .limit(1);
    return !!exists;
  }

}

export const storage = new DatabaseStorage();
