// Example of using the Wrangler API programmatically (JavaScript)

const { wranglerApi } = require('wrangler-api');

async function main() {
  // There are multiple ways to authenticate:
  
  // 1. Using API token (recommended)
  await wranglerApi.setAuth({
    apiToken: process.env.CLOUDFLARE_API_TOKEN,
    accountId: process.env.CLOUDFLARE_ACCOUNT_ID
  });
  
  // 2. Using OAuth flow
  // This will open a browser window for authentication
  // const authResult = await wranglerApi.login();
  // if (!authResult.success) {
  //   console.error(`Authentication failed: ${authResult.error}`);
  //   process.exit(1);
  // }
  
  // 3. Using Global API Key (legacy approach)
  // await wranglerApi.setAuth({
  //   apiKey: process.env.CLOUDFLARE_API_KEY,
  //   email: process.env.CLOUDFLARE_EMAIL,
  //   accountId: process.env.CLOUDFLARE_ACCOUNT_ID
  // });
  
  // Check if authentication was successful
  if (!wranglerApi.isAuthenticated()) {
    console.error('Not authenticated. Please check your credentials.');
    process.exit(1);
  }
  
  console.log(`Authenticated using ${wranglerApi.getAuthMethod()}`);
  console.log(`Using account ID: ${wranglerApi.getAccountId()}`);
  
  // DEPLOYMENT EXAMPLE
  console.log('\nDeploying worker...');
  
  // Deploy a worker
  const deployResult = await wranglerApi.deploy({
    script: './my-worker/index.js',
    name: 'my-programmatic-worker',
    compatibilityDate: '2023-10-30',
    compatibilityFlags: ['nodejs_compat'],
    vars: {
      API_URL: 'https://api.example.com',
      DEBUG: 'false'
    },
    routes: [
      'example.com/api/*',
      'api.example.com/*'
    ]
  });

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
  
  // LOCAL DEVELOPMENT EXAMPLE
  console.log('\nStarting development server...');
  
  // Start a local development server
  const stopDev = await wranglerApi.dev({
    script: './my-worker/index.js',
    port: 8787,
    localPersistence: true,
    vars: {
      API_URL: 'http://localhost:3000',
      DEBUG: 'true'
    }
  });
  
  // The development server runs until you manually stop it
  console.log('Development server running at http://localhost:8787');
  console.log('Press Ctrl+C to stop the server');
  
  // Set up event handler to stop the dev server on exit
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