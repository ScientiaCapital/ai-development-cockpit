import crypto from 'crypto';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface CredentialConfig {
  enableSupabaseStorage: boolean;
  enableEncryption: boolean;
  encryptionKey?: string;
  rotationInterval: number; // in milliseconds
  maxKeyAge: number; // in milliseconds
  enableAutoRotation: boolean;
  backupToEnvironment: boolean;
}

export interface OrganizationCredentials {
  organization: string;
  apiKey: string;
  apiSecret?: string;
  webhookSecret?: string;
  createdAt: Date;
  lastUsed?: Date;
  lastRotated?: Date;
  expiresAt?: Date;
  isActive: boolean;
  version: number;
  metadata?: Record<string, any>;
}

export interface CredentialStats {
  totalCredentials: number;
  activeCredentials: number;
  expiredCredentials: number;
  credentialsNearExpiry: number;
  averageKeyAge: number;
  lastRotationTime?: Date;
  organizationsCount: number;
}

export interface RotationResult {
  organization: string;
  success: boolean;
  oldKeyId: string;
  newKeyId: string;
  rotatedAt: Date;
  error?: string;
}

// Default configuration
const DEFAULT_CONFIG: CredentialConfig = {
  enableSupabaseStorage: true,
  enableEncryption: true,
  rotationInterval: 24 * 60 * 60 * 1000, // 24 hours
  maxKeyAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  enableAutoRotation: false,
  backupToEnvironment: true,
};

export class HuggingFaceCredentialsService {
  private config: CredentialConfig;
  private supabase?: SupabaseClient;
  private credentials: Map<string, OrganizationCredentials> = new Map();
  private encryptionKey: Buffer;
  private rotationTimer?: NodeJS.Timeout;
  private enableLogging: boolean;

  constructor(
    config: Partial<CredentialConfig> = {},
    enableLogging = process.env.NODE_ENV === 'development'
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.enableLogging = enableLogging;

    // Initialize encryption key
    this.encryptionKey = this.initializeEncryptionKey();

    // Initialize Supabase client if enabled
    if (this.config.enableSupabaseStorage) {
      this.initializeSupabase();
    }

    // Load credentials from environment variables as fallback
    if (this.config.backupToEnvironment) {
      this.loadCredentialsFromEnvironment();
    }

    // Set up auto-rotation if enabled
    if (this.config.enableAutoRotation) {
      this.setupAutoRotation();
    }

    this.log('CREDENTIALS_SERVICE_INITIALIZED', {
      enableSupabaseStorage: this.config.enableSupabaseStorage,
      enableEncryption: this.config.enableEncryption,
      enableAutoRotation: this.config.enableAutoRotation,
    });
  }

  private initializeEncryptionKey(): Buffer {
    const keySource = this.config.encryptionKey ||
      process.env.CREDENTIALS_ENCRYPTION_KEY ||
      'default-encryption-key-please-change-in-production';

    // Use PBKDF2 to derive a proper encryption key
    return crypto.pbkdf2Sync(keySource, 'huggingface-credentials', 10000, 32, 'sha256');
  }

  private initializeSupabase(): void {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      this.log('SUPABASE_CONFIG_MISSING', {
        hasUrl: !!supabaseUrl,
        hasServiceKey: !!supabaseServiceKey,
      });
      return;
    }

    try {
      this.supabase = createClient(supabaseUrl, supabaseServiceKey);
      this.log('SUPABASE_INITIALIZED', { url: supabaseUrl });
    } catch (error) {
      this.log('SUPABASE_INIT_ERROR', { error: (error as Error).message });
    }
  }

  private loadCredentialsFromEnvironment(): void {
    const environmentCredentials = [
      { org: 'swaggystacks', keyEnv: 'HUGGINGFACE_SWAGGYSTACKS_API_KEY' },
      { org: 'scientia', keyEnv: 'HUGGINGFACE_SCIENTIA_API_KEY' },
      { org: 'default', keyEnv: 'HUGGINGFACE_API_KEY' },
    ];

    for (const { org, keyEnv } of environmentCredentials) {
      const apiKey = process.env[keyEnv];
      if (apiKey) {
        this.credentials.set(org, {
          organization: org,
          apiKey: apiKey,
          createdAt: new Date(),
          isActive: true,
          version: 1,
          metadata: { source: 'environment' },
        });

        this.log('CREDENTIAL_LOADED_FROM_ENV', { organization: org });
      }
    }
  }

  private setupAutoRotation(): void {
    this.rotationTimer = setInterval(
      () => this.performAutoRotation(),
      this.config.rotationInterval
    );

    this.log('AUTO_ROTATION_SETUP', {
      interval: this.config.rotationInterval,
    });
  }

  private async performAutoRotation(): Promise<void> {
    const results: RotationResult[] = [];

    for (const [organization, credentials] of this.credentials) {
      if (!credentials.isActive) continue;

      const keyAge = Date.now() - credentials.createdAt.getTime();
      const needsRotation = keyAge > this.config.maxKeyAge ||
        (credentials.lastRotated &&
          Date.now() - credentials.lastRotated.getTime() > this.config.rotationInterval);

      if (needsRotation) {
        try {
          const result = await this.rotateCredentials(organization);
          results.push(result);
        } catch (error) {
          results.push({
            organization,
            success: false,
            oldKeyId: this.generateKeyId(credentials.apiKey),
            newKeyId: '',
            rotatedAt: new Date(),
            error: (error as Error).message,
          });
        }
      }
    }

    if (results.length > 0) {
      this.log('AUTO_ROTATION_COMPLETED', {
        totalRotations: results.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
      });
    }
  }

  private encrypt(text: string): string {
    if (!this.config.enableEncryption) {
      return text;
    }

    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher('aes-256-cbc', this.encryptionKey);
    cipher.setAutoPadding(true);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return iv.toString('hex') + ':' + encrypted;
  }

  private decrypt(encryptedText: string): string {
    if (!this.config.enableEncryption) {
      return encryptedText;
    }

    const parts = encryptedText.split(':');
    if (parts.length !== 2) {
      throw new Error('Invalid encrypted credential format');
    }

    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];

    const decipher = crypto.createDecipher('aes-256-cbc', this.encryptionKey);
    decipher.setAutoPadding(true);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  private generateKeyId(apiKey: string): string {
    return crypto.createHash('sha256').update(apiKey).digest('hex').substring(0, 16);
  }

  private log(level: string, data: any): void {
    if (!this.enableLogging) return;

    const timestamp = new Date().toISOString();
    // Never log actual credentials
    const sanitizedData = { ...data };
    if (sanitizedData.apiKey) {
      sanitizedData.apiKey = this.generateKeyId(sanitizedData.apiKey);
    }
    console.log(`[${timestamp}] HF_CREDENTIALS_${level}:`, JSON.stringify(sanitizedData, null, 2));
  }

  public async storeCredentials(credentials: Omit<OrganizationCredentials, 'createdAt' | 'version'>): Promise<boolean> {
    try {
      const fullCredentials: OrganizationCredentials = {
        ...credentials,
        createdAt: new Date(),
        version: 1,
        isActive: true,
      };

      // Store in memory
      this.credentials.set(credentials.organization, fullCredentials);

      // Store in Supabase if enabled
      if (this.supabase && this.config.enableSupabaseStorage) {
        const encryptedCredentials = {
          organization: credentials.organization,
          api_key: this.encrypt(credentials.apiKey),
          api_secret: credentials.apiSecret ? this.encrypt(credentials.apiSecret) : null,
          webhook_secret: credentials.webhookSecret ? this.encrypt(credentials.webhookSecret) : null,
          created_at: fullCredentials.createdAt.toISOString(),
          last_used: fullCredentials.lastUsed?.toISOString(),
          last_rotated: fullCredentials.lastRotated?.toISOString(),
          expires_at: fullCredentials.expiresAt?.toISOString(),
          is_active: fullCredentials.isActive,
          version: fullCredentials.version,
          metadata: fullCredentials.metadata,
        };

        const { error } = await this.supabase
          .from('huggingface_credentials')
          .upsert(encryptedCredentials);

        if (error) {
          throw new Error(`Supabase storage error: ${error.message}`);
        }
      }

      this.log('CREDENTIALS_STORED', {
        organization: credentials.organization,
        keyId: this.generateKeyId(credentials.apiKey),
      });

      return true;
    } catch (error) {
      this.log('CREDENTIALS_STORE_ERROR', {
        organization: credentials.organization,
        error: (error as Error).message,
      });
      return false;
    }
  }

  public async getCredentials(organization: string): Promise<OrganizationCredentials | null> {
    // Try memory first
    let credentials = this.credentials.get(organization);

    // If not in memory and Supabase is enabled, try loading from Supabase
    if (!credentials && this.supabase && this.config.enableSupabaseStorage) {
      try {
        const { data, error } = await this.supabase
          .from('huggingface_credentials')
          .select('*')
          .eq('organization', organization)
          .eq('is_active', true)
          .single();

        if (error) {
          this.log('SUPABASE_FETCH_ERROR', {
            organization,
            error: error.message,
          });
        } else if (data) {
          credentials = {
            organization: data.organization,
            apiKey: this.decrypt(data.api_key),
            apiSecret: data.api_secret ? this.decrypt(data.api_secret) : undefined,
            webhookSecret: data.webhook_secret ? this.decrypt(data.webhook_secret) : undefined,
            createdAt: new Date(data.created_at),
            lastUsed: data.last_used ? new Date(data.last_used) : undefined,
            lastRotated: data.last_rotated ? new Date(data.last_rotated) : undefined,
            expiresAt: data.expires_at ? new Date(data.expires_at) : undefined,
            isActive: data.is_active,
            version: data.version,
            metadata: data.metadata,
          };

          // Cache in memory
          this.credentials.set(organization, credentials);
        }
      } catch (error) {
        this.log('CREDENTIALS_FETCH_ERROR', {
          organization,
          error: (error as Error).message,
        });
      }
    }

    // Update last used timestamp
    if (credentials) {
      credentials.lastUsed = new Date();
      this.credentials.set(organization, credentials);
    }

    return credentials || null;
  }

  public async getApiKey(organization: string): Promise<string | null> {
    const credentials = await this.getCredentials(organization);
    return credentials?.apiKey || null;
  }

  public async getWebhookSecret(organization: string): Promise<string | null> {
    const credentials = await this.getCredentials(organization);
    return credentials?.webhookSecret || null;
  }

  public async rotateCredentials(organization: string): Promise<RotationResult> {
    const credentials = await this.getCredentials(organization);
    if (!credentials) {
      throw new Error(`No credentials found for organization: ${organization}`);
    }

    const oldKeyId = this.generateKeyId(credentials.apiKey);

    try {
      // Generate new API key (in a real implementation, this would call HuggingFace API)
      const newApiKey = this.generateApiKey();
      const newKeyId = this.generateKeyId(newApiKey);

      // Update credentials
      const updatedCredentials: OrganizationCredentials = {
        ...credentials,
        apiKey: newApiKey,
        lastRotated: new Date(),
        version: credentials.version + 1,
      };

      const success = await this.storeCredentials(updatedCredentials);

      if (success) {
        this.log('CREDENTIALS_ROTATED', {
          organization,
          oldKeyId,
          newKeyId,
          version: updatedCredentials.version,
        });

        return {
          organization,
          success: true,
          oldKeyId,
          newKeyId,
          rotatedAt: new Date(),
        };
      } else {
        throw new Error('Failed to store rotated credentials');
      }
    } catch (error) {
      this.log('CREDENTIALS_ROTATION_ERROR', {
        organization,
        oldKeyId,
        error: (error as Error).message,
      });

      return {
        organization,
        success: false,
        oldKeyId,
        newKeyId: '',
        rotatedAt: new Date(),
        error: (error as Error).message,
      };
    }
  }

  private generateApiKey(): string {
    // In a real implementation, this would call HuggingFace API to generate a new key
    return 'hf_' + crypto.randomBytes(32).toString('hex');
  }

  public async deactivateCredentials(organization: string): Promise<boolean> {
    const credentials = await this.getCredentials(organization);
    if (!credentials) {
      return false;
    }

    try {
      credentials.isActive = false;
      const success = await this.storeCredentials(credentials);

      if (success) {
        this.log('CREDENTIALS_DEACTIVATED', { organization });
      }

      return success;
    } catch (error) {
      this.log('CREDENTIALS_DEACTIVATION_ERROR', {
        organization,
        error: (error as Error).message,
      });
      return false;
    }
  }

  public async validateCredentials(organization: string): Promise<{ valid: boolean; error?: string }> {
    try {
      const credentials = await this.getCredentials(organization);
      if (!credentials) {
        return { valid: false, error: 'No credentials found' };
      }

      if (!credentials.isActive) {
        return { valid: false, error: 'Credentials are deactivated' };
      }

      if (credentials.expiresAt && credentials.expiresAt < new Date()) {
        return { valid: false, error: 'Credentials have expired' };
      }

      // Test API key by making a simple API call
      const testResponse = await fetch('https://huggingface.co/api/whoami', {
        headers: {
          'Authorization': `Bearer ${credentials.apiKey}`,
        },
      });

      if (!testResponse.ok) {
        return { valid: false, error: `API validation failed: ${testResponse.status}` };
      }

      this.log('CREDENTIALS_VALIDATED', { organization });
      return { valid: true };
    } catch (error) {
      this.log('CREDENTIALS_VALIDATION_ERROR', {
        organization,
        error: (error as Error).message,
      });
      return { valid: false, error: (error as Error).message };
    }
  }

  public getStats(): CredentialStats {
    const allCredentials = Array.from(this.credentials.values());
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const activeCredentials = allCredentials.filter(c => c.isActive);
    const expiredCredentials = allCredentials.filter(c =>
      c.expiresAt && c.expiresAt < now
    );
    const credentialsNearExpiry = allCredentials.filter(c =>
      c.expiresAt && c.expiresAt < thirtyDaysFromNow && c.expiresAt > now
    );

    const totalAge = allCredentials.reduce((sum, c) =>
      sum + (now.getTime() - c.createdAt.getTime()), 0
    );
    const averageKeyAge = allCredentials.length > 0 ? totalAge / allCredentials.length : 0;

    const lastRotationTimes = allCredentials
      .map(c => c.lastRotated)
      .filter(t => t !== undefined) as Date[];
    const lastRotationTime = lastRotationTimes.length > 0
      ? new Date(Math.max(...lastRotationTimes.map(t => t.getTime())))
      : undefined;

    return {
      totalCredentials: allCredentials.length,
      activeCredentials: activeCredentials.length,
      expiredCredentials: expiredCredentials.length,
      credentialsNearExpiry: credentialsNearExpiry.length,
      averageKeyAge,
      lastRotationTime,
      organizationsCount: new Set(allCredentials.map(c => c.organization)).size,
    };
  }

  public listOrganizations(): string[] {
    return Array.from(this.credentials.keys());
  }

  public async clearCredentials(organization?: string): Promise<void> {
    if (organization) {
      this.credentials.delete(organization);
      this.log('CREDENTIALS_CLEARED', { organization });
    } else {
      this.credentials.clear();
      this.log('ALL_CREDENTIALS_CLEARED', {});
    }
  }

  public updateConfig(newConfig: Partial<CredentialConfig>): void {
    const oldConfig = { ...this.config };
    this.config = { ...this.config, ...newConfig };

    // Restart auto-rotation if settings changed
    if (newConfig.enableAutoRotation !== undefined || newConfig.rotationInterval !== undefined) {
      if (this.rotationTimer) {
        clearInterval(this.rotationTimer);
        this.rotationTimer = undefined;
      }

      if (this.config.enableAutoRotation) {
        this.setupAutoRotation();
      }
    }

    this.log('CONFIG_UPDATED', { oldConfig, newConfig: this.config });
  }

  public async healthCheck(): Promise<{
    totalCredentials: number;
    validCredentials: number;
    invalidCredentials: number;
    results: any[];
  }> {
    const stats = this.getStats();
    const results: any[] = [];

    // Check each organization's credentials
    for (const organization of this.listOrganizations()) {
      try {
        const validation = await this.validateCredentials(organization);
        results.push({
          organization,
          valid: validation.valid,
          error: validation.error,
          timestamp: new Date(),
        });
      } catch (error) {
        results.push({
          organization,
          valid: false,
          error: (error as Error).message,
          timestamp: new Date(),
        });
      }
    }

    const validCredentials = results.filter(r => r.valid).length;
    const invalidCredentials = results.filter(r => !r.valid).length;

    this.log('HEALTH_CHECK_COMPLETED', {
      totalCredentials: stats.totalCredentials,
      validCredentials,
      invalidCredentials,
      resultsCount: results.length,
    });

    return {
      totalCredentials: stats.totalCredentials,
      validCredentials,
      invalidCredentials,
      results,
    };
  }

  public async shutdown(): Promise<void> {
    if (this.rotationTimer) {
      clearInterval(this.rotationTimer);
      this.rotationTimer = undefined;
    }

    this.log('CREDENTIALS_SERVICE_SHUTDOWN', {});
  }
}

// Export a default instance
export default new HuggingFaceCredentialsService();