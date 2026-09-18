import { AutomationTemplate } from "../src/supabase/functions/server/types.ts";

function generateTemplates(count: number): AutomationTemplate[] {
  const templates: AutomationTemplate[] = [];
  const now = Date.now();
  for (let i = 0; i < count; i++) {
    const randomTime = now - Math.floor(Math.random() * 10000000);
    templates.push({
      id: `tpl_${i}`,
      template_name: `template_${i}`,
      display_name: `Template ${i}`,
      delay_minutes: 30,
      content: `Content ${i}`,
      generated_by_ai: false,
      ai_tone: null,
      enabled: i === 0,
      created_at: new Date(randomTime).toISOString(),
    });
  }
  return templates;
}

const templates1 = generateTemplates(1000);
const templates2 = JSON.parse(JSON.stringify(templates1));

// Benchmark 1: new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
console.time("Date parsing sort");
for (let i = 0; i < 100; i++) {
  const list = [...templates1];
  list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}
console.timeEnd("Date parsing sort");

// Benchmark 2: Direct ISO string comparison
console.time("Direct string comparison sort");
for (let i = 0; i < 100; i++) {
  const list = [...templates2];
  list.sort((a, b) => (b.created_at > a.created_at ? 1 : b.created_at < a.created_at ? -1 : 0));
}
console.timeEnd("Direct string comparison sort");
