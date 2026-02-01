# WhapFlow Technical Architecture Blueprint

## 1. Executive Summary

**WhapFlow** is a Shopify SaaS application designed to recover abandoned carts via automated WhatsApp messaging. The system architecture prioritizes **security**, **multi-tenancy**, and **developer velocity** for a solo founder or small team.

This blueprint leverages the existing **Supabase (PostgreSQL + Edge Functions)** and **React (Vite)** stack to deliver a scalable, production-ready solution without over-engineering.

---

## 2. System Architecture Overview

The system follows a **Monolithic Edge Architecture**. All backend logic resides in Supabase Edge Functions (Hono framework) to minimize cold starts and latency, while the frontend is a Single Page Application (SPA).

### High-Level Data Flow
1.  **Shopify Event**: A customer abandons a checkout. Shopify sends a webhook.
2.  **Ingestion**: Edge Function verifies HMAC, performs lightweight checks (Plan limits, Shop active), and persists the event.
3.  **Queueing**: The event is pushed to a time-delayed queue (KV Store).
4.  **Processing**: A Cron job processes ready jobs, re-verifies order status (Shopify API), and triggers WhatsApp.
5.  **Delivery**: WhatsApp Business API sends the template message.
6.  **Analytics**: Delivery status updates (Webhooks) and conversion data are aggregated for the dashboard.

---

## 3. Authentication & Authorization

### 3.1 Shopify OAuth (Merchant Auth)
*   **Protocol**: OAuth 2.0
*   **Scopes**: `read_checkouts`, `read_orders`, `write_script_tags` (if needed for pixel).
*   **Flow**:
    1.  Merchant installs app.
    2.  Redirect to `/auth/shopify`.
    3.  Callback to `/auth/shopify/callback`.
    4.  Exchange code for **Access Token**.
    5.  **Critical**: Store Access Token *encrypted* in the `merchants` table.
    6.  Create/Update User session (JWT) for the Dashboard.

### 3.2 Dashboard Access (Session Handling)
*   **Mechanism**: Supabase Auth (or Custom JWT if strictly Shopify-embedded).
*   **Multi-Tenancy**: Every database query **MUST** be scoped by `shop_id`.
    *   *Bad*: `SELECT * FROM carts`
    *   *Good*: `SELECT * FROM carts WHERE shop_id = ?`

### 3.3 Internal Admin
*   Role-based access via a `role` column in the `users` table (`admin`, `merchant`).
*   Admins can view global stats but cannot decrypt merchant tokens.

---

## 4. Backend Folder Structure

To solve the "monolithic file" problem, adopt this domain-driven structure within `src/supabase/functions/server/`:

```
src/supabase/functions/server/
├── index.tsx                # Entry point (Routing & Middleware)
├── middleware/
│   ├── verify_hmac.ts       # Shopify/WhatsApp Signature verification
│   ├── auth_guard.ts        # Dashboard session validation
│   └── rate_limit.ts        # API throttling
├── controllers/             # Request Handlers (Lightweight)
│   ├── auth_controller.ts
│   ├── webhook_controller.ts
│   └── billing_controller.ts
├── services/                # Business Logic (Heavy lifting)
│   ├── shopify_service.ts   # Shopify API wrapper
│   ├── whatsapp_service.ts  # WhatsApp API wrapper
│   ├── billing_service.ts   # Plan limits & usage tracking
│   └── queue_service.ts     # Job scheduling abstraction
├── data/                    # Database Access Layer
│   ├── kv.ts                # KV Store helpers
│   └── db.ts                # Typed Supabase/Postgres queries
└── utils/
    ├── crypto.ts            # Encryption/Decryption helpers
    └── logger.ts            # Structured logging
```

---

## 5. Database Schema (PostgreSQL)

While the MVP uses KV heavily, a robust SaaS requires Relational Tables for core data.

### Core Tables

#### `merchants`
*   `id` (UUID, PK)
*   `shop_domain` (String, Unique, Index)
*   `access_token` (Text, **Encrypted**)
*   `plan` (Enum: 'free', 'pro', 'enterprise')
*   `status` (Enum: 'active', 'uninstalled', 'frozen')
*   `whatsapp_config` (JSONB: { phone_id, waba_id })
*   `created_at`

#### `abandoned_carts`
*   `id` (UUID, PK)
*   `shop_domain` (FK -> merchants.shop_domain)
*   `checkout_id` (Shopify ID)
*   `customer_phone` (String, Normalized)
*   `cart_value` (Decimal)
*   `status` (Enum: 'pending', 'queued', 'sent', 'converted', 'recovered_by_other')
*   `recovery_url` (Text)
*   `scheduled_for` (Timestamp)

#### `message_logs`
*   `id` (UUID, PK)
*   `cart_id` (FK -> abandoned_carts.id)
*   `wamid` (String, WhatsApp Message ID)
*   `status` (Enum: 'sent', 'delivered', 'read', 'failed')
*   `cost` (Decimal, calculated cost)
*   `sent_at` (Timestamp)

#### `billing_usage`
*   `shop_domain` (FK)
*   `metric` (Enum: 'whatsapp_conversations', 'ai_generations')
*   `count` (Integer)
*   `billing_period_start` (Date)
*   `billing_period_end` (Date)

**KV Store Use Case**: High-speed caches (e.g., `rate_limit:{ip}`, `temp_auth_state:{nonce}`), and the Job Queue (`queue:v1:...`).

---

## 6. API Design Standards

### Security & Verification
1.  **Public Webhooks**:
    *   **Shopify**: MUST verify `X-Shopify-Hmac-Sha256`. Reject immediately if invalid.
    *   **WhatsApp**: MUST verify `X-Hub-Signature`.
2.  **Internal API**:
    *   Protected by Supabase Auth JWT or strict CORS + Origin checks if embedded.

### Idempotency
*   **Webhooks**: Store `shopify_event_id` in KV with a 24h TTL. If seen again, return `200 OK` but skip processing.
*   **Billing**: Usage increments must be atomic (Postgres `UPDATE ... SET count = count + 1`).

### Error Responses
Standardize JSON error format:
```json
{
  "error": "ERR_CODE",
  "message": "Human readable message",
  "request_id": "req_12345"
}
```

---

## 7. Business Logic & Lifecycle

### Automation State Machine
1.  **Checkout Created**: Save as `pending`.
2.  **Schedule**: Calculate delay (e.g., 30 mins). Push to Queue.
3.  **Execution Time**:
    *   **Check 1**: Is Shop active? (If not, abort).
    *   **Check 2**: Is Plan active & within limits? (If not, abort/log).
    *   **Check 3**: **CRITICAL** - Call Shopify Admin API (`orders` endpoint) to see if customer already purchased. (If yes, mark `recovered_by_other`).
    *   **Action**: Send WhatsApp. Mark `sent`.
4.  **Post-Action**: Listen for WhatsApp webhooks (read receipts) to update status.

### Uninstall Flow
1.  **Webhook (`app/uninstalled`)**:
    *   Mark merchant status as `uninstalled`.
    *   **Do NOT delete data immediately** (allow for 30-day reactivation grace period).
    *   Cancel any pending queued jobs for this shop.

### Billing Lifecycle
*   **Check**: Before *every* resource-intensive action (AI gen, Message send).
*   **Reset**: Cron job runs daily to check `billing_period_end` and reset counters if cycle passed.

---

## 8. Logging, Monitoring & Alerting

### Strategy
*   **Do Log**: High-level flow steps ("Webhook received", "Job processed"), Errors with stack traces, Billing events.
*   **Do NOT Log**: PII (Customer Names, Phones), Decrypted Access Tokens, Message Content (if sensitive).

### Debugging Failed Automations
*   Maintain a `dead_letter_queue` in KV/DB for jobs that failed 3 times.
*   Dashboard "Logs" view for merchants to see *why* a message wasn't sent (e.g., "Skipped: Customer already ordered").

### Critical Alerts (Use Sentry or Log Drains)
*   Webhook Failure Rate > 5%.
*   Shopify API 401/403 (Invalid tokens - requires re-auth).
*   Billing Cap Reached (Revenue risk).

---

## 9. Backup & Performance

### Backups
*   **Postgres**: Enable Point-In-Time Recovery (PITR) in Supabase.
*   **KV**: Treat as ephemeral. If using for queue, accept slight risk or migrate to Postgres-based queue (pg-boss) for strict durability.

### Performance
*   **Webhooks**: fast path. Verify -> Enqueue -> Return 200. Do NOT process logic in the webhook request.
*   **Concurrency**: Limit parallel WhatsApp API calls to avoid rate limits (e.g., 50 req/sec).
*   **Database Indexing**: Index `shop_domain` and `created_at` on all tables.

---

## 10. Common Pitfalls to Avoid

| Mistake | Solution |
| :--- | :--- |
| **Overusing Webhooks** | Do not trust webhooks blindly for "state". Always verify with Shopify API before sending messages (the "Check 3" in logic). |
| **Weak Tenant Isolation** | Never use global configs. Every function arg must include `shop_domain`. |
| **Ignoring Idempotency** | Shopify retries webhooks. Handle duplicates gracefully to avoid double-charging or double-messaging. |
| **Hardcoded Credentials** | Use Environment Variables (`Deno.env`) and Secret Stores. Never commit keys. |
| **Blocking the Event Loop** | Use `Promise.all` for parallel IO, but avoid unbounded concurrency. Use the Queue. |
| **Billing Logic in UI** | NEVER trust the frontend for billing. Enforce limits strictly in the Backend Service. |

---

## Implementation Roadmap (Immediate Steps)
1.  **Refactor Directory**: Create the folder structure defined in Section 4.
2.  **Harden Auth**: Implement `verify_hmac` middleware and encrypted token storage.
3.  **Migrate Data**: Move `merchant` KV data to a proper Postgres Table.
4.  **Optimize Queue**: Ensure the Cron queue processor handles retries.

This architecture provides a solid foundation for WhapFlow to scale from 10 to 10,000 merchants.
