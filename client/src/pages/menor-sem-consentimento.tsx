import { motion } from "framer-motion";
import { Shield, ArrowLeft, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export default function MenorSemConsentimento() {
  const [, setLocation] = useLocation();

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col items-center justify-center p-6"
      style={{ fontFamily: "SF Pro Rounded, -apple-system, BlinkMacSystemFont, system-ui, sans-serif" }}
    >
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-xl p-8 text-center space-y-5">

        <div className="flex justify-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
            <Shield className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-xl font-bold text-gray-900">Autorização necessária</h1>
          <p className="text-sm text-gray-600 leading-relaxed">
            Para acessar o Clube do Grito, precisamos da confirmação do seu responsável.
          </p>
        </div>

        <div className="bg-blue-50 rounded-2xl p-4 text-left space-y-2">
          <p className="text-xs font-semibold text-blue-800 uppercase tracking-wide">Por que isso é necessário?</p>
          <p className="text-xs text-blue-700 leading-relaxed">
            Isso protege seus dados e garante que o app seja usado com segurança, conforme a LGPD e o ECA.
          </p>
          <p className="text-xs text-blue-700 leading-relaxed">
            Peça para seu responsável comparecer ao instituto ou entrar em contato para concluir a autorização.
          </p>
        </div>

        <div className="space-y-2">
          <a
            href="https://wa.me/5521000000000"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full h-11 rounded-xl bg-green-500 hover:bg-green-600 text-white font-semibold text-sm transition-colors"
          >
            <Phone className="w-4 h-4" />
            Falar com o instituto
          </a>

          <Button
            variant="ghost"
            className="w-full text-sm text-gray-400"
            onClick={() => {
              sessionStorage.removeItem("aluno_cpf");
              sessionStorage.removeItem("aluno_auth");
              sessionStorage.removeItem("aluno_nome");
              setLocation("/login/aluno");
            }}
          >
            <ArrowLeft className="w-4 h-4 mr-1" /> Voltar ao login
          </Button>
        </div>

      </div>
    </motion.div>
  );
}
