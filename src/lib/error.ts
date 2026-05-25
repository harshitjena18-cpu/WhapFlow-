/**
 * Redacts Personally Identifiable Information (PII) like emails and phone numbers from a string.
 * This is a security defense-in-depth measure to prevent leaking sensitive customer data in logs.
 */
export function redactPII(text: string): string {
  if (!text) return text;
  // Regex for emails
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  // Regex for common phone number formats (8+ digits)
  // Optimized to reduce backtracking and handle varied delimiters safely
  const phoneRegex = /(?:\+?\d{1,3}[ \-]?)?\(?\d{3}\)?[ \-]?\d{2,3}[ \-]?\d{2,}/g;

  return text
    .replace(emailRegex, "[REDACTED_EMAIL]")
    .replace(phoneRegex, "[REDACTED_PHONE]");
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
