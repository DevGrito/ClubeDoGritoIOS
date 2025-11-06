import { motion } from 'framer-motion';

export default function PaymentErrorDemo() {
  return (
    <motion.div 
      className="w-full min-h-screen bg-white"
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -50 }}
      transition={{ duration: 0.6, ease: "easeInOut" }}
    >
      <div className="flex flex-col h-screen justify-between px-6 py-8">
        
        {/* Top spacing */}
        <div className="flex-1"></div>

        {/* Main content */}
        <div className="flex flex-col items-center text-center px-4">
          
          {/* Error Icon */}
          <div className="mb-8">
            <img 
              src="attached_assets/OPPS_Prancheta 1 1_1756924526569.png" 
              alt="Ops! Algo não deu certo" 
              className="w-44 h-44 mx-auto"
            />
          </div>

          {/* Error Message with better typography */}
          <div className="mb-8 px-2">
            <h1 className="text-2xl font-bold mb-3" style={{ color: '#2D3748', fontFamily: 'Inter', lineHeight: '1.3' }}>
              Ops! Algo não deu certo
            </h1>
            <p className="text-base mb-4" style={{ color: '#4A5568', fontFamily: 'Inter', lineHeight: '1.4' }}>
              Não conseguimos processar o pagamento,<br />
              mas seu <span className="font-bold text-orange-600">Grito</span> continua importante.
            </p>
            <p className="text-sm" style={{ color: '#718096', fontFamily: 'Inter', lineHeight: '1.4' }}>
              Isso pode acontecer por diversos motivos. Vamos tentar novamente?
            </p>
          </div>

        </div>

        {/* Bottom section with buttons */}
        <div className="flex flex-col space-y-4 px-4">
          
          {/* Try Again button - principal */}
          <button
            onClick={() => alert('Botão "Tentar novamente" clicado!')}
            className="w-full h-14 rounded-2xl flex items-center justify-center space-x-3 font-medium transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
            style={{
              background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
              color: '#000000',
              fontFamily: 'Inter',
              fontSize: '18px'
            }}
          >
            <span>Tentar novamente</span>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>

          {/* Secondary button - ajuda */}
          <button
            onClick={() => alert('Botão "Preciso de ajuda" clicado!')}
            className="w-full h-12 rounded-xl flex items-center justify-center space-x-2 font-medium transition-all duration-300 border-2"
            style={{
              backgroundColor: 'transparent',
              borderColor: '#D69E2E',
              color: '#D69E2E',
              fontFamily: 'Inter',
              fontSize: '16px'
            }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Preciso de ajuda</span>
          </button>

          {/* Bottom spacing */}
          <div className="h-4"></div>
        </div>

      </div>
    </motion.div>
  );
}