import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WranglerAPI } from './wrangler-api';

// Mock auth module
vi.mock('./auth', () => ({
  setApiToken: vi.fn().mockResolvedValue({ success: true }),
  setAccountId: vi.fn(),
  getAccountId: vi.fn().mockReturnValue('mocked-account-id'),
  isAuthenticated: vi.fn().mockReturnValue(true),
  login: vi.fn().mockResolvedValue({ success: true, accountId: 'test-account' }),
  logout: vi.fn().mockResolvedValue({ success: true })
}));

// Mock implementation modules
vi.mock('./implementations/deploy', () => ({
  deployWorker: vi.fn().mockResolvedValue({ 
    success: true, 
    id: 'test-deployment-id',
    urls: ['https://test-worker.example.workers.dev']
  })
}));

vi.mock('./implementations/dev', () => ({
  startDevServer: vi.fn().mockResolvedValue(async () => { /* mock stop function */ })
}));

describe('WranglerAPI', () => {
  let api: WranglerAPI;

  beforeEach(() => {
    api = new WranglerAPI();
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create a WranglerAPI instance', () => {
      expect(api).toBeInstanceOf(WranglerAPI);
    });

    it('should initialize with credentials if provided', () => {
      const setApiToken = vi.mocked(require('./auth').setApiToken);
      const setAccountId = vi.mocked(require('./auth').setAccountId);
      
      new WranglerAPI({
        apiToken: 'test-token',
        accountId: 'test-account'
      });
      
      expect(setApiToken).toHaveBeenCalledWith('test-token');
      expect(setAccountId).toHaveBeenCalledWith('test-account');
    });
  });

  describe('setAuth', () => {
    it('should set authentication credentials', async () => {
      const setApiToken = vi.mocked(require('./auth').setApiToken);
      const setAccountId = vi.mocked(require('./auth').setAccountId);
      
      const result = await api.setAuth({
        apiToken: 'test-token',
        accountId: 'test-account'
      });
      
      expect(result.success).toBe(true);
      expect(setApiToken).toHaveBeenCalledWith('test-token');
      expect(setAccountId).toHaveBeenCalledWith('test-account');
    });
  });

  describe('login', () => {
    it('should call auth login method', async () => {
      const login = vi.mocked(require('./auth').login);
      
      await api.login({
        browser: true,
        scopes: ['workers:write']
      });
      
      expect(login).toHaveBeenCalledWith({
        browser: true,
        scopes: ['workers:write']
      });
    });
  });

  describe('logout', () => {
    it('should call auth logout method', async () => {
      const logout = vi.mocked(require('./auth').logout);
      
      await api.logout();
      
      expect(logout).toHaveBeenCalled();
    });
  });

  describe('isAuthenticated', () => {
    it('should check if authenticated', () => {
      const isAuthenticated = vi.mocked(require('./auth').isAuthenticated);
      
      api.isAuthenticated();
      
      expect(isAuthenticated).toHaveBeenCalled();
    });
  });

  describe('getAccountId', () => {
    it('should get the account ID', () => {
      const getAccountId = vi.mocked(require('./auth').getAccountId);
      
      api.getAccountId();
      
      expect(getAccountId).toHaveBeenCalled();
    });
  });

  describe('deploy', () => {
    it('should deploy a worker', async () => {
      const deployWorker = vi.mocked(require('./implementations/deploy').deployWorker);
      
      await api.deploy({
        script: 'test-worker.js',
        name: 'test-worker'
      });
      
      expect(deployWorker).toHaveBeenCalledWith({
        script: 'test-worker.js',
        name: 'test-worker',
        accountId: 'mocked-account-id'
      });
    });

    it('should use provided account ID over the default', async () => {
      const deployWorker = vi.mocked(require('./implementations/deploy').deployWorker);
      
      await api.deploy({
        script: 'test-worker.js',
        name: 'test-worker',
        accountId: 'provided-account-id'
      });
      
      expect(deployWorker).toHaveBeenCalledWith({
        script: 'test-worker.js',
        name: 'test-worker',
        accountId: 'provided-account-id' // Should use this, not the mocked one
      });
    });
  });

  describe('dev', () => {
    it('should start a dev server', async () => {
      const startDevServer = vi.mocked(require('./implementations/dev').startDevServer);
      
      await api.dev({
        script: 'test-worker.js'
      });
      
      expect(startDevServer).toHaveBeenCalledWith({
        script: 'test-worker.js'
      });
    });
  });

  describe('placeholder methods', () => {
    it('should have unimplemented methods returning appropriate placeholders', async () => {
      // Test init
      await expect(api.init({ directory: 'test' })).resolves.toBeUndefined();
      
      // Test secret
      const secretResult = await api.secret('list', { name: 'TEST_SECRET' });
      expect(secretResult.success).toBe(false);
      expect(secretResult.error).toBe('Not implemented yet');
      
      // Test KV methods
      const kvResult = await api.kv.listNamespaces();
      expect(kvResult.success).toBe(false);
      expect(kvResult.error).toBe('Not implemented yet');
      
      // Test Durable Objects methods
      const doResult = await api.durableObjects.list({ script: 'test-worker' });
      expect(doResult.success).toBe(false);
      expect(doResult.error).toBe('Not implemented yet');
    });
  });
});