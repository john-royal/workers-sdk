/**
 * Configuration for deploying a Worker
 */
export interface DeployOptions {
  /**
   * Path to the Worker script or directory
   */
  script: string;
  
  /**
   * Name of the Worker
   */
  name?: string;
  
  /**
   * Path to wrangler.toml config file
   */
  config?: string;
  
  /**
   * Environment to deploy to
   */
  env?: string;
  
  /**
   * Compatibility date for the Worker
   */
  compatibilityDate?: string;
  
  /**
   * Compatibility flags for the Worker
   */
  compatibilityFlags?: string[];
  
  /**
   * Variables to bind to the Worker
   */
  vars?: Record<string, string>;
  
  /**
   * Account ID to deploy to
   */
  accountId?: string;
  
  /**
   * Whether to minify the Worker code
   */
  minify?: boolean;
  
  /**
   * Whether to upload source maps
   */
  sourceMaps?: boolean;
  
  /**
   * Whether to deploy the Worker to workers.dev
   */
  workersDev?: boolean;
  
  /**
   * Routes to assign to the Worker
   */
  routes?: string[];
}

/**
 * Configuration for running a Worker in dev mode
 */
export interface DevOptions {
  /**
   * Path to the Worker script or directory
   */
  script: string;
  
  /**
   * Path to wrangler.toml config file
   */
  config?: string;
  
  /**
   * Local port to listen on
   */
  port?: number;
  
  /**
   * Local IP to listen on
   */
  ip?: string;
  
  /**
   * Whether to inspect the Worker with DevTools
   */
  inspect?: boolean;
  
  /**
   * Environment to use
   */
  env?: string;
  
  /**
   * Variables to bind to the Worker
   */
  vars?: Record<string, string>;
  
  /**
   * Whether to enable local persistence
   */
  localPersistence?: boolean;
  
  /**
   * Compatibility date for the Worker
   */
  compatibilityDate?: string;
  
  /**
   * Compatibility flags for the Worker
   */
  compatibilityFlags?: string[];
}

/**
 * Configuration for initializing a new Worker project
 */
export interface InitOptions {
  /**
   * Directory to initialize the Worker in
   */
  directory: string;
  
  /**
   * Name of the Worker
   */
  name?: string;
  
  /**
   * Type of Worker to create
   */
  type?: 'javascript' | 'typescript' | 'rust';
  
  /**
   * Whether to initialize a git repository
   */
  git?: boolean;
}

/**
 * Result of successful authentication
 */
export interface AuthResult {
  /**
   * Whether authentication was successful
   */
  success: boolean;
  
  /**
   * Account ID if authentication was successful
   */
  accountId?: string;
  
  /**
   * Error message if authentication failed
   */
  error?: string;
}

/**
 * Configuration for secrets management
 */
export interface SecretOptions {
  /**
   * Name of the secret
   */
  name: string;
  
  /**
   * Value of the secret
   */
  value?: string;
  
  /**
   * Worker name to associate the secret with
   */
  script?: string;
  
  /**
   * Environment to associate the secret with
   */
  env?: string;
}

/**
 * Result of a deployment operation
 */
export interface DeployResult {
  /**
   * Whether the deployment was successful
   */
  success: boolean;
  
  /**
   * ID of the deployment
   */
  id?: string;
  
  /**
   * URLs where the Worker is available
   */
  urls?: string[];
  
  /**
   * Error message if deployment failed
   */
  error?: string;
}

/**
 * Configuration for Durable Object operations
 */
export interface DurableObjectOptions {
  /**
   * Name of the Worker script
   */
  script: string;
  
  /**
   * Environment of the Worker
   */
  env?: string;
  
  /**
   * Class name of the Durable Object
   */
  className?: string;
  
  /**
   * ID of the Durable Object instance
   */
  id?: string;
}

/**
 * Configuration for KV namespace operations
 */
export interface KVNamespaceOptions {
  /**
   * Name of the KV namespace
   */
  namespace: string;
  
  /**
   * ID of the KV namespace
   */
  id?: string;
}

/**
 * Result of a KV operation
 */
export interface KVResult {
  /**
   * Whether the operation was successful
   */
  success: boolean;
  
  /**
   * ID of the namespace if created/retrieved
   */
  id?: string;
  
  /**
   * Keys if listing keys
   */
  keys?: string[];
  
  /**
   * Value if getting a key
   */
  value?: string;
  
  /**
   * Error message if operation failed
   */
  error?: string;
}