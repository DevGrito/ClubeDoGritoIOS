import { useState, useRef } from "react";
import { isAndroid, isIOS } from "../utils/device";
import { buildPixDeepLink, buildAndroidIntent } from "../utils/pix";
import { PixBankPickerModal } from "./PixBankPickerModal";

type Props = { 
  payloadEmv: string;
  onFallback: () => void;
};

export default function PixOpenButton({ payloadEmv, onFallback }: Props) {
  const [showPicker, setShowPicker] = useState(false);
  const timerRef = useRef<number | null>(null);

  const openAndroid = () => {
    // Tenta deep link nativo - múltiplas tentativas
    const tryUris = [
      buildPixDeepLink(payloadEmv),
      buildAndroidIntent(payloadEmv),
    ];

    let tried = 0;
    const tryNext = () => {
      if (tried >= tryUris.length) {
        onFallback();
        return;
      }
      
      const uri = tryUris[tried++];
      
      // Timeout para detectar se não abriu
      timerRef.current = window.setTimeout(() => {
        // Se ainda tem foco na página, não funcionou
        if (document.hasFocus()) {
          tryNext();
        }
      }, 1200);
      
      try {
        // Tentar abrir o deep link
        window.location.href = uri;
      } catch {
        tryNext();
      }
    };

    tryNext();
  };

  const onOpen = () => {
    if (isAndroid()) {
      // Android: usar br.gov.bcb.pix:// SEM package → SO mostra chooser
      openAndroid();
    } else if (isIOS()) {
      // iOS: abrir nosso modal de escolha (UI interna)
      setShowPicker(true);
    } else {
      // Desktop → fallback direto
      onFallback();
    }
  };

  return (
    <>
      <button
        onClick={onOpen}
        className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition font-semibold"
        data-testid="button-abrir-banco"
      >
        Abrir no App do Banco
      </button>

      {showPicker && (
        <PixBankPickerModal
          payloadEmv={payloadEmv}
          onClose={() => setShowPicker(false)}
          onFallback={() => {
            setShowPicker(false);
            onFallback();
          }}
        />
      )}
    </>
  );
}