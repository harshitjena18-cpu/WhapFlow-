## 2025-05-15 - Fail-Open Webhook Verification
**Vulnerability:** Webhook HMAC verification was implemented with a "fail-open" pattern. If the `SHOPIFY_CLIENT_SECRET` environment variable was missing or if the HMAC header was omitted, the code logged a warning and proceeded to process the payload.
**Learning:** This pattern allowed complete bypass of security checks by simply omitting headers or through server misconfiguration.
**Prevention:** Always implement security checks with a "fail-closed" approach. Ensure required secrets and headers are present and valid, otherwise reject the request with appropriate error codes (401 for missing/invalid auth, 500 for missing server configuration).
