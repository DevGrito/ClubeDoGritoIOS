import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Camera } from "lucide-react";
import { motion } from "framer-motion";

export default function PoliticaDeUsoDeImagem() {
  const [, setLocation] = useLocation();

  const sections = [
    {
      title: "O que é a autorização de uso de imagem",
      content:
        "A autorização de uso de imagem é a permissão que você concede ao Instituto O Grito para utilizar fotos e vídeos nos quais você aparece, exclusivamente para fins institucionais e sociais descritos nesta política.",
    },
    {
      title: "Para quais finalidades usamos imagens",
      content:
        "As imagens autorizadas podem ser utilizadas em: publicações nas redes sociais institucionais (Instagram, Facebook, YouTube, WhatsApp), site oficial do Instituto O Grito e do Clube do Grito, relatórios de impacto social enviados a doadores e parceiros, materiais de prestação de contas para órgãos públicos e financiadores, apresentações institucionais e campanhas de captação de recursos, materiais educativos e de comunicação dos projetos.",
    },
    {
      title: "O que NÃO fazemos com as imagens",
      content:
        "O Instituto O Grito NÃO vende, licencia, cede comercialmente ou compartilha imagens com terceiros sem autorização específica. As imagens não são utilizadas para fins comerciais, publicitários de terceiros ou de qualquer forma que não esteja descrita nesta política.",
    },
    {
      title: "Imagens de crianças e adolescentes",
      content:
        "Para alunos menores de 18 anos, a autorização de uso de imagem deve ser concedida pelo responsável legal. O Instituto O Grito toma cuidados especiais com imagens de crianças e adolescentes, seguindo as diretrizes do Estatuto da Criança e do Adolescente (ECA) e as melhores práticas de proteção de dados de menores conforme a LGPD.",
    },
    {
      title: "Revogação do consentimento",
      content:
        'Você pode revogar a autorização de uso de imagem a qualquer momento. Após a revogação, o Instituto O Grito não utilizará novas imagens suas. No entanto, imagens já publicadas em relatórios, materiais impressos ou postagens públicas podem não ser removidas retroativamente em todos os canais. Para solicitar remoção específica, entre em contato pelo canal de privacidade.',
    },
    {
      title: "Prazo de guarda das imagens",
      content:
        "As imagens ficam armazenadas enquanto forem relevantes para as finalidades descritas. Para alunos e participantes dos projetos, as imagens podem ser mantidas por até 5 anos após o encerramento da relação com o Instituto, para fins de histórico e prestação de contas.",
    },
    {
      title: "Como exercer seus direitos",
      content:
        "Para revogar a autorização, solicitar remoção de imagens específicas ou obter informações sobre como suas imagens são utilizadas, entre em contato: privacidade@institutoogrito.com.br",
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
              <h1 className="text-xl font-bold text-gray-900">Política de Uso de Imagem</h1>
              <p className="text-sm text-gray-500">Versão {import.meta.env.VITE_IMAGE_POLICY_VERSION || "1.0"} · Instituto O Grito</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 pb-16 space-y-4">
        <div className="bg-white rounded-2xl p-5 border border-gray-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center">
              <Camera className="w-5 h-5 text-black" />
            </div>
            <h2 className="text-base font-bold text-gray-900">Política de Uso de Imagem</h2>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed">
            O Instituto O Grito valoriza a privacidade e os direitos de imagem de todas as pessoas que participam de nossos projetos.
            Esta política descreve como utilizamos fotos e vídeos nos quais nossos alunos, doadores, colaboradores e participantes
            aparecem, em conformidade com a LGPD (Lei 13.709/2018) e o ECA.
          </p>
        </div>

        {sections.map((s, i) => (
          <div key={i} className="bg-white rounded-2xl p-5 border border-gray-100">
            <h3 className="text-sm font-bold text-gray-900 mb-2">{i + 1}. {s.title}</h3>
            <p className="text-sm text-gray-600 leading-relaxed">{s.content}</p>
          </div>
        ))}

        <div className="flex flex-wrap gap-4 justify-center pt-2">
          <button onClick={() => setLocation("/politica-de-privacidade")} className="text-xs text-gray-500 underline hover:text-gray-700">Política de Privacidade</button>
          <button onClick={() => setLocation("/politica-de-cookies")} className="text-xs text-gray-500 underline hover:text-gray-700">Política de Cookies</button>
          <button onClick={() => setLocation("/direitos-do-titular")} className="text-xs text-gray-500 underline hover:text-gray-700">Direitos do Titular</button>
          <button onClick={() => setLocation("/termos-de-uso")} className="text-xs text-gray-500 underline hover:text-gray-700">Termos de Uso</button>
        </div>
      </div>
    </motion.div>
  );
}
