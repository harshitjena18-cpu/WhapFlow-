# Sentinel Security Journal

## 2025-07-10 - Multi-Tenancy IDOR via Shop Parameter
**Vulnerability:** Many API endpoints (metrics, status, templates, billing) accepted a `shop` parameter but lacked validation to ensure it was a valid Shopify domain. This allowed potential IDOR attacks and multi-tenancy leaks where an attacker could probe for merchant existence or manipulate data by providing arbitrary strings.
**Learning:** In a multi-tenant SaaS, validating the format and existence of a tenant identifier is a critical first line of defense. Even if full session validation is not yet implemented, strict domain pattern matching prevents a wide range of probing attacks.
**Prevention:** Enforce centralized domain validation (using `SHOPIFY_DOMAIN_REGEX`) for all endpoints that accept a tenant identifier. Use middleware where possible, or standardized helpers in every route.

## 2025-07-10 - Missing Regex Import in Security Handlers
**Vulnerability:** The `SHOPIFY_DOMAIN_REGEX` was used in `index.tsx` for critical security checks but was not imported, leading to a `ReferenceError`. This effectively disabled the intended security validations and caused the application to crash when hit.
**Learning:** Security features are only as good as their implementation integrity. A missing import can silently (or loudly via crashes) bypass critical validation logic.
**Prevention:** Ensure all security constants are centralized and properly imported. Use automated linting or build checks to catch missing references in security-critical paths.

## 2025-07-10 - Unprotected Internal Messaging Endpoint
**Vulnerability:** The `/api/whatsapp/send` endpoint was completely unprotected, allowing anyone to send WhatsApp messages if they knew the URL. This posed a significant risk for spam, cost exhaustion, and reputation damage.
**Learning:** Development or "simulated" endpoints often bypass standard security controls and can be left in production by accident.
**Prevention:** Always protect internal or administrative endpoints with strong authentication (e.g., verifying against a service role key) even in MVP or demo phases.

## 2025-07-10 - PII Encryption Bypass in Automation Logic
**Vulnerability:** Although customer PII (email, phone, name) was encrypted at rest in the KV store, the automation logic in `executeAutomation` failed to decrypt this data before using it. This caused safety checks (like `checkOrderExists`) to fail silently and resulted in encrypted strings being sent to external APIs (like WhatsApp), leading to both functional failure and potential privacy leaks.
**Learning:** Encryption at rest is only effective if the application correctly handles the data's lifecycle, including decryption at the last possible moment before use. Silent failures in security-related safety checks can lead to unexpected behaviors like spamming customers.
**Prevention:** Always verify that data fetched from encrypted storage is decrypted before being passed to external services or safety-critical logic. Use type systems or naming conventions (e.g., `encEmail`) to distinguish between encrypted and plain text data.

## 2025-07-10 - PII Leak via Object Mutation in Automation
**Vulnerability:** The `executeAutomation` function decrypted PII and overwrote the fields in the `currentCart` object. When the object was subsequently saved back to KV, the PII was stored in plaintext, bypassing the encryption-at-rest requirement.
**Learning:** Decrypting data directly into objects that are destined for persistence is a common source of accidental data leakage. Security logic should maintain a clear separation between "data at rest" (encrypted) and "data in flight/use" (plaintext).
**Prevention:** Always decrypt PII into local, short-lived variables. Never mutate persistence-bound objects with plaintext data unless the intent is specifically to change the stored value to plaintext.
