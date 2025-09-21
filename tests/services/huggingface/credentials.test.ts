import { HuggingFaceCredentialsService } from '../../../src/services/huggingface/credentials.service';

// Mock Supabase
const mockSupabaseClient = {
  from: jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    upsert: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn(),
  })),
  auth: {
    getSession: jest.fn(),
    signInWithPassword: jest.fn(),
  },
};

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => mockSupabaseClient),
}));

describe('HuggingFaceCredentialsService', () => {
  let credentialsService: HuggingFaceCredentialsService;

  beforeEach(() => {
    jest.clearAllMocks();
    credentialsService = new HuggingFaceCredentialsService();
  });

  describe('credential storage', () => {
    it('should store organization credentials', async () => {
      const mockInsert = mockSupabaseClient.from().insert;
      mockInsert.mockResolvedValueOnce({ data: null, error: null });

      const credentials = {
        organization: 'swaggystacks',
        apiKey: 'hf_test_key_123',
        organizationId: 'org_123',
        permissions: ['read', 'write'],
        metadata: { team: 'dev' },
      };

      const result = await credentialsService.storeCredentials(credentials);

      expect(result).toBe(true);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('huggingface_credentials');
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          organization: 'swaggystacks',
          organization_id: 'org_123',
          encrypted_api_key: expect.any(String),
          permissions: ['read', 'write'],
          metadata: { team: 'dev' },
          is_active: true,
        })
      );
    });

    it('should handle storage errors', async () => {
      const mockInsert = mockSupabaseClient.from().insert;
      mockInsert.mockResolvedValueOnce({
        data: null,
        error: { message: 'Database error' },
      });

      const credentials = {
        organization: 'swaggystacks',
        apiKey: 'hf_test_key_123',
        organizationId: 'org_123',
        permissions: ['read'],
      };

      const result = await credentialsService.storeCredentials(credentials);

      expect(result).toBe(false);
    });

    it('should handle encryption errors gracefully', async () => {
      // Mock crypto to throw error
      const originalRandomBytes = require('crypto').randomBytes;
      require('crypto').randomBytes = jest.fn().mockImplementation(() => {
        throw new Error('Crypto error');
      });

      const credentials = {
        organization: 'swaggystacks',
        apiKey: 'hf_test_key_123',
        organizationId: 'org_123',
        permissions: ['read'],
      };

      const result = await credentialsService.storeCredentials(credentials);

      expect(result).toBe(false);

      // Restore original function
      require('crypto').randomBytes = originalRandomBytes;
    });
  });

  describe('credential retrieval', () => {
    it('should retrieve and decrypt credentials', async () => {
      const mockSelect = mockSupabaseClient.from().select;
      const mockEq = mockSupabaseClient.from().eq;
      const mockSingle = mockSupabaseClient.from().single;

      // First store credentials to get proper encryption
      const testCredentials = {
        organization: 'swaggystacks',
        apiKey: 'hf_test_key_123',
        organizationId: 'org_123',
        permissions: ['read', 'write'],
      };

      await credentialsService.storeCredentials(testCredentials);

      // Mock the database response with encrypted data
      mockSingle.mockResolvedValueOnce({
        data: {
          id: 1,
          organization: 'swaggystacks',
          organization_id: 'org_123',
          encrypted_api_key: 'encrypted_data_here',
          iv: 'iv_data_here',
          permissions: ['read', 'write'],
          metadata: null,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        error: null,
      });

      const result = await credentialsService.getCredentials('swaggystacks');

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('huggingface_credentials');
      expect(mockEq).toHaveBeenCalledWith('organization', 'swaggystacks');
      expect(mockEq).toHaveBeenCalledWith('is_active', true);
    });

    it('should handle missing credentials', async () => {
      const mockSingle = mockSupabaseClient.from().single;
      mockSingle.mockResolvedValueOnce({
        data: null,
        error: { message: 'Not found' },
      });

      const result = await credentialsService.getCredentials('nonexistent');

      expect(result).toBeNull();
    });

    it('should handle decryption errors', async () => {
      const mockSingle = mockSupabaseClient.from().single;
      mockSingle.mockResolvedValueOnce({
        data: {
          encrypted_api_key: 'invalid_encrypted_data',
          iv: 'invalid_iv',
          organization: 'test',
        },
        error: null,
      });

      const result = await credentialsService.getCredentials('test');

      expect(result).toBeNull();
    });
  });

  describe('credential validation', () => {
    it('should validate active credentials', async () => {
      // Mock successful API validation
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ user: { username: 'testuser' } }),
      } as Response);

      const mockSingle = mockSupabaseClient.from().single;
      mockSingle.mockResolvedValueOnce({
        data: {
          encrypted_api_key: 'encrypted_key',
          iv: 'test_iv',
          organization: 'swaggystacks',
        },
        error: null,
      });

      const result = await credentialsService.validateCredentials('swaggystacks');

      expect(result.valid).toBe(true);
      expect(result.organization).toBe('swaggystacks');
    });

    it('should handle invalid credentials', async () => {
      // Mock API rejection
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: false,
        status: 401,
      } as Response);

      const mockSingle = mockSupabaseClient.from().single;
      mockSingle.mockResolvedValueOnce({
        data: {
          encrypted_api_key: 'encrypted_key',
          iv: 'test_iv',
          organization: 'swaggystacks',
        },
        error: null,
      });

      const result = await credentialsService.validateCredentials('swaggystacks');

      expect(result.valid).toBe(false);
      expect(result.error).toContain('API validation failed');
    });

    it('should handle network errors during validation', async () => {
      // Mock network error
      global.fetch = jest.fn().mockRejectedValueOnce(new Error('Network error'));

      const mockSingle = mockSupabaseClient.from().single;
      mockSingle.mockResolvedValueOnce({
        data: {
          encrypted_api_key: 'encrypted_key',
          iv: 'test_iv',
          organization: 'swaggystacks',
        },
        error: null,
      });

      const result = await credentialsService.validateCredentials('swaggystacks');

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Network error');
    });
  });

  describe('credential rotation', () => {
    it('should rotate credentials successfully', async () => {
      const mockUpdate = mockSupabaseClient.from().update;
      const mockSingle = mockSupabaseClient.from().single;

      // Mock existing credentials
      mockSingle.mockResolvedValueOnce({
        data: {
          id: 1,
          organization: 'swaggystacks',
          encrypted_api_key: 'old_encrypted_key',
          iv: 'old_iv',
        },
        error: null,
      });

      // Mock successful update
      mockUpdate.mockResolvedValueOnce({
        data: { id: 1 },
        error: null,
      });

      const result = await credentialsService.rotateCredentials(
        'swaggystacks',
        'hf_new_key_456'
      );

      expect(result.success).toBe(true);
      expect(result.organization).toBe('swaggystacks');
      expect(mockUpdate).toHaveBeenCalled();
    });

    it('should handle rotation failures', async () => {
      const mockSingle = mockSupabaseClient.from().single;
      mockSingle.mockResolvedValueOnce({
        data: null,
        error: { message: 'Not found' },
      });

      const result = await credentialsService.rotateCredentials(
        'nonexistent',
        'new_key'
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to rotate credentials');
    });

    it('should backup old credentials during rotation', async () => {
      const mockUpdate = mockSupabaseClient.from().update;
      const mockInsert = mockSupabaseClient.from().insert;
      const mockSingle = mockSupabaseClient.from().single;

      // Mock existing credentials
      mockSingle.mockResolvedValueOnce({
        data: {
          id: 1,
          organization: 'swaggystacks',
          encrypted_api_key: 'old_encrypted_key',
          iv: 'old_iv',
          permissions: ['read'],
        },
        error: null,
      });

      // Mock successful backup and update
      mockInsert.mockResolvedValueOnce({ data: null, error: null });
      mockUpdate.mockResolvedValueOnce({ data: { id: 1 }, error: null });

      const result = await credentialsService.rotateCredentials(
        'swaggystacks',
        'hf_new_key_456',
        { createBackup: true }
      );

      expect(result.success).toBe(true);
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          organization: 'swaggystacks_backup',
          is_active: false,
        })
      );
    });
  });

  describe('credential listing', () => {
    it('should list all active credentials', async () => {
      const mockSelect = mockSupabaseClient.from().select;
      mockSelect.mockResolvedValueOnce({
        data: [
          {
            organization: 'swaggystacks',
            permissions: ['read', 'write'],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            organization: 'scientia-capital',
            permissions: ['read'],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ],
        error: null,
      });

      const result = await credentialsService.listCredentials();

      expect(result).toHaveLength(2);
      expect(result[0].organization).toBe('swaggystacks');
      expect(result[1].organization).toBe('scientia-capital');
    });

    it('should handle empty credential list', async () => {
      const mockSelect = mockSupabaseClient.from().select;
      mockSelect.mockResolvedValueOnce({
        data: [],
        error: null,
      });

      const result = await credentialsService.listCredentials();

      expect(result).toEqual([]);
    });
  });

  describe('credential deletion', () => {
    it('should delete credentials', async () => {
      const mockUpdate = mockSupabaseClient.from().update;
      mockUpdate.mockResolvedValueOnce({
        data: { id: 1 },
        error: null,
      });

      const result = await credentialsService.deleteCredentials('swaggystacks');

      expect(result).toBe(true);
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          is_active: false,
          deleted_at: expect.any(String),
        })
      );
    });

    it('should handle deletion errors', async () => {
      const mockUpdate = mockSupabaseClient.from().update;
      mockUpdate.mockResolvedValueOnce({
        data: null,
        error: { message: 'Update failed' },
      });

      const result = await credentialsService.deleteCredentials('swaggystacks');

      expect(result).toBe(false);
    });
  });

  describe('health check', () => {
    it('should perform health check on all credentials', async () => {
      const mockSelect = mockSupabaseClient.from().select;
      mockSelect.mockResolvedValueOnce({
        data: [
          { organization: 'swaggystacks' },
          { organization: 'scientia-capital' },
        ],
        error: null,
      });

      // Mock validation calls
      jest.spyOn(credentialsService, 'validateCredentials')
        .mockResolvedValueOnce({ valid: true, organization: 'swaggystacks' })
        .mockResolvedValueOnce({ valid: false, organization: 'scientia-capital', error: 'Invalid key' });

      const result = await credentialsService.healthCheck();

      expect(result.totalCredentials).toBe(2);
      expect(result.validCredentials).toBe(1);
      expect(result.invalidCredentials).toBe(1);
      expect(result.results).toHaveLength(2);
    });

    it('should handle health check errors', async () => {
      const mockSelect = mockSupabaseClient.from().select;
      mockSelect.mockResolvedValueOnce({
        data: null,
        error: { message: 'Database error' },
      });

      const result = await credentialsService.healthCheck();

      expect(result.totalCredentials).toBe(0);
      expect(result.validCredentials).toBe(0);
      expect(result.invalidCredentials).toBe(0);
    });
  });

  describe('encryption and decryption', () => {
    it('should encrypt and decrypt data consistently', () => {
      const testData = 'hf_test_api_key_123456789';

      // Use the service's internal methods indirectly by storing and retrieving
      const encrypted = credentialsService['encryptApiKey'](testData);
      expect(encrypted).toHaveProperty('encryptedData');
      expect(encrypted).toHaveProperty('iv');
      expect(encrypted.encryptedData).not.toBe(testData);

      const decrypted = credentialsService['decryptApiKey'](
        encrypted.encryptedData,
        encrypted.iv
      );
      expect(decrypted).toBe(testData);
    });

    it('should handle decryption of invalid data', () => {
      const result = credentialsService['decryptApiKey']('invalid_data', 'invalid_iv');
      expect(result).toBeNull();
    });
  });

  describe('audit trail', () => {
    it('should create audit trail entries', async () => {
      const mockInsert = mockSupabaseClient.from().insert;
      mockInsert.mockResolvedValueOnce({ data: null, error: null });

      await credentialsService['createAuditTrail']('swaggystacks', 'CREATED', {
        permissions: ['read', 'write'],
      });

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('huggingface_audit_trail');
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          organization: 'swaggystacks',
          action: 'CREATED',
          metadata: { permissions: ['read', 'write'] },
        })
      );
    });

    it('should handle audit trail errors gracefully', async () => {
      const mockInsert = mockSupabaseClient.from().insert;
      mockInsert.mockRejectedValueOnce(new Error('Audit failed'));

      // Should not throw
      await expect(
        credentialsService['createAuditTrail']('swaggystacks', 'CREATED')
      ).resolves.not.toThrow();
    });
  });
});