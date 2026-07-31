/**
 * Contabiliza HORAS-AULA reais com base nas presenças.
 *
 * Regra: para cada chamada (turma + data), horas-aula = alunos_presentes * duracao_da_aula.
 * A duração vem de horario_saida - horario_entrada da turma.
 * O total do projeto é a soma de todas as chamadas de todas as turmas.
 *
 * Uso (rodar ONDE o banco é acessível, ex: dentro do servidor/container):
 *   npx tsx scripts/horas-aula.ts                      -> todas as turmas de inclusão
 *   npx tsx scripts/horas-aula.ts "empreendedoras beleza"  -> filtra por nome/código
 */
import { pool } from "../server/db";

async function main() {
  const filtro = process.argv[2] || "";
  const like = `%${filtro.replace(/\s+/g, "%")}%`;

  const turmas = await pool.query(
    `
    SELECT ti.id, ti.nome, ti.codigo,
           ti.horario_entrada::text AS horario_entrada,
           ti.horario_saida::text   AS horario_saida,
           ti.horario,
           pi.nome AS programa
    FROM turmas_inclusao ti
    LEFT JOIN programas_inclusao pi ON pi.id = ti.programa_id
    WHERE ($1 = '' OR ti.nome ILIKE $2 OR ti.codigo ILIKE $2 OR pi.nome ILIKE $2)
    ORDER BY ti.nome
    `,
    [filtro, like]
  );

  if (turmas.rows.length === 0) {
    console.log(`Nenhuma turma encontrada para o filtro: "${filtro}"`);
    await pool.end();
    return;
  }

  const duracaoHoras = (t: any): number => {
    const parse = (v: string) => {
      const [h, m] = String(v).split(":").map(Number);
      return h * 60 + (m || 0);
    };
    if (t.horario_entrada && t.horario_saida) {
      const diff = parse(t.horario_saida) - parse(t.horario_entrada);
      if (diff > 0) return diff / 60;
    }
    if (t.horario) {
      const mm = String(t.horario).match(/(\d{1,2}):(\d{2})\s*[-–]\s*(\d{1,2}):(\d{2})/);
      if (mm) {
        const ini = +mm[1] * 60 + +mm[2];
        const fim = +mm[3] * 60 + +mm[4];
        if (fim > ini) return (fim - ini) / 60;
      }
    }
    return 0;
  };

  let totalGeral = 0;
  let totalPresencasGeral = 0;

  for (const t of turmas.rows) {
    const chamadas = await pool.query(
      `
      SELECT data::text AS data,
             COUNT(*) FILTER (WHERE presente) ::int AS presentes
      FROM presencas_inclusao
      WHERE turma_id = $1
      GROUP BY data
      ORDER BY data
      `,
      [t.id]
    );

    const dur = duracaoHoras(t);
    let presencas = 0;
    for (const c of chamadas.rows) presencas += c.presentes || 0;
    const horasAula = presencas * dur;

    totalGeral += horasAula;
    totalPresencasGeral += presencas;

    console.log(`\n=== ${t.nome} (${t.codigo || "s/ código"}) ===`);
    console.log(`Programa .............. ${t.programa || "—"}`);
    console.log(`Horário ............... ${t.horario_entrada || "?"} - ${t.horario_saida || "?"}`);
    console.log(`Duração por aula ...... ${dur}h`);
    console.log(`Chamadas registradas .. ${chamadas.rows.length}`);
    console.log(`Total de presenças .... ${presencas} (soma aluno-aula)`);
    console.log(`HORAS-AULA ............ ${Math.round(horasAula * 100) / 100}h`);
  }

  console.log(`\n===============================================`);
  console.log(`TURMAS ................ ${turmas.rows.length}`);
  console.log(`PRESENÇAS TOTAIS ...... ${totalPresencasGeral}`);
  console.log(`>>> HORAS-AULA TOTAIS . ${Math.round(totalGeral * 100) / 100}h`);
  console.log(`===============================================`);

  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
