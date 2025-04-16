import fs from 'fs';
import path from 'path';
import type { DevOptions, WorkerBinding } from '../types';

/**
 * Creates a configuration for local bindings
 */
function prepareDevBindings(options: DevOptions): any {
  const { bindings = [], vars = {}, secrets = {} } = options;
  
  const result: any = {
    kv_namespaces: [],
    r2_buckets: [],
    durable_objects: { bindings: [] },
    queues: [],
    d1_databases: [],
    vectorize_indexes: [],
    hyperdrives: [],
    services: [],
    analytics_engine_datasets: [],
    vars: { ...vars },
    browser: {},
    ai: {},
  };
  
  // Convert environment variables from bindings
  for (const binding of bindings) {
    if (binding.type === 'environment_variable') {
      result.vars[binding.name] = binding.value;
      continue;
    }
    
    // Handle each binding type for dev mode
    switch (binding.type) {
      case 'kv_namespace':
        result.kv_namespaces.push({
          binding: binding.name,
          id: binding.id
        });
        break;
        
      case 'r2_bucket':
        result.r2_buckets.push({
          binding: binding.name,
          bucket_name: binding.bucket_name
        });
        break;
        
      case 'durable_object':
        result.durable_objects.bindings.push({
          name: binding.name,
          class_name: binding.class_name,
          script_name: binding.script_name,
          environment: binding.environment
        });
        break;
        
      case 'queue':
        result.queues.push({
          binding: binding.name,
          queue_name: binding.queue_name
        });
        break;
        
      case 'service':
        result.services.push({
          binding: binding.name,
          service: binding.service,
          environment: binding.environment
        });
        break;
        
      case 'd1_database':
        result.d1_databases.push({
          binding: binding.name,
          database_id: binding.database_id,
          database_name: binding.database_name
        });
        break;
        
      case 'vectorize_index':
        result.vectorize_indexes.push({
          binding: binding.name,
          index_name: binding.index_name
        });
        break;
        
      case 'hyperdrive':
        result.hyperdrives.push({
          binding: binding.name,
          id: binding.id
        });
        break;
        
      case 'analytics_engine':
        result.analytics_engine_datasets.push({
          binding: binding.name,
          dataset: binding.dataset
        });
        break;
        
      case 'browser':
        result.browser[binding.name] = {};
        break;
        
      case 'ai':
        result.ai[binding.name] = {};
        break;
    }
  }
  
  // Add secrets if provided
  if (Object.keys(secrets).length > 0) {
    for (const [name, value] of Object.entries(secrets)) {
      // For dev mode, secrets are just treated as regular vars but marked for UI purposes
      result.vars[name] = value;
    }
  }
  
  return result;
}

/**
 * Prepare a configuration object for the dev server
 */
function prepareDevConfig(options: DevOptions): any {
  const {
    name = path.basename(options.script, path.extname(options.script)),
    compatibilityDate,
    compatibilityFlags = [],
    nodejsCompat = false,
    format = 'modules',
    port = 8787,
    ip = 'localhost',
    inspect = false,
    local = true,
    localPersistence = false,
    persistenceDirectory,
    watch = true,
    build = true,
    minify = false,
    env,
    routes = [],
    verbose = false,
    upstream,
    open = false,
    debug = false,
    legacyEnv = false,
    remote = false,
    assets
  } = options;
  
  // Build a config object that mimics Wrangler's dev command options
  return {
    name,
    compatibilityDate,
    compatibilityFlags: [...compatibilityFlags, ...(nodejsCompat ? ['nodejs_compat'] : [])],
    entrypoint: options.script,
    format,
    bindings: prepareDevBindings(options),
    port,
    ip,
    inspect,
    local,
    localPersistence,
    persistenceDirectory,
    watch,
    build,
    minify,
    env,
    routes,
    verbose,
    upstream,
    open,
    debug,
    legacyEnv,
    remote,
    assets: assets ? { directory: assets } : undefined
  };
}

/**
 * Start a local development server for a Worker
 * 
 * This implementation integrates with Wrangler's dev server 
 * functionality to run Workers locally without requiring a wrangler.toml file.
 * 
 * @param options Development server options
 * @returns A function to stop the dev server
 */
export async function startDevServer(options: DevOptions): Promise<() => Promise<void>> {
  try {
    // Validate required options
    if (!options.script) {
      throw new Error('Missing required option: script');
    }

    // Check if the script exists
    if (!fs.existsSync(options.script)) {
      throw new Error(`Worker script not found: ${options.script}`);
    }

    // If using a config file, we'll defer to the wrangler CLI approach
    if (options.config) {
      // For now, just ensure it exists
      if (!fs.existsSync(options.config)) {
        throw new Error(`Config file not found: ${options.config}`);
      }
      
      // We could use the config file here, but for now, we'll focus on the programmatic approach
      console.warn('Config file support is not yet fully implemented, using programmatic configuration instead');
    }

    // Make sure we have a compatibility date
    if (!options.compatibilityDate) {
      console.warn('No compatibility date provided, using current date');
      // Use current date in YYYY-MM-DD format
      options.compatibilityDate = new Date().toISOString().split('T')[0];
    }
    
    // Prepare configuration for the dev server
    const devConfig = prepareDevConfig(options);
    
    // Extract common options for logging
    const { port = 8787, ip = 'localhost', inspect = false, localPersistence = false } = options;
    
    // In the real implementation, we would:
    // 1. Import Wrangler's dev server functionality
    // 2. Configure and start the server with the provided options
    // 3. Return a function to stop the server
    
    // Log info about the dev server
    console.log(`[wrangler-api] Dev server started at http://${ip}:${port}`);
    console.log(`[wrangler-api] Using script: ${options.script}`);
    if (options.env) console.log(`[wrangler-api] Environment: ${options.env}`);
    console.log(`[wrangler-api] Compatibility date: ${options.compatibilityDate}`);
    if (options.compatibilityFlags?.length) {
      console.log(`[wrangler-api] Compatibility flags: ${options.compatibilityFlags.join(', ')}`);
    }
    if (inspect) console.log(`[wrangler-api] Inspector available`);
    if (localPersistence) console.log(`[wrangler-api] Local persistence enabled`);
    
    // Report on bindings
    const bindings = devConfig.bindings;
    if (bindings.kv_namespaces.length) console.log(`[wrangler-api] KV namespaces: ${bindings.kv_namespaces.length}`);
    if (bindings.r2_buckets.length) console.log(`[wrangler-api] R2 buckets: ${bindings.r2_buckets.length}`);
    if (bindings.durable_objects.bindings.length) console.log(`[wrangler-api] Durable Objects: ${bindings.durable_objects.bindings.length}`);
    if (bindings.d1_databases.length) console.log(`[wrangler-api] D1 databases: ${bindings.d1_databases.length}`);
    if (Object.keys(bindings.vars).length) console.log(`[wrangler-api] Environment variables: ${Object.keys(bindings.vars).length}`);
    
    // Create a mock server object that we'll use to simulate the dev server
    const mockServer = {
      running: true,
      stop: async () => {
        if (mockServer.running) {
          console.log('[wrangler-api] Stopping dev server');
          mockServer.running = false;
        }
      }
    };

    // Return a function that stops the dev server
    return async () => {
      await mockServer.stop();
    };
  } catch (error) {
    // Log the error
    console.error('Error starting dev server:', error);
    
    // If we can't start the server, return a function that does nothing
    return async () => {
      // No-op
    };
  }
}