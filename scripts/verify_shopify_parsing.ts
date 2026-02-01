
import { parseShopifyCart } from '../src/lib/shopify';

const validPayload: any = {
  id: "123456",
  token: "abcdef",
  line_items: [
    {
      id: 987654321,
      title: "Test Product",
      quantity: 1,
      price: "19.99"
    }
  ],
  currency: "USD",
  customer: {
    first_name: "John",
    last_name: "Doe",
    email: "john@example.com",
    phone: "+1234567890"
  },
  abandoned_checkout_url: "https://example.com/checkout",
  created_at: "2023-01-01T00:00:00Z"
};

const invalidPayload: any = {
  id: "123",
  // Missing token
  line_items: [],
  // Missing currency
  customer: {
     // Missing fields
     email: "test@example.com"
  }
};

async function run() {
    console.log("Testing Valid Payload...");
    try {
      const result = parseShopifyCart(validPayload);
      console.log("✅ Valid Payload Parsed Successfully");
    } catch (e) {
      console.error("❌ Valid Payload Threw Error:", e);
    }

    console.log("\nTesting Invalid Payload...");
    try {
      const result = parseShopifyCart(invalidPayload);
      console.log("⚠️ Invalid Payload Parsed (Currently expected, but unsafe):", JSON.stringify(result));
    } catch (e: any) {
      console.log("✅ Invalid Payload Threw Error:", e.message || e);
    }
}

run();
