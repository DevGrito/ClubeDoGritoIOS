import { Switch, Route, useLocation } from "wouter";
import { useEffect, useState, lazy, Suspense, useRef } from "react";
import { iosPushNeedsHomeScreen } from "@/utils/device";
import {
  usePushNotificationsContext,
  PushNotificationsProvider,
} from "@/contexts/PushNotificationsContext";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AnimatePresence } from "framer-motion";
import { PageTransition } from "@/components/PageTransition";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { setupGlobalErrorHandling } from "@/utils/errorHandler";
import ConnectionStatus from "@/components/ConnectionStatus";
import { useSubscriptionVerify } from "@/hooks/useSubscriptionVerify";
import SplashScreen from "@/pages/splash-screen";
import SplashGate from "@/components/SplashGate";
import Plans from "@/pages/plans";
import Register from "@/pages/register";
import DonationFlow from "@/pages/donation-flow";
import StripePayment from "@/pages/stripe-payment";
import PaymentErrorDemo from "@/pages/payment-error-demo";
import TermosServicos from "@/pages/termos-servicos";
import TermosDeUso from "@/pages/termos-de-uso";
import PoliticaDePrivacidade from "@/pages/politica-de-privacidade";
import PoliticaDeCookies from "@/pages/politica-de-cookies";
import PoliticaDeUsoDeImagem from "@/pages/politica-de-uso-de-imagem";
import DireitosDoTitular from "@/pages/direitos-do-titular";
import MeusDados from "@/pages/meus-dados";
import AdminRopa from "@/pages/admin-ropa";
import TermoConsentimentoResponsavel from "@/pages/termo-consentimento-responsavel";
import MenorSemConsentimento from "@/pages/menor-sem-consentimento";
import AutorizacaoResponsavel from "@/pages/autorizacao-responsavel";
import Entrar from "@/pages/entrar";
import Verify from "@/pages/verify";
// Removed VerifyDonation import to maintain stability
import Welcome from "@/pages/welcome";
import Sorteio from "@/pages/sorteio";
import Noticias from "@/pages/noticias";
import Perfil from "@/pages/perfil";
import LinkIndicacao from "@/pages/link-indicacao";
import LinkAfiliadoCadastro from "@/pages/link-afiliado-cadastro";
import DadosCadastrais from "@/pages/dados-cadastrais";
import Pagamentos from "@/pages/pagamentos";
import Configuracoes from "@/pages/configuracoes";
import Sobre from "@/pages/sobre";
import Conselho from "@/pages/conselho";

import LeoMartins from "@/pages/leo-martins";
import AdminGeral from "@/pages/admin-geral";
import AguardandoAprovacao from "@/pages/aguardando-aprovacao";
import PecCoordenador from "@/pages/pec-coordenador";
import Aluno from "@/pages/aluno";
import AlunoLogin from "@/pages/aluno-login";
import EventosHome from "@/pages/eventos-home";
import EventoDetalhe from "@/pages/evento-detalhe";
import EventoCheckout from "@/pages/evento-checkout";
import EventosAdmin from "@/pages/eventos-admin";
import EventosCadastro from "@/pages/eventos-cadastro";
import EventosPerfil from "@/pages/eventos-perfil";
import DevPage from "@/pages/dev";
import PatrocinadorDashboard from "@/pages/patrocinador-dashboard";
import PerfilPatrocinador from "@/pages/perfil-patrocinador";
import ChangePlan from "@/pages/change-plan";
import CentralAjuda from "@/pages/central-ajuda";
import Impacto from "@/pages/impacto";
import SorteioAdmin from "@/pages/sorteio-admin";
import AdminRedeCredenciais from "@/pages/admin-rede-credenciais";
import AdminCieloCredenciais from "@/pages/admin-cielo-credenciais";
import AdminPagBankOAuth from "@/pages/admin-pagbank-oauth";
import BeneficiosOnboarding from "@/pages/beneficios-onboarding";
import Beneficios from "@/pages/beneficios";
import BeneficioDetalhes from "@/pages/beneficio-detalhes";
import MissoesSemanais from "@/pages/missoes-semanais";
const DevMarketing = lazy(() => import("@/pages/dev-marketing"));
import DashboardLancamento from "@/pages/painel/dashboard-lancamento";
import CreditCardDemo from "@/pages/credit-card-demo";
import MeusLances from "@/pages/meus-lances";
import AssinaturaPausada from "@/pages/assinatura-pausada";
import ReativarAssinatura from "@/pages/reativar-assinatura";
import DevModeBanner from "@/components/DevModeBanner";
import ProtectedRoute from "@/components/ProtectedRoute";
import AutoRedirect from "@/components/AutoRedirect";
import { InAppNotification } from "@/components/InAppNotification";
import { PushNavigationListener } from "@/components/PushNavigationListener";
import PrivacyConsentBootstrap from "@/components/PrivacyConsentBootstrap";
import GritoIntro from "@/pages/grito-intro";
import GritoSelection from "@/pages/grito-selection";
import GestaoVista from "@/pages/gestao-vista";
import DashboardGestaoVista from "@/pages/dashboard-gestao-vista/index";
import GestaoVistaPreview from "@/pages/gestao-vista-preview";
import PagamentoAprovado from "@/pages/pagamento-aprovado";
import PagamentoReprovado from "@/pages/pagamento-reprovado";
import ScannerPage from "@/pages/scanner";
import ScannerLogin from "@/pages/scanner-login";
import TabletChamadaPage from "@/pages/tablet-chamada";
import TabletChamadaLogin from "@/pages/tablet-chamada-login";
import { TabletChamadaProtectedRoute } from "@/components/TabletChamadaProtectedRoute";
import CoordenadorLogin from "@/pages/coordenador-login";
import MonitorLogin from "@/pages/monitor-login";
import ProfessorLogin from "@/pages/professor-login";
import DevLogin from "@/pages/dev-login";
import DevLoginPage from "@/pages/dev-login-page";
import MarketingLogin from "@/pages/marketing-login";
import AdminConciliarPix from "@/pages/admin-conciliar-pix";
import AdminManualSubscription from "@/pages/admin-manual-subscription";
import AdminMigrateDonors from "@/pages/admin-migrate-donors";
import AdminRelatorioAssinaturas from "@/pages/admin-relatorio-assinaturas";
import AdminSolicitacoesExclusao from "@/pages/admin-solicitacoes-exclusao";
import AdminPrivacyConsents from "@/pages/admin-privacy-consents";
import Subscriptions from "@/pages/Subscriptions";

// RBAC Pages
import ProfessorPage from "@/pages/rbac/professor";
const MonitorPage = lazy(() => import("@/pages/rbac/monitor"));
import MarketingPage from "@/pages/rbac/marketing";
import CoordenadorInclusaoPage from "@/pages/rbac/coordenador-inclusao";
import CoordenadorPECPage from "@/pages/rbac/coordenador-pec";
import CoordenadorPsicoPage from "@/pages/rbac/coordenador-psico";
import TecnicaPsicoPage from "@/pages/rbac/tecnica-psico";
import VendedorOutletPage from "@/pages/rbac/vendedor-outlet";
import ConfeccaoPage from "@/pages/rbac/confeccao";
import CoordenadorNegociosPage from "@/pages/rbac/coordenador-negocios";
import CoordenadorAlmoxarifadoPage from "@/pages/rbac/coordenador-almoxarifado";

import NotFound from "@/pages/not-found";
import TermosGuard from "@/components/TermosGuard";
import AlunoTermosGuard from "@/components/AlunoTermosGuard";

// Componente para redirecionamento
function RedirectComponent({ to }: { to: string }) {
  const [, setLocation] = useLocation();
  useEffect(() => {
    setLocation(to);
  }, [to, setLocation]);
  return null;
}

function Router() {
  const [location] = useLocation();
  
  return (
    <div className="w-full h-full bg-white">
      <AnimatePresence mode="sync">
        <PageTransition key={location}>
          <Switch>
      {/* Rotas de login DEVEM vir ANTES da rota "/" para evitar redirecionamento */}
      <Route path="/login/aluno" component={AlunoLogin} />
      <Route path="/menor/sem-consentimento" component={MenorSemConsentimento} />
      <Route path="/menor/autorizacao-responsavel" component={AutorizacaoResponsavel} />
      <Route path="/login/coordenador" component={CoordenadorLogin} />
      <Route path="/login/monitor" component={MonitorLogin} />
      <Route path="/login/professor" component={ProfessorLogin} />
      <Route path="/login/developer" component={DevLogin} />
      <Route path="/login/marketing" component={MarketingLogin} />
      <Route path="/scanner-login" component={ScannerLogin} />
      <Route path="/tablet/chamada/login" component={TabletChamadaLogin} />
      
      <Route path="/" component={Plans} />
      <Route path="/splash-gate" component={SplashGate} />
      <Route path="/splash" component={SplashScreen} />
      <Route path="/plans" component={Plans} />
      <Route path="/register" component={Register} />
      <Route path="/donation-flow" component={DonationFlow} />
      <Route path="/stripe-payment" component={StripePayment} />
      <Route path="/assinatura-pausada" component={AssinaturaPausada} />
      <Route path="/reativar-assinatura" component={ReativarAssinatura} />
      <Route path="/payment-error" component={PaymentErrorDemo} />
      <Route path="/termos-servicos" component={TermosServicos} />
      <Route path="/termos-de-uso" component={TermosDeUso} />
      <Route path="/politica-de-privacidade" component={PoliticaDePrivacidade} />
      <Route path="/politica-de-cookies" component={PoliticaDeCookies} />
      <Route path="/politica-de-uso-de-imagem" component={PoliticaDeUsoDeImagem} />
      <Route path="/direitos-do-titular" component={DireitosDoTitular} />
      <Route path="/termo-consentimento-responsavel" component={TermoConsentimentoResponsavel} />
      <Route path="/entrar" component={Entrar} />
      <Route path="/verify" component={Verify} />
      {/* Removed verify-donation route to maintain stability */}
      
      {/* Novas rotas com proteção */}
      <Route path="/tdoador">
        {() => (
          <ProtectedRoute allowedRoles={['doador', 'user', 'leo']} routeName="/tdoador">
            <TermosGuard><Welcome /></TermosGuard>
          </ProtectedRoute>
        )}
      </Route>
      
      {/* ================ RBAC ISOLATED ROUTES ================ */}
      <Route path="/professor/pec">
        {() => (
          <ProtectedRoute allowedRoles={['professor', 'professor_pec']} routeName="/professor/pec">
            <TermosGuard><ProfessorPage /></TermosGuard>
          </ProtectedRoute>
        )}
      </Route>
      
      <Route path="/professor/inclusao">
        {() => (
          <ProtectedRoute allowedRoles={['professor', 'professor_inclusao']} routeName="/professor/inclusao">
            <TermosGuard><ProfessorPage /></TermosGuard>
          </ProtectedRoute>
        )}
      </Route>

      <Route path="/professor">
        {() => (
          <ProtectedRoute allowedRoles={['professor', 'professor_psico']} routeName="/professor">
            <TermosGuard><ProfessorPage /></TermosGuard>
          </ProtectedRoute>
        )}
      </Route>
      
      <Route path="/monitor/pec">
        {() => (
          <ProtectedRoute allowedRoles={['monitor', 'monitor_pec']} routeName="/monitor/pec">
            <TermosGuard><MonitorPage /></TermosGuard>
          </ProtectedRoute>
        )}
      </Route>
      
      <Route path="/monitor/inclusao">
        {() => (
          <ProtectedRoute allowedRoles={['monitor', 'monitor_inclusao']} routeName="/monitor/inclusao">
            <TermosGuard><MonitorPage /></TermosGuard>
          </ProtectedRoute>
        )}
      </Route>
        
     <Route path="/monitor/psico">
        {() => (
          <ProtectedRoute allowedRoles={['monitor_psico']} routeName="/monitor/psico">
            <TermosGuard><MonitorPage /></TermosGuard>
          </ProtectedRoute>
        )}
      </Route>

      <Route path="/monitor">
        {() => (
          <ProtectedRoute
            allowedRoles={['monitor', 'monitor_pec', 'monitor_inclusao', 'monitor_psico']}
            routeName="/monitor"
          >
            <TermosGuard><MonitorPage /></TermosGuard>
          </ProtectedRoute>
        )}
      </Route>

      <Route path="/rbac/marketing">
        {() => (
          <ProtectedRoute allowedRoles={['marketing']} routeName="/rbac/marketing">
            <TermosGuard><MarketingPage /></TermosGuard>
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/coordenador/inclusao-produtiva">
        {() => (
          <ProtectedRoute allowedRoles={['coordenador_inclusao']} routeName="/coordenador/inclusao-produtiva">
            <TermosGuard><CoordenadorInclusaoPage /></TermosGuard>
          </ProtectedRoute>
        )}
      </Route>
      
      <Route path="/coordenador/esporte-cultura">
        {() => (
          <ProtectedRoute allowedRoles={['coordenador_pec']} routeName="/coordenador/esporte-cultura">
            <TermosGuard><CoordenadorPECPage /></TermosGuard>
          </ProtectedRoute>
        )}
      </Route>
      
      <Route path="/coordenador/psicossocial">
        {() => (
          <ProtectedRoute allowedRoles={['coordenador_psico']} routeName="/coordenador/psicossocial">
            <TermosGuard><CoordenadorPsicoPage /></TermosGuard>
          </ProtectedRoute>
        )}
      </Route>

      <Route path="/tecnica/psicossocial">
        {() => (
          <ProtectedRoute allowedRoles={['tecnica_psico']} routeName="/tecnica/psicossocial">
            <TermosGuard><TecnicaPsicoPage /></TermosGuard>
          </ProtectedRoute>
        )}
      </Route>

      <Route path="/vendedor/outlet" component={VendedorOutletPage} />
      <Route path="/confeccao" component={ConfeccaoPage} />
      <Route path="/coordenador/negocios-sociais">
        {() => (
          <ProtectedRoute
            allowedRoles={['coordenador_negocios', 'admin', 'leo', 'super_admin', 'dev', 'desenvolvedor']}
            routeName="/coordenador/negocios-sociais"
          >
            <TermosGuard><CoordenadorNegociosPage /></TermosGuard>
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/coordenador/almoxarifado">
        {() => (
          <ProtectedRoute
            allowedRoles={['coordenador_almoxarifado', 'admin', 'leo', 'super_admin', 'dev', 'desenvolvedor']}
            routeName="/coordenador/almoxarifado"
          >
            <TermosGuard><CoordenadorAlmoxarifadoPage /></TermosGuard>
          </ProtectedRoute>
        )}
      </Route>
      
      <Route path="/coordenador">
        {() => (
          <ProtectedRoute allowedRoles={['coordenador_inclusao', 'coordenador_pec', 'coordenador_psico', 'tecnica_psico']} routeName="/coordenador">
            <TermosGuard><AutoRedirect /></TermosGuard>
          </ProtectedRoute>
        )}
      </Route>
      {/* ================ END RBAC ROUTES ================ */}
      
      {/* REMOVIDO: Todas as rotas do Sistema PEC conforme solicitação (2025-11-18)
      - /pec-coordenador
      - /pec
      - /pec/projetos/:projectId
      - /pec/atividades/:activityId
      - /pec/turmas/:instanceId
      */}
      <Route path="/administrador">
        {() => (
          <ProtectedRoute allowedRoles={['super_admin', 'leo']} routeName="/administrador">
            <TermosGuard><LeoMartins demoMode={false} /></TermosGuard>
          </ProtectedRoute>
        )}
      </Route>

      <Route path="/admin-geral">
        {() => (
          <ProtectedRoute allowedRoles={['admin', 'super_admin', 'leo']} routeName="/admin-geral">
            <TermosGuard><AdminGeral /></TermosGuard>
          </ProtectedRoute>
        )}
      </Route>
      
      {/* Redirecionamentos das rotas antigas para as novas */}
      <Route path="/welcome">
        {() => <RedirectComponent to="/tdoador" />}
      </Route>
      <Route path="/leo-martins">
        {() => <RedirectComponent to="/administrador" />}
      </Route>
      
      {/* Rotas protegidas do doador */}
      <Route path="/change-plan">
        {() => (
          <ProtectedRoute allowedRoles={['doador', 'user', 'leo', 'super_admin']} routeName="/change-plan">
            <ChangePlan />
          </ProtectedRoute>
        )}
      </Route>

      <Route path="/beneficios-onboarding">
        {() => (
          <ProtectedRoute allowedRoles={['doador', 'user', 'leo']} routeName="/beneficios-onboarding">
            <BeneficiosOnboarding />
          </ProtectedRoute>
        )}
      </Route>

      <Route path="/credit-card-demo" component={CreditCardDemo} />
      
      {/* Fluxo do Grito - após confirmação de pagamento */}
      <Route path="/grito-intro" component={GritoIntro} />
      <Route path="/grito-selection" component={GritoSelection} />
      
      <Route path="/beneficios">
        {() => (
          <ProtectedRoute allowedRoles={['doador', 'user', 'leo']} routeName="/beneficios">
            <Beneficios />
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/meus-lances">
        {() => (
          <ProtectedRoute allowedRoles={['doador', 'user']} routeName="/meus-lances">
            <MeusLances />
          </ProtectedRoute>
        )}
      </Route>

      <Route path="/beneficio-detalhes/:id">
        {() => (
          <ProtectedRoute allowedRoles={['doador', 'user', 'leo']} routeName="/beneficio-detalhes">
            <BeneficioDetalhes />
          </ProtectedRoute>
        )}
      </Route>

      <Route path="/missoes">
        {() => <RedirectComponent to="/missoes-semanais" />}
      </Route>

      <Route path="/missoes-semanais">
        {() => (
          <ProtectedRoute allowedRoles={['doador', 'user', 'leo']} routeName="/missoes-semanais">
            <MissoesSemanais />
          </ProtectedRoute>
        )}
      </Route>

      <Route path="/dev/login" component={DevLoginPage} />
      
      <Route path="/dev/marketing">
        {() => (
          <ProtectedRoute allowedRoles={['dev', 'desenvolvedor', 'dev-marketing']} routeName="/dev/marketing">
            <TermosGuard><DevMarketing /></TermosGuard>
          </ProtectedRoute>
        )}
      </Route>

      <Route path="/painel/estrategico/lancamento">
        {() => (
          <ProtectedRoute allowedRoles={['dev', 'desenvolvedor', 'dev-marketing', 'leo']} routeName="/painel/estrategico/lancamento">
            <DashboardLancamento />
          </ProtectedRoute>
        )}
      </Route>

      <Route path="/subscriptions">
        {() => (
          <ProtectedRoute allowedRoles={['super_admin', 'leo', 'dev']} routeName="/subscriptions">
            <Subscriptions />
          </ProtectedRoute>
        )}
      </Route>

      {/* Gestão à Vista - Monday.com Integration */}
      <Route path="/gestao-vista">
        {() => (
          <ProtectedRoute allowedRoles={['super_admin', 'leo', 'desenvolvedor', 'conselho']} routeName="/gestao-vista">
            <GestaoVista />
          </ProtectedRoute>
        )}
      </Route>

      {/* Novo Dashboard Gestão à Vista — 7 telas por setor (público) */}
      <Route path="/dashboard/gestao/vista" component={DashboardGestaoVista} />

      {/* Rota temporária — preview do componente ImpactGestaoVista para validação */}
      <Route path="/gestao-vista-preview" component={GestaoVistaPreview} />
      
      <Route path="/sorteio">
        {() => (
          <ProtectedRoute allowedRoles={['doador', 'user']} routeName="/sorteio">
            <Sorteio />
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/noticias" component={Noticias} />
      
      {/* Redirecionamento temporário de /pedidos para /noticias */}
      <Route path="/pedidos">
        {() => <RedirectComponent to="/noticias" />}
      </Route>
      <Route path="/perfil">
        {() => (
          <ProtectedRoute allowedRoles={['doador', 'user', 'professor', 'aluno', 'conselho', 'super_admin', 'leo', 'desenvolvedor']} routeName="/perfil">
            <Perfil />
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/meus-dados">
        {() => (
          <ProtectedRoute allowedRoles={['doador', 'user', 'conselho', 'conselheiro', 'aluno', 'aluno_portal', 'patrocinador', 'super_admin', 'leo', 'desenvolvedor', 'dev', 'dev-marketing', 'marketing', 'professor', 'professor_pec', 'professor_inclusao', 'professor_psico', 'professor_lider', 'lider', 'monitor', 'monitor_pec', 'monitor_inclusao', 'monitor_psico', 'coordenador_inclusao', 'coordenador_pec', 'coordenador_psico', 'coordenador_negocios', 'coordenador_almoxarifado', 'tecnica_psico']} routeName="/meus-dados">
            <MeusDados />
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/link-indicacao">
        {() => (
          <ProtectedRoute allowedRoles={['doador', 'user']} routeName="/link-indicacao">
            <LinkIndicacao />
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/link-afiliado-cadastro">
        {() => (
          <ProtectedRoute allowedRoles={['doador', 'user']} routeName="/link-afiliado-cadastro">
            <LinkAfiliadoCadastro />
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/dados-cadastrais">
        {() => (
          <ProtectedRoute allowedRoles={['doador', 'user', 'patrocinador']} routeName="/dados-cadastrais">
            <DadosCadastrais />
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/pagamentos">
        {() => (
          <ProtectedRoute allowedRoles={['doador', 'user']} routeName="/pagamentos">
            <Pagamentos />
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/configuracoes">
        {() => (
          <ProtectedRoute allowedRoles={['doador', 'user', 'patrocinador', 'conselheiro', 'conselho']} routeName="/configuracoes">
            <Configuracoes />
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/sobre">
        {() => (
          <ProtectedRoute allowedRoles={['doador', 'user', 'patrocinador']} routeName="/sobre">
            <Sobre />
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/conselho">
        {() => (
          <ProtectedRoute allowedRoles={['conselho', 'conselheiro']} routeName="/conselho">
            {/* AreaConsentGate (council) já cobre termos + privacidade + confidencialidade */}
            <Conselho />
          </ProtectedRoute>
        )}
      </Route>

      <Route path="/aguardando-aprovacao" component={AguardandoAprovacao} />
      
      <Route path="/aluno">
        {() => (
          <ProtectedRoute allowedRoles={['aluno', 'aluno_portal']} routeName="/aluno">
            <AlunoTermosGuard>
              <Aluno />
            </AlunoTermosGuard>
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/eventos" component={EventosHome} />
      <Route path="/eventos/cadastro" component={EventosCadastro} />
      <Route path="/eventos/perfil" component={EventosPerfil} />
      <Route path="/eventos/admin" component={EventosAdmin} />
      <Route path="/eventos/:id/checkout" component={EventoCheckout} />
      <Route path="/eventos/:id" component={EventoDetalhe} />
      
      <Route path="/patrocinador">
        {() => (
          <ProtectedRoute allowedRoles={['patrocinador', 'developer']} routeName="/patrocinador">
            <TermosGuard><PatrocinadorDashboard /></TermosGuard>
          </ProtectedRoute>
        )}
      </Route>

      <Route path="/perfil-patrocinador">
        {() => (
          <ProtectedRoute allowedRoles={['patrocinador', 'developer']} routeName="/perfil-patrocinador">
            <TermosGuard><PerfilPatrocinador /></TermosGuard>
          </ProtectedRoute>
        )}
      </Route>

      {/* Redirect old URL to new one */}
      <Route path="/patrocinador-dashboard">
        {() => <RedirectComponent to="/patrocinador" />}
      </Route>
      
      <Route path="/central-ajuda">
        {() => (
          <ProtectedRoute allowedRoles={['doador', 'user', 'professor', 'lider', 'aluno', 'conselho', 'super_admin', 'leo', 'admin', 'patrocinador']} routeName="/central-ajuda">
            <CentralAjuda />
          </ProtectedRoute>
        )}
      </Route>
      
      <Route path="/impacto">
        {() => (
          <ProtectedRoute allowedRoles={['doador', 'user', 'leo']} routeName="/impacto">
            <Impacto />
          </ProtectedRoute>
        )}
      </Route>
      
      <Route path="/sorteio-admin">
        {() => (
          <ProtectedRoute allowedRoles={['super_admin', 'leo', 'admin']} routeName="/sorteio-admin">
            <SorteioAdmin />
          </ProtectedRoute>
        )}
      </Route>

      <Route path="/admin/rede/credenciais">
        {() => (
          <ProtectedRoute allowedRoles={['leo', 'desenvolvedor', 'super_admin', 'admin']} routeName="/admin/rede/credenciais">
            <AdminRedeCredenciais />
          </ProtectedRoute>
        )}
      </Route>

      <Route path="/admin/cielo/credenciais">
        {() => (
          <ProtectedRoute allowedRoles={['leo', 'desenvolvedor', 'super_admin', 'admin']} routeName="/admin/cielo/credenciais">
            <AdminCieloCredenciais />
          </ProtectedRoute>
        )}
      </Route>

      <Route path="/admin/conciliar-pix">
        {() => (
          <ProtectedRoute allowedRoles={['leo', 'desenvolvedor', 'super_admin', 'admin']} routeName="/admin/conciliar-pix">
            <AdminConciliarPix />
          </ProtectedRoute>
        )}
      </Route>

      <Route path="/admin/pagbank-oauth">
        {() => (
          <ProtectedRoute allowedRoles={['leo', 'desenvolvedor', 'super_admin', 'admin']} routeName="/admin/pagbank-oauth">
            <AdminPagBankOAuth />
          </ProtectedRoute>
        )}
      </Route>

      <Route path="/admin/manual-subscription">
        {() => (
          <ProtectedRoute allowedRoles={['leo', 'desenvolvedor', 'super_admin', 'admin']} routeName="/admin/manual-subscription">
            <AdminManualSubscription />
          </ProtectedRoute>
        )}
      </Route>

      <Route path="/admin/migrate-donors">
        {() => (
          <ProtectedRoute allowedRoles={['leo', 'desenvolvedor', 'super_admin', 'admin']} routeName="/admin/migrate-donors">
            <AdminMigrateDonors />
          </ProtectedRoute>
        )}
      </Route>

      <Route path="/admin/relatorio-assinaturas">
        {() => (
          <ProtectedRoute allowedRoles={['leo', 'desenvolvedor', 'super_admin', 'admin']} routeName="/admin/relatorio-assinaturas">
            <AdminRelatorioAssinaturas />
          </ProtectedRoute>
        )}
      </Route>

      <Route path="/admin/solicitacoes-exclusao">
        {() => (
          <ProtectedRoute allowedRoles={['leo', 'desenvolvedor', 'super_admin', 'admin']} routeName="/admin/solicitacoes-exclusao">
            <AdminSolicitacoesExclusao />
          </ProtectedRoute>
        )}
      </Route>

      <Route path="/admin/ropa">
        {() => (
          <ProtectedRoute allowedRoles={['super_admin', 'leo']} routeName="/admin/ropa">
            <AdminRopa />
          </ProtectedRoute>
        )}
      </Route>

      <Route path="/admin/privacy-consents">
        {() => (
          <ProtectedRoute allowedRoles={['super_admin', 'leo', 'admin', 'dev', 'desenvolvedor']} routeName="/admin/privacy-consents">
            <AdminPrivacyConsents />
          </ProtectedRoute>
        )}
      </Route>

      {/* Scanner Interface - Protected */}
      <Route path="/scanner" component={ScannerPage} />

      {/* Tablet Chamada — porta das salas */}
      <Route path="/tablet/chamada">
        {() => (
          <TabletChamadaProtectedRoute>
            <TabletChamadaPage />
          </TabletChamadaProtectedRoute>
        )}
      </Route>

      <Route path="/pagamento/aprovado" component={PagamentoAprovado} />
      <Route path="/pagamento/reprovado" component={PagamentoReprovado} />

      <Route path="/dev">
        {() => (
          <ProtectedRoute allowedRoles={['desenvolvedor', 'dev', 'admin', 'super_admin', 'leo']} routeName="/dev">
            <TermosGuard><DevPage /></TermosGuard>
          </ProtectedRoute>
        )}
      </Route>
      {/* Limpar cache do PWA */}
      <Route path="/limpar-cache">
        {() => {
          useEffect(() => {
            (async () => {
              if ('serviceWorker' in navigator) {
                const regs = await navigator.serviceWorker.getRegistrations();
                for (const r of regs) await r.unregister();
              }
              if ('caches' in window) {
                const keys = await caches.keys();
                await Promise.all(keys.map((k: string) => caches.delete(k)));
              }
              setTimeout(() => { window.location.href = '/'; }, 800);
            })();
          }, []);
          return (
            <div style={{ fontFamily: 'sans-serif', textAlign: 'center', padding: '80px 20px' }}>
              <h2>🧹 Limpando cache...</h2>
              <p style={{ color: '#555' }}>Aguarde, você será redirecionado.</p>
            </div>
          );
        }}
      </Route>

      {/* Fallback para SPAs - todas as rotas não encontradas vão para / */}
      <Route>
        {() => <SplashGate />}
      </Route>
          </Switch>
        </PageTransition>
      </AnimatePresence>
    </div>
  );
}

// Remoção da lógica automática de criação/correção de sessão para Leo
// Todos os usuários devem passar pelo fluxo normal de autenticação


// Componente que verifica assinatura em background
function SubscriptionVerifier() {
  useSubscriptionVerify();
  return null;
}

// Ativa push notifications globalmente e exibe banner de permissão
function PushNotificationsBootstrap() {
  const [location] = useLocation();
  const { userKey, permission, requestPermission, loading, refreshStatus, pushEnabled, pushOptedOut } =
    usePushNotificationsContext();
  const [bannerVisible, setBannerVisible] = useState(false);
  const bannerPromptedRef = useRef(false);

  const isAuthRoute =
    location === '/' ||
    location.includes('login') ||
    location.startsWith('/entrar') ||
    location.startsWith('/verify') ||
    location.startsWith('/verificar') ||
    location.startsWith('/codigo') ||
    location.startsWith('/splash') ||
    location.startsWith('/plans') ||
    location.startsWith('/register') ||
    location.startsWith('/donation-flow') ||
    location.startsWith('/stripe-payment') ||
    location.startsWith('/menor') ||
    location.startsWith('/aguardando-aprovacao') ||
    location.startsWith('/assinatura-pausada') ||
    location.startsWith('/reativar-assinatura') ||
    location.startsWith('/termos') ||
    location.startsWith('/politica') ||
    location === '/scanner-login' ||
    location === '/tablet/chamada/login' ||
    location === '/dashboard/gestao/vista' ||
    location === '/gestao-vista-preview';

  useEffect(() => {
    bannerPromptedRef.current = false;
    setBannerVisible(false);
  }, [userKey]);

  useEffect(() => {
    if (pushEnabled) {
      setBannerVisible(false);
      bannerPromptedRef.current = true;
    }
  }, [pushEnabled]);

  useEffect(() => {
    if (pushOptedOut) {
      setBannerVisible(false);
      bannerPromptedRef.current = true;
    }
  }, [pushOptedOut]);

  useEffect(() => {
    if (!userKey) return;
    if (isAuthRoute) {
      setBannerVisible(false);
      return;
    }
    if (typeof Notification === 'undefined') return;
    if (permission === 'denied' || permission === 'unsupported') return;
    if (pushOptedOut || localStorage.getItem(`push_opt_out_${userKey}`) === '1') return;
    if (bannerPromptedRef.current) return;
    if (localStorage.getItem(`push_dismissed_${userKey}`)) return;
    const snoozedUntil = localStorage.getItem(`push_snoozed_${userKey}`);
    if (snoozedUntil && Date.now() < Number(snoozedUntil)) return;

    let cancelled = false;
    const t = setTimeout(async () => {
      const status = await refreshStatus();
      if (cancelled) return;
      if (bannerPromptedRef.current) return;
      if (localStorage.getItem(`push_opt_out_${userKey}`) === '1') return;
      if ((status?.activeDevices ?? 0) > 0) return;
      if (localStorage.getItem(`push_dismissed_${userKey}`)) return;
      const snooze = localStorage.getItem(`push_snoozed_${userKey}`);
      if (snooze && Date.now() < Number(snooze)) return;
      bannerPromptedRef.current = true;
      setBannerVisible(true);
    }, 3000);

    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [userKey, permission, isAuthRoute, refreshStatus, pushOptedOut]);

  const handleAtivar = async () => {
    setBannerVisible(false);
    bannerPromptedRef.current = true;
    await requestPermission();
  };

  const handleSnooze = () => {
    setBannerVisible(false);
    bannerPromptedRef.current = true;
    if (userKey) localStorage.setItem(`push_snoozed_${userKey}`, String(Date.now() + 3 * 24 * 60 * 60 * 1000));
  };

  const handleDismiss = () => {
    setBannerVisible(false);
    bannerPromptedRef.current = true;
    if (userKey) localStorage.setItem(`push_dismissed_${userKey}`, '1');
  };

  if (!bannerVisible || isAuthRoute) return null;

  return (
    <div className="fixed z-[9999] top-4 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-sm sm:top-auto sm:bottom-6 sm:right-6 sm:left-auto sm:translate-x-0 sm:w-80">
      <div className="bg-white border border-gray-200 rounded-2xl shadow-xl p-4 flex items-start gap-3">
        <span className="text-2xl mt-0.5">🔔</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 leading-snug">
            Ative as notificações
          </p>
          <p className="text-xs text-gray-500 mt-0.5 leading-snug">
            {iosPushNeedsHomeScreen()
              ? 'No iPhone: Compartilhar → Adicionar à Tela de Início, depois abra o app por lá.'
              : 'Receba novidades e avisos do Clube do Grito.'}
          </p>
          <div className="flex gap-2 mt-3">
            <button
              type="button"
              onClick={handleAtivar}
              disabled={loading}
              className="flex-1 bg-black text-white text-xs font-semibold py-2 rounded-xl disabled:opacity-60"
            >
              {loading ? 'Aguarde...' : 'Ativar'}
            </button>
            <button
              type="button"
              onClick={handleSnooze}
              className="flex-1 bg-gray-100 text-gray-600 text-xs font-semibold py-2 rounded-xl"
            >
              Agora não
            </button>
          </div>
          <button
            type="button"
            onClick={handleDismiss}
            className="w-full mt-2 text-xs text-gray-400 hover:text-gray-600 text-center py-1"
          >
            Não mostrar mais
          </button>
        </div>
      </div>
    </div>
  );
}

function App() {
  
  // Configurar tratamento global de erros uma vez
  useEffect(() => {
    setupGlobalErrorHandling();
  }, []);
  
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ErrorBoundary>
          <PushNotificationsProvider>
            <ConnectionStatus />
            <SubscriptionVerifier />
            <PushNotificationsBootstrap />
            <PushNavigationListener />
            <PrivacyConsentBootstrap />
            <AutoRedirect />
            <Toaster />
            <InAppNotification />
            <Suspense fallback={null}>
              <Router />
            </Suspense>
          </PushNotificationsProvider>
        </ErrorBoundary>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
