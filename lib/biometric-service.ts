// Capacitor imports - only import on client side
let Capacitor: any = null;
let NativeBiometric: any = null;
let BiometryType: any = null;
let Haptics: any = null;
let ImpactStyle: any = null;

// Check if we're in browser environment
const isBrowser = typeof window !== 'undefined';

// Lazy load Capacitor modules only in browser
async function loadCapacitorModules() {
  if (!isBrowser) return false;
  
  try {
    if (!Capacitor) {
      const capacitorCore = await import('@capacitor/core');
      Capacitor = capacitorCore.Capacitor;
    }
    
    if (!NativeBiometric) {
      const biometric = await import('capacitor-native-biometric');
      NativeBiometric = biometric.NativeBiometric;
      BiometryType = biometric.BiometryType;
    }
    
    if (!Haptics) {
      const haptics = await import('@capacitor/haptics');
      Haptics = haptics.Haptics;
      ImpactStyle = haptics.ImpactStyle;
    }
    
    return true;
  } catch (error) {
    console.warn('Capacitor modules not available:', error);
    return false;
  }
}

// Check if we're running in native app
function isNative(): boolean {
  if (!isBrowser || !Capacitor) return false;
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

export interface BiometricAuthResult {
  success: boolean;
  error?: string;
}

export interface BiometricAvailability {
  available: boolean;
  biometryType: 'face' | 'fingerprint' | 'none';
  errorMessage?: string;
}

class BiometricService {
  private initialized = false;

  /**
   * Initialize Capacitor modules
   */
  private async init(): Promise<boolean> {
    if (this.initialized) return isNative();
    this.initialized = await loadCapacitorModules();
    return isNative();
  }

  /**
   * Check if biometric authentication is available
   */
  async isAvailable(): Promise<BiometricAvailability> {
    const native = await this.init();
    
    if (!native || !NativeBiometric) {
      return {
        available: false,
        biometryType: 'none',
        errorMessage: 'Not running in native app',
      };
    }

    try {
      const result = await NativeBiometric.isAvailable();
      
      let biometryType: 'face' | 'fingerprint' | 'none' = 'none';
      
      if (BiometryType && (result.biometryType === BiometryType.FACE_ID || 
          result.biometryType === BiometryType.FACE_AUTHENTICATION)) {
        biometryType = 'face';
      } else if (BiometryType && (result.biometryType === BiometryType.TOUCH_ID || 
                 result.biometryType === BiometryType.FINGERPRINT)) {
        biometryType = 'fingerprint';
      }

      return {
        available: result.isAvailable,
        biometryType,
        errorMessage: result.errorCode ? `Error: ${result.errorCode}` : undefined,
      };
    } catch (error: any) {
      return {
        available: false,
        biometryType: 'none',
        errorMessage: error.message,
      };
    }
  }

  /**
   * Authenticate user with biometrics (Face ID / Touch ID)
   */
  async authenticate(reason?: string): Promise<BiometricAuthResult> {
    const native = await this.init();
    
    if (!native || !NativeBiometric) {
      return {
        success: false,
        error: 'Biometric authentication is only available in the native app',
      };
    }

    try {
      // Provide haptic feedback
      await this.hapticFeedback('medium');

      await NativeBiometric.verifyIdentity({
        reason: reason || 'Bitte authentifizieren Sie sich',
        title: 'FinFlow Login',
        subtitle: 'Verwenden Sie Face ID oder Touch ID',
        description: 'Sichere Authentifizierung für Ihre Finanzdaten',
        useFallback: true,
        fallbackTitle: 'Passwort verwenden',
        maxAttempts: 3,
      });

      // Success haptic
      await this.hapticFeedback('success');

      return { success: true };
    } catch (error: any) {
      // Error haptic
      await this.hapticFeedback('error');

      return {
        success: false,
        error: error.message || 'Authentifizierung fehlgeschlagen',
      };
    }
  }

  /**
   * Store credentials securely using biometric-protected keychain
   */
  async saveCredentials(username: string, password: string): Promise<boolean> {
    const native = await this.init();
    if (!native || !NativeBiometric) return false;

    try {
      await NativeBiometric.setCredentials({
        username,
        password,
        server: 'finflowapp.ch',
      });
      return true;
    } catch (error) {
      console.error('Failed to save credentials:', error);
      return false;
    }
  }

  /**
   * Retrieve stored credentials after biometric verification
   */
  async getCredentials(): Promise<{ username: string; password: string } | null> {
    const native = await this.init();
    if (!native || !NativeBiometric) return null;

    try {
      const credentials = await NativeBiometric.getCredentials({
        server: 'finflowapp.ch',
      });
      return {
        username: credentials.username,
        password: credentials.password,
      };
    } catch (error) {
      console.error('Failed to get credentials:', error);
      return null;
    }
  }

  /**
   * Delete stored credentials
   */
  async deleteCredentials(): Promise<boolean> {
    const native = await this.init();
    if (!native || !NativeBiometric) return false;

    try {
      await NativeBiometric.deleteCredentials({
        server: 'finflowapp.ch',
      });
      return true;
    } catch (error) {
      console.error('Failed to delete credentials:', error);
      return false;
    }
  }

  /**
   * Provide haptic feedback
   */
  async hapticFeedback(style: 'light' | 'medium' | 'heavy' | 'success' | 'error'): Promise<void> {
    const native = await this.init();
    if (!native || !Haptics || !ImpactStyle) return;

    try {
      switch (style) {
        case 'light':
          await Haptics.impact({ style: ImpactStyle.Light });
          break;
        case 'medium':
          await Haptics.impact({ style: ImpactStyle.Medium });
          break;
        case 'heavy':
          await Haptics.impact({ style: ImpactStyle.Heavy });
          break;
        case 'success':
          await Haptics.notification({ type: 'success' as any });
          break;
        case 'error':
          await Haptics.notification({ type: 'error' as any });
          break;
      }
    } catch (error) {
      // Haptics not available, silently fail
    }
  }

  /**
   * Check if running in native app
   */
  isNativeApp(): boolean {
    if (!isBrowser) return false;
    // Try to check synchronously if already loaded
    if (Capacitor) {
      try {
        return Capacitor.isNativePlatform();
      } catch {
        return false;
      }
    }
    return false;
  }
}

export const biometricService = new BiometricService();
