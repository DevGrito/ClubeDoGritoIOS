import { useEffect, useState } from "react";
import { AlertTriangle, X } from "lucide-react";

export function SessionExpiredAlert() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem('session_expired') === 'true') {
      setShow(true);
      sessionStorage.removeItem('session_expired');
    }
  }, []);

  if (!show) return null;

  return (
    <div className="w-full max-w-sm mb-4 bg-amber-50 border border-amber-300 rounded-lg p-3 flex items-start gap-3">
      <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
      <div className="flex-1 text-sm text-amber-800">
        <p className="font-semibold">Sessão encerrada</p>
        <p>O servidor foi reiniciado e sua sessão expirou. Faça login novamente para continuar.</p>
      </div>
      <button onClick={() => setShow(false)} className="text-amber-500 hover:text-amber-700 shrink-0">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
