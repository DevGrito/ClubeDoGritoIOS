import { useEffect } from 'react';
import patrocinador1 from "@assets/1.png";
import patrocinador2 from "@assets/2.png";
import patrocinador3 from "@assets/3.png";
import patrocinador4 from "@assets/4.png";
import patrocinador5 from "@assets/5.png";
import patrocinador6 from "@assets/6.png";
import patrocinador7 from "@assets/7.png";
import patrocinador8 from "@assets/8.png";
import patrocinador9 from "@assets/9.png";
import patrocinador10 from "@assets/10.png";
import patrocinador11 from "@assets/11.png";
import patrocinador12 from "@assets/12.png";
import patrocinador13 from "@assets/13.png";
import patrocinador14 from "@assets/14.png";
import patrocinador15 from "@assets/15.png";

export default function IngressosEsgotados() {
  useEffect(() => {
    document.title = 'Ingressos Esgotados - IV Encontro do Grito';
  }, []);

  return (
    <div className="h-screen bg-[#FDB913] flex flex-col overflow-hidden" data-testid="page-ingressos-esgotados">
      {/* Conteúdo Principal */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 pt-4 pb-1 min-h-0">
        {/* Logo do Evento */}
        <div className="text-center mb-1">
          <h1 className="text-red-700 font-black text-[clamp(18px,3.5vw,28px)] leading-tight tracking-wide">
            IV ENCONTRO DO GRITO
          </h1>
        </div>

        {/* Texto "É AMANHÃ" */}
        <div className="text-center mb-1.5 w-full relative" data-testid="section-titulo">
          <h3 
            className="text-white font-black text-[clamp(45px,10vw,90px)] leading-[0.65] tracking-[0.05em]" 
            style={{ textShadow: '4px 4px 0px rgba(255,255,255,0.35)' }}
          >
            É AMANHÃ
          </h3>
          
          <h4 
            className="text-white font-black text-[clamp(45px,10vw,90px)] leading-[0.65] tracking-[0.05em] opacity-25 mt-[-3.5vw]"
            style={{ WebkitTextStroke: '2px white', WebkitTextFillColor: 'transparent' }}
          >
            É AMANHÃ
          </h4>
        </div>

        {/* Carimbo SOLD OUT */}
        <div className="relative mb-6 z-10" data-testid="carimbo-sold-out">
          <div className="relative transform -rotate-[8deg]">
            <div className="border-[5px] border-red-700 bg-gradient-to-br from-red-700/25 to-yellow-600/20 px-3 py-2 rounded-lg shadow-[0_5px_20px_rgba(0,0,0,0.25)]">
              <div className="text-center">
                <div className="text-red-700 font-black text-[clamp(7px,1.4vw,10px)] tracking-[0.3em]">
                  ★★★★★★★★★★★★★★★★★★★★★★
                </div>
                <div className="text-red-700 font-black text-[clamp(24px,5vw,40px)] tracking-[0.08em] leading-none">
                  INGRESSOS
                </div>
                <div className="text-red-700 font-black text-[clamp(24px,5vw,40px)] tracking-[0.08em] leading-none">
                  ESGOTADOS
                </div>
                <div className="text-red-700 font-black text-[clamp(7px,1.4vw,10px)] tracking-[0.3em]">
                  ★★★★★★★★★★★★★★★★★★★★★★
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mensagem de Agradecimento */}
        <div className="text-center mb-3 max-w-2xl px-4" data-testid="mensagem-agradecimento">
          <h5 className="text-red-700 font-black text-[clamp(11px,2.2vw,17px)] leading-tight uppercase">
            AGRADECEMOS ÀS MAIS DE 400 PESSOAS QUE<br />
            FARÃO PARTE DESSA NOITE INCRÍVEL!
          </h5>
        </div>

        {/* Data e Local */}
        <div className="bg-[#FDB913] border-t-[3px] border-b-[3px] border-black py-1.5 w-full mb-1" data-testid="info-evento">
          <div className="text-center">
            <h6 className="text-black font-black text-[clamp(20px,4vw,32px)] leading-none">
              23 DE OUTUBRO
            </h6>
            <p className="text-red-700 font-black text-[clamp(16px,3.2vw,26px)] leading-none">
              19H30 - FAR EAST
            </p>
          </div>
        </div>
      </div>

      {/* Footer Estático - TODOS os Patrocinadores Organizados */}
      <div className="bg-white border-t-2 border-gray-300 py-2 flex-shrink-0" data-testid="section-patrocinadores">
        <div className="px-2">
          <h3 className="text-center text-black font-bold text-[10px] mb-1.5 uppercase tracking-widest">
            PATROCINADORES
          </h3>
          
          {/* Grid de patrocinadores - 3 linhas de 5 logos */}
          <div className="max-w-4xl mx-auto space-y-1">
            {/* Linha 1 */}
            <div className="grid grid-cols-5 gap-2">
              <div className="flex items-center justify-center">
                <img src={patrocinador1} alt="Oficial" className="w-full h-auto object-contain max-h-[45px]" />
              </div>
              <div className="flex items-center justify-center">
                <img src={patrocinador2} alt="Diamante 1" className="w-full h-auto object-contain max-h-[45px]" />
              </div>
              <div className="flex items-center justify-center">
                <img src={patrocinador3} alt="Diamante 2" className="w-full h-auto object-contain max-h-[45px]" />
              </div>
              <div className="flex items-center justify-center">
                <img src={patrocinador4} alt="Diamante 3" className="w-full h-auto object-contain max-h-[45px]" />
              </div>
              <div className="flex items-center justify-center">
                <img src={patrocinador5} alt="Diamante 4" className="w-full h-auto object-contain max-h-[45px]" />
              </div>
            </div>
            
            {/* Linha 2 */}
            <div className="grid grid-cols-5 gap-2">
              <div className="flex items-center justify-center">
                <img src={patrocinador6} alt="Master 1" className="w-full h-auto object-contain max-h-[45px]" />
              </div>
              <div className="flex items-center justify-center">
                <img src={patrocinador7} alt="Master 2" className="w-full h-auto object-contain max-h-[45px]" />
              </div>
              <div className="flex items-center justify-center">
                <img src={patrocinador8} alt="Master 3" className="w-full h-auto object-contain max-h-[45px]" />
              </div>
              <div className="flex items-center justify-center">
                <img src={patrocinador9} alt="Gold 1" className="w-full h-auto object-contain max-h-[45px]" />
              </div>
              <div className="flex items-center justify-center">
                <img src={patrocinador10} alt="Gold 2" className="w-full h-auto object-contain max-h-[45px]" />
              </div>
            </div>
            
            {/* Linha 3 */}
            <div className="grid grid-cols-5 gap-2">
              <div className="flex items-center justify-center">
                <img src={patrocinador11} alt="Gold 3" className="w-full h-auto object-contain max-h-[45px]" />
              </div>
              <div className="flex items-center justify-center">
                <img src={patrocinador12} alt="Silver 1" className="w-full h-auto object-contain max-h-[45px]" />
              </div>
              <div className="flex items-center justify-center">
                <img src={patrocinador13} alt="Silver 2" className="w-full h-auto object-contain max-h-[45px]" />
              </div>
              <div className="flex items-center justify-center">
                <img src={patrocinador14} alt="Bronze 1" className="w-full h-auto object-contain max-h-[45px]" />
              </div>
              <div className="flex items-center justify-center">
                <img src={patrocinador15} alt="Bronze 2" className="w-full h-auto object-contain max-h-[45px]" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
