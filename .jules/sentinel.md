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

## 2025-05-24 - [Timing Attack Vulnerability in Token Comparisons]
**Vulnerability:** Sensitive tokens (WhatsApp verify token, OAuth state, API keys) were compared using standard equality operators (`===`), which are not constant-time and can leak information via timing side-channels.
**Learning:** Standard string comparisons return early on the first mismatched character. `node:crypto`'s `timingSafeEqual` provides constant-time comparison but requires equal-length buffers. Hashing inputs with SHA-256 before comparison allows for safe, constant-time comparison of strings with arbitrary lengths.
**Prevention:** Use a `secureCompare` utility that hashes inputs before using `timingSafeEqual` for all security-sensitive string comparisons.

## 2025-05-23 - [Redundant Query Parameter Fallback in Dashboard Routes]
**Vulnerability:** Dashboard API handlers used a fallback to an untrusted `shop` query parameter when the `verified_shop` context was missing, creating a potential IDOR vector if middleware was bypassed.
**Learning:** Even with security middleware in place, handlers should not provide fallbacks to untrusted inputs. A missing verified identity should always result in an explicit authorization failure (Fail-Closed).
**Prevention:** Remove all `|| c.req.query("shop")` fallbacks in protected routes and strictly rely on the context value provided by the verification middleware.

## 2025-05-24 - [Timing Attacks on Variable-Length Tokens]
**Vulnerability:** Internal API endpoints and webhook verification used standard string equality (===) for sensitive tokens like SUPABASE_SERVICE_ROLE_KEY and WHATSAPP_VERIFY_TOKEN.
**Learning:** Standard string comparison can leak information about the secret through timing differences, and Node's timingSafeEqual requires equal-length inputs. Hashing both inputs with SHA-256 before constant-time comparison allows for secure verification of variable-length secrets.
**Prevention:** Always use a timing-safe comparison utility (like secureCompare) that hashes inputs before invoking timingSafeEqual for any sensitive token or API key validation.

## 2025-05-25 - [Permanent Lockout due to Missing Rate Limit Key Suffix]
**Vulnerability:** The AI template generator rate-limiting mechanism used a static key (`rate_limit:ai_gen:${shop}:${ip}`) without an expiration or sliding window suffix, permanently locking users out after they performed 10 generations.
**Learning:** Rate-limiting keys that persist in a key-value store without built-in TTLs must explicitly incorporate time-based suffixes (such as current hour or day) to partition hits into sliding windows.
**Prevention:** Always append a sliding time window identifier (e.g., `new Date().toISOString().slice(0, 13)` for hours) to rate-limiting keys to ensure limits are naturally reset.
