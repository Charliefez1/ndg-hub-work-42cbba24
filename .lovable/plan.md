

## Problem

Two issues causing the portal redirect:

1. **Route restriction**: The `/portal` route in `App.tsx` uses `allowedRoles={['client']}`, so admin/team users are immediately redirected to `/` by the RouteGuard.

2. **Race condition**: In `useAuth`, `setLoading(false)` fires before `fetchProfile` completes (especially with the `setTimeout` wrapper). This means `roles` is still `[]` when RouteGuard evaluates, so even a client user briefly has no roles and gets redirected.

## Fix

### 1. Allow admin/team to access Portal
Change the portal route to allow all authenticated roles:
```
// App.tsx — change portal route from:
allowedRoles={['client']}
// to:
allowedRoles={['admin', 'team', 'client']}
```

### 2. Fix the roles race condition
In `useAuth.tsx`, don't set `loading = false` until the profile + roles fetch completes. The current code sets loading false in `onAuthStateChange` before the deferred `fetchProfile` resolves. Fix by awaiting the profile fetch before clearing loading:

- In the `onAuthStateChange` callback: call `await fetchProfile()` directly (remove the `setTimeout` wrapper), then set `loading = false` after.
- In the `getSession` block: same — await `fetchProfile` before `setLoading(false)`.

This ensures `roles` is populated before RouteGuard evaluates.

### Files changed
- `src/hooks/useAuth.tsx` — fix loading/roles race
- `src/App.tsx` — update portal route allowed roles

