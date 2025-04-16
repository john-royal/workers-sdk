/**
 * Authentication functionality for Wrangler API
 * 
 * This module provides functions to authenticate with the Cloudflare API
 * using either OAuth or API tokens.
 */
import { loginWithOAuth, logoutOAuth, refreshOAuthToken } from './oauth';
import { createApiTokenCredentials, createGlobalKeyCredentials, validateApiCredentials } from './token';
import type { ApiCredentials, AuthMethod, AuthState } from './types';
import type { AuthResult } from '../types';

// Local authentication state
let authState: {
  credentials?: ApiCredentials;
  accountId?: string;
  method: AuthMethod;
  state?: AuthState;
} = {
  method: 'none'
};

/**
 * Set API token authentication
 * 
 * @param token The API token
 * @returns Authentication result
 */
export async function setApiToken(token: string): Promise<AuthResult> {
  if (!token) {
    return {
      success: false,
      error: 'API token is required'
    };
  }
  
  const credentials = createApiTokenCredentials(token);
  const result = await validateApiCredentials(credentials);
  
  if (result.success) {
    authState = {
      ...authState,
      credentials,
      method: 'api_token'
    };
  }
  
  return result;
}

/**
 * Set Global API Key authentication
 * 
 * @param key The Global API Key
 * @param email The account email
 * @returns Authentication result
 */
export async function setGlobalApiKey(key: string, email: string): Promise<AuthResult> {
  if (!key || !email) {
    return {
      success: false,
      error: 'API key and email are required'
    };
  }
  
  const credentials = createGlobalKeyCredentials(key, email);
  const result = await validateApiCredentials(credentials);
  
  if (result.success) {
    authState = {
      ...authState,
      credentials,
      method: 'email_key'
    };
  }
  
  return result;
}

/**
 * Set account ID to use for API calls
 * 
 * @param accountId The account ID
 */
export function setAccountId(accountId: string): void {
  authState.accountId = accountId;
}

/**
 * Get the current account ID
 * 
 * @returns The current account ID or undefined
 */
export function getAccountId(): string | undefined {
  return authState.accountId;
}

/**
 * Get the current authentication credentials
 * 
 * @returns The current API credentials or undefined
 */
export function getCredentials(): ApiCredentials | undefined {
  return authState.credentials;
}

/**
 * Check if the user is authenticated
 * 
 * @returns True if the user is authenticated
 */
export function isAuthenticated(): boolean {
  return authState.method !== 'none';
}

/**
 * Get the current authentication method
 * 
 * @returns The current authentication method
 */
export function getAuthMethod(): AuthMethod {
  return authState.method;
}

/**
 * Login with OAuth
 * 
 * @param options OAuth login options
 * @returns Authentication result
 */
export async function login(options?: {
  browser?: boolean;
  scopes?: string[];
  handleAuthUrl?: (url: string) => Promise<void>;
}): Promise<AuthResult> {
  // This will be integrated with Wrangler's login function
  const result = await loginWithOAuth(options);
  
  if (result.success) {
    authState = {
      ...authState,
      method: 'oauth',
      accountId: result.accountId
    };
  }
  
  return result;
}

/**
 * Logout from the current authentication
 * 
 * @returns Authentication result
 */
export async function logout(): Promise<AuthResult> {
  // This will be integrated with Wrangler's logout function
  if (authState.method === 'oauth') {
    const result = await logoutOAuth();
    
    if (result.success) {
      authState = {
        method: 'none'
      };
    }
    
    return result;
  }
  
  // For API token authentication, we just clear the local state
  authState = {
    method: 'none'
  };
  
  return {
    success: true
  };
}

/**
 * Reset authentication state
 */
export function resetAuth(): void {
  authState = {
    method: 'none'
  };
}