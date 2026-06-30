import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Cookie } from "lucide-react";
import { motion } from "framer-motion";
import { useCookieConsent } from "@/hooks/useCookieConsent";
import PrivacyPreferencesModal from "@/components/PrivacyPreferencesModal";
import { LGPD_CONTACT_EMAIL } from "@/lib/lgpdContact";

export default function PoliticaDeCookies() {
  const [, setLocation] = useLocation();
  const { consent, showPreferences, savePreferences, acceptAll, rejectAll, openPreferences, closePreferences } = useCookieConsent();

  const sections = [
    {
      title: "O que são cookies",
      content: "Cookies são pequenos arquivos de texto armazenados no seu dispositivo quando você visita um site. Eles ajudam o site a lembrar suas preferências e a funcionar corretamente.",
    },
    {
      title: "Por que usamos cookies",
      content: "O Instituto O Grito utiliza cookies para garantir o funcionamento adequado da plataforma, melhorar a experiência de navegação, compreender o uso dos nossos serviços e, quando autorizado, personalizar comunicações e campanhas.",
    },
    {
      title: "Cookies necessários",
      content: "Indispensáveis para o funcionamento do site. São usados para segurança, autenticação, sessão e prevenção de fraudes. Não podem ser desativados pelos nossos sistemas.",
      badge: "Sempre ativo",
      badgeColor: "bg-green-100 text-green-700",
    },
    {
      title: "Cookies de desempenho / analytics",
      content: "Ajudam a entender como a plataforma é utilizada — quais páginas são mais acessadas e onde podemos melhorar conteúdos e funcionalidades. Só são ativados com sua autorização.",
      badge: "Opcional",
      badgeColor: "bg-blue-100 text-blue-700",
    },
    {
      title: "Cookies de funcionalidade",
      content: "Permitem lembrar escolhas da pessoa usuária, como preferências de navegação, idioma, experiência personalizada e configurações de uso.",
      badge: "Opcional",
      badgeColor: "bg-purple-100 text-purple-700",
    },
    {
      title: "Cookies de marketing / comunicação",
      content: "Podem ser utilizados para personalizar mensagens, medir campanhas e melhorar nosso relacionamento com doadores, parceiros e visitantes, sempre respeitando as escolhas de consentimento.",
      badge: "Opcional",
      badgeColor: "bg-orange-100 text-orange-700",
    },
    {
      title: "Como gerenciar suas preferências",
      content: 'Você pode alterar suas preferências de cookies a qualquer momento clicando em "Preferências de privacidade" no rodapé da plataforma. As escolhas são salvas no seu dispositivo e podem ser revisadas quando quiser.',
    },
    {
      title: "Como revogar o consentimento",
      content: 'Para revogar o consentimento, clique em "Preferências de privacidade" no rodapé, selecione "Recusar tudo" e salve. Você também pode limpar os dados do site no seu navegador para redefinir todas as preferências.',
    },
    {
      title: "Contato",
      content: `Em caso de dúvidas sobre o uso de cookies ou sobre esta política, entre em contato com o Instituto O Grito pelo e-mail: ${LGPD_CONTACT_EMAIL}`,
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -30 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="min-h-screen bg-gray-50"
      style={{ fontFamily: "SF Pro Rounded, -apple-system, BlinkMacSystemFont, system-ui, sans-serif" }}
    >
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center">
            <Button variant="ghost" size="icon" onClick={() => window.history.back()} className="mr-3 hover:bg-transparent">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <p className="text-sm text-gray-500 uppercase tracking-wider mb-0.5">LGPD</p>
              <h1 className="text-xl font-bold text-gray-900">Política de Cookies</h1>
              <p className="text-sm text-gray-500">Versão 1.0 · Instituto O Grito</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 pb-24 space-y-4">
        {/* Intro */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center">
              <Cookie className="w-5 h-5 text-black" />
            </div>
            <h2 className="text-base font-bold text-gray-900">Política de Cookies</h2>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed">
            O Instituto O Grito utiliza cookies e tecnologias semelhantes para garantir o funcionamento
            adequado da plataforma Clube do Grito, melhorar a experiência de navegação, compreender o
            uso dos nossos serviços e, quando autorizado, personalizar comunicações e campanhas.
          </p>
        </div>

        {/* Sections */}
        {sections.map((s, i) => (
          <div key={i} className="bg-white rounded-2xl p-5 border border-gray-100">
            <div className="flex items-start justify-between gap-3 mb-2">
              <h3 className="text-sm font-bold text-gray-900">{i + 1}. {s.title}</h3>
              {s.badge && (
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${s.badgeColor}`}>
                  {s.badge}
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">{s.content}</p>
          </div>
        ))}

        {/* Botão de preferências */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-5">
          <p className="text-sm font-semibold text-gray-900 mb-1">Suas preferências</p>
          <p className="text-xs text-gray-600 mb-3">
            Revise e altere suas escolhas de cookies a qualquer momento.
          </p>
          <button
            onClick={openPreferences}
            className="w-full bg-yellow-400 hover:bg-yellow-500 text-black text-sm font-semibold py-3 rounded-xl transition-colors"
          >
            Gerenciar preferências de cookies
          </button>
        </div>

        {/* Links */}
        <div className="flex flex-wrap gap-4 justify-center pt-2">
          <button onClick={() => setLocation("/politica-de-privacidade")} className="text-xs text-gray-500 underline hover:text-gray-700">Política de Privacidade</button>
          <button onClick={() => setLocation("/termos-de-uso")} className="text-xs text-gray-500 underline hover:text-gray-700">Termos de Uso</button>
        </div>
      </div>

      <PrivacyPreferencesModal
        open={showPreferences}
        currentConsent={consent}
        onSave={savePreferences}
        onAcceptAll={acceptAll}
        onRejectAll={rejectAll}
        onClose={closePreferences}
        onNavigate={setLocation}
      />
    </motion.div>
  );
}
