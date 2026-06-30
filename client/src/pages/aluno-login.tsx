import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, User, Lock, Eye, EyeOff, ArrowLeft, Mail, CheckCircle, KeyRound, Hash } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { syncAuthSessionAfterLogin, syncAlunoPortalCache } from "@/lib/auth-session";
import logoOGrito from "../app-assets/logo_ogrito_1773942740072.png";
import girlImage from "../app-assets/Gemini_Generated_Image_b8g3y7b8g3y7b8g3_1769198371783.png";

function formatCPF(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  return digits
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/(\d{3})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3-$4');
}

function validarCPF(cpf: string): boolean {
  const d = cpf.replace(/\D/g, '');
  if (d.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(d)) return false; // sequências iguais: 111.111.111-11
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(d[i]) * (10 - i);
  let r = (sum * 10) % 11;
  if (r === 10 || r === 11) r = 0;
  if (r !== parseInt(d[9])) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(d[i]) * (11 - i);
  r = (sum * 10) % 11;
  if (r === 10 || r === 11) r = 0;
  return r === parseInt(d[10]);
}

type Step = 'login' | 'esqueci' | 'codigo' | 'redefinir';

export default function AlunoLogin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [step, setStep] = useState<Step>('login');

  // Login
  const [cpf, setCpf] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [erroCpfLogin, setErroCpfLogin] = useState("");

  // Esqueci senha
  const [cpfEsqueci, setCpfEsqueci] = useState("");
  const [loadingEsqueci, setLoadingEsqueci] = useState(false);
  const [erroCpfEsqueci, setErroCpfEsqueci] = useState("");

  // Verificar código
  const [codigo, setCodigo] = useState("");
  const [loadingCodigo, setLoadingCodigo] = useState(false);
  const [emailMascarado, setEmailMascarado] = useState("");
  const [semEmail, setSemEmail] = useState(false);

  // Redefinir senha
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [erroRedefinir, setErroRedefinir] = useState("");
  const [showNova, setShowNova] = useState(false);
  const [showConfirmar, setShowConfirmar] = useState(false);
  const [loadingReset, setLoadingReset] = useState(false);

  const handleLogin = async () => {
    const cpfLimpo = cpf.replace(/\D/g, '');
    setErroCpfLogin('');
    if (!validarCPF(cpfLimpo)) {
      setErroCpfLogin('CPF inválido. Verifique os números e tente novamente.');
      return;
    }
    if (!senha.trim()) {
      toast({ title: "Senha obrigatória", description: "Digite sua senha", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/aluno-portal/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ cpf: cpfLimpo, senha: senha.trim() }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast({ title: "Erro no login", description: data.error || "Credenciais inválidas", variant: "destructive" });
        return;
      }

      const session = await syncAuthSessionAfterLogin();
      const cpfSessao = String(session?.cpf || data.cpf || "").replace(/\D/g, "");
      if (!session?.id || session.actorType !== "aluno_portal" || cpfSessao.length !== 11) {
        toast({ title: "Erro no login", description: "Sessão não foi criada. Tente novamente.", variant: "destructive" });
        return;
      }
      syncAlunoPortalCache({
        ...session,
        cpf: cpfSessao,
        nome: data.nome || session.nome,
      });
      if (data.isMenor) sessionStorage.setItem('aluno_menor', 'true');
      else sessionStorage.removeItem('aluno_menor');

      // Redirecionar baseado no status do consentimento de menor
      if (data.isMenor && data.consentimentoStatus === 'pendente') {
        setLocation('/menor/autorizacao-responsavel');
      } else if (data.isMenor && data.consentimentoStatus === 'parcial') {
        setLocation('/menor/autorizacao-responsavel');
      } else {
        setLocation('/aluno');
      }
    } catch {
      toast({ title: "Erro", description: "Não foi possível conectar ao servidor", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleEsqueciSenha = async () => {
    const cpfLimpo = cpfEsqueci.replace(/\D/g, '');
    setErroCpfEsqueci('');
    if (!validarCPF(cpfLimpo)) {
      setErroCpfEsqueci('CPF inválido. Verifique os números e tente novamente.');
      return;
    }

    setSemEmail(false);
    setLoadingEsqueci(true);
    try {
      const res = await fetch('/api/aluno-portal/esqueci-senha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cpf: cpfLimpo }),
      });
      const data = await res.json();
      if (data.semEmail) {
        setSemEmail(true);
        return;
      }
      setEmailMascarado(data.emailMascarado || '');
      setStep('codigo');
    } catch {
      toast({ title: "Erro", description: "Não foi possível processar sua solicitação", variant: "destructive" });
    } finally {
      setLoadingEsqueci(false);
    }
  };

  const handleVerificarCodigo = async () => {
    const codigoLimpo = codigo.replace(/\D/g, '');
    if (codigoLimpo.length !== 6) {
      toast({ title: "Código inválido", description: "Digite os 6 dígitos do código recebido", variant: "destructive" });
      return;
    }

    setLoadingCodigo(true);
    try {
      const res = await fetch('/api/aluno-portal/verificar-codigo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cpf: cpfEsqueci.replace(/\D/g, ''), codigo: codigoLimpo }),
      });
      const data = await res.json();

      if (!res.ok || !data.valido) {
        toast({ title: "Código inválido", description: data.error || "Verifique o código e tente novamente", variant: "destructive" });
        return;
      }

      setStep('redefinir');
    } catch {
      toast({ title: "Erro", description: "Não foi possível verificar o código", variant: "destructive" });
    } finally {
      setLoadingCodigo(false);
    }
  };

  const handleReenviarCodigo = async () => {
    setLoadingEsqueci(true);
    try {
      const res = await fetch('/api/aluno-portal/esqueci-senha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cpf: cpfEsqueci.replace(/\D/g, '') }),
      });
      const data = await res.json();
      if (data.emailMascarado) setEmailMascarado(data.emailMascarado);
      setCodigo('');
      toast({ title: "Código reenviado", description: "Verifique seu e-mail com o novo código" });
    } catch {
      toast({ title: "Erro", description: "Não foi possível reenviar o código", variant: "destructive" });
    } finally {
      setLoadingEsqueci(false);
    }
  };

  const handleRedefinirSenha = async () => {
    setErroRedefinir('');
    if (novaSenha.length < 6) {
      setErroRedefinir('A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    if (novaSenha !== confirmarSenha) {
      setErroRedefinir('As senhas digitadas são diferentes.');
      return;
    }

    setLoadingReset(true);
    try {
      const res = await fetch('/api/aluno-portal/redefinir-senha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cpf: cpfEsqueci.replace(/\D/g, ''),
          codigo: codigo.replace(/\D/g, ''),
          novaSenha,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setErroRedefinir(data.error || 'Não foi possível redefinir a senha.');
        return;
      }

      // Login automático após redefinição
      const loginRes = await fetch('/api/aluno-portal/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ cpf: cpfEsqueci.replace(/\D/g, ''), senha: novaSenha }),
      });
      const loginData = await loginRes.json();

      if (loginRes.ok && loginData.sucesso) {
        const session = await fetchAlunoPortalSession();
        if (session?.cpf) {
          syncAlunoPortalCache({ ...session, nome: loginData.nome || session.nome });
        }
        if (loginData.isMenor) sessionStorage.setItem('aluno_menor', 'true');
        else sessionStorage.removeItem('aluno_menor');
        toast({ title: "Senha redefinida!", description: `Bem-vindo(a), ${loginData.nome?.split(' ')[0] || ''}!` });
        if (loginData.isMenor && (loginData.consentimentoStatus === 'pendente' || loginData.consentimentoStatus === 'parcial')) {
          setLocation('/menor/autorizacao-responsavel');
        } else {
          setLocation('/aluno');
        }
      } else {
        // Fallback: vai para login normal
        toast({ title: "Senha redefinida!", description: "Faça login com sua nova senha" });
        setStep('login');
        setCpfEsqueci('');
        setCodigo('');
        setNovaSenha('');
        setConfirmarSenha('');
        setErroRedefinir('');
      }
    } catch {
      setErroRedefinir('Não foi possível conectar ao servidor.');
    } finally {
      setLoadingReset(false);
    }
  };

  const renderCardContent = () => {

    // Passo 2: digitar CPF para receber código
    if (step === 'esqueci') {
      return (
        <div className="space-y-5 relative z-10">
          <div className="text-center mb-2">
            <div className="w-12 h-12 bg-yellow-400/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <Mail className="w-6 h-6 text-yellow-400" />
            </div>
            <h2 className="text-xl font-bold text-white">Esqueci minha senha</h2>
            <p className="text-sm text-white/70 mt-1">
              Digite seu CPF e enviaremos um código de 6 dígitos para seu e-mail
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-white/90 mb-2">CPF</label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <User className="w-4 h-4" />
              </div>
              <Input
                type="text"
                inputMode="numeric"
                placeholder="000.000.000-00"
                value={cpfEsqueci}
                onChange={e => { setCpfEsqueci(formatCPF(e.target.value)); setSemEmail(false); setErroCpfEsqueci(''); }}
                onKeyPress={e => e.key === 'Enter' && !loadingEsqueci && handleEsqueciSenha()}
                className={`h-11 pl-10 bg-white border-0 text-gray-900 placeholder:text-gray-400 text-sm focus:ring-2 focus:ring-white/50 rounded-xl ${erroCpfEsqueci ? 'ring-2 ring-red-400' : ''}`}
                disabled={loadingEsqueci}
                autoFocus
              />
            </div>
            {erroCpfEsqueci && (
              <p className="text-xs text-red-400 mt-1.5 flex items-center gap-1">
                <span>⚠</span> {erroCpfEsqueci}
              </p>
            )}
          </div>

          {semEmail && (
            <div className="bg-red-500/20 border border-red-400/40 rounded-xl p-4 text-sm leading-relaxed">
              <p className="text-red-300 font-medium mb-1">Nenhum e-mail cadastrado</p>
              <p className="text-white/70">
                Não há e-mail registrado para este CPF. Entre em contato com o Instituto O Grito para atualizar seu cadastro e poder usar esta função.
              </p>
            </div>
          )}

          <Button
            onClick={handleEsqueciSenha}
            disabled={loadingEsqueci}
            className="w-full h-12 bg-yellow-400 hover:bg-yellow-300 text-black font-bold text-base rounded-xl shadow-lg transition-all"
          >
            {loadingEsqueci ? (
              <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Enviando...</>
            ) : (
              <><Mail className="w-5 h-5 mr-2" />Enviar código</>
            )}
          </Button>

          <button
            type="button"
            onClick={() => { setStep('login'); setCpfEsqueci(''); setSemEmail(false); }}
            className="w-full text-center text-sm text-white/60 hover:text-white/90 transition-colors pt-1"
          >
            ← Voltar ao login
          </button>
        </div>
      );
    }

    // Passo 3: digitar o código de 6 dígitos
    if (step === 'codigo') {
      // Sem e-mail: só mensagem + Voltar
      if (!emailMascarado) {
        return (
          <div className="space-y-5 relative z-10 text-center">
            <div className="w-12 h-12 bg-red-400/20 rounded-full flex items-center justify-center mx-auto">
              <Mail className="w-6 h-6 text-red-400" />
            </div>
            <div className="bg-red-500/20 border border-red-400/40 rounded-xl p-4 text-sm leading-relaxed text-left">
              <p className="text-red-300 font-medium mb-1">Nenhum e-mail cadastrado</p>
              <p className="text-white/70">
                Não há e-mail registrado para este CPF. Entre em contato com o Instituto O Grito para atualizar seu cadastro.
              </p>
            </div>
            <button
              type="button"
              onClick={() => { setStep('esqueci'); setCodigo(''); setSemEmail(false); }}
              className="w-full text-center text-sm text-white/60 hover:text-white/90 transition-colors"
            >
              ← Voltar
            </button>
          </div>
        );
      }

      return (
        <div className="space-y-5 relative z-10">
          <div className="text-center mb-2">
            <div className="w-12 h-12 bg-yellow-400/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <Hash className="w-6 h-6 text-yellow-400" />
            </div>
            <h2 className="text-xl font-bold text-white">Digite o código</h2>
            <p className="text-sm text-white/70 mt-1">Enviamos um código de 6 dígitos para</p>
            <p className="text-sm font-semibold text-yellow-400 mt-0.5">{emailMascarado}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-white/90 mb-2">Código de verificação</label>
            <Input
              type="text"
              inputMode="numeric"
              placeholder="000000"
              maxLength={6}
              value={codigo}
              onChange={e => setCodigo(e.target.value.replace(/\D/g, '').slice(0, 6))}
              onKeyPress={e => e.key === 'Enter' && !loadingCodigo && handleVerificarCodigo()}
              className="h-12 text-center text-2xl font-bold tracking-[0.4em] bg-white border-0 text-gray-900 placeholder:text-gray-300 focus:ring-2 focus:ring-white/50 rounded-xl"
              disabled={loadingCodigo}
              autoFocus
            />
            <p className="text-xs text-white/50 mt-1.5 text-center">O código expira em 15 minutos</p>
            <p className="text-xs text-white/40 mt-2 text-center">Não sabe como acessar esse e-mail? Entre em contato com o Instituto O Grito.</p>
          </div>

          <Button
            onClick={handleVerificarCodigo}
            disabled={loadingCodigo || codigo.replace(/\D/g,'').length !== 6}
            className="w-full h-12 bg-yellow-400 hover:bg-yellow-300 text-black font-bold text-base rounded-xl shadow-lg transition-all"
          >
            {loadingCodigo ? (
              <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Verificando...</>
            ) : 'Verificar código'}
          </Button>

          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={() => { setStep('esqueci'); setCodigo(''); }}
              className="text-sm text-white/60 hover:text-white/90 transition-colors"
            >
              ← Voltar
            </button>
            <button
              type="button"
              onClick={handleReenviarCodigo}
              disabled={loadingEsqueci}
              className="text-sm text-yellow-400 hover:text-yellow-300 transition-colors disabled:opacity-50"
            >
              {loadingEsqueci ? 'Reenviando...' : 'Reenviar código'}
            </button>
          </div>
        </div>
      );
    }

    // Passo 4: definir nova senha
    if (step === 'redefinir') {
      return (
        <div className="space-y-5 relative z-10">
          <div className="text-center mb-2">
            <div className="w-12 h-12 bg-green-400/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="w-6 h-6 text-green-400" />
            </div>
            <h2 className="text-xl font-bold text-white">Criar nova senha</h2>
            <p className="text-sm text-white/70 mt-1">Escolha uma senha com pelo menos 6 caracteres</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-white/90 mb-2">Nova senha</label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <Lock className="w-4 h-4" />
              </div>
              <Input
                type={showNova ? 'text' : 'password'}
                placeholder="Nova senha"
                value={novaSenha}
                onChange={e => setNovaSenha(e.target.value)}
                className="h-11 pl-10 pr-10 bg-white border-0 text-gray-900 placeholder:text-gray-400 text-sm focus:ring-2 focus:ring-white/50 rounded-xl"
                disabled={loadingReset}
                autoFocus
              />
              <button type="button" onClick={() => setShowNova(!showNova)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showNova ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-white/90 mb-2">Confirmar senha</label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <Lock className="w-4 h-4" />
              </div>
              <Input
                type={showNova ? 'text' : 'password'}
                placeholder="Confirmar senha"
                value={confirmarSenha}
                onChange={e => setConfirmarSenha(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && !loadingReset && handleRedefinirSenha()}
                className="h-11 pl-10 pr-4 bg-white border-0 text-gray-900 placeholder:text-gray-400 text-sm focus:ring-2 focus:ring-white/50 rounded-xl"
                disabled={loadingReset}
              />
            </div>
          </div>

          {erroRedefinir && (
            <div className="bg-red-500/20 border border-red-400/40 rounded-xl px-4 py-3 text-sm text-red-300 text-center">
              {erroRedefinir}
            </div>
          )}

          <Button
            onClick={handleRedefinirSenha}
            disabled={loadingReset}
            className="w-full h-12 bg-yellow-400 hover:bg-yellow-300 text-black font-bold text-base rounded-xl shadow-lg transition-all"
          >
            {loadingReset ? (
              <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Redefinindo...</>
            ) : 'Redefinir senha'}
          </Button>
        </div>
      );
    }

    // Passo 1 (padrão): login
    return (
      <div className="space-y-5 relative z-10">
        <div>
          <label className="block text-sm font-medium text-white/90 mb-2">CPF</label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <User className="w-4 h-4" />
            </div>
            <Input
              type="text"
              inputMode="numeric"
              placeholder="000.000.000-00"
              value={cpf}
              onChange={e => { setCpf(formatCPF(e.target.value)); setErroCpfLogin(''); }}
              onKeyPress={e => e.key === 'Enter' && !loading && handleLogin()}
              className={`h-11 pl-10 bg-white border-0 text-gray-900 placeholder:text-gray-400 text-sm focus:ring-2 focus:ring-white/50 rounded-xl ${erroCpfLogin ? 'ring-2 ring-red-400' : ''}`}
              disabled={loading}
              autoComplete="off"
            />
          </div>
          {erroCpfLogin && (
            <p className="text-xs text-red-400 mt-1.5 flex items-center gap-1">
              <span>⚠</span> {erroCpfLogin}
            </p>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-white/90">Senha</label>
            <button
              type="button"
              onClick={() => setStep('esqueci')}
              className="text-xs text-yellow-400 hover:text-yellow-300 transition-colors"
            >
              Esqueci minha senha
            </button>
          </div>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <Lock className="w-4 h-4" />
            </div>
            <Input
              type={showPassword ? 'text' : 'password'}
              placeholder="Sua senha"
              value={senha}
              onChange={e => setSenha(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && !loading && handleLogin()}
              className="h-11 pl-10 pr-10 bg-white border-0 text-gray-900 placeholder:text-gray-400 text-sm focus:ring-2 focus:ring-white/50 rounded-xl"
              disabled={loading}
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-xs text-white/70 mt-1.5">
            Primeiro acesso? Use seu CPF (só números) como senha.
          </p>
        </div>

        <div className="text-center">
          <p className="text-sm text-white/80">Acesso para Alunos e Participantes</p>
        </div>

        <Button
          onClick={handleLogin}
          disabled={loading}
          className="w-full h-12 bg-yellow-400 hover:bg-yellow-300 text-black font-bold text-base rounded-xl shadow-lg transition-all"
        >
          {loading ? (
            <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Entrando...</>
          ) : 'Entrar'}
        </Button>

        <div className="text-center pt-2">
          <p className="text-xs text-white/70">
            Problemas no acesso? Entre em contato com o Instituto O Grito.
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="h-screen flex flex-col md:flex-row overflow-hidden">
      {/* Lado esquerdo — imagem */}
      <div className="hidden md:flex md:w-1/2 h-full relative overflow-hidden">
        <img
          src={girlImage}
          alt="Instituto O Grito"
          className="w-full h-full object-cover object-center"
        />
      </div>

      {/* Lado direito — formulário */}
      <div className="w-full md:w-1/2 h-screen bg-black flex items-center justify-center py-10 px-6 md:p-10 relative overflow-hidden">
        <button
          onClick={() => setLocation('/entrar')}
          className="absolute top-4 right-4 z-20 flex items-center gap-1.5 text-gray-400 hover:text-yellow-400 transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </button>
        <div className="absolute top-0 right-0 w-96 h-96 bg-yellow-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-yellow-600/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3" />

        <div className="w-full max-w-sm md:max-w-md relative z-10 space-y-4 md:space-y-6">
          {/* Logo + título — só na tela de login */}
          {step === 'login' && (
            <div className="flex flex-col items-center gap-2">
              <img src={logoOGrito} alt="Instituto O Grito" className="h-36 md:h-36 w-auto drop-shadow-md" />
              <h1 className="text-3xl md:text-4xl text-white text-center drop-shadow-lg">
                <span className="font-bold">Portal</span> <span className="italic">do Aluno</span>
              </h1>
            </div>
          )}

          {/* Card glassmorphism */}
          <div className="backdrop-blur-xl bg-white/10 rounded-3xl p-8 md:p-10 shadow-2xl border border-white/10 relative overflow-hidden">
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-yellow-400/20 rounded-full blur-3xl" />
            <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-yellow-500/20 rounded-full blur-3xl" />
            {renderCardContent()}
          </div>
        </div>
      </div>
    </div>
  );
}
