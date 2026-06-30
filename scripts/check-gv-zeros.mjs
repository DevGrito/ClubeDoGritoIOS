import pg from 'pg';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

const queries = [
  ['NPS PEC (scores anuais)', `SELECT programa, mes, nps_score FROM nps_scores_mensais WHERE ano=2026 AND programa='pec' ORDER BY mes NULLS FIRST LIMIT 10`],
  ['NPS PEC (respostas 2026)', `SELECT COUNT(*)::int AS cnt FROM nps_respostas nr JOIN nps_pesquisas p ON p.id=nr.pesquisa_id WHERE p.programa='pec' AND EXTRACT(YEAR FROM nr.criado_em)=2026`],
  ['NPS inclusao (scores anuais)', `SELECT nps_score FROM nps_scores_mensais WHERE ano=2026 AND programa='inclusao' AND mes IS NULL`],
  ['Favela3d registros 2026 (todos tipos)', `SELECT COUNT(*)::int AS total FROM favela3d_registros WHERE status IS DISTINCT FROM 'inativo' AND EXTRACT(YEAR FROM data)=2026`],
  ['Favela3d por tipo 2026', `SELECT tipo, COUNT(*)::int AS cnt FROM favela3d_registros WHERE status IS DISTINCT FROM 'inativo' AND EXTRACT(YEAR FROM data)=2026 GROUP BY tipo ORDER BY cnt DESC`],
  ['Favela3d registros (exc. visita)', `SELECT COUNT(*)::int AS total FROM favela3d_registros WHERE status IS DISTINCT FROM 'inativo' AND EXTRACT(YEAR FROM data)=2026 AND tipo != 'visita_domiciliar'`],
  ['Favela3d visitas', `SELECT COUNT(*)::int AS total FROM favela3d_registros WHERE status IS DISTINCT FROM 'inativo' AND EXTRACT(YEAR FROM data)=2026 AND tipo = 'visita_domiciliar'`],
  ['Favela3d por ano', `SELECT EXTRACT(YEAR FROM data)::int AS ano, COUNT(*)::int AS cnt FROM favela3d_registros WHERE status IS DISTINCT FROM 'inativo' GROUP BY 1 ORDER BY 1`],
  ['Casas mapeadas 2026', `SELECT COALESCE(SUM(casas_mapeadas),0)::int AS total FROM mapeamentos_territorio WHERE EXTRACT(YEAR FROM data)=2026`],
  ['Turmas finalizadas 2026', `SELECT COUNT(pt.id)::int AS inscritos, COUNT(CASE WHEN pt.status IN ('formado','concluido') THEN 1 END)::int AS formados FROM participantes_turmas pt JOIN turmas_inclusao ti ON ti.id=pt.turma_id WHERE ti.status IN ('finalizado','concluido','encerrado') AND ti.data_fim IS NOT NULL AND EXTRACT(YEAR FROM ti.data_fim)=2026`],
];

for (const [label, sql] of queries) {
  const r = await pool.query(sql);
  console.log(`\n${label}:`);
  console.log(JSON.stringify(r.rows, null, 2));
}

await pool.end();
