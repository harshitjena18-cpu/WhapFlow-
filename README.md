# 🚀 WhapFlow

**WhapFlow** is a production-ready Shopify SaaS that helps merchants recover abandoned carts using **WhatsApp automation**, powered by **Shopify Webhooks**, **WhatsApp Cloud API**, and **AI-generated message templates**.

Instead of relying on low-conversion email flows, WhapFlow enables merchants to send timely, compliant WhatsApp messages after cart abandonment — increasing recovery rates and revenue.

---

## ✨ Key Features

### 🛒 Shopify Abandoned Cart Detection
- Uses **Shopify Webhooks** (`checkouts/create`, `checkouts/update`)
- No polling, no delays — real-time event driven
- Secure HMAC verification for all incoming webhooks

### ⏱ Intelligent Automation Engine
- Configurable delay before message send (e.g. 30 minutes)
- Rechecks cart status before sending
- Automatically skips messaging if the cart converts to an order

### 💬 WhatsApp Cloud API Integration
- Uses Meta’s **WhatsApp Cloud API**
- Sends template-based WhatsApp messages
- Fully compliant with WhatsApp policies
- Supports sandbox and production environments

### 🧠 AI-Powered Message Templates
- AI generates high-quality WhatsApp templates
- Tone, brand name, and discount-aware
- Built-in WhatsApp compliance validation
- Monthly AI usage limits enforced

### 🧾 Template Management
- Full CRUD for templates
- Only one template can be active at a time
- Live validation for placeholders and length limits

### 🔐 Shopify OAuth & Merchant Registration
- Secure OAuth flow for merchant onboarding
- Automatic merchant profile creation
- Automatic webhook registration on install
- Full uninstall lifecycle handling

### 💳 Native Shopify Billing
- Uses **Shopify Billing API**
- Recurring subscription plans
- Automatic currency localization
- Shopify handles taxes, invoicing, and payments
- Feature gating based on plan limits

### 📊 Production-Ready Dashboard
- Real system readiness status
- Integration health (Shopify / WhatsApp)
- AI & WhatsApp usage tracking
- Guided onboarding checklist
- No fake analytics or demo data

---

## 🧱 Tech Stack

**Frontend**
- React
- Tailwind CSS
- Figma Make (UI prototyping)
- Shopify Embedded App UI

**Backend**
- Node.js
- Supabase Edge Functions
- Supabase Auth & KV Store

**Integrations**
- Shopify Admin API
- Shopify Webhooks
- Shopify Billing API
- WhatsApp Cloud API (Meta)
- AI API (Gemini / OpenAI)

---

## 🏗 Architecture Overview
Shopify Store │ ├── OAuth Install │       ↓ │   Merchant Registered │ ├── Webhooks (Abandoned Cart) │       ↓ │   Automation Engine │       ↓ │   Order Safety Check │       ↓ │   WhatsApp Message Sent │ └── Billing via Shopify

