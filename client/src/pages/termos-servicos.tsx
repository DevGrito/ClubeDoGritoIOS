import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ChevronDown } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import {
  getTermosActor,
  isAuthenticatedForTermos,
  registrarAceiteTermos,
  markTermosAcceptedInSession,
} from "@/lib/termosAcceptance";
import { LGPD_CONTACT_EMAIL } from "@/lib/lgpdContact";

export default function TermosServicos() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [showScrollIndicator, setShowScrollIndicator] = useState(true);
  const [showAcceptButton, setShowAcceptButton] = useState(false);
  const [aceitando, setAceitando] = useState(false);

  const urlParams = new URLSearchParams(window.location.search);
  const fromHelp = urlParams.get("from") === "help";
  const isAluno = sessionStorage.getItem("aluno_auth") === "true";
  const modoLeitura = isAluno || fromHelp;

  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY > 100;
      setShowScrollIndicator(!scrolled);
      const scrollHeight = document.documentElement.scrollHeight || document.body.scrollHeight;
      const scrollTop = document.documentElement.scrollTop || document.body.scrollTop || window.pageYOffset;
      const clientHeight = document.documentElement.clientHeight || window.innerHeight;
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 100;
      setShowAcceptButton(isAtBottom);
    };
    window.addEventListener('scroll', handleScroll);
    const timeoutId = setTimeout(handleScroll, 500);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(timeoutId);
    };
  }, []);

  const handleAccept = async () => {
    if (isAuthenticatedForTermos()) {
      setAceitando(true);
      const actor = getTermosActor();
      if (!actor) {
        setAceitando(false);
        toast({
          title: "Erro",
          description: "Sessão não encontrada. Faça login novamente.",
          variant: "destructive",
        });
        return;
      }
      const ok = await registrarAceiteTermos(actor.userId, actor.tipo);
      setAceitando(false);
      if (!ok) {
        toast({
          title: "Erro",
          description: "Não foi possível registrar o aceite. Tente novamente.",
          variant: "destructive",
        });
        return;
      }
      markTermosAcceptedInSession();
      const papel = localStorage.getItem("userPapel");
      const isDonor =
        papel === "doador" ||
        papel === "user" ||
        papel === "leo" ||
        localStorage.getItem("isDonor") === "true";
      if (isDonor) {
        setLocation("/tdoador");
      } else if (window.history.length > 1) {
        window.history.back();
      } else {
        setLocation("/");
      }
      return;
    }

    localStorage.setItem("termsAccepted", "true");
    setLocation("/donation-flow?step=1");
  };

  const goBack = () => {
    window.history.back();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -30 }}
      transition={{ duration: 0.6, ease: "easeInOut" }}
      className="min-h-screen bg-gray-50"
      style={{ fontFamily: 'SF Pro Rounded, -apple-system, BlinkMacSystemFont, system-ui, sans-serif' }}
    >
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-md md:max-w-3xl lg:max-w-5xl xl:max-w-6xl mx-auto px-4 md:px-10 py-4">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={goBack}
              className="mr-3 hover:bg-transparent"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <p className="text-sm text-gray-500 uppercase tracking-wider mb-1">EU CONCORDO</p>
              <h1 className="text-xl font-bold text-gray-900 mb-1">Termos de Uso e Política de Privacidade</h1>
              <p className="text-sm text-gray-500">Última atualização: 01/04/2026</p>
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="max-w-md md:max-w-3xl lg:max-w-5xl xl:max-w-6xl mx-auto px-4 md:px-10 py-6 pb-24">
        <div className="space-y-6">

          {/* ─── TERMOS DE USO ─── */}
          <div className="mb-6 mt-2">
            <h2 className="text-xl font-bold text-gray-900 mb-1 text-center">TERMOS DE USO DO APLICATIVO</h2>
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

          {/* Indicador de scroll */}
          {showScrollIndicator && (
            <div className="flex flex-col items-center py-4">
              <div className="bg-gray-800 text-white px-4 py-2 rounded-full text-sm font-medium flex items-center">
                <span>Role para baixo</span>
                <ChevronDown className="w-4 h-4 ml-2 animate-bounce" />
              </div>
            </div>
          )}

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
              O tratamento de dados pessoais realizado no âmbito do aplicativo observará integralmente as disposições previstas na Política de Privacidade, a qual estabelece, de forma detalhada, as regras relativas à coleta, uso, armazenamento, compartilhamento e proteção das informações dos usuários, em conformidade com a legislação aplicável.
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

          {/* ─── POLÍTICA DE PRIVACIDADE ─── */}
          <div className="mb-6 mt-10 border-t border-gray-200 pt-8">
            <h2 className="text-xl font-bold text-gray-900 mb-1 text-center">POLÍTICA DE PRIVACIDADE DO APLICATIVO</h2>
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
            <p className="text-gray-700 text-sm leading-relaxed mb-3">
              O aplicativo poderá coletar dados pessoais dos usuários de acordo com a forma de utilização e as funcionalidades acessadas. Dentre os dados coletados, poderão estar incluídos dados cadastrais, como nome completo, e-mail, telefone e CPF, quando necessário para a adequada prestação dos serviços ou cumprimento de obrigações legais. Também poderão ser coletados dados de uso, tais como endereço IP, informações de navegação e, quando expressamente autorizado pelo usuário, dados de geolocalização, com a finalidade de aprimorar a experiência na plataforma e garantir a segurança das operações.
            </p>
            <p className="text-gray-700 text-sm leading-relaxed text-justify">
              No caso de realização de doações, poderão ser coletados dados financeiros estritamente necessários para o processamento do pagamento, os quais poderão ser tratados por meio de plataformas terceiras especializadas, sujeitas às suas próprias políticas e medidas de segurança. Além disso, o aplicativo poderá coletar dados fornecidos voluntariamente pelo usuário, como mensagens enviadas por meio da plataforma, informações inseridas em inscrições de projetos, formulários ou quaisquer outros conteúdos submetidos espontaneamente, sempre respeitando os princípios da finalidade, necessidade e adequação previstos na legislação aplicável.
            </p>
          </div>

          <div className="mb-6">
            <h3 className="text-base font-bold text-gray-900 mb-2">3. FINALIDADE DO TRATAMENTO</h3>
            <p className="text-gray-700 text-sm leading-relaxed mb-3">
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
            <p className="text-gray-700 text-sm leading-relaxed mb-3">
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
              Para exercer os direitos relacionados ao tratamento de seus dados pessoais, o usuário poderá entrar em contato com a instituição por meio do canal específico de atendimento à privacidade, disponível pelo endereço eletrônico <span className="font-medium text-gray-900">{LGPD_CONTACT_EMAIL}</span>, por meio do qual serão recebidas e tratadas as solicitações, dúvidas ou requisições relacionadas à proteção de dados, nos termos da legislação vigente.
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

        </div>
      </div>

      {/* Fixed Accept Button */}
      {!modoLeitura && (
        <div className={`fixed bottom-4 left-0 right-0 p-4 z-30 transition-all duration-700 ease-in-out ${
          showAcceptButton ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
        }`}>
          <div className="max-w-md md:max-w-3xl lg:max-w-5xl xl:max-w-6xl mx-auto flex justify-center">
            <Button
              onClick={handleAccept}
              disabled={aceitando}
              className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-3 px-8 rounded-full shadow-lg transform transition-transform duration-300 hover:scale-105 disabled:opacity-70"
              style={{ fontFamily: 'SF Pro Rounded, -apple-system, BlinkMacSystemFont, system-ui, sans-serif' }}
            >
              {aceitando ? "Registrando..." : "Aceite e Continue"}
            </Button>
          </div>
        </div>
      )}

      {/* Gradient fade */}
      <div className="fixed bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-gray-50 via-gray-50/80 to-transparent pointer-events-none z-10"></div>

      {/* Role para baixo indicator */}
      <div className={`fixed bottom-8 left-1/2 transform -translate-x-1/2 z-20 transition-opacity duration-500 ${showScrollIndicator ? 'opacity-100' : 'opacity-0'}`}>
        <div className="bg-white border-2 border-black rounded-full px-6 py-2 shadow-lg">
          <span className="text-black font-medium text-sm">Role para baixo</span>
        </div>
      </div>
    </motion.div>
  );
}
