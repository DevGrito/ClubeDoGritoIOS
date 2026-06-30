import { pool } from "../db";

export type ChamadaAuditoriaFiltros = {
  meses: string[];
  vertente: "pec" | "inclusao" | null;
};

export type ChamadaConcluidaManual = {
  id: string;
  data: string;
  turma: string;
  vertente: string;
  motivo: string | null;
  observacao: string | null;
  total_presentes: number | null;
  total_alunos: number | null;
  origem: string;
  actor: string | null;
  created_at: string | null;
};

export type ChamadaTabletFacial = {
  id: number;
  data_chamada: string;
  modo: string;
  justificativa: string | null;
  observacao: string | null;
  vertente: string;
  turma: string;
  total_presentes: number | null;
  total_alunos: number | null;
  tablet_username: string | null;
  created_at: string | null;
};

export type ChamadasAuditoriaResult = {
  concluidasManuais: ChamadaConcluidaManual[];
  tablet: ChamadaTabletFacial[];
  totais: {
    chamadasManuaisConcluidas: number;
    tabletFacial: number;
    totalGeral: number;
  };
};

function vertenteLabel(codigo: string | null): string {
  if (codigo === "pec") return "PEC";
  if (codigo === "inclusao") return "Inclusão Produtiva";
  return "Não identificada";
}

function buildMesWhere(dateCol: string, meses: string[], params: unknown[]): string | null {
  if (meses.length === 0) return null;
  const parts: string[] = [];
  for (const m of meses) {
    params.push(`${m}-01`);
    parts.push(
      `(${dateCol} >= $${params.length}::date AND ${dateCol} < ($${params.length}::date + INTERVAL '1 month'))`
    );
  }
  return `(${parts.join(" OR ")})`;
}

const EXCLUIR_TABLET_MANUAL = `
  NOT EXISTS (
    SELECT 1 FROM chamada_tablet_logs ctl_ex
    WHERE ctl_ex.turma_id = $TURMA_COL$
      AND ctl_ex.data_chamada = $DATA_COL$
      AND ctl_ex.modo = 'manual'
  )`;

export async function buscarChamadasAuditoria(
  filtros: ChamadaAuditoriaFiltros
): Promise<ChamadasAuditoriaResult> {
  const { meses, vertente } = filtros;

  // 1) Tablet — chamada manual concluída (finalizar)
  const paramsTabletManual: unknown[] = [];
  const whereTabletManual = [`modo = 'manual'`];
  const mesTbl = buildMesWhere("data_chamada", meses, paramsTabletManual);
  if (mesTbl) whereTabletManual.push(mesTbl);
  if (vertente) {
    paramsTabletManual.push(vertente);
    whereTabletManual.push(`vertente = $${paramsTabletManual.length}`);
  }

  const tabletManualRes = await pool.query(
    `SELECT id, vertente, turma_nome, data_chamada, justificativa, observacao,
            tablet_username, total_presentes, total_alunos, created_at
     FROM chamada_tablet_logs
     WHERE ${whereTabletManual.join(" AND ")}
     ORDER BY data_chamada DESC, created_at DESC`,
    paramsTabletManual
  );

  // 2) PEC — sessão gravada após ativação manual (monitor/coordenador/professor)
  let pecRows: any[] = [];
  if (vertente !== "inclusao") {
    const paramsPec: unknown[] = [];
    const wherePec = [
      `COALESCE(cml.origem, '') <> 'tablet'`,
      EXCLUIR_TABLET_MANUAL.replace(/\$TURMA_COL\$/g, "s.activity_instance_id").replace(
        /\$DATA_COL\$/g,
        "s.date"
      ),
    ];
    const mesPec = buildMesWhere("s.date", meses, paramsPec);
    if (mesPec) wherePec.push(mesPec);

    const pecRes = await pool.query(
      `SELECT DISTINCT ON (s.activity_instance_id, s.date)
        s.id,
        s.date,
        s.created_at,
        COALESCE(ai.title, 'Turma não informada no registro') AS turma_nome,
        cml.motivo,
        cml.observacao,
        cml.origem,
        cml.actor_nome,
        (
          SELECT COUNT(*)::int
          FROM jsonb_array_elements(COALESCE(s.attendance, '[]'::jsonb)) elem
          WHERE COALESCE((elem->>'presente')::boolean, (elem->>'status') = 'presente', false)
        ) AS total_presentes,
        (
          SELECT COUNT(*)::int
          FROM jsonb_array_elements(COALESCE(s.attendance, '[]'::jsonb)) elem
        ) AS total_alunos
       FROM sessions s
       INNER JOIN chamada_manual_logs cml
         ON cml.turma_id = s.activity_instance_id
         AND cml.data = s.date
       LEFT JOIN activity_instances ai ON ai.id = s.activity_instance_id
       WHERE ${wherePec.join(" AND ")}
       ORDER BY s.activity_instance_id, s.date, cml.created_at DESC`,
      paramsPec
    );
    pecRows = pecRes.rows;
  }

  // 3) Inclusão — presenças gravadas após ativação manual (staff)
  let incRows: any[] = [];
  if (vertente !== "pec") {
    const paramsInc: unknown[] = [];
    const whereInc = [
      `COALESCE(cml.origem, '') <> 'tablet'`,
      EXCLUIR_TABLET_MANUAL.replace(/\$TURMA_COL\$/g, "c.turma_id").replace(/\$DATA_COL\$/g, "c.data"),
    ];
    const mesInc = buildMesWhere("c.data", meses, paramsInc);
    if (mesInc) whereInc.push(mesInc);

    const incRes = await pool.query(
      `WITH chamadas_inc AS (
        SELECT
          pi.turma_id,
          pi.data,
          MIN(pi.created_at) AS created_at,
          COUNT(*) FILTER (WHERE pi.presente)::int AS total_presentes,
          COUNT(*)::int AS total_alunos
        FROM presencas_inclusao pi
        GROUP BY pi.turma_id, pi.data
      )
      SELECT DISTINCT ON (c.turma_id, c.data)
        c.turma_id,
        c.data,
        c.created_at,
        COALESCE(ti.nome, 'Turma não informada no registro') AS turma_nome,
        cml.motivo,
        cml.observacao,
        cml.origem,
        cml.actor_nome,
        c.total_presentes,
        c.total_alunos
      FROM chamadas_inc c
      INNER JOIN chamada_manual_logs cml
        ON cml.turma_id = c.turma_id
        AND cml.data = c.data
      INNER JOIN turmas_inclusao ti ON ti.id = c.turma_id
      WHERE ${whereInc.join(" AND ")}
      ORDER BY c.turma_id, c.data, cml.created_at DESC`,
      paramsInc
    );
    incRows = incRes.rows;
  }

  const concluidasTablet: ChamadaConcluidaManual[] = (tabletManualRes.rows as any[]).map((r) => ({
    id: `tablet-${r.id}`,
    data: r.data_chamada,
    turma: r.turma_nome || "Turma não informada no registro",
    vertente: vertenteLabel(String(r.vertente || "").toLowerCase()),
    motivo: r.justificativa || null,
    observacao: r.observacao || null,
    total_presentes: r.total_presentes ?? null,
    total_alunos: r.total_alunos ?? null,
    origem: "tablet",
    actor: r.tablet_username || null,
    created_at: r.created_at,
  }));

  const concluidasPec: ChamadaConcluidaManual[] = pecRows.map((r) => ({
    id: `pec-${r.id}`,
    data: r.date,
    turma: r.turma_nome,
    vertente: "PEC",
    motivo: r.motivo || null,
    observacao: r.observacao || null,
    total_presentes: r.total_presentes ?? null,
    total_alunos: r.total_alunos ?? null,
    origem: r.origem || "legado",
    actor: r.actor_nome || null,
    created_at: r.created_at,
  }));

  const concluidasInc: ChamadaConcluidaManual[] = incRows.map((r) => ({
    id: `inc-${r.turma_id}-${r.data}`,
    data: r.data,
    turma: r.turma_nome,
    vertente: "Inclusão Produtiva",
    motivo: r.motivo || null,
    observacao: r.observacao || null,
    total_presentes: r.total_presentes ?? null,
    total_alunos: r.total_alunos ?? null,
    origem: r.origem || "legado",
    actor: r.actor_nome || null,
    created_at: r.created_at,
  }));

  const concluidasManuais = [...concluidasTablet, ...concluidasPec, ...concluidasInc].sort((a, b) => {
    const da = String(a.data);
    const db = String(b.data);
    if (da !== db) return db.localeCompare(da);
    const ca = a.created_at ? new Date(a.created_at).getTime() : 0;
    const cb = b.created_at ? new Date(b.created_at).getTime() : 0;
    return cb - ca;
  });

  // 4) Tablet facial concluído
  const paramsTabletFacial: unknown[] = [];
  const whereTabletFacial = [`modo = 'facial'`];
  const mesFacial = buildMesWhere("data_chamada", meses, paramsTabletFacial);
  if (mesFacial) whereTabletFacial.push(mesFacial);
  if (vertente) {
    paramsTabletFacial.push(vertente);
    whereTabletFacial.push(`vertente = $${paramsTabletFacial.length}`);
  }

  const tabletFacialRes = await pool.query(
    `SELECT id, vertente, turma_nome, data_chamada, modo, justificativa, observacao,
            tablet_username, total_presentes, total_alunos, created_at
     FROM chamada_tablet_logs
     WHERE ${whereTabletFacial.join(" AND ")}
     ORDER BY data_chamada DESC, created_at DESC`,
    paramsTabletFacial
  );

  const tablet: ChamadaTabletFacial[] = (tabletFacialRes.rows as any[]).map((r) => ({
    id: r.id,
    data_chamada: r.data_chamada,
    modo: r.modo,
    justificativa: r.justificativa || null,
    observacao: r.observacao || null,
    vertente: vertenteLabel(String(r.vertente || "").toLowerCase()),
    turma: r.turma_nome || "Turma não informada no registro",
    total_presentes: r.total_presentes ?? null,
    total_alunos: r.total_alunos ?? null,
    tablet_username: r.tablet_username || null,
    created_at: r.created_at,
  }));

  return {
    concluidasManuais,
    tablet,
    totais: {
      chamadasManuaisConcluidas: concluidasManuais.length,
      tabletFacial: tablet.length,
      totalGeral: concluidasManuais.length + tablet.length,
    },
  };
}
