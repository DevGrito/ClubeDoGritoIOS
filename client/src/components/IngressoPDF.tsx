import { useEffect, useState } from "react";
import { X, Download } from "lucide-react";
import { jsPDF } from "jspdf";
import QRCode from "qrcode";

interface IngressoPDFProps {
  ingresso: any;
  onClose: () => void;
}

/**
 * Busca imagem via proxy backend (evita CORS do GCS).
 * Aceita caminho relativo GCS ou URL completa.
 */
async function fetchImageAsBase64(pathOrUrl: string): Promise<string | null> {
  try {
    // Decide o parâmetro correto para o proxy
    const isFullUrl = pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://");
    const param = isFullUrl
      ? `url=${encodeURIComponent(pathOrUrl)}`
      : `path=${encodeURIComponent(pathOrUrl)}`;

    const r = await fetch(`/api/proxy/image?${param}`);
    if (!r.ok) return null;
    const blob = await r.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

async function buildPDF(ingresso: any): Promise<jsPDF> {
  // ── Dimensões ───────────────────────────────────────────────────────────────
  // Layout fixo com posições absolutas — sem risco de sobreposição
  const W = 88;
  const H = 200;   // altura generosa para caber tudo

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: [W, H] });

  // ── Paleta ──────────────────────────────────────────────────────────────────
  const YELLOW:  [number,number,number] = [245, 158,  11];
  const RED:     [number,number,number] = [192,  39,  45];
  const DARK:    [number,number,number] = [ 22,  22,  30];
  const GRAY:    [number,number,number] = [120, 120, 135];
  const LIGHT:   [number,number,number] = [248, 248, 250];
  const WHITE:   [number,number,number] = [255, 255, 255];
  const SEP:     [number,number,number] = [218, 218, 228];

  // ── Fundo ───────────────────────────────────────────────────────────────────
  doc.setFillColor(...LIGHT);
  doc.rect(0, 0, W, H, "F");

  // ── SEÇÃO 1: Banner do evento (0 → 50 mm) ──────────────────────────────────
  const BANNER_H = 50;
  const bannerPath: string | null =
    ingresso.evento_banner_url ?? ingresso.evento?.banner_url ?? null;

  let bannerOk = false;
  if (bannerPath) {
    const b64 = await fetchImageAsBase64(bannerPath);
    if (b64) {
      try {
        doc.addImage(b64, "JPEG", 0, 0, W, BANNER_H);
        bannerOk = true;
      } catch { /* fallback abaixo */ }
    }
  }

  if (!bannerOk) {
    // Fallback: fundo vermelho + título centralizado
    doc.setFillColor(...RED);
    doc.rect(0, 0, W, BANNER_H, "F");
    const titulo = String(ingresso.evento_titulo ?? ingresso.evento?.titulo ?? "Evento");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(...WHITE);
    const tLines: string[] = doc.splitTextToSize(titulo, W - 16);
    doc.text(tLines, W / 2, BANNER_H / 2 + (tLines.length - 1) * 2, { align: "center" });
  }

  // ── SEÇÃO 2: Faixa amarela com nome do evento (50 → 70 mm) ─────────────────
  const STRIP_Y  = BANNER_H;       // 50
  const STRIP_H  = 20;
  doc.setFillColor(...YELLOW);
  doc.rect(0, STRIP_Y, W, STRIP_H, "F");

  const eventoTitulo = String(ingresso.evento_titulo ?? ingresso.evento?.titulo ?? "Evento");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...DARK);
  const stripLines: string[] = doc.splitTextToSize(eventoTitulo.toUpperCase(), W - 12);
  // Centralizar verticalmente na faixa
  const stripTextY = STRIP_Y + STRIP_H / 2 + 2 + (stripLines.length > 1 ? -2 : 0);
  doc.text(stripLines, W / 2, stripTextY, { align: "center" });

  // ── SEÇÃO 3: Tear-off perforado (y = 75) ───────────────────────────────────
  const TEAR_Y = STRIP_Y + STRIP_H + 5;   // 75
  doc.setFillColor(...LIGHT);
  doc.circle(-0.5, TEAR_Y, 5, "F");
  doc.circle(W + 0.5, TEAR_Y, 5, "F");
  doc.setDrawColor(...SEP);
  doc.setLineWidth(0.3);
  for (let x = 7; x < W - 7; x += 4) doc.line(x, TEAR_Y, x + 2.2, TEAR_Y);

  // ── SEÇÃO 4: Portador (fixo: y = 84–100) ───────────────────────────────────
  const PORT_Y = TEAR_Y + 9;   // 84

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6);
  doc.setTextColor(...GRAY);
  doc.text("PORTADOR", W / 2, PORT_Y, { align: "center" });

  const portador =
    ingresso.para_terceiro && ingresso.beneficiario_nome
      ? ingresso.beneficiario_nome
      : ingresso.titular_nome ?? "Visitante";

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(...DARK);
  const nomeLines: string[] = doc.splitTextToSize(portador.toUpperCase(), W - 12);
  doc.text(nomeLines, W / 2, PORT_Y + 6, { align: "center" });

  // Divisória após nome (max 2 linhas de nome → fica em y≈100)
  const DIV_Y = PORT_Y + 8 + Math.min(nomeLines.length, 2) * 6;
  doc.setDrawColor(...SEP);
  doc.setLineWidth(0.25);
  doc.line(7, DIV_Y, W - 7, DIV_Y);

  // ── SEÇÃO 5: Info do evento (fixo: começa em y = 110) ──────────────────────
  // Usamos posições fixas para garantir que o QR nunca sobreponha o texto
  const INFO_START_Y = DIV_Y + 6;

  const infoBlock = (label: string, value: string, y: number): number => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(5.5);
    doc.setTextColor(...GRAY);
    doc.text(label.toUpperCase(), 8, y);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...DARK);
    // Limitar a 2 linhas para não estourar o espaço
    const rawLines: string[] = doc.splitTextToSize(value, W - 16);
    const lines = rawLines.slice(0, 2);
    doc.text(lines, 8, y + 5);
    return y + 5 + lines.length * 4.5 + 4;   // retorna próximo y
  };

  let iy = INFO_START_Y;

  const dataInicio = ingresso.evento_data_inicio ?? ingresso.evento?.data_inicio;
  if (dataInicio) {
    const d = new Date(dataInicio);
    const dateStr = d.toLocaleDateString("pt-BR", {
      weekday: "long", day: "2-digit", month: "long", year: "numeric",
    });
    iy = infoBlock("Data", dateStr.charAt(0).toUpperCase() + dateStr.slice(1), iy);
  }

  const horaInicio = ingresso.evento_hora_inicio ?? ingresso.evento?.hora_inicio;
  const horaFim    = ingresso.evento_hora_fim    ?? ingresso.evento?.hora_fim;
  if (horaInicio) {
    iy = infoBlock("Horário", `${horaInicio}${horaFim ? ` às ${horaFim}` : ""}`, iy);
  }

  const local   = ingresso.evento_local    ?? ingresso.evento?.local;
  const end     = ingresso.evento_endereco ?? ingresso.evento?.endereco ?? "";
  const cidade  = ingresso.evento_cidade   ?? ingresso.evento?.cidade   ?? "";
  const estado  = ingresso.evento_estado   ?? ingresso.evento?.estado   ?? "";
  if (local) {
    const localStr = [local, end, cidade && estado ? `${cidade} - ${estado}` : (cidade || estado)]
      .filter(Boolean).join(" · ");
    iy = infoBlock("Local", localStr, iy);
  }

  // ── SEÇÃO 6: QR Code — posição fixa a partir de y=148 ─────────────────────
  // Se o texto ficou além de 145mm, o QR empurra para baixo (page cresce via lógica acima)
  const QR_Y    = Math.max(iy + 6, 148);
  const QR_SIZE = 38;

  // Fundo branco com borda
  doc.setFillColor(...WHITE);
  doc.setDrawColor(...SEP);
  doc.setLineWidth(0.3);
  doc.roundedRect(W / 2 - QR_SIZE / 2 - 3, QR_Y - 3, QR_SIZE + 6, QR_SIZE + 6, 2, 2, "FD");

  const qrDataUrl = await QRCode.toDataURL(ingresso.codigo, {
    width: 500,
    margin: 1,
    color: { dark: "#16161e", light: "#ffffff" },
    errorCorrectionLevel: "H",
  });
  doc.addImage(qrDataUrl, "PNG", W / 2 - QR_SIZE / 2, QR_Y, QR_SIZE, QR_SIZE);

  // ── SEÇÃO 7: Código — abaixo do QR ─────────────────────────────────────────
  const CODE_Y = QR_Y + QR_SIZE + 6;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(...GRAY);
  doc.text(ingresso.codigo, W / 2, CODE_Y, { align: "center" });

  // ── SEÇÃO 8: Rodapé amarelo ─────────────────────────────────────────────────
  const FOOTER_Y = CODE_Y + 5;
  const FOOTER_H = 9;
  doc.setFillColor(...YELLOW);
  doc.rect(0, FOOTER_Y, W, FOOTER_H, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6);
  doc.setTextColor(...DARK);
  doc.text("Instituto O Grito · Clube do Grito", W / 2, FOOTER_Y + 5.5, { align: "center" });

  return doc;
}

export default function IngressoPDF({ ingresso, onClose }: IngressoPDFProps) {
  const [pdfUrl, setPdfUrl]   = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [pdfDoc, setPdfDoc]   = useState<jsPDF | null>(null);

  useEffect(() => {
    let cancelled = false;
    buildPDF(ingresso).then((doc) => {
      if (cancelled) return;
      const blob = doc.output("blob");
      setPdfUrl(URL.createObjectURL(blob));
      setPdfDoc(doc);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [ingresso]);

  const handleDownload = () => {
    if (!pdfDoc) return;
    const titulo = (ingresso.evento_titulo ?? ingresso.evento?.titulo ?? "ingresso")
      .toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9\-]/g, "");
    pdfDoc.save(`${titulo}-${ingresso.codigo}.pdf`);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h3 className="font-bold text-gray-900 text-base">Seu Ingresso</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Preview */}
        <div className="p-4 flex-1">
          {loading ? (
            <div className="h-72 flex flex-col items-center justify-center gap-3">
              <div
                className="w-9 h-9 border-4 border-t-transparent rounded-full animate-spin"
                style={{ borderColor: "#c0272d", borderTopColor: "transparent" }}
              />
              <p className="text-sm text-gray-400">Gerando ingresso...</p>
            </div>
          ) : pdfUrl ? (
            <iframe
              src={pdfUrl + "#toolbar=0&navpanes=0&scrollbar=0"}
              className="w-full rounded-xl border border-gray-100"
              style={{ height: "460px" }}
              title="Preview do ingresso"
            />
          ) : (
            <div className="h-72 flex items-center justify-center text-gray-400 text-sm">
              Não foi possível gerar o preview
            </div>
          )}
        </div>

        {/* Download */}
        <div className="px-5 pb-5">
          <button
            onClick={handleDownload}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-white font-bold text-sm disabled:opacity-50 transition-opacity"
            style={{ backgroundColor: "#c0272d" }}
          >
            <Download className="w-4 h-4" />
            {loading ? "Aguarde..." : "Baixar Ingresso (PDF)"}
          </button>
        </div>
      </div>
    </div>
  );
}
