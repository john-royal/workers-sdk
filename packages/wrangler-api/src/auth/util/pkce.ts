/**
 * PKCE (Proof Key for Code Exchange) utilities
 * 
 * Based on Wrangler's implementation with some adjustments for better
 * programmatic usage.
 */
import { webcrypto as crypto } from 'node:crypto';

/**
 * Character set to generate code verifier defined in rfc7636.
 */
export const PKCE_CHARSET =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';

/**
 * The maximum length for a code verifier for the best security.
 * Please note the NOTE section of RFC 7636 § 4.1 - the length must be >= 43,
 * but <= 128, **after** base64 url encoding. This means 32 code verifier bytes
 * encoded will be 43 bytes, or 96 bytes encoded will be 128 bytes.
 */
const RECOMMENDED_CODE_VERIFIER_LENGTH = 96;

/**
 * A sensible length for the state parameter, for anti-csrf.
 */
export const RECOMMENDED_STATE_LENGTH = 32;

/**
 * Result of PKCE code generation
 */
export interface PKCECodes {
  codeChallenge: string;
  codeVerifier: string;
}

/**
 * Implements *base64url-encode* (RFC 4648 § 5) without padding, which is NOT
 * the same as regular base64 encoding.
 */
export function base64urlEncode(value: string | ArrayBuffer): string {
  // Handle both string and ArrayBuffer inputs
  const buffer = typeof value === 'string' ? new TextEncoder().encode(value) : new Uint8Array(value);
  
  // Convert to base64
  let base64 = Buffer.from(buffer).toString('base64');
  
  // Convert to base64url encoding
  base64 = base64.replace(/\+/g, '-');
  base64 = base64.replace(/\//g, '_');
  base64 = base64.replace(/=/g, '');
  
  return base64;
}

/**
 * Generates a random state to be passed for anti-csrf protection.
 * 
 * @param length Length of the state to generate
 * @returns Random state string
 */
export function generateRandomState(length: number): string {
  const randomBytes = new Uint8Array(length);
  crypto.getRandomValues(randomBytes);
  
  return Array.from(randomBytes)
    .map((num: number) => PKCE_CHARSET[num % PKCE_CHARSET.length])
    .join('');
}

/**
 * Generates a code_verifier and code_challenge, as specified in rfc7636.
 * 
 * @returns Promise resolving to code verifier and challenge
 */
export async function generatePKCECodes(): Promise<PKCECodes> {
  // Generate random code verifier (directly as a string)
  const randomBytes = new Uint8Array(RECOMMENDED_CODE_VERIFIER_LENGTH);
  crypto.getRandomValues(randomBytes);
  
  const codeVerifier = Array.from(randomBytes)
    .map(byte => PKCE_CHARSET[byte % PKCE_CHARSET.length])
    .join('');
  
  // Generate code challenge using SHA-256
  const digestBuffer = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(codeVerifier)
  );
  
  // Base64url encode the digest
  const codeChallenge = base64urlEncode(digestBuffer);
  
  return { codeChallenge, codeVerifier };
}