import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

// Complete Smiles — Sofia AI Receptionist (Phone calls via Twilio)
const SOFIA_SYSTEM_PROMPT = `You are Sofia, the warm and professional AI receptionist for Complete Smiles Dental Practice in Harrow, London.

GREETING:
Always begin with: "Hello, Complete Smiles Harrow, this is Sofia speaking. How may I help you today?"

ABOUT COMPLETE SMILES:
- Leading dental practice in Harrow, London
- Website: completesmiles.co.uk
- Specialist in cosmetic and general dentistry
- Friendly, modern practice serving Harrow's diverse community

YOUR SERVICES (what you can book):
1. General Dental Check-up — routine examinations, X-rays, oral health assessment
2. Hygiene Cleaning — scale and polish, stain removal, gum care, preventive advice
3. Invisalign Consultation — clear aligner assessment and treatment planning
4. Dental Implants — permanent tooth replacement consultation and treatment
5. Teeth Whitening — professional in-chair and take-home whitening
6. Emergency Dental Care — same-day urgent appointments for pain, swelling, broken teeth

APPOINTMENT BOOKING FLOW:

Step 1 — Understand their need:
Ask: "What brings you in today? Are you looking to book a specific treatment, or is this for a general check-up?"

Step 2 — Name: "May I take your full name please?"

Step 3 — Phone number (CRITICAL):
"And the best phone number to reach you on?"
- Must be 10–11 digits
- Read back digit by digit to confirm
- Never move on until confirmed correct

Step 4 — Email (CRITICAL — use NATO phonetic alphabet):
"Could I take your email address as well?"
- Spell back every character using NATO alphabet (Alpha, Bravo, Charlie...)
- Do not move on until confirmed correct

Step 5 — Service and date/time preference

Step 6 — Full read-back of all details before confirming

Step 7 — Confirm and close warmly

EMERGENCY CALLS:
"I'm so sorry you're in pain. Let me check our emergency slots."
"If we're fully booked today please call NHS 111 for urgent dental care — they're available 24/7."

MULTILINGUAL SUPPORT:
Speak English, Portuguese, Spanish, French, Italian, German, Polish and Romanian.
Switch to caller's language immediately.

COMMUNICATION STYLE:
- Warm, patient, professional British English
- Never rush, never sound frustrated
- Never end the call prematurely
- Confirm phone digit by digit, email character by character

END OF CALL:
"Thank you so much for calling Complete Smiles! We look forward to seeing you. Have a lovely day!"`;

serve(async (req) => {
  if (!OPENAI_API_KEY) {
    return new Response("OPENAI_API_KEY not configured", { status: 500 });
  }

  try {
    const upgrade = req.headers.get("upgrade") || "";
    if (upgrade.toLowerCase() !== "websocket") {
      return new Response("Expected websocket", { status: 426 });
    }

    const { socket, response } = Deno.upgradeWebSocket(req);

    let openAiWs: WebSocket | null = null;
    let streamSid: string | null = null;
    let sessionConfigured = false;

    socket.onopen = async () => {
      console.log("Twilio connected");

      const keepAlive = setInterval(() => {
        if (openAiWs?.readyState === WebSocket.OPEN) {
          openAiWs.send(JSON.stringify({ type: "ping" }));
        }
      }, 30000);

      try {
        const tokenRes = await fetch("https://api.openai.com/v1/realtime/sessions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${OPENAI_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ model: "gpt-4o-realtime-preview-2024-12-17", voice: "shimmer" }),
        });

        if (!tokenRes.ok) throw new Error(`Token error: ${tokenRes.status}`);
        const { client_secret } = await tokenRes.json();
        const ephemeralKey = client_secret?.value;
        if (!ephemeralKey) throw new Error("No ephemeral key");

        openAiWs = new WebSocket(
          `wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17`,
          ["realtime", `openai-insecure-api-key.${ephemeralKey}`, "openai-beta.realtime-v1"]
        );

        openAiWs.onopen = () => console.log("OpenAI connected");

        openAiWs.onmessage = (e) => {
          try {
            const data = JSON.parse(e.data);

            if (data.type === "session.created" && !sessionConfigured) {
              sessionConfigured = true;
              openAiWs?.send(JSON.stringify({
                type: "session.update",
                session: {
                  turn_detection: { type: "server_vad" },
                  input_audio_format: "g711_ulaw",
                  output_audio_format: "g711_ulaw",
                  voice: "shimmer",
                  instructions: SOFIA_SYSTEM_PROMPT,
                  modalities: ["text", "audio"],
                  temperature: 0.8,
                },
              }));
            }

            if (data.type === "response.audio.delta" && data.delta && streamSid) {
              socket.send(JSON.stringify({
                event: "media",
                streamSid,
                media: { payload: data.delta },
              }));
            }

            if (data.type === "error") console.error("OpenAI error:", data);
          } catch (err) {
            console.error("OpenAI message error:", err);
          }
        };

        openAiWs.onerror = (err) => console.error("OpenAI WS error:", err);
        openAiWs.onclose = () => { console.log("OpenAI closed"); clearInterval(keepAlive); };

      } catch (err) {
        console.error("Setup error:", err);
        socket.close();
      }
    };

    socket.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.event === "start") streamSid = data.start.streamSid;
        if (data.event === "media" && openAiWs?.readyState === WebSocket.OPEN) {
          openAiWs.send(JSON.stringify({ type: "input_audio_buffer.append", audio: data.media.payload }));
        }
        if (data.event === "stop") openAiWs?.close();
      } catch (err) {
        console.error("Twilio message error:", err);
      }
    };

    socket.onclose = () => openAiWs?.close();
    socket.onerror = () => openAiWs?.close();

    return response;
  } catch (err) {
    console.error("Error:", err);
    return new Response("Internal Server Error", { status: 500 });
  }
});
