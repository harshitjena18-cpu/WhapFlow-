## 2025-05-24 - [PII Leak in WhatsApp Sending Response]
**Vulnerability:** The WhatsApp sending routes (`/api/whatsapp/send`) were returning the raw Meta API response to the client. This response contains the recipient's phone number, leading to a PII leak.
**Learning:** External API responses often echo back sensitive input data. Sanitizing these responses is crucial for defense-in-depth, even if the client already "knows" the data.
**Prevention:** Always return a sanitized, minimal response from API endpoints. Extract only necessary identifiers (like `wamid`) and avoid passthrough of external API payloads.

## 2025-05-24 - [Missing Input Validation for Phone Numbers]
**Vulnerability:** The system lacked strict validation for WhatsApp recipient phone numbers, potentially allowing malformed or malicious strings to be passed to the Meta API.
**Learning:** Relying on downstream APIs for validation is insufficient and can lead to unexpected behavior or resource exhaustion.
**Prevention:** Enforce strict E.164 validation (`/^\+[1-9]\d{6,14}$/`) at the service layer before any external API calls.
