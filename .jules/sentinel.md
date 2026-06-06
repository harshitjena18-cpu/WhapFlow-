## 2025-05-14 - Timing Attack in WhatsApp Webhook Verification
**Vulnerability:** Insecure string comparison (`token === verifyToken`) in the WhatsApp webhook verification GET route.
**Learning:** Using simple equality operators for sensitive token verification exposes the application to timing attacks, where an attacker can deduce the correct token by measuring response times.
**Prevention:** Always use constant-time comparison utilities like `secureCompare` (which hashes inputs before comparison) for verifying security tokens or secrets.

## 2025-05-14 - Redundant Utility Definitions and CI Linting
**Vulnerability:** Multiple duplicate definitions of core security and storage utilities (`secureCompare`, `claimBatch`) across the backend.
**Learning:** Duplicate definitions with the same signature in the same scope cause CI failures in Deno environments ("Redeclaration is not allowed"). This often happens during rapid refactoring or manual merging of performance optimizations.
**Prevention:** Consolidate shared utilities into single, well-documented implementations. Use `grep` or `ls` to check for existing definitions before adding new ones, especially in files that have undergone significant performance tuning.
