# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build, Lint, Test Commands
- Build: `pnpm build`
- Lint: `pnpm check:lint` or `pnpm fix` (to automatically fix issues)
- Type check: `pnpm check:type`
- Run all tests: `pnpm test`
- Run tests in watch mode: `pnpm test:watch`
- Run a single test: `pnpm -F <package> vitest run <test-file-name>`
- E2E tests: `pnpm test:e2e`

## Code Style Guidelines
- Use tabs, not spaces (printWidth: 80, singleQuote: false)
- Import order: Built-in modules → Third-party → Parent directories → Current directory
- Use TypeScript with strict type checking; avoid `any` and non-null assertions
- Use named exports; use consistent type imports
- Error handling: Use `@typescript-eslint/no-floating-promises` for async functions
- Naming: Follow object-verb pattern for commands (e.g., `d1 create`)
- Use PNPM as package manager (Node ≥18.20.0, PNPM ≥9.12.0)