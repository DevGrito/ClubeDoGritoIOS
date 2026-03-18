import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

console.log('🚀 [main.tsx] INICIANDO - v5.0.0');

// 🔒 FORÇA HTTPS em produção (previne Mixed Content)
if (window.location.hostname !== 'localhost' && 
    window.location.hostname !== '127.0.0.1' &&
    window.location.protocol === 'http:') {
  window.location.href = window.location.href.replace('http:', 'https:');
}

// Service Worker cleanup on startup
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    registrations.forEach(registration => {
      registration.unregister();
    });
  });
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
