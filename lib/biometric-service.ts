import { Capacitor } from '@capacitor/core';
import { NativeBiometric, AvailableResult, BiometryType } from 'capacitor-native-biometric';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

// Check if we're running in native app or web
const isNative = Capacitor.isNativePlatform();

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
  /**
   * Check if biometric authentication is available
   */
  async isAvailable(): Promise<BiometricAvailability> {
    if (!isNative) {
      return {
        available: false,
        biometryType: 'none',
        errorMessage: 'Not running in native app',
      };
    }

    try {
      const result: AvailableResult = await NativeBiometric.isAvailable();
      
      let biometryType: 'face' | 'fingerprint' | 'none' = 'none';
      
      if (result.biometryType === BiometryType.FACE_ID || 
          result.biometryType === BiometryType.FACE_AUTHENTICATION) {
        biometryType = 'face';
      } else if (result.biometryType === BiometryType.TOUCH_ID || 
                 result.biometryType === BiometryType.FINGERPRINT) {
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
    if (!isNative) {
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
    if (!isNative) return false;

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
    if (!isNative) return null;

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
    if (!isNative) return false;

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
    if (!isNative) return;

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
    return isNative;
  }
}

export const biometricService = new BiometricService();
