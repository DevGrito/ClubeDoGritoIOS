import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, UserCheck, Mail } from "lucide-react";
import { motion } from "framer-motion";

import { buildLgpdMailto, LGPD_CONTACT_EMAIL } from "@/lib/lgpdContact";

const CONTATO_EMAIL = LGPD_CONTACT_EMAIL;

/*
 * ─── Formulário web de solicitação LGPD (DESATIVADO) ───────────────────────
 * Motivo: POST /api/privacy/data-request não persiste os dados de forma confiável.
 * Reativar quando houver tabela dedicada + painel admin.
 *
import { useState } from "react";
import { Send, CheckCircle } from "lucide-react";

const VINCULO_OPTIONS = [
  "Aluno / responsável",
  "Doador",
  "Colaborador",
  "Patrocinador",
  "Conselheiro",
  "Visitante do site",
  "Outro",
];

const TIPO_OPTIONS = [
  "Solicitar acesso aos meus dados",
  "Pedir correção ou atualização de dados",
  "Pedir exclusão de dados",
  "Revogar consentimento",
  "Saber com quem meus dados foram compartilhados",
  "Solicitar portabilidade de dados",
  "Fazer uma reclamação ou denúncia",
  "Outra solicitação",
];

// Dentro do componente:
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState({
    nome: "", email: "", telefone: "", tipo: "", vinculo: "", mensagem: "",
  });
  const mensagemLen = form.mensagem.trim().length;
  const isValid =
    form.nome.trim().length >= 3 &&
    form.email.includes("@") &&
    form.tipo !== "" &&
    form.vinculo !== "" &&
    mensagemLen >= 5;
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    setSending(true);
    try {
      const res = await fetch("/api/privacy/data-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("...");
      setSent(true);
    } catch (err) { ... } finally { setSending(false); }
  };

// JSX do formulário "Solicitar atendimento sobre meus dados" (campos nome, email,
// telefone, vínculo, tipo, mensagem, botão Enviar solicitação) — ver histórico git.
 * ─── Fim do bloco desativado ───────────────────────────────────────────────
 */

export default function DireitosDoTitular() {
  const [, setLocation] = useLocation();

  const rights = [
    {
      title: "Confirmação e acesso",
      desc: "Saber se tratamos seus dados e ter acesso a eles.",
    },
    {
      title: "Correção",
      desc: "Pedir a correção de dados incompletos, inexatos ou desatualizados.",
    },
    {
      title: "Exclusão",
      desc: "Solicitar a exclusão de dados tratados com base no seu consentimento, quando aplicável.",
    },
    {
      title: "Revogação do consentimento",
      desc: "Retirar sua autorização para tratamentos baseados em consentimento, a qualquer momento.",
    },
    {
      title: "Portabilidade",
      desc: "Receber seus dados em formato estruturado, legível por máquina, para transferência a outro fornecedor.",
    },
    {
      title: "Informações sobre compartilhamento",
      desc: "Saber com quais entidades públicas e privadas compartilhamos seus dados.",
    },
    {
      title: "Oposição",
      desc: "Se opor a tratamentos que causem prejuízos ou violem a legislação.",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="min-h-screen bg-gray-50"
      style={{ fontFamily: "SF Pro Rounded, -apple-system, BlinkMacSystemFont, system-ui, sans-serif" }}
    >
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center">
            <Button variant="ghost" size="icon" onClick={() => window.history.back()} className="mr-3 hover:bg-transparent">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <p className="text-sm text-gray-500 uppercase tracking-wider mb-0.5">LGPD</p>
              <h1 className="text-xl font-bold text-gray-900">Direitos do Titular</h1>
              <p className="text-sm text-gray-500">Instituto O Grito</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 pb-16 space-y-4">
        <div className="bg-white rounded-2xl p-5 border border-gray-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center">
              <UserCheck className="w-5 h-5 text-black" />
            </div>
            <h2 className="text-base font-bold text-gray-900">Seus direitos sobre seus dados</h2>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed">
            A LGPD (Lei 13.709/2018) garante a você, titular dos dados, uma série de direitos sobre as informações que o Instituto O Grito
            trata. Você pode solicitar acesso, correção, exclusão ou revogar consentimentos concedidos anteriormente.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="text-sm font-bold text-gray-900">Quais são seus direitos</h3>
          </div>
          <div className="divide-y divide-gray-50">
            {rights.map((r, i) => (
              <div key={i} className="px-5 py-3 flex items-start gap-3">
                <div className="w-5 h-5 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-yellow-700">{i + 1}</span>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-800">{r.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{r.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="text-sm font-bold text-gray-900">Como exercer seus direitos</h3>
          </div>
          <div className="px-5 py-6 space-y-4">
            <p className="text-sm text-gray-600 leading-relaxed">
              Para solicitar acesso, correção ou exclusão de dados, revogar consentimentos ou registrar qualquer{" "}
              <strong>reclamação</strong> sobre o tratamento das suas informações, envie um e-mail para nossa equipe.
              Retornaremos em até <strong>15 dias úteis</strong>.
            </p>
            <a
              href={buildLgpdMailto("Solicitação LGPD — Direitos do Titular")}
              className="inline-flex items-center gap-2 w-full sm:w-auto justify-center px-4 py-3 rounded-xl bg-yellow-400 hover:bg-yellow-500 text-black font-semibold text-sm transition-colors"
            >
              <Mail className="w-4 h-4 shrink-0" />
              {CONTATO_EMAIL}
            </a>
            <p className="text-xs text-gray-500 leading-relaxed">
              No e-mail, informe seu nome completo, como você se relaciona com o Instituto (aluno, doador, colaborador etc.) e descreva
              o que você solicita.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 justify-center pt-2">
          <button onClick={() => setLocation("/politica-de-privacidade")} className="text-xs text-gray-500 underline hover:text-gray-700">Política de Privacidade</button>
          <button onClick={() => setLocation("/politica-de-cookies")} className="text-xs text-gray-500 underline hover:text-gray-700">Política de Cookies</button>
          <button onClick={() => setLocation("/politica-de-uso-de-imagem")} className="text-xs text-gray-500 underline hover:text-gray-700">Uso de Imagem</button>
        </div>
      </div>
    </motion.div>
  );
}
