# Dental Supply WhatsApp Reordering Agent

A WhatsApp assistant for a B2B dental supply business. Dental clinics message
your WhatsApp business number to reorder consumables, check prices/stock, and
check order status — the agent understands the request, looks up your
Shopify catalog and the customer's order history, and creates a draft order
(invoice link) once they confirm.

## How it works

```
WhatsApp message → Twilio webhook → Claude (tool use) → Shopify Admin API
                                          ↓
                                 reply sent back via Twilio
```

- **`src/agent/claude.ts`** — the agentic loop. Calls Claude with a fixed
  system prompt + tool definitions, executes any tool the model requests
  (Shopify lookups/writes), feeds results back, repeats until Claude has a
  final answer for the customer.
- **`src/agent/tools.ts`** — the four tools Claude can call: `search_products`,
  `check_last_order`, `create_order` (draft order), `check_order_status`.
- **`src/shopify/`** — thin GraphQL Admin API wrappers for products,
  customers, and orders.
- **`src/whatsapp/`** — Twilio webhook handler + outbound message sender.
- **`src/agent/conversation-store.ts`** — in-memory per-phone-number chat
  history. Fine for one process; swap for Redis/Postgres before scaling to
  multiple instances or if history needs to survive restarts.

## Setup

### 1. Anthropic

Get an API key from the [Anthropic Console](https://console.anthropic.com/).
Set `ANTHROPIC_API_KEY`.

The default model is `claude-opus-4-8` (most capable). For a high-volume
WhatsApp line where most messages are simple lookups/reorders,
`claude-sonnet-5` or `claude-haiku-4-5` are worth benchmarking for cost —
change `CLAUDE_MODEL` in `.env`.

### 2. Shopify

1. In your Shopify admin: **Settings → Apps and sales channels → Develop apps**.
2. Create a custom app, grant Admin API scopes: `read_products`,
   `read_customers`, `read_orders`, `write_draft_orders`.
3. Install the app and copy the **Admin API access token** into
   `SHOPIFY_ADMIN_API_TOKEN`. Set `SHOPIFY_STORE_DOMAIN` to your
   `*.myshopify.com` domain.
4. For the agent to recognize returning customers, make sure clinic phone
   numbers are saved on their Shopify customer records (in the same format
   they'll message from, e.g. `+15551234567`).

### 3. Twilio (WhatsApp)

1. Create a [Twilio](https://www.twilio.com/) account.
2. For testing: join the [WhatsApp sandbox](https://www.twilio.com/docs/whatsapp/sandbox)
   — gives you a shared number and a sandbox code to send from your phone.
3. For production: apply for a WhatsApp Business Profile on a Twilio number
   (Twilio's WhatsApp onboarding flow).
4. Set `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_WHATSAPP_NUMBER`
   (e.g. `whatsapp:+14155238886` for the sandbox).
5. In the Twilio console, set the WhatsApp sandbox/number's **"When a message
   comes in"** webhook to `https://<your-domain>/webhook/whatsapp` (POST).

### 4. Local development

```bash
cp .env.example .env   # fill in the values above
npm install
npm run dev
```

Twilio needs a public HTTPS URL to reach your local server. Use
[ngrok](https://ngrok.com/):

```bash
ngrok http 3000
```

Set `PUBLIC_WEBHOOK_URL` in `.env` to the ngrok URL + `/webhook/whatsapp`
(needed for Twilio signature verification), and point the Twilio webhook at
that same URL.

### 5. Production

```bash
npm run build
npm start
```

Deploy anywhere that runs Node 18+ and can receive inbound HTTPS (Render,
Fly.io, a VPS behind a reverse proxy, etc.). Set `PUBLIC_WEBHOOK_URL` to your
real domain. Set `VERIFY_TWILIO_SIGNATURE=true` (default) in production —
only disable it for local testing without a stable public URL.

## Trying it out

Message your Twilio WhatsApp number:

- `"Hi, I'd like to reorder gloves"` → agent calls `check_last_order` /
  `search_products`, asks to confirm quantity, then creates a draft order.
- `"What's the price of composite resin?"` → `search_products`.
- `"What's the status of order 1042?"` → `check_order_status`.

## Extending

- **More tools**: add to `src/agent/tools.ts` (schema) and the `executeTool`
  switch — e.g. a `get_bulk_pricing` tool if you have quantity-tiered pricing,
  or a tool that pings a human/Slack channel for unrecognized customers.
- **Persistent conversation history**: replace `conversation-store.ts`'s
  in-memory `Map` with a Redis- or Postgres-backed store; the interface
  (`get`/`append`/`clear`) is intentionally small.
- **Other channels**: the agent logic in `src/agent/claude.ts` doesn't know
  about WhatsApp/Twilio — a Slack, SMS, or web-chat frontend can reuse it by
  calling `handleIncomingMessage(conversationKey, text, customer)` directly.
