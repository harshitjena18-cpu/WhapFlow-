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

## 2025-05-24 - OAuth Callback HMAC Timing Attack & SSRF Risk
**Vulnerability:** The Shopify OAuth callback was using manual string comparison for hex-encoded HMACs and lacked domain validation for the `shop` parameter used in subsequent internal API calls.
**Learning:** Cryptographic signatures in OAuth flows are just as sensitive to timing attacks as webhooks. Additionally, unvalidated tenant-provided domains can lead to SSRF or token leakage if used in server-side requests.
**Prevention:** Enforce constant-time comparison for all signature checks. Strictly validate tenant identifiers (e.g., ensuring shop domains match expected patterns like `*.myshopify.com`) before using them in network requests.

## 2025-06-05 - Shopify Search Query Injection
**Vulnerability:** User-provided inputs (email, phone) were directly interpolated into Shopify Admin API GraphQL search queries without sanitization, potentially allowing attackers to manipulate query logic.
**Learning:** Even though Shopify's search syntax is not SQL, it still supports logical operators (AND, OR, NOT) and quoting that can be exploited if inputs contain special characters like double quotes or backslashes.
**Prevention:** Always sanitize inputs used in structured search queries. Implement a dedicated utility to escape special characters (e.g., `escapeShopifySearch`) and apply it to all user-provided values before query construction.

## 2025-06-12 - Faulty Crypto Key Caching & Version Fragmentation
**Vulnerability:** The `crypto.ts` module had missing variable declarations causing `ReferenceError` and a critical logic bug where a derived `CryptoKey` from PBKDF2 (salt-dependent) was being cached and reused for all subsequent operations regardless of salt.
**Learning:** Performance-driven caching in cryptographic modules is extremely dangerous if the cache key (the secret) does not represent all entropy used in derivation (the salt). Reusing a key with the wrong salt leads to decryption failures and return corrupted data. Reusing a key with the wrong salt leads to decryption failures and potential security undefined behavior.
**Prevention:** Use HKDF (Hash-based Key Derivation Function) to derive a stable master key from secrets for caching. For schemes requiring per-encryption entropy (PBKDF2), ensure the cache accounts for the salt or disable caching. When upgrading algorithms, always increment the version prefix (e.g., `enc:v3:`) to prevent breaking existing data.

## 2025-06-19 - PII Encryption at Rest and Graceful Degradation
**Vulnerability:** Customer Personally Identifiable Information (PII) like names, emails, and phone numbers were stored in plaintext in the KV store, posing a risk in case of database unauthorized access.
**Learning:** Implementing encryption at rest for PII in a legacy system requires a "fail-safe" or "graceful degradation" approach to decryption. If the decryption utility doesn't handle plaintext inputs by returning them as-is, the application will break for all existing records.
**Prevention:** Ensure the `decrypt` utility is designed to identify encrypted formats (e.g., via prefixes like `enc:v3:`) and return the input unchanged if no known prefix is found. This allows for a rolling migration where new data is encrypted while old data remains accessible until rotated or purged.
