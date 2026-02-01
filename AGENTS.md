# Agent Directives

This file contains mandatory instructions for all AI agents and human developers working on this repository.
**Scope:** Entire Repository.

---

## 🛡️ Security & Compliance Rules (Mandatory)

### 1. Multi-Tenancy Enforcement
*   **Rule:** Every database read/write operation MUST be scoped to a specific `shop` or `merchant`.
*   **Check:** Before writing any KV store query, verify you are using a key pattern like `shop:{shopId}:...` or filtering by `shop_domain`.
*   **Prohibited:** Global keys (e.g., `all_users`, `dashboard_metrics`) that mix data from multiple merchants are strictly forbidden.

### 2. Data Privacy & PII
*   **Rule:** NEVER log Personally Identifiable Information (PII) to the console or files.
*   **PII Includes:** Phone numbers, Email addresses, Customer Names, Physical Addresses.
*   **Action:** In `catch` blocks or debug logs, log IDs only (e.g., `CartID: 123`).
*   **Refactor:** If you see existing `console.log(payload)`, refactor it to redact PII immediately.

### 3. Authentication & Authorization
*   **Rule:** All new API endpoints must be protected.
    *   **Public Webhooks:** Must verify HMAC (Shopify) or Verify Token (WhatsApp).
    *   **Internal/Dashboard:** Must verify a Session Token or JWT.
*   **Check:** Ensure no "admin" routes are exposed without authentication middleware.

### 4. Secrets Management
*   **Rule:** Never hardcode API keys, secrets, or tokens.
*   **Action:** Use `Deno.env.get("KEY_NAME")` or `import.meta.env.KEY_NAME`.
*   **Check:** Verify that `env.example` is updated if new keys are introduced, but NEVER commit `.env`.

### 5. Input Validation
*   **Rule:** Trust no input.
*   **Action:** Use `zod` schemas to validate all request bodies and query parameters.
*   **Specific:** Validate phone numbers to E.164 format before interacting with WhatsApp APIs.

---

## 🛠️ Coding Standards

*   **Runtime:** Code must be compatible with Deno (Supabase Edge Functions). Use `.ts`/`.tsx` extensions.
*   **Imports:** Use `npm:` specifiers for Node modules in Deno (e.g., `import { Hono } from "npm:hono";`).
*   **Testing:** Create verification scripts in `scripts/` using `tsx` to validate logic changes.
