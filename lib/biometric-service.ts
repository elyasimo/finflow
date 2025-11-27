'use client';

// Biometric Service - Only works in native Capacitor apps
// All Capacitor imports are done dynamically to prevent SSR issues

export interface BiometricAuthResult {
  success: boolean;
  error?: string;
}

export interface BiometricAvailability {
  available: boolean;
  biometryType: 'face' | 'fingerprint' | 'none';
  errorMessage?: string;
}

// Check if we're in browser environment
const isBrowser = typeof window !== 'undefined';

class BiometricService {
  private Capacitor: any = null;
  private NativeBiometric: any = null;
  private BiometryType: any = null;
  private Haptics: any = null;
  private ImpactStyle: any = null;
  private initialized = false;
  private initPromise: Promise<boolean> | null = null;

  /**
   * Initialize Capacitor modules lazily
   */
  private async init(): Promise<boolean> {
    // Return cached result if already initialized
    if (this.initialized) {
      return this.isNativePlatform();
    }

    // If initialization is in progress, wait for it
    if (this.initPromise) {
      return this.initPromise;
    }

    // Start initialization
    this.initPromise = this.loadModules();
    return this.initPromise;
  }

  private async loadModules(): Promise<boolean> {
    if (!isBrowser) {
      this.initialized = true;
      return false;
    }

    try {
      // Dynamic import - these will only load in the browser
      const capacitorCore = await import('@capacitor/core').catch(() => null);
      
      if (capacitorCore) {
        this.Capacitor = capacitorCore.Capacitor;
      }

      // Only load other modules if we're on a native platform
      if (this.Capacitor && this.Capacitor.isNativePlatform()) {
        const [biometric, haptics] = await Promise.all([
          import('capacitor-native-biometric').catch(() => null),
          import('@capacitor/haptics').catch(() => null),
        ]);

        if (biometric) {
          this.NativeBiometric = biometric.NativeBiometric;
          this.BiometryType = biometric.BiometryType;
        }

        if (haptics) {
          this.Haptics = haptics.Haptics;
          this.ImpactStyle = haptics.ImpactStyle;
        }
      }

      this.initialized = true;
      return this.isNativePlatform();
    } catch (error) {
      console.warn('Capacitor modules not available:', error);
      this.initialized = true;
      return false;
    }
  }

  private isNativePlatform(): boolean {
    if (!isBrowser || !this.Capacitor) return false;
    try {
      return this.Capacitor.isNativePlatform();
    } catch {
      return false;
    }
  }

  /**
   * Check if biometric authentication is available
   */
  async isAvailable(): Promise<BiometricAvailability> {
    const native = await this.init();

    if (!native || !this.NativeBiometric) {
      return {
        available: false,
        biometryType: 'none',
        errorMessage: 'Not running in native app',
      };
    }

    try {
      const result = await this.NativeBiometric.isAvailable();

      let biometryType: 'face' | 'fingerprint' | 'none' = 'none';

      if (this.BiometryType && (result.biometryType === this.BiometryType.FACE_ID ||
          result.biometryType === this.BiometryType.FACE_AUTHENTICATION)) {
        biometryType = 'face';
      } else if (this.BiometryType && (result.biometryType === this.BiometryType.TOUCH_ID ||
                 result.biometryType === this.BiometryType.FINGERPRINT)) {
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

    if (!native || !this.NativeBiometric) {
      return {
        success: false,
        error: 'Biometric authentication is only available in the native app',
      };
    }

    try {
      await this.hapticFeedback('medium');

      await this.NativeBiometric.verifyIdentity({
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
    const native = await this.init();
    if (!native || !this.NativeBiometric) return false;

    try {
      await this.NativeBiometric.setCredentials({
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
    const native = await this.init();
    if (!native || !this.NativeBiometric) return null;

    try {
      const credentials = await this.NativeBiometric.getCredentials({
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
    if (!native || !this.NativeBiometric) return false;

    try {
      await this.NativeBiometric.deleteCredentials({
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
    // Don't wait for init for haptics - it's non-critical
    if (!isBrowser || !this.Haptics || !this.ImpactStyle) return;

    try {
      switch (style) {
        case 'light':
          await this.Haptics.impact({ style: this.ImpactStyle.Light });
          break;
        case 'medium':
          await this.Haptics.impact({ style: this.ImpactStyle.Medium });
          break;
        case 'heavy':
          await this.Haptics.impact({ style: this.ImpactStyle.Heavy });
          break;
        case 'success':
          await this.Haptics.notification({ type: 'success' as any });
          break;
        case 'error':
          await this.Haptics.notification({ type: 'error' as any });
          break;
      }
    } catch {
      // Silently fail
    }
  }

  /**
   * Check if running in native app (synchronous)
   */
  isNativeApp(): boolean {
    return this.isNativePlatform();
  }
}

// Export singleton instance
export const biometricService = new BiometricService();
