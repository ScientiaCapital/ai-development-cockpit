# Supabase OAuth Provider Setup Guide

This guide explains how to configure OAuth providers (GitHub and Google) in your Supabase project for social authentication.

## Prerequisites

1. Supabase project created and configured
2. Environment variables set in `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

## OAuth Provider Configuration

### 1. GitHub OAuth Setup

#### Step 1: Create GitHub OAuth App
1. Go to GitHub Settings → Developer settings → OAuth Apps
2. Click "New OAuth App"
3. Fill in the application details:
   - **Application name**: `Your App Name - Supabase Auth`
   - **Homepage URL**: `http://localhost:3001` (development) or your production domain
   - **Authorization callback URL**: `https://your-project-ref.supabase.co/auth/v1/callback`
4. Click "Register application"
5. Copy the **Client ID** and generate a **Client Secret**

#### Step 2: Configure GitHub in Supabase
1. Go to your Supabase Dashboard
2. Navigate to Authentication → Providers
3. Find GitHub and click "Enable"
4. Enter your GitHub OAuth credentials:
   - **Client ID**: From GitHub OAuth app
   - **Client Secret**: From GitHub OAuth app
5. Click "Save"

### 2. Google OAuth Setup

#### Step 1: Create Google OAuth App
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API:
   - Go to APIs & Services → Library
   - Search for "Google+ API" and enable it
4. Create OAuth 2.0 credentials:
   - Go to APIs & Services → Credentials
   - Click "Create Credentials" → "OAuth 2.0 Client IDs"
   - Configure OAuth consent screen if prompted
   - Choose "Web application" as application type
   - Add authorized origins:
     - `http://localhost:3001` (development)
     - Your production domain
   - Add authorized redirect URIs:
     - `https://your-project-ref.supabase.co/auth/v1/callback`
5. Copy the **Client ID** and **Client Secret**

#### Step 2: Configure Google in Supabase
1. Go to your Supabase Dashboard
2. Navigate to Authentication → Providers
3. Find Google and click "Enable"
4. Enter your Google OAuth credentials:
   - **Client ID**: From Google Cloud Console
   - **Client Secret**: From Google Cloud Console
5. Click "Save"

## Development vs Production URLs

### Development (localhost:3001)
- **GitHub OAuth App Homepage**: `http://localhost:3001`
- **GitHub Callback URL**: `https://your-project-ref.supabase.co/auth/v1/callback`
- **Google Authorized Origins**: `http://localhost:3001`
- **Google Redirect URIs**: `https://your-project-ref.supabase.co/auth/v1/callback`

### Production
- **GitHub OAuth App Homepage**: `https://yourdomain.com`
- **GitHub Callback URL**: `https://your-project-ref.supabase.co/auth/v1/callback`
- **Google Authorized Origins**: `https://yourdomain.com`
- **Google Redirect URIs**: `https://your-project-ref.supabase.co/auth/v1/callback`

## Testing OAuth Integration

### 1. Test GitHub Authentication
1. Start your development server: `npm run dev`
2. Navigate to `/auth/login`
3. Click "Continue with GitHub"
4. Authorize the application on GitHub
5. Verify redirect to `/auth/callback`
6. Check that user is authenticated and redirected to `/marketplace`

### 2. Test Google Authentication
1. On the login page, click "Continue with Google"
2. Sign in with your Google account
3. Authorize the application
4. Verify the same callback and redirect flow

## Troubleshooting

### Common Issues

1. **"Invalid redirect URI" error**
   - Check that your callback URLs exactly match in both the OAuth provider and Supabase
   - Ensure no trailing slashes or extra characters

2. **"Client ID not found" error**
   - Verify your OAuth app is properly created and active
   - Double-check that Client ID and Secret are correctly entered in Supabase

3. **"This app isn't verified" (Google)**
   - This is normal during development
   - Click "Advanced" → "Go to [app name] (unsafe)" to proceed
   - For production, submit your app for Google verification

4. **CORS errors**
   - Ensure your domain is added to authorized origins
   - Check that you're using the correct ports (3001 for development)

### Debug Steps

1. Check browser developer tools for console errors
2. Verify network requests in the Network tab
3. Check Supabase Auth logs in your dashboard
4. Ensure environment variables are properly loaded

## Security Best Practices

1. **Never commit OAuth secrets to version control**
2. **Use environment variables for all sensitive configuration**
3. **Regularly rotate OAuth secrets in production**
4. **Monitor OAuth usage in your provider dashboards**
5. **Set up proper CORS policies**
6. **Use HTTPS in production for all OAuth flows**

## Next Steps

After configuring OAuth providers:

1. Test both GitHub and Google authentication flows
2. Verify user profile data is properly stored
3. Test organization assignment for new OAuth users
4. Implement any custom OAuth scopes if needed
5. Set up monitoring for OAuth authentication metrics

## Support

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [GitHub OAuth Documentation](https://docs.github.com/en/developers/apps/building-oauth-apps)
- [Google OAuth Documentation](https://developers.google.com/identity/protocols/oauth2)