import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, CheckCircle, ArrowLeft, ChevronRight, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { LGPD_CONTACT_EMAIL } from "@/lib/lgpdContact";

const CONSENT_ITEMS = [
  { key: "student_data_processing",      level: 1, label: "Autorizo o uso dos dados cadastrais do aluno para participação nos projetos do Instituto O Grito.", required: true },
  { key: "attendance_tracking",          level: 2, label: "Autorizo o uso dos dados de presença para controle de frequência e relatórios internos." },
  { key: "institutional_communications", level: 2, label: "Autorizo o recebimento de comunicações sobre atividades, oficinas e eventos." },
  { key: "impact_reports",               level: 2, label: "Autorizo o uso de dados em relatórios de impacto, de forma preferencialmente anonimizada." },
  { key: "push_notifications",           level: 2, label: "Autorizo o envio de notificações pelo aplicativo." },
  { key: "image_use",                    level: 3, label: "Autorizo o uso de imagem do aluno em registros institucionais (fotos/vídeos)." },
  { key: "facial_recognition",           level: 3, label: "Autorizo o uso de foto para chamada facial/reconhecimento de presença." },
  { key: "psychosocial_data",            level: 3, label: "Autorizo o acesso a dados de acompanhamento psicossocial e de saúde do aluno." },
];

const RELATIONSHIP_OPTIONS = [
  "Pai", "Mãe", "Avô(ó)", "Tio(a)", "Padrasto/Madrasta", "Responsável legal", "Outro",
];

function formatCPF(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 11);
  return d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")
    .replace(/(\d{3})(\d{3})(\d{0,3})/, "$1.$2.$3")
    .replace(/(\d{3})(\d{0,3})/, "$1.$2");
}

function formatPhone(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length > 10) return d.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  return d.replace(/(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3").replace(/\($/, "").replace(/\) $/, "");
}

export default function AutorizacaoResponsavel() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [step, setStep] = useState<"dados" | "consentimentos" | "sucesso">("dados");
  const [form, setForm] = useState({
    guardian_name: "", guardian_cpf: "", guardian_email: "",
    guardian_phone: "", relationship: "Mãe",
    terms_accepted: false, privacy_accepted: false,
  });
  const [consents, setConsents] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);

  const studentCpf = sessionStorage.getItem("aluno_cpf") || "";
  const studentName = sessionStorage.getItem("aluno_nome") || "o aluno";

  const toggleConsent = (key: string) =>
    setConsents(prev => ({ ...prev, [key]: !prev[key] }));

  const handleDadosNext = () => {
    if (!form.guardian_name.trim()) { toast({ title: "Nome do responsável é obrigatório", variant: "destructive" }); return; }
    if (!form.relationship) { toast({ title: "Informe o parentesco", variant: "destructive" }); return; }
    if (!form.terms_accepted || !form.privacy_accepted) {
      toast({ title: "Aceite os Termos e a Política de Privacidade", variant: "destructive" }); return;
    }
    setStep("consentimentos");
  };

  const handleSubmit = async () => {
    if (!consents["student_data_processing"]) {
      toast({ title: "O consentimento de dados cadastrais é obrigatório", variant: "destructive" }); return;
    }
    setLoading(true);
    try {
      const ip = "";
      const ua = navigator.userAgent;
      const res = await fetch("/api/aluno/responsavel/registrar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_cpf: studentCpf,
          guardian_name: form.guardian_name,
          guardian_cpf: form.guardian_cpf.replace(/\D/g, ""),
          guardian_email: form.guardian_email,
          guardian_phone: form.guardian_phone.replace(/\D/g, ""),
          relationship: form.relationship,
          terms_accepted: form.terms_accepted,
          privacy_accepted: form.privacy_accepted,
          consents,
          user_agent: ua,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "Erro ao registrar");
      }
      setStep("sucesso");
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (step === "sucesso") {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex flex-col items-center justify-center p-6"
        style={{ fontFamily: "SF Pro Rounded, system-ui, sans-serif" }}
      >
        <div className="w-full max-w-sm bg-white rounded-3xl shadow-xl p-8 text-center space-y-5">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-bold text-gray-900">Autorização registrada!</h1>
            <p className="text-sm text-gray-600 leading-relaxed">
              O consentimento do responsável foi registrado com sucesso. {studentName.split(" ")[0]} já pode acessar o aplicativo.
            </p>
          </div>
          <Button
            className="w-full h-11 rounded-xl bg-yellow-400 hover:bg-yellow-500 text-black font-bold"
            onClick={() => setLocation("/aluno")}
          >
            Acessar o app
          </Button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen bg-gray-50"
      style={{ fontFamily: "SF Pro Rounded, system-ui, sans-serif" }}
    >
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => step === "consentimentos" ? setStep("dados") : setLocation("/login/aluno")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide flex items-center gap-1">
              <Shield className="w-3 h-3" /> LGPD — Proteção de Menores
            </p>
            <h1 className="text-base font-bold text-gray-900">
              {step === "dados" ? "Dados do Responsável" : "Consentimentos"}
            </h1>
          </div>
          <div className="ml-auto text-xs text-gray-400">{step === "dados" ? "1/2" : "2/2"}</div>
        </div>
        <div className="h-1 bg-gray-100">
          <div className={`h-1 bg-yellow-400 transition-all duration-500 ${step === "dados" ? "w-1/2" : "w-full"}`} />
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-6 pb-24 space-y-5">

        {step === "dados" && (
          <>
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 space-y-1">
              <p className="text-xs font-semibold text-blue-800">Por que precisamos disso?</p>
              <p className="text-xs text-blue-700 leading-relaxed">
                {studentName.split(" ")[0]} é menor de idade. A LGPD e o ECA exigem o consentimento do responsável legal
                antes de qualquer tratamento de dados pessoais de crianças e adolescentes.
              </p>
            </div>

            <div className="space-y-4">
              <Field label="Nome completo do responsável *">
                <Input value={form.guardian_name} onChange={e => setForm(f => ({ ...f, guardian_name: e.target.value }))} placeholder="Nome completo" />
              </Field>
              <Field label="Parentesco / vínculo *">
                <select
                  value={form.relationship}
                  onChange={e => setForm(f => ({ ...f, relationship: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
                >
                  {RELATIONSHIP_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </Field>
              <Field label="CPF do responsável">
                <Input value={form.guardian_cpf} onChange={e => setForm(f => ({ ...f, guardian_cpf: formatCPF(e.target.value) }))} placeholder="000.000.000-00" />
              </Field>
              <Field label="E-mail do responsável">
                <Input type="email" value={form.guardian_email} onChange={e => setForm(f => ({ ...f, guardian_email: e.target.value }))} placeholder="email@exemplo.com" />
              </Field>
              <Field label="Telefone">
                <Input value={form.guardian_phone} onChange={e => setForm(f => ({ ...f, guardian_phone: formatPhone(e.target.value) }))} placeholder="(21) 90000-0000" />
              </Field>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-3">
              <p className="text-sm font-semibold text-gray-800">Documentos legais</p>
              {[
                { key: "terms_accepted", label: "Li e aceito os Termos de Uso", link: "/termos-de-uso" },
                { key: "privacy_accepted", label: "Li e aceito a Política de Privacidade", link: "/politica-de-privacidade" },
              ].map(({ key, label, link }) => (
                <label key={key} className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={(form as any)[key]}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.checked }))}
                    className="mt-0.5 w-4 h-4 accent-blue-600 flex-shrink-0"
                  />
                  <span className="text-sm text-gray-700">
                    {label}{" "}
                    <a href={link} target="_blank" className="text-blue-600 underline text-xs">ver documento</a>
                  </span>
                </label>
              ))}
            </div>

            <Button
              className="w-full h-12 rounded-xl bg-yellow-400 hover:bg-yellow-500 text-black font-bold"
              onClick={handleDadosNext}
            >
              Próximo <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </>
        )}

        {step === "consentimentos" && (
          <>
            <p className="text-sm text-gray-600 leading-relaxed">
              Selecione abaixo quais finalidades você autoriza para o tratamento dos dados de{" "}
              <strong>{studentName.split(" ")[0]}</strong>. O item marcado com <span className="text-red-500">*</span> é obrigatório.
            </p>

            {[1, 2, 3].map(level => (
              <div key={level} className="space-y-2">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  {level === 1 ? "Nível 1 — Obrigatório" : level === 2 ? "Nível 2 — Funcionalidades do programa" : "Nível 3 — Dados sensíveis"}
                </p>
                {level === 3 && (
                  <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-800">Estes consentimentos envolvem dados sensíveis e podem ser revogados a qualquer momento.</p>
                  </div>
                )}
                <div className="bg-white border border-gray-100 rounded-2xl divide-y divide-gray-50">
                  {CONSENT_ITEMS.filter(c => c.level === level).map(c => (
                    <label key={c.key} className="flex items-start gap-3 p-4 cursor-pointer hover:bg-gray-50">
                      <input
                        type="checkbox"
                        checked={!!consents[c.key]}
                        onChange={() => toggleConsent(c.key)}
                        className="mt-0.5 w-4 h-4 accent-blue-600 flex-shrink-0"
                      />
                      <span className="text-sm text-gray-700 leading-relaxed">
                        {c.label}
                        {c.required && <span className="text-red-500 ml-0.5">*</span>}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            ))}

            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
              <p className="text-xs text-blue-700 leading-relaxed">
                Você pode revogar qualquer consentimento a qualquer momento pelo e-mail{" "}
                <a href={`mailto:${LGPD_CONTACT_EMAIL}`} className="underline font-medium">
                  {LGPD_CONTACT_EMAIL}
                </a>.
              </p>
            </div>

            <Button
              className="w-full h-12 rounded-xl bg-yellow-400 hover:bg-yellow-500 text-black font-bold"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? "Registrando..." : "Confirmar autorização"}
            </Button>
          </>
        )}
      </div>
    </motion.div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs font-semibold text-gray-600">{label}</Label>
      {children}
    </div>
  );
}
