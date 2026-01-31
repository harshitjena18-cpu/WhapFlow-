## 2025-01-31 - [Shopify Webhook HMAC Bypass]
**Vulnerability:** Shopify webhook HMAC verification was optional and could be bypassed if the secret or HMAC header was missing.
**Learning:** Conditional logic in security checks (e.g., `if (secret && hmac) { verify }`) can easily lead to bypasses if the "else" case isn't handled correctly (fail-closed vs fail-open).
**Prevention:** Always use a fail-closed pattern for security checks. Require all necessary credentials and headers to be present before proceeding.
