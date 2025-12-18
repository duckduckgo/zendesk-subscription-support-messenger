import { SignJWT } from 'jose';
import { randomUUID } from 'crypto';

/**
 * Generates a JWT token for Zendesk user authentication.
 *
 * This function creates a privacy-preserving JWT with:
 * - A globally unique external_id (UUID-based)
 * - A generic name ("DuckDuckGo User")
 * - No email address
 * - 1 hour expiration
 *
 * @param sharedSecret - The shared secret configured in Zendesk
 * @returns Object containing the JWT token and the generated external_id
 * @throws Error if sharedSecret is not provided or JWT generation fails
 */
export async function generateZendeskJWT(sharedSecret: string): Promise<{
  token: string;
  externalId: string;
}> {
  if (!sharedSecret) {
    throw new Error('Shared secret is required for JWT generation');
  }

  // Generate a privacy-preserving, globally unique external_id
  // External ID must be globally unique at the account level
  // Using UUID v4 ensures global uniqueness
  const externalId = `ddguser-${randomUUID()}`;

  // Create JWT payload with external_id and name
  // Name is always "DuckDuckGo User" for privacy
  // Email is intentionally omitted per user requirement
  const payload = {
    external_id: externalId,
    scope: 'user',
    name: 'DuckDuckGo User',
  };

  // Create JWT token
  // Token expires in 1 hour
  // Zendesk requires a 'kid' (Key ID) in the JWT header for key identification
  // The kid value must match what's configured in your Zendesk account settings
  // For shared secret authentication, check your Zendesk admin panel for the required kid value
  const secret = new TextEncoder().encode(sharedSecret);

  const protectedHeader: { alg: string; kid?: string } = {
    alg: 'HS256',
    kid: process.env.ZENDESK_JWT_KID,
  };

  const token = await new SignJWT(payload)
    .setProtectedHeader(protectedHeader)
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(secret);

  return {
    token,
    externalId,
  };
}
