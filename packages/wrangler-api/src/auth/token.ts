/**
 * API token-based authentication implementation
 */
import { fetch } from 'undici';
import { getCredentialsFromEnv } from './util/env';
import type { AuthResult } from '../types';
import type { ApiCredentials } from './types';

/**
 * The Cloudflare API base URL
 */
const CF_API_BASE = 'https://api.cloudflare.com/client/v4';

/**
 * Validates an API token by making a test request to the Cloudflare API
 * 
 * @param credentials The API credentials to validate
 * @returns Authentication result
 */
export async function validateApiCredentials(
  credentials: ApiCredentials
): Promise<AuthResult> {
  try {
    // Build request headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    
    if ('apiToken' in credentials) {
      headers['Authorization'] = `Bearer ${credentials.apiToken}`;
    } else if ('authKey' in credentials && 'authEmail' in credentials) {
      headers['X-Auth-Key'] = credentials.authKey;
      headers['X-Auth-Email'] = credentials.authEmail;
    } else {
      return {
        success: false,
        error: 'Invalid API credentials'
      };
    }
    
    // Make a request to verify the token/key
    const response = await fetch(`${CF_API_BASE}/user/tokens/verify`, {
      method: 'GET',
      headers
    });
    
    // Parse response
    const result = await response.json() as {
      success: boolean;
      errors: Array<{ code: number; message: string }>;
      messages: string[];
      result: { id: string; status: string };
    };
    
    if (!result.success) {
      const errorMessage = result.errors.length > 0
        ? result.errors[0].message
        : 'API token validation failed';
      
      return {
        success: false,
        error: errorMessage
      };
    }
    
    // If we get here, the token is valid
    return {
      success: true
    };
  } catch (error) {
    let errorMessage = 'Unknown error';
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    }
    
    return {
      success: false,
      error: `API token validation failed: ${errorMessage}`
    };
  }
}

/**
 * Creates an API token-based credential object
 * 
 * @param token API token
 * @returns API credentials
 */
export function createApiTokenCredentials(token: string): ApiCredentials {
  return { apiToken: token };
}

/**
 * Creates a Global API Key + Email credentials object
 * 
 * @param key The Global API Key
 * @param email The account email
 * @returns API credentials
 */
export function createGlobalKeyCredentials(
  key: string, 
  email: string
): ApiCredentials {
  return { authKey: key, authEmail: email };
}

/**
 * Check for environment variable credentials
 * 
 * @returns API credentials if found in environment
 */
export function getCredentialsFromEnvironment(): ApiCredentials | undefined {
  const { apiToken, apiKey, email } = getCredentialsFromEnv();
  
  if (apiToken) {
    return { apiToken };
  } else if (apiKey && email) {
    return { authKey: apiKey, authEmail: email };
  }
  
  return undefined;
}

/**
 * Validate credentials from environment
 * 
 * @returns Authentication result
 */
export async function validateEnvironmentCredentials(): Promise<AuthResult> {
  const credentials = getCredentialsFromEnvironment();
  
  if (!credentials) {
    return {
      success: false,
      error: 'No API credentials found in environment variables'
    };
  }
  
  return validateApiCredentials(credentials);
}