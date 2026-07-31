import { pool, runAutoMigrations } from "../server/db";

function normalizeCpfDigitsExpr(columnSql: string) {
  // Normaliza CPF para só dígitos e remove qualquer formatação.
  // Obs: é expressão SQL para usar dentro de queries.
  return `REGEXP_REPLACE(${columnSql}, '[^0-9]', '', 'g')`;
}

async function main() {
  // Garante que colunas mínimas existem (read-only nas contagens, mas pode aplicar auto-migrações).
  // Isso evita discrepâncias entre branches em dev/test.
  await runAutoMigrations();

  const alunoCount = await pool.query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM public.aluno;`
  );

  const participantesInclusaoCount = await pool.query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM public.participantes_inclusao;`
  );

  // CPFs normalizados que existem em ambos os cadastros.
  const bothCpfCount = await pool.query<{ count: string }>(
    `
    SELECT COUNT(*)::text AS count
    FROM (
      SELECT DISTINCT ${normalizeCpfDigitsExpr("a.cpf")} AS cpf_digits
      FROM public.aluno a
      WHERE ${normalizeCpfDigitsExpr("a.cpf")} ~ '^[0-9]{11}$'
    ) a_digits
    JOIN (
      SELECT DISTINCT ${normalizeCpfDigitsExpr("p.cpf")} AS cpf_digits
      FROM public.participantes_inclusao p
      WHERE p.cpf IS NOT NULL
        AND p.cpf <> ''
        AND ${normalizeCpfDigitsExpr("p.cpf")} ~ '^[0-9]{11}$'
    ) p_digits
      ON p_digits.cpf_digits = a_digits.cpf_digits;
    `
  );

  // CPFs com nomes divergentes entre PEC (aluno) e Inclusão (participantes_inclusao)
  // quando o mesmo CPF (normalizado) aparece nas duas tabelas.
  const cpfNameConflicts = await pool.query<{ count: string }>(
    `
    SELECT COUNT(*)::text AS count
    FROM (
      SELECT
        ${normalizeCpfDigitsExpr("a.cpf")} AS cpf_digits,
        MAX(a.nome_completo) AS nome_pec,
        MAX(p.nome) AS nome_inclusao
      FROM public.aluno a
      JOIN public.participantes_inclusao p
        ON ${normalizeCpfDigitsExpr("p.cpf")} = ${normalizeCpfDigitsExpr("a.cpf")}
      WHERE ${normalizeCpfDigitsExpr("a.cpf")} ~ '^[0-9]{11}$'
        AND p.cpf IS NOT NULL
        AND p.cpf <> ''
      GROUP BY ${normalizeCpfDigitsExpr("a.cpf")}
    ) t
    WHERE COALESCE(nome_pec, '') <> COALESCE(nome_inclusao, '');
    `
  );

  // Participantes de Inclusão sem CPF válido (CPF nulo/vazio ou sem 11 dígitos)
  const participantesInclusaoMissingCpf = await pool.query<{ count: string }>(
    `
    SELECT COUNT(*)::text AS count
    FROM public.participantes_inclusao p
    WHERE p.cpf IS NULL
       OR p.cpf = ''
       OR ${normalizeCpfDigitsExpr("p.cpf")} !~ '^[0-9]{11}$';
    `
  );

  // Existe uma tabela específica de Psico “comunidade” (cadastro de pessoas da comunidade)
  // Verifica quantas pessoas existem ali.
  const psicoAtendidosComunidadeCount = await pool.query<{ count: string }>(
    `
    SELECT COUNT(*)::text AS count
    FROM public.psico_atendidos_comunidade;
    `
  );

  console.log("=== Diagnóstico Unificação (DB TESTE) ===");
  console.log(`aluno: ${alunoCount.rows[0]?.count ?? "?"}`);
  console.log(`participantes_inclusao: ${participantesInclusaoCount.rows[0]?.count ?? "?"}`);
  console.log(`CPFs em ambos (PEC + Inclusão): ${bothCpfCount.rows[0]?.count ?? "?"}`);
  console.log(`Conflitos de nome por CPF: ${cpfNameConflicts.rows[0]?.count ?? "?"}`);
  console.log(
    `participantes_inclusao sem CPF válido: ${participantesInclusaoMissingCpf.rows[0]?.count ?? "?"}`
  );
  console.log(
    `psico_atendidos_comunidade: ${psicoAtendidosComunidadeCount.rows[0]?.count ?? "?"}`
  );
}

main()
  .catch((e) => {
    console.error("ERR diagnostico:", e?.message ?? e);
    process.exit(1);
  })
  .finally(async () => {
    await pool.end().catch(() => {});
  });

