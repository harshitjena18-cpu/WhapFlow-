
import { getTemplateStatus } from "../src/lib/whatsapp";

// Mock fetch
const originalFetch = global.fetch;
const mockFetch = async (url: RequestInfo | URL, init?: RequestInit) => {
  console.log("Mock fetch called with URL:", url);
  console.log("Mock fetch called with headers:", init?.headers);

  const urlStr = url.toString();

  if (urlStr.includes("hello_world")) {
    return {
      ok: true,
      json: async () => ({
        data: [
          {
            name: "hello_world",
            status: "APPROVED",
            language: "en_US",
            id: "123456789"
          }
        ]
      }),
    } as Response;
  }

  if (urlStr.includes("rejected_template")) {
     return {
      ok: true,
      json: async () => ({
        data: [
          {
            name: "rejected_template",
            status: "REJECTED",
            language: "en_US",
            id: "987654321"
          }
        ]
      }),
    } as Response;
  }

  // Check for encoded space
  if (urlStr.includes("hello%20world")) {
      return {
          ok: true,
          json: async () => ({
              data: [
                  {
                      name: "hello world",
                      status: "APPROVED",
                      language: "en_US",
                      id: "999"
                  }
              ]
          })
      } as Response;
  }

  // Simulate missing template (empty data)
  if (urlStr.includes("missing_template")) {
      return {
          ok: true,
          json: async () => ({ data: [] })
      } as Response;
  }

  // Simulate API error
  if (urlStr.includes("error_template")) {
      return {
          ok: false,
          status: 400,
          json: async () => ({ error: { message: "Invalid parameter" } })
      } as Response;
  }

  return {
    ok: false,
    status: 404,
    json: async () => ({ error: "Not found" }),
  } as Response;
};

// Set environment variables for testing
process.env.WHATSAPP_PHONE_NUMBER_ID = "123456789";
process.env.WHATSAPP_ACCESS_TOKEN = "test-token";
process.env.WHATSAPP_BUSINESS_ACCOUNT_ID = "999999999";

// Override fetch
global.fetch = mockFetch;

(async () => {
  console.log("Running verify_template_status.ts...");

  console.log("Test 1: Check 'hello_world' status");
  const status1 = await getTemplateStatus("hello_world");
  if (status1 === "APPROVED") console.log("✅ Test 1 Passed");
  else console.error("❌ Test 1 Failed: Expected APPROVED, got", status1);

  console.log("Test 2: Check 'rejected_template' status");
  const status2 = await getTemplateStatus("rejected_template");
  if (status2 === "REJECTED") console.log("✅ Test 2 Passed");
  else console.error("❌ Test 2 Failed: Expected REJECTED, got", status2);

  console.log("Test 3: Check 'missing_template' status");
  const status3 = await getTemplateStatus("missing_template");
  if (status3 === null) console.log("✅ Test 3 Passed");
  else console.error("❌ Test 3 Failed: Expected null, got", status3);

  console.log("Test 4: Check 'error_template' status");
  const status4 = await getTemplateStatus("error_template");
  if (status4 === null) console.log("✅ Test 4 Passed");
  else console.error("❌ Test 4 Failed: Expected null, got", status4);

  console.log("Test 5: Check 'hello world' status (URL encoding)");
  const status5 = await getTemplateStatus("hello world");
  if (status5 === "APPROVED") console.log("✅ Test 5 Passed");
  else console.error("❌ Test 5 Failed: Expected APPROVED, got", status5);

})();
