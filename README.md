# WhapFlow - Shopify Abandoned Cart Recovery via WhatsApp

WhapFlow is a modern SaaS platform that helps Shopify merchants recover lost revenue by sending automated, personalized WhatsApp messages to customers who abandon their checkouts.

![WhapFlow Dashboard](https://via.placeholder.com/800x400?text=WhapFlow+Dashboard+Preview)

## 📚 Documentation

- **[Technical Architecture](./ARCHITECTURE.md)**: Detailed system blueprint, security standards, and backend design.
- **[Attributions](./Attributions.md)**: Third-party libraries and assets used.

## 🚀 Features

*   **Dashboard**: Real-time overview of integration status, automation readiness, and key metrics.
*   **Automations**: Configure and monitor abandoned cart recovery workflows with customizable delays.
*   **Template Management**: Create, edit, and manage WhatsApp message templates. Includes AI-powered template generation using OpenAI.
*   **Analytics**: Visualize performance metrics like recovery rates and message delivery status.
*   **Billing & Usage**: View subscription plans, monitor usage limits (AI generations, WhatsApp conversations), and manage billing.
*   **Integrations**:
    *   **Shopify**: Seamless integration for abandoned cart webhooks and order verification.
    *   **WhatsApp**: Connect with WhatsApp Business API for message delivery.
*   **Authentication**: Secure authentication and role management.

## 🛠 Tech Stack

### Frontend
*   **Framework**: [React](https://react.dev/)
*   **Build Tool**: [Vite](https://vitejs.dev/)
*   **Styling**: [Tailwind CSS](https://tailwindcss.com/)
*   **UI Components**: [Radix UI](https://www.radix-ui.com/), [Lucide React](https://lucide.dev/) (Icons), [Sonner](https://sonner.emilkowal.ski/) (Toasts)
*   **Charts**: [Recharts](https://recharts.org/)
*   **Routing**: [React Router](https://reactrouter.com/)

### Backend (Supabase Edge Functions)
*   **Runtime**: [Deno](https://deno.com/)
*   **Framework**: [Hono](https://hono.dev/)
*   **Database**: Supabase (PostgreSQL), KV Store abstraction.
*   **Queues**: Deno-based job queue for processing automations.

## 📂 Project Structure

```
├── src/
│   ├── components/         # React components and Page Views
│   │   ├── dashboard/      # Dashboard specific components
│   │   ├── ui/             # Reusable UI components (buttons, dialogs, etc.)
│   │   └── ...
│   ├── lib/                # Utility functions and API clients
│   ├── routes.tsx          # Application routing configuration
│   ├── supabase/           # Backend logic
│   │   └── functions/
│   │       └── server/     # Main Edge Function logic (API, Webhooks, Queue)
│   └── main.tsx            # Entry point
├── scripts/                # Utility scripts (benchmarks, verifications)
├── vite.config.ts          # Vite configuration
└── package.json            # Project dependencies and scripts
```

## ⚡️ Getting Started

### Prerequisites

*   Node.js (v20+ recommended)
*   npm or pnpm

### Installation

1.  Clone the repository:
    ```bash
    git clone <repository-url>
    cd <project-directory>
    ```

2.  Install dependencies:
    ```bash
    npm install
    # or
    pnpm install
    ```

### Running Locally

To start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

### Building for Production

To build the project for production:

```bash
npm run build
```

The build artifacts will be output to the `build/` directory.

## 🔐 Environment Variables

The backend relies on several environment variables for integrations. Ensure these are configured in your Supabase project or local environment:

*   `OPENAI_API_KEY`: For AI template generation.
*   `SHOPIFY_CLIENT_SECRET`: For verifying Shopify webhooks.
*   `WHATSAPP_VERIFY_TOKEN`: For verifying WhatsApp webhooks.
*   `WHATSAPP_ACCESS_TOKEN`: For sending messages.
*   `WHATSAPP_BUSINESS_ACCOUNT_ID`: WhatsApp Business Account ID.
*   `WHATSAPP_PHONE_NUMBER_ID`: WhatsApp Phone Number ID.

## 🧪 Scripts & Verification

The `scripts/` directory contains useful utilities for testing and benchmarking:

*   `verify_whatsapp.ts`: Verify WhatsApp integration.
*   `verify_template_status.ts`: Check WhatsApp template statuses.
*   `benchmark_billing.ts`: Benchmark billing check performance.
*   `benchmark_whatsapp.ts`: Benchmark WhatsApp processing throughput.

To run a script (requires `tsx` or `ts-node`):
```bash
npx tsx scripts/verify_whatsapp.ts
```

## 📄 License

[Add License Information Here]
