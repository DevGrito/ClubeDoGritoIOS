import { BANKS } from "../config/banks";

type Props = {
  payloadEmv: string;
  onClose: () => void;
  onFallback: () => void;
};

export function PixBankPickerModal({ payloadEmv, onClose, onFallback }: Props) {
  const openBank = (build: (p: string) => string) => {
    const url = build(payloadEmv);
    
    // Tenta abrir o deep link
    const t = setTimeout(() => {
      // Se nada aconteceu, oferece fallback
      onFallback();
    }, 1800);
    
    try {
      window.location.href = url;
    } finally {
      // Não dá para saber com 100% de certeza se abriu; timeout cobre o caso de falha.
      // Se abrir, o usuário sai da página; caso contrário, cai no fallback.
    }
    
    onClose();
    // Não limpamos o timeout, pois se o app abriu, o usuário terá saído.
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50">
      <div className="w-full max-w-md bg-white rounded-t-2xl p-4 animate-in slide-in-from-bottom duration-300">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Escolha seu banco</h3>
          <button 
            onClick={onClose} 
            className="text-sm text-gray-500 hover:text-gray-700"
            data-testid="button-fechar-modal"
          >
            Fechar
          </button>
        </div>
        
        <div className="space-y-2 max-h-[60vh] overflow-auto">
          {BANKS.map((bank) => (
            <button
              key={bank.id}
              className="w-full text-left px-4 py-3 rounded-xl border border-gray-200 hover:bg-gray-50 hover:border-yellow-300 transition-colors"
              onClick={() => openBank(bank.linkBuilder)}
              data-testid={`button-banco-${bank.id}`}
            >
              <span className="font-medium">{bank.name}</span>
            </button>
          ))}
        </div>
        
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-600">
            💡 <strong>Dica:</strong> Se o app não abrir automaticamente, voltaremos para mostrar o QR Code e você pode copiar o código PIX.
          </p>
        </div>
      </div>
    </div>
  );
}