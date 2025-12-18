# Zendesk JWT Authentication Setup Guide

This guide explains how to generate JWTs for Zendesk user authentication in your Next.js application.

## Overview

Zendesk allows you to authenticate users with your own user directory by issuing JWT credentials during the login flow. This enables you to:

- Associate users with your own user directory
- Maintain user identity across sessions
- Provide personalized support experiences

## Prerequisites

1. **Zendesk Account**: You need a Zendesk account with messaging enabled
2. **JWT Secret Key**: Configure a shared secret in your Zendesk account settings
3. **User Data**: Access to authenticated user information (name, email, unique ID)

## Setup Steps

### 1. Configure Zendesk JWT Secret

The `ZENDESK_JWT_SECRET` is a shared secret that you configure in your Zendesk account. Follow these steps to set it up:

1. **Log in to your Zendesk admin panel**
   - You need admin access to configure this setting

2. **Navigate to the Messaging settings:**
   - Click the **Admin** icon (gear) in the sidebar
   - Go to **Channels** → **Messaging and social** → **Messaging**
   - Or alternatively: **Admin** → **Channels** → **Messaging** → **Settings**

3. **Enable JWT authentication:**
   - In the Messaging settings, open the **Security** tab
   - Enable **"JWT authentication"** or **"JWT SSO"**
   - You'll see a **"Shared secret"** field appear

4. **Set your shared secret:**
   - Enter a strong, random secret (you can generate one yourself)
   - **Important**: Save this value securely - you'll need to use it as your `ZENDESK_JWT_SECRET` environment variable
   - The same secret must be used in both Zendesk and your application
   - Use a strong, random string (recommended: 32+ characters)

5. **Save the configuration**
   - Click **Save** to apply the changes

**Note**: You create this secret yourself - Zendesk doesn't generate it for you. Make sure to:

- Use a strong, random string
- Keep it secure and never commit it to version control
- Use different secrets for development and production environments

**If you can't find the setting:**
The exact path may vary depending on your Zendesk plan or version. Try these alternative locations:

- **Admin** → **Apps and integrations** → **Messaging** → **Settings** → **Security**
- **Admin** → **Account** → **Security** → **SSO** → **JWT**

If you still can't find it, your Zendesk plan may not include JWT authentication for messaging, or it may be under a different name (e.g., "SSO secret" or "Authentication secret").

> **Note**: The navigation paths provided are general guidance. For the most accurate and up-to-date instructions, refer to the [official Zendesk documentation](https://developer.zendesk.com/api-reference/widget-messaging/web/authentication/#login) or your Zendesk admin panel.

### 2. Environment Variables

Add the following environment variable to your `.env.local` file:

```bash
# Zendesk Configuration
NEXT_PUBLIC_ZENDESK_SCRIPT_URL=https://static.zdassets.com/ekr/snippet.js?key=YOUR_WIDGET_KEY
ZENDESK_JWT_SECRET=your_shared_secret_from_zendesk
```

**Important Security Notes:**

- `ZENDESK_JWT_SECRET` should **NOT** be prefixed with `NEXT_PUBLIC_` (it's server-side only)
- Never commit `.env.local` to version control
- Use different secrets for development and production

### 3. JWT Token Structure

The JWT token must contain the following claims:

```typescript
{
  name: string; // User's display name
  email: string; // User's email address
  external_id: string; // Unique identifier for the user in your system
  iat: number; // Issued at timestamp (automatically added)
  exp: number; // Expiration timestamp (automatically added)
}
```

**Token Expiration**: Tokens expire after 1 hour by default. You can adjust this when implementing your JWT generation endpoint.

> **Note**: The JWT claims structure (`name`, `email`, `external_id`) should be verified against the [official Zendesk documentation](https://developer.zendesk.com/api-reference/widget-messaging/web/authentication/#login) to ensure compatibility with your Zendesk account configuration.

### 4. API Route

> **Note**: This section provides guidance for implementing JWT generation. The API route described below is a reference example and does not currently exist in this codebase.

The JWT generation API route should be located at:

- **Path**: `/api/zendesk/jwt`
- **Method**: `POST`
- **File**: `src/app/api/zendesk/jwt/route.ts` (to be created)

**Request Body:**

```json
{
  "name": "John Doe",
  "email": "john.doe@example.com",
  "external_id": "user-123"
}
```

**Response:**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 5. Usage in Components

> **Note**: This section provides guidance for implementing JWT authentication. The code example below is a reference and does not currently exist in this codebase.

The `loginUser` function demonstrates how to use JWT authentication:

```typescript
const loginUser = async (userInfo: {
  name: string;
  email: string;
  external_id: string;
}) => {
  zE(
    'messenger',
    'loginUser',
    async (provideJwt) => {
      const response = await fetch('/api/zendesk/jwt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userInfo),
      });
      const { token } = await response.json();
      provideJwt(token);
    },
    (error) => {
      if (error) {
        console.error('Login failed:', error);
      } else {
        console.log('Login successful!');
      }
    },
  );
};
```

## Integration with Your Auth System

To integrate with your existing authentication system:

1. **Get User Data**: Retrieve user information from your auth context/session
2. **Call loginUser**: Pass the user data to the `loginUser` function
3. **Handle Errors**: Implement appropriate error handling and user feedback

### Example Integration

```typescript
import { useAuth } from '@/contexts/auth-context'; // Your auth context

function SupportWidget() {
  const { user } = useAuth(); // Get authenticated user

  const handleLogin = () => {
    if (!user) {
      // Redirect to login or show error
      return;
    }

    loginUser({
      name: user.name,
      email: user.email,
      external_id: user.id, // Your unique user identifier
    });
  };

  // ... rest of component
}
```

## Error Handling

The `loginCallback` receives an error object with the following structure:

```typescript
interface LoginFailedError {
  message: string; // Descriptive error message
  reason: string; // Additional details on the cause
  type: string; // Error type identifier
}
```

**Common Errors:**

- Invalid JWT signature (check your secret key)
- Expired token (token expired before use)
- Missing required claims (name, email, or external_id)
- Invalid email format

## Security Best Practices

1. **Never expose the JWT secret** to the client-side
2. **Validate user data** before generating tokens
3. **Use HTTPS** in production
4. **Set appropriate token expiration** times
5. **Implement rate limiting** on the JWT generation endpoint
6. **Log authentication attempts** for security monitoring

## Testing

1. **Development**: Use test user data to verify JWT generation
2. **Zendesk Test Mode**: Test authentication in Zendesk's test environment
3. **Error Scenarios**: Test with invalid data, expired tokens, etc.

## Troubleshooting

### JWT Generation Fails

- Check that `ZENDESK_JWT_SECRET` is set correctly
- Verify the secret matches your Zendesk configuration
- Check server logs for detailed error messages

### Login Fails in Widget

- Verify JWT contains all required claims (name, email, external_id)
- Check token expiration time
- Ensure JWT secret matches Zendesk configuration
- Review Zendesk admin logs for authentication errors

### Token Expired Errors

- Increase token expiration time if needed
- Ensure tokens are generated close to when they're used
- Consider implementing token refresh logic

## Additional Resources

- [Zendesk JWT Authentication Documentation](https://developer.zendesk.com/api-reference/widget-messaging/web/authentication/#login)
- [JWT.io](https://jwt.io/) - JWT debugger and documentation
- [jose Library Documentation](https://github.com/panva/jose) - JWT library used in this project
