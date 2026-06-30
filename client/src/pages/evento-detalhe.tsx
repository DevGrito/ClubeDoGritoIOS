import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import {
  ArrowLeft, Share2, MapPin, Calendar, Clock, Users, Ticket,
  ChevronRight, UserCircle, CheckCircle, Plus, Minus, UserCheck, UserX,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import logoPath from "../app-assets/Logo_Clube_Do_grito.png";
import { usePortalAuth } from "../hooks/usePortalAuth";
import LoginModal from "../components/portal/LoginModal";
import IngressoPDF from "../components/IngressoPDF";

const BRAND = "#f59e0b";
const GREEN = "#058d4c";
const YELLOW = "#ffcc00";
const RED = "#a90302";

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    disponivel: { label: "Disponível", cls: "bg-green-500" },
    em_breve: { label: "Em breve", cls: "bg-amber-500" },
    encerrado: { label: "Encerrado", cls: "bg-gray-400" },
  };
  const s = map[status] || map["em_breve"];
  return (
    <span className={`${s.cls} text-white text-sm font-bold px-3 py-1 rounded-full`}>{s.label}</span>
  );
}

function formatCPF(value: string): string {
  const n = value.replace(/\D/g, "").slice(0, 11);
  if (n.length <= 3) return n;
  if (n.length <= 6) return `${n.slice(0,3)}.${n.slice(3)}`;
  if (n.length <= 9) return `${n.slice(0,3)}.${n.slice(3,6)}.${n.slice(6)}`;
  return `${n.slice(0,3)}.${n.slice(3,6)}.${n.slice(6,9)}-${n.slice(9)}`;
}

function validarCPF(cpf: string): boolean {
  const n = cpf.replace(/\D/g, "");
  if (n.length !== 11 || /^(\d)\1+$/.test(n)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(n[i]) * (10 - i);
  let rest = (sum * 10) % 11;
  if (rest === 10 || rest === 11) rest = 0;
  if (rest !== parseInt(n[9])) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(n[i]) * (11 - i);
  rest = (sum * 10) % 11;
  if (rest === 10 || rest === 11) rest = 0;
  return rest === parseInt(n[10]);
}

interface SlotIngresso {
  para_terceiro: boolean;
  beneficiario_nome: string;
  beneficiario_cpf: string;
  beneficiario_cpf_erro: string;
  beneficiario_nascimento: string;
  beneficiario_genero: string;
  beneficiario_logradouro: string;
  beneficiario_numero: string;
  beneficiario_bairro: string;
  beneficiario_cidade: string;
  beneficiario_estado: string;
  beneficiario_cep: string;
}

function defaultSlot(forcarTerceiro = false): SlotIngresso {
  return {
    para_terceiro: forcarTerceiro,
    beneficiario_nome: "",
    beneficiario_cpf: "",
    beneficiario_cpf_erro: "",
    beneficiario_nascimento: "",
    beneficiario_genero: "",
    beneficiario_logradouro: "",
    beneficiario_numero: "",
    beneficiario_bairro: "",
    beneficiario_cidade: "",
    beneficiario_estado: "",
    beneficiario_cep: "",
  };
}

export default function EventoDetalhe() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const { user, isLoggedIn } = usePortalAuth();

  const [showLogin, setShowLogin] = useState(false);
  const [step, setStep] = useState<"idle" | "escolher" | "sucesso">("idle");
  const [quantidade, setQuantidade] = useState(1);
  const [slots, setSlots] = useState<SlotIngresso[]>([defaultSlot()]);
  const [ingressosResgatados, setIngressosResgatados] = useState<any[]>([]);
  const [ingressoPreview, setIngressoPreview] = useState<any | null>(null);

  const { data: evento, isLoading, isError } = useQuery<any>({
    queryKey: ["/api/eventos-grito", id],
    queryFn: async () => {
      const r = await fetch(`/api/eventos-grito/${id}`);
      if (!r.ok) throw new Error("Evento não encontrado");
      return r.json();
    },
  });

  // Verificar se o usuário já tem ingresso para este evento
  const { data: meusIngressosEvento } = useQuery<any[]>({
    queryKey: ["/api/portal/meus-ingressos", id],
    queryFn: async () => {
      const r = await fetch("/api/portal/meus-ingressos", { credentials: "include" });
      if (!r.ok) return [];
      const all = await r.json();
      return all.filter((ing: any) => String(ing.evento_id) === String(id) && ing.status !== "cancelado");
    },
    enabled: isLoggedIn,
  });
  const titularJaTem = (meusIngressosEvento?.length ?? 0) > 0;

  // Contar ingressos disponíveis
  const { data: disponiveisData } = useQuery<{ disponiveis: number; total: number }>({
    queryKey: ["/api/portal/eventos", id, "disponiveis"],
    queryFn: async () => {
      const r = await fetch(`/api/portal/eventos/${id}/disponiveis`);
      if (!r.ok) return { disponiveis: 0 };
      return r.json();
    },
    enabled: !!evento && evento.status === "disponivel",
  });

  const maxCompra = Math.min(disponiveisData?.disponiveis ?? 0, 10);

  const resgatarMutation = useMutation({
    mutationFn: async (lote: SlotIngresso[]) => {
      const r = await fetch(`/api/portal/eventos/${id}/resgatar`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ingressos: lote }),
      });
      if (!r.ok) {
        const e = await r.json();
        throw new Error(e.error || "Erro ao resgatar");
      }
      return r.json();
    },
    onSuccess: (data) => {
      setIngressosResgatados(data.ingressos || []);
      setStep("sucesso");
      queryClient.invalidateQueries({ queryKey: ["/api/portal/meus-ingressos"] });
      queryClient.invalidateQueries({ queryKey: ["/api/portal/eventos", id, "disponiveis"] });
    },
  });

  const handleShare = async () => {
    if (navigator.share) {
      try { await navigator.share({ title: evento?.titulo, url: window.location.href }); } catch {}
    } else {
      await navigator.clipboard.writeText(window.location.href);
    }
  };

  const handleIniciar = () => {
    if (!isLoggedIn) { setShowLogin(true); return; }
    // Evento pago: vai para tela de checkout
    if (evento && !evento.gratuito && evento.preco > 0) {
      navigate(`/eventos/${id}/checkout?qty=1`);
      return;
    }
    // Evento gratuito: abre modal de resgate
    setQuantidade(1);
    setSlots([defaultSlot(titularJaTem)]);
    setStep("escolher");
  };

  const handleChangeQuantidade = (delta: number) => {
    const next = Math.max(1, Math.min(maxCompra, quantidade + delta));
    setQuantidade(next);
    setSlots((prev) => {
      if (next > prev.length) {
        // Slots adicionais sempre para terceiro
        const extras = Array(next - prev.length).fill(null).map(() => defaultSlot(true));
        return [...prev, ...extras];
      }
      return prev.slice(0, next);
    });
  };

  const updateSlot = (idx: number, field: keyof SlotIngresso, value: any) => {
    setSlots((prev) => prev.map((s, i) => i === idx ? { ...s, [field]: value } : s));
  };

  const handleConfirmar = () => {
    // Validar CPFs de terceiros antes de enviar
    let cpfInvalido = false;
    const newSlots = slots.map(s => {
      if (s.para_terceiro && !validarCPF(s.beneficiario_cpf)) {
        cpfInvalido = true;
        return { ...s, beneficiario_cpf_erro: "CPF inválido" };
      }
      return { ...s, beneficiario_cpf_erro: "" };
    });
    if (cpfInvalido) { setSlots(newSlots); return; }
    resgatarMutation.mutate(slots);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: BRAND, borderTopColor: "transparent" }} />
      </div>
    );
  }

  if (isError || !evento) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4 p-8">
        <span className="text-5xl">😕</span>
        <p className="text-gray-600 font-medium text-lg">Evento não encontrado</p>
        <button onClick={() => navigate("/eventos")} className="text-white px-6 py-2 rounded-full font-medium" style={{ backgroundColor: BRAND }}>
          Ver todos os eventos
        </button>
      </div>
    );
  }

  const dataInicio = new Date(evento.data_inicio);
  const dataFmt = format(dataInicio, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  const hora = evento.hora_inicio || format(dataInicio, "HH:mm");
  const precoFmt = evento.gratuito || evento.preco === 0 ? "Gratuito" : `R$ ${(evento.preco / 100).toFixed(2).replace(".", ",")}`;
  const podeResgatar = evento.status === "disponivel" && step !== "sucesso" && maxCompra > 0;
  const iniciais = user ? user.nome.split(" ").map((n: string) => n[0]).slice(0, 2).join("").toUpperCase() : "";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-40 shadow-sm bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <button onClick={() => navigate("/eventos")} className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors">
              <ArrowLeft className="w-5 h-5" />
              <span className="hidden sm:inline text-sm font-medium">Todos os eventos</span>
            </button>
            <img src={logoPath} alt="Clube do Grito" className="h-10 object-contain rounded-full" />
            <div className="flex items-center gap-2">
              <button onClick={handleShare} className="flex items-center gap-1.5 text-gray-700 hover:text-gray-900 transition-colors text-sm">
                <Share2 className="w-4 h-4" />
                <span className="hidden sm:inline font-medium">Compartilhar</span>
              </button>
              {isLoggedIn ? (
                <button onClick={() => navigate("/eventos/perfil")} className="ml-1 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shadow text-white" style={{ backgroundColor: GREEN }} title="Meu perfil">
                  {iniciais}
                </button>
              ) : (
                <button onClick={() => setShowLogin(true)} className="flex items-center justify-center w-8 h-8 rounded-full transition-colors ml-1 hover:bg-gray-100" title="Entrar">
                  <UserCircle className="w-5 h-5 text-gray-600" />
                </button>
              )}
            </div>
          </div>
        </div>
        {/* Linha vermelha separadora */}
        <div className="h-1" style={{ backgroundColor: RED }} />
      </header>

      {/* Hero banner */}
      <div className="relative w-full h-64 sm:h-80 lg:h-[420px] overflow-hidden bg-gray-200">
        {evento.banner_url ? (
          <img src={evento.banner_url} alt={evento.titulo} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)" }}>
            <span className="text-8xl sm:text-9xl">🎉</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 lg:p-10">
          <div className="max-w-5xl mx-auto">
            <StatusBadge status={evento.status} />
            <h1 className="mt-3 font-bold text-white text-2xl sm:text-3xl lg:text-4xl leading-tight drop-shadow">{evento.titulo}</h1>
            {evento.local && (
              <p className="mt-2 text-white/80 text-sm flex items-center gap-1">
                <MapPin className="w-4 h-4 flex-shrink-0" />
                {evento.local}{evento.cidade ? ` · ${evento.cidade}` : ""}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-36 lg:pb-12">
        <div className="lg:grid lg:grid-cols-5 lg:gap-10">
          {/* Coluna principal */}
          <div className="lg:col-span-3 space-y-5">
            {evento.descricao && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h2 className="font-bold text-gray-900 text-lg mb-3">Sobre o evento</h2>
                <p className="text-sm sm:text-base text-gray-600 leading-relaxed whitespace-pre-line">{evento.descricao}</p>
              </div>
            )}
            {/* Info mobile */}
            <div className="lg:hidden">
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <InfoCard evento={evento} dataFmt={dataFmt} hora={hora} brandColor={BRAND} />
                <div className="mt-5 pt-5 border-t flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">Ingresso</p>
                    <p className="font-bold text-gray-900 text-lg">{precoFmt}</p>
                  </div>
                  <StatusBadge status={evento.status} />
                </div>

              </div>
            </div>
          </div>

          {/* Sidebar desktop */}
          <div className="hidden lg:block lg:col-span-2">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 sticky top-24">
              <InfoCard evento={evento} dataFmt={dataFmt} hora={hora} brandColor={BRAND} />
              <div className="mt-5 pt-5 border-t">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-gray-500 text-sm">Ingresso</span>
                  <span className="font-bold text-gray-900 text-xl">{precoFmt}</span>
                </div>

                {step === "sucesso" ? (
                  <SucessoCard ingressos={ingressosResgatados} onVer={setIngressoPreview} onIr={() => navigate("/eventos/perfil")} />
                ) : (
                  <>
                    {disponiveisData && disponiveisData.total > 0 && disponiveisData.disponiveis > 0 &&
                      disponiveisData.disponiveis / disponiveisData.total <= 0.4 && (
                      <p className="text-red-600 text-xs font-bold text-center mb-2 animate-pulse">🔴 Últimos ingressos!</p>
                    )}
                    <CTAButton podeResgatar={podeResgatar} status={evento.status} disponiveis={disponiveisData?.disponiveis} gratuito={evento.gratuito} onClick={handleIniciar} />
                  </>
                )}
                {resgatarMutation.isError && (
                  <p className="text-red-500 text-xs text-center mt-2">{(resgatarMutation.error as Error).message}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA fixo — mobile */}
      <div className="fixed bottom-0 left-0 right-0 lg:hidden bg-white border-t shadow-lg px-4 py-3 z-30">
        <div className="max-w-md mx-auto">
          {step === "sucesso" ? (
            <SucessoCard ingressos={ingressosResgatados} onVer={setIngressoPreview} onIr={() => navigate("/eventos/perfil")} />
          ) : (
            <div className="flex flex-col gap-1">
              {disponiveisData && disponiveisData.total > 0 && disponiveisData.disponiveis > 0 &&
                disponiveisData.disponiveis / disponiveisData.total <= 0.4 && (
                <p className="text-red-600 text-xs font-bold text-center animate-pulse">🔴 Últimos ingressos!</p>
              )}
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <p className="text-xs text-gray-500">Ingresso</p>
                  <p className="font-bold text-gray-900">{precoFmt}</p>
                </div>
                <CTAButton podeResgatar={podeResgatar} status={evento.status} disponiveis={disponiveisData?.disponiveis} gratuito={evento.gratuito} onClick={handleIniciar} compact />
              </div>
            </div>
          )}
          {resgatarMutation.isError && (
            <p className="text-red-500 text-xs text-center mt-1">{(resgatarMutation.error as Error).message}</p>
          )}
        </div>
      </div>

      {/* Modal seleção de ingressos */}
      {step === "escolher" && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center" onClick={(e) => e.target === e.currentTarget && setStep("idle")}>
          <div className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b flex-shrink-0">
              <h3 className="font-bold text-gray-900 text-base">Resgatar Ingressos</h3>
              <button onClick={() => setStep("idle")} className="text-gray-400 hover:text-gray-600 transition-colors text-2xl leading-none">&times;</button>
            </div>

            <div className="overflow-y-auto flex-1 px-5 py-4 space-y-5">
              {/* Seletor de quantidade */}
              <div className="flex items-center justify-between bg-gray-50 rounded-xl p-4">
                <div>
                  <p className="font-semibold text-gray-900 text-sm">Quantos ingressos?</p>
                  <p className="text-xs text-gray-500 mt-0.5">Máximo {maxCompra} por pedido</p>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={() => handleChangeQuantidade(-1)} disabled={quantidade <= 1} className="w-9 h-9 rounded-full border-2 flex items-center justify-center text-gray-600 disabled:opacity-40 hover:border-amber-400 transition-colors" style={{ borderColor: quantidade > 1 ? BRAND : undefined }}>
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-8 text-center font-bold text-xl text-gray-900">{quantidade}</span>
                  <button onClick={() => handleChangeQuantidade(1)} disabled={quantidade >= maxCompra} className="w-9 h-9 rounded-full border-2 flex items-center justify-center text-gray-600 disabled:opacity-40 hover:border-amber-400 transition-colors" style={{ borderColor: quantidade < maxCompra ? BRAND : undefined }}>
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Cards por ingresso */}
              {slots.map((slot, idx) => {
                // Slot 0: "para mim" se titular ainda não tem ingresso; demais sempre terceiro
                const forcarTerceiro = titularJaTem || idx > 0;
                const podeMudar = !forcarTerceiro; // só slot 0 quando titular não tem ingresso
                return (
                <div key={idx} className="border border-gray-200 rounded-xl overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 bg-gray-50">
                    <span className="font-semibold text-gray-800 text-sm">Ingresso {idx + 1}</span>
                    <div className="flex gap-2">
                      {/* Para mim — disponível apenas no slot 0 quando titular não tem ingresso */}
                      {podeMudar ? (
                        <>
                          <button
                            onClick={() => updateSlot(idx, "para_terceiro", false)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${!slot.para_terceiro ? "text-white" : "bg-white border border-gray-200 text-gray-600 hover:border-amber-400"}`}
                            style={!slot.para_terceiro ? { backgroundColor: BRAND } : {}}
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                            Para mim
                          </button>
                          <button
                            onClick={() => updateSlot(idx, "para_terceiro", true)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${slot.para_terceiro ? "text-white" : "bg-white border border-gray-200 text-gray-600 hover:border-amber-400"}`}
                            style={slot.para_terceiro ? { backgroundColor: BRAND } : {}}
                          >
                            <UserX className="w-3.5 h-3.5" />
                            Para outra pessoa
                          </button>
                        </>
                      ) : (
                        <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-white" style={{ backgroundColor: BRAND }}>
                          <UserX className="w-3.5 h-3.5" />
                          Para outra pessoa
                        </span>
                      )}
                    </div>
                  </div>

                  {slot.para_terceiro && (
                    <div className="px-4 py-3 space-y-3">
                      <div>
                        <label className="text-xs font-medium text-gray-600 block mb-1">Nome completo *</label>
                        <input
                          type="text"
                          value={slot.beneficiario_nome}
                          onChange={(e) => updateSlot(idx, "beneficiario_nome", e.target.value)}
                          placeholder="Nome completo do portador"
                          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-600 block mb-1">CPF *</label>
                        <input
                          type="text"
                          value={slot.beneficiario_cpf}
                          onChange={(e) => {
                            const formatted = formatCPF(e.target.value);
                            setSlots(prev => prev.map((s, i) => i === idx ? { ...s, beneficiario_cpf: formatted, beneficiario_cpf_erro: "" } : s));
                          }}
                          onBlur={() => {
                            if (slot.beneficiario_cpf && !validarCPF(slot.beneficiario_cpf)) {
                              setSlots(prev => prev.map((s, i) => i === idx ? { ...s, beneficiario_cpf_erro: "CPF inválido" } : s));
                            }
                          }}
                          placeholder="000.000.000-00"
                          className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 ${slot.beneficiario_cpf_erro ? "border-red-400 focus:border-red-400 focus:ring-red-400" : "border-gray-200 focus:border-amber-400 focus:ring-amber-400"}`}
                        />
                        {slot.beneficiario_cpf_erro && <p className="text-red-500 text-xs mt-1">{slot.beneficiario_cpf_erro}</p>}
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-medium text-gray-600 block mb-1">Data de nascimento</label>
                          <input
                            type="date"
                            value={slot.beneficiario_nascimento}
                            onChange={(e) => updateSlot(idx, "beneficiario_nascimento", e.target.value)}
                            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-600 block mb-1">Gênero</label>
                          <select
                            value={slot.beneficiario_genero}
                            onChange={(e) => updateSlot(idx, "beneficiario_genero", e.target.value)}
                            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 bg-white"
                          >
                            <option value="">Selecionar</option>
                            <option value="masculino">Masculino</option>
                            <option value="feminino">Feminino</option>
                            <option value="nao_binario">Não binário</option>
                            <option value="outro">Outro</option>
                            <option value="prefiro_nao_informar">Prefiro não informar</option>
                          </select>
                        </div>
                      </div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide pt-1">Endereço *</p>
                      <div>
                        <label className="text-xs font-medium text-gray-600 block mb-1">CEP *</label>
                        <input
                          type="text"
                          value={slot.beneficiario_cep}
                          onChange={async (e) => {
                            const raw = e.target.value.replace(/\D/g, "").slice(0, 8);
                            const cepFmt = raw.length > 5 ? `${raw.slice(0,5)}-${raw.slice(5)}` : raw;
                            updateSlot(idx, "beneficiario_cep", cepFmt);
                            if (raw.length === 8) {
                              try {
                                const r = await fetch(`https://viacep.com.br/ws/${raw}/json/`);
                                const d = await r.json();
                                if (!d.erro) {
                                  setSlots(prev => prev.map((s, i) => i === idx ? {
                                    ...s,
                                    beneficiario_cep: cepFmt,
                                    beneficiario_logradouro: d.logradouro || s.beneficiario_logradouro,
                                    beneficiario_bairro: d.bairro || s.beneficiario_bairro,
                                    beneficiario_cidade: d.localidade || s.beneficiario_cidade,
                                    beneficiario_estado: d.uf || s.beneficiario_estado,
                                  } : s));
                                }
                              } catch {}
                            }
                          }}
                          placeholder="00000-000"
                          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="col-span-2">
                          <label className="text-xs font-medium text-gray-600 block mb-1">Logradouro *</label>
                          <input
                            type="text"
                            value={slot.beneficiario_logradouro}
                            onChange={(e) => updateSlot(idx, "beneficiario_logradouro", e.target.value)}
                            placeholder="Rua, Av..."
                            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-600 block mb-1">Número *</label>
                          <input
                            type="text"
                            value={slot.beneficiario_numero}
                            onChange={(e) => updateSlot(idx, "beneficiario_numero", e.target.value)}
                            placeholder="123"
                            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-600 block mb-1">Bairro *</label>
                        <input
                          type="text"
                          value={slot.beneficiario_bairro}
                          onChange={(e) => updateSlot(idx, "beneficiario_bairro", e.target.value)}
                          placeholder="Bairro"
                          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-medium text-gray-600 block mb-1">Cidade *</label>
                          <input
                            type="text"
                            value={slot.beneficiario_cidade}
                            onChange={(e) => updateSlot(idx, "beneficiario_cidade", e.target.value)}
                            placeholder="Cidade"
                            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-600 block mb-1">Estado *</label>
                          <select
                            value={slot.beneficiario_estado}
                            onChange={(e) => updateSlot(idx, "beneficiario_estado", e.target.value)}
                            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 bg-white"
                          >
                            <option value="">UF</option>
                            {["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"].map(uf => (
                              <option key={uf} value={uf}>{uf}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  )}

                  {!slot.para_terceiro && (
                    <div className="px-4 py-3 text-xs text-gray-400 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      Este ingresso será registrado em seu nome ({user?.nome})
                    </div>
                  )}
                </div>
              );
              })}
            </div>

            <div className="px-5 py-4 border-t flex-shrink-0">
              <button
                onClick={handleConfirmar}
                disabled={resgatarMutation.isPending || slots.some(s => s.para_terceiro && (
                  !s.beneficiario_nome.trim() || !s.beneficiario_cpf.trim() ||
                  !s.beneficiario_nascimento || !s.beneficiario_genero ||
                  !s.beneficiario_cep.trim() || !s.beneficiario_logradouro.trim() ||
                  !s.beneficiario_numero.trim() || !s.beneficiario_bairro.trim() ||
                  !s.beneficiario_cidade.trim() || !s.beneficiario_estado.trim()
                ))}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-white font-bold text-sm disabled:opacity-50 transition-opacity"
                style={{ backgroundColor: BRAND }}
              >
                <Ticket className="w-4 h-4" />
                {resgatarMutation.isPending ? "Processando..." : `Confirmar ${quantidade} ingresso${quantidade > 1 ? "s" : ""}`}
                {!resgatarMutation.isPending && <ChevronRight className="w-4 h-4" />}
              </button>
              {resgatarMutation.isError && (
                <p className="text-red-500 text-xs text-center mt-2">{(resgatarMutation.error as Error).message}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Login */}
      {showLogin && (
        <LoginModal
          onClose={() => setShowLogin(false)}
          message={evento && !evento.gratuito && evento.preco > 0 ? "Faça login para comprar seu ingresso" : "Faça login para resgatar seu ingresso"}
          onSuccess={() => {
            setShowLogin(false);
            if (evento && !evento.gratuito && evento.preco > 0) {
              navigate(`/eventos/${id}/checkout?qty=1`);
            } else {
              setStep("escolher");
            }
          }}
        />
      )}

      {/* Modal PDF */}
      {ingressoPreview && (
        <IngressoPDF ingresso={ingressoPreview} onClose={() => setIngressoPreview(null)} />
      )}
    </div>
  );
}

function CTAButton({ podeResgatar, status, disponiveis, gratuito, onClick, compact }: { podeResgatar: boolean; status: string; disponiveis?: number; gratuito?: boolean; onClick: () => void; compact?: boolean }) {
  const actionLabel = gratuito ? "Resgatar Ingresso" : "Comprar Ingresso";
  const label = status !== "disponivel" ? (status === "em_breve" ? "Em breve" : "Indisponível") : disponiveis === 0 ? "Ingressos esgotados" : actionLabel;
  const enabled = podeResgatar;

  return (
    <button
      disabled={!enabled}
      onClick={onClick}
      className={`${compact ? "flex-1" : "w-full"} flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all ${enabled ? "text-gray-900 shadow-md hover:opacity-90 active:scale-95" : "bg-gray-200 text-gray-400 cursor-not-allowed"}`}
      style={enabled ? { backgroundColor: YELLOW } : {}}
    >
      <Ticket className="w-4 h-4" />
      {label}
      {enabled && <ChevronRight className="w-4 h-4" />}
    </button>
  );
}

function SucessoCard({ ingressos, onVer, onIr }: { ingressos: any[]; onVer: (ing: any) => void; onIr: () => void }) {
  return (
    <div className="w-full flex flex-col items-center gap-3 py-3">
      <div className="flex items-center gap-2 text-green-700 font-bold text-sm">
        <CheckCircle className="w-5 h-5" />
        {ingressos.length} ingresso{ingressos.length > 1 ? "s" : ""} resgatado{ingressos.length > 1 ? "s" : ""}!
      </div>
      <div className="flex gap-2 w-full">
        {ingressos.length === 1 && (
          <button onClick={() => onVer(ingressos[0])} className="flex-1 py-2.5 rounded-xl border-2 font-semibold text-xs transition-colors" style={{ borderColor: BRAND, color: BRAND }}>
            Ver ingresso
          </button>
        )}
        <button onClick={onIr} className="flex-1 py-2.5 rounded-xl text-white font-semibold text-xs" style={{ backgroundColor: BRAND }}>
          Meus ingressos
        </button>
      </div>
    </div>
  );
}

function InfoCard({ evento, dataFmt, hora }: { evento: any; dataFmt: string; hora: string; brandColor?: string }) {
  return (
    <div className="space-y-3">
      <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl border-l-4" style={{ borderLeftColor: RED }}>
        <Calendar className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: GREEN }} />
        <div>
          <p className="text-xs font-semibold mb-0.5" style={{ color: GREEN }}>Data</p>
          <p className="text-sm font-medium text-gray-900 capitalize">{dataFmt}</p>
        </div>
      </div>
      <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl border-l-4" style={{ borderLeftColor: RED }}>
        <Clock className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: GREEN }} />
        <div>
          <p className="text-xs font-semibold mb-0.5" style={{ color: GREEN }}>Horário</p>
          <p className="text-sm font-medium text-gray-900">{hora}{evento.hora_fim ? ` às ${evento.hora_fim}` : ""}</p>
        </div>
      </div>
      {evento.local && (
        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl border-l-4" style={{ borderLeftColor: RED }}>
          <MapPin className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: GREEN }} />
          <div>
            <p className="text-xs font-semibold mb-0.5" style={{ color: GREEN }}>Local</p>
            <p className="text-sm font-medium text-gray-900">{evento.local}</p>
            {evento.endereco && <p className="text-xs text-gray-500 mt-0.5">{evento.endereco}</p>}
            {evento.cidade && <p className="text-xs text-gray-500">{evento.cidade} - {evento.estado}</p>}
          </div>
        </div>
      )}
    </div>
  );
}
