'use client';

// Biometric Service - Only works in native Capacitor apps
// This file is safe for SSR - all Capacitor code is loaded only at runtime

export interface BiometricAuthResult {
  success: boolean;
  error?: string;
}

export interface BiometricAvailability {
  available: boolean;
  biometryType: 'face' | 'fingerprint' | 'none';
  errorMessage?: string;
}

// Safe browser check
function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

// Dynamically load a module only in browser - uses Function constructor to avoid static analysis
async function dynamicImport<T>(moduleName: string): Promise<T | null> {
  if (!isBrowser()) return null;
  
  try {
    // Use Function constructor to avoid webpack/next.js static analysis
    const importFn = new Function('specifier', 'return import(specifier)');
    return await importFn(moduleName);
  } catch {
    return null;
  }
}

class BiometricService {
  private modules: {
    Capacitor: any;
    NativeBiometric: any;
    BiometryType: any;
    Haptics: any;
    ImpactStyle: any;
  } | null = null;
  
  private initPromise: Promise<boolean> | null = null;

  /**
   * Initialize Capacitor modules lazily (only in browser/native)
   */
  private async init(): Promise<boolean> {
    if (!isBrowser()) return false;
    
    if (this.modules !== null) {
      return this.isNative();
    }

    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = this.loadModules();
    return this.initPromise;
  }

  private async loadModules(): Promise<boolean> {
    try {
      // Load Capacitor core
      const capacitorCore = await dynamicImport<any>('@capacitor/core');
      if (!capacitorCore?.Capacitor) {
        this.modules = { Capacitor: null, NativeBiometric: null, BiometryType: null, Haptics: null, ImpactStyle: null };
        return false;
      }

      const Capacitor = capacitorCore.Capacitor;
      
      // Only load native modules if actually on native platform
      if (!Capacitor.isNativePlatform()) {
        this.modules = { Capacitor, NativeBiometric: null, BiometryType: null, Haptics: null, ImpactStyle: null };
        return false;
      }

      // Load biometric and haptics modules
      const [biometric, haptics] = await Promise.all([
        dynamicImport<any>('capacitor-native-biometric'),
        dynamicImport<any>('@capacitor/haptics'),
      ]);

      this.modules = {
        Capacitor,
        NativeBiometric: biometric?.NativeBiometric || null,
        BiometryType: biometric?.BiometryType || null,
        Haptics: haptics?.Haptics || null,
        ImpactStyle: haptics?.ImpactStyle || null,
      };

      return true;
    } catch (error) {
      console.warn('[BiometricService] Failed to load modules:', error);
      this.modules = { Capacitor: null, NativeBiometric: null, BiometryType: null, Haptics: null, ImpactStyle: null };
      return false;
    }
  }

  private isNative(): boolean {
    try {
      return this.modules?.Capacitor?.isNativePlatform() || false;
    } catch {
      return false;
    }
  }

  /**
   * Check if biometric authentication is available
   */
  async isAvailable(): Promise<BiometricAvailability> {
    await this.init();

    if (!this.modules?.NativeBiometric) {
      return {
        available: false,
        biometryType: 'none',
        errorMessage: 'Not running in native app',
      };
    }

    try {
      const result = await this.modules.NativeBiometric.isAvailable();
      const BiometryType = this.modules.BiometryType;

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
    await this.init();

    if (!this.modules?.NativeBiometric) {
      return {
        success: false,
        error: 'Biometric authentication is only available in the native app',
      };
    }

    try {
      await this.hapticFeedback('medium');

      await this.modules.NativeBiometric.verifyIdentity({
        reason: reason || 'Bitte authentifizieren Sie sich',
        title: 'FinFlow Login',
        subtitle: 'Verwenden Sie Face ID oder Touch ID',
        description: 'Sichere Authentifizierung für Ihre Finanzdaten',
        useFallback: true,
        fallbackTitle: 'Passwort verwenden',
        maxAttempts: 3,
      });

      await this.hapticFeedback('success');
      return { success: true };
    } catch (error: any) {
      await this.hapticFeedback('error');
      return {
        success: false,
        error: error.message || 'Authentifizierung fehlgeschlagen',
      };
    }
  }

  /**
   * Store credentials securely
   */
  async saveCredentials(username: string, password: string): Promise<boolean> {
    await this.init();
    if (!this.modules?.NativeBiometric) return false;

    try {
      await this.modules.NativeBiometric.setCredentials({
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
   * Retrieve stored credentials
   */
  async getCredentials(): Promise<{ username: string; password: string } | null> {
    await this.init();
    if (!this.modules?.NativeBiometric) return null;

    try {
      const credentials = await this.modules.NativeBiometric.getCredentials({
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
    await this.init();
    if (!this.modules?.NativeBiometric) return false;

    try {
      await this.modules.NativeBiometric.deleteCredentials({
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
    if (!isBrowser() || !this.modules?.Haptics || !this.modules?.ImpactStyle) return;

    try {
      const { Haptics, ImpactStyle } = this.modules;
      
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
    } catch {
      // Silently fail - haptics are non-critical
    }
  }

  /**
   * Check if running in native app
   */
  isNativeApp(): boolean {
    return this.isNative();
  }
}

// Export singleton instance
export const biometricService = new BiometricService();
