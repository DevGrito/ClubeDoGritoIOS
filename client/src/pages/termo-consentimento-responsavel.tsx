import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Shield } from "lucide-react";
import { motion } from "framer-motion";
import { LGPD_CONTACT_EMAIL } from "@/lib/lgpdContact";

export default function TermoConsentimentoResponsavel() {
  const goBack = () => window.history.back();

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-gray-50"
      style={{ fontFamily: "SF Pro Rounded, -apple-system, BlinkMacSystemFont, system-ui, sans-serif" }}
    >
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-md md:max-w-3xl mx-auto px-4 py-4 flex items-center">
          <Button variant="ghost" size="icon" onClick={goBack} className="mr-3 hover:bg-transparent">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider flex items-center gap-1">
              <Shield className="w-3 h-3" /> LGPD — Menores
            </p>
            <h1 className="text-lg font-bold text-gray-900">Termo de Consentimento para Responsáveis</h1>
            <p className="text-xs text-gray-400">Versão 1.0.0 · 14/05/2026</p>
          </div>
        </div>
      </div>

      <div className="max-w-md md:max-w-3xl mx-auto px-4 py-6 pb-16 space-y-6">

        <div>
          <h2 className="text-lg font-bold text-gray-900 text-center mb-3">
            TERMO DE CONSENTIMENTO DO RESPONSÁVEL LEGAL
          </h2>
          <p className="text-sm text-gray-600 text-justify leading-relaxed">
            O presente Termo tem por finalidade obter o consentimento prévio, específico e em destaque do responsável legal para o
            tratamento de dados pessoais de criança ou adolescente participante dos projetos do INSTITUTO DE CAPACITAÇÃO E AÇÃO
            SOCIAL O GRITO, CNPJ 28.790.664/0001-10, em conformidade com a Lei Geral de Proteção de Dados Pessoais (LGPD), o
            Estatuto da Criança e do Adolescente (ECA) e a regulamentação do ambiente digital voltada à proteção de menores.
          </p>
        </div>

        <Section title="1. DADOS DO PARTICIPANTE">
          <p>
            Os dados pessoais coletados do participante incluem: nome completo, data de nascimento, CPF (quando aplicável),
            endereço, telefone de contato, informações de saúde relevantes para participação nos projetos, dados escolares e,
            quando necessário para evidência de participação, imagem fotográfica ou audiovisual.
          </p>
        </Section>

        <Section title="2. FINALIDADE DO TRATAMENTO">
          <p>Os dados coletados serão utilizados exclusivamente para:</p>
          <ul className="list-disc list-inside mt-2 space-y-1 text-sm text-gray-700">
            <li>Registro e controle de participação nos projetos institucionais (PEC, Inclusão Produtiva, Favela 3D e outros);</li>
            <li>Elaboração de relatórios de impacto social para prestação de contas a financiadores e parceiros;</li>
            <li>Controle de presença e frequência em atividades;</li>
            <li>Comunicação com o responsável legal sobre a participação do menor;</li>
            <li>Cumprimento de obrigações legais e regulatórias aplicáveis à instituição.</li>
          </ul>
        </Section>

        <Section title="3. USO DE IMAGEM">
          <p>
            O uso de imagem fotográfica ou audiovisual do participante, quando autorizado pelo responsável legal no ato do
            cadastro, destina-se exclusivamente a registros institucionais, relatórios de impacto e materiais de comunicação
            da própria instituição. É vedado o uso de imagens para fins comerciais ou compartilhamento com terceiros sem nova
            autorização expressa do responsável.
          </p>
        </Section>

        <Section title="4. BASE LEGAL">
          <p>
            O tratamento de dados de crianças e adolescentes fundamenta-se no consentimento prévio, específico e em destaque
            do responsável legal, conforme disposto no Art. 14 da LGPD, no melhor interesse da criança e do adolescente,
            observadas as diretrizes da ANPD e as disposições do ECA.
          </p>
        </Section>

        <Section title="5. COMPARTILHAMENTO DE DADOS">
          <p>
            Os dados do participante poderão ser compartilhados com parceiros institucionais diretamente vinculados à execução
            dos projetos, com autoridades públicas quando houver obrigação legal, e com financiadores para fins de prestação
            de contas, sempre de forma anonimizada quando possível. Não ocorrerá compartilhamento com fins comerciais.
          </p>
        </Section>

        <Section title="6. ARMAZENAMENTO E SEGURANÇA">
          <p>
            Os dados são armazenados em ambiente seguro (Google Cloud Storage e banco de dados PostgreSQL com acesso
            autenticado e criptografado), sendo adotadas medidas técnicas e administrativas para sua proteção, confidencialidade
            e integridade.
          </p>
        </Section>

        <Section title="7. TEMPO DE RETENÇÃO">
          <p>
            Os dados serão mantidos enquanto o participante estiver vinculado aos projetos da instituição, acrescido de prazo
            adicional necessário para o cumprimento de obrigações legais, defesa de direitos em processos judiciais ou
            administrativos, e prestação de contas a órgãos financiadores. Após o encerramento da finalidade, os dados serão
            descartados de forma segura ou anonimizados.
          </p>
        </Section>

        <Section title="8. DIREITOS DO RESPONSÁVEL LEGAL">
          <p>
            O responsável legal poderá, a qualquer momento: acessar os dados do participante, solicitar correção, requerer
            a exclusão (quando não houver obrigação legal de retenção), revogar o consentimento e solicitar a portabilidade
            dos dados. Para exercer esses direitos, entre em contato pelo e-mail{" "}
            <a href={`mailto:${LGPD_CONTACT_EMAIL}`} className="underline font-medium text-gray-900">
              {LGPD_CONTACT_EMAIL}
            </a>.
          </p>
        </Section>

        <Section title="9. REVOGAÇÃO DO CONSENTIMENTO">
          <p>
            O responsável legal poderá revogar este consentimento a qualquer momento, sem que isso acarrete prejuízo ao
            participante quanto à sua continuidade nos projetos, ressalvadas as hipóteses em que o tratamento de determinados
            dados for indispensável para a participação nas atividades ou para o cumprimento de obrigação legal.
          </p>
        </Section>

        <Section title="10. CANAL DE CONTATO">
          <p>
            Para exercer direitos, esclarecer dúvidas ou revogar consentimento, o responsável legal poderá entrar em contato
            com o encarregado de dados (DPO) pelo endereço eletrônico{" "}
            <a href={`mailto:${LGPD_CONTACT_EMAIL}`} className="underline font-medium text-gray-900">
              {LGPD_CONTACT_EMAIL}
            </a>.
          </p>
        </Section>

        <div className="border-t border-gray-200 pt-6 text-center space-y-1">
          <p className="text-xs text-gray-400">Instituto O Grito · CNPJ 28.790.664/0001-10 · Versão 1.0.0</p>
          <p className="text-xs text-gray-400">Em conformidade com a LGPD (Lei 13.709/2018) e ECA (Lei 8.069/1990)</p>
        </div>

      </div>
    </motion.div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-sm font-bold text-gray-900 mb-2">{title}</h3>
      <div className="text-sm text-gray-700 leading-relaxed text-justify">{children}</div>
    </div>
  );
}
