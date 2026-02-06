## 2025-05-15 - Fail-Open Webhook Verification
**Vulnerability:** Webhook HMAC verification was implemented with a "fail-open" pattern. If the `SHOPIFY_CLIENT_SECRET` environment variable was missing or if the HMAC header was omitted, the code logged a warning and proceeded to process the payload.
**Learning:** This pattern allowed complete bypass of security checks by simply omitting headers or through server misconfiguration.
**Prevention:** Always implement security checks with a "fail-closed" approach. Ensure required secrets and headers are present and valid, otherwise reject the request with appropriate error codes (401 for missing/invalid auth, 500 for missing server configuration).

## 2025-05-16 - PII Leakage in Application Logs
**Vulnerability:** Personally Identifiable Information (PII) including customer names, phone numbers, emails, and recovery URLs were being logged in plaintext to the console in webhook handlers and API routes.
**Learning:** Even with a security blueprint in place, debug logs can easily become a source of PII leakage if not rigorously audited. Standard logging of "payloads" or "extracted data" often defaults to including sensitive fields.
**Prevention:** Implement a strict "no-PII in logs" policy enforced by code reviews. Use redaction by default for any field that could contain user data. Prefer logging only internal IDs (CartID, MessageID) for traceability.

## 2025-05-17 - Insecure Multi-Tenancy in Dashboard Routes
**Vulnerability:** Dashboard routes were using global KV keys (e.g., `dashboard_metrics`) and lacked shop-specific validation. Any user could potentially see or overwrite global mock data, and there was no enforcement of merchant existence.
**Learning:** In a multi-tenant SaaS application, all data access must be explicitly scoped by a tenant identifier (like a shop domain). Using global fallbacks or unvalidated tenant IDs in query parameters creates significant data leak risks.
**Prevention:** Always scope database/KV keys with a tenant ID (e.g., `shop:${shop}:metrics`). Implement middleware or helpers to validate that the tenant exists and that the requester has authority to access that tenant's data.

## 2025-05-17 - HMAC Timing Attack Vulnerability
**Vulnerability:** Shopify webhook HMAC verification was using direct string comparison (`===`) on Base64-encoded hashes.
**Learning:** Manual string comparison of cryptographic hashes is susceptible to timing attacks, where an attacker can deduce the correct hash by measuring small differences in response times.
**Prevention:** Always use constant-time comparison for cryptographic signatures. In web environments, prefer `crypto.subtle.verify` which is designed to be timing-attack resistant.

## 2026-02-06 - Authentication before State (Deduplication)
**Vulnerability:** Webhook deduplication was initially implemented by checking and setting the "processed" state in the KV store *before* verifying the HMAC signature of the request.
**Learning:** Performing stateful operations or consuming resources (like database hits or KV storage) before authentication allows unauthenticated attackers to potentially cause Denial of Service (DoS) or resource exhaustion by sending fake requests with random identifiers.
**Prevention:** Always perform authentication and integrity checks (HMAC verification, JWT validation, etc.) before any stateful logic or deduplication checks. Authentication must be the first gate in any sensitive handler.
