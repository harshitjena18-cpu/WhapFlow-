## 2025-05-14 - Constant-time comparison for Webhook Verification
**Vulnerability:** WhatsApp webhook verification was using standard '===' comparison for the verify token, making it susceptible to timing attacks.
**Learning:** Even simple GET-based verification tokens should use constant-time comparison. Multi-tenant apps are especially sensitive to these leaks.
**Prevention:** Always use 'secureCompare' (SHA-256 hash + timingSafeEqual) for any secret or token comparison, regardless of the transport method (GET params or POST headers).
