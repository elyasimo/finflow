import crypto from 'crypto';

/**
 * EncryptionService - Handles encryption/decryption of sensitive data like API keys
 * Uses AES-256-GCM for authenticated encryption
 */
export class EncryptionService {
  private algorithm = 'aes-256-gcm';
  private key: Buffer;

  constructor() {
    // Master key from environment variable
    const masterKey = process.env.ENCRYPTION_MASTER_KEY;

    if (!masterKey) {
      // Generate a random key for development if not set
      if (process.env.NODE_ENV === 'development') {
        console.warn('⚠️  ENCRYPTION_MASTER_KEY not set! Generating random key for development.');
        console.warn('⚠️  This key will change on restart. Set ENCRYPTION_MASTER_KEY in .env for production!');
        this.key = crypto.randomBytes(32);
      } else {
        throw new Error('ENCRYPTION_MASTER_KEY must be set in production!');
      }
    } else if (masterKey.length !== 64) {
      throw new Error('ENCRYPTION_MASTER_KEY must be 64 hex characters (32 bytes)');
    } else {
      this.key = Buffer.from(masterKey, 'hex');
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

// Singleton instance
export const encryptionService = new EncryptionService();
