import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.gurukool.app',
  appName: 'Gurukool',
  webDir: 'www',
  server: {
    androidScheme: 'https',
    iosScheme: 'https',
  },
};

export default config;
