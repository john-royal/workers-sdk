# Wrangler API Documentation

Welcome to the Wrangler API documentation. This package provides a programmatic interface to Cloudflare Workers functionality, allowing you to automate deployments, manage resources, and integrate Workers into your own tools and services.

## Getting Started

### Installation

```bash
npm install wrangler-api
```

### Basic Usage

```typescript
import { wranglerApi } from 'wrangler-api';

// Set authentication
await wranglerApi.setAuth({
  apiToken: process.env.CLOUDFLARE_API_TOKEN,
  accountId: process.env.CLOUDFLARE_ACCOUNT_ID // optional
});

// Deploy a Worker
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
```

## Core API

### Authentication

- [Authentication Guide](./authentication.md)
- [API Keys vs OAuth](./auth-methods.md)

### Deployment

- [Deploying Workers](./deployment.md)
- [Configuration Options](./config-options.md)
- [Environment Variables and Secrets](./environment.md)

### Development

- [Local Development](./local-development.md)
- [Testing Workers](./testing.md)

## Resource Management

### Storage

- [KV Namespaces](./kv.md)
- [R2 Storage](./r2.md)
- [D1 Databases](./d1.md)

### Compute

- [Durable Objects](./durable-objects.md)
- [Workers](./workers.md)
- [Service Bindings](./service-bindings.md)

## Advanced Topics

- [CI/CD Integration](./ci-cd.md)
- [Multi-worker Projects](./multi-worker.md)
- [Migration from Wrangler CLI](./migration.md)
- [Error Handling](./error-handling.md)
- [Logging and Debugging](./logging.md)

## API Reference

- [Full API Reference](./api-reference.md)
- [Type Definitions](./types.md)
- [Error Codes](./error-codes.md)

## Contributing

- [Development Guide](./development.md)
- [Testing](./testing-guide.md)
- [Release Process](./release-process.md)