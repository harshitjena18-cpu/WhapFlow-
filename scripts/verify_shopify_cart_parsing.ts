import { parseShopifyCart } from "../src/lib/shopify";
import { ZodError } from "zod";

const runTest = (name: string, fn: () => void) => {
  try {
    fn();
    console.log(`✅ ${name} Passed`);
  } catch (error) {
    console.error(`❌ ${name} Failed`);
    console.error(error);
  }
};

const validPayload = {
  id: "1234567890",
  token: "abcdef123456",
  line_items: [
    {
      id: 987654321,
      title: "Test Product",
      quantity: 1,
      price: "29.99"
    }
  ],
  currency: "USD",
  customer: {
    first_name: "John",
    last_name: "Doe",
    email: "john.doe@example.com",
    phone: "+15551234567"
  },
  abandoned_checkout_url: "https://example.myshopify.com/checkouts/123",
  created_at: "2023-10-27T10:00:00Z"
};

const invalidEmailPayload = {
  ...validPayload,
  customer: {
    ...validPayload.customer,
    email: "not-an-email"
  }
};

const invalidUrlPayload = {
  ...validPayload,
  abandoned_checkout_url: "not-a-url"
};

const missingFieldPayload = {
  ...validPayload,
  currency: undefined // Missing required field
};

console.log("🧪 Starting Shopify Cart Parsing Tests...");

runTest("Valid Payload Parsing", () => {
  const result = parseShopifyCart(validPayload);
  if (result.id !== "1234567890") throw new Error("ID mismatch");
  if (result.customer.email !== "john.doe@example.com") throw new Error("Email mismatch");
});

runTest("Invalid Email Handling", () => {
  try {
    parseShopifyCart(invalidEmailPayload);
    throw new Error("Should have thrown validation error for invalid email");
  } catch (error) {
    if (error instanceof ZodError) {
      const emailError = error.errors.find(e => e.path.includes("email"));
      if (!emailError) throw new Error("ZodError did not contain email validation failure");
    } else if (error instanceof Error && error.message === "Should have thrown validation error for invalid email") {
      throw error;
    } else {
       // It might be a different error type if Zod throws something else, but usually ZodError
       if (!(error instanceof ZodError)) throw new Error("Did not throw ZodError");
    }
  }
});

runTest("Invalid URL Handling", () => {
  try {
    parseShopifyCart(invalidUrlPayload);
    throw new Error("Should have thrown validation error for invalid URL");
  } catch (error) {
    if (error instanceof ZodError) {
      const urlError = error.errors.find(e => e.path.includes("abandoned_checkout_url"));
      if (!urlError) throw new Error("ZodError did not contain URL validation failure");
    } else if (error instanceof Error && error.message === "Should have thrown validation error for invalid URL") {
      throw error;
    } else {
       if (!(error instanceof ZodError)) throw new Error("Did not throw ZodError");
    }
  }
});

runTest("Missing Field Handling", () => {
  try {
    // @ts-ignore
    parseShopifyCart(missingFieldPayload);
    throw new Error("Should have thrown validation error for missing field");
  } catch (error) {
    if (error instanceof ZodError) {
      const currencyError = error.errors.find(e => e.path.includes("currency"));
      if (!currencyError) throw new Error("ZodError did not contain currency validation failure");
    } else if (error instanceof Error && error.message === "Should have thrown validation error for missing field") {
      throw error;
    } else {
       if (!(error instanceof ZodError)) throw new Error("Did not throw ZodError");
    }
  }
});
