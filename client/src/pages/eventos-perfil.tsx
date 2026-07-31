import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, User, Mail, MapPin, Calendar, Ticket, LogOut, QrCode, Download,
         UserCheck, UserX, CheckCircle, ArrowRightLeft, X, AlertTriangle, Gift,
         Clock, Ban, ThumbsUp, ThumbsDown } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { usePortalAuth } from "../hooks/usePortalAuth";
import logoPath from "../app-assets/Logo_Clube_Do_grito.png";
import IngressoPDF from "../components/IngressoPDF";
import { formatCPF, validarCPF, validarEmail } from "@/lib/validators";

const BRAND = "#f59e0b";
const GREEN = "#058d4c";
const YELLOW = "#ffcc00";

type Tab = "dados" | "ingressos";

export default function EventosPerfil() {
  const [, navigate] = useLocation();
  const { user, isLoggedIn, isLoading, logout } = usePortalAuth();
  const [tab, setTab] = useState<Tab>("dados");

  const { data: ingressos = [], isLoading: loadingIngressos, isError: erroIngressos, refetch: refetchIngressos } = useQuery<any[]>({
    queryKey: ["/api/portal/meus-ingressos"],
    queryFn: async () => {
      const r = await fetch("/api/portal/meus-ingressos", { credentials: "include" });
      if (r.status === 401) throw new Error("Não autenticado");
      if (!r.ok) throw new Error("Erro ao carregar ingressos");
      return r.json();
    },
    enabled: isLoggedIn,
    retry: false,
  });

  const { data: pendentes = [], isLoading: loadingPendentes, isError: erroPendentes, refetch: refetchPendentes } = useQuery<any[]>({
    queryKey: ["/api/portal/ingressos-pendentes"],
    queryFn: async () => {
      const r = await fetch("/api/portal/ingressos-pendentes", { credentials: "include" });
      if (r.status === 401) throw new Error("Não autenticado");
      if (!r.ok) throw new Error("Erro ao carregar transferências");
      return r.json();
    },
    enabled: isLoggedIn,
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: BRAND, borderTopColor: "transparent" }} />
      </div>
    );
  }

  if (!isLoggedIn) { navigate("/eventos"); return null; }

  const iniciais = user!.nome.split(" ").map((n: string) => n[0]).slice(0, 2).join("").toUpperCase();
  const totalBadge = ingressos.length + pendentes.length;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-40 bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-3 h-16">
            <button onClick={() => navigate("/eventos")} className="text-gray-500 hover:text-gray-800 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <img src={logoPath} alt="Clube do Grito" className="h-12 w-12 rounded-full object-contain flex-shrink-0" />
            <h1 className="font-bold text-gray-900 text-lg flex-1">Minha Conta</h1>
            <button
              onClick={async () => { await logout(); navigate("/eventos"); }}
              className="flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-full border transition-colors hover:bg-gray-50"
              style={{ color: GREEN, borderColor: GREEN }}
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </div>
        {/* Barra verde + amarela na base do header */}
        <div className="flex h-1">
          <div className="flex-1" style={{ backgroundColor: GREEN }} />
          <div className="w-16" style={{ backgroundColor: YELLOW }} />
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-md flex-shrink-0" style={{ backgroundColor: GREEN }}>
            {iniciais}
          </div>
          <div>
            <h2 className="font-bold text-gray-900 text-xl">{user!.nome}</h2>
            <p className="text-gray-500 text-sm">{user!.email}</p>
          </div>
        </div>

        <div className="flex gap-1 bg-gray-200 p-1 rounded-xl mb-5">
          {(["dados", "ingressos"] as Tab[]).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${tab === t ? "bg-white shadow-sm" : "text-gray-600 hover:text-gray-800"}`}
              style={tab === t ? { color: GREEN } : {}}
            >
              {t === "dados" ? <><User className="w-4 h-4" />Meus Dados</> : <>
                <Ticket className="w-4 h-4" />
                Ingressos
                {totalBadge > 0 && <span className="text-gray-900 text-xs font-bold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: YELLOW }}>{totalBadge}</span>}
              </>}
            </button>
          ))}
        </div>

        {tab === "dados" && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-4">
            <InfoRow icon={<User className="w-4 h-4" />} label="Nome completo" value={user!.nome} />
            <InfoRow icon={<Mail className="w-4 h-4" />} label="E-mail" value={user!.email} />
            {user!.dataNascimento && (
              <InfoRow icon={<Calendar className="w-4 h-4" />} label="Data de nascimento"
                value={format(new Date(user!.dataNascimento + "T00:00:00"), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })} />
            )}
            {user!.genero && (
              <InfoRow icon={<User className="w-4 h-4" />} label="Gênero"
                value={{ masculino: "Masculino", feminino: "Feminino", nao_binario: "Não-binário" }[user!.genero as string] || "Prefiro não informar"} />
            )}
            {(user!.logradouro || user!.cidade) && (
              <InfoRow icon={<MapPin className="w-4 h-4" />} label="Endereço"
                value={[user!.logradouro, user!.numero, user!.bairro, user!.cidade && user!.estado ? `${user!.cidade} - ${user!.estado}` : user!.cidade].filter(Boolean).join(", ")} />
            )}
          </div>
        )}

        {tab === "ingressos" && (
          <div className="space-y-4">
            {(erroIngressos || erroPendentes) && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-sm text-red-700 space-y-2">
                <p>Não foi possível carregar seus ingressos.</p>
                <button
                  onClick={() => { refetchIngressos(); refetchPendentes(); }}
                  className="text-xs font-semibold underline"
                >
                  Tentar novamente
                </button>
              </div>
            )}
            {/* Aviso sobre transferência */}
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3">
              <ArrowRightLeft className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800">
                <p className="font-semibold mb-1">Transferência de ingresso</p>
                <p className="text-amber-700 text-xs leading-relaxed">
                  Não poderá ir ao evento? Transfira para outra pessoa. O receptor <strong>precisa ter uma conta</strong> cadastrada. Clique em "Transferir" no ingresso desejado.
                </p>
              </div>
            </div>

            {/* Ingressos pendentes — para o receptor */}
            {pendentes.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                  <Gift className="w-4 h-4 text-amber-500" />
                  Ingressos aguardando você ({pendentes.length})
                </h3>
                {pendentes.map((ing: any) => (
                  <IngressoPendenteCard key={ing.id} ingresso={ing} />
                ))}
                <div className="border-t border-gray-200" />
              </div>
            )}

            {loadingIngressos || loadingPendentes ? (
              <div className="flex justify-center py-12">
                <div className="w-7 h-7 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: BRAND, borderTopColor: "transparent" }} />
              </div>
            ) : ingressos.length === 0 && pendentes.length === 0 ? (
              <div className="bg-white rounded-2xl p-10 shadow-sm border border-gray-100 flex flex-col items-center text-center">
                <Ticket className="w-12 h-12 text-gray-300 mb-3" />
                <p className="text-gray-500 font-medium">Nenhum ingresso ainda</p>
                <p className="text-gray-400 text-sm mt-1">Explore os eventos e resgate seu ingresso!</p>
                <button onClick={() => navigate("/eventos")} className="mt-4 px-6 py-2.5 rounded-xl text-white font-semibold text-sm" style={{ backgroundColor: GREEN }}>
                  Ver eventos
                </button>
              </div>
            ) : (
              ingressos.map((ing: any) => <IngressoCard key={ing.id} ingresso={ing} />)
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#e6f5ee", color: GREEN }}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-400 font-medium">{label}</p>
        <p className="text-sm font-semibold text-gray-800 mt-0.5 break-words">{value}</p>
      </div>
    </div>
  );
}

// Card para ingresso pendente (receptor aceita ou recusa)
function IngressoPendenteCard({ ingresso }: { ingresso: any }) {
  const [aceitando, setAceitando] = useState(false);
  const [recusando, setRecusando] = useState(false);
  const [autoTerceiro, setAutoTerceiro] = useState(false);
  const [feito, setFeito] = useState<"aceito" | "recusado" | null>(null);
  const [erro, setErro] = useState("");
  const queryClient = useQueryClient();

  const dataEvento = ingresso.evento_data_inicio;

  const handleAceitar = async () => {
    setAceitando(true); setErro("");
    try {
      const r = await fetch(`/api/portal/ingressos/${ingresso.codigo}/receber`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const d = await r.json();
      if (!r.ok) { setErro(d.error || "Erro ao aceitar ingresso"); return; }
      setAutoTerceiro(!!d.auto_terceiro);
      setFeito("aceito");
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["/api/portal/meus-ingressos"] });
        queryClient.invalidateQueries({ queryKey: ["/api/portal/ingressos-pendentes"] });
      }, 2000);
    } catch { setErro("Erro de conexão."); }
    finally { setAceitando(false); }
  };

  const handleRecusar = async () => {
    setRecusando(true); setErro("");
    try {
      const r = await fetch(`/api/portal/ingressos/${ingresso.codigo}/recusar`, {
        method: "POST", credentials: "include",
      });
      const d = await r.json();
      if (!r.ok) { setErro(d.error || "Erro ao recusar"); return; }
      setFeito("recusado");
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["/api/portal/ingressos-pendentes"] });
      }, 1500);
    } catch { setErro("Erro de conexão."); }
    finally { setRecusando(false); }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden" style={{ border: `2px solid ${GREEN}` }}>
      <div className="h-1.5" style={{ backgroundColor: GREEN }} />
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div>
            <h3 className="font-bold text-gray-900 text-sm">{ingresso.evento_titulo || "Evento"}</h3>
            {dataEvento && (
              <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {format(new Date(dataEvento), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </p>
            )}
            {ingresso.evento_local && (
              <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                <MapPin className="w-3 h-3" />{ingresso.evento_local}
              </p>
            )}
          </div>
          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 flex-shrink-0">Aguardando você</span>
        </div>

        <div className="bg-amber-50 rounded-lg px-3 py-2 mb-3 flex items-center gap-2 text-xs text-amber-800">
          <Gift className="w-3.5 h-3.5 flex-shrink-0" />
          <span><strong>{ingresso.transferido_de_nome || "Alguém"}</strong> enviou este ingresso para você!</span>
        </div>

        <div className="flex items-center gap-2 text-gray-400 mb-4">
          <QrCode className="w-4 h-4" />
          <span className="text-xs font-mono tracking-wider">{ingresso.codigo}</span>
        </div>

        {erro && <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2 mb-3">{erro}</p>}

        {feito === "aceito" && (
          <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-green-800">Ingresso recebido!</p>
              {autoTerceiro && (
                <p className="text-xs text-green-700 mt-0.5">
                  Como você já tem um ingresso nesse evento, este foi atribuído como ingresso para terceiro.
                </p>
              )}
            </div>
          </div>
        )}

        {feito === "recusado" && (
          <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 flex items-center gap-3">
            <Ban className="w-5 h-5 text-gray-400 flex-shrink-0" />
            <p className="text-sm text-gray-600">Transferência recusada.</p>
          </div>
        )}

        {feito === null && (
          <div className="flex gap-2">
            <button
              onClick={handleRecusar}
              disabled={recusando || aceitando}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-gray-100 text-gray-600 text-sm font-semibold hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              <ThumbsDown className="w-4 h-4" />
              {recusando ? "..." : "Recusar"}
            </button>
            <button
              onClick={handleAceitar}
              disabled={aceitando || recusando}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-50 transition-colors"
              style={{ backgroundColor: GREEN }}
            >
              <ThumbsUp className="w-4 h-4" />
              {aceitando ? "Recebendo..." : "Aceitar ingresso"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Modal de transferência
function TransferirModal({ ingresso, onClose }: { ingresso: any; onClose: () => void }) {
  const [etapa, setEtapa] = useState<"aviso" | "form" | "sucesso">("aviso");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [receptor, setReceptor] = useState<{ nome: string; email: string } | null>(null);
  const queryClient = useQueryClient();

  const handleTransferir = async () => {
    if (!nome.trim() || !email.trim()) { setErro("Preencha nome e e-mail."); return; }
    if (!validarEmail(email)) { setErro("E-mail inválido. Verifique o formato."); return; }
    setEnviando(true); setErro("");
    try {
      const r = await fetch(`/api/portal/ingressos/${ingresso.codigo}/transferir`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receptor_nome: nome, receptor_email: email }),
      });
      const d = await r.json();
      if (!r.ok) { setErro(d.error || "Erro ao transferir"); return; }
      setReceptor(d.receptor);
      setEtapa("sucesso");
      queryClient.invalidateQueries({ queryKey: ["/api/portal/meus-ingressos"] });
    } catch { setErro("Erro de conexão."); }
    finally { setEnviando(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        <div className="h-1.5" style={{ backgroundColor: BRAND }} />
        <div className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <ArrowRightLeft className="w-5 h-5 text-amber-500" />
              Transferir ingresso
            </h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
          </div>

          <p className="text-xs text-gray-500 mb-4 bg-gray-50 rounded-lg px-3 py-2 font-mono">
            {ingresso.evento_titulo} · {ingresso.codigo}
          </p>

          {etapa === "aviso" && (
            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2">
                <p className="text-sm font-semibold text-amber-800 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Antes de continuar
                </p>
                <ul className="text-xs text-amber-700 space-y-1 list-disc list-inside">
                  <li>O ingresso ficará como <strong>"Aguardando aceite"</strong> até o receptor confirmar</li>
                  <li>O receptor precisa ter uma <strong>conta cadastrada</strong> com o e-mail informado</li>
                  <li>Você pode cancelar enquanto o receptor não aceitar</li>
                  <li>Após a transferência ser aceita, <strong>não é possível transferir novamente</strong></li>
                </ul>
              </div>
              <div className="flex gap-2">
                <button onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-gray-100 text-gray-600 text-sm font-semibold">Cancelar</button>
                <button onClick={() => setEtapa("form")} className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold" style={{ backgroundColor: BRAND }}>
                  Entendi, continuar
                </button>
              </div>
            </div>
          )}

          {etapa === "form" && (
            <div className="space-y-3">
              <p className="text-sm text-gray-600">Informe os dados de quem vai receber o ingresso:</p>
              {erro && <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{erro}</p>}
              <div>
                <label className="text-xs text-gray-500 block mb-1">Nome completo do receptor *</label>
                <input type="text" placeholder="Nome completo" value={nome} onChange={e => setNome(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400" />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">E-mail cadastrado no sistema *</label>
                <input type="email" placeholder="email@exemplo.com" value={email} onChange={e => setEmail(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400" />
              </div>
              <div className="flex gap-2 pt-1">
                <button onClick={() => setEtapa("aviso")} className="flex-1 py-2.5 rounded-xl bg-gray-100 text-gray-600 text-sm font-semibold">Voltar</button>
                <button
                  onClick={handleTransferir}
                  disabled={enviando || !nome.trim() || !email.trim()}
                  className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-50"
                  style={{ backgroundColor: BRAND }}
                >
                  {enviando ? "Verificando..." : "Transferir"}
                </button>
              </div>
            </div>
          )}

          {etapa === "sucesso" && receptor && (
            <div className="space-y-4 text-center">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">Transferência enviada!</p>
                <p className="text-sm text-gray-500 mt-1">
                  <strong>{receptor.nome}</strong> ({receptor.email}) precisa entrar na conta e aceitar o ingresso.
                </p>
              </div>
              <p className="text-xs text-gray-400 bg-gray-50 rounded-lg px-3 py-2">
                Seu ingresso ficará como "Aguardando aceite". Você pode cancelar a qualquer momento antes do aceite.
              </p>
              <button onClick={onClose} className="w-full py-2.5 rounded-xl text-white text-sm font-semibold" style={{ backgroundColor: BRAND }}>
                Fechar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Card principal do ingresso (titular/User 1)
function IngressoCard({ ingresso }: { ingresso: any }) {
  // Ingresso extra: para_terceiro=true mas sem beneficiário definido → precisa atribuição obrigatória
  const needsAssignment = ingresso.para_terceiro === true && !ingresso.beneficiario_nome;

  const [showPDF, setShowPDF] = useState(false);
  const [showAtribuir, setShowAtribuir] = useState(needsAssignment);
  const [showTransferir, setShowTransferir] = useState(false);
  const [form, setForm] = useState({
    beneficiario_nome: "", beneficiario_cpf: "", beneficiario_email: "", beneficiario_telefone: "",
    beneficiario_nascimento: "", beneficiario_genero: "",
    beneficiario_logradouro: "", beneficiario_numero: "", beneficiario_bairro: "",
    beneficiario_cidade: "", beneficiario_estado: "", beneficiario_cep: "",
  });
  const [salvando, setSalvando] = useState(false);
  const [salvoOk, setSalvoOk] = useState(false);
  const [cancelando, setCancelando] = useState(false);
  const [cpfBenefErro, setCpfBenefErro] = useState("");
  const queryClient = useQueryClient();

  const dataEvento = ingresso.evento_data_inicio || ingresso.evento?.data_inicio;

  const statusColors: Record<string, string> = {
    resgatado: "text-white",
    disponivel: "bg-blue-100 text-blue-700",
    usado: "bg-gray-100 text-gray-500",
    cancelado: "bg-red-100 text-red-600",
  };
  const statusBgColor: Record<string, string> = {
    resgatado: GREEN,
    disponivel: "",
    usado: "",
    cancelado: "",
  };

  const nomeTitular = ingresso.para_terceiro && ingresso.beneficiario_nome
    ? ingresso.beneficiario_nome
    : ingresso.titular_nome || "Você";

  // Estados de transferência
  const transferPendente = ingresso.transferencia_status === "pendente";
  // foiRecebidoPorTransferencia: ingresso que chegou via transferência (novo dono vê normalmente, sem botão Transferir)
  const foiRecebidoPorTransferencia = ingresso.transferencia_status === "aceita" && !!ingresso.transferido_de_user_id;
  // transferAceita: só relevante para quem transferiu (mas eles não veem mais o ingresso na lista, então esta flag fica inativa)
  const transferAceita = ingresso.transferencia_status === "aceita" && !ingresso.transferido_de_user_id;

  const handleSalvarAtribuicao = async () => {
    if (!form.beneficiario_nome.trim()) return;
    if (form.beneficiario_cpf && !validarCPF(form.beneficiario_cpf)) {
      setCpfBenefErro("CPF inválido"); return;
    }
    setCpfBenefErro("");
    setSalvando(true);
    try {
      const r = await fetch(`/api/portal/ingressos/${ingresso.codigo}/beneficiario`, {
        method: "PUT", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (r.ok) {
        setSalvoOk(true);
        setShowAtribuir(false);
        queryClient.invalidateQueries({ queryKey: ["/api/portal/meus-ingressos"] });
      } else {
        const d = await r.json();
        setCpfBenefErro(d.error || "Erro ao salvar. Tente novamente.");
      }
    } catch { setCpfBenefErro("Erro de conexão. Tente novamente."); }
    finally { setSalvando(false); }
  };

  const handleCancelarTransferencia = async () => {
    setCancelando(true);
    try {
      const r = await fetch(`/api/portal/ingressos/${ingresso.codigo}/cancelar-transferencia`, {
        method: "POST", credentials: "include",
      });
      if (!r.ok) {
        const d = await r.json().catch(() => ({}));
        alert(d.error || "Não foi possível cancelar a transferência");
        return;
      }
      queryClient.invalidateQueries({ queryKey: ["/api/portal/meus-ingressos"] });
    } finally { setCancelando(false); }
  };

  return (
    <>
      <div className={`bg-white rounded-2xl shadow-sm overflow-hidden ${needsAssignment ? "border-2 border-orange-400" : "border border-gray-100"}`}>
        <div className="h-1.5" style={{ backgroundColor: needsAssignment ? "#f97316" : transferAceita ? "#9ca3af" : YELLOW }} />
        <div className="p-4">

          {/* Banner urgente: portador não definido */}
          {needsAssignment && (
            <div className="flex items-start gap-2 bg-orange-50 border border-orange-200 rounded-xl px-3 py-2.5 mb-3">
              <AlertTriangle className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-orange-800">Portador não definido</p>
                <p className="text-xs text-orange-700 mt-0.5">Este ingresso pertence a você, mas o portador que vai usá-lo precisa ser atribuído. Preencha os dados abaixo.</p>
              </div>
            </div>
          )}

          {/* Cabeçalho */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-gray-900 text-sm leading-tight line-clamp-2">
                {ingresso.evento_titulo || ingresso.evento?.titulo || "Evento"}
              </h3>
              {dataEvento && (
                <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {format(new Date(dataEvento), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </p>
              )}
              {(ingresso.evento_local || ingresso.evento?.local) && (
                <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {ingresso.evento_local || ingresso.evento?.local}
                </p>
              )}
            </div>
            {/* Badge de status principal */}
            {transferAceita ? (
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-gray-100 text-gray-500 flex-shrink-0 flex items-center gap-1">
                <ArrowRightLeft className="w-3 h-3" />
                Transferido
              </span>
            ) : transferPendente ? (
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-orange-100 text-orange-700 flex-shrink-0 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Aguardando aceite
              </span>
            ) : (
              <span
                className={`text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0 ${statusColors[ingresso.status] || "bg-gray-100 text-gray-500"}`}
                style={statusBgColor[ingresso.status] ? { backgroundColor: statusBgColor[ingresso.status] } : {}}
              >
                {ingresso.status === "resgatado" ? "✓ Resgatado" : ingresso.status === "usado" ? "Usado" : ingresso.status === "cancelado" ? "Cancelado" : ingresso.status}
              </span>
            )}
          </div>

          {/* Banner "Aguardando aceite" */}
          {transferPendente && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg px-3 py-2.5 mb-3 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs text-orange-800">
                <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                <div>
                  <span className="font-semibold">Aguardando aceite</span>
                  <span className="text-orange-600"> · {ingresso.transferido_para_nome || ingresso.transferido_para_email}</span>
                </div>
              </div>
              <button
                onClick={handleCancelarTransferencia}
                disabled={cancelando}
                className="text-xs text-red-600 font-semibold hover:text-red-800 flex-shrink-0 whitespace-nowrap"
              >
                {cancelando ? "..." : "Cancelar"}
              </button>
            </div>
          )}

          {/* Banner "Ingresso transferido" — visível só para quem transferiu (caso raro, já que o ingresso sai da lista) */}
          {transferAceita && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 mb-3 flex items-center gap-2 text-xs text-gray-500">
              <CheckCircle className="w-3.5 h-3.5 flex-shrink-0 text-gray-400" />
              <span>Este ingresso foi transferido para <strong>{ingresso.transferido_para_nome || ingresso.transferido_para_email}</strong> e aceito.</span>
            </div>
          )}

          {/* Banner "Recebido via transferência" — visível para o receptor */}
          {foiRecebidoPorTransferencia && (
            <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2 mb-3 flex items-center gap-2 text-xs text-green-700">
              <Gift className="w-3.5 h-3.5 flex-shrink-0" />
              <span>Ingresso recebido via transferência</span>
            </div>
          )}

          {/* Portador */}
          {!transferAceita && (
            <div className={`flex items-center gap-2 text-xs px-3 py-2 rounded-lg mb-3 ${needsAssignment ? "bg-orange-50 text-orange-800" : ingresso.para_terceiro ? "bg-amber-50 text-amber-800" : "bg-gray-50 text-gray-600"}`}>
              {needsAssignment ? <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 text-orange-500" /> : ingresso.para_terceiro ? <UserX className="w-3.5 h-3.5 flex-shrink-0" /> : <UserCheck className="w-3.5 h-3.5 flex-shrink-0" />}
              <span><strong>Portador:</strong> {needsAssignment ? "⚠ A definir" : nomeTitular}</span>
              {salvoOk && <CheckCircle className="w-3.5 h-3.5 text-green-500 ml-auto" />}
            </div>
          )}

          {/* Dados beneficiário */}
          {!transferAceita && ingresso.para_terceiro && (
            <div className="bg-gray-50 rounded-xl border border-gray-100 px-3 py-3 mb-3 space-y-2">
              {ingresso.beneficiario_cpf && (
                <div className="flex gap-2 text-xs text-gray-700">
                  <span className="text-gray-400 w-28 flex-shrink-0">CPF</span>
                  <span className="font-medium">{ingresso.beneficiario_cpf}</span>
                </div>
              )}
              {ingresso.beneficiario_nascimento && (
                <div className="flex gap-2 text-xs text-gray-700">
                  <span className="text-gray-400 w-28 flex-shrink-0">Nascimento</span>
                  <span className="font-medium">{new Date(ingresso.beneficiario_nascimento).toLocaleDateString("pt-BR")}</span>
                </div>
              )}
              {ingresso.beneficiario_genero && (
                <div className="flex gap-2 text-xs text-gray-700">
                  <span className="text-gray-400 w-28 flex-shrink-0">Gênero</span>
                  <span className="font-medium">
                    {{ masculino: "Masculino", feminino: "Feminino", nao_binario: "Não binário", outro: "Outro", prefiro_nao_informar: "Prefiro não informar" }[ingresso.beneficiario_genero as string] || ingresso.beneficiario_genero}
                  </span>
                </div>
              )}
              {(ingresso.beneficiario_logradouro || ingresso.beneficiario_cidade) && (
                <div className="flex gap-2 text-xs text-gray-700">
                  <span className="text-gray-400 w-28 flex-shrink-0">Endereço</span>
                  <span className="font-medium">
                    {[ingresso.beneficiario_logradouro, ingresso.beneficiario_numero, ingresso.beneficiario_bairro,
                      ingresso.beneficiario_cidade && ingresso.beneficiario_estado ? `${ingresso.beneficiario_cidade} - ${ingresso.beneficiario_estado}` : ingresso.beneficiario_cidade || ingresso.beneficiario_estado,
                      ingresso.beneficiario_cep].filter(Boolean).join(", ")}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Código QR */}
          {!transferAceita && (
            <div className="flex items-center gap-2 text-gray-400 mb-3">
              <QrCode className="w-4 h-4 flex-shrink-0" />
              <span className="text-xs font-mono tracking-wider">{ingresso.codigo}</span>
            </div>
          )}

          {/* Ações — só aparecem se o ingresso estiver ativo e sem transferência em andamento */}
          {ingresso.status === "resgatado" && !transferPendente && !transferAceita && (
            <div className="flex gap-2 pt-3 border-t border-gray-100">
              <button
                onClick={() => setShowPDF(true)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-colors"
                style={{ backgroundColor: "#fef3c7", color: BRAND }}
              >
                <Download className="w-3.5 h-3.5" />
                Ver Ingresso
              </button>
              {!ingresso.para_terceiro && (
                <button
                  onClick={() => setShowAtribuir(!showAtribuir)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-colors ${showAtribuir ? "bg-gray-200 text-gray-700" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                >
                  <UserX className="w-3.5 h-3.5" />
                  Para terceiro
                </button>
              )}
              {/* Botão Transferir só aparece se não foi recebido por transferência */}
              {!ingresso.transferido_de_user_id && (
                <button
                  onClick={() => setShowTransferir(true)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                  Transferir
                </button>
              )}
            </div>
          )}

          {/* Formulário atribuição a terceiro */}
          {showAtribuir && (
            <div className="mt-3 pt-3 border-t border-gray-100 space-y-2.5">
              <p className={`text-xs font-semibold ${needsAssignment ? "text-orange-700" : "text-gray-700"}`}>
                {needsAssignment ? "⚠ Defina o portador deste ingresso" : "Atribuir a outra pessoa"}
              </p>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Nome completo *</label>
                <input type="text" placeholder="Nome completo do portador" value={form.beneficiario_nome} onChange={e => setForm(f => ({ ...f, beneficiario_nome: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400" />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">CPF *</label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="000.000.000-00"
                  value={form.beneficiario_cpf}
                  onChange={e => {
                    const fmt = formatCPF(e.target.value);
                    setForm(f => ({ ...f, beneficiario_cpf: fmt }));
                    if (cpfBenefErro) setCpfBenefErro("");
                  }}
                  onBlur={() => {
                    if (form.beneficiario_cpf && !validarCPF(form.beneficiario_cpf))
                      setCpfBenefErro("CPF inválido");
                    else setCpfBenefErro("");
                  }}
                  className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 transition-colors ${cpfBenefErro ? "border-red-400 focus:border-red-400 focus:ring-red-200" : "border-gray-200 focus:border-amber-400 focus:ring-amber-400"}`}
                />
                {cpfBenefErro && <p className="text-red-500 text-xs mt-1">{cpfBenefErro}</p>}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Nascimento</label>
                  <input type="date" value={form.beneficiario_nascimento} onChange={e => setForm(f => ({ ...f, beneficiario_nascimento: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-400" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Gênero</label>
                  <select value={form.beneficiario_genero} onChange={e => setForm(f => ({ ...f, beneficiario_genero: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-amber-400">
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
                <label className="text-xs text-gray-500 block mb-1">CEP *</label>
                <input type="text" placeholder="00000-000" value={form.beneficiario_cep}
                  onChange={async e => {
                    const raw = e.target.value.replace(/\D/g, "").slice(0, 8);
                    const fmt = raw.length > 5 ? `${raw.slice(0,5)}-${raw.slice(5)}` : raw;
                    setForm(f => ({ ...f, beneficiario_cep: fmt }));
                    if (raw.length === 8) {
                      try {
                        const r = await fetch(`https://viacep.com.br/ws/${raw}/json/`);
                        const d = await r.json();
                        if (!d.erro) setForm(f => ({ ...f, beneficiario_cep: fmt, beneficiario_logradouro: d.logradouro || f.beneficiario_logradouro, beneficiario_bairro: d.bairro || f.beneficiario_bairro, beneficiario_cidade: d.localidade || f.beneficiario_cidade, beneficiario_estado: d.uf || f.beneficiario_estado }));
                      } catch {}
                    }
                  }}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-400" />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <label className="text-xs text-gray-500 block mb-1">Logradouro *</label>
                  <input type="text" value={form.beneficiario_logradouro} onChange={e => setForm(f => ({ ...f, beneficiario_logradouro: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-400" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Número *</label>
                  <input type="text" value={form.beneficiario_numero} onChange={e => setForm(f => ({ ...f, beneficiario_numero: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-400" />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Bairro *</label>
                <input type="text" value={form.beneficiario_bairro} onChange={e => setForm(f => ({ ...f, beneficiario_bairro: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-400" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Cidade *</label>
                  <input type="text" value={form.beneficiario_cidade} onChange={e => setForm(f => ({ ...f, beneficiario_cidade: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-400" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Estado *</label>
                  <select value={form.beneficiario_estado} onChange={e => setForm(f => ({ ...f, beneficiario_estado: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-amber-400">
                    <option value="">UF</option>
                    {["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"].map(uf => (
                      <option key={uf} value={uf}>{uf}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <button onClick={() => setShowAtribuir(false)} className="flex-1 py-2 rounded-lg bg-gray-100 text-gray-600 text-xs font-semibold">Cancelar</button>
                <button
                  onClick={handleSalvarAtribuicao}
                  disabled={salvando || !form.beneficiario_nome.trim() || !form.beneficiario_cpf.trim() || !form.beneficiario_cep.trim() || !form.beneficiario_logradouro.trim() || !form.beneficiario_numero.trim() || !form.beneficiario_bairro.trim() || !form.beneficiario_cidade.trim() || !form.beneficiario_estado.trim()}
                  className="flex-1 py-2 rounded-lg text-white text-xs font-semibold disabled:opacity-50"
                  style={{ backgroundColor: BRAND }}
                >
                  {salvando ? "Salvando..." : "Confirmar"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {showPDF && <IngressoPDF ingresso={ingresso} onClose={() => setShowPDF(false)} />}
      {showTransferir && <TransferirModal ingresso={ingresso} onClose={() => setShowTransferir(false)} />}
    </>
  );
}
