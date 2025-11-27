import type { CapacitorConfig } from '@capacitor/cli';

/**
 * Development configuration for Capacitor
 * Uses local Next.js dev server instead of production URL
 * 
 * Usage: 
 *   npm run ios:dev   - Start local dev and open in simulator
 *   npm run ios:prod  - Use production URL
 */
const config: CapacitorConfig = {
  appId: 'ch.finflowapp',
  appName: 'FinFlow',
  webDir: 'out',
  server: {
    // For local development, use your Mac's IP
    // The iOS simulator can access localhost directly
    url: 'http://127.0.0.1:3000',
    cleartext: true, // Allow HTTP for local dev
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1000, // Faster for dev
      launchAutoHide: true,
      backgroundColor: '#0a0a0a',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#0a0a0a',
    },
    Keyboard: {
      resize: 'body',
      style: 'dark',
      resizeOnFullScreen: true,
    },
  },
  ios: {
    scheme: 'FinFlow',
    contentInset: 'automatic',
    preferredContentMode: 'mobile',
    backgroundColor: '#0a0a0a',
  },
  android: {
    backgroundColor: '#0a0a0a',
    allowMixedContent: true, // Allow HTTP for dev
    captureInput: true,
    webContentsDebuggingEnabled: true, // Enable debugging
  },
};

export default config;
