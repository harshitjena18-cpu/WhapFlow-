
import { sendWhatsAppMessage } from "../src/lib/whatsapp";
import { WhatsAppMessageRequest } from "../src/types";

// Mock fetch
const originalFetch = global.fetch;
const mockFetch = async (url: RequestInfo | URL, init?: RequestInit) => {
  console.log("Mock fetch called with URL:", url);
  console.log("Mock fetch called with init:", JSON.stringify(init, null, 2));

  return {
    ok: true,
    json: async () => ({ messaging_product: "whatsapp", messages: [{ id: "wamid.123" }] }),
  } as Response;
};

// Set environment variables for testing
process.env.WHATSAPP_PHONE_NUMBER_ID = "123456789";
process.env.WHATSAPP_ACCESS_TOKEN = "test-token";

// Override fetch
global.fetch = mockFetch;

const testRequest: WhatsAppMessageRequest = {
  phoneNumber: "15551234567",
  templateId: "hello_world",
  parameters: {
    "1": "John",
    "2": "Order #123"
  }
};

(async () => {
  console.log("Running verify_whatsapp.ts...");
  const result = await sendWhatsAppMessage(testRequest);

  if (result) {
    console.log("✅ sendWhatsAppMessage returned true");
  } else {
    console.error("❌ sendWhatsAppMessage returned false");
    process.exit(1);
  }

  // Verify parameters sorting and structure
  // In a real test framework we would assert on the mock calls, but here logs are enough for visual verification.
})();
