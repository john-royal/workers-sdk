/**
 * Environment variable utilities for authentication
 */
import { ENV_VARIABLES, AUTH_DOMAINS, OAUTH } from './constants';

/**
 * Gets an environment variable value
 * 
 * @param name Primary environment variable name
 * @param legacyName Optional legacy name for backward compatibility
 * @param defaultValue Optional default value if not found
 * @returns The environment variable value or default
 */
function getEnvVariable(
  name: string,
  legacyName?: string,
  defaultValue?: string | (() => string)
): string | undefined {
  // Check primary name
  const value = process.env[name];
  if (value !== undefined) {
    return value;
  }
  
  // Check legacy name if provided
  if (legacyName) {
    const legacyValue = process.env[legacyName];
    if (legacyValue !== undefined) {
      return legacyValue;
    }
  }
  
  // Return default value if provided
  if (defaultValue !== undefined) {
    return typeof defaultValue === 'function' ? defaultValue() : defaultValue;
  }
  
  return undefined;
}

/**
 * Gets the Cloudflare API environment (production or staging)
 */
export function getApiEnvironment(): 'production' | 'staging' {
  const env = getEnvVariable(ENV_VARIABLES.API_ENVIRONMENT);
  return env === 'staging' ? 'staging' : 'production';
}

/**
 * Gets the client ID for OAuth
 */
export function getClientId(): string {
  return getEnvVariable(
    ENV_VARIABLES.CLIENT_ID,
    undefined, 
    () => getApiEnvironment() === 'staging' ? OAUTH.STAGING_CLIENT_ID : OAUTH.CLIENT_ID
  ) || OAUTH.CLIENT_ID;
}

/**
 * Gets the auth domain
 */
export function getAuthDomain(): string {
  return getEnvVariable(
    ENV_VARIABLES.AUTH_DOMAIN,
    undefined,
    () => getApiEnvironment() === 'staging' ? AUTH_DOMAINS.STAGING : AUTH_DOMAINS.PRODUCTION
  ) || AUTH_DOMAINS.PRODUCTION;
}

/**
 * Gets the OAuth authorization URL
 */
export function getAuthUrl(): string {
  return getEnvVariable(
    ENV_VARIABLES.AUTH_URL,
    undefined,
    () => `https://${getAuthDomain()}/oauth2/auth`
  ) || `https://${getAuthDomain()}/oauth2/auth`;
}

/**
 * Gets the OAuth token URL
 */
export function getTokenUrl(): string {
  return getEnvVariable(
    ENV_VARIABLES.TOKEN_URL,
    undefined,
    () => `https://${getAuthDomain()}/oauth2/token`
  ) || `https://${getAuthDomain()}/oauth2/token`;
}

/**
 * Gets the OAuth token revocation URL
 */
export function getRevokeUrl(): string {
  return getEnvVariable(
    ENV_VARIABLES.REVOKE_URL,
    undefined,
    () => `https://${getAuthDomain()}/oauth2/revoke`
  ) || `https://${getAuthDomain()}/oauth2/revoke`;
}

/**
 * Gets the Cloudflare API token from environment
 */
export function getApiToken(): string | undefined {
  return getEnvVariable(ENV_VARIABLES.API_TOKEN, ENV_VARIABLES.LEGACY_API_TOKEN);
}

/**
 * Gets the Cloudflare account ID from environment
 */
export function getAccountId(): string | undefined {
  return getEnvVariable(ENV_VARIABLES.ACCOUNT_ID, ENV_VARIABLES.LEGACY_ACCOUNT_ID);
}

/**
 * Gets the Cloudflare global API key from environment
 */
export function getApiKey(): string | undefined {
  return getEnvVariable(ENV_VARIABLES.API_KEY, ENV_VARIABLES.LEGACY_API_KEY);
}

/**
 * Gets the Cloudflare email from environment
 */
export function getEmail(): string | undefined {
  return getEnvVariable(ENV_VARIABLES.EMAIL, ENV_VARIABLES.LEGACY_EMAIL);
}

/**
 * Get API credentials from environment variables
 */
export function getCredentialsFromEnv(): {
  apiToken?: string;
  apiKey?: string;
  email?: string;
  accountId?: string;
} {
  return {
    apiToken: getApiToken(),
    apiKey: getApiKey(),
    email: getEmail(),
    accountId: getAccountId(),
  };
}