/**
 * Teste Fase 3 — escrita dupla + migração CPF provisório → real
 * Uso: dotenv -e .env.test-local -- tsx scripts/test-fase3-cadastro-unificado.ts
 */
import { pool } from "../server/db";
import { storage } from "../server/storage";
import {
  getNextCpfProvisorio,
  getAtendidoGritoByCpf,
} from "../server/services/atendidosGritoSync";
import { normalizeCpfDigits } from "@shared/cpf";

const TAG = `[test-fase3 ${new Date().toISOString()}]`;

function ok(msg: string) {
  console.log(`✅ ${TAG} ${msg}`);
}

function fail(msg: string): never {
  console.error(`❌ ${TAG} ${msg}`);
  process.exit(1);
}

function assert(cond: unknown, msg: string) {
  if (!cond) fail(msg);
}

async function countGrito(cpf: string) {
  const d = normalizeCpfDigits(cpf);
  const ag = await pool.query(`SELECT * FROM atendidos_grito WHERE cpf = $1`, [d]);
  const prog = await pool.query(
    `SELECT * FROM atendidos_grito_programa WHERE cpf = $1`,
    [d]
  );
  return { ag: ag.rows[0], programas: prog.rows };
}

async function cleanup(cpfList: string[]) {
  for (const cpf of cpfList) {
    const d = normalizeCpfDigits(cpf);
    if (d.length !== 11) continue;
    await pool.query(`DELETE FROM atendidos_grito_programa WHERE cpf = $1`, [d]);
    await pool.query(`DELETE FROM atendidos_grito_observacoes WHERE cpf = $1`, [d]);
    await pool.query(`DELETE FROM atendidos_grito WHERE cpf = $1`, [d]);
    await pool.query(`DELETE FROM aluno WHERE cpf = $1`, [d]);
    await pool.query(`DELETE FROM participantes_inclusao WHERE cpf = $1`, [d]);
  }
}

async function main() {
  const dbName = (await pool.query(`SELECT current_database() AS db`)).rows[0]?.db;
  console.log(`${TAG} Banco: ${dbName}`);

  const cpfsParaLimpar: string[] = [];
  let participanteId: number | undefined;
  let cpfInclusaoProv = "";

  const cpfProvisorioRaw = await getNextCpfProvisorio();
  const cpfProvisorio = normalizeCpfDigits(cpfProvisorioRaw);
  cpfsParaLimpar.push(cpfProvisorio);
  const cpfReal = "52998224725"; // CPF válido de teste
  const nomePec = `Teste Fase3 PEC ${Date.now()}`;
  const nomeInclusao = `Teste Fase3 Inclusao ${Date.now()}`;

  try {
    // --- 1) Criar aluno PEC com CPF provisório ---
    console.log(`${TAG} 1) createAluno PEC cpf=${cpfProvisorio}`);
    const aluno = await storage.createAluno({
      cpf: cpfProvisorio,
      nome_completo: nomePec,
      data_nascimento: "2010-05-15",
      genero: "masculino",
      telefone: "11999990001",
      serie: "6º ano do Ensino Fundamental",
      escolaridade: "6º ano do Ensino Fundamental",
      instituicao_ensino: "EMEF Teste Fase3",
      bolsa_familia: "nao",
      situacao_atendimento: "ativo",
      data_entrada: "2026-01-01",
      forma_acesso: "Busca ativa",
    });
    ok(`aluno criado: ${aluno.cpf} matricula=${aluno.numero_matricula}`);

    let g = await countGrito(cpfProvisorio);
    assert(g.ag, "atendidos_grito deve existir após createAluno");
    assert(g.ag.cpf_provisorio === true, "cpf_provisorio deve ser true");
    assert(
      g.ag.escolaridade === "6º ano do Ensino Fundamental",
      `escolaridade esperada no mestre, veio: ${g.ag.escolaridade}`
    );
    assert(
      g.programas.some((p: { programa: string }) => p.programa === "pec"),
      "vínculo programa=pec ausente"
    );
    ok(`escrita dupla PEC OK — mestre cpf=${g.ag.cpf} matricula=${g.ag.numero_matricula}`);

    // --- 2) Migrar CPF provisório → real (PEC) ---
    console.log(`${TAG} 2) updateAluno CPF ${cpfProvisorio} → ${cpfReal}`);
    await cleanup([cpfReal]); // garantir CPF real livre
    const alunoAtualizado = await storage.updateAluno(cpfProvisorio, {
      cpf: cpfReal,
      nome_completo: nomePec + " Atualizado",
    });
    assert(normalizeCpfDigits(alunoAtualizado.cpf) === cpfReal, "aluno deve ter CPF real após update");

    g = await countGrito(cpfReal);
    assert(g.ag, "atendidos_grito deve existir com CPF real");
    assert(g.ag.cpf_provisorio === false, "cpf_provisorio deve ser false após regularização");
    assert(!(await getAtendidoGritoByCpf(cpfProvisorio)), "registro antigo provisório não deve permanecer no mestre");
    ok(`migração CPF PEC OK — novo cpf=${cpfReal}`);

    cpfsParaLimpar.push(cpfProvisorio, cpfReal);

    // --- 3) Criar participante Inclusão ---
    cpfInclusaoProv = normalizeCpfDigits(await getNextCpfProvisorio());
    cpfsParaLimpar.push(cpfInclusaoProv);
    console.log(`${TAG} 3) createParticipante Inclusão cpf=${cpfInclusaoProv}`);
    const participante = await storage.createParticipante({
      nome: nomeInclusao,
      cpf: cpfInclusaoProv,
      genero: "feminino",
      telefone: "11999990002",
      dataNascimento: "2005-03-20",
      serie: "Ensino Médio Completo",
      escolaridade: "Ensino Médio Completo",
      instituicaoEnsino: "EEEP Teste Fase3",
      bolsaFamilia: "sim",
      status: "ativo",
      dataEntrada: new Date("2026-02-01"),
      formaAcesso: "Busca ativa",
    } as any);
    participanteId = participante.id;
    ok(`participante criado id=${participante.id} matricula=${participante.codigoMatricula}`);

    g = await countGrito(cpfInclusaoProv);
    assert(g.ag, "atendidos_grito deve existir após createParticipante");
    assert(g.ag.cpf_provisorio === true, "cpf_provisorio inclusão deve ser true");
    assert(
      g.programas.some((p: { programa: string }) => p.programa === "inclusao"),
      "vínculo programa=inclusao ausente"
    );
    ok(`escrita dupla Inclusão OK — cpf=${g.ag.cpf}`);

    // --- 4) Matrícula global compartilhada (mesmo CPF em PEC + Inclusão) ---
    console.log(`${TAG} 4) createAluno PEC no mesmo CPF da inclusão (${cpfInclusaoProv})`);
    const matriculaInclusao = participante.codigoMatricula;
    const aluno2 = await storage.createAluno({
      cpf: cpfInclusaoProv,
      nome_completo: nomeInclusao,
      data_nascimento: "2005-03-20",
      genero: "feminino",
      telefone: "11999990002",
      serie: "Ensino Médio Completo",
      instituicao_ensino: "EEEP Teste Fase3",
      situacao_atendimento: "ativo",
      data_entrada: "2026-02-01",
      forma_acesso: "Busca ativa",
    });
    assert(
      aluno2.numero_matricula === matriculaInclusao,
      `matrícula global deve ser igual: aluno=${aluno2.numero_matricula} inclusao=${matriculaInclusao}`
    );

    const progs = (
      await pool.query(
        `SELECT programa FROM atendidos_grito_programa WHERE cpf = $1 ORDER BY programa`,
        [cpfInclusaoProv]
      )
    ).rows.map((r: { programa: string }) => r.programa);
    assert(progs.includes("pec") && progs.includes("inclusao"), `deve ter pec+inclusao, veio: ${progs.join(",")}`);
    ok(`matrícula global compartilhada OK — ${matriculaInclusao}, programas: ${progs.join(", ")}`);

    // --- 5) Inativar PEC (global permanece ativo se Inclusão ativa) ---
    console.log(`${TAG} 5) inativarAluno PEC cpf=${cpfInclusaoProv}`);
    await storage.inativarAluno(cpfInclusaoProv);
    g = await countGrito(cpfInclusaoProv);
    const pecProg = g.programas.find((p: { programa: string }) => p.programa === "pec");
    const incProg = g.programas.find((p: { programa: string }) => p.programa === "inclusao");
    assert(pecProg?.status === "inativo", `programa pec deve estar inativo, veio: ${pecProg?.status}`);
    assert(incProg?.status === "ativo", `programa inclusao deve seguir ativo, veio: ${incProg?.status}`);
    assert(g.ag.status === "ativo", `status global deve permanecer ativo, veio: ${g.ag.status}`);
    assert(pecProg?.data_egresso, "data_egresso do programa pec deve ser preenchida");
    ok("inativar PEC OK — global ativo por causa da Inclusão");

    // --- 6) Inativar Inclusão (global vira inativo) ---
    console.log(`${TAG} 6) inativarParticipante id=${participanteId}`);
    await storage.inativarParticipante(participanteId!);
    g = await countGrito(cpfInclusaoProv);
    assert(
      g.programas.find((p: { programa: string }) => p.programa === "inclusao")?.status === "inativo",
      "programa inclusao deve estar inativo"
    );
    assert(g.ag.status === "inativo", `status global deve ser inativo, veio: ${g.ag.status}`);
    ok("inativar Inclusão OK — global inativo");

    // --- 7) Reativar ambos ---
    console.log(`${TAG} 7) reativarParticipante + reativarAluno`);
    await storage.reativarParticipante(participanteId!);
    await storage.reativarAluno(cpfInclusaoProv);
    g = await countGrito(cpfInclusaoProv);
    assert(g.ag.status === "ativo", "status global deve voltar a ativo");
    assert(
      g.programas.every((p: { status: string }) => p.status === "ativo"),
      "todos os programas devem estar ativos após reativação"
    );
    ok("reativar PEC + Inclusão OK");

    console.log(`\n${TAG} TODOS OS TESTES PASSARAM\n`);
  } finally {
    console.log(`${TAG} Limpando dados de teste...`);
    for (const cpf of [...new Set(cpfsParaLimpar)]) {
      await storage.deleteAluno(cpf).catch(() => {});
    }
    if (participanteId) {
      await storage.deleteParticipante(participanteId).catch(() => {});
    }
    await cleanup([...new Set(cpfsParaLimpar)]);
    await pool.end();
  }
}

main().catch((err) => {
  console.error(TAG, err);
  process.exit(1);
});
