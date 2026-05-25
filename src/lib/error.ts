// PERFORMANCE: Hoist regex objects to module level to avoid repeated allocation and compilation overhead.
const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const PHONE_REGEX = /(?:\+?\d{1,3}[ \-]?)?\(?\d{3}\)?[ \-]?\d{3}[ \-]?\d{4,}/g;

// PERFORMANCE: Fast-path check for presence of digits to skip expensive phone number regex check.
const HAS_DIGITS_REGEX = /\d/;

/**
 * Redacts Personally Identifiable Information (PII) like emails and phone numbers from a string.
 * This is a security defense-in-depth measure to prevent leaking sensitive customer data in logs.
 */
export function redactPII(text: string): string {
  if (!text) return text;

  let redacted = text;

  // PERFORMANCE: Fast-path check for '@' to skip email redaction for strings that don't contain it.
  if (redacted.includes("@")) {
    redacted = redacted.replace(EMAIL_REGEX, "[REDACTED_EMAIL]");
  }

  // PERFORMANCE: Fast-path check for digits to skip phone number redaction for strings that don't contain any.
  if (HAS_DIGITS_REGEX.test(redacted)) {
    redacted = redacted.replace(PHONE_REGEX, "[REDACTED_PHONE]");
  }

  return redacted;
}

/**
 * Safely extracts an error message from an unknown error value and redacts PII.
 * This is used to replace 'any' casting in catch blocks and ensure logs are clean.
 *
 * @param error - The error value caught in a try/catch block
 * @returns The redacted error message string, or undefined if not found
 */
export function getErrorMessage(error: unknown): string | undefined {
  let message: string | undefined;

  if (error instanceof Error) {
    // SECURITY: Use stack if available for better observability, but always redact PII
    message = error.stack || error.message;
  } else if (typeof error === 'string') {
    message = error;
  } else if (typeof error === 'object' && error !== null && 'message' in error) {
    const rawMessage = (error as any).message;
    if (rawMessage !== null && rawMessage !== undefined) {
      message = String(rawMessage);
    }
  }

  if (message && message !== 'null' && message !== 'undefined') {
    return redactPII(message);
  }

  return undefined;
}
