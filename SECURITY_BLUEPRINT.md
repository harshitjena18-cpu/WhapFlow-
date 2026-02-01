# WhapFlow Security & Compliance Blueprint

**Version:** 1.0
**Status:** Approved for MVP Implementation
**Target Audience:** Engineering, Product, and Compliance Teams

---

## 1. Executive Summary

WhapFlow handles sensitive merchant data (orders, revenue) and customer PII (phone numbers). Trust is our primary currency. This blueprint outlines the mandatory security architecture required to launch safely on the Shopify App Store and integrate with WhatsApp.

**Core Philosophy:** "Secure by Default, Simple by Design."
We prioritize robust isolation and data minimization over complex enterprise features for this stage.

---

## 2. Critical Pre-Launch Remediation (Mandatory Fixes)

Before public release, the following vulnerabilities identified in the codebase **MUST** be resolved:

### 🚨 2.1 Fix Multi-Tenancy Leaks in Dashboard
**Current State:** `src/supabase/functions/server/dashboard.tsx` uses global keys (`dashboard_metrics`) for all requests. Any user sees the same mock/global data.
**Requirement:**
- All KV keys must be prefixed with the Shop ID: `shop:{shop_id}:dashboard_metrics`.
- The Dashboard API (`/api/dashboard/*`) must implement middleware to verify the requesting user belongs to the `shop` they are requesting data for.

### 🚨 2.2 Encrypt Stored Access Tokens
**Current State:** Shopify Access Tokens are stored in plain text in `merchant:{shop}` KV records.
**Requirement:**
- Encrypt `access_token` at rest using `crypto.subtle` (AES-GCM) before saving to KV.
- Decrypt only when making calls to Shopify.
- Store the encryption key in `Deno.env` (e.g., `DATA_ENCRYPTION_KEY`), never in the code.

### 🚨 2.3 Stop Logging PII
**Current State:** Webhook handlers log full payloads including Customer Name, Email, and Phone to the console.
**Requirement:**
- Remove all `console.log` statements that output `customer_email`, `phone`, or `first_name`.
- Log only IDs: `Cart ID: 12345`, `Shop: my-store.myshopify.com`.

---

## 3. Authentication & Authorization

### 3.1 Shopify OAuth (Strict Enforcement)
- **State Validation:** Continue using the `state` cookie to prevent CSRF during OAuth (already implemented).
- **HMAC Verification:** strictly enforce `verifyHmac` on the callback.
- **Scope Locking:** Define minimal scopes needed (`read_checkouts`, `read_orders`, `write_customers` if needed). Do not request `write_orders` unless absolutely necessary.

### 3.2 Dashboard Session Management
The Dashboard is an Embedded App (likely).
- **Session Token Auth:** Use Shopify App Bridge Session Tokens (JWT).
- **Backend Verification:**
  - Create a Hono Middleware: `verifyShopifySession`.
  - Validate the JWT signature using Shopify's public keys.
  - Extract `dest` (shop domain) from the token.
  - Reject any request where the JWT `dest` does not match the requested data's shop.

### 3.3 Internal API Authorization
- **Endpoint:** `/make-server-c8eef56a/*`
- **Protection:**
  - **Public/Webhooks:** Verify HMAC (Shopify) or Verify Token (WhatsApp).
  - **Dashboard APIs:** Require valid Session Token (Bearer Auth).
  - **Internal Jobs (Cron):** Verify a shared secret `INTERNAL_API_KEY` header if called over HTTP, or use `Deno.cron` (secure by default).

---

## 4. Data Privacy & Compliance (GDPR/CCPA)

### 4.1 Data Minimization
- **Phone Numbers:** Store only strictly necessary phone numbers.
- **Retention Policy:**
  - **Abandoned Carts:** Delete after 90 days (or after conversion).
  - **Message Logs:** Retain for 30 days for debugging, then hard delete or anonymize.
  - **Customer PII:** Do not build a "Customer Database". Only store PII attached to active Carts.

### 4.2 Right to Erasure (App Uninstalled)
- **Trigger:** Webhook `app/uninstalled`.
- **Action:**
  - Mark Merchant account as `inactive`.
  - Schedule a background job to **hard delete** all merchant data (KV records starting with `merchant:{shop}:` and `shop:{shop}:`) after 48 hours (grace period).
  - **Redact** PII from logs if possible (or rely on log rotation).

### 4.3 Customer Data Requests (GDPR)
- If a merchant forwards a "Delete Customer" request (Shopify Webhook `customers/redact`):
  - Search all Carts/Messages for that phone/email.
  - Delete or anonymize the records.
  - Acknowledge the webhook.

---

## 5. API Security Standards

### 5.1 Webhook Verification
- **Shopify:** Validate `X-Shopify-Hmac-Sha256` using the raw body buffer. (Already partially implemented, must be strict).
- **WhatsApp:** Validate `X-Hub-Signature-256` if provided, or rely on `verify_token` for setup.
- **Replay Attacks:** Check the `X-Shopify-Webhook-Id` against a cache of processed IDs (deduplication) with a 5-minute TTL.

### 5.2 Rate Limiting
- Implement a **Token Bucket** rate limiter in KV.
- **Limits:**
  - Dashboard API: 60 req/min per IP/Shop.
  - Webhooks: No limit (queue them), but validate signature first to prevent DoS.

### 5.3 Input Validation
- Use **Zod** for all incoming JSON bodies.
- Sanitize inputs to prevent Injection (though NoSQL/KV is less vulnerable to SQLi, logic injection is possible).
- **Phone Numbers:** Strictly validate E.164 format before sending to WhatsApp API.

---

## 6. Payment & Billing Security

### 6.1 Subscription Enforcement
- **Source of Truth:** Shopify Billing API. Do not trust local DB state indefinitely.
- **Sync:** Re-verify subscription status on every Dashboard load or daily via cron.
- **Downgrades:** If a subscription is cancelled (`app_subscriptions/update` webhook), immediately downgrade the local plan to `Free` and disable paid features (automations).

### 6.2 Plan Limits
- **Check-before-Send:** Before sending a WhatsApp message:
  1. Check plan limits (e.g., 500 msgs/month).
  2. Check current usage.
  3. Atomically increment usage *only* if within limits.
  - *Current implementation has a race condition (check then set). Use atomic increment if available, or lock.*

---

## 7. Secrets & Infrastructure

### 7.1 Environment Variables
- **Strict Separation:**
  - `SHOPIFY_CLIENT_SECRET`: **Production Only**. Never commit to Git.
  - `WHATSAPP_ACCESS_TOKEN`: Store in Env, not Code.
- **Access Control:** Only the Founder/Lead Dev has access to Production Env Vars in Render/Supabase.

### 7.2 Secure Headers
- Continue using `hono/secure-headers` to enforce:
  - `Strict-Transport-Security` (HSTS)
  - `X-Content-Type-Options: nosniff`
  - `Referrer-Policy: strict-origin-when-cross-origin`

---

## 8. Monitoring & Incident Response

### 8.1 Logging Standards
- **Format:** JSON Structured Logging.
- **Levels:** `INFO` (Flow), `WARN` (Retryable errors), `ERROR` (Failures), `FATAL` (Security breach/Crash).
- **Anonymization:**
  ```json
  // BAD
  {"event": "message_sent", "phone": "+15550199"}

  // GOOD
  {"event": "message_sent", "cart_id": "c_123", "shop_hash": "a1b2..."}
  ```

### 8.2 Alerting
- Set up alerts (Email/Slack) for:
  - **Webhook HMAC Failures** (> 5 in 1 min) -> Potential Attack.
  - **Billing API Failures** -> Revenue Risk.
  - **Rate Limit Hits** -> Potential Abuse.

### 8.3 Incident Plan (MVP)
1. **Rotate Secrets:** If a leak is suspected, immediately rotate Shopify Secret and WhatsApp Tokens.
2. **Pause Queues:** Stop the Job Queue consumer to prevent spamming customers during a bug.
3. **Notify:** Email affected merchants transparently.

---

## 9. Developer Checklist (Pull Request Guardrails)

- [ ] **Multi-tenancy:** Does this DB query filter by `shop`?
- [ ] **Auth:** Is this endpoint protected by Session Token or HMAC?
- [ ] **PII:** Did I remove all `console.log(customerData)`?
- [ ] **Secrets:** Am I using `Deno.env.get()` instead of hardcoded strings?
- [ ] **Billing:** Does this feature check the Plan Limits?
