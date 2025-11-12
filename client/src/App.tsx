import { Switch, Route, useLocation } from "wouter";
import { useEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { isLeoMartins } from "@shared/conselho";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AnimatePresence } from "framer-motion";
import { PageTransition } from "@/components/PageTransition";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { setupGlobalErrorHandling } from "@/utils/errorHandler";
import ConnectionStatus from "@/components/ConnectionStatus";
import SplashScreen from "@/pages/splash-screen";
import SplashGate from "@/components/SplashGate";
import Plans from "@/pages/plans";
import Register from "@/pages/register";
import DonationFlow from "@/pages/donation-flow";
import StripePayment from "@/pages/stripe-payment";
import PaymentErrorDemo from "@/pages/payment-error-demo";
import TermosServicos from "@/pages/termos-servicos";
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
import AguardandoAprovacao from "@/pages/aguardando-aprovacao";
import Professor from "@/pages/professor";
import PecCoordenador from "@/pages/pec-coordenador";
import Aluno from "@/pages/aluno";
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
import Missoes from "@/pages/missoes";
import DevMarketing from "@/pages/dev-marketing";
import CreditCardDemo from "@/pages/credit-card-demo";
import MeusLances from "@/pages/meus-lances";
import DevModeBanner from "@/components/DevModeBanner";
import ProtectedRoute from "@/components/ProtectedRoute";
import AutoRedirect from "@/components/AutoRedirect";
import GritoIntro from "@/pages/grito-intro";
import GritoSelection from "@/pages/grito-selection";
import GestaoVista from "@/pages/gestao-vista";
import PagamentoIngresso from "@/pages/pagamento-ingresso";
import IngressoSucesso from "@/pages/ingresso-sucesso";
import IngressoPage from "@/pages/ingresso";
import IngressoDemoPage from "@/pages/ingresso-demo";
import IngressoResgateIdentificar from "@/pages/ingresso-resgate-identificar";
import IngressoResgateConfirmar from "@/pages/ingresso-resgate-confirmar";
import IngressoListaCotaPage from "@/pages/ingresso-lista-cota";
import IngressoAvulsoResgatar from "@/pages/ingresso-avulso-resgatar";
import PagamentoAprovado from "@/pages/pagamento-aprovado";
import PagamentoReprovado from "@/pages/pagamento-reprovado";
import ScannerPage from "@/pages/scanner";
import ScannerLogin from "@/pages/scanner-login";
import CoordenadorLogin from "@/pages/coordenador-login";
import AdminConciliarPix from "@/pages/admin-conciliar-pix";
import AdminManualSubscription from "@/pages/admin-manual-subscription";
import AdminMigrateDonors from "@/pages/admin-migrate-donors";
import AdminRelatorioAssinaturas from "@/pages/admin-relatorio-assinaturas";
import Subscriptions from "@/pages/Subscriptions";
import IngressosEsgotados from "@/pages/ingressos-esgotados";

// RBAC Pages
import ProfessorPage from "@/pages/rbac/professor";
import MonitorPage from "@/pages/rbac/monitor";
import CoordenadorInclusaoPage from "@/pages/rbac/coordenador-inclusao";
import CoordenadorPECPage from "@/pages/rbac/coordenador-pec";
import CoordenadorPsicoPage from "@/pages/rbac/coordenador-psico";

import NotFound from "@/pages/not-found";

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
      <Route path="/" component={SplashGate} />
      <Route path="/splash" component={SplashScreen} />
      <Route path="/plans" component={Plans} />
      <Route path="/register" component={Register} />
      <Route path="/donation-flow" component={DonationFlow} />
      <Route path="/stripe-payment" component={StripePayment} />
      <Route path="/payment-error" component={PaymentErrorDemo} />
      <Route path="/termos-servicos" component={TermosServicos} />
      <Route path="/entrar" component={Entrar} />
      <Route path="/verify" component={Verify} />
      {/* Removed verify-donation route to maintain stability */}
      
      {/* Novas rotas com proteção */}
      <Route path="/tdoador">
        {() => (
          <ProtectedRoute allowedRoles={['doador', 'user', 'leo']} routeName="/tdoador">
            <Welcome />
          </ProtectedRoute>
        )}
      </Route>
      
      {/* ================ RBAC ISOLATED ROUTES ================ */}
      <Route path="/professor">
        {() => (
          <ProtectedRoute allowedRoles={['professor']} routeName="/professor">
            <ProfessorPage />
          </ProtectedRoute>
        )}
      </Route>
      
      <Route path="/monitor">
        {() => (
          <ProtectedRoute allowedRoles={['monitor']} routeName="/monitor">
            <MonitorPage />
          </ProtectedRoute>
        )}
      </Route>
      
      <Route path="/coordenador/inclusao-produtiva">
        {() => (
          <ProtectedRoute allowedRoles={['coordenador_inclusao']} routeName="/coordenador/inclusao-produtiva">
            <CoordenadorInclusaoPage />
          </ProtectedRoute>
        )}
      </Route>
      
      <Route path="/coordenador/esporte-cultura">
        {() => (
          <ProtectedRoute allowedRoles={['coordenador_pec']} routeName="/coordenador/esporte-cultura">
            <CoordenadorPECPage />
          </ProtectedRoute>
        )}
      </Route>
      
      <Route path="/coordenador/psicossocial">
        {() => (
          <ProtectedRoute allowedRoles={['coordenador_psico']} routeName="/coordenador/psicossocial">
            <CoordenadorPsicoPage />
          </ProtectedRoute>
        )}
      </Route>
      
      <Route path="/coordenador">
        {() => (
          <ProtectedRoute allowedRoles={['coordenador_inclusao', 'coordenador_pec', 'coordenador_psico']} routeName="/coordenador">
            <AutoRedirect />
          </ProtectedRoute>
        )}
      </Route>
      {/* ================ END RBAC ROUTES ================ */}
      
      <Route path="/educacao">
        {() => (
          <ProtectedRoute allowedRoles={['professor', 'lider', 'professor_lider']} routeName="/educacao">
            <Professor />
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/pec-coordenador">
        {() => (
          <ProtectedRoute allowedRoles={['coordenador_pec']} routeName="/pec-coordenador">
            <PecCoordenador />
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/pec">
        {() => (
          <ProtectedRoute allowedRoles={['coordenador_pec']} routeName="/pec">
            <PecCoordenador />
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/pec/projetos/:projectId">
        {() => (
          <ProtectedRoute allowedRoles={['coordenador_pec']} routeName="/pec/projetos/:projectId">
            <PecCoordenador />
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/pec/atividades/:activityId">
        {() => (
          <ProtectedRoute allowedRoles={['coordenador_pec']} routeName="/pec/atividades/:activityId">
            <PecCoordenador />
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/pec/turmas/:instanceId">
        {() => (
          <ProtectedRoute allowedRoles={['coordenador_pec']} routeName="/pec/turmas/:instanceId">
            <PecCoordenador />
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/administrador">
        {() => (
          <ProtectedRoute allowedRoles={['super_admin', 'leo']} routeName="/administrador">
            <LeoMartins demoMode={false} />
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

      <Route path="/missoes-semanais">
        {() => (
          <ProtectedRoute allowedRoles={['doador', 'user', 'leo']} routeName="/missoes-semanais">
            <MissoesSemanais />
          </ProtectedRoute>
        )}
      </Route>

      <Route path="/missoes">
        {() => (
          <ProtectedRoute allowedRoles={['doador', 'user']} routeName="/missoes">
            <Missoes />
          </ProtectedRoute>
        )}
      </Route>

      <Route path="/dev-marketing">
        {() => (
          <ProtectedRoute allowedRoles={['super_admin', 'leo', 'dev']} routeName="/dev-marketing">
            <DevMarketing />
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
          <ProtectedRoute allowedRoles={['doador', 'user', 'patrocinador']} routeName="/configuracoes">
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
            <Conselho />
          </ProtectedRoute>
        )}
      </Route>

      <Route path="/aguardando-aprovacao" component={AguardandoAprovacao} />
      
      <Route path="/aluno">
        {() => (
          <ProtectedRoute allowedRoles={['aluno']} routeName="/aluno">
            <Aluno />
          </ProtectedRoute>
        )}
      </Route>
      
      <Route path="/patrocinador">
        {() => (
          <ProtectedRoute allowedRoles={['patrocinador', 'developer']} routeName="/patrocinador">
            <PatrocinadorDashboard />
          </ProtectedRoute>
        )}
      </Route>

      <Route path="/perfil-patrocinador">
        {() => (
          <ProtectedRoute allowedRoles={['patrocinador', 'developer']} routeName="/perfil-patrocinador">
            <PerfilPatrocinador />
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

      {/* Scanner Login - Rota pública */}
      <Route path="/scanner-login" component={ScannerLogin} />
      
      <Route path="/scanner" component={ScannerPage} />

      {/* Coordenador Login - Rota pública */}
      <Route path="/login/coordenador" component={CoordenadorLogin} />

      <Route path="/pagamento/ingresso" component={IngressosEsgotados} />
      <Route path="/pagamento-ingresso" component={IngressosEsgotados} />
      <Route path="/ingressos-esgotados" component={IngressosEsgotados} />
      <Route path="/ingressos/compras/extras" component={PagamentoIngresso} />
      <Route path="/ingresso/sucesso" component={IngressoSucesso} />
      <Route path="/ingresso" component={IngressoPage} />
      <Route path="/ingresso-demo" component={IngressoDemoPage} />
      <Route path="/ingresso/avulso/resgatar" component={IngressoAvulsoResgatar} />
      <Route path="/ingresso/resgate/identificar" component={IngressoResgateIdentificar} />
      <Route path="/ingresso/resgate/confirmar" component={IngressoResgateConfirmar} />
      <Route path="/ingresso/lista-cota/:idCota" component={IngressoListaCotaPage} />
      <Route path="/ingresso/visualizar/:id" component={IngressoPage} />
      <Route path="/pagamento/aprovado" component={PagamentoAprovado} />
      <Route path="/pagamento/reprovado" component={PagamentoReprovado} />
      
      <Route path="/dev">
        {() => (
          <ProtectedRoute allowedRoles={['desenvolvedor', 'dev']} routeName="/dev">
            <DevPage />
          </ProtectedRoute>
        )}
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

function App() {
  
  // Configurar tratamento global de erros uma vez
  useEffect(() => {
    setupGlobalErrorHandling();
  }, []);
  
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ErrorBoundary>
          <ConnectionStatus />
          <AutoRedirect />
          <Toaster />
          <Router />
        </ErrorBoundary>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
