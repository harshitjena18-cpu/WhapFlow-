import { secureCompare } from "../src/supabase/functions/server/crypto.ts";
import assert from "node:assert";

try {
    assert.strictEqual(secureCompare("hello", "hello"), true, "Should be true for identical strings");
    assert.strictEqual(secureCompare("hello", "world"), false, "Should be false for different strings");
    assert.strictEqual(secureCompare("hello", "hell"), false, "Should be false for different lengths");
    assert.strictEqual(secureCompare("", ""), true, "Should be true for empty strings");
    assert.strictEqual(secureCompare(undefined, "abc"), false, "Should handle undefined");
    console.log("✅ secureCompare verification passed!");
} catch (e) {
    console.error("❌ secureCompare verification failed:");
    console.error(e);
    process.exit(1);
}
