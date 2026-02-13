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

## 2025-07-10 - Broken Encryption Loop (Missing Decryption at Use)
**Vulnerability:** Personally Identifiable Information (PII) like names and phone numbers were encrypted at ingestion but not decrypted before being used in safety checks (Shopify order search) or external APIs (WhatsApp). This caused security features to break core functionality and safety-critical spam prevention.
**Learning:** Security features must be integrated into the entire data lifecycle. Encryption at rest is useless or even harmful if the application doesn't know when and how to decrypt that data for legitimate processing.
**Prevention:** Always verify the full data path of sensitive information. If data is encrypted at rest, ensure the processing logic (automations, external calls) has the necessary logic to decrypt and use it securely.
