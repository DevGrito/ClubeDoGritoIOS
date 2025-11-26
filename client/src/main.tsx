import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Cache & Storage Cleanup System - Previne travamentos
const APP_VERSION = '3.0.0-PLAN-FIX'; // Incrementa para forçar limpeza
const CACHE_KEY = 'clube-grito-cache-version';

// FORÇA DESREGISTRO DO SERVICE WORKER
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    registrations.forEach(registration => {
      console.log('🔥 DESREGISTRANDO Service Worker antigo...');
      registration.unregister();
    });
  });
  
  // Limpa TODOS os caches
  if ('caches' in window) {
    caches.keys().then(names => {
      console.log('🗑️ Deletando TODOS os caches:', names);
      names.forEach(name => caches.delete(name));
    });
  }
}

// Função para limpar cache corrompido
function cleanupCorruptedData() {
  try {
    const cachedVersion = localStorage.getItem(CACHE_KEY);
    
    // Se versão diferente ou não existe, limpa tudo
    if (cachedVersion !== APP_VERSION) {
      console.log('🧹 Limpando cache antigo/corrompido...');
      
      // Limpa localStorage seletivamente
      const keysToKeep = [
        'userDataKey', 
        'authToken',
        'userPapel',           // 🔐 Mantém papel do usuário
        'isVerified',          // 🔐 Mantém status de verificação
        'userId',              // 🔐 Mantém ID do usuário
        'userName',            // 🔐 Mantém nome do usuário
        'userEmail',           // 🔐 Mantém email do usuário
        'userTelefone',        // 🔐 Mantém telefone do usuário
        'dev_panel_active',    // 🔐 Mantém status do painel dev
        'dev_panel_timestamp', // 🔐 Mantém timestamp do painel dev
        'hasActiveSubscription', // 🔐 Mantém status de assinatura
        'hasDoadorRole'        // 🔐 Mantém status de doador
      ]; // Mantém dados essenciais
      const keysToRemove = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && !keysToKeep.includes(key)) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      // Limpa sessionStorage completamente
      sessionStorage.clear();
      
      // Limpa cache do service worker se disponível
      if ('caches' in window) {
        caches.keys().then(names => {
          names.forEach(name => {
            if (name.includes('old') || name.includes('cache')) {
              caches.delete(name);
            }
          });
        });
      }
      
      // Atualiza versão do cache
      localStorage.setItem(CACHE_KEY, APP_VERSION);
      console.log('✅ Cache limpo com sucesso!');
    }
  } catch (error) {
    console.warn('⚠️ Erro ao limpar cache:', error);
    // Em caso de erro crítico, limpa tudo
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (e) {
      console.error('❌ Erro crítico no cache:', e);
    }
  }
}

// Detecta loops infinitos potenciais
let errorCount = 0;
let lastErrorTime = 0;
const MAX_ERRORS_PER_MINUTE = 10;

function detectInfiniteLoop() {
  const now = Date.now();
  if (now - lastErrorTime > 60000) {
    errorCount = 0; // Reset contador a cada minuto
  }
  
  errorCount++;
  lastErrorTime = now;
  
  if (errorCount > MAX_ERRORS_PER_MINUTE) {
    console.warn('🔄 Loop detectado! Forçando reload...');
    // Limpa tudo e recarrega
    localStorage.clear();
    sessionStorage.clear();
    window.location.reload();
  }
}

// Executa limpeza no início
cleanupCorruptedData();

// Correção para erro de HMR no mobile - versão aprimorada
const originalConsoleError = console.error;
console.error = (...args) => {
  // Filtra erros específicos do HMR que não afetam o funcionamento
  const message = args.join(' ').toLowerCase();
  if (message.includes('runtime-error-plugin') || 
      message.includes('removechild') || 
      message.includes('node.js') ||
      message.includes('hmr') ||
      message.includes('plugin') ||
      message.includes('falha ao executar') ||
      message.includes('failed to execute') ||
      message.includes('overlay') ||
      message.includes('vite')) {
    return; // Ignora esses erros específicos
  }
  originalConsoleError.apply(console, args);
};

// Handler global mais robusto para erros não capturados
window.addEventListener('error', (event) => {
  const message = (event.message || '').toLowerCase();
  const source = (event.filename || '').toLowerCase();
  
  // Detecta loops e erros críticos
  detectInfiniteLoop();
  
  if (message.includes('runtime-error-plugin') ||
      message.includes('removechild') ||
      message.includes('hmr') ||
      message.includes('plugin') ||
      message.includes('falha ao executar') ||
      message.includes('failed to execute') ||
      message.includes('overlay') ||
      source.includes('vite') ||
      source.includes('plugin')) {
    event.preventDefault();
    event.stopPropagation();
    return false;
  }
  
  // Log erros críticos para debugging
  if (message.includes('maximum call stack') || 
      message.includes('out of memory') ||
      message.includes('infinite loop')) {
    console.error('🚨 Erro crítico detectado:', message);
    cleanupCorruptedData();
    setTimeout(() => window.location.reload(), 1000);
  }
});

// Handler para promises rejeitadas
window.addEventListener('unhandledrejection', (event) => {
  const message = (event.reason?.message || event.reason || '').toString().toLowerCase();
  
  if (message.includes('runtime-error-plugin') ||
      message.includes('removechild') ||
      message.includes('hmr') ||
      message.includes('plugin') ||
      message.includes('falha ao executar') ||
      message.includes('failed to execute') ||
      message.includes('overlay')) {
    event.preventDefault();
    return false;
  }
});

createRoot(document.getElementById("root")!).render(<App />);
