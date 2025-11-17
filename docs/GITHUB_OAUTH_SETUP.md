# GitHub OAuth Setup - Manual Configuration Steps

This document contains the manual steps required to complete the GitHub OAuth integration.

## Prerequisites

You must complete these steps before the GitHub OAuth integration will work.

---

## Step 1: Create GitHub OAuth Application

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click "New OAuth App" (or "Register a new application")
3. Fill in the application details:
   - **Application name**: `AI Development Cockpit` (or your preferred name)
   - **Homepage URL**: `http://localhost:3001` (for development)
   - **Authorization callback URL**: `https://xucngysrzjtwqzgcutqf.supabase.co/auth/v1/callback`
4. Click "Register application"
5. You will see your **Client ID** on the next page
6. Click "Generate a new client secret" to get your **Client Secret**
7. **IMPORTANT**: Copy both values immediately - you won't be able to see the secret again!

---

## Step 2: Update Your .env File

1. Open `/Users/tmkipper/Desktop/tk_projects/ai-development-cockpit/.env`
2. Replace the placeholder values with your actual credentials:

```bash
# GitHub OAuth (for repository integration)
GITHUB_CLIENT_ID="Ov23li..."  # Replace with your actual Client ID from Step 1
GITHUB_CLIENT_SECRET="your_actual_secret_here"  # Replace with your actual Client Secret from Step 1

# Public Site URL (for OAuth redirects)
NEXT_PUBLIC_SITE_URL="http://localhost:3001"  # Keep as-is for development
```

3. Save the file

---

## Step 3: Configure Supabase Auth Provider

1. Go to [Supabase Dashboard - Authentication Providers](https://supabase.com/dashboard/project/xucngysrzjtwqzgcutqf/auth/providers)
2. Find the "GitHub" provider in the list
3. Click the toggle to **Enable** it
4. Enter your credentials:
   - **Client ID**: Paste the Client ID from Step 1
   - **Client Secret**: Paste the Client Secret from Step 1
5. Click **Save**

---

## Step 4: Test the OAuth Flow

After completing Steps 1-3:

1. Start your development server:
   ```bash
   npm run dev
   ```

2. The GitHub OAuth integration is now ready to use

3. In Task 5, you'll create the UI components that will use these endpoints:
   - `POST /api/auth/github` - Initiates GitHub OAuth flow
   - `GET /auth/callback` - Handles OAuth callback and session creation

---

## Production Deployment

When deploying to production:

1. Create a **new** GitHub OAuth App for production
   - Homepage URL: `https://your-production-domain.com`
   - Callback URL: `https://xucngysrzjtwqzgcutqf.supabase.co/auth/v1/callback` (same)

2. Update production environment variables in Vercel:
   - `GITHUB_CLIENT_ID` → Production Client ID
   - `GITHUB_CLIENT_SECRET` → Production Client Secret
   - `NEXT_PUBLIC_SITE_URL` → `https://your-production-domain.com`

3. Update Supabase production settings with production credentials

---

## Troubleshooting

**Error: "Invalid redirect URI"**
- Verify the callback URL in your GitHub OAuth App exactly matches: `https://xucngysrzjtwqzgcutqf.supabase.co/auth/v1/callback`

**Error: "Invalid client credentials"**
- Double-check your Client ID and Client Secret in both `.env` and Supabase Dashboard
- Ensure there are no extra spaces or quotes

**Error: "Access denied"**
- User cancelled the OAuth flow - this is normal behavior

**Session not persisting**
- Make sure cookies are enabled in your browser
- Check that `NEXT_PUBLIC_SITE_URL` is correct

---

## Security Notes

- **NEVER commit `.env` to git** - It's already in `.gitignore`
- **Rotate secrets regularly** for production applications
- **Use separate OAuth apps** for development and production
- **Store production secrets** in Vercel environment variables, not in code

---

**Status**: Manual configuration required before testing
**Next**: Task 5 - Repository Browser UI
