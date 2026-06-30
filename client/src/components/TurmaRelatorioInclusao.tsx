import logoUrl from "../app-assets/LOGO_IOG-02_1777395980729.png";

const MONTHS_PT = ['JANEIRO','FEVEREIRO','MARÇO','ABRIL','MAIO','JUNHO','JULHO','AGOSTO','SETEMBRO','OUTUBRO','NOVEMBRO','DEZEMBRO'];
const DAYS_PT   = ['Domingo','Segunda-feira','Terça-feira','Quarta-feira','Quinta-feira','Sexta-feira','Sábado'];

const DIA_FULL: Record<string, string> = {
  domingo:       'Domingo',
  segunda:       'Segunda-feira',
  'segunda-feira':'Segunda-feira',
  terca:         'Terça-feira',
  terça:         'Terça-feira',
  'terca-feira': 'Terça-feira',
  'terça-feira': 'Terça-feira',
  quarta:        'Quarta-feira',
  'quarta-feira':'Quarta-feira',
  quinta:        'Quinta-feira',
  'quinta-feira':'Quinta-feira',
  sexta:         'Sexta-feira',
  'sexta-feira': 'Sexta-feira',
  sabado:        'Sábado',
  sábado:        'Sábado',
};

function nomeDia(raw: string): string {
  const key = raw.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  // busca primeiro sem acento, depois com
  const semAcento = DIA_FULL[key];
  if (semAcento) return semAcento;
  const comAcento = DIA_FULL[raw.trim().toLowerCase()];
  if (comAcento) return comAcento;
  // fallback: capitaliza a primeira letra
  return raw.trim().charAt(0).toUpperCase() + raw.trim().slice(1).toLowerCase();
}

// ── Paleta ────────────────────────────────────────────────────────────────────
const BLACK:    [number,number,number] = [15,  15,  15 ];   // fundo header
const YELLOW:   [number,number,number] = [245, 196, 0  ];   // amarelo IOG
const BORDEAUX: [number,number,number] = [123, 21,  53 ];   // bordô (detalhes)
const WHITE:    [number,number,number] = [255, 255, 255];
const OFFWHITE: [number,number,number] = [250, 248, 243];   // fundo alternado
const LGRAY:    [number,number,number] = [240, 240, 240];   // caixas info
const MGRAY:    [number,number,number] = [110, 110, 110];   // texto muted
const DARK:     [number,number,number] = [20,  20,  20 ];   // texto escuro

export interface RelatorioDados {
  turma: {
    id: number;
    nome: string;
    descricao?: string | null;
    horario?: string | null;
    horarioEntrada?: string | null;
    horarioSaida?: string | null;
    local?: string | null;
    dataInicio?: string | null;
    dataFim?: string | null;
    diasSemana?: string[] | null;
  };
  programaNome: string;
  professorNome: string;
  aulas: Array<{
    data: string;
    total_inscritos: number;
    presentes: number;
    foto_comprovante: string | null;
    teve_alimentacao: boolean;
  }>;
  alunos: Array<{
    nome: string;
    genero: string;
    data_nascimento: string | null;
    cpf: string;
    data_inscricao: string | null;
    status: string;
    motivo_desligamento: string | null;
    data_desligamento: string | null;
  }>;
  evasao: Array<{
    nome: string;
    genero: string;
    data_nascimento: string | null;
    motivo_desligamento: string | null;
    data_desligamento: string | null;
  }>;
  alimentacao: { total: number; comAlimentacao: number };
  nps: Array<{
    id: number;
    titulo: string;
    status: string;
    total_respostas: number;
    media_nps: number | null;
  }>;
  horasPorAula: number;
  totalHoras: number;
}

function fmtBR(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  try { return new Date(dateStr + 'T12:00:00').toLocaleDateString('pt-BR'); }
  catch { return dateStr; }
}

async function toBase64(url: string): Promise<string | null> {
  try {
    const r = await fetch(url, { credentials: 'include' });
    if (!r.ok) return null;
    const blob = await r.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror  = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch { return null; }
}

// Baixa uma foto, redimensiona para no máx MAX_W×MAX_H e re-exporta como JPEG
// com qualidade QUALITY. Reduz fotos de câmera de 3–8 MB para ~100–200 KB.
const FOTO_MAX_W = 800;
const FOTO_MAX_H = 600;
const FOTO_QUALITY = 0.55;

async function toCompressedBase64(url: string): Promise<string | null> {
  try {
    const r = await fetch(url, { credentials: 'include' });
    if (!r.ok) return null;
    const blob = await r.blob();
    const blobUrl = URL.createObjectURL(blob);
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        const ratio = Math.min(FOTO_MAX_W / width, FOTO_MAX_H / height, 1);
        width  = Math.round(width  * ratio);
        height = Math.round(height * ratio);
        const canvas = document.createElement('canvas');
        canvas.width  = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) { URL.revokeObjectURL(blobUrl); resolve(null); return; }
        ctx.drawImage(img, 0, 0, width, height);
        URL.revokeObjectURL(blobUrl);
        resolve(canvas.toDataURL('image/jpeg', FOTO_QUALITY));
      };
      img.onerror = () => { URL.revokeObjectURL(blobUrl); resolve(null); };
      img.src = blobUrl;
    });
  } catch { return null; }
}

export async function gerarRelatorioTurma(
  dados: RelatorioDados,
  tipo: 'mensal' | 'geral',
  dataInicio: string,
  dataFim: string,
  subtitulo?: string
): Promise<void> {
  const { default: jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });
  const W = 210, H = 297, M = 14, CW = W - M * 2;

  const dI = new Date(dataInicio + 'T12:00:00');
  const dF = new Date(dataFim   + 'T12:00:00');

  let titulo: string;
  if (tipo === 'mensal') {
    titulo = `RELATÓRIO MENSAL  —  ${MONTHS_PT[dI.getMonth()]} DE ${dI.getFullYear()}`;
  } else {
    const mI = MONTHS_PT[dI.getMonth()], mF = MONTHS_PT[dF.getMonth()];
    titulo = dI.getFullYear() === dF.getFullYear() && mI === mF
      ? `RELATÓRIO GERAL  —  ${mI} ${dI.getFullYear()}`
      : `RELATÓRIO GERAL  —  ${mI}/${dI.getFullYear()} A ${mF}/${dF.getFullYear()}`;
  }

  // Pré-carregar logo
  const logoB64 = await toBase64(logoUrl);

  // ── Header reutilizável ───────────────────────────────────────────────────
  const HEADER_H = 22;
  const addHeader = (): number => {
    // Faixa preta
    doc.setFillColor(...BLACK);
    doc.rect(0, 0, W, HEADER_H, 'F');

    // Logo (quadrada, fundo preto — encaixa perfeitamente)
    if (logoB64) {
      try { doc.addImage(logoB64, 'PNG', M, 1, 20, 20); }
      catch { /* logo falhou — ignora */ }
    }

    // Título amarelo à direita da logo
    doc.setTextColor(...YELLOW);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(titulo, M + 23, 10);

    // Sub­texto
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(200, 200, 200);
    doc.text(`Instituto O Grito  —  ${subtitulo ?? 'Inclusão Produtiva'}`, M + 23, 16);

    // Linha bordô abaixo do header
    doc.setFillColor(...BORDEAUX);
    doc.rect(0, HEADER_H, W, 1.2, 'F');

    doc.setTextColor(...DARK);
    return HEADER_H + 1.2 + 5; // y inicial do conteúdo
  };

  // ── Caixa de info (label + valor) ─────────────────────────────────────────
  const infoBox = (x: number, y: number, w: number, label: string, value: string) => {
    doc.setFillColor(...LGRAY);
    doc.roundedRect(x, y, w - 2, 14, 1.5, 1.5, 'F');

    // Borda esquerda bordô
    doc.setFillColor(...BORDEAUX);
    doc.rect(x, y, 1.8, 14, 'F');

    doc.setTextColor(...MGRAY);
    doc.setFontSize(5.8);
    doc.setFont('helvetica', 'normal');
    doc.text(label, x + 4, y + 4.5);

    doc.setTextColor(...DARK);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    const lines = doc.splitTextToSize(value || '—', w - 10);
    doc.text(lines[0], x + 4, y + 10.5);
  };

  // ── Rodapé de página ──────────────────────────────────────────────────────
  let pagina = 1;
  let pageFooterDone = false; // evita rodapé duplo na mesma página

  const addFooter = (pg: number) => {
    doc.setFillColor(...BLACK);
    doc.rect(0, H - 8, W, 8, 'F');
    doc.setFillColor(...BORDEAUX);
    doc.rect(0, H - 8, W, 0.8, 'F');
    doc.setTextColor(180, 180, 180);
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'normal');
    doc.text('Instituto O Grito  —  Confidencial', M, H - 3.5);
    doc.text(`Página ${pg}`, W - M, H - 3.5, { align: 'right' });
    pageFooterDone = true;
  };

  // Quebra de página com rastreamento de rodapé
  const newPage = () => {
    if (!pageFooterDone) addFooter(pagina++);
    doc.addPage();
    pageFooterDone = false;
    y = addHeader();
  };

  // Inicia nova seção: quebra página se não há espaço, senão adiciona divisor visual
  const startSection = (minH: number) => {
    if (y + minH > H - 16) {
      newPage();
    } else {
      // linha divisória sutil entre seções na mesma página
      y += 6;
      doc.setDrawColor(220, 220, 220);
      doc.setLineWidth(0.3);
      doc.line(M, y, W - M, y);
      doc.setLineWidth(0.2);
      y += 6;
    }
  };

  // ════════════════════════════════════════════════════════════════════════════
  // CAPA
  // ════════════════════════════════════════════════════════════════════════════
  let y = addHeader();

  // Nome da turma — destaque
  doc.setFontSize(17);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...BLACK);
  doc.text(dados.turma.nome, W / 2, y + 5, { align: 'center' });

  // Linha amarela decorativa
  const lineW = 60;
  doc.setFillColor(...YELLOW);
  doc.rect(W / 2 - lineW / 2, y + 8, lineW, 1.5, 'F');
  y += 14;

  // Grid de info (2 linhas × 3 colunas)
  const c3 = CW / 3;
  const horStr = dados.turma.horarioEntrada && dados.turma.horarioSaida
    ? `${String(dados.turma.horarioEntrada).slice(0,5)} – ${String(dados.turma.horarioSaida).slice(0,5)}`
    : dados.turma.horario || '—';
  const diasStr = (dados.turma.diasSemana || []).map(nomeDia).join(', ') || '—';
  const chStr   = dados.totalHoras > 0
    ? `${dados.totalHoras % 1 === 0 ? dados.totalHoras : dados.totalHoras.toFixed(1)}h`
    : '—';

  infoBox(M,           y, c3, 'Programa',          dados.programaNome || '—');
  infoBox(M + c3,      y, c3, 'Local',              dados.turma.local  || '—');
  infoBox(M + c3 * 2,  y, c3, 'Horário',            horStr);
  y += 17;
  infoBox(M,           y, c3, 'Educador / Professor', dados.professorNome || '—');
  infoBox(M + c3,      y, c3, 'Dias da Semana',     diasStr);
  infoBox(M + c3 * 2,  y, c3, 'Carga Horária',      chStr);
  y += 17;

  // ── Cards de estatísticas ─────────────────────────────────────────────────
  const totalPresentes = dados.aulas.reduce((s, a) => s + (a.presentes || 0), 0);
  const totalVagas     = dados.aulas.reduce((s, a) => s + (a.total_inscritos || 0), 0);
  const freqMedia      = totalVagas > 0 ? Math.round((totalPresentes / totalVagas) * 100) : 0;

  // Preto e amarelo alternados — bordô só em detalhes
  const statsData: Array<{ val: string; lbl: string; bg: [number,number,number]; isDark: boolean }> = [
    { val: String(dados.alunos.length), lbl: 'Inscritos',        bg: BLACK,  isDark: true  },
    { val: `${freqMedia}%`,             lbl: 'Freq. Média',      bg: YELLOW, isDark: false },
    { val: String(dados.aulas.length),  lbl: 'Aulas no Período', bg: BLACK,  isDark: true  },
    { val: chStr,                       lbl: 'Horas-Aula',       bg: YELLOW, isDark: false },
  ];
  const sw = (CW - 9) / 4;
  statsData.forEach((s, i) => {
    const sx = M + i * (sw + 3);
    doc.setFillColor(...s.bg);
    doc.roundedRect(sx, y, sw, 22, 2, 2, 'F');
    // Faixa de topo: amarela nos cards pretos, preta nos cards amarelos
    doc.setFillColor(...(s.isDark ? YELLOW : BLACK));
    doc.roundedRect(sx, y, sw, 3, 2, 2, 'F');
    doc.rect(sx, y + 1.5, sw, 1.5, 'F');
    // Valor
    doc.setTextColor(...(s.isDark ? WHITE : BLACK));
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(s.val, sx + sw / 2, y + 15, { align: 'center' });
    // Label
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...(s.isDark ? ([200, 200, 200] as [number,number,number]) : ([60, 60, 60] as [number,number,number])));
    doc.text(s.lbl, sx + sw / 2, y + 19.5, { align: 'center' });
  });
  y += 27;

  // Período
  doc.setTextColor(...MGRAY);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'italic');
  doc.text(`Período: ${fmtBR(dataInicio)} a ${fmtBR(dataFim)}`, M, y);
  y += 7;

  // Descrição
  if (dados.turma.descricao) {
    const descH = 50;
    doc.setFillColor(...OFFWHITE);
    doc.roundedRect(M, y, CW, descH, 2, 2, 'F');
    doc.setFillColor(...YELLOW);
    doc.rect(M, y, 2.2, descH, 'F');  // barra amarela esquerda
    doc.setTextColor(...BLACK);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('Descrição da Atividade', M + 6, y + 6.5);
    doc.setTextColor(...DARK);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    const lines = doc.splitTextToSize(dados.turma.descricao, CW - 10);
    doc.text(lines.slice(0, 7), M + 6, y + 13);
    y += 57; // avança y após descrição para o cálculo de espaço restante
  }

  // ════════════════════════════════════════════════════════════════════════════
  // AULAS
  // ════════════════════════════════════════════════════════════════════════════
  if (dados.aulas.length > 0) {
    const CARD_H = 54;
    const GAP    = 4;
    // Precisa de espaço para título + pelo menos 1 card
    startSection(8 + CARD_H);

    // Título da seção
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...BLACK);
    doc.text('Registro de Aulas', M, y);
    doc.setFillColor(...YELLOW);
    doc.rect(M, y + 2, 36, 1.2, 'F');
    y += 8;

    for (const aula of dados.aulas) {
      // Quebra de página baseada em espaço real disponível
      if (y + CARD_H > H - 16) {
        newPage();
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...BLACK);
        doc.text('Registro de Aulas (continuação)', M, y);
        doc.setFillColor(...YELLOW);
        doc.rect(M, y + 2, 56, 1.2, 'F');
        y += 8;
      }

      const d      = new Date(aula.data + 'T12:00:00');
      const dia    = d.getDate();
      const mes    = MONTHS_PT[d.getMonth()];
      const diaSem = DAYS_PT[d.getDay()];
      const ano    = d.getFullYear();
      const pres   = aula.presentes       || 0;
      const tot    = aula.total_inscritos || 0;
      const freq   = tot > 0 ? Math.round((pres / tot) * 100) : 0;

      const DATE_W  = 38;
      const RIGHT_W = CW - DATE_W - 2;
      const cx = M, cy = y;

      // ── Coluna da data (preta) ──────────────────────────────────────────
      doc.setFillColor(...BLACK);
      doc.roundedRect(cx, cy, DATE_W, CARD_H, 2, 2, 'F');

      // Faixa amarela no topo da coluna
      doc.setFillColor(...YELLOW);
      doc.roundedRect(cx, cy, DATE_W, 4, 2, 2, 'F');
      doc.rect(cx, cy + 2, DATE_W, 2, 'F');

      // Dia (grande, amarelo)
      doc.setTextColor(...YELLOW);
      doc.setFontSize(30);
      doc.setFont('helvetica', 'bold');
      doc.text(String(dia), cx + DATE_W / 2, cy + 24, { align: 'center' });

      // Mês
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text(mes, cx + DATE_W / 2, cy + 32, { align: 'center' });

      // Ano
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(200, 200, 200);
      doc.text(String(ano), cx + DATE_W / 2, cy + 38.5, { align: 'center' });

      // Dia da semana
      doc.setFontSize(6.5);
      doc.text(diaSem, cx + DATE_W / 2, cy + 44.5, { align: 'center' });

      // Badge alimentação (bordô)
      if (aula.teve_alimentacao) {
        doc.setFillColor(...BORDEAUX);
        doc.roundedRect(cx + 4, cy + 47.5, DATE_W - 8, 4.5, 1, 1, 'F');
        doc.setTextColor(...WHITE);
        doc.setFontSize(5.5);
        doc.setFont('helvetica', 'bold');
        doc.text('Alimentação', cx + DATE_W / 2, cy + 50.8, { align: 'center' });
      }

      // ── Coluna de detalhes (clara) ──────────────────────────────────────
      const rx = cx + DATE_W + 2;
      doc.setFillColor(248, 247, 244);
      doc.roundedRect(rx, cy, RIGHT_W, CARD_H, 2, 2, 'F');

      // Header interno da coluna
      doc.setFillColor(...BLACK);
      doc.roundedRect(rx, cy, RIGHT_W, 9, 2, 2, 'F');
      doc.rect(rx, cy + 5, RIGHT_W, 4, 'F');

      doc.setTextColor(...YELLOW);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.text(
        `${diaSem}   —   Carga horária: ${dados.horasPorAula % 1 === 0 ? dados.horasPorAula : dados.horasPorAula.toFixed(1)}h`,
        rx + 3, cy + 5.8
      );

      // Badge REALIZADO (bordô)
      doc.setFillColor(...BORDEAUX);
      doc.roundedRect(rx + RIGHT_W - 33, cy + 11, 29, 6, 1, 1, 'F');
      doc.setTextColor(...WHITE);
      doc.setFontSize(6);
      doc.setFont('helvetica', 'bold');
      doc.text('REALIZADO', rx + RIGHT_W - 18.5, cy + 15.2, { align: 'center' });

      // Label atividade
      doc.setTextColor(...MGRAY);
      doc.setFontSize(6.5);
      doc.setFont('helvetica', 'normal');
      doc.text('ATIVIDADE:', rx + 3, cy + 16);
      doc.setTextColor(...DARK);
      doc.setFont('helvetica', 'bold');
      doc.text('Presença em aula', rx + 22, cy + 16);

      // Campos (2×2)
      const det = (lx: number, ly: number, lbl: string, val: string) => {
        doc.setTextColor(...MGRAY);
        doc.setFontSize(6);
        doc.setFont('helvetica', 'normal');
        doc.text(lbl, lx, ly);
        doc.setTextColor(...DARK);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text(val, lx, ly + 6);
      };
      const c1 = rx + 3, c2 = rx + RIGHT_W / 2;
      det(c1, cy + 25, 'Educador',      dados.professorNome || '—');
      det(c2, cy + 25, 'Local',         dados.turma.local   || 'PRESENCIAL');
      det(c1, cy + 38, 'Participantes', String(pres));
      det(c2, cy + 38, 'Frequência',    `${freq}%`);

      y += CARD_H + GAP;
    }
    if (!pageFooterDone) addFooter(pagina++);
  }

  // ════════════════════════════════════════════════════════════════════════════
  // LISTA DE INSCRITOS
  // ════════════════════════════════════════════════════════════════════════════
  if (dados.alunos.length > 0) {
    // título (12) + info boxes (18) + ao menos cabeçalho de tabela (12) = ~42
    startSection(42);

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...BLACK);
    doc.text('Lista de Inscritos', M, y);
    doc.setFillColor(...YELLOW);
    doc.rect(M, y + 2, 38, 1.2, 'F');
    y += 10;

    const c4 = CW / 4;
    infoBox(M,           y, c4, 'Programa',        dados.programaNome  || '—');
    infoBox(M + c4,      y, c4, 'Educador',         dados.professorNome || '—');
    infoBox(M + c4 * 2,  y, c4, 'Total Inscritos',  String(dados.alunos.length));
    infoBox(M + c4 * 3,  y, c4, 'Carga Horária',    chStr);
    y += 18;

    const calcIdadeRelatorio = (nasc: string | null | undefined): string => {
      if (!nasc) return '—';
      const hoje = new Date();
      const n = new Date(nasc.slice(0, 10) + 'T12:00:00');
      if (isNaN(n.getTime())) return '—';
      let idade = hoje.getFullYear() - n.getFullYear();
      const m = hoje.getMonth() - n.getMonth();
      if (m < 0 || (m === 0 && hoje.getDate() < n.getDate())) idade--;
      return `${idade}`;
    };
    autoTable(doc, {
      head: [['Nº', 'Nome', 'Gênero', 'Nascimento', 'Idade', 'Inscrição']],
      body: dados.alunos.map((a, i) => [
        String(i + 1), a.nome, a.genero || '—',
        fmtBR(a.data_nascimento), calcIdadeRelatorio(a.data_nascimento), fmtBR(a.data_inscricao),
      ]),
      startY: y,
      styles:         { fontSize: 8, cellPadding: 3 },
      headStyles:     { fillColor: BLACK, textColor: YELLOW, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: OFFWHITE },
      margin:         { left: M, right: M },
      columnStyles:   { 0: { cellWidth: 9 }, 1: { cellWidth: 68 }, 2: { cellWidth: 22 }, 3: { cellWidth: 26 }, 4: { cellWidth: 14 }, 5: { cellWidth: 26 } },
      didDrawPage: () => { addFooter(pagina++); pageFooterDone = true; },
    });
    y = (doc as any).lastAutoTable.finalY + 4;
    pageFooterDone = true;
  }

  // ════════════════════════════════════════════════════════════════════════════
  // EVASÃO
  // ════════════════════════════════════════════════════════════════════════════
  if (dados.evasao.length > 0) {
    // título + cabeçalho de tabela + 1 linha = ~28
    startSection(28);

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...BORDEAUX);
    doc.text('Evasão no Período', M, y);
    doc.setFillColor(...BORDEAUX);
    doc.rect(M, y + 2, 36, 1.2, 'F');
    y += 10;

    autoTable(doc, {
      head: [['Nº', 'Nome', 'Gênero', 'Data de Saída', 'Motivo']],
      body: dados.evasao.map((e, i) => [
        String(i + 1), e.nome, e.genero || '—',
        fmtBR(e.data_desligamento), e.motivo_desligamento || '—',
      ]),
      startY: y,
      styles:         { fontSize: 8, cellPadding: 3 },
      headStyles:     { fillColor: BORDEAUX, textColor: WHITE, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [255, 248, 250] },
      margin:         { left: M, right: M },
      columnStyles:   { 0: { cellWidth: 9 }, 1: { cellWidth: 62 }, 2: { cellWidth: 20 }, 3: { cellWidth: 28 }, 4: { cellWidth: 60 } },
      didDrawPage: () => { addFooter(pagina++); pageFooterDone = true; },
    });
    y = (doc as any).lastAutoTable.finalY + 4;
    pageFooterDone = true;
  }

  // ════════════════════════════════════════════════════════════════════════════
  // ALIMENTAÇÃO + NPS
  // ════════════════════════════════════════════════════════════════════════════
  const hasAlim = dados.alimentacao.total > 0 && dados.alimentacao.comAlimentacao > 0;
  const hasNps  = dados.nps.length > 0;

  if (hasAlim || hasNps) {
    // alimentação: título+caixa+barra = ~50; nps: título+tabela = ~30
    const alimNpsMinH = (hasAlim ? 50 : 0) + (hasNps ? 30 : 0);
    startSection(alimNpsMinH);

    if (hasAlim) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...BLACK);
      doc.text('Alimentação', M, y);
      doc.setFillColor(...YELLOW);
      doc.rect(M, y + 2, 26, 1.2, 'F');
      y += 10;

      const pct = Math.round((dados.alimentacao.comAlimentacao / dados.alimentacao.total) * 100);
      doc.setFillColor(...OFFWHITE);
      doc.roundedRect(M, y, CW, 18, 2, 2, 'F');
      doc.setFillColor(...YELLOW);
      doc.rect(M, y, 2.2, 18, 'F');
      doc.setTextColor(...DARK);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(
        `${dados.alimentacao.comAlimentacao} de ${dados.alimentacao.total} aulas tiveram refeição (${pct}%)`,
        M + 6, y + 10
      );
      y += 21;

      // Barra de progresso
      doc.setFillColor(210, 210, 210);
      doc.roundedRect(M, y, CW, 5.5, 2.5, 2.5, 'F');
      doc.setFillColor(...YELLOW);
      doc.roundedRect(M, y, (dados.alimentacao.comAlimentacao / dados.alimentacao.total) * CW, 5.5, 2.5, 2.5, 'F');
      y += 14;
    }

    if (hasNps) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...BLACK);
      doc.text('NPS — Net Promoter Score', M, y);
      doc.setFillColor(...YELLOW);
      doc.rect(M, y + 2, 50, 1.2, 'F');
      y += 10;

      autoTable(doc, {
        head: [['Pesquisa', 'Status', 'Respostas', 'Score Médio (0–10)']],
        body: dados.nps.map(n => [
          n.titulo,
          n.status === 'fechada' ? 'Encerrada' : n.status === 'aberta' ? 'Aberta' : 'Rascunho',
          String(n.total_respostas),
          n.media_nps !== null && n.media_nps !== undefined ? String(n.media_nps) : '—',
        ]),
        startY: y,
        styles:     { fontSize: 9, cellPadding: 3 },
        headStyles: { fillColor: BLACK, textColor: YELLOW, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: OFFWHITE },
        margin:     { left: M, right: M },
        didDrawPage: () => { addFooter(pagina++); pageFooterDone = true; },
      });
      y = (doc as any).lastAutoTable.finalY + 4;
      pageFooterDone = true;
    } else {
      // só alimentação, sem NPS — garantir rodapé
      if (!pageFooterDone) addFooter(pagina++);
    }
  }

  // ════════════════════════════════════════════════════════════════════════════
  // GALERIA DE FOTOS
  // ════════════════════════════════════════════════════════════════════════════
  const fotoItems: { label: string; url: string }[] = [];
  for (const aula of dados.aulas) {
    if (!aula.foto_comprovante) continue;
    let urls: string[] = [];
    try {
      const parsed = JSON.parse(aula.foto_comprovante);
      urls = Array.isArray(parsed)
        ? parsed.filter(u => typeof u === 'string' && u.length > 0)
        : [];
    } catch {
      if (typeof aula.foto_comprovante === 'string' && aula.foto_comprovante.length > 0)
        urls = [aula.foto_comprovante];
    }
    const d   = new Date(aula.data + 'T12:00:00');
    const lbl = `${d.getDate()} de ${MONTHS_PT[d.getMonth()]} de ${d.getFullYear()}`;
    urls.forEach(u => fotoItems.push({ label: lbl, url: u }));
  }

  if (fotoItems.length > 0) {
    const IMG_W = (CW - 5) / 2;
    const IMG_H = 56;
    const LBL_H = 5;
    // título + pelo menos 1 foto em 2 colunas = ~72
    startSection(10 + LBL_H + IMG_H);

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...BLACK);
    doc.text('Galeria de Fotos', M, y);
    doc.setFillColor(...YELLOW);
    doc.rect(M, y + 2, 35, 1.2, 'F');
    y += 10;

    let col = 0;

    for (const { label, url } of fotoItems) {
      // Se a foto não couber na linha atual, avança para a próxima linha
      // Se a próxima linha não couber na página, quebra de página
      if (col === 0 && y + LBL_H + IMG_H > H - 12) {
        newPage();
        y += 4;
        col = 0;
      }
      const ix = col === 0 ? M : M + IMG_W + 5;

      // Label
      doc.setTextColor(...MGRAY);
      doc.setFontSize(6.5);
      doc.setFont('helvetica', 'italic');
      doc.text(label, ix, y);

      // Imagem
      const b64 = await toCompressedBase64(url);
      if (b64) {
        try { doc.addImage(b64, 'JPEG', ix, y + LBL_H, IMG_W, IMG_H); }
        catch {
          doc.setFillColor(...LGRAY);
          doc.rect(ix, y + LBL_H, IMG_W, IMG_H, 'F');
          doc.setTextColor(...MGRAY);
          doc.setFontSize(7.5);
          doc.text('[Imagem indisponível]', ix + IMG_W / 2, y + LBL_H + IMG_H / 2, { align: 'center' });
        }
      } else {
        doc.setFillColor(...LGRAY);
        doc.rect(ix, y + LBL_H, IMG_W, IMG_H, 'F');
        doc.setTextColor(...MGRAY);
        doc.setFontSize(7.5);
        doc.text('[Foto não disponível]', ix + IMG_W / 2, y + LBL_H + IMG_H / 2, { align: 'center' });
      }

      // Borda bordô ao redor da foto
      doc.setDrawColor(...BORDEAUX);
      doc.setLineWidth(0.4);
      doc.rect(ix, y + LBL_H, IMG_W, IMG_H, 'S');
      doc.setLineWidth(0.2);

      col++;
      if (col >= 2) { col = 0; y += LBL_H + IMG_H + 6; }
    }

    if (!pageFooterDone) addFooter(pagina++);
  }

  // Rodapé final — garante que a última página tem rodapé
  if (!pageFooterDone) addFooter(pagina);

  // ── Salvar ────────────────────────────────────────────────────────────────
  const safe = (s: string) => s.toLowerCase().replace(/[\s\/\\]/g, '-').replace(/[^a-z0-9-]/g, '');
  const arquivo = tipo === 'mensal'
    ? `relatorio-mensal-${safe(dados.turma.nome)}-${dataInicio.slice(0, 7)}.pdf`
    : `relatorio-geral-${safe(dados.turma.nome)}-${dataInicio.slice(0, 10)}-a-${dataFim.slice(0, 10)}.pdf`;

  doc.save(arquivo);
}
