import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { LGPD_CONTACT_EMAIL } from "@/lib/lgpdContact";

export default function PoliticaDePrivacidade() {
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
              <p className="text-sm text-gray-500 uppercase tracking-wider mb-1">LGPD</p>
              <h1 className="text-xl font-bold text-gray-900 mb-1">Política de Privacidade</h1>
              <p className="text-sm text-gray-500">Última atualização: 14/05/2026 · Versão 1.0.0</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-md md:max-w-3xl lg:max-w-5xl xl:max-w-6xl mx-auto px-4 md:px-10 py-6 pb-16">
        <div className="space-y-6">

          <div className="mb-6 mt-2">
            <h2 className="text-xl font-bold text-gray-900 mb-1 text-center">POLÍTICA DE PRIVACIDADE DO APLICATIVO CLUBE DO GRITO</h2>
            <p className="text-gray-600 text-sm leading-relaxed text-justify mt-2">
              A presente Política de Privacidade tem por finalidade demonstrar o compromisso do INSTITUTO DE CAPACITAÇÃO E AÇÃO SOCIAL O GRITO, CNPJ 28.790.664/0001-10, com a proteção dos dados pessoais dos usuários, em conformidade com a Lei Geral de Proteção de Dados Pessoais.
            </p>
            <p className="text-gray-600 text-sm leading-relaxed text-justify mt-2">
              Ao utilizar o aplicativo CLUBE DO GRITO, o usuário declara estar ciente e de acordo com as disposições desta Política.
            </p>
          </div>

          <div className="mb-6">
            <h3 className="text-base font-bold text-gray-900 mb-2">1. DEFINIÇÕES</h3>
            <p className="text-gray-700 text-sm leading-relaxed text-justify">
              Para os fins desta Política de Privacidade, consideram-se dados pessoais todas as informações relacionadas a pessoa natural identificada ou identificável, ou seja, aquelas que, isoladamente ou em conjunto com outras, permitam identificar o usuário. Considera-se titular a pessoa natural a quem se referem os dados pessoais objeto de tratamento. Já o tratamento de dados compreende toda e qualquer operação realizada com dados pessoais, como coleta, produção, recepção, classificação, utilização, acesso, reprodução, transmissão, distribuição, processamento, arquivamento, armazenamento, eliminação, avaliação ou controle da informação, modificação, comunicação, transferência, difusão ou extração.
            </p>
          </div>

          <div className="mb-6">
            <h3 className="text-base font-bold text-gray-900 mb-2">2. DADOS COLETADOS</h3>
            <p className="text-gray-700 text-sm leading-relaxed text-justify mb-3">
              O aplicativo poderá coletar dados pessoais dos usuários de acordo com a forma de utilização e as funcionalidades acessadas. Dentre os dados coletados, poderão estar incluídos dados cadastrais, como nome completo, e-mail, telefone e CPF, quando necessário para a adequada prestação dos serviços ou cumprimento de obrigações legais. Também poderão ser coletados dados de uso, tais como endereço IP, informações de navegação e, quando expressamente autorizado pelo usuário, dados de geolocalização, com a finalidade de aprimorar a experiência na plataforma e garantir a segurança das operações.
            </p>
            <p className="text-gray-700 text-sm leading-relaxed text-justify">
              No caso de realização de doações, poderão ser coletados dados financeiros estritamente necessários para o processamento do pagamento, os quais poderão ser tratados por meio de plataformas terceiras especializadas, sujeitas às suas próprias políticas e medidas de segurança. Além disso, o aplicativo poderá coletar dados fornecidos voluntariamente pelo usuário, como mensagens enviadas por meio da plataforma, informações inseridas em inscrições de projetos, formulários ou quaisquer outros conteúdos submetidos espontaneamente, sempre respeitando os princípios da finalidade, necessidade e adequação previstos na legislação aplicável.
            </p>
          </div>

          <div className="mb-6">
            <h3 className="text-base font-bold text-gray-900 mb-2">3. FINALIDADE DO TRATAMENTO</h3>
            <p className="text-gray-700 text-sm leading-relaxed text-justify mb-3">
              Os dados pessoais coletados por meio do aplicativo são utilizados para permitir o acesso às funcionalidades da plataforma, possibilitando a autenticação e identificação dos usuários, bem como para o gerenciamento e manutenção de seus cadastros. Tais dados também poderão ser empregados para viabilizar a realização de doações, incluindo o processamento de pagamentos e a gestão das contribuições realizadas, além de permitir a comunicação com o usuário, seja para envio de informações institucionais, atualizações, notificações ou atendimento de demandas.
            </p>
            <p className="text-gray-700 text-sm leading-relaxed text-justify">
              Adicionalmente, os dados poderão ser utilizados para o cumprimento de obrigações legais e regulatórias aplicáveis à instituição, bem como para a melhoria contínua da experiência do usuário no aplicativo, por meio da análise de uso, aperfeiçoamento de funcionalidades e personalização de conteúdos, sempre observando os princípios da finalidade, necessidade e transparência previstos na legislação vigente.
            </p>
          </div>

          <div className="mb-6">
            <h3 className="text-base font-bold text-gray-900 mb-2">4. BASE LEGAL</h3>
            <p className="text-gray-700 text-sm leading-relaxed text-justify">
              O tratamento de dados pessoais realizado no âmbito do aplicativo fundamenta-se nas bases legais previstas na legislação vigente, podendo ocorrer com base no consentimento do titular, quando este autoriza de forma livre, informada e inequívoca a utilização de seus dados para finalidades específicas; na execução de contrato ou de procedimentos preliminares relacionados ao uso da plataforma, quando o tratamento for necessário para viabilizar funcionalidades, serviços ou interações solicitadas pelo usuário; no cumprimento de obrigação legal ou regulatória, quando a instituição estiver obrigada a tratar ou armazenar determinados dados; e, ainda, no legítimo interesse da instituição, desde que respeitados os direitos e liberdades fundamentais do titular e observados os princípios da necessidade, adequação e transparência.
            </p>
          </div>

          <div className="mb-6">
            <h3 className="text-base font-bold text-gray-900 mb-2">5. COMPARTILHAMENTO DE DADOS</h3>
            <p className="text-gray-700 text-sm leading-relaxed text-justify">
              Os dados pessoais coletados poderão ser compartilhados com terceiros, quando necessário para a adequada prestação dos serviços e cumprimento das finalidades descritas nesta Política. Nesse sentido, poderão ser compartilhados com plataformas de pagamento, para viabilizar o processamento de doações; com provedores de tecnologia e infraestrutura, responsáveis pelo armazenamento, processamento e funcionamento do aplicativo; com parceiros institucionais, quando houver necessidade para execução de projetos, iniciativas ou atividades vinculadas à instituição; e com autoridades públicas, sempre que houver obrigação legal, regulatória ou ordem judicial que assim determine, observados os princípios da legalidade, necessidade e segurança no tratamento dos dados.
            </p>
          </div>

          <div className="mb-6">
            <h3 className="text-base font-bold text-gray-900 mb-2">6. ARMAZENAMENTO E SEGURANÇA</h3>
            <p className="text-gray-700 text-sm leading-relaxed text-justify">
              Os dados pessoais são armazenados em ambiente seguro e controlado, sendo adotadas medidas técnicas e administrativas adequadas para garantir sua proteção, confidencialidade e integridade. Tais medidas visam prevenir e mitigar riscos relacionados a acessos não autorizados, vazamentos, perda, destruição, alteração ou qualquer forma de tratamento inadequado ou ilícito, em conformidade com as melhores práticas de segurança da informação e com a legislação aplicável.
            </p>
          </div>

          <div className="mb-6">
            <h3 className="text-base font-bold text-gray-900 mb-2">7. TEMPO DE RETENÇÃO</h3>
            <p className="text-gray-700 text-sm leading-relaxed text-justify mb-3">
              Os dados pessoais coletados serão armazenados e mantidos pelo período estritamente necessário para o cumprimento das finalidades para as quais foram coletados, considerando a natureza do serviço prestado, a relação mantida com o usuário e as obrigações decorrentes do uso da plataforma. Além disso, poderão ser conservados por prazo adicional sempre que necessário para o cumprimento de obrigações legais ou regulatórias, para o exercício regular de direitos em processos judiciais, administrativos ou arbitrais, bem como para resguardar interesses legítimos da instituição, desde que respeitados os direitos e liberdades fundamentais do titular.
            </p>
            <p className="text-gray-700 text-sm leading-relaxed text-justify">
              Encerrada a finalidade do tratamento ou esgotados os prazos legais aplicáveis, os dados pessoais serão submetidos a procedimento de descarte seguro, podendo ser definitivamente excluídos dos sistemas ou, quando viável e pertinente, anonimizados, de forma que não seja mais possível a identificação do titular. Tais procedimentos serão realizados em conformidade com as melhores práticas de segurança da informação, garantindo a proteção contra acessos indevidos, vazamentos ou qualquer forma de tratamento irregular, em observância à legislação vigente.
            </p>
          </div>

          <div className="mb-6">
            <h3 className="text-base font-bold text-gray-900 mb-2">8. DIREITOS DO TITULAR</h3>
            <p className="text-gray-700 text-sm leading-relaxed text-justify">
              O usuário, na qualidade de titular de dados pessoais, poderá exercer, a qualquer momento e mediante requisição, os direitos assegurados pela legislação vigente, incluindo a confirmação da existência de tratamento de seus dados, o acesso às informações que lhe digam respeito, a correção de dados incompletos, inexatos ou desatualizados, bem como a solicitação de exclusão de dados tratados com base em seu consentimento. Poderá, ainda, requerer a portabilidade de seus dados a outro fornecedor de serviço ou produto, observadas as regulamentações aplicáveis, e revogar o consentimento anteriormente concedido, quando essa for a base legal do tratamento, sem prejuízo da legalidade das operações realizadas anteriormente à revogação.
            </p>
          </div>

          <div className="mb-6">
            <h3 className="text-base font-bold text-gray-900 mb-2">9. CANAL DE CONTATO</h3>
            <p className="text-gray-700 text-sm leading-relaxed text-justify">
              Para exercer os direitos relacionados ao tratamento de seus dados pessoais, o usuário poderá entrar em contato com a instituição por meio do canal específico de atendimento à privacidade, disponível pelo endereço eletrônico{' '}
              <a href={`mailto:${LGPD_CONTACT_EMAIL}`} className="font-medium text-gray-900 underline">
                {LGPD_CONTACT_EMAIL}
              </a>
              , por meio do qual serão recebidas e tratadas as solicitações, dúvidas ou requisições relacionadas à proteção de dados, nos termos da legislação vigente.
            </p>
          </div>

          <div className="mb-6">
            <h3 className="text-base font-bold text-gray-900 mb-2">10. COOKIES E TECNOLOGIAS</h3>
            <p className="text-gray-700 text-sm leading-relaxed text-justify">
              O aplicativo poderá utilizar cookies e tecnologias similares com a finalidade de melhorar a experiência do usuário, personalizar conteúdos e funcionalidades, bem como realizar análises de uso e desempenho da plataforma. Tais tecnologias permitem, por exemplo, reconhecer preferências, otimizar a navegação e compreender o comportamento dos usuários para aprimoramento contínuo dos serviços oferecidos. O usuário poderá, a qualquer momento, gerenciar ou restringir a utilização dessas tecnologias por meio das configurações do seu dispositivo ou navegador, ciente de que a desativação de determinados recursos poderá impactar o funcionamento adequado de algumas funcionalidades do aplicativo.
            </p>
          </div>

          <div className="mb-6">
            <h3 className="text-base font-bold text-gray-900 mb-2">11. DADOS DE MENORES</h3>
            <p className="text-gray-700 text-sm leading-relaxed text-justify">
              Caso haja coleta e tratamento de dados pessoais de crianças e adolescentes, estes serão realizados em conformidade com a legislação aplicável, especialmente com o Estatuto da Criança e do Adolescente e com as diretrizes da Lei Geral de Proteção de Dados Pessoais, bem como com as disposições introduzidas pela chamada regulamentação do ambiente digital voltada à proteção de menores. Nessas hipóteses, será exigido o consentimento prévio, específico e em destaque de pelo menos um dos responsáveis legais, observando-se o melhor interesse da criança e do adolescente, com a adoção de medidas adicionais de segurança, transparência e limitação do tratamento de dados.
            </p>
          </div>

          <div className="mb-8">
            <h3 className="text-base font-bold text-gray-900 mb-2">12. ALTERAÇÕES</h3>
            <p className="text-gray-700 text-sm leading-relaxed text-justify">
              A presente Política de Privacidade poderá ser atualizada, modificada ou revisada a qualquer momento, a critério da instituição, com o objetivo de refletir alterações legislativas, regulatórias, operacionais ou relacionadas às funcionalidades do aplicativo, sendo recomendável que o usuário a consulte periodicamente. A continuidade de uso da plataforma após eventuais atualizações será interpretada como concordância com os novos termos estabelecidos.
            </p>
          </div>

          <div className="border-t border-gray-200 pt-6 text-center">
            <p className="text-xs text-gray-400">
              Instituto O Grito · CNPJ 28.790.664/0001-10 · Versão 1.0.0
            </p>
            <button
              onClick={() => setLocation('/termos-de-uso')}
              className="text-xs text-gray-500 underline mt-1 block mx-auto"
            >
              Ver Termos de Uso
            </button>
          </div>

        </div>
      </div>
    </motion.div>
  );
}
