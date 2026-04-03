## 2025-05-15 - [Multi-Tenancy Leak in Dashboard APIs]
**Vulnerability:** Dashboard data and metrics endpoints relied on an untrusted `shop` query parameter without verifying if the requester was authorized for that shop.
**Learning:** In Shopify embedded apps, the frontend must provide a Session Token (JWT) which the backend must verify to ensure the requester's identity. Relying on query parameters alone allows IDOR (Insecure Direct Object Reference) vulnerabilities.
**Prevention:** Always implement a verification middleware for dashboard/admin routes that validates the Shopify Session Token and matches the `dest` claim against the requested resource.

## 2025-05-16 - [IDOR in Template Management APIs]
**Vulnerability:** Template CRUD endpoints (`/api/templates`) relied on the untrusted `shop` query parameter for scoping database operations, allowing any authenticated merchant to manipulate templates of other shops.
**Learning:** Middleware alone is not enough; handlers must be explicitly updated to prioritize the verified identity (from the JWT `dest` claim) over user-provided parameters to effectively prevent IDOR.
**Prevention:** Enforce `verifyShopifySession` on all merchant-facing API sub-apps and always use `c.get("verified_shop")` as the primary source of truth for multi-tenant scoping in handlers.

## 2025-05-17 - [Insecure Identity Source and Loose Multi-Tenancy]
**Vulnerability:** Middleware used untrusted query parameters as fallbacks for identity, and allowed a `"global"` shop identifier to bypass multi-tenancy checks. It also lacked validation for the shop domain extracted from JWT.
**Learning:** Security middleware must derive identity *exclusively* from the verified token. Any fallback to user-provided parameters or hardcoded bypasses ("global") introduces potential IDOR or impersonation vectors.
**Prevention:** Derivce identity solely from `verified_shop` in context. Validate the extracted hostname against a strict domain regex before allowing any operation to proceed.

## 2025-05-18 - [PII Leak in External API Error Logging]
**Vulnerability:** WhatsApp API error responses were logged and stored in full, containing customer phone numbers. OAuth state tokens were also logged during verification failures.
**Learning:** External APIs often echo sensitive input in error messages. Logging the raw error object can bypass PII redaction efforts applied to successful paths.
**Prevention:** Always sanitize or redact error objects from external services before logging or persisting them. Extract only the necessary error message and status code.

## 2025-05-22 - [PII Leak in Shopify GraphQL and Global Error Handling]
**Vulnerability:** Shopify GraphQL error responses containing customer PII (emails/phone numbers) in the query or variables were logged in full. Additionally, the automation runner persisted raw error objects to the database.
**Learning:** Centralized error helpers should include PII redaction logic to ensure defense-in-depth across the entire application, as developers may forget to manually redact in every catch block.
**Prevention:** Use a `redactPII` utility in the global `getErrorMessage` helper and ensure all external API clients (Shopify, WhatsApp, OpenAI) explicitly redact or omit full error objects from logs.

## 2025-05-23 - [Redundant Query Parameter Fallback in Dashboard Routes]
**Vulnerability:** Dashboard API handlers used a fallback to an untrusted `shop` query parameter when the `verified_shop` context was missing, creating a potential IDOR vector if middleware was bypassed.
**Learning:** Even with security middleware in place, handlers should not provide fallbacks to untrusted inputs. A missing verified identity should always result in an explicit authorization failure (Fail-Closed).
**Prevention:** Remove all `|| c.req.query("shop")` fallbacks in protected routes and strictly rely on the context value provided by the verification middleware.

## 2025-05-24 - [PII Leak in WhatsApp Sending API Responses]
**Vulnerability:** The WhatsApp Meta Cloud API echoes back the recipient's phone number in the `contacts` array of a successful response. This was being returned in full by the `sendWhatsAppTemplate` helper and subsequently by route handlers, leading to unintentional PII exposure to clients and in logs. Additionally, raw error objects in the catch block could leak PII in logged stack traces.
**Learning:** External API responses should not be blindly returned to the client. They often contain data that was already provided in the request (PII) or internal metadata that should not be exposed. Redundant error objects can also bypass manual sanitization if not handled by a central utility.
**Prevention:** Explicitly extract only the necessary fields (e.g., `wamid`) from external API responses and omit the raw data object. Use a central error handler like `getErrorMessage` with built-in PII redaction for all catch blocks that involve external service calls. Validate all sensitive inputs (like phone numbers) at the helper level before any network I/O.
