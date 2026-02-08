/**
 * Safely extracts an error message from an unknown error value.
 * This is used to replace 'any' casting in catch blocks.
 *
 * @param error - The error value caught in a try/catch block
 * @returns The error message string, or undefined if not found
 */
export function getErrorMessage(error: unknown): string | undefined {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  if (typeof error === 'object' && error !== null && 'message' in error) {
    return String((error as any).message);
  }

  return undefined;
}
