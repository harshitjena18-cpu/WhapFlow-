## 2025-05-15 - [Multi-Tenancy Leak in Dashboard APIs]
**Vulnerability:** Dashboard data and metrics endpoints relied on an untrusted `shop` query parameter without verifying if the requester was authorized for that shop.
**Learning:** In Shopify embedded apps, the frontend must provide a Session Token (JWT) which the backend must verify to ensure the requester's identity. Relying on query parameters alone allows IDOR (Insecure Direct Object Reference) vulnerabilities.
**Prevention:** Always implement a verification middleware for dashboard/admin routes that validates the Shopify Session Token and matches the `dest` claim against the requested resource.

## 2025-05-16 - [IDOR in Template Management APIs]
**Vulnerability:** Template CRUD endpoints (`/api/templates`) relied on the untrusted `shop` query parameter for scoping database operations, allowing any authenticated merchant to manipulate templates of other shops.
**Learning:** Middleware alone is not enough; handlers must be explicitly updated to prioritize the verified identity (from the JWT `dest` claim) over user-provided parameters to effectively prevent IDOR.
**Prevention:** Enforce `verifyShopifySession` on all merchant-facing API sub-apps and always use `c.get("verified_shop")` as the primary source of truth for multi-tenant scoping in handlers.
