import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Suprimir erros do Firebase Messaging em contextos sem suporte (iframes, Firefox, etc.)
// Deve rodar ANTES do Vite registrar seu próprio listener de unhandledrejection
window.addEventListener('unhandledrejection', (event) => {
  const msg = event.reason?.message || String(event.reason ?? '');
  if (msg.includes('messaging/unsupported-browser') || event.reason?.code === 'messaging/unsupported-browser') {
    event.preventDefault();
  }
}, true); // capture phase = antes dos listeners do Vite

console.log('🚀 [main.tsx] INICIANDO - v5.0.0');

// 🔒 FORÇA HTTPS em produção (previne Mixed Content)
if (window.location.hostname !== 'localhost' && 
    window.location.hostname !== '127.0.0.1' &&
    window.location.protocol === 'http:') {
  window.location.href = window.location.href.replace('http:', 'https:');
}

const container = document.getElementById("root");
if (container) {
  console.log('✅ [main.tsx] Container #root encontrado, renderizando App...');
  const root = createRoot(container);
  root.render(<App />);
  console.log('✅ [main.tsx] App renderizado!');
} else {
  console.error('❌ [main.tsx] Container #root NÃO ENCONTRADO!');
}
