/**
 * Binding types for Workers
 */
export type BindingType = 
  | 'kv_namespace'
  | 'r2_bucket'
  | 'durable_object'
  | 'queue'
  | 'service'
  | 'd1_database'
  | 'vectorize_index'
  | 'hyperdrive'
  | 'ai'
  | 'analytics_engine'
  | 'browser'
  | 'dispatch_namespace'
  | 'mtls_certificate'
  | 'secret'
  | 'environment_variable'
  | 'wasm_module'
  | 'text_blob'
  | 'data_blob';

/**
 * Generic binding interface
 */
export interface Binding {
  /**
   * Name of the binding (how it's accessed in the Worker code)
   */
  name: string;
  
  /**
   * Type of binding
   */
  type: BindingType;
}

/**
 * KV namespace binding
 */
export interface KVNamespaceBinding extends Binding {
  type: 'kv_namespace';
  
  /**
   * ID of the KV namespace
   */
  id: string;
}

/**
 * R2 bucket binding
 */
export interface R2BucketBinding extends Binding {
  type: 'r2_bucket';
  
  /**
   * Name of the R2 bucket
   */
  bucket_name: string;
  
  /**
   * Jurisdiction for the R2 bucket
   */
  jurisdiction?: string;
}

/**
 * Durable Object binding
 */
export interface DurableObjectBinding extends Binding {
  type: 'durable_object';
  
  /**
   * Class name of the Durable Object
   */
  class_name: string;
  
  /**
   * External script name, if the Durable Object is defined in another Worker
   */
  script_name?: string;
  
  /**
   * Environment of the script, if using environments
   */
  environment?: string;
}

/**
 * Queue binding
 */
export interface QueueBinding extends Binding {
  type: 'queue';
  
  /**
   * Queue name
   */
  queue_name: string;
}

/**
 * Service binding
 */
export interface ServiceBinding extends Binding {
  type: 'service';
  
  /**
   * Service name
   */
  service: string;
  
  /**
   * Environment of the service
   */
  environment?: string;
}

/**
 * D1 database binding
 */
export interface D1DatabaseBinding extends Binding {
  type: 'd1_database';
  
  /**
   * Database ID
   */
  database_id: string;
  
  /**
   * Database name
   */
  database_name?: string;
}

/**
 * Vectorize index binding
 */
export interface VectorizeBinding extends Binding {
  type: 'vectorize_index';
  
  /**
   * Vectorize index ID
   */
  index_name: string;
}

/**
 * Hyperdrive binding
 */
export interface HyperdriveBinding extends Binding {
  type: 'hyperdrive';
  
  /**
   * Hyperdrive ID
   */
  id: string;
}

/**
 * AI binding
 */
export interface AIBinding extends Binding {
  type: 'ai';
}

/**
 * Analytics Engine binding
 */
export interface AnalyticsEngineBinding extends Binding {
  type: 'analytics_engine';
  
  /**
   * Dataset name
   */
  dataset?: string;
}

/**
 * Browser rendering binding
 */
export interface BrowserBinding extends Binding {
  type: 'browser';
}

/**
 * Dispatch namespace binding
 */
export interface DispatchNamespaceBinding extends Binding {
  type: 'dispatch_namespace';
  
  /**
   * Namespace ID
   */
  namespace: string;
}

/**
 * mTLS certificate binding
 */
export interface MTLSCertificateBinding extends Binding {
  type: 'mtls_certificate';
  
  /**
   * Certificate ID
   */
  certificate_id: string;
}

/**
 * Environment variable binding
 */
export interface EnvironmentVariableBinding extends Binding {
  type: 'environment_variable';
  
  /**
   * Value of the environment variable
   */
  value: string;
}

/**
 * WASM module binding
 */
export interface WasmModuleBinding extends Binding {
  type: 'wasm_module';
  
  /**
   * Path to the WASM module
   */
  path: string;
}

/**
 * Text blob binding
 */
export interface TextBlobBinding extends Binding {
  type: 'text_blob';
  
  /**
   * Path to the text file
   */
  path: string;
}

/**
 * Data blob binding
 */
export interface DataBlobBinding extends Binding {
  type: 'data_blob';
  
  /**
   * Path to the data file
   */
  path: string;
}

/**
 * Union type of all possible bindings
 */
export type WorkerBinding = 
  | KVNamespaceBinding
  | R2BucketBinding
  | DurableObjectBinding
  | QueueBinding
  | ServiceBinding
  | D1DatabaseBinding
  | VectorizeBinding
  | HyperdriveBinding
  | AIBinding
  | AnalyticsEngineBinding
  | BrowserBinding
  | DispatchNamespaceBinding
  | MTLSCertificateBinding
  | EnvironmentVariableBinding
  | WasmModuleBinding
  | TextBlobBinding
  | DataBlobBinding;

/**
 * Cron trigger configuration
 */
export interface CronTrigger {
  /**
   * Cron schedule in crontab format
   */
  cron: string;
  
  /**
   * Optional timezone for the cron schedule
   */
  timezone?: string;
}

/**
 * Custom route specification
 */
export interface CustomRoute {
  /**
   * Route pattern
   */
  pattern: string;
  
  /**
   * Custom domain flag
   */
  custom_domain?: boolean;
  
  /**
   * Zone ID (if using a zone)
   */
  zone_id?: string;
  
  /**
   * Zone name (if using a zone name instead of ID)
   */
  zone_name?: string;
}

/**
 * Type for routes - either string patterns or custom route objects
 */
export type Route = string | CustomRoute;

/**
 * Durable Object migration configuration
 */
export interface DurableObjectMigration {
  /**
   * Tag for the migration
   */
  tag: string;
  
  /**
   * New classes to create in this migration
   */
  new_classes?: string[];
  
  /**
   * Classes to rename in this migration
   */
  renamed_classes?: Array<{
    /**
     * From class name
     */
    from: string;
    
    /**
     * To class name
     */
    to: string;
  }>;
  
  /**
   * Classes to delete in this migration
   */
  deleted_classes?: string[];
}

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
   * Path to wrangler.toml config file (optional, for backward compatibility)
   * If provided, this will override programmatic configuration
   */
  config?: string;
  
  /**
   * Environment to deploy to
   */
  env?: string;
  
  /**
   * Compatibility date for the Worker
   * Required for deployment
   */
  compatibilityDate?: string;
  
  /**
   * Compatibility flags for the Worker
   */
  compatibilityFlags?: string[];
  
  /**
   * Account ID to deploy to
   */
  accountId?: string;
  
  /**
   * Whether to minify the Worker code
   */
  minify?: boolean;
  
  /**
   * Whether to use Node.js compatibility features
   */
  nodejsCompat?: boolean;
  
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
  routes?: Route[];
  
  /**
   * Custom domain to assign to the Worker (shorthand for routes)
   */
  customDomain?: string;
  
  /**
   * Worker bindings (KV, R2, DO, etc.)
   */
  bindings?: WorkerBinding[];
  
  /**
   * Environment variables to bind to the Worker
   * Shorthand for environment variable bindings
   */
  vars?: Record<string, string>;
  
  /**
   * Secrets to bind to the Worker
   * These are stored encrypted and not visible after creation
   */
  secrets?: Record<string, string>;
  
  /**
   * Whether to use the modules format (ESM) or service worker format
   * Defaults to 'modules' for new Workers
   */
  format?: 'modules' | 'service-worker';
  
  /**
   * Path to assets directory to deploy with the Worker
   */
  assets?: string;
  
  /**
   * Cron triggers for the Worker
   */
  triggers?: CronTrigger[];
  
  /**
   * Durable Object migrations
   */
  migrations?: DurableObjectMigration[];
  
  /**
   * Usage model for the Worker
   * Default is 'bundled'
   */
  usage?: 'bundled' | 'unbound';
  
  /**
   * Limits for the Worker
   */
  limits?: {
    /**
     * CPU time limit in milliseconds
     */
    cpu_ms?: number;
    
    /**
     * Memory limit in MB
     */
    memory_mb?: number;
  };
  
  /**
   * Queue producers configuration
   */
  queueProducers?: Array<{
    /**
     * Queue name
     */
    queue: string;
    
    /**
     * Optional delivery delay in seconds
     */
    delivery_delay?: number;
  }>;
  
  /**
   * Queue consumers configuration
   */
  queueConsumers?: Array<{
    /**
     * Queue name
     */
    queue: string;
    
    /**
     * Type of consumer
     */
    type?: 'worker' | 'http_pull';
    
    /**
     * Maximum batch size
     */
    max_batch_size?: number;
    
    /**
     * Maximum retries
     */
    max_retries?: number;
    
    /**
     * Maximum batch timeout in seconds
     */
    max_batch_timeout?: number;
    
    /**
     * Visibility timeout in ms
     */
    visibility_timeout_ms?: number;
    
    /**
     * Dead letter queue
     */
    dead_letter_queue?: string;
  }>;
  
  /**
   * Whether to keep existing environment variables
   * If false (default), existing vars will be replaced with those specified
   */
  keepVars?: boolean;
  
  /**
   * Whether to enable logpush
   */
  logpush?: boolean;
  
  /**
   * Placement configuration for the Worker
   */
  placement?: {
    /**
     * Placement mode
     */
    mode: 'smart';
    
    /**
     * Placement hint (if using smart placement)
     */
    hint?: 'low-latency' | 'security';
  };
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
   * Path to wrangler.toml config file (optional, for backward compatibility)
   * If provided, this will override programmatic configuration
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
   * Name of the Worker
   */
  name?: string;
  
  /**
   * Compatibility date for the Worker
   */
  compatibilityDate?: string;
  
  /**
   * Compatibility flags for the Worker
   */
  compatibilityFlags?: string[];
  
  /**
   * Whether to use Node.js compatibility features
   */
  nodejsCompat?: boolean;
  
  /**
   * Worker bindings (KV, R2, DO, etc.)
   */
  bindings?: WorkerBinding[];
  
  /**
   * Environment variables to bind to the Worker
   * Shorthand for environment variable bindings
   */
  vars?: Record<string, string>;
  
  /**
   * Secrets to bind to the Worker locally
   */
  secrets?: Record<string, string>;
  
  /**
   * Whether to use the modules format (ESM) or service worker format
   * Defaults to 'modules' for new Workers
   */
  format?: 'modules' | 'service-worker';
  
  /**
   * Path to assets directory to serve with the Worker
   */
  assets?: string;
  
  /**
   * Whether to enable local persistence for KV, DO, etc.
   */
  localPersistence?: boolean;
  
  /**
   * Directory to store local persistence data
   */
  persistenceDirectory?: string;
  
  /**
   * Whether to watch for file changes and restart automatically
   */
  watch?: boolean;
  
  /**
   * Local routes to test against
   */
  routes?: Route[];
  
  /**
   * Whether to upstream requests to another server (e.g., for testing with a real backend)
   */
  upstream?: string;
  
  /**
   * Whether to enable verbose logging
   */
  verbose?: boolean;
  
  /**
   * Whether to add local host entries
   */
  local?: boolean;
  
  /**
   * Whether to build the Worker before starting dev server
   */
  build?: boolean;
  
  /**
   * Whether to minify the Worker code when building
   */
  minify?: boolean;
  
  /**
   * Whether to open the browser automatically
   */
  open?: boolean;
  
  /**
   * Whether to show the dev UI
   */
  ui?: boolean;
  
  /**
   * Whether to enable debugging functionality
   */
  debug?: boolean;
  
  /**
   * Whether to use legacy compatibility mode
   */
  legacyEnv?: boolean;
  
  /**
   * Whether to use remote mode (connects to Cloudflare's development platform)
   */
  remote?: boolean;
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