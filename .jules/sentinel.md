## 2025-05-15 - [Multi-Tenancy Leak in Dashboard APIs]
**Vulnerability:** Dashboard data and metrics endpoints relied on an untrusted `shop` query parameter without verifying if the requester was authorized for that shop.
**Learning:** In Shopify embedded apps, the frontend must provide a Session Token (JWT) which the backend must verify to ensure the requester's identity. Relying on query parameters alone allows IDOR (Insecure Direct Object Reference) vulnerabilities.
**Prevention:** Always implement a verification middleware for dashboard/admin routes that validates the Shopify Session Token and matches the `dest` claim against the requested resource.
