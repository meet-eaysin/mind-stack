import { decryptSecret, encryptSecret } from '@repo/config';

export class LlmSecretCipher {
  constructor(private readonly encryptionKey: string | undefined) {}

  encrypt(apiKey: string | null | undefined): string | null {
    if (!apiKey) {
      return null;
    }

    const trimmed = apiKey.trim();
    if (trimmed.length === 0) {
      return null;
    }

    if (!this.encryptionKey || this.encryptionKey.trim().length === 0) {
      throw new Error(
        'LLM_CONFIG_ENCRYPTION_KEY is required to store API keys',
      );
    }

    return encryptSecret(trimmed, this.encryptionKey);
  }

  decrypt(encryptedApiKey: string | null): string | null {
    if (!encryptedApiKey) {
      return null;
    }

    if (!this.encryptionKey || this.encryptionKey.trim().length === 0) {
      throw new Error(
        'LLM_CONFIG_ENCRYPTION_KEY is required to decrypt API keys',
      );
    }

    return decryptSecret(encryptedApiKey, this.encryptionKey);
  }
}
