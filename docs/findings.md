# Findings — Contract Comparison Agent (Plan A)

> Lessons learned from building and deploying a UiPath Coded App (React + Vite + `@uipath/uipath-typescript`).  
> Each finding lists the symptom, root cause, fix, and where the fix lives.

---

## F-001 · Wrong `uipath.json` key names break the `coded-apps-dev` Vite plugin

**Symptom:** App built but SDK failed to pick up OAuth config; no meta tags injected into `index.html`.  
**Root cause:** The `@uipath/coded-apps-dev` Vite plugin reads specific keys (`clientId`, `orgName`, `tenantName`, `baseUrl`, `redirectUri`, `scope`). Using camelCase variants or extra nesting caused silent misreads.  
**Fix:** Matched key names exactly to what the plugin expects.  
**Commit:** `fix: correct uipath.json key names for coded-apps-dev plugin`

---

## F-002 · Wrong OAuth scopes — `OR.Entities` doesn't exist; Data Fabric needs `DataService.*`

**Symptom:** Entity API calls returned 403 immediately; Maestro process start failed.  
**Root cause:** `OR.Entities` is not a valid scope. UiPath Data Fabric (Entities) requires `DataService.Default`; Maestro requires `PIMS`; Action Center tasks require `OR.Tasks`.  
**Fix:** Updated `uipath.json` scope string to `OR.Buckets OR.Tasks OR.Jobs PIMS DataService.Default offline_access`.  
**Commits:** `fix: replace OR.Entities with DataService scopes in uipath.json`, `fix: correct OAuth scopes — PIMS for Maestro, DataFabric.* for Entities`

---

## F-003 · SDK singleton race condition with concurrent `getSDK()` callers

**Symptom:** Multiple components calling `getSDK()` on mount triggered parallel `new UiPath()` + `initialize()` calls; the second initialization threw "already initialized".  
**Root cause:** Checking `if (instance) return instance` doesn't guard against concurrent async callers — both see `null`, both call `new UiPath()`.  
**Fix:** Changed singleton to an `initPromise` pattern — the first caller sets `initPromise`; all subsequent callers await the same promise.

```typescript
// Before (broken)
if (instance) return instance;
instance = new UiPath();
await instance.initialize();

// After (correct)
if (!initPromise) {
  initPromise = (async () => {
    const sdk = new UiPath();
    await sdk.initialize();
    return sdk;
  })();
}
return initPromise;
```

**Commit:** `fix: upload buttons, /reviews route, SDK race condition, task polling loading state`

---

## F-004 · Bucket folder lookup via raw Orchestrator API returns 403

**Symptom:** "Initialization failed" on first load — `initBuckets()` threw 403 when fetching `/odata/Folders`.  
**Root cause:** Calling `/odata/Folders` directly requires the `OR.Folders` scope, which was not included. Even with it, the raw API call requires a full OData URL that the SDK proxy does not forward correctly in local dev.  
**Fix (iteration 1):** Added `VITE_UIPATH_FOLDER_ID` env var and read it in `initBuckets()`.  
**Fix (iteration 2, final):** Env var approach failed because `VITE_UIPATH_*` vars are intercepted by the `coded-apps-dev` plugin. Replaced with a hardcoded numeric constant (`2964547` — the Shared folder ID) via `configureBucket(bucket.id, 2964547)`.  
**Commits:** `fix: replace raw Folders API call with VITE_UIPATH_FOLDER_ID env var`, `fix: hardcode Shared folder ID (2964547) in initBuckets`

> **Lesson:** Never use `VITE_UIPATH_*` as a prefix for your own env vars — the `coded-apps-dev` plugin intercepts all of them for SDK config injection.

---

## F-005 · OAuth error #218 "Cannot find the target partition"

**Symptom:** After deploying, incognito login → UiPath identity showed a platform error page: "Cannot find the target partition (#218)".  
**Root cause:** Two combined issues:  
1. `baseUrl` in `uipath.json` was `https://cloud.uipath.com` (global). The SDK constructed an authorization URL against the global identity endpoint, which didn't know which org to target.  
2. `sdk.setMultiLogin()` was not called, causing the SDK to send `acr_values` that conflicted with the org-specific flow.  
**Fix:** Set `baseUrl` to `https://cloud.uipath.com/kartizpujinj` (org-specific) and call `sdk.setMultiLogin()` before `sdk.initialize()`.  
**Commits:** `fix: use org-specific identity endpoint to resolve OAuth error #218`

---

## F-006 · `redirectUri` must match the deployed app URL — not localhost

**Symptom:** OAuth callback returned to `localhost:5173` even when accessing the deployed app; auth failed with redirect mismatch.  
**Root cause:** `uipath.json` `redirectUri` was set to `http://localhost:5173` and the Vite build embedded that into the `index.html` meta tags. The identity server rejected the callback.  
**Fix:**  
- For production deploys, set `redirectUri` to `https://kartizpujinj.uipath.host/contractai` in `uipath.json`.  
- Also register the deployed URL in the External Application's allowed redirect URIs in UiPath Cloud Admin.  
- For local dev, keep `redirectUri: "http://localhost:5173"` (and register that too in External App).  
**Commit:** `fix: update redirectUri to deployed app URL`

> **Lesson:** The External App in UiPath Cloud Admin must have **both** localhost and the deployed URL registered as allowed redirect URIs, since `uipath.json` can only hold one at a time.

---

## F-007 · CORS errors on localhost — SDK calls hit `cloud.uipath.com` directly

**Symptom:** All API calls on `localhost:5173` failed with `ERR_FAILED` / CORS policy error — `No 'Access-Control-Allow-Origin'` from `cloud.uipath.com`.  
**Root cause:** The SDK uses the `uipath:base-url` meta tag to build API URLs. In dev mode, this points to `cloud.uipath.com`, which doesn't allow browser requests from `localhost`.  
**Fix:** Added a Vite dev server proxy (`/uipath-proxy → cloud.uipath.com`) and patched the `uipath:base-url` meta tag at runtime in DEV mode to route through it.

```typescript
// sdk.ts — DEV-only patch
if (import.meta.env.DEV) {
  const meta = document.querySelector('meta[name="uipath:base-url"]');
  if (meta) {
    const current = meta.getAttribute('content') ?? '';
    meta.setAttribute('content', current.replace('https://cloud.uipath.com', `${window.location.origin}/uipath-proxy`));
  }
}
```

**Commit:** `fix: add Vite proxy for UiPath CORS, fix Supabase anon key support`

---

## F-008 · Deployed app assets returned 404 (`index-*.css`, `index-*.js`)

**Symptom:** After first deploy, DevTools showed `404 Not Found` for all JS/CSS assets on the deployed URL.  
**Root cause:** `vite.config.ts` was missing `base: './'`. Without it, Vite outputs absolute `/assets/...` paths in `index.html`. The deployed app is mounted at `/contractai`, so `/assets/...` resolves to the host root — which returns 404.  
**Fix:** Set `base: './'` in `vite.config.ts` so all asset references are relative.  
**Reference:** UiPath Coded Apps Critical Rule 9 — `vite.config.ts` must always set `base: './'`.

---

## F-009 · React Router "No routes matched" after OAuth callback — blank screen

**Symptom:** App deployed successfully, OAuth completed, but blank white screen. DevTools console: `No routes matched location "/contractai?code=e4a3220d..."`.  
**Root cause:** `<BrowserRouter>` had no `basename`. The app is mounted at `/contractai`, so after the OAuth redirect (`https://kartizpujinj.uipath.host/contractai?code=...`), React Router received the full path `/contractai?code=...` as the location and couldn't match any route.  
**Fix:** Added `basename={getAppBase()}` to `<BrowserRouter>`. `getAppBase()` reads the `uipath:app-base` meta tag that the UiPath platform injects at serve time (value: `/contractai`). Locally it returns `/`, so dev mode is unaffected.

```tsx
import { getAppBase } from '@uipath/uipath-typescript';
// ...
<BrowserRouter basename={getAppBase()}>
```

**Commit:** `fix: add getAppBase() basename to BrowserRouter for deployed sub-path routing`  
**Reference:** UiPath Coded Apps Critical Rule 10 — use `getAppBase()` for all absolute URLs constructed at runtime.

---

## F-010 · Vitest v4 mock syntax — `mockImplementation` not usable on arrow functions

**Symptom:** Tests failed: `TypeError: mockImplementation is not a function` on mocked UiPath class methods.  
**Root cause:** Vitest v4 changed mock auto-inference. Arrow function class fields aren't automatically replaced by `vi.fn()` when using `vi.mock(...)` with a factory.  
**Fix:** Explicitly wrote the factory with `vi.fn()` for each method in the mock class body.

---

## F-011 · `sdk.setMultiLogin is not a function` in tests

**Symptom:** All SDK tests failed after adding `sdk.setMultiLogin()` call to production code.  
**Root cause:** The mock `UiPath` class in `sdk.test.ts` didn't include a `setMultiLogin` method.  
**Fix:** Added `setMultiLogin = vi.fn()` to the mock class.  
**Commit:** `fix: add Vite proxy for UiPath CORS, fix Supabase anon key support` (sdk.test.ts change)

---

## F-012 · Entity provider — Data Fabric scopes conflict with deployment flexibility

**Symptom:** Data Fabric (`OR.DataService.Default`) requires SSO scopes that weren't available in all test environments; entity operations failed silently.  
**Root cause:** Tightly coupling entities to UiPath Data Fabric made local dev and testing fragile.  
**Fix:** Introduced an entity provider abstraction (`src/lib/entity-providers/`). Default provider is Supabase (`VITE_ENTITY_PROVIDER=supabase`); set `VITE_ENTITY_PROVIDER=uipath` to switch to Data Fabric. Both implement the same `EntityStore` interface.

---

## F-013 · XSS risk in document highlight via `innerHTML`

**Symptom:** Code review flag — `HighlightLayer.tsx` was inserting unsanitized contract text into the DOM.  
**Root cause:** mark.js injects matched snippets as HTML; if contract text contained `<script>` or event attributes, it would execute.  
**Fix:** Sanitized all HTML before mark.js injection using `DOMPurify.sanitize()`.  
**Commit:** `fix: address all code review issues — XSS, memory leak, error handling, bucket init`

---

## F-014 · Memory leak in `useTaskPolling` — `setInterval` without cleanup

**Symptom:** Code review flag — intervals accumulated on every component remount (React StrictMode mounts twice in dev).  
**Root cause:** `setInterval` return value wasn't captured; no `clearInterval` in `useEffect` cleanup.  
**Fix:** Captured the interval ID and returned a cleanup function.

```typescript
useEffect(() => {
  const id = setInterval(poll, POLL_INTERVAL_MS);
  return () => clearInterval(id);
}, []);
```

**Commit:** `fix: address all code review issues — XSS, memory leak, error handling, bucket init`

---

## F-015 · `VITE_UIPATH_*` env vars are reserved — intercepted by SDK plugin

**Symptom:** Setting `VITE_UIPATH_FOLDER_ID` in `.env.local` did not make the value available in the app; the value was `undefined` at runtime.  
**Root cause:** `@uipath/coded-apps-dev` intercepts all `VITE_UIPATH_*` env vars during the Vite build for SDK config injection. Custom vars with that prefix are swallowed.  
**Fix:** Renamed to `VITE_FOLDER_ID` (or used a non-VITE_ var passed via a different mechanism).  
**Commit:** `fix: replace raw Folders API call with VITE_UIPATH_FOLDER_ID env var` (discovered during this fix)

---

## Summary

| # | Area | Severity | Status |
|---|------|----------|--------|
| F-001 | `uipath.json` key names | High | ✅ Fixed |
| F-002 | OAuth scopes | High | ✅ Fixed |
| F-003 | SDK singleton race condition | High | ✅ Fixed |
| F-004 | Bucket folder 403 | High | ✅ Fixed |
| F-005 | OAuth error #218 (partition) | High | ✅ Fixed |
| F-006 | `redirectUri` mismatch | High | ✅ Fixed |
| F-007 | CORS on localhost | Medium | ✅ Fixed |
| F-008 | Deployed assets 404 | High | ✅ Fixed |
| F-009 | React Router blank screen | High | ✅ Fixed |
| F-010 | Vitest v4 mock syntax | Low | ✅ Fixed |
| F-011 | `setMultiLogin` mock missing | Low | ✅ Fixed |
| F-012 | Entity provider flexibility | Medium | ✅ Fixed |
| F-013 | XSS via innerHTML | High | ✅ Fixed |
| F-014 | `setInterval` memory leak | Medium | ✅ Fixed |
| F-015 | `VITE_UIPATH_*` reserved prefix | Medium | ✅ Fixed |

---

## Key Rules for Future UiPath Coded Apps

1. Always set `base: './'` in `vite.config.ts`.
2. Always use `<BrowserRouter basename={getAppBase()}>` — never bare `<BrowserRouter>`.
3. Use `initPromise` pattern (not `instance`) for the SDK singleton.
4. Call `sdk.setMultiLogin()` before `sdk.initialize()`.
5. Set `baseUrl` to `https://cloud.uipath.com/<orgName>` (not the root URL).
6. Never prefix your own env vars with `VITE_UIPATH_` — the plugin owns that namespace.
7. Register **both** localhost and the deployed URL in the External App's redirect URIs.
8. Scope checklist: `OR.Buckets OR.Tasks OR.Jobs PIMS DataService.Default offline_access`.
