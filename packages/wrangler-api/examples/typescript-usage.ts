// Example of using the Wrangler API programmatically with TypeScript

import { 
  WranglerAPI, 
  DeployOptions, 
  DevOptions, 
  DeployResult,
  AuthResult 
} from 'wrangler-api';

// Create a custom instance (alternatively, use the singleton export)
const api = new WranglerAPI();

// Function to save tokens to a storage system (file, database, etc.)
async function saveTokensToStorage(tokens: { 
  accessToken: string;
  refreshToken: string;
  expiry: string;
}) {
  // This is just an example - in a real app, you would:
  // - Store tokens securely in a persistent storage
  // - Encrypt the tokens if possible
  console.log('Tokens saved for future use');
  
  // For this example, we just log (you would actually save them)
  console.log(`Access token: ${tokens.accessToken.substring(0, 10)}...`);
  console.log(`Refresh token: ${tokens.refreshToken.substring(0, 10)}...`);
  console.log(`Expiry: ${tokens.expiry}`);
}

// Function to load tokens from a storage system
async function loadTokensFromStorage(): Promise<{
  accessToken: string;
  refreshToken: string;
  expiry: string;
} | null> {
  // This is just an example - in a real app, you would:
  // - Retrieve tokens from a secure storage
  // - Decrypt the tokens if necessary
  
  // For this example, we'll just return null to simulate no stored tokens
  return null;
  
  // A real implementation might return:
  // return {
  //   accessToken: 'stored-access-token',
  //   refreshToken: 'stored-refresh-token',
  //   expiry: '2023-11-15T12:00:00.000Z'
  // };
}

async function main() {
  // There are multiple ways to authenticate
  let authResult: AuthResult;
  
  // Option 1: Try to restore a previous session
  console.log('Checking for saved authentication...');
  const savedTokens = await loadTokensFromStorage();
  
  if (savedTokens) {
    console.log('Found saved tokens, attempting to restore session...');
    authResult = await api.restoreSession(
      savedTokens.accessToken,
      savedTokens.refreshToken,
      savedTokens.expiry
    );
    
    if (authResult.success) {
      console.log('Successfully restored previous session!');
    } else {
      console.log('Failed to restore session:', authResult.error);
    }
  }
  
  // Option 2: API Token authentication (if we don't have saved tokens or restoration failed)
  if (!savedTokens || !authResult?.success) {
    console.log('Trying API token authentication...');
    authResult = await api.setAuth({
      apiToken: process.env.CLOUDFLARE_API_TOKEN,
      accountId: process.env.CLOUDFLARE_ACCOUNT_ID
    });
  }
  
  // Option 3: OAuth authentication (if the above methods failed)
  if (!authResult?.success) {
    console.log('API token auth failed, trying OAuth...');
    authResult = await api.login({
      // Customize OAuth scopes if needed
      scopes: [
        'account:read',
        'user:read',
        'workers:write',
        'workers_kv:write',
        'workers_routes:write'
      ],
      // Optional callback to handle the auth URL (useful for non-browser environments)
      handleAuthUrl: async (url: string) => {
        console.log(`Please visit this URL to authenticate: ${url}`);
      }
    });
    
    // If OAuth login was successful, save tokens for future use
    if (authResult.success) {
      console.log('OAuth login successful, saving tokens for future use');
      const tokens = api.getOAuthTokens();
      if (tokens) {
        await saveTokensToStorage(tokens);
      }
    }
  }

  if (!api.isAuthenticated()) {
    console.error('Failed to authenticate. Please check your credentials.');
    process.exit(1);
  }

  console.log(`Authenticated using ${api.getAuthMethod()}`);
  console.log(`Account ID: ${api.getAccountId()}`);

  // DEPLOYMENT EXAMPLE
  // Set up deployment options with TypeScript support
  const deployOptions: DeployOptions = {
    script: './src/worker.ts',  // TypeScript file
    name: 'my-typescript-worker',
    compatibilityDate: '2023-10-30',
    compatibilityFlags: ['nodejs_compat'], // Enable Node.js compatibility
    
    // Environment variables
    vars: {
      API_URL: 'https://api.example.com',
      DEBUG: 'false',
      VERSION: '1.0.0'
    },
    
    // Routes for the worker
    routes: [
      'example.com/api/*',
      'api.example.com/*'
    ],
    
    // Build options
    minify: true,
    sourceMaps: true, // Upload source maps for debugging
    
    // Optional: specify the path to wrangler.toml
    config: './wrangler.toml',
    
    // Optional: specify environment to deploy to
    env: 'production'
  };

  console.log('Deploying worker...');
  const deployResult: DeployResult = await api.deploy(deployOptions);

  if (deployResult.success) {
    console.log(`Worker deployed successfully!`);
    console.log(`Deployment ID: ${deployResult.id}`);
    if (deployResult.urls) {
      console.log(`Available at: ${deployResult.urls.join(', ')}`);
    }
  } else {
    console.error(`Deployment failed: ${deployResult.error}`);
    process.exit(1);
  }
  
  // DEVELOPMENT SERVER EXAMPLE
  // Set up development server options
  const devOptions: DevOptions = {
    script: './src/worker.ts',
    port: 8787,
    ip: 'localhost',
    inspect: true, // Enable inspector for debugging
    localPersistence: true, // Enable local persistence for KV, DO, etc.
    
    // Dev-specific environment variables
    vars: {
      API_URL: 'http://localhost:3000',
      DEBUG: 'true',
      VERSION: '1.0.0-dev'
    },
    
    // Optional: specify compatibility date/flags if different from wrangler.toml
    compatibilityDate: '2023-10-30',
    compatibilityFlags: ['nodejs_compat']
  };
  
  console.log('\nStarting development server...');
  const stopDev = await api.dev(devOptions);
  
  console.log('Development server running at http://localhost:8787');
  console.log('Press Ctrl+C to stop the server');
  
  // Handle termination gracefully
  process.on('SIGINT', async () => {
    console.log('Stopping development server...');
    await stopDev();
    console.log('Server stopped, exiting...');
    process.exit(0);
  });
  
  // Example of other available functionality
  // Uncomment to use:
  
  // KV NAMESPACE OPERATIONS
  // List KV namespaces
  // const kvNamespaces = await api.kv.listNamespaces();
  // console.log('KV Namespaces:', kvNamespaces);
  
  // Create a new KV namespace
  // const newNamespace = await api.kv.createNamespace({ namespace: 'my-test-namespace' });
  // console.log('Created namespace:', newNamespace);
  
  // SECRET MANAGEMENT
  // Add a secret to the worker
  // const secretResult = await api.secret('put', { 
  //   name: 'API_SECRET', 
  //   value: 'super-secret-value',
  //   script: 'my-typescript-worker'
  // });
  // console.log('Secret added:', secretResult);
}

main().catch(error => {
  console.error('Unexpected error:', error);
  process.exit(1);
});