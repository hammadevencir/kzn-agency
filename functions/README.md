# KZN Agency — Cloud Functions

Scheduled + callable Firebase Functions that keep subscription state in sync.

## Functions

| Name | Trigger | Purpose |
| --- | --- | --- |
| `subscriptionExpirySweep` | Scheduled — every 12 hours | Flips approved subscriptions to `expired` when `expiresAt` has passed, and stamps the `expiryWarningStage` (`7d` / `3d` / `24h`) for subscriptions nearing expiry so the user portal can surface the warning dialog. |
| `subscriptionExpiryBackfill` | Callable (admin only) | One-shot: writes `expiresAt = createdAt + 30 days` on every approved subscription that is missing it. |
| `subscriptionExpirySweepOnce` | Callable (admin only) | Manual run of the sweep (useful for testing). |

## Install & deploy

```bash
cd functions
npm install
# from repo root
firebase deploy --only functions
```

## Local emulator

```bash
cd functions
npm run serve
```

## Notes

- The cron logic is mirrored in `lib/subscriptions/expiry-worker.js` so the Next.js app can expose an admin-only HTTP endpoint (`POST /api/admin/subscriptions/backfill-expiry`) and a shared-secret cron endpoint (`GET /api/cron/subscriptions-expiry`) for environments without Firebase Functions. Keep both in sync.
- The admin-only callables expect `role: "admin"` on the caller's custom claims.
