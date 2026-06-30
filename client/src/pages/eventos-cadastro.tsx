import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, User, Mail, Lock, Eye, EyeOff, MapPin, Calendar, CreditCard, Check, X } from "lucide-react";
import logoPath from "../app-assets/Logo_Clube_Do_grito.png";
import { formatCPF, validarCPF, validarEmail, analisarSenha, senhaValida, senhaForcaScore } from "@/lib/validators";

const BRAND = "#f59e0b";

function SenhaChecklist({ senha }: { senha: string }) {
  if (!senha) return null;
  const f = analisarSenha(senha);
  const itens = [
    { ok: f.minLength,    label: "Mínimo 8 caracteres" },
    { ok: f.temMaiuscula, label: "Uma letra maiúscula (A-Z)" },
    { ok: f.temMinuscula, label: "Uma letra minúscula (a-z)" },
    { ok: f.temNumero,    label: "Um número (0-9)" },
    { ok: f.temEspecial,  label: "Um símbolo (!@#$%...)" },
    { ok: f.semSequencia, label: "Sem sequências óbvias (123, abc, qwerty...)" },
  ];
  const score = senhaForcaScore(senha);
  const barColor = score <= 2 ? "#ef4444" : score <= 4 ? "#f59e0b" : "#22c55e";
  const barLabel = score <= 2 ? "Fraca" : score <= 4 ? "Média" : "Forte";

  return (
    <div className="mt-2 space-y-2">
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${(score / 6) * 100}%`, backgroundColor: barColor }}
          />
        </div>
        <span className="text-xs font-semibold" style={{ color: barColor }}>{barLabel}</span>
      </div>
      <ul className="space-y-1">
        {itens.map(({ ok, label }) => (
          <li key={label} className={`flex items-center gap-1.5 text-xs ${ok ? "text-green-600" : "text-gray-400"}`}>
            {ok
              ? <Check className="w-3.5 h-3.5 flex-shrink-0 text-green-500" />
              : <X    className="w-3.5 h-3.5 flex-shrink-0 text-gray-300" />}
            {label}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function EventosCadastro() {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    nome: "", cpf: "", email: "", senha: "", confirmarSenha: "",
    dataNascimento: "", genero: "",
    cep: "", logradouro: "", numero: "", complemento: "", bairro: "", cidade: "", estado: "",
  });

  const [erros, setErros] = useState<Record<string, string>>({});
  const [showSenha, setShowSenha] = useState(false);
  const [showConfirmar, setShowConfirmar] = useState(false);
  const [erroGeral, setErroGeral] = useState("");
  const [buscandoCep, setBuscandoCep] = useState(false);
  const [senhaFocada, setSenhaFocada] = useState(false);

  const set = (field: string, value: string) => {
    setForm(f => ({ ...f, [field]: value }));
    if (erros[field]) setErros(e => ({ ...e, [field]: "" }));
  };

  const validarCampo = (field: string, valor: string): string => {
    switch (field) {
      case "nome":  return valor.trim().split(" ").length < 2 ? "Informe nome e sobrenome" : "";
      case "cpf":   return !validarCPF(valor) ? "CPF inválido" : "";
      case "email": return !validarEmail(valor) ? "E-mail inválido" : "";
      case "senha": return !senhaValida(valor) ? "A senha não atende aos requisitos" : "";
      case "confirmarSenha": return valor !== form.senha ? "As senhas não coincidem" : "";
      default: return "";
    }
  };

  const onBlur = (field: string) => {
    const val = (form as any)[field];
    if (!val) return;
    const msg = validarCampo(field, val);
    if (msg) setErros(e => ({ ...e, [field]: msg }));
  };

  const buscarCep = async (cep: string) => {
    const n = cep.replace(/\D/g, "");
    if (n.length !== 8) return;
    setBuscandoCep(true);
    try {
      const r = await fetch(`https://viacep.com.br/ws/${n}/json/`);
      const data = await r.json();
      if (!data.erro) {
        setForm(f => ({
          ...f,
          logradouro: data.logradouro || "",
          bairro:     data.bairro    || "",
          cidade:     data.localidade|| "",
          estado:     data.uf        || "",
          complemento: data.complemento || f.complemento,
        }));
      }
    } catch {}
    setBuscandoCep(false);
  };

  const cadastroMutation = useMutation({
    mutationFn: async (data: typeof form) => {
      const r = await fetch("/api/portal/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!r.ok) {
        const e = await r.json();
        throw new Error(e.error || "Erro ao cadastrar");
      }
      return r.json();
    },
    onSuccess: (data) => {
      queryClient.removeQueries({ queryKey: ["/api/portal/meus-ingressos"] });
      queryClient.removeQueries({ queryKey: ["/api/portal/ingressos-pendentes"] });
      queryClient.setQueryData(["/api/portal/me"], data.usuario);
      navigate("/eventos");
    },
    onError: (e: Error) => setErroGeral(e.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErroGeral("");

    // Validar todos os campos obrigatórios
    const novosErros: Record<string, string> = {};
    if (!form.nome.trim())  novosErros.nome  = "Nome obrigatório";
    else { const m = validarCampo("nome", form.nome); if (m) novosErros.nome = m; }

    if (!form.cpf.trim())   novosErros.cpf   = "CPF obrigatório";
    else { const m = validarCampo("cpf", form.cpf); if (m) novosErros.cpf = m; }

    if (!form.email.trim()) novosErros.email = "E-mail obrigatório";
    else { const m = validarCampo("email", form.email); if (m) novosErros.email = m; }

    if (!form.senha)        novosErros.senha = "Senha obrigatória";
    else { const m = validarCampo("senha", form.senha); if (m) novosErros.senha = m; }

    if (!form.confirmarSenha) novosErros.confirmarSenha = "Confirme a senha";
    else if (form.confirmarSenha !== form.senha) novosErros.confirmarSenha = "As senhas não coincidem";

    if (Object.keys(novosErros).length > 0) {
      setErros(novosErros);
      return;
    }

    cadastroMutation.mutate(form);
  };

  const inputClass = (field: string) =>
    `w-full pl-10 pr-4 py-2.5 border rounded-xl text-sm outline-none transition-all ${
      erros[field]
        ? "border-red-400 focus:border-red-400 focus:ring-2 focus:ring-red-100"
        : "border-gray-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
    }`;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-40 shadow-md" style={{ backgroundColor: BRAND }}>
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-3 h-14">
            <button onClick={() => navigate("/eventos")} className="text-white hover:text-white/80 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <img src={logoPath} alt="Clube do Grito" className="h-9 w-9 rounded-full object-contain" />
            <h1 className="text-white font-bold text-lg">Criar conta</h1>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 pb-16">
        <form onSubmit={handleSubmit} className="space-y-5" noValidate>

          {/* ── Dados pessoais ─────────────────────────────────────── */}
          <section className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <h2 className="font-bold text-gray-800 text-base mb-4">Dados pessoais</h2>
            <div className="space-y-3">

              {/* Nome */}
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Nome completo *</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Nome e sobrenome"
                    value={form.nome}
                    onChange={e => set("nome", e.target.value)}
                    onBlur={() => onBlur("nome")}
                    className={inputClass("nome")}
                  />
                </div>
                {erros.nome && <p className="text-red-500 text-xs mt-1">{erros.nome}</p>}
              </div>

              {/* CPF */}
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">CPF *</label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="000.000.000-00"
                    value={form.cpf}
                    onChange={e => set("cpf", formatCPF(e.target.value))}
                    onBlur={() => onBlur("cpf")}
                    className={inputClass("cpf")}
                  />
                </div>
                {erros.cpf && <p className="text-red-500 text-xs mt-1">{erros.cpf}</p>}
              </div>

              {/* Data de nascimento + Gênero */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Data de nascimento</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="date"
                      value={form.dataNascimento}
                      onChange={e => set("dataNascimento", e.target.value)}
                      className="w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Gênero</label>
                  <select
                    value={form.genero}
                    onChange={e => set("genero", e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all bg-white"
                  >
                    <option value="">Selecionar</option>
                    <option value="masculino">Masculino</option>
                    <option value="feminino">Feminino</option>
                    <option value="nao_binario">Não-binário</option>
                    <option value="prefiro_nao_informar">Prefiro não informar</option>
                  </select>
                </div>
              </div>
            </div>
          </section>

          {/* ── Endereço ───────────────────────────────────────────── */}
          <section className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <h2 className="font-bold text-gray-800 text-base mb-4">Endereço</h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">CEP</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="00000-000"
                    value={form.cep}
                    onChange={e => {
                      const v = e.target.value.replace(/\D/g, "").slice(0, 8);
                      const fmt = v.length > 5 ? `${v.slice(0,5)}-${v.slice(5)}` : v;
                      set("cep", fmt);
                      if (v.length === 8) buscarCep(v);
                    }}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all"
                  />
                  {buscandoCep && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                  )}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Logradouro</label>
                <input type="text" placeholder="Rua, Avenida..." value={form.logradouro} onChange={e => set("logradouro", e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Número</label>
                  <input type="text" placeholder="123" value={form.numero} onChange={e => set("numero", e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Complemento</label>
                  <input type="text" placeholder="Apto, Bloco..." value={form.complemento} onChange={e => set("complemento", e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Bairro</label>
                <input type="text" placeholder="Bairro" value={form.bairro} onChange={e => set("bairro", e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Cidade</label>
                  <input type="text" placeholder="Cidade" value={form.cidade} onChange={e => set("cidade", e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">UF</label>
                  <input type="text" placeholder="MG" maxLength={2} value={form.estado} onChange={e => set("estado", e.target.value.toUpperCase())} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all" />
                </div>
              </div>
            </div>
          </section>

          {/* ── Acesso ─────────────────────────────────────────────── */}
          <section className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <h2 className="font-bold text-gray-800 text-base mb-4">Acesso</h2>
            <div className="space-y-3">

              {/* E-mail */}
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">E-mail *</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    placeholder="seu@email.com"
                    value={form.email}
                    onChange={e => set("email", e.target.value)}
                    onBlur={() => onBlur("email")}
                    className={inputClass("email")}
                  />
                </div>
                {erros.email && <p className="text-red-500 text-xs mt-1">{erros.email}</p>}
              </div>

              {/* Senha */}
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Senha *</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type={showSenha ? "text" : "password"}
                    placeholder="Crie uma senha forte"
                    value={form.senha}
                    onChange={e => set("senha", e.target.value)}
                    onFocus={() => setSenhaFocada(true)}
                    onBlur={() => { setSenhaFocada(false); onBlur("senha"); }}
                    className={`w-full pl-10 pr-10 py-2.5 border rounded-xl text-sm outline-none transition-all ${
                      erros.senha
                        ? "border-red-400 focus:border-red-400 focus:ring-2 focus:ring-red-100"
                        : "border-gray-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
                    }`}
                  />
                  <button type="button" onClick={() => setShowSenha(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {(senhaFocada || form.senha) && <SenhaChecklist senha={form.senha} />}
                {erros.senha && !senhaFocada && <p className="text-red-500 text-xs mt-1">{erros.senha}</p>}
              </div>

              {/* Confirmar senha */}
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Confirmar senha *</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type={showConfirmar ? "text" : "password"}
                    placeholder="Repita a senha"
                    value={form.confirmarSenha}
                    onChange={e => set("confirmarSenha", e.target.value)}
                    onBlur={() => onBlur("confirmarSenha")}
                    className={`w-full pl-10 pr-10 py-2.5 border rounded-xl text-sm outline-none transition-all ${
                      erros.confirmarSenha
                        ? "border-red-400 focus:border-red-400 focus:ring-2 focus:ring-red-100"
                        : "border-gray-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
                    }`}
                  />
                  <button type="button" onClick={() => setShowConfirmar(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showConfirmar ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {erros.confirmarSenha && <p className="text-red-500 text-xs mt-1">{erros.confirmarSenha}</p>}
              </div>
            </div>
          </section>

          {erroGeral && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-700 text-sm text-center font-medium">
              {erroGeral}
            </div>
          )}

          <button
            type="submit"
            disabled={cadastroMutation.isPending}
            className="w-full py-4 rounded-2xl font-bold text-white text-base transition-all hover:opacity-90 active:scale-95 disabled:opacity-60 shadow-lg"
            style={{ backgroundColor: BRAND }}
          >
            {cadastroMutation.isPending ? "Criando conta..." : "Criar minha conta"}
          </button>

          <p className="text-center text-sm text-gray-500">
            Já tem uma conta?{" "}
            <button type="button" onClick={() => navigate("/eventos")} className="font-semibold hover:underline" style={{ color: BRAND }}>
              Entrar
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}
