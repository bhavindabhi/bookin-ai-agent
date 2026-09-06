# Complete Smiles — Sofia AI Receptionist

An AI-powered voice receptionist for **Complete Smiles Dental Practice, Harrow** ([completesmiles.co.uk](https://www.completesmiles.co.uk)).

Built on the [Dograh](https://github.com/dograh-hq/dograh) open-source voice AI platform using OpenAI Realtime API + Twilio.

---

## What Sofia Does

**Sofia** is a 24/7 AI dental receptionist that:

- Books, reschedules and cancels appointments by voice
- Supports **8 languages** — English, Portuguese, Spanish, French, Italian, German, Polish, Romanian
- Handles **6 service types** — Check-up, Hygiene, Invisalign, Implants, Whitening, Emergency
- Collects and confirms patient details carefully (phone digit-by-digit, email phonetically)
- Triages emergency callers and advises NHS 111 if fully booked
- Works via **web browser** (WebRTC) and **inbound phone calls** (Twilio)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite + TypeScript + Tailwind + shadcn/ui |
| Voice AI | OpenAI Realtime API (`gpt-4o-realtime-preview`) — voice: `shimmer` |
| Backend | Supabase Edge Functions (Deno) |
| Phone | Twilio — inbound call routing via WebSocket stream |
| Auth | Supabase Auth |
| Database | Supabase (PostgreSQL) |

---

## Project Structure

```
src/
  pages/
    Index.tsx        — Practice landing page with services and Sofia intro
    Voice.tsx        — Patient-facing voice interface
    Dashboard.tsx    — Practice admin panel
  components/
    VoiceInterface.tsx  — WebRTC voice chat UI
    VoiceVisualizer.tsx — Audio waveform visualiser

supabase/functions/
  realtime-token/    — Issues OpenAI ephemeral tokens for web calls
  twilio-voice/      — Twilio webhook (returns TwiML)
  twilio-stream/     — WebSocket bridge: Twilio ↔ OpenAI Realtime
  save-appointment/  — Saves bookings to Supabase
  send-confirmation-email/ — Sends email confirmation to patient
```

---

## Setup

### 1. Prerequisites
- [Supabase](https://supabase.com) account (free tier works)
- [OpenAI](https://platform.openai.com) API key with Realtime API access
- [Twilio](https://twilio.com) account + UK phone number (for phone calls)

### 2. Supabase
```bash
# Install Supabase CLI
npm install -g supabase

# Login and link project
supabase login
supabase link --project-ref your-project-ref

# Deploy edge functions
supabase functions deploy

# Set secrets
supabase secrets set OPENAI_API_KEY=sk-...
supabase secrets set TWILIO_ACCOUNT_SID=AC...
supabase secrets set TWILIO_AUTH_TOKEN=...
```

Update `.env`:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
```

### 3. Twilio (phone calls)
1. Buy a UK number at [twilio.com](https://twilio.com)
2. Set the webhook on the number to:
   `https://your-project.supabase.co/functions/v1/twilio-voice`
   Method: `HTTP POST`

### 4. Run locally
```bash
npm install
npm run dev
```

---

## Customising Sofia

To change Sofia's persona, knowledge or booking flow, edit the `SOFIA_SYSTEM_PROMPT` constant in:
- `supabase/functions/realtime-token/index.ts` — web widget calls
- `supabase/functions/twilio-stream/index.ts` — phone calls

Both must be kept in sync.

---

## Services Sofia Can Book

| Service | Description |
|---|---|
| General Check-up | Routine exam, X-rays, oral health assessment |
| Hygiene Cleaning | Scale & polish, stain removal, gum care |
| Invisalign Consultation | Clear aligner assessment and planning |
| Dental Implants | Permanent tooth replacement consultation |
| Teeth Whitening | In-chair and take-home professional whitening |
| Emergency Care | Same-day urgent appointments |

---

## Languages

English 🇬🇧 · Portuguese 🇵🇹 · Spanish 🇪🇸 · French 🇫🇷 · Italian 🇮🇹 · German 🇩🇪 · Polish 🇵🇱 · Romanian 🇷🇴

---

Built on [Dograh](https://github.com/dograh-hq/dograh) — open-source voice AI platform.
