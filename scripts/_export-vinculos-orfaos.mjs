import pg from 'pg';
import { writeFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, '..', 'reports');
mkdirSync(outDir, { recursive: true });

const pool = new pg.Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 5432,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
});

function csvEscape(val) {
  if (val == null) return '';
  const s = String(val);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

try {
  const { rows } = await pool.query(`
    SELECT
      pr.turma_id,
      ti.codigo AS turma_codigo,
      ti.nome AS turma_nome,
      ti.status AS turma_status,
      pr.participante_id,
      pi.nome AS participante_nome,
      pi.cpf AS participante_cpf,
      pi.status AS participante_status,
      MIN(pr.data)::text AS primeira_presenca,
      MAX(pr.data)::text AS ultima_presenca,
      COUNT(*)::int AS dias_com_chamada,
      SUM(CASE WHEN pr.presente THEN 1 ELSE 0 END)::int AS dias_presente,
      ROUND(
        100.0 * SUM(CASE WHEN pr.presente THEN 1 ELSE 0 END) / NULLIF(COUNT(*), 0),
        1
      ) AS frequencia_pct
    FROM presencas_inclusao pr
    JOIN participantes_inclusao pi ON pi.id = pr.participante_id
    JOIN turmas_inclusao ti ON ti.id = pr.turma_id
    WHERE NOT EXISTS (
      SELECT 1 FROM participantes_turmas pt
      WHERE pt.turma_id = pr.turma_id AND pt.participante_id = pr.participante_id
    )
    GROUP BY pr.turma_id, ti.codigo, ti.nome, ti.status, pr.participante_id, pi.nome, pi.cpf, pi.status
    ORDER BY ti.nome, pi.nome
  `);

  const headers = [
    'turma_id',
    'turma_codigo',
    'turma_nome',
    'turma_status',
    'participante_id',
    'participante_nome',
    'participante_cpf',
    'participante_status',
    'primeira_presenca',
    'ultima_presenca',
    'dias_com_chamada',
    'dias_presente',
    'frequencia_pct',
    'observacao',
  ];

  const lines = [
    headers.join(','),
    ...rows.map((r) =>
      [
        r.turma_id,
        r.turma_codigo,
        r.turma_nome,
        r.turma_status,
        r.participante_id,
        r.participante_nome,
        r.participante_cpf,
        r.participante_status,
        r.primeira_presenca,
        r.ultima_presenca,
        r.dias_com_chamada,
        r.dias_presente,
        r.frequencia_pct,
        'Presença registrada sem vínculo atual em participantes_turmas',
      ].map(csvEscape).join(',')
    ),
  ];

  const stamp = new Date().toISOString().slice(0, 10);
  const csvPath = join(outDir, `vinculos-orfaos-presenca-${stamp}.csv`);
  writeFileSync(csvPath, '\uFEFF' + lines.join('\r\n'), 'utf8');

  console.log(`Total: ${rows.length} vínculos`);
  console.log(`Arquivo: ${csvPath}`);

  const byTurma = new Map();
  for (const r of rows) {
    const key = r.turma_nome;
    byTurma.set(key, (byTurma.get(key) || 0) + 1);
  }
  console.log('\nPor turma:');
  [...byTurma.entries()].sort((a, b) => b[1] - a[1]).forEach(([nome, n]) => {
    console.log(`  ${n}\t${nome}`);
  });
} finally {
  await pool.end();
}
