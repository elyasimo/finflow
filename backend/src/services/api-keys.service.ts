import { db } from '../db';
import { encryptedApiKeys } from '../../drizzle/schema';
import { encryptionService } from './encryption.service';
import { eq, and } from 'drizzle-orm';

export interface ApiKeyPair {
  apiKey: string;
  apiSecret: string;
  permissions?: any;
}

/**
 * ApiKeysService - Manages encrypted API keys for external services
 */
export class ApiKeysService {
  /**
   * Store encrypted API keys for a user
   */
  async storeApiKeys(
    userId: string,
    provider: 'binance' | 'alpaca',
    apiKey: string,
    apiSecret: string,
    permissions?: any
  ): Promise<void> {
    // Encrypt API key
    const encryptedKey = encryptionService.encrypt(apiKey);

    // Encrypt API secret
    const encryptedSecret = encryptionService.encrypt(apiSecret);

    // Check if keys already exist for this user and provider
    const existing = await db
      .select()
      .from(encryptedApiKeys)
      .where(
        and(
          eq(encryptedApiKeys.userId, userId),
          eq(encryptedApiKeys.provider, provider)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      // Update existing keys
      await db
        .update(encryptedApiKeys)
        .set({
          apiKeyEncrypted: encryptedKey.encrypted,
          apiKeyIv: encryptedKey.iv,
          apiKeyTag: encryptedKey.tag,
          apiSecretEncrypted: encryptedSecret.encrypted,
          apiSecretIv: encryptedSecret.iv,
          apiSecretTag: encryptedSecret.tag,
          permissions,
          updatedAt: new Date(),
        })
        .where(eq(encryptedApiKeys.id, existing[0].id));
    } else {
      // Insert new keys
      await db.insert(encryptedApiKeys).values({
        userId,
        provider,
        apiKeyEncrypted: encryptedKey.encrypted,
        apiKeyIv: encryptedKey.iv,
        apiKeyTag: encryptedKey.tag,
        apiSecretEncrypted: encryptedSecret.encrypted,
        apiSecretIv: encryptedSecret.iv,
        apiSecretTag: encryptedSecret.tag,
        permissions,
      });
    }
  }

  /**
   * Retrieve decrypted API keys for a user
   */
  async getApiKeys(
    userId: string,
    provider: 'binance' | 'alpaca'
  ): Promise<ApiKeyPair | null> {
    const result = await db
      .select()
      .from(encryptedApiKeys)
      .where(
        and(
          eq(encryptedApiKeys.userId, userId),
          eq(encryptedApiKeys.provider, provider)
        )
      )
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    const record = result[0];

    try {
      // Decrypt API key
      const apiKey = encryptionService.decrypt(
        record.apiKeyEncrypted,
        record.apiKeyIv,
        record.apiKeyTag
      );

      // Decrypt API secret
      const apiSecret = encryptionService.decrypt(
        record.apiSecretEncrypted,
        record.apiSecretIv,
        record.apiSecretTag
      );

      // Update last used timestamp
      await db
        .update(encryptedApiKeys)
        .set({ lastUsedAt: new Date() })
        .where(eq(encryptedApiKeys.id, record.id));

      return {
        apiKey,
        apiSecret,
        permissions: record.permissions,
      };
    } catch (error) {
      console.error('Failed to decrypt API keys:', error);
      throw new Error('Failed to decrypt API keys - encryption key may have changed');
    }
  }

  /**
   * Delete API keys for a user
   */
  async deleteApiKeys(
    userId: string,
    provider: 'binance' | 'alpaca'
  ): Promise<void> {
    await db
      .delete(encryptedApiKeys)
      .where(
        and(
          eq(encryptedApiKeys.userId, userId),
          eq(encryptedApiKeys.provider, provider)
        )
      );
  }

  /**
   * Check if user has API keys configured for a provider
   */
  async hasApiKeys(
    userId: string,
    provider: 'binance' | 'alpaca'
  ): Promise<boolean> {
    const result = await db
      .select({ id: encryptedApiKeys.id })
      .from(encryptedApiKeys)
      .where(
        and(
          eq(encryptedApiKeys.userId, userId),
          eq(encryptedApiKeys.provider, provider)
        )
      )
      .limit(1);

    return result.length > 0;
  }

  /**
   * List all providers that have API keys configured for a user
   */
  async listProviders(userId: string): Promise<string[]> {
    const result = await db
      .select({ provider: encryptedApiKeys.provider })
      .from(encryptedApiKeys)
      .where(eq(encryptedApiKeys.userId, userId));

    return result.map(r => r.provider);
  }
}

// Singleton instance
export const apiKeysService = new ApiKeysService();
