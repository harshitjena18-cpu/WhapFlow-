# WhapFlow QA & Release Blueprint

**Version:** 1.0
**Target:** Shopify App Store Launch
**Audience:** Founder / Release Manager

This document outlines the mandatory quality assurance strategy for WhapFlow. It is designed to be executed manually by a small team before public release.

---

## 1. Pre-Launch Readiness Checklist

**Status:** 🔴 Todo | 🟡 In Progress | 🟢 Ready

| Category | Item | Check |
| :--- | :--- | :--- |
| **Env Vars** | `SHOPIFY_CLIENT_SECRET`, `WHATSAPP_ACCESS_TOKEN`, etc. are set in production. | [ ] |
| **Shopify** | App Listing "App URL" points to production URL. | [ ] |
| **Shopify** | Allowed Redirection URL includes `https://<prod-domain>/make-server-c8eef56a/auth/shopify/callback`. | [ ] |
| **Shopify** | Webhook API version is set to latest stable (e.g., `2023-10` or newer). | [ ] |
| **WhatsApp** | Business Account is "Verified" (or ready for verification). | [ ] |
| **WhatsApp** | `WHATSAPP_VERIFY_TOKEN` matches the value in Meta App Dashboard. | [ ] |
| **Database** | KV Store is reachable; Indexes (if any) are active. | [ ] |
| **Legal** | Privacy Policy and Terms of Service URLs are active and content is correct. | [ ] |
| **Billing** | All 4 plans (Free, Starter, Growth, Pro) are configured in `billing.ts` with correct pricing. | [ ] |

---

## 2. Manual Merchant Journeys (Critical Flows)

*Execute these strictly in order using a generic "Test Store".*

### A. The "New Install" Flow
1.  **Start:** Open an incognito browser window.
2.  **Action:** Visit your App's Installation URL (or select "Install App" from Shopify Partner Dashboard).
3.  **Verify:**
    *   Redirects to Shopify Admin OAuth screen.
    *   Requests correct scopes (`read_checkouts`, `read_orders`).
    *   **Pass:** Redirects to `/dashboard` after approval.
    *   **Check Data:** In KV/Database, verify key `merchant:<your-shop-domain>` exists and has `shopify_connected: true`.

### B. The "Setup" Flow
1.  **Dashboard Load:** Verify Dashboard shows "Shopify Connected: ✅".
2.  **WhatsApp Config:**
    *   Enter invalid credentials -> Verify Error Toast.
    *   Enter valid credentials -> Verify Success & "WhatsApp Connected: ✅".
3.  **Template Creation:**
    *   Create a template named `welcome_offer`.
    *   Verify it appears in the list.
    *   Enable it (Toggle ON).
    *   **Check Data:** Verify `template:<uuid>` exists in KV and `enabled: true`.

### C. The "Abandonment" Flow (Simulation)
1.  **Action:** Go to your Shopify Storefront as a customer.
2.  **Action:** Add item to cart -> Go to Checkout.
3.  **Action:** Enter email & phone number -> **Stop**. Close tab.
4.  **Wait:** Wait for Shopify to fire `checkouts/create` or `checkouts/update` (can trigger manually via Shopify Admin -> Abandoned Checkouts -> Send Recovery Email if testing locally, or wait for webhook).
    *   *Dev Tip:* Use Postman to simulate the webhook if Shopify delays are too long (see Section 3).
5.  **Verify:**
    *   WhapFlow Logs: "Received Webhook", "Scheduled Job".
    *   **Wait:** Wait for Template Delay time (e.g., set to 1 min for testing).
    *   **Result:** Message received on WhatsApp number?
    *   **Dashboard:** Usage count for "WhatsApp Conversations" increased by 1?

### D. The "Uninstall" Flow
1.  **Action:** In Shopify Admin > Apps, delete "WhapFlow".
2.  **Verify:**
    *   Webhook `app/uninstalled` is received.
    *   **Check Data:** `merchant:<your-shop-domain>` should have `shopify_connected: false`.
    *   **Safety:** Attempt to access Dashboard -> Should fail or prompt login.

---

## 3. Functional Testing Requirements

### Core Features

| Feature | Test Procedure | Expected Result |
| :--- | :--- | :--- |
| **Abandoned Cart Detection** | Send `checkouts/create` payload via Postman. | Saved to KV `abandoned_cart:<id>` with status `pending`. |
| **Delay Execution** | Set Template delay to 5 mins. Enqueue job. | Job executes only after 5 mins. |
| **Order Safety (Double Check)** | 1. Create Abandoned Cart. <br> 2. Create Order in Shopify (same email). <br> 3. Let Automation Trigger. | Log shows "Order found... AUTOMATION SKIPPED". **Message NOT sent.** |
| **Usage Limits** | Set `ai_generations_used` to 4 (Free Plan limit is 5). Generate 1. Generate another. | 1st succeeds. 2nd fails with "Limit Reached" error. |
| **Dashboard Metrics** | Reload Dashboard. | Metrics match backend KV data exactly. |

### Scripted Verification
Run the included scripts to verify core logic without UI clicking:
```bash
# Verify WhatsApp API Payload construction
npx tsx scripts/verify_whatsapp.ts

# Verify Template Status Logic
npx tsx scripts/verify_template_status.ts
```

---

## 4. Edge-Case & Negative Testing

**Goal:** Ensure the system doesn't crash under bad inputs.

1.  **Webhook Replay (Duplicate Delivery)**
    *   *Test:* Send the exact same `checkouts/update` webhook payload twice, 1 second apart.
    *   *Result:* System should handle gracefully (upsert logic). Ideally, only one automation job scheduled (or second overwrites first safely).

2.  **Invalid Webhook Signature**
    *   *Test:* Send a webhook with a modified `X-Shopify-Hmac-Sha256` header.
    *   *Result:* Response `401 Unauthorized`. **No processing occurs.**

3.  **Missing Credentials**
    *   *Test:* Delete `merchant:<shop>` from KV. Send webhook.
    *   *Result:* Log "Merchant not found/inactive". Return 200 (acknowledge reception) but **do not message**.

4.  **Partial Setup**
    *   *Test:* Merchant connects Shopify but NOT WhatsApp.
    *   *Result:* Dashboard shows warning. Webhook logs "WhatsApp not connected". No message attempted.

---

## 5. Auth & Security Testing

1.  **OAuth State Mismatch**
    *   *Test:* During OAuth, modify the `state` parameter in the URL manually before hitting callback.
    *   *Result:* "Error: State Mismatch". Login rejected.

2.  **Cross-Merchant Access**
    *   *Test:* Log in as Shop A. Try to manually call API endpoints for Shop B (e.g., `GET /api/billing?shop=shop-b.myshopify.com`).
    *   *Result:* Should be blocked or return generic/empty data (ensure logic checks `session` vs `requested_shop` if implemented, otherwise rely on obfuscated IDs). *Note: Current MVP relies on simple query params; ensure secure implementation before scaling.*

3.  **Token Leakage**
    *   *Test:* Search logs for "access_token".
    *   *Result:* Tokens should **never** be printed in plain text in logs.

---

## 6. Payment & Billing

1.  **Plan Upgrade**
    *   *Test:* Use `billing.ts` to simulate a plan change from Free -> Starter.
    *   *Result:* `automation_enabled` becomes `true`. Limits increase.

2.  **Billing Cycle Reset**
    *   *Test:* Manually edit KV: Set `billing_cycle_reset_at` to yesterday.
    *   *Result:* Next API call (e.g., `getBillingConfig`) triggers reset. `ai_generations_used` becomes 0. Date updates to next month.

3.  **Downgrade Enforcement**
    *   *Test:* Downgrade to Free. Ensure `automation_enabled` is `false`.
    *   *Result:* Incoming webhooks log "Automation disabled on Free plan".

---

## 7. Cross-Browser & Device

*   **Mobile Dashboard:** Open Dashboard on iPhone/Android (Chrome). Check:
    *   Can you toggle the "Enable" switch on templates? (Touch targets).
    *   Is the "Usage" chart readable?
*   **Browsers:** Test Dashboard in:
    *   Google Chrome (Primary)
    *   Safari (Critical for Mac merchants)
    *   Firefox

---

## 8. Performance Sanity Checks

1.  **Burst Traffic**
    *   *Test:* Use a script to fire 20 webhook requests in 1 second.
    *   *Result:* All return 200 OK immediately. Background queue handles processing. No 500 errors.
2.  **Dashboard Load**
    *   *Test:* Load dashboard.
    *   *Result:* < 2 seconds to interactive state.

---

## 9. Error Handling & Fallbacks

1.  **WhatsApp API Down**
    *   *Test:* Temporarily break `WHATSAPP_ACCESS_TOKEN`. Trigger automation.
    *   *Result:* Job fails. Logs "WhatsApp API Error". Job moved to `queue:failed` (or retried). **App does not crash.**
2.  **Shopify API Down**
    *   *Test:* Break `access_token` for merchant.
    *   *Result:* `checkOrderExists` fails safely. Log error.

---

## 10. Data Integrity

1.  **Cleanup:** Verify `app/uninstalled` sets `shopify_connected: false`.
2.  **Job Cleanup:** After automation runs, verify the job is removed from `queue:v1:...` in KV.
3.  **Mapping:** Verify `msg_map:<wamid>` is created after sending. This is crucial for tracking "Read" receipts later.

---

## 11. Launch-Day Readiness

### The "Kill Switch"
If something goes wrong (e.g., spamming users), you need a way to stop all messages immediately.
*   **Strategy:** Delete the `config:whatsapp` key or invalidate the WhatsApp Token in Supabase Env Vars.
*   **Test:** Verify that removing this config causes all automations to "Pause" safely (returning 200 OK to webhooks but doing nothing).

### Rollback
*   Keep the previous `deno deploy` (or Supabase Function deployment) active or ready to redeploy.

### Monitoring
*   Have **Supabase Logs** open.
*   Have **WhatsApp Business Manager** open to watch for quality rating drops.

---

## Execution Log

| Date | Tester | Version | Pass/Fail | Notes |
| :--- | :--- | :--- | :--- | :--- |
| | | | | |
