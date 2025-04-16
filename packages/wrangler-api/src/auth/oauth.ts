/**
 * Integration with Wrangler's OAuth flow
 *
 * This module provides a programmatic interface to Wrangler's OAuth authentication logic
 */
import http from "node:http";
import url from "node:url";
import { TextEncoder } from "node:util";
import open from "open";
import { fetch } from "undici";
import { OAUTH } from "./util/constants";
import { getAuthUrl, getClientId, getRevokeUrl, getTokenUrl } from "./util/env";
import {
	generatePKCECodes,
	generateRandomState,
	RECOMMENDED_STATE_LENGTH,
} from "./util/pkce";
import type { AuthResult } from "../types";
import type { AccessContext, AccessToken, RefreshToken, Scope } from "./types";
import type { ParsedUrlQuery } from "node:querystring";

// Current state of the OAuth flow
let oauthState: {
	authorizationCode?: string;
	codeChallenge?: string;
	codeVerifier?: string;
	stateParam?: string;
	accessToken?: AccessToken;
	refreshToken?: RefreshToken;
	scopes?: string[];
} = {};

/**
 * Options for the OAuth login process
 */
export interface LoginOptions {
	/**
	 * Whether to automatically open the browser
	 */
	browser?: boolean;

	/**
	 * OAuth scopes to request
	 */
	scopes?: Scope[];

	/**
	 * Optional callback to handle the OAuth URL
	 * If provided, this will be called instead of opening the browser
	 */
	handleAuthUrl?: (url: string) => Promise<void>;

	/**
	 * Optional callback when auth is complete
	 */
	onComplete?: (result: AuthResult) => void;

	/**
	 * Optional custom client ID
	 */
	clientId?: string;
}

/**
 * OAuth token response from Cloudflare
 */
type TokenResponse =
	| {
			access_token: string;
			expires_in: number;
			refresh_token: string;
			scope: string;
	  }
	| {
			error: string;
	  };

/**
 * Error types for OAuth flow
 */
class OAuthError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "OAuthError";
	}
}

/**
 * Generates the OAuth authorization URL
 */
async function generateAuthorizationUrl(scopes: string[]): Promise<string> {
	// Generate PKCE codes and state parameter for security
	const { codeChallenge, codeVerifier } = await generatePKCECodes();
	const stateParam = generateRandomState(RECOMMENDED_STATE_LENGTH);

	// Store in module state
	oauthState = {
		...oauthState,
		codeChallenge,
		codeVerifier,
		stateParam,
	};

	// Build the authorization URL with all required parameters
	return (
		getAuthUrl() +
		`?response_type=code&` +
		`client_id=${encodeURIComponent(getClientId())}&` +
		`redirect_uri=${encodeURIComponent(OAUTH.CALLBACK_URL)}&` +
		// Add offline_access for refresh token capability
		`scope=${encodeURIComponent([...scopes, "offline_access"].join(" "))}&` +
		`state=${stateParam}&` +
		`code_challenge=${encodeURIComponent(codeChallenge)}&` +
		`code_challenge_method=S256`
	);
}

/**
 * Validates the state parameter in the authorization response
 */
function validateAuthorizationResponse(query: ParsedUrlQuery): boolean {
	console.log('Validating authorization response...');
	
	// Check for error response
	if (query.error) {
		const errorMessage = Array.isArray(query.error)
			? query.error[0]
			: query.error;
		const errorDescription = query.error_description ? 
			(Array.isArray(query.error_description) ? query.error_description[0] : query.error_description) 
			: '';
			
		throw new OAuthError(`Authentication error: ${errorMessage}${errorDescription ? ` - ${errorDescription}` : ''}`);
	}

	// Check for authorization code
	const code = query.code;
	if (!code) {
		console.error('No authorization code found in the response');
		return false;
	}

	// Validate state parameter to protect against CSRF
	const stateParam = query.state;
	const expectedState = oauthState.stateParam;
	
	if (!stateParam) {
		console.error('No state parameter found in the response');
		throw new OAuthError("Missing state parameter. Possible security issue or misconfiguration.");
	}
	
	const receivedState = Array.isArray(stateParam) ? stateParam[0] : stateParam;
	
	if (receivedState !== expectedState) {
		console.error(`State parameter mismatch. Expected: ${expectedState}, Received: ${receivedState}`);
		throw new OAuthError("Invalid state parameter. Possible security issue.");
	}

	// Store the authorization code
	const authCode = Array.isArray(code) ? code[0] : code;
	console.log(`Authorization code received: ${authCode.substring(0, 5)}...`);
	oauthState.authorizationCode = authCode;
	return true;
}

/**
 * Exchanges an authorization code for an access token
 */
async function exchangeCodeForToken(): Promise<AccessContext> {
	const { authorizationCode, codeVerifier } = oauthState;

	if (!authorizationCode || !codeVerifier) {
		throw new OAuthError("Missing authorization code or code verifier");
	}

	console.log(`Exchanging auth code for token with code_verifier: ${codeVerifier.slice(0, 10)}...`);

	// Create body parameters - order matters for some OAuth servers!
	const params = new URLSearchParams();
	params.append('grant_type', 'authorization_code');
	params.append('code', authorizationCode);
	params.append('redirect_uri', OAUTH.CALLBACK_URL);
	params.append('client_id', getClientId());
	params.append('code_verifier', codeVerifier);

	try {
		// Make the token request
		const response = await fetch(getTokenUrl(), {
			method: "POST",
			body: params.toString(),
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
			},
		});

		// Check for non-OK responses and handle them
		if (!response.ok) {
			// Try to parse response as JSON first
			let errorMessage = `Token exchange failed with status: ${response.status}`;
			
			try {
				// Attempt to get more detailed error information
				const responseText = await response.text();
				console.error(`Token exchange error response: ${responseText}`);
				
				try {
					const errorData = JSON.parse(responseText);
					if (errorData.error) {
						errorMessage = `Token exchange failed: ${errorData.error}`;
						if (errorData.error_description) {
							errorMessage += ` - ${errorData.error_description}`;
						}
					}
				} catch (jsonError) {
					// If not valid JSON, use the raw text
					if (responseText) {
						errorMessage = `Token exchange failed: ${responseText}`;
					}
				}
			} catch (textError) {
				// If we can't get the text, fall back to the status code
			}
			
			throw new OAuthError(errorMessage);
		}

		// Parse the response
		const responseText = await response.text();
		console.log(`Token exchange response: ${responseText.slice(0, 50)}...`);
		
		let json: TokenResponse;
		try {
			json = JSON.parse(responseText) as TokenResponse;
		} catch (e) {
			throw new OAuthError(`Failed to parse token response: ${e instanceof Error ? e.message : String(e)}`);
		}
		
		if ("error" in json) {
			throw new OAuthError(`Token exchange failed: ${json.error}`);
		}

		const { access_token, expires_in, refresh_token, scope } = json;

		// Store tokens in state
		const expiryDate = new Date(Date.now() + expires_in * 1000);
		const accessToken: AccessToken = {
			value: access_token,
			expiry: expiryDate.toISOString(),
		};

		const refreshToken: RefreshToken = {
			value: refresh_token,
		};

		// Parse scopes
		const scopes = scope ? scope.split(" ") : [];

		// Update state and clear authorization-specific fields
		oauthState = {
			...oauthState,
			accessToken,
			refreshToken,
			scopes,
			// Clear these fields as they're no longer needed
			authorizationCode: undefined,
			codeChallenge: undefined,
			codeVerifier: undefined,
			stateParam: undefined,
		};

		console.log('Successfully exchanged auth code for tokens');

		// Return the access context
		return {
			token: accessToken,
			refreshToken,
			scopes,
		};
	} catch (error) {
		if (error instanceof OAuthError) {
			throw error;
		}
		throw new OAuthError(
			`Failed to exchange authorization code for token: ${error instanceof Error ? error.message : String(error)}`
		);
	}
}

/**
 * Refreshes an access token using a refresh token
 */
export async function refreshOAuthToken(): Promise<AuthResult> {
	try {
		console.log('Attempting to refresh OAuth token...');
		
		// Need a refresh token to continue
		if (!oauthState.refreshToken?.value) {
			console.error('No refresh token available');
			return {
				success: false,
				error: "No refresh token available",
			};
		}

		// Create body parameters - order matters for some OAuth servers
		const params = new URLSearchParams();
		params.append('grant_type', 'refresh_token');
		params.append('refresh_token', oauthState.refreshToken.value);
		params.append('client_id', getClientId());

		console.log(`Using client ID: ${getClientId()}`);
		console.log(`Using token URL: ${getTokenUrl()}`);
		console.log('Refresh token payload prepared');

		// Make the token request
		const response = await fetch(getTokenUrl(), {
			method: "POST",
			body: params.toString(),
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
			},
		});

		// Handle errors
		if (!response.ok) {
			const text = await response.text();
			console.error(`Token refresh failed with status ${response.status}: ${text}`);
			
			let errorMessage = `Token refresh failed with status ${response.status}`;
			try {
				const errorData = JSON.parse(text) as { error: string; error_description?: string };
				errorMessage = `Token refresh failed: ${errorData.error}`;
				if (errorData.error_description) {
					errorMessage += ` - ${errorData.error_description}`;
				}
				
				// Special handling for known errors
				if (errorData.error === 'invalid_grant') {
					// Clear OAuth state since the token is invalid
					oauthState = {};
					errorMessage += '. Please log in again.';
				}
			} catch {
				// If parsing fails, use the status-based message
				if (text) {
					errorMessage = `Token refresh failed: ${text}`;
				}
			}
			
			return {
				success: false,
				error: errorMessage,
			};
		}

		// Parse the response
		const responseText = await response.text();
		console.log(`Token refresh response: ${responseText.slice(0, 50)}...`);
		
		let json: TokenResponse;
		try {
			json = JSON.parse(responseText) as TokenResponse;
		} catch (e) {
			console.error(`Failed to parse token refresh response: ${e instanceof Error ? e.message : String(e)}`);
			return {
				success: false,
				error: `Failed to parse token refresh response: ${e instanceof Error ? e.message : String(e)}`,
			};
		}
		
		if ("error" in json) {
			console.error(`Token refresh failed: ${json.error}`);
			
			// Clear OAuth state for certain errors
			if (json.error === 'invalid_grant' || json.error === 'invalid_token') {
				oauthState = {};
			}
			
			return {
				success: false,
				error: `Token refresh failed: ${json.error}`,
			};
		}

		const { access_token, expires_in, refresh_token, scope } = json;

		// Update tokens in state
		const expiryDate = new Date(Date.now() + expires_in * 1000);
		oauthState.accessToken = {
			value: access_token,
			expiry: expiryDate.toISOString(),
		};

		if (refresh_token) {
			oauthState.refreshToken = {
				value: refresh_token,
			};
		}

		// Update scopes if provided
		if (scope) {
			oauthState.scopes = scope.split(" ");
		}

		console.log('Token refresh successful');
		return {
			success: true,
			accessToken: access_token,
			refreshToken: refresh_token,
		};
	} catch (error) {
		console.error(`Failed to refresh token: ${error instanceof Error ? error.message : String(error)}`);
		return {
			success: false,
			error: `Failed to refresh token: ${error instanceof Error ? error.message : String(error)}`,
		};
	}
}

/**
 * Revokes an OAuth token
 */
export async function logoutOAuth(): Promise<AuthResult> {
	try {
		// Need a refresh token to revoke
		if (!oauthState.refreshToken?.value) {
			// If we have no token, consider logout successful
			oauthState = {};
			return { success: true };
		}

		// Create revocation request
		const body =
			`client_id=${encodeURIComponent(getClientId())}&` +
			`token_type_hint=refresh_token&` +
			`token=${encodeURIComponent(oauthState.refreshToken.value)}`;

		// Make the revocation request
		const response = await fetch(getRevokeUrl(), {
			method: "POST",
			body,
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
			},
		});

		// Clear state regardless of response
		oauthState = {};

		// Check response
		if (!response.ok) {
			return {
				success: false,
				error: `Token revocation failed with status: ${response.status}`,
			};
		}

		return { success: true };
	} catch (error) {
		// Clear state even if revocation fails
		oauthState = {};

		return {
			success: false,
			error: `Failed to revoke token: ${error instanceof Error ? error.message : String(error)}`,
		};
	}
}

/**
 * Fetch the user's account ID using the access token
 */
async function fetchAccountId(accessToken: string): Promise<string | undefined> {
	try {
		const response = await fetch('https://api.cloudflare.com/client/v4/accounts?page=1&per_page=20', {
			headers: {
				'Authorization': `Bearer ${accessToken}`,
				'Content-Type': 'application/json',
			}
		});

		if (!response.ok) {
			console.error(`Failed to fetch account ID: ${response.status} ${response.statusText}`);
			return undefined;
		}

		const data = await response.json();
		if (!data.success || !data.result || !data.result.length) {
			console.error('No accounts found in response');
			return undefined;
		}

		// Return the first account ID
		return data.result[0].id;
	} catch (error) {
		console.error(`Error fetching account ID: ${error instanceof Error ? error.message : String(error)}`);
		return undefined;
	}
}

/**
 * Programmatic implementation of OAuth login flow
 */
export async function loginWithOAuth(
	options: LoginOptions = {}
): Promise<AuthResult> {
	try {
		// Clear any existing OAuth state
		oauthState = {};
		
		console.log('Starting OAuth login flow...');
		
		// Generate auth URL with requested scopes
		const scopes = options.scopes || [
			"account:read",
			"user:read",
			"workers:write",
			"workers_kv:write",
			"workers_routes:write",
			"workers_scripts:write",
			"workers_tail:read",
			"d1:write",
			"pages:write",
			"zone:read",
		];

		const authUrl = await generateAuthorizationUrl(scopes);
		console.log(`Generated auth URL: ${authUrl.substring(0, 50)}...`);
		console.log(`Using client ID: ${getClientId()}`);
		console.log(`Using callback URL: ${OAUTH.CALLBACK_URL}`);
		console.log(`State parameter: ${oauthState.stateParam}`);
		console.log(`Code verifier: ${oauthState.codeVerifier?.substring(0, 10)}...`);
		console.log(`Code challenge: ${oauthState.codeChallenge}`);

		// Start local server to handle callback
		let server: http.Server;

		// Promise for server timeout
		let timeoutId: NodeJS.Timeout;
		const timeoutPromise = new Promise<AccessContext>((_, reject) => {
			timeoutId = setTimeout(() => {
				console.log('OAuth login timed out');
				server?.close();
				reject(new Error("Login timed out. Please try again."));
			}, OAUTH.LOGIN_TIMEOUT);
		});

		// Promise for the OAuth flow
		const authPromise = new Promise<AccessContext>((resolve, reject) => {
			server = http.createServer(async (req, res) => {
				try {
					// Only process GET requests
					if (req.method !== "GET") {
						res.end("OK");
						return;
					}

					// Make sure we have a URL
					if (!req.url) {
						res.end("Error: No URL in request");
						return;
					}

					console.log(`Received callback request: ${req.url}`);

					// Parse the URL
					const { pathname, query } = url.parse(req.url, true);

					// Only handle the callback path
					if (pathname === "/oauth/callback") {
						let hasAuthCode = false;

						try {
							hasAuthCode = validateAuthorizationResponse(query);
						} catch (err) {
							console.error('Authorization validation error:', err);
							// Handle access denied error
							res.writeHead(307, {
								Location: OAUTH.DENIED_URL,
							});
							res.end();
							reject(err);
							return;
						}

						if (!hasAuthCode) {
							console.error('No authorization code received');
							res.end("Error: No authorization code received");
							reject(new Error("No authorization code received"));
							return;
						}

						try {
							// Exchange auth code for token
							console.log('Exchanging authorization code for token...');
							const result = await exchangeCodeForToken();
							console.log('Token exchange successful');

							// Redirect to success page
							res.writeHead(307, {
								Location: OAUTH.SUCCESS_URL,
							});
							res.end();

							// Clear timeout and resolve
							clearTimeout(timeoutId);
							resolve(result);
						} catch (err) {
							console.error('Token exchange error:', err);
							res.end(
								`Error: ${err instanceof Error ? err.message : String(err)}`
							);
							reject(err);
						}
					} else {
						res.end("Invalid path");
					}
				} catch (err) {
					console.error('Server error:', err);
					res.end(
						`Server error: ${err instanceof Error ? err.message : String(err)}`
					);
					reject(err);
				}
			});

			// Start listening on the callback port
			server.listen(OAUTH.CALLBACK_PORT, "localhost", () => {
				console.log(`OAuth callback server listening on port ${OAUTH.CALLBACK_PORT}`);
			});

			// Add error handler
			server.on("error", (err) => {
				console.error('Server error:', err);
				reject(new Error(`Server error: ${err.message}`));
			});

			// Add close handler to ensure proper cleanup
			server.on("close", () => {
				console.log('OAuth callback server closed');
				clearTimeout(timeoutId);
			});
		});

		// Open the browser or call the provided handler
		console.log('Opening browser or handling auth URL...');
		if (options.handleAuthUrl) {
			await options.handleAuthUrl(authUrl);
		} else if (options.browser !== false) {
			await open(authUrl);
		} else {
			console.log(`Please visit this URL to login: ${authUrl}`);
		}

		// Wait for either the auth flow to complete or timeout
		try {
			const result = await Promise.race([authPromise, timeoutPromise]);
			console.log('OAuth flow completed successfully');

			// Clean up server when done
			server.close();

			// Get account ID if we have an access token
			let accountId: string | undefined;
			if (result.token?.value) {
				console.log('Fetching account ID...');
				accountId = await fetchAccountId(result.token.value);
				if (accountId) {
					console.log(`Account ID: ${accountId}`);
				} else {
					console.warn('Could not fetch account ID');
				}
			}

			// Call completion callback if provided
			if (options.onComplete) {
				options.onComplete({
					success: true,
					accessToken: result.token?.value,
					refreshToken: result.refreshToken?.value,
					accountId,
				});
			}

			return {
				success: true,
				accessToken: result.token?.value,
				refreshToken: result.refreshToken?.value,
				accountId,
			};
		} catch (error) {
			// Clean up server on error
			server.close();
			console.error('OAuth flow failed:', error);

			// Return error result
			const errorResult = {
				success: false,
				error: error instanceof Error ? error.message : String(error),
			};

			// Call completion callback if provided
			if (options.onComplete) {
				options.onComplete(errorResult);
			}

			return errorResult;
		}
	} catch (error) {
		console.error('OAuth login failed:', error);
		return {
			success: false,
			error: `OAuth login failed: ${error instanceof Error ? error.message : String(error)}`,
		};
	}
}

/**
 * Checks if the access token has expired
 */
export function isAccessTokenExpired(): boolean {
	const { accessToken } = oauthState;
	if (!accessToken || !accessToken.expiry) {
		return true;
	}

	return new Date() >= new Date(accessToken.expiry);
}

/**
 * Get the current access token
 */
export function getAccessToken(): AccessToken | undefined {
	return oauthState.accessToken;
}

/**
 * Get the current refresh token
 */
export function getRefreshToken(): RefreshToken | undefined {
	return oauthState.refreshToken;
}

/**
 * Get the current OAuth scopes
 */
export function getOAuthScopes(): string[] | undefined {
	return oauthState.scopes;
}

/**
 * Clear OAuth state
 */
export function clearOAuthState(): void {
	oauthState = {};
}

/**
 * Restore an OAuth session from saved tokens
 * 
 * @param accessToken The access token value
 * @param refreshToken The refresh token value
 * @param expiryDate Optional expiration date for the access token (ISO string)
 * @param scopes Optional scopes for the access token
 * @returns Whether the restoration was successful
 */
export async function restoreOAuthSession(
	accessToken: string,
	refreshToken: string,
	expiryDate?: string,
	scopes?: string[]
): Promise<AuthResult> {
	try {
		console.log('Restoring OAuth session from saved tokens...');
		
		// Clear any existing OAuth state
		clearOAuthState();
		
		// Set up the expiry date - if not provided, check token validity immediately
		let expirationDate: string;
		if (expiryDate) {
			expirationDate = expiryDate;
		} else {
			// Default to a short expiry to force validation
			expirationDate = new Date(Date.now() + 60 * 1000).toISOString();
		}
		
		// Store the tokens in the OAuth state
		oauthState = {
			accessToken: {
				value: accessToken,
				expiry: expirationDate
			},
			refreshToken: {
				value: refreshToken
			},
			scopes: scopes || []
		};
		
		// Validate the tokens by fetching the account ID
		try {
			const accountId = await fetchAccountId(accessToken);
			
			if (accountId) {
				console.log(`Restored OAuth session successfully for account ID: ${accountId}`);
				return {
					success: true,
					accessToken,
					refreshToken,
					accountId
				};
			}
			
			// If we couldn't get an account ID, the token might be expired
			// Try to refresh the token
			console.log('Access token validation failed. Attempting to refresh token...');
			const refreshResult = await refreshOAuthToken();
			
			if (refreshResult.success) {
				console.log('Token refresh successful. OAuth session restored.');
				return refreshResult;
			} else {
				console.error('Token refresh failed. Unable to restore OAuth session:', refreshResult.error);
				clearOAuthState();
				return {
					success: false,
					error: `Failed to restore OAuth session: ${refreshResult.error}`
				};
			}
		} catch (error) {
			console.error('Error validating restored tokens:', error);
			clearOAuthState();
			return {
				success: false,
				error: `Failed to validate restored OAuth session: ${error instanceof Error ? error.message : String(error)}`
			};
		}
	} catch (error) {
		console.error('Error restoring OAuth session:', error);
		clearOAuthState();
		return {
			success: false,
			error: `Failed to restore OAuth session: ${error instanceof Error ? error.message : String(error)}`
		};
	}
}
