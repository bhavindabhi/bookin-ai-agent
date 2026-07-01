# Hospitrade AI Calling Agent

An AI-powered voice sales agent for [Hospitrade.co.uk](https://hospitrade.co.uk) — the UK's trade supplier for the hospitality industry.

## What It Does

**Alex**, the Hospitrade AI assistant, helps customers:
- Browse product categories (tableware, kitchen equipment, linen, bar supplies, etc.)
- Get instant trade pricing information
- Check product availability
- Submit trade inquiries and orders by voice
- 24/7 availability — no hold music, no waiting

## How It Works

```
Customer speaks → OpenAI Realtime API (gpt-4o-realtime) → Alex responds
                                    ↓
                         Inquiry stored in Supabase
                                    ↓
                     Hospitrade trade team follows up
```

### Two Ways to Use

1. **Web Widget** — Customers visit `/voice` on your website and click "Start Call with Alex"
2. **Phone Calls** — Twilio routes inbound calls through `twilio-voice` → `twilio-stream` → OpenAI Realtime

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React + Vite + TypeScript + Tailwind CSS + shadcn/ui |
| Voice AI | OpenAI Realtime API (`gpt-4o-realtime-preview`) |
| Backend | Supabase Edge Functions (Deno) |
| Phone | Twilio (inbound call routing + WebSocket streaming) |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |

## Project Structure

```
src/
  pages/
    Index.tsx          — Landing page
    Voice.tsx          — Customer voice interface
    Dashboard.tsx      — Admin dashboard
    Auth.tsx           — Login/signup
  components/
    VoiceInterface.tsx — WebRTC voice chat component
    VoiceVisualizer.tsx — Animated visualiser
  utils/
    RealtimeAudio.ts   — OpenAI Realtime WebRTC client

supabase/
  functions/
    realtime-token/    — Issues ephemeral OpenAI tokens (web widget)
    twilio-voice/      — Twilio webhook: returns TwiML to connect call
    twilio-stream/     — WebSocket bridge: Twilio audio ↔ OpenAI Realtime
    submit-inquiry/    — Saves trade inquiries to database
  migrations/
    *_hospitrade_inquiries.sql — Inquiries table schema
```

## Setup

### 1. Supabase

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Copy your project URL and anon key into `.env`
3. Run migrations: `supabase db push`
4. Deploy edge functions: `supabase functions deploy`
5. Set secrets:
   ```bash
   supabase secrets set OPENAI_API_KEY=sk-...
   supabase secrets set TWILIO_ACCOUNT_SID=AC...
   supabase secrets set TWILIO_AUTH_TOKEN=...
   ```

### 2. Twilio (for phone calls)

1. Buy a UK phone number at [twilio.com](https://twilio.com)
2. Set the webhook URL on your number:
   `https://your-project.supabase.co/functions/v1/twilio-voice`
3. Method: `HTTP POST`

### 3. Frontend

```bash
npm install
npm run dev
```

Update `.env` with your Supabase credentials.

## Environment Variables

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
```

Edge function secrets (set via `supabase secrets set`):
- `OPENAI_API_KEY` — OpenAI key with Realtime API access
- `TWILIO_ACCOUNT_SID` — Twilio account SID
- `TWILIO_AUTH_TOKEN` — Twilio auth token

## Alex's Product Knowledge

Alex is trained on Hospitrade's full product range:

- **Tableware & Crockery** — plates, bowls, cups (porcelain, melamine, stainless)
- **Glassware** — wine, tumbler, beer, shot glasses
- **Cutlery & Flatware** — professional stainless steel ranges
- **Kitchen Equipment** — gastronorm containers, pots, pans, baking trays
- **Bar & Beverage** — cocktail tools, coffee equipment, ice buckets
- **Linen & Bedding** — table linen, napkins, bed linen, towels
- **Furniture** — restaurant chairs, tables, bar stools
- **Cleaning & Janitorial** — chemicals, mops, waste bins
- **Disposables** — takeaway packaging, cups, straws
- **Food Safety** — storage, thermometers, labelling
- **Uniforms** — chef jackets, aprons, waiter uniforms
- **Catering Accessories** — chafing dishes, serving trolleys

## Customisation

To update Alex's product knowledge or persona, edit the `HOSPITRADE_SYSTEM_PROMPT` constant in:
- `supabase/functions/realtime-token/index.ts` — for web widget calls
- `supabase/functions/twilio-stream/index.ts` — for phone calls

## License

Built on the open-source [Dograh](https://github.com/dograh-hq/dograh) voice AI platform.
