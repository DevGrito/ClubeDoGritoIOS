import { useEffect } from "react";
import { useLocation } from "wouter";
import logoImage from "../app-assets/CLUBEDOGRITO_APPpng_Prancheta 1_1755627303160.png";

export default function SplashScreen() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    console.log('🔍 SPLASH - Iniciando tela splash...');
    
    // Timer para mostrar o splash screen por 2.5 segundos
    const timer = setTimeout(() => {
      console.log('🔄 SPLASH - Finalizando splash screen...');
      
      try {
        // DEBUG: Mostrar TUDO que tem no localStorage
        console.log('🔍 [DEBUG] localStorage completo:', Object.fromEntries(Object.entries(localStorage)));
        console.log('🔍 [DEBUG] sessionStorage completo:', Object.fromEntries(Object.entries(sessionStorage)));
        
        // Verificar se usuário está logado
        const isVerified = localStorage.getItem('isVerified') === 'true';
        const userPapel = localStorage.getItem('userPapel');
        const userId = localStorage.getItem('userId');
        
        console.log('🔍 [DEBUG] Dados de sessão:');
        console.log('  - isVerified:', isVerified);
        console.log('  - userPapel:', userPapel);
        console.log('  - userId:', userId);
        
        // ⚡ LIMPEZA AGRESSIVA: Para usuários novos (sem QR code access), sempre limpar
        // Detecção: se não há query params de acesso específico, é usuário novo
        const urlParams = new URLSearchParams(window.location.search);
        const hasSpecificAccess = urlParams.get('dev_access') || urlParams.get('origen') || urlParams.get('user_id');
        
        console.log('🔍 [DEBUG] URL Params:', Object.fromEntries(urlParams.entries()));
        console.log('🔍 [DEBUG] hasSpecificAccess:', hasSpecificAccess);
        
        // Se não tem dados válidos de sessão, limpar localStorage completamente
        if (!isVerified || !userPapel || !userId || !hasSpecificAccess) {
          console.log('🧹 SPLASH - Limpando localStorage de dados antigos/inválidos');
          
          // Limpar apenas dados relacionados à sessão, preservar outras configurações
          const sessionKeys = [
            'userId', 'userName', 'userPapel', 'userEmail', 'userPhone', 'userTelefone',
            'isVerified', 'hasActiveSubscription', 'hasDoadorRole', 'firstTimeAccess',
            'primeiraEntradaCompleta', 'termsAccepted', 'selectedPlan', 'selectedPeriodicity',
            'paymentIntentId', 'donationUserId', 'tempUserPhone', 'phoneVerified',
            'dev_session', 'dev_access', 'dev_returning', 'justCompletedDonation'
          ];
          
          sessionKeys.forEach(key => {
            if (localStorage.getItem(key)) {
              console.log(`  - Removendo: ${key} = ${localStorage.getItem(key)}`);
              localStorage.removeItem(key);
            }
          });
          
          console.log('✅ SPLASH - localStorage limpo, redirecionando para /plans');
          setLocation('/plans');
          return;
        }
        
        // Se tem dados válidos de sessão E acesso específico, verificar se são válidos
        
        if (isVerified && userPapel) {
          // Usuário já logado - redirecionar para dashboard baseado no papel
          console.log(`✅ SPLASH - Redirecionando usuário ${userPapel} para dashboard`);
          
          // Redirecionar baseado no papel do usuário
          switch (userPapel) {
            case 'leo':
            case 'super_admin':
              setLocation('/leo-martins');
              break;
            case 'desenvolvedor':
              setLocation('/dev');
              break;
            case 'professor':
            case 'monitor':
            case 'coordenador_inclusao':
            case 'coordenador_pec':
            case 'coordenador_psico':
            case 'admin':
              // Para usuários RBAC, redirecionar para suas respectivas páginas
              if (userPapel === 'professor') {
                setLocation('/rbac/professor');
              } else if (userPapel === 'monitor') {
                setLocation('/rbac/monitor');
              } else if (userPapel === 'coordenador_inclusao') {
                setLocation('/rbac/coordenador-inclusao');
              } else if (userPapel === 'coordenador_pec') {
                setLocation('/rbac/coordenador-pec');
              } else if (userPapel === 'coordenador_psico') {
                setLocation('/rbac/coordenador-psico');
              } else {
                setLocation('/tdoador');
              }
              break;
            case 'conselho':
            case 'conselheiro':
              setLocation('/conselho');
              break;
            case 'aluno':
              setLocation('/aluno');
              break;
            case 'patrocinador':
              setLocation('/patrocinador-dashboard');
              break;
            default:
              // Doadores e usuários padrão
              setLocation('/tdoador');
          }
        } else {
          // Usuário não logado - redirecionar para escolha de planos (fluxo correto)
          console.log('🎯 SPLASH - Redirecionando usuário novo para /plans');
          setLocation('/plans');
        }
      } catch (error) {
        console.error('❌ SPLASH - Erro no redirecionamento:', error);
        // Em caso de erro, ir para escolha de planos para usuários novos
        setLocation('/plans');
      }
    }, 2500); // 2.5 segundos para mostrar o logo

    return () => clearTimeout(timer);
  }, [setLocation]);

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