

## Problem: Persistent Loading After Google SSO

**Root cause**: In `useAuth.tsx`, `fetchProfile()` is called with `await` before `setLoading(false)`. If `fetchProfile` throws (network error, RLS timing, stale token cleanup), the `setLoading(false)` line is never reached. The app stays on the loading spinner forever.

The console logs confirm: a stale refresh token error fires first (`refresh_token_not_found`), then Google SSO succeeds. The `onAuthStateChange` listener fires multiple times — once for the error (clearing session), then again for the new Google session. If the profile fetch on the second call fails for any reason, loading never complears.

## Fix

### `src/hooks/useAuth.tsx`
1. Wrap both `fetchProfile` call sites in try/catch so `setLoading(false)` **always** executes
2. Add error logging so silent failures are visible

```typescript
// In onAuthStateChange callback:
if (session?.user) {
  try {
    await fetchProfile(session.user.id);
  } catch (e) {
    console.error('Failed to fetch profile:', e);
  }
} else {
  setProfile(null);
  setRoles([]);
}
setLoading(false);

// Same pattern in getSession().then() block
```

### Files changed
- `src/hooks/useAuth.tsx` — add try/catch around both fetchProfile calls

This is a one-file, two-line fix. No database or routing changes needed.

