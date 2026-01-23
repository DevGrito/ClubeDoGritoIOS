#!/usr/bin/env node
/**
 * Script para corrigir o registerSW.js após o build
 * Evita SecurityError no sandbox do Replit iframe
 */

import fs from 'fs';
import path from 'path';

const registerSwPath = path.join(process.cwd(), 'dist/public/registerSW.js');

const safeContent = `// Protected SW registration - avoids SecurityError in iframe sandbox
if ('serviceWorker' in navigator && window.isSecureContext) {
  window.addEventListener('load', function() {
    try {
      navigator.serviceWorker.register('/sw.js', { scope: '/' })
        .then(function(reg) { console.log('[SW] Registered:', reg.scope); })
        .catch(function(err) { console.log('[SW] Registration skipped:', err.message); });
    } catch (e) {
      console.log('[SW] Not available in this context');
    }
  });
}
`;

if (fs.existsSync(registerSwPath)) {
  fs.writeFileSync(registerSwPath, safeContent);
  console.log('✅ registerSW.js corrigido com sucesso!');
} else {
  console.log('⚠️ registerSW.js não encontrado - pulando correção');
}
