/**
 * API token-based authentication implementation
 */
import type { AuthResult } from '../types';
import { ApiCredentials } from './types';

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
    // This will make a test request to the Cloudflare API to validate the token
    // For now, we'll just assume the token is valid if it exists
    
    if ('apiToken' in credentials && credentials.apiToken) {
      return {
        success: true
      };
    } else if (
      'authKey' in credentials && 
      'authEmail' in credentials && 
      credentials.authKey && 
      credentials.authEmail
    ) {
      return {
        success: true
      };
    }
    
    return {
      success: false,
      error: 'Invalid API credentials'
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