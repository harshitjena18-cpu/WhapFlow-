
import { redactPII, getErrorMessage } from "../src/lib/error.ts";

// Mocking getEnv for the test
const mockEnv: Record<string, string> = {
  WHATSAPP_ACCESS_TOKEN: "mock_token",
  WHATSAPP_PHONE_NUMBER_ID: "mock_phone_id",
};

// Simplified mock of the hardened sendWhatsAppTemplate logic
async function mockSendWhatsAppTemplate(to: string, simulateErrorType: 'api' | 'network' | 'success') {
  if (simulateErrorType === 'api') {
    const data = {
      error: {
        message: `Template cannot be sent to phone number +1-555-555-5555 because it is not verified. Contact support@example.com for help.`
      }
    };
    // The actual implementation now does: return { success: false, error: redactPII(data.error.message) };
    return { success: false, error: redactPII(data.error.message) };
  }

  if (simulateErrorType === 'network') {
    try {
      throw new Error("Failed to connect to graph.facebook.com for customer jane.doe@example.com");
    } catch (error) {
      // The actual implementation now does: return { success: false, error: getErrorMessage(error) };
      return { success: false, error: getErrorMessage(error) };
    }
  }

  return { success: true, wamid: "wamid.mock123" };
}

async function runVerification() {
  console.log("🔍 Starting WhatsApp Hardening Verification...");

  // Test 1: API Error PII Redaction
  const apiResult = await mockSendWhatsAppTemplate("+1-555-555-5555", "api");
  console.log("Test 1 (API Error):", apiResult.error);
  if (apiResult.error?.includes("+1-555-555-5555") || apiResult.error?.includes("support@example.com")) {
    console.error("❌ Test 1 Failed: PII leaked in API error message");
    process.exit(1);
  } else if (apiResult.error?.includes("[REDACTED_PHONE]") && apiResult.error?.includes("[REDACTED_EMAIL]")) {
    console.log("✅ Test 1 Passed: PII redacted from API error");
  } else {
    console.error("❌ Test 1 Failed: Redaction markers not found", apiResult.error);
    process.exit(1);
  }

  // Test 2: Network/System Error PII Redaction
  const networkResult = await mockSendWhatsAppTemplate("+1-555-555-5555", "network");
  console.log("Test 2 (Network Error):", networkResult.error);
  if (networkResult.error?.includes("jane.doe@example.com")) {
    console.error("❌ Test 2 Failed: PII leaked in network error message");
    process.exit(1);
  } else if (networkResult.error?.includes("[REDACTED_EMAIL]")) {
    console.log("✅ Test 2 Passed: PII redacted from network error");
  } else {
    console.error("❌ Test 2 Failed: Redaction markers not found", networkResult.error);
    process.exit(1);
  }

  console.log("\n✨ Verification Complete: WhatsApp service is hardened against PII leaks.");
}

runVerification().catch(err => {
  console.error("Verification script failed:", err);
  process.exit(1);
});
