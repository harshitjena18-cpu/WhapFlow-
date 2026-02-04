## 2025-05-15 - Fail-Open Webhook Verification
**Vulnerability:** Webhook HMAC verification was implemented with a "fail-open" pattern. If the `SHOPIFY_CLIENT_SECRET` environment variable was missing or if the HMAC header was omitted, the code logged a warning and proceeded to process the payload.
**Learning:** This pattern allowed complete bypass of security checks by simply omitting headers or through server misconfiguration.
**Prevention:** Always implement security checks with a "fail-closed" approach. Ensure required secrets and headers are present and valid, otherwise reject the request with appropriate error codes (401 for missing/invalid auth, 500 for missing server configuration).

## 2025-05-16 - PII Leakage in Application Logs
**Vulnerability:** Personally Identifiable Information (PII) including customer names, phone numbers, emails, and recovery URLs were being logged in plaintext to the console in webhook handlers and API routes.
**Learning:** Even with a security blueprint in place, debug logs can easily become a source of PII leakage if not rigorously audited. Standard logging of "payloads" or "extracted data" often defaults to including sensitive fields.
**Prevention:** Implement a strict "no-PII in logs" policy enforced by code reviews. Use redaction by default for any field that could contain user data. Prefer logging only internal IDs (CartID, MessageID) for traceability.

## 2025-05-17 - Plaintext Access Token Storage
**Vulnerability:** Shopify Admin API access tokens were stored in plaintext in the KV store (`merchant:${shop}` keys).
**Learning:** Storing third-party API tokens in plaintext creates a high-impact risk if the database or KV store is compromised. Even in early stages, sensitive credentials should be encrypted at rest.
**Prevention:** Implement a standard encryption utility for all sensitive credentials stored at rest. Use AES-GCM or similar modern algorithms with keys managed via environment variables. Ensure the utility supports backward compatibility for seamless migration of existing plaintext records.
