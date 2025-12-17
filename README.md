# DESTINY

![status](https://img.shields.io/badge/status-experimental-yellow.svg) ![license](https://img.shields.io/badge/license-MISSING-lightgrey.svg) ![deno](https://img.shields.io/badge/runtime-deno-blue.svg)

**Astrology‑based dating backend — Supabase Edge Functions** ✨

A small collection of Supabase Edge Functions (Deno) that power subscription and payment flows, error reporting, and periodic maintenance tasks for the Destiny app.

---

## Why this project is useful ✅

- Implements realtime-safe server logic using Supabase Edge Functions and the Supabase JS client.
- Handles payments (Razorpay), order creation, payment verification and subscription updates.
- Provides a scheduled job to reset swipe counts for users.
- Keeps business logic server-side (authenticated via Supabase JWTs) while remaining lightweight and easy to deploy.

---

## Features 🔧

- create-order-copy: Create payment orders via Razorpay and store order records in Supabase.
- verify-payment: Verify Razorpay payments, update subscriptions and profiles.
- error-mgmt: Accepts client-side error reports and saves them to Supabase (orders/subscriptions tables).
- swipe-count-management: Periodic job that resets swipe counts for premium and free users.

---

## Getting started — quickstart ⚡

### Prerequisites

- Deno (v1.XX+) — this repo targets the Deno runtime used by Supabase Functions.
- Supabase account and a project.
- Supabase CLI (optional but recommended) — for local dev and deploying functions.
- Razorpay account (for production payment integration).

### Required environment variables

Each function expects these environment variables to be configured in your Supabase project or deployment environment:

- `SUPABASE_URL` — your Supabase project URL
- `SUPABASE_ANON_KEY` — your project's anon/public key (used by public client)
- `SUPABASE_SERVICE_ROLE_KEY` — service role key (used by server/service client)
- `RAZORPAY_KEY_ID` — Razorpay API key id
- `RAZORPAY_SECRET_KEY` — Razorpay secret key

> Note: Keep secret keys out of source control and configure them via the Supabase Dashboard or your CI/CD secrets store.

---

## How to use the functions (examples) 💡

All endpoints require an Authorization header containing a valid Supabase JWT (Bearer <token>) except where noted.

### 1) Create order — `create-order-copy`

Request (POST JSON):

```json
{
  "currency": "INR",
  "planType": "premium",
  "source": "mobile"
}
```

Curl example:

```bash
curl -X POST "https://<project>.functions.supabase.co/create-order-copy" \
  -H "Authorization: Bearer <JWT>" \
  -H "Content-Type: application/json" \
  -d '{"currency":"INR","planType":"premium","source":"mobile"}'
```

Response: JSON object returned by Razorpay (order details)

---

### 2) Verify payment — `verify-payment`

Request (POST JSON):

```json
{
  "paymentId": "pay_XXXX",
  "orderId": "order_XXXX",
  "signature": "<razorpay_signature>",
  "subscriptionSource": true
}
```

Curl example:

```bash
curl -X POST "https://<project>.functions.supabase.co/verify-payment" \
  -H "Authorization: Bearer <JWT>" \
  -H "Content-Type: application/json" \
  -d '{"paymentId":"pay_XXX","orderId":"order_XXX","signature":"sig","subscriptionSource":true}'
```

Response: `"OK"` on success (HTTP 200), or `{ success: false, error: "..." }` on verification failure.

---

### 3) Error reporting — `error-mgmt`

Request (POST JSON):

```json
{
  "code": "ERR_CODE",
  "state": "orderCreation", // or other defined states
  "message": "Detailed error message"
}
```

This function records client-side errors to the `orders` or `subscriptions` table.

---

### 4) Swipe count management — `swipe-count-management`

This function is intended to run as a scheduled job (cron) to reset swipe counts for free and premium users. It uses the `SUPABASE_SERVICE_ROLE_KEY` to bypass RLS.

---

## Development & local testing 🔁

- Use the Supabase CLI to run functions locally (see `supabase functions serve`).
- To deploy: `supabase functions deploy <function-name>` or deploy all functions using `supabase functions deploy --project-ref <ref>`.
- Keep env vars configured in your Supabase project or in your local environment when testing.

---

## Project structure

- `*/supabase/functions/*/index.ts` — entry points for each function
- `*/services/*` — service helpers that interact with Supabase and external APIs
- `*/interface/*` — TypeScript interfaces and models used across functions

---

## Contributing & support 🤝

- Please open issues or pull requests for bugs and feature requests.
- For contribution guidelines, add a `CONTRIBUTING.md` at the repo root and link it here.
- Add a `LICENSE` file to declare how this repo may be used.

---

## Maintainers

- Maintainer: (add name and contact or GitHub handle here)

---

## Roadmap / suggestions

- Add integration tests and a CI workflow (GitHub Actions) for linting/type checking and deployments.
- Add `CONTRIBUTING.md` and `CODE_OF_CONDUCT.md`.
- Add a `LICENSE` file (MIT/Apache/Other) to make usage clearer.

---

If you'd like, I can also add a `CONTRIBUTING.md`, simple CI workflow, or update the README with project-specific badges (CI/License) — tell me which you'd prefer next. ✅
