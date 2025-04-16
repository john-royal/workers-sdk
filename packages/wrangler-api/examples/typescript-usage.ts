// Example of using the Wrangler API programmatically with TypeScript

import { wranglerApi, DeployOptions } from 'wrangler-api';

async function main() {
  // Set authentication credentials
  await wranglerApi.setAuth({
    apiToken: process.env.CLOUDFLARE_API_TOKEN,
    accountId: process.env.CLOUDFLARE_ACCOUNT_ID
  });

  // Deploy configuration
  const deployOptions: DeployOptions = {
    script: './my-worker/index.ts',
    name: 'my-typescript-worker',
    compatibilityDate: '2023-10-30',
    vars: {
      API_KEY: 'demo-key',
      ENVIRONMENT: 'production'
    },
    minify: true,
    sourceMaps: true
  };

  console.log('Deploying worker...');
  
  // Deploy the worker
  const deployResult = await wranglerApi.deploy(deployOptions);

  if (deployResult.success) {
    console.log(`Worker deployed successfully!`);
    if (deployResult.urls) {
      console.log(`Available at: ${deployResult.urls.join(', ')}`);
    }
  } else {
    console.error(`Deployment failed: ${deployResult.error}`);
    process.exit(1);
  }
  
  // Start local development server
  console.log('Starting development server...');
  const stopDev = await wranglerApi.dev({
    script: './my-worker/index.ts',
    port: 8787,
    localPersistence: true,
    vars: {
      API_KEY: 'dev-key',
      ENVIRONMENT: 'development'
    }
  });
  
  // Wait for 10 seconds then stop the dev server
  console.log('Dev server running. Press Ctrl+C to stop...');
  process.on('SIGINT', async () => {
    console.log('Stopping dev server...');
    await stopDev();
    process.exit(0);
  });
}

main().catch(error => {
  console.error('Unexpected error:', error);
  process.exit(1);
});