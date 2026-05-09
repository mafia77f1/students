import type { CapacitorConfig } from '@capacitor/cli';

// NOTE: For production native APK/IPA we DO NOT set `server.url`.
// Setting it makes the app load a remote website (which is what was
// causing the "redirect to website" issue). Removing it makes Capacitor
// load the bundled `dist/` web assets natively. For live-reload during
// development, uncomment the `server` block locally only.
const config: CapacitorConfig = {
  appId: 'app.lovable.e7b0be05d75940a79ff5711ab7db6f2b',
  appName: 'طلاب',
  webDir: 'dist',
  android: {
    backgroundColor: '#0a0a0f',
    allowMixedContent: true,
  },
  ios: {
    backgroundColor: '#0a0a0f',
    contentInset: 'always',
  },
  // server: {
  //   url: 'https://e7b0be05-d759-40a7-9ff5-711ab7db6f2b.lovableproject.com?forceHideBadge=true',
  //   cleartext: true,
  // },
  plugins: {
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true,
    },
  },
};

export default config;
