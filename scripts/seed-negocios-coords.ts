import { runAutoMigrations, pool } from "../server/db.ts";

async function ensureCoordSetorEnumValues() {
  const { rows } = await pool.query<{ enumlabel: string }>(`
    SELECT e.enumlabel
    FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'coord_setor'
  `);
  const existing = new Set(rows.map((r) => r.enumlabel));
  for (const value of ["negocios_sociais", "almoxarifado"]) {
    if (!existing.has(value)) {
      await pool.query(`ALTER TYPE coord_setor ADD VALUE '${value}'`);
      console.log(`✅ Enum coord_setor: adicionado '${value}'`);
    }
  }
}

await ensureCoordSetorEnumValues();
await runAutoMigrations();

const { rows } = await pool.query(
  `SELECT id, nome, email, setor::text AS setor, redirect_path, ativo
   FROM coordenadores
   WHERE setor::text IN ('almoxarifado', 'negocios_sociais')
   ORDER BY email`
);
console.log("Coordenadores Negócios/Almoxarifado:", rows);
await pool.end();
