// capacitor.config.ts
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.institutoogrito.clubedogrito',
  appName: 'Clube do Grito',
  webDir: 'dist/public', // use o caminho que seu build gerou (pelo seu log: dist/public)
  bundledWebRuntime: false,
  server: { cleartext: false }
};

export default config;
