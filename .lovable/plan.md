

## Plan: Add Google SSO

### Overview
Add a "Sign in with Google" button to the login page using Lovable Cloud's managed Google OAuth.

### Steps

1. **Configure Social Login** — Use the Configure Social Auth tool to generate the `src/integrations/lovable` module and install `@lovable.dev/cloud-auth-js`. This is a prerequisite before any code changes.

2. **Update Login page** — Add a "Sign in with Google" button to `src/pages/Login.tsx` that calls `lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin })`. Place it above the existing email/password tabs as an alternative sign-in method, with a divider ("or continue with email").

### Technical Details
- Uses Lovable Cloud's managed Google OAuth — no API keys or Google Cloud console setup needed
- The `lovable.auth.signInWithOAuth()` function handles the full OAuth flow
- Existing `onAuthStateChange` listener in `useAuth.tsx` will automatically pick up the session after Google redirect

