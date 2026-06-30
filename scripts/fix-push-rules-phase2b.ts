/**
 * Fase 2b: desativa gatilhos removidos, renomeia scanner, atualiza textos/URLs.
 * Uso: npx tsx scripts/fix-push-rules-phase2b.ts [--env .env] [--dry-run]
 */
import pg from "pg";
import { readFileSync, existsSync } from "fs";
import { resolvePushClickPath } from "../server/pushClickUrls.ts";

const dryRun = process.argv.includes("--dry-run");
const envFile = process.argv.includes("--env")
  ? process.argv[process.argv.indexOf("--env") + 1]
  : ".env.local-test";

if (existsSync(envFile)) {
  for (const line of readFileSync(envFile, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i < 0) continue;
    let v = t.slice(i + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'")))
      v = v.slice(1, -1);
    if (!process.env[t.slice(0, i)]) process.env[t.slice(0, i)] = v;
  }
}

const pool = new pg.Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 5433),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: false,
});

const GATILHOS_DESATIVAR = [
  "login_suspeito",
  "exclusao_solicitada",
  "presenca_catraca_registrada",
  "catraca_saida_pendente",
  "catraca_aluno_nao_identificado",
];

const TEXT_UPDATES: { gatilho: string; titulo?: string; mensagem?: string; url?: string | null }[] = [
  {
    gatilho: "scanner_aluno_sem_turma",
    titulo: "Aluno sem turma no scanner",
    mensagem: "CPF {{cpf}} não está na turma {{turma}}. Verificado às {{hora}}.",
    url: null,
  },
  {
    gatilho: "catraca_aluno_sem_turma",
    titulo: "Aluno sem turma no scanner",
    mensagem: "CPF {{cpf}} não está na turma {{turma}}. Verificado às {{hora}}.",
    url: null,
  },
  {
    gatilho: "aluno_nao_identificado",
    titulo: "Aluno não identificado",
    mensagem: "CPF {{cpf}} não foi encontrado no cadastro às {{hora}}.",
    url: null,
  },
  {
    gatilho: "aluno_chegou",
    titulo: "{{nome_aluno}} chegou",
    mensagem: "Entrada de {{nome_aluno}} confirmada às {{hora}}.",
    url: null,
  },
  {
    gatilho: "senha_alterada",
    url: null,
  },
  {
    gatilho: "manual",
    url: null,
  },
  {
    gatilho: "plano_alterado",
    url: "/tdoador",
  },
  {
    gatilho: "indicador_sem_dados",
    titulo: "Indicador sem dados",
    mensagem:
      "O indicador «{{indicador}}» está zerado no mês e no ano ({{periodo}}). Telas: {{telas}}.",
    url: null,
  },
];

async function run() {
  if (dryRun) {
    console.log("[dry-run] desativar gatilhos:", GATILHOS_DESATIVAR.join(", "));
    console.log("[dry-run] renomear catraca_aluno_sem_turma → scanner_aluno_sem_turma");
  } else {
    for (const g of GATILHOS_DESATIVAR) {
      const r = await pool.query(
        `UPDATE push_rules SET ativo = false WHERE gatilho = $1 AND ativo = true RETURNING id, nome`,
        [g]
      );
      if (r.rowCount) {
        console.log(`desativado gatilho ${g}: ${r.rows.map((x) => x.id).join(", ")}`);
      }
    }

    const rename = await pool.query(
      `UPDATE push_rules SET gatilho = 'scanner_aluno_sem_turma' WHERE gatilho = 'catraca_aluno_sem_turma' RETURNING id`
    );
    if (rename.rowCount) {
      console.log(`renomeado catraca_aluno_sem_turma → scanner_aluno_sem_turma (${rename.rowCount})`);
    }
  }

  for (const u of TEXT_UPDATES) {
    const sets: string[] = [];
    const params: unknown[] = [];
    let i = 1;
    if (u.titulo !== undefined) {
      sets.push(`titulo = $${i++}`);
      params.push(u.titulo);
    }
    if (u.mensagem !== undefined) {
      sets.push(`mensagem = $${i++}`);
      params.push(u.mensagem);
    }
    if (u.url !== undefined) {
      sets.push(`url = $${i++}`);
      params.push(u.url);
    }
    if (!sets.length) continue;
    params.push(u.gatilho);
    const sql = `UPDATE push_rules SET ${sets.join(", ")} WHERE gatilho = $${i} RETURNING id`;
    if (!dryRun) {
      const r = await pool.query(sql, params);
      if (r.rowCount) console.log(`atualizado texto/url: ${u.gatilho} (${r.rowCount} regra(s))`);
    } else {
      console.log(`[dry-run] ${sql}`, params);
    }
  }

  const { rows } = await pool.query(`
    SELECT id, gatilho, nome, url, destino_tela, destino_roles, modulo_alvo, ativo
    FROM push_rules WHERE ativo = true ORDER BY id
  `);

  let updated = 0;
  for (const rule of rows) {
    const resolved = resolvePushClickPath({
      url: rule.url,
      gatilho: rule.gatilho,
      destino_tela: rule.destino_tela,
      destino_roles: rule.destino_roles,
      modulo_alvo: rule.modulo_alvo,
    });
    const current = (rule.url || "").trim();
    if (!resolved || current === resolved) continue;
    if (!dryRun) {
      await pool.query(`UPDATE push_rules SET url = $1 WHERE id = $2`, [resolved, rule.id]);
    }
    updated++;
    console.log(`${dryRun ? "[dry-run] " : ""}url id=${rule.id} ${rule.gatilho}: ${current || "(vazia)"} → ${resolved}`);
  }

  console.log(`\nURLs re-resolvidas: ${updated}`);
  await pool.end();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
