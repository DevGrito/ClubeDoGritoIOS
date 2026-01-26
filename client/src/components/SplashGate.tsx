import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import logoImage from "@assets/CLUBEDOGRITO_APPpng_Prancheta 1_1755627303160.png";
import { isLeoByRole } from '@shared/conselho';

interface SplashGateProps {
  timeout?: number; // Timeout configurável em ms (padrão: 1500ms)
}

export function SplashGateComponent({ timeout = 1500 }: SplashGateProps) {
  const [, setLocation] = useLocation();
  const [isReady, setIsReady] = useState(false);
  const [isPublicRoute, setIsPublicRoute] = useState(false);

  useEffect(() => {
    console.log('🌟 [SPLASH GATE] Iniciando splash gate...');
    
    // PRIMEIRO: Verificar se é uma rota pública de login
    const currentPath = window.location.pathname;
    console.log('🔍 [SPLASH GATE] Current path:', currentPath);
    const publicRoutes = ['/login/coordenador', '/login/monitor', '/login/developer', '/login/marketing', '/scanner-login'];
    
    if (publicRoutes.includes(currentPath)) {
      console.log('🔓 [SPLASH GATE] Rota pública de login detectada - bypass ativado:', currentPath);
      setIsPublicRoute(true);
      setIsReady(true);
      return; // Não redireciona, deixa a rota original
    }
    
    // 🔐 SECURITY: Verificar se é desenvolvedor AUTENTICADO (não por URL params)
    // Parâmetros de URL como ?dev_access=true NÃO concedem mais acesso
    const userPapel = localStorage.getItem('userPapel');
    const isAuthenticatedDev = userPapel === 'desenvolvedor' || 
                               userPapel === 'dev' || 
                               userPapel === 'dev-admin' ||
                               userPapel === 'dev-marketing';
    
    if (isAuthenticatedDev) {
      console.log('🔓 [SPLASH GATE] Desenvolvedor autenticado - bypass ativado');
      setIsReady(true);
      return;
    }
    const isVerified = localStorage.getItem('isVerified') === 'true';
    const userEmail = localStorage.getItem('userEmail');
    
    console.log('🔍 [SPLASH GATE] Verificando sessão existente:', { userPapel, isVerified, userEmail });
    
    // Se usuário já está logado, vai direto para a área dele
    if (userPapel && isVerified) {
      console.log('✅ [SPLASH GATE] Usuário já logado - redirecionando para área dele');
      const targetRoute = getDefaultRouteForRole(userPapel, userEmail);
      setLocation(targetRoute, { replace: true });
      return;
    }
    
    // Se não está logado, mostra splash screen e depois vai para /plans
    console.log('👋 [SPLASH GATE] Novo usuário - mostrando splash e indo para /plans');
    
    // Verificar se as fontes carregaram (signal de pronto)
    const fontsReady = document.fonts.ready.then(() => {
      console.log('✅ [SPLASH GATE] Fontes carregadas');
      setIsReady(true);
    });

    // Timer de segurança (fallback)
    const timer = setTimeout(() => {
      console.log('⏰ [SPLASH GATE] Timeout atingido');
      setIsReady(true);
    }, timeout);

    // Aguardar o que acontecer primeiro: fontes ou timeout
    Promise.race([fontsReady, new Promise(resolve => setTimeout(resolve, timeout))]).then(() => {
      // Pequeno delay adicional para garantir que o usuário veja a splash
      setTimeout(() => {
        console.log('🎯 [SPLASH GATE] Redirecionando para /plans');
        setLocation('/plans', { replace: true });
      }, 300); // 300ms adicional para a experiência visual
    });

    return () => {
      clearTimeout(timer);
    };
  }, [setLocation, timeout]);

  // Se é uma rota pública, não renderiza nada (deixa o componente de login renderizar)
  if (isPublicRoute) {
    return null;
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden">
      {/* Fundo amarelo gradiente */}
      <div 
        className="absolute inset-0"
        style={{
          background: '#FFCA00',
        }}
      />
      
      {/* Efeito de ondas circulares no fundo */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div 
          className="absolute rounded-full opacity-20"
          style={{
            width: '300px',
            height: '300px',
            background: 'radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%)',
            animation: 'pulse 2s ease-in-out infinite',
          }}
        />
        <div 
          className="absolute rounded-full opacity-15"
          style={{
            width: '400px',
            height: '400px',
            background: 'radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 70%)',
            animation: 'pulse 2s ease-in-out infinite 0.5s',
          }}
        />
        <div 
          className="absolute rounded-full opacity-10"
          style={{
            width: '500px',
            height: '500px',
            background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
            animation: 'pulse 2s ease-in-out infinite 1s',
          }}
        />
      </div>

      {/* Logo centralizado */}
      <div className="relative z-10 flex items-center justify-center">
        <img 
          src={logoImage} 
          alt="Clube do Grito" 
          className="w-80 h-auto md:w-96 lg:w-[28rem] max-w-[90vw] max-h-[65vh] object-contain"
          style={{
            filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.1))',
            animation: 'fadeInScale 1.5s ease-out',
          }}
        />
      </div>

      {/* Estilos CSS inline para animações */}
      <style>
        {`
          @keyframes pulse {
            0%, 100% {
              transform: scale(1);
              opacity: 0.2;
            }
            50% {
              transform: scale(1.1);
              opacity: 0.3;
            }
          }

          @keyframes fadeInScale {
            0% {
              opacity: 0;
              transform: scale(0.8);
            }
            50% {
              opacity: 0.8;
              transform: scale(1.05);
            }
            100% {
              opacity: 1;
              transform: scale(1);
            }
          }
        `}
      </style>
    </div>
  );
}

// Função para obter rota padrão baseada no papel do usuário
function getDefaultRouteForRole(userPapel: string, userEmail?: string | null): string {
  // Verificação especial para Leo Martins
  if (userEmail && isLeoByRole(userPapel)) {
    return '/tdoador'; // Leo vai para área doador por padrão
  }
  
  switch (userPapel) {
    case 'super_admin':
      return '/administrador';
    case 'leo':
      return '/tdoador';
    case 'desenvolvedor':
      return '/dev';
    case 'admin':
      return '/admin-geral';
    // RBAC Roles - Rotas isoladas
    case 'professor':
    case 'professor_pec':
    case 'professor_inclusao':
    case 'professor_psico':
      return '/professor';
    case 'monitor':
    case 'monitor_pec':
    case 'monitor_inclusao':
    case 'monitor_psico':
      return '/monitor';
    case 'coordenador_inclusao':
      return '/coordenador/inclusao-produtiva';
    case 'coordenador_pec':
      return '/coordenador/esporte-cultura';
    case 'coordenador_psico':
      return '/coordenador/psicossocial';
    // Legacy roles
    case 'lider':
    case 'professor_lider':
      return '/professor';
    case 'aluno':
      return '/aluno';
    case 'conselho':
    case 'conselheiro':
      return '/conselho';
    case 'patrocinador':
      return '/patrocinador-dashboard';
    case 'responsavel':
      return '/responsavel';
    case 'colaborador':
      return '/colaborador';
    case 'doador':
    case 'user':
    default:
      return '/tdoador';
  }
}

// Wrapper para compatibility com wouter Route
export default function SplashGate() {
  return <SplashGateComponent timeout={1500} />;
}