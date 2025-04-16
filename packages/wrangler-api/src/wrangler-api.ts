import { deployWorker } from './implementations/deploy';
import { startDevServer } from './implementations/dev';
import * as auth from './auth';

import type {
  DeployOptions,
  DeployResult,
  DevOptions,
  InitOptions,
  AuthResult,
  SecretOptions,
  DurableObjectOptions,
  KVNamespaceOptions,
  KVResult
} from './types';

/**
 * Main class for interacting with Wrangler programmatically
 */
export class WranglerAPI {
  /**
   * Create a new WranglerAPI instance
   * @param options Configuration options
   */
  constructor(options: {
    accountId?: string;
    apiToken?: string;
  } = {}) {
    if (options.apiToken) {
      // Set up auth with API token if provided
      auth.setApiToken(options.apiToken).catch(() => {
        // Silently fail, since this is just initialization
      });
    }
    
    if (options.accountId) {
      auth.setAccountId(options.accountId);
    }
  }

  /**
   * Set credentials for API authentication
   * @param options Authentication options
   */
  async setAuth(options: { 
    apiToken?: string, 
    accountId?: string
  }): Promise<AuthResult> {
    let authResult: AuthResult = { success: true };
    
    if (options.apiToken) {
      authResult = await auth.setApiToken(options.apiToken);
      if (!authResult.success) {
        return authResult;
      }
    }
    
    if (options.accountId) {
      auth.setAccountId(options.accountId);
    }
    
    return authResult;
  }

  /**
   * Login to Cloudflare using OAuth
   * @param options OAuth login options
   * @returns Authentication result
   */
  async login(options?: {
    browser?: boolean;
    scopes?: string[];
    handleAuthUrl?: (url: string) => Promise<void>;
  }): Promise<AuthResult> {
    return auth.login(options);
  }

  /**
   * Logout from Cloudflare authentication
   * @returns Authentication result
   */
  async logout(): Promise<AuthResult> {
    return auth.logout();
  }

  /**
   * Check if currently authenticated
   * @returns True if authenticated
   */
  isAuthenticated(): boolean {
    return auth.isAuthenticated();
  }

  /**
   * Get current account ID
   * @returns Account ID if set
   */
  getAccountId(): string | undefined {
    return auth.getAccountId();
  }

  /**
   * Deploy a Worker to Cloudflare
   * @param options Deployment options
   * @returns Deployment result
   */
  async deploy(options: DeployOptions): Promise<DeployResult> {
    // Include authentication details from this instance
    const deployOptions: DeployOptions = {
      ...options,
      accountId: options.accountId || this.getAccountId(),
    };
    
    return deployWorker(deployOptions);
  }

  /**
   * Start a local development server for a Worker
   * @param options Development options
   * @returns A function to stop the dev server
   */
  async dev(options: DevOptions): Promise<() => Promise<void>> {
    return startDevServer(options);
  }

  /**
   * Initialize a new Worker project
   * @param options Initialization options
   */
  async init(options: InitOptions): Promise<void> {
    // This will be implemented to use Wrangler's init functionality
    // For now, just a placeholder
  }

  /**
   * Create, update, or delete a secret
   * @param action Action to perform
   * @param options Secret options
   */
  async secret(
    action: 'put' | 'delete' | 'list',
    options: SecretOptions
  ): Promise<{ success: boolean; secrets?: string[]; error?: string }> {
    // This will be implemented to use Wrangler's secret functionality
    // For now, return a placeholder
    return {
      success: false,
      error: 'Not implemented yet'
    };
  }

  /**
   * Interact with KV namespaces
   */
  kv = {
    /**
     * List all KV namespaces
     */
    listNamespaces: async (): Promise<KVResult> => {
      // Implementation will be added later
      return {
        success: false,
        error: 'Not implemented yet'
      };
    },

    /**
     * Create a new KV namespace
     * @param options KV namespace options
     */
    createNamespace: async (options: KVNamespaceOptions): Promise<KVResult> => {
      // Implementation will be added later
      return {
        success: false,
        error: 'Not implemented yet'
      };
    },

    /**
     * Delete a KV namespace
     * @param options KV namespace options
     */
    deleteNamespace: async (options: KVNamespaceOptions): Promise<KVResult> => {
      // Implementation will be added later
      return {
        success: false,
        error: 'Not implemented yet'
      };
    },

    /**
     * List keys in a KV namespace
     * @param options KV namespace options
     */
    listKeys: async (options: KVNamespaceOptions): Promise<KVResult> => {
      // Implementation will be added later
      return {
        success: false,
        error: 'Not implemented yet'
      };
    },

    /**
     * Get a value from a KV namespace
     * @param options KV namespace options
     * @param key Key to get
     */
    getValue: async (options: KVNamespaceOptions, key: string): Promise<KVResult> => {
      // Implementation will be added later
      return {
        success: false,
        error: 'Not implemented yet'
      };
    },

    /**
     * Put a value into a KV namespace
     * @param options KV namespace options
     * @param key Key to put
     * @param value Value to put
     */
    putValue: async (options: KVNamespaceOptions, key: string, value: string): Promise<KVResult> => {
      // Implementation will be added later
      return {
        success: false,
        error: 'Not implemented yet'
      };
    },

    /**
     * Delete a value from a KV namespace
     * @param options KV namespace options
     * @param key Key to delete
     */
    deleteValue: async (options: KVNamespaceOptions, key: string): Promise<KVResult> => {
      // Implementation will be added later
      return {
        success: false,
        error: 'Not implemented yet'
      };
    }
  };

  /**
   * Interact with Durable Objects
   */
  durableObjects = {
    /**
     * List all Durable Objects
     * @param options Durable Object options
     */
    list: async (options: DurableObjectOptions): Promise<{
      success: boolean;
      objects?: { name: string; className: string }[];
      error?: string;
    }> => {
      // Implementation will be added later
      return {
        success: false,
        error: 'Not implemented yet'
      };
    },

    /**
     * Get information about a specific Durable Object
     * @param options Durable Object options
     */
    get: async (options: DurableObjectOptions): Promise<{
      success: boolean;
      object?: { name: string; className: string };
      error?: string;
    }> => {
      // Implementation will be added later
      return {
        success: false,
        error: 'Not implemented yet'
      };
    }
  };
}

// Create a singleton instance for easy imports
export const wranglerApi = new WranglerAPI();