/**
 * This example demonstrates how to use the programmatic dev server functionality
 * of the wrangler-api package.
 * 
 * The dev server allows you to run your Workers locally without requiring a
 * wrangler.toml file, making it easier to integrate with other tools
 * and workflows.
 */

import { WranglerAPI } from '../src';
import path from 'path';
import fs from 'fs';

async function main() {
  // Process command line arguments
  const args = process.argv.slice(2);
  const useRemoteMode = args.includes('--remote');
  
  // Create a temporary Worker script if it doesn't exist
  const workerDir = path.resolve(__dirname, '../temp');
  const workerPath = path.join(workerDir, 'worker.js');
  
  if (!fs.existsSync(workerDir)) {
    fs.mkdirSync(workerDir, { recursive: true });
  }
  
  if (!fs.existsSync(workerPath)) {
    fs.writeFileSync(workerPath, `
      export default {
        async fetch(request, env, ctx) {
          // Access environment variables and bindings
          const apiKey = env.API_KEY || "not set";
          const secretKey = env.SECRET_KEY || "not set";
          const environment = env.ENVIRONMENT || "not set";
          
          // Demonstrate returning different content based on mode
          const mode = env.CF_WORKER_RUNTIME || "local";
          
          return new Response(\`Hello from Wrangler API Dev Server!
          
          Running in: \${mode} mode
          Environment: \${environment}
          API Key: \${apiKey}
          Secret Key: \${secretKey}
          
          Request URL: \${request.url}
          \`, {
            headers: { 'Content-Type': 'text/plain' },
          });
        },
      };
    `);
  }

  // Initialize the Wrangler API
  const wrangler = new WranglerAPI();
  
  // If using remote mode, make sure we're authenticated
  if (useRemoteMode) {
    console.log('Remote mode requested, checking authentication...');
    
    // Set up environment variables for testing (in a real app, you'd use real credentials)
    if (!process.env.CLOUDFLARE_API_TOKEN) {
      const testToken = 'test_token';
      console.log(`Using test token: ${testToken} (this won't work with actual Cloudflare API)`);
      process.env.CLOUDFLARE_API_TOKEN = testToken;
      process.env.CLOUDFLARE_ACCOUNT_ID = 'test_account';
    }
    
    try {
      // Try to authenticate from environment variables
      await wrangler.authFromEnvironment();
      
      if (!wrangler.isAuthenticated()) {
        throw new Error('Could not authenticate');
      }
      
      console.log('Successfully authenticated with Cloudflare');
    } catch (err) {
      console.error('Authentication failed:', err);
      console.error('Using remote mode requires valid Cloudflare credentials');
      console.error('Set CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID environment variables');
      process.exit(1);
    }
  }
  
  console.log(`Starting dev server in ${useRemoteMode ? 'remote' : 'local'} mode...`);
  
  // Start the dev server with various configurations
  const stopServer = await wrangler.dev({
    script: workerPath,
    name: 'dev-server-example',
    compatibilityDate: '2023-05-18',
    compatibilityFlags: ['nodejs_compat'],
    port: 8787,
    ip: 'localhost',
    inspect: true,
    watch: true,
    localPersistence: true,
    bindings: [
      {
        type: 'kv_namespace',
        name: 'MY_KV',
        id: 'demo-kv-id',
      },
      {
        type: 'r2_bucket',
        name: 'MY_BUCKET',
        bucket_name: 'demo-bucket',
      },
      {
        type: 'durable_object',
        name: 'MY_DURABLE_OBJECT',
        class_name: 'DemoObject',
      },
      {
        type: 'environment_variable',
        name: 'API_KEY',
        value: 'example-api-key',
      }
    ],
    vars: {
      ENVIRONMENT: 'development',
      DEBUG: 'true',
    },
    secrets: {
      SECRET_KEY: 'this-is-a-secret',
    },
    routes: [
      'example.com/api/*',
      { pattern: 'api.example.com/*', custom_domain: true }
    ],
    // Remote mode uses the Cloudflare network instead of local
    // Requires authentication
    remote: useRemoteMode,
    verbose: true,
  });
  
  console.log(`Dev server running at http://localhost:8787 in ${useRemoteMode ? 'remote' : 'local'} mode`);
  console.log('Press Ctrl+C to stop the server');
  
  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    console.log('Stopping dev server...');
    await stopServer();
    process.exit(0);
  });
  
  // Keep the process running
  await new Promise(() => {});
}

main().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});