/**
 * Wrangler API - Programmatic interface to Cloudflare Workers functionality
 */

// Core API
export * from './wrangler-api';

// Type definitions
export * from './types';
export { 
  ApiCredentials, 
  Scope, 
  AuthMethod,
  AccessToken,
  RefreshToken 
} from './auth/types';

// Authentication utilities
export {
  setApiToken,
  setGlobalApiKey,
  setAccountId,
  getAccountId,
  getCredentials,
  isAuthenticated,
  getAuthMethod,
  login,
  logout,
  refreshAuth as refreshToken,
  resetAuth,
  authFromEnvironment
} from './auth';