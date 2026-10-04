import { AutomationTemplate } from "../src/supabase/functions/server/types.ts";

console.log("Starting verification of template sorting optimization...");

const testTemplates: AutomationTemplate[] = [
  {
    id: "1",
    template_name: "t1",
    display_name: "Template 1",
    delay_minutes: 30,
    content: "Content 1",
    generated_by_ai: false,
    ai_tone: null,
    enabled: true,
    created_at: "2025-01-15T10:00:00.000Z"
  },
  {
    id: "2",
    template_name: "t2",
    display_name: "Template 2",
    delay_minutes: 15,
    content: "Content 2",
    generated_by_ai: false,
    ai_tone: null,
    enabled: false,
    created_at: "2025-03-01T12:30:00.000Z"
  },
  {
    id: "3",
    template_name: "t3",
    display_name: "Template 3",
    delay_minutes: 45,
    content: "Content 3",
    generated_by_ai: false,
    ai_tone: null,
    enabled: false,
    created_at: "2024-12-25T08:15:00.000Z"
  },
  {
    id: "4",
    template_name: "t4",
    display_name: "Template 4",
    delay_minutes: 60,
    content: "Content 4",
    generated_by_ai: false,
    ai_tone: null,
    enabled: false,
    created_at: "2025-03-01T12:30:00.000Z"
  }
];

// 1. Sort using old Date method
const legacySorted = [...testTemplates].sort(
  (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
);

// 2. Sort using optimized ISO string method
const optimizedSorted = [...testTemplates].sort(
  (a, b) => (b.created_at > a.created_at ? 1 : b.created_at < a.created_at ? -1 : 0)
);

// 3. Verify exact output match
const legacyIds = legacySorted.map(t => t.id);
const optimizedIds = optimizedSorted.map(t => t.id);

console.log("Legacy sort result IDs:   ", legacyIds);
console.log("Optimized sort result IDs:", optimizedIds);

let matches = true;
for (let i = 0; i < legacyIds.length; i++) {
  if (legacyIds[i] !== optimizedIds[i]) {
    matches = false;
    break;
  }
}

if (!matches) {
  console.error("❌ Mismatch detected between legacy and optimized sort results!");
  process.exit(1);
}

console.log("✅ Verification passed: Optimized ISO string comparison produces identical sort order.");
