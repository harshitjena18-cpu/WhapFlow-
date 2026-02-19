## 2025-05-15 - [Multi-Tenancy Leak in Dashboard APIs]
**Vulnerability:** Dashboard data and metrics endpoints relied on an untrusted `shop` query parameter without verifying if the requester was authorized for that shop.
**Learning:** In Shopify embedded apps, the frontend must provide a Session Token (JWT) which the backend must verify to ensure the requester's identity. Relying on query parameters alone allows IDOR (Insecure Direct Object Reference) vulnerabilities.
**Prevention:** Always implement a verification middleware for dashboard/admin routes that validates the Shopify Session Token and matches the `dest` claim against the requested resource.

## 2025-05-16 - [Unprotected Admin Signup & IDOR in Core APIs]
**Vulnerability:** The `/signup` endpoint was public and used the service role key to create users. Additionally, multiple core APIs (Integrations, Billing, AI, Templates) relied on untrusted `shop` parameters from query/body.
**Learning:** Security middleware must be applied consistently across all modules. Relying on "implicit" security or mounting routes under a base path is not enough. Admin-only endpoints must explicitly verify internal secrets.
**Prevention:** Use `app.use` to enforce authentication middleware at the router level. Prioritize verified context values (e.g., `verified_shop`) over user-provided inputs in all database and API operations.
