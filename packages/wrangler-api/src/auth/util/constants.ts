/**
 * OAuth configuration constants
 */

export const OAUTH = {
  /** Port for local OAuth callback server */
  CALLBACK_PORT: 8976,
  
  /** OAuth callback URL */
  CALLBACK_URL: 'http://localhost:8976/oauth/callback',
  
  /** Production client ID for Wrangler/Wrangler API */
  CLIENT_ID: '54d11594-84e4-41aa-b438-e81b8fa78ee7',
  
  /** Staging client ID for Wrangler/Wrangler API */
  STAGING_CLIENT_ID: '4b2ea6cc-9421-4761-874b-ce550e0e3def',
  
  /** Login success redirect URL */
  SUCCESS_URL: 'https://welcome.developers.workers.dev/wrangler-oauth-consent-granted',
  
  /** Login denied redirect URL */
  DENIED_URL: 'https://welcome.developers.workers.dev/wrangler-oauth-consent-denied',
  
  /** Timeout for OAuth login process in milliseconds */
  LOGIN_TIMEOUT: 120000, // 2 minutes
};

export const AUTH_DOMAINS = {
  /** Production authentication domain */
  PRODUCTION: 'dash.cloudflare.com',
  
  /** Staging authentication domain */
  STAGING: 'dash.staging.cloudflare.com',
};

export const ENV_VARIABLES = {
  /** Environment variable for Cloudflare API token */
  API_TOKEN: 'CLOUDFLARE_API_TOKEN',
  
  /** Legacy environment variable for Cloudflare API token */
  LEGACY_API_TOKEN: 'CF_API_TOKEN',
  
  /** Environment variable for Cloudflare account ID */
  ACCOUNT_ID: 'CLOUDFLARE_ACCOUNT_ID',
  
  /** Legacy environment variable for Cloudflare account ID */
  LEGACY_ACCOUNT_ID: 'CF_ACCOUNT_ID',
  
  /** Environment variable for Cloudflare global API key */
  API_KEY: 'CLOUDFLARE_API_KEY',
  
  /** Legacy environment variable for Cloudflare global API key */
  LEGACY_API_KEY: 'CF_API_KEY',
  
  /** Environment variable for Cloudflare email */
  EMAIL: 'CLOUDFLARE_EMAIL',
  
  /** Legacy environment variable for Cloudflare email */
  LEGACY_EMAIL: 'CF_EMAIL',
  
  /** Environment variable for Wrangler API environment (staging/production) */
  API_ENVIRONMENT: 'WRANGLER_API_ENVIRONMENT',
  
  /** Environment variable for custom client ID */
  CLIENT_ID: 'WRANGLER_CLIENT_ID',
  
  /** Environment variable for custom auth domain */
  AUTH_DOMAIN: 'WRANGLER_AUTH_DOMAIN',
  
  /** Environment variable for custom auth URL */
  AUTH_URL: 'WRANGLER_AUTH_URL',
  
  /** Environment variable for custom token URL */
  TOKEN_URL: 'WRANGLER_TOKEN_URL',
  
  /** Environment variable for custom revoke URL */
  REVOKE_URL: 'WRANGLER_REVOKE_URL',
};