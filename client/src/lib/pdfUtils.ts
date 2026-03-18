function formatDate(d: string | null | undefined): string {
  if (!d) return "Não informado";
  try {
    return new Date(d + "T12:00:00").toLocaleDateString("pt-BR");
  } catch {
    return d;
  }
}

export function gerarPDFListaTurma(turma: any, alunos: any[], isPec = false) {
  const horario = isPec
    ? turma.start_time && turma.end_time
      ? `${turma.start_time} - ${turma.end_time}`
      : turma.horarioInicio && turma.horarioFim
      ? `${turma.horarioInicio} - ${turma.horarioFim}`
      : "Não informado"
    : turma.horarioEntrada && turma.horarioSaida
    ? `${turma.horarioEntrada} - ${turma.horarioSaida}`
    : turma.horario || "Não informado";

  const dataInicio = isPec
    ? formatDate(turma.start_date || turma.dataInicio)
    : formatDate(turma.dataInicio);
  const dataFim = isPec
    ? formatDate(turma.end_date || turma.dataFim)
    : formatDate(turma.dataFim);

  const nome = turma.title || turma.nome || "Turma";

  const alunosAtivos = [...alunos]
    .filter(a =>
      isPec
        ? !a.evadido && a.enrollment_active !== false
        : (a.status || "ativo").toLowerCase() === "ativo"
    )
    .sort((a, b) =>
      (a.nome_completo || a.nome || a.nomeCompleto || "").localeCompare(
        b.nome_completo || b.nome || b.nomeCompleto || "",
        "pt-BR"
      )
    );

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Lista de Alunos - ${nome}</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 40px; color: #222; }
    h1 { font-size: 22px; margin-bottom: 4px; }
    .info { font-size: 13px; color: #555; margin-bottom: 3px; }
    h2 { font-size: 17px; margin-top: 30px; border-bottom: 2px solid #333; padding-bottom: 6px; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    td { padding: 9px 4px; border-bottom: 1px solid #ddd; font-size: 14px; }
    .num { color: #888; width: 36px; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <h1>${nome}</h1>
  <p class="info"><strong>Horário:</strong> ${horario}</p>
  <p class="info"><strong>Data de início:</strong> ${dataInicio}</p>
  <p class="info"><strong>Data de fim:</strong> ${dataFim}</p>
  <h2>Lista de Alunos (${alunosAtivos.length} ativos)</h2>
  <table><tbody>
    ${alunosAtivos.map((a, i) => `<tr><td class="num">${i + 1}.</td><td>${a.nome_completo || a.nome || a.nomeCompleto || "—"}</td></tr>`).join("")}
  </tbody></table>
</body>
</html>`;

  const win = window.open("", "_blank");
  if (win) {
    win.document.write(html);
    win.document.close();
    setTimeout(() => win.print(), 500);
  }
}

export async function baixarListaAlunos(turmaId: number, turma: any, isPec = false) {
  const endpoint = isPec
    ? `/api/pec/turma-alunos/${turmaId}?includeEvadidos=false`
    : `/api/turmas-inclusao/${turmaId}/participantes`;
  try {
    const resp = await fetch(endpoint, { credentials: "include" });
    if (!resp.ok) throw new Error("Erro ao buscar alunos");
    const data = await resp.json();
    gerarPDFListaTurma(turma, Array.isArray(data) ? data : [], isPec);
  } catch (e) {
    console.error("Erro ao gerar PDF:", e);
    alert("Não foi possível gerar a lista. Tente novamente.");
  }
}
