// @ts-nocheck
import crypto from 'crypto';

/**
 * EncryptionService - Handles encryption/decryption of sensitive data like API keys
 * Uses AES-256-GCM for authenticated encryption
 * 
 * IMPORTANT: ENCRYPTION_MASTER_KEY must be set in environment variables.
 * Without it, API key encryption is DISABLED and keys cannot be persisted.
 * 
 * Generate a key with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
 */

// Global flag to track if encryption is available
let encryptionEnabled = false;
let encryptionDisabledReason = '';

export function isEncryptionEnabled(): boolean {
  return encryptionEnabled;
}

export function getEncryptionDisabledReason(): string {
  return encryptionDisabledReason;
}

export class EncryptionService {
  private algorithm = 'aes-256-gcm';
  private key: Buffer;

  constructor() {
    // Master key from environment variable
    const masterKey = process.env.ENCRYPTION_MASTER_KEY;

    if (!masterKey) {
      // CRITICAL: Do NOT generate random key - this causes data loss on restart
      encryptionEnabled = false;
      encryptionDisabledReason = 'ENCRYPTION_MASTER_KEY environment variable is not set. API key encryption is DISABLED. Set this variable to enable secure API key storage.';
      console.error('❌ CRITICAL: ' + encryptionDisabledReason);
      console.error('❌ Generate a key with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"');
      // Use a dummy key that will never successfully decrypt old data
      // This prevents silent data corruption
      this.key = Buffer.alloc(32, 0);
    } else if (masterKey.length !== 64) {
      encryptionEnabled = false;
      encryptionDisabledReason = 'ENCRYPTION_MASTER_KEY must be exactly 64 hex characters (32 bytes). Current length: ' + masterKey.length;
      console.error('❌ CRITICAL: ' + encryptionDisabledReason);
      this.key = Buffer.alloc(32, 0);
    } else {
      try {
        this.key = Buffer.from(masterKey, 'hex');
        encryptionEnabled = true;
        console.log('✅ Encryption service initialized successfully with master key');
      } catch (error) {
        encryptionEnabled = false;
        encryptionDisabledReason = 'Failed to parse ENCRYPTION_MASTER_KEY as hex: ' + (error as Error).message;
        console.error('❌ CRITICAL: ' + encryptionDisabledReason);
        this.key = Buffer.alloc(32, 0);
      }
    }
  }

  /**
   * Encrypt a plaintext string
   * @param text The plaintext to encrypt
   * @returns Object containing encrypted data, IV, and auth tag
   */
  encrypt(text: string): { encrypted: string; iv: string; tag: string } {
    // Generate random initialization vector
    const iv = crypto.randomBytes(16);

    // Create cipher
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);

    // Encrypt
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    // Get authentication tag
    const tag = cipher.getAuthTag();

    return {
      encrypted,
      iv: iv.toString('hex'),
      tag: tag.toString('hex')
    };
  }

  /**
   * Decrypt an encrypted string
   * @param encrypted The encrypted data
   * @param iv The initialization vector (hex string)
   * @param tag The authentication tag (hex string)
   * @returns The decrypted plaintext
   */
  decrypt(encrypted: string, iv: string, tag: string): string {
    try {
      // Create decipher
      const decipher = crypto.createDecipheriv(
        this.algorithm,
        this.key,
        Buffer.from(iv, 'hex')
      );

      // Set auth tag
      decipher.setAuthTag(Buffer.from(tag, 'hex'));

      // Decrypt
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      throw new Error('Decryption failed - data may be corrupted or key is incorrect');
    }
  }

  /**
   * Generate a new master key (for initial setup)
   * @returns A 64-character hex string (32 bytes)
   */
  static generateMasterKey(): string {
    return crypto.randomBytes(32).toString('hex');
  }
}

// Lazy singleton instance - only created when first accessed
let _encryptionService: EncryptionService | null = null;

export function getEncryptionService(): EncryptionService {
  if (!_encryptionService) {
    _encryptionService = new EncryptionService();
  }
  return _encryptionService;
}

// For backwards compatibility - but this getter ensures lazy initialization
export const encryptionService = {
  encrypt: (text: string) => getEncryptionService().encrypt(text),
  decrypt: (encrypted: string, iv: string, tag: string) => getEncryptionService().decrypt(encrypted, iv, tag),
};
