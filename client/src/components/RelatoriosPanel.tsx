import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, FileSpreadsheet, Download, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from "xlsx";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type Vertente = "pec" | "inclusao" | "psico";
type Formato = "pdf" | "xlsx";

interface RelatorioConfig {
  id: string;
  titulo: string;
  descricao: string;
  precisaTurma?: boolean;
}

const RELATORIOS: Record<Vertente, RelatorioConfig[]> = {
  pec: [
    { id: "participantes", titulo: "Lista de Participantes", descricao: "Todos os participantes cadastrados no PEC" },
    { id: "participantes-turma", titulo: "Participantes por Turma", descricao: "Lista de participantes de uma turma específica", precisaTurma: true },
    { id: "frequencia-turma", titulo: "Frequência por Turma", descricao: "Resumo de frequência de uma turma específica", precisaTurma: true },
  ],
  inclusao: [
    { id: "participantes", titulo: "Lista de Participantes", descricao: "Todos os participantes de Inclusão Produtiva" },
    { id: "participantes-turma", titulo: "Participantes por Turma", descricao: "Lista de participantes de uma turma específica", precisaTurma: true },
    { id: "frequencia-turma", titulo: "Frequência por Turma", descricao: "Resumo de frequência de uma turma específica", precisaTurma: true },
    { id: "geracao-renda", titulo: "Geração de Renda", descricao: "Empregabilidade, empreendedorismo e indicador Edital GF" },
  ],
  psico: [
    { id: "atendidos", titulo: "Lista de Atendidos", descricao: "Todos os atendidos cadastrados no Psicossocial" },
    { id: "atendimentos", titulo: "Relatório de Atendimentos", descricao: "Registros de atendimentos realizados" },
    { id: "familias", titulo: "Relatório de Famílias", descricao: "Famílias em acompanhamento psicossocial" },
  ],
};

function fmt(d: any) {
  if (!d) return "";
  try { return format(new Date(d), "dd/MM/yyyy", { locale: ptBR }); } catch { return String(d); }
}

async function gerarPDF(titulo: string, headers: string[], rows: any[][], subtitulo?: string) {
  const { default: jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");
  const doc = new jsPDF({ orientation: rows[0]?.length > 6 ? "landscape" : "portrait" });

  doc.setFontSize(16);
  doc.setTextColor(40);
  doc.text("Instituto O Grito", 14, 16);
  doc.setFontSize(13);
  doc.text(titulo, 14, 24);
  if (subtitulo) {
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(subtitulo, 14, 31);
  }
  doc.setFontSize(9);
  doc.setTextColor(130);
  doc.text(`Gerado em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`, 14, subtitulo ? 37 : 31);

  autoTable(doc, {
    head: [headers],
    body: rows,
    startY: subtitulo ? 42 : 36,
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [220, 38, 38], textColor: [255, 255, 255], fontStyle: "bold" },
    alternateRowStyles: { fillColor: [249, 249, 249] },
    margin: { left: 14, right: 14 },
  });

  const nomeArq = `${titulo.toLowerCase().replace(/\s+/g, "-")}-${format(new Date(), "yyyy-MM-dd")}.pdf`;
  doc.save(nomeArq);
}

function gerarExcel(titulo: string, headers: string[], rows: any[][], subtitulo?: string) {
  const wb = XLSX.utils.book_new();
  const aoa: any[][] = [
    ["Instituto O Grito"],
    [titulo],
    ...(subtitulo ? [[subtitulo]] : []),
    [`Gerado em ${format(new Date(), "dd/MM/yyyy HH:mm", { locale: ptBR })}`],
    [],
    headers,
    ...rows,
  ];
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws["!cols"] = headers.map(() => ({ wch: 20 }));
  XLSX.utils.book_append_sheet(wb, ws, titulo.substring(0, 31));
  const nomeArq = `${titulo.toLowerCase().replace(/\s+/g, "-")}-${format(new Date(), "yyyy-MM-dd")}.xlsx`;
  XLSX.writeFile(wb, nomeArq);
}

interface Props {
  vertente: Vertente;
  coordenadorId?: number | string;
}

export function RelatoriosPanel({ vertente, coordenadorId }: Props) {
  const [relSelecionado, setRelSelecionado] = useState<string>("");
  const [formato, setFormato] = useState<Formato>("xlsx");
  const [turmaSelecionada, setTurmaSelecionada] = useState<string>("");
  const [gerando, setGerando] = useState(false);
  const { toast } = useToast();

  const config = relSelecionado ? RELATORIOS[vertente].find((r) => r.id === relSelecionado) : null;

  const { data: turmasPec = [] } = useQuery<any[]>({
    queryKey: ["/api/pec/instances"],
    queryFn: async () => {
      const r = await fetch("/api/pec/instances", { credentials: "include" });
      return r.ok ? r.json() : [];
    },
    enabled: vertente === "pec",
  });

  const { data: turmasInclusao = [] } = useQuery<any[]>({
    queryKey: ["/api/turmas-inclusao"],
    queryFn: async () => {
      const r = await fetch("/api/turmas-inclusao", { credentials: "include" });
      return r.ok ? r.json() : [];
    },
    enabled: vertente === "inclusao",
  });

  const turmas = vertente === "pec" ? turmasPec : turmasInclusao;

  async function fetchDados(): Promise<{ headers: string[]; rows: any[][]; subtitulo?: string }> {
    if (vertente === "pec") {
      if (relSelecionado === "participantes") {
        const r = await fetch("/api/pec/instances", { credentials: "include" });
        const instances: any[] = await r.json();
        const headers = ["Participante", "CPF", "Turma", "Status", "Data Inscrição"];
        const rows: any[][] = [];
        for (const inst of instances) {
          const re = await fetch(`/api/instances/${inst.id}/enrollments`, { credentials: "include" });
          if (!re.ok) continue;
          const enrolls: any[] = await re.json();
          for (const e of enrolls) {
            rows.push([
              e.student_name || e.nome || "",
              e.student_cpf || e.cpf || "",
              inst.name || inst.nome || "",
              e.status || "ativo",
              fmt(e.enrollment_date || e.created_at),
            ]);
          }
        }
        return { headers, rows };
      }
      if (relSelecionado === "participantes-turma" && turmaSelecionada) {
        const inst = turmasPec.find((t) => String(t.id) === turmaSelecionada);
        const re = await fetch(`/api/instances/${turmaSelecionada}/enrollments`, { credentials: "include" });
        const enrolls: any[] = re.ok ? await re.json() : [];
        const headers = ["Participante", "CPF", "Status", "Data Inscrição"];
        const rows = enrolls.map((e: any) => [
          e.student_name || e.nome || "",
          e.student_cpf || e.cpf || "",
          e.status || "ativo",
          fmt(e.enrollment_date || e.created_at),
        ]);
        return { headers, rows, subtitulo: `Turma: ${inst?.name || turmaSelecionada}` };
      }
      if (relSelecionado === "frequencia-turma" && turmaSelecionada) {
        const inst = turmasPec.find((t) => String(t.id) === turmaSelecionada);
        const re = await fetch(`/api/pec/frequencia-turmas`, { credentials: "include" });
        const resp: any = re.ok ? await re.json() : {};
        const todasTurmas: any[] = resp.turmas || [];
        const dados = todasTurmas.filter((t: any) => String(t.turmaId) === turmaSelecionada);
        const headers = ["Turma", "Total Registros", "Presenças", "Frequência (%)"];
        const rows = dados.length > 0
          ? dados.map((t: any) => [t.turmaNome || "", t.totalRegistros ?? "", t.presentes ?? "", `${t.frequencia ?? 0}%`])
          : [[inst?.name || inst?.nome || turmaSelecionada, "Sem registros no período", "", ""]];
        return { headers, rows, subtitulo: `Turma: ${inst?.name || inst?.nome || turmaSelecionada}` };
      }
    }

    if (vertente === "inclusao") {
      if (relSelecionado === "participantes") {
        const r = await fetch("/api/participantes-inclusao", { credentials: "include" });
        const data: any[] = r.ok ? await r.json() : [];
        const calcIdade = (nasc: string | null | undefined): string => {
          if (!nasc) return "";
          const hoje = new Date();
          const n = new Date(nasc);
          if (isNaN(n.getTime())) return "";
          let idade = hoje.getFullYear() - n.getUTCFullYear();
          const m = hoje.getMonth() - n.getUTCMonth();
          if (m < 0 || (m === 0 && hoje.getDate() < n.getUTCDate())) idade--;
          return String(idade);
        };
        const headers = ["Nome", "CPF", "Telefone", "E-mail", "Gênero", "Raça/Etnia", "Data de Nascimento", "Idade"];
        const rows = data.map((p: any) => {
          const nasc = p.dataNascimento || p.data_nascimento || "";
          return [
            p.nome || "", p.cpf || "", p.telefone || "", p.email || "", p.genero || "", p.raca || "",
            nasc ? fmt(nasc) : "",
            calcIdade(nasc),
          ];
        });
        return { headers, rows };
      }
      if (relSelecionado === "participantes-turma" && turmaSelecionada) {
        const turma = turmasInclusao.find((t) => String(t.id) === turmaSelecionada);
        const r = await fetch(`/api/turmas-inclusao/${turmaSelecionada}/participantes`, { credentials: "include" });
        const data: any[] = r.ok ? await r.json() : [];
        const calcIdade = (nasc: string | null | undefined): string => {
          if (!nasc) return "";
          const hoje = new Date();
          const n = new Date(nasc);
          if (isNaN(n.getTime())) return "";
          let idade = hoje.getFullYear() - n.getUTCFullYear();
          const m = hoje.getMonth() - n.getUTCMonth();
          if (m < 0 || (m === 0 && hoje.getDate() < n.getUTCDate())) idade--;
          return String(idade);
        };
        const headers = ["Nome", "CPF", "Status", "Data de Nascimento", "Idade"];
        const rows = data.map((p: any) => {
          const nasc = p.dataNascimento || p.data_nascimento || "";
          return [p.nome || "", p.cpf || "", p.status || "", nasc ? fmt(nasc) : "", calcIdade(nasc)];
        });
        return { headers, rows, subtitulo: `Turma: ${turma?.nome || turma?.name || turmaSelecionada}` };
      }
      if (relSelecionado === "frequencia-turma" && turmaSelecionada) {
        const turma = turmasInclusao.find((t) => String(t.id) === turmaSelecionada);
        const r = await fetch(`/api/inclusao/frequencia-turmas`, { credentials: "include" });
        const resp: any = r.ok ? await r.json() : {};
        const todasTurmas: any[] = resp.turmas || [];
        const dados = todasTurmas.filter((t: any) => String(t.turmaId) === turmaSelecionada);
        const headers = ["Turma", "Total Registros", "Presenças", "Frequência (%)"];
        const rows = dados.length > 0
          ? dados.map((t: any) => [t.turmaNome || "", t.totalRegistros ?? "", t.presentes ?? "", `${t.frequencia ?? 0}%`])
          : [[turma?.nome || turma?.name || turmaSelecionada, "Sem registros no período", "", ""]];
        return { headers, rows, subtitulo: `Turma: ${turma?.nome || turma?.name || turmaSelecionada}` };
      }
      if (relSelecionado === "geracao-renda") {
        const r = await fetch("/api/geracoes-de-renda", { credentials: "include" });
        const data: any[] = r.ok ? await r.json() : [];
        const headers = ["Nome", "CPF", "Tipo", "Empresa/Negócio", "Cargo/Segmento", "Faixa Salarial/Faturamento", "Edital GF?", "Status", "Evidências (arquivos)"];
        const rows = data.map((g: any) => {
          const evidencias: any[] = Array.isArray(g.evidencias) ? g.evidencias : [];
          const evidenciasStr = evidencias.length > 0
            ? evidencias.map((e: any) => e.nome_arquivo || e.nomeArquivo || "arquivo").join("; ")
            : "Sem evidência";
          return [
            g.nome || "",
            g.cpf || "",
            g.tipo === "empregabilidade" ? "Empregabilidade" : g.tipo === "empreendedorismo" ? "Empreendedorismo" : g.tipo || "",
            g.tipo === "empregabilidade" ? (g.empresa || "") : (g.nome_negocio || ""),
            g.tipo === "empregabilidade" ? (g.cargo || "") : (g.segmento || ""),
            g.tipo === "empregabilidade" ? (g.faixa_salarial || "") : (g.faturamento_aproximado || ""),
            g.padrao_gf ? "Sim" : "Não",
            g.status || "",
            evidenciasStr,
          ];
        });
        return { headers, rows };
      }
    }

    if (vertente === "psico") {
      if (relSelecionado === "atendidos") {
        const r = await fetch(`/api/psico/coordenador/atendidos-registrados${coordenadorId ? `?userId=${coordenadorId}` : ""}`, { credentials: "include" });
        const data: any = r.ok ? await r.json() : [];
        const lista: any[] = Array.isArray(data) ? data : data.atendidos || data.data || [];
        const headers = ["Nome", "CPF", "Data Nascimento", "Programa/Fonte", "Qtd Atendimentos"];
        const rows = lista.map((a: any) => [
          a.nome || a.participanteNome || "",
          a.cpf || a.participanteCpf || "",
          fmt(a.data_nascimento || a.dataNascimento),
          a.programa || a.fonte || a.vertente || "",
          a.total_atendimentos ?? a.atendimentos?.length ?? "",
        ]);
        return { headers, rows };
      }
      if (relSelecionado === "atendimentos") {
        const r = await fetch("/api/psico/coordenador/registros-confidenciais", { credentials: "include" });
        const data: any[] = r.ok ? await r.json() : [];
        const headers = ["Participante", "CPF", "Data", "Tipo", "Título", "Vertente", "Resumo"];
        const rows = data.map((a: any) => [
          a.participante_nome || a.participanteNome || "",
          a.participante_cpf || a.participanteCpf || "",
          fmt(a.data || a.created_at),
          a.tipo || "",
          a.titulo || "",
          a.vertente || "",
          (a.conteudo || "").substring(0, 200),
        ]);
        return { headers, rows };
      }
      if (relSelecionado === "familias") {
        const r = await fetch("/api/psico/familias", { credentials: "include" });
        const resp: any = r.ok ? await r.json() : {};
        const data: any[] = Array.isArray(resp) ? resp : (resp.data || []);
        const headers = ["Responsável", "Telefone", "Endereço", "Status", "Nº Membros", "Último Atendimento"];
        const rows = data.map((f: any) => [
          f.nome_responsavel || f.nomeResponsavel || "",
          f.telefone || "",
          f.endereco || "",
          f.status || "",
          f.numero_membros ?? f.numeroMembros ?? "",
          fmt(f.data_ultimo_atendimento || f.dataUltimoAtendimento),
        ]);
        return { headers, rows };
      }
    }

    return { headers: [], rows: [] };
  }

  async function gerarPdfGeracaoRenda(data: any[]) {
    const { default: jsPDF } = await import("jspdf");
    const { default: autoTable } = await import("jspdf-autotable");
    const dateFmt = format(new Date(), "dd/MM/yyyy HH:mm", { locale: ptBR });

    // Coletar todos os paths de evidências para gerar signed URLs
    const allPaths: string[] = [];
    for (const g of data) {
      for (const ev of (g.evidencias || [])) {
        if (ev.storage_url) allPaths.push(ev.storage_url);
      }
    }
    let signedUrls: Record<string, string> = {};
    if (allPaths.length > 0) {
      try {
        const signResp = await fetch("/api/geracoes-de-renda/signed-urls", {
          method: "POST", credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paths: allPaths }),
        });
        if (signResp.ok) signedUrls = (await signResp.json()).urls || {};
      } catch {}
    }

    // Montar linhas como objetos com dataKey — URL fica no objeto mas fora das colunas visíveis
    const tableRows: Record<string, string>[] = [];
    for (const g of data) {
      const evids: any[] = Array.isArray(g.evidencias) ? g.evidencias : [];
      if (evids.length === 0) {
        tableRows.push({
          nome: g.nome || "",
          cpf: g.cpf || "",
          tipo: g.tipo === "empregabilidade" ? "Empregabilidade" : "Empreendedorismo",
          empresa: g.tipo === "empregabilidade" ? (g.empresa || "") : (g.nome_negocio || ""),
          cargo: g.tipo === "empregabilidade" ? (g.cargo || "") : (g.segmento || ""),
          gf: g.padrao_gf ? "Sim" : "Não",
          status: g.status || "",
          arquivo: "Sem evidência",
          abrir: "",
          _url: "",
        });
      } else {
        for (const ev of evids) {
          const url = signedUrls[ev.storage_url] || "";
          tableRows.push({
            nome: g.nome || "",
            cpf: g.cpf || "",
            tipo: g.tipo === "empregabilidade" ? "Empregabilidade" : "Empreendedorismo",
            empresa: g.tipo === "empregabilidade" ? (g.empresa || "") : (g.nome_negocio || ""),
            cargo: g.tipo === "empregabilidade" ? (g.cargo || "") : (g.segmento || ""),
            gf: g.padrao_gf ? "Sim" : "Não",
            status: g.status || "",
            arquivo: ev.nome_arquivo || "arquivo",
            abrir: url ? "Abrir" : "",
            _url: url,
          });
        }
      }
    }

    const doc = new jsPDF({ orientation: "landscape" });

    doc.setFontSize(16); doc.setTextColor(40);
    doc.text("Instituto O Grito", 14, 16);
    doc.setFontSize(13);
    doc.text("Geração de Renda", 14, 24);
    doc.setFontSize(9); doc.setTextColor(130);
    doc.text(`Gerado em ${dateFmt} — Links de evidência válidos por 2 horas`, 14, 31);

    autoTable(doc, {
      columns: [
        { header: "Nome", dataKey: "nome" },
        { header: "CPF", dataKey: "cpf" },
        { header: "Tipo", dataKey: "tipo" },
        { header: "Empresa/Negócio", dataKey: "empresa" },
        { header: "Cargo/Segmento", dataKey: "cargo" },
        { header: "GF", dataKey: "gf" },
        { header: "Status", dataKey: "status" },
        { header: "Arquivo de Evidência", dataKey: "arquivo" },
        { header: "Abrir", dataKey: "abrir" },
      ],
      body: tableRows,
      startY: 36,
      styles: { fontSize: 7.5, cellPadding: 2, overflow: "linebreak" },
      headStyles: { fillColor: [220, 38, 38], textColor: [255, 255, 255], fontStyle: "bold" },
      alternateRowStyles: { fillColor: [249, 249, 249] },
      columnStyles: {
        0: { cellWidth: 40 },
        1: { cellWidth: 28 },
        2: { cellWidth: 26 },
        3: { cellWidth: 38 },
        4: { cellWidth: 30 },
        5: { cellWidth: 10 },
        6: { cellWidth: 18 },
        7: { cellWidth: 50 },
        8: { cellWidth: 20, textColor: [37, 99, 235], fontStyle: "bold", halign: "center" },
      },
      margin: { left: 10, right: 10 },
      didDrawCell: (cellData: any) => {
        // Coluna "abrir" (índice 8) — link clicável usando URL guardada no objeto da linha
        if (cellData.column.dataKey === "abrir" && cellData.section === "body") {
          const url: string = cellData.row.raw?._url || "";
          if (url) {
            doc.link(cellData.cell.x, cellData.cell.y, cellData.cell.width, cellData.cell.height, { url });
          }
        }
      },
    });

    const nomeArq = `geracao-renda-${format(new Date(), "yyyy-MM-dd")}.pdf`;
    doc.save(nomeArq);
  }

  async function gerarExcelGeracaoRenda(data: any[]) {
    const wb = XLSX.utils.book_new();
    const dateFmt = format(new Date(), "dd/MM/yyyy HH:mm", { locale: ptBR });

    // Sheet 1: dados principais
    const headers1 = ["Nome", "CPF", "Tipo", "Empresa/Negócio", "Cargo/Área", "Faixa Salarial/Faturamento", "Edital GF?", "Status", "Nº de Evidências"];
    const aoa1: any[][] = [
      ["Instituto O Grito"],
      ["Geração de Renda"],
      [`Gerado em ${dateFmt}`],
      [],
      headers1,
      ...data.map((g: any) => {
        const evids: any[] = Array.isArray(g.evidencias) ? g.evidencias : [];
        return [
          g.nome || "",
          g.cpf || "",
          g.tipo === "empregabilidade" ? "Empregabilidade" : g.tipo === "empreendedorismo" ? "Empreendedorismo" : (g.tipo || ""),
          g.tipo === "empregabilidade" ? (g.empresa || "") : (g.nome_negocio || g.segmento || ""),
          g.tipo === "empregabilidade" ? (g.cargo || "") : (g.segmento || ""),
          g.tipo === "empregabilidade" ? (g.faixa_salarial || "") : (g.faturamento_aproximado || ""),
          g.padrao_gf ? "Sim" : "Não",
          g.status || "",
          evids.length,
        ];
      }),
    ];
    const ws1 = XLSX.utils.aoa_to_sheet(aoa1);
    ws1["!cols"] = [{ wch: 30 }, { wch: 16 }, { wch: 18 }, { wch: 28 }, { wch: 24 }, { wch: 26 }, { wch: 10 }, { wch: 10 }, { wch: 12 }];
    XLSX.utils.book_append_sheet(wb, ws1, "Geração de Renda");

    // Coletar todos os GCS paths das evidências
    const allPaths: string[] = [];
    for (const g of data) {
      const evids: any[] = Array.isArray(g.evidencias) ? g.evidencias : [];
      for (const ev of evids) {
        if (ev.storage_url) allPaths.push(ev.storage_url);
      }
    }

    // Gerar URLs pré-assinadas (sem necessidade de login ao clicar)
    let signedUrls: Record<string, string> = {};
    if (allPaths.length > 0) {
      try {
        const signResp = await fetch("/api/geracoes-de-renda/signed-urls", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paths: allPaths }),
        });
        if (signResp.ok) {
          const { urls } = await signResp.json();
          signedUrls = urls || {};
        }
      } catch (e) {
        console.warn("Não foi possível gerar URLs assinadas, usando links diretos");
      }
    }

    // Sheet 2: evidências com links clicáveis (URLs pré-assinadas = abrem sem login)
    const headers2 = ["Nome do Participante", "CPF", "Arquivo de Evidência", "Link para Abrir/Baixar"];
    const aoa2: any[][] = [
      ["Instituto O Grito — Evidências de Geração de Renda"],
      [`Gerado em ${dateFmt} (links válidos por 2 horas)`],
      [],
      headers2,
    ];
    const evidRows: any[][] = [];
    for (const g of data) {
      const evids: any[] = Array.isArray(g.evidencias) ? g.evidencias : [];
      for (const ev of evids) {
        const signedUrl = signedUrls[ev.storage_url] || "";
        evidRows.push([g.nome || "", g.cpf || "", ev.nome_arquivo || "", signedUrl]);
      }
    }
    if (evidRows.length === 0) evidRows.push(["Nenhuma evidência encontrada", "", "", ""]);
    aoa2.push(...evidRows);

    const ws2 = XLSX.utils.aoa_to_sheet(aoa2);
    ws2["!cols"] = [{ wch: 30 }, { wch: 16 }, { wch: 40 }, { wch: 100 }];

    // Adicionar hyperlinks clicáveis nas células da coluna D
    const urlColIndex = 3;
    const dataStartRow = 4; // após as 4 linhas de cabeçalho
    evidRows.forEach((row, i) => {
      const url = row[3];
      if (url && url.startsWith("http")) {
        const cellAddr = XLSX.utils.encode_cell({ r: dataStartRow + i, c: urlColIndex });
        if (!ws2[cellAddr]) ws2[cellAddr] = { v: "Clique aqui para abrir", t: "s" };
        ws2[cellAddr].v = "Clique aqui para abrir";
        ws2[cellAddr].l = { Target: url, Tooltip: "Abrir arquivo de evidência" };
      }
    });

    XLSX.utils.book_append_sheet(wb, ws2, "Evidências");

    const nomeArq = `geracao-renda-${format(new Date(), "yyyy-MM-dd")}.xlsx`;
    XLSX.writeFile(wb, nomeArq);
  }

  async function handleGerar() {
    if (!relSelecionado) return toast({ title: "Selecione um relatório", variant: "destructive" });
    if (config?.precisaTurma && !turmaSelecionada) return toast({ title: "Selecione uma turma", variant: "destructive" });
    setGerando(true);
    try {
      // Caso especial: Geração de Renda (Excel ou PDF) → links clicáveis para evidências
      if (vertente === "inclusao" && relSelecionado === "geracao-renda") {
        const r = await fetch("/api/geracoes-de-renda", { credentials: "include" });
        const data: any[] = r.ok ? await r.json() : [];
        if (data.length === 0) {
          toast({ title: "Sem dados", description: "Nenhum registro de Geração de Renda encontrado.", variant: "destructive" });
          return;
        }
        if (formato === "xlsx") {
          await gerarExcelGeracaoRenda(data);
          toast({ title: "Relatório gerado!", description: "Arquivo Excel com aba 'Evidências' e links clicáveis para os arquivos." });
        } else {
          await gerarPdfGeracaoRenda(data);
          toast({ title: "Relatório gerado!", description: "PDF com tabela de dados e página de evidências com links." });
        }
        return;
      }

      const { headers, rows, subtitulo } = await fetchDados();
      if (rows.length === 0) {
        toast({ title: "Sem dados", description: "Nenhum registro encontrado para este relatório.", variant: "destructive" });
        return;
      }
      const titulo = RELATORIOS[vertente].find((r) => r.id === relSelecionado)?.titulo || "Relatório";
      if (formato === "pdf") {
        await gerarPDF(titulo, headers, rows, subtitulo);
      } else {
        gerarExcel(titulo, headers, rows, subtitulo);
      }
      toast({ title: "Relatório gerado!", description: `${titulo} exportado em ${formato.toUpperCase()}.` });
    } catch (e: any) {
      toast({ title: "Erro ao gerar relatório", description: e.message, variant: "destructive" });
    } finally {
      setGerando(false);
    }
  }

  const turmasNome = (t: any) =>
    vertente === "pec" ? (t.name || t.nome || `Turma ${t.id}`) : (t.nome || t.name || `Turma ${t.id}`);

  return (
    <div className="space-y-5">
      {/* Lista de relatórios */}
      <div>
        <label className="text-sm font-medium mb-2 block text-gray-700">Selecione o relatório</label>
        <div className="space-y-2">
          {RELATORIOS[vertente].map((rel) => (
            <div
              key={rel.id}
              onClick={() => { setRelSelecionado(rel.id); setTurmaSelecionada(""); }}
              className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                relSelecionado === rel.id
                  ? "border-red-400 bg-red-50"
                  : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
              }`}
            >
              <FileText className={`w-4 h-4 mt-0.5 flex-shrink-0 ${relSelecionado === rel.id ? "text-red-600" : "text-gray-400"}`} />
              <div>
                <p className={`text-sm font-medium ${relSelecionado === rel.id ? "text-red-700" : "text-gray-700"}`}>{rel.titulo}</p>
                <p className="text-xs text-gray-500">{rel.descricao}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Seletor de turma */}
      {config?.precisaTurma && (
        <div>
          <label className="text-sm font-medium mb-1 block text-gray-700">
            Selecionar turma <span className="text-red-500">*</span>
          </label>
          <Select value={turmaSelecionada} onValueChange={setTurmaSelecionada}>
            <SelectTrigger>
              <SelectValue placeholder="Escolha a turma..." />
            </SelectTrigger>
            <SelectContent>
              {turmas.map((t: any) => (
                <SelectItem key={t.id} value={String(t.id)}>
                  {turmasNome(t)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Seletor de formato */}
      {relSelecionado && (
        <div>
          <label className="text-sm font-medium mb-2 block text-gray-700">Formato de exportação</label>
          <div className="flex gap-3">
            <button
              onClick={() => setFormato("xlsx")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg border text-sm font-medium transition-all ${
                formato === "xlsx" ? "border-green-500 bg-green-50 text-green-700" : "border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              Excel (.xlsx)
            </button>
            <button
              onClick={() => setFormato("pdf")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg border text-sm font-medium transition-all ${
                formato === "pdf" ? "border-red-500 bg-red-50 text-red-700" : "border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              <FileText className="w-4 h-4" />
              PDF
            </button>
          </div>
        </div>
      )}

      {/* Botão gerar */}
      <Button
        onClick={handleGerar}
        disabled={!relSelecionado || gerando || (config?.precisaTurma && !turmaSelecionada)}
        className="w-full bg-red-600 hover:bg-red-700 text-white"
      >
        {gerando ? (
          <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Gerando...</>
        ) : (
          <><Download className="w-4 h-4 mr-2" />Gerar Relatório</>
        )}
      </Button>
    </div>
  );
}
