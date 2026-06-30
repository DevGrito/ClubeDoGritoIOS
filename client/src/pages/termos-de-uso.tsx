import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

export default function TermosDeUso() {
  const [, setLocation] = useLocation();

  const goBack = () => window.history.back();

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -30 }}
      transition={{ duration: 0.6, ease: "easeInOut" }}
      className="min-h-screen bg-gray-50"
      style={{ fontFamily: 'SF Pro Rounded, -apple-system, BlinkMacSystemFont, system-ui, sans-serif' }}
    >
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-md md:max-w-3xl lg:max-w-5xl xl:max-w-6xl mx-auto px-4 md:px-10 py-4">
          <div className="flex items-center">
            <Button variant="ghost" size="icon" onClick={goBack} className="mr-3 hover:bg-transparent">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <p className="text-sm text-gray-500 uppercase tracking-wider mb-1">LEGAL</p>
              <h1 className="text-xl font-bold text-gray-900 mb-1">Termos de Uso</h1>
              <p className="text-sm text-gray-500">Última atualização: 14/05/2026 · Versão 1.0.0</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-md md:max-w-3xl lg:max-w-5xl xl:max-w-6xl mx-auto px-4 md:px-10 py-6 pb-16">
        <div className="space-y-6">

          <div className="mb-6 mt-2">
            <h2 className="text-xl font-bold text-gray-900 mb-1 text-center">TERMOS DE USO DO APLICATIVO CLUBE DO GRITO</h2>
            <p className="text-gray-600 text-sm leading-relaxed text-justify mt-2">
              Estes Termos regulam o uso do aplicativo CLUBE DO GRITO, disponibilizado por INSTITUTO DE CAPACITAÇÃO E AÇÃO SOCIAL O GRITO, CNPJ 28.790.664/0001-10.
            </p>
            <p className="text-gray-600 text-sm leading-relaxed text-justify mt-2">
              Ao utilizar o aplicativo, o usuário declara concordar com estes Termos.
            </p>
          </div>

          <div className="mb-6">
            <h3 className="text-base font-bold text-gray-900 mb-2">1. OBJETO</h3>
            <p className="text-gray-700 text-sm leading-relaxed text-justify">
              O aplicativo tem como finalidade servir como plataforma digital oficial da instituição para centralizar, organizar e disponibilizar conteúdos institucionais de forma acessível, segura e atualizada, permitindo aos usuários conhecer melhor a atuação da entidade, sua missão, seus valores, suas ações e os projetos por ela desenvolvidos. Além disso, o aplicativo busca promover a interação entre a instituição e seus usuários, possibilitando o acesso a informações, comunicações, atualizações, campanhas, eventos, programas e demais iniciativas de interesse público ou institucional. Também constitui finalidade do aplicativo viabilizar a realização de doações e outras formas de apoio à instituição, por meio de funcionalidades específicas destinadas à captação de recursos, sempre em conformidade com a legislação aplicável. Ainda, o aplicativo tem por objetivo ampliar a divulgação de projetos, atividades, campanhas, ações sociais, parcerias e iniciativas promovidas ou apoiadas pela instituição, fortalecendo sua transparência, seu relacionamento com a comunidade e o engajamento de usuários, apoiadores, parceiros e demais interessados.
            </p>
          </div>

          <div className="mb-6">
            <h3 className="text-base font-bold text-gray-900 mb-2">2. CADASTRO</h3>
            <p className="text-gray-700 text-sm leading-relaxed text-justify">
              Para a utilização de determinadas funcionalidades do aplicativo, o usuário poderá ser solicitado a realizar cadastro, ocasião em que se compromete a fornecer informações verdadeiras, completas e atualizadas, responsabilizando-se pela veracidade dos dados inseridos. O usuário também se compromete a manter seus dados sempre atualizados, bem como a zelar pela confidencialidade de suas credenciais de acesso, sendo vedado o compartilhamento de sua conta com terceiros, sob pena de responsabilização por eventuais usos indevidos.
            </p>
          </div>

          <div className="mb-6">
            <h3 className="text-base font-bold text-gray-900 mb-2">3. TIPOS DE USUÁRIOS</h3>
            <p className="text-gray-700 text-sm leading-relaxed text-justify">
              O aplicativo poderá contemplar diferentes perfis de usuários, incluindo usuários em geral, doadores, patrocinadores e participantes de projetos, de acordo com a forma de utilização e interação com a instituição. Cada um desses perfis poderá ter acesso a funcionalidades específicas, conteúdos diferenciados e níveis distintos de interação dentro da plataforma, conforme as características de sua participação, podendo envolver, por exemplo, acesso a áreas exclusivas, acompanhamento de projetos, realização de doações, participação em iniciativas institucionais ou outras funcionalidades disponibilizadas pela instituição.
            </p>
          </div>

          <div className="mb-6">
            <h3 className="text-base font-bold text-gray-900 mb-2">4. USO ADEQUADO</h3>
            <p className="text-gray-700 text-sm leading-relaxed text-justify">
              O usuário compromete-se a utilizar o aplicativo de forma ética, responsável e em conformidade com a legislação vigente, abstendo-se de utilizá-lo para fins ilícitos ou contrários à ordem pública. Compromete-se, ainda, a não praticar qualquer ato que viole direitos de terceiros, incluindo direitos de propriedade intelectual, privacidade ou imagem, bem como a não tentar acessar, interferir, invadir ou explorar indevidamente sistemas, dados, funcionalidades ou áreas restritas do aplicativo, seja por meios técnicos ou por qualquer outra forma.
            </p>
          </div>

          <div className="mb-6">
            <h3 className="text-base font-bold text-gray-900 mb-2">5. DOAÇÕES</h3>
            <p className="text-gray-700 text-sm leading-relaxed text-justify">
              As doações realizadas por meio do aplicativo possuem caráter voluntário e espontâneo, não sendo exigidas como condição para acesso ou utilização das funcionalidades da plataforma. Tais doações poderão ser processadas por meio de plataformas terceiras especializadas em meios de pagamento, às quais poderão ser aplicáveis termos e políticas próprias. A realização de doações não gera, por si só, qualquer vínculo contratual contínuo entre o doador e a instituição, caracterizando-se como ato de liberalidade, sem direito a contraprestações, salvo quando expressamente previsto em campanhas ou iniciativas específicas.
            </p>
          </div>

          <div className="mb-6">
            <h3 className="text-base font-bold text-gray-900 mb-2">6. PROPRIEDADE INTELECTUAL</h3>
            <p className="text-gray-700 text-sm leading-relaxed text-justify">
              Todo o conteúdo disponibilizado no aplicativo, incluindo, mas não se limitando a textos, imagens, vídeos, marcas, logotipos, materiais institucionais e demais elementos, é de titularidade da instituição ou utilizado com a devida autorização, sendo protegido pelas normas de direitos autorais e de propriedade intelectual aplicáveis. Dessa forma, é expressamente vedado ao usuário copiar, reproduzir, distribuir, modificar, transmitir ou utilizar, total ou parcialmente, qualquer conteúdo do aplicativo sem prévia e expressa autorização da instituição, sob pena de responsabilização nos termos da legislação vigente.
            </p>
          </div>

          <div className="mb-6">
            <h3 className="text-base font-bold text-gray-900 mb-2">7. RESPONSABILIDADE</h3>
            <p className="text-gray-700 text-sm leading-relaxed text-justify">
              A instituição envida seus melhores esforços para assegurar o adequado funcionamento do aplicativo, contudo não se responsabiliza por eventuais falhas decorrentes de fatores externos alheios ao seu controle, tais como indisponibilidade de conexão à internet, falhas em serviços de terceiros, problemas técnicos em dispositivos dos usuários ou interrupções de sistemas operados por parceiros. Da mesma forma, não garante a disponibilidade contínua e ininterrupta do aplicativo, podendo ocorrer eventuais indisponibilidades temporárias para manutenção, atualizações ou por motivos técnicos, sem que isso gere qualquer direito a indenização.
            </p>
          </div>

          <div className="mb-6">
            <h3 className="text-base font-bold text-gray-900 mb-2">8. LINKS EXTERNOS</h3>
            <p className="text-gray-700 text-sm leading-relaxed text-justify">
              O aplicativo poderá conter links de redirecionamento para sites, plataformas ou serviços de terceiros, os quais não são de responsabilidade da instituição. Nesses casos, a instituição não possui qualquer controle sobre o conteúdo, práticas, políticas ou condições desses ambientes externos, não se responsabilizando, portanto, por suas informações, serviços, termos de uso ou políticas de privacidade, sendo recomendável que o usuário os consulte previamente antes de qualquer interação.
            </p>
          </div>

          <div className="mb-6">
            <h3 className="text-base font-bold text-gray-900 mb-2">9. PRIVACIDADE</h3>
            <p className="text-gray-700 text-sm leading-relaxed text-justify">
              O tratamento de dados pessoais realizado no âmbito do aplicativo observará integralmente as disposições previstas na{' '}
              <button
                onClick={() => setLocation('/politica-de-privacidade')}
                className="underline font-medium text-gray-900"
              >
                Política de Privacidade
              </button>
              , a qual estabelece, de forma detalhada, as regras relativas à coleta, uso, armazenamento, compartilhamento e proteção das informações dos usuários, em conformidade com a legislação aplicável.
            </p>
          </div>

          <div className="mb-6">
            <h3 className="text-base font-bold text-gray-900 mb-2">10. SUSPENSÃO E ENCERRAMENTO</h3>
            <p className="text-gray-700 text-sm leading-relaxed text-justify">
              A instituição poderá, a seu exclusivo critério, suspender contas, limitar ou restringir o acesso do usuário ao aplicativo, total ou parcialmente, sempre que verificar a violação destes Termos de Uso, o descumprimento da legislação vigente ou a prática de condutas que possam comprometer o funcionamento da plataforma, a segurança dos dados ou os direitos de terceiros, sem prejuízo das demais medidas cabíveis.
            </p>
          </div>

          <div className="mb-6">
            <h3 className="text-base font-bold text-gray-900 mb-2">11. MODIFICAÇÕES</h3>
            <p className="text-gray-700 text-sm leading-relaxed text-justify">
              Os presentes Termos de Uso poderão ser atualizados, modificados ou revisados a qualquer momento, a critério da instituição, com o objetivo de refletir alterações legais, regulatórias, operacionais ou funcionais do aplicativo, sendo recomendável que o usuário os consulte periodicamente. A continuidade de uso da plataforma após eventuais atualizações será interpretada como concordância com as novas condições estabelecidas.
            </p>
          </div>

          <div className="mb-8">
            <h3 className="text-base font-bold text-gray-900 mb-2">12. LEGISLAÇÃO APLICÁVEL</h3>
            <p className="text-gray-700 text-sm leading-relaxed text-justify">
              Aplica-se aos presentes Termos de Uso e à utilização do aplicativo a legislação brasileira vigente, especialmente, mas não se limitando, à Lei Geral de Proteção de Dados Pessoais, ao Código Civil Brasileiro, ao Código de Defesa do Consumidor, ao Marco Civil da Internet e à Lei de Direitos Autorais, bem como demais normas aplicáveis à matéria. Fica eleito o foro da comarca de Ribeirão das Neves/MG, com exclusão de qualquer outro, por mais privilegiado que seja, para dirimir eventuais controvérsias oriundas destes Termos de Uso.
            </p>
          </div>

          <div className="border-t border-gray-200 pt-6 text-center">
            <p className="text-xs text-gray-400">
              Instituto O Grito · CNPJ 28.790.664/0001-10 · Versão 1.0.0
            </p>
            <button
              onClick={() => setLocation('/politica-de-privacidade')}
              className="text-xs text-gray-500 underline mt-1 block mx-auto"
            >
              Ver Política de Privacidade
            </button>
          </div>

        </div>
      </div>
    </motion.div>
  );
}
