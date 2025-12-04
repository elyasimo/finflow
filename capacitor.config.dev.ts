import type { CapacitorConfig } from '@capacitor/cli';

/**
 * Development configuration for Capacitor
 * Uses local Next.js dev server instead of production URL
 * 
 * Usage: 
 *   npm run ios:dev   - Start local dev and open in simulator
 *   npm run ios:prod  - Use production URL
 * 
 * For physical iPhone testing:
 *   1. Run: npm run dev (starts Next.js on port 3000)
 *   2. Run: npm run ios:dev:device (uses your local IP)
 *   3. Deploy to iPhone from Xcode
 */
const config: CapacitorConfig = {
  appId: 'ch.finflowapp.app',
  appName: 'FinFlow',
  webDir: 'out',
  server: {
    // For physical device, use your Mac's local IP
    // Run: ipconfig getifaddr en0
    url: 'http://192.168.22.5:3000',
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
      resize: 'none',
      style: 'dark',
      resizeOnFullScreen: false,
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
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
