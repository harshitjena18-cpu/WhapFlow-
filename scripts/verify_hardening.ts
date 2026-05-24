import { redactPII, getErrorMessage } from "../src/lib/error.ts";

// Mocking the behavior in whatsapp.ts
function mockWhatsAppError(data: any) {
    const errorMessage = redactPII(data.error?.message || "Unknown WhatsApp API Error");
    console.log(`Log: ❌ WhatsApp API Error: [Redacted Status]`);
    console.log(`Sanitized Error Message: ${errorMessage}`);
}

const mockApiResponse = {
    error: {
        message: "Message failed to send to +15550109999 due to invalid format"
    }
};

console.log("Testing WhatsApp API Error Redaction:");
mockWhatsAppError(mockApiResponse);
console.log("---");

// Testing getErrorMessage with various PII
const complexError = new Error("Database connection failed for user john.doe@example.com with phone +447700900123");
console.log("Testing getErrorMessage Redaction:");
console.log(`Result: ${getErrorMessage(complexError)}`);
