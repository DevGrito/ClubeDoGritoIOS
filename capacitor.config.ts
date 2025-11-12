// capacitor.config.ts
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.institutoogrito.clubedogrito',
  appName: 'Clube do Grito',
 webDir: 'dist/public',
  bundledWebRuntime: false,
  server: { cleartext: false }
};

export default config;
