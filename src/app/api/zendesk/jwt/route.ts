import { NextRequest, NextResponse } from 'next/server';
import { generateZendeskJWT } from '@/utils/generate-zendesk-jwt';

/**
 * JWT Generation API Route for Zendesk Authentication
 *
 * This endpoint generates a JWT token for Zendesk user authentication.
 * The JWT is signed with the shared secret configured in Zendesk.
 *
 * Privacy-preserving:
 * - No user email required (external_id only)
 * - External ID is globally unique at account level
 * - Token expires after 1 hour
 * - Shared secret never exposed to client
 *
 * According to Zendesk documentation:
 * https://support.zendesk.com/hc/en-us/articles/4411666638746-Setting-up-user-authentication-for-messaging
 * https://developer.zendesk.com/api-reference/widget-messaging/web/authentication/#login
 *
 * @param request - Next.js request object
 * @returns JWT token response or error
 */
export async function POST(request: NextRequest) {
  console.log('### route.ts', {
    request,
  });

  try {
    // Get shared secret from environment variable
    const sharedSecret = process.env.ZENDESK_SHARED_SECRET;

    if (!sharedSecret) {
      return NextResponse.json(
        { error: 'ZENDESK_SHARED_SECRET is not configured' },
        { status: 500 },
      );
    }

    // Generate JWT using shared utility function
    const { token, externalId } = await generateZendeskJWT(sharedSecret);

    return NextResponse.json(
      {
        token,
        externalId, // Return the externalId used for reference
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('JWT generation error:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate JWT token',
        // In production, don't expose error details
        ...(process.env.NODE_ENV === 'development' && {
          details: String(error),
        }),
      },
      { status: 500 },
    );
  }
}
