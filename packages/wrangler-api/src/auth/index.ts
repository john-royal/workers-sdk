/**
 * Authentication functionality for Wrangler API
 * 
 * This module provides functions to authenticate with the Cloudflare API
 * using either OAuth or API tokens.
 */
import { 
  loginWithOAuth, 
  logoutOAuth, 
  refreshOAuthToken, 
  isAccessTokenExpired,
  getAccessToken, 
  getRefreshToken, 
  getOAuthScopes,
  clearOAuthState,
  restoreOAuthSession
} from './oauth';

import {
  validateApiCredentials,
  createApiTokenCredentials,
  createGlobalKeyCredentials,
  getCredentialsFromEnvironment,
  validateEnvironmentCredentials
} from './token';

import { getAccountId as getEnvAccountId } from './util/env';

import type { ApiCredentials, AuthMethod, AuthState, Scope, AccessToken, RefreshToken } from './types';
import type { AuthResult } from '../types';

// Local authentication state
let authState: {
  credentials?: ApiCredentials;
  accountId?: string;
  method: AuthMethod;
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
    // Clear any OAuth state
    clearOAuthState();
    
    // Update auth state
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
    // Clear any OAuth state
    clearOAuthState();
    
    // Update auth state
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
  return authState.accountId || getEnvAccountId();
}

/**
 * Get the current authentication credentials
 * 
 * @returns The current API credentials or undefined
 */
export function getCredentials(): ApiCredentials | undefined {
  return authState.credentials || getCredentialsFromEnvironment();
}

/**
 * Get the current API token (if using token authentication)
 * 
 * @returns The API token or undefined
 */
export function getApiToken(): { value: string } | undefined {
  const credentials = getCredentials();
  
  if (credentials && 'apiToken' in credentials) {
    return { value: credentials.apiToken };
  }
  
  return undefined;
}

/**
 * Check if the user is authenticated
 * 
 * @returns True if the user is authenticated
 */
export function isAuthenticated(): boolean {
  // Check for credentials in the auth state
  if (authState.method !== 'none') {
    return true;
  }
  
  // Check for OAuth token
  if (getAccessToken() && !isAccessTokenExpired()) {
    return true;
  }
  
  // Check for environment variables as a last resort
  return !!getCredentialsFromEnvironment();
}

/**
 * Get the current access token
 * 
 * @returns The access token or undefined
 */
export { getAccessToken } from './oauth';

/**
 * Get the current refresh token
 * 
 * @returns The refresh token or undefined
 */
export { getRefreshToken } from './oauth';

/**
 * Get the current authentication method
 * 
 * @returns The current authentication method
 */
export function getAuthMethod(): AuthMethod {
  // If we have an explicit auth method, return it
  if (authState.method !== 'none') {
    return authState.method;
  }
  
  // Check if OAuth is being used
  if (getAccessToken()) {
    return 'oauth';
  }
  
  // Check for environment variables
  const envCreds = getCredentialsFromEnvironment();
  if (envCreds) {
    return 'apiToken' in envCreds ? 'api_token' : 'email_key';
  }
  
  return 'none';
}

/**
 * Try to authenticate using environment variables
 * 
 * @returns Authentication result
 */
export async function authFromEnvironment(): Promise<AuthResult> {
  // Check for environment credentials
  const result = await validateEnvironmentCredentials();
  
  if (result.success) {
    authState = {
      ...authState,
      credentials: getCredentialsFromEnvironment(),
      method: 'api_token' // This is simplified; could be email_key too
    };
  }
  
  return result;
}

/**
 * Login with OAuth
 * 
 * @param options OAuth login options
 * @returns Authentication result
 */
export async function login(options?: {
  browser?: boolean;
  scopes?: Scope[];
  handleAuthUrl?: (url: string) => Promise<void>;
  onComplete?: (result: AuthResult) => void;
}): Promise<AuthResult> {
  // Clear existing auth state first
  resetAuth();
  
  // Call OAuth login implementation
  const result = await loginWithOAuth(options);
  
  // Update auth state if successful
  if (result.success) {
    authState = {
      ...authState,
      method: 'oauth'
    };
    
    // If we know the account ID from the OAuth flow, store it
    if (result.accountId) {
      authState.accountId = result.accountId;
    }
  }
  
  return result;
}

/**
 * Try to refresh OAuth token if it has expired
 * 
 * @returns True if refresh was successful
 */
export async function refreshAuth(): Promise<boolean> {
  // Only relevant for OAuth auth
  if (getAuthMethod() !== 'oauth') {
    return false;
  }
  
  // Check if token is expired
  if (!isAccessTokenExpired()) {
    return true; // Token is still valid
  }
  
  // Try to refresh the token
  const result = await refreshOAuthToken();
  return result.success;
}

/**
 * Restore an OAuth session from saved tokens
 * 
 * This is useful for restoring a previously authenticated session
 * or for using tokens obtained from another source.
 * 
 * @param accessToken The OAuth access token
 * @param refreshToken The OAuth refresh token
 * @param expiryDate Optional ISO date string for token expiry
 * @param scopes Optional array of OAuth scopes
 * @returns Authentication result
 */
export async function restoreSession(
  accessToken: string,
  refreshToken: string,
  expiryDate?: string,
  scopes?: string[]
): Promise<AuthResult> {
  // Clear any existing auth state first
  resetAuth();
  
  // Call OAuth restoration implementation
  const result = await restoreOAuthSession(accessToken, refreshToken, expiryDate, scopes);
  
  // Update auth state if successful
  if (result.success) {
    authState = {
      ...authState,
      method: 'oauth'
    };
    
    // If we know the account ID from the result, store it
    if (result.accountId) {
      authState.accountId = result.accountId;
    }
  }
  
  return result;
}

/**
 * Logout from the current authentication
 * 
 * @returns Authentication result
 */
export async function logout(): Promise<AuthResult> {
  // Handle based on auth method
  switch (getAuthMethod()) {
    case 'oauth':
      const result = await logoutOAuth();
      
      // Clear auth state
      resetAuth();
      
      return result;
      
    case 'api_token':
    case 'email_key':
      // Just clear the auth state
      resetAuth();
      return { success: true };
      
    default:
      return { success: true };
  }
}

/**
 * Reset authentication state
 */
export function resetAuth(): void {
  // Clear OAuth state
  clearOAuthState();
  
  // Reset auth state
  authState = {
    method: 'none'
  };
}

/**
 * Get binding credential for API requests
 * 
 * This function returns the authentication credential in the format
 * required for Cloudflare API requests. It handles different auth methods.
 * 
 * @returns The binding credential or undefined if not authenticated
 */
export async function getBindingCredential(): Promise<{ token?: string; apiToken?: string; accountId?: string } | undefined> {
  // Try to refresh OAuth token if needed
  if (getAuthMethod() === 'oauth' && isAccessTokenExpired()) {
    const refreshed = await refreshAuth();
    if (!refreshed) {
      // Failed to refresh, no valid credentials
      return undefined;
    }
  }
  
  // Handle different auth methods
  switch (getAuthMethod()) {
    case 'oauth':
      const accessToken = getAccessToken();
      if (!accessToken) return undefined;
      
      return {
        token: accessToken,
        accountId: getAccountId()
      };
      
    case 'api_token':
    case 'email_key':
      const credentials = getCredentials();
      if (!credentials) return undefined;
      
      if ('apiToken' in credentials) {
        return {
          apiToken: credentials.apiToken,
          accountId: getAccountId()
        };
      } else if ('apiKey' in credentials) {
        // This would work differently in full implementation
        // as Global API Keys require a different auth mechanism
        return {
          token: credentials.apiKey, // This is simplified
          accountId: getAccountId()
        };
      }
      return undefined;
      
    default:
      return undefined;
  }
}