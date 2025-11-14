import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.institutoogrito.clubedogrito',
  appName: 'Clube do Grito',
  webDir: 'dist/public', // continua aqui, mas vai ser ignorado em runtime
  bundledWebRuntime: false,
  server: {
    url: 'https://clubedogrito.institutoogrito.com.br',
    cleartext: false,
  },
};

export default config;
