# Sentinel Security Journal

## 2025-05-15 - [Critical] ReferenceError in WhatsApp Send Endpoints
**Vulnerability:** Denail of Service / Runtime Crash.
**Learning:** The `/whatsapp/send` endpoints were referencing `isServiceAuth` and `isWhatsappAuth` which were not defined in the scope. This would cause the entire request to fail with a 500 error instead of providing a helpful warning or proceeding securely.
**Prevention:** Always verify that variables used in logging or warning blocks are properly defined and imported. Use automated verification scripts to exercise all code paths, including deprecated or warning paths.

## 2025-05-15 - Insecure CORS Origin Validation
**Vulnerability:** Potential CORS bypass.
**Learning:** Using `startsWith` to validate origins like `http://localhost:` can be permissive or brittle. It might allow origins like `http://localhost.attacker.com` if not carefully implemented (though the trailing colon in the original code mitigated this specific case, it's still a sub-optimal pattern).
**Prevention:** Use anchored regular expressions (`LOCALHOST_REGEX`) to strictly validate origins, ensuring that only the intended domains and ports are allowed.
