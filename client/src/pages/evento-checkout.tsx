import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation, useSearch } from "wouter";
import {
  ArrowLeft, Ticket, CreditCard, User, Lock, ShieldCheck,
  Calendar, MapPin, Clock, CheckCircle, ChevronRight,
  Minus, Plus, QrCode, Copy, Check, Loader2,
  Smartphone, AlertCircle,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import logoPath from "../app-assets/Logo_Clube_Do_grito.png";
import { usePortalAuth } from "../hooks/usePortalAuth";
import LoginModal from "../components/portal/LoginModal";

const GREEN = "#058d4c";
const RED = "#a90302";
const YELLOW = "#ffcc00";
const BRAND = "#f59e0b";

function formatCard(v: string) { const n = v.replace(/\D/g, "").slice(0, 16); return n.replace(/(.{4})/g, "$1 ").trim(); }
function formatExpiry(v: string) { const n = v.replace(/\D/g, "").slice(0, 4); return n.length > 2 ? `${n.slice(0, 2)}/${n.slice(2)}` : n; }
function formatCPF(v: string) { const n = v.replace(/\D/g, "").slice(0, 11); if (n.length <= 3) return n; if (n.length <= 6) return `${n.slice(0,3)}.${n.slice(3)}`; if (n.length <= 9) return `${n.slice(0,3)}.${n.slice(3,6)}.${n.slice(6)}`; return `${n.slice(0,3)}.${n.slice(3,6)}.${n.slice(6,9)}-${n.slice(9)}`; }
function formatPhone(v: string) { const n = v.replace(/\D/g, "").slice(0, 11); if (n.length <= 2) return `(${n}`; if (n.length <= 6) return `(${n.slice(0,2)}) ${n.slice(2)}`; if (n.length <= 10) return `(${n.slice(0,2)}) ${n.slice(2,6)}-${n.slice(6)}`; return `(${n.slice(0,2)}) ${n.slice(2,7)}-${n.slice(7)}`; }

function detectBandeira(num: string): string {
  const n = num.replace(/\D/g, "");
  if (/^4/.test(n)) return "Visa";
  if (/^(5[1-5]|2(2[2-9]|[3-6]\d|7[01]))/.test(n)) return "Master";
  if (/^3[47]/.test(n)) return "Amex";
  if (/^(6362|636368|438935|504175|451416|636297|5067|4576|4011)/.test(n)) return "Elo";
  if (/^(606282|3841)/.test(n)) return "Hipercard";
  if (/^(301|305|3095|36|38)/.test(n)) return "Diners";
  return "";
}

function genIdempotencyKey(): string {
  return `ck-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

type Step = "dados" | "pagamento" | "pix-aguardando" | "sucesso";

export default function EventoCheckout() {
  const { id } = useParams<{ id: string }>();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const initialQty = Math.max(1, parseInt(params.get("qty") || "1", 10));
  const [, navigate] = useLocation();
  const { user, isLoggedIn } = usePortalAuth();

  const [showLogin, setShowLogin] = useState(false);
  const [step, setStep] = useState<Step>("dados");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [marketingAccepted, setMarketingAccepted] = useState(false);
  const [imageAccepted, setImageAccepted] = useState(false);
  const [quantidade, setQuantidade] = useState(initialQty);

  // Chave de idempotência — gerada uma vez por sessão de checkout, previne cobrança dupla
  const idempotencyKeyRef = useRef<string>(genIdempotencyKey());
  const resetIdempotencyKey = () => { idempotencyKeyRef.current = genIdempotencyKey(); };

  // Dados do comprador
  const [nome, setNome] = useState((user as any)?.nome || "");
  const [cpf, setCpf] = useState((user as any)?.cpf ? formatCPF((user as any).cpf) : "");
  const [email, setEmail] = useState(user?.email || "");
  const [telefone, setTelefone] = useState("");

  // Pagamento
  const [metodo, setMetodo] = useState<"pix" | "cartao" | "">("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [parcelas, setParcelas] = useState(1);
  const [erroMsg, setErroMsg] = useState<string | null>(null);

  // PIX
  const [pixData, setPixData] = useState<{ qrCodeBase64?: string; qrCodeString?: string; orderRef?: string } | null>(null);
  const [pixCopiado, setPixCopiado] = useState(false);
  const [pixStatus, setPixStatus] = useState<"aguardando" | "pago" | "erro">("aguardando");
  const [ingressosCriados, setIngressosCriados] = useState<any[]>([]);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollingActiveRef = useRef(false);

  const { data: evento, isLoading, isError } = useQuery<any>({
    queryKey: ["/api/eventos-grito", id],
    queryFn: async () => { const r = await fetch(`/api/eventos-grito/${id}`); if (!r.ok) throw new Error(); return r.json(); },
  });

  const { data: dispData } = useQuery<{ disponiveis: number; total: number }>({
    queryKey: ["/api/portal/eventos", id, "disponiveis"],
    queryFn: async () => { const r = await fetch(`/api/portal/eventos/${id}/disponiveis`); if (!r.ok) return { disponiveis: 0, total: 0 }; return r.json(); },
    enabled: !!evento,
  });

  const preco = evento?.preco || 0;
  const precoUnit = preco / 100;
  const total = precoUnit * quantidade;
  const totalFmt = total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const unitFmt = precoUnit.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const maxQty = Math.min(dispData?.disponiveis ?? 10, 10);
  const bandeira = detectBandeira(cardNumber);

  const dadosOk =
    nome.trim().length >= 3 &&
    cpf.replace(/\D/g, "").length === 11 &&
    email.includes("@") &&
    telefone.replace(/\D/g, "").length >= 10 &&
    termsAccepted;

  const cartaoOk =
    cardNumber.replace(/\D/g, "").length >= 13 &&
    cardName.trim().length >= 3 &&
    cardExpiry.length === 5 &&
    cardCvv.length >= 3;

  // ── Polling de status PIX ──────────────────────────────────────────────────
  const iniciarPollingPix = useCallback((orderRef: string) => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    pollingActiveRef.current = true;

    pollingRef.current = setInterval(async () => {
      if (!pollingActiveRef.current) return;
      try {
        const r = await fetch(`/api/payments/${orderRef}/status`);
        const data = await r.json();
        if (data.pago) {
          pollingActiveRef.current = false;
          if (pollingRef.current) clearInterval(pollingRef.current);
          setPixStatus("pago");
          setIngressosCriados(data.ingressos || []);
          setTimeout(() => { window.scrollTo({ top: 0, behavior: "smooth" }); setStep("sucesso"); }, 1500);
        }
      } catch {}
    }, 5000);
  }, []);

  useEffect(() => {
    return () => {
      pollingActiveRef.current = false;
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  // ── Mutation PIX ───────────────────────────────────────────────────────────
  const pixMutation = useMutation({
    mutationFn: async () => {
      setErroMsg(null);
      const r = await fetch("/api/payments/pix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          eventoId: id,
          nome, cpf, email, telefone, quantidade,
          idempotencyKey: idempotencyKeyRef.current,
        }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Erro ao gerar PIX");
      return data;
    },
    onSuccess: (data) => {
      setPixData({ qrCodeBase64: data.qrCodeBase64, qrCodeString: data.qrCodeString, orderRef: data.orderRef });
      setStep("pix-aguardando");
      iniciarPollingPix(data.orderRef);
    },
    onError: (e: Error) => {
      setErroMsg(e.message);
      resetIdempotencyKey();
    },
  });

  // ── Mutation Cartão ────────────────────────────────────────────────────────
  const cartaoMutation = useMutation({
    mutationFn: async () => {
      setErroMsg(null);
      const r = await fetch("/api/payments/card", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          eventoId: id,
          nome, cpf, email, telefone, quantidade, parcelas,
          cardNumber: cardNumber.replace(/\D/g, ""),
          cardName, cardExpiry, cardCvv,
          idempotencyKey: idempotencyKeyRef.current,
        }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Pagamento não autorizado");
      return data;
    },
    onSuccess: (data) => {
      setIngressosCriados(data.ingressos || []);
      window.scrollTo({ top: 0, behavior: "smooth" });
      setStep("sucesso");
    },
    onError: (e: Error) => {
      setErroMsg(e.message);
      resetIdempotencyKey();
    },
  });

  const isPending = pixMutation.isPending || cartaoMutation.isPending;

  const handlePagar = () => {
    if (isPending) return;
    if (metodo === "pix") pixMutation.mutate();
    else if (metodo === "cartao") cartaoMutation.mutate();
  };

  // ── Guard: login obrigatório ───────────────────────────────────────────────
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4 p-8">
        <Ticket className="w-12 h-12 text-amber-400" />
        <p className="text-gray-700 font-semibold text-lg text-center">Faça login para continuar</p>
        <button onClick={() => setShowLogin(true)} className="px-6 py-3 rounded-xl text-gray-900 font-bold text-sm shadow-md" style={{ backgroundColor: YELLOW }}>
          Entrar
        </button>
        <button onClick={() => navigate(`/eventos/${id}`)} className="text-gray-500 text-sm hover:underline">Voltar ao evento</button>
        {showLogin && <LoginModal onClose={() => { setShowLogin(false); navigate(`/eventos/${id}`); }} message="Faça login para comprar seu ingresso" onSuccess={() => setShowLogin(false)} />}
      </div>
    );
  }

  if (isLoading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: BRAND, borderTopColor: "transparent" }} />
    </div>
  );
  if (isError || !evento) return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
      <span className="text-5xl">😕</span>
      <p className="text-gray-600 font-medium">Evento não encontrado</p>
    </div>
  );

  // ── Tela PIX aguardando ────────────────────────────────────────────────────
  if (step === "pix-aguardando" && pixData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="sticky top-0 z-40 shadow-sm bg-white">
          <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
            <button onClick={() => { pollingActiveRef.current = false; if (pollingRef.current) clearInterval(pollingRef.current); setStep("pagamento"); }} className="flex items-center gap-2 text-gray-700">
              <ArrowLeft className="w-5 h-5" /><span className="text-sm font-medium">Voltar</span>
            </button>
            <img src={logoPath} alt="Clube do Grito" className="h-9 object-contain rounded-full" />
            <div className="w-16" />
          </div>
          <div className="h-1" style={{ backgroundColor: RED }} />
        </header>

        <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center mx-auto">
              <QrCode className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="font-bold text-gray-900 text-xl">Pague com PIX</h1>
            <p className="text-gray-500 text-sm">Escaneie o QR Code abaixo ou copie o código PIX</p>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-center">
            <p className="text-xs text-green-600 font-medium">Valor a pagar</p>
            <p className="text-3xl font-black text-green-700">{totalFmt}</p>
            <p className="text-xs text-green-500">{quantidade} ingresso{quantidade > 1 ? "s" : ""} · {evento.titulo}</p>
          </div>

          {pixData.qrCodeBase64 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col items-center gap-4">
              <img src={`data:image/png;base64,${pixData.qrCodeBase64}`} alt="QR Code PIX" className="w-52 h-52 object-contain" />
              <p className="text-xs text-gray-400 text-center">QR Code válido por 30 minutos</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 flex flex-col items-center gap-3">
              <QrCode className="w-16 h-16 text-gray-300" />
              <p className="text-sm text-gray-400 text-center">QR Code sendo gerado</p>
            </div>
          )}

          {pixData.qrCodeString && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-2">
              <p className="text-xs font-semibold text-gray-600">PIX Copia e Cola</p>
              <div className="flex gap-2">
                <code className="flex-1 text-xs bg-gray-50 rounded-lg px-3 py-2.5 text-gray-700 break-all border border-gray-200 font-mono">
                  {pixData.qrCodeString}
                </code>
                <button
                  onClick={() => { navigator.clipboard.writeText(pixData.qrCodeString!); setPixCopiado(true); setTimeout(() => setPixCopiado(false), 3000); }}
                  className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all"
                  style={{ backgroundColor: pixCopiado ? GREEN : YELLOW, color: pixCopiado ? "#fff" : "#1a1a1a" }}
                >
                  {pixCopiado ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {pixCopiado ? "Copiado!" : "Copiar"}
                </button>
              </div>
            </div>
          )}

          <div className={`rounded-2xl p-4 flex items-center gap-3 ${pixStatus === "pago" ? "bg-green-50 border border-green-200" : "bg-amber-50 border border-amber-200"}`}>
            {pixStatus === "pago" ? (
              <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
            ) : (
              <Loader2 className="w-5 h-5 text-amber-500 animate-spin shrink-0" />
            )}
            <div>
              <p className="text-sm font-semibold text-gray-800">
                {pixStatus === "pago" ? "Pagamento confirmado!" : "Aguardando pagamento..."}
              </p>
              <p className="text-xs text-gray-500">
                {pixStatus === "pago" ? "Seus ingressos estão sendo gerados." : "Verificando automaticamente a cada 5 segundos."}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-3">
            <p className="text-xs font-semibold text-gray-600">Como pagar</p>
            {[
              { icon: Smartphone, text: "Abra o app do seu banco" },
              { icon: QrCode, text: "Escolha pagar com PIX ou QR Code" },
              { icon: Check, text: "Escaneie o código ou cole o PIX" },
              { icon: CheckCircle, text: "Confirme o pagamento de " + totalFmt },
            ].map(({ icon: Icon, text }, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-amber-600">{i + 1}</span>
                </div>
                <p className="text-sm text-gray-700">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Tela Sucesso ───────────────────────────────────────────────────────────
  if (step === "sucesso") {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-5 p-8">
        <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: GREEN }}>
          <CheckCircle className="w-9 h-9 text-white" />
        </div>
        <div className="text-center">
          <h2 className="font-bold text-gray-900 text-xl mb-1">Pagamento confirmado!</h2>
          <p className="text-gray-500 text-sm">Seus ingressos foram gerados com sucesso.</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 w-full max-w-sm text-sm text-gray-600 space-y-2">
          <p className="font-semibold text-gray-900">{evento.titulo}</p>
          <p>{quantidade} ingresso{quantidade > 1 ? "s" : ""} · {totalFmt}</p>
          {metodo === "cartao" && parcelas > 1 && (
            <p className="text-xs text-gray-400">{parcelas}x de {(total / parcelas).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} sem juros</p>
          )}
          {ingressosCriados.length > 0 && (
            <div className="pt-2 border-t border-gray-100 space-y-1">
              {ingressosCriados.map((ing) => (
                <p key={ing.id} className="text-xs font-mono bg-gray-50 rounded px-2 py-1 text-gray-700">🎟 {ing.codigo}</p>
              ))}
            </div>
          )}
          <p className="text-xs text-gray-400">Confirmação enviada para {email}</p>
        </div>
        <div className="flex gap-3 w-full max-w-sm">
          <button onClick={() => navigate("/eventos/perfil")} className="flex-1 py-3 rounded-xl text-white font-bold text-sm" style={{ backgroundColor: GREEN }}>
            Meus ingressos
          </button>
          <button onClick={() => navigate("/eventos")} className="flex-1 py-3 rounded-xl font-bold text-sm border border-gray-200 text-gray-700">
            Ver eventos
          </button>
        </div>
      </div>
    );
  }

  // ── Checkout principal ─────────────────────────────────────────────────────
  const dataInicio = new Date(evento.data_inicio);
  const dataFmt = format(dataInicio, "dd/MM/yyyy", { locale: ptBR });
  const hora = evento.hora_inicio || format(dataInicio, "HH:mm");

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-40 shadow-sm bg-white">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">
            <button onClick={() => navigate(`/eventos/${id}`)} className="flex items-center gap-2 text-gray-700 hover:text-gray-900">
              <ArrowLeft className="w-5 h-5" /><span className="text-sm font-medium">Voltar</span>
            </button>
            <img src={logoPath} alt="Clube do Grito" className="h-9 object-contain rounded-full" />
            <div className="w-16" />
          </div>
        </div>
        <div className="h-1" style={{ backgroundColor: RED }} />
      </header>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 pb-32 space-y-5">
        <h1 className="font-bold text-gray-900 text-xl">Checkout</h1>

        {/* Resumo */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-bold text-gray-900 text-sm flex items-center gap-2">
              <Ticket className="w-4 h-4" style={{ color: BRAND }} />
              Resumo do pedido
            </h2>
          </div>
          <div className="px-5 py-4 space-y-3">
            {evento.banner_url ? (
              <img src={evento.banner_url} alt={evento.titulo} className="w-full h-32 object-cover rounded-xl" />
            ) : (
              <div className="w-full h-20 rounded-xl flex items-center justify-center text-4xl" style={{ background: "linear-gradient(135deg, #f59e0b22, #f59e0b44)" }}>🎉</div>
            )}
            <p className="font-bold text-gray-900 text-base">{evento.titulo}</p>
            <div className="flex flex-wrap gap-3 text-xs text-gray-500">
              <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{dataFmt}</span>
              <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{hora}</span>
              {evento.local && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{evento.local}</span>}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
              <div>
                <p className="text-sm font-semibold text-gray-800">Quantidade</p>
                <p className="text-xs text-gray-400">{unitFmt} por ingresso</p>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => setQuantidade(q => Math.max(1, q - 1))} disabled={quantidade <= 1 || isPending}
                  className="w-8 h-8 rounded-full border-2 flex items-center justify-center text-gray-600 disabled:opacity-40"
                  style={{ borderColor: quantidade > 1 ? BRAND : undefined }}>
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-7 text-center font-bold text-lg text-gray-900">{quantidade}</span>
                <button onClick={() => setQuantidade(q => Math.min(maxQty, q + 1))} disabled={quantidade >= maxQty || isPending}
                  className="w-8 h-8 rounded-full border-2 flex items-center justify-center text-gray-600 disabled:opacity-40"
                  style={{ borderColor: quantidade < maxQty ? BRAND : undefined }}>
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
              <span className="text-gray-600 text-sm font-medium">Total</span>
              <span className="font-bold text-gray-900 text-xl">{totalFmt}</span>
            </div>
          </div>
        </section>

        {/* Dados do comprador */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-bold text-gray-900 text-sm flex items-center gap-2">
              <User className="w-4 h-4" style={{ color: GREEN }} />
              Dados do comprador
            </h2>
            {dadosOk && <CheckCircle className="w-4 h-4 text-green-500" />}
          </div>
          <div className="px-5 py-4 space-y-3">
            {[
              { label: "Nome completo *", value: nome, setter: setNome, placeholder: "Seu nome completo", type: "text" },
              { label: "CPF *", value: cpf, setter: (v: string) => setCpf(formatCPF(v)), placeholder: "000.000.000-00", type: "text" },
              { label: "E-mail *", value: email, setter: setEmail, placeholder: "seu@email.com", type: "email" },
              { label: "Telefone / WhatsApp *", value: telefone, setter: (v: string) => setTelefone(formatPhone(v)), placeholder: "(11) 99999-9999", type: "tel" },
            ].map(({ label, value, setter, placeholder, type }) => (
              <div key={label}>
                <label className="text-xs font-medium text-gray-600 block mb-1">{label}</label>
                <input type={type} value={value} onChange={e => setter(e.target.value)} placeholder={placeholder}
                  disabled={isPending}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 bg-gray-50 disabled:opacity-60" />
              </div>
            ))}
          </div>
        </section>

        {/* Forma de pagamento */}
        {dadosOk && (
          <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                <CreditCard className="w-4 h-4" style={{ color: RED }} />
                Forma de pagamento
              </h2>
            </div>
            <div className="px-5 py-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => {
                    if (metodo !== "pix") resetIdempotencyKey();
                    setMetodo("pix");
                    setErroMsg(null);
                  }}
                  disabled={isPending}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${metodo === "pix" ? "border-green-500 bg-green-50" : "border-gray-200 hover:border-gray-300"}`}
                >
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                    <QrCode className="w-5 h-5 text-green-600" />
                  </div>
                  <span className="text-sm font-bold text-gray-900">PIX</span>
                  <span className="text-xs text-green-600 font-medium">Pagamento imediato</span>
                </button>

                <button
                  onClick={() => {
                    if (metodo !== "cartao") resetIdempotencyKey();
                    setMetodo("cartao");
                    setErroMsg(null);
                  }}
                  disabled={isPending}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${metodo === "cartao" ? "border-red-500 bg-red-50" : "border-gray-200 hover:border-gray-300"}`}
                >
                  <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-red-600" />
                  </div>
                  <span className="text-sm font-bold text-gray-900">Cartão</span>
                  <span className="text-xs text-red-600 font-medium">Até 10x sem juros</span>
                </button>
              </div>

              {/* PIX — info */}
              {metodo === "pix" && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 space-y-2">
                  <div className="flex items-center gap-2 text-green-700">
                    <QrCode className="w-4 h-4 shrink-0" />
                    <p className="text-sm font-semibold">Pague com PIX</p>
                  </div>
                  <p className="text-xs text-green-600">
                    Ao confirmar, um QR Code será gerado no valor de <strong>{totalFmt}</strong>. O pagamento é confirmado em segundos.
                  </p>
                </div>
              )}

              {/* Cartão — formulário */}
              {metodo === "cartao" && (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-gray-600 block mb-1">Número do cartão *</label>
                    <div className="relative">
                      <CreditCard className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input type="text" value={cardNumber} onChange={e => setCardNumber(formatCard(e.target.value))}
                        placeholder="0000 0000 0000 0000" inputMode="numeric" disabled={isPending}
                        className="w-full border border-gray-200 rounded-xl pl-10 pr-16 py-3 text-sm focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-400 bg-gray-50 font-mono tracking-wider disabled:opacity-60" />
                      {bandeira && (
                        <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                          {bandeira}
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-gray-600 block mb-1">Nome no cartão *</label>
                    <input type="text" value={cardName} onChange={e => setCardName(e.target.value.toUpperCase())}
                      placeholder="NOME COMO NO CARTÃO" disabled={isPending}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-400 bg-gray-50 font-mono tracking-wider uppercase disabled:opacity-60" />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-gray-600 block mb-1">Validade *</label>
                      <input type="text" value={cardExpiry} onChange={e => setCardExpiry(formatExpiry(e.target.value))}
                        placeholder="MM/AA" inputMode="numeric" maxLength={5} disabled={isPending}
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-400 bg-gray-50 font-mono disabled:opacity-60" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600 block mb-1">CVV *</label>
                      <div className="relative">
                        <input type="password" value={cardCvv} onChange={e => setCardCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                          placeholder="•••" inputMode="numeric" maxLength={4} disabled={isPending}
                          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-400 bg-gray-50 font-mono disabled:opacity-60" />
                        <Lock className="absolute right-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                      </div>
                    </div>
                  </div>

                  {/* Parcelamento */}
                  <div>
                    <label className="text-xs font-medium text-gray-600 block mb-1">Parcelamento</label>
                    <select value={parcelas} onChange={e => setParcelas(parseInt(e.target.value))} disabled={isPending}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-400 bg-gray-50 text-gray-800 disabled:opacity-60">
                      {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
                        <option key={n} value={n}>
                          {n}x de {(total / n).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} sem juros
                          {n === 1 ? " (à vista)" : ""}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-400 mt-1 text-right">Total: <strong>{totalFmt}</strong></p>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-gray-400 pt-1">
                    <ShieldCheck className="w-4 h-4 text-green-500 flex-shrink-0" />
                    Seus dados estão protegidos com criptografia SSL
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* ── Privacidade no evento ─────────────────────────────── */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 bg-yellow-50 flex items-center gap-2">
            <div className="w-7 h-7 bg-yellow-400 rounded-full flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-3.5 h-3.5 text-black" />
            </div>
            <h2 className="font-bold text-gray-900 text-sm">Privacidade no evento</h2>
          </div>
          <div className="px-5 py-4 space-y-3">
            <p className="text-xs text-gray-600 leading-relaxed">
              Usaremos seus dados para processar sua inscrição, emitir ingresso, confirmar presença,
              enviar informações sobre o evento e cumprir obrigações legais e de segurança.
            </p>
            <div className="space-y-2.5">
              {/* Obrigatório */}
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={e => setTermsAccepted(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded accent-yellow-400 flex-shrink-0"
                />
                <span className="text-xs text-gray-700 leading-relaxed">
                  <span className="text-red-500 font-bold mr-0.5">*</span>
                  Li e aceito os{" "}
                  <button type="button" onClick={() => navigate("/termos-de-uso")} className="underline text-gray-500 hover:text-gray-700">Termos de Uso</button>
                  {" "}e a{" "}
                  <button type="button" onClick={() => navigate("/politica-de-privacidade")} className="underline text-gray-500 hover:text-gray-700">Política de Privacidade</button>.
                </span>
              </label>
              {/* Comunicação — opcional */}
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={marketingAccepted}
                  onChange={e => setMarketingAccepted(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded accent-yellow-400 flex-shrink-0"
                />
                <span className="text-xs text-gray-700 leading-relaxed">
                  Aceito receber comunicações do Instituto O Grito sobre eventos, campanhas e novidades.
                </span>
              </label>
              {/* Uso de imagem — opcional */}
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={imageAccepted}
                  onChange={e => setImageAccepted(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded accent-yellow-400 flex-shrink-0"
                />
                <span className="text-xs text-gray-700 leading-relaxed">
                  Autorizo o uso da minha imagem em registros institucionais do evento (redes sociais, site, relatórios e campanhas).{" "}
                  <button type="button" onClick={() => navigate("/politica-de-uso-de-imagem")} className="underline text-gray-500 hover:text-gray-700">Saber mais</button>
                </span>
              </label>
            </div>
            <p className="text-xs text-gray-400"><span className="text-red-500 font-bold">*</span> Obrigatório para continuar.</p>
          </div>
        </section>

        {/* Erro */}
        {erroMsg && (
          <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
            <p className="text-sm text-red-700">{erroMsg}</p>
          </div>
        )}
      </div>

      {/* CTA fixo no rodapé */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg px-4 py-3 z-30">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-500">{quantidade} ingresso{quantidade > 1 ? "s" : ""}{metodo === "cartao" && parcelas > 1 ? ` · ${parcelas}x` : ""}</span>
            <span className="font-bold text-gray-900 text-base">
              {metodo === "cartao" && parcelas > 1
                ? `${parcelas}x de ${(total / parcelas).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}`
                : totalFmt}
            </span>
          </div>

          {!dadosOk ? (
            <button disabled className="w-full py-3.5 rounded-xl font-bold text-sm bg-gray-200 text-gray-400 cursor-not-allowed">
              Preencha seus dados para continuar
            </button>
          ) : !metodo ? (
            <button disabled className="w-full py-3.5 rounded-xl font-bold text-sm bg-gray-200 text-gray-400 cursor-not-allowed">
              Selecione a forma de pagamento
            </button>
          ) : metodo === "pix" ? (
            <button
              onClick={handlePagar}
              disabled={isPending}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm transition-all shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ backgroundColor: "#16a34a", color: "#fff" }}
            >
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <QrCode className="w-4 h-4" />}
              {isPending ? "Gerando QR Code..." : `Gerar QR Code PIX · ${totalFmt}`}
            </button>
          ) : (
            <button
              onClick={handlePagar}
              disabled={!cartaoOk || isPending}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm transition-all shadow-md disabled:opacity-40 disabled:cursor-not-allowed"
              style={cartaoOk && !isPending ? { backgroundColor: YELLOW, color: "#1a1a1a" } : { backgroundColor: "#e5e7eb", color: "#9ca3af" }}
            >
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
              {isPending ? "Processando pagamento..." : `Pagar ${parcelas > 1 ? `${parcelas}x de ${(total / parcelas).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}` : totalFmt}`}
              {cartaoOk && !isPending && <ChevronRight className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
