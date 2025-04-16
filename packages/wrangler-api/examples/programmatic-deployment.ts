// Example of programmatic deployment without wrangler.toml
import { 
  WranglerAPI, 
  DeployOptions, 
  DevOptions 
} from 'wrangler-api';

// Create a Worker API instance
const api = new WranglerAPI();

async function main() {
  // Authenticate with Cloudflare
  // You can use any of the authentication methods (API token, OAuth, etc.)
  const authResult = await api.setAuth({
    apiToken: process.env.CLOUDFLARE_API_TOKEN,
    accountId: process.env.CLOUDFLARE_ACCOUNT_ID
  });

  if (!authResult.success) {
    console.error(`Authentication failed: ${authResult.error}`);
    process.exit(1);
  }

  console.log('Authenticated successfully');
  console.log(`Account ID: ${api.getAccountId()}`);

  // Define a complete Worker configuration programmatically
  // No wrangler.toml required!
  const deployOptions: DeployOptions = {
    // Path to the Worker script (required)
    script: './src/index.js',
    
    // Name for the Worker (defaults to the script filename without extension)
    name: 'my-programmatic-worker',
    
    // Required compatibility date
    compatibilityDate: '2023-05-18',
    
    // Optional compatibility flags
    compatibilityFlags: ['nodejs_compat'],
    
    // Worker format (modules or service-worker)
    format: 'modules',
    
    // Build options
    minify: true,
    sourceMaps: true,
    
    // Routes for the Worker
    routes: [
      'example.com/api/*',
      {
        pattern: 'api.example.com/*',
        zone_id: 'zone-id-if-you-have-it'
      }
    ],
    
    // Custom domain (shorthand for a route with custom_domain: true)
    customDomain: 'worker-api.example.com',
    
    // Environment variables
    vars: {
      API_URL: 'https://api.example.com',
      DEBUG: 'false',
      ENVIRONMENT: 'production'
    },
    
    // Secrets (encrypted environment variables)
    secrets: {
      API_KEY: 'super-secret-api-key'
    },
    
    // Bindings for various Cloudflare resources
    bindings: [
      // KV namespace binding
      {
        type: 'kv_namespace',
        name: 'USERS',
        id: 'kv-namespace-id'
      },
      
      // R2 bucket binding
      {
        type: 'r2_bucket',
        name: 'ASSETS',
        bucket_name: 'my-assets-bucket'
      },
      
      // D1 database binding
      {
        type: 'd1_database',
        name: 'DB',
        database_id: 'd1-database-id',
        database_name: 'my-database'
      },
      
      // Durable Object binding
      {
        type: 'durable_object',
        name: 'COUNTER',
        class_name: 'Counter'
      },
      
      // Service binding
      {
        type: 'service',
        name: 'AUTH_SERVICE',
        service: 'auth-worker'
      }
    ],
    
    // Cron triggers
    triggers: [
      {
        cron: '0 0 * * *', // Run at midnight every day
        timezone: 'UTC'
      }
    ],
    
    // Durable Object migrations
    migrations: [
      {
        tag: '0001',
        new_classes: ['Counter']
      }
    ],
    
    // Worker usage model
    usage: 'bundled',
    
    // Resource limits
    limits: {
      cpu_ms: 50,
      memory_mb: 128
    },
    
    // Queue producers
    queueProducers: [
      {
        queue: 'my-queue',
        delivery_delay: 0
      }
    ],
    
    // Queue consumers
    queueConsumers: [
      {
        queue: 'my-queue',
        max_batch_size: 10,
        max_retries: 3
      }
    ],
    
    // Worker placement
    placement: {
      mode: 'smart',
      hint: 'low-latency'
    },
    
    // Enable logpush
    logpush: true
  };

  console.log('Deploying Worker...');
  const deployResult = await api.deploy(deployOptions);

  if (deployResult.success) {
    console.log('Worker deployed successfully!');
    console.log(`Deployment ID: ${deployResult.id}`);
    if (deployResult.urls) {
      console.log(`Available at: ${deployResult.urls.join(', ')}`);
    }
  } else {
    console.error(`Deployment failed: ${deployResult.error}`);
    process.exit(1);
  }

  // You can also use the same approach for local development
  const devOptions: DevOptions = {
    // Path to the Worker script (required)
    script: './src/index.js',
    
    // Name for the Worker (defaults to the script filename without extension)
    name: 'my-programmatic-worker',
    
    // Dev server options
    port: 8787,
    ip: 'localhost',
    inspect: true,
    localPersistence: true,
    
    // Required compatibility date
    compatibilityDate: '2023-05-18',
    
    // Optional compatibility flags
    compatibilityFlags: ['nodejs_compat'],
    
    // Worker format (modules or service-worker)
    format: 'modules',
    
    // Environment variables
    vars: {
      API_URL: 'http://localhost:3000',
      DEBUG: 'true',
      ENVIRONMENT: 'development'
    },
    
    // Use the same bindings as in deployment but with local versions
    bindings: [
      // KV namespace binding
      {
        type: 'kv_namespace',
        name: 'USERS',
        id: 'local-kv-namespace-id'
      },
      
      // R2 bucket binding
      {
        type: 'r2_bucket',
        name: 'ASSETS',
        bucket_name: 'local-assets-bucket'
      }
    ],
    
    // Local dev specific options
    watch: true,
    verbose: true,
    open: true,
    build: true
  };

  console.log('\nStarting development server...');
  const stopDev = await api.dev(devOptions);

  // The dev server will keep running until you stop it
  console.log('Press Ctrl+C to stop the development server');

  // Handle stopping the server on exit
  process.on('SIGINT', async () => {
    console.log('Stopping development server...');
    await stopDev();
    process.exit(0);
  });
}

main().catch(error => {
  console.error('Unexpected error:', error);
  process.exit(1);
});