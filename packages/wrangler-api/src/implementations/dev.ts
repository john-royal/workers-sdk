import fs from "fs";
import path from "path";
import {
	ConfigController,
	DevEnv,
	LocalRuntimeController,
	ProxyController,
	RemoteRuntimeController,
} from "wrangler/api";
import * as auth from "../auth";
import type {
	BindingType,
	DevOptions,
	DurableObjectMigration,
	Route,
	WorkerBinding,
} from "../types";
import type {
	AsyncHook,
	Binding,
	CfAccount,
	StartDevWorkerInput,
	Trigger,
} from "wrangler/api";

/**
 * Creates a configuration for local bindings
 */
function prepareDevBindings(options: DevOptions): Record<string, any> {
	const { bindings = [], vars = {}, secrets = {} } = options;

	const result: Record<string, any> = {};

	// Convert bindings to Wrangler's expected format
	for (const binding of bindings) {
		if (!result[binding.name]) {
			switch (binding.type) {
				case "kv_namespace":
					result[binding.name] = {
						type: "kv_namespace",
						id: (binding as any).id,
					};
					break;

				case "r2_bucket":
					result[binding.name] = {
						type: "r2_bucket",
						bucket_name: (binding as any).bucket_name,
						jurisdiction: (binding as any).jurisdiction,
					};
					break;

				case "durable_object":
					result[binding.name] = {
						type: "durable_object_namespace",
						class_name: (binding as any).class_name,
						script_name: (binding as any).script_name,
						environment: (binding as any).environment,
					};
					break;

				case "queue":
					result[binding.name] = {
						type: "queue",
						queue_name: (binding as any).queue_name,
					};
					break;

				case "service":
					result[binding.name] = {
						type: "service",
						service: (binding as any).service,
						environment: (binding as any).environment,
					};
					break;

				case "d1_database":
					result[binding.name] = {
						type: "d1",
						database_id: (binding as any).database_id,
						database_name: (binding as any).database_name,
					};
					break;

				case "vectorize_index":
					result[binding.name] = {
						type: "vectorize",
						index_name: (binding as any).index_name,
					};
					break;

				case "hyperdrive":
					result[binding.name] = {
						type: "hyperdrive",
						id: (binding as any).id,
					};
					break;

				case "analytics_engine":
					result[binding.name] = {
						type: "analytics_engine",
						dataset: (binding as any).dataset,
					};
					break;

				case "browser":
					result[binding.name] = {
						type: "browser",
					};
					break;

				case "ai":
					result[binding.name] = {
						type: "ai",
					};
					break;

				case "environment_variable":
					result[binding.name] = {
						type: "plain_text",
						value: (binding as any).value,
					};
					break;

				case "wasm_module":
					result[binding.name] = {
						type: "wasm_module",
						source: {
							path: (binding as any).path,
						},
					};
					break;

				case "text_blob":
					result[binding.name] = {
						type: "text_blob",
						source: {
							path: (binding as any).path,
						},
					};
					break;

				case "data_blob":
					result[binding.name] = {
						type: "data_blob",
						source: {
							path: (binding as any).path,
						},
					};
					break;
			}
		}
	}

	// Add vars if provided
	if (Object.keys(vars).length > 0) {
		for (const [name, value] of Object.entries(vars)) {
			result[name] = {
				type: "plain_text",
				value: String(value),
			};
		}
	}

	// Add secrets if provided
	if (Object.keys(secrets).length > 0) {
		for (const [name, value] of Object.entries(secrets)) {
			result[name] = {
				type: "plain_text",
				value: String(value),
			};
		}
	}

	return result;
}

/**
 * Convert routes to triggers for the dev server
 */
function prepareDevTriggers(
	routes?: Route[]
): { type: string; pattern?: string }[] {
	if (!routes || routes.length === 0) {
		return [{ type: "workers.dev" }];
	}

	return routes.map((route) => {
		if (typeof route === "string") {
			return { type: "route", pattern: route };
		} else {
			return { type: "route", pattern: route.pattern };
		}
	});
}

/**
 * Create a configuration object for the Wrangler dev server
 */
function prepareDevConfig(options: DevOptions): StartDevWorkerInput {
	const {
		name = path.basename(options.script, path.extname(options.script)),
		compatibilityDate,
		compatibilityFlags = [],
		nodejsCompat = false,
		format = "modules",
		port = 8787,
		ip = "localhost",
		inspect = false,
		local = true,
		localPersistence = false,
		persistenceDirectory,
		watch = true,
		build = true,
		minify = false,
		env,
		routes = [],
		verbose = false,
		upstream,
		remote = false,
		assets,
	} = options;

	// Create the auth hook for remote mode
	const authHook: AsyncHook<CfAccount> = async () => {
		// Make sure we're authenticated
		if (!auth.isAuthenticated()) {
			throw new Error(
				"Authentication required for remote mode. Please authenticate with wranglerApi.login() or wranglerApi.setAuth() first."
			);
		}

		// Get the account ID or throw an error if it's not set
		const accountId = auth.getAccountId();
		if (!accountId) {
			throw new Error(
				"Account ID required for remote mode. Please provide an account ID when authenticating."
			);
		}

		// Get the API token
		const { value: apiToken } = auth.getApiToken() || { value: undefined };
		if (!apiToken) {
			throw new Error(
				"API token required for remote mode. Please authenticate with wranglerApi.login() or wranglerApi.setAuth() first."
			);
		}

		// Return the authentication info that Wrangler needs
		return {
			accountId,
			apiToken,
		};
	};

	// Build a config object that matches Wrangler's StartDevWorkerInput
	return {
		name,
		entrypoint: options.script,
		config: options.config,
		compatibilityDate,
		compatibilityFlags: [
			...compatibilityFlags,
			...(nodejsCompat ? ["nodejs_compat"] : []),
		],
		env,
		bindings: prepareDevBindings(options),
		migrations: options.migrations,
		triggers: prepareDevTriggers(routes),
		build: {
			bundle: build,
			minify,
		},
		dev: {
			inspector: inspect
				? { port: options.port ? options.port + 1 : 9230 }
				: undefined,
			remote,
			// Add auth hook for remote mode
			auth: remote ? authHook : undefined,
			persist: localPersistence
				? persistenceDirectory || ".wrangler/state"
				: undefined,
			logLevel: verbose ? "debug" : "log",
			watch,
			liveReload: options.liveReload,
			server: {
				hostname: ip,
				port,
				secure: options.https,
				httpsKeyPath: options.httpsKeyPath,
				httpsCertPath: options.httpsCertPath,
			},
			origin: upstream ? { hostname: upstream, secure: true } : undefined,
			testScheduled: options.testScheduled,
		},
		assets,
	};
}

/**
 * Create a real DevEnv instance to run the Wrangler development server
 */
function createDevEnv(remote: boolean = false): DevEnv {
	// Create a new configuration controller
	const config = new ConfigController();

	// Create bundler and other controllers
	const runtimes = [new LocalRuntimeController()];

	// Add remote runtime if needed
	if (remote) {
		runtimes.push(new RemoteRuntimeController());
	}

	// Create a proxy controller
	const proxy = new ProxyController();

	// Create and return the DevEnv instance with all controllers
	return new DevEnv({
		config,
		runtimes,
		proxy,
	});
}

/**
 * Start a local development server for a Worker
 *
 * This implementation integrates with Wrangler's dev server
 * functionality to run Workers locally without requiring a wrangler.toml file.
 *
 * @param options Development server options
 * @returns A function to stop the dev server
 */
export async function startDevServer(
	options: DevOptions
): Promise<() => Promise<void>> {
	try {
		// Validate required options
		if (!options.script) {
			throw new Error("Missing required option: script");
		}

		// Check if the script exists
		if (!fs.existsSync(options.script)) {
			throw new Error(`Worker script not found: ${options.script}`);
		}

		// If using remote mode, make sure we're authenticated
		if (options.remote && !auth.isAuthenticated()) {
			throw new Error(
				"Authentication required for remote mode. Please authenticate with wranglerApi.login() or wranglerApi.setAuth() first."
			);
		}

		// Make sure we have a compatibility date
		if (!options.compatibilityDate) {
			console.warn("No compatibility date provided, using current date");
			// Use current date in YYYY-MM-DD format
			options.compatibilityDate = new Date().toISOString().split("T")[0];
		}

		// Prepare configuration for the dev server
		const devConfig = prepareDevConfig(options);

		// Extract common options for logging
		const {
			port = 8787,
			ip = "localhost",
			inspect = false,
			localPersistence = false,
		} = options;

		// Create a real DevEnv instance
		const devEnv = createDevEnv(options.remote);

		// Start the worker with the config
		const worker = await devEnv.startWorker(devConfig);

		// Wait for the worker to be ready
		await worker.ready;

		// Get the actual URL that the server is running on
		const url = await worker.url;

		// Log info about the dev server
		console.log(`[wrangler-api] Dev server started at ${url.toString()}`);
		console.log(`[wrangler-api] Using script: ${options.script}`);
		if (options.env) console.log(`[wrangler-api] Environment: ${options.env}`);
		console.log(
			`[wrangler-api] Compatibility date: ${options.compatibilityDate}`
		);
		if (options.compatibilityFlags?.length) {
			console.log(
				`[wrangler-api] Compatibility flags: ${options.compatibilityFlags.join(", ")}`
			);
		}

		// Show inspector URL if available
		if (inspect) {
			const inspectorUrl = await worker.inspectorUrl;
			console.log(
				`[wrangler-api] Inspector available at ${inspectorUrl.toString()}`
			);
		}

		if (localPersistence)
			console.log(`[wrangler-api] Local persistence enabled`);
		if (options.remote) console.log(`[wrangler-api] Running in remote mode`);

		// Report on bindings
		const bindings = options.bindings || [];
		const bindingsByType = bindings.reduce(
			(acc, binding) => {
				acc[binding.type] = (acc[binding.type] || 0) + 1;
				return acc;
			},
			{} as Record<BindingType, number>
		);

		Object.entries(bindingsByType).forEach(([type, count]) => {
			console.log(`[wrangler-api] ${type} bindings: ${count}`);
		});

		if (Object.keys(options.vars || {}).length) {
			console.log(
				`[wrangler-api] Environment variables: ${Object.keys(options.vars || {}).length}`
			);
		}

		if (Object.keys(options.secrets || {}).length) {
			console.log(
				`[wrangler-api] Secrets: ${Object.keys(options.secrets || {}).length}`
			);
		}

		// Create a function to handle worker disposal and teardown
		return async () => {
			// Dispose of the worker and tear down the DevEnv
			await worker.dispose();
			console.log("[wrangler-api] Dev server stopped");
		};
	} catch (error) {
		// Log the error
		console.error("Error starting dev server:", error);

		// If we can't start the server, return a function that does nothing
		return async () => {
			// No-op
		};
	}
}
