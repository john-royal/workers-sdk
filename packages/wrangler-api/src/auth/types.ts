/**
 * Types for authentication components
 */

/**
 * OAuth scope for Cloudflare API access
 * These are based on Wrangler's scope definitions
 */
export type Scope = 
  | 'account:read'
  | 'user:read'
  | 'workers:write'
  | 'workers_kv:write'
  | 'workers_routes:write'
  | 'workers_scripts:write'
  | 'workers_tail:read'
  | 'd1:write'
  | 'pages:write'
  | 'zone:read'
  | 'ssl_certs:write'
  | 'ai:write'
  | 'queues:write'
  | 'pipelines:write'
  | 'secrets_store:write'
  | 'cloudchamber:write';

/**
 * Authentication method used
 */
export type AuthMethod = 'oauth' | 'api_token' | 'email_key' | 'none';

/**
 * API credentials from API token or from Global API Key + Email
 */
export type ApiCredentials =
  | {
      apiToken: string;
    }
  | {
      authKey: string;
      authEmail: string;
    };

/**
 * Information for an access token
 */
export interface AccessToken {
  value: string;
  expiry: string;
}

/**
 * Information for a refresh token
 */
export interface RefreshToken {
  value: string;
}

/**
 * The complete auth context with tokens
 */
export interface AccessContext {
  token?: AccessToken;
  scopes?: Scope[];
  refreshToken?: RefreshToken;
}

/**
 * Configuration stored in the user auth config file
 */
export interface UserAuthConfig {
  oauth_token?: string;
  refresh_token?: string;
  expiration_time?: string;
  scopes?: string[];
  /** @deprecated - from Wrangler v1 */
  api_token?: string;
}

/**
 * Auth tokens used for API requests
 */
export interface AuthTokens {
  accessToken?: AccessToken;
  refreshToken?: RefreshToken;
  scopes?: Scope[];
  /** @deprecated */
  apiToken?: string;
}

/**
 * Auth state kept in memory
 */
export interface AuthState extends AuthTokens {
  authorizationCode?: string;
  codeChallenge?: string;
  codeVerifier?: string;
  hasAuthCodeBeenExchangedForAccessToken?: boolean;
  stateQueryParam?: string;
}

/**
 * Auth environment configuration
 */
export interface AuthEnvironment {
  /**
   * Client ID for OAuth
   */
  clientId: string;
  
  /**
   * Auth domain (e.g., dash.cloudflare.com)
   */
  authDomain: string;
  
  /**
   * Auth URL for OAuth
   */
  authUrl: string;
  
  /**
   * Token URL for OAuth
   */
  tokenUrl: string;
  
  /**
   * Revoke URL for OAuth
   */
  revokeUrl: string;
}