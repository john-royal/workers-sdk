import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  setApiToken,
  setGlobalApiKey,
  setAccountId,
  getAccountId,
  getCredentials,
  isAuthenticated,
  getAuthMethod,
  login,
  logout,
  resetAuth
} from './index';

// Mock the token validation function
vi.mock('./token', () => ({
  validateApiCredentials: vi.fn().mockResolvedValue({ success: true }),
  createApiTokenCredentials: vi.fn(token => ({ apiToken: token })),
  createGlobalKeyCredentials: vi.fn((key, email) => ({ authKey: key, authEmail: email }))
}));

// Mock the OAuth login function
vi.mock('./oauth', () => ({
  loginWithOAuth: vi.fn().mockResolvedValue({ 
    success: true,
    accountId: 'test-account-id' 
  }),
  logoutOAuth: vi.fn().mockResolvedValue({ success: true }),
  refreshOAuthToken: vi.fn().mockResolvedValue({ success: true })
}));

describe('Authentication', () => {
  beforeEach(() => {
    // Reset auth state before each test
    resetAuth();
  });

  describe('API Token Auth', () => {
    it('should set API token authentication', async () => {
      const result = await setApiToken('test-token');
      expect(result.success).toBe(true);
      expect(isAuthenticated()).toBe(true);
      expect(getAuthMethod()).toBe('api_token');
      expect(getCredentials()).toEqual({ apiToken: 'test-token' });
    });

    it('should require a token value', async () => {
      const result = await setApiToken('');
      expect(result.success).toBe(false);
      expect(isAuthenticated()).toBe(false);
    });
  });

  describe('Global API Key Auth', () => {
    it('should set global API key authentication', async () => {
      const result = await setGlobalApiKey('test-key', 'test@example.com');
      expect(result.success).toBe(true);
      expect(isAuthenticated()).toBe(true);
      expect(getAuthMethod()).toBe('email_key');
      expect(getCredentials()).toEqual({ 
        authKey: 'test-key', 
        authEmail: 'test@example.com' 
      });
    });

    it('should require both key and email', async () => {
      const result = await setGlobalApiKey('test-key', '');
      expect(result.success).toBe(false);
      expect(isAuthenticated()).toBe(false);
    });
  });

  describe('Account ID Management', () => {
    it('should set and get account ID', () => {
      setAccountId('test-account-id');
      expect(getAccountId()).toBe('test-account-id');
    });
  });

  describe('OAuth Login', () => {
    it('should login with OAuth', async () => {
      const result = await login();
      expect(result.success).toBe(true);
      expect(isAuthenticated()).toBe(true);
      expect(getAuthMethod()).toBe('oauth');
      expect(getAccountId()).toBe('test-account-id');
    });
  });

  describe('Logout', () => {
    it('should logout from API token auth', async () => {
      await setApiToken('test-token');
      expect(isAuthenticated()).toBe(true);
      
      const result = await logout();
      expect(result.success).toBe(true);
      expect(isAuthenticated()).toBe(false);
      expect(getCredentials()).toBeUndefined();
    });

    it('should logout from OAuth auth', async () => {
      await login();
      expect(isAuthenticated()).toBe(true);
      
      const result = await logout();
      expect(result.success).toBe(true);
      expect(isAuthenticated()).toBe(false);
    });
  });

  describe('Reset Auth', () => {
    it('should reset authentication state', async () => {
      await setApiToken('test-token');
      expect(isAuthenticated()).toBe(true);
      
      resetAuth();
      expect(isAuthenticated()).toBe(false);
      expect(getCredentials()).toBeUndefined();
      expect(getAccountId()).toBeUndefined();
    });
  });
});