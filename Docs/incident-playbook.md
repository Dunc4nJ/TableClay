# Incident Playbook

This runbook captures operational incidents and deterministic recovery steps.

## Incident: Vercel `MIDDLEWARE_INVOCATION_FAILED` + Railway `Application not found`

### Symptoms
- `https://www.tableclay.com/` returns `500` with `MIDDLEWARE_INVOCATION_FAILED`.
- Vercel runtime logs show Edge Middleware error with message `Application not found`.
- `https://tableclay-production.up.railway.app/health` returns fallback `404` with `x-railway-fallback: true`.

### Root Cause Pattern
- Storefront middleware fetches backend regions (`/store/regions`) to resolve country redirects.
- Railway public ingress/domain mapping fails, so backend URL returns fallback `404` before reaching Medusa.
- Middleware throws if region fetch fails; Vercel surfaces this as middleware invocation failure.

### Immediate Triage
```bash
# 1) Confirm storefront symptom
curl -i https://www.tableclay.com/

# 2) Confirm backend public ingress
curl -i https://tableclay-production.up.railway.app/health
curl -i https://tableclay-production.up.railway.app/store/regions

# 3) Confirm Railway deployment state
railway deployment list --json --limit 3

# 4) Check Vercel runtime logs while reproducing
vercel logs tableclay.com --json
```

### Recovery Steps
```bash
# 1) Ensure Railway domain exists and points to backend service
railway domain --service TableClay --port 8080 --json

# 2) Trigger backend redeploy to refresh ingress routing
railway redeploy --service TableClay --yes

# 3) Wait for success
railway deployment list --json --limit 1

# 4) Re-test health and regions
curl -i https://tableclay-production.up.railway.app/health
curl -i https://tableclay-production.up.railway.app/store/regions
```

### Post-Recovery Validation
```bash
# Storefront should redirect to region, then render
curl -i https://www.tableclay.com/
curl -i https://www.tableclay.com/us
```

Expected:
- `/health` returns `200`.
- `www.tableclay.com` returns `307` redirect to a region route (`/us`).
- region page returns `200`.

### Hardening Applied
- Middleware fail-open fallback to default region when backend region lookup fails.
- Backend Docker healthcheck aligned to `${PORT:-8080}`.

### Knowledge Capture Commands
Run these after incident handling so context is indexed:
```bash
cm context "task" --json
cass search "MIDDLEWARE_INVOCATION_FAILED Railway Application not found" --days 120
```

