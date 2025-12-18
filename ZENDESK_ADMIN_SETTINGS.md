# Zendesk Admin Settings for JWT Authentication

This guide outlines the Zendesk admin settings that need to be configured for JWT authentication to work properly, especially for knowledge base access.

## Critical Settings for JWT Authentication

### 1. Messaging JWT Authentication Settings

**Path:** Admin → Channels → Messaging and social → Messaging → Settings → Security

**Required Settings:**

- ✅ **Enable JWT authentication** - Must be turned ON
- ✅ **Shared secret** - Must match your `ZENDESK_SHARED_SECRET` environment variable exactly
- ✅ **Key ID (kid)** - If your Zendesk requires a specific `kid` value, it must match `ZENDESK_JWT_KID` in your `.env.local`

**Important Notes:**

- The shared secret must be identical in both Zendesk and your application
- Case-sensitive - ensure no extra spaces or characters
- If you change the secret in Zendesk, update your `.env.local` immediately

### 2. Knowledge Base Access Settings

**Path:** Admin → Channels → Messaging and social → Messaging → Settings → Security

**Key Settings:**

- ✅ **Allow authenticated users to access knowledge base** - Must be enabled
- ✅ **Require authentication for knowledge base** - Check if this is set incorrectly

**Alternative Path:** Admin → Guide → Settings → Security

**Check:**

- Knowledge base access permissions
- Whether authentication is required for article viewing
- User permissions for authenticated users

### 3. User Authentication Settings

**Path:** Admin → Account → Security → SSO

**Check:**

- JWT SSO settings (if applicable)
- Whether JWT authentication is properly configured
- Any conflicting SSO settings that might interfere

### 4. Guide (Knowledge Base) Settings

**Path:** Admin → Guide → Settings → General

**Required Settings:**

- ✅ **Enable Guide** - Must be enabled
- ✅ **Allow anonymous access** - May need to be disabled if authentication is required
- ✅ **Require sign-in** - Check if this conflicts with JWT authentication

**Path:** Admin → Guide → Settings → Security

**Check:**

- Authentication requirements for knowledge base
- User permissions for authenticated users
- Whether JWT-authenticated users have proper access

### 5. Web Widget Settings

**Path:** Admin → Channels → Web Widget → Settings

**Required Settings:**

- ✅ **Enable Web Widget** - Must be enabled
- ✅ **Enable messaging** - Must be enabled
- ✅ **Authentication** - Should be set to use JWT

**Path:** Admin → Channels → Web Widget → Settings → Security

**Check:**

- JWT authentication is enabled
- Shared secret matches your configuration
- Key ID (kid) matches if required

### 6. User Permissions & Roles

**Path:** Admin → People → Roles

**For Authenticated Users:**

- Ensure JWT-authenticated users have appropriate role/permissions
- Check if "End-user" role has knowledge base access
- Verify permissions for viewing articles

**Path:** Admin → Guide → Settings → Permissions

**Check:**

- Which user roles can access knowledge base
- Whether authenticated users (via JWT) are included
- Article visibility settings

## Common Configuration Issues

### Issue 1: Knowledge Base Requires Separate Login

**Symptoms:**

- JWT authentication works (you see "user authenticated" log)
- But knowledge base still asks for login

**Solutions:**

1. Check Guide → Settings → Security → "Require sign-in"
2. Ensure JWT-authenticated users are mapped to a role with knowledge base access
3. Verify Guide → Settings → Permissions includes your user role

### Issue 2: JWT Kid Mismatch

**Symptoms:**

- "Invalid key id (kid)" error

**Solutions:**

1. Check Admin → Channels → Messaging → Settings → Security
2. Look for "Key ID" or "kid" field
3. Set `ZENDESK_JWT_KID` in `.env.local` to match exactly
4. If no kid is configured in Zendesk, omit it from your JWT (set `ZENDESK_JWT_KID` to empty or don't set it)

### Issue 3: Shared Secret Mismatch

**Symptoms:**

- "Invalid JWT signature" error

**Solutions:**

1. Verify shared secret in Admin → Channels → Messaging → Settings → Security
2. Ensure it matches `ZENDESK_SHARED_SECRET` in `.env.local` exactly
3. Check for extra spaces, line breaks, or encoding issues

### Issue 4: Knowledge Base Not Accessible to Authenticated Users

**Symptoms:**

- Authentication succeeds but knowledge base access denied

**Solutions:**

1. Admin → Guide → Settings → Security
2. Check "Who can view articles" settings
3. Ensure authenticated users or your user role is included
4. Check Guide → Settings → Permissions for role-based access

## Step-by-Step Verification Checklist

### For Your Admin:

1. **Verify JWT Authentication is Enabled**
   - [ ] Admin → Channels → Messaging → Settings → Security
   - [ ] JWT authentication is ON
   - [ ] Shared secret matches your `.env.local` value

2. **Check Knowledge Base Access Settings**
   - [ ] Admin → Guide → Settings → Security
   - [ ] "Require sign-in" setting is appropriate for your use case
   - [ ] Authenticated users have access permissions

3. **Verify User Role Permissions**
   - [ ] Admin → People → Roles
   - [ ] JWT-authenticated users are assigned a role
   - [ ] That role has knowledge base access

4. **Check Web Widget Configuration**
   - [ ] Admin → Channels → Web Widget → Settings
   - [ ] Messaging is enabled
   - [ ] Authentication is configured correctly

5. **Test Knowledge Base Access**
   - [ ] Try accessing knowledge base as authenticated user
   - [ ] Check browser console for any errors
   - [ ] Verify user role has proper permissions

## Specific Settings to Check

### Most Likely Culprits:

1. **Guide → Settings → Security → "Require sign-in"**
   - If this is enabled, it might be requiring a separate Zendesk account login
   - For JWT authentication, this should typically be disabled or configured to accept JWT tokens

2. **Guide → Settings → Permissions**
   - Check which roles can view articles
   - Ensure your JWT-authenticated users are mapped to a role with access

3. **Messaging → Settings → Security → JWT Settings**
   - Verify shared secret matches exactly
   - Check if Key ID (kid) is required and matches your configuration

## Additional Resources

- [Zendesk JWT Authentication Documentation](https://developer.zendesk.com/api-reference/widget-messaging/web/authentication/#login)
- [Zendesk Guide Security Settings](https://support.zendesk.com/hc/en-us/articles/4408833597850-Managing-Guide-security-settings)
- [Zendesk User Roles and Permissions](https://support.zendesk.com/hc/en-us/articles/4408843597850-Managing-user-roles-in-Zendesk)

## Troubleshooting Tips

1. **Check Browser Console**
   - Look for any Zendesk-related errors
   - Check network tab for failed authentication requests

2. **Verify JWT Token**
   - Decode your JWT token at jwt.io to verify claims
   - Ensure `external_id`, `name`, and other required fields are present

3. **Test with Zendesk Support**
   - If settings look correct but still not working, contact Zendesk support
   - They can verify your account configuration and JWT setup

4. **Check Zendesk Plan Limitations**
   - Some Zendesk plans may have limitations on JWT authentication
   - Verify your plan supports the features you're trying to use
