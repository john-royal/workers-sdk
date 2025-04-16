# Wrangler API

A programmatic API for deploying and managing Cloudflare Workers.

This package provides a JavaScript/TypeScript API for working with Cloudflare Workers, allowing you to integrate Wrangler functionality directly into your applications, build tools, or CI/CD pipelines.

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

// Set authentication credentials
await wranglerApi.setAuth({
  apiToken: 'your-cloudflare-api-token',
  accountId: 'your-cloudflare-account-id' // optional
});

// Deploy a worker
const result = await wranglerApi.deploy({
  script: './worker/index.js',
  name: 'my-worker',
  compatibilityDate: '2023-05-18'
});

if (result.success) {
  console.log(`Worker deployed successfully: ${result.urls?.join(', ')}`);
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

## API Reference

### Authentication

```typescript
// Set authentication credentials
await wranglerApi.setAuth({
  apiToken: 'your-cloudflare-api-token',
  accountId: 'your-cloudflare-account-id' // optional
});

// Or authenticate with OAuth
const authResult = await wranglerApi.login();
```

### Deployment

```typescript
const result = await wranglerApi.deploy({
  script: './path/to/worker.js',
  name: 'worker-name',
  config: './wrangler.toml', // optional
  env: 'production', // optional
  compatibilityDate: '2023-05-18', // optional
  compatibilityFlags: ['nodejs_compat'], // optional
  vars: { KEY: 'value' }, // optional
  minify: true, // optional
  sourceMaps: true, // optional
  workersDev: true, // optional
  routes: ['example.com/*'] // optional
});
```

### Local Development

```typescript
const stopDev = await wranglerApi.dev({
  script: './path/to/worker.js',
  config: './wrangler.toml', // optional
  port: 8787, // optional
  ip: '127.0.0.1', // optional
  inspect: true, // optional
  localPersistence: true, // optional
  vars: { KEY: 'value' } // optional
});

// Stop the dev server
await stopDev();
```

### Project Initialization

```typescript
await wranglerApi.init({
  directory: './my-worker',
  name: 'my-worker', // optional
  type: 'typescript', // optional: 'javascript', 'typescript', or 'rust'
  git: true // optional
});
```

### Working with Secrets

```typescript
// Add a secret
await wranglerApi.secret('put', {
  name: 'SECRET_NAME',
  value: 'secret-value',
  script: 'worker-name', // optional
  env: 'production' // optional
});

// List secrets
const secretsResult = await wranglerApi.secret('list', {
  script: 'worker-name',
  env: 'production' // optional
});

// Delete a secret
await wranglerApi.secret('delete', {
  name: 'SECRET_NAME',
  script: 'worker-name',
  env: 'production' // optional
});
```

### Working with KV Namespaces

```typescript
// List namespaces
const namespaces = await wranglerApi.kv.listNamespaces();

// Create a namespace
const createResult = await wranglerApi.kv.createNamespace({
  namespace: 'MY_NAMESPACE'
});

// Put a value
await wranglerApi.kv.putValue(
  { namespace: 'MY_NAMESPACE', id: 'namespace-id' },
  'key',
  'value'
);

// Get a value
const getResult = await wranglerApi.kv.getValue(
  { namespace: 'MY_NAMESPACE', id: 'namespace-id' },
  'key'
);

// List keys
const keysResult = await wranglerApi.kv.listKeys({
  namespace: 'MY_NAMESPACE',
  id: 'namespace-id'
});

// Delete a value
await wranglerApi.kv.deleteValue(
  { namespace: 'MY_NAMESPACE', id: 'namespace-id' },
  'key'
);

// Delete a namespace
await wranglerApi.kv.deleteNamespace({
  namespace: 'MY_NAMESPACE',
  id: 'namespace-id'
});
```

### Working with Durable Objects

```typescript
// List Durable Objects
const objects = await wranglerApi.durableObjects.list({
  script: 'worker-name',
  env: 'production' // optional
});

// Get a specific Durable Object
const object = await wranglerApi.durableObjects.get({
  script: 'worker-name',
  className: 'MyDurableObject',
  env: 'production' // optional
});
```

## License

MIT