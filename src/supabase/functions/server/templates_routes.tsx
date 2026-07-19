import { Hono } from "npm:hono";
import * as kv from "./kv_store.tsx";
import * as billing from "./billing.ts";
import { SHOPIFY_DOMAIN_REGEX } from "./constants.ts";
import { validateTemplateContent, disableOtherTemplates } from "./automation.ts";
import { AutomationTemplate } from "./types.ts";
import { verifyShopifySession } from "./middleware.ts";

const app = new Hono();

// SECURITY: Enforce Shopify session verification for all template operations
app.use("*", verifyShopifySession);

// GET /api/templates
app.get("/", async (c) => {
  try {
    // SECURITY: Use verified shop domain from session token (guaranteed by middleware)
    const shop = c.get("verified_shop") as string;

    // SECURITY: Validate shop domain
    if (!SHOPIFY_DOMAIN_REGEX.test(shop)) {
      return c.json({ error: "Invalid shop domain" }, 400);
    }
    // SECURITY: Scoping templates by shop to prevent multi-tenancy leaks
    const templates = await kv.getByPrefix(`shop:${shop}:template:`) as AutomationTemplate[];
    // Sort by created_at desc
    templates.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return c.json(templates);
  } catch (error) {
    console.error("Error fetching templates:", error);
    return c.json({ error: "Failed to fetch templates" }, 500);
  }
});

// POST /api/templates
app.post("/", async (c) => {
  try {
    const body = await c.req.json();
    // SECURITY: Use verified shop domain from session token (guaranteed by middleware)
    const shop = c.get("verified_shop") as string;

    // SECURITY: Validate shop domain
    if (!SHOPIFY_DOMAIN_REGEX.test(shop)) {
      return c.json({ error: "Invalid shop domain" }, 400);
    }
    const { template_name, display_name, delay_minutes } = body;

    if (!template_name || !display_name) {
      return c.json({ error: "Missing required fields" }, 400);
    }

    // Validate Content
    const content = body.content || "";
    const validationError = validateTemplateContent(content);
    if (validationError) {
      return c.json({ error: validationError }, 400);
    }

    // Check uniqueness of template_name within THIS shop
    const prefix = `shop:${shop}:template:`;
    // OPTIMIZATION: Use DB-side filtering to check for existence instead of fetching all templates
    // PERFORMANCE: Ensure we use the correct JSONB path 'value->template_name' for database-side filtering
    const existing = await kv.getByPrefixAndValue(prefix, "value->template_name", template_name, 1);
    if (existing.length > 0) {
      return c.json({ error: "Template name must be unique" }, 400);
    }

    const id = crypto.randomUUID();
    const newTemplate: AutomationTemplate = {
      id,
      template_name,
      display_name,
      delay_minutes: delay_minutes || 30,
      content,
      generated_by_ai: body.generated_by_ai || false,
      ai_tone: body.ai_tone || null,
      enabled: false, // Default to disabled
      created_at: new Date().toISOString()
    };

    await kv.set(`${prefix}${id}`, newTemplate);
    return c.json(newTemplate, 201);
  } catch (error) {
    console.error("Error creating template:", error);
    return c.json({ error: "Failed to create template" }, 500);
  }
});

// PUT /:id
app.put("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json();
    // SECURITY: Use verified shop domain from session token (guaranteed by middleware)
    const shop = c.get("verified_shop") as string;

    const key = `shop:${shop}:template:${id}`;
    const existing = await kv.get(key) as AutomationTemplate | null;
    if (!existing) {
      return c.json({ error: "Template not found" }, 404);
    }

    // Validate Content if it's being updated
    if (body.content !== undefined) {
      const validationError = validateTemplateContent(body.content);
      if (validationError) {
        return c.json({ error: validationError }, 400);
      }
    }

    // Update fields
    const updated = { ...existing, ...body };

    // If enabling, disable others for THIS shop
    if (body.enabled === true && !existing.enabled) {
      await disableOtherTemplates(id, shop);
    }

    await kv.set(key, updated);
    return c.json(updated);
  } catch (error) {
    console.error("Error updating template:", error);
    return c.json({ error: "Failed to update template" }, 500);
  }
});

// DELETE /api/templates/:id
app.delete("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    // SECURITY: Use verified shop domain from session token (guaranteed by middleware)
    const shop = c.get("verified_shop") as string;
    await kv.del(`shop:${shop}:template:${id}`);
    return c.json({ success: true });
  } catch (error) {
    console.error("Error deleting template:", error);
    return c.json({ error: "Failed to delete template" }, 500);
  }
});

// POST /api/templates/ai-generate
app.post("/ai-generate", async (c) => {
  try {
    const body = await c.req.json();
    // SECURITY: Use verified shop domain from session token (guaranteed by middleware)
    const shop = c.get("verified_shop") as string;
    const { tone, brand_name, discount } = body;

    // SECURITY: Validate shop domain presence
    if (!shop || !SHOPIFY_DOMAIN_REGEX.test(shop)) {
      return c.json({ error: "Invalid or missing shop domain" }, 400);
    }

    // SECURITY: Simple Rate Limiting (Prevent OpenAI credit exhaustion)
    const ip = c.req.header("x-forwarded-for") || "anonymous";
    const currentHour = new Date().toISOString().slice(0, 13);
    const rateKey = `rate_limit:ai_gen:${shop}:${ip}:${currentHour}`;
    const billingKey = `${billing.BILLING_KEY_PREFIX}${shop}`;

    // PERFORMANCE: Batch all independent KV lookups into a single mget call.
    // This reduces the number of concurrent database requests and total latency.
    const [rateLimitData, billingData] = await kv.mget([rateKey, billingKey]);

    const hits = (rateLimitData || 0) as number;
    if (hits > 10) { // Limit to 10 generations per hour per shop/ip
      return c.json({ error: "Rate limit exceeded. Please try again later." }, 429);
    }

    // Use pre-fetched billing data to avoid another KV round-trip
    const config = await billing.getBillingConfig(shop, billingData);

    // 1. Check Billing Limits using pre-fetched config
    const limitCheck = billing.checkLimitWithConfig('ai', config);
    if (!limitCheck.allowed) {
      console.warn("AI Limit Reached:", limitCheck.error);
      return c.json({
        error: limitCheck.error,
        limit_reached: true
      }, 429);
    }

    const apiKey = Deno.env.get("OPENAI_API_KEY");

    if (!apiKey) {
      return c.json({ error: "OpenAI API key not configured" }, 500);
    }

    const systemPrompt = `You are an expert WhatsApp marketing copywriter.
Write abandoned cart reminder messages for an eCommerce store.

Rules:
- Use the selected tone: ${tone || 'Friendly'}
- Be polite and conversion-focused
- Avoid spammy language
- Keep message under WhatsApp limits (1024 chars, but aim for <300)
- Include a clear call-to-action
- Do NOT promise unrealistic offers
- Do NOT use excessive emojis
- Format the output as a JSON array of strings, e.g. ["message 1", "message 2"]

Use placeholders only:
{{customer_name}}
{{product_name}}
{{checkout_link}}

Context:
Brand Name: ${brand_name || 'Our Store'}
Discount Offer: ${discount || 'None'}

Generate 3 different variations.`;

    // PERFORMANCE: Parallelize the slow OpenAI API call with the rate limit persistence.
    // This hides the latency of the KV set operation.
    const [response] = await Promise.all([
      fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: "Generate the templates now." }
          ],
          response_format: { type: "json_object" }
        })
      }),
      kv.set(rateKey, hits + 1)
    ]);

    const data = await response.json();

    if (data.error) {
      console.error("OpenAI Error:", data.error);
      throw new Error(data.error.message);
    }

    // PERFORMANCE: Use the updated configuration returned by incrementUsage.
    // We also pass the pre-fetched 'config' to avoid another KV round-trip inside incrementUsage.
    const updatedConfig = await billing.incrementUsage('ai', shop, config);
    const limits = billing.PLAN_LIMITS[updatedConfig.plan];

    const content = data.choices[0].message.content;
    let suggestions;
    try {
        // Handle case where AI returns { "templates": [...] } or just the array
        const parsed = JSON.parse(content);
        suggestions = Array.isArray(parsed) ? parsed : (parsed.templates || parsed.messages || []);
    } catch (_e) {
        console.error("Failed to parse AI response:", content);
        return c.json({ error: "Failed to parse AI suggestions" }, 500);
    }

    return c.json({
      suggestions,
      usage: {
        ai_generations_used: updatedConfig.ai_generations_used,
        ai_generations_limit: limits.ai_generations
      }
    }); // Return updated usage to frontend

  } catch (error) {
    console.error("Error generating templates:", error);
    // SECURITY: Do not leak internal OpenAI or Database errors to the client
    return c.json({ error: "An error occurred while generating templates. Please try again." }, 500);
  }
});

export default app;
