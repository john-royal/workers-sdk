// Example of using the Wrangler API programmatically

const { wranglerApi } = require('wrangler-api');

async function main() {
  // Set authentication credentials
  await wranglerApi.setAuth({
    apiToken: process.env.CLOUDFLARE_API_TOKEN,
    accountId: process.env.CLOUDFLARE_ACCOUNT_ID
  });

  console.log('Deploying worker...');
  
  // Deploy a worker
  const deployResult = await wranglerApi.deploy({
    script: './my-worker/index.js',
    name: 'my-programmatic-worker',
    compatibilityDate: '2023-10-30'
  });

  if (deployResult.success) {
    console.log(`Worker deployed successfully!`);
    if (deployResult.urls) {
      console.log(`Available at: ${deployResult.urls.join(', ')}`);
    }
  } else {
    console.error(`Deployment failed: ${deployResult.error}`);
    process.exit(1);
  }
}

main().catch(error => {
  console.error('Unexpected error:', error);
  process.exit(1);
});