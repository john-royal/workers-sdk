# Wrangler API

A programmatic API for deploying and managing Cloudflare Workers.

This package provides a JavaScript/TypeScript API for working with Cloudflare Workers, allowing you to integrate Wrangler functionality directly into your applications, build tools, or CI/CD pipelines.

## Features

- **Authentication** - API token, OAuth, and Global API Key authentication methods
- **Deployment** - Deploy Workers directly from code 
- **Development** - Run Workers locally with a dev server
- **KV Namespaces** - Create, list, and manage KV namespaces
- **Durable Objects** - Interact with Durable Objects
- **Secrets** - Manage Worker secrets programmatically
- **Project Creation** - Initialize new Worker projects

## Installation

```bash
npm install wrangler-api
# or
yarn add wrangler-api
# or
pnpm add wrangler-api
```

## Basic Usage

```typescript
import { wranglerApi } from 'wrangler-api';

// Authenticate with Cloudflare
await wranglerApi.setAuth({
  apiToken: process.env.CLOUDFLARE_API_TOKEN,
  accountId: process.env.CLOUDFLARE_ACCOUNT_ID
});

// Deploy a worker
const result = await wranglerApi.deploy({
  script: './worker/index.js',
  name: 'my-worker',
  compatibilityDate: '2023-10-30',
  compatibilityFlags: ['nodejs_compat'],
  vars: {
    API_URL: 'https://api.example.com'
  }
});

if (result.success) {
  console.log(`Worker deployed successfully at: ${result.urls?.join(', ')}`);
} else {
  console.error(`Deployment failed: ${result.error}`);
}

// Start local development
const stopDev = await wranglerApi.dev({
  script: './worker/index.js',
  port: 8787,
  localPersistence: true
});

// Later, stop the development server
await stopDev();
```

## Authentication Methods

The Wrangler API supports multiple authentication methods:

### API Token (Recommended)

```typescript
await wranglerApi.setAuth({
  apiToken: 'your-cloudflare-api-token',
  accountId: 'your-cloudflare-account-id' // optional
});
```

### OAuth Flow

```typescript
const authResult = await wranglerApi.login({
  // Optional custom scopes
  scopes: ['account:read', 'workers:write'],
  // Optional callback to handle the auth URL (useful in non-browser environments)
  handleAuthUrl: async (url) => {
    console.log(`Visit this URL to authenticate: ${url}`);
  }
});
```

### Global API Key (Legacy)

```typescript
await wranglerApi.setAuth({
  apiKey: 'your-global-api-key',
  email: 'your-cloudflare-email',
  accountId: 'your-cloudflare-account-id' // optional
});
```

### Environment Variables

The API will automatically check for these environment variables:
- `CLOUDFLARE_API_TOKEN` or `CF_API_TOKEN`
- `CLOUDFLARE_API_KEY` and `CLOUDFLARE_EMAIL` (or `CF_API_KEY` and `CF_EMAIL`)
- `CLOUDFLARE_ACCOUNT_ID` or `CF_ACCOUNT_ID`

## API Reference

### Authentication

```typescript
// Check authentication status
const isAuthed = wranglerApi.isAuthenticated();

// Get current authentication method
const authMethod = wranglerApi.getAuthMethod(); // 'oauth', 'api_token', 'email_key', or 'none'

// Get current account ID
const accountId = wranglerApi.getAccountId();

// Manually refresh OAuth tokens
const refreshed = await wranglerApi.refreshAuth();

// Get OAuth tokens for saving to a persistent store
const tokens = wranglerApi.getOAuthTokens();
if (tokens) {
  const { accessToken, refreshToken, expiry } = tokens;
  // Save tokens to storage...
}

// Restore a session from saved tokens
const restored = await wranglerApi.restoreSession(accessToken, refreshToken, expiry);

// Logout
await wranglerApi.logout();
```

### Deployment

```typescript
const result = await wranglerApi.deploy({
  // Required parameters
  script: './path/to/worker.js',
  
  // Optional parameters
  name: 'worker-name', // defaults to script filename
  config: './wrangler.toml', // path to wrangler.toml
  env: 'production', // environment to deploy to
  compatibilityDate: '2023-10-30', 
  compatibilityFlags: ['nodejs_compat'], 
  vars: { KEY: 'value' }, // environment variables
  minify: true, // minify the Worker code
  sourceMaps: true, // upload source maps
  workersDev: true, // deploy to workers.dev
  routes: ['example.com/*'], // routes for the Worker
  accountId: 'override-account-id' // override the account ID from auth
});

// Result contains
if (result.success) {
  console.log(`Deployment ID: ${result.id}`);
  console.log(`URLs: ${result.urls?.join(', ')}`);
} else {
  console.error(`Error: ${result.error}`);
}
```

### Local Development

```typescript
const stopDev = await wranglerApi.dev({
  // Required parameters
  script: './path/to/worker.js',
  
  // Optional parameters
  config: './wrangler.toml', // path to wrangler.toml
  port: 8787, // local port to listen on
  ip: '127.0.0.1', // local IP to listen on
  inspect: true, // enable inspector
  env: 'dev', // environment to use
  vars: { KEY: 'value' }, // environment variables
  localPersistence: true, // enable local persistence
  compatibilityDate: '2023-10-30',
  compatibilityFlags: ['nodejs_compat']
});

// Stop the development server when done
await stopDev();
```

### Project Initialization

```typescript
await wranglerApi.init({
  // Required parameter
  directory: './my-worker',
  
  // Optional parameters
  name: 'my-worker', // name for the new Worker
  type: 'typescript', // 'javascript', 'typescript', or 'rust'
  git: true // initialize git repository
});
```

### Working with Secrets

```typescript
// Add a secret
const putResult = await wranglerApi.secret('put', {
  name: 'SECRET_NAME',
  value: 'secret-value',
  script: 'worker-name', // required
  env: 'production' // optional
});

// List secrets
const listResult = await wranglerApi.secret('list', {
  script: 'worker-name', // required
  env: 'production' // optional
});

// Delete a secret
const deleteResult = await wranglerApi.secret('delete', {
  name: 'SECRET_NAME',
  script: 'worker-name', // required
  env: 'production' // optional
});
```

### Working with KV Namespaces

```typescript
// List all KV namespaces
const namespaces = await wranglerApi.kv.listNamespaces();

// Create a new KV namespace
const createResult = await wranglerApi.kv.createNamespace({
  namespace: 'MY_NAMESPACE'
});

// Put a value in a KV namespace
const putResult = await wranglerApi.kv.putValue(
  { namespace: 'MY_NAMESPACE', id: 'namespace-id' },
  'key',
  'value'
);

// Get a value from a KV namespace
const getResult = await wranglerApi.kv.getValue(
  { namespace: 'MY_NAMESPACE', id: 'namespace-id' },
  'key'
);

// List keys in a KV namespace
const keysResult = await wranglerApi.kv.listKeys({
  namespace: 'MY_NAMESPACE',
  id: 'namespace-id'
});

// Delete a value from a KV namespace
const deleteValueResult = await wranglerApi.kv.deleteValue(
  { namespace: 'MY_NAMESPACE', id: 'namespace-id' },
  'key'
);

// Delete a KV namespace
const deleteNamespaceResult = await wranglerApi.kv.deleteNamespace({
  namespace: 'MY_NAMESPACE',
  id: 'namespace-id'
});
```

### Working with Durable Objects

```typescript
// List all Durable Objects for a Worker
const objects = await wranglerApi.durableObjects.list({
  script: 'worker-name',
  env: 'production' // optional
});

// Get information about a specific Durable Object
const object = await wranglerApi.durableObjects.get({
  script: 'worker-name',
  className: 'MyDurableObject',
  env: 'production' // optional
});
```

## Working with TypeScript

The Wrangler API includes full TypeScript declarations, making it easy to integrate into TypeScript projects:

```typescript
import { 
  WranglerAPI, 
  DeployOptions, 
  DevOptions, 
  DeployResult, 
  AuthResult 
} from 'wrangler-api';

// Create a custom instance (rather than using the singleton)
const api = new WranglerAPI();

// Type-safe deployment options
const deployOptions: DeployOptions = {
  script: './src/worker.ts',
  name: 'typescript-worker',
  compatibilityDate: '2023-10-30'
};

// Type-safe result handling
const result: DeployResult = await api.deploy(deployOptions);
```

## Examples

For more examples, check out the `examples` directory in the repository:
- `basic-usage.js` - Simple JavaScript usage
- `typescript-usage.ts` - TypeScript usage with more advanced options

## License

MIT