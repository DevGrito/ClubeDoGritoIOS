// Sistema de Consolidação de Usuários
// Garante que TODA pessoa cadastrada no sistema vira um "user" na tabela users
// Implementa proteção de acesso rigorosa baseada no tipo de usuário

import { db } from "./db";
import { users, gritosHistorico, doadores, historicoDoacao } from "@shared/schema";
import { eq, or, desc } from "drizzle-orm";
import { DatabaseStorage } from "./storage";

// Função única e consistente para normalizar telefones brasileiros
function normalizePhoneBR(phone: string): string {
  if (!phone) return '';
  
  // Remove todos os caracteres não numéricos
  const digits = phone.replace(/\D/g, '');
  
  // Se já começa com 55 (código do Brasil), remove para processar
  let cleanDigits = digits.startsWith('55') ? digits.substring(2) : digits;
  
  // Valida se tem o mínimo de dígitos necessários (DDD + número)
  if (cleanDigits.length < 10 || cleanDigits.length > 11) {
    throw new Error(`Telefone inválido: ${phone} (deve ter 10-11 dígitos após DDD)`);
  }
  
  // Para números de 10 dígitos (telefone fixo), adiciona o 9 para padronizar como celular
  if (cleanDigits.length === 10) {
    const ddd = cleanDigits.substring(0, 2);
    const numero = cleanDigits.substring(2);
    cleanDigits = `${ddd}9${numero}`; // Converte para formato celular
  }
  
  // Valida DDD brasileiro (11-99)
  const ddd = parseInt(cleanDigits.substring(0, 2));
  if (ddd < 11 || ddd > 99) {
    throw new Error(`DDD inválido: ${ddd}. Deve estar entre 11 e 99`);
  }
  
  // Retorna no formato +55 + DDD + número (sempre 14 caracteres)
  return `+55${cleanDigits}`;
}

export interface ConsolidatedUser {
  id: number;
  nome: string;
  telefone: string;
  email: string;
  tipo: string;
  papel: string;
  verificado: boolean;
  ativo: boolean;
  plano: string;
  dataCadastro: string;
  fonte: string;
  telasPermitidas: string[];
}

// Verificar se usuário já foi doador anteriormente
export async function checkIfFormerDonor(userData: {
  telefone: string;
  email?: string;
  cpf?: string;
}): Promise<{ isFormerDonor: boolean; lastDonationDate?: Date }> {
  try {
    console.log(`🔍 [FORMER DONOR CHECK] Verificando se já foi doador: ${userData.telefone}, ${userData.email}, ${userData.cpf}`);
    
    // 🛡️ NORMALIZAR TELEFONE PARA BUSCA CONSISTENTE
    const normalizedPhone = normalizePhoneBR(userData.telefone);
    
    // 1. Verificar na tabela users se já existe usuário com esses dados que tem histórico de doação
    const existingUserQuery = db.select({
      id: users.id,
      telefone: users.telefone,
      email: users.email,
      cpf: users.cpf,
      stripeCustomerId: users.stripeCustomerId,
      dataCadastro: users.dataCadastro
    }).from(users);
    
    // Construir condições OR para telefone normalizado, email e CPF
    const conditions = [eq(users.telefone, normalizedPhone)];
    if (userData.email) {
      conditions.push(eq(users.email, userData.email));
    }
    if (userData.cpf) {
      conditions.push(eq(users.cpf, userData.cpf));
    }
    
    const existingUsers = await existingUserQuery.where(or(...conditions));
    
    if (existingUsers.length === 0) {
      console.log(`❌ [FORMER DONOR CHECK] Nenhum usuário encontrado com os dados fornecidos`);
      return { isFormerDonor: false };
    }
    
    console.log(`📋 [FORMER DONOR CHECK] Encontrados ${existingUsers.length} usuário(s) com dados similares`);
    
    // 2. Para cada usuário encontrado, verificar se tem histórico de doação
    for (const user of existingUsers) {
      // Verificar na tabela doadores
      const doadorRecord = await db.select({
        id: doadores.id,
        ultimaDoacao: doadores.ultimaDoacao,
        dataDoacaoInicial: doadores.dataDoacaoInicial,
        status: doadores.status
      }).from(doadores)
      .where(eq(doadores.userId, user.id))
      .limit(1);
      
      if (doadorRecord.length > 0) {
        const doacao = doadorRecord[0];
        const lastDonationDate = doacao.ultimaDoacao || doacao.dataDoacaoInicial;
        
        console.log(`✅ [FORMER DONOR CHECK] Ex-doador confirmado! Usuário ${user.id}, última doação: ${lastDonationDate}`);
        return { 
          isFormerDonor: true, 
          lastDonationDate: lastDonationDate || undefined 
        };
      }
      
      // Verificar na tabela histórico_doacao como fallback
      const historicoRecord = await db.select({
        processedAt: historicoDoacao.processedAt,
        status: historicoDoacao.status
      }).from(historicoDoacao)
      .innerJoin(doadores, eq(historicoDoacao.doadorId, doadores.id))
      .where(eq(doadores.userId, user.id))
      .orderBy(desc(historicoDoacao.processedAt))
      .limit(1);
      
      if (historicoRecord.length > 0 && historicoRecord[0].status === 'succeeded') {
        console.log(`✅ [FORMER DONOR CHECK] Ex-doador confirmado via histórico! Usuário ${user.id}`);
        return { 
          isFormerDonor: true, 
          lastDonationDate: historicoRecord[0].processedAt || undefined 
        };
      }
    }
    
    console.log(`❌ [FORMER DONOR CHECK] Usuário(s) encontrado(s) mas sem histórico de doação`);
    return { isFormerDonor: false };
    
  } catch (error) {
    console.error('❌ [FORMER DONOR CHECK] Erro ao verificar ex-doador:', error);
    // Em caso de erro, assumir que não é ex-doador para não quebrar o fluxo
    return { isFormerDonor: false };
  }
}

// Consolidar usuário: garantir que qualquer pessoa vire um "user"
export async function consolidateUser(userData: {
  nome: string;
  telefone: string;
  email?: string;
  cpf?: string;
  tipo: 'doador' | 'professor' | 'aluno' | 'responsavel' | 'admin' | 'conselho' | 'desenvolvedor';
  fonte: 'doacao' | 'educacao' | 'familia' | 'admin' | 'conselho' | 'referral' | 'reativado_indicado';
  plano?: string;
}): Promise<ConsolidatedUser> {
  try {
    // 🔍 Sistema automático de detecção de ex-doadores por indicação
    let finalFonte = userData.fonte;
    
    if (userData.fonte === 'referral') {
      console.log(`🔍 [REFERRAL CHECK] Verificando se ${userData.telefone} é ex-doador que retornou por indicação...`);
      
      const formerDonorCheck = await checkIfFormerDonor({
        telefone: userData.telefone,
        email: userData.email,
        cpf: userData.cpf
      });
      
      if (formerDonorCheck.isFormerDonor) {
        finalFonte = 'reativado_indicado';
        console.log(`🎯 [EX-DOADOR REATIVADO] ${userData.nome} (${userData.telefone}) identificado como ex-doador que retornou por indicação! Última doação: ${formerDonorCheck.lastDonationDate}`);
      } else {
        console.log(`📈 [NOVO REFERRAL] ${userData.nome} (${userData.telefone}) é novo usuário chegando por indicação`);
      }
    }
    // 🛡️ CORREÇÃO CRÍTICA: Normalizar telefone antes da verificação para evitar duplicatas
    const normalizedPhone = normalizePhoneBR(userData.telefone);
    console.log(`🔍 [PHONE NORMALIZE] "${userData.telefone}" -> "${normalizedPhone}"`);
    
    // Verificar se já existe usuário com este telefone normalizado (select mínimo)
    const existingUser = await db.select({
      id: users.id,
      email: users.email,
      plano: users.plano
    }).from(users).where(eq(users.telefone, normalizedPhone)).limit(1);
    
    if (existingUser.length > 0) {
      // 🛡️ PROTEÇÃO DE DOADORES: Se o tipo sendo cadastrado é "aluno" ou "responsavel" 
      // e o usuário existente já é um doador (tem qualquer plano),
      // NÃO sobrescrever os dados do doador - apenas retornar o usuário existente sem alterar
      const isExistingDonor = existingUser[0].plano && existingUser[0].plano.length > 0;
      const isNewTypeStudent = userData.tipo === 'aluno' || userData.tipo === 'responsavel';
      
      if (isExistingDonor && isNewTypeStudent) {
        console.log(`🛡️ [PROTEÇÃO DOADOR] Telefone ${normalizedPhone} pertence a doador ativo (plano: ${existingUser[0].plano}). NÃO atualizando para tipo ${userData.tipo}.`);
        // Buscar usuário completo para retornar sem modificar
        const fullUser = await db.select().from(users).where(eq(users.id, existingUser[0].id)).limit(1);
        return formatUser(fullUser[0]);
      }
      
      // Atualizar dados se necessário (apenas se não for caso de proteção de doador)
      const updated = await db.update(users)
        .set({
          nome: userData.nome,
          email: userData.email || existingUser[0].email,
          tipo: userData.tipo,
          fonte: finalFonte,
          plano: userData.plano || existingUser[0].plano,
          verificado: true,
          ativo: true
        })
        .where(eq(users.id, existingUser[0].id))
        .returning();
      
      return formatUser(updated[0]);
    } else {
      // Criar novo usuário com telefone normalizado
      const newUser = await db.insert(users).values({
        nome: userData.nome,
        telefone: normalizedPhone, // 🛡️ USAR TELEFONE NORMALIZADO
        email: userData.email,
        cpf: userData.cpf || null, // Permitir CPF null temporariamente
        tipo: userData.tipo,
        role: userData.tipo,
        fonte: finalFonte,
        plano: userData.plano || 'eco',
        verificado: true,
        ativo: true
      }).returning();
      
      // Distribuir bônus inicial baseado no plano
      try {
        const storage = new DatabaseStorage();
        const gritosIniciais = await storage.getGritosIniciaisPorPlano(newUser[0].plano || 'eco', newUser[0].id);
        
        await db.insert(gritosHistorico).values({
          userId: newUser[0].id,
          tipo: 'bonus_inicial',
          gritosGanhos: gritosIniciais,
          descricao: `Bônus de boas-vindas ao Clube do Grito! Plano ${(newUser[0].plano || 'eco').charAt(0).toUpperCase() + (newUser[0].plano || 'eco').slice(1)} 🎉`
        });
        console.log(`✅ [GRITOS] Bônus inicial distribuído: ${gritosIniciais} gritos para usuário ${newUser[0].id} (${newUser[0].nome}) - Plano: ${newUser[0].plano || 'eco'}`);
      } catch (gritosError) {
        console.error('Erro ao distribuir bônus inicial:', gritosError);
        // Não falha a criação do usuário se houver erro nos gritos
      }
      
      return formatUser(newUser[0]);
    }
  } catch (error) {
    console.error('Erro ao consolidar usuário:', error);
    throw error;
  }
}

// Formatar usuário para resposta padronizada
function formatUser(user: any): ConsolidatedUser {
  const telasPermitidas = getPermittedScreens(user.tipo || user.role);
  
  return {
    id: user.id,
    nome: user.nome,
    telefone: user.telefone,
    email: user.email || '',
    tipo: user.tipo || user.role || 'user',
    papel: user.role || user.tipo || 'user',
    verificado: user.verificado || false,
    ativo: user.ativo || false,
    plano: user.plano || 'eco',
    dataCadastro: user.dataCadastro || user.createdAt || new Date().toISOString(),
    fonte: user.fonte || 'users',
    telasPermitidas
  };
}

// Obter telas permitidas baseado no tipo de usuário
export function getPermittedScreens(tipo: string): string[] {
  switch (tipo) {
    case 'professor':
    case 'lider':
    case 'professor_lider':
      return ['/educacao', '/professor', '/central-ajuda'];
    
    case 'aluno':
      return ['/aluno', '/central-ajuda'];
    
    case 'responsavel':
      return ['/responsavel', '/central-ajuda'];
    
    case 'conselho':
    case 'conselheiro':
      return ['/conselho', '/central-ajuda'];
    
    case 'admin':
      return ['/admin-geral', '/central-ajuda'];
    
    case 'leo':
    case 'super_admin':
      return ['/administrador', '/leo-martins', '/central-ajuda'];
    
    case 'desenvolvedor':
      return ['/dev', '/central-ajuda']; // DEV tem acesso universal via bypass
    
    case 'patrocinador':
      return ['/patrocinador-dashboard', '/central-ajuda'];
    
    case 'colaborador':
      return ['/colaborador', '/central-ajuda'];
    
    case 'doador':
    case 'user':
    default:
      // Usuários/doadores têm acesso apenas às telas de doação
      return ['/tdoador', '/welcome', '/busca', '/noticias', '/perfil', '/dados-cadastrais', '/pagamentos', '/configuracoes', '/sobre', '/change-plan', '/central-ajuda'];
  }
}

// Verificar se usuário tem acesso a uma tela específica
export function hasAccessToScreen(userType: string, screenPath: string): boolean {
  // DEV tem acesso universal
  if (userType === 'desenvolvedor') {
    return true;
  }
  
  const permittedScreens = getPermittedScreens(userType);
  return permittedScreens.includes(screenPath);
}

// Obter todos os usuários consolidados para o painel do desenvolvedor
export async function getAllConsolidatedUsers(): Promise<ConsolidatedUser[]> {
  try {
    const allUsers = await db
      .select()
      .from(users)
      .orderBy(desc(users.id)); // ou createdAt, se existir

    console.log(`[DEV] getAllConsolidatedUsers: ${allUsers.length} usuários encontrados`);

    return allUsers.map(formatUser);
  } catch (error) {
    console.error('Erro ao buscar usuários consolidados:', error);
    throw error;
  }
}