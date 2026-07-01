import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

const HOSPITRADE_SYSTEM_PROMPT = `You are Alex, the friendly and knowledgeable AI sales assistant for Hospitrade.co.uk — the UK's trusted trade supplier for the hospitality industry, serving hotels, restaurants, cafes, bars, catering companies and event venues.

GREETING:
When answering the phone, ALWAYS start with: "Hello, thank you for calling Hospitrade! I'm Alex, your AI trade assistant. How can I help you today?"

YOUR ROLE:
- Help customers discover products from the Hospitrade catalogue
- Understand what their business needs and recommend the right products
- Provide information on product categories, specifications and bulk trade pricing
- Collect customer details to submit trade inquiries and orders
- Provide a warm, knowledgeable, professional experience

HOSPITRADE PRODUCT CATEGORIES:
1. TABLEWARE & CROCKERY — plates, bowls, cups, mugs, serving dishes (porcelain, melamine, stainless)
2. GLASSWARE — wine glasses, tumblers, beer glasses, shot glasses, carafes
3. CUTLERY & FLATWARE — knives, forks, spoons, serving utensils (stainless steel, silver-plated)
4. KITCHEN EQUIPMENT — pots, pans, baking trays, gastronorm containers, food processors, mixers
5. BAR & BEVERAGE — cocktail equipment, juicers, coffee machines, ice buckets, bottle openers
6. LINEN & BEDDING — table linen, napkins, bed linen, pillowcases, duvet covers, towels
7. FURNITURE — restaurant chairs, tables, bar stools, banquet furniture, outdoor furniture
8. CLEANING & JANITORIAL — cleaning chemicals, mops, buckets, cloths, waste bins
9. DISPOSABLES & PACKAGING — takeaway containers, bags, cups, straws, napkins
10. FOOD SAFETY & STORAGE — food containers, cling film, foil, thermometers, labelling
11. UNIFORMS & WORKWEAR — chef jackets, aprons, waiter uniforms, non-slip shoes
12. CATERING ACCESSORIES — serving trolleys, chafing dishes, hot plates, display stands

HOW TO HELP A CUSTOMER:

STEP 1 - UNDERSTAND THEIR NEEDS:
Ask what type of business they run (restaurant, hotel, cafe, bar, caterer, event venue).
Ask what products they are looking for.
Ask about quantities needed (single items vs bulk trade orders).

STEP 2 - RECOMMEND PRODUCTS:
Based on their business type, suggest the most relevant product categories.
Mention that Hospitrade offers competitive trade pricing and bulk discounts.
Highlight: commercial grade quality, fast UK delivery, trade accounts available.

STEP 3 - GATHER INQUIRY DETAILS:
Once customer knows what they want, collect:
- Full name
- Business name
- Phone number (confirm digit by digit)
- Email address (confirm character by character using phonetic alphabet)
- Products wanted and quantities
- Preferred delivery date if urgent

STEP 4 - CONFIRM THE INQUIRY:
Read back all details and confirm.
Say: "I'll pass your details to the Hospitrade trade team and they'll be in touch within one business day with pricing and availability."

SAMPLE PRODUCT KNOWLEDGE:
- Commercial dinner plates: from £2.50 per plate trade price, minimum order 12
- Table linen: from £4.99 per tablecloth, wide range of sizes and colours
- Chef's knife sets: professional grade stainless steel, sets from £45 trade
- Gastronorm containers: full range of sizes, stainless steel, dishwasher safe
- Bar tools cocktail sets: 7-piece professional sets from £29 trade
- Disposable takeaway boxes: bulk packs of 500, various sizes available

COMMUNICATION RULES:
- Speak clearly and at a measured pace
- Use British English
- Always confirm phone numbers digit by digit
- Always confirm email addresses character by character using NATO phonetic alphabet (Alpha, Bravo, Charlie...)
- Never end the call prematurely — stay patient
- If unsure about specific product details, tell customer the trade team will confirm exact specs
- For urgent orders, note the urgency

ENDING CALLS:
"Thank you for calling Hospitrade! I've noted your inquiry and our trade team will be in touch shortly. Have a wonderful day!"`;

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
      console.log("Twilio WebSocket connected");

      const keepAliveInterval = setInterval(() => {
        if (openAiWs && openAiWs.readyState === WebSocket.OPEN) {
          openAiWs.send(JSON.stringify({ type: "ping" }));
        }
      }, 30000);

      try {
        const tokenResponse = await fetch("https://api.openai.com/v1/realtime/sessions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${OPENAI_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "gpt-4o-realtime-preview-2024-12-17",
            voice: "shimmer",
          }),
        });

        if (!tokenResponse.ok) {
          throw new Error(`Failed to get token: ${tokenResponse.status}`);
        }

        const tokenData = await tokenResponse.json();
        const ephemeralKey = tokenData.client_secret?.value;
        if (!ephemeralKey) throw new Error("No ephemeral token received");

        const model = "gpt-4o-realtime-preview-2024-12-17";
        openAiWs = new WebSocket(`wss://api.openai.com/v1/realtime?model=${model}`, [
          "realtime",
          `openai-insecure-api-key.${ephemeralKey}`,
          "openai-beta.realtime-v1",
        ]);

        openAiWs.onopen = () => {
          console.log("Connected to OpenAI Realtime");
        };

        openAiWs.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);

            if (data.type === "session.created" && !sessionConfigured) {
              sessionConfigured = true;
              openAiWs?.send(JSON.stringify({
                type: "session.update",
                session: {
                  turn_detection: { type: "server_vad" },
                  input_audio_format: "g711_ulaw",
                  output_audio_format: "g711_ulaw",
                  voice: "shimmer",
                  instructions: HOSPITRADE_SYSTEM_PROMPT,
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

            if (data.type === "error") {
              console.error("OpenAI error:", data);
            }
          } catch (err) {
            console.error("Error processing OpenAI message:", err);
          }
        };

        openAiWs.onerror = (err) => console.error("OpenAI WS error:", err);
        openAiWs.onclose = () => {
          console.log("OpenAI WS closed");
          clearInterval(keepAliveInterval);
        };
      } catch (err) {
        console.error("Error connecting to OpenAI:", err);
        socket.close();
      }
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        switch (data.event) {
          case "start":
            streamSid = data.start.streamSid;
            break;
          case "media":
            if (openAiWs && openAiWs.readyState === WebSocket.OPEN) {
              openAiWs.send(JSON.stringify({
                type: "input_audio_buffer.append",
                audio: data.media.payload,
              }));
            }
            break;
          case "stop":
            openAiWs?.close();
            break;
        }
      } catch (err) {
        console.error("Error processing Twilio message:", err);
      }
    };

    socket.onclose = () => openAiWs?.close();
    socket.onerror = () => openAiWs?.close();

    return response;
  } catch (err) {
    console.error("Error in twilio-stream:", err);
    return new Response("Internal Server Error", { status: 500 });
  }
});
