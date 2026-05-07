import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.e7b0be05d75940a79ff5711ab7db6f2b',
  appName: 'طلاب',
  webDir: 'dist',
  server: {
    url: 'https://e7b0be05-d759-40a7-9ff5-711ab7db6f2b.lovableproject.com?forceHideBadge=true',
    cleartext: true,
  },
  android: {
    backgroundColor: '#0a0a0f',
  },
  ios: {
    backgroundColor: '#0a0a0f',
  },
};

export default config;
